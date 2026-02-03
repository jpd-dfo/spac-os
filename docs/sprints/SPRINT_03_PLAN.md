# Sprint 3: Deal Pipeline Backend Integration

**Sprint Number:** 3
**Sprint Name:** Deal Pipeline Backend Integration
**Duration:** February 3-4, 2026
**Branch:** `feature/sprint-3-deal-pipeline`
**PRD Version:** v4.2

---

## Sprint Goal

Connect the existing deal pipeline UI to the real tRPC backend, implementing all data persistence and completing stub functionality.

---

## Pre-Sprint Discovery

### What Already Exists (UI Complete)

| Component | Status | Location |
|-----------|--------|----------|
| Kanban Board | ✅ Built | `/pipeline` page, 6-stage columns |
| Drag-and-Drop | ✅ Built | HTML5 + @dnd-kit dual implementation |
| Target Profiles | ✅ Built | `/pipeline/[id]` with 5 tabs |
| Evaluation Scores | ✅ Built | 6 score types with visual display |
| Financial Metrics | ✅ Built | EV, Revenue, EBITDA, multiples |
| Activity Timeline | ✅ Built | Stage changes, notes, meetings |
| Due Diligence | ✅ Built | Progress tracking by category |
| Pipeline Filters | ✅ Built | Search, industry, stage, value, score |
| Pipeline Stats | ✅ Built | Distribution, conversion, insights |
| Dashboard Widget | ✅ Built | Pipeline funnel, top targets |
| Quick Actions | ✅ Built | Menu with action stubs |
| Add Target Form | ✅ Built | Multi-field with file upload |

### What Needs Work

| Gap | Issue | Priority |
|-----|-------|----------|
| Backend Integration | UI uses MOCK DATA | P0 - Critical |
| Edit Target | Button exists, no handler | P1 - High |
| Stage Transitions | Drag-drop not persisted | P0 - Critical |
| Quick Actions | Handlers are stubs | P1 - High |
| Export Feature | UI only, no logic | P2 - Medium |
| Bulk Operations | No implementation | P2 - Medium |

---

## Features to Build

### Feature 1: Connect Pipeline to tRPC Backend (P0)

**Description:** Replace mock data with real tRPC queries and mutations throughout the pipeline pages.

**Acceptance Criteria:**
- [ ] Pipeline page fetches targets from `target.list` or `target.getPipeline` endpoint
- [ ] Target detail page uses `target.getById` with full relations
- [ ] Drag-and-drop stage changes call `target.updateStatus` mutation
- [ ] Add target form calls `target.create` mutation
- [ ] All loading states show skeletons (already built)
- [ ] All error states display appropriate messages
- [ ] Data refreshes after mutations (optimistic updates preferred)

**Technical Tasks:**
```
1. Update /app/(dashboard)/pipeline/page.tsx:
   - Import trpc client
   - Replace MOCK_TARGETS with trpc.target.list.useQuery()
   - Wire onTargetMove to trpc.target.updateStatus.useMutation()
   - Wire onAddTarget to trpc.target.create.useMutation()

2. Update /app/(dashboard)/pipeline/[id]/page.tsx:
   - Replace mock target with trpc.target.getById.useQuery()
   - Add proper loading/error states
   - Wire action buttons to mutations

3. Verify target.ts router has all needed endpoints:
   - list (with pipeline stage filtering)
   - getById (with relations)
   - create
   - update
   - updateStatus (for stage changes)
   - delete (soft delete)
```

---

### Feature 2: Implement Edit Target Functionality (P1)

**Description:** Complete the edit target flow with form and mutation.

**Acceptance Criteria:**
- [ ] Edit button opens pre-populated form modal
- [ ] Form validates all fields with Zod schema
- [ ] Submit calls `target.update` mutation
- [ ] Success closes modal and refreshes data
- [ ] Error displays validation messages

**Technical Tasks:**
```
1. Create EditTargetModal component (or reuse AddTargetForm in edit mode)
2. Wire edit button click to open modal with target data
3. Implement update mutation call
4. Add success/error toast notifications
```

---

### Feature 3: Wire Quick Actions to Backend (P1)

