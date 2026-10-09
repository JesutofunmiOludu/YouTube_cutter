// ============================================================
// VidMind AI — SegmentFocusModal Component
// components/canvas/SegmentFocusModal.tsx
//
// Modal opened when clicking a node in the Radial Knowledge Canvas.
// Focuses interaction strictly on that specific point/timestamp
// in the video: dedicated player, verbatim segment transcript,
// grounded segment AI chat, and quick clip actions.
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import {
  X,
  Play,
  Pause,
  MessageSquare,
  FileText,
  Sparkles,
  Scissors,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Clock,
  ExternalLink,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import { useToast } from '@/components/ui/Toast'
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
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
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
}) => {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'chat' | 'transcript' | 'takeaways'>('chat')

  // Mobile video panel collapsed state
  const [videoCollapsed, setVideoCollapsed] = useState(false)

  // Chat state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Segment transcript state
  const [segmentLines, setSegmentLines] = useState<Array<{ id: string; start: number; end: number; text: string }>>([])
  const [loadingTranscript, setLoadingTranscript] = useState(false)
  const [copiedQuote, setCopiedQuote] = useState(false)

  // Reset or initialize on node change
  // Reset collapsed state when a new node is opened
  useEffect(() => {
    if (isOpen) setVideoCollapsed(false)
  }, [node?.id, isOpen])

  useEffect(() => {
    if (!node || !isOpen) return

    setMessages([
      {
        role: 'assistant',
        text: `I'm focused on **"${node.title}"** (${formatTime(node.start_seconds)} → ${formatTime(
          node.end_seconds
        )}). Ask me anything specifically about what was covered in this section!`,
      },
    ])
    setInputMessage('')

    // Fetch verbatim transcript for this specific segment window
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
            id: seg.id,
            start: Number(seg.start_seconds),
            end: Number(seg.end_seconds),
            text: seg.text,
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

  // Auto-scroll chat
  useEffect(() => {
    if (activeTab === 'chat' && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, activeTab])

  if (!isOpen || !node) return null

  const youtubeId = userVideo.video.youtube_id
  const duration = Math.max(0, node.end_seconds - node.start_seconds)
  const embedUrl = `https://www.youtube-nocookie.com/embed/${youtubeId}?start=${node.start_seconds}&end=${node.end_seconds}&autoplay=1&enablejsapi=1`

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = (customPrompt || inputMessage).trim()
    if (!textToSend || isSending) return

    const newMessages = [...messages, { role: 'user' as const, text: textToSend }]
    setMessages(newMessages)
    setInputMessage('')
    setIsSending(true)

    try {
      const res = await apiClient.post(`/videos/${userVideo.id}/segment-chat/`, {
        start_seconds: node.start_seconds,
        end_seconds: node.end_seconds,
        message: textToSend,
        history: newMessages.slice(-6),
      })
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.reply }])
    } catch (err: any) {
      console.error('Segment chat error', err)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I had trouble processing that request for this segment. Please try again.',
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleCopyQuote = () => {
    const quote = segmentLines.length > 0
      ? segmentLines.map((l) => l.text).join(' ')
      : `${node.title}: ${node.summary}`
    navigator.clipboard.writeText(`"${quote}" — [${formatTime(node.start_seconds)}]`)
    setCopiedQuote(true)
    toast.success('Segment quote copied to clipboard!')
    setTimeout(() => setCopiedQuote(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-5 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          'w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-2xl flex flex-col overflow-hidden animate-in duration-200',
          // Mobile: full-screen bottom sheet with rounded top corners
          'h-[95dvh] rounded-t-3xl sm:rounded-3xl',
          // Desktop: constrained max-width card
          'sm:max-w-4xl sm:h-[90vh] sm:max-h-[780px] zoom-in-95'
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Top Bar — mobile-first ── */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/50 flex items-center justify-between gap-2 shrink-0">
          {/* Left: color dot + title block */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
              style={{ backgroundColor: node.color || '#6366f1' }}
            />
            <div className="min-w-0">
              {/* Category + timestamp — stacked on mobile, inline on sm+ */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 shrink-0">
                  {node.category || 'Segment'}
                </span>
                <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-tertiary)] font-mono text-[var(--color-text-secondary)] shrink-0">
                  {formatTime(node.start_seconds)} → {formatTime(node.end_seconds)}
                  <span className="hidden sm:inline"> ({formatTime(duration)})</span>
                </span>
              </div>
              <h2 className="text-sm sm:text-body-md font-bold text-[var(--color-text-primary)] truncate mt-0.5">
                {node.title}
              </h2>
            </div>
          </div>

          {/* Right: prev/next + close — touch-friendly */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--color-border-tertiary)] p-0.5">
              <button
                onClick={onPrevSegment}
                disabled={!hasPrev}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] disabled:opacity-30 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Previous Segment"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextSegment}
                disabled={!hasNext}
                className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-primary)] disabled:opacity-30 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Next Segment"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Main Layout: stacked on mobile, two-column on lg ── */}
        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 overflow-hidden">

          {/* ══ Left / Top Panel: Video + Quick Tools ══ */}
          <div className="lg:col-span-5 lg:border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/30 flex flex-col lg:overflow-y-auto shrink-0 lg:shrink">

            {/* Mobile: collapsible video section header */}
            <button
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

            {/* Collapsible body */}
            <div
              className={cn(
                'flex flex-col gap-3 lg:gap-4 p-4 lg:p-4 transition-all duration-300',
                videoCollapsed ? 'hidden lg:flex' : 'flex'
              )}
            >
              {/* Video Player */}
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

          {/* ══ Right / Bottom Panel: Tabs ══ */}
          <div className="lg:col-span-7 flex flex-col min-h-0 flex-1 bg-[var(--color-bg-primary)]">

            {/* Tabs Header — icon-only on xs, icon+short text on sm, full text on lg */}
            <div className="flex items-center border-b border-[var(--color-border-tertiary)] px-3 sm:px-4 shrink-0">
              {/* Chat tab */}
              <button
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

              {/* Transcript tab */}
              <button
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

              {/* Takeaways tab */}
              <button
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

            {/* Tab 1: Segment AI Chat */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                {/* Chat Stream */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-3.5 min-h-0"
                >
                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'flex flex-col max-w-[88%] rounded-2xl p-3 sm:p-3.5 text-sm sm:text-body-sm leading-relaxed',
                        msg.role === 'user'
                          ? 'ml-auto bg-primary-600 text-white rounded-br-xs'
                          : 'mr-auto bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] text-[var(--color-text-primary)] rounded-bl-xs'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex items-center gap-2 mr-auto bg-[var(--color-bg-secondary)] p-3 rounded-2xl text-[var(--color-text-tertiary)] text-caption">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-500" />
                      <span>Thinking about this segment…</span>
                    </div>
                  )}
                </div>

                {/* Pre-populated Prompt Pills — wraps on mobile */}
                <div className="px-3 sm:px-4 py-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/30 shrink-0">
                  <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] shrink-0">
                    Ask:
                  </span>
                  {[
                    'Summarize',
                    'Key takeaway',
                    'Explain simply',
                    'Flashcards',
                  ].map((promptText) => (
                    <button
                      key={promptText}
                      onClick={() => handleSendMessage(promptText)}
                      disabled={isSending}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:border-primary-400 hover:text-primary-600 text-[var(--color-text-secondary)] transition disabled:opacity-50 min-h-[32px] flex items-center"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>

                {/* Message Input */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSendMessage()
                  }}
                  className="p-3 border-t border-[var(--color-border-tertiary)] flex items-center gap-2 bg-[var(--color-bg-primary)] shrink-0 pb-safe"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={`Ask about ${formatTime(node.start_seconds)}…`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-sm sm:text-body-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:ring-2 focus:ring-primary-400 transition min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isSending}
                    className="w-11 h-11 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white flex items-center justify-center transition shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Segment Verbatim Transcript */}
            {activeTab === 'transcript' && (
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 sm:space-y-2.5 min-h-0">
                {loadingTranscript ? (
                  <div className="flex items-center justify-center py-12 gap-2 text-[var(--color-text-tertiary)]">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span className="text-body-sm">Loading transcript lines…</span>
                  </div>
                ) : segmentLines.length === 0 ? (
                  <div className="py-12 text-center text-[var(--color-text-tertiary)] space-y-2">
                    <FileText className="w-8 h-8 opacity-40 mx-auto" />
                    <p className="text-body-sm font-medium">No transcript available for this time range.</p>
                  </div>
                ) : (
                  segmentLines.map((line) => (
                    <div
                      key={line.id}
                      className="p-2.5 rounded-xl hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border-tertiary)] transition flex items-start gap-3 group"
                    >
                      <span className="px-1.5 py-0.5 rounded-md font-mono text-[10px] bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] shrink-0 mt-0.5">
                        {formatTime(line.start)}
                      </span>
                      <p className="text-sm sm:text-body-sm text-[var(--color-text-primary)] leading-relaxed">
                        {line.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab 3: Key Sub-Points & Relations */}
            {activeTab === 'takeaways' && (
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 min-h-0">
                <div className="space-y-2">
                  <h4 className="text-body-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px]">
                    Key Sub-Points & Action Items
                  </h4>
                  {node.sub_points && node.sub_points.length > 0 ? (
                    <ul className="space-y-2">
                      {node.sub_points.map((pt, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-tertiary)]"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0 mt-1.5"
                            style={{ backgroundColor: node.color || '#6366f1' }}
                          />
                          <span className="text-sm sm:text-body-sm text-[var(--color-text-primary)] leading-relaxed">
                            {pt}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-caption text-[var(--color-text-tertiary)]">
                      No specific sub-points generated for this node.
                    </p>
                  )}
                </div>

                {node.relations && node.relations.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-[var(--color-border-tertiary)]">
                    <h4 className="text-body-sm font-bold text-[var(--color-text-primary)] uppercase tracking-wider text-[11px]">
                      Connected Relationships
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {node.relations.map((rel, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-caption bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-500/20 font-medium"
                        >
                          <span>→ {rel.label}:</span>
                          <strong className="font-semibold">{rel.target_id}</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
