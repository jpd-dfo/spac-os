'use client';

import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  FunnelChart,
  Funnel,
  LabelList,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { TrendingUp, Filter, ChevronDown, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatLargeNumber } from '@/lib/utils';
import { DEAL_STAGE_LABELS } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

type ChartVariant = 'bar' | 'funnel' | 'pie';
type DealStage =
  | 'ORIGINATION'
  | 'PRELIMINARY_REVIEW'
  | 'DEEP_DIVE'
  | 'NEGOTIATION'
  | 'DOCUMENTATION'
  | 'CLOSING'
  | 'TERMINATED';

interface PipelineStageData {
  stage: DealStage;
  count: number;
  value: number; // Enterprise value of deals in this stage
  deals?: DealSummary[];
}

interface DealSummary {
  id: string;
  name: string;
  value: number;
  probability?: number;
}

interface PipelineChartProps {
  data: PipelineStageData[];
  variant?: ChartVariant;
  title?: string;
  showValue?: boolean;
  showCount?: boolean;
  showConversionRates?: boolean;
  onStageClick?: (stage: DealStage) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STAGE_COLORS: Record<DealStage, string> = {
  ORIGINATION: '#8B5CF6', // violet-500
  PRELIMINARY_REVIEW: '#6366F1', // indigo-500
  DEEP_DIVE: '#3B82F6', // blue-500
  NEGOTIATION: '#14B8A6', // teal-500
  DOCUMENTATION: '#F59E0B', // amber-500
  CLOSING: '#22C55E', // green-500
  TERMINATED: '#EF4444', // red-500
};

const ACTIVE_STAGES: DealStage[] = [
  'ORIGINATION',
  'PRELIMINARY_REVIEW',
  'DEEP_DIVE',
  'NEGOTIATION',
  'DOCUMENTATION',
  'CLOSING',
];

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      stage: DealStage;
      count: number;
      value: number;
      conversionRate?: number;
    };
  }>;
  showValue?: boolean;
}

