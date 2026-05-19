'use client'

// ============================================================
// VidMind AI — React Query Provider
// src/components/providers/QueryProvider.tsx
// ============================================================

import { useState }                    from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient inside useState so it's not shared between requests
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:            60 * 1000,   // 1 minute
            retry:                1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}