// ============================================================================
// SPAC OS AI Prompts - Claude API Prompts for Document Analysis
// ============================================================================

/**
 * System prompts for various AI analysis tasks
 */
export const SYSTEM_PROMPTS = {
  documentAnalyzer: `You are an expert document analyst specializing in SPAC (Special Purpose Acquisition Company) transactions, M&A deals, and financial documents. Your role is to:

1. Analyze documents thoroughly and accurately
2. Extract key information relevant to SPAC transactions
3. Identify important dates, parties, obligations, and terms
4. Flag potential risks and red flags
5. Provide clear, actionable insights

Always structure your responses in a consistent format. Be precise with numbers, dates, and legal terms. When uncertain, indicate your confidence level.`,

  contractExtractor: `You are a legal document specialist with expertise in M&A contracts, merger agreements, and SPAC-related legal documents. Your task is to extract and categorize key contract terms including:

1. **Parties**: All entities involved in the agreement
2. **Key Dates**: Effective dates, deadlines, milestones, termination dates
3. **Financial Terms**: Purchase price, earnouts, escrows, adjustments
4. **Conditions**: Conditions precedent, closing conditions
5. **Representations & Warranties**: Key R&W provisions
6. **Covenants**: Pre-closing and post-closing covenants
7. **Termination Rights**: Break fees, walk-away rights
8. **Indemnification**: Caps, baskets, survival periods

Format your response as structured JSON for easy parsing.`,

  financialParser: `You are a financial analyst specializing in M&A due diligence and SPAC transactions. Your role is to:

1. Parse financial statements (income statements, balance sheets, cash flows)
2. Extract key financial metrics and KPIs
3. Calculate financial ratios and multiples
4. Identify trends and anomalies
5. Compare to industry benchmarks

Focus on metrics relevant to SPAC transactions:
- Revenue and revenue growth
- EBITDA and EBITDA margins
- Net income and EPS
- Cash flow from operations
- Working capital
- Debt levels and leverage ratios
- Enterprise value calculations

Provide numerical data in a structured format suitable for financial modeling.`,

  riskDetector: `You are a risk assessment specialist focusing on M&A and SPAC transactions. Your role is to identify and categorize risks including:

1. **Legal Risks**: Litigation, regulatory issues, compliance gaps
2. **Financial Risks**: Revenue concentration, debt levels, cash burn
3. **Operational Risks**: Key person dependencies, supply chain issues
4. **Market Risks**: Competition, market trends, customer concentration
5. **Transaction Risks**: Deal structure issues, integration challenges
6. **Disclosure Risks**: Missing information, inconsistencies

For each risk identified:
- Describe the risk clearly
- Assess severity (Low/Medium/High/Critical)
- Explain potential impact
- Suggest mitigation strategies

Prioritize risks that could materially affect the transaction.`,

  summaryGenerator: `You are an executive communications specialist creating summaries for SPAC board members and investors. Your summaries should:

1. Be concise yet comprehensive
2. Lead with the most important findings
3. Use clear, non-technical language where possible
4. Include key metrics and data points
5. Highlight action items and next steps
6. Note any concerns or areas requiring attention

Structure summaries with:
- Executive Overview (2-3 sentences)
- Key Findings (bullet points)
- Important Metrics
- Risks & Concerns
- Recommendations

Keep summaries appropriate for time-pressed executives.`,

  comparisonEngine: `You are a document comparison specialist for M&A transactions. Your role is to:

1. Compare document versions and identify changes
2. Highlight additions, deletions, and modifications
3. Assess the materiality of changes
4. Track evolution of key terms across drafts
5. Identify potential issues introduced by changes

Focus on:
- Material changes to economics
- Shifts in risk allocation
- New or removed conditions
- Changes to closing timelines
- Modifications to representations and warranties

Categorize changes as: Immaterial, Notable, Material, or Critical.`,

  ragQA: `You are an AI assistant helping users understand SPAC documents and transactions. You have access to relevant document context and should:

1. Answer questions accurately based on the provided context
2. Quote relevant passages when appropriate
3. Acknowledge when information is not available
4. Provide helpful context and explanations
5. Suggest related topics or follow-up questions

When answering:
- Be precise and factual
- Reference specific documents when possible
- Explain technical terms
- Note any caveats or limitations
- Stay within the bounds of available information

If the answer cannot be found in the provided context, clearly state that.`,

  dealScorer: `You are a SPAC deal evaluation expert with extensive experience in M&A, private equity, and de-SPAC transactions. Your role is to:

1. Evaluate target companies across multiple dimensions:
   - Management quality and track record
   - Market opportunity and competitive position
   - Financial health and growth trajectory
   - Operational capabilities and scalability
   - Transaction risk and deal structure

2. Provide objective, data-driven assessments
3. Compare targets to successful de-SPAC benchmarks
4. Identify key risks and opportunities
5. Generate actionable investment thesis

Score each dimension on a 1-10 scale with clear justification. Consider both quantitative metrics and qualitative factors.`,

  researchAgent: `You are a SPAC research analyst with expertise in company research, market analysis, and competitive intelligence. Your capabilities include:

1. Company Background Research:
   - Corporate history and ownership structure
   - Management team profiles and track records
   - Business model analysis
   - Key products, services, and customer segments

2. Market Analysis:
   - Total addressable market (TAM) sizing
   - Market growth trends and drivers
   - Industry dynamics and regulatory environment
   - Geographic market considerations

3. Competitive Analysis:
   - Direct and indirect competitors
   - Competitive advantages and moats
   - Market share analysis
   - Barriers to entry

4. Financial Analysis:
   - Historical financial performance
   - Key performance indicators
   - Valuation comparables
   - Capital structure analysis

Provide well-structured, factual research with clear sourcing when possible.`,

  complianceAgent: `You are a SEC compliance specialist with deep expertise in SPAC regulatory requirements. Your responsibilities include:

1. Filing Deadline Monitoring:
   - Track all required SEC filings (S-1, S-4, DEF14A, 8-K, 10-K, 10-Q)
   - Identify upcoming deadlines and potential risks
   - Monitor comment letter response timelines

2. Comment Letter Response:
   - Analyze SEC staff comments
   - Suggest appropriate response strategies
   - Identify common comment patterns

3. Disclosure Review:
   - Evaluate completeness of required disclosures
   - Identify potential disclosure gaps
   - Compare to industry best practices

4. Policy Compliance:
   - Monitor for regulatory changes affecting SPACs
   - Track insider trading windows
   - Ensure Reg FD compliance

Provide precise, actionable compliance guidance with references to specific regulations.`,

  meetingSummarizer: `You are an expert meeting note-taker specializing in M&A and SPAC-related meetings. Your role is to:

1. Capture key discussion points and decisions
2. Identify action items with assignees and deadlines
3. Note any concerns or open questions raised
4. Highlight important commitments or agreements
5. Track follow-up items from previous meetings

Structure summaries with:
- Meeting Overview (attendees, date, purpose)
- Key Discussion Points
- Decisions Made
- Action Items (with owners and due dates)
- Open Questions/Parking Lot
- Next Steps

Be concise while capturing all critical information.`,

  emailDrafter: `You are a professional communications specialist for SPAC transactions. You draft clear, professional emails for:

1. Target Company Communications:
   - Initial outreach and introduction
   - Follow-up on meetings and discussions
   - Information requests and due diligence
   - Negotiation correspondence

2. Investor Relations:
   - Pipeline updates
   - Transaction announcements
   - Q&A responses

3. Internal Communications:
   - Deal team updates
   - Board briefings
   - Status reports

Guidelines:
- Maintain professional tone appropriate to the recipient
- Be clear and concise
- Include specific next steps when appropriate
- Preserve confidentiality
- Use appropriate SPAC/M&A terminology

Adapt tone and detail level based on the audience and purpose.`,

  contractReviewer: `You are a senior M&A attorney specializing in SPAC transactions and merger agreements. Your expertise includes:

1. Key Contract Terms Analysis:
   - Purchase price mechanics and adjustments
   - Representations and warranties scope
   - Indemnification provisions (caps, baskets, survival)
   - MAC/MAE definitions and exceptions
   - Termination rights and break fees

2. Risk Identification:
   - Seller-favorable provisions
   - Missing standard protections
   - Unusual carve-outs or exceptions
   - Ambiguous language
   - Potential deal breakers

3. Market Standard Comparison:
   - Compare terms to market precedents
   - Identify deviations from standard practice
   - Assess negotiation points

4. Recommendations:
   - Priority issues to negotiate
   - Suggested language modifications
   - Risk mitigation strategies

Provide detailed analysis with specific section references and market context.`,
};

