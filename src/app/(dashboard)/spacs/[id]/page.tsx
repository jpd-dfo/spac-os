'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import {
  ArrowLeft,
  Building2,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Target,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Download,
  Eye,
  PiggyBank,
  BarChart3,
  Milestone,
  Circle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { UploadModal } from '@/components/documents/UploadModal';
import { StatusTransition, type SpacStatus as StatusTransitionStatus } from '@/components/spac';
import { SpacStatusBadge } from '@/components/spacs';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Tabs, TabsList, TabTrigger, TabContent } from '@/components/ui/Tabs';
import { TARGET_STATUS_LABELS } from '@/lib/constants';
import { trpc } from '@/lib/trpc/client';
import {
  formatLargeNumber,
  formatDate,
  formatCurrency,
  daysUntil,
  formatPercent,
  formatRelativeTime,
  formatFileSize,
  cn,
} from '@/lib/utils';

// ============================================================================
// TAB TYPES
// ============================================================================

type TabType = 'overview' | 'timeline' | 'documents' | 'team' | 'financials';

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function TimelineIcon({ type, status }: { type: string; status: 'completed' | 'upcoming' | 'current' }) {
  const iconClass = cn(
    'h-4 w-4',
    status === 'completed' ? 'text-success-600' : status === 'current' ? 'text-primary-600' : 'text-slate-400'
  );

  switch (type) {
    case 'formation':
      return <Building2 className={iconClass} />;
    case 'ipo':
      return <TrendingUp className={iconClass} />;
    case 'search':
      return <Target className={iconClass} />;
    case 'loi':
    case 'da':
      return <FileText className={iconClass} />;
    case 'filing':
      return <FileText className={iconClass} />;
    case 'sec':
      return <AlertTriangle className={iconClass} />;
    case 'vote':
      return <Users className={iconClass} />;
    case 'closing':
      return <CheckCircle2 className={iconClass} />;
    case 'task':
      return <Activity className={iconClass} />;
    default:
      return <Circle className={iconClass} />;
  }
}

function getDocumentStatusBadge(status: string) {
  switch (status) {
    case 'FINAL':
    case 'ACCEPTED':
      return <Badge variant="success" size="sm">Final</Badge>;
    case 'APPROVED':
    case 'SUBMITTED':
      return <Badge variant="primary" size="sm">Approved</Badge>;
    case 'UNDER_REVIEW':
    case 'REVIEW':
      return <Badge variant="warning" size="sm">Under Review</Badge>;
    case 'DRAFT':
      return <Badge variant="secondary" size="sm">Draft</Badge>;
    case 'AMENDED':
      return <Badge variant="warning" size="sm">Amended</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
}

function getTaskStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success" size="sm">Completed</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="primary" size="sm">In Progress</Badge>;
    case 'BLOCKED':
      return <Badge variant="danger" size="sm">Blocked</Badge>;
    case 'NOT_STARTED':
      return <Badge variant="secondary" size="sm">Not Started</Badge>;
    case 'CANCELLED':
      return <Badge variant="secondary" size="sm">Cancelled</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
}

function getTaskPriorityBadge(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return <Badge variant="danger" size="sm">Critical</Badge>;
    case 'HIGH':
      return <Badge variant="warning" size="sm">High</Badge>;
    case 'MEDIUM':
      return <Badge variant="secondary" size="sm">Medium</Badge>;
    case 'LOW':
      return <Badge variant="secondary" size="sm">Low</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{priority}</Badge>;
  }
}

// ============================================================================
// SYNC FROM SEC BUTTON COMPONENT
// ============================================================================

function SyncFromSecButton({
  spacId,
  cik,
  onSuccess,
}: {
  spacId: string;
  cik: string;
  onSuccess: () => void;
}) {
  const syncMutation = trpc.filing.syncFilingsFromEdgar.useMutation({
    onSuccess: (data) => {
      if (data.synced > 0) {
        toast.success(
          `Synced ${data.synced} filings from SEC EDGAR (${data.created} new, ${data.updated} updated)`
        );
      } else {
        toast('No new filings found in SEC EDGAR');
      }
      onSuccess();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sync filings from SEC EDGAR');
    },
  });

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={() => syncMutation.mutate({ spacId })}
      disabled={syncMutation.isPending}
    >
      {syncMutation.isPending ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync from SEC
        </>
      )}
    </Button>
  );
}

