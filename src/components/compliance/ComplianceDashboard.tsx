'use client';

import { useState } from 'react';

import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Calendar,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Lock,
  Unlock,
  AlertCircle,
  Activity,
  BarChart3,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate, daysUntil } from '@/lib/utils';

// Types
interface ComplianceScore {
  overall: number;
  secFilings: number;
  corporateGovernance: number;
  insiderTrading: number;
  policies: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

interface DeadlineItem {
  id: string;
  title: string;
  type: string;
  dueDate: Date;
  owner: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'On Track' | 'At Risk' | 'Overdue';
}

interface RiskIndicator {
  id: string;
  category: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'Mitigated' | 'Accepted';
  lastUpdated: Date;
}

interface ActivityItem {
  id: string;
  action: string;
  user: string;
  entity: string;
  timestamp: Date;
  type: 'filing' | 'meeting' | 'disclosure' | 'policy' | 'audit';
}

// Mock data
const complianceScore: ComplianceScore = {
  overall: 87,
  secFilings: 92,
  corporateGovernance: 85,
  insiderTrading: 88,
  policies: 83,
  trend: 'up',
  trendValue: 3,
};

const upcomingDeadlines: DeadlineItem[] = [
  {
    id: '1',
    title: 'Form 10-Q Q1 2025',
    type: 'SEC Filing',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    owner: 'Robert Kim',
    priority: 'Critical',
    status: 'On Track',
  },
  {
    id: '2',
    title: 'Audit Committee Meeting',
    type: 'Board Meeting',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    owner: 'Sarah Chen',
    priority: 'High',
    status: 'On Track',
  },
  {
    id: '3',
    title: 'Form 4 - Michael Torres',
    type: 'Section 16 Filing',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    owner: 'Legal Team',
    priority: 'High',
    status: 'At Risk',
  },
  {
    id: '4',
    title: 'Annual Certification - J. Walsh',
    type: 'Policy Acknowledgment',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    owner: 'Jennifer Walsh',
    priority: 'Medium',
    status: 'Overdue',
  },
  {
    id: '5',
    title: 'Related Party Transaction Review',
    type: 'Corporate Governance',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    owner: 'Audit Committee',
    priority: 'Medium',
    status: 'On Track',
  },
];

const riskIndicators: RiskIndicator[] = [
  {
    id: '1',
    category: 'Insider Trading',
    description: 'Pre-clearance request pending for 3+ days without resolution',
    severity: 'Medium',
    status: 'Open',
    lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    category: 'Policy Compliance',
    description: 'Code of Ethics acknowledgment rate below 95% threshold',
    severity: 'Low',
    status: 'Open',
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    category: 'Record Retention',
    description: 'Policy review overdue by 30+ days',
    severity: 'Medium',
    status: 'Open',
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    category: 'Board Governance',
    description: 'Pending COI disclosure requires committee review',
    severity: 'High',
    status: 'Open',
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    action: 'Filed Form 8-K',
    user: 'Robert Kim',
    entity: 'Material Event Disclosure',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    type: 'filing',
  },
  {
    id: '2',
    action: 'Approved disclosure',
    user: 'Sarah Chen',
    entity: 'Alpha Partners Advisory COI',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    type: 'disclosure',
  },
  {
    id: '3',
    action: 'Scheduled meeting',
    user: 'Corporate Secretary',
    entity: 'Q1 2025 Board Meeting',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    type: 'meeting',
  },
  {
    id: '4',
    action: 'Acknowledged policy',
    user: 'John Smith',
    entity: 'Insider Trading Policy',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    type: 'policy',
  },
  {
    id: '5',
    action: 'Exported audit report',
    user: 'Compliance Officer',
    entity: 'Q4 2024 Compliance Report',
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000),
    type: 'audit',
  },
];

const quickStats = {
  pendingFilings: 3,
  upcomingMeetings: 2,
  openDisclosures: 4,
  pendingAcknowledgments: 5,
  tradingWindowOpen: true,
  daysUntilBlackout: 15,
};

function getScoreColor(score: number) {
  if (score >= 90) {return 'text-success-600';}
  if (score >= 70) {return 'text-warning-600';}
  return 'text-danger-600';
}

function getScoreBackground(score: number) {
  if (score >= 90) {return 'bg-success-500';}
  if (score >= 70) {return 'bg-warning-500';}
  return 'bg-danger-500';
}

function getStatusBadge(status: string) {
  const variants: Record<string, 'success' | 'warning' | 'danger'> = {
    'On Track': 'success',
    'At Risk': 'warning',
    Overdue: 'danger',
  };
  return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    Critical: 'text-danger-600',
    High: 'text-warning-600',
    Medium: 'text-primary-600',
    Low: 'text-slate-600',
  };
  return colors[priority] || 'text-slate-600';
}

function getSeverityBadge(severity: string) {
  const variants: Record<string, 'danger' | 'warning' | 'secondary'> = {
    High: 'danger',
    Medium: 'warning',
    Low: 'secondary',
  };
  return <Badge variant={variants[severity]}>{severity}</Badge>;
}

function getActivityIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    filing: <FileText className="h-4 w-4" />,
    meeting: <Calendar className="h-4 w-4" />,
    disclosure: <Shield className="h-4 w-4" />,
    policy: <CheckCircle2 className="h-4 w-4" />,
    audit: <Activity className="h-4 w-4" />,
  };
  return icons[type] || <FileText className="h-4 w-4" />;
}

