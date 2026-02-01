'use client';

import { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Calendar,
  FileText,
  CheckSquare,
  AlertTriangle,
  Users,
  DollarSign,
  MessageSquare,
  Check,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
  configured: boolean;
}

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  email: boolean;
  push: boolean;
  sms: boolean;
  slack: boolean;
}

interface DigestSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  day?: string;
}

interface ReminderSettings {
  filingDeadlines: number[];
  taskDueDate: number[];
  meetingReminders: number[];
}

export function NotificationSettings() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [channels, setChannels] = useState<NotificationChannel[]>([
    {
      id: 'email',
      name: 'Email',
      description: 'Receive notifications via email',
      icon: Mail,
      enabled: true,
      configured: true,
    },
    {
      id: 'push',
      name: 'Push Notifications',
      description: 'Browser and desktop notifications',
      icon: Bell,
      enabled: true,
      configured: true,
    },
    {
      id: 'sms',
      name: 'SMS',
      description: 'Text message alerts for critical updates',
      icon: Smartphone,
      enabled: false,
      configured: false,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Get notifications in Slack channels',
      icon: MessageSquare,
      enabled: true,
      configured: true,
    },
  ]);

  const [categories, setCategories] = useState<NotificationCategory[]>([
    {
      id: 'filings',
      name: 'SEC Filings',
      description: 'Filing deadlines, submissions, and comment letters',
      icon: FileText,
      email: true,
      push: true,
      sms: false,
      slack: true,
    },
    {
      id: 'deadlines',
      name: 'Deadlines',
      description: 'Business combination and extension deadlines',
      icon: Calendar,
      email: true,
      push: true,
      sms: true,
      slack: true,
    },
    {
      id: 'tasks',
      name: 'Tasks',
      description: 'Task assignments, updates, and completions',
      icon: CheckSquare,
      email: true,
      push: true,
      sms: false,
      slack: false,
    },
    {
      id: 'deals',
      name: 'Deal Pipeline',
      description: 'Deal status changes and updates',
      icon: DollarSign,
      email: true,
      push: false,
      sms: false,
      slack: true,
    },
    {
      id: 'team',
      name: 'Team Activity',
      description: 'Team member actions and assignments',
      icon: Users,
      email: false,
      push: true,
      sms: false,
      slack: true,
    },
    {
      id: 'alerts',
      name: 'Critical Alerts',
      description: 'System alerts and compliance issues',
      icon: AlertTriangle,
      email: true,
      push: true,
      sms: true,
      slack: true,
    },
  ]);

  const [digestSettings, setDigestSettings] = useState<DigestSettings>({
    enabled: true,
    frequency: 'daily',
    time: '09:00',
    day: 'monday',
  });

  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>({
    filingDeadlines: [30, 14, 7, 3, 1],
    taskDueDate: [7, 3, 1],
    meetingReminders: [60, 15],
  });

  const [quietHours, setQuietHours] = useState({
    enabled: false,
    start: '22:00',
    end: '07:00',
    allowCritical: true,
  });

  const handleToggleChannel = (channelId: string) => {
    setChannels(
      channels.map((c) => (c.id === channelId ? { ...c, enabled: !c.enabled } : c))
    );
  };

  const handleToggleCategory = (
    categoryId: string,
    channel: 'email' | 'push' | 'sms' | 'slack'
  ) => {
    setCategories(
      categories.map((c) =>
        c.id === categoryId ? { ...c, [channel]: !c[channel] } : c
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleReminder = (
    type: keyof ReminderSettings,
    value: number
  ) => {
    const current = reminderSettings[type];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value].sort((a, b) => b - a);
    setReminderSettings({ ...reminderSettings, [type]: updated });
  };

  const frequencyOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const dayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-4 text-success-700">
          <Check className="h-5 w-5" />
          <span>Notification preferences saved successfully</span>
        </div>
      )}

      {/* Notification Channels */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Channels</CardTitle>
          <CardDescription>Configure how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channels.map((channel) => {
              const Icon = channel.icon;
              return (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        channel.enabled ? 'bg-primary-100' : 'bg-slate-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          channel.enabled ? 'text-primary-600' : 'text-slate-400'
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{channel.name}</p>
                        {channel.configured ? (
                          <Badge variant="success" size="sm">
                            Configured
                          </Badge>
                        ) : (
                          <Badge variant="warning" size="sm">
                            Setup Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{channel.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!channel.configured && (
                      <Button variant="secondary" size="sm">
                        Configure
                      </Button>
                    )}
                    <button
                      onClick={() => handleToggleChannel(channel.id)}
                      disabled={!channel.configured}
                      className={cn(
                        'relative h-6 w-11 rounded-full transition-colors',
                        channel.enabled && channel.configured
                          ? 'bg-primary-600'
                          : 'bg-slate-200',
                        !channel.configured && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                          channel.enabled && channel.configured && 'translate-x-5'
                        )}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Manage email notification settings per category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 text-left text-sm font-medium text-slate-500">
                    Category
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-1">
                      <Bell className="h-4 w-4" />
                      Push
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      SMS
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                    <div className="flex items-center justify-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      Slack
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <tr key={category.id} className="hover:bg-slate-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{category.name}</p>
                            <p className="text-sm text-slate-500">{category.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleCategory(category.id, 'email')}
                          className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            category.email ? 'bg-primary-600' : 'bg-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                              category.email && 'translate-x-4'
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleCategory(category.id, 'push')}
                          className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            category.push ? 'bg-primary-600' : 'bg-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                              category.push && 'translate-x-4'
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleCategory(category.id, 'sms')}
                          disabled={!channels.find((c) => c.id === 'sms')?.configured}
                          className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            category.sms ? 'bg-primary-600' : 'bg-slate-200',
                            !channels.find((c) => c.id === 'sms')?.configured &&
                              'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                              category.sms && 'translate-x-4'
                            )}
                          />
                        </button>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => handleToggleCategory(category.id, 'slack')}
                          className={cn(
                            'relative h-5 w-9 rounded-full transition-colors',
                            category.slack ? 'bg-primary-600' : 'bg-slate-200'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
                              category.slack && 'translate-x-4'
                            )}
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Deadline Reminders */}
      <Card>
        <CardHeader>
          <CardTitle>Deadline Reminders</CardTitle>
          <CardDescription>Configure when to receive reminder notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Filing Deadlines */}
            <div>
              <h4 className="text-sm font-medium text-slate-900 mb-3">
                SEC Filing Deadlines
              </h4>
              <p className="text-sm text-slate-500 mb-3">
                Send reminders before filing deadlines
              </p>
              <div className="flex flex-wrap gap-2">
                {[30, 14, 7, 3, 1].map((days) => (
                  <button
                    key={days}
                    onClick={() => toggleReminder('filingDeadlines', days)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      reminderSettings.filingDeadlines.includes(days)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {days} {days === 1 ? 'day' : 'days'}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Due Dates */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Task Due Dates</h4>
              <p className="text-sm text-slate-500 mb-3">
                Send reminders before task due dates
              </p>
              <div className="flex flex-wrap gap-2">
                {[7, 3, 1, 0].map((days) => (
                  <button
                    key={days}
                    onClick={() => toggleReminder('taskDueDate', days)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      reminderSettings.taskDueDate.includes(days)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {days === 0 ? 'On due date' : `${days} ${days === 1 ? 'day' : 'days'}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Meeting Reminders */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-900 mb-3">Meeting Reminders</h4>
              <p className="text-sm text-slate-500 mb-3">
                Send reminders before scheduled meetings
              </p>
              <div className="flex flex-wrap gap-2">
                {[60, 30, 15, 5].map((minutes) => (
                  <button
                    key={minutes}
                    onClick={() => toggleReminder('meetingReminders', minutes)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
                      reminderSettings.meetingReminders.includes(minutes)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {minutes >= 60 ? `${minutes / 60} hour` : `${minutes} min`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Digests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity Digests</CardTitle>
              <CardDescription>Receive periodic summaries of activity</CardDescription>
            </div>
            <button
              onClick={() =>
                setDigestSettings({ ...digestSettings, enabled: !digestSettings.enabled })
              }
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                digestSettings.enabled ? 'bg-primary-600' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  digestSettings.enabled && 'translate-x-5'
                )}
              />
            </button>
          </div>
        </CardHeader>
        {digestSettings.enabled && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Frequency"
                options={frequencyOptions}
                value={digestSettings.frequency}
                onChange={(e) =>
                  setDigestSettings({
                    ...digestSettings,
                    frequency: e.target.value as DigestSettings['frequency'],
                  })
                }
              />
              {digestSettings.frequency === 'weekly' && (
                <Select
                  label="Day"
                  options={dayOptions}
                  value={digestSettings.day}
                  onChange={(e) =>
                    setDigestSettings({ ...digestSettings, day: e.target.value })
                  }
                />
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Time
                </label>
                <input
                  type="time"
                  value={digestSettings.time}
                  onChange={(e) =>
                    setDigestSettings({ ...digestSettings, time: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                You will receive a{' '}
                {digestSettings.frequency === 'daily'
                  ? 'daily'
                  : digestSettings.frequency === 'weekly'
                  ? 'weekly'
                  : 'monthly'}{' '}
                digest at {digestSettings.time}
                {digestSettings.frequency === 'weekly' && ` on ${digestSettings.day}`} with a
                summary of activity, upcoming deadlines, and pending tasks.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quiet Hours</CardTitle>
              <CardDescription>Pause non-critical notifications during specific hours</CardDescription>
            </div>
            <button
              onClick={() =>
                setQuietHours({ ...quietHours, enabled: !quietHours.enabled })
              }
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                quietHours.enabled ? 'bg-primary-600' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  quietHours.enabled && 'translate-x-5'
                )}
              />
            </button>
          </div>
        </CardHeader>
        {quietHours.enabled && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Start Time
                </label>
                <input
                  type="time"
                  value={quietHours.start}
                  onChange={(e) =>
                    setQuietHours({ ...quietHours, start: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  End Time
                </label>
                <input
                  type="time"
                  value={quietHours.end}
                  onChange={(e) =>
                    setQuietHours({ ...quietHours, end: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning-500" />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Allow Critical Alerts
                  </p>
                  <p className="text-sm text-slate-500">
                    Critical alerts will still be delivered during quiet hours
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  setQuietHours({
                    ...quietHours,
                    allowCritical: !quietHours.allowCritical,
                  })
                }
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  quietHours.allowCritical ? 'bg-primary-600' : 'bg-slate-200'
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                    quietHours.allowCritical && 'translate-x-5'
                  )}
                />
              </button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
