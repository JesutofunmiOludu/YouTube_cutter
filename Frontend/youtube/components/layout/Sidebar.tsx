import { useState } from 'react'
import Link                      from 'next/link'
import {
  LayoutDashboard, Search,
  Globe, MessageSquare, LogOut, Crown, Zap, FolderOpen,
  PanelLeft,
} from 'lucide-react'
import { cn }                    from '@/utils/cn'
import { Avatar }                from '@/components/ui/Avatar'
import { Tooltip }               from '@components/ui/Tooltip'
import { useClientPathname }     from '@/hooks/useClientPathname'
import { useSubscription }       from '@/hooks/useSubscription'
import type { User }             from '@/types'

// ── Logo / Collapse toggle ────────────────────────────────

function LogoMark({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const [hovered, setHovered] = useState(false)

  if (collapsed) {
    // Collapsed: show real logo icon; on hover show panel-expand icon
    return (
      <Tooltip content="Expand sidebar" placement="right">
        <button
          type="button"
          onClick={onToggle}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Expand sidebar"
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-lg mx-auto',
            'text-primary-600 hover:bg-primary-50 transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
          )}
        >
          {hovered ? (
            <PanelLeft className="w-5 h-5" aria-hidden="true" />
          ) : (
            <img src="/logo.png" alt="ClipMide" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'contain' }} />
          )}
        </button>
      </Tooltip>
    )
  }

  // Expanded: logo image + "ClipMide" text + panel-collapse icon on the right
  return (
    <div className="flex items-center justify-between w-full gap-2">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
        aria-label="Go to dashboard"
      >
        <img src="/logo.png" alt="ClipMide logo" width={28} height={28} style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <span className="text-body-md font-bold text-primary-600 whitespace-nowrap select-none">
          ClipMide
        </span>
      </Link>

      <button
        type="button"
        onClick={onToggle}
        aria-label="Collapse sidebar"
        className={cn(
          'w-8 h-8 flex items-center justify-center rounded-lg shrink-0',
          'text-[var(--color-text-tertiary)] hover:text-primary-600 hover:bg-primary-50',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        )}
      >
        <PanelLeft className="w-4 h-4" aria-hidden="true" />
      </button>
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
  const pathname = useClientPathname()
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'))

  if (collapsed) {
    return (
      <div className="relative group flex justify-center">
        <Link
          href={href}
          className={cn(
            'w-10 h-10 flex items-center justify-center rounded-md',
            'transition-all duration-fast outline-none',
            isActive
              ? 'bg-primary-50 text-primary-600'
              : 'text-[var(--color-text-tertiary)] hover:bg-slate-50 hover:text-[var(--color-text-primary)]',
          )}
          aria-current={isActive ? 'page' : undefined}
          aria-label={label}
        >
          <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-600' : '')} aria-hidden="true" />
        </Link>

        {/* Hover label — appears to the right */}
        <span
          className={cn(
            'pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[9999]',
            'px-2.5 py-1.5 rounded-md text-caption font-medium whitespace-nowrap',
            'bg-[var(--color-neutral-900)] text-[var(--color-bg-primary)]',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-150',
            'shadow-lg',
          )}
        >
          {label}
        </span>
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 font-medium text-body-sm transition-all duration-fast outline-none',
        'px-4 py-2.5 w-full',
        isActive
          ? 'bg-primary-50 text-primary-600 border-l-[3px] border-primary-600'
          : 'text-[var(--color-text-secondary)] hover:bg-slate-50 hover:text-[var(--color-text-primary)] border-l-[3px] border-transparent',
      )}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-600' : 'text-[var(--color-text-tertiary)]')} aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  )
}


// ── Props ─────────────────────────────────────────────────

export interface SidebarProps {
  user?:      User | null
  collapsed?: boolean
  onToggle?:  () => void
  onSignOut?: () => void
}

// ── Component ────────────────────────────────────────────

export function Sidebar({ user, collapsed = false, onToggle, onSignOut }: SidebarProps) {
  const fullName  = user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() : 'Alex Rivers'
  const avatarUrl = user?.avatar_url || 'https://i.pravatar.cc/150?u=alex'
  const { isPremium } = useSubscription()
  const role = isPremium ? 'Premium' : 'Free plan'

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-full bg-white border-r border-[var(--color-border-tertiary)] transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-[var(--sidebar-collapsed)] overflow-visible' : 'w-[var(--sidebar-width)] overflow-hidden',
      )}
      aria-label="Main navigation"
    >
      {/* Logo + collapse toggle */}
      <div className={cn(
        'flex items-center shrink-0 pt-2 pb-1',
        collapsed ? 'justify-center px-0 py-3' : 'px-4',
      )}>
        <LogoMark collapsed={collapsed} onToggle={onToggle ?? (() => {})} />
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-6 flex flex-col gap-1', collapsed ? 'overflow-visible' : 'overflow-y-auto')}>

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