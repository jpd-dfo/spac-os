'use client';

import { useState } from 'react';

import { format, addDays, addBusinessDays } from 'date-fns';
import {
  X,
  FileText,
  Calendar,
  User,
  Users,
  Paperclip,
  Bell,
  AlertTriangle,
  Plus,
  Trash2,
  Upload,
  Info,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FILING_DEFINITIONS } from '@/lib/compliance/complianceRules';
import { FILING_TYPE_LABELS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { FilingType } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface SPAC {
  id: string;
  name: string;
  ticker: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface NewFilingData {
  type: FilingType;
  title: string;
  description?: string;
  spacId: string;
  dueDate: Date;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assigneeId?: string;
  reviewerIds: string[];
  reminders: {
    days: number;
    enabled: boolean;
  }[];
  attachments: File[];
}

interface CreateFilingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: NewFilingData) => void;
  spacs: SPAC[];
  teamMembers: TeamMember[];
  isSubmitting?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const FILING_TYPES: FilingType[] = [
  'FORM_10K',
  'FORM_10Q',
  'FORM_8K',
  'S1',
  'S4',
  'DEF14A',
  'PREM14A',
  'DEFA14A',
  'SUPER_8K',
  'FORM_425',
  'SC_13D',
  'SC_13G',
  'FORM_3',
  'FORM_4',
  'FORM_5',
];

const PRIORITIES = [
  { value: 'CRITICAL', label: 'Critical', color: 'text-danger-600 bg-danger-100' },
  { value: 'HIGH', label: 'High', color: 'text-warning-600 bg-warning-100' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-primary-600 bg-primary-100' },
  { value: 'LOW', label: 'Low', color: 'text-slate-600 bg-slate-100' },
] as const;

const DEFAULT_REMINDERS = [
  { days: 30, enabled: true },
  { days: 14, enabled: true },
  { days: 7, enabled: true },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateFilingModal({
  isOpen,
  onClose,
  onSubmit,
  spacs,
  teamMembers,
  isSubmitting = false,
}: CreateFilingModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<NewFilingData>>({
    type: undefined,
    title: '',
    description: '',
    spacId: '',
    dueDate: addDays(new Date(), 30),
    priority: 'MEDIUM',
    assigneeId: '',
    reviewerIds: [],
    reminders: DEFAULT_REMINDERS,
    attachments: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) {return null;}

  const selectedFilingDef = formData.type ? FILING_DEFINITIONS[formData.type] : null;

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.type) {newErrors['type'] = 'Please select a filing type';}
      if (!formData.spacId) {newErrors['spacId'] = 'Please select a SPAC';}
    }

    if (stepNum === 2) {
      if (!formData.title?.trim()) {newErrors['title'] = 'Title is required';}
      if (!formData.dueDate) {newErrors['dueDate'] = 'Due date is required';}
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = () => {
    if (validateStep(3) && formData.type && formData.spacId && formData.dueDate && formData.title) {
      onSubmit({
        type: formData.type,
        title: formData.title,
        description: formData.description,
        spacId: formData.spacId,
        dueDate: formData.dueDate,
        priority: formData.priority || 'MEDIUM',
        assigneeId: formData.assigneeId,
        reviewerIds: formData.reviewerIds || [],
        reminders: formData.reminders || DEFAULT_REMINDERS,
        attachments: formData.attachments || [],
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setFormData({
        ...formData,
        attachments: [...(formData.attachments || []), ...Array.from(files)],
      });
    }
  };

  const removeAttachment = (index: number) => {
    setFormData({
      ...formData,
      attachments: formData.attachments?.filter((_, i) => i !== index) || [],
    });
  };

  const toggleReviewer = (reviewerId: string) => {
    const current = formData.reviewerIds || [];
    if (current.includes(reviewerId)) {
      setFormData({
        ...formData,
        reviewerIds: current.filter((id) => id !== reviewerId),
      });
    } else {
      setFormData({
        ...formData,
        reviewerIds: [...current, reviewerId],
      });
    }
  };

  const toggleReminder = (index: number) => {
    const reminders = [...(formData.reminders || DEFAULT_REMINDERS)];
    const current = reminders[index];
    if (current) {
      reminders[index] = { days: current.days, enabled: !current.enabled };
    }
    setFormData({ ...formData, reminders });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create New Filing</h2>
              <p className="text-sm text-slate-500">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-primary-500 transition-all"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6">
          {/* Step 1: Filing Type and SPAC */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="spac-select" className="block text-sm font-medium text-slate-700 mb-2">
                  Select SPAC <span className="text-danger-500">*</span>
                </label>
                <select
                  id="spac-select"
                  value={formData.spacId}
                  onChange={(e) => setFormData({ ...formData, spacId: e.target.value })}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors['spacId'] ? 'border-danger-300' : 'border-slate-200'
                  )}
                >
                  <option value="">Select a SPAC...</option>
                  {spacs.map((spac) => (
                    <option key={spac.id} value={spac.id}>
                      {spac.name} ({spac.ticker})
                    </option>
                  ))}
                </select>
                {errors['spacId'] && (
                  <p className="mt-1 text-sm text-danger-500">{errors['spacId']}</p>
                )}
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Filing Type <span className="text-danger-500">*</span>
                </span>
                {errors['type'] && (
                  <p className="mb-2 text-sm text-danger-500">{errors['type']}</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {FILING_TYPES.map((type) => {
                    const def = FILING_DEFINITIONS[type];
                    const isSelected = formData.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            type,
                            title: def?.name || FILING_TYPE_LABELS[type],
                          });
                        }}
                        className={cn(
                          'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <FileText
                          className={cn(
                            'h-5 w-5 mt-0.5',
                            isSelected ? 'text-primary-600' : 'text-slate-400'
                          )}
                        />
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isSelected ? 'text-primary-700' : 'text-slate-900'
                            )}
                          >
                            {FILING_TYPE_LABELS[type]}
                          </p>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {def?.description || ''}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filing Info Panel */}
              {selectedFilingDef && (
                <div className="rounded-lg border border-primary-200 bg-primary-50 p-4">
                  <div className="flex items-start gap-2">
                    <Info className="h-5 w-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary-700">
                        {selectedFilingDef.name}
                      </p>
                      <p className="mt-1 text-sm text-primary-600">
                        {selectedFilingDef.description}
                      </p>
                      {selectedFilingDef.deadlineDays && (
                        <p className="mt-2 text-xs text-primary-600">
                          <strong>Filing Deadline:</strong>{' '}
                          {selectedFilingDef.deadlineBusinessDays
                            ? `${selectedFilingDef.deadlineDays} business days`
                            : `${selectedFilingDef.deadlineDays} days`}
                          {' from triggering event'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="filing-title" className="block text-sm font-medium text-slate-700 mb-2">
                  Filing Title <span className="text-danger-500">*</span>
                </label>
                <input
                  id="filing-title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter filing title..."
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                    errors['title'] ? 'border-danger-300' : 'border-slate-200'
                  )}
                />
                {errors['title'] && (
                  <p className="mt-1 text-sm text-danger-500">{errors['title']}</p>
                )}
              </div>

              <div>
                <label htmlFor="filing-description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="filing-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="filing-due-date" className="block text-sm font-medium text-slate-700 mb-2">
                    Due Date <span className="text-danger-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="filing-due-date"
                      type="date"
                      value={formData.dueDate ? format(formData.dueDate, 'yyyy-MM-dd') : ''}
                      onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                      className={cn(
                        'w-full rounded-md border pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500',
                        errors['dueDate'] ? 'border-danger-300' : 'border-slate-200'
                      )}
                    />
                  </div>
                  {errors['dueDate'] && (
                    <p className="mt-1 text-sm text-danger-500">{errors['dueDate']}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="filing-priority" className="block text-sm font-medium text-slate-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="filing-priority"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        priority: e.target.value as NewFilingData['priority'],
                      })
                    }
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Attachments */}
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  Attachments
                </span>
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm text-slate-500">
                      Drag and drop files, or{' '}
                      <label className="cursor-pointer text-primary-600 hover:text-primary-700">
                        browse
                        <input
                          type="file"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </p>
                  </div>
                  {formData.attachments && formData.attachments.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {formData.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-700">{file.name}</span>
                          </div>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="text-slate-400 hover:text-danger-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Assignment & Reminders */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="filing-assignee" className="block text-sm font-medium text-slate-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Assign Responsible Party
                </label>
                <select
                  id="filing-assignee"
                  value={formData.assigneeId}
                  onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select assignee (optional)...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Add Reviewers
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {teamMembers.map((member) => {
                    const isSelected = formData.reviewerIds?.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleReviewer(member.id)}
                        className={cn(
                          'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                          isSelected
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium',
                            isSelected
                              ? 'bg-primary-500 text-white'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{member.name}</p>
                          <p className="text-xs text-slate-500">{member.role}</p>
                        </div>
                        {isSelected && (
                          <Badge variant="primary" size="sm">
                            Selected
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-2">
                  <Bell className="inline h-4 w-4 mr-1" />
                  Set Reminders
                </span>
                <div className="space-y-2">
                  {(formData.reminders || DEFAULT_REMINDERS).map((reminder, index) => (
                    <label
                      key={index}
                      className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={reminder.enabled}
                          onChange={() => toggleReminder(index)}
                          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700">
                          {reminder.days} days before deadline
                        </span>
                      </div>
                      {formData.dueDate && reminder.enabled && (
                        <span className="text-xs text-slate-500">
                          {format(addDays(formData.dueDate, -reminder.days), 'MMM d, yyyy')}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-slate-50 p-4">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Summary</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Filing Type:</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.type ? FILING_TYPE_LABELS[formData.type] : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">SPAC:</dt>
                    <dd className="font-medium text-slate-900">
                      {spacs.find((s) => s.id === formData.spacId)?.name || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Due Date:</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.dueDate ? format(formData.dueDate, 'MMMM d, yyyy') : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Priority:</dt>
                    <dd>
                      <Badge
                        variant={
                          formData.priority === 'CRITICAL'
                            ? 'danger'
                            : formData.priority === 'HIGH'
                            ? 'warning'
                            : formData.priority === 'MEDIUM'
                            ? 'primary'
                            : 'secondary'
                        }
                        size="sm"
                      >
                        {formData.priority}
                      </Badge>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Assignee:</dt>
                    <dd className="font-medium text-slate-900">
                      {teamMembers.find((m) => m.id === formData.assigneeId)?.name || 'Unassigned'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Reviewers:</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.reviewerIds && formData.reviewerIds.length > 0
                        ? formData.reviewerIds.length
                        : 'None'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Attachments:</dt>
                    <dd className="font-medium text-slate-900">
                      {formData.attachments?.length || 0} files
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
          <div>
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button onClick={handleNext}>Continue</Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                Create Filing
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateFilingModal;
