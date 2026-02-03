'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

import {
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Users,
  BarChart3,
  DollarSign,
  Settings,
  Handshake,
  ChevronDown,
  ChevronUp,
  Sparkles,
  History,
} from 'lucide-react';

import { ProgressIndicator } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

// Score calculation steps for progress tracking
const SCORE_STEPS = [
  'Analyzing target',
  'Calculating scores',
  'Generating thesis',
];
import {
  ScoreHistory,
  TrendBadge,
  type ScoreHistoryEntry,
  type ScoreTrendData,
  type ScoreTrend,
} from './ScoreHistory';

// ============================================================================
// Types
// ============================================================================

export interface AIScoreCardProps {
  targetId: string;
  targetName: string;
  targetData: {
    name: string;
    sector?: string;
    description?: string;
    valuation?: number;
    revenue?: number;
    ebitda?: number;
  };
  existingScore?: number;
  onScoreUpdate?: (score: number) => void;
}

interface CategoryScore {
  name: string;
  score: number;
  icon: React.ReactNode;
  description: string;
}

interface AIScoreResponse {
  overallScore: number;
  letterGrade: string;
  categories: {
    management: number;
    market: number;
    financial: number;
    operational: number;
    transaction: number;
  };
  thesis: string;
  risks: string[];
  opportunities: string[];
  confidence: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getLetterGrade(score: number): string {
  if (score >= 90) {
    return 'A';
  }
  if (score >= 80) {
    return 'B';
  }
  if (score >= 70) {
    return 'C';
  }
  if (score >= 60) {
    return 'D';
  }
  return 'F';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'text-success-600 bg-success-100';
    case 'B':
      return 'text-primary-600 bg-primary-100';
    case 'C':
      return 'text-warning-600 bg-warning-100';
    case 'D':
      return 'text-orange-600 bg-orange-100';
    case 'F':
      return 'text-danger-600 bg-danger-100';
    default:
      return 'text-slate-600 bg-slate-100';
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) {
    return 'bg-success-500';
  }
  if (score >= 60) {
    return 'bg-primary-500';
  }
  if (score >= 40) {
    return 'bg-warning-500';
  }
  return 'bg-danger-500';
}

function getScoreTextColor(score: number): string {
  if (score >= 80) {
    return 'text-success-600';
  }
  if (score >= 60) {
    return 'text-primary-600';
  }
  if (score >= 40) {
    return 'text-warning-600';
  }
  return 'text-danger-600';
}

// ============================================================================
// Sub-Components
// ============================================================================

function ScoreGauge({ score, size = 'lg' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const grade = getLetterGrade(score);
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-28 w-28',
    lg: 'h-36 w-36',
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const gradeSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('relative', sizeClasses[size])}>
      <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-slate-200"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn(
            'transition-all duration-1000 ease-out',
            score >= 80 ? 'text-success-500' : '',
            score >= 60 && score < 80 ? 'text-primary-500' : '',
            score >= 40 && score < 60 ? 'text-warning-500' : '',
            score < 40 ? 'text-danger-500' : ''
          )}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-bold', textSizeClasses[size], getScoreTextColor(score))}>
          {score}
        </span>
        <span className={cn('font-semibold', gradeSizeClasses[size], getScoreTextColor(score))}>
          {grade}
        </span>
      </div>
    </div>
  );
}

function CategoryScoreBar({ category }: { category: CategoryScore }) {
  return (
    <Tooltip content={category.description}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">{category.icon}</span>
            <span className="text-sm font-medium text-slate-700">{category.name}</span>
          </div>
          <span className={cn('text-sm font-semibold', getScoreTextColor(category.score))}>
            {category.score}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn('h-full rounded-full transition-all duration-500', getScoreColor(category.score))}
            style={{ width: `${category.score}%` }}
          />
        </div>
      </div>
    </Tooltip>
  );
}

function RiskItem({ risk }: { risk: string }) {
  return (
    <div className="flex items-start gap-2">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-danger-500" />
      <span className="text-sm text-slate-600">{risk}</span>
    </div>
  );
}

