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
