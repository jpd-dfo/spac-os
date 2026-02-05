'use client';

import { useState, useCallback, memo, useEffect } from 'react';

import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { trpc } from '@/lib/trpc';

// ============================================================================
// Constants
// ============================================================================

const COMPANY_TYPE_OPTIONS = [
  'Investment Bank',
  'Law Firm',
  'Target',
  'Sponsor',
  'Advisor',
  'Accounting Firm',
  'Other',
] as const;

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer',
  'Industrials',
  'Energy',
  'Real Estate',
  'Other',
] as const;

const SIZE_OPTIONS = [
  '1-50',
  '51-200',
  '201-500',
  '501-1000',
  '1001-5000',
  '5000+',
] as const;

// ============================================================================
// Types
// ============================================================================

export interface NewCompanyData {
  name: string;
  industry?: string;
  type?: string;
  size?: string;
  headquarters?: string;
  website?: string;
  description?: string;
  foundedYear?: number;
}

export interface EditCompanyData {
  id: string;
  name: string;
  industry: string | null;
  type: string | null;
  size: string | null;
  headquarters: string | null;
  website: string | null;
  description: string | null;
  foundedYear: number | null;
  logoUrl?: string | null;
}

interface AddCompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewCompanyData) => void;
  isLoading: boolean;
}

interface EditCompanyFormProps {
  isOpen: boolean;
  onClose: () => void;
  company: EditCompanyData;
  onSuccess: () => void;
}

// ============================================================================
// Form State Initial Values
// ============================================================================

const INITIAL_ADD_FORM_STATE: NewCompanyData = {
  name: '',
  industry: '',
  type: '',
  size: '',
  headquarters: '',
  website: '',
  description: '',
  foundedYear: undefined,
};

// ============================================================================
// AddCompanyForm - Memoized to prevent unnecessary re-renders
// ============================================================================