function OpportunityItem({ opportunity }: { opportunity: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500" />
      <span className="text-sm text-slate-600">{opportunity}</span>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AIScoreCard({
  targetId,
  targetName,
  targetData,
  existingScore,
  onScoreUpdate,
}: AIScoreCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scoreData, setScoreData] = useState<AIScoreResponse | null>(
    existingScore
      ? {
          overallScore: existingScore,
          letterGrade: getLetterGrade(existingScore),
          categories: {
            management: 0,
            market: 0,
            financial: 0,
            operational: 0,
            transaction: 0,
          },
          thesis: '',
          risks: [],
          opportunities: [],
          confidence: 0,
        }
      : null
  );
  const [isExpanded, setIsExpanded] = useState(true);

  // Progress tracking state
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined);

  // AbortController for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Score history state
  const [scoreHistory, setScoreHistory] = useState<ScoreHistoryEntry[]>([]);
  const [scoreTrend, setScoreTrend] = useState<ScoreTrendData>({
    trend: 'new',
    changePercent: 0,
    previousScore: null,
    currentScore: existingScore || 0,
    scoreCount: 0,
    averageScore: 0,
  });
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  // Fetch score history on mount
  const fetchScoreHistory = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const response = await fetch(`/api/score-history?targetId=${targetId}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setScoreHistory(data.history || []);
        setScoreTrend(data.trend || {
          trend: 'new',
          changePercent: 0,
          previousScore: null,
          currentScore: existingScore || 0,
          scoreCount: 0,
          averageScore: 0,
        });
      }
    } catch (err) {
      // Silently fail - history is optional
      console.warn('Failed to fetch score history:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [targetId, existingScore]);

  useEffect(() => {
    if (targetId) {
      fetchScoreHistory();
    }
  }, [targetId, fetchScoreHistory]);

  // Save score to history
  const saveScoreToHistory = useCallback(async (scoreResponse: AIScoreResponse) => {
    try {
      await fetch('/api/score-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetId,
          scoreData: {
            overallScore: scoreResponse.overallScore,
            managementScore: scoreResponse.categories.management,
            marketScore: scoreResponse.categories.market,
            financialScore: scoreResponse.categories.financial,
            operationalScore: scoreResponse.categories.operational,
            transactionScore: scoreResponse.categories.transaction,
            thesis: scoreResponse.thesis,
          },
        }),
      });
      // Refresh history after saving
      fetchScoreHistory();
    } catch (err) {
      // Silently fail - history saving is optional
      console.warn('Failed to save score to history:', err);
    }
  }, [targetId, fetchScoreHistory]);

  const calculateScore = useCallback(async () => {
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

    // Initialize progress tracking
    setCurrentStep(0);
    setProgress(0);
    setStatusMessage(SCORE_STEPS[0] ?? 'Analyzing target');
    setEstimatedTime(20); // Initial estimate: 20 seconds

    // Start progress simulation
    let stepIndex = 0;
    progressIntervalRef.current = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, SCORE_STEPS.length - 1);
      setCurrentStep(stepIndex);
      setStatusMessage(SCORE_STEPS[stepIndex] ?? 'Processing');
      setProgress((prev) => Math.min(prev + 30, 90)); // Max out at 90% until complete
      setEstimatedTime((prev) => (prev !== undefined && prev > 5 ? prev - 5 : undefined));
    }, 4000);

    try {
      const response = await fetch('/api/ai/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: {
            ...targetData,
            industry: targetData.sector || 'Technology',
            description: targetData.description || `${targetData.name} is a company in the ${targetData.sector || 'technology'} sector.`,
          },
          operation: 'score',
        }),
        signal,
      });

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (!response.ok) {
        throw new Error('Failed to calculate AI score');
      }

      const data = await response.json();

      // Complete progress
      setCurrentStep(SCORE_STEPS.length - 1);
      setProgress(100);
      setStatusMessage('Score complete');
      setEstimatedTime(undefined);

      // Map API response to our expected format
      const scoreResponse: AIScoreResponse = {
        overallScore: data.overallScore ?? data.score ?? 0,
        letterGrade: data.letterGrade ?? getLetterGrade(data.overallScore ?? data.score ?? 0),
        categories: data.categories ?? {
          management: data.managementScore ?? 0,
          market: data.marketScore ?? 0,
          financial: data.financialScore ?? 0,
          operational: data.operationalScore ?? 0,
          transaction: data.transactionScore ?? 0,
        },
        thesis: data.thesis ?? data.investmentThesis ?? '',
        risks: data.risks ?? data.keyRisks ?? [],
        opportunities: data.opportunities ?? data.keyOpportunities ?? [],
        confidence: data.confidence ?? 0,
      };

      setScoreData(scoreResponse);
      onScoreUpdate?.(scoreResponse.overallScore);

      // Save score to history
      await saveScoreToHistory(scoreResponse);
    } catch (err) {
      // Clear progress interval on error
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Don't show error if cancelled
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Score calculation cancelled by user');
        return;
      }

      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [targetData, onScoreUpdate, saveScoreToHistory]);

  const categoryScores: CategoryScore[] = scoreData
    ? [
        {
          name: 'Management',
          score: scoreData.categories.management,
          icon: <Users className="h-4 w-4" />,
          description: 'Leadership team quality, track record, and alignment',
        },
        {
          name: 'Market',
          score: scoreData.categories.market,
          icon: <BarChart3 className="h-4 w-4" />,
          description: 'Market size, growth potential, and competitive position',
        },
        {
          name: 'Financial',
          score: scoreData.categories.financial,
          icon: <DollarSign className="h-4 w-4" />,
          description: 'Revenue quality, margins, and financial health',
        },
        {
          name: 'Operational',
          score: scoreData.categories.operational,
          icon: <Settings className="h-4 w-4" />,
          description: 'Operational efficiency, scalability, and infrastructure',
        },
        {
          name: 'Transaction',
          score: scoreData.categories.transaction,
          icon: <Handshake className="h-4 w-4" />,
          description: 'Deal structure, valuation, and execution risk',
        },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary-100 p-2">
            <Brain className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <CardTitle className="text-base">AI Score Card</CardTitle>
            <p className="text-xs text-slate-500">{targetName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Trend Badge (compact) */}
          {scoreHistory.length > 0 && (
            <TrendBadge
              trend={scoreTrend.trend}
              changePercent={scoreTrend.changePercent}
              size="sm"
              showPercent={true}
            />
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={calculateScore}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? (
              'Analyzing...'
            ) : scoreData ? (
              <>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Recalculate
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Calculate Score
              </>
            )}
          </Button>
          {scoreData && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-danger-50 p-3 text-sm text-danger-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 mb-4">
              <Brain className="h-7 w-7 text-primary-600" />
            </div>
            <h4 className="text-sm font-medium text-slate-900 mb-1">Calculating AI Score</h4>
            <p className="text-xs text-slate-500 mb-4 text-center">
              Analyzing {targetName}
            </p>
            <div className="w-full max-w-xs">
              <ProgressIndicator
                progress={progress}
                status={statusMessage}
                steps={SCORE_STEPS}
                currentStep={currentStep}
                onCancel={handleCancel}
                estimatedTimeRemaining={estimatedTime}
              />
            </div>
          </div>
        )}

        {!isLoading && !scoreData && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-slate-100 p-4">
              <Brain className="h-8 w-8 text-slate-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-700">No AI Score Available</p>
            <p className="mt-1 max-w-sm text-xs text-slate-500">
              Click &quot;Calculate Score&quot; to generate an AI-powered analysis of this target based
              on management, market, financial, operational, and transaction factors.
            </p>
          </div>
        )}

        {!isLoading && scoreData && isExpanded && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center gap-6">
              <ScoreGauge score={scoreData.overallScore} />
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Badge className={getGradeColor(scoreData.letterGrade)} size="lg">
                    Grade {scoreData.letterGrade}
                  </Badge>
                  {scoreData.confidence > 0 && (
                    <Tooltip content="AI confidence level in this assessment">
                      <Badge variant="secondary" size="sm">
                        {scoreData.confidence}% confidence
                      </Badge>
                    </Tooltip>
                  )}
                </div>
                <p className="text-sm text-slate-600">
                  Overall investment attractiveness score based on AI analysis of key factors.
                </p>
              </div>
            </div>

            {/* Score History Section */}
            {scoreHistory.length > 0 && (
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-900">Score History</h4>
                    <span className="text-xs text-slate-500">
                      ({scoreHistory.length} {scoreHistory.length === 1 ? 'entry' : 'entries'})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                  >
                    {showFullHistory ? 'Hide History' : 'View Full History'}
                  </Button>
                </div>

                {showFullHistory ? (
                  <ScoreHistory
                    targetId={targetId}
                    history={scoreHistory}
                    trend={scoreTrend}
                    currentScore={scoreData.overallScore}
                    onRefresh={fetchScoreHistory}
                    isLoading={isHistoryLoading}
                    maxVisible={10}
                    showChart={true}
                  />
                ) : (
                  <ScoreHistory
                    targetId={targetId}
                    history={scoreHistory.slice(0, 5)}
                    trend={scoreTrend}
                    currentScore={scoreData.overallScore}
                    maxVisible={5}
                    showChart={true}
                    compact={false}
                  />
                )}
              </div>
            )}

            {/* Category Breakdown */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Category Breakdown</h4>
              <div className="space-y-3">
                {categoryScores.map((category) => (
                  <CategoryScoreBar key={category.name} category={category} />
                ))}
              </div>
            </div>

            {/* Investment Thesis */}
            {scoreData.thesis && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="h-4 w-4 text-primary-500" />
                  Investment Thesis
                </h4>
                <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{scoreData.thesis}</p>
              </div>
            )}

            {/* Risks & Opportunities */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Key Risks */}
              {scoreData.risks.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <TrendingDown className="h-4 w-4 text-danger-500" />
                    Key Risks
                  </h4>
                  <div className="space-y-2 rounded-lg bg-danger-50/50 p-3">
                    {scoreData.risks.map((risk, index) => (
                      <RiskItem key={index} risk={risk} />
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {scoreData.opportunities.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <TrendingUp className="h-4 w-4 text-success-500" />
                    Key Opportunities
                  </h4>
                  <div className="space-y-2 rounded-lg bg-success-50/50 p-3">
                    {scoreData.opportunities.map((opportunity, index) => (
                      <OpportunityItem key={index} opportunity={opportunity} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed State */}
        {!isLoading && scoreData && !isExpanded && (
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-4">
              <ScoreGauge score={scoreData.overallScore} size="sm" />
              <div>
                <div className="flex items-center gap-2">
                  <Badge className={getGradeColor(scoreData.letterGrade)}>
                    Grade {scoreData.letterGrade}
                  </Badge>
                  {scoreHistory.length > 1 && (
                    <TrendBadge
                      trend={scoreTrend.trend}
                      changePercent={scoreTrend.changePercent}
                      size="sm"
                    />
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {scoreData.risks.length} risks, {scoreData.opportunities.length} opportunities identified
                  {scoreHistory.length > 0 && ` | ${scoreHistory.length} scores recorded`}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default AIScoreCard;
