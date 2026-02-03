'use client';

import { useState, useMemo } from 'react';

import {
  LayoutGrid,
  List,
  ChevronRight,
  Home,
  Upload,
  Download,
  SortAsc,
  SortDesc,
  FolderOpen,
  Plus,
  MoreHorizontal,
  RefreshCw,
  Settings,
  HardDrive,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatFileSize } from '@/lib/utils';

import { AIAnalysisPanel } from './AIAnalysisPanel';
import { DocumentCard, type DocumentData } from './DocumentCard';
import { DocumentSearch } from './DocumentSearch';
import { DocumentViewer } from './DocumentViewer';
import { FolderTree, defaultFolders, type FolderItem } from './FolderTree';
import { UploadModal } from './UploadModal';

type SortField = 'name' | 'date' | 'type' | 'size';
type SortOrder = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

interface DocumentBrowserProps {
  className?: string;
}

// Mock SPAC Documents
const mockDocuments: DocumentData[] = [
  // Formation Documents
  {
    id: '1',
    name: 'Certificate of Incorporation',
    fileName: 'certificate_of_incorporation.pdf',
    fileType: 'application/pdf',
    fileSize: 524288,
    category: 'Formation Documents',
    subcategory: 'Charter',
    status: 'FINAL',
    version: 1,
    isConfidential: false,
    uploadedBy: 'John Doe',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    tags: ['Formation', 'Legal'],
    description: 'Original certificate of incorporation for SPAC entity',
  },
  {
    id: '2',
    name: 'Amended & Restated Bylaws',
    fileName: 'bylaws_amended_v2.pdf',
    fileType: 'application/pdf',
    fileSize: 892416,
    category: 'Formation Documents',
    subcategory: 'Bylaws',
    status: 'FINAL',
    version: 2,
    isConfidential: false,
    uploadedBy: 'Jane Smith',
    createdAt: new Date(Date.now() - 175 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    tags: ['Formation', 'Legal', 'Governance'],
  },
  {
    id: '3',
    name: 'Sponsor Agreement',
    fileName: 'sponsor_agreement_executed.pdf',
    fileType: 'application/pdf',
    fileSize: 1258291,
    category: 'Formation Documents',
    subcategory: 'Sponsor Agreements',
    status: 'FINAL',
    version: 1,
    isConfidential: true,
    uploadedBy: 'Mike Johnson',
    createdAt: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 170 * 24 * 60 * 60 * 1000),
    tags: ['Sponsor', 'Legal'],
  },
  // SEC Filings
  {
    id: '4',
    name: 'S-1 Registration Statement',
    fileName: 's1_registration_filed.pdf',
    fileType: 'application/pdf',
    fileSize: 15728640,
    category: 'SEC Filings',
    subcategory: 'S-1 Registration',
    status: 'FINAL',
    version: 3,
    isConfidential: false,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    tags: ['SEC', 'IPO', 'Registration'],
    description: 'Final S-1 registration statement as filed with the SEC',
  },
  {
    id: '5',
    name: 'Form 10-K Annual Report 2023',
    fileName: 'form_10k_2023.pdf',
    fileType: 'application/pdf',
    fileSize: 8388608,
    category: 'SEC Filings',
    subcategory: '10-K Annual Reports',
    status: 'FINAL',
    version: 1,
    isConfidential: false,
    uploadedBy: 'Finance Team',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    tags: ['SEC', 'Annual Report', '10-K'],
  },
  {
    id: '6',
    name: 'Form 8-K - Material Event',
    fileName: 'form_8k_announcement.pdf',
    fileType: 'application/pdf',
    fileSize: 1048576,
    category: 'SEC Filings',
    subcategory: '8-K Current Reports',
    status: 'FINAL',
    version: 1,
    isConfidential: false,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    tags: ['SEC', '8-K', 'Material Event'],
  },
  {
    id: '7',
    name: 'Proxy Statement - Shareholder Vote',
    fileName: 'proxy_statement_2024.pdf',
    fileType: 'application/pdf',
    fileSize: 5242880,
    category: 'SEC Filings',
    subcategory: 'Proxy Statements',
    status: 'UNDER_REVIEW',
    version: 2,
    isConfidential: false,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    tags: ['SEC', 'Proxy', 'Shareholder Vote'],
    description: 'Draft proxy statement for upcoming shareholder vote on business combination',
  },
  // Transaction Documents
  {
    id: '8',
    name: 'Letter of Intent - TechCorp',
    fileName: 'loi_techcorp_signed.pdf',
    fileType: 'application/pdf',
    fileSize: 786432,
    category: 'Transaction Documents',
    subcategory: 'Letters of Intent',
    status: 'FINAL',
    version: 1,
    isConfidential: true,
    uploadedBy: 'Deal Team',
    createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    tags: ['LOI', 'TechCorp', 'Transaction'],
  },
  {
    id: '9',
    name: 'Merger Agreement Draft',
    fileName: 'merger_agreement_v4.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 2097152,
    category: 'Transaction Documents',
    subcategory: 'Merger Agreements',
    status: 'UNDER_REVIEW',
    version: 4,
    isConfidential: true,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    tags: ['Merger', 'Agreement', 'Draft'],
    description: 'Fourth draft of merger agreement with TechCorp - pending legal review',
  },
  {
    id: '10',
    name: 'PIPE Subscription Agreement',
    fileName: 'pipe_subscription_template.pdf',
    fileType: 'application/pdf',
    fileSize: 1572864,
    category: 'Transaction Documents',
    subcategory: 'PIPE Documents',
    status: 'APPROVED',
    version: 2,
    isConfidential: true,
    uploadedBy: 'Finance Team',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    tags: ['PIPE', 'Subscription', 'Investor'],
  },
  // Due Diligence
  {
    id: '11',
    name: 'Due Diligence Report - TechCorp',
    fileName: 'dd_report_techcorp_v3.pdf',
    fileType: 'application/pdf',
    fileSize: 2458624,
    category: 'Due Diligence',
    subcategory: 'Financial',
    status: 'FINAL',
    version: 3,
    isConfidential: true,
    isFavorite: true,
    uploadedBy: 'John Doe',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    tags: ['Due Diligence', 'Financial', 'TechCorp'],
    description: 'Comprehensive financial due diligence report including Q4 analysis',
  },
  {
    id: '12',
    name: 'Financial Model - TechCorp',
    fileName: 'techcorp_model_v5.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 3145728,
    category: 'Due Diligence',
    subcategory: 'Financial',
    status: 'APPROVED',
    version: 5,
    isConfidential: true,
    uploadedBy: 'Sarah Wilson',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    tags: ['Financial Model', 'TechCorp', 'Valuation'],
  },
  {
    id: '13',
    name: 'Legal Due Diligence Memo',
    fileName: 'legal_dd_memo_techcorp.pdf',
    fileType: 'application/pdf',
    fileSize: 1835008,
    category: 'Due Diligence',
    subcategory: 'Legal',
    status: 'DRAFT',
    version: 1,
    isConfidential: true,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    tags: ['Legal', 'Due Diligence', 'Draft'],
  },
  {
    id: '14',
    name: 'NDA - TechCorp (Executed)',
    fileName: 'nda_techcorp_executed.pdf',
    fileType: 'application/pdf',
    fileSize: 524288,
    category: 'Transaction Documents',
    subcategory: 'Letters of Intent',
    status: 'FINAL',
    version: 1,
    isConfidential: true,
    uploadedBy: 'Mike Johnson',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    tags: ['NDA', 'TechCorp', 'Executed'],
  },
  // Governance
  {
    id: '15',
    name: 'Board Meeting Minutes - January 2024',
    fileName: 'board_minutes_jan2024.pdf',
    fileType: 'application/pdf',
    fileSize: 419430,
    category: 'Governance',
    subcategory: 'Board Minutes',
    status: 'APPROVED',
    version: 1,
    isConfidential: true,
    uploadedBy: 'Corporate Secretary',
    createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    tags: ['Board', 'Minutes', 'Governance'],
  },
  {
    id: '16',
    name: 'Audit Committee Charter',
    fileName: 'audit_committee_charter.pdf',
    fileType: 'application/pdf',
    fileSize: 314572,
    category: 'Governance',
    subcategory: 'Committee Charters',
    status: 'FINAL',
    version: 1,
    isConfidential: false,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
    tags: ['Governance', 'Charter', 'Audit'],
  },
  // Investor Relations
  {
    id: '17',
    name: 'Management Presentation Q4 2023',
    fileName: 'management_deck_q4.pptx',
    fileType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    fileSize: 5242880,
    category: 'Investor Relations',
    subcategory: 'Presentations',
    status: 'FINAL',
    version: 2,
    isConfidential: false,
    uploadedBy: 'Jane Smith',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    tags: ['Presentation', 'Investor', 'Q4'],
  },
  {
    id: '18',
    name: 'Press Release - Business Combination',
    fileName: 'press_release_bc_announcement.pdf',
    fileType: 'application/pdf',
    fileSize: 262144,
    category: 'Investor Relations',
    subcategory: 'Press Releases',
    status: 'DRAFT',
    version: 3,
    isConfidential: true,
    uploadedBy: 'IR Team',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    tags: ['Press Release', 'Draft', 'Announcement'],
    description: 'Draft press release for business combination announcement',
  },
  // Templates
  {
    id: '19',
    name: 'NDA Template - Standard',
    fileName: 'nda_template_standard.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 157286,
    category: 'Templates',
    subcategory: 'NDA Templates',
    status: 'FINAL',
    version: 3,
    isConfidential: false,
    uploadedBy: 'Legal Team',
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    tags: ['Template', 'NDA', 'Legal'],
  },
  {
    id: '20',
    name: 'Due Diligence Checklist',
    fileName: 'dd_checklist_master.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 524288,
    category: 'Templates',
    subcategory: 'Checklists',
    status: 'FINAL',
    version: 2,
    isConfidential: false,
    uploadedBy: 'Deal Team',
    createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    tags: ['Template', 'Checklist', 'Due Diligence'],
  },
];

