/**
 * SPAC OS - Database Seed Script
 *
 * Seeds the database with sample data for development and testing.
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sample data constants
const SAMPLE_ORG_ID = '00000000-0000-0000-0000-000000000001';
const SAMPLE_USER_ID = '00000000-0000-0000-0000-000000000002';
const SAMPLE_SPAC_ID = '00000000-0000-0000-0000-000000000003';
const SAMPLE_SPONSOR_ID = '00000000-0000-0000-0000-000000000004';
const SAMPLE_TARGET_1_ID = '00000000-0000-0000-0000-000000000005';
const SAMPLE_TARGET_2_ID = '00000000-0000-0000-0000-000000000006';
const SAMPLE_TARGET_3_ID = '00000000-0000-0000-0000-000000000007';

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.filing.deleteMany({});
    await prisma.target.deleteMany({});
    await prisma.spacSponsor.deleteMany({});
    await prisma.spac.deleteMany({});
    await prisma.sponsor.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.organizationUser.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.organization.deleteMany({});
    console.log('✅ Existing data cleaned\n');
  }

  // Create Organization
  console.log('📁 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      id: SAMPLE_ORG_ID,
      name: 'Soren Capital Partners',
      slug: 'soren-capital',
      domain: 'sorencapital.com',
      settings: {
        theme: 'light',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          slack: false,
        },
      },
    },
  });
  console.log(`✅ Created organization: ${organization.name}\n`);

  // Create User
  console.log('👤 Creating user...');
  const user = await prisma.user.create({
    data: {
      id: SAMPLE_USER_ID,
      email: 'demo@spacos.app',
      name: 'Demo User',
      role: 'admin',
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
        },
      },
    },
  });

  await prisma.organizationUser.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: 'admin',
      permissions: ['*'],
    },
  });
  console.log(`✅ Created user: ${user.email}\n`);

  // Create Sponsor
  console.log('🏢 Creating sponsor...');
  const sponsor = await prisma.sponsor.create({
    data: {
      id: SAMPLE_SPONSOR_ID,
      organizationId: organization.id,
      name: 'Soren Capital Management',
      legalName: 'Soren Capital Management LLC',
      tier: 'TIER_2',
      website: 'https://sorencapital.com',
      headquarters: 'New York, NY',
      totalSpacs: 3,
      completedDeals: 2,
      avgDealSize: 500000000,
      standardPromote: 0.20,
      teamSize: 15,
      industryFocus: ['Technology', 'Financial Services', 'Healthcare'],
      keyPrincipals: [
        { name: 'John Soren', title: 'Managing Partner', linkedin: 'linkedin.com/in/johnsoren' },
        { name: 'Sarah Chen', title: 'Partner', linkedin: 'linkedin.com/in/sarahchen' },
      ],
    },
  });
  console.log(`✅ Created sponsor: ${sponsor.name}\n`);

  // Create SPAC
  console.log('📈 Creating SPAC...');
  const spac = await prisma.spac.create({
    data: {
      id: SAMPLE_SPAC_ID,
      organizationId: organization.id,
      name: 'Soren Acquisition Corp',
      ticker: 'SACU',
      cik: '0001234567',
      status: 'SEARCHING',
      phase: 'TARGET_SEARCH',
      ipoDate: new Date('2024-06-15'),
      ipoSize: 250000000,
      ipoPrice: 10.00,
      unitPrice: 10.00,
      sharesOutstanding: 25000000,
      commonSharesOutstanding: 25000000,
      founderSharesOutstanding: 6250000,
      publicWarrantsOutstanding: 12500000,
      privateWarrantsOutstanding: 7500000,
      trustSize: 253750000,
      trustBalance: 255500000,
      trustPerShare: 10.22,
      interestEarned: 1750000,
      trustBank: 'Continental Stock Transfer & Trust',
      deadline: new Date('2026-06-15'),
      deadlineDate: new Date('2026-06-15'),
      extensionsUsed: 0,
      maxExtensions: 6,
      extensionMonths: 1,
      extensionContribution: 0.033,
      description: 'Soren Acquisition Corp is a blank check company focused on identifying and acquiring innovative technology and financial services companies.',
      investmentThesis: 'We seek to partner with companies demonstrating strong growth potential, proven management teams, and defensible market positions in the technology and financial services sectors.',
      targetSectors: ['Technology', 'Financial Services'],
      targetIndustries: ['Enterprise Software', 'Fintech', 'Cybersecurity', 'AI/ML'],
      targetGeographies: ['North America', 'Europe'],
      exchange: 'NASDAQ',
      underwriters: ['Goldman Sachs', 'Morgan Stanley', 'Citigroup'],
      tags: ['tech-focused', 'fintech', 'active'],
    },
  });

  // Link SPAC to Sponsor
  await prisma.spacSponsor.create({
    data: {
      spacId: spac.id,
      sponsorId: sponsor.id,
      isPrimary: true,
      role: 'Lead Sponsor',
      promote: 0.20,
      founderShares: 6250000,
      atRiskCapital: 7500000,
    },
  });
  console.log(`✅ Created SPAC: ${spac.ticker} - ${spac.name}\n`);

  // Create Targets
  console.log('🎯 Creating targets...');
  const targets = await Promise.all([
    prisma.target.create({
      data: {
        id: SAMPLE_TARGET_1_ID,
        spacId: spac.id,
        name: 'TechFlow Solutions',
        legalName: 'TechFlow Solutions Inc.',
        status: 'DUE_DILIGENCE',
        stage: 'DEEP_DIVE',
        priority: 1,
        probability: 65,
        description: 'Enterprise workflow automation platform with AI-powered process optimization.',
        sector: 'Technology',
        industry: 'Enterprise Software',
        subIndustry: 'Workflow Automation',
        website: 'https://techflow.io',
        headquarters: 'San Francisco, CA',
        foundedYear: 2018,
        employeeCount: 450,
        revenue: 85000000,
        revenueYear: 2024,
        ebitda: 12000000,
        grossMargin: 0.78,
        growthRate: 0.45,
        ltmRevenue: 95000000,
        ltmEbitda: 15000000,
        projectedRevenue: 140000000,
        projectedEbitda: 25000000,
        enterpriseValue: 850000000,
        equityValue: 800000000,
        evRevenue: 8.9,
        evEbitda: 56.7,
        managementScore: 8,
        marketScore: 9,
        financialScore: 7,
        operationalScore: 8,
        riskScore: 3,
        overallScore: 8.2,
        identifiedDate: new Date('2024-09-01'),
        firstContactDate: new Date('2024-09-15'),
        ndaSignedDate: new Date('2024-10-01'),
        keyRisks: [
          'Customer concentration - top 3 customers represent 35% of revenue',
          'Competition from established players (Microsoft, Salesforce)',
          'High R&D costs affecting near-term profitability',
        ],
        keyOpportunities: [
          'Strong product-market fit with 150% net revenue retention',
          'Expansion into European market in 2025',
          'AI features driving upsell opportunities',
        ],
        investmentHighlights: [
          'Category leader in workflow automation',
          '45% YoY revenue growth',
          'Enterprise-focused with 500+ customers',
          'Strong founder team with previous exits',
        ],
        managementTeam: [
          { name: 'Alex Rivera', title: 'CEO', background: 'Ex-Salesforce VP' },
          { name: 'Maya Patel', title: 'CTO', background: 'Ex-Google Engineering Director' },
          { name: 'James Wong', title: 'CFO', background: 'Ex-Workday Finance' },
        ],
        confidentialityLevel: 'confidential',
        tags: ['saas', 'enterprise', 'ai', 'high-priority'],
      },
    }),
    prisma.target.create({
      data: {
        id: SAMPLE_TARGET_2_ID,
        spacId: spac.id,
        name: 'PayNext Financial',
        legalName: 'PayNext Financial Holdings Ltd.',
        status: 'NDA_SIGNED',
        stage: 'PRELIMINARY_REVIEW',
        priority: 2,
        probability: 40,
        description: 'B2B payments infrastructure for emerging markets.',
        sector: 'Financial Services',
        industry: 'Fintech',
        subIndustry: 'Payments',
        website: 'https://paynext.com',
        headquarters: 'London, UK',
        foundedYear: 2019,
        employeeCount: 280,
        revenue: 45000000,
        revenueYear: 2024,
        ebitda: -5000000,
        grossMargin: 0.65,
        growthRate: 0.85,
        enterpriseValue: 450000000,
        evRevenue: 10.0,
        managementScore: 7,
        marketScore: 8,
        financialScore: 5,
        operationalScore: 7,
        riskScore: 5,
        overallScore: 6.8,
        identifiedDate: new Date('2024-10-15'),
        firstContactDate: new Date('2024-11-01'),
        ndaSignedDate: new Date('2024-11-20'),
        keyRisks: [
          'Not yet profitable',
          'Regulatory complexity in emerging markets',
          'Currency exposure',
        ],
        keyOpportunities: [
          'Massive TAM in emerging market payments',
          'First-mover advantage in several markets',
          'Strategic partnership discussions with major banks',
        ],
        confidentialityLevel: 'confidential',
        tags: ['fintech', 'payments', 'international'],
      },
    }),
    prisma.target.create({
      data: {
        id: SAMPLE_TARGET_3_ID,
        spacId: spac.id,
        name: 'CyberShield Security',
        legalName: 'CyberShield Security Corp.',
        status: 'PRELIMINARY',
        stage: 'ORIGINATION',
        priority: 3,
        probability: 25,
        description: 'Next-generation endpoint security platform.',
        sector: 'Technology',
        industry: 'Cybersecurity',
        subIndustry: 'Endpoint Security',
        website: 'https://cybershield.io',
        headquarters: 'Austin, TX',
        foundedYear: 2020,
        employeeCount: 180,
        revenue: 35000000,
        revenueYear: 2024,
        ebitda: -8000000,
        grossMargin: 0.82,
        growthRate: 1.20,
        enterpriseValue: 400000000,
        evRevenue: 11.4,
        identifiedDate: new Date('2024-11-01'),
        firstContactDate: new Date('2024-11-15'),
        keyRisks: [
          'High competition in cybersecurity space',
          'Heavy losses expected for next 2 years',
          'Key person risk with founding team',
        ],
        confidentialityLevel: 'internal',
        tags: ['cybersecurity', 'growth', 'early-stage'],
      },
    }),
  ]);
  console.log(`✅ Created ${targets.length} targets\n`);

  // Create Contacts
  console.log('📇 Creating contacts...');
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'LEGAL',
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'mthompson@kirklandellis.com',
        phone: '+1-212-555-0101',
        company: 'Kirkland & Ellis LLP',
        title: 'Partner',
        department: 'M&A / Capital Markets',
        relationship: 'Primary Legal Counsel',
        influence: 'Decision Maker',
        notes: 'Lead outside counsel for all SPAC transactions',
        tags: ['legal', 'external', 'priority'],
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BANKING',
        firstName: 'Jennifer',
        lastName: 'Liu',
        email: 'jennifer.liu@gs.com',
        phone: '+1-212-555-0102',
        company: 'Goldman Sachs',
        title: 'Managing Director',
        department: 'Investment Banking - TMT',
        relationship: 'Lead Underwriter',
        influence: 'Influencer',
        tags: ['banking', 'underwriter', 'tmt'],
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'ACCOUNTING',
        firstName: 'Robert',
        lastName: 'Martinez',
        email: 'robert.martinez@deloitte.com',
        phone: '+1-212-555-0103',
        company: 'Deloitte LLP',
        title: 'Partner',
        department: 'Audit & Assurance',
        relationship: 'External Auditor',
        influence: 'Gatekeeper',
        tags: ['accounting', 'auditor', 'external'],
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'TARGET_MANAGEMENT',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex@techflow.io',
        phone: '+1-415-555-0201',
        company: 'TechFlow Solutions',
        title: 'CEO & Co-Founder',
        relationship: 'Target CEO',
        influence: 'Decision Maker',
        tags: ['target', 'ceo', 'techflow'],
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'INVESTOR',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'swilliams@fidelity.com',
        phone: '+1-617-555-0301',
        company: 'Fidelity Investments',
        title: 'Portfolio Manager',
        department: 'Growth Equity',
        relationship: 'PIPE Investor',
        influence: 'Decision Maker',
        notes: 'Interested in PIPE participation for tech deals',
        tags: ['investor', 'pipe', 'institutional'],
      },
    }),
  ]);
  console.log(`✅ Created ${contacts.length} contacts\n`);

  // Create Documents
  console.log('📄 Creating documents...');
  const documents = await Promise.all([
    prisma.document.create({
      data: {
        spacId: spac.id,
        uploadedById: user.id,
        name: 'SACU S-1 Registration Statement',
        description: 'Initial registration statement for Soren Acquisition Corp IPO',
        type: 'SEC_FILING',
        category: 'SEC Filing',
        status: 'FILED',
        fileName: 'sacu-s1-registration.pdf',
        fileType: 'pdf',
        fileSize: 2456789,
        filePath: '/documents/sec/sacu-s1-registration.pdf',
        mimeType: 'application/pdf',
        version: 1,
        isLatest: true,
        isConfidential: false,
        accessLevel: 'team',
        tags: ['sec', 'ipo', 's-1'],
      },
    }),
    prisma.document.create({
      data: {
        spacId: spac.id,
        targetId: SAMPLE_TARGET_1_ID,
        uploadedById: user.id,
        name: 'TechFlow CIM',
        description: 'Confidential Information Memorandum for TechFlow Solutions',
        type: 'INVESTOR_MATERIALS',
        category: 'Due Diligence',
        status: 'APPROVED',
        fileName: 'techflow-cim-2024.pdf',
        fileType: 'pdf',
        fileSize: 5678901,
        filePath: '/documents/targets/techflow/cim-2024.pdf',
        mimeType: 'application/pdf',
        version: 2,
        isLatest: true,
        isConfidential: true,
        accessLevel: 'restricted',
        confidentialityLevel: 'confidential',
        tags: ['cim', 'due-diligence', 'techflow'],
      },
    }),
    prisma.document.create({
      data: {
        spacId: spac.id,
        targetId: SAMPLE_TARGET_1_ID,
        uploadedById: user.id,
        name: 'TechFlow Financial Model',
        description: 'Three-statement financial model with projections',
        type: 'FINANCIAL_MODEL',
        category: 'Valuation',
        status: 'UNDER_REVIEW',
        fileName: 'techflow-financial-model-v3.xlsx',
        fileType: 'xlsx',
        fileSize: 1234567,
        filePath: '/documents/targets/techflow/financial-model-v3.xlsx',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        version: 3,
        isLatest: true,
        isConfidential: true,
        accessLevel: 'restricted',
        tags: ['financial-model', 'valuation', 'techflow'],
      },
    }),
    prisma.document.create({
      data: {
        spacId: spac.id,
        uploadedById: user.id,
        name: 'Board Presentation - Q4 2024',
        description: 'Quarterly board meeting presentation with pipeline update',
        type: 'BOARD_MATERIALS',
        category: 'Board',
        status: 'APPROVED',
        fileName: 'board-presentation-q4-2024.pptx',
        fileType: 'pptx',
        fileSize: 3456789,
        filePath: '/documents/board/q4-2024-presentation.pptx',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        version: 1,
        isLatest: true,
        isConfidential: true,
        accessLevel: 'restricted',
        tags: ['board', 'presentation', 'quarterly'],
      },
    }),
  ]);
  console.log(`✅ Created ${documents.length} documents\n`);

  // Create Filings
  console.log('📝 Creating filings...');
  const filings = await Promise.all([
    prisma.filing.create({
      data: {
        spacId: spac.id,
        type: 'S1',
        status: 'EFFECTIVE',
        title: 'Form S-1 Registration Statement',
        description: 'Initial registration statement for IPO',
        accessionNumber: '0001234567-24-000001',
        fileNumber: '333-123456',
        cik: '0001234567',
        filedDate: new Date('2024-05-01'),
        effectiveDate: new Date('2024-06-01'),
        edgarUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001234567',
        amendmentNumber: 0,
      },
    }),
    prisma.filing.create({
      data: {
        spacId: spac.id,
        type: 'FORM_10Q',
        status: 'FILED',
        title: 'Form 10-Q Q3 2024',
        description: 'Quarterly report for Q3 2024',
        accessionNumber: '0001234567-24-000010',
        fileNumber: '001-12345',
        cik: '0001234567',
        filedDate: new Date('2024-11-15'),
        dueDate: new Date('2024-11-14'),
        edgarUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001234567',
      },
    }),
    prisma.filing.create({
      data: {
        spacId: spac.id,
        type: 'FORM_8K',
        status: 'FILED',
        title: 'Form 8-K - Extension Notice',
        description: 'Current report regarding extension deadline',
        accessionNumber: '0001234567-24-000015',
        fileNumber: '001-12345',
        cik: '0001234567',
        filedDate: new Date('2024-12-01'),
        edgarUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001234567',
      },
    }),
  ]);
  console.log(`✅ Created ${filings.length} filings\n`);

  // Create Tasks
  console.log('✅ Creating tasks...');
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        spacId: spac.id,
        targetId: SAMPLE_TARGET_1_ID,
        createdById: user.id,
        assigneeId: user.id,
        title: 'Complete TechFlow financial due diligence',
        description: 'Review historical financials, audit reports, and revenue recognition policies',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        category: 'Due Diligence',
        tags: ['financial', 'due-diligence', 'techflow'],
      },
    }),
    prisma.task.create({
      data: {
        spacId: spac.id,
        targetId: SAMPLE_TARGET_1_ID,
        createdById: user.id,
        title: 'Schedule management presentation',
        description: 'Coordinate with TechFlow leadership for deep-dive management presentation',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        category: 'Target Engagement',
        tags: ['meeting', 'management', 'techflow'],
      },
    }),
    prisma.task.create({
      data: {
        spacId: spac.id,
        createdById: user.id,
        assigneeId: user.id,
        title: 'Prepare Q4 board presentation',
        description: 'Update pipeline status, target summaries, and timeline for board meeting',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        category: 'Board',
        tags: ['board', 'presentation', 'quarterly'],
      },
    }),
    prisma.task.create({
      data: {
        spacId: spac.id,
        createdById: user.id,
        title: 'Review PIPE investor interest',
        description: 'Follow up with potential PIPE investors and update commitment tracker',
        status: 'NOT_STARTED',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        category: 'Financing',
        tags: ['pipe', 'investors', 'financing'],
      },
    }),
    prisma.task.create({
      data: {
        spacId: spac.id,
        filingId: filings[1].id,
        createdById: user.id,
        assigneeId: user.id,
        title: 'File Form 10-K annual report',
        description: 'Prepare and file annual report with SEC',
        status: 'NOT_STARTED',
        priority: 'HIGH',
        dueDate: new Date('2025-03-31'),
        category: 'SEC Filing',
        tags: ['sec', '10-k', 'annual'],
      },
    }),
  ]);
  console.log(`✅ Created ${tasks.length} tasks\n`);

  // Create Milestones
  console.log('🏁 Creating milestones...');
  const milestones = await Promise.all([
    prisma.milestone.create({
      data: {
        spacId: spac.id,
        name: 'IPO Completed',
        description: 'Successfully completed initial public offering',
        type: 'FINANCIAL',
        phase: 'IPO',
        targetDate: new Date('2024-06-15'),
        actualDate: new Date('2024-06-15'),
        isCompleted: true,
        status: 'completed',
        progress: 100,
        sortOrder: 1,
      },
    }),
    prisma.milestone.create({
      data: {
        spacId: spac.id,
        name: 'Target Identification',
        description: 'Identify and evaluate potential acquisition targets',
        type: 'OPERATIONAL',
        phase: 'TARGET_SEARCH',
        targetDate: new Date('2025-03-31'),
        isCompleted: false,
        status: 'in_progress',
        progress: 65,
        isCritical: true,
        sortOrder: 2,
      },
    }),
    prisma.milestone.create({
      data: {
        spacId: spac.id,
        name: 'LOI Execution',
        description: 'Execute Letter of Intent with selected target',
        type: 'LEGAL',
        phase: 'NEGOTIATION',
        targetDate: new Date('2025-06-30'),
        isCompleted: false,
        status: 'pending',
        progress: 0,
        isCritical: true,
        sortOrder: 3,
        dependsOn: [],
      },
    }),
    prisma.milestone.create({
      data: {
        spacId: spac.id,
        name: 'Definitive Agreement',
        description: 'Execute definitive merger agreement',
        type: 'LEGAL',
        phase: 'DEFINITIVE_AGREEMENT',
        targetDate: new Date('2025-09-30'),
        isCompleted: false,
        status: 'pending',
        progress: 0,
        isCritical: true,
        sortOrder: 4,
      },
    }),
    prisma.milestone.create({
      data: {
        spacId: spac.id,
        name: 'Shareholder Vote',
        description: 'Hold special meeting for shareholder approval',
        type: 'SHAREHOLDER',
        phase: 'SHAREHOLDER_VOTE',
        targetDate: new Date('2025-12-31'),
        isCompleted: false,
        status: 'pending',
        progress: 0,
        isCritical: true,
        sortOrder: 5,
      },
    }),
    prisma.milestone.create({
      data: {
        spacId: spac.id,
        name: 'Transaction Close',
        description: 'Complete business combination and de-SPAC',
        type: 'CLOSING',
        phase: 'CLOSING',
        targetDate: new Date('2026-03-31'),
        isCompleted: false,
        status: 'pending',
        progress: 0,
        isCritical: true,
        sortOrder: 6,
      },
    }),
  ]);
  console.log(`✅ Created ${milestones.length} milestones\n`);

  // Create Trust Account
  console.log('💰 Creating trust account...');
  await prisma.trustAccount.create({
    data: {
      spacId: spac.id,
      accountNumber: 'CSTC-001234567',
      bankName: 'Continental Stock Transfer & Trust Company',
      currentBalance: 255500000,
      balanceDate: new Date(),
      interestRate: 0.045,
      accruedInterest: 1750000,
      perShareValue: 10.22,
      balanceHistory: [
        { date: '2024-06-15', balance: 253750000, perShare: 10.15 },
        { date: '2024-09-15', balance: 254500000, perShare: 10.18 },
        { date: '2024-12-15', balance: 255500000, perShare: 10.22 },
      ],
    },
  });
  console.log('✅ Created trust account\n');

  // Create Compliance Items
  console.log('📋 Creating compliance items...');
  await Promise.all([
    prisma.complianceItem.create({
      data: {
        spacId: spac.id,
        name: 'Annual 10-K Filing',
        description: 'File annual report with SEC',
        category: 'SEC',
        status: 'PENDING',
        dueDate: new Date('2025-03-31'),
        responsibleParty: 'CFO',
        requirements: [
          'Audited financial statements',
          'MD&A discussion',
          'Risk factors update',
        ],
      },
    }),
    prisma.complianceItem.create({
      data: {
        spacId: spac.id,
        name: 'Quarterly 10-Q Filing',
        description: 'File Q1 2025 quarterly report',
        category: 'SEC',
        status: 'PENDING',
        dueDate: new Date('2025-05-15'),
        responsibleParty: 'CFO',
        requirements: [
          'Unaudited financial statements',
          'MD&A discussion',
        ],
      },
    }),
    prisma.complianceItem.create({
      data: {
        spacId: spac.id,
        name: 'NASDAQ Listing Requirements',
        description: 'Maintain compliance with NASDAQ listing standards',
        category: 'Exchange',
        status: 'COMPLIANT',
        responsibleParty: 'General Counsel',
        requirements: [
          'Minimum stockholders equity',
          'Bid price requirements',
          'Corporate governance standards',
        ],
      },
    }),
  ]);
  console.log('✅ Created compliance items\n');

  // Summary
  console.log('============================================');
  console.log('🎉 Database seeding completed successfully!');
  console.log('============================================\n');
  console.log('Summary:');
  console.log(`  - Organization: ${organization.name}`);
  console.log(`  - User: ${user.email}`);
  console.log(`  - SPAC: ${spac.ticker} - ${spac.name}`);
  console.log(`  - Sponsor: ${sponsor.name}`);
  console.log(`  - Targets: ${targets.length}`);
  console.log(`  - Contacts: ${contacts.length}`);
  console.log(`  - Documents: ${documents.length}`);
  console.log(`  - Filings: ${filings.length}`);
  console.log(`  - Tasks: ${tasks.length}`);
  console.log(`  - Milestones: ${milestones.length}`);
  console.log('\nYou can now run the application with: npm run dev');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
