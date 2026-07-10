"""
videos/transcript_service.py
============================
Fetches real YouTube transcripts using youtube-transcript-api and persists
them to the Transcription + TranscriptSegment models.

Usage
-----
    from videos.transcript_service import fetch_and_save_transcript
    success, lang = fetch_and_save_transcript(user_video)

Returns
-------
    (success: bool, language_code: str | None)
      - success=True  → transcription.status set to COMPLETED
      - success=False → transcription.status set to FAILED (segments deleted/not created)
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import TYPE_CHECKING

from django.utils import timezone

if TYPE_CHECKING:
    from videos.models import UserVideo

logger = logging.getLogger(__name__)

# Language priority list — tries manual English first, auto-generated as fallback
_PREFERRED_LANGUAGES = ['en', 'en-US', 'en-GB', 'en-CA', 'en-AU']


def fetch_and_save_transcript(user_video: 'UserVideo') -> tuple[bool, str | None]:
    """
    Fetch the YouTube transcript for the given UserVideo and save it to the DB.

    Tries languages in _PREFERRED_LANGUAGES order. If no preferred language
    is available, falls back to the first available transcript (manual, then
    auto-generated).

    Returns:
        (success, language_code) — language_code is None on failure.
    """
    from videos.models import Transcription, TranscriptSegment

    youtube_id = user_video.video.youtube_id

    # ── Get or create the Transcription record ──────────────
    transcription, _ = Transcription.objects.get_or_create(
        user_video=user_video,
        defaults={'status': Transcription.Status.PROCESSING},
    )
    transcription.status = Transcription.Status.PROCESSING
    transcription.save(update_fields=['status'])

    # ── Attempt to fetch the transcript ─────────────────────
    try:
        from youtube_transcript_api import YouTubeTranscriptApi

        ytt = YouTubeTranscriptApi()

        # Strategy 1: Preferred English languages
        fetched = None
        language_used = None
        try:
            fetched = ytt.fetch(youtube_id, languages=_PREFERRED_LANGUAGES)
            language_used = fetched.language_code
            logger.info(
                'Fetched transcript for %s in %s (is_generated=%s)',
                youtube_id, fetched.language_code, fetched.is_generated,
            )
        except Exception:
            # Strategy 2: Any available transcript
            logger.info(
                'No preferred-language transcript for %s — trying any available.',
                youtube_id,
            )
            try:
                transcript_list = ytt.list(youtube_id)
                # Prefer manually created transcripts, then generated
                transcript_obj = None
                try:
                    transcript_obj = transcript_list.find_manually_created_transcript(
                        _PREFERRED_LANGUAGES
                    )
                except Exception:
                    pass

                if transcript_obj is None:
                    try:
                        transcript_obj = transcript_list.find_generated_transcript(
                            _PREFERRED_LANGUAGES
                        )
                    except Exception:
                        pass

                if transcript_obj is None:
                    # Last resort: pick the very first transcript available
                    for t in transcript_list:
                        transcript_obj = t
                        break

                if transcript_obj is not None:
                    fetched = transcript_obj.fetch()
                    language_used = transcript_obj.language_code
                    logger.info(
                        'Fallback transcript fetched for %s in %s',
                        youtube_id, language_used,
                    )
            except Exception as inner_exc:
                logger.warning(
                    'No transcript available for %s: %s', youtube_id, inner_exc
                )

        if fetched is None:
            _mark_failed(transcription)
            return False, None

        # ── Persist the segments ─────────────────────────────
        # Remove any stale segments from a previous (stub) run
        TranscriptSegment.objects.filter(transcription=transcription).delete()

        segments_to_create = []
        full_text_parts: list[str] = []

        for idx, snippet in enumerate(fetched, start=1):
            start   = float(snippet.start)
            duration = float(snippet.duration)
            end     = start + duration
            text    = snippet.text.strip()

            if not text:
                continue

            full_text_parts.append(text)
            segments_to_create.append(
                TranscriptSegment(
                    transcription=transcription,
                    segment_order=idx,
                    start_seconds=Decimal(str(round(start, 3))),
                    end_seconds=Decimal(str(round(end, 3))),
                    text=text,
                    confidence_score=None,  # youtube-transcript-api doesn't expose this
                )
            )

        if not segments_to_create:
            logger.warning(
                'Transcript for %s returned 0 usable segments.', youtube_id
            )
            _mark_failed(transcription)
            return False, None

        TranscriptSegment.objects.bulk_create(segments_to_create)

        # ── Update the Transcription header ──────────────────
        transcription.full_text   = ' '.join(full_text_parts)
        transcription.status      = Transcription.Status.COMPLETED
        transcription.completed_at = timezone.now()
        transcription.save(update_fields=['full_text', 'status', 'completed_at'])

        logger.info(
            'Transcript saved for %s: %d segments in %s.',
            youtube_id, len(segments_to_create), language_used,
        )
        return True, language_used

    except Exception as exc:  # noqa: BLE001
        logger.error(
            'Unexpected error fetching transcript for %s: %s', youtube_id, exc
        )
        _mark_failed(transcription)
        return False, None


# ── Private helpers ────────────────────────────────────────

def _mark_failed(transcription) -> None:
    transcription.status = transcription.Status.FAILED
    transcription.save(update_fields=['status'])
