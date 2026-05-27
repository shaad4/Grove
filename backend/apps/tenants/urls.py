from django.urls import path
from .views import ValidateTenantView, TenantPublicInfoView

urlpatterns = [
    path('validate/', ValidateTenantView.as_view(), name="tenant-validate"),
    path('info/', TenantPublicInfoView.as_view()),
]
