'use client'

// src/app/(app)/settings/page.tsx
import { useState }   from 'react'
import { useRouter }  from 'next/navigation'
import { useForm }    from 'react-hook-form'
import {
  User, Lock, CreditCard, Trash2,
  Camera, Check, Globe, Apple, Users,
  LucideIcon
} from 'lucide-react'
import { cn }          from '@/utils/cn'
import { Button }      from '@/components/ui/Button'
import { Input }       from '@/components/ui/Input'
import { Badge }       from '@/components/ui/Badge'
import { Avatar }      from '@/components/ui/Avatar'
import { ConfirmModal } from '@/components/ui/Modal'
import { useToast }    from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth.store'

// ── Types ─────────────────────────────────────────────────

interface ProfileForm {
  first_name: string
  last_name:  string
  email:      string
}

interface PasswordForm {
  current_password:  string
  new_password:      string
  confirm_password:  string
}

type SettingsSection = 'profile' | 'security' | 'subscription' | 'danger'

// ── Section nav item ──────────────────────────────────────

function NavItem({ id, label, icon: Icon, active, onClick }: {
  id:      SettingsSection
  label:   string
  icon:    React.FC<{ className?: string }>
  active:  boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-left transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        active
          ? 'bg-primary-50 text-primary-800 font-medium'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      <span className="text-body-sm">{label}</span>
    </button>
  )
}

// ── Section wrapper ───────────────────────────────────────

function Section({ title, description, children }: {
  title:       string
  description?: string
  children:    React.ReactNode
}) {
  return (
    <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--color-border-tertiary)]">
        <h2 className="text-heading-md text-[var(--color-text-primary)]">{title}</h2>
        {description && (
          <p className="text-body-sm text-[var(--color-text-secondary)] mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Profile section ───────────────────────────────────────

function ProfileSection() {
  const { user, updateUser } = useAuthStore()
  const { toast }            = useToast()
  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim()

  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } =
    useForm<ProfileForm>({
      defaultValues: {
        first_name: user?.first_name ?? '',
        last_name:  user?.last_name  ?? '',
        email:      user?.email      ?? '',
      },
    })

  const onSubmit = async (values: ProfileForm) => {
    try {
      // TODO: await userService.updateProfile(values)
      await new Promise((r) => setTimeout(r, 600))
      updateUser({ first_name: values.first_name, last_name: values.last_name, email: values.email })
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to update profile. Please try again.')
    }
  }

  return (
    <Section title="Profile" description="Update your personal information.">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <Avatar src={user?.avatar_url} name={fullName} size="xl" />
          <button
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center hover:bg-primary-800 transition-colors"
            aria-label="Change avatar"
          >
            <Camera className="w-3 h-3" aria-hidden="true" />
          </button>
        </div>
        <div>
          <p className="text-body-sm font-medium text-[var(--color-text-primary)]">{fullName || 'Your Name'}</p>
          <p className="text-caption text-[var(--color-text-tertiary)]">{user?.email}</p>
          <Badge variant={user?.subscription_tier === 'premium' ? 'premium' : 'default'} size="sm" className="mt-1">
            {user?.subscription_tier === 'premium' ? 'Premium' : 'Free plan'}
          </Badge>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name" error={errors.first_name?.message}
            {...register('first_name', { required: 'First name is required' })} />
          <Input label="Last name" error={errors.last_name?.message}
            {...register('last_name', { required: 'Last name is required' })} />
        </div>
        <Input label="Email address" type="email" error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
          })} />
        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="md" loading={isSubmitting} disabled={!isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Section>
  )
}

// ── Security section ──────────────────────────────────────

