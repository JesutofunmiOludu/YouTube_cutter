"""
billing/services.py
===================
Central freemium enforcement service.

Usage
-----
from billing.services import UsageService

# Check + increment (raises PermissionDenied if limit exceeded):
UsageService.check_and_increment(request.user, 'search')

# Read-only checks:
if UsageService.is_premium(request.user): ...
limits = UsageService.get_plan_limits(request.user)
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model
    User = get_user_model()

logger = logging.getLogger(__name__)

# ── Free-tier hard limits ──────────────────────────────────
FREE_LIMITS: dict[str, int] = {
    'search':        5,   # YouTube searches per day
    'cut':           3,   # AI-cut videos per month
    'transcription': 3,   # Transcriptions per month
    'research':      1,   # Deep research sessions per month
    'chat_message':  50,  # Chat messages per day
}

# Actions whose limits reset MONTHLY (not daily).
# search and chat_message reset daily.
MONTHLY_ACTIONS: frozenset[str] = frozenset({'research', 'cut', 'transcription'})

# Premium = -1 (unlimited)
PREMIUM_LIMITS: dict[str, int] = {k: -1 for k in FREE_LIMITS}


# ── Public API ─────────────────────────────────────────────

class UsageService:

    @staticmethod
    def is_premium(user) -> bool:
        """Return True if the user has an active premium subscription."""
        from billing.models import Subscription
        return Subscription.objects.filter(
            user=user,
            status=Subscription.Status.ACTIVE,
            plan__name__iexact='premium',
        ).exists()

    @staticmethod
    def get_plan_limits(user) -> dict[str, int]:
        """Return the per-action limits for this user's plan."""
        if UsageService.is_premium(user):
            return PREMIUM_LIMITS
        return FREE_LIMITS

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
        Used by the /api/billing/usage/monthly/ endpoint.
        """
        from billing.models import UsageSummary
        now = timezone.now()
        today = now.date()

        # Monthly aggregate (research, cut, transcription)
        monthly = UsageSummary.objects.filter(
            user=user,
            summary_date__year=now.year,
            summary_date__month=now.month,
        ).aggregate(
            cuts=Sum('cuts_count'),
            transcriptions=Sum('transcriptions_count'),
            research=Sum('research_count'),
        )

        # Daily counts (search, chat_message) — just today's row
        today_summary = UsageSummary.objects.filter(
            user=user, summary_date=today
        ).first()

        return {
            'search':        getattr(today_summary, 'searches_count', 0) or 0,
            'cut':           monthly.get('cuts') or 0,
            'transcription': monthly.get('transcriptions') or 0,
            'research':      monthly.get('research') or 0,
            'chat_message':  getattr(today_summary, 'chat_messages_count', 0) or 0,
        }

    @staticmethod
    def check_limit(user, action: str) -> None:
        """
        Check if the user is within their limit for *action*.
        Raises PermissionDenied if the limit has already been reached.
        Monthly actions (research, cut, transcription) are counted across
        the full calendar month; daily actions use today's row only.
        """
        if UsageService.is_premium(user):
            return

        limit = FREE_LIMITS.get(action)
        if limit is None:
            return

        from billing.models import UsageSummary
        now = timezone.now()

        if action in MONTHLY_ACTIONS:
            # Sum the action's count across all rows in the current month
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
            # Daily limit — check only today's row
            today = now.date()
            summary = UsageSummary.objects.filter(user=user, summary_date=today).first()
            if summary:
                current = _get_count(summary, action)
                if current >= limit:
                    raise PermissionDenied(
                        f'Free-tier limit reached: {limit} {action.replace("_", " ")}(s) per day. '
                        'Upgrade to Premium for unlimited access.'
                    )

    @staticmethod
    def increment_limit(user, action: str) -> None:
        """
        Atomically increments the usage counter for *action*.
        Does not check limits (assumes check_limit was called first).
        """
        if UsageService.is_premium(user):
            UsageService._log_action(user, action)
            return

        today = timezone.now().date()
        with transaction.atomic():
            from billing.models import UsageSummary, UsageLog
            summary, _ = UsageSummary.objects.select_for_update().get_or_create(
                user=user,
                summary_date=today,
            )
            _increment_count(summary, action)
            summary.save()

            # Raw audit log
            UsageLog.objects.create(
                user=user,
                action_type=action,
                log_date=today,
            )

    @staticmethod
    def check_and_increment(user, action: str) -> None:
        """
        Check the user's usage against their plan limit for *action*.
        If within limit, atomically increments the counter.
        Raises PermissionDenied (→ HTTP 403) if the limit is reached.

        Monthly actions (research, cut, transcription): limit is evaluated
        against the total for the current calendar month.
        Daily actions (search, chat_message): limit is per-day.

        action must be one of: 'search', 'cut', 'transcription',
                                'research', 'chat_message'
        """
        if UsageService.is_premium(user):
            # Premium users bypass all limits; still log for analytics
            UsageService._log_action(user, action)
            return

        limit = FREE_LIMITS.get(action)
        if limit is None:
            logger.warning('Unknown usage action "%s" — skipping enforcement.', action)
            return

        now = timezone.now()
        today = now.date()

        with transaction.atomic():
            from billing.models import UsageSummary, UsageLog

            if action in MONTHLY_ACTIONS:
                # ── Monthly limit: aggregate across the whole month ──────
                # Still lock today's row (the one we will increment) to
                # prevent concurrent over-increments on the same day.
                summary, _ = UsageSummary.objects.select_for_update().get_or_create(
                    user=user,
                    summary_date=today,
                )

                # Count all rows for this month (excluding the locked row,
                # which select_for_update already holds).
                field = _field_for_action(action)
                month_total = (
                    UsageSummary.objects
                    .filter(
                        user=user,
                        summary_date__year=now.year,
                        summary_date__month=now.month,
                    )
                    .aggregate(total=Sum(field))['total'] or 0
                )

                if month_total >= limit:
                    raise PermissionDenied(
                        f'Free-tier limit reached: {limit} {action.replace("_", " ")}(s) per month. '
                        'Upgrade to Premium for unlimited access.'
                    )
            else:
                # ── Daily limit: lock and check today's row only ─────────
                summary, _ = UsageSummary.objects.select_for_update().get_or_create(
                    user=user,
                    summary_date=today,
                )

                current = _get_count(summary, action)
                if current >= limit:
                    raise PermissionDenied(
                        f'Free-tier limit reached: {limit} {action.replace("_", " ")}(s) per day. '
                        'Upgrade to Premium for unlimited access.'
                    )

            # Increment today's row (applies for both monthly and daily)
            _increment_count(summary, action)
            summary.save()

            # Raw audit log
            UsageLog.objects.create(
                user=user,
                action_type=action,
                log_date=today,
            )

    @staticmethod
    def _log_action(user, action: str) -> None:
        """Log a premium action for analytics (no enforcement)."""
        from billing.models import UsageLog
        UsageLog.objects.create(
            user=user,
            action_type=action,
            log_date=timezone.now().date(),
        )


# ── Private helpers ────────────────────────────────────────

_ACTION_FIELD_MAP: dict[str, str] = {
    'search':        'searches_count',
    'cut':           'cuts_count',
    'transcription': 'transcriptions_count',
    'research':      'research_count',
    'chat_message':  'chat_messages_count',
}


def _field_for_action(action: str) -> str:
    """Return the UsageSummary field name for a given action key."""
    return _ACTION_FIELD_MAP[action]


def _get_count(summary, action: str) -> int:
    return getattr(summary, _ACTION_FIELD_MAP[action], 0)


def _increment_count(summary, action: str) -> None:
    field = _ACTION_FIELD_MAP[action]
    setattr(summary, field, getattr(summary, field, 0) + 1)
