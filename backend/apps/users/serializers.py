import re
from django.db import transaction
from rest_framework import serializers
from .models import User, EmailVerificationToken, PasswordResetToken
from apps.tenants.models import Tenant
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password





class ProviderSignupSerializer(serializers.Serializer):
    display_name = serializers.CharField(min_length=2, max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only = True)

    #validations
    

    def validate_email(self, value):
        value = value.lower().strip()

        existing_user = User.objects.filter(
            email=value,
            role=User.Role.PROVIDER
        ).first()

        if existing_user:
            if existing_user.is_email_verified:
                raise serializers.ValidationError(
                    "An account with this email already exists."
                )
            
            if (
                not existing_user.is_email_verified
                and not existing_user.is_active
            ):
                existing_user.delete()

        return value

    def validate_password(self, value):
        if value.isdigit():
            raise serializers.ValidationError(
                "Password cannot be entirely numeric."
            )
        return value


    #create

    @transaction.atomic
    def create(self, validated_data):
        """
            User in a single DB transaction.
            Returns user  — token generation happens in the view.
        """
       

        user = User.objects.create_user(
            email = validated_data["email"],
            password = validated_data["password"],
            role=User.Role.PROVIDER,
            display_name=validated_data["display_name"],
            is_active = False,
            
        )

        verification_token = EmailVerificationToken.objects.create(
            user = user,
            expires_at=timezone.now() + timezone.timedelta(hours=24),
        )

        return {"user": user, "verification_token": verification_token}
    


SLUG_PATTERN = re.compile(
    r"^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$"
)

RESERVED_SLUGS = {
    "www",
    "api",
    "admin",
    "grove",
    "app",
    "mail",
    "static",
    "assets",
    "cdn",
    "support",
    "help",
    "billing",
}

class WorkspaceSetupSerializer(serializers.Serializer):
    business_name = serializers.CharField(min_length=2, max_length=255)
    slug = serializers.CharField(min_length=3, max_length=63)

    def validate_slug(self, value):
        value = value.lower().strip()

        if not SLUG_PATTERN.match(value):
            raise serializers.ValidationError(
                "Slug must contain only lowercase letters, numbers and hyphens."
            )
        
        if value in RESERVED_SLUGS:
            raise serializers.ValidationError(
                "This slug is reserved."
            )
        
        if Tenant.objects.filter(slug=value).exists():
            raise serializers.ValidationError(
                "This workspace URL is already taken."
            )
        
        return value


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    

    def validate(self, data):
        email = data.get('email').lower().strip()
        password = data.get('password')

        user = authenticate(
            request= self.context.get('request'),
            username = email,
            password = password
        )

        if not user:
            raise serializers.ValidationError(
                "Invalid Email or Password"
            )
        
        if not user.is_active:
            raise serializers.ValidationError(
                "This account as been deactivated"
            )
        
        if not user.is_email_verified:
            raise serializers.ValidationError(
                "Please verify your email before logging in."
            )
        
        if user.role != 'provider':
            raise serializers.ValidationError(
                "Invalid Credentials."
            )
        
        data['user'] = user
        return data
    



class ForgetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.lower().strip()
    

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value):
        validate_password(value)
        return value
        