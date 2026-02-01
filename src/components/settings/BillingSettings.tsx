'use client';

import { useState } from 'react';
import {
  CreditCard,
  Check,
  Download,
  Plus,
  Trash2,
  ChevronRight,
  AlertTriangle,
  Zap,
  Users,
  HardDrive,
  FileText,
  BarChart3,
  Star,
  ArrowUpRight,
  Clock,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    users: number | 'unlimited';
    storage: string;
    deals: number | 'unlimited';
    integrations: number | 'unlimited';
  };
  popular?: boolean;
  current?: boolean;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}

interface UsageMetric {
  name: string;
  current: number;
  limit: number | 'unlimited';
  unit: string;
  icon: React.ElementType;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    interval: 'month',
    features: [
      'Up to 5 team members',
      '10 GB storage',
      '10 active deals',
      'Basic integrations',
      'Email support',
    ],
    limits: {
      users: 5,
      storage: '10 GB',
      deals: 10,
      integrations: 3,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    interval: 'month',
    features: [
      'Up to 25 team members',
      '100 GB storage',
      'Unlimited active deals',
      'Advanced integrations',
      'Priority support',
      'Advanced analytics',
      'Custom workflows',
    ],
    limits: {
      users: 25,
      storage: '100 GB',
      deals: 'unlimited',
      integrations: 10,
    },
    popular: true,
    current: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 799,
    interval: 'month',
    features: [
      'Unlimited team members',
      '1 TB storage',
      'Unlimited active deals',
      'All integrations',
      'Dedicated support',
      'Custom analytics',
      'API access',
      'SSO/SAML',
      'Audit logs',
    ],
    limits: {
      users: 'unlimited',
      storage: '1 TB',
      deals: 'unlimited',
      integrations: 'unlimited',
    },
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: '1',
    type: 'card',
    brand: 'Visa',
    last4: '4242',
    expiryMonth: 12,
    expiryYear: 2026,
    isDefault: true,
  },
  {
    id: '2',
    type: 'card',
    brand: 'Mastercard',
    last4: '8888',
    expiryMonth: 6,
    expiryYear: 2025,
    isDefault: false,
  },
];

const mockInvoices: Invoice[] = [
  {
    id: '1',
    date: '2024-04-01',
    amount: 299,
    status: 'paid',
    downloadUrl: '/invoices/inv-2024-04.pdf',
  },
  {
    id: '2',
    date: '2024-03-01',
    amount: 299,
    status: 'paid',
    downloadUrl: '/invoices/inv-2024-03.pdf',
  },
  {
    id: '3',
    date: '2024-02-01',
    amount: 299,
    status: 'paid',
    downloadUrl: '/invoices/inv-2024-02.pdf',
  },
  {
    id: '4',
    date: '2024-01-01',
    amount: 99,
    status: 'paid',
    downloadUrl: '/invoices/inv-2024-01.pdf',
  },
];

const usageMetrics: UsageMetric[] = [
  { name: 'Team Members', current: 12, limit: 25, unit: 'users', icon: Users },
  { name: 'Storage Used', current: 45, limit: 100, unit: 'GB', icon: HardDrive },
  { name: 'Active Deals', current: 23, limit: 'unlimited', unit: 'deals', icon: FileText },
  { name: 'API Calls', current: 15420, limit: 50000, unit: 'calls/mo', icon: BarChart3 },
];

