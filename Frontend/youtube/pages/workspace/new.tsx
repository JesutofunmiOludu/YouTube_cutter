'use client'

// pages/workspace/new.tsx
// Unified workspace creation & video ingestion page.
// Matches user's sketch layout with UnifiedIngestionBar and progress stages.

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import {
  Scissors,
  CheckCircle,
  AlertCircle,
  Loader2,
  Play,
  FileText,
  Zap,
  Sparkles,
  Link,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth.store'
import { UnifiedIngestionBar, extractYouTubeId, TranscriptionEngine } from '@/components/workspace/UnifiedIngestionBar'

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
  if (status === 'done')    return <CheckCircle className="w-5 h-5 text-emerald-500"  aria-hidden="true" />
  if (status === 'error')   return <AlertCircle  className="w-5 h-5 text-rose-500"   aria-hidden="true" />
  if (status === 'running') return <Loader2      className="w-5 h-5 text-primary-500 animate-spin" aria-hidden="true" />
  return (
    <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)]" aria-hidden="true" />
  )
}

// ── Error screen with retry input ────────────────────────

function ErrorScreen({ error, onReset }: { error: string; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)] flex items-center justify-center p-6">
      <div className="max-w-xl w-full flex flex-col items-center gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rose-500" aria-hidden="true" />
        </div>

        <div>
          <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-2">
            Could not load video
          </h1>
          <p className="text-body-sm text-[var(--color-text-secondary)]">{error}</p>
        </div>

        <div className="w-full">
          <UnifiedIngestionBar />
        </div>

        <button
          onClick={onReset}
          className="text-body-sm text-primary-600 hover:text-primary-700 transition-colors underline underline-offset-2"
        >
          Reset and try again
        </button>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────

