# SPAC OS

## Product Requirements Document

**Version 4.1**

Special Purpose Acquisition Company
Operating System

**Di Rezze Family Office**

February 2, 2026

---

# 1. Executive Summary

SPAC OS v4.0 represents a transformational evolution from an operations management platform into a **comprehensive AI-native deal origination and execution system**. Building on the foundation of v3.0, this release introduces enterprise-grade deal sourcing, automated outreach infrastructure, and agentic AI workflows that position Di Rezze Family Office as a proactive deal originator rather than a passive recipient of deal flow.

## 1.1 Vision Statement

Transform SPAC OS into an autonomous deal-sourcing machine that identifies, qualifies, and engages thousands of potential acquisition targets monthly while simultaneously positioning the Di Rezze Family Office as a buyer of record with Private Equity firms, Investment Banks, and M&A advisors globally.

## 1.2 Business Objectives

- **Centralize all SPAC operations** in a single platform (retained from v3.0)
- **Source proprietary deal flow** through automated company discovery and qualification
- **Execute high-volume outreach** to thousands of targets monthly via email and LinkedIn
- **Map the acquisition landscape** including founder-owned, PE-backed, and family-owned businesses
- **Position as buyer of record** with PE firms, IBs, and M&A intermediaries
- **Enable AI-powered document analysis** and deal scoring (retained from v3.0)
- **Ensure SEC compliance** and regulatory adherence (retained from v3.0)

## 1.3 Key Performance Indicators (KPIs)

| Metric | Target |
|--------|--------|
| Monthly Target Companies Identified | 5,000+ |
| Monthly Outreach Volume (Email) | 10,000+ |
| Monthly PE/IB Touchpoints | 500+ |
| Email Deliverability Rate | >95% |
| Response Rate | >5% |
| Qualified Leads per Month | 100+ |
| Time to First Contact (Hot Lead) | <5 minutes |

---

# 2. Project References & File Locations

**⚠️ IMPORTANT: This section is the source of truth for all project file locations. Reference this when resuming after compaction.**

## 2.1 Critical File Paths

| File | Path | Purpose |
|------|------|---------|
| This PRD | /SPAC OS/documentation/PRDs/SPAC_OS_PRD_v4.1.md | Master reference |
| Previous PRD | /SPAC OS/documentation/PRDs/SPAC_OS_PRD_v4.0.md | Previous version |
| Legacy PRD | /SPAC OS/documentation/PRDs/SPAC_OS_PRD_v3.0.md | Legacy reference |
| Master Log | /SPAC OS/documentation/MASTER_PROJECT_LOG.md | Session logs |
| Env Variables | /SPAC OS/spac-os-app/.env.local | API keys |
| Credentials | /SPAC OS/.credentials/SPAC_OS_CREDENTIALS.md | Full backup |

## 2.2 Service Dashboards

| Service | Dashboard URL | Status |
|---------|---------------|--------|
| GitHub | https://github.com/jpd-dfo/spac-os | ✅ Complete |
| Supabase | https://supabase.com/dashboard/project/xliiolutjvihlwmstuii | ✅ Complete |
| Clerk | https://dashboard.clerk.com/apps/app_394pUWkY75EwfgaKkwYLEfKvlPx | ✅ Complete |
| Anthropic | https://platform.claude.com/settings/keys | ✅ Complete |
| Resend | https://resend.com/api-keys | ✅ Complete |
| Vercel | https://vercel.com/dfo1 | 🔄 Pending |
| Apollo.io | TBD | 🆕 New |
| Clay | TBD | 🆕 New |
| Smartlead | TBD | 🆕 New |
| Crunchbase | TBD | 🆕 New |

---

# 3. New Feature Modules (v4.0)

## 3.1 Deal Sourcing Engine

### 3.1.1 Overview

A comprehensive data aggregation and company discovery system that continuously identifies potential acquisition targets based on configurable criteria.

### 3.1.2 Data Provider Integration Strategy

#### Tier 1: Primary Data Sources (API Integration)

