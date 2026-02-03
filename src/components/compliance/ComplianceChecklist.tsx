'use client';

import { useState } from 'react';

import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Search,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn, formatDate } from '@/lib/utils';

// Types
type ChecklistCategory = 'SEC' | 'Exchange' | 'Corporate' | 'Tax';
type ChecklistStatus = 'Complete' | 'In Progress' | 'Not Started' | 'Overdue';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: ChecklistCategory;
  status: ChecklistStatus;
  dueDate: Date | null;
  completedDate: Date | null;
  owner: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string;
  requirement?: string;
}

interface CategoryGroup {
  category: ChecklistCategory;
  items: ChecklistItem[];
  isExpanded: boolean;
}

// Mock data for post-IPO SPAC compliance
const mockChecklistItems: ChecklistItem[] = [
  // SEC Filings
  {
    id: '1',
    title: 'Form 10-K Annual Report',
    description: 'File annual report with SEC within 60 days of fiscal year end',
    category: 'SEC',
    status: 'Complete',
    dueDate: new Date('2025-03-01'),
    completedDate: new Date('2025-02-28'),
    owner: 'Sarah Chen',
    priority: 'Critical',
    requirement: 'SOX Section 302, 404',
  },
  {
    id: '2',
    title: 'Form 10-Q Quarterly Report (Q1)',
    description: 'File quarterly report within 45 days of quarter end',
    category: 'SEC',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Michael Torres',
    priority: 'Critical',
    requirement: 'SOX Section 302',
  },
  {
    id: '3',
    title: 'Form 8-K Material Event Disclosure',
    description: 'File current report within 4 business days of material event',
    category: 'SEC',
    status: 'Complete',
    dueDate: new Date('2025-01-20'),
    completedDate: new Date('2025-01-18'),
    owner: 'Jennifer Walsh',
    priority: 'High',
  },
  {
    id: '4',
    title: 'Proxy Statement (DEF 14A)',
    description: 'File definitive proxy statement for annual meeting',
    category: 'SEC',
    status: 'Not Started',
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Sarah Chen',
    priority: 'High',
    requirement: 'Regulation 14A',
  },
  {
    id: '5',
    title: 'Section 16 Filings (Forms 3, 4, 5)',
    description: 'Ensure all insiders file beneficial ownership reports',
    category: 'SEC',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Legal Team',
    priority: 'High',
    requirement: 'Section 16(a)',
  },
  // Exchange Requirements
  {
    id: '6',
    title: 'NYSE Annual Compliance Certification',
    description: 'CEO certification of compliance with NYSE listing standards',
    category: 'Exchange',
    status: 'Complete',
    dueDate: new Date('2025-01-31'),
    completedDate: new Date('2025-01-30'),
    owner: 'Robert Kim',
    priority: 'High',
    requirement: 'NYSE Rule 303A.12',
  },
  {
    id: '7',
    title: 'Board Independence Requirements',
    description: 'Verify majority of board is independent',
    category: 'Exchange',
    status: 'Complete',
    dueDate: new Date('2025-01-15'),
    completedDate: new Date('2025-01-14'),
    owner: 'Corporate Secretary',
    priority: 'Critical',
    requirement: 'NYSE Rule 303A.01',
  },
  {
    id: '8',
    title: 'Audit Committee Compliance',
    description: 'Ensure audit committee meets independence and financial literacy requirements',
    category: 'Exchange',
    status: 'Complete',
    dueDate: new Date('2025-01-15'),
    completedDate: new Date('2025-01-10'),
    owner: 'Jennifer Walsh',
    priority: 'Critical',
    requirement: 'NYSE Rule 303A.07',
  },
  {
    id: '9',
    title: 'Compensation Committee Charter Review',
    description: 'Annual review of compensation committee charter',
    category: 'Exchange',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'HR Director',
    priority: 'Medium',
    requirement: 'NYSE Rule 303A.05',
  },
  // Corporate Governance
  {
    id: '10',
    title: 'Annual Stockholder Meeting',
    description: 'Hold annual meeting within 13 months of prior meeting',
    category: 'Corporate',
    status: 'Not Started',
    dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Corporate Secretary',
    priority: 'High',
    requirement: 'Delaware General Corporation Law',
  },
  {
    id: '11',
    title: 'Board Meeting Minutes',
    description: 'Document and approve Q4 board meeting minutes',
    category: 'Corporate',
    status: 'Complete',
    dueDate: new Date('2025-01-25'),
    completedDate: new Date('2025-01-24'),
    owner: 'Corporate Secretary',
    priority: 'Medium',
  },
  {
    id: '12',
    title: 'Director & Officer Questionnaires',
    description: 'Annual D&O questionnaires for proxy disclosure',
    category: 'Corporate',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Legal Team',
    priority: 'High',
  },
  {
    id: '13',
    title: 'Code of Ethics Annual Review',
    description: 'Review and update code of ethics and business conduct',
    category: 'Corporate',
    status: 'Overdue',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Compliance Officer',
    priority: 'High',
    requirement: 'SOX Section 406',
  },
  {
    id: '14',
    title: 'Related Party Transaction Review',
    description: 'Quarterly review of related party transactions',
    category: 'Corporate',
    status: 'Not Started',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Audit Committee',
    priority: 'Medium',
  },
  // Tax Compliance
  {
    id: '15',
    title: 'Federal Tax Return (Form 1120)',
    description: 'File corporate federal income tax return',
    category: 'Tax',
    status: 'Not Started',
    dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Tax Director',
    priority: 'Critical',
  },
  {
    id: '16',
    title: 'State Tax Filings',
    description: 'File state income tax returns in applicable jurisdictions',
    category: 'Tax',
    status: 'Not Started',
    dueDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Tax Director',
    priority: 'High',
  },
  {
    id: '17',
    title: 'Quarterly Tax Estimate (Q1)',
    description: 'File quarterly estimated tax payment',
    category: 'Tax',
    status: 'Overdue',
    dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Tax Director',
    priority: 'High',
  },
  {
    id: '18',
    title: 'Transfer Pricing Documentation',
    description: 'Annual transfer pricing study and documentation',
    category: 'Tax',
    status: 'In Progress',
    dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    completedDate: null,
    owner: 'Tax Director',
    priority: 'Medium',
  },
];

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'SEC', label: 'SEC Filings' },
  { value: 'Exchange', label: 'Exchange Requirements' },
  { value: 'Corporate', label: 'Corporate Governance' },
  { value: 'Tax', label: 'Tax Compliance' },
];

const statusOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Complete', label: 'Complete' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'Overdue', label: 'Overdue' },
];

function getStatusIcon(status: ChecklistStatus) {
  switch (status) {
    case 'Complete':
      return <CheckCircle2 className="h-5 w-5 text-success-500" />;
    case 'In Progress':
      return <Clock className="h-5 w-5 text-warning-500" />;
    case 'Not Started':
      return <XCircle className="h-5 w-5 text-slate-300" />;
    case 'Overdue':
      return <AlertCircle className="h-5 w-5 text-danger-500" />;
    default:
      return <XCircle className="h-5 w-5 text-slate-300" />;
  }
}

function getStatusBadge(status: ChecklistStatus) {
  const variants: Record<ChecklistStatus, 'success' | 'warning' | 'secondary' | 'danger'> = {
    Complete: 'success',
    'In Progress': 'warning',
    'Not Started': 'secondary',
    Overdue: 'danger',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getPriorityBadge(priority: string) {
  const variants: Record<string, 'danger' | 'warning' | 'primary' | 'secondary'> = {
    Critical: 'danger',
    High: 'warning',
    Medium: 'primary',
    Low: 'secondary',
  };
  return (
    <Badge variant={variants[priority] || 'secondary'} size="sm">
      {priority}
    </Badge>
  );
}

function getCategoryColor(category: ChecklistCategory) {
  const colors: Record<ChecklistCategory, string> = {
    SEC: 'bg-primary-100 text-primary-700',
    Exchange: 'bg-purple-100 text-purple-700',
    Corporate: 'bg-teal-100 text-teal-700',
    Tax: 'bg-orange-100 text-orange-700',
  };
  return colors[category];
}

export function ComplianceChecklist() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['SEC', 'Exchange', 'Corporate', 'Tax'])
  );

  // Filter items
  const filteredItems = mockChecklistItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Group by category
  const groupedItems = filteredItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<ChecklistCategory, ChecklistItem[]>
  );

  // Calculate progress
  const totalItems = filteredItems.length;
  const completedItems = filteredItems.filter((item) => item.status === 'Complete').length;
  const inProgressItems = filteredItems.filter((item) => item.status === 'In Progress').length;
  const overdueItems = filteredItems.filter((item) => item.status === 'Overdue').length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Compliance Checklist</CardTitle>
            <p className="mt-1 text-sm text-slate-500">
              SOX and SEC compliance requirements tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
              <span className="text-sm font-medium text-slate-600">Progress:</span>
              <span className="text-lg font-bold text-primary-600">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-600">
              {completedItems} of {totalItems} items complete
            </span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-warning-600">
                <Clock className="h-4 w-4" /> {inProgressItems} in progress
              </span>
              {overdueItems > 0 && (
                <span className="flex items-center gap-1.5 text-danger-600">
                  <AlertCircle className="h-4 w-4" /> {overdueItems} overdue
                </span>
              )}
            </div>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-success-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search items, owners..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
              />
            </div>
          </div>
          <Select
            options={categoryOptions}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48"
          />
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>

        {/* Checklist Items by Category */}
        <div className="space-y-4">
          {(['SEC', 'Exchange', 'Corporate', 'Tax'] as ChecklistCategory[]).map((category) => {
            const items = groupedItems[category] || [];
            if (items.length === 0) {return null;}

            const categoryComplete = items.filter((i) => i.status === 'Complete').length;
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="rounded-lg border border-slate-200">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    )}
                    <span className={cn('rounded-md px-2.5 py-1 text-sm font-medium', getCategoryColor(category))}>
                      {category === 'SEC'
                        ? 'SEC Filings'
                        : category === 'Exchange'
                          ? 'Exchange Requirements'
                          : category === 'Corporate'
                            ? 'Corporate Governance'
                            : 'Tax Compliance'}
                    </span>
                    <span className="text-sm text-slate-500">
                      {categoryComplete}/{items.length} complete
                    </span>
                  </div>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-success-500"
                      style={{ width: `${(categoryComplete / items.length) * 100}%` }}
                    />
                  </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="border-t border-slate-200">
                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-start gap-4 px-4 py-3',
                          index !== items.length - 1 && 'border-b border-slate-100'
                        )}
                      >
                        <div className="mt-0.5">{getStatusIcon(item.status)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4
                              className={cn(
                                'font-medium',
                                item.status === 'Complete' ? 'text-slate-500 line-through' : 'text-slate-900'
                              )}
                            >
                              {item.title}
                            </h4>
                            {getPriorityBadge(item.priority)}
                            {item.requirement && (
                              <span className="text-xs text-slate-500">({item.requirement})</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {item.owner}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {item.status === 'Complete'
                                ? `Completed ${formatDate(item.completedDate)}`
                                : `Due ${formatDate(item.dueDate)}`}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">{getStatusBadge(item.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-sm text-slate-500">No items match your filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
