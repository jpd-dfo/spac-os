// ============================================================================
// SEC Compliance Rules and Definitions
// ============================================================================

import type { FilingType } from '@/types';

// ============================================================================
// FILING TYPES AND DEFINITIONS
// ============================================================================

export type FilingCategory =
  | 'PERIODIC'      // Regular periodic filings (10-K, 10-Q)
  | 'CURRENT'       // Current reports (8-K, Super 8-K)
  | 'REGISTRATION'  // Registration statements (S-1, S-4)
  | 'PROXY'         // Proxy statements (DEF14A, PREM14A)
  | 'BENEFICIAL'    // Beneficial ownership (13D, 13G)
  | 'INSIDER'       // Insider trading (Forms 3, 4, 5)
  | 'OTHER';

export interface FilingDefinition {
  type: FilingType;
  name: string;
  shortName: string;
  category: FilingCategory;
  description: string;
  deadlineType: 'FIXED' | 'EVENT_BASED' | 'PERIODIC';
  deadlineDays?: number;
  deadlineBusinessDays?: boolean;
  acceleratedFilerDays?: number;
  largeAcceleratedFilerDays?: number;
  nonAcceleratedFilerDays?: number;
  periodicDeadline?: string;
  requiredForSPAC: boolean;
  requiredForDeSPAC: boolean;
  triggers?: string[];
  checklist?: string[];
  secGuidance?: string;
}

