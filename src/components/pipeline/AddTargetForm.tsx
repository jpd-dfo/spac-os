'use client';

import { useState, useCallback } from 'react';

import {
  X,
  Building2,
  DollarSign,
  FileText,
  Upload,
  Plus,
  Trash2,
  Info,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

import type { PipelineStage } from './TargetCard';

// ============================================================================
// Types
// ============================================================================

export interface NewTargetData {
  name: string;
  industry: string;
  subIndustry?: string;
  description: string;
  headquarters?: string;
  website?: string;
  foundedYear?: number;
  employeeCount?: number;
  estimatedValuation: number;
  source: 'inbound' | 'referral' | 'research' | 'banker';
  sourceDetails?: string;
  initialNotes: string;
  tags: string[];
  files: File[];
  stage: PipelineStage;
}

interface AddTargetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewTargetData) => void;
  initialStage?: PipelineStage;
  isSubmitting?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const HEALTHCARE_INDUSTRIES = [
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'biotechnology', label: 'Biotechnology' },
  { value: 'medical_devices', label: 'Medical Devices' },
  { value: 'pharmaceuticals', label: 'Pharmaceuticals' },
  { value: 'healthcare_it', label: 'Healthcare IT' },
  { value: 'healthcare_services', label: 'Healthcare Services' },
  { value: 'diagnostics', label: 'Diagnostics' },
  { value: 'life_sciences', label: 'Life Sciences' },
  { value: 'digital_health', label: 'Digital Health' },
  { value: 'telehealth', label: 'Telehealth' },
];

const SUB_INDUSTRIES: Record<string, { value: string; label: string }[]> = {
  healthcare: [
    { value: 'hospitals', label: 'Hospitals & Health Systems' },
    { value: 'clinics', label: 'Outpatient Clinics' },
    { value: 'home_health', label: 'Home Health Services' },
    { value: 'behavioral', label: 'Behavioral Health' },
  ],
  biotechnology: [
    { value: 'gene_therapy', label: 'Gene Therapy' },
    { value: 'cell_therapy', label: 'Cell Therapy' },
    { value: 'biologics', label: 'Biologics' },
    { value: 'vaccines', label: 'Vaccines' },
  ],
  medical_devices: [
    { value: 'surgical', label: 'Surgical Devices' },
    { value: 'diagnostic_imaging', label: 'Diagnostic Imaging' },
    { value: 'orthopedic', label: 'Orthopedic Devices' },
    { value: 'cardiovascular', label: 'Cardiovascular Devices' },
  ],
  pharmaceuticals: [
    { value: 'specialty', label: 'Specialty Pharma' },
    { value: 'generic', label: 'Generic Drugs' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'cns', label: 'CNS Therapeutics' },
  ],
  healthcare_it: [
    { value: 'ehr', label: 'EHR/EMR Systems' },
    { value: 'analytics', label: 'Healthcare Analytics' },
    { value: 'revenue_cycle', label: 'Revenue Cycle Management' },
    { value: 'interoperability', label: 'Interoperability Solutions' },
  ],
};

const SOURCE_OPTIONS = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'referral', label: 'Referral' },
  { value: 'research', label: 'Research' },
  { value: 'banker', label: 'Banker' },
];

const VALUATION_PRESETS = [
  { label: '$100M', value: 100000000 },
  { label: '$250M', value: 250000000 },
  { label: '$500M', value: 500000000 },
  { label: '$750M', value: 750000000 },
  { label: '$1B', value: 1000000000 },
  { label: '$1.5B', value: 1500000000 },
];

// ============================================================================
// Helper Components
// ============================================================================

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}

