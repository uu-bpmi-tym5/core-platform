'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExportContributionsButton } from '@/components/export-contributions-button';
import {
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BarChart3,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import {
  getCampaignById,
  getCampaignContributions,
  getCampaignContributionStats,
  updateCampaign,
  Campaign,
  CampaignContribution,
  CampaignContributionStats,
} from '@/lib/graphql';

type CampaignStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DELETED';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function calculateProgress(current: number, goal: number) {
  return Math.min((current / goal) * 100, 100);
}

const statusBadgeVariant: Record<CampaignStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
  DELETED: 'secondary',
};

const statusLabel: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Pending Review',
  APPROVED: 'Live',
  REJECTED: 'Rejected',
  DELETED: 'Deleted',
};

export default function CreatorCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [contributions, setContributions] = React.useState<CampaignContribution[]>([]);
  const [stats, setStats] = React.useState<CampaignContributionStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = React.useState(false);
  const [editForm, setEditForm] = React.useState({
    name: '',
    description: '',
    goal: '',
    category: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthToken(token);
  }, [router]);

  const loadData = React.useCallback(async () => {
    if (!authToken || !campaignId) return;

    try {
      setLoading(true);
      setError(null);

      const [campaignRes, contributionsRes, statsRes] = await Promise.all([
        getCampaignById(campaignId),
        getCampaignContributions(authToken, campaignId),
        getCampaignContributionStats(authToken, campaignId),
      ]);

      setCampaign(campaignRes.campaign);
      setContributions(contributionsRes.campaignContributions);
      setStats(statsRes.campaignContributionStats);

      // Initialize edit form
      setEditForm({
        name: campaignRes.campaign.name,
        description: campaignRes.campaign.description,
        goal: campaignRes.campaign.goal.toString(),
        category: campaignRes.campaign.category,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load campaign data';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authToken, campaignId]);

  React.useEffect(() => {
    if (authToken && campaignId) {
      loadData();
    }
  }, [authToken, campaignId, loadData]);

  async function handleSave() {
    if (!authToken || !campaign) return;

    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const result = await updateCampaign(authToken, {
        id: campaign.id,
        name: editForm.name,
        description: editForm.description,
        goal: parseFloat(editForm.goal),
        category: editForm.category,
      });

      setCampaign(result.updateCampaign);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update campaign';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (campaign) {
      setEditForm({
        name: campaign.name,
        description: campaign.description,
        goal: campaign.goal.toString(),
        category: campaign.category,
      });
    }
    setIsEditing(false);
    setSaveError(null);
  }

  if (loading) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Campaign not found</CardTitle>
            <CardDescription>{error || 'The campaign you are looking for does not exist.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const progress = calculateProgress(campaign.currentAmount, campaign.goal);
  const canEdit = campaign.status === 'DRAFT' || campaign.status === 'REJECTED';

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 pt-8 md:px-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>

        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>Campaign updated successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{saveError}</span>
          </div>
        )}

        {/* Campaign Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant={statusBadgeVariant[campaign.status as CampaignStatus]}>
                    {statusLabel[campaign.status as CampaignStatus]}
                  </Badge>
                  <Badge variant="secondary">{campaign.category}</Badge>
                </div>
                {isEditing ? (
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold h-auto py-1"
                  />
                ) : (
                  <CardTitle className="text-2xl">{campaign.name}</CardTitle>
                )}
                <CardDescription>
                  Created on {formatDate(campaign.createdAt)} • Last updated {formatDate(campaign.updatedAt)}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {canEdit && !isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                )}
                {isEditing && (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit} disabled={saving}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Funding Progress */}
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-bold text-primary">
                    {formatCurrency(campaign.currentAmount)}
                  </span>
                  <span className="text-muted-foreground ml-2">
                    raised of {formatCurrency(campaign.goal)} goal
                  </span>
                </div>
                <span className="text-xl font-semibold text-primary">
                  {progress.toFixed(1)}%
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Raised</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.totalAmount ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contributions</p>
                  <p className="text-2xl font-bold">{stats?.totalContributions ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Backers</p>
                  <p className="text-2xl font-bold">{stats?.contributorsCount ?? 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
                  <BarChart3 className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.averageContribution ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Details and Contributions */}
        <Tabs defaultValue="contributions" className="space-y-4">
          <TabsList>
            <TabsTrigger value="contributions" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Contributions
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2">
              <Edit className="h-4 w-4" />
              Campaign Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contributions">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Contribution History
                    </CardTitle>
                    <CardDescription>
                      All contributions made to your campaign
                    </CardDescription>
                  </div>
                  {authToken && contributions.length > 0 && (
                    <ExportContributionsButton campaignId={campaignId} authToken={authToken} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {contributions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold mb-1">No contributions yet</h3>
                    <p className="text-sm text-muted-foreground">
                      When people back your campaign, their contributions will appear here.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Backer</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contributions.map((contribution) => (
                        <TableRow key={contribution.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDateTime(contribution.createdAt)}
                          </TableCell>
                          <TableCell>
                            {contribution.contributor?.email ?? 'Anonymous'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(contribution.amount)}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {contribution.message ? (
                              <div className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{contribution.message}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contribution.isRefunded ? (
                              <Badge variant="destructive">Refunded</Badge>
                            ) : (
                              <Badge variant="default">Completed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>
                  {canEdit ? 'Edit your campaign information' : 'View your campaign information'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{campaign.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    {isEditing ? (
                      <Input
                        id="category"
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{campaign.category}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="goal">Funding Goal</Label>
                    {isEditing ? (
                      <Input
                        id="goal"
                        type="number"
                        value={editForm.goal}
                        onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                      />
                    ) : (
                      <p className="text-foreground">{formatCurrency(campaign.goal)}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Current Amount</Label>
                    <p className="text-foreground">{formatCurrency(campaign.currentAmount)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  {isEditing ? (
                    <Textarea
                      id="description"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={6}
                    />
                  ) : (
                    <p className="text-foreground whitespace-pre-wrap">{campaign.description}</p>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Created</Label>
                    <p className="text-foreground">{formatDateTime(campaign.createdAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Last Updated</Label>
                    <p className="text-foreground">{formatDateTime(campaign.updatedAt)}</p>
                  </div>
                </div>

                {!canEdit && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                    <AlertCircle className="h-5 w-5" />
                    <span>
                      Campaign editing is only available for drafts and rejected campaigns.
                      {campaign.status === 'APPROVED' && ' Your campaign is live!'}
                      {campaign.status === 'SUBMITTED' && ' Your campaign is pending review.'}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

