from django.urls import path
from .search_views import VideoSearchListCreateView, VideoSearchDetailView

urlpatterns = [
    path('',          VideoSearchListCreateView.as_view(), name='search-list-create'),
    path('<uuid:pk>/', VideoSearchDetailView.as_view(),    name='search-detail'),
]
