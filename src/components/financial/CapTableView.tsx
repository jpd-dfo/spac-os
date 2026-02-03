'use client';

import { useMemo, useState } from 'react';

import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Info,
  Download,
  ChevronDown,
  ChevronRight,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Tooltip as UITooltip } from '@/components/ui/Tooltip';
import { cn, formatLargeNumber, formatPercent } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ShareClass = 'class_a' | 'class_b' | 'public_warrants' | 'private_warrants' | 'options' | 'rsus';

interface ShareHolder {
  id: string;
  name: string;
  type: 'sponsor' | 'public' | 'institution' | 'management' | 'pipe_investor';
  shares: number;
  shareClass: ShareClass;
  vestingSchedule?: string;
  acquisitionPrice?: number;
  notes?: string;
}

interface ShareClassInfo {
  id: ShareClass;
  name: string;
  totalShares: number;
  percentageOfBasic: number;
  percentageOfDiluted: number;
  votingPower: number;
  conversionRatio?: number;
  strikePrice?: number;
  expirationDate?: string;
  color: string;
  holders: ShareHolder[];
}

interface CapTableViewProps {
  spacName: string;
  spacTicker: string;
  shareClasses: ShareClassInfo[];
  showFullyDiluted?: boolean;
  onExport?: () => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SHARE_CLASS_COLORS: Record<ShareClass, string> = {
  class_a: '#3B82F6',
  class_b: '#8B5CF6',
  public_warrants: '#F43F5E',
  private_warrants: '#EC4899',
  options: '#10B981',
  rsus: '#F59E0B',
};

const SHARE_CLASS_LABELS: Record<ShareClass, string> = {
  class_a: 'Class A (Public)',
  class_b: 'Class B (Founder)',
  public_warrants: 'Public Warrants',
  private_warrants: 'Private Placement Warrants',
  options: 'Stock Options',
  rsus: 'RSUs',
};

// ============================================================================
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_CAP_TABLE: Omit<CapTableViewProps, 'className' | 'onExport'> = {
  spacName: 'Soren Acquisition Corporation',
  spacTicker: 'SOAR',
  showFullyDiluted: true,
  shareClasses: [
    {
      id: 'class_a',
      name: 'Class A Common Stock (Public)',
      totalShares: 25300000,
      percentageOfBasic: 80.03,
      percentageOfDiluted: 48.78,
      votingPower: 80.03,
      color: '#3B82F6',
      holders: [
        { id: '1', name: 'Public Shareholders', type: 'public', shares: 25300000, shareClass: 'class_a' },
      ],
    },
    {
      id: 'class_b',
      name: 'Class B Common Stock (Founder)',
      totalShares: 6325000,
      percentageOfBasic: 19.97,
      percentageOfDiluted: 12.19,
      votingPower: 19.97,
      conversionRatio: 1,
      color: '#8B5CF6',
      holders: [
        { id: '2', name: 'Soren Capital LLC', type: 'sponsor', shares: 4850000, shareClass: 'class_b', notes: 'Sponsor Entity' },
        { id: '3', name: 'Management Team', type: 'management', shares: 1475000, shareClass: 'class_b', vestingSchedule: '3-year cliff' },
      ],
    },
    {
      id: 'public_warrants',
      name: 'Public Warrants',
      totalShares: 12650000,
      percentageOfBasic: 0,
      percentageOfDiluted: 24.39,
      votingPower: 0,
      strikePrice: 11.50,
      expirationDate: '2028-03-15',
      color: '#F43F5E',
      holders: [
        { id: '4', name: 'Public Warrant Holders', type: 'public', shares: 12650000, shareClass: 'public_warrants' },
      ],
    },
    {
      id: 'private_warrants',
      name: 'Private Placement Warrants',
      totalShares: 7590000,
      percentageOfBasic: 0,
      percentageOfDiluted: 14.64,
      votingPower: 0,
      strikePrice: 11.50,
      expirationDate: '2028-03-15',
      color: '#EC4899',
      holders: [
        { id: '5', name: 'Soren Capital LLC', type: 'sponsor', shares: 6000000, shareClass: 'private_warrants' },
        { id: '6', name: 'Underwriters', type: 'institution', shares: 1590000, shareClass: 'private_warrants' },
      ],
    },
  ],
};

// ============================================================================
// CUSTOM CHART TOOLTIP
// ============================================================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      shares: number;
      percentage: number;
      color: string;
    };
  }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {return null;}

  const firstPayload = payload[0];
  if (!firstPayload) {return null;}

  const data = firstPayload.payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: data.color }}
        />
        <p className="text-sm font-semibold text-slate-900">{data.name}</p>
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-slate-600">
          Shares: <span className="font-medium">{data.shares.toLocaleString()}</span>
        </p>
        <p className="text-xs text-slate-600">
          Ownership: <span className="font-medium">{formatPercent(data.percentage)}</span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SHARE CLASS ROW
