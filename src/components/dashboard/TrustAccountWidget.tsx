'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Building2,
  TrendingUp,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle,
  Percent,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatCurrency, formatLargeNumber, formatDate, formatPercent } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface TrustBalanceHistory {
  date: string;
  balance: number;
}

interface TrustAccountData {
  id: string;
  spacName: string;
  spacTicker: string;
  initialTrustValue: number;
  currentTrustValue: number;
  interestRate: number; // Annual rate as decimal (e.g., 0.045 for 4.5%)
  interestAccrued: number;
  lastInterestDate: Date | string;
  ipoDate: Date | string;
  deadlineDate: Date | string;
  sharesOutstanding: number;
  redemptionPrice?: number;
  withdrawals?: number;
  extensions?: number;
  balanceHistory?: TrustBalanceHistory[];
}

interface TrustAccountWidgetProps {
  data?: TrustAccountData | null;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  showInterestAccrual?: boolean;
  showMiniChart?: boolean;
  autoRefreshInterval?: number; // In milliseconds
  className?: string;
}

// ============================================================================
// MOCK DATA FOR SOREN ACQUISITION CORPORATION
// ============================================================================

export const mockTrustAccountData: TrustAccountData = {
  id: 'trust-soren-001',
  spacName: 'Soren Acquisition Corporation',
  spacTicker: 'SOAC',
  initialTrustValue: 253000000, // $253M IPO
  currentTrustValue: 253000000,
  interestRate: 0.045, // 4.5% annual interest
  interestAccrued: 475000, // ~$475K accrued since Jan 15
  lastInterestDate: new Date('2026-01-15'),
  ipoDate: new Date('2026-01-15'),
  deadlineDate: new Date('2028-01-15'),
  sharesOutstanding: 25300000, // 25.3M shares
  redemptionPrice: 10.02,
  withdrawals: 0,
  extensions: 0,
  balanceHistory: [
    { date: 'Jan 15', balance: 253000000 },
    { date: 'Jan 17', balance: 253031500 },
    { date: 'Jan 19', balance: 253063000 },
    { date: 'Jan 21', balance: 253094500 },
    { date: 'Jan 23', balance: 253126000 },
    { date: 'Jan 25', balance: 253157500 },
    { date: 'Jan 27', balance: 253189000 },
    { date: 'Jan 29', balance: 253220500 },
  ],
};

