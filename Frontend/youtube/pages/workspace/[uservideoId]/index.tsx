// pages/workspace/[uservideoId]/index.tsx
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
  useMemo,
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
  X,
  Loader2,
  Lock,
  Search,
  Zap,
  BookOpen,
  Send,
  Square,
  ChevronDown,
  ArrowRight,
  Mic,
} from 'lucide-react'
import { cn }              from '@/utils/cn'
import { Spinner }         from '@/components/ui/Spinner'
import { useToast }        from '@/components/ui/Toast'
import CutTimeline         from '@/components/video/CutTimeline'
import ChatWindow          from '@/components/chat/ChatWindow'
import ResearchReport      from '@/components/research/ResearchReport'
import { SearchResultCard } from '@/components/research/SearchResultCard'
import { apiClient }       from '@/utils/apiClient'
import { useSubscription }  from '@/hooks/useSubscription'
import { UpgradeModal }     from '@/components/ui/UpgradeModal'
import type { GatedFeature } from '@/hooks/useSubscription'
import type {
  UserVideo,
  VideoCut,
  Transcription,
  TranscriptSegment,
  ChatSession,
  ChatMessage,
  ResearchSession,
  SearchResult,
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
  { id: 's1', transcription_id: 't1', segment_order: 1, start_seconds: 0,   end_seconds: 15,  text: "Hey everyone, welcome to this complete React hooks course. Today we'll cover everything you need to know.", confidence_score: null },
  { id: 's2', transcription_id: 't1', segment_order: 2, start_seconds: 15,  end_seconds: 36,  text: "We'll start with the fundamentals, then move into state management with useState, side effects with useEffect, and then custom hooks.", confidence_score: null },
  { id: 's3', transcription_id: 't1', segment_order: 3, start_seconds: 36,  end_seconds: 65,  text: "Hooks were introduced in React 16.8 and completely changed how we write React components. Let me show you why they matter.", confidence_score: null },
  { id: 's4', transcription_id: 't1', segment_order: 4, start_seconds: 300, end_seconds: 320, text: "Now let's dive into useState. This is the most fundamental hook and you'll use it in almost every component you build.", confidence_score: null },
  { id: 's5', transcription_id: 't1', segment_order: 5, start_seconds: 320, end_seconds: 350, text: "useState returns an array with two elements: the current value and a setter function. Let me show you a counter example.", confidence_score: null },
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
  if (window.document.getElementById('yt-api')) return
  const s = window.document.createElement('script')
  s.id  = 'yt-api'
  s.src = 'https://www.youtube.com/iframe_api'
  window.document.head.appendChild(s)
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
  userVideoId,
  onCut,
  onDownload,
  onEditSave,
  onMetaSave,
  onSeek,
}: {
  cut:           VideoCut
  index:         number
  isActive:      boolean
  totalDuration: number
  userVideoId:   string
  onCut:         (id: string) => void
  onDownload:    (cut: VideoCut) => void
  onEditSave:    (id: string, start: number, end: number) => void
  onMetaSave:    (id: string, title: string, rationale: string) => void
  onSeek:        (s: number) => void
}) {
  const [editMode, setEditMode]           = useState<'none' | 'time' | 'meta'>('none')
  const [editTitle, setEditTitle]         = useState(cut.title ?? '')
  const [editRationale, setEditRationale] = useState(cut.ai_rationale ?? '')
  const [isSuggesting, setIsSuggesting]   = useState(false)
  const [suggestError, setSuggestError]   = useState('')
  const [suggestNote, setSuggestNote]     = useState('')   // shown when source === 'fallback'
  const duration = cut.end_seconds - cut.start_seconds

  // Keep local edit state in sync if the parent updates the cut
  // (e.g. after an AI re-suggest)
  useEffect(() => {
    setEditTitle(cut.title ?? '')
    setEditRationale(cut.ai_rationale ?? '')
  }, [cut.title, cut.ai_rationale])

  function submitMeta() {
    onMetaSave(cut.id, editTitle.trim() || `Segment ${index + 1}`, editRationale.trim())
    setEditMode('none')
  }

  async function suggestLabels() {
    setIsSuggesting(true)
    setSuggestError('')
    setSuggestNote('')
    try {
      const res = await apiClient.post(
        `/videos/${userVideoId}/cuts/${cut.id}/suggest-labels/`
      )
      setEditTitle(res.data.title ?? editTitle)
      setEditRationale(res.data.description ?? editRationale)
      if (res.data.source === 'fallback') {
        setSuggestNote(
          'No transcript found for this segment — suggestion is based on the video title and segment position. Feel free to edit it.'
        )
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message ?? 'AI suggestion failed. Please try again.'
      setSuggestError(msg)
    } finally {
      setIsSuggesting(false)
    }
  }


  return (
    <div
      onClick={(e) => {
        const target = e.target as HTMLElement
        if (target.closest('button, input, textarea, a')) return
        onSeek(cut.start_seconds)
      }}
      className={cn(
        'rounded-xl border p-4 transition-all duration-fast cursor-pointer group/card',
        isActive
          ? 'border-primary-300 bg-primary-50/50 shadow-sm ring-1 ring-primary-200'
          : 'border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] hover:border-primary-300 hover:bg-primary-50/20',
      )}
    >
      {/* ── Header row ── */}
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
          {editMode === 'meta' ? (
            // ── Inline meta-editor ──────────────────────────────
            <div className="flex flex-col gap-2">
              {/* ✨ AI Suggest button row */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
                  Edit Details
                </span>
                <button
                  type="button"
                  onClick={suggestLabels}
                  disabled={isSuggesting}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold bg-gradient-to-r from-purple-500 to-primary-500 text-white hover:from-purple-600 hover:to-primary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  {isSuggesting ? (
                    <><Spinner size="sm" /> Generating…</>
                  ) : (
                    <>✨ AI Suggest</>
                  )}
                </button>
              </div>

              {/* Error message */}
              {suggestError && (
                <p className="text-[11px] text-danger-600 bg-danger-50 rounded px-2 py-1">
                  {suggestError}
                </p>
              )}

              {/* Fallback note (no transcript available) */}
              {suggestNote && !suggestError && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 leading-relaxed">
                  ⚠️ {suggestNote}
                </p>
              )}

              {/* Title input */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-0.5">
                  Title
                </label>
                <input
                  autoFocus
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder={`Segment ${index + 1}`}
                  maxLength={200}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] text-body-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') submitMeta(); if (e.key === 'Escape') setEditMode('none') }}
                />
              </div>
              {/* Subtitle / rationale textarea */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide mb-0.5">
                  Description / Subtitle
                </label>
                <textarea
                  value={editRationale}
                  onChange={(e) => setEditRationale(e.target.value)}
                  placeholder="Describe what this segment covers…"
                  maxLength={500}
                  rows={2}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] text-body-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  onKeyDown={(e) => { if (e.key === 'Escape') setEditMode('none') }}
                />
              </div>
              {/* Save / Cancel */}
              <div className="flex gap-2">
                <button
                  onClick={submitMeta}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> Save
                </button>
                <button
                  onClick={() => { setEditTitle(cut.title ?? ''); setEditRationale(cut.ai_rationale ?? ''); setSuggestError(''); setEditMode('none') }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // ── Read-only display ────────────────────────────────
            <>
              {/* Title row with inline edit pencil + Play button */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 group/title">
                  <p className="text-heading-sm text-[var(--color-text-primary)] mb-0.5 truncate">
                    {cut.title ?? `Segment ${index + 1}`}
                  </p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditMode('meta') }}
                    title="Edit title & description"
                    className="opacity-0 group-hover/title:opacity-100 transition-opacity p-0.5 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:text-primary-600 shrink-0"
                    aria-label="Edit title and description"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>

                {/* Explicit Play segment button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onSeek(cut.start_seconds)
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary-50 text-primary-600 border border-primary-200 hover:bg-primary-600 hover:text-white hover:border-primary-600 transition-all shrink-0 shadow-2xs"
                  title={`Play segment starting at ${formatTime(cut.start_seconds)}`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Play</span>
                </button>
              </div>

              {/* Time range */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onSeek(cut.start_seconds)
                }}
                className="text-body-sm text-[var(--color-text-secondary)] hover:text-primary-600 transition-colors focus-visible:outline-none focus-visible:underline tabular-nums"
                aria-label={`Seek to ${formatTime(cut.start_seconds)}`}
              >
                {formatTime(cut.start_seconds)} → {formatTime(cut.end_seconds)}
                <span className="ml-1 text-[var(--color-text-tertiary)]">
                  · {formatDuration(duration)}
                </span>
              </button>

              {/* AI rationale / subtitle */}
              {cut.ai_rationale && (
                <p className="text-caption text-[var(--color-text-tertiary)] italic mt-1 leading-relaxed">
                  {cut.ai_rationale}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Inline time-edit drawer ── */}
      {editMode === 'time' && (
        <EditTimeDrawer
          cut={cut}
          totalDuration={totalDuration}
          onSave={(s, e) => {
            onEditSave(cut.id, s, e)
            setEditMode('none')
          }}
          onCancel={() => setEditMode('none')}
        />
      )}

      {/* ── Action buttons (hidden while editing) ── */}
      {editMode === 'none' && (() => {
        const isProcessing = cut.download_status === 'processing'
        const isReady      = cut.download_status === 'ready' && !!cut.download_url
        const isFailed     = cut.download_status === 'failed'
        const apiBase      = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

        return (
          <div className="flex gap-2 mt-3 flex-wrap">
            {/* ── Cut / Approve button ── */}
            <button
              onClick={() => onCut(cut.id)}
              disabled={isProcessing}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors',
                isProcessing
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 cursor-wait'
                  : isReady
                    ? 'bg-success-50 text-success-800 border-success-200 hover:bg-success-200'
                    : isFailed
                      ? 'bg-danger-50 text-danger-700 border-danger-200 hover:bg-danger-100'
                      : cut.user_approved
                        ? 'bg-success-50 text-success-800 border-success-200 hover:bg-success-200'
                        : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)]',
              )}
            >
              {isProcessing ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Cutting…</>
              ) : isReady ? (
                <><Check className="w-3.5 h-3.5" /> Cut & Ready</>
              ) : isFailed ? (
                <><Scissors className="w-3.5 h-3.5" /> Retry Cut</>
              ) : cut.user_approved ? (
                <><Check className="w-3.5 h-3.5" /> Cut</>
              ) : (
                <><Scissors className="w-3.5 h-3.5" /> Cut</>
              )}
            </button>

            {/* ── Download button — only when the clip file is ready ── */}
            {isReady && (
              <button
                onClick={() => onDownload(cut)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium border transition-colors bg-primary-600 text-white border-primary-600 hover:bg-primary-700"
                title="Download clip (.mp4)"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            )}

            {/* ── Edit buttons ── */}
            <button
              onClick={() => setEditMode('time')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Time
            </button>
            <button
              onClick={() => setEditMode('meta')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-body-sm font-medium bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              title="Edit title and description"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Details
            </button>
          </div>
        )
      })()}
    </div>
  )
}

// ── Right panel — Cut Clips list ──────────────────────────

function CutClipsPanel({
  cuts,
  userVideoId,
  onDownloadAll,
  onDownload,
  onSeek,
}: {
  cuts:          VideoCut[]
  userVideoId:   string
  onDownloadAll: () => void
  onDownload:    (cut: VideoCut) => Promise<void>
  onSeek:        (s: number) => void
}) {
  const { canUse } = useSubscription()
  const canBatchDownload = canUse('batch_download')
  const [showUpgrade, setShowUpgrade] = useState(false)
  // Track which cut IDs are currently downloading
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set())
  const approved = cuts.filter((c) => c.user_approved)

  async function handleDownloadCut(cut: VideoCut) {
    setDownloadingIds((prev) => new Set(prev).add(cut.id))
    try {
      await onDownload(cut)
    } finally {
      setDownloadingIds((prev) => { const n = new Set(prev); n.delete(cut.id); return n })
    }
  }

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
          approved.map((cut, i) => {
            const isDownloading = downloadingIds.has(cut.id)
            const isReady       = cut.download_status === 'ready' && !!cut.download_url
            const isProcessing  = cut.download_status === 'processing'
            const apiBase       = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
            return (
              <div
                key={cut.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)] transition-colors group"
              >
                {/* Seek area — clicking text/number seeks the player */}
                <button
                  onClick={() => onSeek(cut.start_seconds)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                  title={`Seek to ${formatTime(cut.start_seconds)}`}
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
                      {formatTime(cut.start_seconds)} – {formatTime(cut.end_seconds)}
                    </p>
                  </div>
                </button>

                {/* Download button — separate hit target */}
                {isReady ? (
                  // File is ready — download via API blob (bypasses cross-origin restriction)
                  <button
                    onClick={() => handleDownloadCut(cut)}
                    title="Download clip (.mp4)"
                    className="w-8 h-8 rounded-full border border-success-400 bg-success-50 flex items-center justify-center text-success-700 hover:bg-success-100 transition-colors shrink-0"
                    aria-label="Download clip"
                  >
                    <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                ) : isProcessing ? (
                  // Show spinner while server is cutting
                  <div
                    title="Cutting in progress…"
                    className="w-8 h-8 rounded-full border border-indigo-200 bg-indigo-50 flex items-center justify-center text-indigo-400 shrink-0"
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  </div>
                ) : (
                  <button
                    onClick={() => handleDownloadCut(cut)}
                    disabled={isDownloading}
                    title="Get clip link"
                    aria-label="Download clip"
                    className={cn(
                      'w-8 h-8 rounded-full border flex items-center justify-center transition-colors shrink-0',
                      isDownloading
                        ? 'border-primary-200 bg-primary-50 text-primary-400 cursor-wait'
                        : 'border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] group-hover:border-primary-300 group-hover:text-primary-600',
                    )}
                  >
                    {isDownloading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      : <Download className="w-3.5 h-3.5" aria-hidden="true" />}
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Download All footer */}
      <div className="px-4 py-4 border-t border-[var(--color-border-tertiary)] shrink-0">
        {/* Upgrade modal */}
        <UpgradeModal
          open={showUpgrade}
          onClose={() => setShowUpgrade(false)}
          feature="batch_download"
        />

        {canBatchDownload ? (
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
        ) : (
          <button
            onClick={() => setShowUpgrade(true)}
            className={cn(
              'w-full flex items-center justify-center gap-2 h-11 rounded-xl text-body-sm font-medium transition-colors',
              'border border-amber-200 bg-amber-50 text-amber-700',
              'hover:bg-amber-100 hover:border-amber-300',
            )}
          >
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            Download All
            <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800 ml-1">
              Premium
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Add Video Modal (inline, no navigation) ───────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] ?? null
    // youtube.com/watch?v=ID
    const v = u.searchParams.get('v')
    if (v) return v
    // youtube.com/embed/ID
    const embed = u.pathname.match(/\/embed\/([^/?]+)/)
    if (embed) return embed[1] ?? null
  } catch {/* not a valid URL */}
  return null
}

function AddVideoModal({
  onAdd,
  onClose,
}: {
  onAdd:  (video: UserVideo) => Promise<void>
  onClose: () => void
}) {
  const [url,     setUrl]     = useState('')
  const [error,   setError]   = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAdd = async () => {
    const ytId = extractYouTubeId(url.trim())
    if (!ytId) {
      setError('Please enter a valid YouTube URL (e.g. https://youtube.com/watch?v=…)')
      return
    }
    setError(null)
    setLoading(true)

    const newVideo: UserVideo = {
      id:                `uv_${ytId}`,
      user_id:           'u1',
      storage_type:      'reference',
      file_url:          null,
      processing_status: 'completed',
      saved_at:          new Date().toISOString(),
      last_accessed_at:  new Date().toISOString(),
      video: {
        id:            `v_${ytId}`,
        youtube_id:    ytId,
        title:         `YouTube Video (${ytId})`,
        description:   null,
        thumbnail_url: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
        duration_seconds: 0,
        channel_id:    'unknown',
        channel_name:  'YouTube',
        category:      null,
        published_at:  null,
        created_at:    new Date().toISOString(),
      },
    }

    try {
      await onAdd(newVideo)
    } catch (err: any) {
      const errorPayload = err?.response?.data?.error
      setError(errorPayload?.message ?? 'Failed to add video to chat.')
      setLoading(false)
    }
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-2xl border border-[var(--color-border-tertiary)] w-[90vw] max-w-md mx-4 p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-md text-[var(--color-text-primary)]">Add a Video</h2>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              Paste a YouTube link to include it in this chat session.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL input */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            YouTube URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=…"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              autoFocus
              className={cn(
                'flex-1 px-3 py-2.5 rounded-xl text-body-sm border bg-[var(--color-bg-secondary)]',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
                'outline-none focus:ring-2 focus:ring-primary-300 transition',
                error ? 'border-red-400' : 'border-[var(--color-border-secondary)]',
              )}
            />
          </div>
          {error && (
            <p className="text-caption text-red-500">{error}</p>
          )}
        </div>

        {/* Preview thumbnail if URL looks valid */}
        {extractYouTubeId(url) && (
          <div className="rounded-xl overflow-hidden border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]">
            <img
              src={`https://img.youtube.com/vi/${extractYouTubeId(url)}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full object-cover h-32"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <p className="text-caption text-[var(--color-text-tertiary)] px-3 py-2 truncate">
              youtube.com/watch?v={extractYouTubeId(url)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-body-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!url.trim() || loading}
            className="px-5 py-2 rounded-xl text-body-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <><Spinner size="sm" variant="white" label="Adding…" /> Adding…</>
            ) : (
              <><Plus className="w-4 h-4" /> Add to Chat</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Left panel tabs ───────────────────────────────────────

const STAGE_SEQUENCE = [
  { stage: 'pending',      label: 'Queued in background' },
  { stage: 'metadata',     label: 'Fetching video metadata' },
  { stage: 'transcript',   label: 'Checking YouTube subtitles' },
  { stage: 'downloading',  label: 'Downloading audio (48kbps M4A)' },
  { stage: 'transcribing', label: 'Gemini transcribing & segmenting' },
  { stage: 'saving',       label: 'Saving cuts and transcript' },
]

type LeftTab = 'transcripts' | 'chat' | 'research'

// Mock chat session for the inline panel
const MOCK_CHAT_SESSION: ChatSession = {
  id:           'cs1',
  user_id:      'u1',
  title:        'React Hooks Q&A',
  is_multi_video: false,
  videos:       [MOCK_USER_VIDEO],
  messages:     [
    {
      id: 'm1', chat_session_id: 'cs1', role: 'assistant',
      content: 'Hi! I\'ve read through the React Hooks video. Ask me anything about the content — useState, useEffect, custom hooks, or anything else covered.',
      token_count: null, created_at: new Date().toISOString(),
    },
  ],
  created_at:   new Date().toISOString(),
  updated_at:   new Date().toISOString(),
  last_message: null,
}

// Mock research session for the inline panel
const MOCK_RESEARCH_SESSION: ResearchSession = {
  id:            'rs1',
  user_id:       'u1',
  user_video:    MOCK_USER_VIDEO,
  title:         'React Hooks — Deep Research Report',
  report_content: `## Overview
React Hooks, introduced in React 16.8, represent a fundamental shift in how developers write React components. They allow functional components to use state and other React features that were previously only available in class components.

## Key Hooks Covered
The video covers the most essential hooks: **useState** for local state management, **useEffect** for side effects and lifecycle events, **useCallback** and **useMemo** for performance optimisations, and **useRef** for imperative DOM access and value persistence.

## Why Hooks Matter
Hooks eliminate the complexity of class components, mixins, and higher-order components. Code sharing between components becomes straightforward through custom hooks, making reuse patterns much simpler than before.

## Industry Adoption
As of 2024, React Hooks are the de-facto standard for all new React code. Virtually all major libraries (Redux Toolkit, React Query, Zustand) now expose hooks-first APIs.`,
  status:        'completed',
  sources:       [
    { id: 'src1', research_session_id: 'rs1', source_type: 'article', title: 'React Hooks Documentation', url: 'https://react.dev/reference/react', excerpt: 'Official React documentation covering all built-in hooks with examples.', relevance_rank: 1, fetched_at: new Date().toISOString() },
    { id: 'src2', research_session_id: 'rs1', source_type: 'article', title: 'A Complete Guide to useEffect', url: 'https://overreacted.io/a-complete-guide-to-useeffect/', excerpt: 'Deep-dive into useEffect by Dan Abramov, one of the core React team members.', relevance_rank: 2, fetched_at: new Date().toISOString() },
    { id: 'src3', research_session_id: 'rs1', source_type: 'paper', title: 'Hooks: React\'s answer to composition', url: 'https://engineering.fb.com/2019/02/06/web/react-hooks/', excerpt: 'Facebook engineering post on the motivation and design of React Hooks.', relevance_rank: 3, fetched_at: new Date().toISOString() },
  ],
  completed_at:  new Date().toISOString(),
  created_at:    new Date().toISOString(),
  updated_at:    new Date().toISOString(),
}

type SearchMode = 'search' | 'deep_research' | 'learn'

const SEARCH_MODES: { id: SearchMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'search',        label: 'Search',            icon: <Search   className="w-3.5 h-3.5" />, description: 'Quick web search with sources' },
  { id: 'deep_research', label: 'Deep Research',     icon: <Zap      className="w-3.5 h-3.5" />, description: 'In-depth AI research report (Premium)' },
  { id: 'learn',         label: 'Learn Step by Step',icon: <BookOpen className="w-3.5 h-3.5" />, description: 'Structured learning guide (coming soon)' },
]

// ── ResearchPanel ──────────────────────────────────────────────
// The full Research tab content: key points, result area, search bar.
function ResearchPanel({
  userVideo,
  cuts,
  transcript,
  researchSession,
  researchLoading,
  onStartResearch,
  searchHistory,
  searchLoading,
  onSearch,
  onCancelSearch,
  onAddVideo,
  monthlyResearchCount,
}: {
  userVideo:        UserVideo | null
  cuts:             any[]
  transcript:       TranscriptSegment[]
  researchSession:  ResearchSession | null
  researchLoading:  boolean
  onStartResearch:  () => void
  searchHistory:    SearchResult[]
  searchLoading:    boolean
  onSearch:         (query: string, mode: SearchMode) => void
  onCancelSearch?:  () => void
  onAddVideo:       () => void
  /** Monthly deep-research usage count for this user (0 if unknown). */
  monthlyResearchCount: number
}) {
  const { toast }                           = useToast()
  const { isPremium }                       = useSubscription()
  const [query,      setQuery]              = useState('')
  const [mode,       setMode]               = useState<SearchMode>('search')
  const [modeOpen,   setModeOpen]           = useState(false)
  // research exhaustion gate: free users get 1/month across ALL workspaces.
  // We use the monthly total from the API, not just whether this video
  // already has a session (which was the old per-workspace bug).
  const FREE_RESEARCH_LIMIT = 1
  const researchExhausted = !isPremium && monthlyResearchCount >= FREE_RESEARCH_LIMIT
  const [upgradeFeature, setUpgradeFeature] = useState<GatedFeature | null>(null)
  const inputRef                            = useRef<HTMLInputElement>(null)
  const modeDropRef                         = useRef<HTMLDivElement>(null)

  // ── Key points from cut titles ─────────────────────────────────────
  const keyPoints: string[] = useMemo(() => {
    const fromCuts = cuts
      .map((c: any) => c.title)
      .filter(Boolean)
      .slice(0, 8)
    if (fromCuts.length > 0) return fromCuts
    // Fallback: first few transcript snippets as short phrases
    return transcript.slice(0, 5).map((s) => s.text.slice(0, 60).trim() + '…')
  }, [cuts, transcript])

  // Close mode dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modeDropRef.current && !modeDropRef.current.contains(e.target as Node)) {
        setModeOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSubmit = () => {
    const q = query.trim()
    if (!q) return
    // Gate: free users only get 1 deep research per month
    if (mode === 'deep_research' && researchExhausted) {
      setUpgradeFeature('deep_research')
      return
    }
    onSearch(q, mode)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChipClick = (point: string) => {
    setQuery(point)
    inputRef.current?.focus()
    // Auto-submit in search, deep_research, or learn modes
    onSearch(point, mode)
  }

  const handleFollowUp = (question: string) => {
    setQuery(question)
    onSearch(question, mode)
  }

  const currentMode = SEARCH_MODES.find((m) => m.id === mode)!
  const resultsEndRef = useRef<HTMLDivElement>(null)

  const hasItems = searchHistory.length > 0 || !!researchSession
  const isBusy  = searchLoading || researchLoading

  // Auto-scroll to bottom when searchHistory or loading changes
  useEffect(() => {
    if (hasItems || isBusy) {
      resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchHistory.length, researchSession?.id, isBusy, hasItems])

  return (
    <>
    {/* Upgrade modal for exhausted deep research */}
    <UpgradeModal
      open={!!upgradeFeature}
      onClose={() => setUpgradeFeature(null)}
      feature={upgradeFeature ?? 'deep_research'}
    />
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Results area (scrollable feed stream) ─────── */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Deep research report — shown when session exists or is loading */}
        {(researchSession || researchLoading) && (
          <div className="p-3 border-b border-[var(--color-border-tertiary)]">
            <ResearchReport
              session={researchSession}
              isLoading={researchLoading && !researchSession?.report_content}
              onExport={() => window.print()}
              className="flex-1 min-h-0"
            />
          </div>
        )}

        {/* Search results stream (Perplexity-style list) */}
        {searchHistory.map((res, idx) => (
          <div key={res.id || idx} className="p-3 space-y-3 border-b border-[var(--color-border-tertiary)] last:border-0">
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
              <p className="text-[11px] font-semibold text-[var(--color-text-secondary)] truncate">
                {res.query}
              </p>
            </div>
            <SearchResultCard
              result={res}
              onFollowUp={handleFollowUp}
            />
          </div>
        ))}

        {/* Loading indicator (appended at bottom of feed) */}
        {(searchLoading || researchLoading) && (
          <div className="m-3 p-3.5 flex items-center gap-3 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-tertiary)] shadow-xs animate-pulse">
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin flex-shrink-0" />
            <p className="text-[12px] font-medium text-[var(--color-text-secondary)]">
              {researchLoading
                ? query.trim()
                  ? `Researching "${query.slice(0, 50)}${query.length > 50 ? '…' : ''}"…`
                  : 'Generating deep research report…'
                : mode === 'learn'
                ? 'Building step-by-step guide…'
                : 'Searching the web…'}
            </p>
          </div>
        )}

        {/* Empty state */}
        {!hasItems && !isBusy && (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center gap-3 min-h-full">
            <div className="w-10 h-10 rounded-xl bg-primary-600/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary-400" />
            </div>
            <div className="max-w-xs">
              <p className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-1">
                Search anything
              </p>
              <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
                Type a question or click a key point below to get Perplexity-style results.
              </p>
            </div>

            {keyPoints.length > 0 && (
              <div className="w-full max-w-md mt-2">
                <p className="text-[9px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider mb-2">
                  Key points from this video
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {keyPoints.map((point, i) => (
                    <button
                      key={i}
                      onClick={() => handleChipClick(point)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] text-left transition-all duration-150',
                        'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)]',
                        'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                        'hover:border-primary-400/60 hover:bg-primary-50/20 shadow-2xs',
                      )}
                    >
                      <ArrowRight className="w-2.5 h-2.5 text-primary-400 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">{point}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={resultsEndRef} />
      </div>

      {/* ── Search bar (pinned bottom) ────────────────── */}
      <div className="shrink-0 p-3 border-t border-[var(--color-border-tertiary)] space-y-2">
        {/* + Add Video button */}
        <button
          onClick={onAddVideo}
          className={cn(
            'w-full flex items-center justify-center gap-2 h-8 rounded-lg text-[11px] font-semibold',
            'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]',
            'border border-dashed border-[var(--color-border-secondary)]',
            'hover:border-primary-400/60 hover:text-primary-400 hover:bg-primary-50/10 transition-colors',
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Video for Context
        </button>

        {/* Input row */}
        <div className={cn(
          'flex items-end gap-2 rounded-xl border p-2',
          'bg-[var(--color-bg-secondary)] border-[var(--color-border-secondary)]',
          'focus-within:border-primary-400/60 transition-colors',
        )}>
          {/* Text input */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === 'deep_research'
                ? 'Enter a research topic or question…'
                : mode === 'learn'
                ? 'What would you like to learn step by step?'
                : 'Ask anything about this video…'
            }
            disabled={searchLoading || researchLoading}
            className={cn(
              'flex-1 bg-transparent text-[12px] text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-tertiary)] outline-none resize-none leading-relaxed',
              'disabled:opacity-50',
            )}
          />
        </div>

        {/* Mode-aware context hint */}
        {mode === 'deep_research' && (
          <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed px-0.5">
            <span className="font-semibold text-primary-500">Deep Research:</span>{' '}
            Your question will focus the AI report. Leave blank for a full video overview.
          </p>
        )}
        {mode === 'learn' && (
          <p className="text-[10px] text-[var(--color-text-tertiary)] leading-relaxed px-0.5">
            <span className="font-semibold text-emerald-500">Learn Step-by-Step:</span>{' '}
            Get a structured learning guide based on your question and the video content.
          </p>
        )}

        {/* Controls row */}
        <div className="flex items-center justify-between gap-2">
          {/* Mode selector */}
          <div className="relative" ref={modeDropRef}>
            <button
              onClick={() => setModeOpen(p => !p)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium',
                'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)]',
                'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                'hover:border-primary-400/60 transition-all',
              )}
            >
              {currentMode.icon}
              <span className="hidden sm:inline">{currentMode.label}</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', modeOpen && 'rotate-180')} />
            </button>

            {modeOpen && (
              <div className={cn(
                'absolute bottom-full left-0 mb-2 w-56 rounded-xl border shadow-xl z-50 overflow-hidden',
                'bg-[var(--color-bg-primary)] border-[var(--color-border-secondary)]',
              )}>
                {SEARCH_MODES.map((m) => {
                  const isDeepResearch = m.id === 'deep_research'
                  const isExhausted = isDeepResearch && researchExhausted
                  return (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setModeOpen(false) }}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
                      mode === m.id
                        ? 'bg-primary-600/10 text-primary-400'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
                    )}
                  >
                    <span className="mt-0.5 flex-shrink-0">{m.icon}</span>
                    <span className="flex-1">
                      <span className="block text-[11px] font-semibold">{m.label}</span>
                      <span className="block text-[10px] opacity-70 mt-0.5">{m.description}</span>
                      {/* Usage chip for deep research */}
                      {isDeepResearch && !isPremium && (
                        <span className={cn(
                          'inline-flex items-center mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
                          isExhausted
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700',
                        )}>
                          {isExhausted ? '1 of 1 used this month' : '1 free / month'}
                        </span>
                      )}
                    </span>
                    {mode === m.id && <Check className="w-3 h-3 ml-auto mt-0.5 flex-shrink-0" />}
                  </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Mic + Send */}
          <div className="flex items-center gap-1.5">
            <button
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
              title="Voice input (coming soon)"
              onClick={() => toast.info('Voice input coming soon 🎙️')}
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
            {/* Send / Stop button */}
            {searchLoading || researchLoading ? (
              <button
                onClick={onCancelSearch}
                title="Stop search"
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-sm cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!query.trim()}
                title="Send"
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                  query.trim()
                    ? 'bg-primary-600 text-white hover:bg-primary-700 cursor-pointer'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] opacity-50 cursor-not-allowed',
                )}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function LeftPanel({
  activeTab,
  onTabChange,
  transcript,
  currentTime,
  onSeek,
  chatSession,
  chatLoading,
  chatTyping,
  onSendMessage,
  onAddVideo,
  onRemoveVideo,
  researchSession,
  researchLoading,
  onStartResearch,
  userVideo,
  searchHistory,
  searchLoading,
  onSearch,
  onCancelSearch,
  monthlyResearchCount,
}: {
  activeTab:   LeftTab
  onTabChange: (t: LeftTab) => void
  transcript:  TranscriptSegment[]
  currentTime: number
  onSeek:      (s: number) => void
  chatSession: ChatSession | null
  chatLoading: boolean
  chatTyping: boolean
  onSendMessage: (content: string) => void
  onAddVideo: (video: UserVideo) => Promise<void>
  onRemoveVideo: (videoId: string) => void
  researchSession: ResearchSession | null
  researchLoading: boolean
  onStartResearch: () => void
  userVideo: UserVideo | null
  searchHistory: SearchResult[]
  searchLoading: boolean
  onSearch: (query: string, mode: SearchMode) => void
  onCancelSearch?: () => void
  /** Monthly deep-research usage count for this user. */
  monthlyResearchCount: number
}) {
  // ── Add Video modal state ────────────────────────────────
  const { toast } = useToast()
  const { canUse } = useSubscription()
  const [showAddVideo,    setShowAddVideo]    = useState(false)
  const [showMultiUpgrade, setShowMultiUpgrade] = useState(false)

  const handleAddVideo = useCallback(async (video: UserVideo) => {
    await onAddVideo(video)
    setShowAddVideo(false)
    onTabChange('chat')
  }, [onAddVideo, onTabChange])

  const TABS: { id: LeftTab; label: string; icon: React.ReactNode }[] = [
    { id: 'transcripts', label: 'Transcripts', icon: <FileText  className="w-3.5 h-3.5" aria-hidden="true" /> },
    { id: 'chat',        label: 'Chat',        icon: <MessageSquare className="w-3.5 h-3.5" aria-hidden="true" /> },
    { id: 'research',    label: 'Research',    icon: <Globe     className="w-3.5 h-3.5" aria-hidden="true" /> },
  ]

  // Active transcript segment
  const activeSegId = (() => {
    for (let i = transcript.length - 1; i >= 0; i--) {
      const seg = transcript[i]!
      if (currentTime >= seg.start_seconds) return seg.id
    }
    return transcript[0]?.id ?? null
  })()

  // ── Transcript auto-scroll ──────────────────────────────
  // Scroll the active segment into view whenever it changes so the
  // highlight follows playback even when the list is long.
  const transcriptScrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!transcriptScrollRef.current || !activeSegId) return
    const el = transcriptScrollRef.current.querySelector<HTMLElement>(
      `[data-seg-id="${activeSegId}"]`
    )
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeSegId])

  return (
    <>
      {/* Add Video Modal */}
      {showAddVideo && (
        <AddVideoModal
          onAdd={handleAddVideo}
          onClose={() => setShowAddVideo(false)}
        />
      )}

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
                'flex-1 py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold border-b-2 transition-colors focus-visible:outline-none uppercase tracking-wide',
                activeTab === t.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content ── fills all remaining height */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">

          {/* Transcripts */}
          {activeTab === 'transcripts' && (
            <div ref={transcriptScrollRef} className="flex flex-col flex-1 overflow-y-auto">
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
                      data-seg-id={seg.id}
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

          {/* Chat ── fully embedded with videos list */}
          {activeTab === 'chat' && (
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {chatLoading ? (
                <div className="flex items-center justify-center flex-1">
                  <Spinner size="md" />
                </div>
              ) : chatSession ? (
                <>
                  {/* Videos in this chat */}
                  <div className="shrink-0 border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] px-3 py-2.5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest">
                        Videos in this chat
                      </span>
                      <button
                        onClick={() => setShowAddVideo(true)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                        title="Add another video to this chat"
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </button>
                    </div>
                    <div className="flex flex-col gap-1">
                      {chatSession.videos.length === 0 ? (
                        <p className="text-caption text-[var(--color-text-tertiary)] italic">No videos attached yet.</p>
                      ) : (
                        chatSession.videos.map((uv) => (
                          <div
                            key={uv.id}
                            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] group transition-colors"
                          >
                            {/* Play icon */}
                            <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                              <Play className="w-2.5 h-2.5 text-primary-600 fill-primary-600" aria-hidden="true" />
                            </div>
                            {/* Title */}
                            <span className="flex-1 text-[11px] font-medium text-[var(--color-text-primary)] truncate leading-tight">
                              {uv.video.title}
                            </span>
                            {/* Remove (only if more than 1 video) */}
                            {chatSession.videos.length > 1 && (
                              <button
                                onClick={() => onRemoveVideo(uv.id)}
                                className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-red-500 transition-all shrink-0"
                                aria-label={`Remove ${uv.video.title}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Warning banner if no transcript is available */}
                  {transcript.length === 0 && (
                    <div className="mx-4 my-2 p-2.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-caption flex gap-2 items-start shrink-0 leading-normal">
                      <span>⚠️</span>
                      <div>
                        Chat is running in <strong>General Knowledge mode</strong> because this video has no transcript.
                      </div>
                    </div>
                  )}

                  {/* Chat messages */}
                  <ChatWindow
                    session={chatSession}
                    isTyping={chatTyping}
                    onSendMessage={onSendMessage}
                    onSeek={onSeek}
                    className="flex-1 min-h-0"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 py-12 gap-2 text-center px-4">
                  <p className="text-body-sm text-[var(--color-text-secondary)]">No active chat session found.</p>
                </div>
              )}
            </div>
          )}

          {/* Research ── redesigned panel with key points + search bar */}
          {activeTab === 'research' && (
            <ResearchPanel
              userVideo={userVideo}
              cuts={(userVideo as any)?.cuts ?? []}
              transcript={transcript}
              researchSession={researchSession}
              researchLoading={researchLoading}
              onStartResearch={onStartResearch}
              searchHistory={searchHistory}
              searchLoading={searchLoading}
              onSearch={onSearch}
              onCancelSearch={onCancelSearch}
              onAddVideo={() => setShowAddVideo(true)}
              monthlyResearchCount={monthlyResearchCount}
            />
          )}
        </div>

        {/* Add Video footer */}
        <div className="shrink-0 p-3 border-t border-[var(--color-border-tertiary)]">
          {/* Multi-video upgrade modal */}
          <UpgradeModal
            open={showMultiUpgrade}
            onClose={() => setShowMultiUpgrade(false)}
            feature="multi_video_chat"
          />

          {chatSession?.videos && chatSession.videos.length >= 1 && !canUse('multi_video_chat') ? (
            // Free user, already has 1 video → show upgrade button
            <button
              onClick={() => setShowMultiUpgrade(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-10 rounded-xl',
                'text-body-sm font-semibold transition-colors',
                'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:border-amber-300',
              )}
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              Add Video to Chat
              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-800">
                Premium
              </span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddVideo(true)}
              className={cn(
                'w-full flex items-center justify-center gap-2 h-10 rounded-xl',
                'text-body-sm font-semibold transition-colors',
                'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]',
                'border-2 border-dashed border-[var(--color-border-secondary)]',
                'hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/30',
              )}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Video to Chat
            </button>
          )}
        </div>
      </div>
    </>
  )
}

// ── Video player ──────────────────────────────────────────

function VideoPlayer({
  youtubeId,
  title,
  onTimeUpdate,
  onPlayingChange,
}: {
  youtubeId:        string
  title:            string
  onTimeUpdate:     (t: number) => void
  onPlayingChange?: (playing: boolean) => void
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
            // IMPORTANT: reassign from e.target here.
            // new YT.Player() returns an uninitialised proxy; the real player
            // object with playVideo / pauseVideo / seekTo only exists on
            // e.target once the iframe is ready. We must store it before we
            // call setIsReady(true) so that togglePlay can never reach a
            // ref without those methods.
            playerRef.current = e.target
            setDuration(e.target.getDuration())
            setIsReady(true)
          },
          onStateChange: (e: { data: number }) => {
            const playing = e.data === window.YT.PlayerState.PLAYING
            setIsPlaying(playing)
            onPlayingChange?.(playing)
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
      setIsReady(false)
      if (intervalRef.current) clearInterval(intervalRef.current)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [youtubeId])

  const togglePlay = () => {
    if (!isReady) return
    isPlaying ? playerRef.current?.pauseVideo() : playerRef.current?.playVideo()
  }
  const toggleMute = () => {
    if (!isReady) return
    isMuted ? playerRef.current?.unMute() : playerRef.current?.mute()
    setIsMuted((v) => !v)
  }
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isReady) return
    const t = Number(e.target.value)
    playerRef.current?.seekTo(t, true)
    setCurrent(t)
  }

  // expose seekTo via ref on window (simple approach for this component tree)
  if (typeof window !== 'undefined') {
    ;(window as unknown as Record<string, unknown>)['__playerRef__'] = playerRef
  }

  return (
    <div className="relative bg-black group">
      {/* YouTube iframe target */}
      <div id={containerId} className="w-full aspect-video" />

      {/* Loading overlay — z-10 ensures it sits above the controls layer so
           clicks cannot reach the play button before onReady fires */}
      {!isReady && (
        <div className="absolute inset-0 z-10 bg-black flex items-center justify-center">
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
            disabled={!isReady}
            className="text-white hover:text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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
            disabled={!isReady}
            className="text-white hover:text-white/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
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

// ── ResizeHandle ──────────────────────────────────────────

function ResizeHandle({
  onDrag,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  collapsed = false,
}: {
  onDrag:        (deltaX: number) => void
  onDragStart?:  () => void
  onDragEnd?:    () => void
  onDoubleClick: () => void
  collapsed?:    boolean
}) {
  const dragging  = useRef(false)
  const lastX     = useRef(0)
  const [active, setActive] = useState(false)

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragging.current = true
    lastX.current    = e.clientX
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setActive(true)
    onDragStart?.()
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    onDrag(e.clientX - lastX.current)
    lastX.current = e.clientX
  }

  const handlePointerUp = () => {
    if (dragging.current) {
      dragging.current = false
      setActive(false)
      onDragEnd?.()
    }
  }

  return (
    <div
      className={cn(
        // Wide invisible hit zone — easy to grab
        'group relative flex items-center justify-center shrink-0',
        'cursor-col-resize select-none z-10',
        // Wider hit area: 12px total (4px visible bar + 4px each side padding)
        'w-3',
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onDoubleClick={onDoubleClick}
      role="separator"
      aria-orientation="vertical"
      aria-label="Drag to resize panel. Double-click to collapse."
      title="Drag to resize · Double-click to collapse"
    >
      {/* Visible bar — thin at rest, highlighted on hover/drag */}
      <div
        className={cn(
          'absolute inset-y-0 w-[3px] rounded-full transition-all duration-150',
          active
            ? 'bg-primary-500 w-[4px] shadow-[0_0_8px_2px_rgba(99,102,241,0.35)]'
            : 'bg-[var(--color-border-secondary)] group-hover:bg-primary-400 group-hover:w-[4px]',
        )}
      />

      {/* Grip icon — appears on hover */}
      <div
        className={cn(
          'relative z-10 flex flex-col items-center gap-[3px] transition-opacity duration-150',
          active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        {/* Three horizontal grip dots */}
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'block w-[3px] h-[3px] rounded-full',
              active ? 'bg-primary-500' : 'bg-[var(--color-text-tertiary)] group-hover:bg-primary-500',
            )}
          />
        ))}
      </div>

      {/* Tooltip that appears above the handle on hover */}
      <div
        className={cn(
          'pointer-events-none absolute bottom-[calc(50%+6px)] left-1/2 -translate-x-1/2',
          'whitespace-nowrap bg-[var(--color-bg-inverse)] text-[var(--color-text-inverse)]',
          'text-[10px] font-medium px-2 py-1 rounded shadow-md',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-300',
        )}
      >
        {collapsed ? 'Double-click to expand' : 'Drag to resize'}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function WorkspacePage() {
  const router      = useRouter()
  const userVideoId = router.query.uservideoId as string | undefined
  const { toast }   = useToast()

  // ── Panel widths (px) ─────────────────────────────────────
  const LEFT_DEFAULT  = 220
  const LEFT_MIN      = 160
  const LEFT_MAX      = 800
  const LEFT_COLLAPSED = 0

  const RIGHT_DEFAULT  = 240
  const RIGHT_MIN      = 180
  const RIGHT_MAX      = 800
  const RIGHT_COLLAPSED = 0

  const [leftWidth,      setLeftWidth]      = useState(LEFT_DEFAULT)
  const [rightWidth,     setRightWidth]     = useState(RIGHT_DEFAULT)
  const [leftPrevWidth,  setLeftPrevWidth]  = useState(LEFT_DEFAULT)
  const [rightPrevWidth, setRightPrevWidth] = useState(RIGHT_DEFAULT)

  const [isLeftDragging, setIsLeftDragging] = useState(false)
  const [isRightDragging, setIsRightDragging] = useState(false)

  const handleLeftResize = useCallback((deltaX: number) => {
    setLeftWidth((w) => Math.max(0, Math.min(LEFT_MAX, w + deltaX)))
  }, [])

  const handleRightResize = useCallback((deltaX: number) => {
    setRightWidth((w) => Math.max(RIGHT_MIN, Math.min(RIGHT_MAX, w - deltaX)))
  }, [])

  const toggleLeftCollapse = useCallback(() => {
    if (leftWidth > LEFT_MIN / 2) {
      setLeftPrevWidth(leftWidth)
      setLeftWidth(LEFT_COLLAPSED)
    } else {
      setLeftWidth(leftPrevWidth || LEFT_DEFAULT)
    }
  }, [leftWidth, leftPrevWidth])

  const toggleRightCollapse = useCallback(() => {
    if (rightWidth > RIGHT_MIN / 2) {
      setRightPrevWidth(rightWidth)
      setRightWidth(RIGHT_COLLAPSED)
    } else {
      setRightWidth(rightPrevWidth || RIGHT_DEFAULT)
    }
  }, [rightWidth, rightPrevWidth])

  // Live states
  const [userVideo, setUserVideo] = useState<UserVideo | null>(null)
  const [cuts,      setCuts]      = useState<VideoCut[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [chatSession, setChatSession] = useState<ChatSession | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatTyping, setChatTyping] = useState(false)

  const [researchSession, setResearchSession] = useState<ResearchSession | null>(null)
  const [researchLoading, setResearchLoading] = useState(false)
  // Monthly deep-research count — sourced from /api/billing/usage/monthly/
  // so it reflects usage across ALL workspaces, not just the current one.
  const [monthlyResearchCount, setMonthlyResearchCount] = useState(0)

  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)

  const [currentTime, setCurrentTime] = useState(0)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [leftTab,     setLeftTab]     = useState<LeftTab>('transcripts')
  const [mobileTab,   setMobileTab]   = useState<'cuts' | 'transcripts' | 'chat' | 'research'>('cuts')

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false)

  // Tracks the shift-drag selection from CutTimeline so the action
  // buttons above can operate on it
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null)

  const duration = userVideo?.video?.duration_seconds ?? 0
  const transcript = useMemo(() => {
    return ((userVideo as any)?.transcription?.segments ?? []).map((seg: any) => ({
      ...seg,
      start_seconds: Number(seg.start_seconds),
      end_seconds: Number(seg.end_seconds),
    }))
  }, [userVideo])

  // Fetch everything on mount
  useEffect(() => {
    if (!router.isReady || !userVideoId) return
    let active = true

    const loadData = async () => {
      try {
        setIsLoading(true)
        // 1. Fetch user video details
        const videoRes = await apiClient.get(`/videos/${userVideoId}/?touch=true`)
        if (!active) return
        setUserVideo(videoRes.data)
        setCuts(videoRes.data.cuts || [])

        // Map tab from query parameter if present
        const queryTab = router.query.tab as string | undefined
        if (queryTab && ['cuts', 'transcripts', 'chat', 'research'].includes(queryTab)) {
          setMobileTab(queryTab as any)
          if (queryTab !== 'cuts') {
            setLeftTab(queryTab as any)
          }
        }

        // 2. Load or create chat session
        const chatsRes = await apiClient.get('/chat/sessions/')
        const chatsList = chatsRes.data.results || chatsRes.data || []
        const existingChat = chatsList.find((s: any) => s.video_ids?.includes(userVideoId))
        
        let targetChatId = existingChat?.id
        if (!targetChatId) {
          const createChatRes = await apiClient.post('/chat/sessions/', {
            title: `Chat - ${videoRes.data.video.title}`,
          })
          targetChatId = createChatRes.data.id
          await apiClient.post(`/chat/sessions/${targetChatId}/videos/`, {
            user_video_id: userVideoId,
          })
        }

        const chatDetailRes = await apiClient.get(`/chat/sessions/${targetChatId}/`)
        if (!active) return
        setChatSession(chatDetailRes.data)

        // 3. Load research session if it exists for this video
        const researchListRes = await apiClient.get('/research/')
        const researchList = researchListRes.data.results || researchListRes.data || []
        const existingResearch = researchList.find((r: any) =>
          (r.user_video?.id ?? r.user_video) === userVideoId
        )
        
        if (existingResearch) {
          const researchDetailRes = await apiClient.get(`/research/${existingResearch.id}/`)
          if (!active) return
          setResearchSession(researchDetailRes.data)
        }

        // 3b. Load the monthly usage summary for the deep-research gate.
        // This is the source of truth: it reflects all research sessions
        // the user has created this month, across every workspace.
        try {
          const monthlyRes = await apiClient.get('/billing/usage/monthly/')
          if (active) {
            setMonthlyResearchCount(monthlyRes.data?.research ?? 0)
          }
        } catch (usageErr) {
          // Non-fatal — gate defaults to 0 (permissive) if the call fails
          console.error('Failed to load monthly usage', usageErr)
        }

        // 4. Load search history for this video
        try {
          const searchRes = await apiClient.get(`/search/?user_video_id=${userVideoId}`)
          const searchList = searchRes.data.results || searchRes.data || []
          if (active) {
            setSearchHistory(searchList)
          }
        } catch (searchErr) {
          console.error('Failed to load search history', searchErr)
        }
      } catch (err) {
        console.error('Failed to load workspace data', err)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [userVideoId, router.isReady, router.query.tab])

  // Polling for processing status/stage updates
  useEffect(() => {
    if (!userVideo || userVideo.processing_status === 'completed' || userVideo.processing_status === 'failed') return
    let active = true
    let timer: NodeJS.Timeout

    const poll = async () => {
      try {
        const res = await apiClient.get(`/videos/${userVideoId}/`)
        if (!active) return
        setUserVideo(res.data)
        
        if (res.data.processing_status === 'completed') {
          // Re-load cuts once complete
          const cutsRes = await apiClient.get(`/videos/${userVideoId}/cuts/`)
          setCuts(cutsRes.data.results || cutsRes.data || [])
          
          // Re-fetch chat session to link the new transcript
          const chatsRes = await apiClient.get('/chat/sessions/')
          const chatsList = chatsRes.data.results || chatsRes.data || []
          const existingChat = chatsList.find((s: any) => s.video_ids?.includes(userVideoId))
          if (existingChat) {
            const chatDetailRes = await apiClient.get(`/chat/sessions/${existingChat.id}/`)
            setChatSession(chatDetailRes.data)
          }
        }
      } catch (err) {
        console.error('Polling error', err)
      } finally {
        if (active && userVideo?.processing_status !== 'completed' && userVideo?.processing_status !== 'failed') {
          timer = setTimeout(poll, 3000)
        }
      }
    }

    timer = setTimeout(poll, 3000)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [userVideoId, userVideo?.processing_status])

  const seekPlayer = useCallback((seconds: number) => {
    const ref = (window as unknown as Record<string, unknown>)['__playerRef__'] as React.MutableRefObject<YTPlayer | null> | undefined
    if (typeof ref?.current?.seekTo === 'function') {
      ref.current.seekTo(seconds, true)
      if (typeof ref.current.playVideo === 'function') {
        ref.current.playVideo()
      }
    }
    setCurrentTime(seconds)
  }, [])

  // Cuts CRUD
  const handleCut = async (cutId: string) => {
    const cut = cuts.find((c) => c.id === cutId)
    if (!cut) return

    // Special case: cut already approved but failed — just retry processing
    // without toggling approval (it's still approved, just needs another attempt)
    if (cut.user_approved && cut.download_status === 'failed') {
      try {
        const processRes = await apiClient.post(`/videos/${userVideoId}/cuts/${cutId}/process/`)
        setCuts((prev) => prev.map((c) =>
          c.id === cutId ? { ...c, ...processRes.data } : c
        ))
      } catch (processErr: any) {
        if (processErr?.response?.status !== 409) {
          const msg = processErr?.response?.data?.error?.message || 'Could not start cutting. Try again.'
          toast.warning(msg)
        }
      }
      return
    }

    const willApprove = !cut.user_approved
    try {
      const res = await apiClient.patch(`/videos/${userVideoId}/cuts/${cutId}/`, {
        user_approved: willApprove,
      })
      setCuts((prev) => prev.map((c) => c.id === cutId ? res.data : c))

      // When the user approves a cut, immediately kick off the real video cutting
      if (willApprove) {
        try {
          const processRes = await apiClient.post(
            `/videos/${userVideoId}/cuts/${cutId}/process/`
          )
          // Merge the updated download_status ('processing') back into state
          setCuts((prev) => prev.map((c) =>
            c.id === cutId ? { ...c, ...processRes.data } : c
          ))
        } catch (processErr: any) {
          // 409 = already processing — ignore, else show a warning
          if (processErr?.response?.status !== 409) {
            const msg = processErr?.response?.data?.error?.message || 'Could not start cutting. Try again.'
            toast.warning(msg)
          }

        }
      }
    } catch (err) {
      console.error('Failed to toggle cut approval', err)
    }
  }

  // ── Poll for cuts that are still processing ──────────────────────────────
  // When any approved cut has download_status === 'processing', poll every 3s
  // until it becomes 'ready' or 'failed', then merge the result into state.
  useEffect(() => {
    const processingCuts = cuts.filter((c) => c.download_status === 'processing')
    if (processingCuts.length === 0) return

    let active = true
    const pollCut = async (cutId: string) => {
      try {
        const res = await apiClient.get(`/videos/${userVideoId}/cuts/${cutId}/status/`)
        if (!active) return
        const { download_status, download_url } = res.data
        setCuts((prev) => prev.map((c) =>
          c.id === cutId ? { ...c, download_status, download_url } : c
        ))
        // If still processing, keep polling
        if (download_status === 'processing') {
          setTimeout(() => { if (active) pollCut(cutId) }, 3000)
        }
      } catch {
        // Non-fatal: will retry on the next render cycle if still processing
      }
    }

    // Start a polling chain for each processing cut
    processingCuts.forEach((c) => pollCut(c.id))
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cuts.map((c) => `${c.id}:${c.download_status}`).join(','), userVideoId])

  const handleEditSave = async (cutId: string, start: number, end: number) => {
    // Snapshot old status before sending the request
    const oldCut = cuts.find((c) => c.id === cutId)
    const wasReady = oldCut?.download_status === 'ready'
    try {
      const res = await apiClient.patch(`/videos/${userVideoId}/cuts/${cutId}/`, {
        start_seconds: Math.round(start),
        end_seconds: Math.round(end),
      })
      setCuts((prev) => prev.map((c) => c.id === cutId ? res.data : c))
      // Inform the user if the old processed clip was invalidated
      if (wasReady && res.data.download_status !== 'ready') {
        toast.info('Time range updated — click Cut to re-process the clip at the new timestamps.')
      }
    } catch (err) {
      console.error('Failed to edit cut range', err)
      toast.error('Failed to save new time range.')
    }
  }

  const handleMetaSave = async (cutId: string, title: string, rationale: string) => {
    // Optimistic update so the UI feels instant
    setCuts((prev) => prev.map((c) =>
      c.id === cutId ? { ...c, title, ai_rationale: rationale } : c
    ))
    try {
      const res = await apiClient.patch(`/videos/${userVideoId}/cuts/${cutId}/`, {
        title,
        ai_rationale: rationale,
      })
      // Sync with server response
      setCuts((prev) => prev.map((c) => c.id === cutId ? res.data : c))
    } catch (err) {
      console.error('Failed to save cut metadata', err)
      // Revert optimistic update on failure
      setCuts((prev) => prev.map((c) =>
        c.id === cutId ? { ...c, title: c.title, ai_rationale: c.ai_rationale } : c
      ))
    }
  }

  const handleSplitAtTime = async (splitAt?: number) => {
    const t = splitAt ?? currentTime
    // Use rounded integers (matching the model's IntegerField) for the guard
    const rStart = Math.round(t)
    const rEnd   = Math.round(duration)
    if (rStart <= 0 || rStart >= rEnd) return
    try {
      const res = await apiClient.post(`/videos/${userVideoId}/cuts/`, {
        start_seconds: rStart,
        end_seconds:   rEnd,
        title: `Split at ${formatTime(rStart)}`,
        user_approved: false,
      })
      setCuts((prev) => [...prev, res.data])
    } catch (err: any) {
      console.error('Failed to split cut', err)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to split cut.'
      if (err.response?.status === 403) {
        toast.warning(errMsg)
      } else {
        toast.error(errMsg)
      }
    }
  }

  const handleAddCutRange = async (start: number, end: number) => {
    const rStart = Math.round(start)
    const rEnd   = Math.round(end)
    // Reject zero-width selections (rounds to same integer → backend 400)
    if (rEnd <= rStart) return
    try {
      const res = await apiClient.post(`/videos/${userVideoId}/cuts/`, {
        start_seconds: rStart,
        end_seconds:   rEnd,
        title: `Selection ${formatTime(rStart)} – ${formatTime(rEnd)}`,
        user_approved: true,
      })
      setCuts((prev) => [...prev, res.data])
    } catch (err: any) {
      console.error('Failed to add cut range', err)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to add cut range.'
      if (err.response?.status === 403) {
        toast.warning(errMsg)
      } else {
        toast.error(errMsg)
      }
    }
  }

  // (handleAddCutPoint now inlined into the button — calls handleSplitAtTime directly)

  // ── Download helpers ───────────────────────────────────────────
  /**
   * Fetch a cut clip through the authenticated API and trigger a real
   * browser Save-As download — bypasses the cross-origin restriction that
   * causes browsers to ignore the `download` attribute on <a> tags.
   */
  const triggerApiDownload = useCallback(async (cut: VideoCut) => {
    try {
      const res = await apiClient.get(
        `/videos/${userVideoId}/cuts/${cut.id}/file/`,
        { responseType: 'blob' },
      )
      const blob    = new Blob([res.data], { type: 'video/mp4' })
      const objUrl  = URL.createObjectURL(blob)
      const anchor  = document.createElement('a')
      const safeName = (cut.title || `clip_${cut.cut_order || cut.id.slice(0, 8)}`)
        .replace(/[^\w\s-]/g, '_').trim()
      anchor.href     = objUrl
      anchor.download = `${safeName}.mp4`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      setTimeout(() => URL.revokeObjectURL(objUrl), 10_000)
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || 'Download failed.'
      toast.error(msg)
    }
  }, [userVideoId, toast])

  // ── Download handlers ──────────────────────────────────────────
  /**
   * If the clip is ready, download it via the API blob approach.
   * If not yet cut, trigger processing so polling picks it up.
   */
  const handleDownloadCut = useCallback(async (cut: VideoCut) => {
    if (cut.download_status === 'ready' && cut.download_url) {
      await triggerApiDownload(cut)
      return
    }

    if (cut.download_status === 'processing') {
      toast.warning('This clip is still being cut — check back in a moment.')
      return
    }

    // Not yet processed — trigger it now
    try {
      const processRes = await apiClient.post(
        `/videos/${userVideoId}/cuts/${cut.id}/process/`
      )
      setCuts((prev) => prev.map((c) =>
        c.id === cut.id ? { ...c, ...processRes.data } : c
      ))
      toast.success('Cutting started — the download button will activate when ready.')
    } catch (err: any) {
      if (err?.response?.status === 409) {
        toast.warning('Already processing — please wait.')
      } else {
        const msg = err?.response?.data?.error?.message || 'Failed to start cutting.'
        toast.error(msg)
      }
    }
  }, [userVideoId, toast, triggerApiDownload])

  /** Download all ready clips via the blob approach. */
  const handleDownloadAll = useCallback(async () => {
    const readyCuts = cuts.filter(
      (c) => c.user_approved && c.download_status === 'ready' && !!c.download_url
    )
    if (readyCuts.length === 0) {
      toast.warning('No clips are ready yet. Cut your clips first.')
      return
    }
    for (const c of readyCuts) {
      await triggerApiDownload(c)
    }
  }, [cuts, toast, triggerApiDownload])

  // Chat actions
  const handleSendMessage = useCallback(async (content: string) => {
    if (!chatSession) return
    const tempUserMsgId = `m_temp_${Date.now()}`
    const userMsg: ChatMessage = {
      id:              tempUserMsgId,
      chat_session_id: chatSession.id,
      role:            'user',
      content,
      token_count:     null,
      created_at:      new Date().toISOString(),
    }
    setChatSession((s) => s ? { ...s, messages: [...s.messages, userMsg] } : null)
    setChatTyping(true)

    try {
      await apiClient.post(`/chat/sessions/${chatSession.id}/messages/`, { content })
      const res = await apiClient.get(`/chat/sessions/${chatSession.id}/`)
      setChatSession(res.data)
    } catch (err: any) {
      console.error('Failed to send message', err)
      setChatSession((s) => s ? { ...s, messages: s.messages.filter((m) => m.id !== tempUserMsgId) } : null)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to send message.'
      if (err.response?.status === 403) {
        toast.warning(errMsg)
      } else {
        toast.error(errMsg)
      }
    } finally {
      setChatTyping(false)
    }
  }, [chatSession, toast])

  const handleAddVideo = useCallback(async (video: UserVideo) => {
    if (!chatSession) return
    try {
      // 1. Create or get the UserVideo record on the backend to get a real UUID
      const videoRes = await apiClient.post('/videos/', {
        youtube_id: video.video.youtube_id,
        storage_type: 'reference'
      })
      
      const realUserVideoId = videoRes.data.id

      // 2. Add the real UUID to the chat session
      await apiClient.post(`/chat/sessions/${chatSession.id}/videos/`, {
        user_video_id: realUserVideoId,
      })

      const res = await apiClient.get(`/chat/sessions/${chatSession.id}/`)
      setChatSession(res.data)
    } catch (err: any) {
      console.error('Failed to add video to chat', err)
      const errorPayload = err?.response?.data?.error
      if (errorPayload?.message) {
        toast.error(errorPayload.message)
      } else {
        toast.error('Failed to add video to chat.')
      }
      throw err
    }
  }, [chatSession])

  const handleRemoveVideo = useCallback(async (videoId: string) => {
    if (!chatSession) return
    try {
      await apiClient.delete(`/chat/sessions/${chatSession.id}/videos/${videoId}/`)
      const res = await apiClient.get(`/chat/sessions/${chatSession.id}/`)
      setChatSession(res.data)
    } catch (err) {
      console.error('Failed to remove video from chat', err)
    }
  }, [chatSession])

  const abortControllerRef = useRef<AbortController | null>(null)

  const handleCancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setSearchLoading(false)
    setResearchLoading(false)
    toast.info('Search stopped.')
  }, [toast])

  // Research actions
  // `query` — the user's typed topic/question; stored as `title` on the session
  // and injected into the Gemini prompt so the report is focused on their intent.
  const handleStartResearch = useCallback(async (query?: string) => {
    if (!userVideoId) return
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setResearchLoading(true)
    try {
      // 1. Create the research session (backend immediately returns 201 with status: 'processing').
      //    Include the user's query as `title` so the Gemini prompt can target it.
      const body: Record<string, string> = { user_video_id: userVideoId }
      if (query?.trim()) body.title = query.trim()
      const createRes = await apiClient.post('/research/', body, { signal: controller.signal })
      const sessionId = createRes.data.id

      // Show the in-progress state right away and bump the monthly count
      setResearchSession(createRes.data)
      setMonthlyResearchCount((prev) => prev + 1)

      // 2. Poll until completed or failed (backend runs Gemini in a background thread)
      const POLL_INTERVAL_MS = 4000
      const MAX_POLLS = 120  // ~8 minutes
      let polls = 0

      while (polls < MAX_POLLS) {
        if (controller.signal.aborted) return
        await new Promise((res) => setTimeout(res, POLL_INTERVAL_MS))
        if (controller.signal.aborted) return

        const detailRes = await apiClient.get(`/research/${sessionId}/`, { signal: controller.signal })
        const session = detailRes.data
        setResearchSession(session)

        if (session.status === 'completed' || session.status === 'failed') {
          if (session.status === 'failed') {
            toast.error('Deep research failed. Please try again.')
          }
          break
        }
        polls++
      }

      if (polls >= MAX_POLLS) {
        toast.warning('Research is taking longer than expected. Check back later.')
      }
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return
      }
      console.error('Failed to generate research report', err)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Failed to generate research report.'
      if (err.response?.status === 403) {
        toast.warning(errMsg)
      } else {
        toast.error(errMsg)
      }
    } finally {
      setResearchLoading(false)
      abortControllerRef.current = null
    }
  }, [userVideoId, toast])

  // Search action
  const handleSearch = useCallback(async (query: string, mode: SearchMode) => {
    if (!userVideoId) return
    if (mode === 'deep_research') {
      // Pass the user's query into deep research so Gemini focuses on it
      await handleStartResearch(query)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setSearchLoading(true)
    try {
      const res = await apiClient.post('/search/', {
        query,
        user_video_id: userVideoId,
        mode,   // ← send mode so the backend can switch between 'search' and 'learn' prompts
      }, {
        signal: controller.signal,
      })
      setSearchHistory((prev) => [...prev, res.data])
    } catch (err: any) {
      if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
        return
      }
      console.error('Search failed', err)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Search failed.'
      if (err.response?.status === 403) {
        toast.warning(errMsg)
      } else {
        toast.error(errMsg)
      }
    } finally {
      setSearchLoading(false)
      abortControllerRef.current = null
    }
  }, [userVideoId, toast, handleStartResearch])

  const activeCutId = cuts.find(
    (c) => currentTime >= c.start_seconds && currentTime < c.end_seconds
  )?.id ?? null

  // Loading spinner
  if (isLoading || !userVideo) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-primary)]">
        <Spinner size="lg" label="Loading workspace..." />
      </div>
    )
  }

  // Progress Stepper Overlay
  if (userVideo.processing_status === 'pending' || userVideo.processing_status === 'processing') {
    const currentStage = userVideo.processing_stage || 'pending'
    const currentIdx = STAGE_SEQUENCE.findIndex(s => s.stage === currentStage)

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-tertiary)] px-4 py-12">
        <div className="w-full max-w-md bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-secondary)] p-6 shadow-xl animate-slide-up">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 border-b border-[var(--color-border-tertiary)] pb-4">
            <button
              onClick={() => router.back()}
              className="text-caption text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-0.5 focus-visible:outline-none"
            >
              ← Back
            </button>
            <div className="w-px h-4 bg-[var(--color-border-tertiary)]" />
            <div className="flex-1 min-w-0">
              <h2 className="text-body-sm font-semibold text-[var(--color-text-primary)] truncate">
                {userVideo.video.title}
              </h2>
              <p className="text-caption text-[var(--color-text-tertiary)] truncate">
                {userVideo.video.channel_name}
              </p>
            </div>
          </div>

          {/* Stepper Content */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-primary-600 animate-spin shrink-0" />
              <div>
                <p className="text-body-sm font-bold text-[var(--color-text-primary)]">
                  Analyzing & Segmenting Video
                </p>
                <p className="text-caption text-[var(--color-text-secondary)]">
                  This takes up to 2-3 minutes for videos without subtitles.
                </p>
              </div>
            </div>

            {/* Stage Steps */}
            <div className="relative pl-6 flex flex-col gap-4 mt-3">
              {/* Stepper line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-[var(--color-border-tertiary)]" />

              {STAGE_SEQUENCE.map((item, idx) => {
                const isCompleted = idx < currentIdx
                const isActive = item.stage === currentStage

                return (
                  <div key={item.stage} className="relative flex items-start gap-3">
                    {/* Circle icon/bullet */}
                    <div className="absolute -left-[22px] mt-1 z-10">
                      {isCompleted ? (
                        <div className="w-[11px] h-[11px] rounded-full bg-success-500 ring-4 ring-success-50" />
                      ) : isActive ? (
                        <div className="w-[11px] h-[11px] rounded-full bg-primary-600 ring-4 ring-primary-100 animate-pulse" />
                      ) : (
                        <div className="w-[11px] h-[11px] rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)]" />
                      )}
                    </div>

                    <span className={cn(
                      "text-body-xs font-semibold leading-none",
                      isActive ? "text-primary-600 font-bold" : isCompleted ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-tertiary)]"
                    )}>
                      {item.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Failed state overlay
  if (userVideo.processing_status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-bg-tertiary)] px-4">
        <div className="w-full max-w-md bg-[var(--color-bg-primary)] rounded-2xl border border-[var(--color-border-secondary)] p-6 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl">❌</span>
          </div>
          <h2 className="text-heading-md text-[var(--color-text-primary)] mb-1">Processing Failed</h2>
          <p className="text-body-sm text-[var(--color-text-secondary)] mb-6">
            We encountered an error while trying to process this video. Please make sure the link is correct or try another video.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 rounded-lg text-body-sm font-semibold border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

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

      {/* ── Mobile Tab Switcher ── */}
      <div className="flex md:hidden border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] shrink-0" role="tablist">
        {[
          { id: 'cuts', label: 'Cuts' },
          { id: 'transcripts', label: 'Transcripts' },
          { id: 'chat', label: 'Chat' },
          { id: 'research', label: 'Research' },
        ].map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={mobileTab === t.id}
            onClick={() => setMobileTab(t.id as any)}
            className={cn(
              'flex-1 py-2.5 text-center text-[10px] font-bold border-b-2 transition-colors uppercase tracking-wider',
              mobileTab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Three-column body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL (Transcripts / Chat / Research + Add Video) ── */}
        <div
          className={cn(
            "flex-col bg-[var(--color-bg-primary)] shrink-0 overflow-hidden",
            !isLeftDragging && "transition-[width] duration-fast",
            mobileTab !== 'cuts' ? 'flex flex-1 md:hidden' : 'hidden md:flex'
          )}
          style={{ width: leftWidth > 0 ? `${leftWidth}px` : 0 }}
        >
          <LeftPanel
            activeTab={mobileTab === 'cuts' ? leftTab : (mobileTab as any)}
            onTabChange={(tab) => {
              setLeftTab(tab)
              // Only sync mobileTab when we're already in mobile left-panel
              // mode (mobileTab !== 'cuts'). On desktop mobileTab must stay
              // 'cuts' so the panel isn't hidden by the md:hidden class.
              if (mobileTab !== 'cuts') {
                setMobileTab(tab as any)
              }
            }}
            transcript={transcript}
            currentTime={currentTime}
            onSeek={seekPlayer}
            chatSession={chatSession}
            chatLoading={chatLoading}
            chatTyping={chatTyping}
            onSendMessage={handleSendMessage}
            onAddVideo={handleAddVideo}
            onRemoveVideo={handleRemoveVideo}
            researchSession={researchSession}
            researchLoading={researchLoading}
            onStartResearch={handleStartResearch}
            userVideo={userVideo}
            searchHistory={searchHistory}
            searchLoading={searchLoading}
            onSearch={handleSearch}
            onCancelSearch={handleCancelSearch}
            monthlyResearchCount={monthlyResearchCount}
          />
        </div>

        {/* ── LEFT RESIZE HANDLE ── */}
        <div className="hidden md:block">
          <ResizeHandle
            onDrag={handleLeftResize}
            onDragStart={() => setIsLeftDragging(true)}
            onDragEnd={() => setIsLeftDragging(false)}
            onDoubleClick={toggleLeftCollapse}
            collapsed={leftWidth === 0}
          />
        </div>

        {/* ── CENTER — Video + Cut Suggestions ── */}
        <div className={cn(
          "flex flex-col flex-1 min-w-0 overflow-y-auto",
          mobileTab !== 'cuts' && 'hidden md:flex'
        )}>

          {/* Video player */}
          <VideoPlayer
            youtubeId={userVideo.video.youtube_id}
            title={userVideo.video.title}
            onTimeUpdate={setCurrentTime}
            onPlayingChange={setIsVideoPlaying}
          />

          {/* Cut Suggestions header + action buttons + timeline */}
          <div className="px-5 pt-5 pb-3 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-tertiary)]">
            <h2 className="text-heading-lg text-[var(--color-text-primary)] mb-3">
              Cut Suggestions
            </h2>

            {/* Action buttons — context-aware when a range is highlighted */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {/* Cut: toggles active cut approval, OR creates a cut for the highlighted range */}
              <button
                onClick={() => {
                  if (highlightedRange) {
                    handleAddCutRange(highlightedRange.start, highlightedRange.end)
                  } else {
                    handleCut(activeCutId ?? '')
                  }
                }}
                disabled={!highlightedRange && !activeCutId}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium border transition-colors',
                  highlightedRange
                    ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                    : activeCutId
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)]'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border-[var(--color-border-tertiary)] cursor-not-allowed',
                )}
              >
                <Scissors className="w-4 h-4" aria-hidden="true" />
                {highlightedRange ? 'Cut Selection' : 'Cut'}
              </button>

              {/* Split at Time: splits at current playback time, or at start of a highlighted range */}
              <button
                onClick={() => handleSplitAtTime(highlightedRange?.start)}
                title={highlightedRange
                  ? `Split at ${formatTime(highlightedRange.start)}`
                  : `Split at current time (${formatTime(currentTime)})`}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium border transition-colors',
                  highlightedRange
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-100'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)]',
                )}
              >
                <Clock className="w-4 h-4" aria-hidden="true" />
                {highlightedRange
                  ? `Split at ${formatTime(highlightedRange.start)}`
                  : `Split at ${formatTime(currentTime)}`}
              </button>
            </div>

            {/* Transcript Unavailable Banner */}
            {!isLoading && userVideo && transcript.length === 0 && (
              <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-body-sm flex gap-2.5 items-start">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1">
                  <p className="font-semibold text-[13px]">Transcript Unavailable</p>
                  <p className="mt-0.5 text-caption leading-relaxed text-amber-700">
                    YouTube subtitles were unavailable and audio processing could not generate a transcript. 
                    Cuts are segmented by default pacing. You can manually adjust cuts on the timeline.
                  </p>
                </div>
              </div>
            )}

            <CutTimeline
              cuts={cuts}
              duration={duration}
              currentTime={currentTime}
              transcript={transcript}
              isPlaying={isVideoPlaying}
              onSeek={seekPlayer}
              onCutClick={(cut) => handleCut(cut.id)}
              onCutResize={handleEditSave}
              onCutMove={handleEditSave}
              onAddCut={handleAddCutRange}
              onHighlightedRangeChange={setHighlightedRange}
              className="border border-[var(--color-border-tertiary)] rounded-lg overflow-hidden"
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
                userVideoId={userVideoId as string}
                onCut={handleCut}
                onDownload={handleDownloadCut}
                onEditSave={handleEditSave}
                onMetaSave={handleMetaSave}
                onSeek={seekPlayer}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT RESIZE HANDLE ── */}
        <div className="hidden lg:block">
          <ResizeHandle
            onDrag={handleRightResize}
            onDragStart={() => setIsRightDragging(true)}
            onDragEnd={() => setIsRightDragging(false)}
            onDoubleClick={toggleRightCollapse}
            collapsed={rightWidth === 0}
          />
        </div>

        {/* ── RIGHT PANEL — Cut Clips ── */}
        <div
          className={cn(
            "hidden lg:flex flex-col bg-[var(--color-bg-primary)] shrink-0 overflow-hidden",
            !isRightDragging && "transition-[width] duration-fast"
          )}
          style={{ width: rightWidth > 0 ? rightWidth : 0 }}
        >
          <CutClipsPanel
            cuts={cuts}
            userVideoId={userVideoId as string}
            onDownload={handleDownloadCut}
            onDownloadAll={handleDownloadAll}
            onSeek={seekPlayer}
          />
        </div>
      </div>

      {/* ── Floating Action Bubble (FAB) ── */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="fixed bottom-20 right-4 z-40 md:hidden w-14 h-14 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center hover:bg-primary-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
        aria-label="Quick actions"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* ── Quick Actions Drawer Overlay ── */}
      {isMobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 md:hidden animate-fade-in"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-[80vw] max-w-sm h-full bg-[var(--color-bg-primary)] border-l border-[var(--color-border-tertiary)] p-5 flex flex-col gap-4 shadow-2xl animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border-tertiary)] pb-3">
              <div>
                <h3 className="text-heading-md text-[var(--color-text-primary)]">Quick Actions</h3>
                <p className="text-caption text-[var(--color-text-tertiary)]">Select a section</p>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-col gap-2">
              {[
                { id: 'cuts', label: 'Cut Videos', desc: 'View and download all your cut clips', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
                { id: 'transcripts', label: 'Transcription', desc: 'Read the full auto-generated transcript', color: 'bg-primary-500/10 text-primary-500 border-primary-500/20' },
                { id: 'chat', label: 'Chat with AI', desc: 'Ask questions and add additional videos', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
                { id: 'research', label: 'Deep Research', desc: 'Research this video topic deeper across the web', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
              ].map((act) => (
                <button
                  key={act.id}
                  onClick={() => {
                    setMobileTab(act.id as any)
                    if (act.id !== 'cuts') {
                      setLeftTab(act.id as any)
                    }
                    setIsMobileDrawerOpen(false)
                  }}
                  className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-left transition-colors"
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold", act.color)}>
                    {act.id === 'cuts' && <Scissors className="w-5 h-5" />}
                    {act.id === 'transcripts' && <FileText className="w-5 h-5" />}
                    {act.id === 'chat' && <MessageSquare className="w-5 h-5" />}
                    {act.id === 'research' && <Globe className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">{act.label}</p>
                    <p className="text-caption text-[var(--color-text-secondary)] mt-0.5 leading-snug">{act.desc}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-auto pt-4 border-t border-[var(--color-border-tertiary)] text-center">
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="text-caption text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                Close Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}