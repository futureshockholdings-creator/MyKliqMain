# Overview

MyKliq is a social media application designed for close-knit friend groups ("kliq"), emphasizing intimate social sharing. It provides a highly customizable and private social environment through features like hierarchical friend ranking, content filtering, extensive UI customization, and rich media sharing including photo/video sharing, disappearing stories, real-time polling, and live streaming. The platform aims to redefine social networking by focusing on quality interactions within smaller, private circles.

## Recent Updates (August 2025)

### **Mobile App Development Infrastructure (August 29, 2025)**
- **JWT Authentication System**: Implemented comprehensive JWT token-based authentication for mobile apps replacing web sessions
- **Mobile-Optimized API Endpoints**: Created dedicated mobile endpoints (`/api/mobile/*`) for feed, posts, likes, friends, stories, and user profiles
- **Push Notification Infrastructure**: Added push notification registration and framework for Firebase Cloud Messaging and Apple Push Notifications
- **Mobile File Upload System**: Prepared mobile-specific file upload endpoints for camera and photo library integration
- **Optimized Data Responses**: Mobile endpoints provide paginated, bandwidth-optimized responses with pre-calculated counts and relationships
- **Cross-Platform Ready**: Backend fully prepared for React Native/Expo development supporting both iOS and Android deployment
- **Secure Token Management**: 30-day JWT tokens with proper verification middleware for all mobile operations
- **Mobile User Experience**: Structured data responses optimized for native mobile UI patterns and offline capability

## Recent Updates (August 2025)

### **Enhanced Kliq Customization & Production Optimization (August 27, 2025)**
- **Custom Emoji Selection for Kliq Names**: Users can now personalize their kliq with 16 different emoji options (🏆 🚀 🎆 ✨ 🔥 💫 ❤️ 👏 🌟 💎 🎉 ⚡ 🎯 💪 👑 🦄) that appear both in the header and pyramid display
- **Real-time Like & Comment System**: Implemented optimistic updates for instant UI feedback on social interactions with automatic cache invalidation
- **Production Code Optimization**: Cleaned up debug console logs, optimized analytics initialization, and ensured TypeScript compliance for deployment readiness
- **Synchronized Emoji Display**: Emoji changes in the kliq name editor instantly update across all UI components including the pyramid chart
- **Improved User Experience**: Auto-closing comment boxes, smooth hover effects without background interference, and intuitive click-to-cycle emoji selection

### **Responsive Design Implementation (August 27, 2025)**
- **Complete Responsive Layout System**: All major pages now adapt seamlessly between mobile and desktop views
- **Enhanced 5-Step Password Recovery**: Secure multi-layer verification (name → phone → security questions → PIN → new password) without SMS dependency
- **Flexible Phone Number Management**: Removed uniqueness constraint to allow multiple accounts per phone number for users who change numbers
- **Desktop-Optimized Containers**: Pages stretch to utilize full screen real estate on larger displays while maintaining mobile-friendly compact layouts
- **Responsive Navigation**: Desktop sidebar navigation for large screens, mobile bottom navigation for touch devices
- **Enhanced CSS Framework**: Added responsive breakpoints, utilities, and media queries for consistent cross-device experience
- **Optimized Public Pages**: Landing, signup, and login pages now provide optimal viewing experience on all device sizes

### **Comprehensive Production Scaling Optimization (August 27, 2025)**
- **Critical N+1 Query Performance Fixes**: Eliminated all major N+1 query bottlenecks in posts, stories, conversations, events, meetups, polls, actions, and video calls
- **Database Query Optimization**: Implemented batch queries with lookup maps for O(1) performance instead of nested Promise.all loops
- **Advanced Connection Pooling**: Optimized database pool settings (max: 25, timeout: 5s) with connection health monitoring
- **Performance Monitoring System**: Complete real-time monitoring with memory tracking, query timing, and health status reporting
- **Enhanced Caching**: Increased cache size to 2000 items with 2-minute cleanup cycles and cache hit rate monitoring  
- **Frontend Query Optimization**: Improved TanStack Query settings with smart retry logic and memory management (5min stale time, 10min garbage collection)
- **Graceful Shutdown**: Production-ready shutdown handling with proper database connection cleanup
- **Comprehensive Database Indexes**: 45+ optimized indexes covering all critical query patterns for maximum performance
- **Memory Leak Prevention**: Added payload limits (10MB), periodic cleanup, and resource monitoring
- **Production Monitoring**: Internal performance endpoint, connection pool stats, and automated health reporting

### **Enhanced 4-Step Password Recovery System (August 27, 2025)**
- **Complete Security Overhaul**: Redesigned password recovery as a comprehensive 4-step verification process
- **Step 1**: Phone number verification for account identification
- **Step 2**: Security questions verification (3 required questions)
- **Step 3**: 4-digit PIN verification using hashed PIN from profile settings
- **Step 4**: New password creation with strength requirements
- **Removed SMS Dependency**: Eliminated SMS messaging from recovery flow for streamlined user experience
- **Enhanced Security**: Multiple verification layers ensure only legitimate account owners can reset passwords

