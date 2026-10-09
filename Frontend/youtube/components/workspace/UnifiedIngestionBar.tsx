// ============================================================
// VidMind AI — Unified Ingestion & Command Bar
// components/workspace/UnifiedIngestionBar.tsx
//
// Matches user's hand-drawn UI sketch:
//  - Universal URL / Search Input
//  - Engine Selector: Standard (0 Credits) vs Extended (1 Credit)
//  - Action Buttons: [ Process ] + [ Filters ]
//  - Category Filter Pill Bar (All | Tutorial | Course | Short | Talk | Interview)
//  - Live Credits Counter
// ============================================================

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/router'
import {
  Search,
  Link as LinkIcon,
  Sparkles,
  Zap,
  SlidersHorizontal,
  Coins,
  ChevronDown,
  ArrowRight,
  Loader2,
  Check,
  X,
  Play,
  Clock,
  User as UserIcon,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@/utils/apiClient'
import { useToast } from '@/components/ui/Toast'

// ── Helpers ──────────────────────────────────────────────────

export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed

  try {
    const u = new URL(trimmed)
    const host = u.hostname.replace(/^(www\.|m\.)/, '')

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id.length === 11 ? id : null
    }

    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const v = u.searchParams.get('v')
      if (v && v.length === 11) return v

      const pathParts = u.pathname.split('/').filter(Boolean)
      if (['shorts', 'embed', 'live', 'v', 'e'].includes(pathParts[0]) && pathParts[1]) {
        const id = pathParts[1].split('?')[0]
        return id.length === 11 ? id : null
      }
    }
    return null
  } catch {
    return null
  }
}

import type { KnowledgeFormatType } from '@/types'

export const FORMAT_OPTIONS: { id: KnowledgeFormatType; label: string; icon: string; badge: string; desc: string }[] = [
  { id: 'standard',    label: 'Standard',    icon: '💻', badge: 'Workspace', desc: 'Direct 3-column video cutter & editor' },
  { id: 'mindmap',     label: 'Mindmap',     icon: '🧠', badge: 'Radial',    desc: 'Radial branch breakdown of key concepts' },
  { id: 'cheatsheet',  label: 'Cheatsheet',  icon: '📑', badge: 'Fast',      desc: 'Quick-reference rules, quotes & formulas' },
  { id: 'concept_map', label: 'Concept Map', icon: '🕸️', badge: 'Graph',     desc: 'Connected ideas, causes & relationships' },
  { id: 'blueprint',   label: 'Blueprint',   icon: '📐', badge: 'Phased',    desc: 'Technical architecture & execution phases' },
  { id: 'timeline',    label: 'Timeline',    icon: '⏳', badge: 'Journey',   desc: 'Chronological milestones around video hub' },
]

export type TranscriptionEngine = 'standard' | 'extended'

export type CategoryFilter = 'all' | 'tutorial' | 'course' | 'short' | 'talk' | 'interview'

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'tutorial',   label: 'Tutorial' },
  { id: 'course',     label: 'Course' },
  { id: 'short',      label: 'Short' },
  { id: 'talk',       label: 'Talk' },
  { id: 'interview',  label: 'Interview' },
]

interface UnifiedIngestionBarProps {
  initialQuery?: string
  initialFormat?: KnowledgeFormatType
  onSearch?: (query: string, category: CategoryFilter, duration: string, order: string) => void
  onProcess?: (youtubeId: string, engine: TranscriptionEngine, format?: KnowledgeFormatType) => void
  className?: string
}

