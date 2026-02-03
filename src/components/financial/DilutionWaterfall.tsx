'use client';

import { useMemo, useState } from 'react';

import { TrendingDown, Info, AlertTriangle, ChevronDown, ArrowRight, Users, Building2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  LabelList,
  ComposedChart,
  Line,
  Legend,
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tooltip as UITooltip } from '@/components/ui/Tooltip';
import { cn, formatPercent, formatLargeNumber } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type DilutionStage = 'pre_ipo' | 'post_ipo' | 'post_pipe' | 'post_earnout' | 'post_warrants';

interface OwnershipStage {
  id: DilutionStage;
  name: string;
  description: string;
  publicOwnership: number;
  sponsorOwnership: number;
  targetOwnership: number;
  pipeOwnership: number;
  earnoutOwnership: number;
  totalShares: number;
}

interface DilutionWaterfallProps {
  stages: OwnershipStage[];
  title?: string;
  targetName?: string;
  spacName?: string;
  showDetailedBreakdown?: boolean;
  highlightStage?: DilutionStage;
  onStageClick?: (stage: OwnershipStage) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const OWNERSHIP_COLORS = {
  public: '#3B82F6',
  sponsor: '#8B5CF6',
  target: '#14B8A6',
  pipe: '#F59E0B',
  earnout: '#EF4444',
};

const STAGE_ORDER: DilutionStage[] = ['pre_ipo', 'post_ipo', 'post_pipe', 'post_earnout', 'post_warrants'];

// ============================================================================
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_DILUTION_STAGES: OwnershipStage[] = [
  {
    id: 'pre_ipo',
    name: 'Pre-IPO',
    description: 'Before public offering',
    publicOwnership: 0,
    sponsorOwnership: 100,
    targetOwnership: 0,
    pipeOwnership: 0,
    earnoutOwnership: 0,
    totalShares: 6325000,
  },
  {
    id: 'post_ipo',
    name: 'Post-IPO',
    description: 'After IPO + warrant exercise',
    publicOwnership: 48.78,
    sponsorOwnership: 12.19,
    targetOwnership: 0,
    pipeOwnership: 0,
    earnoutOwnership: 0,
    totalShares: 51865000,
  },
  {
    id: 'post_pipe',
    name: 'Post-PIPE',
    description: 'After PIPE investment ($75M)',
    publicOwnership: 42.15,
    sponsorOwnership: 10.54,
    targetOwnership: 35.27,
    pipeOwnership: 12.04,
    earnoutOwnership: 0,
    totalShares: 60000000,
  },
  {
    id: 'post_earnout',
    name: 'Post-Earnout',
    description: 'After all earnout milestones',
    publicOwnership: 38.20,
    sponsorOwnership: 9.55,
    targetOwnership: 37.95,
    pipeOwnership: 10.90,
    earnoutOwnership: 3.40,
    totalShares: 66200000,
  },
  {
    id: 'post_warrants',
    name: 'Fully Diluted',
    description: 'All securities converted',
    publicOwnership: 48.78,
    sponsorOwnership: 12.19,
    targetOwnership: 0,
    pipeOwnership: 0,
    earnoutOwnership: 0,
    totalShares: 51865000,
  },
];

// ============================================================================
// CUSTOM CHART TOOLTIP
// ============================================================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    dataKey: string;
    value: number;
    color: string;
    name: string;
  }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {return null;}

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="mt-2 space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-slate-600">{entry.name}</span>
            </div>
            <span className="text-xs font-medium text-slate-900">
              {formatPercent(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// STAGE CARD
// ============================================================================

interface StageCardProps {
  stage: OwnershipStage;
  isSelected: boolean;
  onClick: () => void;
  showArrow: boolean;
}

function StageCard({ stage, isSelected, onClick, showArrow }: StageCardProps) {
  return (
    <div className="flex items-center">
      <div
        className={cn(
          'flex-1 rounded-lg border p-4 transition-all cursor-pointer',
          isSelected
            ? 'border-primary-300 bg-primary-50 ring-2 ring-primary-200'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
        )}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{stage.name}</p>
            <p className="text-xs text-slate-500">{stage.description}</p>
          </div>
          <Badge variant="secondary" size="sm">
            {stage.totalShares.toLocaleString()} shares
          </Badge>
        </div>

        {/* Ownership Bar */}
        <div className="mt-3 flex h-3 overflow-hidden rounded-full">
          {stage.publicOwnership > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${stage.publicOwnership}%`,
                backgroundColor: OWNERSHIP_COLORS.public,
              }}
              title={`Public: ${formatPercent(stage.publicOwnership)}`}
            />
          )}
          {stage.sponsorOwnership > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${stage.sponsorOwnership}%`,
                backgroundColor: OWNERSHIP_COLORS.sponsor,
              }}
              title={`Sponsor: ${formatPercent(stage.sponsorOwnership)}`}
            />
          )}
          {stage.targetOwnership > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${stage.targetOwnership}%`,
                backgroundColor: OWNERSHIP_COLORS.target,
              }}
              title={`Target: ${formatPercent(stage.targetOwnership)}`}
            />
          )}
          {stage.pipeOwnership > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${stage.pipeOwnership}%`,
                backgroundColor: OWNERSHIP_COLORS.pipe,
              }}
              title={`PIPE: ${formatPercent(stage.pipeOwnership)}`}
            />
          )}
          {stage.earnoutOwnership > 0 && (
            <div
              className="transition-all"
              style={{
                width: `${stage.earnoutOwnership}%`,
                backgroundColor: OWNERSHIP_COLORS.earnout,
              }}
              title={`Earnout: ${formatPercent(stage.earnoutOwnership)}`}
            />
          )}
        </div>

        {/* Ownership Labels */}
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          {stage.publicOwnership > 0 && (
            <span className="text-blue-600">Public: {formatPercent(stage.publicOwnership)}</span>
          )}
          {stage.sponsorOwnership > 0 && (
            <span className="text-violet-600">Sponsor: {formatPercent(stage.sponsorOwnership)}</span>
          )}
          {stage.targetOwnership > 0 && (
            <span className="text-teal-600">Target: {formatPercent(stage.targetOwnership)}</span>
          )}
          {stage.pipeOwnership > 0 && (
            <span className="text-amber-600">PIPE: {formatPercent(stage.pipeOwnership)}</span>
          )}
        </div>
      </div>
      {showArrow && (
        <ArrowRight className="mx-2 h-5 w-5 flex-shrink-0 text-slate-300" />
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DilutionWaterfall({
  stages,
  title = 'Dilution Waterfall Analysis',
  targetName = 'Target Company',
  spacName = 'SPAC',
  showDetailedBreakdown = true,
  highlightStage,
  onStageClick,
  className,
}: DilutionWaterfallProps) {
  const [selectedStage, setSelectedStage] = useState<DilutionStage>(highlightStage || 'post_pipe');

  // Sort stages by order
  const sortedStages = useMemo(() => {
    return [...stages].sort(
      (a, b) => STAGE_ORDER.indexOf(a.id) - STAGE_ORDER.indexOf(b.id)
    );
  }, [stages]);

  // Chart data
  const chartData = useMemo(() => {
    return sortedStages.map((stage) => ({
      name: stage.name,
      Public: stage.publicOwnership,
      Sponsor: stage.sponsorOwnership,
      Target: stage.targetOwnership,
      PIPE: stage.pipeOwnership,
      Earnout: stage.earnoutOwnership,
    }));
  }, [sortedStages]);

  // Selected stage details
  const selectedStageData = useMemo(() => {
    return sortedStages.find((s) => s.id === selectedStage);
  }, [sortedStages, selectedStage]);

  // Calculate total dilution from IPO to selected stage
  const dilutionMetrics = useMemo(() => {
    const postIpo = stages.find((s) => s.id === 'post_ipo');
    const current = selectedStageData;

    if (!postIpo || !current) {return null;}

    const publicDilution = postIpo.publicOwnership - current.publicOwnership;
    const sponsorDilution = postIpo.sponsorOwnership - current.sponsorOwnership;
    const shareIncrease = ((current.totalShares - postIpo.totalShares) / postIpo.totalShares) * 100;

    return { publicDilution, sponsorDilution, shareIncrease };
  }, [stages, selectedStageData]);

  const handleStageClick = (stage: OwnershipStage) => {
    setSelectedStage(stage.id);
    onStageClick?.(stage);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            Track ownership changes through each transaction stage
          </p>
        </div>
        <UITooltip content="Shows how ownership percentages change as new shares are issued">
          <Info className="h-5 w-5 text-slate-400" />
        </UITooltip>
      </div>

      {/* Stage Flow Cards */}
      <div className="flex items-center overflow-x-auto pb-2">
        {sortedStages.map((stage, index) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isSelected={selectedStage === stage.id}
            onClick={() => handleStageClick(stage)}
            showArrow={index < sortedStages.length - 1}
          />
        ))}
      </div>

      {/* Dilution Metrics */}
      {dilutionMetrics && (
        <div className="grid grid-cols-3 gap-4">
          <Card className={dilutionMetrics.publicDilution > 0 ? 'border-danger-200 bg-danger-50' : ''}>
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Public Dilution</p>
              <p className={cn(
                'mt-1 text-2xl font-bold',
                dilutionMetrics.publicDilution > 0 ? 'text-danger-600' : 'text-success-600'
              )}>
                {dilutionMetrics.publicDilution > 0 ? '-' : '+'}{formatPercent(Math.abs(dilutionMetrics.publicDilution))}
              </p>
              <p className="mt-1 text-xs text-slate-500">from Post-IPO</p>
            </CardContent>
          </Card>

          <Card className={dilutionMetrics.sponsorDilution > 0 ? 'border-danger-200 bg-danger-50' : ''}>
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Sponsor Dilution</p>
              <p className={cn(
                'mt-1 text-2xl font-bold',
                dilutionMetrics.sponsorDilution > 0 ? 'text-danger-600' : 'text-success-600'
              )}>
                {dilutionMetrics.sponsorDilution > 0 ? '-' : '+'}{formatPercent(Math.abs(dilutionMetrics.sponsorDilution))}
              </p>
              <p className="mt-1 text-xs text-slate-500">from Post-IPO</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-xs font-medium text-slate-500">Share Count Increase</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                +{formatPercent(dilutionMetrics.shareIncrease)}
              </p>
              <p className="mt-1 text-xs text-slate-500">from Post-IPO</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary-600" />
            Ownership Progression
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="square"
                />
                <ReferenceLine y={50} stroke="#94A3B8" strokeDasharray="5 5" />
                <Bar dataKey="Public" stackId="a" fill={OWNERSHIP_COLORS.public} name="Public" />
                <Bar dataKey="Sponsor" stackId="a" fill={OWNERSHIP_COLORS.sponsor} name="Sponsor" />
                <Bar dataKey="Target" stackId="a" fill={OWNERSHIP_COLORS.target} name="Target" />
                <Bar dataKey="PIPE" stackId="a" fill={OWNERSHIP_COLORS.pipe} name="PIPE" />
                <Bar dataKey="Earnout" stackId="a" fill={OWNERSHIP_COLORS.earnout} name="Earnout" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      {showDetailedBreakdown && selectedStageData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                {selectedStageData.name} Ownership Details
              </span>
              <Badge variant="primary">{selectedStageData.totalShares.toLocaleString()} total shares</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Owner</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Ownership %</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">Shares</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">Visual</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedStageData.publicOwnership > 0 && (
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.public }} />
                          <span className="text-sm font-medium text-slate-900">Public Shareholders</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatPercent(selectedStageData.publicOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {Math.round(selectedStageData.totalShares * selectedStageData.publicOwnership / 100).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${selectedStageData.publicOwnership}%`, backgroundColor: OWNERSHIP_COLORS.public }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedStageData.sponsorOwnership > 0 && (
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.sponsor }} />
                          <span className="text-sm font-medium text-slate-900">Sponsor</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatPercent(selectedStageData.sponsorOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {Math.round(selectedStageData.totalShares * selectedStageData.sponsorOwnership / 100).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${selectedStageData.sponsorOwnership}%`, backgroundColor: OWNERSHIP_COLORS.sponsor }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedStageData.targetOwnership > 0 && (
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.target }} />
                          <span className="text-sm font-medium text-slate-900">{targetName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatPercent(selectedStageData.targetOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {Math.round(selectedStageData.totalShares * selectedStageData.targetOwnership / 100).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${selectedStageData.targetOwnership}%`, backgroundColor: OWNERSHIP_COLORS.target }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedStageData.pipeOwnership > 0 && (
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.pipe }} />
                          <span className="text-sm font-medium text-slate-900">PIPE Investors</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatPercent(selectedStageData.pipeOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {Math.round(selectedStageData.totalShares * selectedStageData.pipeOwnership / 100).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${selectedStageData.pipeOwnership}%`, backgroundColor: OWNERSHIP_COLORS.pipe }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {selectedStageData.earnoutOwnership > 0 && (
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.earnout }} />
                          <span className="text-sm font-medium text-slate-900">Earnout Shares</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatPercent(selectedStageData.earnoutOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {Math.round(selectedStageData.totalShares * selectedStageData.earnoutOwnership / 100).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${selectedStageData.earnoutOwnership}%`, backgroundColor: OWNERSHIP_COLORS.earnout }}
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">100.0%</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {selectedStageData.totalShares.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div className="h-full w-full rounded-full bg-slate-600" />
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter className="text-xs text-slate-500">
            {selectedStageData.description}
          </CardFooter>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.public }} />
          <span className="text-sm text-slate-600">Public Shareholders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.sponsor }} />
          <span className="text-sm text-slate-600">Sponsor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.target }} />
          <span className="text-sm text-slate-600">Target Company</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.pipe }} />
          <span className="text-sm text-slate-600">PIPE Investors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: OWNERSHIP_COLORS.earnout }} />
          <span className="text-sm text-slate-600">Earnout</span>
        </div>
      </div>
    </div>
  );
}
