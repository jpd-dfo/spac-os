# Sprint 6 Plan

**Sprint Number:** 6
**Sprint Name:** SEC & Compliance + Sprint 5 P2 Carryover
**Start Date:** February 3, 2026
**Status:** IN PROGRESS

---

## Sprint Goal

Complete Phase 3 Intelligence by implementing SEC EDGAR integration, compliance monitoring features, and finishing Sprint 5 P2 carryover items (PDF export, caching, score history, risk badges, progress indicators).

---

## Features to Build

### PART A: Sprint 5 P2 Carryover (Priority)

### Feature 1: PDF Export for Investment Memos (P2 Carryover)

**Description:** Enable exporting investment memos as PDF documents.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Export button generates downloadable PDF | P0 |
| PDF includes all memo sections (summary, thesis, risks, etc.) | P0 |
| PDF has proper formatting and branding | P1 |
| Save PDF to documents system | P2 |

**Technical Tasks:**
- [ ] Install PDF generation library (jsPDF or react-pdf/renderer)
- [ ] Create PDF template for investment memos
- [ ] Wire export button to PDF generation
- [ ] Add download functionality
- [ ] Optionally save to documents

**Files to Modify:**
- `src/components/pipeline/InvestmentMemo.tsx`
- Create `src/lib/pdf/memoExporter.ts`

---

### Feature 2: Analysis Caching in Database (P2 Carryover)

**Description:** Cache AI analysis results in the database to avoid repeated API calls.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Document analysis results cached in database | P0 |
| Cache lookup before calling AI API | P0 |
| Cache invalidation when document changes | P1 |
| Cache expiration policy (e.g., 24 hours) | P2 |

**Technical Tasks:**
- [ ] Add `DocumentAnalysis` model to Prisma schema
- [ ] Create analysis caching service
- [ ] Update AIAnalysisPanel to check cache first
- [ ] Add cache invalidation on document update
- [ ] Run Prisma migration

**Files to Modify:**
- `prisma/schema.prisma`
- `src/components/documents/AIAnalysisPanel.tsx`
- Create `src/lib/cache/analysisCache.ts`

---

### Feature 3: Score History Tracking (P2 Carryover)

**Description:** Track AI score history for targets to show trends over time.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Store score history in database | P0 |
| Display score trend on target detail | P0 |
| Show score history chart/timeline | P1 |
| Compare current vs previous scores | P1 |

**Technical Tasks:**
- [ ] Add `ScoreHistory` model to Prisma schema
- [ ] Update AIScoreCard to save scores
- [ ] Create score history display component
- [ ] Add trend visualization (up/down/stable)
- [ ] Run Prisma migration

**Files to Modify:**
- `prisma/schema.prisma`
- `src/components/pipeline/AIScoreCard.tsx`
- Create `src/components/pipeline/ScoreHistory.tsx`

---

### Feature 4: DocumentCard Risk Badge Integration (P2 Carryover)

**Description:** Show risk badges on document cards in list view.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Risk badge visible on DocumentCard | P0 |
| Badge shows highest risk level from analysis | P0 |
| Clicking badge shows risk details | P1 |
| Badge only shows if analysis exists | P1 |

**Technical Tasks:**
- [ ] Import RiskBadge into DocumentCard
- [ ] Add risk level prop to DocumentCard
- [ ] Query risk data from cached analysis
- [ ] Add tooltip/popover for risk details

**Files to Modify:**
- `src/components/documents/DocumentCard.tsx`
- `src/app/(dashboard)/documents/page.tsx`

---

### Feature 5: AI Progress Indicators (P2 Carryover)

**Description:** Add progress indicators for long-running AI operations.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Progress bar during AI analysis | P0 |
| Estimated time remaining shown | P1 |
| Step-by-step progress for multi-step operations | P1 |
| Cancel button for long operations | P2 |

**Technical Tasks:**
- [ ] Create ProgressIndicator component
- [ ] Update AI components with progress states
- [ ] Add step tracking for multi-step AI calls
- [ ] Implement cancellation with AbortController

**Files to Modify:**
- Create `src/components/shared/ProgressIndicator.tsx`
- `src/components/documents/AIAnalysisPanel.tsx`
- `src/components/pipeline/AIScoreCard.tsx`
- `src/components/pipeline/AIResearchPanel.tsx`

---

### PART B: SEC & Compliance Features

### Feature 6: SEC EDGAR Integration (P0)

**Description:** Integrate with SEC EDGAR API to fetch SPAC filings automatically.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Connect to SEC EDGAR API | P0 |
| Fetch filings by CIK number | P0 |
| Parse filing metadata (type, date, accession) | P0 |
| Store filings in database | P0 |
| Display filings on SPAC detail page | P1 |

