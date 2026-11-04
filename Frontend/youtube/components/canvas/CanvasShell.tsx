// ============================================================
// VidMind AI — CanvasShell Component
// components/canvas/CanvasShell.tsx
//
// Enhanced shared interactive viewport for infinite 2D node canvases
// (Mindmap, Blueprint, Concept Map):
//   • Mouse dragging (pan) & touch gesture support (pinch-to-zoom)
//   • Cursor-centered mouse wheel zoom
//   • Shared keyboard navigation (+ / - / 0 / F / arrows) via useCanvasKeyboard
//   • Extracted CanvasToolbar with shortcut guide
//   • Top-left format header and search filtering
// ============================================================

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import { cn } from '@/utils/cn'
import { CanvasToolbar } from './CanvasToolbar'
import { CanvasMinimap, type MinimapNode } from './CanvasMinimap'
import { useCanvasKeyboard } from './hooks/useCanvasKeyboard'

export interface CanvasShellProps {
  formatName: string
  formatDescription?: string
  accentColor: string
  accentGlow: string
  nodeCount: number
  centralTheme?: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  searchQuery: string
  onSearchChange: (query: string) => void
  backgroundStyle?: React.CSSProperties
  backgroundClassName?: string
  minimapNodes?: MinimapNode[]
  typeFilter?: string
  onTypeFilterChange?: (filter: string) => void
  availableTypes?: string[]
  theme?: 'light' | 'dark'
  onBackToOverview?: () => void
  children: (state: {
    pan: { x: number; y: number }
    zoom: number
    searchQuery: string
    typeFilter?: string
    flyTo: (targetX: number, targetY: number, targetZoom?: number) => void
    resetCamera: () => void
    isFocused: boolean
    isFlying: boolean
  }) => React.ReactNode
  className?: string
  initialZoom?: number
}

const MIN_ZOOM = 0.3
const MAX_ZOOM = 2.6

