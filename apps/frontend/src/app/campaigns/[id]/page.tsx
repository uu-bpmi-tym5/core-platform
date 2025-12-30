'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCampaignById, Campaign, formatCurrency } from '@/lib/graphql';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CommentSection } from '@/components/comment-section';
import { Loader2, ArrowLeft, Target, Users } from 'lucide-react';
import { format } from 'date-fns';

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { ContributionForm } from '@/components/contribution-form';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isBackingOpen, setIsBackingOpen] = React.useState(false);

  const fetchCampaign = React.useCallback(async () => {
    try {
      const data = await getCampaignById(id);
      setCampaign(data.campaign);
    } catch (err) {
      console.error('Failed to load campaign:', err);
      setError('Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    if (id) {
      fetchCampaign();
    }
  }, [id, fetchCampaign]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error || 'Campaign not found'}</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const progress = campaign.goal > 0
    ? Math.round((campaign.currentAmount / campaign.goal) * 100)
    : 0;

  return (
    <main className="min-h-screen bg-background pb-12">
      {/* Header / Navigation */}
      <div className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto mt-8 max-w-5xl px-4">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{campaign.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  Created {format(new Date(campaign.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight">{campaign.name}</h1>
              <p className="text-lg text-muted-foreground">{campaign.description}</p>
            </div>

            {/* Campaign Image */}
            {campaign.imageData ? (
              <div className="aspect-video w-full rounded-xl overflow-hidden">
                <img
                  src={campaign.imageData}
                  alt={campaign.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
                No Image Available
              </div>
            )}

            {/* Comments Section */}
            <div className="pt-8 border-t">
              <CommentSection campaignId={campaign.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-8 border-border shadow-sm">
              <CardHeader>
                <CardTitle>Funding Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-3xl font-bold text-primary">
                      {formatCurrency(campaign.currentAmount)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      of {formatCurrency(campaign.goal)} goal
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress}% funded</span>
                    <span>{0} days left</span> {/* Placeholder for days left */}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase">Backers</span>
                    </div>
                    <p className="text-xl font-semibold">0</p> {/* Placeholder for backers count */}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase">Goal</span>
                    </div>
                    <p className="text-xl font-semibold">{formatCurrency(campaign.goal)}</p>
                  </div>
                </div>

                <Dialog open={isBackingOpen} onOpenChange={setIsBackingOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      Back this Project
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogTitle className="sr-only">Back this Project</DialogTitle>
                    <ContributionForm
                      campaignId={campaign.id}
                      campaignName={campaign.name}
                      onSuccess={() => {
                        // Wait a bit for the animation/server update
                        setTimeout(() => {
                          setIsBackingOpen(false);
                          fetchCampaign();
                        }, 1000);
                      }}
                    />
                  </DialogContent>
                </Dialog>

                <p className="text-xs text-center text-muted-foreground">
                  All or nothing. This project will only be funded if it reaches its goal.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Created by</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {campaign.creator?.email.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <p className="font-medium">{campaign.creator?.email || 'Unknown User'}</p>
                    <p className="text-xs text-muted-foreground">Campaign Creator</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
