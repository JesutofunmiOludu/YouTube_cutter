// ============================================================
// VidMind AI — Concept Map Canvas Component
// components/canvas/formats/ConceptMapCanvas.tsx
//
// Specialized semantic knowledge constellation. Renders entities
// in a cluster graph with directed relational vectors (leads to,
// contradicts, proves, builds upon) and hierarchical domain
// clusters with bounding zones and interactive path focusing.
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
  Radio,
  Layers,
  Maximize2,
  Minimize2,
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

export const ConceptMapCanvas: React.FC<ConceptMapCanvasProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredClusterId, setHoveredClusterId] = useState<string | null>(null)

  const {
    groups,
    isGrouped,
    isExpanded,
    toggleGroup,
    expandAll,
    collapseAll,
    getNodesForGroup,
  } = useGroupedNodes(payload, true)

  const nodes = useMemo(() => payload?.nodes || [], [payload])

  // ── Hierarchical Domain Clusters Layout ──
  const clusterLayout = useMemo(() => {
    if (!isGrouped) return null

    const G = Math.max(groups.length, 1)
    const clusterDist = G <= 3 ? 460 : G <= 5 ? 540 : 640

    const clusterData: Array<{
      group: KnowledgeGroup
      cx: number
      cy: number
      isExp: boolean
      childNodes: KnowledgeNode[]
      nodePositions: Array<{
        node: KnowledgeNode
        x: number
        y: number
      }>
      bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number }
    }> = []

    groups.forEach((group, gIdx) => {
      const gAngle = (gIdx * (2 * Math.PI)) / G - Math.PI / 2
      const cx = Math.round(clusterDist * Math.cos(gAngle))
      const cy = Math.round((clusterDist * 0.72) * Math.sin(gAngle))

      const exp = isExpanded(group.id)
      const cNodes = getNodesForGroup(group.id)

      const nodePositions: Array<{ node: KnowledgeNode; x: number; y: number }> = []

      if (exp && cNodes.length > 0) {
        const innerRadius = cNodes.length <= 3 ? 150 : cNodes.length <= 6 ? 190 : 230
        cNodes.forEach((node, cIdx) => {
          const cAngle = (cIdx * (2 * Math.PI)) / cNodes.length - Math.PI / 2
          const x = Math.round(cx + innerRadius * Math.cos(cAngle))
          const y = Math.round(cy + (innerRadius * 0.8) * Math.sin(cAngle))
          nodePositions.push({ node, x, y })
        })
      }

      // Compute bounding box around cluster for backdrop tint
      let minX = cx - 140
      let maxX = cx + 140
      let minY = cy - 70
      let maxY = cy + 70

      if (exp && nodePositions.length > 0) {
        const xs = nodePositions.map((p) => p.x)
        const ys = nodePositions.map((p) => p.y)
        minX = Math.min(...xs) - 150
        maxX = Math.max(...xs) + 150
        minY = Math.min(...ys) - 100
        maxY = Math.max(...ys) + 100
      }

      clusterData.push({
        group,
        cx,
        cy,
        isExp: exp,
        childNodes: cNodes,
        nodePositions,
        bounds: {
          minX,
          minY,
          maxX,
          maxY,
          width: maxX - minX,
          height: maxY - minY,
        },
      })
    })

    return clusterData
  }, [isGrouped, groups, isExpanded, getNodesForGroup])

  // ── Backward Compatible Flat Constellation Layout (when !isGrouped) ──
  const flatLayout = useMemo(() => {
    if (isGrouped) return []
    const count = Math.max(nodes.length, 1)
    const baseRadius = count <= 5 ? 360 : count <= 8 ? 440 : 500

    return nodes.map((node, index) => {
      const angle = index * ((2 * Math.PI) / count) - Math.PI / 2
      const radialWobble = (index % 2 === 0 ? 1 : 0.85) * baseRadius
      const x = Math.round(radialWobble * Math.cos(angle))
      const y = Math.round((radialWobble * 0.75) * Math.sin(angle))
      return { node, index, x, y }
    })
  }, [isGrouped, nodes])

  // Coordinates lookup for relation vectors
  const coordsMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    const relatedSetMap = new Map<string, Set<string>>()

    if (isGrouped && clusterLayout) {
      clusterLayout.forEach((cl) => {
        if (!cl.isExp) {
          // If cluster is collapsed, map its child nodes to the cluster center
          cl.childNodes.forEach((n) => {
            map.set(n.id, { x: cl.cx, y: cl.cy })
          })
        } else {
          cl.nodePositions.forEach((item) => {
            map.set(item.node.id, { x: item.x, y: item.y })
          })
        }
      })
    } else {
      flatLayout.forEach((item) => {
        map.set(item.node.id, { x: item.x, y: item.y })
      })
    }

    nodes.forEach((node) => {
      relatedSetMap.set(node.id, new Set<string>())
    })

    nodes.forEach((node) => {
      if (node.relations) {
        node.relations.forEach((rel) => {
          relatedSetMap.get(node.id)?.add(rel.target_id)
          relatedSetMap.get(rel.target_id)?.add(node.id)
        })
      }
    })

    return { map, relatedSetMap }
  }, [isGrouped, clusterLayout, flatLayout, nodes])

  // Connected nodes for the active/hovered entity
  const activeFocusId = hoveredNodeId || selectedNodeId
  const connectedNodesSet = useMemo(() => {
    if (!activeFocusId) return null
    const set = new Set<string>([activeFocusId])
    const related = coordsMap.relatedSetMap.get(activeFocusId)
    if (related) {
      related.forEach((id) => set.add(id))
    }
    return set
  }, [activeFocusId, coordsMap])

  // Filter check
  const isMatch = useCallback(
    (node: KnowledgeNode) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        node.title.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q) ||
        node.category?.toLowerCase().includes(q) ||
        node.sub_points?.some((p) => p.toLowerCase().includes(q))
      )
    },
    [searchQuery]
  )

  // Minimap coordinate nodes
  const minimapNodes = useMemo(() => {
    if (isGrouped && clusterLayout) {
      const list: Array<{ id: string; x: number; y: number; color?: string }> = []
      clusterLayout.forEach((cl) => {
        list.push({ id: cl.group.id, x: cl.cx, y: cl.cy, color: '#10B981' })
        if (cl.isExp) {
          cl.nodePositions.forEach((item) => {
            list.push({ id: item.node.id, x: item.x, y: item.y, color: '#34D399' })
          })
        }
      })
      return list
    }
    return flatLayout.map((item) => ({
      id: item.node.id,
      x: item.x,
      y: item.y,
      color: '#10B981',
    }))
  }, [isGrouped, clusterLayout, flatLayout])

  return (
    <CanvasShell
      formatName="Concept Map"
      formatDescription={
        isGrouped
          ? `Semantic knowledge constellation with ${groups.length} domain clusters and ${nodes.length} entities`
          : 'Semantic knowledge constellation with directed relational vectors'
      }
      accentColor="#10B981"
      accentGlow="rgba(16, 185, 129, 0.45)"
      nodeCount={nodes.length}
      centralTheme={payload?.central_theme}
      icon={Network}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      minimapNodes={minimapNodes}
      backgroundStyle={{
        backgroundColor: '#071614',
        backgroundImage: `
          radial-gradient(circle at center, rgba(16, 185, 129, 0.12) 0%, rgba(7, 22, 20, 0.98) 75%),
          radial-gradient(circle, rgba(52, 211, 153, 0.08) 1.5px, transparent 1.5px)
        `,
        backgroundSize: '100% 100%, 36px 36px',
      }}
      className={className}
    >
      {() => (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          {/* ── Global Toolbar Overlay for Clusters ── */}
          {isGrouped && (
            <div className="absolute -top-[390px] left-0 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#071614]/95 border border-emerald-500/40 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-2xl">
              <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                {groups.length} Domain Clusters ({nodes.length} Entities)
              </span>
              <div className="w-[1px] h-3 bg-emerald-800/60 mx-1" />
              <button
                onClick={expandAll}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/40 flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/40 flex items-center gap-1 transition-colors"
              >
                <Minimize2 className="w-3 h-3" />
                Collapse All
              </button>
            </div>
          )}

          {/* ── HIERARCHICAL DOMAIN CLUSTER BOUNDING BACKDROPS ── */}
          {clusterLayout &&
            clusterLayout.map(({ group, isExp, bounds, childNodes }) => {
              if (!isExp) return null
              const isClHovered = hoveredClusterId === group.id

              return (
                <div
                  key={`cluster-backdrop-${group.id}`}
                  onMouseEnter={() => setHoveredClusterId(group.id)}
                  onMouseLeave={() => setHoveredClusterId(null)}
                  className="absolute pointer-events-none rounded-3xl transition-all duration-500"
                  style={{
                    left: bounds.minX,
                    top: bounds.minY,
                    width: bounds.width,
                    height: bounds.height,
                    backgroundColor: isClHovered
                      ? 'rgba(16, 185, 129, 0.08)'
                      : 'rgba(16, 185, 129, 0.04)',
                    border: '1.5px dashed rgba(16, 185, 129, 0.28)',
                    boxShadow: isClHovered ? '0 0 40px rgba(16, 185, 129, 0.15)' : undefined,
                  }}
                >
                  <div className="absolute -top-3.5 left-6 px-3 py-0.5 rounded-full bg-[#062822] border border-emerald-500/40 text-[10px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    DOMAIN: {group.label} ({childNodes.length})
                  </div>
                </div>
              )
            })}

          {/* ── SVG Layer for Semantic Directional Relation Vectors ── */}
          <svg
            className="overflow-visible pointer-events-none absolute left-0 top-0"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <filter id="concept-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <marker
                id="concept-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10B981" />
              </marker>

              <marker
                id="concept-arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 9 5 L 0 9 z" fill="#34D399" />
              </marker>
            </defs>

            {/* Render Semantic Directed Inter-Node Vectors */}
            {nodes.map((node) => {
              if (!node.relations || node.relations.length === 0) return null
              const srcPos = coordsMap.map.get(node.id)
              if (!srcPos) return null

              return node.relations.map((rel, rIdx) => {
                const target = coordsMap.map.get(rel.target_id)
                if (!target) return null

                // Don't draw loop line if both collapsed to same point
                if (srcPos.x === target.x && srcPos.y === target.y) return null

                const isPathActive =
                  activeFocusId &&
                  (activeFocusId === node.id || activeFocusId === rel.target_id)

                const midX = (srcPos.x + target.x) / 2
                const midY = (srcPos.y + target.y) / 2
                const cpX = midX + (srcPos.y - target.y) * 0.18
                const cpY = midY + (target.x - srcPos.x) * 0.18

                const opacity = activeFocusId
                  ? isPathActive
                    ? 1
                    : 0.1
                  : 0.4

                return (
                  <g key={`rel-${node.id}-${rel.target_id}-${rIdx}`}>
                    {isPathActive && (
                      <path
                        d={`M ${srcPos.x} ${srcPos.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="5"
                        strokeOpacity="0.45"
                        filter="url(#concept-glow)"
                      />
                    )}
                    <path
                      d={`M ${srcPos.x} ${srcPos.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`}
                      fill="none"
                      stroke={isPathActive ? '#34D399' : '#10B981'}
                      strokeWidth={isPathActive ? 2.5 : 1.5}
                      strokeOpacity={opacity}
                      strokeDasharray={isPathActive ? undefined : '5 4'}
                      markerEnd={isPathActive ? 'url(#concept-arrow-active)' : 'url(#concept-arrow)'}
                      className="transition-all duration-300"
                    />

                    {rel.label && (
                      <g className="transition-opacity duration-300" style={{ opacity }}>
                        <rect
                          x={cpX - (rel.label.length * 3.5 + 8)}
                          y={cpY - 9}
                          width={rel.label.length * 7 + 16}
                          height="18"
                          rx="9"
                          fill="#062822"
                          stroke={isPathActive ? '#34D399' : '#10B981'}
                          strokeWidth="1"
                          strokeOpacity={isPathActive ? '0.9' : '0.5'}
                        />
                        <text
                          x={cpX}
                          y={cpY + 3.5}
                          fill={isPathActive ? '#A7F3D0' : '#6EE7B7'}
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="middle"
                          className="select-none uppercase tracking-wide font-mono"
                        >
                          {rel.label}
                        </text>
                      </g>
                    )}
                  </g>
                )
              })
            })}
          </svg>

          {/* ── CENTRAL ONTOLOGY CORE ── */}
          <div
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 z-20 canvas-interactive-node"
            style={{ width: 260 }}
          >
            <div className="absolute -inset-4 rounded-full blur-2xl opacity-40 bg-emerald-600 animate-pulse pointer-events-none" />
            <div className="relative rounded-2xl p-4 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                <Network className="w-3 h-3 text-emerald-400" />
                Knowledge Graph Core
              </div>
              <h2 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                {payload?.central_theme || userVideo.video?.title || 'Core Ontology'}
              </h2>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{userVideo.video?.channel_name || 'VidMind AI'}</span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  {nodes.length} Entities
                </span>
              </div>
            </div>
          </div>

          {/* ── HIERARCHICAL CLUSTER ORBS & EXPANDED ENTITIES ── */}
          {clusterLayout &&
            clusterLayout.map(({ group, cx, cy, isExp, childNodes, nodePositions }) => {
              return (
                <React.Fragment key={group.id}>
                  {/* Collapsed Cluster Orb */}
                  {!isExp && (
                    <div
                      onClick={() => toggleGroup(group.id)}
                      className="absolute canvas-interactive-node cursor-pointer z-20 transition-all duration-300 transform-gpu hover:scale-105"
                      style={{
                        left: cx,
                        top: cy,
                        transform: 'translate(-50%, -50%)',
                        width: 220,
                      }}
                    >
                      <div className="relative rounded-2xl p-3.5 bg-[#062822]/95 border-2 border-emerald-500/60 shadow-2xl backdrop-blur-xl text-center hover:border-emerald-400">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase mb-1.5">
                          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                          {group.label}
                        </div>
                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2">
                          {group.summary || 'Cluster of interconnected concepts'}
                        </p>
                        <div className="pt-2 border-t border-emerald-800/40 flex items-center justify-between text-[10px] text-emerald-400">
                          <span>{childNodes.length} Entities</span>
                          <span className="font-semibold flex items-center gap-0.5">
                            Unfold
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Expanded Cluster Entities */}
                  {isExp &&
                    nodePositions.map(({ node, x, y }) => {
                      const matched = isMatch(node)
                      const isHovered = hoveredNodeId === node.id
                      const isSelected = selectedNodeId === node.id

                      const isConnected =
                        connectedNodesSet === null || connectedNodesSet.has(node.id)

                      return (
                        <div
                          key={node.id}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => onSelectNode(node)}
                          className={cn(
                            'absolute canvas-interactive-node cursor-pointer transition-all duration-300 transform-gpu',
                            !matched && 'opacity-20 grayscale pointer-events-none',
                            activeFocusId && !isConnected && 'opacity-25 blur-[0.5px]',
                            isSelected && 'scale-105 z-30',
                            !isSelected && isHovered && 'scale-102 z-20',
                            !isSelected && !isHovered && 'z-10'
                          )}
                          style={{
                            left: x,
                            top: y,
                            transform: 'translate(-50%, -50%)',
                            width: 260,
                          }}
                        >
                          <div
                            className={cn(
                              'relative rounded-xl p-3.5 backdrop-blur-xl border transition-all duration-300 shadow-xl',
                              isSelected
                                ? 'bg-slate-900/95 border-2 border-emerald-400 shadow-emerald-500/30 shadow-2xl ring-4 ring-emerald-500/20'
                                : isHovered
                                ? 'bg-slate-900/90 border-emerald-400 shadow-emerald-500/20 shadow-lg'
                                : 'bg-slate-900/80 border-slate-700/80 hover:border-emerald-500/60'
                            )}
                          >
                            <div className="flex items-center justify-between text-[10px] mb-2 pb-1.5 border-b border-slate-800">
                              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                <Radio className="w-3 h-3 text-emerald-400" />
                                {node.category || 'Entity'}
                              </span>
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px]">
                                <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                                {formatTime(node.start_seconds)}
                              </div>
                            </div>

                            <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1.5">
                              {node.title}
                            </h3>

                            <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mb-2">
                              {node.summary}
                            </p>

                            {node.relations && node.relations.length > 0 && (
                              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                                {node.relations.map((rel, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                                  >
                                    <Link2 className="w-2.5 h-2.5 text-emerald-400" />
                                    {rel.label}
                                  </span>
                                ))}
                              </div>
                            )}

                            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                Connect
                                <ChevronRight className="w-3 h-3 text-slate-500" />
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onSelectNode(node)
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1 transition-colors"
                              >
                                <Play className="w-2.5 h-2.5 fill-white" />
                                View
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </React.Fragment>
              )
            })}

          {/* ── FLAT FALLBACK ENTITIES (when !isGrouped) ── */}
          {!isGrouped &&
            flatLayout.map(({ node, x, y }) => {
              const matched = isMatch(node)
              const isHovered = hoveredNodeId === node.id
              const isSelected = selectedNodeId === node.id

              const isConnected =
                connectedNodesSet === null || connectedNodesSet.has(node.id)

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => onSelectNode(node)}
                  className={cn(
                    'absolute canvas-interactive-node cursor-pointer transition-all duration-300 transform-gpu',
                    !matched && 'opacity-20 grayscale pointer-events-none',
                    activeFocusId && !isConnected && 'opacity-25 blur-[0.5px]',
                    isSelected && 'scale-105 z-30',
                    !isSelected && isHovered && 'scale-102 z-20',
                    !isSelected && !isHovered && 'z-10'
                  )}
                  style={{
                    left: x,
                    top: y,
                    transform: 'translate(-50%, -50%)',
                    width: 270,
                  }}
                >
                  <div
                    className={cn(
                      'relative rounded-xl p-3.5 backdrop-blur-xl border transition-all duration-300 shadow-xl',
                      isSelected
                        ? 'bg-slate-900/95 border-2 border-emerald-400 shadow-emerald-500/30 shadow-2xl ring-4 ring-emerald-500/20'
                        : isHovered
                        ? 'bg-slate-900/90 border-emerald-400 shadow-emerald-500/20 shadow-lg'
                        : 'bg-slate-900/80 border-slate-700/80 hover:border-emerald-500/60'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-2 pb-1.5 border-b border-slate-800">
                      <span className="font-semibold text-emerald-400 flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-400" />
                        {node.category || 'Entity'}
                      </span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px]">
                        <Play className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400" />
                        {formatTime(node.start_seconds)}
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1.5">
                      {node.title}
                    </h3>

                    <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mb-2">
                      {node.summary}
                    </p>

                    {node.relations && node.relations.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                        {node.relations.map((rel, rIdx) => (
                          <span
                            key={rIdx}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-800/50"
                          >
                            <Link2 className="w-2.5 h-2.5 text-emerald-400" />
                            {rel.label}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        Connect
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNode(node)
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-white" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </CanvasShell>
  )
}

export default ConceptMapCanvas
