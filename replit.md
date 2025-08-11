# Overview

MyKliq is a social media application designed for close-knit friend groups. The platform focuses on intimate social sharing within small circles called "kliq" with features like hierarchical friend ranking, content filtering, and extensive UI customization. Built as a full-stack web application, MyKliq emphasizes personalized user experiences through custom themes and content controls.

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
- **Media Support**: Extensible architecture for future media attachments

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