| Provider | Purpose | API Availability | Est. Annual Cost | Priority |
|----------|---------|------------------|------------------|----------|
| **Crunchbase** | Company data, funding rounds, ownership | ✅ Full API (Enterprise) | $12,000-$25,000/yr | HIGH |
| **Apollo.io** | Contact data, company enrichment, outreach | ✅ Full API (Organization plan) | $1,428/yr ($119/mo) | HIGH |
| **Clay** | Data enrichment, waterfall enrichment | ✅ API + Webhooks (Pro plan) | $9,600/yr ($800/mo) | HIGH |
| **SEC EDGAR** | Public filings, ownership data | ✅ Free API (data.sec.gov) | FREE | HIGH |

#### Tier 2: Supplementary Data Sources

| Provider | Purpose | API Availability | Est. Annual Cost | Priority |
|----------|---------|------------------|------------------|----------|
| **LinkedIn Sales Navigator** | Contact discovery, company research | ⚠️ No direct API (use via Clay/Apollo) | $1,200/yr | MEDIUM |
| **Cognism** | Phone-verified contacts (EMEA focus) | ✅ API available | Custom pricing | MEDIUM |
| **ZoomInfo** | Enterprise contact/company data | ✅ API (expensive) | $15,000-$50,000/yr | LOW |
| **PitchBook** | PE/VC data, M&A intelligence | ⚠️ Requires contract | $20,000-$40,000/yr | DEFERRED |

#### Tier 3: Free/Open Data Sources

| Source | Purpose | Access Method |
|--------|---------|---------------|
| SEC EDGAR | Public company filings, 13F holdings | RESTful API (free) |
| Companies House (UK) | UK company data | Free API |
| OpenCorporates | Global company registry | Free tier available |
| News APIs | Trigger events, M&A announcements | Various free tiers |

### 3.1.3 Company Ownership Classification

The system will automatically classify target companies by ownership type:

| Ownership Type | Identification Method | Priority Score |
|----------------|----------------------|----------------|
| **Founder-Owned** | No PE/VC funding rounds, founder as CEO/majority owner | HIGH |
| **Family-Owned** | Multiple family members in leadership, generational business | HIGH |
| **PE-Backed** | Recent PE investment, PE firm on board | MEDIUM |
| **VC-Backed** | Multiple funding rounds, institutional investors | MEDIUM |
| **Public Subsidiary** | Parent company publicly traded | LOW |
| **Strategic-Owned** | Owned by larger corporate | LOW |

### 3.1.4 Target Qualification Criteria

Configurable filters for target identification:

**Financial Metrics:**
- Revenue range: $50M - $500M (configurable)
- EBITDA margin: >10%
- Revenue growth: >10% YoY
- Geographic focus: United States (primary), Europe (secondary)

**Ownership Signals:**
- Founder age > 55 (succession planning trigger)
- No recent funding in 3+ years (potential exit)
- PE holding period > 5 years (exit timeline)
- Recent executive departures

**Industry Verticals (Configurable):**
- Technology & Software
- Healthcare Services
- Industrial Manufacturing
- Business Services
- Consumer Products

---

## 3.2 Outreach Automation System

### 3.2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    OUTREACH AUTOMATION SYSTEM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   TARGETS    │───▶│  ENRICHMENT  │───▶│  SEQUENCES   │       │
│  │  (Apollo/    │    │   (Clay)     │    │ (Smartlead)  │       │
│  │  Crunchbase) │    │              │    │              │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              UNIFIED CRM (SPAC OS)                   │       │
│  │  • Contact tracking   • Response management          │       │
│  │  • Deal progression   • AI categorization            │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2.2 Email Infrastructure

#### Recommended Platform: Smartlead.ai

**Rationale:**
- Unlimited mailboxes and warmup
- High deliverability focus with unique IP servers
- Automated sender rotation
- AI-powered reply categorization
- Unified inbox for all accounts
- White-label support for agency-style operations

**Infrastructure Requirements:**

