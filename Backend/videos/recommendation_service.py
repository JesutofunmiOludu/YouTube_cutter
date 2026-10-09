"""
videos/recommendation_service.py
================================
Discovers and caches AI-driven related YouTube video recommendations for a UserVideo.
Runs automatically in the background pipeline ("underground") during video processing
so that recommendations are pre-populated and instantly ready before the user clicks
to add videos or views the Related Videos canvas shelf.
"""
from __future__ import annotations

import html
import logging
import re
import threading
from typing import TYPE_CHECKING, Any, Dict, List

import requests
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

from chat.models import VideoRecommendation
from videos.views import parse_iso8601_duration

if TYPE_CHECKING:
    from videos.models import UserVideo

logger = logging.getLogger(__name__)


def clean_title_for_search(title: str) -> str:
    """Removes emojis, bracketed tags, dividers and excessive whitespace."""
    if not title:
        return ''
    cleaned = re.sub(r'\[.*?\]|\(.*?\)', '', title)
    cleaned = re.sub(r'[|#@!?:;]', ' ', cleaned)
    cleaned = re.sub(r'\s+', ' ', cleaned)
    return cleaned.strip()


def fetch_youtube_related_videos(
    query: str,
    exclude_youtube_id: str = '',
    limit: int = 8,
) -> List[Dict[str, Any]]:
    """
    Queries YouTube API for related videos matching the query,
    retrieving snippet, duration, channel, and view counts.
    """
    api_key = getattr(settings, 'YOUTUBE_API_KEY', None)
    if not api_key:
        logger.warning('YouTube API key not configured; skipping recommendation fetch.')
        return []

    import hashlib
    query_hash = hashlib.md5(f"{query.lower()}:{limit}".encode()).hexdigest()
    cache_key = f"yt_related_search:{query_hash}"
    cached = cache.get(cache_key)
    if cached is not None:
        return [item for item in cached if item.get('youtube_id') != exclude_youtube_id]

    search_params = {
        'key': api_key,
        'q': query,
        'part': 'snippet',
        'type': 'video',
        'order': 'relevance',
        'maxResults': min(limit + 5, 25),
    }

    try:
        resp = requests.get(
            'https://www.googleapis.com/youtube/v3/search',
            params=search_params,
            timeout=10,
        )
        resp.raise_for_status()
        items = resp.json().get('items', [])
    except Exception as e:
        logger.error('Failed to search related videos on YouTube for query "%s": %s', query, e)
        return []

    video_ids = [
        item['id']['videoId']
        for item in items
        if item.get('id', {}).get('videoId') and item['id']['videoId'] != exclude_youtube_id
    ]

    stats_map: Dict[str, Dict[str, Any]] = {}
    if video_ids:
        try:
            stats_resp = requests.get(
                'https://www.googleapis.com/youtube/v3/videos',
                params={
                    'key': api_key,
                    'id': ','.join(video_ids[:limit + 3]),
                    'part': 'statistics,contentDetails',
                },
                timeout=10,
            )
            if stats_resp.status_code == 200:
                for v_item in stats_resp.json().get('items', []):
                    v_id = v_item.get('id')
                    st = v_item.get('statistics', {})
                    cd = v_item.get('contentDetails', {})
                    raw_cnt = st.get('viewCount')
                    dur_iso = cd.get('duration', '')
                    stats_map[v_id] = {
                        'view_count': int(raw_cnt) if raw_cnt is not None else None,
                        'duration_seconds': parse_iso8601_duration(dur_iso),
                    }
        except Exception as e:
            logger.warning('Failed to fetch detailed statistics for related videos: %s', e)

    results: List[Dict[str, Any]] = []
    for item in items:
        vid_id = item.get('id', {}).get('videoId')
        if not vid_id or vid_id == exclude_youtube_id:
            continue

        snippet = item.get('snippet', {})
        st = stats_map.get(vid_id, {})

        results.append({
            'youtube_id': vid_id,
            'title': html.unescape(snippet.get('title', '')),
            'channel_name': html.unescape(snippet.get('channelTitle', '')),
            'thumbnail_url': (
                snippet.get('thumbnails', {}).get('high', {}).get('url')
                or snippet.get('thumbnails', {}).get('medium', {}).get('url')
                or f"https://img.youtube.com/vi/{vid_id}/hqdefault.jpg"
            ),
            'published_at': (snippet.get('publishedAt') or '')[:10],
            'duration_seconds': st.get('duration_seconds', 0),
            'view_count': st.get('view_count'),
        })
        if len(results) >= limit:
            break

    # Cache search results for 6 hours
    cache.set(cache_key, results, timeout=21600)
    return results


