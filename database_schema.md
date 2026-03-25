# VidMind AI — Database Schema (3NF) & Frontend Component Tree

---

## Part 1: Database Design — Third Normal Form (3NF)

### 3NF Compliance Summary

**1NF (First Normal Form)** ✅
- Every table has a primary key
- All columns contain atomic (indivisible) values
- No repeating groups or arrays in columns (JSON used only for unstructured external metadata)

**2NF (Second Normal Form)** ✅
- All tables use single-column UUID primary keys
- Every non-key column is fully functionally dependent on the entire primary key
- No partial dependencies exist

**3NF (Third Normal Form)** ✅
- No transitive dependencies — non-key columns depend only on the primary key, not on other non-key columns
- Channel info extracted from VIDEO (channel_id, channel_name) to avoid channel_name depending on channel_id
- Subscription plan features extracted into SUBSCRIPTION_PLAN table — not stored on USER
- Language extracted into LANGUAGE lookup table
- Transcript broken into TRANSCRIPT_SEGMENT — segment text does not depend on video metadata
- Usage tracking split into USAGE_LOG (raw events) and USAGE_SUMMARY (aggregated) — summary stats don't depend on each other

---

## Part 2: Table Definitions

---

### Table: `language`
Lookup table for supported languages. Extracted to satisfy 3NF — `language_name` would otherwise transitively depend on `language_code` through user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| code | VARCHAR(10) | PK | BCP 47 language code (e.g. en, fr, yo) |
| name | VARCHAR(100) | NOT NULL | English name (e.g. English, French) |
| native_name | VARCHAR(100) | NOT NULL | Native name (e.g. Français, Yorùbá) |

**3NF Note:** Storing language_name directly on USER would create a transitive dependency: user.language_name → language_code → language. Extracting into this table eliminates that dependency.

---

### Table: `user`
Core user identity. Authentication credentials and profile only — subscription status is derived via the `subscription` table.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK, DEFAULT gen_random_uuid() | Primary key |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| password_hash | VARCHAR(255) | NULLABLE | NULL for social-only accounts |
| first_name | VARCHAR(100) | NOT NULL | |
| last_name | VARCHAR(100) | NOT NULL | |
| avatar_url | VARCHAR(500) | NULLABLE | Profile picture URL |
| country_code | VARCHAR(5) | NOT NULL | ISO 3166-1 alpha-2 (e.g. NG, US) |
| language_code | VARCHAR(10) | FK → language.code | Preferred UI language |
| is_active | BOOLEAN | DEFAULT TRUE | Account active flag |
| is_verified | BOOLEAN | DEFAULT FALSE | Email verification flag |
| last_login_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**3NF Note:** Subscription tier is NOT stored here. It is derived from the active `subscription` record. Storing it here would create a transitive dependency.

---

### Table: `social_auth`
Stores OAuth provider credentials separately from the core user identity. One user can have multiple social providers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| provider | VARCHAR(50) | NOT NULL | google, apple, facebook |
| provider_uid | VARCHAR(255) | NOT NULL | User ID from provider |
| access_token | TEXT | NULLABLE | Encrypted |
| refresh_token | TEXT | NULLABLE | Encrypted |
| token_expires_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Unique Constraint:** (provider, provider_uid)

---

### Table: `subscription_plan`
Defines available plans and their feature entitlements. Extracted from user/subscription to eliminate repeating feature columns across subscribers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| name | VARCHAR(50) | UNIQUE, NOT NULL | free, premium |
| description | TEXT | NULLABLE | |
| price_usd | DECIMAL(10,2) | NOT NULL | Monthly price in USD |
| price_ngn | DECIMAL(12,2) | NOT NULL | Monthly price in NGN |
| billing_cycle | VARCHAR(20) | NOT NULL | monthly, yearly |
| max_searches_per_day | INTEGER | NOT NULL | -1 = unlimited |
| max_cuts_per_month | INTEGER | NOT NULL | -1 = unlimited |
| max_transcriptions_per_month | INTEGER | NOT NULL | -1 = unlimited |
| can_deep_research | BOOLEAN | DEFAULT FALSE | |
| can_multi_video_chat | BOOLEAN | DEFAULT FALSE | |
| can_batch_download | BOOLEAN | DEFAULT FALSE | |
| can_server_storage | BOOLEAN | DEFAULT FALSE | |
| has_priority_processing | BOOLEAN | DEFAULT FALSE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**3NF Note:** Feature flags live here, not on `user` or `subscription`. This way changing a plan's features propagates automatically — no transitive dependency between user and their entitlements.

