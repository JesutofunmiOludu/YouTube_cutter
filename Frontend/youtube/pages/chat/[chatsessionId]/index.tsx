'use client'

// src/app/(app)/chat/[sessionId]/page.tsx
// Also used as src/app/(app)/chat/page.tsx (no sessionId = new/list view)
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Plus, MessageSquare, Clock, Trash2, ChevronRight } from 'lucide-react'
import { cn }           from '@/utils/cn'
import { Button }       from '@/components/ui/Button'
import { IconButton }   from '@/components/ui/Button'
import { EmptyState, EmptyIcons } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast }     from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth.store'
import { AppShell }     from '@/components/layout/AppShell'
import { ChatWindow, AddVideoModal } from '@/components/chat'
import { apiClient }    from '@/utils/apiClient'
import { Spinner }      from '@/components/ui/Spinner'
import type { ChatSession, ChatMessage, UserVideo } from '@/types'

// ── Mock data ─────────────────────────────────────────────

const MOCK_SESSIONS: ChatSession[] = [
  { id: 'ch1', user_id: 'u1', title: 'React hooks deep dive',         is_multi_video: false, videos: [], messages: Array(14).fill(null), created_at: new Date(Date.now() - 3_600_000).toISOString(),   updated_at: new Date(Date.now() - 3_600_000).toISOString(),   last_message: null },
  { id: 'ch2', user_id: 'u1', title: 'Django vs FastAPI comparison',  is_multi_video: true,  videos: [], messages: Array(8).fill(null),  created_at: new Date(Date.now() - 86_400_000).toISOString(),  updated_at: new Date(Date.now() - 86_400_000).toISOString(),  last_message: null },
  { id: 'ch3', user_id: 'u1', title: 'PostgreSQL indexing explained', is_multi_video: false, videos: [], messages: Array(5).fill(null),  created_at: new Date(Date.now() - 259_200_000).toISOString(), updated_at: new Date(Date.now() - 259_200_000).toISOString(), last_message: null },
]

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', chat_session_id: 'ch1', role: 'user',      content: 'Can you explain how useState works with a simple example?',                                                                                       token_count: null, created_at: new Date(Date.now() - 120_000).toISOString() },
  { id: 'm2', chat_session_id: 'ch1', role: 'assistant', content: 'Sure! useState is a React hook that lets you add state to functional components. At [0:16:20] in the video, the instructor shows a counter example: you call useState(0) to initialise with zero, and it gives you back the current value and a setter function.',   token_count: null, created_at: new Date(Date.now() - 110_000).toISOString() },
  { id: 'm3', chat_session_id: 'ch1', role: 'user',      content: 'What about the difference between useState and useReducer?',                                                                                     token_count: null, created_at: new Date(Date.now() - 80_000).toISOString() },
  { id: 'm4', chat_session_id: 'ch1', role: 'assistant', content: 'Great question! The video covers this at [1:02:10]. useState is best for simple, independent state values. useReducer shines when your state logic is complex — like when the next state depends on the previous state, or when you have multiple sub-values.',        token_count: null, created_at: new Date(Date.now() - 60_000).toISOString() },
]

// ── Helpers ───────────────────────────────────────────────

function relativeDate(d: string): string {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7)   return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

// ── Session list item ─────────────────────────────────────

