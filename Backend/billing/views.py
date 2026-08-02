from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SubscriptionPlan, Subscription, UsageSummary
from .serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    UsageSummarySerializer,
)
from .services import UsageService


# ── GET /api/billing/plans/ ────────────────────────────────
class PlanListView(generics.ListAPIView):
    """Return all available subscription plans — public endpoint."""
    queryset           = SubscriptionPlan.objects.all()
    serializer_class   = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]


# ── GET /api/billing/subscription/ ────────────────────────
class SubscriptionView(generics.RetrieveAPIView):
    """Return the current user's active subscription."""
    serializer_class   = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return (
            Subscription.objects
            .filter(user=self.request.user, status=Subscription.Status.ACTIVE)
            .select_related('plan')
            .prefetch_related('payments')
            .latest('created_at')
        )

    def retrieve(self, request, *args, **kwargs):
        try:
            instance   = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Subscription.DoesNotExist:
            return Response({'subscription': None, 'plan': 'free'})


# ── GET /api/billing/usage/ ────────────────────────────────
class UsageView(generics.RetrieveAPIView):
    """Return today's usage summary for the current user."""
    serializer_class   = UsageSummarySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        summary, _ = UsageSummary.objects.get_or_create(
            user=self.request.user,
            summary_date=timezone.now().date(),
        )
        return summary


# ── GET /api/billing/usage/monthly/ ────────────────────────
class MonthlyUsageView(APIView):
    """
    Return the current calendar-month's aggregated usage counts.
    Monthly-gated actions (research, cut, transcription) are summed
    across ALL days in the month; daily actions reflect today only.

    Response shape:
    {
        "search":        5,   # today
        "cut":           1,   # this month
        "transcription": 2,   # this month
        "research":      1,   # this month  ← key field for deep-research gate
        "chat_message":  12   # today
    }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        counts = UsageService.get_monthly_usage(request.user)
        return Response(counts)
