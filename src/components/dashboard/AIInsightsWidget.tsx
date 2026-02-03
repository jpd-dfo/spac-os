'use client';

import { useState, useMemo } from 'react';

import {
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  BarChart3,
  Shield,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatRelativeTime } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type InsightType = 'ALERT' | 'OPPORTUNITY' | 'RISK' | 'RECOMMENDATION' | 'MARKET';
type InsightPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type InsightStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  description: string;
  source?: string;
  action?: {
    label: string;
    href?: string;
  };
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  timestamp: Date | string;
  confidence: number; // 0-100
}

interface MarketIntelligence {
  id: string;
  headline: string;
  summary: string;
  relevance: number; // 0-100
  source: string;
  timestamp: Date | string;
  tags: string[];
}

interface AIInsightsData {
  insights: AIInsight[];
  marketIntelligence: MarketIntelligence[];
  lastUpdated: Date | string;
  aiStatus: 'ACTIVE' | 'PROCESSING' | 'OFFLINE';
}

interface AIInsightsWidgetProps {
  data?: AIInsightsData | null;
  isLoading?: boolean;
  className?: string;
  onViewAll?: () => void;
  onInsightAction?: (insightId: string, action: 'acknowledge' | 'dismiss' | 'resolve') => void;
  onRefresh?: () => void;
}

// ============================================================================
// MOCK DATA FOR SOREN ACQUISITION CORPORATION
// ============================================================================

export const mockAIInsightsData: AIInsightsData = {
  insights: [
    {
      id: 'insight-001',
      type: 'ALERT',
      priority: 'HIGH',
      status: 'NEW',
      title: 'Potential Target Valuation Discrepancy',
      description: 'MedTech Innovations latest funding round suggests a 15% higher valuation than our current model. Consider updating financial projections.',
      source: 'AI Valuation Analysis',
      action: { label: 'Review Model', href: '/pipeline/medtech-innovations' },
      metrics: [
        { label: 'Current Estimate', value: '$420M', trend: 'neutral' },
        { label: 'Implied Value', value: '$483M', trend: 'up' },
      ],
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      confidence: 87,
    },
    {
      id: 'insight-002',
      type: 'RISK',
      priority: 'MEDIUM',
      status: 'NEW',
      title: 'Regulatory Filing Deadline Approaching',
      description: 'Form 10-K due in 16 days. Historical average preparation time is 18 days. Consider prioritizing this task.',
      source: 'Compliance Monitor',
      action: { label: 'View Filing', href: '/compliance' },
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      confidence: 95,
    },
    {
      id: 'insight-003',
      type: 'OPPORTUNITY',
      priority: 'MEDIUM',
      status: 'NEW',
      title: 'Favorable Market Conditions for Healthcare SPACs',
      description: 'Healthcare SPAC redemption rates down 23% YoY. Current market sentiment favors healthcare sector deals.',
      source: 'Market Intelligence',
      metrics: [
        { label: 'Avg Redemption', value: '42%', trend: 'down' },
        { label: 'Sector Index', value: '+8.3%', trend: 'up' },
      ],
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      confidence: 82,
    },
    {
      id: 'insight-004',
      type: 'RECOMMENDATION',
      priority: 'LOW',
      status: 'ACKNOWLEDGED',
      title: 'Optimize Trust Account Interest',
      description: 'Current T-Bill rates suggest potential to increase trust yield by 0.3% through ladder restructuring.',
      source: 'Financial Optimizer',
      action: { label: 'View Options' },
      metrics: [
        { label: 'Current Yield', value: '4.5%', trend: 'neutral' },
        { label: 'Potential Yield', value: '4.8%', trend: 'up' },
      ],
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      confidence: 78,
    },
  ],
  marketIntelligence: [
    {
      id: 'market-001',
      headline: 'FDA Accelerates Digital Health Approvals',
      summary: 'New FDA guidance streamlines approval pathway for digital health devices, potentially benefiting several pipeline targets.',
      relevance: 92,
      source: 'FDA News',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      tags: ['Regulatory', 'Digital Health', 'FDA'],
    },
    {
      id: 'market-002',
      headline: 'Healthcare M&A Activity Surges in Q1 2026',
      summary: 'Healthcare sector sees 34% increase in M&A deal volume, with average valuations up 12% YoY.',
      relevance: 88,
      source: 'Industry Report',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      tags: ['M&A', 'Healthcare', 'Valuations'],
    },
    {
      id: 'market-003',
      headline: 'Competitor SPAC Announces Healthcare Target',
      summary: 'Apollo Healthcare Acquisition Corp announces LOI with diagnostics company at 12x revenue multiple.',
      relevance: 85,
      source: 'SEC Filing',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      tags: ['Competition', 'SPAC', 'Diagnostics'],
    },
  ],
  lastUpdated: new Date(),
  aiStatus: 'ACTIVE',
};

