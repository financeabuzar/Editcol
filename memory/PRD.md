# EditCol V2 — Product Requirements Document

## Original Problem Statement
Premium video editor marketplace with trust-first design. Use provided EditCol logo unmodified. Brand gradient `#39FF14 → #DFFF00`. White (`#FFFFFF`) + slate (`#F8FAFC`) backgrounds, `#111827` text, `#FFFFFF` cards. Feel like Stripe + Apple + Fiverr.

## User Choices (verbatim from kickoff)
- Auth: mocked OTP (no SendGrid/Twilio) returned in response/console.
- Chat: WebSockets.
- File uploads: base64 (Cloudinary deferred).
- DB seeded empty — no fake/demo editors.
- Admin: `financeabuzar@gmail.com` (password in `/app/memory/test_credentials.md`).

## Architecture
- **Backend**: FastAPI + MongoDB (motor) — single `server.py`. JWT in httpOnly cookies. WebSocket at `/api/ws?token=...`.
- **Frontend**: React 19 + Tailwind + Lucide icons + React Router 7. Outfit + Plus Jakarta Sans fonts.
- **Auth**: bcrypt + PyJWT. Access + refresh cookies, Remember Me extends to 30d. Brute-force lockout (5/15min).

## Pages Implemented
- `/` Home — hero, badge strip, featured editors (empty state), how-it-works, dark CTA card.
- `/browse` Browse Editors — filter sidebar (badge, skill, max price, search).
- `/editor/:id` Editor Profile — sticky sidebar with Message Editor + Hire For Project, Trust Score panel, badges, portfolio bento, reviews, Report/Block dialogs.
- `/login`, `/register` (2-step + OTP), `/forgot-password`, `/reset-password` — split-screen auth.
- `/dashboard` — verification banner, project list, editor profile completeness checklist.
- `/editor/onboarding` — bio, skills, software, portfolio (with base64 thumbnails), avatar.
- `/messages` — real-time WebSocket chat with text, image/video/file attachments (base64), typing indicator, read receipts.
- `/admin` — Overview, Users (suspend/ban/unban), Editor Verification, Reports (resolve/dismiss/suspend/ban), Projects, Reviews (delete).
- `/legal/{terms,privacy,cookies,refund,community}` — five legal pages.
- `/how-it-works`, `/trust` — static marketing pages.

## Trust System
- Mandatory email + phone verification before public listing.
- Trust score: completion rate, response rate, on-time delivery, satisfaction (0-100).
- Badges (computed on review/project events): Verified Editor, Pro Editor (≥5 completed), Top Rated (≥4.7★ over 5+ reviews), Elite Editor (≥20 completed & ≥4.8★).
- Reports queue (profile, scam, spam, fake-review) → admin moderation.
- Block user, ban/suspend via admin.

## Implementation Status (as of 2026-06-23)
- ✅ Backend (37 endpoints + WebSocket) — 26/26 pytest passing.
- ✅ Frontend (15+ pages) — all flows tested green.
- ✅ Mocked OTP & password reset (returned in API response + logged).
- ✅ Admin seeded idempotently from `ADMIN_EMAIL`/`ADMIN_PASSWORD`.
- ✅ DB empty except admin (per requirement).

## Backlog (P1 — production)
- Replace mocked OTP with SendGrid/Resend (email) + Twilio (SMS).
- Replace base64 uploads with Cloudinary.
- Stripe escrow payments + payouts.
- Search relevance / ranking algorithm.
- Push notifications for messages.
- Editor portfolio video hosting (Mux/Cloudflare Stream).

## Backlog (P2 — polish)
- Public/production CORS origin allow-list.
- Avatar fallback when base64 fails.
- Hide dev OTP panel when `NODE_ENV=production`.
- I18n.

## Test Credentials
See `/app/memory/test_credentials.md`.
