'use client';

import { type ReactNode } from 'react';

import { Header } from './Header';
import { MobileMenuProvider } from './MobileMenuContext';
import { Sidebar } from './Sidebar';

interface DashboardLayoutClientProps {
  children: ReactNode;
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps) {
  return (
    <MobileMenuProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
          {/* Header */}
          <Header />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </MobileMenuProvider>
  );
}
