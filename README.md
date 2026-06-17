# Vysera — AI-Powered Video Editing Platform

Vysera is a production-ready SaaS platform for AI-powered video editing with a professional timeline editor, automated processing pipeline, render/export system, and full monetization via Stripe + Mercado Pago.

## Architecture

```
vysera/
├── frontend/          # Next.js 14 (App Router) + TypeScript + TailwindCSS
│   ├── src/
│   │   ├── app/       # Pages (landing, dashboard, admin, editor, auth)
│   │   ├── components/# UI components (shadcn/ui, editor, billing, admin)
│   │   ├── store/     # Zustand stores (auth, UI, editor)
│   │   ├── hooks/     # Custom hooks (editor, autosave, keyboard)
│   │   ├── lib/       # Utilities (supabase client, API client)
│   │   └── types/     # TypeScript definitions
│   └── public/        # Static assets
│
├── backend/           # Express + TypeScript + Prisma
│   ├── src/
│   │   ├── routes/    # API routes (auth, user, admin, upload, video, export, payment)
│   │   ├── services/  # Business logic (auth, video, payment, security)
│   │   ├── middleware/ # Auth, security, validation, audit
│   │   ├── utils/     # Helpers (JWT, encryption, password, sanitize, FFmpeg)
│   │   └── config/    # App configuration
│   ├── prisma/        # Schema + migrations + seed
│   └── uploads/       # File storage (gitignored)
│
├── docker-compose.yml # Local development with PostgreSQL + Redis
└── Dockerfile         # Multi-stage production build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, TailwindCSS, Shadcn/UI, Framer Motion, Zustand |
| Backend | Express, TypeScript, Prisma ORM, fluent-ffmpeg |
| Database | PostgreSQL (Supabase) + Redis (Upstash) |
| Auth | Supabase Auth + JWT (access + refresh tokens) |
| Payments | Stripe (primary) + Mercado Pago (Latin America) |
| Video | FFmpeg, Whisper (transcription), OpenCV (face detection) |
| AI Pipeline | Scene detection, face zoom, color grading, caption generation, audio ducking |

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- FFmpeg (`ffmpeg -version`)
- PostgreSQL 16+ (or Supabase account)
- Stripe account (for payments)
- Mercado Pago account (optional, for Latin America)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/vysera.git
cd vysera

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your values
```

### 3. Database Setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Development

```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Frontend: http://localhost:3000
Backend API: http://localhost:4000/api

### 5. Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@vysera.com | Admin@123456 |
| Pro | pro@vysera.com | User@123456 |
| Free | user@vysera.com | User@123456 |

## NPM Scripts

### Backend (`backend/`)

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript check
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database with sample data
npm run prisma:studio    # Open Prisma Studio
npm test                 # Run tests
```

### Frontend (`frontend/`)

```bash
npm run dev              # Start Next.js dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript check
npm test                 # Run tests
npm run test:e2e         # Run Playwright e2e tests
```

## API Overview

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login (returns JWT + sets HTTPOnly cookies)
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout (invalidates refresh token)

### User
- `GET /api/user/profile` — Get current user profile
- `PUT /api/user/profile` — Update profile
- `PUT /api/user/password` — Change password
- `GET /api/user/dashboard` — Dashboard stats
- `GET /api/user/projects` — List user projects
- `GET /api/user/exports` — List user exports

### Admin
- `GET /api/admin/users` — List users (paginated)
- `GET /api/admin/users/:id` — Get user details
- `PUT /api/admin/users/:id/role` — Update user role
- `DELETE /api/admin/users/:id` — Delete user
- `GET /api/admin/stats` — Platform statistics
- `GET /api/admin/payments` — Payment history (paginated)
- `GET /api/admin/logs` — Login attempt logs
- `GET /api/admin/analytics` — Analytics data
- `GET /api/admin/errors` — Security events (high/critical)
- `GET /api/admin/audit-logs` — Admin audit trail
- `GET /api/admin/financial` — Revenue data
- `GET /api/admin/subscriptions` — Subscription management

