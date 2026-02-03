'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import { ArrowLeft, Download, Plus, Settings, Filter, Loader2, Building2, AlertCircle } from 'lucide-react';

import { CapTableView } from '@/components/financial/CapTableView';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { trpc } from '@/lib/trpc';

// Share class type definition
type ShareClass = 'class_a' | 'class_b' | 'public_warrants' | 'private_warrants' | 'options' | 'rsus';

export default function CapTablePage() {
  const [selectedSpacId, setSelectedSpacId] = useState<string | null>(null);

  // Fetch SPACs list
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
    const active = spacsQuery.data.items.find(
      (s) => s.status !== 'LIQUIDATED' && s.status !== 'COMPLETED'
    );
    return active || spacsQuery.data.items[0] || null;
  }, [spacsQuery.data, selectedSpacId]);

  const activeSpacId = activeSpac?.id || '';

  // Fetch cap table entries for selected SPAC
  const capTableQuery = trpc.financial.capTableList.useQuery(
    { spacId: activeSpacId },
    { enabled: !!activeSpacId, refetchOnWindowFocus: false }
  );

  // Transform data to CapTableView format
  const capTableData = useMemo(() => {
    if (!activeSpac) {
      return null;
    }

    const entries = capTableQuery.data || [];

    // Map share class from database to component format
    const classMap: Record<string, ShareClass> = {
      'CLASS_A': 'class_a',
      'CLASS_B': 'class_b',
      'PUBLIC_WARRANTS': 'public_warrants',
      'PRIVATE_WARRANTS': 'private_warrants',
      'OPTIONS': 'options',
      'RSUS': 'rsus',
    };

    // Map holder type from database to component format
    const holderTypeMap: Record<string, 'sponsor' | 'public' | 'institution' | 'management' | 'pipe_investor'> = {
      'SPONSOR': 'sponsor',
      'PUBLIC': 'public',
      'INSTITUTIONAL': 'institution',
      'MANAGEMENT': 'management',
      'PIPE': 'pipe_investor',
    };

    // Group entries by share class
    const entriesByClass: Record<ShareClass, typeof entries> = {
      class_a: [],
      class_b: [],
      public_warrants: [],
      private_warrants: [],
      options: [],
      rsus: [],
    };

    for (const entry of entries) {
      const shareClass = classMap[entry.shareClass] || 'class_a';
      entriesByClass[shareClass].push(entry);
    }

    // Colors for share classes
    const classColors: Record<ShareClass, string> = {
      class_a: '#3B82F6',
      class_b: '#8B5CF6',
      public_warrants: '#F43F5E',
      private_warrants: '#EC4899',
      options: '#10B981',
      rsus: '#F59E0B',
    };

    // Build share classes array
    const shareClasses = (Object.entries(entriesByClass) as [ShareClass, typeof entries][])
      .filter(([, classEntries]) => classEntries.length > 0)
      .map(([shareClass, classEntries]) => {
        const totalShares = classEntries.reduce((sum, e) => sum + Number(e.sharesOwned), 0);
        const totalOwnership = classEntries.reduce((sum, e) => sum + Number(e.ownershipPct), 0);

        return {
          id: shareClass,
          name: getShareClassName(shareClass),
          totalShares,
          percentageOfBasic: totalOwnership,
          percentageOfDiluted: totalOwnership * 0.9,
          votingPower: shareClass === 'class_b' ? totalOwnership * 10 : totalOwnership,
          color: classColors[shareClass],
          holders: classEntries.map((entry) => ({
            id: entry.id,
            name: entry.holderName,
            type: holderTypeMap[entry.holderType] || 'public',
            shares: Number(entry.sharesOwned),
            shareClass,
            vestingSchedule: entry.vestingInfo ? JSON.stringify(entry.vestingInfo) : undefined,
          })),
        };
      });

    // If no real data, use placeholders based on SPAC data
    if (shareClasses.length === 0 && activeSpac.sharesOutstanding) {
      const totalShares = Number(activeSpac.sharesOutstanding);
      shareClasses.push(
        {
          id: 'class_a',
          name: 'Class A (Public)',
          totalShares: Math.round(totalShares * 0.8),
          percentageOfBasic: 80,
          percentageOfDiluted: 72,
          votingPower: 80,
          color: '#3B82F6',
          holders: [
            {
              id: 'public-1',
              name: 'Public Shareholders',
              type: 'public' as const,
              shares: Math.round(totalShares * 0.8),
              shareClass: 'class_a' as ShareClass,
              vestingSchedule: undefined,
            },
          ],
        },
        {
          id: 'class_b',
          name: 'Class B (Founder)',
          totalShares: Math.round(totalShares * 0.2),
          percentageOfBasic: 20,
          percentageOfDiluted: 18,
          votingPower: 200,
          color: '#8B5CF6',
          holders: [
            {
              id: 'sponsor-1',
              name: 'Sponsor',
              type: 'sponsor' as const,
              shares: Math.round(totalShares * 0.2),
              shareClass: 'class_b' as ShareClass,
              vestingSchedule: undefined,
            },
          ],
        }
      );
    }

    return {
      spacName: activeSpac.name,
      spacTicker: activeSpac.ticker || 'N/A',
      shareClasses,
    };
  }, [activeSpac, capTableQuery.data]);

  const handleExport = () => {
    // TODO: Implement export
  };

  // Loading state
  if (spacsQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-sm text-slate-500">Loading cap table data...</p>
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
              Create a SPAC first to view cap table information.
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
      {capTableData ? (
        <CapTableView
          {...capTableData}
          onExport={handleExport}
        />
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-warning-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No Cap Table Data</h3>
            <p className="mt-2 text-sm text-slate-500">
              No cap table data available for this SPAC.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getShareClassName(shareClass: ShareClass): string {
  const names: Record<ShareClass, string> = {
    class_a: 'Class A (Public)',
    class_b: 'Class B (Founder)',
    public_warrants: 'Public Warrants',
    private_warrants: 'Private Placement Warrants',
    options: 'Stock Options',
    rsus: 'RSUs',
  };
  return names[shareClass];
}
