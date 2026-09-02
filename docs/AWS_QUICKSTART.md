# AWS Deployment Quickstart Walkthrough: Growventory

A zero-ambiguity, step-by-step guide to deploying Growventory on AWS Free Tier using **AWS EC2 (Ubuntu 24.04/22.04 LTS)**, **AWS RDS (MySQL 8.0)**, **Nginx**, and **PM2**.

---

## 📋 Architecture & Prerequisites

### Architecture Overview

```
                      INTERNET
                         │
                   [ Port 80/443 ]
                         │
┌────────────────────────▼────────────────────────┐
│ AWS EC2 (Ubuntu 24.04 LTS — t3.micro Free Tier) │
│                                                 │
│   Nginx (Port 80)                               │
│     ├── /        ──▶ React SPA (frontend/dist)  │
│     ├── /uploads ──▶ Plant Photos (local EBS)   │
│     └── /api/    ──▶ Express API (127.0.0.1:5000)
│                         │                       │
│                   PM2 Process                   │
│             (growventory-api: node 20)          │
└────────────────────────┬────────────────────────┘
                         │ Private MySQL Port 3306
                         ▼
┌─────────────────────────────────────────────────┐
│ AWS RDS MySQL 8.0 (db.t3.micro Free Tier)       │
│   - Security Group: EC2 SG access only          │
│   - Database: growventory                       │
└─────────────────────────────────────────────────┘
```

### Prerequisites
- **AWS Account:** Active account eligible for AWS Free Tier.
- **SSH Client:** Terminal on macOS/Linux or PowerShell/PuTTY on Windows.
- **Git:** Installed on your local computer.
- **Growventory Repository:** Cloned or forked on GitHub.

---

## 🗄️ Step 1: Launch AWS RDS MySQL Instance