function SessionItem({ session, isActive, onSelect, onDelete }: {
  session:  ChatSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer',
        'transition-colors duration-fast',
        isActive
          ? 'bg-primary-50 border border-primary-100'
          : 'hover:bg-[var(--color-bg-secondary)] border border-transparent',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={cn(
        'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
        isActive ? 'bg-primary-100' : 'bg-[var(--color-bg-tertiary)]',
      )}>
        <MessageSquare className={cn('w-3.5 h-3.5', isActive ? 'text-primary-600' : 'text-[var(--color-text-tertiary)]')} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-body-sm font-medium truncate', isActive ? 'text-primary-800' : 'text-[var(--color-text-primary)]')}>
          {session.title ?? 'Untitled chat'}
        </p>
        <p className="text-caption text-[var(--color-text-tertiary)] flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {relativeDate(session.updated_at)}
          {session.is_multi_video && <span className="ml-1 px-1 bg-premium-50 text-premium-800 rounded text-[10px]">Multi</span>}
        </p>
      </div>
      <IconButton
        aria-label="Delete chat"
        icon={<Trash2 />}
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[var(--color-text-tertiary)] hover:text-danger-800"
      />
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function ChatPage() {
  const router       = useRouter()
  const { user }     = useAuthStore()
  const { toast }    = useToast()

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null)
  const [isTyping,  setIsTyping]  = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const sessionId     = (router.query.chatsessionId as string) ?? null
  const preVideoId    = (router.query.videoId as string) ?? null

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient.get('/chat/sessions/')
      const list = res.data.results || res.data
      setSessions(list)
      return list
    } catch (err) {
      console.error('Failed to fetch sessions', err)
      return []
    }
  }, [])

  // Auto-select first session or handle redirecting with pre-attached video
  useEffect(() => {
    if (!router.isReady) return
    let cancelled = false

    const initChat = async () => {
      try {
        setIsLoading(true)
        const list = await fetchSessions()
        if (cancelled) return

        if (!sessionId && preVideoId) {
          const videoRes = await apiClient.get(`/videos/${preVideoId}/`)
          const createRes = await apiClient.post('/chat/sessions/', {
            title: `Chat - ${videoRes.data.video.title}`,
          })
          await apiClient.post(`/chat/sessions/${createRes.data.id}/videos/`, {
            user_video_id: preVideoId,
          })
          if (!cancelled) {
            router.replace(`/chat/${createRes.data.id}`)
          }
        } else if (!sessionId && list.length > 0) {
          router.replace(`/chat/${list[0].id}`)
        } else if (sessionId) {
          const detailRes = await apiClient.get(`/chat/sessions/${sessionId}/`)
          if (!cancelled) {
            setActiveSession(detailRes.data)
            setMessages(detailRes.data.messages || [])
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to init chat', err)
        if (!cancelled) {
          toast.error('Failed to initialize chat session.')
          setIsLoading(false)
        }
      }
    }

    initChat()

    return () => {
      cancelled = true
    }
  }, [sessionId, preVideoId, router.isReady, fetchSessions])

  const handleAddVideo = useCallback(async (video: UserVideo) => {
    if (!sessionId) return
    try {
      await apiClient.post(`/chat/sessions/${sessionId}/videos/`, {
        user_video_id: video.id,
      })
      const detailRes = await apiClient.get(`/chat/sessions/${sessionId}/`)
      setActiveSession(detailRes.data)
      setMessages(detailRes.data.messages || [])
      setShowAddVideo(false)
      fetchSessions()
    } catch (err) {
      console.error('Failed to add video', err)
      toast.error('Failed to add video to chat.')
    }
  }, [sessionId, fetchSessions])

  const handleRemoveVideo = useCallback(async (videoId: string) => {
    if (!sessionId) return
    try {
      await apiClient.delete(`/chat/sessions/${sessionId}/videos/${videoId}/`)
      const detailRes = await apiClient.get(`/chat/sessions/${sessionId}/`)
      setActiveSession(detailRes.data)
      setMessages(detailRes.data.messages || [])
      fetchSessions()
    } catch (err) {
      console.error('Failed to remove video', err)
      toast.error('Failed to remove video from chat.')
    }
  }, [sessionId, fetchSessions])

  const handleNewChat = async () => {
    try {
      const createRes = await apiClient.post('/chat/sessions/', {
        title: 'New chat',
      })
      fetchSessions()
      router.push(`/chat/${createRes.data.id}`)
    } catch (err) {
      console.error('Failed to create new chat', err)
      toast.error('Failed to create a new chat session.')
    }
  }

  const handleSendMessage = useCallback(async (content: string) => {
    if (!sessionId) return
    const tempUserMsgId = `m_temp_${Date.now()}`
    const userMsg: ChatMessage = {
      id:              tempUserMsgId,
      chat_session_id: sessionId,
      role:            'user',
      content,
      token_count:     null,
      created_at:      new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setIsTyping(true)

    try {
      await apiClient.post(`/chat/sessions/${sessionId}/messages/`, {
        content,
      })
      const detailRes = await apiClient.get(`/chat/sessions/${sessionId}/`)
      setMessages(detailRes.data.messages || [])
      fetchSessions()
    } catch (err) {
      console.error('Failed to send message', err)
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsgId))
      toast.error('Failed to send message.')
    } finally {
      setIsTyping(false)
    }
  }, [sessionId, fetchSessions])

  const handleDeleteSession = async (id: string) => {
    try {
      await apiClient.delete(`/chat/sessions/${id}/`)
      setDeleteTarget(null)
      toast.success('Chat deleted')
      const list = await fetchSessions()
      if (sessionId === id) {
        if (list.length > 0) {
          router.push(`/chat/${list[0].id}`)
        } else {
          router.push('/chat')
        }
      }
    } catch (err) {
      console.error('Failed to delete chat session', err)
      toast.error('Failed to delete chat session.')
    }
  }

  return (
    <div className="flex h-full -m-5 overflow-hidden">
      {/* Add Video Modal */}
      {showAddVideo && (
        <AddVideoModal
          onAdd={handleAddVideo}
          onClose={() => setShowAddVideo(false)}
        />
      )}

      {/* ── Sidebar — session list ── */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)] shrink-0">
          <h2 className="text-heading-sm text-[var(--color-text-primary)]">Chats</h2>
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={handleNewChat}>
            New
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          {sessions.length === 0 ? (
            <EmptyState
              icon={EmptyIcons.chat}
              title="No chats yet"
              description="Start a conversation about any video."
              minHeight="200px"
            />
          ) : (
            sessions.map((session) => (
              <SessionItem
                key={session.id}
                session={session}
                isActive={session.id === sessionId}
                onSelect={() => router.push(`/chat/${session.id}`)}
                onDelete={() => setDeleteTarget(session.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main — chat window ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-[var(--color-bg-primary)]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : activeSession ? (
          <ChatWindow
            session={{ ...activeSession, messages }}
            currentUser={user}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            onAddVideo={() => setShowAddVideo(true)}
            onRemoveVideo={handleRemoveVideo}
            className="h-full"
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <MessageSquare className="w-12 h-12 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <div>
              <h2 className="text-heading-md text-[var(--color-text-primary)] mb-1">No chat selected</h2>
              <p className="text-body-sm text-[var(--color-text-secondary)]">
                Select a chat from the sidebar or start a new one.
              </p>
            </div>
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={handleNewChat}>
              Start new chat
            </Button>
          </div>
        )}
      </div>

      {/* ── Delete confirm modal ── */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteSession(deleteTarget)}
        title="Delete chat?"
        description="This will permanently delete this chat and all its messages. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

ChatPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}