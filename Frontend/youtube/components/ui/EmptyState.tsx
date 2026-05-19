'use client'

// src/components/ui/EmptyState.tsx
import React from 'react'
import { cn }    from '@/utils/cn'
import { Button } from './Button'

export interface EmptyStateAction { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?:             React.ReactNode
  title:             string
  description?:      string
  action?:           EmptyStateAction
  secondaryAction?:  EmptyStateAction
  minHeight?:        string
}

export const EmptyIcons = {
  video: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="2" y="8" width="36" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M16 15l10 5-10 5V15z" fill="currentColor" opacity=".4"/>
    </svg>
  ),
  search: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="18" cy="18" r="11" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M26 26l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M13 18h10M18 13v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
  chat: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M5 30V8a3 3 0 013-3h24a3 3 0 013 3v16a3 3 0 01-3 3H12L5 35V30z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M12 15h16M12 21h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
  research: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M20 5a15 15 0 010 30" stroke="currentColor" strokeWidth="1.5" opacity=".3"/>
      <path d="M5 20h30" stroke="currentColor" strokeWidth="1.5" opacity=".3"/>
      <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  generic: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <rect x="6" y="6" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 20h14M20 13v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".4"/>
    </svg>
  ),
}

export function EmptyState({ icon, title, description, action, secondaryAction,
  minHeight = '200px', className, ...rest }: EmptyStateProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center text-center px-6 py-8 w-full', className)}
      style={{ minHeight }} {...rest}>
      {icon && <div className="text-[var(--color-text-tertiary)] mb-4" aria-hidden="true">{icon}</div>}
      <h3 className="text-heading-sm text-[var(--color-text-primary)] mb-1.5">{title}</h3>
      {description && <p className="text-body-sm text-[var(--color-text-secondary)] max-w-xs mb-5">{description}</p>}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {action && <Button variant={action.variant ?? 'primary'} size="md" onClick={action.onClick}>{action.label}</Button>}
          {secondaryAction && <Button variant={secondaryAction.variant ?? 'secondary'} size="md" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
        </div>
      )}
    </div>
  )
}