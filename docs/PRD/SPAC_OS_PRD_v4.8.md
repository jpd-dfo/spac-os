# SPAC OS - Product Requirements Document

**Version:** 4.8
**Last Updated:** February 3, 2026
**Status:** Active Development

---

## Executive Summary

SPAC OS is a comprehensive deal management platform for Special Purpose Acquisition Companies (SPACs). The application provides tools for SPAC lifecycle management, deal pipeline tracking, target company evaluation, document management, compliance monitoring, CRM with email/calendar integration, and AI-powered analysis.

---

## Product Vision

Build the definitive operating system for SPAC sponsors and teams, enabling efficient deal sourcing, evaluation, and execution through intelligent automation and real-time collaboration.

---

## Sprint Breakdown

### Phase 1: Foundation (Sprints 1-2) - COMPLETED

#### Sprint 1: Initial Setup & Foundation
**Status:** Completed (February 1, 2026)

**Deliverables:**
- Next.js 14 application setup with App Router
- Clerk authentication integration
- Supabase PostgreSQL database
- Prisma ORM configuration
- tRPC API setup with React Query
- Dashboard shell with navigation
- UI component library (shadcn/ui)

#### Sprint 2: SPAC Management & Dashboard Integration
**Status:** Completed (February 2, 2026)

**Deliverables:**
- SPAC list page with pagination, search, filter, sort
- SPAC detail page with 5 tabs (Overview, Timeline, Documents, Team, Financials)
- SPAC create/edit forms with Zod validation
- Status lifecycle management with transitions
- Dashboard widgets connected to real tRPC data
- 220+ TypeScript errors resolved
- Clean build with 0 lint errors

---

### Phase 2: Deal Management (Sprints 3-4) - COMPLETED

#### Sprint 3: Deal Pipeline Backend Integration
**Status:** Completed (February 3, 2026)

**Completed Deliverables:**
1. **Connect Pipeline to tRPC Backend (P0)**
2. **Implement Edit Target (P1)**
3. **Wire Quick Actions (P1)** - PARTIAL: Move Stage and Archive work; Add Note, Change Priority, and Assign not implemented (no backend mutations)
4. **Export Functionality (P2)**
5. **Bulk Operations (P2)**

#### Sprint 4: Document Management
**Status:** Completed (February 3, 2026)

**Completed Deliverables:**
1. **Document Upload with Drag-and-Drop (P0)**
2. **Document Storage (P0)**
3. **PDF Document Viewer (P1)**
4. **Document Versioning (P1)**
5. **Document Categorization and Tagging (P2)**
6. **Document Search (P2)**
7. **SPAC/Target Integration (P1)**

---

### Phase 3: Intelligence (Sprints 5-6) - COMPLETED

#### Sprint 5: AI Integration
**Status:** Completed (February 2, 2026)

**Completed Deliverables:**
1. **Claude API Integration (P0)** - Anthropic Claude API client with streaming
2. **Document Summarization (P0)** - AI-powered document analysis with key terms, risks, action items
3. **Target Company Research (P0)** - Company research panel with web research simulation
4. **Deal Scoring Algorithm (P0)** - 6-dimension scoring with trend indicators
5. **Investment Memo Generation (P1)** - AI-generated investment memos
6. **Risk Analysis (P1)** - Risk badge component with severity levels

#### Sprint 6: SEC & Compliance
**Status:** Completed (February 2, 2026)

**Completed Deliverables:**

**Part A - Sprint 5 P2 Carryover:**
1. **PDF Export for Investment Memos (P0)** - jsPDF integration
2. **Analysis Caching in Database (P0)** - DocumentAnalysis model with 24h TTL
3. **Score History Tracking (P0)** - ScoreHistory model with Sparkline charts
4. **DocumentCard Risk Badge Integration (P0)** - Risk badges with tooltips
5. **AI Progress Indicators (P0)** - Step-by-step progress with cancellation

**Part B - SEC & Compliance:**
6. **SEC EDGAR Integration (P0)** - Rate-limited API client
7. **Filing Deadline Tracker (P0)** - Urgency color coding
8. **Compliance Alerts (P1)** - Header notifications
9. **Filing Status Monitoring (P1)** - PARTIAL: Timeline visualization works; Status change notifications not fully implemented
10. **Regulatory Calendar (P2)** - Month/week views

---

### Phase 4: Financial & CRM (Sprints 7-8) - COMPLETED

#### Sprint 7: Financial Module + Critical Wiring
**Status:** COMPLETED (February 3, 2026)

