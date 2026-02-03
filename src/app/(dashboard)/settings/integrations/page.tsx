'use client';

import { useState } from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  Mail,
  Calendar,
  MessageSquare,
  FolderOpen,
  Check,
  ExternalLink,
  Settings,
  RefreshCw,
  Shield,
  Zap,
  Clock,
  Search,
  Grid,
  List,
  Database,
  FileText,
  Cloud,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal, ModalHeader, ModalTitle, ModalBody, ModalFooter } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'email' | 'calendar' | 'communication' | 'storage' | 'data';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  account?: string;
  features: string[];
}

const integrations: Integration[] = [
  {
    id: '1',
    name: 'Gmail',
    description: 'Sync emails and contacts with Google Workspace',
    icon: Mail,
    category: 'email',
    status: 'connected',
    lastSync: '5 minutes ago',
    account: 'john.doe@company.com',
    features: ['Email sync', 'Contact sync', 'Auto-archive'],
  },
  {
    id: '2',
    name: 'Outlook',
    description: 'Connect with Microsoft 365 email and contacts',
    icon: Mail,
    category: 'email',
    status: 'disconnected',
    features: ['Email sync', 'Contact sync', 'Calendar sync'],
  },
  {
    id: '3',
    name: 'Google Calendar',
    description: 'Sync deadlines and meetings with Google Calendar',
    icon: Calendar,
    category: 'calendar',
    status: 'connected',
    lastSync: '10 minutes ago',
    account: 'john.doe@company.com',
    features: ['Meeting sync', 'Deadline reminders', 'Two-way sync'],
  },
  {
    id: '4',
    name: 'Outlook Calendar',
    description: 'Sync deadlines and meetings with Outlook Calendar',
    icon: Calendar,
    category: 'calendar',
    status: 'disconnected',
    features: ['Meeting sync', 'Deadline reminders', 'Two-way sync'],
  },
  {
    id: '5',
    name: 'Slack',
    description: 'Receive notifications in Slack channels',
    icon: MessageSquare,
    category: 'communication',
    status: 'connected',
    lastSync: 'Just now',
    account: 'SPAC OS Workspace',
    features: ['Notifications', 'Channel integration', 'Slash commands'],
  },
  {
    id: '6',
    name: 'Microsoft Teams',
    description: 'Receive notifications in Teams channels',
    icon: MessageSquare,
    category: 'communication',
    status: 'disconnected',
    features: ['Notifications', 'Channel integration', 'Tab app'],
  },
  {
    id: '7',
    name: 'Google Drive',
    description: 'Store and sync documents with Google Drive',
    icon: FolderOpen,
    category: 'storage',
    status: 'connected',
    lastSync: '1 hour ago',
    account: 'john.doe@company.com',
    features: ['Document sync', 'Auto-backup', 'Folder mapping'],
  },
  {
    id: '8',
    name: 'Dropbox',
    description: 'Store and sync documents with Dropbox',
    icon: FolderOpen,
    category: 'storage',
    status: 'disconnected',
    features: ['Document sync', 'Version history', 'Shared folders'],
  },
  {
    id: '9',
    name: 'Box',
    description: 'Enterprise document storage and sharing',
    icon: FolderOpen,
    category: 'storage',
    status: 'error',
    account: 'SPAC Team',
    features: ['Document storage', 'Compliance', 'Watermarking'],
  },
  {
    id: '10',
    name: 'SEC EDGAR',
    description: 'Automatic SEC filing retrieval and tracking',
    icon: Database,
    category: 'data',
    status: 'connected',
    lastSync: '30 minutes ago',
    features: ['Filing alerts', 'Auto-import', 'Comment tracking'],
  },
  {
    id: '11',
    name: 'Bloomberg',
    description: 'Market data and financial information',
    icon: Cloud,
    category: 'data',
    status: 'disconnected',
    features: ['Market data', 'Company profiles', 'News alerts'],
  },
  {
    id: '12',
    name: 'DocuSign',
    description: 'Electronic signature integration',
    icon: FileText,
    category: 'data',
    status: 'disconnected',
    features: ['e-Signatures', 'Document tracking', 'Templates'],
  },
];

const categories = [
  { value: 'all', label: 'All Categories', icon: Grid },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'calendar', label: 'Calendar', icon: Calendar },
  { value: 'communication', label: 'Communication', icon: MessageSquare },
  { value: 'storage', label: 'Storage', icon: FolderOpen },
  { value: 'data', label: 'Data & Services', icon: Database },
];

