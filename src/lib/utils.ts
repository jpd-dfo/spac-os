import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

// ============================================================================
// CLASS NAME UTILITIES
// ============================================================================

/**
 * Merge class names with Tailwind CSS conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Format a date with a standard format
 */
export function formatDate(date: Date | string | null | undefined, formatStr = 'MMM d, yyyy'): string {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return format(parsed, formatStr);
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

/**
 * Get relative time from now
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '-';
  return formatDistanceToNow(parsed, { addSuffix: true });
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  return parsed < new Date();
}

/**
 * Get days until a date
 */
export function daysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return null;
  const now = new Date();
  const diff = parsed.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Format a number as currency
 */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format a number in millions/billions
 */
export function formatLargeNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a number with locale-specific formatting
 */
export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
): string {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

/**
 * Format a multiple (e.g., EV/EBITDA)
 */
export function formatMultiple(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(1)}x`;
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Generate initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Slugify a string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert enum value to display label
 */
export function enumToLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Check if a string is a valid email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Group an array by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key]);
      if (!result[groupKey]) {
        result[groupKey] = [];
      }
      result[groupKey].push(item);
      return result;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Remove duplicates from an array
 */
export function unique<T>(array: T[], key?: keyof T): T[] {
  if (!key) {
    return [...new Set(array)];
  }
  const seen = new Set();
  return array.filter((item) => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// ============================================================================
// STATUS UTILITIES
// ============================================================================

export const statusColors: Record<string, string> = {
  // SPAC Status
  PRE_IPO: 'bg-gray-100 text-gray-800',
  SEARCHING: 'bg-blue-100 text-blue-800',
  LOI_SIGNED: 'bg-yellow-100 text-yellow-800',
  DA_ANNOUNCED: 'bg-purple-100 text-purple-800',
  PROXY_FILED: 'bg-indigo-100 text-indigo-800',
  VOTE_SCHEDULED: 'bg-orange-100 text-orange-800',
  CLOSING: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-green-100 text-green-800',
  LIQUIDATED: 'bg-red-100 text-red-800',

  // Task Status
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  BLOCKED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',

  // Document Status
  DRAFT: 'bg-gray-100 text-gray-800',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  FINAL: 'bg-blue-100 text-blue-800',
  ARCHIVED: 'bg-gray-100 text-gray-600',

  // Priority
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  CRITICAL: 'bg-red-100 text-red-800',
};

export function getStatusColor(status: string): string {
  return statusColors[status] || 'bg-gray-100 text-gray-800';
}
