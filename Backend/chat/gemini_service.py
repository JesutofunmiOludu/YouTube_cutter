"""
Gemini AI Service for YouTube Cutter.
Uses the new google-genai Python SDK.

Handles:
  - Chat: Contextual Q&A about one or many YouTube videos using their transcripts
  - Research: Structured deep-research reports with cited sources based on video content
"""
from __future__ import annotations

import logging
import textwrap
import time
from typing import TYPE_CHECKING

from google import genai
from google.genai import types
from django.conf import settings
from django.utils import timezone

if TYPE_CHECKING:
    from chat.models import ChatSession, ResearchSession

logger = logging.getLogger(__name__)

# ── Model names ────────────────────────────────────────────
CHAT_MODEL     = 'gemini-2.5-flash'
RESEARCH_AGENT = 'deep-research-preview-04-2026'


def _get_client() -> genai.Client | None:
    """Configure and return the new Google GenAI client, or None if no key."""
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — AI features will return stubs.')
        return None
    return genai.Client(api_key=api_key)


# ═══════════════════════════════════════════════════════════
# CHAT
# ═══════════════════════════════════════════════════════════

def generate_chat_reply(user_content: str, session: 'ChatSession') -> str:
    """
    Generate an AI reply to the user's message using the video transcript(s)
    attached to this chat session as context.
    """
    client = _get_client()
    if client is None:
        return _stub_chat_reply(user_content)

    # Build context from all videos attached to this session
    context_blocks = _build_video_context(session)
    history        = _build_chat_history(session, exclude_last=True)

    system_prompt = textwrap.dedent(f"""
        You are an expert video content assistant called "ClipMind".
        You help users understand, analyse, and explore YouTube video content.

        You have access to the following video transcript(s):

        {context_blocks}

        Guidelines:
        - Answer ONLY based on the provided transcripts when possible.
        - If the answer isn't in the transcript, say so clearly and offer general knowledge.
        - Use timestamps (e.g. [0:45]) when referencing specific parts of the video.
        - Keep answers concise but informative.
        - Use markdown formatting for clarity (bold, bullets, code blocks as appropriate).
    """).strip()

    try:
        chat = client.chats.create(
            model=CHAT_MODEL,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.3,
            ),
            history=history,
        )
        resp = chat.send_message(user_content)
        return resp.text

    except Exception as exc:  # noqa: BLE001
        err_msg = str(exc).lower()
        is_retryable = any(term in err_msg for term in ('503', 'unavailable', 'limit', 'demand', 'exhausted', 'busy', 'overloaded'))
        if CHAT_MODEL != 'gemini-3.5-flash' and is_retryable:
            logger.warning("Primary model %s failed for chat: %s. Falling back to gemini-3.5-flash...", CHAT_MODEL, exc)
            try:
                chat = client.chats.create(
                    model='gemini-3.5-flash',
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=0.3,
                    ),
                    history=history,
                )
                resp = chat.send_message(user_content)
                return resp.text
            except Exception as fallback_exc:
                logger.error('Gemini chat fallback to gemini-3.5-flash failed: %s', fallback_exc)
        
        logger.error('Gemini chat error: %s', exc)
        return (
            "I'm having trouble connecting to the AI right now. "
            "Please try again in a moment."
        )


def _build_video_context(session: 'ChatSession') -> str:
    """
    Return a formatted string of all video transcripts attached to the session.
    """
    from videos.models import Transcription

    blocks = []
    for sv in session.session_videos.select_related('user_video__video').all():
        uv    = sv.user_video
        video = uv.video
        header = (
            f'## Video: "{video.title}"\n'
            f'Channel: {video.channel_name} | '
            f'Duration: {_fmt_seconds(video.duration_seconds)}\n'
        )
        try:
            transcription = Transcription.objects.prefetch_related('segments').get(
                user_video=uv,
                status='completed',
            )
            segments = transcription.segments.order_by('segment_order')
            transcript_text = '\n'.join(
                f'[{_fmt_seconds(int(seg.start_seconds))}] {seg.text}'
                for seg in segments
            )
            if not transcript_text.strip():
                raise Transcription.DoesNotExist
            blocks.append(f'{header}\n### Transcript\n{transcript_text}')
        except Transcription.DoesNotExist:
            blocks.append(
                f'{header}\n'
                '(Transcript is not available for this video. Use your general web knowledge '
                'about this video, its channel, and its subject matter to answer the user\'s queries.)'
            )

    return '\n\n---\n\n'.join(blocks) if blocks else 'No videos attached to this session.'


def _build_chat_history(session: 'ChatSession', exclude_last: bool = True) -> list[types.Content]:
    """
    Convert stored ChatMessages into new Google GenAI SDK's types.Content format.
    Optionally excludes the last message (the current user turn).
    """
    from chat.models import ChatMessage

    msgs = list(
        session.messages
        .order_by('created_at')
        .values('role', 'content')
    )
    if exclude_last and msgs:
        msgs = msgs[:-1]

    history = []
    for m in msgs:
        role = 'user' if m['role'] == ChatMessage.Role.USER else 'model'
        history.append(
            types.Content(
                role=role,
                parts=[types.Part(text=m['content'])]
            )
        )
    return history


# ═══════════════════════════════════════════════════════════
# RESEARCH (Deep Research Agent)
# ═══════════════════════════════════════════════════════════

