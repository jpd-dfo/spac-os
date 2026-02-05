'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import {
  Plus,
  Filter,
  Download,
  LayoutGrid,
  List,
  ChevronDown,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { AddTargetForm, type NewTargetData } from '@/components/pipeline/AddTargetForm';
import { BulkActionBar } from '@/components/pipeline/BulkActionBar';
import { KanbanBoard, DEFAULT_COLUMNS } from '@/components/pipeline/KanbanBoard';
import { PipelineFilters, DEFAULT_FILTERS, type PipelineFiltersState } from '@/components/pipeline/PipelineFilters';
import { PipelineStats, PipelineStatsBar } from '@/components/pipeline/PipelineStats';
import { TargetCardCompact, type Target, type PipelineStage, type QuickAction } from '@/components/pipeline/TargetCard';
import { TargetDetailModal, type TargetDetails } from '@/components/pipeline/TargetDetailModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/Dropdown';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { exportToCSV, exportToExcel, type ExportableTarget } from '@/lib/export';
import { trpc } from '@/lib/trpc/client';
import { cn } from '@/lib/utils';

// ============================================================================
// Data Transformation Utilities
// ============================================================================

// Map database status to UI pipeline stage
function mapStatusToStage(status: string): PipelineStage {
  const statusToStageMap: Record<string, PipelineStage> = {
    'IDENTIFIED': 'sourcing',
    'PRELIMINARY': 'sourcing',
    'RESEARCHING': 'sourcing',
    'OUTREACH': 'initial_screening',
    'NDA_SIGNED': 'initial_screening',
    'DUE_DILIGENCE': 'deep_evaluation',
    'TERM_SHEET': 'deep_evaluation',
    'LOI_SIGNED': 'deep_evaluation',
    'LOI': 'negotiation',
    'DEFINITIVE': 'execution',
    'DA_SIGNED': 'execution',
    'CLOSING': 'execution',
    'CLOSED': 'closed_passed',
    'COMPLETED': 'closed_passed',
    'PASSED': 'closed_passed',
    'TERMINATED': 'closed_passed',
  };
  return statusToStageMap[status] || 'sourcing';
}

// Map UI stage to database status for mutations
function mapStageToStatus(stage: PipelineStage): string {
  const stageToStatusMap: Record<PipelineStage, string> = {
    'sourcing': 'IDENTIFIED',
    'initial_screening': 'NDA_SIGNED',
    'deep_evaluation': 'DUE_DILIGENCE',
    'negotiation': 'LOI',
    'execution': 'DEFINITIVE',
    'closed_passed': 'PASSED',
  };
  return stageToStatusMap[stage] || 'IDENTIFIED';
}

// Map priority number to string
function mapPriorityToString(priority: number | null): 'low' | 'medium' | 'high' | 'critical' | undefined {
  if (priority === null) {
    return undefined;
  }
  if (priority <= 1) {
    return 'critical';
  }
  if (priority <= 2) {
    return 'high';
  }
  if (priority <= 3) {
    return 'medium';
  }
  return 'low';
}

