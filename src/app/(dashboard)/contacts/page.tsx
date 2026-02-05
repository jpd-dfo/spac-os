'use client';

import { useState, useMemo, useCallback } from 'react';

import {
  Users,
  Plus,
  Search,
  Filter,
  Star,
  StarOff,
  Mail,
  Phone,
  Building,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit,
  Eye,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { AddContactModal, NewContactData } from '@/components/contacts/AddContactModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import { CONTACT_TYPE_LABELS, DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type ContactStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PROSPECT' | 'LEAD';
type ContactType = 'INVESTOR' | 'ADVISOR' | 'LEGAL' | 'BANKER' | 'TARGET_EXEC' | 'BOARD_MEMBER' | 'SPONSOR' | 'UNDERWRITER' | 'AUDITOR' | 'OTHER';

const STATUS_LABELS: Record<ContactStatus, string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  ARCHIVED: 'Archived',
  PROSPECT: 'Prospect',
  LEAD: 'Lead',
};

const TYPE_LABELS: Record<ContactType, string> = {
  INVESTOR: 'Investor',
  ADVISOR: 'Advisor',
  LEGAL: 'Legal',
  BANKER: 'Banker',
  TARGET_EXEC: 'Target Executive',
  BOARD_MEMBER: 'Board Member',
  SPONSOR: 'Sponsor',
  UNDERWRITER: 'Underwriter',
  AUDITOR: 'Auditor',
  OTHER: 'Other',
};

const statusFilters: Array<'all' | ContactStatus> = ['all', 'ACTIVE', 'PROSPECT', 'LEAD', 'INACTIVE'];
const typeFilters: Array<'all' | ContactType> = ['all', 'INVESTOR', 'BANKER', 'LEGAL', 'ADVISOR', 'TARGET_EXEC', 'OTHER'];

// ============================================================================
// Helper Components
// ============================================================================

function ContactSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="divide-y divide-slate-200">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 rounded bg-slate-200" />
              <div className="h-3 w-32 rounded bg-slate-200" />
            </div>
            <div className="h-6 w-20 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function getTypeBadgeVariant(type: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
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

function getStatusBadgeVariant(status: string): 'primary' | 'secondary' | 'success' | 'warning' | 'danger' {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'PROSPECT':
      return 'primary';
    case 'LEAD':
      return 'warning';
    case 'INACTIVE':
      return 'secondary';
    case 'ARCHIVED':
      return 'danger';
    default:
      return 'secondary';
  }
}

// ============================================================================
// Main Component
// ============================================================================

