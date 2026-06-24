---
name: EAS Build — Replit package-lock.json registry issue
description: EAS builds fail with ENOTFOUND when package-lock.json is generated inside Replit due to Replit's internal package firewall being baked into resolved URLs.
---

# EAS Build — Replit package-lock.json registry issue

## The Rule
Any `package-lock.json` generated inside Replit contains `http://package-firewall.replit.local/npm/...` as resolved URLs. EAS macOS build servers cannot resolve this hostname (ENOTFOUND), causing `npm install` to fail.

**Why:** Replit proxies npm traffic through an internal package firewall. This hostname is only resolvable inside the Replit sandbox, not on external CI/CD machines.

**How to apply:** Before triggering any EAS build:
1. Run `grep -c "package-firewall.replit.local" mobile/package-lock.json` — if non-zero, fix it.
2. Fix: `sed -i 's|http://package-firewall.replit.local/npm|https://registry.npmjs.org|g' mobile/package-lock.json`
3. Ensure `mobile/.npmrc` contains `registry=https://registry.npmjs.org` to prevent the problem recurring.

## Additional EAS / Xcode 26 notes
- Apple requires Xcode 26+ for App Store submissions since April 28, 2026.
- Correct EAS image name: `macos-sequoia-15.6-xcode-26.2` (not `xcode-26.0` — that image does not exist and causes exit code 127 / npx not found).
- `eas-cli` should NOT be in project devDependencies — EAS machines have it pre-installed; including it bloats npm install unnecessarily.
