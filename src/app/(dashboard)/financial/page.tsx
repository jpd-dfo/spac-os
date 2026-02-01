'use client';

import {
  DollarSign,
  Building2,
  Users,
  TrendingDown,
  Sliders,
  Target,
  FileText,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function FinancialPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Financial</h1>
        <p className="page-description">
          Trust account management, cap table, modeling, and financial reporting
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          {/* Icon */}
          <div className="mb-6 rounded-full bg-primary-50 p-6">
            <DollarSign className="h-12 w-12 text-primary-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-slate-900">
            Financial Module Coming Soon
          </h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-slate-500">
            A comprehensive financial management suite including trust account tracking,
            cap table management, dilution modeling, and PIPE/earnout tracking is currently in development.
          </p>

          {/* Sprint Info */}
          <div className="mt-6 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">
              Expected in Sprint 7
            </span>
          </div>

          {/* Feature Preview - Module Cards */}
          <div className="mt-12 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Building2 className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Trust Account</h3>
              <p className="mt-1 text-xs text-slate-500">
                Track trust balance, investments, and interest accrual
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Users className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Cap Table</h3>
              <p className="mt-1 text-xs text-slate-500">
                Manage share classes, holders, and ownership percentages
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <TrendingDown className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Dilution Waterfall</h3>
              <p className="mt-1 text-xs text-slate-500">
                Visualize ownership changes through transaction stages
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Sliders className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Redemption Scenarios</h3>
              <p className="mt-1 text-xs text-slate-500">
                Model different redemption levels and their impact
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-6 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <DollarSign className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">PIPE Tracker</h3>
              <p className="mt-1 text-xs text-slate-500">
                Track investor commitments and subscription status
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Target className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Earnout Tracking</h3>
              <p className="mt-1 text-xs text-slate-500">
                Monitor milestone-based earnout provisions
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <FileText className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Financial Reports</h3>
              <p className="mt-1 text-xs text-slate-500">
                Generate investor-ready financial reports
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
