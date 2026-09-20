# FitForge — Campus Fitness Dropout Prevention

> **SIH PS 26196** — Identifies at-risk students before they quit.
> Rule-based risk engine · AI-assisted nudges · Squad accountability · Adaptive goals.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | Supabase / Neon PostgreSQL via Prisma |
| Auth | Supabase SSR (magic-link) |
| AI | Gemini 1.5 Flash (server-side only) |
| Testing | Vitest |
| Deployment | Vercel (primary) · Docker (optional) |

---

## Getting Started (Local Dev)

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/fitforge.git
cd fitforge
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in the values in .env.local (see .env.example for all keys)
```

### 3. Set up the database

```bash
# Apply migrations to your Supabase database
npx prisma migrate deploy

# Seed with 50 students across 5 colleges (idempotent — safe to run twice)
npx prisma db seed
```

### 4. Run the dev server

```bash
npm run dev
# Open http://localhost:3000
```

---

## Run with Docker

> **Requirement:** Docker Desktop installed and running.

### Quick start (Supabase as DB)

This uses your Supabase database — the same one as production.

```bash
# 1. Copy your real environment variables into .env (not .env.local)
cp .env.example .env
# Edit .env and fill in your real DATABASE_URL, Supabase keys, etc.

# 2. Build and run the container
docker compose up --build

# App is now running at http://localhost:3000
```

### With the local PostgreSQL database (no Supabase needed)

Use this when you want to run everything 100% locally:

```bash
# 1. Start both the app and a local Postgres instance
docker compose --profile local-db up --build

# 2. In another terminal — run migrations against the local DB
DATABASE_URL="postgresql://fitforge:fitforge@localhost:5433/fitforge" \
  npx prisma migrate deploy

# 3. Seed the local DB
DATABASE_URL="postgresql://fitforge:fitforge@localhost:5433/fitforge" \
  npx prisma db seed
```

### Useful Docker commands

```bash
# Build image only (no run)
docker build -t fitforge:local .

# View running containers
docker ps

# Check app health
curl http://localhost:3000/api/health

# Stop everything and remove volumes
docker compose down -v
```

---

## CI/CD

### CI — GitHub Actions (runs on every push and PR to `main`)

The workflow at `.github/workflows/ci.yml` runs:

| Step | Command |
|---|---|
| Install | `npm ci` |
| Lint | `npm run lint` |
| Type check | `npx tsc --noEmit` |
| Schema check | `npx prisma validate` |
| Next.js build | `npm run build` |
| Docker smoke test | `docker build --target run` |

No real secrets are required for CI. Fake env values are used for the build step.

### CD — Vercel (automatic on every push to `main`)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → **Import Git Repository**
2. Select your `fitforge` GitHub repo
3. Vercel auto-detects Next.js — keep all defaults
4. Go to **Settings → Environment Variables** and add:

```
DATABASE_URL                  = postgresql://...?pgbouncer=true
DIRECT_URL                    = postgresql://...
NEXT_PUBLIC_SUPABASE_URL      = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY     = eyJ...
NEXT_PUBLIC_APP_URL           = https://your-app.vercel.app
GEMINI_API_KEY                = AIza...
GEMINI_MODEL                  = gemini-1.5-flash
RISK_RECOMPUTE_SECRET         = your-strong-secret
```

5. **Supabase Auth:** Add your Vercel URL to Supabase → Authentication → URL Configuration:
   ```
   https://your-app.vercel.app/auth/callback
   ```

6. Every push to `main` now automatically deploys to Vercel.

### CD — Docker image to GitHub Container Registry (on version tags only)

The workflow at `.github/workflows/cd.yml` pushes a Docker image to
`ghcr.io/<your-github-username>/fitforge` when you create a version tag:

```bash
# Tag a new release
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions builds and pushes:
#   ghcr.io/<your-username>/fitforge:v1.0.0
#   ghcr.io/<your-username>/fitforge:1.0
#   ghcr.io/<your-username>/fitforge:latest
```

No extra secrets needed — the workflow uses the built-in `GITHUB_TOKEN`.

---

## Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Production build
npm run start         # Start production server (after build)
npm run lint          # ESLint
npm test              # Vitest unit tests
npm run migrate:deploy # Run Prisma migrations (production)
npm run seed:prod      # Seed the production database (run once)
```

---

## Environment Variables

See [`.env.example`](./.env.example) for all required keys with descriptions.
**Never commit `.env` or `.env.local` to Git.**
