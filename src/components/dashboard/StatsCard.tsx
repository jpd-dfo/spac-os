'use client';

import { type ReactNode } from 'react';

import { ArrowUpRight, ArrowDownRight, Minus, type LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type TrendDirection = 'up' | 'down' | 'neutral';

type ColorVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'blue'
  | 'purple'
  | 'teal';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  colorVariant?: ColorVariant;
  description?: string;
  footer?: ReactNode;
  isLoading?: boolean;
  onClick?: () => void;
  className?: string;
}

interface StatsCardSkeletonProps {
  className?: string;
}

interface StatsCardGroupProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

// ============================================================================
// COLOR CONFIGURATION
// ============================================================================

const colorConfig: Record<ColorVariant, {
  iconBg: string;
  iconColor: string;
  hoverBorder: string;
}> = {
  default: {
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-600',
    hoverBorder: 'hover:border-slate-300',
  },
  primary: {
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-600',
    hoverBorder: 'hover:border-primary-200',
  },
  success: {
    iconBg: 'bg-success-50',
    iconColor: 'text-success-600',
    hoverBorder: 'hover:border-success-200',
  },
  warning: {
    iconBg: 'bg-warning-50',
    iconColor: 'text-warning-600',
    hoverBorder: 'hover:border-warning-200',
  },
  danger: {
    iconBg: 'bg-danger-50',
    iconColor: 'text-danger-600',
    hoverBorder: 'hover:border-danger-200',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    hoverBorder: 'hover:border-blue-200',
  },
  purple: {
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    hoverBorder: 'hover:border-purple-200',
  },
  teal: {
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    hoverBorder: 'hover:border-teal-200',
  },
};

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function StatsCardSkeleton({ className }: StatsCardSkeletonProps) {
  return (
    <Card className={cn('animate-pulse', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-lg bg-slate-200" />
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

export function StatsCardGroup({ children, columns = 4, className }: StatsCardGroupProps) {
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
// TREND INDICATOR COMPONENT
// ============================================================================

function TrendIndicator({
  value,
  direction,
  label,
}: {
  value: number;
  direction: TrendDirection;
  label?: string;
}) {
  const trendColors = {
    up: 'text-success-600',
    down: 'text-danger-600',
    neutral: 'text-slate-500',
  };

  const TrendIcon = direction === 'up'
    ? ArrowUpRight
    : direction === 'down'
      ? ArrowDownRight
      : Minus;

  return (
    <div className={cn('flex items-center gap-1 text-sm font-medium', trendColors[direction])}>
      <TrendIcon className="h-4 w-4" />
      <span>
        {direction !== 'neutral' && (value > 0 ? '+' : '')}
        {value.toFixed(1)}%
      </span>
      {label && (
        <span className="text-xs text-slate-400 font-normal ml-1">
          {label}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  colorVariant = 'primary',
  description,
  footer,
  isLoading = false,
  onClick,
  className,
}: StatsCardProps) {
  const colors = colorConfig[colorVariant];

  if (isLoading) {
    return <StatsCardSkeleton className={className} />;
  }

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        onClick && `cursor-pointer ${colors.hoverBorder} hover:shadow-md`,
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Top Row: Icon and Trend */}
        <div className="flex items-start justify-between">
          <div className={cn('rounded-xl p-3', colors.iconBg)}>
            <Icon className={cn('h-6 w-6', colors.iconColor)} />
          </div>
          {trend && (
            <TrendIndicator
              value={trend.value}
              direction={trend.direction}
              label={trend.label}
            />
          )}
        </div>

        {/* Value and Title */}
        <div className="mt-4">
          <p className="text-3xl font-bold text-slate-900 tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-sm font-medium text-slate-500">{title}</p>
        </div>

        {/* Description */}
        {description && (
          <p className="mt-2 text-xs text-slate-400">{description}</p>
        )}

        {/* Footer */}
        {footer && (
          <div className="mt-4 pt-4 border-t border-slate-100">
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

interface QuickStatProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  colorVariant?: ColorVariant;
  description?: string;
  onClick?: () => void;
}

export function QuickStat({
  title,
  value,
  icon,
  trend,
  trendLabel,
  colorVariant = 'primary',
  description,
  onClick,
}: QuickStatProps) {
  const trendObj = trend !== undefined ? {
    value: Math.abs(trend),
    direction: (trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral') as TrendDirection,
    label: trendLabel,
  } : undefined;

  return (
    <StatsCard
      title={title}
      value={value}
      icon={icon}
      trend={trendObj}
      colorVariant={colorVariant}
      description={description}
      onClick={onClick}
    />
  );
}

export default StatsCard;
