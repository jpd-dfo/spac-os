/**
 * Calendly Webhook Handler
 * Handles invitee.created and invitee.canceled events
 */

import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

import { db } from '@/server/db';
import { logger } from '@/lib/logger';

interface CalendlyWebhookPayload {
  event: 'invitee.created' | 'invitee.canceled';
  payload: {
    uri: string;
    email: string;
    name: string;
    status: 'active' | 'canceled';
    scheduled_event: {
      uri: string;
      name: string;
      start_time: string;
      end_time: string;
      location?: {
        type: string;
        location?: string;
        join_url?: string;
      };
    };
    cancellation?: {
      reason?: string;
      canceled_by?: string;
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
  };
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    // Calendly uses HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('Calendly-Webhook-Signature');
    const rawBody = await request.text();

    // Verify signature if secret is configured
    const webhookSecret = process.env['CALENDLY_WEBHOOK_SECRET'];
    if (webhookSecret && signature) {
      // Extract the signature value (format: "t=timestamp,v1=signature")
      const signatureParts = signature.split(',');
      const signatureValue = signatureParts.find(p => p.startsWith('v1='))?.slice(3);

      if (signatureValue && !verifySignature(rawBody, signatureValue, webhookSecret)) {
        logger.warn('Calendly webhook: Invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const payload: CalendlyWebhookPayload = JSON.parse(rawBody);
    logger.info(`Calendly webhook: Received ${payload.event} event`);

    if (payload.event === 'invitee.created') {
      // New meeting booked
      const invitee = payload.payload;
      const scheduledEvent = invitee.scheduled_event;

      // Check if meeting already exists (idempotency)
      const existingMeeting = await db.meeting.findFirst({
        where: { calendlyId: invitee.uri },
      });

      if (existingMeeting) {
        logger.info(`Calendly webhook: Meeting already exists for ${invitee.uri}`);
        return NextResponse.json({ received: true });
      }

      // Try to find contact by email
      const contact = await db.contact.findFirst({
        where: { email: invitee.email },
      });

      // Create meeting record
      const meeting = await db.meeting.create({
        data: {
          title: scheduledEvent.name || 'Calendly Meeting',
          description: `Booked via Calendly by ${invitee.name} (${invitee.email})`,
          startTime: new Date(scheduledEvent.start_time),
          endTime: new Date(scheduledEvent.end_time),
          location: scheduledEvent.location?.location || null,
          meetingUrl: scheduledEvent.location?.join_url || null,
          calendlyId: invitee.uri,
          attendees: {
            create: {
              contactId: contact?.id,
              email: invitee.email,
              status: 'ACCEPTED',
            },
          },
        },
      });

      // If contact found, update lastInteractionAt
      if (contact) {
        await db.contact.update({
          where: { id: contact.id },
          data: { lastInteractionAt: new Date() },
        });

        // Create interaction record
        await db.interaction.create({
          data: {
            contactId: contact.id,
            type: 'MEETING',
            subject: `Calendly: ${scheduledEvent.name}`,
            description: `Meeting scheduled via Calendly for ${scheduledEvent.start_time}`,
            date: new Date(),
          },
        });
      }

      logger.info(`Calendly webhook: Created meeting ${meeting.id}`);

    } else if (payload.event === 'invitee.canceled') {
      // Meeting canceled
      const invitee = payload.payload;

      // Find and update meeting
      const meeting = await db.meeting.findFirst({
        where: { calendlyId: invitee.uri },
      });

      if (meeting) {
        const cancelReason = invitee.cancellation?.reason || 'No reason provided';

        await db.meeting.update({
          where: { id: meeting.id },
          data: {
            description: `${meeting.description || ''}\n\n[CANCELED: ${cancelReason}]`,
          },
        });

        // Update attendee status
        await db.meetingAttendee.updateMany({
          where: {
            meetingId: meeting.id,
            email: invitee.email,
          },
          data: { status: 'DECLINED' },
        });

        logger.info(`Calendly webhook: Canceled meeting ${meeting.id}`);
      } else {
        logger.info(`Calendly webhook: Meeting not found for cancellation ${invitee.uri}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Calendly webhook error:', error);
    // Return 200 to acknowledge receipt
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

// Health check
export async function GET() {
  return NextResponse.json({ status: 'Calendly webhook endpoint active' });
}
