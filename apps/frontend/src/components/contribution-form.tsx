'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Wallet, Heart, CheckCircle2, Loader2 } from 'lucide-react';
import { getWalletBalance, contributeToCampaign } from '@/lib/graphql';

interface ContributionFormProps {
  campaignId: string;
  campaignName: string;
  onSuccess?: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function ContributionForm({ campaignId, campaignName, onSuccess }: ContributionFormProps) {
  const router = useRouter();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [walletBalance, setWalletBalance] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Form fields
  const [amount, setAmount] = React.useState('');
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      loadWalletBalance(token);
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  async function loadWalletBalance(token: string) {
    try {
      setLoading(true);
      const result = await getWalletBalance(token);
      setWalletBalance(result.walletBalance);
    } catch {
      // User might not be logged in or token expired
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const contributionAmount = parseFloat(amount);

    // Validation
    if (!contributionAmount || contributionAmount <= 0) {
      setError('Please enter a valid contribution amount');
      return;
    }

    if (walletBalance !== null && contributionAmount > walletBalance) {
      setError('Insufficient funds in your wallet');
      return;
    }

    try {
      setSubmitting(true);
      await contributeToCampaign(authToken, {
        campaignId,
        amount: contributionAmount,
        message: message.trim() || undefined,
      });

      setSuccess(true);
      setAmount('');
      setMessage('');

      // Update wallet balance locally
      if (walletBalance !== null) {
        setWalletBalance(walletBalance - contributionAmount);
      }

      // Call success callback if provided
      onSuccess?.();

      // Reset success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Contribution failed';
      // Check for insufficient balance error from backend
      if (errorMessage.includes('Nedostatečný zůstatek') || errorMessage.includes('insufficient')) {
        setError('Insufficient funds in your wallet. Please add funds to continue.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const quickAmounts = [5, 10, 25, 50, 100];
  const insufficientFunds = walletBalance !== null && parseFloat(amount) > walletBalance;

  // Not authenticated
  if (!isAuthenticated && !loading) {
    return (
      <Card className="border-2 border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-rose-500" />
            Back This Project
          </CardTitle>
          <CardDescription>Sign in to contribute to this campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/login')} className="w-full">
            Sign in to Contribute
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-rose-500" />
          Back This Project
        </CardTitle>
        <CardDescription>Support &ldquo;{campaignName}&rdquo; with a contribution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Wallet Balance Display */}
        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Wallet Balance</span>
          </div>
          <span className="font-semibold">{formatCurrency(walletBalance ?? 0)}</span>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Thank you for your contribution!</p>
              <p className="text-sm opacity-90">Your support means the world to this project.</p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">{error}</p>
              {error.includes('Insufficient funds') && (
                <Button
                  variant="link"
                  className="h-auto p-0 text-destructive underline"
                  onClick={() => router.push('/wallet')}
                >
                  Add funds to your wallet →
                </Button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Contribution Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`pl-7 ${insufficientFunds ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                disabled={submitting}
              />
            </div>
            {insufficientFunds && (
              <p className="text-sm text-destructive">
                You need {formatCurrency(parseFloat(amount) - (walletBalance ?? 0))} more in your wallet
              </p>
            )}
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((quickAmount) => (
              <Button
                key={quickAmount}
                type="button"
                variant={parseFloat(amount) === quickAmount ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAmount(quickAmount.toString())}
                disabled={submitting}
              >
                ${quickAmount}
              </Button>
            ))}
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder="Leave a message of support..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              disabled={submitting}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitting || !amount || parseFloat(amount) <= 0 || insufficientFunds}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="mr-2 h-4 w-4" />
                Contribute {amount ? formatCurrency(parseFloat(amount)) : ''}
              </>
            )}
          </Button>
        </form>

        {/* Low Balance Warning */}
        {walletBalance !== null && walletBalance < 10 && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>Your balance is low.</span>
            <Button
              variant="link"
              className="h-auto p-0 text-amber-800 underline dark:text-amber-400"
              onClick={() => router.push('/wallet')}
            >
              Add funds
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

