'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getMyAuditLogs, type AuditLog } from '@/lib/graphql';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Wallet,
  MessageSquare,
  Download,
  Settings,
  RefreshCw,
  Activity,
} from 'lucide-react';

// Format date for display
function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

// Get icon for action type
function getActionIcon(action: string) {
  if (action.startsWith('campaign.')) return <FileText className="h-4 w-4" />;
  if (action.startsWith('user.')) return <User className="h-4 w-4" />;
  if (action.startsWith('wallet.') || action.startsWith('contribution.')) return <Wallet className="h-4 w-4" />;
  if (action.startsWith('comment.')) return <MessageSquare className="h-4 w-4" />;
  if (action.startsWith('export.')) return <Download className="h-4 w-4" />;
  return <Settings className="h-4 w-4" />;
}

// Get readable action name
function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    'campaign.create': 'Created a campaign',
    'campaign.update': 'Updated a campaign',
    'campaign.delete': 'Deleted a campaign',
    'campaign.submit': 'Submitted campaign for review',
    'campaign.approve': 'Approved a campaign',
    'campaign.reject': 'Rejected a campaign',
    'contribution.create': 'Made a contribution',
    'contribution.refund': 'Received a refund',
    'wallet.deposit': 'Deposited funds',
    'wallet.withdrawal': 'Withdrew funds',
    'user.register': 'Registered account',
    'user.login': 'Logged in',
    'user.logout': 'Logged out',
    'user.update': 'Updated profile',
    'user.role_change': 'Role was changed',
    'user.password_change': 'Changed password',
    'comment.create': 'Posted a comment',
    'comment.delete': 'Deleted a comment',
    'comment.moderate': 'Moderated a comment',
    'comment.report': 'Reported a comment',
    'export.contributions': 'Exported contribution data',
  };
  return labels[action] || action;
}


interface MyActivityLogProps {
  authToken: string;
}

export function MyActivityLog({ authToken }: MyActivityLogProps) {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(10);
  const [hasMore, setHasMore] = React.useState(true);

  const loadLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getMyAuditLogs(authToken, undefined, {
        limit: pageSize + 1, // Fetch one extra to check if there are more
        offset: page * pageSize,
      });

      const fetchedLogs = result.myAuditLogs || [];

      // Check if there are more pages
      if (fetchedLogs.length > pageSize) {
        setHasMore(true);
        setLogs(fetchedLogs.slice(0, pageSize));
      } else {
        setHasMore(false);
        setLogs(fetchedLogs);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, [authToken, page, pageSize]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <Card className="border-border shadow-subtle">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              My Activity
            </CardTitle>
            <CardDescription>
              Your recent actions and activities on the platform.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadLogs()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-muted-foreground">Loading your activity...</div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your actions on the platform will appear here.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/60">
                    <TableHead className="text-xs uppercase tracking-wide">Date</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Activity</TableHead>
                    <TableHead className="text-xs uppercase tracking-wide">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span className="text-sm font-medium">
                            {getActionLabel(log.action)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="text-sm text-muted-foreground truncate" title={log.description}>
                          {log.description}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasMore}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

