# Sprint 10 Plan: UI Polish & Deployment

**Sprint Number:** 10
**Sprint Name:** UI Polish & Deployment
**Status:** PLANNING
**Branch:** `feature/sprint-10-ui-polish`
**Start Date:** TBD

---

## Sprint Goal

Deliver production-ready application with polished UI, complete Quick Actions functionality, reduced technical debt, and full CI/CD pipeline with Vercel deployment. Address all carryover items from Sprint 9 and complete remaining PRD features.

---

## Priority Legend

- **P0:** Must complete this sprint (blockers for deployment)
- **P1:** Should complete this sprint (high value)
- **P2:** Nice to have (can carry over if needed)

---

## Track A: Sprint 9 Carryover (P0)

### A1. CommentLetterTracker Component Integration
**Priority:** P0
**Description:** Integrate the orphaned CommentLetterTracker component into the application UI.

**Tasks:**
- [ ] Identify appropriate page location (likely /compliance or /filings)
- [ ] Wire component to tRPC data source
- [ ] Add navigation or widget placement
- [ ] Verify component renders with real data

**Acceptance:** CommentLetterTracker visible and functional in main UI

### A2. RecentActivityFeed Component Integration
**Priority:** P0
**Description:** Replace current ActivityFeed with the improved RecentActivityFeed component.

**Tasks:**
- [ ] Audit current ActivityFeed usage locations
- [ ] Replace with RecentActivityFeed component
- [ ] Wire to real tRPC data
- [ ] Remove deprecated ActivityFeed component

**Acceptance:** Dashboard shows RecentActivityFeed with real activity data

### A3. ComplianceCalendar Consolidation
**Priority:** P0
**Description:** Make decision on ComplianceCalendar - remove if redundant with FilingCalendar or merge functionality.

**Tasks:**
- [ ] Compare ComplianceCalendar vs FilingCalendar feature sets
- [ ] Decide: remove ComplianceCalendar OR merge into FilingCalendar
- [ ] Implement consolidation decision
- [ ] Update imports and remove unused code

**Acceptance:** Single calendar component for deadline tracking, no duplicate functionality

---

## Track B: Quick Actions Completion (P1)

Completing Quick Actions functionality from Sprint 3 backlog.

### B1. Add Note Mutation
**Priority:** P1
**Files:**
- `src/server/api/routers/note.router.ts` (create or extend)
- `src/components/quick-actions/AddNoteAction.tsx`

**Tasks:**
- [ ] Create/extend note router with `note.create` procedure
- [ ] Wire AddNoteAction component to mutation
- [ ] Add optimistic updates
- [ ] Handle success/error states

**Acceptance:** Users can add notes via Quick Actions, persists to database

### B2. Change Priority Mutation
**Priority:** P1
**Files:**
- `src/server/api/routers/task.router.ts` (extend)
- `src/components/quick-actions/ChangePriorityAction.tsx`

**Tasks:**
- [ ] Add `task.updatePriority` procedure to task router
- [ ] Wire ChangePriorityAction component to mutation
- [ ] Add optimistic updates
- [ ] Update UI to reflect priority changes

**Acceptance:** Users can change task priority via Quick Actions

### B3. User Assignment System
**Priority:** P1
**Files:**
- `src/server/api/routers/assignment.router.ts` (create)
- `src/components/quick-actions/AssignUserAction.tsx`
- `prisma/schema.prisma` (if assignment model needed)

**Tasks:**
- [ ] Design assignment data model (if not exists)
- [ ] Create assignment router with CRUD procedures
- [ ] Wire AssignUserAction component
- [ ] Add user picker UI component
- [ ] Handle team member list fetching

**Acceptance:** Users can assign tasks/items to team members via Quick Actions

---

## Track C: Technical Debt (P1)

### C1. Reduce ESLint Warnings
**Priority:** P1
**Target:** < 100 warnings (from current count)

**Tasks:**
- [ ] Run `npm run lint` and capture current warning count
- [ ] Categorize warnings by type (unused vars, any types, etc.)
- [ ] Fix high-frequency warning patterns first
- [ ] Add eslint-disable comments only for intentional exceptions
- [ ] Document any patterns that should be addressed later

**Acceptance:** `npm run lint` produces < 100 warnings

### C2. Unit Tests for Critical tRPC Routers
**Priority:** P1
**Files:**
- `src/server/api/routers/__tests__/filing.router.test.ts` (create)
- `src/server/api/routers/__tests__/spac.router.test.ts` (create)
- `src/server/api/routers/__tests__/task.router.test.ts` (create)

**Tasks:**
- [ ] Set up Jest/Vitest for tRPC router testing
- [ ] Create test utilities for mocking Prisma
- [ ] Write tests for filing.router (CRUD + workflow)
- [ ] Write tests for spac.router (CRUD + status transitions)
- [ ] Write tests for task.router (CRUD + assignment)
- [ ] Achieve > 70% coverage on critical routers

