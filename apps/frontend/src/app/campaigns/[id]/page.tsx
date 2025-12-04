'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, Target, TrendingUp, Clock } from 'lucide-react';
import { getCampaignById, Campaign } from '@/lib/graphql';
import { useUserRole } from '@/lib/useUserRole';
import { ContributionForm } from '@/components/contribution-form';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function calculateProgress(current: number, goal: number) {
  return Math.min((current / goal) * 100, 100);
}

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  SUBMITTED: 'outline',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId } = useUserRole();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadCampaign = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCampaignById(campaignId);
      setCampaign(result.campaign);

      // Redirect creator to their dashboard view
      if (userId && result.campaign.creator?.id === userId) {
        router.replace(`/dashboard/campaigns/${campaignId}`);
        return;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load campaign';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [campaignId, userId, router]);

  React.useEffect(() => {
    if (!campaignId) return;
    loadCampaign();
  }, [campaignId, loadCampaign]);

  function handleContributionSuccess() {
    // Reload campaign data to get updated funding amount
    loadCampaign();
  }

  if (loading) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading campaign...</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
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
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const progress = calculateProgress(campaign.currentAmount, campaign.goal);
  const isApproved = campaign.status === 'APPROVED';

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pt-12 md:px-10">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="w-fit gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Campaign Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary">{campaign.category}</Badge>
                <Badge variant={statusVariant[campaign.status] || 'outline'}>
                  {campaign.status}
                </Badge>
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {campaign.name}
              </h1>

              {campaign.creator && (
                <p className="text-muted-foreground">
                  by {campaign.creator.email}
                </p>
              )}
            </div>

            {/* Funding Progress */}
            <Card>
              <CardContent className="pt-6">
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
                    <span className="text-lg font-semibold text-primary">
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <Progress value={progress} className="h-3" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span>
                        <span className="font-medium">{formatCurrency(campaign.goal - campaign.currentAmount)}</span>
                        <span className="text-muted-foreground"> to go</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Started {formatDate(campaign.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Description */}
            <Card>
              <CardHeader>
                <CardTitle>About this campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {campaign.description}
                </p>
              </CardContent>
            </Card>

            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Target className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Funding Goal</p>
                      <p className="font-medium">{formatCurrency(campaign.goal)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount Raised</p>
                      <p className="font-medium">{formatCurrency(campaign.currentAmount)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(campaign.createdAt)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="font-medium">{formatDate(campaign.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Contribution Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {isApproved ? (
                <ContributionForm
                  campaignId={campaignId}
                  campaignName={campaign.name}
                  onSuccess={handleContributionSuccess}
                />
              ) : (
                <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20">
                  <CardHeader>
                    <CardTitle className="text-amber-800 dark:text-amber-400">
                      Campaign Not Available
                    </CardTitle>
                    <CardDescription>
                      This campaign is currently not accepting contributions. It may be pending approval or has been paused.
                    </CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

