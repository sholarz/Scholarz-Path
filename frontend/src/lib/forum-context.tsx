import { createContext, useContext, useState, ReactNode } from 'react';

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'free' | 'premium';
  title: string;
  content: string;
  category: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: Comment[];
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  isReported: boolean;
  reportCount: number;
  isSavedBy: string[];
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'free' | 'premium';
  content: string;
  likes: number;
  likedBy: string[];
  replies: Reply[];
  createdAt: Date;
  isReported: boolean;
}

export interface Reply {
  id: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'free' | 'premium';
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'comment';
  targetId: string;
  targetContent: string;
  targetAuthor: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy?: string;
  reviewedAt?: Date;
  action?: string;
  createdAt: Date;
}

interface ForumContextType {
  posts: Post[];
  reports: Report[];
  createPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'comments' | 'isReported' | 'reportCount' | 'isSavedBy'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  toggleLike: (postId: string, userId: string) => void;
  toggleSave: (postId: string, userId: string) => void;
  addComment: (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'replies' | 'isReported'>) => void;
  addReply: (postId: string, commentId: string, reply: Omit<Reply, 'id' | 'createdAt' | 'likes' | 'likedBy'>) => void;
  toggleCommentLike: (postId: string, commentId: string, userId: string) => void;
  reportPost: (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => void;
  reviewReport: (reportId: string, action: string, reviewedBy: string) => void;
  approvePost: (postId: string) => void;
  rejectPost: (postId: string) => void;
}

const ForumContext = createContext<ForumContextType | undefined>(undefined);

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    authorId: 'user1',
    authorName: 'Andi Wijaya',
    authorRole: 'premium',
    title: 'Tips for Getting Accepted into LPDP 2026',
    content: 'Hello everyone! I would like to share my experience of getting accepted into the LPDP scholarship this year. Here are some important tips that I think are crucial...',
    category: 'Tips & Experience',
    tags: ['LPDP', 'Tips', 'Masters Scholarship'],
    likes: 24,
    likedBy: ['user2', 'user3'],
    comments: [
      {
        id: 'c1',
        postId: '1',
        authorId: 'user2',
        authorName: 'Budi Santoso',
        authorRole: 'free',
        content: 'Thank you for sharing! Very helpful',
        likes: 5,
        likedBy: ['user1'],
        replies: [],
        createdAt: new Date('2026-04-02'),
        isReported: false,
      }
    ],
    createdAt: new Date('2026-04-01'),
    updatedAt: new Date('2026-04-01'),
    status: 'approved',
    isReported: false,
    reportCount: 0,
    isSavedBy: ['user2'],
  },
  {
    id: '2',
    authorId: 'admin1',
    authorName: 'ScholarPath Team',
    authorRole: 'admin',
    title: 'Announcement: New Scholarship Opened!',
    content: 'We would like to inform you that a new scholarship has been added to the ScholarPath database. This is a great opportunity for students in Java, Indonesia...',
    category: 'Announcements',
    tags: ['Announcement', 'New Scholarship'],
    likes: 45,
    likedBy: [],
    comments: [],
    createdAt: new Date('2026-04-02'),
    updatedAt: new Date('2026-04-02'),
    status: 'approved',
    isReported: false,
    reportCount: 0,
    isSavedBy: [],
  },
];

export function ForumProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [reports, setReports] = useState<Report[]>([]);

  const createPost = (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'comments' | 'isReported' | 'reportCount' | 'isSavedBy'>) => {
    const newPost: Post = {
      ...post,
      id: Date.now().toString(),
      likes: 0,
      likedBy: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isReported: false,
      reportCount: 0,
      isSavedBy: [],
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post =>
      post.id === id ? { ...post, ...updates, updatedAt: new Date() } : post
    ));
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(post => post.id !== id));
  };

  const toggleLike = (postId: string, userId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasLiked = post.likedBy.includes(userId);
        return {
          ...post,
          likes: hasLiked ? post.likes - 1 : post.likes + 1,
          likedBy: hasLiked
            ? post.likedBy.filter(id => id !== userId)
            : [...post.likedBy, userId],
        };
      }
      return post;
    }));
  };

  const toggleSave = (postId: string, userId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const hasSaved = post.isSavedBy.includes(userId);
        return {
          ...post,
          isSavedBy: hasSaved
            ? post.isSavedBy.filter(id => id !== userId)
            : [...post.isSavedBy, userId],
        };
      }
      return post;
    }));
  };

  const addComment = (postId: string, comment: Omit<Comment, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'replies' | 'isReported'>) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        const newComment: Comment = {
          ...comment,
          id: Date.now().toString(),
          likes: 0,
          likedBy: [],
          replies: [],
          createdAt: new Date(),
          isReported: false,
        };
        return {
          ...post,
          comments: [...post.comments, newComment],
        };
      }
      return post;
    }));
  };

  const addReply = (postId: string, commentId: string, reply: Omit<Reply, 'id' | 'createdAt' | 'likes' | 'likedBy'>) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              const newReply: Reply = {
                ...reply,
                id: Date.now().toString(),
                likes: 0,
                likedBy: [],
                createdAt: new Date(),
              };
              return {
                ...comment,
                replies: [...comment.replies, newReply],
              };
            }
            return comment;
          }),
        };
      }
      return post;
    }));
  };

  const toggleCommentLike = (postId: string, commentId: string, userId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: post.comments.map(comment => {
            if (comment.id === commentId) {
              const hasLiked = comment.likedBy.includes(userId);
              return {
                ...comment,
                likes: hasLiked ? comment.likes - 1 : comment.likes + 1,
                likedBy: hasLiked
                  ? comment.likedBy.filter(id => id !== userId)
                  : [...comment.likedBy, userId],
              };
            }
            return comment;
          }),
        };
      }
      return post;
    }));
  };

  const reportPost = (report: Omit<Report, 'id' | 'createdAt' | 'status'>) => {
    const newReport: Report = {
      ...report,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date(),
    };
    setReports(prev => [newReport, ...prev]);

    // Update post/comment reported status
    if (report.targetType === 'post') {
      setPosts(prev => prev.map(post => {
        if (post.id === report.targetId) {
          return {
            ...post,
            isReported: true,
            reportCount: post.reportCount + 1,
          };
        }
        return post;
      }));
    }
  };

  const reviewReport = (reportId: string, action: string, reviewedBy: string) => {
    setReports(prev => prev.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          status: 'reviewed',
          action,
          reviewedBy,
          reviewedAt: new Date(),
        };
      }
      return report;
    }));
  };

  const approvePost = (postId: string) => {
    updatePost(postId, { status: 'approved' });
  };

  const rejectPost = (postId: string) => {
    updatePost(postId, { status: 'rejected' });
  };

  return (
    <ForumContext.Provider
      value={{
        posts,
        reports,
        createPost,
        updatePost,
        deletePost,
        toggleLike,
        toggleSave,
        addComment,
        addReply,
        toggleCommentLike,
        reportPost,
        reviewReport,
        approvePost,
        rejectPost,
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