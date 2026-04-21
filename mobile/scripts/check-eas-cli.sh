#!/usr/bin/env bash
# Smoke-test that verifies the EAS CLI boots correctly after npm install.
# Run via:  npm run check:eas
# CI:       .github/workflows/mobile-eas-smoke-test.yml runs this automatically
#           whenever mobile/package.json or its lockfile changes.
set -euo pipefail

cd "$(dirname "$0")/.."

# Resolve the binary – prefer local devDependency, fall back to global/PATH.
if [ -x "./node_modules/.bin/eas" ]; then
  EAS_BIN="./node_modules/.bin/eas"
elif command -v eas &>/dev/null; then
  EAS_BIN="eas"
else
  echo "ERROR: eas CLI not found. Run 'npm install' inside the mobile directory first." >&2
  exit 1
fi

echo "=== EAS CLI smoke test ==="

# 1. Verify the CLI starts and prints a version string.
echo "[1/2] Checking eas --version ..."
VERSION_OUTPUT=$("${EAS_BIN}" --version 2>&1)
echo "      ${VERSION_OUTPUT}"

# Extract the semver portion and compare the major version against the pinned range.
# Capture to variable first to avoid SIGPIPE under pipefail.
VERSION=$(echo "${VERSION_OUTPUT}" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' || true)
VERSION=$(echo "${VERSION}" | awk 'NR==1')
MAJOR=$(echo "${VERSION}" | cut -d. -f1)
PINNED_MAJOR=18

if [ "${MAJOR}" -ne "${PINNED_MAJOR}" ]; then
  echo "ERROR: eas-cli major version is ${MAJOR} but expected ${PINNED_MAJOR}." >&2
  echo "       Update the PINNED_MAJOR in this script and the semver range in package.json." >&2
  exit 1
fi

echo "      Version OK (major=${MAJOR})"

# 2. Verify the env:list sub-command works against the development environment.
#    Requires EXPO_TOKEN to authenticate; skip gracefully when not set.
echo "[2/2] Checking 'eas env:list development' ..."
if [ -z "${EXPO_TOKEN:-}" ]; then
  echo "      EXPO_TOKEN not set — skipping authenticated env:list check."
  echo "      (Set the EXPO_TOKEN secret so CI can run the full verification.)"
else
  # Capture output to avoid a broken-pipe false failure under pipefail.
  ENV_LIST_OUTPUT=$(EXPO_TOKEN="${EXPO_TOKEN}" "${EAS_BIN}" env:list development 2>&1)
  # Print first 20 lines for logging purposes without risking SIGPIPE.
  echo "${ENV_LIST_OUTPUT}" | awk 'NR<=20'
  echo "      env:list development OK"
fi

echo ""
echo "EAS CLI smoke test PASSED (eas-cli ${VERSION})"
