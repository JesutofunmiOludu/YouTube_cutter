'use client'

// src/app/(app)/search/page.tsx
import { useState, useCallback, useTransition, useEffect } from 'react'
import { useRouter }                            from 'next/router'
import {
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  History,
  ChevronRight,
  BookOpen,
  Layers,
} from 'lucide-react'
import { cn }              from '@/utils/cn'
import { Button }          from '@/components/ui/Button'
import { Badge }           from '@/components/ui/Badge'
import { Spinner }         from '@/components/ui/Spinner'
import { EmptyState, EmptyIcons } from '@/components/ui/EmptyState'
import { VideoGridSkeleton } from '@/components/ui/SkeletonCard'
import { AppShell }        from '@/components/layout/AppShell'
import { apiClient }       from '@/utils/apiClient'
import { useToast }        from '@/components/ui/Toast'
import { useSubscription } from '@/hooks/useSubscription'
import Link                from 'next/link'
import { UnifiedIngestionBar, CategoryFilter, TranscriptionEngine } from '@/components/workspace/UnifiedIngestionBar'
import type { Video }      from '@/types'

// ── Types ─────────────────────────────────────────────────

type DurationFilter = 'any' | 'short' | 'medium' | 'long'
type SortFilter     = 'relevance' | 'date' | 'views'

interface SearchFilters {
  duration: DurationFilter
  sort:     SortFilter
  category: string
}

// ── Mock results (replace with React Query) ───────────────

