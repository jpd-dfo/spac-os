// ============================================================================
// SPAC OS AI Deal Scoring API Endpoint
// ============================================================================

import { type NextRequest, NextResponse } from 'next/server';

import { getClaudeClient } from '@/lib/ai/claude';
import {
  scoreDeal,
  generateInvestmentThesis,
  analyzeRisksAndOpportunities,
  compareToDeSpacs,
  recommendNextSteps,
  scoreCategoryDetail,
  type TargetInfo,
  type DealScoringOptions,
  type DealScore,
  type DealScoreBreakdown,
} from '@/lib/ai/deal-scorer';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

interface ScoreRequest {
  target: TargetInfo;
  options?: DealScoringOptions;
  operation?: 'score' | 'thesis' | 'risks' | 'compare' | 'next-steps' | 'category';
  categoryName?: keyof DealScoreBreakdown;
  existingScore?: DealScore;
}

// ============================================================================
// POST Handler - Deal Scoring
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ScoreRequest = await request.json();
    const { target, options, operation = 'score', categoryName, existingScore } = body;

    // Validate request
    if (!target?.name) {
      return NextResponse.json(
        { error: 'Target company name is required' },
        { status: 400 }
      );
    }

    if (!target?.industry) {
      return NextResponse.json(
        { error: 'Target industry is required' },
        { status: 400 }
      );
    }

    if (!target?.description) {
      return NextResponse.json(
        { error: 'Target description is required' },
        { status: 400 }
      );
    }

    const client = getClaudeClient();

    if (!client.checkConfigured()) {
      return NextResponse.json(
        {
          error: 'AI service not configured',
          message: 'Please configure the ANTHROPIC_API_KEY environment variable.',
        },
        { status: 503 }
      );
    }

    // Handle different operation types
    let result;

    switch (operation) {
      case 'thesis':
        result = await generateInvestmentThesis(target, existingScore);
        break;

      case 'risks':
        result = await analyzeRisksAndOpportunities(target);
        break;

      case 'compare':
        result = await compareToDeSpacs(target);
        break;

      case 'next-steps':
        if (!existingScore) {
          return NextResponse.json(
            { error: 'Existing deal score is required for next-steps operation' },
            { status: 400 }
          );
        }
        result = await recommendNextSteps(target, existingScore);
        break;

      case 'category':
        if (!categoryName) {
          return NextResponse.json(
            { error: 'Category name is required for category scoring' },
            { status: 400 }
          );
        }
        result = await scoreCategoryDetail(target, categoryName);
        break;

      case 'score':
      default:
        result = await scoreDeal(target, options);
        break;
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || 'Scoring failed',
          code: result.error?.code,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });
  } catch (error) {
    logger.error('Deal scoring error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET Handler - Check service status
// ============================================================================

export async function GET() {
  const client = getClaudeClient();

  return NextResponse.json({
    status: 'ok',
    service: 'deal-scoring',
    configured: client.checkConfigured(),
    supportedOperations: ['score', 'thesis', 'risks', 'compare', 'next-steps', 'category'],
    categories: ['management', 'market', 'financial', 'operational', 'transaction'],
    rateLimitStatus: client.getRateLimitStatus(),
  });
}
