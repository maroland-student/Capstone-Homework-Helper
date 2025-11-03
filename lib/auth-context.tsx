import React, { createContext, useContext, useEffect, useState } from 'react';
import { signOut as authSignOut, getSession, useSession } from './auth-client';

interface AuthContextType {
  user: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  hasExplicitlyLoggedIn: boolean;
  setHasExplicitlyLoggedIn: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const [user, setUser] = useState<any | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [hasExplicitlyLoggedIn, setHasExplicitlyLoggedIn] = useState(false);

  // Initialize auth state on mount - only check session once
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's an existing session
        const currentSession = await getSession();
        console.log('Initial session check:', currentSession);
        
        if (currentSession?.data?.user) {
          console.log('Found existing session, setting user');
          setUser(currentSession.data.user);
        } else {
          console.log('No existing session found');
          setUser(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
      } finally {
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Only update user when session changes after initialization
  useEffect(() => {
    if (initialized) {
      if (session?.user) {
        console.log('Session updated with user:', session.user);
        setUser(session.user);
      } else {
        console.log('Session cleared, setting user to null');
        setUser(null);
      }
    }
  }, [session, initialized]);

  const signOut = async () => {
    try {
      console.log('Starting sign out process...');
      
      // Clear user state immediately for instant UI feedback
      setUser(null);
      setHasExplicitlyLoggedIn(false);
      
      // Call the actual sign out
      await authSignOut();
      
      // Force a small delay to ensure the session is cleared
      setTimeout(() => {
        setUser(null);
        setHasExplicitlyLoggedIn(false);
      }, 100);
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if signout fails, clear the local state
      setUser(null);
      setHasExplicitlyLoggedIn(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading: isPending || !initialized, 
      signOut,
      hasExplicitlyLoggedIn,
      setHasExplicitlyLoggedIn
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