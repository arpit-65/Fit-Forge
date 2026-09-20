# ─────────────────────────────────────────────────────────────────────────────
# FitForge Dockerfile — Multi-Stage Build
# Node 20 Alpine, non-root user, standalone Next.js output
#
# Stages:
#   1. deps    — install only production + dev dependencies
#   2. build   — compile Next.js + generate Prisma client
#   3. run     — minimal runtime image (~200 MB)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

# openssl is required by Prisma on Alpine (musl libc)
RUN apk add --no-cache openssl

WORKDIR /app

# Copy only lock files first so Docker can cache this layer
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install all dependencies (including dev, needed for the build stage)
RUN npm ci

# ── Stage 2: Build the app ───────────────────────────────────────────────────
FROM node:20-alpine AS build

RUN apk add --no-cache openssl

WORKDIR /app

# Bring over the installed node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma client (uses the node_modules already present)
# DATABASE_URL is not needed at build time; Prisma only needs it at runtime.
# We set a dummy value so `prisma generate` doesn't fail the build.
ENV PRISMA_GENERATE_DATAPROXY=false
RUN npx prisma generate

# Build Next.js in standalone mode (output: "standalone" in next.config.mjs)
# Pass dummy env vars so the build succeeds without real secrets.
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV DIRECT_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_PUBLIC_SUPABASE_URL="https://placeholder.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="placeholder"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"

RUN npm run build

# ── Stage 3: Minimal runtime image ───────────────────────────────────────────
FROM node:20-alpine AS run

RUN apk add --no-cache openssl

WORKDIR /app

# Set Node.js to production mode
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Tell Next.js standalone server which port to listen on
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security
# Running as root inside a container is a security risk
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Copy only what the standalone server needs to run:
#   .next/standalone  — the self-contained server (server.js + dependencies)
#   .next/static      — hashed CSS / JS assets served by Next.js
#   public            — images, frames, fonts served statically
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public          ./public

# Copy the Prisma schema so `prisma migrate deploy` can be run at startup
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check: Docker will call /api/health every 30s.
# The container is considered healthy when it returns HTTP 200.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the standalone Next.js server
CMD ["node", "server.js"]
