'use client'

// pages/workspace/new.tsx
// Handles /workspace/new?url=<youtube-url>&title=<optional-title>
// Shows a "processing" screen while setting up the workspace,
// then redirects to /workspace/[uservideoId] once ready.

import { useEffect, useState, useRef } from 'react'
import { useRouter }           from 'next/router'
import {
  Scissors,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  FileText,
  Zap,
  Link,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import { useToast } from '@/components/ui/Toast'

// ── Helpers ───────────────────────────────────────────────

/**
 * Extracts the YouTube video ID from any common YouTube URL format:
 *  - youtube.com/watch?v=ID
 *  - youtu.be/ID
 *  - youtube.com/shorts/ID
 *  - youtube.com/embed/ID
 *  - youtube.com/live/ID
 *  - youtube.com/v/ID
 *  - m.youtube.com/watch?v=ID
 *  - youtube.com/attribution_link?...&v=ID
 */
function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim()

  // Bare 11-character video ID (no URL wrapper)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^(www\.|m\.)/, '')

    if (host === 'youtu.be') {
      // https://youtu.be/ID or https://youtu.be/ID?t=30
      const id = u.pathname.slice(1).split('/')[0]
      return id.length === 11 ? id : null
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      // /watch?v=ID
      const v = u.searchParams.get('v')
      if (v && v.length === 11) return v

      // /shorts/ID, /embed/ID, /live/ID, /v/ID
      const pathParts = u.pathname.split('/').filter(Boolean)
      if (['shorts', 'embed', 'live', 'v', 'e'].includes(pathParts[0]) && pathParts[1]) {
        const id = pathParts[1].split('?')[0]
        return id.length === 11 ? id : null
      }

      // /attribution_link?a=...&u=%2Fwatch%3Fv%3DID
      if (pathParts[0] === 'attribution_link') {
        const inner = u.searchParams.get('u') || ''
        const match = inner.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
        return match ? match[1] : null
      }
    }

    return null
  } catch {
    // URL() constructor threw — not a valid URL
    return null
  }
}

// ── Processing step type ──────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done' | 'error'

interface ProcessingStep {
  id:     string
  label:  string
  detail: string
  status: StepStatus
}

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'fetch',       label: 'Fetching video metadata',   detail: 'Retrieving title, duration, and channel info', status: 'pending' },
  { id: 'transcribe',  label: 'Transcribing audio',        detail: 'AI is generating a full transcript',            status: 'pending' },
  { id: 'analyse',     label: 'Analysing content',         detail: 'Finding natural chapter breaks',               status: 'pending' },
  { id: 'cuts',        label: 'Generating cut suggestions',detail: 'Preparing your workspace',                      status: 'pending' },
]

// ── Step icon ─────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done')    return <CheckCircle className="w-5 h-5 text-success-600"  aria-hidden="true" />
  if (status === 'error')   return <AlertCircle  className="w-5 h-5 text-danger-600"   aria-hidden="true" />
  if (status === 'running') return <Loader2      className="w-5 h-5 text-primary-600 animate-spin" aria-hidden="true" />
  return (
    <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)]" aria-hidden="true" />
  )
}

// ── Error screen with retry input ────────────────────────

