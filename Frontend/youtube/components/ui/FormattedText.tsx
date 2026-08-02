// ============================================================
// VidMind AI — FormattedText Component
// src/components/ui/FormattedText.tsx
//
// Formats Markdown text (headings #, bold **, italic *, lists -, code ``, citations [N], links)
// into clean, beautifully styled React elements without showing raw syntax markers.
// ============================================================

import React from 'react'
import { cn } from '@/utils/cn'

export interface FormattedTextProps {
  content: string
  className?: string
  textSize?: 'xs' | 'sm' | 'base' | 'lg'
}

/** Render inline tokens: **bold**, *italic*, `code`, [N] citations, [title](url) links */
export function renderInlineMarkdown(text: string): React.ReactNode {
  // Regex matches:
  // 1. **bold** or __bold__
  // 2. *italic* or _italic_
  // 3. `code`
  // 4. [N] citations
  // 5. [link text](url)
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*]+\*(?!\*)|(?<!_)_[^_]+_(?!_)|`[^`]+`|\[\d+\]|\[([^\]]+)\]\((https?:\/\/[^)]+)\))/g

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyCounter = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]

    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={keyCounter++} className="font-semibold text-[var(--color-text-primary)]">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('__') && token.endsWith('__')) {
      parts.push(
        <strong key={keyCounter++} className="font-semibold text-[var(--color-text-primary)]">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={keyCounter++} className="italic text-[var(--color-text-secondary)]">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('_') && token.endsWith('_')) {
      parts.push(
        <em key={keyCounter++} className="italic text-[var(--color-text-secondary)]">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={keyCounter++}
          className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-tertiary)] px-1.5 py-0.5 rounded text-[11px] font-mono text-primary-400"
        >
          {token.slice(1, -1)}
        </code>
      )
    } else if (/^\[\d+\]$/.test(token)) {
      const num = token.slice(1, -1)
      parts.push(
        <sup key={keyCounter++}>
          <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-primary-600/20 text-primary-400 text-[9px] font-bold leading-none mx-0.5 align-super">
            {num}
          </span>
        </sup>
      )
    } else if (match[2] && match[3]) {
      // Markdown link [title](url)
      parts.push(
        <a
          key={keyCounter++}
          href={match[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-400 hover:text-primary-300 underline underline-offset-2 transition-colors"
        >
          {match[2]}
        </a>
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>
}

/** Render block-level Markdown elements (headings, code blocks, lists, hr, paragraphs) */
export const FormattedText: React.FC<FormattedTextProps> = ({
  content,
  className,
  textSize = 'sm',
}) => {
  if (!content) return null

  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []

  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ''

  let listItems: React.ReactNode[] = []
  let listType: 'ul' | 'ol' | null = null

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return
    if (listType === 'ul') {
      nodes.push(
        <ul key={`${keyPrefix}-ul`} className="list-disc list-inside space-y-1.5 my-2 pl-1">
          {listItems}
        </ul>
      )
    } else {
      nodes.push(
        <ol key={`${keyPrefix}-ol`} className="list-decimal list-inside space-y-1.5 my-2 pl-1">
          {listItems}
        </ol>
      )
    }
    listItems = []
    listType = null
  }

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd()

    // ── Code Block toggle ``` ────────────────────────────────
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        nodes.push(
          <div key={`code-${idx}`} className="my-3 rounded-xl overflow-hidden border border-[var(--color-border-secondary)] bg-slate-950 p-3.5 shadow-sm">
            {codeBlockLang && (
              <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mb-2 border-b border-slate-800 pb-1">
                {codeBlockLang}
              </div>
            )}
            <pre className="text-[12px] font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
              <code>{codeBlockLines.join('\n')}</code>
            </pre>
          </div>
        )
        codeBlockLines = []
        codeBlockLang = ''
        inCodeBlock = false
      } else {
        // Start code block
        flushList(`flush-${idx}`)
        inCodeBlock = true
        codeBlockLang = line.trim().slice(3).trim()
      }
      return
    }

    if (inCodeBlock) {
      codeBlockLines.push(rawLine)
      return
    }

    // ── Headings ──────────────────────────────────────────────
    if (line.startsWith('# ')) {
      flushList(`flush-${idx}`)
      nodes.push(
        <h1 key={`h1-${idx}`} className="text-heading-lg font-bold text-[var(--color-text-primary)] mt-5 mb-2.5 tracking-tight border-b border-[var(--color-border-tertiary)] pb-1.5">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      )
      return
    }

    if (line.startsWith('## ')) {
      flushList(`flush-${idx}`)
      nodes.push(
        <h2 key={`h2-${idx}`} className="text-heading-md font-semibold text-[var(--color-text-primary)] mt-4 mb-2 tracking-tight">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      )
      return
    }

    if (line.startsWith('### ')) {
      flushList(`flush-${idx}`)
      nodes.push(
        <h3 key={`h3-${idx}`} className="text-heading-sm font-medium text-[var(--color-text-primary)] mt-3 mb-1.5">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      )
      return
    }

    if (line.startsWith('#### ')) {
      flushList(`flush-${idx}`)
      nodes.push(
        <h4 key={`h4-${idx}`} className="text-body-sm font-semibold text-[var(--color-text-secondary)] mt-2.5 mb-1 uppercase tracking-wider">
          {renderInlineMarkdown(line.slice(5))}
        </h4>
      )
      return
    }

    // ── Unordered List (- item, * item, • item) ────────────────
    if (/^\s*[-*•]\s+/.test(line)) {
      if (listType !== 'ul') {
        flushList(`flush-${idx}`)
        listType = 'ul'
      }
      const itemText = line.replace(/^\s*[-*•]\s+/, '')
      listItems.push(
        <li key={`li-${idx}`} className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
          {renderInlineMarkdown(itemText)}
        </li>
      )
      return
    }

    // ── Ordered List (1. item) ────────────────────────────────
    if (/^\s*\d+\.\s+/.test(line)) {
      if (listType !== 'ol') {
        flushList(`flush-${idx}`)
        listType = 'ol'
      }
      const itemText = line.replace(/^\s*\d+\.\s+/, '')
      listItems.push(
        <li key={`li-${idx}`} className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
          {renderInlineMarkdown(itemText)}
        </li>
      )
      return
    }

    flushList(`flush-${idx}`)

    // ── Horizontal Rule (--- or ***) ──────────────────────────
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      nodes.push(<hr key={`hr-${idx}`} className="border-[var(--color-border-tertiary)] my-4" />)
      return
    }

    // ── Empty Line ────────────────────────────────────────────
    if (line.trim() === '') {
      nodes.push(<div key={`blank-${idx}`} className="h-2" />)
      return
    }

    // ── Normal Paragraph ──────────────────────────────────────
    nodes.push(
      <p key={`p-${idx}`} className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed mb-2.5">
        {renderInlineMarkdown(line)}
      </p>
    )
  })

  flushList('end')

  return <div className={cn('formatted-text space-y-1', className)}>{nodes}</div>
}

export default FormattedText
