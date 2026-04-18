import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ApiError } from './api-client';
import { useAuth } from './auth-context';
import {
  addForumComment,
  addForumReply,
  approveForumPost,
  createForumPost,
  deleteForumPost,
  getForumPostById,
  getForumPosts,
  getForumReports,
  likeForumComment,
  likeForumPost,
  mapBackendPostToFrontend,
  reportComment as reportForumComment,
  reportPost as reportForumPost,
  reviewForumReport,
  saveForumPost,
  updateForumPost,
  rejectForumPost,
  type FrontendPost,
  type FrontendComment,
  type FrontendReply,
  type FrontendReport,
} from './forum-api';

export type Post = FrontendPost;

export type Comment = FrontendComment;

export type Reply = FrontendReply;

export type Report = FrontendReport;

interface ForumContextType {
  posts: Post[];
  reports: Report[];
  isLoadingPosts: boolean;
  postsError: string | null;
  createPost: (post: { title: string; content: string; categoryId: string; tags: string[] }) => Promise<void>;
  updatePost: (id: string, updates: { title?: string; content?: string; tags?: string[] }) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  toggleLike: (postId: string, userId: string) => Promise<void>;
  toggleSave: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, comment: { content: string }) => Promise<void>;
  addReply: (postId: string, commentId: string, reply: { content: string }) => Promise<void>;
  toggleCommentLike: (postId: string, commentId: string, userId: string) => Promise<void>;
  reportPost: (postId: string, reason: string) => Promise<void>;
  reportComment: (commentId: string, reason: string, description?: string) => Promise<void>;
  reviewReport: (reportId: string, action: string, reviewedBy: string) => Promise<void>;
  approvePost: (postId: string) => Promise<void>;
  rejectPost: (postId: string) => Promise<void>;
  refreshPosts: () => Promise<void>;
  refreshReports: () => Promise<void>;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

export function ForumProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isAuthReady } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const mapPost = (post: any) => mapBackendPostToFrontend(post, user?.id);

  const refreshPosts = async () => {
    if (!isAuthenticated) {
      setPosts([]);
      setPostsError(null);
      setIsLoadingPosts(false);
      return;
    }

    setIsLoadingPosts(true);
    setPostsError(null);
    try {
      const backendPosts = await getForumPosts();
      setPosts(backendPosts.map(mapPost));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Gagal memuat data forum.';
      setPostsError(message);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const refreshReports = async () => {
    if (!isAuthenticated || user?.role !== 'admin') {
      setReports([]);
      return;
    }

    try {
      const loadedReports = await getForumReports();
      setReports(loadedReports);
    } catch (error) {
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        setReports([]);
        return;
      }
      throw error;
    }
  };

  const refreshSinglePost = async (postId: string) => {
    const backendPost = await getForumPostById(postId);
    const mapped = mapPost(backendPost);
    setPosts((prev) => {
      const index = prev.findIndex((post) => post.id === postId);
      if (index === -1) {
        return [mapped, ...prev];
      }
      const updated = [...prev];
      updated[index] = mapped;
      return updated;
    });
  };

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      setPosts([]);
      setReports([]);
      setPostsError(null);
      setIsLoadingPosts(false);
      return;
    }

    void refreshPosts();
    void refreshReports();
  }, [isAuthReady, isAuthenticated, user?.id]);

  const createPost = async (post: { title: string; content: string; categoryId: string; tags: string[] }) => {
    const backendPost = await createForumPost({
      title: post.title,
      content: post.content,
      category_id: post.categoryId,
      tags: post.tags,
    });
    setPosts(prev => [mapPost(backendPost), ...prev]);
  };

  const updatePost = async (id: string, updates: { title?: string; content?: string; tags?: string[] }) => {
    const backendPost = await updateForumPost(id, updates);
    const mapped = mapPost(backendPost);
    setPosts(prev => prev.map(post => (post.id === id ? mapped : post)));
  };

  const deletePost = async (id: string) => {
    await deleteForumPost(id);
    setPosts(prev => prev.filter(post => post.id !== id));
  };

  const toggleLike = async (postId: string, userId: string) => {
    const result = await likeForumPost(postId);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = result.liked;
        return {
          ...post,
          likes: result.likes_count,
          likedBy: hasLiked
            ? [userId]
            : [],
        };
      }
      return post;
    }));
  };

  const toggleSave = async (postId: string, userId: string) => {
    const result = await saveForumPost(postId);
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasSaved = result.saved;
        return {
          ...post,
          isSavedBy: hasSaved
            ? [userId]
            : [],
        };
      }
      return post;
    }));
  };

  const addComment = async (postId: string, comment: { content: string }) => {
    await addForumComment(postId, comment.content);
    await refreshSinglePost(postId);
  };

  const addReply = async (postId: string, commentId: string, reply: { content: string }) => {
    await addForumReply(commentId, reply.content);
    await refreshSinglePost(postId);
  };

  const toggleCommentLike = async (postId: string, commentId: string, userId: string) => {
    const result = await likeForumComment(commentId);

    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              const hasLiked = result.liked;
              return {
                ...comment,
                likes: result.likes_count,
                likedBy: hasLiked
                  ? [userId]
                  : [],
              };
            }
            return comment;
          }),
        };
      }
      return post;
    }));
  };

  const reportPost = async (postId: string, reason: string) => {
    const result = await reportForumPost(postId, reason);
    const data = result?.data;

    setPosts(prev => {
      const next = prev.map(post => {
        if (post.id !== postId) {
          return post;
        }

        return {
          ...post,
          isReported: true,
          reportCount: Number(data?.report_count ?? post.reportCount + 1),
          status: (data?.status as Post['status']) || post.status,
        };
      });

      return next.filter((post) => post.status !== 'archived');
    });

    await refreshReports();
  };

  const reportComment = async (commentId: string, reason: string, description?: string) => {
    await reportForumComment(commentId, reason, description);

    setPosts(prev => prev.map((post) => ({
      ...post,
      comments: post.comments.map((comment) => (
        comment.id === commentId
          ? { ...comment, isReported: true }
          : comment
      )),
    })));

    await refreshReports();
  };

  const reviewReport = async (reportId: string, action: string, reviewedBy: string) => {
    const status: 'reviewed' | 'resolved' | 'dismissed' = action.includes('dismiss') ? 'dismissed' : 'resolved';
    await reviewForumReport(reportId, status, `${action} | by: ${reviewedBy}`);
    await refreshReports();
  };

  const approvePost = async (postId: string) => {
    const backendPost = await approveForumPost(postId);
    const mapped = mapPost(backendPost);
    setPosts(prev => prev.map(post => (post.id === postId ? mapped : post)));
  };

  const rejectPost = async (postId: string) => {
    const backendPost = await rejectForumPost(postId);
    const mapped = mapPost(backendPost);
    setPosts(prev => prev.map(post => (post.id === postId ? mapped : post)));
  };

  return (
    <ForumContext.Provider
      value={{
        posts,
        reports,
        isLoadingPosts,
        postsError,
        createPost,
        updatePost,
        deletePost,
        toggleLike,
        toggleSave,
        addComment,
        addReply,
        toggleCommentLike,
        reportPost,
        reportComment,
        reviewReport,
        approvePost,
        rejectPost,
        refreshPosts,
        refreshReports,
      }}
    >
      {children}
    </ForumContext.Provider>
  );
}

export function useForum() {
  const context = useContext(ForumContext);
  if (!context) {
    throw new Error('useForum must be used within ForumProvider');
  }
  return context;
}