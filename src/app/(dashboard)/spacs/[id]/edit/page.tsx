'use client';

import { useState, useEffect } from 'react';

import { useRouter, useParams } from 'next/navigation';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Building2, Save, X, Trash2, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { z } from 'zod';

import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { trpc } from '@/lib/trpc/client';
import { SpacStatusSchema } from '@/schemas';

// Status options that match the router schema
const SPAC_STATUS_OPTIONS = [
  { value: 'SEARCHING', label: 'Searching' },
  { value: 'LOI_SIGNED', label: 'LOI Signed' },
  { value: 'DA_ANNOUNCED', label: 'DA Announced' },
  { value: 'SEC_REVIEW', label: 'SEC Review' },
  { value: 'SHAREHOLDER_VOTE', label: 'Shareholder Vote' },
  { value: 'CLOSING', label: 'Closing' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'LIQUIDATING', label: 'Liquidating' },
  { value: 'LIQUIDATED', label: 'Liquidated' },
  { value: 'TERMINATED', label: 'Terminated' },
];

// Zod schema for SPAC form validation (matching the update schema from router)
const spacFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
  ticker: z
    .string()
    .max(10, 'Ticker must be less than 10 characters')
    .regex(/^[A-Z0-9.]*$/i, 'Ticker must only contain letters, numbers, or dots')
    .transform((val) => (val ? val.toUpperCase() : val))
    .optional()
    .nullable(),
  status: SpacStatusSchema,
  trustAmount: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 999999999999), {
      message: 'Trust amount must be a valid positive number',
    }),
  ipoDate: z.string().optional().nullable(),
  deadlineDate: z.string().optional().nullable(),
  redemptionRate: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) / 100 : undefined))
    .refine((val) => val === undefined || (val >= 0 && val <= 1), {
      message: 'Redemption rate must be between 0 and 100',
    }),
});

type SpacFormData = z.infer<typeof spacFormSchema>;
type SpacFormInput = z.input<typeof spacFormSchema>;

// Skeleton component for loading state
function EditSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-slate-200" />
        <div>
          <div className="h-7 w-48 bg-slate-200 rounded mb-2" />
          <div className="h-5 w-64 bg-slate-200 rounded" />
        </div>
      </div>

      {/* Form skeleton */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                  <div className="h-10 w-full bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="h-5 w-40 bg-slate-200 rounded" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <div key={i}>
                  <div className="h-4 w-20 bg-slate-200 rounded mb-2" />
                  <div className="h-10 w-full bg-slate-200 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions skeleton */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6">
        <div className="h-10 w-28 bg-slate-200 rounded" />
        <div className="h-10 w-28 bg-slate-200 rounded" />
      </div>
    </div>
  );
}

// Error state component
function ErrorState({ error, id }: { error: string; id: string }) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-danger-100 mb-6">
        <AlertTriangle className="h-10 w-10 text-danger-500" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to Load SPAC</h2>
      <p className="text-slate-500 text-center max-w-md mb-6">
        {error || `The SPAC with ID "${id}" could not be loaded. It may have been deleted or you may not have access to it.`}
      </p>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
        <Button variant="primary" onClick={() => router.push('/spacs')}>
          View All SPACs
        </Button>
      </div>
    </div>
  );
}

