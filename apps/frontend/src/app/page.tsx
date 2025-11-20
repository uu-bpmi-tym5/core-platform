'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select } from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

type CampaignStatus = 'Draft' | 'PendingReview' | 'Approved' | 'Rejected';

interface Campaign {
  id: string;
  name: string;
  category: string;
  fundingTarget: number;
  raisedAmount: number;
  status: CampaignStatus;
  createdAt: string;
  updatedAt: string;
  deadline: string;
  owner: string;
  reviewDurationDays?: number;
  health: 'On Track' | 'At Risk' | 'Needs Attention';
  highlights: string[];
}

interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  actor: string;
  timestamp: string;
  status: 'info' | 'success' | 'warning';
}

type MetricTrend = 'up' | 'steady' | 'success' | 'info';

const initialCampaigns: Campaign[] = [
  {
    id: 'cmp-1001',
    name: 'Solar Neighborhood Microgrids',
    category: 'Clean Energy',
    fundingTarget: 120000,
    raisedAmount: 78000,
    status: 'PendingReview',
    createdAt: '2024-03-04T09:00:00Z',
    updatedAt: '2024-03-12T15:30:00Z',
    deadline: '2024-06-30T00:00:00Z',
    owner: 'Amelia Stone',
    reviewDurationDays: 6,
    health: 'On Track',
    highlights: ['Financial model uploaded', 'Legal docs verified'],
  },
  {
    id: 'cmp-1002',
    name: 'AI-Powered Urban Farming Pods',
    category: 'AgriTech',
    fundingTarget: 90000,
    raisedAmount: 91000,
    status: 'Approved',
    createdAt: '2024-02-10T10:00:00Z',
    updatedAt: '2024-02-18T13:12:00Z',
    deadline: '2024-05-15T00:00:00Z',
    owner: 'Lena Brooks',
    reviewDurationDays: 4,
    health: 'On Track',
    highlights: ['Pitch deck refreshed', 'Press kit scheduled'],
  },
  {
    id: 'cmp-1003',
    name: 'Circular Fashion Collective',
    category: 'Consumer Goods',
    fundingTarget: 65000,
    raisedAmount: 32000,
    status: 'Draft',
    createdAt: '2024-03-15T14:00:00Z',
    updatedAt: '2024-03-17T08:45:00Z',
    deadline: '2024-07-01T00:00:00Z',
    owner: 'Joan Rivers',
    health: 'Needs Attention',
    highlights: ['Storyline draft ready', 'Awaiting supply chain letter'],
  },
  {
    id: 'cmp-1004',
    name: 'Blue Carbon Ocean Farms',
    category: 'Climate & Sustainability',
    fundingTarget: 150000,
    raisedAmount: 45000,
    status: 'PendingReview',
    createdAt: '2024-03-02T11:22:00Z',
    updatedAt: '2024-03-11T09:14:00Z',
    deadline: '2024-06-05T00:00:00Z',
    owner: 'Diego Mendez',
    reviewDurationDays: 5,
    health: 'On Track',
    highlights: ['Impact metrics validated', 'Brand assets approved'],
  },
  {
    id: 'cmp-1005',
    name: 'Neighborhood EV Charging Hubs',
    category: 'Mobility',
    fundingTarget: 110000,
    raisedAmount: 26000,
    status: 'Draft',
    createdAt: '2024-03-13T16:30:00Z',
    updatedAt: '2024-03-16T17:05:00Z',
    deadline: '2024-07-20T00:00:00Z',
    owner: 'Kai Duncan',
    health: 'At Risk',
    highlights: ['Awaiting utility partnership MOU'],
  },
];

