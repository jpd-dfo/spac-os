'use client';

import { useState } from 'react';

import {
  X,
  ArrowRight,
  Trash2,
  CheckSquare,
  ChevronDown,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/Dropdown';
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

import type { PipelineStage } from './TargetCard';

// ============================================================================
// Types
// ============================================================================

interface BulkActionBarProps {
  selectedCount: number;
  onMoveToStage: (stage: PipelineStage) => void;
  onArchive: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
  className?: string;
}

// Stage options for the dropdown
const STAGE_OPTIONS: { id: PipelineStage; label: string; color: string }[] = [
  { id: 'sourcing', label: 'Sourcing', color: 'bg-slate-500' },
  { id: 'initial_screening', label: 'Initial Screening', color: 'bg-blue-500' },
  { id: 'deep_evaluation', label: 'Deep Evaluation', color: 'bg-indigo-500' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-500' },
  { id: 'execution', label: 'Execution', color: 'bg-amber-500' },
  { id: 'closed_passed', label: 'Closed/Passed', color: 'bg-emerald-500' },
];

// ============================================================================
// Archive Confirmation Modal
// ============================================================================

interface ArchiveConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  isLoading?: boolean;
}

function ArchiveConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  isLoading,
}: ArchiveConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader>
        <ModalTitle>Archive Targets</ModalTitle>
        <ModalDescription>
          This action cannot be undone.
        </ModalDescription>
      </ModalHeader>
      <ModalBody>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-danger-100">
            <AlertTriangle className="h-5 w-5 text-danger-600" />
          </div>
          <div>
            <p className="text-sm text-slate-700">
              Are you sure you want to archive{' '}
              <span className="font-semibold">{selectedCount}</span>{' '}
              {selectedCount === 1 ? 'target' : 'targets'}?
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Archived targets will be permanently removed from your pipeline.
            </p>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
          {isLoading ? 'Archiving...' : `Archive ${selectedCount} ${selectedCount === 1 ? 'Target' : 'Targets'}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BulkActionBar({
  selectedCount,
  onMoveToStage,
  onArchive,
  onClearSelection,
  isLoading = false,
  className,
}: BulkActionBarProps) {
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  if (selectedCount === 0) {
    return null;
  }

  const handleArchiveClick = () => {
    setShowArchiveConfirm(true);
  };

  const handleArchiveConfirm = () => {
    onArchive();
    setShowArchiveConfirm(false);
  };

  return (
    <>
      <div
        className={cn(
          'fixed bottom-6 left-1/2 z-40 -translate-x-1/2 transform',
          'flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg',
          'animate-in slide-in-from-bottom-4 fade-in-0 duration-200',
          className
        )}
      >
        {/* Selection Count */}
        <div className="flex items-center gap-2 border-r border-slate-200 pr-4">
          <CheckSquare className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-slate-900">
            {selectedCount} selected
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Move to Stage Dropdown */}
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Move to Stage
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            }
            align="left"
          >
            <DropdownLabel>Select Stage</DropdownLabel>
            {STAGE_OPTIONS.map((stage) => (
              <DropdownItem
                key={stage.id}
                onClick={() => onMoveToStage(stage.id)}
                disabled={isLoading}
              >
                <div className={cn('h-2.5 w-2.5 rounded-full', stage.color)} />
                <span>{stage.label}</span>
              </DropdownItem>
            ))}
          </Dropdown>

          {/* Archive Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleArchiveClick}
            disabled={isLoading}
            className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Archive
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            disabled={isLoading}
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      <ArchiveConfirmModal
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={handleArchiveConfirm}
        selectedCount={selectedCount}
        isLoading={isLoading}
      />
    </>
  );
}
