# Mobile OAuth Authentication Guide

Complete guide for implementing OAuth 2.0 authentication flows in the MyKliq mobile app with PKCE and deep linking.

## Table of Contents
1. [Overview](#overview)
2. [Replit OAuth Login](#replit-oauth-login)
3. [Social Platform OAuth](#social-platform-oauth)
4. [Deep Linking Setup](#deep-linking-setup)
5. [Security Best Practices](#security-best-practices)

---

## Overview

MyKliq supports two OAuth authentication methods:

1. **Replit OAuth**: Alternative login method using your Replit account
2. **Social Platform OAuth**: Connect external accounts (TikTok, YouTube, Discord, etc.)

Both flows use PKCE (Proof Key for Code Exchange) for maximum security and deep linking for seamless mobile UX.

---

## Replit OAuth Login

### Flow Diagram
```
Mobile App → Init OAuth → System Browser → Replit Authorization
                ↓
            Deep Link Callback → Token Exchange → JWT Token
```

### Implementation

#### Step 1: Initialize OAuth Flow

```typescript
import * as WebBrowser from 'expo-web-browser';
import * as SecureStore from 'expo-secure-store';

async function loginWithReplit() {
  try {
    // Request OAuth URL from backend
    const response = await fetch('https://your-api.com/api/mobile/oauth/replit/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    const { authUrl, state } = await response.json();
    
    // Store state for verification (optional)
    await SecureStore.setItemAsync('oauth_state', state);
    
    // Open system browser for authorization
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      'myapp://oauth/callback' // Deep link redirect
    );
    
    if (result.type === 'success') {
      handleOAuthCallback(result.url);
    }
  } catch (error) {
    console.error('OAuth init failed:', error);
  }
}
```

#### Step 2: Handle Deep Link Callback

```typescript
import * as Linking from 'expo-linking';

// Listen for deep link events
Linking.addEventListener('url', ({ url }) => {
  if (url.startsWith('myapp://oauth/callback')) {
    handleOAuthCallback(url);
  }
});

async function handleOAuthCallback(url: string) {
  // Extract authorization code and state
  const { queryParams } = Linking.parse(url);
  const { code, state } = queryParams;
  
  // Verify state matches (CSRF protection)
  const storedState = await SecureStore.getItemAsync('oauth_state');
  if (state !== storedState) {
    throw new Error('Invalid OAuth state - possible CSRF attack');
  }
  
  // Exchange code for JWT token
  const response = await fetch('https://your-api.com/api/mobile/oauth/replit/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state }),
  });
  
  const { token, userId, firstName, lastName } = await response.json();
  
  // Store JWT token securely
  await SecureStore.setItemAsync('jwt_token', token);
  
  // Navigate to home screen
  navigation.navigate('Home');
}
```

---

## Social Platform OAuth

Connect external social accounts (requires existing authentication).

### Supported Platforms
- **TikTok**: Share videos, view analytics
- **YouTube**: Sync channel content
- **Discord**: Show server activity
- **Twitch**: Display stream stats
- **Reddit**: Aggregate posts
- **Pinterest**: Share boards
- **LinkedIn**: Professional updates

### Flow Diagram
```
Authenticated User → Init Platform OAuth → System Browser → Platform Authorization
                         ↓
                    Deep Link → Token Exchange → Platform Connected
```

### Implementation

#### Step 1: Initialize Platform OAuth

```typescript
async function connectPlatform(platform: 'tiktok' | 'youtube' | 'discord') {
  try {
    const token = await SecureStore.getItemAsync('jwt_token');
    
    // Request OAuth URL (requires JWT authentication)
    const response = await fetch(`https://your-api.com/api/mobile/oauth/${platform}/init`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    const { authUrl, state } = await response.json();
    
    // Open system browser
    const result = await WebBrowser.openAuthSessionAsync(
      authUrl,
      'myapp://oauth/callback'
    );
    
    if (result.type === 'success') {
      handlePlatformCallback(result.url, platform);
    }
  } catch (error) {
    console.error(`${platform} OAuth failed:`, error);
  }
}
```

#### Step 2: Handle Platform Callback

```typescript
async function handlePlatformCallback(url: string, platform: string) {
  const { queryParams } = Linking.parse(url);
  const { code, state } = queryParams;
  
  const token = await SecureStore.getItemAsync('jwt_token');
  
  // Exchange code for platform tokens
  const response = await fetch(`https://your-api.com/api/mobile/oauth/${platform}/callback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  });
  
  const { success, account } = await response.json();
  
  if (success) {
    console.log(`Connected to ${platform}:`, account);
    // Show success message, refresh connected accounts list
  }
}
```

#### Step 3: Disconnect Platform

```typescript
async function disconnectPlatform(platform: string) {
  const token = await SecureStore.getItemAsync('jwt_token');
  
  await fetch(`https://your-api.com/api/mobile/oauth/${platform}/disconnect`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  console.log(`Disconnected from ${platform}`);
}
```

---

## Deep Linking Setup

### iOS Configuration

**1. Add URL Scheme (Info.plist)**
```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>myapp</string>
    </array>
    <key>CFBundleURLName</key>
    <string>com.mykliq.app</string>
  </dict>
</array>
```

**2. Universal Links (Recommended)**
```xml
<key>com.apple.developer.associated-domains</key>
<array>
  <string>applinks:yourdomain.com</string>
</array>
```

Host this file at `https://yourdomain.com/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.mykliq.app",
      "paths": ["/oauth/callback"]
    }]
  }
}
```

### Android Configuration

**1. Add Intent Filter (AndroidManifest.xml)**
```xml
<activity android:name=".MainActivity">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="myapp" 
          android:host="oauth"
          android:path="/callback" />
  </intent-filter>
