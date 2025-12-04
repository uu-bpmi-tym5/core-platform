"use client";

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  getWalletBalance,
  getWalletTransactions,
  depositMoney,
  withdrawToBank,
  WalletTX,
  TransactionStatus,
  TransactionType,
} from '@/lib/graphql';
import { useUserRole } from '@/lib/useUserRole';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

const statusVariant: Record<TransactionStatus, 'outline' | 'warning' | 'success' | 'destructive' | 'secondary'> = {
  PENDING: 'warning',
  COMPLETED: 'success',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
};

const typeLabel: Record<TransactionType, string> = {
  DEPOSIT: 'Deposit',
  WITHDRAWAL: 'Withdrawal',
  CAMPAIGN_CONTRIBUTION: 'Campaign Contribution',
  REFUND: 'Refund',
  BANK_WITHDRAWAL: 'Bank Withdrawal',
};

export default function WalletPage() {
  const router = useRouter();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [balance, setBalance] = React.useState<number>(0);
  const [transactions, setTransactions] = React.useState<WalletTX[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Forms
  const [depositAmount, setDepositAmount] = React.useState('');
  const [depositReference, setDepositReference] = React.useState('');
  const [withdrawAmount, setWithdrawAmount] = React.useState('');
  const [bankAccount, setBankAccount] = React.useState('');
  const [withdrawDescription, setWithdrawDescription] = React.useState('');

  React.useEffect(() => {
    // Redirect admins away from wallet page
    if (!roleLoading && isAdmin) {
      router.push('/dashboard');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      router.push('/login');
      return;
    }
    setAuthToken(token);
    loadData(token);
  }, [router, isAdmin, roleLoading]);

  async function loadData(token: string) {
    try {
      setLoading(true);
      setError(null);
      const [balRes, txRes] = await Promise.all([
        getWalletBalance(token),
        getWalletTransactions(token),
      ]);
      setBalance(balRes.walletBalance);
      setTransactions(txRes.walletTransactions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }

  async function onDeposit(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    const amt = parseFloat(depositAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a positive amount for deposit');
      return;
    }
    try {
      setError(null);
      const res = await depositMoney(authToken, amt, depositReference || undefined);
      const tx = res.depositMoney;
      setTransactions((prev) => [tx, ...prev]);
      setBalance((b) => b + tx.amount);
      setDepositAmount('');
      setDepositReference('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Deposit failed');
    }
  }

  async function onWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!authToken) return;
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt <= 0) {
      setError('Please enter a positive amount for withdrawal');
      return;
    }
    if (!bankAccount) {
      setError('Please enter a bank account number');
      return;
    }
    try {
      setError(null);
      const res = await withdrawToBank(authToken, {
        amount: amt,
        bankAccount,
        description: withdrawDescription || undefined,
      });
      const tx = res.withdrawToBank;
      setTransactions((prev) => [tx, ...prev]);
      // For pending bank withdrawals, balance is already decremented server-side
      setBalance((b) => b - amt);
      setWithdrawAmount('');
      setBankAccount('');
      setWithdrawDescription('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Withdrawal failed');
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Wallet</h1>

      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading…</div>
            ) : (
              <div className="text-3xl">{formatCurrency(balance)}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deposit</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onDeposit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 items-center">
                <Label htmlFor="depositAmount">Amount</Label>
                <Input id="depositAmount" type="number" step="0.01" min="0" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <Label htmlFor="depositReference">Reference (optional)</Label>
                <Input id="depositReference" value={depositReference} onChange={(e) => setDepositReference(e.target.value)} />
              </div>
              <Button type="submit">Add funds</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank withdrawal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onWithdraw} className="space-y-3">
              <div className="grid grid-cols-2 gap-3 items-center">
                <Label htmlFor="withdrawAmount">Amount</Label>
                <Input id="withdrawAmount" type="number" step="0.01" min="0" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <Label htmlFor="bankAccount">Bank account</Label>
                <Input id="bankAccount" value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3 items-center">
                <Label htmlFor="withdrawDescription">Description (optional)</Label>
                <Input id="withdrawDescription" value={withdrawDescription} onChange={(e) => setWithdrawDescription(e.target.value)} />
              </div>
              <Button type="submit">Submit request</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={5}>
                    No transactions yet
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  <TableCell>{typeLabel[tx.type]}</TableCell>
                  <TableCell>{tx.description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tx.status]}>{tx.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? 'text-green-600' : 'text-red-600'}>
                      {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
