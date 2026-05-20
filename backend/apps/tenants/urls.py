from django.urls import path
from .views import ValidateTenantView

urlpatterns = [
    path('validate/', ValidateTenantView.as_view(), name="tenant-validate"),
]
