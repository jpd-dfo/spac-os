/**
 * SPAC OS - Document Download/Management API
 * Handles document retrieval and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

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

    // Verify user has access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: document.spac.organizationId,
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

    // Check document access level
    if (document.accessLevel === 'RESTRICTED') {
      // Additional access check for restricted documents
      const hasRestrictedAccess = membership.role === 'ADMIN' || membership.role === 'OWNER';
      if (!hasRestrictedAccess) {
        return NextResponse.json(
          { error: 'Access denied - restricted document' },
          { status: 403 }
        );
      }
    }

    // Check for version query param
    const url = new URL(request.url);
    const versionParam = url.searchParams.get('version');

    let storagePath = document.storagePath;
    let fileName = document.fileName;

    if (versionParam) {
      const version = await prisma.documentVersion.findFirst({
        where: {
          documentId,
          version: parseInt(versionParam),
        },
      });

      if (!version) {
        return NextResponse.json(
          { error: 'Version not found' },
          { status: 404 }
        );
      }

      storagePath = version.storagePath;
      fileName = version.fileName;
    }

    // In production, fetch from cloud storage and stream
    // For now, return document metadata with download URL
    const downloadUrl = `/api/documents/${documentId}/download?token=${generateDownloadToken(documentId, session.user.id)}`;

    // Update download count
    await prisma.document.update({
      where: { id: documentId },
      data: { downloadCount: { increment: 1 } },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'READ',
        entityType: 'Document',
        entityId: documentId,
        userId: session.user.id,
        organizationId: document.spac.organizationId,
        metadata: {
          action: 'download',
          version: versionParam || document.currentVersion,
        },
      },
    });

    return NextResponse.json({
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        version: document.currentVersion,
        downloadUrl,
        storagePath,
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

    // Verify access
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: document.spac.organizationId,
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

    // Update document
    const updated = await prisma.document.update({
      where: { id: documentId },
      data: {
        title: body.title,
        description: body.description,
        accessLevel: body.accessLevel,
        tags: body.tags,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entityType: 'Document',
        entityId: documentId,
        userId: session.user.id,
        organizationId: document.spac.organizationId,
        changes: body,
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

    // Verify access (require admin/owner for deletion)
    const membership = await prisma.organizationUser.findUnique({
      where: {
        organizationId_userId: {
          organizationId: document.spac.organizationId,
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
        deletedById: session.user.id,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entityType: 'Document',
        entityId: documentId,
        userId: session.user.id,
        organizationId: document.spac.organizationId,
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
  const crypto = require('crypto');
  const payload = `${documentId}:${userId}:${Date.now()}`;
  return crypto
    .createHmac('sha256', process.env.NEXTAUTH_SECRET || 'default-secret')
    .update(payload)
    .digest('hex')
    .slice(0, 32);
}
