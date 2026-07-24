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

import threading

logger = logging.getLogger(__name__)

ACTIVE_PROCESSES = set()
ACTIVE_LOCK = threading.Lock()


def trigger_processing_if_needed(user_video: 'UserVideo') -> None:
    """
    Triggers the video setup pipeline in a background thread if the video
    is in a pending/processing state and is not currently being worked on by
    another thread. This acts as a self-healing mechanism when the server restarts.
    """
    from videos.models import UserVideo as UV

    if user_video.processing_status not in (UV.ProcessingStatus.PENDING, UV.ProcessingStatus.PROCESSING):
        refresh_cuts_from_transcript_if_needed(user_video)
        return

    with ACTIVE_LOCK:
        if user_video.id in ACTIVE_PROCESSES:
            return
        ACTIVE_PROCESSES.add(user_video.id)

    logger.warning('Starting background setup thread for UserVideo %s (stage=%s)...', user_video.id, user_video.processing_stage)

    def _run():
        try:
            # Re-fetch instance in this thread to avoid stale DB state
            from videos.models import UserVideo as DBUserVideo
            fresh_uv = DBUserVideo.objects.get(pk=user_video.id)
            run_video_setup(fresh_uv)
        except Exception as e:
            logger.error('Error in background processing thread for UserVideo %s: %s', user_video.id, e, exc_info=True)
        finally:
            with ACTIVE_LOCK:
                ACTIVE_PROCESSES.discard(user_video.id)

    threading.Thread(target=_run, daemon=True).start()


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

    # Helper to update both status and stage in one DB save
    def _update(status: UV.ProcessingStatus, stage: UV.ProcessingStage):
        user_video.processing_status = status
        user_video.processing_stage = stage
        user_video.save(update_fields=['processing_status', 'processing_stage'])
        # Log as warning so it outputs to the console in default dev config
        stage_label = dict(UV.ProcessingStage.choices).get(stage, stage)
        logger.warning('[Video Processor] [%s] Stage: %s (%s)', user_video.video.title[:30], stage, stage_label)

    # ── 1. Mark as in-progress ──────────────────────────────
    _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.METADATA)

    try:
        # ── 2. Fetch real transcript ─────────────────────────
        _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.TRANSCRIPT)
        transcript_ok, language_code = fetch_and_save_transcript(user_video)

        if transcript_ok:
            logger.info(
                'Transcript ready for UserVideo %s (lang=%s)',
                user_video.id, language_code,
            )
            # ── 3. Generate AI cut suggestions from transcript ───
            _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.TRANSCRIBING)
            suggested_cuts = ai_service.suggest_cuts(user_video)
        else:
            # Fallback path: download audio and use Gemini multimodal transcription + cuts
            logger.info('YouTube transcript unavailable. Falling back to Gemini Multimodal Audio...')
            _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.DOWNLOADING)
            from .utils import download_youtube_audio
            import os
            
            audio_path = None
            suggested_cuts = []
            try:
                audio_path = download_youtube_audio(user_video.video.youtube_id)
                _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.TRANSCRIBING)
                suggested_cuts, transcript_segs = ai_service.suggest_cuts_and_transcript_from_audio(
                    user_video, audio_path
                )
                
                # Save the generated transcript to DB if we got segments back
                if transcript_segs:
                    _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.SAVING)
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
        _update(UV.ProcessingStatus.PROCESSING, UV.ProcessingStage.SAVING)
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
                    is_fallback=cut.get('is_fallback', False),
                    user_approved=False,
                )
            )
        VideoCut.objects.bulk_create(cuts_to_create)

        logger.info(
            'Created %d cut(s) for UserVideo %s (is_fallback=%s).',
            len(cuts_to_create), user_video.id, cuts_to_create[0].is_fallback if cuts_to_create else False,
        )

        # ── 5. Mark complete ─────────────────────────────────
        _update(UV.ProcessingStatus.COMPLETED, UV.ProcessingStage.COMPLETED)

    except Exception as exc:  # noqa: BLE001
        logger.error(
            'Video setup pipeline failed for UserVideo %s: %s',
            user_video.id, exc, exc_info=True,
        )
        _update(UV.ProcessingStatus.FAILED, UV.ProcessingStage.FAILED)


import re

STUB_TITLES = {'introduction', 'conclusion', 'early section', 'core content', 'wrap-up'}
STUB_PATTERNS = [re.compile(r'^part\s+\d+$', re.I), re.compile(r'^segment\s+\d+$', re.I)]


def _is_stub_cut(cut) -> bool:
    if cut.is_fallback:
        return True
    t = (cut.title or '').strip().lower()
    if t in STUB_TITLES or any(p.match(t) for p in STUB_PATTERNS):
        return True
    r = (cut.ai_rationale or '').lower()
    if 'opening section of' in r or 'middle section' in r or 'closing section of' in r or 'introductory remarks' in r:
        return True
    return False


def refresh_cuts_from_transcript_if_needed(user_video: 'UserVideo') -> bool:
    """
    Checks if a user_video has a valid completed transcription AND cuts that are still fallback stubs.
    If so, re-runs ai_service.suggest_cuts using the newly available transcript,
    and replaces unapproved fallback cuts while preserving any user-approved/edited cuts.
    Returns True if cuts were refreshed.
    """
    from videos.models import VideoCut, Transcription

    # Check if a completed transcription with segments exists
    try:
        transcription = Transcription.objects.prefetch_related('segments').get(
            user_video=user_video,
            status=Transcription.Status.COMPLETED,
        )
        if not transcription.segments.exists():
            return False
    except Transcription.DoesNotExist:
        return False

    # Check if the user_video has unapproved fallback cuts (by is_fallback flag or stub title patterns)
    unapproved_cuts = list(VideoCut.objects.filter(user_video=user_video, user_approved=False))
    fallback_cut_ids = [c.id for c in unapproved_cuts if _is_stub_cut(c)]

    if not fallback_cut_ids:
        return False

    fallback_cuts = VideoCut.objects.filter(id__in=fallback_cut_ids)

    logger.warning(
        '[Cut Refresh] Refreshing fallback cuts for UserVideo %s using newly available transcript...',
        user_video.id,
    )

    # 1. Delete unapproved fallback cuts
    fallback_cuts.delete()

    # 2. Re-generate AI cuts using the newly available transcript
    from videos import ai_service
    new_suggested_cuts = ai_service.suggest_cuts(user_video)

    # 3. Determine starting cut_order based on existing user-approved cuts
    existing_count = VideoCut.objects.filter(user_video=user_video).count()

    cuts_to_create = []
    for order, cut in enumerate(new_suggested_cuts, start=existing_count + 1):
        cuts_to_create.append(
            VideoCut(
                user_video=user_video,
                cut_order=order,
                start_seconds=int(cut['start_seconds']),
                end_seconds=int(cut['end_seconds']),
                title=cut.get('title', f'Segment {order}'),
                ai_rationale=cut.get('rationale', ''),
                ai_suggested=True,
                is_fallback=cut.get('is_fallback', False),
                user_approved=False,
            )
        )

    if cuts_to_create:
        VideoCut.objects.bulk_create(cuts_to_create)
        logger.warning(
            '[Cut Refresh] Successfully refreshed %d cuts for UserVideo %s.',
            len(cuts_to_create), user_video.id,
        )
        return True

    return False

