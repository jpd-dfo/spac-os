const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

// Page settings
const PAGE_WIDTH = 12240; // 8.5 inches
const PAGE_HEIGHT = 15840; // 11 inches
const MARGIN = 1440; // 1 inch
const CONTENT_WIDTH = PAGE_WIDTH - (2 * MARGIN); // 9360 DXA

// Colors
const PRIMARY_COLOR = "1B365D"; // Navy blue
const SECONDARY_COLOR = "4A90D9"; // Light blue
const ACCENT_COLOR = "2E7D32"; // Green
const HEADER_BG = "E8F0F8";
const ALT_ROW = "F5F9FC";
const CODE_BG = "F4F4F4";

// Borders
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Helper functions
const createHeading1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, bold: true, size: 36, color: PRIMARY_COLOR, font: "Arial" })]
});

const createHeading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  children: [new TextRun({ text, bold: true, size: 28, color: PRIMARY_COLOR, font: "Arial" })]
});

const createHeading3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 200, after: 100 },
  children: [new TextRun({ text, bold: true, size: 24, color: SECONDARY_COLOR, font: "Arial" })]
});

const createHeading4 = (text) => new Paragraph({
  spacing: { before: 150, after: 80 },
  children: [new TextRun({ text, bold: true, size: 22, color: PRIMARY_COLOR, font: "Arial" })]
});

const createParagraph = (text, options = {}) => new Paragraph({
  spacing: { after: 120 },
  children: [new TextRun({ text, size: 22, font: "Arial", ...options })]
});

const createBulletPoint = (text, level = 0) => new Paragraph({
  numbering: { reference: "bullets", level },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, font: "Arial" })]
});

const createNumberedPoint = (text, level = 0) => new Paragraph({
  numbering: { reference: "numbers", level },
  spacing: { after: 80 },
  children: [new TextRun({ text, size: 22, font: "Arial" })]
});

const createCodeBlock = (text) => new Paragraph({
  spacing: { after: 80 },
  shading: { fill: CODE_BG, type: ShadingType.CLEAR },
  children: [new TextRun({ text, size: 18, font: "Courier New" })]
});

const createTableHeaderCell = (text, width) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: { fill: PRIMARY_COLOR, type: ShadingType.CLEAR },
  margins: { top: 100, bottom: 100, left: 120, right: 120 },
  children: [new Paragraph({
    children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: "Arial" })]
  })]
});

const createTableCell = (text, width, isAlt = false) => new TableCell({
  borders,
  width: { size: width, type: WidthType.DXA },
  shading: isAlt ? { fill: ALT_ROW, type: ShadingType.CLEAR } : undefined,
  margins: { top: 80, bottom: 80, left: 120, right: 120 },
  children: [new Paragraph({
    children: [new TextRun({ text, size: 20, font: "Arial" })]
  })]
});

const createUserStoryTable = (stories) => {
  const rows = [
    new TableRow({ children: [
      createTableHeaderCell("ID", 800),
      createTableHeaderCell("User Story", 5560),
      createTableHeaderCell("Priority", 1000),
      createTableHeaderCell("Module", 2000)
    ]})
  ];
  stories.forEach((story, idx) => {
    rows.push(new TableRow({ children: [
      createTableCell(story.id, 800, idx % 2 === 1),
      createTableCell(story.story, 5560, idx % 2 === 1),
      createTableCell(story.priority, 1000, idx % 2 === 1),
      createTableCell(story.module, 2000, idx % 2 === 1)
    ]}));
  });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    columnWidths: [800, 5560, 1000, 2000],
    rows
  });
};

// User Stories Data
const sponsorStories = [
  { id: "US-001", story: "As a Sponsor, I want to view a dashboard showing all active SPACs with key metrics so I can monitor portfolio health at a glance", priority: "P0", module: "Dashboard" },
  { id: "US-002", story: "As a Sponsor, I want to see countdown timers for business combination deadlines so I can track urgency across SPACs", priority: "P0", module: "Lifecycle" },
  { id: "US-003", story: "As a Sponsor, I want to approve deal pipeline stage transitions so I maintain control over deal progression", priority: "P0", module: "Deal Flow" },
  { id: "US-004", story: "As a Sponsor, I want to receive AI-generated weekly summary reports so I stay informed without manual review", priority: "P1", module: "Analytics" },
  { id: "US-005", story: "As a Sponsor, I want to view dilution impact scenarios so I can evaluate deal structures", priority: "P0", module: "Financial" },
  { id: "US-006", story: "As a Sponsor, I want to track PIPE commitment progress in real-time so I know funding status", priority: "P0", module: "Financial" },
  { id: "US-007", story: "As a Sponsor, I want to compare multiple target companies side-by-side so I can make informed decisions", priority: "P1", module: "Deal Flow" },
  { id: "US-008", story: "As a Sponsor, I want to see relationship maps to key decision-makers so I can leverage network connections", priority: "P1", module: "CRM" },
  { id: "US-009", story: "As a Sponsor, I want to receive mobile push notifications for critical events so I stay informed on the go", priority: "P1", module: "Mobile" },
  { id: "US-010", story: "As a Sponsor, I want to generate board presentation materials automatically so I save preparation time", priority: "P2", module: "Analytics" },
  { id: "US-011", story: "As a Sponsor, I want to track post-merger performance against projections so I can assess deal success", priority: "P1", module: "Lifecycle" },
  { id: "US-012", story: "As a Sponsor, I want to view historical deal performance analytics so I can improve future decisions", priority: "P2", module: "Analytics" }
];

const analystStories = [
  { id: "US-013", story: "As an Investment Analyst, I want to search for target companies by industry and financial criteria so I can build a pipeline", priority: "P0", module: "Deal Flow" },
  { id: "US-014", story: "As an Investment Analyst, I want AI to score targets against our investment thesis so I can prioritize review", priority: "P0", module: "AI/ML" },
  { id: "US-015", story: "As an Investment Analyst, I want to upload and organize due diligence documents so information is centralized", priority: "P0", module: "Documents" },
  { id: "US-016", story: "As an Investment Analyst, I want AI to extract key terms from contracts so I can review faster", priority: "P0", module: "AI/ML" },
  { id: "US-017", story: "As an Investment Analyst, I want to create financial models with redemption scenarios so I can stress-test deals", priority: "P0", module: "Financial" },
  { id: "US-018", story: "As an Investment Analyst, I want to track meeting notes and action items with contacts so nothing falls through", priority: "P1", module: "CRM" },
  { id: "US-019", story: "As an Investment Analyst, I want AI to summarize lengthy due diligence reports so I can review efficiently", priority: "P1", module: "AI/ML" },
  { id: "US-020", story: "As an Investment Analyst, I want to compare target financials against comparable companies so I can validate valuations", priority: "P1", module: "Financial" },
  { id: "US-021", story: "As an Investment Analyst, I want to log all target interactions in a timeline view so I can track deal history", priority: "P1", module: "Deal Flow" },
  { id: "US-022", story: "As an Investment Analyst, I want AI to identify red flags in financial statements so I can focus on risk areas", priority: "P0", module: "AI/ML" },
  { id: "US-023", story: "As an Investment Analyst, I want to generate investment memos from templates so I maintain consistency", priority: "P1", module: "Documents" },
  { id: "US-024", story: "As an Investment Analyst, I want to track competitor activity on target companies so I assess deal risk", priority: "P2", module: "Deal Flow" },
  { id: "US-025", story: "As an Investment Analyst, I want AI to monitor news for targets and related industries so I stay informed", priority: "P1", module: "AI/ML" }
];

const complianceStories = [
  { id: "US-026", story: "As a Compliance Officer, I want to see a calendar of all SEC filing deadlines so I ensure timely submissions", priority: "P0", module: "Compliance" },
  { id: "US-027", story: "As a Compliance Officer, I want automated reminders 30/14/7 days before deadlines so nothing is missed", priority: "P0", module: "Compliance" },
  { id: "US-028", story: "As a Compliance Officer, I want to track SEC comment letter status and responses so I manage the review process", priority: "P0", module: "Compliance" },
  { id: "US-029", story: "As a Compliance Officer, I want to manage insider trading blackout periods so I prevent violations", priority: "P0", module: "Compliance" },
  { id: "US-030", story: "As a Compliance Officer, I want to review and approve pre-clearance requests so I maintain compliance", priority: "P0", module: "Compliance" },
  { id: "US-031", story: "As a Compliance Officer, I want to generate audit trails for all document access so I can respond to inquiries", priority: "P0", module: "Documents" },
  { id: "US-032", story: "As a Compliance Officer, I want to track board member independence requirements so I ensure governance compliance", priority: "P1", module: "Compliance" },
  { id: "US-033", story: "As a Compliance Officer, I want AI to review documents for disclosure requirements so I catch issues early", priority: "P1", module: "AI/ML" },
  { id: "US-034", story: "As a Compliance Officer, I want to manage conflict of interest disclosures so I maintain proper records", priority: "P1", module: "Compliance" },
  { id: "US-035", story: "As a Compliance Officer, I want to generate compliance status reports for the board so I communicate effectively", priority: "P1", module: "Analytics" },
  { id: "US-036", story: "As a Compliance Officer, I want to track all regulatory filings with version history so I maintain complete records", priority: "P0", module: "Documents" },
  { id: "US-037", story: "As a Compliance Officer, I want to receive alerts when exchange compliance requirements change so I stay current", priority: "P2", module: "Compliance" }
];

