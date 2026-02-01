'use client';

import { useState } from 'react';
import {
  Building2,
  Target,
  FileText,
  Clock,
  TrendingUp,
  DollarSign,
  Users,
  BarChart3,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
  mockPipelineData,
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
// MOCK USER DATA
// ============================================================================

const currentUser = {
  name: 'Sarah Chen',
  role: 'Deal Lead',
  avatar: undefined,
};

// ============================================================================
// QUICK STATS DATA
// ============================================================================

const quickStats = [
  {
    title: 'Total SPACs',
    value: '3',
    icon: Building2,
    trend: { value: 50, direction: 'up' as const, label: 'vs last quarter' },
    colorVariant: 'primary' as const,
    description: '2 active, 1 in IPO phase',
  },
  {
    title: 'Active Targets',
    value: '6',
    icon: Target,
    trend: { value: 20, direction: 'up' as const },
    colorVariant: 'teal' as const,
    description: '2 in negotiation stage',
  },
  {
    title: 'Pending Filings',
    value: '5',
    icon: FileText,
    trend: { value: 10, direction: 'down' as const, label: 'improving' },
    colorVariant: 'blue' as const,
    description: 'Next due in 14 days',
  },
  {
    title: 'Days to Next Deadline',
    value: '14',
    icon: Clock,
    colorVariant: 'warning' as const,
    description: 'Form 10-K Annual Report',
  },
];

// ============================================================================
// DEAL SUMMARY DATA
// ============================================================================

const dealSummary = {
  totalPipeline: '$2.03B',
  leadTargetValue: '$420M',
  avgFitScore: '85%',
  daysInNegotiation: 14,
  leadTarget: {
    name: 'MedTech Innovations',
    sector: 'Medical Devices',
    stage: 'Negotiation',
    fitScore: 92,
  },
};

// ============================================================================
// TEAM OVERVIEW DATA
// ============================================================================

const teamOverview = {
  totalMembers: 8,
  activeTasks: 23,
  actionsThisMonth: 156,
  taskCompletion: 94,
  recentContributors: [
    'Sarah Chen',
    'Michael Ross',
    'Emily Park',
    'David Kim',
    'Jessica Liu',
  ],
};

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  // Get current time greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Handlers for widget actions - TODO: Implement navigation
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
              Welcome to SPAC OS - Soren Acquisition Corporation | Healthcare SPAC | $253M IPO
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success" size="lg">
              <span className="mr-1.5 h-2 w-2 rounded-full bg-success-500 animate-pulse" />
              Active
            </Badge>
            <Badge variant="secondary" size="lg">
              Target Search Phase
            </Badge>
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
        {quickStats.map((stat) => (
          <StatsCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            colorVariant={stat.colorVariant}
            description={stat.description}
          />
        ))}
      </StatsCardGroup>

      {/* Main Content Grid - 3 columns on large screens */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - SPAC Status and Trust Account */}
        <div className="space-y-6 lg:col-span-1">
          <SpacStatusCard
            data={mockSpacStatusData}
            onViewDetails={handleViewSpacDetails}
          />
          <TrustAccountWidget
            data={mockTrustAccountData}
            showInterestAccrual={true}
            showMiniChart={true}
          />
        </div>

        {/* Middle Column - Deal Pipeline and Upcoming Deadlines */}
        <div className="space-y-6 lg:col-span-1">
          <DealPipelineWidget
            data={mockPipelineData}
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
