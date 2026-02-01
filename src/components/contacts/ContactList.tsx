'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Building,
  Mail,
  Phone,
  Linkedin,
  MoreHorizontal,
  Star,
  ChevronDown,
  Users,
  TrendingUp,
  SortAsc,
  SortDesc,
  X,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { Avatar } from '@/components/ui/Avatar';
import { cn, formatRelativeTime } from '@/lib/utils';
import { ContactCard } from './ContactCard';
import { ContactDetailModal } from './ContactDetailModal';
import { AddContactForm } from './AddContactForm';
import {
  mockContacts,
  mockCompanies,
  contactCategories,
  type ExtendedContact,
  type ContactCategory,
} from './mockContactsData';

type ViewMode = 'table' | 'card';
type SortField = 'name' | 'company' | 'category' | 'relationshipScore' | 'lastInteraction';
type SortDirection = 'asc' | 'desc';

function getCategoryColor(category: ContactCategory): string {
  const colors: Record<ContactCategory, string> = {
    Founders: 'bg-purple-100 text-purple-700',
    Executives: 'bg-blue-100 text-blue-700',
    Advisors: 'bg-teal-100 text-teal-700',
    Bankers: 'bg-amber-100 text-amber-700',
    Lawyers: 'bg-slate-100 text-slate-700',
    Investors: 'bg-green-100 text-green-700',
    Accountants: 'bg-orange-100 text-orange-700',
    Board: 'bg-indigo-100 text-indigo-700',
  };
  return colors[category] || 'bg-slate-100 text-slate-700';
}

function getRelationshipColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getRelationshipBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

interface ContactListProps {
  onViewContact?: (contact: ExtendedContact) => void;
}

