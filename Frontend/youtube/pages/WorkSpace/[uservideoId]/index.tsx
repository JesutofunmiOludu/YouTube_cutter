'use client'

// src/app/(app)/workspace/[userVideoId]/page.tsx
//
// Layout (matches wireframe):
// ┌──────────────────────────────────────────────────────────┐
// │  ← Back          Video Editor                      👤   │
// ├──────────┬───────────────────────────────┬───────────────┤
// │ Left     │ Center                        │ Right         │
// │ Tabs:    │  · Video player               │  Cut Clips    │
// │  Transcr │  · Cut Suggestions header     │  (approved)   │
// │  Chat    │  · Cut / Add Cut / Split btns │               │
// │  Researc │  · Timeline                   │               │
// │          │  · Cut segment cards          │               │
// ├──────────┤                               │               │
// │ +Add Vid │                               │  Download All │
// └──────────┴───────────────────────────────┴───────────────┘

import {
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react'
import { useRouter }            from 'next/router'
import Link                     from 'next/link'
import {
  ChevronLeft,
  Scissors,
  Plus,
  Clock,
  Download,
  Pencil,
  User,
  Check,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  MessageSquare,
  Globe,
  FileText,
} from 'lucide-react'
import { cn }         from '@/utils/cn'
import { Spinner }    from '@/components/ui/Spinner'
import type {
  UserVideo,
  VideoCut,
  Transcription,
  TranscriptSegment,
} from '@/types'

// ── YouTube API types ─────────────────────────────────────

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

// ── Mock data ─────────────────────────────────────────────

const MOCK_USER_VIDEO: UserVideo = {
  id: 'uv1', user_id: 'u1',
  storage_type: 'reference', file_url: null,
  processing_status: 'completed',
  saved_at: '', last_accessed_at: '',
  video: {
    id: 'v1', youtube_id: 'dQw4w9WgXcQ',
    title: 'React Hooks — Full Beginner to Advanced Course',
    description: null,
    thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
    duration_seconds: 8073,
    channel_id: 'c1', channel_name: 'Fireship',
    category: 'Tutorial', published_at: null, created_at: '',
  },
}

const MOCK_CUTS: VideoCut[] = [
  { id: 'c1', user_video_id: 'uv1', cut_order: 1, start_seconds: 36,  end_seconds: 300,  title: 'Introduction & what are hooks?',  ai_suggested: true, ai_rationale: 'Topic shifts from intro to useState deep dive — natural chapter break.', user_approved: false, download_url: null, download_status: 'pending', duration_seconds: 264,  created_at: '', updated_at: '' },
  { id: 'c2', user_video_id: 'uv1', cut_order: 2, start_seconds: 300, end_seconds: 600,  title: 'Introduction & what are hooks?',  ai_suggested: true, ai_rationale: 'Topic shifts from intro to useState deep dive — natural chapter break.', user_approved: false, download_url: null, download_status: 'pending', duration_seconds: 300,  created_at: '', updated_at: '' },
  { id: 'c3', user_video_id: 'uv1', cut_order: 3, start_seconds: 600, end_seconds: 980,  title: 'useState basics',                 ai_suggested: true, ai_rationale: 'useState section complete, useEffect begins.', user_approved: true,  download_url: null, download_status: 'pending', duration_seconds: 380,  created_at: '', updated_at: '' },
  { id: 'c4', user_video_id: 'uv1', cut_order: 4, start_seconds: 980, end_seconds: 1500, title: 'useState advanced patterns',       ai_suggested: true, ai_rationale: 'Advanced patterns section.', user_approved: true,  download_url: null, download_status: 'pending', duration_seconds: 520,  created_at: '', updated_at: '' },
]

const MOCK_TRANSCRIPT: TranscriptSegment[] = [
  { id: 's1', transcription_id: 't1', start_seconds: 0,   end_seconds: 15,  text: "Hey everyone, welcome to this complete React hooks course. Today we'll cover everything you need to know.", created_at: '' },
  { id: 's2', transcription_id: 't1', start_seconds: 15,  end_seconds: 36,  text: "We'll start with the fundamentals, then move into state management with useState, side effects with useEffect, and then custom hooks.", created_at: '' },
  { id: 's3', transcription_id: 't1', start_seconds: 36,  end_seconds: 65,  text: "Hooks were introduced in React 16.8 and completely changed how we write React components. Let me show you why they matter.", created_at: '' },
  { id: 's4', transcription_id: 't1', start_seconds: 300, end_seconds: 320, text: "Now let's dive into useState. This is the most fundamental hook and you'll use it in almost every component you build.", created_at: '' },
  { id: 's5', transcription_id: 't1', start_seconds: 320, end_seconds: 350, text: "useState returns an array with two elements: the current value and a setter function. Let me show you a counter example.", created_at: '' },
]

// ── Helpers ───────────────────────────────────────────────

function formatTime(s: number): string {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  if (m === 0) return `${sec} sec`
  return `${m} min ${sec > 0 ? `${sec} sec` : ''}`.trim()
}

// ── YouTube singleton loader ───────────────────────────────

let ytApiLoaded = false
const ytCallbacks: Array<() => void> = []

function loadYTApi(cb: () => void) {
  if (ytApiLoaded) { cb(); return }
  ytCallbacks.push(cb)
  if (document.getElementById('yt-api')) return
  const s = document.createElement('script')
  s.id  = 'yt-api'
  s.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(s)
  window.onYouTubeIframeAPIReady = () => {
    ytApiLoaded = true
    ytCallbacks.forEach((fn) => fn())
    ytCallbacks.length = 0
  }
}

// ── Inline Edit Time modal ────────────────────────────────

function EditTimeDrawer({
  cut,
  totalDuration,
  onSave,
  onCancel,
}: {
  cut:           VideoCut
  totalDuration: number
  onSave:        (start: number, end: number) => void
  onCancel:      () => void
}) {
  const [start, setStart] = useState(cut.start_seconds)
  const [end,   setEnd]   = useState(cut.end_seconds)

  return (
    <div className="mt-3 p-3 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-tertiary)] flex flex-col gap-3">
      <p className="text-label text-[var(--color-text-secondary)] uppercase tracking-wider">Edit clip times</p>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-caption text-[var(--color-text-tertiary)] w-10 shrink-0">Start</span>
          <input
            type="range"
            min={0}
            max={end - 1}
            value={start}
            step={1}
            onChange={(e) => setStart(Number(e.target.value))}
            className="flex-1 accent-primary-600 h-1.5 cursor-pointer"
            aria-label="Start time"
          />
          <span className="text-caption font-medium tabular-nums text-[var(--color-text-primary)] w-14 text-right">
            {formatTime(start)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-caption text-[var(--color-text-tertiary)] w-10 shrink-0">End</span>
          <input
            type="range"
            min={start + 1}
            max={totalDuration}
            value={end}
            step={1}
            onChange={(e) => setEnd(Number(e.target.value))}
            className="flex-1 accent-primary-600 h-1.5 cursor-pointer"
            aria-label="End time"
          />
          <span className="text-caption font-medium tabular-nums text-[var(--color-text-primary)] w-14 text-right">
            {formatTime(end)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-body-sm text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(start, end)}
          className="px-3 py-1.5 rounded-lg text-body-sm text-white bg-primary-600 hover:bg-primary-800 transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  )
}

// ── Cut suggestion card ───────────────────────────────────

function CutCard({
  cut,
  index,
  isActive,
  totalDuration,
  onCut,
  onEditSave,
  onSeek,
}: {
  cut:           VideoCut
  index:         number
  isActive:      boolean
  totalDuration: number
  onCut:         (id: string) => void
  onEditSave:    (id: string, start: number, end: number) => void
  onSeek:        (s: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const duration = cut.end_seconds - cut.start_seconds

  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-colors duration-fast',
        isActive
          ? 'border-primary-200 bg-primary-50/40'
          : 'border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]',
      )}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        {/* Index badge */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-body-sm font-medium mt-0.5',
            isActive
              ? 'bg-primary-600 text-white'
              : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)]',
          )}
        >
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-heading-sm text-[var(--color-text-primary)] mb-0.5">
            {cut.title ?? `Segment ${index + 1}`}
          </p>

          {/* Time range */}
          <button
            onClick={() => onSeek(cut.start_seconds)}
            className="text-body-sm text-[var(--color-text-secondary)] hover:text-primary-600 transition-colors focus-visible:outline-none focus-visible:underline tabular-nums"
            aria-label={`Seek to ${formatTime(cut.start_seconds)}`}
          >
            {formatTime(cut.start_seconds)} → {formatTime(cut.end_seconds)}
            <span className="ml-1 text-[var(--color-text-tertiary)]">
              · {formatDuration(duration)}
            </span>
          </button>

          {/* AI rationale */}
          {cut.ai_rationale && !editing && (
            <p className="text-caption text-[var(--color-text-tertiary)] italic mt-1 leading-relaxed">
              AI: {cut.ai_rationale}
            </p>
          )}
        </div>
      </div>

      {/* Inline edit drawer */}
      {editing && (
        <EditTimeDrawer
          cut={cut}
          totalDuration={totalDuration}
          onSave={(s, e) => {
            onEditSave(cut.id, s, e)
            setEditing(false)
          }}
          onCancel={() => setEditing(false)}
        />
      )}

      {/* Action buttons */}
      {!editing && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onCut(cut.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors',
              cut.user_approved
                ? 'bg-success-50 text-success-800 border-success-200 hover:bg-success-200'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)]',
            )}
          >
            {cut.user_approved
              ? <><Check className="w-3.5 h-3.5" /> Cut</>
              : <><Scissors className="w-3.5 h-3.5" /> Cut</>
            }
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Time
          </button>
        </div>
      )}
    </div>
  )
}

