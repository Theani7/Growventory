# Full Project Audit Report: Growventory

**Date:** 2026-06-03  
**Auditor:** Gemini CLI  
**Scope:** Security, Business Logic, Error Handling, DX & Maintenance

---

## Executive Summary
The Growventory application has a solid foundation with standard practices like password hashing (bcrypt), parameterized SQL queries (MySQL2), and consistent async/await patterns. However, several **Critical** and **High** severity issues were identified, primarily regarding secret exposure, audit trail bypasses, and inconsistent authorization logic. Addressing these is essential for production readiness.

---

## Findings by Severity

### 🔴 CRITICAL
1.  **Exposed Secrets (.env)**: The `backend/.env` file is committed to the repository. This exposes the `JWT_SECRET`, database passwords, and other sensitive configuration.
    *   **Impact**: Full system compromise possible.
    *   **Recommendation**: Remove `.env` from git tracking, add to `.gitignore`, and rotate all exposed secrets immediately.
2.  **Audit Trail Bypass**: `plantController.js:updatePlant` allows direct modification of `current_stock`.
    *   **Impact**: Inventory history (`stock_movements`) becomes unreliable as stock levels can change without a record.
    *   **Recommendation**: Route all stock changes through a unified service that enforces `stock_movements` entry creation.
3.  **Concurrency Risks (Lost Updates)**: `createHealthLog` in `healthController.js` lacks row-level locking (`FOR UPDATE`) on the `plants` table despite using transactions.
    *   **Impact**: Concurrent health checks or stock updates could overwrite each other, leading to data corruption.
    *   **Recommendation**: Implement `SELECT ... FOR UPDATE` within transactions for all inventory-related updates.

### 🟠 HIGH
1.  **Missing Rate Limiting**: No protection on `/api/auth/login` or `/api/auth/register`.
    *   **Impact**: Vulnerable to brute-force and DoS attacks.
    *   **Recommendation**: Implement `express-rate-limit` on all authentication routes.
2.  **Non-Atomic Operations**: Most multi-step operations (e.g., creating a task + logging activity) do not use SQL transactions.
    *   **Impact**: Partial failures leave the database in an inconsistent state.
    *   **Recommendation**: Use `pool.getConnection()` and `connection.beginTransaction()` for all multi-step writes.
3.  **Broken RBAC (Supervisor)**: The `supervisor` role is blocked from creating stock movements and categories in the backend routes, contradicting frontend permissions.
    *   **Impact**: Supervisors cannot perform their intended duties.
    *   **Recommendation**: Update `stockRoutes.js` and `categoryRoutes.js` to include 'supervisor' in allowed roles.
4.  **Information Leakage**: Centralized error handler sends raw `err.message` to clients.
    *   **Impact**: Exposes internal system details (DB names, file paths) to potential attackers.
    *   **Recommendation**: Return a generic message in production; log details only to the server console/logs.
5.  **Audit Trail Gaps**: Initial stock during plant creation or import does not generate a movement record.
    *   **Impact**: Permanent discrepancy between movement logs and current stock totals.
    *   **Recommendation**: Insert an initial 'IN' movement for all new stock entries.

### 🟡 MEDIUM
1.  **Permissive CORS**: `backend/server.js` allows all origins.
    *   **Recommendation**: Restrict `cors()` to specific allowed domains.
2.  **Inconsistent Frontend Feedback**: Errors are often logged only to the console, and some catch blocks are empty.
    *   **Recommendation**: Implement a global toast system for all API failures and ensure all catch blocks provide user feedback.
3.  **Stale Documentation**: `docs/Database_Schema.md` does not match the actual code.
    *   **Recommendation**: Synchronize documentation with `backend/config/db.js`.
4.  **Architectural Debt**: High coupling between components and the API layer; brittle manual CSV/PDF generation.
    *   **Recommendation**: Abstract API calls into a service layer and use libraries for report generation.

### 🔵 LOW
1.  **Missing Security Headers**: No usage of `helmet`.
2.  **Missing DX Tooling**: No ESLint, Prettier, or automated tests.
3.  **Unused Dependencies**: Cleanup needed in `package.json`.

---

## Security Assessment Summary
| Category | Status | Notes |
| :--- | :--- | :--- |
| **Authentication** | ⚠️ Warning | JWT logic is good, but secrets are exposed in .env. |
| **Authorization** | ⚠️ Warning | RBAC logic exists but is inconsistently applied (Supervisor/Auditor). |
| **Injection** | ✅ Secure | Parameterized queries used throughout. |
| **XSS** | ✅ Secure | React handles escaping; no dangerous usage found. |
| **Auditability** | ❌ Failed | Bypass found in updatePlant; missing logs for initial stock. |

---

## Next Steps Roadmap
1.  **Immediate**: Fix `.env` exposure and rotate secrets.
2.  **Stability**: Implement SQL transactions and row-level locking for inventory operations.
3.  **Security**: Add `helmet`, rate limiting, and restricted CORS.
4.  **Consistency**: Align RBAC across frontend and backend; update documentation.
5.  **Quality**: Add ESLint/Prettier and start a basic test suite.
