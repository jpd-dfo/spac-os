'use client';

import { X, Check, Loader2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface ProgressIndicatorProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Current status message */
  status: string;
  /** Array of step names */
  steps: string[];
  /** Current step index (0-based) */
  currentStep: number;
  /** Optional callback for cancellation */
  onCancel?: () => void;
  /** Optional estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
  /** Optional className for styling */
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${Math.ceil(seconds)}s remaining`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.ceil(seconds % 60);
  if (remainingSeconds === 0) {
    return `${minutes}m remaining`;
  }
  return `${minutes}m ${remainingSeconds}s remaining`;
}

// ============================================================================
// Sub-Components
// ============================================================================

interface StepIndicatorProps {
  step: string;
  index: number;
  currentStep: number;
  totalSteps: number;
}

function StepIndicator({ step, index, currentStep, totalSteps }: StepIndicatorProps) {
  const isCompleted = index < currentStep;
  const isCurrent = index === currentStep;
  const isPending = index > currentStep;

  return (
    <div className="flex items-center gap-2">
      {/* Step Circle */}
      <div
        className={cn(
          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300',
          isCompleted && 'bg-success-500 text-white',
          isCurrent && 'bg-primary-500 text-white',
          isPending && 'bg-slate-200 text-slate-500'
        )}
      >
        {isCompleted ? (
          <Check className="h-3.5 w-3.5" />
        ) : isCurrent ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      {/* Step Label */}
      <span
        className={cn(
          'text-sm transition-colors duration-300',
          isCompleted && 'text-success-600 font-medium',
          isCurrent && 'text-primary-600 font-medium',
          isPending && 'text-slate-400'
        )}
      >
        {step}
      </span>

      {/* Connector Line (except for last step) */}
      {index < totalSteps - 1 && (
        <div
          className={cn(
            'ml-auto h-0.5 flex-1 transition-colors duration-300',
            isCompleted ? 'bg-success-500' : 'bg-slate-200'
          )}
        />
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function ProgressIndicator({
  progress,
  status,
  steps,
  currentStep,
  onCancel,
  estimatedTimeRemaining,
  className,
}: ProgressIndicatorProps) {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{status}</span>
          <span className="text-sm font-medium text-primary-600">{Math.round(clampedProgress)}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      {steps.length > 0 && (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <StepIndicator
              key={index}
              step={step}
              index={index}
              currentStep={currentStep}
              totalSteps={steps.length}
            />
          ))}
        </div>
      )}

      {/* Footer: Time Remaining and Cancel Button */}
      <div className="flex items-center justify-between">
        {/* Estimated Time Remaining */}
        {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Clock className="h-3.5 w-3.5" />
            <span>{formatTimeRemaining(estimatedTimeRemaining)}</span>
          </div>
        ) : (
          <div />
        )}

        {/* Cancel Button */}
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-slate-500 hover:text-danger-600"
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Progress Indicator (for inline use)
// ============================================================================

export interface CompactProgressIndicatorProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Current status message */
  status: string;
  /** Optional callback for cancellation */
  onCancel?: () => void;
  /** Optional className for styling */
  className?: string;
}

export function CompactProgressIndicator({
  progress,
  status,
  onCancel,
  className,
}: CompactProgressIndicatorProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">{status}</span>
          <span className="text-xs font-medium text-primary-600">{Math.round(clampedProgress)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
      {onCancel && (
        <button
          onClick={onCancel}
          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-danger-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default ProgressIndicator;
