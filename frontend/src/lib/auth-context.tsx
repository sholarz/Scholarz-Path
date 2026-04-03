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
  loginWithGoogle: () => Promise<User>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  upgradeToPremium: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check test accounts
      const testAccount = TEST_ACCOUNTS[email.toLowerCase() as keyof typeof TEST_ACCOUNTS];
      
      if (testAccount && testAccount.password === password) {
        // Valid test account
        const mockUser: User = {
          id: Date.now().toString(),
          email,
          name: testAccount.name,
          role: testAccount.role,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${testAccount.name}`,
        };
        
        setUser(mockUser);
        localStorage.setItem('user', JSON.stringify(mockUser));
        return mockUser;
      } else {
        // Invalid credentials
        throw new Error('Invalid email or password');
      }
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
      // Simulate Google OAuth delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: Date.now().toString(),
        email: 'user@gmail.com',
        name: 'Google User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser',
        role: 'free',
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      return mockUser;
    } catch (err) {
      setError('Google login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role: 'free',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    } catch (err) {
      setError('Signup failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    setError(null);
    
    // Mock password reset - in production, this would send a reset email
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