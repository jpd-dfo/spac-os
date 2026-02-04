'use client';

import { useMemo, useState } from 'react';

import {
  Target,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Calendar,
  Award,
  Percent,
  Info,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import '@/components/ui/Tooltip';
import { cn, formatLargeNumber, formatDate, formatCurrency } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type MilestoneType = 'revenue' | 'ebitda' | 'stock_price' | 'operational' | 'custom';
type MilestoneStatus = 'achieved' | 'on_track' | 'at_risk' | 'missed' | 'pending';

interface EarnoutMilestone {
  id: string;
  name: string;
  type: MilestoneType;
  targetValue: number;
  currentValue?: number;
  unit: string;
  shares: number;
  valuePerShare?: number;
  deadline: Date | string;
  status: MilestoneStatus;
  probability: number; // 0-100
  achievedDate?: Date | string;
  notes?: string;
  tracking?: Array<{
    date: string;
    value: number;
  }>;
}

interface EarnoutTrackerProps {
  milestones: EarnoutMilestone[];
  totalEarnoutShares: number;
  currentStockPrice?: number;
  targetName?: string;
  measurementPeriodStart?: Date | string;
  measurementPeriodEnd?: Date | string;
  onMilestoneClick?: (milestone: EarnoutMilestone) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MILESTONE_TYPE_LABELS: Record<MilestoneType, string> = {
  revenue: 'Revenue',
  ebitda: 'EBITDA',
  stock_price: 'Stock Price',
  operational: 'Operational',
  custom: 'Custom',
};

const MILESTONE_TYPE_ICONS: Record<MilestoneType, React.ReactNode> = {
  revenue: <DollarSign className="h-4 w-4" />,
  ebitda: <TrendingUp className="h-4 w-4" />,
  stock_price: <TrendingUp className="h-4 w-4" />,
  operational: <Target className="h-4 w-4" />,
  custom: <Award className="h-4 w-4" />,
};

const STATUS_CONFIG: Record<MilestoneStatus, { label: string; color: string; badge: 'success' | 'warning' | 'danger' | 'secondary' | 'primary' }> = {
  achieved: { label: 'Achieved', color: '#22C55E', badge: 'success' },
  on_track: { label: 'On Track', color: '#3B82F6', badge: 'primary' },
  at_risk: { label: 'At Risk', color: '#F59E0B', badge: 'warning' },
  missed: { label: 'Missed', color: '#EF4444', badge: 'danger' },
  pending: { label: 'Pending', color: '#94A3B8', badge: 'secondary' },
};

// ============================================================================
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_EARNOUT_DATA: Omit<EarnoutTrackerProps, 'className' | 'onMilestoneClick'> = {
  targetName: 'TechCorp Inc.',
  totalEarnoutShares: 6000000,
  currentStockPrice: 11.25,
  measurementPeriodStart: '2025-03-15',
  measurementPeriodEnd: '2028-03-15',
  milestones: [
    {
      id: '1',
      name: 'Year 1 Revenue Target',
      type: 'revenue',
      targetValue: 150000000,
      currentValue: 142000000,
      unit: '$',
      shares: 1500000,
      deadline: '2026-03-15',
      status: 'on_track',
      probability: 85,
      notes: 'Tracking well against Q3 projections',
      tracking: [
        { date: '2025-06', value: 32000000 },
        { date: '2025-09', value: 72000000 },
        { date: '2025-12', value: 108000000 },
        { date: '2026-03', value: 142000000 },
      ],
    },
    {
      id: '2',
      name: 'Year 2 Revenue Target',
      type: 'revenue',
      targetValue: 200000000,
      unit: '$',
      shares: 1500000,
      deadline: '2027-03-15',
      status: 'pending',
      probability: 70,
    },
    {
      id: '3',
      name: 'EBITDA Margin Target',
      type: 'ebitda',
      targetValue: 25,
      currentValue: 22,
      unit: '%',
      shares: 1500000,
      deadline: '2027-03-15',
      status: 'at_risk',
      probability: 55,
      notes: 'Margin expansion behind schedule due to increased S&M spend',
      tracking: [
        { date: '2025-06', value: 18 },
        { date: '2025-09', value: 20 },
        { date: '2025-12', value: 21 },
        { date: '2026-03', value: 22 },
      ],
    },
    {
      id: '4',
      name: 'Stock Price Target ($15)',
      type: 'stock_price',
      targetValue: 15,
      currentValue: 11.25,
      unit: '$',
      shares: 1000000,
      deadline: '2028-03-15',
      status: 'on_track',
      probability: 65,
      notes: '20-day VWAP must exceed $15 for 10 consecutive trading days',
      tracking: [
        { date: '2025-06', value: 10.50 },
        { date: '2025-09', value: 10.80 },
        { date: '2025-12', value: 11.00 },
        { date: '2026-03', value: 11.25 },
      ],
    },
    {
      id: '5',
      name: 'Key Customer Acquisition',
      type: 'operational',
      targetValue: 5,
      currentValue: 3,
      unit: 'enterprise customers',
      shares: 500000,
      deadline: '2026-06-15',
      status: 'on_track',
      probability: 80,
      notes: 'Fortune 500 enterprise customer wins',
    },
  ],
};

// ============================================================================
// CUSTOM CHART TOOLTIP
// ============================================================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
  unit?: string;
}

function ChartTooltip({ active, payload, label, unit = '' }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {return null;}

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="mt-1 text-xs" style={{ color: entry.color }}>
          {entry.name}: {unit}{entry.value.toLocaleString()}{unit === '%' ? '%' : ''}
        </p>
      ))}
    </div>
  );
}

