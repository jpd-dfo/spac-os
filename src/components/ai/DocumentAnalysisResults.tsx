'use client';

// ============================================================================
// SPAC OS Document Analysis Results - Display AI Analysis Output
// ============================================================================

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type {
  DocumentAnalysisResult,
  DocumentSummary,
  RiskAnalysis,
  RiskItem,
  ContractTerms,
  FinancialData
} from '@/lib/ai/types';

// ============================================================================
// Types
// ============================================================================

interface DocumentAnalysisResultsProps {
  analysis: DocumentAnalysisResult;
  documentName?: string;
  onActionClick?: (action: string, data: unknown) => void;
  className?: string;
}

interface TabProps {
  id: string;
  label: string;
  count?: number;
}

// ============================================================================
// Icons
// ============================================================================

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const AlertIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CurrencyIcon = ({ className }: { className?: string }) => (
  <svg className={cn('h-5 w-5', className)} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================================================
// Risk Badge Component
// ============================================================================

function RiskSeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      colors[severity] || colors.medium
    )}>
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

// ============================================================================
// Collapsible Section Component
// ============================================================================

function CollapsibleSection({
  title,
  defaultOpen = false,
  count,
  icon,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  count?: number;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-200 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50"
      >
        <div className="flex items-center space-x-2">
          {icon}
          <span className="font-medium text-slate-900">{title}</span>
          {count !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {count}
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={cn('text-slate-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

// ============================================================================
// Summary Section Component
// ============================================================================

function SummarySection({ summary }: { summary: DocumentSummary }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-2 text-sm font-medium text-slate-700">Overview</h4>
        <p className="text-sm text-slate-600">{summary.overview}</p>
      </div>

      {summary.keyFindings?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Key Findings</h4>
          <ul className="space-y-1">
            {summary.keyFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm text-slate-600">
                <CheckIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.importantMetrics && Object.keys(summary.importantMetrics).length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Important Metrics</h4>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(summary.importantMetrics).map(([key, value]) => (
              <div key={key} className="rounded-lg bg-slate-50 p-2">
                <p className="text-xs text-slate-500">{key}</p>
                <p className="font-medium text-slate-900">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary.risksAndConcerns?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Risks & Concerns</h4>
          <ul className="space-y-1">
            {summary.risksAndConcerns.map((risk, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm text-slate-600">
                <AlertIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.recommendations?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Recommendations</h4>
          <ul className="space-y-1">
            {summary.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start space-x-2 text-sm text-slate-600">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                  {idx + 1}
                </span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Risk Item Component
// ============================================================================

function RiskItemCard({ risk }: { risk: RiskItem }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <div className="flex items-center space-x-3">
          <RiskSeverityBadge severity={risk.severity} />
          <span className="font-medium text-slate-900">{risk.title}</span>
        </div>
        <ChevronDownIcon
          className={cn('text-slate-400 transition-transform', isExpanded && 'rotate-180')}
        />
      </button>
      {isExpanded && (
        <div className="border-t border-slate-200 p-3 space-y-3">
          <div>
            <p className="text-xs font-medium text-slate-500">Description</p>
            <p className="text-sm text-slate-700">{risk.description}</p>
          </div>
          {risk.impact && (
            <div>
              <p className="text-xs font-medium text-slate-500">Impact</p>
              <p className="text-sm text-slate-700">{risk.impact}</p>
            </div>
          )}
          {risk.mitigation && (
            <div>
              <p className="text-xs font-medium text-slate-500">Mitigation</p>
              <p className="text-sm text-slate-700">{risk.mitigation}</p>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-500">Category:</span>
            <Badge variant="secondary">{risk.category}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Risk Analysis Section Component
// ============================================================================

function RiskAnalysisSection({ analysis }: { analysis: RiskAnalysis }) {
  return (
    <div className="space-y-4">
      {/* Risk Summary */}
      <div className="rounded-lg bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Overall Risk Level</span>
          <RiskSeverityBadge severity={analysis.overallRiskLevel} />
        </div>
        <p className="text-sm text-slate-600">{analysis.summary}</p>
      </div>

      {/* Risk by Severity */}
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(analysis.risksBySeverity).map(([severity, count]) => (
          <div
            key={severity}
            className={cn(
              'rounded-lg p-2 text-center',
              severity === 'critical' && 'bg-red-50',
              severity === 'high' && 'bg-orange-50',
              severity === 'medium' && 'bg-yellow-50',
              severity === 'low' && 'bg-green-50'
            )}
          >
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="text-xs capitalize text-slate-600">{severity}</p>
          </div>
        ))}
      </div>

      {/* Top Risks */}
      {analysis.topRisks?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Top Risks</h4>
          <div className="space-y-2">
            {analysis.topRisks.map((risk) => (
              <RiskItemCard key={risk.id} risk={risk} />
            ))}
          </div>
        </div>
      )}

      {/* All Risks */}
      {analysis.risks?.length > analysis.topRisks?.length && (
        <CollapsibleSection
          title="All Risks"
          count={analysis.risks.length}
          icon={<AlertIcon className="h-4 w-4 text-slate-500" />}
        >
          <div className="space-y-2">
            {analysis.risks.map((risk) => (
              <RiskItemCard key={risk.id} risk={risk} />
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ============================================================================
// Contract Terms Section Component
// ============================================================================

function ContractTermsSection({ terms }: { terms: ContractTerms }) {
  return (
    <div className="space-y-4">
      {/* Parties */}
      {terms.parties?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Parties</h4>
          <div className="space-y-2">
            {terms.parties.map((party, idx) => (
              <div key={idx} className="rounded-lg bg-slate-50 p-3">
                <p className="font-medium text-slate-900">{party.name}</p>
                <p className="text-sm text-slate-600">
                  {party.role} ({party.type})
                </p>
                {party.jurisdiction && (
                  <p className="text-xs text-slate-500">Jurisdiction: {party.jurisdiction}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Dates */}
      {terms.dates?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Key Dates</h4>
          <div className="space-y-2">
            {terms.dates.map((date, idx) => (
              <div key={idx} className="flex items-center justify-between rounded-lg bg-slate-50 p-3">
                <div>
                  <p className="font-medium text-slate-900">{date.type}</p>
                  <p className="text-sm text-slate-600">{date.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-slate-900">{date.date}</p>
                  {date.isDeadline && (
                    <Badge variant="danger">Deadline</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial Terms */}
      {terms.financialTerms && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Financial Terms</h4>
          <div className="rounded-lg bg-slate-50 p-3 space-y-2">
            {terms.financialTerms.purchasePrice && (
              <div className="flex justify-between">
                <span className="text-slate-600">Purchase Price</span>
                <span className="font-medium text-slate-900">{terms.financialTerms.purchasePrice}</span>
              </div>
            )}
            {terms.financialTerms.earnouts?.length > 0 && (
              <div>
                <p className="text-sm text-slate-500">Earnouts:</p>
                {terms.financialTerms.earnouts.map((earnout, idx) => (
                  <p key={idx} className="text-sm text-slate-700 ml-2">
                    - {earnout.description}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Key Terms Summary */}
      {terms.keyTermsSummary && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-slate-700">Key Terms Summary</h4>
          <p className="text-sm text-slate-600">{terms.keyTermsSummary}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Financial Data Section Component
// ============================================================================

function FinancialDataSection({ data }: { data: FinancialData }) {
  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Period</span>
        <Badge variant="secondary">{data.period}</Badge>
      </div>

      {/* Income Statement */}
      <CollapsibleSection
        title="Income Statement"
        defaultOpen
        icon={<CurrencyIcon className="h-4 w-4 text-slate-500" />}
      >
        <div className="grid grid-cols-2 gap-2">
          {data.incomeStatement.revenue && (
            <MetricCard label="Revenue" value={formatCurrency(data.incomeStatement.revenue)} />
          )}
          {data.incomeStatement.grossProfit && (
            <MetricCard label="Gross Profit" value={formatCurrency(data.incomeStatement.grossProfit)} />
          )}
          {data.incomeStatement.operatingIncome && (
            <MetricCard label="Operating Income" value={formatCurrency(data.incomeStatement.operatingIncome)} />
          )}
          {data.incomeStatement.netIncome && (
            <MetricCard label="Net Income" value={formatCurrency(data.incomeStatement.netIncome)} />
          )}
          {data.incomeStatement.ebitda && (
            <MetricCard label="EBITDA" value={formatCurrency(data.incomeStatement.ebitda)} />
          )}
        </div>
      </CollapsibleSection>

      {/* Balance Sheet */}
      <CollapsibleSection
        title="Balance Sheet"
        icon={<DocumentIcon className="h-4 w-4 text-slate-500" />}
      >
        <div className="grid grid-cols-2 gap-2">
          {data.balanceSheet.totalAssets && (
            <MetricCard label="Total Assets" value={formatCurrency(data.balanceSheet.totalAssets)} />
          )}
          {data.balanceSheet.totalLiabilities && (
            <MetricCard label="Total Liabilities" value={formatCurrency(data.balanceSheet.totalLiabilities)} />
          )}
          {data.balanceSheet.totalEquity && (
            <MetricCard label="Total Equity" value={formatCurrency(data.balanceSheet.totalEquity)} />
          )}
          {data.balanceSheet.cash && (
            <MetricCard label="Cash" value={formatCurrency(data.balanceSheet.cash)} />
          )}
          {data.balanceSheet.debt && (
            <MetricCard label="Debt" value={formatCurrency(data.balanceSheet.debt)} />
          )}
        </div>
      </CollapsibleSection>

      {/* Key Metrics */}
      {data.metrics && (
        <CollapsibleSection
          title="Key Metrics"
          icon={<DocumentIcon className="h-4 w-4 text-slate-500" />}
        >
          <div className="grid grid-cols-2 gap-2">
            {data.metrics.grossMargin && (
              <MetricCard label="Gross Margin" value={`${data.metrics.grossMargin.toFixed(1)}%`} />
            )}
            {data.metrics.operatingMargin && (
              <MetricCard label="Operating Margin" value={`${data.metrics.operatingMargin.toFixed(1)}%`} />
            )}
            {data.metrics.ebitdaMargin && (
              <MetricCard label="EBITDA Margin" value={`${data.metrics.ebitdaMargin.toFixed(1)}%`} />
            )}
            {data.metrics.revenueGrowth && (
              <MetricCard label="Revenue Growth" value={`${data.metrics.revenueGrowth.toFixed(1)}%`} />
            )}
            {data.metrics.currentRatio && (
              <MetricCard label="Current Ratio" value={data.metrics.currentRatio.toFixed(2)} />
            )}
            {data.metrics.debtToEquity && (
              <MetricCard label="Debt/Equity" value={data.metrics.debtToEquity.toFixed(2)} />
            )}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export function DocumentAnalysisResults({
  analysis,
  documentName,
  onActionClick,
  className,
}: DocumentAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState<string>('summary');

  // Determine available tabs based on analysis data
  const tabs: TabProps[] = [];

  if (analysis.summary) {
    tabs.push({ id: 'summary', label: 'Summary' });
  }
  if (analysis.riskAnalysis) {
    tabs.push({ id: 'risks', label: 'Risks', count: analysis.riskAnalysis.risks?.length });
  }
  if (analysis.contractTerms) {
    tabs.push({ id: 'contract', label: 'Contract Terms' });
  }
  if (analysis.financialData) {
    tabs.push({ id: 'financial', label: 'Financials' });
  }

  // Set default tab if current tab is not available
  if (!tabs.find(t => t.id === activeTab) && tabs.length > 0) {
    setActiveTab(tabs[0].id);
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Analysis Results</CardTitle>
            {documentName && (
              <p className="mt-1 text-sm text-slate-500">{documentName}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Analyzed</span>
            <span>{new Date(analysis.completedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Tabs */}
        {tabs.length > 1 && (
          <div className="mt-4 flex space-x-1 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-b-2 border-primary-600 text-primary-600'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {activeTab === 'summary' && analysis.summary && (
          <SummarySection summary={analysis.summary} />
        )}
        {activeTab === 'risks' && analysis.riskAnalysis && (
          <RiskAnalysisSection analysis={analysis.riskAnalysis} />
        )}
        {activeTab === 'contract' && analysis.contractTerms && (
          <ContractTermsSection terms={analysis.contractTerms} />
        )}
        {activeTab === 'financial' && analysis.financialData && (
          <FinancialDataSection data={analysis.financialData} />
        )}

        {/* Metadata */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-400">
          <span>Model: {analysis.metadata?.model || 'Claude'}</span>
          <span>
            Tokens: {analysis.metadata?.tokensUsed?.total?.toLocaleString() || 'N/A'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default DocumentAnalysisResults;
