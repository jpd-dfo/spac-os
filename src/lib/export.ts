/**
 * Export Utilities for SPAC OS
 *
 * Provides CSV and Excel export functionality for pipeline data.
 * Exports respect current filters (export what you see).
 */

import * as XLSX from 'xlsx';

/**
 * Interface for exportable target data
 */
export interface ExportableTarget {
  id: string;
  name: string;
  industry: string;
  stage: string;
  enterpriseValue: number;
  revenue?: number;
  ebitda?: number;
  evaluationScore: number;
  priority?: string;
  status?: string;
  headquarters?: string;
  employeeCount?: number;
  description?: string;
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Column configuration for export
 */
interface ExportColumn {
  key: keyof ExportableTarget | 'tags';
  header: string;
  formatter?: (value: unknown) => string;
}

/**
 * Default columns for export
 */
const DEFAULT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'name', header: 'Name' },
  { key: 'industry', header: 'Industry' },
  { key: 'stage', header: 'Stage', formatter: formatStage },
  {
    key: 'enterpriseValue',
    header: 'Enterprise Value',
    formatter: formatCurrency
  },
  {
    key: 'revenue',
    header: 'Revenue',
    formatter: formatCurrency
  },
  {
    key: 'ebitda',
    header: 'EBITDA',
    formatter: formatCurrency
  },
  { key: 'evaluationScore', header: 'Score' },
  { key: 'priority', header: 'Priority', formatter: formatPriority },
  { key: 'headquarters', header: 'Headquarters' },
  { key: 'employeeCount', header: 'Employees' },
  { key: 'tags', header: 'Tags', formatter: formatTags },
];

/**
 * Format currency values for display
 */
function formatCurrency(value: unknown): string {
  if (value === null || value === undefined || value === 0) {
    return '';
  }
  const num = Number(value);
  if (isNaN(num)) {
    return '';
  }

  // Format as millions with M suffix
  if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(1)}M`;
  }
  // Format as thousands with K suffix
  if (num >= 1000) {
    return `$${(num / 1000).toFixed(0)}K`;
  }
  return `$${num.toFixed(0)}`;
}

/**
 * Format stage for display
 */
function formatStage(value: unknown): string {
  if (!value) {
    return '';
  }
  const stageMap: Record<string, string> = {
    'sourcing': 'Sourcing',
    'initial_screening': 'Initial Screening',
    'deep_evaluation': 'Deep Evaluation',
    'negotiation': 'Negotiation',
    'execution': 'Execution',
    'closed_passed': 'Closed/Passed',
  };
  return stageMap[String(value)] || String(value);
}

/**
 * Format priority for display
 */
function formatPriority(value: unknown): string {
  if (!value) {
    return '';
  }
  const priorityMap: Record<string, string> = {
    'critical': 'Critical',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low',
  };
  return priorityMap[String(value)] || String(value);
}

/**
 * Format tags array for display
 */
function formatTags(value: unknown): string {
  if (!value || !Array.isArray(value)) {
    return '';
  }
  return value.join(', ');
}

/**
 * Transform target data to export row
 */
function transformToExportRow(
  target: ExportableTarget,
  columns: ExportColumn[]
): Record<string, string | number> {
  const row: Record<string, string | number> = {};

  for (const column of columns) {
    const value = target[column.key as keyof ExportableTarget];
    if (column.formatter) {
      row[column.header] = column.formatter(value);
    } else if (value !== null && value !== undefined) {
      if (value instanceof Date) {
        row[column.header] = value.toISOString().split('T')[0] ?? '';
      } else if (Array.isArray(value)) {
        row[column.header] = value.join(', ');
      } else {
        row[column.header] = value as string | number;
      }
    } else {
      row[column.header] = '';
    }
  }

  return row;
}

/**
 * Generate CSV content from data
 */
function generateCSVContent(
  data: ExportableTarget[],
  columns: ExportColumn[] = DEFAULT_EXPORT_COLUMNS
): string {
  // Create header row
  const headers = columns.map(col => col.header);
  const rows: string[][] = [headers];

  // Create data rows
  for (const target of data) {
    const row: string[] = [];
    for (const column of columns) {
      const value = target[column.key as keyof ExportableTarget];
      let formatted: string;

      if (column.formatter) {
        formatted = column.formatter(value);
      } else if (value !== null && value !== undefined) {
        if (value instanceof Date) {
          formatted = value.toISOString().split('T')[0] ?? '';
        } else if (Array.isArray(value)) {
          formatted = value.join(', ');
        } else {
          formatted = String(value);
        }
      } else {
        formatted = '';
      }

      // Escape CSV special characters
      if (formatted.includes(',') || formatted.includes('"') || formatted.includes('\n')) {
        formatted = `"${formatted.replace(/"/g, '""')}"`;
      }

      row.push(formatted);
    }
    rows.push(row);
  }

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Trigger file download in browser
 */
function downloadFile(content: Blob, filename: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV file
 *
 * @param data - Array of target data to export
 * @param filename - Name of the exported file (without extension)
 * @param columns - Optional custom column configuration
 */
export async function exportToCSV(
  data: ExportableTarget[],
  filename: string = 'pipeline-export',
  columns: ExportColumn[] = DEFAULT_EXPORT_COLUMNS
): Promise<void> {
  // Simulate small delay for loading state feedback
  await new Promise(resolve => setTimeout(resolve, 100));

  const csvContent = generateCSVContent(data, columns);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(blob, `${filename}-${timestamp}.csv`);
}

/**
 * Export data to Excel file
 *
 * @param data - Array of target data to export
 * @param filename - Name of the exported file (without extension)
 * @param columns - Optional custom column configuration
 */
export async function exportToExcel(
  data: ExportableTarget[],
  filename: string = 'pipeline-export',
  columns: ExportColumn[] = DEFAULT_EXPORT_COLUMNS
): Promise<void> {
  // Simulate small delay for loading state feedback
  await new Promise(resolve => setTimeout(resolve, 100));

  // Transform data to export format
  const exportData = data.map(target => transformToExportRow(target, columns));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  const columnWidths = columns.map(col => ({
    wch: Math.max(col.header.length, 15)
  }));
  worksheet['!cols'] = columnWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pipeline');

  // Generate buffer and create blob
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const timestamp = new Date().toISOString().split('T')[0];
  downloadFile(blob, `${filename}-${timestamp}.xlsx`);
}

/**
 * Export types for external use
 */
export type { ExportColumn };
