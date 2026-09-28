'use client'

// ============================================================
// VidMind AI — Standalone Deep Research Hub
// pages/research/[sessionId]/index.tsx & pages/research/index.tsx
//
// Interactive cognitive workstation for video deep research:
//  - Sidebar with session history & search filter
//  - Contextual 16:9 video header with AI synthesis badges
//  - Video Topic Highlights (chapter nodes with timestamp jumps)
//  - Conversational research feed (Quick Search & Deep Research reports)
//  - Synchronized video player modal/drawer
//  - Floating multimodal glassmorphic command dock with search modes
// ============================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/router'
import {
  Plus,
  Globe,
  Clock,
  Trash2,
  Crown,
  Download,
  Search,
  Tv,
  Sparkles,
  ChevronRight,
  Share2,
  Loader2,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button, IconButton } from '@/components/ui/Button'
import { EmptyState, EmptyIcons } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth.store'
import { AppShell } from '@/components/layout/AppShell'
import { apiClient } from '@/utils/apiClient'
import { Spinner } from '@/components/ui/Spinner'
import { AddVideoModal } from '@/components/chat'
import {
  ResearchReport,
  SearchResultCard,
  ResearchVideoHeader,
  TopicHighlightList,
  ResearchCommandDock,
  ResearchVideoPlayer,
} from '@/components/research'
import type { SearchMode } from '@/components/research'
import type { ResearchSession, UserVideo, VideoCut, SearchResult } from '@/types'

// ── Mock data for fallback / initial states ────────────────
const MOCK_USER_VIDEO: UserVideo = {
  id: 'uv1',
  user_id: 'u1',
  storage_type: 'reference',
  file_url: null,
  processing_status: 'completed',
  saved_at: '',
  last_accessed_at: '',
  video: {
    id: 'v1',
    youtube_id: 'dQw4w9WgXcQ',
    title: "The Logical Foundation & Philosophical Critique of Aquinas's Five Ways",
    description: null,
    thumbnail_url: null,
    duration_seconds: 1458,
    channel_id: 'c1',
    channel_name: 'Philosophy Illustrated',
    category: 'Education',
    published_at: null,
    created_at: '',
  },
  cuts: [
    {
      id: 'cut-1',
      user_video_id: 'uv1',
      cut_order: 1,
      start_seconds: 134,
      end_seconds: 515,
      duration_seconds: 381,
      title: "Objections to God's Existence: Evil & Superfluity",
      ai_rationale:
        'Introduces the core thesis and examines the two principal philosophical objections: the evidential Problem of Evil and ontological superfluity in cosmological explanations.',
      ai_suggested: true,
      user_approved: true,
      download_url: null,
      download_status: 'ready',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'cut-2',
      user_video_id: 'uv1',
      cut_order: 2,
      start_seconds: 516,
      end_seconds: 1035,
      duration_seconds: 519,
      title: "Aquinas & Boethius Answer the Problem of Evil",
      ai_rationale:
        "Details Aquinas's initial rejection of the objections and synthesizes Boethius's comprehensive metaphysical response: the ontological distinction between apparent privation and universal teleology.",
      ai_suggested: true,
      user_approved: true,
      download_url: null,
      download_status: 'ready',
      created_at: '',
      updated_at: '',
    },
    {
      id: 'cut-3',
      user_video_id: 'uv1',
      cut_order: 3,
      start_seconds: 1036,
      end_seconds: 1458,
      duration_seconds: 422,
      title: "The Logical Foundation of Aquinas's Five Ways",
      ai_rationale:
        'Explains the unified syllogistic structure underpinning the Five Ways: motion, causation, contingency, gradation, and teleological governance, grounded in four axiomatic principles.',
      ai_suggested: true,
      user_approved: true,
      download_url: null,
      download_status: 'ready',
      created_at: '',
      updated_at: '',
    },
  ],
}

