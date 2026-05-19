// ============================================================
// VidMind AI — AuthLayout Component
// src/components/layout/AuthLayout.tsx
//
// Centred layout for Login and Register pages.
// No sidebar, no topbar — clean focused auth experience.
// ============================================================

import React    from 'react'
import Link from 'next/link'
import { cn }   from '@/utils/cn'

// ------------------------------------------------------------
// LOGO MARK
// ------------------------------------------------------------

const LogoMark: React.FC = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5"/>
    <path d="M12 29h8M16 23v6" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 9l9 4.5-9 4.5V9z" fill="#185FA5"/>
  </svg>
)

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface AuthLayoutProps {
  children: React.ReactNode
  maxWidth?: string
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const AuthLayout: React.FC<AuthLayoutProps> = ({
  children,
  maxWidth = '420px',
}) => (
  <div
    className={cn(
      'min-h-dvh w-full',
      'flex flex-col items-center justify-center',
      'bg-[var(--color-bg-tertiary)]',
      'px-4 py-10',
    )}
  >
    {/* Logo */}
    <Link
      href="/"
      className={cn(
        'flex items-center gap-2 mb-8',
        'text-heading-sm text-[var(--color-text-primary)]',
        'hover:opacity-80 transition-opacity duration-fast',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-primary-200 focus-visible:ring-offset-2',
        'rounded-md',
      )}
      aria-label="VidMind AI — go to home"
    >
      <LogoMark />
      <span className="font-medium">VidMind AI</span>
    </Link>

    {/* Card */}
    <div
      className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden"
      style={{ maxWidth }}
    >
      {children}
    </div>

    {/* Footer */}
    <p className="mt-6 text-caption text-[var(--color-text-tertiary)] text-center">
      © {new Date().getFullYear()} VidMind AI. All rights reserved.
    </p>
  </div>
)

AuthLayout.displayName = 'AuthLayout'

export default AuthLayout
