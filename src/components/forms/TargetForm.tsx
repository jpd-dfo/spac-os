'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TARGET_STATUS_LABELS, DEAL_STAGE_LABELS, SECTORS } from '@/lib/constants';
import type { Target, TargetStatus, DealStage } from '@/types';

interface TargetFormProps {
  spacId: string;
  initialData?: Partial<Target>;
  onSubmit: (data: Partial<Target>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TargetForm({
  spacId,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}: TargetFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    legalName: initialData?.legalName || '',
    website: initialData?.website || '',
    description: initialData?.description || '',
    headquarters: initialData?.headquarters || '',
    foundedYear: initialData?.foundedYear?.toString() || '',
    employeeCount: initialData?.employeeCount?.toString() || '',
    sector: initialData?.sector || '',
    industry: initialData?.industry || '',
    status: initialData?.status || 'IDENTIFIED',
    stage: initialData?.stage || 'ORIGINATION',
    priority: initialData?.priority?.toString() || '3',
    probability: initialData?.probability?.toString() || '',
    enterpriseValue: initialData?.enterpriseValue?.toString() || '',
    ltmRevenue: initialData?.ltmRevenue?.toString() || '',
    ltmEbitda: initialData?.ltmEbitda?.toString() || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = 'Please enter a valid URL';
    }

    if (formData.foundedYear) {
      const year = parseInt(formData.foundedYear);
      if (year < 1800 || year > new Date().getFullYear()) {
        newErrors.foundedYear = 'Please enter a valid year';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitData: Partial<Target> = {
      spacId,
      name: formData.name,
      legalName: formData.legalName || null,
      website: formData.website || null,
      description: formData.description || null,
      headquarters: formData.headquarters || null,
      foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : null,
      employeeCount: formData.employeeCount ? parseInt(formData.employeeCount) : null,
      sector: formData.sector || null,
      industry: formData.industry || null,
      status: formData.status as TargetStatus,
      stage: formData.stage as DealStage,
      priority: parseInt(formData.priority),
      probability: formData.probability ? parseInt(formData.probability) : null,
      enterpriseValue: formData.enterpriseValue ? parseFloat(formData.enterpriseValue) : null,
      ltmRevenue: formData.ltmRevenue ? parseFloat(formData.ltmRevenue) : null,
      ltmEbitda: formData.ltmEbitda ? parseFloat(formData.ltmEbitda) : null,
      notes: formData.notes || null,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Company Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                placeholder="e.g., TechCorp Inc."
              />
              <Input
                label="Legal Name"
                name="legalName"
                value={formData.legalName}
                onChange={handleChange}
                placeholder="e.g., TechCorp Incorporated"
              />
              <Input
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                error={errors.website}
                placeholder="https://www.example.com"
              />
              <Input
                label="Headquarters"
                name="headquarters"
                value={formData.headquarters}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
              />
              <Input
                label="Founded Year"
                name="foundedYear"
                type="number"
                value={formData.foundedYear}
                onChange={handleChange}
                error={errors.foundedYear}
                placeholder="e.g., 2015"
              />
              <Input
                label="Employee Count"
                name="employeeCount"
                type="number"
                value={formData.employeeCount}
                onChange={handleChange}
                placeholder="e.g., 500"
              />
              <Select
                label="Sector"
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                options={[
                  { value: '', label: 'Select sector...' },
                  ...SECTORS.map((s) => ({ value: s, label: s })),
                ]}
              />
              <Input
                label="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
                placeholder="e.g., Enterprise Software"
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the company..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deal Status */}
        <Card>
          <CardHeader>
            <CardTitle>Deal Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={Object.entries(TARGET_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Select
                label="Stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                options={Object.entries(DEAL_STAGE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Select
                label="Priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                options={[
                  { value: '1', label: '1 - Highest' },
                  { value: '2', label: '2 - High' },
                  { value: '3', label: '3 - Medium' },
                  { value: '4', label: '4 - Low' },
                  { value: '5', label: '5 - Lowest' },
                ]}
              />
              <Input
                label="Probability (%)"
                name="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={handleChange}
                placeholder="e.g., 50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Enterprise Value ($)"
                name="enterpriseValue"
                type="number"
                value={formData.enterpriseValue}
                onChange={handleChange}
                placeholder="e.g., 1000000000"
              />
              <Input
                label="LTM Revenue ($)"
                name="ltmRevenue"
                type="number"
                value={formData.ltmRevenue}
                onChange={handleChange}
                placeholder="e.g., 150000000"
              />
              <Input
                label="LTM EBITDA ($)"
                name="ltmEbitda"
                type="number"
                value={formData.ltmEbitda}
                onChange={handleChange}
                placeholder="e.g., 25000000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes about the target..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData?.id ? 'Update Target' : 'Add Target'}
          </Button>
        </div>
      </div>
    </form>
  );
}
