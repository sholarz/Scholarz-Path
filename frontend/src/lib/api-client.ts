/**
 * Centralized API client for all backend requests.
 *
 * Features:
 * - Auto-injects Bearer token from localStorage
 * - Returns data unwrapped from the { success, data, message } envelope
 * - Handles 401 globally (dispatches a custom event that auth-context listens to)
 * - Throws typed ApiError on non-OK responses
 */

const API_BASE_URL = (
  (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL || 'http://localhost:8000/api'
).replace(/\/$/, '');

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[]> | string | null;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, string[]> | string | null
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Convenience: is this a validation error? */
  get isValidation() {
    return this.code === 'VALIDATION_FAILED' || this.status === 422;
  }

  /** Convenience: is this an auth error? */
  get isUnauthorized() {
    return this.status === 401;
  }
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseErrorFromResponse(response: Response): Promise<ApiError> {
  let code = 'HTTP_ERROR';
  let message = `Request failed with status ${response.status}`;
  let details: Record<string, string[]> | string | null = null;

  try {
    const body = (await response.json()) as Partial<ApiEnvelope<unknown>>;
    if (body.error?.code) code = body.error.code;
    if (body.error?.message) message = body.error.message;
    if (body.error?.details) details = body.error.details as Record<string, string[]>;
    // Handle Laravel validation errors returned as { errors: {...} }
    const legacyBody = body as Record<string, unknown>;
    if (legacyBody.errors && typeof legacyBody.errors === 'object') {
      code = 'VALIDATION_FAILED';
      details = legacyBody.errors as Record<string, string[]>;
      const firstField = Object.values(legacyBody.errors as Record<string, string[]>);
      if (firstField[0]?.[0]) message = firstField[0][0];
    }
    if (!body.error && body.message && typeof body.message === 'string') {
      message = body.message;
    }
  } catch {
    // Non-JSON body — keep defaults
  }

  return new ApiError(response.status, code, message, details);
}

// ─────────────────────────────────────────
// Core request function
// ─────────────────────────────────────────

/**
 * Make an authenticated API request.
 * Returns the `data` field from the response envelope.
 * Throws `ApiError` on non-2xx responses.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...getAuthHeaders(),
      ...(init.headers || {}),
    },
  });

  // Handle 401 globally — signal auth-context to log out
  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('api:unauthorized'));
    throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired. Please log in again.');
  }

  if (!response.ok) {
    throw await parseErrorFromResponse(response);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = (await response.json()) as ApiEnvelope<T>;

  // Some endpoints return raw data (not wrapped in envelope)
  if (payload.data === undefined && payload.success === undefined) {
    return payload as unknown as T;
  }

  return payload.data;
}

/**
 * GET request helper.
 */
export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' });
}

/**
 * POST request helper.
 */
export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request helper.
 */
export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper.
 */
export function apiDelete<T = void>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' });
}

export { API_BASE_URL };
