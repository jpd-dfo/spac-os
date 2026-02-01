import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-primary-100 text-primary-700 focus:ring-primary-500',
        primary: 'bg-primary-100 text-primary-700 focus:ring-primary-500',
        secondary: 'bg-slate-100 text-slate-700 focus:ring-slate-500',
        success: 'bg-success-100 text-success-700 focus:ring-success-500',
        warning: 'bg-warning-100 text-warning-700 focus:ring-warning-500',
        danger: 'bg-danger-100 text-danger-700 focus:ring-danger-500',
        info: 'bg-blue-100 text-blue-700 focus:ring-blue-500',
        outline: 'border border-slate-200 text-slate-700 bg-transparent focus:ring-slate-500',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  children: React.ReactNode;
}

export function Badge({ children, className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      role="status"
      {...props}
    >
      {children}
    </span>
  );
}

export { badgeVariants };
