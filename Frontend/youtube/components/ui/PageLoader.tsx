// ============================================================
// VidMind AI — PageLoader Component
// src/components/ui/PageLoader.tsx
//
// Full-page loading state used during route transitions
// and initial app hydration. Shows a branded loading screen.
// ============================================================

import React from 'react'
import { cn }     from '@/utils/cn'
import Spinner    from './Spinner'

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface PageLoaderProps {
  /** Loading message shown below the spinner */
  message?:   string
  /** Show the VidMind AI logo mark above the spinner */
  showLogo?:  boolean
  /** Override the min-height (defaults to fill screen) */
  minHeight?: string
  className?: string
}

// ------------------------------------------------------------
// LOGO MARK SVG
// ------------------------------------------------------------

const LogoMark: React.FC = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
  >
    <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5"/>
    <path d="M12 29h8M16 23v6" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M11 9l9 4.5-9 4.5V9z" fill="#185FA5"/>
  </svg>
)

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const PageLoader: React.FC<PageLoaderProps> = ({
  message   = 'Loading…',
  showLogo  = true,
  minHeight = '100dvh',
  className,
}) => (
  <div
    role="status"
    aria-label={message}
    className={cn(
      'flex flex-col items-center justify-center gap-4',
      'w-full bg-[var(--color-bg-tertiary)]',
      className,
    )}
    style={{ minHeight }}
  >
    {showLogo && (
      <div className="mb-1 animate-pulse">
        <LogoMark />
      </div>
    )}

    <Spinner size="lg" variant="primary" label={message} />

    <p className="text-caption text-[var(--color-text-tertiary)] animate-pulse">
      {message}
    </p>
  </div>
)

PageLoader.displayName = 'PageLoader'

export default PageLoader


// ============================================================
// ROUTE LOADER — lightweight inline loader for Suspense
// Used as the fallback for React.lazy() route components.
// ============================================================

export const RouteLoader: React.FC = () => (
  <PageLoader
    message="Loading page…"
    showLogo={false}
    minHeight="calc(100dvh - 52px)"
  />
)

RouteLoader.displayName = 'RouteLoader'
