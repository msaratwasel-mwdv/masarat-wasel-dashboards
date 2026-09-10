#!/usr/bin/env bash
# ==============================================================================
# Wasel Platform - VPS Storage & Image Optimization Script
# ==============================================================================
# This script optimizes all user-uploaded images (avatars, incidents, receipts, etc.)
# in storage/app/public in-place to drastically save disk space and bandwidth
# without breaking database links or image URLs.
#
# Usage:
#   chmod +x scripts/optimize_storage.sh
#   ./scripts/optimize_storage.sh [--dry-run] [--path=avatars]
#
# Cron Job Example (runs every Sunday at 3:00 AM):
#   0 3 * * 0 /var/www/wasel/scripts/optimize_storage.sh >> /var/log/image_optimizer.log 2>&1
# ==============================================================================

set -e

# Resolve script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "========================================================"
echo " Starting Wasel Image Optimization on VPS"
echo " Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo " Working Directory: ${PROJECT_ROOT}"
echo "========================================================"

# Check if php is available
if ! command -v php &> /dev/null; then
    echo "ERROR: PHP is not installed or not in PATH."
    exit 1
fi

# Run the Artisan command
EXTRA_ARGS="$@"

echo "Executing: php artisan images:optimize ${EXTRA_ARGS}"
php artisan images:optimize ${EXTRA_ARGS}

echo ""
echo "========================================================"
echo " Optimization completed successfully."
echo "========================================================"
