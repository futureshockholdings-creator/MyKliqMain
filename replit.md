# Overview

MyKliq is a social media application designed for private, close-knit friend groups ("kliqs"), emphasizing intimate sharing, privacy, and extensive UI customization. Key features include hierarchical friend ranking, content filtering, and rich media sharing (photos, videos, disappearing stories, polls, live streaming). The platform aims to foster quality interactions within private circles with the ambition to evolve into an AI-powered intelligent social network.

## Recent Updates (Nov 23, 2025)
- **Referral Bonus System**: Implemented automated referral rewards - users earn 10 Kliq Koins for each friend who joins using their invite code (requires 24hr wait period + invitee's first login). Background service processes eligible bonuses hourly with atomic transaction handling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application offers extensive UI customization including global themes, dynamic switching, custom backgrounds, fonts, color schemes, and border styles. It also features a "Surprise Me" theme randomizer and adheres to WCAG accessibility standards.

## Technical Implementations
### Frontend
The web client is a React-based SPA using TypeScript, Vite, Wouter, TanStack Query, Radix UI/shadcn/ui, Tailwind CSS, and React Hook Form with Zod. The mobile application is built with React Native CLI (iOS/Android), Expo SDK 51, TypeScript, React Navigation, React Context API, and Firebase, prioritizing native performance and offline capabilities.

### Backend
The server employs a RESTful API with Express.js and TypeScript. Drizzle ORM manages PostgreSQL interactions, and PostgreSQL-backed sessions handle user authentication. Mobile API endpoints are optimized for efficient data transfer.

### API Architecture
A shared TypeScript contract system (`shared/api-contracts.ts`) ensures type safety across web and mobile platforms. API endpoints are structured as `/api/{feature}` for web and `/api/mobile/{feature}` for mobile.

### Mobile Architecture
The MyKliq mobile application utilizes React Native with Expo SDK 51 and TypeScript, featuring a 5-tab Bottom Tab Navigator, React Context (Auth Provider), TanStack Query v5, `expo-secure-store` for JWT persistence, and NativeWind for Tailwind CSS. Mobile APIs are optimized for bandwidth and battery, employing JWT authentication, media URL transformation, polling for updates, and optimistic UI.

### Database Design
PostgreSQL with Drizzle ORM stores data for users, themes, friendships, posts, comments, content filters, messages, stories, sessions, and invite codes, with performance optimized through indexing and connection pooling.

### Authentication & Authorization
Authentication uses Replit OAuth with cookie-based sessions for web and JWT tokens for mobile. Security features include password requirements, PKCE support for OAuth 2.0, 4-step password recovery, and invite codes.

**Recent Security Fixes (Nov 22-23, 2025)**:
- Fixed authentication loop: Removed hardcoded fallback user ID from theme endpoints
- All theme endpoints now require authentication via `isAuthenticated` middleware
- Logout properly destroys Express session and clears cookies
- Theme loading on frontend now conditional on authentication status
- Unauthenticated users can no longer access protected endpoints or see "generic user" data
- **Cache Clearing Fix (Nov 23)**: Implemented comprehensive cache clearing on logout to prevent cross-session data leakage. Uses predicate-based removal to clear ALL API queries from TanStack Query and `enhancedCache.clearAll()` to wipe IndexedDB. Ensures fresh data fetch on account switch with no stale data persistence.

### Social Media OAuth Integration
External OAuth connections (TikTok, Discord, Reddit, Pinterest, Twitch, YouTube) use an adaptive flow: popup windows for desktop browsers and full-page redirects for mobile browsers. This approach handles mobile browser popup blockers by detecting failed `window.open()` calls and automatically falling back to `window.location.assign()` redirects. Users connect social accounts to earn Kliq Koins (1,000 per platform, max 10 platforms).

### Content Management
The system supports a hierarchical feed filtered by friend rankings, kliq-wide content aggregation, daily horoscopes/Bible verses, AI-powered mood boosts via Google Gemini API, real-time polling, and rich media (photos, videos, YouTube URLs, Moviecons). It also includes 24-hour disappearing stories, 7-day auto-deleting incognito messaging, live streaming, GPS-based meetups, event auto-posting, and social media aggregation from 7 external platforms. Personalized real-time sports updates from ESPN are integrated.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) with Redis support, in-memory fallback, pattern-based invalidation, and LRU eviction optimizes performance. 

**Web Client Cache (EnhancedCache)**: Two-tier architecture with memory (SimpleLRU 5MB, 5min TTL) and disk (IndexedDB 15MB, 1hr TTL) storage. On logout, both tiers are completely cleared using `enhancedCache.clearAll()` and predicate-based TanStack Query removal to prevent cross-session data leakage. All queries starting with `/api/` are removed to ensure no stale data persists between user accounts.

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation for immediate consistency.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without external sharing or notifications to the original author.

## Feature Specifications
Core features include a Headlines Feed (infinite scroll, pull-to-refresh, native camera post creation), Stories (24h disappearing content), 1:1 Messaging (text, photo, video, GIF), Kliq Koin (8-tier streak system), and a customizable Profile. Mobile-specific features include Calendar & Events (CRUD, reminders, auto-posting), GPS Meetups (location-based check-ins), Sports Scores (ESPN API integration for 5 leagues), Push Notifications (device registration, 9 customizable types), AI Mood Boost (Google Gemini), Daily Content (horoscopes, Bible verses), and Live Streaming (WebRTC).

## System Design Choices
Mobile optimizations prioritize bandwidth (paginated responses), battery efficiency (polling vs. persistent connections, background sync), and memory management. Cross-platform compatibility is addressed through solutions like modal-based GIF pickers. Push notification infrastructure supports Firebase Cloud Messaging and Apple Push Notifications.

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
- **Firebase Analytics**: Mobile analytics
- **Google Gemini API**: AI-powered content generation
- **ESPN API**: Sports score data
- **SendGrid**: Email delivery