export const FILING_DEFINITIONS: Record<FilingType, FilingDefinition> = {
  FORM_10K: {
    type: 'FORM_10K',
    name: 'Annual Report',
    shortName: '10-K',
    category: 'PERIODIC',
    description: 'Annual report providing comprehensive overview of business and financial condition',
    deadlineType: 'PERIODIC',
    deadlineDays: 60, // Large accelerated filers
    acceleratedFilerDays: 60,
    largeAcceleratedFilerDays: 60,
    nonAcceleratedFilerDays: 90,
    periodicDeadline: 'Within 60/75/90 days after fiscal year end',
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Fiscal year end'],
    checklist: [
      'Financial statements audited by independent CPA',
      'Management Discussion & Analysis (MD&A)',
      'Executive compensation disclosure',
      'Risk factors updated',
      'Certifications (SOX 302, 906)',
      'Internal control assessment (SOX 404)',
    ],
  },
  FORM_10Q: {
    type: 'FORM_10Q',
    name: 'Quarterly Report',
    shortName: '10-Q',
    category: 'PERIODIC',
    description: 'Quarterly report on financial condition and results of operations',
    deadlineType: 'PERIODIC',
    deadlineDays: 40, // Large accelerated filers
    acceleratedFilerDays: 40,
    largeAcceleratedFilerDays: 40,
    nonAcceleratedFilerDays: 45,
    periodicDeadline: 'Within 40/45 days after quarter end',
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Quarter end (Q1, Q2, Q3)'],
    checklist: [
      'Unaudited financial statements',
      'Management Discussion & Analysis (MD&A)',
      'Certifications (SOX 302, 906)',
      'Update on legal proceedings',
      'Risk factor updates (if material)',
    ],
  },
  FORM_8K: {
    type: 'FORM_8K',
    name: 'Current Report',
    shortName: '8-K',
    category: 'CURRENT',
    description: 'Report of unscheduled material events or corporate changes',
    deadlineType: 'EVENT_BASED',
    deadlineDays: 4,
    deadlineBusinessDays: true,
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: [
      'Entry into material definitive agreement',
      'Completion of acquisition/disposition',
      'Results of operations and financial condition',
      'Creation of direct financial obligation',
      'Events triggering acceleration of obligation',
      'Changes in control',
      'Departure of directors/officers',
      'Amendments to articles/bylaws',
      'Changes in fiscal year',
      'Regulation FD disclosure',
      'Delisting or transfer of listing',
    ],
    checklist: [
      'Identify triggering event and applicable Item',
      'Prepare required exhibits',
      'Legal review of disclosure',
      'Officer certification',
      'File within 4 business days',
    ],
  },
  SUPER_8K: {
    type: 'SUPER_8K',
    name: 'Super 8-K (De-SPAC)',
    shortName: 'Super 8-K',
    category: 'CURRENT',
    description: 'Enhanced 8-K filed upon completion of de-SPAC transaction with expanded disclosure',
    deadlineType: 'EVENT_BASED',
    deadlineDays: 4,
    deadlineBusinessDays: true,
    requiredForSPAC: false,
    requiredForDeSPAC: true,
    triggers: ['Completion of de-SPAC transaction'],
    checklist: [
      'Business description of combined company',
      'Risk factors',
      'Financial information (target company)',
      'Management Discussion & Analysis',
      'Directors and executive officers',
      'Executive compensation',
      'Related party transactions',
      'Principal stockholders',
      'Description of securities',
      'Audited financial statements of acquired company',
      'Pro forma financial information',
      'Exhibits (material agreements)',
    ],
    secGuidance: 'Must be filed within 4 business days of transaction closing. Includes shell company disclosure requirements.',
  },
  S1: {
    type: 'S1',
    name: 'Registration Statement',
    shortName: 'S-1',
    category: 'REGISTRATION',
    description: 'Registration statement for initial public offering',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: true,
    requiredForDeSPAC: false,
    triggers: ['Prior to IPO'],
    checklist: [
      'Prospectus with complete business description',
      'Use of proceeds',
      'Risk factors',
      'Management Discussion & Analysis',
      'Business description',
      'Management and compensation',
      'Related party transactions',
      'Principal stockholders',
      'Audited financial statements',
      'Underwriting agreement',
      'Legal opinion on securities',
      'Consent of independent accountants',
    ],
  },
  S4: {
    type: 'S4',
    name: 'Registration Statement (Business Combination)',
    shortName: 'S-4',
    category: 'REGISTRATION',
    description: 'Registration statement for securities issued in business combination',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: false,
    requiredForDeSPAC: true,
    triggers: ['Business combination requiring shareholder vote'],
    checklist: [
      'Summary of transaction',
      'Risk factors (SPAC and target)',
      'Comparative per share data',
      'Market price data',
      'Target company business description',
      'Target company MD&A',
      'Target company audited financials',
      'SPAC audited financials',
      'Pro forma financial statements',
      'Material agreements',
      'Fairness opinion',
      'Background of transaction',
      'Reasons for transaction',
      'Interests of SPAC insiders',
    ],
  },
  DEF14A: {
    type: 'DEF14A',
    name: 'Definitive Proxy Statement',
    shortName: 'DEF14A',
    category: 'PROXY',
    description: 'Definitive proxy statement for shareholder meeting',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Shareholder meeting/vote required'],
    checklist: [
      'Meeting information and agenda',
      'Voting procedures and record date',
      'Proposal descriptions',
      'Board recommendations',
      'Director information and compensation',
      'Executive compensation tables',
      'Related party transactions',
      'Security ownership table',
      'Audit committee report',
      'Independent auditor fees',
    ],
  },
  PREM14A: {
    type: 'PREM14A',
    name: 'Preliminary Proxy Statement',
    shortName: 'PREM14A',
    category: 'PROXY',
    description: 'Preliminary proxy statement filed for SEC review before distribution',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: false,
    requiredForDeSPAC: true,
    triggers: ['Prior to definitive proxy for business combination'],
    checklist: [
      'All DEF14A content in draft form',
      'Placeholder for meeting date',
      'SEC staff review period',
    ],
  },
  DEFA14A: {
    type: 'DEFA14A',
    name: 'Additional Proxy Soliciting Materials',
    shortName: 'DEFA14A',
    category: 'PROXY',
    description: 'Additional definitive proxy soliciting materials',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: false,
    requiredForDeSPAC: true,
    triggers: ['Distribution of additional soliciting materials'],
    checklist: [
      'Supplemental disclosure',
      'Press releases related to proxy',
      'Investor presentations',
      'Filed no later than date of first use',
    ],
  },
  FORM_425: {
    type: 'FORM_425',
    name: 'Prospectus Communications',
    shortName: '425',
    category: 'OTHER',
    description: 'Written communications under Rule 425 related to business combination',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: false,
    requiredForDeSPAC: true,
    triggers: ['Any written communication relating to business combination'],
    checklist: [
      'Filed no later than date of first use',
      'Include required legend',
      'Reference to registration statement',
    ],
  },
  SC_13D: {
    type: 'SC_13D',
    name: 'Schedule 13D',
    shortName: '13D',
    category: 'BENEFICIAL',
    description: 'Beneficial ownership report for holders of more than 5% with activist intent',
    deadlineType: 'EVENT_BASED',
    deadlineDays: 10,
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Acquisition of more than 5% beneficial ownership with intent to influence'],
    checklist: [
      'Identify reporting person',
      'Source of funds',
      'Purpose of transaction',
      'Interest in securities',
      'Contracts/arrangements with respect to securities',
    ],
  },
  SC_13G: {
    type: 'SC_13G',
    name: 'Schedule 13G',
    shortName: '13G',
    category: 'BENEFICIAL',
    description: 'Beneficial ownership report for passive investors owning more than 5%',
    deadlineType: 'EVENT_BASED',
    deadlineDays: 45,
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Passive acquisition of more than 5% beneficial ownership'],
    checklist: [
      'Confirm passive investor status',
      'Identity of reporting person',
      'Securities beneficially owned',
      'Certify no control intent',
    ],
  },
  FORM_3: {
    type: 'FORM_3',
    name: 'Initial Statement of Beneficial Ownership',
    shortName: 'Form 3',
    category: 'INSIDER',
    description: 'Initial statement of beneficial ownership for insiders',
    deadlineType: 'EVENT_BASED',
    deadlineDays: 10,
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Becoming an officer, director, or 10% beneficial owner'],
    checklist: [
      'Securities directly owned',
      'Securities indirectly owned',
      'Nature of indirect ownership',
    ],
  },
  FORM_4: {
    type: 'FORM_4',
    name: 'Statement of Changes in Beneficial Ownership',
    shortName: 'Form 4',
    category: 'INSIDER',
    description: 'Report changes in beneficial ownership of securities',
    deadlineType: 'EVENT_BASED',
    deadlineDays: 2,
    deadlineBusinessDays: true,
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Change in beneficial ownership by insider'],
    checklist: [
      'Transaction date',
      'Transaction code',
      'Securities acquired/disposed',
      'Price per share',
      'Amount of securities owned after transaction',
    ],
  },
  FORM_5: {
    type: 'FORM_5',
    name: 'Annual Statement of Changes in Beneficial Ownership',
    shortName: 'Form 5',
    category: 'INSIDER',
    description: 'Annual report of insider transactions not previously reported',
    deadlineType: 'PERIODIC',
    deadlineDays: 45,
    periodicDeadline: 'Within 45 days after fiscal year end',
    requiredForSPAC: true,
    requiredForDeSPAC: true,
    triggers: ['Fiscal year end (if unreported transactions exist)'],
    checklist: [
      'All transactions not reported on Form 4',
      'Exempt transactions',
      'Small acquisitions',
    ],
  },
  OTHER: {
    type: 'OTHER',
    name: 'Other Filing',
    shortName: 'Other',
    category: 'OTHER',
    description: 'Other SEC filing type',
    deadlineType: 'EVENT_BASED',
    requiredForSPAC: false,
    requiredForDeSPAC: false,
    checklist: [],
  },
};

