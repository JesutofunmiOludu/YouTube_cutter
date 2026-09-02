"""
billing/tests.py
================
Unit tests for credit deductions, freemium limits, cached queries, and billing endpoints.
"""
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.exceptions import PermissionDenied
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from billing.models import SubscriptionPlan, Subscription, UsageSummary
from billing.services import UsageService, FREE_LIMITS

User = get_user_model()


class CreditSystemTests(TestCase):

    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email='test@vidmind.ai',
            password='password123',
            first_name='Test',
            last_name='User',
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_default_credit_balance(self):
        """New users should receive default 10 credits."""
        self.assertEqual(self.user.credits_balance, 10)
        self.assertEqual(UsageService.get_user_credits(self.user), 10)

    def test_deduct_credits_success(self):
        """Deducting credits should decrement balance and record log."""
        remaining = UsageService.check_and_deduct_credits(self.user, 2, 'deep_research')
        self.assertEqual(remaining, 8)
        self.user.refresh_from_db()
        self.assertEqual(self.user.credits_balance, 8)

    def test_deduct_credits_insufficient_raises_permission_denied(self):
        """Deducting more credits than available should raise PermissionDenied."""
        self.user.credits_balance = 0
        self.user.save(update_fields=['credits_balance'])

        with self.assertRaises(PermissionDenied):
            UsageService.check_and_deduct_credits(self.user, 1, 'extended_transcription')

    def test_credits_balance_endpoint(self):
        """GET /api/billing/credits/ returns user credits and tier."""
        url = reverse('billing-credits')
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['credits_balance'], 10)
        self.assertEqual(resp.data['subscription_tier'], 'free')
        self.assertEqual(resp.data['monthly_allowance'], 10)

    def test_cached_is_premium(self):
        """UsageService.is_premium should cache results."""
        self.assertFalse(UsageService.is_premium(self.user))
        cache_key = f"user_is_premium:{self.user.pk}"
        self.assertIsNotNone(cache.get(cache_key))

    def test_free_search_limit_10(self):
        """Free tier should allow 10 searches per day."""
        self.assertEqual(FREE_LIMITS['search'], 10)
        for _ in range(10):
            UsageService.check_and_increment(self.user, 'search')

        # 11th search should be blocked
        with self.assertRaises(PermissionDenied):
            UsageService.check_and_increment(self.user, 'search')
