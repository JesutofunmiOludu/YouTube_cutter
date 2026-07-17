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
const ZOOM_STEP       = 0.25
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
  /** Whether the video is currently playing — used for pulse animation (#6) */
  isPlaying?:   boolean
  onSeek?:      (seconds: number) => void
  onCutClick?:  (cut: VideoCut) => void
  /** Called when user drag-resizes a clip edge */
  onCutResize?: (cutId: string, start: number, end: number) => void
  /** Called when user drags a clip to a new position */
  onCutMove?:   (cutId: string, start: number, end: number) => void
  onAddCut?:    (start: number, end: number) => void
  /** Called whenever the user creates, moves, resizes, or clears the
   *  shift-drag highlight range. Lets the parent track the selection. */
  onHighlightedRangeChange?: (range: { start: number; end: number } | null) => void
  className?:   string
}

type DragMode = 'none' | 'playhead' | 'clip-move' | 'clip-left' | 'clip-right' | 'highlight-move' | 'highlight-left' | 'highlight-right'

interface DragState {
  mode:         DragMode
  cutId:        string | null
  startX:       number   // pointer X when drag began (client coords)
  origStart:    number   // clip start_seconds or highlight start at drag begin
  origEnd:      number   // clip end_seconds or highlight end at drag begin
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

// Snap threshold in seconds: playhead snaps if within this distance of a boundary
const SNAP_THRESHOLD_S = 0.5

const CutTimeline: React.FC<CutTimelineProps> = ({
  cuts,
  duration,
  currentTime,
  transcript = [],
  isPlaying = false,
  onSeek,
  onCutClick,
  onCutResize,
  onCutMove,
  onAddCut,
  onHighlightedRangeChange,
  className,
}) => {
  // ── #7/#14: show time label above handle while scrubbing ─────
  const [scrubTime, setScrubTime] = useState<number | null>(null)
  // ── Refs ────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)  // the scrollable viewport
  const trackAreaRef = useRef<HTMLDivElement>(null)  // the actual track area (zoomed width)

  // ── State ───────────────────────────────────────────────────
  const [zoom,       setZoom]       = useState(1)
  const [widthPx,    setWidthPx]    = useState(800)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [highlightedRange, setHighlightedRange] = useState<{ start: number; end: number } | null>(null)
  // Wrapper that syncs internal state AND notifies parent
  const updateHighlightedRange = useCallback(
    (range: { start: number; end: number } | null) => {
      setHighlightedRange(range)
      onHighlightedRangeChange?.(range)
    },
    [onHighlightedRangeChange]
  )
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

  // Reset to fit-all whenever a new video is loaded
  useEffect(() => {
    setZoom(MIN_ZOOM)
  }, [duration])

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

  // ── Track pointer down for Shift+drag range selection ───────
  const handleTrackPointerDown = useCallback((e: React.PointerEvent) => {
    if (drag.mode !== 'none') return
    const clickedTime = xToTime(e.clientX)
    if (e.shiftKey) {
      e.stopPropagation()
      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)
      updateHighlightedRange({ start: clickedTime, end: clickedTime })
      setDrag({
        mode: 'highlight-right',
        cutId: null,
        startX: e.clientX,
        origStart: clickedTime,
        origEnd: clickedTime,
      })
    }
  }, [drag.mode, xToTime])

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

  // ── #9: Snap time to nearest clip boundary within threshold ──
  const snapTime = useCallback((t: number): number => {
    let best = t
    let bestDist = SNAP_THRESHOLD_S
    for (const cut of cuts) {
      const dStart = Math.abs(t - cut.start_seconds)
      const dEnd   = Math.abs(t - cut.end_seconds)
      if (dStart < bestDist) { bestDist = dStart; best = cut.start_seconds }
      if (dEnd   < bestDist) { bestDist = dEnd;   best = cut.end_seconds   }
    }
    return best
  }, [cuts])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (drag.mode === 'none') return

    const deltaSec = pxToSec(e.clientX - drag.startX)

    if (drag.mode === 'playhead') {
      const raw = xToTime(e.clientX)
      const snapped = snapTime(raw)  // #9 snap-to-boundaries
      setScrubTime(snapped)          // #7 keep tooltip time in sync
      onSeek?.(snapped)
      return
    }

