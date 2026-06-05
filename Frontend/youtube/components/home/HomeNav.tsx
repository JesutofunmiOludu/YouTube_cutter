// src/components/home/HomeNav.tsx — Server Component
import Link from 'next/link'

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#378ADD" strokeWidth="1.5"/>
      <path d="M12 29h8M16 23v6" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 9l9 4.5-9 4.5V9z" fill="#378ADD"/>
    </svg>
  )
}

export function HomeNav() {
  return (
    <header className="sticky top-0 z-sticky bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-heading-sm font-medium text-gray-900 hover:opacity-80 transition-opacity rounded-md focus-visible:outline-none"
        >
          <LogoMark />
          VidMind AI
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
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center h-9 px-4 rounded-md text-body-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
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
            Get Started
          </Link>
        </div>
      </div>
    </header>
  )
}
