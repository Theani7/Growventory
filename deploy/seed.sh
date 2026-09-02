#!/usr/bin/env bash
# ==============================================================================
# Growventory - Database Seeding & Admin User Reset Helper
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT/backend"

echo "============================================================"
echo "🌱 Growventory Database Seed & Admin Reset"
echo "Repository Root: $REPO_ROOT"
echo "============================================================"

# Check for backend/.env
if [ ! -f "$REPO_ROOT/backend/.env" ]; then
  echo "⚠️  Warning: $REPO_ROOT/backend/.env was not found."
  echo "    Ensure database environment variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) are set."
fi

# Prompt for ADMIN_PASSWORD if not already set in environment
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  if [ -t 0 ]; then
    read -rsp "Enter password for System Administrator (admin@growventory.com): " ADMIN_PASSWORD
    echo ""
  fi
fi

if [ -z "${ADMIN_PASSWORD:-}" ]; then
  echo "❌ Error: ADMIN_PASSWORD is required. Provide it via environment variable or interactive prompt." >&2
  exit 1
fi

echo "Running migrations and seeding system roles and admin user..."
ALLOW_ADMIN_RESET=true ADMIN_PASSWORD="$ADMIN_PASSWORD" npm run seed

echo ""
echo "============================================================"
echo "  ✅ Database Seeding / Admin Reset Complete!"
echo "============================================================"
echo "  Admin Email:    admin@growventory.com"
echo "  Admin Username: admin"
echo "============================================================"
