'use client';

import { useState } from 'react';

import {
  X,
  Building2,
  Globe,
  MapPin,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileText,
  MessageSquare,
  Clock,
  ExternalLink,
  Edit2,
  Trash2,
  Share2,
  Star,
  StarOff,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Tag,
  Target,
  Shield,
  Activity,
} from 'lucide-react';

import { Avatar, AvatarGroup } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownDivider } from '@/components/ui/Dropdown';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Tooltip } from '@/components/ui/Tooltip';
import { TARGET_STATUS_LABELS, DEAL_STAGE_LABELS, TASK_PRIORITY_LABELS } from '@/lib/constants';
import {
  cn,
  formatLargeNumber,
  formatDate,
  formatRelativeTime,
  formatPercent,
  formatMultiple,
} from '@/lib/utils';

import type { Deal, DealActivity, DueDiligenceItem, QuickActionType } from './types';

// ============================================================================
// Types
// ============================================================================

interface DealDetailModalProps {
  deal: Deal | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (deal: Deal) => void;
  onDelete?: (deal: Deal) => void;
  onStageChange?: (deal: Deal, newStage: string) => void;
  onQuickAction?: (deal: Deal, action: QuickActionType) => void;
  activities?: DealActivity[];
  dueDiligenceItems?: DueDiligenceItem[];
}

type TabType = 'overview' | 'financials' | 'diligence' | 'activity' | 'documents';

// ============================================================================
// Score Display Component
// ============================================================================

interface ScoreDisplayProps {
  label: string;
  score: number | undefined;
  icon: React.ReactNode;
}

function ScoreDisplay({ label, score, icon }: ScoreDisplayProps) {
  if (score === undefined) {return null;}

  const getColor = (value: number) => {
    if (value >= 80) {return 'text-success-600 bg-success-100';}
    if (value >= 60) {return 'text-primary-600 bg-primary-100';}
    if (value >= 40) {return 'text-warning-600 bg-warning-100';}
    return 'text-danger-600 bg-danger-100';
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <div className="text-slate-400">{icon}</div>
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <div className={cn('rounded-full px-2.5 py-0.5 text-sm font-medium', getColor(score))}>
        {score}/100
      </div>
    </div>
  );
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  label: string;
  value: string | number | undefined;
  subValue?: string;
  icon?: React.ReactNode;
}

function MetricCard({ label, value, subValue, icon }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">{label}</span>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <p className="mt-1 text-xl font-semibold text-slate-900">
        {value ?? '-'}
      </p>
      {subValue && <p className="text-sm text-slate-500">{subValue}</p>}
    </div>
  );
}

// ============================================================================
// Tab Content Components
// ============================================================================

