'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import {
  Activity,
  FileText,
  Target,
  CheckCircle2,
  Upload,
  Edit,
  Send,
  Calendar,
  AlertTriangle,
  DollarSign,
  Users,
  MessageSquare,
  ChevronRight,
  Clock,
  Phone,
  Mail,
  Linkedin,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatRelativeTime } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type ActivityType =
  | 'DOCUMENT_UPLOAD'
  | 'DOCUMENT_EDIT'
  | 'DOCUMENT'
  | 'TARGET_ADDED'
  | 'TARGET_UPDATE'
  | 'TASK_COMPLETED'
  | 'TASK_ASSIGNED'
  | 'TASK'
  | 'FILING_SUBMITTED'
  | 'FILING_APPROVED'
  | 'FILING'
  | 'MEETING_SCHEDULED'
  | 'MEETING'
  | 'CALL'
  | 'EMAIL'
  | 'NOTE'
  | 'LINKEDIN'
  | 'COMMENT_ADDED'
  | 'DEAL_UPDATE'
  | 'COMPLIANCE_ALERT'
  | 'TRUST_UPDATE';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  user?: {
    name: string;
    avatar?: string;
  };
  relatedItem?: {
    type: 'spac' | 'target' | 'document' | 'filing' | 'task' | 'contact';
    id: string;
    name: string;
    href?: string;
  };
  timestamp: Date | string;
  isNew?: boolean;
  priority?: 'low' | 'medium' | 'high';
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
  maxItems?: number;
  onViewAll?: () => void;
  onActivityClick?: (activity: ActivityItem) => void;
  showHeader?: boolean;
  className?: string;
}

// ============================================================================
// ACTIVITY TYPE CONFIGURATION
// ============================================================================

