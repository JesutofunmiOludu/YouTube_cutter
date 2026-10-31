// ============================================================
// VidMind AI — SegmentTranscript Component
// components/canvas/modal/SegmentTranscript.tsx
//
// Verbatim timestamped transcript lines for the current segment:
//   • Filtered lines within [start_seconds, end_seconds]
//   • Formatted timestamp badges
//   • Loading skeleton & graceful empty states
// ============================================================

import React from 'react'
import { FileText, Loader2 } from 'lucide-react'

export interface SegmentTranscriptLine {
  id: string
  start: number
  end: number
  text: string
}

export interface SegmentTranscriptProps {
  lines: SegmentTranscriptLine[]
  isLoading: boolean
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export const SegmentTranscript: React.FC<SegmentTranscriptProps> = ({
  lines,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-[var(--color-text-tertiary)]">
        <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
        <span className="text-body-sm">Loading transcript lines…</span>
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--color-text-tertiary)] space-y-2">
        <FileText className="w-8 h-8 opacity-40 mx-auto" />
        <p className="text-body-sm font-medium">No transcript available for this time range.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-2.5 min-h-0">
      {lines.map((line) => (
        <div
          key={line.id}
          className="p-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border-tertiary)] transition flex items-start gap-3 group"
        >
          <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] shrink-0 mt-0.5">
            {formatTime(line.start)}
          </span>
          <p className="text-sm sm:text-body-sm text-[var(--color-text-primary)] leading-relaxed">
            {line.text}
          </p>
        </div>
      ))}
    </div>
  )
}

export default SegmentTranscript

