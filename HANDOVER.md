# Developer Handover Note — YouTube Cutter / VidMind AI

**Date:** June 24, 2026  
**Project:** YouTube Cutter — AI-powered video editing and research platform  
**Repo:** `c:\Users\Laughter Oludu\Documents\GitHub\YouTube_cutter`

---

## 1. Project Overview

**VidMind AI** is a full-stack web application that allows users to:
- Search and save YouTube videos
- Generate AI-powered cut suggestions (chapter breaks)
- Get full transcripts
- Chat with Gemini AI about a video's content
- Run deep research reports on a video topic

---

## 2. Tech Stack

| Layer       | Technology |
|-------------|------------|
| Frontend    | Next.js 16 (Pages Router), TypeScript, TailwindCSS v4 |
| State       | Zustand (auth + UI stores) |
| HTTP Client | Axios (with JWT auto-refresh interceptor) |
| Backend     | Django 5, Django REST Framework (DRF) |
| Auth        | Simple JWT (access = 60min, refresh = 7d) |
| AI          | Google Gemini API (`gemini_service.py`) |
| YouTube     | YouTube Data API v3 |
| DB          | SQLite (dev) — swap to PostgreSQL for prod |
| Runtime     | `uv` (Python package manager, like pipenv) |

---

## 3. Directory Structure

```
YouTube_cutter/
├── Backend/                    # Django project
│   ├── myproject/              # Core Django settings & URLs
│   │   ├── settings.py
│   │   └── urls.py
│   ├── Users/                  # Custom user model + JWT auth
│   ├── videos/                 # UserVideo, VideoCut, Transcription models/APIs
│   ├── chat/                   # ChatSession, ChatMessage, ResearchSession + Gemini
│   │   ├── gemini_service.py   # All Gemini AI logic (chat + research)
│   │   ├── views.py            # Chat & research DRF views
│   │   ├── urls.py             # /api/chat/ routes
│   │   └── research_urls.py    # /api/research/ routes
│   ├── billing/                # UsageSummary model + billing views
│   ├── .env                    # Environment variables (see section 5)
│   └── db.sqlite3              # Dev database
│
└── Frontend/youtube/           # Next.js app
    ├── pages/                  # Next.js Pages Router
    │   ├── login.tsx           # Login page (wired to /api/auth/login/)
    │   ├── register.tsx        # Register page
    │   ├── dashboard/          # Dashboard page
    │   ├── search/             # YouTube search page
    │   ├── library/            # Video library page
    │   ├── workspace/
    │   │   ├── new.tsx         # Setup/processing page -> redirects to workspace editor
    │   │   └── [uservideoId]/
    │   │       └── index.tsx   # Main workspace editor (video + cuts + chat + research)
    │   ├── chat/[chatsessionId]/  # Dedicated chat page
    │   └── research/[sessionId]/  # Dedicated research report page
    ├── components/
    │   ├── utils/apiClient.ts  # Axios instance with JWT auto-refresh
    │   ├── video/VideoPlayer.tsx # YouTube IFrame API player component
    │   ├── video/CutTimeline.tsx # Visual timeline of cut segments
    │   ├── chat/ChatWindow.tsx  # Chat UI component
    │   └── research/ResearchReport.tsx # Research report renderer
    ├── store/
    │   └── auth.store.ts       # Zustand auth store (token, refreshToken, user)
    └── types/index.ts          # All shared TypeScript interfaces
```

---

## 4. Running the Project

### Backend
```powershell
cd c:\Users\Laughter Oludu\Documents\GitHub\YouTube_cutter\Backend
uv run python manage.py runserver 8000
```
Backend runs at: `http://localhost:8000`

### Frontend
```powershell
cd c:\Users\Laughter Oludu\Documents\GitHub\YouTube_cutter\Frontend\youtube
npm run dev
```
Frontend runs at: `http://localhost:3000`
(Tries port 3001 if 3000 is occupied — see CORS issue in Section 8.)

### TypeScript check (should exit 0)
```powershell
npx tsc --noEmit
```

---

## 5. Environment Variables

### Backend — `Backend/.env`
```env
SECRET_KEY=<django-secret-key>
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
YOUTUBE_API_KEY=<your-youtube-data-api-v3-key>
GEMINI_AI_API=<your-google-gemini-api-key>
```

