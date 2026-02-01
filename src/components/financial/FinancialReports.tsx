'use client';

import { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  DollarSign,
  ArrowRight,
  ArrowDown,
  Calculator,
  Building2,
  TrendingUp,
  Briefcase,
  FileSpreadsheet,
  FileDown,
  Printer,
  Share2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatLargeNumber, formatPercent, formatDate, formatCurrency } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ReportType = 'pro_forma' | 'sources_uses' | 'transaction_summary' | 'valuation';

interface LineItem {
  label: string;
  value: number;
  subItems?: LineItem[];
  isSubtotal?: boolean;
  isTotal?: boolean;
  notes?: string;
}

interface ProFormaData {
  revenue: LineItem[];
  costOfRevenue: LineItem[];
  operatingExpenses: LineItem[];
  otherIncome: LineItem[];
  adjustments: LineItem[];
}

interface SourcesUsesData {
  sources: LineItem[];
  uses: LineItem[];
}

interface TransactionSummaryData {
  dealTerms: Array<{ label: string; value: string }>;
  keyMetrics: Array<{ label: string; value: string; change?: string }>;
  timeline: Array<{ date: string; event: string; status: 'completed' | 'pending' | 'upcoming' }>;
}

interface FinancialReportsProps {
  spacName: string;
  targetName: string;
  proFormaData: ProFormaData;
  sourcesUsesData: SourcesUsesData;
  transactionSummary: TransactionSummaryData;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  className?: string;
}

// ============================================================================
// MOCK DATA - Soren Acquisition Corporation
// ============================================================================

export const SOREN_FINANCIAL_REPORTS: Omit<FinancialReportsProps, 'className' | 'onExportExcel' | 'onExportPDF' | 'onPrint'> = {
  spacName: 'Soren Acquisition Corporation',
  targetName: 'TechCorp Inc.',
  proFormaData: {
    revenue: [
      { label: 'Product Revenue', value: 125000000 },
      { label: 'Service Revenue', value: 35000000 },
      { label: 'Subscription Revenue', value: 40000000 },
      { label: 'Total Revenue', value: 200000000, isSubtotal: true },
    ],
    costOfRevenue: [
      { label: 'Cost of Product', value: 50000000 },
      { label: 'Cost of Services', value: 14000000 },
      { label: 'Cost of Subscriptions', value: 8000000 },
      { label: 'Total Cost of Revenue', value: 72000000, isSubtotal: true },
    ],
    operatingExpenses: [
      { label: 'Research & Development', value: 35000000 },
      { label: 'Sales & Marketing', value: 45000000 },
      { label: 'General & Administrative', value: 18000000 },
      { label: 'Total Operating Expenses', value: 98000000, isSubtotal: true },
    ],
    otherIncome: [
      { label: 'Interest Income', value: 2000000 },
      { label: 'Other Income', value: 500000 },
      { label: 'Total Other Income', value: 2500000, isSubtotal: true },
    ],
    adjustments: [
      { label: 'Transaction Costs (one-time)', value: -15000000, notes: 'Legal, accounting, advisory' },
      { label: 'Stock-based Compensation', value: -12000000 },
      { label: 'Public Company Costs', value: -5000000, notes: 'Annual recurring' },
      { label: 'Synergies', value: 3000000, notes: 'Expected cost savings' },
      { label: 'Total Adjustments', value: -29000000, isSubtotal: true },
    ],
  },
  sourcesUsesData: {
    sources: [
      { label: 'Cash Held in Trust', value: 261350000, notes: 'Assuming 0% redemption' },
      { label: 'PIPE Investment', value: 75000000, notes: '7.5M shares @ $10.00' },
      { label: 'Target Cash on Balance Sheet', value: 25000000 },
      { label: 'Total Sources', value: 361350000, isTotal: true },
    ],
    uses: [
      { label: 'Cash to Target Shareholders', value: 200000000 },
      { label: 'Cash to Target Balance Sheet', value: 100000000 },
      { label: 'Transaction Expenses', value: 35000000, subItems: [
        { label: 'Legal Fees', value: 12000000 },
        { label: 'Accounting Fees', value: 5000000 },
        { label: 'Advisory Fees', value: 15000000 },
        { label: 'Other Expenses', value: 3000000 },
      ]},
      { label: 'Cash to Pro Forma Balance Sheet', value: 26350000 },
      { label: 'Total Uses', value: 361350000, isTotal: true },
    ],
  },
  transactionSummary: {
    dealTerms: [
      { label: 'Enterprise Value', value: '$575M' },
      { label: 'Equity Value', value: '$500M' },
      { label: 'Pro Forma Cash', value: '$126.4M' },
      { label: 'Pro Forma Debt', value: '$0M' },
      { label: 'Implied EV/Revenue', value: '2.9x' },
      { label: 'Implied EV/EBITDA', value: '19.2x' },
    ],
    keyMetrics: [
      { label: 'LTM Revenue', value: '$200M', change: '+35% YoY' },
      { label: 'LTM EBITDA', value: '$30M', change: '+42% YoY' },
      { label: 'EBITDA Margin', value: '15%', change: '+200bps' },
      { label: 'Revenue Growth (3Y CAGR)', value: '40%' },
      { label: 'Gross Margin', value: '64%' },
      { label: 'Rule of 40', value: '55%' },
    ],
    timeline: [
      { date: '2024-10-15', event: 'Definitive Agreement Signed', status: 'completed' },
      { date: '2024-11-01', event: 'PIPE Commitment Secured', status: 'completed' },
      { date: '2024-12-01', event: 'S-4 Filed with SEC', status: 'completed' },
      { date: '2025-01-15', event: 'S-4 Declared Effective', status: 'pending' },
      { date: '2025-02-01', event: 'Shareholder Vote', status: 'upcoming' },
      { date: '2025-02-15', event: 'Transaction Close', status: 'upcoming' },
    ],
  },
};

