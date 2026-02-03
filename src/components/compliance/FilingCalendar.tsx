'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  isSameMonth,
  isSameDay,
  isToday,
  isBefore,
  isAfter,
  startOfDay,
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
  Filter,
  List,
  Grid3X3,
  ExternalLink,
  CalendarDays,
  Edit,
  Check,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type CalendarEventType =
  | 'PERIODIC' // 10-K, 10-Q
  | 'CURRENT' // 8-K
  | 'PROXY' // DEF14A, PREM14A, DEFA14A
  | 'REGISTRATION' // S-1, S-4
  | 'DEADLINE' // Non-filing deadlines (redemption, extension, etc.)
  | 'OTHER';

export interface CalendarEvent {
  id: string;
  type: FilingType | 'DEADLINE';
  eventType: CalendarEventType;
  title: string;
  description?: string;
  spacId: string;
  spacName: string;
  status: FilingStatus | 'PENDING' | 'OVERDUE';
  dueDate: Date;
  filedDate?: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  filingId?: string;
  edgarUrl?: string;
  metadata?: Record<string, unknown>;
}

interface FilingCalendarProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onDateClick?: (date: Date) => void;
  onMarkComplete?: (event: CalendarEvent) => void;
  onReschedule?: (event: CalendarEvent, newDate: Date) => void;
  selectedDate?: Date;
  selectedSpacId?: string;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getEventTypeFromFilingType(filingType: FilingType | 'DEADLINE'): CalendarEventType {
  if (filingType === 'DEADLINE') {
    return 'DEADLINE';
  }

  switch (filingType) {
    case 'FORM_10K':
    case 'FORM_10Q':
      return 'PERIODIC';
    case 'FORM_8K':
    case 'SUPER_8K':
      return 'CURRENT';
    case 'DEF14A':
    case 'DEFA14A':
    case 'PREM14A':
      return 'PROXY';
    case 'S1':
    case 'S4':
      return 'REGISTRATION';
    default:
      return 'OTHER';
  }
}

function getEventTypeColor(eventType: CalendarEventType): {
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  switch (eventType) {
    case 'PERIODIC': // 10-K/10-Q - Blue
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
      };
    case 'CURRENT': // 8-K - Purple
      return {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        dot: 'bg-purple-500',
      };
    case 'PROXY': // Proxy/PREM14A - Orange
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
      };
    case 'REGISTRATION': // S-1/S-4 - Green
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-700',
        dot: 'bg-green-500',
      };
    case 'DEADLINE': // Deadline - Red
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        dot: 'bg-red-500',
      };
    default: // Other - Slate
      return {
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-700',
        dot: 'bg-slate-500',
      };
  }
}

function getStatusColor(status: CalendarEvent['status']): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    INTERNAL_REVIEW: 'bg-yellow-100 text-yellow-800',
    EXTERNAL_REVIEW: 'bg-blue-100 text-blue-800',
    SUBMITTED: 'bg-indigo-100 text-indigo-800',
    SEC_COMMENT: 'bg-orange-100 text-orange-800',
    RESPONSE_FILED: 'bg-purple-100 text-purple-800',
    EFFECTIVE: 'bg-green-100 text-green-800',
    COMPLETE: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-slate-100 text-slate-700';
}

function getPriorityDot(priority: CalendarEvent['priority']): string {
  const colors: Record<CalendarEvent['priority'], string> = {
    CRITICAL: 'bg-danger-500',
    HIGH: 'bg-warning-500',
    MEDIUM: 'bg-primary-500',
    LOW: 'bg-slate-400',
  };
  return colors[priority];
}

function getStatusIcon(status: CalendarEvent['status']) {
  switch (status) {
    case 'COMPLETE':
    case 'EFFECTIVE':
      return <CheckCircle2 className="h-3 w-3 text-success-500" />;
    case 'SEC_COMMENT':
    case 'OVERDUE':
      return <AlertTriangle className="h-3 w-3 text-warning-500" />;
    case 'DRAFT':
    case 'INTERNAL_REVIEW':
    case 'EXTERNAL_REVIEW':
    case 'PENDING':
      return <Clock className="h-3 w-3 text-slate-400" />;
    default:
      return <FileText className="h-3 w-3 text-primary-500" />;
  }
}

