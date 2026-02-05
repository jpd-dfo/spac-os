'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  X,
  AlertCircle,
  RefreshCw,
  Globe,
  DollarSign,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { AddOrganizationModal, type NewOrganizationData } from '@/components/organizations/AddOrganizationModal';
import { DEFAULT_PAGE_SIZE, SECTORS, GEOGRAPHIES } from '@/lib/constants';
import { trpc } from '@/lib/trpc/client';
import { cn, formatLargeNumber } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type OrganizationType = 'PE_FIRM' | 'IB' | 'TARGET_COMPANY' | 'SERVICE_PROVIDER' | 'LAW_FIRM' | 'ACCOUNTING_FIRM' | 'OTHER';
type OrganizationSubType = 'BUYOUT' | 'GROWTH_EQUITY' | 'VENTURE_CAPITAL' | 'FAMILY_OFFICE' | 'SOVEREIGN_WEALTH' | 'HEDGE_FUND' | 'BULGE_BRACKET' | 'MIDDLE_MARKET' | 'BOUTIQUE' | 'REGIONAL';

const TYPE_LABELS: Record<OrganizationType, string> = {
  PE_FIRM: 'PE Firm',
  IB: 'Investment Bank',
  TARGET_COMPANY: 'Target Company',
  SERVICE_PROVIDER: 'Service Provider',
  LAW_FIRM: 'Law Firm',
  ACCOUNTING_FIRM: 'Accounting Firm',
  OTHER: 'Other',
};

const SUBTYPE_LABELS: Record<OrganizationSubType, string> = {
  BUYOUT: 'Buyout',
  GROWTH_EQUITY: 'Growth Equity',
  VENTURE_CAPITAL: 'Venture Capital',
  FAMILY_OFFICE: 'Family Office',
  SOVEREIGN_WEALTH: 'Sovereign Wealth',
  HEDGE_FUND: 'Hedge Fund',
  BULGE_BRACKET: 'Bulge Bracket',
  MIDDLE_MARKET: 'Middle Market',
  BOUTIQUE: 'Boutique',
  REGIONAL: 'Regional',
};

const AUM_RANGES = [
  { label: 'Any', min: undefined, max: undefined },
  { label: 'Under $100M', min: undefined, max: 100_000_000 },
  { label: '$100M - $500M', min: 100_000_000, max: 500_000_000 },
  { label: '$500M - $1B', min: 500_000_000, max: 1_000_000_000 },
  { label: '$1B - $5B', min: 1_000_000_000, max: 5_000_000_000 },
  { label: '$5B - $10B', min: 5_000_000_000, max: 10_000_000_000 },
  { label: 'Over $10B', min: 10_000_000_000, max: undefined },
];

const ALL_TYPES: OrganizationType[] = ['PE_FIRM', 'IB', 'TARGET_COMPANY', 'SERVICE_PROVIDER', 'LAW_FIRM', 'ACCOUNTING_FIRM', 'OTHER'];
const ALL_SUBTYPES: OrganizationSubType[] = ['BUYOUT', 'GROWTH_EQUITY', 'VENTURE_CAPITAL', 'FAMILY_OFFICE', 'SOVEREIGN_WEALTH', 'HEDGE_FUND', 'BULGE_BRACKET', 'MIDDLE_MARKET', 'BOUTIQUE', 'REGIONAL'];

// ============================================================================
// Helper Components
// ============================================================================

function OrganizationSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg bg-slate-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-1/2 rounded bg-slate-200" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 w-full rounded bg-slate-200" />
              <div className="h-3 w-2/3 rounded bg-slate-200" />
            </div>
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-16 rounded-full bg-slate-200" />
              <div className="h-5 w-16 rounded-full bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTypeBadgeVariant(type: OrganizationType): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' {
  switch (type) {
    case 'PE_FIRM':
      return 'success';
    case 'IB':
      return 'primary';
    case 'TARGET_COMPANY':
      return 'warning';
    case 'LAW_FIRM':
      return 'info';
    case 'ACCOUNTING_FIRM':
      return 'info';
    case 'SERVICE_PROVIDER':
      return 'secondary';
    default:
      return 'secondary';
  }
}

// ============================================================================
// Organization Card Component
// ============================================================================

interface OrganizationCardProps {
  organization: {
    id: string;
    name: string;
    type: OrganizationType;
    subType?: OrganizationSubType | null;
    aum: number | null;
    headquarters: string | null;
    website: string | null;
    industryFocus: string[];
    geographyFocus: string[];
    _count?: {
      contacts: number;
      ownedStakes: number;
      spacs: number;
    };
  };
  onClick: (id: string) => void;
}

