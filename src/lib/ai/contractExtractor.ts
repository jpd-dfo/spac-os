// ============================================================================
// SPAC OS Contract Extractor - Extract key terms from contracts
// ============================================================================

import { getAIClient, type AIRequestOptions } from './client';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';

import type {
  ContractTerms,
  ContractParty,
  ContractDate,
  FinancialTerms,
  ContractCondition,
  ContractCovenant,
  TerminationProvisions,
  IndemnificationTerms,
  AIResponse,
  AIResponseMetadata,
  AIError,
} from './types';

/**
 * Contract extraction options
 */
export interface ContractExtractionOptions {
  includeFullAnalysis?: boolean;
  extractParties?: boolean;
  extractDates?: boolean;
  extractFinancialTerms?: boolean;
  extractConditions?: boolean;
  extractCovenants?: boolean;
  extractTermination?: boolean;
  extractIndemnification?: boolean;
}

/**
 * Default extraction options
 */
const DEFAULT_OPTIONS: ContractExtractionOptions = {
  includeFullAnalysis: true,
  extractParties: true,
  extractDates: true,
  extractFinancialTerms: true,
  extractConditions: true,
  extractCovenants: true,
  extractTermination: true,
  extractIndemnification: true,
};

/**
 * Extract key contract terms from a document
 */
