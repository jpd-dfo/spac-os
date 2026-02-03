'use client';

import { useState, useEffect, useMemo } from 'react';

import {
  Building2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  FileText,
  Rocket,
  Flag,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate, daysUntil } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type SpacPhase =
  | 'FORMATION'
  | 'PRE_IPO'
  | 'IPO'
  | 'TARGET_SEARCH'
  | 'DE_SPAC'
  | 'POST_MERGER';

interface Milestone {
  id: string;
  name: string;
  date: Date | string | null;
  completed: boolean;
  phase: SpacPhase;
}

interface SpacStatusData {
  id: string;
  name: string;
  ticker: string;
  currentPhase: SpacPhase;
  ipoDate: Date | string;
  businessCombinationDeadline: Date | string;
  extensionsUsed: number;
  maxExtensions: number;
  milestones: Milestone[];
  targetAnnounced?: string;
  targetAnnouncementDate?: Date | string;
}

interface SpacStatusCardProps {
  data?: SpacStatusData | null;
  isLoading?: boolean;
  className?: string;
  onViewDetails?: () => void;
}

// ============================================================================
// MOCK DATA FOR SOREN ACQUISITION CORPORATION
// ============================================================================

export const mockSpacStatusData: SpacStatusData = {
  id: 'soren-001',
  name: 'Soren Acquisition Corporation',
  ticker: 'SOAC',
  currentPhase: 'TARGET_SEARCH',
  ipoDate: new Date('2026-01-15'),
  businessCombinationDeadline: new Date('2028-01-15'),
  extensionsUsed: 0,
  maxExtensions: 2,
  milestones: [
    { id: '1', name: 'Entity Formation', date: '2025-08-15', completed: true, phase: 'FORMATION' },
    { id: '2', name: 'S-1 Filing', date: '2025-10-01', completed: true, phase: 'PRE_IPO' },
    { id: '3', name: 'SEC Comments', date: '2025-11-15', completed: true, phase: 'PRE_IPO' },
    { id: '4', name: 'IPO Pricing', date: '2026-01-14', completed: true, phase: 'IPO' },
    { id: '5', name: 'IPO Closing', date: '2026-01-15', completed: true, phase: 'IPO' },
    { id: '6', name: 'Target Identification', date: null, completed: false, phase: 'TARGET_SEARCH' },
    { id: '7', name: 'LOI Signed', date: null, completed: false, phase: 'TARGET_SEARCH' },
    { id: '8', name: 'DA Announced', date: null, completed: false, phase: 'DE_SPAC' },
    { id: '9', name: 'Proxy Filed', date: null, completed: false, phase: 'DE_SPAC' },
    { id: '10', name: 'Shareholder Vote', date: null, completed: false, phase: 'DE_SPAC' },
    { id: '11', name: 'Business Combination', date: null, completed: false, phase: 'POST_MERGER' },
  ],
};

// ============================================================================
// PHASE CONFIGURATION
// ============================================================================

const phaseConfig: Record<SpacPhase, {
  label: string;
  description: string;
  icon: typeof Building2;
  color: string;
  bgColor: string;
  order: number;
}> = {
  FORMATION: {
    label: 'Formation',
    description: 'Entity setup and team assembly',
    icon: Building2,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
    order: 1,
  },
  PRE_IPO: {
    label: 'Pre-IPO',
    description: 'S-1 filing and SEC review',
    icon: FileText,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    order: 2,
  },
  IPO: {
    label: 'IPO',
    description: 'Initial public offering',
    icon: Rocket,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    order: 3,
  },
  TARGET_SEARCH: {
    label: 'Target Search',
    description: 'Identifying acquisition targets',
    icon: Target,
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
    order: 4,
  },
  DE_SPAC: {
    label: 'De-SPAC',
    description: 'Business combination process',
    icon: Flag,
    color: 'text-warning-600',
    bgColor: 'bg-warning-100',
    order: 5,
  },
  POST_MERGER: {
    label: 'Post-Merger',
    description: 'Completed business combination',
    icon: CheckCircle2,
    color: 'text-success-600',
    bgColor: 'bg-success-100',
    order: 6,
  },
};

