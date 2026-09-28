import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, X, Video, Library, Link2, Search, Sparkles, Compass } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Spinner } from '@/components/ui/Spinner'
import { apiClient } from '@/utils/apiClient'
import { formatDuration } from '@/components/video/VideoCard'
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

function cleanTitleForSearch(title: string): string {
  return title
    .replace(/\[.*?\]|\(.*?\)/g, '') // remove brackets/parens content
    .replace(/[|#]/g, ' ')           // remove dividers
    .replace(/\s+/g, ' ')            // normalize whitespace
    .trim()
}

function formatViews(views?: number | null): string {
  if (!views) return ''
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`
  return `${views} views`
}

export interface AddVideoModalProps {
  onAdd: (video: UserVideo) => Promise<void>
  onClose: () => void
  currentVideo?: UserVideo | null
}

type TabType = 'related' | 'library' | 'url'

interface YouTubeSearchResult {
  youtube_id: string
  title: string
  thumbnail_url: string
  duration_seconds: number
  channel_name: string
  published_at?: string | null
  view_count?: number | null
}

export default function AddVideoModal({
  onAdd,
  onClose,
  currentVideo,
}: AddVideoModalProps) {
  // Default to 'related' if currentVideo exists, otherwise 'library'
  const [activeTab, setActiveTab] = useState<TabType>(currentVideo ? 'related' : 'library')
  
  // ── Related Videos tab state ──
  const initialRelatedQuery = currentVideo?.video?.title
    ? cleanTitleForSearch(currentVideo.video.title)
    : ''
  const [relatedQuery, setRelatedQuery] = useState(initialRelatedQuery)
  const [relatedResults, setRelatedResults] = useState<YouTubeSearchResult[]>([])
  const [loadingRelated, setLoadingRelated] = useState(false)
  const [selectedRelatedId, setSelectedRelatedId] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ── Library tab state ──
  const [libraryVideos, setLibraryVideos] = useState<UserVideo[]>([])
  const [loadingLibrary, setLoadingLibrary] = useState(true)
  const [librarySearch, setLibrarySearch] = useState('')
  const [selectedLibraryVideoId, setSelectedLibraryVideoId] = useState<string | null>(null)
  
  // ── URL tab state ──
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch library videos on mount
  useEffect(() => {
    let active = true
    const fetchVideos = async () => {
      try {
        setLoadingLibrary(true)
        const res = await apiClient.get('/videos/')
        const list: UserVideo[] = res.data.results || res.data || []
        if (active) {
          setLibraryVideos(list)
          if (list.length === 0 && !currentVideo) {
            setActiveTab('url')
          }
        }
      } catch (err) {
        console.error('Failed to fetch library videos', err)
        if (active && !currentVideo) {
          setActiveTab('url')
        }
      } finally {
        if (active) setLoadingLibrary(false)
      }
    }
    fetchVideos()
    return () => {
      active = false
    }
  }, [currentVideo])

  // Fetch related YouTube videos
  const fetchRelatedVideos = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setRelatedResults([])
      setLoadingRelated(false)
      return
    }
    try {
      setLoadingRelated(true)
      const res = await apiClient.get('/videos/search/', {
        params: {
          q: trimmed,
          limit: 15,
          order: 'relevance',
        },
      })
      const results: YouTubeSearchResult[] = res.data.results || []
      // Filter out the current video if present
      const currentYtId = currentVideo?.video?.youtube_id
      const filtered = currentYtId
        ? results.filter((r) => r.youtube_id !== currentYtId)
        : results
      setRelatedResults(filtered)
    } catch (err: any) {
      console.error('Failed to search related videos', err)
    } finally {
      setLoadingRelated(false)
    }
  }, [currentVideo?.video?.youtube_id])

  // Trigger related search on mount or when query changes (with debounce)
  useEffect(() => {
    if (activeTab !== 'related') return

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (!relatedQuery.trim()) {
      setRelatedResults([])
      setLoadingRelated(false)
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchRelatedVideos(relatedQuery)
    }, 400)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [relatedQuery, activeTab, fetchRelatedVideos])

  // Initial fetch on mount if query is pre-filled
  useEffect(() => {
    if (initialRelatedQuery && activeTab === 'related') {
      fetchRelatedVideos(initialRelatedQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredLibrary = useMemo(() => {
    const q = librarySearch.trim().toLowerCase()
    if (!q) return libraryVideos
    return libraryVideos.filter((uv) => {
      const title = uv.video?.title?.toLowerCase() ?? ''
      const channel = uv.video?.channel_name?.toLowerCase() ?? ''
      return title.includes(q) || channel.includes(q)
    })
  }, [libraryVideos, librarySearch])

  // Quick topics extracted from current video cuts
  const topicSuggestions = useMemo(() => {
    if (!currentVideo?.cuts) return []
    return currentVideo.cuts
      .filter((c) => Boolean(c.title))
      .slice(0, 5)
      .map((c) => c.title as string)
  }, [currentVideo])

  const handleAddFromLibrary = async (video: UserVideo) => {
    setError(null)
    setSelectedLibraryVideoId(video.id)
    setLoading(true)
    try {
      await onAdd(video)
    } catch (err: any) {
      const errorPayload = err?.response?.data?.error
      setError(errorPayload?.message ?? 'Failed to add video to chat.')
    } finally {
      setLoading(false)
      setSelectedLibraryVideoId(null)
    }
  }

  const handleAddRelatedVideo = async (ytVideo: YouTubeSearchResult) => {
    setError(null)
    setSelectedRelatedId(ytVideo.youtube_id)
    setLoading(true)

    const newVideo: UserVideo = {
      id: `uv_${ytVideo.youtube_id}`,
      user_id: 'u1',
      storage_type: 'reference',
      file_url: null,
      processing_status: 'completed',
      saved_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      video: {
        id: `v_${ytVideo.youtube_id}`,
        youtube_id: ytVideo.youtube_id,
        title: ytVideo.title,
        description: null,
        thumbnail_url: ytVideo.thumbnail_url,
        duration_seconds: ytVideo.duration_seconds || 0,
        channel_id: '',
        channel_name: ytVideo.channel_name || 'YouTube',
        category: null,
        published_at: ytVideo.published_at || null,
        created_at: new Date().toISOString(),
      },
    }

    try {
      await onAdd(newVideo)
    } catch (err: any) {
      const errorPayload = err?.response?.data?.error
      setError(errorPayload?.message ?? 'Failed to add video to chat.')
      setLoading(false)
      setSelectedRelatedId(null)
    }
  }

  const handleAddFromUrl = async () => {
    const ytId = extractYouTubeId(url.trim())
    if (!ytId) {
      setError('Please enter a valid YouTube URL (e.g. https://youtube.com/watch?v=…)')
      return
    }
    setError(null)
    setLoading(true)

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

    try {
      await onAdd(newVideo)
    } catch (err: any) {
      const errorPayload = err?.response?.data?.error
      setError(errorPayload?.message ?? 'Failed to add video to chat.')
      setLoading(false)
    }
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[var(--color-bg-primary)] rounded-2xl shadow-2xl border border-[var(--color-border-tertiary)] w-full max-w-xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 shrink-0">
          <div>
            <h2 className="text-heading-md text-[var(--color-text-primary)]">Add a Video</h2>
            <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">
              Discover related videos, choose from your library, or paste a link.
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

        {/* Tab switcher */}
        <div className="flex border-b border-[var(--color-border-tertiary)] px-6 shrink-0 gap-5 sm:gap-6 overflow-x-auto">
          {/* Related Videos Tab */}
          <button
            type="button"
            onClick={() => { setActiveTab('related'); setError(null) }}
            className={cn(
              'flex items-center gap-1.5 py-2.5 text-body-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
              activeTab === 'related'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <Sparkles className="w-4 h-4 text-primary-500" />
            <span>Related Videos</span>
            {currentVideo && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary-100 text-primary-700">
                AI
              </span>
            )}
          </button>

          {/* Library Tab */}
          <button
            type="button"
            onClick={() => { setActiveTab('library'); setError(null) }}
            className={cn(
              'flex items-center gap-1.5 py-2.5 text-body-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
              activeTab === 'library'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <Library className="w-4 h-4" />
            <span>My Library</span>
            {libraryVideos.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                {libraryVideos.length}
              </span>
            )}
          </button>

          {/* URL Tab */}
          <button
            type="button"
            onClick={() => { setActiveTab('url'); setError(null) }}
            className={cn(
              'flex items-center gap-1.5 py-2.5 text-body-sm font-semibold border-b-2 transition-colors -mb-px whitespace-nowrap',
              activeTab === 'url'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <Link2 className="w-4 h-4" />
            <span>YouTube URL</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-6 mt-3 p-2.5 rounded-xl bg-danger-50 border border-danger-200 text-caption text-danger-700">
            {error}
          </div>
        )}

        {/* ── TAB 1: Related Videos ── */}
        {activeTab === 'related' && (
          <div className="flex flex-col flex-1 min-h-0 px-6 py-4">
            {/* Context notice if working on a specific video */}
            {currentVideo ? (
              <div className="mb-3 px-3 py-2 rounded-xl bg-primary-50/60 border border-primary-100 flex items-center gap-2">
                <Compass className="w-4 h-4 text-primary-600 shrink-0" />
                <p className="text-caption text-primary-900 truncate">
                  Showing videos related to: <strong className="font-semibold">{currentVideo.video.title}</strong>
                </p>
              </div>
            ) : null}

            {/* Search Input */}
            <div className="relative mb-2.5 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search YouTube for related topics…"
                value={relatedQuery}
                onChange={(e) => setRelatedQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-body-sm border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:ring-2 focus:ring-primary-300 transition"
              />
            </div>

            {/* Quick Topic Suggestions */}
            {topicSuggestions.length > 0 && (
              <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 shrink-0">
                <span className="text-[11px] text-[var(--color-text-tertiary)] shrink-0 font-medium">
                  Topics:
                </span>
                {topicSuggestions.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setRelatedQuery(topic)}
                    className="px-2 py-0.5 rounded-full text-[11px] bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] text-[var(--color-text-secondary)] hover:border-primary-300 hover:text-primary-600 transition-colors shrink-0 truncate max-w-[150px]"
                    title={`Search for "${topic}"`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}

            {/* Video List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[220px]">
              {loadingRelated ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-[var(--color-text-tertiary)]">
                  <Spinner size="md" />
                  <p className="text-caption">Searching YouTube for related videos…</p>
                </div>
              ) : relatedResults.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-center text-[var(--color-text-tertiary)]">
                  <Video className="w-8 h-8 opacity-40" />
                  <p className="text-body-sm font-medium text-[var(--color-text-secondary)]">
                    {relatedQuery ? 'No related videos found' : 'Enter a search term to find videos'}
                  </p>
                  <p className="text-caption max-w-xs">
                    Try searching for a different keyword or paste a specific YouTube URL.
                  </p>
                </div>
              ) : (
                relatedResults.map((v) => {
                  const isAdding = loading && selectedRelatedId === v.youtube_id

                  return (
                    <div
                      key={v.youtube_id}
                      onClick={() => !loading && handleAddRelatedVideo(v)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                          handleAddRelatedVideo(v)
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left cursor-pointer group',
                        'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)] hover:border-primary-300 hover:bg-primary-50/20',
                        isAdding && 'opacity-60 pointer-events-none'
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-22 h-14 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0 border border-[var(--color-border-tertiary)]">
                        {v.thumbnail_url ? (
                          <img
                            src={v.thumbnail_url}
                            alt={v.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                          </div>
                        )}
                        {v.duration_seconds ? (
                          <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-medium px-1 rounded">
                            {formatDuration(v.duration_seconds)}
                          </span>
                        ) : null}
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-primary-700 transition-colors">
                          {v.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-caption text-[var(--color-text-tertiary)] flex-wrap">
                          <span className="truncate max-w-[130px]">{v.channel_name}</span>
                          {v.view_count ? (
                            <>
                              <span>•</span>
                              <span>{formatViews(v.view_count)}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 pr-1">
                        {isAdding ? (
                          <Spinner size="sm" />
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-caption font-semibold bg-white border border-[var(--color-border-secondary)] text-primary-700 group-hover:bg-primary-600 group-hover:text-white group-hover:border-primary-600 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 2: Library ── */}
        {activeTab === 'library' && (
          <div className="flex flex-col flex-1 min-h-0 px-6 py-4">
            {/* Search filter */}
            <div className="relative mb-3 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]" />
              <input
                type="text"
                placeholder="Search your library…"
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-body-sm border border-[var(--color-border-secondary)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:ring-2 focus:ring-primary-300 transition"
              />
            </div>

            {/* Video List */}
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 min-h-[220px]">
              {loadingLibrary ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-[var(--color-text-tertiary)]">
                  <Spinner size="md" />
                  <p className="text-caption">Loading your videos…</p>
                </div>
              ) : filteredLibrary.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 py-12 text-center text-[var(--color-text-tertiary)]">
                  <Video className="w-8 h-8 opacity-40" />
                  <p className="text-body-sm font-medium text-[var(--color-text-secondary)]">
                    {librarySearch ? 'No matching videos found' : 'No videos in your library yet'}
                  </p>
                  <p className="text-caption max-w-xs">
                    {librarySearch
                      ? 'Try a different search keyword or switch to Related Videos.'
                      : 'Switch to Related Videos or YouTube URL to find or paste a link.'}
                  </p>
                </div>
              ) : (
                filteredLibrary.map((uv) => {
                  const v = uv.video
                  const cutsCount = uv.cuts?.length ?? 0
                  const isProcessing = loading && selectedLibraryVideoId === uv.id

                  return (
                    <div
                      key={uv.id}
                      onClick={() => !loading && handleAddFromLibrary(uv)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !loading) {
                          handleAddFromLibrary(uv)
                        }
                      }}
                      className={cn(
                        'flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left cursor-pointer group',
                        'bg-[var(--color-bg-secondary)] border-[var(--color-border-tertiary)] hover:border-primary-300 hover:bg-primary-50/20',
                        isProcessing && 'opacity-60 pointer-events-none'
                      )}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-20 h-13 rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] shrink-0 border border-[var(--color-border-tertiary)]">
                        {v?.thumbnail_url ? (
                          <img
                            src={v.thumbnail_url}
                            alt={v.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                          </div>
                        )}
                        {v?.duration_seconds ? (
                          <span className="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-medium px-1 rounded">
                            {formatDuration(v.duration_seconds)}
                          </span>
                        ) : null}
                      </div>

                      {/* Video Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate group-hover:text-primary-700 transition-colors">
                          {v?.title || 'Untitled Video'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-caption text-[var(--color-text-tertiary)] truncate max-w-[130px]">
                            {v?.channel_name || 'YouTube'}
                          </span>
                          {cutsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary-700 bg-primary-50 px-1.5 py-0.5 rounded-md border border-primary-200">
                              <Sparkles className="w-2.5 h-2.5 text-primary-500" />
                              {cutsCount} topics ready
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 pr-1">
                        {isProcessing ? (
                          <Spinner size="sm" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-caption font-semibold text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3: URL ── */}
        {activeTab === 'url' && (
          <div className="flex flex-col gap-4 px-6 py-5">
            <div className="flex flex-col gap-2">
              <label className="text-caption font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                YouTube URL
              </label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=…"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddFromUrl() }}
                autoFocus
                className={cn(
                  'w-full px-3 py-2.5 rounded-xl text-body-sm border bg-[var(--color-bg-secondary)]',
                  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]',
                  'outline-none focus:ring-2 focus:ring-primary-300 transition',
                  error ? 'border-red-400' : 'border-[var(--color-border-secondary)]',
                )}
              />
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
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-body-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddFromUrl}
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
        )}
      </div>
    </div>
  )
}