// ============================================================================
// FILER STATUS DEFINITIONS
// ============================================================================

export type FilerStatus =
  | 'LARGE_ACCELERATED'  // Float >= $700M
  | 'ACCELERATED'        // Float >= $75M but < $700M
  | 'NON_ACCELERATED'    // Float < $75M
  | 'SMALLER_REPORTING'  // Float < $250M or revenues < $100M
  | 'EMERGING_GROWTH';   // IPO within 5 years, revenues < $1.235B

export interface FilerStatusDefinition {
  status: FilerStatus;
  name: string;
  description: string;
  floatThreshold?: { min?: number; max?: number };
  revenueThreshold?: { min?: number; max?: number };
  tenKDeadlineDays: number;
  tenQDeadlineDays: number;
  benefits: string[];
}

export const FILER_STATUS_DEFINITIONS: Record<FilerStatus, FilerStatusDefinition> = {
  LARGE_ACCELERATED: {
    status: 'LARGE_ACCELERATED',
    name: 'Large Accelerated Filer',
    description: 'Public float of $700 million or more',
    floatThreshold: { min: 700_000_000 },
    tenKDeadlineDays: 60,
    tenQDeadlineDays: 40,
    benefits: [],
  },
  ACCELERATED: {
    status: 'ACCELERATED',
    name: 'Accelerated Filer',
    description: 'Public float of $75 million to $700 million',
    floatThreshold: { min: 75_000_000, max: 700_000_000 },
    tenKDeadlineDays: 75,
    tenQDeadlineDays: 40,
    benefits: [],
  },
  NON_ACCELERATED: {
    status: 'NON_ACCELERATED',
    name: 'Non-Accelerated Filer',
    description: 'Public float less than $75 million',
    floatThreshold: { max: 75_000_000 },
    tenKDeadlineDays: 90,
    tenQDeadlineDays: 45,
    benefits: ['Extended filing deadlines'],
  },
  SMALLER_REPORTING: {
    status: 'SMALLER_REPORTING',
    name: 'Smaller Reporting Company',
    description: 'Public float less than $250 million or revenues less than $100 million',
    floatThreshold: { max: 250_000_000 },
    revenueThreshold: { max: 100_000_000 },
    tenKDeadlineDays: 90,
    tenQDeadlineDays: 45,
    benefits: [
      'Scaled disclosure requirements',
      'Two years of audited financials (vs three)',
      'Simplified executive compensation disclosure',
      'No CD&A required',
    ],
  },
  EMERGING_GROWTH: {
    status: 'EMERGING_GROWTH',
    name: 'Emerging Growth Company',
    description: 'IPO within 5 years with revenues less than $1.235 billion',
    revenueThreshold: { max: 1_235_000_000 },
    tenKDeadlineDays: 90,
    tenQDeadlineDays: 45,
    benefits: [
      'Two years of audited financials',
      'Reduced executive compensation disclosure',
      'No auditor attestation on internal controls',
      'Extended transition period for new accounting standards',
      'Confidential SEC submission of draft registration statements',
    ],
  },
};