export default function WorkspaceNewPage() {
  const router = useRouter()
  const { url, title: titleParam, engine: engineParam } = router.query as {
    url?: string
    title?: string
    engine?: TranscriptionEngine
  }

  const { user, deductCredits } = useAuthStore()
  const { toast } = useToast()

  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS)
  const [error, setError] = useState<string | null>(null)
  const [videoId, setVideoId] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState<string>('')
  const [selectedEngine, setSelectedEngine] = useState<TranscriptionEngine>(
    engineParam === 'extended' ? 'extended' : 'standard'
  )

  // Derive YouTube ID from URL
  useEffect(() => {
    if (!url) return
    const ytId = extractYouTubeId(url)
    if (ytId) {
      setVideoId(ytId)
      setVideoTitle(titleParam ? decodeURIComponent(titleParam) : 'YouTube Video')
      if (engineParam) {
        setSelectedEngine(engineParam)
      }
    } else {
      setError('Invalid YouTube URL. Please paste a valid youtube.com or youtu.be link.')
    }
  }, [url, titleParam, engineParam])

  // Processing pipeline
  useEffect(() => {
    if (!videoId || error) return

    let cancelled = false

    const runSteps = async () => {
      setSteps((prev) =>
        prev.map((s) => s.id === 'fetch' ? { ...s, status: 'running' } : s)
      )

      let userVideoId = ''
      try {
        const res = await apiClient.post('/videos/', {
          youtube_id: videoId,
          transcription_mode: selectedEngine,
        })
        const uv = res.data
        userVideoId = uv.id

        // If extended mode succeeded, deduct credit in UI store
        if (selectedEngine === 'extended') {
          deductCredits(1)
        }

        setSteps((prev) =>
          prev.map((s) => s.id === 'fetch' ? { ...s, status: 'done' } : s)
        )
      } catch (err: any) {
        if (!cancelled) {
          const data = err.response?.data
          const msg =
            (Array.isArray(data?.youtube_id) ? data.youtube_id[0] : data?.youtube_id) ||
            data?.credits ||
            data?.error?.message ||
            data?.error ||
            data?.detail ||
            'Failed to setup video workspace. Please check the link and try again.'
          setError(msg)
          setSteps((prev) =>
            prev.map((s) => s.id === 'fetch' ? { ...s, status: 'error' } : s)
          )
        }
        return
      }

      // Poll status
      let completed = false
      let attempts = 0
      const maxAttempts = 40

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

      // Smooth step animation
      const remaining = ['transcribe', 'analyse', 'cuts']
      for (const stepId of remaining) {
        if (cancelled) return
        setSteps((prev) =>
          prev.map((s) => s.id === stepId ? { ...s, status: 'running' } : s)
        )
        await new Promise((res) => setTimeout(res, 500))
        if (cancelled) return
        setSteps((prev) =>
          prev.map((s) => s.id === stepId ? { ...s, status: 'done' } : s)
        )
      }

      await new Promise((res) => setTimeout(res, 400))
      if (!cancelled) {
        toast.success('Workspace is ready!')
        router.push(`/workspace/${userVideoId}`)
      }
    }

    runSteps()

    return () => { cancelled = true }
  }, [videoId, selectedEngine, error, router])

  // ── No URL provided -> Render Unified Command Bar Entry Page ──
  if (!url && router.isReady) {
    return (
      <div className="min-h-[85vh] flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full flex flex-col items-center gap-8 text-center">
          
          {/* Header Badge & Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-caption font-semibold border border-primary-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              ClipMide Workspace Setup
            </div>
            <h1 className="text-display-sm sm:text-display-md font-bold text-[var(--color-text-primary)] tracking-tight">
              Create New Project
            </h1>
            <p className="text-body-md text-[var(--color-text-secondary)] max-w-xl">
              Paste any YouTube video or search topics to generate smart AI timestamps, chapter cuts, and studio transcripts.
            </p>
          </div>

          {/* Unified Command Bar (From User Sketch) */}
          <UnifiedIngestionBar />

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mt-4">
            <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] text-left flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1">
                <Zap className="w-4 h-4" />
              </div>
              <h3 className="text-body-sm font-semibold text-[var(--color-text-primary)]">Standard Engine</h3>
              <p className="text-caption text-[var(--color-text-secondary)]">
                Instant YouTube captions at 0 credit cost. Perfect for quick reviews.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] text-left flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-500 flex items-center justify-center mb-1">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-body-sm font-semibold text-[var(--color-text-primary)]">Extended AI Studio</h3>
              <p className="text-caption text-[var(--color-text-secondary)]">
                Gemini audio speech-to-text with punctuation, speaker tags & high precision.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] text-left flex flex-col gap-1.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-1">
                <Scissors className="w-4 h-4" />
              </div>
              <h3 className="text-body-sm font-semibold text-[var(--color-text-primary)]">Lossless Stream Cuts</h3>
              <p className="text-caption text-[var(--color-text-secondary)]">
                Instant 1-click video clip downloads with zero quality degradation.
              </p>
            </div>
          </div>

        </div>
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────
  if (error) {
    return <ErrorScreen error={error} onReset={() => { setError(null); router.push('/workspace/new') }} />
  }

  // ── Processing State UI ───────────────────────────────────
  const allDone  = steps.every((s) => s.status === 'done')
  const progress = (steps.filter((s) => s.status === 'done').length / steps.length) * 100

  return (
    <div className="min-h-screen bg-[var(--color-bg-tertiary)] flex items-center justify-center p-6">
      <div className="max-w-lg w-full flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center">
            <Scissors className="w-7 h-7 text-primary-600" />
          </div>
          <div>
            <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-1">
              {allDone ? 'Workspace ready!' : 'Setting up your workspace'}
            </h1>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              {allDone
                ? 'Redirecting you to the editor…'
                : selectedEngine === 'extended'
                  ? 'Running Gemini AI Studio audio analysis (1 Credit deducted)…'
                  : 'Fetching captions and building AI cut points…'}
            </p>
          </div>
        </div>

        {/* Video info card */}
        {videoId && (
          <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-xl overflow-hidden flex gap-3 p-3 shadow-md">
            <div className="w-24 shrink-0 rounded-md overflow-hidden bg-[var(--color-bg-tertiary)] aspect-video flex items-center justify-center">
              <img
                src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                alt={videoTitle}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-500">
                  <Play className="w-3 h-3 fill-current" /> YouTube
                </span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider',
                  selectedEngine === 'extended'
                    ? 'bg-primary-500/10 text-primary-600'
                    : 'bg-emerald-500/10 text-emerald-600'
                )}>
                  {selectedEngine === 'extended' ? 'Extended AI' : 'Standard'}
                </span>
              </div>
              <p className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
                {videoTitle}
              </p>
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="flex flex-col gap-2">
          <div className="h-2 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
              role="progressbar"
              aria-valuenow={Math.round(progress)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="text-caption text-[var(--color-text-tertiary)] text-right tabular-nums font-mono">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Steps list */}
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-2xl divide-y divide-[var(--color-border-tertiary)] overflow-hidden shadow-sm">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                'flex items-start gap-3.5 px-4 py-3.5 transition-colors duration-fast',
                step.status === 'running' && 'bg-primary-50/50 dark:bg-primary-950/20',
              )}
            >
              <div className="mt-0.5 shrink-0">
                <StepIcon status={step.status} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-body-sm font-medium',
                  step.status === 'done'    && 'text-emerald-600 dark:text-emerald-400 font-semibold',
                  step.status === 'running' && 'text-primary-600 dark:text-primary-400 font-semibold',
                  step.status === 'pending' && 'text-[var(--color-text-tertiary)]',
                  step.status === 'error'   && 'text-rose-600 font-semibold',
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
                <span className="text-caption text-emerald-600 font-semibold shrink-0 mt-0.5">Done</span>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
