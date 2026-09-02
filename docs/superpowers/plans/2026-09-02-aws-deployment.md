# AWS EC2 + RDS Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a turnkey, production-ready AWS deployment bundle for Growventory using AWS EC2 (Ubuntu), Nginx, PM2, and AWS RDS MySQL, minimizing operator manual effort through automated setup scripts.

**Architecture:** Nginx listens on port 80/443, serving the compiled Vite React SPA directly, reverse-proxying `/api/` to an Express API managed by PM2, and serving plant photos from `/uploads/` on persistent EBS storage. The API securely connects to a private AWS RDS MySQL 8.0 instance.

**Tech Stack:** AWS EC2 (Ubuntu 24.04/22.04 LTS), AWS RDS (MySQL 8.0), Nginx, PM2, Node.js 20 LTS, TypeScript, React 18 / Vite.

## Global Constraints
- Target platform: Ubuntu Linux on AWS EC2 (`t3.micro` / 1GB RAM) with 2GB swap.
- Database: AWS RDS MySQL 8.0 on private port 3306.
- Inbound ports on EC2: 22 (SSH), 80 (HTTP), 443 (HTTPS).
- Inbound ports on RDS: 3306 (MySQL) restricted to EC2 Security Group.
- Frontend must route API calls through `/api` reverse proxy without hardcoded IP addresses.
- Idempotent execution: Scripts must be safe to run multiple times without duplicating configurations.

---

### Task 1: Nginx Configuration (`deploy/nginx.conf`)

**Files:**
- Create: `deploy/nginx.conf`
- Test: Verify syntax and directive correctness using `bash -n` and local regex checks.

**Interfaces:**
- Consumes: Static build directory `/home/ubuntu/Growventory/frontend/dist` and upload directory `/home/ubuntu/Growventory/backend/uploads`.
- Produces: Virtual host routing HTTP port 80 traffic to React SPA, `/api` proxy to `http://127.0.0.1:5000`, and `/uploads` static file alias.

- [ ] **Step 1: Write `deploy/nginx.conf`**
Create the Nginx server block with:
- `listen 80;`
- `client_max_body_size 10M;` for plant image uploads.
- `location /` with `root /home/ubuntu/Growventory/frontend/dist;` and `try_files $uri $uri/ /index.html;`.
- `location /api/` proxying to `http://127.0.0.1:5000` with headers `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`.
- `location /uploads/` with `alias /home/ubuntu/Growventory/backend/uploads/;` and `expires 30d;`.
- Gzip compression enabled for JS, CSS, JSON, and SVG.

- [ ] **Step 2: Validate Nginx configuration formatting**
Check that bracket matching and semicolon syntax are valid.

- [ ] **Step 3: Commit**
```bash
git add deploy/nginx.conf
git commit -m "feat(deploy): add production nginx configuration"
```

---

### Task 2: PM2 Runtime Configuration (`deploy/ecosystem.config.cjs`)

**Files:**
- Create: `deploy/ecosystem.config.cjs`
- Test: Validate file syntax via `node --check deploy/ecosystem.config.cjs`.

**Interfaces:**
- Consumes: Compiled server at `backend/dist/server.js` and `backend/.env`.
- Produces: PM2 application manifest named `growventory-api`.

- [ ] **Step 1: Write `deploy/ecosystem.config.cjs`**
Configure PM2 process manager:
```javascript
module.exports = {
  apps: [
    {
      name: 'growventory-api',
      script: './dist/server.js',
      cwd: './backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '../deploy/logs/api-err.log',
      out_file: '../deploy/logs/api-out.log',
      time: true
    }
  ]
};
```

- [ ] **Step 2: Validate PM2 config with Node**
Run: `node --check deploy/ecosystem.config.cjs`
Expected: Exits with code 0 without syntax errors.

- [ ] **Step 3: Commit**
```bash
git add deploy/ecosystem.config.cjs
git commit -m "feat(deploy): add PM2 ecosystem configuration"
```

---

### Task 3: EC2 Master Setup Automation Script (`deploy/setup-ec2.sh`)

**Files:**
- Create: `deploy/setup-ec2.sh`
- Test: ShellCheck / bash syntax check via `bash -n deploy/setup-ec2.sh`.

**Interfaces:**
- Consumes: AWS RDS endpoint, database credentials, and admin setup input.
- Produces: Fully installed and configured EC2 instance with swap, Node 20, Nginx, PM2, compiled code, and running services.

- [ ] **Step 1: Write `deploy/setup-ec2.sh`**
Implement the script with:
1. `set -euo pipefail` for safe error handling.
2. Root check / sudo check.
3. Swap creation: Check if swap < 1.5GB; if so, create a 2GB `/swapfile`, enable it, and persist to `/etc/fstab`.
4. Apt dependency installation: `curl`, `git`, `nginx`, `mysql-client`.
5. Node.js 20 LTS repository setup via NodeSource and installation.
6. Global PM2 installation (`npm install -g pm2`).
7. Interactive prompt (or environment variable fallback) for:
   - `DB_HOST` (RDS Endpoint)
   - `DB_USER` (default: `admin`)
   - `DB_PASSWORD`
   - `DB_NAME` (default: `growventory`)
   - `JWT_SECRET` (generate strong 64-char secret if not supplied)
   - `ADMIN_PASSWORD` (for seeding default admin)