// ============================================================================
// MILESTONE CARD
// ============================================================================

interface MilestoneCardProps {
  milestone: EarnoutMilestone;
  currentStockPrice?: number;
  onClick?: () => void;
}

function MilestoneCard({ milestone, currentStockPrice, onClick }: MilestoneCardProps) {
  const statusConfig = STATUS_CONFIG[milestone.status];
  const progress = milestone.currentValue
    ? (milestone.currentValue / milestone.targetValue) * 100
    : 0;

  const potentialValue = currentStockPrice
    ? milestone.shares * currentStockPrice
    : undefined;

  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:border-primary-200 hover:shadow-md',
        milestone.status === 'achieved' && 'border-success-200 bg-success-50/50',
        milestone.status === 'missed' && 'border-danger-200 bg-danger-50/50 opacity-60'
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                milestone.status === 'achieved' ? 'bg-success-100' : 'bg-slate-100'
              )}
            >
              {MILESTONE_TYPE_ICONS[milestone.type]}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{milestone.name}</p>
              <p className="text-xs text-slate-500">{MILESTONE_TYPE_LABELS[milestone.type]}</p>
            </div>
          </div>
          <Badge variant={statusConfig.badge} size="sm">
            {milestone.status === 'achieved' && <CheckCircle className="mr-1 h-3 w-3" />}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Target and Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Target</span>
            <span className="font-semibold text-slate-900">
              {milestone.unit === '$' && '$'}
              {milestone.targetValue.toLocaleString()}
              {milestone.unit === '%' && '%'}
              {milestone.unit !== '$' && milestone.unit !== '%' && ` ${milestone.unit}`}
            </span>
          </div>
          {milestone.currentValue !== undefined && (
            <>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-slate-500">Current</span>
                <span className={cn(
                  'font-medium',
                  progress >= 100 ? 'text-success-600' : 'text-slate-700'
                )}>
                  {milestone.unit === '$' && '$'}
                  {milestone.currentValue.toLocaleString()}
                  {milestone.unit === '%' && '%'}
                </span>
              </div>
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      milestone.status === 'achieved' && 'bg-success-500',
                      milestone.status === 'on_track' && 'bg-primary-500',
                      milestone.status === 'at_risk' && 'bg-warning-500',
                      milestone.status === 'missed' && 'bg-danger-500',
                      milestone.status === 'pending' && 'bg-slate-400'
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-xs text-slate-500">
                  {progress.toFixed(1)}% complete
                </p>
              </div>
            </>
          )}
        </div>

        {/* Shares and Value */}
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3">
          <div>
            <p className="text-xs text-slate-500">Earnout Shares</p>
            <p className="mt-0.5 text-sm font-semibold text-slate-900">
              {milestone.shares.toLocaleString()}
            </p>
          </div>
          {potentialValue && (
            <div>
              <p className="text-xs text-slate-500">Potential Value</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {formatLargeNumber(potentialValue)}
              </p>
            </div>
          )}
        </div>

        {/* Probability and Deadline */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              {milestone.probability}% probability
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">
              {formatDate(milestone.deadline)}
            </span>
          </div>
        </div>

        {/* Notes */}
        {milestone.notes && (
          <p className="mt-3 text-xs text-slate-500 italic">{milestone.notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function EarnoutTracker({
  milestones,
  totalEarnoutShares,
  currentStockPrice,
  targetName,
  measurementPeriodStart,
  measurementPeriodEnd,
  onMilestoneClick,
  className,
}: EarnoutTrackerProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);

  // Calculate metrics
  const metrics = useMemo(() => {
    const achieved = milestones.filter((m) => m.status === 'achieved');
    const onTrack = milestones.filter((m) => m.status === 'on_track');
    const atRisk = milestones.filter((m) => m.status === 'at_risk');
    const missed = milestones.filter((m) => m.status === 'missed');
    const pending = milestones.filter((m) => m.status === 'pending');

    const achievedShares = achieved.reduce((sum, m) => sum + m.shares, 0);
    const expectedShares = milestones.reduce(
      (sum, m) => sum + m.shares * (m.probability / 100),
      0
    );
    const atRiskShares = atRisk.reduce((sum, m) => sum + m.shares, 0);

    const achievedValue = currentStockPrice ? achievedShares * currentStockPrice : 0;
    const expectedValue = currentStockPrice ? expectedShares * currentStockPrice : 0;
    const totalPotentialValue = currentStockPrice ? totalEarnoutShares * currentStockPrice : 0;

    const avgProbability =
      milestones.reduce((sum, m) => sum + m.probability, 0) / milestones.length;

    return {
      achieved,
      onTrack,
      atRisk,
      missed,
      pending,
      achievedShares,
      expectedShares,
      atRiskShares,
      achievedValue,
      expectedValue,
      totalPotentialValue,
      avgProbability,
    };
  }, [milestones, totalEarnoutShares, currentStockPrice]);

  // Chart data for probability
  const probabilityChartData = useMemo(() => {
    return milestones.map((m) => ({
      name: m.name.length > 20 ? m.name.slice(0, 20) + '...' : m.name,
      probability: m.probability,
      shares: m.shares,
      color: STATUS_CONFIG[m.status].color,
    }));
  }, [milestones]);

  // Selected milestone tracking data
  const selectedMilestoneData = useMemo(() => {
    if (!selectedMilestone) {return null;}
    return milestones.find((m) => m.id === selectedMilestone);
  }, [milestones, selectedMilestone]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Earnout Tracker</h2>
          <p className="text-sm text-slate-500">
            {targetName && `${targetName} | `}
            {totalEarnoutShares.toLocaleString()} total earnout shares
            {measurementPeriodStart && measurementPeriodEnd && (
              <span> | {formatDate(measurementPeriodStart)} - {formatDate(measurementPeriodEnd)}</span>
            )}
          </p>
        </div>
        {currentStockPrice && (
          <Badge variant="primary" size="lg">
            Current Price: {formatCurrency(currentStockPrice)}
          </Badge>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <Card className="border-success-200 bg-success-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="mx-auto h-6 w-6 text-success-600" />
            <p className="mt-2 text-xs font-medium text-success-600">Achieved</p>
            <p className="text-xl font-bold text-success-700">{metrics.achieved.length}</p>
            <p className="text-xs text-success-600">
              {metrics.achievedShares.toLocaleString()} shares
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary-200 bg-primary-50">
          <CardContent className="p-4 text-center">
            <TrendingUp className="mx-auto h-6 w-6 text-primary-600" />
            <p className="mt-2 text-xs font-medium text-primary-600">On Track</p>
            <p className="text-xl font-bold text-primary-700">{metrics.onTrack.length}</p>
          </CardContent>
        </Card>

        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-warning-600" />
            <p className="mt-2 text-xs font-medium text-warning-600">At Risk</p>
            <p className="text-xl font-bold text-warning-700">{metrics.atRisk.length}</p>
            <p className="text-xs text-warning-600">
              {metrics.atRiskShares.toLocaleString()} shares
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4 text-center">
            <Clock className="mx-auto h-6 w-6 text-slate-500" />
            <p className="mt-2 text-xs font-medium text-slate-500">Pending</p>
            <p className="text-xl font-bold text-slate-700">{metrics.pending.length}</p>
          </CardContent>
        </Card>

        <Card className="border-violet-200 bg-violet-50">
          <CardContent className="p-4 text-center">
            <Percent className="mx-auto h-6 w-6 text-violet-600" />
            <p className="mt-2 text-xs font-medium text-violet-600">Avg Probability</p>
            <p className="text-xl font-bold text-violet-700">
              {metrics.avgProbability.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Value Summary */}
      {currentStockPrice && (
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-violet-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-violet-100">Expected Value (Probability-Weighted)</p>
                <p className="mt-1 text-4xl font-bold">{formatLargeNumber(metrics.expectedValue)}</p>
                <p className="mt-2 text-sm text-violet-200">
                  Based on {Math.round(metrics.expectedShares).toLocaleString()} expected shares
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-violet-100">Total Potential</p>
                <p className="mt-1 text-2xl font-bold">{formatLargeNumber(metrics.totalPotentialValue)}</p>
                <p className="mt-2 text-sm text-violet-200">
                  {totalEarnoutShares.toLocaleString()} shares @ {formatCurrency(currentStockPrice)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs text-violet-100">
                <span>Achieved: {formatLargeNumber(metrics.achievedValue)}</span>
                <span>Expected: {formatLargeNumber(metrics.expectedValue)}</span>
              </div>
              <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/20">
                <div className="flex h-full">
                  <div
                    className="bg-white transition-all"
                    style={{ width: `${(metrics.achievedValue / metrics.totalPotentialValue) * 100}%` }}
                    title="Achieved"
                  />
                  <div
                    className="bg-white/50 transition-all"
                    style={{ width: `${((metrics.expectedValue - metrics.achievedValue) / metrics.totalPotentialValue) * 100}%` }}
                    title="Expected (remaining)"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Charts and Detail */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Probability Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary-600" />
              Achievement Probability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={probabilityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    width={120}
                  />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <ReferenceLine x={50} stroke="#94A3B8" strokeDasharray="5 5" />
                  <Bar dataKey="probability" radius={[0, 4, 4, 0]} name="Probability">
                    {probabilityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tracking Chart for Selected Milestone */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Milestone Progress Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMilestoneData?.tracking ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedMilestoneData.tracking}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) =>
                        selectedMilestoneData.unit === '$'
                          ? `$${(v / 1000000).toFixed(0)}M`
                          : selectedMilestoneData.unit === '%'
                            ? `${v}%`
                            : v
                      }
                    />
                    <Tooltip
                      content={
                        <ChartTooltip
                          unit={selectedMilestoneData.unit === '$' ? '$' : ''}
                        />
                      }
                    />
                    <ReferenceLine
                      y={selectedMilestoneData.targetValue}
                      stroke="#EF4444"
                      strokeDasharray="5 5"
                      label={{
                        value: 'Target',
                        position: 'right',
                        fill: '#EF4444',
                        fontSize: 11,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ fill: '#3B82F6', r: 5 }}
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] flex-col items-center justify-center text-center">
                <Info className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm text-slate-500">
                  Select a milestone to view tracking data
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Click on any milestone card below
                </p>
              </div>
            )}
          </CardContent>
          {selectedMilestoneData && (
            <CardFooter className="text-xs text-slate-500">
              Tracking: {selectedMilestoneData.name}
            </CardFooter>
          )}
        </Card>
      </div>

      {/* Milestone Cards */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Earnout Milestones</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {milestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              currentStockPrice={currentStockPrice}
              onClick={() => {
                setSelectedMilestone(milestone.id);
                onMilestoneClick?.(milestone);
              }}
            />
          ))}
        </div>
      </div>

      {/* Share Release Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Share Release Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Milestone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Target</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Shares</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Probability</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Deadline</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {milestones.map((milestone, _index) => (
                  <tr
                    key={milestone.id}
                    className={cn(
                      'border-t border-slate-100 transition-colors hover:bg-slate-50 cursor-pointer',
                      selectedMilestone === milestone.id && 'bg-primary-50',
                      milestone.status === 'missed' && 'opacity-50'
                    )}
                    onClick={() => setSelectedMilestone(milestone.id)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {milestone.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {MILESTONE_TYPE_LABELS[milestone.type]}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {milestone.unit === '$' && '$'}
                      {milestone.targetValue.toLocaleString()}
                      {milestone.unit === '%' && '%'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      {milestone.shares.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              milestone.probability >= 70 && 'bg-success-500',
                              milestone.probability >= 40 && milestone.probability < 70 && 'bg-warning-500',
                              milestone.probability < 40 && 'bg-danger-500'
                            )}
                            style={{ width: `${milestone.probability}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">{milestone.probability}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {formatDate(milestone.deadline)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={STATUS_CONFIG[milestone.status].badge} size="sm">
                        {STATUS_CONFIG[milestone.status].label}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-100">
                  <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-slate-700">
                    Total Earnout Shares
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                    {totalEarnoutShares.toLocaleString()}
                  </td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