const initialReadiness: ReadinessItem[] = [
  {
    id: 'pitch',
    label: 'Pitch narrative locked',
    description: 'Executive summary reviewed and aligned with investor messaging.',
    completed: true,
  },
  {
    id: 'financials',
    label: 'Financial projections uploaded',
    description: '3-year forecast with sensitivity analysis attached.',
    completed: false,
  },
  {
    id: 'due-diligence',
    label: 'Due diligence data room updated',
    description: 'Cap table, legal docs, and compliance checklist verified.',
    completed: true,
  },
  {
    id: 'marketing',
    label: 'Launch marketing toolkit drafted',
    description: 'Email/social copy and press FAQ ready for review.',
    completed: false,
  },
];

const activityLog: ActivityItem[] = [
  {
    id: 'act-001',
    title: 'Campaign submitted to moderation',
    description: 'Solar Neighborhood Microgrids moved to review queue.',
    actor: 'Amelia Stone',
    timestamp: '2024-03-12T15:30:00Z',
    status: 'info',
  },
  {
    id: 'act-002',
    title: 'Legal advisor feedback received',
    description: 'Updated investor agreement template for upcoming launch.',
    actor: 'Legal Ops',
    timestamp: '2024-03-11T12:10:00Z',
    status: 'warning',
  },
  {
    id: 'act-003',
    title: 'Campaign approved',
    description: 'AI-Powered Urban Farming Pods cleared with 4-day review turnaround.',
    actor: 'Moderation Team',
    timestamp: '2024-02-18T13:12:00Z',
    status: 'success',
  },
  {
    id: 'act-004',
    title: 'New asset uploaded',
    description: 'Circular Fashion Collective added community impact visuals.',
    actor: 'Joan Rivers',
    timestamp: '2024-03-17T08:45:00Z',
    status: 'info',
  },
];

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: amount >= 100000 ? 0 : 0,
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

const statusBadgeVariant: Record<CampaignStatus, 'outline' | 'warning' | 'success' | 'destructive'> = {
  Draft: 'outline',
  PendingReview: 'warning',
  Approved: 'success',
  Rejected: 'destructive',
};

