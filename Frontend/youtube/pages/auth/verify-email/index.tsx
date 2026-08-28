// ============================================================
// VidMind AI — Verify Email Confirmation Page
// pages/auth/verify-email/index.tsx
//
// Handles incoming verification link: /auth/verify-email?uid=...&token=...
//
// Lifecycle:
//  1. Reads uid & token from router query params
//  2. Calls POST /api/auth/verify-email/
//  3. On success:
//      - Sets authenticated state with fresh JWT pair
//      - Reads pre-registration intent from sessionStorage
//      - Redirects seamlessly to intended destination (e.g. /workspace/new?url=...)
//  4. On error:
//      - Displays friendly error state
//      - Offers link to request a new verification email or login
// ============================================================

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthLayout from '@components/layout/AuthLayout'
import { Button } from '@components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@/utils/apiClient'
import { useToast } from '@components/ui/Toast'

type VerifyState = 'loading' | 'success' | 'error'

const POST_VERIFY_REDIRECT_KEY = 'vidmind_post_verify_redirect'

const VerifyEmailPage: React.FC = () => {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const { toast } = useToast()

  const [state, setState] = useState<VerifyState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { uid, token } = router.query

  useEffect(() => {
    // Wait until router is ready and query parameters are parsed
    if (!router.isReady) return

    if (!uid || !token) {
      setState('error')
      setErrorMessage('Invalid verification link. The required parameters are missing.')
      return
    }

    const controller = new AbortController()

    const verify = async () => {
      try {
        const res = await apiClient.post(
          '/auth/verify-email/',
          {
            uid: String(uid),
            token: String(token),
          },
          { signal: controller.signal }
        )

        const { user, access, refresh } = res.data
        setAuth(user, access, refresh)
        setState('success')
        toast.success('Email verified successfully! Welcome to VidMind AI 🎉')

        // Retrieve pre-registration intent if stored
        let destination = '/dashboard'
        if (typeof window !== 'undefined') {
          const savedIntent = sessionStorage.getItem(POST_VERIFY_REDIRECT_KEY)
          if (savedIntent) {
            destination = savedIntent
            sessionStorage.removeItem(POST_VERIFY_REDIRECT_KEY)
          }
        }

        // Redirect after brief pause for pleasant UX
        setTimeout(() => {
          router.replace(destination)
        }, 1200)
      } catch (err: unknown) {
        if (controller.signal.aborted) return
        setState('error')
        const apiErr = err as { response?: { data?: { error?: string } } }
        setErrorMessage(
          apiErr?.response?.data?.error ??
            'This verification link has expired or has already been used.'
        )
      }
    }

    void verify()

    return () => {
      controller.abort()
    }
  }, [router.isReady, uid, token, router, setAuth, toast])

  return (
    <AuthLayout maxWidth="440px">
      <div className="px-6 py-8 flex flex-col items-center text-center">
        {state === 'loading' && (
          <>
            <div className="w-12 h-12 mb-4 flex items-center justify-center text-primary-600">
              <svg className="animate-spin h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-2 font-semibold">
              Verifying your email...
            </h1>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              Please wait while we confirm your account.
            </p>
          </>
        )}

        {state === 'success' && (
          <>
            <div className="w-12 h-12 mb-4 rounded-full bg-success-50 border border-success-200 flex items-center justify-center text-success-600 shadow-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-2 font-semibold">
              Email verified!
            </h1>
            <p className="text-body-sm text-[var(--color-text-secondary)] mb-4">
              Your account is active. Redirecting you to your workspace...
            </p>
          </>
        )}

        {state === 'error' && (
          <>
            <div className="w-12 h-12 mb-4 rounded-full bg-danger-50 border border-danger-200 flex items-center justify-center text-danger-600 shadow-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-2 font-semibold">
              Verification failed
            </h1>
            <p className="text-body-sm text-[var(--color-text-secondary)] mb-6">
              {errorMessage}
            </p>

            <div className="flex flex-col w-full gap-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                fullWidth
                onClick={() => router.push('/auth/verify-email-pending')}
              >
                Request a new verification email
              </Button>

              <Link
                href="/auth/login"
                className="mt-2 text-caption text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                Return to log in
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  )
}

export default VerifyEmailPage
