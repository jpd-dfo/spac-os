'use client';

import { useState, useMemo } from 'react';
import {
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Filter,
  Target,
  Rocket,
  TrendingUp,
  Users,
  Vote,
  Building2,
} from 'lucide-react';
import {
  format,
  differenceInDays,
  startOfDay,
  addMonths,
  subMonths,
  isBefore,
  isAfter,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  isSameDay,
} from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import type { FilingType, FilingStatus, SPACPhase } from '@/types';
import { FILING_TYPE_LABELS, SPAC_PHASE_LABELS } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineFiling {
  id: string;
  type: FilingType;
  title: string;
  status: FilingStatus;
  dueDate: Date;
  filedDate?: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Milestone {
  id: string;
  name: string;
  phase: SPACPhase;
  date: Date;
  status: 'COMPLETE' | 'CURRENT' | 'UPCOMING';
  description?: string;
}

interface FilingTimelineProps {
  spacName: string;
  ticker: string;
  ipoDate: Date;
  deadline?: Date;
  currentPhase: SPACPhase;
  filings: TimelineFiling[];
  milestones: Milestone[];
  onFilingClick?: (filing: TimelineFiling) => void;
  onMilestoneClick?: (milestone: Milestone) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getFilingStatusColor(status: FilingStatus): string {
  const colors: Record<FilingStatus, string> = {
    DRAFT: 'bg-slate-400',
    INTERNAL_REVIEW: 'bg-yellow-500',
    EXTERNAL_REVIEW: 'bg-blue-500',
    SUBMITTED: 'bg-indigo-500',
    SEC_COMMENT: 'bg-orange-500',
    RESPONSE_FILED: 'bg-purple-500',
    EFFECTIVE: 'bg-green-500',
    COMPLETE: 'bg-green-500',
  };
  return colors[status];
}

function getFilingTypeColor(type: FilingType): string {
  const colors: Record<string, string> = {
    S1: 'border-purple-500 bg-purple-50',
    S4: 'border-indigo-500 bg-indigo-50',
    DEF14A: 'border-blue-500 bg-blue-50',
    FORM_8K: 'border-orange-500 bg-orange-50',
    FORM_10K: 'border-green-500 bg-green-50',
    FORM_10Q: 'border-emerald-500 bg-emerald-50',
    SUPER_8K: 'border-red-500 bg-red-50',
    OTHER: 'border-slate-500 bg-slate-50',
  };
  return colors[type] || colors.OTHER;
}

function getMilestoneIcon(phase: SPACPhase) {
  const icons: Record<string, React.ElementType> = {
    FORMATION: Building2,
    IPO: Rocket,
    TARGET_SEARCH: Target,
    DUE_DILIGENCE: FileText,
    NEGOTIATION: Users,
    DEFINITIVE_AGREEMENT: CheckCircle2,
    SEC_REVIEW: AlertTriangle,
    SHAREHOLDER_VOTE: Vote,
    CLOSING: Flag,
    DE_SPAC: TrendingUp,
  };
  return icons[phase] || Flag;
}

function getMilestoneStatusColor(status: Milestone['status']): string {
  const colors = {
    COMPLETE: 'bg-success-500 text-white',
    CURRENT: 'bg-primary-500 text-white animate-pulse',
    UPCOMING: 'bg-slate-200 text-slate-500',
  };
  return colors[status];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilingTimeline({
  spacName,
  ticker,
  ipoDate,
  deadline,
  currentPhase,
  filings,
  milestones,
  onFilingClick,
  onMilestoneClick,
  className,
}: FilingTimelineProps) {
  const [viewRange, setViewRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    return {
      start: subMonths(today, 3),
      end: addMonths(today, 9),
    };
  });
  const [filterType, setFilterType] = useState<FilingType | 'all'>('all');
  const [showMilestones, setShowMilestones] = useState(true);

  // Generate months for the timeline
  const months = useMemo(() => {
    return eachMonthOfInterval({
      start: viewRange.start,
      end: viewRange.end,
    });
  }, [viewRange]);

  // Filter filings
  const filteredFilings = useMemo(() => {
    let result = filings.filter((filing) => {
      const dateToCheck = filing.filedDate || filing.dueDate;
      return (
        isAfter(dateToCheck, viewRange.start) &&
        isBefore(dateToCheck, viewRange.end)
      );
    });

    if (filterType !== 'all') {
      result = result.filter((filing) => filing.type === filterType);
    }

    return result;
  }, [filings, viewRange, filterType]);

  // Filter milestones
  const filteredMilestones = useMemo(() => {
    if (!showMilestones) return [];
    return milestones.filter((milestone) =>
      isAfter(milestone.date, viewRange.start) &&
      isBefore(milestone.date, viewRange.end)
    );
  }, [milestones, viewRange, showMilestones]);

  // Navigation
  const shiftView = (direction: 'prev' | 'next') => {
    const months = direction === 'prev' ? -3 : 3;
    setViewRange({
      start: addMonths(viewRange.start, months),
      end: addMonths(viewRange.end, months),
    });
  };

  const zoomIn = () => {
    setViewRange({
      start: addMonths(viewRange.start, 1),
      end: subMonths(viewRange.end, 1),
    });
  };

  const zoomOut = () => {
    setViewRange({
      start: subMonths(viewRange.start, 2),
      end: addMonths(viewRange.end, 2),
    });
  };

  const goToToday = () => {
    const today = new Date();
    setViewRange({
      start: subMonths(today, 3),
      end: addMonths(today, 9),
    });
  };

  // Get position for a date on the timeline
  const getDatePosition = (date: Date): number => {
    const totalDays = differenceInDays(viewRange.end, viewRange.start);
    const daysFromStart = differenceInDays(date, viewRange.start);
    return Math.min(Math.max((daysFromStart / totalDays) * 100, 0), 100);
  };

  const today = startOfDay(new Date());
  const todayPosition = getDatePosition(today);

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Filing Timeline
            </CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              {spacName} ({ticker}) - {SPAC_PHASE_LABELS[currentPhase]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showMilestones}
                onChange={(e) => setShowMilestones(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-primary-600"
              />
              Show Milestones
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilingType | 'all')}
              className="rounded-md border border-slate-200 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Filings</option>
              <option value="FORM_10K">10-K</option>
              <option value="FORM_10Q">10-Q</option>
              <option value="FORM_8K">8-K</option>
              <option value="S1">S-1</option>
              <option value="S4">S-4</option>
              <option value="DEF14A">DEF14A</option>
              <option value="SUPER_8K">Super 8-K</option>
            </select>
          </div>
        </div>

        {/* Timeline Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => shiftView('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="secondary" size="sm" onClick={() => shiftView('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-slate-500">
              {format(viewRange.start, 'MMM yyyy')} - {format(viewRange.end, 'MMM yyyy')}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Month Headers */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          {months.map((month, index) => {
            const isCurrentMonth = isSameMonth(month, today);
            return (
              <div
                key={index}
                className={cn(
                  'flex-1 border-r border-slate-100 px-2 py-2 text-center text-sm font-medium',
                  isCurrentMonth ? 'bg-primary-50 text-primary-700' : 'text-slate-600'
                )}
              >
                {format(month, 'MMM yyyy')}
              </div>
            );
          })}
        </div>

        {/* Timeline Track */}
        <div className="relative min-h-[400px] px-4 py-6">
          {/* Grid Lines */}
          <div className="absolute inset-x-0 top-0 flex h-full">
            {months.map((_, index) => (
              <div
                key={index}
                className="flex-1 border-r border-slate-100"
              />
            ))}
          </div>

          {/* Today Indicator */}
          <div
            className="absolute top-0 h-full w-0.5 bg-primary-500 z-20"
            style={{ left: `${todayPosition}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 rounded bg-primary-500 px-2 py-0.5 text-xs font-medium text-white">
              Today
            </div>
          </div>

          {/* IPO Marker */}
          {isAfter(ipoDate, viewRange.start) && isBefore(ipoDate, viewRange.end) && (
            <div
              className="absolute top-0 h-full z-10"
              style={{ left: `${getDatePosition(ipoDate)}%` }}
            >
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="rounded-full bg-success-500 p-2">
                  <Rocket className="h-4 w-4 text-white" />
                </div>
                <div className="mt-1 whitespace-nowrap rounded bg-success-100 px-2 py-0.5 text-xs font-medium text-success-700">
                  IPO: {formatDate(ipoDate)}
                </div>
              </div>
            </div>
          )}

          {/* Deadline Marker */}
          {deadline && isAfter(deadline, viewRange.start) && isBefore(deadline, viewRange.end) && (
            <div
              className="absolute top-0 h-full z-10"
              style={{ left: `${getDatePosition(deadline)}%` }}
            >
              <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <div className="rounded-full bg-danger-500 p-2">
                  <Flag className="h-4 w-4 text-white" />
                </div>
                <div className="mt-1 whitespace-nowrap rounded bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
                  Deadline: {formatDate(deadline)}
                </div>
              </div>
            </div>
          )}

          {/* Milestones Row */}
          {showMilestones && (
            <div className="relative h-20 mb-4">
              {filteredMilestones.map((milestone) => {
                const position = getDatePosition(milestone.date);
                const IconComponent = getMilestoneIcon(milestone.phase);

                return (
                  <div
                    key={milestone.id}
                    className="absolute top-4 transform -translate-x-1/2 cursor-pointer group z-10"
                    style={{ left: `${position}%` }}
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    <div
                      className={cn(
                        'rounded-full p-2 shadow-md transition-transform group-hover:scale-110',
                        getMilestoneStatusColor(milestone.status)
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <div className="whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white shadow-lg">
                        <p className="font-medium">{milestone.name}</p>
                        <p className="text-slate-300">{formatDate(milestone.date)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Filings Row */}
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute top-8 left-0 right-0 h-1 bg-slate-200 rounded-full" />

            {/* Filings */}
            {filteredFilings.map((filing, index) => {
              const dateToUse = filing.filedDate || filing.dueDate;
              const position = getDatePosition(dateToUse);
              const isCompleted = ['COMPLETE', 'EFFECTIVE', 'SUBMITTED'].includes(filing.status);
              const isOverdue = !isCompleted && isBefore(filing.dueDate, today);

              // Stagger vertical positions to avoid overlap
              const row = index % 3;
              const topOffset = 20 + (row * 80);

              return (
                <div
                  key={filing.id}
                  className="absolute transform -translate-x-1/2 cursor-pointer group z-10"
                  style={{
                    left: `${position}%`,
                    top: `${topOffset}px`,
                  }}
                  onClick={() => onFilingClick?.(filing)}
                >
                  {/* Connector Line */}
                  <div
                    className={cn(
                      'absolute top-full left-1/2 w-0.5 -translate-x-1/2',
                      isCompleted ? 'bg-success-300' : isOverdue ? 'bg-danger-300' : 'bg-slate-300'
                    )}
                    style={{ height: `${40 - row * 10}px` }}
                  />

                  {/* Filing Card */}
                  <div
                    className={cn(
                      'rounded-lg border-2 p-2 shadow-sm transition-all group-hover:shadow-md group-hover:-translate-y-0.5',
                      getFilingTypeColor(filing.type),
                      isOverdue && 'border-danger-400'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', getFilingStatusColor(filing.status))} />
                      <span className="text-xs font-medium text-slate-900">
                        {FILING_TYPE_LABELS[filing.type]}
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">
                      {formatDate(dateToUse)}
                    </p>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                    <div className="whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg">
                      <p className="font-medium">{FILING_TYPE_LABELS[filing.type]}</p>
                      <p className="text-slate-300">{filing.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge
                          size="sm"
                          className={cn(
                            'text-[10px]',
                            isCompleted ? 'bg-success-500' : isOverdue ? 'bg-danger-500' : 'bg-slate-500'
                          )}
                        >
                          {isCompleted ? 'Filed' : isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                        <span className="text-slate-400">
                          {filing.filedDate ? 'Filed' : 'Due'}: {formatDate(dateToUse)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-xs font-medium text-slate-500">Filing Status:</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-xs text-slate-600">Draft</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-slate-600">In Review</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            <span className="text-xs text-slate-600">Submitted</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            <span className="text-xs text-slate-600">SEC Comment</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-slate-600">Complete</span>
          </div>
          <span className="ml-4 text-xs font-medium text-slate-500">Milestones:</span>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-success-500" />
            <span className="text-xs text-slate-600">Complete</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-primary-500" />
            <span className="text-xs text-slate-600">Current</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-3 w-3 rounded-full bg-slate-200" />
            <span className="text-xs text-slate-600">Upcoming</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FilingTimeline;
