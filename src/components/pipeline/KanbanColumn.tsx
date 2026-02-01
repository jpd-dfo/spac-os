'use client';

import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, MoreVertical, Settings, Archive, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatLargeNumber } from '@/lib/utils';
import { DealCard, DealCardSkeleton } from './DealCard';
import type { Deal, PipelineStage, QuickActionType } from './types';

// ============================================================================
// Types
// ============================================================================

interface KanbanColumnProps {
  stage: PipelineStage;
  deals: Deal[];
  isLoading?: boolean;
  onAddDeal?: (stage: PipelineStage) => void;
  onDealClick?: (deal: Deal) => void;
  onDealQuickAction?: (deal: Deal, action: QuickActionType) => void;
  onConfigureStage?: (stage: PipelineStage) => void;
  showValue?: boolean;
  showCount?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: (stageId: string) => void;
}

// ============================================================================
// Column Header
// ============================================================================

interface ColumnHeaderProps {
  stage: PipelineStage;
  dealCount: number;
  totalValue: number;
  onAddDeal?: () => void;
  onConfigureStage?: () => void;
  showValue?: boolean;
  collapsible?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function ColumnHeader({
  stage,
  dealCount,
  totalValue,
  onAddDeal,
  onConfigureStage,
  showValue = true,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
}: ColumnHeaderProps) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <div
        className={cn('flex items-center gap-2', collapsible && 'cursor-pointer')}
        onClick={collapsible ? onToggleCollapse : undefined}
      >
        {/* Stage Color Indicator */}
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: stage.color }}
        />

        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-slate-900">{stage.name}</h3>
            <Badge variant="secondary" size="sm">
              {dealCount}
            </Badge>
          </div>
          {showValue && totalValue > 0 && (
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <TrendingUp className="h-3 w-3" />
              <span>{formatLargeNumber(totalValue)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Add Deal Button */}
        {onAddDeal && (
          <Tooltip content="Add deal to this stage">
            <button
              onClick={onAddDeal}
              className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600"
            >
              <Plus className="h-4 w-4" />
            </button>
          </Tooltip>
        )}

        {/* Column Menu */}
        {onConfigureStage && (
          <Dropdown
            trigger={
              <button className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600">
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            align="right"
          >
            <DropdownItem
              icon={<Settings className="h-4 w-4" />}
              onClick={onConfigureStage}
            >
              Configure Stage
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={<Archive className="h-4 w-4" />}
              onClick={() => {}}
            >
              Archive All Deals
            </DropdownItem>
          </Dropdown>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

interface EmptyColumnProps {
  stageName: string;
  onAddDeal?: () => void;
}

function EmptyColumn({ stageName, onAddDeal }: EmptyColumnProps) {
  return (
    <div
      className={cn(
        'flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/50 text-slate-400 transition-colors',
        onAddDeal && 'cursor-pointer hover:border-slate-400 hover:bg-slate-100/50'
      )}
      onClick={onAddDeal}
    >
      <Plus className="mb-1 h-5 w-5" />
      <span className="text-sm">Add first deal</span>
    </div>
  );
}

// ============================================================================
// Drop Zone Indicator
// ============================================================================

function DropZoneIndicator({ isOver }: { isOver: boolean }) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed p-4 text-center transition-all',
        isOver
          ? 'border-primary-400 bg-primary-50 text-primary-600'
          : 'border-transparent'
      )}
    >
      {isOver && (
        <span className="text-sm font-medium">Drop deal here</span>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function KanbanColumn({
  stage,
  deals,
  isLoading = false,
  onAddDeal,
  onDealClick,
  onDealQuickAction,
  onConfigureStage,
  showValue = true,
  showCount = true,
  collapsible = false,
  collapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  // Set up droppable
  const { setNodeRef, isOver } = useDroppable({
    id: stage.key,
    data: {
      type: 'column',
      stage,
    },
  });

  // Calculate totals
  const totalValue = useMemo(() => {
    return deals.reduce((acc, deal) => acc + (deal.enterpriseValue || 0), 0);
  }, [deals]);

  // Get deal IDs for sortable context
  const dealIds = useMemo(() => deals.map((d) => d.id), [deals]);

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg bg-slate-100',
        collapsed ? 'w-14' : 'min-w-[320px] max-w-[320px]'
      )}
    >
      {/* Column Header */}
      {collapsed ? (
        // Collapsed Header (Vertical)
        <div
          className="flex cursor-pointer flex-col items-center gap-2 p-3"
          onClick={() => onToggleCollapse?.(stage.id)}
        >
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <div className="writing-vertical-lr rotate-180 text-sm font-medium text-slate-700">
            {stage.name}
          </div>
          <Badge variant="secondary" size="sm">
            {deals.length}
          </Badge>
        </div>
      ) : (
        <div className="p-4 pb-0">
          <ColumnHeader
            stage={stage}
            dealCount={deals.length}
            totalValue={totalValue}
            onAddDeal={onAddDeal ? () => onAddDeal(stage) : undefined}
            onConfigureStage={onConfigureStage ? () => onConfigureStage(stage) : undefined}
            showValue={showValue}
            collapsible={collapsible}
            collapsed={collapsed}
            onToggleCollapse={() => onToggleCollapse?.(stage.id)}
          />
        </div>
      )}

      {/* Column Content */}
      {!collapsed && (
        <div
          ref={setNodeRef}
          className={cn(
            'flex-1 space-y-3 overflow-y-auto p-4 pt-2',
            isOver && 'bg-primary-50/50'
          )}
          style={{ maxHeight: 'calc(100vh - 350px)' }}
        >
          <SortableContext items={dealIds} strategy={verticalListSortingStrategy}>
            {/* Loading State */}
            {isLoading && (
              <>
                <DealCardSkeleton />
                <DealCardSkeleton />
              </>
            )}

            {/* Deal Cards */}
            {!isLoading && deals.length > 0 && (
              <>
                {deals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onClick={onDealClick}
                    onQuickAction={onDealQuickAction}
                  />
                ))}
              </>
            )}

            {/* Empty State */}
            {!isLoading && deals.length === 0 && (
              <EmptyColumn
                stageName={stage.name}
                onAddDeal={onAddDeal ? () => onAddDeal(stage) : undefined}
              />
            )}

            {/* Drop Zone Indicator */}
            <DropZoneIndicator isOver={isOver} />
          </SortableContext>
        </div>
      )}

      {/* Stage Limit Warning */}
      {!collapsed && stage.dealLimit && deals.length >= stage.dealLimit && (
        <div className="border-t border-warning-200 bg-warning-50 px-4 py-2">
          <p className="text-xs text-warning-700">
            Stage limit reached ({stage.dealLimit} deals)
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

export function KanbanColumnSkeleton() {
  return (
    <div className="flex min-w-[320px] max-w-[320px] animate-pulse flex-col rounded-lg bg-slate-100 p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-slate-300" />
          <div className="h-5 w-24 rounded bg-slate-300" />
          <div className="h-5 w-6 rounded bg-slate-300" />
        </div>
      </div>
      <div className="space-y-3">
        <DealCardSkeleton />
        <DealCardSkeleton />
        <DealCardSkeleton />
      </div>
    </div>
  );
}
