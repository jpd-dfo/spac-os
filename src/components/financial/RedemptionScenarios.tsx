'use client';

import { useMemo, useState, useCallback } from 'react';

import {
  TrendingDown,
  AlertTriangle,
  Info,
  DollarSign,
  Users,
  Building2,
  ChevronRight,
  Sliders,
  CheckCircle,
  XCircle,
  Calculator,
} from 'lucide-react';
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

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
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
  warrantShares?: number;
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
  scenarios?: number[];
  highlightScenario?: number;
  showDetailedTable?: boolean;
  showCharts?: boolean;
  onScenarioSelect?: (scenario: RedemptionScenario) => void;
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
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_REDEMPTION_INPUTS: RedemptionInputs = {
  publicShares: 25300000,
  redemptionPrice: 10.33,
  trustValue: 261350000,
  sponsorShares: 6325000,
  pipeCommitment: 75000000,
  pipePricePerShare: 10.00,
  minimumCash: 100000000,
  targetEquityValue: 500000000,
  warrantShares: 20240000,
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

  // Pro forma share count (excluding target shares for now)
  const spacShares = remainingPublicShares + inputs.sponsorShares + pipeShares;

  // Calculate target shares based on equity value and implied share price
  const impliedSharePrice = totalCash / spacShares;
  const targetShares = inputs.targetEquityValue / impliedSharePrice;

  const totalSharesIncludingTarget = spacShares + targetShares;

  // Ownership percentages
  const publicOwnership = (remainingPublicShares / totalSharesIncludingTarget) * 100;
  const sponsorOwnership = (inputs.sponsorShares / totalSharesIncludingTarget) * 100;
  const targetOwnership = (targetShares / totalSharesIncludingTarget) * 100;

  // Implied valuation
  const impliedValuation = totalCash + inputs.targetEquityValue;
  const cashPerShare = totalCash / spacShares;

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
    proFormaShares: totalSharesIncludingTarget,
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

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: RedemptionScenario;
    dataKey: string;
    color: string;
  }>;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload || !payload.length) {return null;}

  const firstPayload = payload[0];
  if (!firstPayload) {return null;}

  const data = firstPayload.payload;

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
// SCENARIO SLIDER CARD
// ============================================================================

interface ScenarioSliderProps {
  value: number;
  onChange: (value: number) => void;
  scenario: RedemptionScenario;
}

