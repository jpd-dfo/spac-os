'use client';

import { useState, useMemo } from 'react';

import {
  Activity,
  FileText,
  MessageSquare,
  Target,
  Users,
  CheckCircle2,
  Upload,
  Edit,
  Send,
  Calendar,
  ChevronRight,
  Filter,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ActivityType =
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_EDIT'
  | 'TARGET_UPDATE'
  | 'TASK_COMPLETE'
  | 'COMMENT'
  | 'MESSAGE'
  | 'MEETING'
  | 'FILING';

interface ActivityItem {
  id: string;
  type: ActivityType;
  user: {
    name: string;
    avatar?: string;
    role?: string;
  };
  action: string;
  subject: string;
  subjectLink?: string;
  metadata?: {
    targetName?: string;
    documentName?: string;
    taskName?: string;
    meetingTime?: string;
  };
  timestamp: Date | string;
  isNew?: boolean;
}

interface ActivityFeedData {
  activities: ActivityItem[];
  hasMore: boolean;
  totalCount: number;
}

interface ActivityFeedProps {
  data?: ActivityFeedData | null;
  isLoading?: boolean;
  className?: string;
  onViewAll?: () => void;
  onActivityClick?: (activityId: string) => void;
  maxItems?: number;
  showFilters?: boolean;
}

// ============================================================================
// MOCK DATA FOR SOREN ACQUISITION CORPORATION
// ============================================================================

export const mockActivityData: ActivityFeedData = {
  activities: [
    {
      id: 'act-001',
      type: 'TARGET_UPDATE',
      user: { name: 'Sarah Chen', role: 'Deal Lead' },
      action: 'moved target to Negotiation',
      subject: 'MedTech Innovations',
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
      isNew: true,
    },
    {
      id: 'act-002',
      type: 'DOCUMENT_UPLOAD',
      user: { name: 'Michael Ross', role: 'Legal Counsel' },
      action: 'uploaded',
      subject: 'Due Diligence Checklist v2.pdf',
      metadata: { targetName: 'MedTech Innovations' },
      timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 min ago
      isNew: true,
    },
    {
      id: 'act-003',
      type: 'COMMENT',
      user: { name: 'Emily Park', role: 'CFO' },
      action: 'commented on',
      subject: 'Trust Account Reconciliation',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 'act-004',
      type: 'TASK_COMPLETE',
      user: { name: 'David Kim', role: 'Analyst' },
      action: 'completed task',
      subject: 'Financial model review for BioGenesis Labs',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
    },
    {
      id: 'act-005',
      type: 'MEETING',
      user: { name: 'Jessica Liu', role: 'IR Manager' },
      action: 'scheduled meeting',
      subject: 'Board Meeting - Q1 Review',
      metadata: { meetingTime: 'Feb 5, 2026 at 2:00 PM' },
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    },
    {
      id: 'act-006',
      type: 'DOCUMENT_EDIT',
      user: { name: 'Sarah Chen', role: 'Deal Lead' },
      action: 'edited',
      subject: 'Investment Thesis - Healthcare Sector.docx',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    },
    {
      id: 'act-007',
      type: 'MESSAGE',
      user: { name: 'Michael Ross', role: 'Legal Counsel' },
      action: 'sent message to',
      subject: 'External Counsel Team',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    },
    {
      id: 'act-008',
      type: 'FILING',
      user: { name: 'Emily Park', role: 'CFO' },
      action: 'submitted',
      subject: 'Form 8-K Filing',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 'act-009',
      type: 'TARGET_UPDATE',
      user: { name: 'David Kim', role: 'Analyst' },
      action: 'added new target',
      subject: 'Nexus Diagnostics',
      timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    },
    {
      id: 'act-010',
      type: 'DOCUMENT_UPLOAD',
      user: { name: 'Jessica Liu', role: 'IR Manager' },
      action: 'uploaded',
      subject: 'Investor Presentation Q1 2026.pptx',
      timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 days ago
    },
  ],
  hasMore: true,
  totalCount: 156,
};

// ============================================================================
// ACTIVITY TYPE CONFIGURATION
// ============================================================================

const activityConfig: Record<ActivityType, {
  icon: typeof Activity;
  color: string;
  bgColor: string;
}> = {
  DOCUMENT_UPLOAD: {
    icon: Upload,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  DOCUMENT_EDIT: {
    icon: Edit,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  TARGET_UPDATE: {
    icon: Target,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
  },
  TASK_COMPLETE: {
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
  },
  COMMENT: {
    icon: MessageSquare,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  MESSAGE: {
    icon: Send,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  MEETING: {
    icon: Calendar,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
  },
  FILING: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ActivityItemComponent({
  activity,
  onActivityClick,
}: {
  activity: ActivityItem;
  onActivityClick?: (id: string) => void;
}) {
  const config = activityConfig[activity.type];
  const ActivityIcon = config.icon;

  return (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg p-3 transition-colors',
        activity.isNew && 'bg-primary-50/50',
        onActivityClick && 'cursor-pointer hover:bg-slate-50'
      )}
      onClick={() => onActivityClick?.(activity.id)}
    >
      {/* User Avatar */}
      <div className="relative">
        <Avatar
          name={activity.user.name}
          size="sm"
          className="h-9 w-9"
        />
        <div
          className={cn(
            'absolute -bottom-1 -right-1 rounded-full p-1',
            config.bgColor
          )}
        >
          <ActivityIcon className={cn('h-3 w-3', config.color)} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-700">
          <span className="font-semibold text-slate-900">
            {activity.user.name}
          </span>{' '}
          {activity.action}{' '}
          <span className="font-medium text-primary-600">
            {activity.subject}
          </span>
        </p>

        {activity.metadata && (
          <p className="mt-0.5 text-xs text-slate-500">
            {activity.metadata.targetName && `Target: ${activity.metadata.targetName}`}
            {activity.metadata.meetingTime && `Scheduled: ${activity.metadata.meetingTime}`}
          </p>
        )}

        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {formatRelativeTime(activity.timestamp)}
          </span>
          {activity.user.role && (
            <>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs text-slate-400">{activity.user.role}</span>
            </>
          )}
          {activity.isNew && (
            <Badge variant="primary" size="sm">New</Badge>
          )}
        </div>
      </div>

      {/* Arrow on hover */}
      <ChevronRight
        className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </div>
  );
}

function ActivityFilters({
  selectedFilter,
  onFilterChange,
}: {
  selectedFilter: ActivityType | 'ALL';
  onFilterChange: (filter: ActivityType | 'ALL') => void;
}) {
  const filters: { value: ActivityType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All' },
    { value: 'TARGET_UPDATE', label: 'Targets' },
    { value: 'DOCUMENT_UPLOAD', label: 'Documents' },
    { value: 'TASK_COMPLETE', label: 'Tasks' },
    { value: 'COMMENT', label: 'Comments' },
  ];

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap',
            selectedFilter === filter.value
              ? 'bg-primary-100 text-primary-700'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-32 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-3 w-1/2 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ActivityFeed({
  data = mockActivityData,
  isLoading = false,
  className,
  onViewAll,
  onActivityClick,
  maxItems = 8,
  showFilters = true,
}: ActivityFeedProps) {
  const [filter, setFilter] = useState<ActivityType | 'ALL'>('ALL');

  const filteredActivities = useMemo(() => {
    if (!data?.activities) {return [];}
    let activities = data.activities;
    if (filter !== 'ALL') {
      activities = activities.filter((a) => a.type === filter);
    }
    return activities.slice(0, maxItems);
  }, [data?.activities, filter, maxItems]);

  const newCount = useMemo(() => {
    return data?.activities.filter((a) => a.isNew).length || 0;
  }, [data?.activities]);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No activity data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary-600" />
          Recent Activity
        </CardTitle>
        {newCount > 0 && (
          <Badge variant="primary">{newCount} New</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <ActivityFilters
            selectedFilter={filter}
            onFilterChange={setFilter}
          />
        )}

        {/* Activity List */}
        <div className="space-y-1">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <ActivityItemComponent
                key={activity.id}
                activity={activity}
                onActivityClick={onActivityClick}
              />
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No activities match the filter</p>
            </div>
          )}
        </div>

        {/* View All Button */}
        {onViewAll && data.hasMore && (
          <button
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            View All Activity ({data.totalCount} total)
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityFeed;
