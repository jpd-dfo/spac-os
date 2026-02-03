'use client';

import { useState } from 'react';

import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FileText,
  Scale,
  Building2,
  Users,
  Shield,
  FileCheck,
  BookTemplate,
  Search,
  Briefcase,
  FileSignature,
  Gavel,
  Receipt,
  ScrollText,
  ClipboardList,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export interface FolderItem {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: FolderItem[];
  count?: number;
  isExpanded?: boolean;
}

interface FolderTreeProps {
  selectedFolderId: string | null;
  onSelectFolder: (folder: FolderItem) => void;
  searchQuery?: string;
}

// SPAC-specific folder structure
const defaultFolders: FolderItem[] = [
  {
    id: 'all',
    name: 'All Documents',
    icon: Folder,
    count: 156,
  },
  {
    id: 'formation',
    name: 'Formation Documents',
    icon: Building2,
    count: 12,
    children: [
      { id: 'formation-charter', name: 'Charter', count: 2 },
      { id: 'formation-bylaws', name: 'Bylaws', count: 1 },
      { id: 'formation-subscription', name: 'Subscription Agreements', count: 3 },
      { id: 'formation-sponsor', name: 'Sponsor Agreements', count: 4 },
      { id: 'formation-warrants', name: 'Warrant Agreements', count: 2 },
    ],
  },
  {
    id: 'sec-filings',
    name: 'SEC Filings',
    icon: FileCheck,
    count: 28,
    children: [
      { id: 'sec-s1', name: 'S-1 Registration', icon: FileText, count: 3 },
      { id: 'sec-s4', name: 'S-4 Registration', icon: FileText, count: 2 },
      { id: 'sec-10k', name: '10-K Annual Reports', icon: Receipt, count: 4 },
      { id: 'sec-10q', name: '10-Q Quarterly Reports', icon: Receipt, count: 8 },
      { id: 'sec-8k', name: '8-K Current Reports', icon: FileText, count: 6 },
      { id: 'sec-proxy', name: 'Proxy Statements', icon: ScrollText, count: 3 },
      { id: 'sec-13d', name: 'Schedule 13D/G', icon: FileText, count: 2 },
    ],
  },
  {
    id: 'transaction',
    name: 'Transaction Documents',
    icon: Briefcase,
    count: 35,
    children: [
      { id: 'transaction-loi', name: 'Letters of Intent', icon: FileSignature, count: 8 },
      { id: 'transaction-merger', name: 'Merger Agreements', icon: Gavel, count: 4 },
      { id: 'transaction-pipe', name: 'PIPE Documents', icon: Receipt, count: 6 },
      { id: 'transaction-fp', name: 'Forward Purchase', icon: FileText, count: 3 },
      { id: 'transaction-backstop', name: 'Backstop Agreements', icon: Shield, count: 2 },
      { id: 'transaction-earnout', name: 'Earnout Agreements', icon: FileText, count: 4 },
      { id: 'transaction-employment', name: 'Employment Agreements', icon: Users, count: 8 },
    ],
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence',
    icon: Search,
    count: 45,
    children: [
      {
        id: 'dd-techcorp',
        name: 'TechCorp Inc.',
        count: 18,
        children: [
          { id: 'dd-techcorp-financial', name: 'Financial', count: 6 },
          { id: 'dd-techcorp-legal', name: 'Legal', count: 4 },
          { id: 'dd-techcorp-tax', name: 'Tax', count: 3 },
          { id: 'dd-techcorp-operational', name: 'Operational', count: 5 },
        ],
      },
      {
        id: 'dd-cloudscale',
        name: 'CloudScale Systems',
        count: 15,
        children: [
          { id: 'dd-cloudscale-financial', name: 'Financial', count: 5 },
          { id: 'dd-cloudscale-legal', name: 'Legal', count: 3 },
          { id: 'dd-cloudscale-ip', name: 'IP & Technology', count: 4 },
          { id: 'dd-cloudscale-hr', name: 'HR', count: 3 },
        ],
      },
      {
        id: 'dd-biomed',
        name: 'BioMed Solutions',
        count: 12,
        children: [
          { id: 'dd-biomed-regulatory', name: 'Regulatory', count: 4 },
          { id: 'dd-biomed-clinical', name: 'Clinical', count: 5 },
          { id: 'dd-biomed-ip', name: 'Patents & IP', count: 3 },
        ],
      },
    ],
  },
  {
    id: 'governance',
    name: 'Governance',
    icon: Scale,
    count: 24,
    children: [
      { id: 'governance-board', name: 'Board Minutes', icon: ClipboardList, count: 12 },
      { id: 'governance-committee', name: 'Committee Charters', count: 4 },
      { id: 'governance-policies', name: 'Policies', count: 5 },
      { id: 'governance-resolutions', name: 'Resolutions', count: 3 },
    ],
  },
  {
    id: 'investor-relations',
    name: 'Investor Relations',
    icon: Users,
    count: 18,
    children: [
      { id: 'ir-presentations', name: 'Presentations', count: 8 },
      { id: 'ir-press', name: 'Press Releases', count: 6 },
      { id: 'ir-transcripts', name: 'Call Transcripts', count: 4 },
    ],
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: BookTemplate,
    count: 12,
    children: [
      { id: 'templates-nda', name: 'NDA Templates', count: 3 },
      { id: 'templates-loi', name: 'LOI Templates', count: 2 },
      { id: 'templates-memo', name: 'Memo Templates', count: 4 },
      { id: 'templates-checklist', name: 'Checklists', count: 3 },
    ],
  },
];

