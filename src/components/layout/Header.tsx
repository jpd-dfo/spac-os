'use client';

import { useState } from 'react';

import { UserButton } from '@clerk/nextjs';
import {
  Search,
  Bell,
  Menu,
} from 'lucide-react';

import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
}

export function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notifications: Notification[] = [
    {
      id: '1',
      title: 'New target identified',
      message: 'TechCorp has been added to the pipeline',
      time: '5 min ago',
      unread: true,
    },
    {
      id: '2',
      title: 'Filing deadline approaching',
      message: 'DEF14A due in 3 days',
      time: '1 hour ago',
      unread: true,
    },
    {
      id: '3',
      title: 'Task completed',
      message: 'Due diligence checklist completed',
      time: '2 hours ago',
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

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
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg animate-in">
                <div className="border-b border-slate-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'border-b border-slate-100 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors',
                        notification.unread && 'bg-primary-50/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {notification.unread && (
                          <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                        )}
                        <div className={cn(!notification.unread && 'pl-5')}>
                          <p className="text-sm font-medium text-slate-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-slate-500">{notification.message}</p>
                          <p className="mt-1 text-xs text-slate-400">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-200 px-4 py-3">
                  <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors">
                    View all notifications
                  </button>
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
