from django.contrib import admin
from .models import Video, UserVideo, VideoCut, Transcription, TranscriptSegment


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display  = ('title', 'youtube_id', 'channel_name', 'duration_seconds', 'created_at')
    search_fields = ('title', 'youtube_id', 'channel_name')
    readonly_fields = ('id', 'created_at')


@admin.register(UserVideo)
class UserVideoAdmin(admin.ModelAdmin):
    list_display  = ('user', 'video', 'storage_type', 'processing_status', 'saved_at')
    list_filter   = ('storage_type', 'processing_status')
    search_fields = ('user__email', 'video__title')
    readonly_fields = ('id', 'saved_at', 'last_accessed_at')
    raw_id_fields = ('user', 'video')


@admin.register(VideoCut)
class VideoCutAdmin(admin.ModelAdmin):
    list_display  = ('user_video', 'cut_order', 'start_seconds', 'end_seconds', 'user_approved', 'download_status')
    list_filter   = ('user_approved', 'ai_suggested', 'download_status')
    readonly_fields = ('id', 'created_at', 'updated_at')
    raw_id_fields = ('user_video',)


class TranscriptSegmentInline(admin.TabularInline):
    model  = TranscriptSegment
    extra  = 0
    fields = ('segment_order', 'start_seconds', 'end_seconds', 'text', 'confidence_score')
    readonly_fields = ('id',)


@admin.register(Transcription)
class TranscriptionAdmin(admin.ModelAdmin):
    list_display  = ('user_video', 'status', 'language_code', 'completed_at', 'created_at')
    list_filter   = ('status',)
    readonly_fields = ('id', 'created_at', 'completed_at')
    raw_id_fields = ('user_video',)
    inlines       = [TranscriptSegmentInline]
