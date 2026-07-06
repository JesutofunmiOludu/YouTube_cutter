// ============================================================
// VidMind AI — Library Page
// pages/library/index.tsx
//
// Mobile-first view of all the user's video projects.
// Shows each project as a card with thumbnail, status,
// and action pills (cuts, chats, research).
// Tapping a card navigates to the workspace.
// ============================================================

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Library,
  Scissors,
  MessageSquare,
  Globe,
  Play,
  Clock,
  Plus,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  X,
  Loader2,
} from 'lucide-react'
import { cn }             from '@/utils/cn'
import { AppShell }       from '@/components/layout/AppShell'
import { apiClient }       from '@/utils/apiClient'
import { useToast }        from '@/components/ui/Toast'
import { useAuthStore }   from '@/store/auth.store'
import { Button }         from '@/components/ui/Button'
import { StatusBadge }    from '@/components/ui/Badge'
import { EmptyState, EmptyIcons } from '@/components/ui'
import { formatDuration, RelativeDate } from '@/components/video/VideoCard'
import type { NextPageWithLayout }  from '../_app'
import type {
  UserVideo, VideoCut, ChatSession,
  ResearchSession, ProcessingStatus,
} from '@/types'

// ── Types ─────────────────────────────────────────────────

interface VideoProject {
  userVideo:  UserVideo
  cuts:       VideoCut[]
  chats:      ChatSession[]
  research:   ResearchSession[]
}

type SortKey = 'recent' | 'oldest' | 'name'
type FilterKey = 'all' | 'completed' | 'processing' | 'pending'

// ── Mock Data (replace with React Query) ───────────────────