// ============================================================================
// INSIGHT TYPE CONFIGURATION
// ============================================================================

const insightTypeConfig: Record<InsightType, {
  icon: typeof Sparkles;
  color: string;
  bgColor: string;
  textColor: string;
  label: string;
}> = {
  ALERT: {
    icon: AlertTriangle,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    textColor: 'text-warning-700',
    label: 'Alert',
  },
  OPPORTUNITY: {
    icon: TrendingUp,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    textColor: 'text-success-700',
    label: 'Opportunity',
  },
  RISK: {
    icon: Shield,
    color: 'text-danger-600',
    bgColor: 'bg-danger-100',
    textColor: 'text-danger-700',
    label: 'Risk',
  },
  RECOMMENDATION: {
    icon: Lightbulb,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    textColor: 'text-primary-700',
    label: 'Recommendation',
  },
  MARKET: {
    icon: BarChart3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-700',
    label: 'Market',
  },
};

const priorityConfig: Record<InsightPriority, {
  color: string;
  bgColor: string;
}> = {
  LOW: { color: 'text-slate-600', bgColor: 'bg-slate-100' },
  MEDIUM: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  HIGH: { color: 'text-warning-600', bgColor: 'bg-warning-100' },
  CRITICAL: { color: 'text-danger-600', bgColor: 'bg-danger-100' },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function InsightCard({
  insight,
  onInsightAction,
}: {
  insight: AIInsight;
  onInsightAction?: (id: string, action: 'acknowledge' | 'dismiss' | 'resolve') => void;
}) {
  const config = insightTypeConfig[insight.type];
  const InsightIcon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all hover:shadow-sm',
        insight.status === 'NEW' ? 'border-primary-200 bg-primary-50/30' : 'border-slate-200'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('rounded-lg p-2', config.bgColor)}>
          <InsightIcon className={cn('h-4 w-4', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              className={cn(config.bgColor, config.textColor, 'border-0')}
              size="sm"
            >
              {config.label}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                priorityConfig[insight.priority].bgColor,
                priorityConfig[insight.priority].color,
                'border-0'
              )}
              size="sm"
            >
              {insight.priority}
            </Badge>
            {insight.status === 'NEW' && (
              <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            )}
          </div>

          <h4 className="mt-2 text-sm font-semibold text-slate-900">
            {insight.title}
          </h4>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2">
            {insight.description}
          </p>

          {/* Metrics */}
          {insight.metrics && insight.metrics.length > 0 && (
            <div className="mt-3 flex items-center gap-4">
              {insight.metrics.map((metric, index) => (
                <div key={index} className="flex items-center gap-1">
                  {metric.trend === 'up' && (
                    <TrendingUp className="h-3 w-3 text-success-500" />
                  )}
                  {metric.trend === 'down' && (
                    <TrendingDown className="h-3 w-3 text-danger-500" />
                  )}
                  <span className="text-xs text-slate-500">{metric.label}:</span>
                  <span className="text-xs font-semibold text-slate-700">
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{formatRelativeTime(insight.timestamp)}</span>
              <span>|</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {insight.confidence}% confidence
              </span>
            </div>

            <div className="flex items-center gap-1">
              {insight.action && (
                <Button variant="link" size="sm" className="h-auto p-1 text-xs">
                  {insight.action.label}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}
              {insight.status === 'NEW' && (
                <>
                  <button
                    onClick={() => onInsightAction?.(insight.id, 'acknowledge')}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    title="Acknowledge"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onInsightAction?.(insight.id, 'dismiss')}
                    className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-danger-500"
                    title="Dismiss"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketIntelligenceItem({ item }: { item: MarketIntelligence }) {
  return (
    <div className="rounded-lg border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-2">
        <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 line-clamp-1">
            {item.headline}
          </p>
          <p className="mt-1 text-xs text-slate-500 line-clamp-2">
            {item.summary}
          </p>
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {tag}
              </span>
            ))}
            <span className="text-xs text-slate-400">
              {formatRelativeTime(item.timestamp)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs font-semibold text-blue-600">
            {item.relevance}%
          </span>
          <p className="text-xs text-slate-400">relevance</p>
        </div>
      </div>
    </div>
  );
}

function AIStatusIndicator({ status }: { status: 'ACTIVE' | 'PROCESSING' | 'OFFLINE' }) {
  const statusConfig = {
    ACTIVE: { label: 'Active', color: 'bg-success-500' },
    PROCESSING: { label: 'Processing', color: 'bg-warning-500 animate-pulse' },
    OFFLINE: { label: 'Offline', color: 'bg-slate-400' },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('h-2 w-2 rounded-full', config.color)} />
      <span className="text-xs text-slate-500">AI {config.label}</span>
    </div>
  );
}

function AIInsightsSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-32 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-32 rounded-lg bg-slate-200" />
        <div className="h-32 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-lg bg-slate-200" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AIInsightsWidget({
  data = mockAIInsightsData,
  isLoading = false,
  className,
  onViewAll,
  onInsightAction,
  onRefresh,
}: AIInsightsWidgetProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'market'>('insights');

  const newInsightsCount = useMemo(() => {
    return data?.insights.filter((i) => i.status === 'NEW').length || 0;
  }, [data?.insights]);

  const sortedInsights = useMemo(() => {
    if (!data?.insights) {return [];}
    return [...data.insights]
      .sort((a, b) => {
        // Sort by status (NEW first), then priority, then timestamp
        const statusPriority = { NEW: 0, ACKNOWLEDGED: 1, RESOLVED: 2, DISMISSED: 3 };
        const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

        const statusDiff = statusPriority[a.status] - statusPriority[b.status];
        if (statusDiff !== 0) {return statusDiff;}

        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {return priorityDiff;}

        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      })
      .slice(0, 4);
  }, [data?.insights]);

  if (isLoading) {
    return <AIInsightsSkeleton />;
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            AI insights unavailable
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            AI Insights
          </CardTitle>
          <AIStatusIndicator status={data.aiStatus} />
        </div>
        <div className="flex items-center gap-2">
          {newInsightsCount > 0 && (
            <Badge variant="primary">{newInsightsCount} New</Badge>
          )}
          {onRefresh && (
            <Button variant="ghost" size="icon-sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('insights')}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors relative',
              activeTab === 'insights'
                ? 'text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Proactive Alerts
            {activeTab === 'insights' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('market')}
            className={cn(
              'px-3 py-2 text-sm font-medium transition-colors relative',
              activeTab === 'market'
                ? 'text-primary-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            Market Intelligence
            {activeTab === 'market' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'insights' ? (
          <div className="space-y-3">
            {sortedInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onInsightAction={onInsightAction}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.marketIntelligence.slice(0, 4).map((item) => (
              <MarketIntelligenceItem key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Last Updated */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>Updated {formatRelativeTime(data.lastUpdated)}</span>
          </div>
        </div>

        {/* View All Button */}
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            View All Insights
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default AIInsightsWidget;