export default function ContactsPage() {
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContactStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ContactType>('all');
  const [starredFilter, setStarredFilter] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // tRPC utilities
  const utils = trpc.useUtils();

  // tRPC Queries
  const contactsQuery = trpc.contact.list.useQuery(
    {
      page,
      pageSize,
      status: statusFilter !== 'all' ? [statusFilter] : undefined,
      type: typeFilter !== 'all' ? [typeFilter] : undefined,
      search: searchQuery || undefined,
      isStarred: starredFilter ? true : undefined,
      sortBy: 'lastName',
      sortOrder: 'asc',
    },
    {
      refetchOnWindowFocus: false,
      keepPreviousData: true,
    }
  );

  const statisticsQuery = trpc.contact.getStatistics.useQuery({});

  // tRPC Mutations
  const createContactMutation = trpc.contact.create.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      utils.contact.getStatistics.invalidate();
      setIsAddModalOpen(false);
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create contact: ${error.message}`);
    },
  });

  const toggleStarMutation = trpc.contact.toggleStar.useMutation({
    onSuccess: (data) => {
      utils.contact.list.invalidate();
      utils.contact.getStatistics.invalidate();
      toast.success(data.isStarred ? 'Contact starred' : 'Contact unstarred');
    },
    onError: (error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });

  const deleteContactMutation = trpc.contact.delete.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      utils.contact.getStatistics.invalidate();
      toast.success('Contact archived');
    },
    onError: (error) => {
      toast.error(`Failed to archive contact: ${error.message}`);
    },
  });

  // Derived data
  const contacts = useMemo(() => {
    return contactsQuery.data?.items || [];
  }, [contactsQuery.data]);

  const stats = useMemo(() => {
    if (!statisticsQuery.data) {
      return {
        total: 0,
        active: 0,
        starred: 0,
        recentlyActive: 0,
      };
    }
    return {
      total: statisticsQuery.data.total,
      active: statisticsQuery.data.byStatus?.['ACTIVE'] || 0,
      starred: statisticsQuery.data.starred,
      recentlyActive: statisticsQuery.data.recentlyActive,
    };
  }, [statisticsQuery.data]);

  // Handlers
  const handleCreateContact = useCallback(
    (data: NewContactData) => {
      createContactMutation.mutate({
        // organizationId is optional - backend will use user's organization from context
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        title: data.title || undefined,
        type: data.type,
        notes: data.notes || undefined,
        tags: data.tags || [],
      });
    },
    [createContactMutation]
  );

  const handleToggleStar = useCallback(
    (contactId: string) => {
      toggleStarMutation.mutate({ id: contactId });
    },
    [toggleStarMutation]
  );

  const handleDeleteContact = useCallback(
    (contactId: string) => {
      if (confirm('Are you sure you want to archive this contact?')) {
        deleteContactMutation.mutate({ id: contactId });
      }
    },
    [deleteContactMutation]
  );

  const handleRetry = () => {
    contactsQuery.refetch();
    statisticsQuery.refetch();
  };

  // Loading state
  if (contactsQuery.isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Contacts</h1>
          <p className="page-description">
            Manage your professional network with relationship intelligence
          </p>
        </div>

        {/* Loading skeleton */}
        <Card>
          <CardContent className="p-0">
            <ContactSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (contactsQuery.isError) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Contacts</h1>
          <p className="page-description">
            Manage your professional network with relationship intelligence
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <AlertCircle className="h-12 w-12 text-danger-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Failed to load contacts</h3>
            <p className="mt-2 text-sm text-slate-500">
              {contactsQuery.error?.message || 'An error occurred while loading contacts.'}
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
          <h1 className="page-title">Contacts</h1>
          <p className="page-description">
            Manage your professional network with relationship intelligence
            {contactsQuery.data?.total ? ` - ${contactsQuery.data.total} total contacts` : ''}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contact
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-2">
                <Users className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-100 p-2">
                <Star className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.starred}</p>
                <p className="text-sm text-slate-500">Starred</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Mail className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.recentlyActive}</p>
                <p className="text-sm text-slate-500">Recently Active</p>
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
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {status === 'all' ? 'All' : STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {/* Type Filter Dropdown */}
        <Dropdown
          trigger={
            <Button variant="secondary" size="md">
              <Filter className="mr-2 h-4 w-4" />
              {typeFilter === 'all' ? 'All Types' : TYPE_LABELS[typeFilter]}
            </Button>
          }
          align="right"
        >
          {typeFilters.map((type) => (
            <DropdownItem key={type} onClick={() => { setTypeFilter(type); setPage(1); }}>
              <span className={typeFilter === type ? 'font-medium text-primary-600' : ''}>
                {type === 'all' ? 'All Types' : TYPE_LABELS[type]}
              </span>
            </DropdownItem>
          ))}
        </Dropdown>

        {/* Starred Filter */}
        <Button
          variant={starredFilter ? 'primary' : 'secondary'}
          size="md"
          onClick={() => { setStarredFilter(!starredFilter); setPage(1); }}
        >
          <Star className={cn('mr-2 h-4 w-4', starredFilter && 'fill-current')} />
          Starred
        </Button>
      </div>

      {/* Contact List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
              >
                {/* Star Button */}
                <button
                  onClick={() => handleToggleStar(contact.id)}
                  disabled={toggleStarMutation.isPending}
                  className="flex-shrink-0 text-slate-400 hover:text-warning-500 transition-colors"
                >
                  {contact.isStarred ? (
                    <Star className="h-5 w-5 fill-warning-500 text-warning-500" />
                  ) : (
                    <StarOff className="h-5 w-5" />
                  )}
                </button>

                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-medium">
                    {contact.firstName[0]}{contact.lastName[0]}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </h4>
                    <Badge variant={getTypeBadgeVariant(contact.type)} size="sm">
                      {TYPE_LABELS[contact.type as ContactType] || CONTACT_TYPE_LABELS[contact.type] || contact.type}
                    </Badge>
                    <Badge variant={getStatusBadgeVariant(contact.status)} size="sm">
                      {STATUS_LABELS[contact.status as ContactStatus] || contact.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                    {contact.title && contact.company && (
                      <span className="flex items-center gap-1 truncate">
                        <Building className="h-3.5 w-3.5" />
                        {contact.title} at {contact.company}
                      </span>
                    )}
                    {!contact.title && contact.company && (
                      <span className="flex items-center gap-1 truncate">
                        <Building className="h-3.5 w-3.5" />
                        {contact.company}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3.5 w-3.5" />
                        {contact.email}
                      </span>
                    )}
                    {contact.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {contact.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Relationship Score */}
                {contact.relationshipScore !== null && contact.relationshipScore > 0 && (
                  <div className="flex-shrink-0 text-center">
                    <div className={cn(
                      'text-lg font-bold',
                      contact.relationshipScore >= 70 ? 'text-success-600' :
                      contact.relationshipScore >= 40 ? 'text-warning-600' : 'text-slate-400'
                    )}>
                      {contact.relationshipScore}
                    </div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                )}

                {/* Interaction Count */}
                {contact._count && (
                  <div className="flex-shrink-0 text-center">
                    <div className="text-lg font-bold text-slate-700">
                      {contact._count.interactions}
                    </div>
                    <div className="text-xs text-slate-500">Interactions</div>
                  </div>
                )}

                {/* Actions Menu */}
                <Dropdown
                  trigger={
                    <button className="flex-shrink-0 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  }
                  align="right"
                >
                  <DropdownItem onClick={() => window.location.href = `/contacts/${contact.id}`}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownItem>
                  <DropdownItem onClick={() => window.location.href = `/contacts/${contact.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownItem>
                  <DropdownDivider />
                  <DropdownItem
                    onClick={() => handleDeleteContact(contact.id)}
                    className="text-danger-600 hover:bg-danger-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Archive
                  </DropdownItem>
                </Dropdown>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {contacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || starredFilter
                  ? 'No contacts match your filters'
                  : 'No contacts yet. Add your first contact to get started.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || starredFilter) && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setStarredFilter(false);
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              )}
              {!searchQuery && statusFilter === 'all' && typeFilter === 'all' && !starredFilter && (
                <Button
                  variant="primary"
                  size="md"
                  className="mt-4"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {contactsQuery.data && contactsQuery.data.totalPages > 0 && contactsQuery.data.total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={contactsQuery.data.totalPages}
          pageSize={pageSize}
          totalItems={contactsQuery.data.total}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      )}

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateContact}
        isLoading={createContactMutation.isPending}
      />
    </div>
  );
}
