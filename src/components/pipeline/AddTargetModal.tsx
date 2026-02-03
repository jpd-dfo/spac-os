'use client';

import { useState, useCallback } from 'react';

import { Plus, X, Building2, DollarSign, Briefcase } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { SECTORS, TARGET_STATUS_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { TargetStatus } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface NewTargetFormData {
  name: string;
  industry: string;
  description: string;
  headquarters: string;
  website: string;
  enterpriseValue: number;
  ltmRevenue: number | null;
  ltmEbitda: number | null;
  status: TargetStatus;
}

interface AddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewTargetFormData) => void | Promise<void>;
  initialStatus?: TargetStatus;
  isSubmitting?: boolean;
  title?: string;
}

// ============================================================================
// Industry Options
// ============================================================================

const INDUSTRY_OPTIONS = SECTORS.map((sector) => ({
  value: sector,
  label: sector,
}));

// ============================================================================
// Status Options
// ============================================================================

const STATUS_OPTIONS = Object.entries(TARGET_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

// ============================================================================
// Valuation Presets
// ============================================================================

const VALUATION_PRESETS = [
  { label: '$100M', value: 100000000 },
  { label: '$250M', value: 250000000 },
  { label: '$500M', value: 500000000 },
  { label: '$1B', value: 1000000000 },
];

// ============================================================================
// Main Component
// ============================================================================

export function AddTargetModal({
  isOpen,
  onClose,
  onSubmit,
  initialStatus = 'IDENTIFIED',
  isSubmitting = false,
  title = 'Add New Target',
}: AddTargetModalProps) {
  const [formData, setFormData] = useState<NewTargetFormData>({
    name: '',
    industry: '',
    description: '',
    headquarters: '',
    website: '',
    enterpriseValue: 500000000,
    ltmRevenue: null,
    ltmEbitda: null,
    status: initialStatus,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewTargetFormData, string>>>({});

  // Update field helper
  const updateField = useCallback(
    <K extends keyof NewTargetFormData>(field: K, value: NewTargetFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when field is updated
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  // Validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof NewTargetFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Target name is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (formData.enterpriseValue <= 0) {
      newErrors.enterpriseValue = 'Enterprise value must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle submit
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      await onSubmit(formData);
    },
    [formData, validateForm, onSubmit]
  );

  // Handle close with reset
  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      industry: '',
      description: '',
      headquarters: '',
      website: '',
      enterpriseValue: 500000000,
      ltmRevenue: null,
      ltmEbitda: null,
      status: initialStatus,
    });
    setErrors({});
    onClose();
  }, [initialStatus, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="lg"
    >
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        <p className="mt-1 text-sm text-slate-500">Add a new acquisition target to the pipeline</p>
      </ModalHeader>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Building2 className="h-4 w-4 text-slate-500" />
            Basic Information
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Target Name *"
              placeholder="e.g., TechCorp Inc."
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              error={errors.name}
            />

            <Select
              label="Industry *"
              options={INDUSTRY_OPTIONS}
              value={formData.industry}
              onChange={(e) => updateField('industry', e.target.value)}
              placeholder="Select industry"
              error={errors.industry}
            />

            <Input
              label="Headquarters"
              placeholder="e.g., San Francisco, CA"
              value={formData.headquarters}
              onChange={(e) => updateField('headquarters', e.target.value)}
            />

            <Input
              label="Website"
              placeholder="e.g., https://www.company.com"
              value={formData.website}
              onChange={(e) => updateField('website', e.target.value)}
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Brief description of the company..."
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
        </div>

        {/* Financial Information */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <DollarSign className="h-4 w-4 text-slate-500" />
            Financial Information
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Enterprise Value *
            </span>
            <div className="space-y-2">
              <Input
                type="number"
                value={formData.enterpriseValue}
                onChange={(e) => updateField('enterpriseValue', parseInt(e.target.value) || 0)}
                error={errors.enterpriseValue}
              />
              <div className="flex flex-wrap gap-2">
                {VALUATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateField('enterpriseValue', preset.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                      formData.enterpriseValue === preset.value
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="LTM Revenue"
              type="number"
              placeholder="e.g., 50000000"
              value={formData.ltmRevenue ?? ''}
              onChange={(e) => updateField('ltmRevenue', e.target.value ? parseInt(e.target.value) : null)}
              helperText="Last twelve months revenue"
            />

            <Input
              label="LTM EBITDA"
              type="number"
              placeholder="e.g., 10000000"
              value={formData.ltmEbitda ?? ''}
              onChange={(e) => updateField('ltmEbitda', e.target.value ? parseInt(e.target.value) : null)}
              helperText="Last twelve months EBITDA"
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Briefcase className="h-4 w-4 text-slate-500" />
            Pipeline Status
          </div>

          <Select
            label="Initial Status"
            options={STATUS_OPTIONS}
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as TargetStatus)}
            helperText="The initial stage for this target in the pipeline"
          />
        </div>

        {/* Footer */}
        <ModalFooter className="border-t-0 px-0 pb-0">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <Plus className="mr-2 h-4 w-4" />
            Add Target
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

// ============================================================================
// Quick Add Target Modal (Simplified Version)
// ============================================================================

interface QuickAddTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; industry: string; enterpriseValue: number; status: TargetStatus }) => void | Promise<void>;
  initialStatus?: TargetStatus;
  isSubmitting?: boolean;
}

export function QuickAddTargetModal({
  isOpen,
  onClose,
  onSubmit,
  initialStatus = 'IDENTIFIED',
  isSubmitting = false,
}: QuickAddTargetModalProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [enterpriseValue, setEnterpriseValue] = useState(500000000);
  const [errors, setErrors] = useState<{ name?: string; industry?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: typeof errors = {};
    if (!name.trim()) {newErrors.name = 'Name is required';}
    if (!industry) {newErrors.industry = 'Industry is required';}

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      name,
      industry,
      enterpriseValue,
      status: initialStatus,
    });

    // Reset form
    setName('');
    setIndustry('');
    setEnterpriseValue(500000000);
    setErrors({});
  };

  const handleClose = () => {
    setName('');
    setIndustry('');
    setEnterpriseValue(500000000);
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
    >
      <ModalHeader>
        <ModalTitle>Quick Add Target</ModalTitle>
      </ModalHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Target Name *"
          placeholder="Company name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) {setErrors((prev) => ({ ...prev, name: undefined }));}
          }}
          error={errors.name}
        />

        <Select
          label="Industry *"
          options={INDUSTRY_OPTIONS}
          value={industry}
          onChange={(e) => {
            setIndustry(e.target.value);
            if (errors.industry) {setErrors((prev) => ({ ...prev, industry: undefined }));}
          }}
          placeholder="Select industry"
          error={errors.industry}
        />

        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1.5">
            Enterprise Value
          </span>
          <div className="flex flex-wrap gap-2">
            {VALUATION_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setEnterpriseValue(preset.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  enterpriseValue === preset.value
                    ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <span className="text-xs text-slate-500">
            Adding to: <span className="font-medium">{TARGET_STATUS_LABELS[initialStatus]}</span>
          </span>
        </div>

        <ModalFooter className="border-t-0 px-0 pb-0 pt-2">
          <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Add
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