const MOCK_VIDEOS: Video[] = [
  { id: 'v1', youtube_id: 'dQw4w9WgXcQ', title: 'Full React JS Course for Beginners — Hooks, Context, Router', description: 'Complete React tutorial covering all modern patterns.', thumbnail_url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg', duration_seconds: 13330, channel_id: 'c1', channel_name: 'Fireship',       category: 'Tutorial',    published_at: '2024-01-15', created_at: '' },
  { id: 'v2', youtube_id: 'F2JCjVSZlG0', title: 'React in 100 Seconds',                                        description: 'Quick overview of React.',                        thumbnail_url: 'https://img.youtube.com/vi/F2JCjVSZlG0/mqdefault.jpg', duration_seconds: 110,   channel_id: 'c1', channel_name: 'Fireship',       category: 'Short',       published_at: '2024-02-01', created_at: '' },
  { id: 'v3', youtube_id: 'SqcY0GlETPk', title: 'React Tutorial for Beginners',                                description: 'Learn React from scratch.',                       thumbnail_url: 'https://img.youtube.com/vi/SqcY0GlETPk/mqdefault.jpg', duration_seconds: 4512,  channel_id: 'c2', channel_name: 'Programming with Mosh', category: 'Tutorial', published_at: '2024-01-20', created_at: '' },
  { id: 'v4', youtube_id: 'b9eMGE7QtTk', title: 'React State Management — Redux Toolkit Full Course',          description: 'Master Redux Toolkit.',                           thumbnail_url: 'https://img.youtube.com/vi/b9eMGE7QtTk/mqdefault.jpg', duration_seconds: 8244,  channel_id: 'c3', channel_name: 'Academind',      category: 'Tutorial',    published_at: '2024-03-10', created_at: '' },
  { id: 'v5', youtube_id: 'TNhaISOUy6Q', title: 'React Query Tutorial — Data Fetching Made Easy',             description: 'Learn React Query.',                              thumbnail_url: 'https://img.youtube.com/vi/TNhaISOUy6Q/mqdefault.jpg', duration_seconds: 3621,  channel_id: 'c4', channel_name: 'TkDodo',         category: 'Tutorial',    published_at: '2024-02-28', created_at: '' },
  { id: 'v6', youtube_id: 'nTeuhbP7wdE', title: 'Next.js 14 Full Course 2024',                                description: 'Complete Next.js 14 guide.',                      thumbnail_url: 'https://img.youtube.com/vi/nTeuhbP7wdE/mqdefault.jpg', duration_seconds: 17820, channel_id: 'c1', channel_name: 'Fireship',       category: 'Tutorial',    published_at: '2024-04-01', created_at: '' },
]

const CATEGORIES = ['All', 'Tutorial', 'Course', 'Short', 'Talk', 'Interview']

export const CURATED_WORKSPACES = [
  {
    id: 'curated-1',
    youtubeId: 'nTeuhbP7wdE',
    title: 'Next.js 15 Full Architecture & Server Actions Deep Dive',
    channel: 'Fireship',
    duration: '24 min',
    views: '128K views',
    nodes: 38,
    format: 'mindmap',
    formatLabel: 'Radial Mindmap',
    formatIcon: '🧠',
    description: 'Deconstruct App Router, streaming SSR, Server Components boundary, and caching architecture.',
    tags: ['React 19', 'Next.js 15', 'Full-Stack'],
  },
  {
    id: 'curated-2',
    youtubeId: 'VMj-3S1tku0',
    title: 'Building Neural Networks from Scratch with Python & Math',
    channel: 'Andrej Karpathy',
    duration: '2h 15m',
    views: '850K views',
    nodes: 64,
    format: 'cheatsheet',
    formatLabel: 'Cheatsheet & Equations',
    formatIcon: '📑',
    description: 'Backpropagation calculus, micrograd scalar engine, gradient descent, and cross-entropy loss functions.',
    tags: ['Deep Learning', 'PyTorch', 'Mathematics'],
  },
  {
    id: 'curated-3',
    youtubeId: 'iuqZvajTOyA',
    title: 'System Design Interview: Distributed Cache & CDN Architecture',
    channel: 'ByteByteGo',
    duration: '35 min',
    views: '450K views',
    nodes: 52,
    format: 'blueprint',
    formatLabel: 'System Blueprint',
    formatIcon: '📐',
    description: 'Cache eviction policies (LRU/LFU), write-through vs write-back, Redis clustering, and latency budgets.',
    tags: ['System Design', 'Redis', 'High Availability'],
  },
]

// ── Helpers ───────────────────────────────────────────────

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function formatPublished(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatViews(views: number | null | undefined): string {
  if (!views) return ''
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`
  return `${views} views`
}

// ── Video result card ─────────────────────────────────────

function VideoResultCard({ video, onProcess }: { video: Video; onProcess: (v: Video) => void }) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden hover:border-[var(--color-border-secondary)] transition-colors duration-fast group flex flex-col justify-between">
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-[var(--color-bg-tertiary)] flex items-center justify-center overflow-hidden">
        {video.thumbnail_url && !imgErr ? (
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-slow"
            onError={() => setImgErr(true)}
            loading="lazy"
          />
        ) : (
          <Play className="w-8 h-8 text-[var(--color-text-tertiary)]" aria-hidden="true" />
        )}
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded tabular-nums">
          {formatDuration(video.duration_seconds)}
        </span>
        {/* YouTube link */}
        <a
          href={`https://youtube.com/watch?v=${video.youtube_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30"
          aria-label={`Watch ${video.title} on YouTube`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-neutral-900 ml-0.5" aria-hidden="true" />
          </div>
        </a>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1 justify-between">
        <div>
          <p className="text-caption text-[var(--color-text-tertiary)] mb-1 truncate">{video.channel_name}</p>
          <h3 className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
            {video.title}
          </h3>
        </div>

        <div className="flex items-center justify-between text-caption text-[var(--color-text-tertiary)]">
          {video.published_at ? (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              {formatPublished(video.published_at)}
            </span>
          ) : <span />}
          {video.view_count ? (
            <span className="font-medium text-[var(--color-text-secondary)]">
              {formatViews(video.view_count)}
            </span>
          ) : null}
        </div>

        <Button
          variant="primary"
          size="sm"
          fullWidth
          onClick={() => onProcess(video)}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          Process this video
        </Button>
      </div>
    </div>
  )
}

// ── Filter chip ───────────────────────────────────────────

function FilterChip({ label, active, onClick }: {
  label: string; active: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-shrink-0 px-3 py-1.5 rounded-full text-caption font-medium',
        'border transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        active
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] hover:text-[var(--color-text-primary)]',
      )}
    >
      {label}
    </button>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function SearchPage() {
  const router   = useRouter()
  const initialQ = (router.query.q as string) ?? ''

  const [query,   setQuery]   = useState(initialQ)
  const [input,   setInput]   = useState(initialQ)
  const [filters, setFilters] = useState<SearchFilters>({
    duration: 'any', sort: 'relevance', category: 'All',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [isPending, startTransition]  = useTransition()

  const { toast } = useToast()
  const { isPremium } = useSubscription()
  // Track how many searches the free user has done this session.
  // The backend enforces the hard 5/day limit; this is purely for the UX banner.
  const [searchesUsed, setSearchesUsed] = useState(0)
  const FREE_SEARCH_LIMIT = 10
  const [results, setResults] = useState<Video[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [errorState, setErrorState] = useState<'network' | 'limit' | 'auth' | 'not_found' | 'generic' | null>(null)
  const [limit, setLimit] = useState<25 | 10 | 50>(25)
  const hasResults = results.length > 0
  const [recentProjects, setRecentProjects] = useState<any[]>([])

  // Load user's recent video projects for the resume bar
  useEffect(() => {
    let active = true
    apiClient.get('/videos/')
      .then((res) => {
        if (!active) return
        const list = res.data.results || res.data || []
        setRecentProjects(list.slice(0, 4))
      })
      .catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    // If the URL has a search query, update the search input and query state
    if (router.query.q && router.query.q !== query) {
      const q = router.query.q as string
      setQuery(q)
      setInput(q)
    }
  }, [router.query.q])

  useEffect(() => {
    if (!query) {
      setResults([])
      setSearchError(null)
      setErrorState(null)
      return
    }

    const sortMap: Record<SortFilter, string> = {
      relevance: 'relevance',
      date: 'date',
      views: 'viewCount',
    }

    const performFetch = async () => {
      setIsLoading(true)
      setSearchError(null)
      setErrorState(null)
      try {
        const res = await apiClient.get('/videos/search/', {
          params: {
            q: query,
            order: sortMap[filters.sort] || 'relevance',
            duration: filters.duration,
            limit,
          }
        })
        const mapped = (res.data.results || []).map((v: any, index: number) => ({
          id: `v-${v.youtube_id}-${index}`,
          youtube_id: v.youtube_id,
          title: v.title,
          description: null,
          thumbnail_url: v.thumbnail_url,
          duration_seconds: v.duration_seconds || 0,
          channel_id: '',
          channel_name: v.channel_name,
          category: 'Tutorial',
          published_at: v.published_at,
          view_count: v.view_count,
          created_at: '',
        }))

        // Category filter (client-side matching)
        const filtered = mapped.filter((v: Video) => {
          if (filters.category !== 'All') {
            const cat = filters.category.toLowerCase()
            const title = v.title.toLowerCase()
            return title.includes(cat) || v.category?.toLowerCase() === cat
          }
          return true
        })

        setResults(filtered)
        if (!isPremium) setSearchesUsed((n) => Math.min(n + 1, FREE_SEARCH_LIMIT))
      } catch (err: any) {
        const status = err?.response?.status
        const errorPayload = err?.response?.data?.error
        let msg = 'Search failed. Please try again.'
        let type: 'network' | 'limit' | 'auth' | 'not_found' | 'generic' = 'generic'

        if (status === 401) {
          msg = 'Please sign in to search and process YouTube videos.'
          type = 'auth'
        } else if (status === 404) {
          msg = err?.response?.data?.detail || errorPayload?.message || 'Search endpoint not found. Please verify your backend server.'
          type = 'not_found'
        } else if (err.message?.toLowerCase().includes('network') || err.code === 'ERR_NETWORK') {
          msg = 'Internet error: Please check your internet connection and try again.'
          type = 'network'
        } else if (errorPayload?.code === 'plan_limit_reached' || status === 403) {
          msg = errorPayload?.message ?? 'Free-tier limit reached: 10 searches per day. Upgrade to Premium for unlimited access.'
          type = 'limit'
        } else if (errorPayload?.code === 'upstream_error') {
          msg = 'Connection error: The YouTube API service is currently unreachable. Please try again.'
        } else if (errorPayload?.message) {
          msg = errorPayload.message
        } else if (err?.response?.data?.detail) {
          msg = err.response.data.detail
        }
        setSearchError(msg)
        setErrorState(type)
        if (type !== 'auth') {
          toast.error(msg)
        }
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }

    performFetch()
  }, [query, filters.sort, filters.duration, filters.category, limit])

  const fromParam = (router.query.from as string) || ''

  const handleUnifiedSearch = (q: string, cat: CategoryFilter, dur: string, ord: string) => {
    setQuery(q)
    setFilters({
      category: cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1),
      duration: dur as DurationFilter,
      sort: (ord === 'viewCount' || ord === 'views') ? 'views' : ord === 'date' ? 'date' : 'relevance',
    })
    const fromSuffix = fromParam ? `&from=${encodeURIComponent(fromParam)}` : ''
    router.push(`/search?q=${encodeURIComponent(q)}${fromSuffix}`)
  }

  const handleProcess = (video: Video) => {
    const fromSuffix = fromParam ? `&from=${encodeURIComponent(fromParam)}` : ''
    router.push(`/workspace/new?url=https://youtube.com/watch?v=${video.youtube_id}&title=${encodeURIComponent(video.title)}${fromSuffix}`)
  }

  return (
    <div className={cn(
      'flex flex-col max-w-content mx-auto w-full',
      !query ? 'min-h-[calc(100vh-var(--topbar-height))] justify-center items-center' : 'gap-6'
    )}>

      {/* ── Unified Command Bar — centered when idle, top when searching ── */}
      <div className={cn('w-full', !query && 'max-w-5xl px-4')}>

        <UnifiedIngestionBar
          initialQuery={query}
          onSearch={handleUnifiedSearch}
          onProcess={(ytId, engine, format) => {
            const fromSuffix = fromParam ? `&from=${encodeURIComponent(fromParam)}` : ''
            const formatSuffix = format && format !== 'standard' ? `&format=${format}` : ''
            router.push(`/workspace/new?url=https://youtube.com/watch?v=${ytId}&engine=${engine}${formatSuffix}${fromSuffix}`)
          }}
        />
      </div>

      {/* ── Free-tier search usage banner ── */}
      {!isPremium && searchesUsed > 0 && (
        <div className={cn(
          'flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl text-body-sm',
          searchesUsed >= FREE_SEARCH_LIMIT
            ? 'bg-amber-50 border border-amber-200 text-amber-800'
            : 'bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)]',
        )}>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: FREE_SEARCH_LIMIT }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i < searchesUsed
                      ? searchesUsed >= FREE_SEARCH_LIMIT ? 'bg-amber-500' : 'bg-primary-500'
                      : 'bg-[var(--color-border-secondary)]',
                  )}
                />
              ))}
            </div>
            <span className="text-caption">
              {searchesUsed >= FREE_SEARCH_LIMIT
                ? 'Daily search limit reached (5 of 5)'
                : `${searchesUsed} of ${FREE_SEARCH_LIMIT} free searches used today`}
            </span>
          </div>
          <Link
            href="/pricing"
            className={cn(
              'text-caption font-semibold whitespace-nowrap transition-colors',
              searchesUsed >= FREE_SEARCH_LIMIT
                ? 'text-amber-700 hover:text-amber-900'
                : 'text-primary-600 hover:text-primary-700',
            )}
          >
            Upgrade for unlimited →
          </Link>
        </div>
      )}

      {/* ── Results header ── */}
      {query && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-heading-md text-[var(--color-text-primary)]">
              Results for <span className="text-primary-600">"{query}"</span>
            </h1>
            {hasResults && (
              <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5">
                {results.length} video{results.length !== 1 ? 's' : ''} found
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Per-page selector */}
            {hasResults && (
              <div className="flex items-center gap-2">
                <span className="text-caption text-[var(--color-text-tertiary)] whitespace-nowrap">Show</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value) as 10 | 25 | 50)}
                  className="text-caption bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg px-2 py-1 text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-400 cursor-pointer"
                  aria-label="Results per page"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-caption text-[var(--color-text-tertiary)] whitespace-nowrap">results</span>
              </div>
            )}
            {hasResults && <Badge variant="primary" size="sm">YouTube Search</Badge>}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && <VideoGridSkeleton count={6} />}

      {/* ── Results grid ── */}
      {!isLoading && !searchError && hasResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((video) => (
            <VideoResultCard key={video.id} video={video} onProcess={handleProcess} />
          ))}
        </div>
      )}

      {/* ── Error state ── */}
      {!isLoading && searchError && (
        <>
          {errorState === 'auth' ? (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
              title="Sign in Required"
              description={searchError}
              action={{
                label: 'Sign in to continue',
                onClick: () => router.push(`/auth/login?from=${encodeURIComponent(router.asPath)}`)
              }}
              secondaryAction={{
                label: 'Create an account',
                onClick: () => router.push('/auth/register')
              }}
              minHeight="300px"
            />
          ) : errorState === 'limit' ? (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-warning-500">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              }
              title="Search Limit Reached"
              description={searchError}
              action={{
                label: 'Upgrade to Premium',
                onClick: () => router.push('/pricing')
              }}
              secondaryAction={{
                label: 'Back to Dashboard',
                onClick: () => router.push('/dashboard')
              }}
              minHeight="300px"
            />
          ) : errorState === 'not_found' ? (
            <EmptyState
              icon={EmptyIcons.search}
              title="Resource Not Found"
              description={searchError}
              action={{
                label: 'Try searching again',
                onClick: () => {
                  const q = query
                  setQuery('')
                  setTimeout(() => setQuery(q), 50)
                }
              }}
              secondaryAction={{
                label: 'Go to Dashboard',
                onClick: () => router.push('/dashboard')
              }}
              minHeight="300px"
            />
          ) : errorState === 'network' ? (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger-500">
                  <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.5M5 12.5a10.94 10.94 0 015.83-2.84M8.53 16.03a6.11 6.11 0 017.2-.23M12 20h.01" />
                </svg>
              }
              title="Internet Connection Error"
              description={searchError}
              action={{
                label: 'Try again',
                onClick: () => {
                  const q = query
                  setQuery('')
                  setTimeout(() => setQuery(q), 50)
                }
              }}
              minHeight="300px"
            />
          ) : (
            <EmptyState
              icon={
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-danger-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              title="Search Failed"
              description={searchError}
              action={{
                label: 'Try again',
                onClick: () => {
                  const q = query
                  setQuery('')
                  setTimeout(() => setQuery(q), 50)
                }
              }}
              minHeight="300px"
            />
          )}
        </>
      )}

      {/* ── Empty state ── */}
      {!isLoading && !searchError && query && !hasResults && (
        <EmptyState
          icon={EmptyIcons.search}
          title={`No results for "${query}"`}
          description="Try different keywords or paste a YouTube link directly."
          action={{ label: 'Clear search', onClick: () => { setInput(''); setQuery('') } }}
          minHeight="300px"
        />
      )}

      {/* ── Curated Educational Workspaces & Discovery Hub (When no search query) ── */}
      {!query && !isLoading && !searchError && (
        <div className="flex flex-col gap-10 mt-2 animate-fade-in pb-12">
          {/* Curated Grid */}
          <div>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 border border-purple-500/20">
                    <Sparkles className="w-3 h-3" /> Featured Workspaces
                  </span>
                  <span className="text-caption text-[var(--color-text-tertiary)]">
                    Instant 1-Click Exploration
                  </span>
                </div>
                <h2 className="text-heading-md font-bold text-[var(--color-text-primary)]">
                  Curated Multi-Format Knowledge Graphs
                </h2>
                <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
                  Pre-analyzed educational videos ready with radial mindmaps, cheatsheets, and architecture blueprints.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {CURATED_WORKSPACES.map((cw) => (
                <div
                  key={cw.id}
                  className="group bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] hover:border-purple-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative w-full aspect-video bg-black/80 overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${cw.youtubeId}/mqdefault.jpg`}
                      alt={cw.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-slow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Duration badge */}
                    <span className="absolute bottom-2.5 right-2.5 bg-black/80 text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-md backdrop-blur-sm">
                      {cw.duration}
                    </span>

                    {/* Format Pill */}
                    <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/90 dark:bg-black/80 text-neutral-900 dark:text-white backdrop-blur-md shadow-md">
                      <span>{cw.formatIcon}</span>
                      <span>{cw.formatLabel}</span>
                    </span>

                    {/* Nodes Badge */}
                    <span className="absolute bottom-2.5 left-2.5 text-[11px] font-semibold text-white/90 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      {cw.nodes} Graph Nodes
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between text-caption text-[var(--color-text-tertiary)] mb-1">
                        <span className="font-medium text-primary-600 dark:text-primary-400">{cw.channel}</span>
                        <span>{cw.views}</span>
                      </div>
                      <h3 className="text-body-md font-bold text-[var(--color-text-primary)] line-clamp-2 leading-snug group-hover:text-purple-600 transition-colors">
                        {cw.title}
                      </h3>
                      <p className="text-caption text-[var(--color-text-secondary)] mt-1.5 line-clamp-2 leading-relaxed">
                        {cw.description}
                      </p>
                    </div>

                    {/* Tags & Action */}
                    <div className="pt-3 border-t border-[var(--color-border-tertiary)] flex flex-col gap-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {cw.tags.map((t) => (
                          <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)]">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => router.push(`/workspace/new?url=https://youtube.com/watch?v=${cw.youtubeId}&format=${cw.format}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-body-sm font-semibold bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white border border-purple-200/80 dark:border-purple-800 transition-all shadow-2xs group-hover:bg-purple-600 group-hover:text-white"
                      >
                        <span>Explore {cw.formatLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Ingestions Bar (7.5) */}
          {recentProjects.length > 0 && (
            <div className="p-5 rounded-2xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-body-md font-bold text-[var(--color-text-primary)]">
                      Recent Workspace Ingestions
                    </h3>
                    <p className="text-caption text-[var(--color-text-tertiary)]">
                      Pick up right where you left off
                    </p>
                  </div>
                </div>
                <Link
                  href="/projects"
                  className="text-caption font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
                >
                  <span>View All Projects</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recentProjects.map((proj) => {
                  const targetFormat = proj.preferred_format && proj.preferred_format !== 'standard' ? proj.preferred_format : null
                  const targetUrl = targetFormat ? `/workspace/${proj.id}/canvas?format=${targetFormat}` : `/workspace/${proj.id}`

                  return (
                    <button
                      key={proj.id}
                      onClick={() => router.push(targetUrl)}
                      className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border-tertiary)] hover:border-primary-400 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-left transition-all group"
                    >
                      <div className="relative w-14 aspect-video rounded-md overflow-hidden bg-black shrink-0">
                        <img
                          src={proj.video?.thumbnail_url || `https://img.youtube.com/vi/${proj.video?.youtube_id}/mqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-3 h-3 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-xs font-semibold text-[var(--color-text-primary)] truncate">
                          {proj.video?.title || 'Untitled Video'}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)] truncate">
                          {proj.video?.channel_name || 'YouTube Video'}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] group-hover:text-primary-600 shrink-0 transition-colors" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  )
}

SearchPage.getLayout = function getLayout(page: React.ReactElement) {
  return <AppShell>{page}</AppShell>
}