// ============================================================================
// SPAC OS Dashboard Components
// ============================================================================

// MetricsCard - Key metrics display with trends
export {
  MetricsCard,
  MetricsCardSkeleton,
  MetricsCardGroup,
  CurrencyMetricsCard,
  PercentMetricsCard,
  CountMetricsCard,
} from './MetricsCard';

// SpacStatusCard - Main SPAC status widget with phase tracking
export {
  SpacStatusCard,
  mockSpacStatusData,
} from './SpacStatusCard';

// TrustAccountWidget - Real-time trust balance with interest accrual and mini chart
export {
  TrustAccountWidget,
  TrustAccountCompact,
  mockTrustAccountData,
} from './TrustAccountWidget';

// DealPipelineWidget - Pipeline summary with funnel visualization
export {
  DealPipelineWidget,
  mockPipelineData,
} from './DealPipelineWidget';

// ComplianceCalendarWidget - Upcoming deadlines with status indicators
export {
  ComplianceCalendarWidget,
  mockComplianceData,
} from './ComplianceCalendarWidget';

// ActivityFeed - Recent team activity log
export {
  ActivityFeed,
  mockActivityData,
} from './ActivityFeed';

// AIInsightsWidget - AI-powered insights and market intelligence
export {
  AIInsightsWidget,
  mockAIInsightsData,
} from './AIInsightsWidget';

// DeadlineCountdown - Business combination deadline tracker
export {
  DeadlineCountdown,
  DeadlineList,
  DeadlineCompactWidget,
} from './DeadlineCountdown';

// PipelineChart - Deal pipeline visualization using Recharts
export { PipelineChart, PipelineCompact, PipelineMiniFunnel } from './PipelineChart';

// RecentActivityFeed - Activity stream with filtering
export {
  RecentActivityFeed,
  ActivityCompact,
  ActivityTimeline,
} from './RecentActivityFeed';

// ComplianceCalendar - Upcoming filings and deadlines
export { ComplianceCalendar, ComplianceCompact } from './ComplianceCalendar';

// DilutionWaterfall - Dilution analysis chart
export {
  DilutionWaterfall,
  DilutionTable,
  DilutionIndicator,
} from './DilutionWaterfall';

// RedemptionScenarios - Redemption modeling (0%, 25%, 50%, 75%, 90%)
export { RedemptionScenarios, RedemptionSummary } from './RedemptionScenarios';

// StatsCard - Statistics card with icon, value, and trend indicator
export {
  StatsCard,
  StatsCardSkeleton,
  StatsCardGroup,
  QuickStat,
} from './StatsCard';

// RecentActivity - Activity feed with type icons and timestamps
export {
  RecentActivity,
  mockRecentActivities,
  type ActivityItem,
  type ActivityType,
} from './RecentActivity';

// UpcomingDeadlines - Deadlines widget with days remaining
export {
  UpcomingDeadlines,
  mockUpcomingDeadlines,
  type DeadlineItem,
} from './UpcomingDeadlines';

// QuickActions - Quick action buttons for common tasks
export {
  QuickActions,
  CompactQuickActions,
  defaultQuickActions,
  extendedQuickActions,
  type QuickAction,
} from './QuickActions';
