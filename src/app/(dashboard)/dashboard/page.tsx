'use client';

import { useMemo } from 'react';
import {
  Building2,
  Target,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { trpc } from '@/lib/trpc';

// Import dashboard widgets
import {
  SpacStatusCard,
  mockSpacStatusData,
} from '@/components/dashboard/SpacStatusCard';
import {
  TrustAccountWidget,
  mockTrustAccountData,
} from '@/components/dashboard/TrustAccountWidget';
import {
  DealPipelineWidget,
} from '@/components/dashboard/DealPipelineWidget';
import {
  ComplianceCalendarWidget,
  mockComplianceData,
} from '@/components/dashboard/ComplianceCalendarWidget';
import {
  ActivityFeed,
  mockActivityData,
} from '@/components/dashboard/ActivityFeed';
import {
  AIInsightsWidget,
  mockAIInsightsData,
} from '@/components/dashboard/AIInsightsWidget';

// Import new dashboard components
import {
  StatsCard,
  StatsCardGroup,
  StatsCardSkeleton,
} from '@/components/dashboard/StatsCard';
import {
  RecentActivity,
  mockRecentActivities,
} from '@/components/dashboard/RecentActivity';
import {
  UpcomingDeadlines,
  mockUpcomingDeadlines,
} from '@/components/dashboard/UpcomingDeadlines';
import {
  QuickActions,
  defaultQuickActions,
} from '@/components/dashboard/QuickActions';

// ============================================================================
// TYPES FOR PIPELINE DATA TRANSFORMATION
// ============================================================================

type PipelineStage = 'SOURCING' | 'SCREENING' | 'EVALUATION' | 'NEGOTIATION' | 'EXECUTION';

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

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
}

// ============================================================================
// MOCK USER DATA (would come from auth in production)
// ============================================================================

const currentUser = {
  name: 'Sarah Chen',
  role: 'Deal Lead',
  avatar: undefined,
};

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================

