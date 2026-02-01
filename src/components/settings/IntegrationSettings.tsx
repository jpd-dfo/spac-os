'use client';

import { useState } from 'react';
import {
  Mail,
  Calendar,
  MessageSquare,
  FolderOpen,
  Key,
  Webhook,
  Check,
  X,
  ExternalLink,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  Clock,
  Shield,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'email' | 'calendar' | 'communication' | 'storage';
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  account?: string;
}

interface APIKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  permissions: string[];
  status: 'active' | 'revoked';
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastTriggered?: string;
  secret: string;
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
  },
  {
    id: '2',
    name: 'Outlook',
    description: 'Connect with Microsoft 365 email and contacts',
    icon: Mail,
    category: 'email',
    status: 'disconnected',
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
  },
  {
    id: '4',
    name: 'Outlook Calendar',
    description: 'Sync deadlines and meetings with Outlook Calendar',
    icon: Calendar,
    category: 'calendar',
    status: 'disconnected',
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
  },
  {
    id: '6',
    name: 'Microsoft Teams',
    description: 'Receive notifications in Teams channels',
    icon: MessageSquare,
    category: 'communication',
    status: 'disconnected',
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
  },
  {
    id: '8',
    name: 'Dropbox',
    description: 'Store and sync documents with Dropbox',
    icon: FolderOpen,
    category: 'storage',
    status: 'disconnected',
  },
  {
    id: '9',
    name: 'Box',
    description: 'Enterprise document storage and sharing',
    icon: FolderOpen,
    category: 'storage',
    status: 'error',
    account: 'SPAC Team',
  },
];

const mockAPIKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'spac_prod_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    createdAt: '2024-01-15',
    lastUsed: '2 hours ago',
    permissions: ['read', 'write'],
    status: 'active',
  },
  {
    id: '2',
    name: 'Development Key',
    key: 'spac_dev_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    createdAt: '2024-02-20',
    lastUsed: '1 day ago',
    permissions: ['read'],
    status: 'active',
  },
  {
    id: '3',
    name: 'Legacy Integration',
    key: 'spac_legacy_xxxxxxxxxxxxxxxxxxxxxxxxx',
    createdAt: '2023-11-10',
    lastUsed: '30 days ago',
    permissions: ['read', 'write', 'delete'],
    status: 'revoked',
  },
];

