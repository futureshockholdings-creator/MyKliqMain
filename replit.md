# Overview

MyKliq is a social media application designed for close-knit friend groups. The platform focuses on intimate social sharing within small circles called "kliq" with features like hierarchical friend ranking, content filtering, extensive UI customization, and rich media sharing. Built as a full-stack web application, MyKliq emphasizes personalized user experiences through custom themes, content controls, photo/video sharing, and disappearing stories.

## Recent Changes (August 2025)
- **Media Sharing System**: Complete implementation of photo and video upload functionality using Replit's cloud object storage
- **Stories Feature**: 24-hour disappearing stories with media support and view tracking
- **Object Storage Integration**: Configured Replit object storage with proper bucket setup and presigned URL generation
- **Enhanced Feed**: Posts now support text, images, and videos with proper media display and responsive design
- **Incognito Messaging (IM)**: Direct messaging system for kliq members with conversation management, real-time messaging, and read status tracking
- **Events Timing Synchronization Fix**: Resolved timezone handling between datetime-local input and server storage to ensure countdown timers display accurate time remaining (August 14, 2025)
- **Action Live Streaming Feature**: Complete implementation of live streaming feature called "Action" with real-time chat, viewer management, WebSocket support, and camera controls (August 14, 2025)
- **Navigation Update**: Changed "Feed" to "Bulletin" in main navigation (August 14, 2025)
- **Simplified Location Check-in**: Converted complex meetup system to simple GPS-based check-in that posts location to bulletin feed (August 14, 2025)
- **Enhanced Music Profile System**: Comprehensive upgrade with M4P file support, enhanced DRM detection, client-side audio conversion for non-DRM files, detailed conversion guidance, and interactive user education hub with step-by-step tutorials (August 14, 2025)
- **Streaming Service Integration Removal**: Removed external streaming service integration per user request to focus on local music profile functionality only (August 14, 2025)
- **URL-Based Profile Music System**: Enhanced music system to accept YouTube links and web audio URLs through copy-paste functionality, supporting both local file uploads and web URL input methods (August 14, 2025)
- **Unified Profile Management System**: Merged profile details and profile settings into a single cohesive interface with tabbed organization, supporting basic information (bio, phone, kliq name, birthdate) and extended details (interests, favorites, lifestyle, entertainment preferences) all in one place (August 14, 2025)
- **Global Theme System with Background Customization**: Implemented comprehensive theme system that applies changes across entire app with support for background customization including solid colors, gradients, and patterns (dots, lines, waves, geometric) (August 14, 2025)
- **Complete Theme Consistency**: Eliminated all hardcoded colors across the entire application - posts, profiles, comments, forms, media uploads, filters, music uploader components, and all UI components now follow the global theme system using CSS variables (bg-card, text-foreground, border-border, primary, secondary, destructive, etc.) ensuring complete visual consistency (August 14, 2025)
- **Auto-Loop Music Player**: Enhanced ProfileMusicPlayer to automatically play and loop music without requiring user interaction - both audio files and YouTube videos now start playing immediately when profiles are viewed and loop continuously for seamless music experience (August 14, 2025)
- **IM Message Auto-Deletion Bug Fix**: Fixed critical bug in Incognito Messages system where messages persisted for 18+ hours instead of auto-deleting 3 minutes after being read - improved markConversationAsRead function to properly associate messages with conversations and set expiration timestamps, verified cleanup mechanism runs every 5 minutes and successfully deletes expired messages (August 14, 2025)
- **Complete Notification Badge System**: Successfully implemented comprehensive in-app notification system with category-specific badge indicators and total alert count display across navigation taskbar - badges appear on IM, Events, and My Kliq icons showing individual counts, main Alerts bell displays total sum of all unread notifications, mark-all-read functionality working properly after fixing Express route ordering conflict (August 15, 2025)
- **Meetup Integration into Bulletin**: Completely consolidated meetup functionality into main bulletin feed - removed separate meetup page from navigation, added red map pin location button next to video/camera icons, meetup dialog titled "Add Meetup Details" encourages friends to join, location posts appear directly in bulletin as "📍 Checked in at [location]" entries (August 15, 2025)
- **Expanded GIF Database**: Massive expansion of GIF collection with 79+ new GIFs across comprehensive categories including fun, disapproval, surprise, yes/no responses, gratitude, birthday, congratulations, anniversary, and all major holidays (Christmas, Halloween, Thanksgiving, New Year, Valentine's Day, Easter, Fourth of July) - provides rich expression options for social interactions (August 15, 2025)
- **Holiday GIF Display Fix**: Resolved persistent "content not available" issue affecting holiday-themed GIFs by replacing HTML img elements with CSS background images and updating problematic holiday GIF URLs (Santa Claus, Christmas Tree, Pumpkin, Ghost, Turkey, Valentine Hearts, Easter Bunny, Fireworks) with working alternatives, ensuring clean display across all GIF categories (August 15, 2025)
- **Enhanced Friend Removal System**: Implemented intuitive hold-to-remove gesture for friend management with 800ms hold timer, vibration feedback on mobile devices, visual animations (pulse during hold, bounce when X appears), navigation blocking during removal mode, and confirmation dialog requiring explicit consent before removing friends from kliq pyramid (August 16, 2025)
- **Unique One-Time Invite Codes**: Completely revamped invite code system with original "KLIQ-XXXX-XXXX" alphanumeric format but enhanced with one-time usage tracking through dedicated used_invite_codes table, automatic code invalidation after use, and prevention of duplicate usage ensuring each invite code can only create one friendship connection (August 16, 2025)
- **Custom Moviecon Upload System**: Implemented comprehensive moviecon management system allowing upload of custom video files from user's computer - cleared all existing demo moviecons, created MovieconUploader component with 50MB file size limit, integrated with Replit object storage for cloud hosting, built dedicated moviecon manager page at /moviecon-manager, includes real-time video preview with playback controls and delete functionality, connects seamlessly to existing moviecon picker system (August 16, 2025)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses a React-based Single Page Application (SPA) with TypeScript and modern tooling. The architecture follows component-based design patterns with proper separation of concerns:

- **Framework**: React with Vite for development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming support
- **Form Handling**: React Hook Form with Zod validation

## Backend Architecture
The server follows a RESTful API design using Express.js with TypeScript:

- **Framework**: Express.js with TypeScript support
- **Database Layer**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit-integrated OAuth with session management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with proper error handling and middleware

## Database Design
PostgreSQL database with Drizzle ORM providing type-safe database operations:

- **Users Table**: Core user profiles with customizable fields (bio, phone, invite codes)
- **User Themes**: Personalization settings (colors, fonts, UI preferences)
- **Friendships**: Many-to-many relationships with ranking system (1-15 hierarchy)
- **Posts & Comments**: Content creation with author relationships and engagement tracking
- **Content Filters**: User-defined keyword filtering for feed customization
- **Messages & Conversations**: Direct messaging system with conversation management and read status
- **Stories & Story Views**: Temporary content sharing with view tracking
- **Sessions**: Secure session storage for authentication

## Authentication & Authorization
Integrated with Replit's OAuth system providing seamless authentication:

- **OAuth Flow**: Replit OpenID Connect integration
- **Session Management**: Secure cookie-based sessions with PostgreSQL storage
- **User Profiles**: Automatic user creation and profile management
- **Phone Verification**: MVP phone verification system with mock codes

## Content Management
The application implements a sophisticated content system:

- **Hierarchical Feed**: Posts filtered by friend rankings and content filters
- **Engagement System**: Like/unlike functionality with real-time updates
- **Content Filtering**: User-defined keyword filters for personalized feeds
- **Media Support**: Complete media upload and sharing system using object storage
- **Stories**: 24-hour disappearing content with media support and view tracking
- **Incognito Messaging**: Private direct messaging between kliq members with conversation management

## UI Customization System
Extensive theming system allowing deep personalization:

- **Dynamic Themes**: Real-time theme switching with CSS custom properties
- **Font Customization**: Multiple font family options (Comic, Serif, Mono)
- **Color Schemes**: Primary/secondary color customization with live preview
- **Navigation Styling**: Customizable navigation appearance and behavior
- **Border Styles**: Different visual styles (retro, modern) for UI elements

# External Dependencies

## Core Infrastructure
- **Database**: PostgreSQL with Neon serverless driver for scalable database operations
- **Session Store**: PostgreSQL-backed session storage for authentication persistence
- **Build Tools**: Vite for fast development and optimized production builds
- **TypeScript**: Full-stack type safety and development experience

## Authentication Services
- **Replit OAuth**: Integrated authentication using Replit's OpenID Connect system
- **Session Management**: Express-session with PostgreSQL store for secure session handling

## UI & Styling Libraries
- **Radix UI**: Unstyled, accessible UI primitives for complex components
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide Icons**: Modern icon library for consistent visual elements
- **shadcn/ui**: Pre-built component system with Radix UI and Tailwind integration

## Development Tools
- **ESBuild**: Fast JavaScript/TypeScript bundler for server-side code
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer
- **Drizzle Kit**: Database migrations and schema management
- **TanStack Query**: Server state management with caching and synchronization