**Track A - Critical Wiring (P0):**
1. **Filings Page Wiring** - Replaced placeholder with tRPC integration
2. **Compliance Calendar Wiring** - Real SPAC/filing data instead of mock
3. **Dashboard Mock Data Wiring** - Trust widget + compliance data from real queries
4. **Tasks Page Wiring** - Full tRPC integration with CRUD operations
5. **Filing Detail Page Wiring** - Real filing data from backend

**Track B - Financial Module (P1):**
6. **Trust Account Dashboard** - Balance history, per-share value, holdings breakdown
7. **Cap Table Management** - Share class grouping, holder visualization
8. **Financial Summary Dashboard** - Key metrics with navigation to detail pages

#### Sprint 8: CRM & Contacts + Full Integrations
**Status:** COMPLETED (February 3, 2026)

**Track A - P1 Carryover Fixes:**
1. **SEC EDGAR Rate Limiter** - Documented serverless-safe pattern
2. **Alert Router Optimization** - Uses parallel query pattern

**Track B - CRM Core:**
3. **Contact Management** - Full CRUD with search, filter, star, scoring
4. **Company Profiles** - CRUD with deals and linked contacts
5. **Interaction Logging** - Timeline with calls, meetings, emails, notes
6. **Seed Data** - 30 contacts, 10 companies, 8 interactions

**Track C - Email Integration (Gmail):**
7. **Google OAuth Routes** - Initiation and callback handlers
8. **Gmail Service** - Sync, send, reply, labels, push notifications
9. **Email Router** - Full CRUD endpoints
10. **Email UI Components** - Inbox, Thread, Compose
11. **Gmail Webhook** - Push notification handler

**Track D - Calendar Integration:**
12. **Google Calendar Service** - Event CRUD, Meet links
13. **Calendly Service** - Scheduling links, API integration
14. **Calendar Router** - Google + Calendly endpoints
15. **Calendar UI Components** - CalendarView, MeetingScheduler, CalendlyBooking
16. **Calendly Webhook** - Booking event handler

**Quality Gate Results:**
- Build: PASS
- E2E Tests: 43/43 PASS
- No regressions

---

### Phase 5: Polish & Deploy (Sprints 9-10)

#### Sprint 9: Integration Completion & Vertical Slice Fixes
**Status:** COMPLETED (February 3, 2026)

**Deliverables:**

**Track A - Navigation & Quick Fixes:**
1. **Sidebar Navigation Links** - Added Tasks and Compliance to sidebar
2. **Dashboard Clerk Integration** - User name from Clerk session

**Track B - Filing Detail Page Wiring:**
3. **Schema Additions** - FilingWorkflowStep, FilingReviewer, FilingChecklist models
4. **Filing Router Additions** - 8 new tRPC procedures
5. **Filing Detail Wiring** - Removed getMockFilingData(), wired to tRPC

**Track C - Dashboard Wiring:**
6. **Mock Data Removal** - Removed mockActivityData, mockAIInsightsData, mockSpacStatusData

**Track D - Seed Data Fixes:**
7. **Schema Compatibility** - Fixed seed script for current schema

**Track E - E2E Tests:**
8. **CRM E2E Tests** - 18 new tests covering contacts, navigation, filing detail, dashboard

**Quality Gate Results:**
- Build: PASS
- E2E Tests: 18 new tests PASS
- QA Agent: APPROVED
- Product Review: APPROVED

#### Sprint 10: UI Polish & Deployment
**Status:** NEXT

**Deliverables:**
- UI refinements and consistency
- Performance optimization
- Accessibility improvements
- Mobile responsiveness
- CI/CD pipeline
- Vercel production deployment
- Monitoring and alerting
- Gmail/Calendar API credential configuration
- Dedicated /companies page
- Pagination UI for long lists

---

### Phase 6: Advanced Features (Sprints 11-18)

#### Sprint 11-18: AI Deal Sourcing Platform
**Status:** Future

**High-Level Deliverables:**
- External data provider integrations (Crunchbase, Apollo.io)
- Company database with enrichment
- AI Scout Agent for target identification
- Automated outreach infrastructure
- Relationship intelligence
- Advanced analytics

---

## Data Models

### Core Entities