// ── Right panel — Cut Clips list ──────────────────────────

function CutClipsPanel({
  cuts,
  onDownloadAll,
  onSeek,
}: {
  cuts:          VideoCut[]
  onDownloadAll: () => void
  onSeek:        (s: number) => void
}) {
  const approved = cuts.filter((c) => c.user_approved)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-[var(--color-border-tertiary)] shrink-0">
        <h2 className="text-heading-lg text-[var(--color-text-primary)]">Cut Clips</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {approved.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
            <Scissors className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Mark cuts as approved to see them here
            </p>
          </div>
        ) : (
          approved.map((cut, i) => (
            <button
              key={cut.id}
              onClick={() => onSeek(cut.start_seconds)}
              className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] text-left hover:border-[var(--color-border-secondary)] transition-colors group"
            >
              {/* Number */}
              <span className="w-6 h-6 rounded-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] flex items-center justify-center text-body-sm font-medium text-[var(--color-text-secondary)] shrink-0">
                {i + 1}
              </span>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">
                  {cut.title ?? `Clip ${i + 1}`}
                </p>
                <p className="text-caption text-[var(--color-text-tertiary)] tabular-nums">
                  {formatTime(cut.start_seconds)} - {formatTime(cut.end_seconds)}
                </p>
              </div>

              {/* Download icon */}
              <div className="w-8 h-8 rounded-full border border-[var(--color-border-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] group-hover:border-primary-200 group-hover:text-primary-600 transition-colors shrink-0">
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
            </button>
          ))
        )}
      </div>

      {/* Download All footer */}
      <div className="px-4 py-4 border-t border-[var(--color-border-tertiary)] shrink-0">
        <button
          onClick={onDownloadAll}
          disabled={approved.length === 0}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-body-sm font-medium transition-colors',
            'border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)]',
            'text-[var(--color-text-primary)]',
            approved.length > 0
              ? 'hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-border-primary)]'
              : 'opacity-40 cursor-not-allowed',
          )}
        >
          Download All
          <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center">
            <Download className="w-3 h-3" aria-hidden="true" />
          </div>
        </button>
      </div>
    </div>
  )
}

