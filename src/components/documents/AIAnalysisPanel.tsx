'use client';

import { useState, useEffect } from 'react';

import {
  X,
  Sparkles,
  FileText,
  AlertTriangle,
  Link2,
  CheckSquare,
  Tag,
  RefreshCw,
  Copy,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Scale,
  TrendingUp,
  Clock,
  BookOpen,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatDate } from '@/lib/utils';

import type { DocumentData } from './DocumentCard';

interface AIAnalysis {
  summary: string;
  keyTerms: { term: string; definition: string; importance: 'high' | 'medium' | 'low' }[];
  riskFlags: { severity: 'high' | 'medium' | 'low'; title: string; description: string; page?: number }[];
  relatedDocuments: { id: string; name: string; relevance: number; type: string }[];
  actionItems: { task: string; priority: 'high' | 'medium' | 'low'; assignee?: string; dueDate?: Date }[];
  insights: { type: string; content: string }[];
  financialHighlights?: { metric: string; value: string; change?: string }[];
}

interface AIAnalysisPanelProps {
  document: DocumentData;
  isOpen: boolean;
  onClose: () => void;
}

// Mock AI Analysis Data
const mockAnalysis: AIAnalysis = {
  summary: `This Due Diligence Report provides a comprehensive analysis of TechCorp Inc.'s financial position, operational capabilities, and market potential. The company demonstrates strong revenue growth (35% YoY) with a scalable SaaS business model. Key considerations include customer concentration risk (top 3 customers represent 45% of revenue) and ongoing litigation related to a patent dispute. The management team has extensive industry experience, and the technology platform shows strong competitive differentiation.`,
  keyTerms: [
    {
      term: 'Enterprise Value',
      definition: 'Total valuation of the company including debt and excluding cash, estimated at $450M',
      importance: 'high',
    },
    {
      term: 'ARR (Annual Recurring Revenue)',
      definition: 'Current ARR of $78M with 120% net revenue retention',
      importance: 'high',
    },
    {
      term: 'Earnout',
      definition: 'Additional $50M consideration contingent on achieving $100M ARR within 24 months',
      importance: 'high',
    },
    {
      term: 'Material Adverse Change (MAC)',
      definition: 'Standard MAC clause with carve-outs for general market conditions',
      importance: 'medium',
    },
    {
      term: 'PIPE Commitment',
      definition: '$75M committed PIPE financing from institutional investors',
      importance: 'medium',
    },
    {
      term: 'Lock-up Period',
      definition: '180-day lock-up for founders and early investors',
      importance: 'low',
    },
  ],
  riskFlags: [
    {
      severity: 'high',
      title: 'Customer Concentration',
      description: 'Top 3 customers account for 45% of total revenue, creating significant dependency risk',
      page: 24,
    },
    {
      severity: 'high',
      title: 'Pending Litigation',
      description: 'Patent infringement lawsuit filed by competitor with potential damages of $15M',
      page: 45,
    },
    {
      severity: 'medium',
      title: 'Key Person Dependency',
      description: 'CTO holds critical knowledge of core technology platform with limited documentation',
      page: 31,
    },
    {
      severity: 'medium',
      title: 'Regulatory Compliance',
      description: 'Pending SOC 2 Type II certification required by major enterprise customers',
      page: 38,
    },
    {
      severity: 'low',
      title: 'International Expansion',
      description: 'GDPR compliance gaps identified for European market entry plans',
      page: 52,
    },
  ],
  relatedDocuments: [
    { id: 'rel-1', name: 'TechCorp Financial Model v2.xlsx', relevance: 95, type: 'Financial' },
    { id: 'rel-2', name: 'NDA - TechCorp (Executed).pdf', relevance: 88, type: 'Legal' },
    { id: 'rel-3', name: 'Management Presentation Q4.pptx', relevance: 82, type: 'Presentation' },
    { id: 'rel-4', name: 'IP Due Diligence Summary.pdf', relevance: 78, type: 'Legal' },
    { id: 'rel-5', name: 'Customer Reference Calls.docx', relevance: 72, type: 'Due Diligence' },
  ],
  actionItems: [
    {
      task: 'Request updated customer concentration analysis with Q4 data',
      priority: 'high',
      assignee: 'Finance Team',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      task: 'Schedule call with litigation counsel regarding patent dispute status',
      priority: 'high',
      assignee: 'Legal Team',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    },
    {
      task: 'Review SOC 2 Type II certification timeline and requirements',
      priority: 'medium',
      assignee: 'Operations',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      task: 'Document CTO knowledge transfer plan and technical dependencies',
      priority: 'medium',
      assignee: 'Tech Team',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      task: 'Obtain updated GDPR compliance assessment',
      priority: 'low',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  ],
  insights: [
    {
      type: 'Opportunity',
      content: 'Strong product-market fit evidenced by 120% net revenue retention and low churn rates',
    },
    {
      type: 'Consideration',
      content: 'Valuation multiple (5.8x ARR) is above sector median but justified by growth trajectory',
    },
    {
      type: 'Recommendation',
      content: 'Consider negotiating earnout structure to mitigate customer concentration risk',
    },
  ],
  financialHighlights: [
    { metric: 'Revenue (TTM)', value: '$72.5M', change: '+35%' },
    { metric: 'ARR', value: '$78M', change: '+42%' },
    { metric: 'Gross Margin', value: '78%', change: '+3%' },
    { metric: 'CAC Payback', value: '14 months', change: '-2mo' },
    { metric: 'NRR', value: '120%', change: '+5%' },
    { metric: 'Rule of 40', value: '52%', change: '+8%' },
  ],
};

export function AIAnalysisPanel({ document, isOpen, onClose }: AIAnalysisPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['summary', 'risks', 'actions'])
  );

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      // Simulate AI analysis loading
      const timer = setTimeout(() => {
        setAnalysis(mockAnalysis);
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const copySummary = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis.summary);
    }
  };

  const severityColors = {
    high: 'border-danger-200 bg-danger-50',
    medium: 'border-warning-200 bg-warning-50',
    low: 'border-slate-200 bg-slate-50',
  };

  const severityBadge = {
    high: 'danger',
    medium: 'warning',
    low: 'secondary',
  } as const;

  const priorityBadge = {
    high: 'danger',
    medium: 'warning',
    low: 'secondary',
  } as const;

  if (!isOpen) {return null;}

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] border-l border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">AI Document Analysis</h2>
            <p className="text-sm text-slate-500">{document.name}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="h-[calc(100%-73px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-200" />
              <div className="absolute inset-0 h-16 w-16 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
            </div>
            <p className="mt-4 font-medium text-slate-900">Analyzing document...</p>
            <p className="mt-1 text-sm text-slate-500">
              Extracting key information and insights
            </p>
          </div>
        ) : analysis ? (
          <div className="space-y-4 p-4">
            {/* Summary Section */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('summary')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-slate-900">Summary</span>
                </div>
                {expandedSections.has('summary') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('summary') && (
                <div className="border-t border-slate-200 p-4">
                  <p className="text-sm leading-relaxed text-slate-600">{analysis.summary}</p>
                  <button
                    onClick={copySummary}
                    className="mt-3 flex items-center gap-1 text-xs text-primary-600 hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    Copy summary
                  </button>
                </div>
              )}
            </div>

            {/* Financial Highlights */}
            {analysis.financialHighlights && (
              <div className="rounded-lg border border-slate-200 bg-white">
                <button
                  onClick={() => toggleSection('financial')}
                  className="flex w-full items-center justify-between p-4"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-slate-900">Financial Highlights</span>
                  </div>
                  {expandedSections.has('financial') ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
                {expandedSections.has('financial') && (
                  <div className="border-t border-slate-200 p-4">
                    <div className="grid grid-cols-2 gap-3">
                      {analysis.financialHighlights.map((item, idx) => (
                        <div key={idx} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">{item.metric}</p>
                          <div className="mt-1 flex items-baseline gap-2">
                            <span className="text-lg font-semibold text-slate-900">{item.value}</span>
                            {item.change && (
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  item.change.startsWith('+') || item.change.startsWith('-')
                                    ? item.change.startsWith('+')
                                      ? 'text-success-600'
                                      : 'text-danger-600'
                                    : 'text-slate-500'
                                )}
                              >
                                {item.change}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Key Terms */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('terms')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-slate-900">Key Terms</span>
                  <Badge variant="secondary" size="sm">
                    {analysis.keyTerms.length}
                  </Badge>
                </div>
                {expandedSections.has('terms') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('terms') && (
                <div className="border-t border-slate-200 p-4">
                  <div className="space-y-3">
                    {analysis.keyTerms.map((term, idx) => (
                      <div key={idx} className="rounded-lg bg-slate-50 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{term.term}</span>
                          <Badge
                            variant={term.importance === 'high' ? 'danger' : term.importance === 'medium' ? 'warning' : 'secondary'}
                            size="sm"
                          >
                            {term.importance}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{term.definition}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Risk Flags */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('risks')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-danger-600" />
                  <span className="font-medium text-slate-900">Risk Flags</span>
                  <Badge variant="danger" size="sm">
                    {analysis.riskFlags.filter((r) => r.severity === 'high').length} High
                  </Badge>
                </div>
                {expandedSections.has('risks') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('risks') && (
                <div className="border-t border-slate-200 p-4">
                  <div className="space-y-3">
                    {analysis.riskFlags.map((risk, idx) => (
                      <div
                        key={idx}
                        className={cn('rounded-lg border p-3', severityColors[risk.severity])}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{risk.title}</span>
                          <Badge variant={severityBadge[risk.severity]} size="sm">
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{risk.description}</p>
                        {risk.page && (
                          <button className="mt-2 text-xs text-primary-600 hover:underline">
                            Go to page {risk.page}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Items */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('actions')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-success-600" />
                  <span className="font-medium text-slate-900">Action Items</span>
                  <Badge variant="primary" size="sm">
                    {analysis.actionItems.length}
                  </Badge>
                </div>
                {expandedSections.has('actions') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('actions') && (
                <div className="border-t border-slate-200 p-4">
                  <div className="space-y-3">
                    {analysis.actionItems.map((action, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{action.task}</p>
                          <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                            {action.assignee && <span>{action.assignee}</span>}
                            {action.dueDate && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(action.dueDate)}
                              </span>
                            )}
                            <Badge variant={priorityBadge[action.priority]} size="sm">
                              {action.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Related Documents */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('related')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-slate-900">Related Documents</span>
                </div>
                {expandedSections.has('related') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('related') && (
                <div className="border-t border-slate-200 p-4">
                  <div className="space-y-2">
                    {analysis.relatedDocuments.map((doc) => (
                      <button
                        key={doc.id}
                        className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-slate-50"
                      >
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full bg-primary-500"
                              style={{ width: `${doc.relevance}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500">{doc.relevance}%</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Insights */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('insights')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-slate-900">AI Insights</span>
                </div>
                {expandedSections.has('insights') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>
              {expandedSections.has('insights') && (
                <div className="border-t border-slate-200 p-4">
                  <div className="space-y-3">
                    {analysis.insights.map((insight, idx) => (
                      <div key={idx} className="rounded-lg bg-gradient-to-r from-primary-50 to-purple-50 p-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary" size="sm">
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Regenerate */}
            <div className="flex justify-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => setIsLoading(false), 2000);
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerate Analysis
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
