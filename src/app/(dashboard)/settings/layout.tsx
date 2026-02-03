'use client';

import { SettingsNav } from '@/components/settings';
import { Card, CardContent } from '@/components/ui/Card';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your account and application preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-3">
              <SettingsNav />
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {children}
        </div>
      </div>
    </div>
  );
}
