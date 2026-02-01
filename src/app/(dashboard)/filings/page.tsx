'use client';

import { FileText, Calendar, AlertTriangle, Clock, MessageSquare, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function FilingsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">SEC Filings</h1>
        <p className="page-description">
          Track SEC filings, manage deadlines, and monitor comment letter responses
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
            Filing Tracker Coming Soon
          </h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-slate-500">
            A comprehensive SEC filing management system with deadline tracking,
            comment letter management, and filing timeline visualization is currently in development.
          </p>

          {/* Sprint Info */}
          <div className="mt-6 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">
              Expected in Sprint 6
            </span>
          </div>

          {/* Feature Preview */}
          <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Calendar className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Filing Calendar</h3>
              <p className="mt-1 text-xs text-slate-500">
                Visual calendar of all filing deadlines
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <AlertTriangle className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Deadline Alerts</h3>
              <p className="mt-1 text-xs text-slate-500">
                Automated reminders for approaching deadlines
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <MessageSquare className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Comment Letters</h3>
              <p className="mt-1 text-xs text-slate-500">
                Track and respond to SEC comments
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <TrendingUp className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Filing Timeline</h3>
              <p className="mt-1 text-xs text-slate-500">
                Visual timeline of SPAC milestones
              </p>
            </div>
          </div>

          {/* Supported Filing Types Preview */}
          <div className="mt-10 w-full max-w-2xl">
            <p className="mb-4 text-sm font-medium text-slate-600">Supported Filing Types</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['S-1', 'S-4', '8-K', '10-K', '10-Q', 'DEF14A', 'Super 8-K', 'PREM14A'].map((type) => (
                <span
                  key={type}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-500"
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
