'use client';

import { useState, useCallback, useMemo } from 'react';

import {
  Plus,
  Filter,
  Download,
  LayoutGrid,
  List,
  ChevronDown,
  BarChart3,
} from 'lucide-react';

import { AddTargetForm, type NewTargetData } from '@/components/pipeline/AddTargetForm';
import { KanbanBoard, DEFAULT_COLUMNS } from '@/components/pipeline/KanbanBoard';
import { PipelineFilters, DEFAULT_FILTERS, type PipelineFiltersState } from '@/components/pipeline/PipelineFilters';
import { PipelineStats, PipelineStatsBar } from '@/components/pipeline/PipelineStats';
import { TargetCardCompact, type Target, type PipelineStage, type QuickAction } from '@/components/pipeline/TargetCard';
import { TargetDetailModal, type TargetDetails } from '@/components/pipeline/TargetDetailModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

// ============================================================================
// Mock Data - Healthcare Targets for Soren Acquisition Corporation
// ============================================================================

const MOCK_TEAM_MEMBERS: { id: string; name: string; avatar: string | undefined; role: string }[] = [
  { id: '1', name: 'Sarah Chen', avatar: undefined, role: 'Managing Director' },
  { id: '2', name: 'Michael Torres', avatar: undefined, role: 'Vice President' },
  { id: '3', name: 'Emily Watson', avatar: undefined, role: 'Associate' },
  { id: '4', name: 'David Park', avatar: undefined, role: 'Analyst' },
  { id: '5', name: 'Jessica Liu', avatar: undefined, role: 'Principal' },
];