// Calculate days in stage from dates (simplified - uses updatedAt)
function calculateDaysInStage(updatedAt: Date | string | null): number {
  if (!updatedAt) {
    return 0;
  }
  const date = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Transform database target to UI target format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformTargetToUI(dbTarget: any): Target {
  return {
    id: dbTarget.id,
    name: dbTarget.name,
    industry: dbTarget.industry || 'Unknown',
    subIndustry: dbTarget.sector || undefined,
    enterpriseValue: dbTarget.enterpriseValue || 0,
    evaluationScore: dbTarget.overallScore ? Math.round(dbTarget.overallScore * 10) : 50, // Convert 1-10 to 0-100
    daysInStage: calculateDaysInStage(dbTarget.updatedAt),
    stage: mapStatusToStage(dbTarget.status),
    priority: mapPriorityToString(dbTarget.priority),
    source: 'research', // Default since not in DB
    assignee: undefined, // Would need to add user assignment
    description: dbTarget.description || '',
    headquarters: dbTarget.headquarters || undefined,
    revenue: dbTarget.revenue || undefined,
    revenueGrowth: undefined, // Not directly in DB
    ebitda: dbTarget.ebitda || undefined,
    ebitdaMargin: dbTarget.ebitda && dbTarget.revenue
      ? Math.round((dbTarget.ebitda / dbTarget.revenue) * 100)
      : undefined,
    employeeCount: dbTarget.employeeCount || undefined,
    tags: dbTarget.tags || [],
    investmentHighlights: dbTarget.keyOpportunities || undefined,
    keyRisks: dbTarget.keyRisks || undefined,
    createdAt: new Date(dbTarget.createdAt),
    updatedAt: new Date(dbTarget.updatedAt),
  };
}

// Placeholder team members (would come from users query in full implementation)
const TEAM_MEMBERS: { id: string; name: string; avatar: string | undefined; role: string }[] = [
  { id: '1', name: 'Sarah Chen', avatar: undefined, role: 'Managing Director' },
  { id: '2', name: 'Michael Torres', avatar: undefined, role: 'Vice President' },
  { id: '3', name: 'Emily Watson', avatar: undefined, role: 'Associate' },
  { id: '4', name: 'David Park', avatar: undefined, role: 'Analyst' },
  { id: '5', name: 'Jessica Liu', avatar: undefined, role: 'Principal' },
];

// ============================================================================
// Helper Functions
// ============================================================================

function applyFilters(targets: Target[], filters: PipelineFiltersState): Target[] {
  return targets.filter((target) => {
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        target.name.toLowerCase().includes(searchLower) ||
        target.industry.toLowerCase().includes(searchLower) ||
        target.description?.toLowerCase().includes(searchLower) ||
        target.tags?.some((tag) => tag.toLowerCase().includes(searchLower));
      if (!matchesSearch) {return false;}
    }

    // Industry filter
    if (filters.industries.length > 0) {
      const industryMatch = filters.industries.some(
        (ind) => target.industry.toLowerCase().includes(ind.toLowerCase())
      );
      if (!industryMatch) {return false;}
    }

    // Stage filter
    if (filters.stages.length > 0 && !filters.stages.includes(target.stage)) {
      return false;
    }

    // Assignee filter
    if (filters.assignees.length > 0) {
      if (!target.assignee || !filters.assignees.includes(target.assignee.id)) {
        return false;
      }
    }

    // Value range filter
    if (filters.valueRange.min !== null && target.enterpriseValue < filters.valueRange.min) {
      return false;
    }
    if (filters.valueRange.max !== null && target.enterpriseValue > filters.valueRange.max) {
      return false;
    }

    // Score range filter
    if (filters.scoreRange.min !== null && target.evaluationScore < filters.scoreRange.min) {
      return false;
    }
    if (filters.scoreRange.max !== null && target.evaluationScore > filters.scoreRange.max) {
      return false;
    }

    // Source filter
    if (filters.sources.length > 0 && target.source && !filters.sources.includes(target.source)) {
      return false;
    }

    return true;
  });
}

// ============================================================================
// Main Component
// ============================================================================

