'use client';

import { useCallback, useEffect, useState } from 'react';

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
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

import { useNotificationStream, type AlertNotification } from '@/hooks';
import { useMobileMenu } from './MobileMenuContext';
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

// Map severity to toast styles
const severityToastStyles: Record<string, { icon: React.ElementType; className: string }> = {
  high: { icon: AlertTriangle, className: 'border-danger-200 bg-danger-50' },
  medium: { icon: AlertCircle, className: 'border-warning-200 bg-warning-50' },
  low: { icon: Clock, className: 'border-primary-200 bg-primary-50' },
};

// Format relative time
function formatRelativeTime(date: Date | string): string {
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
  const { toggle: toggleMobileMenu } = useMobileMenu();

  // Real-time notification stream
  const handleNewAlert = useCallback((alert: AlertNotification) => {
    // Show toast notification for new alerts
    const defaultStyle = { icon: Clock, className: 'border-primary-200 bg-primary-50' };
    const toastStyle = severityToastStyles[alert.severity] ?? defaultStyle;
    const ToastIcon = toastStyle.icon;
    const className = toastStyle.className;

    toast.custom(
      (t) => (
        <div
          className={cn(
            'max-w-md w-full rounded-lg shadow-lg border p-4 pointer-events-auto',
            className,
            t.visible ? 'animate-enter' : 'animate-leave'
          )}
        >
          <div className="flex items-start gap-3">
            <div className={cn('flex-shrink-0', severityColors[alert.severity])}>
              <ToastIcon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900">{alert.title}</p>
              <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{alert.description}</p>
              {alert.spac && (
                <p className="text-xs text-slate-500 mt-1">
                  {alert.spac.ticker || alert.spac.name}
                </p>
              )}
            </div>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ),
      {
        duration: 6000,
        position: 'top-right',
      }
    );
  }, []);

  const {
    isConnected,
    isConnecting,
    connectionError,
    unreadCount: streamUnreadCount,
    reconnect,
  } = useNotificationStream({
    onNewAlert: handleNewAlert,
    debug: process.env.NODE_ENV === 'development',
  });

  // Fallback: Fetch unread count via tRPC (used when SSE is not connected)
  const { data: polledUnreadData, refetch: refetchUnreadCount } = trpc.alert.getUnreadCount.useQuery(undefined, {
    // Only poll when SSE is not connected
    refetchInterval: isConnected ? false : 30000,
    enabled: !isConnected,
  });

  // Use stream count when connected, polled count otherwise
  const unreadCount = isConnected ? streamUnreadCount : (polledUnreadData?.count ?? 0);

  // Fetch recent alerts for dropdown (always via tRPC for full data)
  const { data: recentAlerts, refetch: refetchRecentAlerts } = trpc.alert.getRecent.useQuery(
    { limit: 5 },
    { enabled: isNotificationsOpen }
  );

  // Mark as read mutation
  const trpcUtils = trpc.useUtils();
  const markAsReadMutation = trpc.alert.markAsRead.useMutation({
    onSuccess: () => {
      // Refetch to update counts
      void trpcUtils.alert.getUnreadCount.invalidate();
      void trpcUtils.alert.getRecent.invalidate();
    },
  });

  // Refetch when dropdown opens
  useEffect(() => {
    if (isNotificationsOpen) {
      void refetchRecentAlerts();
      if (!isConnected) {
        void refetchUnreadCount();
      }
    }
  }, [isNotificationsOpen, isConnected, refetchRecentAlerts, refetchUnreadCount]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-6">
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
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
        {/* Connection Status Indicator (only shown when not connected) */}
        {!isConnected && (
          <div className="hidden sm:flex items-center gap-1.5">
            {isConnecting ? (
              <div className="flex items-center gap-1 text-slate-400">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Connecting...</span>
              </div>
            ) : connectionError ? (
              <button
                onClick={reconnect}
                className="flex items-center gap-1 text-warning-600 hover:text-warning-700 transition-colors"
                title={connectionError}
              >
                <WifiOff className="h-3.5 w-3.5" />
                <span className="text-xs">Reconnect</span>
              </button>
            ) : null}
          </div>
        )}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors',
              isConnected && 'ring-2 ring-success-200 ring-offset-1'
            )}
            aria-label="Notifications"
            title={isConnected ? 'Real-time notifications active' : 'Notifications (polling)'}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 text-xs font-medium text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {/* Real-time indicator dot */}
            {isConnected && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success-500" />
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
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">Compliance Alerts</h3>
                      {/* Real-time indicator */}
                      {isConnected ? (
                        <span className="flex items-center gap-1 text-xs text-success-600">
                          <Wifi className="h-3 w-3" />
                          Live
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <WifiOff className="h-3 w-3" />
                          Polling
                        </span>
                      )}
                    </div>
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
