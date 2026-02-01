// ============================================================================
// SPAC OS AI Types - TypeScript type definitions for AI module
// ============================================================================

/**
 * Severity levels for risk assessment
 */
export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Risk categories for document analysis
 */
export type RiskCategory =
  | 'legal'
  | 'financial'
  | 'operational'
  | 'market'
  | 'transaction'
  | 'disclosure'
  | 'regulatory'
  | 'other';

/**
 * Document analysis types
 */
export type AnalysisType =
  | 'contract'
  | 'financial'
  | 'risk'
  | 'summary'
  | 'comparison'
  | 'general';

/**
 * Summary types
 */
export type SummaryType = 'brief' | 'detailed' | 'executive';

/**
 * Change materiality levels
 */
export type Materiality = 'immaterial' | 'notable' | 'material' | 'critical';

/**
 * Change types for document comparison
 */
export type ChangeType = 'addition' | 'deletion' | 'modification';

// ============================================================================
// AI Response Types
// ============================================================================

/**
 * Base AI response structure
 */
export interface AIResponse<T> {
  success: boolean;
  data?: T;
  error?: AIError;
  metadata: AIResponseMetadata;
}

/**
 * AI error information
 */
export interface AIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/**
 * Metadata about the AI response
 */
export interface AIResponseMetadata {
  model: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  processingTime: number;
  timestamp: Date;
  requestId?: string;
}

// ============================================================================
// Contract Extraction Types
// ============================================================================

/**
 * Contract party information
 */
export interface ContractParty {
  name: string;
  role: string;
  type: 'buyer' | 'seller' | 'target' | 'sponsor' | 'advisor' | 'other';
  address?: string;
  jurisdiction?: string;
}

/**
 * Contract date information
 */
export interface ContractDate {
  type: string;
  date: string;
  description: string;
  isDeadline: boolean;
}

/**
 * Financial terms in contracts
 */
export interface FinancialTerms {
  purchasePrice?: string;
  purchasePriceValue?: number;
  currency?: string;
  earnouts: EarnoutTerm[];
  escrows: EscrowTerm[];
  adjustments: AdjustmentTerm[];
}

/**
 * Earnout term definition
 */
export interface EarnoutTerm {
  description: string;
  amount?: number;
  conditions: string[];
  period?: string;
}

/**
 * Escrow term definition
 */
export interface EscrowTerm {
  amount: number;
  purpose: string;
  releaseConditions: string[];
  duration?: string;
}

/**
 * Adjustment term definition
 */
export interface AdjustmentTerm {
  type: string;
  description: string;
  mechanism?: string;
}

/**
 * Contract condition
 */
export interface ContractCondition {
  type: 'closing' | 'precedent' | 'subsequent';
  description: string;
  responsibleParty?: string;
  status?: 'pending' | 'satisfied' | 'waived' | 'failed';
}

/**
 * Contract covenant
 */
export interface ContractCovenant {
  type: 'affirmative' | 'negative';
  description: string;
  period: 'pre-closing' | 'post-closing' | 'both';
}

/**
 * Termination provisions
 */
export interface TerminationProvisions {
  rights: TerminationRight[];
  fees: {
    breakFee?: number;
    reverseFee?: number;
    expenseCap?: number;
  };
}

/**
 * Termination right
 */
export interface TerminationRight {
  holder: string;
  trigger: string;
  notice?: string;
  consequences?: string;
}

/**
 * Indemnification terms
 */
export interface IndemnificationTerms {
  caps: {
    general?: number;
    fundamental?: number;
    taxMatters?: number;
  };
  baskets: {
    deductible?: number;
    tippingBasket?: number;
    miniBasket?: number;
  };
  survival: {
    general?: string;
    fundamental?: string;
    taxMatters?: string;
  };
}

/**
 * Complete contract terms extraction result
 */
export interface ContractTerms {
  parties: ContractParty[];
  dates: ContractDate[];
  financialTerms: FinancialTerms;
  conditions: ContractCondition[];
  representations: string[];
  warranties: string[];
  covenants: {
    preCLosing: ContractCovenant[];
    postClosing: ContractCovenant[];
  };
  termination: TerminationProvisions;
  indemnification: IndemnificationTerms;
  keyTermsSummary?: string;
}

// ============================================================================
// Financial Parsing Types
// ============================================================================

/**
 * Income statement data
 */
export interface IncomeStatement {
  revenue: number | null;
  costOfRevenue: number | null;
  grossProfit: number | null;
  operatingExpenses: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  ebitda: number | null;
  eps?: number | null;
}

/**
 * Balance sheet data
 */
export interface BalanceSheet {
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  cash: number | null;
  debt: number | null;
  workingCapital: number | null;
  currentAssets?: number | null;
  currentLiabilities?: number | null;
}

/**
 * Cash flow statement data
 */
