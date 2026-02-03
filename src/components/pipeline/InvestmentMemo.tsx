'use client';

import { useState, useCallback } from 'react';

import {
  FileText,
  Copy,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Users,
  ThumbsUp,
  Sparkles,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { cn, formatLargeNumber } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface InvestmentMemoProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    id: string;
    name: string;
    sector?: string;
    description?: string;
    valuation?: number;
    revenue?: number;
    ebitda?: number;
  };
}

interface MemoSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
}

interface InvestmentMemoData {
  executiveSummary: string;
  investmentThesis: string;
  keyRisks: string;
  financialAnalysis: string;
  managementAssessment: string;
  recommendation: string;
  generatedAt: Date;
}

// ============================================================================
// Helper Components
// ============================================================================

function MemoSectionCard({
  title,
  icon: Icon,
  content,
  isLoading,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: string;
  isLoading: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-slate-50 py-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-4">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-200" />
          </div>
        ) : (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {content || 'No content generated yet.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ onGenerate, isLoading }: { onGenerate: () => void; isLoading: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
        <Sparkles className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">Generate Investment Memo</h3>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Use AI to generate a comprehensive investment memo based on the target company's profile and
        available data.
      </p>
      <Button className="mt-6" onClick={onGenerate} isLoading={isLoading}>
        <Sparkles className="mr-2 h-4 w-4" />
        Generate Memo
      </Button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function InvestmentMemo({ isOpen, onClose, target }: InvestmentMemoProps) {
  const [memo, setMemo] = useState<InvestmentMemoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateMemo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the AI scoring API with 'thesis' operation
      const response = await fetch('/api/ai/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: {
            name: target.name,
            industry: target.sector || 'Technology',
            sector: target.sector,
            description: target.description || `${target.name} is a company in the ${target.sector || 'technology'} sector.`,
            enterpriseValue: target.valuation,
            revenue: target.revenue,
            ebitda: target.ebitda,
          },
          operation: 'thesis',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate investment memo');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate investment memo');
      }

      const thesisData = result.data;

      // Transform the thesis data into memo sections
      setMemo({
        executiveSummary: thesisData.summary || 'Executive summary not available.',
        investmentThesis: thesisData.thesis || 'Investment thesis not available.',
        keyRisks: Array.isArray(thesisData.keyArguments)
          ? `Key Investment Arguments:\n${thesisData.keyArguments.map((arg: string, i: number) => `${i + 1}. ${arg}`).join('\n')}`
          : 'Risk analysis not available.',
        financialAnalysis: thesisData.potentialReturns
          ? `Potential Returns:\n${thesisData.potentialReturns}\n\nTime Horizon: ${thesisData.timeHorizon || 'Not specified'}`
          : 'Financial analysis not available.',
        managementAssessment: 'Management assessment requires additional data gathering.',
        recommendation: Array.isArray(thesisData.exitStrategies)
          ? `Exit Strategies:\n${thesisData.exitStrategies.map((strategy: string, i: number) => `${i + 1}. ${strategy}`).join('\n')}`
          : 'Recommendation not available.',
        generatedAt: new Date(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [target]);

  const copyToClipboard = useCallback(async () => {
    if (!memo) {
      return;
    }

    const memoText = `
INVESTMENT MEMO: ${target.name}
Generated: ${memo.generatedAt.toLocaleDateString()}

═══════════════════════════════════════════════════════════════════════════════

EXECUTIVE SUMMARY
─────────────────
${memo.executiveSummary}

INVESTMENT THESIS
─────────────────
${memo.investmentThesis}

KEY RISKS & CONSIDERATIONS
──────────────────────────
${memo.keyRisks}

FINANCIAL ANALYSIS
──────────────────
${memo.financialAnalysis}

MANAGEMENT ASSESSMENT
─────────────────────
${memo.managementAssessment}

RECOMMENDATION
──────────────
${memo.recommendation}

═══════════════════════════════════════════════════════════════════════════════
Generated by SPAC OS AI
    `.trim();

    try {
      await navigator.clipboard.writeText(memoText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  }, [memo, target.name]);

  const exportAsDocument = useCallback(() => {
    // Wire to document creation later - for now, just show an alert
    alert('Export functionality will be connected to document creation in a future update.');
  }, []);

  const sections: MemoSection[] = memo
    ? [
        {
          id: 'executive-summary',
          title: 'Executive Summary',
          icon: FileText,
          content: memo.executiveSummary,
        },
        {
          id: 'investment-thesis',
          title: 'Investment Thesis',
          icon: TrendingUp,
          content: memo.investmentThesis,
        },
        {
          id: 'key-risks',
          title: 'Key Risks & Considerations',
          icon: AlertTriangle,
          content: memo.keyRisks,
        },
        {
          id: 'financial-analysis',
          title: 'Financial Analysis',
          icon: BarChart3,
          content: memo.financialAnalysis,
        },
        {
          id: 'management-assessment',
          title: 'Management Assessment',
          icon: Users,
          content: memo.managementAssessment,
        },
        {
          id: 'recommendation',
          title: 'Recommendation',
          icon: ThumbsUp,
          content: memo.recommendation,
        },
      ]
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalHeader>
        <ModalTitle>Investment Memo</ModalTitle>
        <ModalDescription>
          AI-generated investment memo for {target.name}
          {target.valuation && ` (EV: ${formatLargeNumber(target.valuation)})`}
        </ModalDescription>
      </ModalHeader>

      <ModalBody className="max-h-[60vh] overflow-y-auto">
        {error && (
          <div className="mb-4 rounded-lg border border-danger-200 bg-danger-50 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
              <p className="text-sm font-medium text-danger-800">Error generating memo</p>
            </div>
            <p className="mt-1 text-sm text-danger-700">{error}</p>
          </div>
        )}

        {!memo && !isLoading && !error && (
          <EmptyState onGenerate={generateMemo} isLoading={isLoading} />
        )}

        {(memo || isLoading) && (
          <div className="space-y-4">
            {/* Target Info Banner */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900">{target.name}</h3>
                  <p className="text-sm text-slate-500">{target.sector || 'Sector not specified'}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  {target.valuation && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Valuation</p>
                      <p className="font-semibold text-slate-900">
                        {formatLargeNumber(target.valuation)}
                      </p>
                    </div>
                  )}
                  {target.revenue && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Revenue</p>
                      <p className="font-semibold text-slate-900">
                        {formatLargeNumber(target.revenue)}
                      </p>
                    </div>
                  )}
                  {target.ebitda && (
                    <div className="text-right">
                      <p className="text-xs text-slate-500">EBITDA</p>
                      <p className="font-semibold text-slate-900">
                        {formatLargeNumber(target.ebitda)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Memo Sections */}
            {isLoading && !memo ? (
              // Show all sections as loading
              <>
                <MemoSectionCard
                  title="Executive Summary"
                  icon={FileText}
                  content=""
                  isLoading={true}
                />
                <MemoSectionCard
                  title="Investment Thesis"
                  icon={TrendingUp}
                  content=""
                  isLoading={true}
                />
                <MemoSectionCard
                  title="Key Risks & Considerations"
                  icon={AlertTriangle}
                  content=""
                  isLoading={true}
                />
                <MemoSectionCard
                  title="Financial Analysis"
                  icon={BarChart3}
                  content=""
                  isLoading={true}
                />
                <MemoSectionCard
                  title="Management Assessment"
                  icon={Users}
                  content=""
                  isLoading={true}
                />
                <MemoSectionCard
                  title="Recommendation"
                  icon={ThumbsUp}
                  content=""
                  isLoading={true}
                />
              </>
            ) : (
              sections.map((section) => (
                <MemoSectionCard
                  key={section.id}
                  title={section.title}
                  icon={section.icon}
                  content={section.content}
                  isLoading={false}
                />
              ))
            )}

            {/* Generated timestamp */}
            {memo && (
              <p className="text-center text-xs text-slate-400">
                Generated on {memo.generatedAt.toLocaleString()} by SPAC OS AI
              </p>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="justify-between">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>

        <div className="flex items-center gap-2">
          {memo && (
            <>
              <Button variant="secondary" onClick={generateMemo} isLoading={isLoading}>
                <RefreshCw className={cn('mr-2 h-4 w-4', isLoading && 'animate-spin')} />
                Regenerate
              </Button>

              <Button variant="secondary" onClick={copyToClipboard}>
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-success-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>

              <Button variant="secondary" onClick={exportAsDocument}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </>
          )}

          {!memo && !isLoading && (
            <Button onClick={generateMemo} isLoading={isLoading}>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Memo
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  );
}

export default InvestmentMemo;
