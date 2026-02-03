'use client';

import { useState, useCallback, createContext, useContext, useId } from 'react';

import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// TABLE CONTEXT (FOR ROW SELECTION)
// ============================================================================

interface TableContextValue {
  selectedRows: Set<string>;
  toggleRowSelection: (id: string) => void;
  toggleAllRows: () => void;
  isAllSelected: boolean;
  isIndeterminate: boolean;
  selectableRows: boolean;
  totalRows: number;
}

const TableContext = createContext<TableContextValue | null>(null);

const useTableContext = () => {
  const context = useContext(TableContext);
  return context;
};

// ============================================================================
// TABLE ROOT
// ============================================================================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  totalRows?: number;
}

export function Table({
  children,
  className,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  totalRows = 0,
  ...props
}: TableProps) {
  const [internalSelected, setInternalSelected] = useState<Set<string>>(
    new Set(selectedIds)
  );

  const selectedRows = onSelectionChange ? new Set(selectedIds) : internalSelected;

  const toggleRowSelection = useCallback(
    (id: string) => {
      const newSelection = new Set(selectedRows);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }

      if (onSelectionChange) {
        onSelectionChange(Array.from(newSelection));
      } else {
        setInternalSelected(newSelection);
      }
    },
    [selectedRows, onSelectionChange]
  );

  const toggleAllRows = useCallback(() => {
    if (selectedRows.size === totalRows) {
      // Deselect all
      if (onSelectionChange) {
        onSelectionChange([]);
      } else {
        setInternalSelected(new Set());
      }
    } else {
      // We can't select all without knowing the IDs
      // This needs to be handled by parent component
      if (onSelectionChange) {
        // Parent should handle this
      }
    }
  }, [selectedRows.size, totalRows, onSelectionChange]);

  const isAllSelected = selectedRows.size > 0 && selectedRows.size === totalRows;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < totalRows;

  return (
    <TableContext.Provider
      value={{
        selectedRows,
        toggleRowSelection,
        toggleAllRows,
        isAllSelected,
        isIndeterminate,
        selectableRows: selectable,
        totalRows,
      }}
    >
      <div className="overflow-x-auto">
        <table
          className={cn('min-w-full divide-y divide-slate-200', className)}
          role="grid"
          {...props}
        >
          {children}
        </table>
      </div>
    </TableContext.Provider>
  );
}

// ============================================================================
// TABLE HEAD
// ============================================================================

interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableHead({ children, className, ...props }: TableHeadProps) {
  return (
    <thead className={cn('bg-slate-50', className)} {...props}>
      {children}
    </thead>
  );
}

// ============================================================================
// TABLE BODY
// ============================================================================

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableBody({ children, className, ...props }: TableBodyProps) {
  return (
    <tbody
      className={cn('divide-y divide-slate-200 bg-white', className)}
      {...props}
    >
      {children}
    </tbody>
  );
}

// ============================================================================
// TABLE ROW
// ============================================================================

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  selected?: boolean;
  rowId?: string;
}

export function TableRow({
  children,
  className,
  selected,
  rowId,
  ...props
}: TableRowProps) {
  const context = useTableContext();
  const isSelected = rowId
    ? context?.selectedRows.has(rowId) ?? selected
    : selected;

  return (
    <tr
      className={cn(
        'transition-colors hover:bg-slate-50',
        isSelected && 'bg-primary-50 hover:bg-primary-100',
        className
      )}
      aria-selected={isSelected}
      data-state={isSelected ? 'selected' : undefined}
      {...props}
    >
      {children}
    </tr>
  );
}

// ============================================================================
// TABLE HEADER CELL
// ============================================================================

type SortDirection = 'asc' | 'desc' | null;

interface TableHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  sortable?: boolean;
  sorted?: SortDirection;
  onSort?: () => void;
}

