'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Target,
  Users,
  DollarSign,
  LucideIcon,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn, formatDate, daysUntil } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type DeadlineType =
  | 'SEC_FILING'
  | 'BUSINESS_COMBINATION'
  | 'EXTENSION_VOTE'
  | 'SHAREHOLDER_MEETING'
  | 'TRUST_DEADLINE'
  | 'DUE_DILIGENCE'
  | 'CONTRACT_DEADLINE'
  | 'REGULATORY'
  | 'OTHER';

type DeadlineStatus = 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';

export interface DeadlineItem {
  id: string;
  title: string;
  type: DeadlineType;
  dueDate: Date | string;
  status: DeadlineStatus;
  description?: string;
  relatedSpac?: {
    id: string;
    name: string;
    href?: string;
  };
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
}

interface UpcomingDeadlinesProps {
  deadlines?: DeadlineItem[];
  isLoading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
  onDeadlineClick?: (deadline: DeadlineItem) => void;
  showHeader?: boolean;
  className?: string;
}

// ============================================================================
// DEADLINE TYPE CONFIGURATION
// ============================================================================

const deadlineTypeConfig: Record<DeadlineType, {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
}> = {
  SEC_FILING: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'SEC Filing',
  },
  BUSINESS_COMBINATION: {
    icon: Target,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    label: 'Business Combination',
  },
  EXTENSION_VOTE: {
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Extension Vote',
  },
  SHAREHOLDER_MEETING: {
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Shareholder Meeting',
  },
  TRUST_DEADLINE: {
    icon: DollarSign,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    label: 'Trust Deadline',
  },
  DUE_DILIGENCE: {
    icon: FileText,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    label: 'Due Diligence',
  },
  CONTRACT_DEADLINE: {
    icon: FileText,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    label: 'Contract Deadline',
  },
  REGULATORY: {
    icon: AlertTriangle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    label: 'Regulatory',
  },
  OTHER: {
    icon: Calendar,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Other',
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockUpcomingDeadlines: DeadlineItem[] = [
  {
    id: 'dl-001',
    title: 'Form 10-K Annual Report',
    type: 'SEC_FILING',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
    status: 'DUE_SOON',
    description: 'Annual report filing with SEC',
    relatedSpac: {
      id: 'spac-001',
      name: 'Soren Acquisition Corp',
      href: '/spacs/spac-001',
    },
    priority: 'high',
    assignee: 'Emily Park',
  },
  {
    id: 'dl-002',
    title: 'MedTech Due Diligence Review',
    type: 'DUE_DILIGENCE',
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days
    status: 'UPCOMING',
    description: 'Complete financial and legal due diligence',
    relatedSpac: {
      id: 'spac-001',
      name: 'Soren Acquisition Corp',
      href: '/spacs/spac-001',
    },
    priority: 'high',
    assignee: 'Sarah Chen',
  },
  {
    id: 'dl-003',
    title: 'Form 8-K Current Report',
    type: 'SEC_FILING',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    status: 'UPCOMING',
    description: 'Material event disclosure',
    priority: 'medium',
  },
  {
    id: 'dl-004',
    title: 'Quarterly Board Meeting',
    type: 'SHAREHOLDER_MEETING',
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
    status: 'UPCOMING',
    description: 'Q1 2026 board review meeting',
    priority: 'medium',
    assignee: 'Jessica Liu',
  },
  {
    id: 'dl-005',
    title: 'Trust Account Reconciliation',
    type: 'TRUST_DEADLINE',
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    status: 'UPCOMING',
    description: 'Monthly trust reconciliation',
    priority: 'low',
  },
  {
    id: 'dl-006',
    title: 'Business Combination Deadline',
    type: 'BUSINESS_COMBINATION',
    dueDate: new Date(Date.now() + 717 * 24 * 60 * 60 * 1000), // 717 days
    status: 'UPCOMING',
    description: 'Final deadline for business combination',
    relatedSpac: {
      id: 'spac-001',
      name: 'Soren Acquisition Corp',
      href: '/spacs/spac-001',
    },
    priority: 'critical',
  },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getStatusBadgeVariant(status: DeadlineStatus, daysRemaining: number | null): 'success' | 'warning' | 'danger' | 'secondary' {
  if (status === 'COMPLETED') return 'success';
  if (status === 'OVERDUE' || (daysRemaining !== null && daysRemaining < 0)) return 'danger';
  if (status === 'DUE_SOON' || (daysRemaining !== null && daysRemaining <= 14)) return 'warning';
  return 'secondary';
}

function getStatusLabel(status: DeadlineStatus, daysRemaining: number | null): string {
  if (status === 'COMPLETED') return 'Completed';
  if (status === 'OVERDUE' || (daysRemaining !== null && daysRemaining < 0)) {
    return `Overdue by ${Math.abs(daysRemaining || 0)} days`;
  }
  if (daysRemaining === 0) return 'Due Today';
  if (daysRemaining === 1) return 'Due Tomorrow';
  if (daysRemaining !== null && daysRemaining <= 7) return `${daysRemaining} days left`;
  if (daysRemaining !== null && daysRemaining <= 30) return `${daysRemaining} days`;
  return formatDate(new Date(Date.now() + (daysRemaining || 0) * 24 * 60 * 60 * 1000));
}

function getPriorityIndicator(priority: DeadlineItem['priority']): string {
  switch (priority) {
    case 'critical':
      return 'border-l-4 border-l-danger-500';
    case 'high':
      return 'border-l-4 border-l-warning-500';
    case 'medium':
      return 'border-l-4 border-l-blue-500';
    default:
      return 'border-l-4 border-l-slate-200';
  }
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DeadlineRow({
  deadline,
  onClick,
}: {
  deadline: DeadlineItem;
  onClick?: (deadline: DeadlineItem) => void;
}) {
  const config = deadlineTypeConfig[deadline.type];
  const DeadlineIcon = config.icon;
  const daysRemaining = daysUntil(deadline.dueDate);
  const statusVariant = getStatusBadgeVariant(deadline.status, daysRemaining);
  const statusLabel = getStatusLabel(deadline.status, daysRemaining);
  const priorityClass = getPriorityIndicator(deadline.priority);

  const isUrgent = daysRemaining !== null && daysRemaining <= 7 && deadline.status !== 'COMPLETED';
  const isOverdue = daysRemaining !== null && daysRemaining < 0;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg p-3 transition-colors bg-white',
        priorityClass,
        isUrgent && !isOverdue && 'bg-warning-50/50',
        isOverdue && 'bg-danger-50/50',
        onClick && 'cursor-pointer hover:bg-slate-50'
      )}
      onClick={() => onClick?.(deadline)}
    >
      {/* Icon */}
      <div className={cn('rounded-lg p-2 flex-shrink-0', config.bgColor)}>
        <DeadlineIcon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm font-medium line-clamp-1',
            isOverdue ? 'text-danger-900' : 'text-slate-900'
          )}>
            {deadline.title}
          </p>
          <Badge variant={statusVariant} size="sm" className="flex-shrink-0">
            {statusLabel}
          </Badge>
        </div>

        {deadline.description && (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
            {deadline.description}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(deadline.dueDate)}</span>
          {deadline.assignee && (
            <>
              <span className="text-slate-300">|</span>
              <Users className="h-3 w-3" />
              <span>{deadline.assignee}</span>
            </>
          )}
        </div>

        {deadline.relatedSpac?.href && (
          <Link
            href={deadline.relatedSpac.href}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            onClick={(e) => e.stopPropagation()}
          >
            {deadline.relatedSpac.name}
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Indicator Icon */}
      <div className="flex-shrink-0 mt-0.5">
        {deadline.status === 'COMPLETED' ? (
          <CheckCircle2 className="h-5 w-5 text-success-500" />
        ) : isOverdue ? (
          <AlertTriangle className="h-5 w-5 text-danger-500" />
        ) : isUrgent ? (
          <Clock className="h-5 w-5 text-warning-500" />
        ) : (
          <ChevronRight
            className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
    </div>
  );
}

function DeadlinesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg p-3 animate-pulse border-l-4 border-l-slate-200">
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
          </div>
          <div className="h-5 w-16 rounded bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UpcomingDeadlines({
  deadlines = mockUpcomingDeadlines,
  isLoading = false,
  maxItems = 5,
  onViewAll,
  onDeadlineClick,
  showHeader = true,
  className,
}: UpcomingDeadlinesProps) {
  // Sort by due date and filter to show upcoming ones first
  const sortedDeadlines = useMemo(() => {
    return [...deadlines]
      .filter((d) => d.status !== 'COMPLETED')
      .sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        return dateA - dateB;
      })
      .slice(0, maxItems);
  }, [deadlines, maxItems]);

  const urgentCount = useMemo(() => {
    return sortedDeadlines.filter((d) => {
      const days = daysUntil(d.dueDate);
      return days !== null && days <= 14;
    }).length;
  }, [sortedDeadlines]);

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <DeadlinesSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!deadlines || sortedDeadlines.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Upcoming Deadlines
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-success-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No upcoming deadlines
          </p>
          <p className="mt-1 text-xs text-slate-400">
            All deadlines have been completed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Upcoming Deadlines
          </CardTitle>
          {urgentCount > 0 && (
            <Badge variant="warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {urgentCount} Urgent
            </Badge>
          )}
        </CardHeader>
      )}

      <CardContent className="space-y-2 pt-0">
        {sortedDeadlines.map((deadline) => (
          <DeadlineRow
            key={deadline.id}
            deadline={deadline}
            onClick={onDeadlineClick}
          />
        ))}

        {/* View All Button */}
        {onViewAll && deadlines.length > maxItems && (
          <button
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 mt-4"
          >
            View All Deadlines ({deadlines.length} total)
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default UpcomingDeadlines;
