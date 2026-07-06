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
    POST triggers a Gemini research report.
    Throttled to 'research' scope (10/hour).
    Freemium: 1 research report per month on free tier.
    """
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope     = 'research'
    throttle_classes   = [ScopedRateThrottle]

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

        # Trigger Gemini research generation synchronously
        # (move to a Celery task for production)
        _run_research(session)

        # Return the fully populated session
        detail = ResearchSessionDetailSerializer(session)
        return Response(detail.data, status=status.HTTP_201_CREATED)


# ── GET /api/research/<id>/ ────────────────────────────────
class ResearchSessionDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class   = ResearchSessionDetailSerializer

    def get_queryset(self):
        return ResearchSession.objects.filter(user=self.request.user)


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
    Use Gemini to generate a structured research report + sources,
    then persist them to the database.
    """
    session.status = ResearchSession.Status.PROCESSING
    session.save(update_fields=['status'])

    try:
        report_md, raw_sources = gemini_service.generate_research_report(session)

        # Persist the report
        session.report_content = report_md
        session.status         = ResearchSession.Status.COMPLETED
        session.completed_at   = timezone.now()
        session.save(update_fields=['report_content', 'status', 'completed_at'])

        # Persist each source returned by Gemini
        for source_data in raw_sources:
            ResearchSource.objects.create(
                research_session=session,
                source_type=source_data.get('source_type', 'website'),
                title=source_data.get('title', '')[:500],
                url=source_data.get('url', ''),
                excerpt=source_data.get('excerpt', ''),
                relevance_rank=source_data.get('relevance_rank', 99),
            )

    except Exception as exc:  # noqa: BLE001
        import logging
        logging.getLogger(__name__).error('Research generation failed: %s', exc)
        session.status = ResearchSession.Status.FAILED
        session.save(update_fields=['status'])
