'use client';

import { useState } from 'react';

import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import toast from 'react-hot-toast';

import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  Calendar,
  Users,
  Edit,
  Trash2,
  DollarSign,
  Briefcase,
  Target,
  Activity,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Clock,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { Tabs, TabsList, TabTrigger, TabContent } from '@/components/ui/Tabs';
import { trpc } from '@/lib/trpc/client';
import { formatLargeNumber, formatDate, formatRelativeTime, cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type TabType = 'overview' | 'portfolio' | 'contacts' | 'activity';

// Type for organization data with counts (extends router return type)
type OrganizationWithCounts = {
  id: string;
  name: string;
  legalName: string | null;
  slug: string;
  type: string;
  subType: string | null;
  aum: number | null;
  fundVintage: number | null;
  industryFocus: string[];
  geographyFocus: string[];
  dealSizeMin: number | null;
  dealSizeMax: number | null;
  website: string | null;
  description: string | null;
  headquarters: string | null;
  logoUrl: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  _count?: {
    contacts: number;
    ownedStakes: number;
    ownedByStakes: number;
    spacs: number;
  };
  contacts?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    title: string | null;
    type: string | null;
    status: string | null;
  }>;
  ownedStakes?: Array<{
    id: string;
    ownedEntity: {
      id: string;
      name: string;
      type: string;
    };
  }>;
  activities?: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: Date;
  }>;
};

// ============================================================================
// CONSTANTS - Label mappings
// ============================================================================

const ORGANIZATION_TYPE_LABELS: Record<string, string> = {
  PE_FIRM: 'PE Firm',
  IB: 'Investment Bank',
  TARGET_COMPANY: 'Target Company',
  SERVICE_PROVIDER: 'Service Provider',
  LAW_FIRM: 'Law Firm',
  ACCOUNTING_FIRM: 'Accounting Firm',
  OTHER: 'Other',
};

const ORGANIZATION_SUBTYPE_LABELS: Record<string, string> = {
  // PE sub-types
  BUYOUT: 'Buyout',
  GROWTH_EQUITY: 'Growth Equity',
  VENTURE_CAPITAL: 'Venture Capital',
  FAMILY_OFFICE: 'Family Office',
  SOVEREIGN_WEALTH: 'Sovereign Wealth',
  HEDGE_FUND: 'Hedge Fund',
  // IB sub-types
  BULGE_BRACKET: 'Bulge Bracket',
  MIDDLE_MARKET: 'Middle Market',
  BOUTIQUE: 'Boutique',
  REGIONAL: 'Regional',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTypeBadgeVariant(type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (type) {
    case 'PE_FIRM':
      return 'primary';
    case 'IB':
      return 'success';
    case 'LAW_FIRM':
      return 'secondary';
    case 'ACCOUNTING_FIRM':
      return 'secondary';
    case 'TARGET_COMPANY':
      return 'warning';
    default:
      return 'secondary';
  }
}

function getSubTypeBadgeVariant(subType: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (subType) {
    case 'BUYOUT':
    case 'BULGE_BRACKET':
      return 'primary';
    case 'GROWTH_EQUITY':
    case 'MIDDLE_MARKET':
      return 'success';
    case 'VENTURE_CAPITAL':
    case 'BOUTIQUE':
      return 'warning';
    default:
      return 'secondary';
  }
}

// ============================================================================
// SKELETON COMPONENT
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
          <div className="h-10 w-24 bg-slate-200 rounded" />
          <div className="h-10 w-24 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Metrics skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-200" />
                <div className="flex-1">
                  <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                  <div className="h-6 w-24 bg-slate-200 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className="h-10 w-full bg-slate-200 rounded" />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="h-5 w-32 bg-slate-200 rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-slate-200 rounded" />
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
// ERROR STATE COMPONENT
// ============================================================================

function ErrorState({ id, message, onRetry }: { id: string; message?: string; onRetry: () => void }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-100 mb-6">
        <AlertCircle className="h-10 w-10 text-danger-600" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load Organization</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        {message || `Unable to load organization with ID "${id}". Please try again.`}
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
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Organization Not Found</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        The organization with ID "{id}" could not be found. It may have been deleted or you may not have access to it.
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={() => router.push('/organizations')}>
          View All Organizations
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// DELETE CONFIRMATION MODAL
// ============================================================================

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  organizationName: string;
  isDeleting: boolean;
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, organizationName, isDeleting }: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>Delete Organization</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <p className="text-slate-600">
          Are you sure you want to delete <span className="font-semibold">{organizationName}</span>? This action cannot be undone.
        </p>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// PLACEHOLDER TAB COMPONENTS
// ============================================================================

function PortfolioTab({ organizationId }: { organizationId: string }) {
  // TODO: Will use ownership.listByOwner when implemented
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Companies</CardTitle>
        <CardDescription>Companies owned or invested in by this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<Briefcase className="h-12 w-12" />}
          title="Portfolio data coming soon"
          description={`Portfolio companies for organization ${organizationId} will be displayed here using the ownership.listByOwner endpoint.`}
        />
      </CardContent>
    </Card>
  );
}

