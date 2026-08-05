"""
Utility helpers for the videos app.
"""
import requests
from django.conf import settings
from django.utils.dateparse import parse_date

from .models import Video


def fetch_or_create_video(youtube_id: str) -> Video:
    """
    Return an existing Video record or fetch metadata from the
    YouTube Data API v3 and create a new one.
    Falls back to minimal stub data when no API key is configured.
    """
    try:
        return Video.objects.get(youtube_id=youtube_id)
    except Video.DoesNotExist:
        pass

    api_key = settings.YOUTUBE_API_KEY
    if api_key:
        meta = _fetch_youtube_metadata(youtube_id, api_key)
    else:
        # Stub — useful during development without a key
        meta = {
            'title':            f'YouTube Video ({youtube_id})',
            'description':      '',
            'thumbnail_url':    f'https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg',
            'duration_seconds': 0,
            'channel_id':       '',
            'channel_name':     'Unknown Channel',
            'category':         None,
            'published_at':     None,
        }

    return Video.objects.create(youtube_id=youtube_id, **meta)


def _fetch_youtube_metadata(youtube_id: str, api_key: str) -> dict:
    """Call YouTube Data API v3 and parse the response."""
    url = 'https://www.googleapis.com/youtube/v3/videos'
    params = {
        'key':  api_key,
        'id':   youtube_id,
        'part': 'snippet,contentDetails',
    }
    resp = requests.get(url, params=params, timeout=10)
    resp.raise_for_status()
    items = resp.json().get('items', [])

    if not items:
        # Video is private, deleted, or the ID doesn't exist
        raise ValueError(
            'This video could not be found. It may be private, deleted, or the link is incorrect.'
        )

    item     = items[0]
    snippet  = item['snippet']
    details  = item['contentDetails']

    import html

    return {
        'title':            html.unescape(snippet.get('title', '')),
        'description':      html.unescape(snippet.get('description', '')),
        'thumbnail_url':    _best_thumbnail(snippet.get('thumbnails', {})),
        'duration_seconds': _parse_iso_duration(details.get('duration', 'PT0S')),
        'channel_id':       snippet.get('channelId', ''),
        'channel_name':     html.unescape(snippet.get('channelTitle', '')),
        'category':         snippet.get('categoryId'),
        'published_at':     parse_date(snippet.get('publishedAt', '')[:10]) if snippet.get('publishedAt') else None,
    }


def _best_thumbnail(thumbnails: dict) -> str | None:
    for quality in ('maxres', 'standard', 'high', 'medium', 'default'):
        if quality in thumbnails:
            return thumbnails[quality].get('url')
    return None


def _parse_iso_duration(duration: str) -> int:
    """Convert ISO 8601 duration (PT1H2M3S) to total seconds."""
    import re
    match = re.match(
        r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?',
        duration,
    )
    if not match:
        return 0
    hours   = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)
    return hours * 3600 + minutes * 60 + seconds


def download_youtube_audio(youtube_id: str) -> str:
    """
    Download the audio track from a YouTube video using yt-dlp.
    Avoids transcoding by fetching m4a directly (AAC), ensuring it runs without ffmpeg.
    Returns the path of the downloaded file.
    """
    import os
    import tempfile
    import yt_dlp

    video_url = f"https://www.youtube.com/watch?v={youtube_id}"
    temp_dir = tempfile.gettempdir()

    ydl_opts = {
        'format': '139/m4a/bestaudio',
        'outtmpl': os.path.join(temp_dir, f"yt_audio_{youtube_id}.%(ext)s"),
        'quiet': True,
        'no_warnings': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(video_url, download=True)
        file_path = ydl.prepare_filename(info)
        return file_path

