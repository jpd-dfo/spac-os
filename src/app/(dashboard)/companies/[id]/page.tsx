'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Edit,
  Globe,
  MapPin,
  Users,
  Briefcase,
  FileText,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Tabs, TabsList, TabTrigger, TabContent } from '@/components/ui/Tabs';
import { AddDealModal } from '@/components/companies/AddDealModal';
import { CONTACT_TYPE_LABELS } from '@/lib/constants';
import { trpc } from '@/lib/trpc/client';
import { formatLargeNumber, formatDate, formatRelativeTime, cn } from '@/lib/utils';

// ============================================================================
// TAB TYPES
// ============================================================================

type TabType = 'overview' | 'contacts' | 'deals';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

function getDealStatusBadge(status: string) {
  switch (status) {
    case 'Won':
      return <Badge variant="success" size="sm">Won</Badge>;
    case 'Lost':
      return <Badge variant="danger" size="sm">Lost</Badge>;
    case 'In Progress':
      return <Badge variant="warning" size="sm">In Progress</Badge>;
    default:
      return <Badge variant="secondary" size="sm">{status}</Badge>;
  }
}

function getContactTypeBadgeVariant(type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (type) {
    case 'INVESTOR':
      return 'success';
    case 'BANKER':
      return 'primary';
    case 'LEGAL':
      return 'warning';
    case 'ADVISOR':
      return 'secondary';
    default:
      return 'secondary';
  }
}

// ============================================================================
// SKELETON COMPONENTS
// ============================================================================

function DetailSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-xl bg-slate-200" />
            <div>
              <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
              <div className="flex items-center gap-3">
                <div className="h-5 w-16 bg-slate-200 rounded" />
                <div className="h-5 w-24 bg-slate-200 rounded" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-200 rounded" />
          <div className="h-10 w-28 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 w-full bg-slate-200 rounded" />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-slate-200 rounded" />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-24 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-slate-200 rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ERROR STATE COMPONENTS
// ============================================================================

function ErrorState({ id, message, onRetry }: { id: string; message?: string; onRetry: () => void }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-100 mb-6">
        <AlertCircle className="h-10 w-10 text-danger-600" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Company</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        {message || `Unable to load company with ID "${id}". Please try again.`}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    </div>
  );
}

function NotFoundState({ id }: { id: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 mb-6">
        <Building2 className="h-10 w-10 text-slate-400" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Company Not Found</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        The company with ID "{id}" could not be found. It may have been deleted or you may not have access to it.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={() => router.push('/companies')}>
          View All Companies
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// EDIT COMPANY MODAL
// ============================================================================

const COMPANY_TYPE_OPTIONS = [
  'Investment Bank',
  'Law Firm',
  'Target',
  'Sponsor',
  'Advisor',
  'Accounting Firm',
  'Other',
] as const;

const INDUSTRY_OPTIONS = [
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
  '1-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
] as const;

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: {
    id: string;
    name: string;
    industry: string | null;
    type: string | null;
    size: string | null;
    headquarters: string | null;
    website: string | null;
    description: string | null;
    foundedYear: number | null;
  };
  onSuccess: () => void;
}

function EditCompanyModal({ isOpen, onClose, company, onSuccess }: EditCompanyModalProps) {
  const [formData, setFormData] = useState({
    name: company.name,
    industry: company.industry || '',
    type: company.type || '',
    size: company.size || '',
    headquarters: company.headquarters || '',
    website: company.website || '',
    description: company.description || '',
    foundedYear: company.foundedYear || undefined as number | undefined,
  });

  const utils = trpc.useUtils();

  const updateCompanyMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      utils.company.getById.invalidate({ id: company.id });
      toast.success('Company updated successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to update company: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    updateCompanyMutation.mutate({
      id: company.id,
      data: {
        name: formData.name.trim(),
        industry: formData.industry || null,
        type: formData.type || null,
        size: formData.size || null,
        headquarters: formData.headquarters || null,
        website: formData.website || null,
        description: formData.description || null,
        foundedYear: formData.foundedYear || null,
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Edit Company</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="edit-company-name" className="block text-sm font-medium text-slate-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-company-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="input w-full"
                placeholder="Acme Corporation"
                required
              />
            </div>

            {/* Type and Industry Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-company-type" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Type
                </label>
                <select
                  id="edit-company-type"
                  value={formData.type}
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Select type...</option>
                  {COMPANY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-company-industry" className="block text-sm font-medium text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  id="edit-company-industry"
                  value={formData.industry}
                  onChange={(e) => setFormData((prev) => ({ ...prev, industry: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size and Founded Year Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-company-size" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Size
                </label>
                <select
                  id="edit-company-size"
                  value={formData.size}
                  onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                  className="input w-full"
                >
                  <option value="">Select size...</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-company-founded" className="block text-sm font-medium text-slate-700 mb-1">
                  Founded Year
                </label>
                <input
                  id="edit-company-founded"
                  type="number"
                  value={formData.foundedYear || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      foundedYear: e.target.value ? parseInt(e.target.value, 10) : undefined,
                    }))
                  }
                  className="input w-full"
                  placeholder="2020"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Headquarters */}
            <div>
              <label htmlFor="edit-company-headquarters" className="block text-sm font-medium text-slate-700 mb-1">
                Headquarters
              </label>
              <input
                id="edit-company-headquarters"
                type="text"
                value={formData.headquarters}
                onChange={(e) => setFormData((prev) => ({ ...prev, headquarters: e.target.value }))}
                className="input w-full"
                placeholder="New York, NY"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="edit-company-website" className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <input
                id="edit-company-website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                className="input w-full"
                placeholder="https://example.com"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-company-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="edit-company-description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="input w-full"
                rows={3}
                placeholder="Brief description of the company..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={updateCompanyMutation.isPending}>
            {updateCompanyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CompanyDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params['id'] as string;
  const [_activeTab, setActiveTab] = useState<TabType>('overview');
  const [isAddDealModalOpen, setIsAddDealModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // tRPC Utils
  const utils = trpc.useUtils();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: company,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.company.getById.useQuery(
    { id },
    {
      enabled: !!id,
      retry: 1,
    }
  );

  // Delete deal mutation
  const deleteDealMutation = trpc.company.deleteDeal.useMutation({
    onSuccess: () => {
      toast.success('Deal deleted successfully');
      utils.company.getById.invalidate({ id });
    },
    onError: (error) => {
      toast.error(`Failed to delete deal: ${error.message}`);
    },
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const dealStats = useMemo(() => {
    if (!company?.deals) {
      return { total: 0, won: 0, lost: 0, inProgress: 0, totalValue: 0, wonValue: 0 };
    }

    const deals = company.deals;
    return {
      total: deals.length,
      won: deals.filter((d) => d.status === 'Won').length,
      lost: deals.filter((d) => d.status === 'Lost').length,
      inProgress: deals.filter((d) => d.status === 'In Progress').length,
      totalValue: deals.reduce((sum, d) => sum + (d.value || 0), 0),
      wonValue: deals.filter((d) => d.status === 'Won').reduce((sum, d) => sum + (d.value || 0), 0),
    };
  }, [company?.deals]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDeleteDeal = (dealId: string) => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteDealMutation.mutate({ id: dealId });
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return <DetailSkeleton />;
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (isError) {
    const errorMessage = error?.message;
    if (errorMessage?.includes('not found') || errorMessage?.includes('NOT_FOUND')) {
      return <NotFoundState id={id} />;
    }
    return <ErrorState id={id} message={errorMessage} onRetry={() => refetch()} />;
  }

  if (!company) {
    return <NotFoundState id={id} />;
  }

  // ============================================================================
  // TAB DEFINITIONS
  // ============================================================================

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Users, count: company._count?.contacts || 0 },
    { id: 'deals', label: 'Deal History', icon: Briefcase, count: company._count?.deals || 0 },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {/* Back Button */}
          <Link
            href="/companies"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Company Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
              {company.logoUrl ? (
                <img
                  src={company.logoUrl}
                  alt={company.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-primary-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                {company.type && (
                  <Badge variant={getTypeBadgeVariant(company.type)} size="md">
                    {company.type}
                  </Badge>
                )}
                {company.industry && (
                  <span className="text-sm text-slate-500">{company.industry}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {company.website && (
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.open(company.website!, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Website
            </Button>
          )}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Company
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KEY METRICS ROW */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Contacts Count */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Contacts</p>
                <p className="text-xl font-bold text-slate-900">{company._count?.contacts || 0}</p>
                <p className="text-xs text-slate-500">people at this company</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Deals */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Briefcase className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Deals</p>
                <p className="text-xl font-bold text-slate-900">{dealStats.total}</p>
                <p className="text-xs text-slate-500">in history</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Won Deals */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Won Deals</p>
                <p className="text-xl font-bold text-slate-900">{dealStats.won}</p>
                <p className="text-xs text-slate-500">
                  {dealStats.wonValue > 0 ? formatLargeNumber(dealStats.wonValue) : 'N/A'} value
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
                <DollarSign className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Deal Value</p>
                <p className="text-xl font-bold text-slate-900">
                  {dealStats.totalValue > 0 ? formatLargeNumber(dealStats.totalValue) : '-'}
                </p>
                <p className="text-xs text-slate-500">all deals combined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* TABS */}
      {/* ================================================================== */}
      <Tabs defaultValue="overview" onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList variant="default" aria-label="Company Details">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabTrigger key={tab.id} value={tab.id}>
                <Icon className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.slice(0, 3)}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-600">
                    {tab.count}
                  </span>
                )}
              </TabTrigger>
            );
          })}
        </TabsList>

        {/* ================================================================== */}
        {/* OVERVIEW TAB */}
        {/* ================================================================== */}
        <TabContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Company Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Name</p>
                      <p className="text-sm text-slate-900">{company.name}</p>
                    </div>
                    {company.type && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Type</p>
                        <div className="mt-1">
                          <Badge variant={getTypeBadgeVariant(company.type)} size="sm">
                            {company.type}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {company.industry && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Industry</p>
                        <p className="text-sm text-slate-900">{company.industry}</p>
                      </div>
                    )}
                    {company.size && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Company Size</p>
                        <p className="text-sm text-slate-900">{company.size} employees</p>
                      </div>
                    )}
                    {company.foundedYear && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Founded</p>
                        <p className="text-sm text-slate-900">{company.foundedYear}</p>
                      </div>
                    )}
                    {company.headquarters && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Headquarters</p>
                        <div className="flex items-center gap-1 text-sm text-slate-900">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {company.headquarters}
                        </div>
                      </div>
                    )}
                    {company.website && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Website</p>
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          {company.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500">Created</p>
                      <p className="text-sm text-slate-900">{formatDate(company.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Last Updated</p>
                      <p className="text-sm text-slate-900">{formatRelativeTime(company.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {company.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{company.description}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Summary Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Contacts</span>
                      <span className="font-medium text-slate-900">{company._count?.contacts || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Total Deals</span>
                      <span className="font-medium text-slate-900">{dealStats.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Won Deals</span>
                      <span className="font-medium text-success-600">{dealStats.won}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Lost Deals</span>
                      <span className="font-medium text-danger-600">{dealStats.lost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">In Progress</span>
                      <span className="font-medium text-warning-600">{dealStats.inProgress}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => setActiveTab('contacts')}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    View Contacts
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-full justify-start"
                    size="sm"
                    onClick={() => {
                      setActiveTab('deals');
                      setIsAddDealModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Deal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabContent>

        {/* ================================================================== */}
        {/* CONTACTS TAB */}
        {/* ================================================================== */}
        <TabContent value="contacts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contacts at {company.name}</CardTitle>
                  <CardDescription>People associated with this company</CardDescription>
                </div>
                <Button variant="primary" size="sm" onClick={() => router.push('/contacts?company=' + company.id)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!company.contacts || company.contacts.length === 0 ? (
                <EmptyState
                  icon={<Users className="h-12 w-12" />}
                  title="No contacts yet"
                  description="Add contacts to this company to track your relationships"
                  action={{
                    label: 'Add Contact',
                    onClick: () => router.push('/contacts'),
                  }}
                />
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header>Name</TableCell>
                      <TableCell header>Title</TableCell>
                      <TableCell header>Type</TableCell>
                      <TableCell header>Contact</TableCell>
                      <TableCell header className="w-20">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {company.contacts.map((contact) => (
                      <TableRow key={contact.id} className="cursor-pointer hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-sm font-medium">
                              {contact.firstName[0]}
                              {contact.lastName[0]}
                            </div>
                            <span className="font-medium text-slate-900">
                              {contact.firstName} {contact.lastName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{contact.title || '-'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getContactTypeBadgeVariant(contact.type)} size="sm">
                            {CONTACT_TYPE_LABELS[contact.type] || contact.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {contact.email && (
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-slate-400 hover:text-slate-600"
                                title={contact.email}
                              >
                                <Mail className="h-4 w-4" />
                              </a>
                            )}
                            {contact.phone && (
                              <a
                                href={`tel:${contact.phone}`}
                                className="text-slate-400 hover:text-slate-600"
                                title={contact.phone}
                              >
                                <Phone className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabContent>

        {/* ================================================================== */}
        {/* DEALS TAB */}
        {/* ================================================================== */}
        <TabContent value="deals">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Deal History</CardTitle>
                  <CardDescription>Track deals and engagements with this company</CardDescription>
                </div>
                <Button variant="primary" size="sm" onClick={() => setIsAddDealModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Deal
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Deal Stats */}
              <div className="mb-6 grid gap-4 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900">{dealStats.total}</p>
                  <p className="text-xs text-slate-500">Total Deals</p>
                </div>
                <div className="rounded-lg bg-success-50 p-3 text-center">
                  <p className="text-2xl font-bold text-success-700">{dealStats.won}</p>
                  <p className="text-xs text-success-600">Won</p>
                </div>
                <div className="rounded-lg bg-danger-50 p-3 text-center">
                  <p className="text-2xl font-bold text-danger-700">{dealStats.lost}</p>
                  <p className="text-xs text-danger-600">Lost</p>
                </div>
                <div className="rounded-lg bg-warning-50 p-3 text-center">
                  <p className="text-2xl font-bold text-warning-700">{dealStats.inProgress}</p>
                  <p className="text-xs text-warning-600">In Progress</p>
                </div>
              </div>

              {!company.deals || company.deals.length === 0 ? (
                <EmptyState
                  icon={<Briefcase className="h-12 w-12" />}
                  title="No deals yet"
                  description="Add deals to track your engagement history with this company"
                  action={{
                    label: 'Add Deal',
                    onClick: () => setIsAddDealModalOpen(true),
                  }}
                />
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell header>Deal Name</TableCell>
                      <TableCell header>Role</TableCell>
                      <TableCell header>Status</TableCell>
                      <TableCell header>Value</TableCell>
                      <TableCell header>Closed Date</TableCell>
                      <TableCell header className="w-20">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {company.deals.map((deal) => (
                      <TableRow
                        key={deal.id}
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => toast('Deal details view coming soon')}
                      >
                        <TableCell>
                          <span className="font-medium text-slate-900">{deal.dealName}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">{deal.role}</span>
                        </TableCell>
                        <TableCell>{getDealStatusBadge(deal.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-900">
                            {deal.value ? formatLargeNumber(deal.value) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {deal.closedAt ? formatDate(deal.closedAt) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Dropdown
                            trigger={
                              <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            }
                            align="right"
                          >
                            <DropdownItem onClick={() => handleDeleteDeal(deal.id)} className="text-danger-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Deal
                            </DropdownItem>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabContent>
      </Tabs>

      {/* Add Deal Modal */}
      <AddDealModal
        isOpen={isAddDealModalOpen}
        onClose={() => setIsAddDealModalOpen(false)}
        companyId={company.id}
        onSuccess={() => {
          utils.company.getById.invalidate({ id });
        }}
      />

      {/* Edit Company Modal */}
      {isEditModalOpen && (
        <EditCompanyModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          company={company}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  );
}
