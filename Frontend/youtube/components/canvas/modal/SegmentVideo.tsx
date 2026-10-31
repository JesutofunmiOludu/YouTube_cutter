// ============================================================
// VidMind AI — SegmentVideo Component
// components/canvas/modal/SegmentVideo.tsx
//
// Left/Top side video panel for SegmentFocusModal:
//   • Embedded YouTube iframe player looped to segment range
//   • Collapsible panel on mobile screens
//   • Segment overview card with AI summary
//   • Copy timestamped quote & external YouTube link
// ============================================================

import React, { useState } from 'react'
import {
  Play,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToast } from '@/components/ui/Toast'
import type { KnowledgeNode, UserVideo } from '@/types'

export interface SegmentVideoProps {
  node: KnowledgeNode
  userVideo: UserVideo
  duration: number
  segmentLinesText?: string
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

export const SegmentVideo: React.FC<SegmentVideoProps> = ({
  node,
  userVideo,
  duration,
  segmentLinesText,
}) => {
  const { toast } = useToast()
  const [videoCollapsed, setVideoCollapsed] = useState(false)
  const [copiedQuote, setCopiedQuote] = useState(false)

  const youtubeId = userVideo.video.youtube_id
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?start=${node.start_seconds}&end=${node.end_seconds}&autoplay=1&enablejsapi=1`

  const handleCopyQuote = () => {
    const quote = segmentLinesText?.trim() || `${node.title}: ${node.summary}`
    navigator.clipboard.writeText(`"${quote}" — [${formatTime(node.start_seconds)}]`)
    setCopiedQuote(true)
    toast.success('Segment quote copied to clipboard!')
    setTimeout(() => setCopiedQuote(false), 2000)
  }

  return (
    <div className="lg:col-span-5 lg:border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/30 flex flex-col lg:overflow-y-auto shrink-0 lg:shrink">
      {/* Mobile: collapsible video section header */}
      <button
        type="button"
        onClick={() => setVideoCollapsed((v) => !v)}
        className="lg:hidden flex items-center justify-between w-full px-4 py-2.5 border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/50 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition"
        aria-expanded={!videoCollapsed}
      >
        <span className="flex items-center gap-2 text-[12px] font-semibold">
          <Play className="w-3.5 h-3.5 text-primary-500" />
          Video Preview
          <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
            {Math.round(duration)}s
          </span>
        </span>
        {videoCollapsed ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronUp className="w-4 h-4" />
        )}
      </button>

      {/* Video Content */}
      <div
        className={cn(
          'flex flex-col gap-3 lg:gap-4 p-4 lg:p-4 transition-all duration-300',
          videoCollapsed ? 'hidden lg:flex' : 'flex'
        )}
      >
        {/* Video Player Frame */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-[var(--color-border-tertiary)] shrink-0">
          <iframe
            src={embedUrl}
            title={node.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Segment Summary Card */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] space-y-2">
          <div className="flex items-center justify-between text-caption font-semibold text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              Segment Overview
            </span>
            <span className="text-[11px] font-mono text-[var(--color-text-tertiary)]">
              {Math.round(duration)}s
            </span>
          </div>
          <p className="text-body-sm text-[var(--color-text-primary)] leading-relaxed">
            {node.summary}
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-col gap-2 lg:mt-auto">
          <button
            type="button"
            onClick={handleCopyQuote}
            className="w-full py-2.5 px-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:border-primary-500/50 hover:bg-primary-50/20 text-body-sm font-medium text-[var(--color-text-primary)] flex items-center justify-center gap-2 transition min-h-[44px]"
          >
            {copiedQuote ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Quote Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-primary-500" />
                <span>Copy Timestamped Quote</span>
              </>
            )}
          </button>

          <a
            href={`https://www.youtube.com/watch?v=${youtubeId}&t=${node.start_seconds}s`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-3 rounded-xl bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-caption font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center justify-center gap-1.5 transition min-h-[44px]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Watch on YouTube</span>
          </a>
        </div>
      </div>
    </div>
  )
}

export default SegmentVideo

