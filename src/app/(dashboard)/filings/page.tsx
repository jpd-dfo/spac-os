'use client';

import { useState, useMemo, useCallback } from 'react';

import { differenceInDays, startOfDay } from 'date-fns';
import {
  FileText,
  RefreshCw,
  AlertCircle,
  Download,
  Plus,
  Calendar,
  Clock,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  CreateFilingModal,
  type NewFilingData,
  type SPAC as CreateFilingSPAC,
  type TeamMember,
} from '@/components/filings/CreateFilingModal';
import {
  DeadlineAlerts,
  type DeadlineAlert,
} from '@/components/filings/DeadlineAlerts';
import { FilingList, type FilingListItem } from '@/components/filings/FilingList';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Map database status to component status
function mapFilingStatus(dbStatus: string): FilingStatus {
  const statusMap: Record<string, FilingStatus> = {
    DRAFTING: 'DRAFT',
    INTERNAL_REVIEW: 'INTERNAL_REVIEW',
    LEGAL_REVIEW: 'INTERNAL_REVIEW',
    BOARD_APPROVAL: 'EXTERNAL_REVIEW',
    FILED: 'SUBMITTED',
    SEC_COMMENT: 'SEC_COMMENT',
    RESPONSE_FILED: 'RESPONSE_FILED',
    AMENDED: 'RESPONSE_FILED',
    EFFECTIVE: 'EFFECTIVE',
    WITHDRAWN: 'COMPLETE',
  };
  return statusMap[dbStatus] || 'DRAFT';
}

// Calculate priority based on due date and status
function calculatePriority(
  filedDate: Date | null,
  status: string
): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
  if (['EFFECTIVE', 'FILED', 'WITHDRAWN'].includes(status)) {
    return 'LOW';
  }

  if (!filedDate) {
    return 'MEDIUM';
  }

  const now = new Date();
  const dueDate = new Date(filedDate);
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0 || daysUntilDue <= 3) {
    return 'CRITICAL';
  }
  if (daysUntilDue <= 7) {
    return 'HIGH';
  }
  if (daysUntilDue <= 14) {
    return 'MEDIUM';
  }
  return 'LOW';
}

// Calculate alert type based on due date
function calculateAlertType(dueDate: Date, status: string): DeadlineAlert['alertType'] | null {
  if (['COMPLETE', 'EFFECTIVE', 'SUBMITTED', 'FILED', 'WITHDRAWN'].includes(status)) {
    return null;
  }

  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const days = differenceInDays(due, today);

  if (days < 0) return 'OVERDUE';
  if (days <= 3) return '3_DAYS';
  if (days <= 7) return '7_DAYS';
  if (days <= 14) return '14_DAYS';
  if (days <= 30) return '30_DAYS';
  return null;
}

// ============================================================================
// STATS CARD COMPONENT
// ============================================================================

function FilingStatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className={cn('text-2xl font-bold', colorClass)}>{value}</p>
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <Icon className={cn('h-8 w-8', colorClass.replace('text-', 'text-').replace('-600', '-400'))} />
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FilingsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Fetch filings from tRPC
  const {
    data: filingsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = trpc.filing.list.useQuery(
    {
      page: 1,
      pageSize: 100,
      sortBy: 'filedDate',
      sortOrder: 'desc',
    },
    {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    }
  );

  // Fetch SPACs for CreateFilingModal
  const { data: spacsData } = trpc.spac.list.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Fetch filing statistics
  const { data: statsData } = trpc.filing.getStatistics.useQuery(
    {},
    {
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // Status update mutation
  const updateStatusMutation = trpc.filing.updateStatus.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // Delete mutation
  const deleteMutation = trpc.filing.delete.useMutation({
    onSuccess: () => {
      void refetch();
    },
  });

  // Create filing mutation
  const createFilingMutation = trpc.filing.create.useMutation({
    onSuccess: () => {
      void refetch();
      setIsCreateModalOpen(false);
    },
  });

  // Transform database filings to FilingListItem format
  const filings = useMemo((): FilingListItem[] => {
    if (!filingsData?.items) {
      return [];
    }

    return filingsData.items.map((filing) => ({
      id: filing.id,
      type: filing.type as FilingType,
      title: filing.title || `${filing.type} Filing`,
      description: filing.description || undefined,
      spacId: filing.spacId,
      spacName: filing.spac?.name || 'Unknown SPAC',
      ticker: filing.spac?.ticker || 'N/A',
      cik: filing.cik || undefined,
      status: mapFilingStatus(filing.status),
      dueDate: filing.filedDate ? new Date(filing.filedDate) : new Date(),
      filedDate: filing.filedDate ? new Date(filing.filedDate) : undefined,
      effectiveDate: filing.effectiveDate ? new Date(filing.effectiveDate) : undefined,
      accessionNumber: filing.accessionNumber || undefined,
      edgarUrl: filing.edgarUrl || undefined,
      assignee: undefined, // Not in current schema
      reviewers: undefined, // Not in current schema
      priority: calculatePriority(filing.filedDate, filing.status),
      secCommentCount: filing._count?.secComments || 0,
      attachmentCount: filing._count?.documents || 0,
      lastUpdated: new Date(filing.updatedAt),
    }));
  }, [filingsData]);

  // Transform SPACs for CreateFilingModal
  const spacsForModal = useMemo((): CreateFilingSPAC[] => {
    if (!spacsData?.items) {
      return [];
    }
    return spacsData.items.map((spac) => ({
      id: spac.id,
      name: spac.name,
      ticker: spac.ticker || '',
    }));
  }, [spacsData]);

  // Create deadline alerts from filings
  const deadlineAlerts = useMemo((): DeadlineAlert[] => {
    if (!filingsData?.items) {
      return [];
    }

    return filingsData.items
      .filter((filing) => {
        // Only include filings with due dates that have alerts
        const dueDate = filing.filedDate || filing.dueDate;
        if (!dueDate) return false;
        const alertType = calculateAlertType(new Date(dueDate), filing.status);
        return alertType !== null;
      })
      .map((filing) => {
        const dueDate = new Date(filing.filedDate || filing.dueDate || new Date());
        const alertType = calculateAlertType(dueDate, filing.status) || '30_DAYS';
        const priority = calculatePriority(filing.filedDate, filing.status);

        return {
          id: `alert-${filing.id}`,
          filingId: filing.id,
          type: filing.type as FilingType,
          title: filing.title || `${filing.type} Filing`,
          spacId: filing.spacId,
          spacName: filing.spac?.name || 'Unknown SPAC',
          ticker: filing.spac?.ticker || 'N/A',
          status: mapFilingStatus(filing.status),
          dueDate,
          priority,
          alertType,
          assignee: undefined,
        };
      });
  }, [filingsData]);

  // Team members (placeholder - in a real app, fetch from user/team API)
  const teamMembers: TeamMember[] = useMemo(() => [], []);

  // Calculate stats
  const stats = useMemo(() => {
    const total = statsData?.total || filings.length;
    const byStatus = statsData?.byStatus || {};

    const pending = (byStatus['DRAFTING'] || 0) +
      (byStatus['INTERNAL_REVIEW'] || 0) +
      (byStatus['LEGAL_REVIEW'] || 0) +
      (byStatus['BOARD_APPROVAL'] || 0);

    const filed = (byStatus['FILED'] || 0) +
      (byStatus['EFFECTIVE'] || 0);

    const secComments = byStatus['SEC_COMMENT'] || 0;

    const avgReviewDays = statsData?.averageReviewDays
      ? Math.round(statsData.averageReviewDays)
      : null;

    return { total, pending, filed, secComments, avgReviewDays };
  }, [statsData, filings]);

  // Handlers
  const handleFilingClick = useCallback((filing: FilingListItem) => {
    router.push(`/filings/${filing.id}`);
  }, [router]);

  const handleFilingEdit = useCallback((filing: FilingListItem) => {
    router.push(`/filings/${filing.id}/edit`);
  }, [router]);

  const handleFilingDelete = useCallback((filing: FilingListItem) => {
    if (confirm(`Are you sure you want to delete "${filing.title}"?`)) {
      deleteMutation.mutate({ id: filing.id });
    }
  }, [deleteMutation]);

  const handleNewFiling = useCallback(() => {
    setIsCreateModalOpen(true);
  }, []);

  const handleCreateFiling = useCallback((data: NewFilingData) => {
    // Map the component's FilingType to the schema's FilingType
    const schemaTypeMap: Record<string, string> = {
      'FORM_10K': 'FORM_10K',
      'FORM_10Q': 'FORM_10Q',
      'FORM_8K': 'FORM_8K',
      'S1': 'S1',
      'S4': 'S4',
      'DEF14A': 'DEFA14A', // Map DEF14A to DEFA14A
      'PREM14A': 'PREM14A',
      'DEFA14A': 'DEFA14A',
      'SUPER_8K': 'SUPER_8K',
      'FORM_425': 'FORM_425',
      'SC_13D': 'SC_13D',
      'SC_13G': 'SC_13G',
      'FORM_3': 'FORM_3',
      'FORM_4': 'FORM_4',
      'FORM_5': 'FORM_5',
    };

    const mappedType = schemaTypeMap[data.type] || 'OTHER';

    createFilingMutation.mutate({
      spacId: data.spacId,
      type: mappedType as any,
      title: data.title,
      description: data.description || null,
      dueDate: data.dueDate,
      status: 'DRAFTING',
    });
  }, [createFilingMutation]);

  const handleAlertClick = useCallback((alert: DeadlineAlert) => {
    router.push(`/filings/${alert.filingId}`);
  }, [router]);

  const handleExport = useCallback(() => {
    // TODO: Implement export functionality
    console.log('Export filings');
  }, []);

  const handleStatusChange = useCallback((filing: FilingListItem, newStatus: FilingStatus) => {
    // Map component status back to database status
    const dbStatusMap: Record<FilingStatus, string> = {
      DRAFT: 'DRAFTING',
      INTERNAL_REVIEW: 'INTERNAL_REVIEW',
      EXTERNAL_REVIEW: 'BOARD_APPROVAL',
      SUBMITTED: 'FILED',
      SEC_COMMENT: 'SEC_COMMENT',
      RESPONSE_FILED: 'RESPONSE_FILED',
      EFFECTIVE: 'EFFECTIVE',
      COMPLETE: 'EFFECTIVE',
    };

    updateStatusMutation.mutate({
      id: filing.id,
      status: dbStatusMap[newStatus] as any,
    });
  }, [updateStatusMutation]);

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">SEC Filings</h1>
          <p className="page-description">Loading filings...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                  <div className="h-8 bg-slate-200 rounded w-1/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
              <span className="ml-3 text-slate-500">Loading filings...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">SEC Filings</h1>
          <p className="page-description">Track SEC filings, manage deadlines, and monitor compliance</p>
        </div>
        <Card className="border-danger-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-danger-400" />
            <p className="mt-4 text-lg font-medium text-danger-700">Failed to load filings</p>
            <p className="mt-1 text-sm text-danger-500">
              {error?.message || 'An error occurred while fetching filings'}
            </p>
            <Button
              onClick={handleRefresh}
              variant="secondary"
              className="mt-4"
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state
  if (filings.length === 0) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">SEC Filings</h1>
              <p className="page-description">
                Track SEC filings, manage deadlines, and monitor compliance
              </p>
            </div>
            <Button onClick={handleNewFiling} variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              New Filing
            </Button>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 rounded-full bg-primary-50 p-6">
              <FileText className="h-12 w-12 text-primary-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">No Filings Yet</h2>
            <p className="mt-3 max-w-md text-slate-500">
              Get started by creating your first SEC filing or sync filings from SEC EDGAR
              for your SPACs.
            </p>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleNewFiling} variant="primary">
                <Plus className="mr-2 h-4 w-4" />
                Create Filing
              </Button>
              <Button onClick={() => router.push('/spacs')} variant="secondary">
                Manage SPACs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Create Filing Modal */}
        <CreateFilingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateFiling}
          spacs={spacsForModal}
          teamMembers={teamMembers}
          isSubmitting={createFilingMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">SEC Filings</h1>
            <p className="page-description">
              Track SEC filings, manage deadlines, and monitor comment letter responses
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="secondary"
              size="sm"
              disabled={isFetching}
            >
              <RefreshCw className={cn('mr-2 h-4 w-4', isFetching && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={handleExport} variant="secondary" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleNewFiling} variant="primary" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Filing
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <FilingStatsCard
          title="Total Filings"
          value={stats.total}
          icon={FileText}
          colorClass="text-primary-600"
        />
        <FilingStatsCard
          title="In Progress"
          value={stats.pending}
          subtitle="Awaiting submission"
          icon={Clock}
          colorClass="text-warning-600"
        />
        <FilingStatsCard
          title="Filed"
          value={stats.filed}
          subtitle="Submitted to SEC"
          icon={Calendar}
          colorClass="text-success-600"
        />
        <FilingStatsCard
          title="SEC Comments"
          value={stats.secComments}
          subtitle={stats.avgReviewDays ? `Avg ${stats.avgReviewDays} days review` : 'Pending response'}
          icon={AlertCircle}
          colorClass={stats.secComments > 0 ? 'text-danger-600' : 'text-slate-600'}
        />
      </div>

      {/* Deadline Alerts */}
      {deadlineAlerts.length > 0 && (
        <DeadlineAlerts
          alerts={deadlineAlerts}
          onAlertClick={handleAlertClick}
        />
      )}

      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'list'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <FileText className="h-4 w-4" />
            List View
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={cn(
              'flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'timeline'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Calendar className="h-4 w-4" />
            Timeline View
          </button>
        </div>
        <Badge variant="secondary">{filings.length} filings</Badge>
      </div>

      {/* Filing Content */}
      {viewMode === 'list' ? (
        <FilingList
          filings={filings}
          onFilingClick={handleFilingClick}
          onFilingEdit={handleFilingEdit}
          onFilingDelete={handleFilingDelete}
          onNewFiling={handleNewFiling}
          onExport={handleExport}
          onStatusChange={handleStatusChange}
          showActions={true}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary-600" />
              Filing Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filings.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No filings to display</p>
              ) : (
                filings.map((filing, index) => (
                  <div
                    key={filing.id}
                    className="flex items-start gap-4 cursor-pointer hover:bg-slate-50 p-3 rounded-lg transition-colors"
                    onClick={() => router.push(`/filings/${filing.id}`)}
                  >
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        filing.status === 'COMPLETE' || filing.status === 'EFFECTIVE' ? 'bg-success-500' :
                        filing.status === 'SEC_COMMENT' ? 'bg-danger-500' :
                        filing.status === 'SUBMITTED' ? 'bg-primary-500' :
                        'bg-slate-300'
                      )} />
                      {index < filings.length - 1 && (
                        <div className="w-0.5 h-12 bg-slate-200 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{filing.title}</p>
                        <Badge variant={
                          filing.priority === 'CRITICAL' ? 'danger' :
                          filing.priority === 'HIGH' ? 'warning' :
                          'secondary'
                        } size="sm">
                          {filing.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {filing.spacName} - {filing.filedDate ? `Filed ${filing.filedDate.toLocaleDateString()}` : `Due ${filing.dueDate.toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Filing Modal */}
      <CreateFilingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateFiling}
        spacs={spacsForModal}
        teamMembers={teamMembers}
        isSubmitting={createFilingMutation.isPending}
      />
    </div>
  );
}
