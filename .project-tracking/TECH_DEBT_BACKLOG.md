# Technical Debt Backlog

**Last Updated:** February 3, 2026
**Maintained By:** Engineering Team
**Review Cadence:** Weekly during sprint planning

---

## Overview

This document tracks all accumulated technical debt across the SPAC OS application. Items are prioritized by severity (P1-P3) and include effort estimates to aid sprint planning.

### Priority Definitions

| Priority | Definition | SLA |
|----------|------------|-----|
| **P1** | Critical - Impacts production stability, performance, or security | Address within 2 sprints |
| **P2** | Important - Affects developer productivity or user experience | Address within 4 sprints |
| **P3** | Minor - Code quality improvements, nice-to-haves | Address as capacity allows |

### Effort Estimates

| Size | Definition | Story Points |
|------|------------|--------------|
| **XS** | < 2 hours | 1 |
| **S** | 2-4 hours | 2 |
| **M** | 1-2 days | 3-5 |
| **L** | 3-5 days | 8 |
| **XL** | 1+ weeks | 13+ |

---

## P1 - Critical Priority

### TD-001: Alert Router Efficiency
**Source:** Sprint 6 QA Report (S6-002)
**Effort:** S (2-4 hours)
**File:** `src/server/api/routers/alert.router.ts`

**Description:**
Alert router list query makes 2 DB queries (list + count) which is inefficient. Should use single query with count.

**Status:** Partially addressed in Sprint 8 with `getActiveAlertsWithCount` and `Promise.all`, but review needed for full optimization.

**Acceptance Criteria:**
- [ ] Single database query returns both list and count
- [ ] Response time < 100ms for typical load
- [ ] Add database index if needed

---

### TD-002: SEC EDGAR Rate Limiter Serverless Optimization
**Source:** Sprint 6 QA Report (S6-001)
**Effort:** M (1-2 days)
**File:** `src/lib/secEdgarClient.ts`

**Description:**
SEC EDGAR rate limiter uses module-level state which is not safe for serverless deployment. In serverless environments, each function invocation may have a fresh state, defeating the rate limiting purpose.

**Current Workaround:** Documentation added (Sprint 8) with conservative 100ms delay.

**Acceptance Criteria:**
- [ ] Implement Redis-based rate limiting
- [ ] Or implement DynamoDB-based token bucket
- [ ] Rate limit persists across serverless invocations
- [ ] Maintain SEC's 10 requests/second limit

---

## P2 - Important Priority

### TD-003: ESLint Warnings Cleanup
**Source:** Sprint 2 QA Report
**Effort:** L (3-5 days)
**Original Count:** 516 warnings
**Current Estimate:** 200+ warnings

**Warning Categories:**
| Category | Est. Count | Severity |
|----------|------------|----------|
| `@typescript-eslint/no-explicit-any` | ~80 | Medium |
| `no-nested-ternary` | ~100 | Low |
| `@typescript-eslint/no-unused-vars` | ~50 | Low |
| `react-hooks/exhaustive-deps` | ~30 | Medium |
| `jsx-a11y/*` | ~50 | Low |
| `import/order` | ~20 | Low |

**Acceptance Criteria:**
- [ ] Reduce `no-explicit-any` to < 20
- [ ] Fix all `react-hooks/exhaustive-deps` warnings
- [ ] Total warnings < 50

---

### TD-004: Unit Tests for tRPC Routers
**Source:** Sprint 2 QA Report
**Effort:** XL (1+ weeks)
**Current Coverage:** 0 unit tests

**Priority Routers:**
1. `spac.router.ts` - Core SPAC CRUD
2. `target.router.ts` - Pipeline management
3. `alert.router.ts` - Compliance alerts
4. `filing.router.ts` - SEC filings

**Acceptance Criteria:**
- [ ] 80% coverage on priority routers
- [ ] Mock database with Prisma mock client
- [ ] Integration with CI/CD pipeline

---

### TD-005: E2E Tests for SPAC CRUD Flows
**Source:** Sprint 2 & Sprint 3 QA Reports
**Effort:** M (1-2 days)
**File:** `e2e/`

**Description:**
No E2E tests exist for core SPAC management flows (create, read, update, delete SPACs).

