import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, addDoc, limit, deleteDoc, doc, where, updateDoc, arrayUnion, arrayRemove, increment, getDocs } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { useAuth } from "../lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { MessageSquare, Send, Trash2, ShieldCheck, Heart, User, Search, Plus, ChevronRight, AlertCircle, RefreshCw, Filter, ArrowUpDown, Pencil } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import { ForumPost } from "../types";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

const CATEGORIES = ["All", "Tips & Experience", "Announcements", "Q&A", "General Discussion", "Test Preparation", "Documents"];

function CommentSection({ postId, currentUser, isAdmin }: { postId: string; currentUser: any; isAdmin: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");

  useEffect(() => {
    if (!postId) return;
    const q = query(collection(db, "forumPosts", postId, "comments"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setComments(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `forumPosts/${postId}/comments`);
      },
    );
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, "forumPosts", postId, "comments"), {
        userId: currentUser.uid,
        userName: currentUser.displayName || "Anonim",
        content: newComment,
        createdAt: new Date().toISOString(),
      });

      await updateDoc(doc(db, "forumPosts", postId), {
        commentsCount: increment(1),
      });

      setNewComment("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `forumPosts/${postId}/comments`);
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleDelete = async (commentId: string) => {
    if (!commentId || deletingId) return;

    setDeletingId(commentId);
    try {
      const commentRef = doc(db, "forumPosts", postId, "comments", commentId);
      await deleteDoc(commentRef);

      await updateDoc(doc(db, "forumPosts", postId), {
        commentsCount: increment(-1),
      });

      toast.success("Komentar berhasil dihapus");
      setConfirmDelete(null);
    } catch (error: any) {
      console.error("DELETE COMMENT ERROR:", error);
      if (error.code === "permission-denied") {
        toast.error("Anda tidak memiliki izin untuk menghapus komentar ini");
      } else {
        toast.error(`Gagal menghapus komentar: ${error.message || "Error tidak diketahui"}`);
      }
      handleFirestoreError(error, OperationType.DELETE, `forumPosts/${postId}/comments/${commentId}`);
    } finally {
      setDeletingId(null);
    }
  };

  const startEditingComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentContent(comment.content || "");
    setConfirmDelete(null);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentContent("");
  };

  const saveEditedComment = async (commentId: string) => {
    const nextContent = editingCommentContent.trim();
    if (!nextContent) {
      toast.error("Komentar tidak boleh kosong");
      return;
    }

    try {
      await updateDoc(doc(db, "forumPosts", postId, "comments", commentId), {
        content: nextContent,
        editedAt: new Date().toISOString(),
      });
      toast.success("Komentar diperbarui");
      cancelEditingComment();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forumPosts/${postId}/comments/${commentId}`);
      toast.error("Gagal memperbarui komentar");
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-slate-50 space-y-4">
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 items-start group">
            <Avatar className="h-7 w-7 border border-slate-100">
              <AvatarFallback className="text-[10px]">{comment.userName?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow bg-slate-50 rounded-2xl p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-900">{comment.userName}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">{comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: id }) : "baru saja"}</span>
                  {(isAdmin || currentUser?.uid === comment.userId) && (
                    <div className="flex items-center gap-1">
                      {editingCommentId !== comment.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingComment(comment);
                          }}
                          className="text-slate-500 hover:text-indigo-600 transition-opacity p-1"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      {confirmDelete === comment.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(comment.id);
                            }}
                            className="bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold hover:bg-red-600"
                          >
                            Hapus
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            className="bg-slate-200 text-slate-600 text-[9px] px-2 py-0.5 rounded-full font-bold hover:bg-slate-300"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete(comment.id);
                          }}
                          className="text-slate-500 hover:text-red-500 transition-opacity p-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {comment.editedAt && <p className="text-[10px] text-slate-400 mt-1 font-semibold">edited</p>}
              {editingCommentId === comment.id ? (
                <div className="mt-2 space-y-2">
                  <Textarea className="min-h-20 rounded-xl border-slate-200 bg-white text-xs" value={editingCommentContent} onChange={(e) => setEditingCommentContent(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => saveEditedComment(comment.id)} className="bg-slate-900 text-white text-[10px] px-2.5 py-1 rounded-full font-bold hover:bg-slate-800">
                      Simpan
                    </button>
                    <button onClick={cancelEditingComment} className="bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1 rounded-full font-bold hover:bg-slate-300">
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-1">{comment.content}</p>
              )}
            </div>
          </div>
        ))}
        {!loading && comments.length === 0 && <p className="text-[10px] text-center text-slate-400 py-2 italic font-medium">Belum ada komentar. Jadi yang pertama membalas!</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input className="h-8 text-xs rounded-full bg-slate-50 border-transparent focus:bg-white" placeholder="Tulis balasan..." value={newComment} onChange={(e) => setNewComment(e.target.value)} />
        <Button type="submit" size="sm" className="h-8 w-8 p-0 rounded-full bg-slate-900">
          <Send size={14} />
        </Button>
      </form>
    </div>
  );
}

export default function Forum() {
  const { user, profile, isAdmin } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // States for search and filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("latest");

  // Post Creation States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("General Discussion");
  const [sending, setSending] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Record<string, boolean>>({});
  const [commentCountMap, setCommentCountMap] = useState<Record<string, number>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostContent, setEditingPostContent] = useState("");

  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Construct query
    let constraints: any[] = [orderBy("createdAt", sortBy === "latest" ? "desc" : "asc"), limit(50)];

    if (selectedCategory !== "All") {
      constraints.unshift(where("category", "==", selectedCategory));
    }

    const forumPath = "forumPosts";
    const q = query(collection(db, forumPath), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ForumPost[];
        setPosts(data);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, forumPath);
        setError(error.message);
        setLoading(false);
      },
    );
    return () => unsubscribe();
  }, [selectedCategory, sortBy]);

  useEffect(() => {
    let isCancelled = false;

    const hydrateCommentCounts = async () => {
      if (posts.length === 0) {
        setCommentCountMap({});
        return;
      }

      const countEntries = await Promise.all(
        posts.map(async (post) => {
          if (typeof post.commentsCount === "number") {
            return [post.id, post.commentsCount] as const;
          }

          const snapshot = await getDocs(collection(db, "forumPosts", post.id, "comments"));
          return [post.id, snapshot.size] as const;
        }),
      );

      if (!isCancelled) {
        setCommentCountMap(Object.fromEntries(countEntries));
      }
    };

    hydrateCommentCounts();

    return () => {
      isCancelled = true;
    };
  }, [posts]);

  const toggleComments = (postId: string) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleToggleLike = async (post: ForumPost) => {
    if (!post.id || likingPosts[post.id]) return;
    if (!user) {
      toast.error("Silakan login untuk memberikan like");
      return;
    }

    const currentLikes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = currentLikes.includes(user.uid);
    const nextLikes = hasLiked ? currentLikes.filter((uid) => uid !== user.uid) : Array.from(new Set([...currentLikes, user.uid]));

    // Optimistic update so the UI responds instantly.
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, likes: nextLikes } : p)));
    setLikingPosts((prev) => ({ ...prev, [post.id!]: true }));

    try {
      await updateDoc(doc(db, "forumPosts", post.id), {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch (error) {
      // Roll back optimistic state if the write fails.
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, likes: currentLikes } : p)));
      handleFirestoreError(error, OperationType.UPDATE, `forumPosts/${post.id}`);
      toast.error("Gagal memperbarui like");
    } finally {
      setLikingPosts((prev) => ({ ...prev, [post.id!]: false }));
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || sending) return;

    setSending(true);
    try {
      await addDoc(collection(db, "forumPosts"), {
        userId: user!.uid,
        userName: user!.displayName || "Anonim",
        content: newPostContent,
        category: newPostCategory,
        createdAt: new Date().toISOString(),
        role: profile?.role || "free",
        likes: [],
        commentsCount: 0,
      });
      setNewPostContent("");
      setNewPostCategory("General Discussion");
      setIsDialogOpen(false);
      toast.success("Postingan berhasil dikirim!");
    } catch (error) {
      toast.error("Gagal mengirim postingan");
    } finally {
      setSending(false);
    }
  };

  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const startEditingPost = (post: ForumPost) => {
    setEditingPostId(post.id);
    setEditingPostContent(post.content || "");
    setPostToDelete(null);
  };

  const cancelEditingPost = () => {
    setEditingPostId(null);
    setEditingPostContent("");
  };

  const saveEditedPost = async (postId: string) => {
    const nextContent = editingPostContent.trim();
    if (!nextContent) {
      toast.error("Isi postingan tidak boleh kosong");
      return;
    }

    try {
      await updateDoc(doc(db, "forumPosts", postId), {
        content: nextContent,
        editedAt: new Date().toISOString(),
      });
      toast.success("Postingan diperbarui");
      cancelEditingPost();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `forumPosts/${postId}`);
      toast.error("Gagal memperbarui postingan");
    }
  };

  const handleDelete = async (postId: string) => {
    if (!postId || sending) return;

    setSending(true);
    try {
      const postRef = doc(db, "forumPosts", postId);
      await deleteDoc(postRef);
      toast.success("Postingan berhasil dihapus");
      setPostToDelete(null);
    } catch (error: any) {
      console.error("DELETE POST ERROR:", error);
      if (error.code === "permission-denied") {
        toast.error("Anda tidak memiliki izin untuk menghapus postingan ini");
      } else {
        toast.error(`Gagal menghapus: ${error.message || "Error tidak diketahui"}`);
      }
      handleFirestoreError(error, OperationType.DELETE, `forumPosts/${postId}`);
    } finally {
      setSending(false);
    }
  };

  const filteredPosts = posts.filter((post) => post.content.toLowerCase().includes(searchQuery.toLowerCase()) || post.userName.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="sp-page-container">
      {/* Header section as seen in screenshot */}
      <div className="sp-page-header flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="sp-page-title">Community Forum</h1>
          <p className="sp-page-subtitle">Share experiences and discuss scholarships</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl px-6 font-bold shadow-lg shadow-slate-200 flex items-center gap-2">
                <Plus size={18} />
                Create Post
              </Button>
            }
          />
          <DialogContent className="sm:max-w-[525px] rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold tracking-tight">Create New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={handlePost} className="space-y-6 pt-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category</label>
                <Select value={newPostCategory} onValueChange={(value) => setNewPostCategory(value ?? "General Discussion")}>
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Content</label>
                <Textarea placeholder="What's on your mind?" className="min-h-[150px] rounded-2xl bg-slate-50 border-slate-100 p-4 focus:ring-slate-900/10" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl font-bold">
                  Cancel
                </Button>
                <Button type="submit" disabled={sending} className="bg-slate-900 text-white rounded-xl px-8 font-bold">
                  {sending ? "Posting..." : "Post Community"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Search and Posts */}
        <div className="lg:col-span-9 space-y-6">
          {/* Search Card */}
          <Card className="border-slate-100 shadow-sm rounded-3xl overflow-hidden">
            <CardContent className="p-4 space-y-4">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
                <Input
                  placeholder="Search posts, topics, or tags..."
                  className="pl-12 h-12 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-slate-900/10 transition-all font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value ?? "All")}>
                  <SelectTrigger className="flex-1 h-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-slate-400" />
                      <SelectValue placeholder="All Categories" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value ?? "latest")}>
                  <SelectTrigger className="flex-1 h-12 rounded-xl bg-slate-50 border-slate-100 font-bold text-slate-700">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown size={14} className="text-slate-400" />
                      <SelectValue placeholder="Sort By" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="latest">Latest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Error and Loading State UI from screenshot */}
          {error ? (
            <Card className="border-red-100 bg-red-50/20 rounded-[40px] border-2 border-dashed py-12">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-900">Gagal memuat data forum</h3>
                  <p className="text-red-500 mt-1 font-medium">{error}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-100 rounded-xl px-8 font-bold flex items-center gap-2">
                  <RefreshCw size={16} /> Coba Lagi
                </Button>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw className="h-10 w-10 animate-spin text-slate-200" />
              <p className="text-slate-400 font-medium">Fetching discussions...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[40px] border-2 border-dashed border-slate-100">
              <div className="rounded-full bg-slate-50 p-10 mb-6 shadow-inner">
                <Search className="h-12 w-12 text-slate-200" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 italic uppercase">Tidak Ditemukan</h3>
              <p className="mt-4 text-slate-500 max-w-sm mx-auto font-medium">Kami tidak menemukan diskusi yang sesuai dengan pencarian Anda.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
                const hasLiked = !!user && Array.isArray(post.likes) && post.likes.includes(user.uid);
                const likesLabel = `${likesCount} ${likesCount === 1 ? "Like" : "Likes"}`;
                const likeTooltip = hasLiked ? "Unlike" : "Like";
                const commentCount = commentCountMap[post.id!] ?? post.commentsCount ?? 0;

                return (
                  <Card key={post.id} className="border-slate-100 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12 border border-slate-100 shadow-sm">
                            <AvatarFallback className="bg-slate-100 text-slate-500 font-bold">{post.userName?.[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{post.userName}</span>
                              {post.role === "admin" && <Badge className="bg-sky-50 text-sky-600 border-none px-2 py-0 h-4 text-[9px] font-black uppercase tracking-tighter">Admin</Badge>}
                              {post.category && <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/50">{post.category}</span>}
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: id })}</span>
                            {post.editedAt && <span className="text-[10px] text-slate-400 font-semibold">edited</span>}
                          </div>
                        </div>
                        {(isAdmin || user?.uid === post.userId) && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingPost(post);
                              }}
                              className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                            >
                              <Pencil size={16} />
                            </Button>
                            <Dialog open={postToDelete === post.id} onOpenChange={(open) => setPostToDelete(open ? post.id! : null)}>
                              <DialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full"
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                }
                              />
                              <DialogContent className="rounded-3xl max-w-[400px]">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold">Hapus Postingan?</DialogTitle>
                                </DialogHeader>
                                <div className="py-2 text-slate-500 font-medium">Tindakan ini tidak dapat dibatalkan. Postingan Anda akan dihapus secara permanen.</div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                  <Button variant="ghost" onClick={() => setPostToDelete(null)} className="rounded-xl font-bold">
                                    Batal
                                  </Button>
                                  <Button onClick={() => handleDelete(post.id!)} disabled={sending} className="bg-red-500 text-white hover:bg-red-600 rounded-xl font-bold px-6">
                                    {sending ? "Menghapus..." : "Ya, Hapus"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                      <div className="mt-6 text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                        {editingPostId === post.id ? (
                          <div className="space-y-3">
                            <Textarea className="min-h-28 rounded-2xl border-slate-200 bg-white" value={editingPostContent} onChange={(e) => setEditingPostContent(e.target.value)} />
                            <div className="flex items-center gap-2">
                              <Button size="sm" className="rounded-xl font-bold" onClick={() => saveEditedPost(post.id!)}>
                                Simpan Perubahan
                              </Button>
                              <Button size="sm" variant="ghost" className="rounded-xl font-bold" onClick={cancelEditingPost}>
                                Batal
                              </Button>
                            </div>
                          </div>
                        ) : (
                          post.content
                        )}
                      </div>

                      <div className="relative z-10 mt-8 pt-4 border-t border-slate-50 flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-6">
                          <button
                            type="button"
                            onClick={() => toggleComments(post.id!)}
                            className={`flex items-center gap-2 text-xs font-bold transition-colors ${expandedPosts[post.id!] ? "text-slate-900" : "text-slate-500 hover:text-slate-900"}`}
                          >
                            <MessageSquare size={16} className={expandedPosts[post.id!] ? "text-slate-900" : "text-slate-400"} />
                            <span>{commentCount} Komentar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleLike(post)}
                            disabled={!!likingPosts[post.id!]}
                            aria-pressed={hasLiked}
                            className={`group/like relative z-20 inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-bold transition-all duration-200 pointer-events-auto disabled:opacity-60 active:scale-95 ${hasLiked ? "text-red-500" : "text-slate-500 hover:text-red-500"}`}
                          >
                            <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-sm transition-all duration-200 group-hover/like:-translate-y-0.5 group-hover/like:opacity-100">
                              {likeTooltip}
                            </span>
                            <Heart size={16} className={hasLiked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                            <span>{likesLabel}</span>
                          </button>
                        </div>

                        <button type="button" onClick={() => toggleComments(post.id!)} className="text-slate-300 hover:text-indigo-500">
                          <ChevronRight size={18} />
                        </button>
                      </div>

                      {expandedPosts[post.id!] && <CommentSection postId={post.id!} currentUser={user} isAdmin={isAdmin} />}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Categories Sidebar */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200/60 shadow-sm rounded-3xl overflow-hidden sticky top-8">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-sm font-black uppercase text-slate-400 tracking-[0.2em]">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-between group ${
                      selectedCategory === cat ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {cat}
                    {selectedCategory === cat && <ChevronRight size={14} className="animate-in slide-in-from-left-2" />}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
