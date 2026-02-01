'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
  Legend,
} from 'recharts';
import {
  TrendingDown,
  AlertTriangle,
  Info,
  DollarSign,
  Users,
  Building2,
  ChevronRight,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip as UITooltip } from '@/components/ui/Tooltip';
import { cn, formatLargeNumber, formatPercent, formatCurrency } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface RedemptionInputs {
  publicShares: number;
  redemptionPrice: number;
  trustValue: number;
  sponsorShares: number;
  pipeCommitment: number;
  pipePricePerShare: number;
  minimumCash: number;
  targetEquityValue: number;
  warrantDilution?: number;
}

interface RedemptionScenario {
  redemptionRate: number;
  sharesRedeemed: number;
  remainingPublicShares: number;
  cashFromTrust: number;
  pipeProceeds: number;
  totalCash: number;
  proFormaShares: number;
  publicOwnership: number;
  sponsorOwnership: number;
  targetOwnership: number;
  impliedValuation: number;
  cashPerShare: number;
  meetsMinimumCash: boolean;
  cashDeficit: number;
}

interface RedemptionScenariosProps {
  inputs: RedemptionInputs;
  title?: string;
  scenarios?: number[]; // Redemption rates to model (e.g., [0, 25, 50, 75, 90])
  highlightScenario?: number; // Which scenario to highlight
  showDetailedTable?: boolean;
  showCharts?: boolean;
  onScenarioSelect?: (scenario: RedemptionScenario) => void;
  onInputsChange?: (inputs: RedemptionInputs) => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SCENARIOS = [0, 25, 50, 75, 90];

const CHART_COLORS = {
  publicOwnership: '#3B82F6',
  sponsorOwnership: '#8B5CF6',
  targetOwnership: '#14B8A6',
  cash: '#22C55E',
  valuation: '#F59E0B',
  threshold: '#EF4444',
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateScenario(
  inputs: RedemptionInputs,
  redemptionRate: number
): RedemptionScenario {
  const sharesRedeemed = Math.floor(inputs.publicShares * (redemptionRate / 100));
  const remainingPublicShares = inputs.publicShares - sharesRedeemed;
  const cashFromTrust = inputs.trustValue - sharesRedeemed * inputs.redemptionPrice;
  const pipeShares = inputs.pipeCommitment / inputs.pipePricePerShare;
  const pipeProceeds = inputs.pipeCommitment;
  const totalCash = cashFromTrust + pipeProceeds;

  // Pro forma share count
  const proFormaShares =
    remainingPublicShares + inputs.sponsorShares + pipeShares;

  // Calculate target shares (what's left for the target company)
  const targetShares = inputs.targetEquityValue / (totalCash / proFormaShares);

  const totalSharesIncludingTarget = proFormaShares + targetShares;

  // Ownership percentages
  const publicOwnership = (remainingPublicShares / totalSharesIncludingTarget) * 100;
  const sponsorOwnership = (inputs.sponsorShares / totalSharesIncludingTarget) * 100;
  const targetOwnership = (targetShares / totalSharesIncludingTarget) * 100;

  // Implied valuation
  const impliedValuation = totalCash + inputs.targetEquityValue;
  const cashPerShare = totalCash / proFormaShares;

  // Check if meets minimum cash
  const meetsMinimumCash = totalCash >= inputs.minimumCash;
  const cashDeficit = meetsMinimumCash ? 0 : inputs.minimumCash - totalCash;

  return {
    redemptionRate,
    sharesRedeemed,
    remainingPublicShares,
    cashFromTrust,
    pipeProceeds,
    totalCash,
    proFormaShares,
    publicOwnership,
    sponsorOwnership,
    targetOwnership,
    impliedValuation,
    cashPerShare,
    meetsMinimumCash,
    cashDeficit,
  };
}

// ============================================================================
// CUSTOM TOOLTIP
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RedemptionScenario;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
      <p className="text-sm font-semibold text-slate-900">
        {data.redemptionRate}% Redemption
      </p>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
        <p className="text-xs text-slate-600">Total Cash:</p>
        <p className="text-xs font-medium text-right">
          {formatLargeNumber(data.totalCash)}
        </p>
        <p className="text-xs text-slate-600">Public Ownership:</p>
        <p className="text-xs font-medium text-right">
          {formatPercent(data.publicOwnership)}
        </p>
        <p className="text-xs text-slate-600">Sponsor Ownership:</p>
        <p className="text-xs font-medium text-right">
          {formatPercent(data.sponsorOwnership)}
        </p>
        <p className="text-xs text-slate-600">Target Ownership:</p>
        <p className="text-xs font-medium text-right">
          {formatPercent(data.targetOwnership)}
        </p>
      </div>
      {!data.meetsMinimumCash && (
        <div className="mt-2 flex items-center gap-1 text-xs text-danger-600">
          <AlertTriangle className="h-3 w-3" />
          Cash shortfall: {formatLargeNumber(data.cashDeficit)}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function RedemptionScenariosSkeleton() {
  return (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-6 w-48 rounded bg-slate-200" />
      </CardHeader>
      <CardContent>
        <div className="h-[400px] rounded-lg bg-slate-100" />
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SCENARIO CARD COMPONENT
// ============================================================================

interface ScenarioCardProps {
  scenario: RedemptionScenario;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

function ScenarioCard({
  scenario,
  isSelected,
  isHighlighted,
  onClick,
}: ScenarioCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-all',
        isSelected && 'border-primary-300 bg-primary-50 ring-2 ring-primary-200',
        isHighlighted && !isSelected && 'border-warning-300 bg-warning-50',
        !isSelected && !isHighlighted && 'border-slate-200 bg-white',
        !scenario.meetsMinimumCash && 'border-danger-200 bg-danger-50',
        onClick && 'cursor-pointer hover:shadow-md'
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-slate-900">
            {scenario.redemptionRate}%
          </span>
          <span className="text-sm text-slate-500">redemption</span>
        </div>
        {!scenario.meetsMinimumCash && (
          <Badge variant="danger" size="sm">
            Cash shortfall
          </Badge>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500">Total Cash</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatLargeNumber(scenario.totalCash)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Cash/Share</p>
          <p className="text-sm font-semibold text-slate-900">
            {formatCurrency(scenario.cashPerShare)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Public</p>
          <p className="text-sm font-medium text-blue-600">
            {formatPercent(scenario.publicOwnership)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Sponsor</p>
          <p className="text-sm font-medium text-violet-600">
            {formatPercent(scenario.sponsorOwnership)}
          </p>
        </div>
      </div>

      {/* Ownership bar */}
      <div className="mt-3 flex h-2 overflow-hidden rounded-full">
        <div
          className="bg-blue-500"
          style={{ width: `${scenario.publicOwnership}%` }}
          title={`Public: ${formatPercent(scenario.publicOwnership)}`}
        />
        <div
          className="bg-violet-500"
          style={{ width: `${scenario.sponsorOwnership}%` }}
          title={`Sponsor: ${formatPercent(scenario.sponsorOwnership)}`}
        />
        <div
          className="bg-teal-500"
          style={{ width: `${scenario.targetOwnership}%` }}
          title={`Target: ${formatPercent(scenario.targetOwnership)}`}
        />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RedemptionScenarios({
  inputs,
  title = 'Redemption Scenario Analysis',
  scenarios: customScenarios,
  highlightScenario,
  showDetailedTable = true,
  showCharts = true,
  onScenarioSelect,
  onInputsChange,
  isLoading = false,
  error = null,
  className,
}: RedemptionScenariosProps) {
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const scenarioRates = customScenarios || DEFAULT_SCENARIOS;

  // Calculate all scenarios
  const calculatedScenarios = useMemo(() => {
    return scenarioRates.map((rate) => calculateScenario(inputs, rate));
  }, [inputs, scenarioRates]);

  // Find max redemption rate that still meets minimum cash
  const maxViableRedemption = useMemo(() => {
    const viable = calculatedScenarios
      .filter((s) => s.meetsMinimumCash)
      .sort((a, b) => b.redemptionRate - a.redemptionRate);
    return viable[0]?.redemptionRate ?? 0;
  }, [calculatedScenarios]);

  // Chart data
  const chartData = useMemo(() => {
    // Generate more granular data for smooth lines
    const rates = [];
    for (let i = 0; i <= 100; i += 5) {
      rates.push(i);
    }
    return rates.map((rate) => calculateScenario(inputs, rate));
  }, [inputs]);

  const handleScenarioSelect = useCallback(
    (scenario: RedemptionScenario) => {
      setSelectedRate(scenario.redemptionRate);
      onScenarioSelect?.(scenario);
    },
    [onScenarioSelect]
  );

  // Loading state
  if (isLoading) {
    return <RedemptionScenariosSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <Card className={cn('border-danger-200', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-danger-400" />
          <p className="mt-4 text-sm font-medium text-danger-700">
            Failed to calculate scenarios
          </p>
          <p className="mt-1 text-xs text-danger-500">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary-600" />
            {title}
          </CardTitle>
          <UITooltip content="Models ownership and cash at different redemption levels">
            <Info className="h-4 w-4 text-slate-400" />
          </UITooltip>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={maxViableRedemption >= 75 ? 'success' : maxViableRedemption >= 50 ? 'warning' : 'danger'}
          >
            Max viable: {maxViableRedemption}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Scenario Cards Grid */}
        <div className="grid grid-cols-5 gap-3">
          {calculatedScenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.redemptionRate}
              scenario={scenario}
              isSelected={selectedRate === scenario.redemptionRate}
              isHighlighted={highlightScenario === scenario.redemptionRate}
              onClick={() => handleScenarioSelect(scenario)}
            />
          ))}
        </div>

        {/* Charts */}
        {showCharts && (
          <div className="grid grid-cols-2 gap-6">
            {/* Ownership Chart */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-700">
                Ownership Distribution
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="redemptionRate"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) => `${v}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="publicOwnership"
                      stackId="1"
                      stroke={CHART_COLORS.publicOwnership}
                      fill={CHART_COLORS.publicOwnership}
                      fillOpacity={0.6}
                      name="Public"
                    />
                    <Area
                      type="monotone"
                      dataKey="sponsorOwnership"
                      stackId="1"
                      stroke={CHART_COLORS.sponsorOwnership}
                      fill={CHART_COLORS.sponsorOwnership}
                      fillOpacity={0.6}
                      name="Sponsor"
                    />
                    <Area
                      type="monotone"
                      dataKey="targetOwnership"
                      stackId="1"
                      stroke={CHART_COLORS.targetOwnership}
                      fill={CHART_COLORS.targetOwnership}
                      fillOpacity={0.6}
                      name="Target"
                    />
                    {selectedRate !== null && (
                      <ReferenceLine
                        x={selectedRate}
                        stroke="#1F2937"
                        strokeDasharray="5 5"
                      />
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cash Chart */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-700">
                Cash Available
              </h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="redemptionRate"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      tickFormatter={(v) => formatLargeNumber(v)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine
                      y={inputs.minimumCash}
                      stroke={CHART_COLORS.threshold}
                      strokeDasharray="5 5"
                      label={{
                        value: 'Min Cash',
                        position: 'right',
                        fill: CHART_COLORS.threshold,
                        fontSize: 10,
                      }}
                    />
                    <Bar
                      dataKey="cashFromTrust"
                      stackId="cash"
                      fill="#93C5FD"
                      name="Trust"
                    />
                    <Bar
                      dataKey="pipeProceeds"
                      stackId="cash"
                      fill="#86EFAC"
                      name="PIPE"
                    />
                    <Line
                      type="monotone"
                      dataKey="totalCash"
                      stroke={CHART_COLORS.cash}
                      strokeWidth={2}
                      dot={false}
                      name="Total"
                    />
                    {selectedRate !== null && (
                      <ReferenceLine
                        x={selectedRate}
                        stroke="#1F2937"
                        strokeDasharray="5 5"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Table */}
        {showDetailedTable && (
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    Redemption
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Shares Redeemed
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Trust Cash
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Total Cash
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Public %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Sponsor %
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                    Target %
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {calculatedScenarios.map((scenario, index) => (
                  <tr
                    key={scenario.redemptionRate}
                    className={cn(
                      'border-t border-slate-100 transition-colors',
                      selectedRate === scenario.redemptionRate && 'bg-primary-50',
                      !scenario.meetsMinimumCash && 'bg-danger-50/50',
                      'cursor-pointer hover:bg-slate-50'
                    )}
                    onClick={() => handleScenarioSelect(scenario)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {scenario.redemptionRate}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {new Intl.NumberFormat().format(scenario.sharesRedeemed)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">
                      {formatLargeNumber(scenario.cashFromTrust)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      {formatLargeNumber(scenario.totalCash)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-blue-600">
                      {formatPercent(scenario.publicOwnership)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-violet-600">
                      {formatPercent(scenario.sponsorOwnership)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-teal-600">
                      {formatPercent(scenario.targetOwnership)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {scenario.meetsMinimumCash ? (
                        <Badge variant="success" size="sm">
                          Viable
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm">
                          Shortfall
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 border-t border-slate-100 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-blue-500" />
            <span className="text-xs text-slate-600">Public Shareholders</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-violet-500" />
            <span className="text-xs text-slate-600">Sponsor</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-teal-500" />
            <span className="text-xs text-slate-600">Target Company</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-4 bg-danger-500" style={{ borderStyle: 'dashed' }} />
            <span className="text-xs text-slate-600">Minimum Cash Threshold</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
        <span>
          Trust: {formatLargeNumber(inputs.trustValue)} | PIPE: {formatLargeNumber(inputs.pipeCommitment)}
        </span>
        <span>
          Min Cash Requirement: {formatLargeNumber(inputs.minimumCash)}
        </span>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// COMPACT SUMMARY
// ============================================================================

interface RedemptionSummaryProps {
  inputs: RedemptionInputs;
  targetRedemption?: number;
  className?: string;
}

export function RedemptionSummary({
  inputs,
  targetRedemption = 50,
  className,
}: RedemptionSummaryProps) {
  const scenario = useMemo(
    () => calculateScenario(inputs, targetRedemption),
    [inputs, targetRedemption]
  );

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'rounded-lg p-2',
                scenario.meetsMinimumCash ? 'bg-success-100' : 'bg-danger-100'
              )}
            >
              <TrendingDown
                className={cn(
                  'h-5 w-5',
                  scenario.meetsMinimumCash ? 'text-success-600' : 'text-danger-600'
                )}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {targetRedemption}% Redemption
              </p>
              <p className="text-xs text-slate-500">
                Cash: {formatLargeNumber(scenario.totalCash)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-slate-700">
              Public: {formatPercent(scenario.publicOwnership)}
            </p>
            <p className="text-xs text-slate-500">
              Sponsor: {formatPercent(scenario.sponsorOwnership)}
            </p>
          </div>
        </div>

        {/* Mini ownership bar */}
        <div className="mt-3 flex h-2 overflow-hidden rounded-full">
          <div
            className="bg-blue-500"
            style={{ width: `${scenario.publicOwnership}%` }}
          />
          <div
            className="bg-violet-500"
            style={{ width: `${scenario.sponsorOwnership}%` }}
          />
          <div
            className="bg-teal-500"
            style={{ width: `${scenario.targetOwnership}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
