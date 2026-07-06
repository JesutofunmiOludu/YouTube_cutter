"""
videos/ai_service.py
====================
Gemini-powered AI service for video analysis.

Responsibilities
----------------
- suggest_cuts(user_video) → list[dict]
    Analyse the transcript and suggest optimal edit cut points.
"""
from __future__ import annotations

import json
import logging
import re
import textwrap
from typing import TYPE_CHECKING

import google.generativeai as genai
from django.conf import settings

if TYPE_CHECKING:
    from videos.models import UserVideo

logger = logging.getLogger(__name__)

CUT_MODEL = 'gemini-1.5-flash'


# ── Private: SDK client ────────────────────────────────────

def _get_model(model_name: str = CUT_MODEL):
    """Configure the Gemini SDK and return a GenerativeModel, or None if no key."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — AI cut suggestions will return stubs.')
        return None
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name=model_name)


# ── Public API ─────────────────────────────────────────────

def suggest_cuts(user_video: 'UserVideo') -> list[dict]:
    """
    Analyse the video transcript using Gemini and return a list of suggested
    cut points.

    Each item in the returned list is a dict:
    {
        "start_seconds": int,
        "end_seconds":   int,
        "title":         str,   # Short descriptive title for this segment
        "rationale":     str,   # Why this is a good cut point
    }

    Falls back to a sensible stub when no API key is configured.
    """
    model = _get_model()
    if model is None:
        return _stub_cuts(user_video)

    transcript_text = _build_transcript(user_video)
    video = user_video.video

    prompt = textwrap.dedent(f"""
        You are an expert video editor. A user has uploaded a YouTube video and wants
        AI-suggested cut points to break it into digestible segments.

        **Video Details**
        - Title: {video.title}
        - Channel: {video.channel_name}
        - Total Duration: {video.duration_seconds} seconds

        **Transcript** (with timestamps in seconds):
        {transcript_text or "(No transcript available — suggest cuts based on typical content pacing for this type of video)"}

        ---

        Analyse the content and identify the best 4–8 natural cut points that would
        create standalone, shareable video segments.

        For each segment, provide:
        - start_seconds (integer)
        - end_seconds (integer)
        - title (max 60 chars — a concise, engaging title for this segment)
        - rationale (1–2 sentences explaining why this is a good cut)

        Rules:
        - Segments must be contiguous and cover the full video (first segment starts at 0, last ends at {video.duration_seconds})
        - Each segment should be between 30 seconds and 10 minutes long
        - Cut at natural topic changes, not mid-sentence
        - If the video is under 2 minutes, suggest 2–3 segments only

        Respond ONLY with a valid JSON array, no markdown fences, no extra text:
        [
          {{
            "start_seconds": 0,
            "end_seconds": 120,
            "title": "Introduction",
            "rationale": "Natural intro section before the main topic begins."
          }},
          ...
        ]
    """).strip()

    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.3,          # Deterministic for structured output
                response_mime_type='application/json',
            ),
        )
        raw = response.text.strip()
        return _parse_cuts(raw, user_video)

    except Exception as exc:  # noqa: BLE001
        logger.error('Gemini cut suggestion failed for video %s: %s', user_video.id, exc)
        return _stub_cuts(user_video)


# ── Private helpers ────────────────────────────────────────

def _build_transcript(user_video: 'UserVideo') -> str:
    """Build a timestamped transcript string from DB segments."""
    try:
        transcription = user_video.transcription
        segments = transcription.segments.order_by('segment_order')
        if not segments.exists():
            return ''
        return '\n'.join(
            f'[{int(seg.start_seconds)}s] {seg.text}'
            for seg in segments
        )
    except Exception:  # noqa: BLE001
        return ''


def _parse_cuts(raw: str, user_video: 'UserVideo') -> list[dict]:
    """
    Parse the Gemini JSON response into a validated list of cut dicts.
    Falls back to stub on any parse/validation error.
    """
    # Strip any accidental markdown fences
    cleaned = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw, flags=re.MULTILINE).strip()

    try:
        cuts = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error('Failed to parse Gemini cut response: %s\nRaw: %s', exc, raw[:500])
        return _stub_cuts(user_video)

    if not isinstance(cuts, list):
        logger.error('Gemini returned non-list cuts: %s', type(cuts))
        return _stub_cuts(user_video)

    validated = []
    total_duration = user_video.video.duration_seconds or 0

    for item in cuts:
        try:
            start = int(item['start_seconds'])
            end   = int(item['end_seconds'])
            title = str(item.get('title', 'Segment'))[:200]
            rationale = str(item.get('rationale', ''))[:500]

            if end <= start:
                continue
            if start < 0 or (total_duration and end > total_duration + 10):
                continue

            validated.append({
                'start_seconds': start,
                'end_seconds':   end,
                'title':         title,
                'rationale':     rationale,
            })
        except (KeyError, ValueError, TypeError):
            continue

    if not validated:
        logger.warning('Gemini returned no valid cuts — using stub fallback.')
        return _stub_cuts(user_video)

    return validated


def _stub_cuts(user_video: 'UserVideo') -> list[dict]:
    """
    Return simple equally-spaced stub cuts when Gemini is unavailable.
    Ensures the workspace always has something to show.
    """
    total = user_video.video.duration_seconds or 300
    segment_count = max(2, min(6, total // 60))
    step = total // segment_count

    return [
        {
            'start_seconds': i * step,
            'end_seconds':   min((i + 1) * step, total),
            'title':         f'Segment {i + 1}',
            'rationale':     'Auto-generated stub cut (configure GEMINI_API_KEY for AI suggestions).',
        }
        for i in range(segment_count)
    ]
