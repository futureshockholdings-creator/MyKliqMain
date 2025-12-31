# Overview

MyKliq is a social media application for private, close-knit friend groups ("kliqs"), focusing on intimate sharing, privacy, and extensive UI customization. It aims to foster quality interactions, offering features like hierarchical friend ranking, content filtering, rich media sharing (photos, videos, disappearing stories, polls, live streaming), and an advertiser onboarding system. MyKliq's ambition is to evolve into an AI-powered intelligent social network.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application features extensive UI customization (themes, backgrounds, fonts, color schemes, borders), a "Surprise Me" randomizer, and WCAG accessibility. Policy pages maintain a forced white background for readability. The navigation bar is compact (64px wide).

## Technical Implementations
### Frontend
The web client is a React-based SPA using TypeScript, Vite, Wouter, TanStack Query, Radix UI/shadcn/ui, and Tailwind CSS. It functions as a PWA with offline support. The mobile application uses React Native CLI (iOS/Android) with Expo SDK 51, TypeScript, React Navigation, React Context API, and Firebase, prioritizing native performance and offline capabilities.

### Backend
The server uses a RESTful API with Express.js and TypeScript. Drizzle ORM manages PostgreSQL interactions, and PostgreSQL-backed sessions handle user authentication. Mobile API endpoints are optimized for efficient data transfer. A shared TypeScript contract system ensures type safety across platforms.

### Database Design
PostgreSQL with Drizzle ORM stores data for users, themes, friendships, posts, comments, content filters, messages, stories, sessions, invite codes, advertiser applications, and content moderation reports. Performance is optimized with indexing and connection pooling.

### Authentication & Authorization
Authentication uses JWT tokens for both web and mobile, supporting cross-domain deployment. JWTs are stored in localStorage (web) and SecureStore (mobile), with automatic expiration validation and cleanup. The system supports password requirements, PKCE, 4-step password recovery, and invite codes. Logout processes ensure comprehensive cache clearing. Hybrid authentication (JWT via header, cookie-based session fallback) is supported.

### Content Management
Features include a hierarchical feed filtered by friend rankings, kliq-wide content aggregation, daily horoscopes/Bible verses, AI-powered mood boosts, real-time polling, rich media (photos, videos, YouTube URLs, Moviecons), 24-hour disappearing stories, 7-day auto-deleting incognito messaging, live streaming, GPS-based meetups, event auto-posting, social media aggregation, personalized real-time sports updates, and an integrated camera capture. Educational posts are displayed to new users. Moviecons use pre-generated JPEG thumbnails for fast loading.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) with Redis support, in-memory fallback, pattern-based invalidation, and LRU eviction optimizes performance. The web client uses a two-tier `EnhancedCache` (memory and IndexedDB). Server-side caching includes specific TTLs for static content, user profiles, Kliq-feed, content filters, and educational posts. Client-side cache keys include the userId for all user-specific API endpoints to ensure cross-user isolation. Logout properly clears all caches.

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation.

### Content Moderation (Rules Reports)
An admin dashboard manages user-reported content with a workflow (OPEN → PENDING → CLOSED), statistics, filterable reports, and a review modal. Admin actions include marking as pending, dismissing, issuing warnings, removing posts, and user suspension (24 hours, 7 days, Permanent Ban).

### Social Media OAuth Integration
External OAuth connections (TikTok, Discord, Reddit, Pinterest, Twitch, YouTube) use adaptive flows for desktop (popups) and mobile (redirects). Users connect accounts to earn Kliq Koins.

### Push Notifications
The platform employs platform-specific push notification strategies: native Web Push API for iOS Safari PWAs (iOS 16.4+) and Firebase Cloud Messaging (FCM) for Android/desktop browsers. An admin broadcast system sends notifications to all registered devices.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without notifying the original author.

### Sports Preferences System
Users can select unlimited teams per sport for live score updates on the headlines feed, integrating with the ESPN API.

### Highlighted Posts
Users can highlight posts with a "fire" effect, characterized by a pulsating red-orange border animation and a yellow/amber background gradient.

### Profile Border System
Profile borders are earned through login streaks (8 tiers), referrals (5 tiers), following sports teams, and marketplace purchases (Kliq Koins). A self-healing award system ensures missed borders are retroactively applied.

## System Design Choices
Mobile optimizations prioritize bandwidth (paginated responses), battery efficiency (polling vs. persistent connections), and memory management. Cross-platform compatibility is a core consideration. Push notification infrastructure supports both Firebase Cloud Messaging and Apple Push Notifications.

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