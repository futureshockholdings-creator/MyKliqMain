# Overview

MyKliq is a social media application designed for private, close-knit friend groups ("kliqs"), emphasizing intimate sharing, privacy, and extensive UI customization. The platform aims to foster quality interactions within private circles, offering features like hierarchical friend ranking, content filtering, and rich media sharing (photos, videos, disappearing stories, polls, live streaming). Its ambition is to evolve into an AI-powered intelligent social network. MyKliq also includes an advertiser onboarding system for ad placement within the platform.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application offers extensive UI customization including global themes, dynamic switching, custom backgrounds, fonts, color schemes, and border styles. It also features a "Surprise Me" theme randomizer and adheres to WCAG accessibility standards. Policy pages and the footer maintain a forced white background with black text for maximum readability, overriding custom themes. The navigation bar is compact (64px wide) to maximize content display.

## Technical Implementations
### Frontend
The web client is a React-based SPA using TypeScript, Vite, Wouter, TanStack Query, Radix UI/shadcn/ui, and Tailwind CSS. The mobile application is built with React Native CLI (iOS/Android), Expo SDK 51, TypeScript, React Navigation, React Context API, and Firebase, prioritizing native performance and offline capabilities. The web app is a Progressive Web App (PWA) with offline support, installability, and smart caching.

### Backend
The server employs a RESTful API with Express.js and TypeScript. Drizzle ORM manages PostgreSQL interactions, and PostgreSQL-backed sessions handle user authentication. Mobile API endpoints are optimized for efficient data transfer.

### API Architecture
A shared TypeScript contract system ensures type safety across web and mobile platforms. API endpoints are structured as `/api/{feature}` for web and `/api/mobile/{feature}` for mobile.

### Mobile Architecture
The MyKliq mobile application utilizes React Native with Expo SDK 51 and TypeScript, featuring a 5-tab Bottom Tab Navigator, React Context (Auth Provider), TanStack Query v5, `expo-secure-store` for JWT persistence, and NativeWind for Tailwind CSS. Mobile APIs are optimized for bandwidth and battery, employing JWT authentication, media URL transformation, polling for updates, and optimistic UI.

### Database Design
PostgreSQL with Drizzle ORM stores data for users, themes, friendships, posts, comments, content filters, messages, stories, sessions, invite codes, advertiser applications, and content moderation reports. Performance is optimized through indexing and connection pooling.

### Content Moderation (Rules Reports)
The admin dashboard includes a "Rules Reports" tab for managing user-reported content. Features include:
- Report status workflow: OPEN (pending) → PENDING (reviewed/under review) → CLOSED (resolved/dismissed)
- Statistics cards showing report counts by status
- Filterable reports table displaying: status, reported user (name/email), reason, reporter, date
- Review modal with full post content and reported user details
- Admin actions: Mark as Pending, Dismiss, Issue Warning, Remove Post
- User suspension options: 24 hours, 7 days, Permanent Ban
- Database table: `rules_reports` with fields for reporter, post author, reason, status, admin notes, and action taken

### Authentication & Authorization
Authentication uses JWT tokens for both web and mobile clients to support cross-domain deployment (AWS Amplify frontend with Replit backend API). The server supports hybrid authentication: JWT tokens via Authorization header (primary for cross-domain) with cookie-based session fallback (legacy support). JWT tokens are stored in localStorage on web and SecureStore on mobile, with automatic expiration validation and cleanup on 401 responses. Security features include password requirements, PKCE support for OAuth 2.0, 4-step password recovery, and invite codes. Logout processes ensure comprehensive cache clearing (JWT token, IndexedDB, TanStack Query cache) to prevent cross-session data leakage.

### Social Media OAuth Integration
External OAuth connections (TikTok, Discord, Reddit, Pinterest, Twitch, YouTube) use an adaptive flow with popup windows for desktop and full-page redirects for mobile. Users connect social accounts to earn Kliq Koins.

