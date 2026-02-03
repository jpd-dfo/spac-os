'use client';

import { useMemo, useState } from 'react';

import {
  Users,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  FileText,
  ArrowUpRight,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Plus,
  Filter,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
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
import { cn, formatLargeNumber, formatPercent, formatDate, formatCurrency } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type InvestorType = 'institutional' | 'hedge_fund' | 'family_office' | 'strategic' | 'anchor';
type SubscriptionStatus = 'committed' | 'soft_circled' | 'in_diligence' | 'declined' | 'pending';

interface PipeInvestor {
  id: string;
  name: string;
  type: InvestorType;
  commitmentAmount: number;
  pricePerShare: number;
  shares: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionDate?: Date | string;
  closingConditions?: string[];
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  notes?: string;
  lockupPeriod?: number; // months
}

interface PipeTrackerProps {
  targetPipeSize: number;
  pricePerShare: number;
  investors: PipeInvestor[];
  closingDate?: Date | string;
  minimumClose?: number;
  onAddInvestor?: () => void;
  onInvestorClick?: (investor: PipeInvestor) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const INVESTOR_TYPE_COLORS: Record<InvestorType, string> = {
  institutional: '#3B82F6',
  hedge_fund: '#8B5CF6',
  family_office: '#F59E0B',
  strategic: '#14B8A6',
  anchor: '#EF4444',
};

const INVESTOR_TYPE_LABELS: Record<InvestorType, string> = {
  institutional: 'Institutional',
  hedge_fund: 'Hedge Fund',
  family_office: 'Family Office',
  strategic: 'Strategic',
  anchor: 'Anchor',
};

const STATUS_CONFIG: Record<SubscriptionStatus, { label: string; color: string; badge: 'success' | 'warning' | 'danger' | 'secondary' | 'primary' }> = {
  committed: { label: 'Committed', color: '#22C55E', badge: 'success' },
  soft_circled: { label: 'Soft Circled', color: '#F59E0B', badge: 'warning' },
  in_diligence: { label: 'In Diligence', color: '#3B82F6', badge: 'primary' },
  declined: { label: 'Declined', color: '#EF4444', badge: 'danger' },
  pending: { label: 'Pending', color: '#94A3B8', badge: 'secondary' },
};

// ============================================================================
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_PIPE_DATA: Omit<PipeTrackerProps, 'className' | 'onAddInvestor' | 'onInvestorClick'> = {
  targetPipeSize: 75000000,
  pricePerShare: 10.00,
  closingDate: '2025-02-15',
  minimumClose: 50000000,
  investors: [
    {
      id: '1',
      name: 'Fidelity Management',
      type: 'institutional',
      commitmentAmount: 20000000,
      pricePerShare: 10.00,
      shares: 2000000,
      subscriptionStatus: 'committed',
      subscriptionDate: '2024-11-15',
      contactName: 'Sarah Chen',
      contactEmail: 'schen@fidelity.com',
      lockupPeriod: 6,
      closingConditions: ['Standard closing conditions', 'Minimum cash condition'],
    },
    {
      id: '2',
      name: 'BlackRock Advisors',
      type: 'institutional',
      commitmentAmount: 15000000,
      pricePerShare: 10.00,
      shares: 1500000,
      subscriptionStatus: 'committed',
      subscriptionDate: '2024-11-20',
      contactName: 'Michael Roberts',
      contactEmail: 'mroberts@blackrock.com',
      lockupPeriod: 6,
    },
    {
      id: '3',
      name: 'Third Point LLC',
      type: 'hedge_fund',
      commitmentAmount: 12500000,
      pricePerShare: 10.00,
      shares: 1250000,
      subscriptionStatus: 'committed',
      subscriptionDate: '2024-11-25',
      contactName: 'David Kim',
      lockupPeriod: 3,
    },
    {
      id: '4',
      name: 'Wellington Management',
      type: 'institutional',
      commitmentAmount: 10000000,
      pricePerShare: 10.00,
      shares: 1000000,
      subscriptionStatus: 'soft_circled',
      contactName: 'Jennifer Lee',
      notes: 'Waiting on final IC approval',
    },
    {
      id: '5',
      name: 'Walton Family Office',
      type: 'family_office',
      commitmentAmount: 7500000,
      pricePerShare: 10.00,
      shares: 750000,
      subscriptionStatus: 'soft_circled',
      contactName: 'Thomas Walton',
    },
    {
      id: '6',
      name: 'Target Strategic Partner',
      type: 'strategic',
      commitmentAmount: 5000000,
      pricePerShare: 10.00,
      shares: 500000,
      subscriptionStatus: 'in_diligence',
      contactName: 'Board Representative',
      notes: 'Strategic investment tied to commercial agreement',
    },
    {
      id: '7',
      name: 'Citadel Securities',
      type: 'hedge_fund',
      commitmentAmount: 5000000,
      pricePerShare: 10.00,
      shares: 500000,
      subscriptionStatus: 'declined',
      notes: 'Sector allocation full',
    },
  ],
};

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
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
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: data.color }} />
        <p className="text-sm font-semibold text-slate-900">{data.name}</p>
      </div>
      <div className="mt-2 space-y-1">
        <p className="text-xs text-slate-600">
          Amount: <span className="font-medium">{formatLargeNumber(data.value)}</span>
        </p>
        <p className="text-xs text-slate-600">
          Share: <span className="font-medium">{formatPercent(data.percentage)}</span>
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// INVESTOR ROW
// ============================================================================

