'use client'

// src/components/ui/Badge.tsx
import React from 'react'
import { cn } from '@/utils/cn'
import type { ProcessingStatus } from '@/types'

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'premium' | 'info'
export type BadgeSize    = 'sm' | 'md'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?:    BadgeSize
  dot?:     boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-tertiary)]',
  primary: 'bg-primary-50 text-primary-800 border border-primary-100',
  success: 'bg-success-50 text-success-800 border border-success-200',
  warning: 'bg-warning-50 text-warning-800 border border-warning-200',
  danger:  'bg-danger-50  text-danger-800  border border-danger-200',
  premium: 'bg-premium-50 text-premium-800 border border-premium-200',
  info:    'bg-primary-50 text-primary-800 border border-primary-200',
}

const dotColours: Record<BadgeVariant, string> = {
  default: 'bg-neutral-400', primary: 'bg-primary-600', success: 'bg-success-600',
  warning: 'bg-warning-600', danger: 'bg-danger-600', premium: 'bg-premium-600', info: 'bg-primary-600',
}

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[10px] leading-4 px-1.5 py-0.5 gap-1',
  md: 'text-caption px-2 py-0.5 gap-1.5',
}

export function Badge({ variant = 'default', size = 'md', dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center font-medium font-sans rounded', variantStyles[variant], sizeStyles[size], className)} {...rest}>
      {dot && <span className={cn('rounded-full shrink-0 w-1.5 h-1.5', dotColours[variant])} aria-hidden="true" />}
      {children}
    </span>
  )
}

const statusVariantMap: Record<ProcessingStatus | 'all', BadgeVariant> = {
  pending: 'warning', processing: 'info', completed: 'success', failed: 'danger', all: 'default',
}
const statusLabelMap: Record<ProcessingStatus | 'all', string> = {
  pending: 'Pending', processing: 'Processing…', completed: 'Completed', failed: 'Failed', all: 'All',
}

export function StatusBadge({ status, children, ...rest }: Omit<BadgeProps, 'variant'> & { status: ProcessingStatus | 'all' }) {
  return <Badge variant={statusVariantMap[status]} dot {...rest}>{children ?? statusLabelMap[status]}</Badge>
}