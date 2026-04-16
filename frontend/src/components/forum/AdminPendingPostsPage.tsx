import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { Clock, Check, X, Eye, ArrowLeft, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { RoleBadge } from '../RoleBadge';
import { toast } from 'sonner';

export function AdminPendingPostsPage() {
  const { user } = useAuth();
  const { posts, approvePost, rejectPost } = useForum();

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-4">
            This page can only be accessed by administrators.
          </p>
          <Link to="/forum">
            <Button>Back to Forum</Button>
          </Link>
        </div>
      </div>
    );
  }

  const pendingPosts = posts.filter(p => p.status === 'pending');

  const handleApprove = async (postId: string) => {
    try {
      await approvePost(postId);
      toast.success('Post approved successfully');
    } catch {
      toast.error('Gagal menyetujui post');
    }
  };

  const handleReject = async (postId: string) => {
    if (confirm('Are you sure you want to reject this post?')) {
      try {
        await rejectPost(postId);
        toast.success('Post rejected');
      } catch {
        toast.error('Gagal menolak post');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/dashboard">
              <Button variant="ghost" className="gap-2 mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to Admin Dashboard
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Pending Posts</h1>
            <p className="text-muted-foreground">
              Review and approve posts awaiting moderation
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{pendingPosts.length}</div>
            <div className="text-sm text-muted-foreground">Post Pending</div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {pendingPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tidak ada post pending</p>
              </CardContent>
            </Card>
          ) : (
            pendingPosts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-600">
                          <Clock className="h-3 w-3" />
                          Pending
                        </Badge>
                        <Badge variant="secondary">{post.category}</Badge>
                      </div>

                      <h3 className="text-xl font-semibold mb-2">{post.title}</h3>

                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">{post.authorName}</span>
                        <RoleBadge role={post.authorRole} size="sm" />
                        <span className="text-sm text-muted-foreground">
                          • {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: localeId })}
                        </span>
                      </div>

                      <p className="text-muted-foreground line-clamp-3 mb-3">
                        {post.content}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {post.tags.map(tag => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Link to={`/forum/${post.id}`}>
                        <Button variant="outline" size="sm" className="gap-2 w-full">
                          <Eye className="h-4 w-4" />
                          Lihat
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        onClick={() => void handleApprove(post.id)}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => void handleReject(post.id)}
                        className="gap-2"
                      >
                        <X className="h-4 w-4" />
                        Tolak
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}