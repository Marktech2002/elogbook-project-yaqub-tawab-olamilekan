import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase/client';
import type { UserProfile, UserRole } from '../types/database.types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in development mock mode
  const isMockMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Mock user profile for development
  const mockUserProfile: UserProfile = {
    id: 'mock-user-id',
    role: 'student',
    first_name: 'Yaqub',
    middle_name: 'Tawab',
    last_name: 'Onigemo',
    phone_number: '+234 801 234 5678',
    metric_no: 'STU/2023/0001',
    department: 'Computer Science',
    level: '300 Level',
    school_id: '1',
    industry_id: '1',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Fetch user profile from database
  const fetchProfile = async (userId: string) => {
    try {
      console.log(`[fetchProfile] Starting for user ID: ${userId}`);
      
      if (isMockMode) {
        console.log('[fetchProfile] Using mock profile in development mode');
        setProfile(mockUserProfile);
        return;
      }

      // Add a longer timeout for profile fetch to prevent premature timeouts
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 8000);
      });

      console.log('[fetchProfile] Making database query...');
      
      // Don't use single() here to avoid hanging when no profile is found
      const fetchPromise = supabase
        .from('user_profile')
        .select('*')
        .eq('id', userId);

      const { data, error, status } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      console.log(`[fetchProfile] Query completed. Status: ${status}, Error: ${error?.message || 'none'}`);
      
      if (error) {
        console.error(`[fetchProfile] Supabase error:`, error.message);
        // Don't set profile to null here, keep existing profile if any
        return;
      }

      if (data && data.length > 0) {
        console.log('[fetchProfile] Profile data fetched successfully:', data[0]);
        // Store the profile in localStorage as a backup
        try {
          localStorage.setItem('user_profile', JSON.stringify(data[0]));
        } catch (e) {
          console.warn('[fetchProfile] Failed to cache profile in localStorage:', e);
        }
        setProfile(data[0]);
      } else {
        console.warn('[fetchProfile] No profile data found for this user.');
        // Check if we have a cached profile in localStorage
        try {
          const cachedProfile = localStorage.getItem('user_profile');
          if (cachedProfile) {
            const parsedProfile = JSON.parse(cachedProfile);
            if (parsedProfile.id === userId) {
              console.log('[fetchProfile] Using cached profile from localStorage');
              setProfile(parsedProfile);
              return;
            }
          }
        } catch (e) {
          console.warn('[fetchProfile] Error accessing localStorage:', e);
        }
        setProfile(null);
      }
    } catch (err) {
      console.error('[fetchProfile] Error:', err);
      
      // Try to use cached profile if available
      try {
        const cachedProfile = localStorage.getItem('user_profile');
        if (cachedProfile) {
          const parsedProfile = JSON.parse(cachedProfile);
          if (parsedProfile.id === userId) {
            console.log('[fetchProfile] Using cached profile from localStorage after error');
            setProfile(parsedProfile);
            return;
          }
        }
      } catch (e) {
        console.warn('[fetchProfile] Error accessing localStorage:', e);
      }
      
      // Only set to null if we couldn't recover from cache
      setProfile(null);
    } finally {
      console.log('[fetchProfile] Completed');
    }
  };

  // Initialize auth state
  useEffect(() => {
    console.log('[Auth] Initializing auth state...');
    
    let mounted = true;

    const initAuth = async () => {
      try {
        if (isMockMode) {
          console.log('[Auth] Mock mode detected - setting up mock state');
          // In mock mode, start with no user
          setUser(null);
          setSession(null);
          setProfile(null);
          setIsLoading(false);
          return;
        }

        // First check if we have a cached profile to show immediately
        try {
          const cachedProfile = localStorage.getItem('user_profile');
          if (cachedProfile && mounted) {
            console.log('[Auth] Found cached profile in localStorage, using it immediately');
            const parsedProfile = JSON.parse(cachedProfile);
            setProfile(parsedProfile);
            // Reduce loading time by setting isLoading to false earlier if we have cached data
            setIsLoading(false);
          }
        } catch (e) {
          console.warn('[Auth] Error accessing localStorage for cached profile:', e);
        }

        // Get the initial session
        console.log('[Auth] Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Error getting session:', error);
          throw error;
        }

        if (!mounted) return;

        console.log('[Auth] Initial session:', session ? 'exists' : 'none');
        
        setUser(session?.user ?? null);
        setSession(session);

        if (session?.user) {
          // Don't wait for profile fetch to complete before setting isLoading to false
          // This will make the UI responsive while profile loads in the background
          if (isLoading) setIsLoading(false);
          
          console.log('[Auth] Fetching profile for user:', session.user.id);
          fetchProfile(session.user.id).catch(err => {
            console.error('[Auth] Error in background profile fetch:', err);
          });
        } else {
          // Only clear profile if we don't have a session
          setProfile(null);
          // Clear cached profile
          try {
            localStorage.removeItem('user_profile');
          } catch (e) {
            console.warn('[Auth] Error removing cached profile:', e);
          }
          if (isLoading) setIsLoading(false);
        }

      } catch (error) {
        console.error('[Auth] Initialization error:', error);
        if (mounted) {
          setUser(null);
          setSession(null);
          // Don't clear profile here to prevent flashing during refresh
          setError(error instanceof Error ? error.message : 'Failed to initialize auth');
          setIsLoading(false);
        }
      }
    };

    initAuth();

    // Set up the auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log(`[Auth] Auth state changed: ${event}`);
        
        // Skip the initial session event since we handle it above
        if (event === 'INITIAL_SESSION') return;
        
        setUser(session?.user ?? null);
        setSession(session);

        if (session?.user) {
          console.log('[Auth] Fetching profile for auth change:', session.user.id);
          // Don't await this - let it run in the background
          fetchProfile(session.user.id).catch(err => {
            console.error('[Auth] Error in background profile fetch during auth change:', err);
          });
        } else {
          setProfile(null);
          // Clear cached profile on logout
          if (event === 'SIGNED_OUT') {
            try {
              localStorage.removeItem('user_profile');
            } catch (e) {
              console.warn('[Auth] Error removing cached profile:', e);
            }
          }
        }
      }
    );

    return () => {
      console.log('[Auth] Cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Run only once

  // Mock helper functions
  const createMockUser = (email: string = 'user@example.com'): User => ({
    id: 'mock-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email,
    email_confirmed_at: new Date().toISOString(),
    phone: null,
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as unknown as User);

  const createMockSession = (user: User): Session => ({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  } as unknown as Session);

  // Auth functions
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      
      if (isMockMode) {
        console.log('[Auth] Mock login');
        const mockUser = createMockUser(email);
        const mockSession = createMockSession(mockUser);
        setSession(mockSession);
        setUser(mockUser);
        setProfile(mockUserProfile);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const register = async (email: string, password: string) => {
    try {
      setError(null);
      setIsAuthenticating(true);
      
      if (isMockMode) {
        console.log('[Auth] Mock register');
        const mockUser = createMockUser(email);
        const mockSession = createMockSession(mockUser);
        setSession(mockSession);
        setUser(mockUser);
        setProfile(mockUserProfile);
        return { error: null };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      if (isMockMode) {
        console.log('[Auth] Mock logout');
        setSession(null);
        setUser(null);
        setProfile(null);
        // Clear cached profile
        try {
          localStorage.removeItem('user_profile');
        } catch (e) {
          console.warn('[Auth] Error removing cached profile on logout:', e);
        }
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        setError(error.message);
      }
      
      // Clear cached profile regardless of error
      try {
        localStorage.removeItem('user_profile');
      } catch (e) {
        console.warn('[Auth] Error removing cached profile on logout:', e);
      }
      
      // Explicitly clear state
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) return;

      if (isMockMode) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        return;
      }

      const { data, error } = await supabase
        .from('user_profile')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      setProfile(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  const value = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticating,
    error,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}