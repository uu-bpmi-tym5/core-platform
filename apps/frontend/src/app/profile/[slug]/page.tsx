'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Globe, ArrowLeft, Calendar } from 'lucide-react';
import { getPublicProfileBySlug, Profile, CreatorProfile } from '@/lib/graphql';

interface Campaign {
  id: string;
  name: string;
  description: string;
  category: string;
  goal: number;
  currentAmount: number;
  status: string;
  createdAt: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [creatorProfile, setCreatorProfile] = React.useState<CreatorProfile | null>(null);
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);

  React.useEffect(() => {
    if (!slug) return;

    (async () => {
      try {
        const data = await getPublicProfileBySlug(slug);
        setProfile(data.publicProfileBySlug.profile);
        setCreatorProfile(data.publicProfileBySlug.creatorProfile ?? null);
        setCampaigns(data.publicProfileBySlug.campaigns ?? []);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load profile';
        setError(message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading profile...</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Profile not found</CardTitle>
            <CardDescription>{error || 'The profile you are looking for does not exist.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pt-12 md:px-10">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => router.back()} className="w-fit gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Profile Header */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-32 w-32 rounded-full object-cover ring-4 ring-border"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-muted text-5xl font-bold text-muted-foreground ring-4 ring-border">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">{profile.displayName}</h1>
                {creatorProfile?.isPublic && (
                  <Badge variant="outline" className="border-emerald-500 bg-emerald-500/10 text-emerald-700">
                    CREATOR
                  </Badge>
                )}
              </div>
              {creatorProfile?.primaryCategory && (
                <p className="mt-1 text-sm text-muted-foreground">{creatorProfile.primaryCategory}</p>
              )}
            </div>


            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>Joined {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Creator Bio */}
        {creatorProfile?.isPublic && creatorProfile.creatorBio && (
          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 whitespace-pre-wrap">{creatorProfile.creatorBio}</p>
            </CardContent>
          </Card>
        )}

        {/* Highlights */}
        {creatorProfile?.isPublic && creatorProfile.highlights && (
          <Card>
            <CardHeader>
              <CardTitle>Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground/90 whitespace-pre-wrap">{creatorProfile.highlights}</p>
            </CardContent>
          </Card>
        )}

        {/* Campaigns */}
        {campaigns.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Campaigns</h2>
              <p className="text-sm text-muted-foreground">Approved campaigns by {profile.displayName}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push(`/campaigns/${campaign.id}`)}>
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit mb-2">{campaign.category}</Badge>
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{campaign.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold text-lg">
                          ${campaign.currentAmount.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground">
                          of ${campaign.goal.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${Math.min((campaign.currentAmount / campaign.goal) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {Math.round((campaign.currentAmount / campaign.goal) * 100)}% funded
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {campaigns.length === 0 && creatorProfile?.isPublic && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No campaigns yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

