# TestFlight & Google Play Internal Testing Setup Guide

This guide covers setting up beta testing for the MyKliq mobile app on both iOS (TestFlight) and Android (Google Play Internal Testing).

---

## 📱 iOS TestFlight Setup

### Prerequisites

1. **Apple Developer Account** ($99/year)
   - Individual or Organization account
   - Required for TestFlight distribution

2. **Xcode** (Latest version)
   - Download from Mac App Store
   - Required for iOS build configuration

3. **App Store Connect Access**
   - Team admin or app manager role
   - Access to create apps and manage beta testers

### Step 1: Create App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **"My Apps"** → **"+"** → **"New App"**
3. Fill in app details:
   - **Platform:** iOS
   - **Name:** MyKliq
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** com.mykliq.app (must match app.json)
   - **SKU:** mykliq-ios-001 (unique identifier)
   - **User Access:** Full Access

### Step 2: Configure App Information

1. Navigate to your app in App Store Connect
2. Fill in required metadata:
   - **App Store Icon:** 1024x1024 PNG (from `mobile/assets/ios-appicon-1024.png`)
   - **Privacy Policy URL:** https://mykliq.com/privacy
   - **App Category:** Social Networking
   - **Content Rights:** Declare if app has in-app purchases, ads, etc.

3. Set age rating:
   - Complete the Age Rating Questionnaire
   - MyKliq is rated **13+** (COPPA compliance)

### Step 3: Prepare iOS Build with EAS

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo:**
   ```bash
   eas login
   ```

3. **Configure EAS project:**
   ```bash
   cd mobile
   eas init
   ```
   This will prompt you to:
   - Link to existing Expo project or create new one
   - Generate `projectId` and add to `app.json`

4. **Configure iOS credentials:**
   ```bash
   eas credentials
   ```
   Select:
   - **Platform:** iOS
   - **Action:** Set up push notifications (if using)
   - **Apple Developer account** credentials

5. **Build for TestFlight:**
   ```bash
   eas build --platform ios --profile production
   ```
   This will:
   - Generate iOS Archive (.ipa)
   - Handle code signing automatically
   - Upload to EAS servers

### Step 4: Submit Build to TestFlight

**Option A: Automatic Submission (Recommended)**

Configure `eas.json` for auto-submit:
```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

Then run:
```bash
eas submit --platform ios --latest
```

**Option B: Manual Upload via Transporter**

1. Download build from EAS dashboard
2. Open **Transporter** app (Mac App Store)
3. Drag .ipa file to Transporter
4. Click **"Deliver"**

### Step 5: Configure TestFlight Beta Testing

1. Go to App Store Connect → Your App → **TestFlight** tab
2. Wait for build to process (10-30 minutes)
3. Click on the build version
4. Add **Beta App Review Information:**
   - Contact email: support@mykliq.com
   - First name, last name
   - Phone number
   - Demo account credentials (create test account)
   - Notes: Brief description of app features

5. **Export Compliance:**
   - Does your app use encryption? **Yes** (HTTPS)
   - Does it use standard encryption? **Yes**
   - Is encryption exempt? **Yes** (only HTTPS)

### Step 6: Add Beta Testers

**Internal Testing (No Review Required):**
1. Go to TestFlight → **Internal Testing**
2. Click **"+"** → Add tester by email
3. Testers receive email invite instantly
4. Max 100 internal testers

**External Testing (Requires Review):**
1. Go to TestFlight → **External Testing**
2. Create new group: "Beta Testers"
3. Add testers (up to 10,000)
4. Submit for Beta App Review (1-2 days)
5. Once approved, testers receive invites

### Step 7: Tester Instructions

Send beta testers this guide:

1. **Install TestFlight** from App Store
2. **Check email** for TestFlight invite
3. **Tap "View in TestFlight"** in email
4. **Accept invite** and install MyKliq
5. **Provide Feedback:**
   - Shake device → "Feedback" in TestFlight
   - Or use in-app feedback form

---

## 🤖 Android Google Play Internal Testing

### Prerequisites

1. **Google Play Developer Account** ($25 one-time fee)
   - Create at [Google Play Console](https://play.google.com/console)

2. **Google Account** for signing builds
   - Can use existing Google account
   - No separate credentials needed

### Step 1: Create App in Google Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in details:
   - **App name:** MyKliq
   - **Default language:** English (United States)
   - **App or game:** App
   - **Free or paid:** Free
   - Accept declarations (content policy, export laws)

### Step 2: Set Up App Content

1. Navigate to **Policy → App content**
2. Complete required declarations:
   - **Privacy Policy URL:** https://mykliq.com/privacy
   - **App Access:** Free (no special access needed for testing)
   - **Ads:** Declare if app shows ads
   - **Content Rating:** Complete questionnaire (13+)
   - **Target Audience:** 13+ (COPPA compliance)
   - **Data Safety:** Complete data collection form

### Step 3: Prepare Android Build with EAS

1. **Generate Android keystore:**
   ```bash
   eas credentials
   ```
   Select:
   - **Platform:** Android
   - **Action:** Set up new Android Keystore
   - EAS will generate and manage keystore automatically

2. **Build AAB for Play Store:**
   ```bash
   eas build --platform android --profile production
   ```
   This generates:
   - Android App Bundle (.aab)
   - Signed with generated keystore
   - Optimized for Play Store

### Step 4: Upload Build to Internal Testing

1. Go to Google Play Console → Your App
2. Navigate to **Testing → Internal testing**
3. Click **"Create new release"**
4. Upload AAB file:
   - Download .aab from EAS build dashboard
   - Click **"Upload"** and select .aab file
5. Add release notes:
   ```
   First internal testing build
   - Complete feature set
   - All core functionality implemented
   ```
6. Click **"Save"** → **"Review release"** → **"Start rollout to Internal testing"**

### Step 5: Create Test Track

1. In Internal testing section, click **"Testers"** tab
2. Click **"Create email list"**
3. Name: "Internal Beta Testers"
4. Add tester emails (one per line, up to 100 testers)
5. Click **"Save changes"**

### Step 6: Share Testing Link

1. Go to Internal testing → **Testers** tab
2. Copy the **"Copy link"** URL
3. Share with testers via:
   - Email
   - Slack/Discord
   - Internal communication tool

**Tester instructions:**
1. Click the testing link
2. Accept the invitation
3. Download MyKliq from Google Play Store
4. Install and test
5. Provide feedback via email or in-app

### Step 7: Monitor Test Results

1. Go to **Testing → Internal testing → Feedback**
2. Review:
   - Crash reports
   - ANR (App Not Responding) reports
   - User feedback
3. Address issues and upload new builds as needed

---

## 🔄 Continuous Beta Testing Workflow

### Uploading New Builds

**iOS (TestFlight):**
```bash
# Build and submit
eas build --platform ios --profile production --auto-submit