function OrganizationCard({ organization, onClick }: OrganizationCardProps) {
  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => onClick(organization.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 flex-shrink-0">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>

          {/* Header */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-slate-900 truncate">{organization.name}</h3>
              <Badge variant={getTypeBadgeVariant(organization.type)} size="sm">
                {TYPE_LABELS[organization.type]}
              </Badge>
            </div>
            {organization.subType && (
              <p className="text-sm text-slate-500 mt-0.5">
                {SUBTYPE_LABELS[organization.subType]}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2">
          {/* AUM */}
          {organization.aum && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-900">{formatLargeNumber(organization.aum)}</span>
              <span className="text-slate-500">AUM</span>
            </div>
          )}

          {/* Headquarters */}
          {organization.headquarters && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span className="truncate">{organization.headquarters}</span>
            </div>
          )}

          {/* Website */}
          {organization.website && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Globe className="h-4 w-4 text-slate-400" />
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-primary-600 hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {organization.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Industry Focus Tags */}
        {organization.industryFocus.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {organization.industryFocus.slice(0, 3).map((industry) => (
              <span
                key={industry}
                className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600"
              >
                {industry}
              </span>
            ))}
            {organization.industryFocus.length > 3 && (
              <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                +{organization.industryFocus.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        {organization._count && (
          <div className="mt-4 flex items-center gap-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>{organization._count.contacts} contacts</span>
            <span>{organization._count.spacs} SPACs</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function OrganizationsPage() {
  const router = useRouter();

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<OrganizationType | 'all'>('all');
  const [subTypeFilter, setSubTypeFilter] = useState<OrganizationSubType | 'all'>('all');
  const [aumRangeIndex, setAumRangeIndex] = useState(0);
  const [industryFilter, setIndustryFilter] = useState<string[]>([]);
  const [geographyFilter, setGeographyFilter] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // tRPC utilities
  const utils = trpc.useUtils();

  // Build query input
  const queryInput = useMemo(() => {
    const aumRange = AUM_RANGES[aumRangeIndex];
    return {
      page,
      pageSize,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      subType: subTypeFilter !== 'all' ? subTypeFilter : undefined,
      aumMin: aumRange?.min,
      aumMax: aumRange?.max,
      industryFocus: industryFilter.length > 0 ? industryFilter : undefined,
      geographyFocus: geographyFilter.length > 0 ? geographyFilter : undefined,
      search: searchQuery || undefined,
    };
  }, [page, pageSize, typeFilter, subTypeFilter, aumRangeIndex, industryFilter, geographyFilter, searchQuery]);

  // tRPC Query
  const organizationsQuery = trpc.organization.list.useQuery(queryInput, {
    keepPreviousData: true,
  });

  // tRPC Mutations
  const createOrganizationMutation = trpc.organization.create.useMutation({
    onSuccess: () => {
      utils.organization.list.invalidate();
      setIsAddModalOpen(false);
      toast.success('Organization created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create organization: ${error.message}`);
    },
  });

  // Derived data
  const organizations = useMemo(() => {
    return organizationsQuery.data?.items || [];
  }, [organizationsQuery.data]);

  const totalItems = organizationsQuery.data?.total || 0;
  const totalPages = organizationsQuery.data?.totalPages || 1;

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery !== '' ||
      typeFilter !== 'all' ||
      subTypeFilter !== 'all' ||
      aumRangeIndex !== 0 ||
      industryFilter.length > 0 ||
      geographyFilter.length > 0
    );
  }, [searchQuery, typeFilter, subTypeFilter, aumRangeIndex, industryFilter, geographyFilter]);

  // Handlers
  const handleCreateOrganization = useCallback(
    (data: NewOrganizationData) => {
      createOrganizationMutation.mutate({
        name: data.name,
        slug: data.slug,
        type: data.type,
        subType: data.subType,
        aum: data.aum,
        headquarters: data.headquarters || undefined,
        website: data.website || undefined,
        description: data.description || undefined,
        industryFocus: data.industryFocus,
        geographyFocus: data.geographyFocus,
      });
    },
    [createOrganizationMutation]
  );

  const handleViewOrganization = useCallback(
    (id: string) => {
      router.push(`/organizations/${id}`);
    },
    [router]
  );

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setSubTypeFilter('all');
    setAumRangeIndex(0);
    setIndustryFilter([]);
    setGeographyFilter([]);
    setPage(1);
  };

  const handleRetry = () => {
    organizationsQuery.refetch();
  };

  const toggleIndustryFilter = (industry: string) => {
    setIndustryFilter((prev) =>
      prev.includes(industry)
        ? prev.filter((i) => i !== industry)
        : [...prev, industry]
    );
    setPage(1);
  };

  const toggleGeographyFilter = (geography: string) => {
    setGeographyFilter((prev) =>
      prev.includes(geography)
        ? prev.filter((g) => g !== geography)
        : [...prev, geography]
    );
    setPage(1);
  };

  // Loading state
  if (organizationsQuery.isLoading && !organizationsQuery.data) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Organizations</h1>
          <p className="page-description">
            Manage PE firms, investment banks, and other organizations
          </p>
        </div>

        {/* Loading skeleton */}
        <OrganizationSkeleton />
      </div>
    );
  }

  // Error state
  if (organizationsQuery.isError) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Organizations</h1>
          <p className="page-description">
            Manage PE firms, investment banks, and other organizations
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-danger-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Failed to load organizations</h3>
            <p className="mt-2 text-sm text-slate-500">
              {organizationsQuery.error?.message || 'An error occurred while loading organizations.'}
            </p>
            <Button variant="primary" size="md" className="mt-4" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Organizations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage PE firms, investment banks, and other organizations
            {totalItems > 0 && ` - ${totalItems} total`}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Organization
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search organizations..."
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

          {/* Type Filter */}
          <Dropdown
            trigger={
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 cursor-pointer">
                <Filter className="h-4 w-4 text-slate-400" />
                <span>{typeFilter === 'all' ? 'All Types' : TYPE_LABELS[typeFilter]}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            }
            align="left"
          >
            <DropdownItem
              onClick={() => { setTypeFilter('all'); setPage(1); }}
            >
              <span className={typeFilter === 'all' ? 'font-medium text-primary-700' : ''}>
                All Types
              </span>
            </DropdownItem>
            <DropdownDivider />
            {ALL_TYPES.map((type) => (
              <DropdownItem
                key={type}
                onClick={() => { setTypeFilter(type); setPage(1); }}
              >
                <span className={typeFilter === type ? 'font-medium text-primary-700' : ''}>
                  {TYPE_LABELS[type]}
                </span>
              </DropdownItem>
            ))}
          </Dropdown>

          {/* SubType Filter */}
          <Dropdown
            trigger={
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 cursor-pointer">
                <span>{subTypeFilter === 'all' ? 'All Sub-Types' : SUBTYPE_LABELS[subTypeFilter]}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            }
            align="left"
          >
            <DropdownItem
              onClick={() => { setSubTypeFilter('all'); setPage(1); }}
            >
              <span className={subTypeFilter === 'all' ? 'font-medium text-primary-700' : ''}>
                All Sub-Types
              </span>
            </DropdownItem>
            <DropdownDivider />
            {ALL_SUBTYPES.map((subType) => (
              <DropdownItem
                key={subType}
                onClick={() => { setSubTypeFilter(subType); setPage(1); }}
              >
                <span className={subTypeFilter === subType ? 'font-medium text-primary-700' : ''}>
                  {SUBTYPE_LABELS[subType]}
                </span>
              </DropdownItem>
            ))}
          </Dropdown>

          {/* AUM Range Filter */}
          <Dropdown
            trigger={
              <div className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50 cursor-pointer">
                <DollarSign className="h-4 w-4 text-slate-400" />
                <span>{AUM_RANGES[aumRangeIndex]?.label || 'Any AUM'}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            }
            align="left"
          >
            {AUM_RANGES.map((range, index) => (
              <DropdownItem
                key={range.label}
                onClick={() => { setAumRangeIndex(index); setPage(1); }}
              >
                <span className={aumRangeIndex === index ? 'font-medium text-primary-700' : ''}>
                  {range.label}
                </span>
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="md" onClick={handleClearFilters}>
              <X className="mr-1 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Industry Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-slate-500 mr-2 self-center">Industry:</span>
        {SECTORS.map((sector) => (
          <button
            key={sector}
            onClick={() => toggleIndustryFilter(sector)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              industryFilter.includes(sector)
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Geography Filter Chips */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-slate-500 mr-2 self-center">Geography:</span>
        {GEOGRAPHIES.map((geo) => (
          <button
            key={geo}
            onClick={() => toggleGeographyFilter(geo)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              geographyFilter.includes(geo)
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {geo}
          </button>
        ))}
      </div>

      {/* Organizations Grid */}
      {organizations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <OrganizationCard
              key={org.id}
              organization={{
                ...org,
                type: org.type as OrganizationType,
                subType: org.subType as OrganizationSubType | null,
              }}
              onClick={handleViewOrganization}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={<Building2 className="h-12 w-12" />}
              title="No organizations found"
              description={
                hasActiveFilters
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first organization'
              }
              action={
                hasActiveFilters
                  ? { label: 'Clear Filters', onClick: handleClearFilters }
                  : { label: 'Add Organization', onClick: () => setIsAddModalOpen(true) }
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 0 && totalItems > 0 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      {/* Add Organization Modal */}
      <AddOrganizationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateOrganization}
        isLoading={createOrganizationMutation.isPending}
      />
    </div>
  );
}
