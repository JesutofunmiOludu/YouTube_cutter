// src/components/home/HomeNav.tsx — Server Component
import Link  from 'next/link'

export function HomeNav() {
  return (
    <header className="sticky top-0 z-sticky bg-white backdrop-blur-sm border-b border-gray-300">
      <div className="max-w-content mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-heading-sm font-bold text-primary-600 hover:opacity-80 transition-opacity rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
        >
          <img src="/logo.png" alt="ClipMide logo" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'contain' }} />
          ClipMide
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {['Features', 'Pricing'].map((item) => (
            <Link key={item} href={`/${item.toLowerCase()}`}
              className="text-body-sm text-gray-700 hover:text-gray-900 transition-colors">
              {item}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="hidden sm:inline-flex items-center h-9 px-4 rounded-md text-body-sm font-medium text-gray-900 border border-gray-400 hover:bg-gray-50 transition-colors">
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