// ============================================================================
// COMPLIANCE CHECKLIST TEMPLATES
// ============================================================================

export type ChecklistItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'NOT_APPLICABLE';

export interface ChecklistItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  required: boolean;
  order: number;
  dependencies?: string[];
  responsibleParty?: string;
}

export interface ChecklistTemplate {
  filingType: FilingType;
  name: string;
  items: ChecklistItem[];
}

export const TEN_K_CHECKLIST: ChecklistTemplate = {
  filingType: 'FORM_10K',
  name: 'Form 10-K Compliance Checklist',
  items: [
    { id: 'draft_start', name: 'Initiate 10-K Drafting', category: 'Preparation', required: true, order: 1 },
    { id: 'financial_close', name: 'Complete Financial Close', category: 'Financial', required: true, order: 2 },
    { id: 'audit_start', name: 'Begin Annual Audit', category: 'Audit', required: true, order: 3 },
    { id: 'mda_draft', name: 'Draft MD&A Section', category: 'Disclosure', required: true, order: 4, responsibleParty: 'CFO' },
    { id: 'risk_factors', name: 'Update Risk Factors', category: 'Disclosure', required: true, order: 5, responsibleParty: 'Legal' },
    { id: 'business_section', name: 'Update Business Description', category: 'Disclosure', required: true, order: 6 },
    { id: 'legal_proceedings', name: 'Update Legal Proceedings', category: 'Disclosure', required: true, order: 7, responsibleParty: 'Legal' },
    { id: 'exec_comp', name: 'Prepare Executive Compensation Tables', category: 'Compensation', required: true, order: 8, responsibleParty: 'HR/Legal' },
    { id: 'related_party', name: 'Review Related Party Transactions', category: 'Disclosure', required: true, order: 9, responsibleParty: 'Legal' },
    { id: 'audit_complete', name: 'Complete Audit Fieldwork', category: 'Audit', required: true, order: 10, dependencies: ['audit_start'] },
    { id: 'audit_opinion', name: 'Obtain Audit Opinion', category: 'Audit', required: true, order: 11, dependencies: ['audit_complete'] },
    { id: 'sox_404', name: 'Complete SOX 404 Assessment', category: 'Controls', required: true, order: 12 },
    { id: 'internal_review', name: 'Complete Internal Review', category: 'Review', required: true, order: 13, dependencies: ['mda_draft', 'risk_factors'] },
    { id: 'disclosure_committee', name: 'Disclosure Committee Review', category: 'Review', required: true, order: 14, dependencies: ['internal_review'] },
    { id: 'audit_committee', name: 'Audit Committee Approval', category: 'Approval', required: true, order: 15, dependencies: ['audit_opinion', 'disclosure_committee'] },
    { id: 'board_approval', name: 'Board Approval', category: 'Approval', required: true, order: 16, dependencies: ['audit_committee'] },
    { id: 'ceo_cert', name: 'CEO Certification (SOX 302)', category: 'Certification', required: true, order: 17, dependencies: ['board_approval'] },
    { id: 'cfo_cert', name: 'CFO Certification (SOX 302)', category: 'Certification', required: true, order: 18, dependencies: ['board_approval'] },
    { id: 'sox_906', name: 'SOX 906 Certification', category: 'Certification', required: true, order: 19, dependencies: ['board_approval'] },
    { id: 'edgar_filing', name: 'File with SEC via EDGAR', category: 'Filing', required: true, order: 20, dependencies: ['ceo_cert', 'cfo_cert', 'sox_906'] },
  ],
};

