'use client'

// src/components/ui/Avatar.tsx
import React, { useState } from 'react'
import { cn }              from '@/utils/cn'

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?:    string | null
  name?:   string
  alt?:    string
  size?:   AvatarSize
  online?: boolean
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[9px]', sm: 'w-7 h-7 text-[10px]', md: 'w-8 h-8 text-[11px]',
  lg: 'w-10 h-10 text-[13px]', xl: 'w-12 h-12 text-[15px]',
}
const dotSize: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5 ring-1', sm: 'w-2 h-2 ring-1', md: 'w-2 h-2 ring-1',
  lg: 'w-2.5 h-2.5 ring-[1.5px]', xl: 'w-3 h-3 ring-2',
}

function getColour(name: string): string {
  const colours = ['bg-primary-50 text-primary-800', 'bg-success-50 text-success-800', 'bg-warning-50 text-warning-800', 'bg-premium-50 text-premium-800', 'bg-neutral-100 text-neutral-800']
  const idx = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return colours[idx % colours.length] as string
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '').toUpperCase()
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase()
}

export function Avatar({ src, name = '', alt, size = 'md', online = false, className, ...rest }: AvatarProps) {
  const [imgError, setImgError] = useState(false)
  const showImage  = src && !imgError
  const initials   = getInitials(name)
  const colourClass = getColour(name)

  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...rest}>
      <div
        className={cn(
          'rounded-full flex items-center justify-center overflow-hidden select-none font-medium font-sans',
          sizeStyles[size],
          !showImage && colourClass,
          showImage  && 'bg-[var(--color-bg-secondary)]',
        )}
        aria-label={alt ?? name ?? 'User avatar'}
        role={alt ?? name ? 'img' : undefined}
      >
        {showImage ? (
          <img src={src} alt={alt ?? name ?? 'User avatar'} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : initials ? (
          <span aria-hidden="true">{initials}</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-[55%] h-[55%] text-[var(--color-text-tertiary)]" aria-hidden="true">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
          </svg>
        )}
      </div>
      {online && <span className={cn('absolute bottom-0 right-0 rounded-full bg-success-600 ring-[var(--color-bg-primary)]', dotSize[size])} aria-label="Online" />}
    </div>
  )
}