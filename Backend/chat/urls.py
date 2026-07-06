from django.urls import path
from .views import (
    ChatSessionListCreateView,
    ChatSessionDetailView,
    ChatMessageListCreateView,
    ChatSessionAddVideoView,
    ChatSessionRemoveVideoView,
)

urlpatterns = [
    path('sessions/',                                             ChatSessionListCreateView.as_view(),  name='chat-session-list'),
    path('sessions/<uuid:pk>/',                                   ChatSessionDetailView.as_view(),      name='chat-session-detail'),
    path('sessions/<uuid:session_pk>/messages/',                  ChatMessageListCreateView.as_view(),  name='chat-message-list'),
    path('sessions/<uuid:session_pk>/videos/',                    ChatSessionAddVideoView.as_view(),    name='chat-session-add-video'),
    path('sessions/<uuid:session_pk>/videos/<uuid:uv_pk>/',       ChatSessionRemoveVideoView.as_view(), name='chat-session-remove-video'),
]
