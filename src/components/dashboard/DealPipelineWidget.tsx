'use client';

import { useMemo } from 'react';

import {
  Target,
  ArrowRight,
  TrendingUp,
  Building2,
  ChevronRight,
  Briefcase,
  Search,
  FileSearch,
  Handshake,
  FileSignature,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatLargeNumber } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type PipelineStage = 'SOURCING' | 'SCREENING' | 'EVALUATION' | 'NEGOTIATION' | 'EXECUTION';

interface PipelineTarget {
  id: string;
  name: string;
  sector: string;
  stage: PipelineStage;
  estimatedValue: number;
  fitScore: number;
  lastActivity: string;
  daysInStage: number;
}

interface StageMetrics {
  stage: PipelineStage;
  count: number;
  totalValue: number;
}

interface DealPipelineData {
  targets: PipelineTarget[];
  stageMetrics: StageMetrics[];
  totalActiveTargets: number;
  totalPipelineValue: number;
  conversionRates: {
    sourcingToScreening: number;
    screeningToEvaluation: number;
    evaluationToNegotiation: number;
    negotiationToExecution: number;
  };
}

interface DealPipelineWidgetProps {
  data?: DealPipelineData | null;
  isLoading?: boolean;
  className?: string;
  onViewPipeline?: () => void;
  onTargetClick?: (targetId: string) => void;
}

// ============================================================================
// MOCK DATA FOR SOREN ACQUISITION CORPORATION (HEALTHCARE FOCUS)
// ============================================================================

export const mockPipelineData: DealPipelineData = {
  targets: [
    {
      id: 'target-001',
      name: 'MedTech Innovations',
      sector: 'Medical Devices',
      stage: 'NEGOTIATION',
      estimatedValue: 420000000,
      fitScore: 92,
      lastActivity: '2 hours ago',
      daysInStage: 14,
    },
    {
      id: 'target-002',
      name: 'BioGenesis Labs',
      sector: 'Biotechnology',
      stage: 'EVALUATION',
      estimatedValue: 380000000,
      fitScore: 87,
      lastActivity: '1 day ago',
      daysInStage: 21,
    },
    {
      id: 'target-003',
      name: 'HealthFlow Systems',
      sector: 'Digital Health',
      stage: 'EVALUATION',
      estimatedValue: 295000000,
      fitScore: 84,
      lastActivity: '3 days ago',
      daysInStage: 8,
    },
    {
      id: 'target-004',
      name: 'PharmaConnect',
      sector: 'Pharmaceuticals',
      stage: 'SCREENING',
      estimatedValue: 510000000,
      fitScore: 78,
      lastActivity: '5 days ago',
      daysInStage: 12,
    },
    {
      id: 'target-005',
      name: 'CarePoint Analytics',
      sector: 'Healthcare IT',
      stage: 'SOURCING',
      estimatedValue: 185000000,
      fitScore: 72,
      lastActivity: '1 week ago',
      daysInStage: 5,
    },
    {
      id: 'target-006',
      name: 'Nexus Diagnostics',
      sector: 'Diagnostics',
      stage: 'SOURCING',
      estimatedValue: 240000000,
      fitScore: 75,
      lastActivity: '4 days ago',
      daysInStage: 3,
    },
  ],
  stageMetrics: [
    { stage: 'SOURCING', count: 2, totalValue: 425000000 },
    { stage: 'SCREENING', count: 1, totalValue: 510000000 },
    { stage: 'EVALUATION', count: 2, totalValue: 675000000 },
    { stage: 'NEGOTIATION', count: 1, totalValue: 420000000 },
    { stage: 'EXECUTION', count: 0, totalValue: 0 },
  ],
  totalActiveTargets: 6,
  totalPipelineValue: 2030000000,
  conversionRates: {
    sourcingToScreening: 45,
    screeningToEvaluation: 60,
    evaluationToNegotiation: 35,
    negotiationToExecution: 75,
  },
};

// ============================================================================
// STAGE CONFIGURATION
// ============================================================================

const stageConfig: Record<PipelineStage, {
  label: string;
  shortLabel: string;
  icon: typeof Target;
  color: string;
  bgColor: string;
  textColor: string;
}> = {
  SOURCING: {
    label: 'Sourcing',
    shortLabel: 'Source',
    icon: Search,
    color: 'bg-slate-500',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
  },
  SCREENING: {
    label: 'Screening',
    shortLabel: 'Screen',
    icon: FileSearch,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
  },
  EVALUATION: {
    label: 'Evaluation',
    shortLabel: 'Eval',
    icon: Briefcase,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
  },
  NEGOTIATION: {
    label: 'Negotiation',
    shortLabel: 'Nego',
    icon: Handshake,
    color: 'bg-warning-500',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-700',
  },
  EXECUTION: {
    label: 'Execution',
    shortLabel: 'Exec',
    icon: FileSignature,
    color: 'bg-success-500',
    bgColor: 'bg-success-100',
    textColor: 'text-success-700',
  },
};

