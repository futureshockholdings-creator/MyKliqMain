# MyKliq Mobile - Production Deployment Checklist

**⚠️ CRITICAL: Complete ALL items before submitting to App Store or Google Play**

---

## 🚨 REQUIRED: Update app.json Before Production Build

### 1. Update Production API URL

**Current (PLACEHOLDER):**
```json
"extra": {
  "apiUrl": "https://REPLACE-WITH-YOUR-PRODUCTION-API-URL.com"
}
```

**Production (YOU MUST UPDATE):**
```json
"extra": {
  "apiUrl": "https://api.mykliq.com"  // Use your custom domain
  // OR
  "apiUrl": "https://mykliq.replit.app"  // Use published Replit URL
}
```

**Options:**
- Use custom domain: `https://api.mykliq.com`
- Use published Replit URL: `https://mykliq.replit.app`
- Use Replit deployment URL: Check your deployment settings

### 2. Update EAS Configuration

**File: `mobile/app.json`**

Replace these placeholders:
```json
{
  "extra": {
    "eas": {
      "projectId": "REPLACE_WITH_YOUR_EAS_PROJECT_ID"  // ⚠️ REQUIRED
    }
  },
  "owner": "REPLACE_WITH_YOUR_EXPO_USERNAME"  // ⚠️ REQUIRED
}
```

**How to get EAS Project ID:**
```bash
cd mobile
eas init
# Follow prompts - this generates your projectId
```

### 3. Update OTA Update URL

**File: `mobile/app.json`**

Replace:
```json
"updates": {
  "url": "https://u.expo.dev/REPLACE_WITH_YOUR_EAS_PROJECT_ID"
}
```

---

## 🔧 REQUIRED: Update eas.json Before Production Build

### 1. Update All API URLs

**File: `mobile/eas.json`**

Replace ALL instances of `https://REPLACE-WITH-YOUR-PRODUCTION-API-URL.com` with your actual production URL:

```json
{
  "build": {
    "preview": {
      "env": {
        "API_URL": "https://REPLACE-WITH-YOUR-PRODUCTION-API-URL.com"  // ⚠️ UPDATE THIS
      }
    },
    "production": {
      "env": {
        "API_URL": "https://REPLACE-WITH-YOUR-PRODUCTION-API-URL.com"  // ⚠️ UPDATE THIS
      }
    }
  }
}
```

### 2. Configure Apple Developer Credentials

**File: `mobile/eas.json`** under `submit.production.ios`:

```json
{
  "appleId": "your.email@example.com",           // ⚠️ REQUIRED
  "ascAppId": "1234567890",                      // ⚠️ REQUIRED (from App Store Connect)
  "appleTeamId": "ABCD1234"                      // ⚠️ REQUIRED (from Apple Developer)
}
```

### 3. Configure Google Play Credentials

**File: `mobile/eas.json`** under `submit.production.android`:

```json
{
  "serviceAccountKeyPath": "./google-service-account.json",  // ⚠️ REQUIRED
  "track": "production"
}
```

**IMPORTANT**: Download service account JSON from Google Cloud Console

---

## 📱 REQUIRED: Firebase Configuration

### iOS

1. **Download** `GoogleService-Info.plist` from Firebase Console
2. **Place** in `mobile/` directory
3. **Verify** `app.json` references it:
   ```json
   "ios": {
     "googleServicesFile": "./GoogleService-Info.plist"
   }
   ```

### Android

1. **Download** `google-services.json` from Firebase Console
2. **Place** in `mobile/` directory
3. **Already configured** in `app.json`

---

## 🔢 Version Management

### Before Each Release

Update these THREE values in `mobile/app.json`:

```json
{
  "version": "1.0.0",              // ⚠️ INCREMENT (e.g., 1.0.0 → 1.0.1)
  "ios": {
    "buildNumber": "1"             // ⚠️ INCREMENT (e.g., "1" → "2")
  },
  "android": {
    "versionCode": 1               // ⚠️ INCREMENT (e.g., 1 → 2)
  }
}
```

**Rules:**
- `version`: Use semantic versioning (MAJOR.MINOR.PATCH)
- `buildNumber` (iOS): Must be unique string for each build
- `versionCode` (Android): Must be integer, always incrementing

---

## 🔐 Security Checklist

### 1. Add to .gitignore

**File: `mobile/.gitignore`**

