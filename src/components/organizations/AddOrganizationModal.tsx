'use client';

import { useState, useCallback, memo } from 'react';

import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { SECTORS, GEOGRAPHIES } from '@/lib/constants';
import { cn, slugify } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

type OrganizationType = 'PE_FIRM' | 'IB' | 'TARGET_COMPANY' | 'SERVICE_PROVIDER' | 'LAW_FIRM' | 'ACCOUNTING_FIRM' | 'OTHER';
type OrganizationSubType = 'BUYOUT' | 'GROWTH_EQUITY' | 'VENTURE_CAPITAL' | 'FAMILY_OFFICE' | 'SOVEREIGN_WEALTH' | 'HEDGE_FUND' | 'BULGE_BRACKET' | 'MIDDLE_MARKET' | 'BOUTIQUE' | 'REGIONAL';

const TYPE_LABELS: Record<OrganizationType, string> = {
  PE_FIRM: 'PE Firm',
  IB: 'Investment Bank',
  TARGET_COMPANY: 'Target Company',
  SERVICE_PROVIDER: 'Service Provider',
  LAW_FIRM: 'Law Firm',
  ACCOUNTING_FIRM: 'Accounting Firm',
  OTHER: 'Other',
};

const SUBTYPE_LABELS: Record<OrganizationSubType, string> = {
  BUYOUT: 'Buyout',
  GROWTH_EQUITY: 'Growth Equity',
  VENTURE_CAPITAL: 'Venture Capital',
  FAMILY_OFFICE: 'Family Office',
  SOVEREIGN_WEALTH: 'Sovereign Wealth',
  HEDGE_FUND: 'Hedge Fund',
  BULGE_BRACKET: 'Bulge Bracket',
  MIDDLE_MARKET: 'Middle Market',
  BOUTIQUE: 'Boutique',
  REGIONAL: 'Regional',
};

const ALL_TYPES: OrganizationType[] = ['PE_FIRM', 'IB', 'TARGET_COMPANY', 'SERVICE_PROVIDER', 'LAW_FIRM', 'ACCOUNTING_FIRM', 'OTHER'];
const ALL_SUBTYPES: OrganizationSubType[] = ['BUYOUT', 'GROWTH_EQUITY', 'VENTURE_CAPITAL', 'FAMILY_OFFICE', 'SOVEREIGN_WEALTH', 'HEDGE_FUND', 'BULGE_BRACKET', 'MIDDLE_MARKET', 'BOUTIQUE', 'REGIONAL'];

export interface NewOrganizationData {
  name: string;
  slug: string;
  type: OrganizationType;
  subType?: OrganizationSubType;
  aum?: number;
  headquarters?: string;
  website?: string;
  description?: string;
  industryFocus: string[];
  geographyFocus: string[];
}

interface AddOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewOrganizationData) => void;
  isLoading: boolean;
}

// ============================================================================
// Form State Initial Value
// ============================================================================

const INITIAL_FORM_STATE: NewOrganizationData = {
  name: '',
  slug: '',
  type: 'PE_FIRM',
  subType: undefined,
  aum: undefined,
  headquarters: '',
  website: '',
  description: '',
  industryFocus: [],
  geographyFocus: [],
};

// ============================================================================
// Main Component - Memoized to prevent unnecessary re-renders
// ============================================================================