const activityTypeConfig: Record<ActivityType, {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  label: string;
}> = {
  DOCUMENT_UPLOAD: {
    icon: Upload,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Document Uploaded',
  },
  DOCUMENT_EDIT: {
    icon: Edit,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Document Edited',
  },
  DOCUMENT: {
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Document',
  },
  TARGET_ADDED: {
    icon: Target,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    label: 'Target Added',
  },
  TARGET_UPDATE: {
    icon: Target,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    label: 'Target Updated',
  },
  TASK_COMPLETED: {
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    label: 'Task Completed',
  },
  TASK_ASSIGNED: {
    icon: Users,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Task Assigned',
  },
  TASK: {
    icon: CheckCircle2,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Task',
  },
  FILING_SUBMITTED: {
    icon: Send,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Filing Submitted',
  },
  FILING_APPROVED: {
    icon: FileText,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    label: 'Filing Approved',
  },
  FILING: {
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    label: 'Filing',
  },
  MEETING_SCHEDULED: {
    icon: Calendar,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    label: 'Meeting Scheduled',
  },
  MEETING: {
    icon: Calendar,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    label: 'Meeting',
  },
  CALL: {
    icon: Phone,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    label: 'Call',
  },
  EMAIL: {
    icon: Mail,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Email',
  },
  NOTE: {
    icon: MessageSquare,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Note',
  },
  LINKEDIN: {
    icon: Linkedin,
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    label: 'LinkedIn',
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    label: 'Comment Added',
  },
  DEAL_UPDATE: {
    icon: DollarSign,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    label: 'Deal Updated',
  },
  COMPLIANCE_ALERT: {
    icon: AlertTriangle,
    color: 'text-danger-600',
    bgColor: 'bg-danger-100',
    label: 'Compliance Alert',
  },
  TRUST_UPDATE: {
    icon: DollarSign,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    label: 'Trust Updated',
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================

export const mockRecentActivities: ActivityItem[] = [
  {
    id: 'ra-001',
    type: 'TARGET_UPDATE',
    title: 'MedTech Innovations moved to Negotiation',
    description: 'Deal stage updated from Due Diligence to Negotiation',
    user: { name: 'Sarah Chen' },
    relatedItem: {
      type: 'target',
      id: 'tgt-001',
      name: 'MedTech Innovations',
      href: '/targets/tgt-001',
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    isNew: true,
    priority: 'high',
  },
  {
    id: 'ra-002',
    type: 'DOCUMENT_UPLOAD',
    title: 'Due Diligence Checklist uploaded',
    description: 'Added financial review checklist for Q1 analysis',
    user: { name: 'Michael Ross' },
    relatedItem: {
      type: 'document',
      id: 'doc-001',
      name: 'Due Diligence Checklist v2.pdf',
      href: '/documents/doc-001',
    },
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    isNew: true,
  },
  {
    id: 'ra-003',
    type: 'FILING_SUBMITTED',
    title: 'Form 8-K submitted to SEC',
    description: 'Quarterly filing submitted successfully',
    user: { name: 'Emily Park' },
    relatedItem: {
      type: 'filing',
      id: 'fil-001',
      name: 'Form 8-K Q1 2026',
      href: '/filings/fil-001',
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: 'ra-004',
    type: 'TASK_COMPLETED',
    title: 'Financial model review completed',
    description: 'BioGenesis Labs valuation model finalized',
    user: { name: 'David Kim' },
    relatedItem: {
      type: 'task',
      id: 'task-001',
      name: 'Financial Model Review',
      href: '/tasks/task-001',
    },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
  },
  {
    id: 'ra-005',
    type: 'MEETING_SCHEDULED',
    title: 'Board Meeting scheduled',
    description: 'Q1 Review meeting set for Feb 5, 2026 at 2:00 PM',
    user: { name: 'Jessica Liu' },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: 'ra-006',
    type: 'COMPLIANCE_ALERT',
    title: 'Form 10-K deadline approaching',
    description: 'Annual report due in 14 days',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    priority: 'high',
  },
  {
    id: 'ra-007',
    type: 'TARGET_ADDED',
    title: 'New target added to pipeline',
    description: 'Nexus Diagnostics added for initial screening',
    user: { name: 'David Kim' },
    relatedItem: {
      type: 'target',
      id: 'tgt-002',
      name: 'Nexus Diagnostics',
      href: '/targets/tgt-002',
    },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: 'ra-008',
    type: 'TRUST_UPDATE',
    title: 'Trust account interest accrued',
    description: '+$125,000 interest added to trust balance',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function ActivityItemRow({
  activity,
  onClick,
}: {
  activity: ActivityItem;
  onClick?: (activity: ActivityItem) => void;
}) {
  const config = activityTypeConfig[activity.type];
  const ActivityIcon = config.icon;

  const content = (
    <div
      className={cn(
        'group flex items-start gap-3 rounded-lg p-3 transition-colors',
        activity.isNew && 'bg-primary-50/50',
        onClick && 'cursor-pointer hover:bg-slate-50'
      )}
      onClick={() => onClick?.(activity)}
    >
      {/* Icon */}
      <div className={cn('rounded-lg p-2 flex-shrink-0', config.bgColor)}>
        <ActivityIcon className={cn('h-4 w-4', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-slate-900 line-clamp-1">
            {activity.title}
          </p>
          {activity.isNew && (
            <Badge variant="primary" size="sm" className="flex-shrink-0">
              New
            </Badge>
          )}
        </div>

        {activity.description && (
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
            {activity.description}
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(activity.timestamp)}</span>
          {activity.user && (
            <>
              <span className="text-slate-300">|</span>
              <span>{activity.user.name}</span>
            </>
          )}
          {activity.priority === 'high' && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-danger-600 font-medium">High Priority</span>
            </>
          )}
        </div>

        {activity.relatedItem?.href && (
          <Link
            href={activity.relatedItem.href}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
            onClick={(e) => e.stopPropagation()}
          >
            View {activity.relatedItem.name}
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Arrow on hover */}
      {onClick && (
        <ChevronRight
          className="h-4 w-4 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 flex-shrink-0 mt-0.5"
        />
      )}
    </div>
  );

  return content;
}

function ActivitySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg p-3 animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-slate-200" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="h-3 w-1/3 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RecentActivity({
  activities = mockRecentActivities,
  isLoading = false,
  maxItems = 6,
  onViewAll,
  onActivityClick,
  showHeader = true,
  className,
}: RecentActivityProps) {
  const displayedActivities = useMemo(() => {
    return activities.slice(0, maxItems);
  }, [activities, maxItems]);

  const newCount = useMemo(() => {
    return activities.filter((a) => a.isNew).length;
  }, [activities]);

  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <ActivitySkeleton />
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
        )}
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No recent activity
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Activities will appear here as they happen
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            Recent Activity
          </CardTitle>
          {newCount > 0 && (
            <Badge variant="primary">{newCount} New</Badge>
          )}
        </CardHeader>
      )}

      <CardContent className="space-y-1 pt-0">
        {displayedActivities.map((activity) => (
          <ActivityItemRow
            key={activity.id}
            activity={activity}
            onClick={onActivityClick}
          />
        ))}

        {/* View All Button */}
        {onViewAll && activities.length > maxItems && (
          <button
            onClick={onViewAll}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 mt-4"
          >
            View All Activity ({activities.length} total)
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentActivity;
