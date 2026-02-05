# SPAC OS - Product Requirements Document

**Version:** 5.0
**Last Updated:** February 4, 2026
**Status:** Active Development - Vertical Slice Buildout
**Current Sprint:** 10

---

## Executive Summary

SPAC OS is the definitive deal management and relationship intelligence platform for SPAC sponsors. This revision transforms SPAC OS from a deal tracking tool into a comprehensive vertical SaaS platform that rivals HubSpot for CRM capabilities while providing specialized SPAC-specific workflows. The platform enables sponsors to source, evaluate, negotiate, and close de-SPAC transactions while maintaining complete relationship intelligence across Private Equity firms, Investment Banks, target companies, and key decision-makers.

**Core Value Proposition:** Be the operating system that makes SPAC sponsors the most informed, best-connected, and fastest-executing players in the market.

---

## Product Vision

Build the definitive operating system for SPAC sponsors that:
- **Sources deals** through AI-powered target identification and relationship intelligence
- **Manages relationships** with a CRM that rivals HubSpot's capabilities
- **Tracks the ecosystem** including all PEs, IBs, portfolio companies, and ownership structures
- **Executes transactions** with integrated workflows from LOI to closing
- **Provides intelligence** through real-time market data and AI analysis

---

## COMPLETED WORK SUMMARY (Sprints 1-9)

### Phase 1: Foundation (Sprints 1-2) ✅ COMPLETED
- Next.js 14 application with App Router
- Clerk authentication
- Supabase PostgreSQL database with Prisma ORM
- tRPC API with React Query
- Dashboard shell with navigation
- UI component library (shadcn/ui)
- SPAC list/detail pages with full CRUD
- Status lifecycle management

### Phase 2: Deal Management (Sprints 3-4) ✅ COMPLETED
- Deal pipeline with tRPC backend integration
- Target company CRUD with pipeline stages
- Document upload with drag-and-drop
- PDF viewer with versioning
- Document categorization, tagging, search
- SPAC/Target document associations

### Phase 3: Intelligence (Sprints 5-6) ✅ COMPLETED
- Claude API integration with streaming
- Document summarization with key terms/risks/action items
- Target company research panel
- 6-dimension deal scoring algorithm
- Investment memo generation
- Risk analysis with severity badges
- SEC EDGAR integration (rate-limited)
- Filing deadline tracker with urgency coding
- Compliance alerts and regulatory calendar

### Phase 4: Financial & Basic CRM (Sprints 7-8) ✅ COMPLETED
- Trust account dashboard with balance history
- Cap table management with share class grouping
- Financial summary dashboard
- **Basic CRM:** Contact management (CRUD, search, filter, scoring)
- **Basic CRM:** Company profiles with deal associations
- **Basic CRM:** Interaction logging (calls, meetings, emails, notes)
- Gmail integration (OAuth, sync, send, reply)
- Google Calendar integration (event CRUD, Meet links)
- Calendly integration (scheduling links, webhooks)

### Phase 5: Integration Completion (Sprint 9) ✅ COMPLETED
- Navigation fixes (Tasks, Compliance in sidebar)
- Filing detail page fully wired to tRPC
- Dashboard mock data removed
- Seed data schema compatibility
- 18 new E2E tests

---

## CURRENT SPRINT & ROADMAP

### Vertical Slice Development Methodology

> **What is a Vertical Slice?**
> A vertical slice is a complete, end-to-end feature that delivers user value. Instead of building "all the database models" then "all the APIs" then "all the UIs" (horizontal layers), we build one complete feature at a time that touches all layers.

**Each Slice Contains:**
| Layer | What's Included |
|-------|-----------------|
| **Schema** | Prisma models, migrations, relationships |
| **API** | tRPC procedures (list, get, create, update, delete) |
| **UI** | Pages, components, forms, data display |
| **Seed** | Realistic test data |
| **Tests** | E2E tests for the slice |

**Benefits:**
- ✅ Demo-able at end of each slice
- ✅ Feedback loops are faster
- ✅ No "integration hell" at the end
- ✅ Working software at every checkpoint

**Sprint Structure:**
- Each sprint has 4-5 vertical slices
- Slices are prioritized (P0 must complete, P1 should complete)
- Each slice has clear acceptance criteria
- Slices can be developed in parallel by different devs

---

### Sprint 10: PE Firm Management (Vertical Slice)
**Status:** IN PROGRESS
**Duration:** 1 week
**Theme:** Complete end-to-end PE firm tracking capability

> **Vertical Slice Principle:** Each slice delivers a complete, usable feature from database → API → UI. User can demo the feature at sprint end.

---

#### Slice 10.1: PE Firm Directory (P0)
**User Story:** As a SPAC sponsor, I can view and manage all PE firms in my ecosystem so I know who owns what and when they might exit.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Organization` model with type=PE_FIRM, aum, fund_vintage, industry_focus[], geography_focus[] |
| **API** | `organization.list`, `organization.getById`, `organization.create`, `organization.update`, `organization.delete` |
| **UI** | `/organizations` page with PE filter, `/organizations/[id]` detail page |
| **Seed** | 50 real PE firms with accurate AUM and focus areas |

**Acceptance Criteria:**
- [ ] User can view list of all PE firms with filtering by AUM range, industry focus, geography
- [ ] User can click into PE firm detail and see firmographics
- [ ] User can create a new PE firm manually
- [ ] User can edit PE firm information
- [ ] Search works across PE firm names
- [ ] Mobile responsive

---

#### Slice 10.2: PE Portfolio Tracking (P0)
**User Story:** As a SPAC sponsor, I can see which companies each PE firm owns, their ownership %, and estimated exit timeline so I can identify acquisition targets.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `OwnershipStake` model (owner_id, owned_id, ownership_pct, investment_date, estimated_entry_multiple, board_seats, exit_window) |
| **API** | `ownership.listByOwner`, `ownership.listByOwned`, `ownership.create`, `ownership.update` |
| **UI** | Portfolio tab on PE firm detail page showing all portfolio companies with ownership details |
| **Seed** | 200 ownership relationships linking PE firms to portfolio companies |

**Acceptance Criteria:**
- [ ] PE firm detail page shows "Portfolio" tab with all portfolio companies
- [ ] Each portfolio company shows: ownership %, investment date, estimated hold period remaining
- [ ] User can add a new portfolio company relationship
- [ ] User can click through to company detail from portfolio list
- [ ] Visual indicator for companies approaching exit window (5+ years held)

---

#### Slice 10.3: PE Contact Management (P0)
**User Story:** As a SPAC sponsor, I can see all my contacts at each PE firm and track our relationship strength so I know who to call for deal flow.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | Enhanced `Contact` with organization_id FK, seniority_level, relationship_strength enum |
| **API** | `contact.listByOrganization`, enhanced `contact.getById` with organization data |
| **UI** | Contacts tab on PE firm detail page, contact cards showing title/seniority/relationship strength |
| **Seed** | 150 PE contacts linked to the 50 PE firms |

**Acceptance Criteria:**
- [ ] PE firm detail page shows "Contacts" tab with all contacts at that firm
- [ ] Contact cards show name, title, seniority, relationship strength (Cold/Warm/Hot/Advocate)
- [ ] User can add a new contact directly from PE firm page (pre-fills organization)
- [ ] User can update relationship strength from contact card
- [ ] Click contact to go to full contact detail page

---

#### Slice 10.4: PE Interaction Timeline (P1)
**User Story:** As a SPAC sponsor, I can see all interactions with a PE firm across all contacts so I understand our relationship history.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `ActivityFeed` model with organization_id, contact_id, type, metadata |
| **API** | `activity.listByOrganization`, `activity.listByContact`, `activity.create` |
| **UI** | Activity tab on PE firm detail page showing unified timeline |
| **Realtime** | Supabase subscription for live activity updates |

**Acceptance Criteria:**
- [ ] PE firm detail page shows "Activity" tab with all interactions
- [ ] Timeline shows: emails sent/received, meetings, calls, notes (aggregated across all contacts)
- [ ] User can log a new interaction from activity tab
- [ ] New activities appear in real-time without refresh
- [ ] Filter by activity type

---

### Sprint 11: Investment Bank Management (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Complete end-to-end IB relationship and mandate tracking

---

#### Slice 11.1: IB Directory (P0)
**User Story:** As a SPAC sponsor, I can view and manage all investment banks so I know who covers my target sectors.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Organization` with type=IB, sub_type (BULGE_BRACKET, MIDDLE_MARKET, BOUTIQUE), sector_coverage[] |
| **API** | Reuse organization router with IB-specific filters |
| **UI** | `/organizations` with IB filter, IB-specific detail view |
| **Seed** | 30 IBs with sector coverage data |

**Acceptance Criteria:**
- [ ] User can filter organization list to show only IBs
- [ ] IB detail shows bank type, sector coverage, key offices
- [ ] User can create/edit IB profiles
- [ ] Search works across IB names

---

#### Slice 11.2: IB Banker Contacts (P0)
**User Story:** As a SPAC sponsor, I can see all bankers at each IB, their sector coverage, and our relationship so I know who to call for deal flow.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | Enhanced `Contact` with sectors_of_focus[], deal_roles |
| **API** | `contact.listByOrganization` with sector filtering |
| **UI** | Contacts tab on IB detail with sector badges |
| **Seed** | 100 IB contacts with sector assignments |

**Acceptance Criteria:**
- [ ] IB detail page shows contacts with their sector coverage
- [ ] User can filter contacts by sector
- [ ] Contact cards show sectors they cover
- [ ] User can add banker with sector assignment

---

#### Slice 11.3: Mandate Tracking (P0)
**User Story:** As a SPAC sponsor, I can track active sell-side mandates that IBs are running so I don't miss relevant processes.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Mandate` model (ib_id, target_id, status, ev_range, process_type, our_status, expected_close) |
| **API** | `mandate.list`, `mandate.getById`, `mandate.create`, `mandate.update`, `mandate.listByIB` |
| **UI** | Mandates tab on IB detail, `/mandates` page for all active processes |
| **Seed** | 25 active mandates |

