import uuid

from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)
from django.db import models


# ──────────────────────────────────────────────
# Language lookup table
# ──────────────────────────────────────────────
class Language(models.Model):
    """
    BCP 47 language lookup table.
    Extracted to satisfy 3NF — avoids transitive dependency
    where language_name would depend on language_code through user.
    """

    code = models.CharField(max_length=10, primary_key=True, help_text="BCP 47 code, e.g. en, fr, yo")
    name = models.CharField(max_length=100, help_text="English name, e.g. English, French")
    native_name = models.CharField(max_length=100, help_text="Native name, e.g. Français, Yorùbá")

    class Meta:
        db_table = "language"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


# ──────────────────────────────────────────────
# Custom User Manager
# ──────────────────────────────────────────────
class UserManager(BaseUserManager):
    """Custom manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("An email address is required.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("You have no Admin right.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("You have no Admin right.")

        return self.create_user(email, password, **extra_fields)


# ──────────────────────────────────────────────
# User model (custom, email-based auth)
# ──────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):
    """
    Core user identity. Authentication credentials and profile data.
    Subscription status is derived via the billing.Subscription table.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    # password is inherited from AbstractBaseUser — no need to declare it

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    avatar_url = models.URLField(max_length=500, blank=True, null=True)
    country_code = models.CharField(
        max_length=5,
        blank=True,
        default="",
        help_text="ISO 3166-1 alpha-2 code, e.g. NG, US",
    )
    language = models.ForeignKey(
        Language,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
        help_text="Preferred UI language",
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False, help_text="Email verification flag")
    last_login_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    class Meta:
        db_table = "user"

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


# ──────────────────────────────────────────────
# Social Auth (OAuth providers)
# ──────────────────────────────────────────────
class SocialAuth(models.Model):
    """
    OAuth provider credentials, separate from core user identity.
    One user can have multiple social providers.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="social_auths",
    )
    provider = models.CharField(max_length=50, help_text="google, apple, facebook")
    provider_uid = models.CharField(max_length=255, help_text="User ID from provider")
    access_token = models.TextField(blank=True, null=True, help_text="Encrypted")
    refresh_token = models.TextField(blank=True, null=True, help_text="Encrypted")
    token_expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "social_auth"
        constraints = [
            models.UniqueConstraint(
                fields=["provider", "provider_uid"],
                name="unique_social_provider_uid",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.provider}"
