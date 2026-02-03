'use client';

import { useState } from 'react';

import {
  Building,
  Globe,
  MapPin,
  Users,
  Calendar,
  ExternalLink,
  Mail,
  Phone,
  Briefcase,
  Newspaper,
  ChevronRight,
  TrendingUp,
  Award,
} from 'lucide-react';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { cn, formatDate } from '@/lib/utils';

import type { Company, ExtendedContact } from './mockContactsData';

interface CompanyProfileProps {
  company: Company;
  contacts: ExtendedContact[];
  onContactClick?: (contact: ExtendedContact) => void;
  onClose?: () => void;
}

function getCompanyTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Banker: 'bg-amber-100 text-amber-700',
    'Law Firm': 'bg-slate-100 text-slate-700',
    'Target Company': 'bg-purple-100 text-purple-700',
    Investor: 'bg-green-100 text-green-700',
    SPAC: 'bg-blue-100 text-blue-700',
  };
  return colors[type] || 'bg-slate-100 text-slate-700';
}

function getOutcomeColor(outcome: string): 'success' | 'warning' | 'danger' | 'secondary' {
  switch (outcome.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'terminated':
      return 'danger';
    case 'active':
      return 'warning';
    default:
      return 'secondary';
  }
}

export function CompanyProfile({
  company,
  contacts,
  onContactClick,
  onClose,
}: CompanyProfileProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'deals' | 'news'>('overview');

  // Calculate aggregate relationship score
  const avgRelationshipScore =
    contacts.length > 0
      ? Math.round(contacts.reduce((sum, c) => sum + c.relationshipScore, 0) / contacts.length)
      : 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Building className="h-4 w-4" /> },
    { id: 'contacts', label: `Contacts (${contacts.length})`, icon: <Users className="h-4 w-4" /> },
    { id: 'deals', label: `Deal History (${company.dealHistory.length})`, icon: <Briefcase className="h-4 w-4" /> },
    { id: 'news', label: `News (${company.news.length})`, icon: <Newspaper className="h-4 w-4" /> },
  ];

  return (
    <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-12 h-12 object-contain" />
              ) : (
                <Building className="w-8 h-8 text-slate-600" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold">{company.name}</h2>
                <Badge className={cn('text-xs', getCompanyTypeColor(company.type))}>
                  {company.type}
                </Badge>
              </div>
              <p className="text-slate-300 text-sm mt-1">{company.industry}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {company.city}, {company.state}
                </span>
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-white transition-colors"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-slate-400">Contacts</p>
            <p className="text-2xl font-bold">{contacts.length}</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-slate-400">Avg. Relationship</p>
            <p className={cn('text-2xl font-bold', avgRelationshipScore >= 70 ? 'text-green-400' : avgRelationshipScore >= 50 ? 'text-amber-400' : 'text-slate-300')}>
              {avgRelationshipScore}
            </p>
          </div>
          {company.employeeCount && (
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-400">Employees</p>
              <p className="text-2xl font-bold">{company.employeeCount.toLocaleString()}</p>
            </div>
          )}
          {company.foundedYear && (
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-slate-400">Founded</p>
              <p className="text-2xl font-bold">{company.foundedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">About</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{company.description}</p>
            </div>

            {/* Firmographic Data */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <Building className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Industry</p>
                    <p className="text-sm font-medium text-slate-900">{company.industry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <MapPin className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">Headquarters</p>
                    <p className="text-sm font-medium text-slate-900">
                      {company.city}, {company.state}, {company.country}
                    </p>
                  </div>
                </div>
                {company.employeeCount && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Users className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Employee Count</p>
                      <p className="text-sm font-medium text-slate-900">
                        {company.employeeCount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {company.foundedYear && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-xs text-slate-500">Founded</p>
                      <p className="text-sm font-medium text-slate-900">{company.foundedYear}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Key Contacts Preview */}
            {contacts.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Key Contacts</h3>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveTab('contacts')}
                  >
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {contacts
                    .sort((a, b) => b.relationshipScore - a.relationshipScore)
                    .slice(0, 4)
                    .map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => onContactClick?.(contact)}
                        className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Avatar
                          name={`${contact.firstName} ${contact.lastName}`}
                          size="sm"
                        />
                        <div className="text-left">
                          <p className="text-sm font-medium text-slate-900">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{contact.title}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-3">
            {contacts.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No contacts at this company</p>
              </div>
            ) : (
              contacts
                .sort((a, b) => b.relationshipScore - a.relationshipScore)
                .map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => onContactClick?.(contact)}
                    className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={`${contact.firstName} ${contact.lastName}`}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-slate-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-sm text-slate-500">{contact.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {contact.email && (
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={cn(
                        contact.relationshipScore >= 80 ? 'bg-green-100 text-green-700' :
                        contact.relationshipScore >= 60 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      )}>
                        Score: {contact.relationshipScore}
                      </Badge>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="space-y-3">
            {company.dealHistory.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No deal history with this company</p>
              </div>
            ) : (
              company.dealHistory.map((deal, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <Briefcase className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{deal.dealName}</p>
                      <p className="text-sm text-slate-500">Role: {deal.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">{deal.year}</span>
                    <Badge variant={getOutcomeColor(deal.outcome)}>{deal.outcome}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="space-y-3">
            {company.news.length === 0 ? (
              <div className="text-center py-12">
                <Newspaper className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No recent news for this company</p>
              </div>
            ) : (
              company.news.map((item, idx) => (
                <a
                  key={idx}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900 hover:text-primary-600 transition-colors">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-sm text-slate-500">
                        <span>{item.source}</span>
                        <span>-</span>
                        <span>{formatDate(item.date)}</span>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CompanyProfile;
