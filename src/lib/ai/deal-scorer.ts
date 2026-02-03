// ============================================================================
// SPAC OS Deal Scorer - AI-Powered Deal Evaluation and Scoring
// ============================================================================

import { getClaudeClient } from './claude';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';

import type { AIResponse, AIResponseMetadata, AIError } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Category score with justification
 */
export interface CategoryScore {
  score: number; // 1-10
  justification: string;
  strengths?: string[];
  weaknesses?: string[];
  confidence: number; // 0-1
}

/**
 * Deal score breakdown by category
 */
export interface DealScoreBreakdown {
  management: CategoryScore;
  market: CategoryScore;
  financial: CategoryScore;
  operational: CategoryScore;
  transaction: CategoryScore;
}

/**
 * De-SPAC comparison data
 */
export interface DeSpacComparison {
  similarDeals: Array<{
    name: string;
    ticker?: string;
    industry: string;
    outcome: 'successful' | 'challenged' | 'failed';
    similarity: number;
    keyMetrics?: Record<string, string | number>;
  }>;
  averagePerformance: string;
  outlook: string;
  bestPractices: string[];
}

/**
 * Complete deal score result
 */
export interface DealScore {
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  categoryScores: DealScoreBreakdown;
  investmentThesis: string;
  keyStrengths: string[];
  keyRisks: string[];
  opportunities: string[];
  deSpacComparison: DeSpacComparison;
  recommendation: 'proceed' | 'negotiate' | 'pass' | 'more_diligence';
  recommendationRationale: string;
  nextSteps: string[];
  confidenceLevel: number;
  scoredAt: Date;
}

/**
 * Target company information for scoring
 */
export interface TargetInfo {
  name: string;
  industry: string;
  sector?: string;
  description: string;
  founded?: number;
  headquarters?: string;
  employees?: number;
  website?: string;

  // Financial metrics
  revenue?: number;
  revenueGrowth?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  netIncome?: number;
  grossMargin?: number;
  cashOnHand?: number;
  totalDebt?: number;

  // Valuation
  enterpriseValue?: number;
  equityValue?: number;
  evRevenue?: number;
  evEbitda?: number;

  // Management
  managementTeam?: Array<{
    name: string;
    title: string;
    background?: string;
  }>;

  // Market
  tam?: number;
  sam?: number;
  marketGrowth?: number;
  competitors?: string[];

  // Additional context
  keyCustomers?: string[];
  keyProducts?: string[];
  investmentHighlights?: string[];
  knownRisks?: string[];
  additionalContext?: string;
}

/**
 * Scoring criteria weights
 */
export interface ScoringWeights {
  management: number;
  market: number;
  financial: number;
  operational: number;
  transaction: number;
}

/**
 * Deal scoring options
 */
