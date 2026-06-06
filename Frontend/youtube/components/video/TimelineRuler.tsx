// ============================================================
// VidMind AI — TimelineRuler
// components/video/TimelineRuler.tsx
//
// A pure-display ruler bar that renders major + minor tick marks
// and time labels scaled to the current zoom level.
// ============================================================

import React, { useMemo } from 'react'
import { cn } from '@/utils/cn'

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function formatRulerTime(s: number): string {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  if (m > 0) return `${m}:${String(sec).padStart(2, '0')}`
  return `${sec}s`
}

/** Pick a nice tick interval (in seconds) given the visible width & zoom */
function chooseTick(duration: number, widthPx: number, zoom: number): { major: number; minor: number } {
  const visibleSeconds = duration / zoom
  const targetMajors   = Math.max(4, Math.floor(widthPx / 80))
  const rawInterval    = visibleSeconds / targetMajors

  const niceIntervals = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 1200, 1800, 3600]
  const major = niceIntervals.find((v) => v >= rawInterval) ?? niceIntervals[niceIntervals.length - 1]!
  const minor = major <= 10 ? major / 5 : major / 4

  return { major, minor: Math.max(minor, 0.5) }
}

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface TimelineRulerProps {
  duration:   number   // total video duration in seconds
  zoom:       number   // 1 = full, 2 = 2× zoomed, etc.
  scrollLeft: number   // current horizontal scroll offset in px
  widthPx:    number   // rendered width of the timeline area in px
  className?: string
}

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

const TimelineRuler: React.FC<TimelineRulerProps> = ({
  duration,
  zoom,
  scrollLeft,
  widthPx,
  className,
}) => {
  const { major, minor } = useMemo(
    () => chooseTick(duration, widthPx, zoom),
    [duration, widthPx, zoom],
  )

  const totalWidthPx = widthPx * zoom

  // Build arrays of tick positions
  const majorTicks = useMemo<number[]>(() => {
    if (duration <= 0 || major <= 0) return []
    const ticks: number[] = []
    for (let t = 0; t <= duration; t += major) ticks.push(t)
    return ticks
  }, [duration, major])

  const minorTicks = useMemo<number[]>(() => {
    if (duration <= 0 || minor <= 0) return []
    const ticks: number[] = []
    for (let t = 0; t <= duration; t += minor) {
      if (Math.abs(t % major) > 0.001) ticks.push(t) // skip positions that already have major tick
    }
    return ticks
  }, [duration, minor, major])

  const secToPct = (s: number) => (duration > 0 ? (s / duration) * 100 : 0)

  return (
    <div
      className={cn('relative h-7 select-none overflow-hidden shrink-0', className)}
      style={{ width: `${totalWidthPx}px`, transform: `translateX(${-scrollLeft}px)` }}
      aria-hidden="true"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border-tertiary)]" />

      {/* Minor ticks */}
      {minorTicks.map((t) => (
        <div
          key={`m-${t}`}
          className="absolute bottom-0 w-px h-2 bg-[var(--color-border-secondary)]"
          style={{ left: `${secToPct(t)}%` }}
        />
      ))}

      {/* Major ticks + labels */}
      {majorTicks.map((t) => (
        <div
          key={`M-${t}`}
          className="absolute bottom-0 flex flex-col items-center"
          style={{ left: `${secToPct(t)}%` }}
        >
          <span className="text-[9px] font-medium text-[var(--color-text-tertiary)] tabular-nums whitespace-nowrap px-0.5 leading-none mb-1">
            {formatRulerTime(t)}
          </span>
          <div className="w-px h-3 bg-[var(--color-border-primary)]" />
        </div>
      ))}
    </div>
  )
}

TimelineRuler.displayName = 'TimelineRuler'
export default TimelineRuler
