// ============================================================
// VidMind AI — TranscriptPanel Component
// src/components/video/TranscriptPanel.tsx
//
// Full transcript viewer with:
//  - Searchable segments
//  - Clickable timestamps that seek the video player
//  - Active segment highlighting (synced with player time)
//  - Export buttons (TXT, PDF, Markdown)
// ============================================================

import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
} from 'react'
import { Search, Download, FileText, X } from 'lucide-react'
import { cn }                from '@/utils/cn'
import { Spinner }           from '@components/ui'
import { formatDuration }    from './VideoCard'
import type { Transcription, TranscriptSegment, ExportFormat } from '@/types'

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface TranscriptPanelProps {
  transcription?:   Transcription | null
  isLoading?:       boolean
  currentTime?:     number
  onSeek?:          (seconds: number) => void
  onExport?:        (format: ExportFormat) => void
  className?:       string
}

// ------------------------------------------------------------
// EXPORT BUTTONS
// ------------------------------------------------------------

const ExportButtons: React.FC<{
  onExport?: (format: ExportFormat) => void
}> = ({ onExport }) => {
  const formats: { label: string; format: ExportFormat }[] = [
    { label: 'TXT', format: 'txt' },
    { label: 'PDF', format: 'pdf' },
    { label: 'MD',  format: 'md'  },
  ]

  return (
    <div className="flex items-center gap-1">
      <FileText className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      <span className="text-caption text-[var(--color-text-tertiary)] mr-1">Export:</span>
      {formats.map(({ label, format }) => (
        <button
          key={format}
          onClick={() => onExport?.(format)}
          className={cn(
            'text-caption font-medium px-2 py-0.5 rounded',
            'border border-[var(--color-border-secondary)]',
            'text-[var(--color-text-secondary)]',
            'hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
            'transition-colors duration-fast',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
          )}
          aria-label={`Export as ${label}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ------------------------------------------------------------
// SEGMENT ROW
// ------------------------------------------------------------

const SegmentRow: React.FC<{
  segment:   TranscriptSegment
  isActive:  boolean
  query:     string
  onSeek?:   (seconds: number) => void
}> = ({ segment, isActive, query, onSeek }) => {
  const rowRef = useRef<HTMLDivElement>(null)

  // Auto-scroll active segment into view
  useEffect(() => {
    if (isActive) {
      rowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [isActive])

  // Highlight query match in text
  const highlightedText = useMemo(() => {
    if (!query.trim()) return segment.text
    const regex  = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts  = segment.text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="bg-warning-50 text-warning-800 rounded-sm">{part}</mark>
        : part
    )
  }, [segment.text, query])

  return (
    <div
      ref={rowRef}
      className={cn(
        'flex gap-3 px-3 py-2 rounded-md',
        'transition-colors duration-fast',
        isActive
          ? 'bg-primary-50/60 border-l-2 border-primary-600'
          : 'hover:bg-[var(--color-bg-secondary)]',
      )}
    >
      {/* Timestamp */}
      <button
        className={cn(
          'text-caption tabular-nums shrink-0 mt-0.5 w-10',
          'text-primary-600 hover:text-primary-800',
          'transition-colors duration-fast',
          'focus-visible:outline-none focus-visible:underline',
        )}
        onClick={() => onSeek?.(segment.start_seconds)}
        aria-label={`Seek to ${formatDuration(segment.start_seconds)}`}
      >
        {formatDuration(Math.round(segment.start_seconds))}
      </button>

      {/* Text */}
      <p
        className={cn(
          'text-body-sm leading-relaxed flex-1',
          isActive
            ? 'text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)]',
        )}
      >
        {highlightedText}
      </p>
    </div>
  )
}

// ------------------------------------------------------------
// MAIN COMPONENT
// ------------------------------------------------------------

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  transcription,
  isLoading   = false,
  currentTime = 0,
  onSeek,
  onExport,
  className,
}) => {
  const [query, setQuery] = useState('')

  const segments = transcription?.segments ?? []

  // Find the active segment based on current playback time
  const activeSegmentId = useMemo(() => {
    if (!currentTime || segments.length === 0) return null
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i]
      if (seg && currentTime >= seg.start_seconds) return seg.id
    }
    return segments[0]?.id ?? null
  }, [currentTime, segments])

  // Filter segments by search query
  const filteredSegments = useMemo(() => {
    if (!query.trim()) return segments
    const lower = query.toLowerCase()
    return segments.filter((s) => s.text.toLowerCase().includes(lower))
  }, [segments, query])

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <Spinner size="md" label="Transcribing video…" />
      </div>
    )
  }

  // No transcription yet
  if (!transcription) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
        <FileText className="w-10 h-10 text-[var(--color-text-tertiary)] mb-3" aria-hidden="true" />
        <p className="text-heading-sm text-[var(--color-text-primary)] mb-1">No transcript yet</p>
        <p className="text-body-sm text-[var(--color-text-secondary)]">
          Transcription will appear here once the video has been processed.
        </p>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[var(--color-border-tertiary)] shrink-0">
        {/* Search */}
        <div className={cn(
          'flex items-center gap-2 flex-1 h-8 px-2.5',
          'bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]',
          'rounded-md',
          'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200',
        )}>
          <Search className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search transcript…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-body-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            aria-label="Search transcript"
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear search">
              <X className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]" />
            </button>
          )}
        </div>

        {/* Export buttons */}
        <ExportButtons onExport={onExport} />
      </div>

      {/* Segment count when searching */}
      {query && (
        <div className="px-3 py-1.5 border-b border-[var(--color-border-tertiary)] shrink-0">
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {filteredSegments.length} result{filteredSegments.length !== 1 ? 's' : ''} for "{query}"
          </p>
        </div>
      )}

      {/* Segments */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredSegments.length > 0 ? (
          filteredSegments.map((segment) => (
            <SegmentRow
              key={segment.id}
              segment={segment}
              isActive={!query && segment.id === activeSegmentId}
              query={query}
              onSeek={onSeek}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              No segments match "{query}"
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

TranscriptPanel.displayName = 'TranscriptPanel'
export default TranscriptPanel