export function DocumentBrowser({ className }: DocumentBrowserProps) {
  // State
  const [selectedFolder, setSelectedFolder] = useState<FolderItem | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [viewingDocument, setViewingDocument] = useState<DocumentData | null>(null);
  const [analyzingDocument, setAnalyzingDocument] = useState<DocumentData | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Build breadcrumb path
  const breadcrumbPath = useMemo(() => {
    if (!selectedFolder) {return [{ id: 'all', name: 'All Documents' }];}

    const path: { id: string; name: string }[] = [{ id: 'all', name: 'All Documents' }];

    const findPath = (folders: FolderItem[], targetId: string, currentPath: { id: string; name: string }[]): { id: string; name: string }[] | null => {
      for (const folder of folders) {
        if (folder.id === targetId) {
          return [...currentPath, { id: folder.id, name: folder.name }];
        }
        if (folder.children) {
          const result = findPath(folder.children, targetId, [...currentPath, { id: folder.id, name: folder.name }]);
          if (result) {return result;}
        }
      }
      return null;
    };

    const foundPath = findPath(defaultFolders, selectedFolder.id, []);
    return foundPath || path;
  }, [selectedFolder]);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    let docs = [...mockDocuments];

    // Filter by folder
    if (selectedFolder && selectedFolder.id !== 'all') {
      docs = docs.filter((doc) => {
        const folderName = selectedFolder.name.toLowerCase();
        return (
          doc.category.toLowerCase().includes(folderName) ||
          doc.subcategory?.toLowerCase().includes(folderName) ||
          selectedFolder.id.includes(doc.category.toLowerCase().replace(/\s+/g, '-'))
        );
      });
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.fileName.toLowerCase().includes(query) ||
          doc.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    docs.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime();
          break;
        case 'type':
          comparison = a.fileType.localeCompare(b.fileType);
          break;
        case 'size':
          comparison = a.fileSize - b.fileSize;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return docs;
  }, [selectedFolder, sortField, sortOrder, searchQuery]);

  // Handlers
  const handleSelectFolder = (folder: FolderItem) => {
    setSelectedFolder(folder.id === 'all' ? null : folder);
    setSelectedDocuments(new Set());
  };

  const handleSelectDocument = (doc: DocumentData) => {
    setSelectedDocuments((prev) => {
      const next = new Set(prev);
      if (next.has(doc.id)) {
        next.delete(doc.id);
      } else {
        next.add(doc.id);
      }
      return next;
    });
  };

  const handleViewDocument = (doc: DocumentData) => {
    setViewingDocument(doc);
  };

  const handleDownloadDocument = (doc: DocumentData) => {
    // TODO: Implement download functionality
  };

  const handleShareDocument = (doc: DocumentData) => {
    // TODO: Implement share functionality
  };

  const handleDeleteDocument = (doc: DocumentData) => {
    // TODO: Implement delete functionality
  };

  const handleToggleFavorite = (doc: DocumentData) => {
    // TODO: Implement favorite toggle functionality
  };

  const handleShowAIAnalysis = (doc: DocumentData) => {
    setAnalyzingDocument(doc);
  };

  const handleUpload = async (files: File[], metadata: any) => {
    // TODO: Implement file upload functionality
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Calculate storage stats
  const totalSize = mockDocuments.reduce((acc, doc) => acc + doc.fileSize, 0);
  const usedStorage = formatFileSize(totalSize);

  return (
    <div className={cn('flex h-full gap-6', className)}>
      {/* Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-300',
          sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-64'
        )}
      >
        <Card className="h-full">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900">Folders</h3>
            <Tooltip content="Collapse Sidebar">
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="rounded p-1 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </Tooltip>
          </div>
          <div className="h-[calc(100%-140px)] overflow-y-auto p-2">
            <FolderTree
              selectedFolderId={selectedFolder?.id || 'all'}
              onSelectFolder={handleSelectFolder}
            />
          </div>
          {/* Storage Stats */}
          <div className="border-t border-slate-200 p-4">
            <div className="flex items-center gap-2 text-sm">
              <HardDrive className="h-4 w-4 text-slate-400" />
              <span className="text-slate-600">Storage</span>
            </div>
            <div className="mt-2 space-y-2">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full w-1/4 rounded-full bg-primary-500" />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>{usedStorage} used</span>
                <span>10 GB total</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <Card className="h-full flex flex-col">
          {/* Toolbar */}
          <div className="border-b border-slate-200 p-4">
            {/* Top Row - Search & Actions */}
            <div className="flex items-center gap-4">
              {sidebarCollapsed && (
                <Tooltip content="Show Sidebar">
                  <button
                    onClick={() => setSidebarCollapsed(false)}
                    className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
                  >
                    <FolderOpen className="h-5 w-5 text-slate-600" />
                  </button>
                </Tooltip>
              )}
              <div className="flex-1">
                <DocumentSearch
                  documents={mockDocuments}
                  onSearch={(query, filters) => setSearchQuery(query)}
                  onSelectDocument={handleViewDocument}
                />
              </div>
              <Button variant="primary" onClick={() => setIsUploadModalOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
            </div>

            {/* Bottom Row - Breadcrumb, View Toggle, Sort */}
            <div className="mt-4 flex items-center justify-between">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-1 text-sm">
                {breadcrumbPath.map((crumb, idx) => (
                  <div key={crumb.id} className="flex items-center gap-1">
                    {idx > 0 && <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <button
                      onClick={() => {
                        if (crumb.id === 'all') {
                          setSelectedFolder(null);
                        }
                      }}
                      className={cn(
                        'rounded px-2 py-1 hover:bg-slate-100',
                        idx === breadcrumbPath.length - 1
                          ? 'font-medium text-slate-900'
                          : 'text-slate-500'
                      )}
                    >
                      {idx === 0 && <Home className="mr-1 inline-block h-4 w-4" />}
                      {crumb.name}
                    </button>
                  </div>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                {/* Document Count */}
                <span className="text-sm text-slate-500">
                  {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
                </span>

                {/* Sort */}
                <div className="flex items-center gap-2 rounded-lg border border-slate-200 p-1">
                  {[
                    { field: 'name' as const, label: 'Name' },
                    { field: 'date' as const, label: 'Date' },
                    { field: 'type' as const, label: 'Type' },
                    { field: 'size' as const, label: 'Size' },
                  ].map((sort) => (
                    <button
                      key={sort.field}
                      onClick={() => toggleSort(sort.field)}
                      className={cn(
                        'flex items-center gap-1 rounded px-2 py-1 text-sm',
                        sortField === sort.field
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {sort.label}
                      {sortField === sort.field && (
                        sortOrder === 'asc' ? (
                          <SortAsc className="h-3 w-3" />
                        ) : (
                          <SortDesc className="h-3 w-3" />
                        )
                      )}
                    </button>
                  ))}
                </div>

                {/* View Toggle */}
                <div className="flex items-center rounded-lg border border-slate-200 p-1">
                  <Tooltip content="Grid View">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={cn(
                        'rounded p-1.5',
                        viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'
                      )}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </Tooltip>
                  <Tooltip content="List View">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        'rounded p-1.5',
                        viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-slate-400 hover:text-slate-600'
                      )}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          {/* Document Grid/List */}
          <CardContent className="flex-1 overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-16 w-16 text-slate-300" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">No documents found</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : 'Upload documents to get started'}
                </p>
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => setIsUploadModalOpen(true)}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Documents
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    viewMode="grid"
                    isSelected={selectedDocuments.has(doc.id)}
                    onSelect={handleSelectDocument}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onDelete={handleDeleteDocument}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    viewMode="list"
                    isSelected={selectedDocuments.has(doc.id)}
                    onSelect={handleSelectDocument}
                    onView={handleViewDocument}
                    onDownload={handleDownloadDocument}
                    onShare={handleShareDocument}
                    onDelete={handleDeleteDocument}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <DocumentViewer
          document={viewingDocument}
          isOpen={!!viewingDocument}
          onClose={() => setViewingDocument(null)}
          onDownload={handleDownloadDocument}
          onShare={handleShareDocument}
          onShowAIAnalysis={handleShowAIAnalysis}
        />
      )}

      {/* AI Analysis Panel */}
      {analyzingDocument && (
        <AIAnalysisPanel
          document={analyzingDocument}
          isOpen={!!analyzingDocument}
          onClose={() => setAnalyzingDocument(null)}
        />
      )}

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
