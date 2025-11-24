# MyKliq Mobile Privacy Policy

**Last Updated:** November 14, 2025  
**Version:** 2.0

## Quick Summary

MyKliq respects your privacy. This document explains what data our mobile app collects and how we use it.

## Mobile Permissions

The MyKliq mobile app requests the following permissions. **All permissions are optional** - you can deny them and still use core features:

### 📷 Camera Access
- **Why:** Take photos/videos for posts, stories, and profile pictures
- **When:** Only when you choose to use the camera
- **Control:** Settings > MyKliq > Camera

### 🖼️ Photo Library Access
- **Why:** Upload existing photos/videos from your device
- **When:** Only when you select media to upload
- **Control:** Settings > MyKliq > Photos

### 📍 Location Services
- **Why:** GPS meetups, location tags for posts and events
- **When:** Only when you use GPS features (always "When In Use", never in background)
- **Control:** Settings > MyKliq > Location
- **Data Collected:** Real-time GPS coordinates only when actively using meetup/check-in features

### 🔔 Push Notifications
- **Why:** Updates about posts, messages, friends, events, and Kliq Koin
- **When:** After you enable notifications
- **Control:** Settings > Notifications > MyKliq OR in-app Notification Preferences
- **Types:** New posts, comments, likes, messages, story replies, mentions, events, Kliq Koin, friends

## Data We Collect

### Information You Provide
- Profile information (name, email, profile picture)
- Content you create (posts, comments, photos, videos, stories)
- Messages and conversations
- Event check-ins and GPS meetup locations
- Notification preferences

### Automatically Collected (Mobile)
- **Device Information:**
  - Device model, OS version, app version
  - Device identifier (for push notifications only)
  - Network type (WiFi/cellular)
  
- **Usage Analytics:**
  - App performance metrics (load times, crashes)
  - Feature usage patterns
  - Error logs and diagnostics
  
- **Local Storage:**
  - Authentication tokens (encrypted)
  - Theme preferences
  - Cached feed content and images
  - Draft posts and messages

### Third-Party Services

We use these services to power mobile features:

- **Firebase (Google):**
  - Analytics (anonymized usage data)
  - Cloud Messaging (push notifications)
  - Crash Reporting (error diagnostics)

- **Google Gemini API:** AI-powered mood boost content

- **ESPN API:** Sports scores and updates

- **Social Media APIs:** Optional integrations (Instagram, YouTube, TikTok, Twitter, Facebook, Discord, Pinterest, Reddit, Twitch)

Each service has its own privacy policy. Links provided in-app.

## How We Use Your Data

✅ **We use your data to:**
- Provide core social networking features
- Send personalized notifications
- Improve app performance and fix bugs
- Personalize your content feed
- Enable GPS-based features when you opt in

❌ **We do NOT:**
- Sell your personal information to third parties
- Access your camera/photos without permission
- Track your location in the background
- Share your content outside your kliq without consent

## Your Privacy Controls

### In-App Controls
- **Notification Preferences:** Customize which notifications you receive
- **Theme Settings:** High contrast mode for accessibility
- **Content Filters:** Control what content appears in your feed
- **Friend Rankings:** Manage who sees your posts

### Device-Level Controls
- **Revoke Permissions:** Settings > MyKliq > [Permission Type]
- **Disable Notifications:** Settings > Notifications > MyKliq
- **Clear Cache:** Log out or uninstall app to remove locally stored data

### Account Controls
- **Access Data:** View your profile and content anytime
- **Update Information:** Edit profile, preferences, and settings
- **Delete Account:** Permanently remove your data from our servers

## Data Security

🔒 **Security Measures:**
- JWT authentication with 30-day token expiration
- Encrypted local storage (iOS Keychain, Android Keystore)
- HTTPS for all network requests
- Secure token storage (expo-secure-store)
- Automatic cache clearing on logout

⚠️ **Important:** No internet transmission is 100% secure. We use industry-standard practices but cannot guarantee absolute security.

## Data Retention

- **Active Accounts:** Data retained while your account is active
- **Deleted Accounts:** Data permanently deleted within 30 days
- **Local Cache:** Cleared immediately on logout or app uninstall
- **Stories:** Auto-deleted after 24 hours
- **Incognito Messages:** Auto-deleted after 7 days
- **Mood Boost Content:** Expires after 5 hours

## Children's Privacy

MyKliq is intended for users **aged 13 and older**. We do not knowingly collect data from children under 13. If you believe we have collected information from a child under 13, contact us immediately.

## Your Rights

You have the right to:
- ✅ Access your personal information
- ✅ Update or correct your data
- ✅ Delete your account and data
- ✅ Export your content
- ✅ Opt out of notifications
- ✅ Revoke device permissions
- ✅ Control content visibility

## App Store Privacy Labels

### iOS App Store - Privacy Nutrition Label

**Data Used to Track You:** None

**Data Linked to You:**
- Contact Info: Email, Phone Number
- User Content: Photos, Videos, Messages, Posts
- Identifiers: User ID
- Usage Data: Product Interaction (anonymized)
- Location: Precise Location (optional, when in use only)

**Data Not Linked to You:**
- Diagnostics: Crash Data, Performance Data

### Google Play Store - Data Safety

**Data Shared:**
- Personal Info: Name, Email, Phone, Profile Picture
- Photos and Videos: User-generated content
- Messages: Direct messages and comments
- Location: Approximate and Precise (optional)
- App Activity: In-app actions and feature usage

**Security Practices:**
- Data encrypted in transit
- Data encrypted at rest (local storage)
- You can request data deletion

## Changes to This Policy

We may update this Privacy Policy periodically. You'll be notified of significant changes via:
- Updated "Last Updated" date
- In-app notification (for major changes)
- Email notification (for important changes)

## Contact Us

**Questions about privacy?**
- Email: mykliqchatbot@gmail.com
- In-App: Settings > Help & Support > Contact Us

## Legal Compliance

This privacy policy complies with:
- COPPA (Children's Online Privacy Protection Act)
- GDPR (General Data Protection Regulation)
- CCPA (California Consumer Privacy Act)
- Apple App Store Review Guidelines
- Google Play Developer Policy

---

## For Developers

### Permission Usage Strings (Info.plist / AndroidManifest.xml)

**iOS (Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>MyKliq needs camera access to let you take photos and videos for posts and stories.</string>

<key>NSPhotoLibraryUsageDescription</key>
<string>MyKliq needs photo library access to let you share photos and videos with your kliq.</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>MyKliq needs your location to help you find nearby kliq members and tag your location in posts.</string>

<key>NSPhotoLibraryAddUsageDescription</key>
<string>MyKliq needs permission to save photos and videos to your library.</string>
```

**Android (AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Firebase Service Account

Push notifications require `FIREBASE_SERVICE_ACCOUNT` environment variable. See Firebase Console for setup instructions.

---

**Full Privacy Policy:** https://kliqlife.com/privacy-policy
