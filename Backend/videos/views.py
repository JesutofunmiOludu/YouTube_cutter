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

    # Update last_accessed_at only when touch=true and heal stuck processes
    def retrieve(self, request, *args, **kwargs):
        from django.utils import timezone
        from .processing_pipeline import trigger_processing_if_needed
        instance = self.get_object()
        if request.query_params.get('touch') in ('true', '1'):
            instance.last_accessed_at = timezone.now()
            instance.save(update_fields=['last_accessed_at'])
        
        # Self-heal if the background thread died (e.g. server restart)
        trigger_processing_if_needed(instance)

        # Auto-refresh fallback cuts if a transcript is now available
        from .processing_pipeline import refresh_cuts_from_transcript_if_needed
        if refresh_cuts_from_transcript_if_needed(instance):
            instance = self.get_object()

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

    def update(self, request, *args, **kwargs):
        """
        On time-range edits, invalidate the existing processed clip.

        If start_seconds or end_seconds change and the cut already has a
        processed file (download_status == 'ready'), we:
          1. Delete the old .mp4 from disk (frees storage immediately).
          2. Reset download_status → 'pending' and download_url → None.

        The user must click "Cut" again to re-process at the new range.
        """
        import os
        from django.conf import settings as dj_settings

        cut = self.get_object()
        is_time_change = (
            'start_seconds' in request.data or
            'end_seconds'   in request.data
        )
        was_ready = cut.download_status == VideoCut.DownloadStatus.READY

        if is_time_change and was_ready:
            # ── Remove the stale clip file from disk ─────────────────────────
            if cut.download_url:
                relative  = cut.download_url.lstrip('/')           # media/cuts/<file>
                media_rel = relative[len('media/'):]               # cuts/<file>
                file_path = os.path.join(str(dj_settings.MEDIA_ROOT), media_rel)
                try:
                    os.remove(file_path)
                except OSError:
                    pass   # already gone — that's fine

            # ── Inject reset fields into the request before serializer runs ──
            # We use a mutable copy so we don't mutate the original QueryDict.
            data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
            data['download_status'] = 'pending'
            data['download_url']    = None
            request._full_data = data   # patch for DRF's partial update path

        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        """Persist download_status reset alongside time-range changes."""
        cut  = self.get_object()
        data = self.request.data
        is_time_change = (
            'start_seconds' in data or
            'end_seconds'   in data
        )
        was_ready = cut.download_status == VideoCut.DownloadStatus.READY

        if is_time_change and was_ready:
            serializer.save(download_status='pending', download_url=None)
        else:
            serializer.save()


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


import re

def parse_iso8601_duration(duration_str):
    if not duration_str:
        return 0
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
    if not match:
        return 0
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


