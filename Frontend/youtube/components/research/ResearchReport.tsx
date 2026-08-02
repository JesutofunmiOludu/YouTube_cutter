// ============================================================
// VidMind AI — ResearchReport Component
// src/components/research/ResearchReport.tsx
//
// Renders a full deep research report with:
//  - Title, metadata, export button
//  - Rich report body with auto-detected sections
//  - Cited sources list
//  - Processing state (while AI is generating)
// ============================================================

import React, { useMemo }      from 'react'
import { Download, Globe, Clock, Sparkles, FileText, Brain, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react'
import { cn }                  from '@/utils/cn'
import { Button } from '@components/ui/Button'
import { Spinner, FormattedText } from '@components/ui'
import { Badge }               from '@components/ui'
import { SourceCard }          from './SourceCard'
import type { ResearchSession } from '@/types'

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

/** Split report content into named sections on markdown-style headings */
function parseSections(content: string): Array<{ heading: string; body: string }> {
  const lines    = content.split('\n')
  const sections: Array<{ heading: string; body: string }> = []
  let current:   { heading: string; lines: string[] } | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/)
    if (headingMatch) {
      if (current) sections.push({ heading: current.heading, body: current.lines.join('\n').trim() })
      current = { heading: headingMatch[1] ?? '', lines: [] }
    } else if (current) {
      current.lines.push(line)
    } else {
      // Content before any heading — treat as intro
      if (!sections.length) {
        current = { heading: '', lines: [line] }
      }
    }
  }
  if (current) sections.push({ heading: current.heading, body: current.lines.join('\n').trim() })
  return sections.filter((s) => s.body.trim().length > 0)
}

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface ResearchReportProps {
  session?:   ResearchSession | null
  isLoading?: boolean
  onExport?:  () => void
  className?: string
}

// ------------------------------------------------------------
// MULTI-STEP PROGRESS STEPPER
// ------------------------------------------------------------

interface StepConfig {
  id: string
  title: string
  description: string
  icon: React.ElementType
  minSeconds: number
}

const STEP_DEFINITIONS: StepConfig[] = [
  {
    id: 'transcript',
    title: 'Extracting Transcript & Metadata',
    description: 'Parsing video segments and identifying baseline topics',
    icon: FileText,
    minSeconds: 0,
  },
  {
    id: 'analysis',
    title: 'Analyzing Core Topics & Angles',
    description: 'Formulating targeted research questions and search queries',
    icon: Brain,
    minSeconds: 10,
  },
  {
    id: 'search',
    title: 'Executing Deep Web Exploration',
    description: 'Autonomous web search via Google Deep Research Agent',
    icon: Globe,
    minSeconds: 25,
  },
  {
    id: 'sources',
    title: 'Evaluating Sources & Verifying Facts',
    description: 'Filtering credible articles, papers, and extracting citations',
    icon: ShieldCheck,
    minSeconds: 65,
  },
  {
    id: 'synthesis',
    title: 'Synthesizing Research Report',
    description: 'Formatting Markdown sections, executive summary & references',
    icon: Sparkles,
    minSeconds: 105,
  },
]