def start_deep_research_interaction(session: 'ResearchSession') -> str | None:
    """
    Start the Google Deep Research agent for the given ResearchSession.
    Returns the interaction ID, or None if it failed or returned a stub.
    """
    client = _get_client()
    if client is None:
        return None

    video = session.user_video.video
    transcript_text = _get_transcript_text(session.user_video)

    prompt = textwrap.dedent(f"""
        You are an expert research assistant. A user has been watching a YouTube video and
        wants a comprehensive research report on its topic.

        **Video Details**
        - Title: {video.title}
        - Channel: {video.channel_name}
        - Duration: {_fmt_seconds(video.duration_seconds)}

        **Video Transcript** (use this as the primary source):
        {transcript_text or '(Transcript not available — research based on the title only)'}

        ---

        Please produce a thorough, well-structured research report in Markdown format.

        The report MUST include:
        1. **Executive Summary** — 2–3 sentence overview
        2. **Key Topics Covered** — bullet list of the main subjects in the video
        3. **Deep Dive** — expanded explanation of each key topic with additional context
        4. **Related Resources** — 5–8 real, credible URLs (articles, papers, tools) that
           expand on the video's content. For EACH resource include:
           - Title
           - URL
           - Type (article / paper / website / video)
           - A 1–2 sentence excerpt explaining why it's relevant
        5. **Conclusion** — summary and suggested next steps for the viewer

        Format the Related Resources section as a JSON code block at the very end
        of the report so it can be parsed, like this:

        ```json
        [
          {{
            "title": "Resource Title",
            "url": "https://example.com",
            "source_type": "article",
            "excerpt": "Why this is relevant...",
            "relevance_rank": 1
          }}
        ]
        ```
    """).strip()

    try:
        interaction = client.interactions.create(
            input=prompt,
            agent=RESEARCH_AGENT,
            background=True
        )
        return interaction.id
    except Exception as exc:
        logger.error('Failed to trigger Gemini Deep Research: %s', exc)
        return None


def poll_and_save_research(session: 'ResearchSession') -> tuple[str, list[dict]]:
    """
    Polls the active Google Deep Research interaction and parses results when complete.

    The SDK's Interaction object (google.genai._gaos.types.interactions.interaction.Interaction)
    exposes the final text via:
      - interaction.output_text  (str | None)  — primary attribute
      - interaction.steps        (list)         — step-by-step breakdown; fallback
    """
    client = _get_client()
    if client is None or not session.research_interaction_id:
        return _stub_research_report(session), []

    try:
        interaction = client.interactions.get(session.research_interaction_id)

        status = getattr(interaction, 'status', None)

        if status == 'completed':
            # Primary: use output_text attribute
            raw = getattr(interaction, 'output_text', None) or ''

            # Fallback: scan steps for modelOutputStep text
            if not raw:
                for step in (getattr(interaction, 'steps', None) or []):
                    step_type = getattr(step, 'type', '') or ''
                    if 'modeloutput' in step_type.lower() or 'output' in step_type.lower():
                        raw = getattr(step, 'output_text', '') or getattr(step, 'text', '') or ''
                        if raw:
                            break

            if not raw:
                logger.warning('Deep Research completed but no text found in interaction %s', session.research_interaction_id)
                return 'Research completed but no content was returned.', []

            report, sources = _parse_research_response(raw)
            return report, sources

        elif status == 'failed':
            error_detail = getattr(interaction, 'error', 'Unknown error')
            raise Exception(f"Deep Research failed: {error_detail}")

        else:
            # Still running (status: 'running', 'pending', etc.)
            return '', []

    except Exception as exc:
        logger.error('Deep Research polling failed: %s', exc)
        return f"Research generation failed: {exc}", []




def _get_transcript_text(user_video) -> str:
    """Return the full plain-text transcript or empty string."""
    from videos.models import Transcription

    try:
        t = Transcription.objects.prefetch_related('segments').get(
            user_video=user_video,
            status='completed',
        )
        segments = t.segments.order_by('segment_order')
        return ' '.join(seg.text for seg in segments)
    except Transcription.DoesNotExist:
        return ''


def _parse_research_response(raw: str) -> tuple[str, list[dict]]:
    """
    Split the Gemini response into (report_markdown, sources_list).
    The sources are expected in a ```json code block at the end.
    """
    import json
    import re

    sources = []
    # Find the last ```json ... ``` block
    json_match = re.search(r'```json\s*(\[.*?\])\s*```', raw, re.DOTALL)
    if json_match:
        try:
            sources = json.loads(json_match.group(1))
            # Remove the JSON block from the report body
            report = raw[:json_match.start()].strip()
        except json.JSONDecodeError:
            report = raw
    else:
        report = raw

    return report, sources


# ═══════════════════════════════════════════════════════════
# Stubs (when no API key is set or fallback is needed)
# ═══════════════════════════════════════════════════════════

def _stub_chat_reply(user_content: str) -> str:
    return (
        f"You asked: **\"{user_content[:80]}\"**\n\n"
        "AI responses are not yet configured. "
        "Add your `GEMINI_AI_API` key to the `.env` file to enable real answers."
    )


def _stub_research_report(session: 'ResearchSession') -> str:
    title = session.title or session.user_video.video.title
    return (
        f"## Research Report: {title}\n\n"
        "_This is a placeholder report. Set `GEMINI_AI_API` in `.env` to generate real reports._\n\n"
        "### Key Topics\n- Topic 1\n- Topic 2\n- Topic 3\n\n"
        "### Conclusion\nWire up the Gemini API to get real research."
    )


# ═══════════════════════════════════════════════════════════
# Utilities
# ═══════════════════════════════════════════════════════════

def _fmt_seconds(total: int) -> str:
    """Convert seconds to HH:MM:SS or MM:SS string."""
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    if h:
        return f'{h}:{m:02d}:{s:02d}'
    return f'{m}:{s:02d}'
