/**
 * SPAC OS - Document Upload API
 * Handles file uploads for documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { DocumentCreateSchema } from '@/schemas';
import { z } from 'zod';
import crypto from 'crypto';
import { logger } from '@/lib/logger';

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

const UploadMetadataSchema = z.object({
  spacId: z.string().uuid(),
  type: z.enum([
    'LOI', 'NDA', 'TERM_SHEET', 'DEFINITIVE_AGREEMENT', 'PROXY_STATEMENT',
    'PROSPECTUS', 'S1', 'S4', 'FORM_8K', 'FORM_10K', 'FORM_10Q',
    'FINANCIAL_STATEMENTS', 'DUE_DILIGENCE', 'BOARD_PRESENTATION',
    'INVESTOR_PRESENTATION', 'FAIRNESS_OPINION', 'LEGAL_OPINION',
    'TAX_OPINION', 'AUDIT_REPORT', 'CONTRACT', 'CORRESPONDENCE', 'OTHER',
  ]),
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
  targetId: z.string().uuid().optional(),
  filingId: z.string().uuid().optional(),
  accessLevel: z.enum(['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED']).default('INTERNAL'),
  tags: z.array(z.string()).optional(),
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

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate file hash for deduplication
    const fileHash = crypto
      .createHash('sha256')
      .update(buffer)
      .digest('hex');

    // Generate unique storage path
    const fileExtension = file.name.split('.').pop() || '';
    const storagePath = `documents/${metadata.spacId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${fileExtension}`;

    // In production, upload to cloud storage (S3, GCS, etc.)
    // For now, we'll store the path and simulate upload
    // const uploadResult = await uploadToStorage(buffer, storagePath);

    // Create document record
    const document = await prisma.document.create({
      data: {
        spacId: metadata.spacId,
        type: metadata.type,
        title: metadata.title,
        description: metadata.description,
        targetId: metadata.targetId,
        filingId: metadata.filingId,
        accessLevel: metadata.accessLevel,
        tags: metadata.tags || [],
        uploadedById: session.user.id,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath,
        fileHash,
        currentVersion: 1,
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Create initial version record
    await prisma.documentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        fileName: file.name,
        fileSize: file.size,
        storagePath,
        uploadedById: session.user.id,
        changeNotes: 'Initial upload',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entityType: 'Document',
        entityId: document.id,
        userId: session.user.id,
        organizationId: spac.organizationId,
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
        title: document.title,
        type: document.type,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        version: document.currentVersion,
        uploadedBy: document.uploadedBy,
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