export interface CashFlowStatement {
  operatingCashFlow: number | null;
  investingCashFlow: number | null;
  financingCashFlow: number | null;
  freeCashFlow: number | null;
  capitalExpenditures?: number | null;
}

/**
 * Financial metrics and ratios
 */
export interface FinancialMetrics {
  revenueGrowth: number | null;
  grossMargin: number | null;
  operatingMargin: number | null;
  ebitdaMargin: number | null;
  netMargin: number | null;
  currentRatio: number | null;
  debtToEquity: number | null;
  returnOnEquity: number | null;
  returnOnAssets?: number | null;
  assetTurnover?: number | null;
}

/**
 * Complete financial data extraction result
 */
export interface FinancialData {
  period: string;
  periodEnd?: string;
  currency?: string;
  incomeStatement: IncomeStatement;
  balanceSheet: BalanceSheet;
  cashFlow: CashFlowStatement;
  metrics: FinancialMetrics;
  notes?: string[];
}

// ============================================================================
// Risk Detection Types
// ============================================================================

/**
 * Identified risk item
 */
export interface RiskItem {
  id: string;
  category: RiskCategory;
  title: string;
  description: string;
  severity: RiskSeverity;
  impact: string;
  mitigation: string;
  relatedSections: string[];
  confidence?: number;
}

/**
 * Risk analysis result
 */
export interface RiskAnalysis {
  risks: RiskItem[];
  overallRiskLevel: RiskSeverity;
  summary: string;
  risksByCategory: Record<RiskCategory, number>;
  risksBySeverity: Record<RiskSeverity, number>;
  topRisks: RiskItem[];
}

// ============================================================================
// Summary Types
// ============================================================================

/**
 * Document summary result
 */
export interface DocumentSummary {
  overview: string;
  keyFindings: string[];
  importantMetrics: Record<string, string | number>;
  risksAndConcerns: string[];
  recommendations: string[];
  nextSteps?: string[];
  documentType?: string;
  createdAt: Date;
}

// ============================================================================
// Comparison Types
// ============================================================================

/**
 * Document change item
 */
export interface DocumentChange {
  id: string;
  type: ChangeType;
  section: string;
  original: string;
  modified: string;
  materiality: Materiality;
  impact: string;
  lineNumber?: number;
}

/**
 * Document comparison result
 */
export interface DocumentComparison {
  summary: string;
  totalChanges: number;
  changesByMateriality: Record<Materiality, number>;
  changesByType: Record<ChangeType, number>;
  changes: DocumentChange[];
  recommendations: string[];
  significantChanges: DocumentChange[];
}

// ============================================================================
// RAG Pipeline Types
// ============================================================================

/**
 * Document chunk for vector storage
 */
export interface DocumentChunk {
  id: string;
  documentId: string;
  content: string;
  metadata: {
    pageNumber?: number;
    section?: string;
    chunkIndex: number;
    totalChunks: number;
  };
  embedding?: number[];
}

/**
 * Search result from RAG pipeline
 */
export interface RAGSearchResult {
  chunk: DocumentChunk;
  score: number;
  highlights?: string[];
}

/**
 * RAG query response
 */
export interface RAGResponse {
  answer: string;
  sources: RAGSearchResult[];
  confidence: number;
  followUpQuestions?: string[];
}

/**
 * Chat message in Q&A interface
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: RAGSearchResult[];
  metadata?: Record<string, unknown>;
}

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  documentIds: string[];
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Analysis Request/Response Types
// ============================================================================

/**
 * Document analysis request
 */
export interface AnalysisRequest {
  documentId: string;
  documentName: string;
  documentContent: string;
  documentType?: string;
  analysisTypes: AnalysisType[];
  options?: AnalysisOptions;
}

/**
 * Analysis options
 */
export interface AnalysisOptions {
  summaryType?: SummaryType;
  includeRiskAnalysis?: boolean;
  extractFinancials?: boolean;
  extractContractTerms?: boolean;
  customPrompt?: string;
}

/**
 * Complete document analysis result
 */
export interface DocumentAnalysisResult {
  documentId: string;
  documentName: string;
  analysisTypes: AnalysisType[];
  summary?: DocumentSummary;
  contractTerms?: ContractTerms;
  financialData?: FinancialData;
  riskAnalysis?: RiskAnalysis;
  metadata: AIResponseMetadata;
  completedAt: Date;
}

// ============================================================================
// Widget/UI Types
// ============================================================================

/**
 * AI Insight for dashboard widget
 */
export interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'action' | 'info';
  title: string;
  description: string;
  severity?: RiskSeverity;
  documentId?: string;
  documentName?: string;
  createdAt: Date;
  actionUrl?: string;
}

/**
 * Analysis status for tracking
 */
export interface AnalysisStatus {
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  currentStep?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}