function SecuritySection() {
  const { toast }  = useToast()
  const [showPw,   setShowPw]   = useState(false)

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } =
    useForm<PasswordForm>({ defaultValues: { current_password: '', new_password: '', confirm_password: '' } })

  const onSubmit = async (values: PasswordForm) => {
    if (values.new_password !== values.confirm_password) {
      setError('confirm_password', { message: 'Passwords do not match' }); return
    }
    try {
      // TODO: await authService.changePassword(values)
      await new Promise((r) => setTimeout(r, 700))
      toast.success('Password updated!')
      reset()
      setShowPw(false)
    } catch {
      toast.error('Current password is incorrect.')
    }
  }

  const connectedAccounts: { name: string; icon: LucideIcon; connected: boolean }[] = [
    { name: 'Google',   icon: Globe,    connected: true  },
    { name: 'Apple',    icon: Apple,    connected: false },
    { name: 'Facebook', icon: Users,    connected: false },
  ]

  return (
    <Section title="Security" description="Manage your password and connected accounts.">
      {/* Password */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-body-sm font-medium text-[var(--color-text-primary)]">Password</p>
            <p className="text-caption text-[var(--color-text-tertiary)]">Last changed 3 months ago</p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowPw((v) => !v)}>
            {showPw ? 'Cancel' : 'Change password'}
          </Button>
        </div>

        {showPw && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border-tertiary)]">
            <Input label="Current password" type="password" autoComplete="current-password"
              error={errors.current_password?.message}
              {...register('current_password', { required: 'Required' })} />
            <Input label="New password" type="password" autoComplete="new-password"
              error={errors.new_password?.message}
              {...register('new_password', { required: 'Required', minLength: { value: 8, message: 'Must be at least 8 characters' } })} />
            <Input label="Confirm new password" type="password" autoComplete="new-password"
              error={errors.confirm_password?.message}
              {...register('confirm_password', { required: 'Required' })} />
            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="md" loading={isSubmitting}>Update password</Button>
            </div>
          </form>
        )}

        {/* Connected accounts */}
        <div className="pt-4 border-t border-[var(--color-border-tertiary)]">
          <p className="text-body-sm font-medium text-[var(--color-text-primary)] mb-3">Connected accounts</p>
          <div className="flex flex-col gap-2">
            {connectedAccounts.map(({ name, icon: Icon, connected }) => (
              <div key={name} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  <span className="text-body-sm text-[var(--color-text-primary)]">{name}</span>
                  {connected && (
                    <span className="flex items-center gap-1 text-caption text-success-800">
                      <Check className="w-3 h-3" aria-hidden="true" /> Connected
                    </span>
                  )}
                </div>
                <Button variant="secondary" size="sm"
                  onClick={() => toast.info(`${connected ? 'Disconnect' : 'Connect'} ${name} coming soon`)}>
                  {connected ? 'Disconnect' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

// ── Subscription section ──────────────────────────────────

function SubscriptionSection() {
  const router    = useRouter()
  const { user }  = useAuthStore()
  const isPremium = user?.subscription_tier === 'premium'

  return (
    <Section title="Subscription" description="Manage your plan and billing.">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between p-4 bg-[var(--color-bg-secondary)] rounded-lg">
          <div>
            <p className="text-body-sm font-medium text-[var(--color-text-primary)]">
              {isPremium ? 'Premium plan' : 'Free plan'}
            </p>
            <p className="text-caption text-[var(--color-text-tertiary)]">
              {isPremium ? 'Renews Jan 15, 2026 · $96/year' : '5 searches · 3 cuts · 3 transcriptions per month'}
            </p>
          </div>
          <Badge variant={isPremium ? 'premium' : 'default'}>
            {isPremium ? 'Premium' : 'Free'}
          </Badge>
        </div>

        {!isPremium && (
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="md" leftIcon={<CreditCard className="w-4 h-4" />}
              onClick={() => router.push('/pricing')}>
              Upgrade to Premium
            </Button>
            <p className="text-caption text-[var(--color-text-tertiary)] text-center">
              From $8/month · Cancel anytime
            </p>
          </div>
        )}

        {isPremium && (
          <Button variant="secondary" size="md" leftIcon={<CreditCard className="w-4 h-4" />}
            onClick={() => router.push('/pricing')}>
            Manage subscription
          </Button>
        )}
      </div>
    </Section>
  )
}

// ── Danger zone ───────────────────────────────────────────

function DangerZoneSection() {
  const router    = useRouter()
  const { clearAuth } = useAuthStore()
  const { toast } = useToast()
  const [showDelete, setShowDelete] = useState(false)

  const handleDeleteAccount = async () => {
    try {
      // TODO: await userService.deleteAccount()
      await new Promise((r) => setTimeout(r, 800))
      clearAuth()
      toast.success('Account deleted.')
      router.push('/')
    } catch {
      toast.error('Failed to delete account. Contact support.')
    }
  }

  return (
    <Section title="Danger zone" description="Irreversible actions. Proceed with caution.">
      <div className="flex items-center justify-between p-4 border border-danger-200 rounded-lg bg-danger-50">
        <div>
          <p className="text-body-sm font-medium text-danger-800">Delete account</p>
          <p className="text-caption text-danger-600">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
        </div>
        <Button variant="danger" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={() => setShowDelete(true)}>
          Delete
        </Button>
      </div>

      <ConfirmModal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="This will permanently delete all your videos, cuts, chats, and research reports. This action cannot be undone."
        confirmLabel="Yes, delete my account"
        cancelLabel="Cancel"
        variant="danger"
      />
    </Section>
  )
}

// ── Page ─────────────────────────────────────────────────

const SECTIONS: { id: SettingsSection; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'profile',      label: 'Profile',       icon: User       },
  { id: 'security',     label: 'Security',      icon: Lock       },
  { id: 'subscription', label: 'Subscription',  icon: CreditCard },
  { id: 'danger',       label: 'Danger zone',   icon: Trash2     },
]

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  return (
    <div className="max-w-content mx-auto flex flex-col gap-6">
      <h1 className="text-heading-xl text-[var(--color-text-primary)]">Settings</h1>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav
          className="hidden md:flex flex-col gap-1 w-48 shrink-0"
          aria-label="Settings sections"
        >
          {SECTIONS.map((s) => (
            <NavItem
              key={s.id}
              {...s}
              active={activeSection === s.id}
              onClick={() => setActiveSection(s.id)}
            />
          ))}
        </nav>

        {/* Mobile nav */}
        <div className="md:hidden w-full">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'flex-shrink-0 px-3 py-1.5 rounded-full text-caption font-medium border transition-colors',
                  activeSection === s.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border-secondary)]',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">
          {activeSection === 'profile'      && <ProfileSection />}
          {activeSection === 'security'     && <SecuritySection />}
          {activeSection === 'subscription' && <SubscriptionSection />}
          {activeSection === 'danger'       && <DangerZoneSection />}
        </div>
      </div>
    </div>
  )
}
