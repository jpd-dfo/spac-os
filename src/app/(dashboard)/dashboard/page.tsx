'use client';

import { useMemo, useCallback } from 'react';

import {
  Building2,
  Target,
  FileText,
  Clock,
  TrendingUp,
  Users,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';


import { useUser } from '@clerk/nextjs';

// Import dashboard widgets
import {
  ActivityFeed,
} from '@/components/dashboard/ActivityFeed';
// AIInsightsWidget commented out until AI insights endpoint is available
// import {
//   AIInsightsWidget,
// } from '@/components/dashboard/AIInsightsWidget';
import {
  ComplianceCalendarWidget,
} from '@/components/dashboard/ComplianceCalendarWidget';
import {
  DealPipelineWidget,
} from '@/components/dashboard/DealPipelineWidget';
import {
  DeadlineCountdown,
} from '@/components/dashboard/DeadlineCountdown';
import {
  PipelineChart,
} from '@/components/dashboard/PipelineChart';
import {
  QuickActions,
  defaultQuickActions,
} from '@/components/dashboard/QuickActions';
import {
  RecentActivity,
  type ActivityItem,
} from '@/components/dashboard/RecentActivity';
import {
  SpacStatusCard,
} from '@/components/dashboard/SpacStatusCard';
import {
  StatsCard,
  StatsCardGroup,
  StatsCardSkeleton,
} from '@/components/dashboard/StatsCard';
import {
  TrustAccountWidget,
} from '@/components/dashboard/TrustAccountWidget';

// Import new dashboard components
import {
  UpcomingDeadlines,
  type DeadlineItem,
} from '@/components/dashboard/UpcomingDeadlines';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';

// ============================================================================
// TYPES FOR PIPELINE DATA TRANSFORMATION
// ============================================================================

type PipelineStage = 'SOURCING' | 'SCREENING' | 'EVALUATION' | 'NEGOTIATION' | 'EXECUTION';

// Deal stage type for PipelineChart component
type DealStage =
  | 'ORIGINATION'
  | 'PRELIMINARY_REVIEW'
  | 'DEEP_DIVE'
  | 'NEGOTIATION'
  | 'DOCUMENTATION'
  | 'CLOSING'
  | 'TERMINATED';

interface PipelineStageData {
  stage: DealStage;
  count: number;
  value: number;
  deals?: Array<{
    id: string;
    name: string;
    value: number;
    probability?: number;
  }>;
}

interface PipelineTarget {
  id: string;
  name: string;
  sector: string;
  stage: PipelineStage;
  estimatedValue: number;
  fitScore: number;
  lastActivity: string;
  daysInStage: number;
}

interface StageMetrics {
  stage: PipelineStage;
  count: number;
  totalValue: number;
}

interface DealPipelineData {
  targets: PipelineTarget[];
  stageMetrics: StageMetrics[];
  totalActiveTargets: number;
  totalPipelineValue: number;
  conversionRates: {
    sourcingToScreening: number;
    screeningToEvaluation: number;
    evaluationToNegotiation: number;
    negotiationToExecution: number;
  };
}

// ============================================================================
// HELPER: MAP TARGET STAGE TO PIPELINE STAGE
// ============================================================================

function mapTargetStageToPipelineStage(
  status: string,
  _stage: string
): PipelineStage {
  // Map based on actual TargetStatus enum values from schema:
  // IDENTIFIED, INITIAL_OUTREACH, NDA_SIGNED, DUE_DILIGENCE, LOI_SUBMITTED, NEGOTIATION, REJECTED, CLOSED_WON
  switch (status) {
    case 'IDENTIFIED':
      return 'SOURCING';
    case 'INITIAL_OUTREACH':
      return 'SCREENING';
    case 'NDA_SIGNED':
      return 'SCREENING';
    case 'DUE_DILIGENCE':
      return 'EVALUATION';
    case 'LOI_SUBMITTED':
      return 'NEGOTIATION';
    case 'NEGOTIATION':
      return 'NEGOTIATION';
    case 'CLOSED_WON':
      return 'EXECUTION';
    case 'REJECTED':
      return 'SOURCING'; // Rejected deals go back to sourcing for tracking
    default:
      return 'SOURCING';
  }
}

// ============================================================================
// HELPER: MAP TARGET STATUS TO DEAL STAGE (for PipelineChart)
// ============================================================================

function mapTargetStatusToDealStage(status: string): DealStage {
  // Map based on actual TargetStatus enum values to DealStage for PipelineChart
  switch (status) {
    case 'IDENTIFIED':
      return 'ORIGINATION';
    case 'INITIAL_OUTREACH':
      return 'PRELIMINARY_REVIEW';
    case 'NDA_SIGNED':
      return 'DEEP_DIVE';
    case 'DUE_DILIGENCE':
      return 'DEEP_DIVE';
    case 'LOI_SUBMITTED':
      return 'NEGOTIATION';
    case 'NEGOTIATION':
      return 'NEGOTIATION';
    case 'CLOSED_WON':
      return 'CLOSING';
    case 'REJECTED':
      return 'TERMINATED';
    default:
      return 'ORIGINATION';
  }
}

// ============================================================================
// HELPER: CALCULATE DAYS IN STAGE
// ============================================================================

function calculateDaysInStage(updatedAt: Date | string): number {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - updated.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// ============================================================================
// HELPER: FORMAT RELATIVE TIME
// ============================================================================

function formatLastActivity(updatedAt: Date | string): string {
  const updated = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) {return 'Just now';}
  if (diffHours < 24) {return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;}
  if (diffDays === 1) {return '1 day ago';}
  if (diffDays < 7) {return `${diffDays} days ago`;}
  if (diffDays < 30) {return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;}
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}


// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

function ErrorCard({
  title,
  message,
  onRetry,
  isRetrying = false,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}) {
  return (
    <Card className="border-danger-200">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-10 w-10 text-danger-400" />
        <p className="mt-3 text-sm font-medium text-danger-700">{title}</p>
        <p className="mt-1 text-xs text-danger-500">{message}</p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="secondary"
            size="sm"
            disabled={isRetrying}
            className="mt-4 border-danger-200 text-danger-700 hover:bg-danger-50"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

// Unused for now, but available for future empty states
function _EmptyStateCard({
  icon: Icon,
  title,
  description
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Icon className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-sm font-medium text-slate-600">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  // ============================================================================
  // AUTH - USER DATA FROM CLERK
  // ============================================================================

  const { user } = useUser();
  const currentUser = {
    name: user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User',
    role: 'Deal Lead',
    avatar: user?.imageUrl,
  };

  // ============================================================================
  // tRPC QUERIES WITH ERROR HANDLING
  // ============================================================================

  // Fetch SPAC stats for quick stats cards
  const spacStatsQuery = trpc.spac.getStats.useQuery(undefined, {
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
  });

  // Fetch SPACs list for SPAC status card and trust account
  const spacsQuery = trpc.spac.list.useQuery(
    {
      page: 1,
      limit: 10,
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    },
    {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    }
  );

  // Fetch targets for pipeline widget
  const targetsQuery = trpc.target.list.useQuery(
    {
      page: 1,
      pageSize: 50,
      sortBy: 'priority',
      sortOrder: 'asc',
    },
    {
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: 1000,
    }
  );

  // Fetch primary SPAC for subsequent queries
  const primarySpacId = useMemo(() => {
    if (!spacsQuery.data?.items?.length) {
      return null;
    }
    const activeSpac = spacsQuery.data.items.find(
      (s) => s.status !== 'LIQUIDATED' && s.status !== 'COMPLETED'
    ) || spacsQuery.data.items[0];
    return activeSpac?.id || null;
  }, [spacsQuery.data]);

  // Fetch filings for compliance calendar widget
  const filingsQuery = trpc.filing.list.useQuery(
    {
      page: 1,
      pageSize: 20,
      sortBy: 'deadline',
      sortOrder: 'asc',
    },
    {
      refetchOnWindowFocus: false,
      retry: 2,
    }
  );

  // Fetch trust account balance history for primary SPAC
  const balanceHistoryQuery = trpc.financial.trustAccountGetBalanceHistory.useQuery(
    { spacId: primarySpacId! },
    {
      enabled: !!primarySpacId,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  );

  // ============================================================================
  // RETRY HANDLERS
  // ============================================================================

  const handleRetryStats = useCallback(() => {
    spacStatsQuery.refetch();
  }, [spacStatsQuery]);

  const handleRetrySpacs = useCallback(() => {
    spacsQuery.refetch();
  }, [spacsQuery]);

  const handleRetryTargets = useCallback(() => {
    targetsQuery.refetch();
  }, [targetsQuery]);

  const handleRetryAll = useCallback(() => {
    spacStatsQuery.refetch();
    spacsQuery.refetch();
    targetsQuery.refetch();
  }, [spacStatsQuery, spacsQuery, targetsQuery]);

  // ============================================================================
  // DERIVED DATA: PRIMARY SPAC
  // ============================================================================

  const primarySpac = useMemo(() => {
    if (!spacsQuery.data?.items?.length) {return null;}
    // Return the first active SPAC (not liquidated or completed)
    return spacsQuery.data.items.find(
      (s) => s.status !== 'LIQUIDATED' && s.status !== 'COMPLETED'
    ) || spacsQuery.data.items[0];
  }, [spacsQuery.data]);

  // ============================================================================
  // DERIVED DATA: SPAC STATUS CARD DATA
  // ============================================================================

  const spacStatusData = useMemo(() => {
    if (!primarySpac) {return null;}

    // Map SPAC status to phase
    // Valid statuses: SEARCHING, LOI_SIGNED, DA_ANNOUNCED, SEC_REVIEW, SHAREHOLDER_VOTE, CLOSING, COMPLETED, LIQUIDATING, LIQUIDATED, TERMINATED
    const statusToPhase: Record<string, 'FORMATION' | 'PRE_IPO' | 'IPO' | 'TARGET_SEARCH' | 'DE_SPAC' | 'POST_MERGER'> = {
      'SEARCHING': 'TARGET_SEARCH',
      'LOI_SIGNED': 'DE_SPAC',
      'DA_ANNOUNCED': 'DE_SPAC',
      'SEC_REVIEW': 'DE_SPAC',
      'SHAREHOLDER_VOTE': 'DE_SPAC',
      'CLOSING': 'DE_SPAC',
      'COMPLETED': 'POST_MERGER',
      'LIQUIDATING': 'POST_MERGER',
      'LIQUIDATED': 'POST_MERGER',
      'TERMINATED': 'POST_MERGER',
    };

    const currentPhase = statusToPhase[primarySpac.status] || 'TARGET_SEARCH';

    // Calculate deadline - if no deadline, use IPO date + 24 months
    const deadlineDate = primarySpac.deadlineDate
      ? new Date(primarySpac.deadlineDate)
      : primarySpac.ipoDate
        ? new Date(new Date(primarySpac.ipoDate).getTime() + 24 * 30 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // fallback: 1 year from now

    return {
      id: primarySpac.id,
      name: primarySpac.name,
      ticker: primarySpac.ticker || 'N/A',
      currentPhase,
      ipoDate: primarySpac.ipoDate || new Date(),
      businessCombinationDeadline: deadlineDate,
      extensionsUsed: 0, // Not tracked in current schema
      maxExtensions: 2,
      milestones: (primarySpac as any)?.milestones || [], // Use real milestones if available
    };
  }, [primarySpac]);

  // ============================================================================
  // DERIVED DATA: TRUST ACCOUNT DATA
  // ============================================================================

  const trustAccountData = useMemo(() => {
    if (!primarySpac) {
      return null;
    }

    // Convert Decimal to number (Prisma Decimal fields need explicit conversion)
    const trustAmount = primarySpac.trustAmount ? Number(primarySpac.trustAmount) : 0;
    const sharesOutstanding = trustAmount > 0 ? Math.floor(trustAmount / 10) : 25300000;

    // Transform real balance history data to widget format, or generate from current trust amount
    let balanceHistory: { date: string; balance: number }[] = [];
    if (balanceHistoryQuery.data && balanceHistoryQuery.data.length > 0) {
      // Use real balance history from database
      balanceHistory = balanceHistoryQuery.data
        .filter((entry): entry is typeof entry & { date: Date } => entry.date != null)
        .map((entry) => ({
          date: new Date(entry.date).toISOString().split('T')[0] as string,
          balance: entry.balance,
        }));
    } else if (trustAmount > 0) {
      // Generate placeholder history based on IPO date if no real history exists
      const ipoDate = primarySpac.ipoDate ? new Date(primarySpac.ipoDate) : new Date();
      const today = new Date();
      const monthsDiff = Math.max(1, Math.floor((today.getTime() - ipoDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

      for (let i = 0; i <= Math.min(monthsDiff, 12); i++) {
        const date = new Date(ipoDate);
        date.setMonth(date.getMonth() + i);
        // Simulate gradual interest accrual (~0.4% per month)
        const growth = 1 + (0.004 * i);
        const dateStr = date.toISOString().split('T')[0] ?? date.toISOString().substring(0, 10);
        balanceHistory.push({
          date: dateStr,
          balance: Math.round(trustAmount * growth),
        });
      }
    }

    return {
      id: `trust-${primarySpac.id}`,
      spacName: primarySpac.name,
      spacTicker: primarySpac.ticker || 'N/A',
      initialTrustValue: trustAmount,
      currentTrustValue: trustAmount,
      interestRate: 0.045, // 4.5% - would come from API in production
      interestAccrued: trustAmount * 0.045 * (30 / 365), // ~1 month accrued
      lastInterestDate: primarySpac.ipoDate || new Date(),
      ipoDate: primarySpac.ipoDate || new Date(),
      deadlineDate: primarySpac.deadlineDate || new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      sharesOutstanding,
      redemptionPrice: trustAmount > 0 ? trustAmount / sharesOutstanding : 10.0,
      withdrawals: 0,
      extensions: 0,
      balanceHistory,
    };
  }, [primarySpac, balanceHistoryQuery.data]);

  // ============================================================================
  // DERIVED DATA: DEAL PIPELINE DATA
  // ============================================================================

  const pipelineData = useMemo((): DealPipelineData | null => {
    if (!targetsQuery.data?.items) {return null;}

    const targets = targetsQuery.data.items;
    // Use actual TargetStatus values from the schema
    const activeTargets = targets.filter(
      (t) => !['REJECTED', 'CLOSED_WON'].includes(t.status)
    );

    // Transform targets to pipeline format
    // Using actual schema fields: industry, status, valuation/revenue, aiScore
    const pipelineTargets: PipelineTarget[] = activeTargets.map((t) => ({
      id: t.id,
      name: t.name,
      sector: t.industry || 'General',
      stage: mapTargetStageToPipelineStage(t.status, t.status), // Using status for both params
      estimatedValue: Number(t.valuation || t.revenue || 0),
      fitScore: t.aiScore ? Math.round(Number(t.aiScore) * 10) : 70,
      lastActivity: formatLastActivity(t.updatedAt),
      daysInStage: calculateDaysInStage(t.updatedAt),
    }));

    // Calculate stage metrics
    const stages: PipelineStage[] = ['SOURCING', 'SCREENING', 'EVALUATION', 'NEGOTIATION', 'EXECUTION'];
    const stageMetrics: StageMetrics[] = stages.map((stage) => {
      const stageTargets = pipelineTargets.filter((t) => t.stage === stage);
      return {
        stage,
        count: stageTargets.length,
        totalValue: stageTargets.reduce((sum, t) => sum + t.estimatedValue, 0),
      };
    });

    // Calculate total pipeline value
    const totalPipelineValue = pipelineTargets.reduce((sum, t) => sum + t.estimatedValue, 0);

    return {
      targets: pipelineTargets,
      stageMetrics,
      totalActiveTargets: pipelineTargets.length,
      totalPipelineValue,
      conversionRates: {
        sourcingToScreening: 45,
        screeningToEvaluation: 60,
        evaluationToNegotiation: 35,
        negotiationToExecution: 75,
      },
    };
  }, [targetsQuery.data]);

  // ============================================================================
  // DERIVED DATA: COMPLIANCE CALENDAR DATA (from filings)
  // ============================================================================

  const complianceData = useMemo(() => {
    if (!filingsQuery.data?.items) {
      return null;
    }

    const filings = filingsQuery.data.items;
    const today = new Date();

    // Transform filings to compliance deadlines
    const deadlines = filings
      .filter((f) => f.dueDate) // Only filings with deadlines
      .map((f) => {
        const dueDateValue = new Date(f.dueDate!);
        const daysUntilDue = Math.ceil((dueDateValue.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        // Determine status based on filing status and days until due
        let status: 'ON_TRACK' | 'DUE_SOON' | 'OVERDUE' | 'COMPLETED' = 'ON_TRACK';
        if (f.status === 'FILED' || f.status === 'EFFECTIVE') {
          status = 'COMPLETED';
        } else if (daysUntilDue < 0) {
          status = 'OVERDUE';
        } else if (daysUntilDue <= 7) {
          status = 'DUE_SOON';
        }

        // Determine priority based on days until due
        let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM';
        if (daysUntilDue < 0) {
          priority = 'CRITICAL';
        } else if (daysUntilDue <= 3) {
          priority = 'HIGH';
        } else if (daysUntilDue <= 14) {
          priority = 'MEDIUM';
        } else {
          priority = 'LOW';
        }

        // Map Filing type to ComplianceCalendar expected types
        const filingTypeMap: Record<string, '10-K' | '10-Q' | '8-K' | 'DEF14A' | 'S-1' | 'S-4' | 'PROXY' | '13F' | 'OTHER'> = {
          'FORM_10K': '10-K',
          'FORM_10Q': '10-Q',
          'FORM_8K': '8-K',
          'DEF14A': 'DEF14A',
          'FORM_S1': 'S-1',
          'FORM_S4': 'S-4',
          'PROXY': 'PROXY',
          'FORM_13F': '13F',
        };

        return {
          id: f.id,
          title: f.title || `${f.type} Filing`,
          filingType: filingTypeMap[f.type] || 'OTHER',
          dueDate: dueDateValue,
          status,
          description: f.description || `${f.type} filing`,
          spacName: f.spac?.name || undefined,
          priority,
        };
      })
      .slice(0, 10); // Limit to 10 deadlines

    // Calculate summary stats
    const upcomingCount = deadlines.filter((d) => d.status !== 'COMPLETED' && d.status !== 'OVERDUE').length;
    const overdueCount = deadlines.filter((d) => d.status === 'OVERDUE').length;
    const completedThisMonth = filings.filter((f) => {
      if (f.status !== 'FILED' && f.status !== 'EFFECTIVE') {
        return false;
      }
      const filedDate = f.filedDate ? new Date(f.filedDate) : null;
      if (!filedDate) {
        return false;
      }
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return filedDate >= monthStart;
    }).length;

    return {
      deadlines,
      upcomingCount,
      overdueCount,
      completedThisMonth,
    };
  }, [filingsQuery.data]);

  // ============================================================================
  // DERIVED DATA: QUICK STATS
  // ============================================================================

  const quickStats = useMemo(() => {
    const stats = spacStatsQuery.data;
    const targetCount = targetsQuery.data?.total || 0;
    const activeTargets = pipelineData?.totalActiveTargets || 0;

    // Calculate days to next deadline
    let daysToDeadline = 365;
    if (primarySpac?.deadlineDate) {
      const deadline = new Date(primarySpac.deadlineDate);
      const now = new Date();
      daysToDeadline = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return [
      {
        title: 'Total SPACs',
        value: stats?.total?.toString() || '0',
        icon: Building2,
        trend: stats?.active && stats.total > 1
          ? { value: Math.round((stats.active / stats.total) * 100), direction: 'up' as const, label: 'active' }
          : undefined,
        colorVariant: 'primary' as const,
        description: `${stats?.active || 0} active, ${stats?.byStatus?.COMPLETED || 0} completed`,
      },
      {
        title: 'Active Targets',
        value: activeTargets.toString(),
        icon: Target,
        trend: targetCount > 0
          ? { value: Math.round((activeTargets / Math.max(targetCount, 1)) * 100), direction: 'up' as const }
          : undefined,
        colorVariant: 'teal' as const,
        description: `${pipelineData?.stageMetrics.find(m => m.stage === 'NEGOTIATION')?.count || 0} in negotiation`,
      },
      {
        title: 'Pending Filings',
        value: (primarySpac?._count?.filings || 5).toString(),
        icon: FileText,
        trend: { value: 10, direction: 'down' as const, label: 'improving' },
        colorVariant: 'blue' as const,
        description: `Next due in ${Math.min(daysToDeadline, 30)} days`,
      },
      {
        title: 'Days to Deadline',
        value: daysToDeadline.toString(),
        icon: Clock,
        colorVariant: daysToDeadline <= 90 ? 'danger' as const : daysToDeadline <= 180 ? 'warning' as const : 'success' as const,
        description: 'Business combination deadline',
      },
    ];
  }, [spacStatsQuery.data, targetsQuery.data, pipelineData, primarySpac]);

  // ============================================================================
  // DERIVED DATA: UPCOMING DEADLINES FROM REAL DATA
  // ============================================================================

  const upcomingDeadlines = useMemo((): DeadlineItem[] => {
    const deadlines: DeadlineItem[] = [];

    // Add SPAC business combination deadlines
    if (spacsQuery.data?.items) {
      spacsQuery.data.items.forEach((spac) => {
        if (spac.deadlineDate) {
          const deadline = new Date(spac.deadlineDate);
          const now = new Date();
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Only show if deadline is within next 24 months or past due
          if (daysUntilDeadline <= 730 || daysUntilDeadline < 0) {
            let status: DeadlineItem['status'] = 'UPCOMING';
            if (daysUntilDeadline < 0) {
              status = 'OVERDUE';
            } else if (daysUntilDeadline <= 14) {
              status = 'DUE_SOON';
            }

            deadlines.push({
              id: `spac-deadline-${spac.id}`,
              title: `${spac.name} Business Combination Deadline`,
              type: 'BUSINESS_COMBINATION',
              dueDate: deadline,
              status,
              description: spac.ticker ? `Ticker: ${spac.ticker}` : undefined,
              relatedSpac: {
                id: spac.id,
                name: spac.name,
                href: `/spacs/${spac.id}`,
              },
              priority: daysUntilDeadline <= 90 ? 'critical' : daysUntilDeadline <= 180 ? 'high' : 'medium',
            });
          }
        }
      });
    }

    // Add target-related deadlines (due diligence, LOI dates, etc.)
    // Note: We only use fields that are returned by the list endpoint
    // The full Target model has more fields but they may not be in the list response
    if (targetsQuery.data?.items) {
      targetsQuery.data.items.forEach((target) => {
        // Cast to access additional fields that may be in the full model
        const fullTarget = target as typeof target & {
          expectedCloseDate?: Date | string | null;
          sector?: string | null;
          priority?: number;
        };

        // Expected close date as a deadline
        if (fullTarget.expectedCloseDate) {
          const closeDate = new Date(fullTarget.expectedCloseDate);
          const now = new Date();
          const daysUntilClose = Math.ceil((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          if (daysUntilClose > -30 && daysUntilClose <= 180) {
            let status: DeadlineItem['status'] = 'UPCOMING';
            if (daysUntilClose < 0) {
              status = 'OVERDUE';
            } else if (daysUntilClose <= 14) {
              status = 'DUE_SOON';
            }

            deadlines.push({
              id: `target-close-${target.id}`,
              title: `${target.name} Expected Close`,
              type: 'CONTRACT_DEADLINE',
              dueDate: closeDate,
              status,
              description: `Target in ${target.status?.replace(/_/g, ' ').toLowerCase() || 'evaluation'}`,
              priority: daysUntilClose <= 30 ? 'high' : 'medium',
            });
          }
        }
      });
    }

    // Sort by due date
    return deadlines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [spacsQuery.data, targetsQuery.data]);

  // ============================================================================
  // DERIVED DATA: RECENT ACTIVITY FROM REAL DATA
  // ============================================================================

  const recentActivities = useMemo((): ActivityItem[] => {
    const activities: ActivityItem[] = [];

    // Generate activities from recently updated SPACs
    if (spacsQuery.data?.items) {
      spacsQuery.data.items.slice(0, 3).forEach((spac) => {
        activities.push({
          id: `spac-update-${spac.id}`,
          type: 'DEAL_UPDATE',
          title: `${spac.name} status: ${spac.status?.replace(/_/g, ' ')}`,
          description: spac.ticker ? `Ticker: ${spac.ticker}` : 'SPAC updated',
          timestamp: spac.updatedAt,
          relatedItem: {
            type: 'spac',
            id: spac.id,
            name: spac.name,
            href: `/spacs/${spac.id}`,
          },
        });
      });
    }

    // Generate activities from recently updated targets
    if (targetsQuery.data?.items) {
      targetsQuery.data.items.slice(0, 5).forEach((target) => {
        // Cast to access additional fields that may be in the full model
        const fullTarget = target as typeof target & {
          sector?: string | null;
          priority?: number;
        };

        const isNew = new Date(target.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000;
        const targetPriority = fullTarget.priority ?? 5;

        activities.push({
          id: `target-${isNew ? 'add' : 'update'}-${target.id}`,
          type: isNew ? 'TARGET_ADDED' : 'TARGET_UPDATE',
          title: isNew
            ? `New target added: ${target.name}`
            : `${target.name} moved to ${target.status?.replace(/_/g, ' ')}`,
          description: target.industry || fullTarget.sector || 'Target company',
          timestamp: target.updatedAt,
          relatedItem: {
            type: 'target',
            id: target.id,
            name: target.name,
            href: `/targets/${target.id}`,
          },
          isNew,
          priority: targetPriority <= 2 ? 'high' : undefined,
        });
      });
    }

    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [spacsQuery.data, targetsQuery.data]);

  // ============================================================================
  // DERIVED DATA: PIPELINE CHART DATA (for PipelineChart component)
  // ============================================================================

  const pipelineChartData = useMemo((): PipelineStageData[] => {
    if (!targetsQuery.data?.items) {return [];}

    const targets = targetsQuery.data.items;

    // Initialize all stages with zero counts
    const stageMap: Record<DealStage, { count: number; value: number; deals: Array<{ id: string; name: string; value: number }> }> = {
      ORIGINATION: { count: 0, value: 0, deals: [] },
      PRELIMINARY_REVIEW: { count: 0, value: 0, deals: [] },
      DEEP_DIVE: { count: 0, value: 0, deals: [] },
      NEGOTIATION: { count: 0, value: 0, deals: [] },
      DOCUMENTATION: { count: 0, value: 0, deals: [] },
      CLOSING: { count: 0, value: 0, deals: [] },
      TERMINATED: { count: 0, value: 0, deals: [] },
    };

    // Aggregate targets by deal stage
    targets.forEach((target) => {
      const dealStage = mapTargetStatusToDealStage(target.status);
      const targetValue = Number(target.valuation || target.revenue || 0);

      stageMap[dealStage].count += 1;
      stageMap[dealStage].value += targetValue;
      stageMap[dealStage].deals.push({
        id: target.id,
        name: target.name,
        value: targetValue,
      });
    });

    // Convert to array format expected by PipelineChart
    return (Object.entries(stageMap) as [DealStage, typeof stageMap[DealStage]][]).map(([stage, data]) => ({
      stage,
      count: data.count,
      value: data.value,
      deals: data.deals,
    }));
  }, [targetsQuery.data]);

  // ============================================================================
  // DERIVED DATA: NEXT SPAC DEADLINE (for DeadlineCountdown)
  // ============================================================================

  const nextSpacDeadline = useMemo(() => {
    if (!primarySpac || !primarySpac.deadlineDate) {return null;}

    const deadlineDate = new Date(primarySpac.deadlineDate);

    return {
      id: primarySpac.id,
      title: 'Business Combination Deadline',
      description: `Complete business combination for ${primarySpac.name}`,
      deadlineDate,
      type: 'business_combination' as const,
      spacName: primarySpac.name,
      spacTicker: primarySpac.ticker || undefined,
      isCompleted: primarySpac.status === 'COMPLETED' || primarySpac.status === 'LIQUIDATED',
      extensionsRemaining: 2, // Placeholder - would come from SPAC data
      extensionMonths: 3, // Placeholder - typical extension period
    };
  }, [primarySpac]);

  // ============================================================================
  // DERIVED DATA: DEAL SUMMARY
  // ============================================================================

  const dealSummary = useMemo(() => {
    if (!pipelineData || pipelineData.targets.length === 0) {
      return {
        totalPipeline: '$0',
        leadTargetValue: '$0',
        avgFitScore: '0%',
        daysInNegotiation: 0,
        leadTarget: null,
      };
    }

    const formatValue = (value: number) => {
      if (value >= 1000000000) {return `$${(value / 1000000000).toFixed(2)}B`;}
      if (value >= 1000000) {return `$${(value / 1000000).toFixed(0)}M`;}
      if (value >= 1000) {return `$${(value / 1000).toFixed(0)}K`;}
      return `$${value.toFixed(0)}`;
    };

    const sortedByScore = [...pipelineData.targets].sort((a, b) => b.fitScore - a.fitScore);
    const leadTarget = sortedByScore[0];

    const avgScore = pipelineData.targets.reduce((sum, t) => sum + t.fitScore, 0) / pipelineData.targets.length;

    return {
      totalPipeline: formatValue(pipelineData.totalPipelineValue),
      leadTargetValue: formatValue(leadTarget?.estimatedValue || 0),
      avgFitScore: `${Math.round(avgScore)}%`,
      daysInNegotiation: leadTarget?.daysInStage || 0,
      leadTarget: leadTarget
        ? {
            name: leadTarget.name,
            sector: leadTarget.sector,
            stage: leadTarget.stage,
            fitScore: leadTarget.fitScore,
          }
        : null,
    };
  }, [pipelineData]);

  // ============================================================================
  // DERIVED DATA: TEAM OVERVIEW
  // ============================================================================

  const teamOverview = useMemo(() => ({
    totalMembers: 8, // Keep hardcoded for now (no team API)
    activeTasks: primarySpac?._count?.tasks || 0,
    actionsThisMonth: recentActivities.length,
    taskCompletion: 85, // Placeholder
    recentContributors: recentActivities.slice(0, 5).map(a => a.user?.name || 'System'),
  }), [primarySpac, recentActivities]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {return 'Good morning';}
    if (hour < 18) {return 'Good afternoon';}
    return 'Good evening';
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleViewSpacDetails = () => {
    // TODO: Navigate to SPAC details
  };

  const handleViewPipeline = () => {
    // TODO: Navigate to pipeline
  };

  const handleTargetClick = (_targetId: string) => {
    // TODO: Navigate to target
  };

  const handleViewCalendar = () => {
    // TODO: Navigate to compliance calendar
  };

  const handleDeadlineClick = (_deadlineId: string) => {
    // TODO: Navigate to deadline
  };

  const handleViewAllActivity = () => {
    // TODO: Navigate to activity feed
  };

  const handleActivityClick = (_activityId: string) => {
    // TODO: Navigate to activity
  };

  // AI Insights handlers - commented out until AI insights endpoint is available
  // const handleViewAllInsights = () => {
  //   // TODO: Navigate to AI insights
  // };

  // const handleInsightAction = (_insightId: string, _action: 'acknowledge' | 'dismiss' | 'resolve') => {
  //   // TODO: Handle insight action
  // };

  // const handleRefreshInsights = () => {
  //   // TODO: Refresh AI insights
  // };

  const handleRecentActivityClick = (_activity: any) => {
    // TODO: Navigate to activity
  };

  const handleViewAllRecentActivity = () => {
    // TODO: View all recent activity
  };

  const handleUpcomingDeadlineClick = (_deadline: any) => {
    // TODO: Navigate to deadline
  };

  const handleViewAllDeadlines = () => {
    // TODO: View all deadlines
  };

  // ============================================================================
  // LOADING AND ERROR STATE HELPERS
  // ============================================================================

  const isLoadingStats = spacStatsQuery.isLoading;
  const isLoadingSpacs = spacsQuery.isLoading;
  const isLoadingTargets = targetsQuery.isLoading;

  const isRefetchingStats = spacStatsQuery.isFetching && !spacStatsQuery.isLoading;
  const isRefetchingSpacs = spacsQuery.isFetching && !spacsQuery.isLoading;
  const isRefetchingTargets = targetsQuery.isFetching && !targetsQuery.isLoading;

  const hasStatsError = spacStatsQuery.isError;
  const hasSpacError = spacsQuery.isError;
  const hasTargetError = targetsQuery.isError;
  const hasAnyError = hasStatsError || hasSpacError || hasTargetError;

  // Determine if we have enough data to show the dashboard
  const _hasSpacData = spacsQuery.data?.items && spacsQuery.data.items.length > 0;
  const _hasTargetData = targetsQuery.data?.items && targetsQuery.data.items.length > 0;
  const hasDeadlines = upcomingDeadlines.length > 0;
  const hasRecentActivity = recentActivities.length > 0;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Global Error Banner */}
      {hasAnyError && (
        <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-danger-500" />
              <div>
                <p className="text-sm font-medium text-danger-800">
                  Some dashboard data failed to load
                </p>
                <p className="text-xs text-danger-600">
                  {[
                    hasStatsError && 'Statistics',
                    hasSpacError && 'SPAC data',
                    hasTargetError && 'Target data',
                  ]
                    .filter(Boolean)
                    .join(', ')}{' '}
                  could not be retrieved
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRetryAll}
              disabled={isRefetchingStats || isRefetchingSpacs || isRefetchingTargets}
              className="border-danger-200 text-danger-700 hover:bg-danger-100"
            >
              {isRefetchingStats || isRefetchingSpacs || isRefetchingTargets ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry All
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="page-header">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="page-title">
              {getGreeting()}, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="page-description">
              {primarySpac
                ? `Welcome to SPAC OS - ${primarySpac.name} | ${primarySpac.ticker || 'No Ticker'} | ${primarySpac.trustAmount ? `$${(Number(primarySpac.trustAmount) / 1000000).toFixed(0)}M IPO` : 'Trust TBD'}`
                : 'Welcome to SPAC OS - Your SPAC Management Platform'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {primarySpac && (
              <>
                <Badge variant="success" size="lg">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-success-500 animate-pulse" />
                  {primarySpac.status === 'SEARCHING' ? 'Active' : primarySpac.status.replace(/_/g, ' ')}
                </Badge>
                <Badge variant="secondary" size="lg">
                  {primarySpac.status === 'SEARCHING'
                    ? 'Target Search Phase'
                    : primarySpac.status === 'LOI_SIGNED'
                      ? 'LOI Phase'
                      : primarySpac.status === 'DA_ANNOUNCED'
                        ? 'DA Phase'
                        : primarySpac.status.replace(/_/g, ' ')}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={defaultQuickActions}
        title="Quick Actions"
        layout="grid"
        columns={4}
      />

      {/* Quick Stats Row */}
      <StatsCardGroup columns={4}>
        {isLoadingStats || isLoadingSpacs || isLoadingTargets ? (
          // Loading skeleton for stats
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : hasStatsError ? (
          // Error state for stats
          <div className="col-span-4">
            <ErrorCard
              title="Failed to load statistics"
              message={spacStatsQuery.error?.message || 'Unable to retrieve dashboard statistics'}
              onRetry={handleRetryStats}
              isRetrying={isRefetchingStats}
            />
          </div>
        ) : (
          // Loaded stats
          quickStats.map((stat) => (
            <StatsCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              colorVariant={stat.colorVariant}
              description={stat.description}
            />
          ))
        )}
      </StatsCardGroup>

      {/* Main Content Grid - 3 columns on large screens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - SPAC Status and Trust Account */}
        <div className="space-y-6 lg:col-span-1">
          {hasSpacError ? (
            <ErrorCard
              title="Failed to load SPAC status"
              message={spacsQuery.error?.message || 'Unable to retrieve SPAC information'}
              onRetry={handleRetrySpacs}
              isRetrying={isRefetchingSpacs}
            />
          ) : (
            <SpacStatusCard
              data={spacStatusData}
              isLoading={isLoadingSpacs}
              onViewDetails={handleViewSpacDetails}
            />
          )}
          {hasSpacError ? (
            <ErrorCard
              title="Failed to load trust data"
              message={spacsQuery.error?.message || 'Unable to retrieve trust account information'}
              onRetry={handleRetrySpacs}
              isRetrying={isRefetchingSpacs}
            />
          ) : (
            <TrustAccountWidget
              data={trustAccountData}
              isLoading={isLoadingSpacs}
              showInterestAccrual={true}
              showMiniChart={true}
              error={null}
              onRefresh={handleRetrySpacs}
            />
          )}
        </div>

        {/* Middle Column - Deal Pipeline and Upcoming Deadlines */}
        <div className="space-y-6 lg:col-span-1">
          {hasTargetError ? (
            <ErrorCard
              title="Failed to load pipeline"
              message={targetsQuery.error?.message || 'Unable to retrieve target pipeline'}
              onRetry={handleRetryTargets}
              isRetrying={isRefetchingTargets}
            />
          ) : (
            <DealPipelineWidget
              data={pipelineData}
              isLoading={isLoadingTargets}
              onViewPipeline={handleViewPipeline}
              onTargetClick={handleTargetClick}
            />
          )}
          {hasSpacError && hasTargetError ? (
            <ErrorCard
              title="Failed to load deadlines"
              message="Unable to retrieve deadline information"
              onRetry={handleRetryAll}
              isRetrying={isRefetchingSpacs || isRefetchingTargets}
            />
          ) : (
            <UpcomingDeadlines
              deadlines={hasDeadlines ? upcomingDeadlines : undefined}
              isLoading={isLoadingSpacs || isLoadingTargets}
              maxItems={4}
              onViewAll={handleViewAllDeadlines}
              onDeadlineClick={handleUpcomingDeadlineClick}
            />
          )}
        </div>

        {/* Right Column - Recent Activity and Compliance */}
        <div className="space-y-6 lg:col-span-1">
          {hasSpacError && hasTargetError ? (
            <ErrorCard
              title="Failed to load activity"
              message="Unable to retrieve recent activity"
              onRetry={handleRetryAll}
              isRetrying={isRefetchingSpacs || isRefetchingTargets}
            />
          ) : (
            <RecentActivity
              activities={hasRecentActivity ? recentActivities : undefined}
              isLoading={isLoadingSpacs || isLoadingTargets}
              maxItems={5}
              onViewAll={handleViewAllRecentActivity}
              onActivityClick={handleRecentActivityClick}
            />
          )}
          <ComplianceCalendarWidget
            data={complianceData}
            isLoading={filingsQuery.isLoading}
            onViewCalendar={handleViewCalendar}
            onDeadlineClick={handleDeadlineClick}
          />
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* AI Insights - Placeholder until AI insights endpoint is available */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary-600" />
              AI Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
              <div className="text-center">
                <AlertCircle className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-600">
                  AI Insights coming soon
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Intelligent analysis and recommendations will be displayed here
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <ActivityFeed
          data={{
            activities: recentActivities.slice(0, 5).map(activity => ({
              id: activity.id,
              type: activity.type === 'TARGET_ADDED' ? 'TARGET_UPDATE' as const
                : activity.type === 'TARGET_UPDATE' ? 'TARGET_UPDATE' as const
                : activity.type === 'DOCUMENT_UPLOAD' ? 'DOCUMENT_UPLOAD' as const
                : 'COMMENT' as const, // Default to COMMENT for DEAL_UPDATE and others
              user: {
                name: activity.user?.name || currentUser.name,
                role: currentUser.role,
              },
              action: activity.title,
              subject: activity.relatedItem?.name || activity.description || '',
              subjectLink: activity.relatedItem?.href,
              timestamp: activity.timestamp,
              isNew: activity.isNew,
            })),
            hasMore: recentActivities.length > 5,
            totalCount: recentActivities.length,
          }}
          onViewAll={handleViewAllActivity}
          onActivityClick={handleActivityClick}
          maxItems={5}
          showFilters={true}
        />
      </div>

      {/* Bottom Section - Full Width Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Deal Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary-600" />
              Deal Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingTargets ? (
              <div className="animate-pulse space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-lg bg-slate-100 p-4 h-20" />
                  ))}
                </div>
                <div className="h-20 rounded-lg bg-slate-100" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{dealSummary.totalPipeline}</p>
                    <p className="text-xs text-slate-500">Total Pipeline</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{dealSummary.leadTargetValue}</p>
                    <p className="text-xs text-slate-500">Lead Target Value</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{dealSummary.avgFitScore}</p>
                    <p className="text-xs text-slate-500">Avg Fit Score</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4 text-center">
                    <p className="text-2xl font-bold text-slate-900">{dealSummary.daysInNegotiation}</p>
                    <p className="text-xs text-slate-500">Days in Negotiation</p>
                  </div>
                </div>

                {dealSummary.leadTarget && (
                  <div className="mt-4 rounded-lg border border-primary-100 bg-primary-50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-primary-900">
                          Lead Target: {dealSummary.leadTarget.name}
                        </p>
                        <p className="text-xs text-primary-700">
                          {dealSummary.leadTarget.sector} | {dealSummary.leadTarget.stage} Stage | {dealSummary.leadTarget.fitScore}% Fit Score
                        </p>
                      </div>
                      <Badge variant="primary">Active Discussions</Badge>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Team Overview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Team Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{teamOverview.totalMembers}</p>
                <p className="text-xs text-slate-500">Team Members</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{teamOverview.activeTasks}</p>
                <p className="text-xs text-slate-500">Active Tasks</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{teamOverview.actionsThisMonth}</p>
                <p className="text-xs text-slate-500">Actions This Month</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-2xl font-bold text-slate-900">{teamOverview.taskCompletion}%</p>
                <p className="text-xs text-slate-500">Task Completion</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700">Recent Contributors</p>
              <div className="flex flex-wrap gap-2">
                {teamOverview.recentContributors.map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-semibold text-white">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-slate-700">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Overview with PipelineChart */}
      {hasTargetError ? (
        <ErrorCard
          title="Failed to load pipeline chart"
          message={targetsQuery.error?.message || 'Unable to retrieve pipeline data'}
          onRetry={handleRetryTargets}
          isRetrying={isRefetchingTargets}
        />
      ) : (
        <PipelineChart
          data={pipelineChartData}
          variant="bar"
          title="Pipeline Overview"
          showValue={true}
          showCount={true}
          showConversionRates={false}
          isLoading={isLoadingTargets}
          error={null}
        />
      )}

      {/* SPAC Deadline Countdown */}
      {nextSpacDeadline && !hasSpacError && (
        <DeadlineCountdown
          deadline={nextSpacDeadline}
          showExtensionOption={true}
          warningDays={90}
          criticalDays={30}
          onViewDetails={() => {
            if (primarySpac?.id) {
              window.location.href = `/spacs/${primarySpac.id}`;
            }
          }}
        />
      )}
    </div>
  );
}
