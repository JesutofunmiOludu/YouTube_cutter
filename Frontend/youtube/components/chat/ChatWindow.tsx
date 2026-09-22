// ============================================================
// VidMind AI — ChatWindow Component
// src/components/chat/ChatWindow.tsx
//
// Main chat interface for a single session.
// Shows message list, attached video chips, input bar,
// collapsible Summary & Topics drawer, and "add video" button.
// ============================================================

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  Send,
  Plus,
  X,
  Video,
  Lock,
  Sparkles,
  FileText,
  Play,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react'
import { cn }                    from '@/utils/cn'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import { IconButton }            from '@components/ui/Button'
import { EmptyState, EmptyIcons } from '@components/ui'
import { useToast }              from '@/components/ui/Toast'
import { formatDuration }        from '@/components/video/VideoCard'
import type { ChatSession, ChatMessage, User, UserVideo } from '@/types'

// ------------------------------------------------------------
// STARTER PROMPTS
// ------------------------------------------------------------

const STARTER_PROMPTS = [
  'Summarize key takeaways',
  'Explain the main topic in simple terms',
  'What are the key action points or lessons?',
  'Break down the highlighted topics in detail',
]

// ------------------------------------------------------------
// VIDEO OVERVIEW CONTENT (reusable in Starter & Drawer)
// ------------------------------------------------------------

export interface VideoOverviewContentProps {
  userVideo: UserVideo
  onSeek?: (seconds: number) => void
  onSelectPrompt?: (prompt: string) => void
  isDrawer?: boolean
}

