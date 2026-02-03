'use client';

import { useState } from 'react';

import {
  History,
  Search,
  Download,
  Filter,
  Calendar,
  User,
  FileText,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Upload,
  Share2,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { cn, formatDate, formatDateTime } from '@/lib/utils';

// Types
type ActionType =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'DOWNLOAD'
  | 'SHARE'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'COMMENT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'UPLOAD'
  | 'EXPORT';

type EntityType =
  | 'Document'
  | 'Filing'
  | 'SPAC'
  | 'Target'
  | 'Task'
  | 'User'
  | 'Policy'
  | 'Disclosure'
  | 'Meeting'
  | 'Transaction'
  | 'System';

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  description: string;
  details?: Record<string, unknown>;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

// Mock audit log data
const mockAuditLogs: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    action: 'VIEW',
    entityType: 'Document',
    entityId: 'doc-123',
    entityName: 'S-4 Registration Statement Draft',
    userId: 'user-1',
    userName: 'John Smith',
    userEmail: 'john.smith@spacos.com',
    userRole: 'CEO',
    description: 'Viewed document S-4 Registration Statement Draft',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-abc123',
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    action: 'UPDATE',
    entityType: 'Filing',
    entityId: 'filing-456',
    entityName: 'Form 10-Q Q1 2025',
    userId: 'user-2',
    userName: 'Robert Kim',
    userEmail: 'robert.kim@spacos.com',
    userRole: 'CFO',
    description: 'Updated filing status from Draft to Internal Review',
    oldValues: { status: 'DRAFT' },
    newValues: { status: 'INTERNAL_REVIEW' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    sessionId: 'sess-def456',
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    action: 'DOWNLOAD',
    entityType: 'Document',
    entityId: 'doc-789',
    entityName: 'Board Meeting Minutes Q4 2024',
    userId: 'user-3',
    userName: 'Sarah Chen',
    userEmail: 'sarah.chen@spacos.com',
    userRole: 'Director',
    description: 'Downloaded document Board Meeting Minutes Q4 2024',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-ghi789',
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    action: 'APPROVE',
    entityType: 'Disclosure',
    entityId: 'disc-321',
    entityName: 'Conflict of Interest - Alpha Partners Advisory',
    userId: 'user-3',
    userName: 'Sarah Chen',
    userEmail: 'sarah.chen@spacos.com',
    userRole: 'Director',
    description: 'Approved conflict of interest disclosure for Alpha Partners advisory engagement',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-ghi789',
  },
  {
    id: '5',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
    action: 'CREATE',
    entityType: 'Meeting',
    entityId: 'meet-555',
    entityName: 'Q1 2025 Board Meeting',
    userId: 'user-4',
    userName: 'Corporate Secretary',
    userEmail: 'secretary@spacos.com',
    userRole: 'Admin',
    description: 'Created new board meeting scheduled for February 15, 2025',
    newValues: { date: '2025-02-15', type: 'Board', location: 'Conference Room A' },
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-jkl012',
  },
  {
    id: '6',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    action: 'SUBMIT',
    entityType: 'Filing',
    entityId: 'filing-222',
    entityName: 'Form 8-K Material Event',
    userId: 'user-2',
    userName: 'Robert Kim',
    userEmail: 'robert.kim@spacos.com',
    userRole: 'CFO',
    description: 'Submitted Form 8-K to SEC via EDGAR',
    details: { accessionNumber: '0001234567-25-000456', filedDate: new Date().toISOString() },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    sessionId: 'sess-mno345',
  },
  {
    id: '7',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    action: 'SHARE',
    entityType: 'Document',
    entityId: 'doc-888',
    entityName: 'Due Diligence Report - TechTarget Inc',
    userId: 'user-1',
    userName: 'John Smith',
    userEmail: 'john.smith@spacos.com',
    userRole: 'CEO',
    description: 'Shared document with external legal counsel at Latham & Watkins',
    details: { sharedWith: 'external-counsel@lw.com', accessLevel: 'VIEW_ONLY' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-pqr678',
  },
  {
    id: '8',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    action: 'LOGIN',
    entityType: 'System',
    entityId: 'sys',
    entityName: 'System',
    userId: 'user-5',
    userName: 'Michael Torres',
    userEmail: 'michael.torres@spacos.com',
    userRole: 'Director',
    description: 'User logged in successfully',
    ipAddress: '192.168.1.104',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
    sessionId: 'sess-stu901',
  },
  {
    id: '9',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    action: 'UPLOAD',
    entityType: 'Document',
    entityId: 'doc-999',
    entityName: 'Financial Model v3.xlsx',
    userId: 'user-2',
    userName: 'Robert Kim',
    userEmail: 'robert.kim@spacos.com',
    userRole: 'CFO',
    description: 'Uploaded new document Financial Model v3.xlsx to Deal Room',
    details: { fileSize: '2.4 MB', folder: 'Financial Models' },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    sessionId: 'sess-vwx234',
  },
  {
    id: '10',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    action: 'EXPORT',
    entityType: 'System',
    entityId: 'sys',
    entityName: 'Compliance Report',
    userId: 'user-6',
    userName: 'Compliance Officer',
    userEmail: 'compliance@spacos.com',
    userRole: 'Admin',
    description: 'Exported compliance audit report for external auditors',
    details: { format: 'PDF', dateRange: 'Q4 2024' },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-yza567',
  },
  {
    id: '11',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    action: 'DELETE',
    entityType: 'Document',
    entityId: 'doc-deleted',
    entityName: 'Draft Letter of Intent v1 (Obsolete)',
    userId: 'user-4',
    userName: 'Corporate Secretary',
    userEmail: 'secretary@spacos.com',
    userRole: 'Admin',
    description: 'Deleted obsolete document Draft Letter of Intent v1',
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-bcd890',
  },
  {
    id: '12',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000),
    action: 'REJECT',
    entityType: 'Transaction',
    entityId: 'txn-rejected',
    entityName: 'Pre-Clearance Request - Stock Sale',
    userId: 'user-6',
    userName: 'Compliance Officer',
    userEmail: 'compliance@spacos.com',
    userRole: 'Admin',
    description: 'Rejected pre-clearance request due to proximity to earnings blackout',
    details: { reason: 'Within 5 days of quarterly earnings blackout period' },
    ipAddress: '192.168.1.105',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    sessionId: 'sess-efg123',
  },
];