# Or build then submit separately
eas build --platform ios --profile production
eas submit --platform ios --latest
```

**Android (Internal Testing):**
```bash
# Build
eas build --platform android --profile production

# Download .aab from EAS dashboard
# Upload to Google Play Console → Internal testing → "Create new release"
```

### Version Management

Update version in `app.json` before each build:
```json
{
  "expo": {
    "version": "1.0.1",  // User-facing version
    "ios": {
      "buildNumber": "2"  // Increment for each iOS build
    },
    "android": {
      "versionCode": 2  // Increment for each Android build
    }
  }
}
```

### Beta Testing Checklist

Before each beta release:
- [ ] Update version numbers in `app.json`
- [ ] Test locally on iOS simulator
- [ ] Test locally on Android emulator
- [ ] Verify all API endpoints work
- [ ] Check crash reporting integration
- [ ] Review release notes
- [ ] Build with EAS
- [ ] Submit to TestFlight (iOS)
- [ ] Upload to Internal Testing (Android)
- [ ] Notify beta testers
- [ ] Monitor feedback and crashes

---

## 📊 Collecting Beta Feedback

### In-App Feedback

Implement feedback form in app:
```typescript
// mobile/src/screens/FeedbackScreen.tsx
import { useState } from 'react';
import { View, TextInput, Button } from 'react-native';
import { apiRequest } from '@/lib/apiClient';

export function FeedbackScreen() {
  const [feedback, setFeedback] = useState('');
  
  const submitFeedback = async () => {
    await apiRequest('/api/mobile/feedback', {
      method: 'POST',
      body: { feedback, platform: Platform.OS, version: Constants.expoConfig?.version }
    });
  };
  
  return (
    <View>
      <TextInput 
        multiline 
        placeholder="Share your feedback..."
        value={feedback}
        onChangeText={setFeedback}
      />
      <Button title="Submit" onPress={submitFeedback} />
    </View>
  );
}
```

### Crash Reporting

Integrate Sentry or Firebase Crashlytics:
```bash
# Sentry
npx expo install @sentry/react-native

# Firebase
npx expo install @react-native-firebase/app @react-native-firebase/crashlytics
```

### Analytics

Track beta user behavior:
- Screen views
- Feature usage
- Error rates
- Session duration

---

## 🚀 Graduating to Production

### iOS App Store Submission

Once beta testing is complete:

1. Go to App Store Connect → Your App
2. Click **"+"** → **"iOS App"** (if not created)
3. Fill in all metadata:
   - Screenshots (use from `mobile/STORE_ASSETS.md`)
   - Description (use from `mobile/STORE_ASSETS.md`)
   - Keywords
   - Support URL
   - Marketing URL
4. Select build from TestFlight
5. Submit for App Review
6. Wait 1-3 days for review
7. Once approved, app goes live!

### Android Production Release

1. Go to Google Play Console → Your App
2. Navigate to **Production** tab
3. Click **"Create new release"**
4. Upload production .aab (same as internal testing)
5. Review and confirm
6. Submit for review
7. Review takes 1-7 days
8. Once approved, app is live!

---

## 📞 Support Resources

**TestFlight:**
- [TestFlight Documentation](https://developer.apple.com/testflight/)
- [App Store Connect Help](https://developer.apple.com/support/app-store-connect/)

**Google Play:**
- [Internal Testing Guide](https://support.google.com/googleplay/android-developer/answer/9845334)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

**EAS Build:**
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Submit Documentation](https://docs.expo.dev/submit/introduction/)

**MyKliq Support:**
- Email: dev@mykliq.com
- Documentation: See mobile/README.md
