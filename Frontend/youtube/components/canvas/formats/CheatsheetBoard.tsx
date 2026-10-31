// ============================================================
// VidMind AI — Cheatsheet Board Component
// components/canvas/formats/CheatsheetBoard.tsx
//
// High-density executive reference board. Replaces the floating
// circular canvas with a responsive Bento Grid of actionable
// takeaways, instant copyable rules/formulas, category filters,
// collapsible group sections, and 1-click Markdown export.
// ============================================================

import React, { useState, useMemo, useCallback } from 'react'
import {
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Play,
  Clock,
  Search,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Share2,
  FileDown,
  Layers,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToast } from '@/components/ui/Toast'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeNode, UserVideo } from '@/types'

export interface CheatsheetBoardProps {
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

export const CheatsheetBoard: React.FC<CheatsheetBoardProps> = ({
  payload,
  userVideo,
  onSelectNode,
  selectedNodeId,
  className,
}) => {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)
  const [copiedAll, setCopiedAll] = useState(false)

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
  const takeaways = useMemo(() => payload?.takeaways || [], [payload])

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

  // Filtered nodes (for flat mode or fallback)
  const filteredNodes = useMemo(() => {
    return nodes.filter(isMatch)
  }, [nodes, isMatch])

  // Copy individual snippet
  const handleCopySnippet = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSnippet(id)
    toast.success('Snippet copied to clipboard')
    setTimeout(() => setCopiedSnippet(null), 2000)
  }

  // Copy entire cheatsheet as Markdown
  const handleCopyAllMarkdown = () => {
    const mdLines: string[] = []
    mdLines.push(`# Cheatsheet: ${payload?.video_title || userVideo.video?.title || 'Video'}`)
    mdLines.push(`*Source: ${userVideo.video?.channel_name || 'YouTube'}*\n`)

    if (payload?.central_theme) {
      mdLines.push(`## Core Thesis\n> ${payload.central_theme}\n`)
    }

    if (takeaways.length > 0) {
      mdLines.push(`## Executive Takeaways`)
      takeaways.forEach((t) => mdLines.push(`- **${t}**`))
      mdLines.push('')
    }

    if (isGrouped && groups.length > 0) {
      groups.forEach((grp) => {
        mdLines.push(`## ${grp.label}`)
        if (grp.summary) mdLines.push(`*${grp.summary}*\n`)
        const cNodes = getNodesForGroup(grp.id)
        cNodes.forEach((n, i) => {
          mdLines.push(`### ${i + 1}. ${n.title} (${formatTime(n.start_seconds)})`)
          mdLines.push(`${n.summary}`)
          if (n.sub_points && n.sub_points.length > 0) {
            n.sub_points.forEach((p) => mdLines.push(`- ${p}`))
          }
          mdLines.push('')
        })
      })
    } else {
      mdLines.push(`## Topic Breakdown`)
      nodes.forEach((n, i) => {
        mdLines.push(`### ${i + 1}. ${n.title} (${formatTime(n.start_seconds)})`)
        mdLines.push(`${n.summary}`)
        if (n.sub_points && n.sub_points.length > 0) {
          n.sub_points.forEach((p) => mdLines.push(`- ${p}`))
        }
        mdLines.push('')
      })
    }

    navigator.clipboard.writeText(mdLines.join('\n'))
    setCopiedAll(true)
    toast.success('Full Markdown Cheatsheet copied to clipboard!')
    setTimeout(() => setCopiedAll(false), 2000)
  }

  return (
    <div
      className={cn(
        'w-full h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-100 bg-[#0B0F19]',
        className
      )}
      style={{
        backgroundImage: `
          radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.08) 0%, rgba(11, 15, 25, 0.98) 60%),
          radial-gradient(circle, rgba(245, 158, 11, 0.05) 1px, transparent 1px)
        `,
        backgroundSize: '100% 100%, 32px 32px',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* ── Top Executive Takeaways Hero ── */}
        <div className="relative rounded-2xl p-5 sm:p-6 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/20 border border-amber-500/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Executive Takeaways & Key Principles
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white leading-snug">
                {payload?.central_theme || userVideo.video?.title}
              </h2>
            </div>

            <button
              onClick={handleCopyAllMarkdown}
              className="self-start md:self-auto shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all font-sans"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? 'Copied Markdown' : 'Copy All Cheatsheet'}</span>
            </button>
          </div>

          {/* 3 Key Takeaways Cards */}
          {takeaways.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-amber-500/20">
              {takeaways.map((takeaway, idx) => (
                <div
                  key={idx}
                  className="group relative rounded-xl p-3 bg-slate-900/80 border border-amber-500/20 hover:border-amber-400/50 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0">
                      #{idx + 1}
                    </span>
                    <p className="text-xs text-amber-100/90 font-medium leading-relaxed">
                      {takeaway}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopySnippet(takeaway, `t-${idx}`)}
                    className="self-end text-[10px] text-amber-400/70 hover:text-amber-300 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copiedSnippet === `t-${idx}` ? (
                      <Check className="w-2.5 h-2.5" />
                    ) : (
                      <Copy className="w-2.5 h-2.5" />
                    )}
                    <span>{copiedSnippet === `t-${idx}` ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Toolbar: Filter, Search & Group Toggles ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl">
          {/* Group Filter Tabs (when grouped) */}
          {isGrouped ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setSelectedGroup('all')}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                  selectedGroup === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                )}
              >
                All Sections ({nodes.length})
              </button>
              {groups.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() => setSelectedGroup(grp.id)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all',
                    selectedGroup === grp.id
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  )}
                >
                  {grp.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs font-semibold text-slate-300">
              Reference Cards ({nodes.length})
            </div>
          )}

          {/* Search + Expand/Collapse Buttons */}
          <div className="flex items-center gap-2">
            {isGrouped && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={expandAll}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                  title="Expand All Sections"
                >
                  <Maximize2 className="w-3 h-3" />
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-medium flex items-center gap-1 transition-colors"
                  title="Collapse All Sections"
                >
                  <Minimize2 className="w-3 h-3" />
                  Collapse All
                </button>
              </div>
            )}

            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cheatsheet..."
                className="w-full pl-8 pr-3 py-1 rounded-lg bg-slate-950/80 border border-slate-700/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* ── HIERARCHICAL GROUPED SECTIONS (when isGrouped) ── */}
        {isGrouped && (
          <div className="space-y-6">
            {groups
              .filter((grp) => selectedGroup === 'all' || grp.id === selectedGroup)
              .map((grp) => {
                const cNodes = getNodesForGroup(grp.id).filter(isMatch)
                if (cNodes.length === 0 && searchQuery.trim()) return null
                const exp = isExpanded(grp.id)

                return (
                  <div
                    key={grp.id}
                    className="rounded-2xl bg-slate-900/60 border border-slate-800/90 shadow-xl overflow-hidden backdrop-blur-xl"
                  >
                    {/* Section Header */}
                    <div
                      onClick={() => toggleGroup(grp.id)}
                      className="cursor-pointer p-4 flex items-center justify-between bg-slate-900/90 hover:bg-slate-800/80 transition-colors border-b border-slate-800/70"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-xs font-bold shrink-0">
                          {grp.order}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{grp.label}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {cNodes.length} cards
                            </span>
                          </h3>
                          {grp.summary && (
                            <p className="text-[11px] text-slate-400 mt-0.5">{grp.summary}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-amber-400">
                        <span className="text-[11px] font-medium hidden sm:inline-block">
                          {exp ? 'Collapse' : 'Expand'}
                        </span>
                        {exp ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {/* Section Cards Bento Grid */}
                    {exp && (
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cNodes.map((node) => {
                          const isSelected = selectedNodeId === node.id

                          return (
                            <div
                              key={node.id}
                              onClick={() => onSelectNode(node)}
                              className={cn(
                                'group relative rounded-xl p-4 bg-slate-900/90 border transition-all duration-300 flex flex-col justify-between cursor-pointer',
                                isSelected
                                  ? 'border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/40 bg-slate-900'
                                  : 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 shadow-md'
                              )}
                            >
                              <div>
                                <div className="flex items-center justify-between text-[10px] mb-2">
                                  <span className="font-semibold text-amber-400 uppercase tracking-wider">
                                    {node.category || grp.label}
                                  </span>
                                  <div className="flex items-center gap-1 font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                    <Clock className="w-2.5 h-2.5 text-amber-400" />
                                    {formatTime(node.start_seconds)}
                                  </div>
                                </div>

                                <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug mb-1.5">
                                  {node.title}
                                </h4>

                                <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed mb-3">
                                  {node.summary}
                                </p>

                                {node.sub_points && node.sub_points.length > 0 && (
                                  <div className="space-y-1 pt-2 border-t border-slate-800/80 mb-3">
                                    {node.sub_points.map((point, pIdx) => (
                                      <div
                                        key={pIdx}
                                        className="text-[11px] text-slate-300/80 flex items-start gap-1.5 p-1 rounded bg-slate-950/40"
                                      >
                                        <span className="text-amber-400 font-bold">•</span>
                                        <span className="line-clamp-2">{point}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopySnippet(`${node.title}\n${node.summary}`, node.id)
                                  }}
                                  className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                                >
                                  {copiedSnippet === node.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedSnippet === node.id ? 'Copied' : 'Copy Card'}</span>
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onSelectNode(node)
                                  }}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 flex items-center gap-1 transition-colors"
                                >
                                  <Play className="w-2.5 h-2.5 fill-current" />
                                  Jump to Clip
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
        )}

        {/* ── FLAT FALLBACK BENTO GRID (when !isGrouped) ── */}
        {!isGrouped && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map((node) => {
              const isSelected = selectedNodeId === node.id

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node)}
                  className={cn(
                    'group relative rounded-xl p-4 bg-slate-900/90 border transition-all duration-300 flex flex-col justify-between cursor-pointer',
                    isSelected
                      ? 'border-amber-400 shadow-xl shadow-amber-500/10 ring-2 ring-amber-400/40 bg-slate-900'
                      : 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 shadow-md'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-2">
                      <span className="font-semibold text-amber-400 uppercase tracking-wider">
                        {node.category || 'Reference'}
                      </span>
                      <div className="flex items-center gap-1 font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        <Clock className="w-2.5 h-2.5 text-amber-400" />
                        {formatTime(node.start_seconds)}
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-snug mb-1.5">
                      {node.title}
                    </h4>

                    <p className="text-xs text-slate-300/90 line-clamp-3 leading-relaxed mb-3">
                      {node.summary}
                    </p>

                    {node.sub_points && node.sub_points.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-slate-800/80 mb-3">
                        {node.sub_points.map((point, pIdx) => (
                          <div
                            key={pIdx}
                            className="text-[11px] text-slate-300/80 flex items-start gap-1.5 p-1 rounded bg-slate-950/40"
                          >
                            <span className="text-amber-400 font-bold">•</span>
                            <span className="line-clamp-2">{point}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopySnippet(`${node.title}\n${node.summary}`, node.id)
                      }}
                      className="text-[10px] text-slate-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedSnippet === node.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedSnippet === node.id ? 'Copied' : 'Copy Card'}</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectNode(node)
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 flex items-center gap-1 transition-colors"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Jump to Clip
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

export default CheatsheetBoard
