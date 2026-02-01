'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  FileText,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Download,
  ChevronRight,
  Eye,
  Edit2,
  History,
  Shield,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { cn, formatDate, formatDateTime, formatCurrency } from '@/lib/utils';

// Types
type DisclosureStatus = 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Requires Update';
type ConflictType = 'Related Party Transaction' | 'Outside Employment' | 'Board Membership' | 'Financial Interest' | 'Family Relationship' | 'Other';
type ApprovalStatus = 'Pending' | 'Approved' | 'Conditionally Approved' | 'Denied';
type CertificationStatus = 'Current' | 'Due Soon' | 'Overdue' | 'Not Submitted';

interface ConflictDisclosure {
  id: string;
  personId: string;
  personName: string;
  personTitle: string;
  conflictType: ConflictType;
  description: string;
  relatedParty: string;
  relationship: string;
  financialImpact?: number;
  status: DisclosureStatus;
  submittedDate: Date;
  reviewedBy?: string;
  reviewedDate?: Date;
  reviewNotes?: string;
  lastUpdated: Date;
  documents?: string[];
}

interface RelatedPartyTransaction {
  id: string;
  disclosureId: string;
  description: string;
  relatedParty: string;
  relationship: string;
  transactionType: string;
  amount: number;
  date: Date;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvalDate?: Date;
  conditions?: string;
  auditCommitteeReviewed: boolean;
  boardApproved: boolean;
}

interface AnnualCertification {
  id: string;
  personId: string;
  personName: string;
  personTitle: string;
  year: number;
  status: CertificationStatus;
  dueDate: Date;
  submittedDate?: Date;
  hasConflicts: boolean;
  conflictCount: number;
}

interface AuditTrailEntry {
  id: string;
  disclosureId: string;
  action: string;
  performedBy: string;
  timestamp: Date;
  details: string;
  previousValue?: string;
  newValue?: string;
}

// Mock data
const disclosures: ConflictDisclosure[] = [
  {
    id: '1',
    personId: '1',
    personName: 'John Smith',
    personTitle: 'CEO',
    conflictType: 'Related Party Transaction',
    description: 'Company engaged Alpha Partners (sponsor entity) for advisory services related to the business combination.',
    relatedParty: 'Alpha Partners LP',
    relationship: 'Sponsor/10% Owner',
    financialImpact: 2500000,
    status: 'Approved',
    submittedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    reviewedBy: 'Audit Committee',
    reviewedDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    reviewNotes: 'Transaction terms reviewed and determined to be at arms length. Approved by majority of independent directors.',
    lastUpdated: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    documents: ['Advisory Agreement', 'Fairness Opinion'],
  },
  {
    id: '2',
    personId: '3',
    personName: 'Sarah Chen',
    personTitle: 'Lead Independent Director',
    conflictType: 'Board Membership',
    description: 'Currently serves on the board of TechGrowth Inc., a potential acquisition target.',
    relatedParty: 'TechGrowth Inc.',
    relationship: 'Board Member',
    status: 'Pending Review',
    submittedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    personId: '2',
    personName: 'Robert Kim',
    personTitle: 'CFO',
    conflictType: 'Family Relationship',
    description: 'Spouse is employed at accounting firm providing tax advisory services to the company.',
    relatedParty: 'Kim & Associates CPA',
    relationship: 'Spouse\'s Employer',
    financialImpact: 150000,
    status: 'Approved',
    submittedDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    reviewedBy: 'Audit Committee',
    reviewedDate: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
    reviewNotes: 'Recusal procedures implemented. CFO will not be involved in any decisions regarding accounting firm engagement.',
    lastUpdated: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    personId: '4',
    personName: 'Michael Torres',
    personTitle: 'Director',
    conflictType: 'Financial Interest',
    description: 'Holds significant equity stake in a competitor of the target company.',
    relatedParty: 'CompetitorCo Holdings',
    relationship: 'Equity Owner (>5%)',
    status: 'Requires Update',
    submittedDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    reviewedBy: 'Audit Committee',
    reviewedDate: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000),
    reviewNotes: 'Required to update disclosure with current holding levels and any changes.',
    lastUpdated: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  },
];

