'use client';

import { useState, useMemo } from 'react';

import { format, differenceInBusinessDays, addBusinessDays, isBefore, startOfDay } from 'date-fns';
import {
  MessageSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  Send,
  Download,
  Eye,
  Plus,
  User,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import type { FilingType } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export type CommentLetterStatus =
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'RESPONSE_DRAFTED'
  | 'RESPONSE_FILED'
  | 'RESOLVED'
  | 'ONGOING';

export interface CommentLetter {
  id: string;
  filingId: string;
  filingType: FilingType;
  spacId: string;
  spacName: string;
  ticker: string;
  status: CommentLetterStatus;
  letterNumber: number;
  receivedDate: Date;
  responseDeadline: Date;
  respondedDate?: Date;
  commentCount: number;
  resolvedCount: number;
  comments: CommentItem[];
  documents?: {
    id: string;
    name: string;
    type: 'STAFF_LETTER' | 'COMPANY_RESPONSE';
    url: string;
    uploadedAt: Date;
  }[];
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentItem {
  id: string;
  number: number;
  category: string;
  text: string;
  status: 'OPEN' | 'ADDRESSED' | 'RESOLVED' | 'DEFERRED';
  response?: string;
  assignee?: string;
  dueDate?: Date;
  notes?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

interface CommentLetterTrackerProps {
  commentLetters: CommentLetter[];
  onLetterClick?: (letter: CommentLetter) => void;
  onCommentUpdate?: (letterId: string, commentId: string, updates: Partial<CommentItem>) => void;
  onAddResponse?: (letterId: string, commentId: string, response: string) => void;
  onViewDocument?: (document: { id: string; name: string; url: string }) => void;
  onFileResponse?: (letterId: string) => void;
  className?: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusConfig(status: CommentLetterStatus) {
  const configs: Record<
    CommentLetterStatus,
    { label: string; color: string; bgColor: string; variant: 'danger' | 'warning' | 'success' | 'primary' | 'secondary' }
  > = {
    RECEIVED: {
      label: 'Received',
      color: 'text-danger-700',
      bgColor: 'bg-danger-100',
      variant: 'danger',
    },
    UNDER_REVIEW: {
      label: 'Under Review',
      color: 'text-warning-700',
      bgColor: 'bg-warning-100',
      variant: 'warning',
    },
    RESPONSE_DRAFTED: {
      label: 'Response Drafted',
      color: 'text-primary-700',
      bgColor: 'bg-primary-100',
      variant: 'primary',
    },
    RESPONSE_FILED: {
      label: 'Response Filed',
      color: 'text-purple-700',
      bgColor: 'bg-purple-100',
      variant: 'primary',
    },
    RESOLVED: {
      label: 'Resolved',
      color: 'text-success-700',
      bgColor: 'bg-success-100',
      variant: 'success',
    },
    ONGOING: {
      label: 'Ongoing',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
      variant: 'warning',
    },
  };

  return configs[status];
}

function getCommentStatusConfig(status: CommentItem['status']) {
  const configs: Record<
    CommentItem['status'],
    { label: string; color: string; bgColor: string; variant: 'danger' | 'warning' | 'success' | 'primary' | 'secondary' }
  > = {
    OPEN: { label: 'Open', color: 'text-danger-700', bgColor: 'bg-danger-100', variant: 'danger' },
    ADDRESSED: { label: 'Addressed', color: 'text-primary-700', bgColor: 'bg-primary-100', variant: 'primary' },
    RESOLVED: { label: 'Resolved', color: 'text-success-700', bgColor: 'bg-success-100', variant: 'success' },
    DEFERRED: { label: 'Deferred', color: 'text-slate-700', bgColor: 'bg-slate-100', variant: 'secondary' },
  };

  return configs[status];
}

function getCommentPriorityConfig(priority: CommentItem['priority']) {
  const configs: Record<CommentItem['priority'], { label: string; color: string }> = {
    HIGH: { label: 'High', color: 'text-danger-600' },
    MEDIUM: { label: 'Medium', color: 'text-warning-600' },
    LOW: { label: 'Low', color: 'text-slate-600' },
  };
  return configs[priority];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CommentLetterTracker({
  commentLetters,
  onLetterClick,
  onCommentUpdate,
  onAddResponse,
  onViewDocument,
  onFileResponse,
  className,
}: CommentLetterTrackerProps) {
  const [expandedLetterId, setExpandedLetterId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<CommentLetterStatus | 'all'>('all');
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState<Record<string, string>>({});

  // Filter letters
  const filteredLetters = useMemo(() => {
    if (filterStatus === 'all') {return commentLetters;}
    return commentLetters.filter((letter) => letter.status === filterStatus);
  }, [commentLetters, filterStatus]);

  // Calculate statistics
  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    return {
      total: commentLetters.length,
      pending: commentLetters.filter((l) =>
        ['RECEIVED', 'UNDER_REVIEW', 'ONGOING'].includes(l.status)
      ).length,
      overdue: commentLetters.filter(
        (l) => l.status !== 'RESOLVED' && isBefore(l.responseDeadline, today)
      ).length,
      resolved: commentLetters.filter((l) => l.status === 'RESOLVED').length,
      totalComments: commentLetters.reduce((sum, l) => sum + l.commentCount, 0),
      resolvedComments: commentLetters.reduce((sum, l) => sum + l.resolvedCount, 0),
      openComments: commentLetters.reduce(
        (sum, l) => sum + l.comments.filter((c) => c.status === 'OPEN').length,
        0
      ),
    };
  }, [commentLetters]);

  const toggleExpanded = (letterId: string) => {
    setExpandedLetterId(expandedLetterId === letterId ? null : letterId);
  };

  const handleResponseChange = (commentId: string, text: string) => {
    setResponseText((prev) => ({ ...prev, [commentId]: text }));
  };

  const handleSubmitResponse = (letterId: string, commentId: string) => {
    const response = responseText[commentId];
    if (response?.trim() && onAddResponse) {
      onAddResponse(letterId, commentId, response);
      setResponseText((prev) => {
        const updated = { ...prev };
        delete updated[commentId];
        return updated;
      });
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2">
                <MessageSquare className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Comment Letters</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-50 p-2">
                <Clock className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
                <p className="text-sm text-slate-500">Pending Response</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-danger-50 p-2">
                <AlertTriangle className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.overdue}</p>
                <p className="text-sm text-slate-500">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stats.openComments}</p>
                <p className="text-sm text-slate-500">Open Comments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-50 p-2">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {stats.resolvedComments}/{stats.totalComments}
                </p>
                <p className="text-sm text-slate-500">Comments Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary-600" />
              SEC Comment Letter Tracker
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CommentLetterStatus | 'all')}
                className="rounded-md border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="RECEIVED">Received</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="RESPONSE_DRAFTED">Response Drafted</option>
                <option value="RESPONSE_FILED">Response Filed</option>
                <option value="ONGOING">Ongoing</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredLetters.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">No comment letters found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredLetters.map((letter) => {
                const statusConfig = getStatusConfig(letter.status);
                const daysUntilDeadline = differenceInBusinessDays(
                  letter.responseDeadline,
                  new Date()
                );
                const isOverdue = daysUntilDeadline < 0 && letter.status !== 'RESOLVED';
                const isExpanded = expandedLetterId === letter.id;

                return (
                  <div key={letter.id} className="bg-white">
                    {/* Letter Header */}
                    <div
                      className="flex cursor-pointer items-center justify-between p-4 hover:bg-slate-50"
                      onClick={() => toggleExpanded(letter.id)}
                    >
                      <div className="flex items-center gap-4">
                        <button className="text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5" />
                          ) : (
                            <ChevronRight className="h-5 w-5" />
                          )}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900">
                              Comment Letter #{letter.letterNumber}
                            </span>
                            <Badge variant="secondary">
                              {FILING_TYPE_LABELS[letter.filingType]}
                            </Badge>
                            <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                            {isOverdue && <Badge variant="danger">Overdue</Badge>}
                          </div>
                          <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                            <span>{letter.spacName} ({letter.ticker})</span>
                            <span>Received: {formatDate(letter.receivedDate)}</span>
                            <span className="flex items-center gap-1">
                              <span className={cn(
                                letter.resolvedCount === letter.commentCount ? 'text-success-600' : 'text-slate-500'
                              )}>
                                {letter.resolvedCount}/{letter.commentCount} resolved
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">
                            Response Due: {formatDate(letter.responseDeadline)}
                          </p>
                          <p
                            className={cn(
                              'text-xs',
                              isOverdue ? 'text-danger-600 font-medium' :
                              daysUntilDeadline <= 3 ? 'text-warning-600' : 'text-slate-500'
                            )}
                          >
                            {isOverdue
                              ? `${Math.abs(daysUntilDeadline)} business days overdue`
                              : `${daysUntilDeadline} business days remaining`}
                          </p>
                        </div>
                        {letter.assignee && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                            {letter.assignee.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4">
                        {/* Documents */}
                        {letter.documents && letter.documents.length > 0 && (
                          <div className="mb-4">
                            <h4 className="mb-2 text-sm font-medium text-slate-700">Documents</h4>
                            <div className="flex flex-wrap gap-2">
                              {letter.documents.map((doc) => (
                                <button
                                  key={doc.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDocument?.(doc);
                                  }}
                                  className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
                                >
                                  <FileText className="h-4 w-4 text-slate-400" />
                                  <span className="text-slate-700">{doc.name}</span>
                                  {doc.type === 'STAFF_LETTER' ? (
                                    <Badge variant="warning" size="sm">
                                      SEC
                                    </Badge>
                                  ) : (
                                    <Badge variant="primary" size="sm">
                                      Response
                                    </Badge>
                                  )}
                                  <ExternalLink className="h-3 w-3 text-slate-400" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Comments List */}
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <h4 className="text-sm font-medium text-slate-700">
                              Comments ({letter.commentCount})
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-danger-500" />
                                Open: {letter.comments.filter(c => c.status === 'OPEN').length}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-primary-500" />
                                Addressed: {letter.comments.filter(c => c.status === 'ADDRESSED').length}
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-success-500" />
                                Resolved: {letter.comments.filter(c => c.status === 'RESOLVED').length}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            {letter.comments.map((comment) => {
                              const commentStatus = getCommentStatusConfig(comment.status);
                              const commentPriority = getCommentPriorityConfig(comment.priority);
                              const isSelected = selectedCommentId === comment.id;

                              return (
                                <div
                                  key={comment.id}
                                  className={cn(
                                    'rounded-lg border bg-white p-4',
                                    isSelected ? 'border-primary-300 shadow-sm' : 'border-slate-200'
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="mb-2 flex items-center gap-2">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                                          {comment.number}
                                        </span>
                                        <Badge variant={commentStatus.variant} size="sm">
                                          {commentStatus.label}
                                        </Badge>
                                        <Badge variant="secondary" size="sm">
                                          {comment.category}
                                        </Badge>
                                        <span className={cn('text-xs font-medium', commentPriority.color)}>
                                          {commentPriority.label} Priority
                                        </span>
                                      </div>
                                      <p className="text-sm text-slate-700">{comment.text}</p>

                                      {/* Existing Response */}
                                      {comment.response && (
                                        <div className="mt-3 rounded-md bg-primary-50 p-3">
                                          <p className="text-xs font-medium text-primary-700 mb-1">
                                            Company Response:
                                          </p>
                                          <p className="text-sm text-primary-900">{comment.response}</p>
                                        </div>
                                      )}

                                      {/* Response Input (for open/addressed comments) */}
                                      {['OPEN', 'ADDRESSED'].includes(comment.status) && !comment.response && (
                                        <div className="mt-3">
                                          <textarea
                                            value={responseText[comment.id] || ''}
                                            onChange={(e) => handleResponseChange(comment.id, e.target.value)}
                                            placeholder="Draft response to this comment..."
                                            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            rows={2}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          {responseText[comment.id] && (
                                            <div className="mt-2 flex justify-end">
                                              <Button
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleSubmitResponse(letter.id, comment.id);
                                                }}
                                              >
                                                Save Response
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Assignee and Notes */}
                                      {(comment.assignee || comment.notes) && (
                                        <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                          {comment.assignee && (
                                            <span className="flex items-center gap-1">
                                              <User className="h-3 w-3" />
                                              {comment.assignee}
                                            </span>
                                          )}
                                          {comment.dueDate && (
                                            <span className="flex items-center gap-1">
                                              <Calendar className="h-3 w-3" />
                                              Due: {formatDate(comment.dueDate)}
                                            </span>
                                          )}
                                        </div>
                                      )}
                                    </div>

                                    {/* Status Dropdown */}
                                    <div className="ml-4">
                                      <select
                                        value={comment.status}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          onCommentUpdate?.(letter.id, comment.id, {
                                            status: e.target.value as CommentItem['status'],
                                          });
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rounded border border-slate-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                                      >
                                        <option value="OPEN">Open</option>
                                        <option value="ADDRESSED">Addressed</option>
                                        <option value="RESOLVED">Resolved</option>
                                        <option value="DEFERRED">Deferred</option>
                                      </select>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onLetterClick?.(letter);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Details
                          </Button>
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm">
                              <Download className="mr-2 h-4 w-4" />
                              Export Response
                            </Button>
                            {letter.status !== 'RESOLVED' && letter.status !== 'RESPONSE_FILED' && (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onFileResponse?.(letter.id);
                                }}
                              >
                                <Send className="mr-2 h-4 w-4" />
                                File Response
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CommentLetterTracker;
