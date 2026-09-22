// ============================================================
// ClipMide — Unified Auth Page (Login + Register)
// pages/auth/login.tsx
//
// Uses the pure-CSS split-card technique:
//  - A hidden <input type="checkbox"> drives all state
//  - CSS sibling selectors (~) slide the hero panel left/right
//  - No JavaScript animation needed
//  - Both login and register forms live on this single page
// ============================================================

import React, { useState }          from 'react'
import Link                         from 'next/link'
import { useRouter }                from 'next/router'
import { useForm }                  from 'react-hook-form'
import { apiClient }                from '@/utils/apiClient'
import { useAuthStore }             from '@/store/auth.store'
import { useToast }                 from '@components/ui/Toast'
import { useGoogleAuth }            from '@/hooks/useGoogleAuth'
import { Input }                    from '@components/ui/Input'
import { Button }                   from '@components/ui/Button'
import type { LoginFormValues, RegisterFormValues } from '@/types'

export const POST_VERIFY_REDIRECT_KEY = 'vidmind_post_verify_redirect'

// ── Google icon ──────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
)

const Spinner = () => (
  <svg style={{ width: 16, height: 16, animation: 'cm-spin 1s linear infinite' }} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
  </svg>
)

// ── Password strength ────────────────────────────────────────
function getStrength(pw: string) {
  let s = 0
  if (pw.length >= 8)           s++
  if (/[A-Z]/.test(pw))         s++
  if (/[0-9]/.test(pw))         s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const COLOURS = ['', '#dc2626', '#f59e0b', '#22c55e', '#16a34a']
  const LABELS  = ['', 'Weak', 'Fair', 'Strong', 'Very strong']
  return { score: s, label: LABELS[s] ?? '', colour: COLOURS[s] ?? '' }
}

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  const { score, label, colour } = getStrength(password)
  if (!password) return null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1,2,3,4].map((i) => (
          <div key={i} style={{ height: 3, flex: 1, borderRadius: 99, background: i <= score ? colour : 'var(--color-border-tertiary)', transition: 'background 0.25s ease' }} />
        ))}
      </div>
      {label && <span style={{ fontSize: '0.7rem', fontWeight: 500, color: colour }}>{label}</span>}
    </div>
  )
}

const Divider: React.FC<{ label?: string }> = ({ label = 'or continue with email' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
    <div style={{ flex: 1, height: 1, background: 'var(--color-border-tertiary)' }} />
    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: 'var(--color-border-tertiary)' }} />
  </div>
)

