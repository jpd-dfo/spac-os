'use client';

// ============================================================================
// SPAC OS Deal Scoring Card - Score Visualization Component
// ============================================================================

import { useState } from 'react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import type { DealScore, CategoryScore, DealScoreBreakdown } from '@/lib/ai/deal-scorer';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface DealScoringCardProps {
  score: DealScore;
  targetName?: string;
  onViewDetails?: () => void;
  onGenerateThesis?: () => void;
  onExport?: () => void;
  compact?: boolean;
  className?: string;
}

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

interface CategoryScoreBarProps {
  category: string;
  score: CategoryScore;
  maxScore?: number;
  onClick?: () => void;
}

// ============================================================================
// Score Color Utilities
// ============================================================================

function getScoreColor(score: number): string {
  if (score >= 80) {return 'text-green-600';}
  if (score >= 60) {return 'text-primary-600';}
  if (score >= 40) {return 'text-yellow-600';}
  return 'text-red-600';
}

function getScoreBgColor(score: number): string {
  if (score >= 80) {return 'bg-green-500';}
  if (score >= 60) {return 'bg-primary-500';}
  if (score >= 40) {return 'bg-yellow-500';}
  return 'bg-red-500';
}

function getGradeColor(grade: string): string {
  switch (grade) {
    case 'A':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'B':
      return 'bg-primary-100 text-primary-800 border-primary-200';
    case 'C':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'D':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'F':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

function getRecommendationConfig(rec: string): { color: string; bgColor: string; label: string } {
  switch (rec) {
    case 'proceed':
      return { color: 'text-green-700', bgColor: 'bg-green-100', label: 'Proceed' };
    case 'negotiate':
      return { color: 'text-primary-700', bgColor: 'bg-primary-100', label: 'Negotiate Terms' };
    case 'more_diligence':
      return { color: 'text-yellow-700', bgColor: 'bg-yellow-100', label: 'More Diligence Needed' };
    case 'pass':
      return { color: 'text-red-700', bgColor: 'bg-red-100', label: 'Pass' };
    default:
      return { color: 'text-slate-700', bgColor: 'bg-slate-100', label: rec };
  }
}

// ============================================================================
// Score Gauge Component
// ============================================================================

function ScoreGauge({ score, size = 'md', showLabel = true, label }: ScoreGaugeProps) {
  const sizes = {
    sm: { outer: 80, inner: 60, stroke: 8, text: 'text-lg' },
    md: { outer: 120, inner: 100, stroke: 10, text: 'text-2xl' },
    lg: { outer: 160, inner: 130, stroke: 12, text: 'text-4xl' },
  };

  const config = sizes[size];
  const radius = (config.inner - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative"
        style={{ width: config.outer, height: config.outer }}
      >
        <svg
          className="transform -rotate-90"
          width={config.outer}
          height={config.outer}
        >
          {/* Background circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={config.stroke}
          />
          {/* Score circle */}
          <circle
            cx={config.outer / 2}
            cy={config.outer / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.stroke}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={cn('transition-all duration-1000', getScoreColor(score))}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold', config.text, getScoreColor(score))}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && label && (
        <p className="mt-2 text-sm font-medium text-slate-600">{label}</p>
      )}
    </div>
  );
}

// ============================================================================
// Category Score Bar Component
// ============================================================================

function CategoryScoreBar({
  category,
  score,
  maxScore = 10,
  onClick,
}: CategoryScoreBarProps) {
  const percentage = (score.score / maxScore) * 100;
  const categoryLabels: Record<string, string> = {
    management: 'Management',
    market: 'Market',
    financial: 'Financial',
    operational: 'Operational',
    transaction: 'Transaction',
  };

  return (
    <button
      onClick={onClick}
      className="w-full text-left hover:bg-slate-50 rounded-lg p-2 transition-colors"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-700">
          {categoryLabels[category] || category}
        </span>
        <span className={cn('text-sm font-bold', getScoreColor(percentage))}>
          {score.score}/{maxScore}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getScoreBgColor(percentage))}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {score.confidence !== undefined && (
        <p className="mt-1 text-xs text-slate-400">
          Confidence: {Math.round(score.confidence * 100)}%
        </p>
      )}
    </button>
  );
}

