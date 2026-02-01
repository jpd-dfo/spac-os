'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Building2, Save, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { SPAC_STATUS_LABELS, SPAC_PHASE_LABELS, SECTORS, GEOGRAPHIES } from '@/lib/constants';

// Zod schema for SPAC form validation
const spacFormSchema = z.object({
  // Basic Information
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  ticker: z
    .string()
    .min(1, 'Ticker is required')
    .max(10, 'Ticker must be less than 10 characters')
    .regex(/^[A-Z0-9.]*$/i, 'Ticker must only contain letters, numbers, or dots')
    .transform((val) => val.toUpperCase()),
  status: z.enum([
    'PRE_IPO',
    'SEARCHING',
    'LOI_SIGNED',
    'DA_ANNOUNCED',
    'PROXY_FILED',
    'VOTE_SCHEDULED',
    'CLOSING',
    'COMPLETED',
    'LIQUIDATED',
  ]),
  phase: z.enum([
    'FORMATION',
    'IPO',
    'TARGET_SEARCH',
    'DUE_DILIGENCE',
    'NEGOTIATION',
    'DEFINITIVE_AGREEMENT',
    'SEC_REVIEW',
    'SHAREHOLDER_VOTE',
    'CLOSING',
    'DE_SPAC',
  ]),
  description: z.string().optional(),
  investmentThesis: z.string().optional(),

  // Financial Information
  ipoSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 999999999999), {
      message: 'IPO size must be a valid positive number',
    }),
  trustBalance: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 999999999999), {
      message: 'Trust balance must be a valid positive number',
    }),
  unitPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val > 0, {
      message: 'Unit price must be a positive number',
    }),
  sharesOutstanding: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined))
    .refine((val) => val === undefined || val > 0, {
      message: 'Shares outstanding must be a positive integer',
    }),

  // Target Size Range
  targetSizeMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: 'Minimum target size must be a positive number',
    }),
  targetSizeMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || val >= 0, {
      message: 'Maximum target size must be a positive number',
    }),

  // Focus
  targetSectors: z.array(z.string()),
  targetGeographies: z.array(z.string()),

  // Dates
  ipoDate: z.string().optional(),
  deadline: z.string().optional(),

  // Extensions
  maxExtensions: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 6))
    .refine((val) => val >= 0 && val <= 12, {
      message: 'Max extensions must be between 0 and 12',
    }),
}).refine(
  (data) => {
    if (data.targetSizeMin !== undefined && data.targetSizeMax !== undefined) {
      return data.targetSizeMin <= data.targetSizeMax;
    }
    return true;
  },
  {
    message: 'Minimum target size must be less than or equal to maximum target size',
    path: ['targetSizeMin'],
  }
);

type SpacFormData = z.infer<typeof spacFormSchema>;

