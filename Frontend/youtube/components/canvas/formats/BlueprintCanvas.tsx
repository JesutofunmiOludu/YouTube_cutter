// ============================================================
// VidMind AI — Blueprint Canvas Component (Redesigned)
// components/canvas/formats/BlueprintCanvas.tsx
//
// Clean architectural pipeline matching reference specs:
//   • Phase container columns in soft sage/mint green (#E6F4EA)
//   • White child step cards (#FFFFFF) with bold titles & timestamps
//   • Interactive step checkboxes for tracking execution progress
//   • Horizontal flow arrows connecting sequential phase lanes
//   • Bottom cross-cutting "Prerequisites and tools" bar in periwinkle (#EEF0FF)
//   • Collapsible phase lanes with vertical scrolling for 50+ steps
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'
import {
  Cpu,
  Play,
  Clock,
  ArrowRight,
  Layers,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Wrench,
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
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [completedNodeIds, setCompletedNodeIds] = useState<Set<string>>(new Set())
  const [focusedPhaseId, setFocusedPhaseId] = useState<string | null>(null)

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

  const toggleCompleted = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setCompletedNodeIds((prev) => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }, [])

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

  // ── Compute Horizontal Phase Columns Layout ──
  const phaseColumns = useMemo(() => {
    if (!isGrouped) return []

    const colWidth = 270
    const colGap = 64
    const totalW = groups.length * colWidth + (groups.length - 1) * colGap
    const startX = -totalW / 2

    return groups.map((group, idx) => {
      const colX = startX + idx * (colWidth + colGap)
      const cNodes = getNodesForGroup(group.id).filter(isMatch)
      const allGroupNodes = getNodesForGroup(group.id)

      // Time range for phase
      const startSec = allGroupNodes.length > 0 ? allGroupNodes[0].start_seconds : 0
      const endSec =
        allGroupNodes.length > 0
          ? allGroupNodes[allGroupNodes.length - 1].end_seconds
          : startSec + 300
      const timeRange = `${formatTime(startSec)} to ${formatTime(endSec)}`

      return {
        group,
        colX,
        colWidth,
        timeRange,
        nodes: cNodes,
        isExp: isExpanded(group.id),
      }
    })
  }, [isGrouped, groups, isExpanded, getNodesForGroup, isMatch])

  // Dynamic vertical offset so bottom bar always sits cleanly below tallest column
  const prereqTop = useMemo(() => {
    const colTop = -240
    const maxHeaderH = 104
    const maxExpandedCards = Math.max(
      0,
      ...phaseColumns.map((col) => (col.isExp ? col.nodes.length : 0))
    )
    if (maxExpandedCards === 0) {
      return colTop + maxHeaderH + 40
    }
    const estBodyH = Math.min(460, maxExpandedCards * 92 + (maxExpandedCards - 1) * 12 + 28)
    return colTop + maxHeaderH + estBodyH + 40
  }, [phaseColumns])

  // Cross-cutting prerequisites data (filters out generic fallback UI instructions)
  const prerequisites = useMemo(() => {
    const realTakeaways = (payload.takeaways || []).filter((t) => {
      const lower = t.toLowerCase()
      return (
        !lower.startsWith('central theme:') &&
        !lower.includes('interconnected knowledge nodes mapped') &&
        !lower.includes('click any node or group on the canvas')
      )
    })
    if (realTakeaways.length > 0) {
      return realTakeaways
    }
    const prereqNodes = nodes.filter((n) =>
      n.title.toLowerCase().includes('prereq') ||
      n.title.toLowerCase().includes('setup') ||
      n.category?.toLowerCase().includes('prereq')
    )
    if (prereqNodes.length > 0) {
      return prereqNodes.flatMap((n) => (n.sub_points && n.sub_points.length > 0 ? n.sub_points : [n.title]))
    }
    return [
      'Fundamental tools and setup required throughout execution',
      'Environment configurations and baseline prerequisites identified from the video',
    ]
  }, [payload, nodes])

  // Minimap coordinate list
  const minimapNodes = useMemo(() => {
    const list: Array<{ id: string; x: number; y: number; color?: string }> = []
    phaseColumns.forEach(({ group, colX, nodes: cNodes }) => {
      list.push({ id: group.id, x: colX + 135, y: -100, color: '#10B981' })
      cNodes.forEach((node, nIdx) => {
        list.push({ id: node.id, x: colX + 135, y: nIdx * 60, color: '#6366F1' })
      })
    })
    return list
  }, [phaseColumns])

  return (
    <CanvasShell
      formatName="Blueprint"
      formatDescription="Sequential phase containers with actionable step cards and prerequisites lane"
      accentColor="#10B981"
      accentGlow="rgba(16, 185, 129, 0.2)"
      nodeCount={nodes.length}
      centralTheme={payload.central_theme}
      icon={Cpu}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      typeFilter={activeTypeFilter}
      onTypeFilterChange={setActiveTypeFilter}
      availableTypes={availableTypes}
      minimapNodes={minimapNodes}
      onBackToOverview={() => setFocusedPhaseId(null)}
      className={className}
    >
      {({ flyTo, resetCamera, isFocused }) => {
        const handlePhaseClick = (groupId: string, colX: number, colWidth: number) => {
          if (focusedPhaseId === groupId) {
            resetCamera()
            setFocusedPhaseId(null)
          } else {
            setFocusedPhaseId(groupId)
            if (!isExpanded(groupId)) toggleGroup(groupId)
            flyTo(colX + colWidth / 2, -40, 1.3)
          }
        }

        return (
          <div className="blueprint-canvas absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
            {/* ── Top Floating Phase Toolbar ── */}
            {isGrouped && (
              <div className="absolute -top-[310px] left-0 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 border border-slate-200/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg shadow-slate-900/5 whitespace-nowrap w-max">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5 shrink-0">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  {groups.length} Phases ({nodes.length} Steps)
                </span>

                <div className="w-[1px] h-3 bg-slate-200 mx-1 shrink-0" />

                <span className="text-[10px] text-slate-500 font-mono shrink-0">
                  {completedNodeIds.size}/{nodes.length} Done
                </span>

                <div className="w-[1px] h-3 bg-slate-200 mx-1 shrink-0" />

                <button
                  type="button"
                  onClick={expandAll}
                  className="text-[10px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition-colors shrink-0"
                  title="Expand All Phase Lanes"
                >
                  <Maximize2 className="w-3 h-3 text-slate-400" />
                  Expand
                </button>
                <button
                  type="button"
                  onClick={() => {
                    collapseAll()
                    resetCamera()
                    setFocusedPhaseId(null)
                  }}
                  className="text-[10px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition-colors shrink-0"
                  title="Collapse Phase Lanes"
                >
                  <Minimize2 className="w-3 h-3 text-slate-400" />
                  Collapse
                </button>
              </div>
            )}

            {/* ── SVG Arrow Connectors Between Sequential Phases ── */}
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
                  id="blueprint-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 8 4, 0 7" fill="#64748B" />
                </marker>
              </defs>

              {phaseColumns.map((col, idx) => {
                if (idx === phaseColumns.length - 1) return null
                const nextCol = phaseColumns[idx + 1]
                const startX = col.colX + col.colWidth + 4
                const endX = nextCol.colX - 8
                const arrowY = -194
                const isDimmed = isFocused && focusedPhaseId !== null

                return (
                  <line
                    key={`phase-arrow-${idx}`}
                    x1={startX}
                    y1={arrowY}
                    x2={endX}
                    y2={arrowY}
                    stroke="#64748B"
                    strokeWidth="2"
                    strokeOpacity={isDimmed ? 0.25 : 0.85}
                    markerEnd="url(#blueprint-arrow)"
                  />
                )
              })}
            </svg>

            {/* ── Phase Swimlane Columns (Mint Green Matching Reference) ── */}
            <div className="relative flex items-start gap-16 pointer-events-none">
              {phaseColumns.map(({ group, colX, colWidth, timeRange, nodes: cNodes, isExp }) => {
                const isDimmed = isFocused && focusedPhaseId !== null && focusedPhaseId !== group.id
                const isCurrentFocused = focusedPhaseId === group.id
                const cleanHeader = group.label
                  .replace(/^Stage 0?\d+:?\s*/i, '')
                  .replace(/^Phase 0?\d+:?\s*/i, '')

                return (
                  <div
                    key={`blueprint-phase-${group.id}`}
                    style={{
                      position: 'absolute',
                      left: colX,
                      top: -240,
                      width: colWidth,
                    }}
                    className={cn(
                      'pointer-events-auto rounded-[24px] border transition-all duration-300 shadow-sm flex flex-col',
                      'bg-[#E6F4EA] border-[#A7F3D0]',
                      isCurrentFocused && 'ring-2 ring-emerald-500 shadow-xl scale-[1.02]',
                      isDimmed && 'opacity-25 pointer-events-none'
                    )}
                  >
                    {/* Phase Container Header */}
                    <div
                      onClick={() => handlePhaseClick(group.id, colX, colWidth)}
                      className="p-4 text-center cursor-pointer select-none border-b border-[#A7F3D0]/50 hover:bg-emerald-100/50 transition-colors rounded-t-[24px]"
                    >
                    <h3
                      className="text-sm font-bold text-[#065F46] tracking-tight leading-snug line-clamp-2"
                      title={cleanHeader}
                    >
                      {cleanHeader}
                    </h3>
                    <div className="text-xs font-medium text-[#047857] mt-1">
                      {timeRange}
                    </div>
                  </div>

                  {/* Child Step Cards inside Phase (White Matching Reference) */}
                  {isExp && (
                    <div className="p-3.5 space-y-3 max-h-[460px] overflow-y-auto scrollbar-thin">
                      {cNodes.map((node) => {
                        const isSelected = selectedNodeId === node.id
                        const isCompleted = completedNodeIds.has(node.id)

                        return (
                          <div
                            key={`step-${node.id}`}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onClick={() => onSelectNode(node)}
                            className={cn(
                              'relative p-3.5 rounded-xl border bg-white cursor-pointer transition-all duration-200 select-none shadow-xs hover:shadow-md text-center',
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                : 'border-[#E2E8F0] hover:border-slate-300',
                              isCompleted && 'opacity-75 bg-slate-50'
                            )}
                          >
                            {/* Interactive completion toggle */}
                            <button
                              type="button"
                              onClick={(e) => toggleCompleted(node.id, e)}
                              className="absolute top-2.5 right-2.5 p-1 text-slate-300 hover:text-emerald-600 transition-colors"
                              title={isCompleted ? 'Mark step as incomplete' : 'Mark step as completed'}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </button>

                            <div
                              className={cn(
                                'text-sm font-semibold text-slate-800 line-clamp-2 px-6',
                                isCompleted && 'line-through text-slate-400'
                              )}
                            >
                              {node.title}
                            </div>

                            <div className="mt-1.5 text-xs text-slate-400 font-mono flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(node.start_seconds)}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Bottom Prerequisites & Tools Cross-Cutting Bar (Lavender Matching Reference) ── */}
          <div
            style={{
              position: 'absolute',
              left: phaseColumns.length > 0 ? phaseColumns[0].colX : -400,
              top: prereqTop,
              width:
                phaseColumns.length > 0
                  ? phaseColumns[phaseColumns.length - 1].colX +
                    phaseColumns[phaseColumns.length - 1].colWidth -
                    phaseColumns[0].colX
                  : 800,
            }}
            className={cn(
              'rounded-2xl border py-3 px-5 text-center shadow-xs transition-all duration-300 pointer-events-auto',
              'bg-[#EEF0FF] border-[#C7D2FE] text-[#312E81]'
            )}
          >
            <div className="flex items-center justify-center gap-2 font-bold text-sm text-[#312E81]">
              <Wrench className="w-4 h-4 text-indigo-600" />
              <span>Prerequisites and tools</span>
            </div>
            <div className="text-xs text-[#4338CA] mt-0.5">
              Pulled from the whole video
            </div>

            {prerequisites.length > 0 && (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                {prerequisites.map((req, rIdx) => (
                  <span
                    key={`prereq-${rIdx}`}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-white/80 border border-[#C7D2FE] text-slate-700 font-medium shadow-2xs"
                  >
                    {req}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )
    }}
    </CanvasShell>
  )
}

export default BlueprintCanvas
