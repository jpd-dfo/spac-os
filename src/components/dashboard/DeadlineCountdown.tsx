'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Bell,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate, daysUntil, isPastDate } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type DeadlineStatus = 'upcoming' | 'warning' | 'critical' | 'overdue' | 'completed';
type DeadlineType = 'business_combination' | 'extension' | 'filing' | 'vote' | 'other';

interface DeadlineData {
  id: string;
  title: string;
  description?: string;
  deadlineDate: Date | string;
  type: DeadlineType;
  spacName?: string;
  spacTicker?: string;
  isCompleted?: boolean;
  extensionsRemaining?: number;
  extensionMonths?: number;
}

interface DeadlineCountdownProps {
  deadline: DeadlineData;
  showExtensionOption?: boolean;
  warningDays?: number;
  criticalDays?: number;
  onExtensionRequest?: () => void;
  onViewDetails?: () => void;
  onSetReminder?: () => void;
  className?: string;
}

interface CountdownDisplayProps {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  status: DeadlineStatus;
}

interface DeadlineListProps {
  deadlines: DeadlineData[];
  title?: string;
  emptyMessage?: string;
  warningDays?: number;
  criticalDays?: number;
  onDeadlineClick?: (deadline: DeadlineData) => void;
  showCompleted?: boolean;
  maxItems?: number;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEADLINE_TYPE_LABELS: Record<DeadlineType, string> = {
  business_combination: 'Business Combination',
  extension: 'Extension',
  filing: 'SEC Filing',
  vote: 'Shareholder Vote',
  other: 'Other',
};

const STATUS_CONFIG: Record<DeadlineStatus, { color: string; bgColor: string; borderColor: string }> = {
  upcoming: { color: 'text-slate-700', bgColor: 'bg-slate-50', borderColor: 'border-slate-200' },
  warning: { color: 'text-warning-700', bgColor: 'bg-warning-50', borderColor: 'border-warning-200' },
  critical: { color: 'text-danger-700', bgColor: 'bg-danger-50', borderColor: 'border-danger-200' },
  overdue: { color: 'text-danger-800', bgColor: 'bg-danger-100', borderColor: 'border-danger-300' },
  completed: { color: 'text-success-700', bgColor: 'bg-success-50', borderColor: 'border-success-200' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDeadlineStatus(
  deadlineDate: Date | string,
  isCompleted: boolean = false,
  warningDays: number = 30,
  criticalDays: number = 14
): DeadlineStatus {
  if (isCompleted) {return 'completed';}

  const days = daysUntil(deadlineDate);
  if (days === null) {return 'upcoming';}

  if (days < 0) {return 'overdue';}
  if (days <= criticalDays) {return 'critical';}
  if (days <= warningDays) {return 'warning';}
  return 'upcoming';
}

function calculateTimeRemaining(deadlineDate: Date | string): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
} {
  const deadline = typeof deadlineDate === 'string' ? new Date(deadlineDate) : deadlineDate;
  const now = new Date();
  const totalMs = deadline.getTime() - now.getTime();

  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0 };
  }

  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, totalMs };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function CountdownDisplay({ days, hours, minutes, seconds, status }: CountdownDisplayProps) {
  const config = STATUS_CONFIG[status];

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-lg text-2xl font-bold',
          config.bgColor,
          config.color
        )}
      >
        {value.toString().padStart(2, '0')}
      </div>
      <span className="mt-1 text-xs font-medium text-slate-500">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center justify-center gap-3">
      <TimeUnit value={days} label="Days" />
      <span className={cn('text-2xl font-bold', config.color)}>:</span>
      <TimeUnit value={hours} label="Hours" />
      <span className={cn('text-2xl font-bold', config.color)}>:</span>
      <TimeUnit value={minutes} label="Minutes" />
      <span className={cn('text-2xl font-bold', config.color)}>:</span>
      <TimeUnit value={seconds} label="Seconds" />
    </div>
  );
}