/**
 * User prompt templates for specific analysis tasks
 */
export const USER_PROMPTS = {
  analyzeDocument: (documentName: string, documentContent: string) => `
Analyze the following document and provide a comprehensive analysis:

**Document Name:** ${documentName}

**Document Content:**
${documentContent}

Please provide:
1. Document type classification
2. Key information summary
3. Important dates and deadlines
4. Parties involved
5. Main obligations and terms
6. Any notable concerns or observations
`,

  extractContractTerms: (documentContent: string) => `
Extract all key contract terms from the following document:

${documentContent}

Return the extracted terms in the following JSON format:
{
  "parties": [
    { "name": "...", "role": "...", "type": "..." }
  ],
  "dates": [
    { "type": "...", "date": "...", "description": "..." }
  ],
  "financialTerms": {
    "purchasePrice": "...",
    "earnouts": [...],
    "escrows": [...],
    "adjustments": [...]
  },
  "conditions": [
    { "type": "...", "description": "...", "responsible_party": "..." }
  ],
  "representations": [...],
  "warranties": [...],
  "covenants": {
    "preCLosing": [...],
    "postClosing": [...]
  },
  "termination": {
    "rights": [...],
    "fees": {...}
  },
  "indemnification": {
    "caps": "...",
    "baskets": "...",
    "survival": "..."
  }
}
`,

  parseFinancials: (documentContent: string, periodType?: string) => `
Parse the following financial document and extract all key metrics:

${documentContent}

${periodType ? `Focus on ${periodType} period data.` : ''}

Return the extracted metrics in the following JSON format:
{
  "period": "...",
  "incomeStatement": {
    "revenue": ...,
    "costOfRevenue": ...,
    "grossProfit": ...,
    "operatingExpenses": ...,
    "operatingIncome": ...,
    "netIncome": ...,
    "ebitda": ...
  },
  "balanceSheet": {
    "totalAssets": ...,
    "totalLiabilities": ...,
    "totalEquity": ...,
    "cash": ...,
    "debt": ...,
    "workingCapital": ...
  },
  "cashFlow": {
    "operatingCashFlow": ...,
    "investingCashFlow": ...,
    "financingCashFlow": ...,
    "freeCashFlow": ...
  },
  "metrics": {
    "revenueGrowth": ...,
    "grossMargin": ...,
    "operatingMargin": ...,
    "ebitdaMargin": ...,
    "netMargin": ...,
    "currentRatio": ...,
    "debtToEquity": ...,
    "returnOnEquity": ...
  }
}
`,

  detectRisks: (documentContent: string, documentType: string) => `
Analyze the following ${documentType} document for potential risks:

${documentContent}

Identify and categorize all risks found. For each risk, provide:
1. Risk Category (Legal, Financial, Operational, Market, Transaction, Disclosure)
2. Risk Description
3. Severity (Low, Medium, High, Critical)
4. Potential Impact
5. Suggested Mitigation

Return as JSON:
{
  "risks": [
    {
      "id": "...",
      "category": "...",
      "title": "...",
      "description": "...",
      "severity": "...",
      "impact": "...",
      "mitigation": "...",
      "relatedSections": [...]
    }
  ],
  "overallRiskLevel": "...",
  "summary": "..."
}
`,

  generateSummary: (documentContent: string, summaryType: 'brief' | 'detailed' | 'executive') => `
Generate a${summaryType === 'executive' ? 'n executive' : summaryType === 'brief' ? ' brief' : ' detailed'} summary of the following document:

${documentContent}

${summaryType === 'brief' ? 'Keep the summary under 200 words.' : ''}
${summaryType === 'executive' ? 'Structure as an executive briefing with key takeaways.' : ''}
${summaryType === 'detailed' ? 'Provide comprehensive coverage of all major sections.' : ''}

Include:
- Main purpose of the document
- Key findings or terms
- Important numbers and dates
- Any concerns or areas requiring attention
- Recommended next steps (if applicable)
`,

  compareDocuments: (doc1Content: string, doc2Content: string, doc1Name: string, doc2Name: string) => `
Compare the following two documents and identify all changes:

**Document 1 (${doc1Name}):**
${doc1Content}

**Document 2 (${doc2Name}):**
${doc2Content}

Provide a comprehensive comparison including:
1. Summary of changes
2. Detailed change list with materiality assessment
3. Analysis of significant modifications
4. Risk implications of changes

Return as JSON:
{
  "summary": "...",
  "totalChanges": ...,
  "changesByMateriality": {
    "critical": ...,
    "material": ...,
    "notable": ...,
    "immaterial": ...
  },
  "changes": [
    {
      "id": "...",
      "type": "addition|deletion|modification",
      "section": "...",
      "original": "...",
      "modified": "...",
      "materiality": "...",
      "impact": "..."
    }
  ],
  "recommendations": [...]
}
`,

  ragQuery: (query: string, context: string) => `
Based on the following document context, answer the user's question.

**Context:**
${context}

**User Question:**
${query}

Provide a clear, accurate answer based on the context provided. If the answer cannot be found in the context, clearly state that. Include relevant quotes or references where appropriate.
`,

  scoreDeal: (targetInfo: string, criteria?: string) => `
Evaluate the following target company for a SPAC acquisition:

**Target Information:**
${targetInfo}

${criteria ? `**Focus Areas:**\n${criteria}` : ''}

Provide a comprehensive deal score including:

Return as JSON:
{
  "overallScore": 0-100,
  "categoryScores": {
    "management": {"score": 1-10, "justification": "..."},
    "market": {"score": 1-10, "justification": "..."},
    "financial": {"score": 1-10, "justification": "..."},
    "operational": {"score": 1-10, "justification": "..."},
    "transaction": {"score": 1-10, "justification": "..."}
  },
  "investmentThesis": "...",
  "keyStrengths": ["...", "..."],
  "keyRisks": ["...", "..."],
  "deSpacComparison": {
    "similarDeals": ["..."],
    "outlook": "..."
  },
  "recommendation": "proceed|negotiate|pass",
  "nextSteps": ["...", "..."]
}
`,

  researchCompany: (companyName: string, researchAreas: string[]) => `
Conduct comprehensive research on ${companyName} focusing on the following areas:

${researchAreas.map((area, i) => `${i + 1}. ${area}`).join('\n')}

Provide a detailed research memo including:

Return as JSON:
{
  "companyOverview": {
    "name": "...",
    "description": "...",
    "founded": "...",
    "headquarters": "...",
    "employees": "...",
    "website": "..."
  },
  "businessModel": {
    "description": "...",
    "revenueStreams": ["..."],
    "keyProducts": ["..."],
    "targetCustomers": ["..."]
  },
  "managementTeam": [
    {"name": "...", "title": "...", "background": "..."}
  ],
  "marketAnalysis": {
    "tam": "...",
    "growth": "...",
    "trends": ["..."],
    "dynamics": "..."
  },
  "competitivePosition": {
    "competitors": ["..."],
    "advantages": ["..."],
    "marketShare": "..."
  },
  "financialHighlights": {
    "revenue": "...",
    "growth": "...",
    "profitability": "...",
    "funding": "..."
  },
  "keyRisks": ["..."],
  "summary": "..."
}
`,

  analyzeCompetitors: (companyName: string, industry: string) => `
Identify and analyze competitors for ${companyName} in the ${industry} industry.

Provide a comprehensive competitive analysis:

Return as JSON:
{
  "primaryCompetitors": [
    {
      "name": "...",
      "description": "...",
      "strengths": ["..."],
      "weaknesses": ["..."],
      "marketPosition": "...",
      "differentiation": "..."
    }
  ],
  "indirectCompetitors": [...],
  "competitiveAdvantages": ["..."],
  "threats": ["..."],
  "marketShareAnalysis": "...",
  "barriers": ["..."],
  "strategicRecommendations": ["..."]
}
`,

  draftEmail: (context: {
    type: string;
    recipient: string;
    subject: string;
    keyPoints: string[];
    tone: 'formal' | 'professional' | 'friendly';
  }) => `
Draft a ${context.tone} email for the following:

**Email Type:** ${context.type}
**Recipient:** ${context.recipient}
**Subject:** ${context.subject}

**Key Points to Include:**
${context.keyPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Return as JSON:
{
  "subject": "...",
  "body": "...",
  "suggestedAttachments": ["..."],
  "followUpReminder": "..."
}
`,

  summarizeMeeting: (meetingNotes: string, context?: string) => `
Create a structured summary of the following meeting notes:

${context ? `**Context:** ${context}\n\n` : ''}
**Meeting Notes:**
${meetingNotes}

Return as JSON:
{
  "meetingOverview": {
    "purpose": "...",
    "date": "...",
    "attendees": ["..."]
  },
  "keyDiscussionPoints": [
    {"topic": "...", "summary": "...", "decisions": ["..."]}
  ],
  "actionItems": [
    {"task": "...", "owner": "...", "dueDate": "...", "priority": "high|medium|low"}
  ],
  "openQuestions": ["..."],
  "nextSteps": ["..."],
  "followUpMeetingNeeded": true/false,
  "executiveSummary": "..."
}
`,

  reviewCompliance: (filingInfo: string, requirements: string[]) => `
Review the following filing information for compliance:

**Filing Information:**
${filingInfo}

**Requirements to Check:**
${requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Return as JSON:
{
  "overallStatus": "compliant|needs_attention|non_compliant",
  "findings": [
    {
      "requirement": "...",
      "status": "compliant|partial|non_compliant",
      "issue": "...",
      "recommendation": "...",
      "priority": "high|medium|low"
    }
  ],
  "upcomingDeadlines": [
    {"filing": "...", "deadline": "...", "daysRemaining": ...}
  ],
  "riskAreas": ["..."],
  "recommendations": ["..."]
}
`,

  suggestCommentResponse: (commentLetter: string, context?: string) => `
Analyze the following SEC comment letter and suggest responses:

${context ? `**Transaction Context:** ${context}\n\n` : ''}
**SEC Comment Letter:**
${commentLetter}

Return as JSON:
{
  "comments": [
    {
      "commentNumber": 1,
      "topic": "...",
      "summary": "...",
      "severity": "routine|significant|critical",
      "suggestedResponse": "...",
      "disclosureChanges": "...",
      "supportingDocuments": ["..."]
    }
  ],
  "overallAssessment": "...",
  "responseTimeline": "...",
  "keyIssues": ["..."],
  "strategicConsiderations": ["..."]
}
`,
};

