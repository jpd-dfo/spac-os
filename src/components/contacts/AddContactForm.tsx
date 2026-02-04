'use client';

import { useState } from 'react';

import {
  User,
  Building,
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Tag,
  FileText,
  Upload,
  X,
  Plus,
  Check,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { cn } from '@/lib/utils';

import type { ContactCategory, ExtendedContact } from './contact.types';

interface AddContactFormProps {
  onSubmit: (contact: Partial<ExtendedContact>) => void;
  onCancel: () => void;
  existingCompanies?: string[];
  isModal?: boolean;
}

const categories: ContactCategory[] = [
  'Founders',
  'Executives',
  'Advisors',
  'Bankers',
  'Lawyers',
  'Investors',
  'Accountants',
  'Board',
];

const suggestedTags = [
  'Priority',
  'PIPE Investor',
  'SPAC Counsel',
  'Target CEO',
  'Lead Advisor',
  'Due Diligence',
  'Board Member',
  'Sponsor',
  'Healthcare',
  'Technology',
  'CleanTech',
  'Fintech',
];

export function AddContactForm({
  onSubmit,
  onCancel,
  existingCompanies = [],
  isModal = false,
}: AddContactFormProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
    category: '' as ContactCategory | '',
    email: '',
    phone: '',
    mobile: '',
    linkedIn: '',
    city: '',
    state: '',
    country: 'USA',
    tags: [] as string[],
    notes: '',
    linkedInImport: false,
  });
  const [customTag, setCustomTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof typeof formData, value: string | string[] | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      updateField('tags', [...formData.tags, tag]);
    }
    setCustomTag('');
  };

  const removeTag = (tag: string) => {
    updateField('tags', formData.tags.filter((t) => t !== tag));
  };

  const validateStep = (stepNum: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepNum === 1) {
      if (!formData.firstName.trim()) {newErrors['firstName'] = 'First name is required';}
      if (!formData.lastName.trim()) {newErrors['lastName'] = 'Last name is required';}
      if (!formData.category) {newErrors['category'] = 'Please select a category';}
    }

    if (stepNum === 2) {
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors['email'] = 'Please enter a valid email address';
      }
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
    if (validateStep(step)) {
      const newContact: Partial<ExtendedContact> = {
        id: `contact-${Date.now()}`,
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        company: formData.company,
        companyId: '',
        category: formData.category as ContactCategory,
        email: formData.email,
        phone: formData.phone,
        mobile: formData.mobile,
        linkedIn: formData.linkedIn,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        tags: formData.tags,
        relationshipScore: 50, // Default score for new contacts
        lastInteraction: new Date().toISOString(),
        interactions: [],
        notes: formData.notes
          ? [
              {
                id: `note-${Date.now()}`,
                content: formData.notes,
                createdBy: 'Current User',
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
        linkedDeals: [],
        documents: [],
        meetings: [],
        createdAt: new Date().toISOString(),
      };
      onSubmit(newContact);
    }
  };

  const containerClass = isModal
    ? 'bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col'
    : 'bg-white rounded-xl border border-slate-200 shadow-sm';

  return (
    <div className={containerClass}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Add New Contact</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Step {step} of 3: {step === 1 ? 'Basic Info' : step === 2 ? 'Contact Details' : 'Tags & Notes'}
            </p>
          </div>
          {isModal && (
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'flex-1 h-1.5 rounded-full transition-colors',
                s <= step ? 'bg-primary-500' : 'bg-slate-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            {/* LinkedIn Import Option */}
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Import from LinkedIn</p>
                  <p className="text-xs text-blue-700">Auto-fill contact details from LinkedIn profile</p>
                </div>
              </div>
              <Button variant="secondary" size="sm">
                <Upload className="h-4 w-4 mr-1.5" />
                Import
              </Button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-slate-200" />
              <span className="flex-shrink mx-4 text-xs text-slate-400">or enter manually</span>
              <div className="flex-grow border-t border-slate-200" />
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  label="First Name *"
                  value={formData.firstName}
                  onChange={(e) => updateField('firstName', e.target.value)}
                  placeholder="John"
                  error={errors['firstName']}
                />
              </div>
              <div>
                <Input
                  label="Last Name *"
                  value={formData.lastName}
                  onChange={(e) => updateField('lastName', e.target.value)}
                  placeholder="Doe"
                  error={errors['lastName']}
                />
              </div>
            </div>

            {/* Title */}
            <Input
              label="Title"
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="e.g., Managing Director, CEO, Partner"
            />

            {/* Company */}
            <div>
              <label htmlFor="company-input" className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="company-input"
                  type="text"
                  value={formData.company}
                  onChange={(e) => updateField('company', e.target.value)}
                  placeholder="Company name"
                  className="input pl-10"
                  list="companies"
                />
                <datalist id="companies">
                  {existingCompanies.map((company) => (
                    <option key={company} value={company} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Category *</span>
              {errors['category'] && <p className="text-sm text-danger-600 mb-2">{errors['category']}</p>}
              <div className="grid grid-cols-4 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => updateField('category', cat)}
                    className={cn(
                      'px-3 py-2 text-sm rounded-lg border-2 transition-all',
                      formData.category === cat
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact Details */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email-input" className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email-input"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="john.doe@company.com"
                  className={cn('input pl-10', errors['email'] && 'border-danger-300')}
                />
              </div>
              {errors['email'] && <p className="text-sm text-danger-600 mt-1">{errors['email']}</p>}
            </div>

            {/* Phone Numbers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone-input" className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="phone-input"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="input pl-10"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="mobile-input" className="block text-sm font-medium text-slate-700 mb-1.5">Mobile</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="mobile-input"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
                    placeholder="+1 (555) 987-6543"
                    className="input pl-10"
                  />
                </div>
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label htmlFor="linkedin-input" className="block text-sm font-medium text-slate-700 mb-1.5">LinkedIn Profile</label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="linkedin-input"
                  type="url"
                  value={formData.linkedIn}
                  onChange={(e) => updateField('linkedIn', e.target.value)}
                  placeholder="https://linkedin.com/in/johndoe"
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1.5">Location</span>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    placeholder="City"
                    className="input"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="State"
                    className="input"
                  />
                </div>
                <div>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="input"
                  >
                    <option value="USA">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Tags & Notes */}
        {step === 3 && (
          <div className="space-y-6">
            {/* Tags */}
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-2">Tags</span>

              {/* Selected Tags */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="primary" className="pr-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1.5 p-0.5 rounded-full hover:bg-primary-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {/* Custom Tag Input */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(customTag);
                      }
                    }}
                    placeholder="Add custom tag..."
                    className="input pl-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addTag(customTag)}
                  disabled={!customTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Suggested Tags */}
              <div>
                <p className="text-xs text-slate-500 mb-2">Suggested tags:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedTags
                    .filter((tag) => !formData.tags.includes(tag))
                    .slice(0, 8)
                    .map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => addTag(tag)}
                        className="px-2.5 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* Initial Notes */}
            <div>
              <Textarea
                label="Initial Notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any initial notes about this contact... (e.g., how you met, key interests, relationship context)"
                rows={5}
              />
            </div>

            {/* Summary Preview */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 mb-3">Contact Summary</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-700">
                    {formData.firstName[0] || '?'}{formData.lastName[0] || '?'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-slate-900">
                    {formData.firstName || 'First'} {formData.lastName || 'Last'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formData.title || 'Title'} at {formData.company || 'Company'}
                  </p>
                  {formData.category && (
                    <Badge size="sm" className="mt-1">
                      {formData.category}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-500">
            {step === 1 && '* Required fields'}
            {step === 2 && 'Contact details help you stay connected'}
            {step === 3 && 'Tags help organize and find contacts'}
          </div>
          <div className="flex items-center gap-3">
            {step > 1 && (
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button variant="primary" onClick={handleNext}>
                Continue
              </Button>
            ) : (
              <Button variant="primary" onClick={handleSubmit}>
                <Check className="h-4 w-4 mr-1.5" />
                Create Contact
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddContactForm;
