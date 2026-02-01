'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  X,
  Clock,
  FileText,
  Filter,
  ChevronDown,
  Calendar,
  User,
  Tag,
  Folder,
  SlidersHorizontal,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { DocumentData } from './DocumentCard';

interface SearchFilters {
  fileTypes: string[];
  categories: string[];
  statuses: string[];
  dateRange: { start: Date | null; end: Date | null };
  owners: string[];
  tags: string[];
}

interface DocumentSearchProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  documents: DocumentData[];
  onSelectDocument?: (doc: DocumentData) => void;
}

const fileTypes = [
  { id: 'pdf', label: 'PDF', color: 'bg-red-100 text-red-700' },
  { id: 'docx', label: 'Word', color: 'bg-blue-100 text-blue-700' },
  { id: 'xlsx', label: 'Excel', color: 'bg-green-100 text-green-700' },
  { id: 'pptx', label: 'PowerPoint', color: 'bg-orange-100 text-orange-700' },
];

const categories = [
  'Formation Documents',
  'SEC Filings',
  'Transaction Documents',
  'Due Diligence',
  'Governance',
  'Investor Relations',
  'Templates',
];

const statuses = [
  { id: 'DRAFT', label: 'Draft' },
  { id: 'UNDER_REVIEW', label: 'Under Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'FINAL', label: 'Final' },
];

const dateRangeOptions = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Last 7 days' },
  { id: 'month', label: 'Last 30 days' },
  { id: 'quarter', label: 'Last 90 days' },
  { id: 'year', label: 'Last year' },
  { id: 'custom', label: 'Custom range' },
];

// Mock recent searches
const recentSearches = [
  'merger agreement techcorp',
  'NDA cloudscale',
  'board minutes 2024',
  'S-1 registration',
  'due diligence financial',
];

export function DocumentSearch({
  onSearch,
  documents,
  onSelectDocument,
}: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    fileTypes: [],
    categories: [],
    statuses: [],
    dateRange: { start: null, end: null },
    owners: [],
    tags: [],
  });
  const [selectedDateRange, setSelectedDateRange] = useState<string>('');
  const [searchResults, setSearchResults] = useState<DocumentData[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get unique owners from documents
  const owners = [...new Set(documents.map((d) => d.uploadedBy))];

  // Get unique tags from documents
  const allTags = [...new Set(documents.flatMap((d) => d.tags || []))];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    // Perform search when query or filters change
    if (query.length > 0) {
      const results = documents.filter((doc) => {
        const matchesQuery =
          doc.name.toLowerCase().includes(query.toLowerCase()) ||
          doc.fileName.toLowerCase().includes(query.toLowerCase()) ||
          doc.description?.toLowerCase().includes(query.toLowerCase()) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase()));

        const matchesFileType =
          filters.fileTypes.length === 0 ||
          filters.fileTypes.some((type) => doc.fileName.toLowerCase().endsWith(`.${type}`));

        const matchesStatus =
          filters.statuses.length === 0 || filters.statuses.includes(doc.status);

        return matchesQuery && matchesFileType && matchesStatus;
      });

      setSearchResults(results.slice(0, 8));
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [query, filters, documents]);

  const toggleFilter = (filterType: keyof SearchFilters, value: string) => {
    setFilters((prev) => {
      const current = prev[filterType] as string[];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [filterType]: updated };
    });
  };

  const clearFilters = () => {
    setFilters({
      fileTypes: [],
      categories: [],
      statuses: [],
      dateRange: { start: null, end: null },
      owners: [],
      tags: [],
    });
    setSelectedDateRange('');
  };

  const handleSearch = () => {
    onSearch(query, filters);
    setShowResults(false);
  };

  const handleRecentSearch = (search: string) => {
    setQuery(search);
    inputRef.current?.focus();
  };

  const activeFilterCount =
    filters.fileTypes.length +
    filters.categories.length +
    filters.statuses.length +
    filters.owners.length +
    filters.tags.length +
    (selectedDateRange ? 1 : 0);

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-inherit">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div ref={searchRef} className="relative">
      {/* Search Input */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search documents by name, content, or tags..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setShowResults(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-slate-100"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          )}
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(activeFilterCount > 0 && 'border-primary-500')}
        >
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Search Dropdown */}
      {(isFocused || showResults) && (
        <div className="absolute top-full z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Recent Searches (when no query) */}
          {!query && (
            <div className="p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Searches
              </h4>
              <div className="space-y-1">
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearch(search)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Clock className="h-4 w-4 text-slate-400" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && searchResults.length > 0 && (
            <div className="p-2">
              <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Documents ({searchResults.length})
              </h4>
              <div className="space-y-1">
                {searchResults.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      onSelectDocument?.(doc);
                      setShowResults(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {highlightMatch(doc.name, query)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{doc.category}</span>
                        <span>|</span>
                        <span>{formatRelativeTime(doc.updatedAt)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" size="sm">
                      v{doc.version}
                    </Badge>
                  </button>
                ))}
              </div>
              <button
                onClick={handleSearch}
                className="mt-2 w-full rounded-lg bg-slate-50 py-2 text-center text-sm text-primary-600 hover:bg-slate-100"
              >
                View all results for "{query}"
              </button>
            </div>
          )}

          {/* No Results */}
          {query && searchResults.length === 0 && (
            <div className="p-8 text-center">
              <Search className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No documents found for "{query}"</p>
              <p className="mt-1 text-xs text-slate-400">Try different keywords or check filters</p>
            </div>
          )}
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-slate-900">Filter Documents</h4>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline">
                Clear all filters
              </button>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* File Type */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                File Type
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {fileTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => toggleFilter('fileTypes', type.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      filters.fileTypes.includes(type.id) ? type.color : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.id}
                    onClick={() => toggleFilter('statuses', status.id)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      filters.statuses.includes(status.id)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Date Modified
              </label>
              <div className="mt-2">
                <select
                  value={selectedDateRange}
                  onChange={(e) => setSelectedDateRange(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                >
                  <option value="">Any time</option>
                  {dateRangeOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Owner
              </label>
              <div className="mt-2">
                <select
                  value={filters.owners[0] || ''}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      owners: e.target.value ? [e.target.value] : [],
                    }))
                  }
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700"
                >
                  <option value="">Anyone</option>
                  {owners.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter */}
          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Category
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => toggleFilter('categories', category)}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    filters.categories.includes(category)
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  <Folder className="mr-1.5 inline-block h-3 w-3" />
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilterCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
              <span className="text-sm text-slate-500">Active filters:</span>
              {filters.fileTypes.map((type) => (
                <Badge key={type} variant="primary" size="sm">
                  {type.toUpperCase()}
                  <button onClick={() => toggleFilter('fileTypes', type)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.statuses.map((status) => (
                <Badge key={status} variant="primary" size="sm">
                  {status.replace('_', ' ')}
                  <button onClick={() => toggleFilter('statuses', status)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.categories.map((category) => (
                <Badge key={category} variant="primary" size="sm">
                  {category}
                  <button onClick={() => toggleFilter('categories', category)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedDateRange && (
                <Badge variant="primary" size="sm">
                  {dateRangeOptions.find((o) => o.id === selectedDateRange)?.label}
                  <button onClick={() => setSelectedDateRange('')} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.owners.map((owner) => (
                <Badge key={owner} variant="primary" size="sm">
                  {owner}
                  <button onClick={() => toggleFilter('owners', owner)} className="ml-1">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
