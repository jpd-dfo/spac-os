// ============================================================================
// SPAC OS Compliance Agent - AI-Powered SEC Compliance Automation
// ============================================================================

import { getClaudeClient } from './claude';
import { SYSTEM_PROMPTS, USER_PROMPTS, AI_CONFIG } from './prompts';
import type { AIResponse, AIResponseMetadata, AIError } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Filing type
 */
export type FilingType =
  | 'S-1'
  | 'S-4'
  | 'DEF14A'
  | 'DEFA14A'
  | 'PREM14A'
  | '8-K'
  | '10-K'
  | '10-Q'
  | 'SUPER_8K'
  | '425'
  | 'SC-13D'
  | 'SC-13G'
  | 'Form 3'
  | 'Form 4'
  | 'Form 5';

/**
 * Filing deadline
 */
export interface FilingDeadline {
  id: string;
  filingType: FilingType;
  description: string;
  deadline: Date;
  daysRemaining: number;
  status: 'upcoming' | 'due_soon' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  requirements: string[];
  relatedEvents?: string[];
  notes?: string;
}

/**
 * SEC comment
 */
export interface SECComment {
  commentNumber: number;
  topic: string;
  fullText: string;
  category: string;
  severity: 'routine' | 'significant' | 'critical';
  requiresAmendment: boolean;
  suggestedResponse: string;
  disclosureChanges?: string;
  supportingDocuments?: string[];
  precedents?: string[];
}

/**
 * Comment letter analysis
 */
export interface CommentLetterAnalysis {
  letterDate: string;
  responseDeadline: Date;
  totalComments: number;
  comments: SECComment[];
  overallAssessment: string;
  commonThemes: string[];
  criticalIssues: string[];
  strategicConsiderations: string[];
  estimatedResolutionTime: string;
}

/**
 * Compliance check result
 */
export interface ComplianceCheckResult {
  requirement: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  finding: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reference?: string;
}

/**
 * Compliance review
 */
export interface ComplianceReview {
  reviewDate: Date;
  overallStatus: 'compliant' | 'needs_attention' | 'non_compliant';
  results: ComplianceCheckResult[];
  upcomingDeadlines: FilingDeadline[];
  riskAreas: string[];
  recommendations: string[];
  nextReviewDate?: Date;
}

/**
 * Disclosure requirement
 */
export interface DisclosureRequirement {
  id: string;
  category: string;
  requirement: string;
  regulation: string;
  location: string;
  status: 'included' | 'missing' | 'incomplete' | 'not_applicable';
  notes?: string;
}

/**
 * Policy violation
 */
export interface PolicyViolation {
  id: string;
  policy: string;
  violation: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  date: string;
  involvedParties?: string[];
  remediation: string;
  status: 'open' | 'investigating' | 'resolved';
}

/**
 * Compliance calendar event
 */
export interface ComplianceCalendarEvent {
  id: string;
  title: string;
  type: 'filing' | 'deadline' | 'blackout' | 'meeting' | 'other';
  date: Date;
  endDate?: Date;
  description: string;
  filingType?: FilingType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'completed' | 'missed';
  reminders?: Date[];
}

// ============================================================================
// Main Compliance Functions
// ============================================================================

/**
 * Monitor filing deadlines based on SPAC status
 */
