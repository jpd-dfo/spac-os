'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  Plus,
  Target,
  Upload,
  FileText,
  Building2,
  Calendar,
  Users,
  Settings,
  ChevronRight,
  LucideIcon,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface QuickAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'blue' | 'purple' | 'teal';
  disabled?: boolean;
  badge?: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  title?: string;
  showHeader?: boolean;
  layout?: 'grid' | 'list' | 'buttons';
  columns?: 2 | 3 | 4;
  className?: string;
}

interface QuickActionButtonProps {
  action: QuickAction;
  layout: 'grid' | 'list' | 'buttons';
}

// ============================================================================
// COLOR CONFIGURATION
// ============================================================================

const colorConfig: Record<NonNullable<QuickAction['color']>, {
  bg: string;
  bgHover: string;
  icon: string;
  border: string;
}> = {
  default: {
    bg: 'bg-slate-50',
    bgHover: 'hover:bg-slate-100',
    icon: 'text-slate-600',
    border: 'border-slate-200',
  },
  primary: {
    bg: 'bg-primary-50',
    bgHover: 'hover:bg-primary-100',
    icon: 'text-primary-600',
    border: 'border-primary-200',
  },
  success: {
    bg: 'bg-success-50',
    bgHover: 'hover:bg-success-100',
    icon: 'text-success-600',
    border: 'border-success-200',
  },
  warning: {
    bg: 'bg-warning-50',
    bgHover: 'hover:bg-warning-100',
    icon: 'text-warning-600',
    border: 'border-warning-200',
  },
  danger: {
    bg: 'bg-danger-50',
    bgHover: 'hover:bg-danger-100',
    icon: 'text-danger-600',
    border: 'border-danger-200',
  },
  blue: {
    bg: 'bg-blue-50',
    bgHover: 'hover:bg-blue-100',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  purple: {
    bg: 'bg-purple-50',
    bgHover: 'hover:bg-purple-100',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
  teal: {
    bg: 'bg-teal-50',
    bgHover: 'hover:bg-teal-100',
    icon: 'text-teal-600',
    border: 'border-teal-200',
  },
};

// ============================================================================
// DEFAULT ACTIONS
// ============================================================================

export const defaultQuickActions: QuickAction[] = [
  {
    id: 'new-spac',
    label: 'New SPAC',
    description: 'Register a new SPAC entity',
    icon: Building2,
    href: '/spacs/new',
    color: 'primary',
  },
  {
    id: 'add-target',
    label: 'Add Target',
    description: 'Add a potential acquisition target',
    icon: Target,
    href: '/targets/new',
    color: 'teal',
  },
  {
    id: 'upload-document',
    label: 'Upload Document',
    description: 'Upload files to the document library',
    icon: Upload,
    href: '/documents/upload',
    color: 'blue',
  },
  {
    id: 'create-filing',
    label: 'Create Filing',
    description: 'Prepare an SEC filing',
    icon: FileText,
    href: '/filings/new',
    color: 'purple',
  },
];

export const extendedQuickActions: QuickAction[] = [
  ...defaultQuickActions,
  {
    id: 'schedule-meeting',
    label: 'Schedule Meeting',
    description: 'Set up a new meeting',
    icon: Calendar,
    href: '/calendar/new',
    color: 'warning',
  },
  {
    id: 'create-task',
    label: 'Create Task',
    description: 'Add a new task',
    icon: ClipboardList,
    href: '/tasks/new',
    color: 'success',
  },
  {
    id: 'view-reports',
    label: 'View Reports',
    description: 'Access analytics and reports',
    icon: BarChart3,
    href: '/reports',
    color: 'default',
  },
  {
    id: 'team-settings',
    label: 'Team Settings',
    description: 'Manage team members',
    icon: Users,
    href: '/settings/team',
    color: 'default',
  },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function QuickActionButton({ action, layout }: QuickActionButtonProps) {
  const colors = colorConfig[action.color || 'default'];
  const ActionIcon = action.icon;

  const content = (
    <>
      {/* Icon Container */}
      <div
        className={cn(
          'rounded-xl flex items-center justify-center transition-colors',
          layout === 'grid' ? 'p-4 mb-3' : layout === 'list' ? 'p-3' : 'p-2',
          colors.bg
        )}
      >
        <ActionIcon
          className={cn(
            colors.icon,
            layout === 'grid' ? 'h-7 w-7' : layout === 'list' ? 'h-5 w-5' : 'h-4 w-4'
          )}
        />
      </div>

      {/* Text Content */}
      <div className={cn(
        layout === 'grid' ? 'text-center' : 'flex-1 min-w-0',
        layout === 'buttons' && 'hidden sm:block'
      )}>
        <p className={cn(
          'font-semibold text-slate-900',
          layout === 'grid' ? 'text-sm' : 'text-sm'
        )}>
          {action.label}
        </p>
        {action.description && layout !== 'buttons' && (
          <p className={cn(
            'text-slate-500 line-clamp-2',
            layout === 'grid' ? 'text-xs mt-1' : 'text-xs'
          )}>
            {action.description}
          </p>
        )}
      </div>

      {/* Button layout label (visible on mobile) */}
      {layout === 'buttons' && (
        <span className="sm:hidden text-sm font-medium text-slate-900">
          {action.label}
        </span>
      )}

      {/* Badge */}
      {action.badge && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1.5 text-xs font-medium text-white">
          {action.badge}
        </span>
      )}

      {/* Arrow for list layout */}
      {layout === 'list' && (
        <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors flex-shrink-0" />
      )}
    </>
  );

  const baseStyles = cn(
    'group relative flex items-center transition-all duration-200',
    'rounded-xl border',
    colors.border,
    colors.bgHover,
    action.disabled && 'opacity-50 cursor-not-allowed',
    !action.disabled && 'cursor-pointer hover:shadow-md hover:border-slate-300',
    layout === 'grid' && 'flex-col p-4',
    layout === 'list' && 'gap-3 p-3',
    layout === 'buttons' && 'gap-2 px-4 py-3 bg-white'
  );

  if (action.href && !action.disabled) {
    return (
      <Link href={action.href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={action.onClick}
      disabled={action.disabled}
      className={baseStyles}
    >
      {content}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuickActions({
  actions = defaultQuickActions,
  title = 'Quick Actions',
  showHeader = true,
  layout = 'grid',
  columns = 4,
  className,
}: QuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  const containerStyles = {
    grid: cn('grid gap-4', gridCols[columns]),
    list: 'space-y-2',
    buttons: 'flex flex-wrap gap-3',
  };

  const actionsContent = (
    <div className={containerStyles[layout]}>
      {actions.map((action) => (
        <QuickActionButton key={action.id} action={action} layout={layout} />
      ))}
    </div>
  );

  if (!showHeader) {
    return <div className={className}>{actionsContent}</div>;
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{actionsContent}</CardContent>
    </Card>
  );
}

// ============================================================================
// COMPACT QUICK ACTIONS (For use in headers/toolbars)
// ============================================================================

interface CompactQuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

export function CompactQuickActions({
  actions = defaultQuickActions.slice(0, 4),
  className,
}: CompactQuickActionsProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {actions.map((action) => {
        const ActionIcon = action.icon;
        const colors = colorConfig[action.color || 'default'];

        const buttonContent = (
          <Button
            key={action.id}
            variant="secondary"
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
            className="gap-2"
          >
            <ActionIcon className={cn('h-4 w-4', colors.icon)} />
            <span className="hidden sm:inline">{action.label}</span>
          </Button>
        );

        if (action.href && !action.disabled) {
          return (
            <Link key={action.id} href={action.href}>
              {buttonContent}
            </Link>
          );
        }

        return buttonContent;
      })}
    </div>
  );
}

export default QuickActions;
