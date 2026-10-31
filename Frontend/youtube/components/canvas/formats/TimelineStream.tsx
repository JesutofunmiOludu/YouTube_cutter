// ============================================================
// VidMind AI — Timeline Stream Component
// components/canvas/formats/TimelineStream.tsx
//
// Chronological milestone rail & scrubber. Renders a time-scaled
// proportional duration track at the top, synchronized milestone
// markers, and a sequential chronological stream of video events
// organized into hierarchical historical/narrative eras.
// ============================================================

import React, { useState, useMemo } from 'react'
import {
  Clock,
  Play,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Search,
  Flag,
  Calendar,
  Layers,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeNode, UserVideo } from '@/types'

export interface TimelineStreamProps {
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

export const TimelineStream: React.FC<TimelineStreamProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const {
    groups,
    isGrouped,
    isExpanded,
    toggleGroup,
    expandAll,
    collapseAll,
    getNodesForGroup,
  } = useGroupedNodes(payload, true)

  const nodes = useMemo(() => {
    const list = payload?.nodes || []
    return [...list].sort((a, b) => a.start_seconds - b.start_seconds)
  }, [payload])

  const totalDuration = useMemo(() => {
    if (userVideo.video?.duration_seconds && userVideo.video.duration_seconds > 0) {
      return userVideo.video.duration_seconds
    }
    const lastNode = nodes[nodes.length - 1]
    return lastNode ? Math.max(lastNode.end_seconds, 1) : 3600
  }, [userVideo, nodes])

