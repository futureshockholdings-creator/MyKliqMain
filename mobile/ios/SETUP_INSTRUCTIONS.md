# MyKliq – Xcode Build & App Store Submission Guide

## Prerequisites (on your Mac)
- Xcode 15 or later
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer account with Team ID: **7S3JDKMQRG**

---

## Step 1 — Install CocoaPods dependencies

Open Terminal, navigate to this `ios/` folder, and run:

```bash
pod install
```

This generates **`MyKliq.xcworkspace`** in this folder.
It takes 2–5 minutes on first run.

---

## Step 2 — Open in Xcode

Open the **workspace** (NOT the .xcodeproj):

```bash
open MyKliq.xcworkspace
```

---

## Step 3 — Configure Signing

1. Click the **MyKliq** project in the left sidebar
2. Select the **MyKliq** target → **Signing & Capabilities**
3. Set **Team** to: `futureshockholdings (7S3JDKMQRG)`
4. Bundle Identifier should be: `app.mykliq`
5. Make sure "Automatically manage signing" is checked

---

## Step 4 — Archive & Submit

1. Set the scheme destination to **Any iOS Device (arm64)** (not a simulator)
2. **Product → Archive** — this builds and archives the app
3. When Xcode Organizer opens, click **Distribute App**
4. Choose **App Store Connect → Upload**
5. Follow the prompts — Xcode will sign and upload automatically

---

## App Store Connect Details
- App ID: **6767392719**
- Apple ID: futureshockholdings@gmail.com
- Team ID: 7S3JDKMQRG

After upload, go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com),
select MyKliq, and submit the new build for review.
