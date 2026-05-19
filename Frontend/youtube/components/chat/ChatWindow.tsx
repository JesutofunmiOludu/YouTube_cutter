// ============================================================
// VidMind AI — ChatWindow Component
// src/components/chat/ChatWindow.tsx
//
// Main chat interface for a single session.
// Shows message list, attached video chips, input bar,
// and "add video" button.
// ============================================================

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { Send, Plus, X, Video }  from 'lucide-react'
import { cn }                    from '@/utils/cn'
import { MessageBubble, TypingIndicator } from './MessageBubble'
import { IconButton }            from '@components/ui/Button'
import { EmptyState, EmptyIcons } from '@components/ui'
import type { ChatSession, ChatMessage, User, UserVideo } from '@/types'

// ------------------------------------------------------------
// VIDEO CHIP — shows an attached video in the session header
// ------------------------------------------------------------

const VideoChip: React.FC<{
  userVideo:  UserVideo
  onRemove?:  () => void
}> = ({ userVideo, onRemove }) => (
  <div className={cn(
    'inline-flex items-center gap-1.5 px-2.5 py-1',
    'bg-primary-50 border border-primary-100',
    'rounded-full text-caption font-medium text-primary-800',
    'max-w-[160px]',
  )}>
    <Video className="w-3 h-3 shrink-0" aria-hidden="true" />
    <span className="truncate">{userVideo.video.title}</span>
    {onRemove && (
      <button
        onClick={onRemove}
        aria-label={`Remove ${userVideo.video.title}`}
        className="shrink-0 hover:text-primary-900 transition-colors"
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
  const [input,      setInput]      = useState('')
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

  return (
    <div className={cn('flex flex-col h-full', className)}>

      {/* ── Session header ── */}
      <div className={cn(
        'shrink-0 px-4 py-2.5',
        'border-b border-[var(--color-border-tertiary)]',
        'flex items-center justify-between gap-3',
      )}>
        {/* Attached video chips */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
          {videos.length > 0 ? (
            videos.map((uv) => (
              <VideoChip
                key={uv.id}
                userVideo={uv}
                onRemove={onRemoveVideo ? () => onRemoveVideo(uv.id) : undefined}
              />
            ))
          ) : (
            <p className="text-caption text-[var(--color-text-tertiary)]">
              No videos attached to this session
            </p>
          )}
        </div>

        {/* Add video button */}
        {onAddVideo && (
          <button
            onClick={onAddVideo}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-2.5 py-1.5',
              'text-caption font-medium',
              'border border-[var(--color-border-secondary)]',
              'rounded-md text-[var(--color-text-secondary)]',
              'hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
              'transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
            )}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add video
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={messagesRef}
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4"
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState
            icon={EmptyIcons.chat}
            title="Start the conversation"
            description="Ask anything about the attached video. I'll answer based on the content."
            minHeight="200px"
          />
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
            {isTyping && <TypingIndicator />}
          </>
        )}
      </div>

      {/* ── Input area ── */}
      <div className={cn(
        'shrink-0 px-4 py-3',
        'border-t border-[var(--color-border-tertiary)]',
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
