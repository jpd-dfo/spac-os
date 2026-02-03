'use client';

import { useState, useMemo } from 'react';

import { format, differenceInDays, isBefore, isAfter, parseISO } from 'date-fns';
import {
  Search,
  Filter,
  Download,
  Plus,
  ExternalLink,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Dropdown, DropdownItem } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { cn, formatDate } from '@/lib/utils';
import type { FilingType, FilingStatus } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface FilingTableItem {
  id: string;
  type: FilingType;
  title: string;
  description?: string;
  spacId: string;
  spacName: string;
  ticker: string;
  status: FilingStatus;
  dueDate: Date;
  filedDate?: Date;
  effectiveDate?: Date;
  accessionNumber?: string;
  edgarUrl?: string;
  assignee?: {
    id: string;
    name: string;
    avatar?: string;
  };
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  secCommentCount: number;
  lastUpdated: Date;
}

interface FilingTableProps {
  filings: FilingTableItem[];
  onFilingClick?: (filing: FilingTableItem) => void;
  onFilingEdit?: (filing: FilingTableItem) => void;
  onFilingDelete?: (filing: FilingTableItem) => void;
  onNewFiling?: () => void;
  onExport?: () => void;
  showActions?: boolean;
  className?: string;
}

type SortField = 'type' | 'spacName' | 'dueDate' | 'status' | 'priority' | 'lastUpdated';
type SortDirection = 'asc' | 'desc';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusBadge(status: FilingStatus) {
  const variants: Record<FilingStatus, 'secondary' | 'warning' | 'primary' | 'success' | 'danger'> = {
    DRAFT: 'secondary',
    INTERNAL_REVIEW: 'warning',
    EXTERNAL_REVIEW: 'primary',
    SUBMITTED: 'success',
    SEC_COMMENT: 'danger',
    RESPONSE_FILED: 'warning',
    EFFECTIVE: 'success',
    COMPLETE: 'success',
  };

  const labels: Record<FilingStatus, string> = {
    DRAFT: 'Draft',
    INTERNAL_REVIEW: 'Internal Review',
    EXTERNAL_REVIEW: 'External Review',
    SUBMITTED: 'Submitted',
    SEC_COMMENT: 'SEC Comment',
    RESPONSE_FILED: 'Response Filed',
    EFFECTIVE: 'Effective',
    COMPLETE: 'Complete',
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
}

function getPriorityBadge(priority: FilingTableItem['priority']) {
  const variants: Record<FilingTableItem['priority'], 'danger' | 'warning' | 'primary' | 'secondary'> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'primary',
    LOW: 'secondary',
  };

  return <Badge variant={variants[priority]}>{priority}</Badge>;
}