export async function monitorFilingDeadlines(
  spacInfo: {
    name: string;
    ticker: string;
    status: string;
    ipoDate?: Date;
    daAnnouncedDate?: Date;
    proxyFiledDate?: Date;
    targetCloseDate?: Date;
  },
  lookAheadDays: number = 90
): Promise<AIResponse<FilingDeadline[]>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured. Please set ANTHROPIC_API_KEY.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const today = new Date();
    const spacContext = formatSpacInfo(spacInfo);

    const prompt = `Identify all upcoming SEC filing deadlines for the following SPAC:

${spacContext}

Today's date: ${today.toISOString().split('T')[0]}
Look-ahead period: ${lookAheadDays} days

Consider:
1. Regular periodic filings (10-K, 10-Q)
2. Event-driven filings (8-K for material events)
3. Transaction-related filings (S-4, PREM14A, DEF14A)
4. Beneficial ownership filings
5. Insider trading reports

Return as JSON:
{
  "deadlines": [
    {
      "id": "dl-1",
      "filingType": "...",
      "description": "...",
      "deadline": "YYYY-MM-DD",
      "daysRemaining": ...,
      "status": "upcoming|due_soon|overdue",
      "priority": "low|medium|high|critical",
      "requirements": ["..."],
      "relatedEvents": ["..."],
      "notes": "..."
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const result = client.parseJSONResponse<{ deadlines: Partial<FilingDeadline>[] }>(
      response.content
    );

    return {
      success: true,
      data: normalizeFilingDeadlines(result.deadlines || [], today),
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Analyze SEC comment letter and suggest responses
 */
export async function analyzeCommentLetter(
  commentLetterText: string,
  transactionContext?: string
): Promise<AIResponse<CommentLetterAnalysis>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const prompt = USER_PROMPTS.suggestCommentResponse(commentLetterText, transactionContext);

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const analysis = client.parseJSONResponse<{
      comments: Partial<SECComment>[];
      overallAssessment: string;
      responseTimeline: string;
      keyIssues: string[];
      strategicConsiderations: string[];
    }>(response.content);

    // Extract letter date and calculate response deadline
    const letterDate = extractDateFromText(commentLetterText) || new Date().toISOString().split('T')[0];
    const responseDeadline = new Date(letterDate);
    responseDeadline.setDate(responseDeadline.getDate() + 10); // Standard 10-day response

    return {
      success: true,
      data: {
        letterDate,
        responseDeadline,
        totalComments: analysis.comments?.length || 0,
        comments: normalizeComments(analysis.comments || []),
        overallAssessment: analysis.overallAssessment || '',
        commonThemes: extractCommonThemes(analysis.comments || []),
        criticalIssues: analysis.keyIssues || [],
        strategicConsiderations: analysis.strategicConsiderations || [],
        estimatedResolutionTime: analysis.responseTimeline || '',
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Review disclosure completeness
 */
export async function reviewDisclosures(
  documentContent: string,
  documentType: string,
  requiredDisclosures?: string[]
): Promise<AIResponse<{
  requirements: DisclosureRequirement[];
  overallCompleteness: number;
  missingDisclosures: string[];
  incompleteDisclosures: string[];
  recommendations: string[];
}>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const requirementsContext = requiredDisclosures?.length
      ? `\n\nSpecific requirements to check:\n${requiredDisclosures.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
      : '';

    const prompt = `Review the following ${documentType} for disclosure completeness:

Document Content:
${documentContent.substring(0, 30000)} // Limit content size
${requirementsContext}

Analyze:
1. Required disclosures for this document type
2. Whether each requirement is met
3. Completeness and adequacy of disclosures
4. Missing or incomplete information
5. Recommendations for improvement

Return as JSON:
{
  "requirements": [
    {
      "id": "req-1",
      "category": "...",
      "requirement": "...",
      "regulation": "...",
      "location": "...",
      "status": "included|missing|incomplete|not_applicable",
      "notes": "..."
    }
  ],
  "overallCompleteness": 0-100,
  "missingDisclosures": ["..."],
  "incompleteDisclosures": ["..."],
  "recommendations": ["..."]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const review = client.parseJSONResponse<{
      requirements: Partial<DisclosureRequirement>[];
      overallCompleteness: number;
      missingDisclosures: string[];
      incompleteDisclosures: string[];
      recommendations: string[];
    }>(response.content);

    return {
      success: true,
      data: {
        requirements: normalizeDisclosureRequirements(review.requirements || []),
        overallCompleteness: Math.min(100, Math.max(0, review.overallCompleteness || 0)),
        missingDisclosures: review.missingDisclosures || [],
        incompleteDisclosures: review.incompleteDisclosures || [],
        recommendations: review.recommendations || [],
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Detect potential policy violations
 */
export async function detectPolicyViolations(
  activityLog: string,
  policies: string[]
): Promise<AIResponse<{
  violations: PolicyViolation[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  summary: string;
}>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const prompt = `Analyze the following activity log for potential policy violations:

Activity Log:
${activityLog}

Policies to Check:
${policies.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Identify:
1. Any potential violations of the listed policies
2. Severity of each violation
3. Recommended remediation steps
4. Overall risk assessment

Return as JSON:
{
  "violations": [
    {
      "id": "v-1",
      "policy": "...",
      "violation": "...",
      "severity": "minor|moderate|major|critical",
      "date": "...",
      "involvedParties": ["..."],
      "remediation": "...",
      "status": "open"
    }
  ],
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["..."],
  "summary": "..."
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const detection = client.parseJSONResponse<{
      violations: Partial<PolicyViolation>[];
      riskLevel: string;
      recommendations: string[];
      summary: string;
    }>(response.content);

    return {
      success: true,
      data: {
        violations: normalizeViolations(detection.violations || []),
        riskLevel: normalizeRiskLevel(detection.riskLevel),
        recommendations: detection.recommendations || [],
        summary: detection.summary || '',
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Generate compliance calendar
 */
export async function generateComplianceCalendar(
  spacInfo: {
    name: string;
    ticker: string;
    status: string;
    fiscalYearEnd?: string;
    ipoDate?: Date;
    daAnnouncedDate?: Date;
  },
  monthsAhead: number = 6
): Promise<AIResponse<ComplianceCalendarEvent[]>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const spacContext = formatSpacInfo(spacInfo);
    const today = new Date();

    const prompt = `Generate a compliance calendar for the following SPAC:

${spacContext}

Today: ${today.toISOString().split('T')[0]}
Period: Next ${monthsAhead} months

Include:
1. Filing deadlines (10-K, 10-Q, 8-K triggers)
2. Trading blackout periods
3. Board meeting requirements
4. Proxy mailing deadlines (if applicable)
5. Shareholder meeting dates (if applicable)
6. Registration statement deadlines

Return as JSON:
{
  "events": [
    {
      "id": "evt-1",
      "title": "...",
      "type": "filing|deadline|blackout|meeting|other",
      "date": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "description": "...",
      "filingType": "...",
      "priority": "low|medium|high|critical",
      "status": "pending",
      "reminders": ["YYYY-MM-DD", ...]
    }
  ]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.extraction,
    });

    const calendar = client.parseJSONResponse<{ events: Partial<ComplianceCalendarEvent>[] }>(
      response.content
    );

    return {
      success: true,
      data: normalizeCalendarEvents(calendar.events || []),
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Perform compliance review
 */
export async function performComplianceReview(
  spacInfo: {
    name: string;
    ticker: string;
    status: string;
  },
  areas?: string[]
): Promise<AIResponse<ComplianceReview>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const areasContext = areas?.length
      ? `Focus on: ${areas.join(', ')}`
      : 'Perform comprehensive review';

    const requirements = areas || [
      'Periodic filing compliance',
      'Material event disclosure',
      'Insider trading policies',
      'Beneficial ownership reporting',
      'Proxy statement requirements',
      'Registration statement compliance',
      'Regulation FD compliance',
    ];

    const prompt = USER_PROMPTS.reviewCompliance(
      formatSpacInfo(spacInfo),
      requirements
    );

    const response = await client.sendMessage(`${areasContext}\n\n${prompt}`, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const review = client.parseJSONResponse<{
      overallStatus: string;
      findings: Partial<ComplianceCheckResult>[];
      upcomingDeadlines: Partial<FilingDeadline>[];
      riskAreas: string[];
      recommendations: string[];
    }>(response.content);

    return {
      success: true,
      data: {
        reviewDate: new Date(),
        overallStatus: normalizeComplianceStatus(review.overallStatus),
        results: normalizeCheckResults(review.findings || []),
        upcomingDeadlines: normalizeFilingDeadlines(review.upcomingDeadlines || [], new Date()),
        riskAreas: review.riskAreas || [],
        recommendations: review.recommendations || [],
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

/**
 * Draft comment letter response
 */
export async function draftCommentResponse(
  comment: SECComment,
  documentContext: string,
  responseStrategy?: 'detailed' | 'concise' | 'technical'
): Promise<AIResponse<{
  response: string;
  supportingPoints: string[];
  disclosureModifications: string;
  attachments: string[];
  followUpActions: string[];
}>> {
  const client = getClaudeClient();

  if (!client.checkConfigured()) {
    return {
      success: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'AI client is not configured.',
        retryable: false,
      },
      metadata: createEmptyMetadata(),
    };
  }

  try {
    const strategyContext =
      responseStrategy === 'detailed'
        ? 'Provide a comprehensive response with extensive detail.'
        : responseStrategy === 'technical'
          ? 'Focus on technical and regulatory aspects.'
          : 'Provide a clear, concise response.';

    const prompt = `Draft a response to the following SEC comment:

Comment #${comment.commentNumber}: ${comment.topic}
Full Comment: ${comment.fullText}
Category: ${comment.category}
Severity: ${comment.severity}

Document Context:
${documentContext}

${strategyContext}

Return as JSON:
{
  "response": "Full response text",
  "supportingPoints": ["Point 1", "Point 2", ...],
  "disclosureModifications": "Suggested changes to disclosure",
  "attachments": ["Suggested supporting documents"],
  "followUpActions": ["Action 1", "Action 2", ...]
}`;

    const response = await client.sendMessage(prompt, {
      systemPrompt: SYSTEM_PROMPTS.complianceAgent,
      maxTokens: AI_CONFIG.maxTokens.analysis,
      temperature: AI_CONFIG.temperature.analysis,
    });

    const draft = client.parseJSONResponse<{
      response: string;
      supportingPoints: string[];
      disclosureModifications: string;
      attachments: string[];
      followUpActions: string[];
    }>(response.content);

    return {
      success: true,
      data: {
        response: draft.response || '',
        supportingPoints: draft.supportingPoints || [],
        disclosureModifications: draft.disclosureModifications || '',
        attachments: draft.attachments || [],
        followUpActions: draft.followUpActions || [],
      },
      metadata: response.metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error as AIError,
      metadata: createEmptyMetadata(),
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Format SPAC info for prompts
 */
function formatSpacInfo(info: Record<string, any>): string {
  const lines: string[] = [];

  if (info.name) lines.push(`SPAC Name: ${info.name}`);
  if (info.ticker) lines.push(`Ticker: ${info.ticker}`);
  if (info.status) lines.push(`Status: ${info.status}`);
  if (info.fiscalYearEnd) lines.push(`Fiscal Year End: ${info.fiscalYearEnd}`);
  if (info.ipoDate) lines.push(`IPO Date: ${formatDate(info.ipoDate)}`);
  if (info.daAnnouncedDate) lines.push(`DA Announced: ${formatDate(info.daAnnouncedDate)}`);
  if (info.proxyFiledDate) lines.push(`Proxy Filed: ${formatDate(info.proxyFiledDate)}`);
  if (info.targetCloseDate) lines.push(`Target Close: ${formatDate(info.targetCloseDate)}`);

  return lines.join('\n');
}

/**
 * Format date
 */
function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Extract date from text
 */
function extractDateFromText(text: string): string | null {
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    /(\d{4}-\d{2}-\d{2})/,
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const date = new Date(match[0]);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  return null;
}

/**
 * Extract common themes from comments
 */
function extractCommonThemes(comments: Partial<SECComment>[]): string[] {
  const categories = comments.map((c) => c.category).filter(Boolean);
  const uniqueCategories = [...new Set(categories)];
  return uniqueCategories as string[];
}

/**
 * Normalize filing deadlines
 */
function normalizeFilingDeadlines(
  deadlines: Partial<FilingDeadline>[],
  today: Date
): FilingDeadline[] {
  return deadlines.map((d, index) => {
    const deadline = d.deadline ? new Date(d.deadline as any) : new Date();
    const daysRemaining = Math.ceil(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let status: FilingDeadline['status'] = 'upcoming';
    if (daysRemaining < 0) status = 'overdue';
    else if (daysRemaining <= 7) status = 'due_soon';

    return {
      id: d.id || `dl-${index + 1}`,
      filingType: d.filingType || ('8-K' as FilingType),
      description: d.description || '',
      deadline,
      daysRemaining,
      status: d.status || status,
      priority: d.priority || determinePriority(daysRemaining),
      requirements: d.requirements || [],
      relatedEvents: d.relatedEvents,
      notes: d.notes,
    };
  });
}

/**
 * Determine priority based on days remaining
 */
function determinePriority(daysRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
  if (daysRemaining < 0) return 'critical';
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'high';
  if (daysRemaining <= 30) return 'medium';
  return 'low';
}

/**
 * Normalize comments
 */
function normalizeComments(comments: Partial<SECComment>[]): SECComment[] {
  return comments.map((c, index) => ({
    commentNumber: c.commentNumber ?? index + 1,
    topic: c.topic || 'General',
    fullText: c.fullText || c.topic || '',
    category: c.category || 'General',
    severity: normalizeSeverity(c.severity),
    requiresAmendment: c.requiresAmendment ?? false,
    suggestedResponse: c.suggestedResponse || '',
    disclosureChanges: c.disclosureChanges,
    supportingDocuments: c.supportingDocuments || [],
    precedents: c.precedents,
  }));
}

/**
 * Normalize severity
 */
function normalizeSeverity(s?: string): 'routine' | 'significant' | 'critical' {
  const valid = ['routine', 'significant', 'critical'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'routine';
}

/**
 * Normalize disclosure requirements
 */
function normalizeDisclosureRequirements(
  reqs: Partial<DisclosureRequirement>[]
): DisclosureRequirement[] {
  return reqs.map((r, index) => ({
    id: r.id || `req-${index + 1}`,
    category: r.category || 'General',
    requirement: r.requirement || '',
    regulation: r.regulation || '',
    location: r.location || '',
    status: normalizeDisclosureStatus(r.status),
    notes: r.notes,
  }));
}

/**
 * Normalize disclosure status
 */
function normalizeDisclosureStatus(
  s?: string
): 'included' | 'missing' | 'incomplete' | 'not_applicable' {
  const valid = ['included', 'missing', 'incomplete', 'not_applicable'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'missing';
}

/**
 * Normalize violations
 */
function normalizeViolations(violations: Partial<PolicyViolation>[]): PolicyViolation[] {
  return violations.map((v, index) => ({
    id: v.id || `v-${index + 1}`,
    policy: v.policy || '',
    violation: v.violation || '',
    severity: normalizeViolationSeverity(v.severity),
    date: v.date || new Date().toISOString().split('T')[0],
    involvedParties: v.involvedParties,
    remediation: v.remediation || '',
    status: v.status || 'open',
  }));
}

/**
 * Normalize violation severity
 */
function normalizeViolationSeverity(
  s?: string
): 'minor' | 'moderate' | 'major' | 'critical' {
  const valid = ['minor', 'moderate', 'major', 'critical'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'moderate';
}

/**
 * Normalize risk level
 */
function normalizeRiskLevel(r?: string): 'low' | 'medium' | 'high' | 'critical' {
  const valid = ['low', 'medium', 'high', 'critical'];
  return valid.includes(r?.toLowerCase() || '')
    ? (r!.toLowerCase() as any)
    : 'medium';
}

/**
 * Normalize calendar events
 */
function normalizeCalendarEvents(
  events: Partial<ComplianceCalendarEvent>[]
): ComplianceCalendarEvent[] {
  return events.map((e, index) => ({
    id: e.id || `evt-${index + 1}`,
    title: e.title || '',
    type: e.type || 'other',
    date: e.date ? new Date(e.date as any) : new Date(),
    endDate: e.endDate ? new Date(e.endDate as any) : undefined,
    description: e.description || '',
    filingType: e.filingType,
    priority: e.priority || 'medium',
    status: e.status || 'pending',
    reminders: e.reminders?.map((r) => new Date(r as any)),
  }));
}

/**
 * Normalize compliance status
 */
function normalizeComplianceStatus(
  s?: string
): 'compliant' | 'needs_attention' | 'non_compliant' {
  const valid = ['compliant', 'needs_attention', 'non_compliant'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'needs_attention';
}

/**
 * Normalize check results
 */
function normalizeCheckResults(
  results: Partial<ComplianceCheckResult>[]
): ComplianceCheckResult[] {
  return results.map((r) => ({
    requirement: r.requirement || '',
    status: normalizeCheckStatus(r.status),
    finding: r.finding || '',
    recommendation: r.recommendation || '',
    priority: r.priority || 'medium',
    reference: r.reference,
  }));
}

/**
 * Normalize check status
 */
function normalizeCheckStatus(
  s?: string
): 'compliant' | 'partial' | 'non_compliant' | 'not_applicable' {
  const valid = ['compliant', 'partial', 'non_compliant', 'not_applicable'];
  return valid.includes(s?.toLowerCase() || '')
    ? (s!.toLowerCase() as any)
    : 'partial';
}

/**
 * Create empty metadata
 */
function createEmptyMetadata(): AIResponseMetadata {
  return {
    model: 'unknown',
    tokensUsed: { input: 0, output: 0, total: 0 },
    processingTime: 0,
    timestamp: new Date(),
  };
}
