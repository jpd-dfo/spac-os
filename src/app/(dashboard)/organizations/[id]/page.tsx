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
  FileText,
  Compass,
  Plus,
  PieChart as PieChartIcon,
  BarChart3,
  Percent,
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

type TabType = 'overview' | 'portfolio' | 'contacts' | 'activity' | 'mandates' | 'coverage' | 'ownership' | 'dealfit';

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
  // Sprint 12 - Target Company Financial Metrics
  revenue: number | null;
  ebitda: number | null;
  revenueGrowth: number | null;
  grossMargin: number | null;
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
// TAB COMPONENTS - WIRED TO REAL APIs
// ============================================================================

function PortfolioTab({ organizationId }: { organizationId: string }) {
  const { data, isLoading, isError, error } = trpc.ownership.listByOwner.useQuery(
    { ownerId: organizationId, limit: 50 },
    { retry: 1 }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Companies</CardTitle>
          <CardDescription>Companies owned or invested in by this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-danger-400 mb-3" />
            <p className="text-sm text-danger-600">{error?.message || 'Failed to load portfolio'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stakes = data?.stakes || [];

  if (stakes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Companies</CardTitle>
          <CardDescription>Companies owned or invested in by this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Briefcase className="h-12 w-12" />}
            title="No portfolio companies"
            description="This organization has not recorded any portfolio company investments yet."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Companies ({stakes.length})</CardTitle>
        <CardDescription>Companies owned or invested in by this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-200">
          {stakes.map((stake) => {
            const holdYears = stake.investmentDate
              ? Math.floor((Date.now() - new Date(stake.investmentDate).getTime()) / (365 * 24 * 60 * 60 * 1000))
              : null;
            const isApproachingExit = holdYears !== null && holdYears >= 5;

            return (
              <div key={stake.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Building2 className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <Link
                        href={`/organizations/${stake.owned.id}`}
                        className="font-medium text-slate-900 hover:text-primary-600 hover:underline"
                      >
                        {stake.owned.name}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {stake.owned.industryFocus?.join(', ') || stake.owned.type}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{stake.ownershipPct}%</p>
                    <Badge
                      variant={stake.exitStatus === 'ACTIVE' ? 'success' : stake.exitStatus === 'FULLY_EXITED' ? 'secondary' : 'warning'}
                      size="sm"
                    >
                      {stake.exitStatus.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  {stake.investmentDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Invested: {formatDate(stake.investmentDate)}
                    </span>
                  )}
                  {stake.entryMultiple && (
                    <span>Entry: {stake.entryMultiple.toFixed(1)}x</span>
                  )}
                  {holdYears !== null && (
                    <span className={cn(isApproachingExit && 'text-warning-600 font-medium')}>
                      <Clock className="inline h-3 w-3 mr-1" />
                      {holdYears} year{holdYears !== 1 ? 's' : ''} held
                      {isApproachingExit && ' (exit window)'}
                    </span>
                  )}
                  {stake.boardSeats && stake.boardSeats > 0 && (
                    <span>{stake.boardSeats} board seat{stake.boardSeats > 1 ? 's' : ''}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ContactsTab({ organizationId }: { organizationId: string }) {
  const { data: contacts, isLoading, isError, error } = trpc.contact.listByOrganization.useQuery(
    { organizationId, limit: 50 },
    { retry: 1 }
  );

  const SENIORITY_LABELS: Record<string, string> = {
    C_LEVEL: 'C-Level',
    PARTNER: 'Partner',
    MANAGING_DIRECTOR: 'Managing Director',
    VP: 'VP',
    DIRECTOR: 'Director',
    ASSOCIATE: 'Associate',
    ANALYST: 'Analyst',
  };

  const DEFAULT_RELATIONSHIP = { label: 'Cold', variant: 'secondary' as const };
  const RELATIONSHIP_CONFIG: Record<string, { label: string; variant: 'secondary' | 'warning' | 'danger' | 'success' }> = {
    COLD: { label: 'Cold', variant: 'secondary' },
    WARM: { label: 'Warm', variant: 'warning' },
    HOT: { label: 'Hot', variant: 'danger' },
    ADVOCATE: { label: 'Advocate', variant: 'success' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>People associated with this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-danger-400 mb-3" />
            <p className="text-sm text-danger-600">{error?.message || 'Failed to load contacts'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!contacts || contacts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>People associated with this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No contacts"
            description="No contacts have been linked to this organization yet."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacts ({contacts.length})</CardTitle>
        <CardDescription>People associated with this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map((contact) => {
            const relationshipConfig = RELATIONSHIP_CONFIG[contact.relationshipStrength || 'COLD'] ?? DEFAULT_RELATIONSHIP;

            return (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="block rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-semibold">
                    {contact.firstName?.[0] || ''}{contact.lastName?.[0] || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </p>
                    {contact.title && (
                      <p className="text-sm text-slate-500 truncate">{contact.title}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {contact.seniorityLevel && (
                        <Badge variant="secondary" size="sm">
                          {SENIORITY_LABELS[contact.seniorityLevel] || contact.seniorityLevel}
                        </Badge>
                      )}
                      <Badge variant={relationshipConfig.variant} size="sm">
                        {relationshipConfig.label}
                      </Badge>
                    </div>
                    {contact.lastInteractionAt && (
                      <p className="mt-2 text-xs text-slate-400">
                        Last contact: {formatRelativeTime(contact.lastInteractionAt)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityTab({ organizationId }: { organizationId: string }) {
  const { data, isLoading, isError, error } =
    trpc.activity.listByOrganization.useQuery(
      { organizationId, limit: 50 },
      { retry: 1 }
    );

  const ACTIVITY_TYPE_CONFIG: Record<string, { icon: typeof Activity; label: string; color: string }> = {
    EMAIL_SENT: { icon: Activity, label: 'Email Sent', color: 'text-blue-600 bg-blue-100' },
    EMAIL_RECEIVED: { icon: Activity, label: 'Email Received', color: 'text-blue-600 bg-blue-100' },
    MEETING_SCHEDULED: { icon: Calendar, label: 'Meeting Scheduled', color: 'text-purple-600 bg-purple-100' },
    MEETING_COMPLETED: { icon: Calendar, label: 'Meeting Completed', color: 'text-purple-600 bg-purple-100' },
    CALL_MADE: { icon: Activity, label: 'Call Made', color: 'text-green-600 bg-green-100' },
    CALL_RECEIVED: { icon: Activity, label: 'Call Received', color: 'text-green-600 bg-green-100' },
    NOTE_ADDED: { icon: Activity, label: 'Note Added', color: 'text-slate-600 bg-slate-100' },
    DEAL_DISCUSSED: { icon: Target, label: 'Deal Discussed', color: 'text-warning-600 bg-warning-100' },
    DOCUMENT_SHARED: { icon: Activity, label: 'Document Shared', color: 'text-teal-600 bg-teal-100' },
    CONTACT_ADDED: { icon: Users, label: 'Contact Added', color: 'text-primary-600 bg-primary-100' },
    RELATIONSHIP_UPDATED: { icon: TrendingUp, label: 'Relationship Updated', color: 'text-success-600 bg-success-100' },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Recent activity and events for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="h-10 w-10 bg-slate-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-danger-400 mb-3" />
            <p className="text-sm text-danger-600">{error?.message || 'Failed to load activity'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activities = data?.items || [];

  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
          <CardDescription>Recent activity and events for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Activity className="h-12 w-12" />}
            title="No activity yet"
            description="No interactions or activities have been logged for this organization."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
        <CardDescription>Recent activity and events for this organization</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-6">
            {activities.map((activity) => {
              const config = ACTIVITY_TYPE_CONFIG[activity.type] || {
                icon: Activity,
                label: activity.type.replace(/_/g, ' '),
                color: 'text-slate-600 bg-slate-100',
              };
              const Icon = config.icon;

              return (
                <div key={activity.id} className="relative flex gap-4">
                  <div className={cn('flex h-10 w-10 items-center justify-center rounded-full z-10', config.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium text-slate-900">{activity.title}</p>
                    {activity.description && (
                      <p className="text-sm text-slate-500 mt-0.5">{activity.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                      <span>{formatRelativeTime(activity.createdAt)}</span>
                      {activity.contact && (
                        <span>
                          with {activity.contact.firstName} {activity.contact.lastName}
                        </span>
                      )}
                      {activity.user && (
                        <span>by {activity.user.name}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {data?.hasMore && (
            <p className="mt-6 text-center text-sm text-slate-500">
              Showing {activities.length} most recent activities
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// IB-SPECIFIC TABS - MANDATES & COVERAGE
// ============================================================================

// Service type labels for mandates
const MANDATE_SERVICE_TYPE_LABELS: Record<string, string> = {
  MA_SELLSIDE: 'M&A Sell-Side',
  MA_BUYSIDE: 'M&A Buy-Side',
  CAPITAL_RAISE: 'Capital Raise',
  RESTRUCTURING: 'Restructuring',
  FAIRNESS_OPINION: 'Fairness Opinion',
  SPAC_ADVISORY: 'SPAC Advisory',
  OTHER: 'Other',
};

// Status configuration for mandates
const MANDATE_STATUS_CONFIG: Record<string, { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' }> = {
  ACTIVE: { label: 'Active', variant: 'primary' },
  WON: { label: 'Won', variant: 'success' },
  LOST: { label: 'Lost', variant: 'danger' },
  COMPLETED: { label: 'Completed', variant: 'secondary' },
  ON_HOLD: { label: 'On Hold', variant: 'warning' },
};

// Expertise level configuration for coverage
const EXPERTISE_LEVEL_CONFIG: Record<string, { label: string; variant: 'primary' | 'secondary' | 'success' | 'warning' }> = {
  LEADING: { label: 'Leading', variant: 'primary' },
  STRONG: { label: 'Strong', variant: 'success' },
  MODERATE: { label: 'Moderate', variant: 'warning' },
  EMERGING: { label: 'Emerging', variant: 'secondary' },
};

function MandatesTab({ organizationId }: { organizationId: string }) {
  const { data, isLoading, isError, error } = trpc.mandate.listByOrganization.useQuery(
    { organizationId },
    { retry: 1 }
  );

  const handleCreateMandate = () => {
    toast('Mandate creation coming soon', { icon: '🚧' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mandates</CardTitle>
            <CardDescription>Active and historical mandates for this investment bank</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mandates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-danger-400 mb-3" />
            <p className="text-sm text-danger-600">{error?.message || 'Failed to load mandates'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mandates = data?.items || [];

  if (mandates.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Mandates</CardTitle>
            <CardDescription>Active and historical mandates for this investment bank</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={handleCreateMandate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Mandate
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="No mandates"
            description="This investment bank has no mandates recorded yet."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mandates ({mandates.length})</CardTitle>
          <CardDescription>Active and historical mandates for this investment bank</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={handleCreateMandate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Mandate
        </Button>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-slate-200">
          {mandates.map((mandate) => {
            const statusConfig = MANDATE_STATUS_CONFIG[mandate.status] || { label: mandate.status, variant: 'secondary' as const };
            const serviceLabel = MANDATE_SERVICE_TYPE_LABELS[mandate.serviceType] || mandate.serviceType;

            return (
              <div key={mandate.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{mandate.clientName}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="secondary" size="sm">
                          {serviceLabel}
                        </Badge>
                        <Badge variant={statusConfig.variant} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {mandate.dealValue && (
                      <p className="font-semibold text-slate-900">{formatLargeNumber(mandate.dealValue)}</p>
                    )}
                    {mandate.expectedCloseDate && (
                      <p className="text-xs text-slate-500 mt-1">
                        Expected close: {formatDate(mandate.expectedCloseDate)}
                      </p>
                    )}
                  </div>
                </div>
                {mandate.description && (
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">{mandate.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                  {mandate.mandateDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Mandate date: {formatDate(mandate.mandateDate)}
                    </span>
                  )}
                  {mandate.contacts && mandate.contacts.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {mandate.contacts.length} contact{mandate.contacts.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {data?.hasMore && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Showing {mandates.length} most recent mandates
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CoverageTab({ organizationId }: { organizationId: string }) {
  const { data, isLoading, isError, error } = trpc.coverage.listByOrganization.useQuery(
    { organizationId },
    { retry: 1 }
  );

  const handleAddCoverage = () => {
    toast('Coverage management coming soon', { icon: '🚧' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Coverage Areas</CardTitle>
            <CardDescription>Sectors and industries covered by this investment bank</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Coverage Areas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-danger-400 mb-3" />
            <p className="text-sm text-danger-600">{error?.message || 'Failed to load coverage areas'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const coverageAreas = data?.coverageAreas || [];

  if (coverageAreas.length === 0) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Coverage Areas</CardTitle>
            <CardDescription>Sectors and industries covered by this investment bank</CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={handleAddCoverage}>
            <Plus className="mr-2 h-4 w-4" />
            Add Coverage
          </Button>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={<Compass className="h-12 w-12" />}
            title="No coverage areas"
            description="No coverage areas have been defined for this investment bank yet."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Coverage Areas ({coverageAreas.length})</CardTitle>
          <CardDescription>Sectors and industries covered by this investment bank</CardDescription>
        </div>
        <Button variant="primary" size="sm" onClick={handleAddCoverage}>
          <Plus className="mr-2 h-4 w-4" />
          Add Coverage
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coverageAreas.map((coverage) => {
            const expertiseConfig = EXPERTISE_LEVEL_CONFIG[coverage.expertise] || { label: coverage.expertise, variant: 'secondary' as const };
            const contactCount = coverage.contacts?.length || 0;

            return (
              <div
                key={coverage.id}
                className="rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <Compass className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{coverage.sector}</p>
                    {coverage.subSector && (
                      <p className="text-sm text-slate-500 truncate">{coverage.subSector}</p>
                    )}
                    {coverage.geography && (
                      <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Globe className="h-3 w-3" />
                        {coverage.geography}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge variant={expertiseConfig.variant} size="sm">
                        {expertiseConfig.label}
                      </Badge>
                    </div>
                    {contactCount > 0 && (
                      <p className="mt-2 text-xs text-slate-500 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {contactCount} contact{contactCount !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// TARGET COMPANY TABS - OWNERSHIP & DEAL FIT (Sprint 12)
// ============================================================================

// Ownership template types
type OwnershipTemplate = 'founder' | 'pe_majority' | 'pe_minority';

function OwnershipTab({ organizationId }: { organizationId: string }) {
  const { data, isLoading, isError, error } = trpc.ownership.listByOwned.useQuery(
    { ownedId: organizationId },
    { retry: 1 }
  );

  const handleApplyTemplate = (template: OwnershipTemplate) => {
    toast(`Applying ${template.replace('_', ' ')} template - coming soon`, { icon: '🚧' });
  };

  const handleAddStake = () => {
    toast('Add ownership stake coming soon', { icon: '🚧' });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ownership Structure</CardTitle>
          <CardDescription>Who owns this company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-64 bg-slate-100 rounded-lg" />
            <div className="h-32 bg-slate-100 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ownership Structure</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-10 w-10 text-danger-400 mb-3" />
            <p className="text-sm text-danger-600">{error?.message || 'Failed to load ownership'}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stakes = data?.stakes || [];
  const totalOwnership = stakes.reduce((sum, s) => sum + (s.ownershipPct || 0), 0);

  // Prepare pie chart data
  const pieData = stakes.map((stake, index) => ({
    name: stake.owner.name,
    value: stake.ownershipPct || 0,
    color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6],
  }));

  // Add "Other/Unknown" if less than 100%
  if (totalOwnership < 100) {
    pieData.push({
      name: 'Other/Unknown',
      value: 100 - totalOwnership,
      color: '#94A3B8',
    });
  }

  if (stakes.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ownership Structure</CardTitle>
              <CardDescription>Who owns this company</CardDescription>
            </div>
            <Button variant="primary" size="sm" onClick={handleAddStake}>
              <Plus className="mr-2 h-4 w-4" />
              Add Stake
            </Button>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={<PieChartIcon className="h-12 w-12" />}
              title="No ownership data"
              description="Add ownership stakes to track who owns this company."
            />
          </CardContent>
        </Card>

        {/* Quick Templates */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Templates</CardTitle>
            <CardDescription>Apply common ownership structures</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleApplyTemplate('founder')}>
                100% Founder Owned
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleApplyTemplate('pe_majority')}>
                PE Majority (51%+)
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handleApplyTemplate('pe_minority')}>
                PE Minority (&lt;50%)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Ownership Structure</CardTitle>
            <CardDescription>
              {totalOwnership.toFixed(1)}% tracked across {stakes.length} stakeholder{stakes.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button variant="primary" size="sm" onClick={handleAddStake}>
            <Plus className="mr-2 h-4 w-4" />
            Add Stake
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart Visualization */}
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Simple CSS pie chart (could be replaced with Recharts) */}
                <div className="w-full h-full rounded-full overflow-hidden relative"
                  style={{
                    background: `conic-gradient(${pieData.map((d, i) =>
                      `${d.color} ${pieData.slice(0, i).reduce((sum, p) => sum + p.value, 0) * 3.6}deg ${(pieData.slice(0, i).reduce((sum, p) => sum + p.value, 0) + d.value) * 3.6}deg`
                    ).join(', ')})`,
                  }}
                >
                  <div className="absolute inset-8 bg-white rounded-full flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-slate-900">{totalOwnership.toFixed(0)}%</p>
                      <p className="text-xs text-slate-500">tracked</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">{item.value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ownership Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stakeholder Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200">
            {stakes.map((stake) => {
              const holdYears = stake.investmentDate
                ? Math.floor((Date.now() - new Date(stake.investmentDate).getTime()) / (365 * 24 * 60 * 60 * 1000))
                : null;

              return (
                <div key={stake.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <Link
                          href={`/organizations/${stake.owner.id}`}
                          className="font-medium text-slate-900 hover:text-primary-600 hover:underline"
                        >
                          {stake.owner.name}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <Badge variant="secondary" size="sm">
                            {stake.owner.type?.replace(/_/g, ' ') || 'Unknown'}
                          </Badge>
                          <Badge variant={stake.stakeType === 'MAJORITY' ? 'primary' : 'secondary'} size="sm">
                            {stake.stakeType?.replace(/_/g, ' ') || 'Unknown'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">{stake.ownershipPct?.toFixed(1)}%</p>
                      {stake.boardSeats && stake.boardSeats > 0 && (
                        <p className="text-xs text-slate-500">{stake.boardSeats} board seat{stake.boardSeats > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
                    {stake.investmentDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Invested: {formatDate(stake.investmentDate)}
                      </span>
                    )}
                    {holdYears !== null && holdYears >= 0 && (
                      <span className={cn(holdYears >= 5 && 'text-warning-600 font-medium')}>
                        <Clock className="inline h-3 w-3 mr-1" />
                        {holdYears} year{holdYears !== 1 ? 's' : ''} held
                        {holdYears >= 5 && ' (exit window)'}
                      </span>
                    )}
                    {stake.entryValuation && (
                      <span>Entry: {formatLargeNumber(stake.entryValuation)}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Templates</CardTitle>
          <CardDescription>Apply common ownership structures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => handleApplyTemplate('founder')}>
              100% Founder Owned
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleApplyTemplate('pe_majority')}>
              PE Majority (51%+)
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleApplyTemplate('pe_minority')}>
              PE Minority (&lt;50%)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DealFitTab({ organizationId, organizationName }: { organizationId: string; organizationName: string }) {
  const [selectedSpacId, setSelectedSpacId] = useState<string | null>(null);

  // Fetch available SPACs
  const { data: spacsData, isLoading: spacsLoading } = trpc.spac.list.useQuery(
    { page: 1, limit: 50 },
    { retry: 1 }
  );

  // Fetch existing fit scores for this organization
  const { data: fitScores, isLoading: scoresLoading, refetch: refetchScores } = trpc.organization.listFitScores.useQuery(
    { organizationId },
    { retry: 1 }
  );

  // Calculate fit score mutation
  const calculateMutation = trpc.organization.calculateFitScore.useMutation({
    onSuccess: () => {
      toast.success('Fit score calculated successfully');
      refetchScores();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to calculate fit score');
    },
  });

  const handleCalculate = () => {
    if (!selectedSpacId) {
      toast.error('Please select a SPAC first');
      return;
    }
    calculateMutation.mutate({ organizationId, spacId: selectedSpacId });
  };

  const spacs = spacsData?.items || [];
  const scores = fitScores || [];

  const getScoreColor = (score: number) => {
    if (score >= 75) {
      return 'text-success-600 bg-success-100';
    }
    if (score >= 50) {
      return 'text-warning-600 bg-warning-100';
    }
    return 'text-danger-600 bg-danger-100';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 75) {
      return 'Strong Fit';
    }
    if (score >= 50) {
      return 'Moderate Fit';
    }
    return 'Limited Fit';
  };

  return (
    <div className="space-y-6">
      {/* Calculate New Score */}
      <Card>
        <CardHeader>
          <CardTitle>Calculate Fit Score</CardTitle>
          <CardDescription>
            Score how well {organizationName} fits a SPAC's investment criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="spac-select" className="block text-sm font-medium text-slate-700 mb-1">Select SPAC</label>
              <select
                id="spac-select"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={selectedSpacId || ''}
                onChange={(e) => setSelectedSpacId(e.target.value || null)}
                disabled={spacsLoading}
              >
                <option value="">Choose a SPAC...</option>
                {spacs.map((spac) => (
                  <option key={spac.id} value={spac.id}>
                    {spac.name} {spac.ticker ? `(${spac.ticker})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="primary"
                onClick={handleCalculate}
                disabled={!selectedSpacId || calculateMutation.isPending}
              >
                {calculateMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Calculate Score
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Scores */}
      <Card>
        <CardHeader>
          <CardTitle>Fit Scores ({scores.length})</CardTitle>
          <CardDescription>Previously calculated fit scores against different SPACs</CardDescription>
        </CardHeader>
        <CardContent>
          {scoresLoading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : scores.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-12 w-12" />}
              title="No fit scores yet"
              description="Select a SPAC above and calculate a fit score to see how well this target matches."
            />
          ) : (
            <div className="space-y-4">
              {scores.map((score) => (
                <div key={score.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="font-medium text-slate-900">
                        vs {score.spac.name} {score.spac.ticker ? `(${score.spac.ticker})` : ''}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Calculated {formatRelativeTime(score.calculatedAt)}
                      </p>
                    </div>
                    <div className={cn('px-3 py-1 rounded-full text-sm font-semibold', getScoreColor(score.overallScore))}>
                      {score.overallScore}/100 - {getScoreLabel(score.overallScore)}
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-slate-500">Size Fit</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full">
                          <div
                            className={cn('h-2 rounded-full', score.sizeScore >= 70 ? 'bg-success-500' : score.sizeScore >= 40 ? 'bg-warning-500' : 'bg-danger-500')}
                            style={{ width: `${score.sizeScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{score.sizeScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Sector Fit</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full">
                          <div
                            className={cn('h-2 rounded-full', score.sectorScore >= 70 ? 'bg-success-500' : score.sectorScore >= 40 ? 'bg-warning-500' : 'bg-danger-500')}
                            style={{ width: `${score.sectorScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{score.sectorScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Geography Fit</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full">
                          <div
                            className={cn('h-2 rounded-full', score.geographyScore >= 70 ? 'bg-success-500' : score.geographyScore >= 40 ? 'bg-warning-500' : 'bg-danger-500')}
                            style={{ width: `${score.geographyScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{score.geographyScore}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Ownership Fit</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full">
                          <div
                            className={cn('h-2 rounded-full', score.ownershipScore >= 70 ? 'bg-success-500' : score.ownershipScore >= 40 ? 'bg-warning-500' : 'bg-danger-500')}
                            style={{ width: `${score.ownershipScore}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-slate-900">{score.ownershipScore}</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {score.aiSummary && (
                    <div className="bg-slate-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-slate-700">{score.aiSummary}</p>
                    </div>
                  )}

                  {/* AI Recommendation */}
                  {score.aiRecommendation && (
                    <div className={cn(
                      'rounded-lg p-3',
                      score.overallScore >= 75 ? 'bg-success-50 border border-success-200' :
                      score.overallScore >= 50 ? 'bg-warning-50 border border-warning-200' :
                      'bg-danger-50 border border-danger-200'
                    )}>
                      <p className={cn(
                        'text-sm font-medium',
                        score.overallScore >= 75 ? 'text-success-700' :
                        score.overallScore >= 50 ? 'text-warning-700' :
                        'text-danger-700'
                      )}>
                        {score.aiRecommendation}
                      </p>
                    </div>
                  )}

                  {/* Recalculate Button */}
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedSpacId(score.spac.id);
                        calculateMutation.mutate({ organizationId, spacId: score.spac.id });
                      }}
                      disabled={calculateMutation.isPending}
                    >
                      <RefreshCw className={cn('mr-2 h-3 w-3', calculateMutation.isPending && 'animate-spin')} />
                      Recalculate
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
  // TAB DEFINITIONS (conditional based on organization type)
  // ============================================================================

  // For PE_FIRM: Overview, Portfolio, Contacts, Activity
  // For IB: Overview, Mandates, Coverage, Contacts, Activity (no Portfolio)
  // For TARGET_COMPANY: Overview, Ownership, Contacts, Activity, Deal Fit (Sprint 12)
  const isIB = organization.type === 'IB';
  const isTargetCompany = organization.type === 'TARGET_COMPANY';

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = isTargetCompany
    ? [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'ownership', label: 'Ownership', icon: PieChartIcon, count: organization._count?.ownedByStakes || 0 },
        { id: 'contacts', label: 'Contacts', icon: Users, count: organization._count?.contacts || 0 },
        { id: 'activity', label: 'Activity', icon: Activity },
        { id: 'dealfit', label: 'Deal Fit', icon: Target },
      ]
    : isIB
      ? [
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'mandates', label: 'Mandates', icon: FileText },
          { id: 'coverage', label: 'Coverage', icon: Compass },
          { id: 'contacts', label: 'Contacts', icon: Users, count: organization._count?.contacts || 0 },
          { id: 'activity', label: 'Activity', icon: Activity },
        ]
      : [
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
      {/* KEY METRICS ROW - Conditional based on organization type */}
      {/* ================================================================== */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isTargetCompany ? (
          <>
            {/* Revenue (Target Company) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                    <DollarSign className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Revenue</p>
                    <p className="text-xl font-bold text-slate-900">
                      {organization.revenue ? formatLargeNumber(organization.revenue) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* EBITDA (Target Company) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">EBITDA</p>
                    <p className="text-xl font-bold text-slate-900">
                      {organization.ebitda ? formatLargeNumber(organization.ebitda) : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Growth (Target Company) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
                    <Percent className="h-5 w-5 text-warning-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Growth</p>
                    <p className="text-xl font-bold text-slate-900">
                      {organization.revenueGrowth ? `${organization.revenueGrowth.toFixed(1)}%` : '-'}
                    </p>
                    <p className="text-xs text-slate-500">revenue YoY</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Owners Count (Target Company) */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <PieChartIcon className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Owners</p>
                    <p className="text-xl font-bold text-slate-900">
                      {organization._count?.ownedByStakes || 0}
                    </p>
                    <p className="text-xs text-slate-500">stakeholders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
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
          </>
        )}
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
                  {isTargetCompany ? (
                    <>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => setActiveTab('ownership')}
                      >
                        <PieChartIcon className="mr-2 h-4 w-4" />
                        View Ownership
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => setActiveTab('dealfit')}
                      >
                        <Target className="mr-2 h-4 w-4" />
                        View Deal Fit
                      </Button>
                    </>
                  ) : isIB ? (
                    <>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => setActiveTab('mandates')}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        View Mandates
                      </Button>
                      <Button
                        variant="secondary"
                        className="w-full justify-start"
                        size="sm"
                        onClick={() => setActiveTab('coverage')}
                      >
                        <Compass className="mr-2 h-4 w-4" />
                        View Coverage
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      className="w-full justify-start"
                      size="sm"
                      onClick={() => setActiveTab('portfolio')}
                    >
                      <Briefcase className="mr-2 h-4 w-4" />
                      View Portfolio
                    </Button>
                  )}
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
        {/* PORTFOLIO TAB (PE_FIRM only) */}
        {/* ================================================================== */}
        {!isIB && (
          <TabContent value="portfolio">
            <PortfolioTab organizationId={id} />
          </TabContent>
        )}

        {/* ================================================================== */}
        {/* MANDATES TAB (IB only) */}
        {/* ================================================================== */}
        {isIB && (
          <TabContent value="mandates">
            <MandatesTab organizationId={id} />
          </TabContent>
        )}

        {/* ================================================================== */}
        {/* COVERAGE TAB (IB only) */}
        {/* ================================================================== */}
        {isIB && (
          <TabContent value="coverage">
            <CoverageTab organizationId={id} />
          </TabContent>
        )}

        {/* ================================================================== */}
        {/* OWNERSHIP TAB (TARGET_COMPANY only - Sprint 12) */}
        {/* ================================================================== */}
        {isTargetCompany && (
          <TabContent value="ownership">
            <OwnershipTab organizationId={id} />
          </TabContent>
        )}

        {/* ================================================================== */}
        {/* DEAL FIT TAB (TARGET_COMPANY only - Sprint 12) */}
        {/* ================================================================== */}
        {isTargetCompany && (
          <TabContent value="dealfit">
            <DealFitTab organizationId={id} organizationName={organization.name} />
          </TabContent>
        )}

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
