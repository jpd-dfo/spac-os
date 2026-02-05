/**
 * SPAC OS - Database Seed Script
 *
 * Seeds the database with sample data for development and testing.
 * Uses sequential operations to avoid Supabase connection pool limits.
 *
 * Run with: npm run db:seed
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🧹 Cleaning existing data...');
    // Delete in reverse order of dependencies
    await prisma.targetFitScore.deleteMany({});
    await prisma.ownershipStake.deleteMany({});
    await prisma.iBCoverage.deleteMany({});
    await prisma.iBMandate.deleteMany({});
    await prisma.interaction.deleteMany({});
    await prisma.contactNote.deleteMany({});
    await prisma.meetingAttendee.deleteMany({});
    await prisma.meeting.deleteMany({});
    await prisma.email.deleteMany({});
    await prisma.activityFeed.deleteMany({});
    await prisma.filingChecklist.deleteMany({});
    await prisma.filingReviewer.deleteMany({});
    await prisma.filingWorkflowStep.deleteMany({});
    await prisma.filing.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.target.deleteMany({});
    await prisma.trustAccount.deleteMany({});
    await prisma.milestone.deleteMany({});
    await prisma.complianceItem.deleteMany({});
    await prisma.spacSponsor.deleteMany({});
    await prisma.spac.deleteMany({});
    await prisma.sponsor.deleteMany({});
    await prisma.targetContact.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.companyDeal.deleteMany({});
    await prisma.company.deleteMany({});
    await prisma.organizationUser.deleteMany({});
    await prisma.organization.deleteMany({});
    await prisma.user.deleteMany({});
    console.log('✅ Existing data cleaned\n');
  }

  // ============================================================================
  // Core Setup: Organization, User, Sponsor, SPAC
  // ============================================================================

  // Create Organization (tenant)
  console.log('📁 Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      name: 'Soren Capital Partners',
      slug: 'soren-capital',
      type: 'OTHER',
    },
  });
  console.log(`✅ Created organization: ${organization.name}\n`);

  // Create User
  console.log('👤 Creating user...');
  const user = await prisma.user.create({
    data: {
      email: 'demo@spacos.app',
      name: 'Demo User',
      firstName: 'Demo',
      lastName: 'User',
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
      name: 'Soren Capital Management',
      tier: 'TIER_2',
      website: 'https://sorencapital.com',
      description: 'Leading SPAC sponsor focused on Technology and Financial Services sectors.',
    },
  });
  console.log(`✅ Created sponsor: ${sponsor.name}\n`);

  // Create SPAC
  console.log('📈 Creating SPAC...');
  const spac = await prisma.spac.create({
    data: {
      name: 'Soren Acquisition Corp',
      ticker: 'SACU',
      cik: '0001234567',
      status: 'SEARCHING',
      phase: 'TARGET_SEARCH',
      ipoDate: new Date('2024-06-15'),
      ipoSize: 250000000,
      trustAmount: 253750000,
      trustBalance: 255500000,
      sharesOutstanding: 25000000n,
      deadline: new Date('2026-06-15'),
      deadlineDate: new Date('2026-06-15'),
      extensionsUsed: 0,
      maxExtensions: 6,
      description: 'Soren Acquisition Corp is a blank check company focused on Technology and Financial Services.',
      targetSectors: ['Technology', 'Financial Services'],
      targetGeographies: ['North America', 'Europe'],
      tags: ['tech-focused', 'fintech', 'active'],
      organizationId: organization.id,
    },
  });

  // Link SPAC to Sponsor
  await prisma.spacSponsor.create({
    data: {
      spacId: spac.id,
      sponsorId: sponsor.id,
      isPrimary: true,
      ownershipPct: 0.20,
    },
  });
  console.log(`✅ Created SPAC: ${spac.ticker} - ${spac.name}\n`);

  // ============================================================================
  // Pipeline Targets
  // ============================================================================

  console.log('🎯 Creating pipeline targets...');
  const target1 = await prisma.target.create({
    data: {
      spacId: spac.id,
      name: 'TechFlow Solutions',
      status: 'DUE_DILIGENCE',
      stage: 'FULL_DD',
      priority: 1,
      probability: 0.65,
      description: 'Enterprise workflow automation platform with AI-powered process optimization.',
      sector: 'Technology',
      industry: 'Enterprise Software',
      revenue: 85000000,
      ebitda: 12000000,
      enterpriseValue: 850000000,
      evRevenue: 8.9,
      evEbitda: 56.7,
      managementScore: 8,
      marketScore: 9,
      financialScore: 7,
      operationalScore: 8,
      riskScore: 3,
      overallScore: 8.2,
      identifiedDate: new Date('2024-09-01'),
      ndaSignedDate: new Date('2024-10-01'),
      keyRisks: ['Customer concentration', 'Competition from established players'],
      keyOpportunities: ['Strong product-market fit', 'AI features driving upsell'],
    },
  });

  const target2 = await prisma.target.create({
    data: {
      spacId: spac.id,
      name: 'PayNext Financial',
      status: 'NDA_SIGNED',
      stage: 'PRELIMINARY_DD',
      priority: 2,
      probability: 0.40,
      description: 'B2B payments infrastructure for emerging markets.',
      sector: 'Financial Services',
      industry: 'Fintech',
      revenue: 45000000,
      ebitda: -5000000,
      enterpriseValue: 450000000,
      evRevenue: 10.0,
      managementScore: 7,
      marketScore: 8,
      financialScore: 5,
      overallScore: 6.8,
      identifiedDate: new Date('2024-10-15'),
      ndaSignedDate: new Date('2024-11-20'),
      keyRisks: ['Not yet profitable', 'Regulatory complexity'],
      keyOpportunities: ['Large TAM', 'First-mover advantage'],
    },
  });

  const target3 = await prisma.target.create({
    data: {
      spacId: spac.id,
      name: 'CyberShield Security',
      status: 'IDENTIFIED',
      stage: 'SOURCING',
      priority: 3,
      probability: 0.25,
      description: 'Next-generation endpoint security platform.',
      sector: 'Technology',
      industry: 'Cybersecurity',
      revenue: 35000000,
      ebitda: -8000000,
      enterpriseValue: 400000000,
      evRevenue: 11.4,
      identifiedDate: new Date('2024-11-01'),
      keyRisks: ['High competition', 'Key person risk'],
    },
  });
  console.log(`✅ Created 3 pipeline targets\n`);

  // ============================================================================
  // Companies (for contact associations)
  // ============================================================================

  console.log('🏢 Creating companies...');
  const companies = [];

  const companyData = [
    { name: 'Kirkland & Ellis LLP', industry: 'Legal Services', type: 'Law Firm', headquarters: 'Chicago, IL' },
    { name: 'Goldman Sachs', industry: 'Investment Banking', type: 'Investment Bank', headquarters: 'New York, NY' },
    { name: 'Deloitte LLP', industry: 'Professional Services', type: 'Accounting Firm', headquarters: 'London, UK' },
    { name: 'TechFlow Solutions', industry: 'Technology', type: 'Target', headquarters: 'San Francisco, CA' },
    { name: 'Fidelity Investments', industry: 'Asset Management', type: 'Institutional Investor', headquarters: 'Boston, MA' },
    { name: 'Morgan Stanley', industry: 'Investment Banking', type: 'Investment Bank', headquarters: 'New York, NY' },
    { name: 'Skadden Arps', industry: 'Legal Services', type: 'Law Firm', headquarters: 'New York, NY' },
    { name: 'BlackRock', industry: 'Asset Management', type: 'Institutional Investor', headquarters: 'New York, NY' },
    { name: 'PayNext Financial', industry: 'Fintech', type: 'Target', headquarters: 'London, UK' },
    { name: 'CyberShield Security', industry: 'Cybersecurity', type: 'Target', headquarters: 'Austin, TX' },
  ];

  for (const data of companyData) {
    const company = await prisma.company.create({ data });
    companies.push(company);
  }
  console.log(`✅ Created ${companies.length} companies\n`);

  // ============================================================================
  // Contacts (sequential to avoid connection limits)
  // ============================================================================

  console.log('📇 Creating contacts...');
  const contacts = [];

  const contactData = [
    // Legal
    { firstName: 'Michael', lastName: 'Thompson', email: 'mthompson@kirklandellis.com', companyId: companies[0].id, title: 'Partner', type: 'LEGAL' as const, isStarred: true, relationshipScore: 95 },
    { firstName: 'Emily', lastName: 'Chen', email: 'echen@skadden.com', companyId: companies[6].id, title: 'Partner', type: 'LEGAL' as const, relationshipScore: 75 },
    // Banking
    { firstName: 'Jennifer', lastName: 'Liu', email: 'jennifer.liu@gs.com', companyId: companies[1].id, title: 'Managing Director', type: 'BANKER' as const, isStarred: true, relationshipScore: 90 },
    { firstName: 'Marcus', lastName: 'Williams', email: 'marcus.williams@ms.com', companyId: companies[5].id, title: 'Managing Director', type: 'BANKER' as const, relationshipScore: 70 },
    // Auditors
    { firstName: 'Robert', lastName: 'Martinez', email: 'robert.martinez@deloitte.com', companyId: companies[2].id, title: 'Partner', type: 'AUDITOR' as const, relationshipScore: 80 },
    // Target Execs
    { firstName: 'Alex', lastName: 'Rivera', email: 'alex@techflow.io', companyId: companies[3].id, title: 'CEO & Co-Founder', type: 'TARGET_EXEC' as const, isStarred: true, relationshipScore: 85, seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'Maya', lastName: 'Patel', email: 'maya@techflow.io', companyId: companies[3].id, title: 'CTO & Co-Founder', type: 'TARGET_EXEC' as const, relationshipScore: 70, seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'James', lastName: 'Wong', email: 'james@techflow.io', companyId: companies[3].id, title: 'CFO', type: 'TARGET_EXEC' as const, isStarred: true, relationshipScore: 80, seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'John', lastName: 'Smith', email: 'john@paynext.com', companyId: companies[8].id, title: 'CEO', type: 'TARGET_EXEC' as const, relationshipScore: 55, seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'Rachel', lastName: 'Adams', email: 'rachel@cybershield.io', companyId: companies[9].id, title: 'CEO', type: 'TARGET_EXEC' as const, relationshipScore: 45, seniorityLevel: 'C_LEVEL' as const },
    // Investors
    { firstName: 'Sarah', lastName: 'Williams', email: 'swilliams@fidelity.com', companyId: companies[4].id, title: 'Portfolio Manager', type: 'INVESTOR' as const, isStarred: true, relationshipScore: 85 },
    { firstName: 'Thomas', lastName: 'Anderson', email: 'tanderson@blackrock.com', companyId: companies[7].id, title: 'Managing Director', type: 'INVESTOR' as const, relationshipScore: 70 },
    // Board
    { firstName: 'William', lastName: 'Harrison', email: 'wharrison@email.com', title: 'Independent Director', type: 'BOARD_MEMBER' as const, isStarred: true, relationshipScore: 90 },
    // Advisors
    { firstName: 'Patricia', lastName: 'Gonzalez', email: 'pgonzalez@mckinsey.com', title: 'Partner', type: 'ADVISOR' as const, relationshipScore: 65 },
  ];

  for (const data of contactData) {
    const contact = await prisma.contact.create({
      data: {
        ...data,
        company: data.companyId ? undefined : 'Independent',
        status: 'ACTIVE',
        relationshipStrength: data.relationshipScore >= 80 ? 'HOT' : data.relationshipScore >= 60 ? 'WARM' : 'COLD',
        ownerId: user.id,
      },
    });
    contacts.push(contact);
  }
  console.log(`✅ Created ${contacts.length} contacts\n`);

  // ============================================================================
  // Sprint 12: Target Company Organizations with Financial Metrics
  // ============================================================================

  console.log('🎯 Creating target company organizations (Sprint 12)...');

  // PE Firms (to be owners of target companies)
  const sequoia = await prisma.organization.create({
    data: {
      name: 'Sequoia Capital',
      slug: 'sequoia-capital',
      type: 'PE_FIRM',
      subType: 'GROWTH_EQUITY',
      headquarters: 'Menlo Park, CA',
      website: 'https://www.sequoiacap.com',
      aum: 85000000000,
      industryFocus: ['Technology', 'Healthcare', 'Financial Services'],
      description: 'Legendary Silicon Valley venture capital and growth equity firm',
    },
  });

  const vista = await prisma.organization.create({
    data: {
      name: 'Vista Equity Partners',
      slug: 'vista-equity-partners',
      type: 'PE_FIRM',
      subType: 'BUYOUT',
      headquarters: 'Austin, TX',
      website: 'https://www.vistaequitypartners.com',
      aum: 100000000000,
      industryFocus: ['Enterprise Software', 'Data', 'Technology'],
      description: 'Leading private equity firm focused on enterprise software',
    },
  });

  const thomaBravo = await prisma.organization.create({
    data: {
      name: 'Thoma Bravo',
      slug: 'thoma-bravo',
      type: 'PE_FIRM',
      subType: 'BUYOUT',
      headquarters: 'San Francisco, CA',
      website: 'https://www.thomabravo.com',
      aum: 122000000000,
      industryFocus: ['Software', 'Cybersecurity', 'Financial Technology'],
      description: 'Premier software-focused private equity firm',
    },
  });
  console.log('✅ Created 3 PE firm organizations');

  // Target Company Organizations with financial metrics
  const targetCompanies = [];
  const targetCompanyData = [
    { name: 'DataStream Analytics', slug: 'datastream-analytics', headquarters: 'Boston, MA', industryFocus: ['Data Analytics', 'Enterprise Software'], revenue: 120000000, ebitda: 25000000, revenueGrowth: 35.5, grossMargin: 72.0 },
    { name: 'CloudSecure Technologies', slug: 'cloudsecure-tech', headquarters: 'Denver, CO', industryFocus: ['Cybersecurity', 'Cloud Infrastructure'], revenue: 85000000, ebitda: 12000000, revenueGrowth: 48.2, grossMargin: 78.5 },
    { name: 'FinFlow Payments', slug: 'finflow-payments', headquarters: 'Miami, FL', industryFocus: ['Fintech', 'Payments'], revenue: 200000000, ebitda: 35000000, revenueGrowth: 28.0, grossMargin: 45.0 },
    { name: 'MedTech Innovations', slug: 'medtech-innovations', headquarters: 'San Diego, CA', industryFocus: ['Healthcare Technology', 'Medical Devices'], revenue: 65000000, ebitda: 8000000, revenueGrowth: 55.0, grossMargin: 68.0 },
    { name: 'GreenEnergy Systems', slug: 'greenenergy-systems', headquarters: 'Portland, OR', industryFocus: ['Clean Energy', 'Sustainability'], revenue: 150000000, ebitda: 22000000, revenueGrowth: 32.0, grossMargin: 58.0 },
    { name: 'LogiChain Solutions', slug: 'logichain-solutions', headquarters: 'Chicago, IL', industryFocus: ['Supply Chain', 'Logistics'], revenue: 95000000, ebitda: 15000000, revenueGrowth: 40.0, grossMargin: 65.0 },
    { name: 'EduTech Global', slug: 'edutech-global', headquarters: 'Seattle, WA', industryFocus: ['EdTech', 'SaaS'], revenue: 180000000, ebitda: 28000000, revenueGrowth: 25.0, grossMargin: 70.0 },
    { name: 'AutoDrive AI', slug: 'autodrive-ai', headquarters: 'Detroit, MI', industryFocus: ['Autonomous Vehicles', 'AI/ML'], revenue: 45000000, ebitda: -8000000, revenueGrowth: 120.0, grossMargin: 55.0 },
    { name: 'RetailSync', slug: 'retailsync', headquarters: 'New York, NY', industryFocus: ['Retail Technology', 'E-commerce'], revenue: 110000000, ebitda: 18000000, revenueGrowth: 38.0, grossMargin: 72.0 },
    { name: 'BioGenesis Labs', slug: 'biogenesis-labs', headquarters: 'Cambridge, MA', industryFocus: ['Biotechnology', 'Life Sciences'], revenue: 30000000, ebitda: -15000000, revenueGrowth: 85.0, grossMargin: 80.0 },
  ];

  for (const data of targetCompanyData) {
    const targetCompany = await prisma.organization.create({
      data: {
        ...data,
        type: 'TARGET_COMPANY',
        description: `Leading ${data.industryFocus[0]} company headquartered in ${data.headquarters}`,
      },
    });
    targetCompanies.push(targetCompany);
  }
  console.log(`✅ Created ${targetCompanies.length} target company organizations`);

  // Ownership Stakes
  console.log('📊 Creating ownership stakes...');
  const ownershipData = [
    { ownerId: sequoia.id, ownedId: targetCompanies[0].id, ownershipPct: 55.0, stakeType: 'MAJORITY' as const, entryValuation: 150000000 },
    { ownerId: thomaBravo.id, ownedId: targetCompanies[1].id, ownershipPct: 35.0, stakeType: 'MINORITY' as const, entryValuation: 80000000 },
    { ownerId: sequoia.id, ownedId: targetCompanies[3].id, ownershipPct: 48.0, stakeType: 'MINORITY' as const, entryValuation: 60000000 },
    { ownerId: vista.id, ownedId: targetCompanies[4].id, ownershipPct: 70.0, stakeType: 'MAJORITY' as const, entryValuation: 200000000 },
    { ownerId: vista.id, ownedId: targetCompanies[5].id, ownershipPct: 40.0, stakeType: 'MINORITY' as const, entryValuation: 75000000 },
    { ownerId: thomaBravo.id, ownedId: targetCompanies[6].id, ownershipPct: 60.0, stakeType: 'MAJORITY' as const, entryValuation: 250000000 },
    { ownerId: sequoia.id, ownedId: targetCompanies[7].id, ownershipPct: 25.0, stakeType: 'MINORITY' as const, entryValuation: 100000000 },
    { ownerId: vista.id, ownedId: targetCompanies[8].id, ownershipPct: 45.0, stakeType: 'MINORITY' as const, entryValuation: 120000000 },
    { ownerId: sequoia.id, ownedId: targetCompanies[9].id, ownershipPct: 30.0, stakeType: 'MINORITY' as const, entryValuation: 50000000 },
  ];

  for (const data of ownershipData) {
    await prisma.ownershipStake.create({
      data: {
        ...data,
        investmentDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), 1),
        boardSeats: data.stakeType === 'MAJORITY' ? 3 : 1,
      },
    });
  }
  console.log(`✅ Created ${ownershipData.length} ownership stakes`);

  // Target company executive contacts
  console.log('👥 Creating target company executive contacts...');
  const targetExecData = [
    { firstName: 'Michael', lastName: 'Chen', email: 'mchen@datastream.io', organizationId: targetCompanies[0].id, title: 'CEO & Co-Founder', seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'Jennifer', lastName: 'Park', email: 'jpark@datastream.io', organizationId: targetCompanies[0].id, title: 'CFO', seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'David', lastName: 'Morrison', email: 'dmorrison@cloudsecure.io', organizationId: targetCompanies[1].id, title: 'CEO', seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'Sofia', lastName: 'Rodriguez', email: 'srodriguez@finflow.com', organizationId: targetCompanies[2].id, title: 'CEO & Founder', seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'Robert', lastName: 'Kim', email: 'rkim@medtechinnovations.com', organizationId: targetCompanies[3].id, title: 'CEO & CMO', seniorityLevel: 'C_LEVEL' as const },
    { firstName: 'Emma', lastName: 'Larson', email: 'elarson@greenenergysystems.com', organizationId: targetCompanies[4].id, title: 'CEO', seniorityLevel: 'C_LEVEL' as const },
  ];

  for (const data of targetExecData) {
    await prisma.contact.create({
      data: {
        ...data,
        type: 'TARGET_EXEC',
        status: 'ACTIVE',
        relationshipStrength: 'WARM',
        relationshipScore: 50 + Math.floor(Math.random() * 30),
        ownerId: user.id,
      },
    });
  }
  console.log(`✅ Created ${targetExecData.length} target company executive contacts\n`);

  // ============================================================================
  // Documents & Filings
  // ============================================================================

  console.log('📄 Creating documents and filings...');

  await prisma.document.create({
    data: {
      spacId: spac.id,
      name: 'SACU S-1 Registration Statement',
      type: 'SEC_FILING',
      status: 'FINAL',
      fileUrl: '/documents/sec/sacu-s1.pdf',
      fileSize: 2456789,
      mimeType: 'application/pdf',
    },
  });

  await prisma.document.create({
    data: {
      spacId: spac.id,
      targetId: target1.id,
      name: 'TechFlow CIM',
      type: 'DUE_DILIGENCE',
      status: 'APPROVED',
      fileUrl: '/documents/targets/techflow-cim.pdf',
      fileSize: 5678901,
      mimeType: 'application/pdf',
    },
  });

  const filing = await prisma.filing.create({
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
    },
  });
  console.log('✅ Created documents and filings\n');

  // ============================================================================
  // Tasks, Milestones, Compliance
  // ============================================================================

  console.log('✅ Creating tasks and milestones...');

  await prisma.task.create({
    data: {
      spac: { connect: { id: spac.id } },
      target: { connect: { id: target1.id } },
      creator: { connect: { id: user.id } },
      assignee: { connect: { id: user.id } },
      title: 'Complete TechFlow financial due diligence',
      description: 'Review historical financials and revenue recognition policies',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.task.create({
    data: {
      spac: { connect: { id: spac.id } },
      creator: { connect: { id: user.id } },
      title: 'Prepare Q4 board presentation',
      description: 'Update pipeline status and timeline',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.milestone.create({
    data: {
      spac: { connect: { id: spac.id } },
      name: 'IPO Completed',
      type: 'FINANCIAL',
      description: 'Successfully completed IPO',
      targetDate: new Date('2024-06-15'),
      actualDate: new Date('2024-06-15'),
      isCompleted: true,
    },
  });

  await prisma.milestone.create({
    data: {
      spac: { connect: { id: spac.id } },
      name: 'Target Identification',
      type: 'OPERATIONAL',
      description: 'Identify and vet potential target companies',
      targetDate: new Date('2025-03-31'),
      isCompleted: false,
    },
  });

  await prisma.complianceItem.create({
    data: {
      spac: { connect: { id: spac.id } },
      name: 'Annual 10-K Filing',
      description: 'File annual report with SEC',
      category: 'SEC',
      status: 'PENDING',
      dueDate: new Date('2025-03-31'),
      assignedTo: 'CFO',
    },
  });
  console.log('✅ Created tasks, milestones, and compliance items\n');

  // ============================================================================
  // Trust Account
  // ============================================================================

  console.log('💰 Creating trust account...');
  await prisma.trustAccount.create({
    data: {
      spac: { connect: { id: spac.id } },
      accountName: 'Continental Stock Transfer & Trust Company - SACU Trust',
      currentBalance: 255500000,
      balanceDate: new Date(),
      accruedInterest: 1750000,
      perShareValue: 10.22,
    },
  });
  console.log('✅ Created trust account\n');

  // ============================================================================
  // Filing Workflow (Sprint 9)
  // ============================================================================

  console.log('📝 Creating filing workflow data...');
  const workflowSteps = [
    { name: 'Initial Draft', order: 1, status: 'completed' },
    { name: 'Internal Review', order: 2, status: 'completed' },
    { name: 'External Legal Review', order: 3, status: 'completed' },
    { name: 'Board Approval', order: 4, status: 'in_progress' },
    { name: 'File with SEC', order: 5, status: 'pending' },
  ];

  for (const step of workflowSteps) {
    await prisma.filingWorkflowStep.create({
      data: {
        filingId: filing.id,
        name: step.name,
        order: step.order,
        status: step.status,
        completedAt: step.status === 'completed' ? new Date(Date.now() - (5 - step.order) * 7 * 24 * 60 * 60 * 1000) : null,
      },
    });
  }

  const reviewers = [
    { name: 'John Smith', email: 'john@example.com', role: 'primary', status: 'approved' },
    { name: 'Sarah Johnson', email: 'sarah@example.com', role: 'legal', status: 'approved' },
  ];

  for (const r of reviewers) {
    await prisma.filingReviewer.create({
      data: {
        filingId: filing.id,
        ...r,
        reviewedAt: r.status === 'approved' ? new Date() : null,
      },
    });
  }
  console.log('✅ Created filing workflow data\n');

  // ============================================================================
  // Summary
  // ============================================================================

  console.log('============================================');
  console.log('🎉 Database seeding completed successfully!');
  console.log('============================================\n');
  console.log('Summary:');
  console.log(`  - Organization: ${organization.name}`);
  console.log(`  - User: ${user.email}`);
  console.log(`  - SPAC: ${spac.ticker} - ${spac.name}`);
  console.log(`  - Sponsor: ${sponsor.name}`);
  console.log(`  - Pipeline Targets: 3`);
  console.log(`  - Companies: ${companies.length}`);
  console.log(`  - Contacts: ${contacts.length + targetExecData.length}`);
  console.log(`  - PE Firms: 3`);
  console.log(`  - Target Companies: ${targetCompanies.length}`);
  console.log(`  - Ownership Stakes: ${ownershipData.length}`);
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
