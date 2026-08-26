# Growventory - Technical Documentation

## 1. Overview

Growventory is a full-stack Nursery Management System for inventory tracking, plant health monitoring, staff coordination, user administration, and reporting. It is built around a centralized architecture focused on data integrity, concurrency protection, approval workflows, and role-based access control (RBAC).

The system is organized into two applications:

- **Backend** — a REST API (Express.js) with a service layer that enforces atomic, audited stock operations and a MySQL database that is auto-initialized on server start.
- **Frontend** — a React SPA (Vite) consumed by four roles: Admin, Supervisor, Staff, and Auditor.

## 2. Tech Stack

### Backend
- **Runtime:** Node.js
- **Language:** TypeScript (strict mode, compiled to `dist/` via `tsc`; dev runner `tsx watch`)
- **Framework:** Express.js (v4.18)
- **Database:** MySQL (v8.0+) via `mysql2/promise` connection pool (up to 10 concurrent connections)
- **Authentication:** JWT (`jsonwebtoken`, configurable expiry, default 7 days) & `bcryptjs` (10 rounds) for password hashing
- **Security:** `helmet` (with `crossOriginResourcePolicy: cross-origin`), `express-rate-limit` (brute-force protection on auth endpoints), `cors`
- **File Uploads:** `multer` (disk storage for plant images; memory storage for CSV import)
- **PDF Generation:** `pdfkit` (inventory & stock-movement reports)
- **Config:** `dotenv`
- **Testing:** Jest & Supertest (unit tests with mocked DB)

### Frontend
- **Library:** React 18.2
- **Language:** TypeScript (strict, `jsx: react-jsx`, shared domain types in `src/types.ts`)
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS (v3.4) with custom design tokens (`ink`, `moss`, `accent`, legacy `forest`/`brand` palettes), PostCSS, Autoprefixer
- **Routing:** React Router DOM (v6)
- **Data Fetching:** Axios (with request/response interceptors)
- **Data Visualization:** Recharts
- **Icons & UI:** Lucide React
- **Notifications:** React Hot Toast (UI toasts + in-app notification toasts)

## 3. System Architecture

### Backend Architecture
The backend follows an MVC-like structure with a centralized **Service Layer** for critical business logic:

- **Controllers** (`backend/controllers/`) — handle HTTP requests, validate input, and orchestrate calls to services/database. Each controller returns a consistent `{ success, message, data? }` envelope (except binary downloads).
- **Services** (`backend/services/`) — `StockService` centralizes all stock mutations inside SQL transactions using `SELECT ... FOR UPDATE` row-level locking, preventing "Lost Update" anomalies under concurrency. Direct `current_stock` writes from controllers are forbidden (enforced in `plantController.updatePlant`).
- **Middleware** (`backend/middleware/auth.ts`) — `authenticate` verifies the JWT Bearer token and loads the user with their role (rejecting inactive users and users without a role); `authorize(...roles)` enforces RBAC with case-insensitive role comparison.
- **Notification helpers** — `createNotification()` and `notifyAdminsAndSupervisors()` in `notificationController.ts` are reused across modules (stock, health, tasks, users) to fan out in-app alerts.
- **Error handling** — global 404 handler and a central error middleware that only exposes stack traces in development.
- **Rate limiting** — `express-rate-limit` applied to `/api/auth/login` and `/api/auth/register` (max 5 requests per 15 minutes).

### Frontend Architecture
The frontend is a single-page application with route-level components under `src/pages`:

- **State Management:** `AuthContext` (React Context) holds the logged-in user and token (persisted in `localStorage`); module pages use local component state.
- **Route Protection:** `ProtectedRoute` blocks unauthenticated access; `RoleGuard` restricts routes by role with a fallback redirect to `/dashboard`.
- **API Integration:** `src/services/api.ts` creates an Axios instance (`VITE_API_BASE_URL` or `/api`), attaches the JWT to every request via a request interceptor, and globally handles 401 (clears session, redirects to `/login`) and 5xx (error toast) responses.
- **Dashboard:** auto-refreshes every 15 seconds and on window focus via parallel `Promise.all` fetches.
- **Notifications UI:** the Navbar polls `/notifications` for unread count and shows typed toast notifications (`low_stock`, `health_issue`, `system`, `task`, `approval`).