const cfoStories = [
  { id: "US-038", story: "As a CFO, I want to view real-time trust account balances and interest accrual so I track financial position", priority: "P0", module: "Financial" },
  { id: "US-039", story: "As a CFO, I want to calculate per-share redemption values daily so I know our obligations", priority: "P0", module: "Financial" },
  { id: "US-040", story: "As a CFO, I want to manage the complete cap table with all security classes so I understand ownership", priority: "P0", module: "Financial" },
  { id: "US-041", story: "As a CFO, I want to model warrant exercise scenarios so I can project dilution", priority: "P0", module: "Financial" },
  { id: "US-042", story: "As a CFO, I want to generate pro forma financial statements for business combinations so I can present to stakeholders", priority: "P0", module: "Financial" },
  { id: "US-043", story: "As a CFO, I want to track extension deposit requirements and deadlines so I manage cash flow", priority: "P0", module: "Financial" },
  { id: "US-044", story: "As a CFO, I want to analyze redemption scenarios at 0%, 25%, 50%, 75%, and 90% levels so I stress-test deals", priority: "P0", module: "Financial" },
  { id: "US-045", story: "As a CFO, I want to track PIPE investor commitments and closing conditions so I monitor funding certainty", priority: "P0", module: "Financial" },
  { id: "US-046", story: "As a CFO, I want to generate investor reports on trust performance so I maintain transparency", priority: "P1", module: "Analytics" },
  { id: "US-047", story: "As a CFO, I want to model earnout scenarios with milestone tracking so I understand contingent considerations", priority: "P1", module: "Financial" },
  { id: "US-048", story: "As a CFO, I want to track sponsor economics across multiple SPACs so I understand aggregate exposure", priority: "P1", module: "Financial" },
  { id: "US-049", story: "As a CFO, I want to export financial data to Excel for custom analysis so I maintain flexibility", priority: "P1", module: "Financial" },
  { id: "US-050", story: "As a CFO, I want to integrate with banking APIs for automated trust balance updates so I reduce manual entry", priority: "P2", module: "Integration" }
];

