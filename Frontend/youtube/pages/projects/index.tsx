// ============================================================
// VidMind AI — Projects Page
// pages/projects/index.tsx
//
// Full grid of all video project cards.
// Each card shows the YouTube thumbnail, cuts/chats/research
// pills, and status dot. Clicking a card expands an inline
// detail panel (Cuts | Chats | Research | Transcript tabs).
// ============================================================

import React, { useState, useMemo, useEffect } from 'react'
import { AppShell }             from '@/components/layout/AppShell'
import { clientNavigate }       from '@/hooks/useClientPathname'
import {
  Scissors, MessageSquare, Globe, FileText,
  Play, Download, Plus, Search, ChevronRight, ChevronDown,
  Crown, Clock, CheckCircle, ExternalLink, Trash2, Loader2,
} from 'lucide-react'
import { cn }            from '@/utils/cn'
import { useAuthStore }  from '@/store/auth.store'
import { apiClient }     from '@/utils/apiClient'
import { useToast }      from '@/components/ui/Toast'
import { Button }        from '@components/ui/Button'
import { StatusBadge }   from '@components/ui/Badge'
import { EmptyState, EmptyIcons } from '@components/ui'
import { formatDuration, RelativeDate } from '@components/video/VideoCard'
import type { NextPageWithLayout } from '../_app'
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

// ── Helpers ───────────────────────────────────────────────

const STATUS_DOT: Record<ProcessingStatus, { bg: string; border: string; title: string }> = {
  pending:    { bg: 'bg-warning-50',  border: 'border-warning-200',  title: 'Pending'    },
  processing: { bg: 'bg-primary-50',  border: 'border-primary-200',  title: 'Processing' },
  completed:  { bg: 'bg-success-50',  border: 'border-success-200',  title: 'Completed'  },
  failed:     { bg: 'bg-danger-50',   border: 'border-danger-200',   title: 'Failed'     },
}

// ── Thumbnail ─────────────────────────────────────────────

const Thumb: React.FC<{ youtubeId: string; title: string }> = ({ youtubeId, title }) => {
  const [err, setErr] = useState(false)
  return (
    <div className="relative w-full aspect-video bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden">
      {!err ? (
        <img
          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-slow"
          onError={() => setErr(true)}
          loading="lazy"
        />
      ) : (
        <Play className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      )}
    </div>
  )
}

// ── CutsTab ───────────────────────────────────────────────

const CutsTab: React.FC<{ cuts: VideoCut[]; onOpen: () => void }> = ({ cuts, onOpen }) => (
  <div className="flex flex-col divide-y divide-[var(--color-border-tertiary)]">
    {cuts.map((cut, i) => (
      <div key={cut.id} className="flex items-center gap-3 py-2.5 px-1">
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-medium',
          cut.user_approved ? 'bg-success-50 text-success-800' : 'bg-primary-50 text-primary-800',
        )}>
          {cut.user_approved ? <CheckCircle className="w-3 h-3" /> : i + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{cut.title ?? `Segment ${i + 1}`}</p>
          <p className="text-caption text-[var(--color-text-tertiary)] tabular-nums">
            {formatDuration(cut.start_seconds)} → {formatDuration(cut.end_seconds)}
            <span className="ml-1">· {formatDuration(cut.end_seconds - cut.start_seconds)}</span>
          </p>
        </div>
        {cut.download_status === 'ready' ? (
          <button className="text-caption text-success-800 flex items-center gap-1 hover:opacity-80 transition-opacity">
            <Download className="w-3 h-3" /> Ready
          </button>
        ) : (
          <button className="text-caption text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1">
            <Download className="w-3 h-3" /> Download
          </button>
        )}
      </div>
    ))}
    <div className="pt-3 pb-1">
      <Button variant="primary" size="sm" onClick={onOpen} rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
        Open full workspace
      </Button>
    </div>
  </div>
)

// ── ChatsTab ──────────────────────────────────────────────

