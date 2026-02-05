# SPAC OS - Claude Project Context

## Overview
SPAC OS is an enterprise deal management platform for tracking SPACs (Special Purpose Acquisition Companies), built for Di Rezze Family Office.

## Tech Stack
- **Framework:** Next.js 14.1.0 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL via Supabase + Prisma ORM
- **Auth:** Clerk
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** Zustand + TanStack React Query v4
- **API:** tRPC
- **AI:** Anthropic Claude API

## Project Structure
```
spac-os-app/
├── src/
│   ├── app/           # Next.js App Router pages
│   ├── components/    # React components (ui/, forms/, layout/)
│   ├── lib/           # Utilities, API clients, Prisma
│   ├── hooks/         # Custom React hooks
│   ├── server/        # tRPC routers, server-side logic
│   ├── schemas/       # Zod validation schemas
│   ├── types/         # TypeScript type definitions
│   └── middleware.ts  # Clerk auth middleware
├── prisma/
│   └── schema.prisma  # Database schema
├── e2e/               # Playwright E2E tests
└── public/            # Static assets
```

## Key Commands
```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run lint             # ESLint check
npm run type-check       # TypeScript check

# Database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema to DB
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Jest unit tests
npm run test:e2e         # Playwright E2E tests
```

## Important Notes

### Dependencies
- Uses `--legacy-peer-deps` for npm installs (see `.npmrc`)
- React Query is pinned to v4.43.0 (tRPC compatibility)

### Environment Variables
Required in `.env.local`:
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `RESEND_API_KEY`

### Database Schema
Core models in Prisma:
- `User` - Clerk-synced users
- `Spac` - SPAC entities with lifecycle tracking
- `Organization` - PE firms, IBs, and other ecosystem entities (Sprint 10)
- `OwnershipStake` - PE portfolio ownership tracking (Sprint 10)
- `Contact` - CRM contacts with organization links
- `Company` - CRM companies
- `Document` - Uploaded files and analysis
- `ActivityFeed` - Unified activity timeline (Sprint 10)
- `Filing` - SEC filings with workflow and review tracking

### Deployment
- **Vercel** - Auto-deploys from `main` branch
- Preview URL: https://spac-os-dfo1.vercel.app
- Build command: `prisma generate && next build`

## Current Sprint Status
- ✅ Sprints 1-10: Complete (Foundation through PE Firm Management)
- 🔄 Sprint 11: Upcoming (IB Firm Management, Mandate Tracking)

### Sprint 10 Routes (PE Firm Management)
- `/organizations` - PE firms, IBs, and ecosystem entities list
- `/organizations/[id]` - Organization detail with Portfolio, Contacts, Activity tabs
- `/companies` - CRM companies list
- `/companies/[id]` - Company detail with Contacts, Deal History tabs

## Credentials
See `.credentials/SPAC_OS_CREDENTIALS.md` for all API keys and service configs (DO NOT commit to git).

## Git Workflow
- `main` - Production branch
- `develop` - Integration branch
- `feature/*` - Feature branches (PR to develop)

## Agent Strategy
- Always use subagents for exploration and research before implementation
- Parallelize independent tasks using multiple subagents
- Use Explore subagents to investigate the codebase before making changes
- Use Task subagents for independent implementation work that can run in parallel
- Minimum 4 subagents for any multi-file change, scale up to 10 for complex tasks
