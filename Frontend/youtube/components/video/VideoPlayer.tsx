// ============================================================
// VidMind AI — VideoPlayer Component
// src/components/video/VideoPlayer.tsx
//
// Embedded YouTube player with a custom overlay showing
// current time, seek bar, and title.
// Exposes seekTo() via ref so other components (e.g.
// TranscriptPanel) can jump to a specific timestamp.
// ============================================================

import React, {
  useRef,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react'
import { cn }              from '@/utils/cn'
import { formatDuration }  from './VideoCard'

// ------------------------------------------------------------
// YOUTUBE IFRAME API TYPES (minimal)
// ------------------------------------------------------------

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId:    string
          playerVars?: Record<string, string | number>
          events?: {
            onReady?:       (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number })    => void
          }
        }
      ) => YTPlayer
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

interface YTPlayer {
  playVideo:        ()             => void
  pauseVideo:       ()             => void
  seekTo:           (s: number, allowSeekAhead: boolean) => void
  getCurrentTime:   ()             => number
  getDuration:      ()             => number
  isMuted:          ()             => boolean
  mute:             ()             => void
  unMute:           ()             => void
  getPlayerState:   ()             => number
  destroy:          ()             => void
}

// ------------------------------------------------------------
// REF HANDLE — exposed to parent components
// ------------------------------------------------------------

export interface VideoPlayerHandle {
  seekTo:     (seconds: number) => void
  play:       ()                => void
  pause:      ()                => void
  getTime:    ()                => number
}

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface VideoPlayerProps {
  youtubeId:  string
  title?:     string
  className?: string
  onTimeUpdate?: (seconds: number) => void
  autoPlay?:  boolean
}

// ------------------------------------------------------------
// YOUTUBE API LOADER (singleton)
// ------------------------------------------------------------

let apiLoaded = false
const apiCallbacks: Array<() => void> = []

function loadYouTubeAPI(onReady: () => void): void {
  if (apiLoaded) { onReady(); return }
  apiCallbacks.push(onReady)
  if (document.getElementById('yt-api-script')) return

  const script    = document.createElement('script')
  script.id       = 'yt-api-script'
  script.src      = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(script)

  window.onYouTubeIframeAPIReady = () => {
    apiLoaded = true
    apiCallbacks.forEach((cb) => cb())
    apiCallbacks.length = 0
  }
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(
  ({ youtubeId, title, className, onTimeUpdate, autoPlay = false }, ref) => {
    const containerId = useRef(`yt-player-${youtubeId}-${Math.random().toString(36).slice(2)}`)
    const playerRef   = useRef<YTPlayer | null>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const [isPlaying,    setIsPlaying]    = useState(false)
    const [isMuted,      setIsMuted]      = useState(false)
    const [currentTime,  setCurrentTime]  = useState(0)
    const [duration,     setDuration]     = useState(0)
    const [isReady,      setIsReady]      = useState(false)

    // Expose handle to parent
    useImperativeHandle(ref, () => ({
      seekTo:  (s) => playerRef.current?.seekTo(s, true),
      play:    ()  => playerRef.current?.playVideo(),
      pause:   ()  => playerRef.current?.pauseVideo(),
      getTime: ()  => playerRef.current?.getCurrentTime() ?? 0,
    }))

    useEffect(() => {
      loadYouTubeAPI(() => {
        playerRef.current = new window.YT.Player(containerId.current, {
          videoId:    youtubeId,
          playerVars: {
            controls:       0,
            disablekb:      1,
            modestbranding: 1,
            rel:            0,
            autoplay:       autoPlay ? 1 : 0,
          },
          events: {
            onReady: (e) => {
              setDuration(e.target.getDuration())
              setIsReady(true)
            },
            onStateChange: (e) => {
              const playing = e.data === window.YT.PlayerState.PLAYING
              setIsPlaying(playing)
              if (playing) {
                intervalRef.current = setInterval(() => {
                  const t = playerRef.current?.getCurrentTime() ?? 0
                  setCurrentTime(t)
                  onTimeUpdate?.(t)
                }, 250)
              } else {
                if (intervalRef.current) clearInterval(intervalRef.current)
              }
            },
          },
        })
      })

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        playerRef.current?.destroy()
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [youtubeId])

    const togglePlay = () => {
      if (!playerRef.current) return
      isPlaying
        ? playerRef.current.pauseVideo()
        : playerRef.current.playVideo()
    }

    const toggleMute = () => {
      if (!playerRef.current) return
      isMuted ? playerRef.current.unMute() : playerRef.current.mute()
      setIsMuted((v) => !v)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = Number(e.target.value)
      playerRef.current?.seekTo(t, true)
      setCurrentTime(t)
    }

    const pct = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
      <div
        className={cn(
          'relative w-full bg-black overflow-hidden group',
          'aspect-video',
          className,
        )}
      >
        {/* YouTube iframe container */}
        <div id={containerId.current} className="absolute inset-0 w-full h-full" />

        {/* Loading overlay */}
        {!isReady && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Controls overlay — visible on hover or when paused */}
        <div
          className={cn(
            'absolute inset-0 flex flex-col justify-end',
            'bg-gradient-to-t from-black/80 via-transparent to-black/20',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-base',
            !isPlaying && 'opacity-100',
          )}
        >
          {/* Title */}
          {title && (
            <div className="absolute top-0 left-0 right-0 px-3 py-2">
              <p className="text-caption text-white/80 truncate">{title}</p>
            </div>
          )}

          {/* Seek bar */}
          <div className="px-3 pb-1">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              step={0.5}
              onChange={handleSeek}
              className="w-full h-1 accent-primary-400 cursor-pointer"
              aria-label={`Seek. Current time: ${formatDuration(Math.round(currentTime))}`}
            />
          </div>

          {/* Bottom control row */}
          <div className="flex items-center gap-2 px-3 pb-2.5">
            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            >
              {isPlaying
                ? <Pause  className="w-4 h-4" aria-hidden="true" />
                : <Play   className="w-4 h-4" aria-hidden="true" />
              }
            </button>

            {/* Time */}
            <span className="text-caption text-white/80 tabular-nums">
              {formatDuration(Math.round(currentTime))} / {formatDuration(Math.round(duration))}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Mute */}
            <button
              onClick={toggleMute}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            >
              {isMuted
                ? <VolumeX className="w-4 h-4" aria-hidden="true" />
                : <Volume2 className="w-4 h-4" aria-hidden="true" />
              }
            </button>

            {/* Full screen hint */}
            <a
              href={`https://youtu.be/${youtubeId}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open on YouTube"
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <Maximize2 className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    )
  }
)

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer
