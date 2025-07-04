# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a modern blog website built with a **Supabase Functions-centric architecture**:
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui components
- **Backend**: Supabase Functions (TypeScript/Deno) with Edge Runtime
- **Database**: Supabase PostgreSQL with real-time capabilities
- **Authentication**: Supabase Auth with JWT tokens
- **Architecture**: Serverless, edge-deployed API with full separation between frontend and backend

**Note**: This is a pure Supabase Functions architecture. Laravel components have been removed for simplicity.

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
npx supabase functions deploy api # Deploy to production
npx supabase logs            # View function logs
npx supabase db reset        # Reset local database
```

### Testing Commands
```bash
# Run all tests
./scripts/run-tests.sh

# Frontend tests only
cd frontend && npm run test && npm run test:e2e

# Single test file
npm test -- PostCard.test.tsx

# Supabase Functions testing
npx supabase functions serve  # Test locally
curl http://localhost:54321/functions/v1/api/api/health
```

### Root Level
The root `package.json` provides convenient scripts for the entire application. Main development happens in `frontend/` directory and `supabase/` directory.

## Architecture & Key Components

### Production Backend (Supabase Functions)
- **Main API**: `supabase/functions/api/index.ts` - Single TypeScript file handling all API routes
- **Authentication**: Supabase Auth with `supabase.auth.signInWithPassword()`
- **Database**: Direct Supabase PostgreSQL operations with `supabase.from('posts')`
- **Deployment**: Edge functions deployed globally via Supabase CLI
- **CORS**: Built-in CORS handling for frontend integration

### Local Development
- **Supabase Local**: Use `npx supabase start` for local development
- **Function Testing**: `npx supabase functions serve` for local API testing
- **Database**: Local PostgreSQL via Supabase CLI

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
- **Production Endpoint**: `https://[project-id].supabase.co/functions/v1/api/`
- **Next.js Middleware Proxy**: `/api/*` routes proxied to Supabase Functions via middleware
- **Modular Structure**: 認証、ポスト管理、ユーティリティが分離されたモジュール構成
- **Public Routes**: `/api/posts` (list), `/api/posts/{id}` (show)
- **Auth Routes**: `/api/login`, `/api/logout`, `/api/user` (uses Supabase Auth)
- **Admin Routes**: `/api/admin/posts/*` (full CRUD operations)
- **Utilities**: Health check at `/api/health`, debug endpoints
- **Security**: レート制限、CORS設定、JWT検証が統合

## Development Guidelines

### From .cursorrules
This project follows comprehensive development guidelines including:
- **TypeScript**: Strict typing with Zod for runtime validation
- **Code Quality**: ESLint for frontend, TypeScript strict mode for backend
- **Authentication**: Supabase Auth with JWT tokens
- **Testing**: Jest/Playwright for frontend, Supabase Functions local testing
- **Architecture**: Clear separation of concerns, API-first design

### Security Considerations
- Supabase Auth with JWT token validation
- Input validation through Zod schemas
- SQL injection prevention via Supabase client
- XSS protection through proper data handling
- CORS configuration in Edge Functions

### Performance Notes
- Next.js Server Components for optimal performance
- Proper caching strategies
- Image optimization with Next.js Image component
- Database query optimization with Supabase PostgreSQL
- Edge Functions for global low-latency API responses

## Important File Locations

### Backend (Supabase Functions)
- **Main API Handler**: `supabase/functions/api/index.ts` (routing & main handler)
- **Authentication**: `supabase/functions/api/auth-handlers.ts`
- **Post Management**: `supabase/functions/api/post-handlers.ts`
- **Utilities**: `supabase/functions/api/utils.ts` (共通関数)
- **Type Definitions**: `supabase/functions/api/types.ts`
- **Supabase Config**: `supabase/config.toml`
- **Database Schema**: `supabase/migrations/` (if using migrations)

### Frontend (Next.js)
- **API Client**: `frontend/lib/api.ts` (API通信とフォールバック戦略)
- **Middleware**: `frontend/middleware.ts` (プロキシ、セキュリティ、レート制限)
- **Vercel Config**: `frontend/vercel.json` (デプロイ設定)
- **Component Library**: `frontend/components/`
- **Type Definitions**: `frontend/types/`
- **Environment Examples**: `frontend/.env.example`

### Deployment & Configuration
- **Deploy Script**: `scripts/deploy.sh` (環境変数対応デプロイ)
- **Deployment Environment**: `.env.deploy.example` (デプロイ用環境変数テンプレート)
- **Test Script**: `scripts/run-tests.sh`

## Common Development Tasks

### Adding New Features
1. **Backend API**: Edit `supabase/functions/api/index.ts` to add new routes/logic
2. **Frontend Components**: Create in appropriate `frontend/components/` subdirectory
3. **Types**: Define TypeScript interfaces in `frontend/types/`
4. **Testing**: Add tests in `frontend/tests/` for frontend functionality
5. **Deployment**: Use `npx supabase functions deploy api` to deploy backend changes

### Database Changes
```bash
# Supabase database operations
cd supabase
npx supabase db reset              # Reset local database
npx supabase db push               # Push schema to remote
npx supabase gen types typescript  # Generate TypeScript types

# Note: Laravel backend has been replaced with Supabase Functions
# Database operations are handled through Supabase CLI
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
- **Backend**: Deploys to Supabase Functions via `npx supabase functions deploy api`
- **Database**: Managed by Supabase with automatic migrations
- **Environment variables**: Set in Vercel (frontend) and Supabase (backend functions)

### Debug and Troubleshooting
- **Production logs**: Check Supabase Functions logs in Supabase Dashboard
- **Frontend logs**: Browser devtools and Vercel deployment logs
- **Local development**: `npx supabase logs` for Supabase Functions
- **API testing**: Use `/api/health` endpoint to verify API connectivity
- **CORS issues**: Check `frontend/vercel.json` proxy configuration
- **Database issues**: Check Supabase Dashboard for connection status