const MOCK_PROJECTS: VideoProject[] = [
  {
    userVideo: {
      id: 'uv1', user_id: 'u1',
      storage_type: 'reference', file_url: null,
      processing_status: 'completed',
      saved_at: new Date(Date.now() - 86_400_000).toISOString(),
      last_accessed_at: new Date(Date.now() - 3_600_000).toISOString(),
      video: {
        id: 'v1', youtube_id: 'dQw4w9WgXcQ',
        title: 'Full React JS Course for Beginners',
        description: null,
        thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        duration_seconds: 13330,
        channel_id: 'c1', channel_name: 'Fireship',
        category: 'Tutorial', published_at: null,
        created_at: new Date().toISOString(),
      },
    },
    cuts: Array(5).fill(null).map((_, i) => ({
      id: `c${i+1}`, user_video_id: 'uv1', cut_order: i+1,
      start_seconds: i * 1000, end_seconds: (i+1) * 1000,
      title: `Segment ${i+1}`, ai_rationale: null,
      ai_suggested: true, user_approved: i % 2 === 0,
      download_url: null, download_status: 'pending' as const,
      created_at: '', updated_at: '', duration_seconds: 1000,
    })),
    chats: [
      { id: 'ch1', user_id: 'u1', title: 'React hooks deep dive', is_multi_video: false, videos: [], messages: Array(14).fill(null), created_at: new Date(Date.now() - 3_600_000).toISOString(), updated_at: new Date(Date.now() - 3_600_000).toISOString(), last_message: null },
      { id: 'ch2', user_id: 'u1', title: 'Hooks vs class components', is_multi_video: false, videos: [], messages: Array(6).fill(null), created_at: new Date(Date.now() - 86_400_000).toISOString(), updated_at: new Date(Date.now() - 86_400_000).toISOString(), last_message: null },
    ],
    research: [
      { id: 'r1', user_id: 'u1', user_video: {} as UserVideo, title: 'React hooks & state management 2024', report_content: '', status: 'completed', sources: Array(12).fill(null), completed_at: new Date(Date.now() - 172_800_000).toISOString(), created_at: '', updated_at: '' },
    ],
  },
  {
    userVideo: {
      id: 'uv2', user_id: 'u1',
      storage_type: 'reference', file_url: null,
      processing_status: 'processing',
      saved_at: new Date(Date.now() - 172_800_000).toISOString(),
      last_accessed_at: new Date(Date.now() - 7_200_000).toISOString(),
      video: {
        id: 'v2', youtube_id: 'abc123',
        title: 'Django REST Framework Deep Dive',
        description: null, thumbnail_url: null,
        duration_seconds: 4725,
        channel_id: 'c2', channel_name: 'Traversy Media',
        category: 'Tutorial', published_at: null,
        created_at: new Date().toISOString(),
      },
    },
    cuts: Array(3).fill(null).map((_, i) => ({
      id: `c${i+6}`, user_video_id: 'uv2', cut_order: i+1,
      start_seconds: i * 800, end_seconds: (i+1) * 800,
      title: `Segment ${i+1}`, ai_rationale: null,
      ai_suggested: true, user_approved: false,
      download_url: null, download_status: 'pending' as const,
      created_at: '', updated_at: '', duration_seconds: 800,
    })),
    chats: [],
    research: [],
  },
  {
    userVideo: {
      id: 'uv3', user_id: 'u1',
      storage_type: 'reference', file_url: null,
      processing_status: 'completed',
      saved_at: new Date(Date.now() - 259_200_000).toISOString(),
      last_accessed_at: new Date(Date.now() - 86_400_000).toISOString(),
      video: {
        id: 'v3', youtube_id: 'xyz789',
        title: 'PostgreSQL Tutorial for Beginners',
        description: null, thumbnail_url: null,
        duration_seconds: 3322,
        channel_id: 'c3', channel_name: 'Academind',
        category: 'Tutorial', published_at: null,
        created_at: new Date().toISOString(),
      },
    },
    cuts: Array(3).fill(null).map((_, i) => ({
      id: `c${i+9}`, user_video_id: 'uv3', cut_order: i+1,
      start_seconds: i * 600, end_seconds: (i+1) * 600,
      title: `Segment ${i+1}`, ai_rationale: null,
      ai_suggested: true, user_approved: true,
      download_url: null, download_status: 'ready' as const,
      created_at: '', updated_at: '', duration_seconds: 600,
    })),
    chats: [
      { id: 'ch3', user_id: 'u1', title: 'PostgreSQL indexing strategies', is_multi_video: false, videos: [], messages: Array(5).fill(null), created_at: new Date(Date.now() - 86_400_000).toISOString(), updated_at: new Date(Date.now() - 86_400_000).toISOString(), last_message: null },
    ],
    research: [],
  },
  {
    userVideo: {
      id: 'uv4', user_id: 'u1',
      storage_type: 'reference', file_url: null,
      processing_status: 'pending',
      saved_at: new Date(Date.now() - 600_000).toISOString(),
      last_accessed_at: new Date(Date.now() - 600_000).toISOString(),
      video: {
        id: 'v4', youtube_id: 'F2JCjVSZlG0',
        title: 'React in 100 Seconds',
        description: null,
        thumbnail_url: 'https://img.youtube.com/vi/F2JCjVSZlG0/mqdefault.jpg',
        duration_seconds: 110,
        channel_id: 'c1', channel_name: 'Fireship',
        category: 'Short', published_at: null,
        created_at: new Date().toISOString(),
      },
    },
    cuts: [],
    chats: [],
    research: [],
  },
]

// ── Status config ─────────────────────────────────────────

const STATUS_STYLES: Record<ProcessingStatus, { dot: string; label: string }> = {
  pending:    { dot: 'bg-warning-400',  label: 'Pending'    },
  processing: { dot: 'bg-primary-400 animate-pulse', label: 'Processing' },
  completed:  { dot: 'bg-success-400',  label: 'Completed'  },
  failed:     { dot: 'bg-danger-400',   label: 'Failed'     },
}

// ── Thumbnail ─────────────────────────────────────────────

