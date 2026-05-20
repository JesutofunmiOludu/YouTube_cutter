'use client'

// src/components/home/HomeHero.tsx
import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import Link           from 'next/link'
import { Search, ArrowRight, Play } from 'lucide-react'
import { cn }         from '@/utils/cn'
import { Button }     from '@components/ui/Button'

function isYouTubeUrl(val: string) {
  return /youtube\.com\/watch|youtu\.be\//i.test(val)
}

export function HomeHero() {
  const router        = useRouter()
  const [val, setVal] = useState('')
  const isLink        = isYouTubeUrl(val)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = val.trim()
    if (!trimmed) return
    if (isLink) {
      router.push(`/register?url=${encodeURIComponent(trimmed)}&intent=process`)
    } else {
      router.push(`/register?q=${encodeURIComponent(trimmed)}&intent=search`)
    }
  }

  return (
    <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-white" aria-label="Hero">
      {/* Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-caption font-medium text-gray-800 mb-6">
        <Play className="w-3 h-3" aria-hidden="true" />
        AI-powered video learning
      </div>

      {/* Headline */}
      <h1 className="text-display-lg text-gray-900 max-w-2xl mb-4 leading-tight">
        Stop watching.{' '}
        <span className="text-blue-600">Start understanding.</span>
      </h1>

      {/* Sub */}
      <p className="text-body-lg text-gray-600 max-w-lg mb-10 leading-relaxed">
        Paste any YouTube link or search a topic. AI slices it into chapters, transcribes it, and builds a cited research report — in seconds.
      </p>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="w-full max-w-xl mb-4" role="search">
        <div className={cn(
          'flex items-center gap-2 bg-white border-2 rounded-xl px-4 py-3 transition-colors duration-base',
          isLink ? 'border-emerald-200' : 'border-gray-300',
          'focus-within:border-blue-400',
        )}>
          <Search className="w-5 h-5 shrink-0 text-gray-500" aria-hidden="true" />
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="Search a topic or paste a YouTube link…"
            className="flex-1 bg-transparent border-none outline-none text-body-md text-gray-900 placeholder:text-gray-400"
            aria-label="Search or paste YouTube link"
            autoFocus
          />
          <Button type="submit" variant="primary" size="sm" disabled={!val.trim()} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            {isLink ? 'Process' : 'Search'}
          </Button>
        </div>
        <p className="text-caption text-gray-500 text-center mt-2">
          {isLink ? '✓ YouTube link detected — we\'ll process this video for you' : 'Try "learn React hooks" or paste any YouTube URL'}
        </p>
      </form>

      <p className="text-caption text-gray-500">
        No sign-up needed to preview ·{' '}
        <Link href="/register" className="text-blue-600 hover:text-blue-800 transition-colors">
          Free forever plan available
        </Link>
      </p>
    </section>
  )
}
