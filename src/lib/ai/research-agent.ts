// ============================================================================
// SPAC OS Research Agent - Autonomous Company and Market Research
// ============================================================================

import { getClaudeClient } from './claude';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';
import type { AIResponse, AIResponseMetadata, AIError } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Company profile from research
 */
export interface CompanyProfile {
  name: string;
  legalName?: string;
  description: string;
  founded?: string;
  headquarters?: string;
  website?: string;
  employees?: string;
  ownership?: string;
  fundingHistory?: FundingRound[];
}

/**
 * Funding round information
 */
export interface FundingRound {
  date: string;
  round: string;
  amount: string;
  investors: string[];
}

/**
 * Business model analysis
 */
export interface BusinessModelAnalysis {
  description: string;
  revenueStreams: string[];
  keyProducts: string[];
  targetCustomers: string[];
  valueProposition: string;
  channels: string[];
  costStructure: string[];
  keyResources: string[];
  keyActivities: string[];
  keyPartners: string[];
}

/**
 * Management team member
 */
export interface ManagementTeamMember {
  name: string;
  title: string;
  background: string;
  priorExperience?: string[];
  education?: string;
  tenure?: string;
}

/**
 * Market analysis
 */
export interface MarketAnalysis {
  tam: string;
  tamValue?: number;
  sam?: string;
  samValue?: number;
  som?: string;
  somValue?: number;
  growth: string;
  trends: string[];
  dynamics: string;
  drivers: string[];
  challenges: string[];
  regulations: string[];
}

/**
 * Competitive position analysis
 */
export interface CompetitivePosition {
  competitors: CompetitorProfile[];
  advantages: string[];
  disadvantages: string[];
  marketShare?: string;
  positioning: string;
  moats: string[];
  threats: string[];
}

/**
 * Competitor profile
 */
export interface CompetitorProfile {
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  marketPosition: string;
  differentiators: string[];
  revenue?: string;
  funding?: string;
}

/**
 * Financial highlights
 */
export interface FinancialHighlights {
  revenue?: string;
  revenueGrowth?: string;
  profitability?: string;
  margins?: Record<string, string>;
  funding?: string;
  valuation?: string;
  keyMetrics?: Record<string, string>;
}

/**
 * Complete research memo
 */
export interface ResearchMemo {
  companyOverview: CompanyProfile;
  businessModel: BusinessModelAnalysis;
  managementTeam: ManagementTeamMember[];
  marketAnalysis: MarketAnalysis;
  competitivePosition: CompetitivePosition;
  financialHighlights: FinancialHighlights;
  keyRisks: string[];
  keyOpportunities: string[];
  summary: string;
  recommendation?: string;
  researchedAt: Date;
  confidence: number;
}

/**
 * News item
 */
export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  date: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  relevance: 'high' | 'medium' | 'low';
  category: string;
}

/**
 * Research request options
 */
export interface ResearchOptions {
  depth?: 'quick' | 'standard' | 'deep';
  focusAreas?: string[];
  includeCompetitors?: boolean;
  includeMarketAnalysis?: boolean;
  includeFinancials?: boolean;
  includeManagement?: boolean;
  industry?: string;
}

// ============================================================================
// Main Research Functions
// ============================================================================

/**
 * Conduct comprehensive company research
 */
