# Overview

MyKliq is a social media application designed for close-knit friend groups ("kliq"), prioritizing intimate social sharing and privacy. It offers extensive UI customization, hierarchical friend ranking, content filtering, and rich media sharing including photo/video, disappearing stories, real-time polling, and live streaming. The platform aims to redefine social networking by focusing on quality interactions within private circles, with a long-term vision to become an AI-powered intelligent social network.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
The client is a React-based Single Page Application (SPA) using TypeScript and Vite, with Wouter for routing, TanStack Query for state management, Radix UI/shadcn/ui for components, Tailwind CSS for styling, and React Hook Form with Zod for forms. The mobile application is built with React Native CLI for iOS and Android, focusing on native performance and offline capabilities, utilizing React Navigation, React Context API, and Firebase for analytics and push notifications.

## Backend
The server employs a RESTful API with Express.js and TypeScript. Drizzle ORM manages PostgreSQL database interactions, and PostgreSQL-backed sessions handle user sessions. Mobile-optimized API endpoints (`/api/mobile/*`) ensure efficient data transfer.

## Mobile Architecture
The MyKliq mobile application is built with React Native using Expo SDK 50 targeting iOS and Android for App Store deployment, focusing on native performance and seamless backend integration.

### Tech Stack
- **Framework**: React Native with Expo SDK 50, TypeScript
- **Navigation**: React Navigation v6 with 5-tab Bottom Tab Navigator (Home, Create Post, Friends, Messages, Profile) plus Stack Navigator for modals and detail screens
- **State Management**: React Context API (authentication), TanStack Query (server state)
- **Storage**: AsyncStorage for JWT token persistence
- **Media**: expo-image-picker (camera/gallery access), expo-av (video playback with native controls)
- **Analytics**: Planned (Firebase Analytics infrastructure ready)
- **Push Notifications**: Planned (FCM/APNS infrastructure ready)

### API Integration
Mobile endpoints (`/api/mobile/*`) optimized for bandwidth and battery:
- JWT authentication with AsyncStorage persistence
- Media URL transformation: Relative paths `/api/mobile/uploads/{id}` → Absolute URLs for React Native compatibility
- Real-time updates: Polling-based (5s conversations, 3s messages) vs WebSocket for battery efficiency
- Optimistic UI updates with background synchronization

### Core Features
- **Headlines Feed**: Infinite scroll, pull-to-refresh, native camera post creation
- **Stories**: 24h disappearing content with camera capture, auto-advancing viewer with progress bars
- **1:1 Messaging**: Text, photo, video, GIF support
  - Video: expo-av Video component with native controls
  - GIFs: Cross-platform Modal input (iOS/Android compatible)
  - Media pipeline: ImagePicker → FormData → Multer memory storage → mediaRegistry Map
- **Kliq Koin**: 8-tier streak system (Starter → Legend), daily check-in, visual progression
- **Profile**: Theme customization, settings, friend management

### Storage (MVP - 2 Week Demo)
In-memory backend storage for investor demo with documented migration path:
- **mediaRegistry**: Map<mediaId, {buffer, mimetype, filename}> for photos/videos
- **storyStore**: Map<userId, Story[]> with 24h auto-expiration
- **messageStore**: Map<conversationKey, Message[]> for conversations
- **Media Serving**: `/api/mobile/uploads/:mediaId` serves from memory
- **Security**: Multer 10MB limit, MIME whitelist, memory storage
- **Post-MVP**: Migration to PostgreSQL using existing Drizzle ORM tables (messages, stories, attachments)

### Media Handling
Automatic URL transformation ensures cross-platform compatibility:
- Backend returns: `/api/mobile/uploads/{mediaId}` (relative)
- Frontend transforms: `http://localhost:5000/api/mobile/uploads/{mediaId}` (absolute)
- External URLs: Giphy/Tenor URLs preserved unchanged
- Coverage: All messages, stories, media responses via `transformMediaObject()`

### Mobile Optimizations
- **Bandwidth**: Paginated responses, configurable page sizes
- **Battery**: Polling vs persistent connections, background sync
- **Memory**: Auto-cleanup of expired stories (24h), media eviction
- **Cross-Platform**: Modal-based GIF picker (replaces iOS-only Alert.prompt)
- **Video**: Native controls via expo-av for consistent playback

