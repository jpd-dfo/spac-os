'use client';

import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  Shield,
  Check,
  X,
  Link2,
  Github,
  Linkedin,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  title: string;
  department: string;
  avatar: string | null;
}

interface NotificationPreferences {
  emailDigest: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
  marketingEmails: boolean;
}

interface ConnectedAccount {
  id: string;
  provider: string;
  email: string;
  connected: boolean;
  icon: React.ElementType;
}

export function ProfileSettings() {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [profile, setProfile] = useState<ProfileData>({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@spacos.com',
    phone: '+1 (555) 123-4567',
    title: 'Senior Analyst',
    department: 'M&A',
    avatar: null,
  });

  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    emailDigest: true,
    pushNotifications: true,
    smsAlerts: false,
    marketingEmails: false,
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);

  const connectedAccounts: ConnectedAccount[] = [
    { id: '1', provider: 'Google', email: 'john.doe@gmail.com', connected: true, icon: Mail },
    { id: '2', provider: 'Microsoft', email: 'john.doe@outlook.com', connected: true, icon: Mail },
    { id: '3', provider: 'GitHub', email: '', connected: false, icon: Github },
    { id: '4', provider: 'LinkedIn', email: '', connected: false, icon: Linkedin },
  ];

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!profile.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!profile.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!profile.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (profile.phone && !/^[\d\s+()-]+$/.test(profile.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) return;

    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAvatarUpload = () => {
    // Trigger file upload
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // In a real app, upload to server and get URL
        const reader = new FileReader();
        reader.onload = () => {
          setProfile({ ...profile, avatar: reader.result as string });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const toggleNotification = (key: keyof NotificationPreferences) => {
    setNotificationPrefs({ ...notificationPrefs, [key]: !notificationPrefs[key] });
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-4 text-success-700">
          <Check className="h-5 w-5" />
          <span>Profile updated successfully</span>
        </div>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal information and contact details</CardDescription>
          </div>
          {!isEditing && (
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-6">
              <div className="relative">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-700">
                    {profile.firstName.charAt(0)}
                    {profile.lastName.charAt(0)}
                  </div>
                )}
                {isEditing && (
                  <button
                    onClick={handleAvatarUpload}
                    className="absolute bottom-0 right-0 rounded-full bg-white p-2 shadow-md hover:bg-slate-50"
                  >
                    <Camera className="h-4 w-4 text-slate-600" />
                  </button>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-slate-500">{profile.title}</p>
                <Badge variant="secondary" className="mt-2">
                  {profile.department}
                </Badge>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First Name"
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                disabled={!isEditing}
                error={errors.firstName}
              />
              <Input
                label="Last Name"
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={!isEditing}
                error={errors.lastName}
              />
              <Input
                label="Email"
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={!isEditing}
                error={errors.email}
              />
              <Input
                label="Phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={!isEditing}
                error={errors.phone}
              />
              <Input
                label="Job Title"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                disabled={!isEditing}
              />
              <Input
                label="Department"
                value={profile.department}
                onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            {/* Role Display */}
            <div className="rounded-lg bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">Role</p>
                  <p className="text-sm text-slate-500">Admin</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Contact your organization administrator to change your role
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditing(false);
                    setErrors({});
                  }}
                >
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                key: 'emailDigest' as const,
                label: 'Email Digest',
                description: 'Receive daily summary of activities via email',
              },
              {
                key: 'pushNotifications' as const,
                label: 'Push Notifications',
                description: 'Receive real-time push notifications in browser',
              },
              {
                key: 'smsAlerts' as const,
                label: 'SMS Alerts',
                description: 'Receive critical alerts via SMS',
              },
              {
                key: 'marketingEmails' as const,
                label: 'Marketing Emails',
                description: 'Receive product updates and announcements',
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
                <button
                  onClick={() => toggleNotification(item.key)}
                  className={cn(
                    'relative h-6 w-11 rounded-full transition-colors',
                    notificationPrefs[item.key] ? 'bg-primary-600' : 'bg-slate-200'
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm',
                      notificationPrefs[item.key] && 'translate-x-5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'rounded-lg p-2',
                  twoFactorEnabled ? 'bg-success-100' : 'bg-slate-100'
                )}
              >
                <Shield
                  className={cn(
                    'h-5 w-5',
                    twoFactorEnabled ? 'text-success-600' : 'text-slate-400'
                  )}
                />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {twoFactorEnabled ? '2FA is enabled' : '2FA is disabled'}
                </p>
                <p className="text-sm text-slate-500">
                  {twoFactorEnabled
                    ? 'Your account is protected with two-factor authentication'
                    : 'Enable 2FA to add extra security to your account'}
                </p>
              </div>
            </div>
            <Button
              variant={twoFactorEnabled ? 'secondary' : 'primary'}
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            >
              {twoFactorEnabled ? 'Configure' : 'Enable'}
            </Button>
          </div>

          {twoFactorEnabled && (
            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <h4 className="text-sm font-medium text-slate-900">Recovery Codes</h4>
              <p className="mt-1 text-sm text-slate-500">
                Store these codes securely. Each code can only be used once.
              </p>
              <Button variant="secondary" size="sm" className="mt-3">
                View Recovery Codes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Manage your connected third-party accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connectedAccounts.map((account) => {
              const Icon = account.icon;
              return (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                      <Icon className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{account.provider}</p>
                      {account.connected ? (
                        <p className="text-sm text-slate-500">{account.email}</p>
                      ) : (
                        <p className="text-sm text-slate-400">Not connected</p>
                      )}
                    </div>
                  </div>
                  {account.connected ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="success">Connected</Badge>
                      <Button variant="ghost" size="sm">
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button variant="secondary" size="sm">
                      <Link2 className="mr-2 h-4 w-4" />
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-danger-200">
        <CardHeader>
          <CardTitle className="text-danger-600">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-danger-200 bg-danger-50 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-danger-600" />
              <div>
                <p className="font-medium text-slate-900">Delete Account</p>
                <p className="text-sm text-slate-500">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </div>
            <Button variant="danger">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
