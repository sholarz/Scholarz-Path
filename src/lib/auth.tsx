import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Load admin emails from environment variable
const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter(Boolean);

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  isPremium: boolean;
  isAdmin: boolean;
  checkVerification: () => Promise<boolean>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUserData = async (u: User | null) => {
    if (u) {
      const userDocRef = doc(db, 'users', u.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (ADMIN_EMAILS.includes(u.email || '') && data.role !== 'admin') {
          await updateDoc(userDocRef, { role: 'admin' });
          setProfile({ ...data, role: 'admin' });
        } else {
          setProfile(data);
        }
      } else {
        const newProfile = {
          uid: u.uid,
          email: u.email,
          displayName: u.displayName,
          role: ADMIN_EMAILS.includes(u.email || '') ? 'admin' : 'free',
          matchCount: 0,
          createdAt: serverTimestamp()
        };
        await setDoc(doc(db, 'users', u.uid), newProfile);
        setProfile({ ...newProfile, createdAt: new Date().toISOString() });
      }
    } else {
      setProfile(null);
    }
  };

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await refreshUserData(u);
      setLoading(false);
    });
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const { user } = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(user, { displayName: name });
    await sendEmailVerification(user);
    
    // Create profile immediately to avoid delay
    const newProfile = {
      uid: user.uid,
      email: user.email,
      displayName: name,
      role: 'free',
      matchCount: 0,
      createdAt: serverTimestamp()
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const checkVerification = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser }); // Force refresh state
      return auth.currentUser.emailVerified;
    }
    return false;
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const isAdmin = profile?.role === 'admin' || ADMIN_EMAILS.includes(user?.email || '');
  const isPremium = profile?.role === 'premium' || isAdmin;

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signIn, 
      signInWithEmail, 
      signUp, 
      resetPassword, 
      checkVerification,
      resendVerification,
      logout, 
      isPremium, 
      isAdmin 
    }}>
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
