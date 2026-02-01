'use client';

import { useState } from 'react';
import {
  X,
  Building2,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  XCircle,
  Edit,
  Paperclip,
  ExternalLink,
  User,
  Phone,
  Mail,
  Globe,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatLargeNumber, formatDate, formatRelativeTime } from '@/lib/utils';
import type { Target, PipelineStage, TargetAssignee } from './TargetCard';

// ============================================================================
// Types
// ============================================================================

export interface TargetDetails extends Target {
  description?: string;
  headquarters?: string;
  website?: string;
  foundedYear?: number;
  employeeCount?: number;
  revenue?: number;
  revenueGrowth?: number;
  ebitda?: number;
  ebitdaMargin?: number;
  grossMargin?: number;
  netIncome?: number;
  totalDebt?: number;
  cashPosition?: number;
  keyContacts?: TargetContact[];
  dueDiligence?: DueDiligenceItem[];
  documents?: TargetDocument[];
  notes?: TargetNote[];
  activities?: TargetActivity[];
  investmentHighlights?: string[];
  keyRisks?: string[];
  competitivePosition?: string;
  managementTeam?: string;
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

interface TargetNote {
  id: string;
  content: string;
  author: TargetAssignee;
  createdAt: Date;
  isPinned?: boolean;
}

interface TargetActivity {
  id: string;
  type: 'stage_change' | 'note_added' | 'document_uploaded' | 'meeting_scheduled' | 'score_updated';
  description: string;
  user: string;
  timestamp: Date;
}

interface TargetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: TargetDetails | null;
  onAdvance?: (target: TargetDetails) => void;
  onReject?: (target: TargetDetails) => void;
  onEdit?: (target: TargetDetails) => void;
}

// ============================================================================
// Sub-components
// ============================================================================