// ── Left panel tabs ───────────────────────────────────────

type LeftTab = 'transcripts' | 'chat' | 'research'

function LeftPanel({
  activeTab,
  onTabChange,
  transcript,
  currentTime,
  onSeek,
  userVideoId,
}: {
  activeTab:   LeftTab
  onTabChange: (t: LeftTab) => void
  transcript:  TranscriptSegment[]
  currentTime: number
  onSeek:      (s: number) => void
  userVideoId: string
}) {
  const router = useRouter()

  const TABS: { id: LeftTab; label: string }[] = [
    { id: 'transcripts', label: 'Transcripts' },
    { id: 'chat',        label: 'Chat'        },
    { id: 'research',    label: 'Research'    },
  ]

  // Active segment
  const activeSegId = (() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      const seg = transcript[i]!
      if (currentTime >= seg.start_seconds) return seg.id
    }
    return transcript[0]?.id ?? null
  })()

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border-tertiary)] shrink-0" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={activeTab === t.id}
            onClick={() => onTabChange(t.id)}
            className={cn(
              'flex-1 py-3 text-body-sm font-medium border-b-2 transition-colors focus-visible:outline-none',
              activeTab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">

        {/* Transcripts */}
        {activeTab === 'transcripts' && (
          <div className="flex flex-col">
            {transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center px-4">
                <FileText className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
                <p className="text-body-sm text-[var(--color-text-secondary)]">Transcript will appear here once processing completes.</p>
              </div>
            ) : (
              transcript.map((seg) => {
                const isActive = seg.id === activeSegId
                return (
                  <button
                    key={seg.id}
                    onClick={() => onSeek(seg.start_seconds)}
                    className={cn(
                      'flex gap-3 px-4 py-3 text-left w-full transition-colors',
                      isActive
                        ? 'bg-primary-50/60 border-l-2 border-primary-600'
                        : 'hover:bg-[var(--color-bg-secondary)] border-l-2 border-transparent',
                    )}
                  >
                    <span className="text-caption tabular-nums text-primary-600 shrink-0 mt-0.5 w-10">
                      {formatTime(seg.start_seconds)}
                    </span>
                    <p className={cn(
                      'text-body-sm leading-relaxed',
                      isActive ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]',
                    )}>
                      {seg.text}
                    </p>
                  </button>
                )
              })
            )}
          </div>
        )}

        {/* Chat */}
        {activeTab === 'chat' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4 text-center">
            <MessageSquare className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <p className="text-heading-sm text-[var(--color-text-primary)]">Chat about this video</p>
            <p className="text-body-sm text-[var(--color-text-secondary)]">Ask questions and get answers grounded in the video content.</p>
            <button
              onClick={() => router.push(`/chat?videoId=${userVideoId}`)}
              className="px-4 py-2 rounded-lg text-body-sm font-medium text-white bg-primary-600 hover:bg-primary-800 transition-colors"
            >
              Open chat
            </button>
          </div>
        )}

        {/* Research */}
        {activeTab === 'research' && (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12 px-4 text-center">
            <Globe className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <p className="text-heading-sm text-[var(--color-text-primary)]">Deep research</p>
            <p className="text-body-sm text-[var(--color-text-secondary)]">AI scours the web and returns a fully cited report on this topic.</p>
            <button
              onClick={() => router.push(`/research?videoId=${userVideoId}`)}
              className="px-4 py-2 rounded-lg text-body-sm font-medium text-white bg-primary-600 hover:bg-primary-800 transition-colors"
            >
              Start research
            </button>
          </div>
        )}
      </div>

      {/* Add Video footer */}
      <div className="shrink-0 p-4 border-t border-[var(--color-border-tertiary)]">
        <button
          onClick={() => router.push('/search')}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-11 rounded-xl',
            'text-body-sm font-medium',
            'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]',
            'border-2 border-dashed border-[var(--color-border-secondary)]',
            'hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50/30',
            'transition-colors',
          )}
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Video
        </button>
      </div>
    </div>
  )
}