// Document content
const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: PRIMARY_COLOR },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: PRIMARY_COLOR },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: SECONDARY_COLOR },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
          { level: 2, format: LevelFormat.BULLET, text: "\u25AA", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 2160, hanging: 360 } } } }
        ]
      },
      { reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } }
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Di Rezze Family Office | SPAC OS PRD v2.0 - Technical Specifications", size: 18, color: "666666", font: "Arial" })
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "Page ", size: 18, color: "666666", font: "Arial" }),
            new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "666666", font: "Arial" }),
            new TextRun({ text: " of ", size: 18, color: "666666", font: "Arial" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 18, color: "666666", font: "Arial" }),
            new TextRun({ text: " | Confidential", size: 18, color: "666666", font: "Arial" })
          ]
        })]
      })
    },
    children: [
      // ============ TITLE PAGE ============
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "SPAC OS", bold: true, size: 72, color: PRIMARY_COLOR, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "Product Requirements Document", size: 36, color: SECONDARY_COLOR, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100 },
        children: [new TextRun({ text: "Expanded Technical Specifications", size: 28, color: ACCENT_COLOR, font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        children: [new TextRun({ text: "Di Rezze Family Office", size: 28, color: "666666", font: "Arial" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
        children: [new TextRun({ text: "Version 2.0 | January 2026", size: 24, color: "666666", font: "Arial" })]
      }),
      new Paragraph({ spacing: { before: 1500 } }),

      // Document info table
      new Table({
        width: { size: 6000, type: WidthType.DXA },
        alignment: AlignmentType.CENTER,
        columnWidths: [2000, 4000],
        rows: [
          new TableRow({ children: [
            new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Document:", bold: true, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders: noBorders, width: { size: 4000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "SPAC OS PRD v2.0", size: 20, font: "Arial" })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Status:", bold: true, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders: noBorders, width: { size: 4000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Technical Review", size: 20, font: "Arial" })] })] })
          ]}),
          new TableRow({ children: [
            new TableCell({ borders: noBorders, width: { size: 2000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Classification:", bold: true, size: 20, font: "Arial" })] })] }),
            new TableCell({ borders: noBorders, width: { size: 4000, type: WidthType.DXA },
              children: [new Paragraph({ children: [new TextRun({ text: "Confidential", size: 20, font: "Arial" })] })] })
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ TABLE OF CONTENTS ============
      createHeading1("Table of Contents"),
      new Paragraph({ spacing: { after: 200 } }),
      createParagraph("1. Executive Summary"),
      createParagraph("2. Detailed User Stories (50+ Stories)"),
      createParagraph("   2.1 Sponsor User Stories"),
      createParagraph("   2.2 Investment Analyst User Stories"),
      createParagraph("   2.3 Compliance Officer User Stories"),
      createParagraph("   2.4 CFO User Stories"),
      createParagraph("3. Detailed API Specifications"),
      createParagraph("   3.1 REST API Overview"),
      createParagraph("   3.2 Authentication Flows"),
      createParagraph("   3.3 Core API Endpoints"),
      createParagraph("   3.4 Webhook Specifications"),
      createParagraph("   3.5 Rate Limiting Policies"),
      createParagraph("4. Database Schema Details"),
      createParagraph("   4.1 Core Entity Tables"),
      createParagraph("   4.2 Relationships and Foreign Keys"),
      createParagraph("   4.3 Indexes and Performance"),
      createParagraph("   4.4 Data Validation Rules"),
      createParagraph("5. UI/UX Wireframe Descriptions"),
      createParagraph("   5.1 Dashboard Layout"),
      createParagraph("   5.2 Core Screen Components"),
      createParagraph("   5.3 Mobile Responsive Design"),
      createParagraph("   5.4 Accessibility Requirements"),
      createParagraph("6. AI/ML Feature Specifications"),
      createParagraph("   6.1 Document Analysis Pipeline"),
      createParagraph("   6.2 Deal Scoring Algorithm"),
      createParagraph("   6.3 Recommendation Engine"),
      createParagraph("   6.4 RAG Implementation"),
      createParagraph("7. Security Architecture"),
      createParagraph("   7.1 Authentication/Authorization"),
      createParagraph("   7.2 Data Encryption"),
      createParagraph("   7.3 Audit Logging"),
      createParagraph("   7.4 Compliance Requirements"),
      createParagraph("8. Integration Specifications"),
      createParagraph("   8.1 SEC EDGAR API"),
      createParagraph("   8.2 Email Integration"),
      createParagraph("   8.3 Calendar Integration"),
      createParagraph("   8.4 Data Provider Integration"),
      createParagraph("9. Testing Strategy"),
      createParagraph("   9.1 Unit Testing"),
      createParagraph("   9.2 Integration Testing"),
      createParagraph("   9.3 E2E Testing"),
      createParagraph("   9.4 Performance Benchmarks"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 1: EXECUTIVE SUMMARY ============
      createHeading1("1. Executive Summary"),
      createParagraph("This expanded Product Requirements Document provides comprehensive technical specifications for SPAC OS, the AI-native operating system for managing Special Purpose Acquisition Company operations within the Di Rezze Family Office ecosystem. Building upon the foundational PRD v1.0, this document details the implementation requirements across all system components."),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading3("Document Scope"),
      createBulletPoint("50+ detailed user stories covering all user personas and modules"),
      createBulletPoint("Complete REST API specifications with request/response schemas"),
      createBulletPoint("Full database schema with relationships, indexes, and validation rules"),
      createBulletPoint("UI/UX wireframe descriptions for all major screens"),
      createBulletPoint("AI/ML pipeline architecture and algorithm specifications"),
      createBulletPoint("Security architecture with encryption, authentication, and audit requirements"),
      createBulletPoint("External integration specifications for SEC, email, calendar, and data providers"),
      createBulletPoint("Comprehensive testing strategy with performance benchmarks"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 2: USER STORIES ============
      createHeading1("2. Detailed User Stories"),
      createParagraph("This section contains 50+ user stories organized by user persona. Each story includes a unique identifier, priority level (P0=Critical, P1=High, P2=Medium), and associated module."),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("2.1 Sponsor User Stories"),
      createParagraph("Stories for SPAC principals and sponsors focused on strategic oversight and decision-making."),
      new Paragraph({ spacing: { after: 150 } }),
      createUserStoryTable(sponsorStories),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("2.2 Investment Analyst User Stories"),
      createParagraph("Stories for investment team members focused on target identification, evaluation, and due diligence."),
      new Paragraph({ spacing: { after: 150 } }),
      createUserStoryTable(analystStories),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("2.3 Compliance Officer User Stories"),
      createParagraph("Stories for legal and compliance team members focused on regulatory requirements and governance."),
      new Paragraph({ spacing: { after: 150 } }),
      createUserStoryTable(complianceStories),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("2.4 CFO User Stories"),
      createParagraph("Stories for finance team members focused on financial management, trust operations, and reporting."),
      new Paragraph({ spacing: { after: 150 } }),
      createUserStoryTable(cfoStories),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 3: API SPECIFICATIONS ============
      createHeading1("3. Detailed API Specifications"),

      createHeading2("3.1 REST API Overview"),
      createParagraph("SPAC OS exposes a RESTful API built on Node.js with tRPC for type-safe client-server communication. All endpoints follow REST conventions with JSON request/response bodies."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Base URL"),
      createCodeBlock("Production: https://api.spacos.direzze.io/v1"),
      createCodeBlock("Staging: https://api-staging.spacos.direzze.io/v1"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("API Versioning"),
      createBulletPoint("Version included in URL path (e.g., /v1/, /v2/)"),
      createBulletPoint("Breaking changes require new major version"),
      createBulletPoint("Deprecated endpoints supported for minimum 12 months"),
      createBulletPoint("Version sunset communicated 6 months in advance"),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("3.2 Authentication Flows"),

      createHeading3("OAuth 2.0 with PKCE (Primary)"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2000, 7360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Step", 2000),
            createTableHeaderCell("Description", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("1. Authorization", 2000),
            createTableCell("Client redirects to /oauth/authorize with client_id, redirect_uri, code_challenge, state", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("2. User Auth", 2000, true),
            createTableCell("User authenticates via Clerk (SSO, MFA if enabled)", 7360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("3. Callback", 2000),
            createTableCell("Redirect to client with authorization code", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("4. Token Exchange", 2000, true),
            createTableCell("POST /oauth/token with code, code_verifier to receive access_token, refresh_token", 7360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("5. API Access", 2000),
            createTableCell("Include Authorization: Bearer {access_token} header on all requests", 7360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Token Specifications"),
      createBulletPoint("Access Token: JWT, 1-hour expiration, contains user_id, org_id, roles, permissions"),
      createBulletPoint("Refresh Token: Opaque string, 30-day expiration, single-use rotation"),
      createBulletPoint("API Keys: For server-to-server integration, org-scoped, no expiration (can be revoked)"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("JWT Token Payload Structure"),
      createCodeBlock("{"),
      createCodeBlock('  "sub": "user_abc123",'),
      createCodeBlock('  "org_id": "org_xyz789",'),
      createCodeBlock('  "roles": ["sponsor", "admin"],'),
      createCodeBlock('  "permissions": ["spac:read", "spac:write", "deals:manage"],'),
      createCodeBlock('  "iat": 1704067200,'),
      createCodeBlock('  "exp": 1704070800,'),
      createCodeBlock('  "iss": "https://auth.spacos.direzze.io"'),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("3.3 Core API Endpoints"),

      createHeading3("SPAC Management Endpoints"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 3000, 4860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Method", 1500),
            createTableHeaderCell("Endpoint", 3000),
            createTableHeaderCell("Description", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/spacs", 3000),
            createTableCell("List all SPACs with pagination and filters", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500, true),
            createTableCell("/spacs/{id}", 3000, true),
            createTableCell("Get detailed SPAC information", 4860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500),
            createTableCell("/spacs", 3000),
            createTableCell("Create new SPAC entity", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("PATCH", 1500, true),
            createTableCell("/spacs/{id}", 3000, true),
            createTableCell("Update SPAC details", 4860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/spacs/{id}/trust", 3000),
            createTableCell("Get trust account details", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500, true),
            createTableCell("/spacs/{id}/timeline", 3000, true),
            createTableCell("Get SPAC lifecycle timeline", 4860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/spacs/{id}/cap-table", 3000),
            createTableCell("Get complete cap table", 4860)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading4("GET /spacs Request"),
      createCodeBlock("Query Parameters:"),
      createCodeBlock("  ?page=1&limit=20&status=active&phase=target_search&sort=-updated_at"),
      new Paragraph({ spacing: { after: 100 } }),

      createHeading4("GET /spacs Response"),
      createCodeBlock("{"),
      createCodeBlock('  "data": [{'),
      createCodeBlock('    "id": "spac_abc123",'),
      createCodeBlock('    "name": "DiRezze Acquisition Corp I",'),
      createCodeBlock('    "ticker": "DRZA",'),
      createCodeBlock('    "status": "active",'),
      createCodeBlock('    "phase": "target_search",'),
      createCodeBlock('    "ipo_date": "2025-06-15",'),
      createCodeBlock('    "ipo_proceeds": 300000000,'),
      createCodeBlock('    "trust_balance": 302500000,'),
      createCodeBlock('    "business_combination_deadline": "2027-06-15",'),
      createCodeBlock('    "days_remaining": 502,'),
      createCodeBlock('    "created_at": "2025-01-10T00:00:00Z",'),
      createCodeBlock('    "updated_at": "2026-01-28T14:30:00Z"'),
      createCodeBlock("  }],"),
      createCodeBlock('  "pagination": {'),
      createCodeBlock('    "page": 1,'),
      createCodeBlock('    "limit": 20,'),
      createCodeBlock('    "total": 3,'),
      createCodeBlock('    "total_pages": 1'),
      createCodeBlock("  }"),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading3("Target/Deal Pipeline Endpoints"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 3500, 4360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Method", 1500),
            createTableHeaderCell("Endpoint", 3500),
            createTableHeaderCell("Description", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/targets", 3500),
            createTableCell("List all targets with filters", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500, true),
            createTableCell("/targets", 3500, true),
            createTableCell("Create new target company", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/targets/{id}", 3500),
            createTableCell("Get target details", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("PATCH", 1500, true),
            createTableCell("/targets/{id}", 3500, true),
            createTableCell("Update target information", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500),
            createTableCell("/targets/{id}/stage-transition", 3500),
            createTableCell("Move target to new pipeline stage", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500, true),
            createTableCell("/targets/{id}/due-diligence", 3500, true),
            createTableCell("Get due diligence checklist status", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500),
            createTableCell("/targets/{id}/evaluation", 3500),
            createTableCell("Submit AI evaluation request", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500, true),
            createTableCell("/targets/{id}/financials", 3500, true),
            createTableCell("Get target financial data", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500),
            createTableCell("/targets/{id}/compare", 3500),
            createTableCell("Generate comparison with other targets", 4360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading4("POST /targets Request Body"),
      createCodeBlock("{"),
      createCodeBlock('  "company_name": "TechCorp Industries",'),
      createCodeBlock('  "industry": "enterprise_software",'),
      createCodeBlock('  "sub_industry": "cybersecurity",'),
      createCodeBlock('  "headquarters": "Austin, TX",'),
      createCodeBlock('  "source": "inbound",'),
      createCodeBlock('  "source_contact_id": "contact_def456",'),
      createCodeBlock('  "initial_enterprise_value": 850000000,'),
      createCodeBlock('  "revenue_ltm": 120000000,'),
      createCodeBlock('  "revenue_growth_yoy": 0.45,'),
      createCodeBlock('  "ebitda_ltm": 15000000,'),
      createCodeBlock('  "assigned_to": ["user_abc123", "user_def456"],'),
      createCodeBlock('  "tags": ["saas", "high-growth", "founder-led"]'),
      createCodeBlock("}"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading4("POST /targets/{id}/stage-transition Request"),
      createCodeBlock("{"),
      createCodeBlock('  "from_stage": "initial_screening",'),
      createCodeBlock('  "to_stage": "deep_evaluation",'),
      createCodeBlock('  "reason": "Passed initial criteria, management quality confirmed",'),
      createCodeBlock('  "approved_by": "user_sponsor123",'),
      createCodeBlock('  "notes": "Schedule management presentation for next week"'),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading3("Document Management Endpoints"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 3500, 4360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Method", 1500),
            createTableHeaderCell("Endpoint", 3500),
            createTableHeaderCell("Description", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/documents", 3500),
            createTableCell("List documents with folder hierarchy", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500, true),
            createTableCell("/documents/upload", 3500, true),
            createTableCell("Upload document (multipart)", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/documents/{id}", 3500),
            createTableCell("Get document metadata", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500, true),
            createTableCell("/documents/{id}/download", 3500, true),
            createTableCell("Download document (presigned URL)", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("POST", 1500),
            createTableCell("/documents/{id}/analyze", 3500),
            createTableCell("Request AI analysis of document", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500, true),
            createTableCell("/documents/{id}/versions", 3500, true),
            createTableCell("List document versions", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("GET", 1500),
            createTableCell("/documents/{id}/audit-log", 3500),
            createTableCell("Get access audit trail", 4360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("3.4 Webhook Specifications"),
      createParagraph("SPAC OS supports webhooks for real-time event notifications to external systems."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Webhook Events"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3500, 5860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Event Type", 3500),
            createTableHeaderCell("Trigger", 5860)
          ]}),
          new TableRow({ children: [
            createTableCell("spac.phase.changed", 3500),
            createTableCell("SPAC lifecycle phase transition", 5860)
          ]}),
          new TableRow({ children: [
            createTableCell("target.stage.changed", 3500, true),
            createTableCell("Deal pipeline stage transition", 5860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("document.uploaded", 3500),
            createTableCell("New document added to data room", 5860)
          ]}),
          new TableRow({ children: [
            createTableCell("compliance.deadline.approaching", 3500, true),
            createTableCell("Filing deadline within 14 days", 5860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("trust.balance.updated", 3500),
            createTableCell("Trust account balance change", 5860)
          ]}),
          new TableRow({ children: [
            createTableCell("ai.analysis.completed", 3500, true),
            createTableCell("AI document/deal analysis finished", 5860, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Webhook Payload Structure"),
      createCodeBlock("{"),
      createCodeBlock('  "id": "evt_abc123",'),
      createCodeBlock('  "type": "target.stage.changed",'),
      createCodeBlock('  "created_at": "2026-01-28T14:30:00Z",'),
      createCodeBlock('  "data": {'),
      createCodeBlock('    "target_id": "target_xyz789",'),
      createCodeBlock('    "from_stage": "initial_screening",'),
      createCodeBlock('    "to_stage": "deep_evaluation",'),
      createCodeBlock('    "changed_by": "user_abc123"'),
      createCodeBlock("  },"),
      createCodeBlock('  "signature": "sha256=abc123..."'),
      createCodeBlock("}"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Webhook Security"),
      createBulletPoint("HMAC SHA-256 signature in X-Webhook-Signature header"),
      createBulletPoint("Timestamp included to prevent replay attacks (5-minute window)"),
      createBulletPoint("TLS 1.3 required for webhook endpoints"),
      createBulletPoint("Automatic retry with exponential backoff (max 5 attempts)"),
      createBulletPoint("Webhook secret rotation supported without downtime"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("3.5 Rate Limiting Policies"),

      createHeading3("Rate Limit Tiers"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 2000, 2000, 2860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Tier", 2500),
            createTableHeaderCell("Requests/min", 2000),
            createTableHeaderCell("Burst", 2000),
            createTableHeaderCell("Applies To", 2860)
          ]}),
          new TableRow({ children: [
            createTableCell("Standard", 2500),
            createTableCell("100", 2000),
            createTableCell("150", 2000),
            createTableCell("Regular API calls", 2860)
          ]}),
          new TableRow({ children: [
            createTableCell("AI Endpoints", 2500, true),
            createTableCell("20", 2000, true),
            createTableCell("30", 2000, true),
            createTableCell("AI analysis requests", 2860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Bulk Operations", 2500),
            createTableCell("10", 2000),
            createTableCell("15", 2000),
            createTableCell("Import/export operations", 2860)
          ]}),
          new TableRow({ children: [
            createTableCell("Search", 2500, true),
            createTableCell("60", 2000, true),
            createTableCell("100", 2000, true),
            createTableCell("Full-text search queries", 2860, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Rate Limit Headers"),
      createCodeBlock("X-RateLimit-Limit: 100"),
      createCodeBlock("X-RateLimit-Remaining: 95"),
      createCodeBlock("X-RateLimit-Reset: 1704067260"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("429 Too Many Requests Response"),
      createCodeBlock("{"),
      createCodeBlock('  "error": {'),
      createCodeBlock('    "code": "rate_limit_exceeded",'),
      createCodeBlock('    "message": "Rate limit exceeded. Retry after 45 seconds.",'),
      createCodeBlock('    "retry_after": 45'),
      createCodeBlock("  }"),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 4: DATABASE SCHEMA ============
      createHeading1("4. Database Schema Details"),
      createParagraph("SPAC OS uses PostgreSQL (via Supabase) as the primary database with Row-Level Security (RLS) for multi-tenant data isolation."),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("4.1 Core Entity Tables"),

      createHeading3("organizations"),
      createCodeBlock("CREATE TABLE organizations ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  name VARCHAR(255) NOT NULL,"),
      createCodeBlock("  slug VARCHAR(100) UNIQUE NOT NULL,"),
      createCodeBlock("  settings JSONB DEFAULT '{}',"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("users"),
      createCodeBlock("CREATE TABLE users ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  clerk_id VARCHAR(255) UNIQUE NOT NULL,"),
      createCodeBlock("  org_id UUID REFERENCES organizations(id),"),
      createCodeBlock("  email VARCHAR(255) NOT NULL,"),
      createCodeBlock("  first_name VARCHAR(100),"),
      createCodeBlock("  last_name VARCHAR(100),"),
      createCodeBlock("  role VARCHAR(50) NOT NULL,"),
      createCodeBlock("  permissions JSONB DEFAULT '[]',"),
      createCodeBlock("  last_login_at TIMESTAMPTZ,"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("spacs"),
      createCodeBlock("CREATE TABLE spacs ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  org_id UUID REFERENCES organizations(id) NOT NULL,"),
      createCodeBlock("  name VARCHAR(255) NOT NULL,"),
      createCodeBlock("  ticker VARCHAR(10),"),
      createCodeBlock("  status VARCHAR(50) DEFAULT 'active',"),
      createCodeBlock("  phase VARCHAR(50) DEFAULT 'formation',"),
      createCodeBlock("  jurisdiction VARCHAR(50) DEFAULT 'delaware',"),
      createCodeBlock("  ipo_date DATE,"),
      createCodeBlock("  ipo_proceeds DECIMAL(15,2),"),
      createCodeBlock("  trust_balance DECIMAL(15,2),"),
      createCodeBlock("  trust_per_share DECIMAL(10,4),"),
      createCodeBlock("  business_combination_deadline DATE,"),
      createCodeBlock("  exchange VARCHAR(20),"),
      createCodeBlock("  sponsor_id UUID REFERENCES contacts(id),"),
      createCodeBlock("  underwriter_id UUID REFERENCES contacts(id),"),
      createCodeBlock("  legal_counsel_id UUID REFERENCES contacts(id),"),
      createCodeBlock("  metadata JSONB DEFAULT '{}',"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading3("targets"),
      createCodeBlock("CREATE TABLE targets ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  org_id UUID REFERENCES organizations(id) NOT NULL,"),
      createCodeBlock("  spac_id UUID REFERENCES spacs(id),"),
      createCodeBlock("  company_name VARCHAR(255) NOT NULL,"),
      createCodeBlock("  industry VARCHAR(100),"),
      createCodeBlock("  sub_industry VARCHAR(100),"),
      createCodeBlock("  headquarters VARCHAR(255),"),
      createCodeBlock("  website VARCHAR(255),"),
      createCodeBlock("  stage VARCHAR(50) DEFAULT 'sourcing',"),
      createCodeBlock("  source VARCHAR(100),"),
      createCodeBlock("  source_contact_id UUID REFERENCES contacts(id),"),
      createCodeBlock("  enterprise_value DECIMAL(15,2),"),
      createCodeBlock("  equity_value DECIMAL(15,2),"),
      createCodeBlock("  revenue_ltm DECIMAL(15,2),"),
      createCodeBlock("  revenue_growth_yoy DECIMAL(5,4),"),
      createCodeBlock("  ebitda_ltm DECIMAL(15,2),"),
      createCodeBlock("  gross_margin DECIMAL(5,4),"),
      createCodeBlock("  employee_count INTEGER,"),
      createCodeBlock("  founded_year INTEGER,"),
      createCodeBlock("  ai_score DECIMAL(5,2),"),
      createCodeBlock("  risk_score DECIMAL(5,2),"),
      createCodeBlock("  tags TEXT[],"),
      createCodeBlock("  metadata JSONB DEFAULT '{}',"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("contacts"),
      createCodeBlock("CREATE TABLE contacts ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  org_id UUID REFERENCES organizations(id) NOT NULL,"),
      createCodeBlock("  central_crm_id UUID,  -- FK to central CRM"),
      createCodeBlock("  contact_type VARCHAR(50) NOT NULL,"),
      createCodeBlock("  first_name VARCHAR(100),"),
      createCodeBlock("  last_name VARCHAR(100),"),
      createCodeBlock("  email VARCHAR(255),"),
      createCodeBlock("  phone VARCHAR(50),"),
      createCodeBlock("  title VARCHAR(100),"),
      createCodeBlock("  company_id UUID REFERENCES companies(id),"),
      createCodeBlock("  relationship_strength DECIMAL(5,2),"),
      createCodeBlock("  last_interaction_at TIMESTAMPTZ,"),
      createCodeBlock("  tags TEXT[],"),
      createCodeBlock("  spac_notes TEXT,"),
      createCodeBlock("  nda_status VARCHAR(50),"),
      createCodeBlock("  nda_signed_at TIMESTAMPTZ,"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading3("documents"),
      createCodeBlock("CREATE TABLE documents ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  org_id UUID REFERENCES organizations(id) NOT NULL,"),
      createCodeBlock("  parent_folder_id UUID REFERENCES documents(id),"),
      createCodeBlock("  type VARCHAR(20) NOT NULL,  -- folder, file"),
      createCodeBlock("  name VARCHAR(255) NOT NULL,"),
      createCodeBlock("  category VARCHAR(100),"),
      createCodeBlock("  file_path VARCHAR(500),"),
      createCodeBlock("  file_size BIGINT,"),
      createCodeBlock("  mime_type VARCHAR(100),"),
      createCodeBlock("  version INTEGER DEFAULT 1,"),
      createCodeBlock("  status VARCHAR(50) DEFAULT 'active',"),
      createCodeBlock("  access_level VARCHAR(50) DEFAULT 'private',"),
      createCodeBlock("  uploaded_by UUID REFERENCES users(id),"),
      createCodeBlock("  ai_summary TEXT,"),
      createCodeBlock("  ai_extracted_data JSONB,"),
      createCodeBlock("  ai_analyzed_at TIMESTAMPTZ,"),
      createCodeBlock("  tags TEXT[],"),
      createCodeBlock("  metadata JSONB DEFAULT '{}',"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("compliance_filings"),
      createCodeBlock("CREATE TABLE compliance_filings ("),
      createCodeBlock("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),"),
      createCodeBlock("  org_id UUID REFERENCES organizations(id) NOT NULL,"),
      createCodeBlock("  spac_id UUID REFERENCES spacs(id) NOT NULL,"),
      createCodeBlock("  filing_type VARCHAR(50) NOT NULL,"),
      createCodeBlock("  filing_period VARCHAR(50),"),
      createCodeBlock("  due_date DATE NOT NULL,"),
      createCodeBlock("  filed_date DATE,"),
      createCodeBlock("  status VARCHAR(50) DEFAULT 'pending',"),
      createCodeBlock("  sec_accession_number VARCHAR(50),"),
      createCodeBlock("  document_id UUID REFERENCES documents(id),"),
      createCodeBlock("  notes TEXT,"),
      createCodeBlock("  created_at TIMESTAMPTZ DEFAULT NOW(),"),
      createCodeBlock("  updated_at TIMESTAMPTZ DEFAULT NOW()"),
      createCodeBlock(");"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("4.2 Relationships and Foreign Keys"),

      createHeading3("Entity Relationship Summary"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 2500, 2000, 2360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Parent", 2500),
            createTableHeaderCell("Child", 2500),
            createTableHeaderCell("Type", 2000),
            createTableHeaderCell("On Delete", 2360)
          ]}),
          new TableRow({ children: [
            createTableCell("organizations", 2500),
            createTableCell("users", 2500),
            createTableCell("1:Many", 2000),
            createTableCell("CASCADE", 2360)
          ]}),
          new TableRow({ children: [
            createTableCell("organizations", 2500, true),
            createTableCell("spacs", 2500, true),
            createTableCell("1:Many", 2000, true),
            createTableCell("CASCADE", 2360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("spacs", 2500),
            createTableCell("targets", 2500),
            createTableCell("1:Many", 2000),
            createTableCell("SET NULL", 2360)
          ]}),
          new TableRow({ children: [
            createTableCell("targets", 2500, true),
            createTableCell("due_diligence_items", 2500, true),
            createTableCell("1:Many", 2000, true),
            createTableCell("CASCADE", 2360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("contacts", 2500),
            createTableCell("interactions", 2500),
            createTableCell("1:Many", 2000),
            createTableCell("CASCADE", 2360)
          ]}),
          new TableRow({ children: [
            createTableCell("documents", 2500, true),
            createTableCell("document_versions", 2500, true),
            createTableCell("1:Many", 2000, true),
            createTableCell("CASCADE", 2360, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("4.3 Indexes and Performance"),

      createHeading3("Primary Indexes"),
      createCodeBlock("-- Query optimization indexes"),
      createCodeBlock("CREATE INDEX idx_spacs_org_status ON spacs(org_id, status);"),
      createCodeBlock("CREATE INDEX idx_spacs_phase ON spacs(phase);"),
      createCodeBlock("CREATE INDEX idx_targets_org_stage ON targets(org_id, stage);"),
      createCodeBlock("CREATE INDEX idx_targets_spac ON targets(spac_id);"),
      createCodeBlock("CREATE INDEX idx_targets_ai_score ON targets(ai_score DESC);"),
      createCodeBlock("CREATE INDEX idx_contacts_org_type ON contacts(org_id, contact_type);"),
      createCodeBlock("CREATE INDEX idx_documents_org_parent ON documents(org_id, parent_folder_id);"),
      createCodeBlock("CREATE INDEX idx_filings_spac_due ON compliance_filings(spac_id, due_date);"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Full-Text Search Indexes"),
      createCodeBlock("-- Document search"),
      createCodeBlock("CREATE INDEX idx_documents_search ON documents"),
      createCodeBlock("  USING gin(to_tsvector('english', name || ' ' || COALESCE(ai_summary, '')));"),
      createCodeBlock(""),
      createCodeBlock("-- Target company search"),
      createCodeBlock("CREATE INDEX idx_targets_search ON targets"),
      createCodeBlock("  USING gin(to_tsvector('english', company_name || ' ' || COALESCE(industry, '')));"),
      createCodeBlock(""),
      createCodeBlock("-- Contact search"),
      createCodeBlock("CREATE INDEX idx_contacts_search ON contacts"),
      createCodeBlock("  USING gin(to_tsvector('english',"),
      createCodeBlock("    COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(email, '')));"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("4.4 Data Validation Rules"),

      createHeading3("Check Constraints"),
      createCodeBlock("-- SPAC validation"),
      createCodeBlock("ALTER TABLE spacs ADD CONSTRAINT chk_spac_status"),
      createCodeBlock("  CHECK (status IN ('draft', 'active', 'completed', 'liquidated'));"),
      createCodeBlock(""),
      createCodeBlock("ALTER TABLE spacs ADD CONSTRAINT chk_spac_phase"),
      createCodeBlock("  CHECK (phase IN ('formation', 'pre_ipo', 'ipo', 'target_search',"),
      createCodeBlock("    'due_diligence', 'definitive_agreement', 'proxy_vote', 'closing', 'post_merger'));"),
      createCodeBlock(""),
      createCodeBlock("-- Target validation"),
      createCodeBlock("ALTER TABLE targets ADD CONSTRAINT chk_target_stage"),
      createCodeBlock("  CHECK (stage IN ('sourcing', 'initial_screening', 'deep_evaluation',"),
      createCodeBlock("    'negotiation', 'execution', 'closed', 'passed'));"),
      createCodeBlock(""),
      createCodeBlock("ALTER TABLE targets ADD CONSTRAINT chk_ai_score"),
      createCodeBlock("  CHECK (ai_score >= 0 AND ai_score <= 100);"),
      createCodeBlock(""),
      createCodeBlock("-- Document validation"),
      createCodeBlock("ALTER TABLE documents ADD CONSTRAINT chk_document_type"),
      createCodeBlock("  CHECK (type IN ('folder', 'file'));"),
      createCodeBlock(""),
      createCodeBlock("-- Contact validation"),
      createCodeBlock("ALTER TABLE contacts ADD CONSTRAINT chk_relationship_strength"),
      createCodeBlock("  CHECK (relationship_strength >= 0 AND relationship_strength <= 100);"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Row-Level Security Policies"),
      createCodeBlock("-- Enable RLS on all tables"),
      createCodeBlock("ALTER TABLE spacs ENABLE ROW LEVEL SECURITY;"),
      createCodeBlock("ALTER TABLE targets ENABLE ROW LEVEL SECURITY;"),
      createCodeBlock("ALTER TABLE documents ENABLE ROW LEVEL SECURITY;"),
      createCodeBlock(""),
      createCodeBlock("-- Organization isolation policy"),
      createCodeBlock("CREATE POLICY org_isolation ON spacs"),
      createCodeBlock("  FOR ALL USING (org_id = current_setting('app.org_id')::uuid);"),
      createCodeBlock(""),
      createCodeBlock("CREATE POLICY org_isolation ON targets"),
      createCodeBlock("  FOR ALL USING (org_id = current_setting('app.org_id')::uuid);"),
      createCodeBlock(""),
      createCodeBlock("CREATE POLICY org_isolation ON documents"),
      createCodeBlock("  FOR ALL USING (org_id = current_setting('app.org_id')::uuid);"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 5: UI/UX SPECIFICATIONS ============
      createHeading1("5. UI/UX Wireframe Descriptions"),

      createHeading2("5.1 Dashboard Layout"),
      createParagraph("The main dashboard serves as the command center for all SPAC operations, providing at-a-glance visibility into portfolio health and actionable insights."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Header Bar (Fixed, 64px height)"),
      createBulletPoint("Left: SPAC OS logo, global search bar (Cmd+K shortcut)"),
      createBulletPoint("Center: SPAC selector dropdown (for multi-SPAC users)"),
      createBulletPoint("Right: Notification bell (badge count), user avatar menu, settings gear"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Left Sidebar (Collapsible, 240px width)"),
      createBulletPoint("Navigation items: Dashboard, Deal Pipeline, Documents, Contacts, Compliance, Analytics"),
      createBulletPoint("Quick Actions: New Target, Upload Document, Log Interaction"),
      createBulletPoint("Footer: Help/Support link, keyboard shortcuts reference"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Main Content Area - Dashboard Grid"),
      createHeading4("Row 1: Key Metrics (4 cards)"),
      createBulletPoint("SPAC Status Card: Phase badge, days to deadline countdown, progress indicator"),
      createBulletPoint("Trust Account Card: Current balance, per-share value, interest MTD"),
      createBulletPoint("Pipeline Summary Card: Total targets, conversion funnel, active deals"),
      createBulletPoint("Compliance Score Card: Filing status, upcoming deadlines count, risk indicators"),
      new Paragraph({ spacing: { after: 100 } }),

      createHeading4("Row 2: Activity Panels (2 columns)"),
      createBulletPoint("AI Insights Panel (left): Priority alerts, recommended actions, risk warnings"),
      createBulletPoint("Recent Activity Feed (right): Team actions, document updates, deal movements"),
      new Paragraph({ spacing: { after: 100 } }),

      createHeading4("Row 3: Charts and Timeline"),
      createBulletPoint("Pipeline Funnel Chart: Visual funnel with click-through to each stage"),
      createBulletPoint("SPAC Lifecycle Timeline: Gantt-style view of phases with milestones"),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("5.2 Core Screen Components"),

      createHeading3("Deal Pipeline Screen"),
      createBulletPoint("Kanban View: Draggable cards across stage columns (Sourcing through Closed)"),
      createBulletPoint("List View: Sortable table with all target fields, inline editing"),
      createBulletPoint("Target Card: Company name, industry badge, AI score indicator, assigned team"),
      createBulletPoint("Quick Actions: Log activity, update stage, assign team, view details"),
      createBulletPoint("Filters: Industry, stage, AI score range, assigned to, date range"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Document Data Room Screen"),
      createBulletPoint("Folder Tree: Left panel with hierarchical navigation"),
      createBulletPoint("File Grid/List: Toggle between grid (thumbnails) and list views"),
      createBulletPoint("Document Preview: Right panel with inline preview for PDFs, images"),
      createBulletPoint("Bulk Actions: Multi-select for move, download, share, delete"),
      createBulletPoint("Search: Full-text search with filters (type, date, category, tags)"),
      createBulletPoint("Upload Zone: Drag-and-drop area with progress indicators"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Contact/CRM Screen"),
      createBulletPoint("Contact List: Filterable table with relationship strength indicator"),
      createBulletPoint("Contact Detail: Right panel with profile, interaction history, related deals"),
      createBulletPoint("Network Graph: Visual relationship mapping (optional view)"),
      createBulletPoint("Quick Actions: Email, call, schedule meeting, add note"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("5.3 Mobile Responsive Design"),

      createHeading3("Breakpoints"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 2500, 4360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Breakpoint", 2500),
            createTableHeaderCell("Width", 2500),
            createTableHeaderCell("Layout Changes", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("Mobile", 2500),
            createTableCell("< 640px", 2500),
            createTableCell("Single column, bottom nav, collapsible sections", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("Tablet", 2500, true),
            createTableCell("640px - 1024px", 2500, true),
            createTableCell("Two columns, side panel overlay, compact tables", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Desktop", 2500),
            createTableCell("1024px - 1440px", 2500),
            createTableCell("Full layout with persistent sidebar", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("Large Desktop", 2500, true),
            createTableCell("> 1440px", 2500, true),
            createTableCell("Maximum content width 1440px, centered", 4360, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Mobile-Specific Adaptations"),
      createBulletPoint("Navigation: Bottom tab bar replaces sidebar (5 primary items)"),
      createBulletPoint("Dashboard: Stacked cards, horizontal scroll for metrics"),
      createBulletPoint("Pipeline: List view only (no Kanban), swipe for quick actions"),
      createBulletPoint("Documents: Folder breadcrumb navigation, native share sheet"),
      createBulletPoint("Search: Full-screen search with recent/suggested"),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("5.4 Accessibility Requirements"),

      createHeading3("WCAG 2.1 Level AA Compliance"),
      createBulletPoint("Color Contrast: Minimum 4.5:1 for normal text, 3:1 for large text"),
      createBulletPoint("Focus Indicators: Visible focus rings on all interactive elements"),
      createBulletPoint("Keyboard Navigation: Full functionality without mouse"),
      createBulletPoint("Screen Reader Support: ARIA labels, roles, and live regions"),
      createBulletPoint("Skip Links: Skip to main content, skip to navigation"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Specific Implementations"),
      createBulletPoint("Tables: Proper header associations, sortable column announcements"),
      createBulletPoint("Forms: Associated labels, error announcements, required field indicators"),
      createBulletPoint("Modals: Focus trap, escape to close, return focus on close"),
      createBulletPoint("Charts: Text alternatives, data tables for screen readers"),
      createBulletPoint("Color Usage: Never rely on color alone for meaning (icons + text)"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 6: AI/ML SPECIFICATIONS ============
      createHeading1("6. AI/ML Feature Specifications"),

      createHeading2("6.1 Document Analysis Pipeline"),
      createParagraph("AI-powered document processing for automatic extraction, summarization, and insights."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Pipeline Architecture"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1500, 2500, 5360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Stage", 1500),
            createTableHeaderCell("Component", 2500),
            createTableHeaderCell("Description", 5360)
          ]}),
          new TableRow({ children: [
            createTableCell("1", 1500),
            createTableCell("Document Ingestion", 2500),
            createTableCell("Upload trigger, file validation, virus scan, format detection", 5360)
          ]}),
          new TableRow({ children: [
            createTableCell("2", 1500, true),
            createTableCell("Text Extraction", 2500, true),
            createTableCell("OCR for scanned docs, table extraction, structure preservation", 5360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("3", 1500),
            createTableCell("Chunking", 2500),
            createTableCell("Semantic chunking (512-1024 tokens), overlap preservation", 5360)
          ]}),
          new TableRow({ children: [
            createTableCell("4", 1500, true),
            createTableCell("Embedding", 2500, true),
            createTableCell("Generate embeddings via text-embedding-3-large", 5360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("5", 1500),
            createTableCell("Vector Storage", 2500),
            createTableCell("Store in Pinecone/pgvector with metadata", 5360)
          ]}),
          new TableRow({ children: [
            createTableCell("6", 1500, true),
            createTableCell("Analysis", 2500, true),
            createTableCell("Claude API for summarization, key term extraction, red flags", 5360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("7", 1500),
            createTableCell("Storage", 2500),
            createTableCell("Save results to database, trigger notifications", 5360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Document Types Supported"),
      createBulletPoint("Legal Documents: Contracts, LOIs, NDAs, merger agreements - Extract key terms, obligations, dates"),
      createBulletPoint("Financial Statements: Income statements, balance sheets, cash flow - Normalize and validate"),
      createBulletPoint("SEC Filings: 10-K, 10-Q, S-1, proxy statements - Parse structured sections"),
      createBulletPoint("Presentations: Pitch decks, board materials - Extract key points and data"),
      createBulletPoint("Due Diligence Reports: Third-party audits, legal opinions - Summarize findings"),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("6.2 Deal Scoring Algorithm"),
      createParagraph("AI-generated scores to help prioritize and evaluate target companies."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Scoring Model Inputs"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 1500, 4860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Factor", 3000),
            createTableHeaderCell("Weight", 1500),
            createTableHeaderCell("Metrics", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("Financial Health", 3000),
            createTableCell("25%", 1500),
            createTableCell("Revenue growth, gross margin, EBITDA margin, cash flow", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("Market Position", 3000, true),
            createTableCell("20%", 1500, true),
            createTableCell("TAM, market share, competitive moat, industry growth", 4860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Management Quality", 3000),
            createTableCell("15%", 1500),
            createTableCell("Experience, track record, public company readiness", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("Deal Fit", 3000, true),
            createTableCell("15%", 1500, true),
            createTableCell("Valuation alignment, SPAC size match, sector fit", 4860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Risk Factors", 3000),
            createTableCell("15%", 1500),
            createTableCell("Customer concentration, regulatory, key person, litigation", 4860)
          ]}),
          new TableRow({ children: [
            createTableCell("Transaction Readiness", 3000, true),
            createTableCell("10%", 1500, true),
            createTableCell("Audit status, governance, reporting systems, timeline", 4860, true)
          ]})
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading3("Score Calculation"),
      createCodeBlock("// Weighted scoring algorithm"),
      createCodeBlock("function calculateDealScore(target, weights) {"),
      createCodeBlock("  const scores = {"),
      createCodeBlock("    financial: evaluateFinancialHealth(target.financials),"),
      createCodeBlock("    market: evaluateMarketPosition(target.marketData),"),
      createCodeBlock("    management: evaluateManagement(target.team),"),
      createCodeBlock("    dealFit: evaluateDealFit(target, spac),"),
      createCodeBlock("    risk: evaluateRiskFactors(target.risks),"),
      createCodeBlock("    readiness: evaluateReadiness(target.readiness)"),
      createCodeBlock("  };"),
      createCodeBlock(""),
      createCodeBlock("  const weightedScore = Object.entries(scores).reduce((total, [key, score]) => {"),
      createCodeBlock("    return total + (score * weights[key]);"),
      createCodeBlock("  }, 0);"),
      createCodeBlock(""),
      createCodeBlock("  return {"),
      createCodeBlock("    overall: Math.round(weightedScore * 100) / 100,"),
      createCodeBlock("    breakdown: scores,"),
      createCodeBlock("    confidence: calculateConfidence(target),"),
      createCodeBlock("    recommendations: generateRecommendations(scores)"),
      createCodeBlock("  };"),
      createCodeBlock("}"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Score Output"),
      createCodeBlock("{"),
      createCodeBlock('  "target_id": "target_abc123",'),
      createCodeBlock('  "overall_score": 78.5,'),
      createCodeBlock('  "confidence": 0.85,'),
      createCodeBlock('  "breakdown": {'),
      createCodeBlock('    "financial_health": 82,'),
      createCodeBlock('    "market_position": 75,'),
      createCodeBlock('    "management_quality": 88,'),
      createCodeBlock('    "deal_fit": 72,'),
      createCodeBlock('    "risk_factors": 65,'),
      createCodeBlock('    "transaction_readiness": 80'),
      createCodeBlock("  },"),
      createCodeBlock('  "recommendations": ['),
      createCodeBlock('    "Strong revenue growth warrants premium valuation",'),
      createCodeBlock('    "Customer concentration risk requires mitigation plan",'),
      createCodeBlock('    "Management team has relevant public company experience"'),
      createCodeBlock("  ],"),
      createCodeBlock('  "comparable_deals": ["deal_1", "deal_2", "deal_3"],'),
      createCodeBlock('  "generated_at": "2026-01-28T14:30:00Z"'),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("6.3 Recommendation Engine"),
      createParagraph("Proactive AI recommendations to guide users toward optimal actions."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Recommendation Types"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 6860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Type", 2500),
            createTableHeaderCell("Examples", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Deal Actions", 2500),
            createTableCell("Schedule follow-up, request financials, advance to next stage, add to watchlist", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Risk Alerts", 2500, true),
            createTableCell("Deadline approaching, document missing, competitor activity detected", 6860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Relationship", 2500),
            createTableCell("Reconnect with contact, leverage network for intro, update relationship status", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Compliance", 2500, true),
            createTableCell("Prepare filing, review draft, schedule board meeting", 6860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Optimization", 2500),
            createTableCell("Merge duplicate contacts, update stale data, archive inactive targets", 6860)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("6.4 RAG Implementation"),
      createParagraph("Retrieval-Augmented Generation for contextual AI responses using organizational knowledge."),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Vector Database Configuration"),
      createBulletPoint("Provider: Pinecone (primary) or pgvector (self-hosted option)"),
      createBulletPoint("Embedding Model: OpenAI text-embedding-3-large (3072 dimensions)"),
      createBulletPoint("Index Configuration: Cosine similarity, approximate nearest neighbors"),
      createBulletPoint("Namespace Strategy: Separate namespaces per organization for isolation"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Retrieval Strategy"),
      createCodeBlock("// Hybrid retrieval combining dense and sparse"),
      createCodeBlock("async function retrieveContext(query, userId, filters) {"),
      createCodeBlock("  // 1. Generate query embedding"),
      createCodeBlock("  const queryEmbedding = await embed(query);"),
      createCodeBlock("  "),
      createCodeBlock("  // 2. Dense retrieval from vector store"),
      createCodeBlock("  const denseResults = await vectorStore.query({"),
      createCodeBlock("    vector: queryEmbedding,"),
      createCodeBlock("    topK: 10,"),
      createCodeBlock("    filter: { org_id: filters.orgId, ...filters }"),
      createCodeBlock("  });"),
      createCodeBlock("  "),
      createCodeBlock("  // 3. Sparse retrieval (BM25) for keyword matching"),
      createCodeBlock("  const sparseResults = await fullTextSearch(query, filters);"),
      createCodeBlock("  "),
      createCodeBlock("  // 4. Reciprocal rank fusion"),
      createCodeBlock("  const mergedResults = rrfMerge(denseResults, sparseResults);"),
      createCodeBlock("  "),
      createCodeBlock("  // 5. Re-rank with cross-encoder"),
      createCodeBlock("  const rerankedResults = await rerank(query, mergedResults);"),
      createCodeBlock("  "),
      createCodeBlock("  return rerankedResults.slice(0, 5);"),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 7: SECURITY ARCHITECTURE ============
      createHeading1("7. Security Architecture"),

      createHeading2("7.1 Authentication/Authorization"),

      createHeading3("Authentication Stack"),
      createBulletPoint("Primary Provider: Clerk (managed authentication service)"),
      createBulletPoint("SSO Support: SAML 2.0, OIDC for enterprise identity providers"),
      createBulletPoint("MFA: Required for all users (TOTP, SMS, or hardware key)"),
      createBulletPoint("Session Management: 24-hour sessions with activity-based extension"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Role-Based Access Control (RBAC)"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2000, 7360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Role", 2000),
            createTableHeaderCell("Permissions", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("Admin", 2000),
            createTableCell("Full access to all modules, user management, settings, audit logs", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("Sponsor", 2000, true),
            createTableCell("All read access, deal approval, stage transitions, sensitive financial data", 7360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Analyst", 2000),
            createTableCell("Deal pipeline CRUD, document upload, contact management, limited financial", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("Compliance", 2000, true),
            createTableCell("Compliance module full access, document access, audit log read", 7360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Viewer", 2000),
            createTableCell("Read-only access to permitted modules", 7360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Permission Granularity"),
      createCodeBlock("// Permission structure"),
      createCodeBlock("{"),
      createCodeBlock('  "permissions": ['),
      createCodeBlock('    "spac:read",'),
      createCodeBlock('    "spac:write",'),
      createCodeBlock('    "spac:delete",'),
      createCodeBlock('    "deals:read",'),
      createCodeBlock('    "deals:write",'),
      createCodeBlock('    "deals:stage_transition",'),
      createCodeBlock('    "deals:approve",'),
      createCodeBlock('    "documents:read",'),
      createCodeBlock('    "documents:write",'),
      createCodeBlock('    "documents:delete",'),
      createCodeBlock('    "documents:share",'),
      createCodeBlock('    "contacts:read",'),
      createCodeBlock('    "contacts:write",'),
      createCodeBlock('    "compliance:read",'),
      createCodeBlock('    "compliance:write",'),
      createCodeBlock('    "analytics:read",'),
      createCodeBlock('    "admin:users",'),
      createCodeBlock('    "admin:settings",'),
      createCodeBlock('    "admin:audit"'),
      createCodeBlock("  ]"),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("7.2 Data Encryption"),

      createHeading3("Encryption at Rest"),
      createBulletPoint("Database: AES-256 encryption via Supabase (AWS RDS encryption)"),
      createBulletPoint("File Storage: AES-256 encryption via S3 SSE-S3 or SSE-KMS"),
      createBulletPoint("Key Management: AWS KMS with automatic key rotation (annual)"),
      createBulletPoint("Backups: Encrypted with separate keys, stored in different region"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Encryption in Transit"),
      createBulletPoint("TLS Version: 1.3 required, 1.2 minimum"),
      createBulletPoint("Certificate: EV SSL certificate from DigiCert"),
      createBulletPoint("HSTS: Enabled with 1-year max-age, includeSubDomains, preload"),
      createBulletPoint("Certificate Pinning: Implemented in mobile applications"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Sensitive Data Handling"),
      createBulletPoint("PII Fields: Additional application-level encryption (envelope encryption)"),
      createBulletPoint("Financial Data: Encrypted columns with separate key hierarchy"),
      createBulletPoint("API Keys/Secrets: HashiCorp Vault for secure storage and rotation"),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("7.3 Audit Logging"),

      createHeading3("Logged Events"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 6860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Category", 2500),
            createTableHeaderCell("Events", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Authentication", 2500),
            createTableCell("Login success/failure, logout, password change, MFA events", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Authorization", 2500, true),
            createTableCell("Permission checks, access denied, role changes", 6860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Data Access", 2500),
            createTableCell("Read operations on sensitive data, document downloads", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Data Modification", 2500, true),
            createTableCell("Create, update, delete operations with before/after values", 6860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Admin Actions", 2500),
            createTableCell("User management, settings changes, permission updates", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("System Events", 2500, true),
            createTableCell("API errors, integration failures, scheduled job results", 6860, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Audit Log Schema"),
      createCodeBlock("{"),
      createCodeBlock('  "id": "log_abc123",'),
      createCodeBlock('  "timestamp": "2026-01-28T14:30:00.123Z",'),
      createCodeBlock('  "event_type": "data.document.download",'),
      createCodeBlock('  "actor": {'),
      createCodeBlock('    "user_id": "user_xyz",'),
      createCodeBlock('    "email": "analyst@direzze.io",'),
      createCodeBlock('    "ip_address": "192.168.1.100",'),
      createCodeBlock('    "user_agent": "Mozilla/5.0..."'),
      createCodeBlock("  },"),
      createCodeBlock('  "resource": {'),
      createCodeBlock('    "type": "document",'),
      createCodeBlock('    "id": "doc_abc",'),
      createCodeBlock('    "name": "Merger_Agreement_Draft.pdf"'),
      createCodeBlock("  },"),
      createCodeBlock('  "result": "success",'),
      createCodeBlock('  "metadata": {}'),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("7.4 Compliance Requirements"),

      createHeading3("SOC 2 Type II Controls"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2000, 7360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Principle", 2000),
            createTableHeaderCell("Key Controls", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("Security", 2000),
            createTableCell("Access controls, encryption, vulnerability management, incident response", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("Availability", 2000, true),
            createTableCell("Uptime monitoring, disaster recovery, capacity planning", 7360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Confidentiality", 2000),
            createTableCell("Data classification, encryption, access restrictions", 7360)
          ]}),
          new TableRow({ children: [
            createTableCell("Processing Integrity", 2000, true),
            createTableCell("Input validation, error handling, reconciliation", 7360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Privacy", 2000),
            createTableCell("Consent management, data minimization, retention policies", 7360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("SEC Rule 17a-4 Compliance"),
      createBulletPoint("Record Retention: All communications and documents retained for minimum 6 years"),
      createBulletPoint("Immutability: WORM (Write Once Read Many) storage for regulatory records"),
      createBulletPoint("Accessibility: Records retrievable within 24 hours upon SEC request"),
      createBulletPoint("Audit Trail: Complete chain of custody for all regulated documents"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("GDPR Compliance"),
      createBulletPoint("Data Processing: Documented lawful basis for all personal data processing"),
      createBulletPoint("Rights Support: Data export, correction, and deletion capabilities"),
      createBulletPoint("Breach Notification: 72-hour notification process documented and tested"),
      createBulletPoint("DPA: Standard Contractual Clauses with all EU data processors"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 8: INTEGRATION SPECIFICATIONS ============
      createHeading1("8. Integration Specifications"),

      createHeading2("8.1 SEC EDGAR API Integration"),

      createHeading3("Connection Details"),
      createBulletPoint("Endpoint: https://data.sec.gov/submissions/CIK{cik}.json"),
      createBulletPoint("Rate Limit: 10 requests per second (SEC fair access policy)"),
      createBulletPoint("Authentication: User-Agent header with contact email required"),
      createBulletPoint("Data Format: JSON for metadata, raw filing documents"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Sync Operations"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 2500, 4360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Operation", 2500),
            createTableHeaderCell("Frequency", 2500),
            createTableHeaderCell("Description", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("Filing Monitor", 2500),
            createTableCell("Every 15 min", 2500),
            createTableCell("Check for new filings for tracked SPACs", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("Filing Download", 2500, true),
            createTableCell("On detection", 2500, true),
            createTableCell("Download and parse new filing documents", 4360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Historical Sync", 2500),
            createTableCell("On SPAC add", 2500),
            createTableCell("Pull all historical filings for new SPAC", 4360)
          ]}),
          new TableRow({ children: [
            createTableCell("Comment Letter Check", 2500, true),
            createTableCell("Daily", 2500, true),
            createTableCell("Monitor for SEC comment letters", 4360, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Parsed Filing Data"),
      createCodeBlock("{"),
      createCodeBlock('  "filing_id": "0001234567-26-000123",'),
      createCodeBlock('  "form_type": "10-K",'),
      createCodeBlock('  "filed_date": "2026-01-28",'),
      createCodeBlock('  "period_of_report": "2025-12-31",'),
      createCodeBlock('  "documents": ['),
      createCodeBlock('    { "name": "10-K", "url": "...", "size": 1234567 },'),
      createCodeBlock('    { "name": "EX-31.1", "url": "...", "size": 12345 }'),
      createCodeBlock("  ],"),
      createCodeBlock('  "extracted_data": {'),
      createCodeBlock('    "trust_balance": 302500000,'),
      createCodeBlock('    "shares_outstanding": 30000000,'),
      createCodeBlock('    "per_share_value": 10.08'),
      createCodeBlock("  }"),
      createCodeBlock("}"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("8.2 Email Integration"),

      createHeading3("Gmail Integration (Google Workspace)"),
      createBulletPoint("OAuth 2.0: Scopes for gmail.readonly, gmail.send, gmail.labels"),
      createBulletPoint("Sync Method: Push notifications via Cloud Pub/Sub for real-time"),
      createBulletPoint("Historical Sync: Gmail API batch requests for backfill"),
      createBulletPoint("Threading: Gmail thread ID mapped to contact interactions"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Outlook Integration (Microsoft 365)"),
      createBulletPoint("OAuth 2.0: Microsoft Graph API with Mail.Read, Mail.Send"),
      createBulletPoint("Sync Method: Delta queries for incremental sync"),
      createBulletPoint("Change Notifications: Webhooks for real-time updates"),
      createBulletPoint("Shared Mailboxes: Support for team inbox access"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Email Capture Logic"),
      createCodeBlock("// Email matching and association"),
      createCodeBlock("async function processIncomingEmail(email) {"),
      createCodeBlock("  // 1. Extract email addresses"),
      createCodeBlock("  const addresses = extractAddresses(email.from, email.to, email.cc);"),
      createCodeBlock("  "),
      createCodeBlock("  // 2. Match to contacts"),
      createCodeBlock("  const contacts = await matchContacts(addresses);"),
      createCodeBlock("  "),
      createCodeBlock("  // 3. Determine related entities"),
      createCodeBlock("  const targets = await findRelatedTargets(contacts);"),
      createCodeBlock("  const deals = await findRelatedDeals(contacts);"),
      createCodeBlock("  "),
      createCodeBlock("  // 4. Create interaction records"),
      createCodeBlock("  for (const contact of contacts) {"),
      createCodeBlock("    await createInteraction({"),
      createCodeBlock("      contact_id: contact.id,"),
      createCodeBlock('      type: "email",'),
      createCodeBlock("      direction: email.from === userEmail ? 'outbound' : 'inbound',"),
      createCodeBlock("      subject: email.subject,"),
      createCodeBlock("      date: email.date,"),
      createCodeBlock("      related_targets: targets,"),
      createCodeBlock("      email_thread_id: email.threadId"),
      createCodeBlock("    });"),
      createCodeBlock("  }"),
      createCodeBlock("}"),
      new Paragraph({ spacing: { after: 200 } }),

      createHeading2("8.3 Calendar Integration"),

      createHeading3("Supported Platforms"),
      createBulletPoint("Google Calendar: Full read/write via Google Calendar API"),
      createBulletPoint("Outlook Calendar: Full read/write via Microsoft Graph API"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Sync Capabilities"),
      createBulletPoint("Meeting Detection: Automatically detect meetings with contacts"),
      createBulletPoint("Pre-meeting Briefing: Generate AI briefing 1 hour before scheduled meetings"),
      createBulletPoint("Post-meeting Logging: Prompt for meeting notes after meeting end time"),
      createBulletPoint("Deadline Sync: Push compliance deadlines to calendar as events"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("8.4 Data Provider Integration"),

      createHeading3("PitchBook/Crunchbase"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 6360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Data Type", 3000),
            createTableHeaderCell("Fields Synced", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("Company Profile", 3000),
            createTableCell("Name, description, HQ, website, employee count, founded date", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("Funding History", 3000, true),
            createTableCell("Rounds, dates, amounts, investors, valuations", 6360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Key People", 3000),
            createTableCell("Executives, board members, titles, backgrounds", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("Financials", 3000, true),
            createTableCell("Revenue, growth rate, employee count (where available)", 6360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Market Data", 3000),
            createTableCell("Industry, competitors, market size estimates", 6360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Bloomberg/Capital IQ"),
      createBulletPoint("Public Company Data: Market cap, trading data, financials"),
      createBulletPoint("Comparable Analysis: Automated comp set identification"),
      createBulletPoint("Transaction Data: M&A transactions, multiples, deal terms"),
      createBulletPoint("Credit Data: Ratings, spreads, covenant information"),

      new Paragraph({ children: [new PageBreak()] }),

      // ============ SECTION 9: TESTING STRATEGY ============
      createHeading1("9. Testing Strategy"),

      createHeading2("9.1 Unit Testing"),

      createHeading3("Testing Framework"),
      createBulletPoint("Framework: Vitest (compatible with Jest) for fast execution"),
      createBulletPoint("Assertions: Built-in expect with extended matchers"),
      createBulletPoint("Mocking: vi.mock for module mocking, MSW for API mocking"),
      createBulletPoint("Coverage Target: 80% line coverage, 70% branch coverage"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Unit Test Categories"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [2500, 6860],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Category", 2500),
            createTableHeaderCell("Focus Areas", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Business Logic", 2500),
            createTableCell("Score calculations, stage transitions, validation rules", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("API Handlers", 2500, true),
            createTableCell("Request validation, response formatting, error handling", 6860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Data Access", 2500),
            createTableCell("Repository methods, query builders, data transformations", 6860)
          ]}),
          new TableRow({ children: [
            createTableCell("Utilities", 2500, true),
            createTableCell("Date calculations, formatting, string manipulation", 6860, true)
          ]}),
          new TableRow({ children: [
            createTableCell("React Components", 2500),
            createTableCell("Render output, user interactions, state changes", 6860)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Example Unit Test"),
      createCodeBlock("// Deal score calculation test"),
      createCodeBlock("describe('calculateDealScore', () => {"),
      createCodeBlock("  it('should weight financial health at 25%', () => {"),
      createCodeBlock("    const target = mockTarget({ financialScore: 80 });"),
      createCodeBlock("    const result = calculateDealScore(target, defaultWeights);"),
      createCodeBlock("    expect(result.breakdown.financial_health).toBe(80);"),
      createCodeBlock("    expect(result.overall).toBeCloseTo(expectedScore, 1);"),
      createCodeBlock("  });"),
      createCodeBlock(""),
      createCodeBlock("  it('should return low confidence for incomplete data', () => {"),
      createCodeBlock("    const target = mockTarget({ missingFields: ['revenue', 'ebitda'] });"),
      createCodeBlock("    const result = calculateDealScore(target, defaultWeights);"),
      createCodeBlock("    expect(result.confidence).toBeLessThan(0.7);"),
      createCodeBlock("  });"),
      createCodeBlock("});"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("9.2 Integration Testing"),

      createHeading3("Integration Test Scope"),
      createBulletPoint("API Integration: Full request/response cycle with test database"),
      createBulletPoint("Database Integration: ORM queries, migrations, transactions"),
      createBulletPoint("External Services: Mocked external APIs (SEC, email, calendar)"),
      createBulletPoint("Authentication: Full auth flow with test Clerk instance"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Test Environment"),
      createBulletPoint("Database: Separate PostgreSQL instance, reset between test suites"),
      createBulletPoint("External APIs: MSW (Mock Service Worker) for consistent responses"),
      createBulletPoint("Test Data: Factory functions for consistent test data generation"),
      createBulletPoint("Isolation: Each test suite runs in transaction, rolled back after"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Integration Test Example"),
      createCodeBlock("describe('POST /api/targets', () => {"),
      createCodeBlock("  beforeEach(async () => {"),
      createCodeBlock("    await resetDatabase();"),
      createCodeBlock("    await seedTestUser();"),
      createCodeBlock("  });"),
      createCodeBlock(""),
      createCodeBlock("  it('should create target and trigger AI scoring', async () => {"),
      createCodeBlock("    const response = await request(app)"),
      createCodeBlock("      .post('/api/targets')"),
      createCodeBlock("      .set('Authorization', `Bearer ${testToken}`)"),
      createCodeBlock("      .send(validTargetPayload);"),
      createCodeBlock(""),
      createCodeBlock("    expect(response.status).toBe(201);"),
      createCodeBlock("    expect(response.body.data.id).toBeDefined();"),
      createCodeBlock("    "),
      createCodeBlock("    // Verify AI scoring job queued"),
      createCodeBlock("    const jobs = await getQueuedJobs('ai-scoring');"),
      createCodeBlock("    expect(jobs).toContainEqual("),
      createCodeBlock("      expect.objectContaining({ targetId: response.body.data.id })"),
      createCodeBlock("    );"),
      createCodeBlock("  });"),
      createCodeBlock("});"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("9.3 E2E Testing"),

      createHeading3("E2E Framework"),
      createBulletPoint("Tool: Playwright for cross-browser testing"),
      createBulletPoint("Browsers: Chrome, Firefox, Safari, Mobile Chrome/Safari"),
      createBulletPoint("CI Integration: Run on every PR, full suite nightly"),
      createBulletPoint("Visual Testing: Percy for screenshot comparison"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Critical User Flows"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3000, 6360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Flow", 3000),
            createTableHeaderCell("Steps Tested", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("User Login", 3000),
            createTableCell("Navigate, enter credentials, MFA, redirect to dashboard", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("Create Target", 3000, true),
            createTableCell("Open form, fill fields, submit, verify in pipeline", 6360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Stage Transition", 3000),
            createTableCell("Select target, change stage, add notes, confirm update", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("Document Upload", 3000, true),
            createTableCell("Navigate to data room, drag file, wait for processing", 6360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("AI Analysis", 3000),
            createTableCell("Upload document, request analysis, view results", 6360)
          ]}),
          new TableRow({ children: [
            createTableCell("Compliance Filing", 3000, true),
            createTableCell("View calendar, update status, attach document", 6360, true)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("E2E Test Example"),
      createCodeBlock("test('complete deal stage transition flow', async ({ page }) => {"),
      createCodeBlock("  // Login"),
      createCodeBlock("  await page.goto('/login');"),
      createCodeBlock("  await page.fill('[data-testid=\"email\"]', 'analyst@test.com');"),
      createCodeBlock("  await page.fill('[data-testid=\"password\"]', 'testpass123');"),
      createCodeBlock("  await page.click('[data-testid=\"login-button\"]');"),
      createCodeBlock("  "),
      createCodeBlock("  // Navigate to pipeline"),
      createCodeBlock("  await page.waitForURL('/dashboard');"),
      createCodeBlock("  await page.click('[data-testid=\"nav-pipeline\"]');"),
      createCodeBlock("  "),
      createCodeBlock("  // Select target and transition"),
      createCodeBlock("  await page.click('[data-testid=\"target-card-abc123\"]');"),
      createCodeBlock("  await page.click('[data-testid=\"stage-select\"]');"),
      createCodeBlock("  await page.click('[data-testid=\"stage-deep-evaluation\"]');"),
      createCodeBlock("  await page.fill('[data-testid=\"transition-notes\"]', 'Ready for deep dive');"),
      createCodeBlock("  await page.click('[data-testid=\"confirm-transition\"]');"),
      createCodeBlock("  "),
      createCodeBlock("  // Verify success"),
      createCodeBlock("  await expect(page.locator('[data-testid=\"toast-success\"]')).toBeVisible();"),
      createCodeBlock("  await expect(page.locator('[data-testid=\"target-stage\"]'))"),
      createCodeBlock("    .toHaveText('Deep Evaluation');"),
      createCodeBlock("});"),

      new Paragraph({ children: [new PageBreak()] }),

      createHeading2("9.4 Performance Benchmarks"),

      createHeading3("Target Metrics"),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [3500, 2500, 3360],
        rows: [
          new TableRow({ children: [
            createTableHeaderCell("Metric", 3500),
            createTableHeaderCell("Target", 2500),
            createTableHeaderCell("Critical Threshold", 3360)
          ]}),
          new TableRow({ children: [
            createTableCell("Dashboard Load Time", 3500),
            createTableCell("< 2 seconds", 2500),
            createTableCell("< 4 seconds", 3360)
          ]}),
          new TableRow({ children: [
            createTableCell("API Response (p50)", 3500, true),
            createTableCell("< 200ms", 2500, true),
            createTableCell("< 500ms", 3360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("API Response (p95)", 3500),
            createTableCell("< 500ms", 2500),
            createTableCell("< 2 seconds", 3360)
          ]}),
          new TableRow({ children: [
            createTableCell("Document Upload (10MB)", 3500, true),
            createTableCell("< 10 seconds", 2500, true),
            createTableCell("< 30 seconds", 3360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("AI Analysis Response", 3500),
            createTableCell("< 30 seconds", 2500),
            createTableCell("< 60 seconds", 3360)
          ]}),
          new TableRow({ children: [
            createTableCell("Full-Text Search", 3500, true),
            createTableCell("< 1 second", 2500, true),
            createTableCell("< 3 seconds", 3360, true)
          ]}),
          new TableRow({ children: [
            createTableCell("Time to Interactive (TTI)", 3500),
            createTableCell("< 3 seconds", 2500),
            createTableCell("< 5 seconds", 3360)
          ]})
        ]
      }),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Load Testing Scenarios"),
      createBulletPoint("Concurrent Users: Simulate 50 concurrent users performing mixed operations"),
      createBulletPoint("Spike Test: Sudden increase to 200 users, monitor degradation"),
      createBulletPoint("Soak Test: 24-hour test at 50% capacity for memory leak detection"),
      createBulletPoint("Document Stress: Upload 100 documents simultaneously"),
      new Paragraph({ spacing: { after: 150 } }),

      createHeading3("Performance Testing Tools"),
      createBulletPoint("Load Testing: k6 for API load testing"),
      createBulletPoint("Frontend Performance: Lighthouse CI in pipeline"),
      createBulletPoint("APM: Datadog or New Relic for production monitoring"),
      createBulletPoint("Database: pgbench for PostgreSQL performance"),

      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "--- End of Expanded PRD v2.0 ---", italics: true, size: 20, color: "666666", font: "Arial" })]
      }),
    ]
  }]
});

// Generate document
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/sessions/jolly-loving-dijkstra/mnt/SPAC OS/SPAC_OS_PRD_Expanded_v2.0.docx', buffer);
  console.log('Expanded PRD document created successfully!');
});
