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

**Notification Cache Optimization (Updated Jan 2026):**
- Server-side notification cache: 10 seconds (reduced from 60s for faster alerts)
- Client-side notification polling: 15 seconds with 10-second stale time
- Cache invalidation on notification creation: When a notification is created, both "all" and type-specific caches are immediately invalidated for the recipient
- Expected alert delay: ~10-25 seconds (vs. ~90 seconds previously)

### Messaging & Notifications
**Individual Conversations:**
- Client polls every 3 seconds for new messages (staleTime: 5s)
- Notifications created on message send with cache invalidation

**Group Chats:**
- Client polls every 3 seconds for new messages (added Jan 2026 - previously no polling)
- Group messages now create notifications for ALL participants (not just the sender)
- Notifications use groupId as relatedId with type "group_chat" for proper mark-as-read behavior

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation.

### Content Moderation (Rules Reports)
An admin dashboard manages user-reported content with a workflow (OPEN → PENDING → CLOSED), statistics, filterable reports, and a review modal. Admin actions include marking as pending, dismissing, issuing warnings, removing posts, and user suspension (24 hours, 7 days, Permanent Ban).

### Social Media OAuth Integration (Updated Jan 2026)
External OAuth connections use adaptive flows for desktop (popups) and mobile (redirects). Users connect accounts to earn Kliq Koins (1,000 per platform).

**Active Platforms:**
- Discord, YouTube, Reddit, Pinterest, Twitch - Standard OAuth 2.0
- Bluesky - Uses app password authentication (not OAuth) via `/api/social/bluesky/connect`

**Coming Soon:**
- Medium, Tumblr

**Removed:**
- TikTok (complex approval process), BeReal, Locket, Substack (no public APIs)

### Push Notifications (Updated Jan 2026)
Platform-specific push notification strategies:

**iOS Safari PWA (iOS 16.4+, installed to home screen):**
- Uses native Web Push API with custom VAPID keys (not Firebase)
- Service worker: `sw-ios.js` (registered via `registerServiceWorker.ts` which detects iOS Safari)
- Client uses `VITE_VAPID_PUBLIC_KEY` for subscription
- Server uses `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` with `web-push` library
- Tokens stored as JSON with `platform: 'ios-web-push'`
- **CRITICAL:** Server must use `contentEncoding: 'aes128gcm'` in `sendNotification()` options - Safari silently rejects older `aesgcm` encoding
- **CRITICAL:** iOS Safari PWA must register `sw-ios.js` (has push handler), not `sw.js` (no push handler) - handled by `registerServiceWorker.ts`
- **iOS quirk:** `Notification.permission` reports 'default' even after user grants permission; frontend must check backend `/api/push/status` for actual registration state
- **Service worker note:** Both `sw.js` and `sw-ios.js` must skip API requests (no `respondWith`) to avoid iOS Safari fetch failures

**Android/Desktop browsers:**
- Uses Firebase Cloud Messaging (FCM)
- Service worker: `firebase-messaging-sw.js`
- Server uses Firebase Admin SDK

**Admin Broadcast System:**
- Endpoint: `/api/admin/broadcasts/:id/send`
- Auto-detects token type and routes to appropriate sender
- `server/webPushService.ts` handles iOS tokens
- `server/firebase-notifications.ts` handles FCM tokens

**AWS Amplify Rewrite Rules (required):**
- `/sw-ios.js` → `/sw-ios.js` (200)
- `/firebase-messaging-sw.js` → `/firebase-messaging-sw.js` (200)
- `/manifest.json` → `/manifest.json` (200)
- `/icons/<*>` → `/icons/<*>` (200)
- `/apple-touch-icon.png` → `/apple-touch-icon.png` (200)
- `/<*>` → `/index.html` (200) — MUST be last

**Backend Auth Note:** Use `req.user.claims.sub` for userId in PWA context.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without notifying the original author.

### Sports Preferences System (Updated Jan 2026)
Users can select unlimited teams per sport for live score updates on the headlines feed, integrating with the ESPN API.

**Team Sports** (NFL, NBA, MLB, NHL, Soccer, etc.):
- Users select specific teams to follow
- Headlines feed shows games involving those teams with scores and status

**Individual Sports** (PGA Golf, NASCAR, F1, Tennis, UFC, Boxing, etc.):
- No team selection needed - just select the sport
- Headlines feed shows tournament/race leaderboards with:
  - Event name and date
  - Status (Round 2 of 4, Lap 150/200, etc.)
  - Top 5 competitors with positions and scores
- Uses `isIndividualSport` flag in SPORTS_CONFIG to differentiate
- API returns `{ teamGames: [], individualSports: [] }` format

### Highlighted Posts
Users can highlight posts with a "fire" effect, characterized by a pulsating red-orange border animation and a yellow/amber background gradient.

### Profile Border System
Profile borders are earned through login streaks (8 tiers), referrals (5 tiers), following sports teams, and marketplace purchases (Kliq Koins). A self-healing award system ensures missed borders are retroactively applied.

### Invite Code System (Updated Jan 2026)
Invite codes can be used unlimited times (no one-time restriction). The system tracks member removals in the `kliq_removals` table:
- **First-time join**: Auto-accepted into the kliq
- **Rejoining after removal**: Creates a "pending" friendship requiring owner approval
- **Owner approval workflow**: Pending requests appear in the Kliq page under "Pending Join Requests" with approve/decline buttons
- **Clean slate on approve**: When approved, the removal record is cleared so future rejoins won't require approval again

### PWA App Icon Badging (Added Jan 2026)
The PWA displays unread notification count on the app icon when installed to the home screen:
- Uses the Badging API (`navigator.setAppBadge`/`clearAppBadge`)
- Badge updates whenever notification data changes (15-second polling with 10-second stale time)
- Gated behind authentication - only polls when user is logged in
- Badge clears on logout or when all notifications are read
- Hook: `useAppBadge` in `client/src/hooks/useAppBadge.ts`
- Note: Badge appearance (red circle with white text) is controlled by the OS, not customizable

### Peer-to-Peer Video Calling (Added Jan 2026)
Friend-to-friend video calling using PeerJS for WebRTC connections and WebSocket for call signaling:
- **Client Components**: `VideoCallService` (PeerJS management), `VideoCallProvider` (React context), `VideoCallScreen` (full-screen UI), `IncomingCallOverlay` (incoming call modal), `VideoCallButton` (initiate calls)
- **Signaling Flow**: WebSocket messages route call-initiate/accept/decline/end between users
- **ICE Servers**: STUN (Google) + TURN (OpenRelay Metered.ca) for NAT traversal behind firewalls
- **Call UI**: Minimizable video screen with mute toggle, camera flip (mobile), and end call button
- **Access Points**: Video call button in conversation header and user profile page
- **Requirements**: Both users must be online; no push notification fallback for offline users
- **Camera Permissions**: Requested on call initiation/acceptance with graceful error handling

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