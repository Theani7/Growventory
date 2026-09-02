#!/usr/bin/env bash
# ==============================================================================
# Growventory - EC2 Master Setup Automation Script
# Target: Ubuntu 24.04 / 22.04 LTS on AWS EC2
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Root / Sudo Detection & Path Setup
# ------------------------------------------------------------------------------
if [ "$EUID" -eq 0 ]; then
  SUDO=""
else
  if ! command -v sudo >/dev/null 2>&1; then
    echo "❌ Error: 'sudo' command is required when running as non-root user." >&2
    exit 1
  fi
  SUDO="sudo"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
CURRENT_USER="$(id -un)"
USER_HOME="${HOME:-/home/$CURRENT_USER}"

cd "$REPO_ROOT"

echo "============================================================"
echo "🌿 Starting Growventory EC2 Master Setup"
echo "Repository Root: $REPO_ROOT"
echo "Running User:    $CURRENT_USER"
echo "============================================================"

# ------------------------------------------------------------------------------
# 2. Swap Space Configuration (Target: 2GB if Swap < 1500MB)
# ------------------------------------------------------------------------------
echo "--- [1/8] Checking Swap Space ---"
SWAP_TOTAL_MB=$(free -m | awk '/^Swap:/ {print $2}')
if [ -z "$SWAP_TOTAL_MB" ] || [ "$SWAP_TOTAL_MB" -lt 1500 ]; then
  echo "Current swap (${SWAP_TOTAL_MB:-0}MB) is less than 1500MB. Creating 2GB swapfile..."
  if [ ! -f /swapfile ]; then
    $SUDO fallocate -l 2G /swapfile || $SUDO dd if=/dev/zero of=/swapfile bs=1M count=2048
    $SUDO chmod 600 /swapfile
    $SUDO mkswap /swapfile
  fi
  $SUDO swapon /swapfile 2>/dev/null || true
  if ! grep -q '/swapfile' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | $SUDO tee -a /etc/fstab > /dev/null
  fi
  echo "✓ 2GB swap configured and persisted."
else
  echo "✓ Existing swap space is sufficient (${SWAP_TOTAL_MB}MB)."
fi

# ------------------------------------------------------------------------------
# 3. System Packages Installation
# ------------------------------------------------------------------------------
echo "--- [2/8] Installing System Dependencies ---"
export DEBIAN_FRONTEND=noninteractive
$SUDO apt-get update -y
$SUDO apt-get install -y curl git nginx mysql-client

# ------------------------------------------------------------------------------
# 4. Node.js 20 LTS & PM2 Installation
# ------------------------------------------------------------------------------
echo "--- [3/8] Checking Node.js and PM2 ---"
NODE_INSTALLED=false
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_MAJOR" -ge 20 ]; then
    NODE_INSTALLED=true
    echo "✓ Node.js $(node -v) is already installed."
  fi
fi

if [ "$NODE_INSTALLED" = false ]; then
  echo "Installing Node.js 20 LTS via NodeSource repository..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
  $SUDO apt-get install -y nodejs
  echo "✓ Node.js installed: $(node -v) (npm: $(npm -v))"
fi

if ! command -v pm2 >/dev/null 2>&1; then
  echo "Installing PM2 process manager globally..."
  $SUDO npm install -g pm2
  echo "✓ PM2 installed: $(pm2 -v)"
else
  echo "✓ PM2 is already installed ($(pm2 -v))."
fi

# ------------------------------------------------------------------------------
# 5. Environment Variables & Credentials Collection
# ------------------------------------------------------------------------------
echo "--- [4/8] Database & Application Configuration ---"

# DB_HOST
if [ -z "${DB_HOST:-}" ]; then
  if [ -t 0 ]; then
    read -rp "Enter AWS RDS / MySQL Endpoint (DB_HOST): " DB_HOST
  fi
fi
if [ -z "${DB_HOST:-}" ]; then
  echo "❌ Error: DB_HOST is required. Please set DB_HOST environment variable." >&2
  exit 1
fi

# DB_USER
if [ -z "${DB_USER:-}" ]; then
  if [ -t 0 ]; then
    read -rp "Enter Database User (DB_USER) [default: admin]: " DB_USER_INPUT
    DB_USER="${DB_USER_INPUT:-admin}"
  else
    DB_USER="admin"
  fi
fi

# DB_PASSWORD
if [ -z "${DB_PASSWORD:-}" ]; then
  if [ -t 0 ]; then
    read -rsp "Enter Database Password (DB_PASSWORD): " DB_PASSWORD
    echo ""
  fi
fi
if [ -z "${DB_PASSWORD:-}" ]; then
  echo "❌ Error: DB_PASSWORD is required. Please set DB_PASSWORD environment variable." >&2
  exit 1
fi

# DB_NAME
if [ -z "${DB_NAME:-}" ]; then
  if [ -t 0 ]; then
    read -rp "Enter Database Name (DB_NAME) [default: growventory]: " DB_NAME_INPUT
    DB_NAME="${DB_NAME_INPUT:-growventory}"
  else
    DB_NAME="growventory"
  fi
fi