function FormSection({ title, description, icon: Icon, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {Icon && <Icon className="h-4 w-4 text-slate-500" />}
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

function FileUpload({ files, onFilesChange, maxFiles = 10, acceptedTypes = ['.pdf', '.docx', '.xlsx', '.pptx'] }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      const newFiles = [...files, ...droppedFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    },
    [files, maxFiles, onFilesChange]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        const newFiles = [...files, ...selectedFiles].slice(0, maxFiles);
        onFilesChange(newFiles);
      }
    },
    [files, maxFiles, onFilesChange]
  );

  const removeFile = useCallback(
    (index: number) => {
      const newFiles = files.filter((_, i) => i !== index);
      onFilesChange(newFiles);
    },
    [files, onFilesChange]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragOver
            ? 'border-primary-400 bg-primary-50'
            : 'border-slate-300 hover:border-slate-400'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 text-slate-400" />
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {acceptedTypes.join(', ')} (max {maxFiles} files)
        </p>
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 flex-shrink-0 text-slate-400" />
                <span className="truncate text-sm text-slate-700">{file.name}</span>
                <span className="text-xs text-slate-400">({formatFileSize(file.size)})</span>
              </div>
              <button
                type="button"
                onClick={() => removeFile(index)}
                className="rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

function TagInput({ tags, onTagsChange, placeholder = 'Add tags...', suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = useCallback(
    (tag: string) => {
      const normalizedTag = tag.trim().toLowerCase();
      if (normalizedTag && !tags.includes(normalizedTag)) {
        onTagsChange([...tags, normalizedTag]);
      }
      setInputValue('');
    },
    [tags, onTagsChange]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      onTagsChange(tags.filter((tag) => tag !== tagToRemove));
    },
    [tags, onTagsChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && inputValue) {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
        const lastTag = tags[tags.length - 1];
        if (lastTag) {
          removeTag(lastTag);
        }
      }
    },
    [inputValue, tags, addTag, removeTag]
  );

  const defaultSuggestions = [
    'high-growth',
    'recurring-revenue',
    'saas',
    'platform',
    'market-leader',
    'expansion-ready',
    'management-team',
    'strategic-fit',
  ];

  const availableSuggestions = (suggestions.length > 0 ? suggestions : defaultSuggestions)
    .filter((s) => !tags.includes(s))
    .slice(0, 6);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-2">
        {tags.map((tag) => (
          <Badge key={tag} variant="primary" size="sm" className="flex items-center gap-1">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 rounded-full hover:bg-primary-200"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="min-w-[120px] flex-1 border-none bg-transparent text-sm focus:outline-none"
        />
      </div>
      {availableSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-slate-400">Suggestions:</span>
          {availableSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
            >
              + {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AddTargetForm({
  isOpen,
  onClose,
  onSubmit,
  initialStage = 'sourcing',
  isSubmitting = false,
}: AddTargetFormProps) {
  const [formData, setFormData] = useState<NewTargetData>({
    name: '',
    industry: '',
    subIndustry: '',
    description: '',
    headquarters: '',
    website: '',
    foundedYear: undefined,
    employeeCount: undefined,
    estimatedValuation: 500000000,
    source: 'research',
    sourceDetails: '',
    initialNotes: '',
    tags: [],
    files: [],
    stage: initialStage,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NewTargetData, string>>>({});

  const updateField = useCallback(
    <K extends keyof NewTargetData>(field: K, value: NewTargetData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [errors]
  );

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof NewTargetData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    if (!formData.industry) {
      newErrors.industry = 'Industry is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (formData.estimatedValuation <= 0) {
      newErrors.estimatedValuation = 'Valid valuation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validateForm()) {
        onSubmit(formData);
      }
    },
    [formData, validateForm, onSubmit]
  );

  const handleClose = useCallback(() => {
    setFormData({
      name: '',
      industry: '',
      subIndustry: '',
      description: '',
      headquarters: '',
      website: '',
      foundedYear: undefined,
      employeeCount: undefined,
      estimatedValuation: 500000000,
      source: 'research',
      sourceDetails: '',
      initialNotes: '',
      tags: [],
      files: [],
      stage: initialStage,
    });
    setErrors({});
    onClose();
  }, [initialStage, onClose]);

  const availableSubIndustries = SUB_INDUSTRIES[formData.industry] || [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="full">
      <ModalHeader>
        <ModalTitle>Add New Target</ModalTitle>
      </ModalHeader>
      <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
        <div className="flex-1 overflow-y-auto px-1 space-y-8">
          {/* Company Information */}
          <FormSection
            title="Company Information"
            description="Basic details about the target company"
            icon={Building2}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Company Name"
                placeholder="e.g., MedTech Innovations Inc."
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                error={errors.name}
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Select
                    label="Industry"
                    options={HEALTHCARE_INDUSTRIES}
                    value={formData.industry}
                    onChange={(e) => {
                      updateField('industry', e.target.value);
                      updateField('subIndustry', '');
                    }}
                    placeholder="Select industry"
                    error={errors.industry}
                  />
                </div>
                {availableSubIndustries.length > 0 && (
                  <div className="flex-1">
                    <Select
                      label="Sub-Industry"
                      options={availableSubIndustries}
                      value={formData.subIndustry || ''}
                      onChange={(e) => updateField('subIndustry', e.target.value)}
                      placeholder="Select sub-industry"
                    />
                  </div>
                )}
              </div>
              <Input
                label="Headquarters"
                placeholder="e.g., Boston, MA"
                value={formData.headquarters || ''}
                onChange={(e) => updateField('headquarters', e.target.value)}
              />
              <Input
                label="Website"
                placeholder="e.g., https://www.company.com"
                value={formData.website || ''}
                onChange={(e) => updateField('website', e.target.value)}
              />
              <Input
                label="Founded Year"
                type="number"
                placeholder="e.g., 2015"
                value={formData.foundedYear || ''}
                onChange={(e) => updateField('foundedYear', parseInt(e.target.value) || undefined)}
              />
              <Input
                label="Employee Count"
                type="number"
                placeholder="e.g., 250"
                value={formData.employeeCount || ''}
                onChange={(e) => updateField('employeeCount', parseInt(e.target.value) || undefined)}
              />
            </div>
            <Textarea
              label="Company Description"
              placeholder="Brief description of the company, its products/services, and market position..."
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              error={errors.description}
              className="min-h-[100px]"
            />
          </FormSection>

          {/* Valuation */}
          <FormSection
            title="Estimated Valuation"
            description="Initial enterprise value estimate"
            icon={DollarSign}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  value={formData.estimatedValuation}
                  onChange={(e) => updateField('estimatedValuation', parseInt(e.target.value) || 0)}
                  error={errors.estimatedValuation}
                  className="w-48"
                />
                <span className="text-sm text-slate-500">
                  ${(formData.estimatedValuation / 1000000).toFixed(0)}M
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {VALUATION_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => updateField('estimatedValuation', preset.value)}
                    className={cn(
                      'rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      formData.estimatedValuation === preset.value
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* Source */}
          <FormSection title="Source" description="How this target was identified">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Source Type"
                options={SOURCE_OPTIONS}
                value={formData.source}
                onChange={(e) => updateField('source', e.target.value as NewTargetData['source'])}
              />
              <Input
                label="Source Details"
                placeholder="e.g., Referred by John Smith at Goldman"
                value={formData.sourceDetails || ''}
                onChange={(e) => updateField('sourceDetails', e.target.value)}
              />
            </div>
          </FormSection>

          {/* Initial Notes */}
          <FormSection title="Initial Notes" description="Your initial thoughts and observations">
            <Textarea
              placeholder="Initial assessment, key observations, reasons for interest..."
              value={formData.initialNotes}
              onChange={(e) => updateField('initialNotes', e.target.value)}
              className="min-h-[120px]"
            />
          </FormSection>

          {/* Tags */}
          <FormSection title="Tags" description="Add tags to help categorize and find this target">
            <TagInput
              tags={formData.tags}
              onTagsChange={(tags) => updateField('tags', tags)}
            />
          </FormSection>

          {/* File Upload */}
          <FormSection
            title="Materials"
            description="Upload any relevant documents (presentations, financials, etc.)"
            icon={FileText}
          >
            <FileUpload
              files={formData.files}
              onFilesChange={(files) => updateField('files', files)}
            />
          </FormSection>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Info className="h-4 w-4" />
            <span>Target will be added to <strong>{initialStage.replace('_', ' ')}</strong> stage</span>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              <Plus className="mr-2 h-4 w-4" />
              Add Target
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
