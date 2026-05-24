from apps.tenants.models import Tenant, TenantMembership
from django.http import JsonResponse

EXCLUDED_SUBDOMAINS = {"api", "www", "admin"}


class TenantMiddleware:
    """
    Resolves the current tenant from the request subdomain and attaches it
    to request.tenant
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host  = request.get_host().split(":")[0]
        parts = host.split(".")

        is_subdomain = (
            (len(parts) == 3) or
            (len(parts) == 2 and parts[1] == "localhost")
        )

        request.tenant = None

        if is_subdomain and parts[0] not in EXCLUDED_SUBDOMAINS:
            slug = parts[0]
            try:
                request.tenant = Tenant.objects.get(slug=slug, is_active=True)
            except Tenant.DoesNotExist:
                request.tenant = None

        if request.tenant is None:
            slug = request.headers.get("X-Tenant-Slug")
            if slug and slug not in EXCLUDED_SUBDOMAINS:
                try:
                    request.tenant = Tenant.objects.get(slug=slug, is_active=True)
                except Tenant.DoesNotExist:
                    request.tenant = None

        request.tenant_membership = None

        if (
            request.tenant is not None
            and hasattr(request, "user")
            and request.user.is_authenticated
            and not request.user.is_superuser
        ):
            membership = (
                TenantMembership.objects
                .filter(
                    user=request.user,
                    tenant=request.tenant,
                    is_active=True,
                )
                .first()
            )

            if membership is None:
                return JsonResponse(
                    {"success": False, "message": "You do not have access to this workspace."},
                    status=403,
                )
            request.tenant_membership = membership

        return self.get_response(request)