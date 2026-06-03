# Design Doc: Full Project Audit (Risk-Based)

**Date:** 2026-06-03  
**Status:** Approved  
**Topic:** Comprehensive Project Audit for Bugs, Error Handling, and Stability

## 1. Purpose & Goals
The goal is to perform a deep-dive audit of the Growventory codebase to identify security vulnerabilities, logical bugs, stability issues, and code quality improvements. This is a "Report First" audit, meaning findings will be documented and presented before any fixes are applied.

## 2. Scope
- **Backend:** Node.js/Express API, MySQL integration, Authentication/Authorization, Business Logic.
- **Frontend:** React (Vite), State Management, Routing, Error Boundaries, UI/UX consistency.
- **Infrastructure:** Environment variables, build scripts, documentation accuracy.

## 3. Methodology
We will use a **Risk-Based Approach**, prioritizing high-impact areas first.
- **Automated Scanning:** Using `grep` and pattern matching for anti-patterns.
- **Manual Code Review:** Tracing critical data flows.
- **Documentation Cross-Check:** Verifying implementation against `docs/`.

## 4. Audit Phases

### Phase 1: Security & Identity (Critical)
- **Authentication:** Review JWT implementation in `generateToken.js` and `auth.js`.
- **Authorization:** Audit `RoleGuard` (Frontend) and `authorize` middleware (Backend) for bypass risks.
- **Sanitization:** Check for SQL injection in `pool.execute` and XSS in frontend rendering.
- **Secrets:** Ensure `.env.example` is complete and no real secrets are in the repo.

### Phase 2: Business Logic & Data Integrity (High)
- **Inventory Math:** Audit stock movement logic in `stockController.js` and `plantController.js`.
- **Transactions:** Verify if multi-step operations (e.g., adding a plant + logging activity) are atomic or handled safely.
- **Validation:** Compare backend validation against the MySQL schema.

### Phase 3: Error Handling & Resilience (Medium)
- **Centralized Errors:** Audit `server.js` for global error handling middleware.
- **Async Handling:** Ensure all async calls are wrapped in `try/catch` with consistent error responses.
- **Frontend Fallbacks:** Verify how the UI handles API timeouts or 500 errors.

### Phase 4: DX, Syntax & Maintenance (Low)
- **Syntax & Linting:** Identify syntax errors or outdated JS patterns.
- **Consistency:** Audit naming conventions, folder structure, and API response formats.
- **Dead Code:** Identify unused imports or unreachable logic.

## 5. Deliverables
A structured Audit Report categorized by severity:
- **CRITICAL:** Immediate security risks or data corruption bugs.
- **HIGH:** Significant logic errors or major stability issues.
- **MEDIUM:** Sub-optimal error handling or UI bugs.
- **LOW:** Syntax polish, consistency, and minor improvements.

## 6. Success Criteria
- All critical and high-priority paths are audited.
- A comprehensive report is provided.
- The user has a clear roadmap for necessary fixes.
