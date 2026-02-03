'use client';

import { useState, useMemo, useEffect } from 'react';

import { format, differenceInDays, startOfDay, isBefore } from 'date-fns';
import {
  Shield,
  CheckSquare,
  Users,
  Lock,
  AlertTriangle,
  FileText,
  History,
  LayoutDashboard,
  Calendar,
  Filter,
  Clock,
  Bell,
  List,
  Check,
  ExternalLink,
  CalendarDays,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import { AlertList } from '@/components/compliance/AlertList';
import { AuditTrail } from '@/components/compliance/AuditTrail';
import { BoardMeetingManager } from '@/components/compliance/BoardMeetingManager';
import { ComplianceChecklist } from '@/components/compliance/ComplianceChecklist';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';

// Import compliance modules
import { ConflictOfInterestLog } from '@/components/compliance/ConflictOfInterestLog';
import { FilingCalendar, type CalendarEvent } from '@/components/compliance/FilingCalendar';
import { InsiderTradingWindow } from '@/components/compliance/InsiderTradingWindow';
import { PolicyLibrary } from '@/components/compliance/PolicyLibrary';
import { UpcomingDeadlines } from '@/components/dashboard/UpcomingDeadlines';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { generateCalendarEvents, type SPACCalendarData } from '@/lib/services/calendarService';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import {
  calculateAllFilingDeadlines,
  filterDeadlinesByType,
  filterDeadlinesBySpac,
  type SpacData,
  type DeadlineFilterType,
} from '@/lib/compliance/filingDeadlines';

type ComplianceModule =
  | 'dashboard'
  | 'calendar'
  | 'alerts'
  | 'deadlines'
  | 'checklist'
  | 'board'
  | 'trading'
  | 'conflicts'
  | 'policies'
  | 'audit';

type ViewMode = 'calendar' | 'list';

interface ModuleConfig {
  key: ComplianceModule;
  label: string;
  description: string;
  icon: React.ElementType;
}

const baseModules: ModuleConfig[] = [
  {
    key: 'dashboard',
    label: 'Overview',
    description: 'Compliance score and quick stats',
    icon: LayoutDashboard,
  },
  {
    key: 'calendar',
    label: 'Regulatory Calendar',
    description: 'Full calendar view of deadlines',
    icon: CalendarDays,
  },
  {
    key: 'alerts',
    label: 'Alerts',
    description: 'Compliance alerts and notifications',
    icon: Bell,
  },
  {
    key: 'deadlines',
    label: 'Filing Deadlines',
    description: 'SEC filing deadline tracker',
    icon: Calendar,
  },
  {
    key: 'checklist',
    label: 'Compliance Checklist',
    description: 'SOX and SEC requirements',
    icon: CheckSquare,
  },
  {
    key: 'board',
    label: 'Board Meetings',
    description: 'Meetings and resolutions',
    icon: Users,
  },
  {
    key: 'trading',
    label: 'Insider Trading',
    description: 'Windows and pre-clearance',
    icon: Lock,
  },
  {
    key: 'conflicts',
    label: 'Conflicts of Interest',
    description: 'Disclosures and transactions',
    icon: AlertTriangle,
  },
  {
    key: 'policies',
    label: 'Policy Library',
    description: 'Policies and acknowledgments',
    icon: FileText,
  },
  {
    key: 'audit',
    label: 'Audit Trail',
    description: 'System activity log',
    icon: History,
  },
];

// ============================================================================
// MOCK SPAC DATA FOR DEADLINE CALCULATION
// ============================================================================

const mockSpacs: SpacData[] = [
  {
    id: 'spac-001',
    name: 'Soren Acquisition Corp',
    ticker: 'SORN',
    status: 'DA_ANNOUNCED',
    ipoDate: new Date('2024-06-15'),
    deadline: new Date('2026-06-15'), // 24 months from IPO
    daAnnouncedDate: new Date('2025-11-01'),
    proxyFiledDate: null,
    voteDate: new Date('2026-03-15'),
    closingDate: null,
    extensionCount: 0,
    fiscalYearEndMonth: 11, // December
  },
  {
    id: 'spac-002',
    name: 'Tech Vision Holdings',
    ticker: 'TVHD',
    status: 'SEARCHING',
    ipoDate: new Date('2024-09-20'),
    deadline: new Date('2026-09-20'),
    daAnnouncedDate: null,
    proxyFiledDate: null,
    voteDate: null,
    closingDate: null,
    extensionCount: 0,
    fiscalYearEndMonth: 11,
  },
  {
    id: 'spac-003',
    name: 'Green Energy Partners',
    ticker: 'GREP',
    status: 'SEC_REVIEW',
    ipoDate: new Date('2024-03-01'),
    deadline: new Date('2026-03-01'),
    daAnnouncedDate: new Date('2025-08-15'),
    proxyFiledDate: new Date('2025-10-01'),
    voteDate: new Date('2026-02-20'),
    closingDate: null,
    extensionCount: 1,
    fiscalYearEndMonth: 11,
    secCommentDate: new Date('2026-01-15'),
    secResponseDueDate: new Date('2026-01-29'),
  },
];


// ============================================================================
// DEADLINE FILTER OPTIONS
// ============================================================================

interface DeadlineFilterOption {
  value: DeadlineFilterType;
  label: string;
}

const deadlineFilterOptions: DeadlineFilterOption[] = [
  { value: 'all', label: 'All Deadlines' },
  { value: 'periodic', label: 'Periodic (10-K, 10-Q)' },
  { value: 'current', label: 'Current Reports (8-K)' },
  { value: 'proxy', label: 'Proxy Filings' },
  { value: 'business_combination', label: 'Business Combination' },
  { value: 'sec_response', label: 'SEC Responses' },
];

// ============================================================================
// REGULATORY CALENDAR VIEW COMPONENT
// ============================================================================

function RegulatoryCalendarView() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedSpacId, setSelectedSpacId] = useState<string>('');

  // Fetch real SPAC data
  const { data: spacsData } = trpc.spac.list.useQuery(
    { page: 1, limit: 50 },
    { refetchOnWindowFocus: false }
  );

  // Fetch real filings data
  const { data: filingsData } = trpc.filing.list.useQuery(
    { page: 1, pageSize: 100 },
    { refetchOnWindowFocus: false }
  );

  // Transform SPACs to calendar data format
  const spacCalendarData = useMemo((): SPACCalendarData[] => {
    if (!spacsData?.items) {
      return [];
    }
    return spacsData.items.map((spac) => ({
      id: spac.id,
      name: spac.name,
      ticker: spac.ticker || 'N/A',
      status: spac.status,
      phase: spac.phase || 'UNKNOWN',
      ipoDate: spac.ipoDate ? new Date(spac.ipoDate) : null,
      deadline: spac.deadlineDate ? new Date(spac.deadlineDate) : null,
      daAnnouncedDate: spac.daAnnouncedDate ? new Date(spac.daAnnouncedDate) : null,
      voteDate: spac.voteDate ? new Date(spac.voteDate) : null,
      closingDate: spac.closingDate ? new Date(spac.closingDate) : null,
      extensionCount: spac.extensionCount || 0,
    }));
  }, [spacsData]);

  // Transform filings for calendar
  const filingCalendarData = useMemo(() => {
    if (!filingsData?.items) {
      return [];
    }
    return filingsData.items.map((filing) => ({
      id: filing.id,
      spacId: filing.spacId,
      type: filing.type as any,
      title: filing.title || `${filing.type} Filing`,
      description: filing.description || undefined,
      status: filing.status as any,
      dueDate: filing.filedDate ? new Date(filing.filedDate) : null,
      filedDate: filing.filedDate ? new Date(filing.filedDate) : undefined,
      edgarUrl: filing.edgarUrl || undefined,
    }));
  }, [filingsData]);

  // Generate real calendar events from SPACs and filings
  const calendarEvents = useMemo(() => {
    if (spacCalendarData.length === 0) {
      return [];
    }
    return generateCalendarEvents(spacCalendarData, filingCalendarData as any);
  }, [spacCalendarData, filingCalendarData]);

  // Build SPAC options from real data
  const spacOptions = useMemo(() => {
    return spacCalendarData.map((spac) => ({
      id: spac.id,
      name: spac.name,
      ticker: spac.ticker,
    }));
  }, [spacCalendarData]);

  // Filter events by SPAC if selected
  const filteredEvents = useMemo(() => {
    if (!selectedSpacId) {
      return calendarEvents;
    }
    return calendarEvents.filter((event) => event.spacId === selectedSpacId);
  }, [calendarEvents, selectedSpacId]);

  const handleMarkComplete = (event: CalendarEvent) => {
    // In a real app, this would call an API
    console.log('Mark complete:', event);
  };

  const handleReschedule = (event: CalendarEvent, newDate: Date) => {
    // In a real app, this would call an API
    console.log('Reschedule:', event, 'to', newDate);
  };

  return (
    <div className="space-y-4">
      {/* SPAC Filter & View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <label htmlFor="spac-filter" className="text-sm font-medium text-slate-700">
            Filter by SPAC:
          </label>
          <select
            id="spac-filter"
            value={selectedSpacId}
            onChange={(e) => setSelectedSpacId(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All SPACs</option>
            {spacOptions.map((spac) => (
              <option key={spac.id} value={spac.id}>
                {spac.name} ({spac.ticker})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'calendar'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <List className="h-4 w-4" />
            List View
          </button>
        </div>
      </div>

      {/* Calendar or List View */}
      {viewMode === 'calendar' ? (
        <FilingCalendar
          events={filteredEvents}
          selectedSpacId={selectedSpacId || undefined}
          onMarkComplete={handleMarkComplete}
          onReschedule={handleReschedule}
        />
      ) : (
        <DeadlineListView
          events={filteredEvents}
          onMarkComplete={handleMarkComplete}
        />
      )}
    </div>
  );
}

