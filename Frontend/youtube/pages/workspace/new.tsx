'use client'

// pages/workspace/new.tsx
// Handles /workspace/new?url=<youtube-url>&title=<optional-title>
// Shows a "processing" screen while setting up the workspace,
// then redirects to /workspace/[uservideoId] once ready.

import { useEffect, useState } from 'react'
import { useRouter }           from 'next/router'
import {
  Scissors,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  FileText,
  Zap,
} from 'lucide-react'
import { cn } from '@/utils/cn'

// ── Helpers ───────────────────────────────────────────────

function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1)
    return u.searchParams.get('v')
  } catch {
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

  // Simulate the processing pipeline
  // TODO: replace with real API calls to the Django backend
  useEffect(() => {
    if (!videoId || error) return

    const durations = [1200, 2500, 1800, 1000] // ms per step

    let cancelled = false

    const runSteps = async () => {
      for (let i = 0; i < INITIAL_STEPS.length; i++) {
        if (cancelled) return

        // Start this step
        setSteps((prev) =>
          prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s)
        )

        await new Promise((res) => setTimeout(res, durations[i]))
        if (cancelled) return

        // Mark done
        setSteps((prev) =>
          prev.map((s, idx) => idx === i ? { ...s, status: 'done' } : s)
        )
      }

      // All steps done — navigate to workspace
      // TODO: use the real userVideoId returned by the backend
      const mockUserVideoId = 'uv1'
      await router.push(`/workspace/${mockUserVideoId}`)
    }

    runSteps().catch(() => {
      if (!cancelled) setError('Something went wrong. Please try again.')
    })

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
    return (
      <div className="min-h-screen bg-[var(--color-bg-tertiary)] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-danger-50 border border-danger-200 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-danger-600" />
          </div>
          <div>
            <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-2">Processing failed</h1>
            <p className="text-body-sm text-[var(--color-text-secondary)]">{error}</p>
          </div>
          <button
            onClick={() => router.push('/search')}
            className="px-5 py-2.5 rounded-xl text-body-sm font-medium text-white bg-primary-600 hover:bg-primary-800 transition-colors"
          >
            Try another video
          </button>
        </div>
      </div>
    )
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
