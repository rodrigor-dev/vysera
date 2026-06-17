# ============================================================================
# VYSERA PLATFORM - Dockerfile (multi-stage build)
# ============================================================================

# --- Base ---
FROM node:20-alpine AS base
RUN apk add --no-cache ffmpeg python3 make g++
WORKDIR /app

# --- Backend Dependencies ---
FROM base AS backend-deps
COPY backend/package*.json backend/
RUN cd backend && npm ci --only=production

# --- Backend Build ---
FROM base AS backend-build
COPY backend/package*.json backend/
COPY backend/tsconfig.json backend/
COPY backend/prisma/ backend/prisma/
COPY backend/src/ backend/src/
RUN cd backend && npm ci && npx prisma generate && npm run build

# --- Frontend Dependencies ---
FROM base AS frontend-deps
COPY frontend/package*.json frontend/
RUN cd frontend && npm ci --only=production

# --- Frontend Build ---
FROM base AS frontend-build
COPY frontend/package*.json frontend/
COPY frontend/next.config.js frontend/
COPY frontend/tsconfig.json frontend/
COPY frontend/tailwind.config.ts frontend/
COPY frontend/postcss.config.js frontend/
COPY frontend/public/ frontend/public/
COPY frontend/src/ frontend/src/
RUN cd frontend && npm ci && npm run build

# --- Production ---
FROM node:20-alpine AS production
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=backend-build /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/package.json ./backend/
COPY --from=backend-build /app/backend/prisma ./backend/prisma

COPY --from=frontend-build /app/frontend/.next ./frontend/.next
COPY --from=frontend-build /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-build /app/frontend/package.json ./frontend/
COPY --from=frontend-build /app/frontend/public ./frontend/public
COPY --from=frontend-build /app/frontend/next.config.js ./frontend/

EXPOSE 4000 3000

CMD ["sh", "-c", "cd backend && npx prisma migrate deploy && node dist/server.js & cd frontend && npm start"]
