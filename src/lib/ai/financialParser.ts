// ============================================================================
// SPAC OS Financial Parser - Parse financial statements and extract metrics
// ============================================================================

import { getAIClient, type AIRequestOptions } from './client';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';

import type {
  FinancialData,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  FinancialMetrics,
  AIResponse,
  AIResponseMetadata,
  AIError,
} from './types';

/**
 * Financial parsing options
 */
export interface FinancialParsingOptions {
  periodType?: 'annual' | 'quarterly' | 'ltm' | 'ytd';
  currency?: string;
  includeRatios?: boolean;
  compareToPrior?: boolean;
}

/**
 * Multi-period financial data
 */
export interface MultiPeriodFinancials {
  periods: FinancialData[];
  trends: FinancialTrends;
  summary: string;
}

/**
 * Financial trends across periods
 */
export interface FinancialTrends {
  revenueGrowthTrend: number[];
  marginTrend: number[];
  profitabilityTrend: 'improving' | 'stable' | 'declining';
  leverageTrend: 'increasing' | 'stable' | 'decreasing';
  notes: string[];
}

/**
 * Valuation metrics
 */
export interface ValuationMetrics {
  enterpriseValue?: number;
  equityValue?: number;
  evRevenue?: number;
  evEbitda?: number;
  priceEarnings?: number;
  priceBook?: number;
  priceSales?: number;
  impliedPremium?: number;
}

/**
 * Parse financial statements from a document
 */
