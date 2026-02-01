'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Activity,
  Target,
  FileText,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  User,
  Building2,
  Upload,
  Edit3,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  ChevronRight,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatRelativeTime, formatDateTime, getInitials } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ActivityType =
  | 'target_added'
  | 'target_updated'
  | 'target_removed'
  | 'document_uploaded'
  | 'document_updated'
  | 'document_deleted'
  | 'filing_submitted'
  | 'filing_approved'
  | 'task_completed'
  | 'task_created'
  | 'task_assigned'
  | 'comment_added'
  | 'status_changed'
  | 'meeting_scheduled'
  | 'alert_triggered'
  | 'spac_updated'
  | 'user_joined';

type EntityType = 'spac' | 'target' | 'document' | 'filing' | 'task' | 'user' | 'comment';

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
  entity?: {
    type: EntityType;
    id: string;
    name: string;
  };
  spac?: {
    id: string;
    name: string;
    ticker?: string;
  };
  metadata?: Record<string, unknown>;
  timestamp: Date | string;
  isRead?: boolean;
}

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  showFilters?: boolean;
  showLoadMore?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onActivityClick?: (activity: ActivityItem) => void;
  onLoadMore?: () => void;
  onRefresh?: () => void;
  onMarkAsRead?: (activityId: string) => void;
  emptyMessage?: string;
  className?: string;
}

type FilterOption = 'all' | 'targets' | 'documents' | 'tasks' | 'filings' | 'alerts';

// ============================================================================
// CONSTANTS
// ============================================================================

const ACTIVITY_ICONS: Record<ActivityType, typeof Activity> = {
  target_added: Plus,
  target_updated: Edit3,
  target_removed: Trash2,
  document_uploaded: Upload,
  document_updated: Edit3,
  document_deleted: Trash2,
  filing_submitted: FileText,
  filing_approved: CheckCircle2,
  task_completed: CheckCircle2,
  task_created: Plus,
  task_assigned: User,
  comment_added: MessageSquare,
  status_changed: Activity,
  meeting_scheduled: Clock,
  alert_triggered: AlertTriangle,
  spac_updated: Building2,
  user_joined: User,
};

const ACTIVITY_COLORS: Record<ActivityType, { bg: string; text: string }> = {
  target_added: { bg: 'bg-success-100', text: 'text-success-600' },
  target_updated: { bg: 'bg-primary-100', text: 'text-primary-600' },
  target_removed: { bg: 'bg-danger-100', text: 'text-danger-600' },
  document_uploaded: { bg: 'bg-blue-100', text: 'text-blue-600' },
  document_updated: { bg: 'bg-primary-100', text: 'text-primary-600' },
  document_deleted: { bg: 'bg-danger-100', text: 'text-danger-600' },
  filing_submitted: { bg: 'bg-purple-100', text: 'text-purple-600' },
  filing_approved: { bg: 'bg-success-100', text: 'text-success-600' },
  task_completed: { bg: 'bg-success-100', text: 'text-success-600' },
  task_created: { bg: 'bg-primary-100', text: 'text-primary-600' },
  task_assigned: { bg: 'bg-orange-100', text: 'text-orange-600' },
  comment_added: { bg: 'bg-slate-100', text: 'text-slate-600' },
  status_changed: { bg: 'bg-warning-100', text: 'text-warning-600' },
  meeting_scheduled: { bg: 'bg-indigo-100', text: 'text-indigo-600' },
  alert_triggered: { bg: 'bg-danger-100', text: 'text-danger-600' },
  spac_updated: { bg: 'bg-primary-100', text: 'text-primary-600' },
  user_joined: { bg: 'bg-teal-100', text: 'text-teal-600' },
};

const FILTER_LABELS: Record<FilterOption, string> = {
  all: 'All Activity',
  targets: 'Targets',
  documents: 'Documents',
  tasks: 'Tasks',
  filings: 'Filings',
  alerts: 'Alerts',
};

