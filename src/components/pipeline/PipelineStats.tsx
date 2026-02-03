'use client';

import { useMemo } from 'react';

import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  DollarSign,
  Percent,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatLargeNumber } from '@/lib/utils';

import type { Target as TargetType, PipelineStage } from './TargetCard';

// ============================================================================
// Types
// ============================================================================

interface PipelineStatsProps {
  targets: TargetType[];
  className?: string;
  showConversionRates?: boolean;
  showAverageTimes?: boolean;
}

interface StageStats {
  stage: PipelineStage;
  label: string;
  count: number;
  totalValue: number;
  avgDaysInStage: number;
  avgScore: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

const STAGE_ORDER: PipelineStage[] = [
  'sourcing',
  'initial_screening',
  'deep_evaluation',
  'negotiation',
  'execution',
  'closed_passed',
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  sourcing: 'Sourcing',
  initial_screening: 'Screening',
  deep_evaluation: 'Evaluation',
  negotiation: 'Negotiation',
  execution: 'Execution',
  closed_passed: 'Closed/Passed',
};

const STAGE_COLORS: Record<PipelineStage, string> = {
  sourcing: 'bg-slate-500',
  initial_screening: 'bg-blue-500',
  deep_evaluation: 'bg-indigo-500',
  negotiation: 'bg-purple-500',
  execution: 'bg-amber-500',
  closed_passed: 'bg-emerald-500',
};

function calculateStageStats(targets: TargetType[]): StageStats[] {
  return STAGE_ORDER.map((stage) => {
    const stageTargets = targets.filter((t) => t.stage === stage);
    const count = stageTargets.length;
    const totalValue = stageTargets.reduce((sum, t) => sum + (t.enterpriseValue || 0), 0);
    const avgDaysInStage = count > 0
      ? Math.round(stageTargets.reduce((sum, t) => sum + t.daysInStage, 0) / count)
      : 0;
    const avgScore = count > 0
      ? Math.round(stageTargets.reduce((sum, t) => sum + t.evaluationScore, 0) / count)
      : 0;

    return {
      stage,
      label: STAGE_LABELS[stage],
      count,
      totalValue,
      avgDaysInStage,
      avgScore,
    };
  });
}

// ============================================================================
// Sub-components
// ============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

function StatCard({ title, value, subValue, icon: Icon, trend, trendValue, className }: StatCardProps) {
  return (
    <div className={cn('rounded-lg border border-slate-200 bg-white p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subValue && <p className="mt-0.5 text-sm text-slate-500">{subValue}</p>}
        </div>
        <div className="rounded-lg bg-slate-100 p-2">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
      {trend && trendValue && (
        <div className={cn(
          'mt-3 flex items-center gap-1 text-sm font-medium',
          trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-slate-500'
        )}>
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4" />
          ) : trend === 'down' ? (
            <TrendingDown className="h-4 w-4" />
          ) : null}
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}

interface StageBarProps {
  stats: StageStats;
  maxCount: number;
  maxValue: number;
}

function StageBar({ stats, maxCount, maxValue }: StageBarProps) {
  const countPercentage = maxCount > 0 ? (stats.count / maxCount) * 100 : 0;
  const valuePercentage = maxValue > 0 ? (stats.totalValue / maxValue) * 100 : 0;

  return (
    <Tooltip content={`${stats.count} targets, ${formatLargeNumber(stats.totalValue)} total value`}>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-700">{stats.label}</span>
          <span className="text-slate-500">{stats.count}</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full transition-all duration-500', STAGE_COLORS[stats.stage])}
            style={{ width: `${countPercentage}%` }}
          />
        </div>
      </div>
    </Tooltip>
  );
}

interface ConversionFunnelProps {
  stageStats: StageStats[];
}

function ConversionFunnel({ stageStats }: ConversionFunnelProps) {
  // Calculate conversion rates between consecutive stages
  const conversionRates: { from: string; to: string; rate: number }[] = [];

  for (let i = 0; i < stageStats.length - 1; i++) {
    const currentStage = stageStats[i];
    const nextStage = stageStats[i + 1];
    if (!currentStage || !nextStage) {continue;}
    const fromCount = currentStage.count;
    const toCount = nextStage.count;
    if (fromCount > 0) {
      conversionRates.push({
        from: currentStage.label,
        to: nextStage.label,
        rate: Math.round((toCount / fromCount) * 100),
      });
    }
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-700">Stage Conversion Rates</h4>
      <div className="space-y-3">
        {conversionRates.slice(0, 4).map((conversion) => (
          <div key={`${conversion.from}-${conversion.to}`} className="flex items-center gap-2 text-sm">
            <span className="text-slate-600 truncate w-24">{conversion.from}</span>
            <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-600 truncate w-24">{conversion.to}</span>
            <Badge
              variant={conversion.rate >= 50 ? 'success' : conversion.rate >= 25 ? 'warning' : 'secondary'}
              size="sm"
            >
              {conversion.rate}%
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PipelineStats({
  targets,
  className,
  showConversionRates = true,
  showAverageTimes = true,
}: PipelineStatsProps) {
  const stageStats = useMemo(() => calculateStageStats(targets), [targets]);

  const totalStats = useMemo(() => {
    const total = targets.length;
    const totalValue = targets.reduce((sum, t) => sum + (t.enterpriseValue || 0), 0);
    const avgScore = total > 0
      ? Math.round(targets.reduce((sum, t) => sum + t.evaluationScore, 0) / total)
      : 0;
    const avgDays = total > 0
      ? Math.round(targets.reduce((sum, t) => sum + t.daysInStage, 0) / total)
      : 0;

    // Calculate active vs closed
    const closedTargets = targets.filter((t) => t.stage === 'closed_passed');
    const activeTargets = targets.filter((t) => t.stage !== 'closed_passed');
    const closedWon = closedTargets.length; // In real app, would filter by outcome
    const closedPassed = Math.floor(closedTargets.length * 0.4); // Mock: 40% passed
    const closedWonCount = closedTargets.length - closedPassed;
    const winRate = closedTargets.length > 0
      ? Math.round((closedWonCount / closedTargets.length) * 100)
      : 0;

    return {
      total,
      totalValue,
      avgScore,
      avgDays,
      activeTargets: activeTargets.length,
      closedWon: closedWonCount,
      closedPassed,
      winRate,
    };
  }, [targets]);

  const maxCount = Math.max(...stageStats.map((s) => s.count));
  const maxValue = Math.max(...stageStats.map((s) => s.totalValue));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Targets"
          value={totalStats.total}
          subValue={`${totalStats.activeTargets} active`}
          icon={Target}
        />
        <StatCard
          title="Pipeline Value"
          value={formatLargeNumber(totalStats.totalValue)}
          icon={DollarSign}
          trend="up"
          trendValue="+12% this month"
        />
        <StatCard
          title="Avg. Evaluation Score"
          value={totalStats.avgScore}
          subValue="out of 100"
          icon={BarChart3}
        />
        <StatCard
          title="Win Rate"
          value={`${totalStats.winRate}%`}
          subValue={`${totalStats.closedWon} won, ${totalStats.closedPassed} passed`}
          icon={Percent}
          trend={totalStats.winRate >= 50 ? 'up' : 'down'}
          trendValue={totalStats.winRate >= 50 ? 'Above target' : 'Below target'}
        />
      </div>

      {/* Stage Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Targets by Stage */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h4 className="mb-4 text-sm font-medium text-slate-700">Targets by Stage</h4>
          <div className="space-y-3">
            {stageStats.map((stats) => (
              <StageBar
                key={stats.stage}
                stats={stats}
                maxCount={maxCount}
                maxValue={maxValue}
              />
            ))}
          </div>
        </div>

        {/* Conversion Rates or Average Times */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          {showConversionRates ? (
            <ConversionFunnel stageStats={stageStats} />
          ) : showAverageTimes ? (
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-slate-700">Average Time in Stage</h4>
              <div className="space-y-3">
                {stageStats.filter((s) => s.count > 0).map((stats) => (
                  <div key={stats.stage} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-3 w-3 rounded-full', STAGE_COLORS[stats.stage])} />
                      <span className="text-sm text-slate-600">{stats.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{stats.avgDaysInStage} days</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Quick Insights */}
      <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-primary-50 to-white p-5">
        <h4 className="mb-3 text-sm font-medium text-slate-700">Quick Insights</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-success-100 p-2">
              <CheckCircle2 className="h-4 w-4 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {stageStats.find((s) => s.stage === 'negotiation')?.count || 0} targets in negotiation
              </p>
              <p className="text-xs text-slate-500">Worth {formatLargeNumber(stageStats.find((s) => s.stage === 'negotiation')?.totalValue || 0)}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-warning-100 p-2">
              <Clock className="h-4 w-4 text-warning-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {targets.filter((t) => t.daysInStage > 30).length} targets stalled
              </p>
              <p className="text-xs text-slate-500">Over 30 days in current stage</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <TrendingUp className="h-4 w-4 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-700">
                {targets.filter((t) => t.evaluationScore >= 80).length} high-score targets
              </p>
              <p className="text-xs text-slate-500">Evaluation score 80+</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Stats Bar
// ============================================================================

interface PipelineStatsBarProps {
  targets: TargetType[];
  className?: string;
}

export function PipelineStatsBar({ targets, className }: PipelineStatsBarProps) {
  const stats = useMemo(() => {
    const total = targets.length;
    const totalValue = targets.reduce((sum, t) => sum + (t.enterpriseValue || 0), 0);
    const inNegotiation = targets.filter((t) => t.stage === 'negotiation').length;
    const avgScore = total > 0
      ? Math.round(targets.reduce((sum, t) => sum + t.evaluationScore, 0) / total)
      : 0;

    return { total, totalValue, inNegotiation, avgScore };
  }, [targets]);

  return (
    <div className={cn('flex flex-wrap items-center gap-6', className)}>
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{stats.total}</span> targets
        </span>
      </div>
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{formatLargeNumber(stats.totalValue)}</span> total value
        </span>
      </div>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{stats.avgScore}</span> avg score
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-slate-400" />
        <span className="text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{stats.inNegotiation}</span> in negotiation
        </span>
      </div>
    </div>
  );
}