export interface DealScoringOptions {
  weights?: Partial<ScoringWeights>;
  includeComparisons?: boolean;
  focusCriteria?: string[];
  spacContext?: {
    trustSize: number;
    deadline: Date;
    targetSectors: string[];
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_WEIGHTS: ScoringWeights = {
  management: 0.25,
  market: 0.25,
  financial: 0.25,
  operational: 0.15,
  transaction: 0.10,
};

// ============================================================================
// Main Scoring Functions
// ============================================================================

/**
 * Score a target company for SPAC acquisition
 */
export async function scoreDeal(
  target: TargetInfo,
  options: DealScoringOptions = {}
): Promise<AIResponse<DealScore>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured. Please set ANTHROPIC_API_KEY.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const targetSummary = formatTargetInfo(target);
    const criteriaContext = options.focusCriteria?.length
      ? `\n\nFocus particularly on: ${options.focusCriteria.join(', ')}`
      : '';

    const spacContext = options.spacContext
      ? `\n\nSPAC Context: Trust size $${options.spacContext.trustSize}M, deadline ${options.spacContext.deadline.toISOString().split('T')[0]}, target sectors: ${options.spacContext.targetSectors.join(', ')}`
      : '';

    const prompt = USER_PROMPTS.scoreDeal(
      targetSummary + criteriaContext + spacContext,
      options.focusCriteria?.join('\n')
    );

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.dealScorer,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const rawScore = client.parseJSONResponse<Partial<DealScore>>(response.content);
    const normalizedScore = normalizeDealScore(rawScore, options.weights);

    return {
      success: true,
      data: normalizedScore,
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Generate detailed investment thesis
 */
export async function generateInvestmentThesis(
  target: TargetInfo,
  dealScore?: DealScore
): Promise<AIResponse<{
  thesis: string;
  summary: string;
  keyArguments: string[];
  potentialReturns: string;
  timeHorizon: string;
  exitStrategies: string[];
}>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const scoreContext = dealScore
      ? `\n\nCurrent Deal Score: ${dealScore.overallScore}/100 (${dealScore.grade})\nKey Strengths: ${dealScore.keyStrengths.join(', ')}\nKey Risks: ${dealScore.keyRisks.join(', ')}`
      : '';

    const prompt = `Generate a comprehensive investment thesis for the following SPAC target:

${formatTargetInfo(target)}${scoreContext}

Provide a detailed investment thesis including:
1. Core investment argument
2. Key value drivers
3. Potential return scenarios
4. Investment timeline
5. Exit strategies

Return as JSON:
{
  "thesis": "Detailed 2-3 paragraph investment thesis",
  "summary": "One-line summary",
  "keyArguments": ["Argument 1", "Argument 2", ...],
  "potentialReturns": "Expected return analysis",
  "timeHorizon": "Recommended investment period",
  "exitStrategies": ["Strategy 1", "Strategy 2", ...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.dealScorer,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const thesis = client.parseJSONResponse<{
      thesis: string;
      summary: string;
      keyArguments: string[];
      potentialReturns: string;
      timeHorizon: string;
      exitStrategies: string[];
    }>(response.content);

    return {
      success: true,
      data: {
        thesis: thesis.thesis || '',
        summary: thesis.summary || '',
        keyArguments: thesis.keyArguments || [],
        potentialReturns: thesis.potentialReturns || '',
        timeHorizon: thesis.timeHorizon || '',
        exitStrategies: thesis.exitStrategies || [],
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Identify risks and opportunities
 */
export async function analyzeRisksAndOpportunities(
  target: TargetInfo
): Promise<AIResponse<{
  risks: Array<{
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    mitigation: string;
    probability: number;
  }>;
  opportunities: Array<{
    category: string;
    description: string;
    potential: 'low' | 'medium' | 'high';
    timeframe: string;
    requirements: string[];
  }>;
  riskScore: number;
  opportunityScore: number;
}>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const prompt = `Analyze the following target company for investment risks and opportunities:

${formatTargetInfo(target)}

Identify:
1. Key risks by category (market, financial, operational, regulatory, integration)
2. Growth opportunities and value creation levers
3. Risk mitigation strategies
4. Probability and impact assessments

Return as JSON:
{
  "risks": [
    {
      "category": "...",
      "description": "...",
      "severity": "low|medium|high|critical",
      "mitigation": "...",
      "probability": 0.0-1.0
    }
  ],
  "opportunities": [
    {
      "category": "...",
      "description": "...",
      "potential": "low|medium|high",
      "timeframe": "...",
      "requirements": ["..."]
    }
  ],
  "riskScore": 0-100,
  "opportunityScore": 0-100
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.dealScorer,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const analysis = client.parseJSONResponse<{
      risks: any[];
      opportunities: any[];
      riskScore: number;
      opportunityScore: number;
    }>(response.content);

    return {
      success: true,
      data: {
        risks: normalizeRisks(analysis.risks || []),
        opportunities: normalizeOpportunities(analysis.opportunities || []),
        riskScore: analysis.riskScore || 50,
        opportunityScore: analysis.opportunityScore || 50,
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Compare to successful de-SPAC transactions
 */
export async function compareToDeSpacs(
  target: TargetInfo
): Promise<AIResponse<DeSpacComparison>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const prompt = `Compare the following target company to historical de-SPAC transactions in similar industries:

${formatTargetInfo(target)}

Identify:
1. Similar completed de-SPAC transactions
2. How this target compares on key metrics
3. Lessons from successful vs. challenged de-SPACs
4. Expected performance outlook

Return as JSON:
{
  "similarDeals": [
    {
      "name": "Company Name",
      "ticker": "TICK",
      "industry": "...",
      "outcome": "successful|challenged|failed",
      "similarity": 0.0-1.0,
      "keyMetrics": {"metric": "value"}
    }
  ],
  "averagePerformance": "How similar deals performed post-de-SPAC",
  "outlook": "Expected outlook for this target",
  "bestPractices": ["Learning 1", "Learning 2", ...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.dealScorer,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const comparison = client.parseJSONResponse<DeSpacComparison>(response.content);

    return {
      success: true,
      data: {
        similarDeals: comparison.similarDeals || [],
        averagePerformance: comparison.averagePerformance || '',
        outlook: comparison.outlook || '',
        bestPractices: comparison.bestPractices || [],
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Recommend next steps based on deal score
 */
export async function recommendNextSteps(
  target: TargetInfo,
  dealScore: DealScore
): Promise<AIResponse<{
  immediateActions: string[];
  dueDiligenceItems: string[];
  negotiationPoints: string[];
  timeline: string;
  keyMilestones: Array<{ milestone: string; targetDate: string }>;
}>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const prompt = `Based on the following deal score and target information, recommend next steps:

Target: ${target.name}
Industry: ${target.industry}

Deal Score: ${dealScore.overallScore}/100 (${dealScore.grade})
Recommendation: ${dealScore.recommendation}
Key Strengths: ${dealScore.keyStrengths.join(', ')}
Key Risks: ${dealScore.keyRisks.join(', ')}

Provide:
1. Immediate action items
2. Priority due diligence areas
3. Key negotiation points
4. Recommended timeline
5. Key milestones

Return as JSON:
{
  "immediateActions": ["Action 1", "Action 2", ...],
  "dueDiligenceItems": ["DD Item 1", "DD Item 2", ...],
  "negotiationPoints": ["Point 1", "Point 2", ...],
  "timeline": "Recommended timeline",
  "keyMilestones": [
    {"milestone": "...", "targetDate": "..."}
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.dealScorer,
      maxTokens: AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const recommendations = client.parseJSONResponse<{
      immediateActions: string[];
      dueDiligenceItems: string[];
      negotiationPoints: string[];
      timeline: string;
      keyMilestones: Array<{ milestone: string; targetDate: string }>;
    }>(response.content);

    return {
      success: true,
      data: {
        immediateActions: recommendations.immediateActions || [],
        dueDiligenceItems: recommendations.dueDiligenceItems || [],
        negotiationPoints: recommendations.negotiationPoints || [],
        timeline: recommendations.timeline || '',
        keyMilestones: recommendations.keyMilestones || [],
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Score specific category
 */
export async function scoreCategoryDetail(
  target: TargetInfo,
  category: keyof DealScoreBreakdown
): Promise<AIResponse<CategoryScore & { details: Record<string, any> }>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  const categoryPrompts: Record<keyof DealScoreBreakdown, string> = {
    management: `Evaluate the management team quality, experience, and track record.
Consider: Leadership experience, industry expertise, execution history, team depth, governance.`,
    market: `Evaluate the market opportunity and competitive position.
Consider: TAM/SAM, growth rates, market dynamics, competitive moats, customer concentration.`,
    financial: `Evaluate the financial health and performance.
Consider: Revenue quality, profitability, cash flow, balance sheet, growth trajectory.`,
    operational: `Evaluate the operational capabilities and scalability.
Consider: Technology infrastructure, supply chain, processes, scalability, integration readiness.`,
    transaction: `Evaluate the transaction structure and timing.
Consider: Valuation, deal structure, timeline, PIPE/financing, sponsor alignment.`,
  };

  try {
    const prompt = `Provide a detailed scoring for the ${category.toUpperCase()} category:

${formatTargetInfo(target)}

${categoryPrompts[category]}

Return as JSON:
{
  "score": 1-10,
  "justification": "Detailed justification",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "confidence": 0.0-1.0,
  "details": {
    "subFactors": [
      {"factor": "...", "score": 1-10, "notes": "..."}
    ],
    "benchmarkComparison": "...",
    "improvements": ["..."]
  }
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.dealScorer,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const score = client.parseJSONResponse<CategoryScore & { details: Record<string, any> }>(
      response.content
    );

    return {
      success: true,
      data: {
        score: Math.min(10, Math.max(1, score.score || 5)),
        justification: score.justification || '',
        strengths: score.strengths || [],
        weaknesses: score.weaknesses || [],
        confidence: Math.min(1, Math.max(0, score.confidence || 0.7)),
        details: score.details || {},
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format target info for prompts
 */
function formatTargetInfo(target: TargetInfo): string {
  const lines: string[] = [];

  lines.push(`**Company:** ${target.name}`);
  lines.push(`**Industry:** ${target.industry}${target.sector ? ` / ${target.sector}` : ''}`);
  lines.push(`**Description:** ${target.description}`);

  if (target.founded) {lines.push(`**Founded:** ${target.founded}`);}
  if (target.headquarters) {lines.push(`**Headquarters:** ${target.headquarters}`);}
  if (target.employees) {lines.push(`**Employees:** ${target.employees.toLocaleString()}`);}

  if (target.revenue || target.ebitda) {
    lines.push('\n**Financial Metrics:**');
    if (target.revenue) {lines.push(`- Revenue: $${(target.revenue / 1e6).toFixed(1)}M`);}
    if (target.revenueGrowth) {lines.push(`- Revenue Growth: ${target.revenueGrowth}%`);}
    if (target.ebitda) {lines.push(`- EBITDA: $${(target.ebitda / 1e6).toFixed(1)}M`);}
    if (target.ebitdaMargin) {lines.push(`- EBITDA Margin: ${target.ebitdaMargin}%`);}
    if (target.grossMargin) {lines.push(`- Gross Margin: ${target.grossMargin}%`);}
  }

  if (target.enterpriseValue || target.evRevenue) {
    lines.push('\n**Valuation:**');
    if (target.enterpriseValue) {lines.push(`- Enterprise Value: $${(target.enterpriseValue / 1e6).toFixed(1)}M`);}
    if (target.evRevenue) {lines.push(`- EV/Revenue: ${target.evRevenue.toFixed(1)}x`);}
    if (target.evEbitda) {lines.push(`- EV/EBITDA: ${target.evEbitda.toFixed(1)}x`);}
  }

  if (target.tam || target.marketGrowth) {
    lines.push('\n**Market:**');
    if (target.tam) {lines.push(`- TAM: $${(target.tam / 1e9).toFixed(1)}B`);}
    if (target.sam) {lines.push(`- SAM: $${(target.sam / 1e9).toFixed(1)}B`);}
    if (target.marketGrowth) {lines.push(`- Market Growth: ${target.marketGrowth}%`);}
  }

  if (target.managementTeam?.length) {
    lines.push('\n**Management Team:**');
    for (const member of target.managementTeam.slice(0, 5)) {
      lines.push(`- ${member.name}, ${member.title}${member.background ? `: ${member.background}` : ''}`);
    }
  }

  if (target.competitors?.length) {
    lines.push(`\n**Key Competitors:** ${target.competitors.join(', ')}`);
  }

  if (target.investmentHighlights?.length) {
    lines.push('\n**Investment Highlights:**');
    for (const highlight of target.investmentHighlights) {
      lines.push(`- ${highlight}`);
    }
  }

  if (target.knownRisks?.length) {
    lines.push('\n**Known Risks:**');
    for (const risk of target.knownRisks) {
      lines.push(`- ${risk}`);
    }
  }

  if (target.additionalContext) {
    lines.push(`\n**Additional Context:** ${target.additionalContext}`);
  }

  return lines.join('\n');
}

/**
 * Normalize deal score response
 */
function normalizeDealScore(
  raw: Partial<DealScore>,
  customWeights?: Partial<ScoringWeights>
): DealScore {
  const weights = { ...DEFAULT_WEIGHTS, ...customWeights };

  // Normalize category scores
  const categoryScores: DealScoreBreakdown = {
    management: normalizeCategoryScore(raw.categoryScores?.management),
    market: normalizeCategoryScore(raw.categoryScores?.market),
    financial: normalizeCategoryScore(raw.categoryScores?.financial),
    operational: normalizeCategoryScore(raw.categoryScores?.operational),
    transaction: normalizeCategoryScore(raw.categoryScores?.transaction),
  };

  // Calculate weighted overall score
  const overallScore = raw.overallScore ?? calculateOverallScore(categoryScores, weights);
  const grade = calculateGrade(overallScore);

  return {
    overallScore,
    grade,
    categoryScores,
    investmentThesis: raw.investmentThesis || '',
    keyStrengths: raw.keyStrengths || [],
    keyRisks: raw.keyRisks || [],
    opportunities: raw.opportunities || [],
    deSpacComparison: raw.deSpacComparison || {
      similarDeals: [],
      averagePerformance: '',
      outlook: '',
      bestPractices: [],
    },
    recommendation: normalizeRecommendation(raw.recommendation),
    recommendationRationale: raw.recommendationRationale || '',
    nextSteps: raw.nextSteps || [],
    confidenceLevel: raw.confidenceLevel ?? 0.7,
    scoredAt: new Date(),
  };
}

/**
 * Normalize category score
 */
function normalizeCategoryScore(score?: Partial<CategoryScore>): CategoryScore {
  return {
    score: Math.min(10, Math.max(1, score?.score || 5)),
    justification: score?.justification || '',
    strengths: score?.strengths || [],
    weaknesses: score?.weaknesses || [],
    confidence: Math.min(1, Math.max(0, score?.confidence || 0.7)),
  };
}

/**
 * Calculate overall score from category scores
 */
function calculateOverallScore(
  categories: DealScoreBreakdown,
  weights: ScoringWeights
): number {
  const weightedSum =
    categories.management.score * weights.management +
    categories.market.score * weights.market +
    categories.financial.score * weights.financial +
    categories.operational.score * weights.operational +
    categories.transaction.score * weights.transaction;

  // Convert from 1-10 scale to 0-100
  return Math.round(weightedSum * 10);
}

/**
 * Calculate letter grade from score
 */
function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 85) {return 'A';}
  if (score >= 70) {return 'B';}
  if (score >= 55) {return 'C';}
  if (score >= 40) {return 'D';}
  return 'F';
}

/**
 * Normalize recommendation
 */
function normalizeRecommendation(
  rec?: string
): 'proceed' | 'negotiate' | 'pass' | 'more_diligence' {
  const valid = ['proceed', 'negotiate', 'pass', 'more_diligence'];
  const normalized = rec?.toLowerCase().replace(/[^a-z_]/g, '_');
  return valid.includes(normalized || '') ? (normalized as any) : 'more_diligence';
}

/**
 * Normalize risks array
 */
function normalizeRisks(risks: any[]): Array<{
  category: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigation: string;
  probability: number;
}> {
  return risks.map((r) => ({
    category: r.category || 'other',
    description: r.description || '',
    severity: normalizeSeverity(r.severity),
    mitigation: r.mitigation || '',
    probability: Math.min(1, Math.max(0, r.probability || 0.5)),
  }));
}

/**
 * Normalize opportunities array
 */
function normalizeOpportunities(opps: any[]): Array<{
  category: string;
  description: string;
  potential: 'low' | 'medium' | 'high';
  timeframe: string;
  requirements: string[];
}> {
  return opps.map((o) => ({
    category: o.category || 'other',
    description: o.description || '',
    potential: normalizePotential(o.potential),
    timeframe: o.timeframe || '',
    requirements: o.requirements || [],
  }));
}

/**
 * Normalize severity
 */
function normalizeSeverity(s?: string): 'low' | 'medium' | 'high' | 'critical' {
  const valid = ['low', 'medium', 'high', 'critical'];
  return valid.includes(s?.toLowerCase() || '') ? (s!.toLowerCase() as any) : 'medium';
}

/**
 * Normalize potential
 */
function normalizePotential(p?: string): 'low' | 'medium' | 'high' {
  const valid = ['low', 'medium', 'high'];
  return valid.includes(p?.toLowerCase() || '') ? (p!.toLowerCase() as any) : 'medium';
}

/**
 * Create empty metadata
 */
function createEmptyMetadata(): AIResponseMetadata {
  return {
    model: 'unknown',
    tokensUsed: { input: 0, output: 0, total: 0 },
    processingTime: 0,
    timestamp: new Date(),
  };
}