export async function researchCompany(
  companyName: string,
  options: ResearchOptions = {}
): Promise<AIResponse<ResearchMemo>> {
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
    const researchAreas = options.focusAreas || [
      'Company background and history',
      'Business model and revenue streams',
      'Management team',
      'Market opportunity',
      'Competitive landscape',
      'Financial performance',
      'Key risks and opportunities',
    ];

    const depthContext =
      options.depth === 'deep'
        ? 'Provide extremely detailed analysis with extensive coverage.'
        : options.depth === 'quick'
          ? 'Provide a quick high-level overview.'
          : 'Provide comprehensive but focused analysis.';

    const industryContext = options.industry
      ? `The company operates in the ${options.industry} industry.`
      : '';

    const prompt = USER_PROMPTS.researchCompany(companyName, researchAreas);

    const response = await client.sendMessage(`${depthContext}\n${industryContext}\n\n${prompt}`, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const rawMemo = client.parseJSONResponse<Partial<ResearchMemo>>(response.content);
    const normalizedMemo = normalizeResearchMemo(rawMemo);

    return {
      success: true,
      data: normalizedMemo,
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
 * Analyze market opportunity
 */
export async function analyzeMarket(
  industry: string,
  options?: {
    geography?: string;
    timeHorizon?: string;
    includeRegulations?: boolean;
  }
): Promise<AIResponse<MarketAnalysis>> {
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
    const geoContext = options?.geography ? `Focus on the ${options.geography} market.` : '';
    const timeContext = options?.timeHorizon
      ? `Analyze trends over a ${options.timeHorizon} horizon.`
      : '';
    const regContext = options?.includeRegulations
      ? 'Include regulatory environment analysis.'
      : '';

    const prompt = `Analyze the ${industry} market opportunity.

${geoContext}
${timeContext}
${regContext}

Provide:
1. Total Addressable Market (TAM) with sizing methodology
2. Serviceable Addressable Market (SAM)
3. Market growth rates and projections
4. Key market trends and dynamics
5. Growth drivers and challenges
6. Regulatory considerations

Return as JSON:
{
  "tam": "Description and value",
  "tamValue": numeric value in dollars,
  "sam": "Description and value",
  "samValue": numeric value,
  "som": "Description and value",
  "somValue": numeric value,
  "growth": "Growth rate and projections",
  "trends": ["Trend 1", "Trend 2", ...],
  "dynamics": "Market dynamics overview",
  "drivers": ["Driver 1", "Driver 2", ...],
  "challenges": ["Challenge 1", "Challenge 2", ...],
  "regulations": ["Regulation 1", "Regulation 2", ...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const market = client.parseJSONResponse<MarketAnalysis>(response.content);

    return {
      success: true,
      data: normalizeMarketAnalysis(market),
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
 * Identify and analyze competitors
 */
export async function analyzeCompetitors(
  companyName: string,
  industry: string,
  options?: {
    includeIndirect?: boolean;
    maxCompetitors?: number;
  }
): Promise<AIResponse<CompetitivePosition>> {
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
    const indirectContext = options?.includeIndirect
      ? 'Include both direct and indirect competitors.'
      : 'Focus on direct competitors.';

    const limitContext = options?.maxCompetitors
      ? `Analyze up to ${options.maxCompetitors} competitors.`
      : 'Analyze the top 5-7 competitors.';

    const prompt = USER_PROMPTS.analyzeCompetitors(companyName, industry);

    const response = await client.sendMessage(`${indirectContext}\n${limitContext}\n\n${prompt}`, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const position = client.parseJSONResponse<Partial<CompetitivePosition>>(response.content);

    return {
      success: true,
      data: normalizeCompetitivePosition(position),
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
 * Analyze company news and sentiment
 */
export async function analyzeNewsContext(
  companyName: string,
  options?: {
    timeframe?: string;
    categories?: string[];
  }
): Promise<AIResponse<{
  newsItems: NewsItem[];
  overallSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  keyThemes: string[];
  materialEvents: string[];
  summary: string;
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
    const timeContext = options?.timeframe
      ? `Focus on news from the ${options.timeframe}.`
      : 'Focus on recent news.';

    const categoryContext = options?.categories?.length
      ? `Categories of interest: ${options.categories.join(', ')}.`
      : '';

    const prompt = `Analyze news and public information about ${companyName}.

${timeContext}
${categoryContext}

Identify:
1. Key news items and developments
2. Overall sentiment and trajectory
3. Major themes in coverage
4. Material events or announcements
5. Summary of public perception

Return as JSON:
{
  "newsItems": [
    {
      "title": "...",
      "summary": "...",
      "source": "...",
      "date": "...",
      "sentiment": "positive|neutral|negative",
      "relevance": "high|medium|low",
      "category": "..."
    }
  ],
  "overallSentiment": "positive|neutral|negative|mixed",
  "keyThemes": ["Theme 1", "Theme 2", ...],
  "materialEvents": ["Event 1", "Event 2", ...],
  "summary": "Overall summary"
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const analysis = client.parseJSONResponse<{
      newsItems: Partial<NewsItem>[];
      overallSentiment: string;
      keyThemes: string[];
      materialEvents: string[];
      summary: string;
    }>(response.content);

    return {
      success: true,
      data: {
        newsItems: normalizeNewsItems(analysis.newsItems || []),
        overallSentiment: normalizeSentiment(analysis.overallSentiment),
        keyThemes: analysis.keyThemes || [],
        materialEvents: analysis.materialEvents || [],
        summary: analysis.summary || '',
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
 * Generate research memo for a target
 */
export async function generateResearchMemo(
  companyName: string,
  purpose: 'initial_screening' | 'deep_dive' | 'board_presentation',
  additionalContext?: string
): Promise<AIResponse<{
  memo: string;
  executiveSummary: string;
  recommendation: string;
  keyQuestions: string[];
  nextSteps: string[];
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
    const purposeContext = {
      initial_screening: 'Create a brief screening memo for initial target evaluation.',
      deep_dive: 'Create a comprehensive research memo for detailed due diligence.',
      board_presentation:
        'Create an executive-level research memo suitable for board presentation.',
    }[purpose];

    const prompt = `${purposeContext}

Company: ${companyName}
${additionalContext ? `\nAdditional Context: ${additionalContext}` : ''}

Return as JSON:
{
  "memo": "Full research memo text (formatted with markdown)",
  "executiveSummary": "3-4 sentence executive summary",
  "recommendation": "Recommendation with rationale",
  "keyQuestions": ["Question to address 1", "Question 2", ...],
  "nextSteps": ["Next step 1", "Next step 2", ...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.comparison, // Use larger limit for memo
      temperature: AI_CONFIG.temperature.summary,
    });

    const memo = client.parseJSONResponse<{
      memo: string;
      executiveSummary: string;
      recommendation: string;
      keyQuestions: string[];
      nextSteps: string[];
    }>(response.content);

    return {
      success: true,
      data: {
        memo: memo.memo || '',
        executiveSummary: memo.executiveSummary || '',
        recommendation: memo.recommendation || '',
        keyQuestions: memo.keyQuestions || [],
        nextSteps: memo.nextSteps || [],
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
 * Analyze management team
 */
export async function analyzeManagementTeam(
  companyName: string,
  knownTeamMembers?: Array<{ name: string; title: string }>
): Promise<AIResponse<{
  team: ManagementTeamMember[];
  overallAssessment: string;
  strengths: string[];
  concerns: string[];
  keyPersonRisk: 'low' | 'medium' | 'high';
  trackRecord: string;
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
    const knownContext = knownTeamMembers?.length
      ? `Known team members:\n${knownTeamMembers.map((m) => `- ${m.name}: ${m.title}`).join('\n')}`
      : '';

    const prompt = `Analyze the management team of ${companyName}.

${knownContext}

Evaluate:
1. Key executives and their backgrounds
2. Relevant experience and track record
3. Team strengths and gaps
4. Key person dependencies
5. Overall management quality

Return as JSON:
{
  "team": [
    {
      "name": "...",
      "title": "...",
      "background": "...",
      "priorExperience": ["..."],
      "education": "...",
      "tenure": "..."
    }
  ],
  "overallAssessment": "...",
  "strengths": ["..."],
  "concerns": ["..."],
  "keyPersonRisk": "low|medium|high",
  "trackRecord": "..."
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const analysis = client.parseJSONResponse<{
      team: Partial<ManagementTeamMember>[];
      overallAssessment: string;
      strengths: string[];
      concerns: string[];
      keyPersonRisk: string;
      trackRecord: string;
    }>(response.content);

    return {
      success: true,
      data: {
        team: normalizeManagementTeam(analysis.team || []),
        overallAssessment: analysis.overallAssessment || '',
        strengths: analysis.strengths || [],
        concerns: analysis.concerns || [],
        keyPersonRisk: normalizeRiskLevel(analysis.keyPersonRisk),
        trackRecord: analysis.trackRecord || '',
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
 * Research industry trends
 */
export async function researchIndustryTrends(
  industry: string,
  options?: {
    timeHorizon?: '1-year' | '3-year' | '5-year';
    geography?: string;
  }
): Promise<AIResponse<{
  trends: Array<{
    trend: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    timeframe: string;
    implications: string[];
  }>;
  disruptors: string[];
  opportunities: string[];
  threats: string[];
  outlook: string;
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
    const horizonContext = options?.timeHorizon
      ? `Focus on ${options.timeHorizon} trends.`
      : 'Analyze near to medium term trends.';

    const geoContext = options?.geography
      ? `Geographic focus: ${options.geography}.`
      : '';

    const prompt = `Research key trends in the ${industry} industry.

${horizonContext}
${geoContext}

Identify:
1. Major industry trends and their trajectory
2. Potential disruptors and emerging technologies
3. Opportunities for growth
4. Threats and challenges
5. Overall industry outlook

Return as JSON:
{
  "trends": [
    {
      "trend": "...",
      "description": "...",
      "impact": "high|medium|low",
      "timeframe": "...",
      "implications": ["..."]
    }
  ],
  "disruptors": ["..."],
  "opportunities": ["..."],
  "threats": ["..."],
  "outlook": "..."
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.researchAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const research = client.parseJSONResponse<{
      trends: any[];
      disruptors: string[];
      opportunities: string[];
      threats: string[];
      outlook: string;
    }>(response.content);

    return {
      success: true,
      data: {
        trends: (research.trends || []).map((t) => ({
          trend: t.trend || '',
          description: t.description || '',
          impact: normalizeImpact(t.impact),
          timeframe: t.timeframe || '',
          implications: t.implications || [],
        })),
        disruptors: research.disruptors || [],
        opportunities: research.opportunities || [],
        threats: research.threats || [],
        outlook: research.outlook || '',
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
 * Normalize research memo
 */
function normalizeResearchMemo(raw: Partial<ResearchMemo>): ResearchMemo {
  return {
    companyOverview: normalizeCompanyProfile(raw.companyOverview),
    businessModel: normalizeBusinessModel(raw.businessModel),
    managementTeam: normalizeManagementTeam(raw.managementTeam || []),
    marketAnalysis: normalizeMarketAnalysis(raw.marketAnalysis),
    competitivePosition: normalizeCompetitivePosition(raw.competitivePosition),
    financialHighlights: normalizeFinancialHighlights(raw.financialHighlights),
    keyRisks: raw.keyRisks || [],
    keyOpportunities: raw.keyOpportunities || [],
    summary: raw.summary || '',
    recommendation: raw.recommendation,
    researchedAt: new Date(),
    confidence: raw.confidence ?? 0.7,
  };
}

/**
 * Normalize company profile
 */
function normalizeCompanyProfile(raw?: Partial<CompanyProfile>): CompanyProfile {
  return {
    name: raw?.name || '',
    legalName: raw?.legalName,
    description: raw?.description || '',
    founded: raw?.founded,
    headquarters: raw?.headquarters,
    website: raw?.website,
    employees: raw?.employees,
    ownership: raw?.ownership,
    fundingHistory: raw?.fundingHistory || [],
  };
}

/**
 * Normalize business model
 */
function normalizeBusinessModel(raw?: Partial<BusinessModelAnalysis>): BusinessModelAnalysis {
  return {
    description: raw?.description || '',
    revenueStreams: raw?.revenueStreams || [],
    keyProducts: raw?.keyProducts || [],
    targetCustomers: raw?.targetCustomers || [],
    valueProposition: raw?.valueProposition || '',
    channels: raw?.channels || [],
    costStructure: raw?.costStructure || [],
    keyResources: raw?.keyResources || [],
    keyActivities: raw?.keyActivities || [],
    keyPartners: raw?.keyPartners || [],
  };
}

/**
 * Normalize management team
 */
function normalizeManagementTeam(
  raw: Partial<ManagementTeamMember>[]
): ManagementTeamMember[] {
  return raw.map((m) => ({
    name: m.name || '',
    title: m.title || '',
    background: m.background || '',
    priorExperience: m.priorExperience,
    education: m.education,
    tenure: m.tenure,
  }));
}

/**
 * Normalize market analysis
 */
function normalizeMarketAnalysis(raw?: Partial<MarketAnalysis>): MarketAnalysis {
  return {
    tam: raw?.tam || '',
    tamValue: raw?.tamValue,
    sam: raw?.sam,
    samValue: raw?.samValue,
    som: raw?.som,
    somValue: raw?.somValue,
    growth: raw?.growth || '',
    trends: raw?.trends || [],
    dynamics: raw?.dynamics || '',
    drivers: raw?.drivers || [],
    challenges: raw?.challenges || [],
    regulations: raw?.regulations || [],
  };
}

/**
 * Normalize competitive position
 */
function normalizeCompetitivePosition(
  raw?: Partial<CompetitivePosition>
): CompetitivePosition {
  return {
    competitors: (raw?.competitors || []).map((c) => ({
      name: c.name || '',
      description: c.description || '',
      strengths: c.strengths || [],
      weaknesses: c.weaknesses || [],
      marketPosition: c.marketPosition || '',
      differentiators: c.differentiators || [],
      revenue: c.revenue,
      funding: c.funding,
    })),
    advantages: raw?.advantages || [],
    disadvantages: raw?.disadvantages || [],
    marketShare: raw?.marketShare,
    positioning: raw?.positioning || '',
    moats: raw?.moats || [],
    threats: raw?.threats || [],
  };
}

/**
 * Normalize financial highlights
 */
function normalizeFinancialHighlights(
  raw?: Partial<FinancialHighlights>
): FinancialHighlights {
  return {
    revenue: raw?.revenue,
    revenueGrowth: raw?.revenueGrowth,
    profitability: raw?.profitability,
    margins: raw?.margins,
    funding: raw?.funding,
    valuation: raw?.valuation,
    keyMetrics: raw?.keyMetrics,
  };
}

/**
 * Normalize news items
 */
function normalizeNewsItems(items: Partial<NewsItem>[]): NewsItem[] {
  return items.map((item) => ({
    title: item.title || '',
    summary: item.summary || '',
    source: item.source || 'Unknown',
    date: item.date || '',
    sentiment: normalizeSentimentItem(item.sentiment),
    relevance: normalizeRelevance(item.relevance),
    category: item.category || 'General',
  }));
}

/**
 * Normalize sentiment
 */
function normalizeSentiment(
  s?: string
): 'positive' | 'neutral' | 'negative' | 'mixed' {
  const valid = ['positive', 'neutral', 'negative', 'mixed'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'neutral';
}

/**
 * Normalize sentiment item
 */
function normalizeSentimentItem(
  s?: string
): 'positive' | 'neutral' | 'negative' {
  const valid = ['positive', 'neutral', 'negative'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'neutral';
}

/**
 * Normalize relevance
 */
function normalizeRelevance(r?: string): 'high' | 'medium' | 'low' {
  const valid = ['high', 'medium', 'low'];
  return valid.includes(r?.toLowerCase() || '')
    ? (r!.toLowerCase() as any)
    : 'medium';
}

/**
 * Normalize risk level
 */
function normalizeRiskLevel(r?: string): 'low' | 'medium' | 'high' {
  const valid = ['low', 'medium', 'high'];
  return valid.includes(r?.toLowerCase() || '')
    ? (r!.toLowerCase() as any)
    : 'medium';
}

/**
 * Normalize impact
 */
function normalizeImpact(i?: string): 'high' | 'medium' | 'low' {
  const valid = ['high', 'medium', 'low'];
  return valid.includes(i?.toLowerCase() || '')
    ? (i!.toLowerCase() as any)
    : 'medium';
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
