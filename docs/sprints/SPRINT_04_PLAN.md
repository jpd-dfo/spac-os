# Sprint 4: Document Management

**Sprint Number:** 4
**Sprint Name:** Document Management
**Duration:** February 3-4, 2026
**Branch:** `feature/sprint-4-document-management`
**PRD Version:** v4.3

---

## Sprint Goal

Implement a complete document management system with upload, storage, viewing, versioning, and search capabilities, while addressing carryover items from Sprint 3.

---

## Carryover from Sprint 3 (P0)

### Carryover 1: Complete Quick Actions
**Description:** Finish incomplete quick actions from Sprint 3.

**Tasks:**
1. **Add Note functionality**
   - Create notes table in Prisma schema (if not exists)
   - Create notes tRPC router with CRUD operations
   - Wire "Add Note" quick action to mutation
   - Display notes in target detail page

2. **Change Priority quick action**
   - Add priority update mutation to target router
   - Wire "Change Priority" quick action
   - Add priority picker dropdown

**Acceptance Criteria:**
- [ ] Add Note opens modal, saves note to database
- [ ] Notes display in target detail activity/notes section
- [ ] Change Priority updates target priority immediately
- [ ] All quick actions show loading/success feedback

---

## Issues from Previous QA/Product Review (P1)

### Issue 1: Fix Flaky E2E Tests
**Description:** 3 E2E tests failing due to Clerk locator issues.

**Tasks:**
- Update selectors in `e2e/auth.spec.ts` to be more specific
- Update selectors in `e2e/home.spec.ts` to be more specific
- Ensure all 12 E2E tests pass

**Acceptance Criteria:**
- [ ] All 12 existing E2E tests pass

### Issue 2: Reduce ESLint Warnings
**Description:** 200+ ESLint warnings affecting code quality.

**Tasks:**
- Fix unused imports/variables (prefix with `_` or remove)
- Fix nested ternaries in critical files
- Address `any` types where feasible

**Acceptance Criteria:**
- [ ] ESLint warnings reduced to <100
- [ ] No ESLint errors

### Issue 3: Use Next.js Image Component
**Description:** Native `<img>` used in pipeline detail page.

**Tasks:**
- Replace `<img>` with `<Image>` from next/image in pipeline/[id]/page.tsx

**Acceptance Criteria:**
- [ ] No `<img>` tags in pipeline pages

---

## Sprint 4 Features (from PRD)

### Feature 1: Document Upload with Drag-and-Drop (P0)

**Description:** Enable users to upload documents via drag-and-drop or file picker.

**Acceptance Criteria:**
- [ ] Drag-and-drop zone accepts files
- [ ] File picker button as fallback
- [ ] Multiple file upload supported
- [ ] File type validation (PDF, DOC, DOCX, XLS, XLSX, images)
- [ ] File size limit enforced (50MB max)
- [ ] Upload progress indicator
- [ ] Success/error feedback

**Technical Tasks:**
```
1. Create DocumentUpload component with react-dropzone
2. Add file validation utilities
3. Create upload progress UI
4. Integrate with storage backend
```

---

### Feature 2: Document Storage (Supabase Storage) (P0)

**Description:** Store uploaded documents in Supabase Storage.

**Acceptance Criteria:**
- [ ] Documents uploaded to Supabase Storage bucket
- [ ] Secure signed URLs for document access
- [ ] File metadata stored in database
- [ ] Documents linked to SPAC or Target

**Technical Tasks:**
```
1. Create Supabase Storage bucket "documents"
2. Add document upload API endpoint
3. Store document metadata in Document table
4. Generate signed URLs for downloads
```

---

### Feature 3: Document Viewer for PDFs (P1)

**Description:** In-app PDF viewer for document preview.

**Acceptance Criteria:**
- [ ] PDF documents open in modal viewer
- [ ] Page navigation (next/prev)
- [ ] Zoom controls
- [ ] Download button
- [ ] Close button

**Technical Tasks:**
```
1. Install pdf.js or react-pdf library
2. Create DocumentViewer component
3. Add viewer modal with controls
4. Handle loading states
```