export const TEN_Q_CHECKLIST: ChecklistTemplate = {
  filingType: 'FORM_10Q',
  name: 'Form 10-Q Compliance Checklist',
  items: [
    { id: 'draft_start', name: 'Initiate 10-Q Drafting', category: 'Preparation', required: true, order: 1 },
    { id: 'financial_close', name: 'Complete Quarter-End Close', category: 'Financial', required: true, order: 2 },
    { id: 'review_start', name: 'Begin Quarterly Review', category: 'Review', required: true, order: 3 },
    { id: 'mda_draft', name: 'Draft MD&A Section', category: 'Disclosure', required: true, order: 4, responsibleParty: 'CFO' },
    { id: 'risk_factors', name: 'Review Risk Factors for Updates', category: 'Disclosure', required: true, order: 5, responsibleParty: 'Legal' },
    { id: 'legal_proceedings', name: 'Update Legal Proceedings', category: 'Disclosure', required: true, order: 6, responsibleParty: 'Legal' },
    { id: 'review_complete', name: 'Complete Quarterly Review', category: 'Review', required: true, order: 7, dependencies: ['review_start'] },
    { id: 'internal_review', name: 'Complete Internal Review', category: 'Review', required: true, order: 8, dependencies: ['mda_draft'] },
    { id: 'disclosure_committee', name: 'Disclosure Committee Review', category: 'Review', required: true, order: 9, dependencies: ['internal_review'] },
    { id: 'audit_committee', name: 'Audit Committee Review', category: 'Approval', required: true, order: 10, dependencies: ['review_complete', 'disclosure_committee'] },
    { id: 'ceo_cert', name: 'CEO Certification (SOX 302)', category: 'Certification', required: true, order: 11, dependencies: ['audit_committee'] },
    { id: 'cfo_cert', name: 'CFO Certification (SOX 302)', category: 'Certification', required: true, order: 12, dependencies: ['audit_committee'] },
    { id: 'sox_906', name: 'SOX 906 Certification', category: 'Certification', required: true, order: 13, dependencies: ['audit_committee'] },
    { id: 'edgar_filing', name: 'File with SEC via EDGAR', category: 'Filing', required: true, order: 14, dependencies: ['ceo_cert', 'cfo_cert', 'sox_906'] },
  ],
};

export const EIGHT_K_CHECKLIST: ChecklistTemplate = {
  filingType: 'FORM_8K',
  name: 'Form 8-K Compliance Checklist',
  items: [
    { id: 'event_identify', name: 'Identify Triggering Event', category: 'Preparation', required: true, order: 1 },
    { id: 'item_determine', name: 'Determine Applicable Item(s)', category: 'Preparation', required: true, order: 2 },
    { id: 'draft_disclosure', name: 'Draft 8-K Disclosure', category: 'Drafting', required: true, order: 3, responsibleParty: 'Legal' },
    { id: 'exhibits_prepare', name: 'Prepare Required Exhibits', category: 'Exhibits', required: true, order: 4 },
    { id: 'legal_review', name: 'Legal Review', category: 'Review', required: true, order: 5, dependencies: ['draft_disclosure'] },
    { id: 'officer_review', name: 'Officer Review and Approval', category: 'Approval', required: true, order: 6, dependencies: ['legal_review'] },
    { id: 'edgar_filing', name: 'File with SEC via EDGAR', category: 'Filing', required: true, order: 7, dependencies: ['officer_review', 'exhibits_prepare'] },
    { id: 'press_release', name: 'Issue Press Release (if required)', category: 'Communication', required: false, order: 8 },
  ],
};

