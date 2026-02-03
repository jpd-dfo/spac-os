'use client';

import { useState, useCallback } from 'react';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

import {
  X,
  Download,
  Share2,
  Printer,
  ZoomIn,
  ZoomOut,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  User,
  MessageSquare,
  History,
  ExternalLink,
  Copy,
  MoreVertical,
  Edit2,
  Lock,
  Info,
  Sparkles,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatFileSize, formatDate, formatRelativeTime } from '@/lib/utils';

import type { DocumentData } from './DocumentCard';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// ============================================================================
// TYPES
// ============================================================================

interface VersionHistory {
  version: number;
  uploadedBy: string;
  uploadedAt: Date;
  changes: string;
  fileSize: number;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  createdAt: Date;
  page?: number;
}

interface DocumentViewerProps {
  document: DocumentData;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: (doc: DocumentData) => void;
  onShare?: (doc: DocumentData) => void;
  onShowAIAnalysis?: (doc: DocumentData) => void;
  /** Optional URL to the actual PDF file for rendering */
  pdfUrl?: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================

// Mock version history
const mockVersionHistory: VersionHistory[] = [
  {
    version: 3,
    uploadedBy: 'John Doe',
    uploadedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    changes: 'Updated financial projections based on Q4 results',
    fileSize: 2458624,
  },
  {
    version: 2,
    uploadedBy: 'Sarah Wilson',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    changes: 'Added risk assessment section',
    fileSize: 2234567,
  },
  {
    version: 1,
    uploadedBy: 'Mike Johnson',
    uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    changes: 'Initial draft',
    fileSize: 1945632,
  },
];

// Mock comments
const mockComments: Comment[] = [
  {
    id: '1',
    author: 'Jane Smith',
    content: 'Please review the revenue projections on page 12. The growth rate seems aggressive.',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    page: 12,
  },
  {
    id: '2',
    author: 'Mike Johnson',
    content: 'Legal has approved the terms on page 5.',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    page: 5,
  },
  {
    id: '3',
    author: 'Sarah Wilson',
    content: 'Updated the EBITDA calculations as discussed.',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentViewer({
  document,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onShowAIAnalysis,
  pdfUrl,
}: DocumentViewerProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [activeTab, setActiveTab] = useState<'details' | 'versions' | 'comments'>('details');
  const [scale, setScale] = useState(1.0);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [rotation, setRotation] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Check if document is a PDF
  const isPdf = document.fileType?.toLowerCase() === 'pdf' ||
    document.fileName?.toLowerCase().endsWith('.pdf');

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setCurrentPage(1);
    setPdfLoading(false);
    setPdfError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    setPdfError(err.message || 'Failed to load PDF');
    setPdfLoading(false);
  }, []);

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, numPages || 1));

  if (!isOpen) {
    return null;
  }

  const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'primary' }> = {
    DRAFT: { label: 'Draft', variant: 'secondary' },
    UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
    APPROVED: { label: 'Approved', variant: 'success' },
    FINAL: { label: 'Final', variant: 'primary' },
    ARCHIVED: { label: 'Archived', variant: 'secondary' },
  };

  const status = statusConfig[document.status] ?? { label: 'Draft', variant: 'secondary' as const };

  // Display pages - use numPages from PDF or default to 1
  const displayTotalPages = numPages || 1;

  return (
    <div className="fixed inset-0 z-50 flex bg-black/50">
      {/* Main Viewer */}
      <div className={cn('flex flex-1 flex-col bg-slate-100', showSidebar ? 'mr-[400px]' : '')}>
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900">{document.name}</h2>
                {document.isConfidential && (
                  <Tooltip content="Confidential">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </Tooltip>
                )}
              </div>
              <p className="text-sm text-slate-500">
                {document.fileName} | v{document.version}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <Tooltip content="Zoom Out">
                <button
                  onClick={handleZoomOut}
                  disabled={scale <= 0.5}
                  className="rounded p-1.5 hover:bg-white disabled:opacity-50"
                >
                  <ZoomOut className="h-4 w-4 text-slate-600" />
                </button>
              </Tooltip>
              <span className="min-w-[50px] text-center text-sm text-slate-600">
                {Math.round(scale * 100)}%
              </span>
              <Tooltip content="Zoom In">
                <button
                  onClick={handleZoomIn}
                  disabled={scale >= 3.0}
                  className="rounded p-1.5 hover:bg-white disabled:opacity-50"
                >
                  <ZoomIn className="h-4 w-4 text-slate-600" />
                </button>
              </Tooltip>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
              <Tooltip content="Previous Page">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1}
                  className="rounded p-1.5 hover:bg-white disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
              </Tooltip>
              <span className="min-w-[80px] text-center text-sm text-slate-600">
                {currentPage} / {displayTotalPages}
              </span>
              <Tooltip content="Next Page">
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= displayTotalPages}
                  className="rounded p-1.5 hover:bg-white disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </Tooltip>
            </div>

            {/* Rotate */}
            <Tooltip content="Rotate">
              <button
                onClick={handleRotate}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </Tooltip>

            <div className="h-6 w-px bg-slate-200" />

            {/* Actions */}
            <Tooltip content="AI Analysis">
              <button
                onClick={() => onShowAIAnalysis?.(document)}
                className="rounded-lg p-2 text-primary-600 hover:bg-primary-50"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip content="Print">
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <Printer className="h-5 w-5" />
              </button>
            </Tooltip>
            <Tooltip content="Open in New Tab">
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <ExternalLink className="h-5 w-5" />
              </button>
            </Tooltip>

            <div className="h-6 w-px bg-slate-200" />

            <Button variant="secondary" size="sm" onClick={() => onShare?.(document)}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="primary" size="sm" onClick={() => onDownload?.(document)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>

            <Tooltip content="Toggle Sidebar">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={cn(
                  'rounded-lg p-2',
                  showSidebar
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                )}
              >
                <Info className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </div>

        {/* Document Preview Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="flex min-h-full items-center justify-center">
            {/* PDF Rendering */}
            {isPdf && pdfUrl ? (
              <>
                {/* Loading State */}
                {pdfLoading && !pdfError && (
                  <div className="flex flex-col items-center gap-3 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span>Loading PDF...</span>
                  </div>
                )}

                {/* Error State */}
                {pdfError && (
                  <div className="flex flex-col items-center gap-3 rounded-lg bg-red-50 p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-red-800">Failed to Load PDF</h3>
                      <p className="mt-1 text-sm text-red-600">{pdfError}</p>
                    </div>
                  </div>
                )}

                {/* PDF Document */}
                <Document
                  file={pdfUrl}
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
                      <div className="flex h-[800px] w-[600px] items-center justify-center bg-white shadow-xl">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                      </div>
                    }
                  />
                </Document>
              </>
            ) : (
              /* Placeholder Preview for non-PDF or when URL not available */
              <div
                className="bg-white shadow-lg"
                style={{
                  width: `${(8.5 * 96 * scale)}px`,
                  minHeight: `${(11 * 96 * scale)}px`,
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                <div className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <FileText className="h-24 w-24 text-slate-300" />
                  <h3 className="mt-4 text-lg font-medium text-slate-600">{document.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">
                    {isPdf ? 'PDF preview not available' : `${document.fileType?.toUpperCase() || 'File'} document`}
                  </p>
                  <p className="mt-4 max-w-md text-sm text-slate-500">
                    {isPdf
                      ? 'The PDF file URL is not available. Click Download to view the document.'
                      : 'Preview is only available for PDF documents. Click Download to view this file.'}
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-4"
                    onClick={() => onDownload?.(document)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download to View
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {showSidebar && (
        <div className="fixed right-0 top-0 h-full w-[400px] border-l border-slate-200 bg-white">
          {/* Sidebar Header */}
          <div className="border-b border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'details'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'versions'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <History className="h-4 w-4" />
                  Versions
                </span>
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                  activeTab === 'comments'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Comments
                  <span className="ml-1 rounded-full bg-primary-100 px-1.5 text-xs text-primary-700">
                    {mockComments.length}
                  </span>
                </span>
              </button>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="h-[calc(100%-73px)] overflow-y-auto">
            {activeTab === 'details' && (
              <div className="p-4 space-y-6">
                {/* Status & Actions */}
                <div className="flex items-center justify-between">
                  <Badge variant={status.variant} size="lg">
                    {status.label}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Tooltip content="Edit">
                      <button className="rounded p-1.5 hover:bg-slate-100">
                        <Edit2 className="h-4 w-4 text-slate-400" />
                      </button>
                    </Tooltip>
                    <Tooltip content="Copy Link">
                      <button className="rounded p-1.5 hover:bg-slate-100">
                        <Copy className="h-4 w-4 text-slate-400" />
                      </button>
                    </Tooltip>
                    <Tooltip content="More">
                      <button className="rounded p-1.5 hover:bg-slate-100">
                        <MoreVertical className="h-4 w-4 text-slate-400" />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* File Info */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    File Information
                  </h4>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">File Name</span>
                      <span className="text-sm font-medium text-slate-900">{document.fileName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Size</span>
                      <span className="text-sm font-medium text-slate-900">
                        {formatFileSize(document.fileSize)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Version</span>
                      <span className="text-sm font-medium text-slate-900">v{document.version}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Category</span>
                      <span className="text-sm font-medium text-slate-900">{document.category}</span>
                    </div>
                    {numPages > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Pages</span>
                        <span className="text-sm font-medium text-slate-900">{numPages}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Activity
                  </h4>
                  <div className="mt-3 space-y-3">
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Last Modified</p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(document.updatedAt)} ({formatRelativeTime(document.updatedAt)})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-500">Created</p>
                        <p className="text-sm font-medium text-slate-900">
                          {formatDate(document.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Owner */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Uploaded By
                  </h4>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                      {document.uploadedBy.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{document.uploadedBy}</p>
                      <p className="text-sm text-slate-500">Document Owner</p>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                {document.tags && document.tags.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tags
                    </h4>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {document.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                {document.description && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Description
                    </h4>
                    <p className="mt-2 text-sm text-slate-600">{document.description}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'versions' && (
              <div className="p-4">
                <div className="space-y-4">
                  {mockVersionHistory.map((version, idx) => (
                    <div
                      key={version.version}
                      className={cn(
                        'rounded-lg border p-3',
                        idx === 0 ? 'border-primary-200 bg-primary-50' : 'border-slate-200'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={idx === 0 ? 'primary' : 'secondary'} size="sm">
                            v{version.version}
                          </Badge>
                          {idx === 0 && (
                            <span className="text-xs text-primary-600">Current</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tooltip content="Download this version">
                            <button className="rounded p-1 hover:bg-white">
                              <Download className="h-4 w-4 text-slate-400" />
                            </button>
                          </Tooltip>
                          {idx !== 0 && (
                            <Tooltip content="Restore this version">
                              <button className="rounded p-1 hover:bg-white">
                                <RotateCw className="h-4 w-4 text-slate-400" />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{version.changes}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {version.uploadedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(version.uploadedAt)}
                        </span>
                        <span>{formatFileSize(version.fileSize)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'comments' && (
              <div className="flex h-full flex-col">
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {mockComments.map((comment) => (
                      <div key={comment.id} className="group">
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
                            {comment.author.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{comment.author}</span>
                              <span className="text-xs text-slate-400">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-600">{comment.content}</p>
                            {comment.page && (
                              <button
                                className="mt-1 text-xs text-primary-600 hover:underline"
                                onClick={() => setCurrentPage(comment.page!)}
                              >
                                Go to page {comment.page}
                              </button>
                            )}
                          </div>
                          <button className="rounded p-1 opacity-0 group-hover:opacity-100 hover:bg-slate-100">
                            <MoreVertical className="h-4 w-4 text-slate-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment Input */}
                <div className="border-t border-slate-200 p-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full rounded-lg border border-slate-200 p-3 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button variant="primary" size="sm" disabled={!newComment.trim()}>
                      Add Comment
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