**Description:** Connect all quick action menu items to real functionality.

**Acceptance Criteria:**
- [ ] "Add Note" opens note input and saves via mutation
- [ ] "Change Priority" updates target priority
- [ ] "Move Stage" opens stage picker and updates status
- [ ] "Assign" opens assignee picker and updates target
- [ ] "Archive" soft-deletes with confirmation
- [ ] All actions show loading state during mutation
- [ ] All actions show success/error feedback

**Technical Tasks:**
```
1. Add mutations for each action type
2. Create small modal/popover components for inputs
3. Wire handlers in TargetCard and detail page
4. Add toast notifications for feedback
```

---

### Feature 4: Implement Export Functionality (P2)

**Description:** Enable CSV and Excel export of pipeline data.

**Acceptance Criteria:**
- [ ] Export dropdown triggers download
- [ ] CSV export includes all visible columns
- [ ] Excel export with proper formatting
- [ ] Filters applied to export (export what you see)
- [ ] Loading indicator during export generation

**Technical Tasks:**
```
1. Create export utility functions (CSV, Excel)
2. Wire export dropdown handlers
3. Apply current filters to export data
4. Generate and trigger file download
```

---

### Feature 5: Add Bulk Operations (P2)

**Description:** Enable multi-select and batch operations on targets.

**Acceptance Criteria:**
- [ ] Checkbox selection on target cards
- [ ] "Select All" in header
- [ ] Bulk action bar appears when items selected
- [ ] Bulk stage change moves all selected
- [ ] Bulk archive with confirmation
- [ ] Selection clears after action

**Technical Tasks:**
```
1. Add selection state management
2. Create BulkActionBar component
3. Add batch mutation endpoints if needed
4. Wire bulk handlers
```

---

## Dependencies

### From Previous Sprints
- ✅ Sprint 1: Authentication, database, tRPC setup
- ✅ Sprint 2: SPAC management, dashboard integration

### Existing Backend Infrastructure
- `target.ts` router with CRUD operations
- `target.router.ts` with extended operations
- Prisma `Target` model with all fields
- `TargetStatus` enum for pipeline stages

### UI Components (Already Built)
- KanbanBoard, KanbanColumn components
- TargetCard, DealCard components
- AddTargetForm, AddDealForm components
- PipelineFilters, PipelineStats components
- Detail page with tabs

---

## Technical Notes

### Target Router Endpoints Available
```typescript
// From target.ts
- list: Paginated list with filters
- getById: Single target with relations
- create: Create new target
- update: Update target fields
- delete: Soft delete

// From target.router.ts (extended)
- getPipeline: Grouped by status for Kanban
- updateStatus: Change stage with audit
- updateScores: Update evaluation scores
- getStatistics: Pipeline analytics
- assignToSpac: Link target to SPAC
```

### Status to Stage Mapping
```typescript
// Database TargetStatus → UI Pipeline Stage
IDENTIFIED → Sourcing
RESEARCHING → Sourcing
OUTREACH → Initial Screening
NDA_SIGNED → Initial Screening
LOI_SIGNED → Deep Evaluation
DUE_DILIGENCE → Deep Evaluation
DA_SIGNED → Negotiation
CLOSING → Execution
COMPLETED → Closed
PASSED → Passed
```

---

## Definition of Done

- [ ] All pipeline data comes from database (no mock data)
- [ ] Stage changes persist via drag-and-drop
- [ ] Edit target fully functional
- [ ] All quick actions work
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Loading and error states work correctly
- [ ] Sprint completion document created

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Router endpoint gaps | Low | Medium | Audit router before starting |
| Type mismatches UI↔API | Medium | Medium | Use shared Zod schemas |
| Optimistic update bugs | Medium | Low | Fallback to refetch on error |

---

## Sprint Backlog Order

1. **Connect Pipeline to tRPC** - Foundation for everything else
2. **Implement Edit Target** - Core CRUD completion
3. **Wire Quick Actions** - User workflow completion
4. **Implement Export** - Nice-to-have if time permits
5. **Add Bulk Operations** - Nice-to-have if time permits

---

*Plan created: February 3, 2026*
*Revised after discovery: UI exists, focus on backend integration*
