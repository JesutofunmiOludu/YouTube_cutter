// ============================================================
// VidMind AI — Concept Map Canvas Component (Redesigned)
// components/canvas/formats/ConceptMapCanvas.tsx
//
// Clean semantic system dynamics network matching reference specs:
//   • Crisp pure white canvas with soft background domain cluster cards
//   • Dual color scheme: Periwinkle (#EEF0FF) for core drivers/institutions,
//     Warm coral (#FFF1EE) for metrics/impacts/consequences
//   • Directed orthogonal 90-degree Manhattan routing with clear arrowheads
//   • Semantic edge labels ('sets', 'reduces', 'pushes up', 'can raise')
//   • Top 15 concepts by default; neighbor spotlighting on click (fades rest)
//   • Hover/selection highlights with connected relationship focus
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'
import {
  Network,
  Play,
  ArrowRight,
  Sparkles,
  Link2,
  ChevronRight,
  ChevronDown,
  Layers,
  Maximize2,
  Minimize2,
  Eye,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { CanvasShell } from '../CanvasShell'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeGroup, KnowledgeNode, UserVideo } from '@/types'

export interface ConceptMapCanvasProps {
  payload: KnowledgeFormatPayload
  userVideo: UserVideo
  onSelectNode: (node: KnowledgeNode) => void
  selectedNodeId?: string | null
  className?: string
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

interface OrthogonalEdge {
  id: string
  sourceId: string
  targetId: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  label: string
  pathD: string
  labelX: number
  labelY: number
  textAnchor?: 'start' | 'middle' | 'end'
}

export const ConceptMapCanvas: React.FC<ConceptMapCanvasProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [showAllConcepts, setShowAllConcepts] = useState<boolean>(false)

  const nodes = useMemo(() => payload?.nodes || [], [payload])

  const {
    groups,
    isGrouped,
    isExpanded,
    toggleGroup,
    expandAll,
    collapseAll,
    getNodesForGroup,
    ungroupedNodes,
    availableTypes,
  } = useGroupedNodes(payload, true)

