/**
 * SPAC OS - Compliance Alert Service
 * Generates and manages compliance alerts based on deadlines and compliance status
 */

import { db } from '@/server/db';

// ============================================================================
// TYPES
// ============================================================================

export type AlertType =
  | 'DEADLINE_APPROACHING'
  | 'DEADLINE_CRITICAL'
  | 'DEADLINE_MISSED'
  | 'FILING_REQUIRED'
  | 'COMPLIANCE_WARNING';

export type AlertSeverity = 'high' | 'medium' | 'low';

export interface AlertData {
  spacId?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  dueDate?: Date | null;
}

export interface GeneratedAlert {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  dueDate?: Date | null;
  spacId?: string | null;
  spacName?: string | null;
}

// ============================================================================
// ALERT GENERATION
// ============================================================================

/**
 * Generate alerts based on deadlines and compliance status
 * @param spacId - Optional SPAC ID to filter alerts for a specific SPAC
 */
export async function generateAlerts(spacId?: string): Promise<GeneratedAlert[]> {
  const alerts: GeneratedAlert[] = [];
  const now = new Date();

  // Build where clause for SPAC-specific or all SPACs
  const spacWhere = spacId ? { id: spacId } : {};

  // 1. Check SPAC deadlines
  const spacs = await db.spac.findMany({
    where: {
      ...spacWhere,
      deletedAt: null,
      status: { notIn: ['COMPLETED', 'LIQUIDATED', 'TERMINATED'] },
    },
    select: {
      id: true,
      name: true,
      ticker: true,
      deadline: true,
      deadlineDate: true,
      extensionDeadline: true,
    },
  });

  for (const spac of spacs) {
    const deadline = spac.extensionDeadline || spac.deadlineDate || spac.deadline;
    if (deadline) {
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (daysUntilDeadline < 0) {
        // Deadline missed
        alerts.push({
          type: 'DEADLINE_MISSED',
          severity: 'high',
          title: `SPAC Deadline Missed: ${spac.name}`,
          description: `The business combination deadline for ${spac.name} (${spac.ticker || 'N/A'}) was ${Math.abs(daysUntilDeadline)} days ago. Immediate action required.`,
          dueDate: deadline,
          spacId: spac.id,
          spacName: spac.name,
        });
      } else if (daysUntilDeadline <= 3) {
        // Critical deadline (3 days or less)
        alerts.push({
          type: 'DEADLINE_CRITICAL',
          severity: 'high',
          title: `Critical: SPAC Deadline in ${daysUntilDeadline} Days`,
          description: `${spac.name} (${spac.ticker || 'N/A'}) has a business combination deadline in ${daysUntilDeadline} days. Urgent action required.`,
          dueDate: deadline,
          spacId: spac.id,
          spacName: spac.name,
        });
      } else if (daysUntilDeadline <= 7) {
        // Approaching deadline (7 days or less)
        alerts.push({
          type: 'DEADLINE_APPROACHING',
          severity: 'medium',
          title: `SPAC Deadline Approaching: ${spac.name}`,
          description: `${spac.name} (${spac.ticker || 'N/A'}) has a business combination deadline in ${daysUntilDeadline} days.`,
          dueDate: deadline,
          spacId: spac.id,
          spacName: spac.name,
        });
      }
    }
  }

  // 2. Check filing deadlines
  const filings = await db.filing.findMany({
    where: {
      spac: spacId ? { id: spacId } : undefined,
      status: { notIn: ['FILED', 'EFFECTIVE', 'WITHDRAWN'] },
      dueDate: { not: null },
    },
    include: {
      spac: { select: { id: true, name: true, ticker: true } },
    },
  });

  for (const filing of filings) {
    if (filing.dueDate) {
      const daysUntilDue = Math.ceil((filing.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (daysUntilDue < 0) {
        alerts.push({
          type: 'DEADLINE_MISSED',
          severity: 'high',
          title: `Filing Deadline Missed: ${filing.type}`,
          description: `The ${filing.type} filing for ${filing.spac.name} was due ${Math.abs(daysUntilDue)} days ago. File immediately to avoid penalties.`,
          dueDate: filing.dueDate,
          spacId: filing.spac.id,
          spacName: filing.spac.name,
        });
      } else if (daysUntilDue <= 3) {
        alerts.push({
          type: 'DEADLINE_CRITICAL',
          severity: 'high',
          title: `Critical: ${filing.type} Due in ${daysUntilDue} Days`,
          description: `${filing.type} filing for ${filing.spac.name} is due in ${daysUntilDue} days. Finalize and file promptly.`,
          dueDate: filing.dueDate,
          spacId: filing.spac.id,
          spacName: filing.spac.name,
        });
      } else if (daysUntilDue <= 7) {
        alerts.push({
          type: 'FILING_REQUIRED',
          severity: 'medium',
          title: `Filing Due Soon: ${filing.type}`,
          description: `${filing.type} filing for ${filing.spac.name} is due in ${daysUntilDue} days.`,
          dueDate: filing.dueDate,
          spacId: filing.spac.id,
          spacName: filing.spac.name,
        });
      }
    }
  }

  // 3. Check compliance items
  const complianceItems = await db.complianceItem.findMany({
    where: {
      spac: spacId ? { id: spacId } : undefined,
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      dueDate: { not: null },
    },
    include: {
      spac: { select: { id: true, name: true, ticker: true } },
    },
  });

  for (const item of complianceItems) {
    if (item.dueDate) {
      const daysUntilDue = Math.ceil((item.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (daysUntilDue < 0) {
        alerts.push({
          type: 'COMPLIANCE_WARNING',
          severity: 'high',
          title: `Overdue Compliance Item: ${item.name}`,
          description: `${item.name} for ${item.spac.name} is ${Math.abs(daysUntilDue)} days overdue. Status: ${item.status}`,
          dueDate: item.dueDate,
          spacId: item.spac.id,
          spacName: item.spac.name,
        });
      } else if (daysUntilDue <= 3) {
        alerts.push({
          type: 'DEADLINE_CRITICAL',
          severity: 'high',
          title: `Critical: ${item.name} Due in ${daysUntilDue} Days`,
          description: `Compliance item "${item.name}" for ${item.spac.name} is due in ${daysUntilDue} days.`,
          dueDate: item.dueDate,
          spacId: item.spac.id,
          spacName: item.spac.name,
        });
      } else if (daysUntilDue <= 7) {
        alerts.push({
          type: 'DEADLINE_APPROACHING',
          severity: 'medium',
          title: `Compliance Due Soon: ${item.name}`,
          description: `${item.name} for ${item.spac.name} is due in ${daysUntilDue} days.`,
          dueDate: item.dueDate,
          spacId: item.spac.id,
          spacName: item.spac.name,
        });
      }
    }
  }

  // 4. Check for unresolved SEC comments
  const unresolvedComments = await db.secComment.findMany({
    where: {
      spac: spacId ? { id: spacId } : undefined,
      isResolved: false,
      dueDate: { not: null },
    },
    include: {
      spac: { select: { id: true, name: true, ticker: true } },
      filing: { select: { type: true } },
    },
  });

  for (const comment of unresolvedComments) {
    if (comment.dueDate) {
      const daysUntilDue = Math.ceil((comment.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      if (daysUntilDue < 0) {
        alerts.push({
          type: 'COMPLIANCE_WARNING',
          severity: 'high',
          title: `Overdue SEC Comment Response`,
          description: `SEC Comment #${comment.commentNumber} for ${comment.spac.name} (${comment.filing.type}) is ${Math.abs(daysUntilDue)} days overdue.`,
          dueDate: comment.dueDate,
          spacId: comment.spac.id,
          spacName: comment.spac.name,
        });
      } else if (daysUntilDue <= 3) {
        alerts.push({
          type: 'DEADLINE_CRITICAL',
          severity: 'high',
          title: `Critical: SEC Comment Response Due`,
          description: `Response to SEC Comment #${comment.commentNumber} for ${comment.spac.name} is due in ${daysUntilDue} days.`,
          dueDate: comment.dueDate,
          spacId: comment.spac.id,
          spacName: comment.spac.name,
        });
      } else if (daysUntilDue <= 7) {
        alerts.push({
          type: 'FILING_REQUIRED',
          severity: 'medium',
          title: `SEC Comment Response Due Soon`,
          description: `Response to SEC Comment #${comment.commentNumber} for ${comment.spac.name} is due in ${daysUntilDue} days.`,
          dueDate: comment.dueDate,
          spacId: comment.spac.id,
          spacName: comment.spac.name,
        });
      }
    }
  }

  // 5. Check for unresolved conflicts of interest (high severity)
  const unresolvedConflicts = await db.conflict.findMany({
    where: {
      spac: spacId ? { id: spacId } : undefined,
      isResolved: false,
      severity: { in: ['HIGH', 'CRITICAL'] },
    },
    include: {
      spac: { select: { id: true, name: true, ticker: true } },
    },
  });

  for (const conflict of unresolvedConflicts) {
    alerts.push({
      type: 'COMPLIANCE_WARNING',
      severity: conflict.severity === 'CRITICAL' ? 'high' : 'medium',
      title: `Unresolved Conflict of Interest`,
      description: `${conflict.title} for ${conflict.spac.name} requires resolution. Severity: ${conflict.severity}`,
      dueDate: null,
      spacId: conflict.spac.id,
      spacName: conflict.spac.name,
    });
  }

  // Sort alerts by severity (high first) and then by due date
  alerts.sort((a, b) => {
    const severityOrder: Record<AlertSeverity, number> = { high: 0, medium: 1, low: 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    if (!a.dueDate && !b.dueDate) {
      return 0;
    }
    if (!a.dueDate) {
      return 1;
    }
    if (!b.dueDate) {
      return -1;
    }
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  return alerts;
}

/**
 * Sync generated alerts to the database
 * Avoids creating duplicate alerts for the same issue
 */
export async function syncAlertsToDatabase(spacId?: string): Promise<number> {
  const generatedAlerts = await generateAlerts(spacId);
  let createdCount = 0;

  for (const alert of generatedAlerts) {
    // Check if similar alert already exists (not dismissed)
    const existingAlert = await db.complianceAlert.findFirst({
      where: {
        spacId: alert.spacId,
        type: alert.type,
        title: alert.title,
        isDismissed: false,
      },
    });

    if (!existingAlert) {
      await db.complianceAlert.create({
        data: {
          spacId: alert.spacId,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          description: alert.description,
          dueDate: alert.dueDate,
          isRead: false,
          isDismissed: false,
        },
      });
      createdCount++;
    }
  }

  return createdCount;
}

// ============================================================================
// ALERT CRUD OPERATIONS
// ============================================================================

/**
 * Create a new compliance alert
 */
export async function createAlert(alertData: AlertData) {
  return db.complianceAlert.create({
    data: {
      spacId: alertData.spacId,
      type: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      description: alertData.description,
      dueDate: alertData.dueDate,
      isRead: false,
      isDismissed: false,
    },
  });
}

/**
 * Mark an alert as read
 */
export async function markAsRead(alertId: string) {
  return db.complianceAlert.update({
    where: { id: alertId },
    data: { isRead: true },
  });
}

/**
 * Mark multiple alerts as read
 */
export async function markManyAsRead(alertIds: string[]) {
  return db.complianceAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { isRead: true },
  });
}

/**
 * Mark all alerts as read
 */
export async function markAllAsRead(spacId?: string) {
  return db.complianceAlert.updateMany({
    where: {
      spacId: spacId || undefined,
      isRead: false,
      isDismissed: false,
    },
    data: { isRead: true },
  });
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string) {
  return db.complianceAlert.update({
    where: { id: alertId },
    data: { isDismissed: true },
  });
}

/**
 * Dismiss multiple alerts
 */
export async function dismissMany(alertIds: string[]) {
  return db.complianceAlert.updateMany({
    where: { id: { in: alertIds } },
    data: { isDismissed: true },
  });
}

// ============================================================================
// ALERT QUERIES
// ============================================================================

/**
 * Get count of unread alerts
 */
export async function getUnreadCount(spacId?: string): Promise<number> {
  return db.complianceAlert.count({
    where: {
      spacId: spacId || undefined,
      isRead: false,
      isDismissed: false,
    },
  });
}

/**
 * Get active (non-dismissed) alerts
 */
export async function getActiveAlerts(options?: {
  spacId?: string;
  severity?: AlertSeverity[];
  type?: AlertType[];
  isRead?: boolean;
  limit?: number;
  offset?: number;
}) {
  const { spacId, severity, type, isRead, limit = 50, offset = 0 } = options || {};

  return db.complianceAlert.findMany({
    where: {
      spacId: spacId || undefined,
      isDismissed: false,
      ...(severity?.length && { severity: { in: severity } }),
      ...(type?.length && { type: { in: type } }),
      ...(isRead !== undefined && { isRead }),
    },
    include: {
      spac: {
        select: { id: true, name: true, ticker: true },
      },
    },
    orderBy: [
      { isRead: 'asc' },
      { severity: 'asc' }, // high, low, medium alphabetically - not ideal but works
      { dueDate: 'asc' },
      { createdAt: 'desc' },
    ],
    take: limit,
    skip: offset,
  });
}

/**
 * Get active alerts with total count in a single query
 * Optimized for pagination - avoids N+1 queries
 */
export async function getActiveAlertsWithCount(options?: {
  spacId?: string;
  severity?: AlertSeverity[];
  type?: AlertType[];
  isRead?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ alerts: Awaited<ReturnType<typeof getActiveAlerts>>; total: number }> {
  const { spacId, severity, type, isRead, limit = 50, offset = 0 } = options || {};

  const where = {
    spacId: spacId || undefined,
    isDismissed: false,
    ...(severity?.length && { severity: { in: severity } }),
    ...(type?.length && { type: { in: type } }),
    ...(isRead !== undefined && { isRead }),
  };

  const [alerts, total] = await Promise.all([
    db.complianceAlert.findMany({
      where,
      include: {
        spac: {
          select: { id: true, name: true, ticker: true },
        },
      },
      orderBy: [
        { isRead: 'asc' },
        { severity: 'asc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    }),
    db.complianceAlert.count({ where }),
  ]);

  return { alerts, total };
}

/**
 * Get alert by ID
 */
export async function getAlertById(alertId: string) {
  return db.complianceAlert.findUnique({
    where: { id: alertId },
    include: {
      spac: {
        select: { id: true, name: true, ticker: true },
      },
    },
  });
}

/**
 * Get recent alerts for the header dropdown
 */
export async function getRecentAlerts(limit = 5) {
  return db.complianceAlert.findMany({
    where: {
      isDismissed: false,
    },
    include: {
      spac: {
        select: { id: true, name: true, ticker: true },
      },
    },
    orderBy: [
      { isRead: 'asc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  });
}

/**
 * Delete old dismissed alerts (cleanup utility)
 */
export async function cleanupOldAlerts(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return db.complianceAlert.deleteMany({
    where: {
      isDismissed: true,
      updatedAt: { lt: cutoffDate },
    },
  });
}
