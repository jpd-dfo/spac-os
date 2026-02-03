import { cva, type VariantProps } from 'class-variance-authority';

import { cn, getInitials } from '@/lib/utils';

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full font-medium',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
      variant: {
        default: 'bg-primary-100 text-primary-700',
        secondary: 'bg-slate-100 text-slate-700',
        success: 'bg-success-100 text-success-700',
        warning: 'bg-warning-100 text-warning-700',
        danger: 'bg-danger-100 text-danger-700',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

interface AvatarProps extends VariantProps<typeof avatarVariants> {
  name?: string | null;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, size, variant, className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn(avatarVariants({ size }), 'object-cover', className)}
      />
    );
  }

  return (
    <div className={cn(avatarVariants({ size, variant }), className)}>
      {getInitials(name)}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ name?: string | null; src?: string | null }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export function AvatarGroup({ avatars, max = 4, size = 'md' }: AvatarGroupProps) {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visibleAvatars.map((avatar, index) => (
        <Avatar
          key={index}
          name={avatar.name}
          src={avatar.src}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size, variant: 'secondary' }),
            'ring-2 ring-white'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}