**Acceptance Criteria:**
- [ ] IB detail shows "Active Mandates" tab with processes they're running
- [ ] Each mandate shows: target company, estimated EV, process type, our status
- [ ] User can create new mandate (heard about a process)
- [ ] User can update our status (Monitoring → Engaged → Passed/Won)
- [ ] `/mandates` page shows all mandates across all IBs with filtering

---

#### Slice 11.4: IB Deal History (P1)
**User Story:** As a SPAC sponsor, I can see what deals each IB has shown us historically so I understand our coverage.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Deal` enhanced with source_ib_id, introduced_by_contact_id |
| **API** | `deal.listBySourceIB` |
| **UI** | "Deal History" tab on IB detail showing all deals sourced from them |
| **Metrics** | Pass rate, engagement rate by IB |

**Acceptance Criteria:**
- [ ] IB detail shows "Deal History" tab
- [ ] Shows all deals they've shown us with outcome (Passed, Active, Won)
- [ ] Summary metrics: deals shown, deals engaged, conversion rate
- [ ] User can attribute a deal to an IB when creating/editing

---

### Sprint 12: Target Company Management (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Complete end-to-end target company tracking with ownership intelligence

---

#### Slice 12.1: Target Company Directory (P0)
**User Story:** As a SPAC sponsor, I can view and manage all potential target companies with their key attributes.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Organization` with type=TARGET_COMPANY, revenue_range, ebitda_range, employee_count |
| **API** | Organization router with target-specific filters |
| **UI** | `/organizations` with target filter, target-specific detail view |
| **Seed** | 100 target companies with financials |

**Acceptance Criteria:**
- [ ] User can filter to show only target companies
- [ ] Target detail shows key financials (revenue, EBITDA ranges)
- [ ] User can create/edit target company profiles
- [ ] Search and filter by industry, size, geography

---

#### Slice 12.2: Target Ownership Intelligence (P0)
**User Story:** As a SPAC sponsor, I can see who owns each target company (PE backing, founder ownership) so I understand the seller dynamics.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | Reuse `OwnershipStake` with owned_id pointing to target |
| **API** | `ownership.listByOwned` to get all owners of a company |
| **UI** | "Ownership" tab on target detail showing cap table summary |
| **Visual** | Pie chart of ownership breakdown |

**Acceptance Criteria:**
- [ ] Target detail shows "Ownership" tab
- [ ] Shows all shareholders: PE firms, founders, other
- [ ] Visual ownership breakdown (pie chart)
- [ ] Link to PE firm detail from ownership table
- [ ] Shows investment date and implied hold period for PE owners

---

#### Slice 12.3: Target Key Contacts (P0)
**User Story:** As a SPAC sponsor, I can track key contacts at each target company and my relationship with them.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Contact` linked to target Organization |
| **API** | `contact.listByOrganization` |
| **UI** | Contacts tab on target detail with role badges (CEO, CFO, etc.) |
| **Seed** | Key executives for each target company |

**Acceptance Criteria:**
- [ ] Target detail shows "Contacts" tab
- [ ] Shows key executives with titles
- [ ] User can add contacts to target company
- [ ] Shows relationship strength and last interaction

---

#### Slice 12.4: Target Deal Fit Scoring (P1)
**User Story:** As a SPAC sponsor, I can see how well each target fits our investment criteria so I can prioritize.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `TargetFitScore` model or computed fields on Deal |
| **API** | `target.calculateFitScore` |
| **UI** | Fit score card on target detail with breakdown |
| **AI** | Claude integration for qualitative fit assessment |

**Acceptance Criteria:**
- [ ] Target detail shows fit score (0-100)
- [ ] Breakdown by criteria: size fit, sector fit, geography fit, ownership fit
- [ ] Visual indicator (green/yellow/red) for each criterion
- [ ] AI-generated fit summary

---

### Sprint 13: Multi-Channel Cadences (Vertical Slice)
**Status:** PLANNED
**Duration:** 1.5 weeks
**Theme:** Complete automated outreach across email, SMS, iMessage, and phone

> **Cadence vs. Sequence:** We use "Cadence" to describe multi-channel automated outreach (email + SMS + iMessage + calls), going beyond email-only sequences.

---

#### Slice 13.1: Email Template Builder (P0)
**User Story:** As a SPAC sponsor, I can create reusable email templates with merge fields so I can personalize outreach at scale.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `EmailTemplate` model (name, subject, body_html, merge_fields[], category) |
| **API** | `emailTemplate.list`, `emailTemplate.create`, `emailTemplate.update`, `emailTemplate.preview` |
| **UI** | `/templates` page, rich text editor with merge field insertion |
| **Seed** | 10 starter templates (IB intro, PE intro, target outreach, follow-up) |

**Acceptance Criteria:**
- [ ] User can create email template with rich text
- [ ] Merge fields available: {{first_name}}, {{last_name}}, {{company}}, {{title}}
- [ ] User can preview template with sample data
- [ ] Templates organized by category
- [ ] User can duplicate and modify existing templates

---

#### Slice 13.2: SMS Template Builder (P0)
**User Story:** As a SPAC sponsor, I can create SMS templates for text message outreach.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `SMSTemplate` model (name, body, merge_fields[], category, character_count) |
| **API** | `smsTemplate.list`, `smsTemplate.create`, `smsTemplate.update`, `smsTemplate.preview` |
| **UI** | `/templates/sms` page, character counter (160 char limit awareness), merge field insertion |
| **Seed** | 5 starter SMS templates |

**Acceptance Criteria:**
- [ ] User can create SMS template (plain text)
- [ ] Character counter shows segment count (160 chars = 1 segment)
- [ ] Merge fields available: {{first_name}}, {{company}}
- [ ] Warning if template exceeds 320 chars (2 segments)
- [ ] Preview with sample data showing actual character count

---

#### Slice 13.3: Cadence Builder (P0)
**User Story:** As a SPAC sponsor, I can create multi-step cadences mixing email, SMS, iMessage, calls, and tasks.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Cadence` model, `CadenceStep` model (order, channel, delay_days, template_id, task_template, call_script) |
| **API** | `cadence.create`, `cadence.update`, `cadence.addStep`, `cadence.removeStep`, `cadence.reorderSteps` |
| **UI** | `/cadences` page, visual cadence builder with drag-and-drop, channel selector per step |
| **Seed** | 5 starter cadences (PE outreach, IB relationship, target direct, etc.) |

**Step Types (Channels):**
- **Email** - Send email from template
- **SMS** - Send text message via Twilio
- **iMessage** - Send iMessage via Blue.io
- **Call** - Create call task with script
- **LinkedIn** - Create LinkedIn task (manual)
- **Task** - Create generic task
- **Wait** - Delay before next step

**Cadence Schema:**
```
Cadence
├── name, description
├── type: PE_OUTREACH | IB_RELATIONSHIP | TARGET_DIRECT | INVESTOR_UPDATE
├── status: DRAFT | ACTIVE | PAUSED | ARCHIVED
├── steps: CadenceStep[]
├── settings
│   ├── send_window_start: "09:00"
│   ├── send_window_end: "18:00"
│   ├── timezone: "America/New_York"
│   ├── skip_weekends: boolean
│   ├── daily_send_limit: number
├── created_by, created_at

CadenceStep
├── cadence_id → Cadence
├── step_order: int
├── channel: EMAIL | SMS | IMESSAGE | CALL | LINKEDIN | TASK | WAIT
├── delay_days: int (from previous step)
├── delay_hours: int (for same-day follow-ups)
├── email_template_id → EmailTemplate (if channel=EMAIL)
├── sms_template_id → SMSTemplate (if channel=SMS or IMESSAGE)
├── call_script: string (if channel=CALL)
├── task_template: string (if channel=TASK or LINKEDIN)
├── conditions: JSON (branching: if_replied, if_opened, if_no_response)
```

**Acceptance Criteria:**
- [ ] User can create new cadence
- [ ] User can add steps with any channel type
- [ ] User can set delay between steps (days and/or hours)
- [ ] User can reorder steps via drag-and-drop
- [ ] User can set send window (e.g., 9am-6pm EST, skip weekends)
- [ ] Visual timeline preview of cadence
- [ ] User can add branching logic (if replied → skip to end)

---

#### Slice 13.4: Contact Enrollment (P0)
**User Story:** As a SPAC sponsor, I can enroll contacts into cadences individually or in bulk so outreach runs automatically.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `CadenceEnrollment` model (cadence_id, contact_id, status, current_step, next_scheduled, channel_preferences) |
| **API** | `enrollment.enroll`, `enrollment.enrollBulk`, `enrollment.pause`, `enrollment.resume`, `enrollment.unenroll` |
| **UI** | Enroll button on contact detail, bulk enroll from contact list, enrollment status indicator |
| **Validation** | Prevent duplicate enrollment, validate contact has required channels (email, phone) |

**Enrollment Status:**
- ACTIVE - Currently progressing through cadence
- PAUSED - Manually paused
- COMPLETED - Finished all steps
- REPLIED - Contact replied (auto-paused)
- BOUNCED - Email bounced or SMS failed
- OPTED_OUT - Contact unsubscribed
- MEETING_BOOKED - Meeting scheduled (success!)

**Acceptance Criteria:**
- [ ] User can enroll single contact from contact detail page
- [ ] User can select multiple contacts and bulk enroll
- [ ] System prevents enrolling contact already in same cadence
- [ ] Warning if contact missing phone number for SMS/iMessage cadence
- [ ] User can pause/resume individual enrollment
- [ ] User can unenroll contact completely

---

#### Slice 13.5: Cadence Execution Engine (P0)
**User Story:** As a SPAC sponsor, cadences run automatically sending emails, SMS, and iMessages on schedule.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Background** | Supabase Edge Function running every 5 minutes |
| **Logic** | Check enrollments due, respect send windows, execute step by channel, advance to next |
| **Email** | Gmail API send with merge field replacement + tracking pixel |
| **SMS** | Twilio API for text messages |
| **iMessage** | Blue.io API for iMessage delivery |
| **Call** | Create task with script, optionally trigger dialer |
| **Tracking** | Log all sends, opens, clicks, replies, failures |