**Technical Tasks:**
- [ ] Create SEC EDGAR API client
- [ ] Add Filing model updates if needed
- [ ] Create filing sync service
- [ ] Wire to SPAC detail page Filings tab
- [ ] Add manual refresh button

**Files to Modify:**
- `src/lib/compliance/secEdgarClient.ts` (exists, enhance)
- `src/server/api/routers/filing.router.ts`
- `src/app/(dashboard)/spacs/[id]/page.tsx`

---

### Feature 7: Filing Deadline Tracker (P0)

**Description:** Track and alert on upcoming SEC filing deadlines.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Calculate filing deadlines based on SPAC status | P0 |
| Display upcoming deadlines on dashboard | P0 |
| Color-code by urgency (red/yellow/green) | P0 |
| Show days remaining for each deadline | P1 |

**Technical Tasks:**
- [ ] Create deadline calculation service
- [ ] Update dashboard widget for deadlines
- [ ] Add deadline display to compliance page
- [ ] Implement urgency color coding

**Files to Modify:**
- `src/lib/compliance/filingDeadlines.ts` (exists, enhance)
- `src/components/dashboard/UpcomingDeadlines.tsx`
- `src/app/(dashboard)/compliance/page.tsx`

---

### Feature 8: Compliance Alerts (P1)

**Description:** Generate alerts for compliance events and deadlines.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Alert for upcoming filing deadlines | P0 |
| Alert for missed deadlines | P0 |
| Alert notifications in header | P1 |
| Alert history/log | P1 |

**Technical Tasks:**
- [ ] Create ComplianceAlert model in schema
- [ ] Build alert generation service
- [ ] Create alert notification component
- [ ] Add alert badge to header
- [ ] Create alerts page/list

**Files to Modify:**
- `prisma/schema.prisma`
- Create `src/lib/compliance/alertService.ts`
- `src/components/layout/Header.tsx`
- `src/app/(dashboard)/compliance/page.tsx`

---

### Feature 9: Filing Status Monitoring (P1)

**Description:** Monitor and display the status of SEC filings.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Track filing status (draft, submitted, effective) | P0 |
| Status timeline visualization | P0 |
| Status change notifications | P1 |
| Link to SEC EDGAR filing page | P1 |

**Technical Tasks:**
- [ ] Add status tracking fields to Filing model
- [ ] Create filing status component
- [ ] Build status timeline visualization
- [ ] Add links to SEC EDGAR

**Files to Modify:**
- `src/components/filings/FilingTimeline.tsx` (exists, enhance)
- `src/components/filings/FilingList.tsx`
- `src/app/(dashboard)/filings/[id]/page.tsx`

---

### Feature 10: Regulatory Calendar (P2)

**Description:** Calendar view of all compliance dates and deadlines.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Calendar view of filing deadlines | P0 |
| Different colors for filing types | P1 |
| Click to view filing details | P1 |
| Monthly/weekly view toggle | P2 |

**Technical Tasks:**
- [ ] Create ComplianceCalendar component
- [ ] Integrate with filing deadlines data
- [ ] Add to compliance page
- [ ] Implement view toggle

**Files to Modify:**
- `src/components/compliance/ComplianceCalendar.tsx` (exists, enhance)
- `src/app/(dashboard)/compliance/page.tsx`

---

## Dependencies

### From Previous Sprints
- AI Infrastructure (Sprint 5) - Complete
- Document Management (Sprint 4) - Complete
- tRPC API (Sprint 2) - Complete

### External Dependencies
- SEC EDGAR API (public, no auth required)
- PDF generation library (to be installed)

### Database Changes
- Add `DocumentAnalysis` model for caching
- Add `ScoreHistory` model for score tracking
- Add `ComplianceAlert` model for alerts
- Update `Filing` model for status tracking

---

## Technical Prerequisites

- SEC EDGAR API endpoint: `https://data.sec.gov/submissions/`
- No API key required (public API with rate limiting)
- Follow SEC fair access guidelines (10 requests/second max)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| All P2 carryover items complete | 5/5 |
| SEC EDGAR integration functional | Yes |
| Filing deadlines tracked | Yes |
| Build passes | Yes |
| E2E tests pass | 100% |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SEC EDGAR rate limiting | Medium | Medium | Implement caching, respect rate limits |
| PDF generation complexity | Low | Low | Use proven library (jsPDF) |
| Schema migration issues | Low | Medium | Test migrations in dev first |

---

*Plan created: February 3, 2026*