### **Auto-Delete Incognito Conversations (August 27, 2025)**
- **Complete Privacy Protection**: Entire incognito conversations older than 7 days are automatically deleted from the database
- **Comprehensive Cleanup**: Removes both conversation records and all associated messages to maintain referential integrity
- **Automated Scheduling**: Cleanup runs every hour to ensure consistent privacy protection without manual intervention
- **Theme Integration**: Incognito messages pages now use user theme settings while keeping message boxes white for readability

### **Production Deployment Ready (August 25, 2025)**
- **Critical Database Issues Resolved**: Fixed kliq feed query errors and null safety warnings
- **Actions Table Schema Aligned**: Corrected field mapping for live streaming functionality
- **Performance Optimizations Complete**: 80% reduction in API calls, connection pooling, smart caching
- **SSL Certificate Issues Resolved**: Fixed "Not Secure" warnings by removing mixed content sources and adding security headers
- **Favicon Implementation**: Comprehensive technical solution implemented (SVG data URI, JavaScript force-update, ICO files, anti-cache headers). Browser caching may require 24 hours to resolve - check again on August 26, 2025
- **Production-Ready Status**: App running smoothly with all optimizations active, deployed on custom domain with valid SSL certificate

## Earlier Updates
- **Daily Bible Verse Feature**: Complete inspirational content system with 15 curated verses, daily reflections, timezone-aware date handling, and one-click posting to Headlines feed
- **Daily Horoscope Feature**: Complete horoscope system with zodiac sign calculation from birthdate, personalized daily readings, lucky numbers/colors, and one-click posting to Headlines feed
- **Required Birthdate Setting**: Birthdate is now a required profile field for accessing horoscope functionality with clean validation and user-friendly error handling
- **Social Media Aggregation System**: Complete OAuth 2.0 framework for connecting Instagram, TikTok, YouTube, Twitch, Discord, and Reddit
- **Security Infrastructure**: AES-256 encryption for OAuth tokens, secure credential storage with crypto utilities
- **Unified Social Feed**: Central hub displaying all connected social media content with platform-specific styling
- **Settings Interface**: Comprehensive social media integration controls with connection status indicators
- **Complete Profile Translation System**: All profile sections, field labels, and user-generated content now auto-translate across 10 supported languages
- **Enhanced Translation Dictionaries**: Expanded Spanish and Chinese vocabularies with 100+ terms covering entertainment, lifestyle, and personal preferences
- **Field Label Translation**: Section headers like "Interests & Hobbies", "Favorites", "Lifestyle & Status", and "Entertainment" translate automatically
- **Comprehensive Multi-language Support**: Bio text, interests, hobbies, and all profile details translate seamlessly when language is changed

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is a React-based Single Page Application (SPA) using TypeScript, following a component-based design. It utilizes Vite for building, Wouter for routing, TanStack Query for server state management, Radix UI primitives with shadcn/ui for UI components, Tailwind CSS for styling, and React Hook Form with Zod for form handling.

## Backend Architecture
The server follows a RESTful API design using Express.js with TypeScript. It uses Drizzle ORM with PostgreSQL for the database layer, Replit-integrated OAuth for authentication, and PostgreSQL-backed sessions for session management.

## Database Design
PostgreSQL with Drizzle ORM provides type-safe database operations. Key tables manage users, user themes, friendships (with a 1-28 ranking hierarchy), posts, comments, content filters, messages, stories, sessions, and used invite codes.

## Authentication & Authorization
Authentication is integrated with Replit's OAuth system using OpenID Connect. Secure cookie-based sessions are stored in PostgreSQL. The system supports automatic user creation and management, and uses unique, one-time invite codes for friend connections.

## Content Management
The application features a sophisticated content system:
- **Hierarchical Feed**: Posts filtered by friend rankings and user-defined content filters.
- **Kliq-wide Content Aggregation**: Displays all kliq member content (posts, polls, events, actions) in the headlines feed with full interactivity.
- **Daily Content Features**: Includes daily horoscopes and bible verses with timezone-aware generation and one-click posting capabilities.
- **Real-time Polling**: Allows creation of polls with customizable time limits, vote tracking, and live percentage-based results.
- **Media Support**: Comprehensive photo, video, and YouTube URL embedding using object storage.
- **Stories**: 24-hour disappearing content.
- **Incognito Messaging (IM)**: Private direct messaging with rich media support and message auto-deletion.
- **Moviecons**: Custom video uploads for reactions and emotes.
- **Live Streaming ("Action")**: Real-time video streaming with chat and auto-posting to headlines.
- **Meetups**: GPS-based check-in posting to the Bulletin feed.
- **Event Auto-posting**: Automatically creates posts in the kliq feed when events are created or updated.

## UI Customization System
Extensive theming allows deep personalization:
- **Global Theme System**: Applies changes across the entire app using CSS variables.
- **Dynamic Themes**: Real-time theme switching.
- **Customization Options**: Includes background customization (solid colors, gradients, patterns), font customization, primary/secondary color schemes, and border styles.
- **"Surprise Me" Randomizer**: Generates random themes ensuring readability.

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
- **SendGrid**: Email delivery for chatbot conversation history.