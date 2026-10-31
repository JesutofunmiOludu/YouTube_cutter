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
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

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
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-[10px] font-semibold text-slate-300 hover:text-white transition-colors shadow-lg"
        >
          <MapPin className="w-3 h-3 text-primary-400" />
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
          className="relative rounded-xl overflow-hidden bg-slate-950/90 backdrop-blur-md border border-slate-700/70 shadow-2xl cursor-crosshair"
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
            className="absolute w-2 h-2 rounded-full bg-purple-500 shadow-xs -translate-x-1/2 -translate-y-1/2 pointer-events-none"
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
                  backgroundColor: n.color || '#38BDF8',
                  boxShadow: '0 0 3px rgba(56, 189, 248, 0.5)',
                }}
              />
            )
          })}

          {/* Current Viewport Frame */}
          <div
            className="absolute border border-primary-400 bg-primary-500/15 rounded-xs -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75"
            style={{
              left: `${vpCenter.mx}px`,
              top: `${vpCenter.my}px`,
              width: `${vpW}px`,
              height: `${vpH}px`,
              boxShadow: '0 0 6px rgba(56, 189, 248, 0.4)',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default CanvasMinimap

