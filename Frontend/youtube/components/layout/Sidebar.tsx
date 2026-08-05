// ============================================================
// VidMind AI — Sidebar
// components/layout/Sidebar.tsx
//
// No 'use client' — Pages Router project.
// No useRouter() at module/render level — see hooks/useClientPathname.ts
// ============================================================

import Link                      from 'next/link'
import {
  LayoutDashboard, PlaySquare, Search,
  Globe, MessageSquare, LogOut, Crown, Zap, FolderOpen,
} from 'lucide-react'
import { cn }                    from '@/utils/cn'
import { Avatar }                from '@/components/ui/Avatar'
import { Tooltip }               from '@components/ui/Tooltip'
import { useClientPathname }     from '@/hooks/useClientPathname'
import { useSubscription }       from '@/hooks/useSubscription'
import type { User }             from '@/types'

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
  { label: 'Projects',  href: '/projects',  icon: FolderOpen      },
  { label: 'Chat',      href: '/chat',      icon: MessageSquare   },
  { label: 'Research',  href: '/research',  icon: Globe           },
  { label: 'Searches',  href: '/search',    icon: Search          },
]

function NavItem({
  href, label, icon: Icon, collapsed,
}: {
  href:      string
  label:     string
  icon:      React.FC<{ className?: string }>
  collapsed: boolean
}) {
  // useClientPathname reads window.location.pathname after mount.
  // This avoids any dependency on RouterContext (next/router),
  // which can be split into two copies by Webpack due to Windows
  // path-casing differences between the shell CWD and the actual
  // folder name on disk.
  const pathname = useClientPathname()
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
  const fullName  = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Alex Rivers'
  const avatarUrl = user?.avatar_url || 'https://i.pravatar.cc/150?u=alex'
  const { isPremium } = useSubscription()
  const role = isPremium ? 'Premium' : 'Free plan'

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

      {/* Premium CTA — free users only */}
      {!collapsed && !isPremium && (
        <div className="px-3 pb-2">
          <Link
            href="/pricing"
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2.5 rounded-lg',
              'bg-gradient-to-r from-amber-50 to-orange-50',
              'border border-amber-200 hover:border-amber-300',
              'transition-colors duration-fast group/premium',
            )}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
              <Crown className="w-3 h-3 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-amber-800 leading-tight">Go Premium</p>
              <p className="text-[10px] text-amber-600">Unlimited everything</p>
            </div>
            <Zap className="w-3.5 h-3.5 text-amber-500 group-hover/premium:text-amber-700 transition-colors shrink-0" aria-hidden="true" />
          </Link>
        </div>
      )}
      {collapsed && !isPremium && (
        <Tooltip content="Go Premium" placement="right">
          <Link
            href="/pricing"
            className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors mb-1"
            aria-label="Go to pricing"
          >
            <Crown className="w-4 h-4 text-amber-500" aria-hidden="true" />
          </Link>
        </Tooltip>
      )}

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
              <p className="text-caption text-[var(--color-text-tertiary)] truncate flex items-center gap-1">
                {isPremium && (
                  <Crown className="w-2.5 h-2.5 text-amber-500 shrink-0" aria-hidden="true" />
                )}
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