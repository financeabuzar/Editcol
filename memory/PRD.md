# EditCol V3 — Product Requirements Document

## Original Problem Statement (V3 brief)
Improve V2 (do NOT redesign): replace Pricing in navbar, add premium motion design (Framer Motion / Apple-Vision / Linear / Stripe feel), add How It Works (8 steps), AI Match page, expanded Trust & Safety, Success Stories, fix Become-Editor bug for logged-in users, country selector for phone, Upwork-style OTP UX, real-time chat (already done in V2). Goal: feel like a real $100M startup.

## User Choices
- V2: mocked OTP (returned in API response/console), WebSocket chat, base64 uploads, empty DB.
- V3: kept mocked OTP per user choice (`c) Keep mocked for now`).
- V3 LLM for AI matching: Anthropic Claude Sonnet 4.6 via Emergent LLM key.

## Architecture
- **Backend**: FastAPI + MongoDB + WebSocket (single `server.py`), JWT in httpOnly cookies, `emergentintegrations` for Claude.
- **Frontend**: React 19 + Tailwind + Framer Motion + Lucide. Custom motion primitives (`TiltCard`, `AiOrb`, `useMousePosition`).

## V3 Implementation Status (2026-06-23)
### Navbar
- Removed: Pricing.
- Added: How It Works, AI Match, Trust & Safety, Success Stories.

### New Pages
- `/how-it-works` — animated 8-step timeline (Client posts → AI matches → Editors apply → Client accepts → Private chat opens → Files uploaded → Editor delivers → Payment released).
- `/ai-match` — form (content type, budget, deadline 24h/3d/7d/14d/30d/custom, editing style, motion graphics, footage size) → calls `/api/ai/match` → ranked editor cards with score + AI reason.
- `/trust` — 8 pillars: Verified Editors, Identity Verification, Anti-Fake Portfolio Detection, Escrow Protection, Secure Payments, Review Moderation, Report Scam System, Fraud Detection.
- `/success-stories` — empty-state "Be the first story" (no fake data per requirement).
- `/become-editor` — upgrade-to-editor flow for already-signed-in clients (with `/api/auth/upgrade-to-editor`).

### Motion Design (Framer Motion)
- `AiOrb` — cursor-following neon orb with slow rotation + breathing scale (Apple Vision Pro feel).
- `TiltCard` — 3D perspective tilt + glare following mouse (Linear/Stripe feel).
- `useMousePosition` — global cursor hook with spring smoothing.
- Hero parallax, in-view fade/stagger reveals on all major sections.

### New Backend Endpoints
- `POST /api/auth/upgrade-to-editor` — convert client → editor without re-signup.
- `POST /api/projects/public` (client) — post a project openly.
- `GET  /api/projects/public` (editor) — browse open projects (with `already_applied` flag).
- `POST /api/applications` (editor) — apply with proposal.
- `GET  /api/applications/project/{id}` (client) — list applications + editor profiles.
- `GET  /api/applications/mine` (editor) — own applications.
- `POST /api/applications/{id}/accept` (client) — **auto-magic**: assigns editor, moves project to `in_progress`, auto-declines all other pending apps, **creates conversation + sends system welcome message**.
- `POST /api/applications/{id}/decline` (client).
- `POST /api/ai/match` — Claude-powered ranking of public editors by score with one-sentence reasons. Deterministic fallback when LLM errors.

### Other V3 fixes
- **Become Editor bug fixed**: logged-in clients now upgrade in place; logged-in editors/admins go straight to onboarding; not-logged-in go to `/register?role=editor` with editor tab pre-selected.
- **Country selector** (44 options, India default, search + flag + dial code).
- **Upwork-style OTP**: 3-step register (Account → Email OTP → Phone OTP → Done), 6 individual input boxes with auto-advance, paste-to-fill, 45s countdown-based Resend, verified state badge.
- **Auto-chat after acceptance**: accepting an editor application now creates the conversation and posts a system welcome message — no manual setup.
- **Empty DB stays empty**: no fake editors / reviews / projects.

## Testing
- Iteration 1 (V2 baseline): 26/26 backend + frontend GREEN.
- Iteration 2 (V3 additions): 24/24 V3 backend GREEN, 25/26 regression (1 flaky brute-force test), all frontend pages GREEN. 2 minor frontend issues flagged.
- Iteration 3 (retest of fixes): 4/4 redirect scenarios GREEN, role grammar fixed. All resolved.

## Test Credentials
See `/app/memory/test_credentials.md`. Admin: `financeabuzar@gmail.com` / `EditColAdmin@2026!Secure`.

## Backlog
**P1 (production)**
- Replace mocked OTP with SendGrid/Resend (email) + Twilio (SMS).
- Stripe escrow payments + payouts.
- Replace base64 uploads with Cloudinary.
- Push notifications for chat / application updates.
- Public project board UI page (backend ready, no UI yet — clients currently post a project via the AI Match shortcut or the editor profile Hire flow).

**P2 (polish)**
- Hide dev OTP panel when `NODE_ENV=production`.
- Rate-limit by email-only behind ingress (current ip+email keying is flaky).
- I18n.
- Email/SMS notifications.