function getActivityColor(type: string) {
  const colors: Record<string, string> = {
    filing: 'bg-primary-100 text-primary-600',
    meeting: 'bg-purple-100 text-purple-600',
    disclosure: 'bg-teal-100 text-teal-600',
    policy: 'bg-success-100 text-success-600',
    audit: 'bg-orange-100 text-orange-600',
  };
  return colors[type] || 'bg-slate-100 text-slate-600';
}

export function ComplianceDashboard() {
  return (
    <div className="space-y-6">
      {/* Compliance Score & Quick Stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Compliance Score */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-slate-500">Overall Compliance Score</h3>
              <div className="relative mx-auto mt-4 h-40 w-40">
                {/* Background circle */}
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={complianceScore.overall >= 90 ? '#22c55e' : complianceScore.overall >= 70 ? '#eab308' : '#ef4444'}
                    strokeWidth="2"
                    strokeDasharray={`${complianceScore.overall} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-4xl font-bold', getScoreColor(complianceScore.overall))}>
                    {complianceScore.overall}
                  </span>
                  <div className={cn(
                    'mt-1 flex items-center gap-1 text-sm',
                    complianceScore.trend === 'up' ? 'text-success-600' : 'text-danger-600'
                  )}>
                    {complianceScore.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>{complianceScore.trendValue}%</span>
                  </div>
                </div>
              </div>

              {/* Sub-scores */}
              <div className="mt-6 space-y-3">
                {[
                  { label: 'SEC Filings', score: complianceScore.secFilings },
                  { label: 'Corporate Governance', score: complianceScore.corporateGovernance },
                  { label: 'Insider Trading', score: complianceScore.insiderTrading },
                  { label: 'Policies', score: complianceScore.policies },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="flex-1 text-left text-sm text-slate-600">{item.label}</span>
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn('h-full rounded-full', getScoreBackground(item.score))}
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className={cn('w-8 text-right text-sm font-medium', getScoreColor(item.score))}>
                      {item.score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-primary-100 p-2">
                    <FileText className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{quickStats.pendingFilings}</p>
                    <p className="text-xs text-slate-500">Pending Filings</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{quickStats.upcomingMeetings}</p>
                    <p className="text-xs text-slate-500">Upcoming Meetings</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-warning-100 p-2">
                    <Shield className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{quickStats.openDisclosures}</p>
                    <p className="text-xs text-slate-500">Open Disclosures</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-teal-100 p-2">
                    <Users className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{quickStats.pendingAcknowledgments}</p>
                    <p className="text-xs text-slate-500">Pending Acks</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2 rounded-lg border p-4"
                   style={{
                     borderColor: quickStats.tradingWindowOpen ? '#86efac' : '#fca5a5',
                     backgroundColor: quickStats.tradingWindowOpen ? '#f0fdf4' : '#fef2f2'
                   }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'rounded-lg p-2',
                      quickStats.tradingWindowOpen ? 'bg-success-100' : 'bg-danger-100'
                    )}>
                      {quickStats.tradingWindowOpen ? (
                        <Unlock className="h-5 w-5 text-success-600" />
                      ) : (
                        <Lock className="h-5 w-5 text-danger-600" />
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        'font-medium',
                        quickStats.tradingWindowOpen ? 'text-success-700' : 'text-danger-700'
                      )}>
                        Trading Window: {quickStats.tradingWindowOpen ? 'Open' : 'Closed'}
                      </p>
                      <p className="text-xs text-slate-600">
                        {quickStats.tradingWindowOpen
                          ? `Closes in ${quickStats.daysUntilBlackout} days`
                          : 'Check insider trading page for details'}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    View Details
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                Upcoming Deadlines
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingDeadlines.map((deadline) => {
                const days = daysUntil(deadline.dueDate);
                const isOverdue = days !== null && days < 0;
                const isUrgent = days !== null && days <= 3 && !isOverdue;

                return (
                  <div
                    key={deadline.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3',
                      isOverdue ? 'border-danger-200 bg-danger-50' :
                      isUrgent ? 'border-warning-200 bg-warning-50' :
                      'border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold',
                        isOverdue ? 'bg-danger-100 text-danger-600' :
                        isUrgent ? 'bg-warning-100 text-warning-600' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {days !== null ? (days < 0 ? Math.abs(days) : days) : '-'}
                        <span className="text-xs font-normal">d</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{deadline.title}</p>
                          <span className={cn('text-xs', getPriorityColor(deadline.priority))}>
                            {deadline.priority}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                          <span>{deadline.type}</span>
                          <span>-</span>
                          <span>{deadline.owner}</span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(deadline.status)}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Risk Indicators */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                Risk Indicators
              </CardTitle>
              <Badge variant="warning">{riskIndicators.filter((r) => r.status === 'Open').length} Open</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskIndicators.map((risk) => (
                <div
                  key={risk.id}
                  className={cn(
                    'rounded-lg border p-3',
                    risk.severity === 'High' ? 'border-danger-200 bg-danger-50' :
                    risk.severity === 'Medium' ? 'border-warning-200 bg-warning-50' :
                    'border-slate-200'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{risk.category}</span>
                        {getSeverityBadge(risk.severity)}
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{risk.description}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        Last updated: {formatDate(risk.lastUpdated)}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Review
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-slate-500" />
              Recent Activity
            </CardTitle>
            <Button variant="ghost" size="sm">
              View Audit Trail
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  getActivityColor(activity.type)
                )}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">
                    <span className="font-medium">{activity.user}</span>
                    {' '}{activity.action}{' '}
                    <span className="font-medium">{activity.entity}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(activity.timestamp, 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
