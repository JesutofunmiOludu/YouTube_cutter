from django.contrib import admin
from .models import (
    ChatSession, ChatSessionVideo, ChatMessage,
    ResearchSession, ResearchSource,
    VideoRecommendation,
)


class ChatSessionVideoInline(admin.TabularInline):
    model       = ChatSessionVideo
    extra       = 0
    raw_id_fields = ('user_video',)
    readonly_fields = ('id', 'added_at')


class ChatMessageInline(admin.TabularInline):
    model       = ChatMessage
    extra       = 0
    readonly_fields = ('id', 'created_at')
    fields      = ('role', 'content', 'token_count', 'created_at')


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display  = ('title', 'user', 'is_multi_video', 'created_at', 'updated_at')
    list_filter   = ('is_multi_video',)
    search_fields = ('user__email', 'title')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('user',)
    inlines       = [ChatSessionVideoInline, ChatMessageInline]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display  = ('chat_session', 'role', 'content_preview', 'created_at')
    list_filter   = ('role',)
    readonly_fields = ('id', 'created_at')
    raw_id_fields = ('chat_session',)

    @admin.display(description='Content')
    def content_preview(self, obj):
        return obj.content[:80]


class ResearchSourceInline(admin.TabularInline):
    model       = ResearchSource
    extra       = 0
    readonly_fields = ('id', 'fetched_at')
    fields      = ('source_type', 'title', 'url', 'relevance_rank', 'fetched_at')


@admin.register(ResearchSession)
class ResearchSessionAdmin(admin.ModelAdmin):
    list_display  = ('title', 'user', 'user_video', 'status', 'created_at')
    list_filter   = ('status',)
    search_fields = ('user__email', 'title')
    readonly_fields = ('id', 'created_at', 'updated_at', 'completed_at')
    raw_id_fields = ('user', 'user_video')
    inlines       = [ResearchSourceInline]


@admin.register(VideoRecommendation)
class VideoRecommendationAdmin(admin.ModelAdmin):
    list_display  = ('recommended_title', 'source_user_video', 'recommendation_type', 'relevance_score')
    list_filter   = ('recommendation_type',)
    readonly_fields = ('id', 'created_at')
