# Overview

MyKliq is a social media application designed for private, close-knit friend groups ("kliqs"). It emphasizes intimate sharing, user privacy, and extensive UI customization. Key features include hierarchical friend ranking, content filtering, rich media sharing (photos, videos, disappearing stories, polls, live streaming), and an advertiser onboarding system. The long-term vision is to evolve MyKliq into an AI-powered intelligent social network.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application offers extensive UI customization including themes, backgrounds, fonts, and color schemes, with a "Surprise Me" randomizer and WCAG accessibility. Policy pages maintain a forced white background for readability. The navigation bar is compact at 64px wide.

## Technical Implementations
### Frontend
The web client is a React-based SPA using TypeScript, Vite, Wouter, TanStack Query, Radix UI/shadcn/ui, and Tailwind CSS, functioning as a PWA with offline support. The mobile application utilizes React Native CLI (iOS/Android) with Expo SDK 51, TypeScript, React Navigation, React Context API, and Firebase, prioritizing native performance and offline capabilities.

### Backend
The server uses a RESTful API built with Express.js and TypeScript. Drizzle ORM manages PostgreSQL interactions, and PostgreSQL-backed sessions handle user authentication. Mobile API endpoints are optimized for efficient data transfer. A shared TypeScript contract system ensures type safety across platforms.

### Database Design
PostgreSQL with Drizzle ORM stores data for users, themes, friendships, posts, comments, content filters, messages, stories, sessions, invite codes, advertiser applications, and content moderation reports, optimized with indexing and connection pooling.

### Authentication & Authorization
Authentication uses JWT tokens for both web and mobile, supporting cross-domain deployment. JWTs are stored securely with automatic expiration validation. The system supports password requirements, PKCE, 4-step password recovery, invite codes, and a hybrid authentication model (JWT via header, cookie-based session fallback). Logout clears all caches.

### Content Management
Features include a hierarchical feed filtered by friend rankings, kliq-wide content aggregation, daily horoscopes/Bible verses, AI-powered mood boosts, real-time polling, rich media support (photos, videos, YouTube URLs, Moviecons), 24-hour disappearing stories, 3-day auto-deleting incognito messaging, live streaming, GPS-based meetups, event auto-posting, social media aggregation, personalized real-time sports updates, and an integrated camera capture. Educational posts are displayed to new users.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) with Redis support, in-memory fallback, pattern-based invalidation, and LRU eviction optimizes performance. The web client uses a two-tier `EnhancedCache` (memory and IndexedDB). Server-side caching includes specific TTLs for various content types, and client-side cache keys include the userId for isolation. Notification caches are optimized for faster alerts with 10-second server-side TTL and 15-second client-side polling, with immediate invalidation on notification creation.

### Messaging & Notifications
Individual conversations poll every 3 seconds for new messages, with notifications created on message send. Group chats also poll every 3 seconds, and group messages create notifications for all participants.

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation.

### Content Moderation
An admin dashboard manages user-reported content through a workflow (OPEN → PENDING → CLOSED), offering statistics, filterable reports, and a review modal. Admin actions include warnings, post removal, and user suspension.

### Social Media OAuth Integration
External OAuth connections use adaptive flows for desktop (popups) and mobile (redirects). Users can connect accounts like Discord, YouTube, Reddit, Pinterest, Twitch, and Bluesky (via app password) to earn Kliq Koins.

### Push Notifications
Platform-specific push notification strategies are implemented: iOS Safari PWAs (iOS 16.4+) use native Web Push API with custom VAPID keys and a dedicated service worker (`sw-ios.js`), requiring `aes128gcm` content encoding. Android/Desktop browsers use Firebase Cloud Messaging (FCM) with `firebase-messaging-sw.js`. An admin broadcast system automatically routes messages to the correct sender based on token type. AWS Amplify rewrite rules are configured to support service workers and assets.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without notifying the original author.

### Sports Preferences System
Users can select unlimited teams per sport (NFL, NBA, MLB, NHL, Soccer) for live score updates on the headlines feed. For individual sports (PGA Golf, NASCAR, F1, Tennis, UFC, Boxing), users select the sport to receive leaderboards and status updates. Integration with the ESPN API provides data.

### Highlighted Posts
Users can highlight posts with a "fire" effect, featuring a pulsating red-orange border animation and a yellow/amber background gradient.

### Profile Border System
Profile borders are earned through login streaks (8 tiers), referrals (5 tiers), following sports teams, and marketplace purchases (Kliq Koins). A self-healing award system ensures retroactive application of missed borders.

### Invite Code System
Invite codes can be used unlimited times. The system tracks member removals; a rejoining user who was previously removed will require owner approval, which clears the removal record upon approval.

### PWA App Icon Badging
The PWA displays unread notification counts on the app icon when installed to the home screen using the Badging API (`navigator.setAppBadge`/`clearAppBadge`). The badge updates on notification data changes (15-second polling) and clears on logout or when all notifications are read.

### Peer-to-Peer Video Calling
Friend-to-friend video calling uses PeerJS for WebRTC and WebSockets for call signaling. It includes client components for call management, UI, and access points in conversations and profiles. STUN (Google) and TURN (OpenRelay Metered.ca) servers are used for NAT traversal. Both users must be online.

## System Design Choices
Mobile optimizations prioritize bandwidth (paginated responses), battery efficiency, and memory management. Cross-platform compatibility is a core consideration. Push notification infrastructure supports both Firebase Cloud Messaging and Apple Push Notifications.

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
- **Google Analytics (GA4)**: Web analytics
- **Google Gemini API**: AI-powered content generation
- **ESPN API**: Sports score data
- **Gmail SMTP**: Chatbot conversation delivery
- **Outlook**: User support and departmental email
- **SendGrid**: Transactional email delivery