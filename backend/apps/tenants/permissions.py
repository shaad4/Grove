from rest_framework.permissions import BasePermission

class BelongsToTenant(BasePermission):
    """
    Ensures the authenticated user belongs to the tenant
    resolved from the subdomain. Prevents cross-tenant access.
    """
    message = "You do not have access to this workspace."

    def has_permission(self, request, view):
        tenant = getattr(request, 'tenant', None)

        if not tenant:
            return True  # no tenant context, let view decide

        if not request.user or not request.user.is_authenticated:
            return True  # unauthenticated, let auth handle it

        if request.user.is_superuser:
            return True  # grove admin, allow all

        return request.user.tenant_id == tenant.id