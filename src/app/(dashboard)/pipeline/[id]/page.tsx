'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Calendar,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  XCircle,
  Edit,
  Paperclip,
  ExternalLink,
  Globe,
  BarChart3,
  Activity,
  MoreHorizontal,
  LinkIcon,
  Loader2,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { Tooltip } from '@/components/ui/Tooltip';
import { trpc } from '@/lib/trpc/client';
import { cn, formatLargeNumber, formatDate, formatRelativeTime } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TargetAssignee {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface TargetContact {
  id: string;
  name: string;
  title: string;
  email?: string;
  phone?: string;
}

interface DueDiligenceItem {
  id: string;
  category: string;
  item: string;
  status: 'pending' | 'in_progress' | 'completed' | 'flagged';
  assignee?: string;
  dueDate?: Date;
}

interface TargetDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: Date;
  uploadedBy: string;
}

interface TargetActivity {
  id: string;
  type: 'stage_change' | 'note_added' | 'document_uploaded' | 'meeting_scheduled' | 'score_updated';
  description: string;
  user: string;
  timestamp: Date;
}

type PipelineStage =
  | 'sourcing'
  | 'initial_screening'
  | 'deep_evaluation'
  | 'negotiation'
  | 'execution'
  | 'closed_passed';

interface TargetDetails {
  id: string;
  name: string;
  logoUrl?: string;
  industry: string;
  subIndustry?: string;
  description?: string;
  headquarters?: string;
  website?: string;
  foundedYear?: number;
  employeeCount?: number;
  stage: PipelineStage;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  source?: 'inbound' | 'referral' | 'research' | 'banker';
  enterpriseValue: number;
  equityValue?: number;
  revenue?: number;
  revenueGrowth?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  grossMargin?: number;
  netIncome?: number;
  totalDebt?: number;
  cashPosition?: number;
  evaluationScore: number;
  managementScore?: number;
  marketScore?: number;
  financialScore?: number;
  operationalScore?: number;
  riskScore?: number;
  daysInStage: number;
  assignee?: TargetAssignee;
  associatedSpac?: {
    id: string;
    name: string;
    ticker: string;
  };
  tags?: string[];
  investmentHighlights?: string[];
  keyRisks?: string[];
  keyContacts?: TargetContact[];
  dueDiligence?: DueDiligenceItem[];
  documents?: TargetDocument[];
  activities?: TargetActivity[];
  createdAt: Date;
  updatedAt: Date;
}

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

