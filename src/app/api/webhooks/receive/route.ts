/**
 * SPAC OS - Incoming Webhook Receiver
 * Handles incoming webhooks from external services (e.g., SEC EDGAR, payment processors)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

// Webhook payload schemas for different sources
const SecEdgarWebhookSchema = z.object({
  source: z.literal('sec_edgar'),
  event: z.enum(['filing_accepted', 'filing_effective', 'comment_received']),
  filingId: z.string(),
  accessionNumber: z.string().optional(),
  timestamp: z.string(),
  data: z.record(z.any()).optional(),
});

const PaymentWebhookSchema = z.object({
  source: z.literal('payment'),
  event: z.enum(['payment_completed', 'payment_failed', 'refund_processed']),
  transactionId: z.string(),
  amount: z.number(),
  currency: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()).optional(),
});

const GenericWebhookSchema = z.object({
  source: z.string(),
  event: z.string(),
  timestamp: z.string(),
  data: z.record(z.any()).optional(),
});

const IncomingWebhookSchema = z.union([
  SecEdgarWebhookSchema,
  PaymentWebhookSchema,
  GenericWebhookSchema,
]);

/**
 * POST /api/webhooks/receive - Receive incoming webhooks
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Get webhook signature for verification
    const signature = request.headers.get('x-webhook-signature');
    const source = request.headers.get('x-webhook-source') || 'unknown';

    // Read raw body for signature verification
    const rawBody = await request.text();
    let payload: z.infer<typeof IncomingWebhookSchema>;

    try {
      payload = IncomingWebhookSchema.parse(JSON.parse(rawBody));
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    // Verify signature if provided and configured
    const webhookSecret = getWebhookSecret(payload.source);
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (!crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )) {
        logger.warn(`Invalid webhook signature from ${payload.source}`);
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Log incoming webhook
    const webhookLog = await prisma.incomingWebhookLog.create({
      data: {
        source: payload.source,
        event: payload.event,
        payload: payload as any,
        signature: signature || undefined,
        ipAddress: request.headers.get('x-forwarded-for') || request.ip || 'unknown',
        receivedAt: new Date(),
      },
    });

    // Process webhook based on source and event
    let processingResult: any = null;
    let processingError: string | null = null;

    try {
      processingResult = await processWebhook(payload);
    } catch (error) {
      processingError = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Webhook processing error: ${processingError}`);
    }

    // Update webhook log with processing result
    const processingTime = Date.now() - startTime;
    await prisma.incomingWebhookLog.update({
      where: { id: webhookLog.id },
      data: {
        processedAt: new Date(),
        processingTimeMs: processingTime,
        success: !processingError,
        error: processingError,
        result: processingResult,
      },
    });

    if (processingError) {
      return NextResponse.json(
        {
          received: true,
          processed: false,
          error: processingError,
          webhookLogId: webhookLog.id,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      processed: true,
      webhookLogId: webhookLog.id,
      result: processingResult,
    });
  } catch (error) {
    logger.error('Webhook receive error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process webhook based on source and event type
 */
async function processWebhook(
  payload: z.infer<typeof IncomingWebhookSchema>
): Promise<any> {
  switch (payload.source) {
    case 'sec_edgar':
      return processSecEdgarWebhook(payload as z.infer<typeof SecEdgarWebhookSchema>);
    case 'payment':
      return processPaymentWebhook(payload as z.infer<typeof PaymentWebhookSchema>);
    default:
      logger.info(`Unhandled webhook source: ${payload.source}`);
      return { acknowledged: true };
  }
}

/**
 * Process SEC EDGAR webhooks
 */
async function processSecEdgarWebhook(
  payload: z.infer<typeof SecEdgarWebhookSchema>
): Promise<any> {
  const { event, filingId, accessionNumber, data } = payload;

  // Find the filing by external ID or accession number
  const filing = await prisma.filing.findFirst({
    where: {
      OR: [
        { id: filingId },
        { accessionNumber: accessionNumber },
      ],
    },
    include: {
      spac: { select: { id: true, organizationId: true } },
    },
  });

  if (!filing) {
    return { warning: 'Filing not found', filingId, accessionNumber };
  }

  switch (event) {
    case 'filing_accepted':
      await prisma.filing.update({
        where: { id: filing.id },
        data: {
          status: 'FILED',
          accessionNumber: accessionNumber || filing.accessionNumber,
          filedDate: new Date(),
        },
      });
      break;

    case 'filing_effective':
      await prisma.filing.update({
        where: { id: filing.id },
        data: {
          status: 'EFFECTIVE',
          effectiveDate: new Date(),
        },
      });
      break;

    case 'comment_received':
      if (data?.comment) {
        await prisma.secComment.create({
          data: {
            filingId: filing.id,
            spacId: filing.spacId,
            commentNumber: data.commentNumber || 1,
            commentText: data.comment,
            receivedDate: new Date(),
            status: 'PENDING',
          },
        });
      }
      break;
  }

  // Create notification for relevant users
  const orgUsers = await prisma.organizationUser.findMany({
    where: { organizationId: filing.spac.organizationId },
    select: { userId: true },
  });

  await prisma.notification.createMany({
    data: orgUsers.map((ou) => ({
      userId: ou.userId,
      type: 'SEC_UPDATE' as const,
      title: `SEC ${event.replace('_', ' ').toUpperCase()}`,
      message: `Filing ${filing.title || filing.type} has been ${event.replace('_', ' ')}`,
      entityType: 'Filing',
      entityId: filing.id,
      priority: event === 'comment_received' ? 'HIGH' : 'MEDIUM' as const,
    })),
  });

  return { processed: true, filingId: filing.id, event };
}

/**
 * Process payment webhooks
 */
async function processPaymentWebhook(
  payload: z.infer<typeof PaymentWebhookSchema>
): Promise<any> {
  const { event, transactionId, amount, currency } = payload;

  // Find the transaction
  const transaction = await prisma.transaction.findFirst({
    where: { externalId: transactionId },
    include: {
      spac: { select: { id: true, organizationId: true } },
    },
  });

  if (!transaction) {
    return { warning: 'Transaction not found', transactionId };
  }

  switch (event) {
    case 'payment_completed':
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update trust account balance if applicable
      if (transaction.trustAccountId) {
        await prisma.trustAccount.update({
          where: { id: transaction.trustAccountId },
          data: {
            currentBalance: { increment: amount },
            balanceDate: new Date(),
          },
        });
      }
      break;

    case 'payment_failed':
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: payload.data?.reason || 'Unknown',
        },
      });
      break;

    case 'refund_processed':
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'REFUNDED',
          refundedAt: new Date(),
          refundAmount: amount,
        },
      });
      break;
  }

  return { processed: true, transactionId: transaction.id, event };
}

/**
 * Get webhook secret for a specific source
 */
function getWebhookSecret(source: string): string | null {
  const secrets: Record<string, string | undefined> = {
    sec_edgar: process.env.SEC_WEBHOOK_SECRET,
    payment: process.env.PAYMENT_WEBHOOK_SECRET,
  };

  return secrets[source] || process.env.DEFAULT_WEBHOOK_SECRET || null;
}

// Route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
