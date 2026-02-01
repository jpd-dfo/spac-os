/**
 * SPAC OS - Batch Operations API
 * Handles bulk operations across multiple entities
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const BatchOperationSchema = z.object({
  organizationId: z.string().uuid(),
  operations: z.array(z.object({
    id: z.string().optional(), // Unique ID for tracking
    action: z.enum(['create', 'update', 'delete']),
    entityType: z.enum(['task', 'document', 'target', 'milestone', 'contact']),
    entityId: z.string().uuid().optional(), // Required for update/delete
    data: z.record(z.any()).optional(), // Required for create/update
  })).min(1).max(100), // Limit batch size
});

interface BatchResult {
  id: string;
  success: boolean;
  entityType: string;
  entityId?: string;
  error?: string;
}

/**
 * POST /api/batch - Execute batch operations
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
    let params: z.infer<typeof BatchOperationSchema>;
    try {
      params = BatchOperationSchema.parse(body);
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

    // Execute operations
    const results: BatchResult[] = [];
    const successfulOperations: string[] = [];
    const failedOperations: string[] = [];

    for (const op of params.operations) {
      const opId = op.id || `op_${results.length}`;

      try {
        let result: BatchResult;

        switch (op.action) {
          case 'create':
            result = await handleCreate(
              op.entityType,
              op.data || {},
              params.organizationId,
              session.user.id
            );
            break;

          case 'update':
            if (!op.entityId) {
              result = {
                id: opId,
                success: false,
                entityType: op.entityType,
                error: 'entityId required for update',
              };
            } else {
              result = await handleUpdate(
                op.entityType,
                op.entityId,
                op.data || {},
                params.organizationId,
                session.user.id
              );
            }
            break;

          case 'delete':
            if (!op.entityId) {
              result = {
                id: opId,
                success: false,
                entityType: op.entityType,
                error: 'entityId required for delete',
              };
            } else {
              result = await handleDelete(
                op.entityType,
                op.entityId,
                params.organizationId,
                session.user.id
              );
            }
            break;

          default:
            result = {
              id: opId,
              success: false,
              entityType: op.entityType,
              error: 'Invalid action',
            };
        }

        result.id = opId;
        results.push(result);

        if (result.success) {
          successfulOperations.push(opId);
        } else {
          failedOperations.push(opId);
        }
      } catch (error) {
        results.push({
          id: opId,
          success: false,
          entityType: op.entityType,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failedOperations.push(opId);
      }
    }

    // Create audit log for batch operation
    await prisma.auditLog.create({
      data: {
        action: 'BATCH_OPERATION',
        entityType: 'Batch',
        userId: session.user.id,
        organizationId: params.organizationId,
        metadata: {
          totalOperations: params.operations.length,
          successful: successfulOperations.length,
          failed: failedOperations.length,
        },
      },
    });

    return NextResponse.json({
      total: params.operations.length,
      successful: successfulOperations.length,
      failed: failedOperations.length,
      results,
    });
  } catch (error) {
    logger.error('Batch operation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle create operation
 */
async function handleCreate(
  entityType: string,
  data: Record<string, any>,
  organizationId: string,
  userId: string
): Promise<BatchResult> {
  let entity: any;

  switch (entityType) {
    case 'task':
      // Verify SPAC belongs to organization
      if (data.spacId) {
        const spac = await prisma.spac.findFirst({
          where: { id: data.spacId, organizationId },
        });
        if (!spac) {
          return { id: '', success: false, entityType, error: 'Invalid spacId' };
        }
      }
      entity = await prisma.task.create({
        data: {
          ...data,
          createdById: userId,
        },
      });
      break;

    case 'milestone':
      if (data.spacId) {
        const spac = await prisma.spac.findFirst({
          where: { id: data.spacId, organizationId },
        });
        if (!spac) {
          return { id: '', success: false, entityType, error: 'Invalid spacId' };
        }
      }
      entity = await prisma.milestone.create({ data });
      break;

    case 'contact':
      entity = await prisma.contact.create({ data });
      break;

    default:
      return { id: '', success: false, entityType, error: 'Create not supported for this entity' };
  }

  return { id: '', success: true, entityType, entityId: entity.id };
}

/**
 * Handle update operation
 */
async function handleUpdate(
  entityType: string,
  entityId: string,
  data: Record<string, any>,
  organizationId: string,
  userId: string
): Promise<BatchResult> {
  let entity: any;

  switch (entityType) {
    case 'task':
      const task = await prisma.task.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!task) {
        return { id: '', success: false, entityType, entityId, error: 'Task not found' };
      }
      entity = await prisma.task.update({
        where: { id: entityId },
        data,
      });
      break;

    case 'target':
      const target = await prisma.target.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!target) {
        return { id: '', success: false, entityType, entityId, error: 'Target not found' };
      }
      entity = await prisma.target.update({
        where: { id: entityId },
        data,
      });
      break;

    case 'milestone':
      const milestone = await prisma.milestone.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!milestone) {
        return { id: '', success: false, entityType, entityId, error: 'Milestone not found' };
      }
      entity = await prisma.milestone.update({
        where: { id: entityId },
        data,
      });
      break;

    case 'document':
      const document = await prisma.document.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!document) {
        return { id: '', success: false, entityType, entityId, error: 'Document not found' };
      }
      entity = await prisma.document.update({
        where: { id: entityId },
        data,
      });
      break;

    default:
      return { id: '', success: false, entityType, entityId, error: 'Update not supported for this entity' };
  }

  return { id: '', success: true, entityType, entityId: entity.id };
}

/**
 * Handle delete operation (soft delete)
 */
async function handleDelete(
  entityType: string,
  entityId: string,
  organizationId: string,
  userId: string
): Promise<BatchResult> {
  switch (entityType) {
    case 'task':
      const task = await prisma.task.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!task) {
        return { id: '', success: false, entityType, entityId, error: 'Task not found' };
      }
      await prisma.task.update({
        where: { id: entityId },
        data: { deletedAt: new Date(), deletedById: userId },
      });
      break;

    case 'target':
      const target = await prisma.target.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!target) {
        return { id: '', success: false, entityType, entityId, error: 'Target not found' };
      }
      await prisma.target.update({
        where: { id: entityId },
        data: { deletedAt: new Date(), deletedById: userId },
      });
      break;

    case 'document':
      const document = await prisma.document.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!document) {
        return { id: '', success: false, entityType, entityId, error: 'Document not found' };
      }
      await prisma.document.update({
        where: { id: entityId },
        data: { deletedAt: new Date(), deletedById: userId },
      });
      break;

    case 'milestone':
      const milestone = await prisma.milestone.findFirst({
        where: { id: entityId, spac: { organizationId } },
      });
      if (!milestone) {
        return { id: '', success: false, entityType, entityId, error: 'Milestone not found' };
      }
      await prisma.milestone.delete({ where: { id: entityId } });
      break;

    default:
      return { id: '', success: false, entityType, entityId, error: 'Delete not supported for this entity' };
  }

  return { id: '', success: true, entityType, entityId };
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
