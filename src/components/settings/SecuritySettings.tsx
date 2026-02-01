'use client';

import { useState } from 'react';
import {
  Shield,
  Key,
  Lock,
  Unlock,
  Globe,
  Smartphone,
  Monitor,
  Clock,
  AlertTriangle,
  Check,
  X,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  LogOut,
  FileText,
  Download,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

interface Session {
  id: string;
  device: string;
  browser: string;
  location: string;
  ip: string;
  lastActive: string;
  isCurrent: boolean;
  icon: React.ElementType;
}

interface LoginHistory {
  id: string;
  timestamp: string;
  device: string;
  location: string;
  ip: string;
  status: 'success' | 'failed';
  method: string;
}

interface APIToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  lastUsed: string;
  scopes: string[];
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  resource: string;
  ip: string;
  details: string;
}

const mockSessions: Session[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome 122',
    location: 'San Francisco, CA',
    ip: '192.168.1.100',
    lastActive: 'Active now',
    isCurrent: true,
    icon: Monitor,
  },
  {
    id: '2',
    device: 'iPhone 15 Pro',
    browser: 'Safari Mobile',
    location: 'San Francisco, CA',
    ip: '192.168.1.101',
    lastActive: '2 hours ago',
    isCurrent: false,
    icon: Smartphone,
  },
  {
    id: '3',
    device: 'Windows Desktop',
    browser: 'Edge 121',
    location: 'New York, NY',
    ip: '10.0.0.50',
    lastActive: '3 days ago',
    isCurrent: false,
    icon: Monitor,
  },
];

const mockLoginHistory: LoginHistory[] = [
  {
    id: '1',
    timestamp: '2024-04-10 14:32:00',
    device: 'Chrome on MacOS',
    location: 'San Francisco, CA',
    ip: '192.168.1.100',
    status: 'success',
    method: 'Password + 2FA',
  },
  {
    id: '2',
    timestamp: '2024-04-10 10:15:00',
    device: 'Safari on iPhone',
    location: 'San Francisco, CA',
    ip: '192.168.1.101',
    status: 'success',
    method: 'Biometric',
  },
  {
    id: '3',
    timestamp: '2024-04-09 16:45:00',
    device: 'Chrome on Windows',
    location: 'Unknown',
    ip: '45.32.100.55',
    status: 'failed',
    method: 'Password',
  },
  {
    id: '4',
    timestamp: '2024-04-08 09:00:00',
    device: 'Edge on Windows',
    location: 'New York, NY',
    ip: '10.0.0.50',
    status: 'success',
    method: 'SSO',
  },
];

const mockTokens: APIToken[] = [
  {
    id: '1',
    name: 'CI/CD Pipeline',
    token: 'pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    createdAt: '2024-01-15',
    expiresAt: '2025-01-15',
    lastUsed: '1 hour ago',
    scopes: ['read:deals', 'read:filings'],
  },
  {
    id: '2',
    name: 'Reporting Dashboard',
    token: 'pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    createdAt: '2024-03-01',
    expiresAt: '2025-03-01',
    lastUsed: '5 minutes ago',
    scopes: ['read:deals', 'read:filings', 'read:analytics'],
  },
];

const mockAuditLog: AuditLogEntry[] = [
  {
    id: '1',
    timestamp: '2024-04-10 14:32:00',
    action: 'Password Changed',
    resource: 'User Account',
    ip: '192.168.1.100',
    details: 'Password successfully updated',
  },
  {
    id: '2',
    timestamp: '2024-04-10 12:15:00',
    action: '2FA Enabled',
    resource: 'Security Settings',
    ip: '192.168.1.100',
    details: 'Two-factor authentication enabled via Authenticator app',
  },
  {
    id: '3',
    timestamp: '2024-04-09 16:45:00',
    action: 'Failed Login Attempt',
    resource: 'Authentication',
    ip: '45.32.100.55',
    details: 'Invalid password - 3 attempts remaining',
  },
  {
    id: '4',
    timestamp: '2024-04-08 09:00:00',
    action: 'API Token Created',
    resource: 'API Access',
    ip: '192.168.1.100',
    details: 'Created token "Reporting Dashboard"',
  },
];