function CompactCountdown({ days, status }: { days: number; status: DeadlineStatus }) {
  const config = STATUS_CONFIG[status];

  if (status === 'overdue') {
    return (
      <div className="flex items-center gap-1 text-danger-600">
        <XCircle className="h-4 w-4" />
        <span className="text-sm font-semibold">Overdue by {Math.abs(days)} days</span>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="flex items-center gap-1 text-success-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-semibold">Completed</span>
      </div>
    );
  }

  return (
    <div className={cn('text-sm font-semibold', config.color)}>
      {days} day{days !== 1 ? 's' : ''} remaining
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeadlineCountdown({
  deadline,
  showExtensionOption = true,
  warningDays = 30,
  criticalDays = 14,
  onExtensionRequest,
  onViewDetails,
  onSetReminder,
  className,
}: DeadlineCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState(() =>
    calculateTimeRemaining(deadline.deadlineDate)
  );

  // Update countdown every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(deadline.deadlineDate));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [deadline.deadlineDate]);

  const status = useMemo(
    () => getDeadlineStatus(deadline.deadlineDate, deadline.isCompleted, warningDays, criticalDays),
    [deadline.deadlineDate, deadline.isCompleted, warningDays, criticalDays]
  );

  const config = STATUS_CONFIG[status];
  const daysRemaining = daysUntil(deadline.deadlineDate) ?? 0;

  return (
    <Card className={cn('overflow-hidden', config.borderColor, className)}>
      {/* Status Header */}
      <div className={cn('px-6 py-3', config.bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status === 'critical' || status === 'overdue' ? (
              <AlertTriangle className={cn('h-5 w-5', config.color)} />
            ) : status === 'completed' ? (
              <CheckCircle2 className={cn('h-5 w-5', config.color)} />
            ) : (
              <Clock className={cn('h-5 w-5', config.color)} />
            )}
            <span className={cn('text-sm font-semibold', config.color)}>
              {status === 'overdue'
                ? 'DEADLINE PASSED'
                : status === 'critical'
                  ? 'CRITICAL DEADLINE'
                  : status === 'warning'
                    ? 'APPROACHING DEADLINE'
                    : status === 'completed'
                      ? 'COMPLETED'
                      : 'UPCOMING DEADLINE'}
            </span>
          </div>
          <Badge
            variant={
              status === 'overdue' || status === 'critical'
                ? 'danger'
                : status === 'warning'
                  ? 'warning'
                  : status === 'completed'
                    ? 'success'
                    : 'secondary'
            }
          >
            {DEADLINE_TYPE_LABELS[deadline.type]}
          </Badge>
        </div>
      </div>

      <CardContent className="space-y-6 py-6">
        {/* Title and Description */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-slate-900">{deadline.title}</h3>
          {deadline.spacName && (
            <p className="mt-1 text-sm text-slate-500">
              {deadline.spacName}
              {deadline.spacTicker && ` (${deadline.spacTicker})`}
            </p>
          )}
          {deadline.description && (
            <p className="mt-2 text-sm text-slate-600">{deadline.description}</p>
          )}
        </div>

        {/* Countdown Display */}
        {!deadline.isCompleted && timeRemaining.totalMs > 0 && (
          <CountdownDisplay
            days={timeRemaining.days}
            hours={timeRemaining.hours}
            minutes={timeRemaining.minutes}
            seconds={timeRemaining.seconds}
            status={status}
          />
        )}

        {/* Deadline Date */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
          <Calendar className="h-4 w-4" />
          <span>Deadline: {formatDate(deadline.deadlineDate, 'EEEE, MMMM d, yyyy')}</span>
        </div>

        {/* Extension Info */}
        {showExtensionOption &&
          deadline.type === 'business_combination' &&
          deadline.extensionsRemaining !== undefined &&
          deadline.extensionsRemaining > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">Extensions Available</p>
                  <p className="text-xs text-slate-500">
                    {deadline.extensionsRemaining} extension
                    {deadline.extensionsRemaining > 1 ? 's' : ''} remaining
                    {deadline.extensionMonths && ` (${deadline.extensionMonths} months each)`}
                  </p>
                </div>
                {onExtensionRequest && (
                  <Button variant="secondary" size="sm" onClick={onExtensionRequest}>
                    Request Extension
                  </Button>
                )}
              </div>
            </div>
          )}
      </CardContent>

      {/* Actions Footer */}
      {(onViewDetails || onSetReminder) && (
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          {onSetReminder && (
            <Button variant="ghost" size="sm" onClick={onSetReminder}>
              <Bell className="mr-2 h-4 w-4" />
              Set Reminder
            </Button>
          )}
          {onViewDetails && (
            <Button variant="secondary" size="sm" onClick={onViewDetails}>
              View Details
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================================================
// LIST COMPONENT
// ============================================================================

export function DeadlineList({
  deadlines,
  title = 'Upcoming Deadlines',
  emptyMessage = 'No upcoming deadlines',
  warningDays = 30,
  criticalDays = 14,
  onDeadlineClick,
  showCompleted = false,
  maxItems,
  className,
}: DeadlineListProps) {
  // Filter and sort deadlines
  const filteredDeadlines = useMemo(() => {
    let filtered = deadlines;

    if (!showCompleted) {
      filtered = filtered.filter((d) => !d.isCompleted);
    }

    // Sort by deadline date (closest first, overdue at top)
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.deadlineDate).getTime();
      const dateB = new Date(b.deadlineDate).getTime();
      return dateA - dateB;
    });

    if (maxItems) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [deadlines, showCompleted, maxItems]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {filteredDeadlines.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDeadlines.map((deadline) => {
              const status = getDeadlineStatus(
                deadline.deadlineDate,
                deadline.isCompleted,
                warningDays,
                criticalDays
              );
              const config = STATUS_CONFIG[status];
              const days = daysUntil(deadline.deadlineDate) ?? 0;

              return (
                <div
                  key={deadline.id}
                  className={cn(
                    'flex items-center gap-4 rounded-lg border p-4 transition-all',
                    config.borderColor,
                    onDeadlineClick && 'cursor-pointer hover:shadow-md'
                  )}
                  onClick={() => onDeadlineClick?.(deadline)}
                >
                  <div
                    className={cn(
                      'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg',
                      config.bgColor
                    )}
                  >
                    {status === 'critical' || status === 'overdue' ? (
                      <AlertTriangle className={cn('h-6 w-6', config.color)} />
                    ) : status === 'completed' ? (
                      <CheckCircle2 className={cn('h-6 w-6', config.color)} />
                    ) : (
                      <Clock className={cn('h-6 w-6', config.color)} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {deadline.title}
                      </p>
                      <Badge
                        variant={
                          status === 'overdue' || status === 'critical'
                            ? 'danger'
                            : status === 'warning'
                              ? 'warning'
                              : 'secondary'
                        }
                        size="sm"
                      >
                        {DEADLINE_TYPE_LABELS[deadline.type]}
                      </Badge>
                    </div>
                    {deadline.spacName && (
                      <p className="text-xs text-slate-500 truncate">{deadline.spacName}</p>
                    )}
                    <p className="text-xs text-slate-400">{formatDate(deadline.deadlineDate)}</p>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <CompactCountdown days={days} status={status} />
                  </div>

                  {onDeadlineClick && (
                    <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT WIDGET
// ============================================================================

interface DeadlineCompactWidgetProps {
  deadlines: DeadlineData[];
  warningDays?: number;
  criticalDays?: number;
  className?: string;
}

export function DeadlineCompactWidget({
  deadlines,
  warningDays = 30,
  criticalDays = 14,
  className,
}: DeadlineCompactWidgetProps) {
  const upcomingDeadlines = useMemo(() => {
    return deadlines
      .filter((d) => !d.isCompleted && !isPastDate(d.deadlineDate))
      .sort((a, b) => new Date(a.deadlineDate).getTime() - new Date(b.deadlineDate).getTime())
      .slice(0, 3);
  }, [deadlines]);

  const criticalCount = useMemo(() => {
    return deadlines.filter((d) => {
      const status = getDeadlineStatus(d.deadlineDate, d.isCompleted, warningDays, criticalDays);
      return status === 'critical' || status === 'overdue';
    }).length;
  }, [deadlines, warningDays, criticalDays]);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                criticalCount > 0 ? 'bg-danger-100' : 'bg-slate-100'
              )}
            >
              <Clock
                className={cn(
                  'h-5 w-5',
                  criticalCount > 0 ? 'text-danger-600' : 'text-slate-600'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {upcomingDeadlines.length} Upcoming Deadline
                {upcomingDeadlines.length !== 1 ? 's' : ''}
              </p>
              {criticalCount > 0 && (
                <p className="text-xs text-danger-600">
                  {criticalCount} critical
                </p>
              )}
            </div>
          </div>
          {upcomingDeadlines[0] && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Next deadline</p>
              <p className="text-sm font-medium text-slate-700">
                {daysUntil(upcomingDeadlines[0].deadlineDate)} days
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
