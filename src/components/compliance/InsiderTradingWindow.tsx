'use client';

import { useState } from 'react';
import {
  Lock,
  Unlock,
  Calendar,
  Clock,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Download,
  ChevronRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/Table';
import { cn, formatDate, formatDateTime, daysUntil } from '@/lib/utils';

// Types
type WindowStatus = 'Open' | 'Closed';
type PreClearanceStatus = 'Pending' | 'Approved' | 'Denied' | 'Expired' | 'Executed';
type Form4Status = 'Pending' | 'Filed' | 'Late';

interface BlackoutPeriod {
  id: string;
  name: string;
  reason: string;
  startDate: Date;
  endDate: Date;
  affectsAll: boolean;
  affectedPersons?: string[];
}

interface Insider {
  id: string;
  name: string;
  title: string;
  relationship: string; // 10% Owner, Director, Officer
  section16: boolean;
  email: string;
  lastCertification: Date | null;
}

interface PreClearanceRequest {
  id: string;
  insiderId: string;
  insiderName: string;
  requestDate: Date;
  transactionType: 'Buy' | 'Sell' | 'Gift' | 'Exercise';
  securityType: 'Common Stock' | 'Warrant' | 'Option';
  shares: number;
  estimatedPrice: number;
  reason: string;
  status: PreClearanceStatus;
  approvedBy?: string;
  approvalDate?: Date;
  expirationDate?: Date;
  executedDate?: Date;
  executedShares?: number;
  executedPrice?: number;
  notes?: string;
}

interface Form4Filing {
  id: string;
  insiderId: string;
  insiderName: string;
  transactionDate: Date;
  filingDate: Date | null;
  dueDate: Date;
  transactionType: string;
  securityType: string;
  shares: number;
  price: number;
  sharesOwned: number;
  status: Form4Status;
  accessionNumber?: string;
}

// Mock data
const currentWindow: { status: WindowStatus; message: string; nextChange: Date } = {
  status: 'Open',
  message: 'Trading window is currently open. Pre-clearance required for all Section 16 officers.',
  nextChange: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // Closes in 15 days
};

const blackoutPeriods: BlackoutPeriod[] = [
  {
    id: '1',
    name: 'Q1 2025 Earnings Blackout',
    reason: 'Quarterly earnings announcement',
    startDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    affectsAll: true,
  },
  {
    id: '2',
    name: 'Business Combination Blackout',
    reason: 'Material non-public information regarding pending transaction',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    affectsAll: false,
    affectedPersons: ['John Smith', 'Robert Kim', 'Sarah Chen'],
  },
  {
    id: '3',
    name: 'Q4 2024 Earnings Blackout',
    reason: 'Quarterly earnings announcement',
    startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    affectsAll: true,
  },
];

const insiders: Insider[] = [
  { id: '1', name: 'John Smith', title: 'CEO', relationship: 'Officer', section16: true, email: 'john.smith@spacos.com', lastCertification: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
  { id: '2', name: 'Robert Kim', title: 'CFO', relationship: 'Officer', section16: true, email: 'robert.kim@spacos.com', lastCertification: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
  { id: '3', name: 'Sarah Chen', title: 'Lead Independent Director', relationship: 'Director', section16: true, email: 'sarah.chen@spacos.com', lastCertification: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) },
  { id: '4', name: 'Michael Torres', title: 'Director', relationship: 'Director', section16: true, email: 'michael.torres@spacos.com', lastCertification: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
  { id: '5', name: 'Jennifer Walsh', title: 'Director', relationship: 'Director', section16: true, email: 'jennifer.walsh@spacos.com', lastCertification: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) },
  { id: '6', name: 'David Park', title: 'Director', relationship: 'Director', section16: true, email: 'david.park@spacos.com', lastCertification: null },
  { id: '7', name: 'Alpha Partners LP', title: 'Sponsor Entity', relationship: '10% Owner', section16: true, email: 'compliance@alphapartners.com', lastCertification: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
];

const preClearanceRequests: PreClearanceRequest[] = [
  {
    id: '1',
    insiderId: '3',
    insiderName: 'Sarah Chen',
    requestDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    transactionType: 'Sell',
    securityType: 'Common Stock',
    shares: 5000,
    estimatedPrice: 10.25,
    reason: 'Diversification and personal liquidity needs',
    status: 'Pending',
  },
  {
    id: '2',
    insiderId: '4',
    insiderName: 'Michael Torres',
    requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    transactionType: 'Buy',
    securityType: 'Common Stock',
    shares: 10000,
    estimatedPrice: 10.15,
    reason: 'Open market purchase demonstrating confidence in company',
    status: 'Approved',
    approvedBy: 'Legal Counsel',
    approvalDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    expirationDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    insiderId: '1',
    insiderName: 'John Smith',
    requestDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    transactionType: 'Exercise',
    securityType: 'Option',
    shares: 50000,
    estimatedPrice: 5.00,
    reason: 'Stock option exercise per compensation agreement',
    status: 'Executed',
    approvedBy: 'Legal Counsel',
    approvalDate: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    executedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    executedShares: 50000,
    executedPrice: 5.00,
  },
  {
    id: '4',
    insiderId: '2',
    insiderName: 'Robert Kim',
    requestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    transactionType: 'Sell',
    securityType: 'Common Stock',
    shares: 25000,
    estimatedPrice: 10.50,
    reason: 'Tax planning purposes',
    status: 'Denied',
    notes: 'Denied due to proximity to Q4 earnings announcement',
  },
];

const form4Filings: Form4Filing[] = [
  {
    id: '1',
    insiderId: '1',
    insiderName: 'John Smith',
    transactionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    filingDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    transactionType: 'Option Exercise',
    securityType: 'Common Stock',
    shares: 50000,
    price: 5.00,
    sharesOwned: 1500000,
    status: 'Filed',
    accessionNumber: '0001234567-25-000123',
  },
  {
    id: '2',
    insiderId: '4',
    insiderName: 'Michael Torres',
    transactionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    filingDate: null,
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    transactionType: 'Open Market Purchase',
    securityType: 'Common Stock',
    shares: 10000,
    price: 10.15,
    sharesOwned: 75000,
    status: 'Pending',
  },
  {
    id: '3',
    insiderId: '3',
    insiderName: 'Sarah Chen',
    transactionDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    filingDate: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
    dueDate: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000),
    transactionType: 'Gift',
    securityType: 'Common Stock',
    shares: 2500,
    price: 0,
    sharesOwned: 50000,
    status: 'Filed',
    accessionNumber: '0001234567-25-000098',
  },
];

function getPreClearanceStatusBadge(status: PreClearanceStatus) {
  const variants: Record<PreClearanceStatus, 'warning' | 'success' | 'danger' | 'secondary' | 'primary'> = {
    Pending: 'warning',
    Approved: 'success',
    Denied: 'danger',
    Expired: 'secondary',
    Executed: 'primary',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

function getForm4StatusBadge(status: Form4Status) {
  const variants: Record<Form4Status, 'warning' | 'success' | 'danger'> = {
    Pending: 'warning',
    Filed: 'success',
    Late: 'danger',
  };
  return <Badge variant={variants[status]}>{status}</Badge>;
}

export function InsiderTradingWindow() {
  const [activeTab, setActiveTab] = useState<'window' | 'preclearance' | 'roster' | 'form4'>('window');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const activeBlackouts = blackoutPeriods.filter(
    (b) => b.startDate <= new Date() && b.endDate >= new Date()
  );

  const upcomingBlackouts = blackoutPeriods.filter(
    (b) => b.startDate > new Date()
  ).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  const pendingRequests = preClearanceRequests.filter((r) => r.status === 'Pending');
  const pendingFilings = form4Filings.filter((f) => f.status === 'Pending');

  return (
    <div className="space-y-6">
      {/* Trading Window Status Banner */}
      <Card className={cn(currentWindow.status === 'Open' ? 'border-success-200 bg-success-50' : 'border-danger-200 bg-danger-50')}>
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full',
                currentWindow.status === 'Open' ? 'bg-success-100' : 'bg-danger-100'
              )}>
                {currentWindow.status === 'Open' ? (
                  <Unlock className="h-8 w-8 text-success-600" />
                ) : (
                  <Lock className="h-8 w-8 text-danger-600" />
                )}
              </div>
              <div>
                <h2 className={cn(
                  'text-xl font-bold',
                  currentWindow.status === 'Open' ? 'text-success-700' : 'text-danger-700'
                )}>
                  Trading Window: {currentWindow.status}
                </h2>
                <p className={cn(
                  'mt-1 text-sm',
                  currentWindow.status === 'Open' ? 'text-success-600' : 'text-danger-600'
                )}>
                  {currentWindow.message}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">
                {currentWindow.status === 'Open' ? 'Window closes in' : 'Window opens in'}
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {daysUntil(currentWindow.nextChange)} days
              </p>
              <p className="text-xs text-slate-500">{formatDate(currentWindow.nextChange)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {([
            { key: 'window', label: 'Trading Windows', count: activeBlackouts.length },
            { key: 'preclearance', label: 'Pre-Clearance', count: pendingRequests.length },
            { key: 'roster', label: 'Insider Roster', count: insiders.length },
            { key: 'form4', label: 'Form 4 Filings', count: pendingFilings.length },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative border-b-2 pb-4 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={cn(
                  'ml-2 rounded-full px-2 py-0.5 text-xs',
                  activeTab === tab.key ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'window' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Blackouts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-danger-500" />
                Active Blackout Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeBlackouts.length === 0 ? (
                <div className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-success-300" />
                  <p className="mt-2 text-sm text-slate-500">No active blackout periods</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBlackouts.map((blackout) => (
                    <div key={blackout.id} className="rounded-lg border border-danger-200 bg-danger-50 p-4">
                      <h4 className="font-medium text-danger-700">{blackout.name}</h4>
                      <p className="mt-1 text-sm text-danger-600">{blackout.reason}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-danger-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(blackout.startDate)} - {formatDate(blackout.endDate)}
                        </span>
                        <Badge variant="danger" size="sm">
                          {daysUntil(blackout.endDate)} days remaining
                        </Badge>
                      </div>
                      {!blackout.affectsAll && blackout.affectedPersons && (
                        <div className="mt-3 border-t border-danger-200 pt-3">
                          <p className="text-xs font-medium text-danger-700">Affected Persons:</p>
                          <p className="text-xs text-danger-600">{blackout.affectedPersons.join(', ')}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Blackouts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-warning-500" />
                Upcoming Blackout Periods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBlackouts.length === 0 ? (
                <div className="py-8 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-2 text-sm text-slate-500">No upcoming blackout periods</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBlackouts.map((blackout) => (
                    <div key={blackout.id} className="rounded-lg border border-warning-200 bg-warning-50 p-4">
                      <h4 className="font-medium text-warning-700">{blackout.name}</h4>
                      <p className="mt-1 text-sm text-warning-600">{blackout.reason}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs text-warning-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(blackout.startDate)} - {formatDate(blackout.endDate)}
                        </span>
                        <Badge variant="warning" size="sm">
                          Starts in {daysUntil(blackout.startDate)} days
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blackout Calendar */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Blackout Period Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline visualization */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4">
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = new Date();
                    month.setMonth(month.getMonth() + i - 2);
                    return (
                      <div key={i} className="flex-shrink-0">
                        <div className="w-24 text-center text-xs font-medium text-slate-500">
                          {formatDate(month, 'MMM yyyy')}
                        </div>
                        <div className="mt-2 h-8 w-24 rounded bg-slate-100" />
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 text-center text-sm text-slate-500">
                  Detailed calendar view coming soon. See blackout periods listed above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'preclearance' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pre-Clearance Requests</CardTitle>
                <Button variant="primary" size="md" onClick={() => setIsRequestModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Request
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell header>Insider</TableCell>
                    <TableCell header>Request Date</TableCell>
                    <TableCell header>Transaction</TableCell>
                    <TableCell header>Shares</TableCell>
                    <TableCell header>Est. Value</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preClearanceRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">{request.insiderName}</p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(request.requestDate)}</TableCell>
                      <TableCell>
                        <span className={cn(
                          'font-medium',
                          request.transactionType === 'Buy' ? 'text-success-600' : 'text-danger-600'
                        )}>
                          {request.transactionType}
                        </span>
                        <span className="ml-1 text-slate-500">- {request.securityType}</span>
                      </TableCell>
                      <TableCell>{request.shares.toLocaleString()}</TableCell>
                      <TableCell>${(request.shares * request.estimatedPrice).toLocaleString()}</TableCell>
                      <TableCell>{getPreClearanceStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon-sm">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'roster' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Insider Roster (Section 16)</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search insiders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 w-64 rounded-md border border-slate-200 bg-white pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                  />
                </div>
                <Button variant="secondary" size="md">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Name</TableCell>
                  <TableCell header>Title</TableCell>
                  <TableCell header>Relationship</TableCell>
                  <TableCell header>Section 16</TableCell>
                  <TableCell header>Last Certification</TableCell>
                  <TableCell header>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {insiders
                  .filter((insider) =>
                    insider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    insider.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((insider) => {
                    const certificationDue = insider.lastCertification
                      ? daysUntil(new Date(insider.lastCertification.getTime() + 365 * 24 * 60 * 60 * 1000))
                      : null;
                    const needsCertification = !insider.lastCertification || (certificationDue !== null && certificationDue <= 30);

                    return (
                      <TableRow key={insider.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                              {insider.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{insider.name}</p>
                              <p className="text-sm text-slate-500">{insider.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{insider.title}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{insider.relationship}</Badge>
                        </TableCell>
                        <TableCell>
                          {insider.section16 ? (
                            <CheckCircle2 className="h-5 w-5 text-success-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-slate-300" />
                          )}
                        </TableCell>
                        <TableCell>
                          {insider.lastCertification ? formatDate(insider.lastCertification) : 'Never'}
                        </TableCell>
                        <TableCell>
                          {needsCertification ? (
                            <Badge variant="warning">Certification Due</Badge>
                          ) : (
                            <Badge variant="success">Current</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'form4' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Form 4 Filing Tracker</CardTitle>
              <Button variant="secondary" size="md">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell header>Insider</TableCell>
                  <TableCell header>Transaction Date</TableCell>
                  <TableCell header>Type</TableCell>
                  <TableCell header>Shares</TableCell>
                  <TableCell header>Price</TableCell>
                  <TableCell header>Due Date</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Accession #</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {form4Filings.map((filing) => {
                  const daysToDue = daysUntil(filing.dueDate);
                  const isUrgent = filing.status === 'Pending' && daysToDue !== null && daysToDue <= 1;

                  return (
                    <TableRow key={filing.id}>
                      <TableCell>
                        <p className="font-medium text-slate-900">{filing.insiderName}</p>
                      </TableCell>
                      <TableCell>{formatDate(filing.transactionDate)}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-900">{filing.transactionType}</p>
                          <p className="text-xs text-slate-500">{filing.securityType}</p>
                        </div>
                      </TableCell>
                      <TableCell>{filing.shares.toLocaleString()}</TableCell>
                      <TableCell>${filing.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className={cn(isUrgent && 'text-danger-600 font-medium')}>
                          {formatDate(filing.dueDate)}
                          {isUrgent && (
                            <span className="ml-1 text-xs">({daysToDue === 0 ? 'Today!' : `${daysToDue}d`})</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getForm4StatusBadge(filing.status)}</TableCell>
                      <TableCell>
                        {filing.accessionNumber ? (
                          <a
                            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&filenum=${filing.accessionNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:underline"
                          >
                            {filing.accessionNumber}
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pre-Clearance Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="New Pre-Clearance Request"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Insider"
            options={insiders.map((i) => ({ value: i.id, label: `${i.name} - ${i.title}` }))}
            placeholder="Select insider"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Transaction Type"
              options={[
                { value: 'Buy', label: 'Buy' },
                { value: 'Sell', label: 'Sell' },
                { value: 'Gift', label: 'Gift' },
                { value: 'Exercise', label: 'Exercise' },
              ]}
            />
            <Select
              label="Security Type"
              options={[
                { value: 'Common Stock', label: 'Common Stock' },
                { value: 'Warrant', label: 'Warrant' },
                { value: 'Option', label: 'Option' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Number of Shares" type="number" placeholder="0" />
            <Input label="Estimated Price" type="number" placeholder="$0.00" />
          </div>
          <Textarea label="Reason for Transaction" placeholder="Describe the purpose of this transaction..." />
        </div>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsRequestModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary">Submit Request</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
