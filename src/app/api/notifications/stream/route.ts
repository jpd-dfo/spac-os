/**
 * SPAC OS - Server-Sent Events (SSE) Notification Stream
 * Provides real-time notifications for compliance alerts and system events
 *
 * This endpoint works on Vercel's serverless architecture with automatic
 * reconnection handling on the client side.
 *
 * Note: Vercel has a 25-second timeout for streaming responses on the free tier,
 * and up to 5 minutes on Pro plans. The client should handle reconnection.
 */

import type { NextRequest } from 'next/server';

import { auth } from '@clerk/nextjs/server';

import { getRecentAlerts, getUnreadCount } from '@/lib/compliance/alertService';
import { logger } from '@/lib/logger';

// Event types for SSE notifications
export type NotificationEventType =
  | 'connected'
  | 'alert'
  | 'alert_count'
  | 'filing_status'
  | 'heartbeat'
  | 'error';

export interface NotificationEvent {
  type: NotificationEventType;
  data: unknown;
  timestamp: string;
}

// Helper to format SSE message
function formatSSE(event: NotificationEvent): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
}

export async function GET(request: NextRequest) {
  // Authenticate the request
  const { userId } = await auth();

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get spacId filter from query params (optional)
  const spacId = request.nextUrl.searchParams.get('spacId') || undefined;

  logger.info(`[SSE] User ${userId} connecting to notification stream${spacId ? ` for SPAC ${spacId}` : ''}`);

  // Create a TransformStream for SSE
  const encoder = new TextEncoder();
  let isConnectionClosed = false;

  const stream = new TransformStream({
    start(controller) {
      // Send initial connection event
      const connectEvent: NotificationEvent = {
        type: 'connected',
        data: {
          message: 'Connected to notification stream',
          userId,
          spacId: spacId || null,
        },
        timestamp: new Date().toISOString(),
      };
      controller.enqueue(encoder.encode(formatSSE(connectEvent)));
    },
  });

  const writer = stream.writable.getWriter();

  // Track last known state for change detection
  let lastUnreadCount = -1;
  const lastAlertIds = new Set<string>();

  // Function to check for updates and send events
  async function checkForUpdates() {
    if (isConnectionClosed) {
      return;
    }

    try {
      // Get current unread count
      const { count: currentUnreadCount } = { count: await getUnreadCount(spacId) };

      // If unread count changed, send update
      if (currentUnreadCount !== lastUnreadCount) {
        const countEvent: NotificationEvent = {
          type: 'alert_count',
          data: {
            count: currentUnreadCount,
            previousCount: lastUnreadCount,
          },
          timestamp: new Date().toISOString(),
        };
        await writer.write(encoder.encode(formatSSE(countEvent)));

        // If count increased, fetch and send new alerts
        if (currentUnreadCount > lastUnreadCount && lastUnreadCount !== -1) {
          const recentAlerts = await getRecentAlerts(5);

          for (const alert of recentAlerts) {
            if (!lastAlertIds.has(alert.id)) {
              const alertEvent: NotificationEvent = {
                type: 'alert',
                data: {
                  id: alert.id,
                  title: alert.title,
                  description: alert.description,
                  type: alert.type,
                  severity: alert.severity,
                  spacId: alert.spacId,
                  spac: alert.spac ? {
                    id: alert.spac.id,
                    name: alert.spac.name,
                    ticker: alert.spac.ticker,
                  } : null,
                  createdAt: alert.createdAt,
                },
                timestamp: new Date().toISOString(),
              };
              await writer.write(encoder.encode(formatSSE(alertEvent)));
              lastAlertIds.add(alert.id);
            }
          }
        }

        lastUnreadCount = currentUnreadCount;
      }
    } catch (error) {
      logger.error('[SSE] Error checking for updates:', error);

      if (!isConnectionClosed) {
        const errorEvent: NotificationEvent = {
          type: 'error',
          data: { message: 'Error checking for updates' },
          timestamp: new Date().toISOString(),
        };
        try {
          await writer.write(encoder.encode(formatSSE(errorEvent)));
        } catch {
          // Connection likely closed
          isConnectionClosed = true;
        }
      }
    }
  }

  // Function to send heartbeat
  async function sendHeartbeat() {
    if (isConnectionClosed) {
      return;
    }

    try {
      const heartbeatEvent: NotificationEvent = {
        type: 'heartbeat',
        data: { timestamp: Date.now() },
        timestamp: new Date().toISOString(),
      };
      await writer.write(encoder.encode(formatSSE(heartbeatEvent)));
    } catch {
      // Connection closed
      isConnectionClosed = true;
    }
  }

  // Initial check
  await checkForUpdates();

  // Set up polling interval (check every 5 seconds)
  // This is a hybrid approach: SSE for delivery, polling for detection
  // In production with Pusher/Redis, this would be replaced with pub/sub
  const updateInterval = setInterval(async () => {
    if (isConnectionClosed) {
      clearInterval(updateInterval);
      clearInterval(heartbeatInterval);
      return;
    }
    await checkForUpdates();
  }, 5000);

  // Send heartbeat every 15 seconds to keep connection alive
  const heartbeatInterval = setInterval(async () => {
    if (isConnectionClosed) {
      clearInterval(updateInterval);
      clearInterval(heartbeatInterval);
      return;
    }
    await sendHeartbeat();
  }, 15000);

  // Clean up when the request is aborted
  request.signal.addEventListener('abort', () => {
    logger.info(`[SSE] User ${userId} disconnected from notification stream`);
    isConnectionClosed = true;
    clearInterval(updateInterval);
    clearInterval(heartbeatInterval);
    writer.close().catch(() => {
      // Ignore close errors
    });
  });

  // Return the SSE response
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
