// ============================================================================
// SPAC OS Risk Detector - Identify red flags and risks in documents
// ============================================================================

import { getAIClient, type AIRequestOptions } from './client';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';
import type {
  RiskAnalysis,
  RiskItem,
  RiskSeverity,
  RiskCategory,
  AIResponse,
  AIResponseMetadata,
  AIError,
} from './types';

/**
 * Risk detection options
 */
export interface RiskDetectionOptions {
  documentType?: string;
  focusCategories?: RiskCategory[];
  minSeverity?: RiskSeverity;
  includeRecommendations?: boolean;
  contextualInfo?: {
    dealSize?: number;
    industry?: string;
    jurisdiction?: string;
  };
}

/**
 * Risk score breakdown
 */
export interface RiskScoreBreakdown {
  overall: number;
  byCategory: Record<RiskCategory, number>;
  confidence: number;
}

/**
 * Risk trend analysis
 */
export interface RiskTrend {
  category: RiskCategory;
  direction: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
}

/**
 * Detect risks in a document
 */
export async function detectRisks(
  documentContent: string,
  options: RiskDetectionOptions = {}
): Promise<AIResponse<RiskAnalysis>> {
  const client = getAIClient();

  if (!client.isConfigured()) {
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
    const requestOptions: AIRequestOptions = {
      systemPrompt: SYSTEM_PROMPTS.riskDetector,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    };

    const documentType = options.documentType || 'general';
    const prompt = USER_PROMPTS.detectRisks(documentContent, documentType);
    const response = await client.sendMessage(prompt, requestOptions);

    const parsedRisks = client.parseJSONResponse<Partial<RiskAnalysis>>(response.content);
    const normalizedAnalysis = normalizeRiskAnalysis(parsedRisks, options);

    return {
      success: true,
      data: normalizedAnalysis,
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
 * Detect specific category of risks
 */
export async function detectCategoryRisks(
  documentContent: string,
  category: RiskCategory
): Promise<AIResponse<RiskItem[]>> {
  const client = getAIClient();

  if (!client.isConfigured()) {
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
    const categoryDescriptions: Record<RiskCategory, string> = {
      legal: 'legal issues including litigation, regulatory compliance, IP concerns, and contractual risks',
      financial: 'financial risks including revenue concentration, debt levels, cash burn, and accounting concerns',
      operational: 'operational risks including key person dependencies, supply chain, technology, and process risks',
      market: 'market risks including competition, customer concentration, market trends, and pricing pressure',
      transaction: 'transaction-specific risks including deal structure, integration challenges, and closing risks',
      disclosure: 'disclosure risks including missing information, inconsistencies, and regulatory filing concerns',
      regulatory: 'regulatory risks including permits, licenses, compliance requirements, and pending regulations',
      other: 'other risks not fitting into standard categories',
    };

    const prompt = `Analyze the following document specifically for ${category} risks.

Focus on identifying ${categoryDescriptions[category]}.

Document:
${documentContent}

Return as JSON:
{
  "risks": [
    {
      "id": "...",
      "category": "${category}",
      "title": "...",
      "description": "...",
      "severity": "low|medium|high|critical",
      "impact": "...",
      "mitigation": "...",
      "relatedSections": [...],
      "confidence": 0.0-1.0
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.riskDetector,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const parsed = client.parseJSONResponse<{ risks: Partial<RiskItem>[] }>(response.content);
    const normalizedRisks = parsed.risks.map((risk, index) =>
      normalizeRiskItem(risk, index)
    );

    return {
      success: true,
      data: normalizedRisks,
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
 * Analyze red flags in contracts
 */
export async function detectContractRedFlags(
  documentContent: string
): Promise<AIResponse<RiskItem[]>> {
  const client = getAIClient();

  if (!client.isConfigured()) {
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
    const prompt = `Analyze the following contract for red flags and concerning provisions from a buyer's perspective.

Look for:
1. Unusually broad representations and warranties
2. Excessive limitations on liability
3. Aggressive indemnification terms
4. Problematic termination provisions
5. Material adverse change definitions that favor the seller
6. Missing or inadequate disclosure schedules references
7. Unusual carve-outs or exceptions
8. Vague or undefined key terms
9. One-sided closing conditions
10. Problematic non-compete or exclusivity provisions

Document:
${documentContent}

Return as JSON:
{
  "redFlags": [
    {
      "id": "...",
      "title": "...",
      "description": "...",
      "severity": "low|medium|high|critical",
      "section": "...",
      "recommendation": "...",
      "marketStandard": "..."
    }
  ],
  "overallAssessment": "...",
  "priorityIssues": [...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.riskDetector,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const parsed = client.parseJSONResponse<{
      redFlags: Array<{
        id?: string;
        title: string;
        description: string;
        severity?: RiskSeverity;
        section?: string;
        recommendation?: string;
      }>;
    }>(response.content);

    const risks: RiskItem[] = parsed.redFlags.map((flag, index) => ({
      id: flag.id || `rf-${index + 1}`,
      category: 'legal' as RiskCategory,
      title: flag.title,
      description: flag.description,
      severity: normalizeSeverity(flag.severity),
      impact: flag.recommendation || '',
      mitigation: flag.recommendation || '',
      relatedSections: flag.section ? [flag.section] : [],
    }));

    return {
      success: true,
      data: risks,
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
 * Analyze financial risk indicators
 */
export async function detectFinancialRisks(
  documentContent: string,
  contextInfo?: { industry?: string; dealSize?: number }
): Promise<AIResponse<RiskItem[]>> {
  const client = getAIClient();

  if (!client.isConfigured()) {
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
    const contextString = contextInfo
      ? `Context: Industry - ${contextInfo.industry || 'Not specified'}, Deal Size - ${contextInfo.dealSize ? `$${contextInfo.dealSize}M` : 'Not specified'}`
      : '';

    const prompt = `Analyze the following financial information for risks and concerns.

${contextString}

Look for:
1. Revenue concentration (customer or product)
2. Declining revenues or margins
3. Negative or deteriorating cash flows
4. High debt levels or covenant concerns
5. Working capital deficiencies
6. Off-balance sheet liabilities
7. Related party transactions
8. Aggressive accounting policies
9. Material contingent liabilities
10. Going concern issues

Document:
${documentContent}

Return as JSON:
{
  "risks": [
    {
      "id": "...",
      "category": "financial",
      "title": "...",
      "description": "...",
      "severity": "low|medium|high|critical",
      "quantitativeImpact": "...",
      "mitigation": "...",
      "dataPoints": [...]
    }
  ],
  "overallFinancialHealth": "strong|adequate|concerning|weak",
  "keyMetricsConcerns": [...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.riskDetector,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const parsed = client.parseJSONResponse<{ risks: Partial<RiskItem>[] }>(response.content);
    const normalizedRisks = parsed.risks.map((risk, index) =>
      normalizeRiskItem({ ...risk, category: 'financial' }, index)
    );

    return {
      success: true,
      data: normalizedRisks,
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
 * Calculate overall risk score
 */
export async function calculateRiskScore(
  risks: RiskItem[]
): Promise<RiskScoreBreakdown> {
  const severityWeights: Record<RiskSeverity, number> = {
    low: 1,
    medium: 2,
    high: 4,
    critical: 8,
  };

  const byCategory: Record<RiskCategory, number> = {
    legal: 0,
    financial: 0,
    operational: 0,
    market: 0,
    transaction: 0,
    disclosure: 0,
    regulatory: 0,
    other: 0,
  };

  let totalWeightedScore = 0;
  let maxPossibleScore = 0;

  for (const risk of risks) {
    const weight = severityWeights[risk.severity];
    totalWeightedScore += weight;
    byCategory[risk.category] = (byCategory[risk.category] || 0) + weight;
    maxPossibleScore += severityWeights.critical;
  }

  // Normalize to 0-100 scale
  const overall = maxPossibleScore > 0
    ? Math.round((totalWeightedScore / maxPossibleScore) * 100)
    : 0;

  // Normalize category scores
  for (const category of Object.keys(byCategory) as RiskCategory[]) {
    const categoryRisks = risks.filter((r) => r.category === category);
    const categoryMax = categoryRisks.length * severityWeights.critical;
    byCategory[category] = categoryMax > 0
      ? Math.round((byCategory[category] / categoryMax) * 100)
      : 0;
  }

  // Calculate confidence based on number of risks identified
  const confidence = Math.min(1, risks.length / 10);

  return {
    overall,
    byCategory,
    confidence,
  };
}

/**
 * Generate risk mitigation recommendations
 */
export async function generateMitigationPlan(
  risks: RiskItem[]
): Promise<AIResponse<{ prioritizedActions: string[]; timeline: string }>> {
  const client = getAIClient();

  if (!client.isConfigured()) {
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
    const riskSummary = risks
      .map((r) => `- [${r.severity.toUpperCase()}] ${r.title}: ${r.description}`)
      .join('\n');

    const prompt = `Based on the following identified risks, create a prioritized mitigation plan.

Identified Risks:
${riskSummary}

Provide:
1. Prioritized list of actions to address the risks
2. Suggested timeline for addressing each
3. Key stakeholders who should be involved

Return as JSON:
{
  "prioritizedActions": [
    "1. [IMMEDIATE] ...",
    "2. [SHORT-TERM] ...",
    ...
  ],
  "timeline": "...",
  "stakeholders": [...],
  "estimatedEffort": "..."
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.riskDetector,
      maxTokens: AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const plan = client.parseJSONResponse<{
      prioritizedActions: string[];
      timeline: string;
    }>(response.content);

    return {
      success: true,
      data: plan,
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
// Normalization Helper Functions
// ============================================================================

function normalizeRiskAnalysis(
  analysis: Partial<RiskAnalysis>,
  options: RiskDetectionOptions
): RiskAnalysis {
  const risks = (analysis.risks || [])
    .map((risk, index) => normalizeRiskItem(risk, index))
    .filter((risk) => {
      // Filter by minimum severity if specified
      if (options.minSeverity) {
        const severityOrder: RiskSeverity[] = ['low', 'medium', 'high', 'critical'];
        const minIndex = severityOrder.indexOf(options.minSeverity);
        const riskIndex = severityOrder.indexOf(risk.severity);
        return riskIndex >= minIndex;
      }
      return true;
    })
    .filter((risk) => {
      // Filter by focus categories if specified
      if (options.focusCategories && options.focusCategories.length > 0) {
        return options.focusCategories.includes(risk.category);
      }
      return true;
    });

  // Calculate aggregates
  const risksByCategory = calculateRisksByCategory(risks);
  const risksBySeverity = calculateRisksBySeverity(risks);
  const topRisks = risks
    .filter((r) => r.severity === 'critical' || r.severity === 'high')
    .slice(0, 5);

  return {
    risks,
    overallRiskLevel: determineOverallRiskLevel(risks),
    summary: analysis.summary || generateRiskSummary(risks),
    risksByCategory,
    risksBySeverity,
    topRisks,
  };
}

function normalizeRiskItem(risk: Partial<RiskItem>, index: number): RiskItem {
  return {
    id: risk.id || `risk-${index + 1}`,
    category: normalizeCategory(risk.category),
    title: risk.title || 'Untitled Risk',
    description: risk.description || '',
    severity: normalizeSeverity(risk.severity),
    impact: risk.impact || '',
    mitigation: risk.mitigation || '',
    relatedSections: risk.relatedSections || [],
    confidence: risk.confidence,
  };
}

function normalizeCategory(category?: string): RiskCategory {
  const validCategories: RiskCategory[] = [
    'legal', 'financial', 'operational', 'market',
    'transaction', 'disclosure', 'regulatory', 'other',
  ];
  const normalized = category?.toLowerCase() as RiskCategory;
  return validCategories.includes(normalized) ? normalized : 'other';
}

function normalizeSeverity(severity?: string): RiskSeverity {
  const validSeverities: RiskSeverity[] = ['low', 'medium', 'high', 'critical'];
  const normalized = severity?.toLowerCase() as RiskSeverity;
  return validSeverities.includes(normalized) ? normalized : 'medium';
}

function calculateRisksByCategory(risks: RiskItem[]): Record<RiskCategory, number> {
  const counts: Record<RiskCategory, number> = {
    legal: 0,
    financial: 0,
    operational: 0,
    market: 0,
    transaction: 0,
    disclosure: 0,
    regulatory: 0,
    other: 0,
  };

  for (const risk of risks) {
    counts[risk.category]++;
  }

  return counts;
}

function calculateRisksBySeverity(risks: RiskItem[]): Record<RiskSeverity, number> {
  const counts: Record<RiskSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  for (const risk of risks) {
    counts[risk.severity]++;
  }

  return counts;
}

function determineOverallRiskLevel(risks: RiskItem[]): RiskSeverity {
  if (risks.some((r) => r.severity === 'critical')) return 'critical';
  if (risks.filter((r) => r.severity === 'high').length >= 3) return 'critical';
  if (risks.some((r) => r.severity === 'high')) return 'high';
  if (risks.filter((r) => r.severity === 'medium').length >= 5) return 'high';
  if (risks.some((r) => r.severity === 'medium')) return 'medium';
  return 'low';
}

function generateRiskSummary(risks: RiskItem[]): string {
  if (risks.length === 0) {
    return 'No significant risks identified in the document analysis.';
  }

  const critical = risks.filter((r) => r.severity === 'critical').length;
  const high = risks.filter((r) => r.severity === 'high').length;
  const medium = risks.filter((r) => r.severity === 'medium').length;
  const low = risks.filter((r) => r.severity === 'low').length;

  const parts: string[] = [];
  parts.push(`Identified ${risks.length} total risk${risks.length === 1 ? '' : 's'}.`);

  if (critical > 0) parts.push(`${critical} critical`);
  if (high > 0) parts.push(`${high} high`);
  if (medium > 0) parts.push(`${medium} medium`);
  if (low > 0) parts.push(`${low} low`);

  return parts.join(', ') + ' severity.';
}

function createEmptyMetadata(): AIResponseMetadata {
  return {
    model: 'unknown',
    tokensUsed: { input: 0, output: 0, total: 0 },
    processingTime: 0,
    timestamp: new Date(),
  };
}