interface InvestorRowProps {
  investor: PipeInvestor;
  totalCommitted: number;
  isExpanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

function InvestorRow({ investor, totalCommitted, isExpanded, onToggle, onClick }: InvestorRowProps) {
  const statusConfig = STATUS_CONFIG[investor.subscriptionStatus];

  return (
    <>
      <tr
        className={cn(
          'border-t border-slate-100 transition-colors hover:bg-slate-50 cursor-pointer',
          investor.subscriptionStatus === 'declined' && 'opacity-50'
        )}
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
              style={{ backgroundColor: INVESTOR_TYPE_COLORS[investor.type] }}
            />
            <div>
              <p className="text-sm font-medium text-slate-900">{investor.name}</p>
              <p className="text-xs text-slate-500">{INVESTOR_TYPE_LABELS[investor.type]}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
          {formatLargeNumber(investor.commitmentAmount)}
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {investor.shares.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {formatCurrency(investor.pricePerShare)}
        </td>
        <td className="px-4 py-3 text-right text-sm text-slate-600">
          {formatPercent((investor.commitmentAmount / totalCommitted) * 100)}
        </td>
        <td className="px-4 py-3">
          <Badge variant={statusConfig.badge} size="sm">
            {statusConfig.label}
          </Badge>
        </td>
      </tr>
      {isExpanded && (
        <tr className="bg-slate-50/50">
          <td colSpan={6} className="px-4 py-4">
            <div className="ml-10 grid gap-4 md:grid-cols-3">
              {investor.contactName && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Contact</p>
                  <p className="mt-1 text-sm text-slate-700">{investor.contactName}</p>
                  {investor.contactEmail && (
                    <a
                      href={`mailto:${investor.contactEmail}`}
                      className="mt-1 flex items-center gap-1 text-xs text-primary-600 hover:underline"
                    >
                      <Mail className="h-3 w-3" />
                      {investor.contactEmail}
                    </a>
                  )}
                </div>
              )}
              {investor.subscriptionDate && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Subscription Date</p>
                  <p className="mt-1 text-sm text-slate-700">{formatDate(investor.subscriptionDate)}</p>
                </div>
              )}
              {investor.lockupPeriod && (
                <div>
                  <p className="text-xs font-medium text-slate-500">Lock-up Period</p>
                  <p className="mt-1 text-sm text-slate-700">{investor.lockupPeriod} months</p>
                </div>
              )}
              {investor.closingConditions && investor.closingConditions.length > 0 && (
                <div className="md:col-span-3">
                  <p className="text-xs font-medium text-slate-500">Closing Conditions</p>
                  <ul className="mt-1 list-disc list-inside text-sm text-slate-700">
                    {investor.closingConditions.map((condition, idx) => (
                      <li key={idx}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              {investor.notes && (
                <div className="md:col-span-3">
                  <p className="text-xs font-medium text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-slate-600">{investor.notes}</p>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PIPETracker({
  targetPipeSize,
  pricePerShare,
  investors,
  closingDate,
  minimumClose,
  onAddInvestor,
  onInvestorClick,
  className,
}: PipeTrackerProps) {
  const [expandedInvestors, setExpandedInvestors] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<SubscriptionStatus | 'all'>('all');

  // Calculate metrics
  const metrics = useMemo(() => {
    const activeInvestors = investors.filter((i) => i.subscriptionStatus !== 'declined');
    const committedInvestors = investors.filter((i) => i.subscriptionStatus === 'committed');
    const softCircled = investors.filter((i) => i.subscriptionStatus === 'soft_circled');
    const inDiligence = investors.filter((i) => i.subscriptionStatus === 'in_diligence');

    const committedAmount = committedInvestors.reduce((sum, i) => sum + i.commitmentAmount, 0);
    const softCircledAmount = softCircled.reduce((sum, i) => sum + i.commitmentAmount, 0);
    const inDiligenceAmount = inDiligence.reduce((sum, i) => sum + i.commitmentAmount, 0);
    const totalPipeline = committedAmount + softCircledAmount + inDiligenceAmount;

    const percentComplete = (committedAmount / targetPipeSize) * 100;
    const percentWithSoft = ((committedAmount + softCircledAmount) / targetPipeSize) * 100;
    const meetsMinimum = minimumClose ? committedAmount >= minimumClose : true;
    const remainingToRaise = Math.max(0, targetPipeSize - committedAmount);

    return {
      committedAmount,
      softCircledAmount,
      inDiligenceAmount,
      totalPipeline,
      percentComplete,
      percentWithSoft,
      meetsMinimum,
      remainingToRaise,
      investorCount: activeInvestors.length,
      committedCount: committedInvestors.length,
    };
  }, [investors, targetPipeSize, minimumClose]);

  // Pie chart data by investor type
  const typeBreakdownData = useMemo(() => {
    const byType: Record<InvestorType, number> = {
      institutional: 0,
      hedge_fund: 0,
      family_office: 0,
      strategic: 0,
      anchor: 0,
    };

    investors
      .filter((i) => i.subscriptionStatus === 'committed' || i.subscriptionStatus === 'soft_circled')
      .forEach((investor) => {
        byType[investor.type] += investor.commitmentAmount;
      });

    return Object.entries(byType)
      .filter(([, value]) => value > 0)
      .map(([type, value]) => ({
        name: INVESTOR_TYPE_LABELS[type as InvestorType],
        value,
        percentage: (value / (metrics.committedAmount + metrics.softCircledAmount)) * 100,
        color: INVESTOR_TYPE_COLORS[type as InvestorType],
      }));
  }, [investors, metrics]);

  // Filtered investors
  const filteredInvestors = useMemo(() => {
    if (statusFilter === 'all') {return investors;}
    return investors.filter((i) => i.subscriptionStatus === statusFilter);
  }, [investors, statusFilter]);

  const toggleExpanded = (investorId: string) => {
    const newExpanded = new Set(expandedInvestors);
    if (newExpanded.has(investorId)) {
      newExpanded.delete(investorId);
    } else {
      newExpanded.add(investorId);
    }
    setExpandedInvestors(newExpanded);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">PIPE Investor Tracker</h2>
          <p className="text-sm text-slate-500">
            Target: {formatLargeNumber(targetPipeSize)} at {formatCurrency(pricePerShare)}/share
            {closingDate && ` | Closing: ${formatDate(closingDate)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {minimumClose && (
            <Badge variant={metrics.meetsMinimum ? 'success' : 'warning'}>
              Min Close: {formatLargeNumber(minimumClose)}
            </Badge>
          )}
          {onAddInvestor && (
            <Button variant="primary" size="sm" onClick={onAddInvestor}>
              <Plus className="mr-2 h-4 w-4" />
              Add Investor
            </Button>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-100">Total Committed</p>
              <p className="mt-1 text-4xl font-bold">{formatLargeNumber(metrics.committedAmount)}</p>
              <p className="mt-2 text-sm text-primary-200">
                {metrics.committedCount} committed investors
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary-100">% of Target</p>
              <p className="mt-1 text-3xl font-bold">{formatPercent(metrics.percentComplete)}</p>
              <p className="mt-2 text-sm text-primary-200">
                {formatLargeNumber(metrics.remainingToRaise)} remaining
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-primary-100">
              <span>PIPE Progress</span>
              <span>Target: {formatLargeNumber(targetPipeSize)}</span>
            </div>
            <div className="mt-2 h-4 overflow-hidden rounded-full bg-white/20">
              <div className="flex h-full">
                <div
                  className="bg-white transition-all"
                  style={{ width: `${Math.min(metrics.percentComplete, 100)}%` }}
                  title={`Committed: ${formatPercent(metrics.percentComplete)}`}
                />
                <div
                  className="bg-white/50 transition-all"
                  style={{ width: `${Math.min(metrics.percentWithSoft - metrics.percentComplete, 100 - metrics.percentComplete)}%` }}
                  title={`Soft Circled: ${formatPercent(metrics.percentWithSoft - metrics.percentComplete)}`}
                />
              </div>
            </div>
            <div className="mt-2 flex justify-between text-xs text-primary-200">
              <span>Committed: {formatPercent(metrics.percentComplete)}</span>
              <span>+ Soft Circled: {formatPercent(metrics.percentWithSoft)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success-100 p-2">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Committed</p>
                <p className="text-lg font-bold text-success-600">
                  {formatLargeNumber(metrics.committedAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning-100 p-2">
                <Clock className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Soft Circled</p>
                <p className="text-lg font-bold text-warning-600">
                  {formatLargeNumber(metrics.softCircledAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-100 p-2">
                <FileText className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">In Diligence</p>
                <p className="text-lg font-bold text-primary-600">
                  {formatLargeNumber(metrics.inDiligenceAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Pipeline</p>
                <p className="text-lg font-bold text-slate-900">
                  {formatLargeNumber(metrics.totalPipeline)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Table */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Type Breakdown Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary-600" />
              By Investor Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeBreakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {typeBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 space-y-2">
              {typeBreakdownData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm text-slate-600">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {formatLargeNumber(entry.value)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Investor Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Investor List
            </CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatus | 'all')}
                className="rounded-md border border-slate-200 px-2 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="committed">Committed</option>
                <option value="soft_circled">Soft Circled</option>
                <option value="in_diligence">In Diligence</option>
                <option value="declined">Declined</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Investor
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Commitment
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Shares
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                      % of PIPE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvestors.map((investor) => (
                    <InvestorRow
                      key={investor.id}
                      investor={investor}
                      totalCommitted={metrics.totalPipeline}
                      isExpanded={expandedInvestors.has(investor.id)}
                      onToggle={() => toggleExpanded(investor.id)}
                      onClick={onInvestorClick ? () => onInvestorClick(investor) : undefined}
                    />
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-700">
                      Total ({filteredInvestors.length} investors)
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {formatLargeNumber(filteredInvestors.reduce((sum, i) => sum + i.commitmentAmount, 0))}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                      {filteredInvestors.reduce((sum, i) => sum + i.shares, 0).toLocaleString()}
                    </td>
                    <td colSpan={3} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between text-xs text-slate-500">
            <span>Click row to expand details</span>
            <span>{closingDate && `Closing: ${formatDate(closingDate)}`}</span>
          </CardFooter>
        </Card>
      </div>

      {/* Status Warning */}
      {!metrics.meetsMinimum && minimumClose && (
        <Card className="border-warning-200 bg-warning-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-warning-600" />
              <div>
                <p className="text-sm font-medium text-warning-800">Minimum Close Not Met</p>
                <p className="mt-1 text-sm text-warning-700">
                  Current committed amount ({formatLargeNumber(metrics.committedAmount)}) is below the
                  minimum close requirement ({formatLargeNumber(minimumClose)}). Need{' '}
                  {formatLargeNumber(minimumClose - metrics.committedAmount)} more in commitments.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
