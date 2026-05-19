'use client'

// src/app/(app)/research/[sessionId]/page.tsx
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Globe, Clock, Trash2, Crown, Download } from 'lucide-react'
import { cn }            from '@/utils/cn'
import { Button }        from '@/components/ui/Button'
import { IconButton }    from '@/components/ui/Button'
import { EmptyState, EmptyIcons } from '@/components/ui/EmptyState'
import { ConfirmModal }  from '@/components/ui/Modal'
import { useToast }      from '@/components/ui/Toast'
import { useAuthStore }  from '@/store/auth.store'
import ResearchReport    from '@/components/research/ResearchReport'
import type { ResearchSession, UserVideo } from '@/types'

// ── Mock data ─────────────────────────────────────────────

const MOCK_USER_VIDEO: UserVideo = {
  id: 'uv1', user_id: 'u1', storage_type: 'reference', file_url: null,
  processing_status: 'completed', saved_at: '', last_accessed_at: '',
  video: { id: 'v1', youtube_id: 'dQw4w9WgXcQ', title: 'Full React JS Course for Beginners', description: null, thumbnail_url: null, duration_seconds: 13330, channel_id: 'c1', channel_name: 'Fireship', category: 'Tutorial', published_at: null, created_at: '' },
}

const MOCK_SESSIONS: ResearchSession[] = [
  {
    id: 'r1', user_id: 'u1', user_video: MOCK_USER_VIDEO,
    title: 'React hooks & modern state management 2024',
    report_content: `## Introduction\n\nReact hooks fundamentally changed how developers write React components. Since their introduction in React 16.8, hooks have become the standard way to manage state and side effects in functional components.\n\n## The useState Hook\n\nThe useState hook provides a simple way to add state to functional components. Unlike class-based state, useState allows you to split state into independent variables, each with their own setter function. This leads to cleaner code and easier testing.\n\n## useEffect and Side Effects\n\nManaging side effects is one of the most important aspects of React development. The useEffect hook replaces the lifecycle methods componentDidMount, componentDidUpdate, and componentWillUnmount, providing a unified API for all side effects.\n\n## Custom Hooks: The Real Power\n\nPerhaps the most powerful aspect of the hooks system is the ability to create custom hooks. Custom hooks let you extract component logic into reusable functions, enabling powerful abstractions and shared logic across components.\n\n## Performance Optimisation\n\nHooks like useMemo and useCallback are critical for performance optimisation in React applications. These hooks memoize values and functions respectively, preventing unnecessary recalculations and re-renders.`,
    status: 'completed',
    sources: [
      { id: 's1', research_session_id: 'r1', url: 'https://react.dev/reference/react', title: 'React Official Documentation — Hooks Reference', excerpt: 'The complete reference for all built-in React hooks with examples.', source_type: 'website', relevance_rank: 1, fetched_at: '' },
      { id: 's2', research_session_id: 'r1', url: 'https://kentcdodds.com/blog/react-hooks', title: 'React Hooks — Kent C. Dodds', excerpt: 'An in-depth look at how React hooks work under the hood.', source_type: 'article', relevance_rank: 2, fetched_at: '' },
      { id: 's3', research_session_id: 'r1', url: 'https://arxiv.org/abs/react-concurrent', title: 'Concurrent React and Suspense — Research Paper', excerpt: 'Academic analysis of React\'s concurrent rendering model.', source_type: 'paper', relevance_rank: 3, fetched_at: '' },
    ],
    completed_at: new Date(Date.now() - 172_800_000).toISOString(),
    created_at: new Date(Date.now() - 172_900_000).toISOString(),
    updated_at: new Date(Date.now() - 172_800_000).toISOString(),
  },
  {
    id: 'r2', user_id: 'u1', user_video: MOCK_USER_VIDEO,
    title: 'React vs Vue vs Angular — 2024 Comparison',
    report_content: '## Overview\n\nA comprehensive comparison of the three major frontend frameworks...',
    status: 'completed',
    sources: [
      { id: 's4', research_session_id: 'r2', url: 'https://npmtrends.com', title: 'NPM Download Trends 2024', excerpt: 'React continues to dominate with 5x the downloads of Vue.', source_type: 'website', relevance_rank: 1, fetched_at: '' },
    ],
    completed_at: new Date(Date.now() - 604_800_000).toISOString(),
    created_at: new Date(Date.now() - 604_900_000).toISOString(),
    updated_at: new Date(Date.now() - 604_800_000).toISOString(),
  },
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

function ResearchItem({ session, isActive, onSelect, onDelete }: {
  session:  ResearchSession
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2.5 rounded-md cursor-pointer transition-colors duration-fast',
        isActive
          ? 'bg-success-50 border border-success-200'
          : 'hover:bg-[var(--color-bg-secondary)] border border-transparent',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect()}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className={cn('w-7 h-7 rounded-md flex items-center justify-center shrink-0', isActive ? 'bg-success-100' : 'bg-[var(--color-bg-tertiary)]')}>
        <Globe className={cn('w-3.5 h-3.5', isActive ? 'text-success-600' : 'text-[var(--color-text-tertiary)]')} aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-body-sm font-medium truncate', isActive ? 'text-success-800' : 'text-[var(--color-text-primary)]')}>
          {session.title ?? 'Research report'}
        </p>
        <p className="text-caption text-[var(--color-text-tertiary)] flex items-center gap-1">
          <Clock className="w-3 h-3" aria-hidden="true" />
          {session.completed_at ? relativeDate(session.completed_at) : 'Processing…'}
          <span className="ml-1">{session.sources.length} sources</span>
        </p>
      </div>
      <IconButton
        aria-label="Delete report"
        icon={<Trash2 />}
        variant="ghost"
        size="sm"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-[var(--color-text-tertiary)] hover:text-danger-800"
      />
    </div>
  )
}

