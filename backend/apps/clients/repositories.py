from django.utils import timezone
from .models import Client, Invite
from apps.users.models import PasswordResetToken

class ClientRepository:

    @staticmethod
    def get_active_count(tenant_id):
        """How many non-deleted clients does this tenant have?"""
        return Client.objects.filter(
            tenant_id=tenant_id,
            is_deleted = False,
        ).count()
    

    @staticmethod
    def get_all_for_tenant(tenant_id):
        """
        All active (non-deleted) clients for a tenant,
        with user data prefetched to avoid N+1.
        """

        return (
            Client.objects.filter(
                tenant_id=tenant_id,
                is_deleted=False,
            )
            .select_related("user")
            .order_by("-created_at")
        )


    @staticmethod
    def get_by_id(client_id, tenant_id):
        """Fetch a single client, scoped to the tenant."""

        try:
            return Client.objects.select_related("user").get(
                id=client_id,
                tenant_id=tenant_id,
                is_deleted = False,
            )
        except Client.DoesNotExist:
            return None
        
    @staticmethod
    def email_exists_in_tenant(email, tenant_id):
        """Check if a client with this email already exists in the tenant."""
        return Client.objects.filter(
            tenant_id=tenant_id,
            user__email=email,
            is_deleted=False,
        ).exists()
    
    @staticmethod
    def create(tenant, user, provider):
        return Client.objects.create(
            tenant=tenant,
            user=user,
            provider=provider
        )
    

class InviteRepository:


    @staticmethod
    def get_pending_by_token(token):
        """
        Fetch a pending invite by token, with tenant + provider prefetched.
        Returns None if not found.
        """
        try:
            return Invite.objects.select_related("tenant", "provider").get(
                token=token,
                status=Invite.Status.PENDING,
            )
        except Invite.DoesNotExist:
            return None
        

    @staticmethod
    def has_pending_invite(email, tenant_id):
        """Check if a pending (non-expired) invite already exists for this email."""
        return Invite.objects.filter(
            client_email=email,
            tenant_id=tenant_id,
            status=Invite.Status.PENDING,
            expires_at__gt=timezone.now(),
        ).exists()
    
    @staticmethod
    def expire_existing(email, tenant_id):
        """Cancel any existing pending invites for this email in this tenant."""
        Invite.objects.filter(
            client_email=email,
            tenant_id=tenant_id,
            status=Invite.Status.PENDING,
        ).update(status=Invite.Status.CANCELLED)
    
    @staticmethod
    def create(tenant, provider, client_email, client_name, expires_at):
        return Invite.objects.create(
            tenant=tenant,
            provider=provider,
            client_email=client_email,
            client_name=client_name,
            expires_at=expires_at,
        )
    
    @staticmethod
    def mark_accepted(invite):
        invite.status = Invite.Status.ACCEPTED
        invite.accepted_at = timezone.now()
        invite.save(update_fields=["status", "accepted_at"])







