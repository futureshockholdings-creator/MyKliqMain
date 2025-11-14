# Overview

MyKliq is a social media application designed for close-knit friend groups ("kliq"), emphasizing intimate social sharing and privacy. It offers extensive UI customization, hierarchical friend ranking, content filtering, and rich media sharing including photo/video, disappearing stories, real-time polling, and live streaming. The platform aims to redefine social networking by focusing on quality interactions within private circles, with a long-term vision to become an AI-powered intelligent social network.

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
The MyKliq mobile application uses React Native with Expo SDK 50 and TypeScript, featuring a 5-tab Bottom Tab Navigator, React Context API and TanStack Query for state management, AsyncStorage for token persistence, and `expo-image-picker`/`expo-av` for media handling. Mobile APIs are optimized for bandwidth and battery, utilizing JWT authentication, media URL transformation, polling-based real-time updates, and optimistic UI.

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