// ── Premium gate ──────────────────────────────────────────

function PremiumGate() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-5 text-center px-6 py-12">
      <div className="w-16 h-16 rounded-full bg-premium-50 flex items-center justify-center">
        <Crown className="w-8 h-8 text-premium-600" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-heading-xl text-[var(--color-text-primary)] mb-2">Deep research is Premium</h2>
        <p className="text-body-md text-[var(--color-text-secondary)] max-w-sm">
          Upgrade to run AI-powered research on any video topic. Get a fully cited report with sources from across the web.
        </p>
      </div>
      <ul className="text-body-sm text-[var(--color-text-secondary)] space-y-2 text-left">
        {['Unlimited research reports', 'Cites real web sources', 'Synced with video content', 'Export as PDF or Markdown'].map((f) => (
          <li key={f} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-success-50 text-success-800 flex items-center justify-center text-[10px]">✓</span>
            {f}
          </li>
        ))}
      </ul>
      <Button
        variant="primary"
        size="lg"
        leftIcon={<Crown className="w-4 h-4" />}
        onClick={() => router.push('/pricing')}
        className="bg-premium-600 border-premium-600 hover:bg-premium-800 hover:border-premium-800"
      >
        Upgrade to Premium
      </Button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function ResearchPage() {
  const params   = useParams<{ sessionId?: string }>()
  const router   = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()

  const isPremium = user?.subscription_tier === 'premium'

  // TODO: replace with React Query
  const [sessions, setSessions] = useState<ResearchSession[]>(isPremium ? MOCK_SESSIONS : [])
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const sessionId     = params.sessionId ?? null
  const activeSession = sessions.find((s) => s.id === sessionId) ?? null

  useEffect(() => {
    if (!sessionId && sessions.length > 0) {
      router.replace(`/research/${sessions[0]!.id}`)
    }
  }, [sessionId, sessions, router])

  const handleExport = () => {
    // TODO: generate PDF/MD from activeSession.report_content
    toast.info('Export coming soon!')
  }

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    setDeleteTarget(null)
    toast.success('Report deleted')
    if (sessionId === id) router.push('/research')
  }

  return (
    <div className="flex h-full -m-5 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="hidden md:flex flex-col w-64 shrink-0 border-r border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)] shrink-0">
          <h2 className="text-heading-sm text-[var(--color-text-primary)]">Research</h2>
          {isPremium && (
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => router.push('/search')}>
              New
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5">
          {!isPremium ? (
            <div className="flex flex-col items-center justify-center gap-3 py-8 px-3 text-center">
              <Crown className="w-8 h-8 text-premium-400" aria-hidden="true" />
              <p className="text-body-sm text-[var(--color-text-secondary)]">Upgrade to access deep research.</p>
              <Button variant="primary" size="sm" onClick={() => router.push('/pricing')}
                className="bg-premium-600 border-premium-600 hover:bg-premium-800 hover:border-premium-800">
                Upgrade
              </Button>
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={EmptyIcons.research}
              title="No reports yet"
              description="Process a video and run deep research."
              minHeight="200px"
            />
          ) : (
            sessions.map((session) => (
              <ResearchItem
                key={session.id}
                session={session}
                isActive={session.id === sessionId}
                onSelect={() => router.push(`/research/${session.id}`)}
                onDelete={() => setDeleteTarget(session.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main — report viewer ── */}
      <div className="flex flex-col flex-1 min-w-0 bg-[var(--color-bg-primary)]">
        {!isPremium ? (
          <PremiumGate />
        ) : activeSession ? (
          <ResearchReport
            session={activeSession}
            onExport={handleExport}
            className="h-full"
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6 text-center">
            <Globe className="w-12 h-12 text-[var(--color-text-tertiary)]" aria-hidden="true" />
            <div>
              <h2 className="text-heading-md text-[var(--color-text-primary)] mb-1">No report selected</h2>
              <p className="text-body-sm text-[var(--color-text-secondary)]">
                Select a report from the sidebar or start a new one from a video.
              </p>
            </div>
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => router.push('/search')}>
              Process a video
            </Button>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && handleDeleteSession(deleteTarget)}
        title="Delete report?"
        description="This will permanently delete this research report and all its sources."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}