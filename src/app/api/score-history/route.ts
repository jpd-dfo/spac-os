/**
 * SPAC OS - Score History API Endpoint
 * API routes for managing AI deal score history
 */

import { type NextRequest, NextResponse } from 'next/server';

import {
  saveScoreHistory,
  getScoreHistory,
  getScoreTrend,
  type ScoreData,
} from '@/lib/services/scoreHistory';
import { logger } from '@/lib/logger';

// ============================================================================
// GET Handler - Fetch Score History
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetId = searchParams.get('targetId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 10;

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      );
    }

    const [history, trend] = await Promise.all([
      getScoreHistory(targetId, limit),
      getScoreTrend(targetId),
    ]);

    return NextResponse.json({
      success: true,
      history,
      trend,
    });
  } catch (error) {
    logger.error('Failed to fetch score history:', error);

    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        history: [],
        trend: {
          trend: 'new',
          changePercent: 0,
          previousScore: null,
          currentScore: 0,
          scoreCount: 0,
          averageScore: 0,
        },
        message: 'ScoreHistory table not yet available',
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch score history' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST Handler - Save Score to History
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId, scoreData } = body as {
      targetId: string;
      scoreData: ScoreData;
    };

    if (!targetId) {
      return NextResponse.json(
        { error: 'Target ID is required' },
        { status: 400 }
      );
    }

    if (!scoreData || typeof scoreData.overallScore !== 'number') {
      return NextResponse.json(
        { error: 'Valid score data is required' },
        { status: 400 }
      );
    }

    const entry = await saveScoreHistory(targetId, scoreData);

    if (!entry) {
      // ScoreHistory table doesn't exist yet
      return NextResponse.json({
        success: true,
        entry: null,
        message: 'ScoreHistory table not yet available, score not saved',
      });
    }

    return NextResponse.json({
      success: true,
      entry,
    });
  } catch (error) {
    logger.error('Failed to save score history:', error);

    // Handle case where ScoreHistory model doesn't exist yet
    if (error instanceof Error && error.message.includes('does not exist')) {
      return NextResponse.json({
        success: true,
        entry: null,
        message: 'ScoreHistory table not yet available',
      });
    }

    return NextResponse.json(
      { error: 'Failed to save score history' },
      { status: 500 }
    );
  }
}
