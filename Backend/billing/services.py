"""
billing/services.py
===================
Central freemium and credit enforcement service.

Usage
-----
from billing.services import UsageService

# Check + increment quota:
UsageService.check_and_increment(request.user, 'search')

# Check + deduct AI credits:
remaining = UsageService.check_and_deduct_credits(request.user, 1, 'extended_transcription')

# Read-only checks:
if UsageService.is_premium(request.user): ...
credits = UsageService.get_user_credits(request.user)
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Sum, F
from django.utils import timezone

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model
    User = get_user_model()

logger = logging.getLogger(__name__)

# ── Free-tier hard limits ──────────────────────────────────
FREE_LIMITS: dict[str, int] = {
    'search':        10,  # YouTube searches per day (was 5)
    'cut':           5,   # AI-cut videos per month (was 3)
    'transcription': 5,   # Transcriptions per month (was 3)
    'research':      1,   # Deep research sessions per month
    'chat_message':  30,  # Chat messages per day (was 50)
}

# Actions whose limits reset MONTHLY (not daily).
MONTHLY_ACTIONS: frozenset[str] = frozenset({'research', 'cut', 'transcription'})

# Premium = -1 (unlimited)
PREMIUM_LIMITS: dict[str, int] = {k: -1 for k in FREE_LIMITS}


# ── Public API ─────────────────────────────────────────────

class UsageService:

    @staticmethod
    def is_premium(user) -> bool:
        """Return True if the user has an active premium subscription with cache."""
        if not user or not user.is_authenticated:
            return False
        cache_key = f"user_is_premium:{user.pk}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        from billing.models import Subscription
        is_prem = Subscription.objects.filter(
            user=user,
            status=Subscription.Status.ACTIVE,
            plan__name__iexact='premium',
        ).exists()
        cache.set(cache_key, is_prem, timeout=300) # 5 min cache
        return is_prem

    @staticmethod
    def get_plan_limits(user) -> dict[str, int]:
        """Return the per-action limits for this user's plan."""
        if UsageService.is_premium(user):
            return PREMIUM_LIMITS
        return FREE_LIMITS

    @staticmethod
    def get_user_credits(user) -> int:
        """Return current credit balance for user."""
        if not user or not user.is_authenticated:
            return 0
        return getattr(user, 'credits_balance', 0)

    @staticmethod
    def check_and_deduct_credits(user, amount: int, action: str) -> int:
        """
        Atomically check and deduct credits from the user's balance.
        Raises PermissionDenied if insufficient credits.
        Returns remaining balance.
        """
        from django.contrib.auth import get_user_model
        from billing.models import UsageLog
        UserModel = get_user_model()

        with transaction.atomic():
            db_user = UserModel.objects.select_for_update().get(pk=user.pk)
            if db_user.credits_balance < amount:
                raise PermissionDenied(
                    f"Insufficient credits: requires {amount} credit(s), but you currently have {db_user.credits_balance}. "
                    "Please upgrade your plan or top up credits to proceed."
                )
            db_user.credits_balance = db_user.credits_balance - amount
            db_user.save(update_fields=['credits_balance'])

            # Record usage log
            today = timezone.now().date()
            UsageLog.objects.create(
                user=db_user,
                action_type=action,
                log_date=today,
                resource_id=f"credits:{amount}",
            )

            return db_user.credits_balance

    @staticmethod
    def get_today_usage(user) -> dict[str, int]:
        """Return today's UsageSummary counts for this user."""
        from billing.models import UsageSummary
        today = timezone.now().date()
        summary, _ = UsageSummary.objects.get_or_create(
            user=user,
            summary_date=today,
        )
        return {
            'search':        summary.searches_count,
            'cut':           summary.cuts_count,
            'transcription': summary.transcriptions_count,
            'research':      summary.research_count,
            'chat_message':  summary.chat_messages_count,
        }

    @staticmethod
    def get_monthly_usage(user) -> dict[str, int]:
        """
        Return this calendar month's aggregated usage counts for
        monthly-limited actions, and today's counts for daily actions.
        """
        from billing.models import UsageSummary
        now = timezone.now()

        monthly = UsageSummary.objects.filter(
            user=user,
            summary_date__year=now.year,
            summary_date__month=now.month,
        ).aggregate(
            searches=Sum('searches_count'),
            cuts=Sum('cuts_count'),
            transcriptions=Sum('transcriptions_count'),
            research=Sum('research_count'),
            chat_messages=Sum('chat_messages_count'),
        )

        return {
            'search':        monthly.get('searches') or 0,
            'cut':           monthly.get('cuts') or 0,
            'transcription': monthly.get('transcriptions') or 0,
            'research':      monthly.get('research') or 0,
            'chat_message':  monthly.get('chat_messages') or 0,
        }

    @staticmethod
    def check_limit(user, action: str) -> None:
        """
        Check if the user is within their limit for *action*.
        Raises PermissionDenied if the limit has already been reached.
        """
        if UsageService.is_premium(user):
            return

        limit = FREE_LIMITS.get(action)
        if limit is None:
            return

        from billing.models import UsageSummary
        now = timezone.now()

        if action in MONTHLY_ACTIONS:
            field = _field_for_action(action)
            monthly_total = UsageSummary.objects.filter(
                user=user,
                summary_date__year=now.year,
                summary_date__month=now.month,
            ).aggregate(total=Sum(field))['total'] or 0

            if monthly_total >= limit:
                raise PermissionDenied(
                    f'Free-tier limit reached: {limit} {action.replace("_", " ")}(s) per month. '
                    'Upgrade to Premium for unlimited access.'
                )
        else:
            today = now.date()
            summary = UsageSummary.objects.filter(user=user, summary_date=today).first()
            if summary:
                current = _get_count(summary, action)
                if current >= limit:
                    raise PermissionDenied(
                        f'Free-tier limit reached: {limit} {action.replace("_", " ")}(s) per day. '
                        'Upgrade to Premium for unlimited searches.'
                    )

    @staticmethod
    def increment(user, action: str) -> None:
        """
        Increment the usage counter for *action* by 1 on today's UsageSummary.
        Also creates a raw UsageLog record for audit purposes.
        """
        from billing.models import UsageSummary, UsageLog

        today = timezone.now().date()
        field_name = _field_for_action(action)

        with transaction.atomic():
            summary, _ = UsageSummary.objects.select_for_update().get_or_create(
                user=user,
                summary_date=today,
            )
            setattr(summary, field_name, getattr(summary, field_name) + 1)
            summary.save(update_fields=[field_name])

            UsageLog.objects.create(
                user=user,
                action_type=action,
                log_date=today,
            )

    @staticmethod
    def check_and_increment(user, action: str) -> None:
        """Atomic check + increment helper."""
        UsageService.check_limit(user, action)
        UsageService.increment(user, action)


# ── Private helpers ────────────────────────────────────────

def _field_for_action(action: str) -> str:
    mapping = {
        'search':        'searches_count',
        'cut':           'cuts_count',
        'transcription': 'transcriptions_count',
        'research':      'research_count',
        'chat_message':  'chat_messages_count',
    }
    field = mapping.get(action)
    if not field:
        raise ValueError(f'Unknown action: {action!r}')
    return field


def _get_count(summary, action: str) -> int:
    return getattr(summary, _field_for_action(action), 0)