### Content Management
The system supports a hierarchical feed filtered by friend rankings, kliq-wide content aggregation, daily horoscopes/Bible verses, AI-powered mood boosts, real-time polling, and rich media (photos, videos, YouTube URLs, Moviecons). It includes 24-hour disappearing stories, 7-day auto-deleting incognito messaging, live streaming, GPS-based meetups, event auto-posting, social media aggregation, and personalized real-time sports updates. A camera capture feature is integrated into the media upload component. Educational posts are displayed to new users for onboarding.

### Moviecon Thumbnail System
Moviecons use pre-generated JPEG thumbnails (stored in `thumbnailUrl` column) for fast loading in pickers. Thumbnails are extracted from video frames using ffmpeg and stored in object storage at `/objects/thumbnails/{movieconId}.jpg`. The `ThumbnailService` (`server/thumbnailService.ts`) handles generation, and new admin-uploaded moviecons automatically get thumbnails via async background processing. The `scripts/generateMovieconThumbnails.ts` script can batch-generate thumbnails for existing moviecons.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) with Redis support, in-memory fallback, pattern-based invalidation, and LRU eviction optimizes performance. The web client uses a two-tier `EnhancedCache` (memory and IndexedDB) with comprehensive clearing on logout.

**Server-Side Caching (December 2025):**
- Static content (memes, moviecons, GIFs): 30-minute TTL with cache invalidation on POST/PUT/DELETE
- User profile (`/api/auth/user`): 10-minute TTL with smart invalidation on profile updates
- Kliq-feed: 3-minute TTL with cache-first strategy
- Content filters: 5-minute TTL
- Educational post eligibility: 1-hour TTL

**Database Indexes (December 2025):** 12 critical indexes added for performance:
- Posts: `idx_posts_user_created`, `idx_posts_created`, `idx_posts_user`
- Friendships: `idx_friendships_user`, `idx_friendships_friend`, `idx_friendships_status`
- Comments: `idx_comments_post`, `idx_comments_user`
- Post likes: `idx_post_likes_post`, `idx_post_likes_user`
- Notifications: `idx_notifications_user`, `idx_notifications_read`

**Cross-User Cache Isolation**: Client-side cache keys include the userId for all user-specific API endpoints (via `cacheKeyBuilder.ts`). This prevents cached data from one user's session leaking to another user's session. The `isUserSpecificEndpoint()` function determines which endpoints need userId in cache keys, with a safe default that treats any `/api/` endpoint as user-specific unless explicitly marked as public (like `/api/memes`, `/api/moviecons`, `/api/gifs`).

**Logout Cache Clearing**: The logout flow (`settings.tsx`) properly awaits all async cache clearing operations via `cleanupEnterpriseServices()` before redirecting, ensuring no stale data persists across sessions.

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without external sharing or notifications to the original author.

### Sports Preferences System (December 2025)
Users can select unlimited teams per sport to follow. Live scores for followed teams appear on the headlines feed.

**Technical Implementation:**
- ESPN API integration for team data and live scores (`server/espnService.ts`)
- College sports (CFB, CBB) use increased API limit (400 teams) to include all FBS/Division I teams
- Sports updates query uses `skipCache: true` to bypass enhanced cache for immediate updates
- Preference changes trigger `refetchQueries` (not just `invalidateQueries`) for instant headline updates
- Cache invalidation pattern: `enhancedCache.removeByPattern('/api/sports/')` + query invalidation

### Highlighted Posts (December 2025)
Users can highlight posts with a "fire" effect:
- Pulsating red-orange border animation (`fire-border` class in `index.css`)
- Yellow/amber background gradient for visibility
- CSS keyframes animation cycles through #ff4500 (red) → #ff8c00 (orange) → #ffa500 (amber)
- 1.5-second animation loop with multi-layered glow effect

### Profile Border System (December 2025)
Profile borders are earned through login streaks, referrals, and sports team follows. The system includes:

**Border Types:**
- Streak borders: 3, 7, 30, 90, 180, 365, 730, 1000-day milestones (8 tiers: Bronze → Ultimate)
- Referral borders: 1, 5, 10, 25, 50 successful referral milestones (5 tiers)
- Sports team borders: Awarded when users follow specific teams via `user_sports_preferences` table
- Marketplace borders: Purchasable with Kliq Koins

