/**
 * SPAC OS - Contact Seed Script
 *
 * Seeds the database with demo contact data for development and testing.
 * Based on the mock contacts data structure.
 *
 * Run with: npm run db:seed-contacts
 */

import { PrismaClient, ContactType, ContactStatus, InteractionType } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get random items from array
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Helper to get random date in the past N days
function getRandomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

// Company data
const companiesData = [
  {
    name: 'Goldman Sachs',
    industry: 'Investment Banking',
    type: 'Investment Bank',
    website: 'https://www.goldmansachs.com',
    headquarters: 'New York, NY',
    description: 'Global investment banking and securities firm providing investment management, securities, and asset management services.',
    size: '10000+',
    foundedYear: 1869,
  },
  {
    name: 'BTIG',
    industry: 'Investment Banking',
    type: 'Investment Bank',
    website: 'https://www.btig.com',
    headquarters: 'New York, NY',
    description: 'Global financial services firm specializing in institutional trading, investment banking, and research.',
    size: '501-1000',
    foundedYear: 2002,
  },
  {
    name: 'Kirkland & Ellis',
    industry: 'Legal Services',
    type: 'Law Firm',
    website: 'https://www.kirkland.com',
    headquarters: 'New York, NY',
    description: 'Global law firm with leading practices in corporate, intellectual property, restructuring, and litigation.',
    size: '1001-5000',
    foundedYear: 1909,
  },
  {
    name: 'Skadden, Arps, Slate, Meagher & Flom',
    industry: 'Legal Services',
    type: 'Law Firm',
    website: 'https://www.skadden.com',
    headquarters: 'New York, NY',
    description: 'Global law firm providing legal services across a wide range of complex transactions and disputes.',
    size: '1001-5000',
    foundedYear: 1948,
  },
  {
    name: 'BlackRock',
    industry: 'Asset Management',
    type: 'Investor',
    website: 'https://www.blackrock.com',
    headquarters: 'New York, NY',
    description: "World's largest asset manager providing investment management and risk management services.",
    size: '10000+',
    foundedYear: 1988,
  },
  {
    name: 'Fidelity Investments',
    industry: 'Asset Management',
    type: 'Investor',
    website: 'https://www.fidelity.com',
    headquarters: 'Boston, MA',
    description: 'Financial services company offering investment management, retirement planning, and wealth management.',
    size: '10000+',
    foundedYear: 1946,
  },
  {
    name: 'Deloitte',
    industry: 'Accounting',
    type: 'Accounting Firm',
    website: 'https://www.deloitte.com',
    headquarters: 'New York, NY',
    description: 'Global professional services firm providing audit, consulting, tax, and advisory services.',
    size: '10000+',
    foundedYear: 1845,
  },
  {
    name: 'EY',
    industry: 'Accounting',
    type: 'Accounting Firm',
    website: 'https://www.ey.com',
    headquarters: 'London, UK',
    description: 'Multinational professional services network providing assurance, tax, consulting, and advisory services.',
    size: '10000+',
    foundedYear: 1989,
  },
  {
    name: 'Tiger Global Management',
    industry: 'Private Equity',
    type: 'Private Equity',
    website: 'https://www.tigerglobal.com',
    headquarters: 'New York, NY',
    description: 'Investment firm focused on global internet, software, and technology companies.',
    size: '51-200',
    foundedYear: 2001,
  },
  {
    name: 'Vista Equity Partners',
    industry: 'Private Equity',
    type: 'Private Equity',
    website: 'https://www.vistaequitypartners.com',
    headquarters: 'Austin, TX',
    description: 'Private equity firm focused on software, data, and technology-enabled businesses.',
    size: '501-1000',
    foundedYear: 2000,
  },
];

