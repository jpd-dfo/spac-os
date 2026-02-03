'use client';

import { useState } from 'react';

import { format, differenceInDays, startOfDay } from 'date-fns';
import {
  X,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  Users,
  Paperclip,
  MessageSquare,
  ExternalLink,
  Edit,
  ChevronRight,
  Download,
  History,
  Send,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FILING_DEFINITIONS } from '@/lib/compliance/complianceRules';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface FilingDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  version: number;
}

export interface FilingComment {
  id: string;
  type: 'SEC_COMMENT' | 'INTERNAL_NOTE' | 'REVIEW_FEEDBACK';
  author: string;
  content: string;
  createdAt: Date;
  status?: 'OPEN' | 'ADDRESSED' | 'RESOLVED';
}

export interface FilingAmendment {
  id: string;
  version: string;
  filedDate: Date;
  accessionNumber?: string;
  description: string;
  edgarUrl?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  status: 'COMPLETE' | 'CURRENT' | 'PENDING';
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
}

export interface FilingDetail {
  id: string;
  type: FilingType;
  title: string;
  description?: string;
  spacId: string;
  spacName: string;
  ticker: string;
  status: FilingStatus;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate: Date;
  filedDate?: Date;
  effectiveDate?: Date;
  accessionNumber?: string;
  edgarUrl?: string;
  secFileNumber?: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  reviewers?: {
    id: string;
    name: string;
    email: string;
    reviewStatus: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
    reviewedAt?: Date;
  }[];
  documents: FilingDocument[];
  comments: FilingComment[];
  amendments: FilingAmendment[];
  workflowSteps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
}

