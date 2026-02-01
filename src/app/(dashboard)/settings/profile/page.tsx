'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Camera,
  Check,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface ProfileFormData {
  displayName: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  phoneNumber: string;
}

export default function ProfileSettingsPage() {
  const { user, isLoaded } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: '',
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    phoneNumber: '',
  });

  // Initialize form data from Clerk user
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.fullName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        jobTitle: (user.publicMetadata?.jobTitle as string) || '',
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || '',
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (formData.phoneNumber && !/^[\d\s+()-]*$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // In a real app, update Clerk user profile here
      // await user?.update({
      //   firstName: formData.firstName,
      //   lastName: formData.lastName,
      // });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      // Error handled in UI - show error state
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to original values
    if (user) {
      setFormData({
        displayName: user.fullName || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        jobTitle: (user.publicMetadata?.jobTitle as string) || '',
        phoneNumber: user.primaryPhoneNumber?.phoneNumber || '',
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleAvatarUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // TODO: Upload to Clerk
        // await user?.setProfileImage({ file });
      }
    };
    input.click();
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link and Page Title */}
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg bg-success-50 border border-success-200 p-4 text-success-700">
          <Check className="h-5 w-5" />
          <span>Profile updated successfully</span>
        </div>
      )}

      {/* Profile Header Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-slate-400" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Manage your personal information and account details
            </CardDescription>
          </div>
          {!isEditing && (
            <Button variant="primary" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {/* Avatar Section */}
          <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-200">
            <div className="relative">
              <Avatar
                name={formData.displayName || formData.email}
                src={user?.imageUrl}
                size="xl"
                className="h-24 w-24"
              />
              {isEditing && (
                <button
                  onClick={handleAvatarUpload}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-slate-50 border border-slate-200"
                  aria-label="Upload avatar"
                >
                  <Camera className="h-4 w-4 text-slate-600" />
                </button>
              )}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-slate-900">
                {formData.displayName || 'User'}
              </h3>
              <p className="text-sm text-slate-500">{formData.email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="primary">Admin</Badge>
                {formData.jobTitle && (
                  <Badge variant="secondary">{formData.jobTitle}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Display Name */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Personal Information
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  error={errors.firstName}
                  placeholder="Enter your first name"
                />
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  error={errors.lastName}
                  placeholder="Enter your last name"
                />
              </div>
            </div>

            {/* Email (Read-only from Clerk) */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                Email Address
              </h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  disabled
                  helperText="Email is managed by your authentication provider and cannot be changed here"
                />
              </div>
            </div>

            {/* Job Title */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Work Information
              </h4>
              <Input
                label="Job Title"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g., Senior Analyst, Managing Director"
              />
            </div>

            {/* Phone Number */}
            <div>
              <h4 className="text-sm font-medium text-slate-700 mb-4 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                Contact Information
              </h4>
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                disabled={!isEditing}
                error={errors.phoneNumber}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSave}
                isLoading={isSaving}
              >
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Details about your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Account ID</p>
              <p className="mt-1 text-sm font-mono text-slate-700">{user?.id || 'N/A'}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Member Since</p>
              <p className="mt-1 text-sm text-slate-700">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Last Sign In</p>
              <p className="mt-1 text-sm text-slate-700">
                {user?.lastSignInAt
                  ? new Date(user.lastSignInAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Email Verified</p>
              <p className="mt-1 flex items-center gap-2">
                {user?.primaryEmailAddress?.verification?.status === 'verified' ? (
                  <>
                    <Check className="h-4 w-4 text-success-500" />
                    <span className="text-sm text-success-700">Verified</span>
                  </>
                ) : (
                  <span className="text-sm text-warning-700">Pending verification</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
