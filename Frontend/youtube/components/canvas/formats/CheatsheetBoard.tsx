// ============================================================
// VidMind AI — Cheatsheet Board Component (Redesigned)
// components/canvas/formats/CheatsheetBoard.tsx
//
// High-density executive reference board:
//   • Clean light editorial theme matching modern study & reference guides
//   • Bento grid of actionable takeaways, instant copyable rules/formulas
//   • Node-type filter chips (Rules, Stats, Steps, Warnings, Quotes)
//   • Collapsible category group accordions
//   • 1-Click Markdown Export for easy note-taking integration
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
  ChevronRight,
  ChevronDown,
  Layers,
  Maximize2,
  Minimize2,
  FileDown,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToast } from '@/components/ui/Toast'
import { useGroupedNodes } from '@/hooks/useGroupedNodes'
import type { KnowledgeFormatPayload, KnowledgeNode, KnowledgeNodeType, UserVideo } from '@/types'

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
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all')
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
    availableTypes,
  } = useGroupedNodes(payload, true)

  const nodes = useMemo(() => payload?.nodes || [], [payload])
  const takeaways = useMemo(() => payload?.takeaways || [], [payload])

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

  // Copy individual snippet
  const handleCopySnippet = (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation()
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
        'w-full h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 text-slate-800 bg-[#FBFBFD]',
        className
      )}
      style={{
        backgroundImage: 'radial-gradient(circle, #E2E8F0 1.2px, transparent 1.2px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="max-w-6xl mx-auto space-y-6 pb-20">
        {/* ── Top Executive Takeaways Hero ── */}
        <div className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Executive Takeaways & Key Principles
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {payload?.central_theme || userVideo.video?.title}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleCopyAllMarkdown}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-xs transition-all active:scale-95 shrink-0"
            >
              {copiedAll ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Copied Markdown!</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Export Markdown</span>
                </>
              )}
            </button>
          </div>

          {/* Takeaways List */}
          {takeaways.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {takeaways.map((takeaway, idx) => (
                <div
                  key={`takeaway-${idx}`}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-medium"
                >
                  <span className="font-bold text-indigo-600 mr-1.5">0{idx + 1}.</span>
                  {takeaway}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Filter Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mr-2">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              Filter by:
            </span>

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
              All Types
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

          <div className="relative w-full sm:w-56">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference rules..."
              className="w-full pl-7 pr-2.5 py-1 text-xs rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* ── Categorized Sections Accordion / Bento Grid ── */}
        {isGrouped ? (
          <div className="space-y-6">
            {groups.map((group) => {
              const exp = isExpanded(group.id)
              const groupNodes = getNodesForGroup(group.id).filter(isMatch)
              if (groupNodes.length === 0 && searchQuery) return null

              return (
                <div key={group.id} className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleGroup(group.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none bg-slate-50/70 border-b border-slate-200/80 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {group.order}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">
                          {group.label.replace(/^Section \d+:?\s*/i, '')}
                        </h3>
                        {group.summary && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{group.summary}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                        {groupNodes.length} items
                      </span>
                      {exp ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Section Cards */}
                  {exp && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {groupNodes.map((node) => {
                        const isSelected = selectedNodeId === node.id

                        return (
                          <div
                            key={node.id}
                            onClick={() => onSelectNode(node)}
                            className={cn(
                              'p-3.5 rounded-xl border bg-white shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col justify-between group',
                              isSelected
                                ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                                : 'border-slate-200 hover:border-slate-300'
                            )}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {formatTime(node.start_seconds)}
                                </span>
                                {node.node_type && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-indigo-700 font-medium">
                                    {node.node_type}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {node.title}
                              </h4>
                              <p className="mt-1 text-xs text-slate-500 leading-relaxed line-clamp-3">
                                {node.summary}
                              </p>

                              {node.sub_points && node.sub_points.length > 0 && (
                                <ul className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                                  {node.sub_points.map((p, pIdx) => (
                                    <li key={pIdx} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                                      <span className="text-indigo-500 font-bold">•</span>
                                      <span>{p}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-mono text-[10px]">Click to inspect</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopySnippet(`${node.title}: ${node.summary}`, node.id, e)}
                                className="p-1 hover:text-slate-800 transition-colors"
                                title="Copy snippet"
                              >
                                {copiedSnippet === node.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
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
          /* Flat Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredNodes.map((node) => (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs hover:shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {formatTime(node.start_seconds)}
                  </span>
                  {node.node_type && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-indigo-700 font-medium">
                      {node.node_type}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-bold text-slate-800">{node.title}</h4>
                <p className="mt-1 text-xs text-slate-500">{node.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CheatsheetBoard
