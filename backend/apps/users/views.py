from django.shortcuts import render
from .models import EmailVerificationToken, PasswordResetToken, User
import uuid

# Create your views here.

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.notifications.tasks import send_verification_email, send_password_reset_email
from .serializers import ProviderSignupSerializer, WorkspaceSetupSerializer, LoginSerializer, ForgetPasswordSerializer, ResetPasswordSerializer, GoogleAuthSerializer
from apps.tenants.models import Tenant,Plan,TenantUsage
from django.contrib.auth.models import update_last_login


from .utils import set_auth_cookies
from django.utils import timezone


# def _get_tokens_for_user(user):
#     refresh = RefreshToken.for_user(user)

#     return {
#         "access": str(refresh.access_token),
#         "refresh": str(refresh),
#     }

class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        # Try tenant from middleware (subdomain resolution) first
        tenant = getattr(request, 'tenant', None)
        
        # Fallback: slug hint from request body
        slug_hint = request.data.get('slug')
        if not tenant and slug_hint:
            try:
                from apps.tenants.models import Tenant
                tenant = Tenant.objects.get(slug=slug_hint, is_active=True)
            except Tenant.DoesNotExist:
                pass

        if tenant:
            refresh_token = (
                request.COOKIES.get(f"client_refresh_{tenant.slug}") or
                request.COOKIES.get(f"provider_refresh_{tenant.slug}")
            )
        else:
            refresh_token = request.COOKIES.get("refresh_token")

        if not refresh_token:
            return Response(
                {"success": False, "message": "No refresh token found."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            
            # Set updated cookie if rotation is on
            response = Response({"success": True, "access": access_token})
            return response

        except Exception:
            return Response(
                {"success": False, "message": "Invalid refresh token."},
                status=status.HTTP_401_UNAUTHORIZED
            )

class ProviderSignupView(APIView):
    """
    POST /api/auth/register/
    Creates a tenant + provider user in one atomic transaction.
    """

    permission_classes = [AllowAny]
    # throttle_classes = "signup"

    def post(self, request):
        serializer = ProviderSignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = serializer.save()

        user = result["user"]
        verification_token = result["verification_token"]


        send_verification_email.delay(
            user_email = user.email,
            display_name = user.display_name,
            token = str(verification_token.token),
        )


        return Response(
            {
                "success": True,
                "message": "Verification email sent.",
                "data": {
                    "email": user.email,
                    "requires_verification": True,
                },
            },
            status=status.HTTP_201_CREATED,
        )
    
    



class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")


        if not token:
            return Response(
                {"success": False, "message": "Token required"},
                status=400
            )

        # Convert string -> UUID
        try:
            token = uuid.UUID(token)
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid token format"},
                status=400
            )


        try:
            verification_token = EmailVerificationToken.objects.get(
                token=token,
                status=EmailVerificationToken.Status.PENDING
            )


        except EmailVerificationToken.DoesNotExist:
        
        
            return Response(
                {"success": False, "message": "Invalid token"},
                status=400
            )
        if verification_token.expires_at < timezone.now():

            verification_token.status = (
                EmailVerificationToken.Status.EXPIRED
            )

            verification_token.save()

            return Response(
                {
                    "success": False,
                    "message": "Token expired"
                },
                status=400
            )

        user = verification_token.user

        user.is_active = True
        user.is_email_verified = True
        user.save()

        
        # expire OTHER tokens only
        EmailVerificationToken.objects.filter(
            user=user,
            status=EmailVerificationToken.Status.PENDING
        ).exclude(
            id=verification_token.id
        ).update(
            status=EmailVerificationToken.Status.EXPIRED
        )

        verification_token.status = EmailVerificationToken.Status.USED
        verification_token.used_at = timezone.now()
        verification_token.save()

        refresh = RefreshToken.for_user(user)

        response = Response({
            "success": True,
            "message": "Email verified successfully",
            "data": {
                "access": str(refresh.access_token),

                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "display_name": user.display_name,
                    "role": user.role,
                },

                "tenant": {
                    "slug": user.tenant.slug if user.tenant else None,
                }
            }
        })

        set_auth_cookies(response, refresh)

        return response
        



class WorkspaceSetupAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WorkspaceSetupSerializer(data = request.data)

        serializer.is_valid(raise_exception=True)

        user = request.user

        if user.tenant:
            return Response(
                {
                    "success": False,
                    "message": "Workspace already exists."
                },
                status=400
            )
        
        free_plan = Plan.objects.get(name="free")

        tenant = Tenant.objects.create(
            plan=free_plan,
            name=serializer.validated_data["business_name"],
            slug=serializer.validated_data["slug"],
        )

        TenantUsage.objects.create(
            tenant=tenant
        )

        user.tenant = tenant
        user.save()

        refresh = RefreshToken.for_user(user)

        response = Response({
            "success": True,
            "message": "Workspace created successfully",
            "data": {

                "access": str(refresh.access_token),

                "tenant": {
                    "id": str(tenant.id),
                    "name": tenant.name,
                    "slug": tenant.slug,
                },

                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "display_name": user.display_name,
                }
            }
        })

        set_auth_cookies(response, refresh, cookie_name=f"provider_refresh_{tenant.slug}")

        return response



class CheckSlugAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")

        if not slug:
            return Response(
                {
                    "available": False,
                    "message": "Slug is required"
                },
                status=400
            )

        slug = slug.lower().strip()

        exists = Tenant.objects.filter(
            slug=slug
        ).exists()

        return Response({
            "available": not exists
        })
    


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(
            data = request.data,
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user =serializer.validated_data['user']

        update_last_login(None, user)

        refresh = RefreshToken.for_user(user)

        response = Response({
            'access': str(refresh.access_token),

            'user': {
                'id': str(user.id),
                'email': user.email,
                'display_name': user.display_name,
                'role': user.role,
                'tenant_id': str(user.tenant_id) if user.tenant_id else None,
            },

            'tenant': {
                'slug': user.tenant.slug if user.tenant else None,
            }
        }, status=status.HTTP_200_OK)

        set_auth_cookies(response, refresh,  cookie_name=f"provider_refresh_{user.tenant.slug}" if user.tenant else "refresh_token")

        return response
    


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']

        try:
            user = User.objects.get(
                email=email,
                is_active=True,
                role='provider'
            )
        except User.DoesNotExist:
            return Response({
                'success' : True,
                'message' : "If this email is registered, a reset link has been sent."
            })

        PasswordResetToken.objects.filter(
            user=user,
            status=PasswordResetToken.Status.PENDING
        ).update(status=PasswordResetToken.Status.EXPIRED)


        reset_token = PasswordResetToken.objects.create(
            user=user,
            expires_at=timezone.now() + timezone.timedelta(minutes=30)
        )

        send_password_reset_email.delay(
            user_email=user.email,
            display_name = user.display_name,
            token = str(reset_token.token),
        )

        return Response({
            'success' : True,
            'message' : 'If this email is registered, a reset link has been sent.'
        })
    


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        token_value = serializer.validated_data['token']
        new_password = serializer.validated_data['password']

        try:
            reset_token = PasswordResetToken.objects.select_related('user').get(
                token=token_value,
                status=PasswordResetToken.Status.PENDING
            )
        except PasswordResetToken.DoesNotExist:
            return Response(
                {'success': False, 'message': 'Invalid or expired reset link.'},
                status=400
            )

        if reset_token.expires_at < timezone.now():
            reset_token.status = PasswordResetToken.Status.EXPIRED
            reset_token.save()
            return Response(
                {'success': False, 'message': 'Reset link has expired. Please request a new one.'},
                status=400
            )
        
        user = reset_token.user
        user.set_password(new_password)
        user.save()

        reset_token.status = PasswordResetToken.Status.USED
        reset_token.used_at = timezone.now()
        reset_token.save()

        return Response({
            'success' : True,
            'message' : "Password reset successfully."
        })
    


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        user = request.user

        return Response({
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": user.display_name,
                "role": user.role,
            },

            "tenant": user.tenant and {
                "slug": user.tenant.slug,
            } or None
        })
        


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)

        if tenant:
            client_cookie = f"client_refresh_{tenant.slug}"
            provider_cookie = f"provider_refresh_{tenant.slug}"
            
            refresh_token = (
                request.COOKIES.get(client_cookie) or
                request.COOKIES.get(provider_cookie)
            )
        else:
            client_cookie = None
            provider_cookie = None
            refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass

        response = Response({"success": True, "message": "Logged Out."})
        
        if tenant:
            response.delete_cookie(f"client_refresh_{tenant.slug}", domain=".lvh.me", path="/")
            response.delete_cookie(f"provider_refresh_{tenant.slug}", domain=".lvh.me", path="/")
        else:
            response.delete_cookie("refresh_token", domain=".lvh.me", path="/")

        return response
    

class GoogleAuthView(APIView):
    permission_classes = [AllowAny]
 
    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
 
        google_data = serializer.validated_data['access_token'] 
        email = google_data['email']
 
        existing = User.objects.filter(
            email=email,
            role=User.Role.PROVIDER,
        ).first()
 
        if existing:
            if not existing.is_active:
                return Response(
                    {'success': False, 'message': 'This account has been deactivated.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            user = existing
            if not user.is_email_verified:
                user.is_email_verified = True
                user.is_active = True
            if not user.avatar_url and google_data['avatar_url']:
                user.avatar_url = google_data['avatar_url']
            user.save()
        else:
            user = User(
                email=email,
                role=User.Role.PROVIDER,
                display_name=google_data['display_name'],
                avatar_url=google_data['avatar_url'],
                is_active=True,
                is_email_verified=True,
            )
            user.set_unusable_password()
            user.save()
 
        update_last_login(None, user)
        refresh = RefreshToken.for_user(user)
 
        needs_workspace = user.tenant_id is None
 
        response = Response({
            'success': True,
            'access': str(refresh.access_token),
            'needs_workspace': needs_workspace,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'display_name': user.display_name,
                'role': user.role,
                'tenant_id': str(user.tenant_id) if user.tenant_id else None,
            },
            'tenant': {
                'slug': user.tenant.slug if user.tenant else None,
            },
        }, status=status.HTTP_200_OK)
 
        cookie_name = (
            f'provider_refresh_{user.tenant.slug}'
            if user.tenant
            else 'refresh_token'
        )
        set_auth_cookies(response, refresh, cookie_name=cookie_name)
 
        return response
 