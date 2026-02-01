'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
  Filter,
  List,
  Grid3X3,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isPast,
  addDays,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import { FILING_TYPE_LABELS } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

type FilingStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed' | 'draft';
type FilingType = keyof typeof FILING_TYPE_LABELS;
type ViewMode = 'calendar' | 'list';

interface ComplianceFiling {
  id: string;
  title: string;
  type: FilingType;
  dueDate: Date | string;
  spacId?: string;
  spacName?: string;
  spacTicker?: string;
  status: FilingStatus;
  description?: string;
  assignee?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceCalendarProps {
  filings: ComplianceFiling[];
  title?: string;
  defaultViewMode?: ViewMode;
  dueSoonDays?: number;
  onFilingClick?: (filing: ComplianceFiling) => void;
  onDateClick?: (date: Date) => void;
  onAddFiling?: (date?: Date) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STATUS_CONFIG: Record<
  FilingStatus,
  { color: string; bgColor: string; borderColor: string; label: string }
> = {
  upcoming: {
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200',
    label: 'Upcoming',
  },
  due_soon: {
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    borderColor: 'border-warning-200',
    label: 'Due Soon',
  },
  overdue: {
    color: 'text-danger-600',
    bgColor: 'bg-danger-100',
    borderColor: 'border-danger-200',
    label: 'Overdue',
  },
  completed: {
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    borderColor: 'border-success-200',
    label: 'Completed',
  },
  draft: {
    color: 'text-slate-500',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    label: 'Draft',
  },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getFilingStatus(
  dueDate: Date | string,
  currentStatus: FilingStatus,
  dueSoonDays: number
): FilingStatus {
  if (currentStatus === 'completed' || currentStatus === 'draft') {
    return currentStatus;
  }

  const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
  const today = new Date();
  const daysUntilDue = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= dueSoonDays) return 'due_soon';
  return 'upcoming';
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CalendarDayProps {
  date: Date;
  filings: ComplianceFiling[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  onDateClick?: (date: Date) => void;
  onFilingClick?: (filing: ComplianceFiling) => void;
}

function CalendarDay({
  date,
  filings,
  isCurrentMonth,
  isSelected,
  onDateClick,
  onFilingClick,
}: CalendarDayProps) {
  const hasOverdue = filings.some((f) => f.status === 'overdue');
  const hasDueSoon = filings.some((f) => f.status === 'due_soon');
  const hasCompleted = filings.every((f) => f.status === 'completed');

  return (
    <div
      className={cn(
        'min-h-[100px] border-b border-r border-slate-200 p-1 transition-colors',
        !isCurrentMonth && 'bg-slate-50',
        isToday(date) && 'bg-primary-50',
        isSelected && 'ring-2 ring-primary-500 ring-inset',
        onDateClick && 'cursor-pointer hover:bg-slate-50'
      )}
      onClick={() => onDateClick?.(date)}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded-full text-sm',
            isToday(date) && 'bg-primary-500 text-white font-bold',
            !isCurrentMonth && 'text-slate-400'
          )}
        >
          {format(date, 'd')}
        </span>
        {filings.length > 0 && (
          <div className="flex gap-1">
            {hasOverdue && <div className="h-2 w-2 rounded-full bg-danger-500" />}
            {hasDueSoon && !hasOverdue && (
              <div className="h-2 w-2 rounded-full bg-warning-500" />
            )}
            {hasCompleted && filings.length > 0 && !hasOverdue && !hasDueSoon && (
              <div className="h-2 w-2 rounded-full bg-success-500" />
            )}
          </div>
        )}
      </div>
      <div className="mt-1 space-y-1">
        {filings.slice(0, 2).map((filing) => {
          const config = STATUS_CONFIG[filing.status];
          return (
            <div
              key={filing.id}
              className={cn(
                'truncate rounded px-1.5 py-0.5 text-xs',
                config.bgColor,
                config.color,
                onFilingClick && 'cursor-pointer hover:opacity-80'
              )}
              onClick={(e) => {
                e.stopPropagation();
                onFilingClick?.(filing);
              }}
              title={filing.title}
            >
              {filing.title}
            </div>
          );
        })}
        {filings.length > 2 && (
          <div className="text-xs text-slate-400">+{filings.length - 2} more</div>
        )}
      </div>
    </div>
  );
}

interface FilingListItemProps {
  filing: ComplianceFiling;
  onClick?: () => void;
}

function FilingListItem({ filing, onClick }: FilingListItemProps) {
  const config = STATUS_CONFIG[filing.status];

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border p-4 transition-all',
        config.borderColor,
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className={cn('rounded-lg p-2', config.bgColor)}>
        {filing.status === 'completed' ? (
          <CheckCircle2 className={cn('h-5 w-5', config.color)} />
        ) : filing.status === 'overdue' ? (
          <AlertTriangle className={cn('h-5 w-5', config.color)} />
        ) : (
          <FileText className={cn('h-5 w-5', config.color)} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {filing.title}
          </p>
          <Badge
            variant={
              filing.status === 'overdue'
                ? 'danger'
                : filing.status === 'due_soon'
                  ? 'warning'
                  : filing.status === 'completed'
                    ? 'success'
                    : 'secondary'
            }
            size="sm"
          >
            {config.label}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
          <span>{FILING_TYPE_LABELS[filing.type] || filing.type}</span>
          {filing.spacName && (
            <>
              <span className="text-slate-300">|</span>
              <span>{filing.spacTicker || filing.spacName}</span>
            </>
          )}
        </div>
        {filing.description && (
          <p className="mt-1 text-xs text-slate-400 truncate">{filing.description}</p>
        )}
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="text-sm font-medium text-slate-700">
          {formatDate(filing.dueDate)}
        </p>
        {filing.assignee && (
          <p className="text-xs text-slate-400">{filing.assignee}</p>
        )}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-40 rounded bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-lg bg-slate-100" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ComplianceCalendar({
  filings,
  title = 'Compliance Calendar',
  defaultViewMode = 'calendar',
  dueSoonDays = 7,
  onFilingClick,
  onDateClick,
  onAddFiling,
  isLoading = false,
  error = null,
  className,
}: ComplianceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [statusFilter, setStatusFilter] = useState<FilingStatus | 'all'>('all');

  // Process filings with computed status
  const processedFilings = useMemo(() => {
    return filings.map((filing) => ({
      ...filing,
      status: getFilingStatus(filing.dueDate, filing.status, dueSoonDays),
    }));
  }, [filings, dueSoonDays]);

  // Filter filings
  const filteredFilings = useMemo(() => {
    if (statusFilter === 'all') return processedFilings;
    return processedFilings.filter((f) => f.status === statusFilter);
  }, [processedFilings, statusFilter]);

  // Group filings by date for calendar view
  const filingsByDate = useMemo(() => {
    const grouped: Record<string, ComplianceFiling[]> = {};
    filteredFilings.forEach((filing) => {
      const dateKey = format(new Date(filing.dueDate), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(filing);
    });
    return grouped;
  }, [filteredFilings]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Get filings for selected date or upcoming
  const selectedDateFilings = useMemo(() => {
    if (selectedDate) {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      return filingsByDate[dateKey] || [];
    }
    // Return upcoming filings for next 30 days
    const today = new Date();
    const thirtyDaysLater = addDays(today, 30);
    return filteredFilings
      .filter((f) => {
        const dueDate = new Date(f.dueDate);
        return dueDate >= today && dueDate <= thirtyDaysLater;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [selectedDate, filingsByDate, filteredFilings]);

  // Summary counts
  const summaryCounts = useMemo(() => {
    return {
      overdue: processedFilings.filter((f) => f.status === 'overdue').length,
      dueSoon: processedFilings.filter((f) => f.status === 'due_soon').length,
      upcoming: processedFilings.filter((f) => f.status === 'upcoming').length,
      completed: processedFilings.filter((f) => f.status === 'completed').length,
    };
  }, [processedFilings]);

  const handleDateClick = useCallback(
    (date: Date) => {
      setSelectedDate(isSameDay(date, selectedDate || new Date(0)) ? null : date);
      onDateClick?.(date);
    },
    [selectedDate, onDateClick]
  );

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Loading state
  if (isLoading) {
    return <CalendarSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-danger-400" />
          <p className="mt-4 text-sm font-medium text-danger-700">
            Failed to load compliance calendar
          </p>
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {/* Status summary badges */}
          {summaryCounts.overdue > 0 && (
            <Badge variant="danger" size="sm">
              {summaryCounts.overdue} overdue
            </Badge>
          )}
          {summaryCounts.dueSoon > 0 && (
            <Badge variant="warning" size="sm">
              {summaryCounts.dueSoon} due soon
            </Badge>
          )}

          {/* View toggle */}
          <div className="flex rounded-lg border border-slate-200">
            <Button
              variant={viewMode === 'calendar' ? 'primary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('calendar')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="icon-sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Status filter */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'overdue', 'due_soon', 'upcoming', 'completed'] as const).map(
            (status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {status === 'all'
                  ? 'All'
                  : STATUS_CONFIG[status as FilingStatus].label}
                {status !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({summaryCounts[status as keyof typeof summaryCounts]})
                  </span>
                )}
              </Button>
            )
          )}
        </div>

        {viewMode === 'calendar' ? (
          <>
            {/* Calendar Navigation */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon-sm" onClick={handlePrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold text-slate-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <Button variant="ghost" size="icon-sm" onClick={handleNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="secondary" size="sm" onClick={handleToday}>
                Today
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-hidden rounded-lg border border-slate-200">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200 p-2 text-center text-xs font-semibold text-slate-600 last:border-r-0"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayFilings = filingsByDate[dateKey] || [];

                  return (
                    <CalendarDay
                      key={dateKey}
                      date={day}
                      filings={dayFilings}
                      isCurrentMonth={isSameMonth(day, currentMonth)}
                      isSelected={selectedDate ? isSameDay(day, selectedDate) : false}
                      onDateClick={handleDateClick}
                      onFilingClick={onFilingClick}
                    />
                  );
                })}
              </div>
            </div>

            {/* Selected Date Filings */}
            {selectedDateFilings.length > 0 && (
              <div className="mt-4">
                <h4 className="mb-3 text-sm font-semibold text-slate-700">
                  {selectedDate
                    ? `Filings on ${formatDate(selectedDate)}`
                    : 'Upcoming Filings (30 days)'}
                </h4>
                <div className="space-y-2">
                  {selectedDateFilings.map((filing) => (
                    <FilingListItem
                      key={filing.id}
                      filing={filing}
                      onClick={() => onFilingClick?.(filing)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredFilings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-slate-300" />
                <p className="mt-4 text-sm text-slate-500">No filings found</p>
              </div>
            ) : (
              filteredFilings
                .sort(
                  (a, b) =>
                    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                )
                .map((filing) => (
                  <FilingListItem
                    key={filing.id}
                    filing={filing}
                    onClick={() => onFilingClick?.(filing)}
                  />
                ))
            )}
          </div>
        )}

        {/* Add Filing Button */}
        {onAddFiling && (
          <div className="mt-4 flex justify-center">
            <Button variant="secondary" onClick={() => onAddFiling(selectedDate || undefined)}>
              Add Filing
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT WIDGET
// ============================================================================

interface ComplianceCompactProps {
  filings: ComplianceFiling[];
  maxItems?: number;
  dueSoonDays?: number;
  className?: string;
  onViewAll?: () => void;
}

export function ComplianceCompact({
  filings,
  maxItems = 5,
  dueSoonDays = 7,
  className,
  onViewAll,
}: ComplianceCompactProps) {
  const processedFilings = useMemo(() => {
    return filings
      .map((filing) => ({
        ...filing,
        status: getFilingStatus(filing.dueDate, filing.status, dueSoonDays),
      }))
      .filter((f) => f.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, maxItems);
  }, [filings, dueSoonDays, maxItems]);

  const overdueCount = processedFilings.filter((f) => f.status === 'overdue').length;

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary-600" />
            <span className="text-sm font-medium text-slate-700">Upcoming Filings</span>
          </div>
          {overdueCount > 0 && (
            <Badge variant="danger" size="sm">
              {overdueCount} overdue
            </Badge>
          )}
        </div>
        <div className="space-y-2">
          {processedFilings.map((filing) => {
            const config = STATUS_CONFIG[filing.status];
            return (
              <div
                key={filing.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">
                    {filing.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {FILING_TYPE_LABELS[filing.type]}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {formatDate(filing.dueDate)}
                  </span>
                  <div className={cn('h-2 w-2 rounded-full', config.bgColor)} />
                </div>
              </div>
            );
          })}
        </div>
        {onViewAll && filings.length > maxItems && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 w-full"
            onClick={onViewAll}
          >
            View All ({filings.length})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