export async function extractContractTerms(
  documentContent: string,
  options: ContractExtractionOptions = DEFAULT_OPTIONS
): Promise<AIResponse<ContractTerms>> {
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
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    };

    const prompt = USER_PROMPTS.extractContractTerms(documentContent);
    const response = await client.sendMessage(prompt, requestOptions);

    const extractedTerms = client.parseJSONResponse<Partial<ContractTerms>>(response.content);

    // Validate and normalize the extracted data
    const normalizedTerms = normalizeContractTerms(extractedTerms, options);

    return {
      success: true,
      data: normalizedTerms,
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
 * Extract only party information from a contract
 */
export async function extractParties(
  documentContent: string
): Promise<AIResponse<ContractParty[]>> {
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
    const prompt = `Extract all parties from the following contract. For each party, identify:
1. Full legal name
2. Role in the transaction (buyer, seller, target, sponsor, advisor, etc.)
3. Entity type (corporation, LLC, individual, etc.)
4. Address if mentioned
5. Jurisdiction if mentioned

Document:
${documentContent}

Return as JSON array:
[
  {
    "name": "...",
    "role": "...",
    "type": "...",
    "address": "...",
    "jurisdiction": "..."
  }
]`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const parties = client.parseJSONResponse<ContractParty[]>(response.content);

    return {
      success: true,
      data: normalizeParties(parties),
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
 * Extract only key dates from a contract
 */
export async function extractDates(
  documentContent: string
): Promise<AIResponse<ContractDate[]>> {
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
    const prompt = `Extract all significant dates from the following contract. For each date, identify:
1. Type of date (execution date, effective date, closing date, deadline, milestone, etc.)
2. The actual date or date formula
3. Description of what the date relates to
4. Whether it's a hard deadline

Document:
${documentContent}

Return as JSON array:
[
  {
    "type": "...",
    "date": "...",
    "description": "...",
    "isDeadline": true/false
  }
]`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const dates = client.parseJSONResponse<ContractDate[]>(response.content);

    return {
      success: true,
      data: normalizeDates(dates),
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
 * Extract financial terms from a contract
 */
export async function extractFinancialTerms(
  documentContent: string
): Promise<AIResponse<FinancialTerms>> {
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
    const prompt = `Extract all financial terms from the following contract, including:
1. Purchase price (amount and form of consideration)
2. Earnout provisions (milestones, amounts, conditions)
3. Escrow amounts and terms
4. Purchase price adjustments (working capital, debt, cash)
5. Any other financial commitments or payments

Document:
${documentContent}

Return as JSON:
{
  "purchasePrice": "...",
  "purchasePriceValue": ...,
  "currency": "...",
  "earnouts": [
    {
      "description": "...",
      "amount": ...,
      "conditions": [...],
      "period": "..."
    }
  ],
  "escrows": [
    {
      "amount": ...,
      "purpose": "...",
      "releaseConditions": [...],
      "duration": "..."
    }
  ],
  "adjustments": [
    {
      "type": "...",
      "description": "...",
      "mechanism": "..."
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const financialTerms = client.parseJSONResponse<FinancialTerms>(response.content);

    return {
      success: true,
      data: normalizeFinancialTerms(financialTerms),
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
 * Extract closing conditions from a contract
 */
export async function extractConditions(
  documentContent: string
): Promise<AIResponse<ContractCondition[]>> {
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
    const prompt = `Extract all closing conditions and conditions precedent from the following contract. For each condition, identify:
1. Type (closing condition, condition precedent, condition subsequent)
2. Full description of the condition
3. Which party is responsible for satisfying it
4. Current status if determinable

Document:
${documentContent}

Return as JSON array:
[
  {
    "type": "...",
    "description": "...",
    "responsibleParty": "...",
    "status": "pending|satisfied|waived|failed"
  }
]`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const conditions = client.parseJSONResponse<ContractCondition[]>(response.content);

    return {
      success: true,
      data: normalizeConditions(conditions),
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
 * Extract termination provisions from a contract
 */
export async function extractTerminationProvisions(
  documentContent: string
): Promise<AIResponse<TerminationProvisions>> {
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
    const prompt = `Extract all termination provisions from the following contract, including:
1. Termination rights (who can terminate, under what circumstances)
2. Break fees and reverse break fees
3. Expense reimbursement caps
4. Notice requirements

Document:
${documentContent}

Return as JSON:
{
  "rights": [
    {
      "holder": "...",
      "trigger": "...",
      "notice": "...",
      "consequences": "..."
    }
  ],
  "fees": {
    "breakFee": ...,
    "reverseFee": ...,
    "expenseCap": ...
  }
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const termination = client.parseJSONResponse<TerminationProvisions>(response.content);

    return {
      success: true,
      data: normalizeTerminationProvisions(termination),
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
 * Extract indemnification terms from a contract
 */
export async function extractIndemnificationTerms(
  documentContent: string
): Promise<AIResponse<IndemnificationTerms>> {
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
    const prompt = `Extract all indemnification terms from the following contract, including:
1. Cap amounts (general, fundamental reps, tax matters)
2. Basket thresholds (deductible, tipping basket, mini-basket)
3. Survival periods (general, fundamental reps, tax matters)
4. Any carve-outs or special provisions

Document:
${documentContent}

Return as JSON:
{
  "caps": {
    "general": ...,
    "fundamental": ...,
    "taxMatters": ...
  },
  "baskets": {
    "deductible": ...,
    "tippingBasket": ...,
    "miniBasket": ...
  },
  "survival": {
    "general": "...",
    "fundamental": "...",
    "taxMatters": "..."
  }
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.contractExtractor,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const indemnification = client.parseJSONResponse<IndemnificationTerms>(response.content);

    return {
      success: true,
      data: normalizeIndemnificationTerms(indemnification),
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

function normalizeContractTerms(
  terms: Partial<ContractTerms>,
  options: ContractExtractionOptions
): ContractTerms {
  return {
    parties: options.extractParties !== false
      ? normalizeParties(terms.parties || [])
      : [],
    dates: options.extractDates !== false
      ? normalizeDates(terms.dates || [])
      : [],
    financialTerms: options.extractFinancialTerms !== false
      ? normalizeFinancialTerms(terms.financialTerms || {})
      : { earnouts: [], escrows: [], adjustments: [] },
    conditions: options.extractConditions !== false
      ? normalizeConditions(terms.conditions || [])
      : [],
    representations: terms.representations || [],
    warranties: terms.warranties || [],
    covenants: options.extractCovenants !== false
      ? normalizeCovenants(terms.covenants)
      : { preCLosing: [], postClosing: [] },
    termination: options.extractTermination !== false
      ? normalizeTerminationProvisions(terms.termination || { rights: [], fees: {} })
      : { rights: [], fees: {} },
    indemnification: options.extractIndemnification !== false
      ? normalizeIndemnificationTerms(terms.indemnification || { caps: {}, baskets: {}, survival: {} })
      : { caps: {}, baskets: {}, survival: {} },
    keyTermsSummary: terms.keyTermsSummary,
  };
}

function normalizeParties(parties: Partial<ContractParty>[]): ContractParty[] {
  return parties.map((party) => ({
    name: party.name || 'Unknown Party',
    role: party.role || 'Unknown',
    type: normalizePartyType(party.type),
    address: party.address,
    jurisdiction: party.jurisdiction,
  }));
}

function normalizePartyType(type?: string): ContractParty['type'] {
  const validTypes: ContractParty['type'][] = ['buyer', 'seller', 'target', 'sponsor', 'advisor', 'other'];
  const normalizedType = type?.toLowerCase() as ContractParty['type'];
  return validTypes.includes(normalizedType) ? normalizedType : 'other';
}

function normalizeDates(dates: Partial<ContractDate>[]): ContractDate[] {
  return dates.map((date) => ({
    type: date.type || 'Unknown',
    date: date.date || 'Not specified',
    description: date.description || '',
    isDeadline: date.isDeadline ?? false,
  }));
}

function normalizeFinancialTerms(terms: Partial<FinancialTerms>): FinancialTerms {
  return {
    purchasePrice: terms.purchasePrice,
    purchasePriceValue: terms.purchasePriceValue,
    currency: terms.currency || 'USD',
    earnouts: terms.earnouts || [],
    escrows: terms.escrows || [],
    adjustments: terms.adjustments || [],
  };
}

function normalizeConditions(conditions: Partial<ContractCondition>[]): ContractCondition[] {
  return conditions.map((condition) => ({
    type: normalizeConditionType(condition.type),
    description: condition.description || '',
    responsibleParty: condition.responsibleParty,
    status: condition.status,
  }));
}

function normalizeConditionType(type?: string): ContractCondition['type'] {
  const typeMap: Record<string, ContractCondition['type']> = {
    'closing': 'closing',
    'precedent': 'precedent',
    'subsequent': 'subsequent',
    'condition precedent': 'precedent',
    'closing condition': 'closing',
  };
  return typeMap[type?.toLowerCase() || ''] || 'closing';
}

function normalizeCovenants(
  covenants?: Partial<{ preCLosing: ContractCovenant[]; postClosing: ContractCovenant[] }>
): { preCLosing: ContractCovenant[]; postClosing: ContractCovenant[] } {
  return {
    preCLosing: covenants?.preCLosing || [],
    postClosing: covenants?.postClosing || [],
  };
}

function normalizeTerminationProvisions(
  provisions: Partial<TerminationProvisions>
): TerminationProvisions {
  return {
    rights: provisions.rights || [],
    fees: {
      breakFee: provisions.fees?.breakFee,
      reverseFee: provisions.fees?.reverseFee,
      expenseCap: provisions.fees?.expenseCap,
    },
  };
}

function normalizeIndemnificationTerms(
  terms: Partial<IndemnificationTerms>
): IndemnificationTerms {
  return {
    caps: {
      general: terms.caps?.general,
      fundamental: terms.caps?.fundamental,
      taxMatters: terms.caps?.taxMatters,
    },
    baskets: {
      deductible: terms.baskets?.deductible,
      tippingBasket: terms.baskets?.tippingBasket,
      miniBasket: terms.baskets?.miniBasket,
    },
    survival: {
      general: terms.survival?.general,
      fundamental: terms.survival?.fundamental,
      taxMatters: terms.survival?.taxMatters,
    },
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
