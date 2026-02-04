/**
 * SPAC OS - AI Router
 * Provides tRPC procedures for AI document analysis
 */

import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { getClaudeClient } from '@/lib/ai/claude';
import {
  analyzeDocument,
  extractKeyTerms,
  summarizeLongDocument,
  identifyRedFlags,
  extractActionItems,
  generateDocumentInsights,
  type DocumentMetadata,
  type DocumentAnalysisOptions,
} from '@/lib/ai/document-analyzer';
import { logger } from '@/lib/logger';
import { UuidSchema } from '@/schemas';

import {
  createTRPCRouter,
  protectedProcedure,
} from '../trpc';

// ============================================================================
// Schemas
// ============================================================================

const AnalysisOperationSchema = z.enum([
  'full',
  'summary',
  'risks',
  'terms',
  'actions',
  'insights',
]);

const SummaryTypeSchema = z.enum(['brief', 'detailed', 'executive']);

const AnalyzeDocumentInputSchema = z.object({
  content: z.string().min(1, 'Document content is required'),
  metadata: z.object({
    id: UuidSchema,
    name: z.string().min(1),
    type: z.string().optional(),
    category: z.string().optional(),
  }),
  operation: AnalysisOperationSchema.default('full'),
  options: z.object({
    analysisTypes: z.array(z.string()).optional(),
    summaryType: SummaryTypeSchema.optional(),
    includeRisks: z.boolean().optional(),
    includeFinancials: z.boolean().optional(),
    includeContractTerms: z.boolean().optional(),
    generateActionItems: z.boolean().optional(),
  }).optional(),
});

const CacheAnalysisInputSchema = z.object({
  documentId: UuidSchema,
  analysis: z.object({
    summary: z.string(),
    keyTerms: z.array(z.object({
      term: z.string(),
      definition: z.string(),
      importance: z.enum(['high', 'medium', 'low']),
    })),
    riskFlags: z.array(z.object({
      severity: z.enum(['high', 'medium', 'low']),
      title: z.string(),
      description: z.string(),
      page: z.number().optional(),
    })),
    actionItems: z.array(z.object({
      task: z.string(),
      priority: z.enum(['high', 'medium', 'low']),
      assignee: z.string().optional(),
      dueDate: z.date().optional(),
    })),
    insights: z.array(z.object({
      type: z.string(),
      content: z.string(),
    })),
    financialHighlights: z.array(z.object({
      metric: z.string(),
      value: z.string(),
      change: z.string().optional(),
    })).optional(),
  }),
});

// ============================================================================
// Helper Functions
// ============================================================================

/** Cache duration in hours */
const CACHE_DURATION_HOURS = 24;

// ============================================================================
// Types for AI Insights (Dashboard)
// ============================================================================

type InsightType = 'ALERT' | 'OPPORTUNITY' | 'RISK' | 'RECOMMENDATION' | 'MARKET';
type InsightPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type InsightStatus = 'NEW' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  status: InsightStatus;
  title: string;
  description: string;
  source?: string;
  action?: {
    label: string;
    href?: string;
  };
  metrics?: {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  timestamp: Date;
  confidence: number; // 0-100
}

interface MarketIntelligence {
  id: string;
  headline: string;
  summary: string;
  relevance: number; // 0-100
  source: string;
  timestamp: Date;
  tags: string[];
}

/** Calculate expiration date from now */
function getExpirationDate(): Date {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_DURATION_HOURS);
  return expiresAt;
}

/** Check if an error is due to the model not existing in the database */
function isModelNotFoundError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('table') ||
      message.includes('documentanalysis') ||
      message.includes('p2021') ||
      message.includes('p2025')
    );
  }
  return false;
}

/** Calculate risk level from risk flags */
function calculateRiskLevel(
  riskFlags: Array<{ severity: 'high' | 'medium' | 'low' }> | null | undefined
): string {
  if (!riskFlags || riskFlags.length === 0) {
    return 'none';
  }

  const hasHigh = riskFlags.some((r) => r.severity === 'high');
  const hasMedium = riskFlags.some((r) => r.severity === 'medium');

  if (hasHigh) {
    return 'high';
  }
  if (hasMedium) {
    return 'medium';
  }
  return 'low';
}

