# SPAC OS Issues Log

## Sprint 4 Issues

### Test Results
- **Build**: FAIL (Prisma schema validation error)
- **Lint**: 770 warnings (exceeds 100 threshold)
- **E2E**: 10/12 passed (2 failed)

### Issues Found

| ID | Severity | Description | File | Status |
|----|----------|-------------|------|--------|
| S4-001 | P0 | Prisma schema validation error - Note model relation to Target missing opposite relation field | `prisma/schema.prisma` | Open |
| S4-002 | P0 | Prisma schema validation error - Note model relation to Spac missing opposite relation field | `prisma/schema.prisma` | Open |
| S4-003 | P1 | E2E test failure - "should display sign-in page correctly" - strict mode violation with multiple matching elements | `e2e/auth.spec.ts:17` | Open |
| S4-004 | P1 | E2E test failure - "should display sign-up page correctly" - strict mode violation with multiple matching elements | `e2e/auth.spec.ts:28` | Open |
| S4-005 | P1 | Documents page still shows "Coming Soon" placeholder - not updated with new components | `src/app/(dashboard)/documents/page.tsx` | Open |
| S4-006 | P2 | DocumentUpload.tsx not found - UploadModal.tsx exists instead (naming mismatch) | `src/components/documents/` | Open |
| S4-007 | P2 | note.router.ts not found - note router not created | `src/server/api/routers/` | Open |
| S4-008 | P2 | 770 ESLint warnings exceed acceptable threshold (>100) | Various | Open |

### Sprint 4 Build Details

**Build Command**: `npm run build`
**Status**: FAILED
**Error**: Prisma schema validation (P1012)
```
Error: The relation field `target` on model `Note` is missing an opposite relation field on the model `Target`.
Error: The relation field `spac` on model `Note` is missing an opposite relation field on the model `Spac`.
```

**Root Cause Analysis**:
The Note model (lines 1161-1177) defines relations to Target and Spac models:
- `target Target? @relation(fields: [targetId], references: [id], onDelete: Cascade)`
- `spac Spac? @relation(fields: [spacId], references: [id], onDelete: Cascade)`

While Target (line 459) and Spac (line 391) already have `notes Note[]` defined, Prisma is not recognizing these as the opposite relations. This may be due to:
1. Missing explicit relation names
2. Order of model definitions
3. Schema cache issues

**Recommended Fix**: Run `prisma format` or add explicit relation names to both sides:
```prisma
// In Note model:
target Target? @relation("TargetNotes", fields: [targetId], references: [id], onDelete: Cascade)
spac   Spac?   @relation("SpacNotes", fields: [spacId], references: [id], onDelete: Cascade)

// In Target model:
notes Note[] @relation("TargetNotes")

// In Spac model:
notes Note[] @relation("SpacNotes")
```

### Sprint 4 E2E Test Results

**Test Command**: `npx playwright test`
**Total Tests**: 12
**Passed**: 10
**Failed**: 2

| Test | Status | Notes |
|------|--------|-------|
| should protect /spacs route | PASS | |
| should protect /dashboard route | PASS | |
| should protect /pipeline route | PASS | |
| should redirect unauthenticated users to sign-in | PASS | |
| should display sign-in page correctly | FAIL | Strict mode violation - 4 matching elements |
| should display sign-up page correctly | FAIL | Strict mode violation - 4 matching elements |
| should have Google OAuth option on sign-in | PASS | |
| should protect /compliance route | PASS | |
| should load the home page | PASS | |
| should protect /documents route | PASS | |
| should be responsive | PASS | |
| should have navigation to sign-in | PASS | |

**E2E Failure Analysis**:
The Clerk authentication component renders multiple elements matching the test selectors. Tests need to use more specific locators (e.g., `.first()` or more precise selectors).

### Sprint 4 Lint Results

**Lint Command**: `npm run lint`
**Total Warnings**: 770 warnings
**Status**: OVER THRESHOLD (>100)

**Warning Categories**:
1. Nested ternary expressions (no-nested-ternary)
2. Explicit `any` types (@typescript-eslint/no-explicit-any)
3. Import order violations (import/order)
4. Unused variables/imports
5. React hooks dependency warnings (react-hooks/exhaustive-deps)

### Sprint 4 File Verification

| Required File | Status | Notes |
|---------------|--------|-------|
| `/src/components/documents/DocumentUpload.tsx` | MISSING | UploadModal.tsx exists instead |
| `/src/components/documents/DocumentViewer.tsx` | EXISTS | Fully implemented |
| `/src/server/api/routers/document.router.ts` | EXISTS | Fully implemented |
| `/src/server/api/routers/note.router.ts` | MISSING | Not created yet |

### Sprint 4 Feature Verification

| Feature | Status | Notes |
|---------|--------|-------|
| Quick Actions (add note) | PARTIAL | QuickActions.tsx component exists but note router missing |
| Quick Actions (change priority) | PARTIAL | Component exists but wiring incomplete |
| Document Upload component | EXISTS | As UploadModal.tsx with full drag-drop support |
| Document Router | EXISTS | CRUD operations implemented |
| Documents page updated | NOT DONE | Still shows "Coming Soon" placeholder |
| SPAC/Target integration | PARTIAL | Relations defined but validation failing |