// ============================================================================
// DEADLINE LIST VIEW COMPONENT
// ============================================================================

interface DeadlineListViewProps {
  events: CalendarEvent[];
  onMarkComplete?: (event: CalendarEvent) => void;
}

function DeadlineListView({ events, onMarkComplete }: DeadlineListViewProps) {
  const now = startOfDay(new Date());

  // Group events by status
  const overdueEvents = events.filter(
    (e) => isBefore(e.dueDate, now) && e.status !== 'COMPLETE' && e.status !== 'EFFECTIVE'
  );
  const upcomingEvents = events.filter((e) => {
    const days = differenceInDays(e.dueDate, now);
    return days >= 0 && days <= 7 && e.status !== 'COMPLETE' && e.status !== 'EFFECTIVE';
  });
  const futureEvents = events.filter((e) => {
    const days = differenceInDays(e.dueDate, now);
    return days > 7 && e.status !== 'COMPLETE' && e.status !== 'EFFECTIVE';
  });
  const completedEvents = events.filter(
    (e) => e.status === 'COMPLETE' || e.status === 'EFFECTIVE'
  );

  const renderEventRow = (event: CalendarEvent) => {
    const days = differenceInDays(event.dueDate, now);
    const isOverdue = days < 0;
    const isUrgent = days >= 0 && days <= 3;

    const eventTypeColors: Record<string, string> = {
      PERIODIC: 'bg-blue-100 text-blue-700',
      CURRENT: 'bg-purple-100 text-purple-700',
      PROXY: 'bg-orange-100 text-orange-700',
      REGISTRATION: 'bg-green-100 text-green-700',
      DEADLINE: 'bg-red-100 text-red-700',
      OTHER: 'bg-slate-100 text-slate-700',
    };

    const priorityColors: Record<string, string> = {
      CRITICAL: 'text-red-600',
      HIGH: 'text-orange-600',
      MEDIUM: 'text-blue-600',
      LOW: 'text-slate-600',
    };

    return (
      <div
        key={event.id}
        className={cn(
          'flex items-center justify-between rounded-lg border p-4',
          isOverdue
            ? 'border-red-200 bg-red-50'
            : isUrgent
            ? 'border-yellow-200 bg-yellow-50'
            : 'border-slate-200 bg-white'
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex h-12 w-12 flex-col items-center justify-center rounded-lg',
              isOverdue
                ? 'bg-red-100 text-red-600'
                : isUrgent
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            <span className="text-lg font-bold">
              {isOverdue ? Math.abs(days) : days}
            </span>
            <span className="text-[10px]">{isOverdue ? 'late' : 'days'}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{event.title}</span>
              <Badge className={eventTypeColors[event.eventType]}>
                {event.eventType}
              </Badge>
              <span className={cn('text-xs font-medium', priorityColors[event.priority])}>
                {event.priority}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
              <span>{event.spacName}</span>
              <span>-</span>
              <span>Due {format(event.dueDate, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {event.edgarUrl && (
            <a
              href={event.edgarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          {onMarkComplete &&
            event.status !== 'COMPLETE' &&
            event.status !== 'EFFECTIVE' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onMarkComplete(event)}
              >
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Overdue */}
      {overdueEvents.length > 0 && (
        <Card className="border-red-200">
          <CardHeader className="bg-red-50">
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Overdue ({overdueEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {overdueEvents.map(renderEventRow)}
          </CardContent>
        </Card>
      )}

      {/* Upcoming (7 days) */}
      {upcomingEvents.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="bg-yellow-50">
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Clock className="h-5 w-5" />
              Due This Week ({upcomingEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {upcomingEvents.map(renderEventRow)}
          </CardContent>
        </Card>
      )}

      {/* Future */}
      {futureEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-500" />
              Upcoming ({futureEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {futureEvents.map(renderEventRow)}
          </CardContent>
        </Card>
      )}

      {/* Completed */}
      {completedEvents.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              Completed ({completedEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            {completedEvents.map(renderEventRow)}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {events.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-lg font-medium text-slate-900">No events found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try adjusting your filters or check back later.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============================================================================
// FILING DEADLINES TRACKER COMPONENT
// ============================================================================

function FilingDeadlinesTracker() {
  const [selectedSpac, setSelectedSpac] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<DeadlineFilterType>('all');

  // Calculate all deadlines
  const allDeadlines = useMemo(() => {
    return calculateAllFilingDeadlines(mockSpacs);
  }, []);

  // Apply filters
  const filteredDeadlines = useMemo(() => {
    let deadlines = allDeadlines;
    deadlines = filterDeadlinesBySpac(deadlines, selectedSpac);
    deadlines = filterDeadlinesByType(deadlines, selectedType);
    return deadlines;
  }, [allDeadlines, selectedSpac, selectedType]);

  // Get counts by urgency
  const counts = useMemo(() => {
    const critical = filteredDeadlines.filter(d => d.urgency === 'critical').length;
    const warning = filteredDeadlines.filter(d => d.urgency === 'warning').length;
    const normal = filteredDeadlines.filter(d => d.urgency === 'normal').length;
    return { critical, warning, normal, total: filteredDeadlines.length };
  }, [filteredDeadlines]);

  return (
    <div className="space-y-6">
      {/* Urgency Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className={cn(
          'border-l-4',
          counts.critical > 0 ? 'border-l-danger-500 bg-danger-50/30' : 'border-l-slate-200'
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Critical</p>
                <p className={cn(
                  'text-2xl font-bold',
                  counts.critical > 0 ? 'text-danger-600' : 'text-slate-400'
                )}>
                  {counts.critical}
                </p>
                <p className="text-xs text-slate-400">Less than 7 days</p>
              </div>
              <AlertTriangle className={cn(
                'h-8 w-8',
                counts.critical > 0 ? 'text-danger-500' : 'text-slate-300'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          'border-l-4',
          counts.warning > 0 ? 'border-l-warning-500 bg-warning-50/30' : 'border-l-slate-200'
        )}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Warning</p>
                <p className={cn(
                  'text-2xl font-bold',
                  counts.warning > 0 ? 'text-warning-600' : 'text-slate-400'
                )}>
                  {counts.warning}
                </p>
                <p className="text-xs text-slate-400">7-30 days</p>
              </div>
              <Clock className={cn(
                'h-8 w-8',
                counts.warning > 0 ? 'text-warning-500' : 'text-slate-300'
              )} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success-500 bg-success-50/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Normal</p>
                <p className="text-2xl font-bold text-success-600">{counts.normal}</p>
                <p className="text-xs text-slate-400">More than 30 days</p>
              </div>
              <Calendar className="h-8 w-8 text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary-500">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total</p>
                <p className="text-2xl font-bold text-primary-600">{counts.total}</p>
                <p className="text-xs text-slate-400">All deadlines</p>
              </div>
              <FileText className="h-8 w-8 text-primary-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-slate-400" />
              Filter Deadlines
            </CardTitle>
            <div className="flex flex-wrap gap-3">
              {/* SPAC Filter */}
              <select
                value={selectedSpac || ''}
                onChange={(e) => setSelectedSpac(e.target.value || null)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All SPACs</option>
                {mockSpacs.map((spac) => (
                  <option key={spac.id} value={spac.id}>
                    {spac.ticker} - {spac.name}
                  </option>
                ))}
              </select>

              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as DeadlineFilterType)}
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {deadlineFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Deadlines List */}
      <UpcomingDeadlines
        filingDeadlines={filteredDeadlines}
        maxItems={20}
        showHeader={true}
        showUrgencyBadges={true}
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function CompliancePage() {
  const searchParams = useSearchParams();
  const [activeModule, setActiveModule] = useState<ComplianceModule>('dashboard');

  // Check URL for tab parameter (e.g., /compliance?tab=alerts)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && baseModules.some(m => m.key === tab)) {
      setActiveModule(tab as ComplianceModule);
    }
  }, [searchParams]);

  // Fetch unread alert count for badge
  const { data: unreadAlertData } = trpc.alert.getUnreadCount.useQuery();
  const unreadAlertCount = unreadAlertData?.count ?? 0;

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <ComplianceDashboard />;
      case 'calendar':
        return <RegulatoryCalendarView />;
      case 'alerts':
        return <AlertList />;
      case 'deadlines':
        return <FilingDeadlinesTracker />;
      case 'checklist':
        return <ComplianceChecklist />;
      case 'board':
        return <BoardMeetingManager />;
      case 'trading':
        return <InsiderTradingWindow />;
      case 'conflicts':
        return <ConflictOfInterestLog />;
      case 'policies':
        return <PolicyLibrary />;
      case 'audit':
        return <AuditTrail />;
      default:
        return <ComplianceDashboard />;
    }
  };

  // Calculate critical deadlines for header badge
  const criticalDeadlinesCount = useMemo(() => {
    const allDeadlines = calculateAllFilingDeadlines(mockSpacs);
    return allDeadlines.filter(d => d.urgency === 'critical').length;
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary-100 p-2">
            <Shield className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="page-title">Compliance & Governance</h1>
            <p className="page-description">
              SOX and SEC compliance tracking, board management, and corporate governance
            </p>
          </div>
        </div>
      </div>

      {/* Module Navigation */}
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full gap-2 rounded-lg bg-slate-100 p-1">
          {baseModules.map((module) => {
            const Icon = module.icon;
            const showCriticalBadge = module.key === 'deadlines' && criticalDeadlinesCount > 0;
            const showAlertBadge = module.key === 'alerts' && unreadAlertCount > 0;
            return (
              <button
                key={module.key}
                onClick={() => setActiveModule(module.key)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap',
                  activeModule === module.key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {module.label}
                {showCriticalBadge && (
                  <Badge variant="danger" size="sm" className="ml-1">
                    {criticalDeadlinesCount}
                  </Badge>
                )}
                {showAlertBadge && (
                  <Badge variant="danger" size="sm" className="ml-1">
                    {unreadAlertCount}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Module Content */}
      <div>{renderModule()}</div>
    </div>
  );
}
