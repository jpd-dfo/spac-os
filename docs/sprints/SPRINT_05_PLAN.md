# Sprint 5 Plan

**Sprint Number:** 5
**Sprint Name:** AI Integration
**Start Date:** February 3, 2026
**Status:** PLANNED

---

## Sprint Goal

Wire existing AI infrastructure to UI components, enabling document analysis, deal scoring, target research, and risk analysis throughout the application.

---

## Discovery Summary

### Existing AI Infrastructure

The codebase already contains substantial AI infrastructure built during initial development:

| Component | Location | Functionality |
|-----------|----------|---------------|
| Claude Client | `src/lib/ai/claude.ts` | Full Anthropic SDK integration with rate limiting, streaming, retries, error handling |
| Document Analyzer | `src/lib/ai/document-analyzer.ts` | analyzeDocument, extractKeyTerms, summarizeLongDocument, identifyRedFlags, extractActionItems |
| Deal Scorer | `src/lib/ai/deal-scorer.ts` | scoreDeal, generateInvestmentThesis, analyzeRisksAndOpportunities, compareToDeSpacs |
| Research Agent | `src/lib/ai/research-agent.ts` | researchCompany, analyzeMarket, analyzeCompetitors, analyzeManagementTeam |
| Compliance Agent | `src/lib/ai/compliance-agent.ts` | monitorFilingDeadlines, analyzeCommentLetter, reviewDisclosures |
| Risk Detector | `src/lib/ai/riskDetector.ts` | detectRisks, detectContractRedFlags, calculateRiskScore |
| Summary Generator | `src/lib/ai/summaryGenerator.ts` | generateSummary, generateExecutiveBriefing, generateQuickSummary |
| API Routes | `src/app/api/ai/*` | /analyze, /chat, /research, /score endpoints |

### Sprint Focus

This sprint focuses on **integration**, not building new AI capabilities:
1. Validate existing infrastructure works with Anthropic API
2. Wire AI services to UI components
3. Create UI for AI features that need them
4. Test end-to-end functionality

---

## Features to Build

### Feature 1: Validate AI Infrastructure (P0)

**Description:** Verify the Claude client and AI services work correctly with the configured API key.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Claude client initializes with ANTHROPIC_API_KEY | P0 |
| `/api/ai/analyze` endpoint returns valid response | P0 |
| `/api/ai/score` endpoint returns valid response | P0 |
| `/api/ai/research` endpoint returns valid response | P0 |
| Rate limiting works correctly | P1 |
| Error handling returns appropriate messages | P1 |

**Technical Tasks:**
- [ ] Test Claude client singleton initialization
- [ ] Verify API key is loaded from environment
- [ ] Test each API endpoint with sample data
- [ ] Verify rate limiter tracks requests
- [ ] Test error scenarios (invalid input, API errors)

---

### Feature 2: Document Analysis Integration (P0)

**Description:** Wire document analysis AI to the document viewer and documents page.

| Acceptance Criteria | Priority |
|---------------------|----------|
| "Analyze" button on document viewer | P0 |
| Document summary generated on demand | P0 |
| Key terms extraction displayed | P1 |
| Red flags/risks highlighted | P1 |
| Action items extracted and displayed | P2 |
| Analysis results cached in database | P2 |

**Technical Tasks:**
- [ ] Add "Analyze with AI" button to DocumentViewer component
- [ ] Create AI analysis panel/modal in document viewer
- [ ] Wire analyze button to `/api/ai/analyze` endpoint
- [ ] Display summary, key terms, risks in UI
- [ ] Add loading states during AI processing
- [ ] Store analysis results in document metadata

**Files to Modify:**
- `src/components/documents/DocumentViewer.tsx`
- `src/components/documents/AIAnalysisPanel.tsx` (exists, wire to backend)
- `src/app/(dashboard)/documents/page.tsx`

---

### Feature 3: Deal Scoring Integration (P1)

**Description:** Add AI-powered deal scoring to target detail pages.

| Acceptance Criteria | Priority |
|---------------------|----------|
| AI score displayed on target detail page | P0 |
| Score breakdown by category (management, market, financial, etc.) | P0 |
| "Recalculate Score" button triggers new analysis | P1 |
| Score history tracked | P2 |
| Score comparison across targets | P2 |

**Technical Tasks:**
- [ ] Add AI Score card to target detail page Overview tab
- [ ] Wire to `/api/ai/score` endpoint
- [ ] Display category breakdown with visual indicators
- [ ] Add recalculate functionality
- [ ] Store scores in target record (aiScore field exists in schema)

