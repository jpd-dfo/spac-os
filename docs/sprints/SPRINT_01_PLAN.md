# Sprint 1: Initial Setup & Foundation

> **RETROACTIVE DOCUMENT** - Created February 3, 2026 for audit trail purposes.
> Original sprint completed February 1, 2026.

**Sprint Number:** 1
**Sprint Name:** Initial Setup & Foundation
**Duration:** January 30 - February 1, 2026
**PRD Version:** v4.0

---

## Sprint Goal

Establish the foundational architecture for SPAC OS including application scaffolding, authentication, database connectivity, API layer, and core UI components.

---

## Features to Build

### Feature 1: Next.js 14 Application Setup (P0)

**Description:** Create the base Next.js 14 application with App Router architecture and TypeScript configuration.

**Acceptance Criteria:**
- [ ] Next.js 14 project initialized with App Router
- [ ] TypeScript configured with strict mode
- [ ] ESLint and Prettier configured
- [ ] Tailwind CSS installed and configured
- [ ] Project structure follows best practices
- [ ] Development server runs without errors

**Technical Tasks:**
```
1. Initialize Next.js 14 project with create-next-app
2. Configure tsconfig.json with strict settings
3. Set up ESLint with recommended rules
4. Configure Tailwind CSS with custom theme
5. Create folder structure: app/, components/, lib/, server/
6. Add path aliases for cleaner imports
```

---

### Feature 2: Clerk Authentication Integration (P0)

**Description:** Implement authentication using Clerk with protected routes and user session management.

**Acceptance Criteria:**
- [ ] Clerk SDK installed and configured
- [ ] Environment variables set up for Clerk
- [ ] Sign-in and sign-up pages functional
- [ ] Protected routes redirect unauthenticated users
- [ ] User session available throughout the app
- [ ] Middleware protects dashboard routes

**Technical Tasks:**
```
1. Install @clerk/nextjs package
2. Configure environment variables (CLERK_SECRET_KEY, etc.)
3. Set up ClerkProvider in app layout
4. Create sign-in and sign-up pages
5. Implement middleware for route protection
6. Add currentUser() helper for server components
```

---

### Feature 3: Supabase PostgreSQL Database (P0)

**Description:** Set up Supabase PostgreSQL database for persistent data storage.

**Acceptance Criteria:**
- [ ] Supabase project created
- [ ] Database connection string configured
- [ ] Connection pool settings optimized
- [ ] Database accessible from application
- [ ] Storage bucket configured for files

**Technical Tasks:**
```
1. Create Supabase project
2. Configure DATABASE_URL environment variable
3. Set up connection pooling
4. Create Supabase Storage bucket for documents
5. Test database connectivity
```

---

### Feature 4: Prisma ORM Configuration (P0)

**Description:** Configure Prisma ORM with initial schema for core data models.

**Acceptance Criteria:**
- [ ] Prisma installed and configured
- [ ] Initial schema with SPAC and Target models
- [ ] Enum types defined (SpacStatus, TargetStatus)
- [ ] Relations properly configured
- [ ] Migrations applied to database
- [ ] Prisma Client generated

**Technical Tasks:**
```
1. Install prisma and @prisma/client
2. Initialize Prisma with PostgreSQL
3. Define SPAC model with all fields
4. Define Target model with all fields
5. Define Document model
6. Add enum types for status fields
7. Run initial migration
8. Generate Prisma client
```

---

### Feature 5: tRPC API Setup with React Query (P0)

**Description:** Implement type-safe API layer using tRPC with React Query integration.

**Acceptance Criteria:**
- [ ] tRPC server configured with app router
- [ ] tRPC client configured for frontend
- [ ] React Query integrated for caching
- [ ] Initial routers created (spac, target)
- [ ] Type safety working end-to-end
- [ ] API routes accessible at /api/trpc

**Technical Tasks:**
```
1. Install @trpc/server, @trpc/client, @trpc/react-query
2. Create tRPC context with Prisma and auth
3. Set up app router handler at /api/trpc/[trpc]
4. Create SPAC router with CRUD operations
5. Create Target router with CRUD operations
6. Configure tRPC client with superjson
7. Wrap app with QueryClientProvider
```

---

### Feature 6: Dashboard Shell with Navigation (P0)

**Description:** Build the main dashboard layout with sidebar navigation and header.

**Acceptance Criteria:**
- [ ] Dashboard layout component created
- [ ] Sidebar with navigation links
- [ ] Header with user menu
- [ ] Mobile-responsive navigation
- [ ] Active route highlighting
- [ ] Smooth transitions

**Technical Tasks:**
```
1. Create DashboardLayout component
2. Build Sidebar with navigation items
3. Build Header with user avatar and menu
4. Add mobile menu toggle
5. Implement route-based active states
6. Style with Tailwind CSS
```

---

### Feature 7: UI Component Library (P0)

**Description:** Install and configure shadcn/ui component library with custom theme.

**Acceptance Criteria:**
- [ ] shadcn/ui initialized
- [ ] Core components installed (Button, Card, Input, etc.)
- [ ] Custom color scheme applied
- [ ] Dark mode support configured
- [ ] Components accessible and documented
- [ ] Form components with validation support

**Technical Tasks:**
```
1. Initialize shadcn/ui with CLI
2. Install core components:
   - Button, Card, Dialog, DropdownMenu
   - Input, Label, Select, Textarea
   - Table, Tabs, Badge, Avatar
   - Toast, Tooltip, Skeleton
3. Configure theme colors in globals.css
4. Set up cn() utility for class merging
5. Add Lucide icons package
```

---

## Dependencies

### External Services
- Clerk (authentication)
- Supabase (database + storage)

### Key Packages
- next@14
- react@18
- typescript
- tailwindcss
- @clerk/nextjs
- @prisma/client
- @trpc/server
- @trpc/client
- @trpc/react-query
- @tanstack/react-query
- shadcn/ui components
- lucide-react

---

## Technical Notes

### Environment Variables Required
```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Database
DATABASE_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Folder Structure
```
/
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── spacs/
│   │   └── pipeline/
│   ├── api/
│   │   └── trpc/[trpc]/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── shared/
├── lib/
│   ├── utils.ts
│   └── trpc.ts
├── server/
│   ├── api/
│   │   ├── routers/
│   │   ├── root.ts
│   │   └── trpc.ts
│   └── db.ts
└── prisma/
    └── schema.prisma
```

---

## Definition of Done

- [ ] Next.js 14 app builds without errors
- [ ] Authentication flow works end-to-end
- [ ] Database connection verified
- [ ] tRPC endpoints respond correctly
- [ ] Dashboard shell renders properly
- [ ] UI components display correctly
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] All environment variables documented

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Clerk integration issues | Low | High | Follow official Next.js 14 docs |
| Database connection pooling | Medium | Medium | Use Supabase connection pooler |
| tRPC type inference | Medium | Low | Use latest versions with App Router |
| shadcn/ui compatibility | Low | Low | Pin to stable versions |

---

## Sprint Backlog Order

1. **Next.js 14 Application Setup** - Foundation for everything
2. **UI Component Library** - Needed for all UI work
3. **Supabase PostgreSQL Database** - Backend foundation
4. **Prisma ORM Configuration** - Data access layer
5. **Clerk Authentication** - Security layer
6. **tRPC API Setup** - API layer
7. **Dashboard Shell** - Main UI structure

---

*Plan created retroactively: February 3, 2026*
*Original sprint: January 30 - February 1, 2026*
