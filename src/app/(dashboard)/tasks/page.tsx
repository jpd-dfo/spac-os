'use client';

import { useState, useMemo } from 'react';

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
  RefreshCw,
  Loader2,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import { trpc } from '@/lib/trpc';
import { formatDate, cn } from '@/lib/utils';

// Types - must match Prisma TaskStatus enum
type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
type _TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

const statusFilters: Array<'all' | TaskStatus> = ['all', 'NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'];

function getStatusIcon(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle2 className="h-5 w-5 text-success-500" />;
    case 'IN_PROGRESS':
      return <Clock className="h-5 w-5 text-primary-500" />;
    case 'BLOCKED':
      return <AlertCircle className="h-5 w-5 text-danger-500" />;
    case 'CANCELLED':
      return <Circle className="h-5 w-5 text-slate-300 line-through" />;
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
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');

  // tRPC queries
  const tasksQuery = trpc.task.list.useQuery(
    {
      page: 1,
      pageSize: 50,
      status: statusFilter !== 'all' ? [statusFilter] : undefined,
      search: searchQuery || undefined,
      sortBy: 'dueDate',
      sortOrder: 'asc',
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  // Mutations
  const updateStatusMutation = trpc.task.updateStatus.useMutation({
    onSuccess: () => {
      tasksQuery.refetch();
    },
  });

  // Derived data
  const filteredTasks = useMemo(() => {
    if (!tasksQuery.data?.items) {
      return [];
    }
    return tasksQuery.data.items;
  }, [tasksQuery.data]);

  const groupedByStatus = useMemo(() => {
    const allTasks = tasksQuery.data?.items || [];
    return {
      NOT_STARTED: allTasks.filter((t) => t.status === 'NOT_STARTED'),
      IN_PROGRESS: allTasks.filter((t) => t.status === 'IN_PROGRESS'),
      BLOCKED: allTasks.filter((t) => t.status === 'BLOCKED'),
      COMPLETED: allTasks.filter((t) => t.status === 'COMPLETED'),
    };
  }, [tasksQuery.data]);

  // Handlers
  const handleStatusToggle = async (taskId: string, currentStatus: string) => {
    // Cycle through statuses: NOT_STARTED -> IN_PROGRESS -> COMPLETED
    let newStatus: TaskStatus;
    switch (currentStatus) {
      case 'NOT_STARTED':
        newStatus = 'IN_PROGRESS';
        break;
      case 'IN_PROGRESS':
        newStatus = 'COMPLETED';
        break;
      case 'COMPLETED':
        newStatus = 'NOT_STARTED';
        break;
      default:
        newStatus = 'IN_PROGRESS';
    }

    updateStatusMutation.mutate({
      id: taskId,
      status: newStatus,
    });
  };

  const handleRetry = () => {
    tasksQuery.refetch();
  };

  // Loading state
  if (tasksQuery.isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary-500" />
          <p className="mt-2 text-sm text-slate-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (tasksQuery.isError) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-danger-500" />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Failed to load tasks</h3>
            <p className="mt-2 text-sm text-slate-500">
              {tasksQuery.error?.message || 'An error occurred while loading tasks.'}
            </p>
            <Button variant="primary" size="md" className="mt-4" onClick={handleRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title">Tasks</h1>
          <p className="page-description">
            Manage your workflow and track progress
            {tasksQuery.data?.total ? ` · ${tasksQuery.data.total} total tasks` : ''}
          </p>
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
              {status === 'all' ? 'All' : TASK_STATUS_LABELS[status] || status}
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
                <button
                  className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
                  onClick={() => handleStatusToggle(task.id, task.status)}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  ) : (
                    getStatusIcon(task.status)
                  )}
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
                      {task.description && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{task.description}</p>
                      )}
                    </div>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    {task.assignee && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="h-4 w-4" />
                        {task.assignee.name || 'Unassigned'}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="h-4 w-4" />
                        {formatDate(task.dueDate)}
                      </div>
                    )}
                    {task.spac && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                        {task.spac.name}
                      </span>
                    )}
                    {task.target && (
                      <span className="rounded bg-teal-50 px-2 py-0.5 text-xs text-teal-700">
                        {task.target.name}
                      </span>
                    )}
                    {task.category && (
                      <span className="rounded bg-primary-50 px-2 py-0.5 text-xs text-primary-700">
                        {task.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle2 className="h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">
                {searchQuery || statusFilter !== 'all'
                  ? 'No tasks match your filters'
                  : 'No tasks yet. Create your first task to get started.'}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