**Acceptance:** Critical routers have unit tests, tests pass in CI

---

## Track D: UI Refinements (P1)

### D1. UI Consistency Pass
**Priority:** P1

**Tasks:**
- [ ] Audit button styles across application
- [ ] Standardize spacing and padding
- [ ] Ensure consistent color usage (primary, secondary, danger)
- [ ] Standardize form input styles
- [ ] Fix any visual inconsistencies in tables/lists

**Acceptance:** Consistent visual language across all pages

### D2. Accessibility Improvements
**Priority:** P1

**Tasks:**
- [ ] Run axe-core accessibility audit
- [ ] Fix critical accessibility issues (WCAG 2.1 AA)
- [ ] Add proper ARIA labels to interactive elements
- [ ] Ensure keyboard navigation works for all features
- [ ] Verify color contrast meets standards
- [ ] Add focus indicators where missing

**Acceptance:** No critical accessibility violations, keyboard navigable

### D3. Mobile Responsiveness
**Priority:** P1

**Tasks:**
- [ ] Audit all pages at mobile breakpoints (375px, 768px)
- [ ] Fix sidebar behavior on mobile (collapsible)
- [ ] Ensure tables scroll horizontally on mobile
- [ ] Fix any overlapping or cut-off content
- [ ] Test touch interactions

**Acceptance:** Application usable on tablet and mobile devices

---

## Track E: Performance Optimization (P2)

### E1. Bundle Analysis & Optimization
**Priority:** P2

**Tasks:**
- [ ] Run bundle analyzer (`npm run analyze`)
- [ ] Identify largest dependencies
- [ ] Implement code splitting for heavy routes
- [ ] Lazy load non-critical components
- [ ] Optimize image loading

**Acceptance:** Initial bundle size reduced by 20%+

### E2. Query Optimization
**Priority:** P2

**Tasks:**
- [ ] Enable Prisma query logging
- [ ] Identify N+1 queries
- [ ] Add appropriate includes/selects
- [ ] Add database indexes where needed
- [ ] Implement query result caching where appropriate

**Acceptance:** No N+1 queries on main pages, sub-200ms API responses

---

## Track F: Deployment & DevOps (P0)

### F1. CI/CD Pipeline
**Priority:** P0
**Files:**
- `.github/workflows/ci.yml` (create/update)
- `.github/workflows/deploy.yml` (create)

**Tasks:**
- [ ] Configure GitHub Actions for PR checks
- [ ] Add lint, type-check, and test steps
- [ ] Configure build verification
- [ ] Add Vercel preview deployment for PRs
- [ ] Configure production deployment on main merge

**Acceptance:** PRs trigger CI checks, merges to main auto-deploy

### F2. Vercel Production Deployment
**Priority:** P0

**Tasks:**
- [ ] Verify Vercel project configuration
- [ ] Configure production environment variables
- [ ] Set up custom domain (if applicable)
- [ ] Configure Vercel Edge functions if needed
- [ ] Test production build locally
- [ ] Deploy to production

**Acceptance:** Application accessible at production URL

### F3. Monitoring & Alerting
**Priority:** P1

**Tasks:**
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry or similar)
- [ ] Set up uptime monitoring
- [ ] Configure alerts for errors/downtime
- [ ] Add basic health check endpoint

**Acceptance:** Errors tracked, alerts configured, uptime monitored

### F4. Gmail/Calendar API Credential Configuration
**Priority:** P1

**Tasks:**
- [ ] Create Google Cloud project for production
- [ ] Configure OAuth consent screen
- [ ] Generate production API credentials
- [ ] Add credentials to Vercel environment
- [ ] Test OAuth flow in production
- [ ] Document credential rotation process

**Acceptance:** Gmail/Calendar integrations work in production

---

## Track G: New Features (P2)

### G1. Dedicated /companies Page
**Priority:** P2
**Files:**
- `src/app/(dashboard)/companies/page.tsx` (create)
- `src/components/companies/CompanyList.tsx` (create)

**Tasks:**
- [ ] Create companies list page
- [ ] Wire to company.list tRPC procedure
- [ ] Add search and filter functionality
- [ ] Add company detail view/modal
- [ ] Add sidebar navigation link

**Acceptance:** Users can browse and search companies at /companies

### G2. Pagination UI for Long Lists
**Priority:** P2
**Files:**
- `src/components/ui/Pagination.tsx` (create)
- Various list components

**Tasks:**
- [ ] Create reusable Pagination component
- [ ] Add pagination to contacts list
- [ ] Add pagination to filings list
- [ ] Add pagination to tasks list
- [ ] Wire pagination to tRPC cursor/offset queries