export interface ProcessingStateProps {
  title?: string
  className?: string
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ title, className }) => {
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0)

  React.useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Calculate current active step index based on elapsed seconds
  const activeStepIdx = React.useMemo(() => {
    for (let i = STEP_DEFINITIONS.length - 1; i >= 0; i--) {
      if (elapsedSeconds >= STEP_DEFINITIONS[i].minSeconds) {
        return i
      }
    }
    return 0
  }, [elapsedSeconds])

  // Smooth asymptotic progress calculation (approaches 95% around 120s)
  const progressPercent = React.useMemo(() => {
    return Math.min(95, Math.floor(100 * (1 - Math.exp(-elapsedSeconds / 65))))
  }, [elapsedSeconds])

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  return (
    <div className={cn('flex flex-col items-center justify-center py-10 px-4 max-w-lg mx-auto w-full text-left', className)}>
      {/* Header card */}
      <div className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-2xl p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5 text-primary-500 animate-pulse" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-body-md font-semibold text-[var(--color-text-primary)]">
                {title || 'Deep Researching Video Topic…'}
              </h3>
              <p className="text-[12px] text-[var(--color-text-tertiary)] flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-primary-400" />
                <span>Elapsed: <strong className="font-mono text-[var(--color-text-secondary)]">{formatTimer(elapsedSeconds)}</strong></span>
                <span>•</span>
                <span>Est. 1–3 mins</span>
              </p>
            </div>
          </div>
          <Badge variant="info" size="sm" className="shrink-0 font-mono">
            {progressPercent}%
          </Badge>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--color-bg-tertiary)] h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary-500 to-indigo-500 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps Checklist Stepper */}
      <div className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-2xl p-5 shadow-xs space-y-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-3">
          Research Pipeline Steps
        </h4>
        <div className="space-y-3.5">
          {STEP_DEFINITIONS.map((step, idx) => {
            const isCompleted = idx < activeStepIdx
            const isActive = idx === activeStepIdx
            const StepIcon = step.icon

            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 transition-all duration-300',
                  isActive ? 'opacity-100' : isCompleted ? 'opacity-90' : 'opacity-40'
                )}
              >
                {/* Status Indicator Icon */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500/20" />
                    </div>
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full bg-primary-500/20 border border-primary-500 text-primary-500 flex items-center justify-center animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border border-[var(--color-border-secondary)] bg-[var(--color-bg-tertiary)] flex items-center justify-center text-[var(--color-text-tertiary)]">
                      <StepIcon className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Step Text & Description */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn(
                      'text-[13px] font-medium leading-tight',
                      isActive
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : isCompleted
                        ? 'text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-tertiary)]'
                    )}>
                      {step.title}
                    </p>
                    {isActive && (
                      <span className="text-[10px] uppercase font-semibold tracking-wider text-primary-500 bg-primary-500/10 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5 truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Helpful background execution notice */}
      <p className="text-[11px] text-center text-[var(--color-text-tertiary)] mt-5 max-w-xs leading-relaxed">
        Deep Research browses multiple web sources autonomously. You can switch tabs or keep working — your report will load automatically when ready.
      </p>
    </div>
  )
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

const ResearchReport: React.FC<ResearchReportProps> = ({
  session,
  isLoading   = false,
  onExport,
  className,
}) => {
  const sections = useMemo(
    () => session?.report_content ? parseSections(session.report_content) : [],
    [session?.report_content]
  )

  // Still generating
  if (session?.status === 'processing' || isLoading) {
    return <ProcessingState />
  }

  // No session yet
  if (!session) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
        <Globe className="w-10 h-10 text-[var(--color-text-tertiary)] mb-3" aria-hidden="true" />
        <h3 className="text-heading-sm text-[var(--color-text-primary)] mb-1">No research yet</h3>
        <p className="text-body-sm text-[var(--color-text-secondary)] max-w-xs">
          Select a video and start deep research to get a cited report on its topic.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>

      {/* ── Report header ── */}
      <div className="shrink-0 px-5 py-4 border-b border-[var(--color-border-tertiary)]">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-heading-lg text-[var(--color-text-primary)] flex-1">
            {session.title ?? 'Research report'}
          </h1>
          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={onExport}
              className="shrink-0"
            >
              Export
            </Button>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 flex-wrap mt-2">
          <Badge variant="info" size="sm">
            {(session.sources?.length ?? 0)} source{(session.sources?.length ?? 0) !== 1 ? 's' : ''}
          </Badge>
          <div className="flex items-center gap-1 text-caption text-[var(--color-text-tertiary)]">
            <Sparkles className="w-3 h-3" aria-hidden="true" />
            <span>Based on: {session.user_video.video.title}</span>
          </div>
          {session.completed_at && (
            <div className="flex items-center gap-1 text-caption text-[var(--color-text-tertiary)]">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>{formatDate(session.completed_at)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Report body + sources ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Report sections */}
        <div className="px-5 py-5 max-w-[680px]">
          <FormattedText content={session.report_content || ''} />
        </div>

        {/* Sources */}
        {session.sources.length > 0 && (
          <div className="px-5 pb-6 border-t border-[var(--color-border-tertiary)] pt-5">
            <h2 className="text-heading-md text-[var(--color-text-primary)] mb-3">
              Sources ({session.sources.length})
            </h2>
            <div className="flex flex-col gap-2">
              {session.sources
                .sort((a, b) => a.relevance_rank - b.relevance_rank)
                .map((source) => (
                  <SourceCard 
                    key={source.id} 
                    title={source.title}
                    url={source.url}
                    sourceType={source.source_type}
                    excerpt={source.excerpt}
                    relevanceRank={source.relevance_rank}
                  />
                ))
              }
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ResearchReport.displayName = 'ResearchReport'
export default ResearchReport
