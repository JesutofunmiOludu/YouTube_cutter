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
import { Sparkles, Layers } from 'lucide-react'
import { cn } from '@/utils/cn'
import { TopicHighlightCard } from './TopicHighlightCard'
import type { VideoCut } from '@/types'

export interface TopicHighlightListProps {
  cuts: VideoCut[]
  selectedTopicTitle?: string | null
  onSelectTopic?: (topicTitle: string, mode: 'search' | 'deep_research') => void
  onSeekTimestamp?: (seconds: number) => void
  className?: string
}

export const TopicHighlightList: React.FC<TopicHighlightListProps> = ({
  cuts,
  selectedTopicTitle,
  onSelectTopic,
  onSeekTimestamp,
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

  if (cuts.length === 0) {
    return null
  }

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
