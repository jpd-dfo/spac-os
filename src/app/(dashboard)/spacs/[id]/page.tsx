'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Target,
  Users,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SpacStatusBadge } from '@/components/spacs';
import {
  formatLargeNumber,
  formatDate,
  formatCurrency,
  daysUntil,
  formatPercent,
  cn,
} from '@/lib/utils';
import { SPAC_PHASE_LABELS, TARGET_STATUS_LABELS } from '@/lib/constants';

// Mock data for a single SPAC
const mockSpac = {
  id: '1',
  name: 'Alpha Acquisition Corp',
  ticker: 'ALPH',
  status: 'DA_ANNOUNCED',
  phase: 'SEC_REVIEW',
  description:
    'Alpha Acquisition Corp is a blank check company formed for the purpose of effecting a merger, share exchange, asset acquisition, share purchase, reorganization or similar business combination with one or more businesses.',
  investmentThesis:
    'Focused on identifying technology companies with strong growth potential in the enterprise software and cybersecurity sectors.',
  ipoDate: new Date('2023-06-15'),
  ipoSize: 250000000,
  unitPrice: 10.0,
  sharesOutstanding: 25000000,
  warrantsOutstanding: 8333333,
  trustBalance: 258000000,
  trustPerShare: 10.32,
  interestEarned: 8000000,
  deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
  extensionCount: 1,
  maxExtensions: 6,
  daAnnouncedDate: new Date('2024-01-15'),
  proxyFiledDate: null,
  voteDate: null,
  closingDate: null,
  targetSectors: ['Technology', 'Healthcare'],
  targetGeographies: ['North America', 'Europe'],
  targetSizeMin: 500000000,
  targetSizeMax: 2000000000,
  createdAt: new Date('2023-05-01'),
  updatedAt: new Date('2024-01-20'),
};

// Mock targets
const mockTargets = [
  {
    id: '1',
    name: 'TechVision Inc.',
    status: 'DEFINITIVE',
    sector: 'Technology',
    enterpriseValue: 1200000000,
    probability: 85,
    priority: 1,
  },
  {
    id: '2',
    name: 'CloudSecure Corp',
    status: 'PASSED',
    sector: 'Technology',
    enterpriseValue: 800000000,
    probability: 0,
    priority: 2,
  },
];

// Mock documents
const mockDocuments = [
  {
    id: '1',
    name: 'S-4 Registration Statement',
    type: 'SEC_FILING',
    status: 'FILED',
    uploadedAt: new Date('2024-01-20'),
  },
  {
    id: '2',
    name: 'Definitive Agreement',
    type: 'LEGAL_AGREEMENT',
    status: 'APPROVED',
    uploadedAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    name: 'Financial Model v3.2',
    type: 'FINANCIAL_MODEL',
    status: 'DRAFT',
    uploadedAt: new Date('2024-01-10'),
  },
];

// Mock activity
const mockActivity = [
  {
    id: '1',
    action: 'DA Announced',
    description: 'Definitive Agreement announced with TechVision Inc.',
    user: 'John Smith',
    timestamp: new Date('2024-01-15T10:30:00'),
  },
  {
    id: '2',
    action: 'Document Uploaded',
    description: 'S-4 Registration Statement filed with SEC',
    user: 'Sarah Johnson',
    timestamp: new Date('2024-01-20T14:15:00'),
  },
  {
    id: '3',
    action: 'Trust Updated',
    description: 'Trust balance updated with interest earnings',
    user: 'System',
    timestamp: new Date('2024-01-18T09:00:00'),
  },
];

type TabType = 'overview' | 'targets' | 'documents' | 'activity';

