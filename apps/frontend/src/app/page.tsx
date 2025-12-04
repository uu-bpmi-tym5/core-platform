'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { getPublicCampaigns, type Campaign } from '@/lib/graphql';
import { useUserRole } from '@/lib/useUserRole';
import { Share2, Bookmark, Target, Settings } from 'lucide-react';

export default function FeedPage() {
  const router = useRouter();
  const { userId } = useUserRole();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPublicCampaigns();
      setCampaigns(data.campaigns);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load campaigns';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isOwnCampaign = (campaign: Campaign) => {
    return userId && campaign.creator?.id === userId;
  };

  const calculateProgress = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <main className="bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <h1 className="text-xl font-bold">Discover</h1>
          <Badge variant="outline" className="text-xs">WIP Feed</Badge>
        </div>
      </div>

      {/* Feed Container */}
      <div className="mx-auto max-w-2xl">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col gap-4 p-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-muted" />
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-20 rounded bg-muted" />
                    </div>
                  </div>
                  <div className="h-48 rounded-lg bg-muted mb-4" />
                  <div className="h-4 w-3/4 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4">
            <Card className="border-destructive">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-destructive mb-3">{error}</p>
                <Button onClick={loadCampaigns} variant="outline" size="sm">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && campaigns.length === 0 && (
          <div className="p-4">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Target className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Be the first to create a campaign and inspire others!
                </p>
                <Button onClick={() => router.push('/dashboard')} size="sm">
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campaign Feed */}
        {!loading && !error && campaigns.length > 0 && (
          <div className="flex flex-col gap-5 p-4">
            {campaigns.map((campaign) => {
              const isOwn = isOwnCampaign(campaign);
              const campaignUrl = isOwn
                ? `/dashboard/campaigns/${campaign.id}`
                : `/campaigns/${campaign.id}`;
              const progress = calculateProgress(campaign.currentAmount, campaign.goal);

              return (
                <Card
                  key={campaign.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Campaign Image/Preview - Full width at top */}
                  <div
                    className="relative aspect-[3/1] bg-gradient-to-br from-primary/15 via-primary/5 to-secondary/20 cursor-pointer"
                    onClick={() => router.push(campaignUrl)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Target className="h-8 w-8 text-primary/30" />
                    </div>
                    {isOwn && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-primary text-primary-foreground text-xs">
                          Your Campaign
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Title & Category */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3
                          className="font-semibold text-base cursor-pointer hover:text-primary transition-colors line-clamp-1"
                          onClick={() => router.push(campaignUrl)}
                        >
                          {campaign.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{campaign.category}</span>
                          <span>•</span>
                          <span>{formatTimeAgo(campaign.createdAt)}</span>
                          {!isOwn && campaign.creator?.email && (
                            <>
                              <span>•</span>
                              <span className="truncate">by {campaign.creator.email.split('@')[0]}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {!isOwn && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 -mt-1">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.description}
                    </p>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          <span className="font-semibold">${campaign.currentAmount.toLocaleString()}</span>
                          <span className="text-muted-foreground"> raised</span>
                        </span>
                        <span className="text-muted-foreground">
                          {progress.toFixed(0)}% of ${campaign.goal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="pt-1">
                      {isOwn ? (
                        <Button
                          className="w-full gap-2"
                          variant="outline"
                          onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}
                        >
                          <Settings className="h-4 w-4" />
                          Manage Campaign
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button
                            className="flex-1"
                            onClick={() => router.push(`/campaigns/${campaign.id}`)}
                          >
                            Back this project
                          </Button>
                          <Button variant="outline" size="icon">
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Load More */}
            <div className="py-4 text-center">
              <Button onClick={loadCampaigns} variant="ghost" disabled={loading}>
                {loading ? 'Loading...' : 'Load more campaigns'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

