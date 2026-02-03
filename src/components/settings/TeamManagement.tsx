'use client';

import { useState } from 'react';

import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Shield,
  Eye,
  Edit2,
  Trash2,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  AlertTriangle,
  Copy,
  RefreshCw,
} from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal, ModalFooter, ModalHeader, ModalTitle } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/utils';

type UserRole = 'Admin' | 'Manager' | 'Analyst' | 'Viewer';
type UserStatus = 'active' | 'pending' | 'inactive';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  initials: string;
  lastActive: string;
  joinedDate: string;
}

interface ActivityLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  admin: boolean;
  manager: boolean;
  analyst: boolean;
  viewer: boolean;
}

const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@spacos.com',
    role: 'Admin',
    status: 'active',
    initials: 'JD',
    lastActive: '2 minutes ago',
    joinedDate: 'Jan 15, 2024',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@spacos.com',
    role: 'Manager',
    status: 'active',
    initials: 'JS',
    lastActive: '1 hour ago',
    joinedDate: 'Feb 20, 2024',
  },
  {
    id: '3',
    name: 'Mike Johnson',
    email: 'mike.johnson@spacos.com',
    role: 'Analyst',
    status: 'active',
    initials: 'MJ',
    lastActive: '3 hours ago',
    joinedDate: 'Mar 10, 2024',
  },
  {
    id: '4',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@spacos.com',
    role: 'Viewer',
    status: 'pending',
    initials: 'SW',
    lastActive: 'Never',
    joinedDate: 'Apr 5, 2024',
  },
  {
    id: '5',
    name: 'Robert Chen',
    email: 'robert.chen@spacos.com',
    role: 'Analyst',
    status: 'inactive',
    initials: 'RC',
    lastActive: '2 weeks ago',
    joinedDate: 'Jan 30, 2024',
  },
];

const mockActivityLog: ActivityLogEntry[] = [
  {
    id: '1',
    userId: '1',
    userName: 'John Doe',
    action: 'Updated',
    target: 'Deal: Acme Corp Acquisition',
    timestamp: '2024-04-10 14:32:00',
    ip: '192.168.1.1',
  },
  {
    id: '2',
    userId: '2',
    userName: 'Jane Smith',
    action: 'Created',
    target: 'Filing: 10-K Annual Report',
    timestamp: '2024-04-10 13:15:00',
    ip: '192.168.1.2',
  },
  {
    id: '3',
    userId: '3',
    userName: 'Mike Johnson',
    action: 'Downloaded',
    target: 'Document: Due Diligence Report',
    timestamp: '2024-04-10 11:45:00',
    ip: '192.168.1.3',
  },
  {
    id: '4',
    userId: '1',
    userName: 'John Doe',
    action: 'Invited',
    target: 'User: sarah.wilson@spacos.com',
    timestamp: '2024-04-10 10:30:00',
    ip: '192.168.1.1',
  },
];

const permissions: Permission[] = [
  {
    id: '1',
    name: 'View Dashboard',
    description: 'Access to main dashboard and metrics',
    admin: true,
    manager: true,
    analyst: true,
    viewer: true,
  },
  {
    id: '2',
    name: 'Manage Deals',
    description: 'Create, edit, and delete deals',
    admin: true,
    manager: true,
    analyst: true,
    viewer: false,
  },
  {
    id: '3',
    name: 'Manage Filings',
    description: 'Create and submit SEC filings',
    admin: true,
    manager: true,
    analyst: false,
    viewer: false,
  },
  {
    id: '4',
    name: 'View Financial Data',
    description: 'Access to trust account and financial reports',
    admin: true,
    manager: true,
    analyst: true,
    viewer: true,
  },
  {
    id: '5',
    name: 'Manage Team',
    description: 'Invite, edit, and remove team members',
    admin: true,
    manager: false,
    analyst: false,
    viewer: false,
  },
  {
    id: '6',
    name: 'Manage Integrations',
    description: 'Configure third-party integrations',
    admin: true,
    manager: true,
    analyst: false,
    viewer: false,
  },
  {
    id: '7',
    name: 'Export Data',
    description: 'Export reports and data',
    admin: true,
    manager: true,
    analyst: true,
    viewer: false,
  },
  {
    id: '8',
    name: 'Access Audit Logs',
    description: 'View security and activity logs',
    admin: true,
    manager: false,
    analyst: false,
    viewer: false,
  },
];

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Analyst', label: 'Analyst' },
  { value: 'Viewer', label: 'Viewer' },
];

