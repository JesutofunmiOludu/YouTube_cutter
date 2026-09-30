// ============================================================
// VidMind AI — ResearchVideoHeader Component
// components/research/ResearchVideoHeader.tsx
//
// Shows contextual video preview banner above topic highlights:
//  - 16:9 thumbnail preview with duration badge & play overlay
//  - Video title, YouTube channel attribution, publish stats
//  - AI synthesis status pills
//  - Quick actions (Split Player, Export, Share)
// ============================================================

import React, { useState } from 'react'
import Image from 'next/image'
import {
  Play,
  Share2,
  Download,
  CheckCircle2,
  Tv,
  Check,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import type { UserVideo } from '@/types'

export interface ResearchVideoHeaderProps {
  userVideo?: UserVideo | null
  cutsCount?: number
  sourcesCount?: number
  isSynthesized?: boolean
  isResearchProcessing?: boolean
  isVideoProcessing?: boolean
  onTogglePlayer?: () => void
  isPlayerOpen?: boolean
  onExport?: () => void
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

export const ResearchVideoHeader: React.FC<ResearchVideoHeaderProps> = ({
  userVideo,
  cutsCount = 0,
  sourcesCount = 0,
  isSynthesized = true,
  isResearchProcessing = false,
  isVideoProcessing = false,
  onTogglePlayer,
  isPlayerOpen = false,
  onExport,
  className,
}) => {
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const video = userVideo?.video
  const title = video?.title || 'Video Topic Research'
  const channel = video?.channel_name || 'YouTube Video'
  const duration = video?.duration_seconds ? formatDuration(video.duration_seconds) : '24:18'
  const thumbnail =
    video?.thumbnail_url ||
    (video?.youtube_id
      ? `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`
      : '/placeholder-video.jpg')

  const handleShare = async () => {
    try {
      if (typeof window !== 'undefined') {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        toast.success('Research session link copied!')
        setTimeout(() => setCopied(false), 2000)
      }
    } catch {
      toast.info('Share link copied')
    }
  }

  return (
    <div
      className={cn(
        'w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] rounded-2xl p-4 sm:p-5 shadow-xs transition-all',
        className
      )}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Thumbnail + Video metadata */}
        <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
          {/* Thumbnail preview */}
          <div
            onClick={onTogglePlayer}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onTogglePlayer?.()}
            className="group relative w-36 sm:w-44 aspect-video rounded-xl overflow-hidden shrink-0 bg-neutral-900 cursor-pointer shadow-sm border border-black/10 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
            title="Click to toggle synchronized video player"
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-400">
                <Tv className="w-6 h-6" />
              </div>
            )}
            {/* Play hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/90 text-neutral-900 flex items-center justify-center shadow-md">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
            {/* Duration pill */}
            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 text-white text-[10px] font-mono font-medium tracking-tight">
              {duration}
            </span>
          </div>

          {/* Details & Pills */}
          <div className="flex-1 min-w-0">
            {/* Status pills row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {isResearchProcessing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                  Deep Research In Progress
                </span>
              )}
              {isSynthesized && !isResearchProcessing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  AI Synthesis Complete
                </span>
              )}
              {isVideoProcessing && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20">
                  <Loader2 className="w-3 h-3 animate-spin text-primary-500" />
                  Mapping Video Topics…
                </span>
              )}
              {cutsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border border-[var(--color-border-tertiary)]">
                  {cutsCount} Chapters Mapped
                </span>
              )}
              {sourcesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-mono">
                  {sourcesCount} Citations Verified
                </span>
              )}
            </div>

            {/* Video Title */}
            <h2 className="text-body-md sm:text-heading-sm font-semibold text-[var(--color-text-primary)] leading-snug truncate-2-lines mb-1">
              {title}
            </h2>

            {/* Attribution row */}
            <p className="text-[12px] text-[var(--color-text-tertiary)] flex items-center gap-2 flex-wrap">
              <span className="font-medium text-[var(--color-text-secondary)]">{channel}</span>
              {video?.youtube_id && (
                <>
                  <span>•</span>
                  <a
                    href={`https://youtube.com/watch?v=${video.youtube_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:text-primary-500 transition-colors"
                  >
                    Watch on YouTube
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Quick actions toolbar */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[var(--color-border-tertiary)]">
          {onTogglePlayer && (
            <Button
              variant={isPlayerOpen ? 'primary' : 'secondary'}
              size="sm"
              leftIcon={<Tv className="w-3.5 h-3.5" />}
              onClick={onTogglePlayer}
              className="text-[12px]"
            >
              {isPlayerOpen ? 'Hide Player' : 'Split Player'}
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            onClick={handleShare}
            className="text-[12px]"
          >
            {copied ? 'Copied' : 'Share'}
          </Button>

          {onExport && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={onExport}
              className="text-[12px]"
            >
              Export
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

ResearchVideoHeader.displayName = 'ResearchVideoHeader'
export default ResearchVideoHeader
