// ============================================================
// VidMind AI — LandingLayout Component
// src/components/layout/LandingLayout.tsx
//
// Shell layout for unauthenticated marketing pages (Home,
// Pricing, About, etc.). Provides sticky nav + footer so
// page files only need to render their own content.
// ============================================================

import React from 'react'
import { HomeNav }    from '@/components/home/HomeNav'
import { HomeFooter } from '@/components/home/HomeFooter'

export interface LandingLayoutProps {
  children: React.ReactNode
}

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg-tertiary)]">
      <HomeNav />
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <HomeFooter />
    </div>
  )
}

export default LandingLayout
