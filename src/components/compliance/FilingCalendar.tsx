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
  parseISO,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FILING_DEFINITIONS } from '@/lib/compliance/complianceRules';
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
  status: FilingStatus;
  dueDate: Date;
  filedDate?: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface FilingCalendarProps {
  filings: CalendarFiling[];
  onFilingClick?: (filing: CalendarFiling) => void;
  onDateClick?: (date: Date) => void;
  selectedDate?: Date;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFilingStatusColor(status: FilingStatus): string {
  const colors: Record<FilingStatus, string> = {
    DRAFT: 'bg-slate-100 border-slate-300 text-slate-700',
    INTERNAL_REVIEW: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    EXTERNAL_REVIEW: 'bg-blue-100 border-blue-300 text-blue-800',
    SUBMITTED: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    SEC_COMMENT: 'bg-orange-100 border-orange-300 text-orange-800',
    RESPONSE_FILED: 'bg-purple-100 border-purple-300 text-purple-800',
    EFFECTIVE: 'bg-green-100 border-green-300 text-green-800',
    COMPLETE: 'bg-green-100 border-green-300 text-green-800',
  };
  return colors[status] || 'bg-slate-100 border-slate-300 text-slate-700';
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
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
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

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }, [currentMonth]);

  // Navigation handlers
  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  // Calculate summary stats for current month
  const monthStats = useMemo(() => {
    const monthFilings = filteredFilings.filter((filing) =>
      isSameMonth(filing.dueDate, currentMonth)
    );

    return {
      total: monthFilings.length,
      critical: monthFilings.filter((f) => f.priority === 'CRITICAL').length,
      pending: monthFilings.filter((f) =>
        ['DRAFT', 'INTERNAL_REVIEW', 'EXTERNAL_REVIEW'].includes(f.status)
      ).length,
      submitted: monthFilings.filter((f) =>
        ['SUBMITTED', 'EFFECTIVE', 'COMPLETE'].includes(f.status)
      ).length,
      secComment: monthFilings.filter((f) => f.status === 'SEC_COMMENT').length,
    };
  }, [filteredFilings, currentMonth]);

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
              <Badge variant="secondary">{monthStats.total} filings</Badge>
              {monthStats.critical > 0 && (
                <Badge variant="danger">{monthStats.critical} critical</Badge>
              )}
              {monthStats.secComment > 0 && (
                <Badge variant="warning">{monthStats.secComment} SEC comments</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={goToPreviousMonth}
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="min-w-[140px] text-center font-medium">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
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
        {/* Calendar Header */}
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

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            const dayFilings = getFilingsForDate(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
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
                {/* Day Number */}
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

                {/* Filings */}
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
                        getFilingStatusColor(filing.status)
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
