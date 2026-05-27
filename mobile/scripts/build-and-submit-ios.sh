#!/usr/bin/env bash
# Build and submit the MyKliq iOS binary to App Store Connect via EAS.
# Run this from the mobile/ directory: bash scripts/build-and-submit-ios.sh
set -euo pipefail

echo "=== MyKliq iOS Build & Submit ==="
echo ""

# 1. Confirm EAS CLI is present
if ! command -v eas &>/dev/null; then
  echo "ERROR: eas-cli not found. Run: npm install -g eas-cli"
  exit 1
fi

echo "EAS CLI version: $(eas --version)"
echo ""

# 2. Confirm user is logged in
echo "Checking Expo login..."
eas whoami || { echo ""; echo "Not logged in. Run: eas login"; exit 1; }
echo ""

# 3. Build for the iOS production profile
# autoIncrement is enabled in eas.json so build number increments automatically.
echo "Starting iOS production build..."
eas build --platform ios --profile production --non-interactive

echo ""
echo "Build complete. Submitting to App Store Connect..."

# 4. Submit the latest build to App Store Connect
# Requires appleId, ascAppId, and appleTeamId to be set in eas.json (submit.production.ios).
eas submit --platform ios --latest --non-interactive

echo ""
echo "=== Done! ==="
echo "The build has been submitted to App Store Connect."
echo "Check https://appstoreconnect.apple.com for processing status (usually 10-30 min)."
echo "Once processed, add the build to your App Store submission and resubmit for review."
