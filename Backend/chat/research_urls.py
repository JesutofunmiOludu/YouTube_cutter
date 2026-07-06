from django.urls import path
from .views import ResearchSessionListCreateView, ResearchSessionDetailView

urlpatterns = [
    path('',          ResearchSessionListCreateView.as_view(), name='research-list'),
    path('<uuid:pk>/', ResearchSessionDetailView.as_view(),    name='research-detail'),
]
