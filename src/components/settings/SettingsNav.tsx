'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  User,
  Bell,
  Key,
  Users,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

const settingsNavItems: NavItem[] = [
  {
    name: 'Profile',
    href: '/settings/profile',
    icon: User,
    description: 'Personal information and account settings',
  },
  {
    name: 'Notifications',
    href: '/settings/notifications',
    icon: Bell,
    description: 'Email and push notification preferences',
  },
  {
    name: 'API Keys',
    href: '/settings/api-keys',
    icon: Key,
    description: 'Manage API keys and tokens',
  },
  {
    name: 'Team',
    href: '/settings/team',
    icon: Users,
    description: 'Team members and permissions',
  },
  {
    name: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Subscription and payment details',
  },
];

interface SettingsNavProps {
  className?: string;
}

export function SettingsNav({ className }: SettingsNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/settings') {
      return pathname === '/settings';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className={cn('space-y-1', className)}>
      {settingsNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
              active
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            <Icon
              className={cn(
                'h-5 w-5 flex-shrink-0',
                active ? 'text-primary-600' : 'text-slate-400'
              )}
            />
            <div className="min-w-0 flex-1">
              <p className={cn('truncate', active && 'font-semibold')}>{item.name}</p>
              {item.description && (
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              )}
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
