'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  CampaignSurvey,
  submitSurveyResponse,
  hasUserRespondedToSurvey
} from '@/lib/graphql';

interface SurveyResponseFormProps {
  survey: CampaignSurvey;
  authToken: string;
  onResponseSubmitted?: () => void;
}

export function SurveyResponseForm({ survey, authToken, onResponseSubmitted }: SurveyResponseFormProps) {
  const [answers, setAnswers] = React.useState<string[]>(survey.questions.map(() => ''));
  const [loading, setLoading] = React.useState(false);
  const [checkingResponse, setCheckingResponse] = React.useState(true);
  const [hasResponded, setHasResponded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  React.useEffect(() => {
    async function checkResponse() {
      try {
        const result = await hasUserRespondedToSurvey(authToken, survey.id);
        setHasResponded(result.hasUserRespondedToSurvey);
      } catch (err) {
        console.error('Failed to check response:', err);
      } finally {
        setCheckingResponse(false);
      }
    }
    checkResponse();
  }, [survey.id, authToken]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validAnswers = answers.filter(a => a.trim() !== '');
    if (validAnswers.length !== survey.questions.length) {
      setError('Please answer all questions');
      return;
    }

    setLoading(true);

    try {
      await submitSurveyResponse(authToken, survey.id, answers);
      setSuccess(true);
      setHasResponded(true);
      onResponseSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setLoading(false);
    }
  };

  if (checkingResponse) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (hasResponded) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{survey.title}</CardTitle>
            <Badge variant="secondary">Completed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>You have already responded to this survey. Thank you for your feedback!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!survey.isActive) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{survey.title}</CardTitle>
            <Badge variant="secondary">Closed</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertCircle className="h-5 w-5" />
            <span>This survey is no longer accepting responses.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5" />
            <span>Thank you for your feedback! Your response has been submitted.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{survey.title}</CardTitle>
            <Badge>Active</Badge>
          </div>
          <CardDescription>
            Please answer the following questions. Your feedback is valuable to the campaign creator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {survey.questions.map((question, index) => (
            <div key={index} className="space-y-2">
              <Label htmlFor={`question-${index}`}>
                {index + 1}. {question}
              </Label>
              <Textarea
                id={`question-${index}`}
                value={answers[index]}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={loading}
                rows={3}
                placeholder="Type your answer here..."
              />
            </div>
          ))}

          {error && (
            <div className="flex items-center gap-3 rounded-lg bg-destructive/10 p-3 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Response'
            )}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}

