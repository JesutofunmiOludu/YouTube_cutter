from django.conf import settings
from django.core.exceptions import PermissionDenied
from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
import requests

from .models import UserVideo, VideoCut, Transcription
from .serializers import (
    UserVideoSerializer,
    UserVideoDetailSerializer,
    VideoCutSerializer,
    TranscriptionSerializer,
)
from billing.services import UsageService


# ── GET/POST /api/videos/ ──────────────────────────────────
class UserVideoListCreateView(generics.ListCreateAPIView):
    """List the authenticated user's saved videos or save a new one."""
    permission_classes = [permissions.IsAuthenticated]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['video__title', 'video__channel_name']
    ordering_fields    = ['saved_at', 'last_accessed_at']
    ordering           = ['-saved_at']

    def get_queryset(self):
        return (
            UserVideo.objects
            .filter(user=self.request.user)
            .select_related('video')
            .prefetch_related('cuts')
        )

    def get_serializer_class(self):
        return UserVideoSerializer

    def perform_create(self, serializer):
        serializer.save()   # user is resolved inside serializer.create()


# ── GET/PATCH/DELETE /api/videos/<id>/ ────────────────────
class UserVideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update storage type, or delete a saved video."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = UserVideoDetailSerializer

    def get_queryset(self):
        return (
            UserVideo.objects
            .filter(user=self.request.user)
            .select_related('video')
            .prefetch_related('cuts', 'transcription__segments')
        )

    # Update last_accessed_at on GET and heal stuck processes
    def retrieve(self, request, *args, **kwargs):
        from django.utils import timezone
        from .processing_pipeline import trigger_processing_if_needed
        instance = self.get_object()
        instance.last_accessed_at = timezone.now()
        instance.save(update_fields=['last_accessed_at'])
        
        # Self-heal if the background thread died (e.g. server restart)
        trigger_processing_if_needed(instance)
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ── GET/POST /api/videos/<id>/cuts/ ───────────────────────
class VideoCutListCreateView(generics.ListCreateAPIView):
    """List or create cuts for a specific user video."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = VideoCutSerializer

    def _get_user_video(self):
        return UserVideo.objects.get(
            pk=self.kwargs['video_pk'],
            user=self.request.user,
        )

    def get_queryset(self):
        return VideoCut.objects.filter(
            user_video__pk=self.kwargs['video_pk'],
            user_video__user=self.request.user,
        )

    def perform_create(self, serializer):
        # ── Freemium enforcement ──────────────────────────
        try:
            UsageService.check_and_increment(self.request.user, 'cut')
        except PermissionDenied as exc:
            from rest_framework.exceptions import PermissionDenied as DRFPermissionDenied
            raise DRFPermissionDenied(str(exc))

        user_video = self._get_user_video()
        # Auto-assign cut_order as next in sequence
        next_order = (
            VideoCut.objects
            .filter(user_video=user_video)
            .count() + 1
        )
        serializer.save(user_video=user_video, cut_order=next_order)


# ── GET/PATCH/DELETE /api/videos/<id>/cuts/<cut_id>/ ──────
class VideoCutDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Read, update, or delete a single cut."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = VideoCutSerializer

    def get_queryset(self):
        return VideoCut.objects.filter(
            user_video__pk=self.kwargs['video_pk'],
            user_video__user=self.request.user,
        )

    def get_object(self):
        return self.get_queryset().get(pk=self.kwargs['cut_pk'])


# ── GET /api/videos/<id>/transcription/ ───────────────────
class TranscriptionView(generics.RetrieveAPIView):
    """Return the transcription (with all segments) for a user video."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = TranscriptionSerializer

    def get_object(self):
        return Transcription.objects.select_related('user_video').prefetch_related('segments').get(
            user_video__pk=self.kwargs['video_pk'],
            user_video__user=self.request.user,
        )