export const SUPER_8K_CHECKLIST: ChecklistTemplate = {
  filingType: 'SUPER_8K',
  name: 'Super 8-K (De-SPAC) Compliance Checklist',
  items: [
    { id: 'closing_confirm', name: 'Confirm Transaction Closing', category: 'Preparation', required: true, order: 1 },
    { id: 'business_desc', name: 'Draft Combined Company Business Description', category: 'Disclosure', required: true, order: 2 },
    { id: 'risk_factors', name: 'Update Risk Factors', category: 'Disclosure', required: true, order: 3 },
    { id: 'target_financials', name: 'Finalize Target Company Financial Statements', category: 'Financial', required: true, order: 4 },
    { id: 'pro_forma', name: 'Prepare Pro Forma Financial Information', category: 'Financial', required: true, order: 5 },
    { id: 'mda_target', name: 'Prepare Target Company MD&A', category: 'Disclosure', required: true, order: 6 },
    { id: 'mgmt_directors', name: 'Directors and Officers Disclosure', category: 'Disclosure', required: true, order: 7 },
    { id: 'exec_comp', name: 'Executive Compensation Disclosure', category: 'Disclosure', required: true, order: 8 },
    { id: 'related_party', name: 'Related Party Transactions', category: 'Disclosure', required: true, order: 9 },
    { id: 'stockholders', name: 'Principal Stockholders Table', category: 'Disclosure', required: true, order: 10 },
    { id: 'securities_desc', name: 'Description of Securities', category: 'Disclosure', required: true, order: 11 },
    { id: 'exhibits', name: 'Prepare All Required Exhibits', category: 'Exhibits', required: true, order: 12 },
    { id: 'shell_company', name: 'Shell Company Status Disclosure', category: 'Disclosure', required: true, order: 13 },
    { id: 'legal_review', name: 'Legal Review', category: 'Review', required: true, order: 14 },
    { id: 'audit_review', name: 'Auditor Review of Financials', category: 'Review', required: true, order: 15 },
    { id: 'officer_approval', name: 'Officer Review and Approval', category: 'Approval', required: true, order: 16 },
    { id: 'edgar_filing', name: 'File with SEC via EDGAR', category: 'Filing', required: true, order: 17, dependencies: ['legal_review', 'audit_review', 'officer_approval'] },
    { id: 'press_release', name: 'Issue Closing Press Release', category: 'Communication', required: true, order: 18 },
  ],
};

export const S4_CHECKLIST: ChecklistTemplate = {
  filingType: 'S4',
  name: 'S-4 Registration Statement Checklist',
  items: [
    { id: 'da_signed', name: 'Definitive Agreement Signed', category: 'Prerequisite', required: true, order: 1 },
    { id: 'structure_finalize', name: 'Finalize Transaction Structure', category: 'Structure', required: true, order: 2 },
    { id: 'summary_draft', name: 'Draft Transaction Summary', category: 'Disclosure', required: true, order: 3 },
    { id: 'risk_factors', name: 'Draft Risk Factors', category: 'Disclosure', required: true, order: 4 },
    { id: 'background', name: 'Draft Background of Transaction', category: 'Disclosure', required: true, order: 5 },
    { id: 'reasons', name: 'Draft Reasons for Transaction', category: 'Disclosure', required: true, order: 6 },
    { id: 'fairness_opinion', name: 'Obtain Fairness Opinion', category: 'Financial', required: true, order: 7 },
    { id: 'target_business', name: 'Prepare Target Business Description', category: 'Disclosure', required: true, order: 8 },
    { id: 'target_mda', name: 'Prepare Target MD&A', category: 'Disclosure', required: true, order: 9 },
    { id: 'target_financials', name: 'Prepare Target Audited Financials', category: 'Financial', required: true, order: 10 },
    { id: 'spac_financials', name: 'Prepare SPAC Audited Financials', category: 'Financial', required: true, order: 11 },
    { id: 'pro_forma', name: 'Prepare Pro Forma Financials', category: 'Financial', required: true, order: 12 },
    { id: 'comparative_data', name: 'Prepare Comparative Per Share Data', category: 'Financial', required: true, order: 13 },
    { id: 'insider_interests', name: 'Disclose SPAC Insider Interests', category: 'Disclosure', required: true, order: 14 },
    { id: 'legal_review', name: 'Legal Review', category: 'Review', required: true, order: 15 },
    { id: 'board_approval', name: 'Board Approval', category: 'Approval', required: true, order: 16 },
    { id: 'initial_filing', name: 'Initial S-4 Filing', category: 'Filing', required: true, order: 17 },
    { id: 'sec_comments', name: 'Respond to SEC Comments', category: 'SEC Review', required: true, order: 18 },
    { id: 'effectiveness', name: 'S-4 Declared Effective', category: 'Filing', required: true, order: 19 },
  ],
};

