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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getAuditLogs,
  getAuditLogsCount,
  type AuditLog,
  type AuditLogFilter,
} from '@/lib/graphql';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  User,
  Settings,
  FileText,
  Wallet,
  MessageSquare,
  Download,
  Eye,
  RefreshCw,
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
    'campaign.create': 'Campaign Created',
    'campaign.update': 'Campaign Updated',
    'campaign.delete': 'Campaign Deleted',
    'campaign.submit': 'Campaign Submitted',
    'campaign.approve': 'Campaign Approved',
    'campaign.reject': 'Campaign Rejected',
    'contribution.create': 'Contribution Made',
    'contribution.refund': 'Contribution Refunded',
    'wallet.deposit': 'Wallet Deposit',
    'wallet.withdrawal': 'Wallet Withdrawal',
    'user.register': 'User Registered',
    'user.login': 'User Login',
    'user.logout': 'User Logout',
    'user.update': 'User Updated',
    'user.role_change': 'Role Changed',
    'user.password_change': 'Password Changed',
    'comment.create': 'Comment Created',
    'comment.delete': 'Comment Deleted',
    'comment.moderate': 'Comment Moderated',
    'comment.report': 'Comment Reported',
    'notification.send': 'Notification Sent',
    'export.contributions': 'Data Exported',
  };
  return labels[action] || action;
}


// Get badge variant for action category
function getActionBadge(action: string) {
  if (action.startsWith('campaign.')) return <Badge variant="secondary">Campaign</Badge>;
  if (action.startsWith('user.')) return <Badge variant="outline">User</Badge>;
  if (action.startsWith('wallet.') || action.startsWith('contribution.')) return <Badge className="bg-green-100 text-green-800 border-green-200">Finance</Badge>;
  if (action.startsWith('comment.')) return <Badge variant="secondary">Comment</Badge>;
  if (action.startsWith('export.')) return <Badge variant="outline">Export</Badge>;
  return <Badge variant="secondary">System</Badge>;
}

// Action type options for filter
const ACTION_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'campaign.create', label: 'Campaign Created' },
  { value: 'campaign.update', label: 'Campaign Updated' },
  { value: 'campaign.delete', label: 'Campaign Deleted' },
  { value: 'campaign.submit', label: 'Campaign Submitted' },
  { value: 'campaign.approve', label: 'Campaign Approved' },
  { value: 'campaign.reject', label: 'Campaign Rejected' },
  { value: 'contribution.create', label: 'Contribution Made' },
  { value: 'contribution.refund', label: 'Contribution Refunded' },
  { value: 'wallet.deposit', label: 'Wallet Deposit' },
  { value: 'wallet.withdrawal', label: 'Wallet Withdrawal' },
  { value: 'user.register', label: 'User Registered' },
  { value: 'user.login', label: 'User Login' },
  { value: 'user.role_change', label: 'Role Changed' },
  { value: 'comment.moderate', label: 'Comment Moderated' },
  { value: 'export.contributions', label: 'Data Exported' },
];

// Entity type options for filter
const ENTITY_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'user', label: 'User' },
  { value: 'wallet_transaction', label: 'Wallet Transaction' },
  { value: 'campaign_contribution', label: 'Contribution' },
  { value: 'comment', label: 'Comment' },
];

interface AuditLogTableProps {
  authToken: string;
  isAdmin?: boolean;
  title?: string;
  description?: string;
}

export function AuditLogTable({
  authToken,
  isAdmin = false,
  title = 'Audit Logs',
  description = 'Track all system activities and changes.',
}: AuditLogTableProps) {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Pagination
  const [page, setPage] = React.useState(0);
  const [pageSize] = React.useState(20);

  // Filters
  const [showFilters, setShowFilters] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [actionFilter, setActionFilter] = React.useState('');
  const [entityTypeFilter, setEntityTypeFilter] = React.useState('');
  const [fromDate, setFromDate] = React.useState('');
  const [toDate, setToDate] = React.useState('');

  // Detail view
  const [selectedLog, setSelectedLog] = React.useState<AuditLog | null>(null);

  const loadLogs = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const filter: AuditLogFilter = {};
      if (actionFilter) filter.action = actionFilter;
      if (entityTypeFilter) filter.entityType = entityTypeFilter;
      if (fromDate) filter.fromDate = fromDate;
      if (toDate) filter.toDate = toDate;

      const [logsResult, countResult] = await Promise.all([
        getAuditLogs(authToken, filter, { limit: pageSize, offset: page * pageSize }),
        getAuditLogsCount(authToken, filter),
      ]);

      // Client-side search filtering (for description and actor)
      let filteredLogs = logsResult.auditLogs || [];
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredLogs = filteredLogs.filter(
          (log) =>
            log.description.toLowerCase().includes(query) ||
            log.actor?.name?.toLowerCase().includes(query) ||
            log.actor?.email?.toLowerCase().includes(query) ||
            log.entityId.toLowerCase().includes(query)
        );
      }

      setLogs(filteredLogs);
      setTotalCount(countResult.auditLogsCount || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [authToken, page, pageSize, actionFilter, entityTypeFilter, fromDate, toDate, searchQuery]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const clearFilters = () => {
    setSearchQuery('');
    setActionFilter('');
    setEntityTypeFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  };

  const hasActiveFilters = actionFilter || entityTypeFilter || fromDate || toDate || searchQuery;

  return (
    <>
      <Card className="border-border shadow-subtle">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadLogs()}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant={showFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-1.5"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
                    !
                  </span>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by description, actor, or entity ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              className="pl-10"
            />
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="action-filter">Action Type</Label>
                  <select
                    id="action-filter"
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ACTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity-filter">Entity Type</Label>
                  <select
                    id="entity-filter"
                    value={entityTypeFilter}
                    onChange={(e) => {
                      setEntityTypeFilter(e.target.value);
                      setPage(0);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {ENTITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="from-date">From Date</Label>
                  <Input
                    id="from-date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="to-date">To Date</Label>
                  <Input
                    id="to-date"
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(0);
                    }}
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-sm text-muted-foreground">Loading audit logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-foreground">No audit logs found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'No activity has been recorded yet.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/60">
                      <TableHead className="text-xs uppercase tracking-wide">Timestamp</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Action</TableHead>
                      {isAdmin && (
                        <TableHead className="text-xs uppercase tracking-wide">Actor</TableHead>
                      )}
                      <TableHead className="text-xs uppercase tracking-wide">Description</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide">Entity</TableHead>
                      <TableHead className="text-xs uppercase tracking-wide text-right">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-muted/30">
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
                        {isAdmin && (
                          <TableCell>
                            {log.actor ? (
                              <div className="space-y-0.5">
                                <p className="text-sm font-medium">{log.actor.name}</p>
                                <p className="text-xs text-muted-foreground">{log.actor.email}</p>
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                {log.actorType === 'system' ? 'System' : 'Unknown'}
                              </Badge>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="max-w-xs">
                          <p className="text-sm truncate" title={log.description}>
                            {log.description}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {getActionBadge(log.action)}
                            <p className="text-xs text-muted-foreground font-mono truncate max-w-24" title={log.entityId}>
                              {log.entityId.slice(0, 8)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of{' '}
                  {totalCount} entries
                </p>
                <div className="flex items-center gap-2">
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
                    Page {page + 1} of {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedLog && getActionIcon(selectedLog.action)}
              Audit Log Details
            </DialogTitle>
            <DialogDescription>
              Complete information about this audit log entry.
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Timestamp</Label>
                  <p className="text-sm font-medium">{formatDateTime(selectedLog.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Action</Label>
                  <p className="text-sm font-medium">{getActionLabel(selectedLog.action)}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Actor</Label>
                  {selectedLog.actor ? (
                    <p className="text-sm font-medium">
                      {selectedLog.actor.name} ({selectedLog.actor.email})
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.actorType === 'system' ? 'System' : 'Unknown'}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedLog.description}</p>
              </div>

              {/* Entity Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Entity Type</Label>
                  <p className="text-sm font-medium">{selectedLog.entityType}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Entity ID</Label>
                  <p className="text-sm font-mono">{selectedLog.entityId}</p>
                </div>
              </div>

              {/* Old Values */}
              {selectedLog.oldValues && Object.keys(selectedLog.oldValues).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Previous Values</Label>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {/* New Values */}
              {selectedLog.newValues && Object.keys(selectedLog.newValues).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">New Values</Label>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Additional Metadata</Label>
                  <pre className="rounded-md bg-muted p-3 text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

