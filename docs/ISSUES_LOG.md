# SPAC OS Issues Log

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

*Last Updated: 2026-02-02*
*QA Agent: Claude Opus 4.5*