const relatedPartyTransactions: RelatedPartyTransaction[] = [
  {
    id: '1',
    disclosureId: '1',
    description: 'Advisory services for business combination transaction',
    relatedParty: 'Alpha Partners LP',
    relationship: 'Sponsor/10% Owner',
    transactionType: 'Services Agreement',
    amount: 2500000,
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    approvalStatus: 'Approved',
    approvedBy: 'Audit Committee',
    approvalDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000),
    auditCommitteeReviewed: true,
    boardApproved: true,
  },
  {
    id: '2',
    disclosureId: '3',
    description: 'Tax advisory and compliance services for FY2024',
    relatedParty: 'Kim & Associates CPA',
    relationship: 'CFO Spouse\'s Employer',
    transactionType: 'Services Agreement',
    amount: 150000,
    date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    approvalStatus: 'Conditionally Approved',
    approvedBy: 'Audit Committee',
    approvalDate: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000),
    conditions: 'CFO must recuse from all decisions regarding firm engagement. Annual review required.',
    auditCommitteeReviewed: true,
    boardApproved: false,
  },
  {
    id: '3',
    disclosureId: '1',
    description: 'Administrative services reimbursement',
    relatedParty: 'Alpha Partners LP',
    relationship: 'Sponsor/10% Owner',
    transactionType: 'Reimbursement',
    amount: 10000,
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    approvalStatus: 'Pending',
    auditCommitteeReviewed: false,
    boardApproved: false,
  },
];

const annualCertifications: AnnualCertification[] = [
  { id: '1', personId: '1', personName: 'John Smith', personTitle: 'CEO', year: 2025, status: 'Current', dueDate: new Date('2025-03-31'), submittedDate: new Date('2025-01-15'), hasConflicts: true, conflictCount: 1 },
  { id: '2', personId: '2', personName: 'Robert Kim', personTitle: 'CFO', year: 2025, status: 'Current', dueDate: new Date('2025-03-31'), submittedDate: new Date('2025-01-20'), hasConflicts: true, conflictCount: 1 },
  { id: '3', personId: '3', personName: 'Sarah Chen', personTitle: 'Director', year: 2025, status: 'Due Soon', dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), hasConflicts: true, conflictCount: 1 },
  { id: '4', personId: '4', personName: 'Michael Torres', personTitle: 'Director', year: 2025, status: 'Due Soon', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), hasConflicts: true, conflictCount: 1 },
  { id: '5', personId: '5', personName: 'Jennifer Walsh', personTitle: 'Director', year: 2025, status: 'Overdue', dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), hasConflicts: false, conflictCount: 0 },
  { id: '6', personId: '6', personName: 'David Park', personTitle: 'Director', year: 2025, status: 'Not Submitted', dueDate: new Date('2025-03-31'), hasConflicts: false, conflictCount: 0 },
];

const auditTrail: AuditTrailEntry[] = [
  { id: '1', disclosureId: '1', action: 'Created', performedBy: 'John Smith', timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), details: 'Initial disclosure submitted' },
  { id: '2', disclosureId: '1', action: 'Reviewed', performedBy: 'Sarah Chen', timestamp: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000), details: 'Audit Committee review initiated' },
  { id: '3', disclosureId: '1', action: 'Approved', performedBy: 'Audit Committee', timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), details: 'Approved by majority vote of independent directors' },
  { id: '4', disclosureId: '2', action: 'Created', performedBy: 'Sarah Chen', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), details: 'Disclosure submitted for potential conflict' },
  { id: '5', disclosureId: '4', action: 'Status Changed', performedBy: 'System', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), details: 'Status changed to Requires Update', previousValue: 'Approved', newValue: 'Requires Update' },
];

