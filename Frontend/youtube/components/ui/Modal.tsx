'use client'

// src/components/ui/Modal.tsx
import React, { useEffect, useRef, useCallback, createContext, useContext } from 'react'
import { X }          from 'lucide-react'
import { cn }         from '@/utils/cn'
import { IconButton } from './Button'

interface ModalCtx { onClose: () => void }
const ModalContext = createContext<ModalCtx>({ onClose: () => {} })
const useModal = () => useContext(ModalContext)

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'
export interface ModalProps {
  open:                  boolean
  onClose:               () => void
  size?:                 ModalSize
  preventBackdropClose?: boolean
  children:              React.ReactNode
  className?:            string
}

const sizeMap: Record<ModalSize, string> = {
  sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-xl',
}

export function Modal({ open, onClose, size = 'md', preventBackdropClose = false, children, className }: ModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const contentRef  = useRef<HTMLDivElement>(null)
  const triggerRef  = useRef<Element | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => {
      contentRef.current?.querySelector<HTMLElement>('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')?.focus()
    }, 50)
    return () => clearTimeout(t)
  }, [open])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'Tab') {
      const el = contentRef.current
      if (!el) return
      const focusable = Array.from(el.querySelectorAll<HTMLElement>('button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'))
      const first = focusable[0]; const last = focusable[focusable.length - 1]
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
    }
  }, [onClose])

  if (!open) return null

  return (
    <ModalContext.Provider value={{ onClose }}>
      <div ref={backdropRef} role="presentation"
        className="fixed inset-0 z-modal flex items-center justify-center bg-black/45 p-4 animate-fade-in"
        onClick={(e) => !preventBackdropClose && e.target === backdropRef.current && onClose()}
        onKeyDown={handleKeyDown}>
        <div ref={contentRef} role="dialog" aria-modal="true"
          className={cn('relative w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl flex flex-col animate-slide-up max-h-[calc(100vh-2rem)]', sizeMap[size], className)}>
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  )
}

Modal.Header = function ModalHeader({ showClose = true, className, children, ...rest }: { showClose?: boolean; className?: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const { onClose } = useModal()
  return (
    <div className={cn('flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-[var(--color-border-tertiary)] shrink-0', className)} {...rest}>
      <div className="flex-1 min-w-0">{children}</div>
      {showClose && <IconButton aria-label="Close modal" icon={<X />} variant="ghost" size="sm" onClick={onClose} className="-mt-1 -mr-1 shrink-0" />}
    </div>
  )
}

Modal.Body = function ModalBody({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-5 overflow-y-auto flex-1', className)} {...rest}>{children}</div>
}

Modal.Footer = function ModalFooter({ align = 'right', className, children, ...rest }: { align?: 'left'|'right'|'center' } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-t border-[var(--color-border-tertiary)] shrink-0 flex flex-wrap gap-3',
      align === 'right' && 'justify-end', align === 'center' && 'justify-center', align === 'left' && 'justify-start', className)} {...rest}>
      {children}
    </div>
  )
}

// ============================================================
// CONFIRM MODAL
// Shorthand for yes/no confirmation dialogs.
//
// Usage:
//   <ConfirmModal
//     open={showDelete}
//     onClose={() => setShowDelete(false)}
//     onConfirm={handleDelete}
//     title="Delete video?"
//     description="This cannot be undone."
//     confirmLabel="Delete"
//     variant="danger"
//   />
// ============================================================

export interface ConfirmModalProps {
  open:           boolean
  onClose:        () => void
  onConfirm:      () => void
  title:          string
  description?:   string
  confirmLabel?:  string
  cancelLabel?:   string
  variant?:       'danger' | 'primary'
  loading?:       boolean
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'primary',
  loading      = false,
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm">
      <Modal.Header>
        <h2 className="text-heading-lg text-[var(--color-text-primary)]">{title}</h2>
      </Modal.Header>

      {description && (
        <Modal.Body>
          <p className="text-body-md text-[var(--color-text-secondary)]">{description}</p>
        </Modal.Body>
      )}

      <Modal.Footer>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex items-center justify-center h-9 px-4 rounded-md text-body-sm font-medium bg-transparent text-[var(--color-text-primary)] border border-[var(--color-border-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={cn(
            'inline-flex items-center justify-center h-9 px-4 rounded-md text-body-sm font-medium transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            variant === 'danger'
              ? 'bg-transparent text-danger-800 border border-danger-200 hover:bg-danger-50 hover:border-danger-600'
              : 'bg-primary-600 text-white border border-primary-600 hover:bg-primary-800 hover:border-primary-800',
          )}
        >
          {loading ? (
            <svg className="animate-spin w-4 h-4 mr-2" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" opacity={0.2} />
              <path d="M14 8a6 6 0 01-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : null}
          {confirmLabel}
        </button>
      </Modal.Footer>
    </Modal>
  )
}