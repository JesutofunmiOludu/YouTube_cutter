// components/research/SearchResultCard.tsx
//
// Perplexity-style search result card.
//
// Layout:
//   [Sources strip]        — favicon + title chips, horizontally scrollable
//   [Answer]               — AI answer with [N] citation badges, simple markdown
//   [Follow-up questions]  — clickable pill buttons

import React, { useState } from 'react'
import { ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { cn }                from '@/utils/cn'
import type { SearchResult, SearchSource } from '@/types'

// ── Helpers ───────────────────────────────────────────────────
function getDomain(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}
function getFaviconUrl(url: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}`
}

// ── Lightweight markdown → JSX renderer ──────────────────────
// Handles: **bold**, *italic*, `code`, bullet lists, numbered lists,
// ## headings, ### sub-headings, line breaks, and [N] citation badges.
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const nodes: React.ReactNode[] = []
  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = (key: string) => {
    if (listItems.length === 0) return
    if (listType === 'ul') {
      nodes.push(<ul key={key} className="list-disc list-inside space-y-0.5 my-1.5 text-[12px]">{listItems}</ul>)
    } else {
      nodes.push(<ol key={key} className="list-decimal list-inside space-y-0.5 my-1.5 text-[12px]">{listItems}</ol>)
    }
    listItems = []
    listType = null
  }

  lines.forEach((line, idx) => {
    // Headings
    if (line.startsWith('## ')) {
      flushList(`fl-${idx}`)
      nodes.push(<h2 key={idx} className="text-[13px] font-semibold text-[var(--color-text-primary)] mt-4 mb-1.5">{inlineRender(line.slice(3))}</h2>)
      return
    }
    if (line.startsWith('### ')) {
      flushList(`fl-${idx}`)
      nodes.push(<h3 key={idx} className="text-[12px] font-semibold text-[var(--color-text-secondary)] mt-3 mb-1">{inlineRender(line.slice(4))}</h3>)
      return
    }
    // Unordered list
    if (/^[-*•]\s/.test(line)) {
      if (listType !== 'ul') { flushList(`fl-${idx}`); listType = 'ul' }
      listItems.push(<li key={idx} className="text-[12px] text-[var(--color-text-primary)] leading-relaxed">{inlineRender(line.replace(/^[-*•]\s+/, ''))}</li>)
      return
    }
    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') { flushList(`fl-${idx}`); listType = 'ol' }
      listItems.push(<li key={idx} className="text-[12px] text-[var(--color-text-primary)] leading-relaxed">{inlineRender(line.replace(/^\d+\.\s+/, ''))}</li>)
      return
    }

    flushList(`fl-${idx}`)

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={idx} className="border-[var(--color-border-tertiary)] my-3" />)
      return
    }
    // Empty line
    if (line.trim() === '') {
      nodes.push(<div key={idx} className="h-1.5" />)
      return
    }
    // Normal paragraph
    nodes.push(
      <p key={idx} className="text-[12px] text-[var(--color-text-primary)] leading-relaxed mb-1.5">
        {inlineRender(line)}
      </p>
    )
  })
  flushList('end')
  return nodes
}

// Inline: **bold**, *italic*, `code`, [N] citation badges, links
function inlineRender(text: string): React.ReactNode {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[\d+\]|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  let keyN = 0

  while ((m = pattern.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      parts.push(<strong key={keyN++} className="font-semibold text-[var(--color-text-primary)]">{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('*')) {
      parts.push(<em key={keyN++} className="italic">{tok.slice(1, -1)}</em>)
    } else if (tok.startsWith('`')) {
      parts.push(
        <code key={keyN++} className="bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded text-[11px] font-mono text-[var(--color-text-primary)]">
          {tok.slice(1, -1)}
        </code>
      )
    } else if (/^\[\d+\]$/.test(tok)) {
      const n = tok.slice(1, -1)
      parts.push(
        <sup key={keyN++}>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-primary-600/20 text-primary-400 text-[8px] font-bold leading-none mx-0.5 align-super">
            {n}
          </span>
        </sup>
      )
    } else if (m[3]) {
      // Markdown link
      parts.push(
        <a key={keyN++} href={m[3]} target="_blank" rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 underline underline-offset-2">
          {m[2]}
        </a>
      )
    }
    last = m.index + tok.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

// ── Source Chip ───────────────────────────────────────────────
function SourceChip({ source }: { source: SearchSource }) {
  const [showTooltip, setShowTooltip] = useState(false)
  return (
    <div className="relative flex-shrink-0">
      <a
        href={source.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200',
          'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)]',
          'hover:border-primary-400/60 hover:bg-primary-50/10',
          'max-w-[180px] group cursor-pointer',
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="w-4 h-4 rounded-full bg-primary-600/20 text-primary-400 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
          {source.rank}
        </span>
        <img
          src={getFaviconUrl(source.url)}
          alt=""
          className="w-3.5 h-3.5 flex-shrink-0 opacity-70"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <span className="text-[11px] text-[var(--color-text-secondary)] truncate leading-tight">
          {getDomain(source.url)}
        </span>
        <ExternalLink className="w-2.5 h-2.5 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
      </a>

      {showTooltip && (
        <div className={cn(
          'absolute bottom-full left-0 mb-2 w-64 rounded-xl p-3 shadow-xl z-50',
          'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]',
          'pointer-events-none',
        )}>
          <p className="text-[11px] font-semibold text-[var(--color-text-primary)] leading-snug mb-1 line-clamp-2">
            {source.title}
          </p>
          {source.excerpt && (
            <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
              {source.excerpt}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main exported component ────────────────────────────────────
interface SearchResultCardProps {
  result:     SearchResult
  onFollowUp: (question: string) => void
  className?: string
}

export function SearchResultCard({ result, onFollowUp, className }: SearchResultCardProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false)
  const visibleSources = sourcesExpanded ? result.sources : result.sources.slice(0, 4)

  return (
    <div className={cn('flex flex-col gap-4', className)}>

      {/* ── Sources strip ───────────────────────────── */}
      {result.sources.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
              Sources
            </span>
            {result.sources.length > 4 && (
              <button
                onClick={() => setSourcesExpanded(p => !p)}
                className="flex items-center gap-1 text-[10px] text-primary-400 hover:text-primary-300 transition-colors"
              >
                {sourcesExpanded
                  ? <><ChevronUp className="w-3 h-3" />Show less</>
                  : <><ChevronDown className="w-3 h-3" />+{result.sources.length - 4} more</>}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleSources.map((src) => (
              <SourceChip key={src.id} source={src} />
            ))}
          </div>
        </div>
      )}

      {/* ── Answer ──────────────────────────────────── */}
      {result.answer && (
        <div className={cn(
          'rounded-xl border p-4',
          'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)]',
        )}>
          {renderMarkdown(result.answer)}
        </div>
      )}

      {/* ── Follow-up questions ─────────────────────── */}
      {result.follow_up_questions.length > 0 && (
        <div className="space-y-2">
          <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wide">
            Explore further
          </span>
          <div className="flex flex-col gap-1.5">
            {result.follow_up_questions.map((q, i) => (
              <button
                key={i}
                onClick={() => onFollowUp(q)}
                className={cn(
                  'text-left text-[12px] px-3 py-2.5 rounded-xl border transition-all duration-150',
                  'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)]',
                  'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                  'hover:border-primary-400/50 hover:bg-primary-50/10',
                  'flex items-start gap-2',
                )}
              >
                <span className="text-primary-400 font-bold mt-0.5 text-[10px] flex-shrink-0">↗</span>
                <span className="leading-snug">{q}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
