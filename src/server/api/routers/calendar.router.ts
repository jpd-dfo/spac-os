/**
 * SPAC OS - Calendar Router
 * Google Calendar OAuth, calendar operations, Calendly integration, and meeting CRUD
 * Sprint 8 CRM Module - Track D
 */

import { type Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema, PaginationSchema, DateRangeSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

// ============================================================================
// SCHEMAS
// ============================================================================

const AttendeeStatusSchema = z.enum(['accepted', 'declined', 'pending', 'tentative']);

const MeetingCreateSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().max(500).optional(),
  meetingUrl: z.string().url().optional(),
  syncToGoogle: z.boolean().default(false),
  attendees: z.array(z.object({
    contactId: UuidSchema.optional(),
    userId: UuidSchema.optional(),
    email: z.string().email().optional(),
  })).optional(),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: 'Start time must be before end time' }
);

const MeetingUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  location: z.string().max(500).optional().nullable(),
  meetingUrl: z.string().url().optional().nullable(),
});

const MeetingFilterSchema = z.object({
  dateRange: DateRangeSchema.optional(),
  contactId: UuidSchema.optional(),
  search: z.string().optional(),
  ...PaginationSchema.shape,
});

const GoogleEventSchema = z.object({
  summary: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  location: z.string().max(500).optional(),
  attendees: z.array(z.string().email()).optional(),
  conferenceData: z.boolean().default(false), // Request Google Meet link
});

const GoogleEventUpdateSchema = z.object({
  eventId: z.string().min(1),
  summary: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  location: z.string().max(500).optional().nullable(),
  attendees: z.array(z.string().email()).optional(),
});

// ============================================================================
// CALENDAR ROUTER
// ============================================================================

