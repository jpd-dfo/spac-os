'use client';

import { useState, useMemo } from 'react';

import { Plus, ChevronDown, ChevronRight, MoreVertical, Settings, Archive } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { TARGET_STATUS_LABELS } from '@/lib/constants';
import { cn, formatLargeNumber } from '@/lib/utils';
import type { TargetStatus } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface PipelineColumnTarget {
  id: string;
  name: string;
  industry: string | null;
  enterpriseValue: number | null;
  overallScore: number | null;
  status: TargetStatus;
}

export interface PipelineColumnProps {
  status: TargetStatus;
  targets: PipelineColumnTarget[];
  color?: string;
  isLoading?: boolean;
  onAddTarget?: (status: TargetStatus) => void;
  onTargetClick?: (target: PipelineColumnTarget) => void;
  onTargetDrop?: (targetId: string, targetStatus: TargetStatus, newStatus: TargetStatus) => void;
  onConfigureColumn?: (status: TargetStatus) => void;
  showValue?: boolean;
  collapsible?: boolean;
  renderTarget?: (target: PipelineColumnTarget) => React.ReactNode;
  children?: React.ReactNode;
}

// ============================================================================
// Status Color Configuration
// ============================================================================

const STATUS_COLORS: Record<TargetStatus, string> = {
  IDENTIFIED: 'bg-slate-500',
  INITIAL_CONTACT: 'bg-blue-500',
  NDA_SIGNED: 'bg-cyan-500',
  DATA_ROOM_ACCESS: 'bg-indigo-500',
  MANAGEMENT_MEETING: 'bg-violet-500',
  VALUATION_ONGOING: 'bg-purple-500',
  TERM_SHEET: 'bg-fuchsia-500',
  LOI: 'bg-amber-500',
  PASSED: 'bg-red-500',
  CLOSED: 'bg-emerald-500',
};

// ============================================================================
// Default Target Card Component
// ============================================================================

interface DefaultTargetCardProps {
  target: PipelineColumnTarget;
  onClick?: (target: PipelineColumnTarget) => void;
  onDragStart?: (e: React.DragEvent, target: PipelineColumnTarget) => void;
}