### Frontend — create `Frontend/youtube/.env.local` (does not exist yet)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Without this file, `apiClient.ts` defaults to `http://localhost:8000` (works in dev but should be explicit).

---

## 6. Key Backend API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/auth/login/` | Login; returns `access` + `refresh` tokens |
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET/POST | `/api/videos/` | List user videos / save new video by `youtube_id` |
| GET | `/api/videos/<id>/` | Video detail with nested cuts + transcription |
| GET/POST | `/api/videos/<id>/cuts/` | List or create cuts |
| PATCH/DELETE | `/api/videos/<id>/cuts/<cut_id>/` | Edit or delete a cut |
| GET | `/api/videos/<id>/transcription/` | Get transcription with segments |
| GET | `/api/videos/search/?q=<query>` | Search YouTube |
| GET/POST | `/api/chat/sessions/` | List or create chat sessions |
| GET | `/api/chat/sessions/<id>/` | Session detail with messages + videos |
| POST | `/api/chat/sessions/<id>/messages/` | Send message; triggers Gemini reply |
| POST | `/api/chat/sessions/<id>/videos/` | Attach a video to a session |
| DELETE | `/api/chat/sessions/<id>/videos/<uv_id>/` | Detach a video |
| GET/POST | `/api/research/` | List or create research sessions |
| GET | `/api/research/<id>/` | Get research report + sources |
| GET | `/api/billing/usage/` | Get today's usage stats |

---

## 7. Completed Work

### Phase 1 — Frontend-Backend Integration (All Complete)

- Auth client (`apiClient.ts`) with automatic JWT token refresh on 401
- Auth pages (`/login`, `/register`) connected to real DRF endpoints
- Search page calls `/api/videos/search/`
- Dashboard page loads real videos, usage stats, chats, and research
- Library page shows saved videos from backend
- Workspace new page (`/workspace/new`) POSTs to `/api/videos/`, polls `processing_status`, then redirects
- Workspace detail page fetches video, cuts, transcript; live cut CRUD; chat and research tabs wired up
- Dedicated chat page — live sessions, messages, add/remove attached videos
- Dedicated research page — displays completed report and sources

### Bug Fixes Applied

- **404 on workspace redirect** — fixed by moving a misplaced `import` statement (was at line 1101, inside the file body) to the top with other imports. Also removed the invalid `'use client'` directive (App Router only; this is a Pages Router file).
- **YouTube player crash (partial fix)** — added `isReadyRef` guard to `VideoPlayer.tsx`. See Section 8 for why it may still appear.

---

## 8. Known Bugs & Outstanding Issues

### HIGH — YouTube Player: "playVideo is not a function"

**File:** `Frontend/youtube/components/video/VideoPlayer.tsx`

**Error:** `playerRef.current?.playVideo is not a function` when clicking the play button in the workspace editor.

**Root cause:** The YouTube IFrame API's `new window.YT.Player()` returns an object immediately, but `playVideo()`, `pauseVideo()`, `seekTo()` etc. are not populated until the `onReady` callback fires. Clicking play before `onReady` crashes.

**Fix already in source:** `isReadyRef = useRef(false)` is set to `true` inside `onReady`. All player calls now check `isReadyRef.current` first.

**Why it still crashes:** Turbopack caches compiled bundle chunks. After the source fix, the running dev server (was running for 19+ hours) served a stale bundle. **Solution: restart the Next.js dev server** to force a fresh compile:
```powershell
# Kill the npm run dev process, then restart it
npm run dev
```

---

### MEDIUM — Research session not auto-loading

**File:** `Frontend/youtube/pages/workspace/[uservideoId]/index.tsx` ~line 1220

```ts
// Current (broken):
const existingResearch = researchList.find((r: any) => r.user_video === userVideoId)
```

The backend returns `user_video` as a nested object, not a bare ID string. Fix:
```ts
const existingResearch = researchList.find((r: any) =>
  (r.user_video?.id ?? r.user_video) === userVideoId
)
```

---

### MEDIUM — CORS error when frontend runs on port 3001

