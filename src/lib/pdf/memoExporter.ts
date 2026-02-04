import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

// ============================================================================
// Types
// ============================================================================

export interface SaveToDocumentsOptions {
  /** Target ID to associate the document with */
  targetId?: string;
  /** SPAC ID to associate the document with */
  spacId?: string;
  /** Document category */
  category?: string;
}

export interface SaveToDocumentsResult {
  success: boolean;
  document?: {
    id: string;
    name: string;
    type: string;
    fileSize: number;
    mimeType: string;
    fileUrl: string;
    createdAt: Date;
  };
  error?: string;
}

export interface MemoData {
  companyName: string;
  executiveSummary: string;
  investmentThesis: string;
  keyRisks: string;
  financialAnalysis: string;
  managementAssessment: string;
  recommendation: string;
  generatedAt?: Date;
  valuation?: number;
  revenue?: number;
  ebitda?: number;
  sector?: string;
}

interface PDFSection {
  title: string;
  content: string;
}

// ============================================================================
// Constants
// ============================================================================

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const COLORS = {
  primary: '#1e40af', // Blue-800
  secondary: '#475569', // Slate-600
  text: '#1e293b', // Slate-800
  lightGray: '#94a3b8', // Slate-400
  divider: '#e2e8f0', // Slate-200
};

// ============================================================================
// Helper Functions
// ============================================================================

function formatCurrency(value: number | null | undefined): string {
  // Handle null, undefined, and NaN gracefully
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Wraps text to fit within a specified width and returns array of lines
 */
function wrapText(doc: jsPDF, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');

  for (const paragraph of paragraphs) {
    if (paragraph.trim() === '') {
      lines.push('');
      continue;
    }

    const wrappedLines = doc.splitTextToSize(paragraph, maxWidth);
    lines.push(...wrappedLines);
  }

  return lines;
}

// ============================================================================
// PDF Generation
// ============================================================================

/**
 * Generates a PDF investment memo document
 * @param memoData - The memo data to include in the PDF
 * @returns A Blob containing the PDF data
 */
export function generateMemoPDF(memoData: MemoData): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  let yPosition = MARGIN_TOP;

  // Helper to check if we need a new page
  const checkPageBreak = (requiredSpace: number): void => {
    if (yPosition + requiredSpace > PAGE_HEIGHT - MARGIN_BOTTOM) {
      doc.addPage();
      yPosition = MARGIN_TOP;
    }
  };

  // Helper to add a horizontal line
  const addDivider = (): void => {
    doc.setDrawColor(COLORS.divider);
    doc.setLineWidth(0.5);
    doc.line(MARGIN_LEFT, yPosition, PAGE_WIDTH - MARGIN_RIGHT, yPosition);
    yPosition += 5;
  };

  // =========================================================================
  // Header Section
  // =========================================================================

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(COLORS.primary);
  doc.text('Investment Memo', MARGIN_LEFT, yPosition);
  yPosition += 10;

  // Company Name
  doc.setFontSize(18);
  doc.setTextColor(COLORS.text);
  doc.text(memoData.companyName, MARGIN_LEFT, yPosition);
  yPosition += 8;

  // Metadata line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.lightGray);

  const generatedDate = memoData.generatedAt
    ? formatDate(memoData.generatedAt)
    : formatDate(new Date());

  const metadataItems: string[] = [`Generated: ${generatedDate}`];

  if (memoData.sector) {
    metadataItems.push(`Sector: ${memoData.sector}`);
  }

  doc.text(metadataItems.join('  |  '), MARGIN_LEFT, yPosition);
  yPosition += 8;

  // Financial Summary Box (if data available)
  if (memoData.valuation || memoData.revenue || memoData.ebitda) {
    checkPageBreak(20);

    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(MARGIN_LEFT, yPosition, CONTENT_WIDTH, 15, 2, 2, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.secondary);

    let xPos = MARGIN_LEFT + 10;
    const boxY = yPosition + 10;

    if (memoData.valuation) {
      doc.text('Valuation:', xPos, boxY);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(memoData.valuation), xPos + 20, boxY);
      doc.setFont('helvetica', 'normal');
      xPos += 50;
    }

    if (memoData.revenue) {
      doc.text('Revenue:', xPos, boxY);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(memoData.revenue), xPos + 18, boxY);
      doc.setFont('helvetica', 'normal');
      xPos += 50;
    }

    if (memoData.ebitda) {
      doc.text('EBITDA:', xPos, boxY);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(memoData.ebitda), xPos + 17, boxY);
    }

    yPosition += 20;
  }

  addDivider();

  // =========================================================================
  // Content Sections
  // =========================================================================

  const sections: PDFSection[] = [
    { title: 'Executive Summary', content: memoData.executiveSummary },
    { title: 'Investment Thesis', content: memoData.investmentThesis },
    { title: 'Key Risks & Considerations', content: memoData.keyRisks },
    { title: 'Financial Analysis', content: memoData.financialAnalysis },
    { title: 'Management Assessment', content: memoData.managementAssessment },
    { title: 'Recommendation', content: memoData.recommendation },
  ];

  for (const section of sections) {
    // Skip empty sections
    if (!section.content || section.content.trim() === '') {
      continue;
    }

    // Section title
    checkPageBreak(20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.primary);
    doc.text(section.title, MARGIN_LEFT, yPosition);
    yPosition += 6;

    // Section content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);

    const lines = wrapText(doc, section.content, CONTENT_WIDTH);
    const lineHeight = 5;

    for (const line of lines) {
      checkPageBreak(lineHeight + 2);

      if (line === '') {
        yPosition += lineHeight / 2;
      } else {
        doc.text(line, MARGIN_LEFT, yPosition);
        yPosition += lineHeight;
      }
    }

    yPosition += 8; // Space after section
  }

  // =========================================================================
  // Footer
  // =========================================================================

  checkPageBreak(15);
  addDivider();

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.lightGray);
  doc.text(
    'Generated by SPAC OS AI - This document is for informational purposes only.',
    MARGIN_LEFT,
    yPosition
  );

  // Return as blob
  return doc.output('blob');
}

