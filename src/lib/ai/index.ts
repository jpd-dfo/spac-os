// ============================================================================
// SPAC OS AI Module - Export Index
// ============================================================================

// Claude Client
export {
  ClaudeClient,
  getClaudeClient,
  createClaudeClient,
  resetClaudeClient,
  estimateTokens,
  truncateToTokenLimit,
  withTimeout,
  type ClaudeMessage,
  type ClaudeClientConfig,
  type ClaudeRequestOptions,
  type StreamChunk,
} from './claude';

// Legacy Client (for backward compatibility)
export { AIClient, getAIClient, createAIClient, type AIRequestOptions } from './client';

// Types
export * from './types';

// Prompts
export { SYSTEM_PROMPTS, USER_PROMPTS, RESPONSE_SCHEMAS, AI_CONFIG } from './prompts';

// Document Analyzer
export {
  analyzeDocument,
  extractKeyTerms,
  summarizeLongDocument,
  identifyRedFlags,
  extractFinancialData,
  compareDocumentVersions,
  extractActionItems,
  generateDocumentInsights,
  type DocumentAnalysisOptions,
  type DocumentMetadata,
  type ExtractedKeyTerms,
  type KeyTerm,
  type Definition,
  type Acronym,
  type RedFlag,
  type ActionItem,
  type ComparisonRequest,
} from './document-analyzer';

// Deal Scorer
export {
  scoreDeal,
  generateInvestmentThesis,
  analyzeRisksAndOpportunities,
  compareToDeSpacs,
  recommendNextSteps,
  scoreCategoryDetail,
  type DealScore,
  type CategoryScore,
  type DealScoreBreakdown,
  type DeSpacComparison,
  type TargetInfo,
  type ScoringWeights,
  type DealScoringOptions,
} from './deal-scorer';

// Research Agent
export {
  researchCompany,
  analyzeMarket,
  analyzeCompetitors,
  analyzeNewsContext,
  generateResearchMemo,
  analyzeManagementTeam,
  researchIndustryTrends,
  type CompanyProfile,
  type BusinessModelAnalysis,
  type ManagementTeamMember,
  type MarketAnalysis,
  type CompetitivePosition,
  type CompetitorProfile,
  type FinancialHighlights,
  type ResearchMemo,
  type NewsItem,
  type ResearchOptions,
  type FundingRound,
} from './research-agent';

// Compliance Agent
export {
  monitorFilingDeadlines,
  analyzeCommentLetter,
  reviewDisclosures,
  detectPolicyViolations,
  generateComplianceCalendar,
  performComplianceReview,
  draftCommentResponse,
  type FilingType,
  type FilingDeadline,
  type SECComment,
  type CommentLetterAnalysis,
  type ComplianceCheckResult,
  type ComplianceReview,
  type DisclosureRequirement,
  type PolicyViolation,
  type ComplianceCalendarEvent,
} from './compliance-agent';

// Existing AI Functions (from other files)
export { extractContractTerms, extractParties, extractDates, extractFinancialTerms, extractConditions, extractTerminationProvisions, extractIndemnificationTerms } from './contractExtractor';
export { parseFinancialStatements } from './financialParser';
export { detectRisks, detectCategoryRisks, detectContractRedFlags, detectFinancialRisks, calculateRiskScore, generateMitigationPlan } from './riskDetector';
export { generateSummary, generateExecutiveBriefing, generateDueDiligenceSummary, generateQuickSummary, generateBulletPoints, generateAudienceSummary } from './summaryGenerator';
export { compareDocuments } from './comparisonEngine';
