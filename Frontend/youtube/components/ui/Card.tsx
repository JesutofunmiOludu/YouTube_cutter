'use client'

// src/components/ui/Card.tsx
import React from 'react'
import { cn } from '@/utils/cn'

export type CardVariant = 'default' | 'elevated' | 'metric' | 'featured'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:  CardVariant
  hoverable?: boolean
  padded?:    boolean
}

const cardVariants: Record<CardVariant, string> = {
  default:  'bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-lg',
  elevated: 'bg-[var(--color-bg-primary)] border border-[var(--color-border-secondary)] rounded-lg',
  metric:   'bg-[var(--color-bg-secondary)] rounded-md',
  featured: 'bg-[var(--color-bg-primary)] border-2 border-primary-200 rounded-lg',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', hoverable = false, padded = true, className, children, ...rest }, ref) => (
    <div ref={ref} className={cn(
      cardVariants[variant],
      padded    && 'p-5',
      hoverable && 'cursor-pointer transition-colors duration-fast hover:border-[var(--color-border-secondary)]',
      className,
    )} {...rest}>
      {children}
    </div>
  )
)
Card.displayName = 'Card'