export const AddOrganizationModal = memo(function AddOrganizationModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: AddOrganizationModalProps) {
  const [formData, setFormData] = useState<NewOrganizationData>(INITIAL_FORM_STATE);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Organization name is required');
      return;
    }
    if (!formData.slug) {
      toast.error('Slug is required');
      return;
    }
    onSubmit(formData);
  }, [formData, onSubmit]);

  const handleNameChange = useCallback((name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || slugify(name),
    }));
  }, []);

  const handleSlugChange = useCallback((slug: string) => {
    setFormData((prev) => ({ ...prev, slug }));
  }, []);

  const handleTypeChange = useCallback((type: OrganizationType) => {
    setFormData((prev) => ({ ...prev, type }));
  }, []);

  const handleSubTypeChange = useCallback((subType: OrganizationSubType | undefined) => {
    setFormData((prev) => ({ ...prev, subType }));
  }, []);

  const handleAumChange = useCallback((aum: number | undefined) => {
    setFormData((prev) => ({ ...prev, aum }));
  }, []);

  const handleHeadquartersChange = useCallback((headquarters: string) => {
    setFormData((prev) => ({ ...prev, headquarters }));
  }, []);

  const handleWebsiteChange = useCallback((website: string) => {
    setFormData((prev) => ({ ...prev, website }));
  }, []);

  const handleDescriptionChange = useCallback((description: string) => {
    setFormData((prev) => ({ ...prev, description }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const toggleIndustry = useCallback((industry: string) => {
    setFormData((prev) => ({
      ...prev,
      industryFocus: prev.industryFocus.includes(industry)
        ? prev.industryFocus.filter((i) => i !== industry)
        : [...prev.industryFocus, industry],
    }));
  }, []);

  const toggleGeography = useCallback((geography: string) => {
    setFormData((prev) => ({
      ...prev,
      geographyFocus: prev.geographyFocus.includes(geography)
        ? prev.geographyFocus.filter((g) => g !== geography)
        : [...prev.geographyFocus, geography],
    }));
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
          <ModalTitle>Add New Organization</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* Name and Slug */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="org-name" className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="input w-full"
                  placeholder="Blackstone"
                  required
                />
              </div>
              <div>
                <label htmlFor="org-slug" className="block text-sm font-medium text-slate-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="org-slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  className="input w-full"
                  placeholder="blackstone"
                  required
                />
              </div>
            </div>

            {/* Type and SubType */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="org-type" className="block text-sm font-medium text-slate-700 mb-1">
                  Type
                </label>
                <select
                  id="org-type"
                  value={formData.type}
                  onChange={(e) => handleTypeChange(e.target.value as OrganizationType)}
                  className="input w-full"
                >
                  {ALL_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="org-subtype" className="block text-sm font-medium text-slate-700 mb-1">
                  Sub-Type
                </label>
                <select
                  id="org-subtype"
                  value={formData.subType || ''}
                  onChange={(e) => handleSubTypeChange(e.target.value as OrganizationSubType || undefined)}
                  className="input w-full"
                >
                  <option value="">Select sub-type</option>
                  {ALL_SUBTYPES.map((subType) => (
                    <option key={subType} value={subType}>
                      {SUBTYPE_LABELS[subType]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* AUM and Headquarters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="org-aum" className="block text-sm font-medium text-slate-700 mb-1">
                  AUM (USD)
                </label>
                <input
                  id="org-aum"
                  type="number"
                  value={formData.aum || ''}
                  onChange={(e) => handleAumChange(e.target.value ? Number(e.target.value) : undefined)}
                  className="input w-full"
                  placeholder="1000000000"
                />
              </div>
              <div>
                <label htmlFor="org-hq" className="block text-sm font-medium text-slate-700 mb-1">
                  Headquarters
                </label>
                <input
                  id="org-hq"
                  type="text"
                  value={formData.headquarters}
                  onChange={(e) => handleHeadquartersChange(e.target.value)}
                  className="input w-full"
                  placeholder="New York, NY"
                />
              </div>
            </div>

            {/* Website */}
            <div>
              <label htmlFor="org-website" className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <input
                id="org-website"
                type="url"
                value={formData.website}
                onChange={(e) => handleWebsiteChange(e.target.value)}
                className="input w-full"
                placeholder="https://www.example.com"
              />
            </div>

            {/* Industry Focus */}
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Industry Focus
              </span>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => toggleIndustry(sector)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      formData.industryFocus.includes(sector)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Geography Focus */}
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Geography Focus
              </span>
              <div className="flex flex-wrap gap-2">
                {GEOGRAPHIES.map((geo) => (
                  <button
                    key={geo}
                    type="button"
                    onClick={() => toggleGeography(geo)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      formData.geographyFocus.includes(geo)
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {geo}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="org-description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="org-description"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="input w-full"
                rows={3}
                placeholder="Brief description of the organization..."
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
                Create Organization
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
});
