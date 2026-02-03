'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  ChevronDown,
  ChevronUp,
  BarChart3,
  History,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ScoreHistoryEntry {
  id: string;
  targetId: string;
  overallScore: number;
  managementScore: number | null;
  marketScore: number | null;
  financialScore: number | null;
  operationalScore: number | null;
  transactionScore: number | null;
  thesis: string | null;
  createdAt: Date | string;
}

export type ScoreTrend = 'improving' | 'declining' | 'stable' | 'new';

export interface ScoreTrendData {
  trend: ScoreTrend;
  changePercent: number;
  previousScore: number | null;
  currentScore: number;
  scoreCount: number;
  averageScore: number;
}

export interface ScoreHistoryProps {
  targetId: string;
  history: ScoreHistoryEntry[];
  trend: ScoreTrendData;
  currentScore?: number;
  onRefresh?: () => void;
  isLoading?: boolean;
  maxVisible?: number;
  showChart?: boolean;
  compact?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return diffMins <= 1 ? 'just now' : `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  return formatDate(d);
}

function getScoreColor(score: number): string {
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

function getScoreBgColor(score: number): string {
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

function getTrendIcon(trend: ScoreTrend) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-success-500" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-danger-500" />;
    case 'stable':
      return <Minus className="h-4 w-4 text-slate-500" />;
    default:
      return <Clock className="h-4 w-4 text-slate-400" />;
  }
}

function getTrendLabel(trend: ScoreTrend): string {
  switch (trend) {
    case 'improving':
      return 'Improving';
    case 'declining':
      return 'Declining';
    case 'stable':
      return 'Stable';
    default:
      return 'New';
  }
}

function getTrendBadgeVariant(trend: ScoreTrend): 'success' | 'danger' | 'secondary' | 'default' {
  switch (trend) {
    case 'improving':
      return 'success';
    case 'declining':
      return 'danger';
    case 'stable':
      return 'secondary';
    default:
      return 'default';
  }
}

// ============================================================================
// Sub-Components
// ============================================================================

interface TrendBadgeProps {
  trend: ScoreTrend;
  changePercent: number;
  showPercent?: boolean;
  size?: 'sm' | 'md';
}

export function TrendBadge({ trend, changePercent, showPercent = true, size = 'md' }: TrendBadgeProps) {
  return (
    <Badge
      variant={getTrendBadgeVariant(trend)}
      size={size}
      className="flex items-center gap-1"
    >
      {getTrendIcon(trend)}
      <span>{getTrendLabel(trend)}</span>
      {showPercent && trend !== 'new' && changePercent !== 0 && (
        <span className="ml-0.5">
          ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
        </span>
      )}
    </Badge>
  );
}

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

function Sparkline({ data, width = 100, height = 30, className }: SparklineProps) {
  if (data.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-xs text-slate-400', className)}
        style={{ width, height }}
      >
        Insufficient data
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;

  // Determine color based on trend
  // We already checked data.length >= 2 above, so these are safe
  const lastValue = data[data.length - 1] ?? 0;
  const firstValue = data[0] ?? 0;
  const isImproving = lastValue >= firstValue;
  const strokeColor = isImproving ? '#22c55e' : '#ef4444';

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      <path
        d={pathD}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point marker */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1]?.split(',')[0]}
          cy={points[points.length - 1]?.split(',')[1]}
          r="3"
          fill={strokeColor}
        />
      )}
    </svg>
  );
}

interface ScoreComparisonProps {
  current: number;
  previous: number | null;
}

function ScoreComparison({ current, previous }: ScoreComparisonProps) {
  if (previous === null) {
    return (
      <div className="text-sm text-slate-500">
        No previous score to compare
      </div>
    );
  }

  const diff = current - previous;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500">Previous:</span>
        <span className={cn('font-medium', getScoreColor(previous))}>{previous}</span>
      </div>
      <span className="text-slate-400">to</span>
      <div className="flex items-center gap-1">
        <span className="text-sm text-slate-500">Current:</span>
        <span className={cn('font-medium', getScoreColor(current))}>{current}</span>
      </div>
      <Badge
        variant={isNeutral ? 'secondary' : isPositive ? 'success' : 'danger'}
        size="sm"
      >
        {isNeutral ? '=' : isPositive ? `+${diff}` : diff}
      </Badge>
    </div>
  );
}

interface HistoryEntryProps {
  entry: ScoreHistoryEntry;
  previousEntry?: ScoreHistoryEntry;
  isFirst?: boolean;
}

function HistoryEntry({ entry, previousEntry, isFirst }: HistoryEntryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const diff = previousEntry ? entry.overallScore - previousEntry.overallScore : null;

  return (
    <div className={cn(
      'relative pl-6 pb-4',
      !isFirst && 'border-l-2 border-slate-200 ml-2'
    )}>
      {/* Timeline dot */}
      <div className={cn(
        'absolute left-0 top-0 h-4 w-4 rounded-full border-2',
        isFirst ? 'border-primary-500 bg-primary-100' : 'border-slate-300 bg-white',
        isFirst ? '-ml-0' : '-ml-2'
      )} />

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('text-lg font-semibold', getScoreColor(entry.overallScore))}>
              {entry.overallScore}
            </span>
            {diff !== null && diff !== 0 && (
              <Badge
                variant={diff > 0 ? 'success' : 'danger'}
                size="sm"
              >
                {diff > 0 ? '+' : ''}{diff}
              </Badge>
            )}
            {isFirst && (
              <Badge variant="primary" size="sm">Latest</Badge>
            )}
          </div>
          <Tooltip content={formatDate(entry.createdAt)}>
            <span className="text-xs text-slate-500">
              {formatRelativeDate(entry.createdAt)}
            </span>
          </Tooltip>
        </div>

        {/* Category scores mini view */}
        <div className="flex gap-1">
          {entry.managementScore && (
            <Tooltip content={`Management: ${entry.managementScore}`}>
              <div className={cn('h-1.5 w-8 rounded-full', getScoreBgColor(entry.managementScore))} />
            </Tooltip>
          )}
          {entry.marketScore && (
            <Tooltip content={`Market: ${entry.marketScore}`}>
              <div className={cn('h-1.5 w-8 rounded-full', getScoreBgColor(entry.marketScore))} />
            </Tooltip>
          )}
          {entry.financialScore && (
            <Tooltip content={`Financial: ${entry.financialScore}`}>
              <div className={cn('h-1.5 w-8 rounded-full', getScoreBgColor(entry.financialScore))} />
            </Tooltip>
          )}
          {entry.operationalScore && (
            <Tooltip content={`Operational: ${entry.operationalScore}`}>
              <div className={cn('h-1.5 w-8 rounded-full', getScoreBgColor(entry.operationalScore))} />
            </Tooltip>
          )}
          {entry.transactionScore && (
            <Tooltip content={`Transaction: ${entry.transactionScore}`}>
              <div className={cn('h-1.5 w-8 rounded-full', getScoreBgColor(entry.transactionScore))} />
            </Tooltip>
          )}
        </div>

        {/* Expandable thesis */}
        {entry.thesis && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700"
          >
            {isExpanded ? 'Hide thesis' : 'Show thesis'}
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        )}
        {isExpanded && entry.thesis && (
          <p className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600">
            {entry.thesis}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ScoreHistory({
  targetId,
  history,
  trend,
  currentScore,
  onRefresh,
  isLoading = false,
  maxVisible = 5,
  showChart = true,
  compact = false,
}: ScoreHistoryProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleHistory = showAll ? history : history.slice(0, maxVisible);
  const hasMore = history.length > maxVisible;

  // Prepare data for sparkline (oldest to newest)
  const sparklineData = [...history].reverse().map((e) => e.overallScore);

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <TrendBadge trend={trend.trend} changePercent={trend.changePercent} size="sm" />
        {showChart && sparklineData.length >= 2 && (
          <Sparkline data={sparklineData} width={60} height={20} />
        )}
        {trend.scoreCount > 1 && (
          <Tooltip content={`${trend.scoreCount} scores recorded. Average: ${trend.averageScore}`}>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <History className="h-3 w-3" />
              <span>{trend.scoreCount}</span>
            </div>
          </Tooltip>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-500" />
          <h4 className="text-sm font-semibold text-slate-900">Score History</h4>
          <TrendBadge trend={trend.trend} changePercent={trend.changePercent} />
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        )}
      </div>

      {/* Score Comparison */}
      {currentScore !== undefined && (
        <ScoreComparison current={currentScore} previous={trend.previousScore} />
      )}

      {/* Sparkline Chart */}
      {showChart && sparklineData.length >= 2 && (
        <div className="rounded-lg bg-slate-50 p-3">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Score trend over time</span>
            <span>Average: {trend.averageScore}</span>
          </div>
          <Sparkline data={sparklineData} width={280} height={40} />
        </div>
      )}

      {/* History Timeline */}
      {history.length === 0 ? (
        <div className="py-4 text-center text-sm text-slate-500">
          No score history available
        </div>
      ) : (
        <div className="space-y-0">
          {visibleHistory.map((entry, index) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              previousEntry={history[index + 1]}
              isFirst={index === 0}
            />
          ))}
        </div>
      )}

      {/* Show More/Less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex w-full items-center justify-center gap-1 py-2 text-sm text-primary-600 hover:text-primary-700"
        >
          {showAll ? (
            <>
              Show less <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              View full history ({history.length - maxVisible} more) <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ScoreHistory;