1. Log in to the [AWS Management Console](https://console.aws.amazon.com/) and search for **RDS** in the top search bar.
2. In the RDS Dashboard, click **Create database**.
3. Configure the database with the following exact settings:

| Section | Setting / Field | Value to Select / Enter |
| :--- | :--- | :--- |
| **Choose a database creation method** | Method | **Standard create** |
| **Engine options** | Engine type | **MySQL** |
| | Engine Version | **MySQL 8.0.x** (e.g., MySQL 8.0.35 or latest 8.0) |
| **Templates** | Template | **Free tier** |
| **Settings** | DB instance identifier | `growventory-db` |
| | Master username | `admin` |
| | Master password | `<Enter a strong password>` *(Save this!)* |
| | Confirm master password | `<Re-enter password>` |
| **Instance configuration** | DB instance class | **Burstable classes** → `db.t3.micro` (or `db.t2.micro`) |
| **Storage** | Storage type | **General Purpose SSD (gp2)** |
| | Allocated storage | `20` GiB |
| | Enable storage autoscaling | **Unchecked** *(prevents unwanted charges)* |
| **Connectivity** | Compute resource | **Don’t connect to an EC2 compute resource** |
| | Virtual Private Cloud (VPC) | **Default VPC** |
| | Public access | **No** *(Keeps database private and secure)* |
| | VPC security group (firewall) | **Create new** |
| | New VPC security group name | `growventory-rds-sg` |
| | Availability Zone | **No preference** |
| | Database port | `3306` |
| **Additional configuration** | Initial database name | `growventory` *(Optional; setup script auto-creates this if left blank)* |
| | Enable automated backups | **Checked** (7 days retention) |

4. Scroll to the bottom and click **Create database**.
5. Wait **5–10 minutes** for provisioning until the Status changes from `Creating` to `Available`.
6. Click into **`growventory-db`** and locate the **Connectivity & security** tab.
7. Copy and save the **Endpoint** (e.g., `growventory-db.c1234567890.us-east-1.rds.amazonaws.com`).

---

## 🖥️ Step 2: Launch AWS EC2 Instance

1. In the AWS Console, search for **EC2** and click **Launch instance**.
2. Configure the instance with the following exact settings:

| Section | Setting / Field | Value to Select / Enter |
| :--- | :--- | :--- |
| **Name and tags** | Name | `growventory-server` |
| **Application and OS Images** | Operating System | **Ubuntu** |
| | AMI | **Ubuntu Server 24.04 LTS (HVM)** or **22.04 LTS (HVM)** *(Free tier eligible, 64-bit x86)* |
| **Instance type** | Instance type | `t3.micro` (or `t2.micro` — Free tier eligible) |
| **Key pair (login)** | Key pair name | Click **Create new key pair**:<br>• Name: `growventory-key`<br>• Key pair type: **RSA**<br>• Format: **`.pem`** (for OpenSSH)<br>*(Download and save `growventory-key.pem` to your local machine)* |
| **Network settings** | Firewall (security groups) | **Create security group** |
| | Security group name | `growventory-ec2-sg` |
| | Description | `Security group for Growventory EC2 Web & API Server` |
| | Inbound Rule 1 (SSH) | Type: **SSH** \| Port: `22` \| Source: **My IP** (or `0.0.0.0/0`) |
| | Inbound Rule 2 (HTTP) | Type: **HTTP** \| Port: `80` \| Source: **Anywhere (0.0.0.0/0)** |
| | Inbound Rule 3 (HTTPS) | Type: **HTTPS** \| Port: `443` \| Source: **Anywhere (0.0.0.0/0)** |
| **Configure storage** | Root Volume | `1x 20 GiB gp3` *(Free tier covers up to 30 GiB EBS)* |

3. Click **Launch instance**.
4. In the EC2 Instances list, select `growventory-server` and copy the **Public IPv4 address** (e.g., `54.210.xx.xx`).

---

## 🔗 Step 3: Link RDS Security Group to EC2 Security Group

Because RDS is private (`Public access: No`), you must explicitly permit the EC2 security group to connect to MySQL on port 3306.

1. Navigate to **RDS** → **Databases** → Click **`growventory-db`**.
2. Under the **Connectivity & security** tab, look under **Security** and click on the **VPC security groups** link (`growventory-rds-sg` or `sg-xxxx`).
3. You will be redirected to the EC2 Security Groups table with `growventory-rds-sg` selected.
4. Click the **Inbound rules** tab at the bottom, then click **Edit inbound rules**.
5. Click **Add rule** and configure:
   - **Type:** `MYSQL/Aurora`
   - **Protocol:** `TCP`
   - **Port range:** `3306`
   - **Source:** Select **Custom**, click the search field, type `growventory-ec2-sg` (or `sg-`), and select the EC2 security group `growventory-ec2-sg`.
   - **Description:** `Allow MySQL inbound from Growventory EC2`
6. Click **Save rules**.

---

## 🚀 Step 4: Connect via SSH & Run Automated Setup

### 4.1 Set Key Permissions & SSH to EC2

Open a terminal on your local machine, navigate to the folder containing your downloaded `growventory-key.pem`, and connect:

```bash
# Restrict private key permissions (required by SSH)
chmod 400 growventory-key.pem

# SSH into your EC2 instance (replace <EC2_PUBLIC_IP> with your instance's public IP)
ssh -i growventory-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### 4.2 Clone Growventory & Run Master Setup

Once logged into the EC2 instance, clone your repository and run the automated master provisioner:

```bash
# Clone the repository
git clone https://github.com/<your-username>/Growventory.git

# Navigate into the project root
cd Growventory

# Run the master setup automation script
bash deploy/setup-ec2.sh
```

### 4.3 Interactive Configuration Prompts

The setup script handles all system configuration automatically and will prompt you for database parameters:

1. **`Enter AWS RDS / MySQL Endpoint (DB_HOST):`** Paste your RDS Endpoint from Step 1 (e.g., `growventory-db.c1234567890.us-east-1.rds.amazonaws.com`).
2. **`Enter Database User (DB_USER) [default: admin]:`** Press `Enter` (or specify custom user).
3. **`Enter Database Password (DB_PASSWORD):`** Enter the master password you set when creating the RDS database.
4. **`Enter Database Name (DB_NAME) [default: growventory]:`** Press `Enter`.
5. **`Enter initial password for System Administrator (ADMIN_PASSWORD):`** Enter a password for the default admin user (`admin@growventory.com`).

### 4.4 Automated Actions Executed by the Script

The setup script automatically performs:
- ✅ **Swap Space:** Creates and persists a 2GB swapfile to guarantee build stability on `t3.micro`.
- ✅ **System Packages:** Installs `curl`, `git`, `nginx`, `mysql-client`, and Node.js 20 LTS.
- ✅ **Process Manager:** Installs PM2 globally.
- ✅ **Environment Files:** Writes production `backend/.env` (with random 64-char JWT secret) and `frontend/.env`.
- ✅ **Compilation:** Builds TypeScript backend and compiles Vite React SPA.
- ✅ **Nginx Configuration:** Symlinks `deploy/nginx.conf`, configures `/` SPA routing, `/api/` proxying, and `/uploads/` static storage, tests config, and starts Nginx.
- ✅ **Database Migration & Seed:** Executes database schema migrations and seeds default roles and the initial Administrator account.
- ✅ **PM2 Daemon:** Launches `growventory-api` and enables systemd auto-restart on reboot.

---

## 🔍 Step 5: Post-Deployment Verification & Admin Login

1. Open your web browser and navigate to:
   ```
   http://<EC2_PUBLIC_IP>
   ```
2. You will see the Growventory Login page.
3. Sign in with the administrator credentials:
   - **Username / Email:** `admin` or `admin@growventory.com`
   - **Password:** `<The ADMIN_PASSWORD entered during setup>`
4. **Verification Checklist:**
   - [x] **Dashboard:** KPI summary widgets and navigation load cleanly.
   - [x] **API Health:** Visit `http://<EC2_PUBLIC_IP>/api` to verify backend API health response.
   - [x] **Database Write:** Create a new plant item under the **Plants** page.
   - [x] **Image Uploads:** Upload a plant photo (supported up to 10MB) and verify the image renders in the UI via `/uploads/...`.

---

## 🛠️ Step 6: Ongoing Maintenance & Troubleshooting

### 🔄 Zero-Downtime Application Updates

When you push code changes or bug fixes to GitHub, update your production instance with a single command:

```bash
cd ~/Growventory
bash deploy/update.sh
```
*This pulls the latest Git changes, re-builds backend and frontend, updates permissions, performs zero-downtime PM2 reload (`pm2 reload growventory-api`), and reloads Nginx.*

---

### 🔑 Re-seed or Reset Admin Password

If you ever need to reset or re-seed the administrator user:

```bash
cd ~/Growventory
bash deploy/seed.sh
```

---

### 📊 Service & Log Monitoring Commands

| Action | Command |
| :--- | :--- |
| **Check PM2 Status** | `pm2 status` |
| **Live Backend API Logs** | `pm2 logs growventory-api` |
| **Backend Output Log** | `tail -f deploy/logs/api-out.log` |
| **Backend Error Log** | `tail -f deploy/logs/api-err.log` |
| **Check Nginx Status** | `sudo systemctl status nginx` |
| **Nginx Error Logs** | `sudo tail -f /var/log/nginx/error.log` |
| **Nginx Access Logs** | `sudo tail -f /var/log/nginx/access.log` |
| **Restart Backend API** | `pm2 restart growventory-api` |
| **Restart Nginx** | `sudo systemctl restart nginx` |
| **Check Free Memory & Swap** | `free -h` |

---

### 🚨 Troubleshooting Common Issues

#### 1. Database Connection Timeout (`ETIMEDOUT` / `ECONNREFUSED`)
- **Cause:** Security Group inbound rule missing or RDS instance still provisioning.
- **Fix:**
  1. In RDS Console, check that `growventory-db` status is **Available**.
  2. Verify that `growventory-rds-sg` has an Inbound Rule allowing TCP port `3306` with source set to `growventory-ec2-sg`.
  3. Test MySQL reachability from EC2 terminal:
     ```bash
     mysql -h <RDS_ENDPOINT> -u admin -p
     ```

#### 2. Nginx 502 Bad Gateway
- **Cause:** The Node.js Express server is stopped or crashed.
- **Fix:**
  1. Run `pm2 status` to inspect `growventory-api`.
  2. View crash logs: `pm2 logs growventory-api --lines 50`.
  3. Check `backend/.env` for accurate database credentials.
  4. Restart: `pm2 restart growventory-api`.

#### 3. Plant Photo Upload Fails (`413 Payload Too Large` or `404 Not Found`)
- **Cause:** Client max body size or directory permissions misconfigured.
- **Fix:**
  1. Confirm Nginx `client_max_body_size 10M;` is active: `sudo nginx -t && sudo systemctl reload nginx`.
  2. Ensure permissions on uploads folder:
     ```bash
     sudo chmod -R o+rwx ~/Growventory/backend/uploads
     ```

#### 4. Compiler / Build Out of Memory (OOM) Errors
- **Cause:** Swap space inactive on `t3.micro` (1GB RAM).
- **Fix:**
  1. Check swap status: `swapon --show` or `free -h`.
  2. If 0B swap is active, re-run `bash deploy/setup-ec2.sh` or enable swap manually:
     ```bash
     sudo swapon /swapfile
     ```

---

## 🔒 Security Best Practices Checklist

- [ ] **Restrict SSH:** Change EC2 Security Group port 22 source from `0.0.0.0/0` to **My IP**.
- [ ] **Private RDS:** Never enable `Public access: Yes` on production RDS databases.
- [ ] **Firewall (UFW):** Optional host firewall on EC2:
  ```bash
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```
- [ ] **Custom Domain & SSL (Optional):** Attach Route 53 domain and run `sudo certbot --nginx -d yourdomain.com` for HTTPS encryption.
