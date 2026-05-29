import uuid
from django.db import models
from apps.tenants.models import Tenant
from apps.clients.models import Client
from apps.users.models import User
# Create your models here.


class Request(models.Model):

    class Status(models.TextChoices):
        RECEIVED = "received", "Received"
        IN_REVIEW = "in_review", "In Review"
        IN_PROGRESS = "in_progress","In Progress"
        DELIVERED = "delivered", "Delivered"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="requests")
    client = models.ForeignKey(Client,on_delete=models.CASCADE, related_name="requests")
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name="handled_requests")

    title = models.CharField(max_length=100)
    description = models.TextField()
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.RECEIVED)

    #AI Fields (Latter)
    ai_summary = models.TextField(null=True, blank=True)
    ai_category = models.CharField(max_length=50, null=True, blank=True)

    is_urgent = models.BooleanField(default=False)
    due_date = models.DateField(null=True, blank=True)

    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add = True)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        db_table = "requests"
        indexes = [
            models.Index(fields=["tenant"],               name="idx_requests_tenant_id"),
            models.Index(fields=["client"],               name="idx_requests_client_id"),
            models.Index(fields=["provider"],             name="idx_requests_provider_id"),
            models.Index(fields=["status"],               name="idx_requests_status"),
            models.Index(fields=["tenant", "status"],     name="idx_requests_tenant_status"),
            models.Index(fields=["tenant", "client", "status"], name="idx_requests_tcs"),
            models.Index(fields=["is_deleted"],           name="idx_requests_deleted"),
            models.Index(fields=["created_at"],           name="idx_requests_created_at"),
            models.Index(fields=["due_date"],             name="idx_requests_due_date"),
            models.Index(fields=["ai_category"],          name="idx_requests_ai_category"),
        ]
 
    def __str__(self):
        return f"[{self.status}] {self.title[:60]}"