export function TableHeaderCell({
  children,
  className,
  sortable = false,
  sorted = null,
  onSort,
  ...props
}: TableHeaderCellProps) {
  const content = sortable ? (
    <button
      type="button"
      onClick={onSort}
      className={cn(
        'group inline-flex items-center gap-1 font-medium transition-colors',
        'hover:text-slate-900 focus:outline-none focus:text-slate-900'
      )}
      aria-sort={
        sorted === 'asc'
          ? 'ascending'
          : sorted === 'desc'
            ? 'descending'
            : undefined
      }
    >
      {children}
      <span className="flex-shrink-0">
        {sorted === 'asc' ? (
          <ChevronUp className="h-4 w-4 text-slate-700" aria-hidden="true" />
        ) : sorted === 'desc' ? (
          <ChevronDown className="h-4 w-4 text-slate-700" aria-hidden="true" />
        ) : (
          <ChevronsUpDown
            className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-hidden="true"
          />
        )}
      </span>
    </button>
  ) : (
    children
  );

  return (
    <th
      className={cn(
        'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500',
        sortable && 'cursor-pointer select-none',
        className
      )}
      scope="col"
      {...props}
    >
      {content}
    </th>
  );
}

// ============================================================================
// TABLE CELL
// ============================================================================

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children?: React.ReactNode;
  header?: boolean;
}

export function TableCell({
  children,
  className,
  header = false,
  ...props
}: TableCellProps) {
  if (header) {
    return (
      <th
        className={cn(
          'px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500',
          className
        )}
        scope="col"
        {...props}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      className={cn(
        'whitespace-nowrap px-6 py-4 text-sm text-slate-900',
        className
      )}
      {...props}
    >
      {children}
    </td>
  );
}

// ============================================================================
// TABLE CHECKBOX CELL (FOR SELECTION)
// ============================================================================

interface TableCheckboxCellProps {
  rowId?: string;
  isHeader?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  indeterminate?: boolean;
  'aria-label'?: string;
}

export function TableCheckboxCell({
  rowId,
  isHeader = false,
  checked: controlledChecked,
  onChange,
  indeterminate: controlledIndeterminate,
  'aria-label': ariaLabel,
}: TableCheckboxCellProps) {
  const context = useTableContext();
  const checkboxId = useId();

  // For header checkbox (select all)
  if (isHeader) {
    const isChecked = controlledChecked ?? context?.isAllSelected ?? false;
    const isIndeterminate =
      controlledIndeterminate ?? context?.isIndeterminate ?? false;

    return (
      <th className="w-12 px-4 py-3" scope="col">
        <input
          type="checkbox"
          id={checkboxId}
          checked={isChecked}
          ref={(el) => {
            if (el) {
              el.indeterminate = isIndeterminate;
            }
          }}
          onChange={(e) => {
            onChange?.(e.target.checked);
            context?.toggleAllRows();
          }}
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-0"
          aria-label={ariaLabel || 'Select all rows'}
        />
      </th>
    );
  }

  // For row checkbox
  const isChecked = rowId
    ? context?.selectedRows.has(rowId) ?? controlledChecked ?? false
    : controlledChecked ?? false;

  return (
    <td className="w-12 px-4 py-4">
      <input
        type="checkbox"
        id={checkboxId}
        checked={isChecked}
        onChange={(e) => {
          onChange?.(e.target.checked);
          if (rowId) {
            context?.toggleRowSelection(rowId);
          }
        }}
        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 focus:ring-2 focus:ring-offset-0"
        aria-label={ariaLabel || 'Select row'}
      />
    </td>
  );
}

// ============================================================================
// TABLE EMPTY STATE
// ============================================================================

interface TableEmptyProps {
  children?: React.ReactNode;
  colSpan?: number;
  className?: string;
}

export function TableEmpty({
  children = 'No data available',
  colSpan = 1,
  className,
}: TableEmptyProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          'px-6 py-12 text-center text-sm text-slate-500',
          className
        )}
      >
        {children}
      </td>
    </tr>
  );
}

// ============================================================================
// TABLE FOOTER
// ============================================================================

interface TableFooterProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
}

export function TableFooter({ children, className, ...props }: TableFooterProps) {
  return (
    <tfoot
      className={cn('bg-slate-50 border-t border-slate-200', className)}
      {...props}
    >
      {children}
    </tfoot>
  );
}