**Execution Rules:**
- Respect send window (don't send at 2am)
- Skip weekends if configured
- Rate limit per contact (max 1 message per channel per day)
- Auto-pause on reply (any channel)
- Auto-pause on bounce/failure after 2 attempts
- Auto-complete on meeting booked

**Acceptance Criteria:**
- [ ] Scheduled messages send automatically at configured delays
- [ ] Send window respected (no sends outside business hours)
- [ ] Merge fields replaced with contact data
- [ ] Email tracking (opens, clicks) works
- [ ] SMS delivery status tracked
- [ ] iMessage delivery status tracked
- [ ] If contact replies to any channel, cadence auto-pauses
- [ ] If message bounces/fails, retry once then pause
- [ ] Activity logged for each step execution
- [ ] Daily send limits enforced

---

#### Slice 13.6: Cadence Analytics (P0)
**User Story:** As a SPAC sponsor, I can see cadence performance across all channels so I can optimize outreach.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | Computed metrics on Cadence (enrolled_count, completion_rate, reply_rate, meeting_rate) |
| **API** | `cadence.getStats`, `cadence.getStepStats`, `cadence.getChannelStats` |
| **UI** | Analytics tab on cadence detail with funnel and channel breakdown |
| **Charts** | Step-by-step funnel, channel performance comparison, reply rate over time |

**Metrics Tracked:**
- Enrolled count
- Active count
- Completed count
- Reply rate (by channel)
- Meeting booked rate
- Opt-out rate
- Bounce rate
- Average steps before reply
- Best performing channel
- Best performing step

**Acceptance Criteria:**
- [ ] Cadence detail shows performance metrics
- [ ] Funnel visualization: enrolled → step 1 → step 2 → replied/meeting
- [ ] Per-step metrics: sent, delivered, opened (email), replied
- [ ] Per-channel breakdown: email vs SMS vs iMessage performance
- [ ] Comparison across cadences
- [ ] Export analytics to CSV

---

### Sprint 14: Data Enrichment - PitchBook (Vertical Slice)
**Status:** PLANNED
**Duration:** 2 weeks
**Theme:** Automated PE/IB/Company data from PitchBook

---

#### Slice 14.1: PitchBook API Integration (P0)
**User Story:** As a SPAC sponsor, the system automatically enriches organization data from PitchBook so I don't have to manually research.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | PitchBook API client with auth, rate limiting, caching |
| **API** | `enrichment.enrichOrganization`, `enrichment.searchPitchBook` |
| **UI** | "Enrich from PitchBook" button on organization detail |
| **Mapping** | PitchBook fields → Organization schema |

**Acceptance Criteria:**
- [ ] User can click "Enrich" and pull latest PitchBook data
- [ ] PE firms: AUM, fund history, team populated automatically
- [ ] Companies: financials, ownership, investors populated
- [ ] Data source and last enriched timestamp tracked
- [ ] Rate limiting prevents API overuse

---

#### Slice 14.2: PE Fund Lifecycle Tracking (P0)
**User Story:** As a SPAC sponsor, I can see which PE funds are approaching exit windows so I can target their portfolio companies.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Fund` model (pe_firm_id, vintage_year, fund_size, status) |
| **API** | `fund.list`, `fund.listApproachingExit` |
| **UI** | Fund tab on PE detail, "Exit Window" alert dashboard |
| **Logic** | Flag funds 5+ years since vintage |

**Acceptance Criteria:**
- [ ] PE firm detail shows all funds with vintage years
- [ ] Dashboard widget: "Funds Approaching Exit Window"
- [ ] Click through to see portfolio companies in those funds
- [ ] Filter: funds with 5-7 year hold, 7+ year hold

---

#### Slice 14.3: M&A Transaction Feed (P1)
**User Story:** As a SPAC sponsor, I see recent M&A transactions in my sectors so I understand market activity and valuations.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | PitchBook transaction data sync (daily) |
| **Schema** | `Transaction` model (buyer, seller, value, multiples, advisors, date) |
| **API** | `transaction.list`, `transaction.listBySector` |
| **UI** | `/market/transactions` page with filtering |

**Acceptance Criteria:**
- [ ] Daily sync of transactions in focus sectors
- [ ] Transaction list with filtering by sector, size, date
- [ ] Detail shows: parties, value, multiples, advisors
- [ ] Link to organizations (create if not exists)

---

#### Slice 14.4: Comparable Transaction Database (P1)
**User Story:** As a SPAC sponsor, I can pull comparable transactions for valuation analysis.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **API** | `transaction.findComparables` with filters |
| **UI** | Comps table on deal detail page |
| **Export** | Excel export of comps table |

**Acceptance Criteria:**
- [ ] From deal detail, user can pull comparable transactions
- [ ] Filter by: sector, size range, date range, transaction type
- [ ] Table shows: target, EV, revenue multiple, EBITDA multiple
- [ ] Export to Excel for modeling

---

### Sprint 15: Data Enrichment - Contacts (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Automated contact enrichment from Apollo/ZoomInfo

---

#### Slice 15.1: Apollo.io Integration (P0)
**User Story:** As a SPAC sponsor, I can enrich contact data (email, phone, title) automatically so I have accurate outreach info.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | Apollo API client with auth and rate limiting |
| **API** | `enrichment.enrichContact`, `enrichment.searchApollo` |
| **UI** | "Enrich" button on contact detail, bulk enrich from list |
| **Mapping** | Apollo fields → Contact schema |

**Acceptance Criteria:**
- [ ] User can enrich single contact
- [ ] User can bulk enrich selected contacts
- [ ] Email, phone, title, LinkedIn URL populated
- [ ] Email verification status tracked
- [ ] Data source timestamp tracked

---

#### Slice 15.2: Email Verification (P0)
**User Story:** As a SPAC sponsor, I know which emails are valid before I send outreach so I maintain deliverability.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `email_verified` boolean, `email_verification_date` on Contact |
| **Service** | Apollo email verification API call |
| **UI** | Verification badge on contact, filter by verification status |
| **Logic** | Auto-verify on enrichment, re-verify monthly |

**Acceptance Criteria:**
- [ ] Contacts show verification badge (verified, unverified, invalid)
- [ ] User can manually trigger re-verification
- [ ] Sequence enrollment warns if email unverified
- [ ] Filter contacts by verification status

---

#### Slice 15.3: Org Chart Building (P1)
**User Story:** As a SPAC sponsor, I can see the org chart at target companies so I know the decision-making hierarchy.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `reports_to` FK on Contact |
| **API** | `contact.getOrgChart` returns hierarchical structure |
| **UI** | Org chart visualization on organization detail |
| **Enrichment** | Pull reporting relationships from Apollo |

**Acceptance Criteria:**
- [ ] Organization detail shows org chart tab
- [ ] Visual tree showing reporting relationships
- [ ] Click contact node to go to detail
- [ ] User can manually set reports_to if not enriched

---

### Sprint 16: Deal Workflow Automation (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Stage-based checklists and automated task generation

---

#### Slice 16.1: Deal Stage Checklists (P0)
**User Story:** As a SPAC sponsor, each deal stage has a checklist so I don't miss critical steps.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `DealChecklist` model (deal_id, stage, items[]), `ChecklistItem` (description, completed, completed_by) |
| **API** | `checklist.getByDealStage`, `checklist.toggleItem` |
| **UI** | Checklist panel on deal detail, per-stage |
| **Seed** | Default checklist templates per stage |

**Acceptance Criteria:**
- [ ] Deal detail shows checklist for current stage
- [ ] User can check off items
- [ ] Completed items show who completed and when
- [ ] Stage cannot advance until required items complete (optional enforcement)
- [ ] Admin can customize default checklists

---

#### Slice 16.2: Auto-Task Generation (P0)
**User Story:** As a SPAC sponsor, tasks are created automatically when deals change stage so nothing falls through cracks.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `StageTaskTemplate` model (stage, task_templates[]) |
| **Logic** | On stage change, create tasks from template |
| **API** | `deal.changeStage` triggers task creation |
| **UI** | Tasks appear in deal detail and user's task list |

**Acceptance Criteria:**
- [ ] Moving deal to new stage auto-creates tasks
- [ ] Tasks assigned based on template (e.g., "Send NDA" assigned to deal lead)
- [ ] Tasks linked to deal
- [ ] Admin can customize task templates per stage

---

#### Slice 16.3: Deal Document Requirements (P1)
**User Story:** As a SPAC sponsor, I can see what documents are required vs. received for each deal stage.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `DocumentRequirement` model (stage, document_type, required) |
| **API** | `document.getRequirements`, `document.checkCompletion` |
| **UI** | Document requirements panel on deal detail |
| **Visual** | Progress bar showing docs received vs. required |

**Acceptance Criteria:**
- [ ] Deal detail shows required documents per stage
- [ ] Visual indicator: received (green), missing (red)
- [ ] User can mark document as received and link uploaded doc
- [ ] Progress bar: 5 of 8 documents received

---

#### Slice 16.4: Deal Workflow Visualization (P1)
**User Story:** As a SPAC sponsor, I can see deal progress visually as a timeline/Gantt.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | Stage timestamps tracked on Deal |
| **API** | `deal.getTimeline` |
| **UI** | Visual timeline on deal detail showing stage progression |
| **Charts** | Gantt-style view of deal milestones |

**Acceptance Criteria:**
- [ ] Deal detail shows visual timeline
- [ ] Each stage shows entry date and duration
- [ ] Upcoming milestones shown with due dates
- [ ] Overdue milestones highlighted

---

### Sprint 17: Intelligence & Alerts (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Proactive deal intelligence and signal detection

---

#### Slice 17.1: News Monitoring (P0)
**User Story:** As a SPAC sponsor, I see relevant news about my target companies and PE firms automatically.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | News API integration (NewsAPI, Google News) |
| **Schema** | `NewsItem` model (title, source, url, entities[], relevance_score) |
| **Background** | Daily news fetch for tracked organizations |
| **UI** | News feed on dashboard, news tab on organization detail |

**Acceptance Criteria:**
- [ ] Dashboard shows relevant news feed
- [ ] Organization detail shows company-specific news
- [ ] News items linked to mentioned organizations
- [ ] Relevance scoring prioritizes important news

---

#### Slice 17.2: Deal Signal Detection (P0)
**User Story:** As a SPAC sponsor, I'm alerted to signals that a company might be ready to sell (CFO hire, auditor change, etc.).

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `DealSignal` model (type, organization_id, description, strength, detected_at) |
| **Rules** | Configurable signal detection rules |
| **Background** | Signal detection job running on news/data changes |
| **UI** | Signal alert dashboard, signals tab on organization |

**Signal Types:**
- PE fund approaching exit window (5+ years)
- CFO or Corp Dev hire (potential exit prep)
- PCAOB auditor engagement
- CEO/leadership change
- Competitor acquisition (may trigger strategic review)

**Acceptance Criteria:**
- [ ] Signals detected automatically from data sources
- [ ] Dashboard shows recent signals with priority
- [ ] Click signal to see organization detail
- [ ] User can dismiss or act on signal
- [ ] User can configure which signals to monitor

---

#### Slice 17.3: Alert Notifications (P0)
**User Story:** As a SPAC sponsor, I receive notifications for important events so I can act quickly.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Notification` model (user_id, type, title, body, read, actioned) |
| **API** | `notification.list`, `notification.markRead`, `notification.preferences` |
| **UI** | Notification bell in header, notification center panel |
| **Delivery** | In-app + optional email digest |

**Acceptance Criteria:**
- [ ] Notification bell shows unread count
- [ ] Click to see notification list
- [ ] Mark as read, mark all as read
- [ ] User can configure notification preferences
- [ ] Daily email digest option

---

### Sprint 18: Analytics & Reporting (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Executive dashboards and board reporting

---

#### Slice 18.1: Pipeline Analytics Dashboard (P0)
**User Story:** As a SPAC sponsor, I can see my pipeline health at a glance.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **API** | `analytics.pipelineSummary`, `analytics.pipelineByStage` |
| **UI** | Pipeline dashboard with key metrics and charts |
| **Charts** | Deals by stage (funnel), deals by sector (pie), deal value over time |

**Acceptance Criteria:**
- [ ] Dashboard shows total deals, total value, by stage
- [ ] Funnel visualization of pipeline stages
- [ ] Filter by sector, source, date range
- [ ] Click through to filtered deal list

---

#### Slice 18.2: Relationship Coverage Report (P0)
**User Story:** As a SPAC sponsor, I can see our relationship coverage across PEs and IBs.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **API** | `analytics.relationshipCoverage` |
| **UI** | Coverage dashboard with heat maps |
| **Charts** | Coverage by PE firm (contacts per firm), coverage by IB |

**Acceptance Criteria:**
- [ ] See coverage heat map: which firms have strong relationships
- [ ] Identify gaps: important firms with no contacts
- [ ] Engagement metrics: last interaction by firm
- [ ] Filter by sector focus

---

#### Slice 18.3: Activity Metrics (P1)
**User Story:** As a SPAC sponsor, I can see team activity levels and productivity.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **API** | `analytics.activityMetrics` |
| **UI** | Activity dashboard with trend charts |
| **Metrics** | Emails sent, meetings held, deals touched, by team member |

**Acceptance Criteria:**
- [ ] See activity over time (week/month)
- [ ] Breakdown by activity type
- [ ] Breakdown by team member
- [ ] Compare periods

---

#### Slice 18.4: Board Report Export (P1)
**User Story:** As a SPAC sponsor, I can generate a board report PDF summarizing deal activity.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **API** | `report.generateBoardReport` |
| **PDF** | jsPDF generation with charts and tables |
| **UI** | "Generate Board Report" button with date range picker |

**Acceptance Criteria:**
- [ ] User can generate PDF report
- [ ] Report includes: pipeline summary, key deals, activity summary
- [ ] Configurable date range
- [ ] Download as PDF

---

### Sprint 19: Mobile & Notifications (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Mobile access and push notifications

---

#### Slice 19.1: Mobile Web Optimization (P0)
**User Story:** As a SPAC sponsor on the go, I can access key features from my phone.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **UI** | Mobile-responsive design for all core pages |
| **Priority** | Contact lookup, deal status, task list, activity logging |

**Acceptance Criteria:**
- [ ] All pages render correctly on mobile
- [ ] Touch-friendly interactions
- [ ] Quick contact search
- [ ] Easy interaction logging

---

#### Slice 19.2: Push Notifications (P0)
**User Story:** As a SPAC sponsor, I receive push notifications for urgent items.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | Web push notification setup (Service Worker) |
| **API** | `notification.subscribe`, `notification.send` |
| **UI** | Push permission prompt, notification preferences |

**Acceptance Criteria:**
- [ ] User can enable push notifications
- [ ] Receive push for: deal stage changes, task due, meeting reminders
- [ ] Click notification to open relevant page
- [ ] User can configure which pushes to receive

---

### Sprint 20: Production Hardening (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Production readiness and deployment

---

#### Slice 20.1: Performance Optimization (P0)

**Deliverables:**
- Database query optimization (indexes, query analysis)
- API response caching (Redis or Supabase cache)
- Image/document CDN setup
- Code splitting and lazy loading
- Lighthouse score > 90

---

#### Slice 20.2: Security & Compliance (P0)

**Deliverables:**
- SOC 2 preparation checklist
- Data encryption audit
- Audit logging for sensitive actions
- RBAC review and hardening
- Penetration testing

---

#### Slice 20.3: Deployment & Monitoring (P0)

**Deliverables:**
- Production Vercel deployment
- CI/CD pipeline (GitHub Actions)
- Error tracking (Sentry)
- Performance monitoring (Datadog)
- Backup and disaster recovery
- Runbook documentation

---

### Sprint 21: CRM Feature Parity - Part 1 (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Essential CRM features for HubSpot parity

---

#### Slice 21.1: List Segmentation & Smart Lists (P0)
**User Story:** As a SPAC sponsor, I can create saved filters and smart lists so I can quickly access segments of contacts/organizations.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `SavedFilter` model (name, entity_type, filter_criteria JSON, is_dynamic, owner_id) |
| **API** | `savedFilter.create`, `savedFilter.list`, `savedFilter.execute`, `savedFilter.delete` |
| **UI** | "Save this filter" button on list pages, saved filters sidebar, smart list management page |
| **Logic** | Dynamic lists auto-update; static lists snapshot at creation |

**Acceptance Criteria:**
- [ ] User can save current filter as a named list
- [ ] Saved lists appear in sidebar for quick access
- [ ] Dynamic lists show real-time count
- [ ] User can edit filter criteria for existing list
- [ ] User can share lists with team members
- [ ] Lists can be used as enrollment criteria for sequences

---

#### Slice 21.2: Import/Export & Data Migration (P0)
**User Story:** As a SPAC sponsor, I can import contacts/organizations from CSV/Excel and export my data for reporting or migration.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `ImportJob` model (status, file_url, mapping, results, errors) |
| **API** | `import.upload`, `import.preview`, `import.execute`, `export.contacts`, `export.organizations`, `export.deals` |
| **UI** | Import wizard with field mapping, export button with format selection |
| **Processing** | Background job for large imports, progress tracking |

**Acceptance Criteria:**
- [ ] User can upload CSV or Excel file
- [ ] Preview shows sample rows with field mapping
- [ ] User can map columns to system fields
- [ ] Import handles duplicates (skip, update, create new)
- [ ] Import results show success/error counts with downloadable error report
- [ ] Export to CSV/Excel with column selection
- [ ] Export respects current filters

---

#### Slice 21.3: Duplicate Detection & Merge (P0)
**User Story:** As a SPAC sponsor, the system identifies duplicate contacts/organizations so I maintain data quality.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `DuplicateSet` model (entity_type, record_ids[], status, merged_into_id) |
| **API** | `duplicate.detect`, `duplicate.getPotentialDuplicates`, `duplicate.merge`, `duplicate.dismiss` |
| **UI** | Duplicate warning on create, duplicate management page, merge wizard |
| **Logic** | Fuzzy matching on name, email, domain; confidence scoring |

**Acceptance Criteria:**
- [ ] Warning shown when creating contact/org that may be duplicate
- [ ] Duplicate management page shows all potential duplicate sets
- [ ] Merge wizard shows side-by-side comparison
- [ ] User can select which values to keep for each field
- [ ] Merged record maintains all relationships (deals, interactions, etc.)
- [ ] User can dismiss false positives

---

#### Slice 21.4: Bulk Operations Center (P0)
**User Story:** As a SPAC sponsor, I can perform bulk actions on selected records efficiently.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `BulkJob` model (action_type, record_ids[], status, results) |
| **API** | `bulk.updateField`, `bulk.assignOwner`, `bulk.addToSequence`, `bulk.addTag`, `bulk.delete`, `bulk.export` |
| **UI** | Bulk action toolbar on list pages, progress modal for large operations |
| **Processing** | Background processing for >100 records |

**Bulk Actions Supported:**
- Update any field value
- Assign owner
- Add/remove tags
- Enroll in sequence
- Add to static list
- Delete records
- Export selected
- Send bulk email (one-off, not sequence)

**Acceptance Criteria:**
- [ ] Select all / select visible / select across pages
- [ ] Bulk action menu appears when records selected
- [ ] Confirmation dialog shows affected count
- [ ] Progress indicator for large operations
- [ ] Results summary with error details
- [ ] Undo available for recent bulk operations

---

### Sprint 22: CRM Feature Parity - Part 2 (Vertical Slice)
**Status:** PLANNED
**Duration:** 1 week
**Theme:** Communication integrations and advanced CRM

---

#### Slice 22.1: Microsoft 365 Integration (P0)
**User Story:** As a SPAC sponsor using Outlook, I can sync my emails and calendar with SPAC OS.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `EmailConnection` enhanced for provider type (google, microsoft) |
| **Service** | Microsoft Graph API client (email sync, calendar sync, send) |
| **Auth** | Microsoft OAuth 2.0 flow |
| **UI** | Connect Outlook button in settings, unified inbox works with both providers |

**Acceptance Criteria:**
- [ ] User can connect Microsoft 365 account
- [ ] Emails sync bidirectionally (inbox + sent)
- [ ] Calendar events sync bidirectionally
- [ ] Compose email works with Outlook
- [ ] User can have Gmail AND Outlook connected simultaneously
- [ ] Email tracking works with Outlook-sent emails

---

#### Slice 22.2: Twilio SMS Integration (P0)
**User Story:** As a SPAC sponsor, I can send and receive SMS messages to contacts directly from SPAC OS.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `SMSMessage` model (contact_id, direction, body, status, twilio_sid), `SMSConnection` model (twilio_account_sid, phone_number) |
| **Service** | Twilio API client (send SMS, receive webhook, delivery status) |
| **API** | `sms.send`, `sms.list`, `sms.getThread`, webhook handler for inbound |
| **UI** | SMS tab on contact detail, SMS composer, conversation thread view |

**Acceptance Criteria:**
- [ ] User can connect Twilio account with phone number
- [ ] User can send SMS from contact detail page
- [ ] Inbound SMS appears in contact's message thread
- [ ] Delivery status tracked (sent, delivered, failed)
- [ ] SMS appears in activity timeline
- [ ] Character count and segment indicator on compose
- [ ] Supports MMS (images) - optional

---

#### Slice 22.3: Blue.io iMessage Integration (P0)
**User Story:** As a SPAC sponsor, I can send iMessages to contacts for higher engagement than SMS.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `iMessageConnection` model (blueio_api_key, sender_id, status), `iMessage` model (contact_id, direction, body, status, blueio_message_id) |
| **Service** | Blue.io API client (send iMessage, delivery status webhook, read receipts) |
| **API** | `imessage.send`, `imessage.list`, `imessage.getThread`, webhook handler |
| **UI** | iMessage tab on contact detail, iMessage composer, blue bubble thread view |

**Blue.io Features:**
- Send iMessages from your Apple ID
- Delivery receipts
- Read receipts
- Tapback reactions (optional)
- Group messages (optional)
- Link previews

**Acceptance Criteria:**
- [ ] User can connect Blue.io account
- [ ] User can send iMessage from contact detail page
- [ ] iMessages display in conversation thread (blue bubbles)
- [ ] Delivery status tracked (sent, delivered, read)
- [ ] Read receipts shown when contact reads message
- [ ] Inbound iMessages captured and displayed
- [ ] iMessage appears in activity timeline
- [ ] Fallback to SMS if iMessage fails (configurable)
- [ ] Works within cadences (Slice 13.3)

---

#### Slice 22.4: Phone Dialer Integration (P0)
**User Story:** As a SPAC sponsor, I can make calls directly from SPAC OS with automatic logging and optional recording.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `PhoneConnection` model (provider, credentials), `CallLog` enhanced with recording_url, transcription |
| **Service** | Twilio Voice API (click-to-call, call recording, voicemail drop) |
| **API** | `phone.dial`, `phone.hangup`, `phone.getActiveCall`, `phone.logCall`, webhook handlers |
| **UI** | Click-to-call button on contact, in-call modal, call disposition form, call history |

**Dialer Features:**
- Click-to-call from any phone number
- Browser-based calling (WebRTC) OR forward to your mobile
- Call recording (with consent notification)
- Voicemail drop (pre-recorded messages)
- Call scripts displayed during call
- Real-time call timer
- Post-call disposition capture
- Call notes auto-saved

**Call Flow:**
1. User clicks phone number → Dialer initiates call
2. User's phone rings first (or browser rings if WebRTC)
3. Upon answer, system dials contact
4. Call recording starts (if enabled)
5. Call script displayed in UI
6. Call ends → Disposition modal appears
7. User logs outcome, notes
8. Call saved to activity timeline

**Acceptance Criteria:**
- [ ] User can configure phone connection (Twilio)
- [ ] Click any phone number to initiate call
- [ ] Choose: call via browser OR forward to mobile
- [ ] In-call UI shows timer, contact info, call script
- [ ] Recording available (with legal disclaimer)
- [ ] Post-call disposition required (Connected, Voicemail, No Answer, etc.)
- [ ] Call notes saved automatically
- [ ] Call appears in contact activity timeline
- [ ] Call analytics (calls per day, connect rate, avg duration)
- [ ] Works within cadences (creates call task with script)

---

#### Slice 22.5: Voicemail Drop (P1)
**User Story:** As a SPAC sponsor, I can leave pre-recorded voicemails efficiently when contacts don't answer.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `VoicemailTemplate` model (name, audio_url, duration, transcript) |
| **Service** | Twilio voicemail drop via API |
| **API** | `voicemail.record`, `voicemail.list`, `voicemail.drop` |
| **UI** | Voicemail library, record new voicemail, one-click drop during call |

**Acceptance Criteria:**
- [ ] User can record voicemail templates
- [ ] User can preview/playback voicemail templates
- [ ] During call, if no answer → "Drop Voicemail" button
- [ ] Voicemail delivered after beep detection
- [ ] Voicemail drop logged in activity timeline
- [ ] Multiple voicemail templates for different scenarios

---

#### Slice 22.6: Unified Inbox (P0)
**User Story:** As a SPAC sponsor, I can see all communications (email, SMS, iMessage) in one place.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **API** | `inbox.getUnified`, `inbox.getByContact`, `inbox.markRead` |
| **UI** | `/inbox` page with channel filters, unified thread view per contact |
| **Realtime** | Live updates when new messages arrive |

**Inbox Features:**
- Combined view of all channels
- Filter by: Email, SMS, iMessage, All
- Filter by: Unread, Needs Response, All
- Quick reply from inbox (auto-selects last channel used)
- Contact context sidebar

**Acceptance Criteria:**
- [ ] Unified inbox shows all messages across channels
- [ ] Filter by channel type
- [ ] Filter by read/unread status
- [ ] Click message to see full thread
- [ ] Reply directly from inbox
- [ ] New messages appear in real-time
- [ ] Unread count badge in navigation

---

#### Slice 22.7: Slack Integration (P0)
**User Story:** As a SPAC sponsor, I receive deal alerts and can interact with SPAC OS from Slack.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | Slack API client (webhooks, slash commands, interactive messages) |
| **Schema** | `SlackConnection` model (workspace_id, channel_mappings, notification_preferences) |
| **API** | `slack.connect`, `slack.configure`, `slack.sendAlert` |
| **UI** | Slack settings page, channel selection per alert type |

**Slack Features:**
- Deal stage change notifications
- New deal alerts
- Task reminders
- Cadence reply notifications (any channel)
- Daily/weekly digest option
- `/spacos search [company]` slash command
- `/spacos log [contact] [note]` quick logging

**Acceptance Criteria:**
- [ ] User can connect Slack workspace
- [ ] Configure which alerts go to which channels
- [ ] Alerts include action buttons (View Deal, Dismiss)
- [ ] Slash commands work for quick search and logging
- [ ] User can mute notifications per channel

---

#### Slice 22.8: Zoom Integration (P1)
**User Story:** As a SPAC sponsor, I can create Zoom meetings from SPAC OS and automatically log meeting details.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | Zoom API client (create meeting, get recordings, webhooks) |
| **Schema** | `Meeting` enhanced with zoom_meeting_id, zoom_recording_url |
| **API** | `zoom.createMeeting`, `zoom.getMeetings`, webhook handler |
| **UI** | "Create Zoom Meeting" button in meeting scheduler |

**Acceptance Criteria:**
- [ ] User can connect Zoom account
- [ ] Create Zoom meeting directly from SPAC OS
- [ ] Meeting link auto-populated in meeting record
- [ ] Zoom meeting details sync (participants, duration)
- [ ] Recording link captured when available
- [ ] Meeting auto-logged to attendee activity timelines

---

#### Slice 22.9: DocuSign E-Signatures (P1)
**User Story:** As a SPAC sponsor, I can send NDAs and LOIs for signature directly from SPAC OS.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Service** | DocuSign API client (send envelope, track status, webhooks) |
| **Schema** | `SignatureRequest` model (document_id, recipients[], status, envelope_id) |
| **API** | `signature.send`, `signature.getStatus`, `signature.download`, webhook handler |
| **UI** | "Send for Signature" button on documents, signature status tracking |

**Acceptance Criteria:**
- [ ] User can connect DocuSign account
- [ ] Send document for signature from document detail
- [ ] Add multiple signers with signing order
- [ ] Track signature status (sent, viewed, signed)
- [ ] Signed document auto-uploaded as new version
- [ ] Activity logged when signature completed

---

### Sprint 23: Advanced CRM Features (Vertical Slice)
**Status:** PLANNED  
**Duration:** 1 week
**Theme:** Enterprise-grade CRM capabilities

---

#### Slice 23.1: Pipeline Forecasting (P0)
**User Story:** As a SPAC sponsor, I can see weighted pipeline forecasts based on deal probability.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Deal` enhanced with probability_pct, expected_close_date, forecast_category |
| **API** | `forecast.getPipeline`, `forecast.getByPeriod`, `forecast.getByOwner` |
| **UI** | Forecast dashboard with weighted values, forecast vs. actual tracking |
| **Logic** | Default probabilities by stage, user can override per deal |

**Forecast Categories:**
- Commit (>90% probability)
- Best Case (50-90%)
- Pipeline (10-50%)
- Omitted (<10%)

**Acceptance Criteria:**
- [ ] Each deal has probability percentage
- [ ] Default probabilities set per stage (configurable)
- [ ] Forecast dashboard shows weighted pipeline by period
- [ ] Compare forecast to actual closed deals
- [ ] Forecast by team member
- [ ] Export forecast report

---

#### Slice 23.2: A/B Testing for Sequences (P0)
**User Story:** As a SPAC sponsor, I can test different email variants to optimize my outreach.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `SequenceStep` enhanced with variants[], split_percentage |
| **API** | `sequence.addVariant`, `sequence.getVariantStats` |
| **UI** | "Add Variant" button on email steps, variant performance comparison |
| **Logic** | Random assignment at enrollment, statistical significance calculation |

**Acceptance Criteria:**
- [ ] User can add variant (B) to any email step
- [ ] Configure split percentage (default 50/50)
- [ ] Each variant can have different subject and/or body
- [ ] Track performance per variant (opens, clicks, replies)
- [ ] Show statistical significance indicator
- [ ] "Declare winner" action to use winning variant for all future sends

---

#### Slice 23.3: Role-Based Access Control (P0)
**User Story:** As a SPAC sponsor, I can control who can see and edit what based on their role.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Role` model, `Permission` model, `UserRole` junction |
| **API** | `role.create`, `role.assignPermissions`, `user.assignRole`, permission middleware |
| **UI** | Role management in settings, permission matrix editor |

**Default Roles:**
- Admin: Full access
- Deal Lead: Full deal access, limited settings
- Analyst: View + edit deals, no delete
- Viewer: Read-only access

**Permission Categories:**
- Contacts: View, Create, Edit, Delete, Export
- Organizations: View, Create, Edit, Delete, Export
- Deals: View, Create, Edit, Delete, Change Stage
- Sequences: View, Create, Edit, Delete, Enroll
- Settings: View, Edit
- Analytics: View, Export
- Integrations: Connect, Disconnect

**Acceptance Criteria:**
- [ ] Admin can create custom roles
- [ ] Admin can assign permissions to roles
- [ ] Admin can assign roles to users
- [ ] UI elements hidden based on permissions
- [ ] API enforces permissions
- [ ] Audit log of permission changes

---

#### Slice 23.4: Activity Scoring & Lead Grading (P1)
**User Story:** As a SPAC sponsor, contacts are automatically scored based on engagement so I can prioritize outreach.

**Complete Vertical Delivery:**

| Layer | Deliverable |
|-------|-------------|
| **Schema** | `Contact` enhanced with engagement_score (computed), score_factors JSON |
| **API** | `scoring.recalculate`, `scoring.getFactors`, `scoring.configure` |
| **UI** | Score badge on contacts, score breakdown tooltip, scoring rules configuration |
| **Background** | Nightly score recalculation job |

**Scoring Factors (configurable points):**
- Email opened: +5
- Email clicked: +10
- Email replied: +25
- Meeting scheduled: +50
- Meeting completed: +75
- Call connected: +20
- Document viewed: +15
- Inbound email: +30
- Decay: -10% per 30 days of inactivity

**Acceptance Criteria:**
- [ ] Every contact has an engagement score (0-100)
- [ ] Score updates automatically on activities
- [ ] Tooltip shows score breakdown
- [ ] Admin can configure scoring weights
- [ ] Filter/sort contacts by score
- [ ] Score trends over time in analytics



---

## DATA MODELS (Complete Reference)

### Core Entities

```
SPAC
├── Basic Info (name, ticker, status)
├── Financials (trust_amount, ipo_size, per_share_value)
├── Dates (ipo_date, deadline, extension_dates)
├── Team (sponsors, directors, officers)
├── Relations → Targets, Documents, Filings, Tasks, Notes

Organization
├── Basic Info (name, legal_name, domain, logo_url)
├── Classification (type, sub_type, industry_focus, geography_focus)
├── Firmographics (headquarters, employees, revenue, aum, deal_size_range)
├── Data Quality (data_source, last_enriched, confidence_score)
├── Relations → Contacts, Deals, Mandates, OwnershipStakes, Notes

Contact
├── Personal Info (name, email, phone, mobile)
├── Professional Info (organization, title, department, seniority)
├── Social (linkedin_url, twitter_handle)
├── Deal Relevance (deal_roles, sectors_focus, deal_history)
├── Engagement (engagement_score, last_contacted, relationship_strength)
├── Relations → Organization, Interactions, Deals, Emails, Meetings

Deal (Enhanced Target)
├── Company Info (name, sector, description)
├── Financials (valuation, revenue, ebitda, multiples)
├── Scores (ai_score, management, market, financial, operational, risk)
├── Pipeline (stage, priority, probability)
├── Process (mandate_id, competing_bidders, key_contacts)
├── Relations → SPAC, Organization, Documents, Tasks, Contacts, Notes

Mandate
├── Process Info (organization, target, status, process_type)
├── Financials (estimated_ev_min, estimated_ev_max)
├── Timeline (expected_close_date)
├── Our Status (our_status, pass_reason, intelligence_notes)
├── Relations → Organization, Target, Contacts, Notes

OwnershipStake
├── Ownership Info (owner, owned, stake_type, percentage)
├── Investment Details (investment_date, entry_multiple, board_seats)
├── Status (status, exit_date, exit_multiple)

Sequence
├── Config (name, type, status, enrollment_criteria)
├── Steps → SequenceStep[]
├── Metrics (enrolled_count, completion_rate, reply_rate)

SequenceStep
├── Step Info (order, type, delay_days)
├── Content (email_template_id, task_template, conditions)

SequenceEnrollment
├── Status (sequence, contact, status, current_step)
├── Timeline (enrolled_at, last_executed, next_scheduled)

EmailTemplate
├── Content (name, subject, body_html, body_text)
├── Config (type, category, merge_fields)
├── Performance (open_rate, reply_rate, click_rate)

Document
├── Metadata (name, type, category, tags)
├── Storage (url, size, mime_type)
├── Versioning (version, parent_document_id)
├── Relations → SPAC, Deal, DocumentAnalysis

Filing
├── SEC Info (type, cik, accession_number)
├── Dates (filed_date, effective_date, due_date)
├── Status (status, sec_comments)
├── Relations → SPAC, WorkflowSteps, Reviewers, Checklist

Task
├── Content (title, description, status, priority)
├── Assignment (assigned_to, due_date)
├── Relations → SPAC, Deal, Contact

Interaction
├── Type (call, email, meeting, note, linkedin)
├── Content (subject, description, outcome)
├── Timeline (date, duration)
├── Relations → Contact, Organization, Deal

Meeting
├── Details (title, description, start_time, end_time)
├── Location (location, meeting_url)
├── Calendar IDs (google_event_id, calendly_event_id)
├── Relations → Attendees (Contacts)

Email
├── Gmail Info (message_id, thread_id)
├── Content (subject, snippet, body)
├── Direction (inbound, outbound)
├── Relations → Contact, Sequence

ActivityFeed
├── Event (type, actor, metadata)
├── Context (contact_id, organization_id, deal_id)
├── Timestamp (created_at)
```

### Enums

```
Organization Type:
PE_FIRM | IB | TARGET_COMPANY | SERVICE_PROVIDER | SPAC | OTHER

Organization Sub-Type (PE):
BUYOUT | GROWTH_EQUITY | VC | FAMILY_OFFICE | SOVEREIGN_WEALTH | HEDGE_FUND

Organization Sub-Type (IB):
BULGE_BRACKET | MIDDLE_MARKET | BOUTIQUE | REGIONAL

Contact Seniority:
C_LEVEL | VP | DIRECTOR | MANAGER | INDIVIDUAL_CONTRIBUTOR

Contact Deal Role:
DECISION_MAKER | INFLUENCER | CHAMPION | BLOCKER | GATEKEEPER

Relationship Strength:
COLD | WARM | HOT | ADVOCATE

Mandate Status:
RUMORED | CONFIRMED | ACTIVE | CLOSED | WITHDRAWN

Our Mandate Status:
MONITORING | ENGAGED | PASSED | WON | LOST

Deal Stage:
IDENTIFIED → RESEARCHING → OUTREACH → NDA_SIGNED → LOI_SIGNED → DUE_DILIGENCE → DA_SIGNED → SEC_REVIEW → CLOSING → COMPLETED | PASSED

Ownership Stake Type:
MAJORITY | MINORITY | CONTROL | GROWTH_EQUITY

Sequence Type:
PE_OUTREACH | IB_RELATIONSHIP | TARGET_DIRECT | INVESTOR_UPDATE

Sequence Step Type:
EMAIL | TASK | LINKEDIN | CALL | WAIT
```

---

## INTEGRATION STATUS

### Backend ↔ Frontend Connectivity

| tRPC Router | Status | Frontend Pages |
|-------------|--------|----------------|
| `spac` | ✅ FULLY WIRED | /spacs, /spacs/[id], /dashboard |
| `target` | ✅ FULLY WIRED | /pipeline, /pipeline/[id] |
| `document` | ✅ FULLY WIRED | /documents, /pipeline/[id] |
| `filing` | ✅ FULLY WIRED | /filings, /filings/[id], /compliance |
| `task` | ✅ FULLY WIRED | /tasks |
| `financial` | ✅ FULLY WIRED | /financial, /financial/trust, /financial/cap-table |
| `alert` | ✅ FULLY WIRED | Header notifications |
| `note` | ✅ FULLY WIRED | /pipeline/[id] |
| `contact` | ✅ FULLY WIRED | /contacts, /contacts/[id] |
| `company` | ✅ FULLY WIRED | /contacts/[id] |
| `interaction` | ✅ FULLY WIRED | /contacts/[id] |
| `email` | 🔌 INTEGRATION-READY | /contacts (requires Gmail credentials) |
| `calendar` | 🔌 INTEGRATION-READY | /contacts (requires Google Calendar credentials) |
| `organization` | 🔨 SPRINT 10 | /organizations, /organizations/[id] |
| `ownership` | 🔨 SPRINT 10 | /organizations/[id] (PE portfolio tab) |
| `activity` | 🔨 SPRINT 10 | Dashboard, organization/contact detail |
| `mandate` | 🔨 SPRINT 11 | /mandates, /organizations/[id] (IB tab) |
| `cadence` | 🔨 SPRINT 13 | /cadences, /cadences/[id] |
| `smsTemplate` | 🔨 SPRINT 13 | /templates/sms |
| `enrollment` | 🔨 SPRINT 13 | Cadence enrollment management |
| `enrichment` | 🔨 SPRINT 14-15 | Background enrichment, manual triggers |
| `checklist` | 🔨 SPRINT 16 | Deal detail checklists |
| `analytics` | 🔨 SPRINT 18 | /analytics dashboards |
| `savedFilter` | 🔨 SPRINT 21 | List sidebars, /lists |
| `import` | 🔨 SPRINT 21 | /settings/import |
| `export` | 🔨 SPRINT 21 | Export buttons on all list pages |
| `duplicate` | 🔨 SPRINT 21 | /settings/duplicates, merge wizard |
| `bulk` | 🔨 SPRINT 21 | Bulk action toolbar on list pages |
| `call` | 🔨 SPRINT 22 | Contact detail, activity timeline |
| `sms` | 🔨 SPRINT 22 | Contact detail SMS tab, /inbox |
| `imessage` | 🔨 SPRINT 22 | Contact detail iMessage tab, /inbox |
| `phone` | 🔨 SPRINT 22 | Click-to-call dialer |
| `voicemail` | 🔨 SPRINT 22 | Voicemail templates and drop |
| `inbox` | 🔨 SPRINT 22 | /inbox unified communications |
| `slack` | 🔨 SPRINT 22 | /settings/integrations |
| `zoom` | 🔨 SPRINT 22 | Meeting scheduler |
| `signature` | 🔨 SPRINT 22 | Document detail, signature tracking |
| `forecast` | 🔨 SPRINT 23 | /analytics/forecast |
| `role` | 🔨 SPRINT 23 | /settings/roles |
| `scoring` | 🔨 SPRINT 23 | Contact scores, /settings/scoring |

### External Integrations

| Integration | Status | Sprint | Purpose |
|------------|--------|--------|---------|
| Clerk | ✅ LIVE | 1 | Authentication |
| Supabase | ✅ LIVE | 1 | Database, Storage, Realtime |
| Gmail API | 🔌 READY | 8 | Email sync and send |
| Google Calendar | 🔌 READY | 8 | Calendar sync |
| Calendly | 🔌 READY | 8 | Meeting scheduling |
| SEC EDGAR | ✅ LIVE | 6 | Filing data |
| Claude API | ✅ LIVE | 5 | AI analysis |
| PitchBook | 🔨 PLANNED | 14 | PE/IB/Deal data |
| Apollo.io | 🔨 PLANNED | 15 | Contact enrichment |
| NewsAPI | 🔨 PLANNED | 17 | News monitoring |
| Web Push | 🔨 PLANNED | 19 | Push notifications |
| Microsoft 365 | 🔨 PLANNED | 22 | Outlook email + calendar |
| Twilio SMS | 🔨 PLANNED | 22 | Text messaging |
| Blue.io | 🔨 PLANNED | 22 | iMessage integration |
| Twilio Voice | 🔨 PLANNED | 22 | Click-to-call dialer |
| Slack | 🔨 PLANNED | 22 | Notifications + commands |
| Zoom | 🔨 PLANNED | 22 | Video meetings |
| DocuSign | 🔨 PLANNED | 22 | E-signatures |

---

## TECHNICAL STACK

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
| Background Jobs | Supabase Edge Functions |
| Realtime | Supabase Realtime |
| PDF | react-pdf, pdfjs-dist, jsPDF |
| AI | Anthropic Claude API |
| Email | Gmail API, Resend |
| Calendar | Google Calendar API, Calendly API |
| Data Providers | PitchBook, Crunchbase, Apollo.io |
| Testing | Playwright (E2E), Vitest (Unit) |
| Deployment | Vercel |
| Monitoring | Sentry, Datadog |

---

## SUCCESS METRICS

### Platform Health
| Metric | Target |
|--------|--------|
| Page Load Time | < 2s |
| API Response Time | < 500ms |
| Test Coverage | > 80% |
| Lighthouse Score | > 90 |
| Uptime | 99.9% |

### CRM Effectiveness
| Metric | Target |
|--------|--------|
| Contact Data Completeness | > 90% |
| Email Deliverability | > 95% |
| Sequence Completion Rate | > 60% |
| Response Rate (Cold Outreach) | > 15% |

### Deal Performance
| Metric | Target |
|--------|--------|
| Deals Sourced per Month | > 20 |
| Deals in Active Pipeline | > 10 |
| Average Time in Pipeline | < 6 months |
| Win Rate (LOI to Close) | > 30% |

---

## COMPETITIVE POSITIONING

### vs. Generic CRMs (Salesforce, HubSpot)
- **SPAC OS Advantage:** Purpose-built for SPAC deal flow with SEC compliance, deal stage workflows, and financial modeling integration
- **They Lack:** SPAC lifecycle tracking, SEC filing integration, trust account management, de-SPAC specific workflows

### vs. Deal Management Tools (DealCloud, Navatar)
- **SPAC OS Advantage:** Modern UX, AI-powered analysis, integrated CRM with sequences, real-time data enrichment
- **They Lack:** Automated outreach, AI deal scoring, integrated email/calendar

### vs. Building In-House
- **SPAC OS Advantage:** 10+ sprints of development already complete, best practices baked in, continuous updates
- **They Lack:** Time and resources to build; we've done it

---

## CHANGELOG

### v5.0 (February 4, 2026)
- **MAJOR REVISION:** Converted to Vertical Slice development methodology
- Each sprint now contains 4-5 complete vertical slices (Schema → API → UI → Seed → Tests)
- Removed horizontal "Track A/B/C" structure
- Every slice delivers demo-able, end-to-end functionality

**Sprint Restructuring (14 Sprints Total):**
| Sprint | Theme | Slices |
|--------|-------|--------|
| 10 | PE Firm Management | 4 slices |
| 11 | IB Management | 4 slices |
| 12 | Target Companies | 4 slices |
| 13 | Outreach Sequences | 5 slices |
| 14 | PitchBook Enrichment | 4 slices |
| 15 | Contact Enrichment | 3 slices |
| 16 | Deal Workflows | 4 slices |
| 17 | Intelligence & Alerts | 3 slices |
| 18 | Analytics & Reporting | 4 slices |
| 19 | Mobile & Notifications | 2 slices |
| 20 | Production Hardening | 3 slices |
| 21 | CRM Parity - Part 1 | 4 slices |
| 22 | CRM Parity - Part 2 | 5 slices |
| 23 | Advanced CRM | 4 slices |

**HubSpot CRM Feature Parity:**
- ✅ Contact/Organization Management (Sprint 10-12)
- ✅ Email Templates & Multi-Channel Cadences (Sprint 13)
- ✅ SMS Text Messaging via Twilio (Sprint 13, 22)
- ✅ iMessage via Blue.io (Sprint 13, 22)
- ✅ Phone Dialer with Click-to-Call (Sprint 22)
- ✅ Voicemail Drop (Sprint 22)
- ✅ Unified Inbox - Email/SMS/iMessage (Sprint 22)
- ✅ Meeting Scheduling (Sprint 8 - existing)
- ✅ Data Enrichment (Sprint 14-15)
- ✅ Activity Timeline & Scoring (Sprint 10, 23)
- ✅ Pipeline Analytics & Forecasting (Sprint 18, 23)
- ✅ List Segmentation / Smart Lists (Sprint 21)
- ✅ Import/Export & Data Migration (Sprint 21)
- ✅ Duplicate Detection & Merge (Sprint 21)
- ✅ Bulk Operations (Sprint 21)
- ✅ Microsoft 365 / Outlook Integration (Sprint 22)
- ✅ Slack Integration (Sprint 22)
- ✅ Zoom Integration (Sprint 22)
- ✅ DocuSign E-Signatures (Sprint 22)
- ✅ A/B Testing for Cadences (Sprint 23)
- ✅ Role-Based Access Control (Sprint 23)
- ✅ Lead Scoring / Engagement Scoring (Sprint 23)

**SPAC-Specific Features (Beyond HubSpot):**
- PE Firm tracking with AUM, fund lifecycle, portfolio companies
- IB tracking with sector coverage, active mandates
- Ownership stake tracking (who owns what, exit windows)
- Mandate tracking (sell-side processes)
- SEC filing integration
- Trust account management
- Deal stage checklists mapped to SPAC workflow
- Compliance calendar
- PitchBook integration for market data
- M&A comparable transactions database

### v4.8 (February 3, 2026)
- Sprint 9 marked COMPLETED
- Phase 5 Sprint 9 complete (Integration Completion)
- E2E Tests: 18 new tests passing

---

## APPENDIX A: SPAC Deal Lifecycle Support

The following checklist items from the Soren Deal Flow document are supported by SPAC OS:

### Pre-Deal Screening ✅
- [ ] Founder motivation understood → Contact notes + Deal fields
- [ ] EBITDA quality sanity-checked → AI analysis + financial data
- [ ] Regulatory risk screened → Compliance module
- [ ] Timeline pressure identified → Deal timeline fields
- [ ] NDA executed → Document management + DocuSign (Sprint 18)

### Initial Diligence ✅
- [ ] Monthly financials received → Document upload
- [ ] Debt schedule + covenants → Document storage
- [ ] Payer mix / customer concentration → Deal analysis
- [ ] Management org chart → Contact relationship mapping

### Structure Agreement ✅
- [ ] EV range agreed → Deal valuation fields
- [ ] Net debt definition agreed → Deal notes
- [ ] Rollover percentage agreed → Deal structure fields
- [ ] PIPE sizing defined → Financial module

### LOI Phase ✅
- [ ] EV and structure memorialized → Document versioning
- [ ] Minimum cash condition included → Deal checklist
- [ ] Exclusivity period defined → Deal timeline
- [ ] Expense allocation agreed → Deal notes

### Diligence Phase ✅
- [ ] Quality of earnings completed → Document management
- [ ] PCAOB audit readiness confirmed → Checklist
- [ ] Working capital mechanics finalized → Documents
- [ ] Tax structuring finalized → Documents
- [ ] Cybersecurity review completed → Checklist

### Definitive Agreement Phase ✅
- [ ] Merger agreement drafted → Document management
- [ ] PIPE subscription agreements executed → Documents
- [ ] Sponsor agreements finalized → Documents
- [ ] S-4 filed → SEC filing module

### Closing Phase ✅
- [ ] SEC comments resolved → Filing tracker
- [ ] Shareholder vote completed → Task management
- [ ] Redemptions finalized → Financial module
- [ ] Super 8-K filed → Filing module

---

## APPENDIX B: PE Firm Tracking Fields

For each PE firm tracked in SPAC OS:

**Identification:**
- Firm name, legal name
- Headquarters location
- Website, LinkedIn

**Investment Profile:**
- AUM (Assets Under Management)
- Fund vintage years
- Typical check size range
- Industry focus areas
- Geographic focus
- Stage focus (Buyout, Growth, etc.)

**Team:**
- Key partners (linked as Contacts)
- Sector leads
- Operating partners

**Portfolio:**
- Active portfolio companies (with ownership %)
- Entry dates and estimated multiples
- Board representation
- Exit timeline projections

**Relationship:**
- Our contacts at the firm
- Interaction history
- Relationship strength score
- Deals we've discussed

**Intelligence:**
- Recent news
- Recent exits
- Funds approaching end of life
- Known processes they're running

---

## APPENDIX C: IB Coverage Tracking

For each Investment Bank tracked in SPAC OS:

**Identification:**
- Bank name
- Type (Bulge Bracket, Middle Market, Boutique)
- Headquarters, key offices

**Coverage:**
- Sector coverage teams
- Key bankers by sector (linked as Contacts)
- Healthcare-specific coverage

**Activity:**
- Active mandates we're aware of
- Recent closed transactions
- League table rankings

**Relationship:**
- Our contacts at the bank
- Meetings and interactions
- Deals they've shown us
- Our response rate / pass reasons

**Intelligence:**
- Bankers who move firms
- New mandates announced
- Process updates

---

## APPENDIX D: Target Company Tracking

For each potential target company:

**Identification:**
- Company name, legal name
- Website, headquarters
- Industry classification (NAICS, SIC)

**Financials (from data providers + uploads):**
- Revenue (historical + projected)
- EBITDA (adjusted)
- Growth rates
- Key financial ratios

**Ownership:**
- Current shareholders
- PE backing (if any)
- Founder ownership %
- Employee ownership

**Team:**
- CEO, CFO, key executives
- Board members
- Advisors

**Deal Suitability:**
- Fit score vs. target box
- Key attractions
- Key risks
- Regulatory considerations

**Process Status:**
- Is there an active process?
- Who's running it?
- Our status (monitoring, engaged, passed)
- Competitive dynamics

---

*End of Document*

---

## APPENDIX E: HubSpot CRM Feature Comparison

Complete mapping of HubSpot CRM features to SPAC OS implementation:

### Contact & Company Management

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Contact records | ✅ | 8 | Enhanced in Sprint 10-12 with organization linking |
| Company records | ✅ | 10-12 | Organization model with PE/IB/Target classification |
| Custom properties | ✅ | 10 | Schema supports custom fields via JSON |
| Contact owner assignment | ✅ | 8 | Owner field on Contact |
| Lifecycle stages | ✅ | 8 | Status: Lead → Prospect → Active → Inactive |
| Lead status | ✅ | 8 | Relationship strength: Cold → Warm → Hot → Advocate |
| Activity timeline | ✅ | 10 | ActivityFeed model with real-time updates |
| Notes | ✅ | Existing | Note model linked to contacts/deals |
| Tasks | ✅ | 7 | Full task management with due dates |
| Associations | ✅ | 10 | Contact ↔ Organization ↔ Deal relationships |

### Communication

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Gmail integration | ✅ | 8 | Bidirectional sync, send, tracking |
| Outlook integration | ✅ | 22 | Microsoft Graph API |
| Email tracking (opens) | ✅ | 13 | Tracking pixel in cadence emails |
| Email tracking (clicks) | ✅ | 13 | Link wrapping for click tracking |
| Email templates | ✅ | 13 | Rich text with merge fields |
| Email scheduling | ✅ | 13 | Cadence delays + one-off scheduling |
| SMS messaging | ✅ | 13, 22 | Twilio integration, templates, tracking |
| iMessage | ✅ | 13, 22 | Blue.io integration (beyond HubSpot!) |
| Calling | ✅ | 22 | Full dialer with click-to-call, recording |
| Voicemail drop | ✅ | 22 | Pre-recorded voicemail templates |
| Meeting scheduling | ✅ | 8 | Google Calendar + Calendly + Zoom |
| Unified inbox | ✅ | 22 | Email + SMS + iMessage in one view |
| Live chat | ❌ | - | Not applicable to SPAC workflow |

### Automation & Cadences

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Sequences | ✅ | 13 | Called "Cadences" - multi-channel |
| Multi-channel outreach | ✅ | 13 | Email + SMS + iMessage + Call + Task |
| Enrollment triggers | ✅ | 13 | Manual + bulk + list-based |
| Unenrollment rules | ✅ | 13 | Auto-pause on reply (any channel) |
| Send windows | ✅ | 13 | Business hours, timezone, skip weekends |
| Task creation | ✅ | 13 | Task steps in cadences |
| Call tasks with scripts | ✅ | 13 | Call step with script display |
| Cadence reporting | ✅ | 13 | Funnel analytics, per-channel metrics |
| A/B testing | ✅ | 23 | Subject/body variants with stats |
| Workflows (advanced) | ⚠️ | Future | Deal stage workflows only (Sprint 16) |

### Pipeline & Deals

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Deal pipeline | ✅ | Existing | 10-stage SPAC-specific pipeline |
| Multiple pipelines | ✅ | Existing | Per SPAC pipeline |
| Deal stages | ✅ | Existing | IDENTIFIED through CLOSING |
| Deal properties | ✅ | Existing | Valuation, multiples, scores |
| Stage requirements | ✅ | 16 | Checklists per stage |
| Forecasting | ✅ | 23 | Weighted pipeline with probability |
| Deal owner | ✅ | Existing | Assignment tracking |
| Deal activities | ✅ | 16 | Deal-specific activity feed |

### Lists & Segmentation

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Static lists | ✅ | 21 | SavedFilter with is_dynamic=false |
| Active/smart lists | ✅ | 21 | SavedFilter with is_dynamic=true |
| List filters | ✅ | 21 | Full filter criteria support |
| List membership | ✅ | 21 | Used for sequence enrollment |
| List export | ✅ | 21 | Export filtered results |

### Reporting & Analytics

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Dashboards | ✅ | 18 | Pipeline, relationship, activity dashboards |
| Custom reports | ⚠️ | 18 | Predefined reports, limited custom |
| Deal reports | ✅ | 18 | Pipeline analytics, win/loss |
| Activity reports | ✅ | 18 | Team activity metrics |
| Email reports | ✅ | 13 | Sequence performance |
| Forecast reports | ✅ | 23 | Weighted pipeline forecast |
| Export to PDF | ✅ | 18 | Board report generation |

### Data Management

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Import contacts | ✅ | 21 | CSV/Excel with field mapping |
| Import companies | ✅ | 21 | CSV/Excel with field mapping |
| Export data | ✅ | 21 | CSV/Excel with column selection |
| Duplicate management | ✅ | 21 | Detection + merge wizard |
| Bulk edit | ✅ | 21 | Update any field in bulk |
| Bulk delete | ✅ | 21 | With confirmation |
| Data sync | ✅ | 14-15 | PitchBook, Apollo enrichment |

### Integrations

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Slack | ✅ | 22 | Alerts + slash commands |
| Zoom | ✅ | 22 | Create meetings, sync recordings |
| Google Workspace | ✅ | 8 | Gmail + Calendar |
| Microsoft 365 | ✅ | 22 | Outlook + Calendar |
| Calendly | ✅ | 8 | Scheduling links |
| DocuSign | ✅ | 22 | Send + track signatures |
| Zapier | ❌ | Future | Potential future integration |
| Salesforce sync | ❌ | - | Not needed (we're the CRM) |

### Admin & Security

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| User management | ✅ | 1 | Via Clerk |
| Teams | ⚠️ | 23 | Basic via RBAC |
| Roles & permissions | ✅ | 23 | Full RBAC with custom roles |
| Audit logs | ✅ | 20 | Security hardening sprint |
| SSO | ✅ | 1 | Via Clerk (Google, Microsoft) |
| Two-factor auth | ✅ | 1 | Via Clerk |

### Mobile

| HubSpot Feature | SPAC OS | Sprint | Notes |
|-----------------|---------|--------|-------|
| Mobile app | ⚠️ | 19 | Mobile web (not native app) |
| Contact lookup | ✅ | 19 | Mobile-optimized |
| Call logging | ✅ | 22 | Works on mobile |
| Task management | ✅ | 19 | Mobile-optimized |
| Push notifications | ✅ | 19 | Web push |

### SPAC OS Exclusive Features (Not in HubSpot)

| Feature | Sprint | Description |
|---------|--------|-------------|
| iMessage Integration | 22 | Blue.io iMessage for higher engagement than SMS |
| Multi-Channel Cadences | 13 | Email + SMS + iMessage + Call in one workflow |
| PE Firm Tracking | 10 | AUM, funds, portfolio companies, exit windows |
| IB Tracking | 11 | Sector coverage, bankers, active mandates |
| Ownership Intelligence | 10, 12 | Who owns what, PE backing, hold periods |
| Mandate Tracking | 11 | Sell-side processes, our engagement status |
| SEC Filing Integration | 6 | EDGAR data, compliance deadlines |
| Trust Account Management | 7 | Balance tracking, per-share value |
| Deal Fit Scoring | 12 | AI-powered target fit analysis |
| PitchBook Integration | 14 | M&A transactions, PE data |
| Deal Signal Detection | 17 | Exit windows, leadership changes |
| SPAC-Specific Workflows | 16 | Stage checklists for de-SPAC process |
