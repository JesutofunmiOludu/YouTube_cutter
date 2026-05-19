'use client'

// src/components/ui/Input.tsx
import React, { forwardRef, useId } from 'react'
import { cn }                       from '@/utils/cn'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?:      string
  helperText?: string
  error?:      string
  leftIcon?:   React.ReactNode
  rightIcon?:  React.ReactNode
  showCount?:  boolean
  inputSize?:  'sm' | 'md' | 'lg'
  fullWidth?:  boolean
}

const inputSizeStyles = { sm: 'h-8 px-3 text-caption', md: 'h-9 px-3 text-body-sm', lg: 'h-11 px-4 text-body-md' }
const iconPadL = { sm: 'pl-8', md: 'pl-9', lg: 'pl-10' }
const iconPadR = { sm: 'pr-8', md: 'pr-9', lg: 'pr-10' }

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightIcon, showCount = false,
     inputSize = 'md', fullWidth = true, className, id, maxLength,
     value, defaultValue, disabled, required, ...rest }, ref) => {
    const generatedId = useId()
    const inputId     = id ?? generatedId
    const hasError    = Boolean(error)
    const charCount   = typeof value === 'string' ? value.length : 0

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className={cn('text-label text-[var(--color-text-secondary)]', disabled && 'opacity-50')}>
            {label}
            {required && <span className="text-danger-800 ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className={cn('absolute left-3 flex items-center justify-center text-[var(--color-text-tertiary)] pointer-events-none', inputSize === 'sm' && 'w-3.5 h-3.5', inputSize === 'md' && 'w-4 h-4', inputSize === 'lg' && 'w-[18px] h-[18px]')} aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref} id={inputId} disabled={disabled} required={required}
            maxLength={maxLength} value={value} defaultValue={defaultValue}
            aria-invalid={hasError}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              'w-full font-sans rounded-md bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]',
              'placeholder:text-[var(--color-text-tertiary)] transition-colors duration-fast outline-none',
              'border border-[var(--color-border-secondary)]',
              'hover:border-[var(--color-border-primary)]',
              'focus:border-primary-400 focus:ring-2 focus:ring-primary-200 focus:ring-offset-0',
              hasError && 'border-danger-200 hover:border-danger-600 focus:border-danger-600 focus:ring-danger-200',
              disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]',
              inputSizeStyles[inputSize],
              leftIcon  && iconPadL[inputSize],
              rightIcon && iconPadR[inputSize],
              className,
            )}
            {...rest}
          />
          {rightIcon && (
            <span className={cn('absolute right-3 flex items-center justify-center text-[var(--color-text-tertiary)]', inputSize === 'sm' && 'w-3.5 h-3.5', inputSize === 'md' && 'w-4 h-4', inputSize === 'lg' && 'w-[18px] h-[18px]')} aria-hidden="true">
              {rightIcon}
            </span>
          )}
        </div>
        {(error || helperText || (showCount && maxLength)) && (
          <div className="flex items-start justify-between gap-2">
            {error ? (
              <p id={`${inputId}-error`} role="alert" className="text-caption text-danger-800">{error}</p>
            ) : helperText ? (
              <p id={`${inputId}-helper`} className="text-caption text-[var(--color-text-tertiary)]">{helperText}</p>
            ) : <span />}
            {showCount && maxLength && (
              <p className={cn('text-caption shrink-0 tabular-nums', charCount >= maxLength ? 'text-danger-800' : 'text-[var(--color-text-tertiary)]')} aria-live="polite">
                {charCount}/{maxLength}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'