| Component | Specification |
|-----------|---------------|
| Primary Domains | 10 secondary domains for cold outreach |
| Email Accounts | 50-100 warmed mailboxes |
| Daily Send Volume | 50-100 emails per mailbox |
| Monthly Capacity | 75,000-150,000 emails |
| Warmup Period | 2-4 weeks per new mailbox |

**Domain Strategy:**
- Never use primary domain (direzzefamilyoffice.com) for cold outreach
- Register similar domains: dfo-partners.com, direzze-capital.com, etc.
- Implement SPF, DKIM, DMARC on all domains
- Rotate domains monthly to maintain reputation

### 3.2.3 LinkedIn Automation

#### Integration via Apollo.io + Clay

**Capabilities:**
- LinkedIn profile enrichment
- Connection request automation (within platform limits)
- InMail sequences (Sales Navigator required)
- Profile visit tracking
- Engagement monitoring (likes, comments)

**Compliance Notes:**
- LinkedIn limits: ~100 connection requests/week
- Use human-like delays and patterns
- Avoid mass automation that triggers detection
- Focus on warm outreach after email engagement

### 3.2.4 Outreach Sequences

#### Sequence 1: Direct Target Company Outreach

**Purpose:** Reach founder-owned or family-owned companies directly

**Sequence Flow:**
1. **Day 0:** Personalized intro email (AI-generated based on company research)
2. **Day 3:** Follow-up with value proposition
3. **Day 7:** LinkedIn connection request
4. **Day 10:** Second email follow-up with case study/credibility piece
5. **Day 14:** Final email with direct ask for call
6. **Day 21:** LinkedIn message if connected

#### Sequence 2: PE/IB Relationship Building

**Purpose:** Position as buyer of record with deal intermediaries

**Sequence Flow:**
1. **Day 0:** Introduction email highlighting SPAC vehicle and criteria
2. **Day 5:** Follow-up with one-pager on investment thesis
3. **Day 14:** Quarterly check-in sequence enrollment
4. **Ongoing:** Monthly deal criteria updates

#### Sequence 3: M&A Advisor Network

**Purpose:** Build relationships with business brokers and M&A advisors

**Sequence Flow:**
1. **Day 0:** Introduction and buyer profile
2. **Day 7:** Specific sector interest follow-up
3. **Day 30:** Quarterly newsletter enrollment

---

## 3.3 Agentic AI Workflows

### 3.3.1 Overview

SPAC OS v4.0 introduces autonomous AI agents that operate continuously to identify, qualify, and engage targets without manual intervention.

### 3.3.2 Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AGENTIC AI SYSTEM                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  SCOUT AGENT    │  │ RESEARCH AGENT  │  │ OUTREACH AGENT  │  │
│  │                 │  │                 │  │                 │  │
│  │ • Monitor data  │  │ • Deep dive on  │  │ • Draft emails  │  │
│  │   sources       │  │   qualified     │  │ • Personalize   │  │
│  │ • Identify new  │  │   targets       │  │   messaging     │  │
│  │   targets       │  │ • Build company │  │ • Categorize    │  │
│  │ • Score fit     │  │   profiles      │  │   responses     │  │
│  │ • Flag triggers │  │ • Summarize     │  │ • Schedule      │  │
│  │                 │  │   findings      │  │   follow-ups    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│           ▼                    ▼                    ▼            │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              ORCHESTRATION LAYER (Claude API)               ││
│  │  • Task routing  • Memory management  • Decision making     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3.3 Agent Specifications

#### Scout Agent

**Trigger:** Runs daily at 6:00 AM EST

**Functions:**
- Query all data providers for new companies matching criteria
- Score each company on fit (0-100)
- Flag trigger events (funding, leadership changes, news)
- Add qualified companies to Research Queue

**Output:** Daily digest of new opportunities

#### Research Agent

**Trigger:** On-demand when company enters Research Queue

**Functions:**
- Pull comprehensive data from all sources
- Search news and press releases
- Analyze SEC filings (if public)
- Build standardized company profile
- Generate executive summary
- Recommend outreach approach

**Output:** Complete company dossier

#### Outreach Agent

**Trigger:** On-demand when company approved for outreach

