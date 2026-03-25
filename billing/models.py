import uuid

from django.conf import settings
from django.db import models


# ──────────────────────────────────────────────
# SubscriptionPlan (plan definitions)
# ──────────────────────────────────────────────
class SubscriptionPlan(models.Model):
    """
    Defines available plans and their feature entitlements.
    Extracted from user/subscription to eliminate repeating
    feature columns across subscribers.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True, help_text="free, premium")
    description = models.TextField(blank=True, null=True)
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, help_text="Monthly price in USD")
    price_ngn = models.DecimalField(max_digits=12, decimal_places=2, help_text="Monthly price in NGN")
    billing_cycle = models.CharField(max_length=20, help_text="monthly, yearly")

    # Feature limits (-1 = unlimited)
    max_searches_per_day = models.IntegerField(default=5)
    max_cuts_per_month = models.IntegerField(default=3)
    max_transcriptions_per_month = models.IntegerField(default=3)

    # Feature flags
    can_deep_research = models.BooleanField(default=False)
    can_multi_video_chat = models.BooleanField(default=False)
    can_batch_download = models.BooleanField(default=False)
    can_server_storage = models.BooleanField(default=False)
    has_priority_processing = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "subscription_plan"

    def __str__(self):
        return self.name


# ──────────────────────────────────────────────
# Subscription (user ↔ plan link)
# ──────────────────────────────────────────────
class Subscription(models.Model):
    """Tracks a user's active or historical subscription to a plan."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        CANCELLED = "cancelled", "Cancelled"
        PAST_DUE = "past_due", "Past Due"
        TRIALING = "trialing", "Trialing"

    class PaymentProvider(models.TextChoices):
        STRIPE = "stripe", "Stripe"
        FLUTTERWAVE = "flutterwave", "Flutterwave"
        PAYSTACK = "paystack", "Paystack"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscriptions",
    )
    plan = models.ForeignKey(
        SubscriptionPlan,
        on_delete=models.PROTECT,
        related_name="subscriptions",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    payment_provider = models.CharField(max_length=30, choices=PaymentProvider.choices)
    provider_subscription_id = models.CharField(
        max_length=255,
        unique=True,
        null=True,
        blank=True,
        help_text="External subscription reference",
    )
    provider_customer_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="External customer reference",
    )
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "subscription"

    def __str__(self):
        return f"{self.user.email} — {self.plan.name} ({self.status})"


# ──────────────────────────────────────────────
# Payment (transaction records)
# ──────────────────────────────────────────────
class Payment(models.Model):
    """
    Individual payment transactions.
    Separated from Subscription — a subscription has many payments.
    """

    class Status(models.TextChoices):
        SUCCEEDED = "succeeded", "Succeeded"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="payments",
        help_text="Denormalized for query performance",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=5, help_text="USD, NGN, GBP etc.")
    payment_provider = models.CharField(max_length=30, help_text="stripe, flutterwave, paystack")
    provider_payment_id = models.CharField(max_length=255, unique=True, help_text="External payment ID")
    status = models.CharField(max_length=20, choices=Status.choices)
    metadata = models.JSONField(null=True, blank=True, help_text="Provider-specific webhook data")
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment"

    def __str__(self):
        return f"{self.currency} {self.amount} — {self.status}"


# ──────────────────────────────────────────────
# UsageLog (raw action events)
# ──────────────────────────────────────────────
class UsageLog(models.Model):
    """
    Raw log of user actions for usage enforcement (rate limiting free tier).
    """

    class ActionType(models.TextChoices):
        SEARCH = "search", "Search"
        CUT = "cut", "Cut"
        TRANSCRIPTION = "transcription", "Transcription"
        RESEARCH = "research", "Research"
        CHAT_MESSAGE = "chat_message", "Chat Message"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="usage_logs",
    )
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    resource_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Related resource UUID",
    )
    log_date = models.DateField(help_text="Date of action (for daily limits)")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "usage_log"
        indexes = [
            models.Index(
                fields=["user", "action_type", "log_date"],
                name="idx_usage_log_user_date",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.action_type} on {self.log_date}"


# ──────────────────────────────────────────────
# UsageSummary (aggregated daily counts)
# ──────────────────────────────────────────────
class UsageSummary(models.Model):
    """
    Aggregated daily usage per user.
    Separated from UsageLog to avoid recomputing counts on every request.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="usage_summaries",
    )
    summary_date = models.DateField()
    searches_count = models.IntegerField(default=0)
    cuts_count = models.IntegerField(default=0)
    transcriptions_count = models.IntegerField(default=0)
    research_count = models.IntegerField(default=0)
    chat_messages_count = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "usage_summary"
        verbose_name_plural = "Usage summaries"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "summary_date"],
                name="unique_user_summary_date",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.summary_date}"