**Acceptance Criteria:**
- [ ] Test SPAC creation flow
- [ ] Test SPAC edit flow
- [ ] Test SPAC archive/delete flow
- [ ] Test SPAC list filtering and search

---

### TD-006: Quick Actions Incomplete Implementation
**Source:** Sprint 3 Product Review
**Effort:** M (1-2 days)
**Files:** `src/app/(dashboard)/pipeline/[id]/page.tsx`

**Missing Mutations:**
1. **Add Note** - Backend mutation needed
2. **Change Priority** - Backend mutation needed
3. **User Assignment** - Full system needed (tied to CRM)

**Acceptance Criteria:**
- [ ] `target.addNote` mutation implemented
- [ ] `target.updatePriority` mutation implemented
- [ ] Note UI integrated with backend
- [ ] Priority quick-change UI integrated

---

### TD-007: Legacy Mock Data Blocks in Pipeline Pages
**Source:** Sprint 3
**Effort:** S (2-4 hours)
**Files:** `src/app/(dashboard)/pipeline/page.tsx`, `src/app/(dashboard)/pipeline/[id]/page.tsx`

**Description:**
Some code blocks marked as deprecated still contain mock data fallbacks. These should be removed now that tRPC integration is complete.

**Acceptance Criteria:**
- [ ] Remove all `// DEPRECATED` marked code
- [ ] Remove mock data imports
- [ ] Verify no runtime fallback to mock data

---

### TD-008: PDF Save to Documents
**Source:** Sprint 6 Product Review
**Effort:** S (2-4 hours)
**File:** `src/lib/memoExporter.ts`

**Description:**
PDF export currently only triggers browser download. Should also support saving directly to the documents system.

**Acceptance Criteria:**
- [ ] Add "Save to Documents" option in export menu
- [ ] Create document record with PDF blob
- [ ] Link to originating memo/analysis
- [ ] Show success toast with link to document

---

### TD-009: Real-time Status Notifications
**Source:** Sprint 6 Product Review
**Effort:** L (3-5 days)

**Description:**
Filing status changes currently rely on polling. WebSocket implementation would provide real-time updates.

**Acceptance Criteria:**
- [ ] WebSocket connection established on app load
- [ ] Real-time push for filing status changes
- [ ] Real-time push for compliance alerts
- [ ] Graceful fallback to polling if WebSocket fails

---

### TD-010: Gmail/Calendar API Credential Configuration
**Source:** Sprint 8 QA Report
**Effort:** M (1-2 days)
**Files:** `src/server/api/routers/email.router.ts`, `src/server/api/routers/calendar.router.ts`

**Description:**
Email and calendar routers have infrastructure complete but TODO placeholders for actual third-party API calls. Requires Google API credentials configuration.

**Acceptance Criteria:**
- [ ] Google Cloud project configured with Gmail API
- [ ] Google Cloud project configured with Calendar API
- [ ] OAuth consent screen approved
- [ ] Environment variables documented
- [ ] Wire service methods to router endpoints

---

### TD-011: ContactList Component Mock Data Import
**Source:** Sprint 8 QA Report (Carryover to Sprint 9)
**Effort:** XS (< 2 hours)
**File:** `src/components/contacts/ContactList.tsx`

**Description:**
Component still imports from `mockContactsData.ts` instead of using tRPC. The pages use tRPC directly, making this component potentially orphaned or inconsistent.

**Acceptance Criteria:**
- [ ] Determine if component is still needed
- [ ] If yes, refactor to use tRPC
- [ ] If no, delete component and mock data file

---

## P3 - Minor Priority

### TD-012: Dashboard Activity Feed Placeholder
**Source:** Sprint 9 QA Report (S9-001)
**Effort:** M (1-2 days)
**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Description:**
Activity feed uses placeholder fallback logic. Should aggregate real activity from contacts, deals, filings, etc.

**Acceptance Criteria:**
- [ ] Create activity aggregation query
- [ ] Show real user actions (creates, updates, notes)
- [ ] Paginate for performance

---

### TD-013: Dashboard AI Insights Placeholder
**Source:** Sprint 9 QA Report (S9-002)
**Effort:** M (1-2 days)
**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Description:**
AI insights section uses fallback empty array. Should show real AI-generated insights.

