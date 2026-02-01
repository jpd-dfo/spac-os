// ============================================================================
// SPAC OS - Mock Contacts Data
// Comprehensive mock data representing a realistic SPAC ecosystem
// ============================================================================

export type ContactCategory =
  | 'Founders'
  | 'Executives'
  | 'Advisors'
  | 'Bankers'
  | 'Lawyers'
  | 'Investors'
  | 'Accountants'
  | 'Board';

export type InteractionType = 'email' | 'call' | 'meeting' | 'note' | 'task';

export interface ContactInteraction {
  id: string;
  type: InteractionType;
  subject: string;
  description: string;
  date: string;
  participants?: string[];
  linkedDealId?: string;
}

export interface ContactNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
  isPinned?: boolean;
}

export interface LinkedDeal {
  id: string;
  name: string;
  role: string;
  status: string;
}

export interface ExtendedContact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  companyId: string;
  category: ContactCategory;
  email: string;
  phone: string;
  mobile?: string;
  linkedIn: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  tags: string[];
  relationshipScore: number;
  lastInteraction: string;
  interactions: ContactInteraction[];
  notes: ContactNote[];
  linkedDeals: LinkedDeal[];
  documents: { id: string; name: string; type: string; sharedDate: string }[];
  meetings: { id: string; title: string; date: string; attendees: string[] }[];
  avatar?: string;
  isStarred?: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  type: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  employeeCount?: number;
  foundedYear?: number;
  description: string;
  contactIds: string[];
  dealHistory: { dealName: string; role: string; year: number; outcome: string }[];
  news: { title: string; date: string; source: string; url: string }[];
}

