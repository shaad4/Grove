from django.urls import path
from .views import (
    ClientLoginView,
    ValidateInviteTokenView,
    AcceptInviteView,
    ClientListCreateView,
)


urlpatterns = [
    path("", ClientListCreateView.as_view(), name="client-list-create"),
    path("invite/validate/", ValidateInviteTokenView.as_view(), name="invite-validate"),
    path("invite/accept/", AcceptInviteView.as_view(), name="invite-accept"),
    path("login/", ClientLoginView.as_view(), name="client-login"),

]