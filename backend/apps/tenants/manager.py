from django.db import models

_current_tenant = None


def set_current_tenant(tenant):
    global _current_tenant
    _current_tenant = tenant

def get_current_tenant():
    return _current_tenant


class TenantManager(models.Manager):
    """
    Auto-scopes every queryset to the currently active tenant.
    Falls back to unfiltered if no tenant is set (e.g. in admin or
    management commands).
    """

    def get_queryset(self):
        qs = super().get_queryset()
        tenant = get_current_tenant()

        if tenant is not None:
            return qs.filter(tenant=tenant)
        return qs
    

    def unscoped(self):
        """Escape hatch — returns the raw unfiltered queryset."""
        return super().get_queryset()


