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
import { Download, Globe, Clock, Sparkles } from 'lucide-react'
import { cn }                  from '@/utils/cn'
import Button                  from '@components/ui/Button'
import { Spinner }             from '@components/ui'
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
// PROCESSING STATE
// ------------------------------------------------------------

const PROCESSING_STEPS = [
  'Reading video content…',
  'Identifying key topics…',
  'Searching the web…',
  'Analysing sources…',
  'Synthesising report…',
]

const ProcessingState: React.FC = () => {
  const [step, setStep] = React.useState(0)

  React.useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % PROCESSING_STEPS.length)
    }, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
        <Globe className="w-7 h-7 text-primary-600 animate-pulse" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-heading-md text-[var(--color-text-primary)] mb-2">
          Researching…
        </h3>
        <p className="text-body-sm text-[var(--color-text-secondary)] transition-all duration-slow">
          {PROCESSING_STEPS[step]}
        </p>
      </div>
      <Spinner size="md" variant="primary" label="Generating research report" />
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
            {session.sources.length} source{session.sources.length !== 1 ? 's' : ''}
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
          {sections.length > 0 ? (
            sections.map((section, i) => (
              <div key={i} className="mb-6">
                {section.heading && (
                  <h2 className="text-heading-md text-[var(--color-text-primary)] mb-2">
                    {section.heading}
                  </h2>
                )}
                <div className="text-body-lg text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
                  {section.body}
                </div>
              </div>
            ))
          ) : (
            <div className="text-body-lg text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-wrap">
              {session.report_content}
            </div>
          )}
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