export function SecuritySettings() {
  const [activeTab, setActiveTab] = useState<'password' | 'sessions' | 'tokens' | 'audit'>(
    'password'
  );
  const [sessions, setSessions] = useState(mockSessions);
  const [tokens, setTokens] = useState(mockTokens);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Token modal state
  const [isCreateTokenModalOpen, setIsCreateTokenModalOpen] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [newTokenScopes, setNewTokenScopes] = useState<string[]>([]);
  const [createdToken, setCreatedToken] = useState<string | null>(null);

  const validatePassword = () => {
    const errors: Record<string, string> = {};

    if (!currentPassword) {
      errors.current = 'Current password is required';
    }
    if (!newPassword) {
      errors.new = 'New password is required';
    } else if (newPassword.length < 12) {
      errors.new = 'Password must be at least 12 characters';
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.new = 'Password must contain at least one uppercase letter';
    } else if (!/[a-z]/.test(newPassword)) {
      errors.new = 'Password must contain at least one lowercase letter';
    } else if (!/[0-9]/.test(newPassword)) {
      errors.new = 'Password must contain at least one number';
    } else if (!/[!@#$%^&*]/.test(newPassword)) {
      errors.new = 'Password must contain at least one special character';
    }
    if (newPassword !== confirmPassword) {
      errors.confirm = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
  };

  const handleRevokeAllSessions = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
  };

  const handleRevokeToken = (tokenId: string) => {
    setTokens(tokens.filter((t) => t.id !== tokenId));
  };

  const handleCreateToken = () => {
    const token = `pat_${Math.random().toString(36).substring(2, 34)}`;
    const newToken: APIToken = {
      id: Date.now().toString(),
      name: newTokenName,
      token,
      createdAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      lastUsed: 'Never',
      scopes: newTokenScopes,
    };
    setTokens([newToken, ...tokens]);
    setCreatedToken(token);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) return { label: 'Weak', color: 'bg-danger-500', width: '33%' };
    if (strength <= 4) return { label: 'Medium', color: 'bg-warning-500', width: '66%' };
    return { label: 'Strong', color: 'bg-success-500', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const tabs = [
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'sessions', label: 'Sessions', icon: Globe },
    { id: 'tokens', label: 'API Tokens', icon: Key },
    { id: 'audit', label: 'Audit Log', icon: FileText },
  ];

  const availableScopes = [
    { value: 'read:deals', label: 'Read Deals' },
    { value: 'write:deals', label: 'Write Deals' },
    { value: 'read:filings', label: 'Read Filings' },
    { value: 'write:filings', label: 'Write Filings' },
    { value: 'read:analytics', label: 'Read Analytics' },
    { value: 'read:documents', label: 'Read Documents' },
    { value: 'write:documents', label: 'Write Documents' },
  ];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-4 text-success-700">
          <Check className="h-5 w-5" />
          <span>Password changed successfully</span>
        </div>
      )}

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

      {/* Password Tab */}
      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>
              Update your password to keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md space-y-4">
              <div className="relative">
                <Input
                  label="Current Password"
                  type={showPassword.current ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  error={passwordErrors.current}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, current: !showPassword.current })
                  }
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.current ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword.new ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  error={passwordErrors.new}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.new ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Password strength</span>
                    <span
                      className={cn(
                        'font-medium',
                        passwordStrength.label === 'Weak' && 'text-danger-600',
                        passwordStrength.label === 'Medium' && 'text-warning-600',
                        passwordStrength.label === 'Strong' && 'text-success-600'
                      )}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200">
                    <div
                      className={cn('h-full rounded-full transition-all', passwordStrength.color)}
                      style={{ width: passwordStrength.width }}
                    />
                  </div>
                </div>
              )}

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showPassword.confirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={passwordErrors.confirm}
                />
                <button
                  type="button"
                  onClick={() =>
                    setShowPassword({ ...showPassword, confirm: !showPassword.confirm })
                  }
                  className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                >
                  {showPassword.confirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900 mb-2">Password Requirements</p>
                <ul className="space-y-1 text-sm text-slate-600">
                  {[
                    { met: newPassword.length >= 12, text: 'At least 12 characters' },
                    { met: /[A-Z]/.test(newPassword), text: 'At least one uppercase letter' },
                    { met: /[a-z]/.test(newPassword), text: 'At least one lowercase letter' },
                    { met: /[0-9]/.test(newPassword), text: 'At least one number' },
                    {
                      met: /[!@#$%^&*]/.test(newPassword),
                      text: 'At least one special character (!@#$%^&*)',
                    },
                  ].map((req, index) => (
                    <li key={index} className="flex items-center gap-2">
                      {req.met ? (
                        <Check className="h-4 w-4 text-success-500" />
                      ) : (
                        <X className="h-4 w-4 text-slate-300" />
                      )}
                      <span className={req.met ? 'text-success-700' : ''}>{req.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button variant="primary" onClick={handleChangePassword} isLoading={isSaving}>
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Active Sessions</h3>
              <p className="text-sm text-slate-500">
                Manage your active sessions across devices
              </p>
            </div>
            <Button
              variant="danger"
              onClick={handleRevokeAllSessions}
              disabled={sessions.filter((s) => !s.isCurrent).length === 0}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out All Others
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {sessions.map((session) => {
                  const Icon = session.icon;
                  return (
                    <div key={session.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              'flex h-10 w-10 items-center justify-center rounded-lg',
                              session.isCurrent ? 'bg-success-100' : 'bg-slate-100'
                            )}
                          >
                            <Icon
                              className={cn(
                                'h-5 w-5',
                                session.isCurrent ? 'text-success-600' : 'text-slate-400'
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-900">{session.device}</p>
                              {session.isCurrent && (
                                <Badge variant="success" size="sm">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">{session.browser}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                              <span>{session.location}</span>
                              <span>IP: {session.ip}</span>
                              <span>{session.lastActive}</span>
                            </div>
                          </div>
                        </div>
                        {!session.isCurrent && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Login History */}
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Recent login attempts to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLoginHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >
                    <div className="flex items-center gap-3">
                      {entry.status === 'success' ? (
                        <Check className="h-5 w-5 text-success-500" />
                      ) : (
                        <X className="h-5 w-5 text-danger-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900">{entry.device}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{entry.location}</span>
                          <span>-</span>
                          <span>{entry.ip}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={entry.status === 'success' ? 'success' : 'danger'}
                        size="sm"
                      >
                        {entry.status === 'success' ? 'Success' : 'Failed'}
                      </Badge>
                      <p className="mt-1 text-xs text-slate-400">{entry.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* API Tokens Tab */}
      {activeTab === 'tokens' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">API Access Tokens</h3>
              <p className="text-sm text-slate-500">
                Personal access tokens for API authentication
              </p>
            </div>
            <Button variant="primary" onClick={() => setIsCreateTokenModalOpen(true)}>
              <Key className="mr-2 h-4 w-4" />
              Create Token
            </Button>
          </div>

          <div className="rounded-lg bg-warning-50 border border-warning-200 p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-warning-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-800">Security Notice</p>
                <p className="mt-1 text-sm text-warning-700">
                  Personal access tokens provide full API access with the selected scopes. Treat
                  them like passwords and never share them publicly.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {tokens.map((token) => (
              <Card key={token.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Key className="h-4 w-4 text-slate-400" />
                        <h4 className="font-medium text-slate-900">{token.name}</h4>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="rounded bg-slate-100 px-2 py-1 text-sm font-mono">
                          {token.token.substring(0, 12)}...
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText(token.token)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" size="sm">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                        <span>Created: {token.createdAt}</span>
                        <span>Expires: {token.expiresAt}</span>
                        <span>Last used: {token.lastUsed}</span>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevokeToken(token.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {tokens.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Key className="mx-auto h-12 w-12 text-slate-300" />
                  <p className="mt-4 text-slate-500">No API tokens created yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-slate-900">Security Audit Log</h3>
              <p className="text-sm text-slate-500">
                View security-related events for your account
              </p>
            </div>
            <Button variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export Log
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {mockAuditLog.map((entry) => (
                  <div key={entry.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'mt-0.5 rounded-full p-1',
                            entry.action.includes('Failed')
                              ? 'bg-danger-100'
                              : 'bg-success-100'
                          )}
                        >
                          {entry.action.includes('Failed') ? (
                            <AlertTriangle className="h-4 w-4 text-danger-600" />
                          ) : (
                            <Check className="h-4 w-4 text-success-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{entry.action}</p>
                          <p className="text-sm text-slate-500">{entry.details}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                            <span>{entry.timestamp}</span>
                            <span>Resource: {entry.resource}</span>
                            <span>IP: {entry.ip}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-slate-300" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create Token Modal */}
      <Modal
        isOpen={isCreateTokenModalOpen}
        onClose={() => {
          setIsCreateTokenModalOpen(false);
          setNewTokenName('');
          setNewTokenScopes([]);
          setCreatedToken(null);
        }}
        title="Create Personal Access Token"
        description={
          createdToken
            ? 'Copy your new token now. You will not be able to see it again.'
            : 'Generate a new personal access token for API access'
        }
        size="md"
      >
        {createdToken ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-success-50 border border-success-200 p-4">
              <div className="flex items-center gap-2 text-success-700">
                <Check className="h-5 w-5" />
                <span className="font-medium">Token created successfully</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Your Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={createdToken}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono"
                />
                <Button
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(createdToken)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-warning-50 border border-warning-200 p-4">
              <p className="text-sm text-warning-700">
                Make sure to copy your personal access token now. You will not be able to see
                it again.
              </p>
            </div>
            <ModalFooter className="px-0 pb-0">
              <Button
                variant="primary"
                onClick={() => {
                  setIsCreateTokenModalOpen(false);
                  setCreatedToken(null);
                  setNewTokenName('');
                  setNewTokenScopes([]);
                }}
              >
                Done
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Token Name"
              placeholder="e.g., CI/CD Pipeline"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              helperText="Give your token a descriptive name"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Scopes
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-2">
                {availableScopes.map((scope) => (
                  <label key={scope.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newTokenScopes.includes(scope.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewTokenScopes([...newTokenScopes, scope.value]);
                        } else {
                          setNewTokenScopes(newTokenScopes.filter((s) => s !== scope.value));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm">{scope.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <ModalFooter className="px-0 pb-0">
              <Button variant="secondary" onClick={() => setIsCreateTokenModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateToken}
                disabled={!newTokenName.trim() || newTokenScopes.length === 0}
              >
                Create Token
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}
