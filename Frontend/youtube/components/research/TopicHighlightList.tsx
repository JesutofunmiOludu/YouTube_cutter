// ============================================================
// VidMind AI — TopicHighlightList Component
// components/research/TopicHighlightList.tsx
//
// Renders the list of Video Topic Highlights with:
//  - Section title & chapter count badge
//  - Filter pills (All Topics, filter by keyword)
//  - Interactive TopicHighlightCard components
// ============================================================

import React, { useState, useMemo } from 'react'
import { Sparkles, Layers, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { TopicHighlightCard } from './TopicHighlightCard'
import type { VideoCut } from '@/types'

export interface TopicHighlightListProps {
  cuts: VideoCut[]
  selectedTopicTitle?: string | null
  onSelectTopic?: (topicTitle: string, mode: 'search' | 'deep_research') => void
  onSeekTimestamp?: (seconds: number) => void
  isLoading?: boolean
  isVideoProcessing?: boolean
  className?: string
}

export const TopicHighlightList: React.FC<TopicHighlightListProps> = ({
  cuts,
  selectedTopicTitle,
  onSelectTopic,
  onSeekTimestamp,
  isLoading = false,
  isVideoProcessing = false,
  className,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | string>('all')

  // Generate dynamic filters from cuts if available
  const filters = useMemo(() => {
    const list = [{ id: 'all', label: `All Topics (${cuts.length})` }]
    if (cuts.length > 0) {
      cuts.forEach((cut) => {
        if (cut.title && cut.title.length < 30) {
          list.push({ id: cut.title, label: cut.title })
        }
      })
    }
    return list.slice(0, 5)
  }, [cuts])

  const filteredCuts = useMemo(() => {
    if (activeFilter === 'all') return cuts
    return cuts.filter(
      (c) =>
        (c.title && c.title.toLowerCase().includes(activeFilter.toLowerCase())) ||
        (c.ai_rationale && c.ai_rationale.toLowerCase().includes(activeFilter.toLowerCase()))
    )
  }, [cuts, activeFilter])

  // 1. While video transcription / chapter analysis is running
  if (isVideoProcessing || isLoading) {
    return (
      <div className={cn('space-y-3.5', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-body-md font-semibold text-[var(--color-text-primary)]">
              Video Topic Highlights
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
              <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
              Mapping Chapters…
            </span>
          </div>
        </div>

        {/* Shimmer Placeholder Cards */}
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/60 animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-lg bg-[var(--color-bg-tertiary)]" />
                <div className="h-4 w-48 bg-[var(--color-bg-tertiary)] rounded" />
                <div className="ml-auto h-4 w-16 bg-[var(--color-bg-tertiary)] rounded" />
              </div>
              <div className="h-3 w-3/4 bg-[var(--color-bg-tertiary)] rounded" />
              <div className="flex items-center gap-2 pt-1">
                <div className="h-6 w-24 bg-[var(--color-bg-tertiary)] rounded-full" />
                <div className="h-6 w-20 bg-[var(--color-bg-tertiary)] rounded-full" />
              </div>
            </div>
          ))}
          <p className="text-[12px] text-center text-[var(--color-text-tertiary)] py-1 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" />
            AI is analyzing the audio transcript to detect natural chapter breaks and key discussion points.
          </p>
        </div>
      </div>
    )
  }

  // 2. Video finished processing but no distinct cuts detected
  if (cuts.length === 0) {
    return (
      <div className={cn('p-5 rounded-2xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/40 text-center space-y-2', className)}>
        <div className="w-8 h-8 mx-auto rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-600">
          <Layers className="w-4 h-4" />
        </div>
        <p className="text-body-sm font-medium text-[var(--color-text-primary)]">
          No automatic chapter highlights detected
        </p>
        <p className="text-[12px] text-[var(--color-text-tertiary)] max-w-md mx-auto">
          This video may not contain distinct chapter markers. You can still use the Command Dock below to ask questions or research specific topics.
        </p>
      </div>
    )
  }

  // 3. Render real cuts
  return (
    <div className={cn('space-y-3.5', className)}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-body-md font-semibold text-[var(--color-text-primary)]">
            Video Topic Highlights
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
            {cuts.length} Chapters Mapped
          </span>
        </div>

        {/* Filter chips */}
        {filters.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 max-w-full">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors',
                  activeFilter === f.id
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border-tertiary)]'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cards list */}
      <div className="grid grid-cols-1 gap-3">
        {filteredCuts.map((cut, idx) => (
          <TopicHighlightCard
            key={cut.id || idx}
            index={idx}
            cut={cut}
            isSelected={selectedTopicTitle === cut.title}
            onSelectTopic={onSelectTopic}
            onSeekTimestamp={onSeekTimestamp}
          />
        ))}
      </div>
    </div>
  )
}

TopicHighlightList.displayName = 'TopicHighlightList'
export default TopicHighlightList
