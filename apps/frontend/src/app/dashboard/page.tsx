'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit2 } from 'lucide-react';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3030/graphql';

// Backend campaign status enum
type CampaignStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'DELETED';

interface Campaign {
  id: string;
  name: string;
  description: string;
  category: string;
  goal: number;
  currentAmount: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  creatorId: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CampaignFormData {
  name: string;
  description: string;
  goal: string;
  category: string;
}

interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

type MetricTrend = 'up' | 'steady' | 'success' | 'info';

const initialReadiness: ReadinessItem[] = [
  {
    id: 'pitch',
    label: 'Campaign description complete',
    description: 'Clear and compelling description of your campaign goals.',
    completed: false,
  },
  {
    id: 'financials',
    label: 'Funding goal set',
    description: 'Realistic funding target based on project needs.',
    completed: false,
  },
  {
    id: 'category',
    label: 'Category selected',
    description: 'Campaign properly categorized for discoverability.',
    completed: false,
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

const statusBadgeVariant: Record<CampaignStatus, 'outline' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  DRAFT: 'outline',
  SUBMITTED: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  DELETED: 'secondary',
};

export default function CampaignManagementDashboard() {
  const router = useRouter();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  // Campaign data
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');

  // Form states
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [campaignForm, setCampaignForm] = React.useState<CampaignFormData>({
    name: '',
    description: '',
    goal: '',
    category: '',
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [formSuccess, setFormSuccess] = React.useState<string | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [campaignToDelete, setCampaignToDelete] = React.useState<string | null>(null);

  // Edit dialog state
  const [editingCampaign, setEditingCampaign] = React.useState<Campaign | null>(null);
  const [editForm, setEditForm] = React.useState<CampaignFormData>({
    name: '',
    description: '',
    goal: '',
    category: '',
  });

  const [readiness, setReadiness] = React.useState<ReadinessItem[]>(initialReadiness);

  const fetchGraphQL = React.useCallback(
    async <T,>(query: string, variables?: Record<string, unknown>): Promise<T> => {
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` }),
        },
        credentials: 'include',
        body: JSON.stringify({ query, variables }),
      });

      const result = await response.json();
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        const message = (result.errors as { message?: string }[])
          .map((e) => e.message ?? 'Unknown error')
          .join(', ');
        throw new Error(message || 'GraphQL error');
      }
      return result.data as T;
    },
    [authToken],
  );

  const loadCampaigns = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchGraphQL<{ myCampaigns: Campaign[] }>(
        `
        query {
          myCampaigns {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
            updatedAt
            creatorId
          }
        }
      `,
      );
      setCampaigns(data.myCampaigns ?? []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchGraphQL]);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    } else {
      router.push('/login');
    }
  }, [router]);

  React.useEffect(() => {
    if (authToken) {
      loadCampaigns();
    }
  }, [authToken, loadCampaigns]);

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!campaignForm.name || !campaignForm.description || !campaignForm.goal || !campaignForm.category) {
      setFormError('All fields are required');
      return;
    }

    try {
      const data = await fetchGraphQL<{ createCampaign: Campaign }>(
        `
        mutation CreateCampaign($input: CreateCampaignInput!) {
          createCampaign(createCampaignInput: $input) {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
            updatedAt
            creatorId
          }
        }
      `,
        {
          input: {
            name: campaignForm.name,
            description: campaignForm.description,
            goal: parseFloat(campaignForm.goal),
            category: campaignForm.category,
          },
        },
      );

      const newCampaign = data.createCampaign;
      setCampaigns((prev) => [newCampaign, ...prev]);
      setCampaignForm({ name: '', description: '', goal: '', category: '' });
      setFormSuccess(`Campaign "${newCampaign.name}" created successfully!`);
      setShowCreateForm(false);

      setTimeout(() => setFormSuccess(null), 5000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create campaign';
      setFormError(message);
    }
  };

  const submitCampaign = async (campaignId: string) => {
    try {
      await fetchGraphQL(
        `
        mutation SubmitCampaign($campaignId: String!) {
          submitCampaign(campaignId: $campaignId) {
            id
            status
          }
        }
      `,
        { campaignId }
      );

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId ? { ...c, status: 'SUBMITTED' as CampaignStatus } : c
        )
      );
    } catch (error: any) {
      console.error('Failed to submit campaign:', error);
    }
  };

  const openDeleteDialog = (campaignId: string) => {
    setCampaignToDelete(campaignId);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCampaignToDelete(null);
  };

  const deleteCampaign = async () => {
    if (!campaignToDelete) return;

    try {
      await fetchGraphQL(
        `
        mutation RemoveCampaign($id: String!) {
          removeCampaign(id: $id)
        }
      `,
        { id: campaignToDelete }
      );

      setCampaigns((prev) => prev.filter((c) => c.id !== campaignToDelete));
      setFormSuccess('Campaign deleted successfully!');
      setTimeout(() => setFormSuccess(null), 5000);
      closeDeleteDialog();
    } catch (error: any) {
      console.error('Failed to delete campaign:', error);
      setFormError(error.message || 'Failed to delete campaign');
      closeDeleteDialog();
    }
  };

  const openEditDialog = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setEditForm({
      name: campaign.name,
      description: campaign.description,
      goal: campaign.goal.toString(),
      category: campaign.category,
    });
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    try {
      const data = await fetchGraphQL<{ updateCampaign: Campaign }>(
        `
        mutation UpdateCampaign($input: UpdateCampaignInput!) {
          updateCampaign(updateCampaignInput: $input) {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
            updatedAt
            creatorId
          }
        }
      `,
        {
          input: {
            id: editingCampaign.id,
            name: editForm.name,
            description: editForm.description,
            goal: parseFloat(editForm.goal),
            category: editForm.category,
          },
        }
      );

      const updatedCampaign = data.updateCampaign;
      setCampaigns((prev) =>
        prev.map((c) => (c.id === updatedCampaign.id ? updatedCampaign : c))
      );
      setEditingCampaign(null);
      setFormSuccess('Campaign updated successfully!');
      setTimeout(() => setFormSuccess(null), 5000);
    } catch (error: any) {
      setFormError(error.message || 'Failed to update campaign');
    }
  };

  const metrics = React.useMemo(() => {
    const draftCount = campaigns.filter((c) => c.status === 'DRAFT').length;
    const submittedCount = campaigns.filter((c) => c.status === 'SUBMITTED').length;
    const approvedCount = campaigns.filter((c) => c.status === 'APPROVED').length;
    const rejectedCount = campaigns.filter((c) => c.status === 'REJECTED').length;

    const createdThisWeek = campaigns.filter((c) => {
      const created = new Date(c.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    const totalRaised = campaigns.reduce((sum, c) => sum + c.currentAmount, 0);
    const totalGoal = campaigns.reduce((sum, c) => sum + c.goal, 0);
    const overallProgress = totalGoal > 0 ? Math.round((totalRaised / totalGoal) * 100) : 0;

    return {
      draftCount,
      submittedCount,
      approvedCount,
      rejectedCount,
      createdThisWeek,
      totalRaised,
      totalGoal,
      overallProgress,
    };
  }, [campaigns]);

  const categories = React.useMemo(() => {
    const unique = new Set<string>();
    campaigns.forEach((campaign) => unique.add(campaign.category));
    return Array.from(unique).sort();
  }, [campaigns]);

  const filteredCampaigns = React.useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesCategory =
        categoryFilter === 'all' ? true : campaign.category === categoryFilter;
      const matchesSearch =
        search.trim().length === 0
          ? true
          : campaign.name.toLowerCase().includes(search.toLowerCase()) ||
            campaign.description.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [campaigns, categoryFilter, search]);

  const groupedCampaigns = React.useMemo(() => {
    return {
      DRAFT: filteredCampaigns.filter((c) => c.status === 'DRAFT'),
      SUBMITTED: filteredCampaigns.filter((c) => c.status === 'SUBMITTED'),
      APPROVED: filteredCampaigns.filter((c) => c.status === 'APPROVED'),
      REJECTED: filteredCampaigns.filter((c) => c.status === 'REJECTED'),
    };
  }, [filteredCampaigns]);

  const totalCampaigns = campaigns.length;

  const toggleReadiness = (id: string) => {
    setReadiness((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  if (!isAuthenticated || loading) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{loading ? 'Loading...' : 'Authentication Required'}</CardTitle>
            <CardDescription>
              {loading ? 'Loading your campaigns' : 'Please login to access the dashboard'}
            </CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/40 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-12 md:px-10">
        <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Campaigns
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your campaigns, track performance, and prepare new launches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => router.push('/profile')}>
              Edit profile
            </Button>
            <Button onClick={() => setShowCreateForm(!showCreateForm)} size="sm">
              {showCreateForm ? 'Cancel' : 'Create New Campaign'}
            </Button>
          </div>
        </header>

        {formSuccess && (
          <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700">
            {formSuccess}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Draft campaigns"
            value={metrics.draftCount}
            helper={`${metrics.createdThisWeek} created this week`}
            trend="info"
          />
          <MetricCard
            label="Under review"
            value={metrics.submittedCount}
            helper="Awaiting approval"
            trend="steady"
          />
          <MetricCard
            label="Approved & Live"
            value={metrics.approvedCount}
            helper={`${formatCurrency(metrics.totalRaised)} raised`}
            trend="success"
          />
          <MetricCard
            label="Overall Progress"
            value={metrics.overallProgress}
            helper={`${formatCurrency(metrics.totalRaised)} of ${formatCurrency(metrics.totalGoal)}`}
            trend="steady"
          />
        </section>

        {showCreateForm && (
          <section>
            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle>Create New Campaign</CardTitle>
                <CardDescription>
                  Fill in the details below to create your campaign. You can edit it later before submitting for review.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createCampaign} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Campaign Name *</Label>
                    <Input
                      id="name"
                      value={campaignForm.name}
                      onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      placeholder="e.g., Community Solar Project"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={campaignForm.description}
                      onChange={(e) => setCampaignForm({ ...campaignForm, description: e.target.value })}
                      placeholder="Describe your campaign goals and vision..."
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="goal">Funding Goal ($) *</Label>
                      <Input
                        id="goal"
                        type="number"
                        min="1"
                        step="1"
                        value={campaignForm.goal}
                        onChange={(e) => setCampaignForm({ ...campaignForm, goal: e.target.value })}
                        placeholder="50000"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Input
                        id="category"
                        value={campaignForm.category}
                        onChange={(e) => setCampaignForm({ ...campaignForm, category: e.target.value })}
                        placeholder="e.g., Clean Energy, Technology"
                        required
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-700">
                      {formError}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Create Campaign
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border shadow-subtle">
            <CardHeader className="space-y-4">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <CardTitle>Your Campaigns</CardTitle>
                  <CardDescription>
                    View and manage all your campaigns in one place.
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Input
                    placeholder="Search campaigns..."
                    className="sm:max-w-xs"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <Select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="sm:max-w-[160px]"
                  >
                    <option value="all">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <PipelineStatus
                  label="Draft"
                  value={metrics.draftCount}
                  total={totalCampaigns}
                  description="Not yet submitted"
                />
                <PipelineStatus
                  label="Under Review"
                  value={metrics.submittedCount}
                  total={totalCampaigns}
                  description="Awaiting approval"
                />
                <PipelineStatus
                  label="Approved"
                  value={metrics.approvedCount}
                  total={totalCampaigns}
                  description="Live campaigns"
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="DRAFT">
                <TabsList className="mb-2">
                  <TabsTrigger value="DRAFT">Drafts ({metrics.draftCount})</TabsTrigger>
                  <TabsTrigger value="SUBMITTED">Under Review ({metrics.submittedCount})</TabsTrigger>
                  <TabsTrigger value="APPROVED">Approved ({metrics.approvedCount})</TabsTrigger>
                </TabsList>

                {(['DRAFT', 'SUBMITTED', 'APPROVED'] as const).map(
                  (status) => (
                    <TabsContent key={status} value={status}>
                      <CampaignTable
                        campaigns={groupedCampaigns[status]}
                        status={status as CampaignStatus}
                        onSubmit={submitCampaign}
                        onDelete={openDeleteDialog}
                        onEdit={openEditDialog}
                      />
                    </TabsContent>
                  ),
                )}
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle>Readiness guide</CardTitle>
                <CardDescription>
                  Ensure the campaign meets transparency and documentation requirements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {readiness.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 transition hover:border-primary/60"
                  >
                    <Checkbox
                      checked={item.completed}
                      onChange={() => toggleReadiness(item.id)}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Delete Campaign</CardTitle>
              <CardDescription>
                Are you sure you want to delete this campaign? This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDeleteDialog}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={deleteCampaign}>
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Dialog */}
      {editingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Campaign</CardTitle>
              <CardDescription>Update your campaign details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateCampaign} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Campaign Name</Label>
                  <Input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-goal">Funding Goal ($)</Label>
                    <Input
                      id="edit-goal"
                      type="number"
                      value={editForm.goal}
                      onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-category">Category</Label>
                    <Input
                      id="edit-category"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditingCampaign(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
  trend,
}: {
  label: string;
  value: number;
  helper: string;
  trend: MetricTrend;
}) {
  const trendStyles: Record<MetricTrend, string> = {
    up: 'text-emerald-600',
    steady: 'text-slate-500',
    success: 'text-primary',
    info: 'text-sky-600',
  };

  return (
    <Card className="border-border/80 bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-2 pb-4">
        <CardDescription className="uppercase tracking-wide text-[11px]">
          {label}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        <p className={`text-xs font-medium ${trendStyles[trend]}`}>{helper}</p>
      </CardHeader>
    </Card>
  );
}

function PipelineStatus({
  label,
  value,
  total,
  description,
}: {
  label: string;
  value: number;
  total: number;
  description: string;
}) {
  const denominator = total === 0 ? 1 : total;
  const percentage = Math.round((value / denominator) * 100);

  return (
    <div className="rounded-lg border border-border/80 bg-background/60 p-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <span className="text-base font-semibold">{value}</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <Progress className="mt-3 h-2.5" value={percentage} />
    </div>
  );
}

function CampaignTable({
  campaigns,
  status,
  onSubmit,
  onDelete,
  onEdit,
}: {
  campaigns: Campaign[];
  status: CampaignStatus;
  onSubmit: (campaignId: string) => void;
  onDelete: (campaignId: string) => void;
  onEdit: (campaign: Campaign) => void;
}) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No {status.toLowerCase()} campaigns found.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {status === 'DRAFT'
            ? 'Create your first campaign to get started!'
            : 'Check other tabs or adjust your filters.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60">
            <TableHead className="text-xs uppercase tracking-wide">Campaign</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Category</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Goal</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Progress</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Updated</TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const progress = campaign.goal > 0
              ? Math.round((campaign.currentAmount / campaign.goal) * 100)
              : 0;

            return (
              <TableRow key={campaign.id}>
                <TableCell className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {campaign.name}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {campaign.description}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {campaign.category}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatCurrency(campaign.goal)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(campaign.currentAmount)} raised
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[campaign.status]}>
                    {campaign.status === 'SUBMITTED' ? 'Under Review' : campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(campaign.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(campaign)}
                      title="Edit Campaign"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    {campaign.status === 'DRAFT' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSubmit(campaign.id)}
                      >
                        Submit
                      </Button>
                    )}
                    {/* Always show Delete so it's clearly visible */}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(campaign.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
