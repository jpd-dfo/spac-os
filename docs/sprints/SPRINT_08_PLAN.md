# Sprint 8 Plan: CRM & Contacts + Full Integrations

**Sprint Number:** 8
**Sprint Name:** CRM & Contacts with Email/Calendar Integrations
**Status:** PLANNING
**Branch:** `feature/sprint-8-crm-contacts`
**Scope:** Extended sprint (full integrations included)

---

## Sprint Goal

Deliver a complete CRM module with contact management, company profiles, interaction tracking, full Gmail inbox sync, and Google Calendar + Calendly integration. Also fix P1 carryover issues from Sprint 6 in parallel.

---

## Parallel Tracks

- **Track A:** P1 Carryover Fixes (runs alongside Track B)
- **Track B:** CRM Core (Contact CRUD, Companies, Interactions)
- **Track C:** Email Integration (Gmail API inbox sync)
- **Track D:** Calendar Integration (Google Calendar + Calendly)

---

## Track A: P1 Carryover Fixes

### A1. SEC EDGAR Rate Limiter Serverless Fix
**Issue:** S6-001 - Module-level state not safe for serverless
**File:** `src/lib/compliance/secEdgarClient.ts`

**Changes:**
- Move rate limiter state to Redis or request-scoped
- Add serverless-safe rate limiting pattern

**Acceptance:** Rate limiting works correctly across serverless function instances

### A2. Alert Router Query Optimization
**Issue:** S6-002 - Inefficient double query for count
**File:** `src/server/api/routers/alert.router.ts`

**Changes:**
- Combine list + count into single query
- Use Prisma transaction or `_count` aggregation

**Acceptance:** Alert list query makes single DB call with count included

---

## Track B: CRM Core

### B1. Database Schema Extensions
**File:** `prisma/schema.prisma`

#### New/Modified Models:

