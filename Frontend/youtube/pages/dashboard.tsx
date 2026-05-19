// ============================================================
// VidMind AI — Dashboard Page (Redesigned)
// pages/dashboard.tsx
//
// Video Project Folder System:
//  - Each video is a "project folder"
//  - Folder card shows cut count, chat count, research count
//  - Clicking a folder opens an inline detail panel with tabs:
//      Cuts | Chats | Research | Transcript
//  - Stats row with free-tier usage meters
//  - Quick search bar at the top
// ============================================================

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  Scissors,
  MessageSquare,
  Globe,
  FileText,
  Play,
  Download,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Crown,
  ArrowRight,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import { cn }            from '@/utils/cn'
import { useAuthStore }  from '@/store/auth.store'
import Button            from '@components/ui/Button'
import { StatusBadge }   from '@components/ui/Badge'
import { UsageMeter }    from '@components/ui/ProgressBar'
import { EmptyState, EmptyIcons } from '@components/ui'
import { formatDuration, formatRelativeDate } from '@components/video/VideoCard'
import type {
  UserVideo, VideoCut, ChatSession,
  ResearchSession, ProcessingStatus,
} from '@/types'

// ============================================================
// MOCK DATA — replace with React Query hooks
// ============================================================

interface VideoProject {
  userVideo:    UserVideo
  cuts:         VideoCut[]
  chats:        ChatSession[]
  research:     ResearchSession[]
}