8. Generate `backend/.env` with production values.
9. Generate `frontend/.env` with `VITE_API_BASE_URL=/api`.
10. Ensure `backend/uploads/` directory exists with proper permissions.
11. Build backend: `cd backend && npm install && npm run build`.
12. Build frontend: `cd frontend && npm install && npm run build`.
13. Configure Nginx: link `deploy/nginx.conf` to `/etc/nginx/sites-available/growventory`, enable in `/etc/nginx/sites-enabled/`, remove default site, test with `nginx -t`, and restart Nginx.
14. Start PM2: `pm2 start deploy/ecosystem.config.cjs`, run `pm2 save`, and setup `pm2 startup systemd`.
15. Seed roles and admin: Run `npm run seed` in `backend` with `ALLOW_ADMIN_RESET=true`.
16. Print success banner with Public IP and verification steps.

- [ ] **Step 2: Validate shell script syntax**
Run: `bash -n deploy/setup-ec2.sh`
Expected: Clean pass with no syntax errors.

- [ ] **Step 3: Make executable and commit**
```bash
chmod +x deploy/setup-ec2.sh
git add deploy/setup-ec2.sh
git commit -m "feat(deploy): add automated EC2 master setup script"
```

---

### Task 4: Maintenance Scripts (`deploy/update.sh` & `deploy/seed.sh`)

**Files:**
- Create: `deploy/update.sh`
- Create: `deploy/seed.sh`
- Test: Shell syntax check via `bash -n deploy/update.sh deploy/seed.sh`.

**Interfaces:**
- Consumes: Git repository updates and DB connection in `backend/.env`.
- Produces: Zero-downtime application reloading and safe admin account initialization.

- [ ] **Step 1: Write `deploy/update.sh`**
Script that:
1. Pulls latest changes from Git (`git pull origin main`).
2. Installs any new dependencies (`npm install` in backend and frontend).
3. Re-compiles backend (`npm run build`).
4. Re-compiles frontend (`npm run build`).
5. Reloads PM2 without downtime (`pm2 reload growventory-api`).
6. Reloads Nginx (`sudo systemctl reload nginx`).
7. Prints confirmation of updated deployment.

- [ ] **Step 2: Write `deploy/seed.sh`**
A standalone helper script to reset or seed the administrator user on RDS safely without needing to manually run raw SQL commands.

- [ ] **Step 3: Validate shell syntax**
Run: `bash -n deploy/update.sh deploy/seed.sh`
Expected: Exits code 0.

- [ ] **Step 4: Make executable and commit**
```bash
chmod +x deploy/update.sh deploy/seed.sh
git add deploy/update.sh deploy/seed.sh
git commit -m "feat(deploy): add update and database seed maintenance scripts"
```

---

### Task 5: Frontend URL & Reverse Proxy Alignment

**Files:**
- Modify: `frontend/src/services/api.ts` (verify base URL resolution)
- Modify: `frontend/src/pages/Plants.tsx:14` (verify image preview fallback for relative URLs)
- Test: Run `npm run build` in `frontend/` to ensure TypeScript compilation passes.

**Interfaces:**
- Consumes: Relative API path `/api`.
- Produces: Seamless browser-to-Nginx-to-Express requests without CORS mismatch.

- [ ] **Step 1: Check frontend API client configuration**
Ensure `frontend/src/services/api.ts` handles relative paths like `/api` properly without prepending undefined host.

- [ ] **Step 2: Check `Plants.tsx` image rendering with relative API base**
In `Plants.tsx`:
```typescript
const API_HOST = import.meta.env.VITE_API_BASE_URL?.startsWith('http')
  ? new URL(import.meta.env.VITE_API_BASE_URL).origin
  : '';
```
Verify that when `VITE_API_BASE_URL=/api`, `API_HOST` evaluates to `''`, so `${API_HOST}${plant.image_url}` becomes `/uploads/...`, which works natively with the Nginx `/uploads` location block.

- [ ] **Step 3: Run frontend typecheck and build**
Run: `cd frontend && npm run build`
Expected: Build passes, `dist/` directory generated.

- [ ] **Step 4: Commit if changes made**
```bash
git add frontend/
git commit -m "fix(frontend): ensure relative API base and image URL support for Nginx reverse proxy"
```

---

### Task 6: AWS Console Step-by-Step Walkthrough Guide

**Files:**
- Create: `docs/AWS_QUICKSTART.md`
- Test: Verify links and formatting.

**Interfaces:**
- Consumes: AWS Deployment Design specifications.
- Produces: Crystal-clear, copy-paste ready reference guide with screenshots/steps for the operator.

- [ ] **Step 1: Write `docs/AWS_QUICKSTART.md`**
Cover:
1. Exact clicks to create RDS MySQL Free Tier.
2. Exact clicks to create EC2 Ubuntu Free Tier.
3. Exact steps to link RDS Security Group to EC2 Security Group.
4. One command to SSH into EC2 and run `bash deploy/setup-ec2.sh`.
5. Troubleshooting cheat sheet (logs, restart commands).

- [ ] **Step 2: Commit**
```bash
git add docs/AWS_QUICKSTART.md
git commit -m "docs: add concise AWS deployment quickstart guide"
```

---

## Self-Review Checklist
- **Spec coverage:** Covers EC2, RDS, Nginx, PM2, Plant image uploads, swap configuration, and automation scripts.
- **Placeholder scan:** No TBDs or vague instructions; explicit file contents and commands provided.
- **Type consistency:** Node 20 LTS, MySQL 8.0, PM2 app name `growventory-api` consistent across all scripts and configurations.
