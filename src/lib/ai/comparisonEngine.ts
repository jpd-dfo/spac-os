// ============================================================================
// SPAC OS Comparison Engine - Compare multiple documents/versions
// ============================================================================

import { getAIClient, type AIRequestOptions } from './client';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';
import type {
  DocumentComparison,
  DocumentChange,
  Materiality,
  ChangeType,
  AIResponse,
  AIResponseMetadata,
  AIError,
} from './types';

/**
 * Comparison options
 */
export interface ComparisonOptions {
  focusSections?: string[];
  includeMaterialityAssessment?: boolean;
  highlightCriticalChanges?: boolean;
  compareSemantics?: boolean;
}

/**
 * Section-level comparison result
 */
export interface SectionComparison {
  sectionName: string;
  hasChanges: boolean;
  changeCount: number;
  materialityLevel: Materiality;
  changes: DocumentChange[];
  summary: string;
}

/**
 * Term tracking result
 */
export interface TermEvolution {
  termName: string;
  versions: {
    documentName: string;
    value: string;
    date?: string;
  }[];
  trend: 'favorable' | 'neutral' | 'unfavorable';
  notes: string;
}

/**
 * Compare two documents
 */
export async function compareDocuments(
  doc1Content: string,
  doc2Content: string,
  doc1Name: string,
  doc2Name: string,
  options: ComparisonOptions = {}
): Promise<AIResponse<DocumentComparison>> {
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
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.comparison,
      temperature: AI_CONFIG.temperature.extraction,
    };

    const prompt = USER_PROMPTS.compareDocuments(doc1Content, doc2Content, doc1Name, doc2Name);
    const response = await client.sendMessage(prompt, requestOptions);

    const comparison = client.parseJSONResponse<Partial<DocumentComparison>>(response.content);
    const normalizedComparison = normalizeComparison(comparison, options);

    return {
      success: true,
      data: normalizedComparison,
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
 * Compare specific sections of documents
 */
export async function compareSections(
  doc1Content: string,
  doc2Content: string,
  sectionNames: string[]
): Promise<AIResponse<SectionComparison[]>> {
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
    const sectionsString = sectionNames.join(', ');

    const prompt = `Compare the following sections between two document versions: ${sectionsString}

**Document 1 (Original):**
${doc1Content}

**Document 2 (Revised):**
${doc2Content}

For each section, provide:
1. Whether there are any changes
2. Number of changes
3. Overall materiality of changes
4. Detailed list of changes
5. Summary of the changes

Return as JSON:
{
  "sections": [
    {
      "sectionName": "...",
      "hasChanges": true/false,
      "changeCount": ...,
      "materialityLevel": "immaterial|notable|material|critical",
      "changes": [
        {
          "id": "...",
          "type": "addition|deletion|modification",
          "section": "...",
          "original": "...",
          "modified": "...",
          "materiality": "...",
          "impact": "..."
        }
      ],
      "summary": "..."
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.comparison,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const parsed = client.parseJSONResponse<{ sections: Partial<SectionComparison>[] }>(
      response.content
    );
    const normalizedSections = parsed.sections.map(normalizeSectionComparison);

    return {
      success: true,
      data: normalizedSections,
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
 * Track evolution of specific terms across multiple document versions
 */
export async function trackTermEvolution(
  documents: { name: string; content: string; date?: string }[],
  terms: string[]
): Promise<AIResponse<TermEvolution[]>> {
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
    const documentsString = documents
      .map((doc, i) => `**Document ${i + 1} (${doc.name}${doc.date ? ` - ${doc.date}` : ''}):**\n${doc.content}`)
      .join('\n\n---\n\n');

    const termsString = terms.join(', ');

    const prompt = `Track how the following terms have evolved across these document versions: ${termsString}

${documentsString}

For each term, show:
1. The value in each document version
2. Whether the trend is favorable, neutral, or unfavorable from a buyer's perspective
3. Notes on the significance of changes

Return as JSON:
{
  "terms": [
    {
      "termName": "...",
      "versions": [
        {
          "documentName": "...",
          "value": "...",
          "date": "..."
        }
      ],
      "trend": "favorable|neutral|unfavorable",
      "notes": "..."
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.comparison,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const parsed = client.parseJSONResponse<{ terms: TermEvolution[] }>(response.content);

    return {
      success: true,
      data: parsed.terms || [],
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
 * Generate a redline summary (changes only)
 */
export async function generateRedlineSummary(
  doc1Content: string,
  doc2Content: string,
  doc1Name: string,
  doc2Name: string
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
    const prompt = `Create a concise redline summary showing the key changes between these two documents.

**Document 1 (${doc1Name}):**
${doc1Content}

**Document 2 (${doc2Name}):**
${doc2Content}

Format the summary as:
1. Brief overview of total changes
2. Material changes (most important)
3. Notable changes
4. Minor/clarifying changes

Use clear formatting to distinguish additions, deletions, and modifications.`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.summary,
      temperature: AI_CONFIG.temperature.summary,
    });

    return {
      success: true,
      data: response.content,
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
 * Identify new provisions added in a revised document
 */
export async function identifyNewProvisions(
  originalContent: string,
  revisedContent: string
): Promise<AIResponse<DocumentChange[]>> {
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
    const prompt = `Identify all new provisions, clauses, or sections that have been added in the revised document that were not present in the original.

**Original Document:**
${originalContent}

**Revised Document:**
${revisedContent}

For each new provision, assess its materiality and potential impact.

Return as JSON:
{
  "newProvisions": [
    {
      "id": "...",
      "type": "addition",
      "section": "Section where added",
      "original": "",
      "modified": "Full text of new provision",
      "materiality": "immaterial|notable|material|critical",
      "impact": "Description of potential impact"
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const parsed = client.parseJSONResponse<{ newProvisions: Partial<DocumentChange>[] }>(
      response.content
    );
    const normalizedChanges = parsed.newProvisions.map((change, index) =>
      normalizeChange(change, index)
    );

    return {
      success: true,
      data: normalizedChanges,
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
 * Identify deleted provisions from a revised document
 */
export async function identifyDeletedProvisions(
  originalContent: string,
  revisedContent: string
): Promise<AIResponse<DocumentChange[]>> {
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
    const prompt = `Identify all provisions, clauses, or sections that have been removed in the revised document that were present in the original.

**Original Document:**
${originalContent}

**Revised Document:**
${revisedContent}

For each deleted provision, assess its materiality and potential impact.

Return as JSON:
{
  "deletedProvisions": [
    {
      "id": "...",
      "type": "deletion",
      "section": "Section where removed",
      "original": "Full text of removed provision",
      "modified": "",
      "materiality": "immaterial|notable|material|critical",
      "impact": "Description of potential impact"
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const parsed = client.parseJSONResponse<{ deletedProvisions: Partial<DocumentChange>[] }>(
      response.content
    );
    const normalizedChanges = parsed.deletedProvisions.map((change, index) =>
      normalizeChange(change, index)
    );

    return {
      success: true,
      data: normalizedChanges,
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
 * Compare financial terms between document versions
 */
export async function compareFinancialTerms(
  doc1Content: string,
  doc2Content: string
): Promise<AIResponse<{
  changes: DocumentChange[];
  summary: string;
  netImpact: 'favorable' | 'neutral' | 'unfavorable';
}>> {
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
    const prompt = `Compare the financial terms between these two document versions. Focus on:
- Purchase price and consideration
- Earnouts and contingent payments
- Escrows and holdbacks
- Indemnification caps and baskets
- Working capital adjustments
- Break fees and expense caps

**Document 1:**
${doc1Content}

**Document 2:**
${doc2Content}

Assess whether changes are favorable or unfavorable from a buyer's perspective.

Return as JSON:
{
  "changes": [
    {
      "id": "...",
      "type": "modification",
      "section": "Financial term category",
      "original": "Original value/term",
      "modified": "New value/term",
      "materiality": "immaterial|notable|material|critical",
      "impact": "Favorable/Unfavorable and why"
    }
  ],
  "summary": "Overall summary of financial term changes",
  "netImpact": "favorable|neutral|unfavorable"
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.comparisonEngine,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const parsed = client.parseJSONResponse<{
      changes: Partial<DocumentChange>[];
      summary: string;
      netImpact: 'favorable' | 'neutral' | 'unfavorable';
    }>(response.content);

    return {
      success: true,
      data: {
        changes: parsed.changes.map((c, i) => normalizeChange(c, i)),
        summary: parsed.summary || '',
        netImpact: parsed.netImpact || 'neutral',
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
// Normalization Helper Functions
// ============================================================================

function normalizeComparison(
  comparison: Partial<DocumentComparison>,
  options: ComparisonOptions
): DocumentComparison {
  const changes = (comparison.changes || []).map((change, index) =>
    normalizeChange(change, index)
  );

  // Filter by focus sections if specified
  const filteredChanges = options.focusSections
    ? changes.filter((change) =>
        options.focusSections!.some((section) =>
          change.section.toLowerCase().includes(section.toLowerCase())
        )
      )
    : changes;

  // Calculate aggregates
  const changesByMateriality = calculateChangesByMateriality(filteredChanges);
  const changesByType = calculateChangesByType(filteredChanges);

  // Get significant changes
  const significantChanges = filteredChanges.filter(
    (change) => change.materiality === 'critical' || change.materiality === 'material'
  );

  return {
    summary: comparison.summary || generateComparisonSummary(filteredChanges),
    totalChanges: filteredChanges.length,
    changesByMateriality,
    changesByType,
    changes: filteredChanges,
    recommendations: comparison.recommendations || [],
    significantChanges,
  };
}

function normalizeChange(change: Partial<DocumentChange>, index: number): DocumentChange {
  return {
    id: change.id || `change-${index + 1}`,
    type: normalizeChangeType(change.type),
    section: change.section || 'Unknown Section',
    original: change.original || '',
    modified: change.modified || '',
    materiality: normalizeMateriality(change.materiality),
    impact: change.impact || '',
    lineNumber: change.lineNumber,
  };
}

function normalizeSectionComparison(section: Partial<SectionComparison>): SectionComparison {
  return {
    sectionName: section.sectionName || 'Unknown Section',
    hasChanges: section.hasChanges ?? false,
    changeCount: section.changeCount ?? 0,
    materialityLevel: normalizeMateriality(section.materialityLevel),
    changes: (section.changes || []).map((c, i) => normalizeChange(c, i)),
    summary: section.summary || '',
  };
}

function normalizeChangeType(type?: string): ChangeType {
  const validTypes: ChangeType[] = ['addition', 'deletion', 'modification'];
  const normalized = type?.toLowerCase() as ChangeType;
  return validTypes.includes(normalized) ? normalized : 'modification';
}

function normalizeMateriality(materiality?: string): Materiality {
  const validLevels: Materiality[] = ['immaterial', 'notable', 'material', 'critical'];
  const normalized = materiality?.toLowerCase() as Materiality;
  return validLevels.includes(normalized) ? normalized : 'notable';
}

function calculateChangesByMateriality(changes: DocumentChange[]): Record<Materiality, number> {
  const counts: Record<Materiality, number> = {
    immaterial: 0,
    notable: 0,
    material: 0,
    critical: 0,
  };

  for (const change of changes) {
    counts[change.materiality]++;
  }

  return counts;
}

function calculateChangesByType(changes: DocumentChange[]): Record<ChangeType, number> {
  const counts: Record<ChangeType, number> = {
    addition: 0,
    deletion: 0,
    modification: 0,
  };

  for (const change of changes) {
    counts[change.type]++;
  }

  return counts;
}

function generateComparisonSummary(changes: DocumentChange[]): string {
  if (changes.length === 0) {
    return 'No significant changes detected between the documents.';
  }

  const critical = changes.filter((c) => c.materiality === 'critical').length;
  const material = changes.filter((c) => c.materiality === 'material').length;
  const additions = changes.filter((c) => c.type === 'addition').length;
  const deletions = changes.filter((c) => c.type === 'deletion').length;
  const modifications = changes.filter((c) => c.type === 'modification').length;

  const parts: string[] = [];
  parts.push(`Found ${changes.length} change${changes.length === 1 ? '' : 's'}.`);

  if (critical > 0 || material > 0) {
    parts.push(`${critical + material} significant (${critical} critical, ${material} material).`);
  }

  parts.push(`${additions} additions, ${deletions} deletions, ${modifications} modifications.`);

  return parts.join(' ');
}

function createEmptyMetadata(): AIResponseMetadata {
  return {
    model: 'unknown',
    tokensUsed: { input: 0, output: 0, total: 0 },
    processingTime: 0,
    timestamp: new Date(),
  };
}
