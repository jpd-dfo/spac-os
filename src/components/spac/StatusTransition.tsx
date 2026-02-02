'use client';

import { useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc/client';

// ============================================================================
// TYPES
// ============================================================================

/**
 * SpacStatus enum values matching Prisma schema
 */
export type SpacStatus =
  | 'PRE_IPO'
  | 'SEARCHING'
  | 'LOI_SIGNED'
  | 'DEFINITIVE_AGREEMENT'
  | 'VOTE_PENDING'
  | 'DE_SPAC_COMPLETE'
  | 'LIQUIDATED';

interface StatusTransitionProps {
  /** Current SPAC status */
  currentStatus: SpacStatus;
  /** SPAC ID for the mutation */
  spacId: string;
  /** Callback fired after successful status change */
  onStatusChange?: (newStatus: SpacStatus) => void;
  /** Optional class name for the container */
  className?: string;
  /** Disable the component */
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Human-readable status labels
 */
const STATUS_LABELS: Record<SpacStatus, string> = {
  PRE_IPO: 'Pre-IPO',
  SEARCHING: 'Searching',
  LOI_SIGNED: 'LOI Signed',
  DEFINITIVE_AGREEMENT: 'Definitive Agreement',
  VOTE_PENDING: 'Vote Pending',
  DE_SPAC_COMPLETE: 'De-SPAC Complete',
  LIQUIDATED: 'Liquidated',
};

/**
 * Status configuration for styling
 */
const STATUS_CONFIG: Record<
  SpacStatus,
  {
    variant: 'success' | 'warning' | 'primary' | 'secondary' | 'danger' | 'info';
    description: string;
    category: 'positive' | 'negative' | 'in-progress';
  }
> = {
  PRE_IPO: {
    variant: 'secondary',
    description: 'SPAC is preparing for initial public offering',
    category: 'in-progress',
  },
  SEARCHING: {
    variant: 'primary',
    description: 'Actively searching for acquisition targets',
    category: 'in-progress',
  },
  LOI_SIGNED: {
    variant: 'warning',
    description: 'Letter of Intent signed with target company',
    category: 'in-progress',
  },
  DEFINITIVE_AGREEMENT: {
    variant: 'info',
    description: 'Definitive Agreement executed, pending SEC review',
    category: 'in-progress',
  },
  VOTE_PENDING: {
    variant: 'warning',
    description: 'Shareholder vote scheduled or in progress',
    category: 'in-progress',
  },
  DE_SPAC_COMPLETE: {
    variant: 'success',
    description: 'Business combination successfully completed',
    category: 'positive',
  },
  LIQUIDATED: {
    variant: 'danger',
    description: 'SPAC has been liquidated or terminated',
    category: 'negative',
  },
};

/**
 * Valid status transitions based on SPAC lifecycle
 * Key: Current status
 * Value: Array of valid next statuses
 */
const VALID_TRANSITIONS: Record<SpacStatus, SpacStatus[]> = {
  PRE_IPO: ['SEARCHING'],
  SEARCHING: ['LOI_SIGNED', 'LIQUIDATED'],
  LOI_SIGNED: ['DEFINITIVE_AGREEMENT', 'SEARCHING', 'LIQUIDATED'],
  DEFINITIVE_AGREEMENT: ['VOTE_PENDING', 'SEARCHING', 'LIQUIDATED'],
  VOTE_PENDING: ['DE_SPAC_COMPLETE', 'LIQUIDATED'],
  DE_SPAC_COMPLETE: [], // Terminal state - no transitions allowed
  LIQUIDATED: [], // Terminal state - no transitions allowed
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get variant color based on status category
 */
function getStatusCategoryColor(category: 'positive' | 'negative' | 'in-progress'): string {
  switch (category) {
    case 'positive':
      return 'text-success-600 bg-success-50 border-success-200';
    case 'negative':
      return 'text-danger-600 bg-danger-50 border-danger-200';
    case 'in-progress':
      return 'text-primary-600 bg-primary-50 border-primary-200';
  }
}

/**
 * Get icon for transition type
 */
function getTransitionIcon(
  fromStatus: SpacStatus,
  toStatus: SpacStatus
): React.ReactNode {
  const toConfig = STATUS_CONFIG[toStatus];

  if (toConfig.category === 'positive') {
    return <CheckCircle2 className="h-5 w-5 text-success-500" />;
  }
  if (toConfig.category === 'negative') {
    return <XCircle className="h-5 w-5 text-danger-500" />;
  }
  return <ArrowRight className="h-5 w-5 text-primary-500" />;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function StatusTransition({
  currentStatus,
  spacId,
  onStatusChange,
  className,
  disabled = false,
}: StatusTransitionProps) {
  // Local state
  const [selectedStatus, setSelectedStatus] = useState<SpacStatus | ''>('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // tRPC mutation
  const updateStatusMutation = trpc.spac.updateStatus.useMutation({
    onSuccess: (data) => {
      const newStatusLabel = STATUS_LABELS[data.status as SpacStatus];
      toast.success(`Status changed to ${newStatusLabel}`);
      setNotification({
        type: 'success',
        message: `Status updated to ${newStatusLabel}`,
      });
      setIsConfirmOpen(false);
      setSelectedStatus('');
      setReason('');
      onStatusChange?.(data.status as SpacStatus);

      // Clear notification after 3 seconds
      setTimeout(() => setNotification(null), 3000);
    },
    onError: (error) => {
      const message = error.message || 'Failed to update status';
      toast.error(`Failed to change status: ${message}`);
      setNotification({
        type: 'error',
        message,
      });

      // Clear notification after 5 seconds
      setTimeout(() => setNotification(null), 5000);
    },
  });

  // Computed values
  const validNextStatuses = useMemo(
    () => VALID_TRANSITIONS[currentStatus] || [],
    [currentStatus]
  );

  const isTerminalState = validNextStatuses.length === 0;

  const selectOptions = useMemo(
    () =>
      validNextStatuses.map((status) => ({
        value: status,
        label: STATUS_LABELS[status],
      })),
    [validNextStatuses]
  );

  // Event handlers
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value as SpacStatus | '';
      setSelectedStatus(value);
      if (value) {
        setIsConfirmOpen(true);
      }
    },
    []
  );

  const handleConfirm = useCallback(() => {
    if (!selectedStatus) return;

    updateStatusMutation.mutate({
      id: spacId,
      status: selectedStatus,
      reason: reason || undefined,
    });
  }, [selectedStatus, spacId, reason, updateStatusMutation]);

  const handleCancel = useCallback(() => {
    setIsConfirmOpen(false);
    setSelectedStatus('');
    setReason('');
  }, []);

  // Render terminal state message
  if (isTerminalState) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge
          variant={STATUS_CONFIG[currentStatus].variant}
          className="flex items-center gap-1.5"
        >
          {STATUS_CONFIG[currentStatus].category === 'positive' ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {STATUS_LABELS[currentStatus]}
        </Badge>
        <span className="text-xs text-slate-500">(Final State)</span>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Status Select */}
      <div className="flex items-center gap-3">
        <Badge
          variant={STATUS_CONFIG[currentStatus].variant}
          className="whitespace-nowrap"
        >
          {STATUS_LABELS[currentStatus]}
        </Badge>

        <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />

        <div className="min-w-[200px]">
          <Select
            value={selectedStatus}
            onChange={handleSelectChange}
            options={selectOptions}
            placeholder="Select next status..."
            disabled={disabled || updateStatusMutation.isPending}
          />
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-md px-3 py-2 text-sm',
            notification.type === 'success'
              ? 'bg-success-50 text-success-700 border border-success-200'
              : 'bg-danger-50 text-danger-700 border border-danger-200'
          )}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {notification.message}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmOpen}
        onClose={handleCancel}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Confirm Status Change</ModalTitle>
          <ModalDescription>
            You are about to change the SPAC status. This action will be logged
            for compliance purposes.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-4">
            {/* Transition Preview */}
            <div className="flex items-center justify-center gap-4 py-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <Badge
                  variant={STATUS_CONFIG[currentStatus].variant}
                  size="lg"
                >
                  {STATUS_LABELS[currentStatus]}
                </Badge>
                <p className="mt-1 text-xs text-slate-500">Current</p>
              </div>

              <div className="flex flex-col items-center">
                {selectedStatus && getTransitionIcon(currentStatus, selectedStatus)}
              </div>

              <div className="text-center">
                {selectedStatus && (
                  <>
                    <Badge
                      variant={STATUS_CONFIG[selectedStatus].variant}
                      size="lg"
                    >
                      {STATUS_LABELS[selectedStatus]}
                    </Badge>
                    <p className="mt-1 text-xs text-slate-500">New Status</p>
                  </>
                )}
              </div>
            </div>

            {/* Status Description */}
            {selectedStatus && (
              <div
                className={cn(
                  'p-3 rounded-lg border',
                  getStatusCategoryColor(STATUS_CONFIG[selectedStatus].category)
                )}
              >
                <p className="text-sm font-medium">
                  {STATUS_LABELS[selectedStatus]}
                </p>
                <p className="text-xs mt-1 opacity-80">
                  {STATUS_CONFIG[selectedStatus].description}
                </p>
              </div>
            )}

            {/* Warning for Terminal States */}
            {selectedStatus &&
              STATUS_CONFIG[selectedStatus].category !== 'in-progress' && (
                <div className="flex items-start gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-warning-800">
                      {STATUS_CONFIG[selectedStatus].category === 'positive'
                        ? 'This is a terminal state'
                        : 'This action may be irreversible'}
                    </p>
                    <p className="text-xs text-warning-700 mt-0.5">
                      {STATUS_CONFIG[selectedStatus].category === 'positive'
                        ? 'After the de-SPAC is complete, no further status changes can be made.'
                        : 'Liquidation is typically a final state. Please ensure this is the correct action.'}
                    </p>
                  </div>
                </div>
              )}

            {/* Reason Input */}
            <div>
              <label
                htmlFor="transition-reason"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                Reason for change (optional)
              </label>
              <textarea
                id="transition-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter a reason for this status change..."
                rows={3}
                className={cn(
                  'w-full rounded-md border border-slate-200 px-3 py-2 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                  'placeholder:text-slate-400'
                )}
              />
              <p className="mt-1 text-xs text-slate-500">
                This will be recorded in the audit log for compliance tracking.
              </p>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="secondary"
            onClick={handleCancel}
            disabled={updateStatusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={
              selectedStatus && STATUS_CONFIG[selectedStatus].category === 'negative'
                ? 'danger'
                : 'primary'
            }
            onClick={handleConfirm}
            isLoading={updateStatusMutation.isPending}
            disabled={!selectedStatus}
          >
            {updateStatusMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Confirm Change'
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export { STATUS_LABELS, STATUS_CONFIG, VALID_TRANSITIONS };
export type { StatusTransitionProps };
