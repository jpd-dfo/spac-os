'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Building2,
  LayoutGrid,
  List,
  ChevronDown,
  X,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { SpacCard, SpacStatusBadge } from '@/components/spacs';
import { formatLargeNumber, formatDate, daysUntil, cn } from '@/lib/utils';
import { SPAC_STATUS_LABELS, SPAC_PHASE_LABELS } from '@/lib/constants';

// Mock data for demonstration
const mockSPACs = [
  {
    id: '1',
    name: 'Alpha Acquisition Corp',
    ticker: 'ALPH',
    status: 'DA_ANNOUNCED',
    phase: 'SEC_REVIEW',
    ipoDate: new Date('2023-06-15'),
    ipoSize: 250000000,
    trustBalance: 258000000,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    targetSectors: ['Technology', 'Healthcare'],
    activeTargets: 1,
  },
  {
    id: '2',
    name: 'Beta Holdings SPAC',
    ticker: 'BETA',
    status: 'SEARCHING',
    phase: 'TARGET_SEARCH',
    ipoDate: new Date('2023-09-20'),
    ipoSize: 300000000,
    trustBalance: 305000000,
    deadline: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    targetSectors: ['Consumer', 'Financial Services'],
    activeTargets: 5,
  },
  {
    id: '3',
    name: 'Gamma Ventures',
    ticker: 'GAMA',
    status: 'SEARCHING',
    phase: 'DUE_DILIGENCE',
    ipoDate: new Date('2023-03-10'),
    ipoSize: 200000000,
    trustBalance: 204000000,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    targetSectors: ['Energy', 'Industrials'],
    activeTargets: 3,
  },
  {
    id: '4',
    name: 'Delta Capital SPAC',
    ticker: 'DELT',
    status: 'VOTE_SCHEDULED',
    phase: 'SHAREHOLDER_VOTE',
    ipoDate: new Date('2023-01-05'),
    ipoSize: 350000000,
    trustBalance: 360000000,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    targetSectors: ['Technology'],
    activeTargets: 1,
  },
  {
    id: '5',
    name: 'Epsilon Growth Corp',
    ticker: 'EPSI',
    status: 'LOI_SIGNED',
    phase: 'NEGOTIATION',
    ipoDate: new Date('2023-08-01'),
    ipoSize: 275000000,
    trustBalance: 280000000,
    deadline: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
    targetSectors: ['Healthcare', 'Technology'],
    activeTargets: 2,
  },
  {
    id: '6',
    name: 'Zeta Partners SPAC',
    ticker: 'ZETA',
    status: 'COMPLETED',
    phase: 'DE_SPAC',
    ipoDate: new Date('2022-11-15'),
    ipoSize: 400000000,
    trustBalance: 0,
    deadline: null,
    targetSectors: ['Industrials'],
    activeTargets: 0,
  },
];

type ViewMode = 'grid' | 'table';

export default function SPACsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter SPACs based on search and status
  const filteredSPACs = useMemo(() => {
    return mockSPACs.filter((spac) => {
      const matchesSearch =
        searchQuery === '' ||
        spac.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        spac.ticker.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || spac.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Get unique statuses for filter dropdown
  const statuses = useMemo(() => {
    const uniqueStatuses = [...new Set(mockSPACs.map((s) => s.status))];
    return uniqueStatuses.sort();
  }, []);

  const handleNewSpac = () => {
    router.push('/spacs/new');
  };

  const handleViewSpac = (id: string) => {
    router.push(`/spacs/${id}`);
  };

  const handleEditSpac = (id: string) => {
    router.push(`/spacs/${id}/edit`);
  };

  const handleDeleteSpac = (id: string) => {
    // TODO: Implement delete functionality
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">SPACs</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your SPAC portfolio and track deal progress
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleNewSpac}>
          <Plus className="mr-2 h-4 w-4" />
          New SPAC
        </Button>
      </div>

      {/* Search, Filters, and View Toggle */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex h-10 appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-10 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              <option value="all">All Status</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {SPAC_STATUS_LABELS[status] || status}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>

          {/* More Filters Button */}
          <Button
            variant="secondary"
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-primary-50 text-primary-700')}
          >
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="md" onClick={clearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'flex items-center justify-center rounded p-2 transition-colors',
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center justify-center rounded p-2 transition-colors',
              viewMode === 'table'
                ? 'bg-primary-100 text-primary-700'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            )}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing <span className="font-medium text-slate-900">{filteredSPACs.length}</span>{' '}
          of <span className="font-medium text-slate-900">{mockSPACs.length}</span> SPACs
        </p>
      </div>

      {/* SPAC Grid View */}
      {viewMode === 'grid' && filteredSPACs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredSPACs.map((spac) => (
            <SpacCard
              key={spac.id}
              spac={spac}
              onView={handleViewSpac}
              onEdit={handleEditSpac}
              onDelete={handleDeleteSpac}
            />
          ))}
        </div>
      )}

      {/* SPAC Table View */}
      {viewMode === 'table' && filteredSPACs.length > 0 && (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header>SPAC</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Phase</TableCell>
                <TableCell header>Trust Balance</TableCell>
                <TableCell header>IPO Size</TableCell>
                <TableCell header>Deadline</TableCell>
                <TableCell header>Targets</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSPACs.map((spac) => {
                const days = daysUntil(spac.deadline);
                const isUrgent = days !== null && days <= 30;

                return (
                  <TableRow
                    key={spac.id}
                    className="cursor-pointer"
                    onClick={() => handleViewSpac(spac.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                          <Building2 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{spac.name}</p>
                          <p className="text-sm text-slate-500">{spac.ticker}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SpacStatusBadge status={spac.status} size="sm" />
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">
                        {SPAC_PHASE_LABELS[spac.phase] || spac.phase}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {formatLargeNumber(spac.trustBalance)}
                      </span>
                    </TableCell>
                    <TableCell>{formatLargeNumber(spac.ipoSize)}</TableCell>
                    <TableCell>
                      {spac.deadline ? (
                        <div className={cn(isUrgent && 'text-warning-600')}>
                          <p className="text-sm">{formatDate(spac.deadline)}</p>
                          <p className="text-xs text-slate-500">
                            {days !== null && days > 0 ? `${days} days` : 'Expired'}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{spac.activeTargets}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Empty State */}
      {filteredSPACs.length === 0 && (
        <EmptyState
          icon={<Building2 className="h-12 w-12" />}
          title="No SPACs found"
          description={
            hasActiveFilters
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first SPAC'
          }
          action={
            hasActiveFilters
              ? { label: 'Clear Filters', onClick: clearFilters }
              : { label: 'Create SPAC', onClick: handleNewSpac }
          }
        />
      )}
    </div>
  );
}
