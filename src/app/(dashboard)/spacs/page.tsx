'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  Plus,
  Search,
  Filter,
  Building2,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Pencil,
  Trash2,
  MoreHorizontal,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { SpacCard, SpacStatusBadge } from '@/components/spacs';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableCell, TableHeaderCell } from '@/components/ui/Table';
import { SPAC_STATUS_LABELS, DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { trpc } from '@/lib/trpc/client';
import { formatLargeNumber, formatDate, daysUntil, cn } from '@/lib/utils';
import type { SpacStatus } from '@/schemas';

// All SPAC statuses from schema
const ALL_STATUSES: SpacStatus[] = [
  'SEARCHING',
  'LOI_SIGNED',
  'DA_ANNOUNCED',
  'SEC_REVIEW',
  'SHAREHOLDER_VOTE',
  'CLOSING',
  'COMPLETED',
  'LIQUIDATING',
  'LIQUIDATED',
  'TERMINATED',
];

// Sort options - must match SpacListSchema in spac.ts router
type SortField = 'name' | 'status' | 'trustAmount' | 'ipoDate' | 'deadlineDate' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'name', label: 'Name' },
  { value: 'status', label: 'Status' },
  { value: 'trustAmount', label: 'Trust Value' },
  { value: 'ipoDate', label: 'IPO Date' },
  { value: 'deadlineDate', label: 'Deadline' },
  { value: 'updatedAt', label: 'Last Updated' },
];

type ViewMode = 'grid' | 'table';