// Calculate days in stage from dates
function calculateDaysInStage(updatedAt: Date | string | null): number {
  if (!updatedAt) {
    return 0;
  }
  const date = new Date(updatedAt);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Transform database target to UI TargetDetails format
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformDbTargetToDetails(dbTarget: any): TargetDetails {
  return {
    id: dbTarget.id,
    name: dbTarget.name,
    industry: dbTarget.industry || 'Unknown',
    subIndustry: dbTarget.sector || undefined,
    description: dbTarget.description || undefined,
    headquarters: dbTarget.headquarters || undefined,
    website: dbTarget.website || undefined,
    foundedYear: dbTarget.foundedYear || undefined,
    employeeCount: dbTarget.employeeCount || undefined,
    stage: mapStatusToStage(dbTarget.status),
    priority: mapPriorityToString(dbTarget.priority),
    source: 'research', // Default - not in DB
    enterpriseValue: dbTarget.enterpriseValue || 0,
    equityValue: dbTarget.equityValue || undefined,
    revenue: dbTarget.revenue || undefined,
    revenueGrowth: undefined, // Not directly in DB
    ebitda: dbTarget.ebitda || undefined,
    ebitdaMargin: dbTarget.ebitda && dbTarget.revenue
      ? Math.round((dbTarget.ebitda / dbTarget.revenue) * 100)
      : undefined,
    evaluationScore: dbTarget.overallScore ? Math.round(dbTarget.overallScore * 10) : 50,
    managementScore: dbTarget.managementScore ? dbTarget.managementScore * 10 : undefined,
    marketScore: dbTarget.marketScore ? dbTarget.marketScore * 10 : undefined,
    financialScore: dbTarget.financialScore ? dbTarget.financialScore * 10 : undefined,
    operationalScore: dbTarget.operationalScore ? dbTarget.operationalScore * 10 : undefined,
    riskScore: dbTarget.riskScore ? dbTarget.riskScore * 10 : undefined,
    daysInStage: calculateDaysInStage(dbTarget.updatedAt),
    assignee: undefined, // Would need user assignment system
    associatedSpac: dbTarget.spac ? {
      id: dbTarget.spac.id,
      name: dbTarget.spac.name,
      ticker: dbTarget.spac.ticker || '',
    } : undefined,
    tags: dbTarget.tags || [],
    investmentHighlights: dbTarget.keyOpportunities || [],
    keyRisks: dbTarget.keyRisks || [],
    keyContacts: dbTarget.contacts?.map((c: { contact: { id: string; name: string; title?: string; email?: string; phone?: string } }) => ({
      id: c.contact.id,
      name: c.contact.name,
      title: c.contact.title || '',
      email: c.contact.email,
      phone: c.contact.phone,
    })) || [],
    documents: dbTarget.documents?.map((d: { id: string; name: string; type?: string; fileSize?: number; createdAt: string }) => ({
      id: d.id,
      name: d.name,
      type: d.type || 'Unknown',
      size: d.fileSize ? `${Math.round(d.fileSize / 1024)} KB` : 'Unknown',
      uploadedAt: new Date(d.createdAt),
      uploadedBy: 'System',
    })) || [],
    activities: [], // Would need activity log system
    createdAt: new Date(dbTarget.createdAt),
    updatedAt: new Date(dbTarget.updatedAt),
  };
}

// ============================================================================
// Legacy Mock Data (kept for reference - to be deleted)
// ============================================================================

const _MOCK_TARGET_DEPRECATED: TargetDetails = {
  id: '7',
  name: 'OrthoInnovate',
  industry: 'Medical Devices',
  subIndustry: 'Orthopedic Devices',
  description: 'OrthoInnovate is a leading developer of minimally invasive orthopedic surgical devices, specializing in spine and joint replacement technologies. The company has built a strong reputation for innovation, with over 45 patents and a track record of successful product launches. Their flagship products include the SpineGuide navigation system and the FlexJoint total knee replacement system.',
  headquarters: 'Denver, CO',
  website: 'https://www.orthoinnovate.com',
  foundedYear: 2012,
  employeeCount: 380,
  stage: 'deep_evaluation',
  priority: 'high',
  source: 'banker',
  enterpriseValue: 720000000,
  equityValue: 750000000,
  revenue: 140000000,
  revenueGrowth: 25,
  ebitda: 35000000,
  ebitdaMargin: 25,
  grossMargin: 68,
  netIncome: 22000000,
  totalDebt: 30000000,
  cashPosition: 60000000,
  evaluationScore: 82,
  managementScore: 85,
  marketScore: 78,
  financialScore: 84,
  operationalScore: 80,
  riskScore: 75,
  daysInStage: 28,
  assignee: { id: '1', name: 'Sarah Chen', role: 'Managing Director' },
  associatedSpac: {
    id: 'spac-1',
    name: 'Soren Acquisition Corporation',
    ticker: 'SORN',
  },
  tags: ['orthopedic', 'surgical', 'high-margin', 'strong-ip'],
  investmentHighlights: [
    'Market leader in minimally invasive spine surgery with 15% market share',
    '25% revenue CAGR over past 3 years with strong visibility',
    'Strong IP portfolio with 45+ patents and 12 pending applications',
    'Experienced management team with average 20+ years industry experience',
    'Attractive margin profile with path to 30%+ EBITDA margins',
  ],
  keyRisks: [
    'Reimbursement pressure from payors could impact pricing',
    'Competition from larger device companies (Medtronic, J&J)',
    'Regulatory pathway for new products requires FDA clearance',
    'Key man risk with CEO and CTO founders',
  ],
  keyContacts: [
    { id: '1', name: 'Dr. James Wilson', title: 'CEO & Co-Founder', email: 'jwilson@orthoinnovate.com', phone: '+1 303-555-0101' },
    { id: '2', name: 'Michael Chen', title: 'CFO', email: 'mchen@orthoinnovate.com', phone: '+1 303-555-0102' },
    { id: '3', name: 'Dr. Sarah Kim', title: 'CTO & Co-Founder', email: 'skim@orthoinnovate.com', phone: '+1 303-555-0103' },
  ],
  dueDiligence: [
    { id: '1', category: 'Financial', item: 'Quality of Earnings analysis', status: 'completed', assignee: 'Sarah Chen' },
    { id: '2', category: 'Financial', item: 'Working capital analysis', status: 'completed', assignee: 'Michael Torres' },
    { id: '3', category: 'Financial', item: 'Customer contract review', status: 'in_progress', assignee: 'Emily Watson' },
    { id: '4', category: 'Legal', item: 'IP portfolio assessment', status: 'completed', assignee: 'External Counsel' },
    { id: '5', category: 'Legal', item: 'Litigation review', status: 'in_progress', assignee: 'External Counsel' },
    { id: '6', category: 'Operations', item: 'Manufacturing site visits', status: 'completed', assignee: 'David Park' },
    { id: '7', category: 'Operations', item: 'Supply chain analysis', status: 'in_progress', assignee: 'David Park' },
    { id: '8', category: 'Commercial', item: 'Customer reference calls', status: 'flagged', assignee: 'Jessica Liu', dueDate: new Date('2024-02-01') },
    { id: '9', category: 'HR', item: 'Management interviews', status: 'completed', assignee: 'Sarah Chen' },
    { id: '10', category: 'HR', item: 'Key employee retention analysis', status: 'pending', assignee: 'Emily Watson' },
  ],
  documents: [
    { id: '1', name: 'Confidential Information Memorandum.pdf', type: 'PDF', size: '12.4 MB', uploadedAt: new Date('2024-01-05'), uploadedBy: 'Goldman Sachs' },
    { id: '2', name: 'Management Presentation - January 2024.pptx', type: 'PPTX', size: '8.1 MB', uploadedAt: new Date('2024-01-12'), uploadedBy: 'OrthoInnovate' },
    { id: '3', name: 'Audited Financial Statements FY2023.pdf', type: 'PDF', size: '4.2 MB', uploadedAt: new Date('2024-01-15'), uploadedBy: 'OrthoInnovate' },
    { id: '4', name: 'Quality of Earnings Report - Draft.pdf', type: 'PDF', size: '3.8 MB', uploadedAt: new Date('2024-01-20'), uploadedBy: 'KPMG' },
    { id: '5', name: 'IP Portfolio Summary.xlsx', type: 'XLSX', size: '1.2 MB', uploadedAt: new Date('2024-01-18'), uploadedBy: 'Fish & Richardson' },
    { id: '6', name: 'Customer Contract Summary.xlsx', type: 'XLSX', size: '890 KB', uploadedAt: new Date('2024-01-22'), uploadedBy: 'Emily Watson' },
  ],
  activities: [
    { id: '1', type: 'document_uploaded', description: 'Uploaded Customer Contract Summary', user: 'Emily Watson', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { id: '2', type: 'meeting_scheduled', description: 'Scheduled site visit to Denver facility for Jan 28', user: 'David Park', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: '3', type: 'score_updated', description: 'Updated evaluation score from 78 to 82', user: 'Sarah Chen', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { id: '4', type: 'stage_change', description: 'Moved from Initial Screening to Deep Evaluation', user: 'Sarah Chen', timestamp: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) },
    { id: '5', type: 'note_added', description: 'Added management team assessment notes', user: 'Sarah Chen', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    { id: '6', type: 'document_uploaded', description: 'Uploaded Management Presentation', user: 'Michael Torres', timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
  ],
  createdAt: new Date('2023-12-20'),
  updatedAt: new Date('2024-01-24'),
};

// ============================================================================
// Helper Components
// ============================================================================

function ScoreBar({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100;
  const getColor = (p: number) => {
    if (p >= 80) {return 'bg-success-500';}
    if (p >= 60) {return 'bg-primary-500';}
    if (p >= 40) {return 'bg-warning-500';}
    return 'bg-danger-500';
  };

  return (
    <div className="flex items-center gap-3">
      <span className="w-24 text-sm text-slate-600">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-200">
        <div
          className={cn('h-full rounded-full transition-all', getColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-sm font-medium text-slate-900">{score}</span>
    </div>
  );
}

function MetricCard({ label, value, subValue, trend }: { label: string; value: string; subValue?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      {subValue && (
        <p className={cn(
          'mt-0.5 text-sm',
          trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-slate-500'
        )}>
          {trend === 'up' && '+'}
          {subValue}
        </p>
      )}
    </div>
  );
}

function ActivityTimeline({ activities }: { activities: TargetActivity[] }) {
  const getActivityIcon = (type: TargetActivity['type']) => {
    switch (type) {
      case 'stage_change': return ArrowRight;
      case 'note_added': return MessageSquare;
      case 'document_uploaded': return FileText;
      case 'meeting_scheduled': return Calendar;
      case 'score_updated': return BarChart3;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        return (
          <div key={activity.id} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                <Icon className="h-4 w-4 text-slate-500" />
              </div>
              {index < activities.length - 1 && (
                <div className="w-px flex-1 bg-slate-200 mt-2" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm text-slate-900">{activity.description}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                <span>{activity.user}</span>
                <span>-</span>
                <span>{formatRelativeTime(activity.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Stage Configuration
// ============================================================================

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string }> = {
  sourcing: { label: 'Sourcing', color: 'bg-slate-500' },
  initial_screening: { label: 'Initial Screening', color: 'bg-blue-500' },
  deep_evaluation: { label: 'Deep Evaluation', color: 'bg-indigo-500' },
  negotiation: { label: 'Negotiation', color: 'bg-purple-500' },
  execution: { label: 'Execution', color: 'bg-amber-500' },
  closed_passed: { label: 'Closed/Passed', color: 'bg-emerald-500' },
};

// ============================================================================
// Main Component
// ============================================================================

interface PageProps {
  params: { id: string };
}

export default function TargetDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'diligence' | 'documents' | 'activity'>('overview');

  // tRPC Query
  const {
    data: dbTarget,
    isLoading,
    error,
  } = trpc.target.getById.useQuery(
    { id: params.id },
    { enabled: !!params.id }
  );

  // tRPC Mutations
  const utils = trpc.useUtils();

  const updateStatusMutation = trpc.target.updateStatus.useMutation({
    onSuccess: () => {
      utils.target.getById.invalidate({ id: params.id });
    },
  });

  const deleteTargetMutation = trpc.target.delete.useMutation({
    onSuccess: () => {
      router.push('/pipeline');
    },
  });

  // Transform database target to UI format
  const target = useMemo(() => {
    if (!dbTarget) {
      return null;
    }
    return transformDbTargetToDetails(dbTarget);
  }, [dbTarget]);

  const handleAdvanceStage = useCallback(() => {
    if (!target) {
      return;
    }
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
      });
    }
  }, [target, updateStatusMutation]);

  const handleReject = useCallback(() => {
    if (!target) {
      return;
    }
    updateStatusMutation.mutate({
      id: target.id,
      status: 'PASSED',
    });
  }, [target, updateStatusMutation]);

  const handleArchive = useCallback(() => {
    if (!target) {
      return;
    }
    deleteTargetMutation.mutate({ id: target.id });
  }, [target, deleteTargetMutation]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading target details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="mt-4 text-red-600">Error loading target: {error.message}</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/pipeline')}>
          Back to Pipeline
        </Button>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <Building2 className="h-12 w-12 text-slate-300" />
        <p className="mt-4 text-slate-500">Target not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/pipeline')}>
          Back to Pipeline
        </Button>
      </div>
    );
  }

  const stageConfig = STAGE_CONFIG[target.stage];
  const canAdvance = target.stage !== 'closed_passed' && target.stage !== 'execution';
  const canReject = target.stage !== 'closed_passed';

  // Calculate due diligence progress
  const ddProgress = target.dueDiligence ? {
    total: target.dueDiligence.length,
    completed: target.dueDiligence.filter((i) => i.status === 'completed').length,
    inProgress: target.dueDiligence.filter((i) => i.status === 'in_progress').length,
    flagged: target.dueDiligence.filter((i) => i.status === 'flagged').length,
  } : null;

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Back */}
      <div className="flex items-center gap-4">
        <Link
          href="/pipeline"
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className={cn(
            'flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl',
            'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600'
          )}>
            {target.logoUrl ? (
              <img
                src={target.logoUrl}
                alt={target.name}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8" />
            )}
          </div>

          {/* Title & Meta */}
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{target.name}</h1>
              <Badge className={cn('text-white', stageConfig.color)}>
                {stageConfig.label}
              </Badge>
              {target.priority && target.priority !== 'medium' && (
                <Badge variant={target.priority === 'critical' ? 'danger' : 'warning'}>
                  {target.priority.charAt(0).toUpperCase() + target.priority.slice(1)} Priority
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="font-medium text-slate-700">{target.industry}</span>
              {target.subIndustry && (
                <>
                  <span>/</span>
                  <span>{target.subIndustry}</span>
                </>
              )}
              {target.headquarters && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {target.headquarters}
                </span>
              )}
              {target.website && (
                <a
                  href={target.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {target.associatedSpac && (
              <div className="mt-2 flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-500">Associated SPAC:</span>
                <Link
                  href={`/spacs/${target.associatedSpac.id}`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  {target.associatedSpac.name} ({target.associatedSpac.ticker})
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Dropdown
            trigger={
              <Button variant="secondary">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
            align="right"
          >
            <DropdownItem>Export to PDF</DropdownItem>
            <DropdownItem>Share</DropdownItem>
            <DropdownDivider />
            <DropdownItem variant="danger" onClick={handleArchive}>Archive</DropdownItem>
          </Dropdown>
          {canReject && (
            <Button variant="danger" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          )}
          {canAdvance && (
            <Button variant="primary" onClick={handleAdvanceStage}>
              Advance Stage
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Enterprise Value"
          value={formatLargeNumber(target.enterpriseValue)}
        />
        <MetricCard
          label="LTM Revenue"
          value={target.revenue ? formatLargeNumber(target.revenue) : 'N/A'}
          subValue={target.revenueGrowth ? `${target.revenueGrowth}% YoY` : undefined}
          trend="up"
        />
        <MetricCard
          label="LTM EBITDA"
          value={target.ebitda ? formatLargeNumber(target.ebitda) : 'N/A'}
          subValue={target.ebitdaMargin ? `${target.ebitdaMargin}% margin` : undefined}
        />
        <MetricCard
          label="AI Score"
          value={`${target.evaluationScore}/100`}
        />
        <MetricCard
          label="Days in Stage"
          value={`${target.daysInStage}`}
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1">
          {(['overview', 'financials', 'diligence', 'documents', 'activity'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === tab
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'diligence' && ddProgress && (
                <Badge variant="secondary" size="sm">
                  {ddProgress.completed}/{ddProgress.total}
                </Badge>
              )}
              {tab === 'documents' && target.documents && (
                <Badge variant="secondary" size="sm">
                  {target.documents.length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {activeTab === 'overview' && (
            <>
              {/* Description */}
              {target.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-500" />
                      Company Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed text-slate-700">{target.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Investment Highlights */}
              {target.investmentHighlights && target.investmentHighlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-success-700">
                      <CheckCircle2 className="h-4 w-4" />
                      Investment Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {target.investmentHighlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500" />
                          <span className="text-sm text-slate-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Key Risks */}
              {target.keyRisks && target.keyRisks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-warning-700">
                      <AlertCircle className="h-4 w-4" />
                      Key Risks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {target.keyRisks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-500" />
                          <span className="text-sm text-slate-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Evaluation Scores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-500" />
                    Evaluation Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <ScoreBar label="Overall" score={target.evaluationScore} />
                    {target.managementScore && <ScoreBar label="Management" score={target.managementScore} />}
                    {target.marketScore && <ScoreBar label="Market" score={target.marketScore} />}
                    {target.financialScore && <ScoreBar label="Financial" score={target.financialScore} />}
                    {target.operationalScore && <ScoreBar label="Operations" score={target.operationalScore} />}
                    {target.riskScore && <ScoreBar label="Risk" score={target.riskScore} />}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'financials' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <MetricCard label="Enterprise Value" value={formatLargeNumber(target.enterpriseValue)} />
                <MetricCard label="Equity Value" value={target.equityValue ? formatLargeNumber(target.equityValue) : 'N/A'} />
                <MetricCard label="Revenue (LTM)" value={target.revenue ? formatLargeNumber(target.revenue) : 'N/A'} subValue={target.revenueGrowth ? `${target.revenueGrowth}% growth` : undefined} trend="up" />
                <MetricCard label="EBITDA (LTM)" value={target.ebitda ? formatLargeNumber(target.ebitda) : 'N/A'} subValue={target.ebitdaMargin ? `${target.ebitdaMargin}% margin` : undefined} />
                <MetricCard label="Gross Margin" value={target.grossMargin ? `${target.grossMargin}%` : 'N/A'} />
                <MetricCard label="Net Income" value={target.netIncome ? formatLargeNumber(target.netIncome) : 'N/A'} />
                <MetricCard label="Total Debt" value={target.totalDebt ? formatLargeNumber(target.totalDebt) : 'N/A'} />
                <MetricCard label="Cash Position" value={target.cashPosition ? formatLargeNumber(target.cashPosition) : 'N/A'} />
              </div>
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">Detailed financial charts and projections would be displayed here</p>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'diligence' && target.dueDiligence && (
            <>
              {/* Progress */}
              {ddProgress && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600">Progress</span>
                      <span className="text-sm font-medium">{ddProgress.completed}/{ddProgress.total} completed</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-primary-500 transition-all"
                        style={{ width: `${(ddProgress.completed / ddProgress.total) * 100}%` }}
                      />
                    </div>
                    {ddProgress.flagged > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 text-sm text-danger-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>{ddProgress.flagged} items flagged for review</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Due Diligence Table */}
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Item</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Category</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Assignee</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {target.dueDiligence.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm text-slate-900">{item.item}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{item.category}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                item.status === 'completed' ? 'success' :
                                item.status === 'in_progress' ? 'primary' :
                                item.status === 'flagged' ? 'danger' : 'secondary'
                              }
                              size="sm"
                            >
                              {item.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-500">{item.assignee || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === 'documents' && target.documents && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Documents ({target.documents.length})</CardTitle>
                <Button variant="secondary" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Upload
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-200">
                  {target.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                          <FileText className="h-5 w-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.size} - Uploaded by {doc.uploadedBy} on {formatDate(doc.uploadedAt)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && target.activities && (
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={target.activities} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Days in Stage</span>
                  <span className="font-medium">{target.daysInStage} days</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Source</span>
                  <span className="font-medium capitalize">{target.source || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Founded</span>
                  <span className="font-medium">{target.foundedYear || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Employees</span>
                  <span className="font-medium">{target.employeeCount?.toLocaleString() || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Last Updated</span>
                  <span className="font-medium">{formatRelativeTime(target.updatedAt)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Deal Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {target.assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar name={target.assignee.name} src={target.assignee.avatar} size="md" />
                  <div>
                    <p className="font-medium text-slate-900">{target.assignee.name}</p>
                    <p className="text-sm text-slate-500">{target.assignee.role || 'Deal Lead'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No team assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Key Contacts */}
          {target.keyContacts && target.keyContacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500" />
                  Key Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {target.keyContacts.map((contact) => (
                    <div key={contact.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                        <p className="text-xs text-slate-500">{contact.title}</p>
                      </div>
                      <div className="flex gap-1">
                        {contact.email && (
                          <Tooltip content={contact.email}>
                            <a
                              href={`mailto:${contact.email}`}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MessageSquare className="h-4 w-4" />
                            </a>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tags */}
          {target.tags && target.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {target.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
