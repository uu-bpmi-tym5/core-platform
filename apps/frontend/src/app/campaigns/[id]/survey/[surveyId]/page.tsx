'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { getSurveyById } from '@/lib/graphql';
import { SurveyResponseForm } from '@/components/survey-response-form';
import type { CampaignSurvey } from '@/lib/graphql';

export default function SurveyPage() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.surveyId as string;

  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [survey, setSurvey] = React.useState<CampaignSurvey | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthToken(token);
  }, [router]);

  React.useEffect(() => {
    async function loadSurvey() {
      if (!surveyId) return;

      try {
        setLoading(true);
        setError(null);
        const result = await getSurveyById(surveyId);
        setSurvey(result.campaignSurvey);
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Failed to load survey';
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadSurvey();
  }, [surveyId]);

  if (loading) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </main>
    );
  }

  if (error || !survey || !authToken) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Survey not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {error || 'The survey you are looking for does not exist.'}
            </p>
            <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pt-8 md:px-10">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push(`/campaigns/${survey.campaignId}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Campaign
          </Button>
        </div>

        <SurveyResponseForm
          survey={survey}
          authToken={authToken}
          onResponseSubmitted={() => {
            setTimeout(() => {
              router.push(`/campaigns/${survey.campaignId}`);
            }, 2000);
          }}
        />
      </div>
    </main>
  );
}

