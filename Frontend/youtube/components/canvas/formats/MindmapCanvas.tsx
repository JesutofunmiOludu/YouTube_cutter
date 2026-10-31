// ============================================================
// VidMind AI — Mindmap Canvas Component
// components/canvas/formats/MindmapCanvas.tsx
//
// Specialized hierarchical mindmap representation. Organizes
// knowledge nodes into organic left-right thematic branches
// radiating from the central thesis with flowing bezier tentacles,
// collapsible sub-ideas, multi-tier group clustering, and
// category color quadrants.
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'
import {
  GitFork,
  Play,
  Clock,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  ExternalLink,
  Layers,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { CanvasShell } from '../CanvasShell'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeGroup, KnowledgeNode, UserVideo } from '@/types'

export interface MindmapCanvasProps {
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

// Branch color palette for organic mindmap variety
const BRANCH_PALETTES = [
  { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', stroke: '#A78BFA', glow: 'rgba(139, 92, 246, 0.45)', tag: 'text-purple-300' },
  { border: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)', stroke: '#F472B6', glow: 'rgba(236, 72, 153, 0.45)', tag: 'text-pink-300' },
  { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', stroke: '#60A5FA', glow: 'rgba(59, 130, 246, 0.45)', tag: 'text-blue-300' },
  { border: '#10B981', bg: 'rgba(16, 185, 129, 0.12)', stroke: '#34D399', glow: 'rgba(16, 185, 129, 0.45)', tag: 'text-emerald-300' },
  { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)', stroke: '#FBBF24', glow: 'rgba(245, 158, 11, 0.45)', tag: 'text-amber-300' },
  { border: '#06B6D4', bg: 'rgba(6, 182, 212, 0.12)', stroke: '#22D3EE', glow: 'rgba(6, 182, 212, 0.45)', tag: 'text-cyan-300' },
]

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)

  const {
    groups,
    isGrouped,
    isExpanded,
    toggleGroup,
    expandAll,
    collapseAll,
    getNodesForGroup,
    ungroupedNodes,
  } = useGroupedNodes(payload, true)

  const nodes = useMemo(() => payload?.nodes || [], [payload])

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

  // ── Hierarchical Grouped Layout Geometry ──
  const hierarchicalLayout = useMemo(() => {
    if (!isGrouped) return null

    // Split groups into right and left lobes
    const half = Math.ceil(groups.length / 2)
    const rightGroups = groups.slice(0, half)
    const leftGroups = groups.slice(half)

    const calculateSide = (
      groupList: KnowledgeGroup[],
      side: 'left' | 'right',
      paletteOffset: number
    ) => {
      const groupDataList: Array<{
        group: KnowledgeGroup
        groupX: number
        groupY: number
        palette: typeof BRANCH_PALETTES[0]
        side: 'left' | 'right'
        isExp: boolean
        children: Array<{
          node: KnowledgeNode
          x: number
          y: number
          palette: typeof BRANCH_PALETTES[0]
        }>
      }> = []

      // Calculate required heights for each group
      const heights = groupList.map((g) => {
        const exp = isExpanded(g.id)
        const cNodes = getNodesForGroup(g.id)
        if (!exp || cNodes.length === 0) return 90
        return Math.max(cNodes.length * 150, 150)
      })

      const totalH = heights.reduce((sum, h) => sum + h, 0) + (groupList.length - 1) * 40
      let currentTop = -totalH / 2

      groupList.forEach((group, idx) => {
        const palette = BRANCH_PALETTES[(idx + paletteOffset) % BRANCH_PALETTES.length]
        const exp = isExpanded(group.id)
        const cNodes = getNodesForGroup(group.id)
        const gH = heights[idx]
        const groupY = currentTop + gH / 2
        currentTop += gH + 40

        const groupX = side === 'right' ? 360 : -360

        // Position child nodes
        const childrenPositions: Array<{
          node: KnowledgeNode
          x: number
          y: number
          palette: typeof BRANCH_PALETTES[0]
        }> = []

        if (exp && cNodes.length > 0) {
          const childSpacing = 150
          const childTotalH = (cNodes.length - 1) * childSpacing
          const childStartY = groupY - childTotalH / 2

          cNodes.forEach((node, cIdx) => {
            const childX = side === 'right' ? 700 : -700
            const childY = childStartY + cIdx * childSpacing
            childrenPositions.push({
              node,
              x: childX,
              y: childY,
              palette,
            })
          })
        }

        groupDataList.push({
          group,
          groupX,
          groupY,
          palette,
          side,
          isExp: exp,
          children: childrenPositions,
        })
      })

      return groupDataList
    }

    const rightSide = calculateSide(rightGroups, 'right', 0)
    const leftSide = calculateSide(leftGroups, 'left', rightGroups.length)

    return [...rightSide, ...leftSide]
  }, [isGrouped, groups, isExpanded, getNodesForGroup])

  // ── Backward Compatible Flat Layout (when !isGrouped) ──
  const flatLayout = useMemo(() => {
    if (isGrouped) return []
    const leftNodes: Array<{ node: KnowledgeNode; index: number; x: number; y: number; palette: typeof BRANCH_PALETTES[0]; side: 'left' }> = []
    const rightNodes: Array<{ node: KnowledgeNode; index: number; x: number; y: number; palette: typeof BRANCH_PALETTES[0]; side: 'right' }> = []

    const half = Math.ceil(nodes.length / 2)
    const rightList = nodes.slice(0, half)
    const leftList = nodes.slice(half)

    const spreadY = 170
    const startYRight = -((rightList.length - 1) * spreadY) / 2
    const startYLeft = -((leftList.length - 1) * spreadY) / 2

    rightList.forEach((node, idx) => {
      const palette = BRANCH_PALETTES[idx % BRANCH_PALETTES.length]
      const curveOffset = Math.sin((idx / Math.max(rightList.length - 1, 1)) * Math.PI) * 50
      rightNodes.push({
        node,
        index: idx,
        x: 420 + curveOffset,
        y: startYRight + idx * spreadY,
        palette,
        side: 'right',
      })
    })

    leftList.forEach((node, idx) => {
      const palette = BRANCH_PALETTES[(idx + half) % BRANCH_PALETTES.length]
      const curveOffset = Math.sin((idx / Math.max(leftList.length - 1, 1)) * Math.PI) * 50
      leftNodes.push({
        node,
        index: half + idx,
        x: -(420 + curveOffset),
        y: startYLeft + idx * spreadY,
        palette,
        side: 'left',
      })
    })

    return [...rightNodes, ...leftNodes]
  }, [isGrouped, nodes])

  // Minimap coordinate nodes
  const minimapNodes = useMemo(() => {
    if (isGrouped && hierarchicalLayout) {
      const list: Array<{ id: string; x: number; y: number; color?: string }> = []
      hierarchicalLayout.forEach(({ group, groupX, groupY, palette, isExp, children }) => {
        list.push({ id: group.id, x: groupX, y: groupY, color: palette.border })
        if (isExp) {
          children.forEach(({ node, x, y }) => {
            list.push({ id: node.id, x, y, color: palette.border })
          })
        }
      })
      return list
    }
    return flatLayout.map(({ node, x, y, palette }) => ({
      id: node.id,
      x,
      y,
      color: palette.border,
    }))
  }, [isGrouped, hierarchicalLayout, flatLayout])

  return (
    <CanvasShell
      formatName="Mindmap"
      formatDescription={
        isGrouped
          ? `Hierarchical organic mindmap with ${groups.length} thematic pillars and ${nodes.length} structured concepts`
          : 'Hierarchical organic thought branches radiating from core insights'
      }
      accentColor="#8B5CF6"
      accentGlow="rgba(139, 92, 246, 0.45)"
      nodeCount={nodes.length}
      centralTheme={payload?.central_theme}
      icon={GitFork}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      minimapNodes={minimapNodes}
      backgroundStyle={{
        backgroundImage: `
          radial-gradient(circle at center, rgba(139, 92, 246, 0.08) 0%, rgba(11, 15, 25, 0.98) 75%),
          radial-gradient(circle, rgba(167, 139, 250, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 32px 32px',
      }}
      className={className}
    >
      {() => (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          {/* ── Global Toolbar Overlay for Groups (when grouped) ── */}
          {isGrouped && (
            <div className="absolute -top-[340px] left-0 -translate-x-1/2 z-30 flex items-center gap-2 bg-slate-900/90 border border-purple-500/30 backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl">
              <span className="text-[11px] font-medium text-purple-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {groups.length} Topic Pillars ({nodes.length} Nodes)
              </span>
              <div className="w-[1px] h-3 bg-slate-700 mx-1" />
              <button
                onClick={expandAll}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 flex items-center gap-1 transition-colors"
                title="Expand All Pillars"
              >
                <Maximize2 className="w-3 h-3" />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 flex items-center gap-1 transition-colors"
                title="Collapse All Pillars"
              >
                <Minimize2 className="w-3 h-3" />
                Collapse All
              </button>
            </div>
          )}

          {/* ── SVG Layer for Organic Tendril Branches ── */}
          <svg
            className="overflow-visible pointer-events-none absolute left-0 top-0"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <filter id="mindmap-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Hierarchical Grouped Splines */}
            {hierarchicalLayout &&
              hierarchicalLayout.map(({ group, groupX, groupY, palette, side, isExp, children }) => {
                const rootX = side === 'right' ? 140 : -140
                const rootY = 0
                const ctrl1X = rootX + (side === 'right' ? 110 : -110)
                const ctrl1Y = rootY + (groupY - rootY) * 0.2
                const ctrl2X = groupX - (side === 'right' ? 90 : -90)
                const ctrl2Y = groupY

                const isGroupHovered = hoveredGroupId === group.id

                return (
                  <g key={`group-arm-${group.id}`}>
                    {/* Primary Core-to-Group Tentacle */}
                    <path
                      d={`M ${rootX} ${rootY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${groupX} ${groupY}`}
                      fill="none"
                      stroke={palette.stroke}
                      strokeWidth={isGroupHovered ? 4 : 2.5}
                      strokeOpacity={isGroupHovered ? 0.9 : 0.6}
                      className="transition-all duration-300"
                    />

                    {/* Secondary Group-to-Child Splines */}
                    {isExp &&
                      children.map(({ node, x: cX, y: cY }) => {
                        const cCtrl1X = groupX + (side === 'right' ? 120 : -120)
                        const cCtrl1Y = groupY
                        const cCtrl2X = cX - (side === 'right' ? 120 : -120)
                        const cCtrl2Y = cY

                        const isChildHovered = hoveredNodeId === node.id
                        const isChildSelected = selectedNodeId === node.id

                        return (
                          <g key={`child-spline-${node.id}`}>
                            <path
                              d={`M ${groupX} ${groupY} C ${cCtrl1X} ${cCtrl1Y}, ${cCtrl2X} ${cCtrl2Y}, ${cX} ${cY}`}
                              fill="none"
                              stroke={palette.stroke}
                              strokeWidth={isChildSelected ? 3.5 : isChildHovered ? 2.5 : 1.5}
                              strokeOpacity={isChildSelected ? 1 : isChildHovered ? 0.8 : 0.35}
                              className="transition-all duration-300"
                            />
                            <circle
                              cx={cX}
                              cy={cY}
                              r={isChildSelected ? 5 : 3}
                              fill={isChildSelected ? '#FFFFFF' : palette.stroke}
                              stroke={palette.border}
                              strokeWidth="1.5"
                            />
                          </g>
                        )
                      })}
                  </g>
                )
              })}

            {/* Flat Layout Splines (Backward Compat) */}
            {!isGrouped &&
              flatLayout.map(({ node, x, y, palette, side }) => {
                const matched = isMatch(node)
                const isHovered = hoveredNodeId === node.id
                const isSelected = selectedNodeId === node.id

                const rootX = side === 'right' ? 120 : -120
                const rootY = 0
                const ctrl1X = rootX + (side === 'right' ? 150 : -150)
                const ctrl1Y = rootY + (y - rootY) * 0.15
                const ctrl2X = x - (side === 'right' ? 140 : -140)
                const ctrl2Y = y

                const strokeWidth = isSelected ? 4 : isHovered ? 3 : 2
                const strokeOpacity = !matched ? 0.08 : isSelected ? 1 : isHovered ? 0.9 : 0.4

                return (
                  <g key={`branch-${node.id}`}>
                    <path
                      d={`M ${rootX} ${rootY} C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${x} ${y}`}
                      fill="none"
                      stroke={palette.stroke}
                      strokeWidth={strokeWidth}
                      strokeOpacity={strokeOpacity}
                      className="transition-all duration-300"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : isHovered ? 5 : 3.5}
                      fill={isSelected ? '#FFFFFF' : palette.stroke}
                      stroke={palette.border}
                      strokeWidth="2"
                    />
                  </g>
                )
              })}
          </svg>

          {/* ── CENTRAL THOUGHT SEED (Core Theme Orb) ── */}
          <div
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 z-20 canvas-interactive-node"
            style={{ width: 280 }}
          >
            <div className="absolute -inset-4 rounded-full blur-2xl opacity-40 bg-purple-600 animate-pulse pointer-events-none" />
            <div className="relative rounded-2xl p-4 bg-slate-900/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
                <GitFork className="w-3 h-3 text-purple-400" />
                Root Knowledge Seed
              </div>
              <h2 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                {payload?.central_theme || userVideo.video?.title || 'Core Mindmap Theme'}
              </h2>
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{userVideo.video?.channel_name || 'VidMind AI'}</span>
                <span className="font-mono text-[10px] text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                  {formatTime(userVideo.video?.duration_seconds || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* ── HIERARCHICAL GROUP NODES & CHILDREN ── */}
          {hierarchicalLayout &&
            hierarchicalLayout.map(
              ({ group, groupX, groupY, palette, side, isExp, children }) => {
                const childNodes = getNodesForGroup(group.id)
                const matchedChildCount = childNodes.filter(isMatch).length

                return (
                  <React.Fragment key={group.id}>
                    {/* ── GROUP HUB NODE CARD ── */}
                    <div
                      onMouseEnter={() => setHoveredGroupId(group.id)}
                      onMouseLeave={() => setHoveredGroupId(null)}
                      onClick={() => toggleGroup(group.id)}
                      className={cn(
                        'absolute canvas-interactive-node cursor-pointer transition-all duration-300 transform-gpu z-20',
                        matchedChildCount === 0 && searchQuery.trim() && 'opacity-25 grayscale'
                      )}
                      style={{
                        left: groupX,
                        top: groupY,
                        transform: 'translate(-50%, -50%)',
                        width: 250,
                      }}
                    >
                      <div
                        className={cn(
                          'relative rounded-xl p-3 backdrop-blur-xl border transition-all duration-300 shadow-xl',
                          'bg-slate-900/90 hover:bg-slate-900/98'
                        )}
                        style={{
                          borderColor: palette.stroke,
                          boxShadow: `0 0 20px -4px ${palette.glow}`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1.5 mb-1.5">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1"
                            style={{ backgroundColor: palette.border }}
                          >
                            <Layers className="w-2.5 h-2.5" />
                            {group.label}
                          </span>
                          <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                            {childNodes.length} ideas
                          </span>
                        </div>

                        {group.summary && (
                          <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mb-2">
                            {group.summary}
                          </p>
                        )}

                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                          <span className="flex items-center gap-1">
                            {isExp ? (
                              <>
                                <ChevronDown className="w-3 h-3 text-purple-400" />
                                <span>Expanded</span>
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-3 h-3 text-slate-400" />
                                <span>Click to unfold</span>
                              </>
                            )}
                          </span>
                          <span className="text-purple-300 font-semibold">
                            {isExp ? 'Collapse' : 'Expand'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── EXPANDED CHILD LEAF CARDS ── */}
                    {isExp &&
                      children.map(({ node, x: cX, y: cY }) => {
                        const matched = isMatch(node)
                        const isHovered = hoveredNodeId === node.id
                        const isSelected = selectedNodeId === node.id

                        return (
                          <div
                            key={node.id}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onClick={() => onSelectNode(node)}
                            className={cn(
                              'absolute canvas-interactive-node cursor-pointer transition-all duration-300 transform-gpu',
                              !matched && 'opacity-20 grayscale pointer-events-none',
                              isSelected && 'scale-105 z-30',
                              !isSelected && isHovered && 'scale-102 z-20',
                              !isSelected && !isHovered && 'z-10'
                            )}
                            style={{
                              left: cX,
                              top: cY,
                              transform: 'translate(-50%, -50%)',
                              width: 250,
                            }}
                          >
                            <div
                              className={cn(
                                'relative rounded-xl p-3 backdrop-blur-xl border transition-all duration-300 shadow-xl',
                                isSelected
                                  ? 'bg-slate-900/95 border-2 ring-4 ring-offset-0'
                                  : 'bg-slate-900/85 border-slate-700/70 hover:border-slate-500 hover:bg-slate-900/95'
                              )}
                              style={{
                                borderColor: isSelected ? palette.stroke : isHovered ? palette.stroke : undefined,
                                boxShadow: isSelected
                                  ? `0 0 25px ${palette.glow}`
                                  : isHovered
                                  ? `0 8px 20px -5px ${palette.glow}`
                                  : undefined,
                              }}
                            >
                              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                                <span className={cn('text-[10px] font-semibold truncate', palette.tag)}>
                                  {node.category || 'Sub-Topic'}
                                </span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                                  <Play className="w-2.5 h-2.5 text-purple-400 fill-purple-400" />
                                  {formatTime(node.start_seconds)}
                                </div>
                              </div>

                              <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1">
                                {node.title}
                              </h3>

                              <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mb-2">
                                {node.summary}
                              </p>

                              {node.sub_points && node.sub_points.length > 0 && (
                                <div className="pt-1.5 border-t border-slate-800/80 space-y-1">
                                  {node.sub_points.slice(0, 2).map((point, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="flex items-start gap-1 p-0.5 rounded bg-slate-950/40 text-[10px] text-slate-300"
                                    >
                                      <Lightbulb className="w-2.5 h-2.5 text-purple-400 shrink-0 mt-0.5" />
                                      <span className="line-clamp-1">{point}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between">
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  Explore
                                  <ChevronRight className="w-3 h-3 text-slate-500" />
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectNode(node)
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1 transition-opacity"
                                  style={{ backgroundColor: palette.border }}
                                >
                                  <Play className="w-2.5 h-2.5 fill-white" />
                                  Focus
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </React.Fragment>
                )
              })}

          {/* ── FLAT FALLBACK BRANCH CARDS (when !isGrouped) ── */}
          {!isGrouped &&
            flatLayout.map(({ node, index, x, y, palette }) => {
              const matched = isMatch(node)
              const isHovered = hoveredNodeId === node.id
              const isSelected = selectedNodeId === node.id

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => onSelectNode(node)}
                  className={cn(
                    'absolute canvas-interactive-node cursor-pointer transition-all duration-300 transform-gpu',
                    !matched && 'opacity-20 grayscale pointer-events-none',
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
                        ? 'bg-slate-900/95 border-2 shadow-2xl ring-4 ring-offset-0'
                        : 'bg-slate-900/85 border-slate-700/70 hover:border-slate-500 hover:bg-slate-900/95'
                    )}
                    style={{
                      borderColor: isSelected ? palette.stroke : isHovered ? palette.stroke : undefined,
                      boxShadow: isSelected
                        ? `0 0 25px ${palette.glow}`
                        : isHovered
                        ? `0 8px 20px -5px ${palette.glow}`
                        : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ backgroundColor: palette.border }}
                        >
                          {index + 1}
                        </span>
                        <span className={cn('text-[10px] font-semibold uppercase tracking-wider truncate', palette.tag)}>
                          {node.category || `Branch ${index + 1}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                        <Play className="w-2.5 h-2.5 text-purple-400 fill-purple-400" />
                        {formatTime(node.start_seconds)}
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1.5">
                      {node.title}
                    </h3>

                    <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mb-2.5">
                      {node.summary}
                    </p>

                    {node.sub_points && node.sub_points.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1">
                        {node.sub_points.map((point, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-start gap-1.5 p-1 rounded bg-slate-950/40 text-[10px] text-slate-300"
                          >
                            <Lightbulb className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        Explore Segment
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNode(node)
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold text-white flex items-center gap-1 transition-opacity"
                        style={{ backgroundColor: palette.border }}
                      >
                        <Play className="w-2.5 h-2.5 fill-white" />
                        Focus
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

export default MindmapCanvas
