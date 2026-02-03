/**
 * SPAC OS - Analysis Cache API Endpoint
 * Handles retrieving and storing cached AI analysis results
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  getCachedAnalysis,
  cacheAnalysis,
  invalidateAnalysis,
  isAnalysisFresh,
  type AnalysisData,
} from '@/lib/cache/analysisCache';
import { logger } from '@/lib/logger';

// ============================================================================
// GET - Retrieve cached analysis
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    const cached = await getCachedAnalysis(documentId);

    if (!cached) {
      return NextResponse.json({
        success: true,
        data: null,
        isFresh: false,
        message: 'No cached analysis found',
      });
    }

    const isFresh = isAnalysisFresh(cached);

    return NextResponse.json({
      success: true,
      data: cached,
      isFresh,
      message: isFresh ? 'Fresh cached analysis retrieved' : 'Cached analysis expired',
    });
  } catch (error) {
    logger.error('Error retrieving cached analysis:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to retrieve cached analysis',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Store analysis in cache
// ============================================================================

interface CacheRequest {
  documentId: string;
  analysis: AnalysisData;
}

export async function POST(request: NextRequest) {
  try {
    const body: CacheRequest = await request.json();
    const { documentId, analysis } = body;

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    if (!analysis) {
      return NextResponse.json(
        { error: 'analysis data is required' },
        { status: 400 }
      );
    }

    const cached = await cacheAnalysis(documentId, analysis);

    if (!cached) {
      // Cache failed but this is non-critical
      return NextResponse.json({
        success: true,
        cached: false,
        message: 'Analysis not cached - cache unavailable',
      });
    }

    return NextResponse.json({
      success: true,
      cached: true,
      data: cached,
      message: 'Analysis cached successfully',
    });
  } catch (error) {
    logger.error('Error caching analysis:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to cache analysis',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Invalidate cached analysis
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      );
    }

    const success = await invalidateAnalysis(documentId);

    return NextResponse.json({
      success,
      message: success ? 'Cache invalidated successfully' : 'Failed to invalidate cache',
    });
  } catch (error) {
    logger.error('Error invalidating cache:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invalidate cache',
      },
      { status: 500 }
    );
  }
}