### Approval Workflows
Two explicit approval flows gate critical actions:

1. **User registration approval** — new registrations land in a `pending` state (`role_id = NULL`, `is_active = 0`). Admins approve (assigning a role) or reject (removing the account) from the Users page. The `auto_approve_registrations` system setting can bypass this by auto-assigning the lowest-privilege `staff` role. Clients can never self-assign a role (`role_id` in the registration body is ignored).
2. **Stock movement approval** — when the `require_stock_approval` setting is enabled and the actor is `staff`, stock movements are recorded as `pending` **without** changing stock. A Supervisor/Admin then approves (re-validates against current stock and applies the change atomically) or rejects. Movements created by Supervisors/Admins are auto-approved and applied immediately.

## 4. Directory Structure

```text
growventory/
├── backend/
│   ├── config/            # DB connection pool + auto table initialization (config/db.ts)
│   ├── controllers/       # auth, plant, category, stock, health, dashboard,
│   │                      # report, notification, user, task, settings
│   ├── middleware/        # JWT authentication + RBAC authorization
│   ├── routes/            # Express route definitions (11 route modules)
│   ├── services/          # StockService (transactional, row-locked stock updates)
│   ├── utils/             # JWT token generation/verification
│   ├── tests/             # Jest/Supertest unit tests (mocked DB)
│   ├── uploads/           # Plant image storage (served at /uploads)
│   ├── server.ts          # App entry, middleware, route mounting
│   └── seedAdmin.ts       # Seeds roles + default admin user
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # DashboardLayout, Sidebar, Navbar, RoleGuard,
│   │   │                  # ProtectedRoute, Tooltip
│   │   ├── context/       # AuthContext (login/register/logout, user state)
│   │   ├── pages/         # Landing, auth/*, DashboardHome, Plants, Categories,
│   │   │                  # Stock, Health, Tasks, Reports, Logs, Notifications,
│   │   │                  # Users, Settings
│   │   └── services/      # Axios instance with interceptors (api.ts)
│   ├── netlify.toml       # Netlify build/publish config
│   ├── _redirects         # SPA fallback redirect
│   └── vite.config.ts     # Dev server (port 3000) + /api & /uploads proxy
├── docs/                  # Database schema, API docs, deployment guide,
│                          # security audit report, testing checklist
├── DEMO_GUIDE.md
└── TECHNICAL_DOCUMENTATION.md
```

## 5. Database Schema

The MySQL database is initialized automatically on server start (`config/db.ts`): all tables use `CREATE TABLE IF NOT EXISTS`, and additive migrations (e.g., stock-movement approval columns, plant `is_active`) are applied defensively via try/catch `ALTER TABLE` statements.

**Tables (10):**

| Table | Purpose |
|---|---|
| `roles` | Role definitions: `admin`, `supervisor`, `staff`, `auditor` |
| `users` | Auth credentials (`username`, `email`, bcrypt `password`), profile, `role_id`, `is_active` soft-disable. `role_id = NULL` marks a pending registration |
| `categories` | Plant category grouping (name is unique) |
| `plants` | Master inventory table: `current_stock`, `min_stock_threshold`, `health_status` ENUM (`healthy`, `under_observation`, `poor`, `critical`), `growth_stage`, `location`, prices, `image_url`, `last_health_check`, `is_active` (soft delete) |
| `stock_movements` | Immutable audit ledger for `IN` / `OUT` / `ADJUSTMENT`, with `previous_stock`, `new_stock`, `created_by`, plus approval columns `approval_status` (`approved`/`pending`/`rejected`), `approved_by`, `approved_at` |
| `plant_health_logs` | Health check history: status, growth stage, notes, `checked_by`, `check_date` |
| `activity_logs` | System-wide audit trail (actor, action type, table, record ID, description) |
| `notifications` | Per-user in-app notifications with `type` (VARCHAR: `system`, `approval`, `low_stock`, `health_issue`, etc.) and `is_read` |
| `tasks` | Staff task management: `assigned_to`, `assigned_by`, `priority` (`low`/`medium`/`high`/`urgent`), `status` (`pending`/`in_progress`/`completed`/`cancelled`), `due_date`, `completed_at` |
| `system_settings` | Key/value settings, seeded with defaults (see §8) |