```
SPAC
├── Basic Info (name, ticker, status)
├── Financials (trust amount, IPO size)
├── Dates (IPO date, deadline)
├── Relations → Targets, Documents, Filings, Tasks, Notes

Target
├── Company Info (name, sector, description)
├── Financials (valuation, revenue, EBITDA, multiples)
├── Scores (AI score, management, market, financial, operational, risk)
├── Pipeline (status, stage, priority)
├── Relations → SPAC, Documents, Tasks, Contacts, Notes, ScoreHistory

Document
├── Metadata (name, type, category, tags)
├── Storage (URL, size, mime type)
├── Versioning (version number, parent reference)
├── Status (draft, review, approved)
├── Relations → SPAC, Target, DocumentAnalysis

DocumentAnalysis (Sprint 6)
├── Analysis Results (summary, keyTerms, riskFlags, actionItems)
├── Insights and financial highlights
├── Risk level classification
├── Cache expiration (24 hours)

ScoreHistory (Sprint 6)
├── All score dimensions (overall, management, market, etc.)
├── Investment thesis
├── Timestamp for trending

ComplianceAlert (Sprint 6)
├── Alert type and severity
├── Title and description
├── Due date and status (read, dismissed)
├── SPAC association

Task (Sprint 7)
├── Title, description, status
├── Priority and due date
├── SPAC/Target association
├── Assignment tracking

TrustAccount (Sprint 7)
├── Current balance, initial amount
├── Accrued interest
├── Balance history tracking
├── Per-share value calculation

CapTableEntry (Sprint 7)
├── Holder name and type
├── Share class
├── Shares owned, ownership percentage
├── Vesting information

Filing (Sprint 7)
├── SEC Info (type, CIK, accession number)
├── Dates (filed, effective, due)
├── Status and deadlines
├── SEC comments
├── Relations → SPAC, WorkflowSteps, Reviewers, Checklist

FilingWorkflowStep (Sprint 9 - NEW)
├── Step name, status, order
├── Due date and completion tracking
├── Assigned user

FilingReviewer (Sprint 9 - NEW)
├── User assignment and role
├── Review status and comments
├── Review timestamp

FilingChecklist (Sprint 9 - NEW)
├── Item description
├── Completion status
├── Order and timestamps

Contact (Sprint 8)
├── Personal Info (name, email, phone, mobile)
├── Professional Info (title, company, department)
├── Social (LinkedIn, Twitter)
├── Address (city, state, country, postal code)
├── CRM Fields (status, type, starred, relationship score)
├── Relations → Company, Interactions, Notes, Meetings, Emails

Company (Sprint 8)
├── Company Info (name, industry, website, description)
├── Profile (type, size, headquarters, founded year)
├── Relations → Contacts, CompanyDeals

Interaction (Sprint 8)
├── Type (CALL, EMAIL, MEETING, NOTE, TASK, LINKEDIN, OTHER)
├── Subject and description
├── Date, duration, outcome
├── Relations → Contact

Meeting (Sprint 8)
├── Title, description, start/end time
├── Location and meeting URL
├── Calendar IDs (Google, Calendly)
├── Relations → Attendees

Email (Sprint 8)
├── Gmail Info (message ID, thread ID)
├── Content (subject, snippet, body)
├── Direction (INBOUND, OUTBOUND)
├── Addresses (from, to, cc)
├── Status (read, starred, labels)
├── Relations → Contact

EmailConnection (Sprint 8)
├── OAuth tokens (access, refresh, expiry)
├── History ID for incremental sync

CalendarConnection (Sprint 8)
├── OAuth tokens (access, refresh, expiry)
├── Provider (google, calendly)
```

### Pipeline Stages

```
IDENTIFIED → RESEARCHING → OUTREACH → NDA_SIGNED →
LOI_SIGNED → DUE_DILIGENCE → DA_SIGNED → CLOSING →
COMPLETED | PASSED
```

### SPAC Lifecycle

```
SEARCHING → LOI_SIGNED → DA_ANNOUNCED → SEC_REVIEW →
SHAREHOLDER_VOTE → CLOSING → COMPLETED | LIQUIDATED | TERMINATED
```

### Contact Status (Sprint 8)

```
LEAD → PROSPECT → ACTIVE → INACTIVE → ARCHIVED
```

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| State | React Query, Zustand |
| API | tRPC with superjson |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |
| Auth | Clerk |
| Storage | Supabase Storage |
| PDF | react-pdf, pdfjs-dist, jsPDF |
| AI | Anthropic Claude API |
| Email | Gmail API (OAuth 2.0), Resend |
| Calendar | Google Calendar API, Calendly API |
| Testing | Playwright (E2E) |
| Deployment | Vercel |

---

## Integration Status

### Backend ↔ Frontend Connectivity

