# Audit Remediation (Security & Stability) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement comprehensive security and data integrity fixes identified in the June 2026 Audit, including a new Stock Service and hardened infrastructure.

**Architecture:** 
- **Security:** Layered middleware (helmet, rate-limit, cors) and environment-aware error handling.
- **Data Integrity:** Centralized `StockService` using SQL transactions and row-level locking (`FOR UPDATE`) to prevent inventory discrepancies and lost updates.

**Tech Stack:** Node.js, Express, React, MySQL, helmet, express-rate-limit.

---

### Task 1: Security Hardening & Infrastructure (Backend)

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/server.js`

- [ ] **Step 1: Install security dependencies**
Run: `npm install helmet express-rate-limit` in the `backend` directory.

- [ ] **Step 2: Configure security middleware in `server.js`**
```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ... after app initialization
app.use(helmet());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { success: false, message: 'Too many login attempts, please try again later.' }
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Update CORS (assuming VITE_APP_URL is in .env)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

- [ ] **Step 3: Update global error handler in `server.js`**
```javascript
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}:`, err.stack);
  
  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    success: false,
    message: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack })
  });
});
```

- [ ] **Step 4: Commit**
```bash
git add backend/package.json backend/server.js
git commit -m "sec: add helmet, rate limiting, and secure error handling"
```

---

### Task 2: Stock Service Implementation

**Files:**
- Create: `backend/services/stockService.js`

- [ ] **Step 1: Create the StockService**
```javascript
const { pool } = require('../config/db');

class StockService {
  /**
   * Updates stock using a transaction and row-level locking.
   */
  async updateStock(plantId, quantity, type, userId, reason, connection = null) {
    const conn = connection || await pool.getConnection();
    if (!connection) await conn.beginTransaction();

    try {
      // 1. Lock the plant row for update
      const [plants] = await conn.execute(
        'SELECT current_stock FROM plants WHERE plant_id = ? FOR UPDATE',
        [plantId]
      );

      if (plants.length === 0) throw new Error('Plant not found');
      
      const oldStock = plants[0].current_stock;
      const newStock = type === 'IN' ? oldStock + quantity : oldStock - quantity;

      if (newStock < 0) throw new Error('Insufficient stock');

      // 2. Update plant stock
      await conn.execute(
        'UPDATE plants SET current_stock = ? WHERE plant_id = ?',
        [newStock, plantId]
      );

      // 3. Record movement
      await conn.execute(
        `INSERT INTO stock_movements (plant_id, user_id, quantity, movement_type, reason, status) 
         VALUES (?, ?, ?, ?, ?, 'approved')`,
        [plantId, userId, quantity, type, reason]
      );

      if (!connection) await conn.commit();
      return { success: true, newStock };
    } catch (error) {
      if (!connection) await conn.rollback();
      throw error;
    } finally {
      if (!connection) conn.release();
    }
  }

  /**
   * Initializes stock for a new plant (creates initial movement).
   */
  async initializeStock(plantId, quantity, userId, connection) {
    await connection.execute(
      `INSERT INTO stock_movements (plant_id, user_id, quantity, movement_type, reason, status) 
       VALUES (?, ?, ?, 'IN', 'Initial stock setup', 'approved')`,
      [plantId, userId, quantity]
    );
  }
}

module.exports = new StockService();
```

- [ ] **Step 2: Commit**
```bash
git add backend/services/stockService.js
git commit -m "feat: add centralized StockService with transaction and locking"
```

---

### Task 3: Refactor Plant Controller (Audit Trail Persistence)

**Files:**
- Modify: `backend/controllers/plantController.js`

- [ ] **Step 1: Integrate StockService into `createPlant`**
Wrap the plant creation in a transaction and call `stockService.initializeStock`.

- [ ] **Step 2: Integrate StockService into `updatePlant`**
Remove direct `current_stock` updates. If `current_stock` is provided, throw an error or redirect to Stock Management (preferred: don't allow direct edits via Update Plant).

- [ ] **Step 3: Integrate StockService into `importPlants`**
Ensure each imported plant with stock > 0 gets an initial movement record via `StockService`.

- [ ] **Step 4: Commit**
```bash
git add backend/controllers/plantController.js
git commit -m "refactor: integrate StockService into plant controller"
```

---

### Task 4: Refactor Stock Controller (Atomic Operations)

**Files:**
- Modify: `backend/controllers/stockController.js`

- [ ] **Step 1: Refactor `approveMovement` to use `StockService`**
Replace the manual locking and update logic with `stockService.updateStock`.

- [ ] **Step 2: Ensure all multi-step actions use transactions**
Review `createMovement` and other functions for atomicity.

- [ ] **Step 3: Commit**
```bash
git add backend/controllers/stockController.js
git commit -m "refactor: use StockService in stock controller for atomic updates"
```

---

### Task 5: RBAC & Documentation Alignment

**Files:**
- Modify: `backend/routes/stockRoutes.js`
- Modify: `backend/routes/categoryRoutes.js`
- Modify: `docs/Database_Schema.md`

- [ ] **Step 1: Update routes to allow `supervisor`**
Add `'supervisor'` to the `authorize()` middleware for POST, PUT, DELETE routes.

- [ ] **Step 2: Sync Documentation**
Update `docs/Database_Schema.md` to match `backend/config/db.js` (add approval fields to stock_movements, etc.).

- [ ] **Step 3: Commit**
```bash
git add backend/routes/ docs/Database_Schema.md
git commit -m "fix: align supervisor RBAC and update database schema docs"
```

---

### Task 4: Frontend Error Resilience

**Files:**
- Modify: `frontend/src/services/api.js`
- Modify: `frontend/src/pages/DashboardHome.jsx`
- Modify: `frontend/src/pages/Plants.jsx`

- [ ] **Step 1: Add global 500 error handler to `api.js`**
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);
```

- [ ] **Step 2: Add toast notifications to catch blocks**
Ensure `DashboardHome.jsx` and `Plants.jsx` use `toast.error(err.message)` instead of just `console.error`.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/
git commit -m "ui: add global error interceptor and improve user feedback"
```
