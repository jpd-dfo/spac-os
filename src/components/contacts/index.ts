// SPAC OS - Contacts Module Components
// =====================================

export { ContactCard } from './ContactCard';
export { ContactDetailModal } from './ContactDetailModal';
export { RelationshipGraph } from './RelationshipGraph';
export { InteractionLog } from './InteractionLog';
export { CompanyProfile } from './CompanyProfile';
export { AddContactForm } from './AddContactForm';

// Export types from dedicated types file
export {
  contactCategories,
} from './contact.types';

export type {
  ContactCategory,
  InteractionType,
  ContactInteraction,
  ContactNote,
  LinkedDeal,
  ExtendedContact,
  Company,
} from './contact.types';