function getActionIcon(action: ActionType) {
  const icons: Record<ActionType, React.ReactNode> = {
    CREATE: <Plus className="h-4 w-4" />,
    UPDATE: <Edit2 className="h-4 w-4" />,
    DELETE: <Trash2 className="h-4 w-4" />,
    VIEW: <Eye className="h-4 w-4" />,
    DOWNLOAD: <Download className="h-4 w-4" />,
    SHARE: <Share2 className="h-4 w-4" />,
    APPROVE: <CheckCircle2 className="h-4 w-4" />,
    REJECT: <XCircle className="h-4 w-4" />,
    SUBMIT: <Upload className="h-4 w-4" />,
    COMMENT: <FileText className="h-4 w-4" />,
    LOGIN: <User className="h-4 w-4" />,
    LOGOUT: <User className="h-4 w-4" />,
    UPLOAD: <Upload className="h-4 w-4" />,
    EXPORT: <Download className="h-4 w-4" />,
  };
  return icons[action];
}

function getActionColor(action: ActionType) {
  const colors: Record<ActionType, string> = {
    CREATE: 'bg-success-100 text-success-600',
    UPDATE: 'bg-primary-100 text-primary-600',
    DELETE: 'bg-danger-100 text-danger-600',
    VIEW: 'bg-slate-100 text-slate-600',
    DOWNLOAD: 'bg-purple-100 text-purple-600',
    SHARE: 'bg-teal-100 text-teal-600',
    APPROVE: 'bg-success-100 text-success-600',
    REJECT: 'bg-danger-100 text-danger-600',
    SUBMIT: 'bg-primary-100 text-primary-600',
    COMMENT: 'bg-warning-100 text-warning-600',
    LOGIN: 'bg-slate-100 text-slate-600',
    LOGOUT: 'bg-slate-100 text-slate-600',
    UPLOAD: 'bg-success-100 text-success-600',
    EXPORT: 'bg-purple-100 text-purple-600',
  };
  return colors[action];
}

