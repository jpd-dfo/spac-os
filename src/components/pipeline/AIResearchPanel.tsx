'use client';

import { useState, useCallback, useRef } from 'react';

import {
  X,
  Sparkles,
  Building2,
  TrendingUp,
  Users,
  Swords,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Search,
  Globe,
  Target,
  PieChart,
  Briefcase,
  Award,
  AlertCircle,
} from 'lucide-react';

import { ProgressIndicator } from '@/components/shared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Research steps for progress tracking
const RESEARCH_STEPS = [
  'Gathering company data',
  'Analyzing market',
  'Researching competitors',
  'Evaluating management',
];

interface AIResearchPanelProps {
  targetId: string;
  targetName: string;
  targetSector?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface CompanyProfile {
  overview: string;
  founded?: string;
  headquarters?: string;
  employees?: string;
  website?: string;
  keyProducts: string[];
  recentNews: { title: string; date: string; summary: string }[];
}

interface BusinessModel {
  description: string;
  revenueStreams: { name: string; percentage: number; description: string }[];
  valueProposition: string;
  customerSegments: string[];
  keyPartners: string[];
  competitiveAdvantages: string[];
}

interface MarketAnalysis {
  tam: { value: string; description: string };
  sam: { value: string; description: string };
  som: { value: string; description: string };
  growthRate: string;
  marketTrends: { trend: string; impact: 'positive' | 'negative' | 'neutral' }[];
  regulations: string[];
}

interface Competitor {
  name: string;
  description: string;
  marketShare?: string;
  strengths: string[];
  weaknesses: string[];
  threat: 'high' | 'medium' | 'low';
}

interface CompetitiveLandscape {
  summary: string;
  competitors: Competitor[];
  marketPosition: string;
  differentiators: string[];
}

interface Executive {
  name: string;
  title: string;
  background: string;
  experience: string;
  education?: string;
  previousRoles: string[];
}

interface ManagementAnalysis {
  summary: string;
  executives: Executive[];
  teamStrengths: string[];
  teamGaps: string[];
  boardComposition?: string;
}

interface ResearchData {
  companyProfile?: CompanyProfile;
  businessModel?: BusinessModel;
  marketAnalysis?: MarketAnalysis;
  competitiveLandscape?: CompetitiveLandscape;
  managementAnalysis?: ManagementAnalysis;
}

interface LoadingState {
  company: boolean;
  market: boolean;
  competitors: boolean;
  management: boolean;
}

interface ErrorState {
  company: string;
  market: string;
  competitors: string;
  management: string;
}

export function AIResearchPanel({
  targetId,
  targetName,
  targetSector,
  isOpen,
  onClose,
}: AIResearchPanelProps) {
  const [research, setResearch] = useState<ResearchData>({});
  const [loading, setLoading] = useState<LoadingState>({
    company: false,
    market: false,
    competitors: false,
    management: false,
  });
  const [errors, setErrors] = useState<ErrorState>({
    company: '',
    market: '',
    competitors: '',
    management: '',
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['company', 'market', 'competitors', 'management'])
  );

  // Progress tracking state for full research
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined);
  const [isFullResearchLoading, setIsFullResearchLoading] = useState(false);

  // AbortControllers for cancellation
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cancelAllResearch = useCallback(() => {
    // Cancel all active requests
    abortControllersRef.current.forEach((controller) => {
      controller.abort();
    });
    abortControllersRef.current.clear();

    // Clear progress interval
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    // Reset states
    setLoading({
      company: false,
      market: false,
      competitors: false,
      management: false,
    });
    setIsFullResearchLoading(false);
    setCurrentStep(0);
    setProgress(0);
    setStatusMessage('');
    setEstimatedTime(undefined);
  }, []);

  const cancelSingleResearch = useCallback((operation: string) => {
    const controller = abortControllersRef.current.get(operation);
    if (controller) {
      controller.abort();
      abortControllersRef.current.delete(operation);
    }
    setLoading((prev) => ({ ...prev, [operation]: false }));
  }, []);

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

