'use client'

// ============================================================
// VidMind AI — Sidebar
// src/components/layout/Sidebar.tsx
// ============================================================

import Link                    from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Library, MessageSquare,
  Globe, Settings, Crown, LogOut,
} from 'lucide-react'
import { cn }        from '@/utils/cn'
import { Avatar }    from '@components/ui/Avatar'
import { Tooltip }   from '@components/ui/Tooltip'
import type { User } from '@/types'

// ── Logo ─────────────────────────────────────────────────

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 shrink-0', collapsed && 'justify-center')}>
      <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="shrink-0">
        <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#185FA5" strokeWidth="1.5"/>
        <path d="M12 29h8M16 23v6" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M11 9l9 4.5-9 4.5V9z" fill="#185FA5"/>
      </svg>
      {!collapsed && (
        <span className="text-heading-sm font-medium text-[var(--color-text-primary)] whitespace-nowrap">
          VidMind AI
        </span>
      )}
    </div>
  )
}

// ── Nav items ────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',     href: '/dashboard', icon: LayoutDashboard },
      { label: 'Video library', href: '/library',   icon: Library         },
      { label: 'Chat',          href: '/chat',       icon: MessageSquare   },
      { label: 'Deep research', href: '/research',   icon: Globe           },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Upgrade',  href: '/pricing',  icon: Crown    },
    ],
  },
]

function NavItem({
  href, label, icon: Icon, collapsed,
}: {
  href:      string
  label:     string
  icon:      React.FC<{ className?: string }>
  collapsed: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  const linkEl = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md font-medium text-body-sm',
        'transition-colors duration-fast outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary-200',
        collapsed ? 'w-9 h-9 justify-center mx-auto' : 'px-3 py-2 w-full',
        isActive
          ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-secondary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-text-primary)] border border-transparent',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={label} placement="right">
        {linkEl}
      </Tooltip>
    )
  }
  return linkEl
}

// ── Props ─────────────────────────────────────────────────

export interface SidebarProps {
  user?:      User | null
  collapsed?: boolean
  onSignOut?: () => void
}

// ── Component ────────────────────────────────────────────

export function Sidebar({ user, collapsed = false, onSignOut }: SidebarProps) {
  const router    = useRouter()
  const isPremium = user?.subscription_tier === 'premium'
  const fullName  = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full',
        'bg-[var(--color-bg-secondary)]',
        'border-r border-[var(--color-border-tertiary)]',
        'transition-[width] duration-base',
        collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 border-b border-[var(--color-border-tertiary)]',
        'h-[var(--topbar-height)]',
        collapsed ? 'justify-center px-0' : 'px-4',
      )}>
        <Link
          href="/dashboard"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
          aria-label="Go to dashboard"
        >
          <LogoMark collapsed={collapsed} />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            {section.label && !collapsed && (
              <p className="text-label text-[var(--color-text-tertiary)] px-3 py-1 uppercase tracking-wider">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavItem key={item.href} {...item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 border-t border-[var(--color-border-tertiary)] p-2">
        {collapsed ? (
          <Tooltip content={user?.first_name ?? 'Account'} placement="right">
            <Link
              href="/settings"
              className={cn(
                'w-9 h-9 rounded-md mx-auto flex items-center justify-center',
                'hover:bg-[var(--color-bg-primary)] transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
              )}
              aria-label="Go to settings"
            >
              <Avatar src={user?.avatar_url} name={fullName} size="sm" />
            </Link>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
            <Avatar src={user?.avatar_url} name={fullName} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">
                {fullName || 'Account'}
              </p>
              <p className="text-caption text-[var(--color-text-tertiary)] truncate">
                {isPremium
                  ? <span className="text-premium-800 font-medium">Premium</span>
                  : 'Free plan'}
              </p>
            </div>
            {onSignOut && (
              <Tooltip content="Sign out" placement="top">
                <button
                  onClick={onSignOut}
                  aria-label="Sign out"
                  className={cn(
                    'shrink-0 w-7 h-7 rounded flex items-center justify-center',
                    'text-[var(--color-text-tertiary)]',
                    'hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]',
                    'transition-colors duration-fast',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
                  )}
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}