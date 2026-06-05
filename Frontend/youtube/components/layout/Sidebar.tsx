'use client'

// ============================================================
// VidMind AI — Sidebar
// src/components/layout/Sidebar.tsx
// ============================================================

import Link                    from 'next/link'
import { useRouter } from 'next/router'
import {
  LayoutDashboard, PlaySquare, Search,
  Globe, FileText, Settings, LogOut,
} from 'lucide-react'
import { cn }        from '@/utils/cn'
import { Avatar }    from '@/components/ui/Avatar'
import { Tooltip }   from '@components/ui/Tooltip'
import type { User } from '@/types'

// ── Logo ─────────────────────────────────────────────────

function LogoMark({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5 shrink-0 px-2 py-4', collapsed && 'justify-center')}>
      {!collapsed ? (
        <span className="text-body-md font-bold text-primary-600 whitespace-nowrap">
          Video Dashboard
        </span>
      ) : (
        <span className="text-body-md font-bold text-primary-600 whitespace-nowrap">
          VD
        </span>
      )}
    </div>
  )
}

// ── Nav items ────────────────────────────────────────────

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects',  href: '/dashboard', icon: PlaySquare      },
  { label: 'Searches',  href: '/search',   icon: Search          },
  { label: 'Research',  href: '/research',  icon: Globe           },
  { label: 'Reports',   href: '/reports',   icon: FileText        },
]

function NavItem({
  href, label, icon: Icon, collapsed,
}: {
  href:      string
  label:     string
  icon:      React.FC<{ className?: string }>
  collapsed: boolean
}) {
  const { pathname } = useRouter()
  // Active if exact match or starts with path (except /dashboard so we don't accidentally match others)
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  const linkEl = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 font-medium text-body-sm transition-all duration-fast outline-none',
        collapsed ? 'w-10 h-10 justify-center mx-auto rounded-md' : 'px-4 py-2.5 w-full',
        isActive
          ? 'bg-primary-50 text-primary-600 border-l-[3px] border-primary-600'
          : 'text-[var(--color-text-secondary)] hover:bg-slate-50 hover:text-[var(--color-text-primary)] border-l-[3px] border-transparent',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary-600" : "text-[var(--color-text-tertiary)]")} aria-hidden="true" />
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
  // For the design mockup, we are hardcoding the user info to match the image exactly if no user is provided, 
  // but using dynamic if available. The image shows Alex Rivers, Editor Pro.
  const fullName  = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Alex Rivers'
  const role      = user ? (user.subscription_tier === 'premium' ? 'Premium' : 'Free plan') : 'Editor Pro'
  const avatarUrl = user?.avatar_url || 'https://i.pravatar.cc/150?u=alex'

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full bg-white border-r border-[var(--color-border-tertiary)] transition-[width] duration-base',
        collapsed ? 'w-[var(--sidebar-collapsed)]' : 'w-[var(--sidebar-width)]',
      )}
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center shrink-0 pt-2',
        collapsed ? 'justify-center px-0' : 'px-4',
      )}>
        <Link
          href="/dashboard"
          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 w-full"
          aria-label="Go to dashboard"
        >
          <LogoMark collapsed={collapsed} />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.label} {...item} collapsed={collapsed} />
        ))}
      </nav>

      {/* User footer */}
      <div className="shrink-0 p-4">
        {collapsed ? (
          <Tooltip content={fullName} placement="right">
            <Link
              href="/settings"
              className={cn(
                'w-10 h-10 rounded-lg mx-auto flex items-center justify-center',
                'bg-slate-50 hover:bg-slate-100 transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
              )}
              aria-label="Go to settings"
            >
              <Avatar src={avatarUrl} name={fullName} size="sm" />
            </Link>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors duration-fast cursor-pointer">
            <Avatar src={avatarUrl} name={fullName} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-[var(--color-text-primary)] truncate">
                {fullName}
              </p>
              <p className="text-caption text-[var(--color-text-tertiary)] truncate">
                {role}
              </p>
            </div>
            {onSignOut && (
              <Tooltip content="Sign out" placement="top">
                <button
                  onClick={onSignOut}
                  aria-label="Sign out"
                  className={cn(
                    'shrink-0 w-7 h-7 rounded flex items-center justify-center',
                    'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]',
                    'transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
                  )}
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}