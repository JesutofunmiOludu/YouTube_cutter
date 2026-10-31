// ============================================================
// VidMind AI — CanvasToolbar Component
// components/canvas/CanvasToolbar.tsx
//
// Floating viewport control bar for infinite canvases:
//   • Zoom in/out buttons & zoom percentage display
//   • Recenter / Reset viewport (0 / 100%)
//   • Fullscreen toggle
//   • Keyboard shortcut hints popover
// ============================================================

import React, { useState } from 'react'
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Keyboard,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/utils/cn'

export interface CanvasToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
  isFullscreen: boolean
  onToggleFullscreen: () => void
  className?: string
  showMinimapToggle?: boolean
  isMinimapOpen?: boolean
  onToggleMinimap?: () => void
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  isFullscreen,
  onToggleFullscreen,
  className,
  showMinimapToggle = false,
  isMinimapOpen = false,
  onToggleMinimap,
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false)

  const zoomPercent = Math.round(zoom * 100)

  return (
    <div
      className={cn(
        'relative flex items-center gap-1 p-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/70 shadow-2xl pointer-events-auto select-none',
        className
      )}
    >
      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom Out (– key or scroll down)"
        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Reset Zoom Button */}
      <button
        type="button"
        onClick={onReset}
        title="Reset to 100% (0 key)"
        className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1"
        aria-label="Reset zoom level"
      >
        <RotateCcw className="w-3 h-3 text-slate-400" />
        <span>{zoomPercent}%</span>
      </button>

      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom In (+ key or scroll up)"
        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
        aria-label="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-slate-800 mx-0.5" />

      {/* Fullscreen Toggle */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (F key)' : 'Enter Fullscreen (F key)'}
        className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 text-primary-400" />
        ) : (
          <Maximize2 className="w-4 h-4" />
        )}
      </button>

      {/* Shortcuts popup trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowShortcuts((v) => !v)}
          title="Canvas Keyboard Shortcuts"
          className={cn(
            'p-2 rounded-lg transition-all',
            showShortcuts
              ? 'text-primary-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          )}
          aria-label="Canvas keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {showShortcuts && (
          <div
            className="absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl bg-slate-900 border border-slate-700/80 shadow-2xl text-xs text-slate-200 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150"
            role="dialog"
            aria-label="Keyboard Shortcuts"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-primary-400" />
                Canvas Controls
              </span>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pan Viewport</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                  Drag or Arrows
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Zoom In / Out</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                  Scroll or + / -
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reset View</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                  0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Fullscreen</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                  F
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Pinch to Zoom</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">
                  Trackpad / Touch
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CanvasToolbar

