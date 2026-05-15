import re
from django.db import transaction
from rest_framework import serializers
from tenants.models import Tenant, Plan, TenantUsage
from .models import User, EmailVerificationToken




SLUG_PATTERN = re.compile(r"^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$")
RESERVED_SLUGS = {
    "www", "api", "admin", "grove", "app", "mail", "static",
    "assets", "cdn", "support", "help", "billing",
}

class ProviderSignupSerializer(serializers.Serializer):
    display_name = serializers.CharField(min_length=2, max_length=255)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only = True)

    buisness_name = serializers.CharField(min_length=2, max_length=255)
    slug = serializers.CharField(min_length=3, max_length=63)

    #validations

    def validate_slug(self, value):
        value = value.lower().strip()


        if not SLUG_PATTERN.match(value):
            raise serializers.ValidationError(
                "Slug must be 3–63 characters, lowercase letters, numbers, "
                "or hyphens. Cannot start or end with a hyphen."
            )
        
        if value in RESERVED_SLUGS:
            raise serializers.ValidationError(
                f'"{value}" is a reserved name and cannot be used.'
            )
        
        if Tenant.objects.filter(slug=slug).exists():
            raise serializers.ValidationError(
                "This workspace URL is already taken. Please choose another."
            )
        
        return value
    

def validate_email(self, value):
    value = value.lower().strip()

    if User.objects.filter(email=value, role=User.Role.PROVIDER).exists():
        raise serializers.ValidationError(
            "An account with this email already exists."
        )
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
        Creates Tenant + User + TenantUsage in a single DB transaction.
        Returns user and tenant instances — token generation happens in the view.
    """
    free_plan = Plan.objects.get(name="free")

    tenant = Tenant.objects.create(
        plan=free_plan,
        name=validated_data["business_name"],
        slug=validated_data["slug"],
    ) 

    TenantUsage.objects.create(tenant=tenant)

    user = User.objects.create_user(
        email = validate_data["email"]
        password = validated_data["password"]
        tenant=tenant,
        role=User.Role.PROVIDER,
        display_name=validated_data["display_name"],
    )

    verification_token = EmailVerificationToken.objects.create(
        user = user,
        expires_at=timezone.now() + timezone.timedelta(hours=24),
    )

    return {"user": user, "tenant": tenant, "verification_token": verification_token}