export function ContactList({ onViewContact }: ContactListProps) {
  const [contacts, setContacts] = useState<ExtendedContact[]>(mockContacts);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ContactCategory | 'all'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedContact, setSelectedContact] = useState<ExtendedContact | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique companies for filter
  const uniqueCompanies = useMemo(() => {
    const companies = new Set(contacts.map((c) => c.company).filter(Boolean));
    return Array.from(companies).sort();
  }, [contacts]);

  // Filter and sort contacts
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) ||
          c.company.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.title.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter((c) => c.category === categoryFilter);
    }

    // Company filter
    if (companyFilter !== 'all') {
      result = result.filter((c) => c.company === companyFilter);
    }

    // Starred filter
    if (showStarredOnly) {
      result = result.filter((c) => c.isStarred);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'company':
          comparison = a.company.localeCompare(b.company);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        case 'relationshipScore':
          comparison = a.relationshipScore - b.relationshipScore;
          break;
        case 'lastInteraction':
          comparison = new Date(a.lastInteraction).getTime() - new Date(b.lastInteraction).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [contacts, searchQuery, categoryFilter, companyFilter, showStarredOnly, sortField, sortDirection]);

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle star toggle
  const handleToggleStar = (contact: ExtendedContact) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, isStarred: !c.isStarred } : c))
    );
  };

  // Handle view contact
  const handleViewContact = (contact: ExtendedContact) => {
    setSelectedContact(contact);
    onViewContact?.(contact);
  };

  // Handle add contact
  const handleAddContact = (newContact: Partial<ExtendedContact>) => {
    setContacts((prev) => [newContact as ExtendedContact, ...prev]);
    setShowAddForm(false);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setCompanyFilter('all');
    setShowStarredOnly(false);
  };

  const hasActiveFilters = searchQuery || categoryFilter !== 'all' || companyFilter !== 'all' || showStarredOnly;

  // Stats
  const stats = useMemo(() => ({
    total: contacts.length,
    starred: contacts.filter((c) => c.isStarred).length,
    avgScore: Math.round(contacts.reduce((sum, c) => sum + c.relationshipScore, 0) / contacts.length),
    categories: Object.fromEntries(
      contactCategories.map((cat) => [cat, contacts.filter((c) => c.category === cat).length])
    ),
  }), [contacts]);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Users className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Contacts</p>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Star className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Starred</p>
              <p className="text-2xl font-bold text-slate-900">{stats.starred}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg. Relationship Score</p>
              <p className="text-2xl font-bold text-slate-900">{stats.avgScore}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Companies</p>
              <p className="text-2xl font-bold text-slate-900">{uniqueCompanies.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts by name, company, email, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
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

          {/* Quick filters */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ContactCategory | 'all')}
            className="input w-auto"
          >
            <option value="all">All Categories</option>
            {contactCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} ({stats.categories[cat]})
              </option>
            ))}
          </select>

          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="input w-auto max-w-[200px]"
          >
            <option value="all">All Companies</option>
            {uniqueCompanies.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>

          {/* More filters toggle */}
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && 'bg-slate-100')}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                {[searchQuery, categoryFilter !== 'all', companyFilter !== 'all', showStarredOnly].filter(Boolean).length}
              </span>
            )}
          </Button>

          {/* View mode toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'table' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={cn(
                'p-2 transition-colors',
                viewMode === 'card' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          {/* Add contact button */}
          <Button variant="primary" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
            <button
              onClick={() => setShowStarredOnly(!showStarredOnly)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors',
                showStarredOnly
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              <Star className={cn('h-4 w-4', showStarredOnly && 'fill-amber-500')} />
              Starred Only
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </button>
            )}

            <div className="flex-1" />

            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Showing {filteredContacts.length} of {contacts.length} contacts
          {hasActiveFilters && ' (filtered)'}
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Sort by:</span>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            className="input h-8 w-auto text-sm py-0"
          >
            <option value="name">Name</option>
            <option value="company">Company</option>
            <option value="category">Category</option>
            <option value="relationshipScore">Relationship Score</option>
            <option value="lastInteraction">Last Interaction</option>
          </select>
          <button
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            className="p-1 hover:bg-slate-100 rounded"
          >
            {sortDirection === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Contact List */}
      {viewMode === 'table' ? (
        <Card>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell header className="w-12" />
                <TableCell header>
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Name
                    {sortField === 'name' && (
                      sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                </TableCell>
                <TableCell header>
                  <button
                    onClick={() => handleSort('company')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Company
                    {sortField === 'company' && (
                      sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                </TableCell>
                <TableCell header>
                  <button
                    onClick={() => handleSort('category')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Category
                    {sortField === 'category' && (
                      sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                </TableCell>
                <TableCell header>Email</TableCell>
                <TableCell header>
                  <button
                    onClick={() => handleSort('relationshipScore')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Relationship
                    {sortField === 'relationshipScore' && (
                      sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                </TableCell>
                <TableCell header>
                  <button
                    onClick={() => handleSort('lastInteraction')}
                    className="flex items-center gap-1 hover:text-slate-900"
                  >
                    Last Contact
                    {sortField === 'lastInteraction' && (
                      sortDirection === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                    )}
                  </button>
                </TableCell>
                <TableCell header className="w-12" />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="cursor-pointer"
                  onClick={() => handleViewContact(contact)}
                >
                  <TableCell>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStar(contact);
                      }}
                      className="p-1 rounded hover:bg-slate-100"
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          contact.isStarred ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                        )}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${contact.firstName} ${contact.lastName}`}
                        src={contact.avatar}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{contact.title}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{contact.company}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(contact.category)}>{contact.category}</Badge>
                  </TableCell>
                  <TableCell>
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                      >
                        <Mail className="h-4 w-4" />
                        <span className="text-sm truncate max-w-[180px]">{contact.email}</span>
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full', getRelationshipBgColor(contact.relationshipScore))}
                          style={{ width: `${contact.relationshipScore}%` }}
                        />
                      </div>
                      <span className={cn('text-sm font-semibold', getRelationshipColor(contact.relationshipScore))}>
                        {contact.relationshipScore}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-500">
                      {formatRelativeTime(contact.lastInteraction)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {contact.linkedIn && (
                        <a
                          href={contact.linkedIn}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded hover:bg-slate-100"
                        >
                          <Linkedin className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                        </a>
                      )}
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-slate-100"
                      >
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-slate-200" />
              <p className="mt-4 text-sm text-slate-500">No contacts found</p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onView={handleViewContact}
              onToggleStar={handleToggleStar}
              onEmail={(c) => window.open(`mailto:${c.email}`)}
              onCall={(c) => window.open(`tel:${c.phone}`)}
            />
          ))}

          {filteredContacts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 bg-white rounded-lg border border-slate-200">
              <Users className="h-12 w-12 text-slate-200" />
              <p className="mt-4 text-sm text-slate-500">No contacts found</p>
              {hasActiveFilters && (
                <Button variant="link" size="sm" onClick={clearFilters} className="mt-2">
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactDetailModal
          contact={selectedContact}
          isOpen={!!selectedContact}
          onClose={() => setSelectedContact(null)}
          onToggleStar={handleToggleStar}
        />
      )}

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <AddContactForm
            onSubmit={handleAddContact}
            onCancel={() => setShowAddForm(false)}
            existingCompanies={uniqueCompanies}
            isModal
          />
        </div>
      )}
    </div>
  );
}

export default ContactList;