const phases: SpacPhase[] = [
  'FORMATION',
  'PRE_IPO',
  'IPO',
  'TARGET_SEARCH',
  'DE_SPAC',
  'POST_MERGER',
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PhaseProgressBar({ currentPhase }: { currentPhase: SpacPhase }) {
  const currentIndex = phases.indexOf(currentPhase);
  const progressPercent = ((currentIndex + 1) / phases.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        {phases.map((phase, index) => {
          const config = phaseConfig[phase];
          const Icon = config.icon;
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div
              key={phase}
              className={cn(
                'flex flex-col items-center',
                index > 0 && 'flex-1'
              )}
            >
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted && 'border-success-500 bg-success-500',
                  isCurrent && 'border-primary-500 bg-primary-500',
                  !isCompleted && !isCurrent && 'border-slate-200 bg-white'
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                ) : (
                  <Icon
                    className={cn(
                      'h-4 w-4',
                      isCurrent ? 'text-white' : 'text-slate-400'
                    )}
                  />
                )}
              </div>
              <span
                className={cn(
                  'mt-1 hidden text-xs font-medium lg:block',
                  isCurrent ? 'text-primary-600' : 'text-slate-500'
                )}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress line */}
      <div className="relative h-2 rounded-full bg-slate-100">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-success-500 to-primary-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function DeadlineCountdown({ deadline, extensionsUsed, maxExtensions }: {
  deadline: Date | string;
  extensionsUsed: number;
  maxExtensions: number;
}) {
  const days = daysUntil(deadline);
  const isUrgent = days !== null && days <= 90;
  const isCritical = days !== null && days <= 30;

  return (
    <div
      className={cn(
        'rounded-xl p-4',
        isCritical
          ? 'bg-danger-50 border border-danger-200'
          : isUrgent
            ? 'bg-warning-50 border border-warning-200'
            : 'bg-slate-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'rounded-lg p-2',
            isCritical
              ? 'bg-danger-100'
              : isUrgent
                ? 'bg-warning-100'
                : 'bg-slate-100'
          )}
        >
          <Clock
            className={cn(
              'h-5 w-5',
              isCritical
                ? 'text-danger-600'
                : isUrgent
                  ? 'text-warning-600'
                  : 'text-slate-600'
            )}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">
            Business Combination Deadline
          </p>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-2xl font-bold',
                isCritical
                  ? 'text-danger-700'
                  : isUrgent
                    ? 'text-warning-700'
                    : 'text-slate-900'
              )}
            >
              {days !== null ? days : '-'}
            </span>
            <span className="text-sm text-slate-500">days remaining</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Due: {formatDate(deadline)}
          </p>
        </div>
        <div className="text-right">
          <Badge
            variant={extensionsUsed >= maxExtensions ? 'danger' : 'secondary'}
          >
            {extensionsUsed}/{maxExtensions} Extensions
          </Badge>
          {isCritical && (
            <div className="mt-1 flex items-center gap-1 text-xs text-danger-600">
              <AlertTriangle className="h-3 w-3" />
              <span>Critical</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MilestoneList({ milestones, currentPhase }: {
  milestones: Milestone[];
  currentPhase: SpacPhase;
}) {
  // Show relevant milestones (2 completed + current incomplete ones)
  const completedMilestones = milestones.filter(m => m.completed).slice(-2);
  const pendingMilestones = milestones.filter(m => !m.completed).slice(0, 3);
  const displayMilestones = [...completedMilestones, ...pendingMilestones];

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-slate-700">Key Milestones</h4>
      <div className="space-y-1">
        {displayMilestones.map((milestone, index) => (
          <div
            key={milestone.id}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 transition-colors',
              !milestone.completed && index === completedMilestones.length
                ? 'bg-primary-50'
                : 'hover:bg-slate-50'
            )}
          >
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full',
                milestone.completed
                  ? 'bg-success-100'
                  : !milestone.completed && index === completedMilestones.length
                    ? 'bg-primary-100'
                    : 'bg-slate-100'
              )}
            >
              {milestone.completed ? (
                <CheckCircle2 className="h-4 w-4 text-success-600" />
              ) : (
                <div
                  className={cn(
                    'h-2 w-2 rounded-full',
                    index === completedMilestones.length
                      ? 'bg-primary-500 animate-pulse'
                      : 'bg-slate-300'
                  )}
                />
              )}
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  'text-sm font-medium',
                  milestone.completed
                    ? 'text-slate-600'
                    : index === completedMilestones.length
                      ? 'text-primary-700'
                      : 'text-slate-400'
                )}
              >
                {milestone.name}
              </p>
            </div>
            {milestone.date && (
              <span className="text-xs text-slate-400">
                {formatDate(milestone.date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SpacStatusSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-48 rounded bg-slate-200" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="h-16 rounded-lg bg-slate-200" />
        <div className="h-12 rounded-lg bg-slate-200" />
        <div className="h-24 rounded-lg bg-slate-200" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SpacStatusCard({
  data = mockSpacStatusData,
  isLoading = false,
  className,
  onViewDetails,
}: SpacStatusCardProps) {
  // Real-time countdown update
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const currentPhaseConfig = useMemo(() => {
    if (!data) {return null;}
    return phaseConfig[data.currentPhase];
  }, [data]);

  if (isLoading) {
    return <SpacStatusSkeleton />;
  }

  if (!data) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            No SPAC data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const PhaseIcon = currentPhaseConfig?.icon || Building2;

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            SPAC Status
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">
            {data.name} ({data.ticker})
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5',
            currentPhaseConfig?.bgColor
          )}
        >
          <PhaseIcon className={cn('h-4 w-4', currentPhaseConfig?.color)} />
          <span
            className={cn('text-sm font-semibold', currentPhaseConfig?.color)}
          >
            {currentPhaseConfig?.label}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Phase Progress */}
        <PhaseProgressBar currentPhase={data.currentPhase} />

        {/* Deadline Countdown */}
        <DeadlineCountdown
          deadline={data.businessCombinationDeadline}
          extensionsUsed={data.extensionsUsed}
          maxExtensions={data.maxExtensions}
        />

        {/* Key Milestones */}
        <MilestoneList
          milestones={data.milestones}
          currentPhase={data.currentPhase}
        />

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            View Full Timeline
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
}

export default SpacStatusCard;
