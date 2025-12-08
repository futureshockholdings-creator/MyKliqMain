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

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without external sharing or notifications to the original author.

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