'use client';

import { useState, useMemo, useCallback } from 'react';

import Link from 'next/link';
import toast from 'react-hot-toast';

import {
  Building2,
  Plus,
  Search,
  Filter,
  Globe,
  MapPin,
  Users,
  Briefcase,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
  X,
} from 'lucide-react';

import { AddCompanyForm, EditCompanyForm } from '@/components/companies/CompanyModals';
import type { NewCompanyData, EditCompanyData } from '@/components/companies/CompanyModals';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { trpc } from '@/lib/trpc';

// ============================================================================
// Types
// ============================================================================

const COMPANY_TYPE_OPTIONS = [
  'all',
  'Investment Bank',
  'Law Firm',
  'Target',
  'Sponsor',
  'Advisor',
  'Accounting Firm',
  'Other',
] as const;

const INDUSTRY_OPTIONS = [
  'all',
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer',
  'Industrials',
  'Energy',
  'Real Estate',
  'Other',
] as const;

const SIZE_OPTIONS = [
  'all',
  '1-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
] as const;

type CompanyType = (typeof COMPANY_TYPE_OPTIONS)[number];
type IndustryType = (typeof INDUSTRY_OPTIONS)[number];
type SizeType = (typeof SIZE_OPTIONS)[number];

// ============================================================================
// Helper Components
// ============================================================================

function CompanySkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-12 w-12 rounded-lg bg-slate-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-3/4 rounded bg-slate-200" />
                  <div className="h-4 w-1/2 rounded bg-slate-200" />
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getTypeBadgeVariant(type: string | null | undefined): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (type) {
    case 'Investment Bank':
      return 'primary';
    case 'Law Firm':
      return 'warning';
    case 'Target':
      return 'success';
    case 'Sponsor':
      return 'danger';
    case 'Advisor':
      return 'secondary';
    default:
      return 'secondary';
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function CompaniesPage() {
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState<IndustryType>('all');
  const [typeFilter, setTypeFilter] = useState<CompanyType>('all');
  const [sizeFilter, setSizeFilter] = useState<SizeType>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<EditCompanyData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // tRPC utilities
  const utils = trpc.useUtils();

  // tRPC Queries
  const companiesQuery = trpc.company.list.useQuery(
    {
      page: currentPage,
      pageSize: pageSize,
      industry: industryFilter !== 'all' ? industryFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      size: sizeFilter !== 'all' ? sizeFilter : undefined,
      search: searchQuery || undefined,
      sortBy: 'name',
      sortOrder: 'asc',
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  const statisticsQuery = trpc.company.getStatistics.useQuery({});

  // tRPC Mutations
  const createCompanyMutation = trpc.company.create.useMutation({
    onSuccess: () => {
      utils.company.list.invalidate();
      utils.company.getStatistics.invalidate();
      setIsAddModalOpen(false);
      toast.success('Company created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create company: ${error.message}`);
    },
  });

  const deleteCompanyMutation = trpc.company.delete.useMutation({
    onSuccess: () => {
      utils.company.list.invalidate();
      utils.company.getStatistics.invalidate();
      toast.success('Company deleted successfully');
    },
    onError: (error) => {
      toast.error(`Failed to delete company: ${error.message}`);
    },
  });

  // Derived data
  const companies = useMemo(() => {
    return companiesQuery.data?.items || [];
  }, [companiesQuery.data]);

  const stats = useMemo(() => {
    if (!statisticsQuery.data) {
      return {
        total: 0,
        byIndustry: [],
        byType: [],
      };
    }
    return {
      total: statisticsQuery.data.total,
      byIndustry: statisticsQuery.data.byIndustry || [],
      byType: statisticsQuery.data.byType || [],
    };
  }, [statisticsQuery.data]);

  // Handlers
  const handleCreateCompany = useCallback(
    (data: NewCompanyData) => {
      createCompanyMutation.mutate({
        name: data.name,
        industry: data.industry || null,
        type: data.type || null,
        size: data.size || null,
        headquarters: data.headquarters || null,
        website: data.website || null,
        description: data.description || null,
        foundedYear: data.foundedYear || null,
      });
    },
    [createCompanyMutation]
  );

  const handleDeleteCompany = useCallback(
    (companyId: string) => {
      if (confirm('Are you sure you want to delete this company?')) {
        deleteCompanyMutation.mutate({ id: companyId, cascadeContacts: false });
      }
    },
    [deleteCompanyMutation]
  );

  const handleRetry = () => {
    companiesQuery.refetch();
    statisticsQuery.refetch();
  };

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setIndustryFilter('all');
    setTypeFilter('all');
    setSizeFilter('all');
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = searchQuery || industryFilter !== 'all' || typeFilter !== 'all' || sizeFilter !== 'all';

  // Loading state
  if (companiesQuery.isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Companies</h1>
          <p className="page-description">Manage your CRM company profiles and deal history</p>
        </div>

        {/* Loading skeleton */}
        <CompanySkeleton />
      </div>
    );
  }

  // Error state
  if (companiesQuery.isError) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Companies</h1>
          <p className="page-description">Manage your CRM company profiles and deal history</p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-danger-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Failed to load companies</h3>
            <p className="mt-2 text-sm text-slate-500">
              {companiesQuery.error?.message || 'An error occurred while loading companies.'}
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
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Companies</h1>
          <p className="page-description">
            Manage your CRM company profiles and deal history
            {companiesQuery.data?.total ? ` - ${companiesQuery.data.total} total companies` : ''}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Building2 className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-2">
                <Briefcase className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.byType.find((t) => t.type === 'Target')?.count || 0}
                </p>
                <p className="text-sm text-slate-500">Target Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-100 p-2">
                <Users className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.byType.find((t) => t.type === 'Investment Bank')?.count || 0}
                </p>
                <p className="text-sm text-slate-500">Investment Banks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Globe className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.byIndustry.length}</p>
                <p className="text-sm text-slate-500">Industries</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="input pl-10"
          />
        </div>

        {/* Industry Filter Dropdown */}
        <Dropdown
          trigger={
            <Button variant="secondary" size="md">
              <Filter className="mr-2 h-4 w-4" />
              {industryFilter === 'all' ? 'All Industries' : industryFilter}
            </Button>
          }
          align="right"
        >
          {INDUSTRY_OPTIONS.map((industry) => (
            <DropdownItem
              key={industry}
              onClick={() => {
                setIndustryFilter(industry);
                setCurrentPage(1);
              }}
            >
              <span className={industryFilter === industry ? 'font-medium text-primary-600' : ''}>
                {industry === 'all' ? 'All Industries' : industry}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Type Filter Dropdown */}
        <Dropdown
          trigger={
            <Button variant="secondary" size="md">
              <Briefcase className="mr-2 h-4 w-4" />
              {typeFilter === 'all' ? 'All Types' : typeFilter}
            </Button>
          }
          align="right"
        >
          {COMPANY_TYPE_OPTIONS.map((type) => (
            <DropdownItem
              key={type}
              onClick={() => {
                setTypeFilter(type);
                setCurrentPage(1);
              }}
            >
              <span className={typeFilter === type ? 'font-medium text-primary-600' : ''}>
                {type === 'all' ? 'All Types' : type}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Size Filter Dropdown */}
        <Dropdown
          trigger={
            <Button variant="secondary" size="md">
              <Users className="mr-2 h-4 w-4" />
              {sizeFilter === 'all' ? 'All Sizes' : `${sizeFilter} employees`}
            </Button>
          }
          align="right"
        >
          {SIZE_OPTIONS.map((size) => (
            <DropdownItem
              key={size}
              onClick={() => {
                setSizeFilter(size);
                setCurrentPage(1);
              }}
            >
              <span className={sizeFilter === size ? 'font-medium text-primary-600' : ''}>
                {size === 'all' ? 'All Sizes' : `${size} employees`}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="ghost" size="md" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Company Grid */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">
              {hasActiveFilters
                ? 'No companies match your filters'
                : 'No companies yet. Add your first company to get started.'}
            </p>
            {hasActiveFilters ? (
              <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            ) : (
              <Button variant="primary" size="md" className="mt-4" onClick={() => setIsAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="group cursor-pointer transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <Link href={`/companies/${company.id}`} className="flex-1">
                      <div className="flex items-start gap-3">
                        {/* Company Avatar */}
                        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company.name}
                              className="h-8 w-8 rounded object-cover"
                            />
                          ) : (
                            <Building2 className="h-6 w-6 text-primary-600" />
                          )}
                        </div>

                        {/* Company Info */}
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-slate-900 truncate group-hover:text-primary-600 transition-colors">
                            {company.name}
                          </h3>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {company.type && (
                              <Badge variant={getTypeBadgeVariant(company.type)} size="sm">
                                {company.type}
                              </Badge>
                            )}
                            {company.industry && (
                              <Badge variant="secondary" size="sm">
                                {company.industry}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Details */}
                      <div className="mt-3 space-y-1">
                        {company.headquarters && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{company.headquarters}</span>
                          </div>
                        )}
                        {company.website && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">
                              {company.website.replace(/^https?:\/\//, '')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="mt-3 flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-slate-500">
                          <Users className="h-3.5 w-3.5" />
                          <span>{company._count?.contacts || 0} contacts</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <Briefcase className="h-3.5 w-3.5" />
                          <span>{company._count?.deals || 0} deals</span>
                        </div>
                      </div>
                    </Link>

                    {/* Actions Menu */}
                    <Dropdown
                      trigger={
                        <button className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      }
                      align="right"
                    >
                      <DropdownItem onClick={() => (window.location.href = `/companies/${company.id}`)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownItem>
                      <DropdownItem onClick={() => {
                        setEditingCompany(company);
                        setIsEditModalOpen(true);
                      }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownItem>
                      <DropdownDivider />
                      <DropdownItem
                        onClick={() => handleDeleteCompany(company.id)}
                        className="text-danger-600 hover:bg-danger-50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {companiesQuery.data && companiesQuery.data.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={companiesQuery.data.totalPages}
              totalItems={companiesQuery.data.total}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}
        </>
      )}

      {/* Add Company Modal */}
      <AddCompanyForm
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateCompany}
        isLoading={createCompanyMutation.isPending}
      />

      {/* Edit Company Modal */}
      {isEditModalOpen && editingCompany && (
        <EditCompanyForm
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingCompany(null);
          }}
          company={editingCompany}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setEditingCompany(null);
          }}
        />
      )}
    </div>
  );
}
