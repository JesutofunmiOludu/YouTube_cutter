'use client'

// src/components/ui/Spinner.tsx
import React from 'react'
import { cn } from '@/utils/cn'

export type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl'

const sizeMap:   Record<SpinnerSize, number> = { sm: 14, md: 18, lg: 24, xl: 36 }
const colourMap: Record<'primary'|'white'|'muted', string> = {
  primary: 'text-primary-600', white: 'text-white', muted: 'text-[var(--color-text-tertiary)]',
}

export function Spinner({ size = 'md', label = 'Loading…', variant = 'primary' as 'primary'|'white'|'muted', className, ...rest }: {
  size?: SpinnerSize; label?: string; variant?: 'primary'|'white'|'muted'; className?: string
} & React.SVGAttributes<SVGElement>) {
  const px = sizeMap[size]
  const r  = (px - 4) / 2
  const cx = px / 2
  const circumference = 2 * Math.PI * r

  return (
    <svg width={px} height={px} viewBox={`0 0 ${px} ${px}`} fill="none" role="status" aria-label={label}
      className={cn('animate-spin shrink-0', colourMap[variant], className)} {...rest}>
      <circle cx={cx} cy={cx} r={r} stroke="currentColor" strokeWidth="2" opacity={0.2} />
      <circle cx={cx} cy={cx} r={r} stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={circumference * 0.75} />
    </svg>
  )
}

export function PageSpinner({ label = 'Loading…', minHeight = '200px' }: { label?: string; minHeight?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full" style={{ minHeight }} role="status" aria-label={label}>
      <Spinner size="lg" />
      <p className="text-caption text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  )
}