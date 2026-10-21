---
name: External builds — Replit lockfile registry issue
description: Replit-internal resolved URLs in lockfiles are unreachable from external CI, including EAS and AWS Amplify.
---

# EAS Build — Replit package-lock.json registry issue

## The Rule
Lockfiles generated inside Replit can contain `http://package-firewall.replit.local/npm/...` as resolved URLs. External build machines, including EAS and AWS Amplify, cannot resolve this hostname; installs that follow those URLs fail.

**Why:** Replit proxies npm traffic through an internal package firewall. This hostname is only resolvable inside the Replit sandbox, not on external CI/CD machines.

**How to apply:** Before external builds, check the lockfile for the app being built, not only the mobile lockfile. Normalize internal resolved URLs to their equivalent public npm URLs without changing package versions or integrity hashes. This is an external-CI portability correction, not a reason to bypass Replit's package-security checks when installing dependencies.

## Additional EAS / Xcode 26 notes
- Apple requires Xcode 26+ for App Store submissions since April 28, 2026.
- Correct EAS image name: `macos-sequoia-15.6-xcode-26.2` (not `xcode-26.0` — that image does not exist and causes exit code 127 / npx not found).
- `eas-cli` should NOT be in project devDependencies — EAS machines have it pre-installed; including it bloats npm install unnecessarily.