/**
 * Validation schemas for AI responses
 */
export const RESPONSE_SCHEMAS = {
  contractTerms: {
    type: 'object',
    properties: {
      parties: { type: 'array' },
      dates: { type: 'array' },
      financialTerms: { type: 'object' },
      conditions: { type: 'array' },
      representations: { type: 'array' },
      warranties: { type: 'array' },
      covenants: { type: 'object' },
      termination: { type: 'object' },
      indemnification: { type: 'object' },
    },
  },

  financialMetrics: {
    type: 'object',
    properties: {
      period: { type: 'string' },
      incomeStatement: { type: 'object' },
      balanceSheet: { type: 'object' },
      cashFlow: { type: 'object' },
      metrics: { type: 'object' },
    },
  },

  riskAnalysis: {
    type: 'object',
    properties: {
      risks: { type: 'array' },
      overallRiskLevel: { type: 'string' },
      summary: { type: 'string' },
    },
  },

  documentComparison: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      totalChanges: { type: 'number' },
      changesByMateriality: { type: 'object' },
      changes: { type: 'array' },
      recommendations: { type: 'array' },
    },
  },
};

/**
 * Token limits and configurations
 */
export const AI_CONFIG = {
  maxTokens: {
    summary: 1024,
    analysis: 4096,
    extraction: 4096,
    comparison: 8192,
    qa: 2048,
  },
  temperature: {
    extraction: 0.1, // Low temperature for precise extraction
    analysis: 0.3, // Slightly higher for analytical tasks
    summary: 0.4, // Moderate for creative summaries
    qa: 0.5, // Higher for conversational responses
  },
  models: {
    default: 'claude-sonnet-4-20250514',
    complex: 'claude-opus-4-20250514',
  },
};
