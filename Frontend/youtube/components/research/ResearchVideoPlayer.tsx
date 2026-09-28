// ============================================================
// VidMind AI — ResearchVideoPlayer Component
// components/research/ResearchVideoPlayer.tsx
//
// Embedded synchronized video player for research sessions:
//  - Embeds YouTube iframe with timestamp seeking
//  - Clean window bar with close and external watch options
// ============================================================

import React from 'react'
import { X, ExternalLink, Tv } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface ResearchVideoPlayerProps {
  youtubeId?: string | null
  videoTitle?: string
  currentSeconds?: number
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const ResearchVideoPlayer: React.FC<ResearchVideoPlayerProps> = ({
  youtubeId,
  videoTitle = 'Synchronized Video Player',
  currentSeconds = 0,
  isOpen,
  onClose,
  className,
}) => {
  if (!isOpen || !youtubeId) return null

  const embedUrl = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${Math.floor(
    currentSeconds
  )}&enablejsapi=1`

  return (
    <div
      className={cn(
        'w-full bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl mb-4 animate-in fade-in slide-in-from-top-2 duration-200',
        className
      )}
    >
      {/* Player Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <Tv className="w-4 h-4 text-primary-400 shrink-0" />
          <span className="text-[12px] font-semibold truncate text-neutral-200">
            {videoTitle}
          </span>
          {currentSeconds > 0 && (
            <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
              at {Math.floor(currentSeconds / 60)}:
              {String(Math.floor(currentSeconds % 60)).padStart(2, '0')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://youtube.com/watch?v=${youtubeId}&t=${Math.floor(currentSeconds)}s`}
            target="_blank"
            rel="noreferrer"
            className="text-neutral-400 hover:text-white p-1 rounded transition-colors text-[11px] inline-flex items-center gap-1"
          >
            <span className="hidden sm:inline">Open on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors"
            title="Close video player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video Iframe Container */}
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={embedUrl}
          title={videoTitle}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}

ResearchVideoPlayer.displayName = 'ResearchVideoPlayer'
export default ResearchVideoPlayer
