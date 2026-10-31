// ============================================================
// VidMind AI — CanvasEdges Component
// components/canvas/CanvasEdges.tsx
//
// High-performance shared SVG connection rendering engine for 2D canvases:
//   • Supports "bezier", "orthogonal", and "straight" routing
//   • Animated flow indicators & dashoffset transitions
//   • Centered relation label chips
//   • Dynamic connection anchors calculated from node bounding boxes
// ============================================================

import React, { useMemo } from 'react'

export type EdgeRoutingStyle = 'bezier' | 'orthogonal' | 'straight'

export interface CanvasNodeRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasEdgeItem {
  id?: string
  from: string
  to: string
  label?: string
  color?: string
  routing?: EdgeRoutingStyle
  dashed?: boolean
  animated?: boolean
  arrow?: boolean
}

export interface CanvasEdgesProps {
  edges: CanvasEdgeItem[]
  nodePositions: Map<string, CanvasNodeRect> | Record<string, CanvasNodeRect>
  defaultStyle?: EdgeRoutingStyle
  defaultColor?: string
  className?: string
  selectedNodeId?: string | null
  hoveredNodeId?: string | null
}

/** Computes the best border anchor point between two rectangles */
function getAnchorPoints(
  fromRect: CanvasNodeRect,
  toRect: CanvasNodeRect
): { start: { x: number; y: number }; end: { x: number; y: number } } {
  const fromCenter = {
    x: fromRect.x + fromRect.width / 2,
    y: fromRect.y + fromRect.height / 2,
  }
  const toCenter = {
    x: toRect.x + toRect.width / 2,
    y: toRect.y + toRect.height / 2,
  }

  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y

  let startX = fromCenter.x
  let startY = fromCenter.y
  let endX = toCenter.x
  let endY = toCenter.y

  // Horizontal vs vertical dominance
  if (Math.abs(dx) > Math.abs(dy)) {
    // Connect left/right sides
    if (dx > 0) {
      startX = fromRect.x + fromRect.width
      endX = toRect.x
    } else {
      startX = fromRect.x
      endX = toRect.x + toRect.width
    }
    startY = fromCenter.y
    endY = toCenter.y
  } else {
    // Connect top/bottom sides
    if (dy > 0) {
      startY = fromRect.y + fromRect.height
      endY = toRect.y
    } else {
      startY = fromRect.y
      endY = toRect.y + toRect.height
    }
    startX = fromCenter.x
    endX = toCenter.x
  }

  return {
    start: { x: startX, y: startY },
    end: { x: endX, y: endY },
  }
}

/** Generates SVG path string based on routing style */
function generatePathString(
  start: { x: number; y: number },
  end: { x: number; y: number },
  routing: EdgeRoutingStyle
): { path: string; mid: { x: number; y: number } } {
  const dx = end.x - start.x
  const dy = end.y - start.y

  if (routing === 'straight') {
    return {
      path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
      mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
    }
  }

  if (routing === 'orthogonal') {
    // Step routing (midpoint horizontal / vertical step)
    const midX = start.x + dx / 2
    return {
      path: `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`,
      mid: { x: midX, y: (start.y + end.y) / 2 },
    }
  }

  // Default: smooth cubic bezier
  const curvature = 0.5
  const hx = Math.max(Math.abs(dx) * curvature, 40)
  const cp1x = dx > 0 ? start.x + hx : start.x - hx
  const cp1y = start.y
  const cp2x = dx > 0 ? end.x - hx : end.x + hx
  const cp2y = end.y

  return {
    path: `M ${start.x} ${start.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${end.x} ${end.y}`,
    mid: { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 },
  }
}

export const CanvasEdges: React.FC<CanvasEdgesProps> = ({
  edges,
  nodePositions,
  defaultStyle = 'bezier',
  defaultColor = '#64748B',
  className = '',
  selectedNodeId,
  hoveredNodeId,
}) => {
  const rectMap = useMemo(() => {
    if (nodePositions instanceof Map) return nodePositions
    const map = new Map<string, CanvasNodeRect>()
    Object.entries(nodePositions).forEach(([k, v]) => map.set(k, v))
    return map
  }, [nodePositions])

  // Resolve valid edge paths
  const computedEdges = useMemo(() => {
    return edges
      .map((edge, idx) => {
        const fromRect = rectMap.get(edge.from)
        const toRect = rectMap.get(edge.to)
        if (!fromRect || !toRect) return null

        const { start, end } = getAnchorPoints(fromRect, toRect)
        const routing = edge.routing || defaultStyle
        const { path, mid } = generatePathString(start, end, routing)

        const isHighlighted =
          (selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId)) ||
          (hoveredNodeId && (edge.from === hoveredNodeId || edge.to === hoveredNodeId))

        return {
          key: edge.id || `edge-${edge.from}-${edge.to}-${idx}`,
          path,
          mid,
          label: edge.label,
          color: edge.color || defaultColor,
          dashed: edge.dashed ?? false,
          animated: edge.animated ?? false,
          arrow: edge.arrow ?? true,
          isHighlighted,
        }
      })
      .filter(Boolean)
  }, [edges, rectMap, defaultStyle, defaultColor, selectedNodeId, hoveredNodeId])

  if (computedEdges.length === 0) return null

  return (
    <svg
      className={`absolute inset-0 pointer-events-none w-full h-full overflow-visible z-0 ${className}`}
    >
      <defs>
        {/* Default subtle arrow marker */}
        <marker
          id="canvas-edge-arrow"
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M 0 0 L 8 4 L 0 8 Z" fill="currentColor" opacity="0.6" />
        </marker>

        {/* Highlighted active arrow marker */}
        <marker
          id="canvas-edge-arrow-active"
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="#38BDF8" />
        </marker>
      </defs>

      {/* Render Edge Paths */}
      {computedEdges.map((e) => {
        if (!e) return null
        const strokeColor = e.isHighlighted ? '#38BDF8' : e.color
        const strokeWidth = e.isHighlighted ? 2.5 : 1.5
        const opacity = e.isHighlighted ? 0.95 : 0.45

        return (
          <g key={e.key} className="transition-all duration-200">
            {/* Background halo for crisp contrast over canvas patterns */}
            <path
              d={e.path}
              fill="none"
              stroke="#0B0F19"
              strokeWidth={strokeWidth + 2}
              opacity={0.8}
            />

            {/* Main Connector Path */}
            <path
              d={e.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={e.dashed ? '6,4' : undefined}
              opacity={opacity}
              markerEnd={
                e.arrow
                  ? e.isHighlighted
                    ? 'url(#canvas-edge-arrow-active)'
                    : 'url(#canvas-edge-arrow)'
                  : undefined
              }
              className={e.animated ? 'animate-dash-slow' : undefined}
            />

            {/* Edge Label Badge if present */}
            {e.label && (
              <g
                transform={`translate(${e.mid.x}, ${e.mid.y})`}
                className="pointer-events-auto select-none"
              >
                <rect
                  x="-35"
                  y="-10"
                  width="70"
                  height="20"
                  rx="6"
                  fill="#0F172A"
                  stroke={e.isHighlighted ? '#38BDF8' : '#334155'}
                  strokeWidth="1"
                  className="shadow-sm"
                />
                <text
                  x="0"
                  y="3"
                  textAnchor="middle"
                  fill={e.isHighlighted ? '#F8FAFC' : '#94A3B8'}
                  fontSize="10"
                  fontWeight="500"
                  fontFamily="system-ui, sans-serif"
                >
                  {e.label.length > 12 ? `${e.label.slice(0, 11)}…` : e.label}
                </text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default CanvasEdges

