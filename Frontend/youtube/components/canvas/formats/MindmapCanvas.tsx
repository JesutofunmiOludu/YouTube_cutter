// ============================================================
// VidMind AI — Mindmap Canvas Component (Circular Hub Orbit & Crescent Branch)
// components/canvas/formats/MindmapCanvas.tsx
//
// Clean editorial radial orbital knowledge constellation:
//   • 16:9 Cinematic Center Card with real YouTube video thumbnail,
//     duration badge, and play overlay.
//   • Main Chapter Group Nodes arranged in a smooth circular / elliptical
//     orbit around the central video title (like planets around a star).
//   • Direct radial curved spokes radiating from center to each chapter.
//   • Chapter cards featuring Title, Concept Count, Timestamp Range,
//     and Key Topic Highlights previewing what the group entails.
//   • Outward Circular Crescent Arc Branching: when a group is clicked,
//     subnodes fan out in an elegant satellite arc into free space.
//   • Wide-Angle Camera Zoom-Out (0.85x): camera glides to center the
//     active chapter and zooms out so all circular subnodes fit with zero edge clipping.
//   • Timestamp-specific micro-thumbnails for subnodes.
//   • Seamless "Back to Overview" reset.
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'
import {
  GitFork,
  Play,
  Clock,
  Layers,
  Maximize2,
  Minimize2,
  Video,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { CanvasShell } from '../CanvasShell'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeGroup, KnowledgeNode, KnowledgeNodeType, UserVideo } from '@/types'

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

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds <= 0) return '0 min'
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`
}

function getNodeTypeBadge(type?: string): { label: string; badgeClass: string } {
  switch (type?.toLowerCase()) {
    case 'stat':
      return { label: 'Stat', badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200' }
    case 'step':
      return { label: 'Step', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
    case 'warning':
      return { label: 'Warning', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'definition':
      return { label: 'Definition', badgeClass: 'bg-violet-50 text-violet-700 border-violet-200' }
    case 'quote':
      return { label: 'Quote', badgeClass: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' }
    case 'analogy':
      return { label: 'Analogy', badgeClass: 'bg-teal-50 text-teal-700 border-teal-200' }
    case 'example':
      return { label: 'Example', badgeClass: 'bg-sky-50 text-sky-700 border-sky-200' }
    default:
      return { label: 'Claim', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  }
}

export const MindmapCanvas: React.FC<MindmapCanvasProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null)
  const [focusedGroupId, setFocusedGroupId] = useState<string | null>(null)

  const nodes = useMemo(() => payload?.nodes || [], [payload])

  // Grouped nodes hook (always clusters when totalNodesCount > 4, collapsed by default when > 10)
  const {
    groups,
    isGrouped,
    isExpanded,
    toggleGroup,
    expandOnly,
    expandAll,
    collapseAll,
    getNodesForGroup,
    availableTypes,
  } = useGroupedNodes(payload, false)

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

  const youtubeId = userVideo.video?.youtube_id

  // Main video thumbnail for the central thesis card
  const videoThumbnailUrl = useMemo(() => {
    if (userVideo.video?.thumbnail_url) return userVideo.video.thumbnail_url
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
    }
    return null
  }, [userVideo, youtubeId])

  const totalDurationSeconds = useMemo(() => {
    return (
      payload?.metadata?.duration_seconds ||
      userVideo.video?.duration_seconds ||
      (nodes.length > 0 ? nodes[nodes.length - 1].end_seconds : 0) ||
      1
    )
  }, [payload, userVideo, nodes])

  const videoDurationFormatted = useMemo(() => {
    return formatDuration(totalDurationSeconds)
  }, [totalDurationSeconds])

  // Get timestamp-specific YouTube frame thumbnail for leaf cards
  const getNodeThumbnail = useCallback(
    (node: KnowledgeNode) => {
      if (!youtubeId) return null
      const ratio = (node.start_seconds || 0) / Math.max(totalDurationSeconds, 1)
      let frame = 1
      if (ratio >= 0.66) frame = 3
      else if (ratio >= 0.33) frame = 2
      return `https://img.youtube.com/vi/${youtubeId}/${frame}.jpg`
    },
    [youtubeId, totalDurationSeconds]
  )

  // ── Symmetrical Circular / Elliptical Orbit for Group Nodes ──
  const hubLayout = useMemo(() => {
    if (!isGrouped || groups.length === 0) return []

    const N = groups.length
    // Radii of the elliptical planetary orbit around center (0, 0)
    // Rx = 480px, Ry = 300px (generous clearance from center card 240x140)
    const Rx = 480
    const Ry = 300

    // Arc radius for subnodes fanning out from the group
    const subnodeRadius = 260
    const subnodeSpanDeg = 130 // 130° fan

    return groups.map((group, idx) => {
      // Angular distribution: offset slightly so no card sits directly at 90° (dead top/bottom)
      const step = (2 * Math.PI) / N
      const offset = Math.PI / N - Math.PI / 2
      const groupAngle = offset + idx * step

      const groupX = Math.round(Rx * Math.cos(groupAngle))
      const groupY = Math.round(Ry * Math.sin(groupAngle))

      const exp = isExpanded(group.id)
      const cNodes = getNodesForGroup(group.id).filter(isMatch)

      // Subnodes fan outward in direction of groupAngle
      const childrenPositions: Array<{
        node: KnowledgeNode
        x: number
        y: number
      }> = []

      if (exp && cNodes.length > 0) {
        const M = cNodes.length
        const spanRad = (subnodeSpanDeg * Math.PI) / 180

        cNodes.forEach((node, cIdx) => {
          let childAngle: number
          if (M === 1) {
            childAngle = groupAngle
          } else {
            const fraction = cIdx / (M - 1)
            childAngle = groupAngle - spanRad / 2 + fraction * spanRad
          }

          const childX = Math.round(groupX + subnodeRadius * Math.cos(childAngle))
          const childY = Math.round(groupY + subnodeRadius * Math.sin(childAngle))

          childrenPositions.push({
            node,
            x: childX,
            y: childY,
          })
        })
      }

      return {
        group,
        groupX,
        groupY,
        groupAngle,
        isExp: exp,
        children: childrenPositions,
      }
    })
  }, [isGrouped, groups, isExpanded, getNodesForGroup, isMatch])

  // Minimal radial layout for very small payload (<= 4 nodes with no groups)
  const compactNodesLayout = useMemo(() => {
    if (isGrouped || nodes.length === 0) return []
    const radius = 280
    return nodes.filter(isMatch).map((node, idx, arr) => {
      const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2
      return {
        node,
        x: Math.round(radius * Math.cos(angle)),
        y: Math.round(radius * Math.sin(angle)),
      }
    })
  }, [isGrouped, nodes, isMatch])

  // Minimap coordinate list
  const minimapNodes = useMemo(() => {
    const list: Array<{ id: string; x: number; y: number; color?: string }> = [
      { id: 'center-thesis', x: 0, y: 0, color: '#10B981' },
    ]

    if (hubLayout.length > 0) {
      hubLayout.forEach(({ group, groupX, groupY, isExp, children }) => {
        list.push({ id: group.id, x: groupX, y: groupY, color: '#6366F1' })
        if (isExp) {
          children.forEach(({ node, x, y }) => {
            list.push({ id: node.id, x, y, color: '#94A3B8' })
          })
        }
      })
    } else {
      compactNodesLayout.forEach(({ node, x, y }) => {
        list.push({ id: node.id, x, y, color: '#6366F1' })
      })
    }

    return list
  }, [hubLayout, compactNodesLayout])

  return (
    <CanvasShell
      formatName="Mindmap"
      formatDescription="Direct hub-and-spoke knowledge constellation with circular branching"
      accentColor="#6366F1"
      accentGlow="rgba(99, 102, 241, 0.25)"
      nodeCount={nodes.length}
      centralTheme={payload.central_theme}
      icon={GitFork}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      typeFilter={activeTypeFilter}
      onTypeFilterChange={setActiveTypeFilter}
      availableTypes={availableTypes}
      minimapNodes={minimapNodes}
      onBackToOverview={() => {
        setFocusedGroupId(null)
        collapseAll()
      }}
      className={className}
    >
      {({ flyTo, resetCamera, isFocused }) => {
        // Handle chapter card click: fly to group and expand with wide-angle zoom-out (0.85x)
        const handleGroupClick = (group: KnowledgeGroup, groupX: number, groupY: number, groupAngle: number) => {
          if (focusedGroupId === group.id) {
            // Already focused: reset back to overview
            resetCamera()
            setFocusedGroupId(null)
            collapseAll()
          } else {
            setFocusedGroupId(group.id)
            expandOnly(group.id)
            // Center camera slightly offset in direction of satellite arc, with wide zoom out (0.85x)
            const targetX = Math.round(groupX + 100 * Math.cos(groupAngle))
            const targetY = Math.round(groupY + 100 * Math.sin(groupAngle))
            flyTo(targetX, targetY, 0.85)
          }
        }

        return (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
            {/* ── Top Floating Chapter Toolbar ── */}
            {isGrouped && (
              <div className="absolute -top-[340px] left-0 -translate-x-1/2 z-30 flex items-center gap-2 bg-white/95 border border-slate-200/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg shadow-slate-900/5">
                <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  {groups.length} Chapters ({nodes.length} Concepts)
                </span>

                <div className="w-[1px] h-3 bg-slate-200 mx-1" />

                <button
                  type="button"
                  onClick={expandAll}
                  className="text-[10px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition-colors"
                  title="Expand All Chapters"
                >
                  <Maximize2 className="w-3 h-3 text-slate-400" />
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={() => {
                    collapseAll()
                    resetCamera()
                    setFocusedGroupId(null)
                  }}
                  className="text-[10px] text-slate-600 hover:text-slate-900 px-2 py-0.5 rounded hover:bg-slate-100 flex items-center gap-1 transition-colors"
                  title="Collapse to Overview"
                >
                  <Minimize2 className="w-3 h-3 text-slate-400" />
                  Overview
                </button>
              </div>
            )}

            {/* ── Large ViewBox SVG Layer for Crisp Connecting Lines ── */}
            <svg
              className="overflow-visible pointer-events-none absolute"
              style={{
                left: -3500,
                top: -3500,
                width: 7000,
                height: 7000,
              }}
              viewBox="-3500 -3500 7000 7000"
            >
              <defs>
                <marker
                  id="mindmap-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#94A3B8" />
                </marker>
                <marker
                  id="mindmap-arrow-active"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 1, 7 4, 0 7" fill="#4F46E5" />
                </marker>
              </defs>

              {/* Direct Radial Spokes: Center Video Title to Circular Group Orbit */}
              {hubLayout.map(({ group, groupX, groupY, isExp, children }) => {
                const angle = Math.atan2(groupY, groupX)
                // Center exit point on boundary of 240x140 card
                const rootX = Math.round(115 * Math.cos(angle))
                const rootY = Math.round(65 * Math.sin(angle))
                // Chapter entry point on boundary of 220x96 card
                const targetX = Math.round(groupX - 105 * Math.cos(angle))
                const targetY = Math.round(groupY - 45 * Math.sin(angle))

                // Smooth S-curve spline directly from center video card edge to chapter card
                const dx = targetX - rootX
                const dy = targetY - rootY
                const c1X = rootX + dx * 0.45
                const c1Y = rootY + dy * 0.1
                const c2X = rootX + dx * 0.75
                const c2Y = targetY

                const isGroupHovered = hoveredGroupId === group.id
                const isGroupFocused = focusedGroupId === group.id
                const isDimmed = isFocused && !isGroupFocused

                return (
                  <g key={`direct-line-${group.id}`} className="transition-all duration-300">
                    {/* Radial Spoke to Chapter in Orbit */}
                    <path
                      d={`M ${rootX} ${rootY} C ${c1X} ${c1Y}, ${c2X} ${c2Y}, ${targetX} ${targetY}`}
                      fill="none"
                      stroke={isGroupFocused ? '#4F46E5' : isGroupHovered ? '#6366F1' : '#94A3B8'}
                      strokeWidth={isGroupFocused ? 2.75 : isGroupHovered ? 2.25 : 1.75}
                      strokeOpacity={isDimmed ? 0.2 : 0.85}
                      markerEnd={isGroupFocused ? 'url(#mindmap-arrow-active)' : 'url(#mindmap-arrow)'}
                      className="transition-all duration-300"
                    />

                    {/* Circular Branch Spokes: From Chapter to each Child in the Crescent Arc */}
                    {isExp &&
                      children.map(({ node, x: cX, y: cY }) => {
                        const spokeAngle = Math.atan2(cY - groupY, cX - groupX)
                        // Chapter card perimeter exit point
                        const startX = Math.round(groupX + 100 * Math.cos(spokeAngle))
                        const startY = Math.round(groupY + 45 * Math.sin(spokeAngle))
                        // Child card perimeter entry point
                        const endX = Math.round(cX - 88 * Math.cos(spokeAngle))
                        const endY = Math.round(cY - 30 * Math.sin(spokeAngle))

                        const cdx = endX - startX
                        const cdy = endY - startY
                        const cp1X = startX + cdx * 0.4
                        const cp1Y = startY + cdy * 0.1
                        const cp2X = startX + cdx * 0.7
                        const cp2Y = endY

                        const isChildHovered = hoveredNodeId === node.id
                        const isChildSelected = selectedNodeId === node.id

                        return (
                          <g key={`child-circular-spoke-${node.id}`} className="transition-all duration-300">
                            <path
                              d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`}
                              fill="none"
                              stroke={isChildSelected ? '#4F46E5' : isChildHovered ? '#6366F1' : '#CBD5E1'}
                              strokeWidth={isChildSelected ? 2.5 : isChildHovered ? 2 : 1.5}
                              strokeOpacity={isDimmed ? 0.2 : 0.85}
                              className="transition-all duration-300"
                            />
                            {/* Anchor dot at child node entry */}
                            <circle
                              cx={endX}
                              cy={endY}
                              r={3}
                              fill={isChildSelected ? '#4F46E5' : isChildHovered ? '#6366F1' : '#94A3B8'}
                              opacity={isDimmed ? 0.2 : 0.9}
                            />
                          </g>
                        )
                      })}
                  </g>
                )
              })}

              {/* Compact Direct Lines (for <= 4 nodes with no groups) */}
              {compactNodesLayout.map(({ node, x, y }) => {
                const isSelected = selectedNodeId === node.id
                return (
                  <path
                    key={`compact-line-${node.id}`}
                    d={`M 0 0 L ${x} ${y}`}
                    fill="none"
                    stroke={isSelected ? '#4F46E5' : '#94A3B8'}
                    strokeWidth={isSelected ? 2.5 : 1.75}
                    strokeOpacity={0.8}
                  />
                )
              })}
            </svg>

            {/* ── Central Video Title Node with 16:9 Thumbnail ── */}
            <div
              className={cn(
                'absolute z-20 -translate-x-1/2 -translate-y-1/2 w-[240px] rounded-2xl overflow-hidden border bg-white shadow-xl transition-all duration-300 select-none group',
                'border-emerald-200/90 hover:border-emerald-300 hover:shadow-2xl'
              )}
              style={{ left: 0, top: 0 }}
            >
              {/* 16:9 Thumbnail Banner with Gradient Wash */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
                {videoThumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={videoThumbnailUrl}
                    alt={payload.video_title || 'Video Thumbnail'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-emerald-900 to-teal-900">
                    <Video className="w-8 h-8 text-emerald-300" />
                  </div>
                )}
                {/* Vignette / Dark Gradient Wash */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />

                {/* Centered Translucent Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-lg text-emerald-700 group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </div>
                </div>

                {/* Duration Badge in Bottom Corner */}
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  <span>{videoDurationFormatted}</span>
                </div>
              </div>

              {/* Title Content (Mint theme header matching reference sketch) */}
              <div className="p-3 text-center bg-gradient-to-b from-emerald-50/40 to-white">
                <h2 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {payload.video_title || 'Video Title'}
                </h2>
                <div className="mt-1 text-[10px] text-emerald-700 font-medium">
                  {userVideo.video?.channel_name || 'VidMind Knowledge Hub'}
                </div>
              </div>
            </div>

            {/* ── Render Circular Orbit Group Nodes (Click to Fly & Expand Satellite Arc) ── */}
            {hubLayout.map(({ group, groupX, groupY, groupAngle, isExp, children }) => {
              const allGroupNodes = getNodesForGroup(group.id)
              const firstNode = allGroupNodes[0]
              const lastNode = allGroupNodes[allGroupNodes.length - 1]
              const timestampLabel = firstNode
                ? `${formatTime(firstNode.start_seconds)} – ${formatTime(lastNode?.end_seconds || firstNode.start_seconds)}`
                : '00:00'
              const isHovered = hoveredGroupId === group.id
              const isFocusedGroup = focusedGroupId === group.id
              const isDimmed = isFocused && !isFocusedGroup

              return (
                <React.Fragment key={`hub-group-${group.id}`}>
                  {/* Chapter Card with Title, Summary, and Topic Highlights */}
                  <div
                    onMouseEnter={() => setHoveredGroupId(group.id)}
                    onMouseLeave={() => setHoveredGroupId(null)}
                    onClick={() => handleGroupClick(group, groupX, groupY, groupAngle)}
                    className={cn(
                      'absolute z-20 -translate-x-1/2 -translate-y-1/2 w-[220px] p-3 rounded-2xl cursor-pointer shadow-sm border transition-all duration-300 select-none text-left',
                      'bg-[#EEF0FF] border-[#C7D2FE] text-[#312E81] hover:border-indigo-400 hover:shadow-md active:scale-95',
                      isFocusedGroup && 'ring-2 ring-indigo-500 shadow-lg scale-105',
                      isDimmed && 'opacity-20 pointer-events-none'
                    )}
                    style={{ left: groupX, top: groupY }}
                  >
                    {/* Header Row: Title & Concept Count */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="text-xs font-bold text-[#1E1B4B] leading-tight line-clamp-1">
                        {group.label.replace(/^Pillar \d+:?\s*/i, '').replace(/^Chapter \d+:?\s*/i, '')}
                      </div>
                      {allGroupNodes.length > 0 && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-700 font-mono font-semibold">
                          {allGroupNodes.length} nodes
                        </span>
                      )}
                    </div>

                    {/* Key Topic Highlights / Preview */}
                    {group.topics && group.topics.length > 0 ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {group.topics.slice(0, 3).map((topic, tIdx) => (
                          <span
                            key={`topic-pill-${group.id}-${tIdx}`}
                            className="text-[9px] text-[#4338CA] bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200/60 font-medium truncate max-w-[200px]"
                          >
                            • {topic}
                          </span>
                        ))}
                      </div>
                    ) : group.summary ? (
                      <div className="mt-1 text-[10px] text-indigo-900/70 line-clamp-2 leading-tight">
                        {group.summary}
                      </div>
                    ) : null}

                    {/* Footer Row: Timestamp range & explore cue */}
                    <div className="mt-2 pt-1.5 border-t border-indigo-200/50 flex items-center justify-between text-[10px] text-[#4338CA] font-medium">
                      <span className="font-mono flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-indigo-400" />
                        {timestampLabel}
                      </span>
                      <span className="text-[9px] font-semibold text-indigo-600">
                        {isExp ? 'Close' : 'Explore'}
                      </span>
                    </div>
                  </div>

                  {/* Child Node Cards arranged in an Outward Crescent Radial Arc */}
                  {isExp &&
                    children.map(({ node, x, y }) => {
                      const isSelected = selectedNodeId === node.id
                      const isChildHovered = hoveredNodeId === node.id
                      const thumb = getNodeThumbnail(node)
                      const badge = getNodeTypeBadge(node.node_type || node.category)

                      return (
                        <div
                          key={`child-card-${node.id}`}
                          onMouseEnter={() => setHoveredNodeId(node.id)}
                          onMouseLeave={() => setHoveredNodeId(null)}
                          onClick={() => onSelectNode(node)}
                          className={cn(
                            'absolute z-10 -translate-x-1/2 -translate-y-1/2 w-[195px] h-[68px] rounded-xl overflow-hidden cursor-pointer border shadow-xs transition-all duration-200 select-none bg-white flex items-center p-2 gap-2.5',
                            'hover:shadow-md hover:border-indigo-300 hover:scale-105',
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                              : 'border-slate-200',
                            isDimmed && 'opacity-20 pointer-events-none'
                          )}
                          style={{ left: x, top: y }}
                        >
                          {/* Miniature Preview Frame with Timestamp */}
                          <div className="relative w-[50px] h-[50px] shrink-0 rounded-lg overflow-hidden bg-slate-900 border border-slate-100">
                            {thumb ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={thumb}
                                alt={node.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-indigo-800 to-purple-800" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                            <div className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/80 text-[8px] font-mono text-white">
                              {formatTime(node.start_seconds)}
                            </div>
                          </div>

                          {/* Node Type Pill & Title */}
                          <div className="min-w-0 flex-1">
                            <span
                              className={cn(
                                'inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold border capitalize leading-tight mb-1',
                                badge.badgeClass
                              )}
                            >
                              {badge.label}
                            </span>
                            <div className="text-[11px] font-semibold text-slate-800 leading-snug line-clamp-2">
                              {node.title}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </React.Fragment>
              )
            })}

            {/* ── Compact Cards (for <= 4 nodes with no groups) ── */}
            {compactNodesLayout.map(({ node, x, y }) => {
              const isSelected = selectedNodeId === node.id
              const thumb = getNodeThumbnail(node)
              const badge = getNodeTypeBadge(node.node_type || node.category)

              return (
                <div
                  key={`compact-card-${node.id}`}
                  onClick={() => onSelectNode(node)}
                  className={cn(
                    'absolute z-10 -translate-x-1/2 -translate-y-1/2 w-[190px] h-[64px] rounded-xl overflow-hidden cursor-pointer border shadow-xs transition-all select-none bg-white flex items-center p-2 gap-2',
                    isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md' : 'border-slate-200'
                  )}
                  style={{ left: x, top: y }}
                >
                  {thumb && (
                    <div className="relative w-[48px] h-[48px] shrink-0 rounded-lg overflow-hidden bg-slate-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={thumb} alt={node.title} className="w-full h-full object-cover" />
                      <div className="absolute bottom-0.5 right-0.5 px-1 rounded bg-black/80 text-[8px] font-mono text-white">
                        {formatTime(node.start_seconds)}
                      </div>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className={cn('inline-block text-[9px] px-1.5 py-0.2 rounded font-semibold border capitalize mb-0.5', badge.badgeClass)}>
                      {badge.label}
                    </span>
                    <div className="text-[11px] font-semibold text-slate-800 line-clamp-2">{node.title}</div>
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

export default MindmapCanvas
