from django.contrib import admin
from .models import SubscriptionPlan, Subscription, Payment, UsageLog, UsageSummary


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display  = ('name', 'price_usd', 'price_ngn', 'billing_cycle', 'can_deep_research', 'can_multi_video_chat')
    readonly_fields = ('id', 'created_at')


class PaymentInline(admin.TabularInline):
    model       = Payment
    extra       = 0
    readonly_fields = ('id', 'created_at', 'paid_at')
    fields      = ('amount', 'currency', 'payment_provider', 'status', 'paid_at')


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display  = ('user', 'plan', 'status', 'payment_provider', 'current_period_end', 'created_at')
    list_filter   = ('status', 'payment_provider', 'plan')
    search_fields = ('user__email',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('user',)
    inlines       = [PaymentInline]


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display  = ('user', 'amount', 'currency', 'payment_provider', 'status', 'paid_at')
    list_filter   = ('status', 'payment_provider', 'currency')
    search_fields = ('user__email', 'provider_payment_id')
    readonly_fields = ('id', 'created_at')
    raw_id_fields = ('user', 'subscription')


@admin.register(UsageLog)
class UsageLogAdmin(admin.ModelAdmin):
    list_display  = ('user', 'action_type', 'log_date', 'created_at')
    list_filter   = ('action_type', 'log_date')
    search_fields = ('user__email',)
    readonly_fields = ('id', 'created_at')
    raw_id_fields = ('user',)


@admin.register(UsageSummary)
class UsageSummaryAdmin(admin.ModelAdmin):
    list_display  = ('user', 'summary_date', 'searches_count', 'cuts_count', 'transcriptions_count', 'research_count')
    search_fields = ('user__email',)
    readonly_fields = ('id', 'updated_at')
    raw_id_fields = ('user',)