**Functions:**
- Select appropriate sequence template
- Generate personalized first touch email
- Insert company-specific details and hooks
- Draft LinkedIn connection message
- Schedule sequence in Smartlead
- Monitor for responses and categorize

**Output:** Active outreach sequence

### 3.3.4 AI Response Handling

When a target responds, the system will:

1. **Auto-categorize** response (Interested, Not Interested, More Info, Meeting Request, Unsubscribe)
2. **Flag hot leads** for immediate human review
3. **Draft suggested reply** for human approval
4. **Update CRM** with response and next steps
5. **Trigger alert** to deal team (Slack/Email)

---

## 3.4 Relationship Intelligence Module

### 3.4.1 PE Firm Portfolio Mapping

**Purpose:** Track PE firm portfolios to identify potential SPAC targets approaching exit

**Data Model:**

```
PE Firm
├── Fund Name
├── Vintage Year
├── AUM
├── Investment Focus
└── Portfolio Companies[]
    ├── Company Name
    ├── Investment Date
    ├── Estimated Hold Period
    ├── Industry
    └── Exit Readiness Score
```

**Features:**
- Auto-import PE portfolios from PitchBook/Crunchbase
- Calculate hold period and predict exit timeline
- Alert when portfolio company reaches typical exit window (5-7 years)
- Track add-on acquisitions

### 3.4.2 Investment Bank Coverage Tracking

**Purpose:** Map IB relationships and recent mandates

**Data Model:**

```
Investment Bank
├── Bank Name
├── M&A Team Contacts[]
├── Industry Coverage[]
├── Recent Mandates[]
│   ├── Client Name
│   ├── Transaction Type
│   ├── Announced Date
│   └── Status
└── Relationship Score
```

### 3.4.3 Warm Introduction Pathways

**Purpose:** Identify connection paths to decision-makers

**Features:**
- Map LinkedIn connections of deal team
- Identify mutual connections to target executives
- Suggest introduction request templates
- Track introduction requests and outcomes

---

## 3.5 Company Intelligence Dashboard

### 3.5.1 Target Company Profile View

**Sections:**

1. **Overview**
   - Company name, logo, website
   - Industry, sub-industry
   - Ownership type classification
   - Fit score (0-100)

2. **Financial Summary**
   - Revenue (if available)
   - Employee count
   - Funding history
   - Estimated valuation

3. **Ownership & Leadership**
   - CEO/Founder profile
   - Board members
   - Key executives
   - PE/VC investors

4. **Deal Intelligence**
   - Trigger events
   - News mentions
   - Competitor transactions
   - Industry M&A activity

5. **Outreach History**
   - All touchpoints
   - Response status
   - Meeting notes
   - Next steps

### 3.5.2 Market Landscape View

**Features:**
- Heat map of target companies by geography
- Industry distribution charts
- Ownership type breakdown
- Pipeline funnel visualization
- Weekly/monthly trend analysis

---

# 4. Technology Stack

## 4.1 Frontend (Retained from v3.0)

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React framework with App Router |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| shadcn/ui | Latest | Component library |

## 4.2 Backend (Retained from v3.0)

| Technology | Version | Purpose |
|------------|---------|---------|
| tRPC | 11.x | Type-safe API |
| Prisma | 5.x | ORM |
| PostgreSQL | 15.x | Database (via Supabase) |

## 4.3 New Integrations (v4.0)

| Service | Purpose | Integration Method |
|---------|---------|-------------------|
| Apollo.io | Contact data, company enrichment | REST API |
| Clay | Data enrichment, waterfall lookups | Webhooks + HTTP API |
| Smartlead | Email outreach, warmup, tracking | REST API |
| Crunchbase | Company data, funding rounds | REST API |
| SEC EDGAR | Public filings, 13F data | REST API (free) |
| Anthropic Claude | AI agents, document analysis | API |
| Resend | Transactional emails | API (retained) |

## 4.4 Infrastructure Additions