// Contacts data - 30 realistic contacts
const contactsData = [
  // Investment Bankers
  { firstName: 'Sarah', lastName: 'Mitchell', title: 'Managing Director, SPAC Coverage', email: 'sarah.mitchell@gs.com', phone: '+1 (212) 902-1000', type: 'BANKER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 0, tags: ['Lead Banker', 'Technology Focus', 'Priority'], relationshipScore: 92, isStarred: true, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'James', lastName: 'Richardson', title: 'Vice President, M&A', email: 'james.richardson@gs.com', phone: '+1 (212) 902-2000', type: 'BANKER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 0, tags: ['Healthcare', 'PIPE Specialist'], relationshipScore: 78, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Michael', lastName: 'Thornton', title: 'Managing Director, Investment Banking', email: 'mthornton@btig.com', phone: '+1 (212) 738-6000', type: 'BANKER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 1, tags: ['SPAC IPO Expert', 'EV/CleanTech'], relationshipScore: 85, isStarred: true, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Amanda', lastName: 'Foster', title: 'Director, Equity Capital Markets', email: 'afoster@btig.com', phone: '+1 (212) 738-6100', type: 'BANKER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 1, tags: ['ECM', 'SPAC IPO'], relationshipScore: 71, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },

  // Legal Counsel
  { firstName: 'David', lastName: 'Westbrook', title: 'Partner, Corporate', email: 'david.westbrook@kirkland.com', phone: '+1 (212) 446-4800', type: 'LEGAL' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 2, tags: ['SPAC Counsel', 'De-SPAC Expert', 'SEC Specialist'], relationshipScore: 95, isStarred: true, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Jennifer', lastName: 'Kim', title: 'Partner, Capital Markets', email: 'jennifer.kim@kirkland.com', phone: '+1 (212) 446-4850', type: 'LEGAL' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 2, tags: ['PIPE Documentation', 'Securities'], relationshipScore: 88, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Robert', lastName: 'Harrison', title: 'Partner, M&A', email: 'robert.harrison@skadden.com', phone: '+1 (212) 735-3000', type: 'LEGAL' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 3, tags: ['Target Counsel', 'M&A Expert'], relationshipScore: 82, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Catherine', lastName: 'Lopez', title: 'Counsel, Corporate', email: 'catherine.lopez@skadden.com', phone: '+1 (212) 735-3100', type: 'LEGAL' as ContactType, status: 'PROSPECT' as ContactStatus, companyIndex: 3, tags: ['Governance', 'Board Advisory'], relationshipScore: 68, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },

  // Investors
  { firstName: 'William', lastName: 'Patterson', title: 'Managing Director, Private Equity', email: 'william.patterson@blackrock.com', phone: '+1 (212) 810-5000', type: 'INVESTOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 4, tags: ['PIPE Investor', 'Institutional', 'Tech Focus'], relationshipScore: 86, isStarred: true, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Rachel', lastName: 'Thompson', title: 'Vice President, Alternative Investments', email: 'rachel.thompson@blackrock.com', phone: '+1 (212) 810-5100', type: 'INVESTOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 4, tags: ['PIPE Investor', 'Due Diligence'], relationshipScore: 74, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Christopher', lastName: 'Bennett', title: 'Portfolio Manager', email: 'christopher.bennett@fidelity.com', phone: '+1 (617) 563-7000', type: 'INVESTOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 5, tags: ['PIPE Investor', 'Growth Equity'], relationshipScore: 79, isStarred: false, city: 'Boston', state: 'MA', country: 'USA' },
  { firstName: 'Andrew', lastName: 'Kim', title: 'Partner', email: 'andrew.kim@tigerglobal.com', phone: '+1 (212) 555-9000', type: 'INVESTOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 8, tags: ['Growth Investor', 'PIPE', 'Tech Focus'], relationshipScore: 84, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Samantha', lastName: 'Lee', title: 'Principal', email: 'samantha.lee@wellington.com', phone: '+1 (617) 555-1100', type: 'INVESTOR' as ContactType, status: 'PROSPECT' as ContactStatus, companyIndex: null, tags: ['Long-only', 'Public Markets'], relationshipScore: 62, isStarred: false, city: 'Boston', state: 'MA', country: 'USA' },

  // Auditors / Accountants
  { firstName: 'Mark', lastName: 'Johnson', title: 'Partner, Audit', email: 'mark.johnson@deloitte.com', phone: '+1 (212) 492-4000', type: 'AUDITOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 6, tags: ['Audit', 'PCAOB', 'SPAC Experience'], relationshipScore: 76, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Elizabeth', lastName: 'Taylor', title: 'Partner, Transaction Advisory', email: 'elizabeth.taylor@ey.com', phone: '+1 (212) 773-3000', type: 'AUDITOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 7, tags: ['Due Diligence', 'Quality of Earnings'], relationshipScore: 81, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },

  // Advisors
  { firstName: 'Patricia', lastName: 'Morgan', title: 'Senior Advisor', email: 'patricia.morgan@advisors.com', phone: '+1 (650) 555-5000', type: 'ADVISOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['Strategic Advisor', 'Tech', 'Former Executive'], relationshipScore: 83, isStarred: false, city: 'Palo Alto', state: 'CA', country: 'USA' },
  { firstName: 'George', lastName: 'Adams', title: 'Operating Partner', email: 'george.adams@vistaequity.com', phone: '+1 (415) 555-6000', type: 'ADVISOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: 9, tags: ['PE Advisor', 'Operations', 'Value Creation'], relationshipScore: 77, isStarred: false, city: 'San Francisco', state: 'CA', country: 'USA' },

  // Board Members / Sponsors
  { firstName: 'Richard', lastName: 'Sterling', title: 'Chairman & CEO', email: 'richard.sterling@alphaacquisition.com', phone: '+1 (212) 555-3000', type: 'SPONSOR' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['SPAC Sponsor', 'Board Chair', 'Decision Maker'], relationshipScore: 98, isStarred: true, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Victoria', lastName: 'Chang', title: 'CFO', email: 'victoria.chang@alphaacquisition.com', phone: '+1 (212) 555-3010', type: 'BOARD_MEMBER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['SPAC CFO', 'Trust Account'], relationshipScore: 91, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Thomas', lastName: 'Wright', title: 'Board Member', email: 'thomas.wright@alphaacquisition.com', phone: '+1 (212) 555-3020', type: 'BOARD_MEMBER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['Board Member', 'Tech Expert'], relationshipScore: 75, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },

  // Target Executives
  { firstName: 'Alexander', lastName: 'Chen', title: 'CEO & Co-Founder', email: 'alex.chen@novatechsolutions.com', phone: '+1 (415) 555-1000', type: 'TARGET_EXEC' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['Target CEO', 'Priority', 'AI/ML Expert'], relationshipScore: 94, isStarred: true, city: 'San Francisco', state: 'CA', country: 'USA' },
  { firstName: 'Priya', lastName: 'Sharma', title: 'CFO', email: 'priya.sharma@novatechsolutions.com', phone: '+1 (415) 555-1010', type: 'TARGET_EXEC' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['Target CFO', 'Finance'], relationshipScore: 89, isStarred: false, city: 'San Francisco', state: 'CA', country: 'USA' },
  { firstName: 'Marcus', lastName: 'Green', title: 'CEO & Founder', email: 'marcus.green@greenenergydynamics.com', phone: '+1 (512) 555-2000', type: 'TARGET_EXEC' as ContactType, status: 'PROSPECT' as ContactStatus, companyIndex: null, tags: ['Target CEO', 'CleanTech', 'Early Stage'], relationshipScore: 72, isStarred: false, city: 'Austin', state: 'TX', country: 'USA' },
  { firstName: 'Elena', lastName: 'Rodriguez', title: 'COO', email: 'elena.rodriguez@greenenergydynamics.com', phone: '+1 (512) 555-2010', type: 'TARGET_EXEC' as ContactType, status: 'LEAD' as ContactStatus, companyIndex: null, tags: ['Operations', 'CleanTech'], relationshipScore: 65, isStarred: false, city: 'Austin', state: 'TX', country: 'USA' },
  { firstName: 'Michelle', lastName: 'Carter', title: 'CEO & Founder', email: 'michelle.carter@healthfirstinnovations.com', phone: '+1 (617) 555-4000', type: 'TARGET_EXEC' as ContactType, status: 'PROSPECT' as ContactStatus, companyIndex: null, tags: ['Target CEO', 'Healthcare', 'MD Background'], relationshipScore: 67, isStarred: false, city: 'Boston', state: 'MA', country: 'USA' },
  { firstName: 'Daniel', lastName: 'Park', title: 'CFO', email: 'daniel.park@healthfirstinnovations.com', phone: '+1 (617) 555-4010', type: 'TARGET_EXEC' as ContactType, status: 'LEAD' as ContactStatus, companyIndex: null, tags: ['Healthcare', 'Finance'], relationshipScore: 58, isStarred: false, city: 'Boston', state: 'MA', country: 'USA' },

  // Additional contacts for variety
  { firstName: 'Kevin', lastName: 'Murphy', title: 'Managing Director', email: 'kevin.murphy@cantor.com', phone: '+1 (212) 555-7000', type: 'BANKER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['SPAC Capital Markets', 'Structuring'], relationshipScore: 69, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Linda', lastName: 'Chen', title: 'Director, Investment Banking', email: 'linda.chen@citi.com', phone: '+1 (212) 555-8000', type: 'BANKER' as ContactType, status: 'ACTIVE' as ContactStatus, companyIndex: null, tags: ['SPAC Coverage', 'TMT'], relationshipScore: 73, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Steven', lastName: 'Roberts', title: 'Partner', email: 'steven.roberts@weil.com', phone: '+1 (212) 310-8000', type: 'LEGAL' as ContactType, status: 'PROSPECT' as ContactStatus, companyIndex: null, tags: ['M&A', 'SPAC', 'Cross-border'], relationshipScore: 80, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
  { firstName: 'Nancy', lastName: 'Wilson', title: 'Partner', email: 'nancy.wilson@stblaw.com', phone: '+1 (212) 455-2000', type: 'LEGAL' as ContactType, status: 'INACTIVE' as ContactStatus, companyIndex: null, tags: ['Capital Markets', 'IPO'], relationshipScore: 71, isStarred: false, city: 'New York', state: 'NY', country: 'USA' },
];

// Sample interactions data
const interactionTemplates = [
  { type: 'EMAIL' as InteractionType, subject: 'Follow-up on PIPE structure', description: 'Discussed potential PIPE terms and investor outreach strategy' },
  { type: 'CALL' as InteractionType, subject: 'Market Update Call', description: 'Reviewed current SPAC market conditions and deal pipeline' },
  { type: 'MEETING' as InteractionType, subject: 'Deal Review Meeting', description: 'Comprehensive review of target valuation and transaction timeline' },
  { type: 'NOTE' as InteractionType, subject: 'Internal Notes', description: 'Key relationship notes and follow-up items documented' },
  { type: 'EMAIL' as InteractionType, subject: 'Documentation Review', description: 'Exchanged comments on draft transaction documents' },
  { type: 'CALL' as InteractionType, subject: 'Due Diligence Update', description: 'Discussed DD findings and outstanding items' },
  { type: 'MEETING' as InteractionType, subject: 'Management Presentation', description: 'Attended target management presentation with key stakeholders' },
  { type: 'EMAIL' as InteractionType, subject: 'Investor Interest', description: 'Received indication of interest for PIPE participation' },
  { type: 'CALL' as InteractionType, subject: 'SEC Filing Discussion', description: 'Reviewed SEC comment letter and response strategy' },
  { type: 'MEETING' as InteractionType, subject: 'Board Update', description: 'Presented deal status and next steps to board members' },
];

async function main() {
  console.log('Seeding contacts...\n');

  // Check if we should clean existing data
  const existingCompanies = await prisma.company.count();
  const existingContacts = await prisma.contact.count();

  if (existingCompanies > 0 || existingContacts > 0) {
    console.log('Cleaning existing contact-related data...');
    await prisma.interaction.deleteMany({});
    await prisma.contactNote.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.company.deleteMany({});
    console.log('Existing data cleaned\n');
  }

  // 1. Create companies
  console.log('Creating companies...');
  const companies = await Promise.all(
    companiesData.map((companyData) =>
      prisma.company.create({
        data: companyData,
      })
    )
  );
  console.log(`Created ${companies.length} companies\n`);

  // 2. Create contacts
  console.log('Creating contacts...');
  const contacts = await Promise.all(
    contactsData.map((contactData) => {
      const { companyIndex, ...data } = contactData;
      const company = companyIndex !== null ? companies[companyIndex] : null;
      return prisma.contact.create({
        data: {
          ...data,
          companyId: company?.id ?? null,
          company: company?.name ?? null,
          lastInteractionAt: getRandomPastDate(30),
        },
      });
    })
  );
  console.log(`Created ${contacts.length} contacts\n`);

  // 3. Create sample interactions for contacts with high relationship scores
  console.log('Creating sample interactions...');
  const highValueContacts = contacts.filter((c) => contactsData.find(
    cd => cd.email === c.email && cd.relationshipScore >= 75
  ));

  let interactionCount = 0;
  for (const contact of highValueContacts) {
    const numInteractions = Math.floor(Math.random() * 4) + 1; // 1-4 interactions
    const selectedInteractions = getRandomItems(interactionTemplates, numInteractions);

    for (const template of selectedInteractions) {
      await prisma.interaction.create({
        data: {
          contactId: contact.id,
          type: template.type,
          subject: template.subject,
          description: template.description,
          date: getRandomPastDate(60),
          duration: template.type === 'MEETING' ? 60 : template.type === 'CALL' ? 30 : null,
        },
      });
      interactionCount++;
    }
  }
  console.log(`Created ${interactionCount} interactions\n`);

  // 4. Create some contact notes for starred contacts
  console.log('Creating contact notes...');
  const starredContacts = contacts.filter((c) => contactsData.find(
    cd => cd.email === c.email && cd.isStarred
  ));

  let noteCount = 0;
  const noteTemplates = [
    { content: 'Key relationship for deal sourcing. Has extensive network in the tech sector.', isPinned: true },
    { content: 'Prefers morning meetings. Very responsive to emails.', isPinned: false },
    { content: 'Previous deal experience together. Strong working relationship.', isPinned: true },
    { content: 'Deep expertise in SPAC transactions. Go-to advisor for complex structures.', isPinned: true },
    { content: 'Strategic thinker with valuable market insights.', isPinned: false },
  ];

  for (const contact of starredContacts) {
    const selectedNotes = getRandomItems(noteTemplates, 2);
    for (const noteTemplate of selectedNotes) {
      await prisma.contactNote.create({
        data: {
          contactId: contact.id,
          content: noteTemplate.content,
          isPinned: noteTemplate.isPinned,
        },
      });
      noteCount++;
    }
  }
  console.log(`Created ${noteCount} contact notes\n`);

  // Summary
  console.log('============================================');
  console.log('Contact seeding completed successfully!');
  console.log('============================================\n');
  console.log('Summary:');
  console.log(`  - Companies: ${companies.length}`);
  console.log(`  - Contacts: ${contacts.length}`);
  console.log(`  - Interactions: ${interactionCount}`);
  console.log(`  - Contact Notes: ${noteCount}`);
  console.log(`\nContact breakdown by type:`);

  const typeCounts = contacts.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`  - ${type}: ${count}`);
  });

  console.log(`\nStarred contacts: ${starredContacts.length}`);
  console.log(`High relationship score (>=75): ${highValueContacts.length}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
