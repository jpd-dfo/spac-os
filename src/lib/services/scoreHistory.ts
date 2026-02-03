/**
 * SPAC OS - Score History Service
 * Service functions for managing AI deal score history
 */

import { db } from '@/server/db';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface ScoreHistoryEntry {
  id: string;
  targetId: string;
  overallScore: number;
  managementScore: number | null;
  marketScore: number | null;
  financialScore: number | null;
  operationalScore: number | null;
  transactionScore: number | null;
  thesis: string | null;
  createdAt: Date;
}

export interface ScoreData {
  overallScore: number;
  managementScore?: number;
  marketScore?: number;
  financialScore?: number;
  operationalScore?: number;
  transactionScore?: number;
  thesis?: string;
}

export type ScoreTrend = 'improving' | 'declining' | 'stable' | 'new';

export interface ScoreTrendData {
  trend: ScoreTrend;
  changePercent: number;
  previousScore: number | null;
  currentScore: number;
  scoreCount: number;
  averageScore: number;
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Save a new score history entry for a target
 */
export async function saveScoreHistory(
  targetId: string,
  scoreData: ScoreData
): Promise<ScoreHistoryEntry | null> {
  try {
    const entry = await db.scoreHistory.create({
      data: {
        targetId,
        overallScore: Math.round(scoreData.overallScore),
        managementScore: scoreData.managementScore ? Math.round(scoreData.managementScore * 10) : null,
        marketScore: scoreData.marketScore ? Math.round(scoreData.marketScore * 10) : null,
        financialScore: scoreData.financialScore ? Math.round(scoreData.financialScore * 10) : null,
        operationalScore: scoreData.operationalScore ? Math.round(scoreData.operationalScore * 10) : null,
        transactionScore: scoreData.transactionScore ? Math.round(scoreData.transactionScore * 10) : null,
        thesis: scoreData.thesis || null,
      },
    });

    logger.info('Score history saved', { targetId, scoreId: entry.id });
    return entry;
  } catch (error) {
    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      logger.warn('ScoreHistory table does not exist yet, skipping save');
      return null;
    }
    logger.error('Failed to save score history', { targetId, error });
    throw error;
  }
}

/**
 * Get score history for a target
 */
export async function getScoreHistory(
  targetId: string,
  limit: number = 10
): Promise<ScoreHistoryEntry[]> {
  try {
    const entries = await db.scoreHistory.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return entries;
  } catch (error) {
    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      logger.warn('ScoreHistory table does not exist yet');
      return [];
    }
    logger.error('Failed to get score history', { targetId, error });
    throw error;
  }
}

/**
 * Calculate score trend for a target
 */
export async function getScoreTrend(targetId: string): Promise<ScoreTrendData> {
  try {
    const entries = await db.scoreHistory.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (entries.length === 0) {
      return {
        trend: 'new',
        changePercent: 0,
        previousScore: null,
        currentScore: 0,
        scoreCount: 0,
        averageScore: 0,
      };
    }

    const firstEntry = entries[0];
    const secondEntry = entries[1];
    const currentScore = firstEntry?.overallScore ?? 0;
    const previousScore = entries.length > 1 && secondEntry ? secondEntry.overallScore : null;
    const averageScore = entries.reduce((sum, e) => sum + e.overallScore, 0) / entries.length;

    let trend: ScoreTrend = 'new';
    let changePercent = 0;

    if (previousScore !== null) {
      const diff = currentScore - previousScore;
      changePercent = previousScore > 0 ? (diff / previousScore) * 100 : 0;

      if (Math.abs(changePercent) < 5) {
        trend = 'stable';
      } else if (changePercent > 0) {
        trend = 'improving';
      } else {
        trend = 'declining';
      }
    }

    return {
      trend,
      changePercent: Math.round(changePercent * 10) / 10,
      previousScore,
      currentScore,
      scoreCount: entries.length,
      averageScore: Math.round(averageScore * 10) / 10,
    };
  } catch (error) {
    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      logger.warn('ScoreHistory table does not exist yet');
      return {
        trend: 'new',
        changePercent: 0,
        previousScore: null,
        currentScore: 0,
        scoreCount: 0,
        averageScore: 0,
      };
    }
    logger.error('Failed to get score trend', { targetId, error });
    throw error;
  }
}

/**
 * Delete old score history entries (keep last N entries)
 */
export async function pruneScoreHistory(
  targetId: string,
  keepCount: number = 20
): Promise<number> {
  try {
    // Get IDs of entries to keep
    const entriesToKeep = await db.scoreHistory.findMany({
      where: { targetId },
      orderBy: { createdAt: 'desc' },
      take: keepCount,
      select: { id: true },
    });

    const keepIds = entriesToKeep.map((e) => e.id);

    // Delete entries not in the keep list
    const result = await db.scoreHistory.deleteMany({
      where: {
        targetId,
        id: { notIn: keepIds },
      },
    });

    if (result.count > 0) {
      logger.info('Pruned score history entries', { targetId, deletedCount: result.count });
    }

    return result.count;
  } catch (error) {
    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      logger.warn('ScoreHistory table does not exist yet');
      return 0;
    }
    logger.error('Failed to prune score history', { targetId, error });
    throw error;
  }
}

/**
 * Get score comparison between two dates
 */
export async function getScoreComparison(
  targetId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  startScore: ScoreHistoryEntry | null;
  endScore: ScoreHistoryEntry | null;
  change: number;
  percentChange: number;
}> {
  try {
    const [startEntry, endEntry] = await Promise.all([
      db.scoreHistory.findFirst({
        where: {
          targetId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
      }),
      db.scoreHistory.findFirst({
        where: {
          targetId,
          createdAt: { lte: endDate },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const startScore = startEntry?.overallScore ?? 0;
    const endScore = endEntry?.overallScore ?? 0;
    const change = endScore - startScore;
    const percentChange = startScore > 0 ? (change / startScore) * 100 : 0;

    return {
      startScore: startEntry,
      endScore: endEntry,
      change,
      percentChange: Math.round(percentChange * 10) / 10,
    };
  } catch (error) {
    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      logger.warn('ScoreHistory table does not exist yet');
      return {
        startScore: null,
        endScore: null,
        change: 0,
        percentChange: 0,
      };
    }
    logger.error('Failed to get score comparison', { targetId, error });
    throw error;
  }
}
