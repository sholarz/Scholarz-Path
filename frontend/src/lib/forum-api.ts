import { apiDelete, apiGet, apiPost, apiPut } from './api-client';

export interface ForumCategoryOption {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface FrontendReply {
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

export interface FrontendComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'free' | 'premium';
  content: string;
  likes: number;
  likedBy: string[];
  replies: FrontendReply[];
  createdAt: Date;
  isReported: boolean;
}

export interface FrontendPost {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: 'admin' | 'free' | 'premium';
  title: string;
  content: string;
  category: string;
  categoryId: string;
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: FrontendComment[];
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'pending' | 'published' | 'rejected' | 'archived';
  isReported: boolean;
  reportCount: number;
  isSavedBy: string[];
}

export interface FrontendReport {
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

type PaginatedResponse<T> = {
  data?: T[];
};

function toRole(role: unknown): 'admin' | 'free' | 'premium' {
  if (role === 'admin' || role === 'premium' || role === 'free') {
    return role;
  }
  return 'free';
}

function toDate(value: unknown): Date {
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return new Date();
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string');
  }
  return [];
}

function readAuthorName(source: any): string {
  const explicitName = typeof source?.author_name === 'string' ? source.author_name.trim() : '';
  if (explicitName) {
    return explicitName;
  }

  const profileFirstName = typeof source?.author?.profile?.first_name === 'string'
    ? source.author.profile.first_name.trim()
    : '';
  const profileLastName = typeof source?.author?.profile?.last_name === 'string'
    ? source.author.profile.last_name.trim()
    : '';
  const fullName = `${profileFirstName} ${profileLastName}`.trim();
  if (fullName) {
    return fullName;
  }

  const email = typeof source?.author?.email === 'string' ? source.author.email.trim() : '';
  if (email.includes('@')) {
    return email.split('@')[0];
  }

  return 'Unknown User';
}

function mapBackendReplyToFrontend(reply: any): FrontendReply {
  return {
    id: String(reply?.id ?? ''),
    commentId: String(reply?.comment_id ?? reply?.commentId ?? ''),
    authorId: String(reply?.author_id ?? reply?.authorId ?? reply?.author?.id ?? ''),
    authorName: readAuthorName(reply),
    authorRole: toRole(reply?.author_role ?? reply?.authorRole),
    content: String(reply?.content ?? ''),
    likes: Number(reply?.likes_count ?? reply?.likes ?? 0),
    likedBy: [],
    createdAt: toDate(reply?.created_at ?? reply?.createdAt),
  };
}

function mapBackendCommentToFrontend(comment: any, currentUserId?: string): FrontendComment {
  const hasLiked = Boolean(comment?.has_liked);

  return {
    id: String(comment?.id ?? ''),
    postId: String(comment?.post_id ?? comment?.postId ?? ''),
    authorId: String(comment?.author_id ?? comment?.authorId ?? comment?.author?.id ?? ''),
    authorName: readAuthorName(comment),
    authorRole: toRole(comment?.author_role ?? comment?.authorRole),
    content: String(comment?.content ?? ''),
    likes: Number(comment?.likes_count ?? comment?.likes ?? 0),
    likedBy: hasLiked && currentUserId ? [currentUserId] : [],
    replies: Array.isArray(comment?.replies)
      ? comment.replies.map((reply: any) => mapBackendReplyToFrontend(reply))
      : [],
    createdAt: toDate(comment?.created_at ?? comment?.createdAt),
    isReported: Boolean(comment?.is_reported ?? comment?.isReported ?? false),
  };
}

export function mapBackendPostToFrontend(post: any, currentUserId?: string): FrontendPost {
  const hasLiked = Boolean(post?.has_liked);
  const hasSaved = Boolean(post?.has_saved);
  const comments = Array.isArray(post?.comments)
    ? post.comments.map((comment: any) => mapBackendCommentToFrontend(comment, currentUserId))
    : [];

  return {
    id: String(post?.id ?? ''),
    authorId: String(post?.author_id ?? post?.authorId ?? post?.author?.id ?? ''),
    authorName: readAuthorName(post),
    authorRole: toRole(post?.author_role ?? post?.authorRole),
    title: String(post?.title ?? ''),
    content: String(post?.content ?? ''),
    category: String(post?.category?.name ?? post?.category_name ?? post?.category ?? 'Uncategorized'),
    categoryId: String(post?.forum_category_id ?? post?.category_id ?? post?.category?.id ?? ''),
    tags: toStringArray(post?.tags),
    likes: Number(post?.likes_count ?? post?.likes ?? 0),
    likedBy: hasLiked && currentUserId ? [currentUserId] : [],
    comments,
    commentCount: Number(post?.comments_count ?? comments.length),
    createdAt: toDate(post?.created_at ?? post?.createdAt),
    updatedAt: toDate(post?.updated_at ?? post?.updatedAt),
    status: (post?.status ?? 'published') as FrontendPost['status'],
    isReported: Boolean(post?.is_reported ?? post?.isReported ?? Number(post?.report_count ?? 0) > 0),
    reportCount: Number(post?.report_count ?? post?.reportCount ?? 0),
    isSavedBy: hasSaved && currentUserId ? [currentUserId] : [],
  };
}

function mapBackendReportToFrontend(report: any): FrontendReport {
  return {
    id: String(report?.id ?? ''),
    reporterId: String(report?.reporter_user_id ?? report?.reporter_id ?? report?.user_id ?? ''),
    reporterName: String(report?.reporter_name ?? report?.reporter?.email ?? 'Unknown Reporter'),
    targetType: (report?.target_type ?? 'post') as 'post' | 'comment',
    targetId: String(report?.target_id ?? report?.post_id ?? ''),
    targetContent: String(report?.target_content ?? ''),
    targetAuthor: String(report?.target_author ?? ''),
    reason: String(report?.reason ?? ''),
    description: String(report?.description ?? ''),
    status: (report?.status ?? 'pending') as FrontendReport['status'],
    reviewedBy: report?.reviewed_by ? String(report.reviewed_by) : undefined,
    reviewedAt: report?.reviewed_at ? toDate(report.reviewed_at) : undefined,
    action: report?.action ? String(report.action) : undefined,
    createdAt: toDate(report?.created_at ?? report?.createdAt),
  };
}

export async function getForumPosts(params?: {
  category?: string;
  search?: string;
  sort?: 'recent' | 'popular';
}): Promise<any[]> {
  const query = new URLSearchParams();
  if (params?.category) query.set('category', params.category);
  if (params?.search) query.set('search', params.search);
  if (params?.sort) query.set('sort', params.sort);

  const suffix = query.toString() ? `?${query.toString()}` : '';
  const payload = await apiGet<{ data?: any[] } | { data?: PaginatedResponse<any> }>(`/forum/posts${suffix}`);

  if (Array.isArray((payload as any)?.data)) {
    return (payload as any).data;
  }

  if (Array.isArray((payload as any)?.data?.data)) {
    return (payload as any).data.data;
  }

  return [];
}

export async function getForumPostById(id: string): Promise<any> {
  const payload = await apiGet<{ data?: any }>(`/forum/posts/${id}`);
  return payload?.data ?? payload;
}

export async function getForumCategories(): Promise<ForumCategoryOption[]> {
  const payload = await apiGet<ForumCategoryOption[] | { data?: ForumCategoryOption[] }>(`/forum/categories`);

  if (Array.isArray(payload)) {
    return payload;
  }

  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function createForumPost(input: {
  title: string;
  content: string;
  category_id: string;
  tags: string[];
}): Promise<any> {
  const payload = await apiPost<{ data?: any }>(`/forum/posts`, input);
  return payload?.data ?? payload;
}

export async function updateForumPost(
  id: string,
  updates: { title?: string; content?: string; tags?: string[] }
): Promise<any> {
  const payload = await apiPut<{ data?: any }>(`/forum/posts/${id}`, updates);
  return payload?.data ?? payload;
}

export function deleteForumPost(id: string): Promise<void> {
  return apiDelete<void>(`/forum/posts/${id}`);
}

export function likeForumPost(id: string): Promise<{ liked: boolean; likes_count: number }> {
  return apiPost<{ liked: boolean; likes_count: number }>(`/forum/posts/${id}/like`);
}

export function saveForumPost(id: string): Promise<{ saved: boolean }> {
  return apiPost<{ saved: boolean }>(`/forum/posts/${id}/save`);
}

export async function addForumComment(postId: string, content: string): Promise<any> {
  const payload = await apiPost<{ data?: any }>(`/forum/posts/${postId}/comments`, { content });
  return payload?.data ?? payload;
}

export function likeForumComment(commentId: string): Promise<{ liked: boolean; likes_count: number }> {
  return apiPost<{ liked: boolean; likes_count: number }>(`/forum/comments/${commentId}/like`);
}

export async function addForumReply(commentId: string, content: string): Promise<any> {
  const payload = await apiPost<{ data?: any }>(`/forum/comments/${commentId}/replies`, { content });
  return payload?.data ?? payload;
}

export function deleteForumComment(commentId: string): Promise<void> {
  return apiDelete<void>(`/forum/comments/${commentId}`);
}

export function reportPost(postId: string, reason: string): Promise<{ data?: { post_id: string; report_count: number; status: string } }> {
  return apiPost<{ data?: { post_id: string; report_count: number; status: string } }>(`/forum/posts/${postId}/report`, { reason });
}

export function reportComment(commentId: string, reason: string, description?: string): Promise<void> {
  return apiPost<void>(`/forum/comments/${commentId}/report`, {
    reason,
    description,
  });
}

export async function getForumReports(): Promise<FrontendReport[]> {
  const payload = await apiGet<{ data?: { data?: any[] } | any[] }>(`/forum/reports`);

  let rows: any[] = [];
  if (Array.isArray(payload?.data)) {
    rows = payload.data;
  } else if (Array.isArray((payload as any)?.data?.data)) {
    rows = (payload as any).data.data;
  }

  return rows.map(mapBackendReportToFrontend);
}

export function reviewForumReport(
  reportId: string,
  status: 'reviewed' | 'resolved' | 'dismissed',
  action?: string
): Promise<{ data?: any }> {
  return apiPut<{ data?: any }>(`/forum/reports/${reportId}/review`, {
    status,
    action,
  });
}

export async function getPendingForumPosts(): Promise<any[]> {
  const payload = await apiGet<{ data?: any[] }>(`/forum/posts/pending`);
  return Array.isArray(payload?.data) ? payload.data : [];
}

export async function approveForumPost(id: string): Promise<any> {
  const payload = await apiPut<{ data?: any }>(`/forum/posts/${id}/approve`);
  return payload?.data ?? payload;
}

export async function rejectForumPost(id: string): Promise<any> {
  const payload = await apiPut<{ data?: any }>(`/forum/posts/${id}/reject`);
  return payload?.data ?? payload;
}