# ── GET /api/videos/search/?q=<query> ─────────────────────
class VideoSearchView(APIView):
    """
    Search YouTube for videos.
    Returns a list of results with title, channel, thumbnail, duration, and view count.
    Falls back to an empty list when no API key is configured.

    Throttled to 'search' scope (30/hour) to protect the YouTube API quota.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope     = 'search'
    throttle_classes   = [ScopedRateThrottle]

    def get(self, request):
        query    = request.query_params.get('q', '').strip()
        max_res  = min(int(request.query_params.get('limit', 10)), 50)
        order    = request.query_params.get('order', 'relevance').strip()
        duration = request.query_params.get('duration', 'any').strip()

        allowed_orders = {
            'relevance': 'relevance',
            'views': 'viewCount',
            'viewCount': 'viewCount',
            'date': 'date',
            'rating': 'rating',
            'title': 'title',
        }
        yt_order = allowed_orders.get(order, 'relevance')

        if not query:
            return Response({'results': []})

        # ── Freemium enforcement ───────────────────────────
        try:
            UsageService.check_and_increment(request.user, 'search')
        except PermissionDenied as exc:
            return Response(
                {'error': {'code': 'plan_limit_reached', 'message': str(exc)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        # ── Check shared cache before hitting external YouTube API ────
        import hashlib
        from django.core.cache import cache

        cache_key_raw = f"yt_search:{query.lower()}:{duration}:{yt_order}:{max_res}"
        cache_key = f"yt_search:{hashlib.md5(cache_key_raw.encode()).hexdigest()}"
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return Response({'results': cached_results, 'cached': True})

        api_key = settings.YOUTUBE_API_KEY
        if not api_key:
            return Response({'results': [], 'warning': 'YouTube API key not configured.'})

        search_params = {
            'key':        api_key,
            'q':          query,
            'part':       'snippet',
            'type':       'video',
            'order':      yt_order,
            'maxResults': max_res,
        }
        if duration in ('short', 'medium', 'long'):
            search_params['videoDuration'] = duration

        import time as _time
        max_retries = 3
        items = []
        for attempt in range(max_retries):
            try:
                resp = requests.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params=search_params,
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

        video_ids = [
            item['id']['videoId'] for item in items
            if item.get('id', {}).get('videoId')
        ]
        stats_map = {}
        if video_ids:
            try:
                stats_resp = requests.get(
                    'https://www.googleapis.com/youtube/v3/videos',
                    params={
                        'key':  api_key,
                        'id':   ','.join(video_ids),
                        'part': 'statistics,contentDetails',
                    },
                    timeout=10,
                )
                if stats_resp.status_code == 200:
                    for v_item in stats_resp.json().get('items', []):
                        v_id = v_item.get('id')
                        st = v_item.get('statistics', {})
                        cd = v_item.get('contentDetails', {})
                        raw_cnt = st.get('viewCount')
                        dur_iso = cd.get('duration', '')
                        stats_map[v_id] = {
                            'view_count': int(raw_cnt) if raw_cnt is not None else None,
                            'duration_seconds': parse_iso8601_duration(dur_iso),
                        }
            except Exception:
                pass

        import html

        results = [
            {
                'youtube_id':       item['id']['videoId'],
                'title':            html.unescape(item['snippet']['title']),
                'channel_name':     html.unescape(item['snippet']['channelTitle']),
                'thumbnail_url':    item['snippet']['thumbnails'].get('high', {}).get('url'),
                'published_at':     item['snippet'].get('publishedAt', '')[:10],
                'duration_seconds': stats_map.get(item['id']['videoId'], {}).get('duration_seconds', 0),
                'view_count':       stats_map.get(item['id']['videoId'], {}).get('view_count'),
            }
            for item in items
            if item.get('id', {}).get('videoId')
        ]

        # Cache for 3 hours (10,800 seconds)
        cache.set(cache_key, results, timeout=10800)
        return Response({'results': results, 'cached': False})


# ─────────────────────────────────────────────────────────────────────────────
# Background worker for video cutting
# ─────────────────────────────────────────────────────────────────────────────

def _run_cut_in_background(cut_id: str) -> None:
    """
    Background thread entry point.

    Downloads the full YouTube video using yt-dlp, then extracts the
    requested segment with ffmpeg (stream-copy / no re-encode).
    Updates the VideoCut row on the main DB connection when done.
    """
    import os
    import tempfile
    import django
    from django.conf import settings as dj_settings

    # Django ORM is safe to use from threads as long as we use a fresh
    # connection (Django handles this automatically per-thread).
    try:
        cut        = VideoCut.objects.select_related('user_video__video').get(pk=cut_id)
        youtube_id = cut.user_video.video.youtube_id
        start_s    = int(cut.start_seconds)
        end_s      = int(cut.end_seconds)

        # Sanitise a filename-safe title fragment
        safe_title = ''.join(
            c if c.isalnum() or c in ('-', '_') else '_'
            for c in (cut.title or f'cut_{cut.cut_order}')
        )[:40]
        output_filename = f"{cut_id}_{safe_title}.mp4"
        output_path     = str(dj_settings.CUTS_DIR / output_filename)

        # If we already produced this file, skip downloading again
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            relative_url = f"{dj_settings.MEDIA_URL}cuts/{output_filename}"
            cut.download_url    = relative_url
            cut.download_status = VideoCut.DownloadStatus.READY
            cut.save(update_fields=['download_url', 'download_status'])
            return

        from .utils import download_and_cut_youtube_video

        # Single step — download only the clip's time range and write directly
        # to the output file.  Much faster than downloading the whole video.
        download_and_cut_youtube_video(
            youtube_id  = youtube_id,
            start_seconds = start_s,
            end_seconds   = end_s,
            output_path   = output_path,
        )

        # Step 4 — Persist the download URL on the cut record
        relative_url = f"{dj_settings.MEDIA_URL}cuts/{output_filename}"
        cut.download_url    = relative_url
        cut.download_status = VideoCut.DownloadStatus.READY
        cut.save(update_fields=['download_url', 'download_status'])

    except Exception as exc:
        import traceback
        print(f"[video-cut] ERROR for cut {cut_id}: {exc}\n{traceback.format_exc()}")
        try:
            cut = VideoCut.objects.get(pk=cut_id)
            cut.download_status = VideoCut.DownloadStatus.FAILED
            cut.save(update_fields=['download_status'])
        except Exception:
            pass


# ── POST /api/videos/<video_pk>/cuts/<cut_pk>/process/ ───────────────────────
class VideoCutProcessView(APIView):
    """
    Start server-side video cutting for a specific cut segment.

    Immediately returns HTTP 202 Accepted and launches the actual work
    (yt-dlp download + ffmpeg copy-cut) in a background thread.

    The frontend should poll GET .../status/ every 3 s until
    download_status becomes 'ready' or 'failed'.

    Returns:
        202  { id, download_status: 'processing' }   — job started
        409  { error }                               — already processing
        404  { error }                               — cut / video not found
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, video_pk, cut_pk):
        # ── Ownership check ──────────────────────────────────────────────────
        try:
            user_video = UserVideo.objects.select_related('video').get(
                pk=video_pk, user=request.user
            )
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            cut = VideoCut.objects.get(pk=cut_pk, user_video=user_video)
        except VideoCut.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Cut not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Idempotency guard — don't double-launch ──────────────────────────
        if cut.download_status == VideoCut.DownloadStatus.PROCESSING:
            serializer = VideoCutSerializer(cut)
            return Response(serializer.data, status=status.HTTP_409_CONFLICT)

        # ── Mark as processing immediately so the UI reacts ──────────────────
        cut.download_status = VideoCut.DownloadStatus.PROCESSING
        cut.save(update_fields=['download_status'])

        # ── Spawn background thread ──────────────────────────────────────────
        import threading
        thread = threading.Thread(
            target=_run_cut_in_background,
            args=(str(cut.id),),
            daemon=True,
            name=f"cut-{cut.id}",
        )
        thread.start()

        serializer = VideoCutSerializer(cut)
        return Response(serializer.data, status=status.HTTP_202_ACCEPTED)


