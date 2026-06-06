// ============================================================
// VidMind AI — CutTimeline (Enhanced)
// components/video/CutTimeline.tsx
//
// Professional video editor timeline with:
//   • Zoomable ruler with major/minor tick marks
//   • Draggable clip segments (move + resize from edges)
//   • Scrubbing playhead (drag the red line)
//   • Transcript track row (read-only segments)
//   • Zoom in/out controls + scroll-wheel zoom
//   • Keyboard navigation (← → arrow keys)
//   • Tooltips showing clip title + time range on hover
// ============================================================

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react'
import { cn }            from '@/utils/cn'
import { Tooltip }       from '@/components/ui/Tooltip'
import TimelineRuler     from './TimelineRuler'
import type { VideoCut, TranscriptSegment } from '@/types'

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const MIN_ZOOM        = 1
const MAX_ZOOM        = 20
const ZOOM_STEP       = 0.5
const HANDLE_WIDTH_PX = 6  // edge resize handle width in px
const TRACK_HEIGHT    = 36 // px height of each track row
const RULER_HEIGHT    = 28 // px

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function fmt(s: number): string {
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

export interface CutTimelineProps {
  cuts:         VideoCut[]
  duration:     number
  currentTime:  number
  transcript?:  TranscriptSegment[]
  onSeek?:      (seconds: number) => void
  onCutClick?:  (cut: VideoCut) => void
  /** Called when user drag-resizes a clip edge */
  onCutResize?: (cutId: string, start: number, end: number) => void
  /** Called when user drags a clip to a new position */
  onCutMove?:   (cutId: string, start: number, end: number) => void
  className?:   string
}

type DragMode = 'none' | 'playhead' | 'clip-move' | 'clip-left' | 'clip-right'

interface DragState {
  mode:         DragMode
  cutId:        string | null
  startX:       number   // pointer X when drag began (client coords)
  origStart:    number   // clip start_seconds at drag begin
  origEnd:      number   // clip end_seconds at drag begin
}

// ------------------------------------------------------------
// Sub-component: Clip segment
// ------------------------------------------------------------

function ClipSegment({
  cut,
  index,
  isActive,
  leftPct,
  widthPct,
  zoom,
  onPointerDownMove,
  onPointerDownLeft,
  onPointerDownRight,
}: {
  cut:                VideoCut
  index:              number
  isActive:           boolean
  leftPct:            number
  widthPct:           number
  zoom:               number
  onPointerDownMove:  (e: React.PointerEvent, cut: VideoCut) => void
  onPointerDownLeft:  (e: React.PointerEvent, cut: VideoCut) => void
  onPointerDownRight: (e: React.PointerEvent, cut: VideoCut) => void
}) {
  const toolTipContent = (
    <span>
      <strong>{cut.title ?? `Clip ${index + 1}`}</strong>
      <br />
      {fmt(cut.start_seconds)} → {fmt(cut.end_seconds)}
    </span>
  )

  return (
    <Tooltip content={toolTipContent} placement="top" delay={400}>
      <div
        className={cn(
          'absolute top-1 rounded-md border cursor-grab active:cursor-grabbing select-none overflow-hidden',
          'transition-colors duration-fast group',
          isActive
            ? 'border-primary-400 ring-1 ring-primary-300'
            : 'border-transparent',
          cut.user_approved
            ? 'bg-success-100/80 hover:bg-success-100 border-success-300'
            : 'bg-primary-100/70 hover:bg-primary-100 border-primary-200',
        )}
        style={{
          left:   `${leftPct}%`,
          width:  `${Math.max(widthPct, 0.3)}%`,
          height: `${TRACK_HEIGHT - 8}px`,
        }}
        onPointerDown={(e) => onPointerDownMove(e, cut)}
        role="button"
        tabIndex={0}
        aria-label={`${cut.title ?? `Clip ${index + 1}`}: ${fmt(cut.start_seconds)} to ${fmt(cut.end_seconds)}`}
      >
        {/* Left resize handle */}
        <div
          className="absolute left-0 top-0 h-full cursor-w-resize bg-primary-400/40 hover:bg-primary-500/60 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ width: `${HANDLE_WIDTH_PX}px` }}
          onPointerDown={(e) => { e.stopPropagation(); onPointerDownLeft(e, cut) }}
          aria-hidden="true"
        >
          <div className="w-0.5 h-4 bg-primary-600/60 rounded-full" />
        </div>

        {/* Label */}
        {widthPct * zoom > 3 && (
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center px-2',
              'text-[10px] font-semibold truncate pointer-events-none',
              cut.user_approved ? 'text-success-800' : 'text-primary-800',
            )}
            style={{ paddingLeft: `${HANDLE_WIDTH_PX + 2}px`, paddingRight: `${HANDLE_WIDTH_PX + 2}px` }}
          >
            {cut.title ?? `Clip ${index + 1}`}
          </span>
        )}

        {/* Right resize handle */}
        <div
          className="absolute right-0 top-0 h-full cursor-e-resize bg-primary-400/40 hover:bg-primary-500/60 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ width: `${HANDLE_WIDTH_PX}px` }}
          onPointerDown={(e) => { e.stopPropagation(); onPointerDownRight(e, cut) }}
          aria-hidden="true"
        >
          <div className="w-0.5 h-4 bg-primary-600/60 rounded-full" />
        </div>
      </div>
    </Tooltip>
  )
}