# ── POST /api/videos/<id>/suggest-cuts/ ───────────────────
class SuggestCutsView(APIView):
    """
    Trigger Gemini AI to analyse the video transcript and suggest cut points.
    Returns the newly created VideoCut objects.

    Throttled to 'cuts' scope (50/hour per user).
    Freemium: counts against the user's monthly cut allowance.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope     = 'cuts'
    throttle_classes   = [ScopedRateThrottle]

    def post(self, request, video_pk):
        # ── Ownership check ───────────────────────────────
        try:
            user_video = UserVideo.objects.select_related('video').prefetch_related(
                'transcription__segments'
            ).get(pk=video_pk, user=request.user)
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Freemium check ────────────────────────────────
        try:
            UsageService.check_and_increment(request.user, 'cut')
        except PermissionDenied as exc:
            return Response(
                {'error': {'code': 'plan_limit_reached', 'message': str(exc)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Delete existing AI suggestions (keep user-created ones) ───
        VideoCut.objects.filter(
            user_video=user_video,
            ai_suggested=True,
            user_approved=False,
        ).delete()

        # ── Trigger AI cut suggestion ──────────────────────
        from .ai_service import suggest_cuts
        suggestions = suggest_cuts(user_video)

        # ── Persist suggestions ───────────────────────────
        created_cuts = []
        for i, s in enumerate(suggestions, start=1):
            cut = VideoCut.objects.create(
                user_video=user_video,
                cut_order=i,
                start_seconds=s['start_seconds'],
                end_seconds=s['end_seconds'],
                title=s.get('title', f'Segment {i}'),
                ai_rationale=s.get('rationale', ''),
                ai_suggested=True,
                user_approved=False,
            )
            created_cuts.append(cut)

        serializer = VideoCutSerializer(created_cuts, many=True)
        return Response(
            {'cuts': serializer.data, 'count': len(created_cuts)},
            status=status.HTTP_201_CREATED,
        )


# ── POST /api/videos/<video_pk>/cuts/<cut_pk>/suggest-labels/ ──
class SuggestCutLabelsView(APIView):
    """
    Ask the AI to generate a title and description for a specific cut segment,
    based on the transcript excerpt within that cut's time range.

    Always returns HTTP 200 — the 'source' field distinguishes between:
      - 'ai':       Gemini generated the label from the transcript / metadata
      - 'fallback': No API key or AI failure; positional label was used

    Returns:
        { "title": "...", "description": "...", "source": "ai"|"fallback" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, video_pk, cut_pk):
        # Ownership check
        try:
            user_video = UserVideo.objects.select_related('video').prefetch_related(
                'transcription__segments'
            ).get(pk=video_pk, user=request.user)
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Cut existence check
        try:
            cut = user_video.cuts.get(pk=cut_pk)
        except VideoCut.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Cut not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        total_duration = user_video.video.duration_seconds or None

        from .ai_service import suggest_cut_labels
        labels = suggest_cut_labels(
            user_video,
            cut.start_seconds,
            cut.end_seconds,
            total_duration=total_duration,
        )

        # Always 200 — the 'source' field tells the client if AI was used
        return Response(labels, status=status.HTTP_200_OK)


# ── GET /api/videos/search/?q=<query> ─────────────────────
class VideoSearchView(APIView):
    """
    Search YouTube for videos.
    Returns a list of results with title, channel, thumbnail, and duration.
    Falls back to an empty list when no API key is configured.

    Throttled to 'search' scope (30/hour) to protect the YouTube API quota.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope     = 'search'
    throttle_classes   = [ScopedRateThrottle]

    def get(self, request):
        query   = request.query_params.get('q', '').strip()
        max_res = min(int(request.query_params.get('limit', 10)), 50)

        if not query:
            return Response({'results': []})

        # ── Freemium enforcement ───────────────────────────
        try:
            UsageService.check_limit(request.user, 'search')
        except PermissionDenied as exc:
            return Response(
                {'error': {'code': 'plan_limit_reached', 'message': str(exc)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        api_key = settings.YOUTUBE_API_KEY
        if not api_key:
            return Response({'results': [], 'warning': 'YouTube API key not configured.'})

        import time as _time
        max_retries = 3
        items = []
        for attempt in range(max_retries):
            try:
                resp = requests.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params={
                        'key':        api_key,
                        'q':          query,
                        'part':       'snippet',
                        'type':       'video',
                        'maxResults': max_res,
                    },
                    timeout=10,
                )
                resp.raise_for_status()
                items = resp.json().get('items', [])
                break
            except requests.RequestException as e:
                if attempt < max_retries - 1:
                    _time.sleep(1)
                    continue
                return Response(
                    {'error': {'code': 'upstream_error', 'message': str(e)}},
                    status=status.HTTP_502_BAD_GATEWAY,
                )

        results = [
            {
                'youtube_id':    item['id']['videoId'],
                'title':         item['snippet']['title'],
                'channel_name':  item['snippet']['channelTitle'],
                'thumbnail_url': item['snippet']['thumbnails'].get('high', {}).get('url'),
                'published_at':  item['snippet'].get('publishedAt', '')[:10],
            }
            for item in items
        ]

        if results:
            try:
                UsageService.increment_limit(request.user, 'search')
            except Exception as exc:
                logger.error('Failed to increment search limit: %s', exc)

        return Response({'results': results})