  const fetchResearch = useCallback(
    async (operation: 'company' | 'market' | 'competitors' | 'management') => {
      // Cancel any existing request for this operation
      const existingController = abortControllersRef.current.get(operation);
      if (existingController) {
        existingController.abort();
      }

      // Create new AbortController
      const controller = new AbortController();
      abortControllersRef.current.set(operation, controller);

      setLoading((prev) => ({ ...prev, [operation]: true }));
      setErrors((prev) => ({ ...prev, [operation]: '' }));

      try {
        const response = await fetch('/api/ai/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation,
            params: {
              companyName: targetName,
              industry: targetSector || 'Technology',
            },
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch ${operation} research`);
        }

        const data = await response.json();

        setResearch((prev) => {
          switch (operation) {
            case 'company':
              return { ...prev, companyProfile: data.companyProfile, businessModel: data.businessModel };
            case 'market':
              return { ...prev, marketAnalysis: data.marketAnalysis };
            case 'competitors':
              return { ...prev, competitiveLandscape: data.competitiveLandscape };
            case 'management':
              return { ...prev, managementAnalysis: data.managementAnalysis };
            default:
              return prev;
          }
        });
      } catch (error) {
        // Don't show error if cancelled
        if (error instanceof Error && error.name === 'AbortError') {
          console.log(`${operation} research cancelled`);
          return;
        }
        setErrors((prev) => ({
          ...prev,
          [operation]: error instanceof Error ? error.message : 'An error occurred',
        }));
      } finally {
        abortControllersRef.current.delete(operation);
        setLoading((prev) => ({ ...prev, [operation]: false }));
      }
    },
    [targetName, targetSector]
  );

  const fetchAllResearch = useCallback(async () => {
    // Initialize progress tracking
    setIsFullResearchLoading(true);
    setCurrentStep(0);
    setProgress(0);
    setStatusMessage(RESEARCH_STEPS[0] ?? 'Starting research');
    setEstimatedTime(60); // Initial estimate: 60 seconds

    // Start progress simulation
    let stepIndex = 0;
    progressIntervalRef.current = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, RESEARCH_STEPS.length - 1);
      setCurrentStep(stepIndex);
      setStatusMessage(RESEARCH_STEPS[stepIndex] ?? 'Processing');
      setProgress((prev) => Math.min(prev + 25, 90)); // Max out at 90% until complete
      setEstimatedTime((prev) => (prev !== undefined && prev > 10 ? prev - 10 : undefined));
    }, 8000);

    try {
      await Promise.all([
        fetchResearch('company'),
        fetchResearch('market'),
        fetchResearch('competitors'),
        fetchResearch('management'),
      ]);

      // Complete progress
      setCurrentStep(RESEARCH_STEPS.length - 1);
      setProgress(100);
      setStatusMessage('Research complete');
      setEstimatedTime(undefined);
    } finally {
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setIsFullResearchLoading(false);
    }
  }, [fetchResearch]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const threatColors = {
    high: 'border-danger-200 bg-danger-50',
    medium: 'border-warning-200 bg-warning-50',
    low: 'border-slate-200 bg-slate-50',
  };

  const threatBadge = {
    high: 'danger',
    medium: 'warning',
    low: 'secondary',
  } as const;

  const impactColors = {
    positive: 'text-success-600',
    negative: 'text-danger-600',
    neutral: 'text-slate-500',
  };

  if (!isOpen) {
    return null;
  }

  const hasAnyData =
    research.companyProfile ||
    research.businessModel ||
    research.marketAnalysis ||
    research.competitiveLandscape ||
    research.managementAnalysis;

  const isAnyLoading = loading.company || loading.market || loading.competitors || loading.management;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-[500px] border-l border-slate-200 bg-white shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">AI Company Research</h2>
            <p className="text-sm text-slate-500">{targetName}</p>
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
        {/* Research Button */}
        {!hasAnyData && !isAnyLoading && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <Search className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">Research {targetName}</h3>
            <p className="mt-2 text-center text-sm text-slate-500">
              Generate comprehensive AI-powered research including company profile, market analysis,
              competitive landscape, and management team insights.
            </p>
            <Button className="mt-6" onClick={fetchAllResearch}>
              <Search className="mr-2 h-4 w-4" />
              Research Company
            </Button>
          </div>
        )}

        {/* Loading State for Initial Research with Progress Indicator */}
        {isFullResearchLoading && !hasAnyData && (
          <div className="flex flex-col items-center justify-center py-12 px-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 mb-6">
              <Sparkles className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Researching {targetName}</h3>
            <p className="text-sm text-slate-500 mb-6 text-center">
              Gathering comprehensive data from multiple sources
            </p>
            <div className="w-full max-w-sm">
              <ProgressIndicator
                progress={progress}
                status={statusMessage}
                steps={RESEARCH_STEPS}
                currentStep={currentStep}
                onCancel={cancelAllResearch}
                estimatedTimeRemaining={estimatedTime}
              />
            </div>
          </div>
        )}

        {/* Research Results */}
        {hasAnyData && (
          <div className="space-y-4 p-4">
            {/* Company Profile & Business Model Section */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('company')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary-600" />
                  <span className="font-medium text-slate-900">Company Profile</span>
                  {loading.company && (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                  )}
                </div>
                {expandedSections.has('company') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {expandedSections.has('company') && (
                <div className="border-t border-slate-200 p-4">
                  {errors.company ? (
                    <div className="flex items-center gap-2 text-danger-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{errors.company}</span>
                    </div>
                  ) : loading.company ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                  ) : research.companyProfile ? (
                    <div className="space-y-4">
                      {/* Overview */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">Overview</h4>
                        <p className="mt-1 text-sm text-slate-600">{research.companyProfile.overview}</p>
                        <button
                          onClick={() => copyToClipboard(research.companyProfile?.overview || '')}
                          className="mt-2 flex items-center gap-1 text-xs text-primary-600 hover:underline"
                        >
                          <Copy className="h-3 w-3" />
                          Copy overview
                        </button>
                      </div>

                      {/* Company Details */}
                      <div className="grid grid-cols-2 gap-3">
                        {research.companyProfile.founded && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Founded</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {research.companyProfile.founded}
                            </p>
                          </div>
                        )}
                        {research.companyProfile.headquarters && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Headquarters</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {research.companyProfile.headquarters}
                            </p>
                          </div>
                        )}
                        {research.companyProfile.employees && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Employees</p>
                            <p className="mt-1 font-medium text-slate-900">
                              {research.companyProfile.employees}
                            </p>
                          </div>
                        )}
                        {research.companyProfile.website && (
                          <div className="rounded-lg bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Website</p>
                            <a
                              href={research.companyProfile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 flex items-center gap-1 font-medium text-primary-600 hover:underline"
                            >
                              <Globe className="h-3 w-3" />
                              Visit site
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Key Products */}
                      {research.companyProfile.keyProducts.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Key Products & Services</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {research.companyProfile.keyProducts.map((product, idx) => (
                              <Badge key={idx} variant="secondary" size="sm">
                                {product}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Business Model */}
                      {research.businessModel && (
                        <div className="mt-4 border-t border-slate-200 pt-4">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-purple-600" />
                            <h4 className="text-sm font-medium text-slate-700">Business Model</h4>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">
                            {research.businessModel.description}
                          </p>

                          {/* Revenue Streams */}
                          {research.businessModel.revenueStreams.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-slate-500">Revenue Streams</p>
                              <div className="mt-2 space-y-2">
                                {research.businessModel.revenueStreams.map((stream, idx) => (
                                  <div key={idx} className="rounded-lg bg-slate-50 p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium text-slate-900">
                                        {stream.name}
                                      </span>
                                      <Badge variant="primary" size="sm">
                                        {stream.percentage}%
                                      </Badge>
                                    </div>
                                    <p className="mt-1 text-xs text-slate-500">{stream.description}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Competitive Advantages */}
                          {research.businessModel.competitiveAdvantages.length > 0 && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-slate-500">Competitive Advantages</p>
                              <ul className="mt-2 space-y-1">
                                {research.businessModel.competitiveAdvantages.map((adv, idx) => (
                                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                    <Award className="mt-0.5 h-3 w-3 flex-shrink-0 text-success-600" />
                                    {adv}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchResearch('company')}
                      className="w-full"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Research Company Profile
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Market Analysis Section */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('market')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-slate-900">Market Analysis</span>
                  {loading.market && (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                  )}
                </div>
                {expandedSections.has('market') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {expandedSections.has('market') && (
                <div className="border-t border-slate-200 p-4">
                  {errors.market ? (
                    <div className="flex items-center gap-2 text-danger-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{errors.market}</span>
                    </div>
                  ) : loading.market ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                  ) : research.marketAnalysis ? (
                    <div className="space-y-4">
                      {/* TAM/SAM/SOM */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-700">Market Size</h4>
                        <div className="mt-2 space-y-3">
                          <div className="rounded-lg bg-gradient-to-r from-primary-50 to-blue-50 p-3">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-primary-600" />
                              <span className="text-xs font-medium text-slate-500">
                                TAM (Total Addressable Market)
                              </span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {research.marketAnalysis.tam.value}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {research.marketAnalysis.tam.description}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 p-3">
                            <div className="flex items-center gap-2">
                              <PieChart className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-slate-500">
                                SAM (Serviceable Addressable Market)
                              </span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {research.marketAnalysis.sam.value}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {research.marketAnalysis.sam.description}
                            </p>
                          </div>

                          <div className="rounded-lg bg-gradient-to-r from-purple-50 to-violet-50 p-3">
                            <div className="flex items-center gap-2">
                              <Target className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-medium text-slate-500">
                                SOM (Serviceable Obtainable Market)
                              </span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-slate-900">
                              {research.marketAnalysis.som.value}
                            </p>
                            <p className="mt-1 text-xs text-slate-600">
                              {research.marketAnalysis.som.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Growth Rate */}
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Market Growth Rate (CAGR)</p>
                        <p className="mt-1 text-lg font-semibold text-success-600">
                          {research.marketAnalysis.growthRate}
                        </p>
                      </div>

                      {/* Market Trends */}
                      {research.marketAnalysis.marketTrends.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Market Trends</h4>
                          <div className="mt-2 space-y-2">
                            {research.marketAnalysis.marketTrends.map((trend, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-2 rounded-lg bg-slate-50 p-2"
                              >
                                <TrendingUp
                                  className={cn(
                                    'mt-0.5 h-4 w-4 flex-shrink-0',
                                    impactColors[trend.impact]
                                  )}
                                />
                                <span className="text-sm text-slate-600">{trend.trend}</span>
                                <Badge
                                  variant={
                                    trend.impact === 'positive'
                                      ? 'success'
                                      : trend.impact === 'negative'
                                        ? 'danger'
                                        : 'secondary'
                                  }
                                  size="sm"
                                  className="ml-auto"
                                >
                                  {trend.impact}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Regulations */}
                      {research.marketAnalysis.regulations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">
                            Key Regulations & Compliance
                          </h4>
                          <ul className="mt-2 space-y-1">
                            {research.marketAnalysis.regulations.map((reg, idx) => (
                              <li key={idx} className="text-sm text-slate-600">
                                - {reg}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchResearch('market')}
                      className="w-full"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Research Market Analysis
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Competitive Landscape Section */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('competitors')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Swords className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-slate-900">Competitive Landscape</span>
                  {loading.competitors && (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                  )}
                </div>
                {expandedSections.has('competitors') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {expandedSections.has('competitors') && (
                <div className="border-t border-slate-200 p-4">
                  {errors.competitors ? (
                    <div className="flex items-center gap-2 text-danger-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{errors.competitors}</span>
                    </div>
                  ) : loading.competitors ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                  ) : research.competitiveLandscape ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div>
                        <p className="text-sm text-slate-600">
                          {research.competitiveLandscape.summary}
                        </p>
                      </div>

                      {/* Market Position */}
                      <div className="rounded-lg bg-slate-50 p-3">
                        <p className="text-xs text-slate-500">Market Position</p>
                        <p className="mt-1 text-sm font-medium text-slate-900">
                          {research.competitiveLandscape.marketPosition}
                        </p>
                      </div>

                      {/* Differentiators */}
                      {research.competitiveLandscape.differentiators.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Key Differentiators</h4>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {research.competitiveLandscape.differentiators.map((diff, idx) => (
                              <Badge key={idx} variant="success" size="sm">
                                {diff}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Competitors */}
                      {research.competitiveLandscape.competitors.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Competitors</h4>
                          <div className="mt-2 space-y-3">
                            {research.competitiveLandscape.competitors.map((competitor, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  'rounded-lg border p-3',
                                  threatColors[competitor.threat]
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium text-slate-900">{competitor.name}</span>
                                  <div className="flex items-center gap-2">
                                    {competitor.marketShare && (
                                      <span className="text-xs text-slate-500">
                                        {competitor.marketShare} share
                                      </span>
                                    )}
                                    <Badge variant={threatBadge[competitor.threat]} size="sm">
                                      {competitor.threat} threat
                                    </Badge>
                                  </div>
                                </div>
                                <p className="mt-1 text-sm text-slate-600">{competitor.description}</p>

                                {competitor.strengths.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-slate-500">Strengths</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {competitor.strengths.map((s, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                                        >
                                          {s}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {competitor.weaknesses.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-slate-500">Weaknesses</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {competitor.weaknesses.map((w, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                                        >
                                          {w}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchResearch('competitors')}
                      className="w-full"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Research Competitive Landscape
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Management Team Section */}
            <div className="rounded-lg border border-slate-200 bg-white">
              <button
                onClick={() => toggleSection('management')}
                className="flex w-full items-center justify-between p-4"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-slate-900">Management Team</span>
                  {loading.management && (
                    <RefreshCw className="h-4 w-4 animate-spin text-primary-500" />
                  )}
                </div>
                {expandedSections.has('management') ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </button>

              {expandedSections.has('management') && (
                <div className="border-t border-slate-200 p-4">
                  {errors.management ? (
                    <div className="flex items-center gap-2 text-danger-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{errors.management}</span>
                    </div>
                  ) : loading.management ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                  ) : research.managementAnalysis ? (
                    <div className="space-y-4">
                      {/* Summary */}
                      <div>
                        <p className="text-sm text-slate-600">{research.managementAnalysis.summary}</p>
                      </div>

                      {/* Executives */}
                      {research.managementAnalysis.executives.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Leadership Team</h4>
                          <div className="mt-2 space-y-3">
                            {research.managementAnalysis.executives.map((exec, idx) => (
                              <div key={idx} className="rounded-lg bg-slate-50 p-3">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium text-slate-900">{exec.name}</p>
                                    <p className="text-sm text-primary-600">{exec.title}</p>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{exec.background}</p>
                                <p className="mt-1 text-xs text-slate-500">{exec.experience}</p>
                                {exec.previousRoles.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium text-slate-500">Previous Roles</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                      {exec.previousRoles.map((role, i) => (
                                        <span
                                          key={i}
                                          className="inline-flex items-center rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600"
                                        >
                                          {role}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Team Strengths */}
                      {research.managementAnalysis.teamStrengths.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Team Strengths</h4>
                          <ul className="mt-2 space-y-1">
                            {research.managementAnalysis.teamStrengths.map((strength, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-2 text-sm text-slate-600"
                              >
                                <Award className="mt-0.5 h-3 w-3 flex-shrink-0 text-success-600" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Team Gaps */}
                      {research.managementAnalysis.teamGaps.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-slate-700">Areas for Improvement</h4>
                          <ul className="mt-2 space-y-1">
                            {research.managementAnalysis.teamGaps.map((gap, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                                <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0 text-warning-600" />
                                {gap}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Board Composition */}
                      {research.managementAnalysis.boardComposition && (
                        <div className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">Board Composition</p>
                          <p className="mt-1 text-sm text-slate-900">
                            {research.managementAnalysis.boardComposition}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchResearch('management')}
                      className="w-full"
                    >
                      <Search className="mr-2 h-4 w-4" />
                      Research Management Team
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Regenerate All */}
            <div className="flex justify-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAllResearch}
                disabled={isAnyLoading}
              >
                <RefreshCw className={cn('mr-2 h-4 w-4', isAnyLoading && 'animate-spin')} />
                Refresh All Research
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
