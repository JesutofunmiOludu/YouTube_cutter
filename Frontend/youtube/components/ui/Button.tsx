'use client'

// src/components/ui/Button.tsx
import React, { forwardRef } from 'react'
import { Loader2 }           from 'lucide-react'
import { cn }                from '@/utils/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type ButtonSize    = 'sm' | 'md' | 'lg' | 'full'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant
  size?:     ButtonSize
  loading?:  boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
  as?: React.ElementType
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:   'bg-primary-600 text-white border border-primary-600 hover:bg-primary-800 hover:border-primary-800 active:scale-[0.98] disabled:bg-primary-200 disabled:border-primary-200 focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
  secondary: 'bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-border-primary)] active:scale-[0.98] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
  ghost:     'bg-transparent text-[var(--color-text-secondary)] border border-transparent hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] active:scale-[0.98] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
  danger:    'bg-transparent text-danger-800 border border-danger-200 hover:bg-danger-50 hover:border-danger-600 active:scale-[0.98] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-danger-200 focus-visible:ring-offset-2',
  success:   'bg-success-50 text-success-800 border border-success-200 hover:bg-success-200 hover:border-success-600 active:scale-[0.98] disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-success-200 focus-visible:ring-offset-2',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm:   'h-7 px-3 text-caption gap-1.5 rounded-md',
  md:   'h-9 px-4 text-body-sm gap-2 rounded-md',
  lg:   'h-11 px-5 text-body-md gap-2 rounded-lg',
  full: 'h-11 w-full px-5 text-body-md gap-2 rounded-lg',
}

const iconSize: Record<ButtonSize, string> = {
  sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-[18px] h-[18px]', full: 'w-[18px] h-[18px]',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading = false, leftIcon, rightIcon,
     fullWidth = false, as: Component = 'button', className, children, disabled,
     type = 'button', ...rest }, ref) => {
    const isDisabled  = disabled || loading
    const resolvedSize = fullWidth ? 'full' : size

    return (
      <Component
        ref={ref}
        type={Component === 'button' ? type : undefined}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center font-medium font-sans select-none whitespace-nowrap',
          'transition-all duration-fast outline-none focus-visible:outline-none',
          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          variantStyles[variant],
          sizeStyles[resolvedSize],
          className,
        )}
        {...rest}
      >
        {loading ? (
          <Loader2 className={cn('animate-spin shrink-0', iconSize[resolvedSize])} aria-hidden="true" />
        ) : leftIcon ? (
          <span className={cn('shrink-0', iconSize[resolvedSize])} aria-hidden="true">{leftIcon}</span>
        ) : null}
        {children && <span className={loading ? 'opacity-70' : undefined}>{children}</span>}
        {rightIcon && !loading && (
          <span className={cn('shrink-0', iconSize[resolvedSize])} aria-hidden="true">{rightIcon}</span>
        )}
      </Component>
    )
  }
)
Button.displayName = 'Button'

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string
  variant?:  ButtonVariant
  size?:     'sm' | 'md' | 'lg'
  loading?:  boolean
  icon:      React.ReactNode
}

const iconBtnSize: Record<'sm'|'md'|'lg', string> = { sm: 'w-7 h-7 rounded-md', md: 'w-9 h-9 rounded-md', lg: 'w-11 h-11 rounded-lg' }
const iconBtnIconSize: Record<'sm'|'md'|'lg', string> = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-[18px] h-[18px]' }

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 'aria-label': ariaLabel, variant = 'secondary', size = 'md', loading = false,
     icon, className, disabled, type = 'button', ...rest }, ref) => {
    const isDisabled = disabled || loading
    return (
      <button
        ref={ref} type={type} disabled={isDisabled}
        aria-label={ariaLabel} aria-disabled={isDisabled} aria-busy={loading}
        className={cn(
          'inline-flex items-center justify-center shrink-0 font-sans select-none',
          'transition-all duration-fast outline-none focus-visible:outline-none',
          isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
          variantStyles[variant], iconBtnSize[size], className,
        )}
        {...rest}
      >
        {loading
          ? <Loader2 className={cn('animate-spin', iconBtnIconSize[size])} aria-hidden="true" />
          : <span className={cn('shrink-0', iconBtnIconSize[size])} aria-hidden="true">{icon}</span>
        }
      </button>
    )
  }
)
IconButton.displayName = 'IconButton'