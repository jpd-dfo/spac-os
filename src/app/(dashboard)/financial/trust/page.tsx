'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { ArrowLeft, Download, RefreshCw, Settings, AlertCircle, Loader2, Building2 } from 'lucide-react';

import { TrustAccountDashboard, SOREN_TRUST_DATA } from '@/components/financial/TrustAccountDashboard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';

export default function TrustAccountPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSpacId, setSelectedSpacId] = useState<string | null>(null);

  // Fetch SPACs list for selector
  const spacsQuery = trpc.spac.list.useQuery(
    { page: 1, limit: 50, sortBy: 'name', sortOrder: 'asc' },
    { refetchOnWindowFocus: false }
  );

  // Auto-select first active SPAC
  const activeSpac = useMemo(() => {
    if (!spacsQuery.data?.items?.length) {
      return null;
    }
    if (selectedSpacId) {
      return spacsQuery.data.items.find((s) => s.id === selectedSpacId) || null;
    }
    // Find first non-completed/liquidated SPAC
    const active = spacsQuery.data.items.find(
      (s) => s.status !== 'LIQUIDATED' && s.status !== 'COMPLETED'
    );
    return active || spacsQuery.data.items[0] || null;
  }, [spacsQuery.data, selectedSpacId]);

  // Get active SPAC ID (safe extraction)
  const activeSpacId = activeSpac?.id || '';

  // Fetch trust account data for selected SPAC
  const trustQuery = trpc.financial.trustAccountGetLatest.useQuery(
    { spacId: activeSpacId },
    { enabled: !!activeSpacId, refetchOnWindowFocus: false }
  );

  // Fetch balance history
  const balanceHistoryQuery = trpc.financial.trustAccountGetBalanceHistory.useQuery(
    { spacId: activeSpacId },
    { enabled: !!activeSpacId, refetchOnWindowFocus: false }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      trustQuery.refetch(),
      balanceHistoryQuery.refetch(),
    ]);
    setIsRefreshing(false);
  };

  // Transform data to TrustAccountDashboard format
  const trustData = useMemo(() => {
    if (!activeSpac) {
      return null;
    }

    const trustAmount = activeSpac.trustAmount ? Number(activeSpac.trustAmount) : 0;
    const sharesOutstanding = activeSpac.sharesOutstanding ? Number(activeSpac.sharesOutstanding) : 0;

    // If we have real balance history, transform it
    const balanceHistory = balanceHistoryQuery.data?.length
      ? balanceHistoryQuery.data.map((entry: any) => ({
          date: new Date(entry.date).toISOString().slice(0, 7), // YYYY-MM format
          balance: entry.balance || 0,
          interest: entry.interestAccrued || 0,
          withdrawals: entry.withdrawals || 0,
        }))
      : // Generate placeholder history from IPO date
        generatePlaceholderHistory(activeSpac.ipoDate, trustAmount);

    // Use real trust data if available, otherwise derive from SPAC
    const latestTrust = trustQuery.data;
    const currentValue = latestTrust?.currentBalance ? Number(latestTrust.currentBalance) : trustAmount;
    const interestAccrued = latestTrust?.accruedInterest ? Number(latestTrust.accruedInterest) : 0;

    return {
      spacName: activeSpac.name,
      spacTicker: activeSpac.ticker || 'N/A',
      ipoDate: activeSpac.ipoDate || new Date(),
      deadlineDate: activeSpac.deadlineDate || new Date(Date.now() + 730 * 24 * 60 * 60 * 1000),
      initialTrustValue: trustAmount,
      currentTrustValue: currentValue,
      interestAccrued,
      interestRate: 0.045, // Default rate
      sharesOutstanding: sharesOutstanding || Math.floor(trustAmount / 10),
      extensions: 0,
      holdings: generateDefaultHoldings(currentValue),
      withdrawalHistory: [],
      balanceHistory,
    };
  }, [activeSpac, trustQuery.data, balanceHistoryQuery.data]);

  // Loading state
  if (spacsQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-sm text-slate-500">Loading trust account data...</p>
        </div>
      </div>
    );
  }

  // No SPACs found
  if (!spacsQuery.data?.items?.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No SPACs Found</h3>
            <p className="mt-2 text-sm text-slate-500">
              Create a SPAC first to view trust account information.
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
          {/* SPAC Selector */}
          {spacsQuery.data.items.length > 1 && (
            <select
              value={activeSpac?.id || ''}
              onChange={(e) => setSelectedSpacId(e.target.value)}
              className="input py-1 text-sm"
            >
              {spacsQuery.data.items.map((spac) => (
                <option key={spac.id} value={spac.id}>
                  {spac.name} ({spac.ticker || 'N/A'})
                </option>
              ))}
            </select>
          )}
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
      {trustData ? (
        <TrustAccountDashboard
          {...trustData}
          onRefresh={handleRefresh}
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-warning-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No Trust Data</h3>
            <p className="mt-2 text-sm text-slate-500">
              No trust account data available for this SPAC.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper: Generate placeholder balance history
function generatePlaceholderHistory(ipoDate: Date | string | null, trustAmount: number) {
  const startDate = ipoDate ? new Date(ipoDate) : new Date();
  const today = new Date();
  const history: { date: string; balance: number; interest: number; withdrawals: number }[] = [];

  const monthsDiff = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000)));

  for (let i = 0; i <= Math.min(monthsDiff, 24); i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);

    // Simulate 4.5% annual interest rate (~0.375% per month)
    const interestGrowth = 1 + (0.00375 * i);
    const balance = Math.round(trustAmount * interestGrowth);
    const interest = balance - trustAmount;

    history.push({
      date: date.toISOString().slice(0, 7),
      balance,
      interest,
      withdrawals: 0,
    });
  }

  return history;
}

// Helper: Generate default holdings based on current value
function generateDefaultHoldings(currentValue: number) {
  if (!currentValue || currentValue <= 0) {
    return [];
  }

  return [
    {
      id: '1',
      type: 'treasury_bills' as const,
      name: 'US Treasury Bills',
      value: Math.round(currentValue * 0.85),
      yield: 0.048,
      percentage: 85,
    },
    {
      id: '2',
      type: 'money_market' as const,
      name: 'Money Market Fund',
      value: Math.round(currentValue * 0.12),
      yield: 0.051,
      percentage: 12,
    },
    {
      id: '3',
      type: 'cash' as const,
      name: 'Operating Cash',
      value: Math.round(currentValue * 0.03),
      yield: 0,
      percentage: 3,
    },
  ];
}
