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
    // CRM models
    await prisma.interaction.deleteMany({});
    await prisma.contactNote.deleteMany({});
    await prisma.meetingAttendee.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.email.deleteMany({});
    // Core models
    await prisma.auditLog.deleteMany({});
    // await prisma.notification.deleteMany({}); // Model doesn't exist
    await prisma.comment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.filing.deleteMany({});
    await prisma.target.deleteMany({});
    await prisma.spacSponsor.deleteMany({});
    await prisma.spac.deleteMany({});
    await prisma.sponsor.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.companyDeal.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.calendarConnection.deleteMany({});
    await prisma.emailConnection.deleteMany({});
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
    },
  });

  await prisma.organizationUser.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      role: 'ADMIN',
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

  // Create Companies
  console.log('🏢 Creating companies...');
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Kirkland & Ellis LLP',
        industry: 'Legal Services',
        website: 'https://www.kirkland.com',
        description: 'Global law firm specializing in M&A, capital markets, and private equity',
        type: 'Law Firm',
        size: '1000+',
        headquarters: 'Chicago, IL',
        foundedYear: 1909,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Goldman Sachs',
        industry: 'Investment Banking',
        website: 'https://www.goldmansachs.com',
        description: 'Global investment banking, securities, and investment management firm',
        type: 'Investment Bank',
        size: '1000+',
        headquarters: 'New York, NY',
        foundedYear: 1869,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Deloitte LLP',
        industry: 'Professional Services',
        website: 'https://www.deloitte.com',
        description: 'Big Four accounting and professional services firm',
        type: 'Accounting Firm',
        size: '1000+',
        headquarters: 'London, UK',
        foundedYear: 1845,
      },
    }),
    prisma.company.create({
      data: {
        name: 'TechFlow Solutions',
        industry: 'Technology',
        website: 'https://techflow.io',
        description: 'Enterprise workflow automation platform with AI-powered process optimization',
        type: 'Target',
        size: '201-500',
        headquarters: 'San Francisco, CA',
        foundedYear: 2018,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Fidelity Investments',
        industry: 'Asset Management',
        website: 'https://www.fidelity.com',
        description: 'Multinational financial services corporation',
        type: 'Institutional Investor',
        size: '1000+',
        headquarters: 'Boston, MA',
        foundedYear: 1946,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Morgan Stanley',
        industry: 'Investment Banking',
        website: 'https://www.morganstanley.com',
        description: 'Global financial services firm providing investment banking and wealth management',
        type: 'Investment Bank',
        size: '1000+',
        headquarters: 'New York, NY',
        foundedYear: 1935,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Skadden Arps',
        industry: 'Legal Services',
        website: 'https://www.skadden.com',
        description: 'Leading law firm in M&A, securities, and corporate restructuring',
        type: 'Law Firm',
        size: '1000+',
        headquarters: 'New York, NY',
        foundedYear: 1948,
      },
    }),
    prisma.company.create({
      data: {
        name: 'BlackRock',
        industry: 'Asset Management',
        website: 'https://www.blackrock.com',
        description: 'World\'s largest asset manager',
        type: 'Institutional Investor',
        size: '1000+',
        headquarters: 'New York, NY',
        foundedYear: 1988,
      },
    }),
    prisma.company.create({
      data: {
        name: 'PayNext Financial',
        industry: 'Fintech',
        website: 'https://paynext.com',
        description: 'B2B payments infrastructure for emerging markets',
        type: 'Target',
        size: '201-500',
        headquarters: 'London, UK',
        foundedYear: 2019,
      },
    }),
    prisma.company.create({
      data: {
        name: 'CyberShield Security',
        industry: 'Cybersecurity',
        website: 'https://cybershield.io',
        description: 'Next-generation endpoint security platform',
        type: 'Target',
        size: '51-200',
        headquarters: 'Austin, TX',
        foundedYear: 2020,
      },
    }),
  ]);
  console.log(`✅ Created ${companies.length} companies\n`);

  // Create Contacts (30 contacts with extended CRM fields)
  console.log('📇 Creating contacts...');
  const contacts = await Promise.all([
    // Legal contacts
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'LEGAL',
        status: 'ACTIVE',
        firstName: 'Michael',
        lastName: 'Thompson',
        email: 'mthompson@kirklandellis.com',
        phone: '+1-212-555-0101',
        mobile: '+1-917-555-0101',
        company: 'Kirkland & Ellis LLP',
        companyId: companies[0].id,
        title: 'Partner',
        linkedIn: 'linkedin.com/in/mthompson-ke',
        address: '601 Lexington Avenue',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        postalCode: '10022',
        notes: 'Lead outside counsel for all SPAC transactions. Very responsive.',
        tags: ['legal', 'external', 'priority', 'spac-specialist'],
        isStarred: true,
        relationshipScore: 95,
        lastInteractionAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'LEGAL',
        status: 'ACTIVE',
        firstName: 'Emily',
        lastName: 'Chen',
        email: 'echen@skadden.com',
        phone: '+1-212-555-0102',
        company: 'Skadden Arps',
        companyId: companies[6].id,
        title: 'Partner',
        linkedIn: 'linkedin.com/in/emilychen-skadden',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Target company counsel specialist',
        tags: ['legal', 'target-counsel'],
        relationshipScore: 75,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'LEGAL',
        status: 'ACTIVE',
        firstName: 'David',
        lastName: 'Park',
        email: 'dpark@kirklandellis.com',
        phone: '+1-312-555-0103',
        company: 'Kirkland & Ellis LLP',
        companyId: companies[0].id,
        title: 'Associate',
        city: 'Chicago',
        state: 'IL',
        country: 'USA',
        tags: ['legal', 'associate'],
        relationshipScore: 60,
        ownerId: user.id,
      },
    }),
    // Banking contacts
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BANKER',
        status: 'ACTIVE',
        firstName: 'Jennifer',
        lastName: 'Liu',
        email: 'jennifer.liu@gs.com',
        phone: '+1-212-555-0201',
        mobile: '+1-917-555-0201',
        company: 'Goldman Sachs',
        companyId: companies[1].id,
        title: 'Managing Director',
        linkedIn: 'linkedin.com/in/jenniferliu-gs',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Lead underwriter. Has strong pipeline of tech targets.',
        tags: ['banking', 'underwriter', 'tmt'],
        isStarred: true,
        relationshipScore: 90,
        lastInteractionAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BANKER',
        status: 'ACTIVE',
        firstName: 'Marcus',
        lastName: 'Williams',
        email: 'marcus.williams@ms.com',
        phone: '+1-212-555-0202',
        company: 'Morgan Stanley',
        companyId: companies[5].id,
        title: 'Managing Director',
        linkedIn: 'linkedin.com/in/marcuswilliams-ms',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        tags: ['banking', 'fintech'],
        relationshipScore: 70,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BANKER',
        status: 'ACTIVE',
        firstName: 'Lisa',
        lastName: 'Nakamura',
        email: 'lisa.nakamura@gs.com',
        phone: '+1-212-555-0203',
        company: 'Goldman Sachs',
        companyId: companies[1].id,
        title: 'Vice President',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        tags: ['banking', 'deal-team'],
        relationshipScore: 65,
        ownerId: user.id,
      },
    }),
    // Accounting contacts
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'AUDITOR',
        status: 'ACTIVE',
        firstName: 'Robert',
        lastName: 'Martinez',
        email: 'robert.martinez@deloitte.com',
        phone: '+1-212-555-0301',
        company: 'Deloitte LLP',
        companyId: companies[2].id,
        title: 'Partner',
        linkedIn: 'linkedin.com/in/robertmartinez-deloitte',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Lead audit partner. Very thorough.',
        tags: ['accounting', 'auditor', 'external'],
        relationshipScore: 80,
        lastInteractionAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'AUDITOR',
        status: 'ACTIVE',
        firstName: 'Amanda',
        lastName: 'Foster',
        email: 'afoster@deloitte.com',
        phone: '+1-212-555-0302',
        company: 'Deloitte LLP',
        companyId: companies[2].id,
        title: 'Senior Manager',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        tags: ['accounting', 'auditor'],
        relationshipScore: 55,
        ownerId: user.id,
      },
    }),
    // Target management contacts
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'Alex',
        lastName: 'Rivera',
        email: 'alex@techflow.io',
        phone: '+1-415-555-0401',
        mobile: '+1-415-555-0402',
        company: 'TechFlow Solutions',
        companyId: companies[3].id,
        title: 'CEO & Co-Founder',
        linkedIn: 'linkedin.com/in/alexrivera',
        twitter: '@alexrivera_tech',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        notes: 'Primary decision maker. Previously VP at Salesforce.',
        tags: ['target', 'ceo', 'techflow', 'decision-maker'],
        isStarred: true,
        relationshipScore: 85,
        lastInteractionAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'Maya',
        lastName: 'Patel',
        email: 'maya@techflow.io',
        phone: '+1-415-555-0403',
        company: 'TechFlow Solutions',
        companyId: companies[3].id,
        title: 'CTO & Co-Founder',
        linkedIn: 'linkedin.com/in/mayapatel',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        notes: 'Technical lead. Ex-Google Engineering Director.',
        tags: ['target', 'cto', 'techflow', 'technical'],
        relationshipScore: 70,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'James',
        lastName: 'Wong',
        email: 'james@techflow.io',
        phone: '+1-415-555-0404',
        company: 'TechFlow Solutions',
        companyId: companies[3].id,
        title: 'CFO',
        linkedIn: 'linkedin.com/in/jameswong-cfo',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        notes: 'Finance lead. Ex-Workday.',
        tags: ['target', 'cfo', 'techflow', 'finance'],
        isStarred: true,
        relationshipScore: 80,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@paynext.com',
        phone: '+44-20-555-0501',
        company: 'PayNext Financial',
        companyId: companies[8].id,
        title: 'CEO',
        linkedIn: 'linkedin.com/in/johnsmith-paynext',
        city: 'London',
        country: 'UK',
        notes: 'PayNext founder. Experienced fintech leader.',
        tags: ['target', 'ceo', 'paynext', 'fintech'],
        relationshipScore: 55,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'Rachel',
        lastName: 'Adams',
        email: 'rachel@cybershield.io',
        phone: '+1-512-555-0601',
        company: 'CyberShield Security',
        companyId: companies[9].id,
        title: 'CEO',
        linkedIn: 'linkedin.com/in/racheladams-cyber',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        tags: ['target', 'ceo', 'cybershield', 'cybersecurity'],
        relationshipScore: 45,
        ownerId: user.id,
      },
    }),
    // Investor contacts
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'INVESTOR',
        status: 'ACTIVE',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'swilliams@fidelity.com',
        phone: '+1-617-555-0701',
        mobile: '+1-617-555-0702',
        company: 'Fidelity Investments',
        companyId: companies[4].id,
        title: 'Portfolio Manager',
        linkedIn: 'linkedin.com/in/sarahwilliams-fidelity',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        notes: 'Interested in PIPE participation for tech deals. $50M capacity.',
        tags: ['investor', 'pipe', 'institutional', 'tech-focus'],
        isStarred: true,
        relationshipScore: 85,
        lastInteractionAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'INVESTOR',
        status: 'ACTIVE',
        firstName: 'Thomas',
        lastName: 'Anderson',
        email: 'tanderson@blackrock.com',
        phone: '+1-212-555-0703',
        company: 'BlackRock',
        companyId: companies[7].id,
        title: 'Managing Director',
        linkedIn: 'linkedin.com/in/thomasanderson-br',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Large capacity. Interested in de-SPAC opportunities.',
        tags: ['investor', 'pipe', 'institutional', 'large-cap'],
        relationshipScore: 70,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'INVESTOR',
        status: 'ACTIVE',
        firstName: 'Kevin',
        lastName: 'O\'Brien',
        email: 'kobrien@fidelity.com',
        phone: '+1-617-555-0704',
        company: 'Fidelity Investments',
        companyId: companies[4].id,
        title: 'Senior Analyst',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        tags: ['investor', 'analyst'],
        relationshipScore: 50,
        ownerId: user.id,
      },
    }),
    // Additional diverse contacts
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'CONSULTANT',
        status: 'ACTIVE',
        firstName: 'Patricia',
        lastName: 'Gonzalez',
        email: 'pgonzalez@mckinsey.com',
        phone: '+1-212-555-0801',
        company: 'McKinsey & Company',
        title: 'Partner',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Due diligence support',
        tags: ['consultant', 'due-diligence'],
        relationshipScore: 65,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BOARD',
        status: 'ACTIVE',
        firstName: 'William',
        lastName: 'Harrison',
        email: 'wharrison@email.com',
        phone: '+1-203-555-0901',
        title: 'Independent Director',
        city: 'Greenwich',
        state: 'CT',
        country: 'USA',
        notes: 'Board member. Former CEO of Fortune 500 company.',
        tags: ['board', 'independent-director'],
        isStarred: true,
        relationshipScore: 90,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BOARD',
        status: 'ACTIVE',
        firstName: 'Margaret',
        lastName: 'Lee',
        email: 'mlee@email.com',
        phone: '+1-415-555-0902',
        title: 'Independent Director',
        city: 'Palo Alto',
        state: 'CA',
        country: 'USA',
        notes: 'Board member. Tech industry expert.',
        tags: ['board', 'independent-director', 'tech'],
        relationshipScore: 85,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'OTHER',
        status: 'ACTIVE',
        firstName: 'Daniel',
        lastName: 'Brown',
        email: 'dbrown@sec.gov',
        phone: '+1-202-555-1001',
        company: 'U.S. Securities and Exchange Commission',
        title: 'Senior Staff Accountant',
        city: 'Washington',
        state: 'DC',
        country: 'USA',
        notes: 'SEC reviewer for our filings',
        tags: ['regulatory', 'sec'],
        relationshipScore: 40,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'OTHER',
        status: 'ACTIVE',
        firstName: 'Susan',
        lastName: 'Miller',
        email: 'smiller@nasdaq.com',
        phone: '+1-212-555-1101',
        company: 'NASDAQ',
        title: 'Listing Qualifications Specialist',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Exchange listing contact',
        tags: ['regulatory', 'exchange', 'nasdaq'],
        relationshipScore: 55,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'PR',
        status: 'ACTIVE',
        firstName: 'Christopher',
        lastName: 'Taylor',
        email: 'ctaylor@edelman.com',
        phone: '+1-212-555-1201',
        company: 'Edelman',
        title: 'Senior Vice President',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'PR and communications advisor',
        tags: ['pr', 'communications', 'media'],
        relationshipScore: 60,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'IR',
        status: 'ACTIVE',
        firstName: 'Nicole',
        lastName: 'Davis',
        email: 'ndavis@icrinc.com',
        phone: '+1-203-555-1301',
        company: 'ICR Inc',
        title: 'Managing Director',
        city: 'Westport',
        state: 'CT',
        country: 'USA',
        notes: 'Investor relations advisor',
        tags: ['ir', 'investor-relations'],
        relationshipScore: 70,
        ownerId: user.id,
      },
    }),
    // Prospects/Leads
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'INVESTOR',
        status: 'PROSPECT',
        firstName: 'Andrew',
        lastName: 'Kim',
        email: 'akim@wellingtonfunds.com',
        phone: '+1-617-555-1401',
        company: 'Wellington Management',
        title: 'Portfolio Manager',
        city: 'Boston',
        state: 'MA',
        country: 'USA',
        notes: 'Potential PIPE investor. Initial outreach pending.',
        tags: ['investor', 'prospect', 'pipe'],
        relationshipScore: 20,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'INVESTOR',
        status: 'LEAD',
        firstName: 'Laura',
        lastName: 'Jackson',
        email: 'ljackson@troweprice.com',
        phone: '+1-410-555-1501',
        company: 'T. Rowe Price',
        title: 'Senior Investment Analyst',
        city: 'Baltimore',
        state: 'MD',
        country: 'USA',
        notes: 'Met at conference. Interested in tech SPACs.',
        tags: ['investor', 'lead', 'conference-contact'],
        relationshipScore: 35,
        ownerId: user.id,
      },
    }),
    // Archived contact
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'BANKER',
        status: 'INACTIVE',
        firstName: 'Steven',
        lastName: 'Rogers',
        email: 'srogers@oldbank.com',
        phone: '+1-212-555-1601',
        company: 'Old Investment Bank',
        title: 'Director',
        city: 'New York',
        state: 'NY',
        country: 'USA',
        notes: 'Left the firm. No longer active.',
        tags: ['banking', 'inactive'],
        relationshipScore: 0,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'Michelle',
        lastName: 'Thompson',
        email: 'mthompson@techflow.io',
        phone: '+1-415-555-0405',
        company: 'TechFlow Solutions',
        companyId: companies[3].id,
        title: 'VP of Sales',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        tags: ['target', 'sales', 'techflow'],
        relationshipScore: 50,
        ownerId: user.id,
      },
    }),
    prisma.contact.create({
      data: {
        organizationId: organization.id,
        type: 'EXECUTIVE',
        status: 'ACTIVE',
        firstName: 'Brian',
        lastName: 'Johnson',
        email: 'bjohnson@techflow.io',
        phone: '+1-415-555-0406',
        company: 'TechFlow Solutions',
        companyId: companies[3].id,
        title: 'VP of Engineering',
        city: 'San Francisco',
        state: 'CA',
        country: 'USA',
        tags: ['target', 'engineering', 'techflow'],
        relationshipScore: 45,
        ownerId: user.id,
      },
    }),
  ]);
  console.log(`✅ Created ${contacts.length} contacts\n`);

  // Create Interactions
  console.log('📅 Creating interactions...');
  const interactions = await Promise.all([
    prisma.interaction.create({
      data: {
        contactId: contacts[0].id, // Michael Thompson (Legal)
        type: 'CALL',
        subject: 'Weekly status call',
        description: 'Discussed S-4 filing timeline and SEC comment letter response strategy',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        duration: 45,
        outcome: 'Agreed on response timeline',
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[3].id, // Jennifer Liu (Banking)
        type: 'MEETING',
        subject: 'Target pipeline review',
        description: 'Reviewed three new target opportunities in the fintech sector',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        duration: 60,
        outcome: 'Will send CIMs for top 2 targets',
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[8].id, // Alex Rivera (TechFlow CEO)
        type: 'MEETING',
        subject: 'Management presentation',
        description: 'Deep-dive presentation on TechFlow business model, technology, and growth strategy',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        duration: 120,
        outcome: 'Positive impression. Moving forward with due diligence.',
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[13].id, // Sarah Williams (Fidelity)
        type: 'CALL',
        subject: 'PIPE interest discussion',
        description: 'Discussed potential PIPE participation for TechFlow transaction',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        duration: 30,
        outcome: 'Confirmed $50M capacity. Will share materials.',
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[10].id, // James Wong (TechFlow CFO)
        type: 'CALL',
        subject: 'Financial due diligence kickoff',
        description: 'Discussed data room access and financial DD scope',
        date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        duration: 45,
        outcome: 'Data room access granted. DD team scheduled.',
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[6].id, // Robert Martinez (Deloitte)
        type: 'EMAIL',
        subject: 'Audit timeline confirmation',
        description: 'Confirmed Q4 audit schedule and deliverables',
        date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[0].id, // Michael Thompson (Legal)
        type: 'EMAIL',
        subject: 'LOI draft review',
        description: 'Sent initial LOI draft for TechFlow transaction',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        outcome: 'Awaiting comments',
        createdById: user.id,
      },
    }),
    prisma.interaction.create({
      data: {
        contactId: contacts[8].id, // Alex Rivera (TechFlow CEO)
        type: 'LINKEDIN',
        subject: 'Initial outreach',
        description: 'Connected on LinkedIn. Brief intro exchange.',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdById: user.id,
      },
    }),
  ]);
  console.log(`✅ Created ${interactions.length} interactions\n`);

  // Create Contact Notes
  console.log('📝 Creating contact notes...');
  await Promise.all([
    prisma.contactNote.create({
      data: {
        contactId: contacts[8].id, // Alex Rivera
        content: 'Very impressive background. Previously built and sold a $200M company. Strong vision for TechFlow.',
        isPinned: true,
        createdById: user.id,
      },
    }),
    prisma.contactNote.create({
      data: {
        contactId: contacts[13].id, // Sarah Williams
        content: 'Prefers early-stage communication. Likes to see draft materials before formal presentation.',
        isPinned: true,
        createdById: user.id,
      },
    }),
    prisma.contactNote.create({
      data: {
        contactId: contacts[0].id, // Michael Thompson
        content: 'Best time to reach is mornings before 10am or after 6pm. Very busy during market hours.',
        isPinned: false,
        createdById: user.id,
      },
    }),
  ]);
  console.log('✅ Created contact notes\n');

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

  // ============================================================================
  // SPRINT 9 - Filing Workflow Seed Data
  // ============================================================================

  // Get the first filing to add workflow data
  const filingsForWorkflow = await prisma.filing.findMany({ take: 3 });

  if (filingsForWorkflow.length > 0) {
    const filing = filingsForWorkflow[0];

    // Seed Workflow Steps
    const workflowSteps = [
      { name: 'Initial Draft', description: 'Prepare initial draft of filing', order: 1, status: 'completed' },
      { name: 'Internal Review', description: 'Internal team review and feedback', order: 2, status: 'completed' },
      { name: 'External Legal Review', description: 'External counsel review', order: 3, status: 'completed' },
      { name: 'Board Approval', description: 'Board review and approval', order: 4, status: 'in_progress' },
      { name: 'File with SEC', description: 'Submit via EDGAR', order: 5, status: 'pending' },
      { name: 'SEC Review', description: 'Await SEC review and comments', order: 6, status: 'pending' },
      { name: 'Response to Comments', description: 'Respond to SEC comments', order: 7, status: 'pending' },
      { name: 'Declared Effective', description: 'Filing declared effective', order: 8, status: 'pending' },
    ];

    for (const step of workflowSteps) {
      await prisma.filingWorkflowStep.upsert({
        where: { id: `workflow-${filing.id}-${step.order}` },
        create: {
          id: `workflow-${filing.id}-${step.order}`,
          filingId: filing.id,
          name: step.name,
          description: step.description,
          order: step.order,
          status: step.status,
          completedAt: step.status === 'completed' ? new Date(Date.now() - (8 - step.order) * 7 * 24 * 60 * 60 * 1000) : null,
        },
        update: {},
      });
    }

    // Seed Reviewers
    const reviewers = [
      { name: 'John Smith', email: 'john@example.com', role: 'primary', status: 'approved' },
      { name: 'Sarah Johnson', email: 'sarah@example.com', role: 'legal', status: 'approved' },
      { name: 'External Counsel', email: 'counsel@lawfirm.com', role: 'external', status: 'pending' },
    ];

    for (let i = 0; i < reviewers.length; i++) {
      const r = reviewers[i];
      await prisma.filingReviewer.upsert({
        where: { id: `reviewer-${filing.id}-${i}` },
        create: {
          id: `reviewer-${filing.id}-${i}`,
          filingId: filing.id,
          name: r.name,
          email: r.email,
          role: r.role,
          status: r.status,
          reviewedAt: r.status === 'approved' ? new Date(Date.now() - (3 - i) * 5 * 24 * 60 * 60 * 1000) : null,
        },
        update: {},
      });
    }

    // Seed Checklist Items
    const checklistItems = [
      { item: 'Executive Summary', category: 'Disclosure', order: 1, isCompleted: true },
      { item: 'Risk Factors', category: 'Disclosure', order: 2, isCompleted: true },
      { item: 'Business Description', category: 'Disclosure', order: 3, isCompleted: true },
      { item: 'Audited Financial Statements', category: 'Financial', order: 4, isCompleted: true },
      { item: 'Pro Forma Financials', category: 'Financial', order: 5, isCompleted: false },
      { item: 'Management Discussion & Analysis', category: 'Financial', order: 6, isCompleted: false },
      { item: 'Legal Opinion', category: 'Legal', order: 7, isCompleted: true },
      { item: 'Material Agreements', category: 'Exhibits', order: 8, isCompleted: false },
    ];

    for (let i = 0; i < checklistItems.length; i++) {
      const item = checklistItems[i];
      await prisma.filingChecklist.upsert({
        where: { id: `checklist-${filing.id}-${i}` },
        create: {
          id: `checklist-${filing.id}-${i}`,
          filingId: filing.id,
          item: item.item,
          category: item.category,
          order: item.order,
          isCompleted: item.isCompleted,
          completedAt: item.isCompleted ? new Date(Date.now() - (8 - item.order) * 3 * 24 * 60 * 60 * 1000) : null,
        },
        update: {},
      });
    }

    console.log('✅ Filing workflow seed data created');
  }

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
  console.log(`  - Companies: ${companies.length}`);
  console.log(`  - Contacts: ${contacts.length}`);
  console.log(`  - Interactions: ${interactions.length}`);
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
