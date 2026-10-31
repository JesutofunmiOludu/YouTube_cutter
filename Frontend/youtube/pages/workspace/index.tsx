// pages/workspace/index.tsx
// Seamless root /workspace route: redirects to user's latest workspace or search.

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { apiClient } from '@/utils/apiClient'
import { Spinner } from '@/components/ui/Spinner'

export default function WorkspaceIndexPage() {
  const router = useRouter()

  useEffect(() => {
    let active = true

    const redirectUser = async () => {
      try {
        const res = await apiClient.get('/videos/?touch=false')
        if (!active) return
        const list = res.data.results || res.data || []

        if (list.length > 0) {
          const latest = list[0]
          if (latest.preferred_format && latest.preferred_format !== 'standard') {
            router.replace(`/workspace/${latest.id}/canvas?format=${latest.preferred_format}`)
          } else {
            router.replace(`/workspace/${latest.id}`)
          }
        } else {
          router.replace('/search')
        }
      } catch {
        if (active) router.replace('/search')
      }
    }

    redirectUser()
    return () => {
      active = false
    }
  }, [router])

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[var(--color-bg-primary)]">
      <Spinner size="lg" label="Opening your workspace..." />
    </div>
  )
}