# JWT_SECRET
if [ -z "${JWT_SECRET:-}" ]; then
  if command -v openssl >/dev/null 2>&1; then
    JWT_SECRET=$(openssl rand -hex 32)
  else
    JWT_SECRET=$(head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n')
  fi
  echo "✓ Generated strong 64-character JWT_SECRET."
fi

# ADMIN_PASSWORD
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  if [ -t 0 ]; then
    read -rsp "Enter initial password for System Administrator (ADMIN_PASSWORD): " ADMIN_PASSWORD
    echo ""
  fi
fi
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "❌ Error: ADMIN_PASSWORD is required to seed the admin account." >&2
  exit 1
fi

# Optional: Auto-create database if reachable
if command -v mysql >/dev/null 2>&1; then
  echo "Verifying database connectivity and ensuring database '$DB_NAME' exists..."
  mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null || {
    echo "⚠️ Note: Could not auto-create database via mysql CLI. Schema migrations will attempt connection directly."
  }
fi

# Generate backend/.env
cat <<EOF > "$REPO_ROOT/backend/.env"
NODE_ENV=production
PORT=5000
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
TRUST_PROXY=1
EOF
chmod 600 "$REPO_ROOT/backend/.env"
echo "✓ Written backend/.env"

# Generate frontend/.env
cat <<EOF > "$REPO_ROOT/frontend/.env"
VITE_API_BASE_URL=/api
EOF
echo "✓ Written frontend/.env"

# Ensure runtime directories exist
mkdir -p "$REPO_ROOT/backend/uploads"
mkdir -p "$REPO_ROOT/deploy/logs"
chmod 755 "$REPO_ROOT/backend/uploads"
chmod 755 "$REPO_ROOT/deploy/logs"

# Ensure home/repo traversal permissions for Nginx worker (www-data)
if [ -n "$USER_HOME" ] && [ -d "$USER_HOME" ]; then
  $SUDO chmod o+x "$USER_HOME" 2>/dev/null || true
fi
$SUDO chmod o+rx "$REPO_ROOT" 2>/dev/null || true

# ------------------------------------------------------------------------------
# 6. Build Backend & Frontend
# ------------------------------------------------------------------------------
echo "--- [5/8] Installing Dependencies & Building Projects ---"

echo "Building Backend..."
cd "$REPO_ROOT/backend"
npm install --no-audit --no-fund
npm run build

echo "Building Frontend..."
cd "$REPO_ROOT/frontend"
npm install --no-audit --no-fund
npm run build

cd "$REPO_ROOT"

# Ensure static build directory is readable by Nginx
$SUDO chmod -R o+rx "$REPO_ROOT/frontend/dist" 2>/dev/null || true
$SUDO chmod -R o+rwx "$REPO_ROOT/backend/uploads" 2>/dev/null || true

# ------------------------------------------------------------------------------
# 7. Configure & Restart Nginx
# ------------------------------------------------------------------------------
echo "--- [6/8] Configuring Nginx ---"

# Dynamically inject the repository root into the Nginx configuration
sed "s|/home/ubuntu/Growventory|${REPO_ROOT}|g" "$SCRIPT_DIR/nginx.conf" | $SUDO tee /etc/nginx/sites-available/growventory > /dev/null

$SUDO ln -sf /etc/nginx/sites-available/growventory /etc/nginx/sites-enabled/growventory
$SUDO rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx configuration syntax..."
$SUDO nginx -t

echo "Restarting Nginx service..."
$SUDO systemctl restart nginx
$SUDO systemctl enable nginx
echo "✓ Nginx is active and enabled on boot."

# ------------------------------------------------------------------------------
# 8. Database Seed & PM2 Process Management
# ------------------------------------------------------------------------------
echo "--- [7/8] Running Database Migrations and Seeding Admin User ---"
cd "$REPO_ROOT/backend"
ADMIN_PASSWORD="$ADMIN_PASSWORD" ALLOW_ADMIN_RESET=true npm run seed
cd "$REPO_ROOT"
echo "✓ Database schema and initial admin account seeded successfully."

echo "--- [8/8] Starting PM2 Process Manager ---"
if pm2 describe growventory-api >/dev/null 2>&1; then
  pm2 restart deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

# Setup PM2 systemd startup hook
$SUDO env PATH="$PATH" "$(which pm2)" startup systemd -u "$CURRENT_USER" --hp "$USER_HOME" >/dev/null 2>&1 || true
$SUDO systemctl enable "pm2-$CURRENT_USER" 2>/dev/null || true

# ------------------------------------------------------------------------------
# 9. Deployment Summary & Banner
# ------------------------------------------------------------------------------
PUBLIC_IP=""
IMDS_TOKEN=$(curl -s -m 2 -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
if [ -n "$IMDS_TOKEN" ]; then
  PUBLIC_IP=$(curl -s -m 2 -H "X-aws-ec2-metadata-token: $IMDS_TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || true)
fi
if [ -z "$PUBLIC_IP" ]; then
  PUBLIC_IP=$(curl -s -m 3 https://checkip.amazonaws.com 2>/dev/null || curl -s -m 3 https://ifconfig.me 2>/dev/null || echo "YOUR_EC2_PUBLIC_IP")
fi

echo ""
echo "============================================================"
echo "  🌿 GROWVENTORY EC2 MASTER SETUP COMPLETE! 🌿"
echo "============================================================"
echo "  Application URL: http://${PUBLIC_IP}"
echo "  API Health Check: http://${PUBLIC_IP}/api"
echo "  Default Admin:   admin@growventory.com (Username: admin)"
echo ""
echo "  Useful Monitoring Commands:"
echo "    PM2 status:    pm2 status"
echo "    PM2 logs:      pm2 logs growventory-api"
echo "    Nginx logs:    sudo tail -f /var/log/nginx/error.log"
echo "    App logs:      tail -f deploy/logs/api-out.log"
echo "============================================================"
