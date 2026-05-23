from django.db import models
import uuid

# Create your models here.


class Plan(models.Model):
    """
    Subscription plan. Seeded via data migration (free + pro).
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length = 50, unique= True)
    client_limit = models.IntegerField(default = 3)
    request_limit = models.IntegerField(default=10)
    price_monthly = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    

    class Meta:
        db_table = "plans"
        indexes = [models.Index(fields=["name"], name="idx_plans_name")]

    def __str__(self):
        return str(self.name)


class Tenant(models.Model):
    """
    One tenant = one service provider's workspace.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="tenants")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=63, unique=True)
    logo_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_suspended = models.BooleanField(default=False)
    white_label_enabled = models.BooleanField(default=False)
    custom_status_labels = models.JSONField(null=True, blank=True)
    client_limit_override = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self) -> str:
        return str(f"{self.name} ({self.slug})")

    class Meta:
        db_table = "tenants"
        indexes = [
            models.Index(fields=["slug"], name="idx_tenants_slug"),
            models.Index(fields=["plan"], name="idx_tenants_plan_id"),
            models.Index(fields=["is_active"], name="idx_tenants_is_active"),
        ]

    @property
    def effective_client_limit(self):
        if self.client_limit_override is not None:
            return self.client_limit_override
        return self.plan.client_limit

    @property
    def effective_request_limit(self):
        return self.plan.request_limit


class TenantUsage(models.Model):
    """
    Denormalized counters — updated via signals/tasks, never queried live.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name="usage")
    client_count = models.IntegerField(default=0)
    active_request_count = models.IntegerField(default=0)
    total_requests_lifetime = models.IntegerField(default=0)
    total_delivered_lifetime = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenant_usage"
        indexes = [
            models.Index(fields=["tenant"], name="idx_tenant_usage_tenant_id"),
        ]

    def __str__(self):
        return f"Usage for {self.tenant.slug}"