```
# Firebase Config (NEVER COMMIT)
google-services.json
GoogleService-Info.plist

# Service Account Keys (NEVER COMMIT)
google-service-account.json
*.pem
*.p8
*.p12

# Environment Variables (NEVER COMMIT)
.env
.env.production
.env.local
```

### 2. Backend Environment Variables

Ensure your production backend has:

```bash
NODE_ENV=production
DATABASE_URL=your_production_database_url
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
ALLOWED_ORIGINS=https://mykliq.replit.app,https://api.mykliq.com
```

---

## 📋 Pre-Submission Checklist

### General

- [ ] Updated `apiUrl` in `app.json` to production URL
- [ ] Updated `eas.projectId` in `app.json`
- [ ] Updated `owner` in `app.json` to your Expo username
- [ ] Updated all `API_URL` in `eas.json` to production URL
- [ ] Incremented `version`, `buildNumber`, and `versionCode`
- [ ] Added Firebase config files (`google-services.json`, `GoogleService-Info.plist`)
- [ ] Added both Firebase files to `.gitignore`
- [ ] Tested app on physical iOS device
- [ ] Tested app on physical Android device

### iOS Specific

- [ ] Apple Developer account active
- [ ] App created in App Store Connect
- [ ] Updated `appleId` in `eas.json`
- [ ] Updated `ascAppId` in `eas.json`
- [ ] Updated `appleTeamId` in `eas.json`
- [ ] Screenshots prepared for all required sizes
- [ ] Privacy Policy URL set in App Store Connect
- [ ] Export compliance answered (No encryption beyond HTTPS)

### Android Specific

- [ ] Google Play Developer account active
- [ ] App created in Google Play Console
- [ ] Downloaded service account JSON key
- [ ] Updated `serviceAccountKeyPath` in `eas.json`
- [ ] Screenshots prepared for all required sizes
- [ ] Privacy Policy URL set in Google Play Console
- [ ] Data Safety section completed

---

## 🚀 Build Commands

### Development (Testing)

```bash
cd mobile
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Preview (TestFlight / Internal Testing)

```bash
cd mobile
eas build --profile preview --platform ios
eas build --profile preview --platform android
```

### Production (App Store / Google Play)

```bash
cd mobile

# iOS Production Build
eas build --profile production --platform ios

# Android Production Build  
eas build --profile production --platform android

# Both Platforms
eas build --profile production --platform all
```

---

## 📤 Submission Commands

### iOS to App Store Connect

```bash
cd mobile
eas submit --profile production --platform ios
```

### Android to Google Play

```bash
cd mobile
eas submit --profile production --platform android
```

---

## ✅ Final Verification

Before submitting to stores, verify:

1. **API URL is updated:**
   ```bash
   grep -r "REPLACE-WITH-YOUR-PRODUCTION-API-URL" mobile/
   ```
   **Should return NO results** (placeholder replaced with actual production URL)

2. **All placeholders replaced:**
   ```bash
   grep -r "YOUR_" mobile/app.json mobile/eas.json
   ```
   **Should return NO results** (no placeholders)

3. **Firebase files exist:**
   ```bash
   ls mobile/google-services.json mobile/GoogleService-Info.plist
   ```
   **Should list both files**

4. **Test production build locally:**
   - Build with production profile
   - Install on real device
   - Verify it connects to production API
   - Test all features (posts, messages, notifications, GPS)

---

## 🆘 Common Errors

### "Invalid API URL"
- **Cause**: Still using dev URL
- **Fix**: Update `apiUrl` in `app.json` and all `API_URL` in `eas.json`

### "EAS Project ID not found"
- **Cause**: Haven't run `eas init`
- **Fix**: Run `eas login` then `eas init`

### "Build failed: Missing Firebase config"
- **Cause**: Firebase files not in `mobile/` directory
- **Fix**: Download from Firebase Console and place in `mobile/`

### "Submission failed: Invalid credentials"
- **Cause**: Wrong Apple ID / service account
- **Fix**: Verify credentials in `eas.json` match your accounts

---

## 📞 Support

**Issues?** Contact:
- **Email**: mykliqchatbot@gmail.com
- **EAS Docs**: https://docs.expo.dev/eas/
- **Expo Forums**: https://forums.expo.dev/

---

**Last Updated:** November 14, 2025
**MyKliq Version:** 1.0.0