```prisma
// EXTEND Contact model (currently 8 fields → 25+ fields)
model Contact {
  id                String         @id @default(cuid())
  firstName         String
  lastName          String
  email             String?
  phone             String?
  mobile            String?
  company           String?        // Deprecated: use companyId
  companyId         String?
  title             String?
  type              ContactType    @default(OTHER)
  status            ContactStatus  @default(ACTIVE)
  linkedIn          String?
  twitter           String?
  address           String?
  city              String?
  state             String?
  country           String?
  postalCode        String?
  avatarUrl         String?
  notes             String?
  tags              String[]       @default([])
  isStarred         Boolean        @default(false)
  relationshipScore Int            @default(0)
  lastInteractionAt DateTime?
  ownerId           String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  companyRef    Company?           @relation(fields: [companyId], references: [id])
  owner         User?              @relation(fields: [ownerId], references: [id])
  targets       TargetContact[]
  interactions  Interaction[]
  meetings      MeetingAttendee[]
  contactNotes  ContactNote[]
  emails        Email[]

  @@index([email])
  @@index([companyId])
  @@index([ownerId])
  @@index([status])
  @@map("contacts")
}

// NEW: ContactStatus enum
enum ContactStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
  PROSPECT
  LEAD
}

// NEW: Company model
model Company {
  id          String   @id @default(cuid())
  name        String
  industry    String?
  website     String?
  description String?
  type        String?  // "Investment Bank", "Law Firm", "Target", etc.
  size        String?  // "1-50", "51-200", etc.
  headquarters String?
  foundedYear Int?
  logoUrl     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  contacts  Contact[]
  deals     CompanyDeal[]

  @@index([name])
  @@map("companies")
}

// NEW: CompanyDeal (for deal history on company profiles)
model CompanyDeal {
  id        String  @id @default(cuid())
  companyId String
  dealName  String
  role      String  // "Lead Advisor", "Co-Counsel", etc.
  status    String  // "Won", "Lost", "In Progress"
  value     Decimal? @db.Decimal(18, 2)
  closedAt  DateTime?

  createdAt DateTime @default(now())

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@map("company_deals")
}

// NEW: Interaction model (activity log)
model Interaction {
  id          String          @id @default(cuid())
  contactId   String
  type        InteractionType
  subject     String?
  description String?
  date        DateTime        @default(now())
  duration    Int?            // minutes
  outcome     String?

  createdAt   DateTime @default(now())
  createdById String?

  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  createdBy User?   @relation(fields: [createdById], references: [id])

  @@index([contactId])
  @@index([date])
  @@map("interactions")
}

// NEW: InteractionType enum
enum InteractionType {
  EMAIL
  CALL
  MEETING
  NOTE
  TASK
  LINKEDIN
  OTHER
}

// NEW: ContactNote model
model ContactNote {
  id        String   @id @default(cuid())
  contactId String
  content   String
  isPinned  Boolean  @default(false)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdById String?

  contact   Contact @relation(fields: [contactId], references: [id], onDelete: Cascade)
  createdBy User?   @relation(fields: [createdById], references: [id])

  @@index([contactId])
  @@map("contact_notes")
}

// NEW: Meeting model
model Meeting {
  id           String    @id @default(cuid())
  title        String
  description  String?
  startTime    DateTime
  endTime      DateTime
  location     String?
  meetingUrl   String?   // Zoom/Google Meet link
  calendarId   String?   // Google Calendar event ID
  calendlyId   String?   // Calendly event ID

  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  createdById  String?

  createdBy  User?              @relation(fields: [createdById], references: [id])
  attendees  MeetingAttendee[]

  @@index([startTime])
  @@map("meetings")
}

// NEW: MeetingAttendee junction
model MeetingAttendee {
  id        String  @id @default(cuid())
  meetingId String
  contactId String?
  userId    String?
  email     String?
  status    String  @default("pending") // "accepted", "declined", "pending"

  meeting Meeting  @relation(fields: [meetingId], references: [id], onDelete: Cascade)
  contact Contact? @relation(fields: [contactId], references: [id])
  user    User?    @relation(fields: [userId], references: [id])

  @@unique([meetingId, contactId])
  @@unique([meetingId, userId])
  @@map("meeting_attendees")
}

// NEW: Email model (for Gmail sync)
model Email {
  id           String   @id @default(cuid())
  contactId    String?
  gmailId      String   @unique  // Gmail message ID
  threadId     String            // Gmail thread ID
  subject      String?
  snippet      String?           // Preview text
  body         String?           // Full body (HTML)
  direction    EmailDirection
  fromEmail    String
  toEmails     String[]
  ccEmails     String[]  @default([])
  date         DateTime
  isRead       Boolean   @default(false)
  isStarred    Boolean   @default(false)
  labels       String[]  @default([])

  createdAt    DateTime  @default(now())

  contact Contact? @relation(fields: [contactId], references: [id])

  @@index([contactId])
  @@index([threadId])
  @@index([date])
  @@map("emails")
}

// NEW: EmailDirection enum
enum EmailDirection {
  INBOUND
  OUTBOUND
}

// NEW: CalendarConnection (OAuth tokens)
model CalendarConnection {
  id           String   @id @default(cuid())
  userId       String   @unique
  provider     String   // "google", "calendly"
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  scope        String?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("calendar_connections")
}

// NEW: EmailConnection (Gmail OAuth tokens)
model EmailConnection {
  id           String   @id @default(cuid())
  userId       String   @unique
  provider     String   // "gmail"
  accessToken  String
  refreshToken String?
  expiresAt    DateTime?
  historyId    String?  // Gmail history ID for incremental sync

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("email_connections")
}
```

**Migration:** `npx prisma migrate dev --name sprint8_crm_models`

### B2. Contact Router (tRPC)
**File:** `src/server/api/routers/contact.router.ts` (NEW)

**Procedures:**
```typescript
// CRUD
contact.list        // Paginated list with filters (status, type, company, search)
contact.getById     // Single contact with relations
contact.create      // Create contact
contact.update      // Update contact
contact.delete      // Soft delete (set status ARCHIVED)
contact.bulkDelete  // Bulk archive

// Search & Filter
contact.search      // Full-text search across name, email, company
contact.getByCompany // Contacts by company ID

// Favorites
contact.toggleStar  // Toggle isStarred

// Relationship
contact.updateScore // Update relationship score
contact.linkToTarget // Link contact to target company
```

**File:** `src/server/api/routers/company.router.ts` (NEW)

**Procedures:**
```typescript
company.list        // Paginated list
company.getById     // Single company with contacts
company.create      // Create company
company.update      // Update company
company.delete      // Delete company
company.search      // Search companies
company.getDeals    // Get company deal history
```

**File:** `src/server/api/routers/interaction.router.ts` (NEW)

**Procedures:**
```typescript
interaction.list          // List by contact ID
interaction.create        // Log new interaction
interaction.update        // Update interaction
interaction.delete        // Delete interaction
interaction.getTimeline   // Chronological timeline for contact
```

### B3. Wire /contacts Page
**File:** `src/app/(dashboard)/contacts/page.tsx`

