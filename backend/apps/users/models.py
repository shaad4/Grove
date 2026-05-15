import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from apps.tenants.models import Tenant


# Create your models here.

class UserManager(BaseUserManager):
    def create_user(self, email, password, tenant=None, role="provider", **extra):
        if not email:
            raise ValueError("Email is required.")
        
        email = self.normalize_email(email)
        user = self.model(email=email, tenant=tenant, role=role, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password, **extra):
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        extra.setdefault("role", "admin")
        return self.create_user(email, password, tenant=None, **extra)
    

class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        PROVIDER = "provider", "Provider"
        CLIENT = "client", "Client"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=True)
    tenant = models.ForeignKey(
        Tenant,
        on_delete= models.CASCADE,
        null=True, blank=True, related_name="users"
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PROVIDER)
    email = models.EmailField(unique=True)
    display_name = models.CharField(max_length=255)
    avatar_url = models.TextField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    settings = models.JSONField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["display_name"]

    class Meta:
        db_table = "users"
        constraints = [
            models.UniqueConstraint(
                fields=["tenant", "email"], name="idx_users_tenant_email"
            )
        ]
        indexes = [
            models.Index(fields=["tenant"], name="idx_users_tenant_id"),
            models.Index(fields=["role"], name="idx_users_role"),
            models.Index(fields=["is_active"], name="idx_users_active"),
        ]

    def __str__(self):
        return f"{self.email} ({self.role})"
    

class EmailVerificationToken(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending"
        USED = "used"
        EXPIRED = "expired"


    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="verification_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "email_verification_tokens"

    def __str__(self):
        return f"Token for {self.user.email} [{self.status}]"
    