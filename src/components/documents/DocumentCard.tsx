'use client';

import { useState, useRef, useEffect } from 'react';

import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  MoreVertical,
  Eye,
  Download,
  Share2,
  Trash2,
  Clock,
  Lock,
  User,
  Copy,
  Edit,
  Star,
  History,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { RiskBadge } from '@/components/shared/RiskBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn, formatFileSize, formatRelativeTime } from '@/lib/utils';

export type RiskLevel = 'high' | 'medium' | 'low' | 'none';

export interface DocumentData {
  id: string;
  name: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: string;
  subcategory?: string;
  status: 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'FINAL' | 'ARCHIVED';
  version: number;
  isConfidential: boolean;
  isFavorite?: boolean;
  uploadedBy: string;
  uploadedByAvatar?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  description?: string;
  riskLevel?: RiskLevel;
  fileUrl?: string;
}

interface DocumentCardProps {
  document: DocumentData;
  viewMode?: 'grid' | 'list';
  isSelected?: boolean;
  riskLevel?: RiskLevel;
  onSelect?: (doc: DocumentData) => void;
  onView?: (doc: DocumentData) => void;
  onDownload?: (doc: DocumentData) => void;
  onShare?: (doc: DocumentData) => void;
  onDelete?: (doc: DocumentData) => void;
  onToggleFavorite?: (doc: DocumentData) => void;
}

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  ppt: FileText,
  pptx: FileText,
  jpg: FileImage,
  jpeg: FileImage,
  png: FileImage,
  gif: FileImage,
  default: File,
};

const fileTypeColors: Record<string, string> = {
  pdf: 'text-red-500 bg-red-50',
  doc: 'text-blue-500 bg-blue-50',
  docx: 'text-blue-500 bg-blue-50',
  xls: 'text-green-500 bg-green-50',
  xlsx: 'text-green-500 bg-green-50',
  csv: 'text-green-500 bg-green-50',
  ppt: 'text-orange-500 bg-orange-50',
  pptx: 'text-orange-500 bg-orange-50',
  jpg: 'text-purple-500 bg-purple-50',
  jpeg: 'text-purple-500 bg-purple-50',
  png: 'text-purple-500 bg-purple-50',
  gif: 'text-purple-500 bg-purple-50',
  default: 'text-slate-500 bg-slate-50',
};

const statusConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'secondary' | 'primary' | 'danger' }> = {
  DRAFT: { label: 'Draft', variant: 'secondary' },
  UNDER_REVIEW: { label: 'Under Review', variant: 'warning' },
  APPROVED: { label: 'Approved', variant: 'success' },
  FINAL: { label: 'Final', variant: 'primary' },
  ARCHIVED: { label: 'Archived', variant: 'secondary' },
};

function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  const lastPart = parts[parts.length - 1];
  return parts.length > 1 && lastPart ? lastPart.toLowerCase() : 'default';
}

function getFileIcon(fileName: string): React.ComponentType<{ className?: string }> {
  const ext = getFileExtension(fileName);
  return fileTypeIcons[ext] ?? fileTypeIcons['default']!;
}

function getFileColor(fileName: string) {
  const ext = getFileExtension(fileName);
  return fileTypeColors[ext] || fileTypeColors['default'];
}