---

### Table: `subscription`
Tracks a user's active or historical subscription to a plan.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| plan_id | UUID | FK → subscription_plan.id, NOT NULL | |
| status | VARCHAR(20) | NOT NULL | active, cancelled, past_due, trialing |
| payment_provider | VARCHAR(30) | NOT NULL | stripe, flutterwave, paystack |
| provider_subscription_id | VARCHAR(255) | UNIQUE, NULLABLE | External subscription reference |
| provider_customer_id | VARCHAR(255) | NULLABLE | External customer reference |
| current_period_start | TIMESTAMP | NOT NULL | |
| current_period_end | TIMESTAMP | NOT NULL | |
| cancelled_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `payment`
Individual payment transactions. Separated from subscription to avoid multi-valued facts — a subscription has many payments.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| subscription_id | UUID | FK → subscription.id, NOT NULL | |
| user_id | UUID | FK → user.id, NOT NULL | Denormalized for query performance |
| amount | DECIMAL(12,2) | NOT NULL | |
| currency | VARCHAR(5) | NOT NULL | USD, NGN, GBP etc. |
| payment_provider | VARCHAR(30) | NOT NULL | stripe, flutterwave, paystack |
| provider_payment_id | VARCHAR(255) | UNIQUE, NOT NULL | External payment ID |
| status | VARCHAR(20) | NOT NULL | succeeded, failed, refunded |
| metadata | JSONB | NULLABLE | Provider-specific webhook data |
| paid_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `video`
Stores YouTube video metadata shared across all users. A video record is created once and reused — not duplicated per user.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| youtube_id | VARCHAR(20) | UNIQUE, NOT NULL | YouTube video ID (e.g. dQw4w9WgXcQ) |
| title | VARCHAR(500) | NOT NULL | |
| description | TEXT | NULLABLE | |
| thumbnail_url | VARCHAR(500) | NULLABLE | |
| duration_seconds | INTEGER | NOT NULL | |
| channel_id | VARCHAR(50) | NOT NULL | YouTube channel ID |
| channel_name | VARCHAR(255) | NOT NULL | Stored for display without extra API calls |
| category | VARCHAR(100) | NULLABLE | YouTube category |
| published_at | DATE | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**3NF Note:** `channel_name` has a transitive dependency via `channel_id`. In a large-scale system, extract a `channel` table. For Phase 1, this is an acceptable pragmatic denormalization — channel names rarely change.

---

### Table: `user_video`
Junction table linking a user to a video they have saved. Stores user-specific metadata (storage type, processing state).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| video_id | UUID | FK → video.id, NOT NULL | |
| storage_type | VARCHAR(20) | NOT NULL | reference (free), server (premium) |
| file_url | VARCHAR(500) | NULLABLE | Only populated for premium server storage |
| processing_status | VARCHAR(20) | NOT NULL | pending, processing, completed, failed |
| saved_at | TIMESTAMP | DEFAULT NOW() | |
| last_accessed_at | TIMESTAMP | NULLABLE | |

**Unique Constraint:** (user_id, video_id)

---