function ErrorCard({ title, message, onRetry }: { title: string; message: string; onRetry?: () => void }) {
  return (
    <Card className="border-danger-200">
      <CardContent className="flex flex-col items-center justify-center py-8">
        <AlertCircle className="h-10 w-10 text-danger-400" />
        <p className="mt-3 text-sm font-medium text-danger-700">{title}</p>
        <p className="mt-1 text-xs text-danger-500">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 rounded-lg bg-danger-100 px-4 py-2 text-sm font-medium text-danger-700 hover:bg-danger-200"
          >
            Retry
          </button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  // ============================================================================
  // tRPC QUERIES
  // ============================================================================

  // Fetch SPAC stats for quick stats cards
  const spacStatsQuery = trpc.spac.getStats.useQuery();

  // Fetch SPACs list for SPAC status card and trust account
  const spacsQuery = trpc.spac.list.useQuery({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  // Fetch targets for pipeline widget
  const targetsQuery = trpc.target.list.useQuery({
    page: 1,
    pageSize: 50,
    sortBy: 'priority',
    sortOrder: 'asc',
  });

  // ============================================================================
  // DERIVED DATA: PRIMARY SPAC
  // ============================================================================

  const primarySpac = useMemo(() => {
    if (!spacsQuery.data?.items?.length) return null;
    // Return the first active SPAC (not liquidated or completed)
    return spacsQuery.data.items.find(
      (s) => s.status !== 'LIQUIDATED' && s.status !== 'DE_SPAC_COMPLETE'
    ) || spacsQuery.data.items[0];
  }, [spacsQuery.data]);

  // ============================================================================
  // DERIVED DATA: SPAC STATUS CARD DATA
  // ============================================================================

  const spacStatusData = useMemo(() => {
    if (!primarySpac) return null;

    // Map SPAC status to phase
    const statusToPhase: Record<string, 'FORMATION' | 'PRE_IPO' | 'IPO' | 'TARGET_SEARCH' | 'DE_SPAC' | 'POST_MERGER'> = {
      'PRE_IPO': 'PRE_IPO',
      'SEARCHING': 'TARGET_SEARCH',
      'LOI_SIGNED': 'DE_SPAC',
      'DEFINITIVE_AGREEMENT': 'DE_SPAC',
      'VOTE_PENDING': 'DE_SPAC',
      'DE_SPAC_COMPLETE': 'POST_MERGER',
      'LIQUIDATED': 'POST_MERGER',
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
      milestones: mockSpacStatusData.milestones, // Use mock milestones for now
    };
  }, [primarySpac]);

  // ============================================================================
  // DERIVED DATA: TRUST ACCOUNT DATA
  // ============================================================================

  const trustAccountData = useMemo(() => {
    if (!primarySpac) return null;

    // Convert Decimal to number (Prisma Decimal fields need explicit conversion)
    const trustAmount = primarySpac.trustAmount ? Number(primarySpac.trustAmount) : 0;
    const sharesOutstanding = trustAmount > 0 ? Math.floor(trustAmount / 10) : 25300000;

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
      balanceHistory: mockTrustAccountData.balanceHistory, // Use mock history for visualization
    };
  }, [primarySpac]);

  // ============================================================================
  // DERIVED DATA: DEAL PIPELINE DATA
  // ============================================================================

  const pipelineData = useMemo((): DealPipelineData | null => {
    if (!targetsQuery.data?.items) return null;

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
        description: `${stats?.active || 0} active, ${stats?.byStatus?.DE_SPAC_COMPLETE || 0} completed`,
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
      if (value >= 1000000000) return `$${(value / 1000000000).toFixed(2)}B`;
      if (value >= 1000000) return `$${(value / 1000000).toFixed(0)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
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
    totalMembers: 8, // Would come from team API
    activeTasks: primarySpac?._count?.tasks || 23,
    actionsThisMonth: 156, // Would come from activity API
    taskCompletion: 94, // Would come from task API
    recentContributors: [
      'Sarah Chen',
      'Michael Ross',
      'Emily Park',
      'David Kim',
      'Jessica Liu',
    ],
  }), [primarySpac]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
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

  const handleTargetClick = (targetId: string) => {
    // TODO: Navigate to target
  };

  const handleViewCalendar = () => {
    // TODO: Navigate to compliance calendar
  };

  const handleDeadlineClick = (deadlineId: string) => {
    // TODO: Navigate to deadline
  };

  const handleViewAllActivity = () => {
    // TODO: Navigate to activity feed
  };

  const handleActivityClick = (activityId: string) => {
    // TODO: Navigate to activity
  };

  const handleViewAllInsights = () => {
    // TODO: Navigate to AI insights
  };

  const handleInsightAction = (insightId: string, action: 'acknowledge' | 'dismiss' | 'resolve') => {
    // TODO: Handle insight action
  };

  const handleRefreshInsights = () => {
    // TODO: Refresh AI insights
  };

  const handleRecentActivityClick = (activity: any) => {
    // TODO: Navigate to activity
  };

  const handleViewAllRecentActivity = () => {
    // TODO: View all recent activity
  };

  const handleUpcomingDeadlineClick = (deadline: any) => {
    // TODO: Navigate to deadline
  };

  const handleViewAllDeadlines = () => {
    // TODO: View all deadlines
  };

  // ============================================================================
  // LOADING STATE HELPERS
  // ============================================================================

  const isLoadingStats = spacStatsQuery.isLoading;
  const isLoadingSpacs = spacsQuery.isLoading;
  const isLoadingTargets = targetsQuery.isLoading;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
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
                      : primarySpac.status === 'DEFINITIVE_AGREEMENT'
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
        {isLoadingStats || isLoadingSpacs ? (
          // Loading skeleton for stats
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : spacStatsQuery.isError ? (
          // Error state
          <div className="col-span-4">
            <ErrorCard
              title="Failed to load statistics"
              message={spacStatsQuery.error?.message || 'An error occurred'}
              onRetry={() => spacStatsQuery.refetch()}
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
          <SpacStatusCard
            data={spacStatusData}
            isLoading={isLoadingSpacs}
            onViewDetails={handleViewSpacDetails}
          />
          <TrustAccountWidget
            data={trustAccountData}
            isLoading={isLoadingSpacs}
            showInterestAccrual={true}
            showMiniChart={true}
            error={spacsQuery.isError ? spacsQuery.error?.message : null}
            onRefresh={() => spacsQuery.refetch()}
          />
        </div>

        {/* Middle Column - Deal Pipeline and Upcoming Deadlines */}
        <div className="space-y-6 lg:col-span-1">
          <DealPipelineWidget
            data={pipelineData}
            isLoading={isLoadingTargets}
            onViewPipeline={handleViewPipeline}
            onTargetClick={handleTargetClick}
          />
          <UpcomingDeadlines
            deadlines={mockUpcomingDeadlines}
            maxItems={4}
            onViewAll={handleViewAllDeadlines}
            onDeadlineClick={handleUpcomingDeadlineClick}
          />
        </div>

        {/* Right Column - Recent Activity and Compliance */}
        <div className="space-y-6 lg:col-span-1">
          <RecentActivity
            activities={mockRecentActivities}
            maxItems={5}
            onViewAll={handleViewAllRecentActivity}
            onActivityClick={handleRecentActivityClick}
          />
          <ComplianceCalendarWidget
            data={mockComplianceData}
            onViewCalendar={handleViewCalendar}
            onDeadlineClick={handleDeadlineClick}
          />
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <AIInsightsWidget
          data={mockAIInsightsData}
          onViewAll={handleViewAllInsights}
          onInsightAction={handleInsightAction}
          onRefresh={handleRefreshInsights}
        />
        <ActivityFeed
          data={mockActivityData}
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

      {/* Pipeline Overview Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            Pipeline Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
            <div className="text-center">
              <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm font-medium text-slate-600">
                Pipeline Chart Visualization
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Full pipeline funnel chart will be displayed here
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