function getEventLabel(event: CalendarEvent): string {
  if (event.type === 'DEADLINE') {
    return event.title;
  }
  return FILING_TYPE_LABELS[event.type] || event.type;
}

// ============================================================================
// CALENDAR EVENT MODAL
// ============================================================================

interface CalendarEventModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkComplete?: (event: CalendarEvent) => void;
  onReschedule?: (event: CalendarEvent, newDate: Date) => void;
}

function CalendarEventModal({
  event,
  isOpen,
  onClose,
  onMarkComplete,
  onReschedule,
}: CalendarEventModalProps) {
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [showReschedule, setShowReschedule] = useState(false);

  if (!event) {
    return null;
  }

  const eventTypeColors = getEventTypeColor(event.eventType);
  const daysUntilDue = differenceInDays(event.dueDate, startOfDay(new Date()));
  const isOverdue = daysUntilDue < 0;
  const isCompleted = event.status === 'COMPLETE' || event.status === 'EFFECTIVE';

  const handleMarkComplete = () => {
    if (onMarkComplete) {
      onMarkComplete(event);
    }
    onClose();
  };

  const handleReschedule = () => {
    if (onReschedule && rescheduleDate) {
      onReschedule(event, new Date(rescheduleDate));
      setShowReschedule(false);
      setRescheduleDate('');
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader>
        <div className="flex items-center gap-3">
          <div className={cn('h-3 w-3 rounded-full', eventTypeColors.dot)} />
          <ModalTitle>{getEventLabel(event)}</ModalTitle>
        </div>
        <ModalDescription>
          {event.spacName} - Due {format(event.dueDate, 'MMMM d, yyyy')}
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {/* Status and Priority */}
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(event.status)}>
              {event.status.replace('_', ' ')}
            </Badge>
            <div className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', getPriorityDot(event.priority))} />
              <span className="text-sm text-slate-600">{event.priority} Priority</span>
            </div>
          </div>

          {/* Time Status */}
          <div className={cn(
            'rounded-lg p-3',
            isOverdue ? 'bg-red-50 border border-red-200' :
            daysUntilDue <= 3 ? 'bg-yellow-50 border border-yellow-200' :
            'bg-slate-50 border border-slate-200'
          )}>
            <div className="flex items-center gap-2">
              {isOverdue ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <Clock className="h-4 w-4 text-slate-600" />
              )}
              <span className={cn(
                'font-medium',
                isOverdue ? 'text-red-700' :
                daysUntilDue <= 3 ? 'text-yellow-700' :
                'text-slate-700'
              )}>
                {isOverdue
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : daysUntilDue === 0
                  ? 'Due today'
                  : `${daysUntilDue} days remaining`}
              </span>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-1">Description</h4>
              <p className="text-sm text-slate-600">{event.description}</p>
            </div>
          )}

          {/* Event Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Event Type</span>
              <p className="font-medium text-slate-900">{event.eventType}</p>
            </div>
            <div>
              <span className="text-slate-500">SPAC</span>
              <p className="font-medium text-slate-900">{event.spacName}</p>
            </div>
            {event.filedDate && (
              <div>
                <span className="text-slate-500">Filed Date</span>
                <p className="font-medium text-slate-900">
                  {format(event.filedDate, 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {/* Edgar Link */}
          {event.edgarUrl && (
            <a
              href={event.edgarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              <ExternalLink className="h-4 w-4" />
              View on SEC EDGAR
            </a>
          )}

          {/* Reschedule Form */}
          {showReschedule && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Reschedule to:</h4>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Button size="sm" onClick={handleReschedule} disabled={!rescheduleDate}>
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowReschedule(false);
                    setRescheduleDate('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        {!isCompleted && onReschedule && !showReschedule && (
          <Button
            variant="secondary"
            onClick={() => setShowReschedule(true)}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Reschedule
          </Button>
        )}
        {!isCompleted && onMarkComplete && (
          <Button onClick={handleMarkComplete}>
            <Check className="h-4 w-4 mr-2" />
            Mark Complete
          </Button>
        )}
        {event.filingId && (
          <Button
            variant="primary"
            onClick={() => {
              window.location.href = `/filings/${event.filingId}`;
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            View Filing
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FilingCalendar({
  events,
  onEventClick,
  onDateClick,
  onMarkComplete,
  onReschedule,
  selectedDate,
  selectedSpacId,
  className,
}: FilingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week'>('month');
  const [filterType, setFilterType] = useState<CalendarEventType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter events by SPAC if selected
  const spacFilteredEvents = useMemo(() => {
    if (!selectedSpacId) {
      return events;
    }
    return events.filter((event) => event.spacId === selectedSpacId);
  }, [events, selectedSpacId]);

  // Filter events by type and status
  const filteredEvents = useMemo(() => {
    return spacFilteredEvents.filter((event) => {
      if (filterType !== 'all' && event.eventType !== filterType) {
        return false;
      }
      if (filterStatus !== 'all' && event.status !== filterStatus) {
        return false;
      }
      return true;
    });
  }, [spacFilteredEvents, filterType, filterStatus]);

  // Get events for a specific date
  const getEventsForDate = useCallback((date: Date) => {
    return filteredEvents.filter((event) => isSameDay(event.dueDate, date));
  }, [filteredEvents]);

  // Generate calendar days based on view
  const calendarDays = useMemo(() => {
    if (view === 'month') {
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
    } else {
      // Week view
      const weekStart = startOfWeek(currentDate);
      const weekEnd = endOfWeek(currentDate);

      const days: Date[] = [];
      let day = weekStart;

      while (day <= weekEnd) {
        days.push(day);
        day = addDays(day, 1);
      }

      return days;
    }
  }, [currentDate, view]);

  // Navigation handlers
  const goToPrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const goToNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  // Handle event click
  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setIsModalOpen(true);
    onEventClick?.(event);
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const startDate = view === 'month' ? startOfMonth(currentDate) : startOfWeek(currentDate);
    const endDate = view === 'month' ? endOfMonth(currentDate) : endOfWeek(currentDate);

    const periodEvents = filteredEvents.filter(
      (event) => !isBefore(event.dueDate, startDate) && !isAfter(event.dueDate, endDate)
    );

    const now = startOfDay(new Date());

    return {
      total: periodEvents.length,
      overdue: periodEvents.filter((e) => isBefore(e.dueDate, now) && e.status !== 'COMPLETE' && e.status !== 'EFFECTIVE').length,
      upcoming: periodEvents.filter((e) => {
        const days = differenceInDays(e.dueDate, now);
        return days >= 0 && days <= 7;
      }).length,
      completed: periodEvents.filter((e) => e.status === 'COMPLETE' || e.status === 'EFFECTIVE').length,
    };
  }, [filteredEvents, currentDate, view]);

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary-600" />
                Regulatory Calendar
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.total} events</Badge>
                {stats.overdue > 0 && (
                  <Badge variant="danger">{stats.overdue} overdue</Badge>
                )}
                {stats.upcoming > 0 && (
                  <Badge variant="warning">{stats.upcoming} due soon</Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  onClick={() => setView('month')}
                  className={cn(
                    'flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors',
                    view === 'month'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                  Month
                </button>
                <button
                  onClick={() => setView('week')}
                  className={cn(
                    'flex items-center gap-1 rounded px-2 py-1 text-sm transition-colors',
                    view === 'week'
                      ? 'bg-white text-primary-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  <List className="h-4 w-4" />
                  Week
                </button>
              </div>

              <Button variant="secondary" size="sm" onClick={goToToday}>
                Today
              </Button>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={goToPrevious}
                  aria-label={view === 'month' ? 'Previous month' : 'Previous week'}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="min-w-[160px] text-center font-medium">
                  {view === 'month'
                    ? format(currentDate, 'MMMM yyyy')
                    : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={goToNext}
                  aria-label={view === 'month' ? 'Next month' : 'Next week'}
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
              onChange={(e) => setFilterType(e.target.value as CalendarEventType | 'all')}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Event Types</option>
              <option value="PERIODIC">10-K / 10-Q</option>
              <option value="CURRENT">8-K</option>
              <option value="PROXY">Proxy / PREM14A</option>
              <option value="REGISTRATION">S-1 / S-4</option>
              <option value="DEADLINE">Deadlines</option>
              <option value="OTHER">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="DRAFT">Draft</option>
              <option value="INTERNAL_REVIEW">Internal Review</option>
              <option value="EXTERNAL_REVIEW">External Review</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="SEC_COMMENT">SEC Comment</option>
              <option value="COMPLETE">Complete</option>
              <option value="OVERDUE">Overdue</option>
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
          <div className={cn('grid grid-cols-7', view === 'week' && 'min-h-[400px]')}>
            {calendarDays.map((day, index) => {
              const dayEvents = getEventsForDate(day);
              const isCurrentMonth = view === 'month' ? isSameMonth(day, currentDate) : true;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={index}
                  className={cn(
                    'border-b border-r border-slate-100 p-1',
                    view === 'month' ? 'min-h-[120px]' : 'min-h-[360px]',
                    !isCurrentMonth && 'bg-slate-50',
                    isSelected && 'bg-primary-50',
                    'cursor-pointer hover:bg-slate-50 transition-colors'
                  )}
                  onClick={() => onDateClick?.(day)}
                >
                  {/* Day Number with Today Indicator */}
                  <div className="flex items-center justify-between px-1">
                    <span
                      className={cn(
                        'flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-colors',
                        isTodayDate && 'bg-primary-600 text-white',
                        !isTodayDate && !isCurrentMonth && 'text-slate-400',
                        !isTodayDate && isCurrentMonth && 'text-slate-700'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs text-slate-500">{dayEvents.length}</span>
                    )}
                  </div>

                  {/* Events */}
                  <div className={cn('mt-1 space-y-1', view === 'week' && 'overflow-y-auto max-h-[320px]')}>
                    {dayEvents.slice(0, view === 'month' ? 3 : 10).map((event) => {
                      const eventColors = getEventTypeColor(event.eventType);
                      return (
                        <button
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className={cn(
                            'w-full rounded border px-1.5 py-0.5 text-left text-xs transition-colors hover:opacity-80',
                            eventColors.bg,
                            eventColors.border,
                            eventColors.text
                          )}
                        >
                          <div className="flex items-center gap-1">
                            <span className={cn('h-1.5 w-1.5 rounded-full flex-shrink-0', getPriorityDot(event.priority))} />
                            <span className="truncate font-medium">
                              {getEventLabel(event)}
                            </span>
                          </div>
                          <div className="truncate text-[10px] opacity-75">{event.spacName}</div>
                        </button>
                      );
                    })}
                    {dayEvents.length > (view === 'month' ? 3 : 10) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDateClick?.(day);
                        }}
                        className="w-full rounded bg-slate-100 px-1.5 py-0.5 text-center text-xs text-slate-600 hover:bg-slate-200"
                      >
                        +{dayEvents.length - (view === 'month' ? 3 : 10)} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs font-medium text-slate-500">Event Type:</span>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-xs text-slate-600">10-K/10-Q</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-xs text-slate-600">8-K</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <span className="text-xs text-slate-600">Proxy</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-xs text-slate-600">S-1/S-4</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-xs text-slate-600">Deadline</span>
            </div>
            <span className="ml-4 text-xs font-medium text-slate-500">Priority:</span>
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
          </div>
        </CardContent>
      </Card>

      {/* Event Modal */}
      <CalendarEventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onMarkComplete={onMarkComplete}
        onReschedule={onReschedule}
      />
    </>
  );
}

// Re-export types for external use
export type { CalendarEventModalProps };
export { CalendarEventModal, getEventTypeFromFilingType, getEventTypeColor };

export default FilingCalendar;
