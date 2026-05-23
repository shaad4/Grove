from django.db import transaction
from django.utils import timezone

from apps.users.models import User, PasswordResetToken
from apps.tenants.models import TenantUsage
from .repositories import ClientRepository, InviteRepository, PasswordResetRepository
from django.utils.crypto import get_random_string

# custom exceptions
class ClientLimitExceeded(Exception):
    pass

class DuplicateClientEmail(Exception):
    pass

class InvalidInviteToken(Exception):
    pass

class ExpiredInviteToken(Exception):
    pass

class InvalidResetToken(Exception):
    pass

class ExpiredResetToken(Exception):
    pass


class ClientService:

    @staticmethod
    def _check_limit(tenant):
        """Raise ClientLimitExceeded if the tenant is at their plan limit."""
        limit = tenant.effective_client_limit
        current = ClientRepository.get_active_count(tenant.id)
        if current >= limit:
            raise ClientLimitExceeded(
                f"You have reached your plan limit of {limit} client(s). "
                "Upgrade to Pro to add more."
            )
        
    @staticmethod
    @transaction.atomic
    def invite_client(tenant, provider, client_name, client_email):
        """
        Full flow for adding a new client:
        1. Check plan limit
        2. Check for duplicate email in this tenant
        3. Cancel any existing pending invite for this email
        4. Create an inactive User (role=client)
        5. Create a Client record
        6. Create an Invite record
        7. Increment TenantUsage.client_count
        8. Return invite so the view can fire the Celery task
        """

        client_email = client_email.lower().strip()

        ClientService._check_limit(tenant)

        if ClientRepository.email_exists_in_tenant(client_email, tenant.id):
            raise DuplicateClientEmail(
                f"{client_email} is already a client in your workspace."
            )
          

        InviteRepository.expire_existing(client_email, tenant.id)

        user = User.objects.create_user(
            email = client_email,
            password = get_random_string(length=32),
            tenant = tenant,
            role = User.Role.CLIENT,
            display_name = client_name,
            is_active=False,
            is_email_verified = False,
            
        )

        client = ClientRepository.create(
            tenant=tenant,
            user=user,
            provider=provider,
        )

        invite = InviteRepository.create(
            tenant=tenant,
            provider=provider,
            client_email=client_email,
            client_name=client_name,
            expires_at=timezone.now() + timezone.timedelta(hours=48),
        )

        TenantUsage.objects.filter(tenant=tenant).update(
            client_count = TenantUsage.objects.filter(
                tenant=tenant
            ).values_list("client_count", flat=True)[0] + 1
        )

        return {
            "client" : client,
            "invite" : invite,
            "user" : user,
        }
    

    @staticmethod
    @transaction.atomic
    def accept_invite(token , password):
        """
        Client accepts their invite:
        1. Validate token exists and is pending
        2. Check not expired
        3. Activate the user + set their real password
        4. Mark invite accepted
        """
         
        invite = InviteRepository.get_pending_by_token(token)

        if invite is None:
            raise InvalidInviteToken("This invite link is invalid.")

        if invite.expires_at < timezone.now():
            invite.status = "expired"
            invite.save(update_fields=["status"])
            raise ExpiredInviteToken(
                "This invite link has expired. Ask your provider to resend it."
            )
        
        try:
            user = User.objects.get(
                email=invite.client_email,
                tenant=invite.tenant,
                role=User.Role.CLIENT,
                is_active=False,
            )
        except User.DoesNotExist:
            raise InvalidInviteToken("No account found for this invite.")


        user.set_password(password)
        user.is_active = True
        user.is_email_verified = True
        user.save()

        InviteRepository.mark_accepted(invite)

        return {
            "user" : user,
            "tenant" : invite.tenant,
        }
        

class ClientPasswordResetService:


    @staticmethod
    def request_reset(email, tenant):
        """
        Look up an active client by email scoped to this tenant.
        Expire any pending tokens, create a new one, return it.
        Returns None if user not found — caller sends same response
        either way (no email enumeration).
        """

        try:
            user = User.objects.get(
                email=email,
                tenant=tenant,
                role=User.Role.CLIENT,
                is_active=True,
            )
        except User.DoesNotExist:
            return None
        
        if user.client_profile.is_deactivated:
            return None
        

        PasswordResetRepository.expire_pending(user)

        reset_token = PasswordResetRepository.create(
            user=user,
            expires_at=timezone.now() + timezone.timedelta(minutes=30),
        )

        return {
            "user" : user,
            "reset_token" : reset_token,
        }
    

    @staticmethod
    def confirm_reset(token, new_password):
        """
        Validate token, reset password, mark token used.
        Raises InvalidResetToken or ExpiredResetToken on failure.
        """

        reset_token = PasswordResetRepository.get_pending_by_token(token)

        if reset_token is None:
            raise InvalidResetToken("Invalid or already used reset link.")
        
        if reset_token.expires_at < timezone.now():
            reset_token.status = PasswordResetToken.Status.EXPIRED
            reset_token.save(update_fields=["status"])
            raise ExpiredResetToken("Reset link has expired. Please request a new one.")


        user = reset_token.user
        user.set_password(new_password)
        user.save(update_fields=["password", "updated_at"])


        reset_token.status = PasswordResetToken.Status.USED
        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=["status", "used_at"])


