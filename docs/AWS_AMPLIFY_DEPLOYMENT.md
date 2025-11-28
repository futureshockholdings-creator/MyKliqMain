# MyKliq AWS Amplify Deployment Guide

## Overview
This guide covers deploying MyKliq to AWS Amplify with the custom domain **mykliq.app**.

## Deployment Files Created

### 1. `deploy-manifest.json`
Configures how Amplify routes requests:
- `/api/*` → Express server (Compute)
- `/assets/*` → Static files with long cache
- `/*.*` → Static files with fallback to server
- `/*` → Express server (for SPA routing)

### 2. `amplify.yml`
Build configuration for Amplify:
- Uses Node.js 20
- Runs `npm ci --legacy-peer-deps`
- Builds frontend (Vite) and backend (esbuild)
- Runs post-build script to organize files

### 3. `bin/build-amplify.sh`
Production build script:
- Sets `NODE_ENV=production`
- Builds React frontend with Vite
- Builds Express server with esbuild (minified)

### 4. `bin/postbuild.sh`
Organizes files for Amplify deployment:
- Creates `.amplify-hosting/compute/default/` for server
- Creates `.amplify-hosting/static/` for frontend
- Copies node_modules for runtime dependencies

## Required Environment Variables

Set these in AWS Amplify Console → App Settings → Environment Variables:

### Database
```
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
PGHOST=your-neon-host.neon.tech
PGDATABASE=your_database
PGUSER=your_user
PGPASSWORD=your_password
PGPORT=5432
```

### Authentication
```
JWT_SECRET=your-secure-jwt-secret-min-32-chars
SESSION_SECRET=your-secure-session-secret
ADMIN_PASSWORD=your-admin-password
ADMIN_URL_SECRET=your-admin-url-secret
```

### Firebase (Push Notifications)
```
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_VAPID_KEY=your-vapid-key
```

### Email Services
```
GMAIL_EMAIL=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
SENDGRID_API_KEY=your-sendgrid-api-key
```

### AI/API Services
```
GEMINI_API_KEY=your-gemini-api-key
```

### Social OAuth (Optional)
```
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
YOUTUBE_CLIENT_ID=your-youtube-client-id
YOUTUBE_CLIENT_SECRET=your-youtube-client-secret
# ... other OAuth providers
```

### Redis Caching (Optional but recommended)
```
REDIS_URL=redis://your-redis-host:6379
```

### Production Settings
```
NODE_ENV=production
AMPLIFY_APP_URL=https://mykliq.app
```

## Custom Domain Setup

### Step 1: Add Domain in Amplify Console
1. Go to Amplify Console → Your App → Domain Management
2. Click "Add domain"
3. Enter `mykliq.app`
4. Amplify will provide DNS records to configure

### Step 2: Configure DNS Records
Add these records at your domain registrar:

| Type | Name | Value |
|------|------|-------|
| CNAME | www | d1234567890.cloudfront.net |
| ANAME/ALIAS | @ | d1234567890.cloudfront.net |

*Note: If your registrar doesn't support ANAME/ALIAS, use Amplify's provided verification method*

### Step 3: SSL Certificate
Amplify automatically provisions and manages SSL certificates. This may take up to 48 hours for DNS propagation.

## WebSocket / Real-Time Features

AWS Amplify has limitations with native WebSocket connections. The MyKliq app handles this gracefully:

### Built-in Fallback Mechanism
The `FeedRealtimeService` (`client/src/lib/feedRealtime.ts`) automatically:
1. Attempts WebSocket connection (5 retry attempts with exponential backoff)
2. Falls back to polling every 30 seconds if WebSocket fails
3. Resumes WebSocket when connection becomes available

### Current Behavior on Amplify
- **Real-time feed updates**: Uses 30-second polling (automatic fallback)
- **Push notifications**: Work via Firebase Cloud Messaging (no WebSocket needed)
- **Chat messages**: Will use polling fallback

### Future Enhancement Options
If real-time latency is critical, consider:
1. **AWS API Gateway WebSocket API** - Dedicated WebSocket service ($1/million messages)
2. **AWS Fargate/ECS** - Full WebSocket support with dedicated containers
3. **Pusher/Ably** - Third-party real-time service integration

### Configuration for Polling-Only Mode
To force polling mode (skip WebSocket attempts), set this environment variable:
```
VITE_FORCE_POLLING=true
```

## Deployment Commands

### Local Testing
```bash
# Test the build locally
chmod +x bin/build-amplify.sh bin/postbuild.sh
./bin/build-amplify.sh
./bin/postbuild.sh
```

### Git-Based Deployment
```bash
# Push to connected GitHub repository
git add .
git commit -m "Deploy to AWS Amplify"
git push origin main
```

Amplify automatically triggers a build on push to the main branch.

## Background Tasks (Scheduled Jobs)

AWS Amplify's serverless compute is ephemeral, so background schedulers (`setInterval`) won't work reliably. The app automatically detects serverless environments and disables these schedulers.

### Tasks That Need External Scheduling
The following tasks must be triggered via AWS CloudWatch Events + Lambda:

1. **Birthday Messages** - Daily at midnight
2. **Mood Boost Cleanup** - Every 30 minutes
3. **Referral Bonus Processing** - Every hour

### Option 1: Create Scheduled Lambda Functions
Create a Lambda function that calls these endpoints:
```bash
# Birthday messages (run daily at 00:00 UTC)
curl -X POST https://mykliq.app/api/admin/tasks/birthday

# Mood boost cleanup (run every 30 minutes)
curl -X POST https://mykliq.app/api/admin/tasks/mood-boost-cleanup

# Referral bonus processing (run hourly)
curl -X POST https://mykliq.app/api/admin/tasks/referral-bonus
```

### Option 2: Use Replit as Task Runner
Keep a separate Replit deployment running these scheduled tasks, connecting to the same production database.

### Option 3: AWS EventBridge Scheduler
Use EventBridge Scheduler to trigger API Gateway endpoints that call your task endpoints.

## Monitoring

### CloudWatch Logs
- Access via Amplify Console → Monitoring → Logs
- Server logs appear under the compute function

### Metrics to Monitor
- Response times
- Error rates
- Memory usage
- Request counts

## Troubleshooting

### Build Failures
1. Check Amplify Console → Build logs
2. Verify Node.js version (requires 20.x)
3. Check for missing environment variables

### 502/503 Errors
1. Verify DATABASE_URL is correct
2. Check server startup logs in CloudWatch
3. Ensure node_modules were copied correctly

### SSL Issues
1. Wait 24-48 hours for DNS propagation
2. Verify DNS records are correct
3. Check domain verification status in Amplify

## Size Limits

- Compute package: Max 220 MB compressed
- Current estimate: ~150 MB (within limits)
- If exceeded, consider removing unused dependencies
