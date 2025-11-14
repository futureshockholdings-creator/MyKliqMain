# Overview

MyKliq is a social media application focused on private, close-knit friend groups ("kliqs"), emphasizing intimate sharing, privacy, and extensive UI customization. It offers features like hierarchical friend ranking, content filtering, and rich media sharing (photos, videos, disappearing stories, polls, live streaming). The platform aims to enhance quality interactions within private circles, with a long-term vision to evolve into an AI-powered intelligent social network.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## UI/UX Decisions
The application features extensive UI customization, including global themes, dynamic switching, custom backgrounds, fonts, color schemes, and border styles. It also includes a "Surprise Me" theme randomizer and accessibility compliance with WCAG standards.

## Technical Implementations
### Frontend
The web client is a React-based SPA using TypeScript, Vite, Wouter for routing, TanStack Query for state management, Radix UI/shadcn/ui for components, Tailwind CSS for styling, and React Hook Form with Zod. The mobile application uses React Native CLI (iOS/Android), Expo SDK 51, TypeScript, React Navigation, React Context API, and Firebase for analytics and push notifications, focusing on native performance and offline capabilities.

### Backend
The server uses a RESTful API with Express.js and TypeScript. Drizzle ORM manages PostgreSQL interactions, and PostgreSQL-backed sessions handle user authentication. Mobile API endpoints are optimized for efficient data transfer.

### API Architecture
A shared TypeScript contract system (`shared/api-contracts.ts`) ensures type safety across web and mobile platforms. API endpoints are structured as `/api/{feature}` for web and `/api/mobile/{feature}` for mobile.

### Mobile Architecture
The MyKliq mobile application utilizes React Native with Expo SDK 51 and TypeScript. It features a 5-tab Bottom Tab Navigator, React Context (Auth Provider), TanStack Query v5, `expo-secure-store` for JWT persistence, and NativeWind for Tailwind CSS. It includes a comprehensive API client, core UI components, and a theme system aligned with the web app. Mobile APIs are optimized for bandwidth and battery, employing JWT authentication, media URL transformation, polling for updates, and optimistic UI.

### Database Design
PostgreSQL with Drizzle ORM stores data for users, themes, friendships, posts, comments, content filters, messages, stories, sessions, and invite codes. Performance is optimized with indexing and connection pooling.

### Authentication & Authorization
Authentication uses Replit OAuth with cookie-based sessions for web and JWT tokens (30-day expiration) for mobile. Security features include password requirements, PKCE support for OAuth 2.0, 4-step password recovery, and invite codes.

### Content Management
The system supports a hierarchical feed filtered by friend rankings, kliq-wide content aggregation, daily horoscopes/Bible verses, AI-powered mood boosts via Google Gemini API, real-time polling, and rich media (photos, videos, YouTube URLs, Moviecons). It also includes 24-hour disappearing stories, 7-day auto-deleting incognito messaging, live streaming, GPS-based meetups, event auto-posting, and social media aggregation from 7 external platforms. Personalized real-time sports updates from ESPN are integrated.

### Caching Architecture
A dual-cache system (SimpleCache and CacheService) with Redis support, in-memory fallback, pattern-based invalidation, and LRU eviction optimizes performance.

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