### Document Components Created

1. **AIAnalysisPanel.tsx** - AI-powered document analysis
2. **DocumentBrowser.tsx** - Browse documents
3. **DocumentCard.tsx** - Document card display
4. **DocumentSearch.tsx** - Search functionality
5. **DocumentViewer.tsx** - View documents with version history
6. **FolderTree.tsx** - Folder navigation
7. **UploadModal.tsx** - File upload with categories

### Recommendations for Sprint 4 Completion

#### Critical (Must Fix)
1. Fix Prisma schema validation by adding explicit relation names
2. Update E2E tests to use more specific Clerk selectors

#### High Priority
1. Create note.router.ts with CRUD operations
2. Update documents page to use new components
3. Rename UploadModal.tsx to DocumentUpload.tsx or update spec

#### Medium Priority
1. Wire quick actions to backend mutations
2. Reduce lint warnings below 100 threshold

---

## Sprint 3 Issues

### Open Issues

#### Critical (P0)

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| S3-001 | Jest test configuration fails - Playwright E2E tests in e2e/ directory are being picked up by Jest but Jest is not configured to handle Playwright/TypeScript imports | `e2e/auth.spec.ts`, `e2e/home.spec.ts` | N/A | Open |

#### High Priority (P1)

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| S3-002 | Unused imports: `exportToCSV`, `exportToExcel`, `ExportableTarget` - Export functions imported but not connected to UI buttons | `/src/app/(dashboard)/pipeline/page.tsx` | 26 | Open |
| S3-003 | Using `<img>` instead of Next.js `<Image />` component - affects LCP and bandwidth optimization | `/src/app/(dashboard)/pipeline/[id]/page.tsx` | 656 | Open |
| S3-004 | React Hook useEffect has missing dependency 'params' | `/src/app/(dashboard)/contacts/[id]/page.tsx` | 92 | Open |
| S3-005 | Complex expression in useEffect dependency array needs extraction | `/src/app/(dashboard)/contacts/[id]/page.tsx` | 92 | Open |

#### Medium Priority (P2)

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| S3-006 | Legacy mock data `_MOCK_TARGET_DEPRECATED` still in codebase (commented as to-be-deleted) | `/src/app/(dashboard)/pipeline/[id]/page.tsx` | 281-366 | Open |
| S3-007 | Legacy mock data `_MOCK_TARGETS_DEPRECATED` still in codebase (commented as to-be-deleted) | `/src/app/(dashboard)/pipeline/page.tsx` | 139-554 | Open |
| S3-008 | Unused variable `getSortIcon` | `/src/app/(dashboard)/spacs/page.tsx` | 185 | Open |
| S3-009 | Unused imports: `CardHeader`, `CardTitle`, `formatRelativeTime` | `/src/app/(dashboard)/tasks/page.tsx` | 19, 21 | Open |
| S3-010 | Unused variables: `viewMode`, `setViewMode` | `/src/app/(dashboard)/tasks/page.tsx` | 115 | Open |
| S3-011 | Unused import `SYSTEM_PROMPTS` | `/src/app/api/ai/chat/route.ts` | 8 | Open |
| S3-012 | TODO comment: "Implement edit target" not yet completed | `/src/app/(dashboard)/pipeline/page.tsx` | 1031 | Open |
| S3-013 | `isExporting` state variable defined but never used | `/src/app/(dashboard)/pipeline/page.tsx` | 672 | Open |

#### Low Priority (P3) - Code Style

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| S3-014 | Import order warnings across multiple files | Various | Various | Open |
| S3-015 | Nested ternary expressions across many files (100+ occurrences) | Various | Various | Open |
| S3-016 | `@typescript-eslint/no-explicit-any` warnings (100+ occurrences) | Various | Various | Open |
| S3-017 | `@typescript-eslint/no-non-null-assertion` warnings | Various | Various | Open |

#### Accessibility Issues (P2)

| ID | Issue | File | Line | Status |
|----|-------|------|------|--------|
| S3-018 | Click handlers on non-interactive elements without keyboard listeners | `/src/components/compliance/BoardMeetingManager.tsx` | 358 | Open |
| S3-019 | Click handlers on non-interactive elements without keyboard listeners | `/src/components/compliance/CommentLetterTracker.tsx` | 301 | Open |
| S3-020 | Click handlers on non-interactive elements without keyboard listeners | `/src/components/compliance/ConflictOfInterestLog.tsx` | 429 | Open |
| S3-021 | Click handlers on non-interactive elements without keyboard listeners | `/src/components/compliance/FilingCalendar.tsx` | 280 | Open |
| S3-022 | Click handlers on non-interactive elements without keyboard listeners | `/src/components/compliance/PolicyLibrary.tsx` | 449 | Open |
| S3-023 | Click handlers on non-interactive elements without keyboard listeners | `/src/components/contacts/CompanyProfile.tsx` | 285 | Open |

### Resolved Issues

