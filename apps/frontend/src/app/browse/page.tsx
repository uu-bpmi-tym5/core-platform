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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CampaignProgress } from '@/components/campaign-progress';
import { fetchGraphQL } from '@/lib/graphql';
import { ArrowLeft, X } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  category: string;
  status: string;
  createdAt: string;
  daysRemaining?: number;
  contributorsCount?: number;
}

export default function BrowsePage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Investment Modal State
  const [selectedCampaign, setSelectedCampaign] = React.useState<Campaign | null>(null);
  const [investAmount, setInvestAmount] = React.useState('');
  const [investStatus, setInvestStatus] = React.useState('');
  const [isInvestLoading, setIsInvestLoading] = React.useState(false);

  const loadCampaigns = async () => {
    try {
      const data = await fetchGraphQL<{ campaigns: Campaign[] }>(`
        query {
          campaigns {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
            daysRemaining
            contributorsCount
          }
        }
      `);
      setCampaigns(data.campaigns);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadCampaigns();
    // Poll every 5 seconds
    const interval = setInterval(loadCampaigns, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaign) return;

    setIsInvestLoading(true);
    setInvestStatus('');

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('You must be logged in to invest');
      }

      await fetchGraphQL(
        `
        mutation ContributeToCampaign($input: ContributeToCampaignInput!) {
          contributeToCampaign(input: $input) {
            id
            amount
            status
          }
        }
      `,
        {
          input: {
            campaignId: selectedCampaign.id,
            amount: parseFloat(investAmount),
          },
        },
        token
      );

      setInvestStatus('Investment successful!');
      setInvestAmount('');
      // Refresh campaigns to show updated progress
      loadCampaigns();

      // Close modal after short delay
      setTimeout(() => {
        setSelectedCampaign(null);
        setInvestStatus('');
      }, 1500);
    } catch (err: any) {
      setInvestStatus(`Error: ${err.message}`);
    } finally {
      setIsInvestLoading(false);
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
              <Badge variant="secondary" className="uppercase tracking-wide">
                Marketplace
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  Browse Campaigns
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  Discover and support campaigns from the community
                </p>
              </div>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex justify-center py-12">
            <p className="text-muted-foreground">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
            Error: {error}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge>{campaign.category}</Badge>
                    <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1">{campaign.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {campaign.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between gap-4">
                  <CampaignProgress
                    goal={campaign.goal}
                    currentAmount={campaign.currentAmount}
                    contributorsCount={campaign.contributorsCount ?? 0}
                    daysRemaining={campaign.daysRemaining ?? null}
                  />

                  <Button
                    className="w-full"
                    onClick={() => setSelectedCampaign(campaign)}
                    disabled={campaign.status !== 'ACTIVE'}
                  >
                    Back this Project
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Investment Modal Overlay */}
      {selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setSelectedCampaign(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <CardHeader>
              <CardTitle>Back {selectedCampaign.name}</CardTitle>
              <CardDescription>
                Enter the amount you wish to contribute
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleInvest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder="50.00"
                    required
                    autoFocus
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isInvestLoading}
                  >
                    {isInvestLoading ? 'Processing...' : 'Confirm Contribution'}
                  </Button>
                </div>

                {investStatus && (
                  <div className={`p-3 rounded-md text-sm ${
                    investStatus.includes('Error')
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-green-500/10 text-green-600'
                  }`}>
                    {investStatus}
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