function OverviewTab({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-6">
      {/* Company Info */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-700">Company Information</h4>
        <div className="space-y-3">
          {deal.description && (
            <p className="text-sm text-slate-600">{deal.description}</p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {deal.headquarters && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>{deal.headquarters}</span>
              </div>
            )}
            {deal.website && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Globe className="h-4 w-4 text-slate-400" />
                <a
                  href={deal.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {deal.website}
                </a>
              </div>
            )}
            {deal.foundedYear && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Founded {deal.foundedYear}</span>
              </div>
            )}
            {deal.employeeCount && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users className="h-4 w-4 text-slate-400" />
                <span>{deal.employeeCount.toLocaleString()} employees</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Highlights */}
      {deal.investmentHighlights && deal.investmentHighlights.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">Investment Highlights</h4>
          <ul className="space-y-2">
            {deal.investmentHighlights.map((highlight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success-500" />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Key Risks */}
      {deal.keyRisks && deal.keyRisks.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">Key Risks</h4>
          <ul className="space-y-2">
            {deal.keyRisks.map((risk, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning-500" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Scores */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-700">Deal Scoring</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <ScoreDisplay
            label="Management"
            score={deal.managementScore}
            icon={<Users className="h-4 w-4" />}
          />
          <ScoreDisplay
            label="Market"
            score={deal.marketScore}
            icon={<Target className="h-4 w-4" />}
          />
          <ScoreDisplay
            label="Financial"
            score={deal.financialScore}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <ScoreDisplay
            label="Operational"
            score={deal.operationalScore}
            icon={<Activity className="h-4 w-4" />}
          />
          <ScoreDisplay
            label="Risk"
            score={deal.riskScore}
            icon={<Shield className="h-4 w-4" />}
          />
          <ScoreDisplay
            label="Overall"
            score={deal.overallScore}
            icon={<BarChart3 className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Team */}
      {deal.assignees && deal.assignees.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">Deal Team</h4>
          <div className="space-y-2">
            {deal.leadAssignee && (
              <div className="flex items-center gap-3 rounded-lg bg-primary-50 p-3">
                <Avatar name={deal.leadAssignee.name} src={deal.leadAssignee.avatar} size="sm" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{deal.leadAssignee.name}</p>
                  <p className="text-xs text-slate-500">Lead</p>
                </div>
              </div>
            )}
            {deal.assignees
              .filter((a) => a.id !== deal.leadAssignee?.id)
              .map((assignee) => (
                <div key={assignee.id} className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
                  <Avatar name={assignee.name} src={assignee.avatar} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{assignee.name}</p>
                    <p className="text-xs text-slate-500">{assignee.email}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FinancialsTab({ deal }: { deal: Deal }) {
  return (
    <div className="space-y-6">
      {/* Valuation */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-700">Valuation</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Enterprise Value"
            value={formatLargeNumber(deal.enterpriseValue)}
            icon={<Building2 className="h-4 w-4" />}
          />
          <MetricCard
            label="Equity Value"
            value={formatLargeNumber(deal.equityValue)}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <MetricCard
            label="Win Probability"
            value={deal.probability ? `${deal.probability}%` : undefined}
            icon={<Target className="h-4 w-4" />}
          />
        </div>
      </div>

      {/* Revenue & EBITDA */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-700">Financial Performance</h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="LTM Revenue"
            value={formatLargeNumber(deal.ltmRevenue)}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <MetricCard
            label="LTM EBITDA"
            value={formatLargeNumber(deal.ltmEbitda)}
            icon={<BarChart3 className="h-4 w-4" />}
          />
          <MetricCard
            label="Projected Revenue"
            value={formatLargeNumber(deal.projectedRevenue)}
            subValue="Next 12 months"
          />
          <MetricCard
            label="Projected EBITDA"
            value={formatLargeNumber(deal.projectedEbitda)}
            subValue="Next 12 months"
          />
        </div>
      </div>

      {/* Multiples */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-700">Valuation Multiples</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <MetricCard
            label="EV / Revenue"
            value={deal.evRevenue ? formatMultiple(deal.evRevenue) : undefined}
          />
          <MetricCard
            label="EV / EBITDA"
            value={deal.evEbitda ? formatMultiple(deal.evEbitda) : undefined}
          />
        </div>
      </div>

      {/* Key Dates */}
      <div>
        <h4 className="mb-3 text-sm font-medium text-slate-700">Key Dates</h4>
        <div className="space-y-2">
          {deal.firstContactDate && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm text-slate-600">First Contact</span>
              <span className="text-sm font-medium text-slate-900">
                {formatDate(deal.firstContactDate)}
              </span>
            </div>
          )}
          {deal.ndaSignedDate && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm text-slate-600">NDA Signed</span>
              <span className="text-sm font-medium text-slate-900">
                {formatDate(deal.ndaSignedDate)}
              </span>
            </div>
          )}
          {deal.loiSignedDate && (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
              <span className="text-sm text-slate-600">LOI Signed</span>
              <span className="text-sm font-medium text-slate-900">
                {formatDate(deal.loiSignedDate)}
              </span>
            </div>
          )}
          {deal.targetCloseDate && (
            <div className="flex items-center justify-between rounded-lg bg-primary-50 p-3">
              <span className="text-sm text-primary-700">Target Close Date</span>
              <span className="text-sm font-medium text-primary-900">
                {formatDate(deal.targetCloseDate)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DueDiligenceTab({
  deal,
  items = [],
}: {
  deal: Deal;
  items?: DueDiligenceItem[];
}) {
  const progress = deal.dueDiligence;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      {progress && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-slate-700">Overall Progress</h4>
            <span className="text-sm font-medium text-slate-900">
              {progress.completed}/{progress.total} items
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                progress.completed === progress.total
                  ? 'bg-success-500'
                  : progress.completed > progress.total / 2
                    ? 'bg-primary-500'
                    : 'bg-warning-500'
              )}
              style={{
                width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="mt-3 flex gap-4 text-xs">
            <span className="text-slate-500">
              <span className="font-medium text-slate-700">{progress.completed}</span> Completed
            </span>
            <span className="text-slate-500">
              <span className="font-medium text-slate-700">{progress.inProgress}</span> In Progress
            </span>
            <span className="text-slate-500">
              <span className="font-medium text-slate-700">{progress.blocked}</span> Blocked
            </span>
          </div>
        </div>
      )}

      {/* Category Progress */}
      {progress?.categories && progress.categories.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">By Category</h4>
          <div className="space-y-3">
            {progress.categories.map((category) => (
              <div key={category.name} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{category.name}</span>
                  <span className="text-xs text-slate-500">
                    {category.completed}/{category.total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      category.completed === category.total
                        ? 'bg-success-500'
                        : 'bg-primary-500'
                    )}
                    style={{
                      width: `${category.total > 0 ? (category.completed / category.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item List */}
      {items.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-slate-700">Items</h4>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between rounded-lg border p-3',
                  item.status === 'completed'
                    ? 'border-success-200 bg-success-50'
                    : item.status === 'blocked'
                      ? 'border-danger-200 bg-danger-50'
                      : 'border-slate-200 bg-white'
                )}
              >
                <div className="flex items-center gap-3">
                  {item.status === 'completed' ? (
                    <CheckCircle2 className="h-5 w-5 text-success-500" />
                  ) : item.status === 'blocked' ? (
                    <AlertCircle className="h-5 w-5 text-danger-500" />
                  ) : item.status === 'in_progress' ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-300" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.assignee && (
                    <Avatar name={item.assignee.name} src={item.assignee.avatar} size="xs" />
                  )}
                  {item.dueDate && (
                    <span className="text-xs text-slate-500">{formatDate(item.dueDate, 'MMM d')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!progress && items.length === 0 && (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
          <div className="text-center">
            <FileText className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">No due diligence items yet</p>
            <Button variant="secondary" size="sm" className="mt-3">
              Start Due Diligence
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityTab({ activities = [] }: { activities?: DealActivity[] }) {
  const getActivityIcon = (type: DealActivity['type']) => {
    switch (type) {
      case 'note':
        return <MessageSquare className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'email':
        return <FileText className="h-4 w-4" />;
      case 'call':
        return <Users className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'stage_change':
        return <ChevronRight className="h-4 w-4" />;
      case 'assignment':
        return <User className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {activities.length > 0 ? (
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-4 top-0 h-full w-px bg-slate-200" />

          {/* Activity Items */}
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="relative flex gap-4 pl-10">
                {/* Icon */}
                <div className="absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                      {activity.description && (
                        <p className="mt-1 text-sm text-slate-600">{activity.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(activity.createdAt)}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar name={activity.createdBy.name} src={activity.createdBy.avatar} size="xs" />
                    <span className="text-xs text-slate-500">{activity.createdBy.name}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50">
          <div className="text-center">
            <Activity className="mx-auto mb-2 h-8 w-8 text-slate-400" />
            <p className="text-sm text-slate-500">No activity yet</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DealDetailModal({
  deal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStageChange,
  onQuickAction,
  activities = [],
  dueDiligenceItems = [],
}: DealDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!deal) {return null;}

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <Building2 className="h-4 w-4" /> },
    { key: 'financials', label: 'Financials', icon: <DollarSign className="h-4 w-4" /> },
    { key: 'diligence', label: 'Due Diligence', icon: <FileText className="h-4 w-4" /> },
    { key: 'activity', label: 'Activity', icon: <Activity className="h-4 w-4" /> },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full" showCloseButton={false}>
      {/* Custom Header */}
      <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-slate-900">{deal.name}</h2>
            <Badge variant="secondary">{deal.sector}</Badge>
            <Badge
              variant={
                deal.priority === 'CRITICAL'
                  ? 'danger'
                  : deal.priority === 'HIGH'
                    ? 'warning'
                    : 'secondary'
              }
            >
              {TASK_PRIORITY_LABELS[deal.priority]}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
            <span>{DEAL_STAGE_LABELS[deal.stage]}</span>
            <span>|</span>
            <span>{TARGET_STATUS_LABELS[deal.status]}</span>
            {deal.lastActivityAt && (
              <>
                <span>|</span>
                <span>Updated {formatRelativeTime(deal.lastActivityAt)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Actions */}
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm">
                Actions
                <ChevronRight className="ml-1 h-4 w-4 rotate-90" />
              </Button>
            }
            align="right"
          >
            <DropdownItem
              icon={<Calendar className="h-4 w-4" />}
              onClick={() => onQuickAction?.(deal, 'schedule_meeting')}
            >
              Schedule Meeting
            </DropdownItem>
            <DropdownItem
              icon={<MessageSquare className="h-4 w-4" />}
              onClick={() => onQuickAction?.(deal, 'add_note')}
            >
              Add Note
            </DropdownItem>
            <DropdownItem
              icon={<User className="h-4 w-4" />}
              onClick={() => onQuickAction?.(deal, 'assign')}
            >
              Assign
            </DropdownItem>
            <DropdownItem
              icon={<Tag className="h-4 w-4" />}
              onClick={() => onQuickAction?.(deal, 'add_tag')}
            >
              Add Tag
            </DropdownItem>
            <DropdownDivider />
            <DropdownItem
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => onEdit?.(deal)}
            >
              Edit Deal
            </DropdownItem>
            <DropdownItem
              icon={<Trash2 className="h-4 w-4" />}
              onClick={() => onDelete?.(deal)}
              variant="danger"
            >
              Delete Deal
            </DropdownItem>
          </Dropdown>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 px-6">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 border-b-2 py-3 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-h-[60vh] overflow-y-auto p-6">
        {activeTab === 'overview' && <OverviewTab deal={deal} />}
        {activeTab === 'financials' && <FinancialsTab deal={deal} />}
        {activeTab === 'diligence' && <DueDiligenceTab deal={deal} items={dueDiligenceItems} />}
        {activeTab === 'activity' && <ActivityTab activities={activities} />}
      </div>

      {/* Footer */}
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={() => onEdit?.(deal)}>
          Edit Deal
        </Button>
      </ModalFooter>
    </Modal>
  );
}
