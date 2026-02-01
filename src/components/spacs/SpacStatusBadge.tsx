'use client';

import {
  Search,
  FileSignature,
  Megaphone,
  FileText,
  Vote,
  Loader,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SPAC_STATUS_LABELS } from '@/lib/constants';
import type { SPACStatus } from '@/types';

interface SpacStatusBadgeProps {
  status: SPACStatus | string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<
  string,
  {
    variant: 'success' | 'warning' | 'primary' | 'secondary' | 'danger';
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PRE_IPO: { variant: 'secondary', icon: Clock },
  SEARCHING: { variant: 'primary', icon: Search },
  LOI_SIGNED: { variant: 'warning', icon: FileSignature },
  DA_ANNOUNCED: { variant: 'success', icon: Megaphone },
  PROXY_FILED: { variant: 'primary', icon: FileText },
  VOTE_SCHEDULED: { variant: 'warning', icon: Vote },
  CLOSING: { variant: 'success', icon: Loader },
  COMPLETED: { variant: 'success', icon: CheckCircle2 },
  LIQUIDATED: { variant: 'danger', icon: XCircle },
  // Schema-based statuses
  SEC_REVIEW: { variant: 'warning', icon: FileText },
  SHAREHOLDER_VOTE: { variant: 'warning', icon: Vote },
  LIQUIDATING: { variant: 'danger', icon: AlertTriangle },
  TERMINATED: { variant: 'danger', icon: XCircle },
};

export function SpacStatusBadge({
  status,
  showIcon = true,
  size = 'md',
}: SpacStatusBadgeProps) {
  const config = statusConfig[status] || { variant: 'secondary' as const, icon: Clock };
  const Icon = config.icon;
  const label = SPAC_STATUS_LABELS[status] || status.replace(/_/g, ' ');

  return (
    <Badge variant={config.variant} size={size}>
      {showIcon && <Icon className="mr-1.5 h-3 w-3" />}
      {label}
    </Badge>
  );
}

export { statusConfig };