export const CanvasShell: React.FC<CanvasShellProps> = ({
  formatName,
  formatDescription,
  accentColor,
  accentGlow,
  nodeCount,
  centralTheme,
  icon: Icon,
  searchQuery,
  onSearchChange,
  backgroundStyle,
  backgroundClassName,
  minimapNodes,
  typeFilter = 'all',
  onTypeFilterChange,
  availableTypes = [],
  theme = 'light',
  onBackToOverview,
  children,
  className,
  initialZoom = 0.95,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isLight = theme === 'light'

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(initialZoom)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMinimapOpen, setIsMinimapOpen] = useState(true)

  // Camera Flight State
  const [isFlying, setIsFlying] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const flightTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up flight timer
  useEffect(() => {
    return () => {
      if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    }
  }, [])

  // Smooth camera flight
  const flyTo = useCallback((targetX: number, targetY: number, targetZoom: number = 1.35) => {
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(true)
    setIsFocused(true)
    // Target position is centered in world
    setPan({ x: -targetX * targetZoom, y: -targetY * targetZoom })
    setZoom(targetZoom)
    flightTimerRef.current = setTimeout(() => {
      setIsFlying(false)
    }, 560)
  }, [])

  // Reset to overview
  const resetCamera = useCallback(() => {
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(true)
    setIsFocused(false)
    setPan({ x: 0, y: 0 })
    setZoom(initialZoom)
    onBackToOverview?.()
    flightTimerRef.current = setTimeout(() => {
      setIsFlying(false)
    }, 560)
  }, [initialZoom, onBackToOverview])

  // Multi-touch tracking for pinch-zoom
  const touchDistRef = useRef<number | null>(null)

  // Pan to target coordinate
  const handlePanTo = useCallback((x: number, y: number) => {
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(false)
    setPan({ x, y })
  }, [])

  // Zoom helpers
  const handleZoomIn = useCallback(() => {
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(false)
    setZoom((z) => Math.min(z * 1.2, MAX_ZOOM))
  }, [])

  const handleZoomOut = useCallback(() => {
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(false)
    setZoom((z) => Math.max(z * 0.8, MIN_ZOOM))
  }, [])

  const handleReset = useCallback(() => {
    resetCamera()
  }, [resetCamera])

  const handlePanBy = useCallback((dx: number, dy: number) => {
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }))
  }, [])

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen?.().catch(() => {})
      setIsFullscreen(false)
    }
  }, [])

  // Listen for native fullscreen change events (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // Keyboard navigation
  useCanvasKeyboard({
    enabled: true,
    onZoomIn: handleZoomIn,
    onZoomOut: handleZoomOut,
    onResetView: handleReset,
    onToggleFullscreen: toggleFullscreen,
    onPanBy: handlePanBy,
    onEscape: () => {
      if (searchQuery) onSearchChange('')
    },
  })

  // Mouse pan handling
  const handleMouseDown = (e: React.MouseEvent) => {
    // Avoid dragging when clicking inside interactive nodes, inputs, or controls
    if (
      (e.target as HTMLElement).closest(
        '.canvas-interactive-node, button, input, textarea, a, select'
      )
    ) {
      return
    }
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(false)
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Cursor-centered Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!containerRef.current) return
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(false)

    const rect = containerRef.current.getBoundingClientRect()
    // Pointer offset from container center
    const mouseX = e.clientX - rect.left - rect.width / 2
    const mouseY = e.clientY - rect.top - rect.height / 2

    const zoomFactor = e.deltaY < 0 ? 1.09 : 0.91
    const nextZoom = Math.min(Math.max(zoom * zoomFactor, MIN_ZOOM), MAX_ZOOM)

    if (nextZoom === zoom) return

    // Adjust pan so zoom focuses on cursor position
    const ratio = nextZoom / zoom
    const newPanX = mouseX - (mouseX - pan.x) * ratio
    const newPanY = mouseY - (mouseY - pan.y) * ratio

    setZoom(nextZoom)
    setPan({ x: newPanX, y: newPanY })
  }

  // Touch gesture handling: 1 finger pan, 2 finger pinch-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (flightTimerRef.current) clearTimeout(flightTimerRef.current)
    setIsFlying(false)
    if (e.touches.length === 1) {
      const t = e.touches[0]
      if (
        (e.target as HTMLElement).closest(
          '.canvas-interactive-node, button, input, textarea, a'
        )
      ) {
        return
      }
      setIsDragging(true)
      setDragStart({ x: t.clientX - pan.x, y: t.clientY - pan.y })
    } else if (e.touches.length === 2) {
      setIsDragging(false)
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      touchDistRef.current = Math.hypot(dx, dy)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      const t = e.touches[0]
      setPan({
        x: t.clientX - dragStart.x,
        y: t.clientY - dragStart.y,
      })
    } else if (e.touches.length === 2 && touchDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const newDist = Math.hypot(dx, dy)
      const factor = newDist / touchDistRef.current

      if (factor > 0.6 && factor < 1.6) {
        setZoom((prev) => Math.min(Math.max(prev * factor, MIN_ZOOM), MAX_ZOOM))
      }
      touchDistRef.current = newDist
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    touchDistRef.current = null
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        'relative w-full h-full overflow-hidden select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        backgroundClassName || (isLight ? 'bg-[#FBFBFD]' : 'bg-[#0B0F19]'),
        className
      )}
      style={{
        ...(isLight && !backgroundStyle?.backgroundImage
          ? {
              backgroundImage: 'radial-gradient(circle, #E2E8F0 1.2px, transparent 1.2px)',
              backgroundSize: '24px 24px',
            }
          : {}),
        ...backgroundStyle,
      }}
    >
      {/* ── Top Left Floating Header & Filter Bar ── */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-2 max-w-sm sm:max-w-md pointer-events-auto">
        <div
          className={cn(
            'flex items-center gap-3 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-xl transition-colors',
            isLight
              ? 'bg-white/95 border border-slate-200/90 text-slate-800 shadow-slate-900/5'
              : 'bg-slate-900/85 border border-slate-700/60 text-slate-100 shadow-2xl'
          )}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${accentColor}25` }}
          >
            <Icon className="w-4 h-4" style={{ color: accentColor }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-xs font-semibold', isLight ? 'text-slate-900' : 'text-slate-100')}>
                {formatName} Canvas
              </span>
              <span
                className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded font-mono font-medium border',
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                )}
              >
                {nodeCount} nodes
              </span>
            </div>
            <p className={cn('text-[11px] truncate', isLight ? 'text-slate-500' : 'text-slate-400')}>
              {centralTheme || formatDescription}
            </p>
          </div>
        </div>

        {/* Search filter in canvas */}
        <div className="relative">
          <Search className={cn('w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none', isLight ? 'text-slate-400' : 'text-slate-400')} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={`Filter ${formatName.toLowerCase()} concepts... (Esc to clear)`}
            className={cn(
              'w-full pl-8 pr-3 py-1.5 rounded-lg backdrop-blur-md text-xs transition-all shadow-md focus:outline-none focus:ring-1 focus:ring-indigo-500',
              isLight
                ? 'bg-white/90 border border-slate-200/90 text-slate-800 placeholder-slate-400 shadow-slate-900/5'
                : 'bg-slate-900/80 border border-slate-700/60 text-slate-200 placeholder-slate-500'
            )}
          />
        </div>

        {/* Node Type Filter Chips (when available) */}
        {availableTypes.length > 0 && onTypeFilterChange && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => onTypeFilterChange('all')}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-all whitespace-nowrap font-medium',
                typeFilter === 'all'
                  ? isLight
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                    : 'bg-indigo-900/60 border-indigo-500 text-indigo-200'
                  : isLight
                    ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                    : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-slate-800'
              )}
            >
              All Types
            </button>
            {availableTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => onTypeFilterChange(type)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border capitalize transition-all whitespace-nowrap font-medium',
                  typeFilter === type
                    ? isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-indigo-900/60 border-indigo-500 text-indigo-200'
                    : isLight
                      ? 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                      : 'bg-slate-900/80 border-slate-700 text-slate-400 hover:bg-slate-800'
                )}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Top Floating Back to Overview Button ── */}
      {isFocused && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-30 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
          <button
            type="button"
            onClick={resetCamera}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs shadow-xl backdrop-blur-md transition-all active:scale-95 border',
              isLight
                ? 'bg-white/95 border-slate-200/90 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-slate-900/10'
                : 'bg-slate-900/90 border-slate-700/80 text-white hover:bg-slate-800'
            )}
          >
            <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Back to Overview</span>
          </button>
        </div>
      )}

      {/* ── Bottom Left Minimap Overview ── */}
      {minimapNodes && minimapNodes.length > 0 && (
        <CanvasMinimap
          nodes={minimapNodes}
          pan={pan}
          zoom={zoom}
          onPanTo={handlePanTo}
          isOpen={isMinimapOpen}
          onToggle={() => setIsMinimapOpen((v) => !v)}
          theme={theme}
        />
      )}

      {/* ── Bottom Right Floating Controls (Zoom / Recenter / Fullscreen / Shortcuts) ── */}
      <div className="absolute bottom-5 right-5 z-20">
        <CanvasToolbar
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onReset={handleReset}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          showMinimapToggle={Boolean(minimapNodes && minimapNodes.length > 0)}
          isMinimapOpen={isMinimapOpen}
          onToggleMinimap={() => setIsMinimapOpen((v) => !v)}
          theme={theme}
        />
      </div>

      {/* ── Infinite World Surface ── */}
      <div
        className={cn(
          'w-full h-full relative transform-gpu',
          isFlying
            ? 'transition-transform duration-[550ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)]'
            : 'transition-transform ease-out duration-75'
        )}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        {children({ pan, zoom, searchQuery, typeFilter, flyTo, resetCamera, isFocused, isFlying })}
      </div>
    </div>
  )
}

export default CanvasShell
