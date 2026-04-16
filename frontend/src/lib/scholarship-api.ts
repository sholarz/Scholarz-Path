/**
 * scholarship-api.ts
 * All API calls related to scholarships, search, filters, and bookmarks.
 */

import { apiGet, apiPost, apiDelete } from './api-client';

// ─────────────────────────────────────────
// Types (aligned with backend Scholarship model)
// ─────────────────────────────────────────

export interface ScholarshipProvider {
  id: string;
  name: string;
  logoUrl?: string | null;
  country?: string | null;
}

export interface Scholarship {
  id: string;
  title: string;
  description?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  type?: string | null;
  level: string;
  targetCountries?: string[] | null;
  eligibleNationalities?: string[] | null;
  fieldsOfStudy?: string[] | null;
  minimumGpa?: number | null;
  languageRequirements?: Record<string, string> | null;
  applicationDeadline: string; // ISO date string
  startDate?: string | null;
  durationMonths?: number | null;
  applicationUrl?: string | null;
  requirements?: string[] | null;
  benefits?: string[] | null;
  status: 'active' | 'inactive' | 'expired' | 'draft';
  isFeatured?: boolean;
  viewCount?: number;
  provider?: ScholarshipProvider | null;
  // Computed by backend
  formattedAmount?: string;
  daysUntilDeadline?: number;
  isExpiringSoon?: boolean;
}

export interface ScholarshipsFilters {
  search?: string;
  level?: string;
  type?: string;
  country?: string;
  featured?: boolean;
  minGpa?: number;
  sortBy?: 'created_at' | 'amount' | 'application_deadline' | 'view_count';
  order?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
}

export interface PaginationMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from?: number;
  to?: number;
}

export interface ScholarshipsResponse {
  scholarships: Scholarship[];
  pagination: PaginationMeta;
}

export interface BookmarkedScholarship {
  scholarship: Scholarship;
  isBookmarked: boolean;
  matchScore?: number;
}

// ─────────────────────────────────────────
// API functions
// ─────────────────────────────────────────

/**
 * Get paginated scholarship list with optional filters.
 * GET /api/scholarships
 */
export async function getScholarships(
  filters: ScholarshipsFilters = {}
): Promise<ScholarshipsResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.level) params.set('level', filters.level);
  if (filters.type) params.set('type', filters.type);
  if (filters.country) params.set('country', filters.country);
  if (filters.featured) params.set('featured', '1');
  if (filters.minGpa != null) params.set('min_gpa', String(filters.minGpa));
  if (filters.sortBy) params.set('sort', filters.sortBy);
  if (filters.order) params.set('order', filters.order);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.perPage) params.set('per_page', String(filters.perPage));

  const query = params.toString() ? `?${params.toString()}` : '';
  return apiGet<ScholarshipsResponse>(`/scholarships${query}`);
}

/**
 * Get single scholarship by ID.
 * GET /api/scholarships/:id
 */
export async function getScholarshipById(id: string): Promise<{ scholarship: Scholarship }> {
  return apiGet<{ scholarship: Scholarship }>(`/scholarships/${id}`);
}

/**
 * Get user's bookmarked scholarships (authenticated).
 * GET /api/scholarships/bookmarks
 */
export async function getBookmarks(): Promise<{ scholarships: BookmarkedScholarship[]; pagination: PaginationMeta }> {
  return apiGet(`/scholarships/bookmarks`);
}

/**
 * Add a bookmark (authenticated).
 * POST /api/scholarships/:id/bookmark
 */
export async function addBookmark(scholarshipId: string): Promise<void> {
  await apiPost(`/scholarships/${scholarshipId}/bookmark`);
}

/**
 * Remove a bookmark (authenticated).
 * DELETE /api/scholarships/:id/bookmark
 */
export async function removeBookmark(scholarshipId: string): Promise<void> {
  await apiDelete(`/scholarships/${scholarshipId}/bookmark`);
}
