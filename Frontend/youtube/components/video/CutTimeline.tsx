// ============================================================
// VidMind AI — CutTimeline Component
// src/components/video/CutTimeline.tsx
//
// Visual timeline bar showing all cut markers relative to
// the total video duration. Clicking a marker seeks the
// player to that position. Playhead tracks current time.
// ============================================================

import React, { useRef, useCallback } from 'react'
import { cn }             from '@/utils/cn'
import { formatDuration } from './VideoCard'
import type { VideoCut }  from '@/types'

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface CutTimelineProps {
  cuts:         VideoCut[]
  duration:     number
  currentTime:  number
  onSeek?:      (seconds: number) => void
  onCutClick?:  (cut: VideoCut) => void
  className?:   string
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const CutTimeline: React.FC<CutTimelineProps> = ({
  cuts,
  duration,
  currentTime,
  onSeek,
  onCutClick,
  className,
}) => {
  const trackRef    = useRef<HTMLDivElement>(null)

  const playheadPct = duration > 0
    ? Math.min((currentTime / duration) * 100, 100)
    : 0

  // Convert a click/touch X position to a time value
  const xToTime = useCallback(
    (clientX: number): number => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect || duration === 0) return 0
      const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return pct * duration
    },
    [duration]
  )

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSeek?.(xToTime(e.clientX))
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Video timeline"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatDuration(Math.round(currentTime))} of ${formatDuration(Math.round(duration))}`}
        tabIndex={0}
        className={cn(
          'relative h-7 w-full',
          'bg-[var(--color-bg-secondary)]',
          'border border-[var(--color-border-tertiary)]',
          'rounded-md overflow-hidden',
          'cursor-pointer select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        )}
        onClick={handleTrackClick}
        onKeyDown={(e) => {
          if (!duration) return
          const step = duration * 0.02  // 2% step
          if (e.key === 'ArrowRight') onSeek?.(Math.min(currentTime + step, duration))
          if (e.key === 'ArrowLeft')  onSeek?.(Math.max(currentTime - step, 0))
        }}
      >
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 h-full bg-primary-50 transition-[width] duration-fast pointer-events-none"
          style={{ width: `${playheadPct}%` }}
          aria-hidden="true"
        />

        {/* Cut markers */}
        {cuts.map((cut, i) => {
          const leftPct  = duration > 0 ? (cut.start_seconds / duration) * 100 : 0
          const widthPct = duration > 0
            ? ((cut.end_seconds - cut.start_seconds) / duration) * 100
            : 0

          return (
            <button
              key={cut.id}
              aria-label={`Cut ${i + 1}: ${formatDuration(cut.start_seconds)} to ${formatDuration(cut.end_seconds)}`}
              className={cn(
                'absolute top-0 h-full',
                'border-x border-x-primary-200',
                'transition-colors duration-fast',
                cut.user_approved
                  ? 'bg-success-50/60 hover:bg-success-50'
                  : 'bg-primary-100/40 hover:bg-primary-100/70',
              )}
              style={{ left: `${leftPct}%`, width: `${Math.max(widthPct, 0.5)}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onCutClick?.(cut)
                onSeek?.(cut.start_seconds)
              }}
            >
              {/* Cut number label — only show if wide enough */}
              {widthPct > 4 && (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-medium text-primary-800 pointer-events-none">
                  {i + 1}
                </span>
              )}
            </button>
          )
        })}

        {/* Playhead */}
        <div
          className="absolute top-0 h-full w-0.5 bg-danger-600 pointer-events-none z-10 transition-[left] duration-fast"
          style={{ left: `${playheadPct}%` }}
          aria-hidden="true"
        />
      </div>

      {/* Time labels */}
      <div className="flex justify-between text-caption text-[var(--color-text-tertiary)] tabular-nums px-0.5">
        <span>{formatDuration(Math.round(currentTime))}</span>
        <span>{formatDuration(Math.round(duration))}</span>
      </div>
    </div>
  )
}

CutTimeline.displayName = 'CutTimeline'
export default CutTimeline
