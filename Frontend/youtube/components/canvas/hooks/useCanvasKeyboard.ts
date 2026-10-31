// ============================================================
// VidMind AI — useCanvasKeyboard Hook
// components/canvas/hooks/useCanvasKeyboard.ts
//
// Shared keyboard navigation hook for the infinite canvas:
//   • + / = : Zoom in
//   • - / _ : Zoom out
//   • 0     : Reset zoom & pan to 100%
//   • F     : Toggle fullscreen
//   • Arrow keys (with modifier or plain): Pan canvas
// ============================================================

import { useEffect, useCallback } from 'react'

export interface UseCanvasKeyboardOptions {
  enabled?: boolean
  onZoomIn?: () => void
  onZoomOut?: () => void
  onResetView?: () => void
  onToggleFullscreen?: () => void
  onPanBy?: (dx: number, dy: number) => void
  onEscape?: () => void
}

export function useCanvasKeyboard({
  enabled = true,
  onZoomIn,
  onZoomOut,
  onResetView,
  onToggleFullscreen,
  onPanBy,
  onEscape,
}: UseCanvasKeyboardOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return

      // Ignore keystrokes when typing in input, textarea, or contentEditable
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape' && onEscape) {
          onEscape()
        }
        return
      }

      const PAN_STEP = 50

      switch (e.key) {
        case '+':
        case '=':
          e.preventDefault()
          onZoomIn?.()
          break
        case '-':
        case '_':
          e.preventDefault()
          onZoomOut?.()
          break
        case '0':
          e.preventDefault()
          onResetView?.()
          break
        case 'f':
        case 'F':
          // Only trigger if not Cmd/Ctrl
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault()
            onToggleFullscreen?.()
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          onPanBy?.(0, PAN_STEP)
          break
        case 'ArrowDown':
          e.preventDefault()
          onPanBy?.(0, -PAN_STEP)
          break
        case 'ArrowLeft':
          e.preventDefault()
          onPanBy?.(PAN_STEP, 0)
          break
        case 'ArrowRight':
          e.preventDefault()
          onPanBy?.(-PAN_STEP, 0)
          break
        case 'Escape':
          e.preventDefault()
          onEscape?.()
          break
      }
    },
    [
      enabled,
      onZoomIn,
      onZoomOut,
      onResetView,
      onToggleFullscreen,
      onPanBy,
      onEscape,
    ]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export default useCanvasKeyboard

