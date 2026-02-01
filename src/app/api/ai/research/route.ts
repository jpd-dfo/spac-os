// ============================================================================
// SPAC OS AI Research Agent API Endpoint
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  researchCompany,
  analyzeMarket,
  analyzeCompetitors,
  analyzeNewsContext,
  generateResearchMemo,
  analyzeManagementTeam,
  researchIndustryTrends,
  type ResearchOptions,
} from '@/lib/ai/research-agent';
import { getClaudeClient } from '@/lib/ai/claude';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

interface ResearchRequest {
  operation:
    | 'company'
    | 'market'
    | 'competitors'
    | 'news'
    | 'memo'
    | 'management'
    | 'trends';
  params: {
    // Common
    companyName?: string;
    industry?: string;

    // Company research
    researchOptions?: ResearchOptions;

    // Market analysis
    geography?: string;
    timeHorizon?: string;
    includeRegulations?: boolean;

    // Competitors
    includeIndirect?: boolean;
    maxCompetitors?: number;

    // News
    newsTimeframe?: string;
    newsCategories?: string[];

    // Memo
    memoPurpose?: 'initial_screening' | 'deep_dive' | 'board_presentation';
    memoContext?: string;

    // Management
    knownTeamMembers?: Array<{ name: string; title: string }>;

    // Trends
    trendsHorizon?: '1-year' | '3-year' | '5-year';
  };
}

// ============================================================================
// POST Handler - Research Operations
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const body: ResearchRequest = await request.json();
    const { operation, params } = body;

    // Validate request
    if (!operation) {
      return NextResponse.json(
        { error: 'Operation is required' },
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
      case 'company':
        if (!params.companyName) {
          return NextResponse.json(
            { error: 'Company name is required for company research' },
            { status: 400 }
          );
        }
        result = await researchCompany(params.companyName, params.researchOptions);
        break;

      case 'market':
        if (!params.industry) {
          return NextResponse.json(
            { error: 'Industry is required for market analysis' },
            { status: 400 }
          );
        }
        result = await analyzeMarket(params.industry, {
          geography: params.geography,
          timeHorizon: params.timeHorizon,
          includeRegulations: params.includeRegulations,
        });
        break;

      case 'competitors':
        if (!params.companyName || !params.industry) {
          return NextResponse.json(
            { error: 'Company name and industry are required for competitor analysis' },
            { status: 400 }
          );
        }
        result = await analyzeCompetitors(params.companyName, params.industry, {
          includeIndirect: params.includeIndirect,
          maxCompetitors: params.maxCompetitors,
        });
        break;

      case 'news':
        if (!params.companyName) {
          return NextResponse.json(
            { error: 'Company name is required for news analysis' },
            { status: 400 }
          );
        }
        result = await analyzeNewsContext(params.companyName, {
          timeframe: params.newsTimeframe,
          categories: params.newsCategories,
        });
        break;

      case 'memo':
        if (!params.companyName) {
          return NextResponse.json(
            { error: 'Company name is required for research memo' },
            { status: 400 }
          );
        }
        result = await generateResearchMemo(
          params.companyName,
          params.memoPurpose || 'initial_screening',
          params.memoContext
        );
        break;

      case 'management':
        if (!params.companyName) {
          return NextResponse.json(
            { error: 'Company name is required for management analysis' },
            { status: 400 }
          );
        }
        result = await analyzeManagementTeam(params.companyName, params.knownTeamMembers);
        break;

      case 'trends':
        if (!params.industry) {
          return NextResponse.json(
            { error: 'Industry is required for trends research' },
            { status: 400 }
          );
        }
        result = await researchIndustryTrends(params.industry, {
          timeHorizon: params.trendsHorizon,
          geography: params.geography,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error?.message || 'Research failed',
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
    logger.error('Research agent error:', error);

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
    service: 'research-agent',
    configured: client.checkConfigured(),
    supportedOperations: [
      'company',
      'market',
      'competitors',
      'news',
      'memo',
      'management',
      'trends',
    ],
    rateLimitStatus: client.getRateLimitStatus(),
  });
}