const FILTER_ACTIVITY_TYPES: Record<FilterOption, ActivityType[]> = {
  all: [],
  targets: ['target_added', 'target_updated', 'target_removed'],
  documents: ['document_uploaded', 'document_updated', 'document_deleted'],
  tasks: ['task_completed', 'task_created', 'task_assigned'],
  filings: ['filing_submitted', 'filing_approved'],
  alerts: ['alert_triggered'],
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ActivityItemCardProps {
  activity: ActivityItem;
  onClick?: () => void;
  onMarkAsRead?: () => void;
  showAvatar?: boolean;
}

function ActivityItemCard({
  activity,
  onClick,
  onMarkAsRead,
  showAvatar = true,
}: ActivityItemCardProps) {
  const Icon = ACTIVITY_ICONS[activity.type] || Activity;
  const colors = ACTIVITY_COLORS[activity.type] || { bg: 'bg-slate-100', text: 'text-slate-600' };

  return (
    <div
      className={cn(
        'group flex gap-4 rounded-lg p-3 transition-all',
        !activity.isRead && 'bg-primary-50/50',
        onClick && 'cursor-pointer hover:bg-slate-50'
      )}
      onClick={onClick}
    >
      {/* Icon or Avatar */}
      <div className="flex-shrink-0">
        {showAvatar && activity.user ? (
          <div className="relative">
            <Avatar
              name={activity.user.name}
              src={activity.user.avatar}
              size="sm"
            />
            <div
              className={cn(
                'absolute -bottom-1 -right-1 rounded-full p-1',
                colors.bg
              )}
            >
              <Icon className={cn('h-3 w-3', colors.text)} />
            </div>
          </div>
        ) : (
          <div className={cn('rounded-lg p-2', colors.bg)}>
            <Icon className={cn('h-5 w-5', colors.text)} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm text-slate-900">
              <span className="font-medium">{activity.user.name}</span>{' '}
              <span className="text-slate-600">{activity.title}</span>
              {activity.entity && (
                <>
                  :{' '}
                  <span className="font-medium text-primary-600">
                    {activity.entity.name}
                  </span>
                </>
              )}
            </p>
            {activity.description && (
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                {activity.description}
              </p>
            )}
            {activity.spac && (
              <Badge variant="secondary" size="sm" className="mt-1">
                {activity.spac.ticker || activity.spac.name}
              </Badge>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="text-xs text-slate-400">
              {formatRelativeTime(activity.timestamp)}
            </span>
            {!activity.isRead && (
              <div className="h-2 w-2 rounded-full bg-primary-500" />
            )}
          </div>
        </div>
      </div>

      {/* Hover action */}
      {onClick && (
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}

function ActivityFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex animate-pulse gap-4">
          <div className="h-10 w-10 rounded-full bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecentActivityFeed({
  activities,
  title = 'Recent Activity',
  maxItems = 10,
  showFilters = true,
  showLoadMore = true,
  isLoading = false,
  error = null,
  onActivityClick,
  onLoadMore,
  onRefresh,
  onMarkAsRead,
  emptyMessage = 'No recent activity',
  className,
}: RecentActivityFeedProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [showAll, setShowAll] = useState(false);

  // Filter activities
  const filteredActivities = useMemo(() => {
    let filtered = activities;

    if (activeFilter !== 'all') {
      const allowedTypes = FILTER_ACTIVITY_TYPES[activeFilter];
      filtered = activities.filter((a) => allowedTypes.includes(a.type));
    }

    if (!showAll && maxItems > 0) {
      filtered = filtered.slice(0, maxItems);
    }

    return filtered;
  }, [activities, activeFilter, showAll, maxItems]);

  // Count unread
  const unreadCount = useMemo(() => {
    return activities.filter((a) => !a.isRead).length;
  }, [activities]);

  // Group by date
  const groupedActivities = useMemo(() => {
    const groups: Record<string, ActivityItem[]> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredActivities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      let groupKey: string;

      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const handleActivityClick = useCallback(
    (activity: ActivityItem) => {
      if (!activity.isRead) {
        onMarkAsRead?.(activity.id);
      }
      onActivityClick?.(activity);
    },
    [onActivityClick, onMarkAsRead]
  );

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-danger-400" />
          <p className="mt-4 text-sm font-medium text-danger-700">
            Failed to load activity
          </p>
          <p className="mt-1 text-xs text-danger-500">{error}</p>
          {onRefresh && (
            <Button variant="secondary" size="sm" className="mt-4" onClick={onRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            {title}
          </CardTitle>
          {unreadCount > 0 && (
            <Badge variant="primary" size="sm">
              {unreadCount} new
            </Badge>
          )}
        </div>
        {onRefresh && (
          <Button variant="ghost" size="icon-sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      {/* Filters */}
      {showFilters && (
        <div className="border-b border-slate-100 px-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {(Object.keys(FILTER_LABELS) as FilterOption[]).map((filter) => (
              <Button
                key={filter}
                variant={activeFilter === filter ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setActiveFilter(filter)}
              >
                {FILTER_LABELS[filter]}
              </Button>
            ))}
          </div>
        </div>
      )}

      <CardContent className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          <ActivityFeedSkeleton count={5} />
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Activity className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedActivities).map(([date, items]) => (
              <div key={date}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {date}
                </p>
                <div className="space-y-1">
                  {items.map((activity) => (
                    <ActivityItemCard
                      key={activity.id}
                      activity={activity}
                      onClick={
                        onActivityClick
                          ? () => handleActivityClick(activity)
                          : undefined
                      }
                      onMarkAsRead={
                        onMarkAsRead
                          ? () => onMarkAsRead(activity.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Load More */}
      {showLoadMore && activities.length > maxItems && (
        <CardFooter className="flex justify-center border-t border-slate-100">
          {!showAll ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
            >
              Show All ({activities.length - maxItems} more)
            </Button>
          ) : onLoadMore ? (
            <Button variant="ghost" size="sm" onClick={onLoadMore}>
              Load More
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
            >
              Show Less
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

// ============================================================================
// COMPACT VARIANT
// ============================================================================

interface ActivityCompactProps {
  activities: ActivityItem[];
  maxItems?: number;
  className?: string;
  onViewAll?: () => void;
}

export function ActivityCompact({
  activities,
  maxItems = 5,
  className,
  onViewAll,
}: ActivityCompactProps) {
  const displayedActivities = activities.slice(0, maxItems);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Recent Activity</span>
          {activities.length > maxItems && onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="space-y-3">
          {displayedActivities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type] || Activity;
            const colors = ACTIVITY_COLORS[activity.type];

            return (
              <div key={activity.id} className="flex items-center gap-3">
                <div className={cn('rounded p-1.5', colors.bg)}>
                  <Icon className={cn('h-3.5 w-3.5', colors.text)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-600">
                    <span className="font-medium text-slate-900">
                      {activity.user.name}
                    </span>{' '}
                    {activity.title}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">
                  {formatRelativeTime(activity.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TIMELINE VARIANT
// ============================================================================

interface ActivityTimelineProps {
  activities: ActivityItem[];
  className?: string;
}

export function ActivityTimeline({ activities, className }: ActivityTimelineProps) {
  return (
    <div className={cn('relative', className)}>
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

      <div className="space-y-6">
        {activities.map((activity, index) => {
          const Icon = ACTIVITY_ICONS[activity.type] || Activity;
          const colors = ACTIVITY_COLORS[activity.type];

          return (
            <div key={activity.id} className="relative flex gap-4">
              {/* Timeline dot */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                  colors.bg
                )}
              >
                <Icon className={cn('h-5 w-5', colors.text)} />
              </div>

              {/* Content */}
              <div className="flex-1 pb-6">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {activity.user.name}
                      </p>
                      <p className="text-sm text-slate-600">{activity.title}</p>
                      {activity.entity && (
                        <p className="mt-1 text-sm font-medium text-primary-600">
                          {activity.entity.name}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatDateTime(activity.timestamp)}
                    </span>
                  </div>
                  {activity.description && (
                    <p className="mt-2 text-sm text-slate-500">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
