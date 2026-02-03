/**
 * SPAC OS - Analysis Cache Module
 * Provides caching functionality for AI document analysis results
 *
 * This module handles storing, retrieving, and invalidating cached analysis
 * results in the database using the DocumentAnalysis model.
 */

import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

/**
 * Analysis data structure for caching
 * Matches the format returned by the AI analysis API
 */
export interface AnalysisData {
  summary: string;
  keyTerms: {
    term: string;
    definition: string;
    importance: 'high' | 'medium' | 'low';
  }[];
  riskFlags: {
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    page?: number;
  }[];
  relatedDocuments: {
    id: string;
    name: string;
    relevance: number;
    type: string;
  }[];
  actionItems: {
    task: string;
    priority: 'high' | 'medium' | 'low';
    assignee?: string;
    dueDate?: Date;
  }[];
  insights: {
    type: string;
    content: string;
  }[];
  financialHighlights?: {
    metric: string;
    value: string;
    change?: string;
  }[];
}

/**
 * Cached analysis result from database
 */
export interface CachedAnalysis {
  id: string;
  documentId: string;
  summary: string | null;
  keyTerms: AnalysisData['keyTerms'] | null;
  riskFlags: AnalysisData['riskFlags'] | null;
  actionItems: AnalysisData['actionItems'] | null;
  insights: AnalysisData['insights'] | null;
  financialHighlights: AnalysisData['financialHighlights'] | null;
  riskLevel: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

// ============================================================================
// Constants
// ============================================================================

/** Cache duration in hours */
const CACHE_DURATION_HOURS = 24;

/** Calculate expiration date from now */
function getExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);
  return expiresAt;
}

// ============================================================================
// Cache Functions
// ============================================================================

/**
 * Retrieves cached analysis for a document
 *
 * @param documentId - The document ID to retrieve cached analysis for
 * @returns The cached analysis data or null if not found/expired
 */
