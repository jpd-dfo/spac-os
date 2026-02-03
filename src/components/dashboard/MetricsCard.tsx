'use client';

import { type ReactNode, useMemo } from 'react';

import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn, formatLargeNumber, formatPercent, formatCurrency } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type TrendDirection = 'up' | 'down' | 'neutral';
type MetricFormat = 'number' | 'currency' | 'percent' | 'large';

interface MetricsCardProps {
  title: string;
  value: number | string | null | undefined;
  previousValue?: number | null;
  change?: number | null;
  changeLabel?: string;
  format?: MetricFormat;
  icon?: LucideIcon;
  iconColor?: string;
  iconBgColor?: string;
  trend?: TrendDirection;
  trendInverted?: boolean; // For metrics where down is good (e.g., expenses)
  description?: string;
  footer?: ReactNode;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  onClick?: () => void;
}

interface MetricsCardSkeletonProps {
  className?: string;
}

interface MetricsCardGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatValue(value: number | string | null | undefined, format: MetricFormat): string {
  if (value === null || value === undefined) {return '-';}
  if (typeof value === 'string') {return value;}

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'large':
      return formatLargeNumber(value);
    case 'number':
    default:
      return new Intl.NumberFormat('en-US').format(value);
  }
}

function calculateChange(current: number | null | undefined, previous: number | null | undefined): number | null {
  if (current === null || current === undefined || previous === null || previous === undefined || previous === 0) {
    return null;
  }
  return ((current - previous) / previous) * 100;
}

function getTrendDirection(change: number | null | undefined): TrendDirection {
  if (change === null || change === undefined || change === 0) {return 'neutral';}
  return change > 0 ? 'up' : 'down';
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function MetricsCardSkeleton({ className }: MetricsCardSkeletonProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="h-5 w-16 rounded bg-slate-200" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-8 w-24 rounded bg-slate-200" />
          <div className="h-4 w-32 rounded bg-slate-200" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// GROUP COMPONENT
// ============================================================================

export function MetricsCardGroup({ children, columns = 4, className }: MetricsCardGroupProps) {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={cn('grid gap-4', gridCols[columns], className)}>
      {children}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MetricsCard({
  title,
  value,
  previousValue,
  change: providedChange,
  changeLabel,
  format = 'number',
  icon: Icon,
  iconColor = 'text-primary-600',
  iconBgColor = 'bg-primary-50',
  trend: providedTrend,
  trendInverted = false,
  description,
  footer,
  isLoading = false,
  error = null,
  className,
  onClick,
}: MetricsCardProps) {
  // Calculate change and trend
  const change = useMemo(() => {
    if (providedChange !== undefined) {return providedChange;}
    if (typeof value === 'number' && previousValue !== undefined) {
      return calculateChange(value, previousValue);
    }
    return null;
  }, [providedChange, value, previousValue]);

  const trend = useMemo(() => {
    if (providedTrend) {return providedTrend;}
    return getTrendDirection(change);
  }, [providedTrend, change]);

  // Determine trend colors (inverted if trendInverted is true)
  const trendColors = useMemo(() => {
    const isPositive = trendInverted ? trend === 'down' : trend === 'up';
    const isNegative = trendInverted ? trend === 'up' : trend === 'down';

    if (isPositive) {return 'text-success-600';}
    if (isNegative) {return 'text-danger-600';}
    return 'text-slate-500';
  }, [trend, trendInverted]);

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200 bg-danger-50', className)}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-danger-100 p-2">
              <Minus className="h-5 w-5 text-danger-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-danger-800">{title}</p>
              <p className="text-xs text-danger-600">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (isLoading) {
    return <MetricsCardSkeleton className={className} />;
  }

  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:border-primary-200 hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className={cn('rounded-lg p-2', iconBgColor)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
            </div>
          )}
          {change !== null && (
            <div className={cn('flex items-center gap-1 text-sm font-medium', trendColors)}>
              {trend === 'up' && <ArrowUpRight className="h-4 w-4" />}
              {trend === 'down' && <ArrowDownRight className="h-4 w-4" />}
              {trend === 'neutral' && <Minus className="h-4 w-4" />}
              <span>
                {change > 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-2xl font-bold text-slate-900">
            {formatValue(value, format)}
          </p>
          <p className="text-sm text-slate-500">{title}</p>
          {description && (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          )}
          {changeLabel && (
            <p className="mt-1 text-xs text-slate-400">{changeLabel}</p>
          )}
        </div>

        {footer && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// PRESET VARIANTS
// ============================================================================

interface CurrencyMetricsCardProps extends Omit<MetricsCardProps, 'format'> {
  currency?: string;
}

export function CurrencyMetricsCard(props: CurrencyMetricsCardProps) {
  return <MetricsCard {...props} format="large" />;
}

export function PercentMetricsCard(props: Omit<MetricsCardProps, 'format'>) {
  return <MetricsCard {...props} format="percent" />;
}

export function CountMetricsCard(props: Omit<MetricsCardProps, 'format'>) {
  return <MetricsCard {...props} format="number" />;
}