// ============================================================
// PAGE
// ============================================================
export default function AuthPage() {
  const router      = useRouter()
  const { setAuth } = useAuthStore()
  const { toast }   = useToast()
  // Static ID — only one auth card per page, no collision risk
  const toggleId    = 'cm-auth-toggle'

  const from      = (router.query.from as string) ?? '/dashboard'
  const intentUrl = router.query.url as string | undefined
  const intentQ   = router.query.q   as string | undefined

  const postVerifyRedirect = intentUrl
    ? `/workspace/new?url=${encodeURIComponent(intentUrl)}`
    : intentQ ? `/search?q=${encodeURIComponent(intentQ)}` : '/dashboard'

  const { handleGoogleLogin: googleLogin,    gisLoading: googleLoginLoading }    = useGoogleAuth({ redirectTo: from })
  const { handleGoogleLogin: googleRegister, gisLoading: googleRegisterLoading } = useGoogleAuth({ redirectTo: postVerifyRedirect })

  // ── Login form ─────────────────────────────────────────────
  const loginForm = useForm<LoginFormValues>({ defaultValues: { email: '', password: '' } })
  const onLogin = async (values: LoginFormValues) => {
    try {
      const res = await apiClient.post('/auth/login/', { email: values.email, password: values.password })
      const { user, access, refresh } = res.data
      setAuth(user, access, refresh)
      toast.success('Welcome back!')
      router.replace(from)
    } catch (err: unknown) {
      const data = (err as any)?.response?.data ?? {}
      if (data.email)            loginForm.setError('email',    { message: data.email[0] })
      if (data.password)         loginForm.setError('password', { message: data.password[0] })
      if (data.non_field_errors) toast.error(data.non_field_errors[0] ?? 'Login failed')
      else if (!data.email && !data.password) toast.error('Invalid email or password')
    }
  }

  // ── Register form ──────────────────────────────────────────
  const [password, setPassword] = useState('')
  const registerForm = useForm<RegisterFormValues>({
    defaultValues: { first_name: '', last_name: '', email: '', password: '', confirm_password: '' },
  })
  const onRegister = async (values: RegisterFormValues) => {
    if (values.password !== values.confirm_password) {
      registerForm.setError('confirm_password', { message: 'Passwords do not match' })
      return
    }
    try {
      const res = await apiClient.post('/auth/register/', {
        first_name: values.first_name, last_name: values.last_name,
        email: values.email, password: values.password, password2: values.confirm_password,
      })
      const { user, access, refresh } = res.data
      setAuth(user, access, refresh)
      toast.success('Account created! Check your inbox 📧')
      if (typeof window !== 'undefined') sessionStorage.setItem(POST_VERIFY_REDIRECT_KEY, postVerifyRedirect)
      router.replace('/auth/verify-email-pending')
    } catch (err: unknown) {
      const data = (err as any)?.response?.data ?? {}
      if (data.email)            registerForm.setError('email',    { message: data.email[0] })
      if (data.password)         registerForm.setError('password', { message: data.password[0] })
      if (data.non_field_errors) toast.error(data.non_field_errors[0] ?? 'Registration failed')
    }
  }

  const startOnRegister = router.query.mode === 'register'

  /* ── Shared inline style objects ── */
  const S = {
    page: {
      minHeight: '100dvh', display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-tertiary)',
      padding: '24px 16px', fontFamily: 'var(--font-dm-sans)',
    },
    brand: {
      display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
      textDecoration: 'none', color: 'var(--color-text-primary)',
      fontWeight: 600, fontSize: '1.125rem',
    },
    card: {
      position: 'relative' as const, overflow: 'hidden',
      width: '100%', maxWidth: 900, minHeight: 560,
      borderRadius: 20, border: '1px solid var(--color-border-tertiary)',
      background: 'var(--color-bg-primary)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,.07), 0 20px 40px -8px rgba(0,0,0,.14)',
    },
    heroPanel: {
      position: 'absolute' as const, zIndex: 3, top: 0, right: 0, bottom: 0,
      width: '43%',
      // No border-radius — card's overflow:hidden clips the corners
      background: 'radial-gradient(ellipse at 30% 30%, rgba(55,138,221,0.35) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(24,95,165,0.25) 0%, transparent 55%), linear-gradient(145deg, #0C1B2E 0%, #0E2240 45%, #122A50 100%)',
    },
    heroBase: {
      position: 'absolute' as const, zIndex: 4,
      width: '43%', height: '100%',
      display: 'flex', flexDirection: 'column' as const,
      alignItems: 'center', justifyContent: 'center',
      gap: 18, padding: '32px 28px', textAlign: 'center' as const,
      color: '#f0f4ff',
    },
    heroPill: {
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '10px 28px', borderRadius: 32,
      border: '1px solid rgba(255,255,255,0.22)',
      background: 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      color: '#fff', fontSize: 13, fontWeight: 600,
      letterSpacing: '0.8px', textTransform: 'uppercase' as const,
      cursor: 'pointer', userSelect: 'none' as const,
      transition: 'background 0.25s ease, color 0.25s ease',
    },
    formPanel: {
      position: 'absolute' as const,
      width: '57%', height: '100%',
      padding: '36px 40px 28px',
      display: 'flex', flexDirection: 'column' as const,
      justifyContent: 'center', overflowY: 'auto' as const,
    },
    googleBtn: {
      width: '100%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, height: 38,
      borderRadius: 8, border: '1px solid var(--color-border-secondary)',
      background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)',
      fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer',
      transition: 'background 0.15s ease',
    },
    fields: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
    nameRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    footer: { marginTop: 20, fontSize: '0.75rem', color: 'var(--color-text-tertiary)', textAlign: 'center' as const },
  }

  return (
    <>
      <style>{`
        @keyframes cm-spin { to { transform: rotate(360deg); } }

        /* Checkbox is invisible but drives everything via sibling CSS */
        #cm-auth-toggle { display: none; }

        /* Hero panel: default = RIGHT side (login state), flush with card edge */
        #cm-auth-toggle ~ .cm-hero-panel {
          translate: 0 0;
          transition: translate 0.65s cubic-bezier(0.76,0,0.24,1);
        }
        /* Checked = slides to LEFT (register state)
           -132.56% = -(57/43 * 100%) = moves panel 57% of card width to the left */
        #cm-auth-toggle:checked ~ .cm-hero-panel { translate: -132.56% 0; }

        /* Hero text sections */
        #cm-auth-toggle ~ .cm-hero-login  { opacity:1; visibility:visible; right:0; transition: opacity 0.65s ease, visibility 0.65s; }
        #cm-auth-toggle ~ .cm-hero-reg    { opacity:0; visibility:hidden;  left:0;  transition: opacity 0.65s ease, visibility 0.65s; }
        #cm-auth-toggle:checked ~ .cm-hero-login { opacity:0; visibility:hidden; }
        #cm-auth-toggle:checked ~ .cm-hero-reg   { opacity:1; visibility:visible; }

        /* Form panels */
        #cm-auth-toggle ~ .cm-form-login { left:0;  opacity:1; visibility:visible; transition: opacity 0.65s ease, visibility 0.65s; }
        #cm-auth-toggle ~ .cm-form-reg   { right:0; opacity:0; visibility:hidden;  transition: opacity 0.65s ease, visibility 0.65s; }
        #cm-auth-toggle:checked ~ .cm-form-login { opacity:0; visibility:hidden; }
        #cm-auth-toggle:checked ~ .cm-form-reg   { opacity:1; visibility:visible; }

        .cm-hero-pill:hover { background: rgba(255,255,255,0.92) !important; color: #0C1B2E !important; }
        .cm-google-btn:hover:not(:disabled) { background: var(--color-bg-secondary) !important; }
        .cm-footer-link { background:none; border:none; padding:0; font:inherit; color:var(--color-primary-600); font-weight:500; cursor:pointer; transition:color 0.15s; }
        .cm-footer-link:hover { color:var(--color-primary-800); }

        /* Watermark pattern on hero panel */
        .cm-hero-panel::before {
          content:'';
          position:absolute; inset:0; border-radius:inherit;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolygon points='23 7 16 12 23 17 23 7'/%3E%3Crect x='1' y='5' width='15' height='14' rx='2'/%3E%3C/svg%3E");
          background-size: 56px 56px;
        }

        /* Mobile: hide hero, show forms stacked */
        @media (max-width:680px) {
          .cm-hero-panel, .cm-hero-login, .cm-hero-reg { display:none !important; }
          .cm-form-login, .cm-form-reg {
            position:static !important; width:100% !important;
            opacity:1 !important; visibility:visible !important;
          }
          .cm-form-reg { display:none; }
          #cm-auth-toggle:checked ~ .cm-form-login { display:none !important; }
          #cm-auth-toggle:checked ~ .cm-form-reg   { display:flex !important; }
        }
      `}</style>

      <div style={S.page}>
        {/* Brand */}
        <Link href="/" style={S.brand} aria-label="ClipMide — go to home">
          <img src="/logo.png" alt="ClipMide" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span>ClipMide</span>
        </Link>

        {/* ── Card ── */}
        <div style={S.card}>

          {/* State brain: hidden checkbox */}
          <input type="checkbox" id={toggleId} defaultChecked={startOnRegister} aria-hidden="true" />

          {/* ── Sliding hero image panel ── */}
          <div className="cm-hero-panel" style={S.heroPanel} aria-hidden="true" />

          {/* ── Hero text: login side (right, default) ── */}
          <div className="cm-hero-login" style={S.heroBase} aria-hidden="true">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(148,198,255,0.75)', margin: 0 }}>
              New here?
            </p>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.8vw,1.9rem)', fontWeight: 700, lineHeight: 1.2, color: '#fff', margin: 0 }}>
              Start clipping<br/>smarter today
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(224,235,255,0.70)', lineHeight: 1.55, margin: 0 }}>
              Free forever. No credit card.<br/>
              Cut, transcribe & chat with any YouTube video.
            </p>
            <label htmlFor={toggleId} className="cm-hero-pill" style={S.heroPill}>
              Create account →
            </label>
          </div>

          {/* ── Hero text: register side (left, when checked) ── */}
          <div className="cm-hero-reg" style={S.heroBase} aria-hidden="true">
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(148,198,255,0.75)', margin: 0 }}>
              Already a member?
            </p>
            <h2 style={{ fontSize: 'clamp(1.4rem,2.8vw,1.9rem)', fontWeight: 700, lineHeight: 1.2, color: '#fff', margin: 0 }}>
              Welcome<br/>back
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'rgba(224,235,255,0.70)', lineHeight: 1.55, margin: 0 }}>
              Your clips and transcripts<br/>are waiting for you.
            </p>
            <label htmlFor={toggleId} className="cm-hero-pill" style={S.heroPill}>
              ← Log in
            </label>
          </div>

          {/* ════════════════════════════ LOGIN FORM ════════════════════════ */}
          <div className="cm-form-login" style={S.formPanel}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px', lineHeight: 1.2 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 20px' }}>
              Log in to your account
            </p>

            <button type="button" className="cm-google-btn" style={S.googleBtn} onClick={googleLogin} disabled={googleLoginLoading} aria-label="Continue with Google">
              {googleLoginLoading ? <Spinner /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>

            <Divider />

            <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate style={S.fields}>
              <Input
                label="Email address" type="email" placeholder="you@example.com"
                autoComplete="email" error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Input
                  label="Password" type="password" placeholder="••••••••"
                  autoComplete="current-password" error={loginForm.formState.errors.password?.message}
                  {...loginForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                  })}
                />
                <Link href="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--color-primary-600)', textDecoration: 'none', alignSelf: 'flex-end', transition: 'color 0.15s' }}>
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" variant="primary" size="md" fullWidth loading={loginForm.formState.isSubmitting}>
                Log in
              </Button>
            </form>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 16 }}>
              Don&apos;t have an account?{' '}
              <label htmlFor={toggleId} className="cm-footer-link">Sign up free</label>
            </p>
          </div>

          {/* ════════════════════════════ REGISTER FORM ════════════════════ */}
          <div className="cm-form-reg" style={S.formPanel}>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 4px', lineHeight: 1.2 }}>
              Create account
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
              Free forever. No credit card needed.
            </p>

            {(intentUrl || intentQ) && (
              <div style={{ padding: '8px 12px', background: 'var(--color-primary-50)', border: '1px solid rgba(24,95,165,0.2)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--color-primary-800)', marginBottom: 12 }}>
                {intentUrl ? '↗ Sign up to process your YouTube video' : `↗ Sign up to search for "${intentQ}"`}
              </div>
            )}

            <button type="button" className="cm-google-btn" style={S.googleBtn} onClick={googleRegister} disabled={googleRegisterLoading} aria-label="Sign up with Google">
              {googleRegisterLoading ? <Spinner /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>

            <Divider label="or sign up with email" />

            <form onSubmit={registerForm.handleSubmit(onRegister)} noValidate style={S.fields}>
              <div style={S.nameRow}>
                <Input label="First name" placeholder="Ada" autoComplete="given-name" error={registerForm.formState.errors.first_name?.message}
                  {...registerForm.register('first_name', { required: 'Required' })} />
                <Input label="Last name" placeholder="Okafor" autoComplete="family-name" error={registerForm.formState.errors.last_name?.message}
                  {...registerForm.register('last_name', { required: 'Required' })} />
              </div>
              <Input label="Email address" type="email" placeholder="you@example.com" autoComplete="email" error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email', {
                  required: 'Email is required',
                  pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                })}
              />
              <div>
                <Input label="Password" type="password" placeholder="Min. 8 characters" autoComplete="new-password" error={registerForm.formState.errors.password?.message}
                  {...registerForm.register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Must be at least 8 characters' },
                    onChange: (e) => setPassword(e.target.value),
                  })}
                />
                <PasswordStrength password={password} />
              </div>
              <Input label="Confirm password" type="password" placeholder="Re-enter your password" autoComplete="new-password" error={registerForm.formState.errors.confirm_password?.message}
                {...registerForm.register('confirm_password', { required: 'Please confirm your password' })} />
              <Button type="submit" variant="primary" size="md" fullWidth loading={registerForm.formState.isSubmitting}>
                Create free account
              </Button>
            </form>

            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', textAlign: 'center', marginTop: 16 }}>
              Already have an account?{' '}
              <label htmlFor={toggleId} className="cm-footer-link">Log in</label>
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
              By signing up you agree to our{' '}
              <Link href="/terms" style={{ color: 'inherit', textDecoration: 'underline' }}>Terms of Service</Link>
              {' '}and{' '}
              <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</Link>.
            </p>
          </div>

        </div>{/* /card */}

        <p style={S.footer}>© {new Date().getFullYear()} ClipMide. All rights reserved.</p>
      </div>
    </>
  )
}