**Acceptance Criteria:**
- [ ] Pull recent AI analysis summaries
- [ ] Show actionable insights (risks, opportunities)
- [ ] Link to detailed analysis pages

---

### TD-014: Dashboard Milestones Placeholder
**Source:** Sprint 9 QA Report (S9-003)
**Effort:** S (2-4 hours)
**File:** `src/app/(dashboard)/dashboard/page.tsx`

**Description:**
Milestones section uses placeholder data. Should track real SPAC milestones.

**Acceptance Criteria:**
- [ ] Query upcoming SPAC deadlines
- [ ] Show deal pipeline milestones
- [ ] Color-code by urgency

---

### TD-015: PDF Export Error Handling
**Source:** Sprint 6 QA Report (S6-003)
**Effort:** XS (< 2 hours)
**File:** `src/lib/memoExporter.ts`

**Description:**
PDF export error handling only logs to console, no user feedback.

**Acceptance Criteria:**
- [ ] Show error toast on failure
- [ ] Provide retry option
- [ ] Log error to monitoring service

---

### TD-016: ScoreHistory Sparkline Hardcoded Colors
**Source:** Sprint 6 QA Report (S6-004)
**Effort:** XS (< 2 hours)
**File:** `src/components/documents/ScoreHistory.tsx`

**Description:**
Sparkline has hardcoded colors instead of theme variables.

**Acceptance Criteria:**
- [ ] Use CSS variables or theme tokens
- [ ] Support dark mode colors

---

### TD-017: AIAnalysisPanel Direct Fetch
**Source:** Sprint 6 QA Report (S6-005)
**Effort:** S (2-4 hours)
**File:** `src/components/documents/AIAnalysisPanel.tsx`

**Description:**
Uses fetch directly instead of tRPC, inconsistent with rest of app.

**Acceptance Criteria:**
- [ ] Convert to tRPC mutation
- [ ] Use React Query for caching
- [ ] Maintain abort controller functionality

---

### TD-018: memoExporter Currency Edge Cases
**Source:** Sprint 6 QA Report (S6-007)
**Effort:** XS (< 2 hours)
**File:** `src/lib/memoExporter.ts`

**Description:**
`formatCurrency` function doesn't handle edge cases (null, undefined, NaN).

**Acceptance Criteria:**
- [ ] Handle null/undefined gracefully
- [ ] Handle NaN with fallback
- [ ] Add unit tests

---

---

## Resolved Items

*Items moved here after completion for historical tracking.*

| ID | Description | Resolved In | Date |
|----|-------------|-------------|------|
| - | - | - | - |

---

## Sprint Planning Notes

### Recommended Sprint 10 Bundle
Focus on testing foundation:
- TD-004: Unit Tests for tRPC Routers (XL)
- TD-005: E2E Tests for SPAC CRUD (M)
- TD-003: ESLint Warnings - `no-explicit-any` subset (M)

**Total Effort:** ~20 story points

### Recommended Sprint 11 Bundle
Focus on data integrity and UX:
- TD-001: Alert Router Efficiency (S)
- TD-006: Quick Actions Completion (M)
- TD-007: Legacy Mock Data Removal (S)
- TD-011: ContactList Cleanup (XS)

**Total Effort:** ~10 story points

### Recommended Sprint 12 Bundle
Focus on integrations:
- TD-010: Gmail/Calendar Credentials (M)
- TD-002: SEC EDGAR Rate Limiter (M)
- TD-009: WebSocket Notifications (L)

**Total Effort:** ~15 story points

---

## Appendix: Source References

| Sprint | Report | Key Findings |
|--------|--------|--------------|
| Sprint 2 | QA Report | 516 ESLint warnings, 0 unit tests |
| Sprint 3 | QA & Product | Quick actions partial, mock data remnants |
| Sprint 6 | QA & Product | PDF save deferred, rate limiter issue, alert efficiency |
| Sprint 8 | QA Report | CRM mock data, integration credentials needed |
| Sprint 9 | QA Report | Dashboard placeholders (activity, insights, milestones) |

---

*This document should be updated after each sprint retrospective.*
