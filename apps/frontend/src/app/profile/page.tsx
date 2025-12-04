'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getMyProfile, getMyCreatorProfile, updateMyProfile, updateMyCreatorProfile } from '@/lib/graphql';
import { Pencil, Check, X, MapPin, Globe, Hash, LogOut, Shield } from 'lucide-react';
import { useUserRole } from '@/lib/useUserRole';
import { getRoleDisplayName } from '@/lib/roles';

export default function ProfilePage() {
  const router = useRouter();
  const { isAdmin, userRole } = useUserRole();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState({
    displayName: '',
    avatarUrl: '',
    location: '',
    slug: '',
  });

  const [creatorProfile, setCreatorProfile] = React.useState({
    isPublic: false,
    creatorBio: '',
    primaryCategory: '',
    highlights: '',
    website: '',
  });

  const [editingField, setEditingField] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthToken(token);

    (async () => {
      try {
        const data = await getMyProfile(token);
        const p = data.myProfile;
        setProfile({
          displayName: p.displayName ?? '',
          avatarUrl: p.avatarUrl ?? '',
          location: p.location ?? '',
          slug: p.slug ?? '',
        });

        try {
          const creatorData = await getMyCreatorProfile(token);
          const c = creatorData.myCreatorProfile;
          if (c) {
            setCreatorProfile({
              isPublic: c.isPublic,
              creatorBio: c.creatorBio ?? '',
              primaryCategory: c.primaryCategory ?? '',
              highlights: c.highlights ?? '',
              website: c.website ?? '',
            });
          }
        } catch (e) {
          console.warn('Failed to load creator profile', e);
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
    setError(null);
    setSuccess(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const saveField = async (field: string) => {
    if (!authToken) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (field.startsWith('creator.')) {
        const creatorField = field.replace('creator.', '');
        const updated = await updateMyCreatorProfile(authToken, {
          [creatorField]: editValue.trim() || undefined,
        });
        setCreatorProfile(prev => ({
          ...prev,
          [creatorField]: updated.updateMyCreatorProfile[creatorField as keyof typeof updated.updateMyCreatorProfile] ?? '',
        }));
      } else {
        const updated = await updateMyProfile(authToken, {
          [field]: editValue.trim() || undefined,
        });
        setProfile(prev => ({
          ...prev,
          [field]: updated.updateMyProfile[field as keyof typeof updated.updateMyProfile] ?? '',
        }));
      }
      setSuccess('Updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      setEditingField(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCreatorPublic = async () => {
    if (!authToken) return;
    setSaving(true);
    try {
      const updated = await updateMyCreatorProfile(authToken, {
        isPublic: !creatorProfile.isPublic,
      });
      setCreatorProfile(prev => ({
        ...prev,
        isPublic: updated.updateMyCreatorProfile.isPublic,
      }));
      setSuccess(updated.updateMyCreatorProfile.isPublic ? 'Creator profile is now public' : 'Creator profile is now private');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading profile...</CardTitle>
            <CardDescription>Please wait while we fetch your profile details.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 pt-12 md:px-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
              {isAdmin && userRole && (
                <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-700 gap-1">
                  <Shield className="h-3 w-3" />
                  {getRoleDisplayName(userRole)}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAdmin ? 'Manage your admin profile settings' : 'Manage your profile and creator settings'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && profile.slug && (
              <Button variant="outline" onClick={() => router.push(`/profile/${profile.slug}`)}>
                View Public Profile
              </Button>
            )}
            <Button variant="destructive" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-md border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your basic profile details visible across the platform</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Display Name */}
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    className="h-24 w-24 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted text-3xl font-semibold text-muted-foreground ring-2 ring-border">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <EditableField
                  label="Display Name"
                  field="displayName"
                  value={profile.displayName}
                  editingField={editingField}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onCancel={cancelEdit}
                  onSave={saveField}
                  onEditValueChange={setEditValue}
                  saving={saving}
                  required
                />
                <EditableField
                  label="Avatar URL"
                  field="avatarUrl"
                  value={profile.avatarUrl}
                  editingField={editingField}
                  editValue={editValue}
                  onStartEdit={startEdit}
                  onCancel={cancelEdit}
                  onSave={saveField}
                  onEditValueChange={setEditValue}
                  saving={saving}
                  placeholder="https://..."
                />
              </div>
            </div>


            {/* Location and Slug */}
            <EditableField
              label="Location"
              field="location"
              value={profile.location}
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onCancel={cancelEdit}
              onSave={saveField}
              onEditValueChange={setEditValue}
              saving={saving}
              icon={<MapPin className="h-4 w-4" />}
              placeholder="City, Country"
            />

            <EditableField
              label="Profile Slug"
              field="slug"
              value={profile.slug}
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onCancel={cancelEdit}
              onSave={saveField}
              onEditValueChange={setEditValue}
              saving={saving}
              icon={<Hash className="h-4 w-4" />}
              placeholder="your-username"
              helperText="Used in your public profile URL (lowercase, numbers, hyphens only)"
            />
          </CardContent>
        </Card>

        {/* Creator Profile Card - Hidden for Admins */}
        {!isAdmin && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Creator Profile
                  {creatorProfile.isPublic && (
                    <Badge variant="outline" className="border-emerald-500 bg-emerald-500/10 text-emerald-700">
                      PUBLIC
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Additional information shown on your public creator profile
                </CardDescription>
              </div>
              <Button
                variant={creatorProfile.isPublic ? 'outline' : 'default'}
                size="sm"
                onClick={toggleCreatorPublic}
                disabled={saving}
              >
                {creatorProfile.isPublic ? 'Make Private' : 'Make Public'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <EditableField
              label="Creator Bio"
              field="creator.creatorBio"
              value={creatorProfile.creatorBio}
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onCancel={cancelEdit}
              onSave={saveField}
              onEditValueChange={setEditValue}
              saving={saving}
              multiline
              placeholder="Describe your work, experience, and what supporters can expect..."
              helperText="Up to 1000 characters"
            />

            <EditableField
              label="Primary Category"
              field="creator.primaryCategory"
              value={creatorProfile.primaryCategory}
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onCancel={cancelEdit}
              onSave={saveField}
              onEditValueChange={setEditValue}
              saving={saving}
              placeholder="e.g. Music, Games, Education"
            />

            <EditableField
              label="Highlights"
              field="creator.highlights"
              value={creatorProfile.highlights}
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onCancel={cancelEdit}
              onSave={saveField}
              onEditValueChange={setEditValue}
              saving={saving}
              multiline
              placeholder="Key achievements, notable projects, or what makes your work unique..."
            />

            <EditableField
              label="Website"
              field="creator.website"
              value={creatorProfile.website}
              editingField={editingField}
              editValue={editValue}
              onStartEdit={startEdit}
              onCancel={cancelEdit}
              onSave={saveField}
              onEditValueChange={setEditValue}
              saving={saving}
              icon={<Globe className="h-4 w-4" />}
              placeholder="https://your-site.com"
              helperText="External website or portfolio link"
            />
          </CardContent>
        </Card>
        )}
      </div>
    </main>
  );
}

interface EditableFieldProps {
  label: string;
  field: string;
  value: string;
  editingField: string | null;
  editValue: string;
  onStartEdit: (field: string, value: string) => void;
  onCancel: () => void;
  onSave: (field: string) => void;
  onEditValueChange: (value: string) => void;
  saving: boolean;
  multiline?: boolean;
  required?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  helperText?: string;
}

function EditableField({
  label,
  field,
  value,
  editingField,
  editValue,
  onStartEdit,
  onCancel,
  onSave,
  onEditValueChange,
  saving,
  multiline = false,
  required = false,
  icon,
  placeholder,
  helperText,
}: EditableFieldProps) {
  const isEditing = editingField === field;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartEdit(field, value)}
            className="h-8 gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {multiline ? (
            <Textarea
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              placeholder={placeholder}
              rows={4}
              className="resize-none"
              autoFocus
            />
          ) : (
            <Input
              value={editValue}
              onChange={(e) => onEditValueChange(e.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onSave(field)}
              disabled={saving || (required && !editValue.trim())}
              className="gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} className="gap-1.5">
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-muted/30 px-3 py-2 min-h-[2.5rem] flex items-center">
          {value ? (
            <div className="flex items-center gap-2 text-sm">
              {icon}
              <span className={multiline ? 'whitespace-pre-wrap' : ''}>{value}</span>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              {placeholder || `No ${label.toLowerCase()} set`}
            </span>
          )}
        </div>
      )}

      {helperText && !isEditing && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