export const VideoOverviewContent: React.FC<VideoOverviewContentProps> = ({
  userVideo,
  onSeek,
  onSelectPrompt,
  isDrawer = false,
}) => {
  const video = userVideo.video
  const cuts = userVideo.cuts ?? []
  const summaryText =
    video?.description ||
    'Video analysis and overview ready. Ask anything about this video to begin.'
  const [isExpandedSummary, setIsExpandedSummary] = useState(false)

  return (
    <div className={cn('flex flex-col gap-4 w-full', !isDrawer && 'max-w-2xl mx-auto py-2')}>
      {/* Video Overview Card */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded-2xl p-4 shadow-2xs overflow-hidden flex flex-col gap-3.5">
        
        {/* Header with thumbnail and metadata */}
        <div className="flex items-start gap-3.5">
          <div className="relative w-28 h-18 sm:w-36 sm:h-22 rounded-lg bg-[var(--color-bg-tertiary)] overflow-hidden shrink-0 border border-[var(--color-border-tertiary)] group">
            {video?.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title || 'Video thumbnail'}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Video className="w-6 h-6 text-[var(--color-text-tertiary)]" />
              </div>
            )}
            {video?.duration_seconds ? (
              <span className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                {formatDuration(video.duration_seconds)}
              </span>
            ) : null}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="inline-flex items-center gap-1.5 text-caption font-semibold text-primary-600 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Video Overview</span>
            </div>
            <h3 className="text-body-sm sm:text-body font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug">
              {video?.title || 'Video Title'}
            </h3>
            <div className="text-caption text-[var(--color-text-tertiary)] mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="truncate max-w-[140px]">{video?.channel_name || 'Channel'}</span>
              {video?.duration_seconds ? (
                <>
                  <span>•</span>
                  <span className="shrink-0">{formatDuration(video.duration_seconds)}</span>
                </>
              ) : null}
            </div>
            {userVideo.id && !userVideo.id.startsWith('uv_') && (
              <a
                href={`/workspace/${userVideo.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-primary-600 hover:text-primary-700 mt-1.5 hover:underline w-fit"
              >
                <span>Open in Workspace</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Summary Description */}
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-3.5 text-body-sm text-[var(--color-text-secondary)] leading-relaxed">
          <div className="flex items-center gap-2 mb-1.5 text-caption font-medium text-[var(--color-text-primary)]">
            <FileText className="w-3.5 h-3.5 text-primary-500" />
            <span>Summary & Details</span>
          </div>
          <p className={cn('text-body-sm text-[var(--color-text-secondary)]', !isExpandedSummary && 'line-clamp-3')}>
            {summaryText}
          </p>
          {summaryText.length > 200 && (
            <button
              type="button"
              onClick={() => setIsExpandedSummary(!isExpandedSummary)}
              className="mt-1.5 text-caption font-medium text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              {isExpandedSummary ? (
                <>Show less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>Read more <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>

        {/* Highlighted Topics / Cuts */}
        {cuts.length > 0 && (
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-caption font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Highlighted Topics ({cuts.length})
              </span>
              <span className="text-[11px] text-[var(--color-text-tertiary)]">
                Click any topic to discuss with AI
              </span>
            </div>

            <div className={cn(
              'grid gap-2 overflow-y-auto pr-1',
              isDrawer ? 'grid-cols-1 max-h-72' : 'grid-cols-1 sm:grid-cols-2 max-h-60'
            )}>
              {cuts.map((cut) => {
                const title = cut.title || `Segment ${cut.cut_order + 1}`
                return (
                  <div
                    key={cut.id || cut.cut_order}
                    onClick={() => {
                      const prompt = `Please provide a detailed explanation and breakdown of the topic "${title}" from this video.${cut.ai_rationale ? ` Context: ${cut.ai_rationale}` : ''}`
                      onSelectPrompt?.(prompt)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        const prompt = `Please provide a detailed explanation and breakdown of the topic "${title}" from this video.${cut.ai_rationale ? ` Context: ${cut.ai_rationale}` : ''}`
                        onSelectPrompt?.(prompt)
                      }
                    }}
                    className={cn(
                      'group/card flex items-start gap-2.5 p-2.5 rounded-xl text-left cursor-pointer transition-all',
                      'bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)]',
                      'hover:border-primary-400 hover:bg-primary-50/40 hover:shadow-xs active:scale-[0.99]',
                    )}
                    title={`Click to discuss "${title}" with AI`}
                  >
                    {/* Timestamp button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSeek?.(cut.start_seconds)
                      }}
                      className={cn(
                        'shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-medium',
                        'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 hover:border-primary-300 transition-colors',
                      )}
                      title={`Seek / jump to ${formatDuration(cut.start_seconds)}`}
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>{formatDuration(cut.start_seconds)}</span>
                    </button>

                    {/* Topic details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <p className="text-caption font-semibold text-[var(--color-text-primary)] truncate group-hover/card:text-primary-700 transition-colors">
                          {title}
                        </p>
                        <span className="opacity-0 group-hover/card:opacity-100 transition-opacity text-[10px] font-semibold text-primary-600 shrink-0 inline-flex items-center gap-0.5">
                          Discuss <ArrowRight className="w-2.5 h-2.5" />
                        </span>
                      </div>
                      {cut.ai_rationale && (
                        <p className="text-[11px] text-[var(--color-text-tertiary)] line-clamp-2 mt-0.5 leading-snug">
                          {cut.ai_rationale}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Discussion Call to Action & Starter Prompts */}
      <div className="bg-primary-50/70 border border-primary-100 rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-body-sm font-semibold text-primary-950">
              What would you like to talk about?
            </h4>
            <p className="text-caption text-primary-700">
              Click a topic above or select a starter prompt below:
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelectPrompt?.(prompt)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium text-left',
                'bg-white border border-primary-200 text-primary-900 shadow-2xs hover:bg-primary-50 hover:border-primary-400 active:scale-[0.98] transition-all',
              )}
            >
              <Sparkles className="w-3 h-3 text-primary-500 shrink-0" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ------------------------------------------------------------
// VIDEO CHIP — shows an attached video in the session header
// ------------------------------------------------------------

const VideoChip: React.FC<{
  userVideo:  UserVideo
  onRemove?:  () => void
  onClick?:   () => void
}> = ({ userVideo, onRemove, onClick }) => (
  <div className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1',
    'bg-primary-50 border border-primary-100',
    'rounded-full text-caption font-medium text-primary-800',
    'max-w-[170px]',
  )}>
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 truncate hover:text-primary-950 transition-colors text-left"
      title={`Click to view summary & topics for ${userVideo.video.title}`}
    >
      <Video className="w-3 h-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{userVideo.video.title}</span>
    </button>
    {onRemove && (
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${userVideo.video.title}`}
        className="shrink-0 hover:text-primary-900 transition-colors ml-0.5"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
)

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface ChatWindowProps {
  session?:       ChatSession | null
  currentUser?:   User | null
  isLoading?:     boolean
  isTyping?:      boolean
  onSendMessage?: (content: string) => void
  onAddVideo?:    () => void
  onRemoveVideo?: (userVideoId: string) => void
  onSeek?:        (seconds: number) => void
  className?:     string
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const ChatWindow: React.FC<ChatWindowProps> = ({
  session,
  currentUser,
  isLoading   = false,
  isTyping    = false,
  onSendMessage,
  onAddVideo,
  onRemoveVideo,
  onSeek,
  className,
}) => {
  const { toast } = useToast()
  const [input,      setInput]      = useState('')
  const [showDrawer, setShowDrawer] = useState(false)
  const [selectedVideoIdx, setSelectedVideoIdx] = useState(0)
  const messagesRef                 = useRef<HTMLDivElement>(null)
  const inputRef                    = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [session?.messages, isTyping])

  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return
    onSendMessage?.(trimmed)
    setInput('')
    inputRef.current?.focus()
  }, [input, onSendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const messages  = session?.messages ?? []
  const videos    = session?.videos   ?? []
  const canSend   = input.trim().length > 0 && !isLoading

  const currentVideo = videos[selectedVideoIdx] || videos[0]
  const totalCutsCount = videos.reduce((acc, v) => acc + (v.cuts?.length ?? 0), 0)

  const handleAddVideoClick = () => {
    if (videos.length >= 1) {
      toast.error('Multi-video chat sessions require a Premium subscription. Please upgrade to Premium.')
      return
    }
    onAddVideo?.()
  }

  return (
    <div className={cn('relative flex flex-col h-full overflow-hidden', className)}>

      {/* ── Session header ── */}
      <div className={cn(
        'shrink-0 px-4 py-2.5',
        'border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]',
        'flex items-center justify-between gap-3 z-10',
      )}>
        {/* Attached video chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {videos.length > 0 ? (
            videos.map((uv, idx) => (
              <VideoChip
                key={uv.id}
                userVideo={uv}
                onClick={() => {
                  setSelectedVideoIdx(idx)
                  setShowDrawer((prev) => (selectedVideoIdx === idx ? !prev : true))
                }}
                onRemove={onRemoveVideo ? () => onRemoveVideo(uv.id) : undefined}
              />
            ))
          ) : (
            <p className="text-caption text-[var(--color-text-tertiary)]">
              No videos attached to this session
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {videos.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDrawer((v) => !v)}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5',
                'text-caption font-medium rounded-md border transition-colors',
                showDrawer
                  ? 'bg-primary-50 text-primary-700 border-primary-300'
                  : 'text-[var(--color-text-secondary)] border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
              )}
              title="View video summary and pick topics anytime"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary-500" />
              <span className="hidden sm:inline">Summary & Topics</span>
              <span className="sm:hidden">Topics</span>
              {totalCutsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800">
                  {totalCutsCount}
                </span>
              )}
            </button>
          )}

          {/* Add video button */}
          {onAddVideo && (
            <button
              onClick={handleAddVideoClick}
              title={videos.length >= 1 ? 'Multi-video chat requires a Premium subscription' : undefined}
              className={cn(
                'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5',
                'text-caption font-medium',
                'border border-[var(--color-border-secondary)]',
                'rounded-md',
                videos.length >= 1
                  ? 'opacity-60 bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] cursor-pointer'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
                'transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
              )}
            >
              {videos.length >= 1 ? (
                <Lock className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
              ) : (
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              Add video
            </button>
          )}
        </div>
      </div>

      {/* ── Slide-over drawer: Summary & Topics (accessible anytime) ── */}
      {showDrawer && currentVideo && (
        <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-[420px] bg-[var(--color-bg-primary)] border-l border-[var(--color-border-tertiary)] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)] shrink-0 bg-[var(--color-bg-secondary)]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-body-sm font-semibold text-[var(--color-text-primary)]">
                Video Summary & Topics
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowDrawer(false)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* If multiple videos, switch tab */}
          {videos.length > 1 && (
            <div className="flex gap-1.5 px-4 py-2 border-b border-[var(--color-border-tertiary)] overflow-x-auto shrink-0 bg-[var(--color-bg-secondary)]">
              {videos.map((v, idx) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedVideoIdx(idx)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-caption truncate max-w-[150px] transition-colors',
                    selectedVideoIdx === idx
                      ? 'bg-primary-600 text-white font-medium'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                  )}
                >
                  {v.video.title}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            <VideoOverviewContent
              userVideo={currentVideo}
              onSeek={onSeek}
              onSelectPrompt={(p) => {
                onSendMessage?.(p)
                if (typeof window !== 'undefined' && window.innerWidth < 640) {
                  setShowDrawer(false)
                }
              }}
              isDrawer
            />
          </div>
        </div>
      )}

      {/* ── Messages ── */}
      <div
        ref={messagesRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
      >
        {messages.length === 0 && !isLoading ? (
          videos.length > 0 ? (
            <VideoOverviewContent
              userVideo={currentVideo}
              onSeek={onSeek}
              onSelectPrompt={(p) => onSendMessage?.(p)}
            />
          ) : (
            <EmptyState
              icon={EmptyIcons.chat}
              title="Start the conversation"
              description="Attach a video from your library or paste a YouTube URL to explore topics and chat."
              minHeight="200px"
            />
          )
        ) : (
          <>
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                user={currentUser}
                onSeek={onSeek}
              />
            ))}
            {messages.length === 1 && messages[0].role === 'assistant' && (
              <div className="flex flex-col gap-2 pt-1 pb-2">
                <p className="text-caption font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  Suggested questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => onSendMessage?.(prompt)}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-caption font-medium text-left',
                        'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)]',
                        'hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50/50 active:scale-[0.98] transition-all',
                      )}
                    >
                      <span>{prompt}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {isTyping && <TypingIndicator />}
          </>
        )}
      </div>

      {/* ── Input area ── */}
      <div className={cn(
        'shrink-0 px-4 py-3',
        'border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]',
      )}>
        <div className={cn(
          'flex items-end gap-2',
          'bg-[var(--color-bg-secondary)]',
          'border border-[var(--color-border-secondary)]',
          'rounded-xl px-3 py-2',
          'focus-within:border-primary-400',
          'focus-within:ring-2 focus-within:ring-primary-200',
          'transition-colors duration-fast',
        )}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask something about these videos…"
            rows={1}
            disabled={isLoading}
            aria-label="Message input"
            className={cn(
              'flex-1 bg-transparent border-none outline-none resize-none',
              'text-body-sm text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-tertiary)]',
              'max-h-32 overflow-y-auto',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />

          <IconButton
            aria-label="Send message"
            icon={<Send />}
            variant="primary"
            size="sm"
            disabled={!canSend}
            onClick={handleSend}
            className="shrink-0 mb-0.5"
          />
        </div>

        <p className="text-caption text-[var(--color-text-tertiary)] mt-1.5 px-1">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}

ChatWindow.displayName = 'ChatWindow'
export default ChatWindow
