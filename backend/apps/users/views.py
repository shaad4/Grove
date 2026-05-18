from django.shortcuts import render
from .models import EmailVerificationToken, PasswordResetToken, User
import uuid

# Create your views here.

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.notifications.tasks import send_verification_email, send_password_reset_email
from .serializers import ProviderSignupSerializer, WorkspaceSetupSerializer, LoginSerializer, ForgetPasswordSerializer, ResetPasswordSerializer
from apps.tenants.models import Tenant,Plan,TenantUsage
from django.contrib.auth.models import update_last_login


from django.utils import timezone


def _get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)

    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


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

        tokens = _get_tokens_for_user(user)

        return Response({
            "success": True,
            "message": "Email verified successfully",
            "data": {
                "tokens": tokens,
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "display_name": user.display_name,
                    "role": user.role,
                }
            }
        })
    



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

        tokens = _get_tokens_for_user(user)


        return Response({
            "success": True,
            "message": "Workspace created successfully",
            "data": {
                "tokens": tokens,
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

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': str(user.id),
                'email': user.email,
                'display_name': user.display_name,
                'role': user.role,
                'tenant_id': str(user.tenant_id) if user.tenant_id else None,
            }
        }, status=status.HTTP_200_OK)
    


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