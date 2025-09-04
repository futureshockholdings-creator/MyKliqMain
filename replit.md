# Overview

MyKliq is a social media application designed for close-knit friend groups ("kliq"), focusing on intimate social sharing and privacy. It offers a highly customizable environment with features like hierarchical friend ranking, content filtering, extensive UI customization, and rich media sharing including photo/video, disappearing stories, real-time polling, and live streaming. The platform aims to redefine social networking by prioritizing quality interactions within smaller, private circles, with a vision to be an AI-powered intelligent social network.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is a React-based Single Page Application (SPA) using TypeScript, built with Vite. It uses Wouter for routing, TanStack Query for server state management, Radix UI primitives with shadcn/ui for UI components, Tailwind CSS for styling, and React Hook Form with Zod for form handling. The design emphasizes responsiveness, adapting seamlessly between mobile and desktop views.

## Backend Architecture
The server follows a RESTful API design using Express.js with TypeScript. It uses Drizzle ORM with PostgreSQL for the database layer and PostgreSQL-backed sessions for session management. Mobile-optimized API endpoints (`/api/mobile/*`) are provided for various functionalities, ensuring paginated and bandwidth-optimized responses.

## Database Design
PostgreSQL with Drizzle ORM provides type-safe database operations. Key tables manage users, user themes, friendships (with a 1-28 ranking hierarchy), posts, comments, content filters, messages, stories, sessions, and used invite codes. The system features comprehensive database indexing and connection pooling for performance.

## Authentication & Authorization
Authentication is integrated with Replit's OAuth system using OpenID Connect, utilizing JWT token-based authentication for mobile apps. Secure cookie-based sessions are stored in PostgreSQL. The system supports automatic user creation and management and uses unique, one-time invite codes for friend connections. A secure 4-step password recovery system is implemented, requiring phone, security questions, PIN, and new password using PIN-based verification instead of SMS.

## Content Management
The application features a sophisticated content system including:
- **Hierarchical Feed**: Posts filtered by friend rankings and user-defined content filters.
- **Kliq-wide Content Aggregation**: Displays all kliq member content (posts, polls, events, actions) in the headlines feed.
- **Daily Content Features**: Daily horoscopes and Bible verses with timezone-aware generation and one-click posting.
- **Real-time Polling**: Customizable polls with live results.
- **Media Support**: Photo, video, and YouTube URL embedding with object storage.
- **Stories**: 24-hour disappearing content.
- **Incognito Messaging (IM)**: Private direct messaging with message auto-deletion after 7 days.
- **Moviecons**: Custom video uploads for reactions.
- **Live Streaming ("Action")**: Real-time video streaming with chat and auto-posting.
- **Meetups**: GPS-based check-in posting.
- **Event Auto-posting**: Automatically creates posts for events.
- **Social Media Aggregation**: OAuth 2.0 framework for connecting Instagram, TikTok, YouTube, Twitch, Discord, and Reddit, displaying aggregated content in a unified feed.

## UI Customization System
Extensive theming allows deep personalization:
- **Global Theme System**: Applies changes across the entire app using CSS variables.
- **Dynamic Themes**: Real-time theme switching.
- **Customization Options**: Backgrounds (solid, gradients, patterns), fonts, primary/secondary color schemes, border styles.
- **"Surprise Me" Randomizer**: Generates random, readable themes.
- **Kliq Customization**: Custom emoji selection for kliq names.

## Technical Implementations
Production code is optimized with removal of demo modes, console logs, and mock implementations. N+1 query issues are eliminated, and advanced caching is implemented. The application supports comprehensive profile translation across 10 supported languages. Push notification infrastructure for Firebase Cloud Messaging and Apple Push Notifications is included.

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL with Neon serverless driver.
- **Session Store**: PostgreSQL-backed session storage.
- **Build Tools**: Vite (frontend), ESBuild (backend).
- **Type Safety**: TypeScript.

## Authentication Services
- **Replit OAuth**: Integrated authentication via OpenID Connect.

## UI & Styling Libraries
- **Radix UI**: Unstyled, accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **shadcn/ui**: Component system.

## Development Tools
- **PostCSS**: CSS processing.
- **Drizzle Kit**: Database migrations and schema management.
- **TanStack Query**: Server state management.

## Other Integrations
- **Firebase Analytics**: Mobile analytics framework.
- **SendGrid**: Email delivery.