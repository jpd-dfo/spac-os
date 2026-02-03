'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import {
  DollarSign,
  Building2,
  Users,
  TrendingUp,
  ChevronRight,
  Loader2,
  PieChart,
  AlertCircle,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { trpc } from '@/lib/trpc';
import { formatCurrency, formatLargeNumber } from '@/lib/utils';

export default function FinancialPage() {
  // Fetch SPACs list
  const spacsQuery = trpc.spac.list.useQuery(
    { page: 1, limit: 10, sortBy: 'name', sortOrder: 'asc' },
    { refetchOnWindowFocus: false }
  );

  // Get primary SPAC
  const primarySpac = useMemo(() => {
    if (!spacsQuery.data?.items?.length) {
      return null;
    }
    const active = spacsQuery.data.items.find(
      (s) => s.status !== 'LIQUIDATED' && s.status !== 'COMPLETED'
    );
    return active || spacsQuery.data.items[0] || null;
  }, [spacsQuery.data]);

  const primarySpacId = primarySpac?.id || '';

  // Fetch trust account data
  const trustQuery = trpc.financial.trustAccountGetLatest.useQuery(
    { spacId: primarySpacId },
    { enabled: !!primarySpacId, refetchOnWindowFocus: false }
  );

  // Fetch cap table summary
  const capTableSummary = trpc.financial.capTableGetSummary.useQuery(
    { spacId: primarySpacId },
    { enabled: !!primarySpacId, refetchOnWindowFocus: false }
  );

  // Loading state
  if (spacsQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-sm text-slate-500">Loading financial data...</p>
        </div>
      </div>
    );
  }

  // No SPACs
  if (!spacsQuery.data?.items?.length) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <h1 className="page-title">Financial</h1>
          <p className="page-description">
            Trust account management, cap table, and financial reporting
          </p>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No SPACs Found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Create a SPAC first to view financial information.
            </p>
            <Link href="/spacs/new">
              <Button variant="primary" size="md" className="mt-4">
                Create SPAC
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Derived values
  const trustAmount = primarySpac?.trustAmount ? Number(primarySpac.trustAmount) : 0;
  const sharesOutstanding = primarySpac?.sharesOutstanding ? Number(primarySpac.sharesOutstanding) : 0;
  const perShareValue = sharesOutstanding > 0 ? trustAmount / sharesOutstanding : 10;

  const latestTrust = trustQuery.data;
  const currentTrustValue = latestTrust?.currentBalance ? Number(latestTrust.currentBalance) : trustAmount;
  const interestAccrued = latestTrust?.accruedInterest ? Number(latestTrust.accruedInterest) : 0;

  const capSummary = capTableSummary.data;
  const totalShares = capSummary?.totalShares ? Number(capSummary.totalShares) : sharesOutstanding;
  const holderCount = capSummary?.totalEntries || 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Financial</h1>
        <p className="page-description">
          Trust account management, cap table, and financial reporting for {primarySpac?.name || 'your SPACs'}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2">
                <DollarSign className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(currentTrustValue)}
                </p>
                <p className="text-sm text-slate-500">Trust Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-50 p-2">
                <TrendingUp className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrency(interestAccrued)}
                </p>
                <p className="text-sm text-slate-500">Interest Accrued</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <PieChart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {formatLargeNumber(totalShares)}
                </p>
                <p className="text-sm text-slate-500">Shares Outstanding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  ${perShareValue.toFixed(2)}
                </p>
                <p className="text-sm text-slate-500">Per Share Value</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trust Account Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-500" />
              Trust Account
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-500 mb-4">
              Track trust balance, investments, interest accrual, and per-share value over time.
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm text-slate-500">Current Balance</p>
                <p className="text-lg font-semibold text-slate-900">{formatCurrency(currentTrustValue)}</p>
              </div>
              <Link href="/financial/trust">
                <Button variant="secondary" size="sm">
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Cap Table Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              Cap Table
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-slate-500 mb-4">
              Manage share classes, track ownership percentages, and view holder breakdown.
            </p>
            <div className="flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-sm text-slate-500">Total Shareholders</p>
                <p className="text-lg font-semibold text-slate-900">{holderCount || '-'} holders</p>
              </div>
              <Link href="/financial/cap-table">
                <Button variant="secondary" size="sm">
                  View Details
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share Class Breakdown (if available) */}
      {capSummary?.byShareClass && capSummary.byShareClass.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Share Class Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {capSummary.byShareClass.map((sc) => (
                <div key={sc.shareClass} className="rounded-lg border p-4">
                  <p className="text-sm font-medium text-slate-700">{sc.shareClass}</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatLargeNumber(Number(sc.totalShares))} shares
                  </p>
                  <p className="text-sm text-slate-500">
                    {sc.totalOwnership.toFixed(2)}% ownership · {sc.holderCount} holders
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