**Default settings seeded on start:** `low_stock_threshold=10`, `require_stock_approval=false`, `notification_email_enabled=false`, `currency=USD`, `date_format=YYYY-MM-DD`, `auto_approve_registrations=false`.

## 6. Core API Endpoints

Base URL: `/api`. All endpoints except `/auth/login`, `/auth/register`, and `/auth/seed-roles` require `Authorization: Bearer <token>`.

### Auth — `/api/auth`
| Method & Path | Access | Notes |
|---|---|---|
| `POST /register` | Public | Rate-limited. Email format + password ≥ 6 chars validated; duplicate username/email → 409. Creates pending account (or auto-approves as `staff` if setting enabled) |
| `POST /login` | Public | Rate-limited. Accepts username **or** email; password verified before account state is disclosed; pending → 403 `PENDING_APPROVAL`, disabled → 403 `ACCOUNT_DISABLED` |
| `GET /seed-roles` | Public | Idempotently seeds the 4 default roles |
| `GET /me` | Authenticated | Returns current user with role |

### Plants — `/api/plants`
| Method & Path | Access | Notes |
|---|---|---|
| `GET /` | All roles | Filters: `search` (name/scientific name/description), `category_id`, `health_status`, `min_stock`, `include_inactive` |
| `GET /:id` | All roles | |
| `POST /` | Admin, Supervisor, Staff | `multipart/form-data`; image upload (JPG/PNG/GIF/WEBP, ≤ 5 MB); initial stock > 0 creates an `IN` movement audit record |
| `PUT /:id` | Admin, Supervisor, Staff | Direct `current_stock` updates rejected — use the Stock module |
| `POST /import` | Admin | CSV import (≤ 10 MB, quoted-field parsing, per-row transactions, error report for bad rows) |
| `DELETE /:id` | Admin | Soft delete (`is_active = 0`) to preserve audit history |

### Categories — `/api/categories`
| Method & Path | Access | Notes |
|---|---|---|
| `GET /` | All roles | Includes plant count & total stock per category |
| `POST /`, `PUT /:id` | Admin, Supervisor | Duplicate names → 409 |
| `DELETE /:id` | Admin, Supervisor | Blocked while active plants are assigned; orphans inactive plants |

### Stock — `/api/stock`
| Method & Path | Access | Notes |
|---|---|---|
| `GET /movements` | All roles | Filters: `plant_id`, `movement_type`, `status` |
| `GET /movements/:id` | All roles | |
| `POST /movements` | Admin, Supervisor, Staff | `IN`/`OUT`/`ADJUSTMENT`; auto-approved for admin/supervisor; `pending` for staff when approval is required; `OUT` validated against current stock |
| `PATCH /movements/:id/approve` | Admin, Supervisor | Re-validates and applies atomically via `StockService` |
| `PATCH /movements/:id/reject` | Admin, Supervisor | Optional reason appended to notes |
| `DELETE /movements/:id` | Admin, Supervisor | Reverses stock change if the movement was approved |

### Health — `/api/health`
| Method & Path | Access | Notes |
|---|---|---|
| `GET /logs` | All roles | Filters: `plant_id`, `health_status` |
| `GET /logs/:id` | All roles | |
| `POST /logs` | Admin, Staff | Transactional: inserts log, updates plant status/growth stage, fires alert for `poor`/`critical` |
| `PUT /logs/:id` | Admin, Supervisor | Updates log and syncs plant status |

