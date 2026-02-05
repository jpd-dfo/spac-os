'use client';

import { useCallback, useMemo } from 'react';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

import { Button } from './Button';
import { Select } from './Select';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  totalItems: number;
  /** Current page size */
  pageSize: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (size: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Number of siblings on each side of current page */
  siblingCount?: number;
  /** Show page size selector */
  showPageSize?: boolean;
  /** Show results count text */
  showResultsCount?: boolean;
  /** Custom class name */
  className?: string;
  /** Disable all interactions */
  disabled?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generates an array of page numbers with ellipsis for pagination
 */
function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  // Always show first page, last page, current page, and siblings
  const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis slots

  // If total pages is less than what we need, show all pages
  if (totalPages <= totalPageNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    // Show more pages at the start
    const leftRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => i + 1
    );
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    // Show more pages at the end
    const rightRange = Array.from(
      { length: 3 + 2 * siblingCount },
      (_, i) => totalPages - (3 + 2 * siblingCount) + i + 1
    );
    return [1, 'ellipsis', ...rightRange];
  }

  // Show ellipsis on both sides
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
}

// ============================================================================
// PAGINATION COMPONENT
// ============================================================================

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  siblingCount = 1,
  showPageSize = true,
  showResultsCount = true,
  className,
  disabled = false,
}: PaginationProps) {
  // Calculate the range of items being shown
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  // Handler for page size change
  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newSize = parseInt(e.target.value, 10);
      onPageSizeChange(newSize);
      // Reset to first page when changing page size
      onPageChange(1);
    },
    [onPageSizeChange, onPageChange]
  );

  // Handler for going to previous page
  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  // Handler for going to next page
  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, onPageChange]);

  // Don't render if there's nothing to paginate
  if (totalItems === 0 && totalPages === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between',
        className
      )}
    >
      {/* Results count and page size selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Results count text */}
        {showResultsCount && (
          <p className="text-sm text-slate-600">
            Showing{' '}
            <span className="font-medium text-slate-900">{startItem}</span>
            {' - '}
            <span className="font-medium text-slate-900">{endItem}</span>
            {' of '}
            <span className="font-medium text-slate-900">{totalItems}</span>
            {' results'}
          </p>
        )}

        {/* Page size selector */}
        {showPageSize && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 whitespace-nowrap">
              Rows per page:
            </span>
            <Select
              value={pageSize.toString()}
              onChange={handlePageSizeChange}
              options={pageSizeOptions.map((size) => ({
                value: size.toString(),
                label: size.toString(),
              }))}
              disabled={disabled}
              className="w-20"
            />
          </div>
        )}
      </div>

      {/* Page navigation */}
      <nav
        className="flex items-center gap-1"
        aria-label="Pagination"
        role="navigation"
      >
        {/* Previous button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevious}
          disabled={disabled || currentPage <= 1}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers - Desktop view */}
        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNumber, index) => {
            if (pageNumber === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-8 w-8 items-center justify-center text-slate-400"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              );
            }

            const isCurrentPage = pageNumber === currentPage;
            return (
              <Button
                key={pageNumber}
                variant={isCurrentPage ? 'primary' : 'ghost'}
                size="icon-sm"
                onClick={() => onPageChange(pageNumber)}
                disabled={disabled}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isCurrentPage ? 'page' : undefined}
              >
                {pageNumber}
              </Button>
            );
          })}
        </div>

        {/* Page indicator - Mobile view */}
        <div className="flex sm:hidden items-center px-3">
          <span className="text-sm font-medium text-slate-900">
            {currentPage}
          </span>
          <span className="text-sm text-slate-500 mx-1">/</span>
          <span className="text-sm text-slate-500">{totalPages}</span>
        </div>

        {/* Next button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleNext}
          disabled={disabled || currentPage >= totalPages}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </nav>
    </div>
  );
}

// ============================================================================
// URL-BASED PAGINATION HOOK
// ============================================================================

export interface UsePaginationUrlOptions {
  /** Default page number */
  defaultPage?: number;
  /** Default page size */
  defaultPageSize?: number;
  /** URL parameter name for page */
  pageParam?: string;
  /** URL parameter name for page size */
  pageSizeParam?: string;
}

export interface UsePaginationUrlResult {
  /** Current page from URL */
  page: number;
  /** Current page size from URL */
  pageSize: number;
  /** Create URL search params with new page */
  createPageUrl: (page: number) => URLSearchParams;
  /** Create URL search params with new page size */
  createPageSizeUrl: (pageSize: number) => URLSearchParams;
}

/**
 * Hook for URL-based pagination using searchParams
 * Use with useSearchParams from next/navigation
 *
 * @example
 * ```tsx
 * 'use client';
 * import { useSearchParams, useRouter, usePathname } from 'next/navigation';
 * import { Pagination, usePaginationUrl } from '@/components/ui/Pagination';
 *
 * export function MyList() {
 *   const searchParams = useSearchParams();
 *   const router = useRouter();
 *   const pathname = usePathname();
 *
 *   const { page, pageSize, createPageUrl, createPageSizeUrl } = usePaginationUrl(searchParams);
 *
 *   const handlePageChange = (newPage: number) => {
 *     router.push(`${pathname}?${createPageUrl(newPage).toString()}`);
 *   };
 *
 *   const handlePageSizeChange = (newSize: number) => {
 *     router.push(`${pathname}?${createPageSizeUrl(newSize).toString()}`);
 *   };
 *
 *   return (
 *     <Pagination
 *       currentPage={page}
 *       totalPages={10}
 *       totalItems={100}
 *       pageSize={pageSize}
 *       onPageChange={handlePageChange}
 *       onPageSizeChange={handlePageSizeChange}
 *     />
 *   );
 * }
 * ```
 */
export function usePaginationUrl(
  searchParams: URLSearchParams | ReadonlyURLSearchParams,
  options: UsePaginationUrlOptions = {}
): UsePaginationUrlResult {
  const {
    defaultPage = 1,
    defaultPageSize = 10,
    pageParam = 'page',
    pageSizeParam = 'pageSize',
  } = options;

  // Parse page from URL
  const pageStr = searchParams.get(pageParam);
  const page = pageStr ? Math.max(1, parseInt(pageStr, 10) || defaultPage) : defaultPage;

  // Parse page size from URL
  const pageSizeStr = searchParams.get(pageSizeParam);
  const pageSize = pageSizeStr
    ? Math.max(1, parseInt(pageSizeStr, 10) || defaultPageSize)
    : defaultPageSize;

  // Create new URL params with updated page
  const createPageUrl = useCallback(
    (newPage: number): URLSearchParams => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage === defaultPage) {
        params.delete(pageParam);
      } else {
        params.set(pageParam, newPage.toString());
      }
      return params;
    },
    [searchParams, pageParam, defaultPage]
  );

  // Create new URL params with updated page size
  const createPageSizeUrl = useCallback(
    (newPageSize: number): URLSearchParams => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPageSize === defaultPageSize) {
        params.delete(pageSizeParam);
      } else {
        params.set(pageSizeParam, newPageSize.toString());
      }
      // Reset to page 1 when changing page size
      params.delete(pageParam);
      return params;
    },
    [searchParams, pageSizeParam, defaultPageSize, pageParam]
  );

  return {
    page,
    pageSize,
    createPageUrl,
    createPageSizeUrl,
  };
}

// Type for ReadonlyURLSearchParams (from next/navigation)
type ReadonlyURLSearchParams = {
  get(name: string): string | null;
  toString(): string;
};
