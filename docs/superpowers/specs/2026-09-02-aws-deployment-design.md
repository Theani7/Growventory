# AWS Deployment Design: Growventory (EC2 + RDS MySQL)

- **Date:** 2026-09-02
- **Target Deadline:** 2026-09-10 (University FYP Showcase)
- **Target Architecture:** AWS EC2 (Ubuntu 24.04 LTS) + AWS RDS (MySQL 8.0)
- **Stack:** React 18 (Vite SPA) + Node.js/Express (TypeScript) + Nginx + PM2

---

## 1. Overview & Objectives

The goal is to deploy the Growventory full-stack nursery management application to Amazon Web Services (AWS) in a manner that:
1. **Requires minimal manual effort** from the operator, automating server configuration, build, process management, and Nginx proxying via scripts.
2. **Aligns 100% with the existing FYP documentation** ([`docs/Deployment_Guide.md`](../../Deployment_Guide.md)), using an EC2 instance with Nginx and PM2 connected to an AWS RDS MySQL database.
3. **Optimizes resource usage for AWS Free Tier** (`t3.micro` / 1GB RAM) by setting up a 2GB Linux swap space to prevent memory exhaustion during builds.
4. **Handles plant image uploads smoothly** via local EBS disk storage served directly by Nginx on `/uploads`, requiring zero risky code rewrites before the demo.

---

## 2. System Architecture & Traffic Flow