function CustomTooltip({ active, payload, showValue }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">
        {DEAL_STAGE_LABELS[data.stage] || data.stage}
      </p>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-slate-600">
          <span className="font-medium">{data.count}</span> deal{data.count !== 1 ? 's' : ''}
        </p>
        {showValue && (
          <p className="text-xs text-slate-600">
            Value: <span className="font-medium">{formatLargeNumber(data.value)}</span>
          </p>
        )}
        {data.conversionRate !== undefined && (
          <p className="text-xs text-slate-600">
            Conversion: <span className="font-medium">{data.conversionRate.toFixed(1)}%</span>
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function PipelineChartSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 rounded bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] rounded-lg bg-slate-100" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PipelineChart({
  data,
  variant = 'bar',
  title = 'Deal Pipeline',
  showValue = true,
  showCount = true,
  showConversionRates = false,
  onStageClick,
  isLoading = false,
  error = null,
  className,
}: PipelineChartProps) {
  const [selectedStage, setSelectedStage] = useState<DealStage | null>(null);

  // Calculate totals and conversion rates
  const processedData = useMemo(() => {
    // Filter to active stages only (exclude TERMINATED for funnel)
    const activeData = data.filter((d) => ACTIVE_STAGES.includes(d.stage));

    // Sort by stage order
    const stageOrder = ACTIVE_STAGES;
    activeData.sort((a, b) => stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage));

    // Calculate conversion rates
    if (showConversionRates) {
      return activeData.map((item, index) => {
        const prevCount = index === 0 ? item.count : activeData[index - 1].count;
        const conversionRate = prevCount > 0 ? (item.count / prevCount) * 100 : 0;
        return {
          ...item,
          name: DEAL_STAGE_LABELS[item.stage] || item.stage,
          conversionRate: index === 0 ? 100 : conversionRate,
          fill: STAGE_COLORS[item.stage],
        };
      });
    }

    return activeData.map((item) => ({
      ...item,
      name: DEAL_STAGE_LABELS[item.stage] || item.stage,
      fill: STAGE_COLORS[item.stage],
    }));
  }, [data, showConversionRates]);

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalDeals = data.reduce((sum, d) => sum + d.count, 0);
    const totalValue = data.reduce((sum, d) => sum + d.value, 0);
    const closingDeals = data.find((d) => d.stage === 'CLOSING')?.count || 0;
    const terminatedDeals = data.find((d) => d.stage === 'TERMINATED')?.count || 0;

    return {
      totalDeals,
      totalValue,
      closingDeals,
      terminatedDeals,
      winRate: totalDeals > 0 ? ((closingDeals / (closingDeals + terminatedDeals)) * 100) || 0 : 0,
    };
  }, [data]);

  const handleStageClick = (stage: DealStage) => {
    setSelectedStage(selectedStage === stage ? null : stage);
    onStageClick?.(stage);
  };

  // Loading state
  if (isLoading) {
    return <PipelineChartSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-danger-400" />
          <p className="mt-4 text-sm font-medium text-danger-700">Failed to load pipeline data</p>
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">No pipeline data available</p>
          <p className="mt-1 text-xs text-slate-400">Add targets to see your deal pipeline</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            {title}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          {showValue && (
            <Badge variant="secondary">
              Total: {formatLargeNumber(stats.totalValue)}
            </Badge>
          )}
          {showCount && (
            <Badge variant="primary">
              {stats.totalDeals} Deal{stats.totalDeals !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px]">
          {variant === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processedData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip showValue={showValue} />} />
                <Bar
                  dataKey="count"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(data) => handleStageClick(data.stage)}
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={selectedStage === null || selectedStage === entry.stage ? 1 : 0.4}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {variant === 'funnel' && (
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<CustomTooltip showValue={showValue} />} />
                <Funnel
                  dataKey="count"
                  data={processedData}
                  isAnimationActive
                  onClick={(data) => handleStageClick(data.payload.stage)}
                >
                  <LabelList
                    position="right"
                    fill="#475569"
                    stroke="none"
                    dataKey="name"
                    fontSize={12}
                  />
                  <LabelList
                    position="inside"
                    fill="#fff"
                    stroke="none"
                    dataKey="count"
                    fontSize={14}
                    fontWeight="bold"
                  />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          )}

          {variant === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  onClick={(data) => handleStageClick(data.stage)}
                >
                  {processedData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      opacity={selectedStage === null || selectedStage === entry.stage ? 1 : 0.4}
                      cursor="pointer"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip showValue={showValue} />} />
                <Legend
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  formatter={(value: string) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stage details when selected */}
        {selectedStage && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {DEAL_STAGE_LABELS[selectedStage]}
                </p>
                <p className="text-xs text-slate-500">
                  {data.find((d) => d.stage === selectedStage)?.count || 0} deals
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedStage(null)}
              >
                Clear
              </Button>
            </div>
            {data.find((d) => d.stage === selectedStage)?.deals && (
              <div className="mt-3 space-y-2">
                {data
                  .find((d) => d.stage === selectedStage)
                  ?.deals?.slice(0, 5)
                  .map((deal) => (
                    <div
                      key={deal.id}
                      className="flex items-center justify-between rounded-lg bg-white p-2"
                    >
                      <span className="text-sm text-slate-700">{deal.name}</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatLargeNumber(deal.value)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
        <span>
          Win Rate: <span className="font-medium text-slate-700">{stats.winRate.toFixed(1)}%</span>
        </span>
        <span>
          {stats.closingDeals} closing | {stats.terminatedDeals} terminated
        </span>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface PipelineCompactProps {
  data: PipelineStageData[];
  className?: string;
}

export function PipelineCompact({ data, className }: PipelineCompactProps) {
  const activeData = useMemo(() => {
    return data
      .filter((d) => ACTIVE_STAGES.includes(d.stage))
      .sort((a, b) => ACTIVE_STAGES.indexOf(a.stage) - ACTIVE_STAGES.indexOf(b.stage));
  }, [data]);

  const total = activeData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Pipeline</span>
          <Badge variant="primary" size="sm">
            {total} deals
          </Badge>
        </div>
        <div className="flex h-4 overflow-hidden rounded-full">
          {activeData.map((stage) => {
            const width = total > 0 ? (stage.count / total) * 100 : 0;
            if (width === 0) return null;
            return (
              <div
                key={stage.stage}
                className="transition-all"
                style={{
                  width: `${width}%`,
                  backgroundColor: STAGE_COLORS[stage.stage],
                }}
                title={`${DEAL_STAGE_LABELS[stage.stage]}: ${stage.count}`}
              />
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeData.slice(0, 4).map((stage) => (
            <div key={stage.stage} className="flex items-center gap-1">
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STAGE_COLORS[stage.stage] }}
              />
              <span className="text-xs text-slate-500">
                {DEAL_STAGE_LABELS[stage.stage]}: {stage.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MINI FUNNEL
// ============================================================================

interface PipelineMiniFunnelProps {
  data: PipelineStageData[];
  height?: number;
  className?: string;
}

export function PipelineMiniFunnel({ data, height = 120, className }: PipelineMiniFunnelProps) {
  const activeData = useMemo(() => {
    return data
      .filter((d) => ACTIVE_STAGES.includes(d.stage))
      .sort((a, b) => ACTIVE_STAGES.indexOf(a.stage) - ACTIVE_STAGES.indexOf(b.stage))
      .map((d) => ({
        ...d,
        name: DEAL_STAGE_LABELS[d.stage],
        fill: STAGE_COLORS[d.stage],
      }));
  }, [data]);

  const maxCount = Math.max(...activeData.map((d) => d.count), 1);

  return (
    <div className={cn('space-y-1', className)}>
      {activeData.map((stage) => {
        const width = (stage.count / maxCount) * 100;
        return (
          <div key={stage.stage} className="flex items-center gap-2">
            <div
              className="h-6 rounded-r transition-all"
              style={{
                width: `${Math.max(width, 10)}%`,
                backgroundColor: stage.fill,
              }}
            />
            <span className="text-xs text-slate-600">{stage.count}</span>
          </div>
        );
      })}
    </div>
  );
}
