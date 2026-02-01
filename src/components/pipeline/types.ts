// ============================================================================
// Pipeline Component Types
// ============================================================================

import { DealStage, TargetStatus, TaskPriority } from '@/types';

// ============================================================================
// Deal / Target Types
// ============================================================================

export interface DealAssignee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface DealNote {
  id: string;
  content: string;
  createdAt: Date;
  createdBy: DealAssignee;
}

export interface DealActivity {
  id: string;
  type: 'note' | 'meeting' | 'email' | 'call' | 'document' | 'stage_change' | 'assignment';
  title: string;
  description?: string;
  createdAt: Date;
  createdBy: DealAssignee;
  metadata?: Record<string, unknown>;
}

export interface DueDiligenceItem {
  id: string;
  category: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignee?: DealAssignee;
  dueDate?: Date;
  completedDate?: Date;
  notes?: string;
}

export interface DueDiligenceProgress {
  total: number;
  completed: number;
  inProgress: number;
  blocked: number;
  categories: {
    name: string;
    total: number;
    completed: number;
  }[];
}

export interface Deal {
  id: string;
  name: string;
  legalName?: string;
  description?: string;
  website?: string;
  sector: string;
  industry?: string;
  stage: DealStage;
  status: TargetStatus;
  priority: TaskPriority;

  // Location
  headquarters?: string;
  region?: string;

  // Company Info
  foundedYear?: number;
  employeeCount?: number;

  // Financials
  enterpriseValue?: number;
  equityValue?: number;
  ltmRevenue?: number;
  ltmEbitda?: number;
  projectedRevenue?: number;
  projectedEbitda?: number;
  evRevenue?: number;
  evEbitda?: number;

  // Scores
  probability?: number;
  overallScore?: number;
  managementScore?: number;
  marketScore?: number;
  financialScore?: number;
  operationalScore?: number;
  riskScore?: number;

  // Dates
  firstContactDate?: Date;
  ndaSignedDate?: Date;
  loiSignedDate?: Date;
  daSignedDate?: Date;
  targetCloseDate?: Date;
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  assignees: DealAssignee[];
  leadAssignee?: DealAssignee;
  notes?: string;
  tags: string[];
  investmentHighlights: string[];
  keyRisks: string[];

  // Due Diligence
  dueDiligence?: DueDiligenceProgress;

  // Activity
  lastActivityAt?: Date;
  activityCount?: number;
}

// ============================================================================
// Pipeline Stage Types
// ============================================================================

export interface PipelineStage {
  id: string;
  name: string;
  key: DealStage;
  color: string;
  description?: string;
  order: number;
  isDefault?: boolean;
  isTerminal?: boolean;
  dealLimit?: number;
  autoAdvanceDays?: number;
}

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  {
    id: 'stage-1',
    name: 'Origination',
    key: 'ORIGINATION',
    color: '#64748b',
    description: 'Initial target identification and sourcing',
    order: 0,
    isDefault: true,
  },
  {
    id: 'stage-2',
    name: 'Preliminary Review',
    key: 'PRELIMINARY_REVIEW',
    color: '#3b82f6',
    description: 'Initial screening and assessment',
    order: 1,
  },
  {
    id: 'stage-3',
    name: 'Deep Dive',
    key: 'DEEP_DIVE',
    color: '#8b5cf6',
    description: 'Comprehensive due diligence',
    order: 2,
  },
  {
    id: 'stage-4',
    name: 'Negotiation',
    key: 'NEGOTIATION',
    color: '#f59e0b',
    description: 'Term negotiation and structuring',
    order: 3,
  },
  {
    id: 'stage-5',
    name: 'Documentation',
    key: 'DOCUMENTATION',
    color: '#06b6d4',
    description: 'Legal documentation and review',
    order: 4,
  },
  {
    id: 'stage-6',
    name: 'Closing',
    key: 'CLOSING',
    color: '#22c55e',
    description: 'Final closing activities',
    order: 5,
    isTerminal: true,
  },
  {
    id: 'stage-7',
    name: 'Terminated',
    key: 'TERMINATED',
    color: '#ef4444',
    description: 'Deal terminated or passed',
    order: 6,
    isTerminal: true,
  },
];

// ============================================================================
// Filter Types
// ============================================================================

export interface DealFilters {
  search: string;
  stages: DealStage[];
  sectors: string[];
  assignees: string[];
  priorities: TaskPriority[];
  tags: string[];
  minValue?: number;
  maxValue?: number;
  minProbability?: number;
  maxProbability?: number;
  dateRange?: {
    start: Date;
    end: Date;
  };
  hasOverdueItems?: boolean;
}

export const DEFAULT_FILTERS: DealFilters = {
  search: '',
  stages: [],
  sectors: [],
  assignees: [],
  priorities: [],
  tags: [],
};

// ============================================================================
// View Types
// ============================================================================

export type ViewMode = 'kanban' | 'list';

export interface SortOption {
  key: keyof Deal;
  direction: 'asc' | 'desc';
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { key: 'name', direction: 'asc', label: 'Name (A-Z)' },
  { key: 'name', direction: 'desc', label: 'Name (Z-A)' },
  { key: 'enterpriseValue', direction: 'desc', label: 'Value (High to Low)' },
  { key: 'enterpriseValue', direction: 'asc', label: 'Value (Low to High)' },
  { key: 'probability', direction: 'desc', label: 'Probability (High to Low)' },
  { key: 'probability', direction: 'asc', label: 'Probability (Low to High)' },
  { key: 'updatedAt', direction: 'desc', label: 'Recently Updated' },
  { key: 'createdAt', direction: 'desc', label: 'Recently Added' },
  { key: 'targetCloseDate', direction: 'asc', label: 'Close Date (Soonest)' },
];

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeNotes: boolean;
  includeActivities: boolean;
  includeDueDiligence: boolean;
  stages?: DealStage[];
}

// ============================================================================
// Pipeline Statistics
// ============================================================================

export interface PipelineStats {
  totalDeals: number;
  totalValue: number;
  weightedValue: number;
  averageProbability: number;
  averageDealSize: number;
  dealsPerStage: Record<DealStage, number>;
  valuePerStage: Record<DealStage, number>;
  conversionRate: number;
  averageTimeInPipeline: number;
  overdueDeals: number;
}

// ============================================================================
// Quick Actions
// ============================================================================

export type QuickActionType =
  | 'schedule_meeting'
  | 'add_note'
  | 'assign'
  | 'change_priority'
  | 'add_tag'
  | 'move_stage'
  | 'archive';

export interface QuickAction {
  type: QuickActionType;
  label: string;
  icon: string;
  shortcut?: string;
}

// ============================================================================
// Drag and Drop Types
// ============================================================================

export interface DragItem {
  id: string;
  type: 'deal';
  deal: Deal;
  sourceStage: DealStage;
}

export interface DropResult {
  dealId: string;
  sourceStage: DealStage;
  targetStage: DealStage;
  targetIndex: number;
}
