from apps.tenants.models import Tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(':')[0]  # strip port for local dev

        parts = host.split('.')

        # Expect: <slug>.grove.co  → 3 parts
        # Local:  <slug>.localhost  → 2 parts  
        # Main:   grove.co          → 2 parts (no subdomain)
        
        is_subdomain = (
            (len(parts) == 3) or 
            (len(parts) == 2 and parts[1] == 'localhost')
        )
        if is_subdomain:
            slug = parts[0]
            try:
                request.tenant = Tenant.objects.get(slug=slug, is_active=True)
            except Tenant.DoesNotExist:
                request.tenant = None
        
        else:
            request.tenant = None # main domain — provider auth, grove admin

        return self.get_response(request)