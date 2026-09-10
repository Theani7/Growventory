# Design Spec: Rate Limiting with Real-Time Countdown on Login & App Pages

- **Date:** 2026-09-10
- **Status:** Approved
- **Topic:** Rate Limiting Feedback & Live Countdown

---

## 1. Problem Statement
When a user or client exceeds the rate limit (HTTP 429 Too Many Requests), the API currently returns a generic static error message ("Too many requests. Please wait a moment and retry.") without telling the user how long they must wait. Furthermore, login attempts were previously either blocked entirely by global limits or unmetered.

The requirement is:
1. Re-enable login protection with **5 failed attempts per 15 minutes** per IP (`skipSuccessfulRequests: true` so successful logins do not consume quota).
2. Return precise `retryAfter` seconds in API responses (and `Retry-After` HTTP headers).
3. On the **Login page**, render a clear warning card with a **real-time countdown timer (`mm:ss`)** ticking down every second, temporarily disabling the submit button until the countdown completes.
4. On **other application pages**, surface a clear rate limit notification with an active countdown timer.

---

## 2. Architecture & Data Flow

### 2.1 Backend Changes
1. **`backend/server.ts`**:
   - Create a reusable rate limit handler that computes remaining seconds from `req.rateLimit.resetTime` and returns:
     ```json
     {
       "success": false,
       "message": "Too many requests. Please wait before trying again.",
       "retryAfter": 892
     }
     ```
   - Add `loginLimiter`:
     - `windowMs: 15 * 60 * 1000` (15 minutes)
     - `max: 5`
     - `skipSuccessfulRequests: true` (only HTTP 4xx/5xx failures count)
     - `standardHeaders: true`
     - Custom handler returning `retryAfter`
   - Mount `loginLimiter` on `/api/auth/login`.
   - Update global rate limiter:
     - `windowMs: 15 * 60 * 1000`, `max: 200`
     - Exclude `/api/auth/login` from the global 200 limiter so login is strictly governed by its own 5-failed-attempt policy.
     - Custom handler returning `retryAfter` in seconds.
2. **`backend/routes/authRoutes.ts`**:
   - Ensure `otpLimiter` also returns structured `retryAfter` seconds on 429.

### 2.2 Frontend Changes
1. **`frontend/src/pages/auth/Login.tsx`**:
   - Add state: `rateLimitSeconds: number` and timer effect.
   - When API returns 429 on login:
     - Read `retryAfter` from `err.response?.data?.retryAfter` or `Retry-After` header (fallback to 60s).
     - Start a 1-second interval timer decrementing `rateLimitSeconds`.
     - Render an amber/red countdown card:
       - Clock / Timer icon
       - Headline: "Too many failed login attempts"
       - Body: "For your security, login is temporarily paused. You can try again in **mm:ss**."
     - Disable the submit button and show "Try again in mm:ss" until the countdown expires.
     - Automatically re-enable form and clear the message when the countdown reaches 0.
2. **`frontend/src/services/api.ts` & Global Notification**:
   - Provide a global rate limit listener or custom toast that renders live ticking countdowns if 429 occurs on non-login pages.

---

## 3. Verification Plan
1. **Backend Build & Tests**:
   - Run `npm run build` in `backend/` to verify TypeScript passes cleanly.
2. **Frontend Build**:
   - Run `npm run build` in `frontend/` to verify Vite bundle compiles with zero errors.
3. **Live Testing**:
   - Deploy to AWS EC2.
   - Send 5 failed login attempts to verify 429 response contains `retryAfter` and the countdown card renders and ticks down accurately.
   - Verify successful login does not decrement the quota.
