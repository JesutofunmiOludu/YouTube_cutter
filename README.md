# Video Learning & Creation Platform

> Transform how you learn from videos and create professional content with AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![Node Version](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![Django](https://img.shields.io/badge/django-5.0+-green.svg)](https://www.djangoproject.com/)
[![Next.js](https://img.shields.io/badge/next.js-14+-black.svg)](https://nextjs.org/)

## 📖 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Video Learning & Creation Platform** is a dual-purpose AI-powered application that:

1. **Helps learners** process YouTube videos into digestible chunks with AI-powered transcription, chat, and research capabilities
2. **Empowers creators** to generate professional videos using AI across multiple styles and formats

### Why This Platform?

- **For Students:** Break down complex educational content into manageable segments
- **For Professionals:** Extract insights quickly from training and industry videos
- **For Creators:** Generate high-quality videos without technical video editing skills
- **For Everyone:** Learn smarter and create faster with AI assistance

### Current Status

🚧 **Phase 1 - MVP (YouTube Processing)** - In Development

The initial release focuses on YouTube video processing features. AI video creation will be added in Phase 2.

---

## ✨ Features

### Phase 1 - MVP (Current Development)

#### 🎥 YouTube Video Processing
- **Smart Chunking:** AI analyzes videos and suggests optimal cutting points
- **Transcription:** Automatic speech-to-text with timestamps
- **Chat with Video:** Ask questions, get summaries, explanations in plain language
- **Organization:** Auto-created folders for each processed video
- **Playback Resume:** Pick up where you left off across sessions
- **Flexible Storage:** Reference YouTube videos or archive them permanently

#### 👤 User Management
- Email/password authentication
- Google Sign-In
- Apple Sign-In
- User dashboard with video library
- Usage tracking and limits

#### 💳 Monetization
- **Free Tier:** 3 videos/month, basic features
- **Pro Tier ($19/month):** Unlimited processing, advanced features
- **Business Tier ($79/month):** Team features, priority support

### Phase 2 - Future (AI Video Creation)

#### 🎬 Video Creation Studio
- Multiple input methods (script, document upload, templates)
- 5+ video styles (doodly, avatar, animated, slideshow, stock footage)
- Voice options (AI-generated, user upload, voice cloning)
- Full editing capabilities
- Export in multiple formats

---

## 🏗️ Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
│  ┌──────────────────┐              ┌──────────────────┐    │
│  │   Web (Next.js)  │              │ Mobile (React    │    │
│  │                  │              │    Native)       │    │
│  └────────┬─────────┘              └────────┬─────────┘    │
└───────────┼──────────────────────────────────┼──────────────┘
            │                                  │
            │         HTTPS/REST API           │
            │                                  │
┌───────────┼──────────────────────────────────┼──────────────┐
│           ▼                                  ▼               │
│  ┌────────────────────────────────────────────────────┐    │
│  │           Django REST API (Backend)                │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │   Auth   │  │  Video   │  │   AI     │        │    │
│  │  │ Service  │  │ Service  │  │ Service  │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  │                                                     │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐        │    │
│  │  │ Payment  │  │ Storage  │  │  Task    │        │    │
│  │  │ Service  │  │ Service  │  │  Queue   │        │    │
│  │  └──────────┘  └──────────┘  └──────────┘        │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────┐
│   PostgreSQL    │  │   Redis     │  │  AWS S3      │
│   (Database)    │  │   (Cache)   │  │  (Storage)   │
└─────────────────┘  └─────────────┘  └──────────────┘
         │
         └──────────────────┐
                            ▼
                   ┌─────────────────┐
                   │  Celery Worker  │
                   │  (Background    │
                   │   Jobs)         │
                   └────────┬────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────┐  ┌──────────────┐
│  Google Video   │  │  Google STT │  │   Google     │
│  Intelligence   │  │ (Transcript)│  │   Gemini     │
└─────────────────┘  └─────────────┘  └──────────────┘
```

### Request Flow

1. **User Action:** User pastes YouTube URL in frontend
2. **API Call:** Frontend makes POST request to `/api/videos/process`
3. **Task Queue:** Django creates Celery task for async processing
4. **Video Processing:**
   - Fetch video metadata
   - Call Google Video Intelligence API for scene analysis
   - Call Google Speech-to-Text for transcription
   - Call Google Gemini for content analysis and chunking
   - Store results in PostgreSQL
   - Save video reference/archive to S3
5. **Status Updates:** Frontend polls for processing status
6. **Completion:** User sees processed video with chunks, transcript, and chat available

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14+ | React framework with SSR/SSG |
| React | 18+ | UI library |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Styling |
| shadcn/ui | Latest | UI components |
| Zustand | 4+ | State management |
| React Query | 5+ | Data fetching |
| Video.js | 8+ | Video player |
| NextAuth.js | 4+ | Authentication |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Programming language |
| Django | 5.0+ | Web framework |
| Django REST Framework | 3.14+ | API framework |
| Celery | 5+ | Task queue |
| Redis | 7+ | Message broker & cache |
| PostgreSQL | 15+ | Primary database |
| django-allauth | 0.57+ | Social authentication |
| Stripe | Latest | Payment processing |

### AI & Video Processing

| Technology | Purpose |
|------------|---------|
| Google Video Intelligence API | Video scene analysis |
| Google Speech-to-Text | Transcription |
| Google Gemini (Vertex AI) | Chat, analysis, chunking |
| FFmpeg | Video manipulation |
| yt-dlp | YouTube video handling |

### Infrastructure (AWS)

| Service | Purpose |
|---------|---------|
| EC2/ECS | Application hosting |
| RDS | Managed PostgreSQL |
| S3 | Video storage |
| CloudFront | CDN |
| ElastiCache | Managed Redis |
| CloudWatch | Monitoring |

### DevOps

| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| GitHub Actions | CI/CD |
| Sentry | Error tracking |
| PostHog | Analytics |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.11+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Redis 7+** - [Download](https://redis.io/download/)
- **FFmpeg** - [Download](https://ffmpeg.org/download.html)
- **Git** - [Download](https://git-scm.com/downloads/)

### Required API Keys

You'll need to obtain the following API keys:

1. **Google Cloud Platform**
   - Video Intelligence API
   - Speech-to-Text API
   - Vertex AI (Gemini)
   - [Get started](https://console.cloud.google.com/)

2. **Stripe**
   - Publishable key
   - Secret key
   - [Get started](https://stripe.com/)

3. **AWS** (for production)
   - Access Key ID
   - Secret Access Key
   - [Get started](https://aws.amazon.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/video-learning-platform.git
cd video-learning-platform
```

### 2. Backend Setup

#### Create Virtual Environment

```bash
cd backend
python -m venv venv

# On macOS/Linux
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Set Up Database

```bash
# Create PostgreSQL database
createdb video_platform_db

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Redis Setup

Start Redis server:

```bash
# On macOS with Homebrew
brew services start redis

# On Linux
sudo systemctl start redis

# Or run directly
redis-server
```

---

## ⚙️ Configuration

### Backend Configuration

Create `.env` file in the `backend` directory:

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/video_platform_db

# Redis
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# Google Cloud AI
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GOOGLE_CLOUD_PROJECT=your-project-id

# AWS (for production)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# Stripe
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (optional for development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Social Auth
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-client-secret
APPLE_OAUTH_CLIENT_ID=your-client-id
APPLE_OAUTH_CLIENT_SECRET=your-client-secret

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Security
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

### Frontend Configuration

Create `.env.local` file in the `frontend` directory:

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Apple OAuth
APPLE_CLIENT_ID=your-client-id
APPLE_CLIENT_SECRET=your-client-secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Analytics (optional)
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
```

---

## 🏃 Running the Application

### Development Mode

You'll need **4 terminal windows** running simultaneously:

#### Terminal 1: Backend Server

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py runserver
```

Backend will run at: `http://localhost:8000`

#### Terminal 2: Celery Worker

```bash
cd backend
source venv/bin/activate
celery -A config worker -l info
```

This processes background tasks (video processing, AI calls, etc.)

#### Terminal 3: Celery Beat (Optional - for scheduled tasks)

```bash
cd backend
source venv/bin/activate
celery -A config beat -l info
```

#### Terminal 4: Frontend Server

```bash
cd frontend
npm run dev
```

Frontend will run at: `http://localhost:3000`

### Accessing the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000/api
- **Admin Panel:** http://localhost:8000/admin
- **API Documentation:** http://localhost:8000/api/docs

---

## 📁 Project Structure

```
video-learning-platform/
├── backend/                    # Django backend
│   ├── config/                # Django project settings
│   │   ├── settings/          # Split settings (dev/prod)
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   │
│   ├── apps/                  # Django apps
│   │   ├── users/            # User management
│   │   ├── videos/           # Video processing
│   │   ├── ai_services/      # AI integrations
│   │   ├── payments/         # Stripe integration
│   │   └── storage/          # File storage
│   │
│   ├── utils/                # Shared utilities
│   ├── requirements.txt      # Python dependencies
│   ├── manage.py
│   └── .env                  # Environment variables
│
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js 14 app directory
│   │   │   ├── (auth)/       # Auth pages
│   │   │   ├── dashboard/    # Dashboard pages
│   │   │   ├── video/        # Video viewer
│   │   │   └── api/          # API routes
│   │   │
│   │   ├── components/       # React components
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── video/        # Video-related components
│   │   │   └── dashboard/    # Dashboard components
│   │   │
│   │   ├── lib/              # Utilities and helpers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   ├── store/            # State management
│   │   └── types/            # TypeScript types
│   │
│   ├── public/               # Static assets
│   ├── package.json
│   └── .env.local           # Environment variables
│
├── docs/                     # Documentation
│   ├── API.md               # API documentation
│   ├── DESIGN.md            # Design system
│   └── DEPLOYMENT.md        # Deployment guide
│
├── scripts/                 # Utility scripts
├── docker/                  # Docker configurations
├── .github/                 # GitHub Actions workflows
├── README.md               # This file
├── masterplan.md           # Product masterplan
└── LICENSE
```

---

## 💻 Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Urgent production fixes

### Making Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow the coding standards
   - Add tests for new features

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

   Use conventional commits:
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation
   - `style:` - Formatting
   - `refactor:` - Code restructuring
   - `test:` - Adding tests
   - `chore:` - Maintenance

4. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Quality

#### Backend (Python)

```bash
# Format code
black .

# Lint code
flake8

# Type checking
mypy .

# Run tests
pytest
```

#### Frontend (TypeScript)

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type checking
npm run type-check

# Run tests
npm run test
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
source venv/bin/activate

# Run all tests
pytest

# Run with coverage
pytest --cov=apps

# Run specific test file
pytest apps/videos/tests/test_processing.py

# Run specific test
pytest apps/videos/tests/test_processing.py::TestVideoProcessing::test_chunk_creation
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm run test -- VideoPlayer.test.tsx
```

### Integration Tests

```bash
# Run full integration test suite
npm run test:integration
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in backend
- [ ] Configure production database
- [ ] Set up AWS S3 for media storage
- [ ] Configure CloudFront CDN
- [ ] Set up Redis for production
- [ ] Configure Celery workers
- [ ] Set up SSL certificates
- [ ] Configure domain and DNS
- [ ] Set up monitoring (Sentry, CloudWatch)
- [ ] Set up backup strategy
- [ ] Configure email service (SendGrid/SES)
- [ ] Set up CI/CD pipeline
- [ ] Load test the application
- [ ] Security audit

### Docker Deployment

```bash
# Build images
docker-compose build

# Run services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### AWS Deployment (Recommended)

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

**Key Services:**
- **ECS/Fargate** - Container orchestration
- **RDS** - Managed PostgreSQL
- **ElastiCache** - Managed Redis
- **S3** - Media storage
- **CloudFront** - CDN
- **Application Load Balancer** - Traffic distribution
- **Route 53** - DNS management

---

## 📚 API Documentation

### Authentication

All API requests (except public endpoints) require authentication via JWT token.

```bash
# Get access token
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}

# Use token in subsequent requests
Authorization: Bearer <access_token>
```

### Key Endpoints

#### Videos

```bash
# Process YouTube video
POST /api/videos/process
{
  "youtube_url": "https://www.youtube.com/watch?v=..."
}

# Get video details
GET /api/videos/{video_id}

# List user videos
GET /api/videos/

# Chat with video
POST /api/videos/{video_id}/chat
{
  "message": "Summarize the main points"
}

# Get transcript
GET /api/videos/{video_id}/transcript

# Archive video
POST /api/videos/{video_id}/archive

# Delete video
DELETE /api/videos/{video_id}
```

#### User

```bash
# Register
POST /api/auth/register

# Login
POST /api/auth/login

# Get profile
GET /api/users/me

# Update profile
PATCH /api/users/me
```

#### Subscriptions

```bash
# Get subscription info
GET /api/subscriptions/me

# Create checkout session
POST /api/subscriptions/create-checkout-session

# Cancel subscription
POST /api/subscriptions/cancel
```

For complete API documentation, visit: `http://localhost:8000/api/docs` when running locally.

---

## 🔧 Troubleshooting

### Common Issues

#### Backend won't start

**Issue:** `django.db.utils.OperationalError: could not connect to server`

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Start PostgreSQL
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

#### Celery tasks not processing

**Issue:** Videos stuck in "processing" state

**Solution:**
```bash
# Check Redis is running
redis-cli ping

# Restart Celery worker
# Kill existing workers
pkill -f "celery worker"

# Start fresh worker
celery -A config worker -l info
```

#### Frontend can't connect to backend

**Issue:** Network errors in browser console

**Solution:**
```bash
# Check CORS settings in backend/.env
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Check API URL in frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

#### Google AI API errors

**Issue:** `google.auth.exceptions.DefaultCredentialsError`

**Solution:**
```bash
# Set credentials path
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Or add to .env file
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Ensure all tests pass
6. Submit a pull request

### Code Review Process

- All PRs require at least one approval
- Tests must pass
- Code must follow style guidelines
- Documentation must be updated

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Cloud Platform** - For AI services
- **Stripe** - For payment processing
- **Vercel** - For Next.js deployment
- **AWS** - For infrastructure
- **Open source community** - For amazing tools

---

## 📞 Support

- **Documentation:** [docs.yourplatform.com](https://docs.yourplatform.com)
- **Email:** support@yourplatform.com
- **Discord:** [Join our community](https://discord.gg/yourserver)
- **GitHub Issues:** [Report bugs](https://github.com/jesutofunmioludu/video-learning-platform/issues)

---

## 🗺️ Roadmap

### Current (Phase 1 - Q1 2026)
- [x] User authentication
- [x] YouTube video processing
- [x] AI chunking
- [x] Transcription
- [x] Chat with video
- [x] Payment integration
- [ ] MVP Launch

### Next (Phase 2 - Q2-Q3 2026)
- [ ] Mobile apps (iOS/Android)
- [ ] AI video creation
- [ ] Multiple video styles
- [ ] Voice cloning
- [ ] Advanced editing

### Future (Phase 3 - Q4 2026+)
- [ ] Collaborative features
- [ ] API for developers
- [ ] Browser extension
- [ ] Enterprise features
- [ ] Marketplace for templates

---

## 📊 Project Status

[![GitHub issues](https://img.shields.io/github/issues/Jesutofunmioludu/video-learning-platform)](https://github.com/jesutofunmioludu/video-learning-platform/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/jesutofunmioludu/video-learning-platform)](https://github.com/jesutofunmioludu/video-learning-platform/pulls)
[![GitHub stars](https://img.shields.io/github/stars/jesutofunmioludu/video-learning-platform)](https://github.com/jesutofunmioludu/video-learning-platform/stargazers)

---

**Made with ❤️ by Laughter Webs**

*Last updated: February 2026*
