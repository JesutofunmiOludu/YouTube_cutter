// ============================================================
// VidMind AI — Login Page
// src/pages/Auth/Login.tsx
//
// Features:
//  - Email + password login
//  - Social login (Google, Apple, Facebook)
//  - Redirects to intended page after login (from AuthGuard)
//  - Shows field-level validation errors from the API
//  - "Forgot password" link
// ============================================================

import React, { useState }              from 'react'
import Link                               from 'next/link'
import { useRouter }                      from 'next/router'
import { useForm }                        from 'react-hook-form'
import AuthLayout                         from '@components/layout/AuthLayout'
import { Button, Input }                  from '@components/ui'
import { useAuthStore }                   from '@/store/auth.store'
import { useToast }                       from '@components/ui/Toast'
import { cn }                             from '@/utils/cn'
import type { LoginFormValues }           from '@/types'

// ------------------------------------------------------------
// SOCIAL LOGIN BUTTON
// ------------------------------------------------------------

interface SocialButtonProps {
  provider:  'google' | 'apple' | 'facebook'
  onClick:   () => void
  loading?:  boolean
}

const SOCIAL_CONFIG = {
  google: {
    label: 'Google',
    icon: (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
    ),
  },
  apple: {
    label: 'Apple',
    icon: (
      <svg width="16" height="16" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-165-39.3c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 405.8 15 269.7 15 139.8C15 40.3 57.8-9.6 124.9-9.6c54.4 0 87.5 38.1 140.1 38.1 51.2 0 92.2-38.8 154.4-38.8 60.9 0 114.7 36.9 154.4 36.9z"/>
      </svg>
    ),
  },
  facebook: {
    label: 'Facebook',
    icon: (
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M14 7c0-3.866-3.134-7-7-7S0 3.134 0 7c0 3.493 2.56 6.388 5.906 6.914V9.023H4.129V7H5.906V5.456c0-1.754 1.044-2.722 2.643-2.722.766 0 1.566.137 1.566.137v1.72H9.3c-.869 0-1.14.54-1.14 1.094V7h1.94l-.31 2.023H8.16v4.891C11.44 13.388 14 10.493 14 7z" fill="#1877F2"/>
      </svg>
    ),
  },
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, onClick, loading }) => {
  const { label, icon } = SOCIAL_CONFIG[provider]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex-1 flex items-center justify-center gap-2',
        'h-9 rounded-md border border-[var(--color-border-secondary)]',
        'text-body-sm text-[var(--color-text-primary)]',
        'bg-[var(--color-bg-primary)]',
        'hover:bg-[var(--color-bg-secondary)]',
        'transition-colors duration-fast',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        'disabled:opacity-50 disabled:cursor-not-allowed',
      )}
      aria-label={`Continue with ${label}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ------------------------------------------------------------
// DIVIDER
// ------------------------------------------------------------

const Divider: React.FC<{ label?: string }> = ({ label = 'or continue with email' }) => (
  <div className="flex items-center gap-3 my-4">
    <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
    <span className="text-caption text-[var(--color-text-tertiary)] whitespace-nowrap">{label}</span>
    <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
  </div>
)

// ------------------------------------------------------------
// PAGE
// ------------------------------------------------------------

const LoginPage: React.FC = () => {
  const router                = useRouter()
  const { setAuth }           = useAuthStore()
  const { toast }             = useToast()
  const [socialLoading, setSocialLoading] = useState<string | null>(null)

  // Intended destination from AuthGuard
  // In Next.js, the intended destination is passed as a query param by AuthGuard
  const from = (router.query.from as string) ?? '/dashboard'

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  })

  // Email/password login
  const onSubmit = async (values: LoginFormValues) => {
    try {
      // TODO: replace with real API call
      // const { user, token } = await authService.login(values)
      // setAuth(user, token)

      // Simulated success for now
      await new Promise((r) => setTimeout(r, 800))
      toast.success('Welcome back!')
      router.replace(from)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } }
      const data   = apiErr?.response?.data ?? {}

      // Map API field errors to form errors
      if (data.email)             setError('email',    { message: data.email[0] })
      if (data.password)          setError('password', { message: data.password[0] })
      if (data.non_field_errors)  toast.error(data.non_field_errors[0] ?? 'Login failed')
      else if (!data.email && !data.password) toast.error('Invalid email or password')
    }
  }

  // Social login
  const handleSocial = async (provider: string) => {
    setSocialLoading(provider)
    try {
      // TODO: redirect to Django social auth endpoint
      // window.location.href = `/api/auth/social/${provider}/`
      await new Promise((r) => setTimeout(r, 600))
      toast.info(`${provider} login coming soon`)
    } finally {
      setSocialLoading(null)
    }
  }

  return (
    <AuthLayout>
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-1">Welcome back</h1>
        <p className="text-body-sm text-[var(--color-text-secondary)]">Log in to your account</p>
      </div>

      <div className="px-6 pb-6">
        {/* Social login */}
        <div className="flex gap-2 mt-4">
          {(['google', 'apple', 'facebook'] as const).map((p) => (
            <SocialButton
              key={p}
              provider={p}
              onClick={() => handleSocial(p)}
              loading={socialLoading === p}
            />
          ))}
        </div>

        <Divider />

        {/* Email form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
            })}
          />

          <div className="flex flex-col gap-1">
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />
            <Link
              href="/forgot-password"
              className="text-caption text-primary-600 hover:text-primary-800 transition-colors self-end mt-0.5 focus-visible:outline-none focus-visible:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isSubmitting}
            className="mt-1"
          >
            Log in
          </Button>
        </form>

        {/* Register link */}
        <p className="text-body-sm text-[var(--color-text-secondary)] text-center mt-4">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-primary-600 font-medium hover:text-primary-800 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Sign up free
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}

export default LoginPage
