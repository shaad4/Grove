from django.urls import path
from .views import (
    ClientLoginView,
    ValidateInviteTokenView,
    AcceptInviteView,
    ClientListCreateView,
    ClientForgotPasswordView,
    ClientResetPasswordView,
)


urlpatterns = [
    path("", ClientListCreateView.as_view(), name="client-list-create"),
    path("invite/validate/", ValidateInviteTokenView.as_view(), name="invite-validate"),
    path("invite/accept/", AcceptInviteView.as_view(), name="invite-accept"),
    path("login/", ClientLoginView.as_view(), name="client-login"),
    path("forgot-password/", ClientForgotPasswordView.as_view(), name="client-forgot-password"),
    path("reset-password/", ClientResetPasswordView.as_view(), name="client-reset-password"),

]