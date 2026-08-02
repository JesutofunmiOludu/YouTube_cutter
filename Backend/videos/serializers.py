from rest_framework import serializers
from .models import Video, UserVideo, VideoCut, Transcription, TranscriptSegment


# ── Video (shared metadata) ────────────────────────────────
class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Video
        fields = (
            'id', 'youtube_id', 'title', 'description',
            'thumbnail_url', 'duration_seconds',
            'channel_id', 'channel_name', 'category',
            'published_at', 'created_at',
        )
        read_only_fields = fields


# ── TranscriptSegment ──────────────────────────────────────
class TranscriptSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TranscriptSegment
        fields = (
            'id', 'segment_order', 'start_seconds',
            'end_seconds', 'text', 'confidence_score',
        )


# ── Transcription (with nested segments) ──────────────────
class TranscriptionSerializer(serializers.ModelSerializer):
    segments = TranscriptSegmentSerializer(many=True, read_only=True)

    class Meta:
        model  = Transcription
        fields = (
            'id', 'language_code', 'full_text', 'status',
            'export_url_txt', 'export_url_pdf', 'export_url_md',
            'completed_at', 'created_at', 'segments',
        )
        read_only_fields = fields


# ── VideoCut ───────────────────────────────────────────────
class VideoCutSerializer(serializers.ModelSerializer):
    duration_seconds = serializers.IntegerField(read_only=True)  # property

    class Meta:
        model  = VideoCut
        fields = (
            'id', 'cut_order', 'start_seconds', 'end_seconds',
            'duration_seconds', 'title', 'ai_rationale',
            'ai_suggested', 'is_fallback', 'user_approved',
            'download_url', 'download_status',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'cut_order', 'duration_seconds',
            'ai_suggested', 'is_fallback', 'download_url', 'download_status',
            'created_at', 'updated_at',
        )

    def validate(self, attrs):
        start = attrs.get('start_seconds', getattr(self.instance, 'start_seconds', None))
        end   = attrs.get('end_seconds',   getattr(self.instance, 'end_seconds',   None))
        if start is not None and end is not None and end <= start:
            raise serializers.ValidationError('end_seconds must be greater than start_seconds.')
        return attrs


# ── UserVideo (list / detail) ──────────────────────────────
class UserVideoSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)
    youtube_id  = serializers.CharField(write_only=True, help_text='YouTube video ID to save')

    class Meta:
        model  = UserVideo
        fields = (
            'id', 'video', 'youtube_id',
            'storage_type', 'file_url',
            'processing_status', 'processing_stage', 'saved_at', 'last_accessed_at',
        )
        read_only_fields = (
            'id', 'video', 'file_url',
            'processing_status', 'processing_stage', 'saved_at', 'last_accessed_at',
        )

    def validate_storage_type(self, value):
        if value == UserVideo.StorageType.SERVER:
            from billing.services import UsageService
            request = self.context.get('request')
            if request and hasattr(request, 'user') and not UsageService.is_premium(request.user):
                raise serializers.ValidationError('Server file storage requires a Premium subscription.')
        return value

    def create(self, validated_data):
        youtube_id   = validated_data.pop('youtube_id')
        user         = self.context['request'].user

        # Get or create the shared Video record
        from .utils import fetch_or_create_video
        video = fetch_or_create_video(youtube_id)

        user_video, created = UserVideo.objects.get_or_create(
            user=user,
            video=video,
            defaults={'storage_type': validated_data.get('storage_type', UserVideo.StorageType.REFERENCE)},
        )

        if created:
            from .processing_pipeline import trigger_processing_if_needed
            trigger_processing_if_needed(user_video)

        return user_video


# ── UserVideo detail (includes cuts + transcription) ──────
class UserVideoDetailSerializer(UserVideoSerializer):
    cuts         = VideoCutSerializer(many=True, read_only=True)
    transcription = TranscriptionSerializer(read_only=True)

    class Meta(UserVideoSerializer.Meta):
        fields = UserVideoSerializer.Meta.fields + ('cuts', 'transcription')
