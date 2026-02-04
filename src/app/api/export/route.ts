/**
 * SPAC OS - Data Export API
 * Handles data export in various formats (CSV, Excel, JSON)
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

const ExportRequestSchema = z.object({
  organizationId: z.string().uuid(),
  entityType: z.enum([
    'spacs',
    'targets',
    'tasks',
    'documents',
    'filings',
    'compliance',
    'transactions',
    'audit_logs',
  ]),
  format: z.enum(['json', 'csv']).default('json'),
  filters: z.object({
    spacId: z.string().uuid().optional(),
    status: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }).optional(),
  fields: z.array(z.string()).optional(),
});

/**
 * POST /api/export - Export data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request
    let params: z.infer<typeof ExportRequestSchema>;
    try {
      params = ExportRequestSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request', details: error },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: params.organizationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Fetch data based on entity type
    let data: Record<string, unknown>[];
    const filters = params.filters || {};

    switch (params.entityType) {
      case 'spacs':
        data = await prisma.spac.findMany({
          where: {
            organizationId: params.organizationId,
            deletedAt: null,
            ...(filters.status && { status: filters.status }),
            ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
            ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
          },
          include: {
            _count: { select: { targets: true, documents: true, tasks: true } },
          },
        });
        break;

      case 'targets':
        data = await prisma.target.findMany({
          where: {
            spac: { organizationId: params.organizationId },
            deletedAt: null,
            ...(filters.spacId && { spacId: filters.spacId }),
            ...(filters.status && { status: filters.status }),
          },
          include: {
            spac: { select: { name: true, ticker: true } },
          },
        });
        break;

      case 'tasks':
        data = await prisma.task.findMany({
          where: {
            spac: { organizationId: params.organizationId },
            deletedAt: null,
            ...(filters.spacId && { spacId: filters.spacId }),
            ...(filters.status && { status: filters.status }),
          },
          include: {
            spac: { select: { name: true, ticker: true } },
            assignee: { select: { name: true, email: true } },
          },
        });
        break;

      case 'documents':
        data = await prisma.document.findMany({
          where: {
            spac: { organizationId: params.organizationId },
            deletedAt: null,
            ...(filters.spacId && { spacId: filters.spacId }),
          },
          include: {
            spac: { select: { name: true, ticker: true } },
          },
        });
        break;

      case 'filings':
        data = await prisma.filing.findMany({
          where: {
            spac: { organizationId: params.organizationId },
            ...(filters.spacId && { spacId: filters.spacId }),
            ...(filters.status && { status: filters.status }),
          },
          include: {
            spac: { select: { name: true, ticker: true } },
          },
        });
        break;

      case 'compliance':
        data = await prisma.complianceItem.findMany({
          where: {
            spac: { organizationId: params.organizationId },
            ...(filters.spacId && { spacId: filters.spacId }),
            ...(filters.status && { status: filters.status }),
          },
          include: {
            spac: { select: { name: true, ticker: true } },
          },
        });
        break;

      case 'transactions':
        data = await prisma.transaction.findMany({
          where: {
            target: { spac: { organizationId: params.organizationId } },
            ...(filters.startDate && { date: { gte: filters.startDate } }),
            ...(filters.endDate && { date: { lte: filters.endDate } }),
          },
          include: {
            target: { select: { name: true, spac: { select: { name: true, ticker: true } } } },
          },
        });
        break;

      case 'audit_logs':
        // Only allow admins to export audit logs
        if (!['ADMIN', 'OWNER'].includes(membership.role)) {
          return NextResponse.json(
            { error: 'Admin access required for audit log export' },
            { status: 403 }
          );
        }
        data = await prisma.auditLog.findMany({
          where: {
            organizationId: params.organizationId,
            ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
            ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
          },
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000, // Limit export size
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid entity type' },
          { status: 400 }
        );
    }

    // Filter fields if specified
    if (params.fields && params.fields.length > 0) {
      data = data.map((item) => {
        const filtered: Record<string, unknown> = {};
        for (const field of params.fields!) {
          if (field in item) {
            filtered[field] = (item as Record<string, unknown>)[field];
          }
        }
        return filtered;
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'EXPORT',
        entityType: params.entityType,
        entityId: params.organizationId, // Use organizationId as entity reference for bulk exports
        userId: session.user.id,
        organizationId: params.organizationId,
        metadata: {
          format: params.format,
          recordCount: data.length,
          filters,
        },
      },
    });

    // Format response
    if (params.format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${params.entityType}_export_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      entityType: params.entityType,
      recordCount: data.length,
      exportedAt: new Date().toISOString(),
      data,
    });
  } catch (error) {
    logger.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data: Record<string, unknown>[]): string {
  if (data.length === 0) {
    return '';
  }

  // Get all unique keys from all objects
  const headers = new Set<string>();
  for (const item of data) {
    for (const key of Object.keys(flattenObject(item))) {
      headers.add(key);
    }
  }

  const headerArray = Array.from(headers);

  // Create CSV header row
  const csvRows = [headerArray.map(escapeCSV).join(',')];

  // Create data rows
  for (const item of data) {
    const flat = flattenObject(item);
    const row = headerArray.map((header) => {
      const value = flat[header];
      return escapeCSV(value);
    });
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

/**
 * Flatten nested objects for CSV export
 */
function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      result[newKey] = '';
    } else if (value instanceof Date) {
      result[newKey] = value.toISOString();
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else if (typeof value === 'object') {
      Object.assign(result, flattenObject(value, newKey));
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Escape value for CSV
 */
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = String(value);

  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
