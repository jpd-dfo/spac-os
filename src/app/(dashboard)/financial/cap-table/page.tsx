'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Plus, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { CapTableView, SOREN_CAP_TABLE } from '@/components/financial/CapTableView';

export default function CapTablePage() {
  const handleExport = () => {
    // TODO: Implement export to Excel/CSV
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
          <Button variant="secondary" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="secondary" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button variant="primary" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Holder
          </Button>
        </div>
      </div>

      {/* Cap Table View */}
      <CapTableView
        {...SOREN_CAP_TABLE}
        onExport={handleExport}
      />
    </div>
  );
}
