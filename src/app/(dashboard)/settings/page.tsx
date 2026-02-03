'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useUser } from '@clerk/nextjs';
import {
  User,
  Bell,
  Key,
  Users,
  AlertTriangle,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: Date;
  lastUsed: Date | null;
}

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function SettingsOverviewPage() {
  const { user, isLoaded } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([
    { id: 'email', label: 'Email notifications', description: 'Receive updates via email', enabled: true },
    { id: 'deal', label: 'Deal updates', description: 'Pipeline changes and new targets', enabled: true },
    { id: 'deadline', label: 'Deadline reminders', description: 'Upcoming filing and compliance deadlines', enabled: true },
    { id: 'document', label: 'Document uploads', description: 'New documents added to deals', enabled: false },
    { id: 'compliance', label: 'Compliance alerts', description: 'SEC filings and compliance issues', enabled: true },
  ]);

  const [apiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Production API Key',
      key: 'spac_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: new Date('2024-01-15'),
      lastUsed: new Date('2024-01-20'),
    },
    {
      id: '2',
      name: 'Development Key',
      key: 'spac_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      createdAt: new Date('2024-01-10'),
      lastUsed: null,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotificationSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = (key: string, keyId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(keyId);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const maskKey = (key: string) => {
    return key.substring(0, 7) + '...' + key.substring(key.length - 4);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              Profile
            </CardTitle>
            <CardDescription>Your personal information and account details</CardDescription>
          </div>
          <Link href="/settings/profile">
            <Button variant="secondary" size="sm">
              Edit Profile
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar
              name={user?.fullName || user?.primaryEmailAddress?.emailAddress}
              src={user?.imageUrl}
              size="xl"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900">
                {user?.fullName || 'User'}
              </h3>
              <p className="text-sm text-slate-500">
                {user?.primaryEmailAddress?.emailAddress || 'No email'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="primary">Admin</Badge>
                <span className="text-xs text-slate-400">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-400" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Control how you receive notifications</CardDescription>
          </div>
          <Link href="/settings/notifications">
            <Button variant="secondary" size="sm">
              Manage All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationSettings.map((setting) => (
              <div
                key={setting.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{setting.label}</p>
                  <p className="text-xs text-slate-500">{setting.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(setting.id)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    setting.enabled ? 'bg-primary-600' : 'bg-slate-200'
                  )}
                  aria-label={`Toggle ${setting.label}`}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                      setting.enabled && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-slate-400" />
              API Keys
            </CardTitle>
            <CardDescription>Manage your API keys for integrations</CardDescription>
          </div>
          <Button variant="primary" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Generate Key
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">{apiKey.name}</p>
                    {apiKey.name.includes('Production') && (
                      <Badge variant="success" size="sm">Live</Badge>
                    )}
                    {apiKey.name.includes('Development') && (
                      <Badge variant="warning" size="sm">Test</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-xs text-slate-500 font-mono">
                      {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                    </code>
                    <button
                      onClick={() => toggleKeyVisibility(apiKey.id)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                    >
                      {visibleKeys.has(apiKey.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => copyToClipboard(apiKey.key, apiKey.id)}
                      className="text-slate-400 hover:text-slate-600"
                      aria-label="Copy key"
                    >
                      {copiedKey === apiKey.id ? (
                        <Check className="h-4 w-4 text-success-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Created {apiKey.createdAt.toLocaleDateString()}
                    {apiKey.lastUsed && ` | Last used ${apiKey.lastUsed.toLocaleDateString()}`}
                  </p>
                </div>
                <Button variant="ghost" size="icon-sm" className="text-slate-400 hover:text-danger-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Management Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-slate-400" />
            Team Management
          </CardTitle>
          <CardDescription>Manage team members and their permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700 ring-2 ring-white"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600 ring-2 ring-white">
                  +3
                </div>
              </div>
              <span className="text-sm text-slate-500">7 team members</span>
            </div>
            <Link href="/settings/team">
              <Button variant="secondary" size="sm">
                Manage Team
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger-600">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-900">Delete Account</p>
                <p className="text-sm text-slate-500">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              {!showDeleteConfirm ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button variant="danger" size="sm">
                    Confirm Delete
                  </Button>
                </div>
              )}
            </div>
            {showDeleteConfirm && (
              <div className="mt-4 rounded-md bg-danger-100 p-3">
                <p className="text-sm text-danger-700">
                  <strong>Warning:</strong> This will permanently delete all your SPACs, documents, contacts, and settings.
                  This action cannot be reversed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