### Dashboard — `/api/dashboard`
| Method & Path | Access |
|---|---|
| `GET /overview` | All roles |
| `GET /low-stock` | All roles |
| `GET /category-stats` | All roles |
| `GET /recent-activities` | All roles (`limit`, 1–100) |
| `GET /health-summary` | All roles |
| `GET /advanced-analytics` | All roles — 30-day stock trends, category performance (stock value), 6-month health trends, 7-day user activity |

### Reports — `/api/reports` (Admin, Supervisor, Auditor)
| Method & Path | Notes |
|---|---|
| `GET /inventory-csv` | Active plants |
| `GET /stock-movements-csv` | Filters: `plant_id`, `start_date`, `end_date` |
| `GET /health-logs-csv` | Filter: `plant_id` |
| `GET /summary` | JSON or CSV via `?download=csv` |
| `GET /inventory-pdf` | pdfkit; low-stock rows highlighted red; paginated table |
| `GET /stock-movements-pdf` | pdfkit; IN/OUT/ADJUSTMENT color-coded; supports same filters as CSV |

### Notifications — `/api/notifications`
| Method & Path | Access |
|---|---|
| `GET /` | All roles — returns list + `unread_count` |
| `GET /unread` | All roles |
| `PUT /:id/read` | All roles (own notifications only) |
| `PUT /mark-all-read` | All roles |

### Users — `/api/users` (Admin only, except `GET /roles`)
| Method & Path | Notes |
|---|---|
| `GET /roles` | Any authenticated user |
| `GET /` | Includes `account_status` (`pending`/`active`/`disabled`) |
| `GET /pending` | Pending registrations |
| `POST /` | Direct creation with role assignment |
| `PUT /:id` | Update profile/role/status |
| `PATCH /:id/approve` | Assigns role + activates pending user |
| `PATCH /:id/reject` | Removes pending registration |
| `PATCH /:id/toggle-active` | Enable/disable account |
| `PATCH /:id/reset-password` | Admin-initiated password reset |
| `DELETE /:id` | Cannot delete self; cleans up FK references first |

### Tasks — `/api/tasks`
| Method & Path | Access | Notes |
|---|---|---|
| `GET /` | All roles | Staff only sees their own tasks; `status` filter |
| `POST /` | Admin, Supervisor | Notifies assignee; `high`/`urgent` flagged |
| `PATCH /:id/status` | Assignee, assigner, Admin, Supervisor | Completed tasks locked to owner/assigner/admin |
| `PUT /:id` | Admin, Supervisor | Notifies new assignee on reassignment |
| `DELETE /:id` | Admin, Supervisor | |

### Settings — `/api/settings`
| Method & Path | Access |
|---|---|
| `GET /` | All roles |
| `PUT /` | Admin — bulk upsert of key/value settings |

## 7. Security & Access Control

### Role-Based Access Control (RBAC)
- **Admin** — full control: user management, settings, plant import/delete, stock approval, reports.
- **Supervisor** — operational management: categories, stock movements (create + approve/reject), health logs, tasks, reports; no user/settings access.
- **Staff** — day-to-day data entry: plants, stock movements (may require approval), health logs, own tasks; read-only dashboard.
- **Auditor** — read-only: dashboard, reports, and activity logs.

Frontend enforces the same matrix twice: routes via `RoleGuard`/`Sidebar` filtering, and backend endpoints via `authorize(...)`.

