#!/usr/bin/env bash
set -euo pipefail

if [ -z "${REPLIT_DEV_DOMAIN:-}" ]; then
  echo "Error: REPLIT_DEV_DOMAIN is not set. Run this script inside the Replit environment." >&2
  exit 1
fi

if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "EAS API URL update skipped - EXPO_TOKEN secret not set. Add it via Replit Secrets." >&2
  exit 0
fi

API_URL="https://${REPLIT_DEV_DOMAIN}"

echo "Updating EAS development API_URL to: ${API_URL}"

cd "$(dirname "$0")/.."

# Prefer the local devDependency binary; fall back to a globally installed eas.
if [ -x "./node_modules/.bin/eas" ]; then
  EAS_BIN="./node_modules/.bin/eas"
elif command -v eas &>/dev/null; then
  EAS_BIN="eas"
else
  echo "EAS API URL update skipped - eas CLI not found. Run 'npm install' inside the mobile directory." >&2
  exit 0
fi

EXPO_TOKEN="${EXPO_TOKEN}" "${EAS_BIN}" env:update development --variable-name API_URL --value "${API_URL}" --non-interactive

echo "Done. Verify with: ${EAS_BIN} env:list development"
