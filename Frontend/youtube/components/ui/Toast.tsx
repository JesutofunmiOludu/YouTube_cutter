'use client'

// src/components/ui/Toast.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn }  from '@/utils/cn'
import type { Toast, ToastType } from '@/types'

interface ToastContextValue {
  toasts:  Toast[]
  dismiss: (id: string) => void
  toast: {
    success: (message: string, duration?: number) => string
    error:   (message: string, duration?: number) => string
    warning: (message: string, duration?: number) => string
    info:    (message: string, duration?: number) => string
  }
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

const DEFAULT_DURATION: Record<ToastType, number> = { success: 4000, error: 6000, warning: 5000, info: 4000 }

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers              = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((t: Omit<Toast, 'id'>): string => {
    const id       = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const duration = t.duration ?? DEFAULT_DURATION[t.type]
    setToasts((prev) => {
      const next = [...prev, { ...t, id }]
      return next.length > 3 ? next.slice(next.length - 3) : next
    })
    if (duration > 0) timers.current[id] = setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const toast: ToastContextValue['toast'] = {
    success: (msg, dur) => add({ type: 'success', message: msg, duration: dur }),
    error:   (msg, dur) => add({ type: 'error',   message: msg, duration: dur }),
    warning: (msg, dur) => add({ type: 'warning', message: msg, duration: dur }),
    info:    (msg, dur) => add({ type: 'info',    message: msg, duration: dur }),
  }

  return (
    <ToastContext.Provider value={{ toasts, dismiss, toast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

const toastStyles: Record<ToastType, { wrapper: string; icon: React.FC<{ className?: string }>; iconClass: string }> = {
  success: { wrapper: 'bg-success-50 border-success-200 text-success-800',   icon: CheckCircle,   iconClass: 'text-success-600'  },
  error:   { wrapper: 'bg-danger-50 border-danger-200 text-danger-800',       icon: AlertCircle,   iconClass: 'text-danger-600'   },
  warning: { wrapper: 'bg-warning-50 border-warning-200 text-warning-800',    icon: AlertTriangle, iconClass: 'text-warning-600'  },
  info:    { wrapper: 'bg-primary-50 border-primary-200 text-primary-800',    icon: Info,          iconClass: 'text-primary-600'  },
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const style = toastStyles[toast.type]
  const Icon  = style.icon
  return (
    <div role="alert" className={cn('flex items-start gap-3 w-full max-w-[360px] px-4 py-3 rounded-lg border animate-slide-up', style.wrapper)}>
      <Icon className={cn('w-4 h-4 shrink-0 mt-0.5', style.iconClass)} aria-hidden="true" />
      <p className="flex-1 text-body-sm font-medium leading-snug">{toast.message}</p>
      <button onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification"
        className="shrink-0 -mr-1 -mt-0.5 w-6 h-6 rounded flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null
  return (
    <div role="region" aria-label="Notifications" aria-live="polite" aria-atomic="false"
      className="fixed bottom-5 right-5 z-toast flex flex-col gap-2 items-end max-md:right-0 max-md:left-0 max-md:px-4 max-md:items-center">
      {toasts.map((t) => <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  )
}