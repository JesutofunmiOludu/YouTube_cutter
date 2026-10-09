// ============================================================
// VidMind AI — Radial Knowledge Canvas Component
// components/canvas/RadialKnowledgeCanvas.tsx
//
// Interactive radial knowledge canvas where the video thumbnail
// sits at the center, and format-specific knowledge nodes
// (Mindmap, Cheatsheet, Concept Map, Blueprint, Timeline)
// radiate orbitally around it with animated SVG spokes.
// ============================================================

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import {
  Play,
  Clock,
  Sparkles,
  GitFork,
  BookOpen,
  Network,
  Cpu,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  ChevronRight,
  Search,
  ExternalLink,
  CheckCircle2,
  ListOrdered,
  ArrowRight,
  Info,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type {
  KnowledgeFormatType,
  KnowledgeFormatPayload,
  KnowledgeNode,
  UserVideo,
} from '@/types'

export interface RadialKnowledgeCanvasProps {
  payload: KnowledgeFormatPayload
  userVideo: UserVideo
  format: KnowledgeFormatType
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

// Format color themes and styling presets
const FORMAT_CONFIG: Record<
  KnowledgeFormatType,
  {
    name: string
    accent: string
    accentGlow: string
    strokeColor: string
    activeStroke: string
    badgeBg: string
    badgeText: string
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
    nodeLabel: string
    description: string
  }
> = {
  mindmap: {
    name: 'Mindmap',
    accent: '#8B5CF6',
    accentGlow: 'rgba(139, 92, 246, 0.45)',
    strokeColor: 'rgba(139, 92, 246, 0.4)',
    activeStroke: '#A78BFA',
    badgeBg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    badgeText: 'text-purple-400',
    icon: GitFork,
    nodeLabel: 'Mindmap Branch',
    description: 'Hierarchical conceptual branches radiating from core insights',
  },
  cheatsheet: {
    name: 'Cheatsheet',
    accent: '#F59E0B',
    accentGlow: 'rgba(245, 158, 11, 0.45)',
    strokeColor: 'rgba(245, 158, 11, 0.4)',
    activeStroke: '#FBBF24',
    badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    badgeText: 'text-amber-400',
    icon: BookOpen,
    nodeLabel: 'Key Takeaway',
    description: 'Quick reference digest with actionable notes and quotes',
  },
  concept_map: {
    name: 'Concept Map',
    accent: '#10B981',
    accentGlow: 'rgba(16, 185, 129, 0.45)',
    strokeColor: 'rgba(16, 185, 129, 0.4)',
    activeStroke: '#34D399',
    badgeBg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    badgeText: 'text-emerald-400',
    icon: Network,
    nodeLabel: 'Concept Entity',
    description: 'Interconnected nodes illustrating dependencies and relations',
  },
  blueprint: {
    name: 'Blueprint',
    accent: '#0EA5E9',
    accentGlow: 'rgba(14, 165, 233, 0.45)',
    strokeColor: 'rgba(14, 165, 233, 0.4)',
    activeStroke: '#38BDF8',
    badgeBg: 'bg-sky-500/10 border-sky-500/30 text-sky-400',
    badgeText: 'text-sky-400',
    icon: Cpu,
    nodeLabel: 'Architecture Module',
    description: 'Structured execution roadmap with modules and components',
  },
  timeline: {
    name: 'Timeline',
    accent: '#F43F5E',
    accentGlow: 'rgba(244, 63, 94, 0.45)',
    strokeColor: 'rgba(244, 63, 94, 0.4)',
    activeStroke: '#FB7185',
    badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
    badgeText: 'text-rose-400',
    icon: Clock,
    nodeLabel: 'Chronological Milestone',
    description: 'Sequenced progression tracking chronological video evolution',
  },
  standard: {
    name: 'Standard',
    accent: '#64748B',
    accentGlow: 'rgba(100, 116, 139, 0.3)',
    strokeColor: 'rgba(100, 116, 139, 0.3)',
    activeStroke: '#94A3B8',
    badgeBg: 'bg-slate-500/10 border-slate-500/30 text-slate-400',
    badgeText: 'text-slate-400',
    icon: Layers,
    nodeLabel: 'Standard Segment',
    description: 'Standard sequential workspace view',
  },
}

export const RadialKnowledgeCanvas: React.FC<RadialKnowledgeCanvasProps> = ({
  payload,
  userVideo,
  format,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  // Pan & Zoom state
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState<number>(0.95)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  // Search filter
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)

  const activeConfig = FORMAT_CONFIG[format] || FORMAT_CONFIG.mindmap
  const IconComponent = activeConfig.icon

  // Fallback nodes if payload is empty
  const nodes = useMemo(() => {
    return payload?.nodes && payload.nodes.length > 0 ? payload.nodes : []
  }, [payload])

  // Radial geometry calculation
  // Radius X and Radius Y to create a visually comfortable widescreen oval orbit
  const orbitGeometry = useMemo(() => {
    const count = Math.max(nodes.length, 1)
    // Expand radius dynamically if there are more nodes
    const baseRadiusX = count <= 6 ? 420 : count <= 9 ? 480 : 540
    const baseRadiusY = count <= 6 ? 320 : count <= 9 ? 370 : 420

    return nodes.map((node, index) => {
      // Angle: distribute uniformly starting from top-middle (-π / 2)
      const angle = (2 * Math.PI * index) / count - Math.PI / 2
      const x = Math.round(baseRadiusX * Math.cos(angle))
      const y = Math.round(baseRadiusY * Math.sin(angle))
      return {
        node,
        index,
        x,
        y,
        angle,
      }
    })
  }, [nodes])

  // Lookup map for coordinates (for relation lines)
  const coordsMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>()
    orbitGeometry.forEach((item) => {
      map.set(item.node.id, { x: item.x, y: item.y })
    })
    return map
  }, [orbitGeometry])

  // Filtered node check
  const isNodeMatching = useCallback(
    (node: KnowledgeNode) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        node.title.toLowerCase().includes(q) ||
        node.summary.toLowerCase().includes(q) ||
        node.category?.toLowerCase().includes(q) ||
        (node.sub_points && node.sub_points.some((p) => p.toLowerCase().includes(q)))
      )
    },
    [searchQuery]
  )

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only drag on canvas background, not on buttons or cards
    if ((e.target as HTMLElement).closest('.canvas-interactive-node')) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92
    setZoom((prevZoom) => {
      const next = prevZoom * zoomFactor
      return Math.min(Math.max(next, 0.4), 2.2)
    })
  }

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 2.2))
  const handleZoomOut = () => setZoom((z) => Math.max(z * 0.8, 0.4))
  const handleReset = () => {
    setZoom(0.95)
    setPan({ x: 0, y: 0 })
  }

  const youtubeThumbnail =
    userVideo.video?.youtube_id
      ? `https://img.youtube.com/vi/${userVideo.video.youtube_id}/hqdefault.jpg`
      : '/placeholder-video.png'

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className={cn(
        'relative w-full h-full overflow-hidden select-none bg-[#0B0F19]',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        className
      )}
      style={{
        backgroundImage: `
          radial-gradient(circle at center, rgba(30, 41, 59, 0.35) 0%, rgba(11, 15, 25, 0.95) 75%),
          radial-gradient(circle, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 28px 28px',
      }}
    >
      {/* ── Top Floating Header & Info Bar ── */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-2 max-w-md pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-700/60 shadow-xl">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${activeConfig.accent}25` }}
          >
            <IconComponent className="w-4 h-4" style={{ color: activeConfig.accent }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-200">
                {activeConfig.name} Canvas
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                {nodes.length} nodes
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {payload?.central_theme || activeConfig.description}
            </p>
          </div>
        </div>

        {/* Search filter in canvas */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${activeConfig.name.toLowerCase()} topics...`}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-900/75 backdrop-blur-md border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all shadow-md"
          />
        </div>
      </div>

      {/* ── Floating Controls (Zoom / Recenter / Format Tip) ── */}
      <div className="absolute bottom-5 right-5 z-20 flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-700/60 shadow-2xl pointer-events-auto">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          title="Reset View"
          className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1"
        >
          <RotateCcw className="w-3 h-3" />
          {Math.round(zoom * 100)}%
        </button>
      </div>

      {/* ── Canvas World Container ── */}
      <div
        className="w-full h-full relative transform-gpu transition-transform ease-out duration-75"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* Absolute center anchor for the radial universe */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0">
          {/* ── SVG Layer for Spokes and Relational Arcs ── */}
          <svg
            className="overflow-visible pointer-events-none absolute left-0 top-0"
            style={{ width: 1, height: 1 }}
          >
            <defs>
              {/* Glow filter */}
              <filter id="canvas-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Radial gradient spoke */}
              <linearGradient id="spoke-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activeConfig.accent} stopOpacity="0.8" />
                <stop offset="100%" stopColor={activeConfig.accent} stopOpacity="0.25" />
              </linearGradient>

              {/* Radial orbit ring stroke */}
              <linearGradient id="orbit-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={activeConfig.accent} stopOpacity="0.15" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.05" />
                <stop offset="100%" stopColor={activeConfig.accent} stopOpacity="0.15" />
              </linearGradient>

              <marker
                id="relation-arrow"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={activeConfig.accent} opacity="0.75" />
              </marker>
            </defs>

            {/* Orbit guideline ring */}
            <ellipse
              cx="0"
              cy="0"
              rx={orbitGeometry[0] ? Math.abs(orbitGeometry[0].x) || 480 : 480}
              ry={orbitGeometry[0] ? Math.abs(orbitGeometry[0].y) || 370 : 370}
              fill="none"
              stroke="url(#orbit-ring-gradient)"
              strokeWidth="1.5"
              strokeDasharray={format === 'timeline' ? '4 4' : '6 6'}
              className={format === 'timeline' ? 'animate-spin-slow' : ''}
              style={{ animationDuration: '90s' }}
            />

            {/* Timeline orbital loop glow if format is timeline */}
            {format === 'timeline' && (
              <ellipse
                cx="0"
                cy="0"
                rx={480}
                ry={370}
                fill="none"
                stroke={activeConfig.accent}
                strokeWidth="1"
                strokeOpacity="0.2"
              />
            )}

            {/* Cross-concept relation lines (for Concept Map) */}
            {format === 'concept_map' &&
              orbitGeometry.map(({ node, x: x1, y: y1 }) => {
                if (!node.relations || node.relations.length === 0) return null
                return node.relations.map((rel, rIdx) => {
                  const target = coordsMap.get(rel.target_id)
                  if (!target) return null
                  const midX = (x1 + target.x) / 2
                  const midY = (y1 + target.y) / 2
                  const curvature = 35
                  const cpX = midX + (y1 - target.y) * 0.15
                  const cpY = midY + (target.x - x1) * 0.15

                  return (
                    <g key={`rel-${node.id}-${rel.target_id}-${rIdx}`}>
                      <path
                        d={`M ${x1} ${y1} Q ${cpX} ${cpY} ${target.x} ${target.y}`}
                        fill="none"
                        stroke={activeConfig.accent}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        strokeOpacity="0.4"
                        markerEnd="url(#relation-arrow)"
                      />
                      {rel.label && (
                        <text
                          x={cpX}
                          y={cpY}
                          fill="#94A3B8"
                          fontSize="9"
                          fontWeight="600"
                          textAnchor="middle"
                          className="bg-slate-900 px-1"
                        >
                          {rel.label}
                        </text>
                      )}
                    </g>
                  )
                })
              })}

            {/* Primary Spokes: Radiating from Center Hub (0,0) to each Node (x, y) */}
            {orbitGeometry.map(({ node, x, y }) => {
              const isHovered = hoveredNodeId === node.id
              const isSelected = selectedNodeId === node.id
              const isMatch = isNodeMatching(node)

              // Cubic bezier curve for organic spoke bend
              const ctrl1X = x * 0.35 - y * 0.06
              const ctrl1Y = y * 0.35 + x * 0.06
              const ctrl2X = x * 0.75 - y * 0.03
              const ctrl2Y = y * 0.75 + x * 0.03

              const strokeOpacity = !isMatch
                ? 0.08
                : isSelected
                ? 1
                : isHovered
                ? 0.9
                : 0.35

              const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 1.5

              return (
                <g key={`spoke-${node.id}`}>
                  {/* Outer ambient glow path */}
                  {(isHovered || isSelected) && (
                    <path
                      d={`M 0 0 C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${x} ${y}`}
                      fill="none"
                      stroke={activeConfig.accent}
                      strokeWidth={strokeWidth + 4}
                      strokeOpacity={0.3}
                      filter="url(#canvas-glow)"
                    />
                  )}

                  {/* Core connector spoke */}
                  <path
                    d={`M 0 0 C ${ctrl1X} ${ctrl1Y}, ${ctrl2X} ${ctrl2Y}, ${x} ${y}`}
                    fill="none"
                    stroke={
                      isHovered || isSelected ? activeConfig.activeStroke : activeConfig.accent
                    }
                    strokeWidth={strokeWidth}
                    strokeOpacity={strokeOpacity}
                    strokeDasharray={format === 'blueprint' ? '4 3' : undefined}
                    className="transition-all duration-300"
                  />

                  {/* Pulse node connector dot at end */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : isHovered ? 5 : 3.5}
                    fill={isSelected ? '#FFFFFF' : activeConfig.accent}
                    stroke={activeConfig.accent}
                    strokeWidth="2"
                    className="transition-transform duration-200"
                  />
                </g>
              )
            })}
          </svg>

          {/* ── CENTER VIDEO HUB ── */}
          <div
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 z-10 canvas-interactive-node"
            style={{ width: 260 }}
          >
            {/* Ambient pulsing backlight */}
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-40 animate-pulse pointer-events-none"
              style={{ backgroundColor: activeConfig.accent }}
            />

            <div
              className={cn(
                'relative rounded-2xl overflow-hidden shadow-2xl border transition-all duration-300',
                'bg-slate-900/90 backdrop-blur-xl border-slate-700/80 hover:border-slate-500'
              )}
              style={{
                boxShadow: `0 10px 30px -10px ${activeConfig.accentGlow}`,
              }}
            >
              {/* Video thumbnail with overlay */}
              <div className="relative aspect-video w-full overflow-hidden bg-black/60 group">
                <img
                  src={youtubeThumbnail}
                  alt={userVideo.video?.title || 'Video'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                {/* Duration badge */}
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-black/80 text-white backdrop-blur-sm flex items-center gap-1 border border-white/10">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(userVideo.video?.duration_seconds || 0)}
                </div>

                {/* Central play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: activeConfig.accent }}
                  >
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>

                {/* Format pill at top of thumbnail */}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 backdrop-blur-md text-white border border-white/20 flex items-center gap-1">
                  <IconComponent className="w-3 h-3" style={{ color: activeConfig.accent }} />
                  {activeConfig.name}
                </div>
              </div>

              {/* Center Hub details */}
              <div className="p-3">
                <h3 className="text-xs font-semibold text-white line-clamp-1 leading-snug">
                  {userVideo.video?.title || 'Video Knowledge Hub'}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {userVideo.video?.channel_name || 'VidMind AI'}
                </p>

                {/* Central Theme pill */}
                {payload?.central_theme && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-1 text-[10px] text-slate-300">
                    <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="truncate italic">"{payload.central_theme}"</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── ORBITAL KNOWLEDGE NODES ── */}
          {orbitGeometry.map(({ node, index, x, y }) => {
            const isHovered = hoveredNodeId === node.id
            const isSelected = selectedNodeId === node.id
            const isMatch = isNodeMatching(node)
            const durationSec = Math.max(0, node.end_seconds - node.start_seconds)

            return (
              <div
                key={node.id}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => onSelectNode(node)}
                className={cn(
                  'absolute canvas-interactive-node cursor-pointer transition-all duration-300 transform-gpu',
                  !isMatch && 'opacity-25 grayscale pointer-events-none',
                  isSelected && 'scale-105 z-30',
                  !isSelected && isHovered && 'scale-102 z-20',
                  !isSelected && !isHovered && 'z-10'
                )}
                style={{
                  left: x,
                  top: y,
                  transform: 'translate(-50%, -50%)',
                  width: format === 'cheatsheet' ? 260 : 240,
                }}
              >
                {/* Node Card Container */}
                <div
                  className={cn(
                    'relative rounded-xl p-3.5 backdrop-blur-xl border transition-all duration-300 shadow-xl',
                    isSelected
                      ? 'bg-slate-900/95 border-2 shadow-2xl ring-4 ring-offset-0'
                      : 'bg-slate-900/85 border-slate-700/70 hover:border-slate-500 hover:bg-slate-900/95'
                  )}
                  style={{
                    borderColor: isSelected
                      ? activeConfig.accent
                      : isHovered
                      ? activeConfig.activeStroke
                      : undefined,
                    boxShadow: isSelected
                      ? `0 0 25px ${activeConfig.accentGlow}`
                      : isHovered
                      ? `0 8px 20px -5px ${activeConfig.accentGlow}`
                      : undefined,
                  }}
                >
                  {/* Top Bar: Order badge + Category + Timestamp */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: activeConfig.accent }}
                      >
                        {index + 1}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                        {node.category || activeConfig.nodeLabel}
                      </span>
                    </div>

                    {/* Timestamp seek badge */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                      <Play className="w-2.5 h-2.5 text-primary-400 fill-primary-400" />
                      {formatTime(node.start_seconds)}
                    </div>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug mb-1.5">
                    {node.title}
                  </h4>

                  {/* Summary */}
                  <p className="text-[11px] text-slate-300/90 line-clamp-2 leading-relaxed mb-2">
                    {node.summary}
                  </p>

                  {/* ── Format-Specific Body Enhancements ── */}

                  {/* 1. Mindmap: Sub-branch pills */}
                  {format === 'mindmap' && node.sub_points && node.sub_points.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                      {node.sub_points.slice(0, 2).map((point, pIdx) => (
                        <span
                          key={pIdx}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-medium truncate max-w-full"
                        >
                          • {point}
                        </span>
                      ))}
                      {node.sub_points.length > 2 && (
                        <span className="text-[9px] text-slate-500 self-center">
                          +{node.sub_points.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* 2. Cheatsheet: Key Takeaway highlight */}
                  {format === 'cheatsheet' && (
                    <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200/90 leading-tight flex items-start gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                      <div className="line-clamp-2">
                        {node.sub_points?.[0] || 'Direct actionable takeaway from this video segment.'}
                      </div>
                    </div>
                  )}

                  {/* 3. Concept Map: Linked relations pill */}
                  {format === 'concept_map' && node.relations && node.relations.length > 0 && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center gap-1 text-[10px] text-emerald-300">
                      <Network className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span className="truncate">
                        Linked to {node.relations.length} concept{node.relations.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  )}

                  {/* 4. Blueprint: Phase step indicator */}
                  {format === 'blueprint' && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-sky-300">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        Phase 0{index + 1}
                      </span>
                      <span className="text-slate-500">
                        {formatTime(node.start_seconds)} → {formatTime(node.end_seconds)}
                      </span>
                    </div>
                  )}

                  {/* 5. Timeline: Elapsed duration pill */}
                  {format === 'timeline' && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] text-rose-300 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Span: {durationSec}s
                      </span>
                      <span className="text-[10px] text-slate-400">Step {index + 1} of {nodes.length}</span>
                    </div>
                  )}

                  {/* Bottom Action strip */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 group-hover:text-slate-300 flex items-center gap-0.5">
                      Interact
                      <ChevronRight className="w-3 h-3 text-slate-500" />
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectNode(node)
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold text-white transition-opacity flex items-center gap-1"
                      style={{ backgroundColor: activeConfig.accent }}
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
      </div>
    </div>
  )
}
export default RadialKnowledgeCanvas
