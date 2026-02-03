'use client';

import { useState, useMemo } from 'react';

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  startOfDay,
  addWeeks,
  subWeeks,
  getWeek,
  differenceInDays,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  List,
  LayoutGrid,
  CalendarDays,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface CalendarFiling {
  id: string;
  type: FilingType;
  title: string;
  spacId: string;
  spacName: string;
  ticker: string;
  status: FilingStatus;
  dueDate: Date;
  filedDate?: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignee?: {
    id: string;
    name: string;
  };
}

interface FilingCalendarProps {
  filings: CalendarFiling[];
  onFilingClick?: (filing: CalendarFiling) => void;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

type ViewMode = 'month' | 'week' | 'list';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFilingTypeColor(type: FilingType): string {
  const colors: Record<string, string> = {
    S1: 'bg-purple-100 border-purple-300 text-purple-800',
    S4: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    DEF14A: 'bg-blue-100 border-blue-300 text-blue-800',
    PREM14A: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    DEFA14A: 'bg-sky-100 border-sky-300 text-sky-800',
    FORM_8K: 'bg-orange-100 border-orange-300 text-orange-800',
    FORM_10K: 'bg-green-100 border-green-300 text-green-800',
    FORM_10Q: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    SUPER_8K: 'bg-red-100 border-red-300 text-red-800',
    FORM_425: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    SC_13D: 'bg-pink-100 border-pink-300 text-pink-800',
    SC_13G: 'bg-rose-100 border-rose-300 text-rose-800',
    FORM_3: 'bg-amber-100 border-amber-300 text-amber-800',
    FORM_4: 'bg-lime-100 border-lime-300 text-lime-800',
    FORM_5: 'bg-teal-100 border-teal-300 text-teal-800',
    OTHER: 'bg-slate-100 border-slate-300 text-slate-700',
  };
  return colors[type] ?? 'bg-slate-100 border-slate-300 text-slate-700';
}

function getPriorityDot(priority: CalendarFiling['priority']): string {
  const colors: Record<CalendarFiling['priority'], string> = {
    CRITICAL: 'bg-danger-500',
    HIGH: 'bg-warning-500',
    MEDIUM: 'bg-primary-500',
    LOW: 'bg-slate-400',
  };
  return colors[priority];
}

function getStatusIcon(status: FilingStatus) {
  switch (status) {
    case 'COMPLETE':
    case 'EFFECTIVE':
      return <CheckCircle2 className="h-3 w-3 text-success-500" />;
    case 'SEC_COMMENT':
      return <AlertTriangle className="h-3 w-3 text-warning-500" />;
    case 'DRAFT':
    case 'INTERNAL_REVIEW':
    case 'EXTERNAL_REVIEW':
      return <Clock className="h-3 w-3 text-slate-400" />;
    default:
      return <FileText className="h-3 w-3 text-primary-500" />;
  }
}

function getDaysUntilDeadline(dueDate: Date): { days: number; label: string; variant: 'danger' | 'warning' | 'success' | 'secondary' } {
  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const days = differenceInDays(due, today);

  if (days < 0) {
    return { days, label: `${Math.abs(days)}d overdue`, variant: 'danger' };
  }
  if (days === 0) {
    return { days, label: 'Due today', variant: 'danger' };
  }
  if (days <= 3) {
    return { days, label: `${days}d left`, variant: 'danger' };
  }
  if (days <= 7) {
    return { days, label: `${days}d left`, variant: 'warning' };
  }
  if (days <= 14) {
    return { days, label: `${days}d left`, variant: 'warning' };
  }
  return { days, label: `${days}d left`, variant: 'secondary' };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilingCalendar({
  filings,
  onFilingClick,
  onDateClick,
  selectedDate,
  className,
}: FilingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>('month');
  const [filterType, setFilterType] = useState<FilingType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FilingStatus | 'all'>('all');

  // Filter filings
  const filteredFilings = useMemo(() => {
    return filings.filter((filing) => {
      if (filterType !== 'all' && filing.type !== filterType) {return false;}
      if (filterStatus !== 'all' && filing.status !== filterStatus) {return false;}
      return true;
    });
  }, [filings, filterType, filterStatus]);

  // Get filings for a specific date
  const getFilingsForDate = (date: Date) => {
    return filteredFilings.filter((filing) => isSameDay(filing.dueDate, date));
  };

  // Generate calendar days for month view
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentDate]);

