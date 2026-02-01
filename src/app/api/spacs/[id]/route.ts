/**
 * SPAC OS - Single SPAC REST API
 * RESTful endpoints for individual SPAC management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { SpacUpdateSchema } from '@/schemas';
import { z } from 'zod';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/spacs/[id] - Get SPAC details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const spacId = params.id;

    // Fetch SPAC with related data
    const spac = await prisma.spac.findUnique({
      where: { id: spacId },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true, image: true },
        },
        sponsors: {
          select: {
            id: true,
            name: true,
            type: true,
            promoterShares: true,
            privatePlacementWarrants: true,
          },
        },
        _count: {
          select: {
            targets: true,
            documents: true,
            filings: true,
            tasks: true,
            milestones: true,
            pipes: true,
            earnouts: true,
          },
        },
        trustAccounts: {
          orderBy: { balanceDate: 'desc' },
          take: 1,
        },
        milestones: {
          where: { status: { in: ['NOT_STARTED', 'IN_PROGRESS'] } },
          orderBy: { targetDate: 'asc' },
          take: 5,
        },
      },
    });

    if (!spac || spac.deletedAt) {
      return NextResponse.json(
        { error: 'SPAC not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: spac.organizationId,
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

    // Get additional statistics
    const [targetStats, taskStats] = await Promise.all([
      prisma.target.groupBy({
        by: ['status'],
        where: { spacId, deletedAt: null },
        _count: true,
      }),
      prisma.task.groupBy({
        by: ['status'],
        where: { spacId, deletedAt: null },
        _count: true,
      }),
    ]);

    return NextResponse.json({
      spac: {
        ...spac,
        trustBalance: spac.trustAccounts[0]?.currentBalance || null,
        statistics: {
          targets: Object.fromEntries(targetStats.map((t) => [t.status, t._count])),
          tasks: Object.fromEntries(taskStats.map((t) => [t.status, t._count])),
        },
      },
    });
  } catch (error) {
    logger.error('SPAC fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/spacs/[id] - Update SPAC
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const spacId = params.id;
    const body = await request.json();

    // Validate input
    let updateData: z.infer<typeof SpacUpdateSchema>;
    try {
      updateData = SpacUpdateSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error },
        { status: 400 }
      );
    }

    // Fetch existing SPAC
    const existingSpac = await prisma.spac.findUnique({
      where: { id: spacId },
    });

    if (!existingSpac || existingSpac.deletedAt) {
      return NextResponse.json(
        { error: 'SPAC not found' },
        { status: 404 }
      );
    }

    // Verify user has access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: existingSpac.organizationId,
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

    // Check ticker uniqueness if changing
    if (updateData.ticker && updateData.ticker !== existingSpac.ticker) {
      const existingTicker = await prisma.spac.findFirst({
        where: {
          ticker: updateData.ticker,
          id: { not: spacId },
          deletedAt: null,
        },
      });

      if (existingTicker) {
        return NextResponse.json(
          { error: 'Ticker already exists' },
          { status: 409 }
        );
      }
    }

    // Calculate changes for audit log
    const changes: Record<string, { old: any; new: any }> = {};
    for (const [key, value] of Object.entries(updateData)) {
      if (value !== undefined && (existingSpac as any)[key] !== value) {
        changes[key] = {
          old: (existingSpac as any)[key],
          new: value,
        };
      }
    }

    // Update SPAC
    const updatedSpac = await prisma.spac.update({
      where: { id: spacId },
      data: updateData,
      include: {
        organization: {
          select: { id: true, name: true },
        },
      },
    });

    // Create audit log if there were changes
    if (Object.keys(changes).length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType: 'Spac',
          entityId: spacId,
          userId: session.user.id,
          organizationId: existingSpac.organizationId,
          changes,
        },
      });
    }

    return NextResponse.json({ spac: updatedSpac });
  } catch (error) {
    logger.error('SPAC update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/spacs/[id] - Partial update SPAC
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  // PATCH behaves same as PUT for partial updates
  return PUT(request, { params });
}

/**
 * DELETE /api/spacs/[id] - Soft delete SPAC
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const spacId = params.id;

    // Fetch existing SPAC
    const existingSpac = await prisma.spac.findUnique({
      where: { id: spacId },
    });

    if (!existingSpac || existingSpac.deletedAt) {
      return NextResponse.json(
        { error: 'SPAC not found' },
        { status: 404 }
      );
    }

    // Verify user has admin/owner access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: existingSpac.organizationId,
          userId: session.user.id,
        },
      },
    });

    if (!membership || !['ADMIN', 'OWNER'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Access denied - admin required' },
        { status: 403 }
      );
    }

    // Soft delete
    await prisma.spac.update({
      where: { id: spacId },
      data: {
        deletedAt: new Date(),
        deletedById: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Spac',
        entityId: spacId,
        userId: session.user.id,
        organizationId: existingSpac.organizationId,
        metadata: {
          name: existingSpac.name,
          ticker: existingSpac.ticker,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('SPAC delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