/** Helper to convert undefined/null to Prisma.JsonNull for Json fields */
const toJsonValue = (value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull => {
  if (value === null || value === undefined) {
    return Prisma.JsonNull;
  }
  return value as Prisma.InputJsonValue;
};

// ============================================================================
// Router
// ============================================================================

export const aiRouter = createTRPCRouter({
  /**
   * Check if AI service is configured and available
   */
  getStatus: protectedProcedure.query(async () => {
    const client = getClaudeClient();

    return {
      configured: client.checkConfigured(),
      supportedOperations: ['full', 'summary', 'risks', 'terms', 'actions', 'insights'],
      rateLimitStatus: client.getRateLimitStatus(),
    };
  }),

  /**
   * Analyze a document using AI
   * Supports multiple operations: full analysis, summary, risks, terms, actions, insights
   */
  analyzeDocument: protectedProcedure
    .input(AnalyzeDocumentInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { content, metadata, operation, options } = input;

      const client = getClaudeClient();

      if (!client.checkConfigured()) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'AI service not configured. Please configure the ANTHROPIC_API_KEY environment variable.',
        });
      }

      try {
        let result;

        switch (operation) {
          case 'summary': {
            const styleMap: Record<string, 'executive' | 'detailed' | 'bullet-points'> = {
              brief: 'bullet-points',
              detailed: 'detailed',
              executive: 'executive',
            };
            result = await summarizeLongDocument(content, {
              style: styleMap[options?.summaryType || 'detailed'] || 'detailed',
            });
            break;
          }

          case 'risks':
            result = await identifyRedFlags(content, metadata.type);
            break;

          case 'terms':
            result = await extractKeyTerms(content, metadata.type);
            break;

          case 'actions':
            result = await extractActionItems(content);
            break;

          case 'insights':
            result = await generateDocumentInsights(content, metadata.type);
            break;

          case 'full':
          default: {
            const docMetadata: DocumentMetadata = {
              id: metadata.id,
              name: metadata.name,
              type: metadata.type,
              category: metadata.category,
            };

            const analysisOptions: DocumentAnalysisOptions = {
              analysisTypes: options?.analysisTypes as DocumentAnalysisOptions['analysisTypes'],
              summaryType: options?.summaryType,
              includeRiskAnalysis: options?.includeRisks ?? true,
              extractFinancials: options?.includeFinancials ?? false,
              extractContractTerms: options?.includeContractTerms ?? false,
              generateActionItems: options?.generateActionItems ?? false,
            };

            result = await analyzeDocument(content, docMetadata, analysisOptions);
            break;
          }
        }

        if (!result.success) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: result.error?.message || 'Analysis failed',
          });
        }

        return {
          data: result.data,
          metadata: result.metadata,
        };
      } catch (error) {
        logger.error('Document analysis error:', error);

        if (error instanceof TRPCError) {
          throw error;
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error during analysis',
        });
      }
    }),

  /**
   * Get cached analysis for a document
   */
  getCachedAnalysis: protectedProcedure
    .input(z.object({ documentId: UuidSchema }))
    .query(async ({ input, ctx }) => {
      try {
        const cachedAnalysis = await ctx.db.documentAnalysis.findFirst({
          where: { documentId: input.documentId },
          orderBy: { createdAt: 'desc' },
        });

        if (!cachedAnalysis) {
          return {
            data: null,
            isFresh: false,
          };
        }

        // Check if analysis is still fresh
        const now = new Date();
        const isFresh = cachedAnalysis.expiresAt
          ? now < cachedAnalysis.expiresAt
          : false;

        return {
          data: {
            id: cachedAnalysis.id,
            documentId: cachedAnalysis.documentId,
            summary: cachedAnalysis.summary,
            keyTerms: cachedAnalysis.keyTerms,
            riskFlags: cachedAnalysis.riskFlags,
            actionItems: cachedAnalysis.actionItems,
            insights: cachedAnalysis.insights,
            financialHighlights: cachedAnalysis.financialHighlights,
            riskLevel: cachedAnalysis.riskLevel,
            createdAt: cachedAnalysis.createdAt,
            updatedAt: cachedAnalysis.updatedAt,
            expiresAt: cachedAnalysis.expiresAt,
          },
          isFresh,
        };
      } catch (error) {
        if (isModelNotFoundError(error)) {
          logger.warn('DocumentAnalysis model not found - cache not available');
          return { data: null, isFresh: false };
        }
        throw error;
      }
    }),

  /**
   * Cache analysis results for a document
   */
  cacheAnalysis: protectedProcedure
    .input(CacheAnalysisInputSchema)
    .mutation(async ({ input, ctx }) => {
      const { documentId, analysis } = input;

      try {
        const riskLevel = calculateRiskLevel(analysis.riskFlags);
        const expiresAt = getExpirationDate();

        // Find existing analysis
        const existing = await ctx.db.documentAnalysis.findFirst({
          where: { documentId },
          orderBy: { createdAt: 'desc' },
        });

        let savedAnalysis;

        if (existing) {
          // Update existing
          savedAnalysis = await ctx.db.documentAnalysis.update({
            where: { id: existing.id },
            data: {
              summary: analysis.summary || null,
              keyTerms: toJsonValue(analysis.keyTerms),
              riskFlags: toJsonValue(analysis.riskFlags),
              actionItems: toJsonValue(analysis.actionItems),
              insights: toJsonValue(analysis.insights),
              financialHighlights: toJsonValue(analysis.financialHighlights),
              riskLevel,
              expiresAt,
              updatedAt: new Date(),
            },
          });
        } else {
          // Create new
          savedAnalysis = await ctx.db.documentAnalysis.create({
            data: {
              documentId,
              summary: analysis.summary || null,
              keyTerms: toJsonValue(analysis.keyTerms),
              riskFlags: toJsonValue(analysis.riskFlags),
              actionItems: toJsonValue(analysis.actionItems),
              insights: toJsonValue(analysis.insights),
              financialHighlights: toJsonValue(analysis.financialHighlights),
              riskLevel,
              expiresAt,
            },
          });
        }

        logger.info(`Cached analysis for document: ${documentId}`);

        return {
          cached: true,
          data: {
            id: savedAnalysis.id,
            documentId: savedAnalysis.documentId,
            createdAt: savedAnalysis.createdAt,
            expiresAt: savedAnalysis.expiresAt,
          },
        };
      } catch (error) {
        if (isModelNotFoundError(error)) {
          logger.warn('DocumentAnalysis model not found - cannot cache');
          return { cached: false, data: null };
        }
        throw error;
      }
    }),

  /**
   * Invalidate cached analysis for a document
   */
  invalidateCache: protectedProcedure
    .input(z.object({ documentId: UuidSchema }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await ctx.db.documentAnalysis.deleteMany({
          where: { documentId: input.documentId },
        });

        if (result.count > 0) {
          logger.info(`Invalidated ${result.count} cached analysis entries for document: ${input.documentId}`);
        }

        return { success: true, deletedCount: result.count };
      } catch (error) {
        if (isModelNotFoundError(error)) {
          return { success: true, deletedCount: 0 };
        }
        throw error;
      }
    }),

  // ============================================================================
  // Dashboard AI Insights (TD-013)
  // ============================================================================

  /**
   * Get aggregated AI insights for the dashboard
   * Combines data from:
   * - DocumentAnalysis (high-risk findings)
   * - Target scores (changes, opportunities)
   * - ComplianceAlerts (actionable items)
   */
  getInsights: protectedProcedure
    .input(z.object({
      spacId: UuidSchema.optional(),
      limit: z.number().int().min(1).max(20).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      const spacId = input?.spacId;
      const limit = input?.limit ?? 10;

      const insights: AIInsight[] = [];
      const marketIntelligence: MarketIntelligence[] = [];

      // ========================================================================
      // 1. Get high-risk document analyses
      // ========================================================================
      try {
        const highRiskAnalyses = await ctx.db.documentAnalysis.findMany({
          where: {
            riskLevel: { in: ['high', 'medium'] },
            ...(spacId && {
              document: { spacId },
            }),
          },
          include: {
            document: {
              select: {
                id: true,
                name: true,
                type: true,
                spac: { select: { id: true, name: true } },
                target: { select: { id: true, name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
        });

        for (const analysis of highRiskAnalyses) {
          // Parse risk flags if available
          const riskFlags = analysis.riskFlags as { type?: string; severity?: string; title?: string; description?: string }[] | null;
          const actionItems = analysis.actionItems as { task?: string; title?: string; priority?: string }[] | null;

          // Create insight from high-risk analysis
          if (riskFlags && riskFlags.length > 0) {
            const topRisk = riskFlags[0];
            insights.push({
              id: `doc-risk-${analysis.id}`,
              type: 'RISK',
              priority: analysis.riskLevel === 'high' ? 'HIGH' : 'MEDIUM',
              status: 'NEW',
              title: topRisk?.title || `Risk Flag in ${analysis.document.name}`,
              description: topRisk?.description || analysis.summary || 'High-risk content detected in document analysis.',
              source: 'Document Analysis',
              action: {
                label: 'Review Document',
                href: `/documents/${analysis.document.id}`,
              },
              timestamp: analysis.createdAt,
              confidence: 85,
            });
          }

          // Create recommendation from action items
          if (actionItems && actionItems.length > 0) {
            const topAction = actionItems[0];
            insights.push({
              id: `doc-action-${analysis.id}`,
              type: 'RECOMMENDATION',
              priority: topAction?.priority === 'high' ? 'HIGH' : 'MEDIUM',
              status: 'NEW',
              title: topAction?.task || topAction?.title || 'Action Required',
              description: `From analysis of ${analysis.document.name}`,
              source: 'AI Document Analysis',
              action: {
                label: 'View Details',
                href: `/documents/${analysis.document.id}`,
              },
              timestamp: analysis.createdAt,
              confidence: 80,
            });
          }
        }
      } catch (error) {
        // DocumentAnalysis table may not exist, continue without this data
        logger.warn('Failed to fetch document analyses for insights:', error);
      }

      // ========================================================================
      // 2. Get compliance alerts (unread, high/medium severity)
      // ========================================================================
      try {
        const complianceAlerts = await ctx.db.complianceAlert.findMany({
          where: {
            isDismissed: false,
            severity: { in: ['high', 'medium'] },
            ...(spacId && { spacId }),
          },
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: [
            { isRead: 'asc' },
            { severity: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
        });

        for (const alert of complianceAlerts) {
          // Map alert type to insight type
          const typeMap: Record<string, InsightType> = {
            'DEADLINE_APPROACHING': 'ALERT',
            'DEADLINE_CRITICAL': 'ALERT',
            'DEADLINE_MISSED': 'RISK',
            'FILING_REQUIRED': 'RECOMMENDATION',
            'COMPLIANCE_WARNING': 'RISK',
          };

          insights.push({
            id: `alert-${alert.id}`,
            type: typeMap[alert.type] || 'ALERT',
            priority: alert.severity === 'high' ? 'HIGH' : 'MEDIUM',
            status: alert.isRead ? 'ACKNOWLEDGED' : 'NEW',
            title: alert.title,
            description: alert.description,
            source: 'Compliance Monitor',
            action: alert.spac ? {
              label: 'View SPAC',
              href: `/spacs/${alert.spac.id}`,
            } : undefined,
            metrics: alert.dueDate ? [{
              label: 'Due Date',
              value: new Date(alert.dueDate).toLocaleDateString(),
              trend: 'neutral',
            }] : undefined,
            timestamp: alert.createdAt,
            confidence: 95,
          });
        }
      } catch (error) {
        logger.warn('Failed to fetch compliance alerts for insights:', error);
      }

      // ========================================================================
      // 3. Get targets with notable AI scores (opportunities)
      // ========================================================================
      try {
        // Get high-scoring targets that might be opportunities
        const highScoreTargets = await ctx.db.target.findMany({
          where: {
            deletedAt: null,
            aiScore: { gte: 80 },
            status: { in: ['IDENTIFIED', 'PRELIMINARY', 'INITIAL_OUTREACH', 'NDA_SIGNED'] },
            ...(spacId && { spacId }),
          },
          select: {
            id: true,
            name: true,
            industry: true,
            aiScore: true,
            status: true,
            valuation: true,
            updatedAt: true,
          },
          orderBy: { aiScore: 'desc' },
          take: 5,
        });

        for (const target of highScoreTargets) {
          if (target.aiScore) {
            insights.push({
              id: `target-opp-${target.id}`,
              type: 'OPPORTUNITY',
              priority: Number(target.aiScore) >= 90 ? 'HIGH' : 'MEDIUM',
              status: 'NEW',
              title: `High-Fit Target: ${target.name}`,
              description: `${target.industry || 'Target'} with strong AI score. Currently in ${target.status?.replace(/_/g, ' ').toLowerCase() || 'early stage'}.`,
              source: 'AI Target Scoring',
              action: {
                label: 'View Target',
                href: `/targets/${target.id}`,
              },
              metrics: [
                {
                  label: 'AI Score',
                  value: `${Math.round(Number(target.aiScore))}%`,
                  trend: 'up',
                },
                ...(target.valuation ? [{
                  label: 'Valuation',
                  value: `$${(Number(target.valuation) / 1000000).toFixed(0)}M`,
                  trend: 'neutral' as const,
                }] : []),
              ],
              timestamp: target.updatedAt,
              confidence: Number(target.aiScore),
            });
          }
        }

        // Get low-scoring targets that might be risks
        const lowScoreTargets = await ctx.db.target.findMany({
          where: {
            deletedAt: null,
            aiScore: { lt: 50, gt: 0 },
            status: { in: ['DUE_DILIGENCE', 'LOI_SUBMITTED', 'NEGOTIATION'] },
            ...(spacId && { spacId }),
          },
          select: {
            id: true,
            name: true,
            industry: true,
            aiScore: true,
            status: true,
            updatedAt: true,
          },
          orderBy: { aiScore: 'asc' },
          take: 3,
        });

        for (const target of lowScoreTargets) {
          if (target.aiScore) {
            insights.push({
              id: `target-risk-${target.id}`,
              type: 'RISK',
              priority: Number(target.aiScore) < 30 ? 'HIGH' : 'MEDIUM',
              status: 'NEW',
              title: `Low AI Score: ${target.name}`,
              description: `Target in advanced stage (${target.status?.replace(/_/g, ' ').toLowerCase()}) but with below-threshold AI score. Review recommended.`,
              source: 'AI Target Scoring',
              action: {
                label: 'Review Target',
                href: `/targets/${target.id}`,
              },
              metrics: [{
                label: 'AI Score',
                value: `${Math.round(Number(target.aiScore))}%`,
                trend: 'down',
              }],
              timestamp: target.updatedAt,
              confidence: 75,
            });
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch target scores for insights:', error);
      }

      // ========================================================================
      // 4. Get recent score history for trend detection
      // ========================================================================
      try {
        const recentScoreChanges = await ctx.db.scoreHistory.findMany({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
            ...(spacId && {
              target: { spacId },
            }),
          },
          include: {
            target: { select: { id: true, name: true, industry: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Group by target to detect significant changes
        const targetScores = new Map<string, typeof recentScoreChanges>();
        for (const score of recentScoreChanges) {
          const existing = targetScores.get(score.targetId);
          if (!existing) {
            targetScores.set(score.targetId, [score]);
          } else {
            existing.push(score);
          }
        }

        // Check for significant score changes
        for (const [, scores] of targetScores) {
          if (scores.length >= 2) {
            const latest = scores[0]!;
            const previous = scores[1]!;
            const change = latest.overallScore - previous.overallScore;

            if (Math.abs(change) >= 10) {
              insights.push({
                id: `score-change-${latest.id}`,
                type: change > 0 ? 'OPPORTUNITY' : 'ALERT',
                priority: Math.abs(change) >= 20 ? 'HIGH' : 'MEDIUM',
                status: 'NEW',
                title: `Score ${change > 0 ? 'Increased' : 'Decreased'} for ${latest.target.name}`,
                description: `AI score changed by ${change > 0 ? '+' : ''}${change} points in the last 7 days.${latest.thesis ? ` ${latest.thesis.slice(0, 100)}...` : ''}`,
                source: 'AI Score Tracking',
                action: {
                  label: 'View Analysis',
                  href: `/targets/${latest.targetId}`,
                },
                metrics: [
                  { label: 'Previous', value: `${previous.overallScore}%`, trend: 'neutral' },
                  { label: 'Current', value: `${latest.overallScore}%`, trend: change > 0 ? 'up' : 'down' },
                ],
                timestamp: latest.createdAt,
                confidence: 88,
              });
            }
          }
        }
      } catch (error) {
        logger.warn('Failed to fetch score history for insights:', error);
      }

      // ========================================================================
      // 5. Generate market intelligence from recent filings and activities
      // ========================================================================
      try {
        const recentFilings = await ctx.db.filing.findMany({
          where: {
            status: { in: ['FILED', 'EFFECTIVE'] },
            filedDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
          },
          include: {
            spac: { select: { id: true, name: true, ticker: true } },
          },
          orderBy: { filedDate: 'desc' },
          take: 5,
        });

        for (const filing of recentFilings) {
          marketIntelligence.push({
            id: `filing-intel-${filing.id}`,
            headline: `${filing.type.replace(/_/g, ' ')} Filed: ${filing.spac.name}`,
            summary: filing.description || `${filing.spac.ticker || 'SPAC'} filed ${filing.type.replace(/_/g, '-')} with the SEC.`,
            relevance: 85,
            source: 'SEC Filing',
            timestamp: filing.filedDate || filing.createdAt,
            tags: [filing.type.replace(/_/g, ' '), filing.status, filing.spac.ticker || 'SPAC'],
          });
        }
      } catch (error) {
        logger.warn('Failed to fetch filings for market intelligence:', error);
      }

      // ========================================================================
      // Sort insights by priority and recency
      // ========================================================================
      const priorityOrder: Record<InsightPriority, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      const statusOrder: Record<InsightStatus, number> = { NEW: 0, ACKNOWLEDGED: 1, RESOLVED: 2, DISMISSED: 3 };

      insights.sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) {
          return statusDiff;
        }

        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) {
          return priorityDiff;
        }

        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Limit insights to requested amount
      const limitedInsights = insights.slice(0, limit);

      return {
        insights: limitedInsights,
        marketIntelligence: marketIntelligence.slice(0, 5),
        lastUpdated: new Date(),
        aiStatus: 'ACTIVE' as const,
        summary: {
          totalInsights: insights.length,
          newInsights: insights.filter(i => i.status === 'NEW').length,
          highPriority: insights.filter(i => i.priority === 'HIGH' || i.priority === 'CRITICAL').length,
          byType: {
            risk: insights.filter(i => i.type === 'RISK').length,
            opportunity: insights.filter(i => i.type === 'OPPORTUNITY').length,
            alert: insights.filter(i => i.type === 'ALERT').length,
            recommendation: insights.filter(i => i.type === 'RECOMMENDATION').length,
          },
        },
      };
    }),

  /**
   * Acknowledge an AI insight (mark as read/acknowledged)
   */
  acknowledgeInsight: protectedProcedure
    .input(z.object({
      insightId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Parse the insight ID to determine the source
      const { insightId } = input;

      if (insightId.startsWith('alert-')) {
        const alertId = insightId.replace('alert-', '');
        await ctx.db.complianceAlert.update({
          where: { id: alertId },
          data: { isRead: true },
        });
        return { success: true, type: 'alert' };
      }

      // For other insight types, we don't have a database record to update
      // In a production system, you might want to store insight acknowledgments
      return { success: true, type: 'insight' };
    }),

  /**
   * Dismiss an AI insight
   */
  dismissInsight: protectedProcedure
    .input(z.object({
      insightId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { insightId } = input;

      if (insightId.startsWith('alert-')) {
        const alertId = insightId.replace('alert-', '');
        await ctx.db.complianceAlert.update({
          where: { id: alertId },
          data: { isDismissed: true },
        });
        return { success: true, type: 'alert' };
      }

      return { success: true, type: 'insight' };
    }),
});
