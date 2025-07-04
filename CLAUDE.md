# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern blog website built with a **Supabase Functions-centric architecture**:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Supabase Functions (TypeScript/Deno) with Edge Runtime
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with JWT tokens
- **Architecture**: Serverless, edge-deployed API with full separation between frontend and backend

**Note**: Laravel components are preserved for local development but production uses Supabase Functions exclusively.

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start development server (with Turbopack)
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues automatically
npm run type-check   # TypeScript type checking
npm run test         # Run Jest unit tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:headed # Run E2E tests with browser UI
npm run test:e2e:debug # Debug E2E tests
npm start            # Start production server
```

### Backend (Supabase Functions)
```bash
# Production backend (Supabase Functions)
cd supabase
npx supabase start           # Start local Supabase
npx supabase functions serve # Serve functions locally
npx supabase functions deploy laravel-api # Deploy to production

# Local development (Laravel - optional)
cd backend
composer dev         # Start all services (server, queue, logs, vite) 
php artisan serve    # Start development server only
php artisan test     # Run PHPUnit tests
./vendor/bin/pint    # Format PHP code with Laravel Pint
```

### Testing Commands
```bash
# Run all tests
./scripts/run-tests.sh

# Backend tests only
cd backend && php artisan test

# Frontend tests only
cd frontend && npm run test && npm run test:e2e

# Single test file
php artisan test tests/Feature/PostApiTest.php
npm test -- PostCard.test.tsx
```

### Root Level
The root `package.json` contains minimal dependencies - all development should be done in the respective frontend/backend directories.

## Architecture & Key Components

### Production Backend (Supabase Functions)
- **Main API**: `supabase/functions/laravel-api/index.ts` - Single TypeScript file handling all API routes
- **Authentication**: Supabase Auth with `supabase.auth.signInWithPassword()`
- **Database**: Direct Supabase PostgreSQL operations with `supabase.from('posts')`
- **Deployment**: Edge functions deployed globally via Supabase CLI
- **CORS**: Built-in CORS handling for frontend integration

### Local Development (Laravel - Optional)
- **Models**: Simplified `app/Models/User.php` and `app/Models/Post.php` for local dev
- **Routes**: Basic health check routes in `backend/routes/api.php`
- **Database**: SQLite with migrations in `database/migrations/`
- **Note**: Production traffic bypasses Laravel entirely

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

### API Architecture (Supabase Functions)
- **Production Endpoint**: `https://[project-id].supabase.co/functions/v1/laravel-api/`
- **Vercel Proxy**: `/api/*` routes proxied to Supabase Functions via `vercel.json`
- **Public Routes**: `/api/posts` (list), `/api/posts/{id}` (show)
- **Auth Routes**: `/api/login`, `/api/logout`, `/api/user` (uses Supabase Auth)
- **Admin Routes**: `/api/admin/posts/*` (full CRUD operations)
- **Utilities**: Health check at `/api/health`, debug endpoints

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
- **Production API**: `supabase/functions/laravel-api/index.ts` (main API implementation)
- **Frontend API client**: `frontend/lib/api.ts`
- **Vercel config**: `frontend/vercel.json` (API proxy configuration)
- **Database schema**: `supabase/migrations/` (Supabase migrations)
- **Component library**: `frontend/components/`
- **Type definitions**: `frontend/types/`
- **Local dev only**: `backend/routes/api.php` (not used in production)

## Common Development Tasks

### Adding New Features
1. **Backend API**: Edit `supabase/functions/laravel-api/index.ts` to add new routes/logic
2. **Frontend Components**: Create in appropriate `frontend/components/` subdirectory
3. **Types**: Define TypeScript interfaces in `frontend/types/`
4. **Testing**: Add tests in `frontend/tests/` for frontend functionality
5. **Deployment**: Use `npx supabase functions deploy laravel-api` to deploy backend changes

### Database Changes
```bash
# Supabase database operations
cd supabase
npx supabase db reset              # Reset local database
npx supabase db push               # Push schema to remote
npx supabase gen types typescript  # Generate TypeScript types

# For local Laravel development (optional)
cd backend
php artisan migrate
php artisan migrate:fresh --seed
```

### Component Development
```bash
# shadcn/ui components are in frontend/components/ui/
# Custom components in frontend/components/common/, frontend/components/posts/, etc.
# Admin components in frontend/components/admin/
```

### API Integration
- Use `frontend/lib/api.ts` for all API calls
- All production API calls go through Vercel proxy to Supabase Functions
- API endpoints are prefixed with `/api/` and auth uses Supabase JWT tokens
- Follow existing patterns for error handling and authentication

### Deployment
- **Frontend**: Deploys to Vercel automatically via GitHub Actions
- **Backend**: Deploys to Supabase Functions via `npx supabase functions deploy laravel-api`
- **Database**: Managed by Supabase with automatic migrations
- **Environment variables**: Set in Vercel (frontend) and Supabase (backend functions)

### Debug and Troubleshooting
- **Production logs**: Check Supabase Functions logs in Supabase Dashboard
- **Frontend logs**: Browser devtools and Vercel deployment logs
- **Local development**: `npx supabase logs` for Supabase or `php artisan pail` for Laravel
- **API testing**: Use `/api/health` endpoint to verify API connectivity
- **CORS issues**: Check `frontend/vercel.json` proxy configuration
- **Database issues**: Check Supabase Dashboard for connection status