const mockWebhooks: WebhookConfig[] = [
  {
    id: '1',
    name: 'Deal Updates',
    url: 'https://api.example.com/webhooks/deals',
    events: ['deal.created', 'deal.updated', 'deal.status_changed'],
    status: 'active',
    lastTriggered: '30 minutes ago',
    secret: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
  {
    id: '2',
    name: 'Filing Notifications',
    url: 'https://api.example.com/webhooks/filings',
    events: ['filing.submitted', 'filing.approved', 'filing.rejected'],
    status: 'active',
    lastTriggered: '2 hours ago',
    secret: 'whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  },
];

const webhookEvents = [
  { value: 'deal.created', label: 'Deal Created' },
  { value: 'deal.updated', label: 'Deal Updated' },
  { value: 'deal.status_changed', label: 'Deal Status Changed' },
  { value: 'filing.submitted', label: 'Filing Submitted' },
  { value: 'filing.approved', label: 'Filing Approved' },
  { value: 'filing.rejected', label: 'Filing Rejected' },
  { value: 'document.uploaded', label: 'Document Uploaded' },
  { value: 'task.assigned', label: 'Task Assigned' },
  { value: 'task.completed', label: 'Task Completed' },
];

export function IntegrationSettings() {
  const [activeTab, setActiveTab] = useState<'integrations' | 'api' | 'webhooks'>('integrations');
  const [integrationsList, setIntegrationsList] = useState(integrations);
  const [apiKeys, setApiKeys] = useState(mockAPIKeys);
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [isCreateWebhookModalOpen, setIsCreateWebhookModalOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // New API key form state
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>(['read']);

  // New webhook form state
  const [newWebhookName, setNewWebhookName] = useState('');
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [newWebhookEvents, setNewWebhookEvents] = useState<string[]>([]);

  const filteredIntegrations =
    selectedCategory === 'all'
      ? integrationsList
      : integrationsList.filter((i) => i.category === selectedCategory);

  const handleConnect = async (integrationId: string) => {
    // Simulate OAuth flow
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIntegrationsList(
      integrationsList.map((i) =>
        i.id === integrationId
          ? { ...i, status: 'connected' as const, lastSync: 'Just now' }
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
    // Simulate sync
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIntegrationsList(
      integrationsList.map((i) =>
        i.id === integrationId ? { ...i, lastSync: 'Just now' } : i
      )
    );
  };

  const handleCreateAPIKey = () => {
    const newKey: APIKey = {
      id: Date.now().toString(),
      name: newKeyName,
      key: `spac_api_${Math.random().toString(36).substring(2, 34)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      permissions: newKeyPermissions,
      status: 'active',
    };
    setApiKeys([newKey, ...apiKeys]);
    setIsCreateKeyModalOpen(false);
    setNewKeyName('');
    setNewKeyPermissions(['read']);
  };

  const handleRevokeKey = (keyId: string) => {
    setApiKeys(
      apiKeys.map((k) => (k.id === keyId ? { ...k, status: 'revoked' as const } : k))
    );
  };

  const handleCreateWebhook = () => {
    const newWebhook: WebhookConfig = {
      id: Date.now().toString(),
      name: newWebhookName,
      url: newWebhookUrl,
      events: newWebhookEvents,
      status: 'active',
      secret: `whsec_${Math.random().toString(36).substring(2, 34)}`,
    };
    setWebhooks([newWebhook, ...webhooks]);
    setIsCreateWebhookModalOpen(false);
    setNewWebhookName('');
    setNewWebhookUrl('');
    setNewWebhookEvents([]);
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter((w) => w.id !== webhookId));
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys({ ...showKeys, [keyId]: !showKeys[keyId] });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const tabs = [
    { id: 'integrations', label: 'Integrations', icon: Zap },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  ];

  const categories = [
    { value: 'all', label: 'All Integrations' },
    { value: 'email', label: 'Email' },
    { value: 'calendar', label: 'Calendar' },
    { value: 'communication', label: 'Communication' },
    { value: 'storage', label: 'Document Storage' },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
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

      {/* Integrations Tab */}
      {activeTab === 'integrations' && (
        <>
          {/* Category Filter */}
          <div className="flex items-center gap-3">
            <Select
              options={categories}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-48"
            />
            <span className="text-sm text-slate-500">
              {filteredIntegrations.filter((i) => i.status === 'connected').length} of{' '}
              {filteredIntegrations.length} connected
            </span>
          </div>

          {/* Integrations Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredIntegrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card key={integration.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
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
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-slate-900">{integration.name}</h3>
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
                          <p className="mt-1 text-sm text-slate-500">{integration.description}</p>
                          {integration.account && (
                            <p className="mt-2 text-xs text-slate-400">{integration.account}</p>
                          )}
                          {integration.lastSync && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                              <Clock className="h-3 w-3" />
                              Last synced: {integration.lastSync}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                      {integration.status === 'connected' ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSync(integration.id)}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
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
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-danger-600 hover:text-danger-700"
                            onClick={() => handleDisconnect(integration.id)}
                          >
                            Disconnect
                          </Button>
                        </>
                      ) : integration.status === 'error' ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleConnect(integration.id)}
                          >
                            Reconnect
                          </Button>
                          <span className="text-xs text-danger-600">
                            Authentication expired
                          </span>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleConnect(integration.id)}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">API Keys</h3>
              <p className="text-sm text-slate-500">
                Manage API keys for programmatic access to SPAC OS
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsCreateKeyModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
            <Shield className="h-5 w-5 text-warning-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-800">Keep your API keys secure</p>
              <p className="mt-1 text-sm text-warning-700">
                API keys grant programmatic access to your SPAC OS data. Never share your keys
                publicly or commit them to version control.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {apiKeys.map((key) => (
                  <div key={key.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{key.name}</h4>
                          {key.status === 'revoked' && (
                            <Badge variant="danger" size="sm">
                              Revoked
                            </Badge>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                            {showKeys[key.id]
                              ? key.key
                              : key.key.substring(0, 10) + '...' + key.key.substring(key.key.length - 4)}
                          </code>
                          <button
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {showKeys[key.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(key.key)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <span>Created: {key.createdAt}</span>
                          <span>Last used: {key.lastUsed}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          {key.permissions.map((perm) => (
                            <Badge key={perm} variant="outline" size="sm">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {key.status === 'active' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleRevokeKey(key.id)}
                        >
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Webhooks Tab */}
      {activeTab === 'webhooks' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Webhooks</h3>
              <p className="text-sm text-slate-500">
                Configure webhooks to receive real-time notifications
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsCreateWebhookModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Webhook
            </Button>
          </div>

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Webhook className="h-5 w-5 text-slate-400" />
                        <h4 className="font-medium text-slate-900">{webhook.name}</h4>
                        <Badge
                          variant={webhook.status === 'active' ? 'success' : 'secondary'}
                          size="sm"
                        >
                          {webhook.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <p className="text-sm text-slate-600">{webhook.url}</p>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" size="sm">
                            {event}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        {webhook.lastTriggered && (
                          <span>Last triggered: {webhook.lastTriggered}</span>
                        )}
                        <div className="flex items-center gap-1">
                          <span>Secret:</span>
                          <code className="rounded bg-slate-100 px-1">
                            {webhook.secret.substring(0, 12)}...
                          </code>
                          <button
                            onClick={() => copyToClipboard(webhook.secret)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon-sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                      >
                        <Trash2 className="h-4 w-4 text-danger-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {webhooks.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Webhook className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-slate-500">No webhooks configured</p>
                  <Button
                    variant="primary"
                    className="mt-4"
                    onClick={() => setIsCreateWebhookModalOpen(true)}
                  >
                    Create your first webhook
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Integration Config Modal */}
      <Modal
        isOpen={isConfigModalOpen}
        onClose={() => {
          setIsConfigModalOpen(false);
          setSelectedIntegration(null);
        }}
        title={`Configure ${selectedIntegration?.name}`}
        size="md"
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Connected as: <strong>{selectedIntegration.account}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Last synced: {selectedIntegration.lastSync}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Sync Settings
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Auto-sync every 15 minutes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm">Sync on data changes</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm">Include archived items</span>
                </label>
              </div>
            </div>

            <ModalFooter className="px-0 pb-0">
              <Button variant="secondary" onClick={() => setIsConfigModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsConfigModalOpen(false)}>
                Save Configuration
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Create API Key Modal */}
      <Modal
        isOpen={isCreateKeyModalOpen}
        onClose={() => {
          setIsCreateKeyModalOpen(false);
          setNewKeyName('');
          setNewKeyPermissions(['read']);
        }}
        title="Create API Key"
        description="Generate a new API key for programmatic access"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Key Name"
            placeholder="e.g., Production API Key"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Permissions</label>
            <div className="space-y-2">
              {['read', 'write', 'delete'].map((perm) => (
                <label key={perm} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newKeyPermissions.includes(perm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewKeyPermissions([...newKeyPermissions, perm]);
                      } else {
                        setNewKeyPermissions(newKeyPermissions.filter((p) => p !== perm));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{perm}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg bg-warning-50 border border-warning-200 p-4">
            <p className="text-sm text-warning-700">
              Make sure to copy your API key after creation. You will not be able to see it again.
            </p>
          </div>

          <ModalFooter className="px-0 pb-0">
            <Button variant="secondary" onClick={() => setIsCreateKeyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateAPIKey}
              disabled={!newKeyName.trim()}
            >
              Create Key
            </Button>
          </ModalFooter>
        </div>
      </Modal>

      {/* Create Webhook Modal */}
      <Modal
        isOpen={isCreateWebhookModalOpen}
        onClose={() => {
          setIsCreateWebhookModalOpen(false);
          setNewWebhookName('');
          setNewWebhookUrl('');
          setNewWebhookEvents([]);
        }}
        title="Create Webhook"
        description="Configure a webhook endpoint to receive events"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Webhook Name"
            placeholder="e.g., Deal Updates Webhook"
            value={newWebhookName}
            onChange={(e) => setNewWebhookName(e.target.value)}
          />

          <Input
            label="Endpoint URL"
            placeholder="https://your-server.com/webhooks"
            value={newWebhookUrl}
            onChange={(e) => setNewWebhookUrl(e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Events</label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-2">
              {webhookEvents.map((event) => (
                <label key={event.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newWebhookEvents.includes(event.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewWebhookEvents([...newWebhookEvents, event.value]);
                      } else {
                        setNewWebhookEvents(newWebhookEvents.filter((ev) => ev !== event.value));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{event.label}</span>
                </label>
              ))}
            </div>
          </div>

          <ModalFooter className="px-0 pb-0">
            <Button variant="secondary" onClick={() => setIsCreateWebhookModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateWebhook}
              disabled={!newWebhookName.trim() || !newWebhookUrl.trim() || newWebhookEvents.length === 0}
            >
              Create Webhook
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
