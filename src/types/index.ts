// ============================================================================
// SPAC OS Type Definitions
// ============================================================================

// Re-export Prisma types when available
// export * from '@prisma/client';

// ============================================================================
// ENUMS (matching Prisma schema)
// ============================================================================

export type SPACStatus =
  | 'PRE_IPO'
  | 'SEARCHING'
  | 'LOI_SIGNED'
  | 'DA_ANNOUNCED'
  | 'PROXY_FILED'
  | 'VOTE_SCHEDULED'
  | 'CLOSING'
  | 'COMPLETED'
  | 'LIQUIDATED';

export type SPACPhase =
  | 'FORMATION'
  | 'IPO'
  | 'TARGET_SEARCH'
  | 'DUE_DILIGENCE'
  | 'NEGOTIATION'
  | 'DEFINITIVE_AGREEMENT'
  | 'SEC_REVIEW'
  | 'SHAREHOLDER_VOTE'
  | 'CLOSING'
  | 'DE_SPAC';

export type TargetStatus =
  | 'IDENTIFIED'
  | 'INITIAL_CONTACT'
  | 'NDA_SIGNED'
  | 'DATA_ROOM_ACCESS'
  | 'MANAGEMENT_MEETING'
  | 'VALUATION_ONGOING'
  | 'TERM_SHEET'
  | 'LOI'
  | 'PASSED'
  | 'CLOSED';

export type DealStage =
  | 'ORIGINATION'
  | 'PRELIMINARY_REVIEW'
  | 'DEEP_DIVE'
  | 'NEGOTIATION'
  | 'DOCUMENTATION'
  | 'CLOSING'
  | 'TERMINATED';

export type DocumentCategory =
  | 'CORPORATE'
  | 'FINANCIAL'
  | 'LEGAL'
  | 'TAX'
  | 'REGULATORY'
  | 'OPERATIONAL'
  | 'HR'
  | 'IP'
  | 'CONTRACTS'
  | 'SEC_FILINGS'
  | 'INVESTOR_MATERIALS'
  | 'OTHER';

export type DocumentStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'FINAL' | 'ARCHIVED';

export type FilingType =
  | 'S1'
  | 'S4'
  | 'DEFA14A'
  | 'DEF14A'
  | 'PREM14A'
  | 'FORM_8K'
  | 'FORM_10K'
  | 'FORM_10Q'
  | 'SUPER_8K'
  | 'FORM_425'
  | 'SC_13D'
  | 'SC_13G'
  | 'FORM_3'
  | 'FORM_4'
  | 'FORM_5'
  | 'OTHER';

export type FilingStatus =
  | 'DRAFT'
  | 'INTERNAL_REVIEW'
  | 'EXTERNAL_REVIEW'
  | 'SUBMITTED'
  | 'SEC_COMMENT'
  | 'RESPONSE_FILED'
  | 'EFFECTIVE'
  | 'COMPLETE';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ContactType =
  | 'MANAGEMENT'
  | 'INVESTOR'
  | 'ADVISOR'
  | 'LEGAL'
  | 'BANKER'
  | 'ACCOUNTANT'
  | 'REGULATORY'
  | 'BOARD_MEMBER'
  | 'OTHER';

export type TransactionType =
  | 'PIPE'
  | 'FORWARD_PURCHASE'
  | 'BACKSTOP'
  | 'REDEMPTION'
  | 'CONVERSION'
  | 'WARRANT_EXERCISE'
  | 'EARNOUT';

export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'DOWNLOAD'
  | 'SHARE'
  | 'APPROVE'
  | 'REJECT'
  | 'SUBMIT'
  | 'COMMENT';

