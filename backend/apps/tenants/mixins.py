from django.db import models
from .manager import TenantManager


class TenantScopedModel(models.Model):
    """
    Abstract base class for every model that belongs to a tenant.

    Adds:
        - tenant FK (non-nullable, protected delete)
        - TenantManager as default manager (auto-filters by current tenant)
        - objects_unscoped manager for cross-tenant queries (Grove Admin, etc.)
    """

    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.PROTECT,
        related_name="%(app_label)s_%(class)s_set",
        db_index = True,
    )

    # Auto-scoped manager — this is what model.objects.all() uses
    objects = TenantManager()

    # Escape hatch for grove-admin / management commands
    objects_unscoped = models.Manager()