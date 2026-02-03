# Sprint 3: Deal Pipeline

**Sprint Number:** 3
**Sprint Name:** Deal Pipeline
**Duration:** February 3-4, 2026
**Branch:** `feature/sprint-3-deal-pipeline`
**PRD Version:** v4.1

---

## Sprint Goal

Build a visual deal pipeline with Kanban board for tracking acquisition targets and detailed target company profiles integrated with SPAC relationships.

---

## Features to Build

### Feature 1: Deal Pipeline Kanban Board

**Description:** A drag-and-drop Kanban board for visualizing and managing the deal pipeline across lifecycle stages.

**Acceptance Criteria:**
- [ ] Pipeline page at `/pipeline` displays Kanban board layout
- [ ] Columns represent deal stages: PROSPECT, OUTREACH, NDA_SIGNED, LOI_SIGNED, DUE_DILIGENCE, DA_SIGNED, CLOSING, COMPLETED, PASSED
- [ ] Deal cards display: target name, SPAC association, stage, key metrics (valuation, sector)
- [ ] Drag-and-drop moves deals between stages with optimistic UI updates
- [ ] Stage changes persist to database via tRPC mutation
- [ ] Visual indicators for deal health (days in stage, deadline proximity)
- [ ] Filter by: SPAC, sector, date range
- [ ] Search deals by company name or ticker
- [ ] "Add Deal" button opens quick-create modal
- [ ] Mobile-responsive column layout (horizontal scroll on mobile)

**Technical Requirements:**
- Use `@dnd-kit/core` for drag-and-drop (already installed)
- Integrate with existing `target.ts` tRPC router
- Add `updateStage` mutation with audit logging
- Implement optimistic updates with React Query

---

### Feature 2: Target Company Profiles

**Description:** Detailed profile pages for acquisition target companies with comprehensive information display.

**Acceptance Criteria:**
- [ ] Target detail page at `/pipeline/[id]` shows full company profile
- [ ] Header section: company name, logo placeholder, sector, status badge
- [ ] Overview tab: description, key metrics, AI score (placeholder), contact info
- [ ] Financials tab: valuation, enterprise value, revenue, EBITDA, multiples (EV/Revenue, EV/EBITDA)
- [ ] Documents tab: list of associated documents (links to Sprint 4)
- [ ] Activity tab: timeline of status changes, notes, interactions
- [ ] SPAC Association section: linked SPAC with quick navigation
- [ ] Edit button opens edit form with validation
- [ ] Delete with confirmation modal
- [ ] Breadcrumb navigation back to pipeline

**Technical Requirements:**
- Extend `target.ts` router with `getById` including relations
- Add activity/notes system to Target model if needed
- Reuse UI components from SPAC detail page pattern
- Format financial numbers with proper currency/abbreviations

---

### Feature 3: Deal Quick Actions

**Description:** Quick action workflows for common deal operations.

**Acceptance Criteria:**
- [ ] Quick-create deal modal from pipeline page
- [ ] Quick-edit deal modal (inline from Kanban card)
- [ ] Bulk status update (select multiple, change stage)
- [ ] Quick notes: add note without opening full profile
- [ ] Stage transition confirmation for critical stages (DA_SIGNED, CLOSING)

**Technical Requirements:**
- Modal components with form validation
- Batch mutation endpoint for bulk updates
- Confirmation dialogs for destructive/critical actions

---

### Feature 4: Pipeline Analytics Widget

**Description:** Summary statistics for the deal pipeline displayed on dashboard and pipeline page.

**Acceptance Criteria:**
- [ ] Pipeline summary card showing: total deals, deals by stage, conversion rates
- [ ] Deals added this week/month metric
- [ ] Average time in each stage
- [ ] Integration with main dashboard page
- [ ] Pipeline page header shows key stats

**Technical Requirements:**
- Add `getStats` query to target router
- Aggregate queries for stage counts and timing metrics
- Reusable stats component

---

## Dependencies

### From Previous Sprints
- ✅ Sprint 1: Authentication, database, dashboard shell
- ✅ Sprint 2: SPAC management, tRPC infrastructure, UI components

### External Dependencies
- `@dnd-kit/core` - Already installed for drag-and-drop
- Existing `Target` Prisma model with all required fields
- Existing `target.ts` router with base CRUD operations

### Carryover Items (Address if time permits)
- Add unit tests for tRPC routers
- Add skeleton loaders for loading states
- Fix high-priority lint warnings

---

## Technical Notes

### Existing Infrastructure to Leverage
```
- src/server/api/routers/target.ts - Base CRUD operations
- src/server/api/routers/target.router.ts - Extended operations
- prisma/schema.prisma - Target model with relations
- src/components/ui/* - Reusable UI components
- src/lib/trpc/* - tRPC client setup
```

### Target Model Fields (from Prisma schema)
```prisma
model Target {
  id              String   @id @default(cuid())
  spacId          String
  name            String
  description     String?
  sector          String?
  status          TargetStatus @default(IDENTIFIED)
  valuation       Decimal?
  enterpriseValue Decimal?
  revenue         Decimal?
  ebitda          Decimal?
  evRevenue       Decimal?
  evEbitda        Decimal?
  aiScore         Decimal?
  overallScore    Decimal?
  probability     Decimal?
  // ... relations
}
```

### TargetStatus Enum Values
```
IDENTIFIED, RESEARCHING, OUTREACH, NDA_SIGNED, LOI_SIGNED,
DUE_DILIGENCE, DA_SIGNED, CLOSING, COMPLETED, PASSED
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] No TypeScript errors
- [ ] No lint errors (warnings acceptable)
- [ ] Responsive design verified on mobile/tablet/desktop
- [ ] Loading and error states implemented
- [ ] tRPC mutations have proper error handling
- [ ] Code follows existing patterns and conventions
- [ ] Sprint completion document created

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Drag-drop performance with many deals | Medium | Medium | Virtualize list if >100 deals |
| Complex state management | Low | Medium | Use React Query for server state |
| Mobile drag-drop UX | Medium | Low | Fallback to tap-to-move on mobile |

---

## Sprint Backlog Order

1. **Pipeline Kanban Board** (Core feature, highest priority)
2. **Target Company Profiles** (Builds on existing detail page pattern)
3. **Deal Quick Actions** (Enhances workflow efficiency)
4. **Pipeline Analytics Widget** (Dashboard integration)

---

*Plan created: February 3, 2026*
*Ready for implementation*
