# Design Doc: Audit Remediation (Security & Stability)

**Date:** 2026-06-03  
**Status:** Approved  
**Topic:** Remediating Critical and High severity issues identified in the June 2026 Audit.

## 1. Purpose & Goals
The goal is to harden the Growventory application against security threats and ensure perfect data integrity for inventory operations. This design addresses all findings from the audit report *except* for the .env file exposure (handled separately).

## 2. Architecture & Components

### 2.1 Security Layer (Backend)
- **Helmet:** Integrate `helmet` middleware in `server.js` for secure headers.
- **Rate Limiting:** Implement `express-rate-limit` on `/api/auth/login` and `/api/auth/register`. (Max 5 attempts per 15 mins).
- **CORS:** Configure `cors` to allow only the frontend origin (environment dependent).
- **Resilient Error Handler:**
    - Development: Returns full error stack/message.
    - Production: Returns a generic message and logs the full error to the server console for debugging.

### 2.2 Inventory Service Layer (Backend)
To fix "Audit Trail Bypasses" and "Lost Updates," we introduce a centralized service.
- **File:** `backend/services/stockService.js`
- **Responsibilities:**
    - Encapsulate all stock-related database writes.
    - Use `pool.getConnection()` to manage SQL transactions.
    - Enforce **Row-Level Locking** using `SELECT ... FOR UPDATE` on the `plants` table before any modification.
    - **Methods:**
        - `updateStock(plantId, quantity, type, userId, reason)`: Handles IN/OUT movements.
        - `initializeStock(plantId, initialQuantity, userId)`: Used during plant creation/import to ensure an initial 'IN' movement is logged.
- **Impact:** `plantController.js` and `stockController.js` will be refactored to use this service, ensuring that direct updates to `current_stock` are impossible without a corresponding `stock_movements` record.

### 2.3 Authorization & Consistency
- **RBAC Alignment:** Update `backend/routes/stockRoutes.js` and `backend/routes/categoryRoutes.js` to grant the `supervisor` role access to create/update/delete operations.
- **Documentation:** Synchronize `docs/Database_Schema.md` with the actual implementation in `backend/config/db.js`.

### 2.4 Error Handling & UX (Frontend)
- **Axios Interceptor:** Update `api.js` to catch 500 errors globally and show a "Server Error" toast.
- **Feedback Loop:** Replace empty catch blocks and `console.error` calls with user-facing `toast.error()` notifications (using `react-hot-toast`).

## 3. Data Flow (Inventory Update)
1. Controller calls `StockService.updateStock()`.
2. Service acquires a DB connection and starts a transaction.
3. Service executes `SELECT current_stock FROM plants WHERE plant_id = ? FOR UPDATE`.
4. Service calculates new stock.
5. Service updates `plants` table.
6. Service inserts record into `stock_movements`.
7. Service commits transaction and releases connection.

## 4. Success Criteria
- No audit trail bypasses exist (all stock changes are logged).
- Concurrent stock updates do not result in data loss.
- Sensitive endpoints are protected by rate limiting.
- Production errors do not leak system internals.
- Supervisors can perform operational duties as intended.
