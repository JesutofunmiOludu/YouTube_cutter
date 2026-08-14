from django.urls import path
from .views import (
    UserVideoListCreateView,
    UserVideoDetailView,
    VideoCutListCreateView,
    VideoCutDetailView,
    TranscriptionView,
    VideoSearchView,
    SuggestCutsView,
    SuggestCutLabelsView,
    VideoCutProcessView,
    VideoCutStatusView,
    VideoCutFileDownloadView,
)

urlpatterns = [
    # Video search
    path('search/',                                      VideoSearchView.as_view(),              name='video-search'),

    # UserVideo CRUD
    path('',                                             UserVideoListCreateView.as_view(),       name='uservideo-list'),
    path('<uuid:pk>/',                                   UserVideoDetailView.as_view(),           name='uservideo-detail'),

    # Cuts (nested under a user video)
    path('<uuid:video_pk>/cuts/',                        VideoCutListCreateView.as_view(),        name='videocut-list'),
    path('<uuid:video_pk>/cuts/<uuid:cut_pk>/',          VideoCutDetailView.as_view(),            name='videocut-detail'),

    # AI cut suggestions
    path('<uuid:video_pk>/suggest-cuts/',                SuggestCutsView.as_view(),               name='videocut-suggest'),
    path('<uuid:video_pk>/cuts/<uuid:cut_pk>/suggest-labels/', SuggestCutLabelsView.as_view(),   name='videocut-suggest-labels'),

    # Real video cutting
    path('<uuid:video_pk>/cuts/<uuid:cut_pk>/process/', VideoCutProcessView.as_view(),            name='videocut-process'),
    path('<uuid:video_pk>/cuts/<uuid:cut_pk>/status/',  VideoCutStatusView.as_view(),             name='videocut-status'),

    # Force-download the cut clip (.mp4) — bypasses cross-origin download restriction
    path('<uuid:video_pk>/cuts/<uuid:cut_pk>/file/',    VideoCutFileDownloadView.as_view(),       name='videocut-file'),

    # Transcription
    path('<uuid:video_pk>/transcription/',               TranscriptionView.as_view(),             name='transcription-detail'),
]
