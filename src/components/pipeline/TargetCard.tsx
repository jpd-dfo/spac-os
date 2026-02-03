'use client';

import { useState } from 'react';

import {
  MoreHorizontal,
  TrendingUp,
  Building2,
  Clock,
  User,
  Eye,
  Edit,
  ArrowRight,
  Archive,
  Star,
  AlertTriangle,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Dropdown, DropdownItem, DropdownDivider, DropdownLabel } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatLargeNumber } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface TargetAssignee {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

export interface Target {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  subIndustry?: string;
  enterpriseValue: number;
  evaluationScore: number;
  daysInStage: number;
  assignee?: TargetAssignee;
  stage: PipelineStage;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  headquarters?: string;
  revenue?: number;
  revenueGrowth?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  grossMargin?: number;
  employeeCount?: number;
  source?: 'inbound' | 'referral' | 'research' | 'banker';
  tags?: string[];
  investmentHighlights?: string[];
  keyRisks?: string[];
  lastActivityDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PipelineStage =
  | 'sourcing'
  | 'initial_screening'
  | 'deep_evaluation'
  | 'negotiation'
  | 'execution'
  | 'closed_passed';

export type QuickAction = 'view' | 'edit' | 'move' | 'archive';

interface TargetCardProps {
  target: Target;
  isDragging?: boolean;
  isOverlay?: boolean;
  isSelected?: boolean;
  showCheckbox?: boolean;
  onClick?: (target: Target) => void;
  onQuickAction?: (target: Target, action: QuickAction) => void;
  onSelectionChange?: (target: Target, selected: boolean) => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function ScoreIndicator({ score }: { score: number }) {
  const getColor = (value: number) => {
    if (value >= 80) {return 'bg-success-500';}
    if (value >= 60) {return 'bg-primary-500';}
    if (value >= 40) {return 'bg-warning-500';}
    return 'bg-danger-500';
  };

  const getLabel = (value: number) => {
    if (value >= 80) {return 'Excellent';}
    if (value >= 60) {return 'Good';}
    if (value >= 40) {return 'Fair';}
    return 'Poor';
  };

  return (
    <Tooltip content={`Evaluation Score: ${score}/100 (${getLabel(score)})`}>
      <div className="flex items-center gap-1.5">
        <div className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
          <div
            className={cn('h-full rounded-full transition-all', getColor(score))}
            style={{ width: `${score}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600">{score}</span>
      </div>
    </Tooltip>
  );
}

function PriorityIndicator({ priority }: { priority: Target['priority'] }) {
  if (!priority || priority === 'medium') {return null;}

  const config = {
    low: { color: 'text-slate-400', icon: null, label: 'Low Priority' },
    high: { color: 'text-warning-500', icon: Star, label: 'High Priority' },
    critical: { color: 'text-danger-500', icon: AlertTriangle, label: 'Critical Priority' },
  };

  const { color, icon: Icon, label } = config[priority] || {};

  if (!Icon) {return null;}

  return (
    <Tooltip content={label}>
      <Icon className={cn('h-4 w-4', color)} />
    </Tooltip>
  );
}

function DaysInStageBadge({ days }: { days: number }) {
  const getVariant = (d: number) => {
    if (d <= 7) {return 'success';}
    if (d <= 21) {return 'secondary';}
    if (d <= 45) {return 'warning';}
    return 'danger';
  };

  return (
    <Tooltip content={`${days} days in current stage`}>
      <div className="flex items-center gap-1 text-xs text-slate-500">
        <Clock className="h-3 w-3" />
        <span>{days}d</span>
      </div>
    </Tooltip>
  );
}

function IndustryBadge({ industry, subIndustry }: { industry: string; subIndustry?: string }) {
  const industryColors: Record<string, string> = {
    'Healthcare': 'bg-emerald-100 text-emerald-700',
    'Biotechnology': 'bg-purple-100 text-purple-700',
    'Medical Devices': 'bg-blue-100 text-blue-700',
    'Pharmaceuticals': 'bg-indigo-100 text-indigo-700',
    'Healthcare IT': 'bg-cyan-100 text-cyan-700',
    'Healthcare Services': 'bg-teal-100 text-teal-700',
    'Diagnostics': 'bg-rose-100 text-rose-700',
    'Life Sciences': 'bg-violet-100 text-violet-700',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
      industryColors[industry] || 'bg-slate-100 text-slate-700'
    )}>
      {subIndustry || industry}
    </span>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TargetCard({
  target,
  isDragging = false,
  isOverlay = false,
  isSelected = false,
  showCheckbox = false,
  onClick,
  onQuickAction,
  onSelectionChange,
}: TargetCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-no-click]')) {
      return;
    }
    onClick?.(target);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(target, e.target.checked);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleQuickAction = (action: QuickAction) => {
    onQuickAction?.(target, action);
  };

  return (
    <div
      className={cn(
        'group relative rounded-lg border bg-white shadow-sm transition-all duration-200',
        isDragging
          ? 'border-primary-300 shadow-lg ring-2 ring-primary-200'
          : isSelected
            ? 'border-primary-400 bg-primary-50/50 ring-1 ring-primary-200'
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
        isOverlay && 'rotate-2 scale-105',
        onClick && 'cursor-pointer'
      )}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Selection Checkbox */}
      {showCheckbox && (
        <div
          data-no-click
          className={cn(
            'absolute left-2 top-2 z-10 transition-opacity duration-200',
            isHovered || isSelected ? 'opacity-100' : 'opacity-0'
          )}
          onClick={handleCheckboxClick}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
        </div>
      )}

      {/* Card Header */}
      <div className={cn('p-4', showCheckbox && 'pl-8')}>
        <div className="mb-3 flex items-start justify-between gap-2">
          {/* Company Info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Logo Placeholder */}
            <div className={cn(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600'
            )}>
              {target.logoUrl ? (
                <img
                  src={target.logoUrl}
                  alt={target.name}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-semibold text-slate-900">{target.name}</h4>
                <PriorityIndicator priority={target.priority} />
              </div>
              <div className="mt-1">
                <IndustryBadge industry={target.industry} subIndustry={target.subIndustry} />
              </div>
            </div>
          </div>

          {/* Quick Actions Menu */}
          <div data-no-click className={cn(
            'transition-opacity duration-200',
            isHovered || isDragging ? 'opacity-100' : 'opacity-0'
          )}>
            <Dropdown
              trigger={
                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              }
              align="right"
            >
              <DropdownLabel>Quick Actions</DropdownLabel>
              <DropdownItem
                icon={<Eye className="h-4 w-4" />}
                onClick={() => handleQuickAction('view')}
              >
                View Details
              </DropdownItem>
              <DropdownItem
                icon={<Edit className="h-4 w-4" />}
                onClick={() => handleQuickAction('edit')}
              >
                Edit Target
              </DropdownItem>
              <DropdownItem
                icon={<ArrowRight className="h-4 w-4" />}
                onClick={() => handleQuickAction('move')}
              >
                Move to Stage
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem
                icon={<Archive className="h-4 w-4" />}
                onClick={() => handleQuickAction('archive')}
                variant="danger"
              >
                Archive
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        {/* Metrics */}
        <div className="space-y-2">
          {/* Enterprise Value */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <TrendingUp className="h-4 w-4 text-slate-400" />
              <span className="font-medium">{formatLargeNumber(target.enterpriseValue)}</span>
              <span className="text-slate-400">EV</span>
            </div>
            <DaysInStageBadge days={target.daysInStage} />
          </div>

          {/* Evaluation Score */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Evaluation Score</span>
            <ScoreIndicator score={target.evaluationScore} />
          </div>
        </div>

        {/* Tags */}
        {target.tags && target.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {target.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
            {target.tags.length > 2 && (
              <Badge variant="outline" size="sm">
                +{target.tags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Card Footer - Assignee */}
      <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5 bg-slate-50/50">
        {target.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar
              name={target.assignee.name}
              src={target.assignee.avatar}
              size="xs"
            />
            <span className="text-xs text-slate-600">{target.assignee.name}</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <User className="h-3 w-3" />
            <span>Unassigned</span>
          </div>
        )}

        {/* Source indicator */}
        {target.source && (
          <Tooltip content={`Source: ${target.source.charAt(0).toUpperCase() + target.source.slice(1)}`}>
            <Badge variant="secondary" size="sm">
              {target.source.charAt(0).toUpperCase()}
            </Badge>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton Loader
// ============================================================================

export function TargetCardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div className="flex-1">
          <div className="h-5 w-3/4 rounded bg-slate-200" />
          <div className="mt-2 h-4 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-3 w-20 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compact Card Variant
// ============================================================================

interface TargetCardCompactProps {
  target: Target;
  onClick?: (target: Target) => void;
  onQuickAction?: (target: Target, action: QuickAction) => void;
  selected?: boolean;
  showCheckbox?: boolean;
  onSelectionChange?: (target: Target, selected: boolean) => void;
}

export function TargetCardCompact({
  target,
  onClick,
  onQuickAction,
  selected = false,
  showCheckbox = false,
  onSelectionChange,
}: TargetCardCompactProps) {
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onSelectionChange?.(target, e.target.checked);
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
      onClick={() => onClick?.(target)}
    >
      {/* Selection Checkbox */}
      {showCheckbox && (
        <div onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={handleCheckboxChange}
            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
          />
        </div>
      )}
      {/* Logo */}
      <div className={cn(
        'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg',
        'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600'
      )}>
        <Building2 className="h-4 w-4" />
      </div>

      {/* Name & Industry */}
      <div className="min-w-[180px] flex-1">
        <h4 className="font-medium text-slate-900">{target.name}</h4>
        <p className="text-sm text-slate-500">{target.industry}</p>
      </div>

      {/* Enterprise Value */}
      <div className="w-24 text-right">
        <span className="font-medium text-slate-900">
          {formatLargeNumber(target.enterpriseValue)}
        </span>
      </div>

      {/* Score */}
      <div className="w-20 text-center">
        <ScoreIndicator score={target.evaluationScore} />
      </div>

      {/* Days in Stage */}
      <div className="w-16 text-center">
        <DaysInStageBadge days={target.daysInStage} />
      </div>

      {/* Assignee */}
      <div className="w-32">
        {target.assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={target.assignee.name} src={target.assignee.avatar} size="xs" />
            <span className="truncate text-sm text-slate-600">{target.assignee.name}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400">Unassigned</span>
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
            icon={<Eye className="h-4 w-4" />}
            onClick={() => onQuickAction?.(target, 'view')}
          >
            View
          </DropdownItem>
          <DropdownItem
            icon={<Edit className="h-4 w-4" />}
            onClick={() => onQuickAction?.(target, 'edit')}
          >
            Edit
          </DropdownItem>
          <DropdownItem
            icon={<ArrowRight className="h-4 w-4" />}
            onClick={() => onQuickAction?.(target, 'move')}
          >
            Move
          </DropdownItem>
        </Dropdown>
      </div>
    </div>
  );
}