function getActionBadge(action: ActionType) {
  const variants: Record<ActionType, 'success' | 'primary' | 'danger' | 'secondary' | 'warning'> = {
    CREATE: 'success',
    UPDATE: 'primary',
    DELETE: 'danger',
    VIEW: 'secondary',
    DOWNLOAD: 'secondary',
    SHARE: 'primary',
    APPROVE: 'success',
    REJECT: 'danger',
    SUBMIT: 'primary',
    COMMENT: 'warning',
    LOGIN: 'secondary',
    LOGOUT: 'secondary',
    UPLOAD: 'success',
    EXPORT: 'secondary',
  };
  return <Badge variant={variants[action]}>{action}</Badge>;
}

export function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('7days');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

  // Get unique users for filter
  const uniqueUsers = Array.from(new Set(mockAuditLogs.map((log) => log.userName)));

  // Filter logs
  const filteredLogs = mockAuditLogs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter;
    const matchesUser = userFilter === 'all' || log.userName === userFilter;

    // Date filter
    const now = new Date();
    let matchesDate = true;
    if (dateFilter === '24hours') {
      matchesDate = log.timestamp >= new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateFilter === '7days') {
      matchesDate = log.timestamp >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateFilter === '30days') {
      matchesDate = log.timestamp >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return matchesSearch && matchesAction && matchesEntity && matchesUser && matchesDate;
  });

  // Group logs by date for timeline view
  const logsByDate = filteredLogs.reduce(
    (acc, log) => {
      const dateKey = formatDate(log.timestamp, 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(log);
      return acc;
    },
    {} as Record<string, AuditLogEntry[]>
  );

  const toggleExpand = (id: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Stats
  const stats = {
    total: filteredLogs.length,
    views: filteredLogs.filter((l) => l.action === 'VIEW').length,
    updates: filteredLogs.filter((l) => ['CREATE', 'UPDATE', 'DELETE'].includes(l.action)).length,
    downloads: filteredLogs.filter((l) => ['DOWNLOAD', 'EXPORT'].includes(l.action)).length,
    shares: filteredLogs.filter((l) => l.action === 'SHARE').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <History className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Eye className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats.views}</p>
                <p className="text-xs text-slate-500">Document Views</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Edit2 className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats.updates}</p>
                <p className="text-xs text-slate-500">Changes Made</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Download className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats.downloads}</p>
                <p className="text-xs text-slate-500">Downloads/Exports</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-teal-100 p-2">
                <Share2 className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stats.shares}</p>
                <p className="text-xs text-slate-500">Items Shared</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <CardTitle>System Audit Trail</CardTitle>
              <div className="flex items-center gap-3">
                <div className="flex rounded-lg border border-slate-200 p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setViewMode('timeline')}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    Timeline
                  </button>
                </div>
                <Button variant="secondary" size="md">
                  <Download className="mr-2 h-4 w-4" />
                  Export for Auditors
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                />
              </div>
              <Select
                options={[
                  { value: '24hours', label: 'Last 24 Hours' },
                  { value: '7days', label: 'Last 7 Days' },
                  { value: '30days', label: 'Last 30 Days' },
                  { value: 'all', label: 'All Time' },
                ]}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'VIEW', label: 'View' },
                  { value: 'CREATE', label: 'Create' },
                  { value: 'UPDATE', label: 'Update' },
                  { value: 'DELETE', label: 'Delete' },
                  { value: 'DOWNLOAD', label: 'Download' },
                  { value: 'SHARE', label: 'Share' },
                  { value: 'APPROVE', label: 'Approve' },
                  { value: 'REJECT', label: 'Reject' },
                ]}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={[
                  { value: 'all', label: 'All Entities' },
                  { value: 'Document', label: 'Documents' },
                  { value: 'Filing', label: 'Filings' },
                  { value: 'Meeting', label: 'Meetings' },
                  { value: 'Disclosure', label: 'Disclosures' },
                  { value: 'System', label: 'System' },
                ]}
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={[
                  { value: 'all', label: 'All Users' },
                  ...uniqueUsers.map((user) => ({ value: user, label: user })),
                ]}
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'list' ? (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Timestamp</TableCell>
                  <TableCell header>User</TableCell>
                  <TableCell header>Action</TableCell>
                  <TableCell header>Entity</TableCell>
                  <TableCell header>Description</TableCell>
                  <TableCell header>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{formatDate(log.timestamp, 'MMM d')}</p>
                        <p className="text-xs text-slate-500">{formatDate(log.timestamp, 'HH:mm:ss')}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                          {log.userName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{log.userName}</p>
                          <p className="text-xs text-slate-500">{log.userRole}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="secondary" size="sm">{log.entityType}</Badge>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-1">{log.entityName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-700 line-clamp-2">{log.description}</p>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => toggleExpand(log.id)}
                      >
                        {expandedEntries.has(log.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            // Timeline View
            <div className="space-y-8">
              {Object.entries(logsByDate).map(([dateKey, logs]) => (
                <div key={dateKey}>
                  <div className="mb-4 flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <h3 className="font-medium text-slate-900">
                      {formatDate(new Date(dateKey), 'EEEE, MMMM d, yyyy')}
                    </h3>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {logs.length} events
                    </span>
                  </div>
                  <div className="ml-2 border-l-2 border-slate-200 pl-6 space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="relative">
                        <div className={cn(
                          'absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full',
                          getActionColor(log.action)
                        )}>
                          {getActionIcon(log.action)}
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900">{log.userName}</span>
                                <span className="text-sm text-slate-500">{log.userRole}</span>
                                <span className="text-xs text-slate-400">
                                  {formatDate(log.timestamp, 'HH:mm')}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-slate-700">{log.description}</p>
                              <div className="mt-2 flex items-center gap-2">
                                {getActionBadge(log.action)}
                                <Badge variant="secondary" size="sm">{log.entityType}</Badge>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => toggleExpand(log.id)}
                            >
                              {expandedEntries.has(log.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>

                          {/* Expanded Details */}
                          {expandedEntries.has(log.id) && (
                            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs space-y-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <span className="text-slate-500">IP Address:</span>
                                  <span className="ml-2 text-slate-900">{log.ipAddress}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Session ID:</span>
                                  <span className="ml-2 font-mono text-slate-900">{log.sessionId}</span>
                                </div>
                              </div>
                              <div>
                                <span className="text-slate-500">User Agent:</span>
                                <span className="ml-2 text-slate-900">{log.userAgent}</span>
                              </div>
                              {log.oldValues && (
                                <div>
                                  <span className="text-slate-500">Old Values:</span>
                                  <pre className="mt-1 rounded bg-white p-2 text-slate-700">
                                    {JSON.stringify(log.oldValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.newValues && (
                                <div>
                                  <span className="text-slate-500">New Values:</span>
                                  <pre className="mt-1 rounded bg-white p-2 text-slate-700">
                                    {JSON.stringify(log.newValues, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.details && (
                                <div>
                                  <span className="text-slate-500">Additional Details:</span>
                                  <pre className="mt-1 rounded bg-white p-2 text-slate-700">
                                    {JSON.stringify(log.details, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center">
              <History className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">No activity found matching your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
