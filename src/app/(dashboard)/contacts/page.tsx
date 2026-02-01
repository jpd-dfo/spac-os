'use client';

import { Users, Network, Building, UserPlus, Mail, Phone, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export default function ContactsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Contacts</h1>
        <p className="page-description">
          Manage your professional network with relationship intelligence
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          {/* Icon */}
          <div className="mb-6 rounded-full bg-primary-50 p-6">
            <Users className="h-12 w-12 text-primary-500" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-semibold text-slate-900">
            CRM Module Coming Soon
          </h2>

          {/* Description */}
          <p className="mt-3 max-w-md text-slate-500">
            A comprehensive contact and relationship management system designed specifically
            for SPAC deal teams, with relationship scoring and interaction tracking.
          </p>

          {/* Sprint Info */}
          <div className="mt-6 flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2">
            <Clock className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-600">
              Expected in Sprint 8
            </span>
          </div>

          {/* Feature Preview */}
          <div className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Users className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Contact Directory</h3>
              <p className="mt-1 text-xs text-slate-500">
                Centralized database of all deal-related contacts
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Network className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Relationship Graph</h3>
              <p className="mt-1 text-xs text-slate-500">
                Visualize connections between contacts and companies
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Building className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Company Profiles</h3>
              <p className="mt-1 text-xs text-slate-500">
                Track companies and their associated contacts
              </p>
            </div>
          </div>

          {/* Additional Features */}
          <div className="mt-6 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <UserPlus className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Relationship Scoring</h3>
              <p className="mt-1 text-xs text-slate-500">
                AI-powered relationship strength metrics
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Mail className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Interaction Logging</h3>
              <p className="mt-1 text-xs text-slate-500">
                Track meetings, calls, and email communications
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <Phone className="mb-2 h-6 w-6 text-slate-400" />
              <h3 className="text-sm font-medium text-slate-700">Contact Types</h3>
              <p className="mt-1 text-xs text-slate-500">
                Categorize by role: bankers, lawyers, investors, targets
              </p>
            </div>
          </div>

          {/* Contact Type Preview */}
          <div className="mt-10 w-full max-w-2xl">
            <p className="mb-4 text-sm font-medium text-slate-600">Supported Contact Categories</p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Target Executives',
                'Investment Bankers',
                'Legal Counsel',
                'PIPE Investors',
                'Board Members',
                'Auditors',
                'IR Contacts',
                'Service Providers',
              ].map((type) => (
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
