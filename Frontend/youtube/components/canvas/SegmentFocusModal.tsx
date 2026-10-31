// ============================================================
// VidMind AI — SegmentFocusModal Component
// components/canvas/SegmentFocusModal.tsx
//
// Decomposed modal dialog opened when clicking a node in any visual canvas.
// Composed of focused sub-modules:
//   • SegmentHeader: Metadata, category, time range, prev/next nav & close
//   • SegmentVideo: Looped embedded video player, overview & quick actions
//   • SegmentAIChat: Grounded AI conversation for this timestamp window
//   • SegmentTranscript: Filtered verbatim transcript lines
//   • SegmentTakeaways: Key bullet points & connected relationships
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import { MessageSquare, FileText, BookOpen } from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import { SegmentHeader } from './modal/SegmentHeader'
import { SegmentVideo } from './modal/SegmentVideo'
import { SegmentAIChat } from './modal/SegmentAIChat'
import { SegmentTranscript, type SegmentTranscriptLine } from './modal/SegmentTranscript'
import { SegmentTakeaways } from './modal/SegmentTakeaways'
import type { KnowledgeNode, UserVideo } from '@/types'

export interface SegmentFocusModalProps {
  node: KnowledgeNode | null
  userVideo: UserVideo
  isOpen: boolean
  onClose: () => void
  onPrevSegment?: () => void
  onNextSegment?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  onSelectRelationNode?: (targetId: string) => void
}

export const SegmentFocusModal: React.FC<SegmentFocusModalProps> = ({
  node,
  userVideo,
  isOpen,
  onClose,
  onPrevSegment,
  onNextSegment,
  hasPrev = false,
  hasNext = false,
  onSelectRelationNode,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript' | 'takeaways'>('chat')
  const [segmentLines, setSegmentLines] = useState<SegmentTranscriptLine[]>([])
  const [loadingTranscript, setLoadingTranscript] = useState(false)

  // Keyboard navigation for modal: Escape to close, Left/Right arrows to navigate
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept typing in inputs or textareas
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        if (e.key === 'Escape') onClose()
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrevSegment) {
        e.preventDefault()
        onPrevSegment()
      } else if (e.key === 'ArrowRight' && hasNext && onNextSegment) {
        e.preventDefault()
        onNextSegment()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hasPrev, hasNext, onClose, onPrevSegment, onNextSegment])

  // Fetch verbatim transcript for this specific segment window
  useEffect(() => {
    if (!node || !isOpen) return

    setLoadingTranscript(true)
    apiClient
      .get(`/videos/${userVideo.id}/transcription/`)
      .then((res) => {
        const segments: any[] = res.data?.segments || []
        const filtered = segments
          .filter(
            (seg) =>
              Number(seg.start_seconds) >= node.start_seconds - 2 &&
              Number(seg.start_seconds) <= node.end_seconds + 2
          )
          .map((seg) => ({
            id: String(seg.id),
            start: Number(seg.start_seconds),
            end: Number(seg.end_seconds),
            text: String(seg.text || ''),
          }))
        setSegmentLines(filtered)
      })
      .catch(() => {
        setSegmentLines([])
      })
      .finally(() => {
        setLoadingTranscript(false)
      })
  }, [node, isOpen, userVideo.id])

  if (!isOpen || !node) return null

  const duration = Math.max(0, node.end_seconds - node.start_seconds)
  const segmentLinesText = segmentLines.map((l) => l.text).join(' ')

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          'w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-2xl flex flex-col overflow-hidden animate-in duration-200',
          // Mobile: bottom sheet
          'h-[95dvh] rounded-t-3xl sm:rounded-3xl',
          // Desktop: constrained modal card
          'sm:max-w-4xl sm:h-[90vh] sm:max-h-[780px] zoom-in-95'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="segment-modal-title"
      >
        {/* ── Top Bar ── */}
        <SegmentHeader
          node={node}
          duration={duration}
          onClose={onClose}
          onPrevSegment={onPrevSegment}
          onNextSegment={onNextSegment}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />

        {/* ── Main Layout: stacked on mobile, two-column on lg ── */}
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">
          {/* ══ Left / Top Panel: Video Player & Overview ══ */}
          <SegmentVideo
            node={node}
            userVideo={userVideo}
            duration={duration}
            segmentLinesText={segmentLinesText}
          />

          {/* ══ Right / Bottom Panel: Tabs ══ */}
          <div className="lg:col-span-7 flex flex-col min-h-0 flex-1 bg-[var(--color-bg-primary)]">
            {/* Tabs Header */}
            <div className="flex items-center border-b border-[var(--color-border-tertiary)] px-3 sm:px-4 shrink-0">
              {/* Chat Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('chat')}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 py-3 text-xs sm:text-body-sm font-semibold border-b-2 transition-colors -mb-px flex-1 sm:flex-none justify-center sm:justify-start sm:px-1 mr-2 sm:mr-4',
                  activeTab === 'chat'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">AI Chat</span>
              </button>

              {/* Transcript Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('transcript')}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 py-3 text-xs sm:text-body-sm font-semibold border-b-2 transition-colors -mb-px flex-1 sm:flex-none justify-center sm:justify-start sm:px-1 mr-2 sm:mr-4',
                  activeTab === 'transcript'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Transcript</span>
                {segmentLines.length > 0 && (
                  <span className="text-[10px] px-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] font-mono hidden sm:inline">
                    {segmentLines.length}
                  </span>
                )}
              </button>

              {/* Takeaways / Sub-Points Tab */}
              <button
                type="button"
                onClick={() => setActiveTab('takeaways')}
                className={cn(
                  'flex items-center gap-1.5 sm:gap-2 py-3 text-xs sm:text-body-sm font-semibold border-b-2 transition-colors -mb-px flex-1 sm:flex-none justify-center sm:justify-start sm:px-1',
                  activeTab === 'takeaways'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="hidden xs:inline sm:inline">Sub-Points</span>
              </button>
            </div>

            {/* Tab 1: AI Chat */}
            {activeTab === 'chat' && (
              <SegmentAIChat node={node} userVideo={userVideo} />
            )}

            {/* Tab 2: Transcript */}
            {activeTab === 'transcript' && (
              <SegmentTranscript lines={segmentLines} isLoading={loadingTranscript} />
            )}

            {/* Tab 3: Takeaways & Relations */}
            {activeTab === 'takeaways' && (
              <SegmentTakeaways
                node={node}
                onSelectRelation={onSelectRelationNode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SegmentFocusModal
