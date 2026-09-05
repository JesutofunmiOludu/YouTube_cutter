// ============================================================
// VidMind AI — Topbar
// components/layout/Topbar.tsx
//
// NOTE: No 'use client' — Pages Router project.
// ============================================================

import { useState, useRef, useEffect } from 'react'
import Link                             from 'next/link'
import { Bell, ChevronDown, Settings, CreditCard, LogOut, User } from 'lucide-react'
import { cn }                           from '@/utils/cn'
import { Avatar }                       from '@components/ui/Avatar'
import { clientNavigate }               from '@/hooks/useClientPathname'
import type { User as UserType }        from '@/types'

// ── User dropdown ────────────────────────────────────────

function UserMenu({ user, onSignOut }: { user?: UserType | null; onSignOut?: () => void }) {
  const [open, setOpen] = useState(false)
  const menuRef         = useRef<HTMLDivElement>(null)
  const fullName        = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()
  const isPremium       = user?.subscription_tier === 'premium'

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="User menu"
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 hover:bg-[var(--color-bg-secondary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
      >
        <Avatar src={user?.avatar_url} name={fullName} size="sm" />
        <ChevronDown className={cn('w-3.5 h-3.5 text-[var(--color-text-tertiary)] transition-transform duration-fast', open && 'rotate-180')} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1.5 z-dropdown w-52 bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg overflow-hidden animate-slide-up"
        >
          <div className="px-3 py-2.5 border-b border-[var(--color-border-tertiary)]">
            <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">{fullName || 'Account'}</p>
            <p className="text-caption text-[var(--color-text-tertiary)] truncate">{user?.email}</p>
            {isPremium && <span className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-premium-50 text-premium-800">Premium</span>}
          </div>
          <div className="py-1">
            {[
              { label: 'Profile',      icon: User,       href: '/settings'     },
              { label: 'Subscription', icon: CreditCard, href: '/pricing'      },
              { label: 'Settings',     icon: Settings,   href: '/settings'     },
            ].map((item) => (
              <button
                key={item.label}
                role="menuitem"
                onClick={() => { clientNavigate(item.href); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {item.label}
              </button>
            ))}
          </div>
          {onSignOut && (
            <div className="border-t border-[var(--color-border-tertiary)] py-1">
              <button
                role="menuitem"
                onClick={() => { onSignOut(); clientNavigate('/login'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-body-sm text-danger-800 hover:bg-danger-50 transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Topbar ───────────────────────────────────────────────

export interface TopbarProps {
  user?:      UserType | null
  onSignOut?: () => void
}

export function Topbar({ user, onSignOut }: TopbarProps) {
  return (
    <header className="flex items-center justify-between gap-3 h-[var(--topbar-height)] px-4 shrink-0 bg-[var(--color-bg-primary)] border-b border-[var(--color-border-tertiary)] sticky top-0 z-sticky">
      {/* Mobile Brand Header */}
      <Link href="/dashboard" className="md:hidden flex items-center gap-2 text-body-md font-semibold text-[var(--color-text-primary)] hover:opacity-80 transition-opacity">
        <img src="/logo.png" alt="ClipMide Logo" className="w-6 h-6 object-contain" />
        <span>ClipMide</span>
      </Link>

      <div className="flex items-center gap-1 shrink-0 ml-auto">
        <button
          aria-label="Notifications"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
        </button>
        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  )
}