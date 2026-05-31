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
    


# Request Detail API
class RequestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_request_for_user(self, request, request_id):
        tenant = request.tenant
        if _is_provider(request):
            return RequestRepository.get_by_id(request_id, tenant.id)
        elif _is_client(request):
            client =_get_client_profile(request)
            if not client:
                return None
            return RequestRepository.get_by_id_for_client(request_id, tenant.id, client.id)
        return None
    
    def get(self, request, request_id):
        req = self._get_request_for_user(request, request_id)

        if not req:
            return Response({"success": False, "message": "Request not found."}, status=404)
        
        return Response({"success": True, "data": RequestDetailSerializer(req).data})
    
    def patch(self, request, request_id):
        """Client edits their own request (title/description, only while received)."""

        if not _is_client(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)
        
        client = _get_client_profile(request)
        if not client:
            return Response({"success": False, "message": "Client profile not found."}, status=404)


        serializer = UpdateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            req = RequestService.edit_request(
                request_id=request_id,
                tenant=request.tenant,
                client_id=client.id,
                title=serializer.validated_data.get("title"),
                description=serializer.validated_data.get("description"),
            )
        except RequestNotFound as e:
            return Response({"success": False, "message": str(e)}, status=404)
        except RequestNotEditable as e:
            return Response({"success": False, "message": str(e)}, status=409)


        return Response({"success": True, "message": "Request updated.", "data": RequestDetailSerializer(req).data})


#Status update API - provider only

class RequestStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, request_id):
        if not _is_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)

        serializer = UpdateStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            req = RequestService.update_status(
                request_id=request_id,
                tenant=request.tenant,
                actor=request.user,
                new_status=serializer.validated_data["status"],
            )
        except RequestNotFound as e:
            return Response({"success": False, "message": str(e)}, status=404)
        except ForbiddenStatusTransition as e:
            return Response({"success": False, "message": str(e)}, status=409)

        return Response({
            "success": True,
            "message": f"Status updated to '{req.status}'.",
            "data": RequestDetailSerializer(req).data,
        })
    

# urgent flag API - provider only
class RequestFlagView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, request_id):
        if not _is_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)
        
        serializer = SetUrgentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            req = RequestService.set_urgent(
                request_id=request_id,
                tenant=request.tenant,
                actor=request.user,
                is_urgent=serializer.validated_data["is_urgent"],
            )
        except RequestNotFound as e:
            return Response({"success": False, "message": str(e)}, status=404)
 
        return Response({"success": True, "message": "Request flag updated.", "data": {"is_urgent": req.is_urgent}})


            

#Due Date API - provider

class RequestDueDateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, request_id):
        if not _is_provider(request):
            return Response({"success": False, "message": "Forbidden."}, status=403)
        
        serializer = SetDueDateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            req = RequestService.set_due_date(
                request_id=request_id,
                tenant=request.tenant,
                actor=request.user,
                due_date=serializer.validated_data["due_date"],
            )
        except RequestNotFound as e:
            return Response({"success": False, "message": str(e)}, status=404)
        
        return Response({"success": True, "message": "Due date updated.", "data": {"due_date": req.due_date}})
        