### Upload
- `POST /api/upload/video` — Upload video file
- `POST /api/upload/audio` — Upload audio file
- `POST /api/upload/image` — Upload image file
- `GET /api/upload/list` — List user uploads
- `GET /api/upload/:id` — Get upload details
- `DELETE /api/upload/:id` — Delete upload

### Video Processing
- `POST /api/video/create` — Create processing job
- `GET /api/video/job/:jobId` — Get job status + progress
- `GET /api/video/jobs` — List user jobs
- `POST /api/video/cancel/:jobId` — Cancel job
- `GET /api/video/templates` — List templates
- `GET /api/video/templates/:id` — Get template details
- `POST /api/video/preview` — Generate preview

### Export & Render
- `POST /api/exports/create` — Create export job
- `GET /api/exports` — List exports
- `GET /api/exports/stats` — Export statistics + supported configs
- `GET /api/exports/:id` — Get export details
- `GET /api/exports/:id/progress` — Export progress
- `POST /api/exports/:id/cancel` — Cancel export
- `GET /api/exports/:id/download` — Download export file
- `POST /api/exports/cleanup` — Clean up old exports
- `GET /api/render/status` — Render queue status
- `GET /api/render/job/:jobId` — Render job status

### Payments
- `POST /api/payments/create-checkout` — Stripe checkout session
- `POST /api/payments/portal` — Stripe Customer Portal
- `POST /api/payments/mp-preference` — Mercado Pago preference
- `POST /api/payments/webhook` — Stripe webhook
- `POST /api/payments/mp-webhook` — Mercado Pago webhook

### Subscriptions
- `GET /api/subscriptions` — List user subscriptions
- `GET /api/subscriptions/active` — Active subscription + plan details
- `GET /api/subscriptions/plans` — Available plans
- `GET /api/subscriptions/invoices` — User invoices

## Deployment

### Docker (recommended)

```bash
docker-compose up -d
```

### Render.com

1. Create a PostgreSQL database and get the connection string
2. Create a Web Service for the backend:
   - Build command: `cd backend && npm install && npm run build && npx prisma generate`
   - Start command: `cd backend && npx prisma migrate deploy && node dist/server.js`
3. Create a Static Site for the frontend:
   - Build command: `cd frontend && npm install && npm run build`
   - Publish directory: `frontend/.next`
4. Set all environment variables from `.env.example`

### Railway

```bash
railway login
railway init
railway up
```

### Fly.io

```bash
fly launch
fly deploy
```

## Security

- JWT access tokens (15min) + refresh tokens (7d) with HTTPOnly/Secure/SameSite cookies
- bcrypt password hashing (12 rounds)
- AES-256-GCM encryption for sensitive data
- Helmet.js with CSP headers
- Rate limiting on all routes (auth, API, upload, export)
- SQL injection prevention (input validation + Prisma query builder)
- XSS sanitization (xss library + DOMPurify)
- File upload validation (magic bytes, MIME type, double extension check)
- Path traversal protection (path.resolve + prefix check)
- Webhook HMAC signature verification (Stripe + Mercado Pago)
- Audit logging for all admin actions
- CORS with credentials restriction
- Brute force protection (login attempt tracking)
- Role-based access control (user / pro / admin)

## Plans & Features

| Feature | Free | Pro ($19/mo) | Enterprise ($49/mo) |
|---------|------|--------------|-------------------|
| Projects | 3 | Unlimited | Unlimited |
| Max Resolution | 720p | 4K | 4K |
| Watermark | Yes | No | No |
| Uploads/mo | 5 | Unlimited | Unlimited |
| AI Processing | No | Yes | Yes |
| Priority Queue | No | Yes | Yes |
| Team Members | 1 | 5 | Unlimited |
| API Access | No | No | Yes |
| White-label | No | No | Yes |

## License

Proprietary. All rights reserved.
