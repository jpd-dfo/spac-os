/**
 * SPAC OS - Incoming Webhook Receiver
 * Handles incoming webhooks from external services (e.g., SEC EDGAR, payment processors)
 */

import { type NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

import { z } from 'zod';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

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

    // Log incoming webhook to audit log (since IncomingWebhookLog model doesn't exist)
    logger.info(`Webhook received from ${payload.source}: ${payload.event}`, {
      source: payload.source,
      event: payload.event,
      timestamp: payload.timestamp,
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

    const processingTime = Date.now() - startTime;
    logger.info(`Webhook processed in ${processingTime}ms`, {
      success: !processingError,
      source: payload.source,
      event: payload.event,
    });

    if (processingError) {
      return NextResponse.json(
        {
          received: true,
          processed: false,
          error: processingError,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      processed: true,
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
      if (data?.['comment']) {
        await prisma.secComment.create({
          data: {
            filingId: filing.id,
            spacId: filing.spacId,
            commentNumber: data['commentNumber'] || 1,
            commentText: data['comment'],
            receivedDate: new Date(),
          },
        });
      }
      break;
  }

  // Create audit log for the SEC event
  if (filing.spac?.organizationId) {
    await prisma.auditLog.create({
      data: {
        action: 'SEC_WEBHOOK',
        entityType: 'Filing',
        entityId: filing.id,
        organizationId: filing.spac.organizationId,
        metadata: {
          event,
          accessionNumber,
          timestamp: payload.timestamp,
        },
      },
    });
  }

  return { processed: true, filingId: filing.id, event };
}

/**
 * Process payment webhooks
 * Note: The Transaction model in Prisma doesn't have payment-related fields,
 * so this is a stub implementation that logs the webhook
 */
async function processPaymentWebhook(
  payload: z.infer<typeof PaymentWebhookSchema>
): Promise<any> {
  const { event, transactionId, amount, currency } = payload;

  // Log the payment webhook since the Transaction model doesn't support payment fields
  logger.info(`Payment webhook received: ${event}`, {
    transactionId,
    amount,
    currency,
  });

  // This would need a proper Payment model in Prisma to be fully implemented
  // For now, just acknowledge receipt
  return {
    acknowledged: true,
    transactionId,
    event,
    note: 'Payment webhooks logged but not fully processed (requires Payment model)'
  };
}

/**
 * Get webhook secret for a specific source
 */
function getWebhookSecret(source: string): string | null {
  const secrets: Record<string, string | undefined> = {
    sec_edgar: process.env['SEC_WEBHOOK_SECRET'],
    payment: process.env['PAYMENT_WEBHOOK_SECRET'],
  };

  return secrets[source] || process.env['DEFAULT_WEBHOOK_SECRET'] || null;
}

// Route segment config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