export function BillingSettings() {
  const [paymentMethods, setPaymentMethods] = useState(mockPaymentMethods);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const currentPlan = plans.find((p) => p.current);

  const handleSetDefault = (methodId: string) => {
    setPaymentMethods(
      paymentMethods.map((m) => ({
        ...m,
        isDefault: m.id === methodId,
      }))
    );
  };

  const handleRemovePaymentMethod = (methodId: string) => {
    setPaymentMethods(paymentMethods.filter((m) => m.id !== methodId));
  };

  const getUsagePercentage = (current: number, limit: number | 'unlimited') => {
    if (limit === 'unlimited') return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-danger-500';
    if (percentage >= 75) return 'bg-warning-500';
    return 'bg-primary-500';
  };

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            <Button variant="primary" onClick={() => setIsUpgradeModalOpen(true)}>
              <Zap className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary-100">
              <Star className="h-8 w-8 text-primary-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-slate-900">
                  {currentPlan?.name} Plan
                </h3>
                <Badge variant="primary">Current</Badge>
              </div>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                ${currentPlan?.price}
                <span className="text-sm font-normal text-slate-500">/month</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Your next billing date is <strong>May 1, 2024</strong>
              </p>
            </div>
          </div>

          {/* Quick Feature List */}
          <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Team Members', value: `${currentPlan?.limits.users}`, icon: Users },
              { label: 'Storage', value: currentPlan?.limits.storage, icon: HardDrive },
              {
                label: 'Active Deals',
                value:
                  currentPlan?.limits.deals === 'unlimited'
                    ? 'Unlimited'
                    : currentPlan?.limits.deals,
                icon: FileText,
              },
              {
                label: 'Integrations',
                value: currentPlan?.limits.integrations,
                icon: Zap,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <Icon className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="font-medium text-slate-900">{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Metrics</CardTitle>
          <CardDescription>Monitor your resource usage this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {usageMetrics.map((metric) => {
              const Icon = metric.icon;
              const percentage = getUsagePercentage(metric.current, metric.limit);
              return (
                <div key={metric.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{metric.name}</span>
                    </div>
                    <span className="text-sm text-slate-500">
                      {metric.current.toLocaleString()}{' '}
                      {metric.limit === 'unlimited' ? (
                        <span className="text-slate-400">/ Unlimited</span>
                      ) : (
                        <span className="text-slate-400">
                          / {metric.limit.toLocaleString()} {metric.unit}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    {metric.limit !== 'unlimited' && (
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          getUsageColor(percentage)
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    )}
                  </div>
                  {percentage >= 90 && metric.limit !== 'unlimited' && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-danger-600">
                      <AlertTriangle className="h-3 w-3" />
                      Approaching limit
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage your payment methods</CardDescription>
          </div>
          <Button variant="secondary" onClick={() => setIsAddPaymentModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment Method
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                    <CreditCard className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {method.brand} ending in {method.last4}
                      </p>
                      {method.isDefault && (
                        <Badge variant="primary" size="sm">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      Expires {method.expiryMonth}/{method.expiryYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                    >
                      Set as Default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemovePaymentMethod(method.id)}
                    disabled={method.isDefault}
                  >
                    <Trash2 className="h-4 w-4 text-danger-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>View and download past invoices</CardDescription>
          </div>
          <Button variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-slate-200">
            {mockInvoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                    <FileText className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      Invoice for{' '}
                      {new Date(invoice.date).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(invoice.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-medium text-slate-900">${invoice.amount}</p>
                    <Badge
                      variant={
                        invoice.status === 'paid'
                          ? 'success'
                          : invoice.status === 'pending'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Contact</CardTitle>
          <CardDescription>Update billing contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Billing Email
              </label>
              <input
                type="email"
                defaultValue="billing@company.com"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                defaultValue="Apex Acquisition Corp"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Billing Address
              </label>
              <input
                type="text"
                defaultValue="350 Park Avenue, New York, NY 10022"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tax ID (Optional)
              </label>
              <input
                type="text"
                placeholder="Enter tax ID"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button variant="primary">Save Billing Info</Button>
          </div>
        </CardContent>
      </Card>

      {/* Cancel Subscription */}
      <Card className="border-danger-200">
        <CardHeader>
          <CardTitle className="text-danger-600">Cancel Subscription</CardTitle>
          <CardDescription>
            Cancel your subscription and downgrade to the free tier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg bg-danger-50 border border-danger-200 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
              <div>
                <p className="font-medium text-slate-900">Cancel Subscription</p>
                <p className="text-sm text-slate-500">
                  Your subscription will remain active until the end of the billing period
                </p>
              </div>
            </div>
            <Button variant="danger">Cancel Subscription</Button>
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Modal */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          setSelectedPlan(null);
        }}
        title="Upgrade Your Plan"
        description="Choose a plan that fits your needs"
        size="full"
      >
        <div className="space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={cn(
                'text-sm',
                billingInterval === 'month' ? 'font-medium text-slate-900' : 'text-slate-500'
              )}
            >
              Monthly
            </span>
            <button
              onClick={() =>
                setBillingInterval(billingInterval === 'month' ? 'year' : 'month')
              }
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                billingInterval === 'year' ? 'bg-primary-600' : 'bg-slate-200'
              )}
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                  billingInterval === 'year' && 'translate-x-5'
                )}
              />
            </button>
            <span
              className={cn(
                'text-sm',
                billingInterval === 'year' ? 'font-medium text-slate-900' : 'text-slate-500'
              )}
            >
              Annual <Badge variant="success" size="sm">Save 20%</Badge>
            </span>
          </div>

          {/* Plans */}
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => {
              const price =
                billingInterval === 'year' ? Math.round(plan.price * 0.8 * 12) : plan.price;
              return (
                <div
                  key={plan.id}
                  className={cn(
                    'relative rounded-lg border-2 p-6 transition-colors cursor-pointer',
                    selectedPlan?.id === plan.id
                      ? 'border-primary-500 bg-primary-50'
                      : plan.popular
                      ? 'border-primary-200'
                      : 'border-slate-200 hover:border-slate-300'
                  )}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {plan.popular && (
                    <Badge
                      variant="primary"
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                    >
                      Most Popular
                    </Badge>
                  )}
                  {plan.current && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-2.5 right-4"
                    >
                      Current
                    </Badge>
                  )}
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                    <div className="mt-4">
                      <span className="text-3xl font-bold text-slate-900">${price}</span>
                      <span className="text-slate-500">
                        /{billingInterval === 'year' ? 'year' : 'month'}
                      </span>
                    </div>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 shrink-0 text-success-500" />
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <ModalFooter className="px-0 pb-0">
            <Button variant="secondary" onClick={() => setIsUpgradeModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedPlan || selectedPlan.current}
              onClick={() => {
                // Handle upgrade
                setIsUpgradeModalOpen(false);
              }}
            >
              {selectedPlan?.current
                ? 'Current Plan'
                : selectedPlan
                ? `Upgrade to ${selectedPlan.name}`
                : 'Select a Plan'}
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Add Payment Method Modal */}
      <Modal
        isOpen={isAddPaymentModalOpen}
        onClose={() => setIsAddPaymentModalOpen(false)}
        title="Add Payment Method"
        description="Add a new credit or debit card"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Card Number
            </label>
            <input
              type="text"
              placeholder="1234 5678 9012 3456"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Expiry Date
              </label>
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">CVC</label>
              <input
                type="text"
                placeholder="123"
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Name on Card
            </label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-slate-600">Set as default payment method</span>
          </label>
          <ModalFooter className="px-0 pb-0">
            <Button variant="secondary" onClick={() => setIsAddPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsAddPaymentModalOpen(false)}>
              Add Card
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