export default function PipelinePage() {
  const router = useRouter();

  // tRPC Queries and Mutations
  const utils = trpc.useUtils();

  const {
    data: targetListData,
    isLoading,
    error,
  } = trpc.target.list.useQuery({
    page: 1,
    pageSize: 100, // Get all for client-side filtering
  });

  const updateStatusMutation = trpc.target.updateStatus.useMutation({
    onSuccess: () => {
      utils.target.list.invalidate();
    },
  });

  const createTargetMutation = trpc.target.create.useMutation({
    onSuccess: () => {
      utils.target.list.invalidate();
    },
  });

  const deleteTargetMutation = trpc.target.delete.useMutation({
    onSuccess: () => {
      utils.target.list.invalidate();
    },
  });

  // Transform database targets to UI format
  const targets: Target[] = useMemo(() => {
    if (!targetListData?.items) {
      return [];
    }
    return targetListData.items.map(transformTargetToUI);
  }, [targetListData]);

  // UI State
  const [filters, setFilters] = useState<PipelineFiltersState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [_isEditRedirectPending, _setIsEditRedirectPending] = useState(false);
  const [isMoveStageModalOpen, setIsMoveStageModalOpen] = useState(false);
  const [addFormInitialStage, setAddFormInitialStage] = useState<PipelineStage>('sourcing');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'score' | 'days'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);

  // Selection state for bulk operations
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);

  // Stage configuration for move stage modal
  const STAGE_OPTIONS: { value: PipelineStage; label: string }[] = [
    { value: 'sourcing', label: 'Sourcing' },
    { value: 'initial_screening', label: 'Initial Screening' },
    { value: 'deep_evaluation', label: 'Deep Evaluation' },
    { value: 'negotiation', label: 'Negotiation' },
    { value: 'execution', label: 'Execution' },
    { value: 'closed_passed', label: 'Closed/Passed' },
  ];

  // Filtered and sorted targets
  const filteredTargets = useMemo(() => {
    const result = applyFilters(targets, filters);

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'value':
          comparison = a.enterpriseValue - b.enterpriseValue;
          break;
        case 'score':
          comparison = a.evaluationScore - b.evaluationScore;
          break;
        case 'days':
          comparison = a.daysInStage - b.daysInStage;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [targets, filters, sortBy, sortDirection]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) {count++;}
    if (filters.industries.length > 0) {count++;}
    if (filters.stages.length > 0) {count++;}
    if (filters.assignees.length > 0) {count++;}
    if (filters.valueRange.min !== null || filters.valueRange.max !== null) {count++;}
    if (filters.scoreRange.min !== null || filters.scoreRange.max !== null) {count++;}
    if (filters.sources.length > 0) {count++;}
    return count;
  }, [filters]);

  // Handlers
  const handleTargetMove = useCallback(
    (targetId: string, _fromStage: PipelineStage, toStage: PipelineStage) => {
      const newStatus = mapStageToStatus(toStage);
      updateStatusMutation.mutate({
        id: targetId,
        status: newStatus as 'IDENTIFIED' | 'PRELIMINARY' | 'NDA_SIGNED' | 'DUE_DILIGENCE' | 'TERM_SHEET' | 'LOI' | 'DEFINITIVE' | 'CLOSED' | 'PASSED' | 'TERMINATED',
      });
    },
    [updateStatusMutation]
  );

  const handleTargetClick = useCallback((target: Target) => {
    setSelectedTarget(target);
    setIsDetailModalOpen(true);
  }, []);

  const handleQuickAction = useCallback(
    (target: Target, action: QuickAction) => {
      switch (action) {
        case 'view':
          handleTargetClick(target);
          break;
        case 'edit':
          // Navigate to target detail page for editing
          setSelectedTarget(target);
          router.push(`/pipeline/${target.id}`);
          break;
        case 'move':
          // Open stage picker modal
          setSelectedTarget(target);
          setIsMoveStageModalOpen(true);
          break;
        case 'archive':
          deleteTargetMutation.mutate({ id: target.id }, {
            onSuccess: () => {
              toast.success('Target archived successfully');
            },
            onError: (err) => {
              toast.error(`Failed to archive target: ${err.message}`);
            },
          });
          break;
      }
    },
    [handleTargetClick, deleteTargetMutation]
  );

  const handleMoveToStage = useCallback((stage: PipelineStage) => {
    if (!selectedTarget) {
      return;
    }

    const newStatus = mapStageToStatus(stage);
    updateStatusMutation.mutate({
      id: selectedTarget.id,
      status: newStatus as 'IDENTIFIED' | 'PRELIMINARY' | 'NDA_SIGNED' | 'DUE_DILIGENCE' | 'TERM_SHEET' | 'LOI' | 'DEFINITIVE' | 'CLOSED' | 'PASSED' | 'TERMINATED',
    }, {
      onSuccess: () => {
        setIsMoveStageModalOpen(false);
        setSelectedTarget(null);
        toast.success(`Target moved to ${stage.replace('_', ' ')}`);
      },
      onError: (err) => {
        toast.error(`Failed to move target: ${err.message}`);
      },
    });
  }, [selectedTarget, updateStatusMutation]);

  const handleAddTarget = useCallback((stage?: PipelineStage) => {
    setAddFormInitialStage(stage || 'sourcing');
    setIsAddFormOpen(true);
  }, []);

  const handleSubmitNewTarget = useCallback((data: NewTargetData) => {
    // Map UI stage to database status
    const status = mapStageToStatus(data.stage);

    createTargetMutation.mutate({
      name: data.name,
      industry: data.industry,
      sector: data.subIndustry,
      enterpriseValue: data.estimatedValuation,
      description: data.description,
      status: status as 'IDENTIFIED' | 'PRELIMINARY' | 'NDA_SIGNED' | 'DUE_DILIGENCE' | 'TERM_SHEET' | 'LOI' | 'DEFINITIVE' | 'CLOSED' | 'PASSED' | 'TERMINATED',
      tags: data.tags,
    }, {
      onSuccess: () => {
        setIsAddFormOpen(false);
      },
    });
  }, [createTargetMutation]);

  const handleAdvanceTarget = useCallback((target: TargetDetails) => {
    const stageOrder: PipelineStage[] = [
      'sourcing',
      'initial_screening',
      'deep_evaluation',
      'negotiation',
      'execution',
      'closed_passed',
    ];
    const currentIndex = stageOrder.indexOf(target.stage);
    const nextStage = stageOrder[currentIndex + 1];
    if (currentIndex < stageOrder.length - 1 && nextStage) {
      const newStatus = mapStageToStatus(nextStage);
      updateStatusMutation.mutate({
        id: target.id,
        status: newStatus as 'IDENTIFIED' | 'PRELIMINARY' | 'NDA_SIGNED' | 'DUE_DILIGENCE' | 'TERM_SHEET' | 'LOI' | 'DEFINITIVE' | 'CLOSED' | 'PASSED' | 'TERMINATED',
      }, {
        onSuccess: () => {
          setIsDetailModalOpen(false);
        },
      });
    }
  }, [updateStatusMutation]);

  const handleRejectTarget = useCallback((target: TargetDetails) => {
    updateStatusMutation.mutate({
      id: target.id,
      status: 'PASSED',
    }, {
      onSuccess: () => {
        setIsDetailModalOpen(false);
      },
    });
  }, [updateStatusMutation]);

  const handleSort = useCallback((newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

  // Selection handlers for bulk operations
  const toggleSelection = useCallback((target: Target, selected: boolean) => {
    setSelectedTargets((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(target.id);
      } else {
        newSet.delete(target.id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    const allIds = new Set(filteredTargets.map((t) => t.id));
    setSelectedTargets(allIds);
  }, [filteredTargets]);

  const deselectAll = useCallback(() => {
    setSelectedTargets(new Set());
  }, []);

  // Bulk operation handlers
  const handleBulkMoveToStage = useCallback(async (stage: PipelineStage) => {
    if (selectedTargets.size === 0) {return;}

    setIsBulkOperationLoading(true);
    const newStatus = mapStageToStatus(stage);

    try {
      // Process all selected targets
      const promises = Array.from(selectedTargets).map((targetId) =>
        updateStatusMutation.mutateAsync({
          id: targetId,
          status: newStatus as 'IDENTIFIED' | 'PRELIMINARY' | 'NDA_SIGNED' | 'DUE_DILIGENCE' | 'TERM_SHEET' | 'LOI' | 'DEFINITIVE' | 'CLOSED' | 'PASSED' | 'TERMINATED',
        })
      );

      await Promise.all(promises);

      // Clear selection after successful operation
      setSelectedTargets(new Set());
      utils.target.list.invalidate();
    } catch {
      // Error handling - mutations already have error handling
      console.error('Bulk move operation failed');
    } finally {
      setIsBulkOperationLoading(false);
    }
  }, [selectedTargets, updateStatusMutation, utils.target.list]);

  const handleBulkArchive = useCallback(async () => {
    if (selectedTargets.size === 0) {return;}

    setIsBulkOperationLoading(true);

    try {
      // Process all selected targets for deletion
      const promises = Array.from(selectedTargets).map((targetId) =>
        deleteTargetMutation.mutateAsync({ id: targetId })
      );

      await Promise.all(promises);

      // Clear selection after successful operation
      setSelectedTargets(new Set());
      utils.target.list.invalidate();
    } catch {
      // Error handling - mutations already have error handling
      console.error('Bulk archive operation failed');
    } finally {
      setIsBulkOperationLoading(false);
    }
  }, [selectedTargets, deleteTargetMutation, utils.target.list]);

  // Transform filtered targets to exportable format
  const getExportData = useCallback((): ExportableTarget[] => {
    return filteredTargets.map((target) => ({
      id: target.id,
      name: target.name,
      industry: target.industry,
      stage: target.stage,
      enterpriseValue: target.enterpriseValue,
      revenue: target.revenue,
      ebitda: target.ebitda,
      evaluationScore: target.evaluationScore,
      priority: target.priority,
      headquarters: target.headquarters,
      employeeCount: target.employeeCount,
      description: target.description,
      tags: target.tags,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
    }));
  }, [filteredTargets]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = getExportData();
      await exportToCSV(data, 'spac-pipeline');
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  const handleExportExcel = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = getExportData();
      await exportToExcel(data, 'spac-pipeline');
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Deal Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track and manage healthcare acquisition targets for Soren Acquisition Corporation
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Select All / Deselect Toggle */}
          <Button
            variant={selectedTargets.size > 0 ? 'primary' : 'secondary'}
            size="md"
            onClick={selectedTargets.size === filteredTargets.length ? deselectAll : selectAll}
          >
            <CheckSquare className="mr-2 h-4 w-4" />
            {selectedTargets.size === filteredTargets.length && filteredTargets.length > 0
              ? 'Deselect All'
              : 'Select All'}
          </Button>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="primary" size="sm" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Stats Toggle */}
          <Button
            variant={showStats ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Stats
          </Button>

          {/* Sort Dropdown */}
          <Dropdown
            trigger={
              <Button variant="secondary" size="md">
                Sort
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            }
            align="right"
          >
            <DropdownLabel>Sort By</DropdownLabel>
            <DropdownItem onClick={() => handleSort('name')}>
              <span className={sortBy === 'name' ? 'font-medium text-primary-600' : ''}>
                Name {sortBy === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
              </span>
            </DropdownItem>
            <DropdownItem onClick={() => handleSort('value')}>
              <span className={sortBy === 'value' ? 'font-medium text-primary-600' : ''}>
                Enterprise Value {sortBy === 'value' && (sortDirection === 'desc' ? '(High)' : '(Low)')}
              </span>
            </DropdownItem>
            <DropdownItem onClick={() => handleSort('score')}>
              <span className={sortBy === 'score' ? 'font-medium text-primary-600' : ''}>
                Evaluation Score {sortBy === 'score' && (sortDirection === 'desc' ? '(High)' : '(Low)')}
              </span>
            </DropdownItem>
            <DropdownItem onClick={() => handleSort('days')}>
              <span className={sortBy === 'days' ? 'font-medium text-primary-600' : ''}>
                Days in Stage {sortBy === 'days' && (sortDirection === 'desc' ? '(Most)' : '(Least)')}
              </span>
            </DropdownItem>
          </Dropdown>

          {/* Export */}
          <Dropdown
            trigger={
              <Button variant="secondary" size="md" disabled={isExporting}>
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            }
            align="right"
          >
            <DropdownItem onClick={handleExportCSV} disabled={isExporting}>
              Export as CSV
            </DropdownItem>
            <DropdownItem onClick={handleExportExcel} disabled={isExporting}>
              Export as Excel
            </DropdownItem>
          </Dropdown>

          {/* Add Target */}
          <Button variant="primary" size="md" onClick={() => handleAddTarget()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Target
          </Button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <PipelineStatsBar targets={filteredTargets} />

      {/* Filters Panel */}
      {showFilters && (
        <PipelineFilters
          filters={filters}
          onFiltersChange={setFilters}
          availableAssignees={TEAM_MEMBERS}
        />
      )}

      {/* Stats Panel */}
      {showStats && (
        <PipelineStats targets={filteredTargets} />
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading pipeline...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <span>Failed to load pipeline: {error.message}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && viewMode === 'kanban' ? (
        <KanbanBoard
          targets={filteredTargets}
          columns={DEFAULT_COLUMNS}
          isLoading={updateStatusMutation.isPending}
          onTargetMove={handleTargetMove}
          onTargetClick={handleTargetClick}
          onTargetQuickAction={handleQuickAction}
          onAddTarget={handleAddTarget}
          selectedTargets={selectedTargets}
          onSelectionChange={toggleSelection}
          showCheckboxes={true}
        />
      ) : !isLoading && !error && (
        <div className="space-y-3">
          {/* List Header */}
          <div className="flex items-center gap-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
            <div className="w-4" /> {/* Checkbox */}
            <div className="w-8" /> {/* Logo */}
            <div className="min-w-[180px] flex-1">Target</div>
            <div className="w-24 text-right">EV</div>
            <div className="w-20 text-center">Score</div>
            <div className="w-16 text-center">Days</div>
            <div className="w-32">Assignee</div>
            <div className="w-24">Stage</div>
            <div className="w-10" /> {/* Actions */}
          </div>

          {/* List Items */}
          {filteredTargets.map((target) => (
            <TargetCardCompact
              key={target.id}
              target={target}
              onClick={handleTargetClick}
              onQuickAction={handleQuickAction}
              selected={selectedTargets.has(target.id)}
              showCheckbox={true}
              onSelectionChange={toggleSelection}
            />
          ))}

          {/* Empty State */}
          {filteredTargets.length === 0 && (
            <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
              <div className="text-center">
                <p className="text-slate-500">No targets match your filters</p>
                <p className="text-sm text-slate-400">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Target Detail Modal */}
      <TargetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        target={selectedTarget as TargetDetails}
        onAdvance={handleAdvanceTarget}
        onReject={handleRejectTarget}
        onEdit={() => {
          if (selectedTarget) {
            router.push(`/pipeline/${selectedTarget.id}`);
          }
        }}
      />

      {/* Add Target Form */}
      <AddTargetForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleSubmitNewTarget}
        initialStage={addFormInitialStage}
      />

      {/* Move Stage Modal */}
      <Modal
        isOpen={isMoveStageModalOpen}
        onClose={() => {
          setIsMoveStageModalOpen(false);
          setSelectedTarget(null);
        }}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Move to Stage</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <p className="text-sm text-slate-600 mb-4">
            Select a new stage for <span className="font-medium">{selectedTarget?.name}</span>
          </p>
          <div className="space-y-2">
            {STAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleMoveToStage(option.value)}
                disabled={selectedTarget?.stage === option.value || updateStatusMutation.isPending}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors',
                  selectedTarget?.stage === option.value
                    ? 'bg-slate-100 border-slate-300 cursor-not-allowed'
                    : 'hover:bg-primary-50 hover:border-primary-300 border-slate-200'
                )}
              >
                <span className={cn(
                  'font-medium',
                  selectedTarget?.stage === option.value ? 'text-slate-400' : 'text-slate-700'
                )}>
                  {option.label}
                </span>
                {selectedTarget?.stage === option.value && (
                  <span className="text-xs text-slate-400">Current</span>
                )}
                {selectedTarget?.stage !== option.value && (
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                )}
              </button>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsMoveStageModalOpen(false);
              setSelectedTarget(null);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedTargets.size}
        onMoveToStage={handleBulkMoveToStage}
        onArchive={handleBulkArchive}
        onClearSelection={deselectAll}
        isLoading={isBulkOperationLoading}
      />
    </div>
  );
}
