'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Building2,
  Globe,
  MapPin,
  Users,
  DollarSign,
  Calendar,
  Tag,
  Plus,
  X,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { SECTORS } from '@/lib/constants';
import type { Deal, PipelineStage, DealAssignee } from './types';
import { DEFAULT_PIPELINE_STAGES } from './types';
import { DealStage, TargetStatus, TaskPriority } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface AddDealFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DealFormData) => void | Promise<void>;
  initialStage?: DealStage;
  stages?: PipelineStage[];
  availableAssignees?: DealAssignee[];
  isLoading?: boolean;
  editDeal?: Deal | null;
}

export interface DealFormData {
  name: string;
  legalName?: string;
  description?: string;
  website?: string;
  sector: string;
  industry?: string;
  stage: DealStage;
  status: TargetStatus;
  priority: TaskPriority;
  headquarters?: string;
  region?: string;
  foundedYear?: number;
  employeeCount?: number;
  enterpriseValue?: number;
  equityValue?: number;
  ltmRevenue?: number;
  ltmEbitda?: number;
  probability?: number;
  targetCloseDate?: string;
  assigneeIds: string[];
  leadAssigneeId?: string;
  tags: string[];
  investmentHighlights: string[];
  keyRisks: string[];
  notes?: string;
}

type FormStep = 'basic' | 'financials' | 'team' | 'details';

// ============================================================================
// Form Section Component
// ============================================================================

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-slate-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}

// ============================================================================
// Tag Input Component
// ============================================================================

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
}

function TagInput({ value, onChange, placeholder = 'Add tag...', label }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="flex flex-wrap gap-2 rounded-md border border-slate-200 bg-white p-2">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" size="sm">
            {tag}
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="ml-1 hover:text-danger-600"
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
          onBlur={handleAdd}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 border-0 bg-transparent p-1 text-sm outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  );
}

// ============================================================================
// List Input Component
// ============================================================================

interface ListInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ReactNode;
}

