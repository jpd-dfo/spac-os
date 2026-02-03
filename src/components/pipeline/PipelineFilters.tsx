'use client';

import { useState, useCallback } from 'react';

import {
  X,
  Search,
  SlidersHorizontal,
  Calendar,
  User,
  Building2,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatLargeNumber } from '@/lib/utils';

import type { PipelineStage, TargetAssignee } from './TargetCard';

// ============================================================================
// Types
// ============================================================================

export interface PipelineFiltersState {
  search: string;
  industries: string[];
  stages: PipelineStage[];
  assignees: string[];
  valueRange: { min: number | null; max: number | null };
  scoreRange: { min: number | null; max: number | null };
  dateRange: { start: Date | null; end: Date | null };
  sources: string[];
}

interface PipelineFiltersProps {
  filters: PipelineFiltersState;
  onFiltersChange: (filters: PipelineFiltersState) => void;
  availableIndustries?: string[];
  availableAssignees?: TargetAssignee[];
  className?: string;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_FILTERS: PipelineFiltersState = {
  search: '',
  industries: [],
  stages: [],
  assignees: [],
  valueRange: { min: null, max: null },
  scoreRange: { min: null, max: null },
  dateRange: { start: null, end: null },
  sources: [],
};

const HEALTHCARE_INDUSTRIES = [
  'Healthcare',
  'Biotechnology',
  'Medical Devices',
  'Pharmaceuticals',
  'Healthcare IT',
  'Healthcare Services',
  'Diagnostics',
  'Life Sciences',
  'Digital Health',
  'Telehealth',
];

const PIPELINE_STAGES: { id: PipelineStage; label: string }[] = [
  { id: 'sourcing', label: 'Sourcing' },
  { id: 'initial_screening', label: 'Initial Screening' },
  { id: 'deep_evaluation', label: 'Deep Evaluation' },
  { id: 'negotiation', label: 'Negotiation' },
  { id: 'execution', label: 'Execution' },
  { id: 'closed_passed', label: 'Closed/Passed' },
];

const SOURCE_OPTIONS = [
  { id: 'inbound', label: 'Inbound' },
  { id: 'referral', label: 'Referral' },
  { id: 'research', label: 'Research' },
  { id: 'banker', label: 'Banker' },
];

const VALUE_PRESETS = [
  { label: 'Under $100M', min: 0, max: 100000000 },
  { label: '$100M - $500M', min: 100000000, max: 500000000 },
  { label: '$500M - $1B', min: 500000000, max: 1000000000 },
  { label: '$1B - $2B', min: 1000000000, max: 2000000000 },
  { label: 'Over $2B', min: 2000000000, max: null },
];

// ============================================================================
// Helper Components
// ============================================================================

interface FilterSectionProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onClear?: () => void;
  hasActiveFilters?: boolean;
}

function FilterSection({ title, icon: Icon, children, onClear, hasActiveFilters }: FilterSectionProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {Icon && <Icon className="h-4 w-4 text-slate-400" />}
          {title}
        </h4>
        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Clear
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

interface FilterChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

function FilterChip({ label, isSelected, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
        isSelected
          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      )}
    >
      {label}
    </button>
  );
}

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: { min: number | null; max: number | null };
  onChange: (value: { min: number | null; max: number | null }) => void;
  formatValue?: (value: number) => string;
  step?: number;
}

