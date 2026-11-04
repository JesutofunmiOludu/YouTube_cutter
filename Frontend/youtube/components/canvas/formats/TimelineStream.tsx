// ============================================================
// VidMind AI — Timeline Stream Component (Redesigned)
// components/canvas/formats/TimelineStream.tsx
//
// Clean chronological milestone rail & scrubber:
//   • Zoomable & pannable horizontal video axis (1x, 2x, 4x, 8x)
//   • Overlapping dense nodes merge into expandable "+N" cluster badges
//   • Node-type filter chips (Claims, Steps, Stats, Quotes, Warnings)
//   • Full-duration minimap scrubber at the top
//   • Light editorial aesthetic with crisp cards and clear timestamps
// ============================================================

import React, { useState, useMemo, useRef, useCallback } from 'react'
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
  ZoomIn,
  ZoomOut,
  Sliders,
  Tag,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeNode, KnowledgeNodeType, UserVideo } from '@/types'

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
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [timelineZoom, setTimelineZoom] = useState<number>(1)
  const [expandedClusterKey, setExpandedClusterKey] = useState<string | null>(null)

  const trackRef = useRef<HTMLDivElement>(null)

  const {
    groups,
    isGrouped,
    isExpanded,
    toggleGroup,
    expandAll,
    collapseAll,
    getNodesForGroup,
    availableTypes,
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

  const filteredNodes = useMemo(() => {
    return nodes.filter(isMatch)
  }, [nodes, isMatch])

  // ── Density Clustering for Overlapping Nodes ──
  // Nodes closer than clusterThresholdSeconds merge into "+N" badge at low zoom
  const clusteredNodes = useMemo(() => {
    const thresholdSec = Math.max(15, 60 / timelineZoom)
    const clusters: Array<{
      key: string
      start_seconds: number
      end_seconds: number
      nodes: KnowledgeNode[]
    }> = []

    let currentCluster: KnowledgeNode[] = []

    filteredNodes.forEach((node, idx) => {
      if (currentCluster.length === 0) {
        currentCluster.push(node)
      } else {
        const prev = currentCluster[currentCluster.length - 1]
        if (node.start_seconds - prev.start_seconds < thresholdSec) {
          currentCluster.push(node)
        } else {
          clusters.push({
            key: `cluster-${currentCluster[0].id}`,
            start_seconds: currentCluster[0].start_seconds,
            end_seconds: currentCluster[currentCluster.length - 1].end_seconds,
            nodes: currentCluster,
          })
          currentCluster = [node]
        }
      }
    })

    if (currentCluster.length > 0) {
      clusters.push({
        key: `cluster-${currentCluster[0].id}`,
        start_seconds: currentCluster[0].start_seconds,
        end_seconds: currentCluster[currentCluster.length - 1].end_seconds,
        nodes: currentCluster,
      })
    }

    return clusters
  }, [filteredNodes, timelineZoom])

  // Grouped eras with computed time spans
  const eraData = useMemo(() => {
    if (!isGrouped) return []
    return groups.map((grp) => {
      const cNodes = getNodesForGroup(grp.id)
        .filter(isMatch)
        .sort((a, b) => a.start_seconds - b.start_seconds)
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
  }, [isGrouped, groups, getNodesForGroup, isMatch])

  return (
    <div
      className={cn(
        'w-full h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800 bg-[#FBFBFD]',
        className
      )}
      style={{
        backgroundImage: 'radial-gradient(circle, #E2E8F0 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* ── Top Minimap Timeline Scrubber Bar ── */}
        <div className="rounded-2xl p-5 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Chronological Video Track</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Total: {formatTime(totalDuration)}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  {filteredNodes.length} milestones across video progression
                </p>
              </div>
            </div>

            {/* Controls: Zoom & Search */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setTimelineZoom((z) => Math.max(0.5, z - 0.5))}
                  className="p-1 rounded text-slate-600 hover:text-slate-950 hover:bg-white transition-all"
                  title="Zoom Out Track"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono px-1.5 text-slate-700 font-semibold">
                  {timelineZoom}x
                </span>
                <button
                  type="button"
                  onClick={() => setTimelineZoom((z) => Math.min(4, z + 0.5))}
                  className="p-1 rounded text-slate-600 hover:text-slate-950 hover:bg-white transition-all"
                  title="Zoom In Track"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="relative w-44">
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter milestones..."
                  className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Type Filter Chips */}
          {availableTypes.length > 0 && (
            <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTypeFilter('all')}
                className={cn(
                  'text-[10px] px-2.5 py-1 rounded-full border transition-all font-medium',
                  activeTypeFilter === 'all'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                )}
              >
                All Moments ({nodes.length})
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveTypeFilter(type)}
                  className={cn(
                    'text-[10px] px-2.5 py-1 rounded-full border capitalize transition-all font-medium',
                    activeTypeFilter === type
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          )}

          {/* Minimap Proportional Track */}
          <div className="space-y-1.5 pt-2">
            <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              {filteredNodes.map((n) => {
                const pct = Math.min(100, Math.max(0, (n.start_seconds / totalDuration) * 100))
                const isSelected = selectedNodeId === n.id
                return (
                  <button
                    key={`mini-dot-${n.id}`}
                    type="button"
                    onClick={() => onSelectNode(n)}
                    title={`[${formatTime(n.start_seconds)}] ${n.title}`}
                    className={cn(
                      'absolute top-0 bottom-0 w-2 -translate-x-1/2 transition-all cursor-pointer',
                      isSelected ? 'bg-indigo-600 z-10 scale-125' : 'bg-indigo-400/70 hover:bg-indigo-600'
                    )}
                    style={{ left: `${pct}%` }}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>00:00</span>
              <span>{formatTime(totalDuration / 2)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>

        {/* ── Chronological Eras & Sequential Stream ── */}
        {isGrouped ? (
          <div className="space-y-8">
            {eraData.map(({ group, nodes: eraNodes, start, end }) => {
              const exp = isExpanded(group.id)
              return (
                <div key={`era-${group.id}`} className="space-y-4">
                  {/* Era Header Banner */}
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs cursor-pointer hover:border-slate-300 transition-all select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {group.order}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {group.label.replace(/^Era \d+:?\s*/i, '').replace(/^Chapter \d+:?\s*/i, '')}
                        </h3>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatTime(start)} → {formatTime(end)} ({eraNodes.length} events)
                        </div>
                      </div>
                    </div>
                    {exp ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  {/* Era Milestones Stream */}
                  {exp && (
                    <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-indigo-100 ml-3">
                      {eraNodes.map((node) => {
                        const isSelected = selectedNodeId === node.id

                        return (
                          <div
                            key={`milestone-${node.id}`}
                            onClick={() => onSelectNode(node)}
                            className={cn(
                              'relative p-4 rounded-xl border bg-white shadow-xs hover:shadow-md cursor-pointer transition-all duration-200',
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                            )}
                          >
                            {/* Pin dot on vertical line */}
                            <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-xs" />

                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                                    {formatTime(node.start_seconds)}
                                  </span>
                                  {node.node_type && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-600 font-medium">
                                      {node.node_type}
                                    </span>
                                  )}
                                </div>
                                <h4 className="mt-1.5 text-sm font-semibold text-slate-800">
                                  {node.title}
                                </h4>
                                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                  {node.summary}
                                </p>
                              </div>
                              <button
                                type="button"
                                className="shrink-0 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                                title="Play segment"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>
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
        ) : (
          /* Flat Milestone Stream with Density Clustering */
          <div className="relative pl-6 sm:pl-8 space-y-4 border-l-2 border-indigo-100 ml-3">
            {clusteredNodes.map((cluster) => {
              if (cluster.nodes.length > 1) {
                const isExpanded = expandedClusterKey === cluster.key
                return (
                  <div key={cluster.key} className="space-y-3">
                    {/* Clustered "+N Moments" Badge */}
                    <div
                      onClick={() => setExpandedClusterKey((prev) => (prev === cluster.key ? null : cluster.key))}
                      className="relative flex items-center justify-between p-3 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs cursor-pointer hover:bg-indigo-100/70 transition-all select-none"
                    >
                      <div className="absolute -left-[31px] sm:-left-[39px] top-4 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700">
                          +{cluster.nodes.length} dense moments
                        </span>
                        <span className="text-[11px] font-mono text-indigo-600">
                          [{formatTime(cluster.start_seconds)} – {formatTime(cluster.end_seconds)}]
                        </span>
                      </div>
                      <span className="text-[11px] text-indigo-600 font-medium">
                        {isExpanded ? 'Collapse' : 'Expand'}
                      </span>
                    </div>

                    {/* Expanded cluster items */}
                    {isExpanded &&
                      cluster.nodes.map((node) => (
                        <div
                          key={`clustered-node-${node.id}`}
                          onClick={() => onSelectNode(node)}
                          className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                              {formatTime(node.start_seconds)}
                            </span>
                            <h4 className="text-sm font-semibold text-slate-800">{node.title}</h4>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{node.summary}</p>
                        </div>
                      ))}
                  </div>
                )
              }

              const singleNode = cluster.nodes[0]
              const isSelected = selectedNodeId === singleNode.id

              return (
                <div
                  key={`flat-milestone-${singleNode.id}`}
                  onClick={() => onSelectNode(singleNode)}
                  className={cn(
                    'relative p-4 rounded-xl border bg-white shadow-xs hover:shadow-md cursor-pointer transition-all',
                    isSelected
                      ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="absolute -left-[31px] sm:-left-[39px] top-5 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-xs" />
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {formatTime(singleNode.start_seconds)}
                        </span>
                        {singleNode.node_type && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-slate-100 text-slate-600 font-medium">
                            {singleNode.node_type}
                          </span>
                        )}
                      </div>
                      <h4 className="mt-1.5 text-sm font-semibold text-slate-800">
                        {singleNode.title}
                      </h4>
                      <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                        {singleNode.summary}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 p-2 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Play segment"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
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
}

export default TimelineStream
