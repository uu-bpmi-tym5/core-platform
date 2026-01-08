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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Comment, getReportedComments, deleteComment, hideComment, restoreComment } from '@/lib/graphql';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Eye, EyeOff, Flag, Loader2, MoreVertical, RefreshCw, Trash2 } from 'lucide-react';

interface CommentModerationTableProps {
  authToken: string;
}

export function CommentModerationTable({ authToken }: CommentModerationTableProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  const loadReportedComments = React.useCallback(async () => {
    if (!authToken) {
      setError('Authentication token is missing');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getReportedComments(authToken);
      setComments(data.reportedComments ?? []);
    } catch (e) {
      console.error('Failed to load reported comments:', e);
      setError(e instanceof Error ? e.message : 'Failed to load reported comments');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  React.useEffect(() => {
    loadReportedComments();
  }, [loadReportedComments]);

  const handleHide = async (commentId: string) => {
    try {
      setActionLoading(commentId);
      setError(null);
      await hideComment(authToken, commentId, 'Hidden by moderator');
      await loadReportedComments();
      setSuccessMessage('Comment has been hidden.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to hide comment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (commentId: string) => {
    try {
      setActionLoading(commentId);
      setError(null);
      await deleteComment(authToken, commentId, 'Removed by moderator');
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setSuccessMessage('Comment has been removed.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove comment');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRestore = async (commentId: string) => {
    try {
      setActionLoading(commentId);
      setError(null);
      await restoreComment(authToken, commentId);
      await loadReportedComments();
      setSuccessMessage('Comment has been restored.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore comment');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'HIDDEN':
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 border-yellow-500/20">Hidden</Badge>;
      case 'REMOVED':
        return <Badge variant="destructive">Removed</Badge>;
      default:
        return <Badge variant="outline">Visible</Badge>;
    }
  };

  const getReportsBadge = (count?: number) => {
    if (!count) return null;
    if (count >= 5) {
      return <Badge variant="destructive" className="gap-1"><Flag className="h-3 w-3" />{count}</Badge>;
    }
    if (count >= 3) {
      return <Badge variant="secondary" className="bg-orange-500/10 text-orange-700 border-orange-500/20 gap-1"><Flag className="h-3 w-3" />{count}</Badge>;
    }
    return <Badge variant="secondary" className="gap-1"><Flag className="h-3 w-3" />{count}</Badge>;
  };

  return (
    <Card className="border-border shadow-subtle">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Reported Comments
          </CardTitle>
          <CardDescription>
            Review and moderate comments that have been reported by users.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={loadReportedComments} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/50 py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-medium text-foreground">No reported comments</p>
            <p className="mt-1 text-sm text-muted-foreground">
              There are no comments requiring moderation at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/60">
                  <TableHead className="text-xs uppercase tracking-wide">User</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Comment</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Campaign</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Reports</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide">Reported</TableHead>
                  <TableHead className="text-xs uppercase tracking-wide text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user.avatarUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {comment.user.displayName.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{comment.user.displayName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">{comment.content}</p>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`/campaigns/${comment.campaign?.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        {comment.campaign?.name ?? 'Unknown'}
                      </a>
                    </TableCell>
                    <TableCell>
                      {getReportsBadge(comment.reportsCount)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(comment.status)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {comment.lastReportedAt
                        ? formatDistanceToNow(new Date(comment.lastReportedAt), { addSuffix: true })
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={actionLoading === comment.id}
                          >
                            {actionLoading === comment.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreVertical className="h-4 w-4" />
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => window.open(`/campaigns/${comment.campaign?.id}`, '_blank')}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View in campaign
                          </DropdownMenuItem>
                          {comment.status === 'VISIBLE' && (
                            <DropdownMenuItem onClick={() => handleHide(comment.id)}>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Hide comment
                            </DropdownMenuItem>
                          )}
                          {comment.status === 'HIDDEN' && (
                            <DropdownMenuItem onClick={() => handleRestore(comment.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Restore comment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemove(comment.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