### Table: `video_cut`
Individual cut segments of a user's video. Each cut belongs to a `user_video`, not directly to a `video`, since cuts are user-specific.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_video_id | UUID | FK → user_video.id, NOT NULL | |
| cut_order | INTEGER | NOT NULL | Display order of the cut |
| start_seconds | INTEGER | NOT NULL | Cut start point in seconds |
| end_seconds | INTEGER | NOT NULL | Cut end point in seconds |
| title | VARCHAR(255) | NULLABLE | AI-generated or user-set title |
| ai_rationale | TEXT | NULLABLE | AI's explanation for this cut point |
| ai_suggested | BOOLEAN | DEFAULT TRUE | Was this cut AI-suggested? |
| user_approved | BOOLEAN | DEFAULT FALSE | Has user approved this cut? |
| download_url | VARCHAR(500) | NULLABLE | URL of the downloaded cut file |
| download_status | VARCHAR(20) | DEFAULT 'pending' | pending, processing, ready, failed |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `transcription`
One transcription per user_video. Full text and export file URLs.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_video_id | UUID | FK → user_video.id, UNIQUE, NOT NULL | One-to-one |
| language_code | VARCHAR(10) | FK → language.code, NOT NULL | Detected/selected language |
| full_text | TEXT | NULLABLE | Complete transcription text |
| status | VARCHAR(20) | NOT NULL | pending, processing, completed, failed |
| export_url_txt | VARCHAR(500) | NULLABLE | |
| export_url_pdf | VARCHAR(500) | NULLABLE | |
| export_url_md | VARCHAR(500) | NULLABLE | |
| completed_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `transcript_segment`
Individual timestamped segments of a transcription. Separated from `transcription` to satisfy 2NF — segment text depends on segment_id, not transcription_id.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| transcription_id | UUID | FK → transcription.id, NOT NULL | |
| segment_order | INTEGER | NOT NULL | |
| start_seconds | DECIMAL(8,3) | NOT NULL | Precise start time |
| end_seconds | DECIMAL(8,3) | NOT NULL | Precise end time |
| text | TEXT | NOT NULL | Segment transcript text |
| confidence_score | DECIMAL(5,4) | NULLABLE | 0.0000 to 1.0000 |

---

### Table: `chat_session`
A conversation workspace. Can contain one or many videos.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| title | VARCHAR(255) | NULLABLE | Auto-generated or user-set |
| is_multi_video | BOOLEAN | DEFAULT FALSE | Single or multi-video session |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `chat_session_video`
Junction table — links one or more user_videos to a chat session. Extracted to eliminate multi-valued facts in chat_session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| chat_session_id | UUID | FK → chat_session.id, NOT NULL | |
| user_video_id | UUID | FK → user_video.id, NOT NULL | |
| added_order | INTEGER | NOT NULL | Order in which videos were added |
| added_at | TIMESTAMP | DEFAULT NOW() | |

**Unique Constraint:** (chat_session_id, user_video_id)

---

### Table: `chat_message`
Individual messages in a chat session. Separated from chat_session — messages are a multi-valued fact.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| chat_session_id | UUID | FK → chat_session.id, NOT NULL | |
| role | VARCHAR(20) | NOT NULL | user, assistant |
| content | TEXT | NOT NULL | Message content |
| metadata | JSONB | NULLABLE | Token usage, model used, etc. |
| token_count | INTEGER | NULLABLE | For cost tracking |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `research_session`
A deep research session linked to a specific user video.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| user_video_id | UUID | FK → user_video.id, NOT NULL | |
| title | VARCHAR(255) | NULLABLE | Research topic/title |
| report_content | TEXT | NULLABLE | Full generated research report |
| status | VARCHAR(20) | NOT NULL | pending, processing, completed, failed |
| completed_at | TIMESTAMP | NULLABLE | |
| created_at | TIMESTAMP | DEFAULT NOW() | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `research_source`
Individual sources cited in a research report. Separated to eliminate multi-valued facts in research_session.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| research_session_id | UUID | FK → research_session.id, NOT NULL | |
| source_type | VARCHAR(20) | NOT NULL | article, paper, website, video |
| title | VARCHAR(500) | NOT NULL | |
| url | VARCHAR(1000) | NOT NULL | |
| excerpt | TEXT | NULLABLE | Relevant excerpt from source |
| relevance_rank | INTEGER | NOT NULL | Ordering by relevance |
| fetched_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `video_recommendation`
AI-generated video recommendations based on a user's saved video.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| source_user_video_id | UUID | FK → user_video.id, NOT NULL | The video that generated this recommendation |
| recommended_youtube_id | VARCHAR(20) | NOT NULL | Recommended video's YouTube ID |
| recommended_title | VARCHAR(500) | NOT NULL | |
| recommended_thumbnail_url | VARCHAR(500) | NULLABLE | |
| recommendation_type | VARCHAR(20) | NOT NULL | related_video, related_article |
| relevance_score | DECIMAL(5,4) | NULLABLE | 0.0000 to 1.0000 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table: `usage_log`
Raw log of user actions for usage enforcement (rate limiting free tier).

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| action_type | VARCHAR(50) | NOT NULL | search, cut, transcription, research, chat_message |
| resource_id | VARCHAR(255) | NULLABLE | Related resource UUID |
| log_date | DATE | NOT NULL | Date of action (for daily limits) |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Index:** (user_id, action_type, log_date) for fast limit checks

