# Sprint 7 Plan

**Sprint Number:** 7
**Sprint Name:** Financial Module + Critical Wiring
**Start Date:** February 3, 2026
**Completion Date:** February 3, 2026
**Status:** ✅ COMPLETE
**Branch:** `feature/sprint-7-financial-wiring`

---

## Sprint Goal

Deliver the Financial Module (trust accounts, cap table) while fixing critical frontend/backend disconnects discovered post-Sprint 6.

## SPRINT COMPLETION SUMMARY

All P0 and P1 tasks completed:

### Track A (Critical Wiring) - ✅ COMPLETE
- [x] A1. Filings Page Wiring
- [x] A2. Compliance Calendar Wiring
- [x] A3. Dashboard Mock Data Wiring
- [x] A4. Tasks Page Wiring
- [x] A5. Filing Detail Page Wiring

### Track B (Financial Module) - ✅ COMPLETE
- [x] B1. Trust Account Dashboard
- [x] B2. Cap Table Management
- [x] B3. Financial Dashboard

### Build Status: ✅ PASSING

---

## Two-Track Approach

This sprint runs two parallel tracks:
- **Track A (P0):** Critical Wiring - Fix frontend/backend disconnects
- **Track B (P1):** Financial Module - New features per PRD

---

## Track A: Critical Wiring (P0)

### Background
Post-Sprint 6 audit revealed several pages using mock data or placeholder content despite backend services being built. These must be fixed for the app to be usable.

### A1. Filings Page Wiring ✅ DONE (this session)
**File:** `src/app/(dashboard)/filings/page.tsx`

**Changes Made:**
- Replaced "Coming Soon" placeholder with functional FilingList component
- Wired to `trpc.filing.list` and `trpc.filing.getStatistics`
- Added status change mutations, delete functionality
- Added stats cards (total, in progress, filed, SEC comments)

**Acceptance Criteria:**
- [ ] Navigate to /filings - page shows real filing data (or empty state)
- [ ] Create, edit, delete filings works
- [ ] Status changes work

### A2. Compliance Calendar Wiring ✅ DONE (this session)
**File:** `src/app/(dashboard)/compliance/page.tsx`

**Changes Made:**
- Replaced `generateMockCalendarEvents(25)` with real SPAC/filing data
- Added `trpc.spac.list` and `trpc.filing.list` queries
- SPAC filter dropdown populated from real data

**Acceptance Criteria:**
- [ ] Navigate to /compliance - calendar shows real SPAC deadlines
- [ ] SPAC filter shows actual SPACs from database

### A3. Dashboard Mock Data Wiring
**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Current State:** Uses 5 mock imports:
- `mockActivityData` → Keep mock (needs activity aggregation API)
- `mockAIInsightsData` → Keep mock (future AI feature)
- `mockComplianceData` → Derive from compliance queries
- `mockSpacStatusData.milestones` → Keep mock (no milestone API)
- `mockTrustAccountData.balanceHistory` → Wire to `trpc.financial.trustAccountGetBalanceHistory`

**Changes Required:**
1. Add financial router to tRPC root router (currently missing)
2. Add balance history query
3. Transform data to widget format

**Acceptance Criteria:**
- [ ] Trust account widget shows real balance history (or generated from trust amount)
- [ ] No console errors from missing data

### A4. Tasks Page Wiring
**File:** `src/app/(dashboard)/tasks/page.tsx`

**Current State:** Uses `mockTasks` array

**Changes Required:**
1. Replace mock with `trpc.task.list`
2. Add `trpc.task.updateStatus` mutation
3. Add `trpc.task.create` mutation
4. Add task filters (status, assignee, due date)

**Acceptance Criteria:**
- [ ] Navigate to /tasks - shows real tasks from database
- [ ] Can create new tasks
- [ ] Can update task status
- [ ] Filters work

### A5. Filing Detail Page Wiring
**File:** `src/app/(dashboard)/filings/[id]/page.tsx`

**Current State:** Uses `getMockFilingData()` function

**Changes Required:**
1. Replace mock with `trpc.filing.getById`
2. Wire status changes to `trpc.filing.updateStatus`
3. Display real SEC comments

**Acceptance Criteria:**
- [ ] Navigate to /filings/[id] - shows real filing details
- [ ] Status changes work
- [ ] SEC comments display

---

## Track B: Financial Module (P1)

### Per PRD v4.5 Sprint 7 Scope

### B1. Trust Account Dashboard
**File:** `src/app/(dashboard)/financial/trust/page.tsx`

**Features:**
- Trust account overview with current balance
- Balance history chart (line/area chart)
- Per-share value tracking
- Interest accrual display
- Withdrawal and extension tracking

