// ============================================================
// VidMind AI — TopicHighlightCard Component
// components/research/TopicHighlightCard.tsx
//
// Renders an individual video topic knowledge node with:
//  - Chapter badge (#01 · 02:14 - 08:35) & geometric node icon
//  - Topic title, category badge, and AI rationale description
//  - Interactive timestamp pills (click to seek player)
//  - "Ask AI About This" & "Deep Dive Report" action triggers
// ============================================================

import React from 'react'
import {
  Sparkles,
  Zap,
  Play,
  BookmarkCheck,
  Compass,
  Layers,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import type { VideoCut } from '@/types'

export interface TopicHighlightCardProps {
  index: number
  cut: VideoCut | {
    id: string
    cut_order: number
    start_seconds: number
    end_seconds: number
    title: string | null
    ai_rationale?: string | null
  }
  isSelected?: boolean
  onSelectTopic?: (topicTitle: string, mode: 'search' | 'deep_research') => void
  onSeekTimestamp?: (seconds: number) => void
  className?: string
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export const TopicHighlightCard: React.FC<TopicHighlightCardProps> = ({
  index,
  cut,
  isSelected = false,
  onSelectTopic,
  onSeekTimestamp,
  className,
}) => {
  const chapterNumber = String(index + 1).padStart(2, '0')
  const startTime = formatTime(cut.start_seconds)
  const endTime = formatTime(cut.end_seconds)
  const title = cut.title || `Chapter ${index + 1}`
  const description =
    cut.ai_rationale ||
    'Key conceptual segment identified and synthesized from the video transcript.'

  // Thematic color cycling for the 3 visual nodes (Indigo, Amber, Emerald)
  const nodeThemes = [
    {
      bg: 'bg-primary-500/10 text-primary-600 dark:text-primary-400 border-primary-500/20',
      iconBg: 'bg-primary-500/15 text-primary-500',
      borderHover: 'hover:border-primary-500/50',
      icon: Compass,
      relevance: '98% Relevance',
    },
    {
      bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      iconBg: 'bg-amber-500/15 text-amber-500',
      borderHover: 'hover:border-amber-500/50',
      icon: Layers,
      relevance: '95% Relevance',
    },
    {
      bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      iconBg: 'bg-emerald-500/15 text-emerald-500',
      borderHover: 'hover:border-emerald-500/50',
      icon: BookmarkCheck,
      relevance: '99% Relevance',
    },
  ]

  const theme = nodeThemes[index % nodeThemes.length]
  const NodeIcon = theme.icon

  return (
    <div
      className={cn(
        'group relative bg-[var(--color-bg-primary)] border rounded-2xl p-4 sm:p-5 shadow-xs transition-all duration-200',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/15 shadow-sm'
          : 'border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)] hover:shadow-sm',
        theme.borderHover,
        className
      )}
    >
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {/* Left: Geometric Chapter Node */}
        <div className="flex items-center sm:flex-col gap-2 shrink-0">
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center border shadow-2xs shrink-0 transition-transform group-hover:scale-105',
              theme.iconBg,
              theme.bg
            )}
          >
            <NodeIcon className="w-5 h-5" />
          </div>
          <div className="flex sm:flex-col items-center sm:items-start text-[11px] font-mono font-medium text-[var(--color-text-tertiary)]">
            <span className="font-semibold text-[var(--color-text-secondary)]">#{chapterNumber}</span>
            <span className="text-[10px] ml-1 sm:ml-0">{startTime}–{endTime}</span>
          </div>
        </div>

        {/* Center: Title, Description, Timestamps */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h3 className="text-body-md font-semibold text-[var(--color-text-primary)] leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {title}
            </h3>
            <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full border', theme.bg)}>
              {theme.relevance}
            </span>
          </div>

          {/* Description */}
          <p className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed mb-3">
            {description}
          </p>

          {/* Timestamps & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border-tertiary)]">
            {/* Timestamp pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSeekTimestamp?.(cut.start_seconds)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)] hover:text-primary-500 hover:border-primary-500/40 hover:bg-primary-50/15 transition-all shadow-2xs"
                title={`Jump to video at ${startTime}`}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>[{startTime}] Segment Start</span>
              </button>

              {cut.end_seconds > cut.start_seconds && (
                <button
                  type="button"
                  onClick={() => onSeekTimestamp?.(cut.end_seconds)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  title={`Jump to video at ${endTime}`}
                >
                  <span>[{endTime}] End</span>
                </button>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary-500" />}
                onClick={() => onSelectTopic?.(title, 'search')}
                className="text-[11px] font-medium h-7 px-2.5"
              >
                Ask AI
              </Button>

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Zap className="w-3.5 h-3.5" />}
                onClick={() => onSelectTopic?.(title, 'deep_research')}
                className="text-[11px] font-medium h-7 px-2.5"
              >
                Deep Research
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

TopicHighlightCard.displayName = 'TopicHighlightCard'
export default TopicHighlightCard
