"""
chat/search_views.py
====================
REST API views for the Perplexity-style web search feature.

Endpoints
---------
POST   /api/search/           — run a new search, persist result
GET    /api/search/           — list the user's previous searches
GET    /api/search/<id>/      — fetch a single search result in full detail
DELETE /api/search/<id>/      — delete a search result

Free tier
---------
5 searches per day  (reuses the existing 'search' usage bucket).
"""
from __future__ import annotations

from django.core.exceptions import PermissionDenied
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from videos.models import UserVideo
from .models import VideoSearchSession, VideoSearchSource
from .serializers import (
    VideoSearchSessionSerializer,
    VideoSearchSessionDetailSerializer,
)
from . import search_service
from billing.services import UsageService


# ── GET/POST /api/search/ ─────────────────────────────────
class VideoSearchListCreateView(APIView):
    """
    GET  — return the authenticated user's previous searches (newest first).
    POST — run a new search, enforce freemium, persist + return result.

    POST body:
        {
            "query":         "<user's question or key-point text>",
            "user_video_id": "<uuid>"   (optional — for video context)
        }
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope     = 'search'
    throttle_classes   = [ScopedRateThrottle]

    def get(self, request):
        qs = VideoSearchSession.objects.filter(user=request.user)
        user_video_id = request.query_params.get('user_video_id')
        if user_video_id:
            qs = qs.filter(user_video_id=user_video_id)
        qs = qs.order_by('created_at')
        serializer = VideoSearchSessionDetailSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        query = (request.data.get('query') or '').strip()
        if not query:
            return Response(
                {'detail': 'query is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Freemium enforcement ──────────────────────────
        try:
            UsageService.check_and_increment(request.user, 'search')
        except PermissionDenied as exc:
            return Response(
                {
                    'detail': str(exc),
                    'error':  {'code': 'search_limit_reached', 'message': str(exc)},
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Resolve optional video context ────────────────
        user_video = None
        user_video_id = request.data.get('user_video_id')
        if user_video_id:
            try:
                user_video = UserVideo.objects.get(pk=user_video_id, user=request.user)
            except UserVideo.DoesNotExist:
                pass  # silently ignore — search still works without video context

        # ── Create a pending session ──────────────────────
        session = VideoSearchSession.objects.create(
            user       = request.user,
            user_video = user_video,
            query      = query,
            status     = VideoSearchSession.Status.PENDING,
        )

        # ── Call Gemini ───────────────────────────────────
        try:
            result = search_service.run_web_search(query, user_video)

            # Persist sources
            for i, src in enumerate(result.get('sources', []), start=1):
                VideoSearchSource.objects.create(
                    search_session = session,
                    title          = (src.get('title') or '')[:500],
                    url            = (src.get('url') or '')[:1000],
                    excerpt        = src.get('excerpt') or '',
                    rank           = i,
                )

            session.answer              = result.get('answer', '')
            session.follow_up_questions = result.get('follow_up_questions', [])
            session.status              = VideoSearchSession.Status.COMPLETED
            session.save(update_fields=['answer', 'follow_up_questions', 'status', 'updated_at'])

        except Exception as exc:
            session.status = VideoSearchSession.Status.FAILED
            session.save(update_fields=['status', 'updated_at'])
            return Response(
                {'detail': f'Search failed: {exc}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        serializer = VideoSearchSessionDetailSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── GET/DELETE /api/search/<id>/ ──────────────────────────
class VideoSearchDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = VideoSearchSessionDetailSerializer

    def get_queryset(self):
        return VideoSearchSession.objects.filter(user=self.request.user)
