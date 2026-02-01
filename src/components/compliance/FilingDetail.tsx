'use client';

import { useState } from 'react';
import {
  FileText,
  Calendar,
  Clock,
  User,
  Building2,
  ExternalLink,
  Download,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Edit,
  History,
  Paperclip,
  Send,
  X,
} from 'lucide-react';
import { format, differenceInDays, differenceInBusinessDays } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { FILING_DEFINITIONS, type ChecklistItem, type ChecklistItemStatus } from '@/lib/compliance/complianceRules';

// ============================================================================
// TYPES
// ============================================================================

export interface FilingDetailData {
  id: string;
  type: FilingType;
  title: string;
  description?: string;
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
  internalReviewDate?: Date;
  externalReviewDate?: Date;
  secCommentDate?: Date;
  responseDate?: Date;
  assignee?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  reviewers?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    approved: boolean;
    approvedAt?: Date;
  }>;
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  comments?: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: Date;
    type: 'INTERNAL' | 'SEC_COMMENT';
  }>;
  checklist?: Array<{
    id: string;
    name: string;
    status: ChecklistItemStatus;
    completedAt?: Date;
    completedBy?: string;
  }>;
  timeline?: Array<{
    id: string;
    action: string;
    description: string;
    user: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface FilingDetailProps {
  filing: FilingDetailData;
  onClose?: () => void;
  onEdit?: () => void;
  onStatusChange?: (status: FilingStatus) => void;
  onAddComment?: (comment: string) => void;
  onChecklistItemToggle?: (itemId: string, completed: boolean) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusConfig(status: FilingStatus) {
  const configs: Record<
    FilingStatus,
    { label: string; color: string; bgColor: string; icon: typeof FileText }
  > = {
    DRAFT: {
      label: 'Draft',
      color: 'text-slate-700',
      bgColor: 'bg-slate-100',
      icon: FileText,
    },
    INTERNAL_REVIEW: {
      label: 'Internal Review',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
      icon: Clock,
    },
    EXTERNAL_REVIEW: {
      label: 'External Review',
      color: 'text-blue-700',
      bgColor: 'bg-blue-100',
      icon: User,
    },
    SUBMITTED: {
      label: 'Submitted to SEC',
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100',
      icon: Send,
    },
    SEC_COMMENT: {
      label: 'SEC Comment Received',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      icon: AlertTriangle,
    },
    RESPONSE_FILED: {
      label: 'Response Filed',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      icon: MessageSquare,
    },
    EFFECTIVE: {
      label: 'Effective',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle2,
    },
    COMPLETE: {
      label: 'Complete',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      icon: CheckCircle2,
    },
  };

  return configs[status];
}

function getPriorityConfig(priority: FilingDetailData['priority']) {
  const configs: Record<
    FilingDetailData['priority'],
    { label: string; color: string; bgColor: string }
  > = {
    CRITICAL: { label: 'Critical', color: 'text-danger-700', bgColor: 'bg-danger-100' },
    HIGH: { label: 'High', color: 'text-warning-700', bgColor: 'bg-warning-100' },
    MEDIUM: { label: 'Medium', color: 'text-primary-700', bgColor: 'bg-primary-100' },
    LOW: { label: 'Low', color: 'text-slate-700', bgColor: 'bg-slate-100' },
  };

  return configs[priority];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilingDetail({
  filing,
  onClose,
  onEdit,
  onStatusChange,
  onAddComment,
  onChecklistItemToggle,
  className,
}: FilingDetailProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'comments' | 'timeline'>(
    'overview'
  );
  const [newComment, setNewComment] = useState('');

  const statusConfig = getStatusConfig(filing.status);
  const priorityConfig = getPriorityConfig(filing.priority);
  const filingDefinition = FILING_DEFINITIONS[filing.type];

  const daysUntilDue = differenceInDays(filing.dueDate, new Date());
  const businessDaysUntilDue = differenceInBusinessDays(filing.dueDate, new Date());

  const checklistProgress = filing.checklist
    ? {
        total: filing.checklist.length,
        completed: filing.checklist.filter((item) => item.status === 'COMPLETE').length,
      }
    : null;

  const handleAddComment = () => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={cn('rounded-lg p-3', statusConfig.bgColor)}>
              <FileText className={cn('h-6 w-6', statusConfig.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">
                  {FILING_TYPE_LABELS[filing.type]}
                </h2>
                <Badge variant="secondary">{filing.ticker}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">{filing.title}</p>
              <div className="mt-2 flex items-center gap-3">
                <Badge className={cn(priorityConfig.bgColor, priorityConfig.color)}>
                  {priorityConfig.label}
                </Badge>
                <Badge className={cn(statusConfig.bgColor, statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                {daysUntilDue < 0 ? (
                  <Badge variant="danger">{Math.abs(daysUntilDue)} days overdue</Badge>
                ) : daysUntilDue <= 7 ? (
                  <Badge variant="warning">{daysUntilDue} days left</Badge>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {filing.edgarUrl && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.open(filing.edgarUrl, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on SEC
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" size="sm" onClick={onEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon-sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'checklist', label: 'Checklist', count: checklistProgress?.total },
            { id: 'comments', label: 'Comments', count: filing.comments?.length },
            { id: 'timeline', label: 'Timeline' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Key Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">Due Date</p>
                        <p className="text-sm text-slate-600">{formatDate(filing.dueDate)}</p>
                        <p className="text-xs text-slate-500">
                          {daysUntilDue >= 0
                            ? `${businessDaysUntilDue} business days remaining`
                            : `${Math.abs(daysUntilDue)} days overdue`}
                        </p>
                      </div>
                    </div>
                    {filing.filedDate && (
                      <div className="flex items-start gap-3">
                        <Send className="mt-0.5 h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Filed Date</p>
                          <p className="text-sm text-slate-600">{formatDate(filing.filedDate)}</p>
                        </div>
                      </div>
                    )}
                    {filing.effectiveDate && (
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-success-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Effective Date</p>
                          <p className="text-sm text-slate-600">{formatDate(filing.effectiveDate)}</p>
                        </div>
                      </div>
                    )}
                    {filing.secCommentDate && (
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-warning-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">SEC Comment Received</p>
                          <p className="text-sm text-slate-600">
                            {formatDate(filing.secCommentDate)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Description */}
              {filing.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{filing.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Filing Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Filing Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-slate-600">{filingDefinition?.description}</p>
                  {filingDefinition?.checklist && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-900">Required Elements:</p>
                      <ul className="space-y-1">
                        {filingDefinition.checklist.map((item, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                            <ChevronRight className="mt-0.5 h-4 w-4 text-slate-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Documents */}
              {filing.documents && filing.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Documents</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {filing.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                        >
                          <div className="flex items-center gap-3">
                            <Paperclip className="h-4 w-4 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                              <p className="text-xs text-slate-500">
                                {doc.type} - {(doc.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* SPAC Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SPAC Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="mt-0.5 h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">{filing.spacName}</p>
                      <p className="text-xs text-slate-500">Ticker: {filing.ticker}</p>
                      {filing.cik && <p className="text-xs text-slate-500">CIK: {filing.cik}</p>}
                    </div>
                  </div>
                  {filing.accessionNumber && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">Accession Number</p>
                      <p className="text-sm text-slate-900">{filing.accessionNumber}</p>
                    </div>
                  )}
                  {filing.secFileNumber && (
                    <div>
                      <p className="text-xs font-medium text-slate-500">SEC File Number</p>
                      <p className="text-sm text-slate-900">{filing.secFileNumber}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignee */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Assigned To</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Reviewers */}
              {filing.reviewers && filing.reviewers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Reviewers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {filing.reviewers.map((reviewer) => (
                        <div key={reviewer.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                              {reviewer.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900">{reviewer.name}</p>
                              <p className="text-xs text-slate-500">{reviewer.role}</p>
                            </div>
                          </div>
                          {reviewer.approved ? (
                            <CheckCircle2 className="h-5 w-5 text-success-500" />
                          ) : (
                            <Clock className="h-5 w-5 text-slate-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Actions */}
              {onStatusChange && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Update Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <select
                      value={filing.status}
                      onChange={(e) => onStatusChange(e.target.value as FilingStatus)}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="INTERNAL_REVIEW">Internal Review</option>
                      <option value="EXTERNAL_REVIEW">External Review</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="SEC_COMMENT">SEC Comment</option>
                      <option value="RESPONSE_FILED">Response Filed</option>
                      <option value="EFFECTIVE">Effective</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Compliance Checklist</CardTitle>
                {checklistProgress && (
                  <Badge variant="secondary">
                    {checklistProgress.completed} / {checklistProgress.total} completed
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filing.checklist && filing.checklist.length > 0 ? (
                <div className="space-y-2">
                  {filing.checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            onChecklistItemToggle?.(item.id, item.status !== 'COMPLETE')
                          }
                          className={cn(
                            'flex h-5 w-5 items-center justify-center rounded border transition-colors',
                            item.status === 'COMPLETE'
                              ? 'border-success-500 bg-success-500 text-white'
                              : 'border-slate-300 hover:border-primary-500'
                          )}
                        >
                          {item.status === 'COMPLETE' && <CheckCircle2 className="h-3 w-3" />}
                        </button>
                        <span
                          className={cn(
                            'text-sm',
                            item.status === 'COMPLETE'
                              ? 'text-slate-500 line-through'
                              : 'text-slate-900'
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.completedAt && (
                        <span className="text-xs text-slate-500">
                          Completed {formatDate(item.completedAt)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">No checklist items</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'comments' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comments</CardTitle>
            </CardHeader>
            <CardContent>
              {filing.comments && filing.comments.length > 0 ? (
                <div className="space-y-4">
                  {filing.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={cn(
                        'rounded-lg border p-4',
                        comment.type === 'SEC_COMMENT'
                          ? 'border-warning-200 bg-warning-50'
                          : 'border-slate-200'
                      )}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">
                            {comment.author}
                          </span>
                          {comment.type === 'SEC_COMMENT' && (
                            <Badge variant="warning" size="sm">
                              SEC
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">No comments yet</p>
              )}

              {/* Add Comment */}
              {onAddComment && (
                <div className="mt-4 border-t border-slate-200 pt-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="mb-2"
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Add Comment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'timeline' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {filing.timeline && filing.timeline.length > 0 ? (
                <div className="relative space-y-4 pl-6">
                  <div className="absolute bottom-0 left-2 top-0 w-px bg-slate-200" />
                  {filing.timeline.map((event, index) => (
                    <div key={event.id} className="relative">
                      <div className="absolute -left-4 top-1 h-2 w-2 rounded-full bg-primary-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{event.action}</p>
                        <p className="text-sm text-slate-600">{event.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {event.user} - {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-slate-500">No activity yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default FilingDetail;
