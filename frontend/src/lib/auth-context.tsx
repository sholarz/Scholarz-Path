// Auth Context for managing user authentication state
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  requestPasswordReset,
  getGoogleRedirectUrl,
} from '../api/auth';
import { getCurrentUser } from '../api/user';
import { getStoredToken, setStoredToken } from '../api/client';

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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'user';

const buildDisplayName = (firstName?: string, lastName?: string, email?: string) => {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (fullName) {
    return fullName;
  }

  if (email) {
    return email.split('@')[0] || email;
  }

  return 'User';
};

const mapApiUser = (apiUser: {
  id: string;
  email: string;
  role: UserRole;
  profile?: { first_name?: string; last_name?: string } | null;
}): User => {
  return {
    id: apiUser.id,
    email: apiUser.email,
    role: apiUser.role,
    name: buildDisplayName(apiUser.profile?.first_name, apiUser.profile?.last_name, apiUser.email),
  };
};

const persistUser = (nextUser: User | null) => {
  if (nextUser) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      persistUser(null);
      return;
    }

    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(null);
      }
    }

    getCurrentUser()
      .then((currentUser) => {
        const mappedUser = mapApiUser(currentUser);
        setUser(mappedUser);
        persistUser(mappedUser);
      })
      .catch(() => {
        setStoredToken(null);
        setUser(null);
        persistUser(null);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const authResponse = await loginRequest(email, password);
    setStoredToken(authResponse.token);

    const mappedUser = mapApiUser(authResponse.user);
    setUser(mappedUser);
    persistUser(mappedUser);
  };

  const loginWithGoogle = async () => {
    const redirectUrl = await getGoogleRedirectUrl();
    window.location.assign(redirectUrl);
  };

  const signup = async (email: string, password: string, name: string) => {
    const authResponse = await registerRequest({
      email,
      password,
      password_confirmation: password,
      name,
    });

    setStoredToken(authResponse.token);

    const mappedUser = mapApiUser(authResponse.user);
    setUser(mappedUser);
    persistUser(mappedUser);
  };

  const logout = () => {
    logoutRequest().catch(() => null);
    setStoredToken(null);
    setUser(null);
    persistUser(null);
  };

  const resetPassword = async (email: string) => {
    await requestPasswordReset(email);
  };

  const upgradeToPremium = () => {
    if (user) {
      const updatedUser = { ...user, role: 'premium' as UserRole };
      setUser(updatedUser);
      persistUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
        resetPassword,
        upgradeToPremium,
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