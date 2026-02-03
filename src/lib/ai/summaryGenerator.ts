// ============================================================================
// SPAC OS Summary Generator - Generate executive summaries
// ============================================================================

import { getAIClient, type AIRequestOptions } from './client';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';

import type {
  DocumentSummary,
  SummaryType,
  AIResponse,
  AIResponseMetadata,
  AIError,
} from './types';

/**
 * Summary generation options
 */
export interface SummaryOptions {
  type?: SummaryType;
  maxLength?: number;
  focusAreas?: string[];
  includeMetrics?: boolean;
  includeRisks?: boolean;
  includeRecommendations?: boolean;
  audience?: 'board' | 'investor' | 'legal' | 'general';
}

/**
 * Executive briefing structure
 */
export interface ExecutiveBriefing {
  headline: string;
  overview: string;
  keyTakeaways: string[];
  financialHighlights: Record<string, string | number>;
  riskSummary: string;
  nextSteps: string[];
  appendix?: string[];
}

/**
 * Due diligence summary
 */
export interface DueDiligenceSummary {
  targetOverview: string;
  financialSummary: string;
  operationalSummary: string;
  legalSummary: string;
  keyFindings: string[];
  redFlags: string[];
  recommendations: string[];
  openItems: string[];
}

/**
 * Generate a document summary
 */