// ============================================================================
// LINE ITEM ROW
// ============================================================================

interface LineItemRowProps {
  item: LineItem;
  depth?: number;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function LineItemRow({ item, depth = 0, isExpanded, onToggle }: LineItemRowProps) {
  const hasSubItems = item.subItems && item.subItems.length > 0;

  return (
    <>
      <tr
        className={cn(
          'border-t border-slate-100',
          item.isSubtotal && 'bg-slate-50 font-medium',
          item.isTotal && 'bg-slate-100 font-bold',
          hasSubItems && 'cursor-pointer hover:bg-slate-50'
        )}
        onClick={hasSubItems ? onToggle : undefined}
      >
        <td
          className={cn('px-4 py-2 text-sm text-slate-700')}
          style={{ paddingLeft: `${16 + depth * 20}px` }}
        >
          <div className="flex items-center gap-2">
            {hasSubItems && (
              <span className="text-slate-400">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </span>
            )}
            <span className={cn(item.isSubtotal || item.isTotal ? 'font-medium' : '')}>{item.label}</span>
            {item.notes && (
              <span className="text-xs text-slate-400">({item.notes})</span>
            )}
          </div>
        </td>
        <td
          className={cn(
            'px-4 py-2 text-right text-sm',
            item.value < 0 ? 'text-danger-600' : 'text-slate-900',
            (item.isSubtotal || item.isTotal) && 'font-semibold'
          )}
        >
          {item.value < 0 ? '(' : ''}{formatCurrency(Math.abs(item.value))}{item.value < 0 ? ')' : ''}
        </td>
      </tr>
      {isExpanded && item.subItems?.map((subItem, idx) => (
        <LineItemRow key={idx} item={subItem} depth={depth + 1} />
      ))}
    </>
  );
}

// ============================================================================
// PRO FORMA INCOME STATEMENT
// ============================================================================

interface ProFormaStatementProps {
  data: ProFormaData;
  period?: string;
}

function ProFormaStatement({ data, period = 'LTM' }: ProFormaStatementProps) {
  // Calculate totals
  const grossProfit = (data.revenue.find(r => r.isSubtotal)?.value || 0) -
    (data.costOfRevenue.find(r => r.isSubtotal)?.value || 0);
  const operatingIncome = grossProfit -
    (data.operatingExpenses.find(r => r.isSubtotal)?.value || 0);
  const otherIncome = data.otherIncome.find(r => r.isSubtotal)?.value || 0;
  const adjustments = data.adjustments.find(r => r.isSubtotal)?.value || 0;
  const adjustedEBITDA = operatingIncome + otherIncome;
  const proFormaNetIncome = adjustedEBITDA + adjustments;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary-600" />
          Pro Forma Income Statement
        </CardTitle>
        <Badge variant="secondary">{period}</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                  Line Item
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Revenue */}
              <tr className="bg-primary-50/50">
                <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-primary-700 uppercase">
                  Revenue
                </td>
              </tr>
              {data.revenue.map((item, idx) => (
                <LineItemRow key={`rev-${idx}`} item={item} />
              ))}

              {/* Cost of Revenue */}
              <tr className="bg-primary-50/50">
                <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-primary-700 uppercase">
                  Cost of Revenue
                </td>
              </tr>
              {data.costOfRevenue.map((item, idx) => (
                <LineItemRow key={`cor-${idx}`} item={item} />
              ))}