// ============================================================================

interface ShareClassRowProps {
  shareClass: ShareClassInfo;
  isExpanded: boolean;
  onToggle: () => void;
  showFullyDiluted: boolean;
}

function ShareClassRow({ shareClass, isExpanded, onToggle, showFullyDiluted }: ShareClassRowProps) {
  return (
    <>
      <tr
        className="border-t border-slate-100 transition-colors hover:bg-slate-50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="text-slate-400 hover:text-slate-600">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: shareClass.color }}
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{shareClass.name}</p>
              {shareClass.strikePrice && (
                <p className="text-xs text-slate-500">
                  Strike: ${shareClass.strikePrice} | Exp: {shareClass.expirationDate}
                </p>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
          {shareClass.totalShares.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {formatPercent(shareClass.percentageOfBasic)}
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {formatPercent(shareClass.percentageOfDiluted)}
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {formatPercent(shareClass.votingPower)}
        </td>
      </tr>
      {isExpanded && shareClass.holders.map((holder, index) => (
        <tr
          key={holder.id}
          className={cn(
            'bg-slate-50/50',
            index === shareClass.holders.length - 1 && 'border-b border-slate-200'
          )}
        >
          <td className="px-4 py-2 pl-16">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">|--</span>
              <span className="text-sm text-slate-600">{holder.name}</span>
              {holder.type === 'sponsor' && (
                <Badge variant="primary" size="sm">Sponsor</Badge>
              )}
              {holder.type === 'management' && (
                <Badge variant="secondary" size="sm">Management</Badge>
              )}
            </div>
            {holder.vestingSchedule && (
              <p className="ml-6 text-xs text-slate-400">{holder.vestingSchedule}</p>
            )}
          </td>
          <td className="px-4 py-2 text-right text-sm text-slate-500">
            {holder.shares.toLocaleString()}
          </td>
          <td className="px-4 py-2 text-right text-sm text-slate-400">
            {formatPercent((holder.shares / shareClass.totalShares) * shareClass.percentageOfBasic)}
          </td>
          <td className="px-4 py-2 text-right text-sm text-slate-400">
            {formatPercent((holder.shares / shareClass.totalShares) * shareClass.percentageOfDiluted)}
          </td>
          <td className="px-4 py-2 text-right text-sm text-slate-400">-</td>
        </tr>
      ))}
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CapTableView({
  spacName,
  spacTicker,
  shareClasses,
  showFullyDiluted = true,
  onExport,
  className,
}: CapTableViewProps) {
  const [expandedClasses, setExpandedClasses] = useState<Set<ShareClass>>(new Set(['class_a', 'class_b']));
  const [viewMode, setViewMode] = useState<'basic' | 'diluted'>('diluted');

  // Calculate totals
  const totals = useMemo(() => {
    const basicShares = shareClasses
      .filter((sc) => sc.id === 'class_a' || sc.id === 'class_b')
      .reduce((sum, sc) => sum + sc.totalShares, 0);

    const dilutedShares = shareClasses.reduce((sum, sc) => sum + sc.totalShares, 0);

    const sponsorShares = shareClasses.reduce(
      (sum, sc) => sum + sc.holders.filter((h) => h.type === 'sponsor').reduce((s, h) => s + h.shares, 0),
      0
    );

    const publicShares = shareClasses.reduce(
      (sum, sc) => sum + sc.holders.filter((h) => h.type === 'public').reduce((s, h) => s + h.shares, 0),
      0
    );

    return { basicShares, dilutedShares, sponsorShares, publicShares };
  }, [shareClasses]);

  // Pie chart data
  const pieChartData = useMemo(() => {
    return shareClasses.map((sc) => ({
      name: SHARE_CLASS_LABELS[sc.id],
      shares: sc.totalShares,
      percentage: viewMode === 'diluted' ? sc.percentageOfDiluted : sc.percentageOfBasic,
      color: sc.color,
    }));
  }, [shareClasses, viewMode]);

  const toggleExpanded = (classId: ShareClass) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(classId)) {
      newExpanded.delete(classId);
    } else {
      newExpanded.add(classId);
    }
    setExpandedClasses(newExpanded);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Cap Table</h2>
          <p className="text-sm text-slate-500">
            {spacName} ({spacTicker})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-1">
            <button
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                viewMode === 'basic'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              onClick={() => setViewMode('basic')}
            >
              Basic
            </button>
            <button
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                viewMode === 'diluted'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              onClick={() => setViewMode('diluted')}
            >
              Fully Diluted
            </button>
          </div>
          {onExport && (
            <Button variant="secondary" size="sm" onClick={onExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Basic Shares</p>
                <p className="text-lg font-bold text-slate-900">
                  {totals.basicShares.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-violet-100 p-2">
                <TrendingUp className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Fully Diluted</p>
                <p className="text-lg font-bold text-slate-900">
                  {totals.dilutedShares.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-2">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Sponsor Ownership</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatPercent((totals.sponsorShares / totals.dilutedShares) * 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 p-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Public Float</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatPercent((totals.publicShares / totals.dilutedShares) * 100)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Table Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ownership Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary-600" />
              Ownership Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="shares"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {pieChartData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatPercent(entry.percentage)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Cap Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              Share Structure
            </CardTitle>
            <UITooltip content="Click rows to expand holder details">
              <Info className="h-4 w-4 text-slate-400" />
            </UITooltip>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Share Class
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Shares
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      % Basic
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      % Diluted
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Voting %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shareClasses.map((shareClass) => (
                    <ShareClassRow
                      key={shareClass.id}
                      shareClass={shareClass}
                      isExpanded={expandedClasses.has(shareClass.id)}
                      onToggle={() => toggleExpanded(shareClass.id)}
                      showFullyDiluted={showFullyDiluted}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Total (Basic)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {totals.basicShares.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      100.0%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-500">-</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      100.0%
                    </td>
                  </tr>
                  <tr className="bg-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Total (Fully Diluted)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {totals.dilutedShares.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-500">-</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      100.0%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-500">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between text-xs text-slate-500">
            <span>20% founder promote structure</span>
            <span>Warrants exercisable at $11.50</span>
          </CardFooter>
        </Card>
      </div>

      {/* Founder Promote Notice */}
      <Card className="border-violet-200 bg-violet-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-violet-600" />
            <div>
              <p className="text-sm font-medium text-violet-800">Founder Promote Structure</p>
              <p className="mt-1 text-sm text-violet-700">
                Class B founder shares represent 20% of the post-IPO share count (6,325,000 shares).
                These shares convert to Class A shares at a 1:1 ratio upon completion of a business
                combination, subject to certain anti-dilution provisions. Founder shares are subject
                to a lock-up period of one year post-business combination.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// COMPACT CAP TABLE SUMMARY
// ============================================================================

interface CapTableSummaryProps {
  basicShares: number;
  dilutedShares: number;
  sponsorOwnership: number;
  publicFloat: number;
  className?: string;
  onClick?: () => void;
}

export function CapTableSummary({
  basicShares,
  dilutedShares,
  sponsorOwnership,
  publicFloat,
  className,
  onClick,
}: CapTableSummaryProps) {
  return (
    <Card
      className={cn(
        'transition-all',
        onClick && 'cursor-pointer hover:border-primary-200 hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-100 p-2">
              <Users className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Cap Table</p>
              <p className="text-xs text-slate-500">
                {basicShares.toLocaleString()} basic shares
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-slate-900">
              {dilutedShares.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              Sponsor: {formatPercent(sponsorOwnership)} | Public: {formatPercent(publicFloat)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
