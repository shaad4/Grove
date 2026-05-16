from django.urls import path
from .views import ProviderSignupView, VerifyEmailAPIView, WorkspaceSetupAPIView, CheckSlugAPIView

urlpatterns = [
    path("register/", ProviderSignupView.as_view(), name = "provider-signup"),
    path("verify-email/", VerifyEmailAPIView.as_view(), name = "verify-email"),
    path("setup-workspace/", WorkspaceSetupAPIView.as_view(), name="setup-workspace"),
    path("check-slug/" , CheckSlugAPIView.as_view(), name ="check-slug"),
]