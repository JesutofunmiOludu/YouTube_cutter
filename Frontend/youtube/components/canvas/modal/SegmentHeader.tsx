// ============================================================
// VidMind AI — SegmentHeader Component
// components/canvas/modal/SegmentHeader.tsx
//
// Top header for SegmentFocusModal:
//   • Node color dot & category badge
//   • Node title & timestamp range
//   • Prev / Next segment navigation buttons
//   • Close button
// ============================================================

import React from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { KnowledgeNode } from '@/types'

export interface SegmentHeaderProps {
  node: KnowledgeNode
  duration: number
  onClose: () => void
  onPrevSegment?: () => void
  onNextSegment?: () => void
  hasPrev?: boolean
  hasNext?: boolean
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export const SegmentHeader: React.FC<SegmentHeaderProps> = ({
  node,
  duration,
  onClose,
  onPrevSegment,
  onNextSegment,
  hasPrev = false,
  hasNext = false,
}) => {
  return (
    <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/50 flex items-center justify-between gap-2 shrink-0">
      {/* Left: color dot + title block */}
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: node.color || '#6366f1' }}
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 shrink-0">
              {node.category || 'Segment'}
            </span>
            <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-tertiary)] font-mono text-[var(--color-text-secondary)] shrink-0">
              {formatTime(node.start_seconds)} → {formatTime(node.end_seconds)}
              <span className="hidden sm:inline"> ({formatTime(duration)})</span>
            </span>
          </div>
          <h2 className="text-sm sm:text-body-md font-bold text-[var(--color-text-primary)] truncate mt-0.5">
            {node.title}
          </h2>
        </div>
      </div>

      {/* Right: prev/next + close buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-tertiary)] p-0.5">
          <button
            type="button"
            onClick={onPrevSegment}
            disabled={!hasPrev}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] disabled:opacity-30 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Previous Segment (← arrow key)"
            aria-label="Previous Segment"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextSegment}
            disabled={!hasNext}
            className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] disabled:opacity-30 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Next Segment (→ arrow key)"
            aria-label="Next Segment"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition"
          aria-label="Close modal (Escape key)"
          title="Close (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default SegmentHeader

