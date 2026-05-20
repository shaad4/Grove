from django.shortcuts import render
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from apps.users.models import User
from django.contrib.auth.models import update_last_login


from apps.users.utils import set_auth_cookies
from .serializers import (
    AddClientSerializer,
    AcceptInviteSerializer,
    ClientListSerializer,
)

from .services import (
    ClientService,
    ClientLimitExceeded,
    DuplicateClientEmail,
    InvalidInviteToken,
    ExpiredInviteToken,
)
from .repositories import ClientRepository, InviteRepository
from .tasks import send_client_invite_email


# Create your views here.


class ClientListCreateView(APIView):
    """
    GET  /clients/  — provider lists all their clients
    POST /clients/ — provider adds a new client(sends invite email)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "provider":
            return Response(
                {"success": False, "message": "Forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        clients = ClientRepository.get_all_for_tenant(request.tenant.id)
        serializer = ClientListSerializer(clients, many=True)

        return Response({
            "success": True,
            "data": {
                "clients": serializer.data,
                "total": clients.count(),
            }
        })
    

    def post(self, request):
        if request.user.role != "provider":
            return Response(
                {"success": False, "message": "Forbidden"},
                status=status.HTTP_403_FORBIDDEN,
            )
        
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return Response(
                {"success": False, "message": "Invalid workspace."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        serializer = AddClientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = ClientService.invite_client(
                tenant=request.tenant,
                provider=request.user,
                client_name=serializer.validated_data["client_name"],
                client_email=serializer.validated_data["client_email"],

            )
        except ClientLimitExceeded as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_403_FORBIDDEN,
            )
        except DuplicateClientEmail as e:
            return Response(
                {"success": False, "message": str(e)},
                status=status.HTTP_409_CONFLICT,
            )
        
        invite = result["invite"]
        client = result["client"]

        send_client_invite_email.delay(
            client_email=invite.client_email,
            client_name=invite.client_name,
            provider_name=request.user.display_name,
            tenant_slug=request.tenant.slug,
            invite_token=str(invite.token),
        )

        return Response(
            {
                "success": True,
                "message": f"Invite sent to {invite.client_email}.",
                "data": {
                    "client_id": str(client.id),
                    "email": invite.client_email,
                    "name": invite.client_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ValidateInviteTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get("token")

        if not token:
            return Response(
                    {"valid": False, "message": "Token is required."},
                    status=400,
                )
        
        invite = InviteRepository.get_pending_by_token(token)

        if not invite:
            return Response(
                {"valid": False, "message": "This invite link is invalid or has already been used."},
                status=400,
            )
        
        if invite.expires_at < timezone.now():
            return Response(
                {"valid": False, "message": "This invite link has expired. Ask your provider to resend it."},
                status=400,
            )
        
        return Response({
            "valid": True,
            "data": {
                "client_name": invite.client_name,
                "client_email": invite.client_email,
                "provider_name": invite.provider.display_name,
                "workspace_name": invite.tenant.name,
                "tenant_slug": invite.tenant.slug,
            }
        })
    

class AcceptInviteView(APIView):
    """
    POST /clients/invite/accept/
    Client sets their password and activates their account.
    Returns JWT so they're immediately logged in.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = ClientService.accept_invite(
                token=str(serializer.validated_data["token"]),
                password=serializer.validated_data["password"],
            )

        except InvalidInviteToken as e:
            return Response(
                {"success": False, "message": str(e)},
                status=400,
            )
        except ExpiredInviteToken as e:
            return Response(
                {"success": False, "message": str(e)},
                status=400,
            )
        

        user = result["user"]
        tenant = result["tenant"]

        refresh = RefreshToken.for_user(user)

        response = Response({
            "success": True,
            "message": "Account activated. Welcome to Grove!",
            "data": {
                "access": str(refresh.access_token),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "display_name": user.display_name,
                    "role": user.role,
                },
                "tenant": {
                    "slug": tenant.slug,
                    "name": tenant.name,
                },
            }
        }, status=status.HTTP_200_OK)

        set_auth_cookies(response, refresh, cookie_name=f"client_refresh_{tenant.slug}")

        return response
    

class ClientLoginView(APIView):
    """
    POST /clients/login/
    Subdomain-aware login for clients only.
    The tenant is resolved by TenantMiddleware from the subdomain.
    """
    
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").lower().strip()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"success": False, "message": "Email and password are required."},
                status=400,
            )
        
        tenant = getattr(request, "tenant", None)
        if not tenant:
            return Response(
                {"success": False, "message": "Invalid workspace."},
                status=400,
            )
        
        try:
            user = User.objects.get(
                email=email,
                tenant=tenant,
                role=User.Role.CLIENT,
            )
        except User.DoesNotExist:
            return Response(
                {"success": False, "message": "Invalid email or password."},
                status=400,
            )
        
        if not user.check_password(password):
            return Response(
                {"success": False, "message": "Invalid email or password."},
                status=400,
            ) 
        
        if not user.is_active:
            return Response(
                {"success": False, "message": "Your account is not active yet. Please check your invite email."},
                status=400,
            )
        
        if user.client_profile.is_deactivated:
            return Response(
                {"success": False, "message": "Your access has been deactivated. Contact your provider."},
                status=400,
            )
        
        update_last_login(None, user)

        refresh = RefreshToken.for_user(user)

        response = Response({
            "success": True,
            "access": str(refresh.access_token),
            "user": {
                "id": str(user.id),
                "email": user.email,
                "display_name": user.display_name,
                "role": user.role,
                "tenant_id": str(user.tenant_id),
            },
            "tenant": {
                "slug": tenant.slug,
                "name": tenant.name,
            }
        })

        set_auth_cookies(response, refresh, cookie_name=f"client_refresh_{tenant.slug}")

        return response
        


        





        
