// src/components/home/HomeNav.tsx — Server Component
import Link from 'next/link'

export function HomeNav() {
  return (
    <header className="sticky top-0 z-sticky bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 text-heading-sm font-semibold text-gray-900 hover:opacity-80 transition-opacity rounded-md focus-visible:outline-none"
        >
          <img src="/logo.png" alt="ClipMide Logo" className="w-7 h-7 object-contain" />
          <span>ClipMide</span>
        </Link>

        {/* Centered nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/features"
            className="text-body-sm text-gray-900 border-b-2 border-blue-500 pb-0.5 transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-body-sm text-gray-600 hover:text-gray-900 border-b-2 border-transparent pb-0.5 transition-colors"
          >
            Pricing
          </Link>
        </nav>

        {/* CTA group */}
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="inline-flex items-center h-9 px-4 rounded-full text-body-sm font-medium transition-colors"
            style={{
              color: '#374151',
              border: '1.5px solid #d1d5db',
              backgroundColor: '#ffffff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af'
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.backgroundColor = '#ffffff'
            }}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center h-9 px-5 rounded-full text-body-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#2563eb' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
          >
            Get started
          </Link>
        </div>
      </div>
    </header>
  )
}
