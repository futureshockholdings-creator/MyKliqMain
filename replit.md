# Overview

MyKliq is a social media application designed for close-knit friend groups ("kliq"), emphasizing intimate social sharing and privacy. It offers extensive UI customization, hierarchical friend ranking, content filtering, and rich media sharing including photo/video, disappearing stories, real-time polling, and live streaming. The platform aims to redefine social networking by focusing on quality interactions within private circles, with a long-term vision to become an AI-powered intelligent social network.

**Mobile Development Status**: 
- Backend Phase 3 Complete (109+ mobile endpoints implemented)
- React Native Phase 1 Complete (10/10 core screens with feature breadth)
- React Native Phase 2 In Progress (UX polish & advanced features)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application prioritizes extensive UI customization, including global themes, dynamic switching, custom backgrounds, fonts, color schemes, and border styles. A "Surprise Me" randomizer generates readable themes, and kliqs can customize their names with emojis. Accessibility compliance with WCAG standards is ensured for UI components.

## Technical Implementations
### Frontend
The client is a React-based Single Page Application (SPA) using TypeScript and Vite, with Wouter for routing, TanStack Query for state management, Radix UI/shadcn/ui for components, Tailwind CSS for styling, and React Hook Form with Zod for forms. The mobile application is built with React Native CLI for iOS and Android, focusing on native performance and offline capabilities, utilizing React Navigation, React Context API, and Firebase for analytics and push notifications.

### Backend
The server employs a RESTful API with Express.js and TypeScript. Drizzle ORM manages PostgreSQL database interactions, and PostgreSQL-backed sessions handle user sessions. Mobile-optimized API endpoints ensure efficient data transfer.

### API Architecture
A shared TypeScript contract system (`shared/api-contracts.ts`) defines 60+ API request and response types, ensuring type safety and consistency across web and mobile platforms. API endpoints are structured as `/api/{feature}` for web and `/api/mobile/{feature}` for mobile.

### Mobile Architecture
The MyKliq mobile application uses React Native with Expo SDK 51 and TypeScript, featuring a 5-tab Bottom Tab Navigator, React Context (Auth Provider) and TanStack Query v5 for state management, expo-secure-store for JWT token persistence, and NativeWind for Tailwind CSS styling. The foundation includes a complete API client connecting to all 107+ endpoints, core UI components (Button, Card, Input), and a theme system matching the web app's design tokens. Mobile APIs are optimized for bandwidth and battery, utilizing JWT authentication, media URL transformation, polling-based real-time updates, and optimistic UI.

### Database Design
PostgreSQL with Drizzle ORM manages users, themes, friendships, posts, comments, content filters, messages, stories, sessions, and invite codes. Performance is enhanced through indexing and connection pooling.

### Authentication & Authorization
The platform uses dual authentication: Replit OAuth with cookie-based sessions for web, and JWT tokens with 30-day expiration for mobile. Security features include password requirements, PKCE support for OAuth 2.0, 4-step password recovery, and invite codes.

### Content Management
The system features a hierarchical feed filtered by friend rankings, kliq-wide content aggregation, daily horoscopes/Bible verses, AI-powered mood boosts via Google Gemini API, real-time polling, and rich media support (photos, videos, YouTube URLs, Moviecons). It includes 24-hour disappearing stories, 7-day auto-deleting incognito messaging, live streaming, GPS-based meetups, event auto-posting, and social media aggregation with 7 external platforms. Personalized real-time sports updates from ESPN are integrated.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) with Redis support, in-memory fallback, pattern-based invalidation, and LRU eviction optimizes performance.

### Real-time Feed Updates
WebSocket-based real-time updates broadcast new content, with a polling fallback and cache invalidation for immediate consistency.

### Internal Post Sharing
Users can share posts within their kliq, creating copies in their feed without external sharing or notifications to the original author.

## Feature Specifications
Core features include a Headlines Feed (infinite scroll, pull-to-refresh, native camera post creation), Stories (24h disappearing content), 1:1 Messaging (text, photo, video, GIF support), Kliq Koin (8-tier streak system), and a customizable Profile.

### Mobile-Specific Features (Phase 3 Complete)
- **Calendar & Events**: Full CRUD with kliq-based access control, event reminders, auto-posting to feed
- **GPS Meetups**: Location-based check-ins with nearby discovery (simplified distance calculation for MVP)
- **Sports Scores**: ESPN API integration supporting 5 major leagues (NBA, NFL, MLB, NHL, MLS)
- **Push Notifications**: Device registration infrastructure ready (FCM/APNS), notification preferences management
- **AI Mood Boost**: Google Gemini-powered uplifting content with 5-hour expiration and auto-cleanup
- **Daily Content**: Timezone-aware horoscopes and Bible verses with personalized readings
- **Live Streaming**: WebRTC-based live streaming with real-time chat, viewer tracking, and creator controls

### Phase 2 Features (In Progress)
- **Theme Persistence** ✅ COMPLETE: Full theme customization with 6 presets (Purple, Ocean, Forest, Sunset, Rose, Emerald), AsyncStorage caching for offline persistence, backend sync for cross-device consistency, stale-while-revalidate pattern, optimistic UI updates, auth guards. Endpoints: GET/POST `/api/mobile/user/theme`
- **Story View Tracking** ✅ COMPLETE: Visual indicators for story view status with purple rings for unviewed stories and gray rings for viewed stories. Two-query backend approach: (1) fetches all non-expired stories, (2) fetches viewed story IDs for current user, merged via Set-based lookup. API contracts include `isViewedByCurrentUser` on StoryData and `hasUnviewedStories` on StoryGroupData. User's own stories auto-marked as viewed. HomeScreen dynamically renders ring colors based on group view status. Endpoint: GET `/api/mobile/stories`
- **Story Viewer Gestures** ✅ COMPLETE: Production-ready gesture handling with tap/long-press separation (275ms threshold), race-free navigation using pure helper functions (`getNextIndices`/`getPreviousIndices`), and precise timer pause/resume preserving progress across multiple pauses. Quick taps navigate left/right, long presses pause playback without navigation. Atomic state updates prevent boundary bugs during rapid taps.
- **Push Notifications** ✅ COMPLETE: Full push notification infrastructure with device token registration on app startup, automatic registration on login/signup, cleanup on logout. Database tables (device_tokens, notification_preferences) with 9 customizable notification types (new posts, comments, likes, messages, story replies, mentions, events, kliq koin, friends). NotificationPreferencesScreen UI accessible from ProfileScreen. Backend endpoints: POST/DELETE `/api/mobile/push/register-device`, GET/POST `/api/mobile/notifications/preferences`. Firebase Admin SDK integration (`server/firebase-notifications.ts`) with graceful degradation when FIREBASE_SERVICE_ACCOUNT not configured. Mobile service (`mobile/src/services/pushNotificationService.ts`) handles expo-notifications permissions, device tokens, and notification listeners. Integrated into AuthProvider for automatic lifecycle management.

## System Design Choices
Mobile optimizations prioritize bandwidth (paginated responses), battery (polling vs. persistent connections, background sync), and memory (auto-cleanup, media eviction). Cross-platform compatibility is ensured with solutions like modal-based GIF pickers. Push notification infrastructure is set up for Firebase Cloud Messaging and Apple Push Notifications.

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