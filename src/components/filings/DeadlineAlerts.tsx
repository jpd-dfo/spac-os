'use client';

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  ChevronRight,
  Settings,
  Mail,
  X,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { format, differenceInDays, startOfDay, addDays, isBefore, isAfter } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';
import { FILING_TYPE_LABELS } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

export interface DeadlineAlert {
  id: string;
  filingId: string;
  type: FilingType;
  title: string;
  spacId: string;
  spacName: string;
  ticker: string;
  status: FilingStatus;
  dueDate: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  alertType: 'OVERDUE' | '3_DAYS' | '7_DAYS' | '14_DAYS' | '30_DAYS';
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface NotificationSetting {
  id: string;
  alertType: '7_DAYS' | '14_DAYS' | '30_DAYS' | 'OVERDUE';
  emailEnabled: boolean;
  inAppEnabled: boolean;
  recipients: string[];
}

interface DeadlineAlertsProps {
  alerts: DeadlineAlert[];
  notificationSettings?: NotificationSetting[];
  onAlertClick?: (alert: DeadlineAlert) => void;
  onDismissAlert?: (alertId: string) => void;
  onUpdateNotificationSettings?: (settings: NotificationSetting[]) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getAlertConfig(alertType: DeadlineAlert['alertType']) {
  const configs = {
    OVERDUE: {
      label: 'Overdue',
      color: 'text-danger-700',
      bgColor: 'bg-danger-100',
      borderColor: 'border-danger-200',
      icon: AlertTriangle,
      iconColor: 'text-danger-600',
    },
    '3_DAYS': {
      label: 'Due in 3 days',
      color: 'text-danger-700',
      bgColor: 'bg-danger-50',
      borderColor: 'border-danger-200',
      icon: AlertCircle,
      iconColor: 'text-danger-600',
    },
    '7_DAYS': {
      label: 'Due in 7 days',
      color: 'text-warning-700',
      bgColor: 'bg-warning-50',
      borderColor: 'border-warning-200',
      icon: Clock,
      iconColor: 'text-warning-600',
    },
    '14_DAYS': {
      label: 'Due in 14 days',
      color: 'text-primary-700',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      icon: Timer,
      iconColor: 'text-primary-600',
    },
    '30_DAYS': {
      label: 'Due in 30 days',
      color: 'text-slate-700',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: Calendar,
      iconColor: 'text-slate-600',
    },
  };
  return configs[alertType];
}

function getPriorityConfig(priority: DeadlineAlert['priority']) {
  const configs = {
    CRITICAL: { label: 'Critical', color: 'text-danger-600', bgColor: 'bg-danger-100' },
    HIGH: { label: 'High', color: 'text-warning-600', bgColor: 'bg-warning-100' },
    MEDIUM: { label: 'Medium', color: 'text-primary-600', bgColor: 'bg-primary-100' },
    LOW: { label: 'Low', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  };
  return configs[priority];
}

function calculateAlertType(dueDate: Date, status: FilingStatus): DeadlineAlert['alertType'] | null {
  if (['COMPLETE', 'EFFECTIVE', 'SUBMITTED'].includes(status)) {
    return null;
  }

  const today = startOfDay(new Date());
  const due = startOfDay(dueDate);
  const days = differenceInDays(due, today);

  if (days < 0) return 'OVERDUE';
  if (days <= 3) return '3_DAYS';
  if (days <= 7) return '7_DAYS';
  if (days <= 14) return '14_DAYS';
  if (days <= 30) return '30_DAYS';
  return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DeadlineAlerts({
  alerts,
  notificationSettings = [],
  onAlertClick,
  onDismissAlert,
  onUpdateNotificationSettings,
  className,
}: DeadlineAlertsProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [filter, setFilter] = useState<'all' | 'overdue' | '7_days' | '14_days' | '30_days'>('all');
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Local notification settings state
  const [localSettings, setLocalSettings] = useState<NotificationSetting[]>(
    notificationSettings.length > 0
      ? notificationSettings
      : [
          { id: '1', alertType: 'OVERDUE', emailEnabled: true, inAppEnabled: true, recipients: [] },
          { id: '2', alertType: '7_DAYS', emailEnabled: true, inAppEnabled: true, recipients: [] },
          { id: '3', alertType: '14_DAYS', emailEnabled: false, inAppEnabled: true, recipients: [] },
          { id: '4', alertType: '30_DAYS', emailEnabled: false, inAppEnabled: true, recipients: [] },
        ]
  );

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    let result = alerts.filter((alert) => !dismissedAlerts.has(alert.id));

    switch (filter) {
      case 'overdue':
        result = result.filter((a) => a.alertType === 'OVERDUE');
        break;
      case '7_days':
        result = result.filter((a) => ['OVERDUE', '3_DAYS', '7_DAYS'].includes(a.alertType));
        break;
      case '14_days':
        result = result.filter((a) => ['OVERDUE', '3_DAYS', '7_DAYS', '14_DAYS'].includes(a.alertType));
        break;
      case '30_days':
        result = result.filter((a) => a.alertType !== null);
        break;
    }

    // Sort by urgency
    const urgencyOrder: Record<DeadlineAlert['alertType'], number> = {
      OVERDUE: 0,
      '3_DAYS': 1,
      '7_DAYS': 2,
      '14_DAYS': 3,
      '30_DAYS': 4,
    };

    return result.sort((a, b) => urgencyOrder[a.alertType] - urgencyOrder[b.alertType]);
  }, [alerts, filter, dismissedAlerts]);

  // Calculate stats
  const stats = useMemo(() => {
    const nonDismissed = alerts.filter((a) => !dismissedAlerts.has(a.id));
    return {
      total: nonDismissed.length,
      overdue: nonDismissed.filter((a) => a.alertType === 'OVERDUE').length,
      critical: nonDismissed.filter((a) => a.priority === 'CRITICAL').length,
      thisWeek: nonDismissed.filter((a) => ['OVERDUE', '3_DAYS', '7_DAYS'].includes(a.alertType)).length,
    };
  }, [alerts, dismissedAlerts]);

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, alertId]));
    onDismissAlert?.(alertId);
  };

  const handleToggleSetting = (settingId: string, field: 'emailEnabled' | 'inAppEnabled') => {
    setLocalSettings((prev) =>
      prev.map((s) => (s.id === settingId ? { ...s, [field]: !s[field] } : s))
    );
  };

  const handleSaveSettings = () => {
    onUpdateNotificationSettings?.(localSettings);
    setShowSettings(false);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === 'overdue' ? 'ring-2 ring-danger-500' : 'hover:border-slate-300'
          )}
          onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-danger-100 p-2">
                <AlertTriangle className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-danger-600">{stats.overdue}</p>
                <p className="text-sm text-slate-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === '7_days' ? 'ring-2 ring-warning-500' : 'hover:border-slate-300'
          )}
          onClick={() => setFilter(filter === '7_days' ? 'all' : '7_days')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-100 p-2">
                <Clock className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">{stats.thisWeek}</p>
                <p className="text-sm text-slate-500">Due This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-colors',
            stats.critical > 0 ? 'hover:border-slate-300' : ''
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <AlertCircle className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600">{stats.critical}</p>
                <p className="text-sm text-slate-500">Critical Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-colors',
            filter === 'all' ? 'ring-2 ring-primary-500' : 'hover:border-slate-300'
          )}
          onClick={() => setFilter('all')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Bell className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">All Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Alert List */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-600" />
              Deadline Alerts
              {stats.total > 0 && (
                <Badge variant="danger">{stats.total}</Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as typeof filter)}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Alerts</option>
                <option value="overdue">Overdue Only</option>
                <option value="7_days">Next 7 Days</option>
                <option value="14_days">Next 14 Days</option>
                <option value="30_days">Next 30 Days</option>
              </select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Notifications
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Notification Settings Panel */}
        {showSettings && (
          <div className="border-b border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-4 text-sm font-semibold text-slate-900">Notification Settings</h4>
            <div className="space-y-3">
              {localSettings.map((setting) => (
                <div
                  key={setting.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-900">
                      {setting.alertType === 'OVERDUE'
                        ? 'Overdue Items'
                        : `${setting.alertType.replace('_', ' ')} Before Deadline`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={setting.emailEnabled}
                        onChange={() => handleToggleSetting(setting.id, 'emailEnabled')}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">Email</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={setting.inAppEnabled}
                        onChange={() => handleToggleSetting(setting.id, 'inAppEnabled')}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                      <Bell className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-600">In-App</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        )}

        <CardContent className="p-0">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-success-300" />
              <p className="mt-4 text-sm font-medium text-slate-900">All caught up!</p>
              <p className="mt-1 text-sm text-slate-500">
                {filter === 'all'
                  ? 'No upcoming filing deadlines in the next 30 days'
                  : 'No alerts matching your filter'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredAlerts.map((alert) => {
                const alertConfig = getAlertConfig(alert.alertType);
                const priorityConfig = getPriorityConfig(alert.priority);
                const daysUntil = differenceInDays(
                  startOfDay(alert.dueDate),
                  startOfDay(new Date())
                );
                const IconComponent = alertConfig.icon;

                return (
                  <div
                    key={alert.id}
                    className={cn(
                      'flex items-center justify-between p-4 transition-colors hover:bg-slate-50',
                      alertConfig.bgColor
                    )}
                  >
                    <div
                      className="flex flex-1 cursor-pointer items-center gap-4"
                      onClick={() => onAlertClick?.(alert)}
                    >
                      <div className={cn('rounded-lg p-2', alertConfig.bgColor)}>
                        <IconComponent className={cn('h-5 w-5', alertConfig.iconColor)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {FILING_TYPE_LABELS[alert.type]}
                          </span>
                          <Badge className={cn(priorityConfig.bgColor, priorityConfig.color)} size="sm">
                            {priorityConfig.label}
                          </Badge>
                          <Badge className={cn(alertConfig.bgColor, alertConfig.color)} size="sm">
                            {alertConfig.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                          <span>{alert.spacName} ({alert.ticker})</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {formatDate(alert.dueDate)}
                          </span>
                          {alert.assignee && (
                            <span>Assigned to: {alert.assignee.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          daysUntil < 0
                            ? 'text-danger-600'
                            : daysUntil <= 7
                            ? 'text-warning-600'
                            : 'text-slate-600'
                        )}
                      >
                        {daysUntil < 0
                          ? `${Math.abs(daysUntil)} days overdue`
                          : daysUntil === 0
                          ? 'Due today'
                          : `${daysUntil} days left`}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDismiss(alert.id);
                        }}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <ChevronRight
                        className="h-5 w-5 text-slate-400 cursor-pointer"
                        onClick={() => onAlertClick?.(alert)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DeadlineAlerts;
