# EstateTRAQ v2

Multi-tenant estate and financial management platform for families with $25M–$100M in assets.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

**Required:**
- `DATABASE_URL` — Neon PostgreSQL connection string ([create one here](https://console.neon.tech))
- `NEXTAUTH_SECRET` — Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` — Your app URL (e.g., `http://localhost:3000`)

**Optional (for Plaid integration):**
- `PLAID_CLIENT_ID` — From [Plaid Dashboard](https://dashboard.plaid.com)
- `PLAID_SECRET` — Plaid sandbox secret key
- `PLAID_ENV` — Set to `sandbox`

### 3. Set Up Database
```bash
npm run db:setup
```

This pushes the schema to your Neon database and seeds demo data.

### 4. Run the App
```bash
npm run dev
```

### Demo Accounts

| Email | Password | Role | Access |
|-------|----------|------|--------|
| robert@woodward.demo | demo123 | Family Manager | Full access to Woodward family |
| sarah@woodward.demo | demo123 | Family Viewer | Read-only Woodward family |
| miriam@advisor.demo | demo123 | Advisor | Both Woodward and Chen families |
| david@chen.demo | demo123 | Family Manager | Full access to Chen family |

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** PostgreSQL (Neon Serverless) + Drizzle ORM
- **Auth:** NextAuth.js with credentials provider
- **Styling:** Tailwind CSS + shadcn/ui components
- **Charts:** Recharts
- **Account Aggregation:** Plaid (sandbox)

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/
│   │   ├── [familyId]/       # Family-scoped pages
│   │   │   ├── dashboard/    # Main dashboard with balance sheet
│   │   │   ├── accounts/     # Connected accounts
│   │   │   ├── holdings/     # Market investments
│   │   │   ├── real-estate/  # Property management
│   │   │   ├── documents/    # Document vault
│   │   │   ├── compliance/   # Compliance calendar
│   │   │   ├── heirs/        # Estate administration
│   │   │   └── settings/     # Family settings
│   │   └── advisor/          # Advisor cross-family dashboard
│   └── api/
│       ├── auth/             # NextAuth endpoints
│       └── plaid/            # Plaid integration
├── components/
│   ├── layout/               # Sidebar, header
│   ├── dashboard/            # Dashboard widgets
│   └── ui/                   # Reusable UI components
└── lib/
    ├── db/                   # Database schema and connection
    ├── auth/                 # Auth configuration
    ├── plaid/                # Plaid client
    └── utils.ts              # Shared utilities
```

## Replit Setup

1. Import from GitHub into a new Replit
2. The `.replit` file is pre-configured
3. Add your environment variables in Replit's Secrets tab
4. Run `npm run db:setup` in the Shell
5. Click Run

## License

Private — Plainbox Studio