    if (drag.mode === 'highlight-move') {
      const dur   = drag.origEnd - drag.origStart
      const start = clamp(drag.origStart + deltaSec, 0, duration - dur)
      const end   = start + dur
      updateHighlightedRange({ start, end })
      return
    }
    if (drag.mode === 'highlight-left') {
      const start = clamp(drag.origStart + deltaSec, 0, drag.origEnd - 0.5)
      updateHighlightedRange({ start, end: drag.origEnd })
      return
    }
    if (drag.mode === 'highlight-right') {
      const end = clamp(drag.origEnd + deltaSec, drag.origStart + 0.5, duration)
      updateHighlightedRange({ start: drag.origStart, end })
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
      setScrubTime(null)  // #7 hide scrub tooltip on release
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

      {/* ── Toolbar: zoom controls + highlight controls + time display ── */}
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
          {/* Fit button — click to reset to full-video view */}
          <button
            type="button"
            onClick={() => setZoom(MIN_ZOOM)}
            title="Reset to fit (1×)"
            className={cn(
              'px-1.5 h-6 rounded text-[10px] font-bold tabular-nums transition-colors',
              zoom === MIN_ZOOM
                ? 'text-[var(--color-text-tertiary)] cursor-default'
                : 'text-primary-600 hover:bg-primary-50 hover:text-primary-700',
            )}
            aria-label="Reset zoom to fit"
          >
            {zoom.toFixed(2).replace(/\.?0+$/, '')}×
          </button>
          <button
            type="button"
            onClick={() => adjustZoom(ZOOM_STEP)}
            disabled={zoom >= MAX_ZOOM}
            className="w-6 h-6 rounded flex items-center justify-center text-body-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] disabled:opacity-30 transition-colors"
            aria-label="Zoom in"
          >
            +
          </button>
          <span className="text-[10px] text-[var(--color-text-tertiary)] ml-2 hidden lg:inline">
            Ctrl+scroll to zoom · Shift+drag to select range
          </span>
        </div>

        {/* Highlight Range Controls */}
        <div className="flex items-center gap-2">
          {highlightedRange ? (
            <div className="flex items-center gap-1.5 bg-indigo-50/80 px-2 py-0.5 rounded border border-indigo-200">
              <span className="text-[11px] font-semibold text-indigo-600 tabular-nums">
                {fmt(highlightedRange.start)} – {fmt(highlightedRange.end)} ({fmt(highlightedRange.end - highlightedRange.start)})
              </span>
              {onAddCut && (
                <button
                  type="button"
                  onClick={() => {
                    onAddCut(highlightedRange.start, highlightedRange.end)
                    updateHighlightedRange(null)
                  }}
                  className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold transition-colors"
                >
                  Create Cut
                </button>
              )}
              <button
                type="button"
                onClick={() => updateHighlightedRange(null)}
                className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-700 px-1"
              >
                Clear
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                const start = Math.max(0, currentTime - 5)
                const end = Math.min(duration, currentTime + 5)
                updateHighlightedRange({ start, end })
              }}
              className="px-2 py-1 rounded border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[11px] font-semibold text-[var(--color-text-secondary)] transition-colors flex items-center gap-1.5"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-indigo-500">
                <path d="M6 3v18M18 3v18M6 12h12" />
              </svg>
              Highlight Time Range
            </button>
          )}
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
            onPointerDown={handleTrackPointerDown}
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




            {/* ── HIGHLIGHTED RANGE OVERLAY ── */}
            {highlightedRange && (
              <div
                className="absolute top-0 z-10 bg-indigo-500/15 border-l border-r border-indigo-500 flex items-center justify-between"
                style={{
                  left: `${(highlightedRange.start / duration) * 100}%`,
                  width: `${((highlightedRange.end - highlightedRange.start) / duration) * 100}%`,
                  height: TRACK_HEIGHT + (transcript.length > 0 ? TRACK_HEIGHT : 0),
                }}
              >
                {/* Left resize handle */}
                <div
                  className="absolute -left-1.5 top-0 w-3 h-full cursor-w-resize z-20 flex items-center justify-center group/hl-left"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    startDrag(e, 'highlight-left')
                    setDrag(d => ({ ...d, origStart: highlightedRange.start, origEnd: highlightedRange.end }))
                  }}
                >
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full border border-white shadow group-hover/hl-left:bg-indigo-700 transition-colors" />
                </div>

                {/* Center drag area */}
                <div
                  className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    startDrag(e, 'highlight-move')
                    setDrag(d => ({ ...d, origStart: highlightedRange.start, origEnd: highlightedRange.end }))
                  }}
                  title="Drag to shift highlighted segment"
                >
                  <span className="text-[9px] font-bold text-indigo-700 pointer-events-none select-none px-1 bg-white/80 rounded border border-indigo-100 shadow-sm truncate max-w-[80%]">
                    {fmt(highlightedRange.end - highlightedRange.start)}
                  </span>
                </div>

                {/* Right resize handle */}
                <div
                  className="absolute -right-1.5 top-0 w-3 h-full cursor-e-resize z-20 flex items-center justify-center group/hl-right"
                  onPointerDown={(e) => {
                    e.stopPropagation()
                    startDrag(e, 'highlight-right')
                    setDrag(d => ({ ...d, origStart: highlightedRange.start, origEnd: highlightedRange.end }))
                  }}
                >
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full border border-white shadow group-hover/hl-right:bg-indigo-700 transition-colors" />
                </div>
              </div>
            )}

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
              {/* #7/#14 — Floating time label above handle */}
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none"
              >
                <span
                  className={cn(
                    'text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded shadow-md',
                    'bg-danger-600 text-white whitespace-nowrap',
                    // #7: always visible while scrubbing; #14: always visible otherwise
                    'opacity-100',
                  )}
                >
                  {fmt(scrubTime ?? currentTime)}
                </span>
              </div>

              {/* #6 — Triangle handle (pulses while playing) */}
              <div
                className="pointer-events-auto cursor-col-resize -ml-2 mt-0"
                onPointerDown={(e) => startDrag(e, 'playhead')}
              >
                <svg
                  width="16"
                  height="12"
                  viewBox="0 0 16 12"
                  className={cn(
                    'block',
                    isPlaying && drag.mode === 'none' && 'animate-pulse',
                  )}
                >
                  <polygon points="8,0 16,12 0,12" fill="rgb(220 38 38)" />
                </svg>
              </div>

              {/* #13 — Vertical line: full-height across ALL tracks dynamically */}
              <div
                className="absolute top-3 -translate-x-1/2 w-0.5 bg-danger-600"
                style={{
                  // RULER_HEIGHT is already excluded (top-3 ≈ 12px);
                  // TRACK_HEIGHT per track row; always spans every row present
                  height: TRACK_HEIGHT * (1 + (transcript.length > 0 ? 1 : 0)) - 12,
                }}
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
