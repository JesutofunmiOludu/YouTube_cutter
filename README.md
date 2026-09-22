<div align="center">

<img src="https://img.shields.io/badge/ClipMide-v1.0.0-185FA5?style=for-the-badge&logoColor=white" alt="ClipMide" />

# ✂️ ClipMide

### AI-Powered YouTube Video Intelligence Platform

*Cut, transcribe, chat, and research — all from a single YouTube link.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=flat-square)]()
[![Python](https://img.shields.io/badge/Python-3.14+-3776AB?style=flat-square&logo=python&logoColor=white)]()
[![Django](https://img.shields.io/badge/Django-6.0+-092E20?style=flat-square&logo=django&logoColor=white)]()
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=nextdotjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)]()

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Reference](#-api-reference) • [Roadmap](#-roadmap)

---

</div>

## 📖 Overview

**ClipMide** is a full-stack, AI-powered platform that transforms how you consume YouTube content. Paste any YouTube link and ClipMide will:

- **Transcribe** the video using YouTube's caption API or Gemini AI
- **Generate smart cut points** with AI-written rationale for each segment
- **Let you chat** with the video content in natural language
- **Run deep research** on the topic with cited web sources
- **Search YouTube** and discover related content — up to 50 results per query

> **The problem:** A developer wants to learn from a 4-hour YouTube tutorial. They waste 20 minutes finding the right section, take notes manually, and lose context switching between YouTube, Google, and their note app.
>
> **ClipMide's answer:** Paste the link. The AI cuts it, transcribes it, and you can ask it anything.

---

## ✨ Features

### 🔍 YouTube Search
- Search any topic and get up to 50 results (10 / 25 / 50 per-page selector)
- Filter by duration and sort by relevance, view count, date, or rating
- Direct "Process this video" action from any search result
- Per-user throttling (30 searches/hour) to protect API quota

### ✂️ AI Video Cutting
- Paste a YouTube URL → background pipeline fetches metadata, transcript, and generates AI cut suggestions
- Each cut comes with a title and AI rationale explaining *why* that segment matters
- Approve or reject individual AI suggestions, or fine-tune manually
- Processing stages visible in real-time: Metadata → Transcript → Downloading → Transcribing → Saving

### 📝 Transcription Engine
- **Standard mode** — pulls YouTube's own captions (fast, free, no quota cost)
- **Extended mode** — downloads audio via yt-dlp and transcribes with Gemini AI (for videos without captions)
- Full timestamped transcript segments stored per user-video
- Export as TXT, PDF, or Markdown

### 💬 Chat with Video
- Multi-turn AI conversation grounded in the video transcript
- Ask follow-up questions, request summaries, or quiz yourself
- Multi-video sessions — add several videos and chat across all of them
- Powered by Google Gemini

### 🔬 Deep Research
- Enter a topic and get an AI-generated research report with cited web sources
- Each source listed with title, URL, and a relevance excerpt
- Optional video context — anchor research to a specific saved video
- Follow-up questions generated automatically for further exploration

### 👤 Authentication
- Split-card login/register UI — pure CSS sliding panel animation, no JavaScript
- Email + password registration with email verification flow
- Google OAuth one-click sign-in
- JWT access + refresh token rotation with token blacklisting on logout
- Argon2 password hashing (industry-leading KDF)

### 💳 Subscription & Usage
- Free tier with daily/monthly limits enforced server-side
- Premium tier unlocks unlimited searches, cuts, transcriptions, multi-video chat, and deep research
- Usage tracked per-action in `UsageLog` with aggregated `UsageSummary` for fast limit checks
- Payment integration ready for Stripe, Flutterwave, and Paystack

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      BROWSER / CLIENT                     │
│                                                           │
│   Next.js 14 (Pages Router) · TypeScript · Tailwind CSS  │
│   Zustand · Axios · react-hook-form · DM Sans font       │
└─────────────────────────┬────────────────────────────────┘
                          │  REST API  (JWT Bearer token)
                          ▼
┌──────────────────────────────────────────────────────────┐
│              DJANGO 6 + Django REST Framework             │
│                                                           │
│  ┌──────────┐  ┌──────────┐  ┌────────┐  ┌───────────┐  │
│  │  Users   │  │  videos  │  │  chat  │  │  billing  │  │
│  │  app     │  │  app     │  │  app   │  │  app      │  │
│  └──────────┘  └──────────┘  └────────┘  └───────────┘  │
│                                                           │
│  Thread-based background pipeline (daemon threads)        │
│  Metadata → Transcript → Download → Transcribe → Save    │
└──────┬──────────────────────────┬────────────────────────┘
       │                          │
       ▼                          ▼
┌─────────────┐        ┌──────────────────────────────────┐
│  SQLite     │        │       EXTERNAL SERVICES           │
│  (dev)   /  │        │                                   │
│  PostgreSQL │        │  Google Gemini (AI + chat)        │
│  (prod)     │        │  YouTube Data API v3 (search)     │
│             │        │  YouTube Transcript API (captions)│
│  13 B-tree  │        │  yt-dlp (audio download)          │
│  indexes    │        │  Google OAuth 2.0 (social login)  │
└─────────────┘        └──────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **Next.js** | 14+ | React framework (Pages Router) |
| **TypeScript** | 5+ | Type-safe development |
| **Tailwind CSS** | 3+ | Utility-first styling |
| **Zustand** | 4+ | Global auth + UI state |
| **Axios** | 1+ | HTTP client with JWT interceptors |
| **react-hook-form** | 7+ | Form state + validation |
| **DM Sans** | — | Primary typeface (Google Fonts) |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Python** | 3.14+ | Backend language |
| **Django** | 6.0+ | Web framework |
| **Django REST Framework** | 3.17+ | REST API layer |
| **djangorestframework-simplejwt** | 5.5+ | JWT auth + token blacklisting |
| **django-cors-headers** | 4.9+ | CORS for Next.js frontend |
| **django-debug-toolbar** | 6.2+ | Development query inspector |
| **python-decouple** | 3.8+ | Environment-variable based config |
| **argon2-cffi** | 25+ | Argon2 password hashing |

### AI & Data
| Library / Service | Purpose |
|---|---|
| **google-generativeai** | Gemini AI — video cuts, transcription, chat, research |
| **google-auth** | Google OAuth token verification |
| **youtube-transcript-api** | Pull YouTube captions without quota cost |
| **yt-dlp** | Download audio for extended AI transcription |
| **requests** | YouTube Data API v3 search calls |

### Database
| Technology | Purpose |
|---|---|
| **SQLite** | Development (zero-config, ships with Python) |
| **PostgreSQL 15+** | Production (recommended) |
| 13 composite B-tree indexes | Optimized for all hot query paths |

---

## 📁 Project Structure

```
YouTube_cutter/
│
├── Backend/                          # Django backend
│   ├── myproject/
│   │   ├── settings.py               # All settings (decouple for env vars)
│   │   └── urls.py                   # Root URL router
│   │
│   ├── Users/                        # Custom user model, auth, Google OAuth
│   │   ├── models.py                 # User, Language, SocialAccount
│   │   ├── views.py                  # Register, login, logout, Google login
│   │   └── serializers.py
│   │
│   ├── videos/                       # Video library, cuts, transcriptions
│   │   ├── models.py                 # Video, UserVideo, VideoCut,
│   │   │                             #   Transcription, TranscriptSegment
│   │   ├── views.py                  # VideoSearchView, workspace views,
│   │   │                             #   cut label AI, processing trigger
│   │   ├── processing_pipeline.py    # Background pipeline orchestrator
│   │   └── ai_service.py             # Gemini AI cut generation
│   │
│   ├── chat/                         # Chat, research, web search
│   │   ├── models.py                 # ChatSession, ChatMessage,
│   │   │                             #   ResearchSession, VideoSearchSession
│   │   ├── views.py                  # Chat + research endpoints
│   │   └── search_views.py           # Perplexity-style AI web search
│   │
│   ├── billing/                      # Subscriptions, payments, usage
│   │   ├── models.py                 # SubscriptionPlan, Subscription,
│   │   │                             #   Payment, UsageLog, UsageSummary
│   │   └── services.py               # UsageService (premium check, limits)
│   │
│   ├── pyproject.toml                # Python deps managed by uv
│   ├── manage.py
│   └── .env                          # Local environment variables
│
└── Frontend/
    └── youtube/                      # Next.js application
        ├── pages/
        │   ├── auth/
        │   │   ├── login.tsx          # Unified split-card login + register
        │   │   └── verify-email/
        │   ├── dashboard/             # User video library
        │   ├── workspace/             # Video player + cuts + transcript
        │   ├── search/                # YouTube search with filters
        │   ├── chat/                  # AI chat sessions
        │   ├── research/              # Deep research sessions
        │   ├── library/               # Full video library
        │   ├── pricing/               # Subscription plans
        │   └── settings/             # Account + billing settings
        │
        ├── components/
        │   ├── layout/               # AppLayout, AuthLayout, Sidebar, Topbar
        │   └── ui/                   # Button, Input, Badge, Toast, Modal...
        │
        ├── hooks/                    # useGoogleAuth, useSubscription, etc.
        ├── store/                    # auth.store.ts (Zustand)
        ├── utils/                    # apiClient.ts (Axios + JWT interceptors)
        ├── styles/globals.css        # Design tokens + Tailwind config
        └── package.json
```

---

## 🗄️ Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `user` | Custom user model (email-based, Argon2 passwords) |
| `social_account` | Google OAuth provider + UID |
| `video` | Shared YouTube metadata (deduped across users) |
| `user_video` | User ↔ video junction (per-user processing state) |
| `video_cut` | AI-suggested cut segments per user-video |
| `transcription` | One full transcription per user-video |
| `transcript_segment` | Timestamped text chunks |
| `chat_session` | Conversation workspace (supports multi-video) |
| `chat_message` | Individual messages with role + metadata |
| `research_session` | Deep research reports with status tracking |
| `video_search_session` | Perplexity-style AI web search results |
| `subscription_plan` | Plan definitions + feature flags |
| `subscription` | User ↔ plan link with status + provider |
| `usage_log` | Raw action events for limit enforcement |
| `usage_summary` | Aggregated daily counts (avoids recomputing) |

**13 composite B-tree indexes** cover all hot query paths: user dashboards, workspace loads, premium checks, and usage enforcement.

---

## 🚀 Getting Started

### Prerequisites

```
Python  >= 3.14
uv      >= 0.4       (recommended package manager)
Node.js >= 18.0
npm     >= 9.0
```

> **uv** is the recommended Python package manager for this project.
> Install it from [astral.sh/uv](https://astral.sh/uv).

---

### 1. Clone

```bash
git clone https://github.com/JesutofunmiOludu/YouTube_cutter.git
cd YouTube_cutter
```

---

### 2. Backend Setup

```bash
cd Backend

# Install all dependencies with uv
uv sync

# Copy and configure environment variables
cp .env.example .env
```

#### Backend `.env`

```env
# Django Core
SECRET_KEY=your-super-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Database (omit to use SQLite in development)
# DATABASE_URL=postgresql://user:password@localhost:5432/clipmide

# AI Services
GOOGLE_GEMINI_API_KEY=AIzaSy...
YOUTUBE_DATA_API_KEY=AIzaSy...

# Google OAuth
GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxx

# Payments (optional for local dev)
STRIPE_SECRET_KEY=sk_test_xxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxxx
PAYSTACK_SECRET_KEY=sk_test_xxxx
```

```bash
# Run database migrations
uv run python manage.py migrate

# Create a superuser (for Django admin)
uv run python manage.py createsuperuser

# Start the API server
uv run python manage.py runserver
```

API is now live at **`http://localhost:8000`**

---

### 3. Frontend Setup

```bash
cd Frontend/youtube

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

#### Frontend `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
```

```bash
# Start the development server
npm run dev
```

Web app is now live at **`http://localhost:3000`**

---

### 4. Access Points

| Service | URL |
|---|---|
| **ClipMide Web App** | `http://localhost:3000` |
| **Django REST API** | `http://localhost:8000/api/` |
| **Django Admin Panel** | `http://localhost:8000/admin/` |

---

## 📡 API Reference

### Authentication

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/register/` | POST | Create account (email + password) |
| `/api/auth/login/` | POST | Login → returns `access` + `refresh` tokens |
| `/api/auth/logout/` | POST | Blacklist refresh token |
| `/api/auth/token/refresh/` | POST | Rotate access token |
| `/api/auth/google/` | POST | Verify Google ID token → login or create account |
| `/api/auth/me/` | GET | Current user profile |

All protected endpoints require:
```http
Authorization: Bearer <access_token>
```

### Videos

| Endpoint | Method | Description |
|---|---|---|
| `/api/videos/search/` | GET | Search YouTube (`?q=&limit=25&order=relevance&duration=any`) |
| `/api/videos/process/` | POST | Add YouTube URL + trigger processing pipeline |
| `/api/videos/library/` | GET | User's saved video library |
| `/api/videos/<id>/` | GET | Video + UserVideo details |
| `/api/videos/<id>/status/` | GET | Real-time pipeline status (poll this) |
| `/api/videos/<id>/cuts/` | GET / POST | List or create cut segments |
| `/api/videos/<id>/cuts/<cut_id>/` | PATCH / DELETE | Edit or remove a cut |
| `/api/videos/<id>/cuts/<cut_id>/label/` | GET | AI-generated title + rationale for a cut |
| `/api/videos/<id>/transcription/` | GET | Full transcript + timestamped segments |

### Chat & Research

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat/sessions/` | GET / POST | List or create chat sessions |
| `/api/chat/sessions/<id>/messages/` | GET / POST | Message history or send message |
| `/api/chat/sessions/<id>/videos/` | POST | Add a video to a session |
| `/api/chat/search/` | GET / POST | AI web search with cited sources |
| `/api/chat/research/` | GET / POST | Deep research sessions |
| `/api/chat/research/<id>/` | GET | Research report + sources |

### Billing

| Endpoint | Method | Description |
|---|---|---|
| `/api/billing/plans/` | GET | Available subscription plans |
| `/api/billing/subscription/` | GET | Current user subscription status |
| `/api/billing/usage/` | GET | Daily usage summary |

---

## 💳 Subscription Tiers

| Feature | Free | Premium |
|---|:---:|:---:|
| YouTube searches / day | 10 | Unlimited |
| AI video cuts / month | 5 | Unlimited |
| Transcriptions / month | 5 | Unlimited |
| Chat with video | Single video | Multi-video |
| Deep research reports | ❌ | ✅ |
| AI web search | ❌ | ✅ |
| Batch downloads | ❌ | ✅ |
| Server-side video storage | ❌ | ✅ |
| Priority processing | ❌ | ✅ |

---

## 🔐 Security

- **Argon2 password hashing** — industry-leading KDF (replaces Django's default PBKDF2)
- **JWT with blacklisting** — short-lived access tokens + refresh rotation; tokens blacklisted on logout
- **Google OAuth** — ID token verified server-side with `google-auth`, not blindly trusted from client
- **Secret key guard** — Django raises `ImproperlyConfigured` at startup if deployed with the default insecure key
- **Rate limiting** — search throttled at 30/hour per user via DRF `ScopedRateThrottle`
- **Input validation** — DRF serializer validation on all write endpoints
- **CORS** — strict origin control via `django-cors-headers`
- **SQL injection** — Django ORM parameterized queries throughout
- **CSRF** — Django's built-in middleware enabled

---

## 🧪 Testing

### Backend
```bash
cd Backend

# Run all tests
uv run python manage.py test

# With coverage report
uv run pip install coverage
uv run coverage run manage.py test
uv run coverage report
uv run coverage html          # Open htmlcov/index.html in browser
```

### Frontend
```bash
cd Frontend/youtube

npm run lint        # ESLint checks
npm run build       # TypeScript type-check + production build
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Custom user model with Argon2 hashing + email verification
- [x] JWT authentication + Google OAuth one-click sign-in
- [x] Unified split-card login/register UI (pure CSS sliding panel)
- [x] YouTube search with filters and 10/25/50 results per-page selector
- [x] Full AI processing pipeline (metadata → transcript → download → AI → cuts)
- [x] AI-generated cut points with title + rationale via Gemini
- [x] Standard (YouTube captions) + Extended (Gemini AI) transcription modes
- [x] Timestamped transcript segments (3NF schema)
- [x] Chat with video (Gemini multi-turn)
- [x] AI deep research with cited web sources
- [x] Perplexity-style AI web search
- [x] Free-tier usage enforcement (daily + monthly limits)
- [x] Subscription plan model with feature flags
- [x] 13 database performance indexes across all hot query paths
- [x] Light + dark mode design system (CSS custom properties)
- [x] Fully normalized database schema (3NF)

### 🔜 Planned
- [ ] Celery + Redis async task queue (replacing thread-based pipeline)
- [ ] PostgreSQL production deployment
- [ ] Stripe + Flutterwave + Paystack payment integration
- [ ] Transcript export (TXT, PDF, Markdown)
- [ ] Batch cut downloads
- [ ] Video timeline visual editor
- [ ] Multi-video chat sessions (UI)
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] Notion / Obsidian / Google Docs export
- [ ] Public API for developers

---

## 📦 Key Dependencies

### Backend (`pyproject.toml`)
```toml
django >= 6.0.3
djangorestframework >= 3.17.0
djangorestframework-simplejwt >= 5.5.1
django-cors-headers >= 4.9.0
django-debug-toolbar >= 6.2.0
google-generativeai >= 0.8.6
google-auth >= 2.56.2
youtube-transcript-api >= 1.2.4
yt-dlp >= 2026.7.4
requests >= 2.34.2
python-decouple >= 3.8
argon2-cffi >= 25.1.0
```

### Frontend (`package.json`)
```
next · react · react-dom
typescript
tailwindcss
zustand
axios
react-hook-form
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit with conventional commits: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

**Commit types:**
```
feat:      New feature
fix:       Bug fix
docs:      Documentation only
refactor:  Code change without new feature or bug fix
perf:      Performance improvement
test:      Adding or updating tests
chore:     Maintenance / tooling
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Django](https://www.djangoproject.com/) — The web framework for perfectionists with deadlines
- [Django REST Framework](https://www.django-rest-framework.org/) — Powerful REST API toolkit
- [Next.js](https://nextjs.org/) — The React framework for the web
- [Google Gemini](https://deepmind.google/technologies/gemini/) — Video intelligence, transcription & deep research
- [YouTube Transcript API](https://github.com/jdepoix/youtube-transcript-api) — Caption extraction
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — Feature-rich media downloader
- [uv](https://astral.sh/uv) — Blazing-fast Python package manager

---

<div align="center">

**Built with ❤️ to make learning faster and smarter**

[GitHub](https://github.com/JesutofunmiOludu/YouTube_cutter) • [Contact](mailto:hello@clipmide.com)

</div>
