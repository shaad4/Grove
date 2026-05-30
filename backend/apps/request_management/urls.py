from django.urls import path
from .views import (
    RequestListCreateView,
    RequestDetailView,
    RequestStatusView,

)


urlpatterns = [
    path("", RequestListCreateView.as_view(), name="request-list-create"),
    path("<uuid:request_id>/", RequestDetailView.as_view(), name="request-detail"),
    path("<uuid:request_id>/status/", RequestStatusView.as_view(), name="request-status"),
]