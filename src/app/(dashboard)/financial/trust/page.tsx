'use client';

import { useState } from 'react';

import Link from 'next/link';

import { ArrowLeft, Download, RefreshCw, Settings } from 'lucide-react';

import { TrustAccountDashboard, SOREN_TRUST_DATA } from '@/components/financial/TrustAccountDashboard';
import { Button } from '@/components/ui/Button';

export default function TrustAccountPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/financial"
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Financial
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="secondary" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Trust Account Dashboard */}
      <TrustAccountDashboard
        {...SOREN_TRUST_DATA}
        onRefresh={handleRefresh}
      />
    </div>
  );
}
