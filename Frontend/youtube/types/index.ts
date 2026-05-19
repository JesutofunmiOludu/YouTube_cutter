// ============================================================
// VidMind AI — Global TypeScript Types
// src/types/index.ts
//
// Shared types used across the entire frontend.
// Feature-specific types live in their own type files
// (e.g. src/types/video.ts, src/types/chat.ts).
// ============================================================


// ------------------------------------------------------------
// UTILITY TYPES
// ------------------------------------------------------------

/** Makes all properties of T optional recursively */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T

/** Extracts the value type of a Record */
export type ValueOf<T> = T[keyof T]

/** Makes specific keys of T required */
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Nullable wrapper */
export type Nullable<T> = T | null

/** Optional wrapper */
export type Maybe<T> = T | null | undefined


// ------------------------------------------------------------
// API TYPES
// ------------------------------------------------------------

/** Standard API paginated response from Django REST Framework */
export interface PaginatedResponse<T> {
  count:    number
  next:     Nullable<string>
  previous: Nullable<string>
  results:  T[]
}

/** Standard API error response */
export interface ApiError {
  detail?:              string
  non_field_errors?:    string[]
  [field: string]:      string | string[] | undefined
}

/** Generic API response wrapper */
export interface ApiResponse<T> {
  data:    T
  status:  number
  message: string
}


// ------------------------------------------------------------
// USER TYPES
// ------------------------------------------------------------

export type SubscriptionTier = 'free' | 'premium'

export interface User {
  id:              string
  email:           string
  first_name:      string
  last_name:       string
  avatar_url:      Nullable<string>
  country_code:    string
  language_code:   string
  is_active:       boolean
  is_verified:     boolean
  last_login_at:   Nullable<string>
  created_at:      string
  updated_at:      string
  /** Derived from subscription — not stored on user directly */
  subscription_tier: SubscriptionTier
}

export interface UserProfile extends Omit<User, 'subscription_tier'> {
  full_name: string
}


// ------------------------------------------------------------
// SUBSCRIPTION TYPES
// ------------------------------------------------------------

export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing'
export type PaymentProvider    = 'stripe' | 'flutterwave' | 'paystack'
export type BillingCycle       = 'monthly' | 'yearly'

export interface SubscriptionPlan {
  id:                           string
  name:                         string
  description:                  string
  price_usd:                    number
  price_ngn:                    number
  billing_cycle:                BillingCycle
  max_searches_per_day:         number   // -1 = unlimited
  max_cuts_per_month:           number   // -1 = unlimited
  max_transcriptions_per_month: number   // -1 = unlimited
  can_deep_research:            boolean
  can_multi_video_chat:         boolean
  can_batch_download:           boolean
  can_server_storage:           boolean
  has_priority_processing:      boolean
}

export interface Subscription {
  id:                      string
  user_id:                 string
  plan:                    SubscriptionPlan
  status:                  SubscriptionStatus
  payment_provider:        PaymentProvider
  current_period_start:    string
  current_period_end:      string
  cancelled_at:            Nullable<string>
  created_at:              string
}


// ------------------------------------------------------------
// VIDEO TYPES
// ------------------------------------------------------------

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type StorageType       = 'reference' | 'server'

export interface Video {
  id:               string
  youtube_id:       string
  title:            string
  description:      Nullable<string>
  thumbnail_url:    Nullable<string>
  duration_seconds: number
  channel_id:       string
  channel_name:     string
  category:         Nullable<string>
  published_at:     Nullable<string>
  created_at:       string
}

export interface UserVideo {
  id:                string
  user_id:           string
  video:             Video
  storage_type:      StorageType
  file_url:          Nullable<string>
  processing_status: ProcessingStatus
  saved_at:          string
  last_accessed_at:  Nullable<string>
}


// ------------------------------------------------------------
// VIDEO CUT TYPES
// ------------------------------------------------------------

export type DownloadStatus = 'pending' | 'processing' | 'ready' | 'failed'

export interface VideoCut {
  id:              string
  user_video_id:   string
  cut_order:       number
  start_seconds:   number
  end_seconds:     number
  title:           Nullable<string>
  ai_rationale:    Nullable<string>
  ai_suggested:    boolean
  user_approved:   boolean
  download_url:    Nullable<string>
  download_status: DownloadStatus
  created_at:      string
  updated_at:      string
  /** Computed client-side */
  duration_seconds: number
}


