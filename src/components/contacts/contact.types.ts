// ============================================================================
// SPAC OS - Contact Types
// Type definitions for contact-related components
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
  organizationId?: string | null;
  organization?: { id: string; name: string } | null;
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

// Organization type - for contacts linked to organizations
// Full Organization type is in the Prisma schema
export interface ContactOrganization {
  id: string;
  name: string;
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
