from django.urls import path
from .views import (
    RequestListCreateView,
)


urlpatterns = [
    path("", RequestListCreateView.as_view(), name="request-list-create"),
]