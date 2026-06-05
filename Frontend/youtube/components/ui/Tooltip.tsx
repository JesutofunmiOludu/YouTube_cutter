'use client'

// src/components/ui/Tooltip.tsx
import React, { useState, useId, useRef } from 'react'
import { cn }                              from '@/utils/cn'

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps {
  content:    React.ReactNode
  children:   React.ReactElement
  placement?: TooltipPlacement
  delay?:     number
  disabled?:  boolean
  className?: string
}

const placementStyles: Record<TooltipPlacement, { container: string }> = {
  top:    { container: 'bottom-full left-1/2 -translate-x-1/2 mb-2' },
  bottom: { container: 'top-full left-1/2 -translate-x-1/2 mt-2'   },
  left:   { container: 'right-full top-1/2 -translate-y-1/2 mr-2'  },
  right:  { container: 'left-full top-1/2 -translate-y-1/2 ml-2'   },
}

export function Tooltip({ content, children, placement = 'top', delay = 300, disabled = false, className }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const tooltipId             = useId()
  const timer                 = useRef<ReturnType<typeof setTimeout> | null>(null)

  if (disabled) return children

  const show = () => { timer.current = setTimeout(() => setVisible(true), delay) }
  const hide = () => { if (timer.current) clearTimeout(timer.current); setVisible(false) }

  const trigger = React.cloneElement(children as React.ReactElement<any>, {
    'aria-describedby': visible ? tooltipId : undefined,
    onMouseEnter: (e: React.MouseEvent) => { show(); (children as any).props.onMouseEnter?.(e) },
    onMouseLeave: (e: React.MouseEvent) => { hide(); (children as any).props.onMouseLeave?.(e) },
    onFocus:      (e: React.FocusEvent) => { show(); (children as any).props.onFocus?.(e)      },
    onBlur:       (e: React.FocusEvent) => { hide(); (children as any).props.onBlur?.(e)       },
  })

  return (
    <div className="relative inline-flex">
      {trigger}
      {visible && (
        <div id={tooltipId} role="tooltip" className={cn('absolute z-tooltip pointer-events-none whitespace-nowrap', placementStyles[placement].container)}>
          <div className={cn(
            'px-2.5 py-1.5 text-caption font-medium rounded-md border animate-fade-in',
            'text-[var(--color-bg-primary)] bg-[var(--color-neutral-900)]',
            'border-[var(--color-border-primary)]',
            className,
          )}>
            {content}
          </div>
        </div>
      )}
    </div>
  )
}