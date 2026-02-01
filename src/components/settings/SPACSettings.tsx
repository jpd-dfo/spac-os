'use client';

import { useState } from 'react';
import {
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Users,
  FileText,
  Edit2,
  Save,
  X,
  AlertTriangle,
  Check,
  TrendingUp,
  Briefcase,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface SPACData {
  name: string;
  ticker: string;
  ipoDate: string;
  liquidationDeadline: string;
  trustAccountSize: string;
  perShareValue: string;
  extensionMonths: number;
  maxExtensions: number;
  extensionsUsed: number;
  extensionCost: string;
  status: 'active' | 'searching' | 'loi' | 'definitive' | 'closed' | 'liquidated';
}

interface SponsorData {
  name: string;
  managingPartner: string;
  email: string;
  phone: string;
  address: string;
  foundersShares: string;
  warrantCoverage: string;
  promoteStructure: string;
}

export function SPACSettings() {
  const [isEditingSPAC, setIsEditingSPAC] = useState(false);
  const [isEditingSponsor, setIsEditingSponsor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [spacData, setSpacData] = useState<SPACData>({
    name: 'Apex Acquisition Corp',
    ticker: 'APAC',
    ipoDate: '2024-01-15',
    liquidationDeadline: '2026-01-15',
    trustAccountSize: '250,000,000',
    perShareValue: '10.25',
    extensionMonths: 3,
    maxExtensions: 2,
    extensionsUsed: 0,
    extensionCost: '0.025',
    status: 'searching',
  });

  const [sponsorData, setSponsorData] = useState<SponsorData>({
    name: 'Apex Capital Partners',
    managingPartner: 'John Smith',
    email: 'john.smith@apexcapital.com',
    phone: '+1 (212) 555-0100',
    address: '350 Park Avenue, New York, NY 10022',
    foundersShares: '6,250,000',
    warrantCoverage: '12,500,000',
    promoteStructure: '20% of post-business combination shares',
  });

  const validateSPACData = () => {
    const newErrors: Record<string, string> = {};

    if (!spacData.name.trim()) {
      newErrors.name = 'SPAC name is required';
    }
    if (!spacData.ticker.trim()) {
      newErrors.ticker = 'Ticker symbol is required';
    } else if (!/^[A-Z]{2,5}$/.test(spacData.ticker)) {
      newErrors.ticker = 'Invalid ticker format (2-5 uppercase letters)';
    }
    if (!spacData.ipoDate) {
      newErrors.ipoDate = 'IPO date is required';
    }
    if (!spacData.liquidationDeadline) {
      newErrors.liquidationDeadline = 'Liquidation deadline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSPAC = async () => {
    if (!validateSPACData()) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditingSPAC(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveSponsor = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditingSponsor(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const calculateDaysRemaining = () => {
    const deadline = new Date(spacData.liquidationDeadline);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = calculateDaysRemaining();

  const getStatusBadge = (status: SPACData['status']) => {
    const statusConfig = {
      active: { variant: 'success' as const, label: 'Active' },
      searching: { variant: 'primary' as const, label: 'Target Search' },
      loi: { variant: 'warning' as const, label: 'LOI Signed' },
      definitive: { variant: 'warning' as const, label: 'Definitive Agreement' },
      closed: { variant: 'success' as const, label: 'Closed' },
      liquidated: { variant: 'danger' as const, label: 'Liquidated' },
    };
    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const statusOptions = [
    { value: 'searching', label: 'Target Search' },
    { value: 'loi', label: 'LOI Signed' },
    { value: 'definitive', label: 'Definitive Agreement' },
    { value: 'closed', label: 'Closed' },
    { value: 'liquidated', label: 'Liquidated' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-4 text-success-700">
          <Check className="h-5 w-5" />
          <span>Settings updated successfully</span>
        </div>
      )}

      {/* SPAC Overview Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <CardTitle>{spacData.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{spacData.ticker}</Badge>
                {getStatusBadge(spacData.status)}
              </div>
            </div>
          </div>
          {!isEditingSPAC && (
            <Button variant="secondary" onClick={() => setIsEditingSPAC(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit SPAC Details
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Key Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <DollarSign className="h-4 w-4" />
                Trust Account
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                ${spacData.trustAccountSize}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <TrendingUp className="h-4 w-4" />
                Per Share Value
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                ${spacData.perShareValue}
              </p>
            </div>
            <div
              className={cn(
                'rounded-lg border p-4',
                daysRemaining < 90
                  ? 'border-danger-200 bg-danger-50'
                  : daysRemaining < 180
                  ? 'border-warning-200 bg-warning-50'
                  : 'border-slate-200'
              )}
            >
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                Days to Deadline
              </div>
              <p
                className={cn(
                  'mt-1 text-2xl font-semibold',
                  daysRemaining < 90
                    ? 'text-danger-600'
                    : daysRemaining < 180
                    ? 'text-warning-600'
                    : 'text-slate-900'
                )}
              >
                {daysRemaining}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Calendar className="h-4 w-4" />
                Extensions
              </div>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {spacData.extensionsUsed}/{spacData.maxExtensions}
              </p>
            </div>
          </div>

          {/* SPAC Details Form */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="SPAC Name"
                value={spacData.name}
                onChange={(e) => setSpacData({ ...spacData, name: e.target.value })}
                disabled={!isEditingSPAC}
                error={errors.name}
              />
              <Input
                label="Ticker Symbol"
                value={spacData.ticker}
                onChange={(e) =>
                  setSpacData({ ...spacData, ticker: e.target.value.toUpperCase() })
                }
                disabled={!isEditingSPAC}
                error={errors.ticker}
              />
              <Input
                label="IPO Date"
                type="date"
                value={spacData.ipoDate}
                onChange={(e) => setSpacData({ ...spacData, ipoDate: e.target.value })}
                disabled={!isEditingSPAC}
                error={errors.ipoDate}
              />
              <Input
                label="Liquidation Deadline"
                type="date"
                value={spacData.liquidationDeadline}
                onChange={(e) =>
                  setSpacData({ ...spacData, liquidationDeadline: e.target.value })
                }
                disabled={!isEditingSPAC}
                error={errors.liquidationDeadline}
              />
              {isEditingSPAC && (
                <Select
                  label="Status"
                  options={statusOptions}
                  value={spacData.status}
                  onChange={(e) =>
                    setSpacData({ ...spacData, status: e.target.value as SPACData['status'] })
                  }
                />
              )}
            </div>

            {isEditingSPAC && (
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditingSPAC(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveSPAC} isLoading={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trust Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Trust Account Settings</CardTitle>
          <CardDescription>Configure trust account parameters and redemption settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Trust Account Size
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={spacData.trustAccountSize}
                  onChange={(e) =>
                    setSpacData({ ...spacData, trustAccountSize: e.target.value })
                  }
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm"
                  disabled
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Per Share Redemption Value
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={spacData.perShareValue}
                  onChange={(e) => setSpacData({ ...spacData, perShareValue: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm"
                  disabled
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-slate-900">Trust Account Update</p>
                <p className="mt-1 text-sm text-slate-600">
                  Trust account values are automatically synced from your trustee bank. To update
                  these values manually, contact your administrator or update through the financial
                  module.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extension Parameters */}
      <Card>
        <CardHeader>
          <CardTitle>Extension Parameters</CardTitle>
          <CardDescription>Configure extension options for your SPAC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Extension Period (Months)
              </label>
              <Select
                options={[
                  { value: '1', label: '1 Month' },
                  { value: '2', label: '2 Months' },
                  { value: '3', label: '3 Months' },
                  { value: '6', label: '6 Months' },
                  { value: '12', label: '12 Months' },
                ]}
                value={spacData.extensionMonths.toString()}
                onChange={(e) =>
                  setSpacData({ ...spacData, extensionMonths: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Maximum Extensions
              </label>
              <Select
                options={[
                  { value: '1', label: '1 Extension' },
                  { value: '2', label: '2 Extensions' },
                  { value: '3', label: '3 Extensions' },
                  { value: '4', label: '4 Extensions' },
                ]}
                value={spacData.maxExtensions.toString()}
                onChange={(e) =>
                  setSpacData({ ...spacData, maxExtensions: parseInt(e.target.value) })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Extension Cost ($ per share)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={spacData.extensionCost}
                  onChange={(e) => setSpacData({ ...spacData, extensionCost: e.target.value })}
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Extension History</h4>
            {spacData.extensionsUsed > 0 ? (
              <div className="space-y-2">
                {/* Would map through actual extension history */}
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm">Extension 1</span>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No extensions have been used yet.</p>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <Button variant="primary">Save Extension Settings</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sponsor Details */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Sponsor Details</CardTitle>
            <CardDescription>Information about the SPAC sponsor entity</CardDescription>
          </div>
          {!isEditingSponsor && (
            <Button variant="secondary" onClick={() => setIsEditingSponsor(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Sponsor
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Sponsor Entity Info */}
            <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white border border-slate-200">
                <Briefcase className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{sponsorData.name}</p>
                <p className="text-sm text-slate-500">Managing Partner: {sponsorData.managingPartner}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Sponsor Entity Name"
                value={sponsorData.name}
                onChange={(e) => setSponsorData({ ...sponsorData, name: e.target.value })}
                disabled={!isEditingSponsor}
              />
              <Input
                label="Managing Partner"
                value={sponsorData.managingPartner}
                onChange={(e) =>
                  setSponsorData({ ...sponsorData, managingPartner: e.target.value })
                }
                disabled={!isEditingSponsor}
              />
              <Input
                label="Email"
                type="email"
                value={sponsorData.email}
                onChange={(e) => setSponsorData({ ...sponsorData, email: e.target.value })}
                disabled={!isEditingSponsor}
              />
              <Input
                label="Phone"
                type="tel"
                value={sponsorData.phone}
                onChange={(e) => setSponsorData({ ...sponsorData, phone: e.target.value })}
                disabled={!isEditingSponsor}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  value={sponsorData.address}
                  onChange={(e) => setSponsorData({ ...sponsorData, address: e.target.value })}
                  disabled={!isEditingSponsor}
                />
              </div>
            </div>

            {/* Sponsor Economics */}
            <div className="border-t border-slate-200 pt-6">
              <h4 className="text-sm font-medium text-slate-900 mb-4">Sponsor Economics</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Founder Shares</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {sponsorData.foundersShares}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Private Placement Warrants</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {sponsorData.warrantCoverage}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Promote Structure</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">20%</p>
                  <p className="text-xs text-slate-400">{sponsorData.promoteStructure}</p>
                </div>
              </div>
            </div>

            {isEditingSponsor && (
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button variant="secondary" onClick={() => setIsEditingSponsor(false)}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSaveSponsor} isLoading={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Sponsor Details
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Dates */}
      <Card>
        <CardHeader>
          <CardTitle>Key Dates</CardTitle>
          <CardDescription>Important milestones and deadlines for your SPAC</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                label: 'IPO Date',
                date: spacData.ipoDate,
                status: 'completed',
              },
              {
                label: 'S-1 Effective Date',
                date: '2024-01-10',
                status: 'completed',
              },
              {
                label: 'Initial Filing Deadline',
                date: '2024-04-15',
                status: 'completed',
              },
              {
                label: 'Business Combination Deadline',
                date: spacData.liquidationDeadline,
                status: daysRemaining < 0 ? 'overdue' : 'upcoming',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">
                      {new Date(item.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                {item.status === 'completed' ? (
                  <Badge variant="success">Completed</Badge>
                ) : item.status === 'overdue' ? (
                  <Badge variant="danger">Overdue</Badge>
                ) : (
                  <Badge variant="warning">Upcoming</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
