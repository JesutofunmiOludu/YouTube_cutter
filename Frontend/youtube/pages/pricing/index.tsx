'use client'

// src/app/(app)/pricing/page.tsx
import { useState } from 'react'
import { useRouter } from 'next/router'
import { Check, Crown, Zap, ArrowRight } from 'lucide-react'
import { cn }          from '@/utils/cn'
import { Button }      from '@/components/ui/Button'
import { Badge }       from '@/components/ui/Badge'
import { useAuthStore } from '@/store/auth.store'
import { useToast }    from '@/components/ui/Toast'

// ── Plan config ───────────────────────────────────────────

interface Plan {
  id:          'free' | 'premium'
  name:        string
  monthlyPrice: number
  yearlyPrice:  number
  description: string
  features:    { label: string; included: boolean }[]
  cta:         string
  highlighted: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0,
    description: 'Perfect for trying VidMind AI and light personal use.',
    cta: 'Current plan',
    highlighted: false,
    features: [
      { label: '5 video searches per day',        included: true  },
      { label: '3 AI video cuts per month',        included: true  },
      { label: '3 transcriptions per month',       included: true  },
      { label: 'Basic chat (1 video per session)', included: true  },
      { label: 'YouTube reference storage only',   included: true  },
      { label: 'Unlimited video cuts',             included: false },
      { label: 'Deep research reports',            included: false },
      { label: 'Multi-video chat',                 included: false },
      { label: 'Server file storage',              included: false },
      { label: 'Batch download',                   included: false },
      { label: 'Priority AI processing',           included: false },
    ],
  },
  {
    id: 'premium', name: 'Premium', monthlyPrice: 12, yearlyPrice: 96,
    description: 'For serious learners, researchers, and content creators.',
    cta: 'Upgrade to Premium',
    highlighted: true,
    features: [
      { label: 'Unlimited video searches',         included: true },
      { label: 'Unlimited AI video cuts',          included: true },
      { label: 'Unlimited transcriptions',         included: true },
      { label: 'Multi-video chat (up to 10)',      included: true },
      { label: 'Server file storage (20 GB)',      included: true },
      { label: 'Deep research reports',            included: true },
      { label: 'Batch download all cuts',          included: true },
      { label: 'Priority AI processing',           included: true },
      { label: 'Export to PDF, DOCX, Markdown',   included: true },
      { label: 'API access (coming soon)',         included: true },
      { label: 'Early access to new features',     included: true },
    ],
  },
]

type BillingCycle = 'monthly' | 'yearly'
type PaymentTab   = 'card' | 'flutterwave' | 'paystack'

// ── Feature row ───────────────────────────────────────────

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={cn(
        'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        included ? 'bg-success-50 text-success-800' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]',
      )}>
        {included
          ? <Check className="w-2.5 h-2.5" aria-hidden="true" />
          : <span className="w-1.5 h-px bg-current" aria-hidden="true" />
        }
      </span>
      <span className={cn('text-body-sm', included ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)] line-through decoration-[var(--color-text-tertiary)]')}>
        {label}
      </span>
    </li>
  )
}

// ── Plan card ─────────────────────────────────────────────