export async function getCachedAnalysis(documentId: string): Promise<CachedAnalysis | null> {
  try {
    // Attempt to fetch the most recent analysis for the document
    const cachedAnalysis = await db.documentAnalysis.findFirst({
      where: {
        documentId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!cachedAnalysis) {
      logger.info(`No cached analysis found for document: ${documentId}`);
      return null;
    }

    // Transform the Prisma result to our CachedAnalysis type
    return {
      id: cachedAnalysis.id,
      documentId: cachedAnalysis.documentId,
      summary: cachedAnalysis.summary,
      keyTerms: cachedAnalysis.keyTerms as CachedAnalysis['keyTerms'],
      riskFlags: cachedAnalysis.riskFlags as CachedAnalysis['riskFlags'],
      actionItems: cachedAnalysis.actionItems as CachedAnalysis['actionItems'],
      insights: cachedAnalysis.insights as CachedAnalysis['insights'],
      financialHighlights: cachedAnalysis.financialHighlights as CachedAnalysis['financialHighlights'],
      riskLevel: cachedAnalysis.riskLevel,
      createdAt: cachedAnalysis.createdAt,
      updatedAt: cachedAnalysis.updatedAt,
      expiresAt: cachedAnalysis.expiresAt,
    };
  } catch (error) {
    // Handle case where DocumentAnalysis model doesn't exist yet
    // (migration hasn't run)
    if (isModelNotFoundError(error)) {
      logger.warn('DocumentAnalysis model not found - cache not available. Run migrations.');
      return null;
    }

    logger.error('Error retrieving cached analysis:', error);
    return null;
  }
}

/**
 * Stores analysis results in the cache
 *
 * @param documentId - The document ID to cache analysis for
 * @param analysis - The analysis data to cache
 * @returns The created/updated cache entry or null on error
 */
export async function cacheAnalysis(
  documentId: string,
  analysis: AnalysisData
): Promise<CachedAnalysis | null> {
  try {
    // Calculate overall risk level from risk flags
    const riskLevel = calculateRiskLevel(analysis.riskFlags);
    const expiresAt = getExpirationDate();

    // Upsert: Update existing or create new
    // First, try to find existing analysis
    const existing = await db.documentAnalysis.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    let savedAnalysis;

    // Helper to convert undefined/null to Prisma.JsonNull for Json fields
    const toJsonValue = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
      if (value === null || value === undefined) {
        return Prisma.JsonNull;
      }
      return value as Prisma.InputJsonValue;
    };

    if (existing) {
      // Update existing analysis
      savedAnalysis = await db.documentAnalysis.update({
        where: { id: existing.id },
        data: {
          summary: analysis.summary || null,
          keyTerms: toJsonValue(analysis.keyTerms),
          riskFlags: toJsonValue(analysis.riskFlags),
          actionItems: toJsonValue(analysis.actionItems),
          insights: toJsonValue(analysis.insights),
          financialHighlights: toJsonValue(analysis.financialHighlights),
          riskLevel,
          expiresAt,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new analysis
      savedAnalysis = await db.documentAnalysis.create({
        data: {
          documentId,
          summary: analysis.summary || null,
          keyTerms: toJsonValue(analysis.keyTerms),
          riskFlags: toJsonValue(analysis.riskFlags),
          actionItems: toJsonValue(analysis.actionItems),
          insights: toJsonValue(analysis.insights),
          financialHighlights: toJsonValue(analysis.financialHighlights),
          riskLevel,
          expiresAt,
        },
      });
    }

    logger.info(`Cached analysis for document: ${documentId}`);

    return {
      id: savedAnalysis.id,
      documentId: savedAnalysis.documentId,
      summary: savedAnalysis.summary,
      keyTerms: savedAnalysis.keyTerms as CachedAnalysis['keyTerms'],
      riskFlags: savedAnalysis.riskFlags as CachedAnalysis['riskFlags'],
      actionItems: savedAnalysis.actionItems as CachedAnalysis['actionItems'],
      insights: savedAnalysis.insights as CachedAnalysis['insights'],
      financialHighlights: savedAnalysis.financialHighlights as CachedAnalysis['financialHighlights'],
      riskLevel: savedAnalysis.riskLevel,
      createdAt: savedAnalysis.createdAt,
      updatedAt: savedAnalysis.updatedAt,
      expiresAt: savedAnalysis.expiresAt,
    };
  } catch (error) {
    // Handle case where DocumentAnalysis model doesn't exist yet
    if (isModelNotFoundError(error)) {
      logger.warn('DocumentAnalysis model not found - cannot cache. Run migrations.');
      return null;
    }

    logger.error('Error caching analysis:', error);
    return null;
  }
}

/**
 * Invalidates (deletes) cached analysis for a document
 * Call this when a document is updated to ensure fresh analysis on next request
 *
 * @param documentId - The document ID to invalidate cache for
 * @returns true if invalidation was successful, false otherwise
 */
export async function invalidateAnalysis(documentId: string): Promise<boolean> {
  try {
    // Delete all cached analyses for this document
    const result = await db.documentAnalysis.deleteMany({
      where: { documentId },
    });

    if (result.count > 0) {
      logger.info(`Invalidated ${result.count} cached analysis entries for document: ${documentId}`);
    }

    return true;
  } catch (error) {
    // Handle case where DocumentAnalysis model doesn't exist yet
    if (isModelNotFoundError(error)) {
      logger.warn('DocumentAnalysis model not found - cannot invalidate. Run migrations.');
      return true; // Return true since there's nothing to invalidate
    }

    logger.error('Error invalidating cached analysis:', error);
    return false;
  }
}

/**
 * Checks if a cached analysis is still fresh (within the cache duration)
 *
 * @param analysis - The cached analysis to check
 * @returns true if the analysis is fresh, false if it has expired
 */
export function isAnalysisFresh(analysis: CachedAnalysis | null): boolean {
  if (!analysis) {
    return false;
  }

  const now = new Date();

  // If expiresAt is set, use it
  if (analysis.expiresAt) {
    return now < analysis.expiresAt;
  }

  // Fallback: check if created within the cache duration
  const cacheAge = now.getTime() - analysis.createdAt.getTime();
  const maxAge = CACHE_DURATION_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

  return cacheAge < maxAge;
}

/**
 * Retrieves fresh cached analysis for a document
 * Convenience function that combines getCachedAnalysis and isAnalysisFresh
 *
 * @param documentId - The document ID to retrieve fresh cached analysis for
 * @returns The cached analysis if fresh, null otherwise
 */
export async function getFreshCachedAnalysis(documentId: string): Promise<CachedAnalysis | null> {
  const cached = await getCachedAnalysis(documentId);

  if (cached && isAnalysisFresh(cached)) {
    return cached;
  }

  return null;
}

/**
 * Converts cached analysis back to AnalysisData format for use in the UI
 *
 * @param cached - The cached analysis from database
 * @returns The analysis data in the format expected by the UI
 */
export function cachedToAnalysisData(cached: CachedAnalysis): AnalysisData {
  return {
    summary: cached.summary || '',
    keyTerms: cached.keyTerms || [],
    riskFlags: cached.riskFlags || [],
    relatedDocuments: [], // Not stored in cache, would need separate lookup
    actionItems: cached.actionItems || [],
    insights: cached.insights || [],
    financialHighlights: cached.financialHighlights || undefined,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate the overall risk level based on risk flags
 */
function calculateRiskLevel(
  riskFlags: AnalysisData['riskFlags'] | null | undefined
): string {
  if (!riskFlags || riskFlags.length === 0) {
    return 'none';
  }

  const hasHigh = riskFlags.some((r) => r.severity === 'high');
  const hasMedium = riskFlags.some((r) => r.severity === 'medium');

  if (hasHigh) {
    return 'high';
  }
  if (hasMedium) {
    return 'medium';
  }
  return 'low';
}

/**
 * Check if an error is due to the model not existing in the database
 */
function isModelNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('table') ||
      message.includes('documentanalysis') ||
      message.includes('p2021') || // Prisma error code for table not found
      message.includes('p2025')    // Prisma error code for record not found
    );
  }
  return false;
}
