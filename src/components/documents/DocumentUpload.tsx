'use client';

import { useState, useCallback } from 'react';

import {
  Upload,
  X,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useDropzone, type FileRejection } from 'react-dropzone';

import { Button } from '@/components/ui/Button';
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/supabase';
import { cn, formatFileSize } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  createdAt: Date;
}

export interface DocumentUploadProps {
  /** Callback when files are successfully uploaded */
  onUpload: (documents: UploadedDocument[]) => void;
  /** Optional SPAC ID to associate with uploaded documents */
  spacId?: string;
  /** Optional Target ID to associate with uploaded documents */
  targetId?: string;
  /** Optional document category */
  category?: string;
  /** Whether to allow multiple file uploads */
  multiple?: boolean;
  /** Custom class name */
  className?: string;
  /** Whether the upload is disabled */
  disabled?: boolean;
  /** Optional document type for the uploaded files */
  documentType?: string;
}

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  result?: UploadedDocument;
}

// ============================================================================
// HELPERS
// ============================================================================

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
      return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <FileImage className="h-5 w-5 text-purple-500" />;
    default:
      return <File className="h-5 w-5 text-slate-500" />;
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentUpload({
  onUpload,
  spacId,
  targetId,
  category,
  multiple = true,
  className,
  disabled = false,
  documentType = 'OTHER',
}: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[], _event: unknown) => {
      // Add accepted files
      const newFiles: UploadFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        progress: 0,
        status: 'pending',
      }));

      // Add rejected files with error status
      const errorFiles: UploadFile[] = rejectedFiles.map(({ file, errors }) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        file,
        progress: 0,
        status: 'error',
        error: errors.map((e) => e.message).join(', '),
      }));

      setFiles((prev) =>
        multiple ? [...prev, ...newFiles, ...errorFiles] : [...newFiles, ...errorFiles]
      );
    },
    [multiple]
  );

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple,
    disabled: disabled || isUploading,
    noClick: false,
    noKeyboard: false,
  });

  // Remove a file from the list
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Clear all files
  const clearFiles = () => {
    setFiles([]);
  };

  // Upload all pending files
  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) {
      return;
    }

    setIsUploading(true);
    const uploadedDocs: UploadedDocument[] = [];

    for (const uploadFile of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) =>
          f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f
        )
      );

      try {
        // Create form data
        const formData = new FormData();
        formData.append('file', uploadFile.file);
        formData.append(
          'metadata',
          JSON.stringify({
            name: uploadFile.file.name,
            type: documentType,
            category,
            spacId,
            targetId,
          })
        );

        // Upload the file
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const data = await response.json();

        // Update progress to 100% and status to completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  progress: 100,
                  status: 'completed' as const,
                  result: data.document,
                }
              : f
          )
        );

        uploadedDocs.push(data.document);
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: error instanceof Error ? error.message : 'Upload failed',
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    // Call onUpload callback with all successfully uploaded documents
    if (uploadedDocs.length > 0) {
      onUpload(uploadedDocs);
    }
  };

  // Get counts
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const completedCount = files.filter((f) => f.status === 'completed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer',
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-slate-300 bg-slate-50 hover:border-primary-400 hover:bg-slate-100',
          (disabled || isUploading) && 'cursor-not-allowed opacity-50'
        )}
      >
        <input {...getInputProps()} />
        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            isDragActive ? 'bg-primary-100' : 'bg-slate-200'
          )}
        >
          <Upload
            className={cn(
              'h-8 w-8',
              isDragActive ? 'text-primary-600' : 'text-slate-500'
            )}
          />
        </div>
        <p className="mt-4 text-base font-medium text-slate-700">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          or{' '}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            className="text-primary-600 hover:text-primary-700 font-medium"
            disabled={disabled || isUploading}
          >
            browse
          </button>{' '}
          to select files
        </p>
        <p className="mt-2 text-xs text-slate-400">
          Supported: PDF, DOC, DOCX, XLS, XLSX, PNG, JPG (max 50MB each)
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-slate-700">
                Selected Files ({files.length})
              </span>
              {completedCount > 0 && (
                <span className="text-success-600">
                  {completedCount} uploaded
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-danger-600">{errorCount} failed</span>
              )}
            </div>
            <button
              onClick={clearFiles}
              className="text-sm text-slate-500 hover:text-danger-600"
              disabled={isUploading}
            >
              Clear all
            </button>
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-2',
                  uploadFile.status === 'error'
                    ? 'bg-danger-50'
                    : uploadFile.status === 'completed'
                    ? 'bg-success-50'
                    : 'bg-slate-50'
                )}
              >
                {getFileIcon(uploadFile.file.name)}
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">
                    {uploadFile.file.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">
                      {formatFileSize(uploadFile.file.size)}
                    </p>
                    {uploadFile.error && (
                      <p className="text-xs text-danger-600">
                        {uploadFile.error}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status indicators */}
                {uploadFile.status === 'pending' && (
                  <button
                    onClick={() => removeFile(uploadFile.id)}
                    className="rounded p-1 hover:bg-slate-200"
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
                {uploadFile.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 animate-spin text-primary-500" />
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

      {/* Upload Button */}
      {pendingCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={uploadFiles}
            disabled={isUploading || pendingCount === 0}
            isLoading={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload {pendingCount} {pendingCount === 1 ? 'file' : 'files'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default DocumentUpload;