// ------------------------------------------------------------
// TRANSCRIPTION TYPES
// ------------------------------------------------------------

export interface TranscriptSegment {
  id:               string
  transcription_id: string
  segment_order:    number
  start_seconds:    number
  end_seconds:      number
  text:             string
  confidence_score: Nullable<number>
}

export type ExportFormat = 'txt' | 'pdf' | 'md'

export interface Transcription {
  id:              string
  user_video_id:   string
  language_code:   string
  full_text:       Nullable<string>
  status:          ProcessingStatus
  segments:        TranscriptSegment[]
  export_url_txt:  Nullable<string>
  export_url_pdf:  Nullable<string>
  export_url_md:   Nullable<string>
  completed_at:    Nullable<string>
  created_at:      string
}


// ------------------------------------------------------------
// CHAT TYPES
// ------------------------------------------------------------

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id:              string
  chat_session_id: string
  role:            MessageRole
  content:         string
  token_count:     Nullable<number>
  created_at:      string
}

export interface ChatSession {
  id:              string
  user_id:         string
  title:           Nullable<string>
  is_multi_video:  boolean
  videos:          UserVideo[]
  messages:        ChatMessage[]
  created_at:      string
  updated_at:      string
  /** Computed client-side */
  last_message:    Nullable<ChatMessage>
}


// ------------------------------------------------------------
// RESEARCH TYPES
// ------------------------------------------------------------

export type SourceType = 'article' | 'paper' | 'website' | 'video'

export interface ResearchSource {
  id:                  string
  research_session_id: string
  source_type:         SourceType
  title:               string
  url:                 string
  excerpt:             Nullable<string>
  relevance_rank:      number
  fetched_at:          string
}

export interface ResearchSession {
  id:            string
  user_id:       string
  user_video:    UserVideo
  title:         Nullable<string>
  report_content: Nullable<string>
  status:        ProcessingStatus
  sources:       ResearchSource[]
  completed_at:  Nullable<string>
  created_at:    string
  updated_at:    string
}


// ------------------------------------------------------------
// USAGE TYPES
// ------------------------------------------------------------

export interface UsageSummary {
  id:                   string
  user_id:              string
  summary_date:         string
  searches_count:       number
  cuts_count:           number
  transcriptions_count: number
  research_count:       number
  chat_messages_count:  number
}


// ------------------------------------------------------------
// UI STATE TYPES
// ------------------------------------------------------------

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id:        string
  type:      ToastType
  message:   string
  duration?: number   // ms, default 4000. Use 0 for no auto-dismiss.
}

export type ThemeMode = 'light' | 'dark' | 'system'

export interface UIState {
  sidebarOpen:  boolean
  theme:        ThemeMode
  toasts:       Toast[]
}


// ------------------------------------------------------------
// FORM TYPES
// ------------------------------------------------------------

export interface LoginFormValues {
  email:    string
  password: string
}

export interface RegisterFormValues {
  first_name:       string
  last_name:        string
  email:            string
  password:         string
  confirm_password: string
}

export interface ProfileFormValues {
  first_name:    string
  last_name:     string
  avatar_url:    Nullable<string>
  country_code:  string
  language_code: string
}


// ------------------------------------------------------------
// SEARCH / FILTER TYPES
// ------------------------------------------------------------

export type VideoDurationFilter = 'all' | 'short' | 'medium' | 'long'
export type VideoCategoryFilter = 'all' | 'tutorial' | 'lecture' | 'talk'
export type LibrarySortOrder    = 'recent' | 'oldest' | 'most_cuts' | 'title_az'

export interface VideoSearchParams {
  q:         string
  duration?: VideoDurationFilter
  category?: VideoCategoryFilter
  page?:     number
}

export interface LibraryFilterParams {
  status?: ProcessingStatus | 'all'
  sort?:   LibrarySortOrder
  search?: string
}

// ------------------------------------------------------------
// COMPONENT HANDLE TYPES
// ------------------------------------------------------------

export type { VideoPlayerHandle } from '@/components/video/VideoPlayer'
