# MyKliq Mobile - Production Configuration Guide

This guide walks you through configuring the MyKliq mobile app for production deployment to the iOS App Store and Google Play Store.

---

## Prerequisites

Before you begin, ensure you have:
- ✅ Active Apple Developer account ($99/year)
- ✅ Active Google Play Developer account ($25 one-time fee)
- ✅ Expo account (free tier is sufficient)
- ✅ EAS CLI installed: `npm install -g eas-cli`
- ✅ Production API URL (replace Replit dev URL)

---

## Step 1: Update app.json with Your Information

### 1.1 Configure EAS Project

1. **Login to EAS:**
   ```bash
   cd mobile
   eas login
   ```

2. **Create EAS Project:**
   ```bash
   eas init
   ```
   This will generate your `EAS_PROJECT_ID`.

3. **Update `app.json`:**
   - Replace `YOUR_EAS_PROJECT_ID_HERE` with your actual EAS Project ID
   - Replace `YOUR_EXPO_USERNAME_HERE` with your Expo username

### 1.2 Configure Production API URL

**Current Configuration:**
```json
"extra": {
  "apiUrl": "https://c7dd138c-576d-4490-a426-c0be6e6124ca-00-1u3lut3kqrgq6.kirk.replit.dev"
}
```

**Production Configuration Options:**

**Option A: Use Custom Domain (Recommended)**
```json
"extra": {
  "apiUrl": "https://api.mykliq.com"
}
```

**Option B: Use Published Replit URL**
```json
"extra": {
  "apiUrl": "https://YOUR-REPL-NAME.replit.app"
}
```

### 1.3 Update Version Numbers

For each release:
- Increment `version` (e.g., "1.0.0" → "1.0.1")
- Increment iOS `buildNumber` (e.g., "1" → "2")
- Increment Android `versionCode` (e.g., 1 → 2)

---

## Step 2: Configure eas.json

### 2.1 Update API URLs in eas.json

Replace all instances of:
- `"API_URL": "https://api.mykliq.com"` with your production URL

### 2.2 Configure Apple Developer Settings

In `eas.json` under `submit.production.ios`:

```json
{
  "appleId": "your.email@example.com",
  "ascAppId": "1234567890",
  "appleTeamId": "ABCD1234"
}
```

**Where to find these:**
- **appleId**: Your Apple ID email
- **ascAppId**: From App Store Connect → App Information
- **appleTeamId**: From Apple Developer Account → Membership

### 2.3 Configure Google Play Settings

In `eas.json` under `submit.production.android`:

```json
{
  "serviceAccountKeyPath": "./google-service-account.json",
  "track": "production"
}
```

