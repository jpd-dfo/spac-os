'use client';

import { useState } from 'react';

import {
  FileText,
  Search,
  Download,
  Eye,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  Calendar,
  ChevronRight,
  Plus,
  Send,
  History,
  BookOpen,
  Shield,
  Scale,
  AlertTriangle,
  Bell,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { cn, formatDate } from '@/lib/utils';

// Types
type PolicyCategory = 'Ethics' | 'Trading' | 'Governance' | 'Compliance' | 'HR' | 'Other';
type PolicyStatus = 'Active' | 'Under Review' | 'Pending Approval' | 'Archived';
type AcknowledgmentStatus = 'Acknowledged' | 'Pending' | 'Overdue';

interface Policy {
  id: string;
  name: string;
  category: PolicyCategory;
  description: string;
  version: string;
  effectiveDate: Date;
  lastReviewDate: Date;
  nextReviewDate: Date;
  status: PolicyStatus;
  owner: string;
  approvedBy: string;
  documentUrl: string;
  requiresAcknowledgment: boolean;
  acknowledgmentRate?: number;
  changeLog?: PolicyChange[];
}

interface PolicyChange {
  version: string;
  date: Date;
  description: string;
  approvedBy: string;
}

interface PolicyAcknowledgment {
  id: string;
  policyId: string;
  policyName: string;
  personId: string;
  personName: string;
  personTitle: string;
  dueDate: Date;
  acknowledgedDate?: Date;
  status: AcknowledgmentStatus;
}

// Mock data
const policies: Policy[] = [
  {
    id: '1',
    name: 'Code of Ethics and Business Conduct',
    category: 'Ethics',
    description: 'Comprehensive code outlining ethical standards, expectations for business conduct, and reporting obligations for all directors, officers, and employees.',
    version: '2.1',
    effectiveDate: new Date('2024-01-15'),
    lastReviewDate: new Date('2024-12-01'),
    nextReviewDate: new Date('2025-12-01'),
    status: 'Active',
    owner: 'General Counsel',
    approvedBy: 'Board of Directors',
    documentUrl: '/policies/code-of-ethics-v2.1.pdf',
    requiresAcknowledgment: true,
    acknowledgmentRate: 92,
    changeLog: [
      { version: '2.1', date: new Date('2024-01-15'), description: 'Updated whistleblower procedures and added anti-retaliation provisions', approvedBy: 'Board' },
      { version: '2.0', date: new Date('2023-01-10'), description: 'Major revision to align with SOX requirements', approvedBy: 'Board' },
      { version: '1.0', date: new Date('2022-06-01'), description: 'Initial policy adoption', approvedBy: 'Board' },
    ],
  },
  {
    id: '2',
    name: 'Insider Trading Policy',
    category: 'Trading',
    description: 'Policy governing trading in company securities by insiders, including blackout periods, pre-clearance requirements, and Rule 10b5-1 plan procedures.',
    version: '3.0',
    effectiveDate: new Date('2024-06-01'),
    lastReviewDate: new Date('2024-05-15'),
    nextReviewDate: new Date('2025-05-15'),
    status: 'Active',
    owner: 'General Counsel',
    approvedBy: 'Board of Directors',
    documentUrl: '/policies/insider-trading-v3.0.pdf',
    requiresAcknowledgment: true,
    acknowledgmentRate: 100,
    changeLog: [
      { version: '3.0', date: new Date('2024-06-01'), description: 'Updated to reflect new SEC Rule 10b5-1 amendments', approvedBy: 'Board' },
      { version: '2.0', date: new Date('2023-03-01'), description: 'Added business combination specific provisions', approvedBy: 'Board' },
    ],
  },
  {
    id: '3',
    name: 'Related Party Transactions Policy',
    category: 'Governance',
    description: 'Policy for identifying, reviewing, approving, and disclosing related party transactions as required by SEC regulations and listing standards.',
    version: '1.2',
    effectiveDate: new Date('2024-03-01'),
    lastReviewDate: new Date('2024-02-15'),
    nextReviewDate: new Date('2025-02-15'),
    status: 'Active',
    owner: 'Audit Committee',
    approvedBy: 'Board of Directors',
    documentUrl: '/policies/related-party-v1.2.pdf',
    requiresAcknowledgment: true,
    acknowledgmentRate: 85,
  },
  {
    id: '4',
    name: 'Whistleblower Policy',
    category: 'Compliance',
    description: 'Anonymous reporting mechanisms and procedures for reporting suspected violations of law, regulations, or company policies.',
    version: '1.1',
    effectiveDate: new Date('2024-01-15'),
    lastReviewDate: new Date('2024-01-01'),
    nextReviewDate: new Date('2025-01-01'),
    status: 'Active',
    owner: 'Audit Committee',
    approvedBy: 'Board of Directors',
    documentUrl: '/policies/whistleblower-v1.1.pdf',
    requiresAcknowledgment: true,
    acknowledgmentRate: 95,
  },
  {
    id: '5',
    name: 'Disclosure Controls Policy',
    category: 'Compliance',
    description: 'Procedures for ensuring accurate and timely disclosure of material information in SEC filings and public communications.',
    version: '2.0',
    effectiveDate: new Date('2024-09-01'),
    lastReviewDate: new Date('2024-08-15'),
    nextReviewDate: new Date('2025-08-15'),
    status: 'Active',
    owner: 'CFO',
    approvedBy: 'Disclosure Committee',
    documentUrl: '/policies/disclosure-controls-v2.0.pdf',
    requiresAcknowledgment: false,
  },
  {
    id: '6',
    name: 'Record Retention Policy',
    category: 'Compliance',
    description: 'Guidelines for retention and destruction of corporate records in compliance with legal and regulatory requirements.',
    version: '1.0',
    effectiveDate: new Date('2023-06-01'),
    lastReviewDate: new Date('2023-05-15'),
    nextReviewDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Overdue
    status: 'Under Review',
    owner: 'General Counsel',
    approvedBy: 'Board of Directors',
    documentUrl: '/policies/record-retention-v1.0.pdf',
    requiresAcknowledgment: false,
  },
  {
    id: '7',
    name: 'Anti-Corruption Policy',
    category: 'Compliance',
    description: 'Policy prohibiting bribery and corruption in compliance with FCPA and other anti-corruption laws.',
    version: '1.0',
    effectiveDate: new Date('2023-03-01'),
    lastReviewDate: new Date('2024-03-01'),
    nextReviewDate: new Date('2025-03-01'),
    status: 'Active',
    owner: 'General Counsel',
    approvedBy: 'Board of Directors',
    documentUrl: '/policies/anti-corruption-v1.0.pdf',
    requiresAcknowledgment: true,
    acknowledgmentRate: 88,
  },
  {
    id: '8',
    name: 'Social Media Policy',
    category: 'HR',
    description: 'Guidelines for appropriate use of social media and public communications related to the company.',
    version: '1.1',
    effectiveDate: new Date('2024-02-01'),
    lastReviewDate: new Date('2024-01-15'),
    nextReviewDate: new Date('2025-01-15'),
    status: 'Pending Approval',
    owner: 'HR Director',
    approvedBy: 'General Counsel',
    documentUrl: '/policies/social-media-v1.1.pdf',
    requiresAcknowledgment: true,
    acknowledgmentRate: 0,
  },
];

const acknowledgments: PolicyAcknowledgment[] = [
  { id: '1', policyId: '1', policyName: 'Code of Ethics', personId: '1', personName: 'John Smith', personTitle: 'CEO', dueDate: new Date('2025-02-28'), acknowledgedDate: new Date('2025-01-15'), status: 'Acknowledged' },
  { id: '2', policyId: '1', policyName: 'Code of Ethics', personId: '2', personName: 'Robert Kim', personTitle: 'CFO', dueDate: new Date('2025-02-28'), acknowledgedDate: new Date('2025-01-18'), status: 'Acknowledged' },
  { id: '3', policyId: '1', policyName: 'Code of Ethics', personId: '3', personName: 'Sarah Chen', personTitle: 'Director', dueDate: new Date('2025-02-28'), status: 'Pending' },
  { id: '4', policyId: '2', policyName: 'Insider Trading Policy', personId: '1', personName: 'John Smith', personTitle: 'CEO', dueDate: new Date('2024-07-01'), acknowledgedDate: new Date('2024-06-15'), status: 'Acknowledged' },
  { id: '5', policyId: '2', policyName: 'Insider Trading Policy', personId: '2', personName: 'Robert Kim', personTitle: 'CFO', dueDate: new Date('2024-07-01'), acknowledgedDate: new Date('2024-06-20'), status: 'Acknowledged' },
  { id: '6', policyId: '3', policyName: 'Related Party Policy', personId: '4', personName: 'Michael Torres', personTitle: 'Director', dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), status: 'Overdue' },
  { id: '7', policyId: '4', policyName: 'Whistleblower Policy', personId: '5', personName: 'Jennifer Walsh', personTitle: 'Director', dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), status: 'Pending' },
];

