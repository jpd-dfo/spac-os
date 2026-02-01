'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Target,
  FolderOpen,
  FileText,
  DollarSign,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Deal Management',
    items: [
      { name: 'SPACs', href: '/spacs', icon: Building2 },
      { name: 'Pipeline', href: '/pipeline', icon: Target },
      { name: 'Documents', href: '/documents', icon: FolderOpen },
      { name: 'Filings', href: '/filings', icon: FileText },
      { name: 'Financial', href: '/financial', icon: DollarSign },
      { name: 'Contacts', href: '/contacts', icon: Users },
    ],
  },
  {
    title: 'System',
    items: [
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 hidden lg:flex flex-col border-r border-slate-200 bg-white transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-slate-900">SPAC OS</span>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navigation.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              {section.title && !isCollapsed && (
                <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {section.title}
                </h3>
              )}
              {section.title && isCollapsed && (
                <div className="mb-2 mx-2 border-b border-slate-200" />
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href ||
                    (pathname.startsWith(`${item.href}/`));
                  const Icon = item.icon;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                          isCollapsed && 'justify-center px-2'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5 flex-shrink-0',
                            isActive ? 'text-primary-600' : 'text-slate-400'
                          )}
                        />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1">{item.name}</span>
                            {item.badge && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-100 px-1.5 text-xs font-medium text-primary-700">
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 p-4">
              <p className="text-sm font-medium text-primary-900">Need help?</p>
              <p className="mt-1 text-xs text-primary-700">
                Check our documentation or contact support.
              </p>
              <Link
                href="/docs"
                className="mt-3 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View Documentation
                <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
