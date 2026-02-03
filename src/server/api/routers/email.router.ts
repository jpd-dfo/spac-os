/**
 * SPAC OS - Email Router
 * Gmail OAuth and email operations for CRM integration
 * Sprint 8 Track C - Gmail Integration
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { UuidSchema, PaginationSchema, DateRangeSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
  orgAuditedProcedure,
} from '../trpc';

// ============================================================================
// ENUMS - Match Prisma schema
// ============================================================================

const EmailDirectionSchema = z.enum(['INBOUND', 'OUTBOUND']);

// ============================================================================
// INPUT SCHEMAS
// ============================================================================

/**
 * Schema for email list filtering
 */
const EmailFilterSchema = z.object({
  contactId: UuidSchema.optional(),
  isRead: z.boolean().optional(),
  isStarred: z.boolean().optional(),
  direction: EmailDirectionSchema.optional(),
  labels: z.array(z.string()).optional(),
  search: z.string().optional(),
  dateRange: DateRangeSchema.optional(),
  ...PaginationSchema.shape,
});

/**
 * Schema for sending a new email
 */
const SendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1, 'At least one recipient required'),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1, 'Subject is required').max(998), // RFC 5322 limit
  body: z.string().min(1, 'Body is required'),
  // Optional: associate with a contact
  contactId: UuidSchema.optional(),
});

/**
 * Schema for replying to a thread
 */
const ReplyEmailSchema = z.object({
  threadId: z.string().min(1, 'Thread ID is required'),
  body: z.string().min(1, 'Body is required'),
  // Optional: reply to all recipients
  replyAll: z.boolean().default(false),
});

// ============================================================================
// EMAIL ROUTER
// ============================================================================

