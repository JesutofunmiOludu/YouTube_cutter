'use client'

// src/components/home/HomeHero.tsx
import { useState }  from 'react'
import { useRouter } from 'next/router'
import { Search }    from 'lucide-react'
import { cn }        from '@/utils/cn'

function isYouTubeUrl(val: string) {
  return /youtube\.com\/watch|youtu\.be\//i.test(val)
}

export function HomeHero() {
  const router          = useRouter()
  const [urlVal,    setUrlVal]    = useState('')
  const [searchVal, setSearchVal] = useState('')

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = urlVal.trim()
    if (!trimmed || !isYouTubeUrl(trimmed)) return
    router.push(`/register?url=${encodeURIComponent(trimmed)}&intent=process`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = searchVal.trim()
    if (!trimmed) return
    router.push(`/register?q=${encodeURIComponent(trimmed)}&intent=search`)
  }

  return (
    <section
      className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28 bg-white"
      aria-label="Hero"
    >
      {/* Badge */}
      <div
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-10"
        style={{
          fontSize: '10px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          backgroundColor: '#f3f4f6',
          border: '1px solid #e5e7eb',
          color: '#4b5563'
        }}
      >
        Precision Video Intelligence
      </div>

      {/* Headline */}
      <h1
        className="text-gray-900 font-medium max-w-3xl mb-6"
        style={{ fontSize: '60px', lineHeight: '1.08', letterSpacing: '-0.03em' }}
      >
        Stop watching.<br />
        Start understanding.
      </h1>

      {/* Sub-headline */}
      <p
        className="text-gray-600 max-w-xl mb-14"
        style={{ fontSize: '16px', lineHeight: '1.7' }}
      >
        VidMind AI transforms hours of video into structured intelligence. Search
        through content, extract insights, and master topics in minutes.
      </p>

      {/* ── YouTube URL input ── */}
      <form onSubmit={handleUrlSubmit} className="w-full max-w-xl mb-4">
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-3 transition-colors duration-base',
            isYouTubeUrl(urlVal)
              ? 'border-blue-500'
              : 'focus-within:border-gray-400',
          )}
          style={{
            backgroundColor: '#ffffff',
            border: `1.5px solid ${isYouTubeUrl(urlVal) ? '#3b82f6' : '#e5e7eb'}`,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          {/* YouTube icon */}
          <svg className="w-5 h-5 shrink-0 text-gray-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="3" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10 9l5 3-5 3V9z" fill="currentColor"/>
          </svg>

          <input
            id="hero-url-input"
            type="text"
            value={urlVal}
            onChange={(e) => setUrlVal(e.target.value)}
            placeholder="Paste YouTube link to process"
            className="flex-1 bg-transparent border-none outline-none text-gray-900"
            style={{ fontSize: '14px' }}
            aria-label="Paste YouTube link"
          />

          <button
            type="submit"
            disabled={!urlVal.trim() || !isYouTubeUrl(urlVal)}
            className="h-8 px-4 rounded-lg text-body-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: '#111' }}
          >
            Process
          </button>
        </div>
      </form>

      {/* Divider */}
      <p className="text-gray-500 mb-4" style={{ fontSize: '13px' }}>
        or search for a topic
      </p>

      {/* ── Topic search input ── */}
      <form onSubmit={handleSearchSubmit} className="w-full max-w-xl">
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 transition-colors duration-base focus-within:border-gray-400"
          style={{ 
            backgroundColor: '#ffffff', 
            border: '1.5px solid #e5e7eb',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <Search className="w-5 h-5 shrink-0 text-gray-500" aria-hidden="true" />

          <input
            id="hero-search-input"
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search a topic (e.g. Quantum Computing)"
            className="flex-1 bg-transparent border-none outline-none text-gray-900"
            style={{ fontSize: '14px' }}
            aria-label="Search a topic"
          />

          <button
            type="submit"
            disabled={!searchVal.trim()}
            className="h-8 px-4 rounded-lg text-body-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#2563eb' }}
          >
            Search
          </button>
        </div>
      </form>
    </section>
  )
}
