// ============================================================
// VidMind AI — CanvasMinimap Component
// components/canvas/CanvasMinimap.tsx
//
// Inset bird's eye overview panel for large 2D infinite canvases:
//   • Miniaturized node dots matching their canvas coordinates
//   • Current viewport viewport frame reflecting user pan & zoom
//   • Click or drag on minimap to jump pan instantly
//   • Collapsible toggle to preserve screen space
// ============================================================

import React, { useRef, useMemo } from 'react'
import { MapPin, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface MinimapNode {
  id: string
  x: number
  y: number
  color?: string
}

export interface CanvasMinimapProps {
  nodes: MinimapNode[]
  pan: { x: number; y: number }
  zoom: number
  onPanTo: (x: number, y: number) => void
  isOpen?: boolean
  onToggle?: () => void
  className?: string
  width?: number
  height?: number
  theme?: 'light' | 'dark'
}

export const CanvasMinimap: React.FC<CanvasMinimapProps> = ({
  nodes,
  pan,
  zoom,
  onPanTo,
  isOpen = true,
  onToggle,
  className,
  width = 160,
  height = 110,
  theme = 'light',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isLight = theme === 'light'

  // Calculate coordinate boundaries of all nodes
  const bounds = useMemo(() => {
    if (nodes.length === 0) {
      return { minX: -600, maxX: 600, minY: -400, maxY: 400 }
    }
    const xs = nodes.map((n) => n.x)
    const ys = nodes.map((n) => n.y)
    const minX = Math.min(...xs, -300) - 100
    const maxX = Math.max(...xs, 300) + 100
    const minY = Math.min(...ys, -200) - 100
    const maxY = Math.max(...ys, 200) + 100
    return { minX, maxX, minY, maxY }
  }, [nodes])

  const worldWidth = Math.max(bounds.maxX - bounds.minX, 200)
  const worldHeight = Math.max(bounds.maxY - bounds.minY, 150)

  // Map world coordinate (x, y) to minimap pixel space
  const toMinimapCoords = (x: number, y: number) => {
    const normX = (x - bounds.minX) / worldWidth
    const normY = (y - bounds.minY) / worldHeight
    return {
      mx: Math.max(4, Math.min(normX * width, width - 4)),
      my: Math.max(4, Math.min(normY * height, height - 4)),
    }
  }

  // Handle clicking on minimap to jump pan
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    const normX = clickX / width
    const normY = clickY / height

    const worldX = bounds.minX + normX * worldWidth
    const worldY = bounds.minY + normY * worldHeight

    // Pan canvas so that (worldX, worldY) centers in viewport
    onPanTo(-worldX, -worldY)
  }

  // Compute viewport indicator rectangle in minimap
  // Canvas viewport center in world is (-pan.x, -pan.y)
  const vpCenter = toMinimapCoords(-pan.x, -pan.y)
  const vpW = Math.max(16, (width / zoom) * 0.22)
  const vpH = Math.max(12, (height / zoom) * 0.22)

  return (
    <div
      className={cn(
        'absolute bottom-5 left-5 z-20 flex flex-col items-start pointer-events-auto select-none transition-all',
        className
      )}
    >
      {/* Minimap Card Header */}
      <div className="flex items-center justify-between w-full mb-1">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-lg backdrop-blur-md text-[10px] font-semibold transition-colors shadow-md',
            isLight
              ? 'bg-white/95 border border-slate-200/90 text-slate-700 hover:text-slate-950'
              : 'bg-slate-900/85 border border-slate-700/60 text-slate-300 hover:text-white'
          )}
        >
          <MapPin className={cn('w-3 h-3', isLight ? 'text-indigo-600' : 'text-primary-400')} />
          <span>Minimap</span>
          {onToggle && (
            isOpen ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronUp className="w-3 h-3 text-slate-400" />
          )}
        </button>
      </div>

      {/* Minimap Surface */}
      {isOpen && (
        <div
          ref={containerRef}
          onClick={handleClick}
          style={{ width, height }}
          className={cn(
            'relative rounded-xl overflow-hidden backdrop-blur-md shadow-2xl cursor-crosshair transition-colors',
            isLight
              ? 'bg-slate-50/95 border border-slate-200/90 shadow-slate-900/10'
              : 'bg-slate-950/90 border border-slate-700/70'
          )}
          title="Click to jump canvas position"
        >
          {/* Subtle grid texture */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #64748B 1px, transparent 1px)',
              backgroundSize: '12px 12px',
            }}
          />

          {/* Central seed marker */}
          <div
            className="absolute w-2 h-2 rounded-full bg-indigo-500 shadow-xs -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${toMinimapCoords(0, 0).mx}px`,
              top: `${toMinimapCoords(0, 0).my}px`,
            }}
          />

          {/* Node dots */}
          {nodes.map((n) => {
            const { mx, my } = toMinimapCoords(n.x, n.y)
            return (
              <div
                key={n.id}
                className="absolute w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{
                  left: `${mx}px`,
                  top: `${my}px`,
                  backgroundColor: n.color || (isLight ? '#4F46E5' : '#38BDF8'),
                  boxShadow: isLight ? '0 0 2px rgba(79, 70, 229, 0.4)' : '0 0 3px rgba(56, 189, 248, 0.5)',
                }}
              />
            )
          })}

          {/* Current Viewport Frame */}
          <div
            className={cn(
              'absolute rounded-xs -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75',
              isLight
                ? 'border border-indigo-600 bg-indigo-500/15'
                : 'border border-primary-400 bg-primary-500/15'
            )}
            style={{
              left: `${vpCenter.mx}px`,
              top: `${vpCenter.my}px`,
              width: `${vpW}px`,
              height: `${vpH}px`,
              boxShadow: isLight ? '0 0 4px rgba(79, 70, 229, 0.3)' : '0 0 6px rgba(56, 189, 248, 0.4)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default CanvasMinimap