```
                                  INTERNET
                                      │
                                      ▼
                        [ HTTP:80 / HTTPS:443 ]
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│ AWS EC2 (Ubuntu 24.04 LTS — t3.micro Free Tier)                             │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │ Nginx (Reverse Proxy & Web Server)                                  │   │
│   │   ├── `GET /` ──────────────▶ Serves built React SPA (frontend/dist)│   │
│   │   ├── `GET /uploads/*` ─────▶ Serves images (backend/uploads)       │   │
│   │   └── `ALL /api/*` ─────────▶ Reverse-proxy to http://127.0.0.1:5000│   │
│   └───────────────────────────────────┬─────────────────────────────────┘   │
│                                       │                                     │
│   ┌───────────────────────────────────▼─────────────────────────────────┐   │
│   │ PM2 Process Manager                                                 │   │
│   │   └── Express API (`node dist/server.js`)                           │   │
│   │       ├── Auto-restarts on crash                                    │   │
│   │       ├── Systemd service enabled (survives instance reboot)        │   │
│   │       └── Auto-runs idempotent migrations (`runMigrations()`)       │   │
│   └───────────────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────────────────┼─────────────────────────────────────┘
                                        │
                                        │ Private MySQL Connection
                                        │ (Port 3306)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ AWS RDS (MySQL 8.0 — db.t3.micro Free Tier)                                 │
│   - Database name: `growventory`                                            │
│   - Security Group: Inbound Port 3306 allowed ONLY from EC2 Security Group  │
│   - Automated daily backups                                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Directory Layout & Created Files

All automation and configuration artifacts will reside under `deploy/` in the repository root:

```
Growventory/
├── deploy/
│   ├── nginx.conf                 # Nginx site configuration (proxy + SPA + static uploads)
│   ├── ecosystem.config.cjs       # PM2 runtime configuration
│   ├── setup-ec2.sh               # One-command server provisioner & build runner
│   ├── update.sh                  # One-command zero-downtime update script
│   └── seed.sh                    # Helper to bootstrap admin user on production DB
├── backend/
│   └── (existing Express + TypeScript code)
└── frontend/
    └── (existing React + Vite code)
```

---

## 4. Components & Configuration Details

### 4.1 Nginx Reverse Proxy (`deploy/nginx.conf`)
* **Port 80 Listener**: Configured for the EC2 public IP or domain name.
* **SPA Routing**: `location / { root .../frontend/dist; try_files $uri $uri/ /index.html; }` to support React Router without 404s on page refresh.
* **API Reverse Proxy**: `location /api/` proxies to `http://127.0.0.1:5000/api/` with `X-Real-IP`, `X-Forwarded-For`, and WebSocket upgrade headers.
* **Static Uploads**: `location /uploads/` maps to `backend/uploads/` with 30-day client cache and `client_max_body_size 10M` to support plant photos.

### 4.2 PM2 Process Management (`deploy/ecosystem.config.cjs`)
* Runs compiled `dist/server.js` under Node.js.
* Environment: `NODE_ENV=production`.
* Auto-restart on crash with exponential backoff.
* Memory restart limit: 400M (prevents runaway memory leaks on small instances).

### 4.3 EC2 Master Setup Script (`deploy/setup-ec2.sh`)
An idempotent shell script that executes:
1. **Swap Allocation**: Adds a 2GB `/swapfile` if less than 1.5GB total swap exists, preventing Vite/TypeScript compiler OOM crashes on `t3.micro`.
2. **System Dependencies**: Installs `curl`, `git`, `nginx`, `mysql-client`, and NodeSource Node.js 20 LTS.
3. **PM2 Installation**: Installs `pm2` globally.
4. **Environment Setup**: Prompts for or reads RDS connection parameters (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`) and generates `backend/.env` and `frontend/.env`.
5. **Backend Compilation**: Runs `npm install` and `npm run build` to output `backend/dist/`.
6. **Frontend Compilation**: Configures `VITE_API_BASE_URL=/api` and compiles frontend via `npm run build`.
7. **Nginx Activation**: Symlinks `deploy/nginx.conf` into `/etc/nginx/sites-enabled/`, disables default site, tests config, and reloads Nginx.
8. **PM2 Startup**: Starts the API via PM2 and registers `pm2 startup` systemd service.
9. **Database Bootstrap**: Prompts to seed default roles and admin account.

### 4.4 One-Command Update Script (`deploy/update.sh`)
* Executes `git pull origin main`.
* Runs `npm run build` in `backend/` and `frontend/`.
* Reloads PM2: `pm2 reload growventory-api`.

---

## 5. User Execution Checklist (The AWS Console Part)

### Step A: Create AWS RDS MySQL Instance
1. Sign in to AWS Console → Search **RDS** → Click **Create database**.
2. **Engine type**: MySQL (Engine Version: MySQL 8.0.x).
3. **Templates**: **Free tier**.
4. **Settings**:
   - DB instance identifier: `growventory-db`
   - Master username: `admin`
   - Master password: `<Choose a strong password>` (Save this!)
5. **Instance configuration**: `db.t3.micro`.
6. **Storage**: 20 GiB (General Purpose SSD gp2), autoscaling disabled for free tier safety.
7. **Connectivity**:
   - Public access: **No** (Secure; accessible only through EC2).
   - VPC: Default VPC.
   - VPC Security group: **Create new** → Name: `growventory-rds-sg`.
8. Click **Create database** (Takes ~5–8 minutes to become "Available").
9. Click into `growventory-db` and copy the **Endpoint** (e.g. `growventory-db.xxxx.us-east-1.rds.amazonaws.com`).

### Step B: Launch AWS EC2 Instance
1. Search **EC2** → Click **Launch instance**.
2. **Name**: `growventory-server`.
3. **OS Image**: **Ubuntu Server 24.04 LTS** (or 22.04 LTS) — Free tier eligible.
4. **Instance type**: `t3.micro` (or `t2.micro`).
5. **Key pair**: Select existing or click "Create new key pair" (format: `.pem`, name: `growventory-key`).
6. **Network settings**:
   - Allow SSH traffic from: **My IP** (or Anywhere).
   - Allow HTTP traffic from the internet: **Checked** (Port 80).
   - Allow HTTPS traffic from the internet: **Checked** (Port 443).
   - Security group name: `growventory-ec2-sg`.
7. **Storage**: 20 GiB gp3 (Free tier covers up to 30 GiB).
8. Click **Launch instance**. Copy your **Public IPv4 address**.

### Step C: Link RDS Security Group to EC2
1. In RDS Console → Databases → `growventory-db` → Connectivity & security → Click on `growventory-rds-sg`.
2. Edit Inbound Rules → Add rule:
   - Type: **MYSQL/Aurora** (Port 3306)
   - Source: Custom → Search and select `growventory-ec2-sg` (the EC2 security group).
   - Save rules.

### Step D: SSH to EC2 & Run the Setup Script
```bash
chmod 400 growventory-key.pem
ssh -i growventory-key.pem ubuntu@<EC2-PUBLIC-IP>
```
On EC2:
```bash
git clone https://github.com/<your-username>/Growventory.git
cd Growventory
bash deploy/setup-ec2.sh
```
The script will prompt for your RDS endpoint, DB password, and desired admin password, then configure and launch the entire system automatically.

---

## 6. Verification & Validation Plan

Once `setup-ec2.sh` finishes:
1. **Nginx Status**: `sudo systemctl status nginx` (must show `active (running)`).
2. **PM2 Status**: `pm2 status` (shows `growventory-api` in `online` state).
3. **Web Access**: Open `http://<EC2-PUBLIC-IP>` in your browser. The Growventory login screen appears.
4. **Admin Login**: Sign in using `admin` and the password configured during setup.
5. **API & DB Verification**: Navigate to Dashboard, create a new Plant, and upload a plant photo. Confirm that the plant is saved to MySQL and the photo renders immediately.