  // Filter check
  const isMatch = useCallback(
    (node: KnowledgeNode) => {
      if (activeTypeFilter !== 'all' && node.node_type !== activeTypeFilter) {
        return false
      }
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        node.title.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q) ||
        node.category?.toLowerCase().includes(q) ||
        node.node_type?.toLowerCase().includes(q) ||
        node.sub_points?.some((p) => p.toLowerCase().includes(q))
      )
    },
    [searchQuery, activeTypeFilter]
  )

  // ── Determine Active Concepts (Top 15 vs All) ──
  const visibleConcepts = useMemo(() => {
    const matched = nodes.filter(isMatch)
    if (showAllConcepts || matched.length <= 16) {
      return matched
    }
    // Sort by importance_score descending, then take top 15
    const sorted = [...matched].sort(
      (a, b) => (b.importance_score ?? 7) - (a.importance_score ?? 7)
    )
    return sorted.slice(0, 15)
  }, [nodes, isMatch, showAllConcepts])

  // ── Orbit Radii for Concept Network ──
  const orbitRadii = useMemo(() => {
    const count = visibleConcepts.length
    if (count <= 6) return { rx: 280, ry: 190 }
    return {
      rx: Math.max(540, count * 50),
      ry: Math.max(360, count * 34),
    }
  }, [visibleConcepts.length])

  // ── Compute Spatial Coordinates for Concepts ──
  const conceptPositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number; isCoral: boolean }>()
    const count = visibleConcepts.length

    if (count === 0) return map

    // If matches the 5-node reference archetype (Central bank, Interest rates, Spending, Inflation, Unemployment)
    if (count <= 6) {
      const fixedSlots = [
        { x: 0, y: -190, isCoral: false },   // Top: Central institution
        { x: -280, y: -20, isCoral: false }, // Left: Policy / Rate
        { x: 0, y: 130, isCoral: false },    // Center/Mid: Spending
        { x: 280, y: -20, isCoral: true },   // Right: Inflation (Metric)
        { x: 0, y: 270, isCoral: true },     // Bottom: Unemployment (Impact)
        { x: 280, y: 240, isCoral: true },   // Extra slot
      ]
      visibleConcepts.forEach((node, idx) => {
        const slot = fixedSlots[idx % fixedSlots.length]
        const isCoral =
          node.node_type === 'stat' ||
          node.node_type === 'warning' ||
          slot.isCoral
        map.set(node.id, { x: slot.x, y: slot.y, isCoral })
      })
      return map
    }

    // Elliptical multi-orbit ring with generous card spacing
    const { rx, ry } = orbitRadii

    visibleConcepts.forEach((node, idx) => {
      const angle = (idx * (2 * Math.PI)) / count - Math.PI / 2
      const x = Math.round(rx * Math.cos(angle))
      const y = Math.round(ry * Math.sin(angle))
      const isCoral =
        node.node_type === 'stat' ||
        node.node_type === 'warning' ||
        idx % 2 === 1
      map.set(node.id, { x, y, isCoral })
    })

    return map
  }, [visibleConcepts, orbitRadii])

  // Dynamic scope toolbar Y-offset ensuring zero collision with uppermost node
  const toolbarTop = useMemo(() => {
    if (visibleConcepts.length <= 6) return -290
    return -(orbitRadii.ry + 80)
  }, [visibleConcepts.length, orbitRadii.ry])

  // ── Compute Orthogonal 90° Manhattan Paths & Edge Labels (Option B: Dynamic Midpoint S-Bends with Lane Offsets) ──
  const orthogonalEdges = useMemo(() => {
    const edges: OrthogonalEdge[] = []
    const cardW = 172
    const cardH = 64
    const halfW = cardW / 2
    const halfH = cardH / 2
    const visibleIds = new Set(visibleConcepts.map((n) => n.id))

    const hasExplicitRelations = visibleConcepts.some(
      (n) => n.relations && n.relations.length > 0
    )

    visibleConcepts.forEach((node, idx) => {
      const srcPos = conceptPositions.get(node.id)
      if (!srcPos) return

      // Use explicit relations if available, or sequential thematic links
      const targets: Array<{ targetId: string; label: string }> = []

      if (node.relations && node.relations.length > 0) {
        node.relations.forEach((rel) => {
          if (visibleIds.has(rel.target_id) && rel.target_id !== node.id) {
            targets.push({ targetId: rel.target_id, label: rel.label })
          }
        })
      }

      // If no valid relations in graph
      if (targets.length === 0) {
        if (!hasExplicitRelations && visibleConcepts.length === 5) {
          // Macroeconomic 5-node reference archetype
          if (idx === 0) targets.push({ targetId: visibleConcepts[1].id, label: 'sets' })
          else if (idx === 1) targets.push({ targetId: visibleConcepts[2].id, label: 'reduces' })
          else if (idx === 2) {
            targets.push({ targetId: visibleConcepts[3].id, label: 'pushes up' })
            targets.push({ targetId: visibleConcepts[4].id, label: 'can raise' })
          }
          else if (idx === 3) targets.push({ targetId: visibleConcepts[0].id, label: 'alerts' })
        } else if (visibleConcepts.length > 1) {
          const nextNode = visibleConcepts[(idx + 1) % visibleConcepts.length]
          const defaultLabels = ['leads to', 'reduces', 'pushes up', 'sets', 'alerts', 'can raise', 'builds upon']
          targets.push({
            targetId: nextNode.id,
            label: defaultLabels[idx % defaultLabels.length],
          })
        }
      }

      targets.forEach(({ targetId, label }, targetIdx) => {
        const tgtPos = conceptPositions.get(targetId)
        if (!tgtPos) return

        const x1 = srcPos.x
        const y1 = srcPos.y
        const x2 = tgtPos.x
        const y2 = tgtPos.y

        const dx = x2 - x1
        const dy = y2 - y1
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)

        // Lane offset for interior cross-center lines so they do not overlap at (0,0)
        const laneOffset = (((idx + targetIdx) % 5) - 2) * 26

        let pathD = ''
        let labelX = 0
        let labelY = 0
        let textAnchor: 'start' | 'middle' | 'end' = 'middle'

        if (absDx <= 25) {
          // Straight vertical relationship (e.g. Spending -> Unemployment)
          const startX = x1
          const startY = y1 + (dy > 0 ? halfH : -halfH)
          const endX = x2
          const endY = y2 + (dy > 0 ? -halfH : halfH)

          pathD = `M ${startX} ${startY} L ${endX} ${endY}`
          labelX = startX + 10
          labelY = (startY + endY) / 2 + 4
          textAnchor = 'start'
        } else if (absDy <= 25) {
          // Straight horizontal relationship
          const startX = x1 + (dx > 0 ? halfW : -halfW)
          const startY = y1
          const endX = x2 + (dx > 0 ? -halfW : halfW)
          const endY = y2

          pathD = `M ${startX} ${startY} L ${endX} ${endY}`
          labelX = (startX + endX) / 2
          labelY = startY - 8
          textAnchor = 'middle'
        } else if (absDx > absDy) {
          // Primarily horizontal: exit left/right, midpoint vertical transition with lane offset, enter left/right
          const startX = x1 + (dx > 0 ? halfW : -halfW)
          const startY = y1
          const endX = x2 + (dx > 0 ? -halfW : halfW)
          const endY = y2
          const midX = (startX + endX) / 2 + (absDx > 320 ? laneOffset : 0)

          pathD = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`

          const seg1Len = Math.abs(midX - startX)
          const seg2Len = Math.abs(endY - startY)
          const seg3Len = Math.abs(endX - midX)

          if (seg2Len > 90) {
            labelX = midX + 8
            labelY = (startY + endY) / 2 + 4
            textAnchor = 'start'
          } else if (seg1Len >= seg3Len && seg1Len > 50) {
            labelX = (startX + midX) / 2
            labelY = startY - 8
            textAnchor = 'middle'
          } else {
            labelX = (midX + endX) / 2
            labelY = endY - 8
            textAnchor = 'middle'
          }
        } else {
          // Primarily vertical: exit top/bottom, midpoint horizontal transition with lane offset, enter top/bottom
          const startX = x1
          const startY = y1 + (dy > 0 ? halfH : -halfH)
          const endX = x2
          const endY = y2 + (dy > 0 ? -halfH : halfH)
          const midY = (startY + endY) / 2 + (absDy > 260 ? laneOffset : 0)

          pathD = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`
          const seg2Len = Math.abs(endX - startX)

          if (seg2Len > 60) {
            labelX = (startX + endX) / 2
            labelY = midY - 8
            textAnchor = 'middle'
          } else {
            labelX = startX + 10
            labelY = (startY + midY) / 2 + 4
            textAnchor = 'start'
          }
        }

        // Only render label if the edge has sufficient visual clearance
        const totalLen = absDx + absDy
        const edgeLabel = totalLen >= 45 ? (label || 'relates to') : ''

        edges.push({
          id: `edge-${node.id}-${targetId}`,
          sourceId: node.id,
          targetId,
          sourceX: x1,
          sourceY: y1,
          targetX: x2,
          targetY: y2,
          label: edgeLabel,
          pathD,
          labelX,
          labelY,
          textAnchor,
        })
      })
    })

    return edges
  }, [visibleConcepts, conceptPositions])

  // ── Neighbor Highlighting Set ──
  const neighborIds = useMemo(() => {
    if (!focusedNodeId) return null
    const set = new Set<string>([focusedNodeId])
    orthogonalEdges.forEach((e) => {
      if (e.sourceId === focusedNodeId) set.add(e.targetId)
      if (e.targetId === focusedNodeId) set.add(e.sourceId)
    })
    return set
  }, [focusedNodeId, orthogonalEdges])

  const handleNodeClick = (node: KnowledgeNode) => {
    onSelectNode(node)
    setFocusedNodeId((prev) => (prev === node.id ? null : node.id))
  }

  // Minimap coordinate list
  const minimapNodes = useMemo(() => {
    const list: Array<{ id: string; x: number; y: number; color?: string }> = []
    visibleConcepts.forEach((node) => {
      const pos = conceptPositions.get(node.id)
      if (pos) {
        list.push({
          id: node.id,
          x: pos.x,
          y: pos.y,
          color: pos.isCoral ? '#F97316' : '#6366F1',
        })
      }
    })
    return list
  }, [visibleConcepts, conceptPositions])

  return (
    <CanvasShell
      formatName="Concept Map"
      formatDescription="Semantic directed graph with orthogonal labeled relations and spotlight focus"
      accentColor="#6366F1"
      accentGlow="rgba(99, 102, 241, 0.2)"
      nodeCount={nodes.length}
      centralTheme={payload.central_theme}
      icon={Network}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      typeFilter={activeTypeFilter}
      onTypeFilterChange={setActiveTypeFilter}
      availableTypes={availableTypes}
      minimapNodes={minimapNodes}
      onBackToOverview={() => setFocusedNodeId(null)}
      className={className}
    >
      {({ flyTo, resetCamera, isFocused }) => {
        const handleCardClick = (node: KnowledgeNode, posX: number, posY: number) => {
          onSelectNode(node)
          if (focusedNodeId === node.id) {
            resetCamera()
            setFocusedNodeId(null)
          } else {
            setFocusedNodeId(node.id)
            flyTo(posX, posY, 1.4)
          }
        }

        return (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
            {/* ── Top Floating Scope Toolbar (Positioned dynamically above orbit) ── */}
            <div
              className="absolute left-0 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 border border-slate-200/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg shadow-slate-900/5 whitespace-nowrap transition-all duration-300"
              style={{ top: toolbarTop }}
            >
              <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <Network className="w-3.5 h-3.5 text-indigo-600" />
                Showing {visibleConcepts.length} of {nodes.length} Concepts
              </span>

              {nodes.length > 15 && (
                <>
                  <div className="w-[1px] h-3 bg-slate-200 mx-1" />
                  <button
                    type="button"
                    onClick={() => setShowAllConcepts((v) => !v)}
                    className="text-[10px] text-slate-600 hover:text-indigo-600 px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 flex items-center gap-1 font-medium transition-colors"
                  >
                    <Eye className="w-3 h-3 text-slate-400" />
                    {showAllConcepts ? 'Show Top 15 Only' : 'Show All Concepts'}
                  </button>
                </>
              )}

              {focusedNodeId && (
                <>
                  <div className="w-[1px] h-3 bg-slate-200 mx-1" />
                  <button
                    type="button"
                    onClick={() => {
                      resetCamera()
                      setFocusedNodeId(null)
                    }}
                    className="text-[10px] text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded hover:bg-indigo-50 flex items-center gap-1 font-medium transition-colors"
                    title="Clear neighbor spotlight"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Focus
                  </button>
                </>
              )}
            </div>

          {/* ── SVG Layer for Directed Orthogonal Manhattan Connections & Labels ── */}
          <svg
            className="pointer-events-none absolute z-0 max-w-none max-h-none"
            style={{
              position: 'absolute',
              left: -2500,
              top: -2500,
              width: 5000,
              height: 5000,
              maxWidth: 'none',
              maxHeight: 'none',
              overflow: 'visible',
            }}
            viewBox="-2500 -2500 5000 5000"
          >
            <defs>
              <marker
                id="concept-arrow"
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 1, 7 3.5, 0 6" fill="#64748B" />
              </marker>
              <marker
                id="concept-arrow-focused"
                markerWidth="7"
                markerHeight="7"
                refX="6"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 1, 7 3.5, 0 6" fill="#4F46E5" />
              </marker>
            </defs>

            {orthogonalEdges.map((edge) => {
              const isSourceFocused = focusedNodeId === edge.sourceId
              const isTargetFocused = focusedNodeId === edge.targetId
              const isEdgeActive = isSourceFocused || isTargetFocused
              const isFaded = focusedNodeId !== null && !isEdgeActive
              const isHovered = hoveredNodeId === edge.sourceId || hoveredNodeId === edge.targetId

              return (
                <g key={edge.id} className="transition-all duration-300">
                  {/* Orthogonal 90° Path Line */}
                  <path
                    d={edge.pathD}
                    fill="none"
                    stroke={isEdgeActive ? '#4F46E5' : isHovered ? '#6366F1' : '#94A3B8'}
                    strokeWidth={isEdgeActive ? 2.5 : isHovered ? 2 : 1.5}
                    strokeOpacity={isFaded ? 0.2 : 0.85}
                    markerEnd={isEdgeActive ? 'url(#concept-arrow-focused)' : 'url(#concept-arrow)'}
                    className="transition-all duration-200"
                  />

                  {/* Semantic Text Label on Segment with white halo */}
                  {edge.label && (
                    <text
                      x={edge.labelX}
                      y={edge.labelY}
                      fill={isEdgeActive ? '#312E81' : '#475569'}
                      fontSize={11}
                      fontWeight={isEdgeActive ? 600 : 500}
                      opacity={isFaded ? 0.25 : 1}
                      textAnchor={edge.textAnchor || 'middle'}
                      stroke="#FFFFFF"
                      strokeWidth={3.5}
                      strokeLinejoin="round"
                      paintOrder="stroke fill"
                      className="select-none pointer-events-none tracking-tight font-sans"
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* ── Render Concept Nodes (Option B: Title + Video Timestamp) ── */}
          {visibleConcepts.map((node) => {
            const pos = conceptPositions.get(node.id)
            if (!pos) return null

            const isSelected = selectedNodeId === node.id
            const isHovered = hoveredNodeId === node.id
            const isFaded = neighborIds !== null && !neighborIds.has(node.id)
            const isFocused = focusedNodeId === node.id

            return (
              <div
                key={`concept-card-${node.id}`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => handleCardClick(node, pos.x, pos.y)}
                className={cn(
                  'absolute z-20 -translate-x-1/2 -translate-y-1/2 w-[172px] min-h-[64px] py-2.5 px-3 rounded-2xl cursor-pointer text-center border shadow-xs transition-all duration-200 select-none flex flex-col items-center justify-center',
                  pos.isCoral
                    ? 'bg-[#FFF1EE] border-[#FECDD3] text-[#9A3412] hover:border-orange-300'
                    : 'bg-[#EEF0FF] border-[#C7D2FE] text-[#312E81] hover:border-indigo-300',
                  isSelected && 'ring-2 ring-indigo-500/30 shadow-md',
                  isFocused && 'scale-105 shadow-md border-indigo-600',
                  isFaded ? 'opacity-25' : 'opacity-100 hover:shadow-md'
                )}
                style={{ left: pos.x, top: pos.y }}
              >
                <div className="text-[12.5px] font-semibold tracking-tight leading-snug line-clamp-2 px-1">
                  {node.title}
                </div>
                <div
                  className={cn(
                    'mt-1 text-[11px] font-mono font-medium flex items-center justify-center gap-1',
                    pos.isCoral ? 'text-[#C2410C]' : 'text-[#4338CA]'
                  )}
                >
                  <span className="opacity-70">⏱</span>
                  <span>{formatTime(node.start_seconds)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )
    }}
    </CanvasShell>
  )
}

export default ConceptMapCanvas
