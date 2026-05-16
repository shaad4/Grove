from django.shortcuts import render
from .models import EmailVerificationToken
import uuid

# Create your views here.

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from apps.tenants.models import Tenant


from apps.notifications.tasks import send_verification_email
from .serializers import ProviderSignupSerializer

from django.utils import timezone

def _get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "access" : str(refresh.access_token),
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
        tenant = result["tenant"]
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
    


class CheckSlugAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")

        if not slug:
            return Response({
                "available": False,
                "message": "Slug is required"
            }, status=400)

        exists = Tenant.objects.filter(slug=slug).exists()

        return Response({
            "available": not exists
        })
    


import uuid

class VerifyEmailAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("token")

        print("RAW TOKEN:", token)
        print("TOKEN TYPE:", type(token))

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

        print("SEARCHING TOKEN...")

        try:
            verification_token = EmailVerificationToken.objects.get(
                token=token,
                status=EmailVerificationToken.Status.PENDING
            )

            print("TOKEN FOUND:", verification_token)

        except EmailVerificationToken.DoesNotExist:
        
            print("TOKEN NOT FOUND IN DB")
        
            return Response(
                {"success": False, "message": "Invalid token"},
                status=400
            )

        if verification_token.expires_at < timezone.now():
            verification_token.status = EmailVerificationToken.Status.EXPIRED
            verification_token.save()

            return Response(
                {"success": False, "message": "Token expired"},
                status=400
            )

        user = verification_token.user

        user.is_active = True
        user.is_email_verified = True
        user.save()

        print(
            EmailVerificationToken.objects.values(
                "token",
                "status"
            )
        )
        
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