// src/components/home/HomeFooter.tsx — Server Component
import Link from 'next/link'

export function HomeFooter() {
  return (
    <footer className="border-t border-[var(--color-border-tertiary)] py-8 px-6">
      <div className="max-w-content mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-body-sm font-medium text-[var(--color-text-secondary)]">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5"/>
            <path d="M12 29h8M16 23v6" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M11 9l9 4.5-9 4.5V9z" fill="#185FA5"/>
          </svg>
          VidMind AI
        </div>
        <p className="text-caption text-[var(--color-text-tertiary)]">
          © {new Date().getFullYear()} VidMind AI. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          {['Privacy', 'Terms', 'Contact'].map((link) => (
            <Link key={link} href={`/${link.toLowerCase()}`}
              className="text-caption text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors">
              {link}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
