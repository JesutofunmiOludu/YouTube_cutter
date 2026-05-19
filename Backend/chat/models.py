import uuid

from django.conf import settings
from django.db import models


# ──────────────────────────────────────────────
# ChatSession (conversation workspace)
# ──────────────────────────────────────────────
class ChatSession(models.Model):
    """
    A conversation workspace. Can contain one or many videos.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_sessions",
    )
    title = models.CharField(max_length=255, blank=True, null=True, help_text="Auto-generated or user-set")
    is_multi_video = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chat_session"
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title or f"Chat {self.id}"


# ──────────────────────────────────────────────
# ChatSessionVideo (junction: chat ↔ videos)
# ──────────────────────────────────────────────
class ChatSessionVideo(models.Model):
    """
    Junction table — links one or more user_videos to a chat session.
    Extracted to eliminate multi-valued facts in ChatSession.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="session_videos",
    )
    user_video = models.ForeignKey(
        "videos.UserVideo",
        on_delete=models.CASCADE,
        related_name="chat_sessions",
    )
    added_order = models.IntegerField(help_text="Order in which videos were added")
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_session_video"
        constraints = [
            models.UniqueConstraint(
                fields=["chat_session", "user_video"],
                name="unique_chat_session_video",
            ),
        ]

    def __str__(self):
        return f"Chat {self.chat_session_id} ↔ Video {self.user_video_id}"


# ──────────────────────────────────────────────
# ChatMessage (individual messages)
# ──────────────────────────────────────────────
class ChatMessage(models.Model):
    """
    Individual messages in a chat session.
    Separated from ChatSession — messages are a multi-valued fact.
    """

    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    chat_session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    metadata = models.JSONField(
        null=True,
        blank=True,
        help_text="Token usage, model used, response time, etc.",
    )
    token_count = models.IntegerField(null=True, blank=True, help_text="For cost tracking")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_message"
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"


# ──────────────────────────────────────────────
# ResearchSession (deep research)
# ──────────────────────────────────────────────
class ResearchSession(models.Model):
    """A deep research session linked to a specific user video."""

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="research_sessions",
    )
    user_video = models.ForeignKey(
        "videos.UserVideo",
        on_delete=models.CASCADE,
        related_name="research_sessions",
    )
    title = models.CharField(max_length=255, blank=True, null=True, help_text="Research topic/title")
    report_content = models.TextField(blank=True, null=True, help_text="Full generated research report")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "research_session"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title or f"Research {self.id}"


# ──────────────────────────────────────────────
# ResearchSource (cited sources)
# ──────────────────────────────────────────────
class ResearchSource(models.Model):
    """
    Individual sources cited in a research report.
    Separated to eliminate multi-valued facts in ResearchSession.
    """

    class SourceType(models.TextChoices):
        ARTICLE = "article", "Article"
        PAPER = "paper", "Paper"
        WEBSITE = "website", "Website"
        VIDEO = "video", "Video"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    research_session = models.ForeignKey(
        ResearchSession,
        on_delete=models.CASCADE,
        related_name="sources",
    )
    source_type = models.CharField(max_length=20, choices=SourceType.choices)
    title = models.CharField(max_length=500)
    url = models.URLField(max_length=1000)
    excerpt = models.TextField(blank=True, null=True, help_text="Relevant excerpt from source")
    relevance_rank = models.IntegerField(help_text="Ordering by relevance")
    fetched_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "research_source"
        ordering = ["relevance_rank"]

    def __str__(self):
        return f"[{self.source_type}] {self.title[:50]}"


# ──────────────────────────────────────────────
# VideoRecommendation
# ──────────────────────────────────────────────
class VideoRecommendation(models.Model):
    """AI-generated video recommendations based on a user's saved video."""

    class RecommendationType(models.TextChoices):
        RELATED_VIDEO = "related_video", "Related Video"
        RELATED_ARTICLE = "related_article", "Related Article"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    source_user_video = models.ForeignKey(
        "videos.UserVideo",
        on_delete=models.CASCADE,
        related_name="recommendations",
        help_text="The video that generated this recommendation",
    )
    recommended_youtube_id = models.CharField(max_length=20)
    recommended_title = models.CharField(max_length=500)
    recommended_thumbnail_url = models.URLField(max_length=500, blank=True, null=True)
    recommendation_type = models.CharField(
        max_length=20,
        choices=RecommendationType.choices,
    )
    relevance_score = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        null=True,
        blank=True,
        help_text="0.0000 to 1.0000",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "video_recommendation"

    def __str__(self):
        return f"Rec: {self.recommended_title[:50]}"