interface TrustMetricProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function TrustMetric({ label, value, subValue, icon, highlight }: TrustMetricProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg p-3',
        highlight ? 'bg-primary-50' : 'bg-slate-50'
      )}
    >
      {icon && (
        <div
          className={cn(
            'rounded-lg p-2',
            highlight ? 'bg-primary-100' : 'bg-white'
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p
          className={cn(
            'text-lg font-semibold',
            highlight ? 'text-primary-700' : 'text-slate-900'
          )}
        >
          {value}
        </p>
        {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
      </div>
    </div>
  );
}

interface MiniChartProps {
  data: TrustBalanceHistory[];
}

function MiniTrustChart({ data }: MiniChartProps) {
  const formatYAxis = (value: number) => {
    return `$${(value / 1000000).toFixed(0)}M`;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ value: number; payload: TrustBalanceHistory }> }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
          <p className="text-xs text-slate-500">{payload[0].payload.date}</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatLargeNumber(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={['dataMin - 100000', 'dataMax + 100000']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            tickFormatter={formatYAxis}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#trustGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TrustAccountSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-48 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-20 rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
          <div className="h-24 rounded-lg bg-slate-200" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TrustAccountWidget({
  data = mockTrustAccountData,
  isLoading = false,
  error = null,
  onRefresh,
  showInterestAccrual = true,
  showMiniChart = true,
  autoRefreshInterval,
  className,
}: TrustAccountWidgetProps) {
  // Real-time interest accrual state
  const [realTimeInterest, setRealTimeInterest] = useState<number>(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Calculate daily interest rate
  const dailyInterestRate = useMemo(() => {
    if (!data?.interestRate) return 0;
    return data.interestRate / 365;
  }, [data?.interestRate]);

  // Calculate real-time accrued interest
  const calculateRealTimeInterest = useCallback(() => {
    if (!data || !showInterestAccrual) return 0;

    const lastInterestDate = new Date(data.lastInterestDate);
    const now = new Date();
    const daysSinceLastInterest = (now.getTime() - lastInterestDate.getTime()) / (1000 * 60 * 60 * 24);

    // Interest = Principal * Rate * Time
    const accruedInterest = data.currentTrustValue * dailyInterestRate * daysSinceLastInterest;

    return data.interestAccrued + accruedInterest;
  }, [data, dailyInterestRate, showInterestAccrual]);

  // Update real-time interest every second when showing accrual
  useEffect(() => {
    if (!showInterestAccrual || !data) return;

    const updateInterest = () => {
      setRealTimeInterest(calculateRealTimeInterest());
      setLastUpdate(new Date());
    };

    updateInterest();
    const intervalId = setInterval(updateInterest, 1000);

    return () => clearInterval(intervalId);
  }, [calculateRealTimeInterest, showInterestAccrual, data]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefreshInterval || !onRefresh) return;

    const intervalId = setInterval(onRefresh, autoRefreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefreshInterval, onRefresh]);

  // Calculate derived values
  const calculations = useMemo(() => {
    if (!data) return null;

    const totalTrustValue = data.currentTrustValue + realTimeInterest;
    const pricePerShare = totalTrustValue / data.sharesOutstanding;
    const growthFromIPO = ((totalTrustValue - data.initialTrustValue) / data.initialTrustValue) * 100;
    const withdrawals = data.withdrawals || 0;
    const netTrustValue = totalTrustValue - withdrawals;
    const redemptionPrice = data.redemptionPrice || pricePerShare;

    return {
      totalTrustValue,
      pricePerShare,
      growthFromIPO,
      netTrustValue,
      redemptionPrice,
    };
  }, [data, realTimeInterest]);

  // Loading state
  if (isLoading) {
    return <TrustAccountSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-danger-400" />
          <p className="mt-4 text-sm font-medium text-danger-700">
            Failed to load trust account data
          </p>
          <p className="mt-1 text-xs text-danger-500">{error}</p>
          {onRefresh && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!data || !calculations) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No trust account data available
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Select a SPAC to view trust details
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Trust Account
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {data.spacName} ({data.spacTicker})
          </p>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="icon-sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Trust Value Display */}
        <div className="rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">
                Total Trust Value
              </p>
              <p className="mt-1 text-3xl font-bold">
                {formatLargeNumber(calculations.totalTrustValue)}
              </p>
              {showInterestAccrual && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-xs font-medium">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +{formatCurrency(realTimeInterest)} interest
                  </span>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-100">Per Share</p>
              <p className="text-2xl font-bold">
                {formatCurrency(calculations.pricePerShare)}
              </p>
            </div>
          </div>

          {/* Progress bar for growth */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-primary-100">
              <span>Growth from IPO</span>
              <span>+{calculations.growthFromIPO.toFixed(2)}%</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min(calculations.growthFromIPO * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        {showMiniChart && data.balanceHistory && data.balanceHistory.length > 0 && (
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-500">Trust Balance Over Time</p>
            <MiniTrustChart data={data.balanceHistory} />
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <TrustMetric
            label="Initial Trust"
            value={formatLargeNumber(data.initialTrustValue)}
            subValue={`IPO: ${formatDate(data.ipoDate)}`}
            icon={<DollarSign className="h-4 w-4 text-slate-500" />}
          />
          <TrustMetric
            label="Interest Rate"
            value={formatPercent(data.interestRate * 100)}
            subValue={`${formatCurrency(data.currentTrustValue * dailyInterestRate)}/day`}
            icon={<Percent className="h-4 w-4 text-slate-500" />}
          />
          <TrustMetric
            label="Interest Accrued"
            value={formatCurrency(realTimeInterest)}
            subValue={`Since ${formatDate(data.lastInterestDate)}`}
            icon={<TrendingUp className="h-4 w-4 text-success-500" />}
            highlight
          />
          <TrustMetric
            label="Shares Outstanding"
            value={new Intl.NumberFormat('en-US').format(data.sharesOutstanding)}
            subValue={`Redemption: ${formatCurrency(calculations.redemptionPrice)}`}
            icon={<Building2 className="h-4 w-4 text-slate-500" />}
          />
        </div>

        {/* Extensions info if applicable */}
        {data.extensions && data.extensions > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-warning-200 bg-warning-50 p-3">
            <Calendar className="h-5 w-5 text-warning-600" />
            <div>
              <p className="text-sm font-medium text-warning-800">
                {data.extensions} Extension{data.extensions > 1 ? 's' : ''} Used
              </p>
              <p className="text-xs text-warning-600">
                Deadline: {formatDate(data.deadlineDate)}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-slate-400">
        <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
        <Badge variant="secondary" size="sm">
          {showInterestAccrual ? 'Live' : 'Static'}
        </Badge>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface TrustAccountCompactProps {
  spacName: string;
  spacTicker: string;
  trustValue: number;
  pricePerShare: number;
  interestRate: number;
  className?: string;
  onClick?: () => void;
}

export function TrustAccountCompact({
  spacName,
  spacTicker,
  trustValue,
  pricePerShare,
  interestRate,
  className,
  onClick,
}: TrustAccountCompactProps) {
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
            <div className="rounded-lg bg-primary-50 p-2">
              <Building2 className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{spacName}</p>
              <p className="text-xs text-slate-500">{spacTicker}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">
              {formatLargeNumber(trustValue)}
            </p>
            <p className="text-xs text-slate-500">
              {formatCurrency(pricePerShare)}/share | {formatPercent(interestRate * 100)} APY
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
