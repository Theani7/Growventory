# Design Spec: Exempt Login Endpoint from Global Rate Limiting

- **Date:** 2026-09-10
- **Status:** Approved
- **Topic:** Auth Rate Limiting Bypass

---

## 1. Problem Statement
The Growventory backend uses `express-rate-limit` globally in `backend/server.ts` configured to 200 requests per 15 minutes per IP. While dedicated login route limiters were previously eliminated, the global rate limiter still tracks and blocks `/api/auth/login` when an IP triggers repeated requests (e.g. during manual testing, demos, or presentation workflows), returning HTTP 429.

The requirement is to remove rate limiting on `/api/auth/login` while preserving the global rate limiter across the rest of the API.

---

## 2. Solution Architecture
In `backend/server.ts`, supply a `skip` callback function to `rateLimit({ ... })`.

The `skip` function inspects incoming requests and bypasses rate limiting for requests destined for `/api/auth/login`:
```typescript
skip: (req) => req.originalUrl?.startsWith('/api/auth/login') || req.path?.startsWith('/api/auth/login')
```

### Components Impacted
- `backend/server.ts`:
  - Update `rateLimit` middleware instantiation with the `skip` predicate.

### Unaffected Components
- `backend/routes/authRoutes.ts`: OTP rate limiters (`otpLimiter` for verification and password reset) remain intact for email abuse prevention.
- General API endpoints: Continue to be governed by the 200 req / 15 min limit.

---

## 3. Verification Plan
1. Typecheck and build backend with `npm run build` in `backend/`.
2. Verify TypeScript strict mode compiles without warnings or errors.
3. Validate that `skip` correctly targets login requests.
