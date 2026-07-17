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

CUT_MODEL = 'gemini-2.5-flash'


# ── Private: SDK client ────────────────────────────────────

def _get_client() -> genai.Client | None:
    """Configure the Gemini SDK and return a Client, or None if no key."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — AI features will return stubs.')
        return None
    return genai.Client(api_key=api_key)


def _generate_content_with_fallback(
    client: genai.Client,
    model: str,
    contents,
    config: types.GenerateContentConfig | None = None,
    fallback_model: str = 'gemini-3.5-flash',
):
    """
    Generate content with a fallback to a secondary model if the primary model fails
    due to temporary overload, rate limits, or unavailability.
    """
    try:
        return client.models.generate_content(
            model=model,
            contents=contents,
            config=config,
        )
    except Exception as exc:
        err_msg = str(exc).lower()
        is_retryable = any(term in err_msg for term in ('503', 'unavailable', 'limit', 'demand', 'exhausted', 'busy', 'overloaded'))
        if model != fallback_model and is_retryable:
            logger.warning(
                "Primary model %s failed with: %s. Falling back to %s...",
                model,
                exc,
                fallback_model,
            )
            return client.models.generate_content(
                model=fallback_model,
                contents=contents,
                config=config,
            )
        raise exc


# ── Public API ─────────────────────────────────────────────

def suggest_cut_labels(
    user_video: 'UserVideo',
    cut_start: int,
    cut_end: int,
    total_duration: int | None = None,
) -> dict:
    """
    Given a specific time range within a video, analyse the transcript excerpt
    and return an AI-suggested title and description for that cut.

    Handles the no-transcript case gracefully:
    - If a transcript excerpt exists, it is sent to Gemini as primary context.
    - If NO transcript is available, the prompt is adapted to use the video
      title, channel name, segment position and duration so Gemini can still
      produce a meaningful, position-aware title.
    - If the Gemini API key is not configured at all, returns a position-based
      local fallback (Introduction / Part N / Conclusion) so the frontend
      always receives a non-empty response.

    Returns:
        {
            "title":       str,  # short, engaging segment title (max 60 chars)
            "description": str,  # 1-2 sentence description of what this segment covers
            "source":      str,  # 'ai' | 'fallback'
        }
    """
    video = user_video.video
    total = total_duration or video.duration_seconds or (cut_end + 1)

    client = _get_client()
    if client is None:
        # No API key — return a position-aware local fallback
        return _position_fallback(video.title or 'Video', cut_start, cut_end, total)

    # ── Build the best context we can, in priority order ──────────────────
    excerpt = _build_transcript_excerpt(user_video, cut_start, cut_end)
    duration_s = cut_end - cut_start

    if excerpt.strip():
        # Best case: we have transcript lines that fall inside this cut's range
        context_section = textwrap.dedent(f"""\
            The following is the transcript for the segment you are labelling
            ({cut_start}s – {cut_end}s). Use this verbatim content to write
            a specific, topic-based title and description:

            {excerpt}
        """).strip()
        quality_note = (
            'The title MUST reflect the actual topic discussed in the transcript excerpt above '
            '(e.g. "How Faith Works in Practice" not "Part 2" or "Introduction").'
        )

    else:
        # Excerpt is empty — try to get nearby context from the full transcript
        full_transcript = _build_transcript(user_video)
        video_description = getattr(video, 'description', '') or ''

        if full_transcript.strip():
            # We have the full transcript — give Gemini the surrounding window
            # and ask it to infer the topic for this specific time range
            context_section = textwrap.dedent(f"""\
                There is no transcript excerpt available specifically for this segment
                ({cut_start}s – {cut_end}s), but the full video transcript is below.
                Identify which part of the transcript corresponds to this time range
                and use it to determine the real topic being discussed.

                **Full transcript (with timestamps):**
                {full_transcript}
            """).strip()
            quality_note = (
                'Based on the timestamps in the transcript, identify what is actually being '
                'discussed during {cut_start}s – {cut_end}s and write a specific, topic-based '
                'title and description (e.g. "Apostle Gideon on Why Jesus Came to Earth" not '
                '"Part 2" or "Middle Section").'
            ).format(cut_start=cut_start, cut_end=cut_end)

        elif video_description.strip():
            # No transcript at all — use the YouTube video description
            context_section = textwrap.dedent(f"""\
                No transcript is available for this video. Use the video description
                below to infer what topics are likely covered in the segment
                ({cut_start}s – {cut_end}s):

                **Video Description:**
                {video_description[:2000]}
            """).strip()
            quality_note = (
                'Infer the most likely topic for the {cut_start}s – {cut_end}s range '
                'based on the video title, channel, and description. Write a specific, '
                'informative title even if it is an educated guess.'
            ).format(cut_start=cut_start, cut_end=cut_end)

        else:
            # Absolute last resort — metadata only
            position_pct = (cut_start / total * 100) if total > 0 else 0
            position_label = (
                'at the very start'   if position_pct < 15
                else 'near the end'   if position_pct > 80
                else f'~{int(position_pct)}% through the video'
            )
            context_section = textwrap.dedent(f"""\
                No transcript or description is available.
                Metadata only:
                - Segment position: {position_label}
                - Segment duration: {duration_s}s ({duration_s // 60}m {duration_s % 60}s)
                - Total video duration: {total}s
            """).strip()
            quality_note = (
                'With only metadata available, write the most descriptive title you can '
                'based on the video title, channel name, and the segment\'s position.'
            )

    prompt = textwrap.dedent(f"""\
        You are an expert video editor writing labels for a cut segment of a YouTube video.

        **Video title:** {video.title}
        **Channel:** {video.channel_name}
        **Segment:** {cut_start}s – {cut_end}s  ({duration_s}s long)

        {context_section}

        Task:
        1. Write a short, specific **title** (max 60 characters) that names the ACTUAL
           topic covered in this segment — never use generic labels like "Part 2",
           "Introduction", "Middle Section", or "Segment N".
           Good examples: "Why Jesus Came to Earth", "Q&A: How to Study the Bible",
           "Apostle Gideon on the Holy Spirit".
        2. Write a **description** (2–3 sentences) that summarises what the viewer will
           hear and learn from this specific segment.

        {quality_note}

        Respond ONLY with a valid JSON object — no markdown fences, no extra text:
        {{"title": "...", "description": "..."}}
    """).strip()

    try:
        response = _generate_content_with_fallback(
            client=client,
            model=CUT_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.6,
                response_mime_type='application/json',
            ),
        )
        import json as _json
        data = _json.loads(response.text.strip())
        title       = str(data.get('title', '')).strip()[:200]
        description = str(data.get('description', '')).strip()[:500]
        if not title:
            return _position_fallback(video.title or 'Video', cut_start, cut_end, total)
        return {'title': title, 'description': description, 'source': 'ai'}
    except Exception as exc:  # noqa: BLE001
        logger.error('suggest_cut_labels failed: %s', exc)
        return _position_fallback(video.title or 'Video', cut_start, cut_end, total)


def _position_fallback(video_title: str, cut_start: int, cut_end: int, total: int) -> dict:
    """
    Return a position-aware label when AI is unavailable.
    Uses the segment's position within the video to produce a sensible name.
    """
    if total > 0:
        pct = cut_start / total
    else:
        pct = 0

    duration_s = cut_end - cut_start

    if pct < 0.15:
        title = 'Introduction'
        desc  = f'Opening segment of \u201c{video_title}\u201d ({duration_s}s).'
    elif pct > 0.80:
        title = 'Conclusion'
        desc  = f'Closing segment of \u201c{video_title}\u201d ({duration_s}s).'
    elif pct < 0.40:
        title = 'Early Section'
        desc  = f'Early portion of \u201c{video_title}\u201d covering the {int(cut_start // 60)}:{cut_start % 60:02d}\u2013{int(cut_end // 60)}:{cut_end % 60:02d} range.'
    elif pct < 0.65:
        title = 'Core Content'
        desc  = f'Main content section of \u201c{video_title}\u201d.'
    else:
        title = 'Wrap-up'
        desc  = f'Wrap-up section of \u201c{video_title}\u201d leading into the conclusion.'

    return {'title': title, 'description': desc, 'source': 'fallback'}


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
        response = _generate_content_with_fallback(
            client=client,
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
            - IMPORTANT: Never use double quotes (") inside the "text" value. If you need to write a quote, use single quotes ('). This is critical to ensure the JSON remains valid.

            **Rules for Cuts:**
            - Cuts must be contiguous, starting at 0 and ending at {video.duration_seconds}.
            - Cut at natural topic transitions or pauses.
            - IMPORTANT: Never use double quotes (") inside the "title" or "rationale" values. Use single quotes (') instead.

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
        response = _generate_content_with_fallback(
            client=client,
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

        # Parse response — use a robust multi-stage parser since large
        # audio transcription responses can contain encoding issues or
        # be slightly malformed even with response_mime_type='application/json'
        raw_text = response.text.strip()
        data = _safe_parse_audio_response(raw_text)

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

def _safe_parse_audio_response(raw: str) -> dict:
    """
    Robustly parse Gemini's JSON response for audio transcription.

    Large audio responses (100k+ chars) can occasionally contain:
    - Markdown code fences (```json ... ```)
    - Smart / curly quotes that break JSON strings
    - A literal \\n inside a string instead of the escaped form
    - Null bytes or other control characters
    - Truncation that makes the JSON structurally incomplete

    Strategy (each step is tried in order):
    1. Strip markdown fences, then try json.loads directly.
    2. Sanitise common bad characters, then retry json.loads.
    3. Regex-extract the "transcript" and "cuts" arrays independently
       and parse each one separately — recovers partial data.
    4. Return an empty dict so the caller can fall back gracefully.
    """
    def _strip_fences(text: str) -> str:
        return re.sub(r'^```(?:json)?\s*|\s*```$', '', text, flags=re.MULTILINE).strip()

    def _sanitise(text: str) -> str:
        # Replace curly / smart quotes with standard ASCII quotes
        text = text.replace('\u2018', "'").replace('\u2019', "'")
        text = text.replace('\u201c', '"').replace('\u201d', '"')
        # Remove null bytes and other control chars that break JSON
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
        return text

    cleaned = _strip_fences(raw)

    # Stage 1 — direct parse
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.warning(
            'Audio response JSON parse (stage 1) failed at line %d col %d (char %d): %s',
            exc.lineno, exc.colno, exc.pos, exc.msg,
        )

    # Stage 2 — sanitise then retry
    sanitised = _sanitise(cleaned)
    try:
        return json.loads(sanitised)
    except json.JSONDecodeError as exc:
        logger.warning('Audio response JSON parse (stage 2) failed: %s', exc.msg)

    # Stage 3 — extract arrays independently with regex
    result: dict = {}
    for key in ('transcript', 'cuts'):
        # Match the array value for the given key, handling nested braces
        pattern = rf'"{key}"\s*:\s*(\[)'
        m = re.search(pattern, sanitised)
        if not m:
            continue
        start = m.start(1)
        depth = 0
        end = start
        for i, ch in enumerate(sanitised[start:], start):
            if ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    end = i + 1
                    break
        array_str = sanitised[start:end]
        try:
            result[key] = json.loads(array_str)
            logger.info('Audio response: recovered "%s" array (%d items)', key, len(result[key]))
        except json.JSONDecodeError as exc:
            logger.warning('Audio response: could not recover "%s" array: %s', key, exc.msg)

    if result:
        return result

    # Stage 4 — give up, return empty so caller falls back to stubs
    logger.error('Audio response: all JSON parse stages failed. Falling back to stubs.')
    return {}


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


def _build_transcript_excerpt(user_video: 'UserVideo', start: int, end: int) -> str:
    """
    Build a timestamped transcript string for segments that overlap the
    [start, end] time range.

    A segment overlaps a range when:
        segment.start_seconds < end  AND  segment.end_seconds > start

    This correctly handles segments that straddle a cut boundary.
    Includes a generous 10-second buffer either side so boundary words
    are not missed.
    """
    try:
        transcription = user_video.transcription
        buffer = 10
        segments = (
            transcription.segments
            .filter(
                start_seconds__lt=end + buffer,    # segment starts before cut ends
                end_seconds__gt=max(0, start - buffer),  # segment ends after cut starts
            )
            .order_by('segment_order')
        )
        if not segments.exists():
            return ''
        return '\n'.join(
            f'[{float(seg.start_seconds):.1f}s] {seg.text}'
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
    Uses the video title to build slightly more meaningful segment names.
    """
    total = user_video.video.duration_seconds or 300
    segment_count = max(2, min(6, total // 60))
    step = total // segment_count
    video_title = user_video.video.title or 'Video'

    # Build human-readable segment names
    def _segment_name(i: int, count: int) -> str:
        if i == 0:
            return 'Introduction'
        if i == count - 1:
            return 'Conclusion'
        return f'Part {i + 1}'

    def _segment_rationale(i: int, count: int) -> str:
        if i == 0:
            return f'Opening section of "{video_title}".'
        if i == count - 1:
            return f'Closing section of "{video_title}".'
        return f'Middle section {i} of "{video_title}".'

    return [
        {
            'start_seconds': i * step,
            'end_seconds':   min((i + 1) * step, total),
            'title':         _segment_name(i, segment_count),
            'rationale':     _segment_rationale(i, segment_count),
        }
        for i in range(segment_count)
    ]
