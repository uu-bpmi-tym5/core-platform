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
import { fetchGraphQL } from '@/lib/graphql';
import { ArrowLeft, Check, X } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  category: string;
  status: string;
  createdAt: string;
  creator: {
    name: string;
    email: string;
  };
}

export default function AdminPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionStatus, setActionStatus] = React.useState<string | null>(null);

  const loadSubmittedCampaigns = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('You must be logged in as an admin');
      }

      const data = await fetchGraphQL<{ adminCampaigns: Campaign[] }>(`
        query {
          adminCampaigns(status: SUBMITTED) {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
            creator {
              name
              email
            }
          }
        }
      `, undefined, token);
      setCampaigns(data.adminCampaigns);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadSubmittedCampaigns();
  }, []);

  const handleApprove = async (campaignId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      await fetchGraphQL(
        `
        mutation ApproveCampaign($campaignId: String!) {
          approveCampaign(campaignId: $campaignId) {
            id
            status
          }
        }
      `,
        { campaignId },
        token
      );

      setActionStatus('Campaign approved successfully');
      loadSubmittedCampaigns();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    }
  };

  const handleReject = async (campaignId: string) => {
    if (!confirm('Are you sure you want to reject this campaign?')) return;

    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      await fetchGraphQL(
        `
        mutation RejectCampaign($campaignId: String!) {
          rejectCampaign(campaignId: $campaignId) {
            id
            status
          }
        }
      `,
        { campaignId },
        token
      );

      setActionStatus('Campaign rejected');
      loadSubmittedCampaigns();
    } catch (err: any) {
      setActionStatus(`Error: ${err.message}`);
    }
  };

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-12 md:px-10">
        <section>
          <div className="flex flex-col items-start gap-6">
            <Button
              variant="ghost"
              className="pl-0 hover:pl-2 transition-all"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="space-y-3">
              <Badge variant="destructive" className="uppercase tracking-wide">
                Admin Area
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Campaign Approvals
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  Review and approve submitted campaigns
                </p>
              </div>
            </div>
          </div>
        </section>

        {actionStatus && (
          <div className={`p-4 rounded-lg ${
            actionStatus.includes('Error')
              ? 'bg-destructive/10 text-destructive'
              : 'bg-green-500/10 text-green-600'
          }`}>
            {actionStatus}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            Error: {error}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Check className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">All caught up!</h3>
            <p className="text-muted-foreground">No pending campaigns to review.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge variant="outline" className="mb-2">{campaign.category}</Badge>
                      <CardTitle>{campaign.name}</CardTitle>
                      <CardDescription>by {campaign.creator.name} ({campaign.creator.email})</CardDescription>
                    </div>
                    <Badge variant="secondary">{campaign.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-sm">
                    {campaign.description}
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Goal: ${campaign.goal.toLocaleString()}</span>
                    <span>Created: {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(campaign.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve Campaign
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleReject(campaign.id)}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
