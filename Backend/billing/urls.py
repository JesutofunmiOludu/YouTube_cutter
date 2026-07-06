from django.urls import path
from .views import PlanListView, SubscriptionView, UsageView

urlpatterns = [
    path('plans/',        PlanListView.as_view(),    name='billing-plans'),
    path('subscription/', SubscriptionView.as_view(), name='billing-subscription'),
    path('usage/',        UsageView.as_view(),        name='billing-usage'),
]
