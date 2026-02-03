# Sprint 9 Plan: Integration Completion & Vertical Slice Fixes

**Sprint Number:** 9
**Sprint Name:** Integration Completion & Testing
**Status:** IN PROGRESS
**Branch:** `feature/sprint-9-integration-fixes`
**Start Date:** February 3, 2026

---

## Sprint Goal

Complete all missing integrations identified in the vertical slice audit: wire mock data to real tRPC, add missing navigation, integrate orphaned components, and ensure every feature is accessible from the main UI.

---

## Origin: Vertical Slice Audit Findings

This sprint was initiated after a comprehensive vertical slice audit revealed:

| Category | Count | Description |
|----------|-------|-------------|
| Hidden Navigation | 2 | Tasks, Compliance pages not in sidebar |
| Filing Detail Mock Data | 6 | getMockFilingData() returns mock for workflow, checklist, docs, comments, amendments, reviewers |
| Dashboard Mock Data | 5 | mockActivityData, mockAIInsightsData, mockSpacStatusData.milestones, hardcoded user/team |
| Orphaned Components | 10 | Built but never imported into any page |
| PRD Sprint 9 Items | 3 | CRM E2E tests, Gmail/Calendar credential wiring |

---

## Tracks

### Track A: Navigation & Quick Fixes ✅
- [x] A1. Add Tasks link to sidebar
- [x] A2. Add Compliance link to sidebar
- [x] A3. Fix dashboard user data (use Clerk)

### Track B: Filing Detail Page Wiring ✅
- [x] B1. Add FilingWorkflowStep, FilingReviewer, FilingChecklist models to schema
- [x] B2. Add tRPC procedures: getWorkflow, getReviewers, getChecklist, etc.
- [x] B3. Wire filing detail page to real tRPC data
- [x] B4. Add seed data for filing workflow

### Track C: Dashboard Wiring ✅
- [x] C1. Replace mockActivityData with computed recentActivities
- [x] C2. Add AI Insights placeholder (no real endpoint yet)
- [x] C3. Wire milestones to real SPAC data
- [x] C4. Use Clerk for user data instead of hardcoded

### Track D: Orphaned Component Integration 🔄
- [ ] D1. Integrate filing components (CreateFilingModal, DeadlineAlerts)
- [ ] D2. Integrate dashboard components (ComplianceCalendar, DeadlineCountdown)
- [ ] D3. Clean up unused components

### Track E: E2E Tests & Documentation 🔄
- [ ] E1. CRM E2E tests
- [ ] E2. Email/Calendar E2E tests
- [ ] E3. Sprint completion documentation

---

## Schema Changes

Added to `prisma/schema.prisma`:

```prisma
model FilingWorkflowStep {
  id            String    @id @default(cuid())
  filingId      String
  name          String
  description   String?
  status        String    @default("pending")
  order         Int
  dueDate       DateTime?
  completedAt   DateTime?
  completedById String?
  // ... relations
}

model FilingReviewer {
  id         String    @id @default(cuid())
  filingId   String
  userId     String?
  name       String?
  email      String?
  role       String
  status     String    @default("pending")
  comments   String?
  reviewedAt DateTime?
  // ... relations
}

model FilingChecklist {
  id          String    @id @default(cuid())
  filingId    String
  item        String
  category    String?
  description String?
  isCompleted Boolean   @default(false)
  completedAt DateTime?
  completedBy String?
  order       Int       @default(0)
  dueDate     DateTime?
  // ... relations
}
```

---

## Files Modified

### Phase 1 (Quick Wins)
- `src/components/layout/Sidebar.tsx` - Added Tasks, Compliance links
- `prisma/schema.prisma` - Added 3 new models + relations to Filing

### Phase 2 (Major Wiring)
- `src/server/api/routers/filing.router.ts` - Added 8 new procedures
- `src/app/(dashboard)/filings/[id]/page.tsx` - Removed mock, wired to tRPC
- `src/app/(dashboard)/dashboard/page.tsx` - Removed mock data, added Clerk
- `prisma/seed.ts` - Added filing workflow seed data

---

## Acceptance Criteria

### Navigation ✅
- [x] Tasks link visible in sidebar → navigates to /tasks
- [x] Compliance link visible in sidebar → navigates to /compliance

### Filing Detail Page ✅
- [x] No `getMockFilingData()` function in file
- [x] Workflow tab shows real steps from DB
- [x] Checklist tab shows real items from DB
- [x] Reviewers section shows real data

### Dashboard ✅
- [x] No mock data arrays in file
- [x] Activity feed shows real recent items
- [x] User name from Clerk (not hardcoded)

### E2E Tests (Pending)
- [ ] CRM tests pass
- [ ] Email UI tests pass
- [ ] Calendar UI tests pass

---

## Verification

```bash
npm run build        # Must pass
npm run lint         # No errors
npm run test:e2e     # All tests pass
```

---

*Sprint created: February 3, 2026*
*Based on: Vertical Slice Audit findings*