// ── Video player ──────────────────────────────────────────

function VideoPlayer({
  youtubeId,
  title,
  onTimeUpdate,
}: {
  youtubeId:    string
  title:        string
  onTimeUpdate: (t: number) => void
}) {
  const containerId = `yt-${youtubeId}`
  const playerRef   = useRef<YTPlayer | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted,   setIsMuted]   = useState(false)
  const [current,   setCurrent]   = useState(0)
  const [duration,  setDuration]  = useState(0)
  const [isReady,   setIsReady]   = useState(false)

  useEffect(() => {
    loadYTApi(() => {
      playerRef.current = new window.YT.Player(containerId, {
        videoId:    youtubeId,
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            setDuration(e.target.getDuration())
            setIsReady(true)
          },
          onStateChange: (e: { data: number }) => {
            const playing = e.data === window.YT.PlayerState.PLAYING
            setIsPlaying(playing)
            if (playing) {
              intervalRef.current = setInterval(() => {
                const t = playerRef.current?.getCurrentTime() ?? 0
                setCurrent(t)
                onTimeUpdate(t)
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

  const togglePlay = () => isPlaying ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()
  const toggleMute = () => { isMuted ? playerRef.current?.unMute() : playerRef.current?.mute(); setIsMuted((v) => !v) }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value)
    playerRef.current?.seekTo(t, true)
    setCurrent(t)
  }

  // expose seekTo via ref on window (simple approach for this component tree)
  ;(window as unknown as Record<string, unknown>)['__playerRef__'] = playerRef

  const pct = duration > 0 ? (current / duration) * 100 : 0

  return (
    <div className="relative bg-black group">
      {/* YouTube iframe target */}
      <div id={containerId} className="w-full aspect-video" />

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 bg-black flex items-center justify-center">
          <Spinner size="lg" variant="white" />
        </div>
      )}

      {/* Controls overlay */}
      <div className={cn(
        'absolute inset-0 flex flex-col justify-end',
        'bg-gradient-to-t from-black/80 via-transparent to-transparent',
        'opacity-0 group-hover:opacity-100 transition-opacity duration-base',
        !isPlaying && 'opacity-100',
      )}>
        {/* Title */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-caption text-white/80 truncate">{title}</p>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={current}
            step={0.5}
            onChange={handleSeek}
            className="w-full h-1 cursor-pointer accent-white"
            aria-label="Video progress"
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}
            className="text-white hover:text-white/80 transition-colors">
            {isPlaying
              ? <Pause className="w-5 h-5" aria-hidden="true" />
              : <Play  className="w-5 h-5" aria-hidden="true" />
            }
          </button>
          <span className="text-caption text-white/80 tabular-nums">
            {formatTime(Math.round(current))} / {formatTime(Math.round(duration))}
          </span>
          <div className="flex-1" />
          <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}
            className="text-white hover:text-white/80 transition-colors">
            {isMuted
              ? <VolumeX className="w-4 h-4" aria-hidden="true" />
              : <Volume2 className="w-4 h-4" aria-hidden="true" />
            }
          </button>
          <a href={`https://youtu.be/${youtubeId}`} target="_blank" rel="noopener noreferrer"
            aria-label="Open on YouTube" className="text-white hover:text-white/80 transition-colors">
            <Maximize2 className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}

// ── Timeline bar ──────────────────────────────────────────

function Timeline({
  cuts,
  duration,
  currentTime,
  onSeek,
}: {
  cuts:        VideoCut[]
  duration:    number
  currentTime: number
  onSeek:      (s: number) => void
}) {
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      className="relative h-8 w-full bg-[var(--color-bg-tertiary)] rounded-md overflow-hidden cursor-pointer border border-[var(--color-border-tertiary)]"
      role="slider"
      aria-valuenow={Math.round(currentTime)}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      tabIndex={0}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const pct  = (e.clientX - rect.left) / rect.width
        onSeek(pct * duration)
      }}
      onKeyDown={(e) => {
        const step = duration * 0.02
        if (e.key === 'ArrowRight') onSeek(Math.min(currentTime + step, duration))
        if (e.key === 'ArrowLeft')  onSeek(Math.max(currentTime - step, 0))
      }}
    >
      {/* Cut markers */}
      {cuts.map((cut, i) => {
        const left  = duration > 0 ? (cut.start_seconds / duration) * 100 : 0
        const width = duration > 0 ? ((cut.end_seconds - cut.start_seconds) / duration) * 100 : 0
        return (
          <div
            key={cut.id}
            className={cn(
              'absolute top-0 h-full border-x',
              cut.user_approved
                ? 'bg-success-50/60 border-success-200'
                : 'bg-primary-50/50 border-primary-200',
            )}
            style={{ left: `${left}%`, width: `${Math.max(width, 0.5)}%` }}
          >
            {width > 5 && (
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-medium text-[var(--color-text-tertiary)]">
                {i + 1}
              </span>
            )}
          </div>
        )
      })}

      {/* Playhead */}
      <div
        className="absolute top-0 h-full w-0.5 bg-black pointer-events-none z-10"
        style={{ left: `${playheadPct}%` }}
        aria-hidden="true"
      >
        {/* Triangle playhead indicator */}
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-3 h-3 flex items-center justify-center">
          <div
            className="w-0 h-0"
            style={{
              borderLeft:   '5px solid transparent',
              borderRight:  '5px solid transparent',
              borderTop:    '8px solid black',
            }}
          />
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function WorkspacePage() {
  const router    = useRouter()
  const userVideoId = router.query.uservideoId as string | undefined

  // TODO: replace with useQuery
  const [userVideo, setUserVideo] = useState<UserVideo>(MOCK_USER_VIDEO)
  const [cuts,      setCuts]      = useState<VideoCut[]>(MOCK_CUTS)
  const transcript                = MOCK_TRANSCRIPT

  const [currentTime, setCurrentTime] = useState(0)
  const [leftTab,     setLeftTab]     = useState<LeftTab>('transcripts')
  const duration = userVideo.video.duration_seconds

  // Seek player via window ref (avoids threading the ref through 3 levels of props)
  const seekPlayer = useCallback((seconds: number) => {
    const ref = (window as unknown as Record<string, unknown>)['__playerRef__'] as React.MutableRefObject<YTPlayer | null> | undefined
    ref?.current?.seekTo(seconds, true)
    setCurrentTime(seconds)
  }, [])

  const handleCut = (cutId: string) => {
    setCuts((prev) =>
      prev.map((c) => c.id === cutId ? { ...c, user_approved: !c.user_approved } : c)
    )
  }

  const handleEditSave = (cutId: string, start: number, end: number) => {
    setCuts((prev) =>
      prev.map((c) => c.id === cutId
        ? { ...c, start_seconds: start, end_seconds: end, duration_seconds: end - start }
        : c
      )
    )
  }

  const handleSplitAtTime = () => {
    if (currentTime <= 0 || currentTime >= duration) return
    const newCut: VideoCut = {
      id:             `c${Date.now()}`,
      user_video_id:  userVideo.id,
      cut_order:      cuts.length + 1,
      start_seconds:  Math.round(currentTime),
      end_seconds:    duration,
      title:          `Split at ${formatTime(Math.round(currentTime))}`,
      ai_suggested:   false,
      ai_rationale:   null,
      user_approved:  false,
      download_url:   null,
      download_status:'pending',
      duration_seconds: duration - Math.round(currentTime),
      created_at: '', updated_at: '',
    }
    setCuts((prev) => [...prev, newCut])
  }

  const handleAddCutPoint = () => {
    handleSplitAtTime()
  }

  const activeCutId = cuts.find(
    (c) => currentTime >= c.start_seconds && currentTime < c.end_seconds
  )?.id ?? null

  return (
    <div
      className="flex flex-col overflow-hidden bg-[var(--color-bg-tertiary)]"
      style={{ height: '100dvh' }}
    >

      {/* ── Global topbar ── */}
      <header className="flex items-center justify-between px-4 h-12 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-tertiary)] shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-body-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:underline"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-heading-sm text-[var(--color-text-primary)] absolute left-1/2 -translate-x-1/2">
          Video Editor
        </h1>

        <button
          onClick={() => router.push('/settings')}
          className="w-8 h-8 rounded-full border border-[var(--color-border-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
          aria-label="Account settings"
        >
          <User className="w-4 h-4" aria-hidden="true" />
        </button>
      </header>

      {/* ── Three-column body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL (Transcripts / Chat / Research + Add Video) ── */}
        <div
          className="hidden md:flex flex-col border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] shrink-0"
          style={{ width: '220px' }}
        >
          <LeftPanel
            activeTab={leftTab}
            onTabChange={setLeftTab}
            transcript={transcript}
            currentTime={currentTime}
            onSeek={seekPlayer}
            userVideoId={userVideo.id}
          />
        </div>

        {/* ── CENTER — Video + Cut Suggestions ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">

          {/* Video player */}
          <VideoPlayer
            youtubeId={userVideo.video.youtube_id}
            title={userVideo.video.title}
            onTimeUpdate={setCurrentTime}
          />

          {/* Cut Suggestions header + action buttons + timeline */}
          <div className="px-5 pt-5 pb-3 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-tertiary)]">
            <h2 className="text-heading-lg text-[var(--color-text-primary)] mb-3">
              Cut Suggestions
            </h2>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <button
                onClick={() => handleCut(activeCutId ?? '')}
                disabled={!activeCutId}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium border transition-colors',
                  activeCutId
                    ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)]'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border-[var(--color-border-tertiary)] cursor-not-allowed',
                )}
              >
                <Scissors className="w-4 h-4" aria-hidden="true" />
                Cut
              </button>
              <button
                onClick={handleAddCutPoint}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                Add Cut Point
              </button>
              <button
                onClick={handleSplitAtTime}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                <Clock className="w-4 h-4" aria-hidden="true" />
                Split Time
              </button>
            </div>

            {/* Timeline */}
            <Timeline
              cuts={cuts}
              duration={duration}
              currentTime={currentTime}
              onSeek={seekPlayer}
            />
          </div>

          {/* Cut segment cards */}
          <div className="flex flex-col gap-3 p-5">
            {cuts.map((cut, i) => (
              <CutCard
                key={cut.id}
                cut={cut}
                index={i}
                isActive={cut.id === activeCutId}
                totalDuration={duration}
                onCut={handleCut}
                onEditSave={handleEditSave}
                onSeek={seekPlayer}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — Cut Clips ── */}
        <div
          className="hidden lg:flex flex-col border-l border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] shrink-0"
          style={{ width: '240px' }}
        >
          <CutClipsPanel
            cuts={cuts}
            onDownloadAll={() => console.log('Download all')}
            onSeek={seekPlayer}
          />
        </div>
      </div>
    </div>
  )
}