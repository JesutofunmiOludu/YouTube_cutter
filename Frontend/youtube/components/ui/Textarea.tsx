// ============================================================
// VidMind AI — Textarea Component
// src/components/ui/Textarea.tsx
//
// Multi-line text input with label, error, helper text,
// character count, and auto-grow option.
// ============================================================

import React, { forwardRef, useId, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/utils/cn'

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Field label */
  label?: string
  /** Helper text below the textarea */
  helperText?: string
  /** Error message — replaces helperText, activates error styles */
  error?: string
  /** Auto-expand height as user types */
  autoGrow?: boolean
  /** Minimum number of visible rows */
  minRows?: number
  /** Maximum number of rows before scroll appears (only with autoGrow) */
  maxRows?: number
  /** Show character counter (requires maxLength) */
  showCount?: boolean
  /** Full width */
  fullWidth?: boolean
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      helperText,
      error,
      autoGrow   = false,
      minRows    = 3,
      maxRows    = 8,
      showCount  = false,
      fullWidth  = true,
      className,
      id,
      maxLength,
      value,
      defaultValue,
      disabled,
      required,
      onChange,
      ...rest
    },
    ref
  ) => {
    const generatedId   = useId()
    const inputId       = id ?? generatedId
    const hasError      = Boolean(error)
    const internalRef   = useRef<HTMLTextAreaElement | null>(null)
    const charCount     = typeof value === 'string' ? value.length : 0

    // Merge external ref with internal ref
    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node
      },
      [ref]
    )

    // Auto-grow: recalculate height on value change
    const recalcHeight = useCallback(() => {
      const el = internalRef.current
      if (!el || !autoGrow) return

      const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 20
      const paddingY   = parseInt(getComputedStyle(el).paddingTop, 10)
                       + parseInt(getComputedStyle(el).paddingBottom, 10)
      const minHeight  = minRows * lineHeight + paddingY
      const maxHeight  = maxRows * lineHeight + paddingY

      el.style.height = 'auto'
      el.style.height = `${Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)}px`
      el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
    }, [autoGrow, minRows, maxRows])

    useEffect(() => {
      recalcHeight()
    }, [value, recalcHeight])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      recalcHeight()
      onChange?.(e)
    }

    return (
      <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>

        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-label text-[var(--color-text-secondary)]',
              disabled && 'opacity-50',
            )}
          >
            {label}
            {required && (
              <span className="text-danger-800 ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={setRef}
          id={inputId}
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          value={value}
          defaultValue={defaultValue}
          rows={minRows}
          aria-invalid={hasError}
          aria-describedby={
            error      ? `${inputId}-error`  :
            helperText ? `${inputId}-helper` :
            undefined
          }
          onChange={handleChange}
          className={cn(
            // Base
            'w-full font-sans rounded-md',
            'bg-[var(--color-bg-primary)]',
            'text-[var(--color-text-primary)] text-body-sm',
            'placeholder:text-[var(--color-text-tertiary)]',
            'transition-colors duration-fast',
            'outline-none',
            'py-2.5 px-3',
            'leading-relaxed',
            // Resize
            autoGrow ? 'resize-none' : 'resize-y',
            // Border
            'border border-[var(--color-border-secondary)]',
            // Hover
            'hover:border-[var(--color-border-primary)]',
            // Focus
            'focus:border-primary-400',
            'focus:ring-2 focus:ring-primary-200 focus:ring-offset-0',
            // Error
            hasError && [
              'border-danger-200',
              'hover:border-danger-600',
              'focus:border-danger-600',
              'focus:ring-danger-200',
            ],
            // Disabled
            disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)] resize-none',
            className,
          )}
          {...rest}
        />

        {/* Footer row */}
        {(error || helperText || (showCount && maxLength)) && (
          <div className="flex items-start justify-between gap-2">

            {error ? (
              <p
                id={`${inputId}-error`}
                role="alert"
                className="text-caption text-danger-800"
              >
                {error}
              </p>
            ) : helperText ? (
              <p
                id={`${inputId}-helper`}
                className="text-caption text-[var(--color-text-tertiary)]"
              >
                {helperText}
              </p>
            ) : (
              <span />
            )}

            {showCount && maxLength && (
              <p
                className={cn(
                  'text-caption shrink-0 tabular-nums',
                  charCount >= maxLength
                    ? 'text-danger-800'
                    : 'text-[var(--color-text-tertiary)]',
                )}
                aria-live="polite"
              >
                {charCount}/{maxLength}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
