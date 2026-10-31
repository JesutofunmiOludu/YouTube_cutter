// ============================================================
// VidMind AI — Blueprint Canvas Component
// components/canvas/formats/BlueprintCanvas.tsx
//
// Specialized architectural schematic layout. Renders an
// engineering blueprint pipeline with cyan drafting grid,
// orthogonal 90-degree circuit traces (Manhattan routing),
// module I/O ports, monospace technical specs, sequential
// execution bus, and hierarchical stage grouping.
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'
import {
  Cpu,
  Play,
  Terminal,
  Activity,
  ArrowRight,
  Layers,
  ChevronRight,
  ChevronDown,
  Workflow,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { CanvasShell } from '../CanvasShell'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeGroup, KnowledgeNode, UserVideo } from '@/types'

export interface BlueprintCanvasProps {
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

export const BlueprintCanvas: React.FC<BlueprintCanvasProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null)

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

  // ── Hierarchical Grouped Layout (Stages as stacked horizontal rows) ──
  const stageLayout = useMemo(() => {
    if (!isGrouped) return null

    let currentY = 0
    const stages: Array<{
      group: KnowledgeGroup
      index: number
      stageY: number
      stageHeight: number
      stageWidth: number
      isExp: boolean
      nodeItems: Array<{
        node: KnowledgeNode
        relX: number
        relY: number
        absX: number
        absY: number
      }>
    }> = []

    const stageWidth = 1100

    groups.forEach((group, gIdx) => {
      const exp = isExpanded(group.id)
      const cNodes = getNodesForGroup(group.id)

      const colSpacing = 320
      const colsPerRow = 3
      const numRows = Math.ceil(Math.max(cNodes.length, 1) / colsPerRow)
      const stageHeight = !exp ? 72 : 80 + numRows * 200

      const stageY = currentY
      currentY += stageHeight + 60

      const nodeItems: Array<{
        node: KnowledgeNode
        relX: number
        relY: number
        absX: number
        absY: number
      }> = []

      if (exp) {
        cNodes.forEach((node, nIdx) => {
          const row = Math.floor(nIdx / colsPerRow)
          const colInRow = nIdx % colsPerRow
          const itemsInThisRow = Math.min(colsPerRow, cNodes.length - row * colsPerRow)
          const rowStartX = -((itemsInThisRow - 1) * colSpacing) / 2

          const relX = rowStartX + colInRow * colSpacing
          const relY = 55 + row * 195
          nodeItems.push({
            node,
            relX,
            relY,
            absX: relX,
            absY: stageY + relY,
          })
        })
      }

      stages.push({
        group,
        index: gIdx,
        stageY,
        stageHeight,
        stageWidth,
        isExp: exp,
        nodeItems,
      })
    })

    // Center entire assembly vertically around 0
    const totalHeight = currentY - 60
    const offsetY = -totalHeight / 2

    return stages.map((stg) => ({
      ...stg,
      stageY: stg.stageY + offsetY,
      nodeItems: stg.nodeItems.map((n) => ({
        ...n,
        absY: n.absY + offsetY,
      })),
    }))
  }, [isGrouped, groups, isExpanded, getNodesForGroup])

  // ── Backward Compatible Flat Layout (when !isGrouped) ──
  const flatLayout = useMemo(() => {
    if (isGrouped) return []
    const cols = nodes.length <= 4 ? nodes.length : Math.ceil(nodes.length / 2)
    const colSpacing = 360
    const rowSpacing = 280
    const startX = -((cols - 1) * colSpacing) / 2

    return nodes.map((node, index) => {
      const row = index < cols ? 0 : 1
      const col = index < cols ? index : index - cols
      const x = startX + col * colSpacing
      const y = row === 0 ? -rowSpacing / 2 : rowSpacing / 2

      return {
        node,
        index,
        x,
        y,
        row,
        col,
      }
    })
  }, [isGrouped, nodes])

  // Minimap coordinate nodes
  const minimapNodes = useMemo(() => {
    if (isGrouped && stageLayout) {
      const list: Array<{ id: string; x: number; y: number; color?: string }> = []
      stageLayout.forEach((st) => {
        list.push({ id: st.group.id, x: 0, y: st.stageY, color: '#0EA5E9' })
        st.nodeItems.forEach((item) => {
          list.push({ id: item.node.id, x: item.absX, y: item.absY, color: '#38BDF8' })
        })
      })
      return list
    }
    return flatLayout.map((item) => ({
      id: item.node.id,
      x: item.x,
      y: item.y,
      color: '#0EA5E9',
    }))
  }, [isGrouped, stageLayout, flatLayout])

  return (
    <CanvasShell
      formatName="Blueprint"
      formatDescription={
        isGrouped
          ? `Technical architectural schematic with ${groups.length} execution stages and ${nodes.length} module blocks`
          : 'Technical architectural schematic with orthogonal execution pipeline'
      }
      accentColor="#0EA5E9"
      accentGlow="rgba(14, 165, 233, 0.45)"
      nodeCount={nodes.length}
      centralTheme={payload?.central_theme}
      icon={Cpu}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      minimapNodes={minimapNodes}
      backgroundStyle={{
        backgroundColor: '#06101E',
        backgroundImage: `
          linear-gradient(to right, rgba(14, 165, 233, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(14, 165, 233, 0.08) 1px, transparent 1px),
          linear-gradient(to right, rgba(14, 165, 233, 0.02) 20px, transparent 20px),
          linear-gradient(to bottom, rgba(14, 165, 233, 0.02) 20px, transparent 20px)
        `,
        backgroundSize: '40px 40px, 40px 40px, 200px 200px, 200px 200px',
      }}
      className={className}
    >
      {() => (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 font-mono">
          {/* ── Background Blueprint Annotations ── */}
          <div className="absolute -left-[550px] -top-[450px] pointer-events-none select-none text-[10px] text-sky-500/30 flex flex-col gap-1">
            <span className="font-bold tracking-widest">// ARCH_SPEC: {userVideo.id.slice(0, 8)}</span>
            <span>GRID_RESOLUTION: 40px // BUS_ROUTING: ORTHOGONAL_MANHATTAN</span>
            <span>TOTAL_STAGES: {isGrouped ? groups.length : nodes.length} UNITS // BUS_CLK: 60Hz</span>
          </div>

          <div className="absolute right-[350px] -top-[450px] pointer-events-none select-none text-[10px] text-sky-500/30 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-sky-400/40 animate-pulse" />
            <span>PIPELINE_STATUS: PASS_100% [READY]</span>
          </div>

          {/* ── Global Toolbar Overlay for Stages ── */}
          {isGrouped && (
            <div className="absolute -top-[410px] left-0 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#06101E]/95 border border-sky-500/40 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-2xl">
              <span className="text-[11px] font-semibold text-sky-300 flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5 text-sky-400" />
                {groups.length} Execution Stages ({nodes.length} Modules)
              </span>
              <div className="w-[1px] h-3 bg-slate-700 mx-1" />
              <button
                onClick={expandAll}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-800/40 flex items-center gap-1 transition-colors"
              >
                <Maximize2 className="w-3 h-3" />
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="text-[10px] text-slate-300 hover:text-white px-2 py-0.5 rounded bg-sky-950/60 hover:bg-sky-900 border border-sky-800/40 flex items-center gap-1 transition-colors"
              >
                <Minimize2 className="w-3 h-3" />
                Collapse All
              </button>
            </div>
          )}

          {/* ── SVG Layer for 90-Degree Orthogonal Circuit Wires ── */}
          <svg
            className="overflow-visible pointer-events-none absolute left-0 top-0"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              <filter id="blueprint-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              <marker
                id="blueprint-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38BDF8" />
              </marker>
            </defs>

            {/* Hierarchical: Manhattan Buses Connecting Stages Vertically */}
            {stageLayout &&
              stageLayout.map((stg, sIdx) => {
                if (sIdx >= stageLayout.length - 1) return null
                const nextStg = stageLayout[sIdx + 1]

                const x1 = 0
                const y1 = stg.stageY + stg.stageHeight
                const x2 = 0
                const y2 = nextStg.stageY

                return (
                  <g key={`stage-bus-${stg.group.id}-${nextStg.group.id}`}>
                    <path
                      d={`M ${x1} ${y1} L ${x2} ${y2}`}
                      fill="none"
                      stroke="#0EA5E9"
                      strokeWidth="2.5"
                      strokeOpacity="0.7"
                      strokeDasharray="6 4"
                      markerEnd="url(#blueprint-arrow)"
                    />
                    <circle cx={x1} cy={y1} r="3.5" fill="#38BDF8" />
                    <circle cx={x2} cy={y2} r="3.5" fill="#38BDF8" />
                  </g>
                )
              })}

            {/* Flat Layout Manhattan Connectors (when !isGrouped) */}
            {!isGrouped &&
              flatLayout.map((item, idx) => {
                if (idx >= flatLayout.length - 1) return null
                const nextItem = flatLayout[idx + 1]

                const x1 = item.x + 145
                const y1 = item.y
                const x2 = nextItem.x - 145
                const y2 = nextItem.y

                const isSameRow = item.row === nextItem.row

                let pathD = ''
                if (isSameRow) {
                  pathD = `M ${x1} ${y1} L ${x2} ${y2}`
                } else {
                  const midX = x1 + 35
                  const midY = (y1 + y2) / 2
                  pathD = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${midY} L ${x2 - 35} ${midY} L ${x2 - 35} ${y2} L ${x2} ${y2}`
                }

                const isHighlighted =
                  hoveredNodeId === item.node.id || hoveredNodeId === nextItem.node.id

                return (
                  <g key={`pipe-${item.node.id}-${nextItem.node.id}`}>
                    {isHighlighted && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#0EA5E9"
                        strokeWidth="5"
                        strokeOpacity="0.5"
                        filter="url(#blueprint-glow)"
                      />
                    )}
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isHighlighted ? '#38BDF8' : '#0EA5E9'}
                      strokeWidth={isHighlighted ? 2.5 : 1.5}
                      strokeOpacity={isHighlighted ? 1 : 0.45}
                      strokeDasharray="6 3"
                      markerEnd="url(#blueprint-arrow)"
                    />
                    <circle cx={x1} cy={y1} r="3" fill="#38BDF8" />
                    <circle cx={x2} cy={y2} r="3" fill="#38BDF8" />
                  </g>
                )
              })}
          </svg>

          {/* ── HIERARCHICAL STAGES CONTAINER BLOCKS ── */}
          {stageLayout &&
            stageLayout.map(({ group, index, stageY, stageHeight, stageWidth, isExp, nodeItems }) => {
              const childNodes = getNodesForGroup(group.id)

              return (
                <div
                  key={group.id}
                  className="absolute canvas-interactive-node transition-all duration-300"
                  style={{
                    left: 0,
                    top: stageY,
                    transform: 'translate(-50%, 0)',
                    width: stageWidth,
                    minHeight: stageHeight,
                  }}
                >
                  <div className="relative rounded-2xl bg-[#09182B]/85 border-2 border-dashed border-sky-500/40 p-4 shadow-2xl backdrop-blur-xl hover:border-sky-400 transition-colors">
                    {/* Stage Header Strip */}
                    <div
                      onClick={() => toggleGroup(group.id)}
                      className="cursor-pointer flex items-center justify-between pb-3 border-b border-sky-500/20"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500 text-slate-950 uppercase tracking-widest flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          STAGE {index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                        <h2 className="text-xs font-bold text-white tracking-wide">
                          {group.label}
                        </h2>
                        {group.summary && (
                          <span className="hidden sm:inline-block text-[11px] text-sky-300/70 border-l border-sky-800 pl-3 max-w-md truncate">
                            {group.summary}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-sky-400 font-mono px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800/60">
                          {childNodes.length} Modules
                        </span>
                        <button className="text-sky-300 hover:text-white flex items-center gap-1 text-[10px]">
                          {isExp ? (
                            <>
                              <ChevronDown className="w-3.5 h-3.5" />
                              <span>Collapse</span>
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-3.5 h-3.5" />
                              <span>Expand</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Stage Inner Modules Grid */}
                    {isExp && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nodeItems.map(({ node }) => {
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
                                'cursor-pointer rounded-xl p-3 bg-slate-950/90 border transition-all duration-300',
                                !matched && 'opacity-20 grayscale pointer-events-none',
                                isSelected
                                  ? 'border-sky-400 shadow-xl shadow-sky-500/20 ring-2 ring-sky-400/50'
                                  : isHovered
                                  ? 'border-sky-500/80 shadow-lg shadow-sky-500/10'
                                  : 'border-slate-800 hover:border-slate-700'
                              )}
                            >
                              <div className="flex items-center justify-between text-[10px] mb-1.5">
                                <span className="text-sky-400 font-mono font-semibold">
                                  MOD_{node.order < 10 ? `0${node.order}` : node.order}
                                </span>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/40 text-[9px]">
                                  <Play className="w-2.5 h-2.5 fill-sky-300" />
                                  {formatTime(node.start_seconds)}
                                </div>
                              </div>

                              <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                                {node.title}
                              </h3>

                              <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2">
                                {node.summary}
                              </p>

                              {node.sub_points && node.sub_points.length > 0 && (
                                <div className="pt-1.5 border-t border-slate-900 space-y-1">
                                  {node.sub_points.slice(0, 2).map((sp, idx) => (
                                    <div
                                      key={idx}
                                      className="text-[10px] text-slate-400 flex items-center gap-1 truncate"
                                    >
                                      <Terminal className="w-2.5 h-2.5 text-sky-500 shrink-0" />
                                      <span>{sp}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between">
                                <span className="text-[9px] text-slate-500 font-mono">// EXEC_SPEC</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectNode(node)
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500 hover:text-slate-950 flex items-center gap-1 transition-colors"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  Inspect
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

          {/* ── FLAT FALLBACK NODES (when !isGrouped) ── */}
          {!isGrouped &&
            flatLayout.map(({ node, index, x, y }) => {
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
                    width: 290,
                  }}
                >
                  <div
                    className={cn(
                      'relative rounded-lg p-3 backdrop-blur-xl border transition-all duration-300 shadow-xl',
                      isSelected
                        ? 'bg-[#09182B]/95 border-2 border-sky-400 shadow-sky-500/30 shadow-2xl ring-2 ring-sky-400/40'
                        : 'bg-[#09182B]/90 border-sky-500/30 hover:border-sky-400/80 hover:bg-[#0B1E38]/95'
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] mb-2 pb-1.5 border-b border-sky-500/20">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-sky-400" />
                        <span className="font-bold text-sky-300">
                          STAGE_{index + 1 < 10 ? `0${index + 1}` : index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950/80 text-sky-300 border border-sky-800/60">
                        <Play className="w-2.5 h-2.5 fill-sky-300" />
                        {formatTime(node.start_seconds)}
                      </div>
                    </div>

                    <h3 className="text-xs font-bold text-white line-clamp-1 mb-1">
                      {node.title}
                    </h3>

                    <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed mb-2">
                      {node.summary}
                    </p>

                    {node.sub_points && node.sub_points.length > 0 && (
                      <div className="pt-2 border-t border-sky-500/15 space-y-1">
                        {node.sub_points.slice(0, 2).map((sp, pIdx) => (
                          <div
                            key={pIdx}
                            className="text-[10px] text-slate-400 flex items-center gap-1.5 truncate"
                          >
                            <Workflow className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                            <span>{sp}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-2.5 pt-1.5 border-t border-sky-500/15 flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">// READY</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNode(node)
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-500 text-slate-950 hover:bg-sky-400 flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Execute
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

export default BlueprintCanvas
