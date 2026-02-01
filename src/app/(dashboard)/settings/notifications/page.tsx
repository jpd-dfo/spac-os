'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Mail,
  FileText,
  Clock,
  Upload,
  Shield,
  Check,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NotificationCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

export default function NotificationSettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Email notifications toggle
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);

  // Notification categories
  const [notificationCategories, setNotificationCategories] = useState<NotificationCategory[]>([
    {
      id: 'deal-updates',
      name: 'Deal Updates',
      description: 'Notifications when deal status changes, new targets are added, or valuations are updated',
      icon: FileText,
      enabled: true,
    },
    {
      id: 'deadline-reminders',
      name: 'Deadline Reminders',
      description: 'Reminders for upcoming SEC filing deadlines, business combination deadlines, and extension dates',
      icon: Clock,
      enabled: true,
    },
    {
      id: 'document-uploads',
      name: 'Document Uploads',
      description: 'Notifications when new documents are uploaded or existing documents are updated',
      icon: Upload,
      enabled: false,
    },
    {
      id: 'compliance-alerts',
      name: 'Compliance Alerts',
      description: 'Critical alerts for SEC filings, comment letters, and compliance issues requiring attention',
      icon: Shield,
      enabled: true,
    },
  ]);

  // Reminder timing settings
  const [reminderSettings, setReminderSettings] = useState({
    deadlineReminders: [30, 14, 7, 1],
    dailyDigest: true,
    digestTime: '09:00',
  });

  const toggleCategory = (categoryId: string) => {
    setNotificationCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId ? { ...cat, enabled: !cat.enabled } : cat
      )
    );
  };

  const toggleReminderDay = (days: number) => {
    setReminderSettings((prev) => {
      const current = prev.deadlineReminders;
      const updated = current.includes(days)
        ? current.filter((d) => d !== days)
        : [...current, days].sort((a, b) => b - a);
      return { ...prev, deadlineReminders: updated };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-4 text-success-700">
          <Check className="h-5 w-5" />
          <span>Notification preferences saved successfully</span>
        </div>
      )}

      {/* Email Notifications Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-slate-400" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Enable or disable all email notifications
              </CardDescription>
            </div>
            <button
              onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                emailNotificationsEnabled ? 'bg-primary-600' : 'bg-slate-200'
              )}
              aria-label="Toggle email notifications"
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  emailNotificationsEnabled && 'translate-x-5'
                )}
              />
            </button>
          </div>
        </CardHeader>
        {emailNotificationsEnabled && (
          <CardContent>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Email notifications are sent to your registered email address. You can customize
                which types of notifications you receive below.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notification Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-slate-400" />
            Notification Types
          </CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationCategories.map((category) => {
              const Icon = category.icon;
              const isDisabled = !emailNotificationsEnabled;

              return (
                <div
                  key={category.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4 transition-colors',
                    isDisabled
                      ? 'border-slate-100 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        category.enabled && !isDisabled
                          ? 'bg-primary-100'
                          : 'bg-slate-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          category.enabled && !isDisabled
                            ? 'text-primary-600'
                            : 'text-slate-400'
                        )}
                      />
                    </div>
                    <div>
                      <p
                        className={cn(
                          'font-medium',
                          isDisabled ? 'text-slate-400' : 'text-slate-900'
                        )}
                      >
                        {category.name}
                      </p>
                      <p
                        className={cn(
                          'text-sm',
                          isDisabled ? 'text-slate-300' : 'text-slate-500'
                        )}
                      >
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCategory(category.id)}
                    disabled={isDisabled}
                    className={cn(
                      'relative h-6 w-11 rounded-full transition-colors',
                      category.enabled && !isDisabled
                        ? 'bg-primary-600'
                        : 'bg-slate-200',
                      isDisabled && 'cursor-not-allowed opacity-50'
                    )}
                    aria-label={`Toggle ${category.name}`}
                  >
                    <span
                      className={cn(
                        'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                        category.enabled && !isDisabled && 'translate-x-5'
                      )}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deadline Reminders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-slate-400" />
            Deadline Reminders
          </CardTitle>
          <CardDescription>
            Choose when to receive reminders before deadlines
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Reminder Days Selection */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Send reminders before deadlines:
              </p>
              <div className="flex flex-wrap gap-2">
                {[30, 14, 7, 3, 1].map((days) => (
                  <button
                    key={days}
                    onClick={() => toggleReminderDay(days)}
                    disabled={!emailNotificationsEnabled}
                    className={cn(
                      'rounded-full px-4 py-2 text-sm font-medium transition-colors',
                      reminderSettings.deadlineReminders.includes(days)
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-200'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                      !emailNotificationsEnabled && 'cursor-not-allowed opacity-50'
                    )}
                  >
                    {days} {days === 1 ? 'day' : 'days'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Selected: {reminderSettings.deadlineReminders.length > 0
                  ? reminderSettings.deadlineReminders.join(', ') + ' days before'
                  : 'None'}
              </p>
            </div>

            {/* Daily Digest */}
            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Daily Digest</p>
                  <p className="text-sm text-slate-500">
                    Receive a daily summary of all notifications
                  </p>
                </div>
                <button
                  onClick={() =>
                    setReminderSettings((prev) => ({
                      ...prev,
                      dailyDigest: !prev.dailyDigest,
                    }))
                  }
                  disabled={!emailNotificationsEnabled}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    reminderSettings.dailyDigest ? 'bg-primary-600' : 'bg-slate-200',
                    !emailNotificationsEnabled && 'cursor-not-allowed opacity-50'
                  )}
                  aria-label="Toggle daily digest"
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                      reminderSettings.dailyDigest && 'translate-x-5'
                    )}
                  />
                </button>
              </div>

              {reminderSettings.dailyDigest && emailNotificationsEnabled && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Digest Time
                  </label>
                  <input
                    type="time"
                    value={reminderSettings.digestTime}
                    onChange={(e) =>
                      setReminderSettings((prev) => ({
                        ...prev,
                        digestTime: e.target.value,
                      }))
                    }
                    className="w-full max-w-[200px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Daily digest will be sent at {reminderSettings.digestTime} (your local time)
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Settings Summary</CardTitle>
          <CardDescription>Overview of your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-slate-50 p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                {emailNotificationsEnabled ? (
                  <Check className="h-4 w-4 text-success-500" />
                ) : (
                  <span className="h-4 w-4 rounded-full bg-slate-300" />
                )}
                <span className={emailNotificationsEnabled ? 'text-slate-700' : 'text-slate-400'}>
                  Email notifications {emailNotificationsEnabled ? 'enabled' : 'disabled'}
                </span>
              </li>
              {notificationCategories.map((cat) => (
                <li key={cat.id} className="flex items-center gap-2">
                  {cat.enabled && emailNotificationsEnabled ? (
                    <Check className="h-4 w-4 text-success-500" />
                  ) : (
                    <span className="h-4 w-4 rounded-full bg-slate-300" />
                  )}
                  <span
                    className={
                      cat.enabled && emailNotificationsEnabled
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }
                  >
                    {cat.name} {cat.enabled && emailNotificationsEnabled ? 'enabled' : 'disabled'}
                  </span>
                </li>
              ))}
              <li className="flex items-center gap-2">
                {reminderSettings.dailyDigest && emailNotificationsEnabled ? (
                  <Check className="h-4 w-4 text-success-500" />
                ) : (
                  <span className="h-4 w-4 rounded-full bg-slate-300" />
                )}
                <span
                  className={
                    reminderSettings.dailyDigest && emailNotificationsEnabled
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }
                >
                  Daily digest at {reminderSettings.digestTime}
                </span>
              </li>
            </ul>
          </div>
        </CardContent>
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