function Thumb({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [err, setErr] = useState(false)
  return (
    <div className="relative w-24 h-16 shrink-0 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] flex items-center justify-center">
      {!err ? (
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title}
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
          loading="lazy"
        />
      ) : (
        <Play className="w-5 h-5 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      )}
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────

function ProjectCard({ project, onClick }: { project: VideoProject; onClick: () => void }) {
  const { userVideo, cuts, chats, research } = project
  const v = userVideo.video
  const statusStyle = STATUS_STYLES[userVideo.processing_status]
  const approvedCuts = cuts.filter(c => c.user_approved).length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'flex gap-3 p-3.5 rounded-2xl border',
        'bg-[var(--color-bg-primary)]',
        'border-[var(--color-border-tertiary)]',
        'hover:border-primary-200 active:scale-[0.99]',
        'transition-all duration-fast cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300',
      )}
      aria-label={`Open ${v.title}`}
    >
      {/* Thumbnail */}
      <Thumb youtubeId={v.youtube_id} title={v.title} />

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 justify-between">
        <div>
          {/* Status + title */}
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusStyle.dot)}
              aria-label={`Status: ${statusStyle.label}`}
            />
            <span className="text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wide">
              {statusStyle.label}
            </span>
          </div>
          <p className="text-body-sm font-semibold text-[var(--color-text-primary)] line-clamp-2 leading-snug">
            {v.title}
          </p>
          <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5 truncate">
            {v.channel_name} · {formatDuration(v.duration_seconds)}
          </p>
        </div>

        {/* Pills row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Cuts pill */}
          <span className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
            cuts.length > 0
              ? 'bg-primary-50 text-primary-700'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]',
          )}>
            <Scissors className="w-2.5 h-2.5" aria-hidden="true" />
            {cuts.length > 0 ? `${cuts.length} cut${cuts.length !== 1 ? 's' : ''}` : 'No cuts'}
          </span>

          {/* Chats pill */}
          <span className={cn(
            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold',
            chats.length > 0
              ? 'bg-premium-50 text-premium-700'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]',
          )}>
            <MessageSquare className="w-2.5 h-2.5" aria-hidden="true" />
            {chats.length > 0 ? `${chats.length} chat${chats.length !== 1 ? 's' : ''}` : 'No chats'}
          </span>

          {/* Research pill */}
          {research.length > 0 && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-success-50 text-success-700">
              <Globe className="w-2.5 h-2.5" aria-hidden="true" />
              {research.length} report{research.length !== 1 ? 's' : ''}
            </span>
          )}

          {/* Last accessed */}
          <span className="ml-auto text-[10px] text-[var(--color-text-tertiary)] flex items-center gap-0.5 shrink-0">
            <Clock className="w-2.5 h-2.5" aria-hidden="true" />
            {userVideo.last_accessed_at
              ? <RelativeDate date={userVideo.last_accessed_at} />
              : 'Never'}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] shrink-0 self-center" aria-hidden="true" />
    </div>
  )
}

// ── Sort / Filter chips ───────────────────────────────────

function Chip({
  label, active, onClick,
}: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 px-3 py-1.5 rounded-full text-caption font-medium border transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border-secondary)] hover:border-primary-300 hover:text-primary-600',
      )}
    >
      {label}
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────

