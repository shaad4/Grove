from django.db import transaction
from django.utils import timezone

from apps.tenants.models import Tenant, TenantMembership, TenantUsage
from apps.users.models import User
from apps.users.repositories import UserRepository

from .models import Client, Invite
from .repositories import ClientRepository, InviteRepository


#custom exceptions
class ClientLimitExceeded(Exception):
    pass

class DuplicateClientEmail(Exception):
    pass

class InvalidInviteToken(Exception):
    pass

class ExpiredInviteToken(Exception):
    pass



class ClientService:

    @staticmethod
    @transaction.atomic
    def invite_client( tenant ,provider, client_name, client_email):
        
        usage = TenantUsage.objects.select_for_update().get(tenant=tenant)
        limit = tenant.effective_client_limit

        if limit != -1 and usage.client_count >= limit:
            raise ClientLimitExceeded(
                f"You have reached your plan limit of {limit} clients. "
                "Upgrade to Pro to add more."
            )

        email = client_email.lower().strip()

        if ClientRepository.email_exists_in_tenant(email, tenant.id):
            raise DuplicateClientEmail(
                "A client with this email already exists in your workspace."
            )

        if InviteRepository.has_pending_invite(email, tenant.id):
            raise DuplicateClientEmail(
                "An invite has already been sent to this email."
            )

        invite = InviteRepository.create(
            tenant=tenant,
            provider=provider,
            client_email=email,
            client_name=client_name,
        )

        return {"invite": invite}

    @staticmethod
    @transaction.atomic
    def accept_invite(token, password):

        invite = InviteRepository.get_pending_by_token(token)

        if invite is None:
            raise InvalidInviteToken(
                "This invite link is invalid or has already been used."
            )

        if invite.expires_at < timezone.now():
            raise ExpiredInviteToken(
                "This invite link has expired. Ask your provider to resend it."
            )

        tenant = invite.tenant
        provider = invite.provider
        email = invite.client_email

        # find or create the global user
        existing_user = UserRepository.get_by_email(email)

        if existing_user:
            # user already exists globally (client of another agency)
            user = existing_user

            #Check they dont already have a membership here
            already_member = TenantMembership.objects.filter(
                user=user, tenant=tenant
            ).exists()

            if already_member:
                InviteRepository.mark_accepted(invite)
                client = Client.objects.get(user=user, tenant=tenant)
                return {"user": user, "tenant": tenant, "client": client}
        else:
            #brand new user, set password from invite form
            user = UserRepository.create_client_user(
                email=email,
                password=password,
                display_name=invite.client_name,
            )

        #Create membership (role=client in this tenant)
        membership = TenantMembership.objects.create(
            user=user,
            tenant=tenant,
            role=TenantMembership.Role.CLIENT,
        )

        #Create client profile
        client = ClientRepository.create(
            tenant=tenant,
            user=user,
            membership=membership,
            provider=provider,
        )

        #Update usage counter
        TenantUsage.objects.filter(tenant=tenant).update(
            client_count=TenantUsage.objects.values_list(
                "client_count", flat=True
            ).get(tenant=tenant) + 1
        )

        #Mark invite as accepted
        InviteRepository.mark_accepted(invite)

        return {"user": user, "tenant": tenant, "client": client, "membership": membership}