export function UnifiedIngestionBar({
  initialQuery = '',
  initialFormat = 'standard',
  onSearch,
  onProcess,
  className,
}: UnifiedIngestionBarProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { toast } = useToast()

  const [inputVal, setInputVal] = useState(initialQuery)
  const [engine, setEngine] = useState<TranscriptionEngine>('standard')
  const [engineOpen, setEngineOpen] = useState(false)
  const [format, setFormat] = useState<KnowledgeFormatType>(initialFormat)
  const [formatOpen, setFormatOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [duration, setDuration] = useState('any')
  const [order, setOrder] = useState('relevance')

  // YouTube URL Preview state
  const [detectedYtId, setDetectedYtId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const engineRef = useRef<HTMLDivElement>(null)
  const formatRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)

  // Detect YouTube ID from inputVal
  useEffect(() => {
    const ytId = extractYouTubeId(inputVal)
    setDetectedYtId(ytId)
  }, [inputVal])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (engineRef.current && !engineRef.current.contains(e.target as Node)) {
        setEngineOpen(false)
      }
      if (formatRef.current && !formatRef.current.contains(e.target as Node)) {
        setFormatOpen(false)
      }
      if (filtersRef.current && !filtersRef.current.contains(e.target as Node)) {
        setFiltersOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const credits = user?.credits_balance ?? 10
  const currentFormatOpt = FORMAT_OPTIONS.find((f) => f.id === format) || FORMAT_OPTIONS[0]

  const handleAction = () => {
    if (!inputVal.trim()) return

    if (detectedYtId) {
      // Direct YouTube Processing
      if (engine === 'extended' && credits < 1) {
        toast.error('Insufficient credits! You need 1 credit for Extended AI Studio mode.')
        return
      }

      if (onProcess) {
        onProcess(detectedYtId, engine, format)
      } else {
        const formatQuery = format !== 'standard' ? `&format=${format}` : ''
        router.push(
          `/workspace/new?url=https://youtube.com/watch?v=${detectedYtId}&engine=${engine}${formatQuery}`
        )
      }
    } else {
      // Search Flow
      if (onSearch) {
        onSearch(inputVal, category, duration, order)
      } else {
        const catQuery = category !== 'all' ? `&category=${category}` : ''
        const durQuery = duration !== 'any' ? `&duration=${duration}` : ''
        const ordQuery = order !== 'relevance' ? `&order=${order}` : ''
        router.push(`/search?q=${encodeURIComponent(inputVal)}${catQuery}${durQuery}${ordQuery}`)
      }
    }
  }

  const handleCategoryClick = (cat: CategoryFilter) => {
    setCategory(cat)
    if (inputVal.trim() && !detectedYtId && onSearch) {
      const q = cat === 'all' ? inputVal.trim() : `${inputVal.trim()} ${cat}`
      onSearch(q, cat, duration, order)
    }
  }

  return (
    <div className={cn('w-full max-w-5xl mx-auto flex flex-col gap-3 relative z-30', className)}>
      
      {/* ── Main Universal Command Box ── */}
      <div className="relative z-20 rounded-2xl bg-[var(--color-bg-primary)]/90 backdrop-blur-xl border border-[var(--color-border-secondary)] shadow-xl p-5 sm:p-7 transition-all duration-300 focus-within:border-primary-500/80 focus-within:ring-4 focus-within:ring-primary-500/10">
        
        {/* Upper: URL / Search Input */}
        <div className="relative flex items-center gap-3">
          <div className="shrink-0 text-[var(--color-text-tertiary)] pl-1">
            {detectedYtId ? (
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center animate-pulse">
                <LinkIcon className="w-4 h-4" />
              </div>
            ) : (
              <Search className="w-5 h-5 text-primary-500" />
            )}
          </div>

          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAction()}
            placeholder="Paste YouTube video link or search topics, tutorials, podcasts..."
            className="w-full bg-transparent text-body-md sm:text-heading-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none border-none pr-8 font-normal"
          />

          {inputVal && (
            <button
              onClick={() => setInputVal('')}
              className="p-1 rounded-full text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              aria-label="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Detected YouTube Video Preview Badge */}
        {detectedYtId && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border-tertiary)] flex items-center justify-between text-caption text-[var(--color-text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 font-medium">
                <Play className="w-3 h-3 fill-current" /> YouTube Video Detected
              </span>
              <span className="font-mono text-xs opacity-75">ID: {detectedYtId}</span>
            </div>
            <span className="text-xs text-primary-600 font-medium hidden sm:inline">
              Ready to import into workspace
            </span>
          </div>
        )}

        {/* Lower Row: Engine Selector + Format Selector + Action Buttons (Process & Filters) */}
        <div className="mt-5 pt-4 border-t border-[var(--color-border-tertiary)] flex flex-wrap items-center justify-between gap-3 relative z-20">
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Left: Engine Selector Dropdown */}
            <div className="relative z-30" ref={engineRef}>
              <button
                type="button"
                onClick={() => setEngineOpen(!engineOpen)}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-xl border text-body-sm font-medium transition-all',
                  engine === 'extended'
                    ? 'bg-primary-50/80 dark:bg-primary-950/40 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300 shadow-sm'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]'
                )}
              >
                {engine === 'extended' ? (
                  <Sparkles className="w-4 h-4 text-primary-500 animate-pulse" />
                ) : (
                  <Zap className="w-4 h-4 text-amber-500" />
                )}
                <span>
                  {engine === 'extended' ? 'Extended AI Studio' : 'Standard Engine'}
                </span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-semibold',
                  engine === 'extended'
                    ? 'bg-primary-600 text-white'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                )}>
                  {engine === 'extended' ? '1 Credit' : '0 Credits'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </button>

              {/* Engine Options Menu */}
              {engineOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => { setEngine('standard'); setEngineOpen(false) }}
                    className={cn(
                      'w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors',
                      engine === 'standard' ? 'bg-[var(--color-bg-secondary)]' : 'hover:bg-[var(--color-bg-secondary)]/50'
                    )}
                  >
                    <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">Standard Engine</p>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">0 Credits</span>
                      </div>
                      <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5">
                        Fast YouTube native captions. Free & instant setup.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setEngine('extended'); setEngineOpen(false) }}
                    className={cn(
                      'w-full flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors mt-1',
                      engine === 'extended' ? 'bg-[var(--color-bg-secondary)]' : 'hover:bg-[var(--color-bg-secondary)]/50'
                    )}
                  >
                    <div className="p-1.5 rounded-md bg-primary-500/10 text-primary-600 shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-semibold text-[var(--color-text-primary)]">Extended AI Studio</p>
                        <span className="text-[10px] font-bold text-primary-600 bg-primary-500/10 px-1.5 py-0.5 rounded">1 Credit</span>
                      </div>
                      <p className="text-caption text-[var(--color-text-tertiary)] mt-0.5">
                        Gemini multimodal audio STT with speaker tags, pristine punctuation & chapters.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Visual Knowledge Format Selector */}
            <div className="relative z-30" ref={formatRef}>
              <button
                type="button"
                onClick={() => setFormatOpen(!formatOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-body-sm font-medium transition-all',
                  format !== 'standard'
                    ? 'bg-purple-500/10 dark:bg-purple-950/40 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 shadow-sm font-semibold'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)]'
                )}
                title="Select Visual Knowledge Format"
              >
                <span>{currentFormatOpt.icon}</span>
                <span className="hidden sm:inline">{currentFormatOpt.label}</span>
                <span className={cn(
                  'text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold',
                  format !== 'standard'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]'
                )}>
                  {currentFormatOpt.badge}
                </span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </button>

              {formatOpen && (
                <div className="absolute left-0 top-full mt-2 w-72 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-80 overflow-y-auto">
                  <div className="px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider sticky top-0 bg-[var(--color-bg-primary)] z-10 border-b border-[var(--color-border-tertiary)]/40 mb-1">
                    Transform Video Into
                  </div>
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => { setFormat(opt.id); setFormatOpen(false) }}
                      className={cn(
                        'w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors',
                        format === opt.id ? 'bg-[var(--color-bg-secondary)] font-semibold' : 'hover:bg-[var(--color-bg-secondary)]/50'
                      )}
                    >
                      <span className="text-base shrink-0 mt-0.5">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-body-sm text-[var(--color-text-primary)]">{opt.label}</p>
                          <span className="text-[10px] font-mono px-1 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">{opt.badge}</span>
                        </div>
                        <p className="text-caption text-[var(--color-text-tertiary)] text-[11px] leading-tight mt-0.5">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Credits Balance & Action Buttons */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Live Credits Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] text-caption font-medium border border-[var(--color-border-tertiary)]">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>
                <strong className="text-[var(--color-text-primary)]">{credits}</strong> credits
              </span>
            </div>

            {/* Filters Toggle Button */}
            <div className="relative z-30" ref={filtersRef}>
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-body-sm font-medium transition-all',
                  filtersOpen
                    ? 'bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)] text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-secondary)] border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                )}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Filters</span>
              </button>

              {/* Filters Popover */}
              {filtersOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] shadow-2xl p-3 z-50 flex flex-col gap-3">
                  <div>
                    <label className="text-caption font-semibold text-[var(--color-text-primary)] block mb-1.5">
                      Duration
                    </label>
                    <div className="grid grid-cols-2 gap-1">
                      {['any', 'short', 'medium', 'long'].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDuration(d)}
                          className={cn(
                            'px-2 py-1 rounded-lg text-caption font-medium capitalize text-left transition-colors',
                            duration === d
                              ? 'bg-primary-600 text-white'
                              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                          )}
                        >
                          {d === 'short' ? '< 4 min' : d === 'medium' ? '4-20 min' : d === 'long' ? '> 20 min' : 'Any'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-caption font-semibold text-[var(--color-text-primary)] block mb-1.5">
                      Sort by
                    </label>
                    <div className="flex flex-col gap-1">
                      {[
                        { id: 'relevance', label: 'Relevance' },
                        { id: 'views',     label: 'View Count' },
                        { id: 'date',      label: 'Upload Date' },
                      ].map((o) => (
                        <button
                          key={o.id}
                          onClick={() => setOrder(o.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-caption font-medium text-left transition-colors',
                            order === o.id
                              ? 'bg-primary-600 text-white'
                              : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                          )}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Primary Process / Search Button */}
            <button
              type="button"
              onClick={handleAction}
              disabled={isProcessing || !inputVal.trim()}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-xl text-body-sm font-semibold text-white shadow-lg transition-all',
                'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 active:scale-98',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
              )}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : detectedYtId ? (
                <>
                  <span>Process</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Search</span>
                  <Search className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ── Category Filter Pills (Bottom bar from sketch) ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 px-1 scrollbar-none relative z-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleCategoryClick(cat.id)}
            className={cn(
              'px-4 py-2 rounded-full text-caption sm:text-body-sm font-medium transition-all duration-200 shrink-0',
              category === cat.id
                ? 'bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] shadow-sm'
                : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

    </div>
  )
}
