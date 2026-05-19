'use client'

// ============================================================
// VidMind AI — AppShell
// src/components/layout/AppShell.tsx
//
// Client component that composes Sidebar + Topbar + content.
// Used by app/(app)/layout.tsx.
// Must be 'use client' because it reads from the auth store
// and manages sidebar collapsed state.
// ============================================================

import { useState, useEffect }  from 'react'
import { useAuthStore }         from '@/store/auth.store'
import { Sidebar }              from './Sidebar'
import { Topbar }               from './Topbar'
import { MobileNav }            from './MobileNav'
import { cn }                   from '@/utils/cn'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, clearAuth }        = useAuthStore()
  const [collapsed, setCollapsed]  = useState(false)

  // Auto-collapse on tablet
  useEffect(() => {
    const mq      = window.matchMedia('(max-width: 1023px)')
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', handler)
    setCollapsed(mq.matches)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-bg-tertiary)]">
      {/* Sidebar — hidden on mobile */}
      <Sidebar
        user={user}
        collapsed={collapsed}
        onSignOut={clearAuth}
      />

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar user={user} onSignOut={clearAuth} />

        <main
          id="main-content"
          tabIndex={-1}
          className={cn(
            'flex-1 overflow-y-auto p-5',
            // Extra bottom padding on mobile for MobileNav
            'pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))] md:pb-5',
          )}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <MobileNav />
    </div>
  )
}