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
  theme?: 'light' | 'dark'
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
  theme = 'light',
}) => {
  const [showShortcuts, setShowShortcuts] = useState(false)
  const isLight = theme === 'light'
  const zoomPercent = Math.round(zoom * 100)

  return (
    <div
      className={cn(
        'relative flex items-center gap-1 p-1.5 rounded-xl backdrop-blur-md shadow-xl pointer-events-auto select-none transition-colors duration-200',
        isLight
          ? 'bg-white/95 border border-slate-200/90 text-slate-700 shadow-slate-900/10'
          : 'bg-slate-900/90 border border-slate-700/70 text-slate-200 shadow-2xl',
        className
      )}
    >
      {/* Zoom Out */}
      <button
        type="button"
        onClick={onZoomOut}
        title="Zoom Out (– key or scroll down)"
        className={cn(
          'p-2 rounded-lg active:scale-95 transition-all',
          isLight
            ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        )}
        aria-label="Zoom Out"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      {/* Reset Zoom Button */}
      <button
        type="button"
        onClick={onReset}
        title="Reset to 100% (0 key)"
        className={cn(
          'px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium active:scale-95 transition-all flex items-center gap-1',
          isLight
            ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        )}
        aria-label="Reset zoom level"
      >
        <RotateCcw className={cn('w-3 h-3', isLight ? 'text-slate-400' : 'text-slate-400')} />
        <span>{zoomPercent}%</span>
      </button>

      {/* Zoom In */}
      <button
        type="button"
        onClick={onZoomIn}
        title="Zoom In (+ key or scroll up)"
        className={cn(
          'p-2 rounded-lg active:scale-95 transition-all',
          isLight
            ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        )}
        aria-label="Zoom In"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className={cn('h-4 w-px mx-0.5', isLight ? 'bg-slate-200' : 'bg-slate-800')} />

      {/* Fullscreen Toggle */}
      <button
        type="button"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (F key)' : 'Enter Fullscreen (F key)'}
        className={cn(
          'p-2 rounded-lg active:scale-95 transition-all',
          isLight
            ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        )}
        aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
      >
        {isFullscreen ? (
          <Minimize2 className="w-4 h-4 text-indigo-600 dark:text-primary-400" />
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
              ? isLight
                ? 'text-indigo-600 bg-slate-100'
                : 'text-primary-400 bg-slate-800'
              : isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
          )}
          aria-label="Canvas keyboard shortcuts"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {showShortcuts && (
          <div
            className={cn(
              'absolute bottom-full right-0 mb-2 w-64 p-3 rounded-xl shadow-2xl text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150',
              isLight
                ? 'bg-white border border-slate-200 text-slate-700 shadow-slate-900/10'
                : 'bg-slate-900 border border-slate-700/80 text-slate-200'
            )}
            role="dialog"
            aria-label="Keyboard Shortcuts"
          >
            <div className={cn('flex items-center justify-between pb-2 mb-2 border-b', isLight ? 'border-slate-100' : 'border-slate-800')}>
              <span className={cn('font-semibold flex items-center gap-1.5', isLight ? 'text-slate-900' : 'text-white')}>
                <Keyboard className="w-3.5 h-3.5 text-indigo-500 dark:text-primary-400" />
                Canvas Controls
              </span>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className={cn('text-[10px] transition-colors', isLight ? 'text-slate-400 hover:text-slate-900' : 'text-slate-400 hover:text-white')}
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Pan Viewport</span>
                <span className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-300')}>
                  Drag or Arrows
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Zoom In / Out</span>
                <span className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-300')}>
                  Scroll or + / -
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Reset View</span>
                <span className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-300')}>
                  0
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Fullscreen</span>
                <span className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-300')}>
                  F
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Pinch to Zoom</span>
                <span className={cn('px-1.5 py-0.5 rounded font-mono text-[10px]', isLight ? 'bg-slate-100 border border-slate-200 text-slate-700' : 'bg-slate-800 border border-slate-700 text-slate-300')}>
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

