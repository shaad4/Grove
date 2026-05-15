from django.urls import path
from .views import ProviderSignupView

urlpatterns = [
    path("register/", ProviderSignupView.as_view(), name = "provider-signup"),
    
]