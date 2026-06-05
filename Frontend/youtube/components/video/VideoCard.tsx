// ============================================================
// VidMind AI — VideoCard Component
// src/components/video/VideoCard.tsx
//
// Reusable card for displaying a YouTube video.
// Used in: Search results, Video library, Dashboard,
//          Related videos panel.
//
// Variants: grid | list | compact
// ============================================================

import React           from 'react'
import { Play, Clock } from 'lucide-react'
import { cn }          from '@/utils/cn'
import { StatusBadge } from '@components/ui/Badge'
import { Button }    from '@components/ui/Button'
import type { Video, UserVideo, ProcessingStatus } from '@/types'

// ------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatRelativeDate(dateStr: string): string {
  if (typeof window === 'undefined') {
    // Return empty string on server to avoid hydration mismatch
    return '';
  }
  const diffDays = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 86_400_000
  )
  if (diffDays === 0)  return 'Today'
  if (diffDays === 1)  return 'Yesterday'
  if (diffDays < 7)    return `${diffDays} days ago`
  if (diffDays < 30)   return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365)  return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

export const RelativeDate: React.FC<{ date: string }> = ({ date }) => {
  const [formatted, setFormatted] = React.useState('')

  React.useEffect(() => {
    setFormatted(formatRelativeDate(date))
  }, [date])

  return <>{formatted}</>
}


// ------------------------------------------------------------
// THUMBNAIL
// ------------------------------------------------------------

const Thumbnail: React.FC<{
  src?:     string | null
  title:    string
  duration: number
  height?:  string
}> = ({ src, title, duration, height = 'h-20' }) => {
  const [error, setError] = React.useState(false)

  return (
    <div className={cn('relative w-full bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden shrink-0', height)}>
      {src && !error ? (
        <img src={src} alt={title} className="w-full h-full object-cover" onError={() => setError(true)} loading="lazy" />
      ) : (
        <Play className="w-7 h-7 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      )}
      <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-medium px-1 py-0.5 rounded">
        {formatDuration(duration)}
      </span>
    </div>
  )
}

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export type VideoCardVariant = 'grid' | 'list' | 'compact'

export interface VideoCardProps {
  video?:       Video
  userVideo?:   UserVideo
  variant?:     VideoCardVariant
  actionLabel?: string
  onAction?:    () => void
  onClick?:     () => void
  cutCount?:    number
  className?:   string
}

// ------------------------------------------------------------
// GRID CARD
// ------------------------------------------------------------

const GridCard: React.FC<VideoCardProps> = ({
  video, userVideo, actionLabel, onAction, onClick, cutCount, className,
}) => {
  const v      = video ?? userVideo?.video
  const status = userVideo?.processing_status
  if (!v) return null

  return (
    <div
      className={cn(
        'flex flex-col bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-lg overflow-hidden transition-colors duration-fast',
        onClick && 'cursor-pointer hover:border-[var(--color-border-secondary)]',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <Thumbnail src={v.thumbnail_url} title={v.title} duration={v.duration_seconds} />

      <div className="p-2.5 flex flex-col gap-1.5 flex-1">
        <p className="text-caption text-[var(--color-text-tertiary)] truncate">{v.channel_name}</p>
        <h3 className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">{v.title}</h3>

        <div className="flex items-center gap-2 flex-wrap mt-auto pt-1">
          {status && <StatusBadge status={status} size="sm" />}
          {cutCount !== undefined && cutCount > 0 && (
            <span className="text-caption text-[var(--color-text-tertiary)]">{cutCount} cut{cutCount !== 1 ? 's' : ''}</span>
          )}
          {userVideo?.last_accessed_at && (
            <span className="text-caption text-[var(--color-text-tertiary)] ml-auto">
              <RelativeDate date={userVideo.last_accessed_at} />
            </span>
          )}
        </div>

        {actionLabel && onAction && (
          <Button variant="primary" size="sm" fullWidth className="mt-1" onClick={(e) => { e.stopPropagation(); onAction() }}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// LIST CARD
// ------------------------------------------------------------

const ListCard: React.FC<VideoCardProps> = ({
  video, userVideo, actionLabel, onAction, onClick, cutCount, className,
}) => {
  const v      = video ?? userVideo?.video
  const status = userVideo?.processing_status
  if (!v) return null

  return (
    <div
      className={cn(
        'flex gap-3 bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-lg overflow-hidden p-3 transition-colors duration-fast',
        onClick && 'cursor-pointer hover:border-[var(--color-border-secondary)]',
        className,
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="w-28 shrink-0 rounded-md overflow-hidden">
        <Thumbnail src={v.thumbnail_url} title={v.title} duration={v.duration_seconds} height="h-full" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-1">
        <div>
          <p className="text-caption text-[var(--color-text-tertiary)] mb-0.5 truncate">{v.channel_name}</p>
          <h3 className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2">{v.title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {status && <StatusBadge status={status} size="sm" />}
          {cutCount !== undefined && <span className="text-caption text-[var(--color-text-tertiary)]">{cutCount} cuts</span>}
          {actionLabel && onAction && (
            <Button variant="secondary" size="sm" className="ml-auto" onClick={(e) => { e.stopPropagation(); onAction() }}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// COMPACT CARD
// ------------------------------------------------------------

const CompactCard: React.FC<VideoCardProps> = ({
  video, userVideo, onClick, className,
}) => {
  const v      = video ?? userVideo?.video
  const status = userVideo?.processing_status as ProcessingStatus | undefined
  if (!v) return null

  return (
    <button
      className={cn(
        'w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-left transition-colors duration-fast hover:bg-[var(--color-bg-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        className,
      )}
      onClick={onClick}
    >
      <div className="w-10 h-7 rounded overflow-hidden shrink-0 bg-[var(--color-bg-tertiary)] flex items-center justify-center">
        {v.thumbnail_url
          ? <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" loading="lazy" />
          : <Play className="w-3 h-3 text-[var(--color-text-tertiary)]" aria-hidden="true" />
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{v.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3 h-3 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <span className="text-caption text-[var(--color-text-tertiary)]">{formatDuration(v.duration_seconds)}</span>
          {status && status !== 'completed' && <StatusBadge status={status} size="sm" />}
        </div>
      </div>
    </button>
  )
}

// ------------------------------------------------------------
// MAIN EXPORT
// ------------------------------------------------------------

const VideoCard: React.FC<VideoCardProps> = ({ variant = 'grid', ...props }) => {
  if (variant === 'list')    return <ListCard    {...props} />
  if (variant === 'compact') return <CompactCard {...props} />
  return <GridCard {...props} />
}

VideoCard.displayName = 'VideoCard'
export default VideoCard
