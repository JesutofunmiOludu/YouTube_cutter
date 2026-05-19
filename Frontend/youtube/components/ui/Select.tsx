// ============================================================
// VidMind AI — Select Component
// src/components/ui/Select.tsx
//
// Native <select> styled to match the design system.
// For complex dropdowns with search/multi-select, use a
// dedicated combobox component built on top of this.
// ============================================================

import React, { forwardRef, useId } from 'react'
import { ChevronDown }               from 'lucide-react'
import { cn }                        from '@/utils/cn'

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export interface SelectOption {
  value:    string
  label:    string
  disabled?: boolean
}

export interface SelectGroup {
  label:   string
  options: SelectOption[]
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Field label */
  label?: string
  /** Helper text */
  helperText?: string
  /** Error message */
  error?: string
  /** Flat list of options */
  options?: SelectOption[]
  /** Grouped options — use instead of options for grouped selects */
  groups?: SelectGroup[]
  /** Placeholder shown when no value is selected */
  placeholder?: string
  /** Visual size */
  selectSize?: 'sm' | 'md' | 'lg'
  /** Full width */
  fullWidth?: boolean
}

// ------------------------------------------------------------
// STYLE HELPERS
// ------------------------------------------------------------

const selectSizeStyles = {
  sm: 'h-8  pl-3 pr-8  text-caption',
  md: 'h-9  pl-3 pr-9  text-body-sm',
  lg: 'h-11 pl-4 pr-10 text-body-md',
}

const chevronSizeStyles = {
  sm: 'w-3.5 h-3.5 right-2.5',
  md: 'w-4 h-4 right-3',
  lg: 'w-[18px] h-[18px] right-3',
}

// ------------------------------------------------------------
// COMPONENT
// ------------------------------------------------------------

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      groups,
      placeholder,
      selectSize = 'md',
      fullWidth  = true,
      className,
      id,
      disabled,
      required,
      value,
      defaultValue,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId()
    const inputId     = id ?? generatedId
    const hasError    = Boolean(error)

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

        {/* Select wrapper */}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            value={value}
            defaultValue={defaultValue ?? ''}
            aria-invalid={hasError}
            aria-describedby={
              error      ? `${inputId}-error`  :
              helperText ? `${inputId}-helper` :
              undefined
            }
            className={cn(
              // Base
              'w-full font-sans rounded-md appearance-none cursor-pointer',
              'bg-[var(--color-bg-primary)]',
              'text-[var(--color-text-primary)]',
              'transition-colors duration-fast',
              'outline-none',
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
              disabled && 'opacity-50 cursor-not-allowed bg-[var(--color-bg-secondary)]',
              // Size
              selectSizeStyles[selectSize],
              className,
            )}
            {...rest}
          >
            {/* Placeholder option */}
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {/* Flat options */}
            {options?.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </option>
            ))}

            {/* Grouped options */}
            {groups?.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                  >
                    {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          {/* Chevron icon */}
          <ChevronDown
            className={cn(
              'absolute pointer-events-none',
              'text-[var(--color-text-tertiary)]',
              chevronSizeStyles[selectSize],
            )}
            aria-hidden="true"
          />
        </div>

        {/* Footer */}
        {(error || helperText) && (
          <>
            {error ? (
              <p
                id={`${inputId}-error`}
                role="alert"
                className="text-caption text-danger-800"
              >
                {error}
              </p>
            ) : (
              <p
                id={`${inputId}-helper`}
                className="text-caption text-[var(--color-text-tertiary)]"
              >
                {helperText}
              </p>
            )}
          </>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select
