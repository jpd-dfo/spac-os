'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

import {
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Settings,
  MoreHorizontal,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '@/components/ui/Dropdown';
import { cn, formatLargeNumber } from '@/lib/utils';

import { TargetCard, TargetCardSkeleton, type Target, type PipelineStage, type QuickAction } from './TargetCard';

// ============================================================================
// Types
// ============================================================================

export interface KanbanColumn {
  id: PipelineStage;
  title: string;
  color: string;
  description?: string;
}

interface KanbanBoardProps {
  targets: Target[];
  columns?: KanbanColumn[];
  isLoading?: boolean;
  onTargetMove?: (targetId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
  onTargetClick?: (target: Target) => void;
  onTargetQuickAction?: (target: Target, action: QuickAction) => void;
  onAddTarget?: (stage?: PipelineStage) => void;
  showColumnSettings?: boolean;
}

// ============================================================================
// Default Columns
// ============================================================================

const DEFAULT_COLUMNS: KanbanColumn[] = [
  {
    id: 'sourcing',
    title: 'Sourcing',
    color: 'bg-slate-500',
    description: 'Identifying potential targets',
  },
  {
    id: 'initial_screening',
    title: 'Initial Screening',
    color: 'bg-blue-500',
    description: 'Preliminary review and analysis',
  },
  {
    id: 'deep_evaluation',
    title: 'Deep Evaluation',
    color: 'bg-indigo-500',
    description: 'Detailed due diligence',
  },
  {
    id: 'negotiation',
    title: 'Negotiation',
    color: 'bg-purple-500',
    description: 'Term sheet and deal terms',
  },
  {
    id: 'execution',
    title: 'Execution',
    color: 'bg-amber-500',
    description: 'Documentation and closing',
  },
  {
    id: 'closed_passed',
    title: 'Closed/Passed',
    color: 'bg-emerald-500',
    description: 'Completed or declined deals',
  },
];

// ============================================================================
// Column Header Component
// ============================================================================

interface ColumnHeaderProps {
  column: KanbanColumn;
  targetCount: number;
  totalValue: number;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onAddTarget?: () => void;
  showSettings?: boolean;
}

function ColumnHeader({
  column,
  targetCount,
  totalValue,
  isCollapsed,
  onToggleCollapse,
  onAddTarget,
  showSettings,
}: ColumnHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
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
        <div className={cn('h-3 w-3 rounded-full', column.color)} />
        <h3 className="font-semibold text-slate-900">{column.title}</h3>
        <Badge variant="secondary" size="sm">
          {targetCount}
        </Badge>
      </div>
      <div className="flex items-center gap-1">
        {onAddTarget && (
          <button
            onClick={onAddTarget}
            className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
        {showSettings && (
          <Dropdown
            trigger={
              <button className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
            align="right"
          >
            <DropdownItem icon={<Settings className="h-4 w-4" />}>
              Configure Column
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Column Stats Component
// ============================================================================

interface ColumnStatsProps {
  totalValue: number;
  avgDaysInStage: number;
}

function ColumnStats({ totalValue, avgDaysInStage }: ColumnStatsProps) {
  return (
    <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
      <span>{formatLargeNumber(totalValue)} total</span>
      <span>~{avgDaysInStage}d avg</span>
    </div>
  );
}

// ============================================================================
// Kanban Column Component
// ============================================================================

interface KanbanColumnContainerProps {
  column: KanbanColumn;
  targets: Target[];
  isLoading?: boolean;
  onTargetMove?: (targetId: string, fromStage: PipelineStage, toStage: PipelineStage) => void;
  onTargetClick?: (target: Target) => void;
  onTargetQuickAction?: (target: Target, action: QuickAction) => void;
  onAddTarget?: () => void;
  showSettings?: boolean;
  draggedTarget: Target | null;
  onDragStart: (target: Target) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, column: KanbanColumn) => void;
  onDrop: (e: React.DragEvent, column: KanbanColumn) => void;
}

function KanbanColumnContainer({
  column,
  targets,
  isLoading,
  onTargetClick,
  onTargetQuickAction,
  onAddTarget,
  showSettings,
  draggedTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: KanbanColumnContainerProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValue = useMemo(
    () => targets.reduce((sum, t) => sum + (t.enterpriseValue || 0), 0),
    [targets]
  );

  const avgDaysInStage = useMemo(() => {
    if (targets.length === 0) {return 0;}
    return Math.round(targets.reduce((sum, t) => sum + t.daysInStage, 0) / targets.length);
  }, [targets]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver(e, column);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    onDrop(e, column);
  };

  return (
    <div
      className={cn(
        'flex min-w-[320px] max-w-[320px] flex-col rounded-xl transition-all duration-200',
        isDragOver && draggedTarget?.stage !== column.id
          ? 'bg-primary-50 ring-2 ring-primary-300 ring-inset'
          : 'bg-slate-100'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Column Header */}
      <div className="p-4 pb-0">
        <ColumnHeader
          column={column}
          targetCount={targets.length}
          totalValue={totalValue}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          onAddTarget={onAddTarget}
          showSettings={showSettings}
        />
        {!isCollapsed && <ColumnStats totalValue={totalValue} avgDaysInStage={avgDaysInStage} />}
      </div>

      {/* Column Content */}
      {!isCollapsed && (
        <div className="flex-1 space-y-3 overflow-y-auto p-4 pt-0" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {isLoading ? (
            <>
              <TargetCardSkeleton />
              <TargetCardSkeleton />
            </>
          ) : targets.length === 0 ? (
            <div
              className={cn(
                'flex h-24 items-center justify-center rounded-lg border-2 border-dashed transition-colors',
                isDragOver
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-slate-300 text-slate-400'
              )}
            >
              <span className="text-sm">
                {isDragOver ? 'Drop here' : 'No targets'}
              </span>
            </div>
          ) : (
            targets.map((target) => (
              <div
                key={target.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', target.id);
                  onDragStart(target);
                }}
                onDragEnd={onDragEnd}
                className={cn(
                  'transition-transform duration-200',
                  draggedTarget?.id === target.id && 'opacity-50 scale-95'
                )}
              >
                <TargetCard
                  target={target}
                  isDragging={draggedTarget?.id === target.id}
                  onClick={onTargetClick}
                  onQuickAction={onTargetQuickAction}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Collapsed View */}
      {isCollapsed && (
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
            <span className="text-slate-600">{targets.length} targets</span>
            <span className="font-medium text-slate-900">{formatLargeNumber(totalValue)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function KanbanBoard({
  targets,
  columns = DEFAULT_COLUMNS,
  isLoading = false,
  onTargetMove,
  onTargetClick,
  onTargetQuickAction,
  onAddTarget,
  showColumnSettings = false,
}: KanbanBoardProps) {
  const [draggedTarget, setDraggedTarget] = useState<Target | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Group targets by stage
  const targetsByStage = useMemo(() => {
    const grouped: Record<PipelineStage, Target[]> = {
      sourcing: [],
      initial_screening: [],
      deep_evaluation: [],
      negotiation: [],
      execution: [],
      closed_passed: [],
    };

    targets.forEach((target) => {
      if (grouped[target.stage]) {
        grouped[target.stage].push(target);
      }
    });

    return grouped;
  }, [targets]);

  const handleDragStart = useCallback((target: Target) => {
    setDraggedTarget(target);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, column: KanbanColumn) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, column: KanbanColumn) => {
      e.preventDefault();
      const targetId = e.dataTransfer.getData('text/plain');

      if (draggedTarget && draggedTarget.stage !== column.id) {
        onTargetMove?.(targetId, draggedTarget.stage, column.id);
      }

      setDraggedTarget(null);
    },
    [draggedTarget, onTargetMove]
  );

  // Horizontal scroll with mouse wheel
  useEffect(() => {
    const board = boardRef.current;
    if (!board) {return;}

    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
        board.scrollLeft += e.deltaY;
      }
    };

    board.addEventListener('wheel', handleWheel, { passive: false });
    return () => board.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div
      ref={boardRef}
      className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300"
    >
      {columns.map((column) => (
        <KanbanColumnContainer
          key={column.id}
          column={column}
          targets={targetsByStage[column.id]}
          isLoading={isLoading}
          onTargetClick={onTargetClick}
          onTargetQuickAction={onTargetQuickAction}
          onAddTarget={onAddTarget ? () => onAddTarget(column.id) : undefined}
          showSettings={showColumnSettings}
          draggedTarget={draggedTarget}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Column Skeleton
// ============================================================================

export function KanbanColumnSkeleton() {
  return (
    <div className="flex min-w-[320px] max-w-[320px] flex-col rounded-xl bg-slate-100 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-slate-300 animate-pulse" />
        <div className="h-5 w-24 rounded bg-slate-300 animate-pulse" />
        <div className="h-5 w-8 rounded bg-slate-300 animate-pulse" />
      </div>
      <div className="mb-3 flex justify-between">
        <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
        <div className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
      </div>
      <div className="space-y-3">
        <TargetCardSkeleton />
        <TargetCardSkeleton />
      </div>
    </div>
  );
}

export { DEFAULT_COLUMNS };
export type { KanbanBoardProps };
