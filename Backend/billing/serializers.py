from rest_framework import serializers
from .models import SubscriptionPlan, Subscription, Payment, UsageSummary


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SubscriptionPlan
        fields = (
            'id', 'name', 'description',
            'price_usd', 'price_ngn', 'billing_cycle',
            'max_searches_per_day', 'max_cuts_per_month', 'max_transcriptions_per_month',
            'can_deep_research', 'can_multi_video_chat',
            'can_batch_download', 'can_server_storage', 'has_priority_processing',
        )
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Payment
        fields = ('id', 'amount', 'currency', 'payment_provider', 'status', 'paid_at', 'created_at')
        read_only_fields = fields


class SubscriptionSerializer(serializers.ModelSerializer):
    plan     = SubscriptionPlanSerializer(read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)

    class Meta:
        model  = Subscription
        fields = (
            'id', 'plan', 'status', 'payment_provider',
            'current_period_start', 'current_period_end',
            'cancelled_at', 'created_at', 'updated_at', 'payments',
        )
        read_only_fields = fields


class UsageSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model  = UsageSummary
        fields = (
            'id', 'summary_date',
            'searches_count', 'cuts_count',
            'transcriptions_count', 'research_count', 'chat_messages_count',
            'updated_at',
        )
        read_only_fields = fields
