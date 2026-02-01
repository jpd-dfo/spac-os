/**
 * SPAC OS - Comprehensive Zod Validation Schemas
 * All entities with full validation including business rules
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const SpacStatusSchema = z.enum([
  'SEARCHING',
  'LOI_SIGNED',
  'DA_ANNOUNCED',
  'SEC_REVIEW',
  'SHAREHOLDER_VOTE',
  'CLOSING',
  'COMPLETED',
  'LIQUIDATING',
  'LIQUIDATED',
  'TERMINATED',
]);

export const SpacPhaseSchema = z.enum([
  'FORMATION',
  'IPO',
  'TARGET_SEARCH',
  'DUE_DILIGENCE',
  'NEGOTIATION',
  'DEFINITIVE_AGREEMENT',
  'SEC_REVIEW',
  'SHAREHOLDER_VOTE',
  'CLOSING',
  'DE_SPAC',
]);

export const SponsorTierSchema = z.enum(['TIER_1', 'TIER_2', 'TIER_3', 'EMERGING']);

export const TargetStatusSchema = z.enum([
  'IDENTIFIED',
  'PRELIMINARY',
  'NDA_SIGNED',
  'DUE_DILIGENCE',
  'TERM_SHEET',
  'LOI',
  'DEFINITIVE',
  'CLOSED',
  'PASSED',
  'TERMINATED',
]);

export const DealStageSchema = z.enum([
  'ORIGINATION',
  'PRELIMINARY_REVIEW',
  'DEEP_DIVE',
  'NEGOTIATION',
  'DOCUMENTATION',
  'CLOSING',
  'TERMINATED',
]);

export const DocumentTypeSchema = z.enum([
  'SEC_FILING',
  'LEGAL_AGREEMENT',
  'FINANCIAL_MODEL',
  'PRESENTATION',
  'DUE_DILIGENCE',
  'BOARD_MATERIALS',
  'CORRESPONDENCE',
  'REGULATORY',
  'INTERNAL_MEMO',
  'CONTRACT',
  'INVESTOR_MATERIALS',
  'OTHER',
]);

export const DocumentStatusSchema = z.enum([
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'FILED',
  'SUPERSEDED',
  'ARCHIVED',
]);

export const FilingTypeSchema = z.enum([
  'S1',
  'S1_A',
  'S4',
  'F4',
  'DEFA14A',
  'DEFM14A',
  'PRER14A',
  'FORM_8K',
  'FORM_10K',
  'FORM_10Q',
  'FORM_425',
  'SC_13D',
  'SC_13G',
  'SCHEDULE_TO',
  'PROXY_STATEMENT',
  'REGISTRATION_STATEMENT',
  'SUPER_8K',
  'FORM_3',
  'FORM_4',
  'FORM_5',
  'OTHER',
]);

export const FilingStatusSchema = z.enum([
  'DRAFTING',
  'INTERNAL_REVIEW',
  'LEGAL_REVIEW',
  'BOARD_APPROVAL',
  'FILED',
  'SEC_COMMENT',
  'RESPONSE_FILED',
  'AMENDED',
  'EFFECTIVE',
  'WITHDRAWN',
]);

export const TaskStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'BLOCKED',
  'UNDER_REVIEW',
  'COMPLETED',
  'CANCELLED',
]);

export const TaskPrioritySchema = z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const MilestoneTypeSchema = z.enum([
  'REGULATORY',
  'LEGAL',
  'FINANCIAL',
  'OPERATIONAL',
  'SHAREHOLDER',
  'CLOSING',
  'POST_CLOSING',
]);

export const ShareClassSchema = z.enum([
  'CLASS_A',
  'CLASS_B',
  'FOUNDER',
  'PIPE',
  'FORWARD_PURCHASE',
  'BACKSTOP',
  'WARRANT_EXERCISE',
]);

export const WarrantTypeSchema = z.enum([
  'PUBLIC',
  'PRIVATE',
  'WORKING_CAPITAL',
  'FORWARD_PURCHASE',
]);

export const ComplianceStatusSchema = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLIANT',
  'NON_COMPLIANT',
  'WAIVED',
  'NOT_APPLICABLE',
]);

export const TradingWindowStatusSchema = z.enum(['OPEN', 'CLOSED', 'BLACKOUT']);

export const ConflictSeveritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const PipeStatusSchema = z.enum([
  'PROSPECT',
  'CONTACTED',
  'INTERESTED',
  'TERM_SHEET',
  'COMMITTED',
  'FUNDED',
  'DECLINED',
]);

export const EarnoutStatusSchema = z.enum([
  'PENDING',
  'TRACKING',
  'ACHIEVED',
  'MISSED',
  'EXPIRED',
]);

export const AuditActionSchema = z.enum([
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'EXPORT',
  'IMPORT',
  'LOGIN',
  'LOGOUT',
  'PERMISSION_CHANGE',
  'STATUS_CHANGE',
  'VIEW',
  'DOWNLOAD',
  'SHARE',
  'APPROVE',
  'REJECT',
  'SUBMIT',
  'COMMENT',
]);

export const ContactTypeSchema = z.enum([
  'INVESTOR',
  'LEGAL',
  'BANKING',
  'ACCOUNTING',
  'TARGET_MANAGEMENT',
  'BOARD_MEMBER',
  'ADVISOR',
  'REGULATORY',
  'MEDIA',
  'MANAGEMENT',
  'OTHER',
]);

export const NotificationTypeSchema = z.enum([
  'DEADLINE',
  'TASK_ASSIGNED',
  'STATUS_CHANGE',
  'DOCUMENT_UPLOADED',
  'FILING_UPDATE',
  'COMPLIANCE_ALERT',
  'MEETING_REMINDER',
  'SYSTEM',
]);

export const WebhookEventTypeSchema = z.enum([
  'SPAC_CREATED',
  'SPAC_STATUS_CHANGED',
  'TARGET_ADDED',
  'DA_ANNOUNCED',
  'FILING_SUBMITTED',
  'FILING_EFFECTIVE',
  'REDEMPTION_UPDATED',
  'MILESTONE_REACHED',
  'COMPLIANCE_ALERT',
  'TASK_COMPLETED',
]);

export const TransactionTypeSchema = z.enum([
  'PIPE',
  'FORWARD_PURCHASE',
  'BACKSTOP',
  'REDEMPTION',
  'CONVERSION',
  'WARRANT_EXERCISE',
  'EARNOUT',
]);

// ============================================================================
// BASE SCHEMAS & UTILITIES
// ============================================================================

export const UuidSchema = z.string().uuid();

export const TickerSchema = z
  .string()
  .min(1)
  .max(10)
  .regex(/^[A-Z0-9.]+$/, 'Ticker must be uppercase letters, numbers, or dots');

export const CusipSchema = z
  .string()
  .length(9)
  .regex(/^[A-Z0-9]+$/, 'Invalid CUSIP format');

export const IsinSchema = z
  .string()
  .length(12)
  .regex(/^[A-Z]{2}[A-Z0-9]{10}$/, 'Invalid ISIN format');

export const CikSchema = z
  .string()
  .max(10)
  .regex(/^[0-9]+$/, 'CIK must be numeric');

export const EmailSchema = z.string().email('Invalid email address');

export const PhoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Invalid phone number format')
  .optional()
  .nullable();

export const UrlSchema = z.string().url('Invalid URL').optional().nullable();

export const MoneySchema = z.number().min(0).max(999999999999999); // 15 digits max

export const PercentageSchema = z.number().min(0).max(1); // 0.00 to 1.00

export const ScoreSchema = z.number().int().min(1).max(10);

// Pagination
export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range filter
export const DateRangeSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(
  (data) => !data.from || !data.to || data.from <= data.to,
  { message: 'From date must be before or equal to To date' }
);

// ============================================================================
// ORGANIZATION & USER SCHEMAS
// ============================================================================

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  domain: z.string().max(255).optional().nullable(),
  logoUrl: UrlSchema,
  settings: z.record(z.unknown()).optional().default({}),
});

export const OrganizationUpdateSchema = OrganizationCreateSchema.partial();

export const UserCreateSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(255).optional().nullable(),
  role: z.string().max(50).default('user'),
  preferences: z.record(z.unknown()).optional().default({}),
});

export const UserUpdateSchema = UserCreateSchema.partial().omit({ email: true });

// ============================================================================
// SPAC SCHEMAS
// ============================================================================

export const SpacCreateSchema = z.object({
  organizationId: UuidSchema,
  name: z.string().min(1).max(255),
  ticker: TickerSchema.optional().nullable(),
  cusip: CusipSchema.optional().nullable(),
  isin: IsinSchema.optional().nullable(),
  cik: CikSchema.optional().nullable(),
  status: SpacStatusSchema.default('SEARCHING'),
  phase: SpacPhaseSchema.default('FORMATION'),

  // IPO Details
  ipoDate: z.coerce.date().optional().nullable(),
  ipoSize: MoneySchema.optional().nullable(),
  ipoPrice: z.number().positive().optional().nullable(),
  unitPrice: z.number().positive().optional().nullable(),
  overallotment: MoneySchema.optional().nullable(),
  underwriters: z.array(z.string()).default([]),

  // Shares
  sharesOutstanding: z.number().int().positive().optional().nullable(),
  commonSharesOutstanding: z.number().int().positive().optional().nullable(),
  founderSharesOutstanding: z.number().int().positive().optional().nullable(),
  publicWarrantsOutstanding: z.number().int().positive().optional().nullable(),
  privateWarrantsOutstanding: z.number().int().positive().optional().nullable(),

  // Trust
  trustSize: MoneySchema.optional().nullable(),
  trustBalance: MoneySchema.optional().nullable(),
  trustPerShare: z.number().positive().optional().nullable(),
  interestEarned: MoneySchema.optional().nullable(),
  trustBank: z.string().max(255).optional().nullable(),

  // Timeline
  deadline: z.coerce.date().optional().nullable(),
  deadlineDate: z.coerce.date().optional().nullable(),
  maxExtensions: z.number().int().min(0).max(12).default(6),
  extensionMonths: z.number().int().min(1).max(12).default(1),
  extensionContribution: z.number().positive().optional().nullable(),

  // Focus
  description: z.string().optional().nullable(),
  investmentThesis: z.string().optional().nullable(),
  targetSectors: z.array(z.string()).default([]),
  targetIndustries: z.array(z.string()).default([]),
  targetGeographies: z.array(z.string()).default([]),
  targetSizeMin: MoneySchema.optional().nullable(),
  targetSizeMax: MoneySchema.optional().nullable(),

  // Exchange
  exchange: z.string().max(20).optional().nullable(),

  // Metadata
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const SpacUpdateSchema = SpacCreateSchema.partial().omit({ organizationId: true });

export const SpacFilterSchema = z.object({
  organizationId: UuidSchema.optional(),
  status: z.array(SpacStatusSchema).optional(),
  phase: z.array(SpacPhaseSchema).optional(),
  ticker: z.string().optional(),
  search: z.string().optional(),
  deadlineBefore: z.coerce.date().optional(),
  deadlineAfter: z.coerce.date().optional(),
  ipoSizeMin: MoneySchema.optional(),
  ipoSizeMax: MoneySchema.optional(),
  targetSectors: z.array(z.string()).optional(),
  targetGeographies: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  ...PaginationSchema.shape,
});

// ============================================================================
// SPONSOR SCHEMAS
// ============================================================================

export const SponsorCreateSchema = z.object({
  organizationId: UuidSchema,
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional().nullable(),
  tier: SponsorTierSchema.default('EMERGING'),
  website: UrlSchema,
  headquarters: z.string().max(255).optional().nullable(),
  totalSpacs: z.number().int().min(0).default(0),
  completedDeals: z.number().int().min(0).default(0),
  avgDealSize: MoneySchema.optional().nullable(),
  standardPromote: PercentageSchema.optional().nullable(),
  standardFounderShares: z.number().int().positive().optional().nullable(),
  standardAtRiskCapital: MoneySchema.optional().nullable(),
  keyPrincipals: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    bio: z.string().optional(),
  })).default([]),
  teamSize: z.number().int().positive().optional().nullable(),
  industryFocus: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const SponsorUpdateSchema = SponsorCreateSchema.partial().omit({ organizationId: true });

export const SpacSponsorCreateSchema = z.object({
  spacId: UuidSchema,
  sponsorId: UuidSchema,
  promote: PercentageSchema.optional().nullable(),
  founderShares: z.number().int().positive().optional().nullable(),
  atRiskCapital: MoneySchema.optional().nullable(),
  earnbackProvision: z.record(z.unknown()).optional().nullable(),
  isPrimary: z.boolean().default(false),
  role: z.string().max(100).optional().nullable(),
});

// ============================================================================
// TARGET SCHEMAS
// ============================================================================

export const TargetCreateSchema = z.object({
  spacId: UuidSchema.optional().nullable(),
  name: z.string().min(1).max(255),
  legalName: z.string().max(255).optional().nullable(),
  status: TargetStatusSchema.default('IDENTIFIED'),
  stage: DealStageSchema.default('ORIGINATION'),
  priority: z.number().int().min(1).max(5).default(3),
  probability: z.number().int().min(0).max(100).optional().nullable(),

  // Company Profile
  description: z.string().optional().nullable(),
  sector: z.string().max(100).optional().nullable(),
  industry: z.string().max(100).optional().nullable(),
  subIndustry: z.string().max(100).optional().nullable(),
  website: UrlSchema,
  headquarters: z.string().max(255).optional().nullable(),
  foundedYear: z.number().int().min(1800).max(new Date().getFullYear()).optional().nullable(),
  employeeCount: z.number().int().positive().optional().nullable(),

  // Financials
  revenue: MoneySchema.optional().nullable(),
  revenueYear: z.number().int().min(2000).max(new Date().getFullYear() + 1).optional().nullable(),
  ebitda: z.number().optional().nullable(), // Can be negative
  grossMargin: PercentageSchema.optional().nullable(),
  growthRate: z.number().min(-1).max(10).optional().nullable(), // -100% to 1000%
  ltmRevenue: MoneySchema.optional().nullable(),
  ltmEbitda: z.number().optional().nullable(),
  projectedRevenue: MoneySchema.optional().nullable(),
  projectedEbitda: z.number().optional().nullable(),

  // Valuation
  enterpriseValue: MoneySchema.optional().nullable(),
  equityValue: MoneySchema.optional().nullable(),
  evRevenue: z.number().min(0).max(100).optional().nullable(),
  evEbitda: z.number().min(0).max(100).optional().nullable(),

  // Evaluation Scores
  managementScore: ScoreSchema.optional().nullable(),
  marketScore: ScoreSchema.optional().nullable(),
  financialScore: ScoreSchema.optional().nullable(),
  operationalScore: ScoreSchema.optional().nullable(),
  riskScore: ScoreSchema.optional().nullable(),
  overallScore: z.number().min(1).max(10).optional().nullable(),

  // Deal Terms
  proposedValuation: MoneySchema.optional().nullable(),
  rolloverEquity: PercentageSchema.optional().nullable(),

  // Timeline
  identifiedDate: z.coerce.date().optional().nullable(),
  firstContactDate: z.coerce.date().optional().nullable(),
  ndaDate: z.coerce.date().optional().nullable(),
  loiDate: z.coerce.date().optional().nullable(),
  daDate: z.coerce.date().optional().nullable(),
  expectedCloseDate: z.coerce.date().optional().nullable(),

  // Due Diligence
  dueDiligenceStatus: z.string().max(100).optional().nullable(),
  keyRisks: z.array(z.string()).default([]),
  keyOpportunities: z.array(z.string()).default([]),
  investmentHighlights: z.array(z.string()).default([]),

  // Metadata
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
  confidentialityLevel: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
});

export const TargetUpdateSchema = TargetCreateSchema.partial();

export const TargetFilterSchema = z.object({
  spacId: UuidSchema.optional(),
  status: z.array(TargetStatusSchema).optional(),
  stage: z.array(DealStageSchema).optional(),
  industry: z.string().optional(),
  sector: z.string().optional(),
  search: z.string().optional(),
  priorityMin: z.number().int().min(1).max(5).optional(),
  priorityMax: z.number().int().min(1).max(5).optional(),
  evMin: MoneySchema.optional(),
  evMax: MoneySchema.optional(),
  ...PaginationSchema.shape,
});

// ============================================================================
// CONTACT SCHEMAS
// ============================================================================

export const ContactCreateSchema = z.object({
  organizationId: UuidSchema,
  externalCrmId: z.string().max(255).optional().nullable(),
  externalCrmType: z.enum(['salesforce', 'hubspot', 'dynamics', 'other']).optional().nullable(),
  type: ContactTypeSchema.default('OTHER'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: EmailSchema.optional().nullable(),
  phone: PhoneSchema,
  mobile: PhoneSchema,
  company: z.string().max(255).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  linkedinUrl: UrlSchema,
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  relationship: z.string().max(100).optional().nullable(),
  influence: z.enum(['decision_maker', 'influencer', 'gatekeeper', 'user', 'other']).optional().nullable(),
  preferredContact: z.enum(['email', 'phone', 'mobile', 'mail']).optional().nullable(),
  doNotContact: z.boolean().default(false),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const ContactUpdateSchema = ContactCreateSchema.partial().omit({ organizationId: true });

// ============================================================================
// DOCUMENT SCHEMAS
// ============================================================================

export const DocumentCreateSchema = z.object({
  spacId: UuidSchema.optional().nullable(),
  targetId: UuidSchema.optional().nullable(),
  uploadedById: UuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  type: DocumentTypeSchema.default('OTHER'),
  category: z.string().max(100).optional().nullable(),
  status: DocumentStatusSchema.default('DRAFT'),
  fileName: z.string().min(1).max(255),
  fileType: z.string().min(1).max(100),
  fileSize: z.number().int().positive(),
  filePath: z.string().min(1).max(500),
  storageKey: z.string().max(500).optional().nullable(),
  storageBucket: z.string().max(100).optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
  checksum: z.string().max(64).optional().nullable(),
  version: z.number().int().min(1).default(1),
  parentId: UuidSchema.optional().nullable(),
  isLatest: z.boolean().default(true),
  isConfidential: z.boolean().default(false),
  accessLevel: z.enum(['public', 'team', 'restricted']).default('team'),
  confidentialityLevel: z.enum(['public', 'internal', 'confidential', 'restricted']).default('internal'),
  retentionDate: z.coerce.date().optional().nullable(),
  allowedUsers: z.array(UuidSchema).default([]),
  allowedRoles: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const DocumentUpdateSchema = DocumentCreateSchema.partial().omit({
  uploadedById: true,
  fileName: true,
  fileSize: true,
  filePath: true
});

// ============================================================================
// FILING SCHEMAS
// ============================================================================

export const FilingCreateSchema = z.object({
  spacId: UuidSchema,
  type: FilingTypeSchema,
  status: FilingStatusSchema.default('DRAFTING'),
  title: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  accessionNumber: z.string().max(50).optional().nullable(),
  fileNumber: z.string().max(50).optional().nullable(),
  cik: CikSchema.optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  filedDate: z.coerce.date().optional().nullable(),
  effectiveDate: z.coerce.date().optional().nullable(),
  edgarUrl: UrlSchema,
  amendmentNumber: z.number().int().min(0).default(0),
  parentFilingId: UuidSchema.optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const FilingUpdateSchema = FilingCreateSchema.partial().omit({ spacId: true });

// ============================================================================
// TRANSACTION SCHEMAS
// ============================================================================

export const TransactionCreateSchema = z.object({
  spacId: UuidSchema,
  targetId: UuidSchema.optional().nullable(),
  type: TransactionTypeSchema.optional().nullable(),
  name: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  enterpriseValue: MoneySchema.optional().nullable(),
  equityValue: MoneySchema.optional().nullable(),
  amount: MoneySchema.optional().nullable(),
  cashConsideration: MoneySchema.optional().nullable(),
  stockConsideration: MoneySchema.optional().nullable(),
  pricePerShare: z.number().positive().optional().nullable(),
  shares: z.number().int().positive().optional().nullable(),
  percentage: PercentageSchema.optional().nullable(),
  evRevenue: z.number().min(0).max(100).optional().nullable(),
  evEbitda: z.number().min(0).max(100).optional().nullable(),
  dealStructure: z.enum(['merger', 'acquisition', 'stock_purchase', 'asset_purchase', 'other']).optional().nullable(),
  counterparty: z.string().max(255).optional().nullable(),
  investors: z.array(z.object({
    name: z.string(),
    amount: z.number().positive(),
    shares: z.number().int().positive().optional(),
  })).optional().nullable(),
  pipeSize: MoneySchema.optional().nullable(),
  pipePrice: z.number().positive().optional().nullable(),
  sponsorPromote: PercentageSchema.optional().nullable(),
  promoteForfeit: PercentageSchema.optional().nullable(),
  earnoutShares: z.number().int().positive().optional().nullable(),
  terms: z.string().optional().nullable(),
  conditions: z.array(z.string()).default([]),
  announcedDate: z.coerce.date().optional().nullable(),
  daAnnouncedDate: z.coerce.date().optional().nullable(),
  shareholderVoteDate: z.coerce.date().optional().nullable(),
  expectedCloseDate: z.coerce.date().optional().nullable(),
  closingDate: z.coerce.date().optional().nullable(),
  status: z.string().max(50).default('pending'),
  isCommitted: z.boolean().default(false),
  voteApprovalRate: PercentageSchema.optional().nullable(),
  redemptionRate: PercentageSchema.optional().nullable(),
  newTicker: TickerSchema.optional().nullable(),
  newName: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const TransactionUpdateSchema = TransactionCreateSchema.partial().omit({ spacId: true });

// ============================================================================
// TASK SCHEMAS
// ============================================================================

export const TaskCreateSchema = z.object({
  spacId: UuidSchema.optional().nullable(),
  targetId: UuidSchema.optional().nullable(),
  filingId: UuidSchema.optional().nullable(),
  milestoneId: UuidSchema.optional().nullable(),
  assigneeId: UuidSchema.optional().nullable(),
  createdById: UuidSchema,
  parentTaskId: UuidSchema.optional().nullable(),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: TaskStatusSchema.default('NOT_STARTED'),
  priority: TaskPrioritySchema.default('MEDIUM'),
  dueDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  estimatedHours: z.number().positive().max(1000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string()).default([]),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.string().max(255).optional().nullable(), // iCal RRULE format
  blockedBy: z.array(UuidSchema).default([]),
  metadata: z.record(z.unknown()).optional().default({}),
}).refine(
  (data) => !data.startDate || !data.dueDate || data.startDate <= data.dueDate,
  { message: 'Start date must be before or equal to due date' }
);

export const TaskUpdateSchema = TaskCreateSchema.partial().omit({ createdById: true });

// ============================================================================
// MILESTONE SCHEMAS
// ============================================================================

export const MilestoneCreateSchema = z.object({
  spacId: UuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  type: MilestoneTypeSchema.optional().nullable(),
  phase: SpacPhaseSchema.optional().nullable(),
  targetDate: z.coerce.date().optional().nullable(),
  isCompleted: z.boolean().default(false),
  status: z.string().max(50).default('pending'),
  progress: z.number().int().min(0).max(100).default(0),
  isCritical: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
  dependsOn: z.array(UuidSchema).default([]),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const MilestoneUpdateSchema = MilestoneCreateSchema.partial().omit({ spacId: true });

// ============================================================================
// FINANCIAL ENTITY SCHEMAS
// ============================================================================

export const TrustAccountCreateSchema = z.object({
  spacId: UuidSchema,
  accountNumber: z.string().max(100).optional().nullable(),
  bankName: z.string().max(255).optional().nullable(),
  currentBalance: MoneySchema,
  balanceDate: z.coerce.date(),
  interestRate: PercentageSchema.optional().nullable(),
  accruedInterest: MoneySchema.default(0),
  perShareValue: z.number().positive(),
  balanceHistory: z.array(z.object({
    date: z.coerce.date(),
    balance: z.number(),
    perShare: z.number(),
    note: z.string().optional(),
  })).default([]),
  notes: z.string().optional().nullable(),
});

export const CapTableEntryCreateSchema = z.object({
  spacId: UuidSchema,
  holderName: z.string().min(1).max(255),
  holderType: z.enum(['sponsor', 'investor', 'employee', 'founder', 'pipe', 'other']),
  holderId: UuidSchema.optional().nullable(),
  shareClass: ShareClassSchema,
  sharesOwned: z.number().int().positive(),
  ownershipPct: PercentageSchema,
  votingPower: PercentageSchema.optional().nullable(),
  lockupExpiry: z.coerce.date().optional().nullable(),
  vestingSchedule: z.object({
    cliffMonths: z.number().int().min(0).optional(),
    vestingMonths: z.number().int().min(0).optional(),
    accelerationTriggers: z.array(z.string()).optional(),
  }).optional().nullable(),
  costBasis: MoneySchema.optional().nullable(),
  acquisitionDate: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const WarrantCreateSchema = z.object({
  spacId: UuidSchema,
  type: WarrantTypeSchema,
  totalWarrants: z.number().int().positive(),
  exercisePrice: z.number().positive(),
  exerciseRatio: z.number().positive().default(1),
  holderName: z.string().max(255).optional().nullable(),
  holderId: UuidSchema.optional().nullable(),
  exercisableDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  warrantsExercised: z.number().int().min(0).default(0),
  warrantsRedeemed: z.number().int().min(0).default(0),
  redemptionPrice: z.number().positive().optional().nullable(),
  cashlessExercise: z.boolean().default(true),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
}).refine(
  (data) => !data.exercisableDate || !data.expirationDate || data.exercisableDate < data.expirationDate,
  { message: 'Exercisable date must be before expiration date' }
).refine(
  (data) => data.warrantsExercised + data.warrantsRedeemed <= data.totalWarrants,
  { message: 'Exercised + redeemed warrants cannot exceed total warrants' }
);

export const RedemptionCreateSchema = z.object({
  spacId: UuidSchema,
  eventDate: z.coerce.date(),
  eventType: z.enum(['extension', 'business_combination', 'liquidation', 'other']),
  sharesEligible: z.number().int().positive(),
  sharesRedeemed: z.number().int().min(0),
  redemptionRate: PercentageSchema,
  redemptionPrice: z.number().positive(),
  totalPayout: MoneySchema,
  remainingShares: z.number().int().min(0),
  remainingTrust: MoneySchema,
  notes: z.string().optional().nullable(),
}).refine(
  (data) => data.sharesRedeemed <= data.sharesEligible,
  { message: 'Shares redeemed cannot exceed shares eligible' }
);

export const PipeInvestorCreateSchema = z.object({
  spacId: UuidSchema,
  investorName: z.string().min(1).max(255),
  investorType: z.enum(['hedge_fund', 'private_equity', 'strategic', 'family_office', 'sovereign_wealth', 'other']),
  contactId: UuidSchema.optional().nullable(),
  status: PipeStatusSchema.default('PROSPECT'),
  targetAmount: MoneySchema.optional().nullable(),
  committedAmount: MoneySchema.optional().nullable(),
  fundedAmount: MoneySchema.optional().nullable(),
  pricePerShare: z.number().positive().optional().nullable(),
  sharesCommitted: z.number().int().positive().optional().nullable(),
  warrantCoverage: PercentageSchema.optional().nullable(),
  commitmentDate: z.coerce.date().optional().nullable(),
  fundingDate: z.coerce.date().optional().nullable(),
  lockupPeriod: z.number().int().positive().optional().nullable(), // days
  lockupExpiry: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const EarnoutCreateSchema = z.object({
  spacId: UuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  status: EarnoutStatusSchema.default('PENDING'),
  metricType: z.enum(['stock_price', 'revenue', 'ebitda', 'custom']),
  targetValue: z.number(),
  currentValue: z.number().optional().nullable(),
  earnoutShares: z.number().int().positive(),
  sharesEarned: z.number().int().min(0).default(0),
  measurementStart: z.coerce.date().optional().nullable(),
  measurementEnd: z.coerce.date().optional().nullable(),
  achievedDate: z.coerce.date().optional().nullable(),
  conditions: z.record(z.unknown()).optional().default({}),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => data.sharesEarned <= data.earnoutShares,
  { message: 'Shares earned cannot exceed earnout shares' }
);

// ============================================================================
// COMPLIANCE SCHEMAS
// ============================================================================

export const ComplianceItemCreateSchema = z.object({
  spacId: UuidSchema,
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  category: z.enum(['sec', 'exchange', 'corporate', 'tax', 'legal', 'other']),
  status: ComplianceStatusSchema.default('PENDING'),
  dueDate: z.coerce.date().optional().nullable(),
  requirements: z.array(z.object({
    item: z.string(),
    completed: z.boolean().default(false),
    completedDate: z.coerce.date().optional(),
    notes: z.string().optional(),
  })).default([]),
  responsibleParty: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const SecCommentCreateSchema = z.object({
  spacId: UuidSchema,
  filingId: UuidSchema.optional().nullable(),
  commentNumber: z.number().int().positive(),
  commentText: z.string().min(1),
  responseText: z.string().optional().nullable(),
  responseDate: z.coerce.date().optional().nullable(),
  receivedDate: z.coerce.date(),
  dueDate: z.coerce.date().optional().nullable(),
  isResolved: z.boolean().default(false),
  resolvedDate: z.coerce.date().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const BoardMeetingCreateSchema = z.object({
  spacId: UuidSchema,
  title: z.string().min(1).max(255),
  type: z.enum(['regular', 'special', 'telephonic', 'written_consent']),
  scheduledDate: z.coerce.date(),
  location: z.string().max(255).optional().nullable(),
  isVirtual: z.boolean().default(false),
  meetingLink: UrlSchema,
  quorumMet: z.boolean().optional().nullable(),
  attendees: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    present: z.boolean().default(false),
  })).default([]),
  agenda: z.array(z.object({
    item: z.string(),
    presenter: z.string().optional(),
    duration: z.number().int().positive().optional(),
    notes: z.string().optional(),
  })).default([]),
  minutes: z.string().optional().nullable(),
  resolutions: z.array(z.object({
    number: z.number().int().positive(),
    title: z.string(),
    description: z.string().optional(),
    votesFor: z.number().int().min(0).optional(),
    votesAgainst: z.number().int().min(0).optional(),
    abstentions: z.number().int().min(0).optional(),
    passed: z.boolean().optional(),
  })).default([]),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  notes: z.string().optional().nullable(),
});

export const ConflictCreateSchema = z.object({
  spacId: UuidSchema,
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: ConflictSeveritySchema.default('MEDIUM'),
  involvedParties: z.array(z.object({
    name: z.string(),
    role: z.string().optional(),
    relationship: z.string().optional(),
  })),
  conflictType: z.string().min(1).max(100),
  isResolved: z.boolean().default(false),
  resolution: z.string().optional().nullable(),
  resolvedDate: z.coerce.date().optional().nullable(),
  disclosedDate: z.coerce.date().optional().nullable(),
  disclosedIn: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const InsiderTradingWindowCreateSchema = z.object({
  spacId: UuidSchema,
  userId: UuidSchema.optional().nullable(),
  status: TradingWindowStatusSchema.default('OPEN'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  reason: z.string().max(255).optional().nullable(),
  affectsAll: z.boolean().default(false),
  affectedPersons: z.array(z.object({
    userId: z.string().uuid().optional(),
    name: z.string(),
    role: z.string().optional(),
  })).default([]),
  notificationSent: z.boolean().default(false),
  notes: z.string().optional().nullable(),
}).refine(
  (data) => !data.endDate || data.startDate < data.endDate,
  { message: 'Start date must be before end date' }
);

// ============================================================================
// SYSTEM SCHEMAS
// ============================================================================

export const CommentCreateSchema = z.object({
  userId: UuidSchema,
  documentId: UuidSchema.optional().nullable(),
  taskId: UuidSchema.optional().nullable(),
  filingId: UuidSchema.optional().nullable(),
  transactionId: UuidSchema.optional().nullable(),
  parentId: UuidSchema.optional().nullable(),
  content: z.string().min(1),
  mentions: z.array(UuidSchema).default([]),
}).refine(
  (data) => data.documentId || data.taskId || data.filingId || data.transactionId,
  { message: 'Comment must be associated with a document, task, filing, or transaction' }
);

export const NotificationCreateSchema = z.object({
  userId: UuidSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  linkType: z.enum(['spac', 'task', 'document', 'filing', 'target', 'compliance']).optional().nullable(),
  linkId: UuidSchema.optional().nullable(),
});

export const WebhookCreateSchema = z.object({
  organizationId: UuidSchema,
  name: z.string().min(1).max(255),
  url: z.string().url(),
  secret: z.string().min(16).max(255),
  events: z.array(WebhookEventTypeSchema).min(1),
  isActive: z.boolean().default(true),
  headers: z.record(z.string()).optional().default({}),
});

export const ApiKeyCreateSchema = z.object({
  organizationId: UuidSchema,
  name: z.string().min(1).max(255),
  permissions: z.array(z.string()).default([]),
  expiresAt: z.coerce.date().optional().nullable(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type SpacStatus = z.infer<typeof SpacStatusSchema>;
export type SpacPhase = z.infer<typeof SpacPhaseSchema>;
export type SponsorTier = z.infer<typeof SponsorTierSchema>;
export type TargetStatus = z.infer<typeof TargetStatusSchema>;
export type DealStage = z.infer<typeof DealStageSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;
export type FilingType = z.infer<typeof FilingTypeSchema>;
export type FilingStatus = z.infer<typeof FilingStatusSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskPriority = z.infer<typeof TaskPrioritySchema>;
export type MilestoneType = z.infer<typeof MilestoneTypeSchema>;
export type ShareClass = z.infer<typeof ShareClassSchema>;
export type WarrantType = z.infer<typeof WarrantTypeSchema>;
export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;
export type TradingWindowStatus = z.infer<typeof TradingWindowStatusSchema>;
export type ConflictSeverity = z.infer<typeof ConflictSeveritySchema>;
export type PipeStatus = z.infer<typeof PipeStatusSchema>;
export type EarnoutStatus = z.infer<typeof EarnoutStatusSchema>;
export type AuditAction = z.infer<typeof AuditActionSchema>;
export type ContactType = z.infer<typeof ContactTypeSchema>;
export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type WebhookEventType = z.infer<typeof WebhookEventTypeSchema>;
export type TransactionType = z.infer<typeof TransactionTypeSchema>;

export type OrganizationCreate = z.infer<typeof OrganizationCreateSchema>;
export type OrganizationUpdate = z.infer<typeof OrganizationUpdateSchema>;
export type UserCreate = z.infer<typeof UserCreateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
export type SpacCreate = z.infer<typeof SpacCreateSchema>;
export type SpacUpdate = z.infer<typeof SpacUpdateSchema>;
export type SpacFilter = z.infer<typeof SpacFilterSchema>;
export type SponsorCreate = z.infer<typeof SponsorCreateSchema>;
export type SponsorUpdate = z.infer<typeof SponsorUpdateSchema>;
export type TargetCreate = z.infer<typeof TargetCreateSchema>;
export type TargetUpdate = z.infer<typeof TargetUpdateSchema>;
export type TargetFilter = z.infer<typeof TargetFilterSchema>;
export type ContactCreate = z.infer<typeof ContactCreateSchema>;
export type ContactUpdate = z.infer<typeof ContactUpdateSchema>;
export type DocumentCreate = z.infer<typeof DocumentCreateSchema>;
export type DocumentUpdate = z.infer<typeof DocumentUpdateSchema>;
export type FilingCreate = z.infer<typeof FilingCreateSchema>;
export type FilingUpdate = z.infer<typeof FilingUpdateSchema>;
export type TransactionCreate = z.infer<typeof TransactionCreateSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;
export type TaskCreate = z.infer<typeof TaskCreateSchema>;
export type TaskUpdate = z.infer<typeof TaskUpdateSchema>;
export type MilestoneCreate = z.infer<typeof MilestoneCreateSchema>;
export type MilestoneUpdate = z.infer<typeof MilestoneUpdateSchema>;
export type TrustAccountCreate = z.infer<typeof TrustAccountCreateSchema>;
export type CapTableEntryCreate = z.infer<typeof CapTableEntryCreateSchema>;
export type WarrantCreate = z.infer<typeof WarrantCreateSchema>;
export type RedemptionCreate = z.infer<typeof RedemptionCreateSchema>;
export type PipeInvestorCreate = z.infer<typeof PipeInvestorCreateSchema>;
export type EarnoutCreate = z.infer<typeof EarnoutCreateSchema>;
export type ComplianceItemCreate = z.infer<typeof ComplianceItemCreateSchema>;
export type SecCommentCreate = z.infer<typeof SecCommentCreateSchema>;
export type BoardMeetingCreate = z.infer<typeof BoardMeetingCreateSchema>;
export type ConflictCreate = z.infer<typeof ConflictCreateSchema>;
export type InsiderTradingWindowCreate = z.infer<typeof InsiderTradingWindowCreateSchema>;
export type CommentCreate = z.infer<typeof CommentCreateSchema>;
export type NotificationCreate = z.infer<typeof NotificationCreateSchema>;
export type WebhookCreate = z.infer<typeof WebhookCreateSchema>;
export type ApiKeyCreate = z.infer<typeof ApiKeyCreateSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
