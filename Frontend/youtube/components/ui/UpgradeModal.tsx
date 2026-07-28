// ============================================================
// VidMind AI — UpgradeModal
// components/ui/UpgradeModal.tsx
//
// A reusable premium upsell modal. Displayed when a free-tier
// user attempts to use a premium-gated or exhausted feature.
//
// Usage:
//   <UpgradeModal
//     open={showUpgrade}
//     onClose={() => setShowUpgrade(false)}
//     feature="deep_research"
//   />
// ============================================================

import { useRouter } from 'next/router'
import { Crown, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Modal } from './Modal'
import { Button } from './Button'
import type { GatedFeature } from '@/hooks/useSubscription'
import { FEATURE_LABELS } from '@/hooks/useSubscription'

// ── Feature-specific benefit copy ────────────────────────

interface FeatureInfo {
  headline: string
  sub:      string
  benefits: string[]
}

const FEATURE_INFO: Record<GatedFeature, FeatureInfo> = {
  deep_research: {
    headline: 'Unlimited Deep Research',
    sub:      "You've used your 1 free deep research report this month.",
    benefits: [
      'Unlimited deep research reports',
      'AI-synthesized multi-source citations',
      'Export to PDF, DOCX, and Markdown',
      'Priority AI processing',
    ],
  },
  multi_video_chat: {
    headline: 'Multi-Video Chat',
    sub:      'Chat across up to 10 videos simultaneously with Premium.',
    benefits: [
      'Chat with up to 10 videos at once',
      'Cross-video AI synthesis',
      'Unlimited chat messages',
      'Priority AI processing',
    ],
  },
  batch_download: {
    headline: 'Batch Download',
    sub:      'Download all your approved cut clips at once with Premium.',
    benefits: [
      'Download all approved clips in one click',
      '20 GB server file storage',
      'Unlimited AI video cuts',
      'Priority AI processing',
    ],
  },
  server_storage: {
    headline: 'Server File Storage',
    sub:      'Store your video files on our servers for fast access.',
    benefits: [
      '20 GB server file storage',
      'Access your files from any device',
      'Faster processing with stored files',
      'Batch download all cuts',
    ],
  },
  ai_cuts: {
    headline: 'Unlimited AI Cuts',
    sub:      "You've reached your 3 free AI video cuts this month.",
    benefits: [
      'Unlimited AI video cuts every month',
      'Unlimited transcriptions',
      'Batch download all cuts',
      'Priority AI processing',
    ],
  },
  transcription: {
    headline: 'Unlimited Transcriptions',
    sub:      "You've reached your 3 free transcriptions this month.",
    benefits: [
      'Unlimited transcriptions every month',
      'Unlimited AI video cuts',
      'Export transcripts to PDF/DOCX',
      'Priority AI processing',
    ],
  },
  search: {
    headline: 'Unlimited Video Searches',
    sub:      "You've used all 5 of your free searches today.",
    benefits: [
      'Unlimited video searches every day',
      'Unlimited deep research reports',
      'Unlimited AI video cuts',
      'Priority AI processing',
    ],
  },
}

// ── Props ──────────────────────────────────────────────────

export interface UpgradeModalProps {
  open:     boolean
  onClose:  () => void
  feature:  GatedFeature
}

// ── Component ─────────────────────────────────────────────

export function UpgradeModal({ open, onClose, feature }: UpgradeModalProps) {
  const router = useRouter()
  const info   = FEATURE_INFO[feature]

  const handleUpgrade = () => {
    onClose()
    router.push('/pricing')
  }

  return (
    <Modal open={open} onClose={onClose} size="sm">
      {/* ── Gradient header ── */}
      <div className="relative rounded-t-xl overflow-hidden">
        {/* gradient bar */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 opacity-90" />
        <div className="relative px-6 pt-7 pb-6 text-center flex flex-col items-center gap-3">
          {/* Crown icon */}
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white/30">
            <Crown className="w-7 h-7 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">
              Upgrade to Premium
            </h2>
            <p className="text-sm text-white/80 mt-1">
              {FEATURE_LABELS[feature]} is limited on the free plan
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <Modal.Body className="flex flex-col gap-4">
        {/* Sub-copy */}
        <p className="text-body-sm text-[var(--color-text-secondary)] text-center">
          {info.sub}
        </p>

        {/* Benefits list */}
        <ul className="flex flex-col gap-2.5">
          {info.benefits.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-2.5 h-2.5" aria-hidden="true" />
              </span>
              <span className="text-body-sm text-[var(--color-text-primary)]">{b}</span>
            </li>
          ))}
        </ul>

        {/* Pricing note */}
        <div className={cn(
          'rounded-lg px-4 py-3 text-center',
          'bg-amber-50 border border-amber-100',
        )}>
          <p className="text-body-sm font-semibold text-amber-900">
            From <span className="text-lg font-bold">$8</span>
            <span className="text-body-sm font-normal text-amber-700">/mo</span>
            {' · '}
            <span className="text-body-sm text-amber-700">billed yearly</span>
          </p>
          <p className="text-caption text-amber-600 mt-0.5">Cancel anytime · No credit card required to try</p>
        </div>
      </Modal.Body>

      {/* ── Footer ── */}
      <Modal.Footer align="center" className="flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={handleUpgrade}
          className="bg-gradient-to-r from-amber-500 to-orange-500 border-amber-500 hover:from-amber-600 hover:to-orange-600 hover:border-amber-600 text-white shadow-sm"
        >
          Upgrade to Premium
        </Button>
        <button
          onClick={onClose}
          className="text-body-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors py-1"
        >
          Maybe later
        </button>
      </Modal.Footer>
    </Modal>
  )
}
