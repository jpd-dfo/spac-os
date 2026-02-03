'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SPAC_STATUS_LABELS, SPAC_PHASE_LABELS, SECTORS, GEOGRAPHIES } from '@/lib/constants';
import type { SPAC, SPACStatus, SPACPhase } from '@/types';

interface SPACFormProps {
  initialData?: Partial<SPAC>;
  onSubmit: (data: Partial<SPAC>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function SPACForm({ initialData, onSubmit, onCancel, isLoading }: SPACFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    ticker: initialData?.ticker || '',
    status: initialData?.status || 'SEARCHING',
    phase: initialData?.phase || 'FORMATION',
    description: initialData?.description || '',
    investmentThesis: initialData?.investmentThesis || '',
    targetSectors: initialData?.targetSectors || [],
    targetGeographies: initialData?.targetGeographies || [],
    ipoSize: initialData?.ipoSize?.toString() || '',
    trustBalance: initialData?.trustBalance?.toString() || '',
    targetSizeMin: initialData?.targetSizeMin?.toString() || '',
    targetSizeMax: initialData?.targetSizeMax?.toString() || '',
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

  const handleMultiSelect = (field: 'targetSectors' | 'targetGeographies', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors['name'] = 'Name is required';
    }

    if (!formData.ticker.trim()) {
      newErrors['ticker'] = 'Ticker is required';
    } else if (!/^[A-Z]{3,5}$/i.test(formData.ticker)) {
      newErrors['ticker'] = 'Ticker must be 3-5 letters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {return;}

    const submitData: Partial<SPAC> = {
      name: formData.name,
      ticker: formData.ticker.toUpperCase(),
      status: formData.status as SPACStatus,
      phase: formData.phase as SPACPhase,
      description: formData.description || null,
      investmentThesis: formData.investmentThesis || null,
      targetSectors: formData.targetSectors,
      targetGeographies: formData.targetGeographies,
      ipoSize: formData.ipoSize ? parseFloat(formData.ipoSize) : null,
      trustBalance: formData.trustBalance ? parseFloat(formData.trustBalance) : null,
      targetSizeMin: formData.targetSizeMin ? parseFloat(formData.targetSizeMin) : null,
      targetSizeMax: formData.targetSizeMax ? parseFloat(formData.targetSizeMax) : null,
    };

    await onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="SPAC Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors['name']}
                placeholder="e.g., Alpha Acquisition Corp"
              />
              <Input
                label="Ticker Symbol"
                name="ticker"
                value={formData.ticker}
                onChange={handleChange}
                error={errors['ticker']}
                placeholder="e.g., ALPH"
                className="uppercase"
              />
              <Select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={Object.entries(SPAC_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <Select
                label="Phase"
                name="phase"
                value={formData.phase}
                onChange={handleChange}
                options={Object.entries(SPAC_PHASE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of the SPAC..."
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="IPO Size ($)"
                name="ipoSize"
                type="number"
                value={formData.ipoSize}
                onChange={handleChange}
                placeholder="e.g., 250000000"
              />
              <Input
                label="Trust Balance ($)"
                name="trustBalance"
                type="number"
                value={formData.trustBalance}
                onChange={handleChange}
                placeholder="e.g., 255000000"
              />
              <Input
                label="Min Target Size ($)"
                name="targetSizeMin"
                type="number"
                value={formData.targetSizeMin}
                onChange={handleChange}
                placeholder="e.g., 500000000"
              />
              <Input
                label="Max Target Size ($)"
                name="targetSizeMax"
                type="number"
                value={formData.targetSizeMax}
                onChange={handleChange}
                placeholder="e.g., 2000000000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Thesis */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Thesis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                label="Investment Thesis"
                name="investmentThesis"
                value={formData.investmentThesis}
                onChange={handleChange}
                placeholder="Describe the target acquisition criteria and investment strategy..."
                rows={4}
              />

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Target Sectors
                </span>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => handleMultiSelect('targetSectors', sector)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        formData.targetSectors.includes(sector)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Target Geographies
                </span>
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIES.map((geo) => (
                    <button
                      key={geo}
                      type="button"
                      onClick={() => handleMultiSelect('targetGeographies', geo)}
                      className={`rounded-full px-3 py-1 text-sm transition-colors ${
                        formData.targetGeographies.includes(geo)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {geo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {initialData?.id ? 'Update SPAC' : 'Create SPAC'}
          </Button>
        </div>
      </div>
    </form>
  );
}