**Creating Service Account:**
1. Go to Google Cloud Console
2. Create service account
3. Download JSON key file
4. Place in `mobile/` directory (don't commit to git!)

---

## Step 3: Configure Firebase (Push Notifications)

### 3.1 iOS Configuration

1. **Download `GoogleService-Info.plist`** from Firebase Console
2. Place file in `mobile/` directory
3. Add to `app.json`:
   ```json
   "ios": {
     "googleServicesFile": "./GoogleService-Info.plist"
   }
   ```

### 3.2 Android Configuration

1. **Download `google-services.json`** from Firebase Console
2. Place file in `mobile/` directory
3. Already configured in `app.json`:
   ```json
   "android": {
     "googleServicesFile": "./google-services.json"
   }
   ```

**Important:** Add both files to `.gitignore`!

---

## Step 4: Environment Variables

### 4.1 Create .env File (Mobile)

Create `mobile/.env.production`:
```bash
API_URL=https://api.mykliq.com
FIREBASE_API_KEY=your_firebase_api_key_here
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_SENDER_ID=your_sender_id_here
FIREBASE_APP_ID=your_app_id_here
```

### 4.2 Backend Environment Variables

Ensure your backend has:
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
NODE_ENV=production
DATABASE_URL=your_production_database_url
```

---

## Step 5: Build Configuration

### 5.1 Development Builds

For testing on physical devices:

**iOS (Simulator):**
```bash
eas build --profile development --platform ios
```

**Android (APK):**
```bash
eas build --profile development --platform android
```

### 5.2 Preview Builds

For internal testing (TestFlight/Internal Testing):

**iOS:**
```bash
eas build --profile preview --platform ios
```

**Android:**
```bash
eas build --profile preview --platform android
```

### 5.3 Production Builds

For App Store/Play Store submission:

**iOS:**
```bash
eas build --profile production --platform ios
```

**Android:**
```bash
eas build --profile production --platform android
```

---

## Step 6: App Store Submission

### 6.1 iOS - App Store Connect

**Prerequisites:**
1. Create app in App Store Connect
2. Complete App Information (name, category, privacy policy URL)
3. Prepare screenshots (use assets from `mobile/app-store-assets/`)
4. Write app description (use from `mobile/APP_STORE_METADATA.md`)

**Submit Build:**
```bash
eas submit --profile production --platform ios
```

Or manually upload via Xcode/Transporter.

**App Store Review Checklist:**
- [ ] Privacy Policy URL set to `https://kliqlife.com/privacy-policy`
- [ ] Screenshots uploaded for all required device sizes
- [ ] App description, keywords, and promotional text added
- [ ] Age rating completed (13+)
- [ ] Export compliance: "No" (no encryption beyond HTTPS)

### 6.2 Android - Google Play Console

**Prerequisites:**
1. Create app in Google Play Console
2. Complete Store Listing (description, screenshots, icon)
3. Set up pricing & distribution
4. Complete content rating questionnaire

**Submit Build:**
```bash
eas submit --profile production --platform android
```

**Google Play Review Checklist:**
- [ ] Privacy Policy URL set
- [ ] Data Safety section completed
- [ ] App content rating completed
- [ ] Target SDK version: 34 (Android 14)
- [ ] Release track: Production

---

## Step 7: TestFlight & Internal Testing

### 7.1 iOS TestFlight

**Setup:**
1. Build with preview profile
2. Submit to TestFlight
3. Add internal testers in App Store Connect
4. Send test invitations

**Commands:**
```bash
# Build preview
eas build --profile preview --platform ios

# Submit to TestFlight
eas submit --profile preview --platform ios
```

### 7.2 Android Internal Testing

**Setup:**
1. Build with preview profile
2. Upload to Google Play Console
3. Create internal testing release
4. Add testers via email list

**Commands:**
```bash
# Build preview APK
eas build --profile preview --platform android

# Submit to Internal Testing
eas submit --profile preview --platform android
```

---

## Step 8: Version Management

### 8.1 Semantic Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backwards-compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

### 8.2 Update Checklist

Before each release:
1. [ ] Update `version` in `app.json`
2. [ ] Increment `buildNumber` (iOS) and `versionCode` (Android)
3. [ ] Update `CHANGELOG.md` with changes
4. [ ] Test on physical devices
5. [ ] Run full regression tests
6. [ ] Get architect review
7. [ ] Build production
8. [ ] Submit to stores

---

## Step 9: Post-Launch Monitoring

### 9.1 Firebase Analytics

Monitor user behavior:
- Daily active users (DAU)
- Session duration
- Feature usage
- Crash-free rate

### 9.2 App Store Metrics

Track:
- Downloads and installs
- Ratings and reviews
- Conversion rate (impressions → downloads)
- Retention rate (Day 1, Day 7, Day 30)

### 9.3 Crash Reporting

Configure Firebase Crashlytics:
- Real-time crash alerts
- Crash-free percentage
- Top crashes by occurrence

---

## Quick Reference

### Common Commands

```bash
# Login to EAS
eas login

# Build for development
eas build --profile development --platform all

# Build for preview (TestFlight/Internal Testing)
eas build --profile preview --platform all

# Build for production (App Store/Play Store)
eas build --profile production --platform all

# Submit to stores
eas submit --profile production --platform ios
eas submit --profile production --platform android

# Check build status
eas build:list

# View build logs
eas build:view [build-id]
```

### File Checklist

Before production build, ensure these files exist:
- [ ] `mobile/app.json` (updated with production config)
- [ ] `mobile/eas.json` (configured for all profiles)
- [ ] `mobile/google-services.json` (Android Firebase)
- [ ] `mobile/GoogleService-Info.plist` (iOS Firebase)
- [ ] `mobile/.env.production` (environment variables)
- [ ] `mobile/assets/icon.png` (1024x1024)
- [ ] `mobile/assets/splash.png` (production splash screen)

### URLs to Update

Replace dev URLs with production:
- `app.json`: `extra.apiUrl`
- `eas.json`: All `API_URL` environment variables
- Backend: `REPLIT_DOMAINS` or `ALLOWED_ORIGINS`

---

## Troubleshooting

### Build Failures

**Issue**: "Invalid bundle identifier"
**Solution**: Ensure bundle ID matches App Store Connect

**Issue**: "Missing push notification entitlement"
**Solution**: Enable push notifications in Apple Developer portal

**Issue**: "Google Services file not found"
**Solution**: Place `google-services.json` in `mobile/` directory

### Submission Errors

**iOS: "Missing Privacy Manifest"**
**Solution**: Ensure Info.plist includes all permission descriptions

**Android: "Target SDK version too low"**
**Solution**: Update `targetSdkVersion` to 34 in build.gradle

---

## Security Best Practices

1. **Never commit secrets:**
   - `google-services.json`
   - `GoogleService-Info.plist`
   - `.env` files
   - Service account keys

2. **Use environment variables** for:
   - API URLs
   - Firebase configuration
   - Third-party API keys

3. **Enable code obfuscation** for production builds

4. **Use HTTPS only** for all API requests

---

## Support

For issues with:
- **EAS Builds**: https://docs.expo.dev/build/introduction/
- **App Store Connect**: https://developer.apple.com/support/
- **Google Play Console**: https://support.google.com/googleplay/android-developer/

---

**Last Updated:** November 14, 2025
**MyKliq Version:** 1.0.0
