import uuid
from django.contrib.auth.models import update_last_login
from django.utils import timezone
 
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
 
from apps.notifications.tasks import send_verification_email, send_password_reset_email
from apps.tenants.models import TenantMembership, Tenant
 
from .models import User
from .repositories import UserRepository
from .serializers import (
    ProviderSignupSerializer,
    WorkspaceSetupSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    GoogleAuthSerializer,
)
from .services import (
    ProviderSignupService,
    ProviderLoginService,
    PasswordResetService,
    InvalidOrExpiredToken,
    NoProviderMembership,
)
from .utils import set_auth_cookies
 

#Helpers
def _build_user_payload(user, membership):
    """
    Build the standard user object returned in every auth response
    """

    payload = {
        "id" : str(user.id),
        "email": user.email,
        "display_name": user.display_name,
    }
    if membership:
        payload["role"] = membership.role

    return payload


def _build_tenant_payload(tenant):
    if tenant is None:
       return None
    return {
        "id" : str(tenant.id),
        "name" : tenant.name,
        "slug" : tenant.slug,
    } 


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = getattr(request, "tenant", None)
 
        if tenant:
            refresh_token = (
                request.COOKIES.get(f"client_refresh_{tenant.slug}") or
                request.COOKIES.get(f"provider_refresh_{tenant.slug}")
            )
        else:
            slug_hint = request.data.get("slug")
            if slug_hint:
                try:
                    t = Tenant.objects.get(slug=slug_hint, is_active=True)
                    refresh_token = (
                        request.COOKIES.get(f"client_refresh_{t.slug}") or
                        request.COOKIES.get(f"provider_refresh_{t.slug}")
                    )
                except Tenant.DoesNotExist:
                    refresh_token = None
            else:
                refresh_token = request.COOKIES.get("refresh_token")
 
        if not refresh_token:
            return Response(
                {"success": False, "message": "No refresh token found."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
 
        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)
            return Response({"success": True, "access": access_token})
        except Exception:
            return Response(
                {"success": False, "message": "Invalid or expired session."},
                status=status.HTTP_401_UNAUTHORIZED,
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

        result = ProviderSignupService.register(**serializer.validated_data)

        send_verification_email.delay(
            user_email = result["user"].email,
            display_name = result["user"].display_name,
            token = str(result["verification_token"].token),
        )


        return Response(
            {
                "success": True,
                "message": "Verification email sent.",
                "data": {
                    "email": result["user"].email,
                    "requires_verification": True,
                },
            },
            status=status.HTTP_201_CREATED,
        )
    
    



class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        raw = request.data.get("token")

        if not raw:
            return Response({"success": False, "message": "Token required."}, status=400)
        


        try:
            token_value = uuid.UUID(raw)
        except ValueError:
            return Response(
                {"success": False, "message": "Invalid token format"},
                status=400
            )


        try:
            result = ProviderSignupService.verify_email(token_value=token_value)
        except InvalidOrExpiredToken as e:
            return Response({"success": False, "message": str(e)}, status=400)


        user = result["user"]

        refresh = RefreshToken.for_user(user)



        response = Response({
            "success": True,
            "message": "Email verified. Please set up your workspace.",
            "data": {
                "access": str(refresh.access_token),
                "user":   _build_user_payload(user, membership=None),
                "tenant": None,
                "needs_workspace": True,
            },
        })

        set_auth_cookies(response, refresh)

        return response
        



class WorkspaceSetupAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WorkspaceSetupSerializer(data = request.data)

        serializer.is_valid(raise_exception=True)

        user = request.user

        already_provider = TenantMembership.objects.filter(
            user = user,
            role = TenantMembership.Role.PROVIDER,
        ).exists()

        if already_provider:
            return Response(
                {"success": False, "message": "Workspace already exists."},
                status=400,
            )
        
        result = ProviderSignupService.setup_workspace(
            user=user,
            buisness_name=serializer.validated_data["business_name"],
            slug = serializer.validated_data["slug"]
        )

        tenant = result["tenant"]
        membership = result["membership"]

        refresh = RefreshToken.for_user(user)

        response = Response({
            "success": True,
            "message": "Workspace created successfully.",
            "data": {
                "access":     str(refresh.access_token),
                "user":       _build_user_payload(user, membership),
                "tenant":     _build_tenant_payload(tenant),
            },
        })

        set_auth_cookies(response, refresh, cookie_name=f"provider_refresh_{tenant.slug}")

        return response



class CheckSlugAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug", "").lower().strip()

        if not slug:
            return Response(
                {
                    "available": False,
                    "message": "Slug is required"
                },
                status=400
            )

        exists = Tenant.objects.filter(
            slug=slug
        ).exists()

        return Response({
            "available": not exists
        })
    


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data = request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']

        tenant = getattr(request, "tenant", None)

        try:
            membership = ProviderLoginService.resolve_provider_membership(
                user=user, tenant=tenant
            )

        except NoProviderMembership:
            return Response(
                {"success": False, "message": "No provider account found for this workspace."},
                status=400,
            )


        update_last_login(None, user)

        refresh = RefreshToken.for_user(user)

        response = Response({
            "success": True,
            "access":  str(refresh.access_token),
            "user":    _build_user_payload(user, membership),
            "tenant":  _build_tenant_payload(tenant),
        })

        cookie_name = f"provider_refresh_{tenant.slug}" if tenant else "refresh_token"
        set_auth_cookies(response, refresh,  cookie_name=cookie_name )

        return response
    


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = PasswordResetService.request_reset(email=serializer.validated_data["email"])

        if result:
            send_password_reset_email.delay(
                user_email=result["user"].email,
                display_name=result["user"].display_name,
                token=str(result["reset_token"].token),
            )

        return Response({
            "success": True,
            "message": "If this email is registered, a reset link has been sent.",
        })
    


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data = request.data)
        serializer.is_valid(raise_exception=True)

        try:
            PasswordResetService.confirm_reset(
                token_value=serializer.validated_data["token"],
                new_password=serializer.validated_data["password"],
            )
        except InvalidOrExpiredToken as e:
            return Response({"success": False, "message": str(e)}, status=400)
 
        return Response({"success": True, "message": "Password reset successfully."})
    


class MeView(APIView):
    """
    Returns the current user + their membership in the active tenant
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        user       = request.user
        membership = getattr(request, "tenant_membership", None)
        tenant     = getattr(request, "tenant", None)


        if membership is None and tenant is None:
            membership = TenantMembership.objects.filter(
                user=user,
                role=TenantMembership.Role.PROVIDER,
            ).select_related("tenant").first()
            if membership:
                tenant = membership.tenant
 
        return Response({
            "user":   _build_user_payload(user, membership),
            "tenant": _build_tenant_payload(tenant),
        })
        


class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)

        if tenant:
            refresh_token = (
                request.COOKIES.get(f"client_refresh_{tenant.slug}") or
                request.COOKIES.get(f"provider_refresh_{tenant.slug}")
            )
        else:
            refresh_token = request.COOKIES.get("refresh_token")



        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
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

        existing = UserRepository.get_by_email(email)
 
        if existing:
            if not existing.is_active:
                return Response(
                    {"success": False, "message": "This account has been deactivated."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            user = existing

            if not user.is_email_verified:
                user.is_email_verified = True
                user.is_active         = True
            if not user.avatar_url and google_data.get("avatar_url"):
                user.avatar_url = google_data["avatar_url"]
            user.save()
        else:
            user = User(
                email=email,
                display_name=google_data["display_name"],
                avatar_url=google_data.get("avatar_url"),
                is_active=True,
                is_email_verified=True,
            )
            user.set_unusable_password()
            user.save()
 
        update_last_login(None, user)
        refresh = RefreshToken.for_user(user)
 
        # Check if this user has a provider workspace yet
        provider_membership = TenantMembership.objects.filter(
            user=user,
            role=TenantMembership.Role.PROVIDER,
        ).select_related("tenant").first()
 
        needs_workspace = provider_membership is None
        tenant = provider_membership.tenant if provider_membership else None
 
        response = Response({
            "success":        True,
            "access":         str(refresh.access_token),
            "needs_workspace": needs_workspace,
            "user":           _build_user_payload(user, provider_membership),
            "tenant":         _build_tenant_payload(tenant),
        })
 
        cookie_name = f"provider_refresh_{tenant.slug}" if tenant else "refresh_token"
        set_auth_cookies(response, refresh, cookie_name=cookie_name)
        return response
 