export const emailRouter = createTRPCRouter({
  // ============================================================================
  // OAUTH & CONNECTION
  // ============================================================================

  /**
   * Get OAuth URL to initiate Gmail connection
   * Returns the Google OAuth URL for the user to authorize
   */
  connect: protectedProcedure
    .mutation(async ({ ctx }) => {
      // TODO: Implement actual Google OAuth URL generation
      // This will use the gmailService when created

      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Check if already connected
      const existingConnection = await ctx.db.emailConnection.findUnique({
        where: { userId },
      });

      if (existingConnection) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Gmail is already connected. Disconnect first to reconnect.',
        });
      }

      // TODO: Generate actual OAuth URL using Google OAuth client
      // For now, return a placeholder URL structure
      const redirectUri = process.env['GMAIL_REDIRECT_URI'] ?? 'http://localhost:3000/api/auth/gmail/callback';
      const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=YOUR_CLIENT_ID&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify')}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${userId}`;

      return {
        oauthUrl,
        message: 'Redirect user to this URL to authorize Gmail access',
      };
    }),

  /**
   * Handle OAuth callback and store tokens
   * Called after user authorizes via Google OAuth
   */
  handleCallback: protectedProcedure
    .input(z.object({
      code: z.string().min(1, 'Authorization code is required'),
      state: z.string().optional(), // Contains userId for verification
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Verify state matches user (CSRF protection)
      if (input.state && input.state !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid state parameter',
        });
      }

      // TODO: Exchange authorization code for tokens using Google OAuth client
      // const tokens = await gmailService.exchangeCodeForTokens(input.code);

      // Placeholder for token exchange result
      const tokens = {
        accessToken: 'placeholder_access_token',
        refreshToken: 'placeholder_refresh_token',
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour from now
      };

      // Store the connection
      const connection = await ctx.db.emailConnection.upsert({
        where: { userId },
        create: {
          userId,
          provider: 'gmail',
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
        update: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt,
        },
      });

      return {
        success: true,
        connectionId: connection.id,
        message: 'Gmail connected successfully',
      };
    }),

  /**
   * Disconnect Gmail - revoke access and delete EmailConnection
   */
  disconnect: orgAuditedProcedure
    .mutation(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const connection = await ctx.db.emailConnection.findUnique({
        where: { userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No Gmail connection found',
        });
      }

      // TODO: Revoke access token with Google API
      // await gmailService.revokeToken(connection.accessToken);

      // Delete the connection record
      await ctx.db.emailConnection.delete({
        where: { userId },
      });

      return {
        success: true,
        message: 'Gmail disconnected successfully',
      };
    }),

  /**
   * Check if Gmail is connected (has valid token)
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        return {
          isConnected: false,
          provider: null,
          expiresAt: null,
          needsReauth: false,
        };
      }

      const connection = await ctx.db.emailConnection.findUnique({
        where: { userId },
        select: {
          id: true,
          provider: true,
          expiresAt: true,
          historyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!connection) {
        return {
          isConnected: false,
          provider: null,
          expiresAt: null,
          needsReauth: false,
        };
      }

      // Check if token is expired or expiring soon (within 5 minutes)
      const needsReauth = connection.expiresAt
        ? connection.expiresAt < new Date(Date.now() + 5 * 60 * 1000)
        : false;

      return {
        isConnected: true,
        provider: connection.provider,
        expiresAt: connection.expiresAt,
        needsReauth,
        lastSyncHistoryId: connection.historyId,
        connectedAt: connection.createdAt,
      };
    }),

  // ============================================================================
  // SYNC
  // ============================================================================

  /**
   * Trigger inbox sync (uses gmailService)
   * Fetches new emails from Gmail and stores them locally
   */
  sync: orgAuditedProcedure
    .input(z.object({
      fullSync: z.boolean().default(false), // If true, sync all emails; otherwise incremental
      maxResults: z.number().int().min(1).max(500).default(100),
    }).optional())
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const connection = await ctx.db.emailConnection.findUnique({
        where: { userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Gmail is not connected. Please connect Gmail first.',
        });
      }

      // TODO: Implement actual Gmail sync using gmailService
      // const syncResult = await gmailService.syncInbox({
      //   accessToken: connection.accessToken,
      //   refreshToken: connection.refreshToken,
      //   historyId: input?.fullSync ? null : connection.historyId,
      //   maxResults: input?.maxResults ?? 100,
      // });

      // Placeholder response
      const syncResult = {
        newEmails: 0,
        updatedEmails: 0,
        deletedEmails: 0,
        newHistoryId: connection.historyId,
      };

      // Update the historyId for incremental sync
      if (syncResult.newHistoryId) {
        await ctx.db.emailConnection.update({
          where: { userId },
          data: { historyId: syncResult.newHistoryId },
        });
      }

      return {
        success: true,
        ...syncResult,
        message: `Sync completed: ${syncResult.newEmails} new, ${syncResult.updatedEmails} updated`,
      };
    }),

  // ============================================================================
  // EMAIL OPERATIONS - QUERIES
  // ============================================================================

  /**
   * List emails with filters
   */
  list: protectedProcedure
    .input(EmailFilterSchema)
    .query(async ({ ctx, input }) => {
      const {
        contactId,
        isRead,
        isStarred,
        direction,
        labels,
        search,
        dateRange,
        page,
        pageSize,
        sortBy,
        sortOrder,
      } = input;

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (contactId) {
        where.contactId = contactId;
      }

      if (isRead !== undefined) {
        where.isRead = isRead;
      }

      if (isStarred !== undefined) {
        where.isStarred = isStarred;
      }

      if (direction) {
        where.direction = direction;
      }

      if (labels?.length) {
        where.labels = { hasSome: labels };
      }

      if (search) {
        where.OR = [
          { subject: { contains: search, mode: 'insensitive' } },
          { snippet: { contains: search, mode: 'insensitive' } },
          { fromEmail: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (dateRange?.from || dateRange?.to) {
        where.date = {
          ...(dateRange.from && { gte: dateRange.from }),
          ...(dateRange.to && { lte: dateRange.to }),
        };
      }

      const [items, total] = await Promise.all([
        ctx.db.email.findMany({
          where,
          include: {
            contact: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true,
                company: true,
              },
            },
          },
          orderBy: sortBy
            ? { [sortBy]: sortOrder }
            : { date: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        ctx.db.email.count({ where }),
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
   * Get full email thread by threadId
   */
  getThread: protectedProcedure
    .input(z.object({
      threadId: z.string().min(1, 'Thread ID is required'),
    }))
    .query(async ({ ctx, input }) => {
      const emails = await ctx.db.email.findMany({
        where: { threadId: input.threadId },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              company: true,
              title: true,
            },
          },
        },
        orderBy: { date: 'asc' }, // Chronological order for thread view
      });

      if (emails.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Thread not found',
        });
      }

      // Get thread metadata
      const threadSubject = emails[0]?.subject ?? 'No Subject';
      const participants = [...new Set([
        ...emails.map(e => e.fromEmail),
        ...emails.flatMap(e => e.toEmails),
      ])];

      return {
        threadId: input.threadId,
        subject: threadSubject,
        participants,
        messageCount: emails.length,
        emails,
        firstMessage: emails[0],
        lastMessage: emails[emails.length - 1],
      };
    }),

  /**
   * Get single email by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const email = await ctx.db.email.findUnique({
        where: { id: input.id },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              company: true,
              title: true,
              phone: true,
            },
          },
        },
      });

      if (!email) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        });
      }

      return email;
    }),

  // ============================================================================
  // EMAIL OPERATIONS - MUTATIONS
  // ============================================================================

  /**
   * Send a new email
   */
  send: orgAuditedProcedure
    .input(SendEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Verify Gmail is connected
      const connection = await ctx.db.emailConnection.findUnique({
        where: { userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Gmail is not connected. Please connect Gmail first.',
        });
      }

      // TODO: Send email via Gmail API
      // const sentMessage = await gmailService.sendEmail({
      //   accessToken: connection.accessToken,
      //   to: input.to,
      //   cc: input.cc,
      //   bcc: input.bcc,
      //   subject: input.subject,
      //   body: input.body,
      // });

      // Placeholder for sent message
      const gmailId = `sent_${Date.now()}`;
      const threadId = `thread_${Date.now()}`;

      // Get user's email for fromEmail (would come from Gmail profile)
      const fromEmail = ctx.user?.email ?? 'user@example.com';

      // Create local email record
      const email = await ctx.db.email.create({
        data: {
          gmailId,
          threadId,
          subject: input.subject,
          body: input.body,
          snippet: input.body.substring(0, 200),
          direction: 'OUTBOUND',
          fromEmail,
          toEmails: input.to,
          ccEmails: input.cc ?? [],
          date: new Date(),
          isRead: true, // Sent emails are "read"
          isStarred: false,
          labels: ['SENT'],
          contactId: input.contactId,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // If contactId provided, create an interaction record
      if (input.contactId) {
        await ctx.db.interaction.create({
          data: {
            contactId: input.contactId,
            type: 'EMAIL',
            subject: input.subject,
            description: `Sent email: ${input.subject}`,
            date: new Date(),
            createdById: userId,
          },
        });

        // Update contact's lastInteractionAt
        await ctx.db.contact.update({
          where: { id: input.contactId },
          data: { lastInteractionAt: new Date() },
        });
      }

      return {
        success: true,
        email,
        message: 'Email sent successfully',
      };
    }),

  /**
   * Reply to an email thread
   */
  reply: orgAuditedProcedure
    .input(ReplyEmailSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // Verify Gmail is connected
      const connection = await ctx.db.emailConnection.findUnique({
        where: { userId },
      });

      if (!connection) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Gmail is not connected. Please connect Gmail first.',
        });
      }

      // Get the original thread to determine reply recipients
      const originalEmails = await ctx.db.email.findMany({
        where: { threadId: input.threadId },
        orderBy: { date: 'desc' },
        take: 1,
      });

      if (originalEmails.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Thread not found',
        });
      }

      const lastEmail = originalEmails[0];
      if (!lastEmail) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No emails in thread',
        });
      }

      // Determine recipients based on replyAll flag
      const fromEmail = ctx.user?.email ?? 'user@example.com';
      let toEmails: string[];
      let ccEmails: string[] = [];

      if (input.replyAll) {
        // Reply all: include original sender and all recipients except self
        toEmails = [lastEmail.fromEmail, ...lastEmail.toEmails].filter(
          email => email !== fromEmail
        );
        ccEmails = lastEmail.ccEmails.filter(email => email !== fromEmail);
      } else {
        // Simple reply: just to the sender
        toEmails = [lastEmail.fromEmail];
      }

      // TODO: Send reply via Gmail API
      // const sentMessage = await gmailService.replyToThread({
      //   accessToken: connection.accessToken,
      //   threadId: input.threadId,
      //   to: toEmails,
      //   cc: ccEmails,
      //   body: input.body,
      //   inReplyTo: lastEmail.gmailId,
      // });

      // Placeholder for sent reply
      const gmailId = `reply_${Date.now()}`;

      // Create local email record for the reply
      const email = await ctx.db.email.create({
        data: {
          gmailId,
          threadId: input.threadId,
          subject: lastEmail.subject?.startsWith('Re:')
            ? lastEmail.subject
            : `Re: ${lastEmail.subject ?? 'No Subject'}`,
          body: input.body,
          snippet: input.body.substring(0, 200),
          direction: 'OUTBOUND',
          fromEmail,
          toEmails,
          ccEmails,
          date: new Date(),
          isRead: true,
          isStarred: false,
          labels: ['SENT'],
          contactId: lastEmail.contactId,
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create interaction record if associated with a contact
      if (lastEmail.contactId) {
        await ctx.db.interaction.create({
          data: {
            contactId: lastEmail.contactId,
            type: 'EMAIL',
            subject: email.subject ?? 'Email Reply',
            description: `Replied to email thread: ${email.subject}`,
            date: new Date(),
            createdById: userId,
          },
        });

        // Update contact's lastInteractionAt
        await ctx.db.contact.update({
          where: { id: lastEmail.contactId },
          data: { lastInteractionAt: new Date() },
        });
      }

      return {
        success: true,
        email,
        message: 'Reply sent successfully',
      };
    }),

  /**
   * Mark email as read/unread
   */
  markRead: orgAuditedProcedure
    .input(z.object({
      id: z.string().min(1),
      isRead: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const existing = await ctx.db.email.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        });
      }

      // TODO: Update read status in Gmail via API
      // await gmailService.modifyLabels({
      //   accessToken: connection.accessToken,
      //   messageId: existing.gmailId,
      //   addLabels: input.isRead ? [] : ['UNREAD'],
      //   removeLabels: input.isRead ? ['UNREAD'] : [],
      // });

      const email = await ctx.db.email.update({
        where: { id: input.id },
        data: { isRead: input.isRead },
        select: {
          id: true,
          gmailId: true,
          subject: true,
          isRead: true,
        },
      });

      return {
        success: true,
        email,
      };
    }),

  /**
   * Bulk mark emails as read/unread
   */
  bulkMarkRead: orgAuditedProcedure
    .input(z.object({
      ids: z.array(z.string()).min(1).max(100),
      isRead: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      // TODO: Batch update in Gmail API
      // await gmailService.batchModifyLabels(...)

      const result = await ctx.db.email.updateMany({
        where: { id: { in: input.ids } },
        data: { isRead: input.isRead },
      });

      return {
        success: true,
        updatedCount: result.count,
      };
    }),

  /**
   * Toggle star on email
   */
  toggleStar: orgAuditedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        });
      }

      const existing = await ctx.db.email.findUnique({
        where: { id: input.id },
        select: { id: true, gmailId: true, isStarred: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        });
      }

      const newStarredState = !existing.isStarred;

      // TODO: Update star status in Gmail via API
      // await gmailService.modifyLabels({
      //   accessToken: connection.accessToken,
      //   messageId: existing.gmailId,
      //   addLabels: newStarredState ? ['STARRED'] : [],
      //   removeLabels: newStarredState ? [] : ['STARRED'],
      // });

      const email = await ctx.db.email.update({
        where: { id: input.id },
        data: { isStarred: newStarredState },
        select: {
          id: true,
          gmailId: true,
          subject: true,
          isStarred: true,
        },
      });

      return {
        success: true,
        email,
      };
    }),

  // ============================================================================
  // CONTACT ASSOCIATION
  // ============================================================================

  /**
   * Associate an email with a contact
   */
  linkToContact: orgAuditedProcedure
    .input(z.object({
      emailId: z.string().min(1),
      contactId: UuidSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const [email, contact] = await Promise.all([
        ctx.db.email.findUnique({ where: { id: input.emailId } }),
        ctx.db.contact.findUnique({ where: { id: input.contactId } }),
      ]);

      if (!email) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        });
      }

      if (!contact) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact not found',
        });
      }

      const updatedEmail = await ctx.db.email.update({
        where: { id: input.emailId },
        data: { contactId: input.contactId },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return {
        success: true,
        email: updatedEmail,
      };
    }),

  /**
   * Remove contact association from email
   */
  unlinkFromContact: orgAuditedProcedure
    .input(z.object({
      emailId: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const email = await ctx.db.email.findUnique({
        where: { id: input.emailId },
      });

      if (!email) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Email not found',
        });
      }

      const updatedEmail = await ctx.db.email.update({
        where: { id: input.emailId },
        data: { contactId: null },
      });

      return {
        success: true,
        email: updatedEmail,
      };
    }),

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get email statistics for dashboard
   */
  getStatistics: protectedProcedure
    .input(z.object({
      contactId: UuidSchema.optional(),
      dateRange: DateRangeSchema.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (input?.contactId) {
        where.contactId = input.contactId;
      }

      if (input?.dateRange?.from || input?.dateRange?.to) {
        where.date = {
          ...(input.dateRange.from && { gte: input.dateRange.from }),
          ...(input.dateRange.to && { lte: input.dateRange.to }),
        };
      }

      const [
        total,
        unread,
        starred,
        inbound,
        outbound,
        byLabel,
      ] = await Promise.all([
        ctx.db.email.count({ where }),
        ctx.db.email.count({ where: { ...where, isRead: false } }),
        ctx.db.email.count({ where: { ...where, isStarred: true } }),
        ctx.db.email.count({ where: { ...where, direction: 'INBOUND' } }),
        ctx.db.email.count({ where: { ...where, direction: 'OUTBOUND' } }),
        ctx.db.email.groupBy({
          by: ['direction'],
          where,
          _count: true,
        }),
      ]);

      return {
        total,
        unread,
        starred,
        inbound,
        outbound,
        byDirection: Object.fromEntries(byLabel.map(l => [l.direction, l._count])),
      };
    }),
});