  // Filter check
  const isMatch = (node: KnowledgeNode) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      node.title.toLowerCase().includes(q) ||
      node.summary.toLowerCase().includes(q) ||
      node.category?.toLowerCase().includes(q) ||
      node.sub_points?.some((p) => p.toLowerCase().includes(q))
    )
  }

  const filteredNodes = useMemo(() => {
    return nodes.filter(isMatch)
  }, [nodes, searchQuery])

  // Grouped eras with computed time spans
  const eraData = useMemo(() => {
    if (!isGrouped) return []
    return groups.map((grp) => {
      const cNodes = getNodesForGroup(grp.id).sort((a, b) => a.start_seconds - b.start_seconds)
      const start = cNodes.length > 0 ? cNodes[0].start_seconds : 0
      const end = cNodes.length > 0 ? cNodes[cNodes.length - 1].end_seconds : 0
      return {
        group: grp,
        nodes: cNodes,
        start,
        end,
        duration: Math.max(end - start, 1),
      }
    })
  }, [isGrouped, groups, getNodesForGroup])

  return (
    <div
      className={cn(
        'w-full h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-100 bg-[#080C14]',
        className
      )}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(244, 63, 94, 0.08) 0%, rgba(8, 12, 20, 0.98) 60%),
          radial-gradient(circle, rgba(244, 63, 94, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-16">
        {/* ── Top Timeline Scrubber Bar ── */}
        <div className="rounded-2xl p-5 bg-slate-900/90 border border-rose-500/30 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                  <span>Chronological Video Track</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30">
                    Total: {formatTime(totalDuration)}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {payload?.central_theme || 'Proportional timeline progression'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isGrouped && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={expandAll}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <Maximize2 className="w-3 h-3" />
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                  >
                    <Minimize2 className="w-3 h-3" />
                    Collapse All
                  </button>
                </div>
              )}

              {/* Filter Search */}
              <div className="relative min-w-[180px] sm:min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter milestones..."
                  className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all shadow-md"
                />
              </div>
            </div>
          </div>

          {/* ── Proportional Time Rail ── */}
          <div className="space-y-1.5 pt-2">
            <div className="h-6 w-full rounded-xl bg-slate-950/80 border border-slate-800 p-0.5 flex gap-1 overflow-hidden">
              {nodes.map((node, idx) => {
                const duration = Math.max(node.end_seconds - node.start_seconds, 1)
                const widthPercent = Math.max((duration / totalDuration) * 100, 3)
                const isHovered = hoveredNodeId === node.id
                const isSelected = selectedNodeId === node.id

                return (
                  <button
                    key={node.id}
                    onClick={() => onSelectNode(node)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                    title={`${node.title} (${formatTime(node.start_seconds)} - ${formatTime(node.end_seconds)})`}
                    style={{ width: `${widthPercent}%` }}
                    className={cn(
                      'h-full rounded-lg transition-all relative group flex items-center justify-center overflow-hidden',
                      isSelected
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 ring-2 ring-white/60'
                        : isHovered
                        ? 'bg-rose-600/80 text-white'
                        : 'bg-rose-500/25 hover:bg-rose-500/40 text-rose-300'
                    )}
                  >
                    <span className="text-[9px] font-mono font-bold truncate px-1">
                      0{idx + 1}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Time labels under rail */}
            <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
              <span>00:00</span>
              <span>{formatTime(Math.round(totalDuration / 2))}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* ── HIERARCHICAL ERAS TIMELINE (when isGrouped) ── */}
        {isGrouped && (
          <div className="space-y-8">
            {eraData.map(({ group, nodes: eraNodes, start, end }) => {
              const matchingNodes = eraNodes.filter(isMatch)
              if (matchingNodes.length === 0 && searchQuery.trim()) return null
              const exp = isExpanded(group.id)

              return (
                <div key={group.id} className="space-y-4">
                  {/* Era Divider Header */}
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className="cursor-pointer rounded-2xl p-4 bg-gradient-to-r from-rose-950/40 via-slate-900/90 to-slate-900/60 border border-rose-500/30 flex items-center justify-between backdrop-blur-xl shadow-lg hover:border-rose-400 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                        <Flag className="w-3.5 h-3.5" />
                        ERA 0{group.order}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{group.label}</span>
                          <span className="text-[10px] font-mono text-rose-300 px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-800/40">
                            {formatTime(start)} — {formatTime(end)}
                          </span>
                        </h3>
                        {group.summary && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{group.summary}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-rose-300">
                      <span className="text-[11px] font-medium hidden sm:inline-block">
                        {matchingNodes.length} milestones
                      </span>
                      {exp ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Era Milestones Axis */}
                  {exp && (
                    <div className="relative pl-6 sm:pl-10 space-y-6 pt-2">
                      <div className="absolute left-2.5 sm:left-4 top-2 bottom-4 w-0.5 bg-gradient-to-b from-rose-500 via-rose-500/40 to-transparent" />

                      {matchingNodes.map((node, mIdx) => {
                        const isHovered = hoveredNodeId === node.id
                        const isSelected = selectedNodeId === node.id
                        const durationSec = Math.max(0, node.end_seconds - node.start_seconds)

                        return (
                          <div
                            key={node.id}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            onClick={() => onSelectNode(node)}
                            className="relative group cursor-pointer"
                          >
                            <div
                              className={cn(
                                'absolute -left-6 sm:-left-10 top-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10',
                                isSelected
                                  ? 'bg-rose-500 border-white text-white scale-110 shadow-lg shadow-rose-500/50'
                                  : isHovered
                                  ? 'bg-rose-600 border-rose-300 text-white scale-105'
                                  : 'bg-slate-900 border-rose-500/60 text-rose-400'
                              )}
                            >
                              <span className="text-[10px] sm:text-xs font-mono font-bold">
                                {mIdx + 1}
                              </span>
                            </div>

                            <div
                              className={cn(
                                'rounded-2xl p-4 sm:p-5 backdrop-blur-xl border transition-all duration-300 shadow-xl bg-slate-900/85',
                                isSelected
                                  ? 'border-rose-400 ring-2 ring-rose-400/40 shadow-rose-500/20 bg-slate-900'
                                  : 'border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/95'
                              )}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                    Milestone {mIdx + 1}
                                  </span>
                                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                    {node.category || group.label}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700">
                                    <Clock className="w-3 h-3 text-rose-400" />
                                    {formatTime(node.start_seconds)} – {formatTime(node.end_seconds)}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    ({Math.round(durationSec)}s)
                                  </span>
                                </div>
                              </div>

                              <h3 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug">
                                {node.title}
                              </h3>

                              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-3">
                                {node.summary}
                              </p>

                              {node.sub_points && node.sub_points.length > 0 && (
                                <div className="pt-2 border-t border-slate-800/80 space-y-1 mb-3">
                                  {node.sub_points.map((p, pIdx) => (
                                    <div
                                      key={pIdx}
                                      className="flex items-start gap-2 text-xs text-slate-300/80 p-1 rounded bg-slate-950/30"
                                    >
                                      <span className="text-rose-400 font-bold">•</span>
                                      <span>{p}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                                  Jump to video moment
                                  <ChevronRight className="w-3 h-3 text-slate-500" />
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectNode(node)
                                  }}
                                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30"
                                >
                                  <Play className="w-3 h-3 fill-current" />
                                  <span>Watch Milestone</span>
                                </button>
                              </div>
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
        )}

        {/* ── FLAT FALLBACK TIMELINE (when !isGrouped) ── */}
        {!isGrouped && (
          <div className="relative pl-6 sm:pl-10 space-y-6">
            <div className="absolute left-2.5 sm:left-4 top-2 bottom-4 w-0.5 bg-gradient-to-b from-rose-500 via-rose-500/40 to-transparent" />

            {filteredNodes.map((node, index) => {
              const isHovered = hoveredNodeId === node.id
              const isSelected = selectedNodeId === node.id
              const durationSec = Math.max(0, node.end_seconds - node.start_seconds)

              return (
                <div
                  key={node.id}
                  onMouseEnter={() => setHoveredNodeId(node.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => onSelectNode(node)}
                  className="relative group cursor-pointer"
                >
                  <div
                    className={cn(
                      'absolute -left-6 sm:-left-10 top-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10',
                      isSelected
                        ? 'bg-rose-500 border-white text-white scale-110 shadow-lg shadow-rose-500/50'
                        : isHovered
                        ? 'bg-rose-600 border-rose-300 text-white scale-105'
                        : 'bg-slate-900 border-rose-500/60 text-rose-400'
                    )}
                  >
                    <span className="text-[10px] sm:text-xs font-mono font-bold">
                      {index + 1}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'rounded-2xl p-4 sm:p-5 backdrop-blur-xl border transition-all duration-300 shadow-xl bg-slate-900/85',
                      isSelected
                        ? 'border-rose-400 ring-2 ring-rose-400/40 shadow-rose-500/20 bg-slate-900'
                        : 'border-slate-800 hover:border-rose-500/40 hover:bg-slate-900/95'
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          Milestone 0{index + 1}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {node.category || 'Chapter'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-700">
                          <Clock className="w-3 h-3 text-rose-400" />
                          {formatTime(node.start_seconds)} – {formatTime(node.end_seconds)}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({Math.round(durationSec)}s)
                        </span>
                      </div>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white mb-2 leading-snug">
                      {node.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed mb-3">
                      {node.summary}
                    </p>

                    {node.sub_points && node.sub_points.length > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 space-y-1 mb-3">
                        {node.sub_points.map((p, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-start gap-2 text-xs text-slate-300/80 p-1 rounded bg-slate-950/30"
                          >
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        Jump to video moment
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelectNode(node)
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Watch Milestone</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineStream
