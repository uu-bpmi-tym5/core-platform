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
import { Heart, MessageCircle, Share2, Bookmark, Target, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function FeedPage() {
  const router = useRouter();
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

  const getCreatorInitials = (campaign: Campaign) => {
    if (campaign.creator?.email) {
      return campaign.creator.email.substring(0, 2).toUpperCase();
    }
    return campaign.name.substring(0, 2).toUpperCase();
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
          <div className="divide-y divide-border">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="bg-background">
                {/* Post Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 cursor-pointer" onClick={() => router.push(`/campaigns/${campaign.id}`)}>
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {getCreatorInitials(campaign)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-semibold text-sm cursor-pointer hover:underline"
                          onClick={() => router.push(`/campaigns/${campaign.id}`)}
                        >
                          {campaign.name}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          {campaign.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatTimeAgo(campaign.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Bookmark className="h-4 w-4" />
                  </Button>
                </div>

                {/* Campaign Image/Preview - Placeholder gradient */}
                <div
                  className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-secondary cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/campaigns/${campaign.id}`)}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-6">
                      <Target className="h-12 w-12 mx-auto mb-3 text-primary/50" />
                      <p className="text-lg font-semibold text-foreground/80">{campaign.name}</p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{
                        width: `${calculateProgress(campaign.currentAmount, campaign.goal)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Funding Stats */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="font-bold text-lg">${campaign.currentAmount.toLocaleString()}</span>
                        <span className="text-muted-foreground text-sm"> pledged</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-semibold text-primary">
                          {calculateProgress(campaign.currentAmount, campaign.goal).toFixed(0)}%
                        </span>
                        <span className="text-muted-foreground"> funded</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>${campaign.goal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="px-4 pb-3">
                  <p className="text-sm text-foreground/90 line-clamp-2">
                    {campaign.description}
                  </p>
                  <button
                    className="text-sm text-muted-foreground hover:text-foreground mt-1"
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  >
                    Read more
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
                      <Heart className="h-5 w-5" />
                      <span className="text-sm">Support</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">Comment</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 h-9 px-3">
                      <Share2 className="h-5 w-5" />
                      <span className="text-sm">Share</span>
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={() => router.push(`/campaigns/${campaign.id}`)}
                  >
                    Back this project
                  </Button>
                </div>
              </article>
            ))}

            {/* Load More */}
            <div className="p-6 text-center">
              <Button onClick={loadCampaigns} variant="outline" disabled={loading}>
                {loading ? 'Loading...' : 'Load more campaigns'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

