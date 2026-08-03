"""
chat/search_service.py
======================
Gemini-powered web search service.

Returns Perplexity-style results:
  - A concise, citation-numbered answer in Markdown
  - A list of cited web sources
  - 3-4 follow-up questions

Uses Gemini's built-in Google Search grounding tool so that all cited
facts are live from the web, not hallucinated.
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

SEARCH_MODEL = 'gemini-2.5-flash'


def _get_client() -> genai.Client | None:
    api_key = getattr(settings, 'GEMINI_API_KEY', '')
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — search will return stubs.')
        return None
    return genai.Client(api_key=api_key)


def _get_transcript_snippet(user_video: 'UserVideo', max_chars: int = 2000) -> str:
    """Return up to max_chars of transcript text for grounding context."""
    from videos.models import Transcription
    try:
        t = Transcription.objects.prefetch_related('segments').get(
            user_video=user_video, status='completed'
        )
        text = ' '.join(seg.text for seg in t.segments.order_by('segment_order'))
        return text[:max_chars]
    except Transcription.DoesNotExist:
        return ''


def run_web_search(query: str, user_video: 'UserVideo | None' = None, mode: str = 'search') -> dict:
    """
    Run a Gemini-grounded web search or step-by-step learning guide for *query*,
    optionally anchored to the context of *user_video*.

    Returns:
    {
        "answer":              str,   # markdown, citations as [1][2]
        "sources":             list,  # [{title, url, excerpt}]
        "follow_up_questions": list,  # [str, ...]
    }
    """
    client = _get_client()
    if client is None:
        return _stub_search(query)

    # ── Build context block ────────────────────────────────────────────
    context_block = ''
    if user_video:
        video = user_video.video
        snippet = _get_transcript_snippet(user_video)
        context_block = textwrap.dedent(f"""
            The user is currently watching the following YouTube video:
            Title: {video.title}
            Channel: {video.channel_name}

            Transcript snippet:
            {snippet or '(Not available)'}

            Use this video context to make the answer more relevant when applicable.
        """).strip()

    if mode == 'learn':
        prompt = textwrap.dedent(f"""
            {context_block}

            ---

            User learning objective / topic: "{query}"

            Create an interactive, structured STEP-BY-STEP LEARNING GUIDE for this topic grounded in web search and video context.

            Respond in the following JSON format ONLY — no extra text before or after:

            {{
              "answer": "<Structured markdown learning guide. Structure into clear sequential sections with headers like: ### 🎓 Step 1: Core Concept & Overview\\n\\n### ⚙️ Step 2: Key Mechanics & Implementation\\n\\n### 💡 Step 3: Best Practices & Common Pitfalls\\n\\n### 🚀 Step 4: Practical Exercise / Key Takeaways. Use bold text, bullet points, code or formulas if relevant, and inline citations like [1], [2]. Aim for 250–500 words.>",
              "sources": [
                {{
                  "title": "<Page title>",
                  "url": "<Full URL>",
                  "excerpt": "<1–2 sentence summary or why it was cited>"
                }}
              ],
              "follow_up_questions": [
                "<Practice question or check for understanding 1>",
                "<Next learning step 2>",
                "<Real-world application question 3>",
                "<Deep-dive topic 4>"
              ]
            }}

            Requirements:
            - Format as an engaging, educational step-by-step tutorial (Step 1, Step 2, Step 3, etc.)
            - Include 3–6 real, working sources in "sources"
            - Include exactly 4 follow-up learning prompts/questions
            - Citations in the answer must match the index (1-based) of the source in the "sources" array
        """).strip()
    else:
        prompt = textwrap.dedent(f"""
            {context_block}

            ---

            User search query: "{query}"

            Search the web for accurate, up-to-date information about this query.

            Respond in the following JSON format ONLY — no extra text before or after:

            {{
              "answer": "<Comprehensive markdown answer. Number every factual claim with inline citations like [1], [2]. Use headers, bullet points, and **bold** for clarity. Aim for 150–400 words.>",
              "sources": [
                {{
                  "title": "<Page title>",
                  "url": "<Full URL>",
                  "excerpt": "<1–2 sentence relevant excerpt or why it was cited>"
                }}
              ],
              "follow_up_questions": [
                "<Follow-up question 1>",
                "<Follow-up question 2>",
                "<Follow-up question 3>",
                "<Follow-up question 4>"
              ]
            }}

            Requirements:
            - Include 3–6 real, working sources in "sources"
            - Provide exactly 4 follow-up questions that naturally continue the research
            - Follow-up questions should be specific, not generic
            - Citations in the answer must match the index (1-based) of the source in the "sources" array
        """).strip()

    try:
        response = client.models.generate_content(
            model=SEARCH_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())],
                temperature=0.3,
            ),
        )
        raw = response.text or ''

        # Extract native grounding sources from Gemini response metadata if present
        grounding_sources = []
        try:
            cand = response.candidates[0]
            gm = getattr(cand, 'grounding_metadata', None)
            if gm and hasattr(gm, 'grounding_chunks'):
                for chunk in (gm.grounding_chunks or []):
                    web = getattr(chunk, 'web', None)
                    if web and getattr(web, 'uri', None):
                        grounding_sources.append({
                            'title': getattr(web, 'title', '') or 'Web Source',
                            'url': getattr(web, 'uri', ''),
                            'excerpt': getattr(web, 'title', ''),
                        })
        except Exception:
            pass

        return _parse_search_response(raw, query, grounding_sources=grounding_sources)

    except Exception as exc:
        logger.error('Gemini web search failed: %s', exc, exc_info=True)
        return _stub_search(query)


def _parse_search_response(raw: str, query: str, grounding_sources: list | None = None) -> dict:
    """Extract the JSON payload from Gemini's response with multi-stage fallback."""
    # Strip markdown code fences if present
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw.strip(), flags=re.MULTILINE)
    cleaned = re.sub(r'```\s*$', '', cleaned.strip(), flags=re.MULTILINE)
    cleaned = cleaned.strip()

    sources_to_use = grounding_sources or []

    # Stage 1: Standard JSON parse
    try:
        data = json.loads(cleaned, strict=False)
        parsed_sources = data.get('sources', [])
        return {
            'answer':              data.get('answer', ''),
            'sources':             parsed_sources if parsed_sources else sources_to_use,
            'follow_up_questions': data.get('follow_up_questions', []),
        }
    except json.JSONDecodeError:
        pass

    # Stage 2: Regex field recovery if answer or arrays were returned loosely
    answer_match = re.search(r'"answer"\s*:\s*"(.*?)"\s*,\s*"(?:sources|follow_up_questions)"', cleaned, re.DOTALL)
    answer = answer_match.group(1).replace(r'\"', '"').replace(r'\n', '\n') if answer_match else raw

    sources = sources_to_use
    sources_match = re.search(r'"sources"\s*:\s*(\[.*?\])\s*,\s*"follow_up_questions"', cleaned, re.DOTALL)
    if sources_match:
        try:
            parsed = json.loads(sources_match.group(1), strict=False)
            if parsed:
                sources = parsed
        except Exception:
            pass

    follow_ups = []
    fu_match = re.search(r'"follow_up_questions"\s*:\s*(\[.*?\])', cleaned, re.DOTALL)
    if fu_match:
        try:
            follow_ups = json.loads(fu_match.group(1), strict=False)
        except Exception:
            pass

    if not follow_ups:
        follow_ups = [
            f'What are key details regarding {query}?',
            f'How does {query} impact related topics?',
            f'What are common misconceptions about {query}?',
            f'What are recent developments in {query}?',
        ]

    logger.info('Parsed Gemini search response using fallback recovery.')
    return {
        'answer':              answer,
        'sources':             sources,
        'follow_up_questions': follow_ups,
    }


def _stub_search(query: str) -> dict:
    """Clean fallback response when search service is temporarily unavailable."""
    return {
        'answer': (
            f'**Search result for:** "{query}"\n\n'
            'AI search service is currently experiencing high traffic or temporary limit. Please try your search again in a few moments.'
        ),
        'sources': [],
        'follow_up_questions': [
            f'What is the history of {query}?',
            f'How does {query} work in practice?',
            f'What are common misconceptions about {query}?',
            f'What are the latest developments in {query}?',
        ],
    }