## Database Design
PostgreSQL with Drizzle ORM provides type-safe operations. Key tables manage users, themes, friendships (with ranking), posts, comments, content filters, messages, stories, sessions, and invite codes. Database indexing and connection pooling are implemented for performance.

## Authentication & Authorization
Authentication integrates with Replit's OAuth (OpenID Connect) using JWT tokens for mobile. Secure, cookie-based sessions are stored in PostgreSQL. The system supports automatic user creation, unique invite codes for connections, and a 4-step password recovery system based on phone, security questions, and PIN verification.

## Content Management
The application features a sophisticated content system including:
- **Hierarchical Feed**: Posts filtered by friend rankings and user-defined filters, displayed in reverse chronological order.
- **Kliq-wide Aggregation**: Displays all kliq member content in the headlines feed.
- **Daily Features**: Timezone-aware daily horoscopes and Bible verses.
- **Mood Boost System**: AI-powered (Google Gemini API) uplifting posts generated based on user mood, appearing in feeds with staggered release and priority over other content.
- **Real-time Polling**: Customizable polls with live results.
- **Media Support**: Photo, video, and YouTube URL embedding with enhanced upload system supporting diverse formats, increased file size limits (250MB for posts, 15MB for profile pictures), and improved error handling.
- **Stories**: 24-hour disappearing content.
- **Incognito Messaging (IM)**: Private messaging with 7-day auto-deletion.
- **Moviecons**: Custom video reactions.
- **Live Streaming ("Action")**: Real-time video streaming with chat.
- **Meetups**: GPS-based check-in posting.
- **Event Auto-posting**: Automatic post creation for events.
- **Social Media Aggregation**: OAuth 2.0 integration for 7 external platforms (TikTok, YouTube, Twitch, Discord, Reddit, Pinterest, LinkedIn).
- **Shared Kliq Calendar**: Kliq-specific calendars with event notes, reminders, and supportive auto-posts in the Headlines feed.
- **Sports Updates**: Personalized real-time sports scores from ESPN's API, integrated into the Headlines feed with team logos and live/final status, supporting 32 sports across 10 categories.

## UI Customization System
Extensive theming options include global themes, dynamic switching, custom backgrounds, fonts, color schemes, and border styles. A "Surprise Me" randomizer generates readable themes, and kliqs can customize their names with emojis.

## Technical Implementations
Production code is optimized with N+1 query elimination and advanced caching. The application supports profile translation across 10 languages and includes push notification infrastructure for Firebase Cloud Messaging and Apple Push Notifications.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) optimizes performance, with CacheService supporting Redis, in-memory fallback, pattern-based invalidation, and LRU eviction, optimized for high concurrency.

### Real-time Feed Updates
WebSocket-based real-time updates eliminate manual refreshes. A WebSocket server handles feed subscriptions, broadcasting new content, with frontend integration managing connections and a polling fallback. Cache invalidation ensures immediate consistency.

### Internal Post Sharing
Users can share posts within their kliq, creating a copy in the sharer's feed without external sharing, notifications to the original author, or "Shared" indicators, maintaining chronological order.

### Accessibility Compliance
The application meets WCAG accessibility requirements for dialog components, with all Radix UI DialogContent elements including DialogDescription for screen reader support, verified by runtime checks.

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL with Neon serverless driver.
- **Session Store**: PostgreSQL.
- **Build Tools**: Vite, ESBuild.
- **Type Safety**: TypeScript.

## Authentication Services
- **Replit OAuth**: OpenID Connect integration.

## UI & Styling Libraries
- **Radix UI**: Unstyled, accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **shadcn/ui**: Component system.

## Development Tools
- **PostCSS**: CSS processing.
- **Drizzle Kit**: Database migrations.
- **TanStack Query**: Server state management.

## Other Integrations
- **Firebase Analytics**: Mobile analytics.
- **Google Gemini API**: AI-powered content generation.
- **ESPN API**: Sports score data.
- **SendGrid**: Email delivery.