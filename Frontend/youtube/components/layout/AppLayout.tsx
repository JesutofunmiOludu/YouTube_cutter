// ============================================================
// VidMind AI — AuthLayout
// src/components/layout/AuthLayout.tsx
//
// Server Component — no interactivity, just layout.
// Used by app/(auth)/login/page.tsx etc.
// ============================================================

import Link from 'next/link'
import { cn } from '@/utils/cn'

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5"/>
      <path d="M12 29h8M16 23v6" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 9l9 4.5-9 4.5V9z" fill="#185FA5"/>
    </svg>
  )
}

export interface AuthLayoutProps {
  children:  React.ReactNode
  maxWidth?: string
}

export function AuthLayout({ children, maxWidth = '420px' }: AuthLayoutProps) {
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-[var(--color-bg-tertiary)] px-4 py-10">
      <Link
        href="/"
        className="flex items-center gap-2 mb-8 text-heading-sm font-medium text-[var(--color-text-primary)] hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 rounded-md"
        aria-label="VidMind AI — go to home"
      >
        <LogoMark />
        VidMind AI
      </Link>

      <div
        className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden"
        style={{ maxWidth }}
      >
        {children}
      </div>

      <p className="mt-6 text-caption text-[var(--color-text-tertiary)] text-center">
        © {new Date().getFullYear()} VidMind AI. All rights reserved.
      </p>
    </div>
  )
}