const MOCK_TARGETS: Target[] = [
  // Sourcing Stage
  {
    id: '1',
    name: 'MedCore Analytics',
    industry: 'Healthcare IT',
    subIndustry: 'Healthcare Analytics',
    enterpriseValue: 450000000,
    evaluationScore: 72,
    daysInStage: 5,
    stage: 'sourcing',
    priority: 'medium',
    source: 'research',
    assignee: MOCK_TEAM_MEMBERS[3],
    description: 'Leading provider of AI-powered healthcare analytics solutions for hospital systems.',
    headquarters: 'Boston, MA',
    tags: ['saas', 'ai-driven', 'hospital-systems'],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-23'),
  },
  {
    id: '2',
    name: 'BioNexus Labs',
    industry: 'Biotechnology',
    subIndustry: 'Gene Therapy',
    enterpriseValue: 780000000,
    evaluationScore: 68,
    daysInStage: 3,
    stage: 'sourcing',
    priority: 'high',
    source: 'banker',
    assignee: MOCK_TEAM_MEMBERS[2],
    description: 'Innovative gene therapy company focused on rare genetic disorders.',
    headquarters: 'San Diego, CA',
    tags: ['gene-therapy', 'rare-disease', 'clinical-stage'],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-24'),
  },
  {
    id: '3',
    name: 'TeleDoc Plus',
    industry: 'Telehealth',
    subIndustry: 'Virtual Care Platform',
    enterpriseValue: 320000000,
    evaluationScore: 65,
    daysInStage: 8,
    stage: 'sourcing',
    source: 'inbound',
    description: 'Comprehensive telehealth platform serving rural healthcare communities.',
    headquarters: 'Nashville, TN',
    tags: ['telehealth', 'rural-health', 'b2b'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-22'),
  },

  // Initial Screening Stage
  {
    id: '4',
    name: 'Precision Diagnostics Corp',
    industry: 'Diagnostics',
    subIndustry: 'Molecular Diagnostics',
    enterpriseValue: 620000000,
    evaluationScore: 78,
    daysInStage: 12,
    stage: 'initial_screening',
    priority: 'high',
    source: 'referral',
    assignee: MOCK_TEAM_MEMBERS[1],
    description: 'Next-generation molecular diagnostics for oncology and infectious diseases.',
    headquarters: 'Cambridge, MA',
    revenue: 95000000,
    ebitda: 18000000,
    employeeCount: 280,
    tags: ['diagnostics', 'oncology', 'high-growth'],
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '5',
    name: 'HealthBridge Systems',
    industry: 'Healthcare IT',
    subIndustry: 'Interoperability',
    enterpriseValue: 380000000,
    evaluationScore: 74,
    daysInStage: 18,
    stage: 'initial_screening',
    source: 'research',
    assignee: MOCK_TEAM_MEMBERS[2],
    description: 'Healthcare data interoperability platform connecting EHR systems.',
    headquarters: 'Chicago, IL',
    revenue: 52000000,
    tags: ['interoperability', 'data-platform', 'ehr-integration'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: '6',
    name: 'CardioTech Devices',
    industry: 'Medical Devices',
    subIndustry: 'Cardiovascular',
    enterpriseValue: 890000000,
    evaluationScore: 71,
    daysInStage: 14,
    stage: 'initial_screening',
    priority: 'medium',
    source: 'banker',
    assignee: MOCK_TEAM_MEMBERS[4],
    description: 'Innovative cardiovascular monitoring and intervention devices.',
    headquarters: 'Minneapolis, MN',
    revenue: 120000000,
    employeeCount: 420,
    tags: ['medical-devices', 'cardiovascular', 'fda-cleared'],
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-19'),
  },

  // Deep Evaluation Stage
  {
    id: '7',
    name: 'OrthoInnovate',
    industry: 'Medical Devices',
    subIndustry: 'Orthopedic Devices',
    enterpriseValue: 720000000,
    evaluationScore: 82,
    daysInStage: 28,
    stage: 'deep_evaluation',
    priority: 'high',
    source: 'banker',
    assignee: MOCK_TEAM_MEMBERS[0],
    description: 'Leading developer of minimally invasive orthopedic surgical devices.',
    headquarters: 'Denver, CO',
    revenue: 140000000,
    revenueGrowth: 25,
    ebitda: 35000000,
    ebitdaMargin: 25,
    employeeCount: 380,
    tags: ['orthopedic', 'surgical', 'high-margin'],
    investmentHighlights: [
      'Market leader in minimally invasive spine surgery',
      '25% revenue CAGR over past 3 years',
      'Strong IP portfolio with 45+ patents',
      'Experienced management team',
    ],
    keyRisks: [
      'Reimbursement pressure from payors',
      'Competition from larger device companies',
      'Regulatory pathway for new products',
    ],
    createdAt: new Date('2023-12-20'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: '8',
    name: 'NeuroPath Therapeutics',
    industry: 'Pharmaceuticals',
    subIndustry: 'CNS Therapeutics',
    enterpriseValue: 1200000000,
    evaluationScore: 79,
    daysInStage: 35,
    stage: 'deep_evaluation',
    priority: 'critical',
    source: 'referral',
    assignee: MOCK_TEAM_MEMBERS[0],
    description: 'Clinical-stage biotech developing novel treatments for neurological disorders.',
    headquarters: 'San Francisco, CA',
    revenue: 0,
    employeeCount: 150,
    tags: ['cns', 'clinical-stage', 'neurological'],
    investmentHighlights: [
      'Lead asset in Phase 3 trials',
      'Breakthrough therapy designation from FDA',
      'Strong clinical data profile',
      'Partnership potential with big pharma',
    ],
    keyRisks: [
      'Clinical trial risk',
      'No current revenue',
      'Capital-intensive operations',
    ],
    createdAt: new Date('2023-12-10'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: '9',
    name: 'RevCycle Pro',
    industry: 'Healthcare IT',
    subIndustry: 'Revenue Cycle Management',
    enterpriseValue: 550000000,
    evaluationScore: 85,
    daysInStage: 22,
    stage: 'deep_evaluation',
    priority: 'high',
    source: 'research',
    assignee: MOCK_TEAM_MEMBERS[1],
    description: 'AI-powered revenue cycle management solution for healthcare providers.',
    headquarters: 'Atlanta, GA',
    revenue: 85000000,
    revenueGrowth: 35,
    ebitda: 22000000,
    ebitdaMargin: 26,
    employeeCount: 320,
    tags: ['rcm', 'ai-powered', 'saas', 'recurring-revenue'],
    investmentHighlights: [
      '95% recurring revenue base',
      'Net revenue retention of 115%',
      'AI differentiation driving win rates',
      'Large TAM with low penetration',
    ],
    createdAt: new Date('2023-12-28'),
    updatedAt: new Date('2024-01-23'),
  },

  // Negotiation Stage
  {
    id: '10',
    name: 'BehavioralHealth360',
    industry: 'Healthcare Services',
    subIndustry: 'Behavioral Health',
    enterpriseValue: 680000000,
    evaluationScore: 88,
    daysInStage: 18,
    stage: 'negotiation',
    priority: 'critical',
    source: 'banker',
    assignee: MOCK_TEAM_MEMBERS[0],
    description: 'National behavioral health services platform with 45 outpatient locations.',
    headquarters: 'Phoenix, AZ',
    revenue: 180000000,
    revenueGrowth: 28,
    ebitda: 45000000,
    ebitdaMargin: 25,
    employeeCount: 850,
    tags: ['behavioral-health', 'multi-site', 'organic-growth'],
    investmentHighlights: [
      'Leading platform in fragmented market',
      'Strong same-store growth of 12%',
      'Experienced M&A playbook',
      'Attractive unit economics',
    ],
    keyRisks: [
      'Labor market tightness for clinicians',
      'State-level regulatory complexity',
      'Integration risk from acquisitions',
    ],
    createdAt: new Date('2023-11-15'),
    updatedAt: new Date('2024-01-24'),
  },
  {
    id: '11',
    name: 'PharmaLink Solutions',
    industry: 'Healthcare IT',
    subIndustry: 'Pharmacy Technology',
    enterpriseValue: 420000000,
    evaluationScore: 81,
    daysInStage: 25,
    stage: 'negotiation',
    priority: 'high',
    source: 'referral',
    assignee: MOCK_TEAM_MEMBERS[4],
    description: 'Specialty pharmacy management platform connecting providers and pharmacies.',
    headquarters: 'Philadelphia, PA',
    revenue: 72000000,
    ebitda: 18000000,
    employeeCount: 195,
    tags: ['pharmacy', 'specialty', 'platform'],
    createdAt: new Date('2023-11-28'),
    updatedAt: new Date('2024-01-22'),
  },

  // Execution Stage
  {
    id: '12',
    name: 'VitalSign Medical',
    industry: 'Medical Devices',
    subIndustry: 'Patient Monitoring',
    enterpriseValue: 950000000,
    evaluationScore: 91,
    daysInStage: 42,
    stage: 'execution',
    priority: 'critical',
    source: 'banker',
    assignee: MOCK_TEAM_MEMBERS[0],
    description: 'Leading remote patient monitoring platform for chronic disease management.',
    headquarters: 'Austin, TX',
    revenue: 165000000,
    revenueGrowth: 40,
    ebitda: 42000000,
    ebitdaMargin: 25,
    grossMargin: 72,
    employeeCount: 480,
    tags: ['rpm', 'chronic-care', 'high-growth', 'platform'],
    investmentHighlights: [
      'Category leader in remote patient monitoring',
      '40% revenue growth with improving margins',
      'Strong net promoter score of 75+',
      'Significant expansion opportunities',
    ],
    createdAt: new Date('2023-10-05'),
    updatedAt: new Date('2024-01-24'),
  },

  // Closed/Passed Stage
  {
    id: '13',
    name: 'GenomeFirst Labs',
    industry: 'Diagnostics',
    subIndustry: 'Genetic Testing',
    enterpriseValue: 580000000,
    evaluationScore: 76,
    daysInStage: 90,
    stage: 'closed_passed',
    source: 'research',
    description: 'Consumer and clinical genetic testing company.',
    headquarters: 'Seattle, WA',
    tags: ['genetic-testing', 'dtc', 'passed'],
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2023-11-14'),
  },
  {
    id: '14',
    name: 'SeniorCare Connect',
    industry: 'Healthcare Services',
    subIndustry: 'Home Health',
    enterpriseValue: 340000000,
    evaluationScore: 69,
    daysInStage: 75,
    stage: 'closed_passed',
    source: 'inbound',
    description: 'Home health services for senior population.',
    headquarters: 'Tampa, FL',
    tags: ['home-health', 'seniors', 'passed'],
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-11-15'),
  },

  // Additional Sourcing
  {
    id: '15',
    name: 'ImmunoGenix',
    industry: 'Biotechnology',
    subIndustry: 'Immunology',
    enterpriseValue: 650000000,
    evaluationScore: 70,
    daysInStage: 6,
    stage: 'sourcing',
    priority: 'medium',
    source: 'banker',
    description: 'Developing next-generation immunotherapy treatments.',
    headquarters: 'New Haven, CT',
    tags: ['immunotherapy', 'oncology', 'clinical-stage'],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-23'),
  },
  {
    id: '16',
    name: 'SurgicalAI',
    industry: 'Healthcare IT',
    subIndustry: 'Surgical Planning',
    enterpriseValue: 280000000,
    evaluationScore: 73,
    daysInStage: 4,
    stage: 'sourcing',
    source: 'research',
    assignee: MOCK_TEAM_MEMBERS[3],
    description: 'AI-assisted surgical planning and navigation software.',
    headquarters: 'Pittsburgh, PA',
    tags: ['ai', 'surgical', 'software'],
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-24'),
  },

  // Additional Initial Screening
  {
    id: '17',
    name: 'WoundCare Innovations',
    industry: 'Medical Devices',
    subIndustry: 'Wound Care',
    enterpriseValue: 410000000,
    evaluationScore: 75,
    daysInStage: 16,
    stage: 'initial_screening',
    source: 'referral',
    assignee: MOCK_TEAM_MEMBERS[2],
    description: 'Advanced wound care products and biologics.',
    headquarters: 'Columbus, OH',
    revenue: 68000000,
    employeeCount: 210,
    tags: ['wound-care', 'biologics', 'hospital-sales'],
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-19'),
  },

  // Additional Deep Evaluation
  {
    id: '18',
    name: 'LabConnect Network',
    industry: 'Healthcare Services',
    subIndustry: 'Laboratory Services',
    enterpriseValue: 520000000,
    evaluationScore: 77,
    daysInStage: 30,
    stage: 'deep_evaluation',
    priority: 'medium',
    source: 'banker',
    assignee: MOCK_TEAM_MEMBERS[1],
    description: 'Regional clinical laboratory network with specialty testing capabilities.',
    headquarters: 'Dallas, TX',
    revenue: 110000000,
    ebitda: 28000000,
    employeeCount: 450,
    tags: ['lab-services', 'specialty-testing', 'regional'],
    createdAt: new Date('2023-12-15'),
    updatedAt: new Date('2024-01-20'),
  },
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
  // State
  const [targets, setTargets] = useState<Target[]>(MOCK_TARGETS);
  const [filters, setFilters] = useState<PipelineFiltersState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [addFormInitialStage, setAddFormInitialStage] = useState<PipelineStage>('sourcing');
  const [sortBy, setSortBy] = useState<'name' | 'value' | 'score' | 'days'>('value');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    (targetId: string, fromStage: PipelineStage, toStage: PipelineStage) => {
      setTargets((prev) =>
        prev.map((target) =>
          target.id === targetId
            ? { ...target, stage: toStage, daysInStage: 0, updatedAt: new Date() }
            : target
        )
      );
    },
    []
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
          // TODO: Open edit form
          break;
        case 'move':
          // TODO: Open stage picker
          break;
        case 'archive':
          setTargets((prev) =>
            prev.map((t) =>
              t.id === target.id ? { ...t, stage: 'closed_passed' as PipelineStage } : t
            )
          );
          break;
      }
    },
    [handleTargetClick]
  );

  const handleAddTarget = useCallback((stage?: PipelineStage) => {
    setAddFormInitialStage(stage || 'sourcing');
    setIsAddFormOpen(true);
  }, []);

  const handleSubmitNewTarget = useCallback((data: NewTargetData) => {
    const newTarget: Target = {
      id: `new-${Date.now()}`,
      name: data.name,
      industry: data.industry,
      subIndustry: data.subIndustry,
      enterpriseValue: data.estimatedValuation,
      evaluationScore: 50, // Initial score
      daysInStage: 0,
      stage: data.stage,
      source: data.source,
      description: data.description,
      headquarters: data.headquarters,
      tags: data.tags,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTargets((prev) => [...prev, newTarget]);
    setIsAddFormOpen(false);
  }, []);

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
      handleTargetMove(target.id, target.stage, nextStage);
      setIsDetailModalOpen(false);
    }
  }, [handleTargetMove]);

  const handleRejectTarget = useCallback((target: TargetDetails) => {
    handleTargetMove(target.id, target.stage, 'closed_passed');
    setIsDetailModalOpen(false);
  }, [handleTargetMove]);

  const handleSort = useCallback((newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(newSortBy);
      setSortDirection('desc');
    }
  }, [sortBy]);

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
              <Button variant="secondary" size="md">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            }
            align="right"
          >
            <DropdownItem>Export as CSV</DropdownItem>
            <DropdownItem>Export as Excel</DropdownItem>
            <DropdownItem>Export as PDF</DropdownItem>
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
          availableAssignees={MOCK_TEAM_MEMBERS}
        />
      )}

      {/* Stats Panel */}
      {showStats && (
        <PipelineStats targets={filteredTargets} />
      )}

      {/* Main Content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          targets={filteredTargets}
          columns={DEFAULT_COLUMNS}
          onTargetMove={handleTargetMove}
          onTargetClick={handleTargetClick}
          onTargetQuickAction={handleQuickAction}
          onAddTarget={handleAddTarget}
        />
      ) : (
        <div className="space-y-3">
          {/* List Header */}
          <div className="flex items-center gap-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
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
        onEdit={() => { /* TODO: Implement edit target */ }}
      />

      {/* Add Target Form */}
      <AddTargetForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSubmit={handleSubmitNewTarget}
        initialStage={addFormInitialStage}
      />
    </div>
  );
}
