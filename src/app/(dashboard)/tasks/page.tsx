'use client';

import { useState } from 'react';

import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  User,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import { formatDate, formatRelativeTime, cn } from '@/lib/utils';

// Mock data
const mockTasks = [
  {
    id: '1',
    title: 'Complete financial due diligence review',
    description: 'Review Q3 financials and prepare summary report',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    assignee: 'John Doe',
    spac: 'Alpha Acquisition Corp',
    category: 'Due Diligence',
  },
  {
    id: '2',
    title: 'Draft management presentation deck',
    description: 'Prepare investor presentation for board meeting',
    status: 'NOT_STARTED',
    priority: 'MEDIUM',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    assignee: 'Jane Smith',
    spac: 'Beta Holdings SPAC',
    category: 'Investor Relations',
  },
  {
    id: '3',
    title: 'Review SEC comment letter',
    description: 'Analyze and draft response to SEC comments',
    status: 'IN_PROGRESS',
    priority: 'CRITICAL',
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    assignee: 'Mike Johnson',
    spac: 'Alpha Acquisition Corp',
    category: 'Compliance',
  },
  {
    id: '4',
    title: 'Conduct management interviews',
    description: 'Schedule and conduct interviews with target management',
    status: 'COMPLETED',
    priority: 'HIGH',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    assignee: 'Sarah Wilson',
    spac: 'Gamma Ventures',
    category: 'Due Diligence',
    completedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    title: 'Update valuation model',
    description: 'Incorporate latest projections into DCF model',
    status: 'BLOCKED',
    priority: 'HIGH',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    assignee: 'John Doe',
    spac: 'Beta Holdings SPAC',
    category: 'Valuation',
  },
];

const statusFilters = ['all', 'NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-success-500" />;
    case 'IN_PROGRESS':
      return <Clock className="h-5 w-5 text-primary-500" />;
    case 'BLOCKED':
      return <AlertCircle className="h-5 w-5 text-danger-500" />;
    default:
      return <Circle className="h-5 w-5 text-slate-300" />;
  }
}

function getPriorityBadge(priority: string) {
  const variants: Record<string, 'danger' | 'warning' | 'secondary'> = {
    CRITICAL: 'danger',
    HIGH: 'warning',
    MEDIUM: 'secondary',
    LOW: 'secondary',
  };
  return (
    <Badge variant={variants[priority] || 'secondary'} size="sm">
      {TASK_PRIORITY_LABELS[priority] || priority}
    </Badge>
  );
}

export default function TasksPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const filteredTasks = mockTasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const groupedByStatus = {
    NOT_STARTED: filteredTasks.filter((t) => t.status === 'NOT_STARTED'),
    IN_PROGRESS: filteredTasks.filter((t) => t.status === 'IN_PROGRESS'),
    BLOCKED: filteredTasks.filter((t) => t.status === 'BLOCKED'),
    COMPLETED: filteredTasks.filter((t) => t.status === 'COMPLETED'),
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Tasks</h1>
          <p className="page-description">Manage your workflow and track progress</p>
        </div>
        <Button variant="primary" size="md">
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>
        <div className="flex gap-2">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              {status === 'all' ? 'All' : TASK_STATUS_LABELS[status]}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="md">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Task Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Circle className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {groupedByStatus.NOT_STARTED.length}
                </p>
                <p className="text-sm text-slate-500">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <Clock className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {groupedByStatus.IN_PROGRESS.length}
                </p>
                <p className="text-sm text-slate-500">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-danger-100 p-2">
                <AlertCircle className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {groupedByStatus.BLOCKED.length}
                </p>
                <p className="text-sm text-slate-500">Blocked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-2">
                <CheckCircle2 className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {groupedByStatus.COMPLETED.length}
                </p>
                <p className="text-sm text-slate-500">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Task List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-200">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-4 p-4 hover:bg-slate-50"
              >
                <button className="mt-0.5 flex-shrink-0">
                  {getStatusIcon(task.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4
                        className={cn(
                          'font-medium',
                          task.status === 'COMPLETED'
                            ? 'text-slate-500 line-through'
                            : 'text-slate-900'
                        )}
                      >
                        {task.title}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="h-4 w-4" />
                      {task.assignee}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="h-4 w-4" />
                      {formatDate(task.dueDate)}
                    </div>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {task.spac}
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                      {task.category}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">No tasks found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
