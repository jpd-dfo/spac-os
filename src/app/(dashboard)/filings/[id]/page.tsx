'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { differenceInDays, startOfDay, addDays } from 'date-fns';
import {
  ArrowLeft,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  ExternalLink,
  Edit,
  Download,
  History,
  Send,
  ChevronRight,
  Plus,
  Trash2,
  MoreHorizontal,
  Copy,
  RefreshCw,
  ArrowRightCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { FilingStatusBadge } from '@/components/filings/FilingStatusBadge';
import { FilingStatusProgression, type StatusChangeEvent } from '@/components/filings/FilingTimeline';
import { FILING_DEFINITIONS } from '@/lib/compliance/complianceRules';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// MOCK DATA
// ============================================================================

interface FilingDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  version: number;
  uploadedAt: Date;
  uploadedBy: string;
}

interface FilingComment {
  id: string;
  type: 'SEC_COMMENT' | 'INTERNAL_NOTE' | 'REVIEW_FEEDBACK';
  author: string;
  content: string;
  createdAt: Date;
  status?: 'OPEN' | 'ADDRESSED' | 'RESOLVED';
}

interface FilingAmendment {
  id: string;
  version: string;
  filedDate: Date;
  accessionNumber: string;
  description: string;
  edgarUrl?: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  status: 'COMPLETE' | 'CURRENT' | 'PENDING';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

interface ChecklistItem {
  id: string;
  name: string;
  category: string;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED';
  assignee?: string;
  dueDate?: Date;
  notes?: string;
}

interface FilingPageData {
  id: string;
  type: FilingType;
  title: string;
  description: string;
  spacId: string;
  spacName: string;
  ticker: string;
  cik?: string;
  status: FilingStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: Date;
  filedDate?: Date;
  effectiveDate?: Date;
  accessionNumber?: string;
  edgarUrl?: string;
  secFileNumber?: string;
  statusHistory: StatusChangeEvent[];
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  reviewers: {
    id: string;
    name: string;
    email: string;
    reviewStatus: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
    reviewedAt?: Date;
    comments?: string;
  }[];
  documents: FilingDocument[];
  comments: FilingComment[];
  amendments: FilingAmendment[];
  workflowSteps: WorkflowStep[];
  checklist: ChecklistItem[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusConfig(status: FilingStatus): { label: string; color: string; bgColor: string; variant: 'danger' | 'warning' | 'success' | 'primary' | 'secondary' } {
  const configs: Record<FilingStatus, { label: string; color: string; bgColor: string; variant: 'danger' | 'warning' | 'success' | 'primary' | 'secondary' }> = {
    DRAFT: { label: 'Draft', color: 'text-slate-700', bgColor: 'bg-slate-100', variant: 'secondary' },
    INTERNAL_REVIEW: { label: 'Internal Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100', variant: 'warning' },
    EXTERNAL_REVIEW: { label: 'External Review', color: 'text-blue-700', bgColor: 'bg-blue-100', variant: 'primary' },
    SUBMITTED: { label: 'Submitted', color: 'text-indigo-700', bgColor: 'bg-indigo-100', variant: 'primary' },
    SEC_COMMENT: { label: 'SEC Comment', color: 'text-orange-700', bgColor: 'bg-orange-100', variant: 'warning' },
    RESPONSE_FILED: { label: 'Response Filed', color: 'text-purple-700', bgColor: 'bg-purple-100', variant: 'primary' },
    EFFECTIVE: { label: 'Effective', color: 'text-green-700', bgColor: 'bg-green-100', variant: 'success' },
    COMPLETE: { label: 'Filed', color: 'text-green-700', bgColor: 'bg-green-100', variant: 'success' },
  };
  return configs[status];
}

function getPriorityConfig(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): { label: string; variant: 'danger' | 'warning' | 'primary' | 'secondary' } {
  const configs = {
    CRITICAL: { label: 'Critical', variant: 'danger' as const },
    HIGH: { label: 'High', variant: 'warning' as const },
    MEDIUM: { label: 'Medium', variant: 'primary' as const },
    LOW: { label: 'Low', variant: 'secondary' as const },
  };
  return configs[priority];
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 B';}
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Build SEC EDGAR URL from CIK and form type
function buildSecEdgarUrl(cik?: string, formType?: FilingType): string | null {
  if (!cik) {
    return null;
  }
  const cleanCik = cik.replace(/^0+/, '');
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${cleanCik}&type=${formType || ''}&dateb=&owner=include&count=40`;
}

// Get valid status transitions
function getValidStatusTransitions(currentStatus: FilingStatus): { status: FilingStatus; label: string }[] {
  const transitions: Record<FilingStatus, { status: FilingStatus; label: string }[]> = {
    DRAFT: [
      { status: 'INTERNAL_REVIEW', label: 'Send for Internal Review' },
    ],
    INTERNAL_REVIEW: [
      { status: 'EXTERNAL_REVIEW', label: 'Send for External Review' },
      { status: 'DRAFT', label: 'Return to Draft' },
    ],
    EXTERNAL_REVIEW: [
      { status: 'SUBMITTED', label: 'Mark as Submitted to SEC' },
      { status: 'INTERNAL_REVIEW', label: 'Return to Internal Review' },
    ],
    SUBMITTED: [
      { status: 'SEC_COMMENT', label: 'SEC Comment Received' },
      { status: 'EFFECTIVE', label: 'Mark as Effective' },
      { status: 'COMPLETE', label: 'Mark as Complete' },
    ],
    SEC_COMMENT: [
      { status: 'RESPONSE_FILED', label: 'Response Filed' },
    ],
    RESPONSE_FILED: [
      { status: 'SEC_COMMENT', label: 'Additional Comment Received' },
      { status: 'EFFECTIVE', label: 'Mark as Effective' },
      { status: 'COMPLETE', label: 'Mark as Complete' },
    ],
    EFFECTIVE: [],
    COMPLETE: [],
  };
  return transitions[currentStatus] || [];
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default function FilingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const filingId = params['id'] as string;

  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'comments' | 'checklist' | 'history'>('overview');
  const [newComment, setNewComment] = useState('');
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<FilingStatus | null>(null);

  // Fetch filing from API
  const filingQuery = trpc.filing.getById.useQuery(
    { id: filingId },
    { enabled: !!filingId, refetchOnWindowFocus: false }
  );

  // Fetch workflow steps
  const workflowQuery = trpc.filing.getWorkflow.useQuery(
    { filingId },
    { enabled: !!filingId }
  );

  // Fetch reviewers
  const reviewersQuery = trpc.filing.getReviewers.useQuery(
    { filingId },
    { enabled: !!filingId }
  );

  // Fetch checklist
  const checklistQuery = trpc.filing.getChecklist.useQuery(
    { filingId },
    { enabled: !!filingId }
  );

  // Transform API data to FilingPageData format
  const filing = useMemo((): FilingPageData | null => {
    const data = filingQuery.data;
    if (!data) {
      return null;
    }

    const today = new Date();

    // Map filing type from Prisma to frontend format
    const typeMap: Record<string, FilingType> = {
      'FORM_10K': 'FORM_10K',
      'FORM_10Q': 'FORM_10Q',
      'FORM_8K': 'FORM_8K',
      'FORM_S1': 'S1',
      'FORM_S4': 'S4',
      'DEF14A': 'DEF14A',
      'DEFA14A': 'DEFA14A',
      'PREM14A': 'PREM14A',
      'PROXY': 'DEF14A',
      'FORM_13F': 'OTHER',
      'FORM_425': 'FORM_425',
      'SC_13D': 'SC_13D',
      'SC_13G': 'SC_13G',
      'FORM_3': 'FORM_3',
      'FORM_4': 'FORM_4',
      'FORM_5': 'FORM_5',
      'SUPER_8K': 'SUPER_8K',
    };

    // Map status to expected format - only valid FilingStatus values
    const statusMap: Record<string, FilingStatus> = {
      'DRAFTING': 'DRAFT',
      'INTERNAL_REVIEW': 'INTERNAL_REVIEW',
      'LEGAL_REVIEW': 'EXTERNAL_REVIEW',
      'BOARD_APPROVAL': 'INTERNAL_REVIEW',
      'FILED': 'SUBMITTED',
      'SEC_COMMENT': 'SEC_COMMENT',
      'RESPONSE_FILED': 'RESPONSE_FILED',
      'AMENDED': 'RESPONSE_FILED',
      'EFFECTIVE': 'EFFECTIVE',
      'WITHDRAWN': 'COMPLETE',
      'ACCEPTED': 'EFFECTIVE',
    };

    // Build status history from available dates - using only valid FilingStatus values
    const statusHistory: StatusChangeEvent[] = [];
    if (data.createdAt) {
      statusHistory.push({ status: 'DRAFT', date: new Date(data.createdAt), description: 'Filing created' });
    }
    if (data.internalReviewDate) {
      statusHistory.push({ status: 'INTERNAL_REVIEW', date: new Date(data.internalReviewDate), description: 'Sent for internal review' });
    }
    if (data.externalReviewDate) {
      statusHistory.push({ status: 'EXTERNAL_REVIEW', date: new Date(data.externalReviewDate), description: 'Sent for external legal review' });
    }
    if (data.filedDate) {
      statusHistory.push({ status: 'SUBMITTED', date: new Date(data.filedDate), description: 'Filed with SEC via EDGAR' });
    }
    if (data.secCommentDate) {
      statusHistory.push({ status: 'SEC_COMMENT', date: new Date(data.secCommentDate), description: `SEC comment letter received - ${data.secCommentCount || 0} comments` });
    }
    if (data.responseDate) {
      statusHistory.push({ status: 'RESPONSE_FILED', date: new Date(data.responseDate), description: 'Response to SEC comments submitted' });
    }
    if (data.effectiveDate) {
      statusHistory.push({ status: 'EFFECTIVE', date: new Date(data.effectiveDate), description: 'Registration declared effective' });
    }

    return {
      id: data.id,
      type: typeMap[data.type] || 'OTHER' as FilingType,
      title: data.title || `${data.type} Filing`,
      description: data.description || '',
      spacId: data.spacId,
      spacName: data.spac?.name || 'Unknown',
      ticker: data.spac?.ticker || '',
      cik: data.cik || data.spac?.cik || undefined,
      status: statusMap[data.status] || data.status as FilingStatus,
      priority: 'HIGH',
      dueDate: data.dueDate ? new Date(data.dueDate) : addDays(today, 30),
      filedDate: data.filedDate ? new Date(data.filedDate) : undefined,
      effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
      accessionNumber: data.accessionNumber || undefined,
      edgarUrl: data.edgarUrl || undefined,
      secFileNumber: data.fileNumber || undefined,
      statusHistory,
      assignee: undefined,
      reviewers: (reviewersQuery.data || []).map((r) => ({
        id: r.id,
        name: r.name || r.email || 'Unknown',
        email: r.email || '',
        reviewStatus: r.status === 'approved' ? 'APPROVED' as const :
                      r.status === 'changes_requested' ? 'CHANGES_REQUESTED' as const : 'PENDING' as const,
        reviewedAt: r.reviewedAt ? new Date(r.reviewedAt) : undefined,
        comments: r.comments || undefined,
      })),
      documents: (data.documents || []).map((d: any) => ({
        id: d.document?.id || d.id,
        name: d.document?.name || 'Document',
        type: d.document?.type || 'application/pdf',
        size: d.document?.size || 0,
        version: 1,
        uploadedAt: d.document?.createdAt ? new Date(d.document.createdAt) : new Date(),
        uploadedBy: 'System',
      })),
      comments: (data.secComments || []).map((c: any) => ({
        id: c.id,
        type: 'SEC_COMMENT' as const,
        author: 'SEC Staff',
        content: c.commentText,
        createdAt: new Date(c.receivedDate),
        status: c.isResolved ? 'RESOLVED' as const : 'OPEN' as const,
      })),
      amendments: (data.amendments || []).map((a: any) => ({
        id: a.id,
        version: `Amendment ${a.amendmentNumber}`,
        filedDate: a.filedDate ? new Date(a.filedDate) : new Date(),
        accessionNumber: a.accessionNumber || '',
        description: `Amendment ${a.amendmentNumber}`,
        edgarUrl: undefined,
      })),
      workflowSteps: (workflowQuery.data || []).map((step) => ({
        id: step.id,
        name: step.name,
        status: step.status === 'completed' ? 'COMPLETE' as const :
                step.status === 'in_progress' ? 'CURRENT' as const : 'PENDING' as const,
        completedAt: step.completedAt ? new Date(step.completedAt) : undefined,
        completedBy: step.completedById || undefined,
        notes: step.description || undefined,
      })),
      checklist: (checklistQuery.data || []).map((item) => ({
        id: item.id,
        name: item.item,
        category: item.category || 'General',
        status: item.isCompleted ? 'COMPLETE' as const : 'NOT_STARTED' as const,
        assignee: item.completedBy || undefined,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        notes: item.description || undefined,
      })),
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    };
  }, [filingQuery.data, workflowQuery.data, reviewersQuery.data, checklistQuery.data]);

  // Valid status transitions - must call before early returns
  const validTransitions = useMemo(() => {
    if (!filing) {
      return [];
    }
    return getValidStatusTransitions(filing.status);
  }, [filing]);

  // SEC EDGAR URL - must call before early returns
  const secEdgarUrl = useMemo(() => {
    if (!filing) {
      return '';
    }
    return filing.edgarUrl || buildSecEdgarUrl(filing.cik, filing.type);
  }, [filing]);

  // Derived values - safe to compute even with null filing (used after early return)
  const _statusConfig = filing ? getStatusConfig(filing.status) : { icon: FileText, label: 'Unknown', colorClass: 'text-slate-500', bgClass: 'bg-slate-100' };
  const priorityConfig = filing ? getPriorityConfig(filing.priority) : { label: 'Unknown', variant: 'secondary' as const };
  const filingDefinition = filing ? FILING_DEFINITIONS[filing.type] : null;

  const daysUntilDue = filing ? differenceInDays(startOfDay(filing.dueDate), startOfDay(new Date())) : 0;
  const isOverdue = filing ? daysUntilDue < 0 && !['COMPLETE', 'EFFECTIVE', 'SUBMITTED'].includes(filing.status) : false;

  // Calculate checklist progress
  const checklistProgress = filing ? {
    total: filing.checklist.length,
    complete: filing.checklist.filter((c) => c.status === 'COMPLETE').length,
    inProgress: filing.checklist.filter((c) => c.status === 'IN_PROGRESS').length,
  } : { total: 0, complete: 0, inProgress: 0 };

  // Open SEC comments
  const openSecComments = filing ? filing.comments.filter(
    (c) => c.type === 'SEC_COMMENT' && c.status === 'OPEN'
  ).length : 0;

  const handleAddComment = () => {
    if (newComment.trim()) {
      // TODO: Call API to add comment
      setNewComment('');
    }
  };

  // Loading state
  if (filingQuery.isLoading || workflowQuery.isLoading || reviewersQuery.isLoading || checklistQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-sm text-slate-500">Loading filing...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (filingQuery.isError || !filing) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-danger-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Filing not found</h3>
            <p className="mt-2 text-sm text-slate-500">
              {filingQuery.error?.message || 'The requested filing could not be found.'}
            </p>
            <Button variant="primary" size="md" className="mt-4" onClick={() => router.push('/filings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Filings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push('/filings')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Filings
        </Button>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/filings" className="hover:text-primary-600">Filings</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900">{FILING_TYPE_LABELS[filing.type]}</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary-50 p-3">
            <FileText className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">
                {FILING_TYPE_LABELS[filing.type]}
              </h1>
              <FilingStatusBadge status={filing.status} showIcon />
              <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
              {isOverdue && <Badge variant="danger">Overdue</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-600">{filing.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>{filing.spacName} ({filing.ticker})</span>
              {filing.accessionNumber && (
                <span className="flex items-center gap-1">
                  Accession: {filing.accessionNumber}
                  {secEdgarUrl && (
                    <a
                      href={secEdgarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </span>
              )}
              {filing.secFileNumber && (
                <span>SEC File #: {filing.secFileNumber}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* SEC EDGAR Link */}
          {secEdgarUrl && (
            <Button
              variant="secondary"
              onClick={() => window.open(secEdgarUrl, '_blank')}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on SEC EDGAR
            </Button>
          )}

          {/* Update Status Button */}
          {validTransitions.length > 0 && (
            <Dropdown
              trigger={
                <Button variant="secondary">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              }
              align="right"
            >
              {validTransitions.map((transition) => (
                <DropdownItem
                  key={transition.status}
                  onClick={() => {
                    setSelectedNewStatus(transition.status);
                    setShowUpdateStatusModal(true);
                  }}
                >
                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                  {transition.label}
                </DropdownItem>
              ))}
            </Dropdown>
          )}

          <Dropdown
            trigger={
              <Button variant="secondary">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Actions
              </Button>
            }
            align="right"
          >
            <DropdownItem onClick={() => { /* TODO: Implement edit */ }}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Filing
            </DropdownItem>
            <DropdownItem onClick={() => { /* TODO: Implement duplicate */ }}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownItem>
            <DropdownItem onClick={() => { /* TODO: Implement export */ }}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownItem>
            <div className="my-1 border-t border-slate-100" />
            <DropdownItem onClick={() => { /* TODO: Implement delete */ }} className="text-danger-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Filing
            </DropdownItem>
          </Dropdown>
          {filing.status === 'SEC_COMMENT' && (
            <Button>
              <Send className="mr-2 h-4 w-4" />
              File Response
            </Button>
          )}
        </div>
      </div>

      {/* Status Progression Timeline */}
      <FilingStatusProgression
        filing={{
          id: filing.id,
          type: filing.type,
          title: filing.title,
          status: filing.status,
          dueDate: filing.dueDate,
          filedDate: filing.filedDate,
          effectiveDate: filing.effectiveDate,
          priority: filing.priority,
          cik: filing.cik,
          accessionNumber: filing.accessionNumber,
          statusHistory: filing.statusHistory,
        }}
      />

      {/* Alert Banner for SEC Comments */}
      {filing.status === 'SEC_COMMENT' && openSecComments > 0 && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-warning-800">
                SEC Comment Letter - Response Required
              </h3>
              <p className="mt-1 text-sm text-warning-700">
                {openSecComments} comment{openSecComments > 1 ? 's' : ''} require response.
                Response deadline: {formatDate(filing.dueDate)}
                {daysUntilDue > 0 && ` (${daysUntilDue} days remaining)`}
                {daysUntilDue === 0 && ' (Due today!)'}
                {daysUntilDue < 0 && ` (${Math.abs(daysUntilDue)} days overdue)`}
              </p>
            </div>
            <Button size="sm" onClick={() => setActiveTab('comments')}>
              View Comments
            </Button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className={cn(
                  'text-lg font-semibold',
                  isOverdue ? 'text-danger-600' : daysUntilDue <= 7 ? 'text-warning-600' : 'text-slate-900'
                )}>
                  {formatDate(filing.dueDate)}
                </p>
              </div>
              <Calendar className={cn(
                'h-8 w-8',
                isOverdue ? 'text-danger-300' : 'text-primary-300'
              )} />
            </div>
            {!['COMPLETE', 'EFFECTIVE', 'SUBMITTED'].includes(filing.status) && (
              <p className={cn(
                'mt-1 text-xs',
                isOverdue ? 'text-danger-600' : daysUntilDue <= 7 ? 'text-warning-600' : 'text-slate-500'
              )}>
                {isOverdue
                  ? `${Math.abs(daysUntilDue)} days overdue`
                  : `${daysUntilDue} days remaining`}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Checklist Progress</p>
                <p className="text-lg font-semibold text-slate-900">
                  {checklistProgress.complete}/{checklistProgress.total}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success-300" />
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-success-500"
                style={{ width: `${(checklistProgress.complete / checklistProgress.total) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">SEC Comments</p>
                <p className="text-lg font-semibold text-slate-900">
                  {openSecComments} Open
                </p>
              </div>
              <MessageSquare className={cn(
                'h-8 w-8',
                openSecComments > 0 ? 'text-warning-300' : 'text-success-300'
              )} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Documents</p>
                <p className="text-lg font-semibold text-slate-900">{filing.documents.length}</p>
              </div>
              <Paperclip className="h-8 w-8 text-primary-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content with Tabs */}
      <Card>
        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'documents', label: 'Documents', icon: Paperclip, count: filing.documents.length },
              { id: 'comments', label: 'Comments', icon: MessageSquare, count: filing.comments.length },
              { id: 'checklist', label: 'Checklist', icon: CheckCircle2, count: `${checklistProgress.complete}/${checklistProgress.total}` },
              { id: 'history', label: 'History', icon: History },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 border-b-2 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge variant="secondary" size="sm">{tab.count}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        <CardContent className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-sm text-slate-600">{filing.description}</p>
                </div>

                {/* Filing Definition Info */}
                {filingDefinition && (
                  <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                    <h3 className="text-sm font-semibold text-primary-900 mb-2">
                      {filingDefinition.name} ({filingDefinition.shortName})
                    </h3>
                    <p className="text-sm text-primary-700">{filingDefinition.description}</p>
                    {filingDefinition.checklist && filingDefinition.checklist.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-primary-700 mb-1">Required Items:</p>
                        <ul className="text-xs text-primary-600 list-disc list-inside space-y-0.5">
                          {filingDefinition.checklist.slice(0, 5).map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                          {filingDefinition.checklist.length > 5 && (
                            <li>...and {filingDefinition.checklist.length - 5} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Workflow Steps */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">Review Workflow</h3>
                  <div className="space-y-3">
                    {filing.workflowSteps.map((step, index) => (
                      <div key={step.id} className="flex items-start gap-3">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                          step.status === 'COMPLETE' ? 'bg-success-100 text-success-700' :
                          step.status === 'CURRENT' ? 'bg-primary-100 text-primary-700' :
                          'bg-slate-100 text-slate-400'
                        )}>
                          {step.status === 'COMPLETE' ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <p className={cn(
                            'text-sm font-medium',
                            step.status === 'COMPLETE' ? 'text-slate-900' :
                            step.status === 'CURRENT' ? 'text-primary-700' :
                            'text-slate-400'
                          )}>
                            {step.name}
                            {step.status === 'CURRENT' && (
                              <Badge variant="primary" size="sm" className="ml-2">Current</Badge>
                            )}
                          </p>
                          {step.completedAt && (
                            <p className="text-xs text-slate-500">
                              Completed {formatDate(step.completedAt)}
                              {step.completedBy && ` by ${step.completedBy}`}
                            </p>
                          )}
                          {step.notes && (
                            <p className="text-xs text-slate-500 mt-0.5">{step.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Key Dates */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Key Dates</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Created</dt>
                      <dd className="text-slate-900">{formatDate(filing.createdAt)}</dd>
                    </div>
                    {filing.filedDate && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Filed</dt>
                        <dd className="text-slate-900">{formatDate(filing.filedDate)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Response Due</dt>
                      <dd className={cn(
                        'font-medium',
                        isOverdue ? 'text-danger-600' : 'text-slate-900'
                      )}>
                        {formatDate(filing.dueDate)}
                      </dd>
                    </div>
                    {filing.effectiveDate && (
                      <div className="flex justify-between">
                        <dt className="text-slate-500">Effective</dt>
                        <dd className="text-slate-900">{formatDate(filing.effectiveDate)}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Last Updated</dt>
                      <dd className="text-slate-900">{formatDateTime(filing.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>

                {/* Assignee */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Responsible Party</h3>
                  {filing.assignee ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                        {filing.assignee.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{filing.assignee.name}</p>
                        <p className="text-xs text-slate-500">{filing.assignee.email}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Not assigned</p>
                  )}
                </div>

                {/* Reviewers */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">Reviewers</h3>
                  <div className="space-y-3">
                    {filing.reviewers.map((reviewer) => (
                      <div key={reviewer.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                            {reviewer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-slate-900">{reviewer.name}</p>
                            {reviewer.reviewedAt && (
                              <p className="text-xs text-slate-500">
                                {formatDate(reviewer.reviewedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={
                            reviewer.reviewStatus === 'APPROVED' ? 'success' :
                            reviewer.reviewStatus === 'CHANGES_REQUESTED' ? 'warning' :
                            'secondary'
                          }
                          size="sm"
                        >
                          {reviewer.reviewStatus === 'APPROVED' ? 'Approved' :
                           reviewer.reviewStatus === 'CHANGES_REQUESTED' ? 'Changes' :
                           'Pending'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {filing.documents.length} document{filing.documents.length !== 1 ? 's' : ''}
                </p>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell header>Name</TableCell>
                    <TableCell header>Size</TableCell>
                    <TableCell header>Version</TableCell>
                    <TableCell header>Uploaded By</TableCell>
                    <TableCell header>Date</TableCell>
                    <TableCell header></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filing.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{doc.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{formatFileSize(doc.size)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" size="sm">v{doc.version}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{doc.uploadedBy}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(doc.uploadedAt)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Add Comment */}
              <div className="rounded-lg border border-slate-200 p-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment or note..."
                  className="w-full resize-none rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={3}
                />
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                    <Send className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {filing.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      'rounded-lg border p-4',
                      comment.type === 'SEC_COMMENT' ? 'border-warning-200 bg-warning-50' :
                      'border-slate-200'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                          {comment.author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{comment.author}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(comment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            comment.type === 'SEC_COMMENT' ? 'warning' :
                            comment.type === 'REVIEW_FEEDBACK' ? 'primary' :
                            'secondary'
                          }
                          size="sm"
                        >
                          {comment.type === 'SEC_COMMENT' ? 'SEC Comment' :
                           comment.type === 'REVIEW_FEEDBACK' ? 'Review' : 'Note'}
                        </Badge>
                        {comment.status && (
                          <Badge
                            variant={
                              comment.status === 'RESOLVED' ? 'success' :
                              comment.status === 'ADDRESSED' ? 'primary' :
                              'secondary'
                            }
                            size="sm"
                          >
                            {comment.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-700">{comment.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && (
            <div className="space-y-6">
              {/* Group by category */}
              {Array.from(new Set(filing.checklist.map((c) => c.category))).map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">{category}</h3>
                  <div className="space-y-2">
                    {filing.checklist
                      .filter((c) => c.category === category)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'flex h-6 w-6 items-center justify-center rounded-full',
                              item.status === 'COMPLETE' ? 'bg-success-100 text-success-600' :
                              item.status === 'IN_PROGRESS' ? 'bg-primary-100 text-primary-600' :
                              'bg-slate-100 text-slate-400'
                            )}>
                              {item.status === 'COMPLETE' ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : item.status === 'IN_PROGRESS' ? (
                                <Clock className="h-4 w-4" />
                              ) : (
                                <div className="h-3 w-3 rounded-full border-2 border-current" />
                              )}
                            </div>
                            <div>
                              <p className={cn(
                                'text-sm',
                                item.status === 'COMPLETE' ? 'text-slate-500' : 'text-slate-900'
                              )}>
                                {item.name}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-slate-500">{item.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {item.assignee && (
                              <span className="text-xs text-slate-500">{item.assignee}</span>
                            )}
                            {item.dueDate && (
                              <span className="text-xs text-slate-500">
                                Due: {formatDate(item.dueDate)}
                              </span>
                            )}
                            <Badge
                              variant={
                                item.status === 'COMPLETE' ? 'success' :
                                item.status === 'IN_PROGRESS' ? 'primary' :
                                'secondary'
                              }
                              size="sm"
                            >
                              {item.status === 'COMPLETE' ? 'Complete' :
                               item.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Status Change History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Status Change History</h3>
                <div className="space-y-3">
                  {filing.statusHistory.length === 0 ? (
                    <p className="text-sm text-slate-500">No status changes recorded</p>
                  ) : (
                    filing.statusHistory.slice().reverse().map((event, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-4 rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          <RefreshCw className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FilingStatusBadge status={event.status} size="sm" />
                            <span className="text-xs text-slate-500">{formatDateTime(event.date)}</span>
                          </div>
                          {event.description && (
                            <p className="mt-1 text-sm text-slate-600">{event.description}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Amendments/Filings History */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4">Amendment History</h3>
                {filing.amendments.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-sm text-slate-500">No amendments filed yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filing.amendments.map((amendment) => (
                      <div
                        key={amendment.id}
                        className="flex items-start gap-4 rounded-lg border border-slate-200 p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-slate-900">{amendment.version}</p>
                            {amendment.edgarUrl && (
                              <a
                                href={amendment.edgarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
                              >
                                View on EDGAR
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-slate-600">{amendment.description}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Filed: {formatDate(amendment.filedDate)} | Accession: {amendment.accessionNumber}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Status Modal */}
      {showUpdateStatusModal && selectedNewStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Update Filing Status</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to change the status from{' '}
              <FilingStatusBadge status={filing.status} size="sm" /> to{' '}
              <FilingStatusBadge status={selectedNewStatus} size="sm" />?
            </p>

            <div className="mt-4">
              <label htmlFor="status-notes" className="block text-sm font-medium text-slate-700">
                Notes (optional)
              </label>
              <textarea
                id="status-notes"
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={3}
                placeholder="Add any notes about this status change..."
              />
            </div>

            {/* Additional fields for specific status transitions */}
            {selectedNewStatus === 'SUBMITTED' && (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="filed-date" className="block text-sm font-medium text-slate-700">
                    Filed Date
                  </label>
                  <input
                    id="filed-date"
                    type="date"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <label htmlFor="accession-number" className="block text-sm font-medium text-slate-700">
                    Accession Number
                  </label>
                  <input
                    id="accession-number"
                    type="text"
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="0001234567-26-000001"
                  />
                </div>
              </div>
            )}

            {selectedNewStatus === 'EFFECTIVE' && (
              <div className="mt-4">
                <label htmlFor="effective-date" className="block text-sm font-medium text-slate-700">
                  Effective Date
                </label>
                <input
                  id="effective-date"
                  type="date"
                  className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowUpdateStatusModal(false);
                  setSelectedNewStatus(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Call API to update status
                  console.log('Updating status to:', selectedNewStatus);
                  setShowUpdateStatusModal(false);
                  setSelectedNewStatus(null);
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
