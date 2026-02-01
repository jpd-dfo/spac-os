// SPAC OS - Contacts Module Components
// =====================================

export { ContactList } from './ContactList';
export { ContactCard } from './ContactCard';
export { ContactDetailModal } from './ContactDetailModal';
export { RelationshipGraph } from './RelationshipGraph';
export { InteractionLog } from './InteractionLog';
export { CompanyProfile } from './CompanyProfile';
export { AddContactForm } from './AddContactForm';

// Export types and mock data
export {
  mockContacts,
  mockCompanies,
  contactCategories,
  getContactById,
  getCompanyById,
  getContactsByCompany,
  getContactsByCategory,
  searchContacts,
} from './mockContactsData';

export type {
  ContactCategory,
  InteractionType,
  ContactInteraction,
  ContactNote,
  LinkedDeal,
  ExtendedContact,
  Company,
} from './mockContactsData';
