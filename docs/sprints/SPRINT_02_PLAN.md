# Sprint 2: SPAC Management & Dashboard Integration

> **RETROACTIVE DOCUMENT** - Created February 3, 2026 for audit trail purposes.
> Original sprint completed February 2, 2026.

**Sprint Number:** 2
**Sprint Name:** SPAC Management & Dashboard Integration
**Duration:** February 1-2, 2026
**Branch:** `feature/sprint-2-spac-management`
**PRD Version:** v4.0

---

## Sprint Goal

Deliver complete SPAC management functionality including list views, detail pages, create/edit forms, and connect dashboard widgets to real backend data.

---

## Pre-Sprint Discovery

### What Already Exists (From Sprint 1)

| Component | Status | Location |
|-----------|--------|----------|
| tRPC SPAC Router | Built | `/server/api/routers/spac.ts` |
| Prisma SPAC Model | Built | `prisma/schema.prisma` |
| Dashboard Layout | Built | `/app/(dashboard)/layout.tsx` |
| UI Components | Built | shadcn/ui installed |
| Authentication | Built | Clerk configured |

### What Needs Work

| Gap | Issue | Priority |
|-----|-------|----------|
| SPAC List Page | No UI exists | P0 - Critical |
| SPAC Detail Page | No UI exists | P0 - Critical |
| SPAC Create Form | No UI exists | P0 - Critical |
| SPAC Edit Form | No UI exists | P0 - Critical |
| Dashboard Widgets | Using placeholder data | P1 - High |
| Type Safety | Some type mismatches | P1 - High |

---

## Features to Build

### Feature 1: SPAC List Page (P0)

**Description:** Create a comprehensive list view for all SPACs with pagination, search, filtering, and sorting capabilities.

**Acceptance Criteria:**
- [ ] List displays all SPACs with key information
- [ ] Pagination working with configurable page size
- [ ] Search by SPAC name or ticker
- [ ] Filter by status
- [ ] Sort by name, date, trust amount
- [ ] Grid and table view options
- [ ] Loading skeletons during data fetch
- [ ] Empty state when no SPACs exist
- [ ] Link to create new SPAC

**Technical Tasks:**
```
1. Create /app/(dashboard)/spacs/page.tsx
2. Implement SPACListView component with table/grid
3. Add search input with debounced query
4. Add status filter dropdown
5. Add sort controls
6. Wire to trpc.spac.list.useQuery()
7. Implement pagination controls
8. Add loading and empty states
```

---

### Feature 2: SPAC Detail Page (P0)

**Description:** Create a detailed view for individual SPACs with multiple tabs showing different aspects of the SPAC.

**Acceptance Criteria:**
- [ ] Overview tab with key metrics and description
- [ ] Timeline tab showing milestone history
- [ ] Documents tab listing associated documents
- [ ] Team tab showing team members
- [ ] Financials tab with trust and cap table preview
- [ ] Status badge with appropriate styling
- [ ] Edit button linking to edit page
- [ ] Delete with confirmation dialog
- [ ] Back navigation to list

**Technical Tasks:**
```
1. Create /app/(dashboard)/spacs/[id]/page.tsx
2. Implement tab navigation component
3. Build Overview tab with metrics cards
4. Build Timeline tab with milestone list
5. Build Documents tab with document grid
6. Build Team tab with member cards
7. Build Financials tab with summary
8. Wire to trpc.spac.getById.useQuery()
9. Add edit and delete actions
```

---

### Feature 3: SPAC Create Form (P0)

**Description:** Implement a form for creating new SPACs with validation and proper error handling.

**Acceptance Criteria:**
- [ ] Form with all required SPAC fields
- [ ] Zod schema validation on submit
- [ ] Field-level error messages
- [ ] Loading state during submission
- [ ] Success toast on creation
- [ ] Redirect to detail page on success
- [ ] Cancel returns to list

**Technical Tasks:**
```
1. Create /app/(dashboard)/spacs/new/page.tsx
2. Build SPACForm component with all fields
3. Create Zod validation schema
4. Wire to trpc.spac.create.useMutation()
5. Add toast notifications
6. Handle redirect on success
```

---

### Feature 4: SPAC Edit Form (P0)

**Description:** Implement editing functionality for existing SPACs with pre-populated form data.

**Acceptance Criteria:**
- [ ] Form pre-populated with current SPAC data
- [ ] Same validation as create form
- [ ] Status change with transition rules
- [ ] Loading state during save
- [ ] Success toast on update
- [ ] Stay on page or redirect based on action
- [ ] Cancel discards changes