export const AddCompanyForm = memo(function AddCompanyForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddCompanyFormProps) {
  const [formData, setFormData] = useState<NewCompanyData>(INITIAL_ADD_FORM_STATE);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    onSubmit(formData);
  }, [formData, onSubmit]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name }));
  }, []);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setFormData((prev) => ({ ...prev, type }));
  }, []);

  const handleIndustryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const industry = e.target.value;
    setFormData((prev) => ({ ...prev, industry }));
  }, []);

  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setFormData((prev) => ({ ...prev, size }));
  }, []);

  const handleFoundedYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const foundedYear = e.target.value ? parseInt(e.target.value, 10) : undefined;
    setFormData((prev) => ({ ...prev, foundedYear }));
  }, []);

  const handleHeadquartersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const headquarters = e.target.value;
    setFormData((prev) => ({ ...prev, headquarters }));
  }, []);

  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const website = e.target.value;
    setFormData((prev) => ({ ...prev, website }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value;
    setFormData((prev) => ({ ...prev, description }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_ADD_FORM_STATE);
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
          <ModalTitle>Add New Company</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="company-name" className="block text-sm font-medium text-slate-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="company-name"
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                className="input w-full"
                placeholder="Acme Corporation"
                required
              />
            </div>

            {/* Type and Industry Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="company-type" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Type
                </label>
                <select
                  id="company-type"
                  value={formData.type}
                  onChange={handleTypeChange}
                  className="input w-full"
                >
                  <option value="">Select type...</option>
                  {COMPANY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="company-industry" className="block text-sm font-medium text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  id="company-industry"
                  value={formData.industry}
                  onChange={handleIndustryChange}
                  className="input w-full"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size and Founded Year Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="company-size" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Size
                </label>
                <select
                  id="company-size"
                  value={formData.size}
                  onChange={handleSizeChange}
                  className="input w-full"
                >
                  <option value="">Select size...</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="company-founded" className="block text-sm font-medium text-slate-700 mb-1">
                  Founded Year
                </label>
                <input
                  id="company-founded"
                  type="number"
                  value={formData.foundedYear || ''}
                  onChange={handleFoundedYearChange}
                  className="input w-full"
                  placeholder="2020"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Headquarters */}
            <div>
              <label htmlFor="company-headquarters" className="block text-sm font-medium text-slate-700 mb-1">
                Headquarters
              </label>
              <input
                id="company-headquarters"
                type="text"
                value={formData.headquarters}
                onChange={handleHeadquartersChange}
                className="input w-full"
                placeholder="New York, NY"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="company-website" className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <input
                id="company-website"
                type="url"
                value={formData.website}
                onChange={handleWebsiteChange}
                className="input w-full"
                placeholder="https://example.com"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="company-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="company-description"
                value={formData.description}
                onChange={handleDescriptionChange}
                className="input w-full"
                rows={3}
                placeholder="Brief description of the company..."
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
                Create Company
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
});

// ============================================================================
// EditCompanyForm - Memoized to prevent unnecessary re-renders
// ============================================================================

export const EditCompanyForm = memo(function EditCompanyForm({
  isOpen,
  onClose,
  company,
  onSuccess,
}: EditCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company.name,
    industry: company.industry || '',
    type: company.type || '',
    size: company.size || '',
    headquarters: company.headquarters || '',
    website: company.website || '',
    description: company.description || '',
    foundedYear: company.foundedYear || undefined as number | undefined,
  });

  // Reset form data when company changes
  useEffect(() => {
    setFormData({
      name: company.name,
      industry: company.industry || '',
      type: company.type || '',
      size: company.size || '',
      headquarters: company.headquarters || '',
      website: company.website || '',
      description: company.description || '',
      foundedYear: company.foundedYear || undefined,
    });
  }, [company]);

  const utils = trpc.useUtils();

  const updateCompanyMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      utils.company.list.invalidate();
      utils.company.getStatistics.invalidate();
      toast.success('Company updated successfully');
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to update company: ${error.message}`);
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }
    updateCompanyMutation.mutate({
      id: company.id,
      data: {
        name: formData.name.trim(),
        industry: formData.industry || null,
        type: formData.type || null,
        size: formData.size || null,
        headquarters: formData.headquarters || null,
        website: formData.website || null,
        description: formData.description || null,
        foundedYear: formData.foundedYear || null,
      },
    });
  }, [formData, company.id, updateCompanyMutation]);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({ ...prev, name }));
  }, []);

  const handleTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value;
    setFormData((prev) => ({ ...prev, type }));
  }, []);

  const handleIndustryChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const industry = e.target.value;
    setFormData((prev) => ({ ...prev, industry }));
  }, []);

  const handleSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = e.target.value;
    setFormData((prev) => ({ ...prev, size }));
  }, []);

  const handleFoundedYearChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const foundedYear = e.target.value ? parseInt(e.target.value, 10) : undefined;
    setFormData((prev) => ({ ...prev, foundedYear }));
  }, []);

  const handleHeadquartersChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const headquarters = e.target.value;
    setFormData((prev) => ({ ...prev, headquarters }));
  }, []);

  const handleWebsiteChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const website = e.target.value;
    setFormData((prev) => ({ ...prev, website }));
  }, []);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const description = e.target.value;
    setFormData((prev) => ({ ...prev, description }));
  }, []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Edit Company</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Company Name */}
            <div>
              <label htmlFor="edit-company-name" className="block text-sm font-medium text-slate-700 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-company-name"
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                className="input w-full"
                placeholder="Acme Corporation"
                required
              />
            </div>

            {/* Type and Industry Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-company-type" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Type
                </label>
                <select
                  id="edit-company-type"
                  value={formData.type}
                  onChange={handleTypeChange}
                  className="input w-full"
                >
                  <option value="">Select type...</option>
                  {COMPANY_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-company-industry" className="block text-sm font-medium text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  id="edit-company-industry"
                  value={formData.industry}
                  onChange={handleIndustryChange}
                  className="input w-full"
                >
                  <option value="">Select industry...</option>
                  {INDUSTRY_OPTIONS.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Size and Founded Year Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-company-size" className="block text-sm font-medium text-slate-700 mb-1">
                  Company Size
                </label>
                <select
                  id="edit-company-size"
                  value={formData.size}
                  onChange={handleSizeChange}
                  className="input w-full"
                >
                  <option value="">Select size...</option>
                  {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size} employees
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="edit-company-founded" className="block text-sm font-medium text-slate-700 mb-1">
                  Founded Year
                </label>
                <input
                  id="edit-company-founded"
                  type="number"
                  value={formData.foundedYear || ''}
                  onChange={handleFoundedYearChange}
                  className="input w-full"
                  placeholder="2020"
                  min={1800}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Headquarters */}
            <div>
              <label htmlFor="edit-company-headquarters" className="block text-sm font-medium text-slate-700 mb-1">
                Headquarters
              </label>
              <input
                id="edit-company-headquarters"
                type="text"
                value={formData.headquarters}
                onChange={handleHeadquartersChange}
                className="input w-full"
                placeholder="New York, NY"
              />
            </div>

            {/* Website */}
            <div>
              <label htmlFor="edit-company-website" className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <input
                id="edit-company-website"
                type="url"
                value={formData.website}
                onChange={handleWebsiteChange}
                className="input w-full"
                placeholder="https://example.com"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-company-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="edit-company-description"
                value={formData.description}
                onChange={handleDescriptionChange}
                className="input w-full"
                rows={3}
                placeholder="Brief description of the company..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={updateCompanyMutation.isPending}>
            {updateCompanyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
});