const LibraryPage: NextPageWithLayout = () => {
  const router   = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sort,   setSort]     = useState<SortKey>('recent')
  const [filter, setFilter]   = useState<FilterKey>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const videosRes = await apiClient.get('/videos/')
        const userVideos: UserVideo[] = videosRes.data.results || videosRes.data || []

        const chatsRes = await apiClient.get('/chat/sessions/')
        const chats: ChatSession[] = chatsRes.data.results || chatsRes.data || []

        const researchRes = await apiClient.get('/research/')
        const research: ResearchSession[] = researchRes.data.results || researchRes.data || []

        const projectList: VideoProject[] = await Promise.all(
          userVideos.map(async (uv) => {
            try {
              const detailRes = await apiClient.get(`/videos/${uv.id}/`)
              const detail = detailRes.data
              const videoChats = chats.filter((c: any) =>
                c.video_ids?.includes(uv.id)
              )
              const videoResearch = research.filter((r) => {
                const rUvId = typeof r.user_video === 'object' && r.user_video !== null ? r.user_video.id : r.user_video
                return rUvId === uv.id
              })
              return {
                userVideo: detail,
                cuts: detail.cuts || [],
                chats: videoChats,
                research: videoResearch,
              }
            } catch (err) {
              return {
                userVideo: uv,
                cuts: [],
                chats: [],
                research: [],
              }
            }
          })
        )
        setProjects(projectList)
      } catch (err) {
        toast.error('Failed to load library projects.')
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filtered = useMemo(() => {
    let list = projects

    // Status filter
    if (filter !== 'all') {
      list = list.filter(p => p.userVideo.processing_status === filter)
    }

    // Search
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(p =>
        p.userVideo.video.title.toLowerCase().includes(q) ||
        p.userVideo.video.channel_name.toLowerCase().includes(q),
      )
    }

    // Sort
    if (sort === 'recent') {
      list = [...list].sort((a, b) =>
        new Date(b.userVideo.last_accessed_at ?? 0).getTime() -
        new Date(a.userVideo.last_accessed_at ?? 0).getTime()
      )
    } else if (sort === 'oldest') {
      list = [...list].sort((a, b) =>
        new Date(a.userVideo.saved_at).getTime() -
        new Date(b.userVideo.saved_at).getTime()
      )
    } else if (sort === 'name') {
      list = [...list].sort((a, b) =>
        a.userVideo.video.title.localeCompare(b.userVideo.video.title)
      )
    }

    return list
  }, [search, sort, filter])

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">

      {/* ── Page header ── */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Library className="w-5 h-5 text-primary-600" aria-hidden="true" />
            <h1 className="text-heading-lg text-[var(--color-text-primary)]">Library</h1>
          </div>
          <span className="text-caption text-[var(--color-text-tertiary)]">
            {filtered.length} project{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Search bar */}
        <div className={cn(
          'flex items-center gap-2 h-10 px-3',
          'bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)]',
          'rounded-xl transition-colors duration-fast',
          'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100',
        )}>
          <Search className="w-4 h-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <input
            type="search"
            placeholder="Search your projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-body-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            aria-label="Search projects"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              'shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors',
              showFilters
                ? 'bg-primary-100 text-primary-600'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]',
            )}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter / sort chips */}
        {showFilters && (
          <div className="flex flex-col gap-2 mt-3">
            {/* Status filter */}
            <div>
              <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1.5">
                Status
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {(['all', 'completed', 'processing', 'pending'] as FilterKey[]).map(f => (
                  <Chip
                    key={f}
                    label={f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                    active={filter === f}
                    onClick={() => setFilter(f)}
                  />
                ))}
              </div>
            </div>
            {/* Sort */}
            <div>
              <p className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1.5">
                Sort
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {([
                  { value: 'recent', label: 'Recently viewed' },
                  { value: 'oldest', label: 'Oldest first' },
                  { value: 'name',   label: 'A – Z' },
                ] as { value: SortKey; label: string }[]).map(({ value, label }) => (
                  <Chip
                    key={value}
                    label={label}
                    active={sort === value}
                    onClick={() => setSort(value)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Project list ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          search ? (
            <EmptyState
              icon={EmptyIcons.search}
              title={`No results for "${search}"`}
              description="Try a different keyword or clear the search."
              action={{ label: 'Clear search', onClick: () => setSearch('') }}
              minHeight="300px"
            />
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4 py-10">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center">
                <Library className="w-8 h-8 text-primary-400" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-heading-md text-[var(--color-text-primary)] mb-1">
                  Your library is empty
                </h2>
                <p className="text-body-sm text-[var(--color-text-secondary)] max-w-xs">
                  Start by processing a YouTube video. AI will split it into chapters, transcribe it, and let you chat and research.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => router.push('/search')}
              >
                Add your first video
              </Button>
            </div>
          )
        ) : (
          <div className="flex flex-col gap-2.5 py-2">
            {filtered.map(project => (
              <ProjectCard
                key={project.userVideo.id}
                project={project}
                onClick={() => router.push(`/workspace/${project.userVideo.id}`)}
              />
            ))}

            {/* Add new project card */}
            <button
              onClick={() => router.push('/search')}
              className={cn(
                'flex items-center justify-center gap-2 py-5 rounded-2xl',
                'border-2 border-dashed border-[var(--color-border-secondary)]',
                'text-[var(--color-text-tertiary)]',
                'hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/30',
                'transition-all duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
              )}
              aria-label="Add new video project"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span className="text-body-sm font-medium">Add a new video</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

LibraryPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}

export default LibraryPage