export default function SPACDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const spac = mockSpac; // In production, fetch by params.id
  const days = daysUntil(spac.deadline);
  const isUrgent = days !== null && days <= 30;
  const isCritical = days !== null && days <= 14;

  const tabs: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'targets', label: 'Targets', icon: Target },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'activity', label: 'Activity', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/spacs')}
            className="mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100">
                <Building2 className="h-7 w-7 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{spac.name}</h1>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-lg font-medium text-slate-500">{spac.ticker}</span>
                  <SpacStatusBadge status={spac.status} />
                  <Badge variant="secondary">
                    {SPAC_PHASE_LABELS[spac.phase] || spac.phase}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md">
            <ExternalLink className="mr-2 h-4 w-4" />
            SEC Filings
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push(`/spacs/${spac.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit SPAC
          </Button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Trust Balance */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <DollarSign className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Trust Balance</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatLargeNumber(spac.trustBalance)}
                </p>
                <p className="text-xs text-slate-500">
                  {formatCurrency(spac.trustPerShare)} per share
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline Countdown */}
        <Card
          className={cn(
            isCritical
              ? 'border-danger-200 bg-danger-50'
              : isUrgent
                ? 'border-warning-200 bg-warning-50'
                : ''
          )}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  isCritical
                    ? 'bg-danger-100'
                    : isUrgent
                      ? 'bg-warning-100'
                      : 'bg-slate-100'
                )}
              >
                <Clock
                  className={cn(
                    'h-5 w-5',
                    isCritical
                      ? 'text-danger-600'
                      : isUrgent
                        ? 'text-warning-600'
                        : 'text-slate-600'
                  )}
                />
              </div>
              <div>
                <p className="text-sm text-slate-500">Deadline</p>
                <p
                  className={cn(
                    'text-xl font-bold',
                    isCritical
                      ? 'text-danger-700'
                      : isUrgent
                        ? 'text-warning-700'
                        : 'text-slate-900'
                  )}
                >
                  {days !== null ? `${days} days` : '-'}
                </p>
                <p className="text-xs text-slate-500">{formatDate(spac.deadline)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IPO Size */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">IPO Size</p>
                <p className="text-xl font-bold text-slate-900">
                  {formatLargeNumber(spac.ipoSize)}
                </p>
                <p className="text-xs text-slate-500">
                  {spac.sharesOutstanding?.toLocaleString()} shares
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Extensions */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Calendar className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Extensions Used</p>
                <p className="text-xl font-bold text-slate-900">
                  {spac.extensionCount} / {spac.maxExtensions}
                </p>
                <p className="text-xs text-slate-500">
                  {spac.maxExtensions - spac.extensionCount} remaining
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{spac.description || 'No description provided.'}</p>
              </CardContent>
            </Card>

            {/* Investment Thesis */}
            <Card>
              <CardHeader>
                <CardTitle>Investment Thesis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">
                  {spac.investmentThesis || 'No investment thesis provided.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Target Sectors</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {spac.targetSectors.map((sector) => (
                        <Badge key={sector} variant="secondary" size="sm">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Target Geographies</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {spac.targetGeographies.map((geo) => (
                        <Badge key={geo} variant="secondary" size="sm">
                          {geo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Target Size Range</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatLargeNumber(spac.targetSizeMin)} - {formatLargeNumber(spac.targetSizeMax)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Dates */}
            <Card>
              <CardHeader>
                <CardTitle>Key Dates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">IPO Date</p>
                    <p className="text-sm text-slate-900">{formatDate(spac.ipoDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">DA Announced</p>
                    <p className="text-sm text-slate-900">{formatDate(spac.daAnnouncedDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Proxy Filed</p>
                    <p className="text-sm text-slate-900">{formatDate(spac.proxyFiledDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Vote Date</p>
                    <p className="text-sm text-slate-900">{formatDate(spac.voteDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Expected Closing</p>
                    <p className="text-sm text-slate-900">{formatDate(spac.closingDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500">Deadline</p>
                    <p className="text-sm text-slate-900">{formatDate(spac.deadline)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Trust Details */}
            <Card>
              <CardHeader>
                <CardTitle>Trust Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Current Balance</span>
                    <span className="font-medium text-slate-900">
                      {formatLargeNumber(spac.trustBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Per Share Value</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(spac.trustPerShare)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Interest Earned</span>
                    <span className="font-medium text-success-600">
                      +{formatLargeNumber(spac.interestEarned)}
                    </span>
                  </div>
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">Original IPO Size</span>
                      <span className="font-medium text-slate-900">
                        {formatLargeNumber(spac.ipoSize)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Structure */}
            <Card>
              <CardHeader>
                <CardTitle>Share Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Shares Outstanding</span>
                    <span className="font-medium text-slate-900">
                      {spac.sharesOutstanding?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Warrants Outstanding</span>
                    <span className="font-medium text-slate-900">
                      {spac.warrantsOutstanding?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Unit Price</span>
                    <span className="font-medium text-slate-900">
                      {formatCurrency(spac.unitPrice)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Documents */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Documents</CardTitle>
                <Link
                  href={`/spacs/${spac.id}/documents`}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                >
                  View All
                </Link>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockDocuments.slice(0, 3).map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{formatDate(doc.uploadedAt)}</p>
                        </div>
                      </div>
                      <Badge
                        variant={doc.status === 'FILED' ? 'success' : doc.status === 'APPROVED' ? 'primary' : 'secondary'}
                        size="sm"
                      >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'targets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900">Associated Targets</h3>
            <Button variant="primary" size="sm">
              <Target className="mr-2 h-4 w-4" />
              Add Target
            </Button>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {mockTargets.map((target) => (
              <Card key={target.id} className="cursor-pointer transition-all hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{target.name}</h4>
                      <p className="text-sm text-slate-500">{target.sector}</p>
                    </div>
                    <Badge
                      variant={
                        target.status === 'DEFINITIVE'
                          ? 'success'
                          : target.status === 'PASSED'
                            ? 'danger'
                            : 'secondary'
                      }
                    >
                      {TARGET_STATUS_LABELS[target.status] || target.status}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Enterprise Value</p>
                      <p className="font-medium text-slate-900">
                        {formatLargeNumber(target.enterpriseValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Probability</p>
                      <p className="font-medium text-slate-900">{target.probability}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-slate-900">Documents</h3>
            <Button variant="primary" size="sm">
              <FileText className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </div>
          <Card>
            <div className="divide-y divide-slate-100">
              {mockDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className="text-sm text-slate-500">
                        {doc.type.replace(/_/g, ' ')} - Uploaded {formatDate(doc.uploadedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        doc.status === 'FILED'
                          ? 'success'
                          : doc.status === 'APPROVED'
                            ? 'primary'
                            : 'secondary'
                      }
                      size="sm"
                    >
                      {doc.status}
                    </Badge>
                    <Button variant="ghost" size="icon-sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-900">Activity Timeline</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                {mockActivity.map((item, index) => (
                  <div key={item.id} className="relative flex gap-4">
                    {index !== mockActivity.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-full w-0.5 bg-slate-200" />
                    )}
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                      <Activity className="h-4 w-4 text-primary-600" />
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">{item.action}</p>
                        <span className="text-sm text-slate-500">
                          {formatDate(item.timestamp, 'MMM d, h:mm a')}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                      <p className="mt-1 text-xs text-slate-400">by {item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
