/**
 * SPAC OS - WebSocket Server Configuration
 * Real-time subscriptions and live updates
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { parse } from 'cookie';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Event types for real-time updates
export enum SocketEvent {
  // Connection events
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  ERROR = 'error',

  // Room management
  JOIN_ORGANIZATION = 'join:organization',
  LEAVE_ORGANIZATION = 'leave:organization',
  JOIN_SPAC = 'join:spac',
  LEAVE_SPAC = 'leave:spac',

  // SPAC updates
  SPAC_CREATED = 'spac:created',
  SPAC_UPDATED = 'spac:updated',
  SPAC_STATUS_CHANGED = 'spac:status_changed',
  SPAC_DELETED = 'spac:deleted',

  // Target updates
  TARGET_CREATED = 'target:created',
  TARGET_UPDATED = 'target:updated',
  TARGET_STATUS_CHANGED = 'target:status_changed',
  TARGET_DELETED = 'target:deleted',

  // Task updates
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_COMPLETED = 'task:completed',
  TASK_ASSIGNED = 'task:assigned',
  TASK_DELETED = 'task:deleted',

  // Document updates
  DOCUMENT_UPLOADED = 'document:uploaded',
  DOCUMENT_UPDATED = 'document:updated',
  DOCUMENT_VERSION_CREATED = 'document:version_created',
  DOCUMENT_DELETED = 'document:deleted',

  // Filing updates
  FILING_CREATED = 'filing:created',
  FILING_UPDATED = 'filing:updated',
  FILING_STATUS_CHANGED = 'filing:status_changed',
  FILING_SUBMITTED = 'filing:submitted',
  FILING_EFFECTIVE = 'filing:effective',
  SEC_COMMENT_RECEIVED = 'filing:sec_comment',

  // Financial updates
  TRUST_BALANCE_UPDATED = 'trust:balance_updated',
  REDEMPTION_RECORDED = 'redemption:recorded',
  PIPE_INVESTOR_UPDATED = 'pipe:investor_updated',
  EARNOUT_ACHIEVED = 'earnout:achieved',

  // Compliance updates
  COMPLIANCE_ALERT = 'compliance:alert',
  TRADING_WINDOW_CHANGED = 'trading:window_changed',

  // Milestone updates
  MILESTONE_REACHED = 'milestone:reached',
  MILESTONE_UPDATED = 'milestone:updated',

  // Notifications
  NOTIFICATION = 'notification',
  NOTIFICATION_READ = 'notification:read',

  // Dashboard updates
  DASHBOARD_REFRESH = 'dashboard:refresh',
}

// Payload types
export interface SocketPayload {
  type: SocketEvent;
  entityType?: string;
  entityId?: string;
  spacId?: string;
  organizationId?: string;
  userId?: string;
  data?: any;
  timestamp: Date;
}

// Socket user data
interface SocketUser {
  id: string;
  email: string;
  name?: string;
  organizationId?: string;
}

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

/**
 * Initialize WebSocket server
 */
export function initializeWebSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      credentials: true,
    },
    path: '/api/ws',
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error('Authentication required'));
      }

      const parsedCookies = parse(cookies);
      const sessionToken = parsedCookies['next-auth.session-token'] ||
                          parsedCookies['__Secure-next-auth.session-token'];

      if (!sessionToken) {
        return next(new Error('No session token'));
      }

      // Verify session
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: {
            include: {
              organizations: {
                take: 1,
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!session || session.expires < new Date()) {
        return next(new Error('Invalid or expired session'));
      }

      socket.user = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || undefined,
        organizationId: session.user.organizations[0]?.organizationId,
      };

      next();
    } catch (error) {
      logger.error('WebSocket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`[WebSocket] User connected: ${socket.user?.id}`);

    // Auto-join user's organization room
    if (socket.user?.organizationId) {
      socket.join(`org:${socket.user.organizationId}`);
    }

    // Join user-specific room for notifications
    socket.join(`user:${socket.user?.id}`);

    // Room management
    socket.on(SocketEvent.JOIN_ORGANIZATION, async (organizationId: string) => {
      // Verify user has access to organization
      if (!socket.user) return;

      const membership = await prisma.organizationUser.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId: socket.user.id,
          },
        },
      });

      if (membership) {
        socket.join(`org:${organizationId}`);
        socket.emit(SocketEvent.JOIN_ORGANIZATION, { success: true, organizationId });
      } else {
        socket.emit(SocketEvent.ERROR, { message: 'Access denied to organization' });
      }
    });

    socket.on(SocketEvent.LEAVE_ORGANIZATION, (organizationId: string) => {
      socket.leave(`org:${organizationId}`);
    });

    socket.on(SocketEvent.JOIN_SPAC, async (spacId: string) => {
      if (!socket.user) return;

      // Verify user has access to SPAC (through organization)
      const spac = await prisma.spac.findUnique({
        where: { id: spacId },
        select: { organizationId: true },
      });

      if (!spac) {
        socket.emit(SocketEvent.ERROR, { message: 'SPAC not found' });
        return;
      }

      const membership = await prisma.organizationUser.findUnique({
        where: {
          organizationId_userId: {
            organizationId: spac.organizationId,
            userId: socket.user.id,
          },
        },
      });

      if (membership) {
        socket.join(`spac:${spacId}`);
        socket.emit(SocketEvent.JOIN_SPAC, { success: true, spacId });
      } else {
        socket.emit(SocketEvent.ERROR, { message: 'Access denied to SPAC' });
      }
    });

    socket.on(SocketEvent.LEAVE_SPAC, (spacId: string) => {
      socket.leave(`spac:${spacId}`);
    });

    // Mark notification as read
    socket.on(SocketEvent.NOTIFICATION_READ, async (notificationId: string) => {
      if (!socket.user) return;

      await prisma.notification.update({
        where: { id: notificationId, userId: socket.user.id },
        data: { isRead: true, readAt: new Date() },
      });
    });

    socket.on('disconnect', () => {
      logger.info(`[WebSocket] User disconnected: ${socket.user?.id}`);
    });
  });

  return io;
}