| Component | Purpose | Provider |
|-----------|---------|----------|
| Background Jobs | Agent scheduling, data sync | Vercel Cron / Inngest |
| Queue System | Task processing | Redis / Upstash |
| Vector Database | Semantic search | Pinecone / Supabase pgvector |
| Monitoring | Error tracking, performance | Sentry |

---

# 5. Data Model Extensions

## 5.1 New Entities

### Company (Extended)

```prisma
model Company {
  id                String   @id @default(cuid())
  name              String
  website           String?
  linkedinUrl       String?
  industry          String?
  subIndustry       String?

  // Ownership Classification
  ownershipType     OwnershipType
  ownershipNotes    String?

  // Financial Data
  revenueRange      String?
  employeeCount     Int?
  foundedYear       Int?

  // Scoring
  fitScore          Int      @default(0)  // 0-100

  // Relationships
  contacts          Contact[]
  outreachSequences OutreachSequence[]
  triggerEvents     TriggerEvent[]

  // Metadata
  dataSource        String
  lastEnrichedAt    DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

enum OwnershipType {
  FOUNDER_OWNED
  FAMILY_OWNED
  PE_BACKED
  VC_BACKED
  PUBLIC_SUBSIDIARY
  STRATEGIC_OWNED
  UNKNOWN
}
```

### Contact

