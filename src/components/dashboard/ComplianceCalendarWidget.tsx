'use client';

import { useMemo } from 'react';

import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  ChevronRight,
  ExternalLink,
  Bell,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate, daysUntil } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type FilingStatus = 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED';
type FilingType = '10-K' | '10-Q' | '8-K' | 'DEF14A' | 'S-1' | 'S-4' | 'PROXY' | '13F' | 'OTHER';

interface ComplianceDeadline {
  id: string;
  title: string;
  filingType: FilingType;
  dueDate: Date | string;
  status: FilingStatus;
  description?: string;
  assignee?: string;
  spacName?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface ComplianceCalendarData {
  deadlines: ComplianceDeadline[];
  upcomingCount: number;
  overdueCount: number;
  completedThisMonth: number;
}

interface ComplianceCalendarWidgetProps {
  data?: ComplianceCalendarData | null;
  isLoading?: boolean;
  className?: string;
  onViewCalendar?: () => void;
  onDeadlineClick?: (deadlineId: string) => void;
  onQuickAction?: (deadlineId: string, action: 'remind' | 'view' | 'complete') => void;
}

// ============================================================================
// MOCK DATA FOR SOREN ACQUISITION CORPORATION
// ============================================================================

export const mockComplianceData: ComplianceCalendarData = {
  deadlines: [
    {
      id: 'deadline-001',
      title: '10-K Annual Report',
      filingType: '10-K',
      dueDate: new Date('2026-02-14'),
      status: 'DUE_SOON',
      description: 'Annual report filing with SEC',
      assignee: 'Sarah Chen',
      spacName: 'Soren Acquisition Corp',
      priority: 'HIGH',
    },
    {
      id: 'deadline-002',
      title: 'Form 8-K Current Report',
      filingType: '8-K',
      dueDate: new Date('2026-02-05'),
      status: 'ON_TRACK',
      description: 'Material event disclosure',
      assignee: 'Michael Ross',
      spacName: 'Soren Acquisition Corp',
      priority: 'MEDIUM',
    },
    {
      id: 'deadline-003',
      title: 'Trust Account Reconciliation',
      filingType: 'OTHER',
      dueDate: new Date('2026-02-10'),
      status: 'ON_TRACK',
      description: 'Monthly trust account verification',
      assignee: 'Emily Park',
      spacName: 'Soren Acquisition Corp',
      priority: 'MEDIUM',
    },
    {
      id: 'deadline-004',
      title: 'Board Meeting Minutes',
      filingType: 'OTHER',
      dueDate: new Date('2026-02-01'),
      status: 'DUE_SOON',
      description: 'Q4 board meeting documentation',
      assignee: 'David Kim',
      spacName: 'Soren Acquisition Corp',
      priority: 'LOW',
    },
    {
      id: 'deadline-005',
      title: 'Investor Communication',
      filingType: 'OTHER',
      dueDate: new Date('2026-02-20'),
      status: 'ON_TRACK',
      description: 'Monthly investor update',
      assignee: 'Jessica Liu',
      spacName: 'Soren Acquisition Corp',
      priority: 'LOW',
    },
  ],
  upcomingCount: 5,
  overdueCount: 0,
  completedThisMonth: 3,
};

// ============================================================================
// STATUS CONFIGURATION
// ============================================================================

const statusConfig: Record<FilingStatus, {
  label: string;
  icon: typeof CheckCircle2;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  ON_TRACK: {
    label: 'On Track',
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-50',
    textColor: 'text-success-700',
    borderColor: 'border-success-200',
  },
  DUE_SOON: {
    label: 'Due Soon',
    icon: AlertTriangle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
    textColor: 'text-warning-700',
    borderColor: 'border-warning-200',
  },
  OVERDUE: {
    label: 'Overdue',
    icon: AlertCircle,
    color: 'text-danger-600',
    bgColor: 'bg-danger-50',
    textColor: 'text-danger-700',
    borderColor: 'border-danger-200',
  },
  COMPLETED: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
  },
};

