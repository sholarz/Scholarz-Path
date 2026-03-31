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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string) => Promise<void>;
  upgradeToPremium: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login - in production, this would call your auth API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if admin email
    const isAdmin = email.toLowerCase() === 'admin@scholarpath.com';
    
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      role: isAdmin ? 'admin' : 'free',
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const loginWithGoogle = async () => {
    // Mock Google login - in production, this would use Google OAuth
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: '1',
      email: 'user@gmail.com',
      name: 'Google User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=GoogleUser',
      role: 'free',
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock signup - in production, this would call your auth API
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      role: 'free',
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const resetPassword = async (email: string) => {
    // Mock password reset - in production, this would send a reset email
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const upgradeToPremium = () => {
    if (user) {
      const updatedUser = { ...user, role: 'premium' as UserRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
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