function getDisclosureStatusBadge(status: DisclosureStatus) {
  const variants: Record<DisclosureStatus, 'secondary' | 'warning' | 'success' | 'danger' | 'primary'> = {
    Draft: 'secondary',
    'Pending Review': 'warning',
    Approved: 'success',
    Rejected: 'danger',
    'Requires Update': 'primary',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getApprovalStatusBadge(status: ApprovalStatus) {
  const variants: Record<ApprovalStatus, 'warning' | 'success' | 'primary' | 'danger'> = {
    Pending: 'warning',
    Approved: 'success',
    'Conditionally Approved': 'primary',
    Denied: 'danger',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getCertificationStatusBadge(status: CertificationStatus) {
  const variants: Record<CertificationStatus, 'success' | 'warning' | 'danger' | 'secondary'> = {
    Current: 'success',
    'Due Soon': 'warning',
    Overdue: 'danger',
    'Not Submitted': 'secondary',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getConflictTypeIcon(type: ConflictType) {
  switch (type) {
    case 'Related Party Transaction':
      return <FileText className="h-4 w-4" />;
    case 'Board Membership':
      return <User className="h-4 w-4" />;
    case 'Financial Interest':
      return <AlertTriangle className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
}

export function ConflictOfInterestLog() {
  const [activeTab, setActiveTab] = useState<'disclosures' | 'transactions' | 'certifications' | 'audit'>('disclosures');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDisclosure, setSelectedDisclosure] = useState<ConflictDisclosure | null>(null);
  const [isNewDisclosureModalOpen, setIsNewDisclosureModalOpen] = useState(false);

  const pendingDisclosures = disclosures.filter((d) => d.status === 'Pending Review');
  const pendingTransactions = relatedPartyTransactions.filter((t) => t.approvalStatus === 'Pending');
  const overdueCertifications = annualCertifications.filter((c) => c.status === 'Overdue');

  const filteredDisclosures = disclosures.filter((d) => {
    const matchesSearch =
      d.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.relatedParty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openDisclosureDetail = (disclosure: ConflictDisclosure) => {
    setSelectedDisclosure(disclosure);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-warning-50 p-3">
                <Clock className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingDisclosures.length}</p>
                <p className="text-sm text-slate-500">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary-50 p-3">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{pendingTransactions.length}</p>
                <p className="text-sm text-slate-500">Pending Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-danger-50 p-3">
                <AlertTriangle className="h-6 w-6 text-danger-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{overdueCertifications.length}</p>
                <p className="text-sm text-slate-500">Overdue Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-success-50 p-3">
                <CheckCircle2 className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{disclosures.filter((d) => d.status === 'Approved').length}</p>
                <p className="text-sm text-slate-500">Active Disclosures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {([
            { key: 'disclosures', label: 'Disclosures', count: disclosures.length },
            { key: 'transactions', label: 'Related Party Transactions', count: relatedPartyTransactions.length },
            { key: 'certifications', label: 'Annual Certifications', count: annualCertifications.length },
            { key: 'audit', label: 'Audit Trail', count: null },
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
              {tab.count !== null && (
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
      {activeTab === 'disclosures' && (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Conflict of Interest Disclosures</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search disclosures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-64 rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                </div>
                <Select
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'Pending Review', label: 'Pending Review' },
                    { value: 'Approved', label: 'Approved' },
                    { value: 'Requires Update', label: 'Requires Update' },
                  ]}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-40"
                />
                <Button variant="primary" size="md" onClick={() => setIsNewDisclosureModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Disclosure
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredDisclosures.map((disclosure) => (
                <div
                  key={disclosure.id}
                  className="cursor-pointer rounded-lg border border-slate-200 p-4 transition-all hover:border-primary-300 hover:shadow-sm"
                  onClick={() => openDisclosureDetail(disclosure)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-lg',
                        disclosure.status === 'Approved' ? 'bg-success-100 text-success-600' :
                        disclosure.status === 'Pending Review' ? 'bg-warning-100 text-warning-600' :
                        'bg-slate-100 text-slate-600'
                      )}>
                        {getConflictTypeIcon(disclosure.conflictType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-slate-900">{disclosure.personName}</h3>
                          <span className="text-sm text-slate-500">- {disclosure.personTitle}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600 line-clamp-2">{disclosure.description}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Badge variant="secondary" size="sm">{disclosure.conflictType}</Badge>
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {disclosure.relatedParty}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Submitted {formatDate(disclosure.submittedDate)}
                          </span>
                          {disclosure.financialImpact && (
                            <span className="flex items-center gap-1 font-medium text-slate-700">
                              {formatCurrency(disclosure.financialImpact)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getDisclosureStatusBadge(disclosure.status)}
                      <ChevronRight className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              ))}

              {filteredDisclosures.length === 0 && (
                <div className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No disclosures found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'transactions' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Related Party Transactions</CardTitle>
              <Button variant="secondary" size="md">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Description</TableCell>
                  <TableCell header>Related Party</TableCell>
                  <TableCell header>Type</TableCell>
                  <TableCell header>Amount</TableCell>
                  <TableCell header>Date</TableCell>
                  <TableCell header>Approvals</TableCell>
                  <TableCell header>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relatedPartyTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <p className="font-medium text-slate-900 line-clamp-1">{transaction.description}</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-slate-900">{transaction.relatedParty}</p>
                        <p className="text-xs text-slate-500">{transaction.relationship}</p>
                      </div>
                    </TableCell>
                    <TableCell>{transaction.transactionType}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(transaction.amount)}</TableCell>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                          transaction.auditCommitteeReviewed ? 'bg-success-100 text-success-600' : 'bg-slate-100 text-slate-400'
                        )}>
                          AC
                        </div>
                        <div className={cn(
                          'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                          transaction.boardApproved ? 'bg-success-100 text-success-600' : 'bg-slate-100 text-slate-400'
                        )}>
                          BD
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getApprovalStatusBadge(transaction.approvalStatus)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'certifications' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Annual Certifications - 2025</CardTitle>
              <Button variant="primary" size="md">
                <Plus className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Person</TableCell>
                  <TableCell header>Title</TableCell>
                  <TableCell header>Due Date</TableCell>
                  <TableCell header>Submitted</TableCell>
                  <TableCell header>Conflicts</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {annualCertifications.map((cert) => (
                  <TableRow key={cert.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                          {cert.personName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <span className="font-medium text-slate-900">{cert.personName}</span>
                      </div>
                    </TableCell>
                    <TableCell>{cert.personTitle}</TableCell>
                    <TableCell>
                      <span className={cn(cert.status === 'Overdue' && 'text-danger-600 font-medium')}>
                        {formatDate(cert.dueDate)}
                      </span>
                    </TableCell>
                    <TableCell>{cert.submittedDate ? formatDate(cert.submittedDate) : '-'}</TableCell>
                    <TableCell>
                      {cert.hasConflicts ? (
                        <Badge variant="warning" size="sm">{cert.conflictCount} Disclosed</Badge>
                      ) : (
                        <span className="text-sm text-slate-500">None</span>
                      )}
                    </TableCell>
                    <TableCell>{getCertificationStatusBadge(cert.status)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Audit Trail</CardTitle>
              <Button variant="secondary" size="md">
                <Download className="mr-2 h-4 w-4" />
                Export for Auditors
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditTrail.map((entry, index) => (
                <div key={entry.id} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                      <History className="h-5 w-5 text-slate-500" />
                    </div>
                    {index < auditTrail.length - 1 && (
                      <div className="h-full w-0.5 bg-slate-200 mt-2" style={{ minHeight: '40px' }} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{entry.action}</span>
                      <span className="text-sm text-slate-500">by {entry.performedBy}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{entry.details}</p>
                    {entry.previousValue && entry.newValue && (
                      <p className="mt-1 text-xs text-slate-500">
                        Changed from &quot;{entry.previousValue}&quot; to &quot;{entry.newValue}&quot;
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disclosure Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Disclosure Details"
        size="lg"
      >
        {selectedDisclosure && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-medium text-slate-600">
                  {selectedDisclosure.personName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">{selectedDisclosure.personName}</h3>
                  <p className="text-sm text-slate-500">{selectedDisclosure.personTitle}</p>
                </div>
              </div>
              {getDisclosureStatusBadge(selectedDisclosure.status)}
            </div>

            <div className="rounded-lg border border-slate-200 p-4">
              <h4 className="text-sm font-medium text-slate-700">Conflict Details</h4>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Type</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedDisclosure.conflictType}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Related Party</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedDisclosure.relatedParty}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Relationship</p>
                  <p className="mt-1 text-sm text-slate-900">{selectedDisclosure.relationship}</p>
                </div>
                {selectedDisclosure.financialImpact && (
                  <div>
                    <p className="text-xs text-slate-500">Financial Impact</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatCurrency(selectedDisclosure.financialImpact)}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <p className="text-xs text-slate-500">Description</p>
                <p className="mt-1 text-sm text-slate-700">{selectedDisclosure.description}</p>
              </div>
            </div>

            {selectedDisclosure.reviewNotes && (
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="text-sm font-medium text-slate-700">Review Notes</h4>
                <p className="mt-2 text-sm text-slate-600">{selectedDisclosure.reviewNotes}</p>
                {selectedDisclosure.reviewedBy && (
                  <p className="mt-2 text-xs text-slate-500">
                    Reviewed by {selectedDisclosure.reviewedBy} on {formatDate(selectedDisclosure.reviewedDate)}
                  </p>
                )}
              </div>
            )}

            {selectedDisclosure.documents && selectedDisclosure.documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-700">Supporting Documents</h4>
                <div className="mt-2 space-y-2">
                  {selectedDisclosure.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-primary-600 hover:underline cursor-pointer">
                      <FileText className="h-4 w-4" />
                      {doc}
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
            <Edit2 className="mr-2 h-4 w-4" />
            Edit Disclosure
          </Button>
        </ModalFooter>
      </Modal>

      {/* New Disclosure Modal */}
      <Modal
        isOpen={isNewDisclosureModalOpen}
        onClose={() => setIsNewDisclosureModalOpen(false)}
        title="New Conflict of Interest Disclosure"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Conflict Type"
            options={[
              { value: 'Related Party Transaction', label: 'Related Party Transaction' },
              { value: 'Outside Employment', label: 'Outside Employment' },
              { value: 'Board Membership', label: 'Board Membership' },
              { value: 'Financial Interest', label: 'Financial Interest' },
              { value: 'Family Relationship', label: 'Family Relationship' },
              { value: 'Other', label: 'Other' },
            ]}
            placeholder="Select type"
          />
          <Input label="Related Party Name" placeholder="Enter the name of the related party" />
          <Input label="Relationship" placeholder="Describe the relationship" />
          <Textarea
            label="Description"
            placeholder="Provide a detailed description of the potential conflict..."
          />
          <Input label="Estimated Financial Impact" type="number" placeholder="$0.00" />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsNewDisclosureModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary">Submit Disclosure</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
