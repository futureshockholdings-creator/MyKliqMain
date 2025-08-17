# Overview

MyKliq is a social media application designed for close-knit friend groups, focusing on intimate social sharing within small circles called "kliq". It features hierarchical friend ranking, content filtering, extensive UI customization, and rich media sharing. Built as a full-stack web application, MyKliq emphasizes personalized user experiences through custom themes, content controls, photo/video sharing, and disappearing stories. The platform aims to provide a highly customizable and private social environment.

## Recent Changes (August 2025)
- **Real-time Polling System**: Implemented comprehensive polling feature with kliq-wide participation, real-time vote tracking, and synchronized updates across headlines feed and My Kliq page
- **Kliq-wide Content Aggregation**: Enhanced feed system to display polls, posts, events, and live streams from all kliq members with full interactive functionality
- **Live Vote Updates**: Added optimistic updates, automatic result refreshing, and cache invalidation for instant poll result synchronization
- **Event Auto-posting**: Events now automatically create posts in the kliq feed when created or updated, sharing event details (title, location, date/time, description) with all kliq members

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is a React-based Single Page Application (SPA) using TypeScript. It follows a component-based design with:
- **Framework**: React with Vite
- **Routing**: Wouter
- **State Management**: TanStack Query for server state and caching
- **UI Components**: Radix UI primitives with shadcn/ui
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
The server follows a RESTful API design using Express.js with TypeScript:
- **Framework**: Express.js
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit-integrated OAuth with session management
- **Session Storage**: PostgreSQL-backed sessions
- **API Design**: RESTful endpoints with error handling and middleware

## Database Design
PostgreSQL with Drizzle ORM provides type-safe database operations. Key tables include:
- **Users**: Core profiles with customizable fields.
- **User Themes**: Personalization settings.
- **Friendships**: Many-to-many relationships with a 1-15 ranking hierarchy.
- **Posts & Comments**: Content creation and engagement tracking.
- **Content Filters**: User-defined keyword filtering.
- **Messages & Conversations**: Direct messaging with read status.
- **Stories & Story Views**: Temporary content with view tracking.
- **Sessions**: Secure session storage.
- **used_invite_codes**: Tracks one-time invite code usage.

## Authentication & Authorization
Integrated with Replit's OAuth system for seamless authentication:
- **OAuth Flow**: Replit OpenID Connect integration.
- **Session Management**: Secure cookie-based sessions stored in PostgreSQL.
- **User Profiles**: Automatic user creation and management.
- **Invite Codes**: Unique, one-time invite codes ("KLIQ-XXXX-XXXX") for friend connections.

## Content Management
The application includes a sophisticated content system:
- **Hierarchical Feed**: Posts filtered by friend rankings and user-defined content filters.
- **Kliq-wide Content Aggregation**: All kliq member content (posts, polls, events, actions) appears in everyone's headlines feed with full interactivity.
- **Real-time Polling**: Create polls with customizable time limits, vote tracking, and live percentage-based results synchronized across all views.
- **Engagement System**: Like/unlike functionality.
- **Media Support**: Comprehensive photo, video, and YouTube URL embedding (for Bulletin posts/comments) using object storage.
- **Stories**: 24-hour disappearing content.
- **Incognito Messaging (IM)**: Private direct messaging with rich media support (GIFs, moviecons, photos, videos) and message auto-deletion.
- **Moviecons**: Custom video uploads (MP4, up to 100MB) with manual play.
- **Live Streaming ("Action")**: Real-time video streaming with chat and auto-posting to headlines when a stream starts.
- **Meetups**: Simplified GPS-based check-in posting to the Bulletin feed.
- **Event Auto-posting**: Automatically creates posts in kliq feed when events are created or updated, including formatted details like date/time, location, and description.

## UI Customization System
Extensive theming system allows deep personalization:
- **Global Theme System**: Applies changes across the entire app using CSS variables.
- **Dynamic Themes**: Real-time theme switching with CSS custom properties.
- **Background Customization**: Solid colors, gradients, and patterns.
- **Font Customization**: Multiple font family options.
- **Color Schemes**: Primary/secondary color customization.
- **"Surprise Me" Randomizer**: Generates random themes ensuring text readability and accessibility.
- **Border Styles**: Different visual styles for UI elements.

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL with Neon serverless driver.
- **Session Store**: PostgreSQL-backed session storage.
- **Build Tools**: Vite for frontend, ESBuild for backend.
- **Type Safety**: TypeScript.

## Authentication Services
- **Replit OAuth**: Integrated authentication via OpenID Connect.

## UI & Styling Libraries
- **Radix UI**: Unstyled, accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **shadcn/ui**: Component system built with Radix UI and Tailwind.

## Development Tools
- **PostCSS**: CSS processing.
- **Drizzle Kit**: Database migrations and schema management.
- **TanStack Query**: Server state management.