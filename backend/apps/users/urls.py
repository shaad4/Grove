from django.urls import path
from .views import ProviderSignupView, CheckSlugAPIView, VerifyEmailAPIView

urlpatterns = [
    path("register/", ProviderSignupView.as_view(), name = "provider-signup"),
    path("check-slug/", CheckSlugAPIView.as_view(), name = "check-slug"),
    path("verify-email/", VerifyEmailAPIView.as_view(), name = "verify-email"),
]