export default function NewSPACPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedGeographies, setSelectedGeographies] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SpacFormData>({
    resolver: zodResolver(spacFormSchema),
    defaultValues: {
      status: 'SEARCHING',
      phase: 'FORMATION',
      targetSectors: [],
      targetGeographies: [],
      maxExtensions: '6',
    },
  });

  const toggleSector = (sector: string) => {
    const newSectors = selectedSectors.includes(sector)
      ? selectedSectors.filter((s) => s !== sector)
      : [...selectedSectors, sector];
    setSelectedSectors(newSectors);
    setValue('targetSectors', newSectors);
  };

  const toggleGeography = (geo: string) => {
    const newGeographies = selectedGeographies.includes(geo)
      ? selectedGeographies.filter((g) => g !== geo)
      : [...selectedGeographies, geo];
    setSelectedGeographies(newGeographies);
    setValue('targetGeographies', newGeographies);
  };

  const onSubmit = async (data: SpacFormData) => {
    setIsSubmitting(true);
    try {
      // TODO: Call tRPC mutation to create SPAC

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to SPACs list on success
      router.push('/spacs');
    } catch (error) {
      // Error handled in UI - show error state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/spacs');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New SPAC</h1>
          <p className="mt-1 text-sm text-slate-500">
            Add a new SPAC to your portfolio for tracking and management
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Enter the fundamental details of the SPAC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="SPAC Name *"
                placeholder="e.g., Alpha Acquisition Corp"
                error={errors.name?.message}
                {...register('name')}
              />
              <Input
                label="Ticker Symbol *"
                placeholder="e.g., ALPH"
                className="uppercase"
                error={errors.ticker?.message}
                {...register('ticker')}
              />
              <Select
                label="Status"
                options={Object.entries(SPAC_STATUS_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.status?.message}
                {...register('status')}
              />
              <Select
                label="Phase"
                options={Object.entries(SPAC_PHASE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
                error={errors.phase?.message}
                {...register('phase')}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Description"
                  placeholder="Brief description of the SPAC and its purpose..."
                  rows={3}
                  error={errors.description?.message}
                  {...register('description')}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>IPO and trust account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="IPO Size ($)"
                type="number"
                placeholder="e.g., 250000000"
                helperText="Total IPO proceeds in dollars"
                error={errors.ipoSize?.message}
                {...register('ipoSize')}
              />
              <Input
                label="Trust Balance ($)"
                type="number"
                placeholder="e.g., 255000000"
                helperText="Current trust account balance"
                error={errors.trustBalance?.message}
                {...register('trustBalance')}
              />
              <Input
                label="Unit Price ($)"
                type="number"
                step="0.01"
                placeholder="e.g., 10.00"
                error={errors.unitPrice?.message}
                {...register('unitPrice')}
              />
              <Input
                label="Shares Outstanding"
                type="number"
                placeholder="e.g., 25000000"
                error={errors.sharesOutstanding?.message}
                {...register('sharesOutstanding')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Key dates and deadlines</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="IPO Date"
                type="date"
                error={errors.ipoDate?.message}
                {...register('ipoDate')}
              />
              <Input
                label="Deadline"
                type="date"
                helperText="Business combination deadline"
                error={errors.deadline?.message}
                {...register('deadline')}
              />
              <Input
                label="Maximum Extensions"
                type="number"
                placeholder="6"
                helperText="Maximum number of allowed extensions"
                error={errors.maxExtensions?.message}
                {...register('maxExtensions')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Focus */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Focus</CardTitle>
            <CardDescription>Target criteria and investment thesis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Textarea
                label="Investment Thesis"
                placeholder="Describe the target acquisition criteria and investment strategy..."
                rows={4}
                error={errors.investmentThesis?.message}
                {...register('investmentThesis')}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Min Target Size ($)"
                  type="number"
                  placeholder="e.g., 500000000"
                  error={errors.targetSizeMin?.message}
                  {...register('targetSizeMin')}
                />
                <Input
                  label="Max Target Size ($)"
                  type="number"
                  placeholder="e.g., 2000000000"
                  error={errors.targetSizeMax?.message}
                  {...register('targetSizeMax')}
                />
              </div>

              {/* Target Sectors */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Target Sectors
                </label>
                <div className="flex flex-wrap gap-2">
                  {SECTORS.map((sector) => (
                    <button
                      key={sector}
                      type="button"
                      onClick={() => toggleSector(sector)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedSectors.includes(sector)
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {sector}
                    </button>
                  ))}
                </div>
                {selectedSectors.length > 0 && (
                  <p className="mt-2 text-sm text-slate-500">
                    Selected: {selectedSectors.join(', ')}
                  </p>
                )}
              </div>

              {/* Target Geographies */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Target Geographies
                </label>
                <div className="flex flex-wrap gap-2">
                  {GEOGRAPHIES.map((geo) => (
                    <button
                      key={geo}
                      type="button"
                      onClick={() => toggleGeography(geo)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedGeographies.includes(geo)
                          ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-300'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {geo}
                    </button>
                  ))}
                </div>
                {selectedGeographies.length > 0 && (
                  <p className="mt-2 text-sm text-slate-500">
                    Selected: {selectedGeographies.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            Create SPAC
          </Button>
        </div>
      </form>
    </div>
  );
}
