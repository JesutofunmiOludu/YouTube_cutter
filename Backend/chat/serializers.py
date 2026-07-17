from rest_framework import serializers
from .models import (
    ChatSession, ChatSessionVideo, ChatMessage,
    ResearchSession, ResearchSource,
)
from videos.serializers import UserVideoSerializer


# ── ChatMessage ────────────────────────────────────────────
class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ChatMessage
        fields = ('id', 'role', 'content', 'token_count', 'created_at')
        read_only_fields = ('id', 'role', 'token_count', 'created_at')

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError('Message content cannot be empty.')
        return value


# ── ChatSession (list) ─────────────────────────────────────
class ChatSessionSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    video_count  = serializers.SerializerMethodField()
    video_ids    = serializers.SerializerMethodField()

    class Meta:
        model  = ChatSession
        fields = ('id', 'title', 'is_multi_video', 'video_count', 'video_ids', 'last_message', 'created_at', 'updated_at')
        read_only_fields = ('id', 'is_multi_video', 'video_count', 'video_ids', 'last_message', 'created_at', 'updated_at')

    def get_last_message(self, obj):
        msg = obj.messages.last()
        if msg:
            return {'role': msg.role, 'content': msg.content[:100], 'created_at': msg.created_at}
        return None

    def get_video_count(self, obj):
        return obj.session_videos.count()

    def get_video_ids(self, obj):
        return [str(sv.user_video_id) for sv in obj.session_videos.all()]



# ── ChatSession (detail — includes messages and videos) ────
class ChatSessionDetailSerializer(ChatSessionSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    videos   = serializers.SerializerMethodField()

    class Meta(ChatSessionSerializer.Meta):
        fields = ChatSessionSerializer.Meta.fields + ('messages', 'videos')

    def get_videos(self, obj):
        user_videos = [sv.user_video for sv in obj.session_videos.select_related('user_video__video').all()]
        return UserVideoSerializer(user_videos, many=True).data


# ── ResearchSource ─────────────────────────────────────────
class ResearchSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResearchSource
        fields = ('id', 'source_type', 'title', 'url', 'excerpt', 'relevance_rank', 'fetched_at')
        read_only_fields = fields


# ── ResearchSession (list) ─────────────────────────────────
class ResearchSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ResearchSession
        fields = ('id', 'user_video', 'title', 'status', 'created_at', 'updated_at')
        read_only_fields = ('id', 'user_video', 'status', 'created_at', 'updated_at')


# ── ResearchSession (detail — includes report + sources) ───
class ResearchSessionDetailSerializer(ResearchSessionSerializer):
    sources    = ResearchSourceSerializer(many=True, read_only=True)
    user_video = UserVideoSerializer(read_only=True)

    class Meta(ResearchSessionSerializer.Meta):
        fields = ResearchSessionSerializer.Meta.fields + ('report_content', 'completed_at', 'sources')
