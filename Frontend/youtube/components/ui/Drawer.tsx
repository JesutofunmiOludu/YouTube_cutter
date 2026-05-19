// ============================================================
// VidMind AI — Drawer Component
// src/components/ui/Drawer.tsx
//
// Side panel that slides in from the right (default) or left.
// Traps focus, closes on Escape and backdrop click.
// On mobile: full-width bottom sheet.
// ============================================================

import React, {
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from 'react'
import { X }          from 'lucide-react'
import { cn }         from '@/utils/cn'
import { IconButton } from './Button'

// ------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------

interface DrawerContextValue {
  onClose: () => void
}

const DrawerContext = createContext<DrawerContextValue>({ onClose: () => {} })

const useDrawer = () => useContext(DrawerContext)

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export type DrawerSide  = 'right' | 'left'
export type DrawerWidth = 'sm' | 'md' | 'lg' | 'full'

export interface DrawerProps {
  open:                    boolean
  onClose:                 () => void
  side?:                   DrawerSide
  width?:                  DrawerWidth
  preventBackdropClose?:   boolean
  preventEscapeClose?:     boolean
  children:                React.ReactNode
  className?:              string
}

// ------------------------------------------------------------
// WIDTH MAP
// ------------------------------------------------------------

const widthMap: Record<DrawerWidth, string> = {
  sm:   'w-72',
  md:   'w-80',
  lg:   'w-96',
  full: 'w-full',
}

// ------------------------------------------------------------
// ROOT DRAWER
// ------------------------------------------------------------

const Drawer: React.FC<DrawerProps> & {
  Header: React.FC<DrawerHeaderProps>
  Body:   React.FC<React.HTMLAttributes<HTMLDivElement>>
  Footer: React.FC<React.HTMLAttributes<HTMLDivElement>>
} = ({
  open,
  onClose,
  side                 = 'right',
  width                = 'md',
  preventBackdropClose = false,
  preventEscapeClose   = false,
  children,
  className,
}) => {
  const backdropRef = useRef<HTMLDivElement>(null)
  const panelRef    = useRef<HTMLDivElement>(null)
  const triggerRef  = useRef<Element | null>(null)

  useEffect(() => {
    if (open) {
      triggerRef.current        = document.activeElement
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      if (triggerRef.current instanceof HTMLElement) triggerRef.current.focus()
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      const focusable = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.focus()
    }, 50)
    return () => clearTimeout(timer)
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && !preventEscapeClose) onClose()
      if (e.key === 'Tab') {
        const el       = panelRef.current
        if (!el) return
        const focusable = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
          )
        )
        const first = focusable[0]
        const last  = focusable[focusable.length - 1]
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
        if (e.shiftKey  && document.activeElement === first) { e.preventDefault(); last?.focus() }
      }
    },
    [onClose, preventEscapeClose]
  )

  if (!open) return null

  return (
    <DrawerContext.Provider value={{ onClose }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-overlay bg-black/45 animate-fade-in"
        aria-hidden="true"
        onClick={() => !preventBackdropClose && onClose()}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        onKeyDown={handleKeyDown}
        className={cn(
          'fixed top-0 bottom-0 z-modal',
          'flex flex-col',
          'bg-[var(--color-bg-primary)]',
          'border-[var(--color-border-tertiary)]',
          // Side
          side === 'right' ? [
            'right-0',
            'border-l',
            'animate-slide-in-right',
          ] : [
            'left-0',
            'border-r',
          ],
          // Width
          widthMap[width],
          // Mobile: always full width
          'max-md:w-full',
          className,
        )}
      >
        {children}
      </div>
    </DrawerContext.Provider>
  )
}

// ------------------------------------------------------------
// DRAWER.HEADER
// ------------------------------------------------------------

export interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  showClose?: boolean
}

const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  showClose = true,
  className,
  children,
  ...rest
}) => {
  const { onClose } = useDrawer()

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4',
        'px-5 py-4 shrink-0',
        'border-b border-[var(--color-border-tertiary)]',
        className,
      )}
      {...rest}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {showClose && (
        <IconButton
          aria-label="Close drawer"
          icon={<X />}
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="shrink-0"
        />
      )}
    </div>
  )
}

DrawerHeader.displayName = 'Drawer.Header'

// ------------------------------------------------------------
// DRAWER.BODY
// ------------------------------------------------------------

const DrawerBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn('flex-1 overflow-y-auto px-5 py-4', className)}
    {...rest}
  >
    {children}
  </div>
)

DrawerBody.displayName = 'Drawer.Body'

// ------------------------------------------------------------
// DRAWER.FOOTER
// ------------------------------------------------------------

const DrawerFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...rest
}) => (
  <div
    className={cn(
      'shrink-0 px-5 py-4',
      'border-t border-[var(--color-border-tertiary)]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
)

DrawerFooter.displayName = 'Drawer.Footer'

// Attach sub-components
Drawer.Header = DrawerHeader
Drawer.Body   = DrawerBody
Drawer.Footer = DrawerFooter
Drawer.displayName = 'Drawer'

export default Drawer