function PlanCard({ plan, billing, onUpgrade, isCurrentPlan }: {
  plan:          Plan
  billing:       BillingCycle
  onUpgrade:     () => void
  isCurrentPlan: boolean
}) {
  const price = billing === 'yearly' ? plan.yearlyPrice / 12 : plan.monthlyPrice
  const savings = plan.monthlyPrice > 0
    ? Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice) / (plan.monthlyPrice * 12)) * 100)
    : 0

  return (
    <div className={cn(
      'relative flex flex-col rounded-2xl p-6 border',
      plan.highlighted
        ? 'border-2 border-primary-200 bg-[var(--color-bg-primary)]'
        : 'border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]',
    )}>
      {/* Most popular badge */}
      {plan.highlighted && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-600 text-white text-caption font-medium">
            <Crown className="w-3 h-3" aria-hidden="true" />
            Most popular
          </span>
        </div>
      )}

      {/* Plan name */}
      <div className="mb-4">
        <h3 className="text-heading-lg text-[var(--color-text-primary)] mb-1">{plan.name}</h3>
        <p className="text-body-sm text-[var(--color-text-secondary)]">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-end gap-1">
          <span className="text-display-lg text-[var(--color-text-primary)] font-medium">
            ${Math.round(price)}
          </span>
          <span className="text-body-sm text-[var(--color-text-tertiary)] mb-2">/month</span>
        </div>
        {billing === 'yearly' && plan.yearlyPrice > 0 && (
          <p className="text-caption text-success-800">
            Billed ${plan.yearlyPrice}/year · Save {savings}%
          </p>
        )}
        {plan.monthlyPrice === 0 && (
          <p className="text-caption text-[var(--color-text-tertiary)]">Free forever</p>
        )}
      </div>

      {/* CTA */}
      <Button
        variant={plan.highlighted ? 'primary' : 'secondary'}
        size="md"
        fullWidth
        disabled={isCurrentPlan && plan.id === 'free'}
        onClick={plan.id === 'premium' ? onUpgrade : undefined}
        rightIcon={plan.highlighted ? <ArrowRight className="w-4 h-4" /> : undefined}
        className={cn(
          'mb-6',
          plan.highlighted && 'shadow-sm',
        )}
      >
        {isCurrentPlan && plan.id === 'free' ? 'Current plan' : plan.cta}
      </Button>

      {/* Features */}
      <ul className="flex flex-col gap-2.5">
        {plan.features.map((f) => (
          <FeatureRow key={f.label} {...f} />
        ))}
      </ul>
    </div>
  )
}

// ── Payment tabs ──────────────────────────────────────────