function getDaysUntilDeadline(dueDate: Date): { days: number; label: string; variant: 'danger' | 'warning' | 'success' | 'secondary' } {
  const today = new Date();
  const days = differenceInDays(dueDate, today);

  if (days < 0) {
    return { days, label: `${Math.abs(days)}d overdue`, variant: 'danger' };
  }
  if (days === 0) {
    return { days, label: 'Due today', variant: 'danger' };
  }
  if (days <= 3) {
    return { days, label: `${days}d left`, variant: 'danger' };
  }
  if (days <= 7) {
    return { days, label: `${days}d left`, variant: 'warning' };
  }
  if (days <= 14) {
    return { days, label: `${days}d left`, variant: 'warning' };
  }
  return { days, label: `${days}d left`, variant: 'secondary' };
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilingTable({
  filings,
  onFilingClick,
  onFilingEdit,
  onFilingDelete,
  onNewFiling,
  onExport,
  showActions = true,
  className,
}: FilingTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilingType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<FilingStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<FilingTableItem['priority'] | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filter and sort filings
  const filteredFilings = useMemo(() => {
    let result = [...filings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (filing) =>
          filing.title.toLowerCase().includes(query) ||
          filing.spacName.toLowerCase().includes(query) ||
          filing.ticker.toLowerCase().includes(query) ||
          FILING_TYPE_LABELS[filing.type]?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter((filing) => filing.type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter((filing) => filing.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      result = result.filter((filing) => filing.priority === filterPriority);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'type':
          comparison = FILING_TYPE_LABELS[a.type]?.localeCompare(FILING_TYPE_LABELS[b.type] || '') || 0;
          break;
        case 'spacName':
          comparison = a.spacName.localeCompare(b.spacName);
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'priority': {
          const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'lastUpdated':
          comparison = new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [filings, searchQuery, filterType, filterStatus, filterPriority, sortField, sortDirection]);

  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort indicator component
  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {return null;}
    return sortDirection === 'asc' ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="border-b border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            SEC Filings
            <Badge variant="secondary">{filteredFilings.length}</Badge>
          </CardTitle>

          {showActions && (
            <div className="flex items-center gap-2">
              {onExport && (
                <Button variant="secondary" size="sm" onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
              {onNewFiling && (
                <Button variant="primary" size="sm" onClick={onNewFiling}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Filing
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search filings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilingType | 'all')}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="FORM_10K">10-K</option>
            <option value="FORM_10Q">10-Q</option>
            <option value="FORM_8K">8-K</option>
            <option value="S1">S-1</option>
            <option value="S4">S-4</option>
            <option value="DEF14A">DEF14A</option>
            <option value="SUPER_8K">Super 8-K</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as FilingStatus | 'all')}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="INTERNAL_REVIEW">Internal Review</option>
            <option value="EXTERNAL_REVIEW">External Review</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="SEC_COMMENT">SEC Comment</option>
            <option value="COMPLETE">Complete</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as FilingTableItem['priority'] | 'all')}
            className="rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                header
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('type')}
              >
                Filing Type
                <SortIndicator field="type" />
              </TableCell>
              <TableCell
                header
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('spacName')}
              >
                SPAC
                <SortIndicator field="spacName" />
              </TableCell>
              <TableCell
                header
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('dueDate')}
              >
                Due Date
                <SortIndicator field="dueDate" />
              </TableCell>
              <TableCell
                header
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('status')}
              >
                Status
                <SortIndicator field="status" />
              </TableCell>
              <TableCell
                header
                className="cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('priority')}
              >
                Priority
                <SortIndicator field="priority" />
              </TableCell>
              <TableCell header>Assignee</TableCell>
              <TableCell header>Comments</TableCell>
              {showActions && <TableCell header className="w-12"></TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredFilings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showActions ? 8 : 7} className="py-8 text-center text-slate-500">
                  No filings found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              filteredFilings.map((filing) => {
                const deadline = getDaysUntilDeadline(filing.dueDate);

                return (
                  <TableRow
                    key={filing.id}
                    className="cursor-pointer"
                    onClick={() => onFilingClick?.(filing)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-medium text-slate-900">
                            {FILING_TYPE_LABELS[filing.type]}
                          </p>
                          <p className="text-xs text-slate-500">{filing.title}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">{filing.spacName}</p>
                        <p className="text-xs text-slate-500">{filing.ticker}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-slate-900">{formatDate(filing.dueDate)}</p>
                          <Badge variant={deadline.variant} size="sm">
                            {deadline.label}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(filing.status)}</TableCell>
                    <TableCell>{getPriorityBadge(filing.priority)}</TableCell>
                    <TableCell>
                      {filing.assignee ? (
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                            {filing.assignee.name.charAt(0)}
                          </div>
                          <span className="text-sm text-slate-600">{filing.assignee.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {filing.secCommentCount > 0 ? (
                        <Badge variant="warning">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          {filing.secCommentCount}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </TableCell>
                    {showActions && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Dropdown
                          trigger={
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                          align="right"
                        >
                          <DropdownItem onClick={() => onFilingClick?.(filing)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownItem>
                          {filing.edgarUrl && (
                            <DropdownItem
                              onClick={() => window.open(filing.edgarUrl, '_blank')}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View on SEC
                            </DropdownItem>
                          )}
                          <DropdownItem onClick={() => onFilingEdit?.(filing)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Filing
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => onFilingDelete?.(filing)}
                            className="text-danger-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownItem>
                        </Dropdown>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default FilingTable;
