'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

import {
  X,
  Sparkles,
  FileText,
  AlertTriangle,
  Link2,
  CheckSquare,
  Tag,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  TrendingUp,
  Clock,
  BookOpen,
  AlertCircle,
  Database,
} from 'lucide-react';

import { ProgressIndicator } from '@/components/shared';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';

import type { AnalysisData, CachedAnalysis } from '@/lib/cache/analysisCache';

import type { DocumentData } from './DocumentCard';

// ============================================================================
// Types for API Response
// ============================================================================

interface APIKeyTerm {
  term: string;
  context?: string;
  definition?: string;
  importance: 'high' | 'medium' | 'low' | 'critical';
  category?: string;
}

interface APIRiskFlag {
  id?: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'critical';
  section?: string;
  page?: number;
  recommendation?: string;
  impact?: string;
}

interface APIActionItem {
  id?: string;
  description: string;
  task?: string;
  priority: 'high' | 'medium' | 'low' | 'critical';
  dueDate?: string;
  assignee?: string;
  source?: string;
  status?: string;
}

interface APIInsight {
  type: string;
  content: string;
}

interface APIFinancialHighlight {
  metric: string;
  value: string;
  change?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type APIData = Record<string, any>;

// ============================================================================
// Internal UI Types
// ============================================================================

interface AIAnalysis {
  summary: string;
  keyTerms: { term: string; definition: string; importance: 'high' | 'medium' | 'low' }[];
  riskFlags: { severity: 'high' | 'medium' | 'low'; title: string; description: string; page?: number }[];
  relatedDocuments: { id: string; name: string; relevance: number; type: string }[];
  actionItems: { task: string; priority: 'high' | 'medium' | 'low'; assignee?: string; dueDate?: Date }[];
  insights: { type: string; content: string }[];
  financialHighlights?: { metric: string; value: string; change?: string }[];
}

interface AIAnalysisPanelProps {
  document: DocumentData;
  documentContent?: string;
  isOpen: boolean;
  onClose: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function normalizeImportance(importance?: string): 'high' | 'medium' | 'low' {
  if (importance === 'critical' || importance === 'high') {
    return 'high';
  }
  if (importance === 'medium') {
    return 'medium';
  }
  return 'low';
}

function normalizeSeverity(severity?: string): 'high' | 'medium' | 'low' {
  if (severity === 'critical' || severity === 'high') {
    return 'high';
  }
  if (severity === 'medium') {
    return 'medium';
  }
  return 'low';
}

function normalizePriority(priority?: string): 'high' | 'medium' | 'low' {
  if (priority === 'critical' || priority === 'high') {
    return 'high';
  }
  if (priority === 'medium') {
    return 'medium';
  }
  return 'low';
}

// ============================================================================
// API Response Transformation
// ============================================================================

function transformAPIResponse(apiData: APIData): AIAnalysis {
  // Handle full analysis response
  const summaryObj = apiData['summary'] as APIData | undefined;
  const riskAnalysis = apiData['riskAnalysis'] as APIData | undefined;

  // Extract summary text
  let summaryText = '';
  if (summaryObj && typeof summaryObj === 'object') {
    summaryText = (summaryObj['overview'] as string) || '';
    if (!summaryText && summaryObj['keyFindings']) {
      summaryText = (summaryObj['keyFindings'] as string[]).join(' ');
    }
  } else if (typeof apiData['overview'] === 'string') {
    summaryText = apiData['overview'];
  } else if (typeof apiData['summary'] === 'string') {
    summaryText = apiData['summary'];
  }

  // Extract key terms
  let keyTerms: AIAnalysis['keyTerms'] = [];
  if (apiData['terms']) {
    const terms = apiData['terms'] as APIKeyTerm[];
    keyTerms = terms.map((t) => ({
      term: t.term,
      definition: t.definition || t.context || '',
      importance: normalizeImportance(t.importance),
    }));
  }

  // Extract risk flags
  let riskFlags: AIAnalysis['riskFlags'] = [];
  if (riskAnalysis?.['risks']) {
    const risks = riskAnalysis['risks'] as APIRiskFlag[];
    riskFlags = risks.map((r) => ({
      severity: normalizeSeverity(r.severity),
      title: r.title,
      description: r.description,
      page: r.page,
    }));
  } else if (apiData['redFlags']) {
    const redFlags = apiData['redFlags'] as APIRiskFlag[];
    riskFlags = redFlags.map((r) => ({
      severity: normalizeSeverity(r.severity),
      title: r.title,
      description: r.description,
      page: r.page,
    }));
  } else if (Array.isArray(apiData)) {
    // Direct array of red flags from 'risks' operation
    riskFlags = (apiData as APIRiskFlag[]).map((r) => ({
      severity: normalizeSeverity(r.severity),
      title: r.title,
      description: r.description,
      page: r.page,
    }));
  }

  // Extract action items
  let actionItems: AIAnalysis['actionItems'] = [];
  if (apiData['actionItems']) {
    const items = apiData['actionItems'] as APIActionItem[];
    actionItems = items.map((a) => ({
      task: a.task || a.description,
      priority: normalizePriority(a.priority),
      assignee: a.assignee,
      dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
    }));
  } else if (Array.isArray(apiData) && (apiData[0] as APIActionItem)?.description) {
    // Direct array of action items from 'actions' operation
    actionItems = (apiData as APIActionItem[]).map((a) => ({
      task: a.task || a.description,
      priority: normalizePriority(a.priority),
      assignee: a.assignee,
      dueDate: a.dueDate ? new Date(a.dueDate) : undefined,
    }));
  }

  // Extract insights
  let insights: AIAnalysis['insights'] = [];
  if (apiData['insights']) {
    insights = apiData['insights'] as APIInsight[];
  } else if (apiData['keyPoints'] || apiData['concerns'] || apiData['nextSteps']) {
    // From 'insights' operation
    const keyPoints = (apiData['keyPoints'] as string[]) || [];
    const concerns = (apiData['concerns'] as string[]) || [];
    const nextSteps = (apiData['nextSteps'] as string[]) || [];

    insights = [
      ...keyPoints.map((p) => ({ type: 'Key Point', content: p })),
      ...concerns.map((c) => ({ type: 'Concern', content: c })),
      ...nextSteps.map((s) => ({ type: 'Next Step', content: s })),
    ];
  }

  // Extract financial highlights
  let financialHighlights: AIAnalysis['financialHighlights'] = undefined;
  if (apiData['financialData']) {
    const financialData = apiData['financialData'] as APIData;
    if (financialData['metrics']) {
      financialHighlights = financialData['metrics'] as APIFinancialHighlight[];
    }
  }

  // Related documents would need to come from a separate API or be derived
  const relatedDocuments: AIAnalysis['relatedDocuments'] = [];

  return {
    summary: summaryText,
    keyTerms,
    riskFlags,
    relatedDocuments,
    actionItems,
    insights,
    financialHighlights,
  };
}

// ============================================================================
// Analysis Steps for Progress Tracking
// ============================================================================

const ANALYSIS_STEPS = [
  'Initializing',
  'Analyzing content',
  'Extracting terms',
  'Identifying risks',
  'Generating summary',
];

// ============================================================================
// Component
// ============================================================================

export function AIAnalysisPanel({ document, documentContent, isOpen, onClose }: AIAnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'risks', 'actions'])
  );
  const [isCached, setIsCached] = useState(false);
  const [cacheTimestamp, setCacheTimestamp] = useState<Date | null>(null);

  // Progress tracking state
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined);

  // Track if initial load has been done to avoid double-fetch on mount
  const initialLoadDone = useRef(false);

  // AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetches cached analysis from the API endpoint
   */
  const fetchCachedAnalysis = useCallback(async (): Promise<CachedAnalysis | null> => {
    try {
      const response = await fetch(`/api/ai/analysis-cache?documentId=${document.id}`);
      if (!response.ok) {
        return null;
      }
      const result = await response.json();
      if (result.success && result.data && result.isFresh) {
        return result.data as CachedAnalysis;
      }
      return null;
    } catch {
      // Cache fetch failed, proceed without cache
      return null;
    }
  }, [document.id]);

  /**
   * Saves analysis to cache via API endpoint
   */
  const saveToCache = useCallback(async (analysisData: AIAnalysis): Promise<void> => {
    try {
      await fetch('/api/ai/analysis-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: document.id,
          analysis: analysisData,
        }),
      });
    } catch {
      // Cache save failed, non-critical
      console.warn('Failed to save analysis to cache');
    }
  }, [document.id]);

  /**
   * Converts cached analysis to the AIAnalysis format used by the UI
   */
  const cachedToUIFormat = useCallback((cached: CachedAnalysis): AIAnalysis => {
    return {
      summary: cached.summary || '',
      keyTerms: (cached.keyTerms as AIAnalysis['keyTerms']) || [],
      riskFlags: (cached.riskFlags as AIAnalysis['riskFlags']) || [],
      relatedDocuments: [],
      actionItems: (cached.actionItems as AIAnalysis['actionItems']) || [],
      insights: (cached.insights as AIAnalysis['insights']) || [],
      financialHighlights: (cached.financialHighlights as AIAnalysis['financialHighlights']) || undefined,
    };
  }, []);

  /**
   * Handles cancellation of ongoing analysis
   */
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsLoading(false);
    setCurrentStep(0);
    setProgress(0);
    setStatusMessage('');
    setEstimatedTime(undefined);
  }, []);

  /**
   * Fetches fresh analysis from the AI API
   */
  const fetchFreshAnalysis = useCallback(async (signal?: AbortSignal): Promise<AIAnalysis | null> => {
    if (!documentContent) {
      throw new Error('Document content is required for AI analysis.');
    }

    const response = await fetch('/api/ai/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: documentContent,
        metadata: {
          id: document.id,
          name: document.name,
          type: document.fileType,
        },
        operation: 'full',
        options: {
          includeRisks: true,
          generateActionItems: true,
          includeFinancials: true,
        },
      }),
      signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || `Analysis failed with status ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    return transformAPIResponse(result.data);
  }, [document.id, document.name, document.fileType, documentContent]);

  /**
   * Main analysis fetching function - checks cache first, then fetches fresh if needed
   */
  const fetchAnalysis = useCallback(async (forceRefresh: boolean = false) => {
    if (!documentContent) {
      setError('Document content is required for AI analysis.');
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsLoading(true);
    setError(null);
    setIsCached(false);
    setCacheTimestamp(null);

    // Initialize progress tracking
    setCurrentStep(0);
    setProgress(0);
    setStatusMessage(ANALYSIS_STEPS[0] ?? 'Initializing');
    setEstimatedTime(30); // Initial estimate: 30 seconds

    try {
      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedAnalysis = await fetchCachedAnalysis();
        if (cachedAnalysis) {
          const analysisData = cachedToUIFormat(cachedAnalysis);
          setAnalysis(analysisData);
          setIsCached(true);
          setCacheTimestamp(cachedAnalysis.createdAt);
          setIsLoading(false);
          setCurrentStep(ANALYSIS_STEPS.length - 1);
          setProgress(100);
          setStatusMessage('Loaded from cache');
          setEstimatedTime(undefined);
          return;
        }
      }

      // Start progress simulation for fresh analysis
      let stepIndex = 0;
      progressIntervalRef.current = setInterval(() => {
        stepIndex = Math.min(stepIndex + 1, ANALYSIS_STEPS.length - 1);
        setCurrentStep(stepIndex);
        setStatusMessage(ANALYSIS_STEPS[stepIndex] ?? 'Analyzing...');
        setProgress((prev) => Math.min(prev + 20, 90)); // Max out at 90% until complete
        setEstimatedTime((prev) => (prev !== undefined && prev > 5 ? prev - 5 : undefined));
      }, 3000);

      // Fetch fresh analysis from AI
      const freshAnalysis = await fetchFreshAnalysis(signal);

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (freshAnalysis) {
        setAnalysis(freshAnalysis);
        setIsCached(false);
        setCacheTimestamp(null);

        // Complete progress
        setCurrentStep(ANALYSIS_STEPS.length - 1);
        setProgress(100);
        setStatusMessage('Analysis complete');
        setEstimatedTime(undefined);

        // Save to cache in background
        saveToCache(freshAnalysis);
      }
    } catch (err) {
      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Don't show error if cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Analysis cancelled by user');
        return;
      }

      console.error('AI Analysis error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [documentContent, fetchCachedAnalysis, cachedToUIFormat, fetchFreshAnalysis, saveToCache]);

  useEffect(() => {
    if (isOpen && documentContent && !initialLoadDone.current) {
      initialLoadDone.current = true;
      fetchAnalysis(false);
    } else if (isOpen && !documentContent) {
      setError('Document content is required for AI analysis.');
      setIsLoading(false);
    }
  }, [isOpen, documentContent, fetchAnalysis]);

  // Reset initial load tracking when panel closes
  useEffect(() => {
    if (!isOpen) {
      initialLoadDone.current = false;
    }
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copySummary = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis.summary);
    }
  };

  const handleRegenerate = () => {
    fetchAnalysis(true); // Force refresh, bypass cache
  };

  const handleRefreshAnalysis = () => {
    fetchAnalysis(true); // Force refresh, bypass cache
  };

  const severityColors = {
    high: 'border-danger-200 bg-danger-50',
    medium: 'border-warning-200 bg-warning-50',
    low: 'border-slate-200 bg-slate-50',
  };

  const severityBadge = {
    high: 'danger',
    medium: 'warning',
    low: 'secondary',
  } as const;

  const priorityBadge = {
    high: 'danger',
    medium: 'warning',
    low: 'secondary',
  } as const;

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] border-l border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">AI Document Analysis</h2>
            <p className="text-sm text-slate-500">{document.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Refresh Analysis button */}
          {analysis && !isLoading && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAnalysis}
              title="Refresh Analysis"
              className="text-slate-400 hover:text-slate-600"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Cached Analysis Indicator */}
      {isCached && analysis && !isLoading && (
        <div className="flex items-center justify-between border-b border-slate-200 bg-blue-50 px-6 py-2">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Database className="h-4 w-4" />
            <span>Using cached analysis</span>
            {cacheTimestamp && (
              <span className="text-blue-500">
                (from {formatDate(cacheTimestamp)})
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshAnalysis}
            className="text-blue-700 hover:text-blue-800 hover:bg-blue-100"
          >
            <RefreshCw className="mr-1 h-3 w-3" />
            Refresh
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="h-[calc(100%-73px)] overflow-y-auto">
        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-100">
              <AlertCircle className="h-8 w-8 text-danger-600" />
            </div>
            <p className="mt-4 font-medium text-slate-900">Analysis Failed</p>
            <p className="mt-2 text-sm text-slate-500 text-center max-w-xs">{error}</p>
            {documentContent && (
              <Button
                variant="secondary"
                size="sm"
                className="mt-4"
                onClick={handleRegenerate}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* Loading State with Progress Indicator */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-6">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Document</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">
              AI is processing your document to extract insights
            </p>
            <div className="w-full max-w-sm">
              <ProgressIndicator
                progress={progress}
                status={statusMessage}
                steps={ANALYSIS_STEPS}
                currentStep={currentStep}
                onCancel={handleCancel}
                estimatedTimeRemaining={estimatedTime}
              />
            </div>
          </div>
        )}

        {/* Analysis Results */}
        {!isLoading && !error && analysis && (
          <div className="space-y-4 p-4">
            {/* Summary Section */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('summary')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-slate-900">Summary</span>
                </div>
                {expandedSections.has('summary') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('summary') && (
                <div className="border-t border-slate-200 p-4">
                  {analysis.summary ? (
                    <>
                      <p className="text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
                      <button
                        onClick={copySummary}
                        className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:underline"
                      >
                        <Copy className="h-3 w-3" />
                        Copy summary
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No summary available</p>
                  )}
                </div>
              )}
            </div>

            {/* Financial Highlights */}
            {analysis.financialHighlights && analysis.financialHighlights.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => toggleSection('financial')}
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-slate-900">Financial Highlights</span>
                  </div>
                  {expandedSections.has('financial') ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                {expandedSections.has('financial') && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {analysis.financialHighlights.map((item, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">{item.metric}</p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-slate-900">{item.value}</span>
                            {item.change && (
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  item.change.startsWith('+') || item.change.startsWith('-')
                                    ? item.change.startsWith('+')
                                      ? 'text-success-600'
                                      : 'text-danger-600'
                                    : 'text-slate-500'
                                )}
                              >
                                {item.change}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Terms */}
            {analysis.keyTerms.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => toggleSection('terms')}
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-slate-900">Key Terms</span>
                    <Badge variant="secondary" size="sm">
                      {analysis.keyTerms.length}
                    </Badge>
                  </div>
                  {expandedSections.has('terms') ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                {expandedSections.has('terms') && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="space-y-3">
                      {analysis.keyTerms.map((term, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-50 p-3">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{term.term}</span>
                            <Badge
                              variant={term.importance === 'high' ? 'danger' : term.importance === 'medium' ? 'warning' : 'secondary'}
                              size="sm"
                            >
                              {term.importance}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{term.definition}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Risk Flags */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('risks')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-danger-600" />
                  <span className="font-medium text-slate-900">Risk Flags</span>
                  {analysis.riskFlags.length > 0 && (
                    <Badge variant="danger" size="sm">
                      {analysis.riskFlags.filter((r) => r.severity === 'high').length} High
                    </Badge>
                  )}
                </div>
                {expandedSections.has('risks') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('risks') && (
                <div className="border-t border-slate-200 p-4">
                  {analysis.riskFlags.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.riskFlags.map((risk, idx) => (
                        <div
                          key={idx}
                          className={cn('rounded-lg border p-3', severityColors[risk.severity])}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-900">{risk.title}</span>
                            <Badge variant={severityBadge[risk.severity]} size="sm">
                              {risk.severity}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{risk.description}</p>
                          {risk.page && (
                            <button className="mt-2 text-xs text-primary-600 hover:underline">
                              Go to page {risk.page}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No risk flags identified</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('actions')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-success-600" />
                  <span className="font-medium text-slate-900">Action Items</span>
                  {analysis.actionItems.length > 0 && (
                    <Badge variant="primary" size="sm">
                      {analysis.actionItems.length}
                    </Badge>
                  )}
                </div>
                {expandedSections.has('actions') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('actions') && (
                <div className="border-t border-slate-200 p-4">
                  {analysis.actionItems.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.actionItems.map((action, idx) => (
                        <div key={idx} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{action.task}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                              {action.assignee && <span>{action.assignee}</span>}
                              {action.dueDate && (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(action.dueDate)}
                                </span>
                              )}
                              <Badge variant={priorityBadge[action.priority]} size="sm">
                                {action.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 italic">No action items identified</p>
                  )}
                </div>
              )}
            </div>

            {/* Related Documents */}
            {analysis.relatedDocuments.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => toggleSection('related')}
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-slate-900">Related Documents</span>
                  </div>
                  {expandedSections.has('related') ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                {expandedSections.has('related') && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="space-y-2">
                      {analysis.relatedDocuments.map((doc) => (
                        <button
                          key={doc.id}
                          className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                        >
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                            <p className="text-xs text-slate-500">{doc.type}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                              <div
                                className="h-full bg-primary-500"
                                style={{ width: `${doc.relevance}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{doc.relevance}%</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Insights */}
            {analysis.insights.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => toggleSection('insights')}
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-slate-900">AI Insights</span>
                  </div>
                  {expandedSections.has('insights') ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                {expandedSections.has('insights') && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="space-y-3">
                      {analysis.insights.map((insight, idx) => (
                        <div key={idx} className="rounded-lg bg-gradient-to-r from-primary-50 to-purple-50 p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant="primary" size="sm">
                              {insight.type}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-700">{insight.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Refresh Analysis */}
            <div className="flex flex-col items-center gap-2 py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshAnalysis}
                disabled={isLoading}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                {isCached ? 'Refresh Analysis' : 'Regenerate Analysis'}
              </Button>
              {isCached && cacheTimestamp && (
                <p className="text-xs text-slate-400">
                  Last analyzed: {formatDate(cacheTimestamp)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