/**
 * Generates a PDF and triggers a download in the browser
 * @param memoData - The memo data to include in the PDF
 * @param filename - Optional custom filename (without extension)
 */
export function downloadMemoPDF(
  memoData: MemoData,
  filename?: string
): void {
  try {
    const blob = generateMemoPDF(memoData);

    // Create filename
    const sanitizedCompanyName = memoData.companyName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const date = new Date().toISOString().split('T')[0];
    const finalFilename = filename || `investment-memo-${sanitizedCompanyName}-${date}.pdf`;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Investment memo downloaded: ${finalFilename}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('PDF export failed:', error);
    toast.error(`Failed to export PDF: ${errorMessage}`);
  }
}

/**
 * Generates a PDF and saves it to the documents system via API
 * @param memoData - The memo data to include in the PDF
 * @param options - Options for saving to documents (targetId, spacId, category)
 * @returns Result object with success status and document details
 */
export async function saveMemoPDFToDocuments(
  memoData: MemoData,
  options: SaveToDocumentsOptions = {}
): Promise<SaveToDocumentsResult> {
  try {
    const blob = generateMemoPDF(memoData);

    // Create filename
    const sanitizedCompanyName = memoData.companyName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const date = new Date().toISOString().split('T')[0];
    const filename = `investment-memo-${sanitizedCompanyName}-${date}.pdf`;

    // Create a File object from the blob
    const file = new File([blob], filename, { type: 'application/pdf' });

    // Create form data matching the upload API expectations
    const formData = new FormData();
    formData.append('file', file);
    formData.append(
      'metadata',
      JSON.stringify({
        name: filename,
        type: 'INVESTOR_PRESENTATION', // Investment memo is closest to investor presentation
        category: options.category || 'Investment Memos',
        spacId: options.spacId,
        targetId: options.targetId,
        status: 'FINAL',
      })
    );

    // Upload via the documents API
    const response = await fetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save document');
    }

    const data = await response.json();

    toast.success(`Investment memo saved to documents: ${filename}`);

    return {
      success: true,
      document: data.document,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Failed to save PDF to documents:', error);
    toast.error(`Failed to save to documents: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
    };
  }
}