**Technical Tasks:**
```
1. Create /app/(dashboard)/spacs/[id]/edit/page.tsx
2. Reuse SPACForm component in edit mode
3. Fetch current data with trpc.spac.getById
4. Wire to trpc.spac.update.useMutation()
5. Handle status transitions
6. Add optimistic updates
```

---

### Feature 5: Dashboard tRPC Integration (P1)

**Description:** Connect all dashboard widgets to real backend data instead of placeholders.

**Acceptance Criteria:**
- [ ] SPAC count widget shows real count
- [ ] Target count widget shows real count
- [ ] Document count widget shows real count
- [ ] Recent SPACs list shows actual recent SPACs
- [ ] Status distribution chart uses real data
- [ ] All widgets have loading states
- [ ] Error states display gracefully

**Technical Tasks:**
```
1. Update dashboard page to use tRPC queries
2. Create dashboard-specific query (getStatistics)
3. Wire SPAC stats widget
4. Wire Target stats widget
5. Wire recent activity list
6. Add skeleton loaders
7. Handle errors gracefully
```

---

### Feature 6: Type System Fixes (P1)

**Description:** Resolve TypeScript errors throughout the codebase to ensure clean builds.

**Acceptance Criteria:**
- [ ] Build passes with no TypeScript errors
- [ ] No `any` types except where unavoidable
- [ ] Prisma types properly inferred
- [ ] tRPC types flow end-to-end
- [ ] Form types match API schemas

**Technical Tasks:**
```
1. Audit existing TypeScript errors
2. Fix Prisma enum type mismatches
3. Fix tRPC procedure input/output types
4. Fix component prop types
5. Add proper generics where needed
6. Document unavoidable type assertions
```

---

## Dependencies

### From Sprint 1
- Next.js 14 application
- Clerk authentication
- Supabase PostgreSQL
- Prisma ORM with schema
- tRPC setup
- shadcn/ui components

### External APIs
- None new this sprint

---

## Technical Notes

### SPAC Status Transitions

```
Valid transitions:
SEARCHING → LOI_SIGNED
LOI_SIGNED → DA_ANNOUNCED | SEARCHING
DA_ANNOUNCED → SEC_REVIEW
SEC_REVIEW → SHAREHOLDER_VOTE | DA_ANNOUNCED
SHAREHOLDER_VOTE → CLOSING | TERMINATED
CLOSING → COMPLETED | TERMINATED
Any → LIQUIDATED (terminal)
Any → TERMINATED (terminal)
```

### Form Fields for SPAC

```typescript
{
  name: string;          // Required
  ticker: string | null; // Optional
  status: SpacStatus;    // Enum
  trustAmount: Decimal;  // Currency
  ipoDate: Date | null;  // Optional
  deadline: Date | null; // Optional
  description: string;   // Text area
}
```

### Query Patterns

```typescript
// List with pagination
trpc.spac.list.useQuery({
  page: 1,
  limit: 10,
  search: 'term',
  status: 'SEARCHING',
  sortBy: 'name',
  sortOrder: 'asc'
});

// Get by ID with relations
trpc.spac.getById.useQuery({ id: 'xxx' });

// Create
trpc.spac.create.useMutation();

// Update
trpc.spac.update.useMutation();

// Delete
trpc.spac.delete.useMutation();
```

---

## Definition of Done

- [ ] SPAC list page fully functional
- [ ] SPAC detail page with all 5 tabs
- [ ] SPAC create form with validation
- [ ] SPAC edit form with validation
- [ ] Dashboard shows real data
- [ ] Build passes with no TypeScript errors
- [ ] No ESLint errors
- [ ] All loading states implemented
- [ ] All error states handled
- [ ] Sprint completion document created

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Type mismatches | High | Medium | Systematic type audit |
| Form validation edge cases | Medium | Low | Comprehensive Zod schemas |
| Dashboard query performance | Low | Medium | Add proper caching |
| Status transition bugs | Medium | Medium | Unit test transitions |

---

## Sprint Backlog Order

1. **Type System Fixes** - Unblock all other work
2. **SPAC List Page** - Core navigation entry point
3. **SPAC Detail Page** - View individual SPACs
4. **SPAC Create Form** - Add new SPACs
5. **SPAC Edit Form** - Modify existing SPACs
6. **Dashboard Integration** - Polish and connect

---

*Plan created retroactively: February 3, 2026*
*Original sprint: February 1-2, 2026*
