// Auth Context for managing user authentication state
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'premium' | 'free';

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
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleLogin: (token: string) => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  upgradeToPremium: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = ((import.meta as ImportMeta & {
  env?: { VITE_API_BASE_URL?: string };
}).env?.VITE_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

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

    if (body?.errors && typeof body.errors === 'object') {
      const firstFieldErrors = Object.values(body.errors).find((messages) => Array.isArray(messages) && messages.length > 0);
      if (firstFieldErrors && firstFieldErrors[0]) {
        return firstFieldErrors[0];
      }
    }

    if (body?.error?.message) {
      return body.error.message;
    }

    if (body?.error?.details && typeof body.error.details === 'object') {
      const detailErrors = Object.values(body.error.details as Record<string, unknown>).find(
        (messages) => Array.isArray(messages) && messages.length > 0 && typeof messages[0] === 'string'
      ) as string[] | undefined;

      if (detailErrors?.[0]) {
        return detailErrors[0];
      }
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

// Mock test accounts
const TEST_ACCOUNTS = {
  'admin@scholarpath.com': { password: 'admin123', role: 'admin' as UserRole, name: 'Admin User' },
  'premium@test.com': { password: 'premium123', role: 'premium' as UserRole, name: 'Premium User' },
  'user@test.com': { password: 'user123', role: 'free' as UserRole, name: 'Free User' },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(await readAuthError(response));
      }

      const payload = (await response.json()) as AuthApiResponse;
      const apiUser = mapApiUser(payload.data?.user, email, TEST_ACCOUNTS[email.toLowerCase() as keyof typeof TEST_ACCOUNTS]?.name || email);

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
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
  };

  const upgradeToPremium = () => {
    if (user) {
      const updatedUser = { ...user, role: 'premium' as UserRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
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
        error,
        login,
        loginWithGoogle,
        completeGoogleLogin,
        signup,
        logout,
        resetPassword,
        upgradeToPremium,
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
