/**
 * SPAC OS - Document Download/Management API
 * Handles document retrieval and management
 */

import crypto from 'crypto';

import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';

import { authOptions } from '@/lib/auth';
import { invalidateAnalysis } from '@/lib/cache/analysisCache';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/documents/[id] - Download document
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

    const documentId = params.id;

    // Fetch document with access check
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        spac: {
          select: { organizationId: true },
        },
      },
    });

    if (!document || document.deletedAt) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document has a SPAC with organization
    const organizationId = document.spac?.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Document not associated with an organization' },
        { status: 403 }
      );
    }

    // Verify user has access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
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

    const fileUrl = document.fileUrl;
    const fileName = document.name;

    // In production, fetch from cloud storage and stream
    // For now, return document metadata with download URL
    const downloadUrl = `/api/documents/${documentId}/download?token=${generateDownloadToken(documentId, session.user.id)}`;

    // Update document timestamp to track access
    await prisma.document.update({
      where: { id: documentId },
      data: { updatedAt: new Date() },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'READ',
        entityType: 'Document',
        entityId: documentId,
        userId: session.user.id,
        organizationId: organizationId,
        metadata: {
          action: 'download',
        },
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        fileName,
        fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        downloadUrl,
      },
    });
  } catch (error) {
    logger.error('Document fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/documents/[id] - Update document metadata
 */
export async function PATCH(
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

    const documentId = params.id;
    const body = await request.json();

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        spac: { select: { organizationId: true } },
      },
    });

    if (!document || document.deletedAt) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const patchOrgId = document.spac?.organizationId;
    if (!patchOrgId) {
      return NextResponse.json(
        { error: 'Document not associated with an organization' },
        { status: 403 }
      );
    }

    // Verify access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: patchOrgId,
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

    // Update document - only update fields that exist in the schema
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        name: body.name,
        category: body.category,
        status: body.status,
        type: body.type,
      },
    });

    // Invalidate cached AI analysis when document is updated
    // This ensures fresh analysis is generated on next request
    await invalidateAnalysis(documentId);
    logger.info(`Invalidated analysis cache for document: ${documentId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: documentId,
        userId: session.user.id,
        organizationId: patchOrgId,
        metadata: body,
      },
    });

    return NextResponse.json({ document: updated });
  } catch (error) {
    logger.error('Document update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id] - Soft delete document
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

    const documentId = params.id;

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        spac: { select: { organizationId: true } },
      },
    });

    if (!document || document.deletedAt) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const deleteOrgId = document.spac?.organizationId;
    if (!deleteOrgId) {
      return NextResponse.json(
        { error: 'Document not associated with an organization' },
        { status: 403 }
      );
    }

    // Verify access (require admin/owner for deletion)
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: deleteOrgId,
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
    await prisma.document.update({
      where: { id: documentId },
      data: {
        deletedAt: new Date(),
      },
    });

    // Invalidate cached AI analysis when document is deleted
    await invalidateAnalysis(documentId);
    logger.info(`Invalidated analysis cache for deleted document: ${documentId}`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Document',
        entityId: documentId,
        userId: session.user.id,
        organizationId: deleteOrgId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Document delete error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate a temporary download token
function generateDownloadToken(documentId: string, userId: string): string {
  const payload = `${documentId}:${userId}:${Date.now()}`;
  return crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'default-secret')
    .update(payload)
    .digest('hex')
    .slice(0, 32);
}
