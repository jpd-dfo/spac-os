'use client';

import { useState, useRef, useCallback } from 'react';

import {
  Upload,
  X,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  CheckCircle,
  AlertCircle,
  Trash2,
  Folder,
  Tag,
  ChevronDown,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalHeader, ModalTitle, ModalFooter } from '@/components/ui/Modal';
import { cn, formatFileSize } from '@/lib/utils';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], metadata: UploadMetadata) => Promise<void>;
}

interface UploadMetadata {
  category: string;
  subcategory?: string;
  tags: string[];
  description?: string;
  isConfidential: boolean;
}

const categories = [
  { id: 'formation', name: 'Formation Documents', subcategories: ['Charter', 'Bylaws', 'Subscription Agreements', 'Sponsor Agreements', 'Warrant Agreements'] },
  { id: 'sec-filings', name: 'SEC Filings', subcategories: ['S-1 Registration', 'S-4 Registration', '10-K', '10-Q', '8-K', 'Proxy Statements'] },
  { id: 'transaction', name: 'Transaction Documents', subcategories: ['Letters of Intent', 'Merger Agreements', 'PIPE Documents', 'Forward Purchase', 'Backstop Agreements'] },
  { id: 'due-diligence', name: 'Due Diligence', subcategories: ['Financial', 'Legal', 'Tax', 'Operational', 'IP & Technology'] },
  { id: 'governance', name: 'Governance', subcategories: ['Board Minutes', 'Committee Charters', 'Policies', 'Resolutions'] },
  { id: 'investor-relations', name: 'Investor Relations', subcategories: ['Presentations', 'Press Releases', 'Call Transcripts'] },
  { id: 'templates', name: 'Templates', subcategories: ['NDA Templates', 'LOI Templates', 'Memo Templates', 'Checklists'] },
];

const suggestedTags = [
  'Confidential', 'Draft', 'Final', 'Urgent', 'Legal Review', 'Board Approved',
  'Due Diligence', 'Financial', 'Legal', 'Tax', 'Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024',
];

function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return <FileText className="h-5 w-5 text-red-500" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-5 w-5 text-blue-500" />;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <FileImage className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-slate-500" />;
  }
}

export function UploadModal({ isOpen, onClose, onUpload }: UploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [description, setDescription] = useState('');
  const [isConfidential, setIsConfidential] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags((prev) => [...prev, customTag.trim()]);
      setCustomTag('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || !selectedCategory) {return;}

    setIsUploading(true);

    // Simulate upload progress
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading' } : f
        )
      );

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setFiles((prev) =>
          prev.map((f, idx) =>
            idx === i ? { ...f, progress } : f
          )
        );
      }

      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'completed', progress: 100 } : f
        )
      );
    }

    // Call the actual upload handler
    await onUpload(files.map((f) => f.file), {
      category: selectedCategory,
      subcategory: selectedSubcategory,
      tags: selectedTags,
      description,
      isConfidential,
    });

    setIsUploading(false);

    // Reset after short delay
    setTimeout(() => {
      setFiles([]);
      setSelectedCategory('');
      setSelectedSubcategory('');
      setSelectedTags([]);
      setDescription('');
      setIsConfidential(false);
      onClose();
    }, 1000);
  };

  const selectedCategoryData = categories.find((c) => c.id === selectedCategory);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
    >
      <ModalHeader>
        <ModalTitle>Upload Documents</ModalTitle>
        <p className="mt-1 text-sm text-slate-500">Upload one or more documents to the repository</p>
      </ModalHeader>
      <div className="space-y-6">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
            isDragging
              ? 'border-primary-500 bg-primary-50'
              : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-slate-100'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
          />
          <div
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              isDragging ? 'bg-primary-100' : 'bg-slate-200'
            )}
          >
            <Upload className={cn('h-8 w-8', isDragging ? 'text-primary-600' : 'text-slate-500')} />
          </div>
          <p className="mt-4 text-base font-medium text-slate-700">
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            or <span className="text-primary-600">browse</span> to select files
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Supported: PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, TXT, Images (max 50MB each)
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-slate-700">
                Selected Files ({files.length})
              </h4>
              <button
                onClick={() => setFiles([])}
                className="text-sm text-slate-500 hover:text-danger-600"
              >
                Clear all
              </button>
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
              {files.map((uploadFile) => (
                <div
                  key={uploadFile.id}
                  className="flex items-center gap-3 rounded-lg bg-slate-50 p-2"
                >
                  {getFileIcon(uploadFile.file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                  </div>
                  {uploadFile.status === 'pending' && (
                    <button
                      onClick={() => removeFile(uploadFile.id)}
                      className="rounded p-1 hover:bg-slate-200"
                    >
                      <X className="h-4 w-4 text-slate-400" />
                    </button>
                  )}
                  {uploadFile.status === 'uploading' && (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full bg-primary-500 transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{uploadFile.progress}%</span>
                    </div>
                  )}
                  {uploadFile.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-success-500" />
                  )}
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-danger-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Category */}
          <div className="relative">
            <span className="block text-sm font-medium text-slate-700">
              Category <span className="text-danger-500">*</span>
            </span>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="mt-1.5 flex w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 hover:bg-slate-50"
            >
              <span className={selectedCategory ? '' : 'text-slate-400'}>
                {selectedCategoryData?.name || 'Select category'}
              </span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </button>
            {showCategoryDropdown && (
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedSubcategory('');
                      setShowCategoryDropdown(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50',
                      selectedCategory === category.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-slate-700'
                    )}
                  >
                    <Folder className="h-4 w-4" />
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Subcategory */}
          <div>
            <label htmlFor="subcategory-select" className="block text-sm font-medium text-slate-700">Subcategory</label>
            <select
              id="subcategory-select"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={!selectedCategory}
              className="mt-1.5 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select subcategory</option>
              {selectedCategoryData?.subcategories.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <span className="block text-sm font-medium text-slate-700">Tags</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {suggestedTags.slice(0, 12).map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'rounded-full px-3 py-1 text-sm transition-colors',
                  selectedTags.includes(tag)
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
              placeholder="Add custom tag..."
              className="flex-1 rounded-md border border-slate-200 px-3 py-1.5 text-sm placeholder:text-slate-400"
            />
            <Button variant="secondary" size="sm" onClick={addCustomTag}>
              Add
            </Button>
          </div>
          {selectedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <Badge key={tag} variant="primary" size="sm">
                  {tag}
                  <button
                    onClick={() => toggleTag(tag)}
                    className="ml-1 hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description-textarea" className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            id="description-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for these documents..."
            rows={2}
            className="mt-1.5 w-full rounded-md border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400"
          />
        </div>

        {/* Confidential Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConfidential(!isConfidential)}
            className={cn(
              'relative h-6 w-11 rounded-full transition-colors',
              isConfidential ? 'bg-primary-600' : 'bg-slate-200'
            )}
          >
            <span
              className={cn(
                'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                isConfidential && 'translate-x-5'
              )}
            />
          </button>
          <div>
            <p className="text-sm font-medium text-slate-700">Mark as Confidential</p>
            <p className="text-xs text-slate-500">Restrict access to authorized users only</p>
          </div>
        </div>
      </div>

      <ModalFooter className="-mx-6 -mb-6 mt-6">
        <Button variant="secondary" onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleUpload}
          disabled={files.length === 0 || !selectedCategory || isUploading}
          isLoading={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload {files.length > 0 && `(${files.length})`}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