---

### Feature 4: Document Versioning (P1)

**Description:** Track document versions when re-uploading.

**Acceptance Criteria:**
- [ ] New upload of same document creates new version
- [ ] Version history displayed
- [ ] Ability to view/download previous versions
- [ ] Version number auto-incremented

**Technical Tasks:**
```
1. Add version field to Document model
2. Create version tracking logic
3. Display version history in UI
4. Add version comparison view
```

---

### Feature 5: Document Categorization and Tagging (P1)

**Description:** Organize documents with categories and tags.

**Acceptance Criteria:**
- [ ] Document category dropdown (Corporate, Financial, Legal, etc.)
- [ ] Custom tags support
- [ ] Filter documents by category
- [ ] Filter documents by tags

**Technical Tasks:**
```
1. Use existing DocumentCategory enum
2. Add tags field to Document model (if needed)
3. Create category/tag filter UI
4. Implement filter queries
```

---

### Feature 6: Document Search (P2)

**Description:** Search documents by name, category, or tags.

**Acceptance Criteria:**
- [ ] Search input on documents page
- [ ] Search by document name
- [ ] Search by category
- [ ] Search by tags
- [ ] Results highlight matches

**Technical Tasks:**
```
1. Add search endpoint to document router
2. Create search input component
3. Implement debounced search
4. Display search results
```

---

### Feature 7: Integration with SPAC and Target Pages (P2)

**Description:** Show documents on SPAC and Target detail pages.

**Acceptance Criteria:**
- [ ] Documents tab on SPAC detail page shows related docs
- [ ] Documents tab on Target detail page shows related docs
- [ ] Upload documents directly from entity pages
- [ ] Link existing documents to entities

**Technical Tasks:**
```
1. Add documents query to SPAC detail
2. Add documents query to Target detail
3. Add upload button to entity pages
4. Create document linking UI
```

---

## Dependencies

### From Previous Sprints
- ✅ Supabase database configured
- ✅ tRPC API setup
- ✅ Document Prisma model exists
- ✅ SPAC and Target pages built

### New Dependencies
- Supabase Storage bucket configuration
- PDF viewer library (react-pdf or pdf.js)

### Environment Variables Needed
```
NEXT_PUBLIC_SUPABASE_URL=<already configured>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<already configured>
SUPABASE_SERVICE_ROLE_KEY=<may need for storage>
```

---

## Technical Notes

### Document Model (existing in Prisma)
```prisma
model Document {
  id            String           @id @default(uuid())
  name          String
  type          DocumentType
  category      DocumentCategory
  status        DocumentStatus   @default(DRAFT)
  url           String?
  storageKey    String?
  size          Int?
  mimeType      String?
  version       Int              @default(1)
  spacId        String?
  targetId      String?
  ...
}
```

### Storage Structure
```
documents/
├── spac_{spacId}/
│   └── {documentId}_{version}.{ext}
└── target_{targetId}/
    └── {documentId}_{version}.{ext}
```

---

## Definition of Done

- [ ] All carryover items completed
- [ ] All QA issues addressed (ESLint <100 warnings)
- [ ] All E2E tests pass (12 existing + new)
- [ ] Document upload working with drag-and-drop
- [ ] Documents stored in Supabase Storage
- [ ] PDF viewer functional
- [ ] Document versioning works
- [ ] Categories and tags working
- [ ] Search functional
- [ ] Integration with SPAC/Target pages complete
- [ ] Build passes with no TypeScript errors
- [ ] No lint errors

---

## Sprint Backlog Order

1. **Carryover: Quick Actions** - Complete Sprint 3 items
2. **Fix E2E Tests** - Ensure test stability
3. **Document Upload** - Core functionality
4. **Document Storage** - Backend integration
5. **Document Viewer** - PDF preview
6. **Categorization & Tagging** - Organization
7. **Document Versioning** - Version tracking
8. **Document Search** - Discovery
9. **SPAC/Target Integration** - Cross-feature links
10. **ESLint Cleanup** - Code quality

---

*Plan created: February 3, 2026*