function ScenarioSlider({ value, onChange, scenario }: ScenarioSliderProps) {
  return (
    <Card className="border-2 border-primary-200 bg-primary-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sliders className="h-5 w-5 text-primary-600" />
            <span className="text-sm font-medium text-slate-700">Interactive Redemption Model</span>
          </div>
          <Badge variant="primary" size="lg">
            {value}% redemption
          </Badge>
        </div>

        {/* Slider */}
        <div className="mt-6">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Results Grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-slate-500">Cash Available</p>
            <p className={cn(
              'mt-1 text-lg font-bold',
              scenario.meetsMinimumCash ? 'text-success-600' : 'text-danger-600'
            )}>
              {formatLargeNumber(scenario.totalCash)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-slate-500">Shares Redeemed</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {scenario.sharesRedeemed.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-slate-500">Public Ownership</p>
            <p className="mt-1 text-lg font-bold text-blue-600">
              {formatPercent(scenario.publicOwnership)}
            </p>
          </div>
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-slate-500">Status</p>
            <div className="mt-1 flex items-center gap-1">
              {scenario.meetsMinimumCash ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success-600" />
                  <span className="font-medium text-success-600">Viable</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-danger-600" />
                  <span className="font-medium text-danger-600">Shortfall</span>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SCENARIO CARD
// ============================================================================

interface ScenarioCardProps {
  scenario: RedemptionScenario;
  isSelected?: boolean;
  isHighlighted?: boolean;
  onClick?: () => void;
}

function ScenarioCard({ scenario, isSelected, isHighlighted, onClick }: ScenarioCardProps) {
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
          <span className="text-2xl font-bold text-slate-900">{scenario.redemptionRate}%</span>
        </div>
        {!scenario.meetsMinimumCash ? (
          <Badge variant="danger" size="sm">
            <XCircle className="mr-1 h-3 w-3" />
            Shortfall
          </Badge>
        ) : (
          <Badge variant="success" size="sm">
            <CheckCircle className="mr-1 h-3 w-3" />
            Viable
          </Badge>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Total Cash</span>
          <span className={cn(
            'text-sm font-semibold',
            scenario.meetsMinimumCash ? 'text-slate-900' : 'text-danger-600'
          )}>
            {formatLargeNumber(scenario.totalCash)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Cash/Share</span>
          <span className="text-sm font-semibold text-slate-900">
            {formatCurrency(scenario.cashPerShare)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Shares Redeemed</span>
          <span className="text-sm text-slate-700">
            {scenario.sharesRedeemed.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Ownership bar */}
      <div className="mt-4">
        <p className="mb-1 text-xs text-slate-500">Ownership Split</p>
        <div className="flex h-3 overflow-hidden rounded-full">
          <div
            className="bg-blue-500 transition-all"
            style={{ width: `${scenario.publicOwnership}%` }}
            title={`Public: ${formatPercent(scenario.publicOwnership)}`}
          />
          <div
            className="bg-violet-500 transition-all"
            style={{ width: `${scenario.sponsorOwnership}%` }}
            title={`Sponsor: ${formatPercent(scenario.sponsorOwnership)}`}
          />
          <div
            className="bg-teal-500 transition-all"
            style={{ width: `${scenario.targetOwnership}%` }}
            title={`Target: ${formatPercent(scenario.targetOwnership)}`}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs">
          <span className="text-blue-600">{formatPercent(scenario.publicOwnership)}</span>
          <span className="text-violet-600">{formatPercent(scenario.sponsorOwnership)}</span>
          <span className="text-teal-600">{formatPercent(scenario.targetOwnership)}</span>
        </div>
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
  className,
}: RedemptionScenariosProps) {
  const [selectedRate, setSelectedRate] = useState<number>(50);
  const [sliderValue, setSliderValue] = useState<number>(50);
  const scenarioRates = customScenarios || DEFAULT_SCENARIOS;

  // Calculate all preset scenarios
  const calculatedScenarios = useMemo(() => {
    return scenarioRates.map((rate) => calculateScenario(inputs, rate));
  }, [inputs, scenarioRates]);

  // Calculate slider scenario
  const sliderScenario = useMemo(() => {
    return calculateScenario(inputs, sliderValue);
  }, [inputs, sliderValue]);

  // Find max redemption rate that still meets minimum cash
  const maxViableRedemption = useMemo(() => {
    for (let rate = 100; rate >= 0; rate--) {
      const scenario = calculateScenario(inputs, rate);
      if (scenario.meetsMinimumCash) {return rate;}
    }
    return 0;
  }, [inputs]);

  // Chart data with more granularity
  const chartData = useMemo(() => {
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

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">
            Model impact of various redemption levels on transaction economics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant={maxViableRedemption >= 75 ? 'success' : maxViableRedemption >= 50 ? 'warning' : 'danger'}
            size="lg"
          >
            Max Viable: {maxViableRedemption}%
          </Badge>
        </div>
      </div>

      {/* Interactive Slider */}
      <ScenarioSlider
        value={sliderValue}
        onChange={setSliderValue}
        scenario={sliderScenario}
      />

      {/* Scenario Cards Grid */}
      <div>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Preset Scenarios</h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
      </div>

      {/* Charts */}
      {showCharts && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ownership Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary-600" />
                Ownership by Redemption Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
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
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
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
                    <ReferenceLine
                      x={sliderValue}
                      stroke="#1F2937"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Cash Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary-600" />
                Cash Available by Redemption Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
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
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(0)}M`}
                    />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend />
                    <ReferenceLine
                      y={inputs.minimumCash}
                      stroke={CHART_COLORS.threshold}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label={{
                        value: `Min: $${(inputs.minimumCash / 1000000).toFixed(0)}M`,
                        position: 'right',
                        fill: CHART_COLORS.threshold,
                        fontSize: 11,
                      }}
                    />
                    <Bar
                      dataKey="cashFromTrust"
                      stackId="cash"
                      fill="#93C5FD"
                      name="From Trust"
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
                      strokeWidth={3}
                      dot={false}
                      name="Total"
                    />
                    <ReferenceLine
                      x={sliderValue}
                      stroke="#1F2937"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    <ReferenceLine
                      x={maxViableRedemption}
                      stroke="#F59E0B"
                      strokeWidth={2}
                      label={{
                        value: 'Max Viable',
                        position: 'top',
                        fill: '#F59E0B',
                        fontSize: 10,
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Table */}
      {showDetailedTable && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary-600" />
              Detailed Scenario Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
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
                      $/Share
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
                  {calculatedScenarios.map((scenario) => (
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
                        {scenario.sharesRedeemed.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {formatLargeNumber(scenario.cashFromTrust)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                        {formatLargeNumber(scenario.totalCash)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-slate-600">
                        {formatCurrency(scenario.cashPerShare)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-blue-600 font-medium">
                        {formatPercent(scenario.publicOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-violet-600 font-medium">
                        {formatPercent(scenario.sponsorOwnership)}
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-teal-600 font-medium">
                        {formatPercent(scenario.targetOwnership)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {scenario.meetsMinimumCash ? (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Viable
                          </Badge>
                        ) : (
                          <Badge variant="danger" size="sm">
                            <XCircle className="mr-1 h-3 w-3" />
                            Shortfall
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Trust: {formatLargeNumber(inputs.trustValue)} | PIPE: {formatLargeNumber(inputs.pipeCommitment)}
            </span>
            <span>
              Minimum Cash Requirement: {formatLargeNumber(inputs.minimumCash)}
            </span>
          </CardFooter>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm text-slate-600">Public Shareholders</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-violet-500" />
          <span className="text-sm text-slate-600">Sponsor</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-teal-500" />
          <span className="text-sm text-slate-600">Target Company</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-1 w-6 border-t-2 border-dashed border-danger-500" />
          <span className="text-sm text-slate-600">Minimum Cash</span>
        </div>
      </div>
    </div>
  );
}