// ── Helpers ───────────────────────────────────────────────
function relativeDate(d: string): string {
  const days = Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

// ── Sidebar Session List Item ──────────────────────────────
function ResearchSessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: {
  session: ResearchSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 relative',
        isActive
          ? 'bg-primary-500/10 border border-primary-500/25 shadow-2xs'
          : 'hover:bg-[var(--color-bg-secondary)] border border-transparent'
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active left indicator pill */}
      {isActive && (
        <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary-600 rounded-r-full" />
      )}

      <div
        className={cn(
          'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
          isActive
            ? 'bg-primary-500 text-white shadow-2xs'
            : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
        )}
      >
        <Globe className="w-3.5 h-3.5" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-body-sm font-semibold truncate',
            isActive ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--color-text-primary)]'
          )}
        >
          {session.title || 'Research report'}
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)] flex items-center gap-1.5 font-mono">
          <Clock className="w-3 h-3 text-[var(--color-text-tertiary)] shrink-0" />
          <span>{session.completed_at ? relativeDate(session.completed_at) : 'In progress…'}</span>
          <span>•</span>
          <span>{(session.sources?.length ?? 0)} sources</span>
        </p>
      </div>

      <IconButton
        aria-label="Delete report"
        icon={<Trash2 className="w-3.5 h-3.5" />}
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[var(--color-text-tertiary)] hover:text-danger-600 hover:bg-danger-50"
      />
    </div>
  )
}

// ── Premium Gate ──────────────────────────────────────────
function PremiumGate() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-6 py-16 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-sm">
        <Crown className="w-8 h-8 text-amber-500" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-heading-xl text-[var(--color-text-primary)] mb-2 font-bold">
          Deep Research Workstation
        </h2>
        <p className="text-body-md text-[var(--color-text-secondary)] leading-relaxed">
          Unlock conversational deep research on specific video topics, autonomous web exploration, and cited academic reports.
        </p>
      </div>
      <ul className="text-body-sm text-[var(--color-text-secondary)] space-y-2 text-left w-full max-w-xs mx-auto">
        {[
          'Target research on specific video topics',
          'Multimodal search & autonomous web agents',
          'Live cited sources & video timestamps',
          'Export formatted Markdown or PDF reports',
        ].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-[10px] shrink-0">
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        size="lg"
        leftIcon={<Crown className="w-4 h-4" />}
        onClick={() => router.push('/pricing')}
        className="bg-amber-600 hover:bg-amber-700 text-white border-0 shadow-md"
      >
        Upgrade to Pro
      </Button>
    </div>
  )
}