function ContactsTab({ organizationId }: { organizationId: string }) {
  // TODO: Will use contact.listByOrganization when implemented
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts</CardTitle>
        <CardDescription>People associated with this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<Users className="h-12 w-12" />}
          title="Contacts coming soon"
          description={`Contacts for organization ${organizationId} will be displayed here using the contact.listByOrganization endpoint.`}
        />
      </CardContent>
    </Card>
  );
}

function ActivityTab({ organizationId }: { organizationId: string }) {
  // TODO: Will use activity.listByOrganization when implemented
  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent activity and events for this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <EmptyState
          icon={<Activity className="h-12 w-12" />}
          title="Activity feed coming soon"
          description={`Activity timeline for organization ${organizationId} will be displayed here using the activity.listByOrganization endpoint.`}
        />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function OrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params['id'] as string;

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: organizationData,
    isLoading,
    isError,
    error,
    refetch,
  } = trpc.organization.getById.useQuery(
    { id, include: { contacts: true, ownedStakes: true, activities: true } },
    {
      enabled: !!id,
      retry: 1,
    }
  );

  // Type assertion to include _count which is returned by the router
  const organization = organizationData as OrganizationWithCounts | undefined;

  const deleteMutation = trpc.organization.delete.useMutation({
    onSuccess: () => {
      toast.success('Organization deleted successfully');
      router.push('/organizations');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete organization');
    },
  });

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = () => {
    deleteMutation.mutate({ id });
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

  if (!organization) {
    return <NotFoundState id={id} />;
  }

  // ============================================================================
  // TAB DEFINITIONS
  // ============================================================================

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, count: organization._count?.ownedStakes || 0 },
    { id: 'contacts', label: 'Contacts', icon: Users, count: organization._count?.contacts || 0 },
    { id: 'activity', label: 'Activity', icon: Activity },
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
            href="/organizations"
            className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          {/* Organization Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
              {organization.logoUrl ? (
                <img
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7 text-primary-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{organization.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge variant={getTypeBadgeVariant(organization.type)}>
                  {ORGANIZATION_TYPE_LABELS[organization.type] || organization.type}
                </Badge>
                {organization.subType && (
                  <Badge variant={getSubTypeBadgeVariant(organization.subType)} size="sm">
                    {ORGANIZATION_SUBTYPE_LABELS[organization.subType] || organization.subType}
                  </Badge>
                )}
                {organization.website && (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={() => router.push(`/organizations/${organization.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* ================================================================== */}
      {/* KEY METRICS ROW */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* AUM */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">AUM</p>
                <p className="text-xl font-bold text-slate-900">
                  {organization.aum ? formatLargeNumber(organization.aum) : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fund Vintage */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <Calendar className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Fund Vintage</p>
                <p className="text-xl font-bold text-slate-900">
                  {organization.fundVintage || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Portfolio Companies */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
                <Briefcase className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Portfolio</p>
                <p className="text-xl font-bold text-slate-900">
                  {organization._count?.ownedStakes || 0}
                </p>
                <p className="text-xs text-slate-500">companies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacts */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Contacts</p>
                <p className="text-xl font-bold text-slate-900">
                  {organization._count?.contacts || 0}
                </p>
                <p className="text-xs text-slate-500">people</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* TABS */}
      {/* ================================================================== */}
      <Tabs defaultValue="overview" onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList variant="default" aria-label="Organization Details">
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
              {/* Organization Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-500">Name</p>
                      <p className="text-sm text-slate-900">{organization.name}</p>
                    </div>
                    {organization.legalName && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Legal Name</p>
                        <p className="text-sm text-slate-900">{organization.legalName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-medium text-slate-500">Type</p>
                      <div className="mt-1">
                        <Badge variant={getTypeBadgeVariant(organization.type)} size="sm">
                          {ORGANIZATION_TYPE_LABELS[organization.type] || organization.type}
                        </Badge>
                      </div>
                    </div>
                    {organization.subType && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Sub-Type</p>
                        <div className="mt-1">
                          <Badge variant={getSubTypeBadgeVariant(organization.subType)} size="sm">
                            {ORGANIZATION_SUBTYPE_LABELS[organization.subType] || organization.subType}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {organization.headquarters && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Headquarters</p>
                        <p className="text-sm text-slate-900 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {organization.headquarters}
                        </p>
                      </div>
                    )}
                    {organization.foundedYear && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Founded</p>
                        <p className="text-sm text-slate-900">{organization.foundedYear}</p>
                      </div>
                    )}
                    {organization.employeeCount && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Employees</p>
                        <p className="text-sm text-slate-900">{organization.employeeCount.toLocaleString()}</p>
                      </div>
                    )}
                    {organization.website && (
                      <div>
                        <p className="text-xs font-medium text-slate-500">Website</p>
                        <a
                          href={organization.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                        >
                          {organization.website.replace(/^https?:\/\//, '')}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {organization.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{organization.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Investment Focus (for PE/IB types) */}
              {(organization.type === 'PE_FIRM' || organization.type === 'IB') && (
                <Card>
                  <CardHeader>
                    <CardTitle>Investment Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {organization.aum && (
                        <div>
                          <p className="text-xs font-medium text-slate-500">Assets Under Management</p>
                          <p className="text-lg font-semibold text-slate-900">
                            {formatLargeNumber(organization.aum)}
                          </p>
                        </div>
                      )}
                      {organization.fundVintage && (
                        <div>
                          <p className="text-xs font-medium text-slate-500">Fund Vintage Year</p>
                          <p className="text-lg font-semibold text-slate-900">{organization.fundVintage}</p>
                        </div>
                      )}
                      {(organization.dealSizeMin || organization.dealSizeMax) && (
                        <div className="sm:col-span-2">
                          <p className="text-xs font-medium text-slate-500">Deal Size Range</p>
                          <p className="text-sm text-slate-900">
                            {organization.dealSizeMin ? formatLargeNumber(organization.dealSizeMin) : 'No min'} -{' '}
                            {organization.dealSizeMax ? formatLargeNumber(organization.dealSizeMax) : 'No max'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Industry Focus */}
              {organization.industryFocus && organization.industryFocus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Industry Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {organization.industryFocus.map((industry) => (
                        <Badge key={industry} variant="secondary" size="sm">
                          <Target className="mr-1 h-3 w-3" />
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Geography Focus */}
              {organization.geographyFocus && organization.geographyFocus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Geography Focus</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {organization.geographyFocus.map((geography) => (
                        <Badge key={geography} variant="secondary" size="sm">
                          <Globe className="mr-1 h-3 w-3" />
                          {geography}
                        </Badge>
                      ))}
                    </div>
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
                      <span className="text-sm text-slate-500">Portfolio Companies</span>
                      <span className="font-medium text-slate-900">
                        {organization._count?.ownedStakes || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Contacts</span>
                      <span className="font-medium text-slate-900">
                        {organization._count?.contacts || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">SPACs</span>
                      <span className="font-medium text-slate-900">
                        {organization._count?.spacs || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Metadata */}
              <Card>
                <CardHeader>
                  <CardTitle>Metadata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Created
                      </span>
                      <span className="text-sm text-slate-900">{formatDate(organization.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        Updated
                      </span>
                      <span className="text-sm text-slate-900">{formatRelativeTime(organization.updatedAt)}</span>
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
                    onClick={() => setActiveTab('portfolio')}
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    View Portfolio
                  </Button>
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
                    onClick={() => setActiveTab('activity')}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Activity
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabContent>

        {/* ================================================================== */}
        {/* PORTFOLIO TAB */}
        {/* ================================================================== */}
        <TabContent value="portfolio">
          <PortfolioTab organizationId={id} />
        </TabContent>

        {/* ================================================================== */}
        {/* CONTACTS TAB */}
        {/* ================================================================== */}
        <TabContent value="contacts">
          <ContactsTab organizationId={id} />
        </TabContent>

        {/* ================================================================== */}
        {/* ACTIVITY TAB */}
        {/* ================================================================== */}
        <TabContent value="activity">
          <ActivityTab organizationId={id} />
        </TabContent>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        organizationName={organization.name}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
