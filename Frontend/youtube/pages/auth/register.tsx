// ============================================================
// VidMind AI — Register Page
// pages/auth/register.tsx
//
// Features:
//  - First name, last name, email, password
//  - Password strength indicator
//  - Google sign-up via shared useGoogleAuth hook
//  - Reads ?url= and ?q= params from Home page search
//    so intent is preserved through sign-up AND verification
//  - On email registration: stores redirect intent in
//    sessionStorage before redirecting to verify-email-pending
// ============================================================

import React, { useState }          from 'react'
import Link                          from 'next/link'
import { useRouter }                 from 'next/router'
import { useForm }                   from 'react-hook-form'
import AuthLayout                    from '@components/layout/AuthLayout'
import { Button }                    from '@components/ui/Button'
import { Input }                     from '@components/ui/Input'
import { useAuthStore }              from '@/store/auth.store'
import { apiClient }                 from '@/utils/apiClient'
import { useToast }                  from '@components/ui/Toast'
import { cn }                        from '@/utils/cn'
import { useGoogleAuth }             from '@/hooks/useGoogleAuth'
import type { RegisterFormValues }   from '@/types'

// ------------------------------------------------------------
// PASSWORD STRENGTH INDICATOR
// ------------------------------------------------------------

function getStrength(password: string): { score: number; label: string } {
  let score = 0
  if (password.length >= 8)                      score++
  if (/[A-Z]/.test(password))                    score++
  if (/[0-9]/.test(password))                    score++
  if (/[^A-Za-z0-9]/.test(password))             score++

  const labels = ['', 'Weak', 'Fair', 'Strong', 'Very strong']
  return { score, label: labels[score] ?? '' }
}

const strengthColour = ['', 'bg-danger-600', 'bg-warning-200', 'bg-success-200', 'bg-success-600']
const strengthText   = ['', 'text-danger-800', 'text-warning-800', 'text-success-800', 'text-success-800']

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const { score, label } = getStrength(password)
  if (!password) return null

  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-base',
              i <= score ? strengthColour[score] : 'bg-[var(--color-border-tertiary)]',
            )}
          />
        ))}
      </div>
      {label && (
        <p className={cn('text-caption', strengthText[score])} aria-live="polite">
          {label}
        </p>
      )}
    </div>
  )
}

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
      'w-full flex items-center justify-center gap-2 h-9 rounded-md',
      'border border-[var(--color-border-secondary)]',
      'text-body-sm text-[var(--color-text-primary)]',
      'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]',
      'transition-colors duration-fast',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    )}
    aria-label="Sign up with Google"
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

export const POST_VERIFY_REDIRECT_KEY = 'vidmind_post_verify_redirect'

// ------------------------------------------------------------
// PAGE
// ------------------------------------------------------------

const RegisterPage: React.FC = () => {
  const router      = useRouter()
  const { setAuth } = useAuthStore()
  const { toast }   = useToast()
  const [password, setPassword] = useState('')

  // Preserve user's intent from Home page (passed as Next.js query params)
  const intentUrl = router.query.url as string | undefined
  const intentQ   = router.query.q   as string | undefined

  // Compute the destination the user should land on after verification
  const postVerifyRedirect = intentUrl
    ? `/workspace/new?url=${encodeURIComponent(intentUrl)}`
    : intentQ
    ? `/search?q=${encodeURIComponent(intentQ)}`
    : '/dashboard'

  // Google sign-up: Google-verified accounts are already verified,
  // so they go directly to the intended destination
  const { handleGoogleLogin, gisLoading } = useGoogleAuth({
    redirectTo: postVerifyRedirect,
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      first_name: '', last_name: '', email: '', password: '', confirm_password: '',
    },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    if (values.password !== values.confirm_password) {
      setError('confirm_password', { message: 'Passwords do not match' })
      return
    }

    try {
      const res = await apiClient.post('/auth/register/', {
        first_name: values.first_name,
        last_name:  values.last_name,
        email:      values.email,
        password:   values.password,
        password2:  values.confirm_password,
      })
      const { user, access, refresh } = res.data
      setAuth(user, access, refresh)
      toast.success('Account created! Please verify your email to continue 📧')

      // Persist intent so verify-email page can redirect there after confirmation
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(POST_VERIFY_REDIRECT_KEY, postVerifyRedirect)
      }

      // Go to the "check your inbox" pending page
      router.replace('/auth/verify-email-pending')
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } }
      const data   = apiErr?.response?.data ?? {}
      if (data.email)            setError('email',    { message: data.email[0] })
      if (data.password)         setError('password', { message: data.password[0] })
      if (data.non_field_errors) toast.error(data.non_field_errors[0] ?? 'Registration failed')
    }
  }

  return (
    <AuthLayout maxWidth="440px">
      <div className="px-6 pt-6 pb-2">
        <h1 className="text-heading-lg text-[var(--color-text-primary)] mb-1">
          Create your account
        </h1>
        <p className="text-body-sm text-[var(--color-text-secondary)]">
          Free forever. No credit card needed.
        </p>
        {(intentUrl || intentQ) && (
          <div className="mt-2 px-3 py-2 bg-primary-50 border border-primary-100 rounded-md">
            <p className="text-caption text-primary-800">
              {intentUrl
                ? '↗ Sign up to process your YouTube video'
                : `↗ Sign up to search for "${intentQ}"`
              }
            </p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        {/* Google sign-up */}
        <div className="mt-4">
          <GoogleButton onClick={handleGoogleLogin} loading={gisLoading} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
          <span className="text-caption text-[var(--color-text-tertiary)]">or sign up with email</span>
          <div className="flex-1 h-px bg-[var(--color-border-tertiary)]" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First name"
              placeholder="Ada"
              autoComplete="given-name"
              error={errors.first_name?.message}
              {...register('first_name', { required: 'First name is required' })}
            />
            <Input
              label="Last name"
              placeholder="Okafor"
              autoComplete="family-name"
              error={errors.last_name?.message}
              {...register('last_name', { required: 'Last name is required' })}
            />
          </div>

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

          <div className="flex flex-col gap-0">
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Must be at least 8 characters' },
                onChange: (e) => setPassword(e.target.value),
              })}
            />
            <PasswordStrength password={password} />
          </div>

          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            autoComplete="new-password"
            error={errors.confirm_password?.message}
            {...register('confirm_password', { required: 'Please confirm your password' })}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            fullWidth
            loading={isSubmitting}
            className="mt-1"
          >
            Create free account
          </Button>
        </form>

        {/* Login link */}
        <p className="text-body-sm text-[var(--color-text-secondary)] text-center mt-4">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="text-primary-600 font-medium hover:text-primary-800 transition-colors focus-visible:outline-none focus-visible:underline"
          >
            Log in
          </Link>
        </p>

        {/* Terms */}
        <p className="text-caption text-[var(--color-text-tertiary)] text-center mt-3 leading-relaxed">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline hover:text-[var(--color-text-secondary)]">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-[var(--color-text-secondary)]">Privacy Policy</Link>.
        </p>
      </div>
    </AuthLayout>
  )
}

export default RegisterPage
