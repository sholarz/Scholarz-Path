// Auth Context for managing user authentication state
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'premium' | 'free' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthReady: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleLogin: (token: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<{ message: string; warning?: string | null }>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = ((import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string };
}).env?.VITE_API_BASE_URL || 'http://localhost:8011/api').replace(/\/$/, '');

type ApiUserPayload = {
  id?: string;
  email?: string;
  role?: UserRole;
  profile?: {
    first_name?: string;
    last_name?: string;
  } | null;
};

type AuthApiResponse = {
  success?: boolean;
  data?: {
    user?: ApiUserPayload;
    token?: string;
    redirect_url?: string;
  };
  message?: string;
  errors?: Record<string, string[]>;
  error?: {
    message?: string;
    details?: unknown;
  };
};

const mapApiUser = (payload: ApiUserPayload | undefined, fallbackEmail: string, fallbackName: string): User => {
  const firstName = payload?.profile?.first_name?.trim() || '';
  const lastName = payload?.profile?.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim() || fallbackName;

  return {
    id: payload?.id || Date.now().toString(),
    email: payload?.email || fallbackEmail,
    name: fullName,
    role: payload?.role || 'free',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName || fallbackEmail)}`,
  };
};

const readAuthError = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as AuthApiResponse;

    if (body?.error?.details && typeof body.error.details === 'object') {
      const detailErrors = Object.values(body.error.details as Record<string, unknown>).find(
        (messages) => Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string'
      ) as string[] | undefined;

      if (detailErrors?.[0]) {
        return detailErrors[0];
      }
    }

    if (body?.errors && typeof body.errors === 'object') {
      const firstFieldErrors = Object.values(body.errors).find((messages) => Array.isArray(messages) && messages.length > 0);
      if (firstFieldErrors && firstFieldErrors[0]) {
        return firstFieldErrors[0];
      }
    }

    if (body?.error?.message) {
      return body.error.message;
    }

    if (typeof body?.error?.details === 'string') {
      return body.error.details;
    }

    if (body?.message) {
      return body.message;
    }
  } catch {
    // Fall through to a generic error below.
  }

  return response.status === 422
    ? 'Unable to process your request. Please check the form and try again.'
    : 'Authentication request failed';
};

const persistSession = (setUser: (user: User) => void, user: User, token?: string) => {
  setUser(user);
  localStorage.setItem('user', JSON.stringify(user));

  if (token) {
    localStorage.setItem('auth_token', token);
  }
};

const loadStoredUser = (): User | null => {
  const savedUser = localStorage.getItem('user');
  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser) as User;
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

const fetchCurrentUser = async (token: string): Promise<ApiUserPayload> => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(await readAuthError(response));
  }

  const payload = (await response.json()) as AuthApiResponse & {
    data?: AuthApiResponse['data'] | ApiUserPayload;
  };
  const dataPayload = payload.data;
  const userPayload =
    dataPayload && 'user' in dataPayload
      ? dataPayload.user
      : (dataPayload as ApiUserPayload | undefined);

  if (!userPayload) {
    throw new Error('Unable to load user profile after Google login');
  }

  return userPayload;
};



export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSessionUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    try {
      const payloadUser = await fetchCurrentUser(token);
      const storedUser = loadStoredUser();
      const refreshedUser = mapApiUser(
        payloadUser,
        payloadUser.email || storedUser?.email || '',
        storedUser?.name || payloadUser.email || ''
      );
      persistSession(setUser, refreshedUser);
    } catch {
      // Keep current state if sync fails (e.g. temporary network issue).
    }
  };

  useEffect(() => {
    // Global 401 handler — fired by api-client.ts when any API call returns 401
    const handleUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('bookmarks_cache');
    };

    const handleWindowFocus = () => {
      void syncSessionUser();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void syncSessionUser();
      }
    };

    // Initial sync so role updates from backend are reflected after reload.
    void syncSessionUser();

    const syncInterval = window.setInterval(() => {
      void syncSessionUser();
    }, 30000);

    window.addEventListener('api:unauthorized', handleUnauthorized);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    setIsAuthReady(true);

    return () => {
      window.removeEventListener('api:unauthorized', handleUnauthorized);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.clearInterval(syncInterval);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      if (!response.ok) {
        throw new Error(await readAuthError(response));
      }

      const payload = (await response.json()) as AuthApiResponse;
      const apiUser = mapApiUser(payload.data?.user, normalizedEmail, normalizedEmail);

      persistSession(setUser, apiUser, payload.data?.token);
      return apiUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/google/redirect`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(await readAuthError(response));
      }

      const payload = (await response.json()) as AuthApiResponse;
      const redirectUrl = payload.data?.redirect_url;

      if (!redirectUrl) {
        throw new Error('Google redirect URL is unavailable');
      }

      window.location.assign(redirectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const completeGoogleLogin = async (token: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const payloadUser = await fetchCurrentUser(token);
      const apiUser = mapApiUser(payloadUser, payloadUser.email || 'google-user', payloadUser.email || 'Google User');

      persistSession(setUser, apiUser, token);
      return apiUser;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          password_confirmation: password,
          name,
        }),
      });

      if (!response.ok) {
        throw new Error(await readAuthError(response));
      }

      const payload = (await response.json()) as AuthApiResponse;
      const apiUser = mapApiUser(payload.data?.user, email, name);

      persistSession(setUser, apiUser, payload.data?.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Revoke token on the backend (fire-and-forget)
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }).catch(() => { /* ignore network errors during logout */ });
    }
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('bookmarks_cache');
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorMessage = await readAuthError(response);
        throw new Error(errorMessage || 'Failed to send password reset email.');
      }

      const body = await response.json().catch(() => ({})) as {
        success?: boolean;
        message?: string;
        warning?: string | null;
      };

      if (body.success === false) {
        throw new Error(body.message ?? 'Failed to send password reset email.');
      }

      return {
        message: body.message ?? 'Password reset link has been sent.',
        warning: body.warning ?? null,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset email.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    await syncSessionUser();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthReady,
        error,
        login,
        loginWithGoogle,
        completeGoogleLogin,
        signup,
        logout,
        resetPassword,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