// ============================================================================
// SKELETON COMPONENTS FOR LOADING STATE
// ============================================================================

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-slate-200" />
            <div>
              <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 bg-slate-200 rounded" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 rounded" />
          <div className="h-10 w-28 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                  <div className="h-6 w-24 bg-slate-200 rounded mb-1" />
                  <div className="h-3 w-16 bg-slate-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 w-full bg-slate-200 rounded" />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-slate-200 rounded" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-200 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

function ErrorState({ id, message, onRetry }: { id: string; message?: string; onRetry: () => void }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-100 mb-6">
        <AlertCircle className="h-10 w-10 text-danger-600" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load SPAC</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        {message || `Unable to load SPAC with ID "${id}". Please try again.`}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

function NotFoundState({ id }: { id: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
        <Building2 className="h-10 w-10 text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">SPAC Not Found</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        The SPAC with ID "{id}" could not be found. It may have been deleted or you may not have access to it.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={() => router.push('/spacs')}>
          View All SPACs
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function SPACDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params['id'] as string;
  const [_activeTab, setActiveTab] = useState<TabType>('overview');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING - Connected to tRPC
  // ============================================================================

  const {
    data: spacData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.spac.getById.useQuery(
    { id },
    {
      enabled: !!id,
      retry: 1,
    }
  );

  // Type assertion for relations included by the router but not in base Prisma type
  type SpacRelations = {
    targets?: Array<{ id: string; name: string; status: string; enterpriseValue: number | null; evaluationScore: number | null; industry: string | null }>;
    documents?: Array<{ id: string; name: string; status: string; fileUrl: string | null; createdAt: Date; category?: string | null; mimeType?: string | null; fileSize?: number | null; type?: string | null }>;
    filings?: Array<{ id: string; formType: string; filedDate: Date; dueDate: Date | null; description: string | null; edgarUrl: string | null; status: string | null }>;
    financials?: Array<{ id: string; type: string; period: string | null; periodEnd?: Date; revenue?: number | null; netIncome?: number | null; totalAssets?: number | null; totalLiabilities?: number | null; createdAt: Date; updatedAt: Date; data?: unknown }>;
    tasks?: Array<{ id: string; dueDate: Date | null; createdAt: Date; status: string; title: string; description: string | null; priority?: string | null }>;
    _count?: { documents?: number; financials?: number; targets?: number; filings?: number; tasks?: number; milestones?: number };
  };
  const spac = spacData as (typeof spacData & SpacRelations) | undefined;

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const days = useMemo(() => daysUntil(spac?.deadlineDate), [spac?.deadlineDate]);
  const isUrgent = days !== null && days <= 30;
  const isCritical = days !== null && days <= 14;

  // Convert trust amount from Decimal to number
  const trustBalance = useMemo(() => {
    if (!spac?.trustAmount) {return 0;}
    return Number(spac.trustAmount);
  }, [spac?.trustAmount]);

  // Get trust per share (default SPAC unit price since sharesOutstanding is not in schema)
  const trustPerShare = 10.0;

  // Derive timeline events from tasks and key dates
  const timelineEvents = useMemo(() => {
    const events: Array<{
      id: string;
      date: Date;
      type: string;
      title: string;
      description: string;
      status: 'completed' | 'upcoming' | 'current';
    }> = [];

    if (!spac) {return events;}

    // Add IPO date if available
    if (spac.ipoDate) {
      events.push({
        id: 'ipo',
        date: new Date(spac.ipoDate),
        type: 'ipo',
        title: 'IPO Completed',
        description: `SPAC went public${trustBalance ? ` raising ${formatLargeNumber(trustBalance)}` : ''}`,
        status: 'completed',
      });
    }

    // Add tasks as timeline events
    if ('tasks' in spac && spac.tasks) {
      (spac.tasks as Array<{ id: string; dueDate: Date | null; createdAt: Date; status: string; title: string; description: string | null }>).forEach((task) => {
        const taskDate = task.dueDate ? new Date(task.dueDate) : new Date(task.createdAt);
        const isCompleted = task.status === 'COMPLETED';
        const isPast = taskDate < new Date();

        events.push({
          id: task.id,
          date: taskDate,
          type: 'task',
          title: task.title,
          description: task.description || '',
          status: isCompleted ? 'completed' : isPast ? 'current' : 'upcoming',
        });
      });
    }

    // Add deadline if available
    if (spac.deadlineDate) {
      const deadlineDate = new Date(spac.deadlineDate);
      const isPast = deadlineDate < new Date();
      events.push({
        id: 'deadline',
        date: deadlineDate,
        type: 'closing',
        title: 'SPAC Deadline',
        description: 'Final deadline for business combination',
        status: isPast ? 'completed' : 'upcoming',
      });
    }

    // Sort by date
    events.sort((a, b) => a.date.getTime() - b.date.getTime());

    return events;
  }, [spac, trustBalance]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return <DetailSkeleton />;
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (isError) {
    const errorMessage = error?.message;
    if (errorMessage?.includes('not found') || errorMessage?.includes('NOT_FOUND')) {
      return <NotFoundState id={id} />;
    }
    return <ErrorState id={id} message={errorMessage} onRetry={() => refetch()} />;
  }

  if (!spac) {
    return <NotFoundState id={id} />;
  }

  // ============================================================================
  // TAB DEFINITIONS
  // ============================================================================

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'timeline', label: 'Timeline', icon: Milestone, count: timelineEvents.length },
    { id: 'documents', label: 'Documents', icon: FileText, count: spac?._count?.documents || 0 },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'financials', label: 'Financials', icon: DollarSign, count: spac?._count?.financials || 0 },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {/* Back Button */}
          <Link
            href="/spacs"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* SPAC Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
              <Building2 className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{spac.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                {spac.ticker && (
                  <span className="text-lg font-medium text-slate-500">{spac.ticker}</span>
                )}
                <SpacStatusBadge status={spac.status} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md">
            <ExternalLink className="mr-2 h-4 w-4" />
            SEC Filings
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push(`/spacs/${spac.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit SPAC
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* STATUS TRANSITION */}
      {/* ================================================================== */}
      <Card className="bg-slate-50/50">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">Status Transition:</span>
            </div>
            <StatusTransition
              currentStatus={spac.status as StatusTransitionStatus}
              spacId={spac.id}
              onStatusChange={() => {
                // Refetch data when status changes
                refetch();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* KEY METRICS ROW */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Trust Balance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Trust Balance</p>
                <p className="text-xl font-bold text-slate-900">
                  {trustBalance > 0 ? formatLargeNumber(trustBalance) : '-'}
                </p>
                <p className="text-xs text-slate-500">
                  {formatCurrency(trustPerShare)} per share
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline Countdown */}
        <Card
          className={cn(
            isCritical
              ? 'border-danger-200 bg-danger-50'
              : isUrgent
                ? 'border-warning-200 bg-warning-50'
                : ''
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  isCritical
                    ? 'bg-danger-100'
                    : isUrgent
                      ? 'bg-warning-100'
                      : 'bg-slate-100'
                )}
              >
                <Clock
                  className={cn(
                    'h-5 w-5',
                    isCritical
                      ? 'text-danger-600'
                      : isUrgent
                        ? 'text-warning-600'
                        : 'text-slate-600'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-slate-500">Deadline</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    isCritical
                      ? 'text-danger-700'
                      : isUrgent
                        ? 'text-warning-700'
                        : 'text-slate-900'
                  )}
                >
                  {days !== null ? `${days} days` : '-'}
                </p>
                <p className="text-xs text-slate-500">{formatDate(spac.deadlineDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Targets Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Target className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Active Targets</p>
                <p className="text-xl font-bold text-slate-900">
                  {spac?._count?.targets || 0}
                </p>
                <p className="text-xs text-slate-500">
                  acquisition candidates
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Documents</p>
                <p className="text-xl font-bold text-slate-900">
                  {spac?._count?.documents || 0}
                </p>
                <p className="text-xs text-slate-500">
                  {spac?._count?.filings || 0} SEC filings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* TABS */}
      {/* ================================================================== */}
      <Tabs defaultValue="overview" onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList variant="default" aria-label="SPAC Details">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabTrigger key={tab.id} value={tab.id}>
                <Icon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {tab.count}
                  </span>
                )}
              </TabTrigger>
            );
          })}
        </TabsList>

        {/* ================================================================== */}
        {/* OVERVIEW TAB */}
        {/* ================================================================== */}
        <TabContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-6 lg:col-span-2">
              {/* SPAC Details */}
              <Card>
                <CardHeader>
                  <CardTitle>SPAC Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Name</p>
                      <p className="text-sm text-slate-900">{spac.name}</p>
                    </div>
                    {spac.ticker && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Ticker Symbol</p>
                        <p className="text-sm text-slate-900">{spac.ticker}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500">Status</p>
                      <div className="mt-1">
                        <SpacStatusBadge status={spac.status} />
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Created</p>
                      <p className="text-sm text-slate-900">{formatDate(spac.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Last Updated</p>
                      <p className="text-sm text-slate-900">{formatRelativeTime(spac.updatedAt)}</p>
                    </div>
                    {spac.redemptionRate !== null && spac.redemptionRate !== undefined && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Redemption Rate</p>
                        <p className="text-sm text-slate-900">{formatPercent(Number(spac.redemptionRate) * 100)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Key Dates */}
              <Card>
                <CardHeader>
                  <CardTitle>Key Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium text-slate-500">IPO Date</p>
                      <p className="text-sm text-slate-900">{formatDate(spac.ipoDate) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Deadline</p>
                      <p className="text-sm text-slate-900">{formatDate(spac.deadlineDate) || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Days Remaining</p>
                      <p className={cn(
                        'text-sm font-medium',
                        isCritical ? 'text-danger-600' : isUrgent ? 'text-warning-600' : 'text-slate-900'
                      )}>
                        {days !== null ? `${days} days` : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Active Targets */}
              {spac.targets && spac.targets.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Targets</CardTitle>
                    <CardDescription>Potential acquisition candidates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell header>Target</TableCell>
                          <TableCell header>Industry</TableCell>
                          <TableCell header>Status</TableCell>
                          <TableCell header>Valuation</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {spac.targets.slice(0, 5).map((target) => (
                          <TableRow key={target.id}>
                            <TableCell>
                              <span className="font-medium text-slate-900">{target.name}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-600">{target.industry || '-'}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" size="sm">
                                {TARGET_STATUS_LABELS[target.status as keyof typeof TARGET_STATUS_LABELS] || target.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-slate-900">
                                {target.enterpriseValue ? formatLargeNumber(Number(target.enterpriseValue)) : '-'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {spac.targets.length > 5 && (
                      <div className="mt-4 text-center">
                        <Button variant="ghost" size="sm">
                          View all {spac.targets.length} targets
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Trust Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Trust Account</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Current Balance</span>
                      <span className="font-medium text-slate-900">
                        {trustBalance > 0 ? formatLargeNumber(trustBalance) : '-'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Per Share Value</span>
                      <span className="font-medium text-slate-900">
                        {formatCurrency(trustPerShare)}
                      </span>
                    </div>
                    {spac.redemptionRate !== null && spac.redemptionRate !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Redemption Rate</span>
                        <span className="font-medium text-slate-900">
                          {formatPercent(Number(spac.redemptionRate) * 100)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Targets</span>
                      <span className="font-medium text-slate-900">
                        {spac?._count?.targets || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Documents</span>
                      <span className="font-medium text-slate-900">
                        {spac?._count?.documents || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">SEC Filings</span>
                      <span className="font-medium text-slate-900">
                        {spac?._count?.filings || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Active Tasks</span>
                      <span className="font-medium text-slate-900">
                        {spac?._count?.tasks || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => setActiveTab('documents')}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Documents
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => setActiveTab('timeline')}>
                    <Milestone className="mr-2 h-4 w-4" />
                    View Timeline
                  </Button>
                  <Button variant="secondary" className="w-full justify-start" size="sm" onClick={() => setActiveTab('financials')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Financial Dashboard
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabContent>

        {/* ================================================================== */}
        {/* TIMELINE TAB */}
        {/* ================================================================== */}
        <TabContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>SPAC Lifecycle Timeline</CardTitle>
              <CardDescription>Track key milestones and events in the SPAC journey</CardDescription>
            </CardHeader>
            <CardContent>
              {timelineEvents.length === 0 ? (
                <EmptyState
                  icon={<Milestone className="h-12 w-12" />}
                  title="No timeline events"
                  description="Timeline events will appear as key dates and tasks are added"
                />
              ) : (
                <div className="relative">
                  {timelineEvents.map((event, index) => (
                    <div key={event.id} className="relative flex gap-4 pb-8 last:pb-0">
                      {/* Timeline Line */}
                      {index !== timelineEvents.length - 1 && (
                        <div
                          className={cn(
                            'absolute left-[15px] top-8 h-full w-0.5',
                            event.status === 'completed' ? 'bg-success-200' : 'bg-slate-200'
                          )}
                        />
                      )}

                      {/* Timeline Icon */}
                      <div
                        className={cn(
                          'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2',
                          event.status === 'completed'
                            ? 'border-success-500 bg-success-50'
                            : event.status === 'current'
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-slate-200 bg-white'
                        )}
                      >
                        <TimelineIcon type={event.type} status={event.status} />
                      </div>

                      {/* Timeline Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h4 className="font-medium text-slate-900">{event.title}</h4>
                          <span
                            className={cn(
                              'text-sm',
                              event.status === 'completed'
                                ? 'text-slate-500'
                                : event.status === 'current'
                                  ? 'text-primary-600 font-medium'
                                  : 'text-slate-400'
                            )}
                          >
                            {formatDate(event.date)}
                          </span>
                        </div>
                        {event.description && (
                          <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                        )}
                        {event.status === 'upcoming' && (
                          <Badge variant="secondary" size="sm" className="mt-2">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Tasks */}
          {spac.tasks && spac.tasks.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Active Tasks</CardTitle>
                <CardDescription>Outstanding tasks for this SPAC</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header>Task</TableCell>
                      <TableCell header>Priority</TableCell>
                      <TableCell header>Status</TableCell>
                      <TableCell header>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {spac.tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-900">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-slate-500 truncate max-w-xs">{task.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTaskPriorityBadge(task.priority || 'MEDIUM')}
                        </TableCell>
                        <TableCell>
                          {getTaskStatusBadge(task.status)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {formatDate(task.dueDate) || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabContent>

        {/* ================================================================== */}
        {/* DOCUMENTS TAB */}
        {/* ================================================================== */}
        <TabContent value="documents">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-slate-900">
                Documents ({spac.documents?.length || 0})
              </h3>
              <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
                <FileText className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </div>

            {(!spac.documents || spac.documents.length === 0) ? (
              <EmptyState
                icon={<FileText className="h-12 w-12" />}
                title="No documents yet"
                description="Upload your first document to get started"
                action={{
                  label: 'Upload Document',
                  onClick: () => setIsUploadModalOpen(true),
                }}
              />
            ) : (
              <Card>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header>Document</TableCell>
                      <TableCell header>Type</TableCell>
                      <TableCell header>Size</TableCell>
                      <TableCell header>Uploaded</TableCell>
                      <TableCell header className="w-20">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {spac.documents.map((doc) => (
                      <TableRow key={doc.id} className="cursor-pointer hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                              <FileText className="h-5 w-5 text-slate-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{doc.name}</p>
                              {doc.mimeType && (
                                <p className="text-xs text-slate-500">{doc.mimeType}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" size="sm">
                            {doc.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {doc.fileSize ? formatFileSize(doc.fileSize) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm text-slate-900">{formatDate(doc.createdAt)}</p>
                            <p className="text-xs text-slate-500">{formatRelativeTime(doc.createdAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon-sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {doc.fileUrl && (
                              <Button variant="ghost" size="icon-sm">
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {/* SEC Filings Section */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-slate-900">
                  SEC Filings ({spac.filings?.length || 0})
                </h3>
                {spac.cik && (
                  <SyncFromSecButton spacId={spac.id} cik={spac.cik} onSuccess={() => refetch()} />
                )}
              </div>
              {spac.filings && spac.filings.length > 0 ? (
                <Card>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell header>Form Type</TableCell>
                        <TableCell header>Status</TableCell>
                        <TableCell header>Filing Date</TableCell>
                        <TableCell header>Due Date</TableCell>
                        <TableCell header className="w-20">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {spac.filings.map((filing) => (
                        <TableRow key={filing.id}>
                          <TableCell>
                            <span className="font-medium text-slate-900">{filing.type}</span>
                          </TableCell>
                          <TableCell>
                            {getDocumentStatusBadge(filing.status || 'PENDING')}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatDate(filing.filedDate) || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatDate(filing.dueDate) || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {filing.edgarUrl && (
                              <a
                                href={filing.edgarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <EmptyState
                      icon={<FileText className="h-12 w-12" />}
                      title="No SEC filings"
                      description={spac.cik
                        ? "Click 'Sync from SEC' to import filings from SEC EDGAR"
                        : "Add a CIK number to this SPAC to sync filings from SEC EDGAR"
                      }
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabContent>

        {/* ================================================================== */}
        {/* TEAM TAB */}
        {/* Note: Team/Contacts data is not currently linked to SPACs in the schema */}
        {/* ================================================================== */}
        <TabContent value="team">
          <div className="space-y-6">
            <EmptyState
              icon={<Users className="h-12 w-12" />}
              title="Team data not available"
              description="Team, sponsor, and management information is not currently linked to this SPAC in the database schema. This feature requires additional data model updates."
            />

            {/* Placeholder for future implementation */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-slate-400">Coming Soon</CardTitle>
                <CardDescription>
                  The following team information will be available in a future update:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Sponsors and their commitment amounts
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Management team members
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Board of Directors
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Legal and financial advisors
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabContent>

        {/* ================================================================== */}
        {/* FINANCIALS TAB */}
        {/* ================================================================== */}
        <TabContent value="financials">
          <div className="space-y-6">
            {/* Trust Account Overview */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                      <PiggyBank className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Trust Balance</p>
                      <p className="text-xl font-bold text-slate-900">
                        {trustBalance > 0 ? formatLargeNumber(trustBalance) : '-'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                      <DollarSign className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Per Share Value</p>
                      <p className="text-xl font-bold text-slate-900">
                        {formatCurrency(trustPerShare)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {spac.redemptionRate !== null && spac.redemptionRate !== undefined && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
                        <BarChart3 className="h-5 w-5 text-warning-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Redemption Rate</p>
                        <p className="text-xl font-bold text-slate-900">
                          {formatPercent(Number(spac.redemptionRate) * 100)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Financial Records */}
            {spac.financials && spac.financials.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Records</CardTitle>
                  <CardDescription>Historical financial data and models</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell header>Type</TableCell>
                        <TableCell header>Period</TableCell>
                        <TableCell header>Created</TableCell>
                        <TableCell header>Last Updated</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {spac.financials.map((financial) => (
                        <TableRow key={financial.id}>
                          <TableCell>
                            <Badge variant="secondary" size="sm">
                              {financial.type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {financial.period || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatDate(financial.createdAt)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-slate-600">
                              {formatRelativeTime(financial.updatedAt)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={<BarChart3 className="h-12 w-12" />}
                    title="No financial records"
                    description="Financial records will appear here once they are added"
                  />
                </CardContent>
              </Card>
            )}

            {/* Note about missing data */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-slate-400">Additional Financial Data</CardTitle>
                <CardDescription>
                  The following financial information requires additional data in the schema:
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Trust account interest earnings and historical balance
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Redemption scenarios and projections
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Detailed expense breakdown
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    PIPE and forward purchase commitments
                  </li>
                  <li className="flex items-center gap-2">
                    <Circle className="h-2 w-2 fill-slate-400" />
                    Share structure (shares outstanding, warrants)
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabContent>
      </Tabs>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={async (files, metadata) => {
          // TODO: Implement actual file upload with spacId
          console.log('Upload files for SPAC:', spac.id, { files, metadata });
          // After upload completes, refetch the SPAC data
          refetch();
        }}
      />
    </div>
  );
}