export const calendarRouter = createTRPCRouter({
  // ============================================================================
  // GOOGLE CALENDAR OAUTH
  // ============================================================================

  /**
   * Get Google OAuth URL to initiate connection
   */
  connectGoogle: protectedProcedure
    .input(z.object({
      redirectUri: z.string().url().optional(),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      // TODO: Implement Google OAuth URL generation
      // 1. Generate state token for CSRF protection
      // 2. Build OAuth URL with proper scopes:
      //    - https://www.googleapis.com/auth/calendar
      //    - https://www.googleapis.com/auth/calendar.events
      // 3. Store state in session/db for verification

      const clientId = process.env['GOOGLE_CLIENT_ID'];
      if (!clientId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Google OAuth not configured',
        });
      }

      const appUrl = process.env['NEXT_PUBLIC_APP_URL'] ?? 'http://localhost:3000';
      const redirectUri = input?.redirectUri ?? `${appUrl}/api/auth/google/callback`;
      const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events');
      const state = Buffer.from(JSON.stringify({ userId: ctx.user.id, timestamp: Date.now() })).toString('base64');

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${scope}` +
        `&access_type=offline` +
        `&prompt=consent` +
        `&state=${state}`;

      return { authUrl, state };
    }),

  /**
   * Disconnect Google Calendar (revoke access and delete connection)
   */
  disconnectGoogle: orgAuditedProcedure
    .mutation(async ({ ctx }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'google',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No Google Calendar connection found',
        });
      }

      // TODO: Revoke access token with Google API
      // await fetch(`https://oauth2.googleapis.com/revoke?token=${connection.accessToken}`, {
      //   method: 'POST',
      // });

      await ctx.db.calendarConnection.delete({
        where: { id: connection.id },
      });

      return { success: true, message: 'Google Calendar disconnected' };
    }),

  /**
   * Check if Google Calendar is connected
   */
  getGoogleStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'google',
        },
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          scope: true,
        },
      });

      if (!connection) {
        return {
          connected: false,
          connection: null,
        };
      }

      const isExpired = connection.expiresAt ? connection.expiresAt < new Date() : false;

      return {
        connected: true,
        isExpired,
        connection: {
          id: connection.id,
          connectedAt: connection.createdAt,
          expiresAt: connection.expiresAt,
          scope: connection.scope,
        },
      };
    }),

  // ============================================================================
  // GOOGLE CALENDAR OPERATIONS (STUBS)
  // ============================================================================

  /**
   * List events from Google Calendar
   */
  getGoogleEvents: protectedProcedure
    .input(z.object({
      timeMin: z.coerce.date().optional(),
      timeMax: z.coerce.date().optional(),
      maxResults: z.number().int().min(1).max(250).default(50),
      calendarId: z.string().default('primary'),
    }))
    .query(async ({ ctx, input }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'google',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Calendar not connected. Please connect your Google account first.',
        });
      }

      // TODO: Implement Google Calendar API call
      // 1. Refresh access token if expired
      // 2. Call Google Calendar API:
      //    GET https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events
      //    - timeMin, timeMax, maxResults query params
      //    - Authorization: Bearer {accessToken}
      // 3. Transform response to normalized format

      // Stub response
      return {
        events: [] as Array<{
          id: string;
          summary: string;
          description?: string;
          start: Date;
          end: Date;
          location?: string;
          attendees?: Array<{ email: string; responseStatus: string }>;
          htmlLink?: string;
          hangoutLink?: string;
        }>,
        nextPageToken: null as string | null,
        timeMin: input.timeMin ?? new Date(),
        timeMax: input.timeMax ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      };
    }),

  /**
   * Create event in Google Calendar
   */
  createGoogleEvent: orgAuditedProcedure
    .input(GoogleEventSchema)
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'google',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Calendar not connected',
        });
      }

      // TODO: Implement Google Calendar API call
      // 1. Refresh access token if expired
      // 2. Call Google Calendar API:
      //    POST https://www.googleapis.com/calendar/v3/calendars/primary/events
      //    - Body: event object with start, end, summary, description, attendees, etc.
      //    - If conferenceData: add conferenceDataVersion=1 and conferenceData.createRequest
      // 3. Return created event

      // Stub response
      const stubEventId = `google_event_${Date.now()}`;

      return {
        success: true,
        event: {
          id: stubEventId,
          summary: input.summary,
          description: input.description,
          start: input.startTime,
          end: input.endTime,
          location: input.location,
          attendees: input.attendees?.map(email => ({ email, responseStatus: 'needsAction' })),
          htmlLink: `https://calendar.google.com/event?eid=${stubEventId}`,
          hangoutLink: input.conferenceData ? `https://meet.google.com/${stubEventId}` : undefined,
        },
      };
    }),

  /**
   * Update Google Calendar event
   */
  updateGoogleEvent: orgAuditedProcedure
    .input(GoogleEventUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'google',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Calendar not connected',
        });
      }

      // TODO: Implement Google Calendar API call
      // 1. Refresh access token if expired
      // 2. Call Google Calendar API:
      //    PATCH https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
      //    - Body: partial event object with fields to update
      // 3. Return updated event

      // Stub response
      return {
        success: true,
        event: {
          id: input.eventId,
          summary: input.summary,
          description: input.description,
          start: input.startTime,
          end: input.endTime,
          location: input.location,
          attendees: input.attendees?.map(email => ({ email, responseStatus: 'needsAction' })),
        },
      };
    }),

  /**
   * Delete Google Calendar event
   */
  deleteGoogleEvent: orgAuditedProcedure
    .input(z.object({
      eventId: z.string().min(1),
      sendNotifications: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'google',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Google Calendar not connected',
        });
      }

      // TODO: Implement Google Calendar API call
      // 1. Refresh access token if expired
      // 2. Call Google Calendar API:
      //    DELETE https://www.googleapis.com/calendar/v3/calendars/primary/events/{eventId}
      //    - Query param: sendNotifications=true/false
      // 3. Return success

      return {
        success: true,
        deletedEventId: input.eventId,
      };
    }),

  // ============================================================================
  // CALENDLY INTEGRATION
  // ============================================================================

  /**
   * Store Calendly API key to connect account
   */
  connectCalendly: orgAuditedProcedure
    .input(z.object({
      apiKey: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Validate API key with Calendly API
      // GET https://api.calendly.com/users/me
      // Authorization: Bearer {apiKey}

      // Check if connection already exists
      const existing = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'calendly',
        },
      });

      if (existing) {
        // Update existing connection
        await ctx.db.calendarConnection.update({
          where: { id: existing.id },
          data: {
            accessToken: input.apiKey,
            updatedAt: new Date(),
          },
        });

        return { success: true, message: 'Calendly connection updated' };
      }

      // Create new connection
      await ctx.db.calendarConnection.create({
        data: {
          userId: ctx.user.id,
          provider: 'calendly',
          accessToken: input.apiKey,
        },
      });

      return { success: true, message: 'Calendly connected successfully' };
    }),

  /**
   * Remove Calendly connection
   */
  disconnectCalendly: orgAuditedProcedure
    .mutation(async ({ ctx }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'calendly',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No Calendly connection found',
        });
      }

      await ctx.db.calendarConnection.delete({
        where: { id: connection.id },
      });

      return { success: true, message: 'Calendly disconnected' };
    }),

  /**
   * Check Calendly connection status
   */
  getCalendlyStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'calendly',
        },
        select: {
          id: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!connection) {
        return {
          connected: false,
          connection: null,
        };
      }

      // TODO: Validate token is still valid with Calendly API
      // GET https://api.calendly.com/users/me

      return {
        connected: true,
        connection: {
          id: connection.id,
          connectedAt: connection.createdAt,
          updatedAt: connection.updatedAt,
        },
      };
    }),

  /**
   * Get user's Calendly scheduling links
   */
  getCalendlyLinks: protectedProcedure
    .query(async ({ ctx }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'calendly',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Calendly not connected',
        });
      }

      // TODO: Implement Calendly API call
      // 1. Get user URI: GET https://api.calendly.com/users/me
      // 2. Get event types: GET https://api.calendly.com/event_types?user={userUri}
      // 3. Return scheduling links

      // Stub response
      return {
        links: [] as Array<{
          uri: string;
          name: string;
          slug: string;
          schedulingUrl: string;
          duration: number; // minutes
          active: boolean;
          type: string; // 'StandardEventType' | 'AdhocEventType'
        }>,
        user: {
          uri: '',
          name: '',
          schedulingUrl: '',
        },
      };
    }),

  /**
   * Generate a booking link for a specific contact
   */
  createCalendlyLink: protectedProcedure
    .input(z.object({
      contactId: UuidSchema,
      eventTypeUri: z.string().min(1),
      redirectUrl: z.string().url().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const connection = await ctx.db.calendarConnection.findFirst({
        where: {
          userId: ctx.user.id,
          provider: 'calendly',
        },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Calendly not connected',
        });
      }

      // Get contact details
      const contact = await ctx.db.contact.findUnique({
        where: { id: input.contactId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      });

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      // TODO: Implement Calendly single-use scheduling link
      // POST https://api.calendly.com/scheduling_links
      // Body: {
      //   max_event_count: 1,
      //   owner: eventTypeUri,
      //   owner_type: 'EventType'
      // }
      // Or use URL params for pre-filling: ?name=...&email=...

      // Stub response - build pre-filled booking link
      const baseUrl = 'https://calendly.com'; // Would come from event type
      const params = new URLSearchParams();
      if (contact.firstName && contact.lastName) {
        params.set('name', `${contact.firstName} ${contact.lastName}`);
      }
      if (contact.email) {
        params.set('email', contact.email);
      }

      return {
        bookingUrl: `${baseUrl}?${params.toString()}`,
        contactId: contact.id,
        contactName: `${contact.firstName} ${contact.lastName}`,
        contactEmail: contact.email,
      };
    }),

  // ============================================================================
  // INTERNAL MEETINGS - FULL CRUD
  // ============================================================================

  /**
   * List meetings with filters
   */
  list: protectedProcedure
    .input(MeetingFilterSchema)
    .query(async ({ ctx, input }) => {
      const { dateRange, contactId, search, page, pageSize, sortBy, sortOrder } = input;

      const where: Prisma.MeetingWhereInput = {};

      // Filter by date range
      if (dateRange?.from || dateRange?.to) {
        where.startTime = {};
        if (dateRange.from) {
          where.startTime.gte = dateRange.from;
        }
        if (dateRange.to) {
          where.startTime.lte = dateRange.to;
        }
      }

      // Filter by contact (through attendees)
      if (contactId) {
        where.attendees = {
          some: { contactId },
        };
      }

      // Search by title or description
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [items, total] = await Promise.all([
        ctx.db.meeting.findMany({
          where,
          include: {
            createdBy: {
              select: { id: true, name: true, image: true },
            },
            attendees: {
              include: {
                contact: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
                user: {
                  select: { id: true, name: true, email: true, image: true },
                },
              },
            },
            _count: {
              select: { attendees: true },
            },
          },
          orderBy: sortBy
            ? { [sortBy]: sortOrder }
            : { startTime: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.meeting.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    }),

  /**
   * Get meeting details with attendees
   */
  getById: protectedProcedure
    .input(z.object({ id: UuidSchema }))
    .query(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true, image: true },
          },
          attendees: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true,
                  company: true,
                  title: true,
                  avatarUrl: true,
                },
              },
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      return meeting;
    }),

  /**
   * Create a new meeting (optionally sync to Google Calendar)
   */
  create: orgAuditedProcedure
    .input(MeetingCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const { attendees, syncToGoogle, ...meetingData } = input;

      // Create the meeting
      const meeting = await ctx.db.meeting.create({
        data: {
          ...meetingData,
          createdById: ctx.user.id,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
        },
      });

      // Add attendees if provided
      if (attendees && attendees.length > 0) {
        const attendeeData = attendees
          .filter(a => a.contactId || a.userId || a.email)
          .map(a => ({
            meetingId: meeting.id,
            contactId: a.contactId,
            userId: a.userId,
            email: a.email,
            status: 'pending',
          }));

        if (attendeeData.length > 0) {
          await ctx.db.meetingAttendee.createMany({
            data: attendeeData,
          });
        }
      }

      // Optionally sync to Google Calendar
      if (syncToGoogle) {
        const connection = await ctx.db.calendarConnection.findFirst({
          where: {
            userId: ctx.user.id,
            provider: 'google',
          },
        });

        if (connection) {
          // TODO: Create event in Google Calendar
          // 1. Call Google Calendar API to create event
          // 2. Update meeting with calendarId (Google event ID)
          // Stub: update with placeholder calendarId
          // await ctx.db.meeting.update({
          //   where: { id: meeting.id },
          //   data: { calendarId: `google_${Date.now()}` },
          // });
        }
      }

      // Fetch the complete meeting with attendees
      const completeMeeting = await ctx.db.meeting.findUnique({
        where: { id: meeting.id },
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
          attendees: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      return completeMeeting;
    }),

  /**
   * Update meeting
   */
  update: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      data: MeetingUpdateSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.meeting.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // Validate time constraint if both times are being updated
      const startTime = input.data.startTime;
      const endTime = input.data.endTime;
      if (startTime && endTime) {
        if (startTime >= endTime) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Start time must be before end time',
          });
        }
      }

      const meeting = await ctx.db.meeting.update({
        where: { id: input.id },
        data: input.data,
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
          attendees: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              user: {
                select: { id: true, name: true, email: true, image: true },
              },
            },
          },
        },
      });

      // TODO: If meeting has calendarId, sync changes to Google Calendar

      return meeting;
    }),

  /**
   * Delete meeting
   */
  delete: orgAuditedProcedure
    .input(z.object({
      id: UuidSchema,
      deleteFromGoogle: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: input.id },
        select: { id: true, calendarId: true, calendlyId: true },
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // TODO: If deleteFromGoogle and calendarId exists, delete from Google Calendar
      if (input.deleteFromGoogle && meeting.calendarId) {
        // Delete from Google Calendar
      }

      // Delete attendees first (cascade should handle this, but being explicit)
      await ctx.db.meetingAttendee.deleteMany({
        where: { meetingId: input.id },
      });

      // Delete the meeting
      await ctx.db.meeting.delete({
        where: { id: input.id },
      });

      return { success: true, deletedId: input.id };
    }),

  /**
   * Add attendee to meeting
   */
  addAttendee: orgAuditedProcedure
    .input(z.object({
      meetingId: UuidSchema,
      contactId: UuidSchema.optional(),
      userId: UuidSchema.optional(),
      email: z.string().email().optional(),
      status: AttendeeStatusSchema.default('pending'),
    }).refine(
      (data) => data.contactId || data.userId || data.email,
      { message: 'Must provide contactId, userId, or email' }
    ))
    .mutation(async ({ ctx, input }) => {
      const { meetingId, contactId, userId, email, status } = input;

      // Verify meeting exists
      const meeting = await ctx.db.meeting.findUnique({
        where: { id: meetingId },
      });

      if (!meeting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Meeting not found',
        });
      }

      // Verify contact exists if provided
      if (contactId) {
        const contact = await ctx.db.contact.findUnique({
          where: { id: contactId },
        });
        if (!contact) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Contact not found',
          });
        }
      }

      // Verify user exists if provided
      if (userId) {
        const user = await ctx.db.user.findUnique({
          where: { id: userId },
        });
        if (!user) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'User not found',
          });
        }
      }

      // Check for duplicate attendee
      const existingAttendee = await ctx.db.meetingAttendee.findFirst({
        where: {
          meetingId,
          OR: [
            contactId ? { contactId } : {},
            userId ? { userId } : {},
            email ? { email } : {},
          ].filter(obj => Object.keys(obj).length > 0),
        },
      });

      if (existingAttendee) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Attendee already added to this meeting',
        });
      }

      const attendee = await ctx.db.meetingAttendee.create({
        data: {
          meetingId,
          contactId,
          userId,
          email,
          status,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      // TODO: If meeting has calendarId, add attendee to Google Calendar event

      return attendee;
    }),

  /**
   * Remove attendee from meeting
   */
  removeAttendee: orgAuditedProcedure
    .input(z.object({
      meetingId: UuidSchema,
      attendeeId: UuidSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const attendee = await ctx.db.meetingAttendee.findFirst({
        where: {
          id: input.attendeeId,
          meetingId: input.meetingId,
        },
      });

      if (!attendee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attendee not found in this meeting',
        });
      }

      await ctx.db.meetingAttendee.delete({
        where: { id: input.attendeeId },
      });

      // TODO: If meeting has calendarId, remove attendee from Google Calendar event

      return { success: true, removedAttendeeId: input.attendeeId };
    }),

  /**
   * Update attendee status (accept/decline/tentative)
   */
  updateAttendeeStatus: protectedProcedure
    .input(z.object({
      meetingId: UuidSchema,
      attendeeId: UuidSchema,
      status: AttendeeStatusSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const attendee = await ctx.db.meetingAttendee.findFirst({
        where: {
          id: input.attendeeId,
          meetingId: input.meetingId,
        },
      });

      if (!attendee) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Attendee not found in this meeting',
        });
      }

      const updated = await ctx.db.meetingAttendee.update({
        where: { id: input.attendeeId },
        data: { status: input.status },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      return updated;
    }),

  // ============================================================================
  // UPCOMING & RECENT MEETINGS HELPERS
  // ============================================================================

  /**
   * Get upcoming meetings for current user
   */
  getUpcoming: protectedProcedure
    .input(z.object({
      limit: z.number().int().min(1).max(50).default(10),
      includeAllMeetings: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const now = new Date();

      const where: Prisma.MeetingWhereInput = {
        startTime: { gte: now },
      };

      // If not includeAllMeetings, only show meetings where user is creator or attendee
      if (!input.includeAllMeetings) {
        where.OR = [
          { createdById: ctx.user.id },
          { attendees: { some: { userId: ctx.user.id } } },
        ];
      }

      const meetings = await ctx.db.meeting.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, image: true },
          },
          attendees: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatarUrl: true,
                },
              },
              user: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          _count: {
            select: { attendees: true },
          },
        },
        orderBy: { startTime: 'asc' },
        take: input.limit,
      });

      return meetings;
    }),

  /**
   * Get meetings for a specific contact
   */
  getByContact: protectedProcedure
    .input(z.object({
      contactId: UuidSchema,
      includePast: z.boolean().default(true),
      limit: z.number().int().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where: Prisma.MeetingWhereInput = {
        attendees: {
          some: { contactId: input.contactId },
        },
      };

      if (!input.includePast) {
        where.startTime = { gte: new Date() };
      }

      const meetings = await ctx.db.meeting.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          attendees: {
            include: {
              contact: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          _count: {
            select: { attendees: true },
          },
        },
        orderBy: { startTime: 'desc' },
        take: input.limit,
      });

      return meetings;
    }),
});