const ChatsTab: React.FC<{
  chats:       ChatSession[]
  userVideoId: string
  onNewChat:   () => void
  navigate:    (to: string) => void
}> = ({ chats, userVideoId, onNewChat, navigate }) => (
  <div className="flex flex-col gap-1">
    {chats.length === 0 ? (
      <EmptyState
        icon={EmptyIcons.chat}
        title="No chats yet"
        description="Start a conversation about this video."
        action={{ label: 'Start new chat', onClick: onNewChat }}
        minHeight="140px"
      />
    ) : (
      <>
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => navigate(`/chat/${chat.id}`)}
            className={cn(
              'flex items-center gap-3 px-2 py-2.5 rounded-md text-left w-full',
              'hover:bg-[var(--color-bg-secondary)] transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
            )}
          >
            <div className="w-7 h-7 rounded-md bg-premium-50 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-premium-600" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{chat.title ?? 'Untitled chat'}</p>
              <p className="text-caption text-[var(--color-text-tertiary)]">
                {chat.messages?.length ?? 0} messages · <RelativeDate date={chat.updated_at} />
              </p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" aria-hidden="true" />
          </button>
        ))}
        <div className="pt-2">
          <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onNewChat}>
            New chat for this video
          </Button>
        </div>
      </>
    )}
  </div>
)

// ── ResearchTab ───────────────────────────────────────────