function RangeSlider({ label, min, max, value, onChange, formatValue, step = 1 }: RangeSliderProps) {
  const currentMin = value.min ?? min;
  const currentMax = value.max ?? max;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="font-medium text-slate-700">
          {formatValue ? formatValue(currentMin) : currentMin} - {formatValue ? formatValue(currentMax) : currentMax}
        </span>
      </div>
      <div className="flex gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMin}
          onChange={(e) => onChange({ ...value, min: parseInt(e.target.value) })}
          className="w-full accent-primary-500"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentMax}
          onChange={(e) => onChange({ ...value, max: parseInt(e.target.value) })}
          className="w-full accent-primary-500"
        />
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PipelineFilters({
  filters,
  onFiltersChange,
  availableIndustries = HEALTHCARE_INDUSTRIES,
  availableAssignees = [],
  className,
}: PipelineFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = useCallback(
    <K extends keyof PipelineFiltersState>(key: K, value: PipelineFiltersState[K]) => {
      onFiltersChange({ ...filters, [key]: value });
    },
    [filters, onFiltersChange]
  );

  const toggleArrayFilter = useCallback(
    <K extends keyof PipelineFiltersState>(
      key: K,
      value: string
    ) => {
      const current = filters[key] as string[];
      const newValue = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      updateFilter(key, newValue as PipelineFiltersState[K]);
    },
    [filters, updateFilter]
  );

  const clearAllFilters = useCallback(() => {
    onFiltersChange(DEFAULT_FILTERS);
  }, [onFiltersChange]);

  const activeFilterCount = [
    filters.industries.length > 0,
    filters.stages.length > 0,
    filters.assignees.length > 0,
    filters.valueRange.min !== null || filters.valueRange.max !== null,
    filters.scoreRange.min !== null || filters.scoreRange.max !== null,
    filters.dateRange.start !== null || filters.dateRange.end !== null,
    filters.sources.length > 0,
  ].filter(Boolean).length;

  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white', className)}>
      {/* Filter Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-slate-400" />
          <span className="font-medium text-slate-700">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="primary" size="sm">
              {activeFilterCount} active
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'} Filters
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="border-b border-slate-200 px-4 py-3">
        <FilterSection
          title="Industry"
          icon={Building2}
          hasActiveFilters={filters.industries.length > 0}
          onClear={() => updateFilter('industries', [])}
        >
          <div className="flex flex-wrap gap-2">
            {availableIndustries.slice(0, isExpanded ? undefined : 6).map((industry) => (
              <FilterChip
                key={industry}
                label={industry}
                isSelected={filters.industries.includes(industry)}
                onClick={() => toggleArrayFilter('industries', industry)}
              />
            ))}
            {!isExpanded && availableIndustries.length > 6 && (
              <span className="self-center text-sm text-slate-400">
                +{availableIndustries.length - 6} more
              </span>
            )}
          </div>
        </FilterSection>
      </div>

      {/* Extended Filters */}
      {isExpanded && (
        <>
          {/* Value Range */}
          <div className="border-b border-slate-200 px-4 py-3">
            <FilterSection
              title="Enterprise Value"
              icon={DollarSign}
              hasActiveFilters={filters.valueRange.min !== null || filters.valueRange.max !== null}
              onClear={() => updateFilter('valueRange', { min: null, max: null })}
            >
              <div className="flex flex-wrap gap-2">
                {VALUE_PRESETS.map((preset) => {
                  const isSelected =
                    filters.valueRange.min === preset.min &&
                    filters.valueRange.max === preset.max;
                  return (
                    <FilterChip
                      key={preset.label}
                      label={preset.label}
                      isSelected={isSelected}
                      onClick={() =>
                        updateFilter('valueRange', isSelected ? { min: null, max: null } : { min: preset.min, max: preset.max })
                      }
                    />
                  );
                })}
              </div>
            </FilterSection>
          </div>

          {/* Stage Filter */}
          <div className="border-b border-slate-200 px-4 py-3">
            <FilterSection
              title="Pipeline Stage"
              hasActiveFilters={filters.stages.length > 0}
              onClear={() => updateFilter('stages', [])}
            >
              <div className="flex flex-wrap gap-2">
                {PIPELINE_STAGES.map((stage) => (
                  <FilterChip
                    key={stage.id}
                    label={stage.label}
                    isSelected={filters.stages.includes(stage.id)}
                    onClick={() => toggleArrayFilter('stages', stage.id)}
                  />
                ))}
              </div>
            </FilterSection>
          </div>

          {/* Source Filter */}
          <div className="border-b border-slate-200 px-4 py-3">
            <FilterSection
              title="Source"
              hasActiveFilters={filters.sources.length > 0}
              onClear={() => updateFilter('sources', [])}
            >
              <div className="flex flex-wrap gap-2">
                {SOURCE_OPTIONS.map((source) => (
                  <FilterChip
                    key={source.id}
                    label={source.label}
                    isSelected={filters.sources.includes(source.id)}
                    onClick={() => toggleArrayFilter('sources', source.id)}
                  />
                ))}
              </div>
            </FilterSection>
          </div>

          {/* Assigned To */}
          {availableAssignees.length > 0 && (
            <div className="border-b border-slate-200 px-4 py-3">
              <FilterSection
                title="Assigned To"
                icon={User}
                hasActiveFilters={filters.assignees.length > 0}
                onClear={() => updateFilter('assignees', [])}
              >
                <div className="flex flex-wrap gap-2">
                  {availableAssignees.map((assignee) => (
                    <FilterChip
                      key={assignee.id}
                      label={assignee.name}
                      isSelected={filters.assignees.includes(assignee.id)}
                      onClick={() => toggleArrayFilter('assignees', assignee.id)}
                    />
                  ))}
                </div>
              </FilterSection>
            </div>
          )}

          {/* Score Range */}
          <div className="border-b border-slate-200 px-4 py-3">
            <FilterSection
              title="Evaluation Score"
              hasActiveFilters={filters.scoreRange.min !== null || filters.scoreRange.max !== null}
              onClear={() => updateFilter('scoreRange', { min: null, max: null })}
            >
              <RangeSlider
                label="Score"
                min={0}
                max={100}
                step={5}
                value={filters.scoreRange}
                onChange={(value) => updateFilter('scoreRange', value)}
              />
            </FilterSection>
          </div>

          {/* Date Range */}
          <div className="px-4 py-3">
            <FilterSection
              title="Date Added"
              icon={Calendar}
              hasActiveFilters={filters.dateRange.start !== null || filters.dateRange.end !== null}
              onClear={() => updateFilter('dateRange', { start: null, end: null })}
            >
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="date-range-from" className="block text-xs text-slate-500 mb-1">From</label>
                  <input
                    id="date-range-from"
                    type="date"
                    value={filters.dateRange.start?.toISOString().split('T')[0] || ''}
                    onChange={(e) =>
                      updateFilter('dateRange', {
                        ...filters.dateRange,
                        start: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="date-range-to" className="block text-xs text-slate-500 mb-1">To</label>
                  <input
                    id="date-range-to"
                    type="date"
                    value={filters.dateRange.end?.toISOString().split('T')[0] || ''}
                    onChange={(e) =>
                      updateFilter('dateRange', {
                        ...filters.dateRange,
                        end: e.target.value ? new Date(e.target.value) : null,
                      })
                    }
                    className="h-9 w-full rounded-md border border-slate-200 px-3 text-sm"
                  />
                </div>
              </div>
            </FilterSection>
          </div>
        </>
      )}

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Active filters:</span>
            {filters.industries.map((industry) => (
              <Badge key={industry} variant="secondary" size="sm" className="flex items-center gap-1">
                {industry}
                <button
                  onClick={() => toggleArrayFilter('industries', industry)}
                  className="ml-1 rounded-full hover:bg-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.stages.map((stage) => (
              <Badge key={stage} variant="secondary" size="sm" className="flex items-center gap-1">
                {PIPELINE_STAGES.find((s) => s.id === stage)?.label}
                <button
                  onClick={() => toggleArrayFilter('stages', stage)}
                  className="ml-1 rounded-full hover:bg-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.sources.map((source) => (
              <Badge key={source} variant="secondary" size="sm" className="flex items-center gap-1">
                {SOURCE_OPTIONS.find((s) => s.id === source)?.label}
                <button
                  onClick={() => toggleArrayFilter('sources', source)}
                  className="ml-1 rounded-full hover:bg-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(filters.valueRange.min !== null || filters.valueRange.max !== null) && (
              <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                {filters.valueRange.min !== null ? formatLargeNumber(filters.valueRange.min) : '$0'} -{' '}
                {filters.valueRange.max !== null ? formatLargeNumber(filters.valueRange.max) : 'Any'}
                <button
                  onClick={() => updateFilter('valueRange', { min: null, max: null })}
                  className="ml-1 rounded-full hover:bg-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