**Changes:**
- Replace "Coming Soon" with ContactList component
- Wire to `trpc.contact.list`
- Add create contact modal with `trpc.contact.create`
- Wire filters to query params
- Wire search to debounced query

**Acceptance:**
- Page shows real contacts from database
- Search, filter, sort work
- Create new contact persists to DB

### B4. Wire /contacts/[id] Page
**File:** `src/app/(dashboard)/contacts/[id]/page.tsx`

**Changes:**
- Replace mock `getContactById` with `trpc.contact.getById`
- Wire interaction log to `trpc.interaction.list`
- Wire notes to `trpc.contactNote.list`
- Wire edit form to `trpc.contact.update`
- Wire company profile to `trpc.company.getById`

**Acceptance:**
- Contact detail shows real data
- Editing saves to database
- Interaction timeline shows real history

### B5. Seed Data Script
**File:** `prisma/seed.ts` (UPDATE)

**Changes:**
- Convert `mockContactsData.ts` to seed script
- Create 30 contacts with realistic data
- Create 10 companies
- Create sample interactions
- Link contacts to companies

**Acceptance:** Running `npx prisma db seed` populates demo data

---

## Track C: Email Integration (Gmail API)

### C1. Google OAuth Setup
**Files:**
- `src/app/api/auth/google/route.ts` (NEW)
- `src/app/api/auth/google/callback/route.ts` (NEW)

**Changes:**
- Implement OAuth 2.0 flow for Gmail API
- Request scopes: `gmail.readonly`, `gmail.send`, `gmail.modify`
- Store tokens in EmailConnection model
- Handle token refresh

**Environment Variables:**
```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
```

### C2. Gmail Service
**File:** `src/lib/services/gmailService.ts` (NEW)

**Functions:**
```typescript
// Auth
getGmailClient(userId: string)    // Get authenticated Gmail API client
refreshTokenIfNeeded(userId)      // Handle token refresh

// Sync
syncInbox(userId, options)        // Full or incremental sync
fetchThreads(userId, query)       // Search emails
fetchThread(userId, threadId)     // Get full thread

// Send
sendEmail(userId, to, subject, body, options)  // Compose and send
replyToThread(userId, threadId, body)          // Reply in thread

// Webhooks
handlePushNotification(payload)   // Handle Gmail push notifications
```

### C3. Email Router (tRPC)
**File:** `src/server/api/routers/email.router.ts` (NEW)

**Procedures:**
```typescript
email.connect       // Initiate OAuth flow
email.disconnect    // Revoke access
email.getStatus     // Check connection status
email.sync          // Trigger inbox sync
email.list          // List emails (with contact filter)
email.getThread     // Get email thread
email.send          // Send new email
email.reply         // Reply to thread
email.markRead      // Mark as read
email.toggleStar    // Star/unstar
```

### C4. Email UI Components
**Files:**
- `src/components/contacts/EmailInbox.tsx` (NEW)
- `src/components/contacts/EmailThread.tsx` (NEW)
- `src/components/contacts/EmailCompose.tsx` (NEW)
- `src/components/contacts/EmailConnectButton.tsx` (NEW)

**Features:**
- Inbox view with threads
- Thread view with full conversation
- Compose modal with rich text
- Contact-filtered email view on contact detail page

### C5. Gmail Webhook Handler
**File:** `src/app/api/webhooks/gmail/route.ts` (NEW)

**Changes:**
- Handle Gmail push notifications
- Trigger incremental sync on new emails
- Update Email records in real-time

**Acceptance:**
- User can connect Gmail account
- Inbox shows real emails from Gmail
- Sending email works and appears in Gmail
- New emails sync automatically via webhook

---

## Track D: Calendar Integration

### D1. Google Calendar OAuth
**Files:**
- Extend `src/app/api/auth/google/route.ts`
- Add scope: `calendar.events`, `calendar.readonly`

**Changes:**
- Add calendar scopes to existing Google OAuth
- Store calendar tokens in CalendarConnection model

### D2. Google Calendar Service
**File:** `src/lib/services/googleCalendarService.ts` (NEW)

**Functions:**
```typescript
// Auth
getCalendarClient(userId)         // Get authenticated Calendar client

// Events
listEvents(userId, timeMin, timeMax)  // List events in range
createEvent(userId, event)            // Create calendar event
updateEvent(userId, eventId, updates) // Update event
deleteEvent(userId, eventId)          // Delete event

// Sync
syncEventsToMeetings(userId)      // Sync calendar to Meeting model
```

### D3. Calendly Integration
**File:** `src/lib/services/calendlyService.ts` (NEW)

