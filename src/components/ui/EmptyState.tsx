import { cn } from '@/lib/utils';

import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-slate-300">{icon}</div>
      )}
      <h3 className="text-lg font-medium text-slate-900">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
      )}
      {action && (
        <Button
          variant="primary"
          size="md"
          onClick={action.onClick}
          className="mt-6"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
