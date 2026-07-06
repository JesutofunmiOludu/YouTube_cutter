import React, { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/ui/Spinner'
import type { UserVideo } from '@/types'

// Helper to extract YouTube ID from standard/shortened/embed URLs
export function extractYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    // youtu.be/ID
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0] ?? null
    // youtube.com/watch?v=ID
    const v = u.searchParams.get('v')
    if (v) return v
    // youtube.com/embed/ID
    const embed = u.pathname.match(/\/embed\/([^/?]+)/)
    if (embed) return embed[1] ?? null
  } catch {/* not a valid URL */}
  return null
}

export interface AddVideoModalProps {
  onAdd: (video: UserVideo) => void
  onClose: () => void
}

export default function AddVideoModal({ onAdd, onClose }: AddVideoModalProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleAdd = () => {
    const ytId = extractYouTubeId(url.trim())
    if (!ytId) {
      setError('Please enter a valid YouTube URL (e.g. https://youtube.com/watch?v=…)')
      return
    }
    setError(null)
    setLoading(true)
    // Simulate a short fetch delay, then create a mock UserVideo
    setTimeout(() => {
      const newVideo: UserVideo = {
        id: `uv_${ytId}`,
        user_id: 'u1',
        storage_type: 'reference',
        file_url: null,
        processing_status: 'completed',
        saved_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        video: {
          id: `v_${ytId}`,
          youtube_id: ytId,
          title: `YouTube Video (${ytId})`,
          description: null,
          thumbnail_url: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`,
          duration_seconds: 0,
          channel_id: 'unknown',
          channel_name: 'YouTube',
          category: null,
          published_at: null,
          created_at: new Date().toISOString(),
        },
      }
      setLoading(false)
      onAdd(newVideo)
    }, 900)
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-2xl border border-[var(--color-border-tertiary)] w-[90vw] max-w-md mx-4 p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-heading-md text-[var(--color-text-primary)]">Add a Video</h2>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              Paste a YouTube link to include it in this chat session.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* URL input */}
        <div className="flex flex-col gap-2">
          <label className="text-caption font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
            YouTube URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=…"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              autoFocus
              className={cn(
                'flex-1 px-3 py-2.5 rounded-xl text-body-sm border bg-[var(--color-bg-secondary)]',
                'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
                'outline-none focus:ring-2 focus:ring-primary-300 transition',
                error ? 'border-red-400' : 'border-[var(--color-border-secondary)]',
              )}
            />
          </div>
          {error && (
            <p className="text-caption text-red-500">{error}</p>
          )}
        </div>

        {/* Preview thumbnail if URL looks valid */}
        {extractYouTubeId(url) && (
          <div className="rounded-xl overflow-hidden border border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]">
            <img
              src={`https://img.youtube.com/vi/${extractYouTubeId(url)}/mqdefault.jpg`}
              alt="Video thumbnail"
              className="w-full object-cover h-32"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <p className="text-caption text-[var(--color-text-tertiary)] px-3 py-2 truncate">
              youtube.com/watch?v={extractYouTubeId(url)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-body-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!url.trim() || loading}
            className="px-5 py-2 rounded-xl text-body-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <><Spinner size="sm" variant="white" label="Adding…" /> Adding…</>
            ) : (
              <><Plus className="w-4 h-4" /> Add to Chat</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