def discover_and_save_recommendations(
    user_video: 'UserVideo',
    limit: int = 8,
) -> List[VideoRecommendation]:
    """
    Runs related video discovery for a given UserVideo and stores the results
    into the VideoRecommendation table.
    """
    if not user_video or not getattr(user_video, 'video', None):
        return []

    source_vid = user_video.video
    search_query = clean_title_for_search(source_vid.title)
    if not search_query:
        return []

    logger.info(
        '[Recommendations] Running underground related video discovery for UserVideo %s ("%s")...',
        user_video.id, search_query,
    )

    raw_videos = fetch_youtube_related_videos(
        query=search_query,
        exclude_youtube_id=source_vid.youtube_id,
        limit=limit,
    )

    if not raw_videos:
        logger.warning(
            '[Recommendations] No related videos returned for UserVideo %s',
            user_video.id,
        )
        return []

    # Clean existing related_video recommendations to avoid duplicates
    VideoRecommendation.objects.filter(
        source_user_video=user_video,
        recommendation_type=VideoRecommendation.RecommendationType.RELATED_VIDEO,
    ).delete()

    created_records: List[VideoRecommendation] = []
    # Assign descending relevance scores: 0.98, 0.96, 0.94...
    base_score = 0.98
    for idx, item in enumerate(raw_videos):
        score = round(max(0.70, base_score - (idx * 0.02)), 4)
        rec = VideoRecommendation.objects.create(
            source_user_video=user_video,
            recommended_youtube_id=item['youtube_id'],
            recommended_title=item['title'],
            recommended_thumbnail_url=item['thumbnail_url'],
            recommended_channel_name=item.get('channel_name', ''),
            recommended_duration_seconds=item.get('duration_seconds', 0),
            recommended_view_count=item.get('view_count'),
            recommended_published_at=item.get('published_at', ''),
            recommendation_type=VideoRecommendation.RecommendationType.RELATED_VIDEO,
            relevance_score=score,
        )
        created_records.append(rec)

    logger.info(
        '[Recommendations] Saved %d related video recommendations underground for UserVideo %s.',
        len(created_records), user_video.id,
    )
    return created_records


def trigger_underground_recommendations(user_video: 'UserVideo') -> None:
    """
    Fires the discovery process asynchronously in a background thread
    so the HTTP request cycle or main processing pipeline is never blocked.
    """
    def _bg_task():
        try:
            from videos.models import UserVideo as UVModel
            fresh_uv = UVModel.objects.select_related('video').get(pk=user_video.id)
            discover_and_save_recommendations(fresh_uv)
        except Exception as e:
            logger.error(
                '[Recommendations] Background discovery error for UserVideo %s: %s',
                user_video.id, e, exc_info=True,
            )

    thread = threading.Thread(
        target=_bg_task,
        daemon=True,
        name=f"bg-recs-{user_video.id}",
    )
    thread.start()


def get_or_discover_recommendations(
    user_video: 'UserVideo',
    limit: int = 8,
) -> List[Dict[str, Any]]:
    """
    Returns stored recommendations from the database.
    If none exist yet, kicks off background discovery and returns live search results.
    """
    existing_recs = VideoRecommendation.objects.filter(
        source_user_video=user_video,
        recommendation_type=VideoRecommendation.RecommendationType.RELATED_VIDEO,
    ).order_by('-relevance_score')[:limit]

    if existing_recs.exists():
        return [
            {
                'id': str(rec.id),
                'youtube_id': rec.recommended_youtube_id,
                'title': rec.recommended_title,
                'thumbnail_url': rec.recommended_thumbnail_url,
                'channel_name': rec.recommended_channel_name,
                'duration_seconds': rec.recommended_duration_seconds or 0,
                'view_count': rec.recommended_view_count,
                'published_at': rec.recommended_published_at,
                'relevance_score': float(rec.relevance_score or 0.90),
            }
            for rec in existing_recs
        ]

    # If none saved yet, perform synchronous discovery (or fallback live fetch)
    recs = discover_and_save_recommendations(user_video, limit=limit)
    return [
        {
            'id': str(rec.id),
            'youtube_id': rec.recommended_youtube_id,
            'title': rec.recommended_title,
            'thumbnail_url': rec.recommended_thumbnail_url,
            'channel_name': rec.recommended_channel_name,
            'duration_seconds': rec.recommended_duration_seconds or 0,
            'view_count': rec.recommended_view_count,
            'published_at': rec.recommended_published_at,
            'relevance_score': float(rec.relevance_score or 0.90),
        }
        for rec in recs
    ]