export const PROXY_CHECKLIST: ChecklistTemplate = {
  filingType: 'DEF14A',
  name: 'Proxy Statement Compliance Checklist',
  items: [
    { id: 'record_date', name: 'Set Record Date', category: 'Preparation', required: true, order: 1 },
    { id: 'meeting_date', name: 'Set Meeting Date', category: 'Preparation', required: true, order: 2 },
    { id: 'agenda_finalize', name: 'Finalize Meeting Agenda', category: 'Preparation', required: true, order: 3 },
    { id: 'proposals_draft', name: 'Draft Proposal Descriptions', category: 'Disclosure', required: true, order: 4 },
    { id: 'director_info', name: 'Prepare Director Information', category: 'Disclosure', required: true, order: 5 },
    { id: 'exec_comp', name: 'Prepare Executive Compensation Tables', category: 'Disclosure', required: true, order: 6 },
    { id: 'cd_a', name: 'Draft CD&A (if required)', category: 'Disclosure', required: false, order: 7 },
    { id: 'related_party', name: 'Prepare Related Party Disclosures', category: 'Disclosure', required: true, order: 8 },
    { id: 'ownership_table', name: 'Prepare Security Ownership Table', category: 'Disclosure', required: true, order: 9 },
    { id: 'audit_fees', name: 'Prepare Auditor Fee Disclosure', category: 'Disclosure', required: true, order: 10 },
    { id: 'legal_review', name: 'Legal Review', category: 'Review', required: true, order: 11 },
    { id: 'board_approval', name: 'Board Approval', category: 'Approval', required: true, order: 12 },
    { id: 'prem14a_filing', name: 'File Preliminary Proxy (PREM14A)', category: 'Filing', required: true, order: 13 },
    { id: 'sec_review', name: 'Address SEC Comments (if any)', category: 'SEC Review', required: true, order: 14 },
    { id: 'def14a_filing', name: 'File Definitive Proxy (DEF14A)', category: 'Filing', required: true, order: 15 },
    { id: 'mailing', name: 'Mail Proxy Materials', category: 'Distribution', required: true, order: 16 },
  ],
};

export const CHECKLIST_TEMPLATES: Record<string, ChecklistTemplate> = {
  FORM_10K: TEN_K_CHECKLIST,
  FORM_10Q: TEN_Q_CHECKLIST,
  FORM_8K: EIGHT_K_CHECKLIST,
  SUPER_8K: SUPER_8K_CHECKLIST,
  S4: S4_CHECKLIST,
  DEF14A: PROXY_CHECKLIST,
};

// ============================================================================
// BLACKOUT PERIOD RULES
// ============================================================================

export interface BlackoutPeriod {
  id: string;
  name: string;
  type: 'QUARTERLY_EARNINGS' | 'ANNUAL_EARNINGS' | 'MATERIAL_EVENT' | 'CUSTOM';
  startRule: string;
  endRule: string;
  defaultDurationDays: number;
  affectedParties: ('DIRECTORS' | 'OFFICERS' | 'EMPLOYEES' | 'TEN_PERCENT_HOLDERS')[];
  description: string;
}