export function DocumentCard({
  document: doc,
  viewMode = 'grid',
  isSelected = false,
  riskLevel,
  onSelect,
  onView,
  onDownload,
  onShare,
  onDelete,
  onToggleFavorite,
}: DocumentCardProps) {
  // Use riskLevel from prop or from document data
  const effectiveRiskLevel = riskLevel ?? doc.riskLevel;
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const FileIcon = getFileIcon(doc.fileName);
  const fileColor = getFileColor(doc.fileName);
  const status = statusConfig[doc.status] ?? { label: 'Unknown', variant: 'secondary' as const };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    window.document.addEventListener('mousedown', handleClickOutside);
    return () => window.document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    { icon: Eye, label: 'View', onClick: () => onView?.(doc) },
    { icon: Download, label: 'Download', onClick: () => onDownload?.(doc) },
    { icon: Share2, label: 'Share', onClick: () => onShare?.(doc) },
    { icon: Copy, label: 'Copy Link', onClick: () => {} },
    { icon: Edit, label: 'Rename', onClick: () => {} },
    { icon: History, label: 'Version History', onClick: () => {} },
    { type: 'divider' as const },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete?.(doc), danger: true },
  ];

  if (viewMode === 'list') {
    return (
      <div
        className={cn(
          'group flex items-center gap-4 rounded-lg border px-4 py-3 transition-all hover:border-primary-200 hover:bg-slate-50',
          isSelected ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'
        )}
        onClick={() => onSelect?.(doc)}
      >
        {/* File Icon */}
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', fileColor)}>
          <FileIcon className="h-5 w-5" />
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 truncate">{doc.name}</h4>
            {doc.isConfidential && (
              <Tooltip content="Confidential">
                <Lock className="h-3.5 w-3.5 text-slate-400" />
              </Tooltip>
            )}
            {doc.isFavorite && (
              <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
            )}
            {effectiveRiskLevel && effectiveRiskLevel !== 'none' && (
              <RiskBadge level={effectiveRiskLevel} compact />
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">
            {doc.fileName} | v{doc.version}
          </p>
        </div>

        {/* Status */}
        <div className="hidden md:block">
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Size */}
        <div className="hidden sm:block text-sm text-slate-500 w-20 text-right">
          {formatFileSize(doc.fileSize)}
        </div>

        {/* Updated */}
        <div className="hidden lg:flex items-center gap-1 text-sm text-slate-500 w-32">
          <Clock className="h-3.5 w-3.5" />
          <span>{formatRelativeTime(doc.updatedAt)}</span>
        </div>

        {/* Owner */}
        <div className="hidden xl:flex items-center gap-2 w-32">
          <div className="h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700">
            {doc.uploadedBy.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-sm text-slate-600 truncate">{doc.uploadedBy}</span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip content="View">
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(doc); }}
              className="rounded p-1.5 hover:bg-slate-100"
            >
              <Eye className="h-4 w-4 text-slate-400" />
            </button>
          </Tooltip>
          <Tooltip content="Download">
            <button
              onClick={(e) => { e.stopPropagation(); onDownload?.(doc); }}
              className="rounded p-1.5 hover:bg-slate-100"
            >
              <Download className="h-4 w-4 text-slate-400" />
            </button>
          </Tooltip>
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="rounded p-1.5 hover:bg-slate-100"
            >
              <MoreVertical className="h-4 w-4 text-slate-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {menuItems.map((item, idx) =>
                  item.type === 'divider' ? (
                    <div key={idx} className="my-1 border-t border-slate-200" />
                  ) : (
                    <button
                      key={idx}
                      onClick={(e) => { e.stopPropagation(); item.onClick?.(); setShowMenu(false); }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-sm',
                        item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 transition-all hover:border-primary-200 hover:shadow-md cursor-pointer',
        isSelected ? 'border-primary-500 bg-primary-50 shadow-md' : 'border-slate-200 bg-white'
      )}
      onClick={() => onSelect?.(doc)}
    >
      {/* Risk Badge - Top Left */}
      {effectiveRiskLevel && effectiveRiskLevel !== 'none' && (
        <div className="absolute left-3 top-3">
          <RiskBadge level={effectiveRiskLevel} compact />
        </div>
      )}

      {/* Favorite Star - Top Right */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(doc); }}
        className={cn(
          'absolute right-3 top-3 rounded p-1 transition-opacity',
          doc.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-100'
        )}
      >
        <Star
          className={cn(
            'h-4 w-4',
            doc.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
          )}
        />
      </button>

      {/* File Icon */}
      <div className={cn('mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl', fileColor)}>
        <FileIcon className="h-8 w-8" />
      </div>

      {/* File Name */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h4 className="font-medium text-slate-900 truncate max-w-[150px]">{doc.name}</h4>
          {doc.isConfidential && (
            <Tooltip content="Confidential">
              <Lock className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            </Tooltip>
          )}
        </div>
        <p className="text-xs text-slate-500">{formatFileSize(doc.fileSize)}</p>
      </div>

      {/* Status & Version */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <Badge variant={status.variant} size="sm">{status.label}</Badge>
        <span className="text-xs text-slate-400">v{doc.version}</span>
      </div>

      {/* Meta Info */}
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(doc.updatedAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span className="truncate max-w-[80px]">{doc.uploadedBy}</span>
        </div>
      </div>

      {/* Quick Actions (on hover) */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
        <div className="flex items-center justify-center gap-1 rounded-b-lg bg-slate-50 px-4 py-2 border-t border-slate-200">
          <Tooltip content="View">
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(doc); }}
              className="rounded p-2 hover:bg-white hover:shadow-sm transition-all"
            >
              <Eye className="h-4 w-4 text-slate-600" />
            </button>
          </Tooltip>
          <Tooltip content="Download">
            <button
              onClick={(e) => { e.stopPropagation(); onDownload?.(doc); }}
              className="rounded p-2 hover:bg-white hover:shadow-sm transition-all"
            >
              <Download className="h-4 w-4 text-slate-600" />
            </button>
          </Tooltip>
          <Tooltip content="Share">
            <button
              onClick={(e) => { e.stopPropagation(); onShare?.(doc); }}
              className="rounded p-2 hover:bg-white hover:shadow-sm transition-all"
            >
              <Share2 className="h-4 w-4 text-slate-600" />
            </button>
          </Tooltip>
          <Tooltip content="Delete">
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(doc); }}
              className="rounded p-2 hover:bg-white hover:shadow-sm transition-all"
            >
              <Trash2 className="h-4 w-4 text-danger-600" />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
