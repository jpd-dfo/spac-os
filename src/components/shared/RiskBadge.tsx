'use client';

import { AlertTriangle, AlertCircle, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

export interface RiskBadgeProps {
  level: 'high' | 'medium' | 'low' | 'none';
  count?: number;
  summary?: string;
  compact?: boolean;
  className?: string;
}

const riskConfig = {
  high: {
    icon: AlertTriangle,
    label: 'High Risk',
    shortLabel: 'High',
    variant: 'danger' as const,
    iconColor: 'text-danger-600',
  },
  medium: {
    icon: AlertCircle,
    label: 'Medium Risk',
    shortLabel: 'Medium',
    variant: 'warning' as const,
    iconColor: 'text-warning-600',
  },
  low: {
    icon: ShieldCheck,
    label: 'Low Risk',
    shortLabel: 'Low',
    variant: 'secondary' as const,
    iconColor: 'text-slate-500',
  },
  none: {
    icon: ShieldCheck,
    label: 'No Risks',
    shortLabel: 'None',
    variant: 'success' as const,
    iconColor: 'text-success-600',
  },
};

export function RiskBadge({
  level,
  count,
  summary,
  compact = false,
  className,
}: RiskBadgeProps) {
  const config = riskConfig[level];
  const Icon = config.icon;

  // Build tooltip content
  const tooltipContent = buildTooltipContent(level, count, summary);

  // Render the badge content
  const badgeContent = (
    <Badge
      variant={config.variant}
      size={compact ? 'sm' : 'md'}
      className={cn(
        'inline-flex items-center gap-1',
        compact && 'px-1.5 py-0.5',
        className
      )}
    >
      <Icon className={cn('flex-shrink-0', compact ? 'h-3 w-3' : 'h-3.5 w-3.5', config.iconColor)} />
      {!compact && (
        <span>{config.shortLabel}</span>
      )}
      {count !== undefined && count > 0 && (
        <span className={cn(
          'font-semibold',
          compact ? 'text-[10px]' : 'text-xs'
        )}>
          ({count})
        </span>
      )}
    </Badge>
  );

  // If we have tooltip content, wrap in Tooltip
  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} position="top">
        {badgeContent}
      </Tooltip>
    );
  }

  return badgeContent;
}

function buildTooltipContent(
  level: RiskBadgeProps['level'],
  count?: number,
  summary?: string
): string {
  const config = riskConfig[level];
  const parts: string[] = [];

  // Add risk level
  parts.push(config.label);

  // Add count if provided
  if (count !== undefined && count > 0) {
    parts[0] = `${config.label}: ${count} issue${count !== 1 ? 's' : ''}`;
  }

  // Add summary if provided
  if (summary) {
    parts.push(summary);
  }

  return parts.join(' - ');
}

export default RiskBadge;
