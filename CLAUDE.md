# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simple blog website built with a separated frontend and backend architecture:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Laravel 12 with PHP 8.2, using Sanctum for API authentication
- **Database**: SQLite (development), can be deployed with Supabase
- **Architecture**: API-first design with full separation between frontend and backend

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run lint         # Run ESLint
npm start            # Start production server
```

### Backend (Laravel)
```bash
cd backend
composer dev         # Start all services (server, queue, logs, vite)
php artisan serve    # Start development server only
php artisan test     # Run PHPUnit tests
composer test        # Run tests (alias)
php artisan migrate  # Run database migrations
```

### Root Level
The root `package.json` appears to be empty - all development should be done in the respective frontend/backend directories.

## Architecture & Key Components

### Backend Structure (Laravel)
- **Controllers**: `app/Http/Controllers/Auth/AuthController.php` and `app/Http/Controllers/Post/PostController.php`
- **Models**: `app/Models/User.php` and `app/Models/Post.php`
- **Resources**: API response formatting in `app/Http/Resources/`
- **Requests**: Form validation in `app/Http/Requests/Auth/` and `app/Http/Requests/Post/`
- **Authentication**: Laravel Sanctum for SPA authentication
- **Database**: SQLite with migrations in `database/migrations/`

### Frontend Structure (Next.js App Router)
- **App Router**: Uses Next.js 15 App Router with TypeScript
- **Components**: Organized in `components/ui/`, `components/common/`, `components/posts/`, `components/admin/`
- **Types**: Shared TypeScript types in `types/` directory
- **API Layer**: Centralized API client in `lib/api.ts` using Axios
- **Hooks**: Custom hooks in `hooks/` for auth, posts, and utilities
- **Styling**: Tailwind CSS with shadcn/ui components

### Key Features
- **Public**: Homepage with post listings, individual post pages, search functionality
- **Admin**: Authentication-protected admin dashboard for post management (CRUD operations)
- **API Endpoints**: RESTful API with separate public and admin routes

### API Architecture
- **Public Routes**: `/api/posts` (list), `/api/posts/{id}` (show)
- **Auth Routes**: `/api/login`, `/api/logout`, `/api/user`
- **Admin Routes**: `/api/admin/posts/*` (full CRUD operations)
- **Utilities**: Health check at `/api/health`, debug routes in local environment

## Development Guidelines

### From .cursorrules
This project follows comprehensive development guidelines including:
- **TypeScript**: Strict typing with Zod for runtime validation
- **Code Quality**: ESLint for frontend, Laravel Pint for backend formatting
- **Authentication**: Sanctum SPA authentication with CSRF protection
- **Testing**: PHPUnit for backend, Jest/Playwright for frontend
- **Architecture**: Clear separation of concerns, API-first design

### Security Considerations
- Sanctum authentication with CSRF protection
- Input validation through Laravel Form Requests
- SQL injection prevention via Eloquent ORM
- XSS protection through proper data handling

### Performance Notes
- Next.js Server Components for optimal performance
- Proper caching strategies
- Image optimization with Next.js Image component
- Database query optimization with Eloquent

## Important File Locations
- Backend API routes: `backend/routes/api.php`
- Frontend API client: `frontend/lib/api.ts`
- Database schema: `backend/database/migrations/`
- Component library: `frontend/components/`
- Type definitions: `frontend/types/`