const MOCK_PROJECTS: VideoProject[] = [
  {
    userVideo: {
      id: 'uv1', user_id: 'u1',
      storage_type: 'reference',
      file_url: null,
      processing_status: 'completed',
      saved_at: new Date(Date.now() - 86_400_000).toISOString(),
      last_accessed_at: new Date(Date.now() - 3_600_000).toISOString(),
      video: {
        id: 'v1', youtube_id: 'dQw4w9WgXcQ',
        title: 'Full React JS Course for Beginners',
        description: null,
        thumbnail_url: `https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg`,
        duration_seconds: 13330,
        channel_id: 'c1', channel_name: 'Fireship',
        category: 'Tutorial', published_at: null,
        created_at: new Date().toISOString(),
      },
    },
    cuts: [
      { id: 'c1', user_video_id: 'uv1', cut_order: 1, start_seconds: 0,     end_seconds: 980,  title: 'Introduction & what are hooks?',    ai_rationale: 'Topic shifts to useState', ai_suggested: true, user_approved: true,  download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 980  },
      { id: 'c2', user_video_id: 'uv1', cut_order: 2, start_seconds: 980,   end_seconds: 2325, title: 'useState — state management basics', ai_rationale: 'useState section ends',    ai_suggested: true, user_approved: true,  download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 1345 },
      { id: 'c3', user_video_id: 'uv1', cut_order: 3, start_seconds: 2325,  end_seconds: 3730, title: 'useEffect — side effects & cleanup', ai_rationale: 'Custom hooks begin',       ai_suggested: true, user_approved: false, download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 1405 },
      { id: 'c4', user_video_id: 'uv1', cut_order: 4, start_seconds: 3730,  end_seconds: 5280, title: 'Custom hooks — reusable logic',       ai_rationale: 'useContext introduced',   ai_suggested: true, user_approved: true,  download_url: null, download_status: 'ready',   created_at: '', updated_at: '', duration_seconds: 1550 },
      { id: 'c5', user_video_id: 'uv1', cut_order: 5, start_seconds: 5280,  end_seconds: 6610, title: 'useContext — global state',           ai_rationale: 'useReducer introduced',   ai_suggested: true, user_approved: true,  download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 1330 },
    ],
    chats: [
      { id: 'ch1', user_id: 'u1', title: 'React hooks deep dive', is_multi_video: false, videos: [], messages: Array(14).fill(null), created_at: new Date(Date.now() - 3_600_000).toISOString(), updated_at: new Date(Date.now() - 3_600_000).toISOString(), last_message: null },
      { id: 'ch2', user_id: 'u1', title: 'Hooks vs class components', is_multi_video: false, videos: [], messages: Array(6).fill(null), created_at: new Date(Date.now() - 86_400_000).toISOString(), updated_at: new Date(Date.now() - 86_400_000).toISOString(), last_message: null },
    ],
    research: [
      { id: 'r1', user_id: 'u1', user_video: {} as any, title: 'React hooks & state management 2024', report_content: 'Full report content…', status: 'completed', sources: Array(12).fill(null), completed_at: new Date(Date.now() - 172_800_000).toISOString(), created_at: '', updated_at: '' },
    ],
  },
  {
    userVideo: {
      id: 'uv2', user_id: 'u1',
      storage_type: 'reference',
      file_url: null,
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
    cuts: [
      { id: 'c6', user_video_id: 'uv2', cut_order: 1, start_seconds: 0,    end_seconds: 720,  title: 'DRF setup & serializers',   ai_rationale: 'Views section begins',  ai_suggested: true, user_approved: false, download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 720  },
      { id: 'c7', user_video_id: 'uv2', cut_order: 2, start_seconds: 720,  end_seconds: 1980, title: 'ViewSets & routers',         ai_rationale: 'Auth section begins',   ai_suggested: true, user_approved: false, download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 1260 },
      { id: 'c8', user_video_id: 'uv2', cut_order: 3, start_seconds: 1980, end_seconds: 3120, title: 'Authentication & permissions', ai_rationale: 'Testing begins',       ai_suggested: true, user_approved: false, download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 1140 },
    ],
    chats: [],
    research: [],
  },
  {
    userVideo: {
      id: 'uv3', user_id: 'u1',
      storage_type: 'reference',
      file_url: null,
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
    cuts: [
      { id: 'c9',  user_video_id: 'uv3', cut_order: 1, start_seconds: 0,    end_seconds: 600,  title: 'Introduction & installation', ai_rationale: null, ai_suggested: true, user_approved: true, download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 600  },
      { id: 'c10', user_video_id: 'uv3', cut_order: 2, start_seconds: 600,  end_seconds: 1440, title: 'Tables & data types',         ai_rationale: null, ai_suggested: true, user_approved: true, download_url: null, download_status: 'pending', created_at: '', updated_at: '', duration_seconds: 840  },
      { id: 'c11', user_video_id: 'uv3', cut_order: 3, start_seconds: 1440, end_seconds: 2280, title: 'SQL queries & joins',          ai_rationale: null, ai_suggested: true, user_approved: true, download_url: null, download_status: 'ready',   created_at: '', updated_at: '', duration_seconds: 840  },
    ],
    chats: [
      { id: 'ch3', user_id: 'u1', title: 'PostgreSQL indexing strategies', is_multi_video: false, videos: [], messages: Array(5).fill(null), created_at: new Date(Date.now() - 86_400_000).toISOString(), updated_at: new Date(Date.now() - 86_400_000).toISOString(), last_message: null },
    ],
    research: [],
  },
]

const MOCK_USAGE = {
  searches: { used: 3, limit: 5 },
  cuts:     { used: 1, limit: 3 },
  transcriptions: { used: 2, limit: 3 },
}

// ============================================================
// HELPERS
// ============================================================

function getGreeting(name: string): string {
  const h = new Date().getHours()
  return `Good ${h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'}, ${name}`
}

const STATUS_DOT: Record<ProcessingStatus, { bg: string; border: string; title: string }> = {
  pending:    { bg: 'bg-warning-50',  border: 'border-warning-200',  title: 'Pending' },
  processing: { bg: 'bg-primary-50',  border: 'border-primary-200',  title: 'Processing' },
  completed:  { bg: 'bg-success-50',  border: 'border-success-200',  title: 'Completed' },
  failed:     { bg: 'bg-danger-50',   border: 'border-danger-200',   title: 'Failed' },
}

// ============================================================
// THUMBNAIL PLACEHOLDER
// ============================================================

const ThumbPlaceholder: React.FC<{ youtubeId: string; title: string; size?: 'sm' | 'md' }> = ({
  youtubeId, title, size = 'md',
}) => {
  const [err, setErr] = useState(false)
  const src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
  const h   = size === 'sm' ? 'h-9' : 'h-12'

  return (
    <div className={cn('w-full rounded-md overflow-hidden bg-[var(--color-bg-tertiary)] flex items-center justify-center', h)}>
      {!err ? (
        <img src={src} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} loading="lazy" />
      ) : (
        <Play className="w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      )}
    </div>
  )
}

// ============================================================
// FOLDER DETAIL PANEL — tabs: Cuts | Chats | Research | Transcript
// ============================================================

const CutsTab: React.FC<{
  cuts:     VideoCut[]
  onOpen:   () => void
}> = ({ cuts, onOpen }) => (
  <div className="flex flex-col divide-y divide-[var(--color-border-tertiary)]">
    {cuts.map((cut, i) => (
      <div key={cut.id} className="flex items-center gap-3 py-2.5 px-1">
        {/* Number badge */}
        <div className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
          'text-[11px] font-medium',
          cut.user_approved ? 'bg-success-50 text-success-800' : 'bg-primary-50 text-primary-800',
        )}>
          {cut.user_approved ? <CheckCircle className="w-3 h-3" /> : i + 1}
        </div>
        {/* Title + time */}
        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{cut.title ?? `Segment ${i + 1}`}</p>
          <p className="text-caption text-[var(--color-text-tertiary)] tabular-nums">
            {formatDuration(cut.start_seconds)} → {formatDuration(cut.end_seconds)}
            <span className="ml-1">· {formatDuration(cut.end_seconds - cut.start_seconds)}</span>
          </p>
        </div>
        {/* Download status */}
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
                {chat.messages.length} messages · {formatRelativeDate(chat.updated_at)}
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
          variant="primary"
          size="sm"
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
                  {r.sources.length} sources
                  {r.completed_at && ` · ${formatRelativeDate(r.completed_at)}`}
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

// ============================================================
// FOLDER DETAIL PANEL
// ============================================================

type DetailTab = 'cuts' | 'chats' | 'research' | 'transcript'

const FolderDetailPanel: React.FC<{
  project:   VideoProject
  isPremium: boolean
  onClose:   () => void
}> = ({ project, isPremium, onClose }) => {
  const router            = useRouter()
  const [tab, setTab]     = useState<DetailTab>('cuts')
  const { userVideo, cuts, chats, research } = project

  const TABS: { id: DetailTab; label: string; count?: number }[] = [
    { id: 'cuts',       label: 'Cuts',       count: cuts.length     },
    { id: 'chats',      label: 'Chats',      count: chats.length    },
    { id: 'research',   label: 'Research',   count: research.length },
    { id: 'transcript', label: 'Transcript'                          },
  ]

  return (
    <div className={cn(
      'bg-[var(--color-bg-primary)]',
      'border border-[var(--color-border-secondary)]',
      'rounded-xl overflow-hidden',
      'animate-slide-up',
    )}>
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
          <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">
            {userVideo.video.title}
          </p>
          <p className="text-caption text-[var(--color-text-tertiary)]">
            {userVideo.video.channel_name} · {formatDuration(userVideo.video.duration_seconds)}
          </p>
        </div>
        <StatusBadge status={userVideo.processing_status} size="sm" />
        <Button
          variant="primary"
          size="sm"
          rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
          onClick={() => router.push(`/workspace/${userVideo.id}`)}
        >
          Open workspace
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--color-border-tertiary)]" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5',
              'text-body-sm font-medium',
              'border-b-2 transition-colors duration-fast',
              'focus-visible:outline-none',
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
        {tab === 'cuts' && (
          <CutsTab
            cuts={cuts}
            onOpen={() => router.push(`/workspace/${userVideo.id}`)}
          />
        )}
        {tab === 'chats' && (
          <ChatsTab
            chats={chats}
            userVideoId={userVideo.id}
            onNewChat={() => router.push(`/chat?videoId=${userVideo.id}`)}
            navigate={(to) => router.push(to)}
          />
        )}
        {tab === 'research' && (
          <ResearchTab
            research={research}
            isPremium={isPremium}
            onNewReport={() => router.push(`/research?videoId=${userVideo.id}`)}
            navigate={(to) => router.push(to)}
          />
        )}
        {tab === 'transcript' && (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
            <FileText className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <p className="text-heading-sm text-[var(--color-text-primary)]">View full transcript</p>
            <p className="text-body-sm text-[var(--color-text-secondary)]">Open the workspace to view and search the transcript.</p>
            <Button variant="secondary" size="sm" onClick={() => router.push(`/workspace/${userVideo.id}`)}>
              Open workspace
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// FOLDER CARD
// ============================================================

const FolderCard: React.FC<{
  project:    VideoProject
  isExpanded: boolean
  onToggle:   () => void
}> = ({ project, isExpanded, onToggle }) => {
  const { userVideo, cuts, chats, research } = project
  const v      = userVideo.video
  const dot    = STATUS_DOT[userVideo.processing_status]

  const lastAccessed = userVideo.last_accessed_at
    ? formatRelativeDate(userVideo.last_accessed_at)
    : 'Never'

  return (
    <div
      className={cn(
        'bg-[var(--color-bg-primary)] border rounded-xl overflow-hidden',
        'transition-colors duration-fast cursor-pointer',
        isExpanded
          ? 'border-primary-200 ring-2 ring-primary-100'
          : 'border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)]',
      )}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onToggle()}
      aria-expanded={isExpanded}
      aria-label={`${v.title} project folder`}
    >
      {/* Thumbnail strip */}
      <div className="relative">
        <ThumbPlaceholder youtubeId={v.youtube_id} title={v.title} size="md" />
        {/* Status dot */}
        <div
          className={cn(
            'absolute top-2 right-2 w-2.5 h-2.5 rounded-full border-2',
            dot.bg, dot.border,
          )}
          title={dot.title}
          aria-label={`Status: ${dot.title}`}
        />
        {/* Duration overlay */}
        <span className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
          {formatDuration(v.duration_seconds)}
        </span>
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug mb-1">
          {v.title}
        </p>
        <p className="text-caption text-[var(--color-text-tertiary)] mb-2.5 truncate">
          {v.channel_name}
        </p>

        {/* Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* Cuts */}
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
            'text-caption font-medium',
            cuts.length > 0
              ? 'bg-primary-50 text-primary-800'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]',
          )}>
            <Scissors className="w-3 h-3" aria-hidden="true" />
            {cuts.length > 0 ? `${cuts.length} cut${cuts.length !== 1 ? 's' : ''}` : 'No cuts'}
          </span>

          {/* Chats */}
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
            'text-caption font-medium',
            chats.length > 0
              ? 'bg-premium-50 text-premium-800'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]',
          )}>
            <MessageSquare className="w-3 h-3" aria-hidden="true" />
            {chats.length > 0 ? `${chats.length} chat${chats.length !== 1 ? 's' : ''}` : 'No chats'}
          </span>

          {/* Research */}
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full',
            'text-caption font-medium',
            research.length > 0
              ? 'bg-success-50 text-success-800'
              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] border border-[var(--color-border-tertiary)]',
          )}>
            <Globe className="w-3 h-3" aria-hidden="true" />
            {research.length > 0 ? `${research.length} report${research.length !== 1 ? 's' : ''}` : 'No research'}
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-caption text-[var(--color-text-tertiary)]">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {lastAccessed}
          </div>
          <div className={cn(
            'flex items-center gap-1 text-caption font-medium transition-colors duration-fast',
            isExpanded ? 'text-primary-600' : 'text-[var(--color-text-secondary)]',
          )}>
            {isExpanded ? (
              <><ChevronDown className="w-3.5 h-3.5" /> Close</>
            ) : (
              <><ChevronRight className="w-3.5 h-3.5" /> Open</>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// STAT CARD
// ============================================================

const StatCard: React.FC<{
  label:       string
  value:       string | number
  sub?:        string
  subVariant?: 'default' | 'primary' | 'warning' | 'premium'
  meter?:      { used: number; limit: number }
}> = ({ label, value, sub, subVariant = 'default', meter }) => {
  const subColour = {
    default: 'text-[var(--color-text-tertiary)]',
    primary: 'text-primary-600',
    warning: 'text-warning-800',
    premium: 'text-premium-800',
  }[subVariant]

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-md p-4">
      <p className="text-label text-[var(--color-text-tertiary)] mb-1">{label}</p>
      <p className="text-heading-xl text-[var(--color-text-primary)] tabular-nums">{value}</p>
      {sub && <p className={cn('text-caption mt-1', subColour)}>{sub}</p>}
      {meter && (
        <UsageMeter label="" used={meter.used} limit={meter.limit} className="mt-2" />
      )}
    </div>
  )
}

// ============================================================
// QUICK SEARCH BAR
// ============================================================

const QuickSearch: React.FC = () => {
  const router = useRouter()
  const [val, setVal] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = val.trim()
    if (!t) return
    router.push(/youtube\.com|youtu\.be/i.test(t)
      ? `/workspace/new?url=${encodeURIComponent(t)}`
      : `/search?q=${encodeURIComponent(t)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className={cn(
        'flex items-center gap-2 h-11 px-4',
        'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-xl',
        'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200',
        'transition-colors duration-fast',
      )}>
        <Search className="w-4 h-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
        <input
          type="text"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Search a topic or paste a YouTube link…"
          className="flex-1 bg-transparent border-none outline-none text-body-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
          aria-label="Quick search"
        />
        {val && (
          <Button type="submit" variant="primary" size="sm">
            {/youtube\.com|youtu\.be/i.test(val) ? 'Process' : 'Search'}
          </Button>
        )}
      </div>
    </form>
  )
}

// ============================================================
// ONBOARDING EMPTY STATE
// ============================================================

const OnboardingState: React.FC = () => {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center gap-5">
      <div>
        <h2 className="text-heading-xl text-[var(--color-text-primary)] mb-2">
          Welcome to VidMind AI 🎉
        </h2>
        <p className="text-body-md text-[var(--color-text-secondary)] max-w-md">
          Paste a YouTube link to create your first video project. AI splits it into
          chapters, transcribes it, and lets you chat and run deep research — all in one place.
        </p>
      </div>
      <QuickSearch />
      <Button variant="secondary" size="md" leftIcon={<Search className="w-4 h-4" />} onClick={() => router.push('/search')}>
        Browse videos by topic
      </Button>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

export default function DashboardPage() {
  const router           = useRouter()
  const { user }         = useAuthStore()
  const isPremium        = user?.subscription_tier === 'premium'
  const name             = user?.first_name ?? 'there'
  const greeting         = useMemo(() => getGreeting(name), [name])

  // TODO: replace with React Query hooks
  const isLoading        = false
  const projects         = MOCK_PROJECTS
  const usage            = MOCK_USAGE

  const [expandedId, setExpandedId] = useState<string | null>(null)

  const expandedProject = useMemo(
    () => projects.find((p) => p.userVideo.id === expandedId) ?? null,
    [projects, expandedId]
  )

  const totalCuts   = projects.reduce((n, p) => n + p.cuts.length, 0)

  const handleToggle = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id))
    // Scroll to top of content area on mobile
    if (expandedId !== id) {
      setTimeout(() => {
        document.getElementById('project-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-content mx-auto">

      {/* Greeting + quick search */}
      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-heading-xl text-[var(--color-text-primary)]">{greeting}</h1>
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
            {projects.length > 0
              ? `You have ${projects.length} video project${projects.length !== 1 ? 's' : ''}`
              : 'Start your first video project'}
          </p>
        </div>
        <QuickSearch />
      </div>

      {/* Onboarding for new users */}
      {!isLoading && projects.length === 0 && <OnboardingState />}

      {/* Main content */}
      {(projects.length > 0 || isLoading) && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Video projects" value={projects.length} sub="+1 this week" />
            <StatCard
              label="Searches today"
              value={`${usage.searches.used}/${usage.searches.limit}`}
              sub={isPremium ? 'Unlimited' : 'Free tier'}
              subVariant={isPremium ? 'primary' : 'warning'}
              meter={isPremium ? undefined : usage.searches}
            />
            <StatCard label="Total cuts" value={totalCuts} sub={`Across ${projects.length} videos`} />
            <StatCard
              label="Deep research"
              value={isPremium ? projects.reduce((n, p) => n + p.research.length, 0) : '—'}
              sub={isPremium ? 'Reports generated' : 'Premium only'}
              subVariant={isPremium ? 'default' : 'premium'}
            />
          </div>

          {/* Upgrade banner */}
          {!isPremium && <UpgradeBanner />}

          {/* Expanded folder detail */}
          {expandedProject && (
            <div id="project-detail">
              <FolderDetailPanel
                project={expandedProject}
                isPremium={isPremium}
                onClose={() => setExpandedId(null)}
              />
            </div>
          )}

          {/* Projects grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-heading-md text-[var(--color-text-primary)]">
                {expandedProject ? 'All projects' : 'Video projects'}
              </h2>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => router.push('/search')}
              >
                New project
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <FolderCard
                  key={project.userVideo.id}
                  project={project}
                  isExpanded={expandedId === project.userVideo.id}
                  onToggle={() => handleToggle(project.userVideo.id)}
                />
              ))}

              {/* Add new project card */}
              <button
                onClick={() => router.push('/search')}
                className={cn(
                  'flex flex-col items-center justify-center gap-2',
                  'border-2 border-dashed border-[var(--color-border-secondary)]',
                  'rounded-xl p-8',
                  'text-[var(--color-text-tertiary)]',
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
          </div>
        </>
      )}
    </div>
  )
}
