// ============================================================
// VidMind AI — Verify Email Pending Page
// pages/auth/verify-email-pending/index.tsx
//
// Shown to users immediately after registration or when hard-blocked
// from protected routes because their account is unverified.
//
// Features:
//  - Clean inbox prompt UI
//  - Displays user email from auth store
//  - Resend verification button with 60s cooldown & 300ms debounce
//  - Logout option to sign in with a different account
// ============================================================

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import AuthLayout from '@components/layout/AuthLayout'
import { Button } from '@components/ui/Button'
import { useAuthStore } from '@/store/auth.store'
import { apiClient } from '@/utils/apiClient'
import { useToast } from '@components/ui/Toast'

const RESEND_COOLDOWN_SECONDS = 60

const VerifyEmailPendingPage: React.FC = () => {
  const router = useRouter()
  const { user, clearAuth } = useAuthStore()
  const { toast } = useToast()

  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // If user is already verified, redirect directly to dashboard
  useEffect(() => {
    if (user?.is_verified) {
      router.replace('/dashboard')
    }
  }, [user?.is_verified, router])

  // Debounced resend verification email handler
  const handleResend = useCallback(async () => {
    if (cooldown > 0 || isSending) return

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

    debounceTimerRef.current = setTimeout(async () => {
      setIsSending(true)
      try {
        await apiClient.post('/auth/send-verification/')
        toast.success('Verification email sent! Check your inbox 📬')
        setCooldown(RESEND_COOLDOWN_SECONDS)
      } catch (err: unknown) {
        const apiErr = err as { response?: { data?: { error?: string; detail?: string } } }
        const msg =
          apiErr?.response?.data?.error ??
          apiErr?.response?.data?.detail ??
          'Could not send verification email. Please try again later.'
        toast.error(msg)
      } finally {
        setIsSending(false)
      }
    }, 300)
  }, [cooldown, isSending, toast])

  const handleLogout = () => {
    clearAuth()
    router.replace('/auth/login')
  }

  return (
    <AuthLayout maxWidth="460px">
      <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
        {/* Email Icon Illustration */}
        <div className="w-14 h-14 mb-4 rounded-full bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 shadow-xs">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-2 font-semibold">
          Check your email
        </h1>

        <p className="text-body-sm text-[var(--color-text-secondary)] mb-4 max-w-sm">
          We sent a verification link to{' '}
          <strong className="text-[var(--color-text-primary)] font-medium">
            {user?.email || 'your email address'}
          </strong>
          . Click the link inside to activate your account and get started.
        </p>

        <div className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-tertiary)] rounded-lg p-3 mb-6 text-caption text-[var(--color-text-tertiary)] text-left">
          <p className="mb-1 font-medium text-[var(--color-text-secondary)]">Didn&apos;t see the email?</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Check your spam or junk folder</li>
            <li>Wait a minute and click resend below</li>
          </ul>
        </div>

        {/* Resend button */}
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          loading={isSending}
          disabled={cooldown > 0}
          onClick={handleResend}
          className="mb-3"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend verification email'}
        </Button>

        {/* Sign in with different account / Log out */}
        <div className="flex items-center justify-center gap-4 text-caption text-[var(--color-text-secondary)] mt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="text-primary-600 hover:text-primary-800 font-medium transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Log in with a different account
          </button>
          <span>•</span>
          <Link
            href="/"
            className="hover:text-[var(--color-text-primary)] transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default VerifyEmailPendingPage
