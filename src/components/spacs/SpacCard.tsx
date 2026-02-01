'use client';

import Link from 'next/link';
import {
  Building2,
  MoreHorizontal,
  Clock,
  DollarSign,
  Eye,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SpacStatusBadge } from './SpacStatusBadge';
import { formatLargeNumber, formatDate, daysUntil, cn } from '@/lib/utils';
import { SPAC_PHASE_LABELS } from '@/lib/constants';
import type { SPACStatus, SPACPhase } from '@/types';
import { useState, useRef, useEffect } from 'react';

interface SpacCardProps {
  spac: {
    id: string;
    name: string;
    ticker: string;
    status: SPACStatus | string;
    phase?: SPACPhase | string;
    trustBalance?: number | null;
    ipoSize?: number | null;
    deadline?: Date | string | null;
    targetSectors?: string[];
    activeTargets?: number;
  };
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function SpacCard({ spac, onView, onEdit, onDelete }: SpacCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const days = daysUntil(spac.deadline);
  const isUrgent = days !== null && days <= 30;
  const isCritical = days !== null && days <= 14;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuAction = (
    e: React.MouseEvent,
    action: ((id: string) => void) | undefined
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    if (action) {
      action(spac.id);
    }
  };

  return (
    <Link href={`/spacs/${spac.id}`}>
      <Card className="h-full cursor-pointer transition-all duration-200 hover:border-primary-200 hover:shadow-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50">
                <Building2 className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{spac.name}</h3>
                <p className="text-sm font-medium text-slate-500">{spac.ticker}</p>
              </div>
            </div>
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(!menuOpen);
                }}
                className="rounded p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-slate-200 bg-white py-1 shadow-lg">
                  <button
                    onClick={(e) => handleMenuAction(e, onView)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                  <button
                    onClick={(e) => handleMenuAction(e, onEdit)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleMenuAction(e, onDelete)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Status and Phase */}
          <div className="mb-4 flex flex-wrap gap-2">
            <SpacStatusBadge status={spac.status} />
            {spac.phase && (
              <Badge variant="secondary">
                {SPAC_PHASE_LABELS[spac.phase] || spac.phase}
              </Badge>
            )}
          </div>

          {/* Metrics */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">Trust Balance</p>
              <p className="text-sm font-semibold text-slate-900">
                {spac.trustBalance ? formatLargeNumber(spac.trustBalance) : '-'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">IPO Size</p>
              <p className="text-sm font-semibold text-slate-900">
                {spac.ipoSize ? formatLargeNumber(spac.ipoSize) : '-'}
              </p>
            </div>
          </div>

          {/* Deadline */}
          {spac.deadline && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg p-3',
                isCritical
                  ? 'bg-danger-50'
                  : isUrgent
                    ? 'bg-warning-50'
                    : 'bg-slate-50'
              )}
            >
              <Clock
                className={cn(
                  'h-4 w-4',
                  isCritical
                    ? 'text-danger-600'
                    : isUrgent
                      ? 'text-warning-600'
                      : 'text-slate-500'
                )}
              />
              <div className="flex-1">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isCritical
                      ? 'text-danger-600'
                      : isUrgent
                        ? 'text-warning-600'
                        : 'text-slate-500'
                  )}
                >
                  Deadline
                </p>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    isCritical
                      ? 'text-danger-700'
                      : isUrgent
                        ? 'text-warning-700'
                        : 'text-slate-700'
                  )}
                >
                  {formatDate(spac.deadline)}{' '}
                  <span className="font-normal">
                    ({days !== null ? (days > 0 ? `${days} days` : 'Expired') : '-'})
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <div className="flex flex-wrap gap-1">
              {spac.targetSectors?.slice(0, 2).map((sector) => (
                <span
                  key={sector}
                  className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  {sector}
                </span>
              ))}
              {spac.targetSectors && spac.targetSectors.length > 2 && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                  +{spac.targetSectors.length - 2}
                </span>
              )}
            </div>
            {spac.activeTargets !== undefined && (
              <span className="text-sm text-slate-500">
                {spac.activeTargets} active target{spac.activeTargets !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
