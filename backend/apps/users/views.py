from django.shortcuts import render

# Create your views here.

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from notifications.tasks import send_verification_email
from .serializers import ProviderSignupSerializer


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
    throttle_classes = "signup"

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

        tokens = _get_tokens_for_user(user)

        return Response(
             {
                "success": True,
                "message": "Account created. Please check your email to verify.",
                "data": {
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "display_name": user.display_name,
                        "role": user.role,
                        "is_email_verified": user.is_email_verified,
                    },
                    "tenant": {
                        "id": str(tenant.id),
                        "name": tenant.name,
                        "slug": tenant.slug,
                    },
                    "tokens": tokens,
                },
            },
            status=status.HTTP_201_CREATED,
        )
