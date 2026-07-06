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
            'ai_suggested', 'user_approved',
            'download_url', 'download_status',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'cut_order', 'duration_seconds', 'ai_rationale',
            'ai_suggested', 'download_url', 'download_status',
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
            'processing_status', 'saved_at', 'last_accessed_at',
        )
        read_only_fields = (
            'id', 'video', 'file_url',
            'processing_status', 'saved_at', 'last_accessed_at',
        )

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
            # Seed default transcription and segments so workspace has data immediately
            from .models import Transcription, TranscriptSegment, VideoCut
            transcription = Transcription.objects.create(
                user_video=user_video,
                status=Transcription.Status.COMPLETED,
                full_text="Hey everyone, welcome to this complete course. Today we'll cover everything you need to know. We'll start with the fundamentals, then move into state management, side effects, and custom logic. This completely changed how we build. Let's dive in!"
            )
            # Seed 3 transcript segments
            TranscriptSegment.objects.create(
                transcription=transcription,
                segment_order=1,
                start_seconds=0.0,
                end_seconds=15.0,
                text="Hey everyone, welcome to this complete course. Today we'll cover everything you need to know."
            )
            TranscriptSegment.objects.create(
                transcription=transcription,
                segment_order=2,
                start_seconds=15.0,
                end_seconds=36.0,
                text="We'll start with the fundamentals, then move into state management, side effects, and custom logic."
            )
            TranscriptSegment.objects.create(
                transcription=transcription,
                segment_order=3,
                start_seconds=36.0,
                end_seconds=65.0,
                text="This completely changed how we build. Let's dive in!"
            )

            # Seed suggested cuts
            VideoCut.objects.create(
                user_video=user_video,
                cut_order=1,
                start_seconds=0,
                end_seconds=15,
                title="Introduction",
                ai_suggested=True,
                ai_rationale="Introductory chapter break.",
                user_approved=False
            )
            VideoCut.objects.create(
                user_video=user_video,
                cut_order=2,
                start_seconds=15,
                end_seconds=36,
                title="Fundamentals",
                ai_suggested=True,
                ai_rationale="Core concepts overview.",
                user_approved=False
            )
            VideoCut.objects.create(
                user_video=user_video,
                cut_order=3,
                start_seconds=36,
                end_seconds=65,
                title="Diving Deep",
                ai_suggested=True,
                ai_rationale="Deep dive shift.",
                user_approved=False
            )

            # Set status to completed
            user_video.processing_status = UserVideo.ProcessingStatus.COMPLETED
            user_video.save(update_fields=['processing_status'])

        return user_video


# ── UserVideo detail (includes cuts + transcription) ──────
class UserVideoDetailSerializer(UserVideoSerializer):
    cuts         = VideoCutSerializer(many=True, read_only=True)
    transcription = TranscriptionSerializer(read_only=True)

    class Meta(UserVideoSerializer.Meta):
        fields = UserVideoSerializer.Meta.fields + ('cuts', 'transcription')