If port 3000 is occupied, Next.js tries port 3001. The backend `.env` only allows port 3000. Add to `.env`:
```env
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

### MEDIUM — `video_ids` field on ChatSession serializer

The workspace code filters chat sessions by video IDs:
```ts
const existingChat = chatsList.find((s: any) => s.video_ids?.includes(userVideoId))
```
Verify `Backend/chat/serializers.py` `ChatSessionSerializer` returns a `video_ids` field (a flat list of UserVideo ID strings). If not, this will always be `undefined` and the workspace will create duplicate chat sessions every time.

---

### LOW — Dead code in workspace page

`Frontend/youtube/pages/workspace/[uservideoId]/index.tsx` lines ~99–643 contain mock data objects (`MOCK_USER_VIDEO`, `MOCK_CUTS`, `MOCK_TRANSCRIPT`, `MOCK_CHAT_SESSION`, `MOCK_RESEARCH_SESSION`) and a `loadYTApi`/`ytApiLoaded` YouTube loader (lines ~147–165) that is defined but never called. These are safe to delete.

---

### LOW — Missing `.env.local` in frontend

`NEXT_PUBLIC_API_URL` is not in a `.env.local` file. Create it:
```
Frontend/youtube/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 9. Next Development Priorities

1. **Restart the Next.js dev server** to fix the stale YouTube player bundle
2. **Fix research session matching** (`r.user_video?.id === userVideoId`)
3. **Verify `video_ids` in ChatSessionSerializer** returns flat ID list
4. **Clean up dead code** in workspace index.tsx (~100 lines of mocks + unused loadYTApi)
5. **Create `Frontend/youtube/.env.local`** with `NEXT_PUBLIC_API_URL`
6. **End-to-end smoke test** the full user flow:
   - Register → Login → Search video → Save → Watch processing → Open workspace → Chat → Research
7. **Migrate database to PostgreSQL** before any production deployment
8. **Consider splitting `research` out** of the `chat` Django app into its own `research/` app

---

## 10. Architecture Notes

### How Video Processing Works (on video save)
When a user saves a YouTube video (`POST /api/videos/`), `UserVideoSerializer.create()` in `Backend/videos/serializers.py` automatically:
1. Fetches or creates a `Video` object using the YouTube ID
2. Creates a `UserVideo` linking the user to the video
3. Creates a placeholder `Transcription` with 5 mock segments
4. Creates 4 AI-suggested `VideoCut` objects

This is seeding — real AI transcription and cut detection is future work. The backend sets `processing_status = 'completed'` immediately, so the frontend polling loop completes quickly.

### How Chat + Gemini Works
`POST /api/chat/sessions/<id>/messages/` with `{ "content": "..." }`:
1. Saves the user message to DB
2. Calls `gemini_service.py` → `generate_chat_response()`
3. Builds a prompt from all previous messages + attached video titles
4. Calls Google Gemini API synchronously
5. Saves the assistant reply to DB and returns the updated session

### How Research Works
`POST /api/research/` with `{ "user_video_id": "..." }`:
1. Creates a `ResearchSession` linked to the user video
2. Calls `gemini_service.py` → `generate_research_report()` synchronously (blocking)
3. Returns the session with `report_content` and `sources` already populated
4. Frontend renders the markdown with `<ResearchReport />` component

---

## 11. Key Files Quick Reference

| File | Purpose |
|------|---------|
| `Backend/videos/serializers.py` | Video save + auto-seeding of cuts/transcription |
| `Backend/chat/gemini_service.py` | All Gemini AI calls (chat + research) |
| `Backend/chat/views.py` | Chat + research DRF views |
| `Backend/myproject/settings.py` | Django settings, CORS, JWT config |
| `Frontend/youtube/components/utils/apiClient.ts` | Axios + JWT auto-refresh |
| `Frontend/youtube/store/auth.store.ts` | Zustand auth state |
| `Frontend/youtube/pages/workspace/[uservideoId]/index.tsx` | Main workspace (1664 lines) |
| `Frontend/youtube/components/video/VideoPlayer.tsx` | YouTube IFrame player |
| `Frontend/youtube/types/index.ts` | All shared TypeScript interfaces |

---

*Good luck! The project is in a solid state — the main blocker is the stale Turbopack bundle for the player. A server restart should unblock the workspace editor immediately.*
