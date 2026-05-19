// ============================================================
// VidMind AI — Register Page
// src/pages/Auth/Register.tsx
//
// Features:
//  - First name, last name, email, password
//  - Password strength indicator
//  - Social sign-up buttons
//  - Reads ?url= and ?q= params from Home page search
//    so intent is preserved through sign-up flow
// ============================================================

import React, { useState }            from 'react'
import Link                           from 'next/link'
import { useRouter }                  from 'next/router'
import { useForm }                     from 'react-hook-form'
import AuthLayout                      from '@components/layout/AuthLayout'
import Button                          from '@components/ui/Button'
import Input                           from '@components/ui/Input'
import { useAuthStore }                from '@/store/auth.store'
import { useToast }                    from '@components/ui/Toast'
import { cn }                          from '@/utils/cn'
import type { RegisterFormValues }     from '@/types'

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

// Social button (reuse same shape as Login page)
const SocialButton: React.FC<{
  provider: string
  icon: React.ReactNode
  onClick: () => void
  loading?: boolean
}> = ({ provider, icon, onClick, loading }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={loading}
    className={cn(
      'flex-1 flex items-center justify-center gap-2 h-9 rounded-md',
      'border border-[var(--color-border-secondary)]',
      'text-body-sm text-[var(--color-text-primary)]',
      'bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]',
      'transition-colors duration-fast',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
      'disabled:opacity-50 disabled:cursor-not-allowed',
    )}
    aria-label={`Sign up with ${provider}`}
  >
    {icon}
    <span className="hidden sm:inline">{provider}</span>
  </button>
)

// ------------------------------------------------------------
// PAGE
// ------------------------------------------------------------

const RegisterPage: React.FC = () => {
  const router            = useRouter()
  const navigate          = (to: string) => router.push(to)
  const { setAuth }       = useAuthStore()
  const { toast }         = useToast()
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [password, setPassword]           = useState('')

  // Preserve user's intent from Home page (passed as Next.js query params)
  const intentUrl = router.query.url as string | undefined
  const intentQ   = router.query.q   as string | undefined

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
      // TODO: replace with real API call
      // const { user, token } = await authService.register(values)
      // setAuth(user, token)

      await new Promise((r) => setTimeout(r, 900))
      toast.success('Account created! Welcome to VidMind AI 🎉')

      // Redirect to intended action
      if (intentUrl) navigate(`/workspace/new?url=${encodeURIComponent(intentUrl)}`)
      else if (intentQ) navigate(`/search?q=${encodeURIComponent(intentQ)}`)
      else navigate('/dashboard')
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: Record<string, string[]> } }
      const data   = apiErr?.response?.data ?? {}
      if (data.email)    setError('email',    { message: data.email[0] })
      if (data.password) setError('password', { message: data.password[0] })
      if (data.non_field_errors) toast.error(data.non_field_errors[0] ?? 'Registration failed')
    }
  }

  const handleSocial = async (provider: string) => {
    setSocialLoading(provider)
    try {
      await new Promise((r) => setTimeout(r, 600))
      toast.info(`${provider} sign-up coming soon`)
    } finally {
      setSocialLoading(null)
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
        {/* Social buttons */}
        <div className="flex gap-2 mt-4">
          <SocialButton
            provider="Google"
            icon={
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            }
            onClick={() => handleSocial('Google')}
            loading={socialLoading === 'Google'}
          />
          <SocialButton
            provider="Apple"
            icon={<svg width="15" height="15" viewBox="0 0 814 1000" fill="currentColor" aria-hidden="true"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.3-165-39.3c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57.8-155.5-127.4C46 405.8 15 269.7 15 139.8C15 40.3 57.8-9.6 124.9-9.6c54.4 0 87.5 38.1 140.1 38.1 51.2 0 92.2-38.8 154.4-38.8 60.9 0 114.7 36.9 154.4 36.9z"/></svg>}
            onClick={() => handleSocial('Apple')}
            loading={socialLoading === 'Apple'}
          />
          <SocialButton
            provider="Facebook"
            icon={<svg width="16" height="16" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M14 7c0-3.866-3.134-7-7-7S0 3.134 0 7c0 3.493 2.56 6.388 5.906 6.914V9.023H4.129V7H5.906V5.456c0-1.754 1.044-2.722 2.643-2.722.766 0 1.566.137 1.566.137v1.72H9.3c-.869 0-1.14.54-1.14 1.094V7h1.94l-.31 2.023H8.16v4.891C11.44 13.388 14 10.493 14 7z" fill="#1877F2"/></svg>}
            onClick={() => handleSocial('Facebook')}
            loading={socialLoading === 'Facebook'}
          />
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
            href="/login"
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
