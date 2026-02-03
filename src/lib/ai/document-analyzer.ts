// ============================================================================
// SPAC OS Document Analyzer - Comprehensive Document Intelligence
// ============================================================================

import { getClaudeClient, type ClaudeRequestOptions } from './claude';
import { compareDocuments } from './comparisonEngine';
import { extractContractTerms } from './contractExtractor';
import { parseFinancialStatements } from './financialParser';
import { SYSTEM_PROMPTS, AI_CONFIG } from './prompts';
import { detectRisks } from './riskDetector';
import { generateSummary, generateExecutiveBriefing } from './summaryGenerator';

import type {
  DocumentAnalysisResult,
  DocumentSummary,
  ContractTerms,
  FinancialData,
  RiskAnalysis,
  DocumentComparison,
  AIResponse,
  AIResponseMetadata,
  AIError,
  AnalysisType,
} from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Document analysis options
 */
export interface DocumentAnalysisOptions {
  analysisTypes?: AnalysisType[];
  summaryType?: 'brief' | 'detailed' | 'executive';
  includeRiskAnalysis?: boolean;
  extractFinancials?: boolean;
  extractContractTerms?: boolean;
  generateActionItems?: boolean;
  customPrompt?: string;
}

/**
 * Document metadata for analysis
 */
export interface DocumentMetadata {
  id: string;
  name: string;
  type?: string;
  category?: string;
  size?: number;
  uploadedAt?: Date;
}

/**
 * Key terms extracted from documents
 */
export interface ExtractedKeyTerms {
  terms: KeyTerm[];
  definitions: Definition[];
  acronyms: Acronym[];
}

/**
 * Individual key term
 */
export interface KeyTerm {
  term: string;
  context: string;
  importance: 'high' | 'medium' | 'low';
  category: string;
}

/**
 * Definition from document
 */
export interface Definition {
  term: string;
  definition: string;
  section?: string;
}

/**
 * Acronym found in document
 */
export interface Acronym {
  acronym: string;
  expansion: string;
  firstOccurrence?: string;
}

/**
 * Red flag item
 */
export interface RedFlag {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  section?: string;
  recommendation: string;
  impact: string;
}

/**
 * Action item extracted from document
 */
export interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate?: string;
  assignee?: string;
  source: string;
  status: 'pending' | 'in_progress' | 'completed';
}

/**
 * Document comparison request
 */
export interface ComparisonRequest {
  document1: {
    id: string;
    name: string;
    content: string;
  };
  document2: {
    id: string;
    name: string;
    content: string;
  };
  focusAreas?: string[];
}

// ============================================================================
// Main Analysis Functions
// ============================================================================

/**
 * Perform comprehensive document analysis
 */
