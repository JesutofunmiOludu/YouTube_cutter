<div align="center">

<img src="https://img.shields.io/badge/VidMind_AI-v1.0.0-2563EB?style=for-the-badge&logoColor=white" alt="VidMind AI" />

# 🎬 VidMind AI

### Smart Video Learning & Research Platform

*Stop watching. Start understanding.*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequests.com)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange?style=flat-square)]()
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)]()
[![Django](https://img.shields.io/badge/Django-4.2+-092E20?style=flat-square&logo=django&logoColor=white)]()
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)]()

[Features](#-features) • [Architecture](#-architecture) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API Docs](#-api-reference) • [Contributing](#-contributing)

---

</div>

## 📖 Overview

**VidMind AI** is a full-stack, AI-powered video learning and research platform that transforms how users consume long-form YouTube content. Inspired by the frustration of sitting through hours of tutorial videos just to find one key insight, VidMind AI acts as a personal AI research assistant — intelligently cutting videos into digestible segments, transcribing content, enabling deep research with cited sources, and facilitating multi-video AI conversations.

> **The Problem:** A developer wants to learn React from a 4-hour YouTube tutorial. They don't know where the relevant sections are, can't easily take notes, and have to jump between YouTube, Google, and note-taking apps just to learn one concept.

> **The Solution:** VidMind AI. Paste the link, let the AI slice it into chapters, chat with the content, and get a cited research report — all in one place.

---

## ✨ Features

### 🔍 Smart Video Discovery
- Search any topic and receive a curated list of relevant YouTube videos
- Paste a YouTube link for immediate AI processing
- Personalized recommendations based on viewing and research history

### ✂️ AI-Powered Video Cutting
- AI analyzes the full video and suggests optimal cut points with reasoning
- One-click approval of all AI suggestions or manual fine-tuning of cut points
- Download individual clips or batch-download all cuts at once
- Visual timeline editor for precise manual adjustments

### 📝 Transcription Engine
- Full video transcription powered by OpenAI Whisper
- Searchable transcripts linked to exact video timestamps
- Multi-language support
- Export transcriptions as TXT, PDF, or Markdown

### 💬 Chat with Video
- Ask natural language questions about any video
- Full multi-turn conversation with follow-up support
- Add multiple videos to a single chat session
- AI synthesizes and compares insights across multiple videos

### 🔬 Deep Research
- Powered by **Google Gemini Deep Research** (Interactions API)
- AI autonomously searches the internet for relevant articles, papers, and websites
- Delivers a comprehensive, fully cited research report
- Multimodal input support — video, PDFs, and images
- Sources clearly listed and directly accessible

### 📚 Personal Video Library
- Organized dashboard of all saved videos, cuts, and research sessions
- Free users: YouTube references + metadata stored
- Premium users: Actual video files stored on platform servers
- Search and filter across your entire library

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│                                                                  │
│   ┌─────────────────────┐     ┌──────────────────────────┐      │
│   │  React (TypeScript) │     │  React Native Mobile App │      │
│   │   Web Application   │     │   (iOS + Android)        │      │
│   └──────────┬──────────┘     └────────────┬─────────────┘      │
│              └──────────────┬──────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │ REST API (JSON)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                              │
│              (Rate Limiting · Auth · Routing)                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│               DJANGO + DJANGO REST FRAMEWORK                     │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐ │
│  │  Users   │ │ Videos   │ │  Cuts    │ │ Research / Chat    │ │
│  │  App     │ │  App     │ │  App     │ │ App                │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘ │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Celery Worker (Async Task Queue)               │   │
│  │   Video Processing · AI Jobs · Transcription Tasks      │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
┌──────────────┐   ┌──────────────┐  ┌──────────────────┐
│  PostgreSQL  │   │    Redis     │  │  Cloudflare R2   │
│  (Primary DB)│   │(Cache+Queue) │  │ (Video Storage)  │
└──────────────┘   └──────────────┘  └──────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXTERNAL AI SERVICES                         │
│                                                                  │
│  ┌──────────────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐  │
│  │Google Gemini │  │ OpenAI   │  │ Anthropic  │  │ YouTube  │  │
│  │Deep Research │  │ Whisper  │  │  Claude    │  │ Data API │  │
│  └──────────────┘  └──────────┘  └────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend (Web)
| Technology | Purpose |
|---|---|
| **React 18** | Web UI framework |
| **TypeScript 5+** | Type-safe development |
| **Tailwind CSS** | Utility-first styling |
| **React Query** | Server state & API caching |
| **Zustand** | Lightweight client state management |
| **Axios** | HTTP client for Django REST API |
| **React Router v6** | Client-side routing |

### Mobile
| Technology | Purpose |
|---|---|
| **React Native** | Cross-platform iOS & Android app |
| **Expo** | React Native toolchain |
| **React Navigation** | Mobile navigation |
| **React Query** | Shared API state logic with web |

### Backend
| Technology | Purpose |
|---|---|
| **Python 3.11+** | Backend language |
| **Django 4.2+** | Web framework |
| **Django REST Framework** | REST API layer |
| **djangorestframework-simplejwt** | JWT authentication |
| **django-allauth** | Social login (Google, Apple, Facebook) |
| **django-cors-headers** | CORS for React frontend |
| **Celery** | Async background task queue |
| **django-storages** | Cloudflare R2 / S3 file storage |

### Data & Infrastructure
| Technology | Purpose |
|---|---|
| **PostgreSQL 15+** | Primary relational database |
| **Redis 7+** | Celery broker + cache layer |
| **Cloudflare R2** | Video file storage (premium users) |
| **Docker + Docker Compose** | Containerization |
| **GitHub Actions** | CI/CD pipeline |

### AI Services
| Service | Feature |
|---|---|
| **Google Gemini** | Smart video cutting & analysis |
| **Google Gemini Deep Research** | Deep research with cited sources & related articles |
| **OpenAI Whisper** | Video transcription |
| **Anthropic Claude** | Chat with video (multi-turn conversations) |
| **YouTube Data API v3** | Video search & recommendations |

### Payments & Auth
| Service | Purpose |
|---|---|
| **Stripe** | International payments |
| **Flutterwave / Paystack** | African market payments |
| **django-allauth** | Social OAuth (Google, Apple, Facebook) |

---

## 🚀 Getting Started

### Prerequisites

```bash
python >= 3.11
pip >= 23.0
node >= 18.0.0
npm >= 9.0.0
postgresql >= 15.0
redis >= 7.0
docker (optional but recommended)
```

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/vidmind-ai.git
cd vidmind-ai
```

### 2. Backend Setup (Django)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
```

### 3. Frontend Setup (React + TypeScript)

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### 4. Mobile Setup (React Native)

```bash
cd mobile

# Install dependencies
npm install

# Install Expo CLI globally
npm install -g expo-cli
```

### 5. Environment Variables

#### Backend — `backend/.env`

```env
# ─── DJANGO CORE ─────────────────────────────────────────
SECRET_KEY=your-super-secret-django-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# ─── DATABASE ────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/vidmind

# ─── REDIS / CELERY ──────────────────────────────────────
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# ─── AI SERVICES ─────────────────────────────────────────
GOOGLE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
YOUTUBE_DATA_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX

# ─── STORAGE ─────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLOUDFLARE_R2_BUCKET_NAME=vidmind-videos

# ─── PAYMENTS ────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_LIVE-xxxxxxxxxxxxxxxxxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── VIDEO PROCESSING ────────────────────────────────────
VIDEO_PROCESSOR_SERVICE_URL=https://your-video-processor.com
VIDEO_PROCESSOR_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ─── SOCIAL AUTH ─────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APPLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
APPLE_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Frontend — `frontend/.env.local`

```env
REACT_APP_API_BASE_URL=http://localhost:8000/api/v1
REACT_APP_YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxx
REACT_APP_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_LIVE-xxxxxxxxxxxxxxxxxx
```

### 6. Database Setup

```bash
cd backend

# Run Django migrations
python manage.py migrate

# Create a superuser (for Django admin panel)
python manage.py createsuperuser

# Seed initial data (optional)
python manage.py loaddata initial_data
```

### 7. Start All Services

#### Option A — Docker Compose (Recommended)

```bash
# From project root — starts everything
docker-compose up
```

#### Option B — Manual Start

```bash
# Terminal 1 — Django API server
cd backend && source venv/bin/activate
python manage.py runserver 0.0.0.0:8000

# Terminal 2 — Celery worker (AI & video tasks)
cd backend && source venv/bin/activate
celery -A config worker --loglevel=info

# Terminal 3 — Celery beat (scheduled tasks)
cd backend && source venv/bin/activate
celery -A config beat --loglevel=info

# Terminal 4 — React + TypeScript frontend
cd frontend && npm start

# Terminal 5 — React Native (optional)
cd mobile && expo start
```

### 8. Access the App

```
Django API:         http://localhost:8000/api/v1/
Django Admin:       http://localhost:8000/admin/
React Web App:      http://localhost:3000/
Swagger API Docs:   http://localhost:8000/api/docs/
```

---

## 📁 Project Structure

```
vidmind-ai/
│
├── backend/                            # Django backend
│   ├── config/                         # Django project config
│   │   ├── settings/
│   │   │   ├── base.py                 # Shared settings
│   │   │   ├── development.py          # Dev-only settings
│   │   │   └── production.py           # Production settings
│   │   ├── urls.py                     # Root URL configuration
│   │   ├── celery.py                   # Celery configuration
│   │   └── wsgi.py
│   │
│   ├── apps/
│   │   ├── users/                      # User management & auth
│   │   ├── videos/                     # Video management & processing
│   │   ├── cuts/                       # AI video cutting
│   │   ├── transcription/              # Whisper transcription
│   │   ├── chat/                       # Chat with video (Claude)
│   │   ├── research/                   # Deep research (Gemini)
│   │   └── payments/                   # Stripe & Flutterwave
│   │
│   ├── services/                       # External service integrations
│   │   ├── gemini.py                   # Google Gemini service
│   │   ├── whisper.py                  # OpenAI Whisper service
│   │   ├── claude.py                   # Anthropic Claude service
│   │   ├── youtube.py                  # YouTube Data API service
│   │   └── video_processor.py          # Video processing service
│   │
│   ├── requirements.txt
│   ├── requirements.dev.txt
│   ├── manage.py
│   └── .env.example
│
├── frontend/                           # React (TypeScript) web app
│   ├── src/
│   │   ├── pages/                      # Route-level page components
│   │   │   ├── Home/                   # Landing page
│   │   │   ├── Dashboard/              # User dashboard
│   │   │   ├── Library/                # Video library
│   │   │   ├── VideoPlayer/            # Video + cuts interface
│   │   │   ├── Chat/                   # Chat with video
│   │   │   ├── Research/               # Deep research
│   │   │   └── Auth/                   # Login / Signup
│   │   ├── components/                 # Reusable UI components
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── services/                   # Axios API service calls
│   │   ├── store/                      # Zustand state stores
│   │   ├── types/                      # TypeScript type definitions
│   │   └── App.tsx
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── mobile/                             # React Native (Expo) app
│   ├── src/
│   │   ├── screens/
│   │   ├── components/
│   │   ├── navigation/
│   │   └── services/                   # Shared API services
│   ├── app.json
│   └── package.json
│
├── docs/
│   ├── masterplan.md
│   └── architecture/
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── README.md
```

---

## 📡 API Reference

### Base URL
```
Production:   https://api.vidmindai.com/api/v1
Development:  http://localhost:8000/api/v1
Swagger UI:   http://localhost:8000/api/docs/
```

### Authentication
```http
POST /auth/token/             # Login → returns access + refresh tokens
POST /auth/token/refresh/     # Refresh access token
POST /auth/register/          # Register new user
POST /auth/social/google/     # Google OAuth login
```

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

### Core Endpoints

#### Videos
```http
GET    /videos/search/?q={topic}        Search YouTube videos by topic
POST   /videos/process/                 Process a YouTube URL
GET    /videos/{id}/                    Get video details
GET    /videos/library/                 Get user's video library
DELETE /videos/{id}/                    Remove video from library
```

#### Video Cuts
```http
GET    /videos/{id}/cuts/               Get AI-suggested cut points
POST   /videos/{id}/cuts/approve/       Approve all AI suggestions
POST   /videos/{id}/cuts/custom/        Save custom cut points
GET    /videos/{id}/cuts/download/      Download cuts (single or batch)
```

#### Transcription
```http
GET    /videos/{id}/transcription/             Get full transcription
POST   /videos/{id}/transcription/trigger/     Trigger transcription job
GET    /videos/{id}/transcription/export/      Export as TXT, PDF, Markdown
```

#### Chat
```http
POST   /chat/sessions/                   Create new chat session
GET    /chat/sessions/                   List user's chat sessions
POST   /chat/sessions/{id}/messages/     Send a message
GET    /chat/sessions/{id}/messages/     Get message history
POST   /chat/sessions/{id}/videos/       Add video to session
```

#### Deep Research
```http
POST   /research/sessions/               Start a deep research session
GET    /research/sessions/{id}/          Get research report
GET    /research/sessions/{id}/sources/  Get all cited sources
```

#### Subscriptions
```http
GET    /users/me/                        Get current user profile
GET    /subscriptions/me/                Get subscription details
POST   /subscriptions/upgrade/           Upgrade to premium
POST   /subscriptions/cancel/            Cancel subscription
POST   /payments/webhook/stripe/         Stripe webhook
POST   /payments/webhook/flutterwave/    Flutterwave webhook
```

---

## 💳 Subscription Tiers

| Feature | Free | Premium |
|---|:---:|:---:|
| Video searches per day | 5 | Unlimited |
| AI video cuts per month | 3 | Unlimited |
| Transcriptions per month | 3 | Unlimited |
| Chat with video | Single video | Multi-video |
| Deep research reports | ❌ | ✅ |
| Batch downloads | ❌ | ✅ |
| Server-side video storage | ❌ | ✅ |
| Priority processing | ❌ | ✅ |
| Related articles research | ❌ | ✅ |

---

## 🔐 Security

- **Encryption in transit** — All data over HTTPS/TLS
- **Password hashing** — Django's PBKDF2 with SHA256
- **JWT security** — Short-lived access tokens + refresh rotation via simplejwt
- **OAuth 2.0** — Social auth via django-allauth
- **Rate limiting** — Per-user and per-IP via django-ratelimit
- **Input validation** — DRF serializer validation on all endpoints
- **CSRF protection** — Django's built-in middleware
- **SQL injection** — Django ORM parameterized queries
- **CORS** — Strict origin control via django-cors-headers
- **Payment security** — PCI-compliant via Stripe & Flutterwave
- **GDPR compliant** — User data export and deletion supported

Report vulnerabilities to **security@vidmindai.com** — not via public GitHub issues.

---

## 🧪 Testing

### Backend
```bash
cd backend && source venv/bin/activate

# Run all tests
python manage.py test

# With coverage report
pip install coverage
coverage run manage.py test
coverage report
coverage html
```

### Frontend
```bash
cd frontend
npm run test
npm run test:coverage
npm run test:e2e
```

---

## 🐳 Docker

```bash
# Start all services
docker-compose up

# Run migrations inside container
docker-compose exec backend python manage.py migrate

# Create superuser inside container
docker-compose exec backend python manage.py createsuperuser
```

| Service | Port | Description |
|---|---|---|
| `backend` | 8000 | Django API (Gunicorn) |
| `frontend` | 3000 | React TypeScript dev server |
| `celery_worker` | — | Async AI & video tasks |
| `celery_beat` | — | Scheduled task runner |
| `db` | 5432 | PostgreSQL |
| `redis` | 6379 | Cache & Celery broker |

---

## 🚢 Deployment

### Backend
```bash
# Collect static files
python manage.py collectstatic --noinput

# Start with Gunicorn
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
```

### Frontend
```bash
cd frontend
npm run build
# Deploy to your preferred hosting (Vercel, Netlify, etc.)
npx vercel --prod
```

### Mobile
```bash
cd mobile
expo build:ios
expo build:android
```

---

## 🗺️ Roadmap

- [x] Project planning & architecture
- [ ] **Phase 1** — Foundation (Auth, homepage, YouTube search, dashboard)
- [ ] **Phase 2** — Core AI features (Processing, transcription, cutting, downloads)
- [ ] **Phase 3** — Intelligence layer (Chat, deep research, recommendations)
- [ ] **Phase 4** — Monetization (Freemium, Stripe, Flutterwave/Paystack)
- [ ] **Phase 5** — Mobile app & scale
- [ ] Browser extension
- [ ] Team collaboration features
- [ ] Notion / Obsidian / Google Docs export
- [ ] Podcast support
- [ ] Public API for developers

---

## 📦 Key Python Dependencies

```txt
# Core Django
django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
django-allauth>=0.57
django-cors-headers>=4.3
django-storages>=1.14
django-ratelimit>=4.1

# Database & Cache
psycopg2-binary>=2.9
redis>=5.0
django-redis>=5.4

# Background Tasks
celery>=5.3
django-celery-beat>=2.5
django-celery-results>=2.5

# AI & APIs
openai>=1.0
anthropic>=0.20
google-generativeai>=0.4
google-api-python-client>=2.0

# Storage & Payments
boto3>=1.34
stripe>=7.0

# API Docs & Production
drf-spectacular>=0.27
gunicorn>=21.0
whitenoise>=6.6
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit: `git commit -m 'feat: add your feature'`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

```
feat:      New feature
fix:       Bug fix
docs:      Documentation
refactor:  Code refactoring
test:      Tests
chore:     Maintenance
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Django](https://www.djangoproject.com/) — The web framework for perfectionists with deadlines
- [Django REST Framework](https://www.django-rest-framework.org/) — Powerful REST API toolkit
- [React](https://react.dev/) — UI library
- [React Native](https://reactnative.dev/) — Mobile framework
- [Google Gemini](https://deepmind.google/technologies/gemini/) — Video intelligence & deep research
- [OpenAI Whisper](https://openai.com/research/whisper) — Transcription
- [Anthropic Claude](https://www.anthropic.com/) — Conversational AI
- [Celery](https://docs.celeryq.dev/) — Distributed task queue

---

<div align="center">

**Built with ❤️ to make learning faster and smarter**

[Website](https://vidmindai.com) • [Twitter](https://twitter.com/vidmindai) • [Contact](mailto:hello@vidmindai.com)

</div>
