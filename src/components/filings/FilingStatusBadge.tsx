'use client';

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { FilingStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface FilingStatusBadgeProps {
  status: FilingStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

interface StatusConfig {
  label: string;
  variant: 'secondary' | 'primary' | 'warning' | 'success' | 'danger' | 'info';
  bgColor: string;
  textColor: string;
  borderColor: string;
}

// Configuration supporting both Prisma schema statuses and types/index.ts statuses
const STATUS_CONFIG: Record<string, StatusConfig> = {
  // Types file statuses
  DRAFT: {
    label: 'Draft',
    variant: 'secondary',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
  },
  // Prisma schema statuses
  DRAFTING: {
    label: 'Draft',
    variant: 'secondary',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-300',
  },
  INTERNAL_REVIEW: {
    label: 'Internal Review',
    variant: 'warning',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
  },
  EXTERNAL_REVIEW: {
    label: 'External Review',
    variant: 'info',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
  LEGAL_REVIEW: {
    label: 'Legal Review',
    variant: 'info',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
  BOARD_APPROVAL: {
    label: 'Board Approval',
    variant: 'primary',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
  },
  SUBMITTED: {
    label: 'Submitted',
    variant: 'primary',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-300',
  },
  FILED: {
    label: 'Filed',
    variant: 'primary',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    borderColor: 'border-indigo-300',
  },
  SEC_COMMENT: {
    label: 'SEC Comment',
    variant: 'warning',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
  },
  RESPONSE_FILED: {
    label: 'Response Filed',
    variant: 'info',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    borderColor: 'border-purple-300',
  },
  AMENDED: {
    label: 'Amended',
    variant: 'info',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
  },
  EFFECTIVE: {
    label: 'Effective',
    variant: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
  },
  COMPLETE: {
    label: 'Complete',
    variant: 'success',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    borderColor: 'border-green-300',
  },
  WITHDRAWN: {
    label: 'Withdrawn',
    variant: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
  REJECTED: {
    label: 'Rejected',
    variant: 'danger',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    borderColor: 'border-red-300',
  },
};

// For backward compatibility
const EXTENDED_STATUS_CONFIG = STATUS_CONFIG;

// ============================================================================
// COMPONENT
// ============================================================================

// Get dot color for status indicator
function getStatusDotColor(status: string): string {
  const dotColors: Record<string, string> = {
    DRAFT: 'bg-slate-500',
    DRAFTING: 'bg-slate-500',
    INTERNAL_REVIEW: 'bg-yellow-500',
    EXTERNAL_REVIEW: 'bg-blue-500',
    LEGAL_REVIEW: 'bg-blue-500',
    BOARD_APPROVAL: 'bg-purple-500',
    SUBMITTED: 'bg-indigo-500',
    FILED: 'bg-indigo-500',
    SEC_COMMENT: 'bg-orange-500',
    RESPONSE_FILED: 'bg-purple-500',
    AMENDED: 'bg-blue-500',
    EFFECTIVE: 'bg-green-500',
    COMPLETE: 'bg-green-500',
    WITHDRAWN: 'bg-red-500',
    REJECTED: 'bg-red-500',
  };
  return dotColors[status] || 'bg-slate-500';
}

// Default config to use when status is not found
const DEFAULT_STATUS_CONFIG: StatusConfig = {
  label: 'Unknown',
  variant: 'secondary',
  bgColor: 'bg-slate-100',
  textColor: 'text-slate-700',
  borderColor: 'border-slate-300',
};

export function FilingStatusBadge({
  status,
  size = 'md',
  showIcon = false,
  className,
}: FilingStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_STATUS_CONFIG;

  return (
    <Badge
      variant={config.variant}
      size={size}
      className={cn(
        config.bgColor,
        config.textColor,
        'border',
        config.borderColor,
        className
      )}
    >
      {showIcon && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            getStatusDotColor(status)
          )}
        />
      )}
      {config.label}
    </Badge>
  );
}

// ============================================================================
// HELPER EXPORTS
// ============================================================================

export function getFilingStatusConfig(status: FilingStatus | string): StatusConfig {
  return STATUS_CONFIG[status] ?? DEFAULT_STATUS_CONFIG;
}

export function getFilingStatusLabel(status: FilingStatus | string): string {
  const config = STATUS_CONFIG[status];
  return config?.label ?? 'Unknown';
}

export function getFilingStatusVariant(status: FilingStatus | string): StatusConfig['variant'] {
  const config = STATUS_CONFIG[status];
  return config?.variant ?? 'secondary';
}

export { STATUS_CONFIG, EXTENDED_STATUS_CONFIG };

export default FilingStatusBadge;
