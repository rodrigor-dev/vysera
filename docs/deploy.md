# Vysera Deployment Guide

## Prerequisites

- FFmpeg installed on all deployment targets
- PostgreSQL 16+ (Supabase recommended for simplicity)
- Node.js 20+ (for manual deployment)

## Environment Variables

All environment variables are documented in:
- `backend/.env.example` (32 vars)
- `frontend/.env.example` (3 vars)

### Required Production Variables

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string | Supabase / Railway |
| `JWT_SECRET` | 64+ char random string | Generate via `openssl rand -hex 64` |
| `JWT_REFRESH_SECRET` | 64+ char random string | Generate via `openssl rand -hex 64` |
| `ENCRYPTION_KEY` | Exactly 32 characters | Generate via `openssl rand -hex 16` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard |
| `CORS_ORIGIN` | Frontend URL (e.g., `https://app.vysera.com`) | Your domain |

### Stripe (for monetization)

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | `sk_live_...` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe Dashboard webhook config |
| `STRIPE_PRO_PRICE_ID` | Price ID from Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` from Stripe Dashboard |

---

## Option 1: Docker (Recommended)

### Production Build

```bash
# Build and start all services
docker compose -f docker-compose.yml up -d --build

# Check logs
docker compose logs -f
```

### Manual Docker Build

```bash
# Build backend
docker build --target backend-build -t vysera-backend .

# Build frontend
docker build --target frontend-build -t vysera-frontend .

# Run with custom env
docker run -d --env-file backend/.env -p 4000:4000 vysera-backend
docker run -d --env-file frontend/.env -p 3000:3000 vysera-frontend
```

---

## Option 2: Supabase + Render.com (Free Tier)

### Database (Supabase)

1. Create account at [supabase.com](https://supabase.com)
2. Create a new project
3. Copy the connection string (`DATABASE_URL`) from Project Settings → Database
4. Copy the anon key and URL for frontend env vars

### Backend (Render Web Service)

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repository
3. Settings:
   - **Name:** `vysera-backend`
   - **Environment:** `Node`
   - **Build Command:**
     ```bash
     cd backend && npm install && npm run build && npx prisma generate && npx prisma migrate deploy
     ```
   - **Start Command:**
     ```bash
     cd backend && node dist/server.js
     ```
4. Add all environment variables from `backend/.env.example`
5. **Important:** Render free tier sleeps after 15min of inactivity. Set a health check or use a cron job (e.g., cron-job.org) to ping every 10min.

### Frontend (Render Static Site)

1. Create a **Static Site** on Render
2. Connect your GitHub repository
3. Settings:
   - **Name:** `vysera-frontend`
   - **Build Command:**
     ```bash
     cd frontend && npm install && npm run build
     ```
   - **Publish Directory:** `frontend/.next`
   - **Build Filters:** Only build on changes to `frontend/` directory
4. Add frontend environment variables

---

## Option 3: Railway

```bash
# Install Railway CLI
npm i -g railway

# Login
railway login

# Initialize in project root
railway init

# Add PostgreSQL plugin
railway add postgres

# Deploy
railway up

# Set environment variables
railway env
```

Railway auto-detects Node.js projects and provides PostgreSQL.

---

## Option 4: Fly.io

```bash
# Install flyctl
flyctl auth login

# Launch from project root
fly launch

# Set secrets
fly secrets set JWT_SECRET=... JWT_REFRESH_SECRET=... DATABASE_URL=...

# Deploy
fly deploy
```

---

## Option 5: Manual VPS (Ubuntu 22.04)

### 1. Install Dependencies

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs ffmpeg postgresql nginx

# Verify
node --version
ffmpeg -version
```

### 2. Setup PostgreSQL

```bash
sudo -u postgres createuser vysera -P
sudo -u postgres createdb vysera -O vysera
```

### 3. Clone & Build

```bash
git clone https://github.com/your-org/vysera.git /opt/vysera
cd /opt/vysera

# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd ../frontend
npm install
npm run build
```

### 4. Configure PM2

```bash
npm install -g pm2

# Backend
pm2 start backend/dist/server.js --name vysera-backend

# Frontend
pm2 start node_modules/.bin/next --name vysera-frontend -- start -p 3000

# Save and enable on boot
pm2 save
pm2 startup
```

### 5. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name vysera.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads
    location /uploads {
        alias /opt/vysera/backend/uploads;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 6. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d vysera.com
```

---

## FFmpeg Verification

All video processing requires FFmpeg. Verify on deployment:

```bash
ffmpeg -version
ffprobe -version
```

Expected output: version 4.4+ with libx264, libx265, libvpx, libmp3lame, libaom support.

---

## Post-Deployment Checklist

- [ ] FFmpeg installed and working
- [ ] Database migrated (`npx prisma migrate deploy`)
- [ ] Database seeded (`npx prisma db seed`) with admin account
- [ ] JWT secrets set to random values (not defaults)
- [ ] Encryption key set to 32 chars
- [ ] Stripe webhook endpoint configured (`https://api.vysera.com/api/payments/webhook`)
- [ ] Mercado Pago webhook configured (if using)
- [ ] CORS origin set to your frontend domain
- [ ] Rate limiting configured for your traffic
- [ ] Upload directory exists with proper permissions
- [ ] SSL certificate installed
- [ ] Health check endpoint responding (`GET /api/health`)
- [ ] Admin can log in at `https://app.vysera.com/admin`

## Monitoring

### Health Check
Create a simple health check:

`GET /api/health`
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "ffmpeg": true,
  "database": true,
  "redis": false
}
```

### Logs
- Backend logs: PM2 logs (`pm2 logs vysera-backend`) or Docker logs
- Error tracking: Winston writes to `logs/error.log` and `logs/combined.log`
- Audit trail: All admin actions logged to `audit_logs` table

### Backup Strategy
- Database: Automated daily backups via Supabase (or `pg_dump` for self-hosted)
- Uploads: Optional S3-compatible storage (backup `./uploads/` directory)

## Production Security Checklist

- [ ] All secrets set via environment variables, never in code
- [ ] JWT secrets are long random strings (not defaults)
- [ ] Encryption key is exactly 32 characters
- [ ] CSP headers enabled in both Next.js and Express
- [ ] CORS origin restricted to your domain
- [ ] Rate limiting configured per-route
- [ ] File upload validation (magic bytes, MIME type)
- [ ] HTTPOnly + Secure + SameSite cookies
- [ ] Stripe webhook signature verification enabled
- [ ] PostgreSQL database is not publicly accessible
- [ ] Redis requires authentication (if used)
- [ ] Admin accounts use strong passwords + 2FA