// ── Main Page Component ───────────────────────────────────
export default function ResearchPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()

  const isPremium = user?.subscription_tier === 'premium'

  // Sessions and Active View state
  const [sessions, setSessions] = useState<ResearchSession[]>([])
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null)
  const [sessionCuts, setSessionCuts] = useState<VideoCut[]>([])
  const [searchFilter, setSearchFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showAddVideo, setShowAddVideo] = useState(false)

  // Conversational Inquiry & Search State
  const [query, setQuery] = useState('')
  const [searchMode, setSearchMode] = useState<SearchMode>('search')
  const [searchLoading, setSearchLoading] = useState(false)
  const [researchLoading, setResearchLoading] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchResult[]>([])
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string | null>(null)

  // Synchronized Player State
  const [isPlayerOpen, setIsPlayerOpen] = useState(false)
  const [playerSeconds, setPlayerSeconds] = useState(0)

  const feedBottomRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const sessionId = (router.query.sessionId as string) ?? null
  const preVideoId = (router.query.videoId as string) ?? null

  // Fetch all research sessions
  const fetchSessions = useCallback(async () => {
    if (!isPremium) return []
    try {
      const res = await apiClient.get('/research/')
      const list = res.data.results || res.data || []
      setSessions(list)
      return list
    } catch (err) {
      console.error('Failed to fetch research sessions', err)
      return []
    }
  }, [isPremium])

  // Initial load
  useEffect(() => {
    if (!router.isReady) return
    let cancelled = false

    const initResearch = async () => {
      try {
        setIsLoading(true)
        const list = await fetchSessions()
        if (cancelled) return

        if (!sessionId && preVideoId) {
          try {
            const researchRes = await apiClient.post('/research/', { user_video_id: preVideoId })
            if (!cancelled) {
              await fetchSessions()
              router.replace(`/research/${researchRes.data.id}`)
              return
            }
          } catch (e) {
            console.error('Failed to auto-create research session for videoId', e)
          }
        }

        if (!sessionId && list.length > 0) {
          router.replace(`/research/${list[0].id}`)
        } else if (sessionId) {
          const detailRes = await apiClient.get(`/research/${sessionId}/`)
          if (!cancelled) {
            const sess: ResearchSession = detailRes.data
            setActiveSession(sess)

            // Extract cuts or fallback to mock video cuts if none available
            const cuts = sess.user_video?.cuts || []
            if (cuts.length > 0) {
              setSessionCuts(cuts)
            } else if (sess.user_video?.id) {
              // Fetch cuts from user video detail
              try {
                const uvRes = await apiClient.get(`/videos/${sess.user_video.id}/`)
                if (uvRes.data?.cuts?.length > 0) {
                  setSessionCuts(uvRes.data.cuts)
                } else {
                  setSessionCuts(MOCK_USER_VIDEO.cuts || [])
                }
              } catch {
                setSessionCuts(MOCK_USER_VIDEO.cuts || [])
              }
            } else {
              setSessionCuts(MOCK_USER_VIDEO.cuts || [])
            }
            setIsLoading(false)
          }
        } else {
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to init research page', err)
        if (!cancelled) {
          toast.error('Failed to load research report.')
          setIsLoading(false)
        }
      }
    }

    initResearch()
    return () => {
      cancelled = true
    }
  }, [sessionId, preVideoId, router.isReady, fetchSessions, toast])

  // Handle adding video to start a new deep research session
  const handleAddVideoToResearch = useCallback(
    async (video: UserVideo) => {
      try {
        let realUserVideoId = video.id

        // 1. If it's a raw URL input or related YouTube search (starts with uv_)
        if (video.id.startsWith('uv_')) {
          const videoRes = await apiClient.post('/videos/', {
            youtube_id: video.video.youtube_id,
            storage_type: 'reference',
          })
          realUserVideoId = videoRes.data.id
        }

        toast.info('Starting deep research session…')
        // 2. Create the research session for this video
        const researchRes = await apiClient.post('/research/', {
          user_video_id: realUserVideoId,
        })

        setShowAddVideo(false)
        await fetchSessions()
        router.push(`/research/${researchRes.data.id}`)
        toast.success('Research session initialized!')
      } catch (err: any) {
        console.error('Failed to create research session', err)
        const errorPayload = err?.response?.data?.error
        if (errorPayload?.message) {
          toast.error(errorPayload.message)
        } else {
          toast.error('Failed to start research on this video.')
        }
      }
    },
    [fetchSessions, router, toast]
  )

  // Auto-scroll feed on new search result
  useEffect(() => {
    if (searchHistory.length > 0 || searchLoading || researchLoading) {
      feedBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [searchHistory.length, searchLoading, researchLoading])

  // Export report
  const handleExport = () => {
    if (!activeSession?.report_content) return
    try {
      const blob = new Blob([activeSession.report_content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeSession.title || 'research-report'}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Report exported as Markdown')
    } catch (err) {
      console.error('Export failed', err)
      toast.error('Export failed')
    }
  }

  // Delete session
  const handleDeleteSession = async (id: string) => {
    try {
      await apiClient.delete(`/research/${id}/`)
      setDeleteTarget(null)
      toast.success('Report deleted')
      const list = await fetchSessions()
      if (sessionId === id) {
        if (list.length > 0) {
          router.push(`/research/${list[0].id}`)
        } else {
          router.push('/research')
        }
      }
    } catch (err) {
      console.error('Failed to delete report', err)
      toast.error('Failed to delete report.')
    }
  }

  // Handle clicking a topic card action
  const handleSelectTopic = (topicTitle: string, targetMode: 'search' | 'deep_research') => {
    setSelectedTopicTitle(topicTitle)
    setSearchMode(targetMode)

    if (targetMode === 'search') {
      const q = `Explain key concepts and objections regarding: ${topicTitle}`
      setQuery(q)
      executeSearch(q, 'search')
    } else {
      const q = `Perform deep research with cited sources on: ${topicTitle}`
      setQuery(q)
      executeDeepResearch(q)
    }
  }

  // Seek video player to specific seconds
  const handleSeekTimestamp = (seconds: number) => {
    setPlayerSeconds(seconds)
    setIsPlayerOpen(true)
  }

  // Run Quick Search
  const executeSearch = async (searchQuery: string, mode: 'search' | 'learn') => {
    const q = searchQuery.trim()
    if (!q) return

    setSearchLoading(true)
    try {
      const res = await apiClient.post('/search/', {
        query: q,
        user_video_id: activeSession?.user_video?.id,
        mode,
      })
      setSearchHistory((prev) => [...prev, res.data])
      setQuery('')
    } catch (err: any) {
      console.error('Search failed', err)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Search failed.'
      toast.error(errMsg)
    } finally {
      setSearchLoading(false)
    }
  }

  // Run Deep Research
  const executeDeepResearch = async (deepQuery: string) => {
    const q = deepQuery.trim()
    if (!q || !activeSession?.user_video?.id) return

    setResearchLoading(true)
    try {
      const res = await apiClient.post('/research/', {
        user_video_id: activeSession.user_video.id,
        query: q,
      })
      const newSessionId = res.data.id
      toast.success('Deep Research started! Exploring web sources…')

      // Switch to new session or poll
      router.push(`/research/${newSessionId}`)
      setQuery('')
    } catch (err: any) {
      console.error('Deep research failed', err)
      const errMsg = err.response?.data?.error?.message || err.response?.data?.detail || 'Deep research failed.'
      toast.error(errMsg)
      setResearchLoading(false)
    }
  }

  // Unified submission from command dock
  const handleDockSubmit = () => {
    if (searchMode === 'deep_research') {
      executeDeepResearch(query)
    } else {
      executeSearch(query, searchMode === 'learn' ? 'learn' : 'search')
    }
  }

  // Filtered sidebar sessions
  const filteredSessions = useMemo(() => {
    if (!searchFilter.trim()) return sessions
    return sessions.filter((s) =>
      (s.title || '').toLowerCase().includes(searchFilter.toLowerCase())
    )
  }, [sessions, searchFilter])

  return (
    <div className="flex h-full -m-5 overflow-hidden">
      {/* ── Add Video Modal for Deep Research ── */}
      {showAddVideo && (
        <AddVideoModal
          currentVideo={activeSession?.user_video}
          onAdd={handleAddVideoToResearch}
          onClose={() => setShowAddVideo(false)}
        />
      )}

      {/* ── Left Sidebar Navigation (280px) ── */}
      <aside className="hidden md:flex flex-col w-72 shrink-0 border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-primary)]">
        {/* Header CTA */}
        <div className="p-3.5 border-b border-[var(--color-border-tertiary)] shrink-0 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-body-md font-bold text-[var(--color-text-primary)]">
              Research Sessions
            </h2>
            {isPremium && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowAddVideo(true)}
                className="text-[12px] h-7 px-2.5 shadow-xs"
              >
                New
              </Button>
            )}
          </div>

          {/* Search Filter */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              type="text"
              placeholder="Search sessions…"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] text-[12px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-primary-500/60"
            />
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
          {!isPremium ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
              <Crown className="w-8 h-8 text-amber-500" aria-hidden="true" />
              <p className="text-body-sm text-[var(--color-text-secondary)]">
                Upgrade to Pro to unlock unlimited deep research sessions.
              </p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/pricing')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                Upgrade to Pro
              </Button>
            </div>
          ) : filteredSessions.length === 0 ? (
            <EmptyState
              icon={EmptyIcons.research}
              title={searchFilter ? 'No matching reports' : 'No research reports yet'}
              description={
                searchFilter
                  ? 'Try a different search keyword.'
                  : 'Start deep research on any video topic.'
              }
              minHeight="180px"
            />
          ) : (
            filteredSessions.map((session) => (
              <ResearchSessionItem
                key={session.id}
                session={session}
                isActive={session.id === sessionId}
                onSelect={() => router.push(`/research/${session.id}`)}
                onDelete={() => setDeleteTarget(session.id)}
              />
            ))
          )}
        </div>
      </aside>

      {/* ── Main Research Canvas ── */}
      <main className="flex flex-col flex-1 min-w-0 bg-[var(--color-bg-primary)] overflow-hidden relative">
        {!isPremium ? (
          <PremiumGate />
        ) : isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3">
            <Spinner size="lg" />
            <p className="text-[13px] text-[var(--color-text-tertiary)]">Loading research session…</p>
          </div>
        ) : activeSession ? (
          <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
            {/* Scrollable Container with Max Width Containment */}
            <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-6 pb-28">
              {/* Synchronized Embedded Player (when toggled or timestamp clicked) */}
              <ResearchVideoPlayer
                isOpen={isPlayerOpen}
                youtubeId={activeSession.user_video?.video?.youtube_id}
                videoTitle={activeSession.user_video?.video?.title}
                currentSeconds={playerSeconds}
                onClose={() => setIsPlayerOpen(false)}
              />

              {/* 1. Contextual Video Header Banner */}
              <ResearchVideoHeader
                userVideo={activeSession.user_video}
                cutsCount={sessionCuts.length}
                sourcesCount={activeSession.sources?.length || 0}
                isSynthesized={activeSession.status === 'completed'}
                isPlayerOpen={isPlayerOpen}
                onTogglePlayer={() => setIsPlayerOpen((prev) => !prev)}
                onExport={handleExport}
              />

              {/* 2. Video Topic Highlights (The Core Feature) */}
              <TopicHighlightList
                cuts={sessionCuts}
                selectedTopicTitle={selectedTopicTitle}
                onSelectTopic={handleSelectTopic}
                onSeekTimestamp={handleSeekTimestamp}
              />

              {/* 3. Conversational Feed & Results Stream */}
              <div className="space-y-4 pt-4 border-t border-[var(--color-border-tertiary)]">
                {/* Search Results in this session */}
                {searchHistory.map((searchRes, idx) => (
                  <div
                    key={searchRes.id || idx}
                    className="bg-[var(--color-bg-secondary)]/50 border border-[var(--color-border-tertiary)] rounded-2xl p-4 shadow-2xs space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Search className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        {searchRes.mode === 'learn' ? 'Step-by-Step Curriculum' : 'Quick Search'}
                      </span>
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">•</span>
                      <p className="text-[12px] font-medium text-[var(--color-text-secondary)] truncate">
                        {searchRes.query}
                      </p>
                    </div>

                    <SearchResultCard
                      result={searchRes}
                      onFollowUp={(question: string) => {
                        setQuery(question)
                        executeSearch(question, 'search')
                      }}
                    />
                  </div>
                ))}

                {/* Loading indicator in feed */}
                {(searchLoading || researchLoading) && (
                  <div className="p-4 flex items-center gap-3 bg-[var(--color-bg-secondary)] rounded-2xl border border-[var(--color-border-tertiary)] shadow-xs animate-pulse">
                    <Loader2 className="w-4 h-4 text-primary-500 animate-spin shrink-0" />
                    <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">
                      {researchLoading
                        ? 'Autonomous agent exploring web sources and generating deep cited report…'
                        : 'Searching the web and extracting citations…'}
                    </p>
                  </div>
                )}

                {/* Primary Deep Research Report */}
                {activeSession.report_content && (
                  <div className="bg-[var(--color-bg-secondary)]/40 border border-[var(--color-border-tertiary)] rounded-2xl p-4 sm:p-6 shadow-xs">
                    <ResearchReport
                      session={activeSession}
                      onExport={handleExport}
                      className="border-0 shadow-none p-0"
                    />
                  </div>
                )}

                <div ref={feedBottomRef} />
              </div>
            </div>

            {/* 4. Floating Multimodal Command Dock (Fixed at bottom) */}
            <div className="fixed bottom-4 left-0 right-0 md:left-72 pointer-events-none z-30 px-4">
              <div className="pointer-events-auto">
                <ResearchCommandDock
                  query={query}
                  onQueryChange={setQuery}
                  mode={searchMode}
                  onModeChange={setSearchMode}
                  onSubmit={handleDockSubmit}
                  isLoading={searchLoading || researchLoading}
                  isPremium={isPremium}
                  onAddVideo={() => setShowAddVideo(true)}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6 text-center">
            <Globe className="w-12 h-12 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <div>
              <h2 className="text-heading-md text-[var(--color-text-primary)] mb-1 font-bold">
                No Research Report Selected
              </h2>
              <p className="text-body-sm text-[var(--color-text-secondary)]">
                Select a research report from the sidebar or start a new one from any video.
              </p>
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddVideo(true)}
            >
              Start Research
            </Button>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteSession(deleteTarget)}
        title="Delete research report?"
        description="This will permanently delete this deep research session and all its cited sources."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}

ResearchPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}