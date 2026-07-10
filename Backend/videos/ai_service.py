"""
videos/ai_service.py
====================
Gemini-powered AI service for video analysis using the new google-genai SDK.

Responsibilities
----------------
- suggest_cuts(user_video) → list[dict]
    Analyse the transcript and suggest optimal edit cut points.
- suggest_cuts_and_transcript_from_audio(user_video, audio_path) → tuple[list[dict], list[dict]]
    Extract transcript and cuts directly from a local audio file.
"""
from __future__ import annotations

import json
import logging
import re
import textwrap
from typing import TYPE_CHECKING

from google import genai
from google.genai import types
from django.conf import settings

if TYPE_CHECKING:
    from videos.models import UserVideo

logger = logging.getLogger(__name__)

CUT_MODEL = 'gemini-3.1-pro-preview'


# ── Private: SDK client ────────────────────────────────────

def _get_client() -> genai.Client | None:
    """Configure the Gemini SDK and return a Client, or None if no key."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — AI features will return stubs.')
        return None
    return genai.Client(api_key=api_key)


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
    client = _get_client()
    if client is None:
        return _stub_cuts(user_video)

    transcript_text = _build_transcript(user_video)
    video = user_video.video

    prompt = textwrap.dedent(f"""
        You are an expert video editor. A user has uploaded a YouTube video and wants
        AI-suggested cut points to break it into digestible, standalone segments.

        **Video Details**
        - Title: {video.title}
        - Channel: {video.channel_name}
        - Total Duration: {video.duration_seconds} seconds

        **Transcript** (with timestamps in seconds):
        {transcript_text or "(No transcript available — suggest cuts based on typical content pacing for this type of video)"}

        ---

        Analyse the content and identify the best 4–8 natural cut points that would
        create standalone, shareable video segments.

        **Cuts Selection Strategy:**
        1. Look for clear semantic transitions in the transcript (e.g., when the speaker moves to a new topic, says "moving on", "firstly", "in conclusion", etc.).
        2. Ensure the cuts align precisely with the sentence start boundaries in the transcript.
        3. Do not cut in the middle of a sentence or continuous thought.

        For each segment, provide:
        - start_seconds (integer)
        - end_seconds (integer)
        - title (max 60 chars — a concise, engaging title for this segment)
        - rationale (1–2 sentences explaining why this is a good cut)

        Rules:
        - Segments must be contiguous and cover the full video (first segment starts at 0, last ends at {video.duration_seconds})
        - Each segment should be between 30 seconds and 10 minutes long
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
        response = client.models.generate_content(
            model=CUT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                response_mime_type='application/json',
            ),
        )
        raw = response.text.strip()
        return _parse_cuts(raw, user_video)

    except Exception as exc:  # noqa: BLE001
        logger.error('Gemini cut suggestion failed for video %s: %s', user_video.id, exc)
        return _stub_cuts(user_video)


def suggest_cuts_and_transcript_from_audio(user_video: 'UserVideo', audio_path: str) -> tuple[list[dict], list[dict]]:
    """
    Extract transcript segments and suggest cuts directly from an audio file.
    Returns:
        (cuts: list[dict], transcript_segments: list[dict])
    """
    client = _get_client()
    if client is None:
        return _stub_cuts(user_video), []

    video = user_video.video

    try:
        # 1. Upload audio file to Google GenAI Files API
        logger.info('Uploading audio file %s to Gemini API...', audio_path)
        audio_file = client.files.upload(file=audio_path)
        logger.info('Upload complete. URI: %s', audio_file.uri)

        prompt = textwrap.dedent(f"""
            You are an expert video transcriber and editor.
            Analyze the provided audio file of a YouTube video and perform two tasks:

            1. Transcribe the entire audio file into short, sequential transcript segments with start_seconds and end_seconds timestamps.
            2. Identify the best 4–8 natural cut points that would create standalone, shareable video segments.

            **Video Details**
            - Title: {video.title}
            - Channel: {video.channel_name}
            - Total Duration: {video.duration_seconds} seconds

            **Rules for Transcript Segments:**
            - Break speech into short, sequential segments, each under 10 seconds or single sentences.
            - Ensure every segment has accurate `start_seconds` and `end_seconds` (floats/decimals) aligned with the audio.
            - Provide the exact spoken text for each segment.

            **Rules for Cuts:**
            - Cuts must be contiguous, starting at 0 and ending at {video.duration_seconds}.
            - Cut at natural topic transitions or pauses.

            Respond ONLY with a valid JSON object matching this structure (no markdown formatting, no extra text):
            {{
              "transcript": [
                {{
                  "start_seconds": 0.0,
                  "end_seconds": 4.5,
                  "text": "Welcome to this video tutorial."
                }}
              ],
              "cuts": [
                {{
                  "start_seconds": 0,
                  "end_seconds": 120,
                  "title": "Introduction",
                  "rationale": "Introductory remarks."
                }}
              ]
            }}
        """).strip()

        logger.info('Processing audio via Gemini 3.1 Pro...')
        response = client.models.generate_content(
            model=CUT_MODEL,
            contents=[audio_file, prompt],
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type='application/json',
            ),
        )

        # Cleanup uploaded file from Google's servers
        try:
            client.files.delete(name=audio_file.name)
        except Exception as delete_exc:
            logger.warning('Failed to delete uploaded file: %s', delete_exc)

        # Parse response
        data = json.loads(response.text.strip())
        raw_cuts = data.get('cuts', [])
        raw_transcript = data.get('transcript', [])

        # Validate and format cuts
        cuts = _parse_cuts(json.dumps(raw_cuts), user_video)
        
        # Validate transcript segments
        transcript_segments = []
        for i, item in enumerate(raw_transcript, start=1):
            try:
                transcript_segments.append({
                    'segment_order': i,
                    'start_seconds': float(item['start_seconds']),
                    'end_seconds': float(item['end_seconds']),
                    'text': str(item['text']).strip(),
                })
            except (KeyError, ValueError, TypeError):
                continue

        return cuts, transcript_segments

    except Exception as exc:
        logger.error('Gemini audio transcribing and cut generation failed: %s', exc)
        return _stub_cuts(user_video), []


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
