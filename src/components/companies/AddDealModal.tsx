'use client';

import { useState, useCallback, memo } from 'react';

import { Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { trpc } from '@/lib/trpc/client';

// ============================================================================
// Types
// ============================================================================

export interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  onSuccess: () => void;
}

interface DealFormData {
  dealName: string;
  role: string;
  status: string;
  value: string;
  closedAt: string;
}

// ============================================================================
// Constants
// ============================================================================

const ROLE_OPTIONS = [
  { value: 'Lead Advisor', label: 'Lead Advisor' },
  { value: 'Co-Advisor', label: 'Co-Advisor' },
  { value: 'Legal Counsel', label: 'Legal Counsel' },
  { value: 'Co-Counsel', label: 'Co-Counsel' },
  { value: 'Target Company', label: 'Target Company' },
  { value: 'Sponsor', label: 'Sponsor' },
  { value: 'Investor', label: 'Investor' },
  { value: 'Other', label: 'Other' },
] as const;

const STATUS_OPTIONS = [
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Won', label: 'Won' },
  { value: 'Lost', label: 'Lost' },
] as const;

const INITIAL_FORM_STATE: DealFormData = {
  dealName: '',
  role: '',
  status: 'In Progress',
  value: '',
  closedAt: '',
};

// ============================================================================
// Main Component - Memoized to prevent unnecessary re-renders
// ============================================================================

export const AddDealModal = memo(function AddDealModal({
  isOpen,
  onClose,
  companyId,
  onSuccess,
}: AddDealModalProps) {
  const [formData, setFormData] = useState<DealFormData>(INITIAL_FORM_STATE);

  const addDealMutation = trpc.company.addDeal.useMutation({
    onSuccess: () => {
      toast.success('Deal added successfully');
      onSuccess();
      handleClose();
    },
    onError: (error) => {
      toast.error(`Failed to add deal: ${error.message}`);
    },
  });

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.dealName.trim() || !formData.role.trim()) {
      toast.error('Deal name and role are required');
      return;
    }

    addDealMutation.mutate({
      companyId,
      dealName: formData.dealName,
      role: formData.role,
      status: formData.status,
      value: formData.value ? parseFloat(formData.value) : null,
      closedAt: formData.closedAt ? new Date(formData.closedAt) : null,
    });
  }, [formData, companyId, addDealMutation]);

  const handleDealNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, dealName: e.target.value }));
  }, []);

  const handleRoleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, role: e.target.value }));
  }, []);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, status: e.target.value }));
  }, []);

  const handleValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, value: e.target.value }));
  }, []);

  const handleClosedAtChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, closedAt: e.target.value }));
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>Add Deal</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <label htmlFor="deal-name" className="block text-sm font-medium text-slate-700 mb-1">
                Deal Name <span className="text-red-500">*</span>
              </label>
              <input
                id="deal-name"
                type="text"
                value={formData.dealName}
                onChange={handleDealNameChange}
                className="input w-full"
                placeholder="e.g., Project Alpha Acquisition"
                required
              />
            </div>

            <div>
              <label htmlFor="deal-role" className="block text-sm font-medium text-slate-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                id="deal-role"
                value={formData.role}
                onChange={handleRoleChange}
                className="input w-full"
                required
              >
                <option value="">Select role...</option>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="deal-status" className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="deal-status"
                  value={formData.status}
                  onChange={handleStatusChange}
                  className="input w-full"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="deal-value" className="block text-sm font-medium text-slate-700 mb-1">
                  Deal Value ($)
                </label>
                <input
                  id="deal-value"
                  type="number"
                  value={formData.value}
                  onChange={handleValueChange}
                  className="input w-full"
                  placeholder="1000000"
                  min={0}
                  step={1000}
                />
              </div>
            </div>

            <div>
              <label htmlFor="deal-closed" className="block text-sm font-medium text-slate-700 mb-1">
                Closed Date
              </label>
              <input
                id="deal-closed"
                type="date"
                value={formData.closedAt}
                onChange={handleClosedAtChange}
                className="input w-full"
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={addDealMutation.isPending}>
            {addDealMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add Deal
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
});
