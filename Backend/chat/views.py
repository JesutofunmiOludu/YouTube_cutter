import logging

from django.core.exceptions import PermissionDenied
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from videos.models import UserVideo
from .models import (
    ChatSession, ChatSessionVideo, ChatMessage,
    ResearchSession, ResearchSource,
)
from .serializers import (
    ChatSessionSerializer, ChatSessionDetailSerializer,
    ChatMessageSerializer,
    ResearchSessionSerializer, ResearchSessionDetailSerializer,
)
from . import gemini_service
from billing.services import UsageService

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# CHAT
# ═══════════════════════════════════════════════════════════

# ── GET/POST /api/chat/sessions/ ──────────────────────────
class ChatSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ChatSession.objects
            .filter(user=self.request.user)
            .prefetch_related('session_videos', 'messages')
        )

    def get_serializer_class(self):
        return ChatSessionSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


# ── GET/DELETE /api/chat/sessions/<id>/ ───────────────────
class ChatSessionDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = ChatSessionDetailSerializer

    def get_queryset(self):
        return ChatSession.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.messages.count() == 0:
            first_sv = instance.session_videos.select_related('user_video__video').first()
            if first_sv:
                try:
                    from .gemini_service import generate_initial_video_overview
                    intro_content = generate_initial_video_overview(first_sv.user_video)
                    ChatMessage.objects.create(
                        chat_session=instance,
                        role=ChatMessage.Role.ASSISTANT,
                        content=intro_content,
                    )
                    instance.save(update_fields=['updated_at'])
                except Exception as exc:
                    logger.warning("Could not create initial chat overview: %s", exc)
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


