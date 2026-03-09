# EstateTraq V2

A family wealth management and real estate tracking platform built with Next.js, Drizzle ORM, and PostgreSQL.

## Architecture

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth.js v4 with credentials provider (JWT sessions)
- **Database**: PostgreSQL via Drizzle ORM (uses Replit's built-in PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI components)
- **Charts**: Recharts

## Project Structure

```
src/
  app/           # Next.js App Router pages
    (auth)/      # Login page
    (dashboard)/ # Protected dashboard pages
    api/         # API routes (auth, plaid)
  components/    # Reusable UI components
  lib/
    auth/        # NextAuth configuration
    db/          # Drizzle ORM setup and schema
    plaid/       # Plaid client setup
scripts/         # Database seed and setup scripts
```

## Environment Variables

Required secrets (set in Replit Secrets):
- `DATABASE_URL` — PostgreSQL connection string (Replit built-in is pre-configured)
- `SESSION_SECRET` / `NEXTAUTH_SECRET` — JWT signing secret

Optional secrets:
- `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` — Plaid integration
- `GOOGLE_MAPS_API_KEY` — Maps feature
- `FMP_API_KEY` — Market data
- `OPENAI_API_KEY` — AI document categorization

Environment variables (non-secret):
- `NEXTAUTH_URL` — Set to `https://<REPLIT_DEV_DOMAIN>` (configured automatically)

## Replit Configuration

- Dev server runs on **port 5000** with host `0.0.0.0` (required for Replit preview)
- `allowedDevOrigins` in `next.config.js` whitelists Replit's proxied domain
- Database connection is lazy-initialized to avoid build-time crashes

## Database Setup

To initialize the database schema and seed data:
```bash
npm run setup
```

Or separately:
```bash
npm run db:push   # Push schema to database
npm run db:seed   # Seed with sample data
```
