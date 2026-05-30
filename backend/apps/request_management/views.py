from django.shortcuts import render
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
# Create your views here.

from apps.tenants.models import TenantMembership
from apps.clients.models import Client

from .repositories import (
    RequestRepository,
    RequestActivityRepository,
    InternalNoteRepository,
    DeliveryRepository,
    FileRepository,
)
from .serializers import (
    CreateRequestSerializer,
    UpdateRequestSerializer,
    UpdateStatusSerializer,
    SetUrgentSerializer,
    SetDueDateSerializer,
    AddNoteSerializer,
    CreateDeliverySerializer,
    PresignedUploadSerializer,
    ConfirmUploadSerializer,
    RequestListSerializer,
    RequestDetailSerializer,
    RequestActivitySerializer,
    InternalNoteSerializer,
    DeliverySerializer,
    FileSerializer,
)
from .services import (
    RequestService,
    FileService,
    RequestNotFound,
    RequestLimitExceeded,
    ForbiddenStatusTransition,
    RequestNotEditable,
    S3PresignError,
)


def _is_provider(request):
    m = getattr(request, "tenant_membership", None)
    return m is not None and m.role == TenantMembership.Role.PROVIDER

def _is_client(request):
    m = getattr(request, "tenant_membership", None)
    return m is not None and m.role == TenantMembership.Role.CLIENT

def _get_client_profile(request):
    """Return the Client row for the current user in this tenant, or None"""
    try:
        return Client.objects.get(
            user=request.user,
            tenant=request.tenant,
            is_deleted=False,
        )
    except Client.DoesNotExist:
        return None



#request list + create API
class RequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = request.tenant

        # Build filter dict from query params
        filters = {
            "client_id": request.query_params.get("client_id"),
            "status": request.query_params.get("status"),
            "is_urgent": request.query_params.get("is_urgent"),
            "ai_category": request.query_params.get("ai_category"),
            "date_from": request.query_params.get("date_from"),
            "date_to": request.query_params.get("date_to"),
            "sort": request.query_params.get("sort", "newest"),
        }

        if filters["is_urgent"] == "true":
            filters["is_urgent"] = True
        elif filters["is_urgent"] == "false":
            filters["is_urgent"] = False
        else:
            filters["is_urgent"] = None

        filters = {k: v for k, v in filters.items() if v is not None}

        if _is_provider(request):
            qs = RequestRepository.get_all_for_provider(tenant.id, filters)

        elif _is_client(request):
            client =_get_client_profile(request)
            if not client:
                return Response({"success": False, "message": "Client profile not found."}, status=404)
            
            qs = RequestRepository.get_all_for_client(tenant.id, client.id, filters)

        else:
            return Response({"success": False, "message": "Forbidden."}, status=403)


        serializer = RequestListSerializer(qs, many=True)
        return Response({
            "success": True,
            "data": {
                "requests": serializer.data,
                "total":  qs.count(),
            },
        })


    def post(self, request):
        """Only clients can submit requests"""

        if not _is_client(request):
            return Response({"success": False, "message": "Only clients can submit requests."}, status=403)

        client = _get_client_profile(request)
        if not client:
            return Response({"success": False, "message": "Client profile not found."}, status=404)

        if client.is_deactivated:
            return Response({"success": False, "message": "Your access has been deactivated."}, status=403)
        
        serializer = CreateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            req = RequestService.create_request(
                tenant=request.tenant,
                client=client,
                provider=client.provider,
                title=serializer.validated_data["title"],
                description=serializer.validated_data["description"],
            )
        except RequestLimitExceeded as e:
            return Response({
                "success": False,
                "error_type": "limit_reached",
                "message": str(e),
            }, status=403)
        

        return Response({
            "success": True,
            "message": "Request submitted.",
            "data": RequestDetailSerializer(req).data,
        }, status=status.HTTP_201_CREATED)