export async function parseFinancialStatements(
  documentContent: string,
  options: FinancialParsingOptions = {}
): Promise<AIResponse<FinancialData>> {
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
      systemPrompt: SYSTEM_PROMPTS.financialParser,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    };

    const prompt = USER_PROMPTS.parseFinancials(documentContent, options.periodType);
    const response = await client.sendMessage(prompt, requestOptions);

    const parsedData = client.parseJSONResponse<Partial<FinancialData>>(response.content);
    const normalizedData = normalizeFinancialData(parsedData, options);

    return {
      success: true,
      data: normalizedData,
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
 * Parse multiple periods of financial data
 */
export async function parseMultiPeriodFinancials(
  documentContent: string,
  options: FinancialParsingOptions = {}
): Promise<AIResponse<MultiPeriodFinancials>> {
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
    const prompt = `Parse all available financial periods from the following document. Extract data for each period separately and identify trends.

Document:
${documentContent}

Return as JSON:
{
  "periods": [
    {
      "period": "...",
      "periodEnd": "...",
      "currency": "...",
      "incomeStatement": {...},
      "balanceSheet": {...},
      "cashFlow": {...},
      "metrics": {...}
    }
  ],
  "trends": {
    "revenueGrowthTrend": [...],
    "marginTrend": [...],
    "profitabilityTrend": "improving|stable|declining",
    "leverageTrend": "increasing|stable|decreasing",
    "notes": [...]
  },
  "summary": "..."
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.financialParser,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const parsedData = client.parseJSONResponse<MultiPeriodFinancials>(response.content);

    // Normalize each period
    const normalizedPeriods = parsedData.periods.map((period) =>
      normalizeFinancialData(period, options)
    );

    return {
      success: true,
      data: {
        periods: normalizedPeriods,
        trends: parsedData.trends || {
          revenueGrowthTrend: [],
          marginTrend: [],
          profitabilityTrend: 'stable',
          leverageTrend: 'stable',
          notes: [],
        },
        summary: parsedData.summary || '',
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
 * Extract income statement data
 */
export async function parseIncomeStatement(
  documentContent: string
): Promise<AIResponse<IncomeStatement>> {
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
    const prompt = `Extract income statement data from the following document. Return all values in the same currency unit (typically thousands or millions as stated).

Document:
${documentContent}

Return as JSON:
{
  "revenue": ...,
  "costOfRevenue": ...,
  "grossProfit": ...,
  "operatingExpenses": ...,
  "operatingIncome": ...,
  "netIncome": ...,
  "ebitda": ...,
  "eps": ...
}

Use null for values not found.`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.financialParser,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const data = client.parseJSONResponse<IncomeStatement>(response.content);

    return {
      success: true,
      data: normalizeIncomeStatement(data),
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
 * Extract balance sheet data
 */
export async function parseBalanceSheet(
  documentContent: string
): Promise<AIResponse<BalanceSheet>> {
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
    const prompt = `Extract balance sheet data from the following document. Return all values in the same currency unit.

Document:
${documentContent}

Return as JSON:
{
  "totalAssets": ...,
  "totalLiabilities": ...,
  "totalEquity": ...,
  "cash": ...,
  "debt": ...,
  "workingCapital": ...,
  "currentAssets": ...,
  "currentLiabilities": ...
}

Use null for values not found.`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.financialParser,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const data = client.parseJSONResponse<BalanceSheet>(response.content);

    return {
      success: true,
      data: normalizeBalanceSheet(data),
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
 * Extract cash flow statement data
 */
export async function parseCashFlowStatement(
  documentContent: string
): Promise<AIResponse<CashFlowStatement>> {
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
    const prompt = `Extract cash flow statement data from the following document.

Document:
${documentContent}

Return as JSON:
{
  "operatingCashFlow": ...,
  "investingCashFlow": ...,
  "financingCashFlow": ...,
  "freeCashFlow": ...,
  "capitalExpenditures": ...
}

Use null for values not found. Free cash flow = Operating cash flow - Capital expenditures.`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.financialParser,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const data = client.parseJSONResponse<CashFlowStatement>(response.content);

    return {
      success: true,
      data: normalizeCashFlow(data),
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
 * Calculate valuation metrics from financial data
 */
export async function calculateValuationMetrics(
  documentContent: string,
  enterpriseValue?: number
): Promise<AIResponse<ValuationMetrics>> {
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
    const prompt = `Based on the following document, extract or calculate valuation metrics.
${enterpriseValue ? `The enterprise value is ${enterpriseValue}.` : ''}

Document:
${documentContent}

Return as JSON:
{
  "enterpriseValue": ...,
  "equityValue": ...,
  "evRevenue": ...,
  "evEbitda": ...,
  "priceEarnings": ...,
  "priceBook": ...,
  "priceSales": ...,
  "impliedPremium": ...
}

Use null for values that cannot be determined.`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.financialParser,
      maxTokens: AI_CONFIG.maxTokens.extraction,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const metrics = client.parseJSONResponse<ValuationMetrics>(response.content);

    return {
      success: true,
      data: metrics,
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
 * Calculate financial ratios from extracted data
 */
export function calculateFinancialRatios(data: FinancialData): FinancialMetrics {
  const { incomeStatement, balanceSheet } = data;
  const metrics: FinancialMetrics = {
    revenueGrowth: data.metrics?.revenueGrowth ?? null,
    grossMargin: null,
    operatingMargin: null,
    ebitdaMargin: null,
    netMargin: null,
    currentRatio: null,
    debtToEquity: null,
    returnOnEquity: null,
    returnOnAssets: null,
    assetTurnover: null,
  };

  // Calculate margins
  if (incomeStatement.revenue && incomeStatement.revenue !== 0) {
    if (incomeStatement.grossProfit !== null) {
      metrics.grossMargin = (incomeStatement.grossProfit / incomeStatement.revenue) * 100;
    }
    if (incomeStatement.operatingIncome !== null) {
      metrics.operatingMargin = (incomeStatement.operatingIncome / incomeStatement.revenue) * 100;
    }
    if (incomeStatement.ebitda !== null) {
      metrics.ebitdaMargin = (incomeStatement.ebitda / incomeStatement.revenue) * 100;
    }
    if (incomeStatement.netIncome !== null) {
      metrics.netMargin = (incomeStatement.netIncome / incomeStatement.revenue) * 100;
    }
  }

  // Calculate balance sheet ratios
  const currentAssets = balanceSheet.currentAssets;
  const currentLiabilities = balanceSheet.currentLiabilities;
  if (currentAssets != null && currentLiabilities != null && currentLiabilities !== 0) {
    metrics.currentRatio = currentAssets / currentLiabilities;
  }
  const debt = balanceSheet.debt;
  const totalEquity = balanceSheet.totalEquity;
  if (debt != null && totalEquity != null && totalEquity !== 0) {
    metrics.debtToEquity = debt / totalEquity;
  }

  // Calculate return ratios
  const netIncome = incomeStatement.netIncome;
  if (netIncome != null) {
    if (totalEquity != null && totalEquity !== 0) {
      metrics.returnOnEquity = (netIncome / totalEquity) * 100;
    }
    const totalAssets = balanceSheet.totalAssets;
    if (totalAssets != null && totalAssets !== 0) {
      metrics.returnOnAssets = (netIncome / totalAssets) * 100;
    }
  }

  // Asset turnover
  const totalAssetsForTurnover = balanceSheet.totalAssets;
  if (incomeStatement.revenue && totalAssetsForTurnover != null && totalAssetsForTurnover !== 0) {
    metrics.assetTurnover = incomeStatement.revenue / totalAssetsForTurnover;
  }

  return metrics;
}

// ============================================================================
// Normalization Helper Functions
// ============================================================================

function normalizeFinancialData(
  data: Partial<FinancialData>,
  options: FinancialParsingOptions
): FinancialData {
  const incomeStatement = normalizeIncomeStatement(data.incomeStatement || {});
  const balanceSheet = normalizeBalanceSheet(data.balanceSheet || {});
  const cashFlow = normalizeCashFlow(data.cashFlow || {});

  const normalized: FinancialData = {
    period: data.period || 'Unknown',
    periodEnd: data.periodEnd,
    currency: options.currency || data.currency || 'USD',
    incomeStatement,
    balanceSheet,
    cashFlow,
    metrics: data.metrics || {
      revenueGrowth: null,
      grossMargin: null,
      operatingMargin: null,
      ebitdaMargin: null,
      netMargin: null,
      currentRatio: null,
      debtToEquity: null,
      returnOnEquity: null,
    },
    notes: data.notes,
  };

  // Calculate metrics if requested
  if (options.includeRatios !== false) {
    normalized.metrics = calculateFinancialRatios(normalized);
  }

  return normalized;
}

function normalizeIncomeStatement(data: Partial<IncomeStatement>): IncomeStatement {
  return {
    revenue: normalizeNumber(data.revenue),
    costOfRevenue: normalizeNumber(data.costOfRevenue),
    grossProfit: normalizeNumber(data.grossProfit),
    operatingExpenses: normalizeNumber(data.operatingExpenses),
    operatingIncome: normalizeNumber(data.operatingIncome),
    netIncome: normalizeNumber(data.netIncome),
    ebitda: normalizeNumber(data.ebitda),
    eps: normalizeNumber(data.eps),
  };
}

function normalizeBalanceSheet(data: Partial<BalanceSheet>): BalanceSheet {
  return {
    totalAssets: normalizeNumber(data.totalAssets),
    totalLiabilities: normalizeNumber(data.totalLiabilities),
    totalEquity: normalizeNumber(data.totalEquity),
    cash: normalizeNumber(data.cash),
    debt: normalizeNumber(data.debt),
    workingCapital: normalizeNumber(data.workingCapital),
    currentAssets: normalizeNumber(data.currentAssets),
    currentLiabilities: normalizeNumber(data.currentLiabilities),
  };
}

function normalizeCashFlow(data: Partial<CashFlowStatement>): CashFlowStatement {
  return {
    operatingCashFlow: normalizeNumber(data.operatingCashFlow),
    investingCashFlow: normalizeNumber(data.investingCashFlow),
    financingCashFlow: normalizeNumber(data.financingCashFlow),
    freeCashFlow: normalizeNumber(data.freeCashFlow),
    capitalExpenditures: normalizeNumber(data.capitalExpenditures),
  };
}

function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) {return null;}
  if (typeof value === 'number' && !isNaN(value)) {return value;}
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleaned = value.replace(/[$,]/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

function createEmptyMetadata(): AIResponseMetadata {
  return {
    model: 'unknown',
    tokensUsed: { input: 0, output: 0, total: 0 },
    processingTime: 0,
    timestamp: new Date(),
  };
}