const filingTypeConfig: Record<FilingType, {
  label: string;
  color: string;
}> = {
  '10-K': { label: '10-K', color: 'bg-blue-100 text-blue-700' },
  '10-Q': { label: '10-Q', color: 'bg-blue-100 text-blue-700' },
  '8-K': { label: '8-K', color: 'bg-purple-100 text-purple-700' },
  'DEF14A': { label: 'DEF14A', color: 'bg-indigo-100 text-indigo-700' },
  'S-1': { label: 'S-1', color: 'bg-green-100 text-green-700' },
  'S-4': { label: 'S-4', color: 'bg-green-100 text-green-700' },
  'PROXY': { label: 'Proxy', color: 'bg-orange-100 text-orange-700' },
  '13F': { label: '13F', color: 'bg-teal-100 text-teal-700' },
  'OTHER': { label: 'Other', color: 'bg-slate-100 text-slate-700' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function DeadlineItem({
  deadline,
  onDeadlineClick,
  onQuickAction
}: {
  deadline: ComplianceDeadline;
  onDeadlineClick?: (id: string) => void;
  onQuickAction?: (id: string, action: 'remind' | 'view' | 'complete') => void;
}) {
  const days = daysUntil(deadline.dueDate);
  const statusCfg = statusConfig[deadline.status];
  const StatusIcon = statusCfg.icon;
  const filingCfg = filingTypeConfig[deadline.filingType];

  return (
    <div
      className={cn(
        'group rounded-lg border p-3 transition-all',
        statusCfg.borderColor,
        statusCfg.bgColor,
        onDeadlineClick && 'cursor-pointer hover:shadow-sm'
      )}
      onClick={() => onDeadlineClick?.(deadline.id)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg p-2', deadline.status === 'OVERDUE' ? 'bg-danger-100' : 'bg-white')}>
          <StatusIcon className={cn('h-4 w-4', statusCfg.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {deadline.title}
            </p>
            <Badge className={cn('shrink-0', filingCfg.color, 'border-0')} size="sm">
              {filingCfg.label}
            </Badge>
          </div>

          {deadline.description && (
            <p className="mt-0.5 text-xs text-slate-500 truncate">
              {deadline.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span className={cn(
                deadline.status === 'OVERDUE' ? 'text-danger-600 font-medium' :
                deadline.status === 'DUE_SOON' ? 'text-warning-600 font-medium' :
                'text-slate-500'
              )}>
                {formatDate(deadline.dueDate)}
              </span>
            </div>

            {days !== null && deadline.status !== 'COMPLETED' && (
              <div className="flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3 text-slate-400" />
                <span className={cn(
                  days < 0 ? 'text-danger-600 font-medium' :
                  days <= 3 ? 'text-warning-600 font-medium' :
                  'text-slate-500'
                )}>
                  {days < 0
                    ? `${Math.abs(days)} days overdue`
                    : days === 0
                      ? 'Due today'
                      : `${days} days left`
                  }
                </span>
              </div>
            )}

            {deadline.assignee && (
              <span className="text-xs text-slate-400">
                {deadline.assignee}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions - visible on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction?.(deadline.id, 'remind');
            }}
            className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
            title="Set reminder"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAction?.(deadline.id, 'view');
            }}
            className="rounded p-1.5 text-slate-400 hover:bg-white hover:text-slate-600"
            title="View details"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ComplianceSummary({ data }: { data: ComplianceCalendarData }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-lg bg-warning-50 p-3 text-center">
        <p className="text-2xl font-bold text-warning-700">{data.upcomingCount}</p>
        <p className="text-xs text-warning-600">Upcoming</p>
      </div>
      <div className={cn(
        'rounded-lg p-3 text-center',
        data.overdueCount > 0 ? 'bg-danger-50' : 'bg-success-50'
      )}>
        <p className={cn(
          'text-2xl font-bold',
          data.overdueCount > 0 ? 'text-danger-700' : 'text-success-700'
        )}>
          {data.overdueCount}
        </p>
        <p className={cn(
          'text-xs',
          data.overdueCount > 0 ? 'text-danger-600' : 'text-success-600'
        )}>
          Overdue
        </p>
      </div>
      <div className="rounded-lg bg-slate-50 p-3 text-center">
        <p className="text-2xl font-bold text-slate-700">{data.completedThisMonth}</p>
        <p className="text-xs text-slate-500">Completed</p>
      </div>
    </div>
  );
}

function ComplianceSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 rounded-lg bg-slate-200" />
          <div className="h-16 rounded-lg bg-slate-200" />
          <div className="h-16 rounded-lg bg-slate-200" />
        </div>
        <div className="space-y-3">
          <div className="h-20 rounded-lg bg-slate-200" />
          <div className="h-20 rounded-lg bg-slate-200" />
          <div className="h-20 rounded-lg bg-slate-200" />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComplianceCalendarWidget({
  data = mockComplianceData,
  isLoading = false,
  className,
  onViewCalendar,
  onDeadlineClick,
  onQuickAction,
}: ComplianceCalendarWidgetProps) {
  // Sort deadlines by due date, prioritizing overdue and due soon
  const sortedDeadlines = useMemo(() => {
    if (!data?.deadlines) {return [];}
    return [...data.deadlines]
      .filter(d => d.status !== 'COMPLETED')
      .sort((a, b) => {
        // Overdue first, then due soon, then by date
        const statusPriority = { OVERDUE: 0, DUE_SOON: 1, ON_TRACK: 2, COMPLETED: 3 };
        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) {return statusDiff;}
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 5);
  }, [data?.deadlines]);

  if (isLoading) {
    return <ComplianceSkeleton />;
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No compliance data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          Compliance Calendar
        </CardTitle>
        {data.overdueCount > 0 && (
          <Badge variant="danger">
            {data.overdueCount} Overdue
          </Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <ComplianceSummary data={data} />

        {/* Upcoming Deadlines */}
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">
            Upcoming Deadlines
          </h4>
          <div className="space-y-2">
            {sortedDeadlines.map((deadline) => (
              <DeadlineItem
                key={deadline.id}
                deadline={deadline}
                onDeadlineClick={onDeadlineClick}
                onQuickAction={onQuickAction}
              />
            ))}
          </div>
        </div>

        {/* View Calendar Button */}
        {onViewCalendar && (
          <button
            onClick={onViewCalendar}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            View Full Calendar
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default ComplianceCalendarWidget;
