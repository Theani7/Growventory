# Rate Limiting with Real-Time Countdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5-failed-attempt rate limiting on `/api/auth/login` (excluding successful logins) with structured `retryAfter` payload, and render a live real-time countdown timer (`mm:ss`) on the login page and across the app when rate limits are active.

**Architecture:** Express `express-rate-limit` handlers calculate remaining reset seconds and provide standard `Retry-After` headers and `retryAfter` JSON fields. The React frontend consumes `retryAfter` and drives a 1-second interval countdown timer in `Login.tsx` and the global `api.ts` interceptor.

**Tech Stack:** Express, TypeScript, `express-rate-limit`, React 18, React Hot Toast, Tailwind CSS.

## Global Constraints
- Login limit: exactly 5 failed attempts per 15 minutes per IP (`skipSuccessfulRequests: true`).
- Successful logins (HTTP 200) MUST NOT count against the quota.
- General API limit remains 200 requests per 15 minutes per IP (with login excluded from the 200 count).
- Zero downtime AWS deployment via `deploy/update.sh`.

---

### Task 1: Backend Rate Limiters with `retryAfter` Payload

**Files:**
- Modify: `backend/server.ts:45-60`
- Modify: `backend/routes/authRoutes.ts:7-12`

- [ ] **Step 1: Update `backend/server.ts` with custom rate limit handler and `loginLimiter`**
  - Define `calculateRetryAfter` helper.
  - Configure `loginLimiter` with `windowMs: 15 * 60 * 1000`, `max: 5`, `skipSuccessfulRequests: true`, `standardHeaders: true`, `legacyHeaders: false`.
  - Mount `app.use('/api/auth/login', loginLimiter)`.
  - Update global rate limiter to use the structured handler and skip `/api/auth/login`.

- [ ] **Step 2: Update `backend/routes/authRoutes.ts` with structured `otpLimiter` handler**
  - Add custom `handler` returning `retryAfter` in JSON for OTP routes.

- [ ] **Step 3: Build backend to verify TypeScript compilation**
  - Run `npm run build` in `backend/` and ensure zero errors.

- [ ] **Step 4: Commit backend changes**
  - `git add backend/server.ts backend/routes/authRoutes.ts`
  - `git commit -m "feat(backend): add login rate limiter with retryAfter payload"`

---

### Task 2: Frontend Global Rate Limit Notification with Time Format

**Files:**
- Modify: `frontend/src/services/api.ts:35-50`

- [ ] **Step 1: Format `retryAfter` into human-readable minutes and seconds**
  - In `frontend/src/services/api.ts`, intercept 429 errors.
  - Read `error.response?.data?.retryAfter` or `error.response?.headers?.['retry-after']`.
  - Display informative toast: `Too many requests. Please wait ${formattedTime} before retrying.`

- [ ] **Step 2: Commit API interceptor changes**
  - `git add frontend/src/services/api.ts`
  - `git commit -m "feat(frontend): format retryAfter countdown in API 429 interceptor"`

---

### Task 3: Login Page Real-Time Countdown Timer & Disabled State

**Files:**
- Modify: `frontend/src/pages/auth/Login.tsx:10-70, 90-150, 180-220`

- [ ] **Step 1: Add countdown state and interval timer in `Login.tsx`**
  - Add `rateLimitRemaining` number state (seconds).
  - Add `useEffect` countdown timer ticking down every 1000ms.
  - When timer reaches 0, clear error and unlock form.

- [ ] **Step 2: Handle 429 in `handleSubmit`**
  - Extract `retryAfter` from response data/headers.
  - Set `rateLimitRemaining` and display message.

- [ ] **Step 3: Render live countdown UI and disable submit**
  - Add Amber alert card showing clock icon, bold countdown `mm:ss`, and explanation.
  - Disable inputs and submit button during active lockout (`rateLimitRemaining > 0`).

- [ ] **Step 4: Build frontend to verify compilation**
  - Run `npm run build` in `frontend/` and ensure zero errors.

- [ ] **Step 5: Commit frontend changes**
  - `git add frontend/src/pages/auth/Login.tsx`
  - `git commit -m "feat(auth): add live countdown timer to login lockout"`

---

### Task 4: Push to GitHub & Deploy to AWS EC2

**Files:**
- Target: AWS EC2 (`13.60.98.40`)

- [ ] **Step 1: Push commits to GitHub `origin main`**
  - `git push origin main`

- [ ] **Step 2: Run `deploy/update.sh` on AWS EC2**
  - `ssh -i ~/Downloads/growventory-key.pem ubuntu@13.60.98.40 "cd ~/Growventory && bash deploy/update.sh"`

- [ ] **Step 3: Verify live endpoint**
  - Send failed POST requests to `/api/auth/login` to confirm `retryAfter` in 429 response.
