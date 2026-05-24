from django.db import transaction
from django.utils import timezone

from .models import User
from apps.tenants.models import Plan, TenantUsage

from .repositories import (
    UserRepository,
    EmailVerificationTokenRepository,
    PasswordResetTokenRepository,
)

from apps.tenants.models import Tenant, TenantMembership


#custom Exceptions

class EmailAlreadyVerified(Exception):
    pass
 
class InvalidOrExpiredToken(Exception):
    pass

class NoProviderMembership(Exception):
    """User exists but has no provider membership in the resolved tenant."""
    pass

class AccountDeactivated(Exception):
    pass


class ProviderSignupService:
    """
    Handles the two-step provider onboarding:
      Step 1 — create global user account + send verification email
      Step 2 — after email verified, create tenant workspace + membership
    """

    @staticmethod
    @transaction.atomic
    def register(email, password, display_name):
        """
        Create a new (unverified) global user and issue a verification token.
        Returns {user, verification_token} for the view to dispatch the email task.
        """
        
        user = UserRepository.create_user(
            email=email,
            password=password,
            display_name=display_name,
            is_active=False,
        )

        verification_token = EmailVerificationTokenRepository.create(
            user=user,
            expires_at=timezone.now() + timezone.timedelta(minutes=30)
        )

        return { "user" : user, "verification_token" : verification_token }
    

    @staticmethod
    @transaction.atomic
    def verify_email(token_value):
        """
        Activate the user after they click the verification link.
        Returns {user, refresh_token} — view issues JWT from refresh_token.
        """
        token = EmailVerificationTokenRepository.get_pending(token_value)

        if token is None:
            raise InvalidOrExpiredToken("Invalid or already-used verification token.")
        

        if token.expires_at < timezone.now():
            token.status = token.Status.EXPIRED
            token.save(update_fields=["status"])
            raise InvalidOrExpiredToken("This verification link has expired.")
        
        user = token.user

        UserRepository.activate(user)
        EmailVerificationTokenRepository.expire_others(user, keep_id=token.id)
        EmailVerificationTokenRepository.mark_used(token)

        return {"user" : user}
    
    @staticmethod
    @transaction.atomic
    def setup_workspace(user, buisness_name, slug):
        """
        Create the tenant workspace and give the provider their membership.
        """
        
        free_plan = Plan.objects.get(name="free")

        tenant = Tenant.objects.create(
            plan=free_plan,
            name=buisness_name,
            slug=slug,
        )

        TenantUsage.objects.create(tenant=tenant)

        #This membership is what makes the user a "provider" in this tenant
        membership = TenantMembership.objects.create(
            user=user,
            tenant=tenant,
            role=TenantMembership.Role.PROVIDER,
        )
        return {"tenant" : tenant, "membership" : membership }
    


class ProviderLoginService:
    """
    Resolves role from TenantMembership after credential check
    """ 

    @staticmethod
    def resolve_provider_membership(user, tenant):
        """
        Confirm this user is a provider in the given tenant.
        Raises NoProviderMembership if not.
        """

        membership = TenantMembership.objects.filter(
            user=user,
            tenant=tenant,
            role=TenantMembership.Role.PROVIDER,
            is_active=True,
        ).first()

        if membership is None:
            raise NoProviderMembership(
                "No provider account found for this workspace."
            )
        
        return membership
    

class PasswordResetService:
    """
    Token-based password reset. Works for any user regardless of role.
    """

    @staticmethod
    @transaction.atomic
    def request_reset(email):
        """
        Issue a reset token if the email exists.
        """

        user = UserRepository.get_by_email(email)
        if user is None or not user.is_active:
            return None
        
        PasswordResetTokenRepository.expire_pending_for_user(user)

        reset_token = PasswordResetTokenRepository.create(
            user=user,
            expires_at=timezone.now() + timezone.timedelta(minutes=30)
        )

        return {"user" : user, "reset_token" : reset_token}
    

    @staticmethod
    @transaction.atomic
    def confirm_reset(token_value, new_password):
        """Apply the new password and expire the token."""

        token = PasswordResetTokenRepository.get_pending(token_value)

        if token is None:
            raise InvalidOrExpiredToken("Invalid or already-used reset link.")
        
        if token.expires_at < timezone.now():
            PasswordResetTokenRepository.mark_expired(token)
            raise InvalidOrExpiredToken("Reset link has expired. Please request a new one.")

        UserRepository.set_password(token.user, new_password)
        PasswordResetTokenRepository.mark_used(token)

        
