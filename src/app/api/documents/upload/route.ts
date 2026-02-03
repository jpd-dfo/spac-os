/**
 * SPAC OS - Document Upload API
 * Handles file uploads for documents
 */

import { type NextRequest, NextResponse } from 'next/server';

import crypto from 'crypto';

import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';



// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/png',
  'image/jpeg',
  'image/gif',
  'application/zip',
];

// Document types must match Prisma DocumentType enum
const UploadMetadataSchema = z.object({
  spacId: z.string().uuid(),
  type: z.enum([
    'NDA', 'LOI', 'DEFINITIVE_AGREEMENT', 'FINANCIAL_STATEMENT', 'DUE_DILIGENCE',
    'BOARD_PRESENTATION', 'SEC_FILING', 'INVESTOR_PRESENTATION', 'PRESS_RELEASE',
    'LEGAL', 'TAX', 'INSURANCE', 'ENVIRONMENTAL', 'TECHNICAL', 'OTHER',
  ]),
  name: z.string().min(1).max(255),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
  targetId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const metadataStr = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!metadataStr) {
      return NextResponse.json(
        { error: 'No metadata provided' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      );
    }

    // Parse and validate metadata
    let metadata: z.infer<typeof UploadMetadataSchema>;
    try {
      metadata = UploadMetadataSchema.parse(JSON.parse(metadataStr));
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid metadata', details: error },
        { status: 400 }
      );
    }

    // Verify user has access to the SPAC
    const spac = await prisma.spac.findUnique({
      where: { id: metadata.spacId },
      select: { organizationId: true },
    });

    if (!spac) {
      return NextResponse.json(
        { error: 'SPAC not found' },
        { status: 404 }
      );
    }

    const organizationId = spac.organizationId;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'SPAC is not associated with an organization' },
        { status: 400 }
      );
    }

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

    // Generate unique file URL path
    const fileExtension = file.name.split('.').pop() || '';
    const fileUrl = `documents/${metadata.spacId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    // In production, upload to cloud storage (S3, GCS, etc.)
    // For now, we'll store the path and simulate upload
    // const uploadResult = await uploadToStorage(buffer, storagePath);

    // Create document record
    const document = await prisma.document.create({
      data: {
        spacId: metadata.spacId,
        type: metadata.type,
        name: metadata.name,
        category: metadata.category,
        status: metadata.status || 'DRAFT',
        targetId: metadata.targetId,
        fileSize: file.size,
        mimeType: file.type,
        fileUrl,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        userId: session.user.id,
        organizationId,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          documentType: metadata.type,
        },
      },
    });

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        fileUrl: document.fileUrl,
        createdAt: document.createdAt,
      },
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Configure route segment config for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
