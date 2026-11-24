---
name: Android distribution
description: Business reason for preferring Google Play over Android PWA installation.
---

MyKliq already has an app on the Google Play Store. Android web visitors should install that app rather than receive a centered PWA install popup. Leave the iOS install experience as it is.

**Why:** The user stated that the Android app is on Google Play and requested this platform distinction.

**How to apply:** Preserve this distinction when changing web installation prompts or mobile acquisition flows; do not reintroduce the Android PWA popup.

Do not assume the Google Play app is the same binary as the separate Expo
project. Use the actual Play-distributed package identity and its app-signing
certificate when configuring website trust.

**Why:** The user reported that the Play-installed app opens in a Chrome Custom
Tab, while this workspace also contains a separate native mobile configuration.
Inferring the installed binary's identity from that configuration can associate
the website with the wrong app.

**How to apply:** Obtain the package name and public SHA-256 app-signing
certificate fingerprint from the actual Play Console app. For TWA verification,
serve JSON at the exact main-site `/.well-known/assetlinks.json` URL, not the
API host or a SPA fallback. An upload-key fingerprint is not interchangeable
with a Play-managed app-signing fingerprint.