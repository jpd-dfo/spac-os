'use client';

import { useState } from 'react';

import { UserButton } from '@clerk/nextjs';
import {
  Search,
  Bell,
  Menu,
  AlertTriangle,
  Clock,
  AlertCircle,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// Map alert types to icons
const alertTypeIcons: Record<string, React.ElementType> = {
  DEADLINE_APPROACHING: Clock,
  DEADLINE_CRITICAL: AlertTriangle,
  DEADLINE_MISSED: AlertCircle,
  FILING_REQUIRED: FileText,
  COMPLIANCE_WARNING: ShieldAlert,
};

// Map severity to colors
const severityColors: Record<string, string> = {
  high: 'text-danger-600',
  medium: 'text-warning-600',
  low: 'text-primary-600',
};

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins} min ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
  return new Date(date).toLocaleDateString();
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch unread count
  const { data: unreadData } = trpc.alert.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch recent alerts for dropdown
  const { data: recentAlerts } = trpc.alert.getRecent.useQuery(
    { limit: 5 },
    { enabled: isNotificationsOpen }
  );

  // Mark as read mutation
  const markAsReadMutation = trpc.alert.markAsRead.useMutation({
    onSuccess: () => {
      // Refetch to update counts
      void trpcUtils.alert.getUnreadCount.invalidate();
      void trpcUtils.alert.getRecent.invalidate();
    },
  });

  const trpcUtils = trpc.useUtils();

  const unreadCount = unreadData?.count ?? 0;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="flex flex-1 items-center px-4 lg:px-0">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search SPACs, targets, documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsNotificationsOpen(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-xl border border-slate-200 bg-white shadow-lg animate-in">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Compliance Alerts</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-danger-100 px-2 py-0.5 text-xs font-medium text-danger-700">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {recentAlerts && recentAlerts.length > 0 ? (
                    recentAlerts.map((alert) => {
                      const Icon = alertTypeIcons[alert.type] || AlertCircle;
                      const severityColor = severityColors[alert.severity] || 'text-slate-600';
                      return (
                        <div
                          key={alert.id}
                          className={cn(
                            'border-b border-slate-100 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors',
                            !alert.isRead && 'bg-primary-50/50'
                          )}
                          onClick={() => {
                            if (!alert.isRead) {
                              markAsReadMutation.mutate({ id: alert.id });
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn('mt-0.5 flex-shrink-0', severityColor)}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 truncate">
                                  {alert.title}
                                </p>
                                {!alert.isRead && (
                                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                                )}
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2">{alert.description}</p>
                              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                                <span>{formatRelativeTime(alert.createdAt)}</span>
                                {alert.spac && (
                                  <>
                                    <span>-</span>
                                    <span className="font-medium">{alert.spac.ticker || alert.spac.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-center text-sm text-slate-500">
                      No active alerts
                    </div>
                  )}
                </div>
                <div className="border-t border-slate-200 px-4 py-3">
                  <Link
                    href="/compliance?tab=alerts"
                    className="block w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                    onClick={() => setIsNotificationsOpen(false)}
                  >
                    View all alerts
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="hidden lg:block h-8 w-px bg-slate-200 mx-2" />

        {/* User Button (Clerk) */}
        <div className="flex items-center">
          <UserButton
            afterSignOutUrl="/sign-in"
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
                userButtonPopoverCard: 'shadow-lg border border-slate-200',
                userButtonPopoverActionButton: 'hover:bg-slate-50',
                userButtonPopoverActionButtonText: 'text-slate-700',
                userButtonPopoverFooter: 'hidden',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