```prisma
model Contact {
  id              String   @id @default(cuid())
  email           String?
  emailVerified   Boolean  @default(false)
  phone           String?
  linkedinUrl     String?

  firstName       String
  lastName        String
  title           String?
  seniority       String?

  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])

  outreachTouches OutreachTouch[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

### OutreachSequence

```prisma
model OutreachSequence {
  id              String   @id @default(cuid())
  name            String
  sequenceType    SequenceType

  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])

  status          SequenceStatus @default(DRAFT)
  startedAt       DateTime?
  completedAt     DateTime?

  touches         OutreachTouch[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum SequenceType {
  DIRECT_TARGET
  PE_RELATIONSHIP
  IB_RELATIONSHIP
  ADVISOR_NETWORK
}

enum SequenceStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  BOUNCED
}
```

### OutreachTouch

```prisma
model OutreachTouch {
  id              String   @id @default(cuid())
  channel         Channel
  touchType       TouchType

  sequenceId      String
  sequence        OutreachSequence @relation(fields: [sequenceId], references: [id])

  contactId       String
  contact         Contact  @relation(fields: [contactId], references: [id])

  // Email specific
  subject         String?
  body            String?
  sentAt          DateTime?
  openedAt        DateTime?
  clickedAt       DateTime?
  repliedAt       DateTime?

  // Response handling
  responseCategory ResponseCategory?
  responseText     String?

  // External IDs
  externalId      String?  // Smartlead message ID

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

enum Channel {
  EMAIL
  LINKEDIN
  PHONE
  OTHER
}

enum TouchType {
  INITIAL_OUTREACH
  FOLLOW_UP
  RESPONSE
  MEETING_REQUEST
}

enum ResponseCategory {
  INTERESTED
  NOT_INTERESTED
  MORE_INFO
  MEETING_BOOKED
  UNSUBSCRIBE
  OUT_OF_OFFICE
  BOUNCED
}
```

### TriggerEvent

```prisma
model TriggerEvent {
  id              String   @id @default(cuid())
  eventType       TriggerEventType
  description     String
  eventDate       DateTime
  sourceUrl       String?

  companyId       String
  company         Company  @relation(fields: [companyId], references: [id])

  processed       Boolean  @default(false)
  processedAt     DateTime?

  createdAt       DateTime @default(now())
}

enum TriggerEventType {
  FUNDING_ROUND
  EXECUTIVE_DEPARTURE
  EXECUTIVE_HIRE
  ACQUISITION
  NEWS_MENTION
  REGULATORY_FILING
  ANNIVERSARY
  PE_EXIT_WINDOW
}
```

---

# 6. Sprint Breakdown (Extended)

Building on the original 10-sprint plan from v3.0, the following sprints are added:

## Original Sprints 1-10 (Retained from v3.0)

| Sprint | Focus Area | Key Deliverables | Status |
|--------|------------|------------------|--------|
| Sprint 1 | Foundation & Auth | Next.js setup, Clerk auth, Dashboard shell | ✅ COMPLETE |
| Sprint 2 | SPAC Management | SPAC CRUD, Lifecycle, Timeline | ✅ COMPLETE |
| Sprint 3 | Deal Pipeline | Kanban board, Target profiles | |
| Sprint 4 | Documents | Upload, Storage, Viewer | |
| Sprint 5 | AI Integration | Claude API, Summarization, Scoring | |
| Sprint 6 | SEC & Compliance | Filing tracker, Deadlines, Alerts | |
| Sprint 7 | Financial | Trust accounts, Cap table, Modeling | |
| Sprint 8 | CRM | Contacts, Relationships, Activity | |
| Sprint 9 | Polish | UI refinements, Integration, Performance | |
| Sprint 10 | Deployment | E2E tests, Vercel deploy, Monitoring | |

## New Sprints 11-18 (v4.0 Features)

| Sprint | Focus Area | Key Deliverables |
|--------|------------|------------------|
| Sprint 11 | Data Provider Setup | Crunchbase, Apollo.io API integration, SEC EDGAR |
| Sprint 12 | Company Database | Company model, enrichment pipeline, ownership classification |
| Sprint 13 | Deal Sourcing Engine | Scout Agent, qualification scoring, trigger detection |
| Sprint 14 | Outreach Infrastructure | Smartlead integration, domain setup, warmup |
| Sprint 15 | Sequence Builder | Email templates, sequence management, personalization |
| Sprint 16 | Agentic Workflows | Research Agent, Outreach Agent, orchestration |
| Sprint 17 | Relationship Intelligence | PE mapping, IB tracking, warm intro paths |
| Sprint 18 | Analytics & Optimization | Dashboards, A/B testing, performance metrics |

---

# 7. Integration Specifications

## 7.1 Apollo.io Integration

**Endpoints Required:**

| Endpoint | Purpose |
|----------|---------|
| POST /v1/people/search | Find contacts by criteria |
| POST /v1/organizations/search | Find companies |
| GET /v1/people/{id} | Get contact details |
| POST /v1/sequences/{id}/contacts | Add to sequence |
| GET /v1/emailer_campaigns | List campaigns |

**Data Flow:**
1. Search for companies matching criteria
2. Enrich with contact data
3. Push to SPAC OS database
4. Sync outreach status bidirectionally

## 7.2 Clay Integration

**Capabilities:**

| Feature | Usage |
|---------|-------|
| Waterfall Enrichment | Multi-provider data lookup |
| Claygent | AI research for custom data points |
| Webhooks | Real-time data sync |
| CRM Push | Sync to SPAC OS |

**Integration Pattern:**
- Clay table for each target company
- Webhook triggers on enrichment complete
- HTTP action to push to SPAC OS API

## 7.3 Smartlead Integration

**Endpoints Required:**

| Endpoint | Purpose |
|----------|---------|
| POST /api/v1/campaigns | Create campaign |
| POST /api/v1/leads | Add leads to campaign |
| GET /api/v1/campaigns/{id}/analytics | Get performance data |
| GET /api/v1/leads/{id}/activities | Get email activities |
| Webhooks | Real-time reply notifications |

**Webhook Events:**
- `email.sent`
- `email.opened`
- `email.clicked`
- `email.replied`
- `email.bounced`

## 7.4 SEC EDGAR Integration

**Free API Usage:**

```
Base URL: https://data.sec.gov/

Endpoints:
- /submissions/CIK{cik}.json - Company filings
- /api/xbrl/companyfacts/CIK{cik}.json - Financial data
- /cgi-bin/browse-edgar - Full-text search
```

**Use Cases:**
- Track public company filings
- Monitor 13F institutional holdings
- Identify PE/VC ownership in public filings
- News and 8-K monitoring for trigger events

---

# 8. Compliance & Legal Considerations

## 8.1 Email Compliance

**CAN-SPAM Requirements:**
- Clear sender identification
- Valid physical address in footer
- Unsubscribe mechanism (1-click)
- Honor opt-outs within 10 business days
- Accurate subject lines

**GDPR Considerations (for European outreach):**
- Legitimate interest basis for B2B outreach
- Clear privacy policy link
- Data subject access rights
- Right to erasure compliance

## 8.2 LinkedIn Terms of Service

**Compliance Approach:**
- No scraping of LinkedIn data
- Use official APIs via partners (Apollo, Clay)
- Respect connection request limits
- No automated InMail without Sales Navigator
- Human-like engagement patterns

## 8.3 Data Security

**Requirements:**
- All data encrypted at rest (Supabase default)
- API keys stored in environment variables
- No PII in logs
- Regular access audits
- Vendor security reviews

---

# 9. Cost Estimates

## 9.1 Monthly Recurring Costs

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Crunchbase | Enterprise | $1,000-$2,000 |
| Apollo.io | Organization | $119 |
| Clay | Pro | $800 |
| Smartlead | Pro | $79 |
| LinkedIn Sales Navigator | Core | $100 |
| Vercel | Pro | $20 |
| Supabase | Pro | $25 |
| Anthropic Claude | Usage-based | $200-$500 |
| Resend | Pro | $20 |
| Domains (10) | Annual | $15/mo avg |
| **TOTAL** | | **$2,400-$4,000/mo** |

## 9.2 One-Time Setup Costs

| Item | Cost |
|------|------|
| Secondary domains (10) | $150 |
| Email warmup period (labor) | Internal |
| Integration development | Internal |
| **TOTAL** | **$150** |

---

# 10. Success Metrics & Monitoring

## 10.1 Operational Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Companies discovered/week | 1,000+ | Scout Agent logs |
| Enrichment success rate | >80% | Clay completion rate |
| Email deliverability | >95% | Smartlead analytics |
| Open rate | >40% | Smartlead analytics |
| Reply rate | >5% | Smartlead analytics |
| Bounce rate | <2% | Smartlead analytics |

## 10.2 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Qualified leads/month | 100+ | CRM pipeline |
| Meetings booked/month | 20+ | Calendar integration |
| LOIs signed/quarter | 2+ | Deal tracking |
| Cost per qualified lead | <$50 | Total spend / leads |

## 10.3 Monitoring & Alerting

**Alert Triggers:**
- Deliverability drops below 90%
- Bounce rate exceeds 3%
- Hot lead response received
- Agent failure
- API quota exceeded

---

# 11. Appendix

## 11.1 SPAC Lifecycle (Retained from v3.0)

Formation → IPO → Target Search → LOI → Due Diligence → Definitive Agreement → Proxy/Registration → Shareholder Vote → De-SPAC Close → Post-Merger

## 11.2 Key Deadlines (Retained from v3.0)

- **18-24 months:** Business combination deadline from IPO
- **Extension votes:** Can extend deadline (typically 3-6 months)
- **Redemption deadline:** Before shareholder vote

## 11.3 Glossary

| Term | Definition |
|------|------------|
| **Waterfall Enrichment** | Sequential querying of multiple data providers until data is found |
| **Email Warmup** | Gradual increase in sending volume to build sender reputation |
| **SPF/DKIM/DMARC** | Email authentication protocols for deliverability |
| **Trigger Event** | Business event indicating potential acquisition interest |
| **Fit Score** | 0-100 score indicating how well a company matches target criteria |

## 11.4 Contact Information

**Project Owner:** Di Rezze Family Office
**Email:** jpd@direzzefamilyoffice.com
**Repository:** https://github.com/jpd-dfo/spac-os

---

**END OF DOCUMENT**

*This PRD serves as the single source of truth for the SPAC OS v4.1 project.*

---

**Document Version History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 3.0 | Feb 1, 2026 | Di Rezze FO | Initial operations platform |
| 4.0 | Feb 1, 2026 | Di Rezze FO | Added deal sourcing, outreach automation, agentic AI |
| 4.1 | Feb 2, 2026 | Di Rezze FO | Sprint 2 (SPAC Management) marked complete |
