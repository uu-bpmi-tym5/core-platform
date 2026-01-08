import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Comment, addComment, getComments, reportComment, deleteComment } from '@/lib/graphql';
import { useUserRole } from '@/lib/useUserRole';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send, MoreVertical, Trash2, Flag } from 'lucide-react';

interface CommentSectionProps {
  campaignId: string;
}

export function CommentSection({ campaignId }: CommentSectionProps) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [newComment, setNewComment] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const { isAdmin, isModerator, canPerform } = useUserRole();

  const canModerateComments = canPerform('MODERATE_COMMENTS') || isAdmin || isModerator;

  const fetchComments = React.useCallback(async () => {
    try {
      const data = await getComments(campaignId);
      setComments(data.comments);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  React.useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const token = localStorage.getItem('authToken');
    if (!token) return;

    setSubmitting(true);
    try {
      await addComment(token, campaignId, newComment);
      setNewComment('');
      fetchComments(); // Reload comments to show the new one
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      await deleteComment(token, commentId, 'Removed by moderator');
      fetchComments(); // Reload comments after deletion
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleReportComment = async (commentId: string) => {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
      await reportComment(token, commentId);
      alert('Comment has been reported. Thank you for helping keep our community safe.');
    } catch (err) {
      console.error('Failed to report comment:', err);
      alert('Failed to report comment. You may have already reported this comment.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">Comments ({comments.length})</h3>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Post Comment
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Please <a href="/login" className="font-medium text-primary hover:underline">log in</a> to leave a comment.
        </div>
      )}

      <div className="space-y-6">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={comment.user.avatarUrl || undefined} />
              <AvatarFallback>{comment.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{comment.user.displayName}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                {isAuthenticated && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Comment options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canModerateComments && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete comment
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleReportComment(comment.id)}>
                        <Flag className="mr-2 h-4 w-4" />
                        Report comment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-center text-muted-foreground">No comments yet. Be the first to share your thoughts!</p>
        )}
      </div>
    </div>
  );
}