**Endpoints to Use:**
- `trpc.financial.trustAccountList`
- `trpc.financial.trustAccountGetLatest`
- `trpc.financial.trustAccountGetBalanceHistory`
- `trpc.financial.trustAccountRecordBalance`

**Acceptance Criteria:**
- [ ] Navigate to /financial/trust - shows trust account summary
- [ ] Balance history chart displays
- [ ] Can record balance updates
- [ ] Per-share value calculated and displayed

### B2. Cap Table Management
**File:** `src/app/(dashboard)/financial/cap-table/page.tsx`

**Features:**
- Cap table entries list
- Grouped by share class
- Grouped by holder type
- Summary view with totals
- Ownership percentage display

**Endpoints to Use:**
- `trpc.financial.capTableList`
- `trpc.financial.capTableGetSummary`
- `trpc.financial.capTableCreate`
- `trpc.financial.capTableUpdate`
- `trpc.financial.capTableDelete`

**Acceptance Criteria:**
- [ ] Navigate to /financial/cap-table - shows cap table entries
- [ ] Summary by share class displays
- [ ] Summary by holder type displays
- [ ] Can add/edit/delete entries

### B3. Financial Dashboard
**File:** `src/app/(dashboard)/financial/page.tsx`

**Features:**
- Replace placeholder with summary widgets
- Trust account summary card
- Cap table summary card
- Links to detailed pages
- Key metrics (total trust, shares outstanding, redemption rate)

**Acceptance Criteria:**
- [ ] Navigate to /financial - shows summary dashboard
- [ ] Trust account summary displays current balance
- [ ] Cap table summary shows total shares/ownership
- [ ] Links navigate to detail pages

### B4. Redemption Calculator (Stretch)
**File:** To be created if time permits

**Features:**
- Calculate redemption scenarios
- Show trust impact
- Display dilution effects

**Endpoints to Use:**
- `trpc.financial.redemptionList`
- `trpc.financial.redemptionCreate`
- `trpc.financial.redemptionGetHistory`

**Acceptance Criteria:**
- [ ] Can input redemption parameters
- [ ] Shows calculated trust impact
- [ ] Shows dilution effects

---

## Dependencies

### Must Fix First (Before Track B)
1. **Financial router not in tRPC root** - Need to add `financial: financialRouter` to app router

### Database
- All financial models already exist in Prisma schema:
  - TrustAccount
  - CapTableEntry
  - Warrant
  - Redemption
  - PipeInvestor
  - Earnout

### Components
- Existing chart components (Recharts) can be reused
- Existing Card/Table components available

---

## Vertical Slice Breakdown

### Day 1-2: Fix Router + Dashboard Wiring
1. Add financial router to tRPC
2. Complete dashboard balance history wiring
3. Test dashboard displays real trust data

### Day 3-4: Tasks Page + Financial Dashboard
1. Wire tasks page to task router
2. Create financial dashboard page
3. Add trust/cap table summary widgets

### Day 5-6: Trust Account Dashboard
1. Create trust account detail page
2. Add balance history chart
3. Add balance recording form

### Day 7-8: Cap Table Management
1. Create cap table list view
2. Add summary by class/holder
3. Add CRUD operations

### Day 9-10: Filing Detail + Polish
1. Wire filing detail page
2. E2E tests for new pages
3. Bug fixes and polish

---

## Carryover from Sprint 6

### QA Issues to Address (if time)
- S6-001: SEC EDGAR rate limiter serverless safety (P1)
- S6-006: Header trpcUtils usage order (P2)

### Product Review Recommendations
- WebSocket notifications (defer to future)
- PDF save to documents (defer to future)
- Calendar event density (consider in Track B)

---

## Success Criteria

### Minimum (Must Have)
- [ ] Financial router accessible via tRPC
- [ ] Dashboard trust widget shows real data
- [ ] Tasks page wired to real data
- [ ] Financial dashboard shows summary
- [ ] Trust account page functional
- [ ] Cap table page functional

### Target (Should Have)
- [ ] Filing detail page wired
- [ ] Balance recording works
- [ ] Cap table CRUD complete
- [ ] E2E tests for Track A items

### Stretch (Nice to Have)
- [ ] Redemption calculator
- [ ] Sprint 6 QA issues fixed
- [ ] Activity feed real data

---

## Verification Plan

### Build Gate
```bash
npm run build   # Must pass
npm run lint    # Warnings OK, no errors
npm run test:e2e # E2E tests pass
```

### Manual Testing
1. /dashboard - Trust widget displays balance (real or generated)
2. /tasks - Task list loads from database
3. /filings - List shows real filings
4. /filings/[id] - Detail shows real data
5. /financial - Summary dashboard displays
6. /financial/trust - Trust account detail page works
7. /financial/cap-table - Cap table displays and CRUD works

---

*Plan created: February 3, 2026*