export default function SPACsPage() {
  const router = useRouter();

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SpacStatus[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [_showFilters, _setShowFilters] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Sort state
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [spacToDelete, setSpacToDelete] = useState<{ id: string; name: string } | null>(null);

  // tRPC query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.spac.list.useQuery({
    search: searchQuery || undefined,
    status: statusFilter.length > 0 ? statusFilter[0] : undefined,
    page,
    limit: pageSize,
    sortBy,
    sortOrder,
  }, {
    keepPreviousData: true,
  });

  // tRPC mutation for delete
  const deleteMutation = trpc.spac.delete.useMutation({
    onSuccess: () => {
      toast.success('SPAC deleted successfully');
      setDeleteModalOpen(false);
      setSpacToDelete(null);
      refetch();
    },
    onError: (error) => {
      const message = error.message || 'An unexpected error occurred';
      toast.error(`Failed to delete SPAC: ${message}`);
    },
  });

  // Handlers
  const handleNewSpac = () => {
    router.push('/spacs/new');
  };

  const handleViewSpac = (id: string) => {
    router.push(`/spacs/${id}`);
  };

  const handleEditSpac = (id: string) => {
    router.push(`/spacs/${id}/edit`);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSpacToDelete({ id, name });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (spacToDelete) {
      deleteMutation.mutate({ id: spacToDelete.id });
    }
  };

  const handleSort = useCallback((field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  }, [sortBy]);

  const handleStatusFilterChange = (status: SpacStatus) => {
    setStatusFilter(prev => {
      if (prev.includes(status)) {
        return prev.filter(s => s !== status);
      }
      return [...prev, status];
    });
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter([]);
    setPage(1);
  };

  const hasActiveFilters = searchQuery !== '' || statusFilter.length > 0;

  // Calculate pagination
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;
  const items = data?.items ?? [];

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) {return <ArrowUpDown className="h-4 w-4 text-slate-400" />;}
    return sortOrder === 'asc'
      ? <ArrowUp className="h-4 w-4 text-primary-600" />
      : <ArrowDown className="h-4 w-4 text-primary-600" />;
  };

  // Loading state
  if (isLoading && !data) {
    return <PageLoader message="Loading SPACs..." />;
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-danger-100 p-3 mb-4">
          <AlertCircle className="h-8 w-8 text-danger-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Failed to load SPACs</h2>
        <p className="text-sm text-slate-500 mb-4 text-center max-w-md">
          {error?.message || 'An unexpected error occurred while loading the SPAC list.'}
        </p>
        <Button variant="primary" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter Dropdown */}
          <Dropdown
            trigger={
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50">
                <Filter className="h-4 w-4 text-slate-400" />
                <span>Status</span>
                {statusFilter.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                    {statusFilter.length}
                  </span>
                )}
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            }
            align="left"
          >
            {ALL_STATUSES.map((status) => (
              <DropdownItem
                key={status}
                onClick={() => handleStatusFilterChange(status)}
                closeOnClick={false}
              >
                <input
                  type="checkbox"
                  checked={statusFilter.includes(status)}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{SPAC_STATUS_LABELS[status] || status}</span>
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Sort Dropdown */}
          <Dropdown
            trigger={
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50">
                <ArrowUpDown className="h-4 w-4 text-slate-400" />
                <span className="hidden sm:inline">Sort by:</span>
                <span className="font-medium">{SORT_OPTIONS.find(o => o.value === sortBy)?.label}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            }
            align="left"
          >
            {SORT_OPTIONS.map((option) => (
              <DropdownItem
                key={option.value}
                onClick={() => handleSort(option.value)}
              >
                <span className={cn(sortBy === option.value && 'font-medium text-primary-700')}>
                  {option.label}
                </span>
                {sortBy === option.value && (
                  <span className="ml-auto text-xs text-slate-500">
                    {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </span>
                )}
              </DropdownItem>
            ))}
          </Dropdown>

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
            aria-label="Grid view"
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
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Results Count and Page Size */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Loading...
            </span>
          ) : (
            <>
              Showing{' '}
              <span className="font-medium text-slate-900">
                {items.length > 0 ? (page - 1) * pageSize + 1 : 0}
              </span>
              {' - '}
              <span className="font-medium text-slate-900">
                {Math.min(page * pageSize, total)}
              </span>
              {' of '}
              <span className="font-medium text-slate-900">{total}</span> SPACs
            </>
          )}
        </p>

        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="page-size" className="text-sm text-slate-500">
            Show:
          </label>
          <select
            id="page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* SPAC Grid View */}
      {viewMode === 'grid' && items.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
          {items.map((spac) => (
            <SpacCard
              key={spac.id}
              spac={{
                id: spac.id,
                name: spac.name,
                ticker: spac.ticker || '',
                status: spac.status,
                phase: spac.phase,
                ipoSize: spac.ipoSize ? Number(spac.ipoSize) : 0,
                trustBalance: spac.trustAmount ? Number(spac.trustAmount) : 0,
                deadline: spac.deadlineDate,
                targetSectors: spac.targetSectors || [],
                activeTargets: spac._count?.targets || 0,
              }}
              onView={handleViewSpac}
              onEdit={handleEditSpac}
              onDelete={(id) => handleDeleteClick(id, spac.name)}
            />
          ))}
        </div>
      )}

      {/* SPAC Table View */}
      {viewMode === 'table' && items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell
                    sortable
                    sorted={sortBy === 'name' ? sortOrder : null}
                    onSort={() => handleSort('name')}
                  >
                    SPAC
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sorted={sortBy === 'status' ? sortOrder : null}
                    onSort={() => handleSort('status')}
                  >
                    Status
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sorted={sortBy === 'trustAmount' ? sortOrder : null}
                    onSort={() => handleSort('trustAmount')}
                    className="hidden md:table-cell"
                  >
                    Trust Value
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sorted={sortBy === 'ipoDate' ? sortOrder : null}
                    onSort={() => handleSort('ipoDate')}
                    className="hidden lg:table-cell"
                  >
                    IPO Date
                  </TableHeaderCell>
                  <TableHeaderCell
                    sortable
                    sorted={sortBy === 'deadlineDate' ? sortOrder : null}
                    onSort={() => handleSort('deadlineDate')}
                    className="hidden sm:table-cell"
                  >
                    Deadline
                  </TableHeaderCell>
                  <TableCell header className="text-right">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((spac) => {
                  const trustValue = spac.trustAmount ? Number(spac.trustAmount) : 0;
                  const days = daysUntil(spac.deadlineDate);
                  const isUrgent = days !== null && days <= 30 && days > 0;
                  const isExpired = days !== null && days <= 0;

                  return (
                    <TableRow
                      key={spac.id}
                      className="cursor-pointer"
                      onClick={() => handleViewSpac(spac.id)}
                    >
                      {/* Name Column */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                            <Building2 className="h-5 w-5 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-900">{spac.name}</p>
                            {spac.ticker && (
                              <p className="text-sm text-slate-500">{spac.ticker}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Status Column */}
                      <TableCell>
                        <SpacStatusBadge status={spac.status} size="sm" />
                      </TableCell>

                      {/* Trust Value Column */}
                      <TableCell className="hidden md:table-cell">
                        <span className="font-medium">
                          {formatLargeNumber(trustValue)}
                        </span>
                      </TableCell>

                      {/* IPO Date Column */}
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-slate-600">
                          {formatDate(spac.ipoDate)}
                        </span>
                      </TableCell>

                      {/* Deadline Column */}
                      <TableCell className="hidden sm:table-cell">
                        {spac.deadlineDate ? (
                          <div className={cn(
                            isUrgent && 'text-warning-600',
                            isExpired && 'text-danger-600'
                          )}>
                            <p className="text-sm">{formatDate(spac.deadlineDate)}</p>
                            <p className="text-xs text-slate-500">
                              {days !== null && days > 0
                                ? `${days} days left`
                                : days === 0
                                  ? 'Today'
                                  : 'Expired'}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>

                      {/* Actions Column */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <div className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100">
                              <MoreHorizontal className="h-4 w-4 text-slate-500" />
                            </div>
                          }
                          align="right"
                        >
                          <DropdownItem
                            icon={<Eye className="h-4 w-4" />}
                            onClick={() => handleViewSpac(spac.id)}
                          >
                            View Details
                          </DropdownItem>
                          <DropdownItem
                            icon={<Pencil className="h-4 w-4" />}
                            onClick={() => handleEditSpac(spac.id)}
                          >
                            Edit
                          </DropdownItem>
                          <DropdownDivider />
                          <DropdownItem
                            icon={<Trash2 className="h-4 w-4" />}
                            variant="danger"
                            onClick={() => handleDeleteClick(spac.id, spac.name)}
                          >
                            Delete
                          </DropdownItem>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {items.length === 0 && !isLoading && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(1)}
              disabled={page === 1 || isLoading}
            >
              First
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Previous</span>
            </Button>

            {/* Page Numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors',
                      page === pageNum
                        ? 'bg-primary-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              <span className="hidden sm:inline mr-1">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage(totalPages)}
              disabled={page === totalPages || isLoading}
            >
              Last
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSpacToDelete(null);
        }}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Delete SPAC</ModalTitle>
          <ModalDescription>
            Are you sure you want to delete this SPAC? This action cannot be undone.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          {spacToDelete && (
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="font-medium text-slate-900">{spacToDelete.name}</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setDeleteModalOpen(false);
              setSpacToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
