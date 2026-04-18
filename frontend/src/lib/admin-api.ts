type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
  error?: {
    message?: string;
  };
};

type LaravelPaginator<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

export type AdminDashboardStats = {
  users: {
    total: number;
    active: number;
    banned: number;
    admins: number;
  };
  scholarships: {
    total: number;
    active: number;
    draft: number;
    featured: number;
  };
  reports: {
    open: number;
    resolved: number;
  };
};

export type AdminUser = {
  id: string;
  email: string;
  role: 'admin' | 'premium' | 'free' | 'guest';
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
  profile?: {
    first_name?: string;
    last_name?: string;
  } | null;
};

export type AdminScholarship = {
  id: string;
  title: string;
  status: 'active' | 'inactive' | 'expired' | 'draft';
  level: string;
  target_level?: 'sma' | 's1' | 's2' | 's3';
  degree_level?: 's1' | 's2' | 's3';
  application_deadline: string;
  is_featured: boolean;
  provider?: {
    id: string;
    name: string;
    country?: string;
  } | null;
  description?: string;
  type?: string;
  minimum_gpa?: number | null;
  fields_of_study?: string[] | null;
  requirements?: string[] | null;
  benefits?: string[] | null;
  application_url?: string;
  amount?: number | null;
  currency?: string;
  target_countries?: string[] | null;
};

export type AdminScholarshipPayload = {
  provider_id?: string;
  provider_name?: string;
  provider_country?: string;
  title: string;
  description: string;
  type: 'full' | 'partial' | 'merit' | 'need_based' | 'sports' | 'academic';
  level: 'high_school' | 'bachelor' | 'master' | 'doctorate' | 'postdoc';
  target_level: 'sma' | 's1' | 's2' | 's3';
  degree_level: 's1' | 's2' | 's3';
  application_deadline: string;
  application_url: string;
  amount?: number;
  currency?: string;
  target_countries?: string[];
  eligible_nationalities?: string[];
  fields_of_study?: string[];
  minimum_gpa?: number;
  language_requirements?: Record<string, number | string>;
  start_date?: string;
  duration_months?: number;
  requirements?: string[];
  benefits?: string[];
  selection_criteria?: string[];
  application_process?: string[];
  status?: 'active' | 'inactive' | 'expired' | 'draft';
  is_featured?: boolean;
};

const API_BASE_URL = ((import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string };
}).env?.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');

  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as ApiEnvelope<unknown> & { errors?: Record<string, string[]> };

    if (body?.errors) {
      const first = Object.values(body.errors).find((messages) => messages?.length > 0);
      if (first?.[0]) {
        return first[0];
      }
    }

    if (body?.error?.message) {
      return body.error.message;
    }

    if (body?.message) {
      return body.message;
    }
  } catch {
    // Fall through.
  }

  return 'Request failed';
};

const requestJson = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init.headers || {}),
    },
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('api:unauthorized'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (payload.data === undefined) {
    throw new Error(payload.message || 'Response data is unavailable');
  }

  return payload.data;
};

export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
  return requestJson<AdminDashboardStats>('/admin/dashboard');
};

export const getAdminUsers = async (perPage = 50): Promise<LaravelPaginator<AdminUser>> => {
  return requestJson<LaravelPaginator<AdminUser>>(`/admin/users?per_page=${perPage}`);
};

export const updateAdminUserRole = async (
  userId: string,
  role: 'admin' | 'premium' | 'free' | 'guest'
): Promise<AdminUser> => {
  return requestJson<AdminUser>(`/admin/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
};

export const updateAdminUserStatus = async (
  userId: string,
  status: 'active' | 'inactive' | 'banned'
): Promise<AdminUser> => {
  return requestJson<AdminUser>(`/admin/users/${userId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const getAdminScholarships = async (perPage = 100): Promise<LaravelPaginator<AdminScholarship>> => {
  return requestJson<LaravelPaginator<AdminScholarship>>(`/admin/scholarships?per_page=${perPage}`);
};

export const createAdminScholarship = async (payload: AdminScholarshipPayload): Promise<AdminScholarship> => {
  return requestJson<AdminScholarship>('/admin/scholarships', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateAdminScholarship = async (
  scholarshipId: string,
  payload: Partial<AdminScholarshipPayload>
): Promise<AdminScholarship> => {
  return requestJson<AdminScholarship>(`/admin/scholarships/${scholarshipId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const verifyAdminScholarship = async (scholarshipId: string): Promise<AdminScholarship> => {
  return requestJson<AdminScholarship>(`/admin/scholarships/${scholarshipId}/verify`, {
    method: 'PUT',
  });
};

export const featureAdminScholarship = async (
  scholarshipId: string,
  isFeatured: boolean
): Promise<AdminScholarship> => {
  return requestJson<AdminScholarship>(`/admin/scholarships/${scholarshipId}/feature`, {
    method: 'PUT',
    body: JSON.stringify({ is_featured: isFeatured }),
  });
};

export const deleteAdminScholarship = async (scholarshipId: string): Promise<void> => {
  await requestJson<null>(`/admin/scholarships/${scholarshipId}`, {
    method: 'DELETE',
  });
};
