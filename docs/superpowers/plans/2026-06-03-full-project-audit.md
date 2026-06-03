# Full Project Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute a comprehensive risk-based audit of the Growventory project to identify bugs and security/stability issues, resulting in a structured audit report.

**Architecture:** Systematic investigation following the Risk-Based Audit design spec. Each task focuses on a specific risk category. Since this is a "Report First" audit, the "implementation" involves recording findings in a temporary file `docs/audit_findings.md` instead of modifying source code.

**Tech Stack:** Node.js, Express, React, MySQL, grep, shell commands.

---

### Task 1: Phase 1 - Security & Identity Audit

**Files:**
- Audit: `backend/utils/generateToken.js`
- Audit: `backend/middleware/auth.js`
- Audit: `frontend/src/components/RoleGuard.jsx`
- Audit: `backend/routes/*.js`
- Record: `docs/audit_findings.md`

- [ ] **Step 1: Audit JWT Implementation**
Run: `grep -r "jwt" backend/`
Analyze `generateToken.js` for secret handling and expiration.
Analyze `auth.js` for verification logic and error responses.
Check for hardcoded secrets in these files.

- [ ] **Step 2: Audit RBAC (Role-Based Access Control)**
Analyze `backend/middleware/auth.js` (authorize function).
Trace usage in `backend/routes/`. Verify if sensitive routes (delete, update, settings) have `authorize` middleware.
Analyze `frontend/src/components/RoleGuard.jsx` and its usage in `App.jsx`.

- [ ] **Step 3: Audit Input Sanitization**
Run: `grep -r "pool.execute" backend/controllers/`
Check for potential SQL injection (e.g., using variables directly in strings instead of placeholders).
Search for `dangerouslySetInnerHTML` in `frontend/src/` to check for XSS risks.

- [ ] **Step 4: Record Phase 1 Findings**
Add "Phase 1: Security & Identity" section to `docs/audit_findings.md`.
Categorize findings by severity (Critical, High, etc.).

---

### Task 2: Phase 2 - Business Logic & Data Integrity Audit

**Files:**
- Audit: `backend/controllers/stockController.js`
- Audit: `backend/controllers/plantController.js`
- Audit: `backend/config/db.js`
- Record: `docs/audit_findings.md`

- [ ] **Step 1: Audit Inventory Mathematics**
Analyze `addMovement` and `approveMovement` in `stockController.js`.
Verify if `current_stock` is updated correctly and if negative stock is prevented.
Check for race conditions (multiple updates to the same plant stock).

- [ ] **Step 2: Audit Atomic Operations**
Check if multi-step operations (e.g., creating a plant + initial stock + activity log) are wrapped in transactions or have fallback logic.
Run: `grep -r "BEGIN" backend/` or `grep -r "transaction" backend/` to see if transactions are used.

- [ ] **Step 3: Audit Schema Validation**
Compare `Database_Schema.md` and `backend/config/db.js` table definitions with controller logic.
Check if mandatory fields (NOT NULL) are validated in the controllers.

- [ ] **Step 4: Record Phase 2 Findings**
Add "Phase 2: Business Logic & Data Integrity" section to `docs/audit_findings.md`.

---

### Task 3: Phase 3 - Error Handling & Resilience Audit

**Files:**
- Audit: `backend/server.js`
- Audit: `backend/controllers/*.js`
- Audit: `frontend/src/App.jsx`
- Record: `docs/audit_findings.md`

- [ ] **Step 1: Audit Centralized Error Handling**
Check `backend/server.js` for `app.use((err, req, res, next) => { ... })`.
Verify if errors are leaked to the client (e.g., sending the whole `err` object in production).

- [ ] **Step 2: Audit Async/Await Safety**
Run: `grep -r "async" backend/controllers/ | grep -v "try"` to find async functions missing try/catch.
Check if every `try/catch` block returns a standard `{ success: false, message: ... }` JSON response.

- [ ] **Step 3: Audit Frontend Resilience**
Check `frontend/src/services/api.js` for interceptors or global error handling.
Analyze `App.jsx` or specific pages for loading states and error messages when API fails.

- [ ] **Step 4: Record Phase 3 Findings**
Add "Phase 3: Error Handling & Resilience" section to `docs/audit_findings.md`.

---

### Task 4: Phase 4 - DX, Syntax & Maintenance Audit

**Files:**
- Audit: `frontend/src/**/*.jsx`
- Audit: `backend/**/*.js`
- Audit: `package.json`
- Record: `docs/audit_findings.md`

- [ ] **Step 1: Scan for Syntax & Linting Issues**
Run: `npm run lint` in both `backend` and `frontend` (if available).
Search for `console.log` left in production code: `grep -r "console.log" . | grep -v "node_modules"`
Search for unused variables or imports.

- [ ] **Step 2: Audit Consistency**
Check naming conventions across backend controllers and frontend services.
Check if API response structure is consistent across all endpoints.

- [ ] **Step 3: Audit Dead Code & Dependencies**
Check `package.json` for unused dependencies.
Identify files that are not imported anywhere.

- [ ] **Step 4: Record Phase 4 Findings**
Add "Phase 4: DX, Syntax & Maintenance" section to `docs/audit_findings.md`.

---

### Task 5: Final Report Synthesis

**Files:**
- Read: `docs/audit_findings.md`
- Create: `docs/full_audit_report_2026-06-03.md`

- [ ] **Step 1: Consolidate Findings**
Organize all findings from `docs/audit_findings.md` into the final report format.
Assign a clear severity level to each finding.
Provide brief recommendations for each identified issue.

- [ ] **Step 2: Final Review**
Self-review the report against the Audit Design Spec.
Ensure the report is professional and actionable.

- [ ] **Step 3: Cleanup**
Remove `docs/audit_findings.md`.
Finalize `docs/full_audit_report_2026-06-03.md`.