# ── GET /api/videos/<video_pk>/cuts/<cut_pk>/status/ ─────────────────────────
class VideoCutStatusView(APIView):
    """
    Return the current download_status and download_url for a cut.

    Used by the frontend to poll for completion after calling /process/.

    Returns:
        200 { id, download_status, download_url }
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, video_pk, cut_pk):
        try:
            user_video = UserVideo.objects.get(pk=video_pk, user=request.user)
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            cut = VideoCut.objects.get(pk=cut_pk, user_video=user_video)
        except VideoCut.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Cut not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'id':              str(cut.id),
            'download_status': cut.download_status,
            'download_url':    cut.download_url,
        }, status=status.HTTP_200_OK)


# ── GET /api/videos/<video_pk>/cuts/<cut_pk>/file/ ────────────────────────────
class VideoCutFileDownloadView(APIView):
    """
    Stream the cut .mp4 clip to the browser as a forced download.

    The `download` attribute on HTML anchor tags is silently ignored by
    browsers when the file URL is cross-origin (e.g. Next.js on :3000
    linking to Django media on :8000).  This view re-serves the file
    through the API origin, adding a  Content-Disposition: attachment
    header so the browser always offers a Save-As dialog.

    Returns:
        200  — streams the .mp4 file
        404  — cut or file not found / not yet ready
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, video_pk, cut_pk):
        import os
        import mimetypes
        from django.http import FileResponse

        # ── Ownership check ──────────────────────────────────────────────────
        try:
            user_video = UserVideo.objects.get(pk=video_pk, user=request.user)
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            cut = VideoCut.objects.get(pk=cut_pk, user_video=user_video)
        except VideoCut.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Cut not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Check file is ready ───────────────────────────────────────────────
        if cut.download_status != VideoCut.DownloadStatus.READY or not cut.download_url:
            return Response(
                {'error': {'code': 'not_ready', 'message': 'Clip is not ready yet.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # download_url is a relative URL like  /media/cuts/<filename>.mp4
        # Resolve it to an absolute filesystem path
        relative   = cut.download_url.lstrip('/')          # "media/cuts/<filename>.mp4"
        media_rel  = relative[len('media/'):]              # "cuts/<filename>.mp4"
        file_path  = os.path.join(settings.MEDIA_ROOT, media_rel)

        if not os.path.exists(file_path):
            return Response(
                {'error': {'code': 'file_missing', 'message': 'Clip file not found on disk.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Derive a friendly filename for the download ───────────────────────
        safe_title = ''.join(
            c if c.isalnum() or c in (' ', '-', '_') else '_'
            for c in (cut.title or f'clip_{cut.cut_order}')
        ).strip()[:60]
        download_filename = f"{safe_title}.mp4"

        # ── Stream the file with attachment disposition ───────────────────────
        file_handle = open(file_path, 'rb')
        response = FileResponse(
            file_handle,
            content_type='video/mp4',
            as_attachment=True,
            filename=download_filename,
        )
        return response
