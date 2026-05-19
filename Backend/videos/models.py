import uuid

from django.conf import settings
from django.db import models


# ──────────────────────────────────────────────
# Video (shared YouTube metadata)
# ──────────────────────────────────────────────
class Video(models.Model):
    """
    Shared YouTube video metadata. A video record is created once
    and reused across users — not duplicated per user.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    youtube_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="YouTube video ID, e.g. dQw4w9WgXcQ",
    )
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True, null=True)
    thumbnail_url = models.URLField(max_length=500, blank=True, null=True)
    duration_seconds = models.IntegerField()
    channel_id = models.CharField(max_length=50, help_text="YouTube channel ID")
    channel_name = models.CharField(max_length=255, help_text="Stored for display without extra API calls")
    category = models.CharField(max_length=100, blank=True, null=True, help_text="YouTube category")
    published_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "video"

    def __str__(self):
        return self.title


# ──────────────────────────────────────────────
# UserVideo (user ↔ video junction)
# ──────────────────────────────────────────────
class UserVideo(models.Model):
    """
    Junction table linking a user to a video they have saved.
    Stores user-specific metadata (storage type, processing state).
    """

    class StorageType(models.TextChoices):
        REFERENCE = "reference", "Reference (free)"
        SERVER = "server", "Server (premium)"

    class ProcessingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="user_videos",
    )
    video = models.ForeignKey(
        Video,
        on_delete=models.CASCADE,
        related_name="user_videos",
    )
    storage_type = models.CharField(
        max_length=20,
        choices=StorageType.choices,
        default=StorageType.REFERENCE,
    )
    file_url = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Only populated for premium server storage",
    )
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    saved_at = models.DateTimeField(auto_now_add=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "user_video"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "video"],
                name="unique_user_video",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} — {self.video.title}"


# ──────────────────────────────────────────────
# VideoCut (segments per user_video)
# ──────────────────────────────────────────────
class VideoCut(models.Model):
    """
    Individual cut segments of a user's video.
    Cuts belong to a UserVideo (user-specific), not directly to a Video.
    """

    class DownloadStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_video = models.ForeignKey(
        UserVideo,
        on_delete=models.CASCADE,
        related_name="cuts",
    )
    cut_order = models.IntegerField(help_text="Display order of the cut")
    start_seconds = models.IntegerField(help_text="Cut start point in seconds")
    end_seconds = models.IntegerField(help_text="Cut end point in seconds")
    title = models.CharField(max_length=255, blank=True, null=True, help_text="AI-generated or user-set title")
    ai_rationale = models.TextField(blank=True, null=True, help_text="AI's explanation for this cut point")
    ai_suggested = models.BooleanField(default=True, help_text="Was this cut AI-suggested?")
    user_approved = models.BooleanField(default=False, help_text="Has user approved this cut?")
    download_url = models.URLField(max_length=500, blank=True, null=True)
    download_status = models.CharField(
        max_length=20,
        choices=DownloadStatus.choices,
        default=DownloadStatus.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "video_cut"
        ordering = ["cut_order"]

    def __str__(self):
        return f"Cut #{self.cut_order}: {self.start_seconds}s–{self.end_seconds}s"

    @property
    def duration_seconds(self):
        return self.end_seconds - self.start_seconds


# ──────────────────────────────────────────────
# Transcription (one per user_video)
# ──────────────────────────────────────────────
class Transcription(models.Model):
    """One transcription per user_video. Full text and export file URLs."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user_video = models.OneToOneField(
        UserVideo,
        on_delete=models.CASCADE,
        related_name="transcription",
    )
    language_code = models.ForeignKey(
        "Users.Language",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        to_field="code",
        db_column="language_code",
        related_name="transcriptions",
    )
    full_text = models.TextField(blank=True, null=True, help_text="Complete transcription text")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    export_url_txt = models.URLField(max_length=500, blank=True, null=True)
    export_url_pdf = models.URLField(max_length=500, blank=True, null=True)
    export_url_md = models.URLField(max_length=500, blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "transcription"

    def __str__(self):
        return f"Transcription for {self.user_video}"


# ──────────────────────────────────────────────
# TranscriptSegment (timestamped text chunks)
# ──────────────────────────────────────────────
class TranscriptSegment(models.Model):
    """
    Individual timestamped segments of a transcription.
    Separated from Transcription to satisfy 2NF — segment text
    depends on segment_id, not transcription_id.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transcription = models.ForeignKey(
        Transcription,
        on_delete=models.CASCADE,
        related_name="segments",
    )
    segment_order = models.IntegerField()
    start_seconds = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        help_text="Precise start time",
    )
    end_seconds = models.DecimalField(
        max_digits=8,
        decimal_places=3,
        help_text="Precise end time",
    )
    text = models.TextField()
    confidence_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="0.0000 to 1.0000",
    )

    class Meta:
        db_table = "transcript_segment"
        ordering = ["segment_order"]

    def __str__(self):
        return f"Segment #{self.segment_order}: {self.text[:50]}"