| tRPC Router | Status | Frontend Pages |
|-------------|--------|----------------|
| `spac` | FULLY WIRED | /spacs, /spacs/[id], /dashboard |
| `target` | FULLY WIRED | /pipeline, /pipeline/[id] |
| `document` | FULLY WIRED | /documents, /pipeline/[id] |
| `filing` | FULLY WIRED | /filings, /filings/[id], /compliance |
| `task` | FULLY WIRED | /tasks |
| `financial` | FULLY WIRED | /financial, /financial/trust, /financial/cap-table, /dashboard |
| `alert` | FULLY WIRED | Header notifications |
| `note` | FULLY WIRED | /pipeline/[id] |
| `contact` | FULLY WIRED | /contacts, /contacts/[id] |
| `company` | FULLY WIRED | /contacts/[id] (company profiles) |
| `interaction` | FULLY WIRED | /contacts/[id] (timeline) |
| `email` | INTEGRATION-READY | /contacts (requires credentials) |
| `calendar` | INTEGRATION-READY | /contacts (requires credentials) |
| `compliance` | FULLY WIRED | Calendar uses filing data |

### Pages Using Mock Data (Intentional)

| Page | Mock Data | Reason |
|------|-----------|--------|
| /dashboard | Activity feed placeholder | Activity aggregation API not built |
| /dashboard | AI insights placeholder | Future AI feature |
| /dashboard | Milestones placeholder | Milestone tracking not built |
| /settings/integrations | Integration status | Requires credential configuration |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| API Response Time | < 500ms |
| Test Coverage | > 80% |
| Lighthouse Score | > 90 |
| Build Time | < 3 min |

---

## Changelog

### v4.8 (February 3, 2026)
- Sprint 9 marked COMPLETED
- Phase 5 Sprint 9 complete (Integration Completion & Vertical Slice Fixes)
- Track A: Navigation fixes delivered (2 items)
  - Tasks and Compliance links added to sidebar
  - Dashboard user data from Clerk
- Track B: Filing detail page fully wired (3 items)
  - Added FilingWorkflowStep, FilingReviewer, FilingChecklist models
  - Added 8 new tRPC procedures
  - Removed getMockFilingData(), wired to real tRPC
- Track C: Dashboard mock data removed
- Track D: Seed data schema compatibility fixes
- Track E: CRM E2E tests delivered (18 tests)
- 8 files changed, 936 insertions, 303 deletions
- E2E Tests: 18 new tests passing
- QA Agent: APPROVED
- Product Review: APPROVED
- Sprint 10 scope updated (UI Polish & Deployment)

### v4.7 (February 3, 2026)
- Sprint 8 marked COMPLETED
- Phase 4 (Financial & CRM) fully complete
- Track A: P1 carryover fixes delivered (2 items)
- Track B: CRM Core delivered (4 features)
  - Contact management with full CRUD
  - Company profiles with deals
  - Interaction logging with timeline
  - Seed data with 30 contacts, 10 companies
- Track C: Email Integration delivered (5 features)
  - Gmail OAuth, service, router, UI, webhook
- Track D: Calendar Integration delivered (5 features)
  - Google Calendar, Calendly, router, UI, webhooks
- Added 9 new database models (Contact extended, Company, Interaction, Meeting, Email, etc.)
- 95 files changed, 33,296 lines added
- E2E Tests: 43/43 passing
- Sprint 9 scope updated (Integration Completion & Testing)

### v4.6 (February 3, 2026)
- Sprint 7 marked COMPLETED
- Track A: Critical Wiring delivered (5 features)
- Track B: Financial Module delivered (3 features)
- Key technical fixes (tRPC root, Zod schemas, React hooks)
- Added Integration Status appendix

### v4.5 (February 2, 2026)
- Sprint 5 marked COMPLETED
- Sprint 6 marked COMPLETED
- Phase 3 (Intelligence) fully complete
- Added 3 new database models: DocumentAnalysis, ScoreHistory, ComplianceAlert

### v4.4 (February 3, 2026)
- Sprint 4 marked COMPLETED
- All document management features delivered
- Phase 2 (Deal Management) fully complete

### v4.3 (February 3, 2026)
- Sprint 3 marked COMPLETED
- Added Sprint 3 acceptance criteria results

### v4.2 (February 3, 2026)
- Revised Sprint 3 scope after discovery
- Added codebase inventory

### v4.1 (February 2, 2026)
- Added Sprints 11-18 for AI deal sourcing

### v4.0 (February 1, 2026)
- Initial PRD with 10-sprint roadmap
