'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import {
  Building2,
  TrendingUp,
  DollarSign,
  Calendar,
  Percent,
  ArrowUpRight,
  Download,
  RefreshCw,
  CreditCard,
  Landmark,
  Clock,
  PiggyBank,
  ArrowDownRight,
  Info,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip as UITooltip } from '@/components/ui/Tooltip';
import { cn, formatCurrency, formatLargeNumber, formatDate, formatPercent } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface TrustHolding {
  id: string;
  type: 'treasury_bills' | 'money_market' | 'cash' | 'other';
  name: string;
  value: number;
  yield: number;
  maturityDate?: Date | string;
  percentage: number;
}

interface TrustWithdrawal {
  id: string;
  date: Date | string;
  amount: number;
  reason: string;
  recipient: string;
  approvedBy: string;
}

interface TrustBalanceHistory {
  date: string;
  balance: number;
  interest: number;
  withdrawals: number;
}

interface TrustAccountDashboardProps {
  spacName: string;
  spacTicker: string;
  ipoDate: Date | string;
  deadlineDate: Date | string;
  initialTrustValue: number;
  currentTrustValue: number;
  interestAccrued: number;
  interestRate: number;
  sharesOutstanding: number;
  holdings: TrustHolding[];
  withdrawalHistory: TrustWithdrawal[];
  balanceHistory: TrustBalanceHistory[];
  extensions?: number;
  onRefresh?: () => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const HOLDING_COLORS: Record<TrustHolding['type'], string> = {
  treasury_bills: '#3B82F6',
  money_market: '#8B5CF6',
  cash: '#10B981',
  other: '#6B7280',
};

const HOLDING_LABELS: Record<TrustHolding['type'], string> = {
  treasury_bills: 'Treasury Bills',
  money_market: 'Money Market',
  cash: 'Cash',
  other: 'Other',
};

// ============================================================================
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_TRUST_DATA: Omit<TrustAccountDashboardProps, 'className' | 'onRefresh'> = {
  spacName: 'Soren Acquisition Corporation',
  spacTicker: 'SOAR',
  ipoDate: '2023-03-15',
  deadlineDate: '2025-03-15',
  initialTrustValue: 253000000,
  currentTrustValue: 261350000,
  interestAccrued: 8350000,
  interestRate: 0.0485,
  sharesOutstanding: 25300000,
  extensions: 0,
  holdings: [
    {
      id: '1',
      type: 'treasury_bills',
      name: 'US Treasury Bills 4.8%',
      value: 220000000,
      yield: 0.048,
      maturityDate: '2025-02-15',
      percentage: 84.1,
    },
    {
      id: '2',
      type: 'money_market',
      name: 'Federated Prime MMF',
      value: 35000000,
      yield: 0.051,
      percentage: 13.4,
    },
    {
      id: '3',
      type: 'cash',
      name: 'Operating Cash',
      value: 6350000,
      yield: 0,
      percentage: 2.5,
    },
  ],
  withdrawalHistory: [
    {
      id: '1',
      date: '2024-06-15',
      amount: 1500000,
      reason: 'Extension Payment',
      recipient: 'Trust Account',
      approvedBy: 'Board of Directors',
    },
    {
      id: '2',
      date: '2024-01-10',
      amount: 250000,
      reason: 'Operating Expenses',
      recipient: 'SPAC Operating Account',
      approvedBy: 'CFO',
    },
  ],
  balanceHistory: [
    { date: '2023-03', balance: 253000000, interest: 0, withdrawals: 0 },
    { date: '2023-06', balance: 255100000, interest: 2100000, withdrawals: 0 },
    { date: '2023-09', balance: 257300000, interest: 4300000, withdrawals: 0 },
    { date: '2023-12', balance: 259500000, interest: 6500000, withdrawals: 0 },
    { date: '2024-03', balance: 261200000, interest: 8200000, withdrawals: 0 },
    { date: '2024-06', balance: 259950000, interest: 8700000, withdrawals: 1750000 },
    { date: '2024-09', balance: 261350000, interest: 10100000, withdrawals: 1750000 },
    { date: '2024-12', balance: 261350000, interest: 8350000, withdrawals: 0 },
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
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-sm font-medium text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatLargeNumber(entry.value)}
          </p>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// METRIC CARD
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  highlight?: boolean;
}

function MetricCard({ label, value, subValue, icon, trend, trendValue, highlight }: MetricCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 transition-all',
        highlight
          ? 'border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100'
          : 'border-slate-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'rounded-lg p-2',
            highlight ? 'bg-primary-200' : 'bg-slate-100'
          )}
        >
          {icon}
        </div>
        {trend && trendValue && (
          <div
            className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend === 'up' && 'text-success-600',
              trend === 'down' && 'text-danger-600',
              trend === 'neutral' && 'text-slate-500'
            )}
          >
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p
          className={cn(
            'mt-1 text-xl font-bold',
            highlight ? 'text-primary-700' : 'text-slate-900'
          )}
        >
          {value}
        </p>
        {subValue && <p className="mt-0.5 text-xs text-slate-500">{subValue}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrustAccountDashboard({
  spacName,
  spacTicker,
  ipoDate,
  deadlineDate,
  initialTrustValue,
  currentTrustValue,
  interestAccrued,
  interestRate,
  sharesOutstanding,
  holdings,
  withdrawalHistory,
  balanceHistory,
  extensions = 0,
  onRefresh,
  className,
}: TrustAccountDashboardProps) {
  const [realTimeInterest, setRealTimeInterest] = useState(interestAccrued);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Calculate derived values
  const calculations = useMemo(() => {
    const totalWithdrawals = withdrawalHistory.reduce((sum, w) => sum + w.amount, 0);
    const pricePerShare = currentTrustValue / sharesOutstanding;
    const growthFromIPO = ((currentTrustValue - initialTrustValue) / initialTrustValue) * 100;
    const dailyInterestRate = interestRate / 365;
    const dailyInterest = currentTrustValue * dailyInterestRate;
    const weightedYield =
      holdings.reduce((sum, h) => sum + h.yield * h.percentage, 0) / 100;

    return {
      totalWithdrawals,
      pricePerShare,
      growthFromIPO,
      dailyInterestRate,
      dailyInterest,
      weightedYield,
    };
  }, [currentTrustValue, initialTrustValue, sharesOutstanding, interestRate, holdings, withdrawalHistory]);

  // Real-time interest simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeInterest((prev) => prev + calculations.dailyInterest / 86400);
      setLastUpdate(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, [calculations.dailyInterest]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Trust Account</h2>
          <p className="text-sm text-slate-500">
            {spacName} ({spacTicker})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            IPO: {formatDate(ipoDate)}
          </Badge>
          <Badge variant={extensions > 0 ? 'warning' : 'success'}>
            Deadline: {formatDate(deadlineDate)}
          </Badge>
          {onRefresh && (
            <Button variant="secondary" size="sm" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Main Trust Value Display */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-8 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Total Trust Value</p>
              <p className="mt-2 text-4xl font-bold">{formatLargeNumber(currentTrustValue)}</p>
              <div className="mt-3 flex items-center gap-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                  <TrendingUp className="h-4 w-4" />+{formatCurrency(realTimeInterest)} interest
                </span>
                <span className="text-sm text-primary-100">
                  +{calculations.growthFromIPO.toFixed(2)}% from IPO
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-100">Per Share Value</p>
              <p className="mt-1 text-3xl font-bold">
                {formatCurrency(calculations.pricePerShare)}
              </p>
              <p className="mt-1 text-sm text-primary-200">
                {sharesOutstanding.toLocaleString()} shares
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-primary-100">
              <span>Growth Progress</span>
              <span>Target: 10%+ growth</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(calculations.growthFromIPO * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard
          label="Initial Trust"
          value={formatLargeNumber(initialTrustValue)}
          subValue={`IPO at ${formatCurrency(10)}/share`}
          icon={<DollarSign className="h-4 w-4 text-slate-600" />}
        />
        <MetricCard
          label="Interest Rate (APY)"
          value={formatPercent(interestRate * 100)}
          subValue={`${formatCurrency(calculations.dailyInterest)}/day`}
          icon={<Percent className="h-4 w-4 text-slate-600" />}
          trend="up"
          trendValue={formatPercent(calculations.weightedYield * 100)}
        />
        <MetricCard
          label="Interest Accrued"
          value={formatCurrency(realTimeInterest)}
          subValue="Since IPO"
          icon={<TrendingUp className="h-4 w-4 text-success-600" />}
          trend="up"
          trendValue="Live"
          highlight
        />
        <MetricCard
          label="Total Withdrawals"
          value={formatCurrency(calculations.totalWithdrawals)}
          subValue={`${withdrawalHistory.length} transactions`}
          icon={<ArrowDownRight className="h-4 w-4 text-slate-600" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Balance Over Time Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Trust Balance History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceHistory}>
                  <defs>
                    <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    axisLine={{ stroke: '#E2E8F0' }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
                    domain={['dataMin - 5000000', 'dataMax + 5000000']}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="balance"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="url(#balanceGradient)"
                    name="Balance"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Investment Holdings Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5 text-primary-600" />
              Investment Holdings
            </CardTitle>
            <UITooltip content="Trust assets allocation">
              <Info className="h-4 w-4 text-slate-400" />
            </UITooltip>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={holdings} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    width={150}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Value">
                    {holdings.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={HOLDING_COLORS[entry.type]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Holdings Legend */}
            <div className="mt-4 space-y-2">
              {holdings.map((holding) => (
                <div
                  key={holding.id}
                  className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: HOLDING_COLORS[holding.type] }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-700">{holding.name}</p>
                      <p className="text-xs text-slate-500">
                        {HOLDING_LABELS[holding.type]} | Yield: {formatPercent(holding.yield * 100)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatLargeNumber(holding.value)}
                    </p>
                    <p className="text-xs text-slate-500">{holding.percentage.toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary-600" />
            Withdrawal History
          </CardTitle>
          <Badge variant="secondary">{withdrawalHistory.length} transactions</Badge>
        </CardHeader>
        <CardContent>
          {withdrawalHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Landmark className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">No withdrawals yet</p>
              <p className="mt-1 text-xs text-slate-400">
                Trust funds remain fully invested
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Reason
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Recipient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Approved By
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalHistory.map((withdrawal, index) => (
                    <tr
                      key={withdrawal.id}
                      className={cn(
                        'border-t border-slate-100',
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                      )}
                    >
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {formatDate(withdrawal.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{withdrawal.reason}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{withdrawal.recipient}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{withdrawal.approvedBy}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-danger-600">
                        -{formatCurrency(withdrawal.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={4} className="px-4 py-3 text-sm font-medium text-slate-700">
                      Total Withdrawals
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatCurrency(calculations.totalWithdrawals)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex items-center justify-between text-xs text-slate-500">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Real-time tracking enabled
          </span>
        </CardFooter>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPACT TRUST SUMMARY
// ============================================================================

interface TrustSummaryProps {
  trustValue: number;
  pricePerShare: number;
  interestRate: number;
  sharesOutstanding: number;
  className?: string;
  onClick?: () => void;
}

export function TrustSummary({
  trustValue,
  pricePerShare,
  interestRate,
  sharesOutstanding,
  className,
  onClick,
}: TrustSummaryProps) {
  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:border-primary-200 hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-100 p-2">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Trust Account</p>
              <p className="text-xs text-slate-500">
                {sharesOutstanding.toLocaleString()} shares
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">{formatLargeNumber(trustValue)}</p>
            <p className="text-xs text-slate-500">
              {formatCurrency(pricePerShare)}/share | {formatPercent(interestRate * 100)} APY
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
