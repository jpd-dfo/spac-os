'use client';

import { useState, useMemo, useCallback } from 'react';

import dynamic from 'next/dynamic';
import {
  FileText,
  Upload,
  Search,
  Filter,
  LayoutGrid,
  List,
  ChevronDown,
  Loader2,
  AlertCircle,
  Eye,
  Download,
  Trash2,
  FolderOpen,
  Clock,
  X,
} from 'lucide-react';

import { DocumentCard, type DocumentData } from '@/components/documents/DocumentCard';
import { UploadModal } from '@/components/documents/UploadModal';

// Dynamic import of DocumentViewer to avoid SSR issues with react-pdf
const DocumentViewer = dynamic(
  () => import('@/components/documents/DocumentViewer').then(mod => mod.DocumentViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div> }
);
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/Dropdown';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
} from '@/components/ui/Modal';
import { useDebounce } from '@/hooks';
import { trpc } from '@/lib/trpc/client';
import { cn, formatFileSize, formatDate, formatRelativeTime } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = 'grid' | 'list';

interface FiltersState {
  search: string;
  category: string | null;
  status: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORIES = [
  { id: 'formation', name: 'Formation Documents' },
  { id: 'sec-filings', name: 'SEC Filings' },
  { id: 'transaction', name: 'Transaction Documents' },
  { id: 'due-diligence', name: 'Due Diligence' },
  { id: 'governance', name: 'Governance' },
  { id: 'investor-relations', name: 'Investor Relations' },
  { id: 'templates', name: 'Templates' },
];

const STATUSES = [
  { id: 'DRAFT', name: 'Draft' },
  { id: 'UNDER_REVIEW', name: 'Under Review' },
  { id: 'APPROVED', name: 'Approved' },
  { id: 'FINAL', name: 'Final' },
  { id: 'ARCHIVED', name: 'Archived' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// Transform database document to UI format
function transformDocumentToUI(dbDoc: {
  id: string;
  name: string;
  type: string;
  category: string | null;
  status: string;
  fileUrl: string | null;
  fileSize: number | null;
  mimeType: string | null;
  version?: number;
  isLatest?: boolean;
  createdAt: Date;
  updatedAt: Date;
  spac?: { id: string; name: string; ticker: string | null } | null;
  target?: { id: string; name: string } | null;
}): DocumentData {
  // Extract filename from fileUrl or use name
  const fileName = dbDoc.fileUrl
    ? dbDoc.fileUrl.split('/').pop() || dbDoc.name
    : dbDoc.name;

  // Extract file extension from fileName or mimeType
  const getFileType = () => {
    if (fileName.includes('.')) {
      return fileName.split('.').pop()?.toLowerCase() || 'file';
    }
    if (dbDoc.mimeType) {
      const mimeExt = dbDoc.mimeType.split('/').pop();
      return mimeExt || 'file';
    }
    return 'file';
  };

  return {
    id: dbDoc.id,
    name: dbDoc.name,
    fileName: fileName,
    fileType: getFileType(),
    fileSize: dbDoc.fileSize || 0,
    category: dbDoc.category || 'Other',
    subcategory: undefined,
    status: dbDoc.status as DocumentData['status'],
    version: dbDoc.version || 1,
    isConfidential: false, // TODO: Add confidentiality field
    isFavorite: false, // TODO: Add favorites functionality
    uploadedBy: 'System', // TODO: Track uploaded by user
    uploadedByAvatar: undefined,
    createdAt: new Date(dbDoc.createdAt),
    updatedAt: new Date(dbDoc.updatedAt),
    tags: [], // TODO: Add tags support
    description: undefined,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DocumentsPage() {
  // ============================================================================
  // UI STATE
  // ============================================================================

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [filters, setFilters] = useState<FiltersState>({
    search: '',
    category: null,
    status: null,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentData | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<DocumentData | null>(null);
  const [versionHistoryDocId, setVersionHistoryDocId] = useState<string | null>(null);

  // Debounce search query (300ms)
  const debouncedSearch = useDebounce(filters.search, 300);

  // ============================================================================
  // tRPC QUERIES & MUTATIONS
  // ============================================================================

  const utils = trpc.useUtils();

  const {
    data: documentListData,
    isLoading,
    error,
  } = trpc.document.list.useQuery({
    page: 1,
    pageSize: 100,
    search: debouncedSearch || undefined,
  });

  // Version history query
  const {
    data: versionHistory,
    isLoading: isLoadingVersionHistory,
  } = trpc.document.getVersionHistory.useQuery(
    { id: versionHistoryDocId! },
    { enabled: !!versionHistoryDocId }
  );

  const deleteDocumentMutation = trpc.document.delete.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate();
    },
  });

  // Transform database documents to UI format
  const documents: DocumentData[] = useMemo(() => {
    if (!documentListData?.items) {
      return [];
    }
    return documentListData.items.map(transformDocumentToUI);
  }, [documentListData]);

  // ============================================================================
  // FILTERED DOCUMENTS
  // ============================================================================

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          doc.name.toLowerCase().includes(searchLower) ||
          doc.fileName.toLowerCase().includes(searchLower) ||
          doc.category.toLowerCase().includes(searchLower);
        if (!matchesSearch) {
          return false;
        }
      }

      // Category filter
      if (filters.category && doc.category !== filters.category) {
        return false;
      }

      // Status filter
      if (filters.status && doc.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [documents, filters]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.search) {
      count++;
    }
    if (filters.category) {
      count++;
    }
    if (filters.status) {
      count++;
    }
    return count;
  }, [filters]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleView = useCallback((doc: DocumentData) => {
    setSelectedDocument(doc);
    setIsViewerOpen(true);
  }, []);

  const handleDownload = useCallback(async (doc: DocumentData) => {
    // In production, this would fetch a signed URL from the API
    // For now, we'll attempt to download from the file URL
    try {
      const response = await fetch(`/api/documents/${doc.id}`);
      const data = await response.json();

      if (data.document?.downloadUrl) {
        // Create a temporary anchor to trigger download
        const link = document.createElement('a');
        link.href = data.document.downloadUrl;
        link.download = doc.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (data.document?.fileUrl) {
        // Fallback to direct URL
        window.open(data.document.fileUrl, '_blank');
      } else {
        console.error('No download URL available');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  }, []);

  const handleDeleteClick = useCallback((doc: DocumentData) => {
    setDocumentToDelete(doc);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(
        { id: documentToDelete.id },
        {
          onSuccess: () => {
            setIsDeleteModalOpen(false);
            setDocumentToDelete(null);
          },
        }
      );
    }
  }, [documentToDelete, deleteDocumentMutation]);

  const handleUpload = useCallback(async (files: File[], metadata: {
    category: string;
    subcategory?: string;
    tags: string[];
    description?: string;
    isConfidential: boolean;
  }) => {
    // TODO: Implement actual file upload to storage
    // This would:
    // 1. Upload files to Supabase Storage
    // 2. Create document records via tRPC
    console.log('Upload:', { files, metadata });

    // Refresh the document list after upload
    utils.document.list.invalidate();
  }, [utils.document.list]);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: null,
      status: null,
    });
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <p className="page-description">
          Securely manage, organize, and analyze your SPAC deal documents
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={filters.search}
            onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <List className="h-4 w-4" />
              List
            </button>
          </div>

          {/* Filter Toggle */}
          <Button
            variant={showFilters ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="primary" size="sm" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>

          {/* Upload Button */}
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsUploadModalOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category Filter */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-slate-500">
                  Category
                </span>
                <Dropdown
                  trigger={
                    <Button variant="secondary" size="sm">
                      {filters.category
                        ? CATEGORIES.find((c) => c.id === filters.category)?.name
                        : 'All Categories'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  }
                  align="left"
                >
                  <DropdownItem onClick={() => setFilters((prev) => ({ ...prev, category: null }))}>
                    All Categories
                  </DropdownItem>
                  {CATEGORIES.map((category) => (
                    <DropdownItem
                      key={category.id}
                      onClick={() => setFilters((prev) => ({ ...prev, category: category.id }))}
                    >
                      {category.name}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              {/* Status Filter */}
              <div>
                <span className="mb-1.5 block text-xs font-medium text-slate-500">
                  Status
                </span>
                <Dropdown
                  trigger={
                    <Button variant="secondary" size="sm">
                      {filters.status
                        ? STATUSES.find((s) => s.id === filters.status)?.name
                        : 'All Statuses'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  }
                  align="left"
                >
                  <DropdownItem onClick={() => setFilters((prev) => ({ ...prev, status: null }))}>
                    All Statuses
                  </DropdownItem>
                  {STATUSES.map((status) => (
                    <DropdownItem
                      key={status.id}
                      onClick={() => setFilters((prev) => ({ ...prev, status: status.id }))}
                    >
                      {status.name}
                    </DropdownItem>
                  ))}
                </Dropdown>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <div className="ml-auto">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading documents...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex h-64 items-center justify-center rounded-lg border border-red-200 bg-red-50">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <span>Failed to load documents: {error.message}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredDocuments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 rounded-full bg-primary-50 p-6">
              <FileText className="h-12 w-12 text-primary-500" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900">
              {documents.length === 0 ? 'No Documents Yet' : 'No Documents Found'}
            </h2>
            <p className="mt-3 max-w-md text-slate-500">
              {documents.length === 0
                ? 'Upload your first document to get started with document management.'
                : 'Try adjusting your search or filters to find what you\'re looking for.'}
            </p>
            <div className="mt-8">
              {documents.length === 0 ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Documents
                </Button>
              ) : (
                <Button variant="secondary" size="lg" onClick={clearFilters}>
                  <X className="mr-2 h-5 w-5" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents Grid/List */}
      {!isLoading && !error && filteredDocuments.length > 0 && (
        <div>
          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {filteredDocuments.length} of {documents.length} documents
            </p>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode="grid"
                  onView={handleView}
                  onDownload={handleDownload}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* List Header */}
              <div className="hidden items-center gap-4 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 md:flex">
                <div className="w-10" /> {/* Icon */}
                <div className="min-w-[200px] flex-1">Name</div>
                <div className="hidden w-24 md:block">Status</div>
                <div className="hidden w-20 text-right sm:block">Size</div>
                <div className="hidden w-32 lg:block">Updated</div>
                <div className="hidden w-32 xl:block">Owner</div>
                <div className="w-24">Actions</div>
              </div>

              {/* List Items */}
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  viewMode="list"
                  onView={handleView}
                  onDownload={handleDownload}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />

      {/* Document Viewer */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          isOpen={isViewerOpen}
          onClose={() => {
            setIsViewerOpen(false);
            setSelectedDocument(null);
          }}
          onDownload={handleDownload}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDocumentToDelete(null);
        }}
        size="sm"
      >
        <ModalHeader>
          <ModalTitle>Delete Document</ModalTitle>
          <ModalDescription>
            Are you sure you want to delete this document? This action cannot be undone.
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          {documentToDelete && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <FileText className="h-8 w-8 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">{documentToDelete.name}</p>
                <p className="text-sm text-slate-500">
                  {formatFileSize(documentToDelete.fileSize)} | {documentToDelete.category}
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDocumentToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            isLoading={deleteDocumentMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </ModalFooter>
      </Modal>

      {/* Version History Modal */}
      <Modal
        isOpen={!!versionHistoryDocId}
        onClose={() => setVersionHistoryDocId(null)}
        size="lg"
      >
        <ModalHeader>
          <ModalTitle>Version History</ModalTitle>
          <ModalDescription>
            View and manage previous versions of this document
          </ModalDescription>
        </ModalHeader>
        <ModalBody>
          {isLoadingVersionHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
          ) : versionHistory && versionHistory.length > 0 ? (
            <div className="space-y-3">
              {versionHistory.map((version, index) => (
                <div
                  key={version.id}
                  className={cn(
                    'rounded-lg border p-4',
                    index === 0 ? 'border-primary-200 bg-primary-50' : 'border-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={index === 0 ? 'primary' : 'secondary'}>
                        v{version.version}
                      </Badge>
                      {index === 0 && (
                        <span className="text-xs font-medium text-primary-600">Current</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatRelativeTime(version.createdAt)}
                    </span>
                    {version.fileSize && (
                      <span>{formatFileSize(version.fileSize)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <FolderOpen className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2">No version history available</p>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setVersionHistoryDocId(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