interface FolderNodeProps {
  folder: FolderItem;
  level: number;
  selectedFolderId: string | null;
  expandedFolders: Set<string>;
  onToggleExpand: (folderId: string) => void;
  onSelectFolder: (folder: FolderItem) => void;
}

function FolderNode({
  folder,
  level,
  selectedFolderId,
  expandedFolders,
  onToggleExpand,
  onSelectFolder,
}: FolderNodeProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const hasChildren = folder.children && folder.children.length > 0;
  const Icon = folder.icon || (hasChildren ? (isExpanded ? FolderOpen : Folder) : FileText);

  return (
    <div>
      <button
        onClick={() => {
          onSelectFolder(folder);
          if (hasChildren) {
            onToggleExpand(folder.id);
          }
        }}
        className={cn(
          'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
          isSelected
            ? 'bg-primary-50 text-primary-700 font-medium'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <span className="flex-shrink-0 text-slate-400">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        ) : (
          <span className="w-4" />
        )}
        <Icon
          className={cn(
            'h-4 w-4 flex-shrink-0',
            isSelected ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
          )}
        />
        <span className="flex-1 truncate text-left">{folder.name}</span>
        {folder.count !== undefined && (
          <span
            className={cn(
              'rounded-full px-1.5 py-0.5 text-xs',
              isSelected
                ? 'bg-primary-100 text-primary-700'
                : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
            )}
          >
            {folder.count}
          </span>
        )}
      </button>
      {hasChildren && isExpanded && (
        <div className="mt-0.5">
          {folder.children!.map((child) => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              expandedFolders={expandedFolders}
              onToggleExpand={onToggleExpand}
              onSelectFolder={onSelectFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree({
  selectedFolderId,
  onSelectFolder,
  searchQuery = '',
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(['formation', 'sec-filings', 'transaction', 'due-diligence'])
  );

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Filter folders based on search query
  const filterFolders = (folders: FolderItem[], query: string): FolderItem[] => {
    if (!query) {return folders;}

    return folders.reduce<FolderItem[]>((acc, folder) => {
      const matchesQuery = folder.name.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = folder.children ? filterFolders(folder.children, query) : [];

      if (matchesQuery || filteredChildren.length > 0) {
        acc.push({
          ...folder,
          children: filteredChildren.length > 0 ? filteredChildren : folder.children,
        });
      }

      return acc;
    }, []);
  };

  const filteredFolders = filterFolders(defaultFolders, searchQuery);

  return (
    <div className="space-y-1">
      {filteredFolders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          level={0}
          selectedFolderId={selectedFolderId}
          expandedFolders={expandedFolders}
          onToggleExpand={toggleExpand}
          onSelectFolder={onSelectFolder}
        />
      ))}
      {filteredFolders.length === 0 && searchQuery && (
        <div className="px-4 py-8 text-center">
          <Folder className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">No folders found</p>
        </div>
      )}
    </div>
  );
}

export { defaultFolders };
export type { FolderItem as FolderType };
