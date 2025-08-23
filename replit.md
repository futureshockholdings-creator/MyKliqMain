# Overview

MyKliq is a social media application designed for close-knit friend groups, focusing on intimate social sharing within small circles called "kliq". It features hierarchical friend ranking, content filtering, extensive UI customization, and rich media sharing. Built as a full-stack web application, MyKliq emphasizes personalized user experiences through custom themes, content controls, photo/video sharing, and disappearing stories. The platform aims to provide a highly customizable and private social environment.

## Recent Changes (August 2025)
- **Real-time Polling System**: Implemented comprehensive polling feature with kliq-wide participation, real-time vote tracking, and synchronized updates across headlines feed and My Kliq page
- **Kliq-wide Content Aggregation**: Enhanced feed system to display polls, posts, events, and live streams from all kliq members with full interactive functionality
- **Live Vote Updates**: Added optimistic updates, automatic result refreshing, and cache invalidation for instant poll result synchronization
- **Event Auto-posting**: Events now automatically create posts in the kliq feed when created or updated, sharing event details (title, location, date/time, description) with all kliq members
- **Event Attendance Statistics**: Implemented real-time attendance tracking with detailed breakdowns (going, maybe, can't go) displayed on Events page, synchronized attendance updates across headlines feed and Events page through proper cache invalidation
- **Event Attendance Notifications**: Successfully implemented notification alerts system for event attendance updates - when users change their attendance status (going, maybe, can't go), notifications are automatically created and displayed in the alerts tab with proper badge indicators
- **Headlines Feed Optimization**: Removed event attendance UI from headlines feed - event auto-posts are now clickable links that navigate to the events page for attendance management
- **Google Analytics Integration**: Comprehensive analytics tracking system implemented with measurement ID G-Q3VCE04DVT to monitor total visits, unique visitors, bounce rate, page views, and user engagement across all pages and user interactions
- **Maintenance Dashboard**: Created comprehensive system monitoring dashboard with automated background maintenance, real-time health checks, performance metrics, database statistics, and scheduled cleanup tasks for optimal site performance. Access restricted to authorized users only via direct URL (/maintenance) for security.
- **Moviecon Search Enhancement**: Completed comprehensive moviecon search functionality across the application - both moviecon manager page (local filtering) and headlines tab moviecon picker (server-side search) now fully operational with real-time search through titles, categories, and movie sources using proper URL query parameters
- **Sponsored Ads Dynamic Text Colors**: Implemented comprehensive dynamic text color adaptation system - white text on dark backgrounds, black text on light backgrounds with automatic luminance detection across all sponsored ad displays in both main feed and ads manager
- **Profile Picture Interface Enhancement**: Replaced large profile picture upload button with clean camera icon positioned at bottom-right of profile picture circle for more intuitive and space-efficient design
- **Wallpaper Background System**: Implemented full wallpaper-style background container for profile section with dedicated camera icon for background image uploads, supporting all major image formats (JPEG, PNG, GIF, WebP, BMP, TIFF, SVG, AVIF, HEIC/HEIF) up to 15MB, with fallback gradient when no background is set - fully functional with proper object storage URL normalization for immediate display after upload
- **Kliq Name Display in Posts**: Successfully implemented kliq name display in headlines feed author attribution using "firstName lastName - kliqName" format across all content types (posts, polls, events, actions) with comprehensive database query updates to include kliqName field
- **Navigation Bar Text Correction**: Updated navigation menu label from "My Kliq's" back to "My Kliq" for proper branding consistency
- **Friend Pyramid Expansion**: Successfully upgraded friend pyramid from 15 to 28 total friends by adding two new rows (6 and 7 friends) while maintaining all existing functionality including drag-and-drop ranking, video calls, messaging, and friend removal. Tested with 25 friends across 7 rows - all features confirmed working correctly.
- **Kliq Closure Controls**: Implemented "Open Kliq"/"Close Kliq" toggle button positioned at bottom-right of pyramid component, allowing users to control new member access before reaching 28-friend maximum. Button dynamically changes between "Open Kliq" (green, when closed) and "Close Kliq" (orange, when open) with confirmation dialogs and backend validation to prevent new joins when kliq is closed.
- **Toast Auto-dismiss Enhancement**: Updated toast notification system to automatically disappear after 2.5 seconds regardless of success or failure status across all pages
- **Landing Page Friend Limit Update**: Updated friend limit display from 15 to 28 friends to reflect expanded pyramid capacity
- **Landing Page Content Updates**: Updated main heading to "Relive the Golden Age of Social Networking with Modern Features", removed duplicate footer text, and added Moviecons feature card highlighting custom video reactions and emotes
- **Multi-Language Translation System**: Implemented comprehensive internationalization (i18n) with automatic browser language detection, supporting 10 languages (English, Spanish, French, German, Portuguese, Italian, Chinese, Japanese, Korean, Arabic). Features include language selector in navigation and profile settings, automatic fallback to English, and localStorage preference saving. Navigation labels now dynamically translate based on user's selected language.
- **Meetup Check-in Display Fix**: Resolved critical bug where recent check-ins weren't appearing in headlines feed due to frontend caching issues. Implemented complete cache disabling, automatic refresh every 10 seconds, and immediate refetch after check-ins to ensure real-time display of location posts
- **User Support Chatbot**: Fully operational comprehensive knowledge-based chatbot for user support accessible via floating "HELP" button on all authenticated pages. Provides instant help with page functionality, features explanation, and general MyKliq questions without requiring AI APIs - uses built-in knowledge base covering all major app features and functionality. Complete conversation history automatically emailed to futureshockholdings@gmail.com when user closes chatbot via SendGrid integration with improved scrollable chat interface for extended discussions. Email delivery confirmed working with 2-3 minute transmission delay. Button displays "HELP" text instead of message icon for clearer user guidance.
- **Pyramid Profile Delete Cancel**: Enhanced pyramid interface with click-outside functionality to cancel profile delete actions. When holding a profile triggers the shaking animation and delete button, clicking anywhere outside the profile area now cancels the action and stops the animation, improving user experience and preventing accidental deletions.
- **Headlines Feed Cache Fix**: Resolved critical frontend caching issues that prevented new posts from displaying in headlines feed. Fixed TypeScript errors and browser cache problems, ensuring all 101+ kliq member posts display properly with realistic engagement patterns and diverse content types including photos, locations, workout updates, food posts, travel content, and YouTube links.
- **Kliq Name Removal from Posts**: Simplified author attribution in headlines feed by removing kliq name suffixes from user names. Posts now display clean "FirstName LastName" format instead of "FirstName LastName - KliqName" for improved readability and cleaner UI presentation across all content types (posts, polls, activities).
- **Rank Badge Removal**: Completely removed "#1" rank badges from all posts, polls, and activities in headlines feed for cleaner visual presentation. Author names now display without visual rank indicators, creating a more streamlined and less cluttered interface across all content types.
- **Expanded Mood System**: Enhanced mood post functionality with 21 comprehensive mood options including anxious, nostalgic, irritable, broken hearted, confused, lost, blessed, lucky, numb alongside original selections. Mood posts display with "😊 MOOD: Feeling happy" format combining emoji, MOOD prefix, and descriptive feeling text for clear emotional expression.
- **Legal Compliance Infrastructure**: Implemented comprehensive privacy policy and disclaimer system across all application pages including navigation bar pages. Created dedicated Privacy Policy and Disclaimer pages with detailed terms covering information collection, data usage policies, user rights, platform limitations, liability disclaimers, and contact information ensuring full legal compliance and user transparency.

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
- **Friendships**: Many-to-many relationships with a 1-28 ranking hierarchy.
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