export const STANDARD_BLACKOUT_PERIODS: BlackoutPeriod[] = [
  {
    id: 'quarterly_close',
    name: 'Quarterly Close Blackout',
    type: 'QUARTERLY_EARNINGS',
    startRule: '2 weeks before quarter end',
    endRule: '2 business days after earnings release',
    defaultDurationDays: 30,
    affectedParties: ['DIRECTORS', 'OFFICERS'],
    description: 'Standard blackout period around quarterly earnings',
  },
  {
    id: 'annual_close',
    name: 'Annual Close Blackout',
    type: 'ANNUAL_EARNINGS',
    startRule: '2 weeks before fiscal year end',
    endRule: '2 business days after 10-K filing',
    defaultDurationDays: 45,
    affectedParties: ['DIRECTORS', 'OFFICERS'],
    description: 'Extended blackout period around annual earnings',
  },
  {
    id: 'material_event',
    name: 'Material Event Blackout',
    type: 'MATERIAL_EVENT',
    startRule: 'Upon awareness of material non-public information',
    endRule: '2 business days after public disclosure',
    defaultDurationDays: 0,
    affectedParties: ['DIRECTORS', 'OFFICERS', 'EMPLOYEES'],
    description: 'Blackout triggered by material non-public information',
  },
];

// ============================================================================
// SEC COMMENT LETTER TYPES
// ============================================================================

export type CommentLetterStatus =
  | 'RECEIVED'
  | 'UNDER_REVIEW'
  | 'RESPONSE_DRAFTED'
  | 'RESPONSE_FILED'
  | 'RESOLVED'
  | 'ONGOING';

export interface CommentLetterType {
  code: string;
  name: string;
  description: string;
  typicalResponseDays: number;
  category: 'ACCOUNTING' | 'LEGAL' | 'BUSINESS' | 'DISCLOSURE' | 'PROCEDURAL';
}

export const COMMENT_LETTER_TYPES: CommentLetterType[] = [
  { code: 'ACC', name: 'Accounting', description: 'Questions about accounting treatment or GAAP compliance', typicalResponseDays: 10, category: 'ACCOUNTING' },
  { code: 'FIN', name: 'Financial Statements', description: 'Questions about financial statement presentation', typicalResponseDays: 10, category: 'ACCOUNTING' },
  { code: 'MDA', name: 'MD&A', description: 'Questions about management discussion and analysis', typicalResponseDays: 10, category: 'DISCLOSURE' },
  { code: 'RSK', name: 'Risk Factors', description: 'Questions about risk factor disclosure', typicalResponseDays: 10, category: 'DISCLOSURE' },
  { code: 'LEG', name: 'Legal', description: 'Questions about legal proceedings or legal disclosure', typicalResponseDays: 10, category: 'LEGAL' },
  { code: 'BUS', name: 'Business', description: 'Questions about business description', typicalResponseDays: 10, category: 'BUSINESS' },
  { code: 'GOV', name: 'Corporate Governance', description: 'Questions about corporate governance disclosure', typicalResponseDays: 10, category: 'DISCLOSURE' },
  { code: 'COM', name: 'Compensation', description: 'Questions about executive compensation disclosure', typicalResponseDays: 10, category: 'DISCLOSURE' },
  { code: 'PRO', name: 'Procedural', description: 'Procedural or administrative matters', typicalResponseDays: 5, category: 'PROCEDURAL' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getFilingDefinition(type: FilingType): FilingDefinition {
  return FILING_DEFINITIONS[type];
}

export function getFilerDeadline(
  filingType: FilingType,
  filerStatus: FilerStatus
): number | undefined {
  const filing = FILING_DEFINITIONS[filingType];
  const status = FILER_STATUS_DEFINITIONS[filerStatus];

  if (filingType === 'FORM_10K') {
    return status.tenKDeadlineDays;
  }
  if (filingType === 'FORM_10Q') {
    return status.tenQDeadlineDays;
  }

  return filing.deadlineDays;
}

export function getChecklistTemplate(filingType: FilingType): ChecklistTemplate | undefined {
  return CHECKLIST_TEMPLATES[filingType];
}

export function isFilingRequiredForSPAC(filingType: FilingType): boolean {
  return FILING_DEFINITIONS[filingType]?.requiredForSPAC ?? false;
}

export function isFilingRequiredForDeSPAC(filingType: FilingType): boolean {
  return FILING_DEFINITIONS[filingType]?.requiredForDeSPAC ?? false;
}