| ID | Issue | Resolution | Date |
|----|-------|------------|------|
| (none yet) | | | |

---

## Testing Notes

### Build Test Results
- **Date**: 2026-02-02
- **Status**: SUCCESS (with warnings)
- **Build Command**: `npm run build`
- **Output**: Build completed successfully
- **Warnings**: 200+ ESLint warnings (see above categories)

### Lint Test Results
- **Date**: 2026-02-02
- **Status**: WARNINGS (exit code 1 due to warnings)
- **Lint Command**: `npm run lint`
- **Total Warnings**: 200+ warnings across the codebase

**Summary of Warning Categories:**
1. Unused variables/imports: ~50 occurrences
2. Nested ternary expressions: ~100 occurrences
3. `@typescript-eslint/no-explicit-any`: ~80 occurrences
4. Import order issues: ~15 occurrences
5. Accessibility (jsx-a11y): ~12 occurrences
6. Next.js `<img>` vs `<Image>`: 2 occurrences
7. React hooks exhaustive deps: 2 occurrences

### Unit Test Results
- **Date**: 2026-02-02
- **Status**: FAILED
- **Test Command**: `npm run test`
- **Issue**: Jest is attempting to run Playwright E2E tests from the `e2e/` directory
- **Error**: `SyntaxError: Cannot use import statement outside a module`
- **Root Cause**: Missing Jest configuration to:
  1. Exclude the `e2e/` directory from Jest test runs
  2. OR configure Jest to handle TypeScript ESM imports properly
- **Recommendation**: Add `testPathIgnorePatterns: ['<rootDir>/e2e/']` to jest.config.js

### E2E Test Results
- **Date**: 2026-02-02
- **Status**: NOT RUN (E2E tests exist but not executed)
- **E2E Command**: `npm run test:e2e`
- **Test Files Found**:
  - `e2e/auth.spec.ts` - Authentication tests (7 tests)
  - `e2e/home.spec.ts` - Home page tests

### Pipeline Page Code Review

#### `/src/app/(dashboard)/pipeline/page.tsx`
- **Lines of Code**: 1044
- **TypeScript Errors**: 0
- **Console.log Statements**: 0 (clean)
- **Issues Found**:
  1. Unused imports for export functionality (line 26)
  2. Large mock data block that should be removed (lines 139-554)
  3. Unused `isExporting` state (line 672)
  4. TODO comment for edit target (line 1031)

#### `/src/app/(dashboard)/pipeline/[id]/page.tsx`
- **Lines of Code**: 1172
- **TypeScript Errors**: 0
- **Console.log Statements**: 0 (clean)
- **Issues Found**:
  1. Using `<img>` instead of Next.js `<Image>` (line 656)
  2. Mock data block marked as deprecated (lines 281-366)
  3. Nested ternary expressions (lines 403, 966-967, 1161)

### Feature Status (Sprint 3)

| Feature | Status | Notes |
|---------|--------|-------|
| Pipeline Backend Integration (P0) | COMPLETE | tRPC queries and mutations working |
| Edit Target Functionality (P1) | COMPLETE | Modal and form implemented |
| Quick Actions (P1) | COMPLETE | View, edit, move, archive actions |
| Export Functionality (P2) | IN PROGRESS | Library exists, not connected to UI |
| Bulk Operations (P2) | IN PROGRESS | Being built by another agent |

### Console.log Audit
- **Files with console statements**: 3 files
  - `/src/lib/logger.ts` - Intentional logging utility (acceptable)
  - `/src/app/api/trpc/[trpc]/route.ts` - Error logging (acceptable)
  - `/src/server/api/routers/spac.ts` - Audit log error (acceptable)
- **Status**: CLEAN - No debug console.log statements found

### Missing Items
1. **Jest configuration file** - No `jest.config.js` or `jest.config.ts` found in project root
2. **E2E tests for Sprint 3 features** - No tests for new pipeline features

---

## Recommendations

### Immediate Actions (Before Sprint End)
1. Create `jest.config.js` with `testPathIgnorePatterns` to exclude `e2e/` directory
2. Connect export functions to the Export dropdown in pipeline page
3. Remove deprecated mock data from pipeline pages

### Technical Debt (Future Sprints)
1. Replace `<img>` elements with Next.js `<Image>` components
2. Refactor nested ternary expressions into helper functions
3. Add proper TypeScript types to replace `any` usage
4. Add keyboard event handlers to all clickable non-button elements
5. Clean up unused imports/variables across the codebase

---

## QA Summary

### Sprint 4 QA Status: BLOCKED
- **Build**: FAILING (Prisma schema validation)
- **Lint**: 770 warnings (over threshold)
- **E2E Tests**: 83% pass rate (10/12)
- **Blockers**: 2 P0 issues (Prisma schema relations)

### Overall Project Health
- Build cannot complete until Prisma schema is fixed
- Document management components exist but not integrated into page
- Note functionality partially implemented (model exists, router missing)
- Quick actions UI exists but backend wiring incomplete

---

*Last Updated: 2026-02-02*
*Sprint 4 QA Completed*
*QA Agent: Claude Opus 4.5*
