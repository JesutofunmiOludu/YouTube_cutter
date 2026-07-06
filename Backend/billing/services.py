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
from django.utils import timezone

if TYPE_CHECKING:
    from django.contrib.auth import get_user_model
    User = get_user_model()

logger = logging.getLogger(__name__)

# ── Free-tier hard limits ──────────────────────────────────
FREE_LIMITS: dict[str, int] = {
    'search':       5,    # YouTube searches per day
    'cut':          3,    # AI-cut videos per month
    'transcription': 3,   # Transcriptions per month
    'research':     1,    # Deep research sessions per month
    'chat_message': 50,   # Chat messages per day
}

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
    def check_and_increment(user, action: str) -> None:
        """
        Check the user's usage against their plan limit for *action*.
        If within limit, atomically increments the counter.
        Raises PermissionDenied (→ HTTP 403) if the limit is reached.

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

        today = timezone.now().date()

        with transaction.atomic():
            from billing.models import UsageSummary, UsageLog

            # Lock the summary row to prevent race conditions
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

            # Increment the appropriate counter
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

def _get_count(summary, action: str) -> int:
    field_map = {
        'search':        'searches_count',
        'cut':           'cuts_count',
        'transcription': 'transcriptions_count',
        'research':      'research_count',
        'chat_message':  'chat_messages_count',
    }
    return getattr(summary, field_map[action], 0)


def _increment_count(summary, action: str) -> None:
    field_map = {
        'search':        'searches_count',
        'cut':           'cuts_count',
        'transcription': 'transcriptions_count',
        'research':      'research_count',
        'chat_message':  'chat_messages_count',
    }
    field = field_map[action]
    setattr(summary, field, getattr(summary, field, 0) + 1)