function ErrorScreen({ error }: { error: string }) {
  const router         = useRouter()
  const [retryUrl, setRetryUrl] = useState('')
  const [urlError, setUrlError] = useState('')
  const inputRef       = useRef<HTMLInputElement>(null)

  const isUrlError = error.toLowerCase().includes('invalid youtube url') ||
                     error.toLowerCase().includes('incorrect')

  const handleRetry = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = retryUrl.trim()
    if (!trimmed) { setUrlError('Please paste a YouTube link.'); return }
    const ytId = extractYouTubeId(trimmed)
    if (!ytId) {
      setUrlError('That doesn\'t look like a valid YouTube link. Try youtube.com/watch?v=… or youtu.be/…')
      return
    }
    setUrlError('')
    router.push(`/workspace/new?url=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)] flex items-center justify-center p-6">
      <div className="max-w-md w-full flex flex-col items-center gap-6">

        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-danger-50 border border-danger-200 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-danger-600" aria-hidden="true" />
        </div>

        {/* Message */}
        <div className="text-center">
          <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-2">
            {isUrlError ? 'Invalid YouTube link' : 'Could not load video'}
          </h1>
          <p className="text-body-sm text-[var(--color-text-secondary)]">{error}</p>
        </div>

        {/* Retry input */}
        <form onSubmit={handleRetry} className="w-full flex flex-col gap-3">
          <label className="text-body-sm font-medium text-[var(--color-text-primary)]">
            Paste a different YouTube link
          </label>
          <div className={cn(
            'flex items-center gap-2 h-10 px-3 rounded-lg border',
            'bg-[var(--color-bg-primary)] transition-colors duration-fast',
            urlError
              ? 'border-danger-400 ring-2 ring-danger-100'
              : 'border-[var(--color-border-secondary)] focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200',
          )}>
            <Link className="w-4 h-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <input
              ref={inputRef}
              type="url"
              value={retryUrl}
              onChange={(e) => { setRetryUrl(e.target.value); setUrlError('') }}
              placeholder="https://youtube.com/watch?v=…"
              autoFocus
              className="flex-1 bg-transparent border-none outline-none text-body-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
              aria-label="YouTube URL to retry"
            />
          </div>
          {urlError && (
            <p className="text-caption text-danger-800 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />
              {urlError}
            </p>
          )}
          <button
            type="submit"
            className="flex items-center justify-center gap-2 h-10 rounded-xl text-body-sm font-medium text-white bg-primary-600 hover:bg-primary-800 transition-colors"
          >
            Try this link <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
          <span className="text-caption text-[var(--color-text-tertiary)]">or</span>
          <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
        </div>

        <button
          onClick={() => router.push('/search')}
          className="text-body-sm text-primary-600 hover:text-primary-800 transition-colors underline underline-offset-2"
        >
          Search for a video instead
        </button>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function WorkspaceNewPage() {
  const router = useRouter()
  const { url, title: titleParam } = router.query as { url?: string; title?: string }

  const [steps,   setSteps]   = useState<ProcessingStep[]>(INITIAL_STEPS)
  const [error,   setError]   = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string>('')

  // Derive YouTube ID from the URL query param
  useEffect(() => {
    if (!url) return
    const ytId = extractYouTubeId(url)
    if (ytId) {
      setVideoId(ytId)
      setVideoTitle(titleParam ? decodeURIComponent(titleParam) : 'YouTube Video')
    } else {
      setError('Invalid YouTube URL. Please paste a valid youtube.com or youtu.be link.')
    }
  }, [url, titleParam])

  // Real processing pipeline connecting to Django backend
  const { toast } = useToast()

  useEffect(() => {
    if (!videoId || error) return

    let cancelled = false

    const runSteps = async () => {
      // Step 1: Fetching video metadata (POST /api/videos/)
      setSteps((prev) =>
        prev.map((s) => s.id === 'fetch' ? { ...s, status: 'running' } : s)
      )

      let userVideoId = ''
      try {
        const res = await apiClient.post('/videos/', { youtube_id: videoId })
        const uv = res.data
        userVideoId = uv.id
        setSteps((prev) =>
          prev.map((s) => s.id === 'fetch' ? { ...s, status: 'done' } : s)
        )
      } catch (err: any) {
        if (!cancelled) {
          const data = err.response?.data
          // DRF ValidationError shape: { youtube_id: ['msg'] } or { error: 'msg' }
          const msg =
            (Array.isArray(data?.youtube_id) ? data.youtube_id[0] : data?.youtube_id) ||
            data?.error?.message ||
            data?.error ||
            data?.detail ||
            'Failed to fetch video metadata. Please check the link and try again.'
          setError(msg)
          setSteps((prev) =>
            prev.map((s) => s.id === 'fetch' ? { ...s, status: 'error' } : s)
          )
        }
        return
      }

      // Steps 2, 3, 4: Poll status & simulate progress for transcript and analysis
      let completed = false
      let attempts = 0
      const maxAttempts = 30 // 60 seconds max

      while (!completed && attempts < maxAttempts && !cancelled) {
        try {
          const checkRes = await apiClient.get(`/videos/${userVideoId}/`)
          const status = checkRes.data.processing_status

          if (status === 'completed') {
            completed = true
          } else if (status === 'failed') {
            if (!cancelled) {
              setError('AI processing failed for this video.')
              setSteps((prev) => prev.map((s) => ({ ...s, status: 'error' })))
            }
            return
          } else {
            // Processing or pending, wait and check again
            setSteps((prev) =>
              prev.map((s) => s.id === 'transcribe' ? { ...s, status: 'running' } : s)
            )
            await new Promise((res) => setTimeout(res, 2000))
            attempts++
          }
        } catch (err) {
          if (!cancelled) {
            setError('Failed to query video status.')
          }
          return
        }
      }

      if (cancelled) return

      // Smoothly transition remaining steps for high-end UI feel
      const remaining = ['transcribe', 'analyse', 'cuts']
      for (const stepId of remaining) {
        if (cancelled) return
        setSteps((prev) =>
          prev.map((s) => s.id === stepId ? { ...s, status: 'running' } : s)
        )
        await new Promise((res) => setTimeout(res, 600))
        if (cancelled) return
        setSteps((prev) =>
          prev.map((s) => s.id === stepId ? { ...s, status: 'done' } : s)
        )
      }

      await new Promise((res) => setTimeout(res, 500))
      if (!cancelled) {
        toast.success('Workspace is ready!')
        router.push(`/workspace/${userVideoId}`)
      }
    }

    runSteps()

    return () => { cancelled = true }
  }, [videoId, error, router])

  // ── No URL provided ──────────────────────────────────────

  if (!url && router.isReady) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 border border-danger-200 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-danger-600" />
          </div>
          <div>
            <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-2">No video URL provided</h1>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Please go back and select a video to process.
            </p>
          </div>
          <button
            onClick={() => router.push('/search')}
            className="px-5 py-2.5 rounded-xl text-body-sm font-medium text-white bg-primary-600 hover:bg-primary-800 transition-colors"
          >
            Search for a video
          </button>
        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────

  if (error) {
    return <ErrorScreen error={error} />
  }

  // ── Processing UI ─────────────────────────────────────────

  const allDone    = steps.every((s) => s.status === 'done')
  const currentIdx = steps.findIndex((s) => s.status === 'running')
  const progress   = (steps.filter((s) => s.status === 'done').length / steps.length) * 100

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 border border-primary-200 flex items-center justify-center">
            <Scissors className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-1">
              {allDone ? 'Workspace ready!' : 'Setting up your workspace'}
            </h1>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              {allDone
                ? 'Redirecting you to the editor…'
                : 'This usually takes less than a minute.'}
            </p>
          </div>
        </div>

        {/* Video info card */}
        {videoId && (
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-xl overflow-hidden flex gap-3 p-3">
            <div className="w-24 shrink-0 rounded-md overflow-hidden bg-[var(--color-bg-tertiary)] aspect-video flex items-center justify-center">
              <img
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt={videoTitle}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-caption text-[var(--color-text-tertiary)]">YouTube</span>
              </div>
              <p className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
                {videoTitle}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-caption text-[var(--color-text-tertiary)] text-right tabular-nums">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Steps list */}
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl divide-y divide-[var(--color-border-tertiary)] overflow-hidden">
          {steps.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3 px-4 py-3.5 transition-colors duration-fast',
                step.status === 'running' && 'bg-primary-50/40',
              )}
            >
              <div className="mt-0.5 shrink-0">
                <StepIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-body-sm font-medium',
                  step.status === 'done'    && 'text-success-800',
                  step.status === 'running' && 'text-primary-800',
                  step.status === 'pending' && 'text-[var(--color-text-tertiary)]',
                  step.status === 'error'   && 'text-danger-800',
                )}>
                  {step.label}
                </p>
                {(step.status === 'running' || step.status === 'done') && (
                  <p className="text-caption text-[var(--color-text-secondary)] mt-0.5">
                    {step.detail}
                  </p>
                )}
              </div>
              {step.status === 'done' && (
                <span className="text-caption text-success-600 font-medium shrink-0 mt-0.5">Done</span>
              )}
            </div>
          ))}
        </div>

        {/* Feature hints */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <FileText className="w-4 h-4" />,  label: 'Full transcript'    },
            { icon: <Scissors className="w-4 h-4" />,  label: 'AI cut suggestions' },
            { icon: <Zap       className="w-4 h-4" />, label: 'Deep research'       },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] text-center"
            >
              <div className="text-primary-600">{icon}</div>
              <p className="text-caption text-[var(--color-text-secondary)]">{label}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