// ------------------------------------------------------------
// Main component
// ------------------------------------------------------------

const CutTimeline: React.FC<CutTimelineProps> = ({
  cuts,
  duration,
  currentTime,
  transcript = [],
  onSeek,
  onCutClick,
  onCutResize,
  onCutMove,
  className,
}) => {
  // ── Refs ────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)  // the scrollable viewport
  const trackAreaRef = useRef<HTMLDivElement>(null)  // the actual track area (zoomed width)

  // ── State ───────────────────────────────────────────────────
  const [zoom,       setZoom]       = useState(1)
  const [widthPx,    setWidthPx]    = useState(800)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [drag,       setDrag]       = useState<DragState>({
    mode: 'none', cutId: null, startX: 0, origStart: 0, origEnd: 0,
  })

  // ── Measure container width ──────────────────────────────────
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setWidthPx(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Derived ──────────────────────────────────────────────────
  const totalWidthPx   = widthPx * zoom
  const playheadPct    = duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0
  const playheadLeftPx = (playheadPct / 100) * totalWidthPx

  // ── Conversions ──────────────────────────────────────────────
  /** client X → time in seconds (accounting for scroll) */
  const xToTime = useCallback((clientX: number): number => {
    const el   = containerRef.current
    if (!el || duration === 0) return 0
    const rect = el.getBoundingClientRect()
    const x    = clientX - rect.left + el.scrollLeft
    return clamp((x / totalWidthPx) * duration, 0, duration)
  }, [duration, totalWidthPx])

  /** delta pixels → delta seconds */
  const pxToSec = useCallback((px: number): number => {
    return (px / totalWidthPx) * duration
  }, [duration, totalWidthPx])

  // ── Zoom ─────────────────────────────────────────────────────
  const adjustZoom = useCallback((delta: number) => {
    setZoom((z) => clamp(z + delta, MIN_ZOOM, MAX_ZOOM))
  }, [])

  // Scroll-wheel to zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      adjustZoom(e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP)
    }
  }, [adjustZoom])

  // ── Track click to seek ──────────────────────────────────────
  const handleTrackClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.mode !== 'none') return
    onSeek?.(xToTime(e.clientX))
  }, [drag.mode, xToTime, onSeek])

  // ── Keyboard ─────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!duration) return
    const step = duration * 0.02
    if (e.key === 'ArrowRight') { e.preventDefault(); onSeek?.(clamp(currentTime + step, 0, duration)) }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); onSeek?.(clamp(currentTime - step, 0, duration)) }
    if (e.key === '+' || e.key === '=') adjustZoom(ZOOM_STEP)
    if (e.key === '-')                  adjustZoom(-ZOOM_STEP)
  }, [duration, currentTime, onSeek, adjustZoom])

  // ── Pointer drag logic ───────────────────────────────────────

  const startDrag = useCallback((
    e: React.PointerEvent,
    mode: DragMode,
    cut?: VideoCut,
  ) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    setDrag({
      mode,
      cutId:     cut?.id ?? null,
      startX:    e.clientX,
      origStart: cut?.start_seconds ?? 0,
      origEnd:   cut?.end_seconds   ?? 0,
    })
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (drag.mode === 'none') return

    const deltaSec = pxToSec(e.clientX - drag.startX)

    if (drag.mode === 'playhead') {
      onSeek?.(xToTime(e.clientX))
      return
    }

    if (!drag.cutId) return
    const cut = cuts.find((c) => c.id === drag.cutId)
    if (!cut) return

    if (drag.mode === 'clip-move') {
      const dur   = drag.origEnd - drag.origStart
      const start = clamp(drag.origStart + deltaSec, 0, duration - dur)
      const end   = start + dur
      onCutMove?.(drag.cutId, start, end)
    }
    if (drag.mode === 'clip-left') {
      const start = clamp(drag.origStart + deltaSec, 0, drag.origEnd - 1)
      onCutResize?.(drag.cutId, start, drag.origEnd)
    }
    if (drag.mode === 'clip-right') {
      const end = clamp(drag.origEnd + deltaSec, drag.origStart + 1, duration)
      onCutResize?.(drag.cutId, drag.origStart, end)
    }
  }, [drag, cuts, duration, pxToSec, xToTime, onSeek, onCutMove, onCutResize])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (drag.mode !== 'none') {
      // If it was a short tap (< 5px delta) on clip-move → treat as click
      if (drag.mode === 'clip-move' && Math.abs(e.clientX - drag.startX) < 5) {
        const cut = cuts.find((c) => c.id === drag.cutId)
        if (cut) {
          onCutClick?.(cut)
          onSeek?.(cut.start_seconds)
        }
      }
      setDrag({ mode: 'none', cutId: null, startX: 0, origStart: 0, origEnd: 0 })
    }
  }, [drag, cuts, onCutClick, onSeek])

  // ── Auto-scroll playhead into view ───────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el || drag.mode !== 'none') return
    const margin    = 60
    const absLeft   = playheadLeftPx
    const viewStart = el.scrollLeft
    const viewEnd   = viewStart + el.clientWidth
    if (absLeft < viewStart + margin) {
      el.scrollLeft = Math.max(0, absLeft - margin)
    } else if (absLeft > viewEnd - margin) {
      el.scrollLeft = absLeft - el.clientWidth + margin
    }
  }, [playheadLeftPx, drag.mode])

  // Sync scrollLeft state when user manually scrolls
  const handleScroll = () => {
    setScrollLeft(containerRef.current?.scrollLeft ?? 0)
  }

  // ── Render ───────────────────────────────────────────────────
  return (
    <div
      className={cn('flex flex-col w-full select-none', className)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Video timeline"
      role="region"
    >

      {/* ── Toolbar: zoom controls + time display ── */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => adjustZoom(-ZOOM_STEP)}
            disabled={zoom <= MIN_ZOOM}
            className="w-6 h-6 rounded flex items-center justify-center text-body-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors"
            aria-label="Zoom out"
          >
            −
          </button>
          <span className="text-caption text-[var(--color-text-tertiary)] w-10 text-center tabular-nums">
            {zoom.toFixed(1)}×
          </span>
          <button
            type="button"
            onClick={() => adjustZoom(ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="w-6 h-6 rounded flex items-center justify-center text-body-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <span className="text-[10px] text-[var(--color-text-tertiary)] ml-2 hidden sm:inline">
            Ctrl+scroll to zoom · ← → to nudge
          </span>
        </div>

        {/* Current time / total */}
        <div className="flex items-center gap-1 tabular-nums">
          <span className="text-caption font-medium text-primary-600">{fmt(currentTime)}</span>
          <span className="text-caption text-[var(--color-text-tertiary)]">/</span>
          <span className="text-caption text-[var(--color-text-tertiary)]">{fmt(duration)}</span>
        </div>
      </div>

      {/* ── Scrollable timeline viewport ── */}
      <div
        ref={containerRef}
        className="relative overflow-x-auto overflow-y-hidden"
        style={{ cursor: drag.mode !== 'none' ? 'grabbing' : undefined }}
        onScroll={handleScroll}
        onWheel={handleWheel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Inner area — has the zoomed width */}
        <div
          ref={trackAreaRef}
          className="relative"
          style={{ width: `${totalWidthPx}px`, minWidth: '100%' }}
        >

          {/* ── RULER ── */}
          <TimelineRuler
            duration={duration}
            zoom={zoom}
            scrollLeft={0}   // ruler translates with the scroll container naturally
            widthPx={widthPx}
          />

          {/* ── TRACKS ── */}
          <div
            className="relative"
            style={{ height: `${TRACK_HEIGHT + (transcript.length > 0 ? TRACK_HEIGHT : 0)}px` }}
            onClick={handleTrackClick}
          >

            {/* Track lane backgrounds */}
            <div
              className="absolute left-0 right-0 top-0 border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]"
              style={{ height: TRACK_HEIGHT }}
              aria-hidden="true"
            />
            {transcript.length > 0 && (
              <div
                className="absolute left-0 right-0 bg-[var(--color-bg-secondary)]"
                style={{ top: TRACK_HEIGHT, height: TRACK_HEIGHT }}
                aria-hidden="true"
              />
            )}

            {/* Track labels (sticky left) */}
            <div
              className="absolute left-0 top-0 z-20 flex flex-col pointer-events-none"
              style={{ transform: `translateX(${scrollLeft}px)` }}
            >
              <div
                className="flex items-center px-2 bg-[var(--color-bg-secondary)] border-r border-[var(--color-border-tertiary)] text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider"
                style={{ height: TRACK_HEIGHT, width: 72 }}
              >
                Cuts
              </div>
              {transcript.length > 0 && (
                <div
                  className="flex items-center px-2 bg-[var(--color-bg-tertiary)] border-r border-t border-[var(--color-border-tertiary)] text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider"
                  style={{ height: TRACK_HEIGHT, width: 72 }}
                >
                  Transcript
                </div>
              )}
            </div>

            {/* ── CUT CLIPS ── */}
            {cuts.map((cut, i) => {
              const leftPct  = duration > 0 ? (cut.start_seconds / duration) * 100 : 0
              const widthPct = duration > 0 ? ((cut.end_seconds - cut.start_seconds) / duration) * 100 : 0
              const isActive = currentTime >= cut.start_seconds && currentTime < cut.end_seconds
              return (
                <ClipSegment
                  key={cut.id}
                  cut={cut}
                  index={i}
                  isActive={isActive}
                  leftPct={leftPct}
                  widthPct={widthPct}
                  zoom={zoom}
                  onPointerDownMove={(e, c) => { startDrag(e, 'clip-move', c) }}
                  onPointerDownLeft={(e, c)  => { startDrag(e, 'clip-left',  c) }}
                  onPointerDownRight={(e, c) => { startDrag(e, 'clip-right', c) }}
                />
              )
            })}

            {/* ── TRANSCRIPT SEGMENTS (read-only thin chips) ── */}
            {transcript.length > 0 && transcript.map((seg) => {
              const leftPct  = duration > 0 ? (seg.start_seconds / duration) * 100 : 0
              const widthPct = duration > 0 ? ((seg.end_seconds - seg.start_seconds) / duration) * 100 : 0
              return (
                <button
                  key={seg.id}
                  className="absolute rounded-sm border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:bg-primary-50/50 transition-colors"
                  style={{
                    top:    TRACK_HEIGHT + 4,
                    height: TRACK_HEIGHT - 8,
                    left:   `${leftPct}%`,
                    width:  `${Math.max(widthPct, 0.2)}%`,
                  }}
                  onClick={(e) => { e.stopPropagation(); onSeek?.(seg.start_seconds) }}
                  title={seg.text}
                  aria-label={`Transcript: ${seg.text}`}
                />
              )
            })}

            {/* ── PLAYHEAD ── */}
            <div
              className="absolute top-0 z-30 pointer-events-none"
              style={{ left: `${playheadLeftPct()}%`, bottom: 0 }}
              aria-hidden="true"
            >
              {/* Diamond handle at top */}
              <div
                className="pointer-events-auto cursor-col-resize -ml-2 mt-0"
                onPointerDown={(e) => startDrag(e, 'playhead')}
              >
                <svg width="16" height="12" viewBox="0 0 16 12" className="block">
                  <polygon points="8,0 16,12 0,12" fill="rgb(220 38 38)" />
                </svg>
              </div>
              {/* Vertical line */}
              <div
                className="absolute top-3 -translate-x-1/2 w-0.5 bg-danger-600"
                style={{ height: TRACK_HEIGHT + (transcript.length > 0 ? TRACK_HEIGHT : 0) - 12 }}
              />
            </div>

          </div>{/* /tracks */}

        </div>{/* /inner */}
      </div>{/* /viewport */}

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary-100 border border-primary-200" />
          <span className="text-[10px] text-[var(--color-text-tertiary)]">AI suggested</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-success-100 border border-success-300" />
          <span className="text-[10px] text-[var(--color-text-tertiary)]">Approved</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-3 h-3 rounded-sm bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]" />
          <span className="text-[10px] text-[var(--color-text-tertiary)]">Transcript</span>
        </div>
      </div>

    </div>
  )

  function playheadLeftPct() {
    return duration > 0 ? clamp((currentTime / duration) * 100, 0, 100) : 0
  }
}

CutTimeline.displayName = 'CutTimeline'
export default CutTimeline