interface FilingDetailModalProps {
  filing: FilingDetail | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (filing: FilingDetail) => void;
  onStatusChange?: (filing: FilingDetail, newStatus: FilingStatus) => void;
  onAddComment?: (filing: FilingDetail, comment: string) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusConfig(status: FilingStatus): { label: string; color: string; bgColor: string } {
  const configs: Record<FilingStatus, { label: string; color: string; bgColor: string }> = {
    DRAFT: { label: 'Draft', color: 'text-slate-700', bgColor: 'bg-slate-100' },
    INTERNAL_REVIEW: { label: 'Internal Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    EXTERNAL_REVIEW: { label: 'External Review', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    SUBMITTED: { label: 'Submitted', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
    SEC_COMMENT: { label: 'SEC Comment', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    RESPONSE_FILED: { label: 'Response Filed', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    EFFECTIVE: { label: 'Effective', color: 'text-green-700', bgColor: 'bg-green-100' },
    COMPLETE: { label: 'Filed', color: 'text-green-700', bgColor: 'bg-green-100' },
  };
  return configs[status];
}

function getPriorityConfig(priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'): { label: string; color: string; bgColor: string } {
  const configs = {
    CRITICAL: { label: 'Critical', color: 'text-danger-700', bgColor: 'bg-danger-100' },
    HIGH: { label: 'High', color: 'text-warning-700', bgColor: 'bg-warning-100' },
    MEDIUM: { label: 'Medium', color: 'text-primary-700', bgColor: 'bg-primary-100' },
    LOW: { label: 'Low', color: 'text-slate-700', bgColor: 'bg-slate-100' },
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

// ============================================================================
// COMPONENT
// ============================================================================

export function FilingDetailModal({
  filing,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  onAddComment,
}: FilingDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'comments' | 'history'>('overview');
  const [newComment, setNewComment] = useState('');

  if (!isOpen || !filing) {return null;}

  const statusConfig = getStatusConfig(filing.status);
  const priorityConfig = getPriorityConfig(filing.priority);
  const filingDefinition = FILING_DEFINITIONS[filing.type];

  const daysUntilDue = differenceInDays(startOfDay(filing.dueDate), startOfDay(new Date()));
  const isOverdue = daysUntilDue < 0 && !['COMPLETE', 'EFFECTIVE', 'SUBMITTED'].includes(filing.status);

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(filing, newComment);
      setNewComment('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary-50 p-3">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {FILING_TYPE_LABELS[filing.type]}
                </h2>
                <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                <Badge className={cn(priorityConfig.bgColor, priorityConfig.color)}>
                  {priorityConfig.label}
                </Badge>
                {isOverdue && <Badge variant="danger">Overdue</Badge>}
              </div>
              <p className="mt-1 text-sm text-slate-600">{filing.title}</p>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                <span>{filing.spacName} ({filing.ticker})</span>
                {filing.accessionNumber && (
                  <span className="flex items-center gap-1">
                    <span>Accession: {filing.accessionNumber}</span>
                    {filing.edgarUrl && (
                      <a
                        href={filing.edgarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={() => onEdit(filing)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: FileText },
              { id: 'documents', label: 'Documents', icon: Paperclip, count: filing.documents.length },
              { id: 'comments', label: 'Comments', icon: MessageSquare, count: filing.comments.length },
              { id: 'history', label: 'History', icon: History, count: filing.amendments.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge variant="secondary" size="sm">{tab.count}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Key Dates */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="mb-4 text-sm font-semibold text-slate-900">Key Dates</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-warning-50 p-2">
                        <Calendar className="h-4 w-4 text-warning-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Due Date</p>
                        <p className={cn(
                          'font-medium',
                          isOverdue ? 'text-danger-600' : 'text-slate-900'
                        )}>
                          {formatDate(filing.dueDate)}
                        </p>
                        {!['COMPLETE', 'EFFECTIVE', 'SUBMITTED'].includes(filing.status) && (
                          <p className={cn(
                            'text-xs',
                            isOverdue ? 'text-danger-600' : daysUntilDue <= 7 ? 'text-warning-600' : 'text-slate-500'
                          )}>
                            {isOverdue
                              ? `${Math.abs(daysUntilDue)} days overdue`
                              : `${daysUntilDue} days remaining`}
                          </p>
                        )}
                      </div>
                    </div>
                    {filing.filedDate && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-success-50 p-2">
                          <CheckCircle2 className="h-4 w-4 text-success-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Filed Date</p>
                          <p className="font-medium text-slate-900">{formatDate(filing.filedDate)}</p>
                        </div>
                      </div>
                    )}
                    {filing.effectiveDate && (
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-primary-50 p-2">
                          <CheckCircle2 className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Effective Date</p>
                          <p className="font-medium text-slate-900">{formatDate(filing.effectiveDate)}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-slate-100 p-2">
                        <Clock className="h-4 w-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Last Updated</p>
                        <p className="font-medium text-slate-900">{formatDateTime(filing.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filing Description */}
                {filing.description && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="mb-2 text-sm font-semibold text-slate-900">Description</h3>
                    <p className="text-sm text-slate-600">{filing.description}</p>
                  </div>
                )}

                {/* Filing Checklist from Definition */}
                {filingDefinition?.checklist && filingDefinition.checklist.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Filing Checklist</h3>
                    <div className="space-y-2">
                      {filingDefinition.checklist.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className="h-4 w-4 rounded border border-slate-300" />
                          <span className="text-slate-600">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Workflow */}
                {filing.workflowSteps.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="mb-4 text-sm font-semibold text-slate-900">Review Workflow</h3>
                    <div className="space-y-3">
                      {filing.workflowSteps.map((step, index) => (
                        <div key={step.id} className="flex items-start gap-3">
                          <div className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium',
                            step.status === 'COMPLETE' ? 'bg-success-100 text-success-700' :
                            step.status === 'CURRENT' ? 'bg-primary-100 text-primary-700' :
                            'bg-slate-100 text-slate-400'
                          )}>
                            {step.status === 'COMPLETE' ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : (
                              index + 1
                            )}
                          </div>
                          <div className="flex-1">
                            <p className={cn(
                              'text-sm font-medium',
                              step.status === 'COMPLETE' ? 'text-slate-900' :
                              step.status === 'CURRENT' ? 'text-primary-700' :
                              'text-slate-400'
                            )}>
                              {step.name}
                            </p>
                            {step.completedAt && (
                              <p className="text-xs text-slate-500">
                                Completed {formatDate(step.completedAt)} by {step.completedBy}
                              </p>
                            )}
                            {step.notes && (
                              <p className="mt-1 text-xs text-slate-500">{step.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                {/* Assignee */}
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-slate-900">Responsible Party</h3>
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
                {filing.reviewers && filing.reviewers.length > 0 && (
                  <div className="rounded-lg border border-slate-200 p-4">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900">Reviewers</h3>
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
                )}

                {/* SEC Comments Count */}
                {filing.status === 'SEC_COMMENT' && (
                  <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-warning-600" />
                      <h3 className="text-sm font-semibold text-warning-700">SEC Comment Letter</h3>
                    </div>
                    <p className="mt-2 text-sm text-warning-700">
                      {filing.comments.filter(c => c.type === 'SEC_COMMENT').length} comments pending response
                    </p>
                    <Button variant="secondary" size="sm" className="mt-3 w-full">
                      View Comments
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {filing.documents.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
                  <Paperclip className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No documents attached</p>
                  <Button variant="secondary" size="sm" className="mt-4">
                    Upload Document
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filing.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-slate-100 p-2">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(doc.size)} &middot; v{doc.version} &middot; {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon-sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
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
              {filing.comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No comments yet</p>
                </div>
              ) : (
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
                            {comment.type === 'SEC_COMMENT' ? 'SEC' :
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
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {filing.amendments.length === 0 ? (
                <div className="text-center py-8">
                  <History className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No amendments filed</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filing.amendments.map((amendment, index) => (
                    <div
                      key={amendment.id}
                      className="flex items-start gap-4 rounded-lg border border-slate-200 p-4"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-700">
                        {amendment.version}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-900">{amendment.description}</p>
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
                        <p className="mt-1 text-xs text-slate-500">
                          Filed: {formatDate(amendment.filedDate)}
                          {amendment.accessionNumber && ` | ${amendment.accessionNumber}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FilingDetailModal;