</activity>
```

**2. App Links (Recommended)**
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https"
        android:host="yourdomain.com"
        android:path="/oauth/callback" />
</intent-filter>
```

Host this file at `https://yourdomain.com/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.mykliq.app",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

---

## Security Best Practices

### 1. Token Storage
✅ **DO**: Use secure storage (expo-secure-store)
```typescript
import * as SecureStore from 'expo-secure-store';

// Store token
await SecureStore.setItemAsync('jwt_token', token);

// Retrieve token
const token = await SecureStore.getItemAsync('jwt_token');
```

❌ **DON'T**: Use AsyncStorage (unencrypted)
```typescript
// INSECURE - DO NOT USE
await AsyncStorage.setItem('jwt_token', token);
```

### 2. State Parameter Verification
Always verify the state parameter to prevent CSRF attacks:

```typescript
// Store state before OAuth
await SecureStore.setItemAsync('oauth_state', state);

// Verify on callback
const storedState = await SecureStore.getItemAsync('oauth_state');
if (state !== storedState) {
  throw new Error('Invalid OAuth state');
}
```

### 3. System Browser (Not WebViews)
✅ **DO**: Use system browser
```typescript
import * as WebBrowser from 'expo-web-browser';

await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
```

❌ **DON'T**: Use in-app WebView
```typescript
// INSECURE - DO NOT USE
<WebView source={{ uri: authUrl }} />
```

### 4. HTTPS Only
All API calls must use HTTPS:
```typescript
const API_URL = 'https://your-api.com'; // ✅ Secure
// const API_URL = 'http://your-api.com'; // ❌ Insecure
```

### 5. Token Expiry Handling
```typescript
async function apiRequest(url: string) {
  const token = await SecureStore.getItemAsync('jwt_token');
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  
  if (response.status === 401) {
    // Token expired - prompt re-login
    navigation.navigate('Login');
  }
  
  return response.json();
}
```

---

## API Endpoints Reference

### Replit OAuth
- **POST** `/api/mobile/oauth/replit/init` - Initialize OAuth flow
- **POST** `/api/mobile/oauth/replit/callback` - Handle OAuth callback

### Social Platform OAuth
- **POST** `/api/mobile/oauth/:platform/init` - Initialize platform OAuth (requires JWT)
- **POST** `/api/mobile/oauth/:platform/callback` - Handle platform callback
- **DELETE** `/api/mobile/oauth/:platform/disconnect` - Disconnect platform (requires JWT)

Supported platforms: `tiktok`, `youtube`, `discord`, `twitch`, `reddit`, `pinterest`, `linkedin`

---

## Troubleshooting

### Deep Link Not Opening App
- Check URL scheme is registered in Info.plist (iOS) or AndroidManifest.xml (Android)
- Verify redirect URI matches exactly: `myapp://oauth/callback`
- Test deep link: `npx uri-scheme open myapp://oauth/callback --ios`

### OAuth State Mismatch
- Ensure state is stored before opening browser
- Check state parameter in callback URL
- Verify state hasn't expired (5-minute TTL)

### Token Exchange Fails
- Check authorization code is present in callback URL
- Verify backend can reach OAuth provider
- Ensure code hasn't been used already (one-time use)

### Platform Not Configured
- Verify API keys are set in environment variables:
  - `TIKTOK_CLIENT_ID`, `TIKTOK_CLIENT_SECRET`
  - `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`
  - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
- Check platform callback URL is registered with provider

---

## Next Steps

1. Implement Replit OAuth for alternative login method
2. Add social platform connections UI
3. Test OAuth flows on physical devices
4. Set up push notifications for new platform content
5. Implement token refresh mechanism (if needed)

For additional help, see:
- [RFC 8252: OAuth 2.0 for Native Apps](https://tools.ietf.org/html/rfc8252)
- [RFC 7636: PKCE](https://tools.ietf.org/html/rfc7636)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