/**
 * WebSocket event emitter helper
 */
export class WebSocketEmitter {
  constructor(private io: SocketIOServer) {}

  /**
   * Emit to all users in an organization
   */
  toOrganization(organizationId: string, event: SocketEvent, data: any) {
    this.io.to(`org:${organizationId}`).emit(event, {
      type: event,
      organizationId,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit to all users watching a SPAC
   */
  toSpac(spacId: string, event: SocketEvent, data: any) {
    this.io.to(`spac:${spacId}`).emit(event, {
      type: event,
      spacId,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit to a specific user
   */
  toUser(userId: string, event: SocketEvent, data: any) {
    this.io.to(`user:${userId}`).emit(event, {
      type: event,
      userId,
      data,
      timestamp: new Date(),
    });
  }

  /**
   * Emit to multiple users
   */
  toUsers(userIds: string[], event: SocketEvent, data: any) {
    for (const userId of userIds) {
      this.toUser(userId, event, data);
    }
  }

  /**
   * Emit SPAC update
   */
  spacUpdated(spac: { id: string; organizationId: string }, changes?: any) {
    this.toOrganization(spac.organizationId, SocketEvent.SPAC_UPDATED, {
      spacId: spac.id,
      changes,
    });
    this.toSpac(spac.id, SocketEvent.SPAC_UPDATED, { changes });
  }

  /**
   * Emit status change
   */
  spacStatusChanged(spac: { id: string; organizationId: string }, oldStatus: string, newStatus: string) {
    const data = { spacId: spac.id, oldStatus, newStatus };
    this.toOrganization(spac.organizationId, SocketEvent.SPAC_STATUS_CHANGED, data);
    this.toSpac(spac.id, SocketEvent.SPAC_STATUS_CHANGED, data);
  }

  /**
   * Emit task assignment
   */
  taskAssigned(task: { id: string; spacId?: string | null }, assigneeId: string) {
    this.toUser(assigneeId, SocketEvent.TASK_ASSIGNED, {
      taskId: task.id,
      spacId: task.spacId,
    });

    if (task.spacId) {
      this.toSpac(task.spacId, SocketEvent.TASK_UPDATED, {
        taskId: task.id,
        update: 'assigned',
      });
    }
  }

  /**
   * Emit notification
   */
  notification(userId: string, notification: any) {
    this.toUser(userId, SocketEvent.NOTIFICATION, notification);
  }

  /**
   * Emit compliance alert
   */
  complianceAlert(spacId: string, organizationId: string, alert: any) {
    this.toSpac(spacId, SocketEvent.COMPLIANCE_ALERT, alert);
    this.toOrganization(organizationId, SocketEvent.COMPLIANCE_ALERT, {
      spacId,
      ...alert,
    });
  }

  /**
   * Emit dashboard refresh
   */
  dashboardRefresh(organizationId: string) {
    this.toOrganization(organizationId, SocketEvent.DASHBOARD_REFRESH, {
      timestamp: new Date(),
    });
  }
}

// Singleton instance (initialized when server starts)
let wsEmitter: WebSocketEmitter | null = null;

export function getWebSocketEmitter(): WebSocketEmitter | null {
  return wsEmitter;
}

export function setWebSocketEmitter(emitter: WebSocketEmitter) {
  wsEmitter = emitter;
}