const stages: PipelineStage[] = ['SOURCING', 'SCREENING', 'EVALUATION', 'NEGOTIATION', 'EXECUTION'];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ConversionFunnel({ metrics }: { metrics: StageMetrics[] }) {
  const maxCount = Math.max(...metrics.map(m => m.count), 1);

  return (
    <div className="space-y-2">
      {metrics.map((metric, _index) => {
        const config = stageConfig[metric.stage];
        const widthPercent = Math.max((metric.count / maxCount) * 100, 10);
        const Icon = config.icon;

        return (
          <div key={metric.stage} className="flex items-center gap-3">
            <div className="flex w-20 items-center gap-2">
              <div className={cn('rounded p-1', config.bgColor)}>
                <Icon className={cn('h-3 w-3', config.textColor)} />
              </div>
              <span className="text-xs font-medium text-slate-600">
                {config.shortLabel}
              </span>
            </div>
            <div className="flex-1">
              <div className="h-6 rounded-r-full bg-slate-100 relative overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-r-full transition-all duration-500 flex items-center justify-end pr-2',
                    config.color
                  )}
                  style={{ width: `${widthPercent}%` }}
                >
                  <span className="text-xs font-semibold text-white">
                    {metric.count}
                  </span>
                </div>
              </div>
            </div>
            <div className="w-16 text-right">
              <span className="text-xs text-slate-500">
                {formatLargeNumber(metric.totalValue)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TopTargets({ targets, onTargetClick }: {
  targets: PipelineTarget[];
  onTargetClick?: (targetId: string) => void;
}) {
  // Get top 3 targets by fit score
  const topTargets = useMemo(() => {
    return [...targets]
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 3);
  }, [targets]);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-700">Top Targets</h4>
      <div className="space-y-2">
        {topTargets.map((target, index) => {
          const config = stageConfig[target.stage];

          return (
            <div
              key={target.id}
              onClick={() => onTargetClick?.(target.id)}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-all',
                onTargetClick && 'cursor-pointer hover:border-primary-200 hover:shadow-sm'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {target.name}
                </p>
                <p className="text-xs text-slate-500">{target.sector}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(config.bgColor, config.textColor, 'border-0')}>
                  {config.shortLabel}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-900">
                    {target.fitScore}%
                  </p>
                  <p className="text-xs text-slate-400">Fit Score</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-36 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 rounded-lg bg-slate-200" />
          <div className="h-20 rounded-lg bg-slate-200" />
        </div>
        <div className="h-32 rounded-lg bg-slate-200" />
        <div className="h-40 rounded-lg bg-slate-200" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DealPipelineWidget({
  data = mockPipelineData,
  isLoading = false,
  className,
  onViewPipeline,
  onTargetClick,
}: DealPipelineWidgetProps) {
  if (isLoading) {
    return <PipelineSkeleton />;
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No pipeline data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary-600" />
          Deal Pipeline
        </CardTitle>
        <Badge variant="primary">
          {data.totalActiveTargets} Active
        </Badge>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 p-4 text-white">
            <p className="text-xs font-medium text-primary-100">Total Pipeline Value</p>
            <p className="mt-1 text-2xl font-bold">
              {formatLargeNumber(data.totalPipelineValue)}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-primary-100">
              <TrendingUp className="h-3 w-3" />
              <span>Across {data.totalActiveTargets} targets</span>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-500">Avg. Deal Size</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatLargeNumber(data.totalPipelineValue / Math.max(data.totalActiveTargets, 1))}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="h-3 w-3" />
              <span>Healthcare Focus</span>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">Stage Distribution</h4>
          <ConversionFunnel metrics={data.stageMetrics} />
        </div>

        {/* Conversion Rates */}
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
          {stages.slice(0, -1).map((stage, index) => {
            const nextStage = stages[index + 1];
            if (!nextStage) { return null; }
            const conversionKey = `${stage.toLowerCase()}To${nextStage.charAt(0) + nextStage.slice(1).toLowerCase()}` as keyof typeof data.conversionRates;
            const rate = data.conversionRates[conversionKey];
            const config = stageConfig[stage];

            return (
              <div key={stage} className="flex items-center">
                <div className="text-center">
                  <div className={cn('mx-auto h-2 w-2 rounded-full', config.color)} />
                  <p className="mt-1 text-xs font-semibold text-slate-700">
                    {rate}%
                  </p>
                </div>
                {index < stages.length - 2 && (
                  <ArrowRight className="mx-2 h-3 w-3 text-slate-300" />
                )}
              </div>
            );
          })}
        </div>

        {/* Top Targets */}
        <TopTargets targets={data.targets} onTargetClick={onTargetClick} />

        {/* View Pipeline Button */}
        {onViewPipeline && (
          <button
            onClick={onViewPipeline}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            View Full Pipeline
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default DealPipelineWidget;
