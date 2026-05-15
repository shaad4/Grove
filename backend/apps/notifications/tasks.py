from celery import shared_task
from django.conf import settings
from django.core.mail import send_mail


@shared_task(blind=True, max_retries=3, default_retry_delay=60)
def send_verification_email(self, user_email: str, display_name: str, token: str):
    """
    Sends email verification link to a newly registered provider.
    Retries up to 3 times on failure with 60s delay.
    """
    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"

    subject = "Verify your Grove account"
    message = (
        f"Hi {display_name},\n\n"
        f"Welcome to Grove! Please verify your email address:\n\n"
        f"{verify_url}\n\n"
        f"This link expires in 24 hours.\n\n"
        f"— The Grove Team"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user_email],
            fail_silently=False,
        )
    except Exception as exc:
        raise self.retry(exc=exc)