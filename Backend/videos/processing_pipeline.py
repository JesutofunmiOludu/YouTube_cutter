"""
videos/processing_pipeline.py
==============================
Orchestrates the full video setup pipeline that runs once, immediately after
a new UserVideo record is created.

Pipeline steps
--------------
1.  Set processing_status → PROCESSING
2.  Fetch real YouTube transcript (via transcript_service)
3.  Generate AI-powered cut suggestions (via ai_service)
4.  Persist cuts to VideoCut table
5.  Set processing_status → COMPLETED (or FAILED)

This runs synchronously in the request/response cycle for now.
To move to async processing, wrap run_video_setup() in a Celery task.
"""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from videos.models import UserVideo

logger = logging.getLogger(__name__)


def run_video_setup(user_video: 'UserVideo') -> None:
    """
    Full setup pipeline for a newly created UserVideo.
    Safe to call multiple times — VideoCut records are deleted and rebuilt,
    and TranscriptSegments are replaced inside transcript_service.

    Never raises — all errors are caught and logged; processing_status is
    set to FAILED on unrecoverable errors.
    """
    from videos.models import UserVideo as UV, VideoCut
    from videos.transcript_service import fetch_and_save_transcript
    from videos import ai_service

    # ── 1. Mark as in-progress ──────────────────────────────
    user_video.processing_status = UV.ProcessingStatus.PROCESSING
    user_video.save(update_fields=['processing_status'])

    try:
        # ── 2. Fetch real transcript ─────────────────────────
        transcript_ok, language_code = fetch_and_save_transcript(user_video)

        if transcript_ok:
            logger.info(
                'Transcript ready for UserVideo %s (lang=%s)',
                user_video.id, language_code,
            )
            # ── 3. Generate AI cut suggestions from transcript ───
            suggested_cuts = ai_service.suggest_cuts(user_video)
        else:
            # Fallback path: download audio and use Gemini multimodal transcription + cuts
            logger.info('YouTube transcript unavailable. Falling back to Gemini Multimodal Audio...')
            from .utils import download_youtube_audio
            import os
            
            audio_path = None
            suggested_cuts = []
            try:
                audio_path = download_youtube_audio(user_video.video.youtube_id)
                suggested_cuts, transcript_segs = ai_service.suggest_cuts_and_transcript_from_audio(
                    user_video, audio_path
                )
                
                # Save the generated transcript to DB if we got segments back
                if transcript_segs:
                    from videos.models import Transcription, TranscriptSegment
                    from django.utils import timezone
                    
                    transcription, _ = Transcription.objects.get_or_create(
                        user_video=user_video,
                        defaults={'status': Transcription.Status.PROCESSING},
                    )
                    # Clear stubs
                    TranscriptSegment.objects.filter(transcription=transcription).delete()
                    
                    segs_to_create = []
                    full_text_parts = []
                    for seg in transcript_segs:
                        full_text_parts.append(seg['text'])
                        segs_to_create.append(
                            TranscriptSegment(
                                transcription=transcription,
                                segment_order=seg['segment_order'],
                                start_seconds=seg['start_seconds'],
                                end_seconds=seg['end_seconds'],
                                text=seg['text'],
                            )
                        )
                    TranscriptSegment.objects.bulk_create(segs_to_create)
                    transcription.full_text = ' '.join(full_text_parts)
                    transcription.status = Transcription.Status.COMPLETED
                    transcription.completed_at = timezone.now()
                    transcription.save(update_fields=['full_text', 'status', 'completed_at'])
                    logger.info('Saved Gemini-generated transcript for UserVideo %s', user_video.id)
                else:
                    logger.warning('Gemini audio processing returned no transcript segments.')
                    
            except Exception as audio_exc:
                logger.error('Audio fallback processing failed: %s', audio_exc)
                # Fallback to standard suggest_cuts which handles stubs automatically
                suggested_cuts = ai_service.suggest_cuts(user_video)
            finally:
                # Cleanup temp audio file
                if audio_path and os.path.exists(audio_path):
                    try:
                        os.remove(audio_path)
                        logger.info('Cleaned up temporary audio file %s', audio_path)
                    except Exception as del_exc:
                        logger.warning('Failed to remove temp audio file %s: %s', audio_path, del_exc)

        # ── 4. Persist cuts ──────────────────────────────────
        # Delete any previously created cuts (idempotent re-processing)
        VideoCut.objects.filter(user_video=user_video).delete()

        cuts_to_create = []
        for order, cut in enumerate(suggested_cuts, start=1):
            cuts_to_create.append(
                VideoCut(
                    user_video=user_video,
                    cut_order=order,
                    start_seconds=int(cut['start_seconds']),
                    end_seconds=int(cut['end_seconds']),
                    title=cut.get('title', f'Segment {order}'),
                    ai_rationale=cut.get('rationale', ''),
                    ai_suggested=True,
                    user_approved=False,
                )
            )
        VideoCut.objects.bulk_create(cuts_to_create)

        logger.info(
            'Created %d cut(s) for UserVideo %s.',
            len(cuts_to_create), user_video.id,
        )

        # ── 5. Mark complete ─────────────────────────────────
        user_video.processing_status = UV.ProcessingStatus.COMPLETED
        user_video.save(update_fields=['processing_status'])

    except Exception as exc:  # noqa: BLE001
        logger.error(
            'Video setup pipeline failed for UserVideo %s: %s',
            user_video.id, exc, exc_info=True,
        )
        user_video.processing_status = UV.ProcessingStatus.FAILED
        user_video.save(update_fields=['processing_status'])
