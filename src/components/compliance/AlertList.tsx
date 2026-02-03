'use client';

import { useState } from 'react';

import {
  AlertCircle,
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';

import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// Map alert types to icons and labels
const alertTypeConfig: Record<string, { icon: React.ElementType; label: string }> = {
  DEADLINE_APPROACHING: { icon: Clock, label: 'Deadline Approaching' },
  DEADLINE_CRITICAL: { icon: AlertTriangle, label: 'Critical Deadline' },
  DEADLINE_MISSED: { icon: AlertCircle, label: 'Deadline Missed' },
  FILING_REQUIRED: { icon: FileText, label: 'Filing Required' },
  COMPLIANCE_WARNING: { icon: ShieldAlert, label: 'Compliance Warning' },
};

// Default styles for fallback
const defaultSeverityStyle = {
  bg: 'bg-slate-50',
  text: 'text-slate-700',
  border: 'border-slate-200',
  badge: 'bg-slate-100 text-slate-700',
};

// Map severity to styles
const severityStyles = {
  high: {
    bg: 'bg-danger-50',
    text: 'text-danger-700',
    border: 'border-danger-200',
    badge: 'bg-danger-100 text-danger-700',
  },
  medium: {
    bg: 'bg-warning-50',
    text: 'text-warning-700',
    border: 'border-warning-200',
    badge: 'bg-warning-100 text-warning-700',
  },
  low: {
    bg: 'bg-primary-50',
    text: 'text-primary-700',
    border: 'border-primary-200',
    badge: 'bg-primary-100 text-primary-700',
  },
} as const;

// Helper to get severity styles safely
function getSeverityStyles(severity: string) {
  if (severity in severityStyles) {
    return severityStyles[severity as keyof typeof severityStyles];
  }
  return defaultSeverityStyle;
}

type SeverityFilter = 'all' | 'high' | 'medium' | 'low';

export function AlertList() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [showRead, setShowRead] = useState(true);

  const trpcUtils = trpc.useUtils();

  // Fetch alerts
  const { data: alertsData, isLoading } = trpc.alert.list.useQuery({
    severity: severityFilter === 'all' ? undefined : [severityFilter],
    isRead: showRead ? undefined : false,
    page: 1,
    pageSize: 50,
  });

  // Mutations
  const generateMutation = trpc.alert.generate.useMutation({
    onSuccess: () => {
      void trpcUtils.alert.list.invalidate();
      void trpcUtils.alert.getUnreadCount.invalidate();
    },
  });

  const markAsReadMutation = trpc.alert.markAsRead.useMutation({
    onSuccess: () => {
      void trpcUtils.alert.list.invalidate();
      void trpcUtils.alert.getUnreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.alert.markAllAsRead.useMutation({
    onSuccess: () => {
      void trpcUtils.alert.list.invalidate();
      void trpcUtils.alert.getUnreadCount.invalidate();
    },
  });

  const dismissMutation = trpc.alert.dismiss.useMutation({
    onSuccess: () => {
      void trpcUtils.alert.list.invalidate();
      void trpcUtils.alert.getUnreadCount.invalidate();
    },
  });

  const alerts = alertsData?.items ?? [];
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  // Format due date
  const formatDueDate = (date: Date | null) => {
    if (!date) {
      return null;
    }
    const d = new Date(date);
    const now = new Date();
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

    if (diffDays < 0) {
      return `${Math.abs(diffDays)} days overdue`;
    }
    if (diffDays === 0) {
      return 'Due today';
    }
    if (diffDays === 1) {
      return 'Due tomorrow';
    }
    return `Due in ${diffDays} days`;
  };

  return (
    <div className="space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-slate-900">Compliance Alerts</h2>
          {unreadCount > 0 && (
            <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Generate Alerts Button */}
          <button
            onClick={() => generateMutation.mutate({})}
            disabled={generateMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', generateMutation.isPending && 'animate-spin')} />
            {generateMutation.isPending ? 'Scanning...' : 'Generate Alerts'}
          </button>

          {/* Mark All as Read */}
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsReadMutation.mutate({})}
              disabled={markAllAsReadMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Filter:</span>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1">
          {(['all', 'high', 'medium', 'low'] as const).map((severity) => (
            <button
              key={severity}
              onClick={() => setSeverityFilter(severity)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                severityFilter === severity
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              )}
            >
              {severity === 'all' ? 'All' : severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>

        {/* Show Read Toggle */}
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={showRead}
            onChange={(e) => setShowRead(e.target.checked)}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          Show read alerts
        </label>
      </div>

      {/* Generation result message */}
      {generateMutation.isSuccess && (
        <div className="rounded-lg border border-success-200 bg-success-50 p-3 text-sm text-success-700">
          {generateMutation.data.message}
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-3">
        {isLoading && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-2 text-sm text-slate-500">Loading alerts...</p>
          </div>
        )}
        {!isLoading && alerts.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No alerts</h3>
            <p className="mt-1 text-sm text-slate-500">
              {severityFilter !== 'all' || !showRead
                ? 'Try adjusting your filters'
                : 'Click "Generate Alerts" to scan for compliance issues'}
            </p>
          </div>
        )}
        {!isLoading && alerts.length > 0 && alerts.map((alert) => {
            const config = alertTypeConfig[alert.type] || { icon: AlertCircle, label: alert.type };
            const Icon = config.icon;
            const styles = getSeverityStyles(alert.severity);
            const dueText = formatDueDate(alert.dueDate);

            return (
              <div
                key={alert.id}
                className={cn(
                  'rounded-lg border p-4 transition-colors',
                  alert.isRead ? 'border-slate-200 bg-white' : styles.border,
                  !alert.isRead && styles.bg
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={cn('flex-shrink-0 rounded-lg p-2', styles.bg)}>
                    <Icon className={cn('h-5 w-5', styles.text)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-slate-900">{alert.title}</h3>
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', styles.badge)}>
                            {alert.severity}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {config.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{alert.description}</p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          {alert.spac && (
                            <span className="font-medium">
                              SPAC: {alert.spac.ticker || alert.spac.name}
                            </span>
                          )}
                          {dueText && (
                            <span className={cn(
                              dueText.includes('overdue') ? 'text-danger-600 font-medium' : ''
                            )}>
                              {dueText}
                            </span>
                          )}
                          <span>
                            Created {new Date(alert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!alert.isRead && (
                          <button
                            onClick={() => markAsReadMutation.mutate({ id: alert.id })}
                            disabled={markAsReadMutation.isPending}
                            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => dismissMutation.mutate({ id: alert.id })}
                          disabled={dismissMutation.isPending}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-danger-600"
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Pagination info */}
      {alertsData && alertsData.total > 0 && (
        <p className="text-center text-sm text-slate-500">
          Showing {alerts.length} of {alertsData.total} alerts
        </p>
      )}
    </div>
  );
}
