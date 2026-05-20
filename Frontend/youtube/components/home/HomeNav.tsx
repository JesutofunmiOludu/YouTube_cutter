// src/components/home/HomeNav.tsx — Server Component
import Link from 'next/link'

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5"/>
      <path d="M12 29h8M16 23v6" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 9l9 4.5-9 4.5V9z" fill="#185FA5"/>
    </svg>
  )
}

export function HomeNav() {
  return (
    <header className="sticky top-0 z-sticky bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-heading-sm font-medium text-gray-900 hover:opacity-80 transition-opacity rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200">
          <LogoMark />
          VidMind AI
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {['Features', 'Pricing'].map((item) => (
            <Link key={item} href={`/${item.toLowerCase()}`}
              className="text-body-sm text-gray-500 hover:text-gray-900 transition-colors">
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex items-center h-9 px-4 rounded-md text-body-sm font-medium text-gray-900 border border-gray-300 hover:bg-gray-50 transition-colors">
            Log in
          </Link>
          <Link href="/register" className="inline-flex items-center h-9 px-4 rounded-md text-body-sm font-medium text-white bg-blue-600 border border-blue-600 hover:bg-blue-800 transition-colors">
            Sign up free
          </Link>
        </div>
      </div>
    </header>
  )
}