**Acceptance:** Lists with 20+ items show pagination controls

---

## Files to Create

```
.github/workflows/ci.yml
.github/workflows/deploy.yml
src/server/api/routers/__tests__/filing.router.test.ts
src/server/api/routers/__tests__/spac.router.test.ts
src/server/api/routers/__tests__/task.router.test.ts
src/app/(dashboard)/companies/page.tsx
src/components/companies/CompanyList.tsx
src/components/ui/Pagination.tsx
src/app/api/health/route.ts
```

## Files to Modify

```
src/app/(dashboard)/dashboard/page.tsx     # RecentActivityFeed integration
src/app/(dashboard)/compliance/page.tsx    # CommentLetterTracker integration
src/components/layout/Sidebar.tsx          # Add Companies link
src/server/api/routers/task.router.ts      # Add updatePriority
src/server/api/routers/note.router.ts      # Add create mutation
src/server/api/root.ts                     # Register any new routers
package.json                               # Add test scripts if needed
vercel.json                                # Update deployment config
```

---

## Dependencies & Ordering

```
Track A (Carryover) ──────────────────────────────► (can start immediately)

Track B (Quick Actions):
  B1 (Note) ─► B2 (Priority) ─► B3 (Assignment)

Track C (Tech Debt):
  C1 (ESLint) can run parallel with C2 (Tests)

Track D (UI):
  D1 (Consistency) ─► D2 (A11y) ─► D3 (Mobile)

Track E (Performance):
  E1 (Bundle) ─► E2 (Queries)
  └── Can run after Track D

Track F (Deployment):
  F1 (CI/CD) ─► F2 (Production) ─► F3 (Monitoring)
      │
      └── F4 (Credentials) can run parallel

Track G (Features):
  G1 (Companies) and G2 (Pagination) can run parallel
  └── Lower priority, after Tracks A-D
```

---

## Acceptance Criteria

### Track A - Carryover (P0)
- [ ] CommentLetterTracker integrated and visible in UI
- [ ] RecentActivityFeed replaces old ActivityFeed
- [ ] Calendar component consolidation complete

### Track B - Quick Actions (P1)
- [ ] Add Note saves to database
- [ ] Change Priority updates task
- [ ] User assignment functional

### Track C - Technical Debt (P1)
- [ ] ESLint warnings < 100
- [ ] Critical routers have unit tests
- [ ] Tests pass in CI

### Track D - UI Refinements (P1)
- [ ] Consistent visual styling
- [ ] No critical accessibility violations
- [ ] Mobile responsive

### Track E - Performance (P2)
- [ ] Bundle size reduced
- [ ] No N+1 queries

### Track F - Deployment (P0/P1)
- [ ] CI/CD pipeline runs on PRs
- [ ] Production deployment successful
- [ ] Monitoring configured
- [ ] Gmail/Calendar credentials configured

### Track G - Features (P2)
- [ ] /companies page functional
- [ ] Pagination on long lists

---

## Verification Plan

### Build Gate
```bash
npm run build        # Must pass
npm run lint         # < 100 warnings
npm run test         # Unit tests pass
npm run test:e2e     # E2E tests pass
```

### Deployment Checklist
- [ ] All environment variables configured in Vercel
- [ ] Database migrations applied to production
- [ ] OAuth credentials configured
- [ ] Domain DNS configured (if applicable)
- [ ] SSL certificate valid
- [ ] Health check endpoint responding

### Manual Testing Checklist
1. [ ] Dashboard loads with RecentActivityFeed
2. [ ] CommentLetterTracker visible and functional
3. [ ] Quick Actions: Add Note works
4. [ ] Quick Actions: Change Priority works
5. [ ] Quick Actions: Assign User works
6. [ ] Mobile view usable
7. [ ] Keyboard navigation works
8. [ ] Gmail OAuth flow works in production
9. [ ] Calendar OAuth flow works in production
10. [ ] /companies page loads
11. [ ] Pagination controls work

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google OAuth production approval delays | Medium | High | Start approval process early |
| ESLint fixes introduce bugs | Low | Medium | Run tests after each batch of fixes |
| Mobile responsive changes break desktop | Medium | Medium | Test both viewports after changes |
| Production environment variables missing | Medium | High | Create deployment checklist |
| CI/CD pipeline flaky tests | Medium | Medium | Add retry logic, fix flaky tests |

---

## Success Metrics

- Application deployed to production
- < 100 ESLint warnings
- > 70% test coverage on critical routers
- Zero critical accessibility violations
- Mobile usable (no critical responsive issues)
- CI/CD pipeline running on all PRs
- Monitoring and alerting configured

---

*Plan created: February 3, 2026*
*Expected duration: Standard sprint (7-10 days)*
