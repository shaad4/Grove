from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Client


class AddClientSerializer(serializers.Serializer):
    client_name = serializers.CharField(min_length=2, max_length=255)
    client_email = serializers.EmailField()
    business_type = serializers.CharField(max_length=100, required=False, allow_blank=True)
    private_note  = serializers.CharField(required=False, allow_blank=True)
    tags  = serializers.ListField(
        child=serializers.CharField(max_length=50),
        required=False,
        allow_empty=True,
    )

    def validate_client_email(self, value):
        return value.lower().strip()


class AcceptInviteSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8, required=False, allow_null=True)


    def validate_password(self, value):
        validate_password(value)
        return value
    

class TagSerializer(serializers.Serializer):
    name = serializers.CharField()
    color = serializers.CharField(allow_null=True)



class ClientListSerializer(serializers.ModelSerializer):
    email = serializers.SerializerMethodField()
    display_name = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    tags = serializers.SerializerMethodField()

    class Meta:
        model  = Client
        fields = [
            "id", "email", "display_name", "status",
            "is_deactivated", "last_login", "joined_at",
            "created_at", "business_type", "private_note", "tags",
        ]

    def get_email(self, obj):
        return obj.user.email if obj.user else None
    
    def get_display_name(self, obj):
        # Use user display name if active, else invite name isn't on client —
        # so fall back to provider-entered name via invite (not stored on client yet)
        return obj.user.display_name if obj.user else "Pending"
    
    def get_last_login(self, obj):
        return obj.user.last_login if obj.user else None
    

    def get_tags(self, obj):
        return [
            {"name": tm.tag.name, "color": tm.tag.color}
            for tm in obj.tag_maps.all()
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