/**
 * SPAC OS - Document Upload API
 * Handles file uploads to Supabase Storage
 */

import { type NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import {
  uploadToStorage,
  generateStoragePath,
  MAX_FILE_SIZE,
  isValidFileType,
  isSupabaseConfigured,
  DOCUMENTS_BUCKET,
} from '@/lib/supabase';

// Document types must match Prisma DocumentType enum
const UploadMetadataSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum([
    'NDA', 'LOI', 'DEFINITIVE_AGREEMENT', 'FINANCIAL_STATEMENT', 'DUE_DILIGENCE',
    'BOARD_PRESENTATION', 'SEC_FILING', 'INVESTOR_PRESENTATION', 'PRESS_RELEASE',
    'LEGAL', 'TAX', 'INSURANCE', 'ENVIRONMENTAL', 'TECHNICAL', 'OTHER',
  ]).default('OTHER'),
  category: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'FINAL', 'ARCHIVED']).optional(),
  spacId: z.string().uuid().optional(),
  targetId: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using Clerk
    const { userId, orgId } = await auth();
    if (!userId) {
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
    if (!isValidFileType(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG' },
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

    // Validate SPAC or Target exists and user has access
    let organizationId: string | null = null;

    if (metadata.spacId) {
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

      organizationId = spac.organizationId;
    } else if (metadata.targetId) {
      const target = await prisma.target.findUnique({
        where: { id: metadata.targetId },
        include: { spac: { select: { organizationId: true } } },
      });

      if (!target) {
        return NextResponse.json(
          { error: 'Target not found' },
          { status: 404 }
        );
      }

      organizationId = target.spac?.organizationId || null;
    }

    // Verify user has access to the organization (if applicable)
    if (organizationId) {
      const membership = await prisma.organizationUser.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId,
          },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Generate document ID for storage path
    const documentId = crypto.randomUUID();
    const version = 1;

    // Generate storage path
    const storagePath = generateStoragePath({
      spacId: metadata.spacId,
      targetId: metadata.targetId,
      documentId,
      version,
      fileName: file.name,
    });

    // Determine file URL - either from Supabase or local path
    let fileUrl = storagePath;

    // Upload to Supabase Storage if configured
    if (isSupabaseConfigured()) {
      const { path: uploadedPath, error: uploadError } = await uploadToStorage(
        file,
        storagePath,
        { contentType: file.type }
      );

      if (uploadError) {
        logger.error('Supabase upload error:', uploadError);
        return NextResponse.json(
          { error: 'Failed to upload file to storage' },
          { status: 500 }
        );
      }

      // Update the file URL to be the Supabase storage path
      fileUrl = `${DOCUMENTS_BUCKET}/${uploadedPath}`;
    } else {
      // Log warning that Supabase is not configured
      logger.warn('Supabase not configured - storing path only without actual file upload');
    }

    // Create document record in database
    const document = await prisma.document.create({
      data: {
        id: documentId,
        spacId: metadata.spacId || null,
        targetId: metadata.targetId || null,
        type: metadata.type as any,
        name: metadata.name || file.name,
        category: metadata.category || null,
        status: (metadata.status as any) || 'DRAFT',
        fileSize: file.size,
        mimeType: file.type,
        fileUrl,
      },
    });

    // Create audit log if organization context exists
    if (organizationId) {
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entityType: 'Document',
          entityId: document.id,
          userId,
          organizationId,
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            documentType: metadata.type,
            storagePath,
          },
        },
      });
    }

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
