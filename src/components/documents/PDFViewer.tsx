'use client';

import { useState, useCallback } from 'react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RotateCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/utils';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// ============================================================================
// TYPES
// ============================================================================

interface PDFViewerProps {
  /** URL or File object to display */
  file: string | File | null;
  /** Whether the viewer modal is open */
  isOpen: boolean;
  /** Callback when viewer is closed */
  onClose: () => void;
  /** Optional document name for display */
  documentName?: string;
  /** Callback for download action */
  onDownload?: () => void;
}

// ============================================================================
// PDF VIEWER COMPONENT
// ============================================================================

export function PDFViewer({
  file,
  isOpen,
  onClose,
  documentName = 'Document',
  onDownload,
}: PDFViewerProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setIsLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message || 'Failed to load PDF');
    setIsLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages));
  }, [numPages]);

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handlePageInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 1 && value <= numPages) {
        setCurrentPage(value);
      }
    },
    [numPages]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setCurrentPage(1);
    setScale(1.0);
    setRotation(0);
    setError(null);
    setIsLoading(true);
    onClose();
  }, [onClose]);

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen || !file) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-black/80',
        isFullscreen ? '' : 'p-4 md:p-8'
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          'flex items-center justify-between bg-white px-4 py-2 shadow-md',
          isFullscreen ? '' : 'rounded-t-lg'
        )}
      >
        {/* Left: Close & Title */}
        <div className="flex items-center gap-3">
          <Tooltip content="Close">
            <button
              onClick={handleClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </Tooltip>
          <div className="hidden sm:block">
            <h2 className="font-semibold text-slate-900 truncate max-w-xs">
              {documentName}
            </h2>
          </div>
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center gap-2">
          <Tooltip content="Previous Page">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5 text-slate-600" />
            </button>
          </Tooltip>

          <div className="flex items-center gap-1">
            <input
              type="number"
              value={currentPage}
              onChange={handlePageInputChange}
              min={1}
              max={numPages}
              className="w-12 rounded border border-slate-200 px-2 py-1 text-center text-sm focus:border-primary-500 focus:outline-none"
            />
            <span className="text-sm text-slate-500">/ {numPages || '-'}</span>
          </div>

          <Tooltip content="Next Page">
            <button
              onClick={goToNextPage}
              disabled={currentPage >= numPages}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5 text-slate-600" />
            </button>
          </Tooltip>

          <div className="mx-2 h-6 w-px bg-slate-200" />

          {/* Zoom Controls */}
          <Tooltip content="Zoom Out">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomOut className="h-5 w-5 text-slate-600" />
            </button>
          </Tooltip>

          <span className="min-w-[50px] text-center text-sm text-slate-600">
            {Math.round(scale * 100)}%
          </span>

          <Tooltip content="Zoom In">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3.0}
              className="rounded p-1.5 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ZoomIn className="h-5 w-5 text-slate-600" />
            </button>
          </Tooltip>

          <div className="mx-2 h-6 w-px bg-slate-200" />

          {/* Rotate */}
          <Tooltip content="Rotate">
            <button
              onClick={handleRotate}
              className="rounded p-1.5 hover:bg-slate-100"
            >
              <RotateCw className="h-5 w-5 text-slate-600" />
            </button>
          </Tooltip>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Tooltip content={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            <button
              onClick={toggleFullscreen}
              className="rounded p-1.5 hover:bg-slate-100"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5 text-slate-600" />
              ) : (
                <Maximize2 className="h-5 w-5 text-slate-600" />
              )}
            </button>
          </Tooltip>

          {onDownload && (
            <Button variant="primary" size="sm" onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          )}
        </div>
      </div>

      {/* PDF Content Area */}
      <div
        className={cn(
          'flex-1 overflow-auto bg-slate-100',
          isFullscreen ? '' : 'rounded-b-lg'
        )}
      >
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Loading State */}
          {isLoading && !error && (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span>Loading PDF...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-red-50 p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Failed to Load PDF</h3>
                <p className="mt-1 text-sm text-red-600">{error}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleClose}>
                Close
              </Button>
            </div>
          )}

          {/* PDF Document */}
          {!error && (
            <Document
              file={file}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              className="flex justify-center"
            >
              <Page
                pageNumber={currentPage}
                scale={scale}
                rotate={rotation}
                className="shadow-xl"
                renderTextLayer={true}
                renderAnnotationLayer={true}
                loading={
                  <div className="flex h-[600px] w-[450px] items-center justify-center bg-white">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                  </div>
                }
              />
            </Document>
          )}
        </div>
      </div>

      {/* Keyboard Navigation Hint */}
      <div className="hidden md:flex items-center justify-center gap-4 bg-white/10 py-2 text-xs text-white/60">
        <span>Use arrow keys to navigate pages</span>
        <span>|</span>
        <span>Press Escape to close</span>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default PDFViewer;