function SectionTitle({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </h3>
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

function ScoreBar({ label, score, maxScore = 100 }: { label: string; score: number; maxScore?: number }) {
  const percentage = (score / maxScore) * 100;
  const getColor = (p: number) => {
    if (p >= 80) return 'bg-success-500';
    if (p >= 60) return 'bg-primary-500';
    if (p >= 40) return 'bg-warning-500';
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

function DueDiligenceProgress({ items }: { items: DueDiligenceItem[] }) {
  const completed = items.filter(i => i.status === 'completed').length;
  const flagged = items.filter(i => i.status === 'flagged').length;
  const percentage = items.length > 0 ? Math.round((completed / items.length) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">Progress</span>
        <span className="text-sm font-medium">{completed}/{items.length} completed</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {flagged > 0 && (
        <div className="flex items-center gap-1.5 text-sm text-danger-600">
          <AlertCircle className="h-4 w-4" />
          <span>{flagged} items flagged for review</span>
        </div>
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
// Tabs
// ============================================================================

type TabId = 'overview' | 'financials' | 'diligence' | 'documents' | 'notes' | 'activity';

interface TabProps {
  id: TabId;
  label: string;
  count?: number;
  isActive: boolean;
  onClick: () => void;
}

function Tab({ id, label, count, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
        isActive
          ? 'border-primary-500 text-primary-600'
          : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
      )}
    >
      {label}
      {count !== undefined && (
        <Badge variant={isActive ? 'primary' : 'secondary'} size="sm">
          {count}
        </Badge>
      )}
    </button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function TargetDetailModal({
  isOpen,
  onClose,
  target,
  onAdvance,
  onReject,
  onEdit,
}: TargetDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  if (!target) return null;

  const stageLabels: Record<PipelineStage, string> = {
    sourcing: 'Sourcing',
    initial_screening: 'Initial Screening',
    deep_evaluation: 'Deep Evaluation',
    negotiation: 'Negotiation',
    execution: 'Execution',
    closed_passed: 'Closed/Passed',
  };

  const stageColors: Record<PipelineStage, string> = {
    sourcing: 'bg-slate-500',
    initial_screening: 'bg-blue-500',
    deep_evaluation: 'bg-indigo-500',
    negotiation: 'bg-purple-500',
    execution: 'bg-amber-500',
    closed_passed: 'bg-emerald-500',
  };

  const canAdvance = target.stage !== 'closed_passed' && target.stage !== 'execution';
  const canReject = target.stage !== 'closed_passed';

  // Mock data for demonstration
  const mockDueDiligence: DueDiligenceItem[] = target.dueDiligence || [
    { id: '1', category: 'Financial', item: 'Audit review', status: 'completed', assignee: 'John Smith' },
    { id: '2', category: 'Financial', item: 'Working capital analysis', status: 'completed', assignee: 'Sarah Johnson' },
    { id: '3', category: 'Legal', item: 'Contract review', status: 'in_progress', assignee: 'Mike Chen' },
    { id: '4', category: 'Legal', item: 'IP assessment', status: 'pending', assignee: 'Mike Chen' },
    { id: '5', category: 'Operations', item: 'Site visits', status: 'flagged', assignee: 'Lisa Wang' },
    { id: '6', category: 'HR', item: 'Management interviews', status: 'in_progress', assignee: 'John Smith' },
  ];

  const mockDocuments: TargetDocument[] = target.documents || [
    { id: '1', name: 'Financial Statements FY2024.pdf', type: 'PDF', size: '2.4 MB', uploadedAt: new Date('2024-01-15'), uploadedBy: 'Sarah Johnson' },
    { id: '2', name: 'Management Presentation.pptx', type: 'PPTX', size: '8.1 MB', uploadedAt: new Date('2024-01-12'), uploadedBy: 'John Smith' },
    { id: '3', name: 'Customer Contract Summary.xlsx', type: 'XLSX', size: '1.2 MB', uploadedAt: new Date('2024-01-10'), uploadedBy: 'Mike Chen' },
  ];

  const mockActivities: TargetActivity[] = target.activities || [
    { id: '1', type: 'stage_change', description: 'Moved to Deep Evaluation stage', user: 'Sarah Johnson', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: '2', type: 'document_uploaded', description: 'Uploaded Financial Statements FY2024', user: 'John Smith', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { id: '3', type: 'meeting_scheduled', description: 'Scheduled management meeting for Jan 20', user: 'Lisa Wang', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    { id: '4', type: 'score_updated', description: 'Evaluation score updated to 78', user: 'Mike Chen', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  ];

  const mockNotes: TargetNote[] = target.notes || [
    { id: '1', content: 'Strong recurring revenue base with 95% customer retention. Management team has deep industry experience.', author: { id: '1', name: 'Sarah Johnson' }, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), isPinned: true },
    { id: '2', content: 'Valuation expectations may be high relative to comparables. Need to dig deeper on customer concentration.', author: { id: '2', name: 'John Smith' }, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" showCloseButton={false}>
      <div className="flex h-[85vh] flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className={cn(
              'flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl',
              'bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600'
            )}>
              {target.logoUrl ? (
                <img
                  src={target.logoUrl}
                  alt={target.name}
                  className="h-full w-full rounded-xl object-cover"
                />
              ) : (
                <Building2 className="h-7 w-7" />
              )}
            </div>

            {/* Title */}
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{target.name}</h2>
                <Badge className={cn('text-white', stageColors[target.stage])}>
                  {stageLabels[target.stage]}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                <span>{target.industry}</span>
                {target.headquarters && (
                  <>
                    <span>-</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {target.headquarters}
                    </span>
                  </>
                )}
                {target.website && (
                  <a
                    href={target.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                  >
                    <Globe className="h-3 w-3" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <div className="flex -mb-px">
            <Tab id="overview" label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
            <Tab id="financials" label="Financials" isActive={activeTab === 'financials'} onClick={() => setActiveTab('financials')} />
            <Tab id="diligence" label="Due Diligence" count={mockDueDiligence.length} isActive={activeTab === 'diligence'} onClick={() => setActiveTab('diligence')} />
            <Tab id="documents" label="Documents" count={mockDocuments.length} isActive={activeTab === 'documents'} onClick={() => setActiveTab('documents')} />
            <Tab id="notes" label="Notes" count={mockNotes.length} isActive={activeTab === 'notes'} onClick={() => setActiveTab('notes')} />
            <Tab id="activity" label="Activity" isActive={activeTab === 'activity'} onClick={() => setActiveTab('activity')} />
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Main Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* Key Metrics */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard label="Enterprise Value" value={formatLargeNumber(target.enterpriseValue)} />
                  <MetricCard label="Revenue" value={target.revenue ? formatLargeNumber(target.revenue) : 'N/A'} subValue={target.revenueGrowth ? `${target.revenueGrowth}% YoY` : undefined} trend="up" />
                  <MetricCard label="EBITDA" value={target.ebitda ? formatLargeNumber(target.ebitda) : 'N/A'} subValue={target.ebitdaMargin ? `${target.ebitdaMargin}% margin` : undefined} />
                  <MetricCard label="Employees" value={target.employeeCount?.toLocaleString() || 'N/A'} />
                </div>

                {/* Evaluation Scores */}
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <SectionTitle icon={BarChart3}>Evaluation Scores</SectionTitle>
                  <div className="space-y-4">
                    <ScoreBar label="Overall" score={target.evaluationScore} />
                    <ScoreBar label="Market" score={Math.round(target.evaluationScore * 0.9)} />
                    <ScoreBar label="Financial" score={Math.round(target.evaluationScore * 1.05)} />
                    <ScoreBar label="Management" score={Math.round(target.evaluationScore * 0.95)} />
                    <ScoreBar label="Operations" score={Math.round(target.evaluationScore * 1.1)} />
                  </div>
                </div>

                {/* Investment Highlights */}
                {target.investmentHighlights && target.investmentHighlights.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <SectionTitle icon={CheckCircle2}>Investment Highlights</SectionTitle>
                    <ul className="space-y-2">
                      {target.investmentHighlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500" />
                          <span className="text-sm text-slate-700">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Key Risks */}
                {target.keyRisks && target.keyRisks.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <SectionTitle icon={AlertCircle}>Key Risks</SectionTitle>
                    <ul className="space-y-2">
                      {target.keyRisks.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-500" />
                          <span className="text-sm text-slate-700">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Description */}
                {target.description && (
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <SectionTitle icon={FileText}>Company Description</SectionTitle>
                    <p className="text-sm leading-relaxed text-slate-700">{target.description}</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <SectionTitle icon={Activity}>Quick Stats</SectionTitle>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Days in Stage</span>
                      <span className="font-medium">{target.daysInStage} days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Source</span>
                      <span className="font-medium capitalize">{target.source || 'Research'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Founded</span>
                      <span className="font-medium">{target.foundedYear || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Last Updated</span>
                      <span className="font-medium">{formatRelativeTime(target.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Due Diligence Progress */}
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <SectionTitle icon={CheckCircle2}>Due Diligence</SectionTitle>
                  <DueDiligenceProgress items={mockDueDiligence} />
                </div>

                {/* Assigned Team */}
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  <SectionTitle icon={Users}>Assigned Team</SectionTitle>
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
                </div>

                {/* Key Contacts */}
                {target.keyContacts && target.keyContacts.length > 0 && (
                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <SectionTitle icon={Users}>Key Contacts</SectionTitle>
                    <div className="space-y-3">
                      {target.keyContacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                            <p className="text-xs text-slate-500">{contact.title}</p>
                          </div>
                          <div className="flex gap-1">
                            {contact.email && (
                              <Tooltip content={contact.email}>
                                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                  <Mail className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            )}
                            {contact.phone && (
                              <Tooltip content={contact.phone}>
                                <button className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                  <Phone className="h-4 w-4" />
                                </button>
                              </Tooltip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Enterprise Value" value={formatLargeNumber(target.enterpriseValue)} />
                <MetricCard label="Revenue (LTM)" value={target.revenue ? formatLargeNumber(target.revenue) : 'N/A'} subValue={target.revenueGrowth ? `${target.revenueGrowth}% growth` : undefined} trend="up" />
                <MetricCard label="EBITDA (LTM)" value={target.ebitda ? formatLargeNumber(target.ebitda) : 'N/A'} subValue={target.ebitdaMargin ? `${target.ebitdaMargin}% margin` : undefined} />
                <MetricCard label="Gross Margin" value={target.grossMargin ? `${target.grossMargin}%` : 'N/A'} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Net Income" value={target.netIncome ? formatLargeNumber(target.netIncome) : 'N/A'} />
                <MetricCard label="Total Debt" value={target.totalDebt ? formatLargeNumber(target.totalDebt) : 'N/A'} />
                <MetricCard label="Cash Position" value={target.cashPosition ? formatLargeNumber(target.cashPosition) : 'N/A'} />
                <MetricCard label="EV/EBITDA" value={target.ebitda && target.enterpriseValue ? `${(target.enterpriseValue / target.ebitda).toFixed(1)}x` : 'N/A'} />
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-8 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-sm text-slate-500">Detailed financial charts and projections would be displayed here</p>
              </div>
            </div>
          )}

          {activeTab === 'diligence' && (
            <div className="space-y-6">
              <DueDiligenceProgress items={mockDueDiligence} />
              <div className="rounded-lg border border-slate-200 bg-white">
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
                    {mockDueDiligence.map((item) => (
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
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-500">{mockDocuments.length} documents</p>
                <Button variant="secondary" size="sm">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-200">
                {mockDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <FileText className="h-5 w-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.size} - Uploaded by {doc.uploadedBy}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-4">
              {mockNotes.map((note) => (
                <div key={note.id} className={cn(
                  'rounded-lg border bg-white p-4',
                  note.isPinned ? 'border-primary-200 bg-primary-50/50' : 'border-slate-200'
                )}>
                  <p className="text-sm text-slate-700">{note.content}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Avatar name={note.author.name} src={note.author.avatar} size="xs" />
                    <span className="text-xs text-slate-600">{note.author.name}</span>
                    <span className="text-xs text-slate-400">-</span>
                    <span className="text-xs text-slate-400">{formatRelativeTime(note.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <ActivityTimeline activities={mockActivities} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-50">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-3">
            {onEdit && (
              <Button variant="secondary" onClick={() => onEdit(target)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {canReject && onReject && (
              <Button variant="danger" onClick={() => onReject(target)}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            )}
            {canAdvance && onAdvance && (
              <Button variant="primary" onClick={() => onAdvance(target)}>
                Advance Stage
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
