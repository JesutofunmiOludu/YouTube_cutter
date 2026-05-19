'use client'

// ============================================================
// VidMind AI — MobileNav
// src/components/layout/MobileNav.tsx
// ============================================================

import Link                from 'next/link'
import { usePathname }     from 'next/navigation'
import { LayoutDashboard, Library, MessageSquare, Globe, User } from 'lucide-react'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { label: 'Home',     href: '/dashboard', icon: LayoutDashboard },
  { label: 'Library',  href: '/library',   icon: Library         },
  { label: 'Chat',     href: '/chat',       icon: MessageSquare   },
  { label: 'Research', href: '/research',   icon: Globe           },
  { label: 'Profile',  href: '/settings',  icon: User            },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'md:hidden flex items-center',
        'fixed bottom-0 left-0 right-0 z-sticky',
        'bg-[var(--color-bg-primary)] border-t border-[var(--color-border-tertiary)]',
        'pb-[env(safe-area-inset-bottom)]',
        'h-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom))]',
      )}
      aria-label="Mobile navigation"
    >
      {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 h-full',
              'transition-colors duration-fast',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-200',
              isActive ? 'text-primary-600' : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]',
            )}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className={cn('w-5 h-5 transition-transform duration-fast', isActive && 'scale-110')} aria-hidden="true" />
            <span className={cn('text-[10px] font-medium leading-none transition-opacity duration-fast', isActive ? 'opacity-100' : 'opacity-0')}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}