              {/* Gross Profit */}
              <tr className="border-t-2 border-slate-200 bg-slate-100">
                <td className="px-4 py-2 text-sm font-bold text-slate-900">Gross Profit</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                  {formatCurrency(grossProfit)}
                </td>
              </tr>
              <tr className="bg-slate-50">
                <td className="px-4 py-1 text-xs text-slate-500">Gross Margin</td>
                <td className="px-4 py-1 text-right text-xs text-slate-500">
                  {formatPercent((grossProfit / (data.revenue.find(r => r.isSubtotal)?.value || 1)) * 100)}
                </td>
              </tr>

              {/* Operating Expenses */}
              <tr className="bg-primary-50/50">
                <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-primary-700 uppercase">
                  Operating Expenses
                </td>
              </tr>
              {data.operatingExpenses.map((item, idx) => (
                <LineItemRow key={`opex-${idx}`} item={item} />
              ))}

              {/* Operating Income */}
              <tr className="border-t-2 border-slate-200 bg-slate-100">
                <td className="px-4 py-2 text-sm font-bold text-slate-900">Operating Income (EBIT)</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                  {formatCurrency(operatingIncome)}
                </td>
              </tr>

              {/* Other Income */}
              <tr className="bg-primary-50/50">
                <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-primary-700 uppercase">
                  Other Income / Expense
                </td>
              </tr>
              {data.otherIncome.map((item, idx) => (
                <LineItemRow key={`other-${idx}`} item={item} />
              ))}

              {/* Adjusted EBITDA */}
              <tr className="border-t-2 border-slate-200 bg-violet-50">
                <td className="px-4 py-2 text-sm font-bold text-violet-900">Adjusted EBITDA</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-violet-900">
                  {formatCurrency(adjustedEBITDA)}
                </td>
              </tr>
              <tr className="bg-violet-50/50">
                <td className="px-4 py-1 text-xs text-violet-600">EBITDA Margin</td>
                <td className="px-4 py-1 text-right text-xs text-violet-600">
                  {formatPercent((adjustedEBITDA / (data.revenue.find(r => r.isSubtotal)?.value || 1)) * 100)}
                </td>
              </tr>

              {/* Pro Forma Adjustments */}
              <tr className="bg-primary-50/50">
                <td colSpan={2} className="px-4 py-2 text-xs font-semibold text-primary-700 uppercase">
                  Pro Forma Adjustments
                </td>
              </tr>
              {data.adjustments.map((item, idx) => (
                <LineItemRow key={`adj-${idx}`} item={item} />
              ))}

