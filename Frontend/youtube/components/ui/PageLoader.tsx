// ============================================================
// VidMind AI — PageLoader Component
// src/components/ui/PageLoader.tsx
//
// Full-page loading state used during route transitions
// and initial app hydration. Shows a branded loading screen.
// ============================================================

import React from 'react'
import { cn }     from '@/utils/cn'
import { Spinner } from './Spinner'

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
  <img
    src="/logo.png"
    alt="ClipMide"
    className="w-10 h-10 object-contain animate-pulse"
  />
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
