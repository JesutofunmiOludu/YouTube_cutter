// ============================================================
// VidMind AI — Visual Knowledge Canvas Page
// pages/workspace/[uservideoId]/canvas.tsx
//
// Dedicated full-screen radial visual workspace where the video
// sits at the center and structured knowledge items radiate in orbit.
// Supports Mindmap, Cheatsheet, Concept Map, Blueprint, and Timeline.
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import {
  ChevronLeft,
  Sparkles,
  GitFork,
  BookOpen,
  Network,
  Cpu,
  Clock,
  Layers,
  RotateCw,
  ExternalLink,
  Sliders,
  Play,
  Share2,
  X,
  AlertCircle,
  Scissors,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { apiClient } from '@/utils/apiClient'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import RadialKnowledgeCanvas from '@/components/canvas/RadialKnowledgeCanvas'
import { SegmentFocusModal } from '@/components/canvas/SegmentFocusModal'
import type {
  KnowledgeFormatType,
  KnowledgeFormatPayload,
  KnowledgeNode,
  UserVideo,
} from '@/types'

const FORMATS: Array<{
  id: KnowledgeFormatType
  label: string
  icon: React.ComponentType<{ className?: string }>
  desc: string
  color: string
}> = [
  {
    id: 'mindmap',
    label: 'Mindmap',
    icon: GitFork,
    desc: 'Radial branch breakdown',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    id: 'cheatsheet',
    label: 'Cheatsheet',
    icon: BookOpen,
    desc: 'Quick takeaways & formulas',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'concept_map',
    label: 'Concept Map',
    icon: Network,
    desc: 'Interlinked topic graph',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    icon: Cpu,
    desc: 'Step-by-step architecture',
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: Clock,
    desc: 'Chronological progression',
    color: 'from-rose-500 to-pink-600',
  },
]

export default function KnowledgeCanvasPage() {
  const router = useRouter()
  const { uservideoId, format: queryFormat } = router.query
  const { toast } = useToast()

  // Format state
  const activeFormat: KnowledgeFormatType = useMemo(() => {
    if (!queryFormat || typeof queryFormat !== 'string') return 'mindmap'
    const valid = ['mindmap', 'cheatsheet', 'concept_map', 'blueprint', 'timeline', 'standard']
    return valid.includes(queryFormat) ? (queryFormat as KnowledgeFormatType) : 'mindmap'
  }, [queryFormat])

  // Data state
  const [userVideo, setUserVideo] = useState<UserVideo | null>(null)
  const [payload, setPayload] = useState<KnowledgeFormatPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Segment focus modal state
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Full video player modal
  const [showFullPlayerModal, setShowFullPlayerModal] = useState(false)

  // Fetch UserVideo info
  useEffect(() => {
    if (!uservideoId || typeof uservideoId !== 'string') return

    apiClient
      .get(`/videos/${uservideoId}/?touch=true`)
      .then((res) => {
        setUserVideo(res.data)
      })
      .catch((err) => {
        console.error('Failed to load video details', err)
        setError('Failed to load video details. Please try again.')
      })
  }, [uservideoId])

  // Fetch knowledge format data whenever uservideoId or activeFormat changes
  const fetchFormatData = useCallback(
    async (refresh: boolean = false) => {
      if (!uservideoId || typeof uservideoId !== 'string') return
      if (activeFormat === 'standard') {
        router.push(`/workspace/${uservideoId}`)
        return
      }

      if (refresh) {
        setIsRegenerating(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const url = `/videos/${uservideoId}/formats/${activeFormat}/${
          refresh ? '?refresh=1' : ''
        }`
        const res = await apiClient.get<KnowledgeFormatPayload>(url)
        setPayload(res.data)
      } catch (err: any) {
        console.error('Failed to load knowledge format', err)
        const msg =
          err.response?.data?.error?.message ||
          err.response?.data?.detail ||
          'Failed to generate visual knowledge format.'
        setError(msg)
        toast.error(msg)
      } finally {
        setIsLoading(false)
        setIsRegenerating(false)
      }
    },
    [uservideoId, activeFormat, router, toast]
  )

  useEffect(() => {
    fetchFormatData(false)
  }, [fetchFormatData])

  // Change format handler
  const handleSwitchFormat = (newFormat: KnowledgeFormatType) => {
    if (newFormat === 'standard') {
      router.push(`/workspace/${uservideoId}`)
      return
    }

    if (newFormat === activeFormat) return

    router.replace(
      {
        pathname: router.pathname,
        query: { ...router.query, format: newFormat },
      },
      undefined,
      { shallow: true }
    )
  }

  // Node selection for segment focus modal
  const handleSelectNode = (node: KnowledgeNode) => {
    setSelectedNode(node)
    setIsModalOpen(true)
  }

  // Node navigation inside modal
  const nodes = payload?.nodes || []
  const currentNodeIndex = selectedNode
    ? nodes.findIndex((n) => n.id === selectedNode.id)
    : -1
  const hasPrev = currentNodeIndex > 0
  const hasNext = currentNodeIndex >= 0 && currentNodeIndex < nodes.length - 1

  const handlePrevSegment = () => {
    if (hasPrev) {
      setSelectedNode(nodes[currentNodeIndex - 1])
    }
  }

  const handleNextSegment = () => {
    if (hasNext) {
      setSelectedNode(nodes[currentNodeIndex + 1])
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B0F19] text-slate-100">
      <Head>
        <title>
          {userVideo?.video?.title
            ? `${userVideo.video.title} — VidMind Knowledge Canvas`
            : 'Knowledge Canvas — VidMind AI'}
        </title>
      </Head>

      {/* ── Top Navigation Bar ── */}
      <header className="h-14 px-4 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between shrink-0 z-30">
        {/* Left: Back button & Video Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/workspace/${uservideoId}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Editor</span>
          </Link>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              {userVideo?.video?.title || 'Video Knowledge Canvas'}
            </h1>
            <p className="text-[10px] text-slate-400 truncate">
              {userVideo?.video?.channel_name || 'VidMind AI'}
            </p>
          </div>
        </div>

        {/* Center: Format Switcher Pills */}
        <div className="hidden lg:flex items-center gap-1 p-1 rounded-xl bg-slate-950/70 border border-slate-800 shadow-inner">
          {/* Standard workspace pill */}
          <button
            onClick={() => handleSwitchFormat('standard')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            )}
            title="Switch to 3-column Video Cutter Workspace"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Editor</span>
          </button>

          {/* Canvas formats */}
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon
            const isActive = activeFormat === fmt.id
            return (
              <button
                key={fmt.id}
                onClick={() => handleSwitchFormat(fmt.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                )}
              >
                <Icon
                  className={cn(
                    'w-3.5 h-3.5',
                    isActive ? 'text-primary-400' : 'text-slate-400'
                  )}
                />
                <span>{fmt.label}</span>
              </button>
            )
          })}
        </div>

        {/* Right: Actions (Regenerate, Switch to Editor, Share) */}
        <div className="flex items-center gap-2">
          {/* Mobile format dropdown toggle */}
          <div className="lg:hidden flex items-center">
            <select
              value={activeFormat}
              onChange={(e) => handleSwitchFormat(e.target.value as KnowledgeFormatType)}
              className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none"
            >
              <option value="standard">Standard Workspace</option>
              <option value="mindmap">Mindmap</option>
              <option value="cheatsheet">Cheatsheet</option>
              <option value="concept_map">Concept Map</option>
              <option value="blueprint">Blueprint</option>
              <option value="timeline">Timeline</option>
            </select>
          </div>

          {/* Regenerate AI Format Button */}
          <button
            onClick={() => fetchFormatData(true)}
            disabled={isRegenerating || isLoading}
            title="Regenerate format using Gemini AI"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RotateCw
              className={cn('w-3.5 h-3.5 text-primary-400', isRegenerating && 'animate-spin')}
            />
            <span className="hidden md:inline">Regenerate</span>
          </button>

          {/* Jump to Standard Workspace button */}
          <Link
            href={`/workspace/${uservideoId}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 hover:bg-primary-500 text-white shadow-lg transition-colors"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cutter Workspace</span>
          </Link>
        </div>
      </header>

      {/* ── Main Canvas Viewport ── */}
      <main className="flex-1 relative overflow-hidden">
        {/* Loading state */}
        {isLoading && (
          <div className="absolute inset-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-2xl animate-pulse">
                <Sparkles className="w-8 h-8 text-white animate-spin-slow" />
              </div>
            </div>
            <div className="text-center max-w-sm px-4">
              <h3 className="text-sm font-semibold text-white">
                Synthesizing {FORMATS.find((f) => f.id === activeFormat)?.label || 'Knowledge'} Canvas...
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Extracting core video themes, structuring chronological nodes, and positioning orbital branches.
              </p>
            </div>
            <Spinner className="w-5 h-5 text-primary-400 mt-2" />
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && !payload && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-3 text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">Could not generate format canvas</h3>
            <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">{error}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchFormatData(true)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-500 shadow-md transition-colors"
              >
                Retry Generation
              </button>
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/auth/login"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                Switch Account
              </Link>
            </div>
          </div>
        )}

        {/* Interactive Radial Canvas */}
        {payload && userVideo && (
          <RadialKnowledgeCanvas
            payload={payload}
            userVideo={userVideo}
            format={activeFormat}
            onSelectNode={handleSelectNode}
            selectedNodeId={selectedNode?.id}
          />
        )}
      </main>

      {/* ── Segment Interaction Focus Modal ── */}
      {selectedNode && userVideo && (
        <SegmentFocusModal
          node={selectedNode}
          userVideo={userVideo}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onPrevSegment={handlePrevSegment}
          onNextSegment={handleNextSegment}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </div>
  )
}
