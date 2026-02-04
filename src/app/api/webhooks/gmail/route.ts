/**
 * Gmail Push Notification Webhook Handler
 * Handles real-time email sync notifications from Gmail
 */

import { type NextRequest, NextResponse } from 'next/server';

import { db } from '@/server/db';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Gmail push notification format:
    // { message: { data: base64string, messageId: string }, subscription: string }
    const messageData = body.message?.data;
    if (!messageData) {
      logger.warn('Gmail webhook: No message data received');
      return NextResponse.json({ error: 'No message data' }, { status: 400 });
    }

    // Decode the base64 data
    let decoded: { emailAddress: string; historyId: string };
    try {
      decoded = JSON.parse(Buffer.from(messageData, 'base64').toString());
    } catch {
      logger.error('Gmail webhook: Failed to decode message data');
      return NextResponse.json({ error: 'Invalid message data' }, { status: 400 });
    }

    logger.info(`Gmail webhook: Notification for ${decoded.emailAddress}, historyId: ${decoded.historyId}`);

    // Find user by email address
    const user = await db.user.findUnique({
      where: { email: decoded.emailAddress },
      include: { emailConnection: true },
    });

    if (!user || !user.emailConnection) {
      // Unknown user or not connected, acknowledge but don't process
      logger.info(`Gmail webhook: No email connection found for ${decoded.emailAddress}`);
      return NextResponse.json({ received: true });
    }

    // Update the historyId for incremental sync
    await db.emailConnection.update({
      where: { id: user.emailConnection.id },
      data: { historyId: decoded.historyId },
    });

    // In production, trigger a background job to sync emails
    // For now, just update the historyId which can be used on next user visit
    // TODO: Implement background job queue for email sync
    // await emailSyncQueue.add({ userId: user.id, historyId: decoded.historyId });

    logger.info(`Gmail webhook: Updated historyId for user ${user.id}`);

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Gmail webhook error:', error);
    // Return 200 to acknowledge receipt even on error
    // Gmail will retry if we return error status
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

// Gmail also sends verification requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Google Cloud Pub/Sub verification
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: 'Gmail webhook endpoint active' });
}
