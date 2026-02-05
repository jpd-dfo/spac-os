'use client';

import { useState, useCallback, memo } from 'react';

import { Plus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';

// ============================================================================
// Types
// ============================================================================

type ContactType = 'INVESTOR' | 'ADVISOR' | 'LEGAL' | 'BANKER' | 'TARGET_EXEC' | 'BOARD_MEMBER' | 'SPONSOR' | 'UNDERWRITER' | 'AUDITOR' | 'OTHER';

const TYPE_LABELS: Record<ContactType, string> = {
  INVESTOR: 'Investor',
  ADVISOR: 'Advisor',
  LEGAL: 'Legal',
  BANKER: 'Banker',
  TARGET_EXEC: 'Target Executive',
  BOARD_MEMBER: 'Board Member',
  SPONSOR: 'Sponsor',
  UNDERWRITER: 'Underwriter',
  AUDITOR: 'Auditor',
  OTHER: 'Other',
};

export interface NewContactData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  type: ContactType;
  notes?: string;
  tags?: string[];
}

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewContactData) => void;
  isLoading: boolean;
}

// ============================================================================
// Form State Initial Value
// ============================================================================

const INITIAL_FORM_STATE: NewContactData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
  title: '',
  type: 'OTHER',
  notes: '',
  tags: [],
};

// ============================================================================
// Main Component - Memoized to prevent unnecessary re-renders
// ============================================================================

export const AddContactModal = memo(function AddContactModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddContactModalProps) {
  const [formData, setFormData] = useState<NewContactData>(INITIAL_FORM_STATE);
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName) {
      toast.error('First name and last name are required');
      return;
    }
    onSubmit(formData);
  }, [formData, onSubmit]);

  const handleFirstNameChange = useCallback((firstName: string) => {
    setFormData((prev) => ({ ...prev, firstName }));
  }, []);

  const handleLastNameChange = useCallback((lastName: string) => {
    setFormData((prev) => ({ ...prev, lastName }));
  }, []);

  const handleTypeChange = useCallback((type: ContactType) => {
    setFormData((prev) => ({ ...prev, type }));
  }, []);

  const handleEmailChange = useCallback((email: string) => {
    setFormData((prev) => ({ ...prev, email }));
  }, []);

  const handlePhoneChange = useCallback((phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));
  }, []);

  const handleCompanyChange = useCallback((company: string) => {
    setFormData((prev) => ({ ...prev, company }));
  }, []);

  const handleTitleChange = useCallback((title: string) => {
    setFormData((prev) => ({ ...prev, title }));
  }, []);

  const handleNotesChange = useCallback((notes: string) => {
    setFormData((prev) => ({ ...prev, notes }));
  }, []);

  const handleTagInputChange = useCallback((value: string) => {
    setTagInput(value);
  }, []);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  }, [tagInput, formData.tags]);

  const handleRemoveTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag) || [],
    }));
  }, []);

  const handleTagKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  }, [handleAddTag]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setTagInput('');
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Add New Contact</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-firstName" className="block text-sm font-medium text-slate-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleFirstNameChange(e.target.value)}
                  className="input w-full"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-lastName" className="block text-sm font-medium text-slate-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="contact-lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleLastNameChange(e.target.value)}
                  className="input w-full"
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            {/* Contact Type */}
            <div>
              <label htmlFor="contact-type" className="block text-sm font-medium text-slate-700 mb-1">Contact Type</label>
              <select
                id="contact-type"
                value={formData.type}
                onChange={(e) => handleTypeChange(e.target.value as ContactType)}
                className="input w-full"
              >
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Email and Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  id="contact-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="input w-full"
                  placeholder="john.doe@company.com"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="input w-full"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            {/* Company and Title */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-company" className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                <input
                  id="contact-company"
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleCompanyChange(e.target.value)}
                  className="input w-full"
                  placeholder="Acme Corporation"
                />
              </div>
              <div>
                <label htmlFor="contact-title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                <input
                  id="contact-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="input w-full"
                  placeholder="Managing Director"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="contact-tags" className="block text-sm font-medium text-slate-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  id="contact-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => handleTagInputChange(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="input flex-1"
                  placeholder="Add tag and press Enter"
                />
                <Button type="button" variant="secondary" size="md" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="contact-notes" className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
              <textarea
                id="contact-notes"
                value={formData.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Additional notes about this contact..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Contact
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
});
