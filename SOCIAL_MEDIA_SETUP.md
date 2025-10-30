# Social Media Integration Setup Guide

MyKliq supports connecting 9 social media platforms to aggregate your content into one unified feed. Here's how to set up each platform:

## ✅ Already Set Up (Replit Connectors)

### YouTube
- **Status**: ✅ Connected via Replit Connector
- **Setup**: Already done! You connected it through the Replit interface
- **What it does**: Automatically fetches your latest YouTube videos and displays them in your social feed
- **Permissions**: Full access to your YouTube channel, videos, and analytics

### Discord  
- **Status**: ✅ Connected via Replit Connector
- **Setup**: Already done! You connected it through the Replit interface
- **What it does**: Shows the Discord servers you're a member of
- **Permissions**: Can view your servers and basic profile information

---

## 🔧 Manual Setup Required (Custom OAuth)

The following 9 platforms require you to create developer applications and provide API credentials. Follow these step-by-step instructions:

---

### 1. Instagram

**Requirements**: Instagram Business or Creator account (regular personal accounts won't work)

**Step-by-Step Setup**:

1. **Create a Facebook Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Log in with your Facebook account
   - Click "Get Started" and complete registration

2. **Create a New App**
   - Click "My Apps" → "Create App"
   - Select "More Options" → "Something Else"
   - Enter your app name and contact email
   - Click "Create App"

3. **Add Instagram Product**
   - In your app dashboard, click "Add Product"
   - Find "Instagram" and click "Set Up"
   - Choose "Instagram Basic Display API"

4. **Configure the App**
   - Navigate to Products → Instagram → Basic Display
   - Click "Create New App"
   - Fill in:
     - **Display Name**: MyKliq Instagram Integration
     - **Valid OAuth Redirect URIs**: `https://your-replit-url.replit.dev/api/oauth/callback/instagram`
     - **Deauthorize Callback URL**: `https://your-replit-url.replit.dev/api/oauth/deauthorize`
     - **Data Deletion Request URL**: `https://your-replit-url.replit.dev/api/oauth/delete`
   - Click "Save Changes"

5. **Get Your Credentials**
   - Find your **Instagram App ID** (this is your Client ID)
   - Click "Show" next to **Instagram App Secret** (this is your Client Secret)
   - Copy both values

6. **Add to Replit Secrets**
   - In Replit, go to the "Secrets" tab (lock icon)
   - Add these two secrets:
     - `INSTAGRAM_CLIENT_ID` = your Instagram App ID
     - `INSTAGRAM_CLIENT_SECRET` = your Instagram App Secret

7. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect Instagram"
   - Follow the OAuth flow to authorize
   - Your Instagram posts should now appear in your feed!

---

### 2. TikTok

**Requirements**: TikTok account

**Step-by-Step Setup**:

1. **Create a TikTok Developer Account**
   - Go to [developers.tiktok.com](https://developers.tiktok.com)
   - Click "Login" and sign in with your TikTok account
   - Complete the developer registration

2. **Create a New App**
   - Click "Manage Apps" → "Create App"
   - Fill in:
     - **App Name**: MyKliq
     - **Company Name**: Your name or company
     - **Description**: Social media integration for MyKliq

3. **Configure OAuth**
   - In your app settings, find "Login Kit"
   - Add redirect URL: `https://your-replit-url.replit.dev/api/oauth/callback/tiktok`
   - Request these scopes:
     - `user.info.basic`
     - `video.list`

4. **Get Your Credentials**
   - In your app dashboard, find:
     - **Client Key** (this is your Client ID)
     - **Client Secret**
   - Copy both values

5. **Add to Replit Secrets**
   - `TIKTOK_CLIENT_ID` = your Client Key
   - `TIKTOK_CLIENT_SECRET` = your Client Secret

6. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect TikTok"
   - Authorize the app
   - Your TikTok videos will appear in your feed!

---

### 3. Reddit

**Requirements**: Reddit account

**Step-by-Step Setup**:

1. **Create a Reddit App**
   - Go to [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps)
   - Scroll to bottom and click "Create App" or "Create Another App"

2. **Fill in App Details**
   - **Name**: MyKliq
   - **App type**: Select "web app"
   - **Description**: Social feed integration
   - **About URL**: `https://your-replit-url.replit.dev`
   - **Redirect URI**: `https://your-replit-url.replit.dev/api/oauth/callback/reddit`
   - Click "Create app"

3. **Get Your Credentials**
   - After creation, you'll see:
     - The app name and a string under it (this is your **Client ID**)
     - Click "edit" to see the **secret** field (this is your **Client Secret**)

4. **Add to Replit Secrets**
   - `REDDIT_CLIENT_ID` = the string under your app name
   - `REDDIT_CLIENT_SECRET` = the secret from edit page

5. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect Reddit"
   - Authorize the app
   - Your Reddit posts and comments will appear!

---

### 4. Twitch

**Requirements**: Twitch account

**Step-by-Step Setup**:

1. **Register as a Twitch Developer**
   - Go to [dev.twitch.tv](https://dev.twitch.tv)
   - Log in with your Twitch account
   - Navigate to "Your Console"

2. **Create a New Application**
   - Click "Applications" → "Register Your Application"
   - Fill in:
     - **Name**: MyKliq
     - **OAuth Redirect URLs**: `https://your-replit-url.replit.dev/api/oauth/callback/twitch`
     - **Category**: Website Integration

3. **Get Your Credentials**
   - After creation, click "Manage" on your app
   - Copy the **Client ID**
   - Click "New Secret" to generate a **Client Secret**
   - Copy the secret (you won't be able to see it again!)

4. **Add to Replit Secrets**
   - `TWITCH_CLIENT_ID` = your Client ID
   - `TWITCH_CLIENT_SECRET` = your Client Secret

5. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect Twitch"
   - Authorize the app
   - Your Twitch stream info and clips will appear!

---

### 5. Pinterest

**Requirements**: Pinterest account

**Step-by-Step Setup**:

1. **Create a Pinterest App**
   - Go to [developers.pinterest.com](https://developers.pinterest.com)
   - Log in with your Pinterest account
   - Click **"Create app"** or **"My Apps"** → **"Create app"**

2. **Fill in App Details**
   - **App name**: MyKliq
   - **App description**: Social media integration for MyKliq
   - **Website**: `https://your-replit-url.replit.dev`
   - Accept the terms and click **"Create"**

3. **Configure OAuth**
   - In your app dashboard, go to **"OAuth"** settings
   - Add redirect URI: `https://your-replit-url.replit.dev/api/oauth/callback/pinterest`
   - Request these scopes:
     - `boards:read`
     - `pins:read`
     - `user_accounts:read`

4. **Get Your Credentials**
   - In **App Settings** → **Basic information**:
   - **App ID** (this is your Client ID)
   - **App secret** (click "Show" to reveal)

5. **Add to Replit Secrets**
   - `PINTEREST_CLIENT_ID` = your App ID
   - `PINTEREST_CLIENT_SECRET` = your App secret

6. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect Pinterest"
   - Authorize the app
   - Your Pinterest pins will appear in your feed!

---

### 6. Facebook

**Requirements**: Facebook account

**Step-by-Step Setup**:

1. **Go to Meta for Developers**
   - Visit: [developers.facebook.com](https://developers.facebook.com)
   - Log in with your Facebook account
   - Click **"Get Started"** if first time

2. **Create a New App**
   - Click **"My Apps"** → **"Create App"**
   - Choose **"Other"** → **"Next"**
   - Select **"Business"** type → **"Next"**
   - **App name**: MyKliq Social
   - **Contact email**: Your email
   - Click **"Create app"**

3. **Configure Basic Settings**
   - Go to **Settings** → **Basic**
   - **App Domains**: `your-replit-url.replit.dev`
   - **Privacy Policy URL**: `https://your-replit-url.replit.dev/privacy-policy`
   - Click **"+ Add Platform"** → **"Website"**
   - **Site URL**: `https://your-replit-url.replit.dev`

4. **Set Up Facebook Login**
   - Go to **Products** → **Add Product** → Find **"Facebook Login"**
   - Click **"Set Up"**
   - Under **Settings**, add:
     - **Valid OAuth Redirect URIs**: `https://your-replit-url.replit.dev/api/oauth/callback/facebook`
   - Save changes

5. **Get Your Credentials**
   - Go to **Settings** → **Basic**
   - **App ID**: Copy this (your Client ID)
   - **App Secret**: Click "Show", complete security check, copy

6. **Add to Replit Secrets**
   - `FACEBOOK_CLIENT_ID` = your App ID
   - `FACEBOOK_CLIENT_SECRET` = your App Secret

7. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect Facebook"
   - Authorize the app
   - Your Facebook posts will appear in your feed!

---

### 7. ESPN Fantasy

**Requirements**: ESPN account with fantasy leagues

**Step-by-Step Setup**:

1. **Register for ESPN API Access**
   - Go to [espn.com/apis/devcenter](https://espn.com/apis/devcenter)
   - Click **"Register"** or **"Get API Key"**
   - Log in with your ESPN account

2. **Create a New Application**
   - Click **"Create New Application"**
   - Fill in:
     - **Application Name**: MyKliq Fantasy Integration
     - **Description**: Social media integration for fantasy sports
     - **Redirect URL**: `https://your-replit-url.replit.dev/api/oauth/callback/espn`

3. **Request Permissions**
   - Select these API scopes:
     - `openid`
     - `profile`
     - `fantasy` (for fantasy league access)

4. **Get Your Credentials**
   - After creation, you'll see:
   - **Client ID**: Copy this
   - **Client Secret**: Copy this (or generate if needed)

5. **Add to Replit Secrets**
   - `ESPN_CLIENT_ID` = your Client ID
   - `ESPN_CLIENT_SECRET` = your Client Secret

6. **Test Your Connection**
   - Go to Settings in MyKliq
   - Click "Connect ESPN Fantasy"
   - Authorize the app
   - Your fantasy leagues will appear in your feed!

**Note**: ESPN's API access may require approval for production use. Your app will work immediately with your own account.

---

## 📝 Important Notes

### Redirect URLs
Make sure to use your actual Replit URL in all redirect URIs. Replace `your-replit-url.replit.dev` with your real domain.

### Platform Limitations
- **Instagram**: Only works with Business/Creator accounts, not personal accounts
- **TikTok**: Requires open_id scope for video access
- **Reddit**: Rate limited to 60 requests per minute
- **Twitch**: Clips and stream data only (no chat history)
- **Pinterest**: Requires approved Pinterest Developer account for production
- **Facebook**: Posts and photos only (no private messages)
- **ESPN Fantasy**: Requires active fantasy league participation

### Security
- Never share your Client IDs or Client Secrets publicly
- All credentials are stored encrypted in Replit Secrets
- Tokens are encrypted before being saved to the database

### Testing
After connecting each platform:
1. Go to Settings and verify the platform shows as "Connected"
2. Check your social feed to see content from that platform
3. If content doesn't appear, click "Disconnect" and try connecting again

---

## 🎯 How It Works

Once you've connected a platform:

1. **OAuth Flow**: You authorize MyKliq to access your account
2. **Token Storage**: Access tokens are encrypted and stored securely
3. **Content Fetching**: MyKliq periodically fetches your latest content
4. **Unified Feed**: All content appears in your MyKliq social feed alongside posts from your friends

---

## 🔍 Troubleshooting

**"Platform not connected" error**:
- Make sure you added the Client ID and Client Secret to Replit Secrets
- Check that the redirect URL matches exactly
- Verify your app is approved (some platforms require approval)

**No content appearing**:
- Check that you granted all required permissions during OAuth
- Some platforms have delays before content appears
- Try disconnecting and reconnecting the account

**OAuth errors**:
- Double-check your redirect URLs match exactly
- Make sure your developer app is in "Development" or "Live" mode
- Verify the scopes/permissions requested are available

---

## ✅ Summary

Once you complete these steps for each platform, you'll have:
- ✅ YouTube (via Replit Connector)
- ✅ Discord (via Replit Connector)  
- ✅ Instagram (via Manual OAuth)
- ✅ TikTok (via Manual OAuth)
- ✅ Reddit (via Manual OAuth)
- ✅ Twitch (via Manual OAuth)
- ✅ Pinterest (via Manual OAuth)
- ✅ Facebook (via Manual OAuth)
- ✅ ESPN Fantasy (via Manual OAuth)

**Total: 9 platforms** integrated into one unified social feed in MyKliq! 🎉

### Required Secrets (18 total)
Make sure you add all of these to your Replit Secrets:
- `YOUTUBE_CLIENT_ID` & `YOUTUBE_CLIENT_SECRET`
- `DISCORD_CLIENT_ID` & `DISCORD_CLIENT_SECRET`
- `INSTAGRAM_CLIENT_ID` & `INSTAGRAM_CLIENT_SECRET`
- `TIKTOK_CLIENT_ID` & `TIKTOK_CLIENT_SECRET`
- `REDDIT_CLIENT_ID` & `REDDIT_CLIENT_SECRET`
- `TWITCH_CLIENT_ID` & `TWITCH_CLIENT_SECRET`
- `PINTEREST_CLIENT_ID` & `PINTEREST_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` & `FACEBOOK_CLIENT_SECRET`
- `ESPN_CLIENT_ID` & `ESPN_CLIENT_SECRET`
