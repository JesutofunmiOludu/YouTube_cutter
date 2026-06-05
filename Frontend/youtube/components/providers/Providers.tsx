
// ============================================================
// VidMind AI — Providers
// src/components/providers/Providers.tsx
//
// Client-side providers wrapper. Imported by root layout.tsx.
// All context providers that need client-side APIs go here.
// ============================================================

import { ToastProvider } from '@components/ui/Toast'
import { QueryProvider } from './QueryProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </QueryProvider>
  )
}