export default function IntegrationsPage() {
  const [integrationsList, setIntegrationsList] = useState(integrations);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const filteredIntegrations = integrationsList.filter((integration) => {
    const matchesCategory =
      selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleConnect = async (integrationId: string) => {
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIntegrationsList(
      integrationsList.map((i) =>
        i.id === integrationId
          ? { ...i, status: 'connected' as const, lastSync: 'Just now', account: 'Connected' }
          : i
      )
    );
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrationsList(
      integrationsList.map((i) =>
        i.id === integrationId
          ? { ...i, status: 'disconnected' as const, account: undefined, lastSync: undefined }
          : i
      )
    );
  };

  const handleSync = async (integrationId: string) => {
    setIsSyncing(integrationId);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIntegrationsList(
      integrationsList.map((i) =>
        i.id === integrationId ? { ...i, lastSync: 'Just now' } : i
      )
    );
    setIsSyncing(null);
  };

  // Statistics
  const stats = {
    total: integrations.length,
    connected: integrationsList.filter((i) => i.status === 'connected').length,
    available: integrationsList.filter((i) => i.status === 'disconnected').length,
    errors: integrationsList.filter((i) => i.status === 'error').length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Settings</span>
          </Link>
        </div>
      </div>

      <div className="page-header">
        <h1 className="page-title">Integrations</h1>
        <p className="page-description">
          Connect SPAC OS with your favorite tools and services
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Zap className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <Check className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.connected}</p>
                <p className="text-sm text-slate-500">Connected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <ExternalLink className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.available}</p>
                <p className="text-sm text-slate-500">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-100">
                <Shield className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.errors}</p>
                <p className="text-sm text-slate-500">Needs Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-md p-1.5',
                viewMode === 'grid' ? 'bg-slate-100' : 'hover:bg-slate-50'
              )}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md p-1.5',
                viewMode === 'list' ? 'bg-slate-100' : 'hover:bg-slate-50'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4 overflow-x-auto">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  selectedCategory === category.value
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                )}
              >
                <Icon className="h-4 w-4" />
                {category.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Integrations Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredIntegrations.map((integration) => {
            const Icon = integration.icon;
            return (
              <Card key={integration.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-lg',
                        integration.status === 'connected'
                          ? 'bg-primary-100'
                          : integration.status === 'error'
                          ? 'bg-danger-100'
                          : 'bg-slate-100'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-6 w-6',
                          integration.status === 'connected'
                            ? 'text-primary-600'
                            : integration.status === 'error'
                            ? 'text-danger-600'
                            : 'text-slate-400'
                        )}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900 truncate">
                          {integration.name}
                        </h3>
                        {integration.status === 'connected' && (
                          <Badge variant="success" size="sm">
                            Connected
                          </Badge>
                        )}
                        {integration.status === 'error' && (
                          <Badge variant="danger" size="sm">
                            Error
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                        {integration.description}
                      </p>
                    </div>
                  </div>

                  {integration.account && (
                    <p className="mt-3 text-xs text-slate-400">{integration.account}</p>
                  )}

                  {integration.lastSync && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      Last synced: {integration.lastSync}
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                    {integration.status === 'connected' ? (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSync(integration.id)}
                          disabled={isSyncing === integration.id}
                        >
                          <RefreshCw
                            className={cn(
                              'mr-1 h-4 w-4',
                              isSyncing === integration.id && 'animate-spin'
                            )}
                          />
                          Sync
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedIntegration(integration);
                            setIsConfigModalOpen(true);
                          }}
                        >
                          <Settings className="mr-1 h-4 w-4" />
                          Configure
                        </Button>
                      </>
                    ) : integration.status === 'error' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleConnect(integration.id)}
                      >
                        Reconnect
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleConnect(integration.id)}
                      >
                        <ExternalLink className="mr-1 h-4 w-4" />
                        Connect
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-200">
              {filteredIntegrations.map((integration) => {
                const Icon = integration.icon;
                return (
                  <div key={integration.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          integration.status === 'connected'
                            ? 'bg-primary-100'
                            : integration.status === 'error'
                            ? 'bg-danger-100'
                            : 'bg-slate-100'
                        )}
                      >
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            integration.status === 'connected'
                              ? 'text-primary-600'
                              : integration.status === 'error'
                              ? 'text-danger-600'
                              : 'text-slate-400'
                          )}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{integration.name}</p>
                          {integration.status === 'connected' && (
                            <Badge variant="success" size="sm">
                              Connected
                            </Badge>
                          )}
                          {integration.status === 'error' && (
                            <Badge variant="danger" size="sm">
                              Error
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{integration.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {integration.lastSync && (
                        <span className="text-xs text-slate-400 mr-4">
                          {integration.lastSync}
                        </span>
                      )}
                      {integration.status === 'connected' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(integration.id)}
                            disabled={isSyncing === integration.id}
                          >
                            <RefreshCw
                              className={cn(
                                'h-4 w-4',
                                isSyncing === integration.id && 'animate-spin'
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedIntegration(integration);
                              setIsConfigModalOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                        >
                          {integration.status === 'error' ? 'Reconnect' : 'Connect'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {filteredIntegrations.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-slate-500">No integrations found</p>
          </CardContent>
        </Card>
      )}

      {/* Integration Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedIntegration(null);
        }}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Configure {selectedIntegration?.name}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {selectedIntegration && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
                <selectedIntegration.icon className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="font-medium text-slate-900">{selectedIntegration.name}</p>
                  <p className="text-sm text-slate-500">{selectedIntegration.account}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Features</h4>
                <div className="space-y-2">
                  {selectedIntegration.features.map((feature, index) => (
                    <label key={index} className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm text-slate-600">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-slate-900 mb-2">Sync Settings</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-slate-600">Auto-sync every 15 minutes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm text-slate-600">Sync on data changes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-slate-600">Include archived items</span>
                  </label>
                </div>
              </div>

              <div className="rounded-lg border border-danger-200 bg-danger-50 p-4">
                <h4 className="text-sm font-medium text-danger-800 mb-1">Danger Zone</h4>
                <p className="text-sm text-danger-700 mb-3">
                  Disconnecting will stop all syncing and remove access to this integration.
                </p>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    handleDisconnect(selectedIntegration.id);
                    setIsConfigModalOpen(false);
                    setSelectedIntegration(null);
                  }}
                >
                  Disconnect Integration
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setIsConfigModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => setIsConfigModalOpen(false)}>
            Save Configuration
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
