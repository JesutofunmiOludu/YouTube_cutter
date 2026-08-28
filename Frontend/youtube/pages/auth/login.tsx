// ============================================================
// VidMind AI — Login Page
// pages/auth/login.tsx
//
// Features:
//  - Email + password login
//  - Google sign-in via shared useGoogleAuth hook
//  - Redirects to intended page after login (from middleware)
//  - Field-level validation errors from the API
//  - "Forgot password" link
// ============================================================

import React                    from 'react'
import Link                     from 'next/link'
import { useRouter }            from 'next/router'
import { useForm }              from 'react-hook-form'
import AuthLayout               from '@components/layout/AuthLayout'
import { Button }               from '@components/ui/Button'
import { Input }                from '@components/ui/Input'
import { useAuthStore }         from '@/store/auth.store'
import { apiClient }            from '@/utils/apiClient'
import { useToast }             from '@components/ui/Toast'
import { cn }                   from '@/utils/cn'
import { useGoogleAuth }        from '@/hooks/useGoogleAuth'
import type { LoginFormValues } from '@/types'

// ------------------------------------------------------------
// GOOGLE BUTTON
// ------------------------------------------------------------

interface GoogleButtonProps {
  onClick:  () => void
  loading?: boolean
}

const GoogleButton: React.FC<GoogleButtonProps> = ({ onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={cn(
      'w-full flex items-center justify-center gap-2',
      'h-9 rounded-md border border-[var(--color-border-secondary)]',
      'text-body-sm text-[var(--color-text-primary)]',
      'bg-[var(--color-bg-primary)]',
      'hover:bg-[var(--color-bg-secondary)]',
      'transition-colors duration-fast',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    )}
    aria-label="Continue with Google"
  >
    {loading ? (
      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
        <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
      </svg>
    )}
    <span>Continue with Google</span>
  </button>
)

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
  const router        = useRouter()
  const { setAuth }   = useAuthStore()
  const { toast }     = useToast()

  // Intended destination from middleware redirect
  const from = (router.query.from as string) ?? '/dashboard'

  const { handleGoogleLogin, gisLoading } = useGoogleAuth({ redirectTo: from })

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
      const res = await apiClient.post('/auth/login/', {
        email:    values.email,
        password: values.password,
      })
      const { user, access, refresh } = res.data
      setAuth(user, access, refresh)
      toast.success('Welcome back!')
      router.replace(from)
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } }
      const data   = apiErr?.response?.data ?? {}

      if (data.email)             setError('email',    { message: data.email[0] })
      if (data.password)          setError('password', { message: data.password[0] })
      if (data.non_field_errors)  toast.error(data.non_field_errors[0] ?? 'Login failed')
      else if (!data.email && !data.password) toast.error('Invalid email or password')
    }
  }

  return (
    <AuthLayout>
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-1">Welcome back</h1>
        <p className="text-body-sm text-[var(--color-text-secondary)]">Log in to your account</p>
      </div>

      <div className="px-6 pb-6">
        {/* Google sign-in */}
        <div className="mt-4">
          <GoogleButton onClick={handleGoogleLogin} loading={gisLoading} />
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
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/register"
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
