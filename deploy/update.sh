#!/usr/bin/env bash
# ==============================================================================
# Growventory - Zero-Downtime Application Update Script
# Target: Ubuntu 24.04 / 22.04 LTS on AWS EC2
# ==============================================================================

set -euo pipefail

# ------------------------------------------------------------------------------
# 1. Sudo Detection & Path Resolution
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

cd "$REPO_ROOT"

echo "============================================================"
echo "🔄 Updating Growventory Application"
echo "Repository Root: $REPO_ROOT"
echo "Timestamp:       $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "============================================================"

# ------------------------------------------------------------------------------
# 2. Pull Latest Git Changes
# ------------------------------------------------------------------------------
TARGET_BRANCH="${GIT_BRANCH:-main}"
echo "--- [1/6] Pulling Latest Changes from origin/${TARGET_BRANCH} ---"
git pull origin "$TARGET_BRANCH"

# ------------------------------------------------------------------------------
# 3. Build Backend
# ------------------------------------------------------------------------------
echo "--- [2/6] Building Backend ---"
cd "$REPO_ROOT/backend"
echo "Installing backend dependencies..."
npm install --no-audit --no-fund
echo "Compiling TypeScript backend..."
npm run build

# ------------------------------------------------------------------------------
# 4. Build Frontend
# ------------------------------------------------------------------------------
echo "--- [3/6] Building Frontend ---"
cd "$REPO_ROOT/frontend"
echo "Installing frontend dependencies..."
npm install --no-audit --no-fund
echo "Compiling Vite frontend..."
npm run build

# ------------------------------------------------------------------------------
# 5. File & Asset Permissions
# ------------------------------------------------------------------------------
cd "$REPO_ROOT"
echo "--- [4/6] Updating Permissions ---"
$SUDO chmod -R o+rx "$REPO_ROOT/frontend/dist" 2>/dev/null || true
$SUDO chmod -R o+rwx "$REPO_ROOT/backend/uploads" 2>/dev/null || true
mkdir -p "$REPO_ROOT/deploy/logs"
chmod 755 "$REPO_ROOT/deploy/logs" 2>/dev/null || true

# ------------------------------------------------------------------------------
# 6. Reload PM2 (Zero-Downtime Reload)
# ------------------------------------------------------------------------------
echo "--- [5/6] Reloading PM2 Application ---"
if command -v pm2 >/dev/null 2>&1; then
  if pm2 describe growventory-api >/dev/null 2>&1; then
    pm2 reload growventory-api --update-env
  else
    echo "Process growventory-api not currently active, starting with ecosystem config..."
    pm2 start "$REPO_ROOT/deploy/ecosystem.config.cjs"
  fi
  pm2 save
  echo "✓ PM2 process updated and saved."
else
  echo "⚠️ Warning: 'pm2' command not found in PATH. Skipping PM2 reload." >&2
fi

# ------------------------------------------------------------------------------
# 7. Reload Nginx
# ------------------------------------------------------------------------------
echo "--- [6/6] Reloading Nginx Reverse Proxy ---"
if command -v nginx >/dev/null 2>&1; then
  echo "Testing Nginx configuration syntax..."
  $SUDO nginx -t
  echo "Reloading Nginx service..."
  $SUDO systemctl reload nginx
  echo "✓ Nginx reloaded successfully."
else
  echo "⚠️ Warning: 'nginx' command not found. Skipping Nginx reload." >&2
fi

echo ""
echo "============================================================"
echo "  ✅ Growventory Update Completed Successfully!"
echo "============================================================"
echo "  Current Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
echo "  PM2 Status:     pm2 status"
echo "============================================================"
