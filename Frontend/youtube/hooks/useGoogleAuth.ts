// ============================================================
// VidMind AI — useGoogleAuth Hook
// hooks/useGoogleAuth.ts
//
// Shared hook for Google Identity Services (GIS) OAuth flow.
// Used by both Login and Register pages so the implementation
// is never duplicated.
//
// Performance notes:
//  - GIS script is loaded lazily and only once (idempotent check)
//  - useEffect cleanup removes the script tag if we added it
//  - Callback is stable via useCallback to prevent re-renders
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import { useRouter }    from 'next/router'
import { useAuthStore } from '@/store/auth.store'
import { apiClient }    from '@/utils/apiClient'
import { useToast }     from '@components/ui/Toast'

// ── Types ─────────────────────────────────────────────────

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string }) => void
          }) => { requestAccessToken: () => void }
        }
      }
    }
  }
}

export interface UseGoogleAuthOptions {
  /**
   * Where to redirect after a successful Google sign-in.
   * Defaults to '/dashboard'.
   */
  redirectTo?: string
}

export interface UseGoogleAuthReturn {
  /** Trigger the Google OAuth popup. */
  handleGoogleLogin: () => void
  /** True while the GIS token exchange is in-flight. */
  gisLoading: boolean
  /** True once the GIS client script has loaded. */
  gisReady: boolean
}

// ── Hook ──────────────────────────────────────────────────

export function useGoogleAuth({ redirectTo = '/dashboard' }: UseGoogleAuthOptions = {}): UseGoogleAuthReturn {
  const router          = useRouter()
  const { setAuth }     = useAuthStore()
  const { toast }       = useToast()
  const [gisReady,    setGisReady]    = useState(false)
  const [gisLoading,  setGisLoading]  = useState(false)

  // ── Load GIS script lazily (only once per page) ──────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google) { setGisReady(true); return }

    let scriptAdded = false
    const script = document.createElement('script')
    script.src   = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload  = () => setGisReady(true)
    script.onerror = () => console.warn('[useGoogleAuth] GIS script failed to load')
    document.head.appendChild(script)
    scriptAdded = true

    return () => {
      // Only clean up the script tag if we were the ones who added it
      if (scriptAdded && document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  // ── Exchange Google access_token with our backend ─────────
  const handleGoogleToken = useCallback(async (accessToken: string) => {
    try {
      const res = await apiClient.post('/auth/social/google/', {
        access_token: accessToken,
      })
      const { user, access, refresh } = res.data
      setAuth(user, access, refresh)
      toast.success(`Welcome, ${user.first_name || 'back'}!`)
      router.replace(redirectTo)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } } }
      toast.error(apiErr?.response?.data?.error ?? 'Google sign-in failed.')
    } finally {
      setGisLoading(false)
    }
  }, [redirectTo, router, setAuth, toast])

  // ── Trigger the GIS popup ─────────────────────────────────
  const handleGoogleLogin = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId) {
      toast.error('Google sign-in is not configured. Contact support.')
      return
    }
    if (!gisReady || !window.google) {
      toast.error('Google sign-in is still loading, please try again in a moment.')
      return
    }

    setGisLoading(true)

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope:     'email profile openid',
        callback:  (response) => {
          if (response.error) {
            toast.error('Google sign-in was cancelled or failed.')
            setGisLoading(false)
            return
          }
          if (response.access_token) {
            void handleGoogleToken(response.access_token)
          } else {
            setGisLoading(false)
          }
        },
      })

      client.requestAccessToken()
    } catch (err) {
      console.warn('[useGoogleAuth] Popup error:', err)
      toast.error('Pop-up window was blocked. Please allow popups for localhost.')
      setGisLoading(false)
    }
  }, [gisReady, handleGoogleToken, toast])

  return { handleGoogleLogin, gisLoading, gisReady }
}
