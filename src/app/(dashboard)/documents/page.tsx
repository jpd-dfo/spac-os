'use client';

import { FileText, Upload, FolderOpen, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Documents</h1>
        <p className="page-description">
          Securely manage, organize, and analyze your SPAC deal documents
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          {/* Icon */}
          <div className="mb-6 rounded-full bg-primary-50 p-6">
            <FileText className="h-12 w-12 text-primary-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-slate-900">
            Document Management Coming Soon
          </h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-slate-500">
            A comprehensive document management system with folder organization,
            version control, and AI-powered document analysis is currently in development.
          </p>

          {/* Sprint Info */}
          <div className="mt-6 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">
              Expected in Sprint 4
            </span>
          </div>

          {/* Disabled Upload Button */}
          <div className="mt-8">
            <Button variant="primary" size="lg" disabled>
              <Upload className="mr-2 h-5 w-5" />
              Upload Documents
            </Button>
          </div>

          {/* Feature Preview */}
          <div className="mt-12 grid w-full max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <FolderOpen className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Folder Organization</h3>
              <p className="mt-1 text-xs text-slate-500">
                Organize documents by deal, type, or custom categories
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <FileText className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Version Control</h3>
              <p className="mt-1 text-xs text-slate-500">
                Track changes and maintain document history
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <svg
                className="mb-2 h-6 w-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <h3 className="text-sm font-medium text-slate-700">AI Analysis</h3>
              <p className="mt-1 text-xs text-slate-500">
                Extract key terms and insights automatically
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