// Investment Banks
export const mockCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'Goldman Sachs',
    industry: 'Investment Banking',
    type: 'Banker',
    website: 'https://www.goldmansachs.com',
    address: '200 West Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    employeeCount: 45000,
    foundedYear: 1869,
    description: 'Global investment banking and securities firm providing investment management, securities, and asset management services.',
    contactIds: ['contact-1', 'contact-2'],
    dealHistory: [
      { dealName: 'Churchill Capital IV / Lucid Motors', role: 'Lead Advisor', year: 2021, outcome: 'Completed' },
      { dealName: 'Social Capital / Virgin Galactic', role: 'Co-Advisor', year: 2019, outcome: 'Completed' },
    ],
    news: [
      { title: 'Goldman Sees Record SPAC Activity in Q1', date: '2026-01-15', source: 'Bloomberg', url: '#' },
      { title: 'Goldman Expands SPAC Advisory Team', date: '2026-01-10', source: 'WSJ', url: '#' },
    ],
  },
  {
    id: 'company-2',
    name: 'BTIG',
    industry: 'Investment Banking',
    type: 'Banker',
    website: 'https://www.btig.com',
    address: '65 East 55th Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    employeeCount: 500,
    foundedYear: 2002,
    description: 'Global financial services firm specializing in institutional trading, investment banking, and research.',
    contactIds: ['contact-3', 'contact-4'],
    dealHistory: [
      { dealName: 'Pivotal Investment III / XOS Trucks', role: 'Lead Advisor', year: 2021, outcome: 'Completed' },
    ],
    news: [
      { title: 'BTIG Named Top SPAC Underwriter', date: '2026-01-12', source: 'Dealogic', url: '#' },
    ],
  },
  {
    id: 'company-3',
    name: 'Kirkland & Ellis',
    industry: 'Legal Services',
    type: 'Law Firm',
    website: 'https://www.kirkland.com',
    address: '601 Lexington Avenue',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    employeeCount: 3000,
    foundedYear: 1909,
    description: 'Global law firm with leading practices in corporate, intellectual property, restructuring, and litigation.',
    contactIds: ['contact-5', 'contact-6'],
    dealHistory: [
      { dealName: 'Pershing Square Tontine / Universal Music', role: 'SPAC Counsel', year: 2021, outcome: 'Terminated' },
      { dealName: 'Churchill Capital IV / Lucid Motors', role: 'SPAC Counsel', year: 2021, outcome: 'Completed' },
    ],
    news: [
      { title: 'Kirkland Dominates SPAC Legal Rankings', date: '2026-01-08', source: 'Law360', url: '#' },
    ],
  },
  {
    id: 'company-4',
    name: 'Skadden, Arps, Slate, Meagher & Flom',
    industry: 'Legal Services',
    type: 'Law Firm',
    website: 'https://www.skadden.com',
    address: 'One Manhattan West',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    employeeCount: 2200,
    foundedYear: 1948,
    description: 'Global law firm providing legal services across a wide range of complex transactions and disputes.',
    contactIds: ['contact-7', 'contact-8'],
    dealHistory: [
      { dealName: 'Social Capital / SoFi', role: 'Target Counsel', year: 2021, outcome: 'Completed' },
    ],
    news: [],
  },
  {
    id: 'company-5',
    name: 'NovaTech Solutions',
    industry: 'Enterprise Software',
    type: 'Target Company',
    website: 'https://www.novatechsolutions.com',
    address: '500 Technology Drive',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    employeeCount: 450,
    foundedYear: 2015,
    description: 'AI-powered enterprise software platform for supply chain optimization and predictive analytics.',
    contactIds: ['contact-9', 'contact-10'],
    dealHistory: [],
    news: [
      { title: 'NovaTech Raises $50M Series C', date: '2025-11-20', source: 'TechCrunch', url: '#' },
      { title: 'NovaTech Named to Forbes AI 50', date: '2025-10-15', source: 'Forbes', url: '#' },
    ],
  },
  {
    id: 'company-6',
    name: 'GreenEnergy Dynamics',
    industry: 'Clean Energy',
    type: 'Target Company',
    website: 'https://www.greenenergydynamics.com',
    address: '100 Renewable Way',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    employeeCount: 280,
    foundedYear: 2018,
    description: 'Next-generation battery storage and renewable energy management solutions.',
    contactIds: ['contact-11', 'contact-12'],
    dealHistory: [],
    news: [
      { title: 'GreenEnergy Partners with Major Utility', date: '2026-01-05', source: 'Energy Weekly', url: '#' },
    ],
  },
  {
    id: 'company-7',
    name: 'BlackRock',
    industry: 'Asset Management',
    type: 'Investor',
    website: 'https://www.blackrock.com',
    address: '55 East 52nd Street',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    employeeCount: 18000,
    foundedYear: 1988,
    description: "World's largest asset manager providing investment management and risk management services.",
    contactIds: ['contact-13', 'contact-14'],
    dealHistory: [
      { dealName: 'Churchill Capital IV / Lucid Motors', role: 'PIPE Investor', year: 2021, outcome: 'Completed' },
      { dealName: 'Reinvent Technology Partners / Joby Aviation', role: 'PIPE Investor', year: 2021, outcome: 'Completed' },
    ],
    news: [],
  },
  {
    id: 'company-8',
    name: 'Fidelity Investments',
    industry: 'Asset Management',
    type: 'Investor',
    website: 'https://www.fidelity.com',
    address: '245 Summer Street',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    employeeCount: 55000,
    foundedYear: 1946,
    description: 'Financial services company offering investment management, retirement planning, and wealth management.',
    contactIds: ['contact-15'],
    dealHistory: [],
    news: [],
  },
  {
    id: 'company-9',
    name: 'Alpha Acquisition Corp',
    industry: 'Special Purpose Acquisition Company',
    type: 'SPAC',
    website: 'https://www.alphaacquisition.com',
    address: '1345 Avenue of the Americas',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    description: 'SPAC focused on technology and digital transformation targets.',
    contactIds: ['contact-16', 'contact-17', 'contact-18'],
    dealHistory: [],
    news: [
      { title: 'Alpha Acquisition Corp Completes $300M IPO', date: '2025-09-01', source: 'Reuters', url: '#' },
    ],
  },
  {
    id: 'company-10',
    name: 'HealthFirst Innovations',
    industry: 'Healthcare Technology',
    type: 'Target Company',
    website: 'https://www.healthfirstinnovations.com',
    address: '200 Medical Center Drive',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    employeeCount: 320,
    foundedYear: 2016,
    description: 'Digital health platform connecting patients with personalized care pathways and remote monitoring.',
    contactIds: ['contact-19', 'contact-20'],
    dealHistory: [],
    news: [],
  },
];