              {/* Pro Forma Net Income */}
              <tr className="border-t-2 border-slate-300 bg-primary-100">
                <td className="px-4 py-3 text-sm font-bold text-primary-900">Pro Forma Adjusted EBITDA</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-primary-900">
                  {formatCurrency(proFormaNetIncome)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SOURCES AND USES
// ============================================================================

interface SourcesUsesProps {
  data: SourcesUsesData;
}

function SourcesUses({ data }: SourcesUsesProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (label: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const totalSources = data.sources.find(s => s.isTotal)?.value || 0;
  const totalUses = data.uses.find(u => u.isTotal)?.value || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary-600" />
          Sources and Uses of Funds
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid md:grid-cols-2">
          {/* Sources */}
          <div className="border-b md:border-b-0 md:border-r border-slate-200">
            <div className="bg-success-50 px-4 py-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-success-700">
                <ArrowDown className="h-4 w-4" />
                Sources
              </h4>
            </div>
            <table className="w-full">
              <tbody>
                {data.sources.map((item, idx) => (
                  <LineItemRow
                    key={`source-${idx}`}
                    item={item}
                    isExpanded={expandedItems.has(item.label)}
                    onToggle={() => toggleItem(item.label)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Uses */}
          <div>
            <div className="bg-danger-50 px-4 py-3">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-danger-700">
                <ArrowRight className="h-4 w-4" />
                Uses
              </h4>
            </div>
            <table className="w-full">
              <tbody>
                {data.uses.map((item, idx) => (
                  <LineItemRow
                    key={`use-${idx}`}
                    item={item}
                    isExpanded={expandedItems.has(item.label)}
                    onToggle={() => toggleItem(item.label)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-slate-50">
        <span className="text-sm text-slate-600">
          {totalSources === totalUses ? (
            <span className="flex items-center gap-2 text-success-600">
              <Badge variant="success" size="sm">Balanced</Badge>
              Sources equal Uses
            </span>
          ) : (
            <span className="flex items-center gap-2 text-danger-600">
              <Badge variant="danger" size="sm">Imbalanced</Badge>
              Difference: {formatCurrency(Math.abs(totalSources - totalUses))}
            </span>
          )}
        </span>
        <span className="text-xs text-slate-500">Click items with sub-lines to expand</span>
      </CardFooter>
    </Card>
  );
}

// ============================================================================
// TRANSACTION SUMMARY
// ============================================================================

interface TransactionSummaryProps {
  data: TransactionSummaryData;
  spacName: string;
  targetName: string;
}

function TransactionSummary({ data, spacName, targetName }: TransactionSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary-600" />
          Transaction Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deal Terms */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Building2 className="h-4 w-4" />
            Deal Terms
          </h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {data.dealTerms.map((term, idx) => (
              <div key={idx} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{term.label}</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{term.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <TrendingUp className="h-4 w-4" />
            Key Financial Metrics
          </h4>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {data.keyMetrics.map((metric, idx) => (
              <div key={idx} className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs text-slate-500">{metric.label}</p>
                <div className="mt-1 flex items-end justify-between">
                  <p className="text-lg font-semibold text-slate-900">{metric.value}</p>
                  {metric.change && (
                    <span className="text-xs font-medium text-success-600">{metric.change}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Clock className="h-4 w-4" />
            Transaction Timeline
          </h4>
          <div className="space-y-3">
            {data.timeline.map((event, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-4 rounded-lg border p-3',
                  event.status === 'completed' && 'border-success-200 bg-success-50/50',
                  event.status === 'pending' && 'border-warning-200 bg-warning-50/50',
                  event.status === 'upcoming' && 'border-slate-200'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full',
                    event.status === 'completed' && 'bg-success-100 text-success-600',
                    event.status === 'pending' && 'bg-warning-100 text-warning-600',
                    event.status === 'upcoming' && 'bg-slate-100 text-slate-500'
                  )}
                >
                  {event.status === 'completed' && <span className="text-sm font-bold">&#10003;</span>}
                  {event.status === 'pending' && <Clock className="h-4 w-4" />}
                  {event.status === 'upcoming' && <span className="text-xs font-bold">{idx + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{event.event}</p>
                  <p className="text-xs text-slate-500">{formatDate(event.date)}</p>
                </div>
                <Badge
                  variant={
                    event.status === 'completed' ? 'success' :
                    event.status === 'pending' ? 'warning' : 'secondary'
                  }
                  size="sm"
                >
                  {event.status === 'completed' ? 'Completed' :
                   event.status === 'pending' ? 'In Progress' : 'Upcoming'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FinancialReports({
  spacName,
  targetName,
  proFormaData,
  sourcesUsesData,
  transactionSummary,
  onExportExcel,
  onExportPDF,
  onPrint,
  className,
}: FinancialReportsProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('transaction_summary');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Reports</h2>
          <p className="text-sm text-slate-500">
            {spacName} + {targetName} Business Combination
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportExcel && (
            <Button variant="secondary" size="sm" onClick={onExportExcel}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          )}
          {onExportPDF && (
            <Button variant="secondary" size="sm" onClick={onExportPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              PDF
            </Button>
          )}
          {onPrint && (
            <Button variant="secondary" size="sm" onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          )}
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeReport === 'transaction_summary'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-600 hover:text-slate-900'
          )}
          onClick={() => setActiveReport('transaction_summary')}
        >
          Transaction Summary
        </button>
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeReport === 'sources_uses'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-600 hover:text-slate-900'
          )}
          onClick={() => setActiveReport('sources_uses')}
        >
          Sources & Uses
        </button>
        <button
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            activeReport === 'pro_forma'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-600 hover:text-slate-900'
          )}
          onClick={() => setActiveReport('pro_forma')}
        >
          Pro Forma Financials
        </button>
      </div>

      {/* Active Report Content */}
      {activeReport === 'transaction_summary' && (
        <TransactionSummary
          data={transactionSummary}
          spacName={spacName}
          targetName={targetName}
        />
      )}

      {activeReport === 'sources_uses' && (
        <SourcesUses data={sourcesUsesData} />
      )}

      {activeReport === 'pro_forma' && (
        <ProFormaStatement data={proFormaData} />
      )}

      {/* Footer */}
      <Card className="bg-slate-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              <RefreshCw className="mr-1 inline h-3 w-3" />
              Last updated: {new Date().toLocaleDateString()}
            </span>
            <span>
              All figures are projected and subject to change based on final transaction terms
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
