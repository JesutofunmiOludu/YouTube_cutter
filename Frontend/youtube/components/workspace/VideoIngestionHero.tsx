// ============================================================
// VidMind AI — VideoIngestionHero Component
// components/workspace/VideoIngestionHero.tsx
//
// Rendered on /chat and /research when no session is selected.
// Displays the UnifiedIngestionBar (as in user screenshot) along
// with a hero header and optional quick-pick library videos.
// ============================================================

import React from 'react'
import { Sparkles, Play, Clock, FolderOpen, ArrowRight, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import {
  UnifiedIngestionBar,
  TranscriptionEngine,
  CategoryFilter,
} from './UnifiedIngestionBar'
import type { UserVideo } from '@/types'

export interface VideoIngestionHeroProps {
  badgeText: string
  title: string
  subtitle: string
  onProcess: (youtubeId: string, engine: TranscriptionEngine) => void | Promise<void>
  onSearch: (query: string, category: CategoryFilter, duration: string, order: string) => void
  onSelectLibraryVideo?: (video: UserVideo) => void | Promise<void>
  libraryVideos?: UserVideo[]
  libraryLoading?: boolean
  isProcessing?: boolean
  actionButtonLabel?: string
  className?: string
}

function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '00:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`
  }
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export const VideoIngestionHero: React.FC<VideoIngestionHeroProps> = ({
  badgeText,
  title,
  subtitle,
  onProcess,
  onSearch,
  onSelectLibraryVideo,
  libraryVideos = [],
  libraryLoading = false,
  isProcessing = false,
  actionButtonLabel = 'Launch',
  className,
}) => {
  return (
    <div
      className={cn(
        'flex-1 flex flex-col items-center justify-start min-h-0 overflow-y-auto px-4 py-8 sm:py-12',
        className
      )}
    >
      <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-7">
        
        {/* ── Top Hero Header ── */}
        <div className="flex flex-col items-center text-center gap-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 text-caption font-semibold border border-primary-500/20 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{badgeText}</span>
          </div>

          <h1 className="text-display-xs sm:text-display-sm md:text-display-md font-bold text-[var(--color-text-primary)] tracking-tight">
            {title}
          </h1>

          <p className="text-body-sm sm:text-body-md text-[var(--color-text-secondary)] leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* ── Main Unified Ingestion Bar ── */}
        <div className="w-full relative">
          {isProcessing && (
            <div className="absolute inset-0 z-20 bg-[var(--color-bg-primary)]/70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
              <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">
                Initializing video session…
              </p>
            </div>
          )}

          <UnifiedIngestionBar
            onProcess={onProcess}
            onSearch={onSearch}
          />
        </div>

        {/* ── Saved Library Videos Quick Pick ── */}
        {libraryVideos.length > 0 && onSelectLibraryVideo && (
          <div className="w-full space-y-3.5 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                <FolderOpen className="w-4 h-4 text-primary-500" />
                <span className="text-body-sm font-semibold text-[var(--color-text-primary)]">
                  Or pick a video from your library
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] font-mono text-[var(--color-text-tertiary)]">
                  {libraryVideos.length} saved
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {libraryVideos.slice(0, 6).map((uv) => {
                const vid = uv.video
                const thumb =
                  vid?.thumbnail_url ||
                  (vid?.youtube_id
                    ? `https://img.youtube.com/vi/${vid.youtube_id}/mqdefault.jpg`
                    : null)

                return (
                  <div
                    key={uv.id}
                    onClick={() => !isProcessing && onSelectLibraryVideo(uv)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && onSelectLibraryVideo(uv)}
                    className={cn(
                      'group flex flex-col rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] overflow-hidden cursor-pointer',
                      'hover:border-primary-500/50 hover:shadow-sm transition-all duration-200 text-left relative'
                    )}
                  >
                    {/* Thumbnail banner */}
                    <div className="relative w-full aspect-video bg-[var(--color-bg-tertiary)] overflow-hidden">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={vid?.title || 'Video'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-6 h-6 text-[var(--color-text-tertiary)]" />
                        </div>
                      )}

                      {/* Duration pill */}
                      {vid?.duration_seconds ? (
                        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-medium">
                          {formatDuration(vid.duration_seconds)}
                        </span>
                      ) : null}

                      {/* Hover play overlay */}
                      <div className="absolute inset-0 bg-primary-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-600 text-white text-caption font-semibold shadow-md">
                          <Play className="w-3 h-3 fill-white" />
                          <span>{actionButtonLabel}</span>
                        </span>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                      <p className="text-body-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {vid?.title || 'Untitled Video'}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                        {vid?.channel_name || 'YouTube Video'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

VideoIngestionHero.displayName = 'VideoIngestionHero'
export default VideoIngestionHero
