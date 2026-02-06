'use client';

import { useState } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Building2,
  Landmark,
  Briefcase,
  Target,
  CheckSquare,
  FolderOpen,
  FileText,
  Shield,
  DollarSign,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

import { useMobileMenu } from './MobileMenuContext';

import { cn } from '@/lib/utils';

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
      { name: 'Companies', href: '/organizations', icon: Building2 },
      { name: 'Contacts', href: '/contacts', icon: Users },
      { name: 'Tasks', href: '/tasks', icon: CheckSquare },
      { name: 'Documents', href: '/documents', icon: FolderOpen },
      { name: 'Filings', href: '/filings', icon: FileText },
      { name: 'Compliance', href: '/compliance', icon: Shield },
      { name: 'Financial', href: '/financial', icon: DollarSign },
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
  const { isOpen: isMobileOpen, setIsOpen: setMobileOpen } = useMobileMenu();

  // Shared navigation content renderer
  const renderNavigation = (isMobile: boolean = false) => (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      {navigation.map((section, sectionIndex) => (
        <div key={sectionIndex} className="mb-6">
          {section.title && (isMobile || !isCollapsed) && (
            <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.title}
            </h3>
          )}
          {section.title && !isMobile && isCollapsed && (
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
                    onClick={() => isMobile && setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                      !isMobile && isCollapsed && 'justify-center px-2'
                    )}
                    title={!isMobile && isCollapsed ? item.name : undefined}
                  >
                    <Icon
                      className={cn(
                        'h-5 w-5 flex-shrink-0',
                        isActive ? 'text-primary-600' : 'text-slate-400'
                      )}
                    />
                    {(isMobile || !isCollapsed) && (
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
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col w-72 border-r border-slate-200 bg-white transition-transform duration-300 lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setMobileOpen(false)}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 shadow-lg shadow-primary-600/20">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">SPAC OS</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Navigation */}
        {renderNavigation(true)}

        {/* Mobile Footer */}
        <div className="border-t border-slate-200 p-4">
          <div className="rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 p-4">
            <p className="text-sm font-medium text-primary-900">Need help?</p>
            <p className="mt-1 text-xs text-primary-700">
              Check our documentation or contact support.
            </p>
            <a
              href="https://github.com/direzze/spac-os"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
            >
              View Documentation
              <ChevronRight className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
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

        {/* Desktop Navigation */}
        {renderNavigation(false)}

        {/* Desktop Footer */}
        {!isCollapsed && (
          <div className="border-t border-slate-200 p-4">
            <div className="rounded-lg bg-gradient-to-r from-primary-50 to-primary-100 p-4">
              <p className="text-sm font-medium text-primary-900">Need help?</p>
              <p className="mt-1 text-xs text-primary-700">
                Check our documentation or contact support.
              </p>
              <a
                href="https://github.com/direzze/spac-os"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View Documentation
                <ChevronRight className="ml-1 h-3 w-3" />
              </a>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
