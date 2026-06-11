import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged } from 'firebase/auth';
import {
  ref,
  get,
  set,
  update,
} from 'firebase/database';
import { auth, db } from '../lib/firebase';

const getAuthErrorMessage = (error: unknown): Error => {
  if (typeof error === 'object' && error !== null) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed' || err.message?.includes('CONFIGURATION_NOT_FOUND')) {
      return new Error('Firebase Authentication configuration is missing. Enable Authentication and Email/Password sign-in in Firebase Console, and add your local domain under Authorized domains.');
    }
    if (err.code === 'auth/invalid-api-key') {
      return new Error('The Firebase API key is invalid or does not match the Firebase project. Check your environment variables.');
    }
    if (typeof err.message === 'string' && err.message.length > 0) {
      return new Error(err.message);
    }
  }
  return new Error('An unexpected Firebase authentication error occurred.');
};

interface UserProfile {
    id: string;
    email: string;
    full_name: string;
    role: 'admin' | 'teacher';
    employee_id: string | null;
    whatsapp_number: string | null;
    avatar_url: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: UserProfile | null;
    authUser: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string, fullName: string, role?: 'admin' | 'teacher', employeeId?: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
    isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (uid: string): Promise<UserProfile | null> => {
    try {
      const userRef = ref(db, `users/${uid}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        return { id: userSnap.key, ...(userSnap.val() as any) } as UserProfile;
      }
      return null;
    } catch (e) {
      console.error('fetchUserProfile error', e);
      return null;
    }
  }, []);

  const createProfileIfMissing = useCallback(async (u: User): Promise<UserProfile | null> => {
    const existing = await fetchUserProfile(u.uid);
    if (existing) return existing;
    const profile: UserProfile = {
      id: u.uid,
      email: u.email || '',
      full_name: u.email ? u.email.split('@')[0] : 'New User',
      role: 'teacher',
      employee_id: null,
      whatsapp_number: null,
      avatar_url: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    try {
      await set(ref(db, `users/${u.uid}`), profile);
      return profile;
    } catch (e) {
      console.error('createProfileIfMissing error', e);
      return null;
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setAuthUser(currentUser);
        let profile = await fetchUserProfile(currentUser.uid);
        if (!profile) {
          profile = await createProfileIfMissing(currentUser);
        }
        setUser(profile);
      } else {
        setAuthUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserProfile, createProfileIfMissing]);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const current = credential.user;
      let profile = await fetchUserProfile(current.uid);
      if (!profile) profile = await createProfileIfMissing(current);
      setAuthUser(current);
      setUser(profile);
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('signIn error', error);
      setLoading(false);
      return { error: getAuthErrorMessage(error) };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'admin' | 'teacher' = 'teacher', employeeId?: string) => {
    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      const u = credential.user;
      const profile: UserProfile = {
        id: u.uid,
        email: email.toLowerCase().trim(),
        full_name: fullName,
        role,
        employee_id: employeeId || null,
        whatsapp_number: null,
        avatar_url: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await set(ref(db, `users/${u.uid}`), profile);
      setAuthUser(u);
      setUser(profile);
      setLoading(false);
      return { error: null };
    } catch (error) {
      console.error('signUp error', error);
      setLoading(false);
      return { error: getAuthErrorMessage(error) };
    }
  };

  const signOut = async () => {
    setLoading(true);
    await firebaseSignOut(auth);
    setUser(null);
    setAuthUser(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: new Error('No user logged in') };
    try {
      const userRef = ref(db, `users/${user.id}`);
      const updatesWithTimestamp = { ...updates, updated_at: new Date().toISOString() };
      await update(userRef, updatesWithTimestamp as any);
      setUser(prev => prev ? { ...prev, ...updatesWithTimestamp } : null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const value: AuthContextType = {
    user,
    authUser,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    isAdmin: !!user && user.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

