// ============================================================================
// SPAC OS Constants
// ============================================================================

// Application
export const APP_NAME = 'SPAC OS';
export const APP_DESCRIPTION = 'SPAC Deal Management Platform';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Status Labels
export const SPAC_STATUS_LABELS: Record<string, string> = {
  PRE_IPO: 'Pre-IPO',
  SEARCHING: 'Searching',
  LOI_SIGNED: 'LOI Signed',
  DA_ANNOUNCED: 'DA Announced',
  PROXY_FILED: 'Proxy Filed',
  VOTE_SCHEDULED: 'Vote Scheduled',
  CLOSING: 'Closing',
  COMPLETED: 'Completed',
  LIQUIDATED: 'Liquidated',
};

export const SPAC_PHASE_LABELS: Record<string, string> = {
  FORMATION: 'Formation',
  IPO: 'IPO',
  TARGET_SEARCH: 'Target Search',
  DUE_DILIGENCE: 'Due Diligence',
  NEGOTIATION: 'Negotiation',
  DEFINITIVE_AGREEMENT: 'Definitive Agreement',
  SEC_REVIEW: 'SEC Review',
  SHAREHOLDER_VOTE: 'Shareholder Vote',
  CLOSING: 'Closing',
  DE_SPAC: 'De-SPAC',
};

export const TARGET_STATUS_LABELS: Record<string, string> = {
  IDENTIFIED: 'Identified',
  INITIAL_CONTACT: 'Initial Contact',
  NDA_SIGNED: 'NDA Signed',
  DATA_ROOM_ACCESS: 'Data Room Access',
  MANAGEMENT_MEETING: 'Management Meeting',
  VALUATION_ONGOING: 'Valuation Ongoing',
  TERM_SHEET: 'Term Sheet',
  LOI: 'LOI',
  PASSED: 'Passed',
  CLOSED: 'Closed',
};

export const DEAL_STAGE_LABELS: Record<string, string> = {
  ORIGINATION: 'Origination',
  PRELIMINARY_REVIEW: 'Preliminary Review',
  DEEP_DIVE: 'Deep Dive',
  NEGOTIATION: 'Negotiation',
  DOCUMENTATION: 'Documentation',
  CLOSING: 'Closing',
  TERMINATED: 'Terminated',
};

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  CORPORATE: 'Corporate',
  FINANCIAL: 'Financial',
  LEGAL: 'Legal',
  TAX: 'Tax',
  REGULATORY: 'Regulatory',
  OPERATIONAL: 'Operational',
  HR: 'Human Resources',
  IP: 'Intellectual Property',
  CONTRACTS: 'Contracts',
  SEC_FILINGS: 'SEC Filings',
  INVESTOR_MATERIALS: 'Investor Materials',
  OTHER: 'Other',
};

export const FILING_TYPE_LABELS: Record<string, string> = {
  S1: 'S-1',
  S4: 'S-4',
  DEFA14A: 'DEFA14A',
  DEF14A: 'DEF14A',
  PREM14A: 'PREM14A',
  FORM_8K: 'Form 8-K',
  FORM_10K: 'Form 10-K',
  FORM_10Q: 'Form 10-Q',
  SUPER_8K: 'Super 8-K',
  FORM_425: 'Form 425',
  SC_13D: 'Schedule 13D',
  SC_13G: 'Schedule 13G',
  FORM_3: 'Form 3',
  FORM_4: 'Form 4',
  FORM_5: 'Form 5',
  OTHER: 'Other',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  MANAGEMENT: 'Management',
  INVESTOR: 'Investor',
  ADVISOR: 'Advisor',
  LEGAL: 'Legal',
  BANKER: 'Banker',
  ACCOUNTANT: 'Accountant',
  REGULATORY: 'Regulatory',
  BOARD_MEMBER: 'Board Member',
  OTHER: 'Other',
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  PIPE: 'PIPE',
  FORWARD_PURCHASE: 'Forward Purchase',
  BACKSTOP: 'Backstop',
  REDEMPTION: 'Redemption',
  CONVERSION: 'Conversion',
  WARRANT_EXERCISE: 'Warrant Exercise',
  EARNOUT: 'Earnout',
};

// Sectors
export const SECTORS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer',
  'Industrials',
  'Energy',
  'Materials',
  'Real Estate',
  'Utilities',
  'Communication Services',
] as const;

// Geographies
export const GEOGRAPHIES = [
  'North America',
  'Europe',
  'Asia Pacific',
  'Latin America',
  'Middle East',
  'Africa',
  'Global',
] as const;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
} as const;

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  manager: 'Manager',
  analyst: 'Analyst',
  viewer: 'Viewer',
};

// Document Access Levels
export const ACCESS_LEVELS = {
  PUBLIC: 'public',
  TEAM: 'team',
  RESTRICTED: 'restricted',
} as const;

// File Types
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/gif',
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