function DefaultTargetCard({ target, onClick, onDragStart }: DefaultTargetCardProps) {
  const scoreColor = useMemo(() => {
    if (target.overallScore === null) {return 'bg-slate-100 text-slate-500';}
    if (target.overallScore >= 80) {return 'bg-success-100 text-success-700';}
    if (target.overallScore >= 60) {return 'bg-primary-100 text-primary-700';}
    if (target.overallScore >= 40) {return 'bg-warning-100 text-warning-700';}
    return 'bg-danger-100 text-danger-700';
  }, [target.overallScore]);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart?.(e, target)}
      onClick={() => onClick?.(target)}
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all cursor-grab',
        'hover:border-slate-300 hover:shadow-md',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium text-slate-900">{target.name}</h4>
          {target.industry && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{target.industry}</p>
          )}
        </div>
        {target.overallScore !== null && (
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', scoreColor)}>
            {target.overallScore}
          </span>
        )}
      </div>
      {target.enterpriseValue && (
        <div className="mt-2 text-xs text-slate-600">
          <span className="font-medium">{formatLargeNumber(target.enterpriseValue)}</span>
          <span className="text-slate-400 ml-1">EV</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Column Header Component
// ============================================================================

interface ColumnHeaderProps {
  status: TargetStatus;
  color: string;
  targetCount: number;
  totalValue: number;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  onAddTarget?: () => void;
  onConfigure?: () => void;
  showValue?: boolean;
}

function ColumnHeader({
  status,
  color,
  targetCount,
  totalValue,
  isCollapsed,
  onToggleCollapse,
  onAddTarget,
  onConfigure,
  showValue = true,
}: ColumnHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="rounded p-0.5 hover:bg-slate-200 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>
        )}
        <div className={cn('h-3 w-3 rounded-full', color)} />
        <h3 className="font-semibold text-slate-900 text-sm">{TARGET_STATUS_LABELS[status]}</h3>
        <Badge variant="secondary" size="sm">
          {targetCount}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        {onAddTarget && (
          <Tooltip content="Add target to this column">
            <button
              onClick={onAddTarget}
              className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
        {onConfigure && (
          <Dropdown
            trigger={
              <button className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            align="right"
          >
            <DropdownItem icon={<Settings className="h-4 w-4" />} onClick={onConfigure}>
              Configure Column
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem icon={<Archive className="h-4 w-4" />}>
              Archive All
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PipelineColumn({
  status,
  targets,
  color,
  isLoading = false,
  onAddTarget,
  onTargetClick,
  onTargetDrop,
  onConfigureColumn,
  showValue = true,
  collapsible = true,
  renderTarget,
  children,
}: PipelineColumnProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const columnColor = color || STATUS_COLORS[status] || 'bg-slate-500';

  const totalValue = useMemo(() => {
    return targets.reduce((sum, t) => sum + (t.enterpriseValue || 0), 0);
  }, [targets]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const targetId = e.dataTransfer.getData('text/plain');
    const targetDataStr = e.dataTransfer.getData('application/json');

    if (targetId && targetDataStr) {
      try {
        const targetData = JSON.parse(targetDataStr);
        if (targetData.status !== status) {
          onTargetDrop?.(targetId, targetData.status, status);
        }
      } catch {
        // Fallback if JSON parsing fails
        onTargetDrop?.(targetId, status, status);
      }
    }
  };

  const handleDragStart = (e: React.DragEvent, target: PipelineColumnTarget) => {
    e.dataTransfer.setData('text/plain', target.id);
    e.dataTransfer.setData('application/json', JSON.stringify(target));
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={cn(
        'flex min-w-[300px] max-w-[300px] flex-col rounded-xl transition-all duration-200',
        isDragOver
          ? 'bg-primary-50 ring-2 ring-primary-300 ring-inset'
          : 'bg-slate-100'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 pb-2">
        <ColumnHeader
          status={status}
          color={columnColor}
          targetCount={targets.length}
          totalValue={totalValue}
          isCollapsed={isCollapsed}
          onToggleCollapse={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
          onAddTarget={onAddTarget ? () => onAddTarget(status) : undefined}
          onConfigure={onConfigureColumn ? () => onConfigureColumn(status) : undefined}
          showValue={showValue}
        />

        {/* Value Summary */}
        {showValue && !isCollapsed && totalValue > 0 && (
          <div className="mt-2 text-xs text-slate-500">
            {formatLargeNumber(totalValue)} total value
          </div>
        )}
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div
          className="flex-1 space-y-2 overflow-y-auto p-4 pt-2"
          style={{ maxHeight: 'calc(100vh - 320px)' }}
        >
          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-3">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {/* Custom Children or Default Target Cards */}
          {!isLoading && children}

          {/* Default Target Cards */}
          {!isLoading && !children && targets.length > 0 && (
            targets.map((target) =>
              renderTarget ? (
                <div key={target.id}>{renderTarget(target)}</div>
              ) : (
                <DefaultTargetCard
                  key={target.id}
                  target={target}
                  onClick={onTargetClick}
                  onDragStart={handleDragStart}
                />
              )
            )
          )}

          {/* Empty State */}
          {!isLoading && !children && targets.length === 0 && (
            <div
              className={cn(
                'flex h-24 items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                isDragOver
                  ? 'border-primary-400 bg-primary-50 text-primary-600'
                  : 'border-slate-300 text-slate-400'
              )}
              onClick={() => onAddTarget?.(status)}
            >
              <div className="text-center">
                <Plus className="mx-auto h-5 w-5 mb-1" />
                <span className="text-xs">
                  {isDragOver ? 'Drop here' : 'Add target'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed Summary */}
      {isCollapsed && (
        <div className="px-4 pb-4">
          <div className="rounded-lg bg-white p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">{targets.length} targets</span>
              <span className="font-medium text-slate-900">{formatLargeNumber(totalValue)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Column Skeleton
// ============================================================================

export function PipelineColumnSkeleton() {
  return (
    <div className="flex min-w-[300px] max-w-[300px] animate-pulse flex-col rounded-xl bg-slate-100 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-slate-300" />
        <div className="h-5 w-24 rounded bg-slate-300" />
        <div className="h-5 w-8 rounded bg-slate-300" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Export Status Colors for external use
// ============================================================================

export { STATUS_COLORS };
