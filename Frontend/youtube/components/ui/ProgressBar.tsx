'use client'

// src/components/ui/ProgressBar.tsx
import React from 'react'
import { cn } from '@/utils/cn'

export type ProgressBarVariant = 'default' | 'usage' | 'success' | 'warning' | 'danger'

function getFillColour(variant: ProgressBarVariant, pct: number): string {
  if (variant === 'usage') {
    if (pct >= 85) return 'bg-danger-600'
    if (pct >= 60) return 'bg-warning-200'
    return 'bg-primary-600'
  }
  const map: Record<ProgressBarVariant, string> = {
    default: 'bg-primary-600', usage: 'bg-primary-600', success: 'bg-success-200',
    warning: 'bg-warning-200', danger: 'bg-danger-600',
  }
  return map[variant]
}

export function ProgressBar({ value, max = 100, variant = 'default', size = 'sm' as 'xs'|'sm'|'md',
  showLabel = false, label, 'aria-label': ariaLabel, className, ...rest }: {
  value: number; max?: number; variant?: ProgressBarVariant; size?: 'xs'|'sm'|'md';
  showLabel?: boolean; label?: string; 'aria-label'?: string; className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const clamped    = Math.min(Math.max(value, 0), max)
  const pct        = max > 0 ? Math.round((clamped / max) * 100) : 0
  const fillColour = getFillColour(variant, pct)
  const autoLabel  = label ?? `${pct}%`
  const sizeH      = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' }[size]

  return (
    <div className={cn('flex flex-col gap-1', className)} {...rest}>
      <div role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={max}
        aria-label={ariaLabel ?? autoLabel}
        className={cn('w-full rounded-full overflow-hidden bg-[var(--color-border-tertiary)]', sizeH)}>
        <div className={cn('h-full rounded-full transition-[width] duration-slow ease-out', fillColour)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <p className="text-caption text-[var(--color-text-tertiary)] tabular-nums">{autoLabel}</p>}
    </div>
  )
}

export function UsageMeter({ label, used, limit, unlimited = false, className }: {
  label: string; used: number; limit: number; unlimited?: boolean; className?: string
}) {
  if (unlimited) {
    return (
      <div className={cn('flex items-center justify-between text-caption', className)}>
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className="text-success-800 font-medium">Unlimited</span>
      </div>
    )
  }
  const pct = limit > 0 ? Math.round((used / limit) * 100) : 0
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-caption">
        <span className="text-[var(--color-text-secondary)]">{label}</span>
        <span className={cn('font-medium tabular-nums',
          pct >= 100 ? 'text-danger-800' : pct >= 60 ? 'text-warning-800' : 'text-[var(--color-text-secondary)]')}>
          {used} / {limit}
        </span>
      </div>
      <ProgressBar value={used} max={limit} variant="usage" size="xs" aria-label={`${label}: ${used} of ${limit} used`} />
    </div>
  )
}