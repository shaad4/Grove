from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Client


class AddClientSerializer(serializers.Serializer):
    client_name = serializers.CharField(min_length=2, max_length=255)
    client_email = serializers.EmailField()

    def validate_client_email(self, value):
        return value.lower().strip()


class AcceptInviteSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8, required=False, allow_null=True)


    def validate_password(self, value):
        validate_password(value)
        return value


class ClientListSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)
    is_active = serializers.BooleanField(source="user.is_active", read_only=True)
    last_login = serializers.DateTimeField(source="user.last_login", read_only=True)

    class Meta:
        model  = Client
        fields = [
            "id",
            "email",
            "display_name",
            "is_active",
            "is_deactivated",
            "last_login",
            "joined_at",
            "business_type",
        ]


class ClientForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()


class ClientResetPasswordSerializer(serializers.Serializer):
    token    = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value):
        validate_password(value)
        return value