**Functions:**
```typescript
// Auth
getCalendlyClient(userId)         // Get authenticated Calendly client
connectCalendly(userId, apiKey)   // Store API key

// Scheduling
getSchedulingLinks(userId)        // Get user's scheduling links
getEventTypes(userId)             // Get event types
createInviteeLink(eventTypeUri, inviteeEmail)  // Generate booking link

// Webhooks
handleCalendlyWebhook(payload)    // Handle scheduled/cancelled events
```

**Environment Variables:**
```
CALENDLY_CLIENT_ID=
CALENDLY_CLIENT_SECRET=
CALENDLY_WEBHOOK_SECRET=
```

### D4. Calendar Router (tRPC)
**File:** `src/server/api/routers/calendar.router.ts` (NEW)

**Procedures:**
```typescript
// Google Calendar
calendar.connectGoogle      // Initiate Google OAuth
calendar.disconnectGoogle   // Revoke access
calendar.getGoogleEvents    // List events from Google Calendar
calendar.createGoogleEvent  // Create event in Google Calendar

// Calendly
calendar.connectCalendly    // Store Calendly API key
calendar.disconnectCalendly // Remove connection
calendar.getCalendlyLinks   // Get scheduling links
calendar.createCalendlyLink // Generate booking link for contact

// Meetings (internal)
meeting.list                // List meetings
meeting.getById             // Get meeting details
meeting.create              // Create meeting (sync to Google if connected)
meeting.update              // Update meeting
meeting.delete              // Delete meeting
meeting.addAttendee         // Add attendee to meeting
```

### D5. Calendar UI Components
**Files:**
- `src/components/contacts/MeetingScheduler.tsx` (NEW)
- `src/components/contacts/CalendarView.tsx` (NEW)
- `src/components/contacts/CalendlyBooking.tsx` (NEW)
- `src/components/contacts/CalendarConnectButton.tsx` (NEW)

**Features:**
- Meeting creation form with date/time picker
- Calendar view of scheduled meetings
- Calendly scheduling link generator
- Connection status indicators

### D6. Calendar Webhooks
**File:** `src/app/api/webhooks/calendly/route.ts` (NEW)

**Changes:**
- Handle Calendly invitee.created events
- Handle Calendly invitee.canceled events
- Create/update Meeting records

**Acceptance:**
- User can connect Google Calendar
- Meetings created in app appear in Google Calendar
- Google Calendar events sync to app
- User can generate Calendly booking links
- Calendly bookings create Meeting records

---

## Files to Create

### New Files (26)
```
src/server/api/routers/contact.router.ts
src/server/api/routers/company.router.ts
src/server/api/routers/interaction.router.ts
src/server/api/routers/email.router.ts
src/server/api/routers/calendar.router.ts

src/lib/services/gmailService.ts
src/lib/services/googleCalendarService.ts
src/lib/services/calendlyService.ts
src/lib/services/relationshipScoring.ts

src/app/api/auth/google/route.ts
src/app/api/auth/google/callback/route.ts
src/app/api/webhooks/gmail/route.ts
src/app/api/webhooks/calendly/route.ts

src/components/contacts/EmailInbox.tsx
src/components/contacts/EmailThread.tsx
src/components/contacts/EmailCompose.tsx
src/components/contacts/EmailConnectButton.tsx
src/components/contacts/MeetingScheduler.tsx
src/components/contacts/CalendarView.tsx
src/components/contacts/CalendlyBooking.tsx
src/components/contacts/CalendarConnectButton.tsx

e2e/contacts.spec.ts
e2e/email-integration.spec.ts
e2e/calendar-integration.spec.ts

prisma/seed-contacts.ts
```

### Files to Modify (12)
```
prisma/schema.prisma              # Add 10+ new models
src/server/api/root.ts            # Register new routers
src/server/api/routers/index.ts   # Export new routers

src/app/(dashboard)/contacts/page.tsx       # Wire to tRPC
src/app/(dashboard)/contacts/[id]/page.tsx  # Wire to tRPC

src/components/contacts/ContactList.tsx     # Use tRPC instead of mock
src/components/contacts/ContactCard.tsx     # Use tRPC mutations
src/components/contacts/AddContactForm.tsx  # Use tRPC create
src/components/contacts/InteractionLog.tsx  # Use tRPC queries
src/components/contacts/CompanyProfile.tsx  # Use tRPC queries

src/lib/compliance/secEdgarClient.ts        # Fix serverless rate limiter
src/server/api/routers/alert.router.ts      # Optimize query
```

---

## Dependencies & Ordering