**Files to Modify:**
- `src/app/(dashboard)/pipeline/[id]/page.tsx`
- `src/server/api/routers/target.router.ts` (add updateAiScore mutation)

---

### Feature 4: Target Research Integration (P1)

**Description:** Enable AI-powered research for target companies.

| Acceptance Criteria | Priority |
|---------------------|----------|
| "Research" button on target detail page | P0 |
| Company profile generated from AI | P0 |
| Market analysis displayed | P1 |
| Competitor analysis displayed | P1 |
| Management team analysis | P2 |
| Research memo generation | P2 |

**Technical Tasks:**
- [ ] Add "AI Research" tab or panel to target detail
- [ ] Wire to `/api/ai/research` endpoint
- [ ] Create ResearchPanel component for displaying results
- [ ] Add market and competitor sections
- [ ] Store research results in database

**Files to Modify:**
- `src/app/(dashboard)/pipeline/[id]/page.tsx`
- Create `src/components/pipeline/AIResearchPanel.tsx`

---

### Feature 5: Investment Memo Generation (P2)

**Description:** Generate investment memos from target data using AI.

| Acceptance Criteria | Priority |
|---------------------|----------|
| "Generate Memo" button on target detail | P0 |
| Memo includes executive summary | P0 |
| Memo includes investment thesis | P1 |
| Memo includes risk analysis | P1 |
| Export memo as PDF/document | P2 |
| Save memo to documents | P2 |

**Technical Tasks:**
- [ ] Add memo generation button to target detail
- [ ] Create memo generation API endpoint or extend existing
- [ ] Create InvestmentMemo display component
- [ ] Add PDF export functionality
- [ ] Wire to document creation

**Files to Create:**
- `src/components/pipeline/InvestmentMemo.tsx`
- `src/app/api/ai/memo/route.ts` (if needed)

---

### Feature 6: Risk Analysis Display (P2)

**Description:** Show AI-detected risks on documents and targets.

| Acceptance Criteria | Priority |
|---------------------|----------|
| Risk indicators on document cards | P1 |
| Risk details in document viewer | P1 |
| Risk summary on target detail | P1 |
| Risk severity levels (high/medium/low) | P1 |
| Mitigation suggestions | P2 |

**Technical Tasks:**
- [ ] Add risk badge to DocumentCard component
- [ ] Create RiskAnalysisPanel component
- [ ] Wire riskDetector functions to UI
- [ ] Display risk severity with color coding
- [ ] Show mitigation recommendations

**Files to Modify:**
- `src/components/documents/DocumentCard.tsx`
- `src/components/documents/DocumentViewer.tsx`
- Create `src/components/shared/RiskBadge.tsx`

---

## Dependencies

### From Previous Sprints
- Document management system (Sprint 4) - Complete
- Target detail pages (Sprint 3) - Complete
- tRPC API infrastructure (Sprint 2) - Complete

### External Dependencies
- Anthropic Claude API key - Configured in .env.local
- `@anthropic-ai/sdk` package - Already installed

### Technical Prerequisites
- Verify ANTHROPIC_API_KEY is valid and has credits
- Ensure rate limits are appropriate for usage patterns

---

## Carryover from Sprint 4

| Item | Status | Notes |
|------|--------|-------|
| ESLint warnings (~200) | Technical Debt | Address incrementally |
| Unit tests | Technical Debt | Add tests for AI utilities |

---

## Out of Scope

The following are NOT included in Sprint 5:
- SEC EDGAR integration (Sprint 6)
- Automated compliance monitoring (Sprint 6)
- Real-time AI chat interface (Future)
- External data provider integrations (Sprint 11+)
- AI Scout Agent for target identification (Sprint 11+)

---

## Success Metrics

| Metric | Target |
|--------|--------|
| AI endpoints functional | 100% |
| Document analysis works | Yes |
| Deal scoring works | Yes |
| Target research works | Yes |
| Build passes | Yes |
| E2E tests pass | 100% |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| API key issues | Low | High | Verify key before starting |
| Rate limiting | Medium | Medium | Test rate limiter, add user feedback |
| AI response quality | Medium | Medium | Add prompt refinement as needed |
| Long response times | Medium | Low | Add loading states, streaming |

---

## Estimated Effort

| Feature | Complexity | Notes |
|---------|------------|-------|
| Validate AI Infrastructure | Low | Testing existing code |
| Document Analysis Integration | Medium | UI wiring, state management |
| Deal Scoring Integration | Medium | UI updates, score display |
| Target Research Integration | Medium | New panel component |
| Investment Memo Generation | High | New functionality, PDF export |
| Risk Analysis Display | Low | Badge/indicator components |

---

*Plan created: February 3, 2026*
