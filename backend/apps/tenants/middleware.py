from django.http import Http404
from .models import Tenant
from .manager import set_current_tenant



class TenantMiddleware:
    """
    Resolves the tenant from the request subdomain and sets it as
    the current tenant for the duration of the request.

    Expected host format: {slug}.yourdomain.com
    Falls through for the grove-admin and root domain (no tenant).
    """

    EXEMPT_PATHS = ("/grove-admin/",)
    ROOT_DOMAIN = "yourdomain.com"  #change this later

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        tenant = self._resolve_tenant(request)
        set_current_tenant(tenant)

        try:
            response = self.get_response(request)
        finally:
            set_current_tenant(None)

        return response
    

    def _resolve_tenant(self, request):
        for path in self.EXEMPT_PATHS:
            if request.path.startswith(path):
                return None
            


        host = request.get_host().split(":")[0]

        if host == self.ROOT_DOMAIN or not host.endswith(f".{self.ROOT_DOMAIN}"):
            return None
        
        slug = host.replace(f".{self.ROOT_DOMAIN}", "")

        try:
            return Tenant.objects.get(slug=slug)
        except Tenant.DoesNotExist:
            raise Http404(f"No tenant found for slug: {slug}")