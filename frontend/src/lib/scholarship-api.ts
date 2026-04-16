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
  targetLevel?: 'sma' | 's1' | 's2' | 's3' | null;
  degreeLevel?: 's1' | 's2' | 's3' | null;
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

type ApiScholarshipProvider = {
  id: string;
  name: string;
  logo_url?: string | null;
  country?: string | null;
};

type ApiScholarship = {
  id: string;
  title: string;
  description?: string | null;
  amount?: number | string | null;
  currency?: string | null;
  type?: string | null;
  level: string;
  target_countries?: string[] | null;
  eligible_nationalities?: string[] | null;
  fields_of_study?: string[] | null;
  minimum_gpa?: number | null;
  target_level?: 'sma' | 's1' | 's2' | 's3' | null;
  degree_level?: 's1' | 's2' | 's3' | null;
  language_requirements?: Record<string, string> | null;
  application_deadline: string;
  start_date?: string | null;
  duration_months?: number | null;
  application_url?: string | null;
  requirements?: string[] | null;
  benefits?: string[] | null;
  status: 'active' | 'inactive' | 'expired' | 'draft';
  is_featured?: boolean;
  view_count?: number;
  provider?: ApiScholarshipProvider | null;
  formatted_amount?: string;
  days_until_deadline?: number;
  is_expiring_soon?: boolean;
};

const asStringArray = (value: unknown): string[] | null => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item));
  }

  if (typeof value === 'string') {
    const text = value.trim();

    if (text.length === 0) {
      return [];
    }

    if (text.startsWith('[') && text.endsWith(']')) {
      try {
        const parsed = JSON.parse(text) as unknown;
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
      } catch {
        return null;
      }
    }
  }

  return null;
};

type ApiScholarshipsResponse = {
  scholarships: ApiScholarship[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from?: number;
    to?: number;
  };
};

const normalizeScholarship = (item: ApiScholarship): Scholarship => ({
  id: item.id,
  title: item.title,
  description: item.description ?? null,
  amount: item.amount ?? null,
  currency: item.currency ?? null,
  type: item.type ?? null,
  level: item.level,
  targetCountries: asStringArray(item.target_countries),
  eligibleNationalities: asStringArray(item.eligible_nationalities),
  fieldsOfStudy: asStringArray(item.fields_of_study),
  minimumGpa: item.minimum_gpa ?? null,
  targetLevel: item.target_level ?? null,
  degreeLevel: item.degree_level ?? null,
  languageRequirements: item.language_requirements ?? null,
  applicationDeadline: item.application_deadline,
  startDate: item.start_date ?? null,
  durationMonths: item.duration_months ?? null,
  applicationUrl: item.application_url ?? null,
  requirements: asStringArray(item.requirements),
  benefits: asStringArray(item.benefits),
  status: item.status,
  isFeatured: item.is_featured,
  viewCount: item.view_count,
  provider: item.provider
    ? {
        id: item.provider.id,
        name: item.provider.name,
        logoUrl: item.provider.logo_url,
        country: item.provider.country,
      }
    : null,
  formattedAmount: item.formatted_amount,
  daysUntilDeadline: item.days_until_deadline,
  isExpiringSoon: item.is_expiring_soon,
});

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
  const raw = await apiGet<ApiScholarshipsResponse>(`/scholarships${query}`);

  return {
    scholarships: (raw.scholarships ?? []).map(normalizeScholarship),
    pagination: {
      total: raw.pagination?.total ?? 0,
      perPage: raw.pagination?.per_page ?? 15,
      currentPage: raw.pagination?.current_page ?? 1,
      lastPage: raw.pagination?.last_page ?? 1,
      from: raw.pagination?.from,
      to: raw.pagination?.to,
    },
  };
}

/**
 * Get single scholarship by ID.
 * GET /api/scholarships/:id
 */
export async function getScholarshipById(id: string): Promise<{ scholarship: Scholarship }> {
  const raw = await apiGet<{ scholarship: ApiScholarship }>(`/scholarships/${id}`);

  return {
    scholarship: normalizeScholarship(raw.scholarship),
  };
}

/**
 * Get user's bookmarked scholarships (authenticated).
 * GET /api/scholarships/bookmarks
 */
export async function getBookmarks(): Promise<{ scholarships: BookmarkedScholarship[]; pagination: PaginationMeta }> {
  const raw = await apiGet<{
    scholarships: Array<{
      scholarship: ApiScholarship;
      is_bookmarked?: boolean;
      match_score?: number;
    }>;
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from?: number;
      to?: number;
    };
  }>(`/scholarships/bookmarks`);

  return {
    scholarships: (raw.scholarships ?? []).map((item) => ({
      scholarship: normalizeScholarship(item.scholarship),
      isBookmarked: item.is_bookmarked ?? true,
      matchScore: item.match_score,
    })),
    pagination: {
      total: raw.pagination?.total ?? 0,
      perPage: raw.pagination?.per_page ?? 15,
      currentPage: raw.pagination?.current_page ?? 1,
      lastPage: raw.pagination?.last_page ?? 1,
      from: raw.pagination?.from,
      to: raw.pagination?.to,
    },
  };
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