```
Track A (P1 Fixes) ──────────────────────────────────────► (can complete anytime)

Track B (CRM Core):
  B1 (Schema) ─► B2 (Routers) ─► B3 (/contacts) ─► B4 (/contacts/[id]) ─► B5 (Seed)

Track C (Email):
  C1 (OAuth) ─► C2 (Gmail Service) ─► C3 (Router) ─► C4 (UI) ─► C5 (Webhooks)
      │
      └── Requires B1 complete (Email model)

Track D (Calendar):
  D1 (OAuth) ─► D2 (GCal Service) ─► D3 (Calendly) ─► D4 (Router) ─► D5 (UI) ─► D6 (Webhooks)
      │
      └── Requires B1 complete (Meeting model)
```

**Recommended Order:**
1. B1 (Schema) - Unblocks everything
2. A1 + A2 (P1 Fixes) - Quick wins in parallel
3. B2 (Routers) - Core CRUD
4. B3 + B4 (Pages) - Wire UI
5. C1 + D1 (OAuth setup) - Can be parallel
6. C2 + C3 + C4 (Email) - Full email flow
7. D2 + D3 + D4 + D5 (Calendar) - Full calendar flow
8. C5 + D6 (Webhooks) - Real-time sync
9. B5 (Seed data) - Demo readiness
10. E2E Tests

---

## Acceptance Criteria

### Track A - P1 Fixes
- [ ] SEC EDGAR rate limiter works in serverless (test with multiple concurrent requests)
- [ ] Alert list query makes single DB call (verify with query logging)

### Track B - CRM Core
- [ ] `/contacts` shows real contacts from database
- [ ] Can create, edit, delete contacts
- [ ] Search and filters work
- [ ] `/contacts/[id]` shows full contact profile
- [ ] Interaction timeline shows logged activities
- [ ] Company profiles display with linked contacts
- [ ] Relationship scores calculate and display
- [ ] Seed data creates 30 contacts, 10 companies

### Track C - Email Integration
- [ ] User can connect Gmail account via OAuth
- [ ] Inbox displays real emails from Gmail
- [ ] Can view email threads
- [ ] Can compose and send emails
- [ ] Sent emails appear in Gmail
- [ ] New incoming emails sync automatically
- [ ] Emails linked to contacts in database

### Track D - Calendar Integration
- [ ] User can connect Google Calendar
- [ ] Can view calendar events
- [ ] Creating meeting syncs to Google Calendar
- [ ] Google Calendar events sync to app
- [ ] User can connect Calendly
- [ ] Can generate Calendly booking links
- [ ] Calendly bookings create Meeting records

---

## Verification Plan

### Build Gate
```bash
npm run build        # Must pass
npm run lint         # Warnings OK, no errors
npx prisma validate  # Schema valid
npm run test:e2e     # E2E tests pass
```

### Manual Testing Checklist
1. [ ] Navigate to `/contacts` - shows contact list
2. [ ] Create new contact - persists to DB
3. [ ] Edit contact - changes save
4. [ ] Search contacts - results filter correctly
5. [ ] View contact detail - all tabs work
6. [ ] Log interaction - appears in timeline
7. [ ] Connect Gmail - OAuth flow completes
8. [ ] View inbox - emails load
9. [ ] Send email - appears in Gmail
10. [ ] Connect Google Calendar - OAuth completes
11. [ ] Create meeting - syncs to calendar
12. [ ] Generate Calendly link - link works
13. [ ] Run seed - demo data populates

---

## Environment Variables Required

```env
# Google OAuth (Gmail + Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Calendly
CALENDLY_CLIENT_ID=
CALENDLY_CLIENT_SECRET=
CALENDLY_WEBHOOK_SECRET=

# Existing (verify configured)
RESEND_API_KEY=  # For email fallback if Gmail not connected
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google OAuth approval delays | Medium | High | Use test mode initially |
| Gmail API rate limits | Low | Medium | Implement exponential backoff |
| Calendly API changes | Low | Low | Version lock API calls |
| Schema migration conflicts | Medium | Medium | Test migration on staging first |
| Extended timeline | High | Medium | Prioritize CRM core if needed |

---

## Fallback Plan

If integrations prove too complex for single sprint:

**Sprint 8a (Core CRM):**
- B1-B5: Full contact management
- A1-A2: P1 fixes
- Basic email send via Resend (no sync)

**Sprint 8b (Integrations):**
- C1-C5: Full Gmail integration
- D1-D6: Full Calendar + Calendly

---

*Plan created: February 3, 2026*
*Expected duration: Extended sprint (10-14 days)*
