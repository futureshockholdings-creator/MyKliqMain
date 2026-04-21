#!/usr/bin/env bash
set -euo pipefail

if [ -z "${REPLIT_DEV_DOMAIN:-}" ]; then
  echo "Error: REPLIT_DEV_DOMAIN is not set. Run this script inside the Replit environment." >&2
  exit 1
fi

API_URL="https://${REPLIT_DEV_DOMAIN}"

echo "Updating EAS development API_URL to: ${API_URL}"

cd "$(dirname "$0")/.."

eas env:update development --name API_URL --value "${API_URL}" --non-interactive

echo "Done. Verify with: eas env:list development"
