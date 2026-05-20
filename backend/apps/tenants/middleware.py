from apps.tenants.models import Tenant
from django.http import JsonResponse

EXCLUDED_SUBDOMAINS = {"api", "www", "admin"}

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]
        parts = host.split('.')

        is_subdomain = (
            (len(parts) == 3) or
            (len(parts) == 2 and parts[1] == 'localhost')
        )

        if is_subdomain and parts[0] not in EXCLUDED_SUBDOMAINS:
            slug = parts[0]
            try:
                request.tenant = Tenant.objects.get(slug=slug, is_active=True)
            except Tenant.DoesNotExist:
                request.tenant = None
        else:
            request.tenant = None

        # Header fallback (when tenant couldn't be resolved from subdomain)
        if request.tenant is None:
            slug = request.headers.get("X-Tenant-Slug")
            if slug and slug not in EXCLUDED_SUBDOMAINS:
                try:
                    request.tenant = Tenant.objects.get(slug=slug, is_active=True)
                except Tenant.DoesNotExist:
                    request.tenant = None

        if (
            request.tenant is not None and
            hasattr(request, 'user') and
            request.user.is_authenticated and
            not request.user.is_superuser
        ):
            if request.user.tenant_id != request.tenant.id:
                return JsonResponse(
                    {'success': False, 'message': 'Forbidden'},
                    status=403
                )

        return self.get_response(request)