function PaymentMethodTabs({ active, onChange }: {
  active: PaymentTab; onChange: (t: PaymentTab) => void
}) {
  const tabs: { id: PaymentTab; label: string; sub: string }[] = [
    { id: 'card',        label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Amex'       },
    { id: 'flutterwave', label: 'Flutterwave',          sub: 'Africa-first payments'        },
    { id: 'paystack',    label: 'Paystack',              sub: 'Nigeria, Ghana, South Africa' },
  ]

  return (
    <div className="flex flex-col gap-2">
      <p className="text-label text-[var(--color-text-tertiary)] uppercase tracking-wider">Payment method</p>
      <div className="flex flex-col gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors',
              active === t.id
                ? 'border-primary-200 bg-primary-50'
                : 'border-[var(--color-border-secondary)] bg-[var(--color-bg-primary)] hover:border-[var(--color-border-primary)]',
            )}
          >
            <div className={cn(
              'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
              active === t.id ? 'border-primary-600' : 'border-[var(--color-border-secondary)]',
            )}>
              {active === t.id && <div className="w-2 h-2 rounded-full bg-primary-600" />}
            </div>
            <div>
              <p className="text-body-sm font-medium text-[var(--color-text-primary)]">{t.label}</p>
              <p className="text-caption text-[var(--color-text-tertiary)]">{t.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────

export default function PricingPage() {
  const router     = useRouter()
  const { user }   = useAuthStore()
  const { toast }  = useToast()

  const [billing,     setBilling]     = useState<BillingCycle>('yearly')
  const [paymentTab,  setPaymentTab]  = useState<PaymentTab>('card')
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [showPayment, setShowPayment] = useState(false)

  const isPremium = user?.subscription_tier === 'premium'

  const handleUpgrade = async () => {
    setIsUpgrading(true)
    try {
      // TODO: call subscriptionService.createCheckout({ billing, paymentMethod: paymentTab })
      await new Promise((r) => setTimeout(r, 1000))
      toast.success('Redirecting to checkout…')
      // router.push(checkoutUrl)
    } catch {
      toast.error('Failed to start checkout. Please try again.')
    } finally {
      setIsUpgrading(false)
    }
  }

  if (isPremium) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-premium-50 flex items-center justify-center">
          <Crown className="w-8 h-8 text-premium-600" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-heading-xl text-[var(--color-text-primary)] mb-2">You're on Premium</h1>
          <p className="text-body-md text-[var(--color-text-secondary)]">
            You have full access to all VidMind AI features. Manage your subscription below.
          </p>
        </div>
        <div className="w-full bg-[var(--color-bg-secondary)] rounded-xl p-5 text-left flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-[var(--color-text-secondary)]">Plan</span>
            <Badge variant="premium">Premium</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-[var(--color-text-secondary)]">Billing</span>
            <span className="text-body-sm font-medium text-[var(--color-text-primary)]">$96 / year</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-[var(--color-text-secondary)]">Next renewal</span>
            <span className="text-body-sm font-medium text-[var(--color-text-primary)]">Jan 15, 2026</span>
          </div>
        </div>
        <Button variant="danger" size="md" onClick={() => toast.info('Contact support to cancel.')}>
          Cancel subscription
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-content mx-auto flex flex-col gap-8">

      {/* Header */}
      <div className="text-center">
        <h1 className="text-display-md text-[var(--color-text-primary)] mb-3">Simple, transparent pricing</h1>
        <p className="text-body-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
          Start free. Upgrade when you're ready to unlock everything.
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBilling('monthly')}
          className={cn('text-body-sm font-medium transition-colors', billing === 'monthly' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]')}
        >
          Monthly
        </button>
        <button
          onClick={() => setBilling(billing === 'monthly' ? 'yearly' : 'monthly')}
          className={cn(
            'relative w-12 h-6 rounded-full transition-colors',
            billing === 'yearly' ? 'bg-primary-600' : 'bg-[var(--color-border-secondary)]',
          )}
          aria-label="Toggle billing cycle"
          role="switch"
          aria-checked={billing === 'yearly'}
        >
          <span className={cn(
            'absolute top-1 w-4 h-4 rounded-full bg-white transition-[left] duration-base',
            billing === 'yearly' ? 'left-7' : 'left-1',
          )} />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBilling('yearly')}
            className={cn('text-body-sm font-medium transition-colors', billing === 'yearly' ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-tertiary)]')}
          >
            Yearly
          </button>
          <Badge variant="success" size="sm">Save 33%</Badge>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            onUpgrade={() => setShowPayment(true)}
            isCurrentPlan={!isPremium}
          />
        ))}
      </div>

      {/* Payment method section */}
      {showPayment && (
        <div className="max-w-md mx-auto w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-xl p-6 flex flex-col gap-5 animate-slide-up">
          <div>
            <h3 className="text-heading-md text-[var(--color-text-primary)] mb-1">Complete your upgrade</h3>
            <p className="text-body-sm text-[var(--color-text-secondary)]">
              {billing === 'yearly' ? 'Billed $96/year' : 'Billed $12/month'} · Cancel anytime
            </p>
          </div>
          <PaymentMethodTabs active={paymentTab} onChange={setPaymentTab} />
          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isUpgrading}
            leftIcon={<Zap className="w-4 h-4" />}
            onClick={handleUpgrade}
          >
            {isUpgrading ? 'Redirecting to checkout…' : 'Proceed to checkout'}
          </Button>
          <p className="text-caption text-[var(--color-text-tertiary)] text-center">
            Secured by {paymentTab === 'card' ? 'Stripe' : paymentTab === 'flutterwave' ? 'Flutterwave' : 'Paystack'} · 256-bit encryption
          </p>
        </div>
      )}

      {/* FAQ */}
      <div className="max-w-2xl mx-auto w-full">
        <h2 className="text-heading-lg text-[var(--color-text-primary)] mb-5 text-center">FAQ</h2>
        <div className="flex flex-col gap-3">
          {[
            { q: 'Can I cancel anytime?',         a: 'Yes — cancel with one click. Your Premium access continues until the end of the billing period.' },
            { q: 'What payment methods do you accept?', a: 'We accept all major cards via Stripe, and also Flutterwave and Paystack for African users (covering 34+ African countries).' },
            { q: 'Is the free plan really free?',  a: 'Yes, completely. No credit card required. The free plan stays free forever with its limits.' },
            { q: 'What happens to my files if I downgrade?', a: 'Your YouTube references are kept. Server-stored files are archived for 30 days then deleted.' },
          ].map(({ q, a }) => (
            <div key={q} className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
              <p className="text-body-sm font-medium text-[var(--color-text-primary)] mb-1">{q}</p>
              <p className="text-body-sm text-[var(--color-text-secondary)]">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}