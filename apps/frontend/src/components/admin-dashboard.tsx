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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getPendingCampaigns, approveCampaign, rejectCampaign, Campaign } from '@/lib/graphql';
import { Shield, CheckCircle, XCircle, Clock, AlertCircle, Users, FileCheck } from 'lucide-react';

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
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

interface AdminDashboardProps {
  authToken: string;
}

export function AdminDashboard({ authToken }: AdminDashboardProps) {
  const router = useRouter();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loadPendingCampaigns = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPendingCampaigns(authToken);
      setCampaigns(data.pendingCampaigns ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pending campaigns');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  React.useEffect(() => {
    loadPendingCampaigns();
  }, [loadPendingCampaigns]);

  const handleApprove = async (campaignId: string, campaignName: string) => {
    try {
      setActionLoading(campaignId);
      setError(null);
      await approveCampaign(authToken, campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      setSuccessMessage(`Campaign "${campaignName}" has been approved and is now live.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to approve campaign');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (campaignId: string, campaignName: string) => {
    try {
      setActionLoading(campaignId);
      setError(null);
      await rejectCampaign(authToken, campaignId);
      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      setSuccessMessage(`Campaign "${campaignName}" has been rejected.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reject campaign');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-12 md:px-10">
      {/* Header */}
      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Admin Dashboard
            </h1>
            <Badge variant="outline" className="border-red-500 bg-red-500/10 text-red-700 gap-1">
              <Shield className="h-3 w-3" />
              Admin
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Review and approve campaign submissions from creators.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push('/profile')}>
          Edit profile
        </Button>
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="space-y-2 pb-4">
            <CardDescription className="uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Pending Review
            </CardDescription>
            <CardTitle className="text-3xl font-semibold">{campaigns.length}</CardTitle>
            <p className="text-xs font-medium text-amber-600">Awaiting your approval</p>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="space-y-2 pb-4">
            <CardDescription className="uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Unique Creators
            </CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {new Set(campaigns.map(c => c.creator?.id)).size}
            </CardTitle>
            <p className="text-xs font-medium text-muted-foreground">Submitted campaigns</p>
          </CardHeader>
        </Card>

        <Card className="border-border/80 bg-card shadow-sm">
          <CardHeader className="space-y-2 pb-4">
            <CardDescription className="uppercase tracking-wide text-[11px] flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5" />
              Total Goal Amount
            </CardDescription>
            <CardTitle className="text-3xl font-semibold">
              {formatCurrency(campaigns.reduce((sum, c) => sum + c.goal, 0))}
            </CardTitle>
            <p className="text-xs font-medium text-muted-foreground">Combined funding targets</p>
          </CardHeader>
        </Card>
      </section>

      {/* Pending Campaigns Table */}
      <Card className="border-border shadow-subtle">
        <CardHeader>
          <CardTitle>Campaigns Pending Review</CardTitle>
          <CardDescription>
            Review campaign details and approve or reject submissions. Approved campaigns will become visible to all users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading pending campaigns...</div>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium text-foreground">All caught up!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                There are no campaigns pending review at this time.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs uppercase tracking-wide">Campaign</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Creator</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Category</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Goal</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Submitted</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell className="space-y-1 max-w-xs">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {campaign.name}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {campaign.creator?.email ?? 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {campaign.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(campaign.goal)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(campaign.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                            onClick={() => handleApprove(campaign.id, campaign.name)}
                            disabled={actionLoading === campaign.id}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                            onClick={() => handleReject(campaign.id, campaign.name)}
                            disabled={actionLoading === campaign.id}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

