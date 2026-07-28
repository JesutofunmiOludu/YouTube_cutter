// ============================================================
// VidMind AI — useSubscription hook
// hooks/useSubscription.ts
//
// Reads subscription tier from the auth store and exposes:
//   - isPremium  — boolean
//   - tier       — 'free' | 'premium'
//   - canUse(feature) — boolean
//
// Feature caps mirror billing/services.py FREE_LIMITS and
// billing/models.py SubscriptionPlan feature flags.
// ============================================================

import { useAuthStore } from '@/store/auth.store'

// ── Feature capability map ────────────────────────────────
// -1 = unlimited  |  number = free-tier monthly/daily limit
// false = not available on free tier

export type GatedFeature =
  | 'ai_cuts'           // 3/month free
  | 'transcription'     // 3/month free
  | 'deep_research'     // 1/month free
  | 'multi_video_chat'  // premium only
  | 'batch_download'    // premium only
  | 'server_storage'    // premium only
  | 'search'            // 5/day free

/** Mirrors billing/services.py FREE_LIMITS + SubscriptionPlan flags */
const FREE_CAPS: Record<GatedFeature, number | false> = {
  ai_cuts:          3,     // per month
  transcription:    3,     // per month
  deep_research:    1,     // per month
  multi_video_chat: false, // premium only
  batch_download:   false, // premium only
  server_storage:   false, // premium only
  search:           5,     // per day
}

/** Human-readable labels for the UpgradeModal headline */
export const FEATURE_LABELS: Record<GatedFeature, string> = {
  ai_cuts:          'AI Video Cuts',
  transcription:    'Transcriptions',
  deep_research:    'Deep Research',
  multi_video_chat: 'Multi-Video Chat',
  batch_download:   'Batch Download',
  server_storage:   'Server File Storage',
  search:           'Video Searches',
}

/** Returns the free-tier cap for a feature (false = completely unavailable) */
export function getFreeCap(feature: GatedFeature): number | false {
  return FREE_CAPS[feature]
}

// ── Hook ──────────────────────────────────────────────────

export function useSubscription() {
  const user = useAuthStore((s) => s.user)
  const tier = user?.subscription_tier ?? 'free'
  const isPremium = tier === 'premium'

  /**
   * Returns true if the user can use this feature at all.
   * For premium users: always true.
   * For free users: true if the feature has any free allowance (even limited).
   */
  function canUse(feature: GatedFeature): boolean {
    if (isPremium) return true
    const cap = FREE_CAPS[feature]
    return cap !== false // false = premium-only
  }

  /**
   * Returns the free-tier monthly/daily cap for the feature.
   * Returns -1 (unlimited) for premium users.
   * Returns false if the feature is premium-only (not available on free).
   */
  function getCap(feature: GatedFeature): number | false {
    if (isPremium) return -1
    return FREE_CAPS[feature]
  }

  return { isPremium, tier, canUse, getCap }
}