export function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState<'members' | 'permissions' | 'activity'>('members');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('Viewer');
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [isInviting, setIsInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = !roleFilter || member.role === roleFilter;
    const matchesStatus = !statusFilter || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleInvite = async () => {
    const errors: Record<string, string> = {};
    if (!inviteEmail.trim()) {
      errors['email'] = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      errors['email'] = 'Invalid email format';
    } else if (teamMembers.some((m) => m.email === inviteEmail)) {
      errors['email'] = 'User already exists';
    }

    setInviteErrors(errors);
    if (Object.keys(errors).length > 0) {return;}

    setIsInviting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const emailName = inviteEmail.split('@')[0] ?? inviteEmail;
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: emailName.replace('.', ' '),
      email: inviteEmail,
      role: inviteRole,
      status: 'pending',
      initials: inviteEmail.substring(0, 2).toUpperCase(),
      lastActive: 'Never',
      joinedDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };

    setTeamMembers([...teamMembers, newMember]);
    setInviteLink(`https://spacos.com/invite/${Date.now()}`);
    setIsInviting(false);
  };

  const handleUpdateRole = async (memberId: string, newRole: UserRole) => {
    setTeamMembers(
      teamMembers.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
  };

  const handleDeactivate = async () => {
    if (!selectedMember) {return;}

    setTeamMembers(
      teamMembers.map((m) =>
        m.id === selectedMember.id ? { ...m, status: 'inactive' as UserStatus } : m
      )
    );
    setIsDeactivateModalOpen(false);
    setSelectedMember(null);
  };

  const handleReactivate = async (memberId: string) => {
    setTeamMembers(
      teamMembers.map((m) =>
        m.id === memberId ? { ...m, status: 'active' as UserStatus } : m
      )
    );
  };

  const getStatusBadge = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return <Badge variant="danger">{role}</Badge>;
      case 'Manager':
        return <Badge variant="primary">{role}</Badge>;
      case 'Analyst':
        return <Badge variant="default">{role}</Badge>;
      case 'Viewer':
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  const tabs = [
    { id: 'members', label: 'Team Members', icon: Users },
    { id: 'permissions', label: 'Permission Matrix', icon: Shield },
    { id: 'activity', label: 'Activity Log', icon: Activity },
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

      {/* Team Members Tab */}
      {activeTab === 'members' && (
        <>
          {/* Header Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <Select
                options={[{ value: '', label: 'All Roles' }, ...roleOptions]}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-36"
              />
              <Select
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              />
            </div>
            <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          {/* Team Members List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium',
                          member.status === 'inactive'
                            ? 'bg-slate-100 text-slate-400'
                            : 'bg-primary-100 text-primary-700'
                        )}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{member.name}</p>
                          {getRoleBadge(member.role)}
                        </div>
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {member.lastActive}
                        </div>
                        <p className="text-xs text-slate-400">Joined {member.joinedDate}</p>
                      </div>

                      {getStatusBadge(member.status)}

                      <div className="flex items-center gap-1">
                        {member.status === 'inactive' ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => handleReactivate(member.id)}
                            title="Reactivate"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsEditModalOpen(true);
                              }}
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsDeactivateModalOpen(true);
                              }}
                              title="Deactivate"
                            >
                              <XCircle className="h-4 w-4 text-danger-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredMembers.length === 0 && (
                  <div className="py-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-slate-300" />
                    <p className="mt-4 text-sm text-slate-500">No team members found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Permission Matrix Tab */}
      {activeTab === 'permissions' && (
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>
              Overview of permissions by role. Contact an administrator to modify permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="py-3 text-left text-sm font-medium text-slate-500">
                      Permission
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                      Admin
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                      Manager
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                      Analyst
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                      Viewer
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {permissions.map((permission) => (
                    <tr key={permission.id} className="hover:bg-slate-50">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">{permission.name}</p>
                        <p className="text-sm text-slate-500">{permission.description}</p>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {permission.admin ? (
                          <CheckCircle className="mx-auto h-5 w-5 text-success-500" />
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-slate-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {permission.manager ? (
                          <CheckCircle className="mx-auto h-5 w-5 text-success-500" />
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-slate-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {permission.analyst ? (
                          <CheckCircle className="mx-auto h-5 w-5 text-success-500" />
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-slate-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {permission.viewer ? (
                          <CheckCircle className="mx-auto h-5 w-5 text-success-500" />
                        ) : (
                          <XCircle className="mx-auto h-5 w-5 text-slate-300" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent activity from team members</CardDescription>
            </div>
            <Select
              options={[
                { value: '', label: 'All Users' },
                ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
              ]}
              className="w-48"
            />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockActivityLog.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start gap-4 rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                    {entry.userName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{entry.userName}</p>
                      <span className="text-slate-400">-</span>
                      <span className="text-sm text-slate-500">{entry.action}</span>
                    </div>
                    <p className="text-sm text-slate-700">{entry.target}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
                      <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      <span>IP: {entry.ip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteEmail('');
          setInviteRole('Viewer');
          setInviteErrors({});
          setInviteLink('');
        }}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Invite Team Member</ModalTitle>
          <p className="mt-1 text-sm text-slate-500">Send an invitation to join your team</p>
        </ModalHeader>
        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-success-50 border border-success-200 p-4">
              <div className="flex items-center gap-2 text-success-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Invitation sent successfully</span>
              </div>
            </div>
            <div>
              <label htmlFor="invitation-link" className="block text-sm font-medium text-slate-700 mb-1.5">
                Invitation Link
              </label>
              <div className="flex gap-2">
                <input
                  id="invitation-link"
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Share this link with the invitee. It expires in 7 days.
              </p>
            </div>
            <ModalFooter className="px-0 pb-0">
              <Button
                variant="primary"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteLink('');
                  setInviteEmail('');
                }}
              >
                Done
              </Button>
            </ModalFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              error={inviteErrors['email']}
            />
            <Select
              label="Role"
              options={roleOptions}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
            />
            <div className="rounded-lg bg-slate-50 p-4">
              <h4 className="text-sm font-medium text-slate-900">Role Permissions</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {inviteRole === 'Admin' && (
                  <>
                    <li>Full access to all features</li>
                    <li>Manage team members and settings</li>
                    <li>Access audit logs</li>
                  </>
                )}
                {inviteRole === 'Manager' && (
                  <>
                    <li>Manage deals and filings</li>
                    <li>Configure integrations</li>
                    <li>Export data</li>
                  </>
                )}
                {inviteRole === 'Analyst' && (
                  <>
                    <li>View and manage deals</li>
                    <li>View financial data</li>
                    <li>Export data</li>
                  </>
                )}
                {inviteRole === 'Viewer' && (
                  <>
                    <li>View dashboard and metrics</li>
                    <li>View financial data</li>
                    <li>Read-only access</li>
                  </>
                )}
              </ul>
            </div>
            <ModalFooter className="px-0 pb-0">
              <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleInvite} isLoading={isInviting}>
                <Mail className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedMember(null);
        }}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Edit Team Member</ModalTitle>
          <p className="mt-1 text-sm text-slate-500">Update role for {selectedMember?.name}</p>
        </ModalHeader>
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-lg bg-slate-50 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-medium text-primary-700">
                {selectedMember.initials}
              </div>
              <div>
                <p className="font-medium text-slate-900">{selectedMember.name}</p>
                <p className="text-sm text-slate-500">{selectedMember.email}</p>
              </div>
            </div>
            <Select
              label="Role"
              options={roleOptions}
              value={selectedMember.role}
              onChange={(e) => {
                setSelectedMember({ ...selectedMember, role: e.target.value as UserRole });
              }}
            />
            <ModalFooter className="px-0 pb-0">
              <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleUpdateRole(selectedMember.id, selectedMember.role);
                  setIsEditModalOpen(false);
                  setSelectedMember(null);
                }}
              >
                Save Changes
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>

      {/* Deactivate Modal */}
      <Modal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setSelectedMember(null);
        }}
        size="md"
      >
        <ModalHeader>
          <ModalTitle>Deactivate Team Member</ModalTitle>
        </ModalHeader>
        {selectedMember && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-warning-50 border border-warning-200 p-4">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              <p className="text-sm text-warning-700">
                This action will revoke access for this team member.
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-slate-200 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-lg font-medium text-primary-700">
                {selectedMember.initials}
              </div>
              <div>
                <p className="font-medium text-slate-900">{selectedMember.name}</p>
                <p className="text-sm text-slate-500">{selectedMember.email}</p>
              </div>
            </div>
            <p className="text-sm text-slate-600">
              The user will lose access immediately but their data and activity history will be
              preserved. You can reactivate this account at any time.
            </p>
            <ModalFooter className="px-0 pb-0">
              <Button variant="secondary" onClick={() => setIsDeactivateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeactivate}>
                Deactivate User
              </Button>
            </ModalFooter>
          </div>
        )}
      </Modal>
    </div>
  );
}