// Mock Contacts - 30 realistic SPAC ecosystem contacts
export const mockContacts: ExtendedContact[] = [
  // Goldman Sachs Bankers
  {
    id: 'contact-1',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    title: 'Managing Director, SPAC Coverage',
    company: 'Goldman Sachs',
    companyId: 'company-1',
    category: 'Bankers',
    email: 'sarah.mitchell@gs.com',
    phone: '+1 (212) 902-1000',
    mobile: '+1 (917) 555-0101',
    linkedIn: 'https://linkedin.com/in/sarahmitchell',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Lead Banker', 'Technology Focus', 'Priority'],
    relationshipScore: 92,
    lastInteraction: '2026-01-25',
    interactions: [
      { id: 'int-1', type: 'meeting', subject: 'NovaTech Deal Review', description: 'Discussed valuation multiples and PIPE structure', date: '2026-01-25', participants: ['Sarah Mitchell', 'John Chen'] },
      { id: 'int-2', type: 'email', subject: 'Updated Comp Analysis', description: 'Received updated comparable company analysis', date: '2026-01-22' },
      { id: 'int-3', type: 'call', subject: 'Market Update Call', description: 'Discussed current SPAC market conditions', date: '2026-01-18' },
    ],
    notes: [
      { id: 'note-1', content: 'Sarah has deep relationships with tech founders in the Bay Area. Excellent for sourcing.', createdBy: 'Michael Torres', createdAt: '2025-12-15', isPinned: true },
      { id: 'note-2', content: 'Prefers morning meetings. Very responsive to emails.', createdBy: 'Lisa Wang', createdAt: '2025-11-20' },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Lead Advisor', status: 'Active' },
    ],
    documents: [
      { id: 'doc-1', name: 'SPAC Market Overview Q1 2026.pdf', type: 'pdf', sharedDate: '2026-01-20' },
    ],
    meetings: [
      { id: 'mtg-1', title: 'NovaTech Deal Review', date: '2026-01-25', attendees: ['Sarah Mitchell', 'John Chen', 'Michael Torres'] },
    ],
    isStarred: true,
    createdAt: '2024-06-15',
  },
  {
    id: 'contact-2',
    firstName: 'James',
    lastName: 'Richardson',
    title: 'Vice President, M&A',
    company: 'Goldman Sachs',
    companyId: 'company-1',
    category: 'Bankers',
    email: 'james.richardson@gs.com',
    phone: '+1 (212) 902-2000',
    linkedIn: 'https://linkedin.com/in/jamesrichardson',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Healthcare', 'PIPE Specialist'],
    relationshipScore: 78,
    lastInteraction: '2026-01-20',
    interactions: [
      { id: 'int-4', type: 'email', subject: 'HealthFirst PIPE Interest', description: 'Shared list of potential PIPE investors', date: '2026-01-20' },
    ],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-02-10',
  },
  // BTIG Bankers
  {
    id: 'contact-3',
    firstName: 'Michael',
    lastName: 'Thornton',
    title: 'Managing Director, Investment Banking',
    company: 'BTIG',
    companyId: 'company-2',
    category: 'Bankers',
    email: 'mthornton@btig.com',
    phone: '+1 (212) 738-6000',
    mobile: '+1 (646) 555-0202',
    linkedIn: 'https://linkedin.com/in/michaelthornton',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['SPAC IPO Expert', 'EV/CleanTech'],
    relationshipScore: 85,
    lastInteraction: '2026-01-23',
    interactions: [
      { id: 'int-5', type: 'meeting', subject: 'GreenEnergy Introduction', description: 'Introduced GreenEnergy Dynamics as potential target', date: '2026-01-23' },
    ],
    notes: [
      { id: 'note-3', content: 'Michael led BTIG\'s SPAC practice expansion. Great market insights.', createdBy: 'John Chen', createdAt: '2025-08-10', isPinned: true },
    ],
    linkedDeals: [
      { id: 'deal-2', name: 'GreenEnergy Dynamics', role: 'Introducing Banker', status: 'Preliminary' },
    ],
    documents: [],
    meetings: [],
    isStarred: true,
    createdAt: '2024-09-20',
  },
  {
    id: 'contact-4',
    firstName: 'Amanda',
    lastName: 'Foster',
    title: 'Director, Equity Capital Markets',
    company: 'BTIG',
    companyId: 'company-2',
    category: 'Bankers',
    email: 'afoster@btig.com',
    phone: '+1 (212) 738-6100',
    linkedIn: 'https://linkedin.com/in/amandafoster',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['ECM', 'SPAC IPO'],
    relationshipScore: 71,
    lastInteraction: '2026-01-15',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-04-05',
  },
  // Kirkland & Ellis Lawyers
  {
    id: 'contact-5',
    firstName: 'David',
    lastName: 'Westbrook',
    title: 'Partner, Corporate',
    company: 'Kirkland & Ellis',
    companyId: 'company-3',
    category: 'Lawyers',
    email: 'david.westbrook@kirkland.com',
    phone: '+1 (212) 446-4800',
    mobile: '+1 (917) 555-0303',
    linkedIn: 'https://linkedin.com/in/davidwestbrook',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['SPAC Counsel', 'De-SPAC Expert', 'SEC Specialist'],
    relationshipScore: 95,
    lastInteraction: '2026-01-26',
    interactions: [
      { id: 'int-6', type: 'meeting', subject: 'SEC Comment Letter Review', description: 'Reviewed SEC comment letter strategy for S-4', date: '2026-01-26' },
      { id: 'int-7', type: 'call', subject: 'Deal Structure Discussion', description: 'Discussed earnout provisions', date: '2026-01-24' },
      { id: 'int-8', type: 'email', subject: 'Draft S-4 Comments', description: 'Provided comments on draft S-4 filing', date: '2026-01-21' },
    ],
    notes: [
      { id: 'note-4', content: 'David is the go-to SPAC lawyer. Has handled 50+ de-SPAC transactions.', createdBy: 'Michael Torres', createdAt: '2024-12-01', isPinned: true },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'SPAC Counsel', status: 'Active' },
    ],
    documents: [
      { id: 'doc-2', name: 'S-4 Draft v3.docx', type: 'docx', sharedDate: '2026-01-21' },
      { id: 'doc-3', name: 'SEC Comment Response.pdf', type: 'pdf', sharedDate: '2026-01-26' },
    ],
    meetings: [
      { id: 'mtg-2', title: 'SEC Comment Letter Review', date: '2026-01-26', attendees: ['David Westbrook', 'Jennifer Kim', 'Michael Torres'] },
    ],
    isStarred: true,
    createdAt: '2024-03-10',
  },
  {
    id: 'contact-6',
    firstName: 'Jennifer',
    lastName: 'Kim',
    title: 'Partner, Capital Markets',
    company: 'Kirkland & Ellis',
    companyId: 'company-3',
    category: 'Lawyers',
    email: 'jennifer.kim@kirkland.com',
    phone: '+1 (212) 446-4850',
    linkedIn: 'https://linkedin.com/in/jenniferkim',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['PIPE Documentation', 'Securities'],
    relationshipScore: 88,
    lastInteraction: '2026-01-24',
    interactions: [
      { id: 'int-9', type: 'email', subject: 'PIPE Subscription Agreement', description: 'Sent draft PIPE subscription agreement', date: '2026-01-24' },
    ],
    notes: [],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'PIPE Counsel', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2024-07-22',
  },
  // Skadden Lawyers
  {
    id: 'contact-7',
    firstName: 'Robert',
    lastName: 'Harrison',
    title: 'Partner, M&A',
    company: 'Skadden, Arps, Slate, Meagher & Flom',
    companyId: 'company-4',
    category: 'Lawyers',
    email: 'robert.harrison@skadden.com',
    phone: '+1 (212) 735-3000',
    linkedIn: 'https://linkedin.com/in/robertharrison',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Target Counsel', 'M&A Expert'],
    relationshipScore: 82,
    lastInteraction: '2026-01-18',
    interactions: [],
    notes: [
      { id: 'note-5', content: 'Robert typically represents targets. Good relationship for referrals.', createdBy: 'Lisa Wang', createdAt: '2025-06-15' },
    ],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-01-08',
  },
  {
    id: 'contact-8',
    firstName: 'Catherine',
    lastName: 'Lopez',
    title: 'Counsel, Corporate',
    company: 'Skadden, Arps, Slate, Meagher & Flom',
    companyId: 'company-4',
    category: 'Lawyers',
    email: 'catherine.lopez@skadden.com',
    phone: '+1 (212) 735-3100',
    linkedIn: 'https://linkedin.com/in/catherinelopez',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Governance', 'Board Advisory'],
    relationshipScore: 68,
    lastInteraction: '2026-01-10',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-05-12',
  },
  // NovaTech Founders/Executives
  {
    id: 'contact-9',
    firstName: 'Alexander',
    lastName: 'Chen',
    title: 'CEO & Co-Founder',
    company: 'NovaTech Solutions',
    companyId: 'company-5',
    category: 'Founders',
    email: 'alex.chen@novatechsolutions.com',
    phone: '+1 (415) 555-1000',
    mobile: '+1 (415) 555-1001',
    linkedIn: 'https://linkedin.com/in/alexanderchen',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    tags: ['Target CEO', 'Priority', 'AI/ML Expert'],
    relationshipScore: 94,
    lastInteraction: '2026-01-27',
    interactions: [
      { id: 'int-10', type: 'meeting', subject: 'Management Presentation Prep', description: 'Prepared for investor presentation', date: '2026-01-27' },
      { id: 'int-11', type: 'call', subject: 'Valuation Discussion', description: 'Discussed enterprise value expectations', date: '2026-01-22' },
      { id: 'int-12', type: 'meeting', subject: 'Initial Management Meeting', description: 'First formal meeting with management team', date: '2026-01-15' },
    ],
    notes: [
      { id: 'note-6', content: 'Alex is a serial entrepreneur - previous company acquired by Oracle. Very sophisticated.', createdBy: 'Michael Torres', createdAt: '2025-12-20', isPinned: true },
      { id: 'note-7', content: 'Prefers video calls over phone. Available 7am-9pm PT.', createdBy: 'Sarah Mitchell', createdAt: '2026-01-16' },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Target CEO', status: 'Active' },
    ],
    documents: [
      { id: 'doc-4', name: 'NovaTech Management Presentation.pptx', type: 'pptx', sharedDate: '2026-01-27' },
      { id: 'doc-5', name: 'NovaTech Financial Model.xlsx', type: 'xlsx', sharedDate: '2026-01-20' },
    ],
    meetings: [
      { id: 'mtg-3', title: 'Management Presentation Prep', date: '2026-01-27', attendees: ['Alexander Chen', 'Priya Sharma', 'Michael Torres', 'Sarah Mitchell'] },
    ],
    isStarred: true,
    createdAt: '2025-11-05',
  },
  {
    id: 'contact-10',
    firstName: 'Priya',
    lastName: 'Sharma',
    title: 'CFO',
    company: 'NovaTech Solutions',
    companyId: 'company-5',
    category: 'Executives',
    email: 'priya.sharma@novatechsolutions.com',
    phone: '+1 (415) 555-1010',
    linkedIn: 'https://linkedin.com/in/priyasharma',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    tags: ['Target CFO', 'Finance'],
    relationshipScore: 89,
    lastInteraction: '2026-01-27',
    interactions: [
      { id: 'int-13', type: 'email', subject: 'Financial Due Diligence Request', description: 'Provided response to DD questions', date: '2026-01-25' },
    ],
    notes: [
      { id: 'note-8', content: 'Former Big 4 partner. Very detail-oriented on financials.', createdBy: 'James Richardson', createdAt: '2025-12-18' },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Target CFO', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2025-11-10',
  },
  // GreenEnergy Founders/Executives
  {
    id: 'contact-11',
    firstName: 'Marcus',
    lastName: 'Green',
    title: 'CEO & Founder',
    company: 'GreenEnergy Dynamics',
    companyId: 'company-6',
    category: 'Founders',
    email: 'marcus.green@greenenergydynamics.com',
    phone: '+1 (512) 555-2000',
    mobile: '+1 (512) 555-2001',
    linkedIn: 'https://linkedin.com/in/marcusgreen',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    tags: ['Target CEO', 'CleanTech', 'Early Stage'],
    relationshipScore: 72,
    lastInteraction: '2026-01-23',
    interactions: [
      { id: 'int-14', type: 'meeting', subject: 'Initial Introduction', description: 'First meeting to discuss potential transaction', date: '2026-01-23' },
    ],
    notes: [
      { id: 'note-9', content: 'MIT engineering background. Very technical founder.', createdBy: 'Michael Thornton', createdAt: '2026-01-23' },
    ],
    linkedDeals: [
      { id: 'deal-2', name: 'GreenEnergy Dynamics', role: 'Target CEO', status: 'Preliminary' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2026-01-20',
  },
  {
    id: 'contact-12',
    firstName: 'Elena',
    lastName: 'Rodriguez',
    title: 'COO',
    company: 'GreenEnergy Dynamics',
    companyId: 'company-6',
    category: 'Executives',
    email: 'elena.rodriguez@greenenergydynamics.com',
    phone: '+1 (512) 555-2010',
    linkedIn: 'https://linkedin.com/in/elenarodriguez',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    tags: ['Operations', 'CleanTech'],
    relationshipScore: 65,
    lastInteraction: '2026-01-23',
    interactions: [],
    notes: [],
    linkedDeals: [
      { id: 'deal-2', name: 'GreenEnergy Dynamics', role: 'Target COO', status: 'Preliminary' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2026-01-20',
  },
  // BlackRock Investors
  {
    id: 'contact-13',
    firstName: 'William',
    lastName: 'Patterson',
    title: 'Managing Director, Private Equity',
    company: 'BlackRock',
    companyId: 'company-7',
    category: 'Investors',
    email: 'william.patterson@blackrock.com',
    phone: '+1 (212) 810-5000',
    mobile: '+1 (917) 555-0404',
    linkedIn: 'https://linkedin.com/in/williampatterson',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['PIPE Investor', 'Institutional', 'Tech Focus'],
    relationshipScore: 86,
    lastInteraction: '2026-01-24',
    interactions: [
      { id: 'int-15', type: 'meeting', subject: 'PIPE Investment Discussion', description: 'Discussed potential PIPE participation in NovaTech', date: '2026-01-24' },
      { id: 'int-16', type: 'email', subject: 'NovaTech CIM', description: 'Sent confidential information memorandum', date: '2026-01-22' },
    ],
    notes: [
      { id: 'note-10', content: 'William has $500M+ allocation for SPAC PIPE investments. Primary decision maker.', createdBy: 'Sarah Mitchell', createdAt: '2025-10-30', isPinned: true },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Potential PIPE Investor', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    isStarred: true,
    createdAt: '2024-11-15',
  },
  {
    id: 'contact-14',
    firstName: 'Rachel',
    lastName: 'Thompson',
    title: 'Vice President, Alternative Investments',
    company: 'BlackRock',
    companyId: 'company-7',
    category: 'Investors',
    email: 'rachel.thompson@blackrock.com',
    phone: '+1 (212) 810-5100',
    linkedIn: 'https://linkedin.com/in/rachelthompson',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['PIPE Investor', 'Due Diligence'],
    relationshipScore: 74,
    lastInteraction: '2026-01-22',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-03-20',
  },
  // Fidelity Investor
  {
    id: 'contact-15',
    firstName: 'Christopher',
    lastName: 'Bennett',
    title: 'Portfolio Manager',
    company: 'Fidelity Investments',
    companyId: 'company-8',
    category: 'Investors',
    email: 'christopher.bennett@fidelity.com',
    phone: '+1 (617) 563-7000',
    linkedIn: 'https://linkedin.com/in/christopherbennett',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    tags: ['PIPE Investor', 'Growth Equity'],
    relationshipScore: 79,
    lastInteraction: '2026-01-19',
    interactions: [
      { id: 'int-17', type: 'call', subject: 'Market Opportunity Discussion', description: 'Discussed AI/enterprise software market', date: '2026-01-19' },
    ],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-01-25',
  },
  // Alpha Acquisition Corp Board/Executives
  {
    id: 'contact-16',
    firstName: 'Richard',
    lastName: 'Sterling',
    title: 'Chairman & CEO',
    company: 'Alpha Acquisition Corp',
    companyId: 'company-9',
    category: 'Board',
    email: 'richard.sterling@alphaacquisition.com',
    phone: '+1 (212) 555-3000',
    mobile: '+1 (917) 555-0505',
    linkedIn: 'https://linkedin.com/in/richardsterling',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['SPAC Sponsor', 'Board Chair', 'Decision Maker'],
    relationshipScore: 98,
    lastInteraction: '2026-01-28',
    interactions: [
      { id: 'int-18', type: 'meeting', subject: 'Board Update', description: 'Presented NovaTech deal status to board', date: '2026-01-28' },
      { id: 'int-19', type: 'call', subject: 'Deal Strategy', description: 'Discussed negotiation approach', date: '2026-01-26' },
    ],
    notes: [
      { id: 'note-11', content: 'Richard is a former PE partner at KKR. Deep tech sector experience.', createdBy: 'Michael Torres', createdAt: '2024-08-15', isPinned: true },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'SPAC Chairman', status: 'Active' },
      { id: 'deal-2', name: 'GreenEnergy Dynamics', role: 'SPAC Chairman', status: 'Preliminary' },
    ],
    documents: [],
    meetings: [],
    isStarred: true,
    createdAt: '2024-05-01',
  },
  {
    id: 'contact-17',
    firstName: 'Victoria',
    lastName: 'Chang',
    title: 'CFO',
    company: 'Alpha Acquisition Corp',
    companyId: 'company-9',
    category: 'Executives',
    email: 'victoria.chang@alphaacquisition.com',
    phone: '+1 (212) 555-3010',
    linkedIn: 'https://linkedin.com/in/victoriachang',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['SPAC CFO', 'Trust Account'],
    relationshipScore: 91,
    lastInteraction: '2026-01-27',
    interactions: [],
    notes: [],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'SPAC CFO', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2024-05-10',
  },
  {
    id: 'contact-18',
    firstName: 'Thomas',
    lastName: 'Wright',
    title: 'Board Member',
    company: 'Alpha Acquisition Corp',
    companyId: 'company-9',
    category: 'Board',
    email: 'thomas.wright@alphaacquisition.com',
    phone: '+1 (212) 555-3020',
    linkedIn: 'https://linkedin.com/in/thomaswright',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Board Member', 'Tech Expert'],
    relationshipScore: 75,
    lastInteraction: '2026-01-28',
    interactions: [],
    notes: [
      { id: 'note-12', content: 'Former CTO of Microsoft Azure. Valuable technical perspective.', createdBy: 'Richard Sterling', createdAt: '2025-09-05' },
    ],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2024-08-20',
  },
  // HealthFirst Executives
  {
    id: 'contact-19',
    firstName: 'Dr. Michelle',
    lastName: 'Carter',
    title: 'CEO & Founder',
    company: 'HealthFirst Innovations',
    companyId: 'company-10',
    category: 'Founders',
    email: 'michelle.carter@healthfirstinnovations.com',
    phone: '+1 (617) 555-4000',
    mobile: '+1 (617) 555-4001',
    linkedIn: 'https://linkedin.com/in/drmichellecarter',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    tags: ['Target CEO', 'Healthcare', 'MD Background'],
    relationshipScore: 67,
    lastInteraction: '2026-01-12',
    interactions: [
      { id: 'int-20', type: 'meeting', subject: 'Initial Outreach', description: 'Introductory meeting to discuss growth plans', date: '2026-01-12' },
    ],
    notes: [
      { id: 'note-13', content: 'Michelle is a practicing physician. Company has strong clinical validation.', createdBy: 'James Richardson', createdAt: '2026-01-12' },
    ],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2026-01-10',
  },
  {
    id: 'contact-20',
    firstName: 'Daniel',
    lastName: 'Park',
    title: 'CFO',
    company: 'HealthFirst Innovations',
    companyId: 'company-10',
    category: 'Executives',
    email: 'daniel.park@healthfirstinnovations.com',
    phone: '+1 (617) 555-4010',
    linkedIn: 'https://linkedin.com/in/danielpark',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    tags: ['Healthcare', 'Finance'],
    relationshipScore: 58,
    lastInteraction: '2026-01-12',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2026-01-10',
  },
  // Additional Advisors
  {
    id: 'contact-21',
    firstName: 'Patricia',
    lastName: 'Morgan',
    title: 'Senior Advisor',
    company: 'Independent',
    companyId: '',
    category: 'Advisors',
    email: 'patricia.morgan@advisors.com',
    phone: '+1 (650) 555-5000',
    linkedIn: 'https://linkedin.com/in/patriciamorgan',
    city: 'Palo Alto',
    state: 'CA',
    country: 'USA',
    tags: ['Strategic Advisor', 'Tech', 'Former Executive'],
    relationshipScore: 83,
    lastInteraction: '2026-01-20',
    interactions: [],
    notes: [
      { id: 'note-14', content: 'Former CEO of Salesforce subsidiary. Great strategic perspective on SaaS.', createdBy: 'Alexander Chen', createdAt: '2025-11-15', isPinned: true },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Strategic Advisor', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2025-11-01',
  },
  {
    id: 'contact-22',
    firstName: 'George',
    lastName: 'Adams',
    title: 'Operating Partner',
    company: 'Vista Equity Partners',
    companyId: '',
    category: 'Advisors',
    email: 'george.adams@vistaequity.com',
    phone: '+1 (415) 555-6000',
    linkedIn: 'https://linkedin.com/in/georgeadams',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    tags: ['PE Advisor', 'Operations', 'Value Creation'],
    relationshipScore: 77,
    lastInteraction: '2026-01-15',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-06-20',
  },
  // Additional Bankers
  {
    id: 'contact-23',
    firstName: 'Kevin',
    lastName: 'Murphy',
    title: 'Managing Director',
    company: 'Cantor Fitzgerald',
    companyId: '',
    category: 'Bankers',
    email: 'kevin.murphy@cantor.com',
    phone: '+1 (212) 555-7000',
    linkedIn: 'https://linkedin.com/in/kevinmurphy',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['SPAC Capital Markets', 'Structuring'],
    relationshipScore: 69,
    lastInteraction: '2026-01-08',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-04-15',
  },
  {
    id: 'contact-24',
    firstName: 'Linda',
    lastName: 'Chen',
    title: 'Director, Investment Banking',
    company: 'Citigroup',
    companyId: '',
    category: 'Bankers',
    email: 'linda.chen@citi.com',
    phone: '+1 (212) 555-8000',
    linkedIn: 'https://linkedin.com/in/lindachen',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['SPAC Coverage', 'TMT'],
    relationshipScore: 73,
    lastInteraction: '2026-01-05',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-07-10',
  },
  // Additional Lawyers
  {
    id: 'contact-25',
    firstName: 'Steven',
    lastName: 'Roberts',
    title: 'Partner',
    company: 'Weil, Gotshal & Manges',
    companyId: '',
    category: 'Lawyers',
    email: 'steven.roberts@weil.com',
    phone: '+1 (212) 310-8000',
    linkedIn: 'https://linkedin.com/in/stevenroberts',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['M&A', 'SPAC', 'Cross-border'],
    relationshipScore: 80,
    lastInteraction: '2026-01-10',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-02-28',
  },
  {
    id: 'contact-26',
    firstName: 'Nancy',
    lastName: 'Wilson',
    title: 'Partner',
    company: 'Simpson Thacher',
    companyId: '',
    category: 'Lawyers',
    email: 'nancy.wilson@stblaw.com',
    phone: '+1 (212) 455-2000',
    linkedIn: 'https://linkedin.com/in/nancywilson',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Capital Markets', 'IPO'],
    relationshipScore: 71,
    lastInteraction: '2025-12-20',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-08-05',
  },
  // Additional Investors
  {
    id: 'contact-27',
    firstName: 'Andrew',
    lastName: 'Kim',
    title: 'Partner',
    company: 'Tiger Global',
    companyId: '',
    category: 'Investors',
    email: 'andrew.kim@tigerglobal.com',
    phone: '+1 (212) 555-9000',
    linkedIn: 'https://linkedin.com/in/andrewkim',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Growth Investor', 'PIPE', 'Tech Focus'],
    relationshipScore: 84,
    lastInteraction: '2026-01-22',
    interactions: [
      { id: 'int-21', type: 'call', subject: 'NovaTech Interest', description: 'Expressed strong interest in PIPE participation', date: '2026-01-22' },
    ],
    notes: [
      { id: 'note-15', content: 'Tiger has $1B+ allocated for SPAC transactions. Andrew leads the effort.', createdBy: 'William Patterson', createdAt: '2025-11-10' },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Potential PIPE Investor', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2025-09-15',
  },
  {
    id: 'contact-28',
    firstName: 'Samantha',
    lastName: 'Lee',
    title: 'Principal',
    company: 'Wellington Management',
    companyId: '',
    category: 'Investors',
    email: 'samantha.lee@wellington.com',
    phone: '+1 (617) 555-1100',
    linkedIn: 'https://linkedin.com/in/samanthalee',
    city: 'Boston',
    state: 'MA',
    country: 'USA',
    tags: ['Long-only', 'Public Markets'],
    relationshipScore: 62,
    lastInteraction: '2026-01-18',
    interactions: [],
    notes: [],
    linkedDeals: [],
    documents: [],
    meetings: [],
    createdAt: '2025-10-20',
  },
  // Accountants
  {
    id: 'contact-29',
    firstName: 'Mark',
    lastName: 'Johnson',
    title: 'Partner, Audit',
    company: 'Deloitte',
    companyId: '',
    category: 'Accountants',
    email: 'mark.johnson@deloitte.com',
    phone: '+1 (212) 492-4000',
    linkedIn: 'https://linkedin.com/in/markjohnson',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Audit', 'PCAOB', 'SPAC Experience'],
    relationshipScore: 76,
    lastInteraction: '2026-01-20',
    interactions: [
      { id: 'int-22', type: 'meeting', subject: 'Audit Planning', description: 'Discussed PCAOB audit requirements for de-SPAC', date: '2026-01-20' },
    ],
    notes: [],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'SPAC Auditor', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2024-10-05',
  },
  {
    id: 'contact-30',
    firstName: 'Elizabeth',
    lastName: 'Taylor',
    title: 'Partner, Transaction Advisory',
    company: 'EY',
    companyId: '',
    category: 'Accountants',
    email: 'elizabeth.taylor@ey.com',
    phone: '+1 (212) 773-3000',
    linkedIn: 'https://linkedin.com/in/elizabethtaylor',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    tags: ['Due Diligence', 'Quality of Earnings'],
    relationshipScore: 81,
    lastInteraction: '2026-01-24',
    interactions: [
      { id: 'int-23', type: 'email', subject: 'QoE Report', description: 'Received draft quality of earnings report for NovaTech', date: '2026-01-24' },
    ],
    notes: [
      { id: 'note-16', content: 'Elizabeth is excellent for complex tech company due diligence.', createdBy: 'Priya Sharma', createdAt: '2026-01-25' },
    ],
    linkedDeals: [
      { id: 'deal-1', name: 'NovaTech Acquisition', role: 'Due Diligence Provider', status: 'Active' },
    ],
    documents: [],
    meetings: [],
    createdAt: '2025-03-15',
  },
];

// Helper functions
export function getContactById(id: string): ExtendedContact | undefined {
  return mockContacts.find(c => c.id === id);
}

export function getCompanyById(id: string): Company | undefined {
  return mockCompanies.find(c => c.id === id);
}

export function getContactsByCompany(companyId: string): ExtendedContact[] {
  return mockContacts.filter(c => c.companyId === companyId);
}

export function getContactsByCategory(category: ContactCategory): ExtendedContact[] {
  return mockContacts.filter(c => c.category === category);
}

export function searchContacts(query: string): ExtendedContact[] {
  const lowerQuery = query.toLowerCase();
  return mockContacts.filter(c =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(lowerQuery) ||
    c.company.toLowerCase().includes(lowerQuery) ||
    c.email.toLowerCase().includes(lowerQuery) ||
    c.tags.some(t => t.toLowerCase().includes(lowerQuery))
  );
}

export const contactCategories: ContactCategory[] = [
  'Founders',
  'Executives',
  'Advisors',
  'Bankers',
  'Lawyers',
  'Investors',
  'Accountants',
  'Board',
];
