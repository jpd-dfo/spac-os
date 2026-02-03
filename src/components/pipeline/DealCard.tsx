'use client';

import { useMemo } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  MoreHorizontal,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  Clock,
  MessageSquare,
  User,
  AlertCircle,
  CheckCircle2,
  GripVertical,
} from 'lucide-react';

import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { TARGET_STATUS_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import { cn, formatLargeNumber, formatDate, formatRelativeTime } from '@/lib/utils';

import type { Deal, QuickActionType } from './types';

// ============================================================================
// Types
// ============================================================================

interface DealCardProps {
  deal: Deal;
  isDragging?: boolean;
  isOverlay?: boolean;
  onClick?: (deal: Deal) => void;
  onQuickAction?: (deal: Deal, action: QuickActionType) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function ScoreIndicator({ score, label }: { score: number | undefined; label: string }) {
  if (score === undefined) {return null;}

  const getColor = (value: number) => {
    if (value >= 80) {return 'bg-success-500';}
    if (value >= 60) {return 'bg-primary-500';}
    if (value >= 40) {return 'bg-warning-500';}
    return 'bg-danger-500';
  };

  return (
    <Tooltip content={`${label}: ${score}/100`}>
      <div className="flex items-center gap-1">
        <div className={cn('h-2 w-2 rounded-full', getColor(score))} />
        <span className="text-xs text-slate-500">{score}</span>
      </div>
    </Tooltip>
  );
}

function DueDiligenceProgressBar({ progress }: { progress: Deal['dueDiligence'] }) {
  if (!progress) {return null;}

  const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;

  return (
    <Tooltip content={`Due Diligence: ${progress.completed}/${progress.total} items complete`}>
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              percentage === 100
                ? 'bg-success-500'
                : percentage > 50
                  ? 'bg-primary-500'
                  : 'bg-warning-500'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-slate-500">{percentage}%</span>
      </div>
    </Tooltip>
  );
}

function PriorityBadge({ priority }: { priority: Deal['priority'] }) {
  const variants: Record<string, 'secondary' | 'primary' | 'warning' | 'danger'> = {
    LOW: 'secondary',
    MEDIUM: 'primary',
    HIGH: 'warning',
    CRITICAL: 'danger',
  };

  return (
    <Badge variant={variants[priority]} size="sm">
      {TASK_PRIORITY_LABELS[priority]}
    </Badge>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DealCard({
  deal,
  isDragging = false,
  isOverlay = false,
  onClick,
  onQuickAction,
}: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: deal.id,
    data: {
      type: 'deal',
      deal,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCurrentlyDragging = isDragging || isSortableDragging;

  const probabilityColor = useMemo(() => {
    if (deal.probability === undefined) {return 'bg-slate-300';}
    if (deal.probability >= 70) {return 'bg-success-500';}
    if (deal.probability >= 40) {return 'bg-warning-500';}
    return 'bg-slate-300';
  }, [deal.probability]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger click when clicking on dropdown or drag handle
    if ((e.target as HTMLElement).closest('[data-no-click]')) {
      return;
    }
    onClick?.(deal);
  };

  const handleQuickAction = (action: QuickActionType) => {
    onQuickAction?.(deal, action);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-lg border bg-white shadow-sm transition-all',
        isCurrentlyDragging
          ? 'border-primary-300 shadow-lg ring-2 ring-primary-200'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
        isOverlay && 'rotate-3 scale-105',
        onClick && 'cursor-pointer'
      )}
      onClick={handleCardClick}
    >
      {/* Card Header */}
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* Drag Handle */}
              <button
                data-no-click
                {...attributes}
                {...listeners}
                className={cn(
                  'flex-shrink-0 cursor-grab rounded p-0.5 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600',
                  'group-hover:opacity-100',
                  isCurrentlyDragging && 'cursor-grabbing opacity-100'
                )}
              >
                <GripVertical className="h-4 w-4" />
              </button>
              <h4 className="truncate font-medium text-slate-900">{deal.name}</h4>
            </div>
            <p className="mt-0.5 text-sm text-slate-500">{deal.sector}</p>
          </div>

          {/* Quick Actions Dropdown */}
          <div data-no-click>
            <Dropdown
              trigger={
                <button className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
              align="right"
            >
              <DropdownLabel>Quick Actions</DropdownLabel>
              <DropdownItem
                icon={<Calendar className="h-4 w-4" />}
                onClick={() => handleQuickAction('schedule_meeting')}
              >
                Schedule Meeting
              </DropdownItem>
              <DropdownItem
                icon={<MessageSquare className="h-4 w-4" />}
                onClick={() => handleQuickAction('add_note')}
              >
                Add Note
              </DropdownItem>
              <DropdownItem
                icon={<User className="h-4 w-4" />}
                onClick={() => handleQuickAction('assign')}
              >
                Assign
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<AlertCircle className="h-4 w-4" />}
                onClick={() => handleQuickAction('change_priority')}
              >
                Change Priority
              </DropdownItem>
              <DropdownItem
                icon={<CheckCircle2 className="h-4 w-4" />}
                onClick={() => handleQuickAction('move_stage')}
              >
                Move to Stage
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="mb-3 space-y-2 text-sm">
          {deal.enterpriseValue && (
            <div className="flex items-center gap-2 text-slate-600">
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium">{formatLargeNumber(deal.enterpriseValue)}</span>
              {deal.evEbitda && (
                <span className="text-slate-400">({deal.evEbitda.toFixed(1)}x EBITDA)</span>
              )}
            </div>
          )}
          {deal.headquarters && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{deal.headquarters}</span>
            </div>
          )}
          {deal.employeeCount && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>{deal.employeeCount.toLocaleString()} employees</span>
            </div>
          )}
        </div>

        {/* Due Diligence Progress */}
        {deal.dueDiligence && deal.dueDiligence.total > 0 && (
          <div className="mb-3">
            <DueDiligenceProgressBar progress={deal.dueDiligence} />
          </div>
        )}

        {/* Tags */}
        {deal.tags && deal.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {deal.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
            {deal.tags.length > 3 && (
              <Badge variant="outline" size="sm">
                +{deal.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <Badge variant="secondary" size="sm">
            {TARGET_STATUS_LABELS[deal.status]}
          </Badge>

          {/* Priority Badge */}
          {deal.priority && deal.priority !== 'MEDIUM' && (
            <PriorityBadge priority={deal.priority} />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Probability Indicator */}
          {deal.probability !== undefined && (
            <Tooltip content={`Win probability: ${deal.probability}%`}>
              <div className="flex items-center gap-1">
                <div className={cn('h-2 w-2 rounded-full', probabilityColor)} />
                <span className="text-xs text-slate-500">{deal.probability}%</span>
              </div>
            </Tooltip>
          )}

          {/* Overall Score */}
          {deal.overallScore !== undefined && (
            <ScoreIndicator score={deal.overallScore} label="Overall Score" />
          )}
        </div>
      </div>

      {/* Assignees & Activity */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2">
        {/* Assignees */}
        <div className="flex items-center gap-2">
          {deal.assignees && deal.assignees.length > 0 ? (
            <AvatarGroup
              avatars={deal.assignees.map((a) => ({ name: a.name, src: a.avatar }))}
              max={3}
              size="xs"
            />
          ) : (
            <span className="text-xs text-slate-400">Unassigned</span>
          )}
        </div>

        {/* Last Activity */}
        {deal.lastActivityAt && (
          <Tooltip content={`Last activity: ${formatDate(deal.lastActivityAt)}`}>
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              <span>{formatRelativeTime(deal.lastActivityAt)}</span>
            </div>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Card Variant (for List View)
// ============================================================================

interface DealCardCompactProps {
  deal: Deal;
  onClick?: (deal: Deal) => void;
  onQuickAction?: (deal: Deal, action: QuickActionType) => void;
  selected?: boolean;
}

export function DealCardCompact({
  deal,
  onClick,
  onQuickAction,
  selected = false,
}: DealCardCompactProps) {
  const handleQuickAction = (action: QuickActionType) => {
    onQuickAction?.(deal, action);
  };

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-lg border bg-white px-4 py-3 transition-all',
        selected
          ? 'border-primary-300 bg-primary-50 ring-1 ring-primary-200'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
        onClick && 'cursor-pointer'
      )}
      onClick={() => onClick?.(deal)}
    >
      {/* Name & Sector */}
      <div className="min-w-[200px] flex-1">
        <h4 className="font-medium text-slate-900">{deal.name}</h4>
        <p className="text-sm text-slate-500">{deal.sector}</p>
      </div>

      {/* Stage */}
      <div className="w-32">
        <Badge variant="secondary">{TARGET_STATUS_LABELS[deal.status]}</Badge>
      </div>

      {/* Value */}
      <div className="w-24 text-right">
        <span className="font-medium text-slate-900">
          {formatLargeNumber(deal.enterpriseValue)}
        </span>
      </div>

      {/* Probability */}
      <div className="w-20 text-center">
        {deal.probability !== undefined && (
          <span className="text-sm text-slate-600">{deal.probability}%</span>
        )}
      </div>

      {/* Assignees */}
      <div className="w-24">
        {deal.assignees && deal.assignees.length > 0 ? (
          <AvatarGroup
            avatars={deal.assignees.map((a) => ({ name: a.name, src: a.avatar }))}
            max={2}
            size="xs"
          />
        ) : (
          <span className="text-xs text-slate-400">-</span>
        )}
      </div>

      {/* Due Date */}
      <div className="w-28 text-right">
        {deal.targetCloseDate && (
          <span className="text-sm text-slate-500">
            {formatDate(deal.targetCloseDate, 'MMM d')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div data-no-click onClick={(e) => e.stopPropagation()}>
        <Dropdown
          trigger={
            <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          }
          align="right"
        >
          <DropdownItem
            icon={<Calendar className="h-4 w-4" />}
            onClick={() => handleQuickAction('schedule_meeting')}
          >
            Schedule Meeting
          </DropdownItem>
          <DropdownItem
            icon={<MessageSquare className="h-4 w-4" />}
            onClick={() => handleQuickAction('add_note')}
          >
            Add Note
          </DropdownItem>
          <DropdownItem
            icon={<User className="h-4 w-4" />}
            onClick={() => handleQuickAction('assign')}
          >
            Assign
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

export function DealCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-slate-200" />
        <div className="h-4 w-2/3 rounded bg-slate-200" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="h-5 w-20 rounded bg-slate-200" />
        <div className="h-4 w-12 rounded bg-slate-200" />
      </div>
    </div>
  );
}