export default function CampaignManagementDashboard() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>(initialCampaigns);
  const [readiness, setReadiness] = React.useState<ReadinessItem[]>(initialReadiness);
  const [formState, setFormState] = React.useState({
    name: '',
    category: '',
    fundingTarget: '',
    launchDate: '',
    summary: '',
  });
  const [formError, setFormError] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [recentlyCreated, setRecentlyCreated] = React.useState<string | null>(null);

  const metrics = React.useMemo(() => {
    const draftCount = campaigns.filter((c) => c.status === 'Draft').length;
    const pendingCount = campaigns.filter((c) => c.status === 'PendingReview').length;
    const approvedCount = campaigns.filter((c) => c.status === 'Approved').length;
    const submittedThisWeek = campaigns.filter((c) => {
      const created = new Date(c.createdAt);
      const now = new Date();
      const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }).length;

    const reviewDurations = campaigns
      .filter((c) => c.status === 'Approved' || c.status === 'PendingReview')
      .map((c) => c.reviewDurationDays ?? 0);
    const avgReviewTime =
      reviewDurations.length > 0
        ? Math.round(reviewDurations.reduce((acc, curr) => acc + curr, 0) / reviewDurations.length)
        : 0;

    const approvalConversion =
      approvedCount + pendingCount === 0
        ? 0
        : Math.round((approvedCount / (approvedCount + pendingCount)) * 100);

    return {
      draftCount,
      pendingCount,
      approvedCount,
      submittedThisWeek,
      avgReviewTime,
      approvalConversion,
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
            campaign.owner.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [campaigns, categoryFilter, search]);

  const groupedCampaigns = React.useMemo(() => {
    return {
      Draft: filteredCampaigns.filter((c) => c.status === 'Draft'),
      PendingReview: filteredCampaigns.filter((c) => c.status === 'PendingReview'),
      Approved: filteredCampaigns.filter((c) => c.status === 'Approved'),
      Rejected: filteredCampaigns.filter((c) => c.status === 'Rejected'),
    };
  }, [filteredCampaigns]);

  const totalCampaigns = campaigns.length;

  const onFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!formState.name || !formState.category || !formState.fundingTarget) {
      setFormError('Please provide a name, category, and funding target to save a draft.');
      return;
    }

    const newCampaign: Campaign = {
      id: `cmp-${Date.now()}`,
      name: formState.name.trim(),
      category: formState.category,
      fundingTarget: Number(formState.fundingTarget),
      raisedAmount: 0,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: formState.launchDate || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      owner: 'You',
      health: 'On Track',
      highlights: ['Draft created via dashboard', 'Add financial attachments next'],
    };

    setCampaigns((prev) => [newCampaign, ...prev]);
    setFormState({
      name: '',
      category: '',
      fundingTarget: '',
      launchDate: '',
      summary: '',
    });
    setRecentlyCreated(newCampaign.name);
  };

  const toggleReadiness = (id: string) => {
    setReadiness((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  return (
    <main className="bg-muted/40 pb-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-12 md:px-10">
        <section>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Creator workspace
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Campaign management dashboard
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  Track creation progress, prepare submissions, and keep your campaigns
                  review-ready with a single, transparent flow.
                </p>
              </div>
            </div>
            <div className="flex flex-none flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Button variant="outline" size="sm">
                Download checklist
              </Button>
              <Button size="sm">Start new pitch session</Button>
            </div>
          </div>
          {recentlyCreated && (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary-foreground">
              Draft "{recentlyCreated}" saved. Continue enriching documents before submitting for moderation.
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Active drafts"
            value={metrics.draftCount}
            helper="+2 vs last week"
            trend="up"
          />
          <MetricCard
            label="Pending reviews"
            value={metrics.pendingCount}
            helper={`${metrics.avgReviewTime} day avg review`}
            trend="steady"
          />
          <MetricCard
            label="Approved launches"
            value={metrics.approvedCount}
            helper={`${metrics.approvalConversion}% approval rate`}
            trend="success"
          />
          <MetricCard
            label="Submitted this week"
            value={metrics.submittedThisWeek}
            helper="Based on creation timestamps"
            trend="info"
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card className="border-border shadow-subtle">
            <CardHeader className="space-y-4">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="space-y-1">
                  <CardTitle>Campaign pipeline</CardTitle>
                  <CardDescription>
                    Review drafts, monitor moderation, and ensure documentation stays current.
                  </CardDescription>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Input
                    placeholder="Search by campaign or owner"
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
                  description="Awaiting documentation completion."
                />
                <PipelineStatus
                  label="Pending review"
                  value={metrics.pendingCount}
                  total={totalCampaigns}
                  description="In moderation queue."
                />
                <PipelineStatus
                  label="Approved"
                  value={metrics.approvedCount}
                  total={totalCampaigns}
                  description="Ready for supporter launch."
                />
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="Draft">
                <TabsList className="mb-2">
                  <TabsTrigger value="Draft">Drafts</TabsTrigger>
                  <TabsTrigger value="PendingReview">Pending review</TabsTrigger>
                  <TabsTrigger value="Approved">Approved</TabsTrigger>
                </TabsList>

                {(['Draft', 'PendingReview', 'Approved'] as CampaignStatus[]).map(
                  (status) => (
                    <TabsContent key={status} value={status}>
                      <CampaignTable campaigns={groupedCampaigns[status]} status={status} />
                    </TabsContent>
                  ),
                )}
              </Tabs>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle>Create a quick draft</CardTitle>
                <CardDescription>
                  Capture the essentials now. You can enrich assets before submitting to moderation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={onFormSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Campaign name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Community Solar Blocks"
                      value={formState.name}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      id="category"
                      value={formState.category}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, category: event.target.value }))
                      }
                    >
                      <option value="">Select category</option>
                      <option value="Clean Energy">Clean Energy</option>
                      <option value="AgriTech">AgriTech</option>
                      <option value="Climate & Sustainability">Climate & Sustainability</option>
                      <option value="Mobility">Mobility</option>
                      <option value="Consumer Goods">Consumer Goods</option>
                      <option value="Deep Tech">Deep Tech</option>
                    </Select>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="fundingTarget">Funding target (USD)</Label>
                      <Input
                        id="fundingTarget"
                        type="number"
                        min={1000}
                        step={1000}
                        placeholder="50000"
                        value={formState.fundingTarget}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            fundingTarget: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="launchDate">Target launch date</Label>
                      <Input
                        id="launchDate"
                        type="date"
                        value={formState.launchDate}
                        onChange={(event) =>
                          setFormState((prev) => ({
                            ...prev,
                            launchDate: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="summary">Creator storyline</Label>
                    <Textarea
                      id="summary"
                      placeholder="Summarize your vision, traction, and community impact goals."
                      value={formState.summary}
                      onChange={(event) =>
                        setFormState((prev) => ({ ...prev, summary: event.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      This helps moderators understand your narrative before reviewing attachments.
                    </p>
                  </div>
                  {formError && (
                    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {formError}
                    </p>
                  )}
                  <CardFooter className="px-0">
                    <Button type="submit" className="w-full">
                      Save draft campaign
                    </Button>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>

            <Card className="border-border shadow-subtle">
              <CardHeader>
                <CardTitle>Readiness checklist</CardTitle>
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

        <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <Card className="border-border shadow-subtle">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>
                Transparent updates to keep the creator team and moderators aligned.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {activityLog.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-border/80 bg-background/80 p-4 shadow-sm"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {item.actor
                      .split(' ')
                      .map((segment) => segment[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{item.title}</p>
                      <Badge
                        variant={
                          item.status === 'success'
                            ? 'success'
                            : item.status === 'warning'
                            ? 'warning'
                            : 'secondary'
                        }
                      >
                        {item.status === 'success'
                          ? 'Success'
                          : item.status === 'warning'
                          ? 'Action needed'
                          : 'Update'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground/80">
                      {item.actor} • {formatDate(item.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border shadow-subtle">
            <CardHeader>
              <CardTitle>Launch playbook</CardTitle>
              <CardDescription>
                Actions to finalize before submitting a creator campaign.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <PlaybookItem
                title="Evidence of traction"
                description="Attach customer validation, letters of intent, or early adopter metrics."
                status="On Track"
              />
              <PlaybookItem
                title="Impact storytelling assets"
                description="Upload image/video assets that highlight the community benefit."
                status="Needs Attention"
              />
              <PlaybookItem
                title="Compliance attestation"
                description="Confirm legal documents (KYC/AML, investment terms) are current."
                status="On Track"
              />
              <PlaybookItem
                title="Activation timeline"
                description="Outline marketing milestones for the first 30 days post launch."
                status="In Review"
              />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View detailed playbook
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>
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
}: {
  campaigns: Campaign[];
  status: CampaignStatus;
}) {
  if (campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-10 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No campaigns in {status.toLowerCase()} state.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Create a draft or adjust your filters to see more campaigns.
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
            <TableHead className="text-xs uppercase tracking-wide">Owner</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Target</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Progress</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
            <TableHead className="text-xs uppercase tracking-wide">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => {
            const progress = Math.round(
              campaign.fundingTarget === 0
                ? 0
                : (campaign.raisedAmount / campaign.fundingTarget) * 100,
            );

            return (
              <TableRow key={campaign.id}>
                <TableCell className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {campaign.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{campaign.category}</span>
                    <span>•</span>
                    <span>{campaign.health}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {campaign.owner}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatCurrency(campaign.fundingTarget)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Progress value={progress} />
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(campaign.raisedAmount)} raised
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[campaign.status]}>
                    {campaign.status === 'PendingReview' ? 'Pending review' : campaign.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(campaign.updatedAt)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function PlaybookItem({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: 'On Track' | 'Needs Attention' | 'In Review';
}) {
  const statusVariant =
    status === 'On Track'
      ? 'success'
      : status === 'Needs Attention'
      ? 'warning'
      : 'secondary';

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Badge variant={statusVariant}>{status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
