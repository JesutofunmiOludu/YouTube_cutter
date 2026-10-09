// ============================================================
// VidMind AI — RelatedVideosSection Component
// components/video/RelatedVideosSection.tsx
//
// Displays AI-discovered related videos running "underground"
// in the background. Shown directly on the canvas without
// requiring the user to open a modal, with 1-click addition.
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Sparkles,
  ExternalLink,
  Plus,
  Play,
  RotateCw,
  Clock,
  Compass,
  Check,
  Eye,
  Loader2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import type { UserVideo, VideoRecommendation } from '@/types'

export interface RelatedVideosSectionProps {
  currentVideo: UserVideo | null | undefined
  onAddVideo?: (rec: VideoRecommendation) => Promise<void> | void
  actionLabel?: string
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

function formatViews(views?: number | null): string {
  if (!views) return ''
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`
  return `${views} views`
}

export const RelatedVideosSection: React.FC<RelatedVideosSectionProps> = ({
  currentVideo,
  onAddVideo,
  actionLabel = 'Add to Research',
  className,
}) => {
  const [recommendations, setRecommendations] = useState<VideoRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const videoId = currentVideo?.id

  // Fetch pre-computed underground recommendations
  const fetchRecommendations = useCallback(
    async (refresh = false) => {
      if (!videoId) return
      try {
        setIsLoading(true)
        setError(null)
        const res = await apiClient.get(`/videos/${videoId}/recommendations/`, {
          params: { refresh: refresh ? '1' : undefined },
        })
        const list: VideoRecommendation[] = res.data.results || []
        setRecommendations(list)
      } catch (err: any) {
        console.error('Failed to load related recommendations', err)
        setError('Could not load related video suggestions.')
      } finally {
        setIsLoading(false)
      }
    },
    [videoId]
  )

  useEffect(() => {
    if (videoId) {
      fetchRecommendations()
    } else {
      setRecommendations([])
    }
  }, [videoId, fetchRecommendations])

  const handleAction = async (rec: VideoRecommendation) => {
    if (!onAddVideo || addingId || addedIds.has(rec.youtube_id)) return
    try {
      setAddingId(rec.youtube_id)
      await onAddVideo(rec)
      setAddedIds((prev) => new Set(prev).add(rec.youtube_id))
    } catch (err) {
      console.error('Failed to add video from recommendations', err)
    } finally {
      setAddingId(null)
    }
  }

  // If no video is attached, do not render
  if (!currentVideo) return null

  return (
    <section
      className={cn(
        'w-full rounded-2xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/30 backdrop-blur-xs p-5 transition-all duration-200',
        className
      )}
    >
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--color-border-tertiary)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-body-md font-bold text-[var(--color-text-primary)]">
                Related Videos & Topics
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                AI Auto-Discovered
              </span>
            </div>
            <p className="text-caption text-[var(--color-text-secondary)] mt-0.5">
              Identified underground to expand your research, verify assertions, and enrich discussions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {recommendations.length > 0 && (
            <span className="text-[11px] font-mono text-[var(--color-text-tertiary)] px-2 py-0.5 rounded-md bg-[var(--color-bg-tertiary)] border border-[var(--color-border-tertiary)]">
              {recommendations.length} Suggestions
            </span>
          )}
          <button
            onClick={() => fetchRecommendations(true)}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50"
            title="Refresh related videos"
          >
            <RotateCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ── Content Grid ── */}
      {isLoading && recommendations.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] overflow-hidden animate-pulse flex flex-col"
            >
              <div className="w-full aspect-video bg-[var(--color-bg-tertiary)]" />
              <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-[var(--color-bg-tertiary)] rounded-sm w-5/6" />
                  <div className="h-3 bg-[var(--color-bg-tertiary)] rounded-sm w-3/5" />
                </div>
                <div className="h-7 bg-[var(--color-bg-tertiary)] rounded-lg w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-[var(--color-text-tertiary)]">
          <Compass className="w-7 h-7 opacity-40" />
          <p className="text-body-sm font-medium text-[var(--color-text-secondary)]">
            {error || 'No related recommendations found yet.'}
          </p>
          <button
            onClick={() => fetchRecommendations(true)}
            className="text-caption text-primary-600 hover:text-primary-700 underline underline-offset-2"
          >
            Run discovery now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {recommendations.map((rec) => {
            const isAdded = addedIds.has(rec.youtube_id)
            const isAdding = addingId === rec.youtube_id
            const relevancePct = Math.round(rec.relevance_score * 100)

            return (
              <div
                key={rec.id || rec.youtube_id}
                className={cn(
                  'group flex flex-col rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)] overflow-hidden transition-all duration-200',
                  'hover:border-primary-500/40 hover:shadow-xs'
                )}
              >
                {/* Thumbnail banner */}
                <div className="relative w-full aspect-video bg-[var(--color-bg-tertiary)] overflow-hidden">
                  <img
                    src={rec.thumbnail_url}
                    alt={rec.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {/* Duration overlay badge */}
                  {rec.duration_seconds > 0 && (
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md bg-black/80 text-white font-mono text-[10px] font-medium flex items-center gap-1 shadow-sm">
                      <Clock className="w-2.5 h-2.5 opacity-80" />
                      <span>{formatDuration(rec.duration_seconds)}</span>
                    </div>
                  )}
                  {/* Relevance badge */}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{relevancePct}% Match</span>
                  </div>
                  {/* YouTube link icon */}
                  <a
                    href={`https://www.youtube.com/watch?v=${rec.youtube_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-2 right-2 w-6 h-6 rounded-md bg-black/60 hover:bg-black/90 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Open on YouTube"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Card Content */}
                <div className="p-3 flex-1 flex flex-col justify-between gap-2.5">
                  <div className="space-y-1">
                    <h4
                      className="text-body-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-primary-600 transition-colors"
                      title={rec.title}
                    >
                      {rec.title}
                    </h4>
                    <div className="flex items-center justify-between text-caption text-[var(--color-text-tertiary)] text-[11px]">
                      <span className="truncate max-w-[120px] font-medium">
                        {rec.channel_name || 'YouTube'}
                      </span>
                      {rec.view_count ? (
                        <span className="shrink-0 flex items-center gap-0.5">
                          <Eye className="w-2.5 h-2.5" />
                          {formatViews(rec.view_count)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* 1-Click Action Button */}
                  {onAddVideo && (
                    <button
                      onClick={() => handleAction(rec)}
                      disabled={isAdded || isAdding}
                      className={cn(
                        'w-full py-1.5 px-3 rounded-lg text-caption font-semibold flex items-center justify-center gap-1.5 transition-colors duration-fast',
                        isAdded
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
                          : 'bg-[var(--color-bg-secondary)] hover:bg-primary-500 hover:text-white text-[var(--color-text-primary)] border border-[var(--color-border-secondary)]'
                      )}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Adding…</span>
                        </>
                      ) : isAdded ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Added to Session</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3 h-3" />
                          <span>{actionLabel}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
