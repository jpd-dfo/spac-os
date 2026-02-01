'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
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
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
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
  department: string;
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
    department: 'M&A',
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
    department: 'Legal',
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
    department: 'Finance',
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
    department: 'Operations',
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
    department: 'M&A',
  },
  {
    id: '6',
    name: 'Emily Davis',
    email: 'emily.davis@spacos.com',
    role: 'Manager',
    status: 'active',
    initials: 'ED',
    lastActive: '30 minutes ago',
    joinedDate: 'Feb 1, 2024',
    department: 'Compliance',
  },
  {
    id: '7',
    name: 'David Brown',
    email: 'david.brown@spacos.com',
    role: 'Analyst',
    status: 'active',
    initials: 'DB',
    lastActive: '5 hours ago',
    joinedDate: 'Mar 15, 2024',
    department: 'Finance',
  },
];

const roleOptions = [
  { value: 'Admin', label: 'Admin' },
  { value: 'Manager', label: 'Manager' },
  { value: 'Analyst', label: 'Analyst' },
  { value: 'Viewer', label: 'Viewer' },
];

const departmentOptions = [
  { value: '', label: 'All Departments' },
  { value: 'M&A', label: 'M&A' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Compliance', label: 'Compliance' },
];

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(mockTeamMembers);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

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
    const matchesDepartment = !departmentFilter || member.department === departmentFilter;
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });

  const handleInvite = async () => {
    const errors: Record<string, string> = {};
    if (!inviteEmail.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)) {
      errors.email = 'Invalid email format';
    } else if (teamMembers.some((m) => m.email === inviteEmail)) {
      errors.email = 'User already exists';
    }

    setInviteErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsInviting(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0].replace('.', ' '),
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
      department: 'Unassigned',
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
    if (!selectedMember) return;

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

  // Statistics
  const stats = {
    total: teamMembers.length,
    active: teamMembers.filter((m) => m.status === 'active').length,
    pending: teamMembers.filter((m) => m.status === 'pending').length,
    inactive: teamMembers.filter((m) => m.status === 'inactive').length,
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
        <h1 className="page-title">Team Management</h1>
        <p className="page-description">Manage your team members and their access permissions</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Users className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
                <p className="text-sm text-slate-500">Total Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                <CheckCircle className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.active}</p>
                <p className="text-sm text-slate-500">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-100">
                <Clock className="h-5 w-5 text-warning-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
                <p className="text-sm text-slate-500">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <XCircle className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-slate-900">{stats.inactive}</p>
                <p className="text-sm text-slate-500">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <Select
            options={[{ value: '', label: 'All Roles' }, ...roleOptions]}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-32"
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
            className="w-32"
          />
          <Select
            options={departmentOptions}
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="primary" onClick={() => setIsInviteModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        </div>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">
                    Member
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">
                    Role
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">
                    Department
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-slate-600">
                    Last Active
                  </th>
                  <th className="py-3 px-4 text-right text-sm font-medium text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
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
                          <p className="font-medium text-slate-900">{member.name}</p>
                          <p className="text-sm text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">{getRoleBadge(member.role)}</td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-600">{member.department}</span>
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(member.status)}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-sm text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        {member.lastActive}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        {member.status === 'inactive' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(member.id)}
                          >
                            <RefreshCw className="mr-1 h-4 w-4" />
                            Reactivate
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredMembers.length === 0 && (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-4 text-sm text-slate-500">No team members found</p>
            </div>
          )}
        </CardContent>
      </Card>

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
        title="Invite Team Member"
        description="Send an invitation to join your team"
        size="md"
      >
        {inviteLink ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-success-50 border border-success-200 p-4">
              <div className="flex items-center gap-2 text-success-700">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Invitation sent successfully</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Invitation Link
              </label>
              <div className="flex gap-2">
                <input
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
              error={inviteErrors.email}
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
        title="Edit Team Member"
        description={`Update role for ${selectedMember?.name}`}
        size="md"
      >
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
        title="Deactivate Team Member"
        size="md"
      >
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