  // Generate week days for week view
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [currentDate]);

  // Get filings for list view (upcoming 30 days)
  const upcomingFilings = useMemo(() => {
    const today = startOfDay(new Date());
    const thirtyDaysLater = addDays(today, 30);
    return filteredFilings
      .filter((filing) => {
        const dueDate = startOfDay(filing.dueDate);
        return dueDate >= today && dueDate <= thirtyDaysLater;
      })
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [filteredFilings]);

  // Navigation handlers
  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (view === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Calculate summary stats
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const monthFilings = filteredFilings.filter((filing) =>
      isSameMonth(filing.dueDate, currentDate)
    );

    return {
      total: monthFilings.length,
      critical: monthFilings.filter((f) => f.priority === 'CRITICAL').length,
      pending: monthFilings.filter((f) =>
        ['DRAFT', 'INTERNAL_REVIEW', 'EXTERNAL_REVIEW'].includes(f.status)
      ).length,
      overdue: filteredFilings.filter((f) => {
        const dueDate = startOfDay(f.dueDate);
        return dueDate < today && !['COMPLETE', 'EFFECTIVE'].includes(f.status);
      }).length,
      secComment: monthFilings.filter((f) => f.status === 'SEC_COMMENT').length,
    };
  }, [filteredFilings, currentDate]);

  const renderMonthView = () => (
    <div className="grid grid-cols-7">
      {monthDays.map((day, index) => {
        const dayFilings = getFilingsForDate(day);
        const isCurrentMonth = isSameMonth(day, currentDate);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        return (
          <div
            key={index}
            className={cn(
              'min-h-[120px] border-b border-r border-slate-100 p-1',
              !isCurrentMonth && 'bg-slate-50',
              isSelected && 'bg-primary-50',
              'cursor-pointer hover:bg-slate-50'
            )}
            onClick={() => onDateClick?.(day)}
          >
            <div className="flex items-center justify-between px-1">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-sm',
                  isTodayDate && 'bg-primary-600 font-medium text-white',
                  !isTodayDate && !isCurrentMonth && 'text-slate-400',
                  !isTodayDate && isCurrentMonth && 'text-slate-700'
                )}
              >
                {format(day, 'd')}
              </span>
              {dayFilings.length > 0 && (
                <span className="text-xs text-slate-500">{dayFilings.length}</span>
              )}
            </div>

            <div className="mt-1 space-y-1">
              {dayFilings.slice(0, 3).map((filing) => (
                <button
                  key={filing.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilingClick?.(filing);
                  }}
                  className={cn(
                    'w-full rounded border px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-80',
                    getFilingTypeColor(filing.type)
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span className={cn('h-1.5 w-1.5 rounded-full', getPriorityDot(filing.priority))} />
                    <span className="truncate font-medium">
                      {FILING_TYPE_LABELS[filing.type]}
                    </span>
                  </div>
                  <div className="truncate text-[10px] opacity-75">{filing.spacName}</div>
                </button>
              ))}
              {dayFilings.length > 3 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateClick?.(day);
                  }}
                  className="w-full rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs text-slate-600 hover:bg-slate-200"
                >
                  +{dayFilings.length - 3} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7">
      {weekDays.map((day, index) => {
        const dayFilings = getFilingsForDate(day);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const isTodayDate = isToday(day);

        return (
          <div
            key={index}
            className={cn(
              'min-h-[300px] border-r border-slate-100 p-2',
              isSelected && 'bg-primary-50',
              'cursor-pointer hover:bg-slate-50'
            )}
            onClick={() => onDateClick?.(day)}
          >
            <div className="mb-2 text-center">
              <div className="text-xs font-medium uppercase text-slate-500">
                {format(day, 'EEE')}
              </div>
              <div
                className={cn(
                  'mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium mx-auto',
                  isTodayDate && 'bg-primary-600 text-white',
                  !isTodayDate && 'text-slate-900'
                )}
              >
                {format(day, 'd')}
              </div>
            </div>

            <div className="space-y-2">
              {dayFilings.map((filing) => (
                <button
                  key={filing.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilingClick?.(filing);
                  }}
                  className={cn(
                    'w-full rounded border p-2 text-left transition-colors hover:opacity-80',
                    getFilingTypeColor(filing.type)
                  )}
                >
                  <div className="flex items-center gap-1">
                    {getStatusIcon(filing.status)}
                    <span className="truncate text-xs font-medium">
                      {FILING_TYPE_LABELS[filing.type]}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs opacity-75">{filing.spacName}</div>
                  {filing.assignee && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/50 text-[10px] font-medium">
                        {filing.assignee.name.charAt(0)}
                      </div>
                      <span className="truncate text-[10px] opacity-75">{filing.assignee.name}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="divide-y divide-slate-100">
      {upcomingFilings.length === 0 ? (
        <div className="py-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">No upcoming filings in the next 30 days</p>
        </div>
      ) : (
        upcomingFilings.map((filing) => {
          const deadline = getDaysUntilDeadline(filing.dueDate);

          return (
            <button
              key={filing.id}
              onClick={() => onFilingClick?.(filing)}
              className="flex w-full items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-4">
                <div className={cn('rounded-lg p-2', getFilingTypeColor(filing.type))}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">
                      {FILING_TYPE_LABELS[filing.type]}
                    </span>
                    <Badge variant={deadline.variant}>{deadline.label}</Badge>
                  </div>
                  <div className="mt-0.5 text-sm text-slate-500">
                    {filing.spacName} ({filing.ticker})
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Due: {format(filing.dueDate, 'EEEE, MMMM d, yyyy')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(filing.status)}
                <span className={cn('h-2 w-2 rounded-full', getPriorityDot(filing.priority))} />
                {filing.assignee && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                    {filing.assignee.name.charAt(0)}
                  </div>
                )}
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary-600" />
              Filing Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{stats.total} filings</Badge>
              {stats.critical > 0 && (
                <Badge variant="danger">{stats.critical} critical</Badge>
              )}
              {stats.overdue > 0 && (
                <Badge variant="danger">{stats.overdue} overdue</Badge>
              )}
              {stats.secComment > 0 && (
                <Badge variant="warning">{stats.secComment} SEC comments</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                onClick={() => setView('month')}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  view === 'month' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('week')}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  view === 'week' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <CalendarDays className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={cn(
                  'rounded-md px-2 py-1 text-xs font-medium transition-colors',
                  view === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            {view !== 'list' && (
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={goToPrevious}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[140px] text-center font-medium">
                  {view === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : `Week ${getWeek(currentDate)}, ${format(currentDate, 'yyyy')}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={goToNext}
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilingType | 'all')}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Filing Types</option>
            <option value="FORM_10K">10-K Annual</option>
            <option value="FORM_10Q">10-Q Quarterly</option>
            <option value="FORM_8K">8-K Current</option>
            <option value="S1">S-1 Registration</option>
            <option value="S4">S-4 Registration</option>
            <option value="DEF14A">DEF14A Proxy</option>
            <option value="SUPER_8K">Super 8-K</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilingStatus | 'all')}
            className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="INTERNAL_REVIEW">Internal Review</option>
            <option value="EXTERNAL_REVIEW">External Review</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="SEC_COMMENT">SEC Comment</option>
            <option value="COMPLETE">Complete</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Calendar Header for Month/Week views */}
        {view !== 'list' && (
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-xs font-medium uppercase text-slate-500"
              >
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Calendar Content */}
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'list' && renderListView()}

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-medium text-slate-500">Priority:</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-danger-500" />
            <span className="text-xs text-slate-600">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning-500" />
            <span className="text-xs text-slate-600">High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary-500" />
            <span className="text-xs text-slate-600">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-xs text-slate-600">Low</span>
          </div>
          <span className="ml-4 text-xs font-medium text-slate-500">Status:</span>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-success-500" />
            <span className="text-xs text-slate-600">Complete</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-warning-500" />
            <span className="text-xs text-slate-600">SEC Comment</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-400" />
            <span className="text-xs text-slate-600">In Progress</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilingCalendar;