// ============================================================================
// Category Detail Modal Content
// ============================================================================

function CategoryDetailContent({ category, score }: { category: string; score: CategoryScore }) {
  const categoryLabels: Record<string, string> = {
    management: 'Management Quality',
    market: 'Market Opportunity',
    financial: 'Financial Health',
    operational: 'Operational Capabilities',
    transaction: 'Transaction Risk',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-slate-900">
          {categoryLabels[category] || category}
        </h4>
        <div className={cn(
          'flex items-center justify-center h-12 w-12 rounded-full text-xl font-bold',
          getScoreBgColor(score.score * 10),
          'text-white'
        )}>
          {score.score}
        </div>
      </div>

      <p className="text-sm text-slate-600">{score.justification}</p>

      {score.strengths && score.strengths.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-green-700 mb-2">Strengths</h5>
          <ul className="space-y-1">
            {score.strengths.map((s, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-600">
                <svg className="h-4 w-4 mr-2 mt-0.5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {score.weaknesses && score.weaknesses.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-red-700 mb-2">Weaknesses</h5>
          <ul className="space-y-1">
            {score.weaknesses.map((w, idx) => (
              <li key={idx} className="flex items-start text-sm text-slate-600">
                <svg className="h-4 w-4 mr-2 mt-0.5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Comparison Chart Component
// ============================================================================

function ComparisonChart({ categoryScores }: { categoryScores: DealScoreBreakdown }) {
  const categories = ['management', 'market', 'financial', 'operational', 'transaction'] as const;
  const maxScore = 10;
  const center = 50;
  const maxRadius = 40;

  // Calculate points for pentagon
  const getPoint = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const radius = (value / maxScore) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  };

  const scorePoints = categories.map((cat, idx) => getPoint(idx, categoryScores[cat].score));
  const maxPoints = categories.map((_, idx) => getPoint(idx, maxScore));

  const scorePath = scorePoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const maxPath = maxPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  return (
    <div className="relative">
      <svg viewBox="0 0 100 100" className="w-full h-48">
        {/* Grid lines */}
        {[2, 4, 6, 8, 10].map((level) => (
          <path
            key={level}
            d={categories.map((_, idx) => {
              const p = getPoint(idx, level);
              return `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
            }).join(' ') + ' Z'}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="0.5"
          />
        ))}

        {/* Axis lines */}
        {categories.map((_, idx) => {
          const p = getPoint(idx, maxScore);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Score area */}
        <path
          d={scorePath}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
        />

        {/* Score points */}
        {scorePoints.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="3"
            fill="#3b82f6"
          />
        ))}
      </svg>

      {/* Labels */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 text-xs font-medium text-slate-600">
        Management
      </div>
      <div className="absolute top-1/4 right-0 text-xs font-medium text-slate-600">
        Market
      </div>
      <div className="absolute bottom-1/4 right-4 text-xs font-medium text-slate-600">
        Financial
      </div>
      <div className="absolute bottom-1/4 left-4 text-xs font-medium text-slate-600">
        Operational
      </div>
      <div className="absolute top-1/4 left-0 text-xs font-medium text-slate-600">
        Transaction
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DealScoringCard({
  score,
  targetName,
  onViewDetails,
  onGenerateThesis,
  onExport,
  compact = false,
  className,
}: DealScoringCardProps) {
  const [selectedCategory, setSelectedCategory] = useState<keyof DealScoreBreakdown | null>(null);
  const recConfig = getRecommendationConfig(score.recommendation);

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              {targetName && (
                <p className="text-sm text-slate-500">{targetName}</p>
              )}
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-lg font-bold',
                  getGradeColor(score.grade)
                )}>
                  {score.grade}
                </span>
                <span className={cn('text-2xl font-bold', getScoreColor(score.overallScore))}>
                  {score.overallScore}
                </span>
              </div>
            </div>
            <div className={cn('px-3 py-1 rounded-full text-sm font-medium', recConfig.bgColor, recConfig.color)}>
              {recConfig.label}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Deal Score</CardTitle>
            {targetName && (
              <p className="mt-1 text-sm text-slate-500">{targetName}</p>
            )}
          </div>
          <div className={cn(
            'inline-flex items-center rounded-full border px-4 py-1 text-2xl font-bold',
            getGradeColor(score.grade)
          )}>
            {score.grade}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="flex items-center justify-center">
          <ScoreGauge score={score.overallScore} size="lg" label="Overall Score" />
        </div>

        {/* Recommendation */}
        <div className={cn(
          'flex items-center justify-center rounded-lg p-4',
          recConfig.bgColor
        )}>
          <div className="text-center">
            <p className="text-sm text-slate-600">Recommendation</p>
            <p className={cn('text-xl font-bold', recConfig.color)}>
              {recConfig.label}
            </p>
          </div>
        </div>

        {/* Category Scores */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Category Breakdown</h4>
          <div className="space-y-2">
            {(Object.keys(score.categoryScores) as Array<keyof DealScoreBreakdown>).map((category) => (
              <CategoryScoreBar
                key={category}
                category={category}
                score={score.categoryScores[category]}
                onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
              />
            ))}
          </div>

          {/* Selected Category Detail */}
          {selectedCategory && (
            <div className="mt-4 rounded-lg border border-slate-200 p-4 bg-slate-50">
              <CategoryDetailContent
                category={selectedCategory}
                score={score.categoryScores[selectedCategory]}
              />
            </div>
          )}
        </div>

        {/* Comparison Chart */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Score Distribution</h4>
          <ComparisonChart categoryScores={score.categoryScores} />
        </div>

        {/* Key Strengths & Risks */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium text-green-700 mb-2">Key Strengths</h4>
            <ul className="space-y-1">
              {score.keyStrengths.slice(0, 3).map((s, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start">
                  <span className="text-green-500 mr-1">+</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-red-700 mb-2">Key Risks</h4>
            <ul className="space-y-1">
              {score.keyRisks.slice(0, 3).map((r, idx) => (
                <li key={idx} className="text-xs text-slate-600 flex items-start">
                  <span className="text-red-500 mr-1">-</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Investment Thesis */}
        {score.investmentThesis && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Investment Thesis</h4>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              {score.investmentThesis}
            </p>
          </div>
        )}

        {/* Next Steps */}
        {score.nextSteps?.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-2">Next Steps</h4>
            <ol className="space-y-1">
              {score.nextSteps.slice(0, 4).map((step, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700 mr-2 flex-shrink-0">
                    {idx + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          {onViewDetails && (
            <Button variant="secondary" size="sm" onClick={onViewDetails}>
              View Details
            </Button>
          )}
          {onGenerateThesis && (
            <Button variant="secondary" size="sm" onClick={onGenerateThesis}>
              Generate Thesis
            </Button>
          )}
        </div>
        {onExport && (
          <Button variant="ghost" size="sm" onClick={onExport}>
            Export
          </Button>
        )}
      </CardFooter>

      {/* Confidence & Timestamp */}
      <div className="px-6 pb-4 flex items-center justify-between text-xs text-slate-400">
        <span>Confidence: {Math.round(score.confidenceLevel * 100)}%</span>
        <span>Scored: {new Date(score.scoredAt).toLocaleDateString()}</span>
      </div>
    </Card>
  );
}

// ============================================================================
// Mini Score Badge Component
// ============================================================================

export function DealScoreBadge({
  score,
  grade,
  size = 'md',
}: {
  score: number;
  grade: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={cn(
        'flex items-center justify-center rounded-full font-bold',
        sizes[size],
        getScoreBgColor(score),
        'text-white'
      )}>
        {grade}
      </div>
      <span className={cn('font-bold', getScoreColor(score))}>
        {score}
      </span>
    </div>
  );
}

export default DealScoringCard;
