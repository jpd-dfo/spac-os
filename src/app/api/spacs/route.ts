/**
 * SPAC OS - SPACs REST API
 * RESTful endpoints for SPAC management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { SpacCreateSchema } from '@/schemas';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// Query params schema
const ListQuerySchema = z.object({
  organizationId: z.string().uuid(),
  status: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'ticker', 'createdAt', 'deadline', 'ipoAmount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/spacs - List SPACs
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Validate query params
    let params: z.infer<typeof ListQuerySchema>;
    try {
      params = ListQuerySchema.parse(queryParams);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error },
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

    // Build query
    const where: any = {
      organizationId: params.organizationId,
      deletedAt: null,
    };

    if (params.status) {
      where.status = params.status;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { ticker: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    // Execute query
    const [items, total] = await Promise.all([
      prisma.spac.findMany({
        where,
        orderBy: { [params.sortBy]: params.sortOrder },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        include: {
          _count: {
            select: {
              targets: true,
              documents: true,
              tasks: true,
              filings: true,
            },
          },
          trustAccounts: {
            orderBy: { balanceDate: 'desc' },
            take: 1,
            select: {
              currentBalance: true,
              balanceDate: true,
            },
          },
        },
      }),
      prisma.spac.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((spac) => ({
        ...spac,
        trustBalance: spac.trustAccounts[0]?.currentBalance || null,
        trustBalanceDate: spac.trustAccounts[0]?.balanceDate || null,
        trustAccounts: undefined,
      })),
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
    });
  } catch (error) {
    logger.error('SPACs list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/spacs - Create a new SPAC
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

    // Validate input
    let data: z.infer<typeof SpacCreateSchema>;
    try {
      data = SpacCreateSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error },
        { status: 400 }
      );
    }

    // Verify user has access to organization
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: data.organizationId,
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

    // Check if ticker already exists
    if (data.ticker) {
      const existingTicker = await prisma.spac.findFirst({
        where: {
          ticker: data.ticker,
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

    // Create SPAC
    const spac = await prisma.spac.create({
      data: {
        ...data,
        createdById: session.user.id,
      },
      include: {
        organization: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Spac',
        entityId: spac.id,
        userId: session.user.id,
        organizationId: data.organizationId,
        metadata: {
          name: spac.name,
          ticker: spac.ticker,
        },
      },
    });

    return NextResponse.json(
      { spac },
      { status: 201 }
    );
  } catch (error) {
    logger.error('SPAC create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
