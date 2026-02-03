# SPAC OS - Product Requirements Document v3.0
## Di Rezze Family Office
### Special Purpose Acquisition Company Operating System

---

**Document Version:** 3.0
**Created:** February 1, 2026
**Last Updated:** February 1, 2026
**Status:** Active Development
**Author:** Claude AI Agent

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [Project References & File Locations](#2-project-references--file-locations)
3. [Service Credentials & Access](#3-service-credentials--access)
4. [Technology Stack](#4-technology-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [Database Schema](#6-database-schema)
7. [Feature Specifications](#7-feature-specifications)
8. [Sprint Breakdown](#8-sprint-breakdown)
9. [Development Workflow](#9-development-workflow)
10. [Testing Strategy](#10-testing-strategy)
11. [Deployment Plan](#11-deployment-plan)
12. [Appendix](#12-appendix)

---

# 1. EXECUTIVE SUMMARY

## 1.1 Project Overview

SPAC OS is a comprehensive operating system for managing Special Purpose Acquisition Companies (SPACs) throughout their entire lifecycle. Built for the Di Rezze Family Office, this platform provides end-to-end management of SPAC formation, target identification, due diligence, de-SPAC transactions, and post-merger operations.

## 1.2 Business Objectives

- Centralize all SPAC operations in a single platform
- Streamline deal flow management and target evaluation
- Ensure SEC compliance and regulatory adherence
- Enable AI-powered document analysis and deal scoring
- Provide real-time financial modeling and dilution analysis
- Integrate CRM for relationship management across deals

## 1.3 Target Users

- SPAC Sponsors and Management Teams
- Investment Analysts and Associates
- Legal and Compliance Officers
- Financial Controllers
- Board Members and Advisors

## 1.4 Success Metrics

- 50% reduction in deal evaluation time
- 100% compliance tracking coverage
- Real-time visibility into trust account status
- Automated SEC filing deadline management

---

# 2. PROJECT REFERENCES & FILE LOCATIONS

## 2.1 Critical File Paths

**⚠️ IMPORTANT: This section is the source of truth for all project file locations. Reference this when resuming after compaction.**

### Documentation Files
| File | Path | Purpose |
|------|------|---------|
| **This PRD** | `/SPAC OS/documentation/PRDs/SPAC_OS_PRD_v3.0.md` | Master requirements & reference |
| Master Project Log | `/SPAC OS/documentation/MASTER_PROJECT_LOG.md` | Session logs & model retraining |
| Previous PRDs | `/SPAC OS/SPAC_OS_PRD_v1.0.docx`, `v2.0.docx` | Historical requirements |

### Credentials & Configuration
| File | Path | Purpose |
|------|------|---------|
| Environment Variables | `/SPAC OS/spac-os-app/.env.local` | Runtime API keys |
| Credentials Reference | `/SPAC OS/.credentials/SPAC_OS_CREDENTIALS.md` | Full credentials backup |

### Application Code
| Directory | Path | Purpose |
|-----------|------|---------|
| Web Application | `/SPAC OS/spac-os-app/` | Next.js 14 web app |
| Mobile Application | `/SPAC OS/spac-os-mobile/` | React Native iOS app |
| Database Schema | `/SPAC OS/spac-os-app/prisma/schema.prisma` | Prisma ORM models |

### Project Tracking
| File | Path | Purpose |
|------|------|---------|
| Sprint Status | `/SPAC OS/.project-tracking/sprint-status.json` | Current sprint state |
| Test Results | `/SPAC OS/.project-tracking/test-results/` | E2E test outputs |

## 2.2 External Service Dashboards

| Service | Dashboard URL | Purpose |
|---------|---------------|---------|
| GitHub | https://github.com/jpd-dfo/spac-os | Source code repository |
| Supabase | https://supabase.com/dashboard/project/xliiolutjvihlwmstuii | Database & backend |
| Clerk | https://dashboard.clerk.com/apps/app_394pUWkY75EwfgaKkwYLEfKvlPx | Authentication |
| Vercel | https://vercel.com/dfo1 | Deployment |
| Anthropic | https://platform.claude.com/settings/keys | Claude AI API |
| Resend | https://resend.com/api-keys | Email service |

---

# 3. SERVICE CREDENTIALS & ACCESS

## 3.1 Service Status

| Service | Status | Identifier |
|---------|--------|------------|
| GitHub | ✅ Complete | Repository: `jpd-dfo/spac-os` |
| Supabase | ✅ Complete | Project: `SPAC-OS` (xliiolutjvihlwmstuii) |
| Clerk | ✅ Complete | App: `SPAC OS` (app_394pUWkY75EwfgaKkwYLEfKvlPx) |
| Anthropic | ✅ Complete | Key: `spac-os-api-key` |
| Resend | ✅ Complete | Key: `SPAC-OS` |
| Vercel | 🔄 Pending | Team: DFO (connect during deployment) |

## 3.2 Environment Variables

**Location:** `/SPAC OS/spac-os-app/.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xliiolutjvihlwmstuii.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_YxrjINT0771a8Q3ppg_1jw_mvJZ7RAS
SUPABASE_SERVICE_ROLE_KEY=sb_secret_YL9xpluoHdHz5yqzcbqUFA_BlEzWx2H

# Clerk (⚠️ IMPORTANT: Secret key has capital O in "siOX", NOT zero)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Z2xvcmlvdXMtamFja2FsLTgyLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_siOXaXJSwu3XztNgs8sNuqXIt8Fbn7pgo1RottqIJE

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api03-86Jp2isjHUqua90PjsiMY4ubmYSQDfRu6lioA0QwebbSAq5RGora2xzZlHEuP7Y3PZVV0nAF8Z0hV0MrZeAYMA-LMq5dwAA

# Resend
RESEND_API_KEY=re_b2oDFeH1_NryJZETcbUj1rD4juEwokTtg

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 3.3 Database Connection

```
Host: db.xliiolutjvihlwmstuii.supabase.co
Port: 5432
Database: postgres
User: postgres
```

---

# 4. TECHNOLOGY STACK

## 4.1 Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| React | 18.x | UI library |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |
| Zustand | 4.x | State management |
| React Query | 5.x | Data fetching |
| React Hook Form | 7.x | Form handling |
| Zod | 3.x | Validation |

## 4.2 Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| tRPC | 11.x | Type-safe API |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | Database (via Supabase) |
| Redis | 7.x | Caching (via Upstash) |

## 4.3 Authentication & Services

| Service | Purpose |
|---------|---------|
| Clerk | User authentication & management |
| Anthropic Claude | AI document analysis & scoring |
| Resend | Transactional email |
| Supabase | Database, storage, real-time |

## 4.4 DevOps

| Tool | Purpose |
|------|---------|
| Vercel | Deployment & hosting |
| GitHub Actions | CI/CD |
| Playwright | E2E testing |
| Jest | Unit testing |

---

# 5. ARCHITECTURE OVERVIEW

## 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SPAC OS Platform                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Web App   │  │  Mobile App │  │  Admin API  │              │
│  │  (Next.js)  │  │(React Native│  │   (tRPC)    │              │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘              │
│         │                │                │                      │
│  ┌──────┴────────────────┴────────────────┴──────┐              │
│  │                   tRPC API Layer               │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │  SPAC   │ │  Deal   │ │Document │ ...     │              │
│  │  │ Router  │ │ Router  │ │ Router  │         │              │
│  │  └─────────┘ └─────────┘ └─────────┘         │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │              Service Layer                     │              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐         │              │
│  │  │   AI    │ │Compliance│ │Financial│         │              │
│  │  │ Service │ │ Service │ │ Service │         │              │
│  │  └─────────┘ └─────────┘ └─────────┘         │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
│  ┌──────────────────────┴────────────────────────┐              │
│  │              Data Layer (Prisma)               │              │
│  └──────────────────────┬────────────────────────┘              │
│                         │                                        │
├─────────────────────────┼────────────────────────────────────────┤
│  External Services      │                                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐              │
│  │Supabase │ │  Clerk  │ │ Claude  │ │ Resend  │              │
│  │   DB    │ │  Auth   │ │   AI    │ │  Email  │              │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

## 5.2 Directory Structure

```
/SPAC OS/
├── documentation/
│   ├── MASTER_PROJECT_LOG.md
│   ├── PRDs/
│   │   └── SPAC_OS_PRD_v3.0.md (this file)
│   ├── Sprint-Plans/
│   └── Architecture/
├── .credentials/
│   └── SPAC_OS_CREDENTIALS.md
├── .project-tracking/
│   ├── sprint-status.json
│   └── test-results/
├── spac-os-app/                    # Next.js Web Application
│   ├── .env.local
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── app/                    # Next.js App Router
│   │   │   ├── (auth)/             # Auth pages
│   │   │   ├── (dashboard)/        # Protected dashboard
│   │   │   │   ├── page.tsx        # Dashboard home
│   │   │   │   ├── spacs/          # SPAC management
│   │   │   │   ├── pipeline/       # Deal pipeline
│   │   │   │   ├── documents/      # Document management
│   │   │   │   ├── filings/        # SEC filings
│   │   │   │   ├── compliance/     # Compliance tracking
│   │   │   │   ├── financial/      # Financial modeling
│   │   │   │   ├── contacts/       # CRM
│   │   │   │   └── settings/       # Settings
│   │   │   ├── api/                # API routes
│   │   │   │   ├── trpc/           # tRPC handler
│   │   │   │   └── ai/             # AI endpoints
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn components
│   │   │   ├── dashboard/
│   │   │   ├── pipeline/
│   │   │   ├── documents/
│   │   │   ├── ai/
│   │   │   └── layout/
│   │   ├── lib/
│   │   │   ├── ai/                 # Claude integration
│   │   │   ├── utils/
│   │   │   └── validators/
│   │   └── server/
│   │       ├── api/
│   │       │   ├── routers/        # tRPC routers
│   │       │   └── trpc.ts
│   │       └── db.ts
│   └── public/
└── spac-os-mobile/                 # React Native App (deferred)
```

---

# 6. DATABASE SCHEMA

## 6.1 Core Entities

### SPAC Entity
```prisma
model Spac {
  id                String   @id @default(cuid())
  name              String
  ticker            String?  @unique
  status            SpacStatus @default(SEARCHING)
  trustAmount       Decimal?
  ipoDate           DateTime?
  deadlineDate      DateTime?
  redemptionRate    Decimal?

  // Relationships
  targets           Target[]
  documents         Document[]
  filings           SecFiling[]
  financials        Financial[]
  tasks             Task[]
  contacts          ContactSpac[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum SpacStatus {
  PRE_IPO
  SEARCHING
  LOI_SIGNED
  DEFINITIVE_AGREEMENT
  VOTE_PENDING
  DE_SPAC_COMPLETE
  LIQUIDATED
}
```

### Target Entity
```prisma
model Target {
  id                String   @id @default(cuid())
  name              String
  industry          String
  status            TargetStatus @default(IDENTIFIED)
  valuation         Decimal?
  revenue           Decimal?
  ebitda            Decimal?
  aiScore           Int?

  spacId            String?
  spac              Spac?    @relation(fields: [spacId], references: [id])

  documents         Document[]
  contacts          ContactTarget[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum TargetStatus {
  IDENTIFIED
  INITIAL_OUTREACH
  NDA_SIGNED
  DUE_DILIGENCE
  LOI_SUBMITTED
  NEGOTIATION
  REJECTED
  CLOSED_WON
}
```

### Document Entity
```prisma
model Document {
  id                String   @id @default(cuid())
  name              String
  type              DocumentType
  fileUrl           String
  fileSize          Int
  mimeType          String

  // AI Analysis
  aiSummary         String?
  aiExtractedData   Json?

  spacId            String?
  spac              Spac?    @relation(fields: [spacId], references: [id])
  targetId          String?
  target            Target?  @relation(fields: [targetId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum DocumentType {
  NDA
  LOI
  DEFINITIVE_AGREEMENT
  FINANCIAL_STATEMENT
  DUE_DILIGENCE
  BOARD_PRESENTATION
  SEC_FILING
  OTHER
}
```

### SEC Filing Entity
```prisma
model SecFiling {
  id                String   @id @default(cuid())
  formType          String   // S-1, 10-K, 8-K, DEFM14A, etc.
  filingDate        DateTime
  dueDate           DateTime?
  status            FilingStatus @default(DRAFT)
  edgarUrl          String?

  spacId            String
  spac              Spac     @relation(fields: [spacId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum FilingStatus {
  DRAFT
  REVIEW
  SUBMITTED
  ACCEPTED
  AMENDED
}
```

### Contact Entity (CRM)
```prisma
model Contact {
  id                String   @id @default(cuid())
  firstName         String
  lastName          String
  email             String?
  phone             String?
  company           String?
  title             String?
  type              ContactType

  spacs             ContactSpac[]
  targets           ContactTarget[]
  interactions      Interaction[]

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum ContactType {
  INVESTOR
  ADVISOR
  LEGAL
  BANKER
  TARGET_EXEC
  BOARD_MEMBER
  OTHER
}
```

## 6.2 Financial Models

```prisma
model Financial {
  id                String   @id @default(cuid())
  type              FinancialType
  period            String   // Q1 2026, FY 2025, etc.
  data              Json     // Flexible financial data

  spacId            String
  spac              Spac     @relation(fields: [spacId], references: [id])

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum FinancialType {
  TRUST_ACCOUNT
  CAP_TABLE
  DILUTION_MODEL
  PRO_FORMA
  FORECAST
}
```

---

# 7. FEATURE SPECIFICATIONS

## 7.1 Dashboard Module

### 7.1.1 Overview Dashboard
- Real-time SPAC status summary
- Active deals pipeline visualization
- Upcoming deadlines and tasks
- Trust account balance tracker
- Recent activity feed
- AI-powered insights

### 7.1.2 Key Metrics Display
- Total SPACs managed
- Active targets in pipeline
- Days to deadline
- Trust value
- Redemption projections

## 7.2 SPAC Management Module

### 7.2.1 SPAC Profiles
- Create/edit SPAC entities
- Track lifecycle status
- Manage trust account details
- IPO information
- Deadline tracking
- Document association

### 7.2.2 Timeline View
- Visual SPAC lifecycle timeline
- Milestone tracking
- Regulatory deadlines
- Key events history

## 7.3 Deal Pipeline Module

### 7.3.1 Pipeline Board
- Kanban-style deal visualization
- Drag-and-drop status changes
- Filter by industry, status, score
- Quick actions menu

### 7.3.2 Target Profiles
- Company information
- Financial metrics
- AI-generated deal score
- Document repository
- Contact associations
- Activity timeline

### 7.3.3 AI Deal Scoring
- Automated target evaluation
- Industry analysis
- Financial health assessment
- Risk scoring
- Recommendation engine

## 7.4 Document Management Module

### 7.4.1 Document Repository
- Hierarchical folder structure
- Full-text search
- Version control
- Access permissions
- Bulk upload

### 7.4.2 AI Document Analysis
- Automatic summarization
- Key terms extraction
- Risk identification
- Clause comparison
- Redline generation

## 7.5 SEC Filing Module

### 7.5.1 Filing Tracker
- All SEC form types support
- Deadline calendar
- Status tracking
- EDGAR integration
- Filing history

### 7.5.2 Compliance Dashboard
- Upcoming filings
- Overdue alerts
- Filing checklist
- Regulatory updates

## 7.6 Financial Module

### 7.6.1 Trust Account Management
- Real-time balance tracking
- Interest accrual
- Redemption modeling
- Cash flow projections

### 7.6.2 Cap Table Management
- Shareholder tracking
- Warrant modeling
- Dilution analysis
- Pro forma scenarios

### 7.6.3 Financial Modeling
- Valuation models
- Merger consideration
- PIPE scenarios
- Earnout modeling

## 7.7 CRM Module

### 7.7.1 Contact Management
- Contact profiles
- Company associations
- Relationship mapping
- Interaction history

### 7.7.2 Communication Tracking
- Email integration
- Meeting notes
- Call logs
- Task assignments

## 7.8 AI Features Module

### 7.8.1 Document Intelligence
- Smart summarization
- Entity extraction
- Sentiment analysis
- Comparison tools

### 7.8.2 Research Agent
- Target company research
- Industry analysis
- Competitive landscape
- News monitoring

### 7.8.3 Compliance Agent
- Regulatory guidance
- Filing requirements
- Deadline alerts
- Risk assessment

---

# 8. SPRINT BREAKDOWN

## 8.1 Development Methodology

Each sprint follows this workflow:
1. **PRD Review** → Confirm requirements
2. **Sprint Planning** → Define tasks
3. **Development** → Execute with max agents + Product Review + QA agents
4. **Testing** → Unit, Integration, E2E
5. **QA Review** → Full frontend + backend testing
6. **GitHub Push** → Commit and push
7. **E2E Verification** → Final E2E tests
8. **Documentation** → Update MASTER_PROJECT_LOG.md

## 8.2 Sprint 1: Foundation ✅ COMPLETE

**Duration:** 1-2 sessions
**Goal:** Core infrastructure and authentication
**Status:** COMPLETED - February 1, 2026
**Commit:** fd5f752 - [SPRINT-1] feat: Complete foundation and authentication setup

### Tasks:
- [x] Initialize Next.js 14 project with App Router
- [x] Configure Prisma with Supabase
- [x] Set up Clerk authentication
- [x] Create base layout and navigation
- [x] Implement protected routes
- [x] Build dashboard shell
- [x] Set up tRPC with routers
- [x] Create core database models
- [x] Push initial code to GitHub

### Deliverables:
- ✅ Working auth flow (sign-in, sign-up, sign-out) - Verified working Feb 1, 2026
- ✅ Protected dashboard layout
- ✅ Database connection verified
- ✅ Basic navigation structure

### Sprint 1 Stats:
- **Files Created:** 235 TypeScript files
- **Lines of Code:** 91,006 insertions
- **QA Score:** 7/10 (see sprint-1-qa-report.md)
- **Issues Found:** 8 major, 12 minor (documented for Sprint 2+)

## 8.3 Sprint 2: SPAC Management (Next)

**Duration:** 1-2 sessions
**Goal:** SPAC entity CRUD and lifecycle management
**Status:** READY TO START

### Tasks:
- [ ] SPAC list view with filtering
- [ ] SPAC detail page
- [ ] Create/Edit SPAC forms
- [ ] Status management
- [ ] Timeline visualization
- [ ] Trust account tracking
- [ ] Deadline management

### Deliverables:
- Full SPAC CRUD operations
- Status workflow
- Timeline component
- Trust balance display

## 8.4 Sprint 3: Deal Pipeline

**Duration:** 1-2 sessions
**Goal:** Target management and pipeline visualization

### Tasks:
- [ ] Pipeline Kanban board
- [ ] Target profile pages
- [ ] Create/Edit target forms
- [ ] Stage transitions
- [ ] Filtering and search
- [ ] Target-SPAC association

### Deliverables:
- Working pipeline board
- Target profiles
- Drag-and-drop functionality
- Search and filters

## 8.5 Sprint 4: Document Management

**Duration:** 1-2 sessions
**Goal:** Document upload, storage, and organization

### Tasks:
- [ ] Document upload with Supabase Storage
- [ ] Folder structure
- [ ] Document viewer
- [ ] Version history
- [ ] Search functionality
- [ ] Document-entity association

### Deliverables:
- File upload working
- Document browser
- Preview capability
- Search functional

## 8.6 Sprint 5: AI Integration

**Duration:** 1-2 sessions
**Goal:** Claude AI integration for document analysis and scoring

### Tasks:
- [ ] Claude API integration
- [ ] Document summarization
- [ ] Deal scoring algorithm
- [ ] Research agent
- [ ] AI chat interface
- [ ] Extracted data display

### Deliverables:
- Working AI summarization
- Deal scores generating
- Chat interface functional
- Research results display

## 8.7 Sprint 6: SEC Filings & Compliance

**Duration:** 1-2 sessions
**Goal:** Filing tracker and compliance management

### Tasks:
- [ ] Filing tracker CRUD
- [ ] Deadline calendar
- [ ] Compliance dashboard
- [ ] Alert system
- [ ] Filing templates
- [ ] Status workflow

### Deliverables:
- Filing management working
- Calendar view
- Alerts functional
- Compliance overview

## 8.8 Sprint 7: Financial Module

**Duration:** 1-2 sessions
**Goal:** Trust accounts, cap tables, and financial modeling

### Tasks:
- [ ] Trust account dashboard
- [ ] Cap table management
- [ ] Dilution calculator
- [ ] Pro forma builder
- [ ] Charts and visualizations
- [ ] Export functionality

### Deliverables:
- Trust tracking working
- Cap table functional
- Calculations accurate
- Visualizations rendering

## 8.9 Sprint 8: CRM & Contacts

**Duration:** 1-2 sessions
**Goal:** Contact management and relationship tracking

### Tasks:
- [ ] Contact CRUD
- [ ] Company management
- [ ] Relationship mapping
- [ ] Interaction logging
- [ ] Contact-entity associations
- [ ] Search and filtering

### Deliverables:
- Contact management working
- Relationship view
- Activity logging functional
- Search working

## 8.10 Sprint 9: Polish & Integration

**Duration:** 1-2 sessions
**Goal:** UI polish, cross-module integration, and optimization

### Tasks:
- [ ] UI/UX refinements
- [ ] Cross-module navigation
- [ ] Performance optimization
- [ ] Error handling
- [ ] Loading states
- [ ] Empty states

### Deliverables:
- Polished UI
- Smooth navigation
- Good performance
- Error handling complete

## 8.11 Sprint 10: Testing & Deployment

**Duration:** 1-2 sessions
**Goal:** Comprehensive testing and production deployment

### Tasks:
- [ ] Full E2E test suite
- [ ] Performance testing
- [ ] Security audit
- [ ] Vercel deployment
- [ ] Production environment setup
- [ ] Monitoring setup

### Deliverables:
- All tests passing
- Production deployed
- Monitoring active
- Documentation complete

---

# 9. DEVELOPMENT WORKFLOW

## 9.1 Agent Configuration

**CRITICAL: Always run MAXIMUM agents per sprint (8-10 agents)**

For each sprint, deploy the following agents in parallel:

| Agent Role | Quantity | Responsibility |
|------------|----------|----------------|
| Development | 6-8 agents | Feature implementation (run in parallel) |
| Product Review | 1 (mandatory) | Requirements verification against PRD |
| QA | 1 (mandatory) | Testing, code quality, bug identification |

### Agent Execution Rules:
1. **Always maximize parallelization** - Launch all agents simultaneously
2. **Development agents** work on different features/files in parallel
3. **Product Review agent** verifies deliverables match PRD requirements
4. **QA agent** tests functionality, checks code quality, identifies bugs
5. **All agents complete** before marking sprint as done
6. **Fix any issues** identified by QA/Product Review before GitHub push

## 9.2 Code Quality Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Full interface definitions
- Proper error handling

### Components
- Functional components only
- Props interfaces defined
- Loading/error states
- Accessibility compliance

### API
- Input validation with Zod
- Error responses standardized
- Rate limiting implemented
- Logging enabled

## 9.3 Git Workflow

```bash
# Branch naming
feature/sprint-X-feature-name
fix/issue-description
refactor/component-name

# Commit format
[SPRINT-X] feat: description
[SPRINT-X] fix: description
[SPRINT-X] refactor: description
[SPRINT-X] test: description
```

## 9.4 Testing Requirements

### Per Sprint:
- Unit tests for utilities
- Component tests for UI
- Integration tests for API
- E2E tests for critical flows

### Before GitHub Push:
1. Run full test suite
2. Verify no TypeScript errors
3. Check linting passes
4. Test build succeeds

---

# 10. TESTING STRATEGY

## 10.1 Test Types

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit | Jest | 80% utilities |
| Component | React Testing Library | 70% components |
| Integration | Jest + Supertest | All API routes |
| E2E | Playwright | Critical user flows |

## 10.2 E2E Test Scenarios

### Authentication
- Sign up flow
- Sign in flow
- Sign out
- Protected route redirect

### SPAC Management
- Create new SPAC
- Edit SPAC details
- Change SPAC status
- Delete SPAC

### Deal Pipeline
- Add target to pipeline
- Move target between stages
- Edit target details
- Associate with SPAC

### Documents
- Upload document
- View document
- Delete document
- AI analysis trigger

## 10.3 QA Checklist

Before each sprint completion:
- [ ] All features implemented per spec
- [ ] No console errors
- [ ] Responsive on desktop/tablet
- [ ] Loading states present
- [ ] Error handling works
- [ ] Data persists correctly
- [ ] Navigation flows correct
- [ ] Forms validate properly

---

# 11. DEPLOYMENT PLAN

## 11.1 Vercel Configuration

### Environment Variables
Set in Vercel Dashboard → Project → Settings → Environment Variables:
- All variables from `.env.local`
- `NEXT_PUBLIC_APP_URL` = production URL

### Build Settings
```
Framework: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

## 11.2 Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Seed initial data (if needed)
npx prisma db seed
```

## 11.3 Production Checklist

- [ ] All environment variables set
- [ ] Database migrated
- [ ] Domain configured
- [ ] SSL certificate active
- [ ] Error monitoring enabled
- [ ] Analytics configured
- [ ] Backups scheduled

---

# 12. APPENDIX

## 12.1 SPAC Lifecycle Reference

```
Formation → IPO → Target Search → LOI → Due Diligence →
Definitive Agreement → Proxy/Registration → Shareholder Vote →
De-SPAC Close → Post-Merger
```

### Key Deadlines
- **18-24 months**: Business combination deadline from IPO
- **Extension votes**: Can extend deadline (typically 3-6 months)
- **Redemption deadline**: Before shareholder vote

## 12.2 SEC Filing Types

| Form | Purpose | Timing |
|------|---------|--------|
| S-1 | IPO Registration | Pre-IPO |
| 10-K | Annual Report | Year-end |
| 10-Q | Quarterly Report | Quarterly |
| 8-K | Current Report | Event-driven |
| DEFM14A | Proxy Statement | Pre-vote |
| S-4 | Merger Registration | Pre-merger |

## 12.3 Key Terminology

- **Trust Account**: Escrow holding IPO proceeds
- **Redemption**: Shareholders can redeem for trust value
- **PIPE**: Private Investment in Public Equity
- **Founder Shares**: Sponsor's promote shares (typically 20%)
- **Warrants**: Rights to purchase shares post-merger
- **De-SPAC**: The merger transaction itself

## 12.4 Contact Information

**Project Owner:** Di Rezze Family Office
**Email:** jpd@direzzefamilyoffice.com
**Repository:** https://github.com/jpd-dfo/spac-os

---

# DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 1, 2026 | Claude | Initial PRD |
| 2.0 | Feb 1, 2026 | Claude | Expanded with 50 user stories |
| 3.0 | Feb 1, 2026 | Claude | Complete rewrite with file locations, credentials, sprint breakdown |

---

**END OF DOCUMENT**

*This PRD serves as the single source of truth for the SPAC OS project. Reference this document when resuming development after context compaction.*
