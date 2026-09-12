// ============================================================
// VidMind AI — Dashboard Page
// src/pages/dashboard/index.tsx
//
// Overview page: greeting, quick search, stats, recent activity.
// Full project grid lives at /projects.
// ============================================================

import React, { useState, useMemo, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { clientNavigate }            from '@/hooks/useClientPathname'
import {
  Scissors,
  MessageSquare,
  Globe,
  Play,
  Plus,
  Search,
  ChevronRight,
  Crown,
  ArrowRight,
  Clock,
  CheckCircle,
  Download,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import { cn }            from '@/utils/cn'
import { useAuthStore }  from '@/store/auth.store'
import { apiClient }     from '@/utils/apiClient'
import { useToast }      from '@/components/ui/Toast'
import { Button } from '@components/ui/Button'
import { StatusBadge }   from '@components/ui/Badge'
import { UsageMeter }    from '@components/ui/ProgressBar'
import { EmptyState, EmptyIcons } from '@components/ui'
import { formatDuration, formatRelativeDate, RelativeDate } from '@components/video/VideoCard'
import type { NextPageWithLayout } from '../_app'
import type {
  UserVideo, VideoCut, ChatSession,
  ResearchSession, ProcessingStatus,
} from '@/types'

// ============================================================
// TYPES
// ============================================================

interface VideoProject {
  userVideo:    UserVideo
  cuts:         VideoCut[]
  chats:        ChatSession[]
  research:     ResearchSession[]
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
// THUMBNAIL — small strip used in recent activity rows
// ============================================================

const ThumbStrip: React.FC<{ youtubeId: string; title: string }> = ({ youtubeId, title }) => {
  const [err, setErr] = useState(false)
  const src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`
  return (
    <div className="w-14 h-10 rounded-md overflow-hidden bg-[var(--color-bg-tertiary)] flex items-center justify-center shrink-0">
      {!err ? (
        <img src={src} alt={title} className="w-full h-full object-cover" onError={() => setErr(true)} loading="lazy" />
      ) : (
        <Play className="w-4 h-4 text-[var(--color-text-tertiary)]" aria-hidden="true" />
      )}
    </div>
  )
}

// ============================================================
// RECENT PROJECT ROW
// ============================================================

const RecentProjectRow: React.FC<{ project: VideoProject }> = ({ project }) => {
  const navigate = (to: string) => clientNavigate(to)
  const { userVideo, cuts, chats, research } = project
  const v = userVideo.video
  return (
    <button
      onClick={() => navigate(`/workspace/${userVideo.id}`)}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left group',
        'hover:bg-[var(--color-bg-secondary)] transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
      )}
    >
      <ThumbStrip youtubeId={v.youtube_id} title={v.title} />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{v.title}</p>
        <p className="text-caption text-[var(--color-text-tertiary)] flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1"><Scissors className="w-3 h-3" />{cuts.length} cuts</span>
          <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{chats.length} chats</span>
          {research.length > 0 && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{research.length}</span>}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {userVideo.last_accessed_at && (
          <span className="text-caption text-[var(--color-text-tertiary)] hidden sm:block">
            <RelativeDate date={userVideo.last_accessed_at} />
          </span>
        )}
        <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-primary-600 transition-colors" />
      </div>
    </button>
  )
}

// ============================================================
// REMOVED: FOLDER DETAIL PANEL — now lives on /projects
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
                  {r.sources?.length ?? 0} sources
                  {r.completed_at && (
                    <>
                      {' · '}
                      <RelativeDate date={r.completed_at} />
                    </>
                  )}
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
  const navigate = (to: string) => clientNavigate(to)
  const [val, setVal] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const t = val.trim()
    if (!t) return
    navigate(/youtube\.com|youtu\.be/i.test(t)
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
// UPGRADE BANNER
// ============================================================

const UpgradeBanner: React.FC = () => {
  const navigate = (to: string) => clientNavigate(to)
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-premium-200 bg-premium-50">
      <Crown className="w-5 h-5 text-premium-600 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-premium-800">Unlock Premium</p>
        <p className="text-caption text-premium-600">Unlimited cuts, deep research, multi-video chat and more.</p>
      </div>
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate('/pricing')}
        className="shrink-0 bg-premium-600 border-premium-600 hover:bg-premium-800 hover:border-premium-800"
      >
        Upgrade
      </Button>
    </div>
  )
}

// ============================================================
// ONBOARDING EMPTY STATE
// ============================================================

const OnboardingState: React.FC = () => {
  const navigate = (to: string) => clientNavigate(to)
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center gap-5">
      <div>
        <h2 className="text-heading-xl text-[var(--color-text-primary)] mb-2">
          Welcome to ClipMide 🎉
        </h2>
        <p className="text-body-md text-[var(--color-text-secondary)] max-w-md">
          Paste a YouTube link to create your first video project. AI splits it into
          chapters, transcribes it, and lets you chat and run deep research — all in one place.
        </p>
      </div>
      <QuickSearch />
      <Button variant="secondary" size="md" leftIcon={<Search className="w-4 h-4" />} onClick={() => navigate('/search')}>
        Browse videos by topic
      </Button>
    </div>
  )
}

// ============================================================
// PAGE
// ============================================================

const DashboardPage: NextPageWithLayout = () => {
  const navigate         = (to: string) => clientNavigate(to)
  const { user }         = useAuthStore()
  const isPremium        = user?.subscription_tier === 'premium'
  const firstName        = user?.first_name ?? 'there'
  const [greeting, setGreeting] = useState<string>('Good day, there')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setGreeting(getGreeting(firstName))
    }
  }, [firstName])

  const { toast } = useToast()
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [usage, setUsage] = useState({
    searches: { used: 0, limit: 5 },
    cuts: { used: 0, limit: 3 },
    transcriptions: { used: 0, limit: 3 },
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // 1. Fetch user videos
        const videosRes = await apiClient.get('/videos/')
        const userVideos: UserVideo[] = videosRes.data.results || videosRes.data || []

        // 2. Fetch chat sessions
        const chatsRes = await apiClient.get('/chat/sessions/')
        const chats: ChatSession[] = chatsRes.data.results || chatsRes.data || []

        // 3. Fetch research sessions
        const researchRes = await apiClient.get('/research/')
        const research: ResearchSession[] = researchRes.data.results || researchRes.data || []

        // 4. Fetch usage
        const usageRes = await apiClient.get('/billing/usage/monthly/')
        const usageData = usageRes.data

        // 5. Build VideoProject list (cuts are prefetched directly on userVideos)
        const projectList: VideoProject[] = userVideos.map((uv) => {
          // Filter chats that have this video attached
          const videoChats = chats.filter((c: any) =>
            c.video_ids?.includes(uv.id)
          )

          // Filter research sessions for this video
          const videoResearch = research.filter((r) => {
            const rUvId = typeof r.user_video === 'object' && r.user_video !== null ? r.user_video.id : r.user_video
            return rUvId === uv.id
          })

          return {
            userVideo: uv,
            cuts: uv.cuts || [],
            chats: videoChats,
            research: videoResearch,
          }
        })

        setProjects(projectList)

        if (usageData) {
          setUsage({
            searches: { used: usageData.search || 0, limit: isPremium ? 9999 : 5 },
            cuts: { used: usageData.cut || 0, limit: isPremium ? 9999 : 3 },
            transcriptions: { used: usageData.transcription || 0, limit: isPremium ? 9999 : 3 },
          })
        }
      } catch (err) {
        toast.error('Failed to load dashboard data.')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [isPremium])

  const totalCuts   = projects.reduce((n, p) => n + p.cuts.length, 0)
  const totalResearch = projects.reduce((n, p) => n + p.research.length, 0)

  // 3 most recently accessed
  const recentProjects = useMemo(
    () => [...projects]
      .sort((a, b) => {
        const ta = a.userVideo.last_accessed_at ?? a.userVideo.saved_at
        const tb = b.userVideo.last_accessed_at ?? b.userVideo.saved_at
        return new Date(tb).getTime() - new Date(ta).getTime()
      })
      .slice(0, 4),
    [projects]
  )


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
            <StatCard label="Video projects" value={projects.length} sub={`${projects.length} saved`} />
            <StatCard
              label="Searches this month"
              value={isPremium ? usage.searches.used : `${usage.searches.used}/${usage.searches.limit}`}
              sub={isPremium ? 'This month' : 'Free tier'}
              subVariant={isPremium ? 'primary' : 'warning'}
              meter={isPremium ? undefined : usage.searches}
            />
            <StatCard label="Total cuts" value={totalCuts} sub={`Across ${projects.length} videos`} />
            <StatCard
              label="Deep research"
              value={isPremium ? totalResearch : '—'}
              sub={isPremium ? 'Reports generated' : 'Premium only'}
              subVariant={isPremium ? 'default' : 'premium'}
            />
          </div>

          {/* Upgrade banner */}
          {!isPremium && <UpgradeBanner />}

          {/* Recent projects */}
          {recentProjects.length > 0 && (
            <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)]">
                <h2 className="text-heading-sm text-[var(--color-text-primary)]">Recent projects</h2>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-caption text-primary-600 hover:text-primary-800 transition-colors flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-[var(--color-border-tertiary)]">
                {isLoading
                  ? Array(3).fill(null).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                        <div className="w-14 h-10 rounded-md bg-[var(--color-bg-tertiary)] shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 rounded bg-[var(--color-bg-tertiary)] w-3/4" />
                          <div className="h-2.5 rounded bg-[var(--color-bg-tertiary)] w-1/2" />
                        </div>
                      </div>
                    ))
                  : recentProjects.map((p) => (
                      <RecentProjectRow key={p.userVideo.id} project={p} />
                    ))
                }
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

DashboardPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}

export default DashboardPage