function getCategoryIcon(category: PolicyCategory) {
  switch (category) {
    case 'Ethics':
      return <Scale className="h-5 w-5" />;
    case 'Trading':
      return <AlertTriangle className="h-5 w-5" />;
    case 'Governance':
      return <Shield className="h-5 w-5" />;
    case 'Compliance':
      return <FileText className="h-5 w-5" />;
    case 'HR':
      return <Users className="h-5 w-5" />;
    default:
      return <BookOpen className="h-5 w-5" />;
  }
}

function getCategoryColor(category: PolicyCategory) {
  const colors: Record<PolicyCategory, string> = {
    Ethics: 'bg-purple-100 text-purple-700',
    Trading: 'bg-orange-100 text-orange-700',
    Governance: 'bg-teal-100 text-teal-700',
    Compliance: 'bg-primary-100 text-primary-700',
    HR: 'bg-pink-100 text-pink-700',
    Other: 'bg-slate-100 text-slate-700',
  };
  return colors[category];
}

function getPolicyStatusBadge(status: PolicyStatus) {
  const variants: Record<PolicyStatus, 'success' | 'warning' | 'primary' | 'secondary'> = {
    Active: 'success',
    'Under Review': 'warning',
    'Pending Approval': 'primary',
    Archived: 'secondary',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getAcknowledgmentStatusBadge(status: AcknowledgmentStatus) {
  const variants: Record<AcknowledgmentStatus, 'success' | 'warning' | 'danger'> = {
    Acknowledged: 'success',
    Pending: 'warning',
    Overdue: 'danger',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

export function PolicyLibrary() {
  const [activeTab, setActiveTab] = useState<'library' | 'acknowledgments'>('library');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filter policies
  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || policy.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group policies by category
  const policiesByCategory = filteredPolicies.reduce(
    (acc, policy) => {
      if (!acc[policy.category]) {
        acc[policy.category] = [];
      }
      acc[policy.category].push(policy);
      return acc;
    },
    {} as Record<PolicyCategory, Policy[]>
  );

  const pendingAcknowledgments = acknowledgments.filter((a) => a.status !== 'Acknowledged');
  const overdueReviews = policies.filter((p) => p.nextReviewDate < new Date());

  const openPolicyDetail = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success-50 p-3">
                <FileText className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{policies.filter((p) => p.status === 'Active').length}</p>
                <p className="text-sm text-slate-500">Active Policies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning-50 p-3">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingAcknowledgments.length}</p>
                <p className="text-sm text-slate-500">Pending Acknowledgments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-danger-50 p-3">
                <AlertCircle className="h-6 w-6 text-danger-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{overdueReviews.length}</p>
                <p className="text-sm text-slate-500">Overdue Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary-50 p-3">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(policies.filter((p) => p.acknowledgmentRate).reduce((acc, p) => acc + (p.acknowledgmentRate || 0), 0) / policies.filter((p) => p.acknowledgmentRate).length)}%
                </p>
                <p className="text-sm text-slate-500">Avg Acknowledgment Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {([
            { key: 'library', label: 'Policy Library', count: policies.length },
            { key: 'acknowledgments', label: 'Acknowledgment Tracking', count: pendingAcknowledgments.length },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative border-b-2 pb-4 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'library' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Policy Documents</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search policies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-64 rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                </div>
                <Select
                  options={[
                    { value: 'all', label: 'All Categories' },
                    { value: 'Ethics', label: 'Ethics' },
                    { value: 'Trading', label: 'Trading' },
                    { value: 'Governance', label: 'Governance' },
                    { value: 'Compliance', label: 'Compliance' },
                    { value: 'HR', label: 'HR' },
                  ]}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-40"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(policiesByCategory).map(([category, categoryPolicies]) => (
                <div key={category}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={cn('flex items-center gap-2 rounded-md px-2.5 py-1 text-sm font-medium', getCategoryColor(category as PolicyCategory))}>
                      {getCategoryIcon(category as PolicyCategory)}
                      {category}
                    </span>
                    <span className="text-sm text-slate-500">({categoryPolicies.length} policies)</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categoryPolicies.map((policy) => {
                      const isReviewOverdue = policy.nextReviewDate < new Date();
                      return (
                        <div
                          key={policy.id}
                          className={cn(
                            'cursor-pointer rounded-lg border p-4 transition-all hover:shadow-sm',
                            isReviewOverdue ? 'border-danger-200 bg-danger-50' : 'border-slate-200 hover:border-primary-300'
                          )}
                          onClick={() => openPolicyDetail(policy)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium text-slate-900">{policy.name}</h3>
                                {getPolicyStatusBadge(policy.status)}
                              </div>
                              <p className="mt-1 text-sm text-slate-500 line-clamp-2">{policy.description}</p>
                              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>v{policy.version}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Effective {formatDate(policy.effectiveDate)}
                                </span>
                                {policy.requiresAcknowledgment && policy.acknowledgmentRate !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {policy.acknowledgmentRate}% acknowledged
                                  </span>
                                )}
                              </div>
                              {isReviewOverdue && (
                                <div className="mt-2 flex items-center gap-1 text-xs font-medium text-danger-600">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Review overdue - was due {formatDate(policy.nextReviewDate)}
                                </div>
                              )}
                            </div>
                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {filteredPolicies.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No policies found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'acknowledgments' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Acknowledgment Tracking</CardTitle>
              <Button variant="primary" size="md">
                <Send className="mr-2 h-4 w-4" />
                Send Reminders
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {acknowledgments.map((ack) => (
                <div
                  key={ack.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg border p-4',
                    ack.status === 'Overdue' ? 'border-danger-200 bg-danger-50' :
                    ack.status === 'Pending' ? 'border-warning-200 bg-warning-50' :
                    'border-slate-200'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                      {ack.personName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{ack.personName}</span>
                        <span className="text-sm text-slate-500">- {ack.personTitle}</span>
                      </div>
                      <p className="text-sm text-slate-600">{ack.policyName}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                        <span>Due: {formatDate(ack.dueDate)}</span>
                        {ack.acknowledgedDate && (
                          <span className="text-success-600">
                            Acknowledged: {formatDate(ack.acknowledgedDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getAcknowledgmentStatusBadge(ack.status)}
                    {ack.status !== 'Acknowledged' && (
                      <Button variant="ghost" size="sm">
                        <Bell className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        size="lg"
      >
        <ModalHeader>
          <ModalTitle>{selectedPolicy?.name || 'Policy Details'}</ModalTitle>
        </ModalHeader>
        {selectedPolicy && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="flex items-start justify-between rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-4">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', getCategoryColor(selectedPolicy.category))}>
                  {getCategoryIcon(selectedPolicy.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" size="sm">{selectedPolicy.category}</Badge>
                    {getPolicyStatusBadge(selectedPolicy.status)}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Version {selectedPolicy.version}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-medium text-slate-700">Description</h4>
              <p className="mt-2 text-sm text-slate-600">{selectedPolicy.description}</p>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Effective Date</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(selectedPolicy.effectiveDate)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Last Review</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{formatDate(selectedPolicy.lastReviewDate)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Next Review</p>
                <p className={cn(
                  'mt-1 text-sm font-medium',
                  selectedPolicy.nextReviewDate < new Date() ? 'text-danger-600' : 'text-slate-900'
                )}>
                  {formatDate(selectedPolicy.nextReviewDate)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">Owner</p>
                <p className="mt-1 text-sm font-medium text-slate-900">{selectedPolicy.owner}</p>
              </div>
            </div>

            {/* Acknowledgment Rate */}
            {selectedPolicy.requiresAcknowledgment && selectedPolicy.acknowledgmentRate !== undefined && (
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-700">Acknowledgment Rate</h4>
                  <span className="text-sm font-medium text-slate-900">{selectedPolicy.acknowledgmentRate}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      selectedPolicy.acknowledgmentRate >= 90 ? 'bg-success-500' :
                      selectedPolicy.acknowledgmentRate >= 70 ? 'bg-warning-500' : 'bg-danger-500'
                    )}
                    style={{ width: `${selectedPolicy.acknowledgmentRate}%` }}
                  />
                </div>
              </div>
            )}

            {/* Change Log */}
            {selectedPolicy.changeLog && selectedPolicy.changeLog.length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-medium text-slate-700">Change History</h4>
                <div className="space-y-3">
                  {selectedPolicy.changeLog.map((change, index) => (
                    <div key={index} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        <History className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">v{change.version}</span>
                          <span className="text-xs text-slate-500">{formatDate(change.date)}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{change.description}</p>
                        <p className="mt-1 text-xs text-slate-500">Approved by: {change.approvedBy}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
            Close
          </Button>
          <Button variant="primary">
            <Eye className="mr-2 h-4 w-4" />
            View Full Document
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
