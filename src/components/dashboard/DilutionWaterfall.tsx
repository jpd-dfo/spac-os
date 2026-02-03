'use client';

import { useMemo, useState } from 'react';

import { TrendingDown, Info, AlertTriangle, ChevronDown, Settings } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
  ComposedChart,
  Line,
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tooltip as UITooltip } from '@/components/ui/Tooltip';
import { cn, formatPercent, formatLargeNumber } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type DilutionSource =
  | 'initial_shares'
  | 'sponsor_promote'
  | 'founder_shares'
  | 'private_warrants'
  | 'public_warrants'
  | 'pipe_shares'
  | 'earnout'
  | 'equity_incentives'
  | 'conversion_notes'
  | 'other';

interface DilutionItem {
  id: string;
  source: DilutionSource;
  label: string;
  shares: number;
  percentage?: number;
  isNegative?: boolean; // For redemptions which reduce shares
  details?: string;
  color?: string;
}

interface DilutionScenario {
  name: string;
  redemptionRate: number;
  items: DilutionItem[];
}

interface DilutionWaterfallProps {
  items: DilutionItem[];
  scenarios?: DilutionScenario[];
  title?: string;
  totalShares?: number;
  targetOwnership?: number;
  showPercentages?: boolean;
  showCumulativeLine?: boolean;
  onItemClick?: (item: DilutionItem) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SOURCE_COLORS: Record<DilutionSource, string> = {
  initial_shares: '#3B82F6', // blue-500
  sponsor_promote: '#8B5CF6', // violet-500
  founder_shares: '#6366F1', // indigo-500
  private_warrants: '#EC4899', // pink-500
  public_warrants: '#F43F5E', // rose-500
  pipe_shares: '#14B8A6', // teal-500
  earnout: '#F59E0B', // amber-500
  equity_incentives: '#10B981', // emerald-500
  conversion_notes: '#6B7280', // gray-500
  other: '#94A3B8', // slate-400
};

const SOURCE_LABELS: Record<DilutionSource, string> = {
  initial_shares: 'Initial Public Shares',
  sponsor_promote: 'Sponsor Promote',
  founder_shares: 'Founder Shares',
  private_warrants: 'Private Warrants',
  public_warrants: 'Public Warrants',
  pipe_shares: 'PIPE Shares',
  earnout: 'Earnout Shares',
  equity_incentives: 'Equity Incentive Plan',
  conversion_notes: 'Convertible Notes',
  other: 'Other',
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      label: string;
      shares: number;
      percentage: number;
      cumulativePercentage: number;
      details?: string;
      fill: string;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  const firstPayload = payload?.[0];
  if (!active || !firstPayload) { return null; }

  const data = firstPayload.payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: data.fill }}
        />
        <p className="text-sm font-semibold text-slate-900">{data.label}</p>
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-slate-600">
          Shares: <span className="font-medium">{formatLargeNumber(data.shares)}</span>
        </p>
        <p className="text-xs text-slate-600">
          Dilution: <span className="font-medium">{formatPercent(data.percentage)}</span>
        </p>
        <p className="text-xs text-slate-600">
          Cumulative:{' '}
          <span className="font-medium">{formatPercent(data.cumulativePercentage)}</span>
        </p>
        {data.details && (
          <p className="mt-1 text-xs text-slate-500">{data.details}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function DilutionWaterfallSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-48 rounded bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] rounded-lg bg-slate-100" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DilutionWaterfall({
  items,
  scenarios,
  title = 'Dilution Waterfall',
  totalShares,
  targetOwnership,
  showPercentages = true,
  showCumulativeLine = true,
  onItemClick,
  isLoading = false,
  error = null,
  className,
}: DilutionWaterfallProps) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

  // Use scenario items if selected, otherwise use default items
  const activeItems = useMemo(() => {
    if (selectedScenario && scenarios) {
      const scenario = scenarios.find((s) => s.name === selectedScenario);
      return scenario?.items || items;
    }
    return items;
  }, [items, scenarios, selectedScenario]);

  // Calculate totals and percentages
  const processedData = useMemo(() => {
    const total =
      totalShares ||
      activeItems.reduce((sum, item) => sum + (item.isNegative ? -item.shares : item.shares), 0);

    let cumulative = 0;

    return activeItems.map((item) => {
      const shares = item.isNegative ? -item.shares : item.shares;
      const percentage = item.percentage ?? (shares / total) * 100;
      cumulative += percentage;

      return {
        ...item,
        shares: Math.abs(item.shares),
        percentage,
        cumulativePercentage: cumulative,
        fill: item.color || SOURCE_COLORS[item.source] || SOURCE_COLORS.other,
        total,
      };
    });
  }, [activeItems, totalShares]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDilution = processedData.reduce((sum, d) => sum + d.percentage, 0);
    const sponsorDilution = processedData
      .filter((d) => ['sponsor_promote', 'founder_shares'].includes(d.source))
      .reduce((sum, d) => sum + d.percentage, 0);
    const warrantDilution = processedData
      .filter((d) => ['private_warrants', 'public_warrants'].includes(d.source))
      .reduce((sum, d) => sum + d.percentage, 0);
    const pipeDilution = processedData
      .filter((d) => d.source === 'pipe_shares')
      .reduce((sum, d) => sum + d.percentage, 0);

    return {
      totalDilution,
      sponsorDilution,
      warrantDilution,
      pipeDilution,
      totalShares: processedData[0]?.total || 0,
    };
  }, [processedData]);

  // Loading state
  if (isLoading) {
    return <DilutionWaterfallSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-danger-400" />
          <p className="mt-4 text-sm font-medium text-danger-700">
            Failed to load dilution data
          </p>
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!activeItems || activeItems.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingDown className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No dilution data available
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Add share structure data to view dilution analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary-600" />
            {title}
          </CardTitle>
          <UITooltip content="Shows the impact of each share class on ownership dilution">
            <Info className="h-4 w-4 text-slate-400" />
          </UITooltip>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            Total: {formatLargeNumber(stats.totalShares)} shares
          </Badge>
          {scenarios && scenarios.length > 0 && (
            <select
              value={selectedScenario || ''}
              onChange={(e) => setSelectedScenario(e.target.value || null)}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm"
            >
              <option value="">Base Case</option>
              {scenarios.map((scenario) => (
                <option key={scenario.name} value={scenario.name}>
                  {scenario.name} ({scenario.redemptionRate}% redemption)
                </option>
              ))}
            </select>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs font-medium text-slate-500">Total Dilution</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {formatPercent(stats.totalDilution)}
            </p>
          </div>
          <div className="rounded-lg bg-violet-50 p-3 text-center">
            <p className="text-xs font-medium text-violet-600">Sponsor</p>
            <p className="mt-1 text-lg font-bold text-violet-700">
              {formatPercent(stats.sponsorDilution)}
            </p>
          </div>
          <div className="rounded-lg bg-rose-50 p-3 text-center">
            <p className="text-xs font-medium text-rose-600">Warrants</p>
            <p className="mt-1 text-lg font-bold text-rose-700">
              {formatPercent(stats.warrantDilution)}
            </p>
          </div>
          <div className="rounded-lg bg-teal-50 p-3 text-center">
            <p className="text-xs font-medium text-teal-600">PIPE</p>
            <p className="mt-1 text-lg font-bold text-teal-700">
              {formatPercent(stats.pipeDilution)}
            </p>
          </div>
        </div>

        {/* Waterfall Chart */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#475569' }}
                axisLine={{ stroke: '#E2E8F0' }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#64748B' }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={(value) => `${value.toFixed(0)}%`}
                domain={[0, 'auto']}
              />
              <Tooltip content={<CustomTooltip />} />
              {targetOwnership && (
                <ReferenceLine
                  y={targetOwnership}
                  stroke="#EF4444"
                  strokeDasharray="5 5"
                  label={{
                    value: `Target: ${targetOwnership}%`,
                    position: 'right',
                    fill: '#EF4444',
                    fontSize: 11,
                  }}
                />
              )}
              <Bar
                dataKey="percentage"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data) => onItemClick?.(data)}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                {showPercentages && (
                  <LabelList
                    dataKey="percentage"
                    position="top"
                    fill="#475569"
                    fontSize={10}
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                  />
                )}
              </Bar>
              {showCumulativeLine && (
                <Line
                  type="monotone"
                  dataKey="cumulativePercentage"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ fill: '#6366F1', r: 4 }}
                  name="Cumulative"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          {processedData.map((item) => (
            <div key={item.id} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
              <span className="text-xs text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
        <span>
          {showCumulativeLine && (
            <>
              <span className="inline-flex items-center gap-1">
                <div className="h-0.5 w-4 bg-indigo-500" />
                Cumulative Ownership
              </span>
            </>
          )}
        </span>
        <span>
          Based on fully diluted share count
        </span>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// COMPACT TABLE VIEW
// ============================================================================

interface DilutionTableProps {
  items: DilutionItem[];
  totalShares?: number;
  className?: string;
}

export function DilutionTable({ items, totalShares, className }: DilutionTableProps) {
  const processedData = useMemo(() => {
    const total =
      totalShares ||
      items.reduce((sum, item) => sum + (item.isNegative ? -item.shares : item.shares), 0);

    let cumulative = 0;

    return items.map((item) => {
      const shares = item.isNegative ? -item.shares : item.shares;
      const percentage = item.percentage ?? (shares / total) * 100;
      cumulative += percentage;

      return {
        ...item,
        shares: Math.abs(item.shares),
        percentage,
        cumulativePercentage: cumulative,
      };
    });
  }, [items, totalShares]);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                Source
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                Shares
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                % Ownership
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                Cumulative
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, index) => (
              <tr
                key={item.id}
                className={cn(
                  'border-b border-slate-100',
                  index % 2 === 0 && 'bg-white',
                  index % 2 !== 0 && 'bg-slate-50/50'
                )}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor:
                          item.color || SOURCE_COLORS[item.source] || SOURCE_COLORS.other,
                      }}
                    />
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                  {formatLargeNumber(item.shares)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-slate-600">
                  {formatPercent(item.percentage)}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-indigo-600">
                  {formatPercent(item.cumulativePercentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MINI DILUTION INDICATOR
// ============================================================================

interface DilutionIndicatorProps {
  totalDilution: number;
  sponsorDilution: number;
  warningThreshold?: number;
  className?: string;
}

export function DilutionIndicator({
  totalDilution,
  sponsorDilution,
  warningThreshold = 30,
  className,
}: DilutionIndicatorProps) {
  const isWarning = totalDilution > warningThreshold;

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        isWarning ? 'border-warning-200 bg-warning-50' : 'border-slate-200 bg-slate-50',
        className
      )}
    >
      <TrendingDown
        className={cn('h-5 w-5', isWarning ? 'text-warning-600' : 'text-slate-600')}
      />
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-500">Total Dilution</p>
        <p
          className={cn(
            'text-lg font-bold',
            isWarning ? 'text-warning-700' : 'text-slate-900'
          )}
        >
          {formatPercent(totalDilution)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500">Sponsor</p>
        <p className="text-sm font-medium text-slate-700">
          {formatPercent(sponsorDilution)}
        </p>
      </div>
    </div>
  );
}