export default function EditSPACPage() {
  const router = useRouter();
  const params = useParams();
  const id = params['id'] as string;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch existing SPAC data
  const { data: spac, isLoading, error: fetchError } = trpc.spac.getById.useQuery(
    { id },
    {
      enabled: !!id,
      retry: 1,
    }
  );

  // Update mutation
  const updateMutation = trpc.spac.update.useMutation({
    onSuccess: () => {
      toast.success('SPAC updated successfully');
      setSubmitSuccess(true);
      // Redirect to detail page after short delay to show success state
      setTimeout(() => {
        router.push(`/spacs/${id}`);
      }, 1000);
    },
    onError: (error) => {
      const message = error.message || 'Failed to update SPAC. Please try again.';
      toast.error(`Failed to update SPAC: ${message}`);
      setSubmitError(message);
    },
  });

  // Delete mutation
  const deleteMutation = trpc.spac.delete.useMutation({
    onSuccess: () => {
      toast.success('SPAC deleted successfully');
      router.push('/spacs');
    },
    onError: (error) => {
      const message = error.message || 'Failed to delete SPAC. Please try again.';
      toast.error(`Failed to delete SPAC: ${message}`);
      setSubmitError(message);
      setShowDeleteModal(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<SpacFormInput>({
    resolver: zodResolver(spacFormSchema),
    defaultValues: {
      name: '',
      ticker: '',
      status: 'SEARCHING',
      trustAmount: '',
      ipoDate: '',
      deadlineDate: '',
      redemptionRate: '',
    },
  });

  // Populate form when SPAC data is loaded
  useEffect(() => {
    if (spac) {
      reset({
        name: spac.name || '',
        ticker: spac.ticker || '',
        status: spac.status as SpacFormData['status'],
        trustAmount: spac.trustAmount ? String(spac.trustAmount) : '',
        ipoDate: spac.ipoDate ? new Date(spac.ipoDate).toISOString().split('T')[0] : '',
        deadlineDate: spac.deadlineDate ? new Date(spac.deadlineDate).toISOString().split('T')[0] : '',
        redemptionRate: spac.redemptionRate ? String(Number(spac.redemptionRate) * 100) : '',
      });
    }
  }, [spac, reset]);

  const onSubmit = async (inputData: SpacFormInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Parse input data to get transformed values
      const data = spacFormSchema.parse(inputData);
      updateMutation.mutate({
        id,
        name: data.name,
        ticker: data.ticker || null,
        status: data.status,
        trustAmount: data.trustAmount || null,
        ipoDate: data.ipoDate ? new Date(data.ipoDate) : null,
        deadlineDate: data.deadlineDate ? new Date(data.deadlineDate) : null,
        redemptionRate: data.redemptionRate || null,
      });
    } catch {
      setSubmitError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/spacs/${id}`);
  };

  const handleDelete = () => {
    setIsDeleting(true);
    deleteMutation.mutate({ id });
  };

  // Loading state
  if (isLoading) {
    return <EditSkeleton />;
  }

  // Error state
  if (fetchError || !spac) {
    return <ErrorState error={fetchError?.message || ''} id={id} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit SPAC</h1>
            <p className="mt-1 text-sm text-slate-500">
              Update details for {spac.name} ({spac.ticker || 'No ticker'})
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="rounded-lg bg-success-50 border border-success-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100">
              <Save className="h-4 w-4 text-success-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-success-800">SPAC updated successfully!</p>
              <p className="text-xs text-success-600">Redirecting to SPAC details...</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="rounded-lg bg-danger-50 border border-danger-200 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-danger-100">
              <AlertTriangle className="h-4 w-4 text-danger-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-danger-800">Error</p>
              <p className="text-xs text-danger-600">{submitError}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Update the fundamental details of the SPAC</CardDescription>
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
                label="Ticker Symbol"
                placeholder="e.g., ALPH"
                className="uppercase"
                error={errors.ticker?.message}
                {...register('ticker')}
              />
              <Select
                label="Status"
                options={SPAC_STATUS_OPTIONS}
                error={errors.status?.message}
                {...register('status')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Information</CardTitle>
            <CardDescription>Trust account and financial details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Trust Amount ($)"
                type="number"
                placeholder="e.g., 250000000"
                helperText="Total trust account balance in dollars"
                error={errors.trustAmount?.message}
                {...register('trustAmount')}
              />
              <Input
                label="Redemption Rate (%)"
                type="number"
                step="0.1"
                placeholder="e.g., 25"
                helperText="Expected or actual redemption rate (0-100)"
                error={errors.redemptionRate?.message}
                {...register('redemptionRate')}
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
                label="Deadline Date"
                type="date"
                helperText="Business combination deadline"
                error={errors.deadlineDate?.message}
                {...register('deadlineDate')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-danger-200">
          <CardHeader>
            <CardTitle className="text-danger-700">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for this SPAC</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">Delete this SPAC</p>
                <p className="text-xs text-slate-500">
                  This will archive the SPAC by setting its status to Liquidated. This action can be reversed.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete SPAC
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="text-sm text-slate-500">
            {isDirty && 'You have unsaved changes'}
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting || updateMutation.isPending}
              disabled={submitSuccess}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Delete SPAC</ModalTitle>
          <ModalDescription>
            Are you sure you want to delete this SPAC?
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          <div className="flex items-start gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
            <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-800">
                This will archive "{spac.name}"
              </p>
              <p className="text-xs text-warning-600 mt-1">
                The SPAC will be marked as Liquidated. You can change the status later if needed.
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting || deleteMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete SPAC
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
