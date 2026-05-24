from django.utils import timezone
from .models import Client, Invite
from apps.tenants.models import Tenant


class ClientRepository:

    @staticmethod
    def get_all_for_tenant(tenant_id):
        """Active, non-deleted clients for a tenant. Includes related user data."""
        return (
            Client.objects
            .filter(tenant_id=tenant_id, is_deleted=False)
            .select_related("user", "membership")
            .order_by("-joined_at")
        )

    @staticmethod
    def get_by_id(client_id, tenant_id):
        return (
            Client.objects
            .filter(id=client_id, tenant_id=tenant_id, is_deleted=False)
            .select_related("user", "membership")
            .first()
        )

    @staticmethod
    def email_exists_in_tenant(email: str, tenant_id):
        """
        Check if a user with this email already has a client profile in this tenant.
        Used to prevent duplicate invites.
        """
        return Client.objects.filter(
            tenant_id=tenant_id,
            user__email=email.lower().strip(),
            is_deleted=False,
        ).exists()

    @staticmethod
    def create(tenant, user, membership, provider):
        return Client.objects.create(
            tenant=tenant,
            user=user,
            membership=membership,
            provider=provider,
        )


class InviteRepository:

    @staticmethod
    def get_pending_by_token(token_value):
        return (
            Invite.objects
            .filter(token=token_value, status=Invite.Status.PENDING)
            .select_related("tenant", "provider")
            .first()
        )

    @staticmethod
    def has_pending_invite(email: str, tenant_id):
        return Invite.objects.filter(
            client_email=email.lower().strip(),
            tenant_id=tenant_id,
            status=Invite.Status.PENDING,
        ).exists()

    @staticmethod
    def create(tenant, provider, client_email, client_name):
        return Invite.objects.create(
            tenant=tenant,
            provider=provider,
            client_email=client_email.lower().strip(),
            client_name=client_name,
            expires_at=timezone.now() + timezone.timedelta(hours=48),
        )

    @staticmethod
    def mark_accepted(invite):
        invite.status = Invite.Status.ACCEPTED
        invite.accepted_at = timezone.now()
        invite.save(update_fields=["status", "accepted_at"])