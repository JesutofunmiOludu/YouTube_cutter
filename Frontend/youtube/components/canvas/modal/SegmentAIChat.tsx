// ============================================================
// VidMind AI — SegmentAIChat Component
// components/canvas/modal/SegmentAIChat.tsx
//
// Grounded AI chat panel for SegmentFocusModal:
//   • Conversational interface scoped to node start/end times
//   • Quick prompt suggestion pills
//   • Auto-scrolling chat history
//   • Responsive input area with loading indicator
// ============================================================

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import type { KnowledgeNode, UserVideo } from '@/types'

export interface SegmentAIChatProps {
  node: KnowledgeNode
  userVideo: UserVideo
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

const QUICK_PROMPTS = [
  'Summarize',
  'Key takeaway',
  'Explain simply',
  'Flashcards',
]

export const SegmentAIChat: React.FC<SegmentAIChatProps> = ({
  node,
  userVideo,
}) => {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Initialize or reset assistant greeting when node changes
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: `I'm focused on **"${node.title}"** (${formatTime(node.start_seconds)} → ${formatTime(
          node.end_seconds
        )}). Ask me anything specifically about what was covered in this section!`,
      },
    ])
    setInputMessage('')
  }, [node.id, node.title, node.start_seconds, node.end_seconds])

  // Auto-scroll chat on new messages
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [messages, isSending])

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

  return (
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

      {/* Pre-populated Prompt Pills */}
      <div className="px-3 sm:px-4 py-2 flex flex-wrap items-center gap-1.5 border-t border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]/30 shrink-0">
        <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] shrink-0">
          Ask:
        </span>
        {QUICK_PROMPTS.map((promptText) => (
          <button
            key={promptText}
            type="button"
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
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}

export default SegmentAIChat

