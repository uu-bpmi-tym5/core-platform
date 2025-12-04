'use client';

import * as React from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';

const GRAPHQL_ENDPOINT = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:3030/graphql';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  status: string;
  createdAt: string;
  readAt?: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  goal: number;
  currentAmount: number;
  category: string;
  status: string;
  createdAt: string;
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
  status: string;
}

export default function DemoPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('notifications');

  // Notifications state
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [notificationForm, setNotificationForm] = React.useState({
    title: '',
    message: '',
    type: 'info',
  });
  const [notificationStatus, setNotificationStatus] = React.useState('');

  // Campaigns state
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [campaignForm, setCampaignForm] = React.useState({
    name: '',
    description: '',
    goal: '',
    category: '',
  });
  const [campaignStatus, setCampaignStatus] = React.useState('');

  // Wallet state
  const [walletBalance, setWalletBalance] = React.useState<number | null>(null);
  const [transactions, setTransactions] = React.useState<WalletTransaction[]>([]);
  const [depositAmount, setDepositAmount] = React.useState('');
  const [walletStatus, setWalletStatus] = React.useState('');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken');
      setAuthToken(token);
      setIsAuthenticated(!!token);
    }
  }, []);

  // Load data when tab changes
  React.useEffect(() => {
    if (!isAuthenticated) return;

    switch (activeTab) {
      case 'notifications':
        if (notifications.length === 0) {
          loadNotifications();
        }
        break;
      case 'campaigns':
        if (campaigns.length === 0) {
          loadCampaigns();
        }
        break;
      case 'wallet':
        if (walletBalance === null) {
          loadWallet();
        }
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  const fetchGraphQL = async (query: string, variables?: any) => {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
      },
      credentials: 'include',
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }
    return result.data;
  };

  // Notifications functions
  const loadNotifications = async () => {
    try {
      const data = await fetchGraphQL(`
        query {
          getMyNotifications {
            id
            title
            message
            type
            status
            createdAt
            readAt
          }
        }
      `);
      setNotifications(data.getMyNotifications);
      setNotificationStatus('Notifications loaded successfully');
    } catch (error: any) {
      setNotificationStatus(`Error: ${error.message}`);
    }
  };

  const createNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current user ID first
      const userData = await fetchGraphQL(`
        query {
          me {
            id
          }
        }
      `);

      const data = await fetchGraphQL(
        `
        mutation CreateNotification($input: CreateNotificationInput!) {
          createNotification(input: $input) {
            id
            title
            message
            type
            status
            createdAt
            readAt
          }
        }
      `,
        {
          input: {
            title: notificationForm.title,
            message: notificationForm.message,
            type: notificationForm.type.toUpperCase(),
            userId: userData.me.id,
          },
        }
      );

      const newNotification = data.createNotification;

      // Add notification to the top of the list
      setNotifications((prev) => [newNotification, ...prev]);

      setNotificationStatus('Notification created successfully!');
      setNotificationForm({ title: '', message: '', type: 'info' });
    } catch (error: any) {
      setNotificationStatus(`Error: ${error.message}`);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const data = await fetchGraphQL(
        `
        mutation MarkAsRead($notificationId: String!) {
          markNotificationAsRead(notificationId: $notificationId) {
            id
            status
            readAt
          }
        }
      `,
        { notificationId }
      );

      // Update the notification in the list
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId
            ? { ...notif, status: data.markNotificationAsRead.status, readAt: data.markNotificationAsRead.readAt }
            : notif
        )
      );

      setNotificationStatus('Notification marked as read');
    } catch (error: any) {
      setNotificationStatus(`Error: ${error.message}`);
    }
  };

  // Campaigns functions
  const loadCampaigns = async () => {
    try {
      const data = await fetchGraphQL(`
        query {
          myCampaigns {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
          }
        }
      `);
      setCampaigns(data.myCampaigns);
      setCampaignStatus('Campaigns loaded successfully');
    } catch (error: any) {
      setCampaignStatus(`Error: ${error.message}`);
    }
  };

  const createCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchGraphQL(
        `
        mutation CreateCampaign($input: CreateCampaignInput!) {
          createCampaign(createCampaignInput: $input) {
            id
            name
            description
            goal
            currentAmount
            category
            status
            createdAt
          }
        }
      `,
        {
          input: {
            name: campaignForm.name,
            description: campaignForm.description,
            goal: parseFloat(campaignForm.goal),
            category: campaignForm.category,
          },
        }
      );

      const newCampaign = data.createCampaign;

      // Add campaign to the top of the list
      setCampaigns((prev) => [newCampaign, ...prev]);

      setCampaignStatus('Campaign created successfully!');
      setCampaignForm({ name: '', description: '', goal: '', category: '' });
    } catch (error: any) {
      setCampaignStatus(`Error: ${error.message}`);
    }
  };

  // Wallet functions
  const loadWallet = async () => {
    try {
      const balanceData = await fetchGraphQL(`
        query {
          walletBalance
        }
      `);
      setWalletBalance(balanceData.walletBalance);

      const txData = await fetchGraphQL(`
        query {
          walletTransactions {
            id
            type
            amount
            description
            createdAt
            status
          }
        }
      `);
      setTransactions(txData.walletTransactions);
      setWalletStatus('Wallet loaded successfully');
    } catch (error: any) {
      setWalletStatus(`Error: ${error.message}`);
    }
  };

  const depositMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await fetchGraphQL(
        `
        mutation DepositMoney($amount: Float!, $externalReference: String) {
          depositMoney(amount: $amount, externalReference: $externalReference) {
            id
            amount
            type
            description
            createdAt
            status
          }
        }
      `,
        {
          amount: parseFloat(depositAmount),
          externalReference: `DEMO-${Date.now()}`,
        }
      );

      const newTransaction = data.depositMoney;
      const depositAmountNum = parseFloat(depositAmount);

      // Update balance immediately
      setWalletBalance((prev) => (prev !== null ? prev + depositAmountNum : depositAmountNum));

      // Add transaction to the top of the list
      setTransactions((prev) => [newTransaction, ...prev]);

      setWalletStatus('Deposit successful!');
      setDepositAmount('');
    } catch (error: any) {
      setWalletStatus(`Error: ${error.message}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="bg-muted/40 min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Platform Demo</CardTitle>
            <CardDescription>
              Please login to access the demo features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This demo showcases the notifications, campaigns, and wallet microservices.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => router.push('/login')} className="flex-1">
                Login
              </Button>
              <Button onClick={() => router.push('/signup')} variant="outline" className="flex-1">
                Sign Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-muted/40 min-h-screen pb-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 pt-12 md:px-10">
        <section>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="space-y-3">
              <Badge variant="secondary" className="uppercase tracking-wide">
                Platform Demo
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                    Demo
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  Test and explore the notifications, campaigns, and wallet functionality
                </p>
              </div>
            </div>
            <div className="flex flex-none flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                Go to Dashboard
              </Button>
              <Button
                onClick={() => {
                  localStorage.removeItem('authToken');
                  router.push('/login');
                }}
                variant="destructive"
              >
                Logout
              </Button>
            </div>
          </div>
        </section>

        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="notifications">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="wallet">Wallet</TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Notification</CardTitle>
                  <CardDescription>
                    Test the notifications microservice by creating a new notification
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createNotification} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="notif-title">Title</Label>
                      <Input
                        id="notif-title"
                        value={notificationForm.title}
                        onChange={(e) =>
                          setNotificationForm({ ...notificationForm, title: e.target.value })
                        }
                        placeholder="Notification title"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notif-message">Message</Label>
                      <Textarea
                        id="notif-message"
                        value={notificationForm.message}
                        onChange={(e) =>
                          setNotificationForm({ ...notificationForm, message: e.target.value })
                        }
                        placeholder="Notification message"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notif-type">Type</Label>
                      <select
                        id="notif-type"
                        value={notificationForm.type}
                        onChange={(e) =>
                          setNotificationForm({ ...notificationForm, type: e.target.value })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="info">Info</option>
                        <option value="success">Success</option>
                        <option value="warning">Warning</option>
                        <option value="error">Error</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Create Notification
                      </Button>
                      <Button type="button" onClick={loadNotifications} variant="outline">
                        Refresh
                      </Button>
                    </div>
                    {notificationStatus && (
                      <p className="text-sm text-muted-foreground">{notificationStatus}</p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Notifications</CardTitle>
                  <CardDescription>
                    Your recent notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No notifications yet. Create one to get started!
                      </p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="rounded-lg border border-border p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{notif.title}</p>
                              <p className="text-xs text-muted-foreground">{notif.message}</p>
                            </div>
                            <Badge variant={notif.status === 'UNREAD' ? 'warning' : 'secondary'}>
                              {notif.type}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                            {notif.status === 'UNREAD' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsRead(notif.id)}
                              >
                                Mark as read
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Create Campaign</CardTitle>
                  <CardDescription>
                    Test the campaigns microservice by creating a new campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={createCampaign} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="camp-name">Campaign Name</Label>
                      <Input
                        id="camp-name"
                        value={campaignForm.name}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, name: e.target.value })
                        }
                        placeholder="My Awesome Campaign"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="camp-desc">Description</Label>
                      <Textarea
                        id="camp-desc"
                        value={campaignForm.description}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, description: e.target.value })
                        }
                        placeholder="Campaign description"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="camp-goal">Goal Amount ($)</Label>
                      <Input
                        id="camp-goal"
                        type="number"
                        min="1"
                        step="0.01"
                        value={campaignForm.goal}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, goal: e.target.value })
                        }
                        placeholder="10000"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="camp-category">Category</Label>
                      <Input
                        id="camp-category"
                        value={campaignForm.category}
                        onChange={(e) =>
                          setCampaignForm({ ...campaignForm, category: e.target.value })
                        }
                        placeholder="Technology, Arts, etc."
                        required
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        Create Campaign
                      </Button>
                      <Button type="button" onClick={loadCampaigns} variant="outline">
                        Refresh
                      </Button>
                    </div>
                    {campaignStatus && (
                      <p className="text-sm text-muted-foreground">{campaignStatus}</p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All Campaigns</CardTitle>
                  <CardDescription>
                    Campaigns from the microservice
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {campaigns.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No campaigns yet. Create one to get started!
                      </p>
                    ) : (
                      campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="rounded-lg border border-border p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{campaign.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {campaign.description}
                              </p>
                            </div>
                            <Badge>{campaign.status}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{campaign.category}</span>
                            <span className="font-medium">
                              ${campaign.currentAmount} / ${campaign.goal}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Wallet Operations</CardTitle>
                  <CardDescription>
                    Test the wallet microservice with deposits and balance checks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="rounded-lg bg-primary/10 p-4 space-y-2">
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-3xl font-bold">
                      {walletBalance !== null ? `$${walletBalance.toFixed(2)}` : 'Loading...'}
                    </p>
                    <Button onClick={loadWallet} variant="outline" size="sm" className="w-full">
                      Refresh Balance
                    </Button>
                  </div>

                  <form onSubmit={depositMoney} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Deposit Amount ($)</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="100.00"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Deposit Money
                    </Button>
                    {walletStatus && (
                      <p className="text-sm text-muted-foreground">{walletStatus}</p>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transaction History</CardTitle>
                  <CardDescription>
                    Your recent wallet transactions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No transactions yet. Make a deposit to get started!
                      </p>
                    ) : (
                      transactions.map((tx) => (
                        <div
                          key={tx.id}
                          className="rounded-lg border border-border p-3 space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{tx.type}</p>
                              {tx.description && (
                                <p className="text-xs text-muted-foreground">{tx.description}</p>
                              )}
                            </div>
                            <Badge variant={tx.status === 'COMPLETED' ? 'success' : 'secondary'}>
                              {tx.status}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </p>
                            <p className="font-medium text-sm">
                              {tx.amount > 0 ? '+' : ''}${tx.amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