function ListInput({ value, onChange, placeholder = 'Add item...', label, icon }: ListInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim()) {
      onChange([...value, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="space-y-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
          >
            {icon}
            <span className="flex-1 text-sm text-slate-700">{item}</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="text-slate-400 hover:text-danger-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
            placeholder={placeholder}
            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <Button type="button" variant="secondary" size="md" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Step Indicator
// ============================================================================

interface StepIndicatorProps {
  steps: { key: FormStep; label: string }[];
  currentStep: FormStep;
  onStepClick: (step: FormStep) => void;
  completedSteps: Set<FormStep>;
}

function StepIndicator({ steps, currentStep, onStepClick, completedSteps }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <button
            type="button"
            onClick={() => onStepClick(step.key)}
            className={cn(
              'flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors',
              currentStep === step.key
                ? 'bg-primary-100 text-primary-700'
                : completedSteps.has(step.key)
                  ? 'bg-success-100 text-success-700'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            )}
          >
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-xs',
                currentStep === step.key
                  ? 'bg-primary-600 text-white'
                  : completedSteps.has(step.key)
                    ? 'bg-success-600 text-white'
                    : 'bg-slate-300 text-white'
              )}
            >
              {index + 1}
            </span>
            {step.label}
          </button>
          {index < steps.length - 1 && <div className="mx-2 h-px w-8 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function AddDealForm({
  isOpen,
  onClose,
  onSubmit,
  initialStage = 'ORIGINATION',
  stages = DEFAULT_PIPELINE_STAGES,
  availableAssignees = [],
  isLoading = false,
  editDeal,
}: AddDealFormProps) {
  const [currentStep, setCurrentStep] = useState<FormStep>('basic');
  const [completedSteps, setCompletedSteps] = useState<Set<FormStep>>(new Set());

  const isEditing = !!editDeal;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<DealFormData>({
    defaultValues: editDeal
      ? {
          name: editDeal.name,
          legalName: editDeal.legalName || '',
          description: editDeal.description || '',
          website: editDeal.website || '',
          sector: editDeal.sector,
          industry: editDeal.industry || '',
          stage: editDeal.stage,
          status: editDeal.status,
          priority: editDeal.priority,
          headquarters: editDeal.headquarters || '',
          region: editDeal.region || '',
          foundedYear: editDeal.foundedYear,
          employeeCount: editDeal.employeeCount,
          enterpriseValue: editDeal.enterpriseValue,
          equityValue: editDeal.equityValue,
          ltmRevenue: editDeal.ltmRevenue,
          ltmEbitda: editDeal.ltmEbitda,
          probability: editDeal.probability,
          targetCloseDate: editDeal.targetCloseDate
            ? new Date(editDeal.targetCloseDate).toISOString().split('T')[0]
            : '',
          assigneeIds: editDeal.assignees?.map((a) => a.id) || [],
          leadAssigneeId: editDeal.leadAssignee?.id || '',
          tags: editDeal.tags || [],
          investmentHighlights: editDeal.investmentHighlights || [],
          keyRisks: editDeal.keyRisks || [],
          notes: editDeal.notes || '',
        }
      : {
          name: '',
          sector: '',
          stage: initialStage,
          status: 'IDENTIFIED',
          priority: 'MEDIUM',
          assigneeIds: [],
          tags: [],
          investmentHighlights: [],
          keyRisks: [],
        },
  });

  const steps: { key: FormStep; label: string }[] = [
    { key: 'basic', label: 'Basic Info' },
    { key: 'financials', label: 'Financials' },
    { key: 'team', label: 'Team' },
    { key: 'details', label: 'Details' },
  ];

  const handleStepChange = (step: FormStep) => {
    // Mark current step as completed if moving forward
    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    const newIndex = steps.findIndex((s) => s.key === step);
    if (newIndex > currentIndex) {
      setCompletedSteps((prev) => new Set([...prev, currentStep]));
    }
    setCurrentStep(step);
  };

  const handleNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    if (currentIndex < steps.length - 1) {
      handleStepChange(steps[currentIndex + 1].key);
    }
  };

  const handlePrevStep = () => {
    const currentIndex = steps.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      handleStepChange(steps[currentIndex - 1].key);
    }
  };

  const onFormSubmit = async (data: DealFormData) => {
    await onSubmit(data);
    reset();
    setCurrentStep('basic');
    setCompletedSteps(new Set());
    onClose();
  };

  const handleClose = () => {
    reset();
    setCurrentStep('basic');
    setCompletedSteps(new Set());
    onClose();
  };

  const sectorOptions = SECTORS.map((s) => ({ value: s, label: s }));
  const stageOptions = stages.map((s) => ({ value: s.key, label: s.name }));
  const statusOptions = [
    { value: 'IDENTIFIED', label: 'Identified' },
    { value: 'INITIAL_CONTACT', label: 'Initial Contact' },
    { value: 'NDA_SIGNED', label: 'NDA Signed' },
    { value: 'DATA_ROOM_ACCESS', label: 'Data Room Access' },
    { value: 'MANAGEMENT_MEETING', label: 'Management Meeting' },
    { value: 'VALUATION_ONGOING', label: 'Valuation Ongoing' },
    { value: 'TERM_SHEET', label: 'Term Sheet' },
    { value: 'LOI', label: 'LOI' },
  ];
  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ];
  const assigneeOptions = availableAssignees.map((a) => ({ value: a.id, label: a.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? 'Edit Deal' : 'Add New Deal'}
      description={isEditing ? 'Update deal information' : 'Enter the target company details'}
      size="full"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Step Indicator */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={handleStepChange}
          completedSteps={completedSteps}
        />

        {/* Form Content */}
        <div className="max-h-[50vh] overflow-y-auto pr-2">
          {/* Basic Info Step */}
          {currentStep === 'basic' && (
            <div className="space-y-6">
              <FormSection title="Company Information" description="Basic details about the target company">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Company Name *"
                    placeholder="Enter company name"
                    error={errors.name?.message}
                    {...register('name', { required: 'Company name is required' })}
                  />
                  <Input
                    label="Legal Name"
                    placeholder="Enter legal entity name"
                    {...register('legalName')}
                  />
                </div>
                <Textarea
                  label="Description"
                  placeholder="Brief description of the company"
                  {...register('description')}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Website"
                    placeholder="https://company.com"
                    {...register('website')}
                  />
                  <Input
                    label="Headquarters"
                    placeholder="City, State"
                    {...register('headquarters')}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select
                    label="Sector *"
                    options={sectorOptions}
                    placeholder="Select sector"
                    error={errors.sector?.message}
                    {...register('sector', { required: 'Sector is required' })}
                  />
                  <Input
                    label="Industry"
                    placeholder="Specific industry"
                    {...register('industry')}
                  />
                  <Input
                    label="Region"
                    placeholder="Geographic region"
                    {...register('region')}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Founded Year"
                    type="number"
                    placeholder="YYYY"
                    {...register('foundedYear', { valueAsNumber: true })}
                  />
                  <Input
                    label="Employee Count"
                    type="number"
                    placeholder="Number of employees"
                    {...register('employeeCount', { valueAsNumber: true })}
                  />
                </div>
              </FormSection>

              <FormSection title="Deal Status" description="Current stage and priority">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Select
                    label="Stage"
                    options={stageOptions}
                    {...register('stage')}
                  />
                  <Select
                    label="Status"
                    options={statusOptions}
                    {...register('status')}
                  />
                  <Select
                    label="Priority"
                    options={priorityOptions}
                    {...register('priority')}
                  />
                </div>
              </FormSection>
            </div>
          )}

          {/* Financials Step */}
          {currentStep === 'financials' && (
            <div className="space-y-6">
              <FormSection title="Valuation" description="Enterprise and equity values">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Enterprise Value ($)"
                    type="number"
                    placeholder="Enter enterprise value"
                    {...register('enterpriseValue', { valueAsNumber: true })}
                  />
                  <Input
                    label="Equity Value ($)"
                    type="number"
                    placeholder="Enter equity value"
                    {...register('equityValue', { valueAsNumber: true })}
                  />
                </div>
              </FormSection>

              <FormSection title="Financial Performance" description="Revenue and EBITDA figures">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="LTM Revenue ($)"
                    type="number"
                    placeholder="Last twelve months revenue"
                    {...register('ltmRevenue', { valueAsNumber: true })}
                  />
                  <Input
                    label="LTM EBITDA ($)"
                    type="number"
                    placeholder="Last twelve months EBITDA"
                    {...register('ltmEbitda', { valueAsNumber: true })}
                  />
                </div>
              </FormSection>

              <FormSection title="Deal Probability" description="Likelihood of deal completion">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Win Probability (%)"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="0-100"
                    {...register('probability', { valueAsNumber: true, min: 0, max: 100 })}
                  />
                  <Input
                    label="Target Close Date"
                    type="date"
                    {...register('targetCloseDate')}
                  />
                </div>
              </FormSection>
            </div>
          )}

          {/* Team Step */}
          {currentStep === 'team' && (
            <div className="space-y-6">
              <FormSection title="Deal Team" description="Assign team members to this deal">
                {availableAssignees.length > 0 ? (
                  <div className="space-y-4">
                    <Select
                      label="Lead Assignee"
                      options={[{ value: '', label: 'Select lead...' }, ...assigneeOptions]}
                      {...register('leadAssigneeId')}
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Team Members
                      </label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {availableAssignees.map((assignee) => (
                          <Controller
                            key={assignee.id}
                            name="assigneeIds"
                            control={control}
                            render={({ field }) => (
                              <label
                                className={cn(
                                  'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
                                  field.value?.includes(assignee.id)
                                    ? 'border-primary-300 bg-primary-50'
                                    : 'border-slate-200 hover:bg-slate-50'
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={field.value?.includes(assignee.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      field.onChange([...(field.value || []), assignee.id]);
                                    } else {
                                      field.onChange(
                                        (field.value || []).filter((id: string) => id !== assignee.id)
                                      );
                                    }
                                  }}
                                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                />
                                <div>
                                  <p className="text-sm font-medium text-slate-900">
                                    {assignee.name}
                                  </p>
                                  <p className="text-xs text-slate-500">{assignee.email}</p>
                                </div>
                              </label>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-slate-400" />
                    <p className="text-sm text-slate-600">No team members available</p>
                    <p className="text-xs text-slate-500">
                      Add team members in settings to assign them to deals
                    </p>
                  </div>
                )}
              </FormSection>
            </div>
          )}

          {/* Details Step */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <FormSection title="Tags" description="Add tags for easier filtering">
                <Controller
                  name="tags"
                  control={control}
                  render={({ field }) => (
                    <TagInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add tags..."
                    />
                  )}
                />
              </FormSection>

              <FormSection title="Investment Highlights" description="Key reasons to pursue this deal">
                <Controller
                  name="investmentHighlights"
                  control={control}
                  render={({ field }) => (
                    <ListInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add investment highlight..."
                      icon={<Info className="h-4 w-4 text-success-500" />}
                    />
                  )}
                />
              </FormSection>

              <FormSection title="Key Risks" description="Important risks to consider">
                <Controller
                  name="keyRisks"
                  control={control}
                  render={({ field }) => (
                    <ListInput
                      value={field.value || []}
                      onChange={field.onChange}
                      placeholder="Add key risk..."
                      icon={<AlertCircle className="h-4 w-4 text-warning-500" />}
                    />
                  )}
                />
              </FormSection>

              <FormSection title="Notes" description="Additional notes about the deal">
                <Textarea
                  placeholder="Enter any additional notes..."
                  rows={4}
                  {...register('notes')}
                />
              </FormSection>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <div>
            {currentStep !== 'basic' && (
              <Button type="button" variant="ghost" onClick={handlePrevStep}>
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep === 'details' ? (
              <Button type="submit" variant="primary" isLoading={isLoading}>
                {isEditing ? 'Save Changes' : 'Create Deal'}
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleNextStep}>
                Next
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
