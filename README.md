# R.W.S Blog System

A modern blog website built with Laravel backend and Next.js frontend, designed for deployment on Supabase and Vercel.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Laravel 12 with PHP 8.2, using Sanctum for API authentication
- **Database**: PostgreSQL (Supabase in production, SQLite for local development)
- **Deployment**: Vercel (Frontend) + Supabase (Backend & Database)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PHP 8.2+
- Composer
- PostgreSQL (for production) or SQLite (for local)

### Local Development

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd RWS
   ```

2. **Backend setup:**
   ```bash
   cd backend
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate
   php artisan db:seed
   php artisan serve # Runs on http://localhost:8000
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.local
   npm run dev # Runs on http://localhost:3000
   ```

### Docker Development

```bash
docker-compose up -d
```

This starts all services:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Database: PostgreSQL on port 5432
- Email testing: http://localhost:8025

## 📁 Project Structure

```
RWS/
├── frontend/          # Next.js application
│   ├── app/          # App Router pages
│   ├── components/   # React components
│   ├── lib/          # Utilities and configurations
│   ├── types/        # TypeScript definitions
│   └── tests/        # E2E and unit tests
├── backend/          # Laravel application
│   ├── app/          # Application logic
│   ├── database/     # Migrations and seeders
│   ├── routes/       # API routes
│   └── tests/        # Backend tests
├── supabase/         # Supabase configuration
│   ├── config.toml   # Supabase settings
│   └── migrations/   # Database migrations
└── docker-compose.yml
```

## 🌐 Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```
   NEXT_PUBLIC_API_BASE_URL=https://your-supabase-project.supabase.co/functions/v1
   NEXT_PUBLIC_FRONTEND_URL=https://your-vercel-app.vercel.app
   ```
3. Deploy automatically on push to main branch

### Supabase (Backend & Database)

1. Create a new Supabase project
2. Set up the database using the migration files:
   ```bash
   supabase db push
   ```
3. Deploy Laravel as Supabase Edge Functions or use Supabase's database directly

## 🧪 Testing

### Frontend Tests
```bash
cd frontend
npm run test          # Jest unit tests
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint
```

### Backend Tests
```bash
cd backend
php artisan test      # PHPUnit tests
composer test         # Alias for testing
composer dev          # Start all services (server, queue, logs)
```

## 📝 Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
```

### Backend (.env)
```env
APP_NAME="R.W.S Blog"
APP_ENV=local
APP_KEY=base64:YOUR_APP_KEY_HERE
DB_CONNECTION=sqlite # or pgsql for Supabase
DATABASE_URL="file:database/database.sqlite"
SANCTUM_STATEFUL_DOMAINS=localhost:3000
```

## 🔧 Key Features

- **Public Blog**: Homepage with post listings and individual post pages
- **Admin Dashboard**: Authentication-protected admin panel for post management
- **API-First Design**: RESTful API with clear separation between frontend and backend
- **Authentication**: Laravel Sanctum SPA authentication with CSRF protection
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Type Safety**: Full TypeScript coverage with Zod validation
- **Testing**: Comprehensive test coverage with PHPUnit, Jest, and Playwright

## 📖 API Endpoints

### Public Routes
- `GET /api/posts` - List published posts
- `GET /api/posts/{id}` - Get specific post
- `GET /api/health` - Health check

### Authentication Routes
- `POST /api/login` - Admin login
- `POST /api/logout` - Admin logout
- `GET /api/user` - Get authenticated user

### Admin Routes (Protected)
- `GET /api/admin/posts` - List all posts (admin)
- `POST /api/admin/posts` - Create new post
- `PUT /api/admin/posts/{id}` - Update post
- `DELETE /api/admin/posts/{id}` - Delete post

## 🛡️ Security Features

- CSRF protection on all forms
- XSS protection through proper data sanitization
- SQL injection prevention via Eloquent ORM
- Rate limiting on authentication endpoints
- Secure session management
- Input validation with Laravel Form Requests and Zod schemas

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test && cd ../backend && php artisan test`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.