// ============================================================================
// ENTITY INTERFACES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SPAC {
  id: string;
  name: string;
  ticker: string;
  status: SPACStatus;
  phase: SPACPhase;
  ipoDate: Date | null;
  ipoSize: number | null;
  unitPrice: number | null;
  sharesOutstanding: number | null;
  warrantsOutstanding: number | null;
  trustBalance: number | null;
  trustPerShare: number | null;
  interestEarned: number | null;
  deadline: Date | null;
  extensionCount: number;
  maxExtensions: number;
  daAnnouncedDate: Date | null;
  proxyFiledDate: Date | null;
  voteDate: Date | null;
  closingDate: Date | null;
  description: string | null;
  investmentThesis: string | null;
  targetSectors: string[];
  targetGeographies: string[];
  targetSizeMin: number | null;
  targetSizeMax: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Target {
  id: string;
  spacId: string;
  name: string;
  legalName: string | null;
  website: string | null;
  description: string | null;
  headquarters: string | null;
  foundedYear: number | null;
  employeeCount: number | null;
  sector: string | null;
  industry: string | null;
  subIndustry: string | null;
  status: TargetStatus;
  stage: DealStage;
  priority: number;
  probability: number | null;
  enterpriseValue: number | null;
  equityValue: number | null;
  ltmRevenue: number | null;
  ltmEbitda: number | null;
  projectedRevenue: number | null;
  projectedEbitda: number | null;
  evRevenue: number | null;
  evEbitda: number | null;
  managementScore: number | null;
  marketScore: number | null;
  financialScore: number | null;
  operationalScore: number | null;
  riskScore: number | null;
  overallScore: number | null;
  firstContactDate: Date | null;
  ndaSignedDate: Date | null;
  loiSignedDate: Date | null;
  daSignedDate: Date | null;
  notes: string | null;
  investmentHighlights: string[];
  keyRisks: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Contact {
  id: string;
  type: ContactType;
  firstName: string;
  lastName: string;
  title: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  linkedIn: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  spacId: string | null;
  targetId: string | null;
  name: string;
  description: string | null;
  category: DocumentCategory;
  status: DocumentStatus;
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  checksum: string | null;
  version: number;
  parentId: string | null;
  isConfidential: boolean;
  accessLevel: string;
  allowedUsers: string[];
  allowedRoles: string[];
  uploadedById: string;
  tags: string[];
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Filing {
  id: string;
  spacId: string;
  type: FilingType;
  status: FilingStatus;
  title: string;
  description: string | null;
  accessionNumber: string | null;
  edgarUrl: string | null;
  secFileNumber: string | null;
  filedDate: Date | null;
  effectiveDate: Date | null;
  dueDate: Date | null;
  internalReviewDate: Date | null;
  externalReviewDate: Date | null;
  secCommentDate: Date | null;
  responseDate: Date | null;
  secComments: string | null;
  secCommentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  spacId: string;
  type: TransactionType;
  name: string;
  description: string | null;
  amount: number;
  pricePerShare: number | null;
  shares: number | null;
  percentage: number | null;
  counterparty: string | null;
  investors: Record<string, unknown> | null;
  terms: string | null;
  conditions: string[];
  announcedDate: Date | null;
  closingDate: Date | null;
  expirationDate: Date | null;
  status: string;
  isCommitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Task {
  id: string;
  spacId: string | null;
  targetId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  createdById: string;
  dueDate: Date | null;
  startDate: Date | null;
  completedDate: Date | null;
  estimatedHours: number | null;
  actualHours: number | null;
  category: string | null;
  tags: string[];
  parentId: string | null;
  milestoneId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Milestone {
  id: string;
  spacId: string;
  name: string;
  description: string | null;
  phase: SPACPhase | null;
  targetDate: Date | null;
  completedDate: Date | null;
  status: string;
  progress: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  spacId: string | null;
  targetId: string | null;
  documentId: string | null;
  description: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// ============================================================================
// UI TYPES
// ============================================================================

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  children?: NavItem[];
}

export interface BreadcrumbItem {
  name: string;
  href?: string;
}

export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, item: T) => React.ReactNode;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  column: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in';
  value: unknown;
}

// ============================================================================
// API TYPES
// ============================================================================

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationState;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