---

### Table: `usage_summary`
Aggregated daily usage per user. Separated from usage_log to avoid recomputing counts on every request.

| Column | Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PK | |
| user_id | UUID | FK → user.id, NOT NULL | |
| summary_date | DATE | NOT NULL | |
| searches_count | INTEGER | DEFAULT 0 | |
| cuts_count | INTEGER | DEFAULT 0 | |
| transcriptions_count | INTEGER | DEFAULT 0 | |
| research_count | INTEGER | DEFAULT 0 | |
| chat_messages_count | INTEGER | DEFAULT 0 | |
| updated_at | TIMESTAMP | DEFAULT NOW() | |

**Unique Constraint:** (user_id, summary_date)

---

## Part 3: Relationships Summary

| Relationship | Cardinality | Description |
|---|---|---|
| user → social_auth | 1 : Many | One user can have multiple OAuth providers |
| user → subscription | 1 : Many | User can have subscription history |
| subscription_plan → subscription | 1 : Many | Many users can subscribe to the same plan |
| subscription → payment | 1 : Many | One subscription generates many payments |
| user → user_video | 1 : Many | User saves many videos to their library |
| video → user_video | 1 : Many | One YouTube video can be saved by many users |
| user_video → video_cut | 1 : Many | One saved video has many cuts |
| user_video → transcription | 1 : 1 | One transcription per saved video |
| transcription → transcript_segment | 1 : Many | One transcription has many timed segments |
| user → chat_session | 1 : Many | User creates many chat sessions |
| chat_session → chat_session_video | 1 : Many | Session references many videos |
| user_video → chat_session_video | 1 : Many | Video referenced in many sessions |
| chat_session → chat_message | 1 : Many | Session contains many messages |
| user → research_session | 1 : Many | User runs many research sessions |
| user_video → research_session | 1 : Many | One video can have many research sessions |
| research_session → research_source | 1 : Many | Research cites many sources |
| user_video → video_recommendation | 1 : Many | Video generates many recommendations |
| user → usage_log | 1 : Many | Raw event logs per user |
| user → usage_summary | 1 : Many | Daily aggregated usage per user |
| language → user | 1 : Many | Language used by many users |
| language → transcription | 1 : Many | Language used in many transcriptions |

---

## Part 4: Key Database Indexes