export async function analyzeDocument(
  documentContent: string,
  metadata: DocumentMetadata,
  options: DocumentAnalysisOptions = {}
): Promise<AIResponse<DocumentAnalysisResult>> {
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

  const startTime = Date.now();
  const analysisTypes = options.analysisTypes || ['summary', 'risk'];
  const results: Partial<DocumentAnalysisResult> = {
    documentId: metadata.id,
    documentName: metadata.name,
    analysisTypes,
  };

  try {
    // Run analyses in parallel where possible
    const analysisPromises: Promise<void>[] = [];

    // Summary analysis
    if (analysisTypes.includes('summary') || analysisTypes.includes('general')) {
      analysisPromises.push(
        generateSummary(documentContent, { type: options.summaryType }).then((res) => {
          if (res.success && res.data) {
            results.summary = res.data;
          }
        })
      );
    }

    // Contract terms extraction
    if (analysisTypes.includes('contract') || options.extractContractTerms) {
      analysisPromises.push(
        extractContractTerms(documentContent).then((res) => {
          if (res.success && res.data) {
            results.contractTerms = res.data;
          }
        })
      );
    }

    // Financial data extraction
    if (analysisTypes.includes('financial') || options.extractFinancials) {
      analysisPromises.push(
        parseFinancialStatements(documentContent).then((res) => {
          if (res.success && res.data) {
            results.financialData = res.data;
          }
        })
      );
    }

    // Risk analysis
    if (analysisTypes.includes('risk') || options.includeRiskAnalysis) {
      analysisPromises.push(
        detectRisks(documentContent, { documentType: metadata.type }).then((res) => {
          if (res.success && res.data) {
            results.riskAnalysis = res.data;
          }
        })
      );
    }

    await Promise.all(analysisPromises);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data: {
        ...results,
        metadata: {
          model: AI_CONFIG.models.default,
          tokensUsed: { input: 0, output: 0, total: 0 },
          processingTime,
          timestamp: new Date(),
        },
        completedAt: new Date(),
      } as DocumentAnalysisResult,
      metadata: {
        model: AI_CONFIG.models.default,
        tokensUsed: { input: 0, output: 0, total: 0 },
        processingTime,
        timestamp: new Date(),
      },
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
 * Extract key terms from a document
 */
export async function extractKeyTerms(
  documentContent: string,
  documentType?: string
): Promise<AIResponse<ExtractedKeyTerms>> {
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
    const prompt = `Analyze the following ${documentType || 'document'} and extract:
1. Key terms and concepts (with context and importance level)
2. Defined terms and their definitions
3. Acronyms and abbreviations used

Document:
${documentContent}

Return as JSON:
{
  "terms": [
    {
      "term": "...",
      "context": "...",
      "importance": "high|medium|low",
      "category": "..."
    }
  ],
  "definitions": [
    {
      "term": "...",
      "definition": "...",
      "section": "..."
    }
  ],
  "acronyms": [
    {
      "acronym": "...",
      "expansion": "...",
      "firstOccurrence": "..."
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.documentAnalyzer,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const extractedTerms = client.parseJSONResponse<ExtractedKeyTerms>(response.content);

    return {
      success: true,
      data: normalizeKeyTerms(extractedTerms),
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
 * Summarize a long document with intelligent chunking
 */
export async function summarizeLongDocument(
  documentContent: string,
  options: {
    maxLength?: number;
    style?: 'executive' | 'detailed' | 'bullet-points';
    focusAreas?: string[];
  } = {}
): Promise<AIResponse<DocumentSummary>> {
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
    // For very long documents, chunk and summarize progressively
    const maxChunkSize = 50000; // Characters
    const chunks = chunkDocument(documentContent, maxChunkSize);

    if (chunks.length === 1) {
      // Document fits in one chunk
      return generateSummary(documentContent, {
        type: options.style === 'executive' ? 'executive' : 'detailed',
        maxLength: options.maxLength,
      });
    }

    // Summarize each chunk
    const chunkSummaries: string[] = [];
    for (const chunk of chunks) {
      const chunkResult = await client.sendMessage(
        `Summarize the following document section concisely:\n\n${chunk}`,
        {
          systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
          maxTokens: 1024,
          temperature: AI_CONFIG.temperature.summary,
        }
      );
      chunkSummaries.push(chunkResult.content);
    }

    // Combine summaries into final summary
    const combinedContext = chunkSummaries.join('\n\n---\n\n');
    const focusContext = options.focusAreas?.length
      ? `\n\nFocus particularly on: ${options.focusAreas.join(', ')}`
      : '';

    const finalPrompt = `Create a cohesive ${options.style || 'detailed'} summary from the following section summaries.
${options.maxLength ? `Keep it under ${options.maxLength} words.` : ''}${focusContext}

Section Summaries:
${combinedContext}

Return as JSON:
{
  "overview": "...",
  "keyFindings": ["...", "..."],
  "importantMetrics": {"metric": "value", ...},
  "risksAndConcerns": ["...", "..."],
  "recommendations": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

    const response = await client.sendMessage(finalPrompt, {
      systemPrompt: SYSTEM_PROMPTS.summaryGenerator,
      maxTokens: AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.summary,
    });

    const summary = client.parseJSONResponse<Partial<DocumentSummary>>(response.content);

    return {
      success: true,
      data: {
        overview: summary.overview || '',
        keyFindings: summary.keyFindings || [],
        importantMetrics: summary.importantMetrics || {},
        risksAndConcerns: summary.risksAndConcerns || [],
        recommendations: summary.recommendations || [],
        nextSteps: summary.nextSteps,
        createdAt: new Date(),
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
 * Identify red flags and concerns in a document
 */
export async function identifyRedFlags(
  documentContent: string,
  documentType?: string
): Promise<AIResponse<RedFlag[]>> {
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
    const prompt = `Analyze the following ${documentType || 'document'} and identify any red flags or concerns.

Look for:
1. Unusual or non-standard terms
2. Missing standard protections
3. One-sided provisions
4. Vague or ambiguous language
5. Potential compliance issues
6. Financial concerns
7. Operational risks
8. Legal liability exposure

Document:
${documentContent}

Return as JSON:
{
  "redFlags": [
    {
      "id": "rf-1",
      "title": "...",
      "description": "...",
      "severity": "low|medium|high|critical",
      "section": "...",
      "recommendation": "...",
      "impact": "..."
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.riskDetector,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const result = client.parseJSONResponse<{ redFlags: Partial<RedFlag>[] }>(response.content);

    return {
      success: true,
      data: normalizeRedFlags(result.redFlags),
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
 * Extract financial data from documents
 */
export async function extractFinancialData(
  documentContent: string,
  options?: {
    period?: string;
    currency?: string;
    focusMetrics?: string[];
  }
): Promise<AIResponse<FinancialData>> {
  return parseFinancialStatements(documentContent, { periodType: options?.period as 'annual' | 'quarterly' | 'ltm' | 'ytd' | undefined });
}

/**
 * Compare two document versions
 */
export async function compareDocumentVersions(
  request: ComparisonRequest
): Promise<AIResponse<DocumentComparison>> {
  return compareDocuments(
    request.document1.content,
    request.document2.content,
    request.document1.name,
    request.document2.name
  );
}

/**
 * Extract action items from a document
 */
export async function extractActionItems(
  documentContent: string,
  context?: string
): Promise<AIResponse<ActionItem[]>> {
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
    const contextInfo = context ? `\n\nContext: ${context}` : '';

    const prompt = `Extract all action items, tasks, and follow-up requirements from the following document.
${contextInfo}

For each action item, identify:
1. The specific task or action required
2. Priority level based on urgency and importance
3. Any mentioned deadlines
4. Responsible party if mentioned
5. The source section or paragraph

Document:
${documentContent}

Return as JSON:
{
  "actionItems": [
    {
      "id": "ai-1",
      "description": "...",
      "priority": "low|medium|high|critical",
      "dueDate": "...",
      "assignee": "...",
      "source": "...",
      "status": "pending"
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.documentAnalyzer,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const result = client.parseJSONResponse<{ actionItems: Partial<ActionItem>[] }>(
      response.content
    );

    return {
      success: true,
      data: normalizeActionItems(result.actionItems),
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
 * Generate document insights for quick preview
 */
export async function generateDocumentInsights(
  documentContent: string,
  documentType?: string
): Promise<
  AIResponse<{
    documentType: string;
    summary: string;
    keyPoints: string[];
    concerns: string[];
    nextSteps: string[];
  }>
> {
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
    const typeHint = documentType ? `This appears to be a ${documentType}.` : '';

    const prompt = `Quickly analyze this document and provide key insights.
${typeHint}

Document (first 10000 chars):
${documentContent.substring(0, 10000)}

Return as JSON:
{
  "documentType": "...",
  "summary": "2-3 sentence summary",
  "keyPoints": ["...", "...", "..."],
  "concerns": ["..."],
  "nextSteps": ["..."]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.documentAnalyzer,
      maxTokens: 1024,
      temperature: AI_CONFIG.temperature.summary,
    });

    const insights = client.parseJSONResponse<{
      documentType: string;
      summary: string;
      keyPoints: string[];
      concerns: string[];
      nextSteps: string[];
    }>(response.content);

    return {
      success: true,
      data: {
        documentType: insights.documentType || 'Unknown',
        summary: insights.summary || '',
        keyPoints: insights.keyPoints || [],
        concerns: insights.concerns || [],
        nextSteps: insights.nextSteps || [],
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
 * Chunk document into smaller pieces
 */
function chunkDocument(content: string, maxChunkSize: number): string[] {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length + 2 > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

/**
 * Normalize key terms response
 */
function normalizeKeyTerms(data: Partial<ExtractedKeyTerms>): ExtractedKeyTerms {
  return {
    terms: (data.terms || []).map((t) => ({
      term: t.term || '',
      context: t.context || '',
      importance: t.importance || 'medium',
      category: t.category || 'general',
    })),
    definitions: (data.definitions || []).map((d) => ({
      term: d.term || '',
      definition: d.definition || '',
      section: d.section,
    })),
    acronyms: (data.acronyms || []).map((a) => ({
      acronym: a.acronym || '',
      expansion: a.expansion || '',
      firstOccurrence: a.firstOccurrence,
    })),
  };
}

/**
 * Normalize red flags response
 */
function normalizeRedFlags(flags: Partial<RedFlag>[]): RedFlag[] {
  return flags.map((flag, index) => ({
    id: flag.id || `rf-${index + 1}`,
    title: flag.title || 'Untitled Red Flag',
    description: flag.description || '',
    severity: normalizeSeverity(flag.severity),
    section: flag.section,
    recommendation: flag.recommendation || '',
    impact: flag.impact || '',
  }));
}

/**
 * Normalize action items response
 */
function normalizeActionItems(items: Partial<ActionItem>[]): ActionItem[] {
  return items.map((item, index) => ({
    id: item.id || `ai-${index + 1}`,
    description: item.description || '',
    priority: normalizePriority(item.priority),
    dueDate: item.dueDate,
    assignee: item.assignee,
    source: item.source || '',
    status: item.status || 'pending',
  }));
}

/**
 * Normalize severity level
 */
function normalizeSeverity(
  severity?: string
): 'low' | 'medium' | 'high' | 'critical' {
  const valid = ['low', 'medium', 'high', 'critical'];
  const normalized = severity?.toLowerCase();
  return valid.includes(normalized || '') ? (normalized as any) : 'medium';
}

/**
 * Normalize priority level
 */
function normalizePriority(
  priority?: string
): 'low' | 'medium' | 'high' | 'critical' {
  const valid = ['low', 'medium', 'high', 'critical'];
  const normalized = priority?.toLowerCase();
  return valid.includes(normalized || '') ? (normalized as any) : 'medium';
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
