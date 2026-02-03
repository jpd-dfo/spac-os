/**
 * SEC EDGAR Filings API Endpoint
 * Fetches filings from SEC EDGAR for a given CIK
 */

import { type NextRequest, NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { z } from 'zod';

import { authOptions } from '@/lib/auth';
import {
  fetchCompanyFilings,
  fetchFilingDetails,
  searchFilingsByCik,
  SecEdgarError,
  NotFoundError,
  RateLimitError,
} from '@/lib/compliance/secEdgarClient';
import { logger } from '@/lib/logger';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const GetFilingsQuerySchema = z.object({
  cik: z.string().min(1, 'CIK is required'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  formTypes: z.string().optional(), // Comma-separated list of form types
});

const GetFilingDetailsQuerySchema = z.object({
  cik: z.string().min(1, 'CIK is required'),
  accessionNumber: z.string().min(1, 'Accession number is required'),
});

// ============================================================================
// SIMPLE IN-MEMORY CACHE
// ============================================================================

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

function setCache<T>(key: string, data: T): void {
  // Limit cache size
  if (cache.size > 100) {
    // Remove oldest entries
    const keys = Array.from(cache.keys()).slice(0, 20);
    keys.forEach(k => cache.delete(k));
  }

  cache.set(key, {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

// ============================================================================
// GET HANDLER
// ============================================================================

/**
 * GET /api/sec/filings
 *
 * Fetches filings from SEC EDGAR for a given CIK.
 *
 * Query parameters:
 * - cik: The CIK number of the company (required)
 * - page: Page number (default: 1)
 * - pageSize: Number of filings per page (default: 20, max: 100)
 * - formTypes: Comma-separated list of form types to filter by (optional)
 *
 * Special query parameter for single filing details:
 * - accessionNumber: The accession number of a specific filing
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    // Check if this is a request for a specific filing
    if (queryParams['accessionNumber']) {
      return handleGetFilingDetails(queryParams);
    }

    // Validate query params for listing filings
    let params: z.infer<typeof GetFilingsQuerySchema>;
    try {
      params = GetFilingsQuerySchema.parse(queryParams);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: 'Invalid query parameters',
            code: 'VALIDATION_ERROR',
            details: error.errors,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { cik, page, pageSize, formTypes } = params;
    const formTypesArray = formTypes ? formTypes.split(',').map(t => t.trim()) : undefined;

    // Check cache
    const cacheKey = `filings:${cik}:${page}:${pageSize}:${formTypes || 'all'}`;
    const cachedResult = getCached(cacheKey);
    if (cachedResult) {
      return NextResponse.json({
        ...cachedResult,
        cached: true,
      });
    }

    // Fetch from SEC EDGAR
    const result = await fetchCompanyFilings(cik, {
      page,
      pageSize,
      formTypes: formTypesArray,
    });

    // Cache the result
    setCache(cacheKey, result);

    return NextResponse.json({
      filings: result.filings,
      totalFilings: result.totalFilings,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: Math.ceil(result.totalFilings / result.pageSize),
      companyInfo: result.companyInfo,
      cached: false,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Handle request for specific filing details
 */
async function handleGetFilingDetails(queryParams: Record<string, string>) {
  let params: z.infer<typeof GetFilingDetailsQuerySchema>;
  try {
    params = GetFilingDetailsQuerySchema.parse(queryParams);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    throw error;
  }

  const { cik, accessionNumber } = params;

  // Check cache
  const cacheKey = `filing:${cik}:${accessionNumber}`;
  const cachedResult = getCached(cacheKey);
  if (cachedResult) {
    return NextResponse.json({
      filing: cachedResult,
      cached: true,
    });
  }

  // Fetch from SEC EDGAR
  const filing = await fetchFilingDetails(cik, accessionNumber);

  if (!filing) {
    return NextResponse.json(
      {
        error: 'Filing not found',
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  // Cache the result
  setCache(cacheKey, filing);

  return NextResponse.json({
    filing,
    cached: false,
  });
}

/**
 * Handle errors and return appropriate responses
 */
function handleError(error: unknown) {
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'NOT_FOUND',
      },
      { status: 404 }
    );
  }

  if (error instanceof RateLimitError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429, headers: { 'Retry-After': '1' } }
    );
  }

  if (error instanceof SecEdgarError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode || 500 }
    );
  }

  logger.error('SEC filings API error:', error);
  return NextResponse.json(
    {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