```sql
-- User lookups
CREATE UNIQUE INDEX idx_user_email ON user(email);
CREATE INDEX idx_user_country ON user(country_code);

-- Social auth lookups
CREATE UNIQUE INDEX idx_social_auth_provider ON social_auth(provider, provider_uid);
CREATE INDEX idx_social_auth_user ON social_auth(user_id);

-- Video lookups
CREATE UNIQUE INDEX idx_video_youtube_id ON video(youtube_id);
CREATE INDEX idx_video_channel ON video(channel_id);

-- User video library
CREATE UNIQUE INDEX idx_user_video_unique ON user_video(user_id, video_id);
CREATE INDEX idx_user_video_user ON user_video(user_id);
CREATE INDEX idx_user_video_status ON user_video(processing_status);

-- Video cuts
CREATE INDEX idx_video_cut_user_video ON video_cut(user_video_id);
CREATE INDEX idx_video_cut_order ON video_cut(user_video_id, cut_order);

-- Transcription
CREATE UNIQUE INDEX idx_transcription_user_video ON transcription(user_video_id);
CREATE INDEX idx_transcript_segment_transcription ON transcript_segment(transcription_id);
CREATE INDEX idx_transcript_segment_order ON transcript_segment(transcription_id, segment_order);

-- Chat
CREATE INDEX idx_chat_session_user ON chat_session(user_id);
CREATE INDEX idx_chat_message_session ON chat_message(chat_session_id);
CREATE INDEX idx_chat_message_created ON chat_message(chat_session_id, created_at);

-- Research
CREATE INDEX idx_research_session_user ON research_session(user_id);
CREATE INDEX idx_research_source_session ON research_source(research_session_id, relevance_rank);

-- Usage enforcement
CREATE INDEX idx_usage_log_user_date ON usage_log(user_id, action_type, log_date);
CREATE UNIQUE INDEX idx_usage_summary_user_date ON usage_summary(user_id, summary_date);

-- Subscriptions
CREATE INDEX idx_subscription_user ON subscription(user_id);
CREATE INDEX idx_subscription_status ON subscription(user_id, status);
CREATE INDEX idx_payment_subscription ON payment(subscription_id);
```

---

## Part 5: Frontend Component Tree (React + TypeScript)