# ── GET/POST /api/chat/sessions/<id>/messages/ ────────────
class ChatMessageListCreateView(generics.ListCreateAPIView):
    """
    POST: send a user message, get an AI reply.
    Throttled to 'chat' scope (100/hour).
    Freemium: counts towards daily chat_message allowance.
    """
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = ChatMessageSerializer
    throttle_scope     = 'chat'
    throttle_classes   = [ScopedRateThrottle]

    def _get_session(self):
        return ChatSession.objects.get(
            pk=self.kwargs['session_pk'],
            user=self.request.user,
        )

    def get_queryset(self):
        return ChatMessage.objects.filter(
            chat_session__pk=self.kwargs['session_pk'],
            chat_session__user=self.request.user,
        )

    def create(self, request, *args, **kwargs):
        # ── Freemium enforcement ──────────────────────────
        try:
            UsageService.check_and_increment(request.user, 'chat_message')
        except PermissionDenied as exc:
            return Response(
                {'error': {'code': 'plan_limit_reached', 'message': str(exc)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        session = self._get_session()

        # 1. Persist the user message
        user_msg = ChatMessage.objects.create(
            chat_session=session,
            role=ChatMessage.Role.USER,
            content=request.data.get('content', ''),
        )

        # 2. Generate AI reply (Gemini or stub)
        ai_reply_text = _generate_ai_reply(
            user_content=user_msg.content,
            session=session,
        )

        # 3. Persist the assistant message
        ai_msg = ChatMessage.objects.create(
            chat_session=session,
            role=ChatMessage.Role.ASSISTANT,
            content=ai_reply_text,
        )

        # 4. Touch updated_at on the session
        session.save(update_fields=['updated_at'])

        return Response(
            ChatMessageSerializer(ai_msg).data,
            status=status.HTTP_201_CREATED,
        )


# ── POST /api/chat/sessions/<id>/videos/ ──────────────────
class ChatSessionAddVideoView(APIView):
    """
    Add a user video to a chat session.
    Multi-video (>1 video) is a Premium feature.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_pk):
        try:
            session = ChatSession.objects.get(pk=session_pk, user=request.user)
        except ChatSession.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Chat session not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            user_video = UserVideo.objects.get(
                pk=request.data.get('user_video_id'),
                user=request.user,
            )
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        # ── Premium gate: multi-video sessions ────────────
        existing_count = session.session_videos.count()
        if existing_count >= 1 and not UsageService.is_premium(request.user):
            return Response(
                {
                    'error': {
                        'code':    'plan_limit_reached',
                        'message': 'Multi-video chat sessions require a Premium subscription.',
                    }
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        next_order = existing_count + 1
        ChatSessionVideo.objects.get_or_create(
            chat_session=session,
            user_video=user_video,
            defaults={'added_order': next_order},
        )
        if session.session_videos.count() > 1:
            session.is_multi_video = True
            session.save(update_fields=['is_multi_video', 'updated_at'])

        if session.messages.count() == 0:
            try:
                from .gemini_service import generate_initial_video_overview
                intro_content = generate_initial_video_overview(user_video)
                ChatMessage.objects.create(
                    chat_session=session,
                    role=ChatMessage.Role.ASSISTANT,
                    content=intro_content,
                )
                session.save(update_fields=['updated_at'])
            except Exception as exc:
                logger.warning("Could not create initial chat overview on add video: %s", exc)

        return Response({'status': 'video added'}, status=status.HTTP_200_OK)


# ── DELETE /api/chat/sessions/<id>/videos/<uv_id>/ ────────
class ChatSessionRemoveVideoView(APIView):
    """Remove a user video from a chat session."""
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_pk, uv_pk):
        deleted, _ = ChatSessionVideo.objects.filter(
            chat_session__pk=session_pk,
            chat_session__user=request.user,
            user_video__pk=uv_pk,
        ).delete()
        if not deleted:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not in this session.'}},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ═══════════════════════════════════════════════════════════
# RESEARCH
# ═══════════════════════════════════════════════════════════

# ── GET/POST /api/research/ ────────────────────────────────
class ResearchSessionListCreateView(generics.ListCreateAPIView):
    """
    GET  → list user's research sessions (no expensive throttle — runs on every workspace load).
    POST → trigger a Gemini research report (throttled to 'research' scope, 20/hour).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_throttles(self):
        """
        Only apply the expensive 'research' ScopedRateThrottle for write requests.
        Read (list) requests use only the default 'user' baseline throttle (1000/hour)
        so that every workspace page load does not burn the research creation quota.
        """
        if self.request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            self.throttle_scope = 'research'
            return [ScopedRateThrottle()]
        return []   # GET list: governed by the 'user' 1000/hour baseline only

    def get_queryset(self):
        return ResearchSession.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return ResearchSessionSerializer

    def create(self, request, *args, **kwargs):
        # ── Freemium enforcement ──────────────────────────
        try:
            UsageService.check_and_increment(request.user, 'research')
        except PermissionDenied as exc:
            return Response(
                {'error': {'code': 'plan_limit_reached', 'message': str(exc)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            user_video = UserVideo.objects.get(
                pk=request.data.get('user_video_id'),
                user=request.user,
            )
        except UserVideo.DoesNotExist:
            return Response(
                {'error': {'code': 'not_found', 'message': 'Video not found.'}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = serializer.save(user=request.user, user_video=user_video)

        # Trigger Gemini research generation asynchronously in a background thread
        import threading
        threading.Thread(target=_run_research, args=(session,), daemon=True).start()

        # Return the session details (which will show 'processing' status)
        detail = ResearchSessionDetailSerializer(session)
        return Response(detail.data, status=status.HTTP_201_CREATED)



# ── GET/DELETE /api/research/<id>/ ─────────────────────────
class ResearchSessionDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = ResearchSessionDetailSerializer

    def get_queryset(self):
        return ResearchSession.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Self-healing: if stuck in processing for > 15 minutes (server restarted/thread killed), mark failed & refund
        if instance.status == ResearchSession.Status.PROCESSING:
            delta = (timezone.now() - instance.created_at).total_seconds()
            if delta > 900:  # 15 minutes
                instance.status = ResearchSession.Status.FAILED
                instance.save(update_fields=['status'])
                try:
                    UsageService.refund_usage(instance.user, 'research')
                except Exception as exc:
                    logger.warning("Could not refund research quota on self-heal: %s", exc)

        # Cache completed reports (they are immutable)
        if instance.status == ResearchSession.Status.COMPLETED:
            from django.core.cache import cache
            cache_key = f"research_detail:{instance.id}"
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

            serializer = self.get_serializer(instance)
            cache.set(cache_key, serializer.data, timeout=86400)  # 24 hours
            return Response(serializer.data)

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def perform_destroy(self, instance):
        from django.core.cache import cache
        cache.delete(f"research_detail:{instance.id}")
        super().perform_destroy(instance)


# ═══════════════════════════════════════════════════════════
# AI helpers (powered by Gemini)
# ═══════════════════════════════════════════════════════════

def _generate_ai_reply(user_content: str, session: ChatSession) -> str:
    """
    Generate a Gemini reply grounded in the video transcript(s) attached to
    the chat session.  Falls back gracefully when no API key is configured.
    """
    return gemini_service.generate_chat_reply(
        user_content=user_content,
        session=session,
    )


def _run_research(session: ResearchSession) -> None:
    """
    Use Gemini Deep Research agent or grounded Google Search fallback to generate
    a structured research report + sources, polling in the background and persisting
    results to the database when complete. Automatically refunds quota on failure.
    """
    session.status = ResearchSession.Status.PROCESSING
    session.save(update_fields=['status'])

    # 1. Attempt to start Deep Research interaction on Google's servers
    interaction_id = gemini_service.start_deep_research_interaction(session)

    if not interaction_id:
        # Fallback: run grounded search generation directly via Gemini + Google Search
        try:
            report_md, raw_sources = gemini_service.generate_grounded_research_report(session)
            if report_md:
                session.report_content = report_md
                session.status         = ResearchSession.Status.COMPLETED
                session.completed_at   = timezone.now()
                session.save(update_fields=['report_content', 'status', 'completed_at'])

                ResearchSource.objects.filter(research_session=session).delete()
                for source_data in (raw_sources or []):
                    ResearchSource.objects.create(
                        research_session=session,
                        source_type=source_data.get('source_type', 'website'),
                        title=source_data.get('title', '')[:500],
                        url=source_data.get('url', ''),
                        excerpt=source_data.get('excerpt', ''),
                        relevance_rank=source_data.get('relevance_rank', 99),
                    )
                return
        except Exception as exc:
            logger.error('Grounded research fallback failed: %s', exc)
            session.status = ResearchSession.Status.FAILED
            session.save(update_fields=['status'])
            try:
                UsageService.refund_usage(session.user, 'research')
            except Exception as ref_exc:
                logger.warning('Could not refund research quota: %s', ref_exc)
            return

    # 2. Polling loop for active interaction
    session.research_interaction_id = interaction_id
    session.save(update_fields=['research_interaction_id'])

    import time
    completed = False
    attempts = 0
    max_attempts = 60  # 10 minutes max (each interaction check sleeps 10s)

    while not completed and attempts < max_attempts:
        try:
            report_md, raw_sources = gemini_service.poll_and_save_research(session)

            if report_md and not report_md.startswith("Research generation failed"):
                session.report_content = report_md
                session.status         = ResearchSession.Status.COMPLETED
                session.completed_at   = timezone.now()
                session.save(update_fields=['report_content', 'status', 'completed_at'])

                ResearchSource.objects.filter(research_session=session).delete()
                for source_data in (raw_sources or []):
                    ResearchSource.objects.create(
                        research_session=session,
                        source_type=source_data.get('source_type', 'website'),
                        title=source_data.get('title', '')[:500],
                        url=source_data.get('url', ''),
                        excerpt=source_data.get('excerpt', ''),
                        relevance_rank=source_data.get('relevance_rank', 99),
                    )
                completed = True
            elif report_md.startswith("Research generation failed"):
                session.status = ResearchSession.Status.FAILED
                session.save(update_fields=['status'])
                try:
                    UsageService.refund_usage(session.user, 'research')
                except Exception as ref_exc:
                    logger.warning('Could not refund research quota: %s', ref_exc)
                completed = True
            else:
                time.sleep(10)
                attempts += 1
        except Exception as exc:
            logger.error('Error in background research polling loop: %s', exc)
            session.status = ResearchSession.Status.FAILED
            session.save(update_fields=['status'])
            try:
                UsageService.refund_usage(session.user, 'research')
            except Exception as ref_exc:
                logger.warning('Could not refund research quota: %s', ref_exc)
            completed = True

    if not completed:
        logger.error('Deep Research polling timed out for session %s', session.id)
        session.status = ResearchSession.Status.FAILED
        session.save(update_fields=['status'])
        try:
            UsageService.refund_usage(session.user, 'research')
        except Exception as ref_exc:
            logger.warning('Could not refund research quota on timeout: %s', ref_exc)