**Self-Healing Award System:**
- `processLogin()` uses >= comparisons instead of === to award any missed streak borders
- Auto-reconciliation runs on server startup via `reconcileAllUsersWithStreaks()` for users with 3+ day streaks
- Manual reconciliation available via `/api/kliq-koins/reconcile-borders` endpoint (admin only)

**Implementation Files:**
- `server/borderReconciliation.ts`: Core reconciliation logic for streak/referral/sports borders
- `server/seedBorders.ts`: Border catalog seeding (90 borders total)
- `server/storage.ts`: Border ownership and database interactions

## Feature Specifications
Core features include a Headlines Feed (infinite scroll, pull-to-refresh, native camera post creation), Stories, 1:1 Messaging, Kliq Koin (8-tier streak system), and a customizable Profile. Mobile-specific features include Calendar & Events, GPS Meetups, Sports Scores, Push Notifications (9 types), AI Mood Boost, Daily Content, and Live Streaming. A referral bonus system rewards users for inviting friends. Granular analytics consent is implemented for GDPR compliance.

## System Design Choices
Mobile optimizations prioritize bandwidth (paginated responses), battery efficiency (polling vs. persistent connections, background sync), and memory management. Cross-platform compatibility is addressed. Push notification infrastructure supports Firebase Cloud Messaging and Apple Push Notifications.

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL with Neon serverless driver
- **Session Store**: PostgreSQL
- **Build Tools**: Vite, ESBuild
- **Type Safety**: TypeScript

## Authentication Services
- **Replit OAuth**: OpenID Connect integration

## UI & Styling Libraries
- **Radix UI**: Unstyled, accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide Icons**: Icon library
- **shadcn/ui**: Component system

## Development Tools
- **PostCSS**: CSS processing
- **Drizzle Kit**: Database migrations
- **TanStack Query**: Server state management

## Other Integrations
- **Firebase Cloud Messaging**: Web Push Notifications, Mobile Analytics
- **Google Analytics (GA4)**: Web analytics (GDPR-compliant consent)
- **Google Gemini API**: AI-powered content generation
- **ESPN API**: Sports score data
- **Gmail SMTP**: Chatbot conversation delivery
- **Outlook**: User support and departmental email
- **SendGrid**: Transactional email delivery

# Deployment Architecture

## Split Deployment (AWS Amplify + Replit)

### Overview
- **Frontend**: Deployed on AWS Amplify at `mykliq.app`
- **Backend API**: Deployed on Replit as autoscale service at `workspace-mykliq.replit.app`
- **Database**: PostgreSQL on Neon (serverless)

### Streamlined Workflow: GitHub → AWS Amplify

1. **Make changes** in Replit development environment
2. **Test locally** using `npm run dev` workflow
3. **Push to GitHub** - Replit syncs changes to your connected GitHub repository
4. **AWS Amplify auto-deploys** - Amplify watches the GitHub repo and auto-builds/deploys frontend
5. **Backend updates** - Click Publish in Replit to deploy backend API changes

### API Configuration
The frontend automatically detects its environment:
- When on `mykliq.app` → API calls route to `https://workspace-mykliq.replit.app`
- When on Replit dev → API calls stay on same origin

File: `client/src/lib/apiConfig.ts`

### CORS Configuration
The backend allows requests from:
- `https://mykliq.app`
- `https://www.mykliq.app`
- Replit development domains
- AWS Amplify staging domain

File: `server/index.ts`

### Authentication Flow
JWT tokens support cross-domain authentication:
1. User logs in via frontend on mykliq.app
2. Backend on Replit issues JWT token
3. Token stored in localStorage (with cookie fallback for Safari)
4. Token sent in Authorization header for API requests

### Deployment Commands
- **Frontend build**: `npm run build` (Vite builds to `dist/`)
- **Backend start**: `npm run start` (runs compiled `dist/index.js`)
- **Development**: `npm run dev` (tsx for hot reload)

### Autoscale Configuration
Replit backend uses autoscale deployment:
- Scales from 0 to handle traffic automatically
- Optimized for 5000+ concurrent users
- Includes enterprise caching, circuit breakers, and request deduplication