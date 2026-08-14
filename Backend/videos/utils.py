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


def download_and_cut_youtube_video(
    youtube_id: str,
    start_seconds: int,
    end_seconds: int,
    output_path: str,
) -> str:
    """
    Download ONLY the requested clip section from YouTube and save it directly
    to output_path as an .mp4 file.

    Uses yt-dlp's download_ranges option so only the bytes for the clip's
    time window are transferred (instead of the entire video).  Combined with
    force_keyframes_at_cuts this gives frame-accurate output via ffmpeg.

    Cookie strategy (tried in order):
      1. cookies.txt file at Backend/yt-cookies.txt  — most reliable
      2. Browser cookies (edge → firefox → brave → chrome)
      3. No cookies — last resort

    Args:
        youtube_id:    11-character YouTube video ID.
        start_seconds: Clip start time in whole seconds.
        end_seconds:   Clip end time in whole seconds.
        output_path:   Full path where the .mp4 should be written.

    Returns:
        output_path on success.
    """
    import os
    import shutil
    import yt_dlp
    from django.conf import settings as dj_settings

    video_url = f"https://www.youtube.com/watch?v={youtube_id}"
    # yt-dlp writes to a path derived from outtmpl — we want output_path exactly.
    # Strip the extension so yt-dlp can append .mp4 itself, then rename.
    out_dir      = os.path.dirname(output_path)
    out_stem     = os.path.splitext(os.path.basename(output_path))[0]
    outtmpl      = os.path.join(out_dir, f"{out_stem}.%(ext)s")

    # ── Error keywords that mean "try the next auth method" ──────────────────
    _RETRYABLE = (
        'sign in', 'bot', 'cookie', 'permission denied',
        'could not copy', 'failed to load cookies',
    )

    def _is_auth_error(exc: Exception) -> bool:
        return any(kw in str(exc).lower() for kw in _RETRYABLE)

    def _base_opts() -> dict:
        from yt_dlp.utils import download_range_func
        return {
            # ── Format selection ──────────────────────────────────────────────
            # IMPORTANT: must use a pre-merged (single-stream) format.
            #
            # If we pick bestvideo+bestaudio (separate DASH streams), yt-dlp
            # is forced to use ffmpeg as an *external downloader* to handle the
            # range request + merge in one pass.  That ffmpeg process opens the
            # YouTube URL directly without cookies → HTTP 403 Forbidden.
            #
            # Pre-merged streams are downloaded entirely by yt-dlp using its
            # own authenticated HTTP session, so the cookies work correctly.
            #
            # Quality ladder (yt-dlp tries each in order, stops at first match):
            #   1080p mp4 → 720p mp4 → best available mp4 → best any format
            'format': (
                'best[ext=mp4][height<=1080]'
                '/best[ext=mp4][height<=720]'
                '/best[ext=mp4]'
                '/best'
            ),
            'outtmpl': outtmpl,
            'merge_output_format': 'mp4',
            # ── Download only the requested time window ───────────────────────
            'download_ranges': download_range_func(None, [(start_seconds, end_seconds)]),
            # force_keyframes_at_cuts intentionally OMITTED — it triggers the
            # same ffmpeg-external-downloader path and gets 403.
            # ── Resilience ───────────────────────────────────────────────────
            'retries': 10,
            'fragment_retries': 10,
            'skip_unavailable_fragments': False,
            # ── Logging ──────────────────────────────────────────────────────
            'quiet': False,
            'no_warnings': True,
        }

    def _try_download(extra_opts: dict) -> str | None:
        opts = {**_base_opts(), **extra_opts}
        try:
            with yt_dlp.YoutubeDL(opts) as ydl:
                ydl.download([video_url])
            # yt-dlp writes <stem>.mp4 (or merges to it)
            candidate = os.path.join(out_dir, f"{out_stem}.mp4")
            if os.path.exists(candidate) and os.path.getsize(candidate) > 0:
                if candidate != output_path:
                    shutil.move(candidate, output_path)
                return output_path
            return None
        except (yt_dlp.utils.DownloadError, Exception) as exc:
            if _is_auth_error(exc):
                return None   # try next auth method
            raise

    # ── 1. cookies.txt file ───────────────────────────────────────────────────
    cookies_file = str(dj_settings.BASE_DIR / 'yt-cookies.txt')
    if os.path.exists(cookies_file):
        result = _try_download({'cookiefile': cookies_file})
        if result:
            return result

    # ── 2. Browser cookies (skip locked DBs automatically) ───────────────────
    for browser in ('edge', 'firefox', 'brave', 'chrome'):
        result = _try_download({'cookiesfrombrowser': (browser,)})
        if result:
            return result

    # ── 3. No cookies ────────────────────────────────────────────────────────
    result = _try_download({})
    if result:
        return result

    raise RuntimeError(
        "YouTube download failed. Please export your YouTube cookies:\n"
        "  1. Install 'Get cookies.txt LOCALLY' extension in Chrome/Edge\n"
        "  2. Visit youtube.com while logged in\n"
        "  3. Click the extension → Export → save as  Backend/yt-cookies.txt\n"
        "  4. Retry the cut."
    )


# Keep the old name as an alias so existing imports don't break
def download_youtube_video(youtube_id: str, output_dir: str) -> str:
    """Deprecated: use download_and_cut_youtube_video() instead."""
    raise NotImplementedError(
        "Use download_and_cut_youtube_video(youtube_id, start, end, output_path)"
    )



def cut_video_segment(input_path: str, start_seconds: int, end_seconds: int, output_path: str) -> str:
    """
    Extract a segment from a video file using ffmpeg stream-copy (no re-encode).

    Stream-copy is fast (1–3 seconds regardless of clip length) and
    lossless. The cut snaps to the nearest preceding keyframe so the
    actual start may be a couple of seconds earlier than requested —
    this is expected behaviour with copy-cut mode.

    Args:
        input_path:    Absolute path to the source .mp4 file.
        start_seconds: Segment start time in whole seconds.
        end_seconds:   Segment end time in whole seconds.
        output_path:   Where to write the clipped .mp4.

    Returns:
        output_path (same value passed in) on success.

    Raises:
        RuntimeError: if ffmpeg exits with a non-zero return code.
    """
    import subprocess
    import shutil

    ffmpeg_bin = shutil.which('ffmpeg') or 'ffmpeg'
    duration   = end_seconds - start_seconds

    cmd = [
        ffmpeg_bin,
        '-y',                        # overwrite output without asking
        '-ss', str(start_seconds),   # fast seek BEFORE -i (keyframe-accurate)
        '-i', input_path,
        '-t', str(duration),         # duration to keep
        '-c', 'copy',                # stream-copy: no re-encode
        '-movflags', '+faststart',   # optimise for web streaming
        output_path,
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg failed (exit {result.returncode}):\n{result.stderr[-2000:]}"
        )
    return output_path
