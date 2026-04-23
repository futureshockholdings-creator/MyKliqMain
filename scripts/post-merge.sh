#!/bin/bash
set -e

# Install root dependencies (web + server)
npm install --prefer-offline

# Install mobile dependencies — use --ignore-scripts to skip the EAS CLI
# smoke test (check-eas-cli.sh postinstall hook), which requires EXPO_TOKEN
# and interactive access unavailable during automated post-merge setup.
cd mobile && npm install --prefer-offline --ignore-scripts && cd ..
