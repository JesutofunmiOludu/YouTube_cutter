'use client'

// src/app/(app)/search/page.tsx
import { useState, useCallback, useTransition } from 'react'
import { useRouter }                            from 'next/router'
import {
  Search, SlidersHorizontal, Clock,
  Play, X, ArrowRight,
} from 'lucide-react'
import { cn }              from '@/utils/cn'
import { Button }          from '@/components/ui/Button'
import { Badge }           from '@/components/ui/Badge'
import { Spinner }         from '@/components/ui/Spinner'
import { EmptyState, EmptyIcons } from '@/components/ui/EmptyState'
import { VideoGridSkeleton } from '@/components/ui/SkeletonCard'
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

// ── Video result card ─────────────────────────────────────

function VideoResultCard({ video, onProcess }: { video: Video; onProcess: (v: Video) => void }) {
  const [imgErr, setImgErr] = useState(false)

  return (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden hover:border-[var(--color-border-secondary)] transition-colors duration-fast group">
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
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-caption text-[var(--color-text-tertiary)] mb-1 truncate">{video.channel_name}</p>
          <h3 className="text-body-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
            {video.title}
          </h3>
        </div>

        {video.published_at && (
          <p className="text-caption text-[var(--color-text-tertiary)] flex items-center gap-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            {formatPublished(video.published_at)}
          </p>
        )}

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

  // TODO: replace with useQuery
  const isLoading = false
  const results   = query ? MOCK_VIDEOS : []
  const hasResults = results.length > 0

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return
    startTransition(() => {
      setQuery(trimmed)
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    })
  }, [input, router])

  const handleProcess = (video: Video) => {
    router.push(`/workspace/new?url=https://youtube.com/watch?v=${video.youtube_id}&title=${encodeURIComponent(video.title)}`)
  }

  const durationOptions: { label: string; value: DurationFilter }[] = [
    { label: 'Any length', value: 'any'    },
    { label: '< 4 min',    value: 'short'  },
    { label: '4–20 min',   value: 'medium' },
    { label: '> 20 min',   value: 'long'   },
  ]

  const sortOptions: { label: string; value: SortFilter }[] = [
    { label: 'Most relevant', value: 'relevance' },
    { label: 'Latest',        value: 'date'       },
    { label: 'Most viewed',   value: 'views'      },
  ]

  return (
    <div className="flex flex-col gap-5 max-w-content mx-auto">

      {/* ── Search bar ── */}
      <form onSubmit={handleSearch} role="search" className="flex gap-2">
        <div className={cn(
          'flex items-center gap-2 flex-1 h-11 px-4',
          'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-xl',
          'focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200',
          'transition-colors duration-fast',
        )}>
          <Search className="w-4 h-4 shrink-0 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search a topic or paste a YouTube link…"
            className="flex-1 bg-transparent border-none outline-none text-body-md text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]"
            aria-label="Search videos"
            autoFocus={!initialQ}
          />
          {input && (
            <button type="button" onClick={() => { setInput(''); setQuery('') }}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
              aria-label="Clear search">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Button type="submit" variant="primary" size="md" loading={isPending}>
          Search
        </Button>
        <Button
          type="button"
          variant={showFilters ? 'primary' : 'secondary'}
          size="md"
          leftIcon={<SlidersHorizontal className="w-4 h-4" />}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-label="Toggle filters"
        >
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </form>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-4 flex flex-col gap-4 animate-slide-up">
          <div className="flex flex-col gap-2">
            <p className="text-label text-[var(--color-text-tertiary)] uppercase tracking-wider">Duration</p>
            <div className="flex flex-wrap gap-2">
              {durationOptions.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={filters.duration === opt.value}
                  onClick={() => setFilters((f) => ({ ...f, duration: opt.value }))}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-label text-[var(--color-text-tertiary)] uppercase tracking-wider">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((opt) => (
                <FilterChip
                  key={opt.value}
                  label={opt.label}
                  active={filters.sort === opt.value}
                  onClick={() => setFilters((f) => ({ ...f, sort: opt.value }))}
                />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-label text-[var(--color-text-tertiary)] uppercase tracking-wider">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat}
                  label={cat}
                  active={filters.category === cat}
                  onClick={() => setFilters((f) => ({ ...f, category: cat }))}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Category chips row ── */}
      {!showFilters && (
        <div className="flex gap-2 overflow-x-auto pb-1 scroll-x no-scrollbar">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              active={filters.category === cat}
              onClick={() => setFilters((f) => ({ ...f, category: cat }))}
            />
          ))}
        </div>
      )}

      {/* ── Results header ── */}
      {query && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-heading-md text-[var(--color-text-primary)]">
              Results for <span className="text-primary-600">"{query}"</span>
            </h1>
            {hasResults && (
              <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5">
                {results.length} videos found
              </p>
            )}
          </div>
          {hasResults && (
            <Badge variant="primary" size="sm">YouTube Search</Badge>
          )}
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && <VideoGridSkeleton count={6} />}

      {/* ── Results grid ── */}
      {!isLoading && hasResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((video) => (
            <VideoResultCard key={video.id} video={video} onProcess={handleProcess} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && query && !hasResults && (
        <EmptyState
          icon={EmptyIcons.search}
          title={`No results for "${query}"`}
          description="Try different keywords or paste a YouTube link directly."
          action={{ label: 'Clear search', onClick: () => { setInput(''); setQuery('') } }}
          minHeight="300px"
        />
      )}

      {/* ── Initial empty (no query yet) ── */}
      {!query && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center gap-4">
          <Search className="w-12 h-12 text-[var(--color-text-tertiary)]" aria-hidden="true" />
          <div>
            <h2 className="text-heading-md text-[var(--color-text-primary)] mb-1">Search for a topic</h2>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Or paste a YouTube link to process it directly.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {['React hooks', 'Django REST', 'TypeScript generics', 'System design', 'PostgreSQL'].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); setQuery(s); router.push(`/search?q=${encodeURIComponent(s)}`) }}
                className="px-3 py-1.5 rounded-full text-caption font-medium bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:border-primary-200 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}