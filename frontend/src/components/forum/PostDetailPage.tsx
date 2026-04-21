import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { useForum } from '../../lib/forum-context';
import { useAuth } from '../../lib/auth-context';
import { RoleBadge } from '../RoleBadge';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Flag,
  Share2,
  MoreVertical,
  ArrowLeft,
  Send,
  Trash2,
  Edit,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { toast } from 'sonner';
import { ReportDialog } from './ReportDialog';
import { ApiError } from '../../lib/api-client';
import { getForumPostById, mapBackendPostToFrontend } from '../../lib/forum-api';

function resolveForumErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return 'Post atau data forum tidak ditemukan';
    }
    if (error.status === 403) {
      return 'Anda tidak punya akses untuk melakukan aksi ini';
    }
    return error.message || fallback;
  }

  return fallback;
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, toggleLike, toggleSave, addComment, addReply, toggleCommentLike, deletePost } = useForum();
  const [detailPost, setDetailPost] = useState<typeof posts[number] | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(true);
  
  const [commentContent, setCommentContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [reportTarget, setReportTarget] = useState<{
    targetType: 'post' | 'comment';
    targetId: string;
    targetContent: string;
    targetAuthor: string;
  } | null>(null);

  const post = detailPost ?? posts.find(p => p.id === id);

  useEffect(() => {
    if (!id) {
      setIsLoadingDetail(false);
      return;
    }

    const loadDetail = async () => {
      setIsLoadingDetail(true);
      try {
        const backendPost = await getForumPostById(id);
        setDetailPost(mapBackendPostToFrontend(backendPost, user?.id));
      } catch {
        // Keep fallback from context list when detail fetch fails.
      } finally {
        setIsLoadingDetail(false);
      }
    };

    void loadDetail();
  }, [id, user?.id]);

  useEffect(() => {
    if (!post) return;
    setDetailPost(post);
  }, [post?.id, post?.comments.length]);

  if (isLoadingDetail && !post) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4">Memuat post...</h1>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-2xl font-bold mb-4">Post tidak ditemukan</h1>
          <Button onClick={() => navigate('/forum')}>Kembali ke Forum</Button>
        </div>
      </div>
    );
  }

  const hasLiked = user ? post.likedBy.includes(user.id) : false;
  const hasSaved = user ? post.isSavedBy.includes(user.id) : false;
  const isAuthor = user?.id === post.authorId;
  const isAdmin = user?.role === 'admin';
  const displayAuthorName = post.authorName?.trim() || 'Unknown User';
  const displayAuthorInitial = displayAuthorName.charAt(0).toUpperCase();

  const handleLike = () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    void toggleLike(post.id, user.id);
  };

  const handleSave = () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    void toggleSave(post.id, user.id);
    toast.success(hasSaved ? 'Post dihapus dari bookmark' : 'Post disimpan ke bookmark');
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link berhasil disalin!');
    } catch {
      toast.error('Gagal menyalin link');
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    if (!commentContent.trim()) return;

    try {
      await addComment(post.id, {
        content: commentContent,
      });
      setCommentContent('');
      toast.success('Komentar berhasil ditambahkan');
    } catch (error) {
      toast.error(resolveForumErrorMessage(error, 'Gagal menambahkan komentar'));
    }
  };

  const handleAddReply = async (commentId: string) => {
    if (!user) {
      toast.error('Silakan login terlebih dahulu');
      return;
    }
    if (!replyContent.trim()) return;

    try {
      await addReply(post.id, commentId, {
        content: replyContent,
      });
      setReplyContent('');
      setReplyingTo(null);
      toast.success('Balasan berhasil ditambahkan');
    } catch (error) {
      toast.error(resolveForumErrorMessage(error, 'Gagal menambahkan balasan'));
    }
  };

  const handleDelete = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus post ini?')) {
      try {
        await deletePost(post.id);
        toast.success('Post berhasil dihapus');
        navigate('/forum');
      } catch (error) {
        toast.error(resolveForumErrorMessage(error, 'Gagal menghapus post'));
      }
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/forum')}
          className="mb-6 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Forum
        </Button>

        {/* Post Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <Avatar>
                  <AvatarFallback>{displayAuthorInitial}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/forum/user/${post.authorId}`} className="font-semibold hover:underline">
                      {displayAuthorName}
                    </Link>
                    <RoleBadge role={post.authorRole} size="sm" />
                    <span className="text-sm text-muted-foreground">
                      • {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: localeId })}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{post.category}</Badge>
                    {post.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Post Actions */}
              {(isAuthor || isAdmin) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isAuthor && (
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Ubah
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-4">{post.title}</h1>
              <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={hasLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
                className="gap-2"
              >
                <Heart className={`h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                {post.likes}
              </Button>

              <Button variant="outline" size="sm" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                {post.comments.length}
              </Button>

              <Button
                variant={hasSaved ? "default" : "outline"}
                size="sm"
                onClick={handleSave}
                className="gap-2"
              >
                <Bookmark className={`h-4 w-4 ${hasSaved ? 'fill-current' : ''}`} />
                {hasSaved ? 'Tersimpan' : 'Simpan'}
              </Button>

              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Bagikan
              </Button>

              {user && !isAuthor && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReportTarget({
                    targetType: 'post',
                    targetId: post.id,
                    targetContent: post.title,
                    targetAuthor: displayAuthorName,
                  })}
                  className="gap-2 ml-auto text-destructive hover:text-destructive"
                >
                  <Flag className="h-4 w-4" />
                  Laporkan
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">
              Komentar ({post.comments.length})
            </h2>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Add Comment */}
            {user ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Tulis komentar Anda..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAddComment} disabled={!commentContent.trim()} className="gap-2">
                    <Send className="h-4 w-4" />
                    Kirim Komentar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-muted rounded-lg">
                <p className="text-muted-foreground mb-4">Silakan login untuk menambahkan komentar</p>
                <Button onClick={() => navigate('/login')}>Masuk</Button>
              </div>
            )}

            <Separator />

            {/* Comments List */}
            <div className="space-y-6">
              {post.comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Belum ada komentar. Jadilah yang pertama berkomentar!
                </p>
              ) : (
                post.comments.map(comment => (
                  <div key={comment.id} className="space-y-4">
                    {/* Comment */}
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {comment.authorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-2">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Link to={`/forum/user/${comment.authorId}`} className="font-medium text-sm hover:underline">
                              {comment.authorName}
                            </Link>
                            <RoleBadge role={comment.authorRole} size="sm" />
                            <span className="text-xs text-muted-foreground">
                              • {formatDistanceToNow(comment.createdAt, { addSuffix: true, locale: localeId })}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        </div>

                        {/* Comment Actions */}
                        <div className="flex items-center gap-3 text-sm">
                          <button
                            onClick={() => user && void toggleCommentLike(post.id, comment.id, user.id)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Heart className={`h-3 w-3 ${user && comment.likedBy.includes(user.id) ? 'fill-current text-primary' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          {user && (
                            <>
                              <button
                                onClick={() => setReplyingTo(comment.id)}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                Balas
                              </button>
                              {user.id !== comment.authorId && (
                                <button
                                  onClick={() => setReportTarget({
                                    targetType: 'comment',
                                    targetId: comment.id,
                                    targetContent: comment.content,
                                    targetAuthor: comment.authorName,
                                  })}
                                  className="flex items-center gap-1 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Flag className="h-3 w-3" />
                                  Laporkan
                                </button>
                              )}
                            </>
                          )}
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="space-y-2 pl-4 border-l-2">
                            <Textarea
                              placeholder="Tulis balasan Anda..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => void handleAddReply(comment.id)}
                                disabled={!replyContent.trim()}
                              >
                                Kirim
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                              >
                                Batal
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="space-y-3 pl-4 border-l-2 mt-3">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {reply.authorName.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="bg-muted rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Link to={`/forum/user/${reply.authorId}`} className="font-medium text-xs hover:underline">
                                        {reply.authorName}
                                      </Link>
                                      <RoleBadge role={reply.authorRole} size="sm" />
                                      <span className="text-xs text-muted-foreground">
                                        • {formatDistanceToNow(reply.createdAt, { addSuffix: true, locale: localeId })}
                                      </span>
                                    </div>
                                    <p className="text-xs whitespace-pre-wrap">{reply.content}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Dialog */}
      {reportTarget && (
        <ReportDialog
          open={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          targetContent={reportTarget.targetContent}
          targetAuthor={reportTarget.targetAuthor}
        />
      )}
    </div>
  );
}
