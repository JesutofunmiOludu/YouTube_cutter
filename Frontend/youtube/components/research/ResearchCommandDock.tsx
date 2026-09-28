// ============================================================
// VidMind AI — ResearchCommandDock Component
// components/research/ResearchCommandDock.tsx
//
// Floating glassmorphic multimodal command dock:
//  - Mode selector dropdown (Quick Search, Deep Research, Learn Step by Step)
//  - Keyboard shortcut support ('/' to trigger search modes)
//  - Auto-submitting and mode-aware placeholder
//  - Voice dictation & submit action controls
// ============================================================

import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  Zap,
  BookOpen,
  ChevronDown,
  Check,
  Plus,
  Mic,
  ArrowUp,
  Loader2,
  Lock,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useToast } from '@/components/ui/Toast'

export type SearchMode = 'search' | 'deep_research' | 'learn'

export interface SearchModeOption {
  id: SearchMode
  label: string
  badge?: string
  description: string
  icon: React.ElementType
}

export const SEARCH_MODE_OPTIONS: SearchModeOption[] = [
  {
    id: 'search',
    label: 'Quick Search',
    description: 'Instant web lookup with real-time citations & video timestamps',
    icon: Search,
  },
  {
    id: 'deep_research',
    label: 'Deep Research',
    badge: 'PRO',
    description: 'In-depth multi-source cited report & deep web exploration',
    icon: Zap,
  },
  {
    id: 'learn',
    label: 'Learn Step-by-Step',
    description: 'Structured study guide and interactive comprehension questions',
    icon: BookOpen,
  },
]

export interface ResearchCommandDockProps {
  query: string
  onQueryChange: (q: string) => void
  mode: SearchMode
  onModeChange: (m: SearchMode) => void
  onSubmit: () => void
  isLoading?: boolean
  isPremium?: boolean
  onAddVideo?: () => void
  placeholder?: string
  className?: string
}

export const ResearchCommandDock: React.FC<ResearchCommandDockProps> = ({
  query,
  onQueryChange,
  mode,
  onModeChange,
  onSubmit,
  isLoading = false,
  isPremium = true,
  onAddVideo,
  placeholder,
  className,
}) => {
  const { toast } = useToast()
  const [modeOpen, setModeOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeMode = SEARCH_MODE_OPTIONS.find((m) => m.id === mode) || SEARCH_MODE_OPTIONS[0]
  const ActiveIcon = activeMode.icon

  // Global '/' keyboard shortcut to focus input
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleGlobalKey)
    return () => window.removeEventListener('keydown', handleGlobalKey)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (query.trim() && !isLoading) {
        onSubmit()
      }
    }
  }

  const defaultPlaceholder =
    mode === 'deep_research'
      ? 'Ask for deep research on this video or type / for modes…'
      : mode === 'learn'
      ? 'What topic would you like to learn step by step?…'
      : 'Quick search this video or ask a question (Type /)…'

  return (
    <div className={cn('relative w-full max-w-4xl mx-auto', className)}>
      {/* Mode Selector Popover (appears above input) */}
      {modeOpen && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-3 w-80 sm:w-96 rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="px-3.5 py-2.5 border-b border-[var(--color-border-tertiary)] flex items-center justify-between bg-[var(--color-bg-secondary)]/50">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
              Research Modes
            </span>
            <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
              ESC to close
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {SEARCH_MODE_OPTIONS.map((opt) => {
              const Icon = opt.icon
              const isSelected = opt.id === mode
              const isLocked = opt.id === 'deep_research' && !isPremium

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onModeChange(opt.id)
                    setModeOpen(false)
                    inputRef.current?.focus()
                  }}
                  className={cn(
                    'w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all',
                    isSelected
                      ? 'bg-primary-500/10 border border-primary-500/20 text-primary-600 dark:text-primary-400'
                      : 'hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-transparent'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold">{opt.label}</span>
                      {opt.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          {opt.badge}
                        </span>
                      )}
                      {isLocked && <Lock className="w-3 h-3 text-amber-500" />}
                    </div>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] leading-tight mt-0.5">
                      {opt.description}
                    </p>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-primary-500 mt-1 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Glassmorphic Dock Container */}
      <div className="bg-[var(--color-bg-primary)]/90 backdrop-blur-xl border border-[var(--color-border-secondary)] rounded-2xl shadow-xl p-2 sm:p-2.5 flex items-center gap-2 transition-all focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500/60">
        {/* Attachment / Add video button */}
        {onAddVideo && (
          <button
            type="button"
            onClick={onAddVideo}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] border border-transparent hover:border-[var(--color-border-tertiary)] transition-colors shrink-0"
            title="Add related YouTube video for cross-synthesis"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Mode Selector Pill Button */}
        <button
          type="button"
          onClick={() => setModeOpen((prev) => !prev)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] text-[12px] font-medium transition-colors shrink-0 shadow-2xs"
        >
          <ActiveIcon className="w-3.5 h-3.5 text-primary-500" />
          <span className="hidden sm:inline">{activeMode.label}</span>
          <ChevronDown
            className={cn('w-3.5 h-3.5 text-[var(--color-text-tertiary)] transition-transform', modeOpen && 'rotate-180')}
          />
        </button>

        {/* Query Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={placeholder || defaultPlaceholder}
          className="flex-1 bg-transparent border-0 outline-none text-body-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] min-w-0 px-2 py-1 leading-relaxed"
        />

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={() => toast.info('Voice input coming soon 🎙️')}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors shrink-0"
          title="Voice dictation"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Submit Execution Button (Obsidian Pill) */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!query.trim() || isLoading}
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all shadow-sm shrink-0',
            !query.trim() || isLoading
              ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
              : 'bg-neutral-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 active:scale-95'
          )}
          title="Send inquiry (Enter ↵)"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : (
            <ArrowUp className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>
    </div>
  )
}

ResearchCommandDock.displayName = 'ResearchCommandDock'
export default ResearchCommandDock