```
src/
│
├── App.tsx                             Root component, router setup
│
├── pages/
│   │
│   ├── Home/
│   │   ├── index.tsx                  Landing page (search bar + hero)
│   │   ├── SearchBar.tsx              YouTube URL or topic input
│   │   ├── HeroSection.tsx            Headline, tagline, CTA
│   │   ├── FeatureHighlights.tsx      3-column feature preview cards
│   │   └── VideoPreviewModal.tsx      Show AI cuts preview to unauthenticated user
│   │
│   ├── Auth/
│   │   ├── Login/
│   │   │   ├── index.tsx              Login page
│   │   │   ├── LoginForm.tsx          Email/password form
│   │   │   └── SocialLoginButtons.tsx Google, Apple, Facebook buttons
│   │   └── Register/
│   │       ├── index.tsx              Register page
│   │       ├── RegisterForm.tsx       Name, email, password
│   │       └── SocialLoginButtons.tsx (shared component)
│   │
│   ├── Dashboard/
│   │   ├── index.tsx                  Returning user dashboard
│   │   ├── DashboardHeader.tsx        Search bar + user greeting
│   │   ├── RecentVideos.tsx           Recently accessed video cards
│   │   ├── RecentResearch.tsx         Recent research sessions
│   │   ├── RecentChats.tsx            Recent chat sessions
│   │   └── UsageSummary.tsx           Free tier usage meter
│   │
│   ├── Search/
│   │   ├── index.tsx                  Topic search results page
│   │   ├── SearchResultsGrid.tsx      Grid of video results
│   │   ├── VideoResultCard.tsx        Individual video result card
│   │   ├── SearchFilters.tsx          Duration, category filters
│   │   └── SearchPagination.tsx       Load more / pagination
│   │
│   ├── VideoLibrary/
│   │   ├── index.tsx                  User's full video library
│   │   ├── LibraryHeader.tsx          Title + filter controls
│   │   ├── LibraryGrid.tsx            Grid of saved user_video cards
│   │   ├── LibraryVideoCard.tsx       Card: thumbnail, title, status badges
│   │   └── LibraryFilters.tsx         Filter by status, date, type
│   │
│   ├── VideoWorkspace/
│   │   ├── index.tsx                  Main video workspace (cuts, transcript, chat)
│   │   ├── VideoPlayer/
│   │   │   ├── VideoPlayer.tsx        YouTube embed player
│   │   │   ├── VideoControls.tsx      Play, pause, seek
│   │   │   └── VideoTimestamp.tsx     Current time display
│   │   ├── CutEditor/
│   │   │   ├── CutEditor.tsx          Main cutting interface
│   │   │   ├── CutTimeline.tsx        Visual timeline with cut markers
│   │   │   ├── CutSegmentCard.tsx     Individual segment with title + rationale
│   │   │   ├── CutApprovalBar.tsx     Approve all / reject all AI suggestions
│   │   │   ├── ManualCutControls.tsx  Add/remove cut points manually
│   │   │   └── DownloadManager.tsx    Single + batch download controls
│   │   ├── TranscriptPanel/
│   │   │   ├── TranscriptPanel.tsx    Full transcript display
│   │   │   ├── TranscriptSearch.tsx   Search within transcript
│   │   │   ├── TranscriptSegment.tsx  Clickable timestamped segment
│   │   │   └── ExportButtons.tsx      Export as TXT, PDF, Markdown
│   │   └── WorkspaceTabs.tsx          Tabs: Cuts | Transcript | Chat | Research
│   │
│   ├── Chat/
│   │   ├── index.tsx                  Chat page
│   │   ├── ChatSidebar/
│   │   │   ├── ChatSidebar.tsx        List of all chat sessions
│   │   │   ├── ChatSessionItem.tsx    Session title + last message preview
│   │   │   └── NewChatButton.tsx      Start new chat session
│   │   ├── ChatWindow/
│   │   │   ├── ChatWindow.tsx         Main chat interface
│   │   │   ├── MessageList.tsx        Scrollable list of messages
│   │   │   ├── MessageBubble.tsx      User or AI message bubble
│   │   │   ├── ChatInput.tsx          Message input + send button
│   │   │   ├── AddVideoButton.tsx     Add another video to session
│   │   │   └── AttachedVideos.tsx     Chips showing videos in session
│   │   └── ChatVideoDrawer.tsx        Side drawer showing attached video details
│   │
│   ├── Research/
│   │   ├── index.tsx                  Research page
│   │   ├── ResearchSidebar/
│   │   │   ├── ResearchSidebar.tsx    List of research sessions
│   │   │   └── ResearchSessionItem.tsx Session title + date
│   │   ├── ResearchReport/
│   │   │   ├── ResearchReport.tsx     Full report display
│   │   │   ├── ReportHeader.tsx       Title + video reference + date
│   │   │   ├── ReportBody.tsx         Rich text report content
│   │   │   ├── SourceCard.tsx         Individual cited source card
│   │   │   ├── SourcesList.tsx        All sources with links
│   │   │   └── ExportReport.tsx       Export report as PDF/Markdown
│   │   └── ResearchStatus.tsx         Processing indicator (AI at work)
│   │
│   ├── Subscription/
│   │   ├── index.tsx                  Upgrade / subscription page
│   │   ├── PricingTable.tsx           Free vs Premium comparison
│   │   ├── PaymentForm/
│   │   │   ├── PaymentForm.tsx        Smart payment form
│   │   │   ├── StripePayment.tsx      Stripe card elements (international)
│   │   │   └── FlutterwavePayment.tsx Flutterwave button (African markets)
│   │   └── SubscriptionStatus.tsx     Current plan status + renewal info
│   │
│   ├── Settings/
│   │   ├── index.tsx                  User settings page
│   │   ├── ProfileSettings.tsx        Name, avatar, email
│   │   ├── LanguageSettings.tsx       Preferred language selector
│   │   ├── SecuritySettings.tsx       Password change, 2FA
│   │   ├── NotificationSettings.tsx   Email preferences
│   │   └── DangerZone.tsx             Delete account
│   │
│   └── NotFound/
│       └── index.tsx                  404 page
│
├── components/                        Shared, reusable components
│   │
│   ├── ui/                            Primitive UI components
│   │   ├── Button.tsx                 Primary, secondary, ghost variants
│   │   ├── Input.tsx                  Text input with label + error
│   │   ├── Textarea.tsx               Multi-line input
│   │   ├── Select.tsx                 Dropdown select
│   │   ├── Modal.tsx                  Overlay modal with backdrop
│   │   ├── Drawer.tsx                 Side drawer panel
│   │   ├── Tooltip.tsx                Hover tooltip
│   │   ├── Badge.tsx                  Status / label badge
│   │   ├── Spinner.tsx                Loading spinner
│   │   ├── ProgressBar.tsx            Processing progress indicator
│   │   ├── Avatar.tsx                 User avatar with fallback initials
│   │   ├── Card.tsx                   Surface card container
│   │   ├── Tabs.tsx                   Tab navigation component
│   │   └── Toast.tsx                  Notification toasts
│   │
│   ├── layout/
│   │   ├── AppLayout.tsx              Main layout (sidebar + topbar + content)
│   │   ├── Sidebar.tsx                Navigation sidebar
│   │   ├── Topbar.tsx                 Top navigation bar
│   │   ├── MobileNav.tsx              Mobile bottom navigation
│   │   └── AuthLayout.tsx             Centered layout for auth pages
│   │
│   ├── video/
│   │   ├── VideoCard.tsx              Reusable video card (thumbnail + info)
│   │   ├── VideoThumbnail.tsx         Thumbnail with duration overlay
│   │   ├── VideoStatusBadge.tsx       Processing status indicator
│   │   └── VideoMetadata.tsx          Channel, duration, date display
│   │
│   ├── guards/
│   │   ├── AuthGuard.tsx              Redirect unauthenticated users
│   │   └── PremiumGuard.tsx           Block free users from premium features
│   │
│   └── feedback/
│       ├── EmptyState.tsx             Empty list / no results state
│       ├── ErrorBoundary.tsx          React error boundary
│       ├── PageLoader.tsx             Full-page loading skeleton
│       └── SkeletonCard.tsx           Card loading skeleton
│
├── types/                             TypeScript type definitions
│   ├── user.types.ts                  User, SocialAuth, Profile interfaces
│   ├── video.types.ts                 Video, UserVideo, VideoMeta interfaces
│   ├── cut.types.ts                   VideoCut, CutSuggestion interfaces
│   ├── transcription.types.ts         Transcription, Segment interfaces
│   ├── chat.types.ts                  ChatSession, ChatMessage interfaces
│   ├── research.types.ts              ResearchSession, Source interfaces
│   ├── subscription.types.ts          Plan, Subscription, Payment interfaces
│   └── api.types.ts                   API response wrappers, pagination
│
├── hooks/
│   ├── useAuth.ts                     Auth state + login/logout/register
│   ├── useVideos.ts                   Video search + library queries
│   ├── useUserVideo.ts                Single user_video operations
│   ├── useCuts.ts                     Cut management + downloads
│   ├── useTranscription.ts            Transcription fetch + export
│   ├── useChat.ts                     Chat session + message management
│   ├── useResearch.ts                 Research session management
│   ├── useSubscription.ts             Subscription status + upgrade
│   ├── useUsage.ts                    Usage limits + quota checks
│   └── usePayment.ts                  Payment processing hooks
│
├── services/                          Axios API call functions
│   ├── api.ts                         Axios instance + interceptors + refresh logic
│   ├── auth.service.ts                Login, register, social auth
│   ├── video.service.ts               Search, process, library
│   ├── cuts.service.ts                Get cuts, approve, download
│   ├── transcription.service.ts       Get transcript, export
│   ├── chat.service.ts                Sessions, messages, add video
│   ├── research.service.ts            Sessions, reports, sources
│   ├── subscription.service.ts        Plans, upgrade, cancel
│   ├── payment.service.ts             Stripe + Flutterwave integration
│   └── usage.service.ts               Fetch usage summary
│
├── store/                             Zustand global state
│   ├── auth.store.ts                  Current user + token state
│   ├── ui.store.ts                    Sidebar open, theme, toasts
│   └── player.store.ts                Video player current time state
│
├── utils/
│   ├── formatters.ts                  Date, duration, number formatting
│   ├── validators.ts                  Form validation helpers
│   ├── youtube.ts                     Extract YouTube ID from URL
│   └── constants.ts                   App-wide constants
│
└── styles/
    ├── index.css                      Tailwind base + global styles
    └── variables.css                  CSS custom properties
```

---

*This document defines the complete 3NF database schema and React + TypeScript component architecture for VidMind AI. Update as features evolve.*