### Security Hardening
- **JWT Authentication:** stateless tokens signed with `JWT_SECRET`; default 7-day expiry (`JWT_EXPIRES_IN`); every authenticated request re-validates the user's role and active status against the DB (so disabled users are rejected immediately).
- **Password Handling:** bcrypt (10 rounds); passwords never returned by the API; login verifies credentials before revealing account state (prevents account enumeration); admin-only password reset.
- **Registration Integrity:** clients cannot self-assign roles; pending users cannot log in until an admin approves them.
- **Concurrency & Data Integrity:** all stock mutations run in transactions with `SELECT ... FOR UPDATE` row locks; approvals re-validate against live stock; audit entries (`activity_logs`, `stock_movements`) are written inside the same transactions.
- **Soft Deletes:** plants are soft-deleted (`is_active = 0`) to preserve the movement/health audit trail.
- **Rate Limiting:** 5 requests / 15 min on login and register endpoints.
- **HTTP Hardening:** `helmet` with `crossOriginResourcePolicy: cross-origin` (required for serving `/uploads` images to the SPA).
- **CORS:** all origins allowed in development; explicit allowlist (`localhost:3000`, `localhost:5173`, `FRONTEND_URL`) in production.
- **Upload Validation:** image MIME + extension allowlists and 5 MB size cap; CSV import restricted to admin with a 10 MB cap.
- **Global Error Handler:** production responses never leak stack traces.

## 8. Configuration

Environment variables configure both applications.

**Backend (`backend/.env`):**
| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | API server port |
| `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `root` / `` / `growventory` | MySQL connection |
| `JWT_SECRET` | — | Token signing key (must be changed in production) |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `NODE_ENV` | `development` | Enables dev CORS, verbose errors |
| `FRONTEND_URL` | — | Production CORS allowlist entry |

**Frontend (`frontend/.env`):**
| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Backend base URL for Axios |

> Note: the Vite dev server runs on port `3000` and proxies `/api` and `/uploads` (configured to target `localhost:5001` in `vite.config.ts`); the proxy target should match the backend `PORT` if the proxy path is used instead of `VITE_API_BASE_URL`.

## 9. Setup, Seeding & Scripts

- **Backend:** `npm start` (production, runs compiled `dist/server.js`) or `npm run dev` (tsx watch — TypeScript hot reload). Tables and default settings are auto-provisioned on start.
- **Seed admin:** `npm run seed` seeds the 4 roles and creates/updates the default admin account (`admin@growventory.com` / `Admin@123`) — change the password after first login.
- **Seed roles via API:** `GET /api/auth/seed-roles`.
- **Dev utilities:** `get-token.ts` (generate a JWT for testing), `reset-admin.ts` (re-seed admin credentials), `test-password.ts` — run with `npx tsx <file>.ts`.
- **Tests:** `backend/tests/` — Jest unit tests (`stockController.test.ts`, `plantController.test.ts`) with mocked DB pool and service, run via `npm test` (@swc/jest).
- **Frontend:** `npm run dev` (Vite, port 3000), `npm run build` → static output in `dist/`, `npm run preview`.

## 10. Deployment Notes

- **Backend:** run with `node dist/server.js` behind PM2 (see `docs/Deployment_Guide.md` for a full AWS EC2 + Nginx + PM2 + RDS MySQL walkthrough). Uploaded images persist under `backend/uploads/` and are served at `/uploads`.
- **Frontend:** `npm run build` generates static files in `dist/` deployable to Nginx, Netlify, or Vercel. Netlify configuration is pre-included (`netlify.toml`, `_redirects` for SPA fallback).
- **Environment:** set strong `JWT_SECRET` and DB credentials, `NODE_ENV=production`, and a `FRONTEND_URL` allowlist in production.

## 11. Related Documentation

- [`docs/Database_Schema.md`](docs/Database_Schema.md) — full schema reference
- [`docs/API_Documentation.md`](docs/API_Documentation.md) — endpoint reference with payloads
- [`docs/Deployment_Guide.md`](docs/Deployment_Guide.md) — AWS deployment guide
- [`docs/full_audit_report_2026-06-03.md`](docs/full_audit_report_2026-06-03.md) — security audit report
- [`docs/Testing_Checklist.md`](docs/Testing_Checklist.md) — QA checklist
- [`docs/FYP_Presentation_Notes.md`](docs/FYP_Presentation_Notes.md) — final year project presentation notes
- [`README.md`](README.md) — user-facing overview and quick start
