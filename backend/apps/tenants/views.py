from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Tenant

# Create your views here.

class ValidateTenantView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        slug = request.query_params.get("slug")
        if not slug:
            return Response({"valid" : False}, status=400)
        exists = Tenant.objects.filter(slug=slug, is_active=True).exists()
        return Response({"valid" : exists})