const ResearchTab: React.FC<{
  research:    ResearchSession[]
  isPremium:   boolean
  onNewReport: () => void
  navigate:    (to: string) => void
}> = ({ research, isPremium, onNewReport, navigate }) => {
  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <Crown className="w-8 h-8 text-premium-400" aria-hidden="true" />
        <p className="text-heading-sm text-[var(--color-text-primary)]">Deep research is Premium</p>
        <p className="text-body-sm text-[var(--color-text-secondary)] max-w-xs">
          Upgrade to run AI-powered research that scours the web and returns a cited report.
        </p>
        <Button
          variant="primary" size="sm"
          onClick={() => navigate('/pricing')}
          className="bg-premium-600 border-premium-600 hover:bg-premium-800 hover:border-premium-800"
        >
          Upgrade to Premium
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {research.length === 0 ? (
        <EmptyState
          icon={EmptyIcons.research}
          title="No research yet"
          description="Run deep research on this video's topic."
          action={{ label: 'Start research', onClick: onNewReport }}
          minHeight="140px"
        />
      ) : (
        <>
          {research.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/research/${r.id}`)}
              className={cn(
                'flex items-center gap-3 px-2 py-2.5 rounded-md text-left w-full',
                'hover:bg-[var(--color-bg-secondary)] transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
              )}
            >
              <div className="w-7 h-7 rounded-md bg-success-50 flex items-center justify-center shrink-0">
                <Globe className="w-3.5 h-3.5 text-success-600" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{r.title ?? 'Research report'}</p>
                <p className="text-caption text-[var(--color-text-tertiary)]">
                  {r.sources?.length ?? 0} sources
                  {r.completed_at && <> · <RelativeDate date={r.completed_at} /></>}
                </p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] shrink-0" aria-hidden="true" />
            </button>
          ))}
          <div className="pt-2">
            <Button variant="secondary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={onNewReport}>
              New research report
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ── Detail Panel ──────────────────────────────────────────

type DetailTab = 'cuts' | 'chats' | 'research' | 'transcript'

const DetailPanel: React.FC<{
  project:   VideoProject
  isPremium: boolean
  onClose:   () => void
}> = ({ project, isPremium, onClose }) => {
  const navigate = (to: string) => clientNavigate(to)
  const [tab, setTab] = useState<DetailTab>('cuts')
  const { userVideo, cuts, chats, research } = project

  const TABS: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'cuts',       label: 'Cuts',       count: cuts.length     },
    { id: 'chats',      label: 'Chats',      count: chats.length    },
    { id: 'research',   label: 'Research',   count: research.length },
    { id: 'transcript', label: 'Transcript'                          },
  ]

  return (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border-tertiary)]">
        <button
          onClick={onClose}
          className="text-caption text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:underline"
          aria-label="Back to all projects"
        >
          ← Back
        </button>
        <div className="w-px h-4 bg-[var(--color-border-tertiary)]" />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{userVideo.video.title}</p>
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {userVideo.video.channel_name} · {formatDuration(userVideo.video.duration_seconds)}
          </p>
        </div>
        <StatusBadge status={userVideo.processing_status} size="sm" />
        <Button
          variant="primary" size="sm"
          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => navigate(`/workspace/${userVideo.id}`)}
        >
          Open workspace
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border-tertiary)]" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id} role="tab" aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-body-sm font-medium border-b-2 transition-colors duration-fast focus-visible:outline-none',
              tab === t.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={cn(
                'text-caption font-medium px-1.5 py-0.5 rounded-full',
                tab === t.id ? 'bg-primary-50 text-primary-800' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]',
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {tab === 'cuts' && <CutsTab cuts={cuts} onOpen={() => navigate(`/workspace/${userVideo.id}`)} />}
        {tab === 'chats' && (
          <ChatsTab
            chats={chats} userVideoId={userVideo.id}
            onNewChat={() => navigate(`/chat?videoId=${userVideo.id}`)}
            navigate={navigate}
          />
        )}
        {tab === 'research' && (
          <ResearchTab
            research={research} isPremium={isPremium}
            onNewReport={() => navigate(`/research?videoId=${userVideo.id}`)}
            navigate={navigate}
          />
        )}
        {tab === 'transcript' && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <FileText className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <p className="text-heading-sm text-[var(--color-text-primary)]">View full transcript</p>
            <p className="text-body-sm text-[var(--color-text-secondary)]">Open the workspace to view and search the transcript.</p>
            <Button variant="secondary" size="sm" onClick={() => navigate(`/workspace/${userVideo.id}`)}>
              Open workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Project Card ──────────────────────────────────────────

const ProjectCard: React.FC<{
  project:    VideoProject
  isExpanded: boolean
  onToggle:   () => void
  onDelete:   (id: string, e: React.MouseEvent) => void
}> = ({ project, isExpanded, onToggle, onDelete }) => {
  const { userVideo, cuts, chats, research } = project
  const v   = userVideo.video
  const dot = STATUS_DOT[userVideo.processing_status]

  return (
    <div
      className={cn(
        'bg-[var(--color-bg-primary)] border rounded-xl overflow-hidden group cursor-pointer',
        'transition-colors duration-fast',
        isExpanded
          ? 'border-primary-200 ring-2 ring-primary-100'
          : 'border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)]',
      )}
      onClick={onToggle}
      role="button" tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      aria-expanded={isExpanded}
      aria-label={`${v.title} project`}
    >
      {/* Thumbnail */}
      <div className="relative">
        <Thumb youtubeId={v.youtube_id} title={v.title} />
        {/* Status dot */}
        <div
          className={cn('absolute top-2 left-2 w-2.5 h-2.5 rounded-full border-2', dot.bg, dot.border)}
          title={dot.title} aria-label={`Status: ${dot.title}`}
        />
        {/* Delete */}
        <button
          type="button"
          onClick={(e) => onDelete(userVideo.id, e)}
          className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 hover:bg-danger-600 text-white transition-colors duration-fast z-10"
          title="Delete project" aria-label={`Delete ${v.title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {/* Duration */}
        <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          {formatDuration(v.duration_seconds)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug mb-1">{v.title}</p>
        <p className="text-caption text-[var(--color-text-tertiary)] mb-2.5 truncate">{v.channel_name}</p>

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium',
            cuts.length > 0 ? 'bg-primary-50 text-primary-800' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]')}>
            <Scissors className="w-3 h-3" aria-hidden="true" />
            {cuts.length > 0 ? `${cuts.length} cut${cuts.length !== 1 ? 's' : ''}` : 'No cuts'}
          </span>
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium',
            chats.length > 0 ? 'bg-premium-50 text-premium-800' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]')}>
            <MessageSquare className="w-3 h-3" aria-hidden="true" />
            {chats.length > 0 ? `${chats.length} chat${chats.length !== 1 ? 's' : ''}` : 'No chats'}
          </span>
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-medium',
            research.length > 0 ? 'bg-success-50 text-success-800' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]')}>
            <Globe className="w-3 h-3" aria-hidden="true" />
            {research.length > 0 ? `${research.length} report${research.length !== 1 ? 's' : ''}` : 'No research'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-caption text-[var(--color-text-tertiary)]">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {userVideo.last_accessed_at ? <RelativeDate date={userVideo.last_accessed_at} /> : 'Never'}
          </span>
          <span className={cn('flex items-center gap-1 text-caption font-medium transition-colors duration-fast',
            isExpanded ? 'text-primary-600' : 'text-[var(--color-text-secondary)]')}>
            {isExpanded ? <><ChevronDown className="w-3.5 h-3.5" /> Close</> : <><ChevronRight className="w-3.5 h-3.5" /> Open</>}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────

const ProjectsPage: NextPageWithLayout = () => {
  const navigate   = (to: string) => clientNavigate(to)
  const { user }   = useAuthStore()
  const isPremium  = user?.subscription_tier === 'premium'

  const { toast }  = useToast()
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const expandedProject = useMemo(
    () => projects.find((p) => p.userVideo.id === expandedId) ?? null,
    [projects, expandedId],
  )

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const videosRes   = await apiClient.get('/videos/')
        const userVideos: UserVideo[] = videosRes.data.results || videosRes.data || []

        const chatsRes    = await apiClient.get('/chat/sessions/')
        const allChats: ChatSession[] = chatsRes.data.results || chatsRes.data || []

        const researchRes = await apiClient.get('/research/')
        const allResearch: ResearchSession[] = researchRes.data.results || researchRes.data || []

        const list: VideoProject[] = await Promise.all(
          userVideos.map(async (uv) => {
            try {
              const detailRes = await apiClient.get(`/videos/${uv.id}/`)
              const detail    = detailRes.data
              const videoChats    = allChats.filter((c: any) => c.video_ids?.includes(uv.id))
              const videoResearch = allResearch.filter((r) => {
                const id = typeof r.user_video === 'object' && r.user_video !== null ? r.user_video.id : r.user_video
                return id === uv.id
              })
              return { userVideo: detail, cuts: detail.cuts || [], chats: videoChats, research: videoResearch }
            } catch {
              return { userVideo: uv, cuts: [], chats: [], research: [] }
            }
          }),
        )
        setProjects(list)
      } catch {
        toast.error('Failed to load projects.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
    if (expandedId !== id) {
      setTimeout(() => {
        document.getElementById('project-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const title = projects.find((p) => p.userVideo.id === id)?.userVideo.video.title ?? 'this project'
    if (!window.confirm(`Delete "${title}"? This removes all cuts, chats, and research.`)) return
    try {
      await apiClient.delete(`/videos/${id}/`)
      setProjects((prev) => prev.filter((p) => p.userVideo.id !== id))
      if (expandedId === id) setExpandedId(null)
      toast.success('Project deleted.')
    } catch {
      toast.error('Failed to delete project.')
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-content mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-heading-xl text-[var(--color-text-primary)]">Projects</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            {isLoading ? 'Loading…' : `${projects.length} video project${projects.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button
          variant="primary" size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => navigate('/search')}
        >
          New project
        </Button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(null).map((_, i) => (
            <div key={i} className="border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden animate-pulse">
              <div className="w-full aspect-video bg-[var(--color-bg-tertiary)]" />
              <div className="p-3 space-y-2">
                <div className="h-3.5 rounded bg-[var(--color-bg-tertiary)] w-4/5" />
                <div className="h-3 rounded bg-[var(--color-bg-tertiary)] w-1/3" />
                <div className="flex gap-2 pt-1">
                  <div className="h-5 rounded-full bg-[var(--color-bg-tertiary)] w-16" />
                  <div className="h-5 rounded-full bg-[var(--color-bg-tertiary)] w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projects.length === 0 && (
        <EmptyState
          icon={EmptyIcons.video}
          title="No projects yet"
          description="Search for a YouTube video and process it to create your first project."
          action={{ label: 'Search videos', onClick: () => navigate('/search') }}
        />
      )}

      {/* Expanded detail panel */}
      {expandedProject && (
        <div id="project-detail">
          <DetailPanel
            project={expandedProject}
            isPremium={isPremium}
            onClose={() => setExpandedId(null)}
          />
        </div>
      )}

      {/* Project grid */}
      {!isLoading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.userVideo.id}
              project={project}
              isExpanded={expandedId === project.userVideo.id}
              onToggle={() => handleToggle(project.userVideo.id)}
              onDelete={handleDelete}
            />
          ))}

          {/* Add new card */}
          <button
            onClick={() => navigate('/search')}
            className={cn(
              'flex flex-col items-center justify-center gap-2',
              'border-2 border-dashed border-[var(--color-border-secondary)]',
              'rounded-xl p-8 text-[var(--color-text-tertiary)]',
              'hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50/30',
              'transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
              'min-h-[180px]',
            )}
            aria-label="Add new video project"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
            <span className="text-body-sm font-medium">Add video project</span>
            <span className="text-caption">Paste a link or search</span>
          </button>
        </div>
      )}
    </div>
  )
}

ProjectsPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}

export default ProjectsPage