export async function generateSummary(
  documentContent: string,
  options: SummaryOptions = {}
): Promise<AIResponse<DocumentSummary>> {
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
    const summaryType = options.type || 'detailed';
    const requestOptions: AIRequestOptions = {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: options.maxLength || AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.summary,
    };

    const prompt = USER_PROMPTS.generateSummary(documentContent, summaryType);
    const response = await client.sendMessage(prompt, requestOptions);

    const summary = parseSummaryResponse(response.content, options);

    return {
      success: true,
      data: summary,
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
 * Generate an executive briefing
 */
export async function generateExecutiveBriefing(
  documentContent: string,
  context?: { dealName?: string; targetName?: string; spacName?: string }
): Promise<AIResponse<ExecutiveBriefing>> {
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
    const contextInfo = context
      ? `Context: ${context.spacName ? `SPAC: ${context.spacName}` : ''} ${context.targetName ? `Target: ${context.targetName}` : ''} ${context.dealName ? `Deal: ${context.dealName}` : ''}`
      : '';

    const prompt = `Create an executive briefing for the board based on the following document.

${contextInfo}

Document:
${documentContent}

Provide a concise briefing suitable for time-pressed board members and investors.

Return as JSON:
{
  "headline": "One-line summary of the key point",
  "overview": "2-3 sentence executive summary",
  "keyTakeaways": [
    "Most important point 1",
    "Most important point 2",
    "Most important point 3"
  ],
  "financialHighlights": {
    "key metric 1": "value",
    "key metric 2": "value"
  },
  "riskSummary": "Brief summary of key risks",
  "nextSteps": [
    "Recommended action 1",
    "Recommended action 2"
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.summary,
    });

    const briefing = client.parseJSONResponse<ExecutiveBriefing>(response.content);

    return {
      success: true,
      data: normalizeBriefing(briefing),
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
 * Generate a due diligence summary
 */
export async function generateDueDiligenceSummary(
  documentContent: string,
  ddPhase?: 'preliminary' | 'deep-dive' | 'final'
): Promise<AIResponse<DueDiligenceSummary>> {
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
    const phaseContext = ddPhase
      ? `This is for ${ddPhase} due diligence review.`
      : '';

    const prompt = `Create a comprehensive due diligence summary from the following document(s).

${phaseContext}

Document:
${documentContent}

Organize findings into key due diligence categories.

Return as JSON:
{
  "targetOverview": "Brief description of the target company",
  "financialSummary": "Summary of financial position and performance",
  "operationalSummary": "Summary of operations, business model, and capabilities",
  "legalSummary": "Summary of legal structure, material contracts, and litigation",
  "keyFindings": [
    "Important finding 1",
    "Important finding 2"
  ],
  "redFlags": [
    "Concern or issue 1",
    "Concern or issue 2"
  ],
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "openItems": [
    "Item requiring follow-up 1",
    "Item requiring follow-up 2"
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.summary,
    });

    const ddSummary = client.parseJSONResponse<DueDiligenceSummary>(response.content);

    return {
      success: true,
      data: normalizeDDSummary(ddSummary),
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
 * Generate a quick summary for preview
 */
export async function generateQuickSummary(
  documentContent: string,
  maxSentences: number = 3
): Promise<AIResponse<string>> {
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
    const prompt = `Summarize the following document in ${maxSentences} sentences or less. Focus on the most important information.

Document:
${documentContent}

Provide only the summary text, no additional formatting.`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: 256,
      temperature: AI_CONFIG.temperature.summary,
    });

    return {
      success: true,
      data: response.content.trim(),
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
 * Generate key bullet points from a document
 */
export async function generateBulletPoints(
  documentContent: string,
  maxPoints: number = 5
): Promise<AIResponse<string[]>> {
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
    const prompt = `Extract the ${maxPoints} most important points from the following document.

Document:
${documentContent}

Return as a JSON array of strings:
["Point 1", "Point 2", ...]`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: 512,
      temperature: AI_CONFIG.temperature.summary,
    });

    const points = client.parseJSONResponse<string[]>(response.content);

    return {
      success: true,
      data: points.slice(0, maxPoints),
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
 * Generate a summary tailored for a specific audience
 */
export async function generateAudienceSummary(
  documentContent: string,
  audience: 'board' | 'investor' | 'legal' | 'operations' | 'general'
): Promise<AIResponse<DocumentSummary>> {
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

  const audienceGuidance: Record<string, string> = {
    board: 'Focus on strategic implications, governance matters, and high-level financial impact. Keep it concise and actionable.',
    investor: 'Emphasize financial performance, valuation metrics, growth potential, and risk factors. Include relevant market comparisons.',
    legal: 'Highlight legal risks, contractual obligations, regulatory compliance, and potential liability exposure. Be precise with legal terminology.',
    operations: 'Focus on operational capabilities, integration considerations, synergies, and execution risks. Include timeline implications.',
    general: 'Provide a balanced overview suitable for a general business audience. Avoid excessive jargon.',
  };

  try {
    const prompt = `Create a summary of the following document tailored for ${audience === 'board' ? 'board members' : audience === 'investor' ? 'investors' : audience} audience.

${audienceGuidance[audience]}

Document:
${documentContent}

Return as JSON:
{
  "overview": "Executive summary paragraph",
  "keyFindings": ["Finding 1", "Finding 2", ...],
  "importantMetrics": {"metric name": "value", ...},
  "risksAndConcerns": ["Risk 1", "Risk 2", ...],
  "recommendations": ["Recommendation 1", ...],
  "nextSteps": ["Action item 1", ...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.summary,
    });

    const parsed = client.parseJSONResponse<Partial<DocumentSummary>>(response.content);
    const summary = normalizeSummary(parsed);

    return {
      success: true,
      data: summary,
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

function parseSummaryResponse(content: string, options: SummaryOptions): DocumentSummary {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(extractJSON(content));
    return normalizeSummary(parsed);
  } catch {
    // If not JSON, treat as plain text summary
    return {
      overview: content.trim(),
      keyFindings: [],
      importantMetrics: {},
      risksAndConcerns: options.includeRisks !== false ? [] : [],
      recommendations: options.includeRecommendations !== false ? [] : [],
      createdAt: new Date(),
    };
  }
}

function extractJSON(content: string): string {
  // Try to find JSON in the content
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }
  return content;
}

function normalizeSummary(parsed: Partial<DocumentSummary>): DocumentSummary {
  return {
    overview: parsed.overview || '',
    keyFindings: parsed.keyFindings || [],
    importantMetrics: parsed.importantMetrics || {},
    risksAndConcerns: parsed.risksAndConcerns || [],
    recommendations: parsed.recommendations || [],
    nextSteps: parsed.nextSteps,
    documentType: parsed.documentType,
    createdAt: new Date(),
  };
}

function normalizeBriefing(briefing: Partial<ExecutiveBriefing>): ExecutiveBriefing {
  return {
    headline: briefing.headline || 'Executive Summary',
    overview: briefing.overview || '',
    keyTakeaways: briefing.keyTakeaways || [],
    financialHighlights: briefing.financialHighlights || {},
    riskSummary: briefing.riskSummary || '',
    nextSteps: briefing.nextSteps || [],
    appendix: briefing.appendix,
  };
}

function normalizeDDSummary(summary: Partial<DueDiligenceSummary>): DueDiligenceSummary {
  return {
    targetOverview: summary.targetOverview || '',
    financialSummary: summary.financialSummary || '',
    operationalSummary: summary.operationalSummary || '',
    legalSummary: summary.legalSummary || '',
    keyFindings: summary.keyFindings || [],
    redFlags: summary.redFlags || [],
    recommendations: summary.recommendations || [],
    openItems: summary.openItems || [],
  };
}

function createEmptyMetadata(): AIResponseMetadata {
  return {
    model: 'unknown',
    tokensUsed: { input: 0, output: 0, total: 0 },
    processingTime: 0,
    timestamp: new Date(),
  };
}
